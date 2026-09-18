# GunGateGang TDD Public Contract

This document defines only the public testable contract used to translate the gameplay confirmed in `game-spec.md` and `design-doc.md` into stable inputs, snapshots, and postconditions. The implementation may freely choose its rendering, engine, layout, and internal structure, but it must expose the same player-level testable surface.

This contract must not be interpreted as a source-code structure requirement: tests must not depend on private functions, private variables, a fixed DOM structure, fixed canvas dimensions, fixed coordinates, specific algorithms, resource names, or exact UI copy.

## 1. Public Test API

The implementation must provide the following after the page finishes loading:

```javascript
window.__gameTest = {
  reset(): Snapshot,
  getSnapshot(): Snapshot,
  input(action: PlayerAction): Snapshot,
  loadScenario(name: ScenarioName): Snapshot
}
```

### Method Semantics

- `reset()`: Return to a clean state after game startup. It may remain on the start screen; it must not retain enemies, projectiles, gates, obstacles, score, weapon, or squad damage from the previous run.
- `getSnapshot()`: Return the current stable summary without advancing rules or creating collisions, rewards, damage, wins, or losses.
- `input(action)`: Perform a coarse-grained action available to the player, or wait for natural progression. It must not directly set score, count, weapon, target health, win/loss state, collision results, or rewards.
- `loadScenario(name)`: Load a legal precondition used to let tests reliably trigger subsequent player paths. A scenario may only construct an in-run state defined by the GDD and cannot apply the result to be verified in advance.

All methods must return a complete `Snapshot`. An invalid action or invalid scenario should not throw an uncaught exception; it should return `ok:false` or leave state unchanged, and express the rejection in `lastAction.accepted` / `lastAction.reason`.

## 2. Player Action Schema

`PlayerAction` is a player-level action, not an internal control instruction.

| Action | Schema | Valid Use | Required observable result |
|---|---|---|---|
| `start` | `{ type:"start", via?:"pointer"|"touch"|"keyboard"|"api" }` | Enter a run from the start screen | `phase` changes to `playing`, the main scene becomes interactive, and the default squad, zero score, and default weapon are observable |
| `restart` | `{ type:"restart", via?:"pointer"|"touch"|"keyboard"|"api" }` | Restart after results | The new run clears the previous run's state and restores the default count, default weapon, zero score, and an interactive main scene |
| `holdDirection` | `{ type:"holdDirection", direction:"left"|"right", durationMs?:number, via?:"keyboard"|"touch"|"api" }` | Sustain horizontal movement during play | The squad center moves toward the same side of the screen; opposite directions produce opposite horizontal results |
| `releaseDirection` | `{ type:"releaseDirection", via?:"keyboard"|"touch"|"api" }` | Release directional input | The horizontal movement trend stops or significantly trends toward stopping; forward progression and automatic firing are not disabled as a result |
| `tapSide` | `{ type:"tapSide", side:"left"|"right", durationMs?:number }` | Touch half-screen semantic input | Equivalent to a sustained touch in the corresponding direction; the left and right halves cannot produce horizontal movement in the same direction |
| `pressKey` | `{ type:"pressKey", key:"ArrowLeft"|"ArrowRight"|"A"|"D", durationMs?:number }` | Keyboard semantic input | Equivalent to holding the corresponding direction key |
| `wait` | `{ type:"wait", durationMs:number }` | The player does not change input and waits for the world to progress naturally | Enemies, gates, obstacles, projectiles, or waves progress naturally according to the current state; score or weapons must not be granted from nothing |
| `pause` | `{ type:"pause" }` | When an optional panel exists | If the implementation supports pause, `phase` changes to `paused` and the main scene is not interactive; if unsupported, it should be rejected without changing the play state |
| `resume` | `{ type:"resume" }` | After an optional pause | If the implementation supports pause, return to `playing`; if unsupported, it should be rejected without changing state |

`durationMs` is the suggested duration of sustained input or waiting, not a fixed frame count. The implementation may advance using its own time step, but identical action sequences must produce the same class of observable postconditions.

## 3. Scenario Schema

The candidate values for `ScenarioName` are listed below. Each scenario must be a legal precondition; tests must then trigger the result through a player-level action.

| Scenario | Legal precondition | Trigger action family | Expected triggerable result |
|---|---|---|---|
| `fresh_menu` | Clean startup, not yet started | `start` | Enter play |
| `fresh_run` | A new run has just started, with the default squad, zero score, default weapon, and an interactive main scene | `holdDirection` / `tapSide` / `pressKey` / `wait` | Horizontal movement, release, automatic progression, and firing are observable |
| `gate_choice` | During play, at least one positive gate and one negative gate are ahead, neither has been resolved, and the player has time to move laterally and choose a route | Align with a route using `holdDirection` or `tapSide`, then `wait` | After passing through the corresponding gate, count increases or decreases, and the gate becomes inactive and is resolved only once |
| `shootable_gate` | During play, a gate that can be hit by automatic fire is ahead, has not been used, and its value is not in an unchangeable state | `wait`, or move laterally and then `wait` | After automatic projectiles hit, the gate value or visible gate state changes |
| `obstacle_weapon` | During play, an obstacle with durability and a weapon-reward prompt is ahead, has not been destroyed, and the player has time to let firepower cover it | Move laterally to cover it and then `wait` | Durability decreases; if destroyed, the weapon change and acquisition feedback are observable |
| `enemy_pressure` | During play, a regular enemy is ahead, has not yet contacted the squad, and can be handled by automatic fire or approach naturally | `wait`, with lateral adjustment if necessary | The enemy moves/tracks, is killed for score, or causes member loss after contact |
| `near_failure` | During play, the squad count is very low, a visible threat is ahead, and failure has not yet occurred | The player does not evade, or waits for the threat to make contact | After the entire squad is lost, results begin and play input is locked |
| `weapon_upgrade_comparison` | During play, an upgraded weapon can be obtained through an obstacle, and the upgrade has not yet been obtained | Move laterally to cover the obstacle and then `wait` | The weapon changes from the default to the upgrade, and the firing rhythm/range/coverage summary changes |
| `post_result` | Results have been entered because the entire squad was lost, and the final score is visible | `holdDirection` / `wait` / `restart` | Play input is ineffective; `restart` starts a clean new run |
| `boss_pressure` | P2: During play, a boss has appeared but has not yet been defeated or completed its attack | Move laterally, wait for automatic fire, and wait through the warning and attack window | Boss health, warning, attack member loss, or high score for defeat is observable |

Prohibited scenarios: directly setting victory/failure, directly granting score, directly granting a weapon, directly completing obstacle destruction, directly creating an already-collided state, directly marking a gate as used, directly deducting health, or directly triggering the result of a boss attack.

## 4. Snapshot Schema

`Snapshot` must be a stable JSON-serializable summary. Fields may include implementation-defined additions, but the following fields must exist and preserve stable semantics:

```javascript
{
  ok: boolean,
  phase: "booting"|"menu"|"playing"|"paused"|"result",
  screen: "start"|"play"|"pause"|"result",
  result: "none"|"lose",
  canInteractWithPlayfield: boolean,
  overlayBlocking: boolean,
  score: number,
  finalScore: number|null,
  wave: number,
  difficultyTier: number,
  elapsedMs: number,
  team: TeamSummary,
  weapon: WeaponSummary,
  world: WorldSummary,
  hud: HudSummary,
  feedback: FeedbackSummary,
  lastAction: LastActionSummary
}
```

### Field Vocabulary

- `phase`: `menu` represents the start screen; `playing` represents main-loop progression; `paused` is used only for the optional pause; `result` represents failure results.
- `screen`: The category of the main screen currently visible to the player.
- `result`: P1 requires only `none` and `lose`.
- `score`: The score in the current run, which must be a non-negative integer.
- `finalScore`: A number only after results; returns to `null` after restart.
- `wave` / `difficultyTier`: Progress summaries that must be non-negative and may advance during sustained play.
- `canInteractWithPlayfield`: Whether the main scene can receive horizontal movement input.
- `overlayBlocking`: Whether a visible interface blocks input to the main scene. When `phase:"playing"`, it must not be `true`.

### TeamSummary

```javascript
{
  count: number,
  visibleCount: number,
  center: { screenX:number, screenY:number },
  bounds: { left:number, right:number, top:number, bottom:number },
  roadBoundsAtTeam: { left:number, right:number },
  horizontalVelocitySign: -1|0|1,
  atLeftBoundary: boolean,
  atRightBoundary: boolean,
  formationRevision: number,
  firepowerRevision: number
}
```

`count`, `visibleCount`, and the HUD count must remain synchronized; `count` must not be negative. `screenX/screenY` and bounds are product-level screen summaries and do not require fixed coordinates or a fixed resolution.

### WeaponSummary

```javascript
{
  kind: "default"|"rapid"|"longRange"|"heavy"|"upgraded"|"other",
  label: string,
  isDefault: boolean,
  fireCadenceClass: "slow"|"normal"|"fast",
  rangeClass: "short"|"normal"|"long",
  coverageClass: "narrow"|"normal"|"wide",
  revision: number
}
```

An upgraded weapon must differ from the default weapon in at least one of `fireCadenceClass`, `rangeClass`, or `coverageClass`, and that difference must be supported by visible projectile trajectories or target-handling results.

### WorldSummary

```javascript
{
  playfield: {
    orientation: "portrait"|"landscape"|"responsive",
    roadVisible: boolean,
    bounds: { left:number, right:number, top:number, bottom:number }
  },
  projectiles: {
    visibleCount: number,
    directionClass: "forward"|"mixed"|"none",
    revision: number
  },
  gates: Array<GateSummary>,
  obstacles: Array<ObstacleSummary>,
  enemies: Array<EnemySummary>,
  boss: BossSummary|null,
  worldMotionRevision: number
}
```

`worldMotionRevision` must change when enemies, gates, obstacles, projectiles, or waves progress naturally. It cannot be merely a frame count; it should reflect visible state changes to world objects.

### Target Summaries

```javascript
GateSummary = {
  id: string,
  polarity: "positive"|"negative",
  value: number,
  used: boolean,
  status: "approaching"|"reachable"|"processed"|"offscreen",
  center: { screenX:number, screenY:number },
  bounds: { left:number, right:number, top:number, bottom:number },
  valueRevision: number,
  limitState: "none"|"benefitMaxed"|"dangerMaxed"
}
```

```javascript
ObstacleSummary = {
  id: string,
  hp: number,
  hpMax: number,
  status: "approaching"|"damaged"|"destroyed"|"processed"|"offscreen",
  rewardWeaponKind: WeaponSummary["kind"],
  center: { screenX:number, screenY:number },
  bounds: { left:number, right:number, top:number, bottom:number },
  hpRevision: number
}
```

```javascript
EnemySummary = {
  id: string,
  kind: "grunt",
  status: "approaching"|"tracking"|"hit"|"defeated"|"contacted"|"offscreen",
  center: { screenX:number, screenY:number },
  bounds: { left:number, right:number, top:number, bottom:number },
  motionRevision: number
}
```

```javascript
BossSummary = {
  status: "approaching"|"warning"|"attacking"|"defeated",
  hp: number,
  hpMax: number,
  warningActive: boolean,
  attackRevision: number,
  center: { screenX:number, screenY:number },
  bounds: { left:number, right:number, top:number, bottom:number }
}
```

IDs only need to remain stable within a snapshot sequence and cannot expose internal object references. Lists may return only summaries of targets that are currently visible or about to become interactive.

### HudSummary And FeedbackSummary

```javascript
hud = {
  scoreVisible: boolean,
  teamCountVisible: boolean,
  weaponVisible: boolean,
  resultVisible: boolean,
  matchesSnapshot: boolean
}
```

```javascript
feedback = {
  scorePopups: number,
  weaponPickupVisible: boolean,
  damageOrHitRevision: number,
  gateChangeRevision: number,
  teamChangeRevision: number,
  resultVisible: boolean
}
```

The HUD does not require fixed copy, but it must let the player see count, score, weapon, and result state, and must remain consistent with the snapshot summary.

### LastActionSummary

```javascript
lastAction = {
  type: string|null,
  accepted: boolean,
  reason: string|null
}
```

Actions that are invalid or unavailable in the current phase must be observably rejected or leave the core state unchanged.

## 5. Feature Contract Matrix

| GDD mechanism | Contract input | Snapshot outputs | Required postcondition |
|---|---|---|---|
| M1 State flow | `reset`, `start`, `restart`, `loadScenario("post_result")` | `phase`, `screen`, `result`, `canInteractWithPlayfield`, `finalScore`, `world`, `team`, `weapon` | Starting enters play; failure enters results; restarting clears old-run objects and score and restores the default squad/weapon |
| M2 Horizontal control | `holdDirection`, `tapSide`, `pressKey`, `releaseDirection` | `team.center.screenX`, `horizontalVelocitySign`, `bounds`, `roadBoundsAtTeam` | Left input moves the center left, and right input moves it right; the movement trend stops after release; the squad does not leave the road |
| M3 Squad size | Perform horizontal movement/waiting after the `gate_choice`, `enemy_pressure`, or `near_failure` scenario | `team.count`, `visibleCount`, `formationRevision`, `firepowerRevision`, `hud` | Reinforcements and reductions synchronize scene members, HUD, and sense of firepower; count does not become negative |
| M4 Automatic firing | `wait` in a scenario with an actionable target | `projectiles`, `feedback.damageOrHitRevision`, target revision fields | Surviving members produce forward projectile trajectories; hits cause changes to the public summary of a gate, obstacle, enemy, or boss |
| M5 Gate rewards | Choose a route through horizontal movement after `loadScenario("gate_choice")` and wait | `gates[].used`, `team.count`, `feedback.teamChangeRevision` | Positive gates add members, negative gates remove members; used gates are not resolved repeatedly |
| M6 Firepower changes gates | Wait for automatic fire after `loadScenario("shootable_gate")` | `gates[].value`, `valueRevision`, `limitState`, `feedback.gateChangeRevision` | Hitting a gate changes its value or limit indication; the change cannot exist only in hidden state |
| M7 Obstacles and weapons | Move laterally to cover the obstacle after `loadScenario("obstacle_weapon")` and wait | `obstacles[].hp`, `status`, `weapon`, `feedback.weaponPickupVisible` | Durability decreases; destruction grants a weapon; only collision before destruction causes member loss |
| M8 Weapon differences | Obtain the upgrade after `loadScenario("weapon_upgrade_comparison")` | `weapon.kind`, `fireCadenceClass`, `rangeClass`, `coverageClass`, `projectiles.revision` | After the upgrade, the HUD updates and at least one firepower summary changes relative to the default |
| M9 Regular enemies | Wait or move laterally after `loadScenario("enemy_pressure")` | `enemies[].status`, `score`, `team.count`, `feedback.scorePopups` | The enemy moves/tracks; a kill adds score; contact removes a member and processes the enemy |
| M10 Boss P2 | Wait/move laterally after `loadScenario("boss_pressure")` | `boss`, `score`, `team.count`, `feedback.damageOrHitRevision` | Health feedback, warning, attack, or a high score for defeat is observable |
| M11 Progress P2 | Sustain play with `wait` | `wave`, `difficultyTier`, `worldMotionRevision` | After long-term survival, the progress summary advances and threats or target configurations change |
| M12 HUD synchronization | After any scoring, member change, weapon acquisition, or failure trigger | `hud.matchesSnapshot`, `hud.*Visible`, `feedback` | The HUD remains synchronized with the scene and snapshot rather than changing suddenly only at results |
| M13 Rejection and invariants | Post-result input, invalid action, repeated gate resolution, off-screen/processed objects | `lastAction`, `phase`, `team.count`, `score`, target statuses | Invalid input does not advance play outcomes; processed objects do not continue causing damage or awarding score; numeric bounds remain stable |

## 6. External Postconditions

In addition to the snapshot, the player-visible layer must also satisfy the following external postconditions:

- When `phase:"menu"`, a start entry point is present, and play input must not move the squad or produce combat rewards early.
- When `phase:"playing"`, the main scene is visible and interactive, and `overlayBlocking` must be `false`.
- After a run starts, the player can see the road, squad, count, score, and weapon summary.
- After a horizontal movement action, the squad's visible position changes in sync with `team.center`.
- After an automatic firing action sequence, if an actionable target exists, projectile trajectories or target-hit feedback must be visible.
- Reinforcements/reductions, scoring, weapon acquisition, and failure must all be expressed through the HUD or result layer, and `hud.matchesSnapshot` must be `true`.
- When `phase:"result"`, the result state and a restart entry point must be displayed; horizontal movement and waiting must not continue generating rewards, damage, or world progression.
- After restarting, no visible enemies, gates, obstacles, projectiles, feedback layers, or result blockers from the previous run should remain.

## 7. Rejection And Invariant Rules

- An action is not allowed to directly set count, score, weapon, health, durability, gate value, win/loss state, or collision results.
- A scenario is not allowed to preset completed rewards, failure, kills, collisions, weapon acquisition, or gate resolution.
- `team.count >= 0`, `team.visibleCount >= 0`, `score >= 0`, and target health/durability must not continue to appear as an interactive target after being processed.
- After `phase:"result"`, play actions other than `restart` must be rejected or cause no core state change.
- Used gates, destroyed obstacles, defeated enemies, off-screen objects, and objects from the previous run must not grant rewards or cause damage repeatedly.
- Left and right inputs must have distinguishable and opposite horizontal effects on screen; fake same-direction movement, reversed left and right, or both touchscreen sides moving in the same direction do not satisfy the contract.
- Waiting in an empty scene must not grant score, weapons, or change the squad count from nothing.

## 8. Review Notes For Downstream Checks

L2 behavior checks should prioritize real mouse, touch, and keyboard paths to verify player operability, and then use this public interface to read a stable summary. `__gameTest.input` is suitable for contract checks or supplementary verification after legal setup and should not replace P1 core player paths.

If any test requires an observable field or action not declared in this document, it must first return to `game-spec.md` / `design-doc.md` to determine whether a gameplay basis already exists; if no gameplay basis exists, the new requirement cannot be hidden in a check.
