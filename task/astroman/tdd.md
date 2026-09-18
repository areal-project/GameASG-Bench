# AstroMan TDD

## Public Test Contract

The target implementation should expose a public semantic interface:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  getSnapshot(): Snapshot,
  input(action): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

These interfaces represent player-level actions and state summaries, not access to internal objects. `loadScenario` may only construct valid prerequisite states, such as “near a vehicle”, “near a shop”, “one step before quest completion”, “low health”, or “target ahead”; it must not directly grant victory, quest completion, rewards, kills, successful purchases, or death results.

## Action Schema

`input(action)` supports the following player semantics:

| type | Fields | Postconditions |
|---|---|---|
| `key` | `code`, `state: down|up|tap`, `durationMs?` | Equivalent to keyboard input and affects movement, throttle, view, powers, and interaction |
| `pointer` | `target: playfield|ability|power:<id>|shopItem:<id>|restart|interact|vehicleEnter|vehicleExit`, `event: tap|down|up` | Equivalent to clicking/holding/releasing a visible control |
| `drag` | `target: movementJoystick|throttle|aim`, `from:{screenX,screenY}`, `to:{screenX,screenY}`, `durationMs?` | Equivalent to a touch drag; movement/throttle/aim direction should be visible |
| `switchPower` | `power: heat|breath|frost` | Switches the current power and updates the HUD |
| `interact` | `kind: npc|vehicle|shop|quest` | Triggers a nearby interactable object |
| `questAction` | `action: accept|performObjective|deliver|rescue|neutralize|returnTarget|waitForTimer`, `target?: current|nearest|marked` | Equivalent to the player performing an objective action in the current quest prerequisite state; it must not grant quest completion or a reward directly, as rewards may only be produced by quest rules after the objective action |
| `hazard` | `kind: policeShot|explosion|collision|questFailure`, `severity?: light|fatal` | Equivalent to the player taking visible damage or encountering a quest-failure event in a valid hazardous situation; a fatal hazard in a low-health situation should enter the result/death state |
| `pickup` | `kind: cash|ammo|questItem|wantedReducer` | Equivalent to the player approaching or touching a collectible; updates the corresponding resource, quest, or wanted state and produces visible feedback |
| `weapon` | `action: equip|fire|holdUp|release`, `weapon?: pistol|uzi|rocket|blaster`, `target?: nearest|front|none`, `durationMs?` | Equivalent to the player raising/firing a weapon through a visible weapon control or key; when the player owns the weapon and has ammunition, it consumes ammunition and produces projectile/hit/recoil feedback |
| `minimap` | `action: toggleZoom|open|close` | Equivalent to using a click/gesture to adjust the minimap; the minimap size/mode changes while key markers remain visible |
| `closePanel` | `panel?: dialog|shop|tutorial|result` | Closes or advances an overlay |
| `restart` | None | Returns from death/results to a playable state |

An invalid action, unknown power, purchase with insufficient resources, unavailable ammunition or duplicate purchase of a non-repeatable item, vehicle entry when no vehicle is present, restart outside the end state, power use after the end state, pickup when no corresponding collectible is present, or wanted reduction when there is no wanted level must return `ok:false` or be reflected in `lastRejected.reason` in the snapshot, and core state must remain unchanged.

## Scenario Schema

`loadScenario(name, options?)` supports the following valid prerequisite situations:

| name | Prerequisite semantics |
|---|---|
| `openStreet` | A playable block where the player can move, fly, switch views, and use powers; quest/death/shop results must not already be complete |
| `targetAhead` | An NPC, vehicle, or quest target is in front of the controlled entity and has not yet been hit, frozen, pushed, or destroyed |
| `nearVehicle` | The player is on foot and near an enterable vehicle but has not entered driving mode |
| `questReady` | A quest objective is available to start or advance; after loading, the quest must not already be complete and rewards must not have been granted |
| `timedQuestReady` | A timed quest is in a playable prerequisite state; after loading, it must not already be timed out or complete, and rewards must not have been granted |
| `shopWithFunds` | The player is near a shop and has enough resources to purchase at least one item; the purchase has not been completed |
| `shopInsufficientFunds` | The player is near a shop but does not have enough resources to purchase the specified expensive item |
| `shopUnavailableAmmo` | The player is near a shop and some ammunition or non-repeatable item is currently unavailable; attempting to purchase it should be rejected or refunded |
| `pickupReady` | Cash, ammunition, or a quest item is within collectible range nearby and has not yet been collected |
| `weaponReady` | The player is in a playable state, owns at least one ranged weapon with ammunition, and has a hittable NPC, vehicle, or quest target ahead; after loading, the weapon must not already have fired or hit, and ammunition must not have been consumed |
| `weaponEmpty` | The player is in a playable state and owns a ranged weapon, but its corresponding ammunition is 0; firing should be rejected or produce only empty-weapon feedback and must not generate a valid projectile |
| `wantedPickupReady` | A wanted-reducing pickup is within collectible range nearby; `options.wanted` can specify a valid initial wanted value |
| `lowHealth` | The player is in a playable low-health state where the next hazardous event can defeat them and has not yet entered the end state |

## Snapshot Schema

`Snapshot` includes at least:

```javascript
{
  ok: true,
  phase: "loading|playing|paused|dialog|shop|result",
  mode: "walking|flying|driving|dead",
  screen: "loading|play|dialog|shop|result",
  overlayBlocking: false,
  canInteractWithPlayfield: true,
  playfield: { bounds: { left, top, width, height }, readable3D: true, renderRevision: number },
  player: {
    screenX: number, screenY: number,
    worldX?: number, worldY?: number, worldZ?: number,
    altitude: number,
    facingScreenX?: number, facingScreenY?: number,
    health: number
  },
  vehicle: { inVehicle: boolean, screenX?: number, screenY?: number, speed?: number },
  camera: { mode: "thirdPerson|firstPerson", zoom?: number },
  powers: {
    current: "heat|breath|frost",
    active: boolean,
    effectVisible: boolean,
    lastEffectDirection?: { screenDX: number, screenDY: number },
    affectedCounts?: { npc: number, vehicle: number, frozen: number, pushed: number, destroyed: number }
  },
  weapons: {
    current?: string,
    owned?: string[],
    ammo?: Record<string, { current: number, max?: number }>,
    lastFired?: boolean,
    lastEmpty?: boolean,
    firedCount?: number,
    hitCount?: number,
    lastPurchased?: string,
    lastRefunded?: boolean
  },
  hud: { score: number, reputation: number, cash: number, wanted: number, questTitle?: string, healthVisible: boolean },
  quest: { active: boolean, status: "none|active|complete|failed", progress: number, timeRemaining?: number, targetVisible: boolean },
  economy: { cash: number, inventoryCount: number, ownedItems: string[] },
  pickups: { cash?: number, ammo?: number, questItems?: number, wantedReducers?: number, lastCollected?: "none|cash|ammo|questItem|wantedReducer" },
  minimap: { visible: boolean, expanded: boolean, markers: { player: boolean, questTarget?: boolean, shop?: boolean, pickup?: boolean, vehicle?: boolean } },
  entities: { npc: number, vehicles: number, movingNpcs?: number, movingVehicles?: number, projectiles?: number, particles?: number, worldMotionRevision?: number },
  panels: { active: "none|dialog|shop|tutorial|result", visibleControls: string[] },
  lastRejected?: { reason: string },
  revision: number
}
```

`player.screenX/screenY`, `vehicle.screenX/screenY`, and `powers.lastEffectDirection.screenDX/screenDY` are screen-space semantics used to verify the direction visible to the player. Left/right input must make this screen evidence change with opposite signs; correctness only in world coordinates is insufficient.

## DOM/HUD/WebGL Postconditions

- The page must have a visible main playfield with a WebGL/canvas or equivalent 3D rendering area whose dimensions are greater than zero and that can present a non-empty main scene.
- When `phase=playing`, `overlayBlocking=false` and `canInteractWithPlayfield=true`; if a shop, dialog, tutorial, or result overlay is open, then `overlayBlocking=true`.
- HUD values must align with the snapshot: after score, cash, reputation, wanted level, health, current power, or quest state changes, the corresponding update must be visible to the player.
- Real keyboard, mouse, and touch input must work; the public interface cannot replace the player path.

## Behavioral Trajectory Contract

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Start and enter the playable world | M1/M11 | `reset()` or default loading | Wait for loading/close the tutorial | `phase=playing`, the 3D scene is readable, the HUD is readable, and the overlay does not block | No fatal error; playfield dimensions remain stable |
| Screen-directional movement | M2 | `loadScenario("openStreet")` | Actually press right, then left; or drag the joystick left and right | `player.screenX` or the visible controlled entity’s direction changes oppositely, and canvas/render revision changes after input | Cannot cross impassable boundaries; health/score do not change due to movement |
| Flight ascent and descent | M3 | `loadScenario("openStreet")` | Actually hold the ascend throttle, then hold the descend throttle | `altitude` increases and then decreases, `mode` can enter flying, and the visuals/render revision change | Throttle/altitude are not negative; the player is not dead |
| Power switching and use | M5/M6 | `loadScenario("targetAhead")` | Click to switch powers, then hold the power button to use and release it | The current power HUD changes; the effect is visible, and hitting the target produces affectedCounts or score/reputation/freeze changes | After release, `powers.active=false`; an invalid power name is rejected |
| Vehicle driving | M7 | `loadScenario("nearVehicle")` | Use real interaction to enter, press up/left/right, and click exit | `mode=driving`, vehicle speed/screen direction changes, and exiting returns to walking | Entry is rejected when there is no vehicle; the hidden protagonist does not walk while driving |
| Quest loop | M8/M9 | `loadScenario("questReady")` | Accept/start the quest and perform the objective action | Quest progress increases; after completion, score/reputation increases and feedback is displayed | The scenario cannot pre-complete the quest; rewards are triggered only by player actions |
| Shop purchase and rejection | M9/M11 | `loadScenario("shopWithFunds")` / `"shopInsufficientFunds"` / `"shopUnavailableAmmo"` | Open the shop and click an item | Success deducts cash and adds inventory/healing/weapons/ammunition; insufficient funds or unavailable supplies produce `lastRejected` or a refund with state unchanged | Resources, inventory, weapons, and ammunition remain within bounds; cash is not negative |
| Resource pickups and wanted boundary | M9/M12 | `loadScenario("pickupReady")` / `"wantedPickupReady"` | Approach or trigger a cash/ammunition/quest item/wanted-reducing pickup | The corresponding resource, quest progress, or wanted level changes; pickup count decreases, and the HUD/minimap stay synchronized | A wanted-reducing pickup with no wanted level is rejected or remains at 0; resources and wanted level stay within bounds |
| Weapon firing and ammunition | M9b/M12 | `loadScenario("weaponReady")` / `"weaponEmpty"` | Fire through a real control or the contract; fire again when exhausted | With ammunition, ammo decreases and projectiles/particles/firedCount/hitCount or score/reputation/wanted consequences appear; without ammunition, the action is rejected or empty-weapon feedback appears | Ammo is not negative; no ammunition means no valid projectile or hit reward can be generated |
| Minimap zoom and markers | M1/M8/M12 | `loadScenario("questReady")` | Use a click/gesture to toggle minimap zoom | `minimap.expanded` changes, while player, target, vehicle/shop/pickup markers remain observable | Zoom must not block playing input; after closing, the playfield is interactive |
| Death and restart | M10 | `loadScenario("lowHealth")` | Trigger damage to 0, then click restart | The result overlay appears and blocks input; restart returns to playing, restores health, and clears temporary effects | Movement/powers cannot increase score after the end state |

## Feature-to-Interface Mapping

- M1: `reset/getSnapshot` + a visible DOM/WebGL playfield.
- M2: real `keyDown/keyUp` or `drag(movementJoystick)` + `player.screenX/screenY`.
- M3: real `Shift`/`Control` or `drag(throttle)` + `player.altitude/mode`.
- M4: real click/key input + `camera.mode`.
- M5/M6: real clicks to switch powers and hold to use + `powers`, HUD, and entity effects.
- M7: real interaction key/button + `vehicle`, `mode`, and screen direction.
- M8: `loadScenario` only establishes prerequisites + `questAction` or real target interaction triggers quest progress.
- M9: real shop clicks and pickup actions + `economy/weapons/pickups/hud/lastRejected`.
- M9b: real firing or a `weapon.fire` action + `weapons.ammo/firedCount/hitCount`, `entities.projectiles/particles`, and HUD consequences.
- M10: low-health scenario + `hazard` or a real hazard triggers the result overlay + real restart button/action.
- M11: `panels/overlayBlocking/canInteractWithPlayfield`.
- M12: real or public minimap actions + `minimap` markers and playfield blocking state.

## Prohibited Items

- No fixed DOM structure, fixed coordinates, fixed colors, fixed copy, specific assets, specific map dimensions, specific physics formulas, or internal variable names are required.
- The public interface must not directly set score, cash, quest completion, kills, freezing, vehicle destruction, death results, or victory results to satisfy the core trajectories.
- P1/P2 behavior must be trigger -> verify; returning only `{ok:true}`, having only a button, having only a canvas, or relying only on natural animation changes does not satisfy the contract.
