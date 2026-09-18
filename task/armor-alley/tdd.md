# Armor Alley TDD Public Contract

## 1. Scope

This contract defines a portable public test surface for the gameplay described in `game-spec.md` and `design-doc.md`. It only describes player-level inputs, legal setup scenarios, stable snapshot summaries, and externally visible postconditions.

The contract must not be implemented as a parallel game state. Calls through `window.__gameTest` must drive the same game state, HUD, playfield, result flow, and interaction locks that a player uses through the visible UI.

## 2. Public Test Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  loadScenario(name, options): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot
}
```

### Method Semantics

| Method | Contract |
|---|---|
| `reset(options)` | Return the game to a fresh boot/menu or immediately playable state as requested by `options.start`. It must clear transient battle state, pending result state, modal locks, temporary projectiles, and old notifications. |
| `loadScenario(name, options)` | Load a legal precondition from the scenario enum. The scenario may place the player near a documented decision point, but must not pre-apply the result being tested. |
| `input(action)` | Apply one player-level action. It must be equivalent to a real player action such as selecting a menu option, moving directional intent, holding or releasing a weapon input, ordering a unit, landing, waiting, pausing, or restarting. |
| `getSnapshot()` | Return the current stable public summary. It must not expose private object graphs, implementation functions, source names, render tree details, or exact pixel constants. |

Every method returns a `Snapshot`. For rejected actions, the returned snapshot must include either `lastAction.ok === false` or an unchanged state plus a visible notification/rejection summary.

## 3. Action Schema

All actions use:

```javascript
{
  type: string,
  value?: string | number | boolean,
  target?: string,
  unit?: string,
  direction?: "left" | "right" | "up" | "down" | "center",
  vector?: { x: number, y: number },
  durationMs?: number,
  mode?: string
}
```

### Action Types

| Type | Required fields | Player-level meaning | Valid postcondition examples |
|---|---|---|---|
| `startBattle` | `mode` optional | Start tutorial or a single-player battle from the menu. | `phase` becomes `playing`; playfield and HUD are visible; blocking menu closes. |
| `pause` | none | Pause active battle. | `phase` becomes `paused`; battle motion revisions stop changing while paused. |
| `resume` | none | Resume from pause/settings. | `phase` returns to `playing`; playfield accepts input again. |
| `openSettings` / `closeSettings` | none | Open or close a blocking settings/options panel. | `overlayBlocking` toggles; battlefield input is blocked only while open. |
| `restart` | none | Restart current battle after a result or from pause/menu. | Fresh battle state; old result and transient effects are cleared. |
| `returnToMenu` | none | Return from battle/result/settings to menu. | `phase` becomes `menu`; playfield is not interactable. |
| `setFlightIntent` | `direction` or `vector`, `durationMs` optional | Move pointer/touch/virtual intent relative to the visible helicopter. | Helicopter screen/world position or velocity trend changes in the requested direction. |
| `centerFlightIntent` | `durationMs` optional | Put intent near helicopter center. | Movement trend calms compared with far directional intent. |
| `holdFire` | `value: true|false`, `durationMs` optional | Press or release sustained gunfire. | Active firing and projectile/munition revision start while held and stop after release; ammo is conserved when empty. |
| `dropBomb` | none | Trigger one bomb release. | Bomb stock decreases only if available; bomb/projectile and impact revisions can change. |
| `launchGuidedWeapon` | `target` optional | Fire a guided weapon at an eligible target if available. | Guided weapon stock decreases only for a valid launch; projectile/targeting revision changes. |
| `dropSoldier` | none | Drop an onboard soldier from air or near ground. | Onboard soldier count decreases only if available; airborne or ground soldier count/revision changes. |
| `landOrRefit` | `target` optional, `durationMs` optional | Guide or request landing/refit at a safe area. | Landed/refit state becomes active only in legal context; resources recover over time, not as an instant full refill. |
| `takeOff` | none | Leave landed/refit state through player flight intent. | Helicopter becomes airborne and playfield mobility returns. |
| `orderUnit` | `unit` | Place a production order for a ground unit. | Funds decrease and queue increases only for legal affordable orders. |
| `wait` | `durationMs` | Let battle time advance without direct player action. | World, radar, queue, refit, projectile, or enemy pressure revisions may advance when not paused/result. |
| `selectVisibleTarget` | `target` | Select a semantic visible target or target class for actions that need one. | Selection/target summary updates only if a legal visible target exists. |
| `dismissNotification` | none | Dismiss player-facing feedback if the implementation supports dismissal. | Notification count or current message summary may change; gameplay state must not mutate. |

### Unit Values

`unit` must use these public values:

`tank | missileVehicle | supplyVehicle | infantry | engineer | helicopter`

### Target Values

`target` may use only product-level values:

`nearestEnemyGround | nearestEnemyAir | nearestThreat | friendlyLandingArea | homeBase | enemyBase | contestedBunker | friendlySupplyVehicle | enemySupplyVehicle | visibleAirHazard`

Implementations may expose additional target summaries in `Snapshot.visibleTargets`, but tests must not require source-specific names, asset names, DOM selectors, or fixed coordinates.

## 4. Legal Scenario Enum

`loadScenario(name)` may support the following legal preconditions. Each scenario must be reachable by ordinary player play and must require at least one player-level action to produce the result under test.

| Scenario | Legal precondition | Allowed trigger families | Forbidden shortcut |
|---|---|---|---|
| `menu_ready` | Game is loaded at a start/menu state. | `startBattle` | Must not already be in battle. |
| `battle_start_airborne` | A single-player battle is active; helicopter is visible, airborne, supplied enough for basic movement, and no result is active. | `setFlightIntent`, `wait`, `pause` | Must not pre-damage, pre-crash, or pre-complete objectives. |
| `flight_control_sample` | Helicopter is airborne in a safe enough area to compare directional movement. | `setFlightIntent`, `centerFlightIntent`, `wait` | Must not directly set position/velocity after input. |
| `air_attack_with_targets` | Helicopter has some weapons and at least one eligible enemy/threat can be reached or targeted. | `holdFire`, `dropBomb`, `launchGuidedWeapon`, `selectVisibleTarget`, `wait` | Must not spawn an already-hit target or pre-award damage/removal. |
| `weapon_rejection` | Helicopter lacks one required stock or lacks an eligible target while other state is valid. | `holdFire`, `dropBomb`, `launchGuidedWeapon`, `dropSoldier` | Must not consume resources during setup or mark success before action. |
| `soldier_drop_opportunity` | Helicopter has onboard soldiers near a capture/support opportunity or safe drop area. | `dropSoldier`, `wait` | Must not pre-capture, pre-repair, or pre-board soldiers. |
| `low_resources_near_landing` | Helicopter is near a safe landing/refit area with fuel, weapon stock, or damage not full. | `landOrRefit`, `wait`, `takeOff` | Must not instantly refill or mark refit complete on load. |
| `production_ready` | Battle is active with visible funds and capacity for at least one affordable ground order. | `orderUnit`, `wait` | Must not pre-spawn the ordered unit or pre-spend its cost. |
| `production_rejection` | Battle is active but one order is illegal because of insufficient funds, capacity, or context. | `orderUnit` | Must not silently alter funds/queue in setup. |
| `active_ground_war` | Friendly and enemy ground units or production pressure are present but no terminal result has occurred. | `orderUnit`, `wait`, air support actions | Must not freeze units or pre-resolve combat. |
| `convoy_near_enemy_base` | A friendly supply vehicle is near but not at the enemy base and still needs protection/time to finish. | `wait`, air support, production support | Must not set `result` to victory on load. |
| `enemy_convoy_threat` | An enemy supply vehicle is near but not at the player base and can still be intercepted or allowed through. | `wait`, air attack, production support | Must not set `result` to defeat on load. |
| `contested_bunker` | A bunker/turret/control point is contested or capturable, with a legal unit/action path still required. | `dropSoldier`, `orderUnit`, `wait`, air attack | Must not pre-change ownership/capture completion. |
| `air_hazard_nearby` | Helicopter is near an air obstacle, cover, or danger but not already colliding/destroyed. | `setFlightIntent`, `wait` | Must not directly apply crash/damage before player movement. |
| `radar_awareness` | Long battlefield contains off-screen units/structures/hazards with battle active. | `wait`, movement, production/combat actions | Must not fabricate radar-only markers unrelated to world state. |
| `pause_guard` | Battle is active with ongoing motion or queue/refit progress. | `pause`, `wait`, `resume` | Must not pre-stop the world outside pause/settings. |
| `result_lock_from_play` | A near-terminal convoy/base situation exists but result still equals `none`. | `wait`, support or non-support actions followed by ordinary action attempts | Must not load an already-won or already-lost state. |

Scenario names are public semantic states, not implementation hooks. Scenarios may adjust starting resources and positions only enough to create the documented legal precondition.

## 5. Snapshot Schema

`Snapshot` must be JSON-serializable and stable across frames. Numeric values may be approximate summaries, not exact implementation coordinates.

```javascript
{
  phase: "loading|menu|briefing|playing|paused|settings|result",
  screen: "boot|menu|battle|settings|result",
  result: "none|victory|defeat",
  mode: "none|tutorial|singleBattle|advanced",
  difficulty: "none|training|standard|hard|custom",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  canUseProduction: boolean,
  timeMs: number,
  worldRevision: number,
  playfield: {
    visible: boolean,
    bounds: { left: number, top: number, width: number, height: number },
    scrollProgress: number
  },
  helicopter: {
    visible: boolean,
    alive: boolean,
    airborne: boolean,
    landed: boolean,
    refitting: boolean,
    facing: "left|right|unknown",
    healthState: "ok|damaged|critical|destroyed",
    screenX: number,
    screenY: number,
    worldProgress: number,
    velocityXTrend: "left|right|neutral|unknown",
    velocityYTrend: "up|down|neutral|unknown",
    fuel: { current: number, max: number, trend: "up|down|stable|unknown" },
    ammo: { current: number, max: number },
    bombs: { current: number, max: number },
    guidedWeapons: { current: number, max: number },
    soldiers: { onboard: number, capacity: number },
    lives: { current: number|null, limited: boolean }
  },
  economy: {
    funds: number,
    queueLength: number,
    queueByUnit: {
      tank: number,
      missileVehicle: number,
      supplyVehicle: number,
      infantry: number,
      engineer: number,
      helicopter: number
    },
    affordableUnits: string[],
    blockedUnits: string[]
  },
  entityCounts: {
    friendlyGround: number,
    enemyGround: number,
    friendlySupplyVehicles: number,
    enemySupplyVehicles: number,
    friendlyAir: number,
    enemyAir: number,
    soldiersAirborne: number,
    soldiersGround: number,
    projectiles: number,
    explosionsOrDamageEffects: number,
    bunkersFriendly: number,
    bunkersEnemy: number,
    bunkersNeutral: number,
    turrets: number,
    airHazards: number
  },
  revisions: {
    hud: number,
    radar: number,
    worldMotion: number,
    projectiles: number,
    production: number,
    combat: number,
    refit: number,
    notifications: number,
    result: number
  },
  radar: {
    visible: boolean,
    hasFriendlyMarkers: boolean,
    hasEnemyMarkers: boolean,
    hasObjectiveMarkers: boolean,
    jammedOrDegraded: boolean,
    markerRevision: number
  },
  visibleTargets: [
    {
      id: string,
      type: "enemyGround|enemyAir|threat|landingArea|bunker|turret|supplyVehicle|airHazard",
      team: "friendly|enemy|neutral|none",
      screenX: number,
      screenY: number,
      availableActions: string[]
    }
  ],
  convoy: {
    friendlyProgress: number,
    enemyProgress: number,
    friendlyThreatened: boolean,
    enemyThreatened: boolean
  },
  lastAction: {
    type: string,
    ok: boolean,
    reason: "none|notReady|blocked|paused|resultLocked|noFunds|unitCap|noAmmo|noBombs|noGuidedWeapon|noTarget|noSoldiers|unsafe|invalidAction|unavailable",
    visibleFeedback: boolean
  },
  notifications: {
    count: number,
    latestKind: "none|info|warning|rejection|damage|refit|production|capture|result"
  }
}
```

### Field Rules

- `screenX/screenY` and `playfield.bounds` are semantic runtime geometry for portable input. They are not fixed coordinates and must reflect the current layout.
- `worldProgress`, `friendlyProgress`, and `enemyProgress` are normalized `0..1` summaries of long-battlefield position.
- Revision counters may increase by any positive amount after a relevant visible/system change. They must not increase solely because `getSnapshot()` was called.
- `visibleTargets[].id` must be stable only within the current scenario/session. Tests may use it for `selectVisibleTarget`, but it must not reveal private object identifiers.
- `entityCounts` are public category counts. They must not expose internal arrays or object references.
- When a value is not applicable, use `null`, `unknown`, or an empty list rather than omitting required top-level fields.

## 6. External Postconditions

The public interface must stay synchronized with player-visible output:

- Starting a battle makes the primary playfield visible and interactable, with HUD and radar summaries available.
- If `phase === "playing"`, no menu/settings/result overlay may block normal playfield input.
- Pausing or opening settings blocks battlefield input and stops battle progress, queue completion, refit progress, and autonomous combat revisions until resumed.
- Weapon, production, refit, capture, damage, radar, result, and rejection changes must update at least one external surface: HUD, playfield animation/effect, radar, notification, visible control state, or result layer.
- A rejected action must not consume unrelated resources, advance production, create projectiles, complete capture/refit, or change result.
- A terminal result locks ordinary flight weapons, production, and autonomous duplicate result changes until restart or return to menu.
- Restart after result must clear old projectiles/effects enough that new observations are attributable to the new battle.

## 7. Feature Contract Matrix

| GDD mechanism | Contract input | Snapshot output | Required observable result |
|---|---|---|---|
| M1 start/reset/battle flow | `reset`, `startBattle`, `restart`, `returnToMenu` | `phase`, `screen`, `overlayBlocking`, `canInteractWithPlayfield`, `revisions.hud` | Menu-to-battle and result-to-restart change phase and clear stale blocking/result state. |
| M2 continuous helicopter flight | `loadScenario("flight_control_sample")`, `setFlightIntent`, `centerFlightIntent`, `wait` | `helicopter.screenX/Y`, `velocityXTrend`, `velocityYTrend`, `playfield.scrollProgress`, `worldRevision` | Opposite directional intent produces opposite movement trends; center intent calms movement; playfield remains visible. |
| M2 flight risk | `loadScenario("air_hazard_nearby")`, `setFlightIntent`, `wait` | `helicopter.healthState`, `alive`, `entityCounts.airHazards`, `revisions.combat`, `notifications.latestKind` | Hazard/risk path can cause damage/crash feedback only after player movement into danger. |
| M3 sustained gunfire | `loadScenario("air_attack_with_targets")`, `holdFire(true)`, `wait`, `holdFire(false)` | `helicopter.ammo`, `entityCounts.projectiles`, `revisions.projectiles`, `revisions.combat` | Firing creates repeated projectile/combat evidence while held and stops after release; empty ammo rejects. |
| M3 bombing | `loadScenario("air_attack_with_targets")`, `dropBomb`, `wait` | `helicopter.bombs`, `entityCounts.projectiles`, `entityCounts.explosionsOrDamageEffects`, `revisions.combat` | Bomb stock decreases only for a valid release and produces falling/impact evidence. |
| M3 guided weapon | `loadScenario("air_attack_with_targets")`, `selectVisibleTarget`, `launchGuidedWeapon`, `wait` | `helicopter.guidedWeapons`, `visibleTargets`, `revisions.projectiles`, `lastAction` | Valid target launch consumes one guided weapon and changes projectile/targeting evidence; no target rejects. |
| M3 soldier drop | `loadScenario("soldier_drop_opportunity")`, `dropSoldier`, `wait` | `helicopter.soldiers`, `entityCounts.soldiersAirborne`, `entityCounts.soldiersGround`, `revisions.combat` | Onboard soldier count decreases only for valid drop; soldier entity/capture-support evidence appears. |
| M4 landing/refit | `loadScenario("low_resources_near_landing")`, `landOrRefit`, `wait`, `takeOff` | `helicopter.landed`, `refitting`, resource trends, `revisions.refit`, `canInteractWithPlayfield` | Landing enables gradual recovery and reduced mobility; takeoff returns airborne mobility. |
| M5 production economy | `loadScenario("production_ready")`, `orderUnit`, `wait` | `economy.funds`, `queueLength`, `queueByUnit`, `entityCounts.friendlyGround`, `revisions.production` | Affordable orders spend funds, enter queue, and later produce matching public unit counts. |
| M5 rejection | `loadScenario("production_rejection")`, `orderUnit` | `lastAction`, `economy.funds`, `queueLength`, `notifications.latestKind` | Illegal order is rejected without funds loss or queue growth. |
| M6 autonomous ground war | `loadScenario("active_ground_war")`, `wait`, optional support actions | `entityCounts`, `revisions.worldMotion`, `revisions.combat`, `convoy` | Ground units move/contact/attack or wait around blockers; world/combat evidence changes without direct spawning. |
| M7 convoy victory/failure | `loadScenario("convoy_near_enemy_base")` or `enemy_convoy_threat`, `wait` plus support/non-support | `result`, `phase`, `convoy`, `revisions.result` | Friendly arrival triggers victory or enemy arrival triggers defeat from legal near-terminal play; result locks ordinary actions. |
| M8 control points and hazards | `loadScenario("contested_bunker")` or `air_hazard_nearby`, player support actions | bunker counts, `entityCounts.turrets`, `entityCounts.airHazards`, `revisions.combat`, `notifications` | Capture/repair/damage/hazard feedback changes only after player-triggered or autonomous legal contact. |
| M9 HUD/radar/tactical feedback | `loadScenario("radar_awareness")`, movement, production, combat, `wait` | `radar`, `revisions.hud`, `revisions.radar`, `notifications` | HUD and radar revisions track actual resource, queue, weapon, threat, objective, and result changes. |
| M10 pause/modal/result invariants | `loadScenario("pause_guard")`, `pause`, `wait`, `resume`; result from `result_lock_from_play` | `phase`, `overlayBlocking`, `revisions`, `lastAction` | Pause/settings freeze battle progress; terminal state rejects ordinary production/attack until restart. |
| M11/P2 advanced modes | `startBattle({mode:"advanced"})` or visible advanced entry where supported | `mode`, `difficulty`, `phase`, `screen` | Advanced entries may exist, but absence must not fail P1 if single-player/tutorial loop is complete. |
| M12/P2 extended flavor | scenarios with radar degradation/weather/special variants where supported | `radar.jammedOrDegraded`, `entityCounts.airHazards`, revisions | Extra depth must remain observable and not break P1 contracts. |

## 8. Scenario Review Requirements

Tests using `loadScenario` must verify the scenario is a legal precondition before triggering the result:

- Result scenarios must start with `result === "none"`.
- Weapon scenarios must require a weapon action before projectile, hit, rejection, or stock change evidence appears.
- Production scenarios must require `orderUnit` before funds/queue/spawn evidence changes.
- Refit scenarios must require landing/refit plus elapsed time before resources trend upward.
- Hazard scenarios must require movement or elapsed contact before damage/crash evidence appears.
- Bunker/capture scenarios must require soldier drop, ground unit contact, repair, or combat before ownership/capture/damage evidence changes.
- Pause scenarios must prove motion/progress can occur before pause and is suppressed only while paused/settings are active.

## 9. Forbidden Test Contract Shortcuts

The TDD contract forbids:

- Directly setting score, funds, result, health, ammo, position, damage, ownership, queue completion, or victory/failure through test-only actions.
- Fine-grained public methods such as spawning an entity, forcing a collision, forcing a hit, awarding funds, completing capture, refilling instantly, or killing a unit.
- Returning private object arrays, private identifiers, source function names, DOM/CSS structure, asset names, exact UI text, fixed canvas size, fixed coordinates, or implementation timing constants as required contract data.
- Passing a core mechanism from `{ ok: true }`, static text, element existence, or a fixed value without a trigger-to-result delta.
- Letting `window.__gameTest` mutate a hidden state that is not reflected in HUD, radar, playfield, notifications, visible controls, or result state.

## 10. L2 Generation Boundary

Generation models may read `game-spec.md`, `design-doc.md`, and this TDD. They must not rely on evaluation files, historical reports, previous generated artifacts, or implementation-specific source details.

The executable checks derived from this TDD should prefer real browser/player input for P1 behavior paths. `window.__gameTest` is the stable public contract for deterministic setup, player-level actions, and observation, but P1/P2 pass conditions must still be grounded in trigger-to-observable-result behavior described above.
