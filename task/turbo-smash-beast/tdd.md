# Turbo Smash Beast TDD Public Contract

## 1. Contract Scope

This file defines the public, portable test contract for Turbo Smash Beast. It only exposes player-level actions, legal scenario setup states, stable gameplay snapshots, and external postconditions derived from `game-spec.md` and `design-doc.md`.

The contract must not be implemented as a private-state shortcut. Public actions must be equivalent to user operations such as starting, pressing, holding, dragging, releasing, opening panels, choosing visible options, retrying, or continuing. Snapshots are summaries for observation, not an internal object graph.

## 2. Public Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

The public method names are:

- `window.__gameTest.reset(options?)`
- `window.__gameTest.input(action)`
- `window.__gameTest.getSnapshot()`
- `window.__gameTest.loadScenario(name, options?)`

### Method Semantics

- `reset(options?)`: returns the game to a boot or start-ready state with persisted progress controlled only by optional public flags such as `clearProgress: true`. It must not directly award victory, damage, speed, rewards, or collisions.
- `input(action)`: applies one player-level action or a passive wait step. It returns a fresh `Snapshot`.
- `getSnapshot()`: returns the current stable summary without mutating gameplay.
- `loadScenario(name, options?)`: loads a legal precondition from the scenario list below. A scenario may position the game at a reachable preparation point, road approach, ramp approach, airborne approach, hazard approach, damaged-but-alive monster state, locked-selection menu, or result state. It must not pre-apply the exact outcome being tested.

All methods must be callable repeatedly without throwing. Invalid actions should return a snapshot with `lastAction.ok === false` or an equivalent rejection reason while leaving unrelated gameplay state unchanged.

## 3. Action Schema

Every action is a plain object with a `type` string. Coordinates, when used, are screen-space or normalized public playfield coordinates; tests must not rely on fixed pixel positions.

| Action | Required fields | Allowed values / semantics | Expected postcondition surface |
|---|---|---|---|
| `start` | none | Equivalent to pressing the visible start control after loading | `screen`/`phase` advances toward playable state; play scene becomes visible and non-blocked |
| `openPanel` | `panel` | `levels`, `vehicles`, `settings` | Opens only from `ready`; sets a blocking panel and disables playfield driving input |
| `closePanel` | `panel` | same as above | Returns to `ready` without changing invalid selections |
| `selectLevel` | `levelId` | public level id or ordinal from snapshot | Unlocked level becomes current; locked level is rejected |
| `selectVehicle` | `vehicleId` | public vehicle id from snapshot | Unlocked vehicle becomes current; locked vehicle may preview but cannot persist as active selection |
| `toggleSetting` | `setting` | `music`, `sound` | Preference flips when available and gameplay remains usable |
| `pressPlayfield` | `point?` | `center`, `left`, `right`, or `{ screenX, screenY }` inside `playfield.bounds` | From `ready`, begins hold-to-accelerate and enters road movement; from blocked panels it is rejected/ignored |
| `dragPlayfield` | `direction` or `deltaX` | `left`, `right`, `small`, or normalized signed delta | While held on road/air, changes steering input; right drag means vehicle shifts left, left drag means vehicle shifts right |
| `releasePlayfield` | none | Releases the active press | Active acceleration stops; vehicle may continue coasting/decelerating |
| `hold` | `durationMs` | bounded positive duration | Equivalent to keeping current press state for a short real-time interval |
| `wait` | `durationMs` | bounded positive duration | Lets animations/physics/menu transitions progress without new input |
| `continueRun` | none | Visible failure/continue action | Starts a new attempt for the current monster/level and clears transient run effects |
| `retry` | none | Visible retry action from result/waiting states | Restarts the current level/run and clears transient state |
| `nextLevel` | none | Visible victory next-level action | Moves only to an unlocked next level after victory |
| `backToReady` | none | Visible back/close action where applicable | Leaves selection/result panels according to current phase rules |

Actions that are not player-level are forbidden: directly setting speed, boost, health, monster damage, result, collision flags, unlock arrays, projectile hits, reward state, or private entity positions.

## 4. Scenario Schema

`loadScenario(name)` must return a legal precondition. Each scenario must be reachable through the normal player loop or represent a menu/result state already defined by the GDD.

| Scenario | Legal precondition | Player action family that must trigger the observed result | Forbidden shortcut |
|---|---|---|---|
| `freshStart` | Loading/start screen or start-ready state with default progress | `start`, then wait for ready/play scene | Preloading a completed run |
| `readyUnlockedLevel` | A ready state on an unlocked playable level with vehicle, road, ramp, monster, HUD, and no blocking panel | `pressPlayfield`, `hold`, `dragPlayfield`, `releasePlayfield` | Preset speed, launch, collision, or result |
| `readyWithPreparationPanels` | Ready state where level, vehicle, and settings panels can be opened | `openPanel`, `closePanel`, `selectLevel`, `selectVehicle`, `toggleSetting` | Directly modifying saved progress or selected vehicle without player selection |
| `panelOpenReady` | A preparation panel is visible and blocks the playfield while the run has not started | `pressPlayfield`, `closePanel` | Starting the vehicle underneath the panel |
| `lockedLevelMenu` | Level-selection state with at least one locked level visible and current level unchanged | `selectLevel` on locked entry | Silently selecting or unlocking the locked level |
| `lockedVehicleMenu` | Vehicle-selection state with at least one locked vehicle visible and a valid active vehicle | `selectVehicle`, `closePanel` | Persisting a locked vehicle as active selection |
| `roadHazardApproach` | Vehicle is before visible road risks, intact, moving or ready to move, with hazard positions observable but not yet collided | `pressPlayfield`/`hold` plus route choice through or away from hazard | Pre-triggered explosion, damage, or collision |
| `rampApproach` | Vehicle is on the road before the ramp with non-terminal state and controllable speed build-up still required | `pressPlayfield`, `hold`, optional `dragPlayfield` | Direct flight, direct launch, or fixed boosted speed |
| `airborneApproach` | Vehicle has legally launched and is airborne, not yet collided or landed | `dragPlayfield`, `wait` | Directly forcing hit, miss, landing, or victory |
| `monsterApproach` | Vehicle is approaching a living monster after a legal launch, with target zones observable and no impact applied yet | `dragPlayfield`, `wait` until hit or miss | Pre-broken contact blocks, direct damage, or direct result |
| `damagedMonsterReady` | Current monster is alive with prior visible damage and remaining health after one or more legitimate failed/partial runs | Normal sprint, ramp, and impact actions | Direct victory or pre-awarded reward |
| `failureWaiting` | A run has ended without victory and shows continue/retry choices | `continueRun` or `retry` | Reusing old velocity, hazard effects, or hidden collision state |
| `victoryResult` | A monster has already been destroyed by a legitimate run and result choices are visible | `nextLevel`, `retry`, `openPanel` where allowed | Repeated reward farming from driving inputs |

Scenarios may offer `options` for public choices such as `level: "firstUnlocked" | "highestUnlocked" | publicLevelId` or `vehicle: publicVehicleId`, but they must never directly set private physics values, invisible damage flags, exact coordinates, or hidden collision outcomes.

## 5. Snapshot Schema

`Snapshot` must be JSON-serializable and stable across implementations. Numeric fields may be approximate summaries or normalized values, but their sign and relative changes must reflect player-visible behavior.

```typescript
type Snapshot = {
  ok: boolean;
  screen: "loading" | "start" | "playing" | "panel" | "result";
  phase: "loading" | "start" | "intro" | "ready" | "accelerating" | "launching" | "airborne" | "impact" | "waiting" | "victory" | "paused";
  result: "none" | "win" | "fail";
  activePanel: "none" | "levels" | "vehicles" | "settings" | "result";
  overlayBlocking: boolean;
  canInteractWithPlayfield: boolean;
  playfield: {
    ready: boolean;
    visible: boolean;
    bounds?: Bounds;
    renderRevision?: number;
    sceneSummary: SceneSummary;
  };
  level: LevelSummary;
  vehicle: VehicleSummary;
  motion: MotionSummary;
  road: RoadSummary;
  monster: MonsterSummary;
  progression: ProgressionSummary;
  ui: UiSummary;
  lastAction?: ActionResult;
};
```

### Field Details

`Bounds`:

- `{ screenX, screenY, width, height }` or equivalent top-left/center/size summary.
- Used only to choose real user input points; not a fixed canvas or DOM requirement.

`SceneSummary`:

- `hasReadableScene: boolean`
- `visibleElements: string[]` with candidates such as `vehicle`, `road`, `ramp`, `monster`, `hazard`, `hud`, `debris`, `resultChoices`, `targetHint`
- `cameraTracksVehicle: boolean`
- `visibleMotionRevision: number` increments or changes when vehicle, hazards, debris, or camera visibly move

`LevelSummary`:

- `currentId: string`
- `currentIndex?: number`
- `state: "locked" | "unlocked" | "completed"`
- `available: Array<{ id: string, index?: number, locked: boolean, selected: boolean }>`

`VehicleSummary`:

- `currentId: string`
- `available: Array<{ id: string, locked: boolean, selected: boolean, previewed?: boolean }>`
- `healthRatio: number` in `[0, 1]`
- `damaged: boolean`
- `screenX?: number`
- `screenY?: number`
- `lateral: { normalized: number, atLeftBound?: boolean, atRightBound?: boolean }`
- `orientation?: "straight" | "turningLeft" | "turningRight" | "noseUp" | "falling" | "impacting"`

`MotionSummary`:

- `inputHeld: boolean`
- `speedRatio: number` in `[0, 1]`
- `forwardProgress: number` monotonic within a run unless reset
- `verticalState: "grounded" | "ramp" | "airborne" | "landed"`
- `airControlAvailable: boolean`
- `steeringIntent: "none" | "leftDrag" | "rightDrag" | "smallDrag"`
- `visibleDirection: "none" | "left" | "right" | "forward" | "up" | "down"`
- `motionRevision: number`

`RoadSummary`:

- `bounds: { leftLimit: number, rightLimit: number }` may be normalized
- `hazardsVisible: number`
- `movingHazardsVisible: number`
- `explosionRevision: number`
- `hazardCollisionCount: number`
- `lastHazardEffect?: "none" | "damage" | "slowdown" | "knockback" | "destroyedVehicle"`

`MonsterSummary`:

- `visible: boolean`
- `healthRatio: number` in `[0, 1]`
- `destroyed: boolean`
- `blockCount?: number`
- `brokenBlockCount: number`
- `debrisRevision: number`
- `impactRevision: number`
- `targetZones?: Array<{ id: string, label?: "head" | "body" | "arm" | "leg" | "support" | "center", screenX?: number, screenY?: number, bounds?: Bounds, damaged?: boolean }>`

`ProgressionSummary`:

- `highestUnlockedIndex?: number`
- `unlockedLevelIds: string[]`
- `unlockedVehicleIds: string[]`
- `newRewardVisible: boolean`
- `canGoNext: boolean`
- `storageAvailable?: boolean`

`UiSummary`:

- `loadingComplete: boolean`
- `controls: string[]` with candidates such as `start`, `levels`, `vehicles`, `settings`, `retry`, `continue`, `nextLevel`, `back`
- `speedHudVisible: boolean`
- `speedHudValue?: number`
- `monsterHealthVisible: boolean`
- `vehicleHealthVisible: boolean`
- `resultChoicesVisible: boolean`
- `hintVisible: boolean`
- `audio: { musicEnabled?: boolean, soundEnabled?: boolean }`

`ActionResult`:

- `{ ok: boolean, type: string, reason?: "invalidPhase" | "blockedByPanel" | "locked" | "outOfBounds" | "notAvailable" | "terminalLocked" | "unknownAction" }`

## 6. Feature Contract Matrix

| GDD feature | Contract trigger | Snapshot outputs | Required observable postcondition |
|---|---|---|---|
| M1 Start/loading/ready flow | `reset`, `start`, `wait` | `screen`, `phase`, `playfield.sceneSummary`, `ui.loadingComplete`, `canInteractWithPlayfield` | Start becomes available only after load; playing/ready state has visible vehicle, road, ramp, monster, HUD and no blocking overlay |
| M2 Hold-to-accelerate | `pressPlayfield`, repeated `hold`, `releasePlayfield`, `wait` | `phase`, `motion.inputHeld`, `motion.speedRatio`, `motion.forwardProgress`, `ui.speedHudValue`, `motion.motionRevision` | Holding increases speed/progress and visible motion; release stops active input and causes coasting/deceleration rather than instant freeze |
| M3 Inverted drag steering/bounds | Hold then `dragPlayfield` left/right/small | `vehicle.lateral.normalized`, `vehicle.screenX`, `motion.steeringIntent`, `motion.visibleDirection`, bound flags | Drag right produces leftward vehicle movement; drag left produces rightward movement; small drag stays near straight; road bounds clamp lateral travel |
| M4 Road hazards | `roadHazardApproach`, route through or away from visible hazard | `road.hazardsVisible`, `road.explosionRevision`, `road.hazardCollisionCount`, `vehicle.healthRatio`, `motion.speedRatio` | Valid collision creates visible effect plus damage/slow/knockback; avoided or unrelated hazards do not silently damage |
| M5 Ramp and flight | `rampApproach`, hold until ramp, `wait`, optional air drag | `motion.verticalState`, `motion.speedRatio`, `motion.forwardProgress`, `vehicle.orientation`, `motion.airControlAvailable` | Ramp converts road speed into airborne motion with nose-up/flight feedback; air control is lateral only and cannot create new acceleration |
| M6 Monster destruction | `monsterApproach` or `damagedMonsterReady`, legal flight into monster | `monster.healthRatio`, `monster.brokenBlockCount`, `monster.debrisRevision`, `monster.impactRevision`, `result` | Hit creates spatial breakage/debris and lowers health; miss or weak run does not award win |
| M7 Result and restart | `wait` after win/fail, then `continueRun`/`retry` | `phase`, `result`, `ui.resultChoicesVisible`, `motion`, `road`, `vehicle`, `monster` | Result choices appear; restart/continue clears transient velocity, damage effects, hazard explosions, overlays and play input locks |
| M8 Level progression | Destroy monster, then `nextLevel` or `openPanel(levels)`/`selectLevel` | `progression.unlockedLevelIds`, `level.available`, `progression.canGoNext` | Victory unlocks next level; locked entries remain visible but not enterable |
| M9 Vehicle selection/unlocks | `openPanel(vehicles)`, `selectVehicle`, `closePanel` | `vehicle.available`, `vehicle.currentId`, `progression.unlockedVehicleIds`, `overlayBlocking` | Unlocked choice updates active vehicle; locked choice is rejected or preview-only and closing restores valid selection |
| M10 Settings/audio | `openPanel(settings)`, `toggleSetting`, `closePanel` | `ui.audio`, `activePanel`, `overlayBlocking`, `canInteractWithPlayfield` | Settings block playfield input while open, persist when available, and never prevent start/retry/driving |
| M11 P2 special threats | Later-level scenario, hold/route through threat path | `road.hazardsVisible`, `road.lastHazardEffect`, `vehicle.healthRatio`, `motion.speedRatio`, `playfield.visibleMotionRevision` | Included threats show warning/trajectory and only affect vehicle on visible contact |
| M12 P2 destruction guidance | Repeated failed/partial runs or legal target-zone scenario | `monster.targetZones`, `ui.hintVisible`, `playfield.sceneSummary.visibleElements` | Hints/reticles/camera guidance are observable and do not permanently block driving |
| M13 P2 polish/progression depth | Continue through later unlocked content | `level.available`, `vehicle.available`, `progression.newRewardVisible`, `playfield.visibleMotionRevision` | Variety and rewards add visible depth without replacing P1 mechanics |

## 7. External Postconditions

Public contract checks may combine snapshot data with browser-observable evidence, but must stay implementation-neutral:

- A visible primary play scene must be nonblank/readable and include the semantic objects named by `playfield.sceneSummary.visibleElements`.
- Real pointer/touch/mouse interactions inside `playfield.bounds` must produce the same gameplay effects as corresponding public actions.
- `phase === "playing"` or a road/flight/impact phase must not coexist with a blocking preparation panel over the playfield.
- HUD/result/menu surfaces may use any text or layout, but `ui` snapshot fields must reflect the same state: speed feedback while moving, monster health when target is alive, vehicle damage when hurt, and result choices after terminal states.
- Canvas/WebGL/DOM implementations are all acceptable if they expose the same semantic playfield, controls, and snapshots.

## 8. Rejection And Invariants

- Locked levels cannot become `level.currentId` through `selectLevel`.
- Locked vehicles cannot persist as `vehicle.currentId` after `closePanel`.
- Preparation panels reject or ignore `pressPlayfield`; vehicle speed, progress, and phase must not advance from panel-covered driving input.
- Active sprint, flight, impact, waiting, and victory phases reject preparation-panel opening unless the GDD state allows a result/next-step panel.
- Victory locks reward eligibility; additional driving input after victory cannot reduce monster health further or unlock the same reward again.
- Failure/continue/retry clears active speed, input hold, hazard explosions, vehicle damage effects, airborne/impact flags, blocking overlays, and stale hints before the next attempt becomes playable.
- Damage, slowdown, knockback, monster health loss, debris, and result changes must be caused by legal player-triggered motion/contact paths, not by direct setup or passive invisible mutation.

## 9. Explicit Non-Contracts

The TDD does not require any specific renderer, engine, DOM structure, CSS selector, asset, exact wording, fixed coordinate, fixed canvas size, private function, private variable, exact physics formula, collision algorithm, update-loop order, or source file layout.

Tests built from this file must use the public interface, real user inputs, semantic bounds/target zones, snapshot summaries, and external postconditions. They must not call private functions or inspect private entity arrays.
