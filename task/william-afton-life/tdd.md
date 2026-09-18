# William Afton life TDD Contract

## 1. Scope

This file defines the public, portable test contract for the game. It does not define rendering technology, file structure, private state, DOM structure, fixed coordinates, exact wording, or algorithms. Tests may use the contract only to perform player-level actions and read stable user-visible summaries.

The playable contract is a 3D city sandbox with walking, driving, missions, weapons, vendors, wanted pressure, health, death, respawn, HUD feedback, minimap guidance, and active world entities as defined by `game-spec.md` and `design-doc.md`.

## 2. Public Interface

Implementations must expose one public object:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

### Method Semantics

- `reset(options?)` starts a fresh playable session and returns the initial stable `Snapshot`. It may skip noninteractive loading only after the game has reached the same externally playable state a player would reach.
- `getSnapshot()` returns a stable summary of current visible and interactive game state. It must not expose private object graphs, internal function names, raw engine objects, or implementation-only arrays.
- `input(action)` performs a player-level action equivalent to keyboard, mouse, touch, or visible UI interaction. It returns the post-action `Snapshot` after any immediate state update. Held or continuous actions may use duration fields.
- `loadScenario(name, options?)` places the game into a legal precondition state that can occur during normal play. It must not directly award a reward, directly complete a task, directly set victory, directly kill a target, directly create a collision result, directly boost resources, directly reduce health, or directly force death. The expected result must still be triggered by subsequent player-level actions.

All methods must be safe to call repeatedly. Invalid actions return a snapshot with `lastAction.ok === false` or an equivalent rejection result and must not throw uncaught errors.

## 3. Action Schema

Every action has a required `type` string and optional `durationMs` for held inputs. Coordinates, when used, are screen-space values derived from snapshot semantic bounds or from the current playfield geometry, not fixed constants.

| Type | Required / Allowed Fields | Player-Level Meaning |
|---|---|---|
| `start` | none | Dismiss entry/loading if an implementation uses a start affordance, then enter normal city play. |
| `wait` | `durationMs` | Let the world update while preserving current held inputs. |
| `move` | `direction: left|right|up|down|forward|back|none`, `durationMs`, optional `source: keyboard|joystick` | Hold or release walking movement in a player direction. |
| `aim` | `direction: left|right|up|down|forward|back`, optional `durationMs` | Change visible aiming/facing direction while walking. |
| `fire` | `phase: press|release|tap|hold`, optional `durationMs` | Use the firing control in walking mode. |
| `threaten` | `phase: press|release|tap|hold`, optional `durationMs` | Raise weapon/arms without firing. |
| `switchWeapon` | optional `weaponRole: sidearm|rapid|explosive|next` | Select or cycle an owned weapon role. |
| `interact` | optional `target: nearest|npc|vehicle|vendor|pickup|objective` | Use the nearest valid interaction target. |
| `enterVehicle` | optional `target: nearest|objective` | Enter a nearby stopped usable vehicle. |
| `exitVehicle` | none | Leave the currently driven vehicle. |
| `drive` | `control: accelerate|brake|reverse|left|right|none|joystick`, optional `direction`, `durationMs` | Hold, release, or joystick-drive vehicle controls. |
| `openPanel` | `panel: shop|dialogue|map|objective` | Open a visible panel when the player is at a valid target. |
| `closePanel` | `panel: shop|dialogue|map|objective|current` | Close or resolve a visible panel when closing is available. |
| `dialogue` | `choice: next|accept|decline|close` | Advance or choose in a dialogue/task panel. |
| `buy` | `itemRole: weapon|ammo|health|taskItem`, optional `weaponRole` | Buy an item currently available from an open vendor panel. |
| `collect` | `target: nearest|cash|health|ammo|objectiveItem` | Pick up a visible nearby collectible. |
| `respawn` | none | Use the visible respawn path after death. |

## 4. Scenario Schema

Scenarios are deterministic legal preconditions for tests that would otherwise require long navigation. Each scenario must return a `Snapshot` that names the scenario and exposes the semantic trigger points needed for subsequent actions.

| Scenario | Legal Precondition | Required Player Trigger For Result |
|---|---|---|
| `fresh_city` | Playable city after loading, walking mode, HUD/minimap visible, no blocking panel. | `move`, `interact`, `openPanel`, `fire`, or `enterVehicle` depending on target proximity. |
| `near_blocking_obstacle` | Walking near a building, boundary, water, vehicle, or other obstacle while still having at least one passable direction. | Held `move` toward and along the obstacle must show blocking or sliding; opposite/passable movement remains possible. |
| `near_vehicle` | Walking near a stopped usable vehicle, not already driving. | `enterVehicle` or `interact target: vehicle` must enter driving mode; `exitVehicle` must return to walking. |
| `driving_open_road` | Already driving a usable vehicle on a navigable road with room to accelerate, brake, reverse, and turn. This represents a state reachable by first entering a vehicle. | `drive` actions must change vehicle motion and mode-visible state; collision results still require driving into a risk target. |
| `driving_near_collision_risk` | Driving near a visible obstacle, vehicle, or NPC with enough space for the player to steer into or away from it. | `drive` toward the risk must produce collision/risk feedback; steering away must avoid or reduce the result. |
| `armed_near_target` | Walking with an owned weapon and available ammo near a valid non-player target. The target is alive and the player has not already fired the test shot. | `aim` then `fire` must consume ammo and create shot/target/wanted feedback. |
| `armed_no_ammo` | Walking with the selected owned weapon empty and a visible firing control. | `fire` must be rejected as an effective shot and preserve target/combat outcomes. |
| `active_talk_objective_near_target` | A talk objective is active and the player is near the objective NPC or location but the objective is not completed. | `interact` or `dialogue` must advance or complete the talk step. |
| `active_delivery_pickup_near_item` | A delivery objective is active and the player is near the pickup/source item or source target without already carrying the item. | `collect` or `interact` must add carrying/progress state without completing the drop-off. |
| `active_delivery_dropoff_with_item` | A delivery objective is active, the required item has been acquired through the pickup step, and the player is near the drop-off target. | `interact` or standing/waiting in the target zone must complete the delivery. |
| `active_buy_objective_near_vendor` | A buy objective is active and the player is near the required vendor; the shop is not already open. The snapshot must state whether cash previously earned through normal play is enough or insufficient for the task item. | `openPanel shop` then `buy itemRole: taskItem` must succeed with enough cash and be rejected with insufficient cash. |
| `active_vehicle_objective_near_vehicle` | A steal/deliver vehicle objective is active and the player is near the target vehicle, which has not already been delivered. | `enterVehicle`, driving, and target-zone actions must trigger vehicle objective progress. |
| `active_kill_objective_near_target` | A kill objective is active; the target is alive and reachable; the player has an owned weapon with ammo or a usable vehicle path. | `aim` plus `fire`, or driving collision where valid, must affect the target and objective state. |
| `near_vendor_with_cash` | Walking near a vendor with enough cash for at least one visible item. | `openPanel shop` then `buy` must spend cash and apply item/resource effects. |
| `near_vendor_low_cash` | Walking near a vendor with less cash than at least one visible item, without negative resources. | `openPanel shop` then `buy` must be rejected without negative cash or false item gain. |
| `wanted_pressure_active` | The player is alive in the city with wanted pressure already active from prior valid hostility and police risk visible or approaching. | `wait`, flee, or movement actions must show pursuit/risk behavior; police damage must require time/contact/projectiles, not scenario load. |
| `damage_risk_active` | The player is alive near a visible damaging risk such as police fire, collision path, explosion threat, or hostile target. | `wait`, movement, or driving into danger must reduce health or lead to death; `respawn` is only valid after death is reached. |
| `shop_open` | A shop panel is open because the player opened it near a valid vendor. | `buy` or `closePanel shop` must update resources or restore playfield control. |
| `dialogue_open` | A dialogue/task panel is open because the player interacted with a valid NPC or task entry. | `dialogue next|accept|close` must advance/close the panel and restore allowed controls. |

No scenario may start with the postcondition already applied. For example, an objective-completion scenario must not load with the objective completed; a combat scenario must not load with the target already dead; a vendor scenario must not load with the item already purchased; a death/respawn test must cause death through a declared danger before using `respawn`.

## 5. Snapshot Schema

`Snapshot` is a stable, public summary. Implementations may include extra public fields, but tests rely only on the following contract fields.

```typescript
type Snapshot = {
  ok: boolean,
  phase: "loading" | "playing" | "paused" | "dialogue" | "shop" | "death" | "result",
  mode: "walking" | "driving" | "blocked" | "none",
  scenario?: string,
  canInteractWithPlayfield: boolean,
  overlayBlocking: boolean,
  activePanel: "none" | "dialogue" | "shop" | "map" | "objective" | "death",
  controls: {
    movement: boolean,
    aim: boolean,
    fire: boolean,
    threaten: boolean,
    drive: boolean,
    interact: boolean,
    shop: boolean,
    respawn: boolean
  },
  playfield: {
    ready: boolean,
    visible: boolean,
    nonBlank: boolean,
    bounds?: Bounds,
    renderRevision: number
  },
  hud: {
    visible: boolean,
    health: number,
    cash: number,
    ammo: number,
    weaponRole: "none" | "sidearm" | "rapid" | "explosive",
    wantedLevel: number,
    objectiveVisible: boolean,
    feedbackKind: "none" | "positive" | "negative" | "damage" | "purchase" | "objective" | "combat"
  },
  minimap: {
    visible: boolean,
    playerVisible: boolean,
    markerCount: number,
    expanded?: boolean
  },
  player: {
    alive: boolean,
    screenX?: number,
    screenY?: number,
    position?: PublicPosition,
    motionState: "idle" | "moving" | "blocked" | "sliding" | "knockback" | "hidden",
    facing?: DirectionSummary,
    velocity?: PublicVelocity
  },
  vehicle: {
    inVehicle: boolean,
    screenX?: number,
    screenY?: number,
    speed: number,
    motionState: "none" | "idle" | "accelerating" | "coasting" | "braking" | "reversing" | "turning" | "colliding" | "destroyed",
    controlled: boolean
  },
  combat: {
    aiming: boolean,
    firing: boolean,
    threatening: boolean,
    projectileCount: number,
    shotRevision: number,
    hitRevision: number,
    recoilRevision: number,
    targetStatus?: "none" | "alive" | "hit" | "defeated" | "destroyed"
  },
  mission: {
    active: boolean,
    type: "none" | "talk" | "delivery" | "buy" | "stealVehicle" | "kill" | "arrive",
    progress: "none" | "started" | "carrying" | "inVehicle" | "atTarget" | "completed",
    rewardRevision: number,
    objectiveRevision: number,
    targetDistance?: number,
    guidanceVisible: boolean
  },
  shop: {
    open: boolean,
    itemRoles: Array<"weapon" | "ammo" | "health" | "taskItem">,
    affordableItemCount: number,
    lastPurchase: "none" | "success" | "rejected"
  },
  world: {
    npcCount: number,
    vehicleCount: number,
    policeCount: number,
    pickupCount: number,
    vendorCount: number,
    projectileCount: number,
    explosionRevision: number,
    trafficRevision: number,
    npcReactionRevision: number,
    policeThreatRevision: number
  },
  result: {
    status: "none" | "dead" | "respawned",
    terminal: boolean
  },
  lastAction: {
    ok: boolean,
    type?: string,
    reason?: "invalidAction" | "blockedByMode" | "notEnoughCash" | "noAmmo" | "notOwned" | "notNearTarget" | "notAvailable" | "cooldown" | "terminal" | "none"
  }
}
```

### Supporting Types

```typescript
type Bounds = { left: number, top: number, width: number, height: number };
type PublicPosition = { x: number, z: number };
type PublicVelocity = { x?: number, z?: number, speed?: number };
type DirectionSummary = "left" | "right" | "up" | "down" | "forward" | "back" | "none";
```

### Field Rules

- `hud.health` is normalized from `0` to `100`.
- `hud.cash`, `hud.ammo`, entity counts, revisions, and distances are nonnegative.
- `hud.wantedLevel` is an integer from `0` to `5` or an equivalent capped public scale.
- Revision fields increase only when the named visible/gameplay category changes.
- `playfield.renderRevision` may change due to animation, but action checks must pair it with a relevant state delta or visible postcondition.
- `screenX`/`screenY` and `bounds` are semantic observations for adaptive input. They must be viewport/screen coordinates that browser pointer/touch events can use directly after the current layout, scroll, device-pixel-ratio, and canvas scaling are applied. They do not require a specific layout, but they must not be unscaled canvas-internal or world coordinates.
- `canInteractWithPlayfield` must be false when loading, dialogue, shop, death, or another blocking panel prevents main-scene actions.

## 6. External Postconditions

The public snapshot must correspond to what a player can observe.

- When `phase === "playing"` and `overlayBlocking === false`, the main playfield must be visible, nonblank, and able to receive appropriate player input.
- HUD values for health, cash, weapon/ammo, wanted pressure, and objective state must update after the corresponding visible action.
- Opening dialogue, shop, loading, or death UI must block incompatible main-scene controls. Closing or resolving the panel must restore the correct controls.
- Combat actions must have both state evidence and visible gameplay evidence: ammo, shot/projectile revision, firing posture/recoil/target/wanted feedback, or equivalent public summaries.
- Driving actions must have both state evidence and visible gameplay evidence: driving mode, vehicle speed/motion state, screen-space vehicle/player change, collision/risk feedback, or exit/restored walking state.
- Mission completion must include objective progress change plus reward or next-objective/free-roam evidence. A scenario cannot satisfy this before the triggering player action.
- Vendor purchases must update resources on success and preserve resources on rejection, with shop feedback visible through `hud.feedbackKind`, `shop.lastPurchase`, or equivalent public status.
- Death must make `result.terminal === true`, `phase === "death"`, and block movement, fire, driving, shop purchases, and objective advancement until `respawn`.
- Respawn must restore playable walking state, positive health, no death overlay, main controls, and cleared active hostility/wanted pressure according to the design requirements.

## 7. Feature Contract Matrix

| GDD Feature | Contract Input | Snapshot / External Output | Required Postcondition |
|---|---|---|---|
| M0 Boot to playable city | `reset`, `start` | `phase`, `playfield`, `hud`, `minimap`, `canInteractWithPlayfield` | Playable city is visible, nonblank, HUD/minimap are visible, and no permanent blocking overlay remains. |
| M1 Mode gating | `openPanel`, `closePanel`, `enterVehicle`, `exitVehicle`, death-triggering danger, `respawn` | `phase`, `mode`, `activePanel`, `overlayBlocking`, `controls` | Available actions match current mode; blocked modes reject incompatible actions without gameplay mutation. |
| M2 State feedback | `fire`, `buy`, `collect`, damage-triggering actions, wanted-triggering actions | `hud`, `combat`, `shop`, `world`, `result` | HUD/resource/objective feedback changes after the relevant action and stays synchronized with snapshot state. |
| M3 Walking exploration | `move`, `wait` in `fresh_city` or `near_blocking_obstacle` | `player.motionState`, `player.position`, `screenX/screenY`, `playfield.renderRevision` | Held movement changes visible player state; release stops movement; obstacles block or slide rather than allowing traversal. |
| M4 Aiming and shooting | `aim`, `fire`, `switchWeapon`, `threaten` in armed scenarios | `combat`, `hud.ammo`, `hud.weaponRole`, `world.projectileCount`, `hud.wantedLevel` | Firing consumes ammo and creates shot feedback; aim direction affects visible shot/facing summary; no ammo/unowned/wrong mode is rejected. |
| M5 Vehicle theft and driving | `enterVehicle`, `drive`, `exitVehicle` in vehicle scenarios | `mode`, `vehicle`, `player.motionState`, `controls`, `world.trafficRevision` | Entering transfers control to vehicle; acceleration/brake/reverse/turn are continuous; exit restores walking near the vehicle. |
| M6 Mission chain | `interact`, `collect`, `buy`, `enterVehicle`, `drive`, `fire`, `wait` in active objective scenarios | `mission`, `hud.cash`, `hud.feedbackKind`, `world` | Valid task action completes or advances objective and rewards; unmet conditions preserve active objective and give rejection/feedback. |
| M7 Economy and vendors | `openPanel shop`, `buy`, `closePanel shop` | `phase`, `shop`, `hud.cash`, `hud.health`, `hud.ammo`, `hud.weaponRole`, `controls` | Shop blocks main play; valid buy spends cash and applies effect; invalid buy cannot create negative cash or false ownership/progress. |
| M8 Wanted and police risk | hostile `fire`, harmful driving collision, `wait` under wanted pressure | `hud.wantedLevel`, `world.policeCount`, `world.policeThreatRevision`, `hud.health` | Hostile acts raise wanted pressure; police risk becomes visible and can reduce health through subsequent danger. |
| M9 Health, death, respawn | damage-risk actions, then `respawn` | `hud.health`, `phase`, `result`, `controls`, `hud.wantedLevel` | Damage can lead to death; death locks main actions; respawn restores walking play and clears death/wanted pressure. |
| M10 Living city feedback | `wait`, `move`, `interact`, `fire`, `drive` | `world` counts/revisions, `minimap.markerCount`, target/player screen summaries | NPCs, cars, police, vendors, pickups, projectiles, explosions, and minimap markers are observable and respond to relevant actions. |
| M11-M16 P2 depth | Same player-level actions when optional systems exist | Optional progress, persistence, landmark, extended police/combat/story summaries | Optional depth must not weaken P1 contracts or break core resource, mission, death, and input invariants. |

## 8. Rejection And Invariants

- Invalid or blocked actions must not throw and must report rejection through `lastAction`.
- Main-scene movement, firing, driving, shopping, and task advancement are rejected while loading, dialogue, shop, death, or other blocking panels are active.
- Cash cannot become negative. Failed purchases must not grant items, ammo, healing, task progress, or ownership.
- Ammo cannot become negative. Firing with no ammo must not create an effective projectile, hit, or kill result.
- Switching to an unowned weapon role must be rejected without changing the active usable weapon.
- Walking-only combat must be rejected or disabled while driving.
- Driving-only controls must be rejected while walking except for entering a vehicle through valid interaction.
- Terminal death state must reject movement, firing, driving, purchasing, and mission completion until respawn.
- Mission rewards are awarded only after the required player action satisfies the active objective condition.
- Scenario setup must not apply the result that the test is meant to trigger.

## 9. Anti-Cheat Contract Rules

Tests and implementations must treat `window.__gameTest` as a public player-action adapter, not a backdoor.

- No action may directly set score, cash, health, wanted level, mission completion, target death, collision result, pickup result, purchase result, vehicle delivery, or respawn result except by performing the corresponding player-level action chain.
- `loadScenario` may position the player near a valid target or open a panel only when that state can be reached through normal play; it may not pre-apply the expected reward, damage, death, hit, pickup, or completion.
- Snapshots must summarize public state only. They must not expose raw scene objects, private arrays, implementation-specific names, source asset names, CSS selectors, or internal timing constants.
- Passing behavior must come from `trigger -> observable result`, not from static text, fixed values, element existence, or `{ ok: true }` alone.
