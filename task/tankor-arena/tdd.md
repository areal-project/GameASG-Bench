# Tankor Arena TDD Public Contract

## Scope

This file defines the portable public test contract for Tankor Arena. It converts the gameplay already defined in `game-spec.md` and `design-doc.md` into player-level actions, legal setup scenarios, stable snapshot summaries, and observable postconditions.

The contract must not require a specific engine, render tree, file layout, private state object, private function name, fixed screen coordinate, exact UI wording, exact art asset, or physics formula. Implementations may choose any internal structure as long as these public inputs and observable results are stable.

## Public Test Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

Method semantics:

- `reset(options?)` returns a clean game at the normal initial playable state or a skippable start state that can reach play through `input({type:"start"})`. It clears old combat objects, terminal overlays, transient effects, active projectiles, and temporary powerups.
- `input(action)` performs one player-level action or time passage equivalent to normal play. It returns the resulting `Snapshot`. Invalid actions must not throw; they return a stable rejection result or leave gameplay state unchanged with a rejection reason.
- `getSnapshot()` returns a stable summary of user-visible state. It must not expose internal object graphs, implementation-specific IDs, raw engine instances, or private mutable references.
- `loadScenario(name, options?)` creates a legal precondition from the GDD, not a completed result. A loaded scenario must still require player-level actions to trigger shooting, collision, damage, pickup, level completion, pause, terminal state, or restart outcomes.

## Action Schema

Every action uses `{ type: string }` plus the fields below. Equivalent keyboard, pointer, touch, and visible-control paths are allowed, but the semantic action must represent what a player could do.

| Action | Required fields | Optional fields | Player meaning |
|---|---|---|---|
| `start` | none | `method: "key"|"pointer"|"touch"|"auto"` | Skip intro or enter play. |
| `holdMove` | `direction: "forward"|"backward"|"left"|"right"` | `durationMs` | Hold a movement or turning input. |
| `releaseMove` | none | `direction` | Release movement or turning input. |
| `tapMove` | `direction` | `durationMs` | Short movement or turning input. |
| `joystick` | `x`, `y`, `phase: "start"|"move"|"end"` | `durationMs` | Touch joystick displacement. Negative/positive `x` means left/right turn intent; negative/positive `y` means forward/back intent in screen joystick space. |
| `fire` | none | `method: "key"|"button"|"touch"` | One player fire attempt. |
| `holdFire` | none | `durationMs` | Hold fire control; must still respect cooldown or ammo limits. |
| `aimAt` | `target: "enemy"|"obstacle"|"openSpace"` | `targetId` from snapshot summaries | Rotate or steer through player-level control until the reticle/forward direction is aimed at a semantic target. |
| `toggleCamera` | none | `method` | Switch between supported combat views. |
| `pause` | none | `method` | Open pause state. |
| `resume` | none | `method` | Return from pause to play. |
| `restart` | none | `method` | Restart after terminal state, or reset through an available restart control. |
| `wait` | `durationMs` | none | Let normal game time advance. Has no effect while paused or terminal except allowed UI transitions. |
| `driveToward` | `target: "enemy"|"obstacle"|"powerup"|"arenaBoundary"|"openSpace"` | `targetId`, `durationMs` | Use normal movement/turning controls to approach a semantic target. |

Rejected actions:

- Unknown `type`, invalid enum values, negative durations, or non-player mutations must be rejected without changing score, level, health, lives, enemy state, obstacle state, powerup ownership, or terminal result.
- No action may directly set score, health, lives, level, cooldown, result, enemy damage, obstacle damage, projectile hit, powerup collection, collision, or victory.

## Scenario Schema

`loadScenario(name)` may be used only for legal, reachable preconditions needed to make checks deterministic. Scenarios must not pre-apply the outcome under test.

| Scenario | Legal precondition | Player-level trigger required for postcondition |
|---|---|---|
| `fresh_battle` | Playable first-level battle with player, at least one active enemy, obstacles, HUD, reticle, minimap, and no terminal overlay. | `holdMove`, `fire`, `pause`, `toggleCamera`, or normal combat actions. |
| `mobile_controls_ready` | Same as a playable battle, with touch controls available or discoverable on a touch-capable viewport. | `joystick` and touch `fire`. |
| `aimable_enemy` | A living enemy is visible or reachable by normal steering/aiming; player weapon is ready. Enemy is not already destroyed and no hit has been pre-applied. | `aimAt({target:"enemy"})` followed by `fire` and `wait`. |
| `aimable_obstacle` | A damageable obstacle is visible or reachable by normal steering/aiming; player weapon is ready. Obstacle is not already destroyed. | `aimAt({target:"obstacle"})` followed by `fire` and `wait`. |
| `cooldown_ready` | Player is in active play and can attempt a normal shot. | `fire` causes cooldown/ammo to become not ready. |
| `cooldown_recovering` | A legal state after a recent shot where cooldown/ammo has not fully recovered; no extra shot has been granted. | `fire` or `holdFire` should be rejected or produce no extra projectile until recovery; `wait` can restore readiness. |
| `enemy_pressure` | One or more active enemies can move, aim, or fire toward the player through normal combat rules. Player is alive. | `wait`, `holdMove`, and evasive movement can produce enemy motion, enemy fire, damage, or avoidance. |
| `near_obstacle` | Player is near but not overlapping an obstacle, with room to drive into or around it. | `driveToward({target:"obstacle"})` or movement input triggers blocking/deflection evidence. |
| `near_boundary` | Player is near but inside an arena boundary. | Movement toward the boundary triggers containment evidence. |
| `one_enemy_remaining` | Current level has exactly one active enemy that can still be damaged; level is not complete. | Aim and fire until the enemy is destroyed, then level completion can occur. |
| `higher_level` | A legal higher-level battle with increased threat, more enemies, stronger enemy, or boss category as defined by the GDD. It is not pre-completed. | Normal combat actions produce higher-level enemy pressure, damage, score, or completion. |
| `boss_battle` | A legal boss or boss-like high-threat enemy is active and distinguishable, if implemented. It is not already defeated. | Movement, aim, and fire can damage or defeat it; enemy pressure remains observable. |
| `powerup_visible` | A reachable collectible powerup is visible on the battlefield and not already collected. | `driveToward({target:"powerup"})` can collect it and change temporary status. |
| `paused_play` | A legal playable battle after pause has been triggered; combat is currently paused. | `resume` returns to play; `holdMove`, `fire`, and `wait` during pause must not create combat results. |

Terminal state is not a loadable scenario. It must be reached from a legal battle through player-level combat exposure, enemy pressure, and the normal life-loss chain before `restart` can be tested.

If a scenario cannot be represented without directly awarding victory, defeat, damage, collision, pickup, boost, cooldown recovery, or reward, it must not be exposed.

## Snapshot Schema

`Snapshot` is a plain serializable object. Fields may include `null` when not applicable, but required top-level keys must exist.

```javascript
{
  ok: boolean,
  reason?: string,
  phase: "boot"|"intro"|"playing"|"paused"|"transition"|"respawning"|"gameOver",
  screen: "intro"|"play"|"pause"|"levelComplete"|"result",
  canInteractWithPlayfield: boolean,
  overlayBlocking: boolean,
  cameraMode: "thirdPerson"|"firstPerson",
  level: number,
  score: number,
  lives: number,
  health: { current: number, max: number, status: "healthy"|"warning"|"critical"|"empty" },
  player: PlayerSummary,
  weapon: WeaponSummary,
  entities: EntitySummary,
  targets: TargetSummary,
  minimap: MinimapSummary,
  hud: HudSummary,
  result: ResultSummary,
  progress: ProgressSummary,
  controls: ControlSummary,
  render: RenderSummary,
  lastEvent?: EventSummary
}
```

### PlayerSummary

```javascript
{
  alive: boolean,
  visible: boolean,
  screenX: number|null,
  screenY: number|null,
  headingScreenAngle: number|null,
  movingState: "idle"|"accelerating"|"coasting"|"braking"|"reversing",
  turningState: "none"|"left"|"right"|"damping",
  speedTrend: "increasing"|"decreasing"|"steady"|"reversing"|"stopped",
  turnTrend: "leftIncreasing"|"rightIncreasing"|"damping"|"steady"|"none",
  boundaryContact: boolean,
  obstacleContact: boolean,
  damageFeedbackActive: boolean,
  activePowerups: Array<"speed"|"shield"|"repair"|"doubleCannon"|"stealth">
}
```

`screenX` and `screenY` are semantic screen-space summaries of the player tank or camera-reticle relationship. They are used only for relative direction and visibility checks, never as fixed coordinates.

### WeaponSummary

```javascript
{
  ready: boolean,
  cooldownRatio: number,
  ammoRatio: number|null,
  projectileCount: number,
  playerProjectileCount: number,
  enemyProjectileCount: number,
  lastFireAccepted: boolean,
  lastFireRejectedReason?: "cooldown"|"paused"|"terminal"|"transition"|"notPlaying",
  muzzleFeedbackRevision: number,
  projectileMotionRevision: number
}
```

`cooldownRatio` and `ammoRatio` are normalized from `0` to `1`, where `1` means ready/full.

### EntitySummary

```javascript
{
  enemyCount: number,
  activeEnemyCount: number,
  destroyedEnemyCount: number,
  bossPresent: boolean,
  obstacleCount: number,
  damagedObstacleCount: number,
  destroyedObstacleCount: number,
  powerupCount: number,
  visibleProjectileCount: number,
  explosionRevision: number,
  enemyMotionRevision: number,
  worldMotionRevision: number
}
```

Revision fields must increase when the corresponding user-visible category changes after player input or normal play. They are not frame counters and must not advance only because time exists.

### TargetSummary

```javascript
{
  reticleVisible: boolean,
  lockState: "none"|"enemy"|"obstacle",
  aimTargetId: string|null,
  aimTargetKind: "enemy"|"obstacle"|null,
  visibleTargets: Array<{
    id: string,
    kind: "enemy"|"obstacle"|"powerup",
    screenX: number|null,
    screenY: number|null,
    bounds?: { left: number, top: number, width: number, height: number },
    targetable: boolean,
    active: boolean
  }>
}
```

Target IDs are public semantic handles created for testing summaries. They must be stable during a snapshot sequence but need not match implementation names.

### MinimapSummary

```javascript
{
  visible: boolean,
  playerVisible: boolean,
  enemyVisibleCount: number,
  obstacleVisibleCount: number,
  revision: number
}
```

The minimap revision must change when tracked battlefield positions change enough to be visible to the player.

### HudSummary

```javascript
{
  visible: boolean,
  healthVisible: boolean,
  livesVisible: boolean,
  scoreVisible: boolean,
  levelVisible: boolean,
  cooldownVisible: boolean,
  reticleVisible: boolean,
  statusMessage: "none"|"cooldown"|"damage"|"levelComplete"|"paused"|"gameOver"|"powerup",
  revision: number
}
```

### ResultSummary

```javascript
{
  state: "none"|"levelComplete"|"gameOver",
  finalScore: number|null,
  finalLevel: number|null,
  restartAvailable: boolean,
  leaderboardAvailable: boolean|null
}
```

Leaderboard availability is optional. A failed or absent leaderboard must not block result and restart.

### ProgressSummary

```javascript
{
  levelTransitionActive: boolean,
  nextLevelAvailable: boolean,
  enemiesRequiredForCompletion: number,
  completedLevels: number,
  oldProjectilesClearedOnTransition: boolean|null
}
```

### ControlSummary

```javascript
{
  startAvailable: boolean,
  pauseAvailable: boolean,
  resumeAvailable: boolean,
  restartAvailable: boolean,
  cameraToggleAvailable: boolean,
  fireAvailable: boolean,
  joystickAvailable: boolean,
  semanticControls: Array<{
    action: "start"|"pause"|"resume"|"restart"|"camera"|"fire"|"joystick",
    visible: boolean,
    enabled: boolean,
    bounds?: { left: number, top: number, width: number, height: number }
  }>
}
```

Visible controls may be implemented as buttons, keyboard shortcuts, touch regions, or accessible controls. Bounds are semantic hit regions when available and must be discovered at runtime, not hard-coded.

### RenderSummary

```javascript
{
  playfieldVisible: boolean,
  playfieldBounds?: { left: number, top: number, width: number, height: number },
  nonBlank: boolean,
  visualRevision: number,
  playerVisible: boolean,
  enemyVisible: boolean,
  obstacleVisible: boolean,
  projectileVisible: boolean,
  explosionVisible: boolean
}
```

`visualRevision` must be suitable for before/after comparisons after explicit gameplay input. It may be based on any public visual evidence, but it must not require fixed pixels, exact colors, or a specific rendering technology.

### EventSummary

```javascript
{
  type: "none"|"move"|"turn"|"fire"|"cooldownReject"|"hitEnemy"|"destroyEnemy"|"hitObstacle"|"destroyObstacle"|"playerDamaged"|"lifeLost"|"levelComplete"|"powerupCollected"|"pause"|"resume"|"restart"|"cameraChanged",
  accepted: boolean,
  visibleFeedback: boolean,
  scoreDelta: number,
  healthDelta: number,
  levelDelta: number
}
```

## External Observable Postconditions

These postconditions are part of the public contract and may be verified through snapshot, HUD, visible controls, or render summaries:

- When `phase === "playing"`, the playfield is visible, not blank, and not blocked by an unrelated overlay.
- Starting, pausing, resuming, terminal result, and restart have observable screen or control-state changes.
- HUD summaries for health, lives, score, level, cooldown, reticle, and minimap visibility stay synchronized with gameplay deltas.
- Movement and turning actions cause player position, screen-space evidence, heading, minimap, or render revision to change in the expected direction category.
- Releasing movement or turning shifts motion toward coasting/damping rather than immediate unreported teleporting.
- Opposite movement or turning input changes the trend toward braking, reversing, or opposite rotation.
- Firing while ready creates accepted fire evidence, projectile or muzzle feedback, and a cooldown/ammo change.
- Firing while not ready is rejected or has no extra projectile, no extra score, and an observable cooldown/not-ready state.
- Enemy and world motion evidence changes during active combat without requiring player-only API mutation.
- Damage, destruction, score, level completion, powerup collection, and terminal state are observable through at least one stable snapshot field and one player-visible surface.
- Pause, transition, respawn delay, and terminal states prevent normal combat outcomes from movement, fire, enemy attacks, projectile hits, score changes, and level completion.
- Restart clears terminal state, old projectiles, old transient effects, old powerups, and returns score, lives, health, level, enemies, obstacles, HUD, and controls to a clean playable baseline.

## Feature Contract Matrix

| GDD mechanism | Contract trigger | Snapshot outputs | Required postcondition |
|---|---|---|---|
| M1 battlefield startup | `reset`, `start`, `fresh_battle` | `phase`, `render`, `controls`, `hud`, `minimap`, `entities` | Playfield is visible/nonblank, HUD/minimap/reticle are observable, and playfield is not blocked while playing. |
| M2 movement and weight | `holdMove`, `releaseMove`, `tapMove`, `joystick` | `player.movingState`, `speedTrend`, `turningState`, `turnTrend`, `minimap.revision`, `render.visualRevision` | Held input changes motion trend; release damps; opposite input changes trend; no teleport or boundary escape. |
| M3 camera view | `toggleCamera` | `cameraMode`, `targets.reticleVisible`, `controls.cameraToggleAvailable`, `render.visualRevision` | Camera mode changes while movement/fire semantics remain valid. |
| M4 aiming and lock feedback | `aimAt` from `aimable_enemy` or `aimable_obstacle` | `targets.lockState`, `aimTargetKind`, `reticleVisible`, `visibleTargets` | Aiming can produce enemy or obstacle target feedback without requiring a fixed coordinate. |
| M5 fire, projectile, cooldown | `fire`, `holdFire`, `cooldown_ready`, `cooldown_recovering` | `weapon`, `lastEvent`, `hud.cooldownVisible`, `render.projectileVisible` | Ready fire is accepted and starts cooldown; not-ready fire does not create unlimited extra shots. |
| M6 enemy AI and fire | `enemy_pressure`, `wait`, evasive movement | `entities.enemyMotionRevision`, `weapon.enemyProjectileCount`, `worldMotionRevision`, `lastEvent` | Active enemies move, turn, fire, or pressure the player through visible state changes. |
| M7 damage, lives, death | enemy hit or collision reached through `enemy_pressure` | `health`, `lives`, `player.damageFeedbackActive`, `phase`, `result` | Damage reduces health/lives with feedback; terminal locks combat when lives are exhausted. |
| M8 enemy hit and score | `aimAt({target:"enemy"})`, `fire`, `wait` | `entities.activeEnemyCount`, `destroyedEnemyCount`, `score`, `explosionRevision`, `lastEvent` | Enemy hit/destroy produces feedback and score delta; misses do not award kill score. |
| M9 obstacle blocking/destruction | `near_obstacle`, `aimable_obstacle`, movement or fire | `player.obstacleContact`, `entities.damagedObstacleCount`, `destroyedObstacleCount`, `render.explosionVisible` | Obstacles block or deflect movement and can show hit/destruction feedback. |
| M10 level completion | `one_enemy_remaining`, aim/fire until final enemy destroyed | `result.state`, `phase`, `level`, `progress`, `entities`, `weapon.projectileCount` | Completion requires enemy elimination, clears old shots, restricts combat during transition, and advances level. |
| M11 pause/resume | `pause`, `paused_play`, `resume`, `wait` | `phase`, `screen`, `canInteractWithPlayfield`, `overlayBlocking`, `hud.statusMessage` | Pause blocks normal combat changes; resume restores play without resetting battle state. |
| M12 terminal/restart | reach terminal through `enemy_pressure`, then `restart` | `result`, `phase`, `score`, `lives`, `health`, `level`, `entities`, `weapon` | Terminal shows result and locks combat; restart returns to a clean initial battle. |
| M13 HUD/minimap sync | movement, damage, fire, score, level actions | `hud`, `minimap`, `health`, `score`, `level`, `weapon` | Visible summaries change with real gameplay deltas and are not static decoration. |
| M14 boss/high-level pressure | `higher_level`, `boss_battle`, combat actions | `entities.bossPresent`, `activeEnemyCount`, `health`, `score`, `result` | Boss or higher-level threat is distinguishable when present and remains defeatable through normal combat. |
| M15 powerups | `powerup_visible`, `driveToward({target:"powerup"})` | `entities.powerupCount`, `player.activePowerups`, `hud.statusMessage`, `lastEvent` | Pickup gives visible feedback and temporary status without directly granting permanent unlimited advantage. |
| M16 advanced powerups | scenario only if feature is implemented | `player.activePowerups`, `weapon`, `entities`, `lastEvent` | Double-cannon, stealth, or hidden rewards remain temporary or bounded and are triggered by visible pickup or obstacle reward paths. |
| M17 records | terminal result | `result.leaderboardAvailable`, `result.restartAvailable` | Optional record display must not block local result or restart. |
| M18 tuning/editor mode | separate public mode only if implemented | `phase`, `controls`, `entities` | Optional tuning mode is separated from normal combat and cannot be required for P1 completion. |
| M19 atmosphere | normal play `wait` | `render.visualRevision`, `entities.worldMotionRevision` | Optional atmosphere may add visual motion but cannot substitute for core combat evidence. |

## Invariants and Rejection Rules

- `score`, `level`, `lives`, `health.current`, `enemyCount`, `projectileCount`, and `powerupCount` must remain finite numbers and within their declared semantic ranges.
- `health.current` is between `0` and `health.max`; `lives` and counts are never negative.
- Score increases only after observable combat reward events; waiting alone in a quiet state must not award kill score.
- Level completion requires no active enemies in the current level and cannot be caused by direct scenario loading.
- Cooldown/ammo limits prevent unlimited accepted fire attempts.
- Destroyed enemies cannot continue to create damage or fire evidence.
- Old projectiles and expired transient effects do not persist across restart or completed level transition.
- Pause, transition, respawn, and terminal phases reject normal combat actions without hidden score, damage, level, enemy, obstacle, or powerup deltas.
- Camera switching may change viewpoint and reticle presentation but must not invert the semantic meaning of movement, turning, aiming, or fire.
- Optional P2 features may be absent only when the GDD marks them P2/Cut; if present, they must obey the same player-triggered and observable-result contract.

## Anti-Cheat Contract Boundaries

The public interface must not provide or require:

- Direct score, health, lives, level, cooldown, ammo, enemy damage, obstacle damage, boss damage, powerup state, collision state, or terminal-result setters.
- A scenario that starts after the checked result has already happened, such as already-destroyed final enemy, already-collected powerup, already-collided obstacle, already-awarded score, already-completed level, already-terminal defeat, or pre-fired projectile hit.
- Raw internal arrays, engine objects, private object references, private function names, internal timers, fixed render-loop order, fixed physics constants, source-specific element identifiers, exact text labels, or fixed pixel coordinates.
- Contract success based only on `{ ok: true }`, static element presence, frame count, static text, or a single unchanged snapshot field.

Every core check derived from this TDD must follow `trigger -> observable result`: a legal precondition, one or more player-level actions, a snapshot or user-visible state delta, and an invariant or rejection reason that an empty shell cannot satisfy.
