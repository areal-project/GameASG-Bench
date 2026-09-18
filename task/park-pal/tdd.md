# Park Pal TDD Public Test Contract

This document defines only Park Pal's public testable surface, used to align player-level input, stable state summaries, and external postconditions across different implementations. Gameplay scope is governed by `game-spec.md` and `design-doc.md`; this document must not add gameplay requirements or require private implementations, a fixed DOM structure, fixed coordinates, source-code naming, a specific animation algorithm, or a particular rendering technology.

## 1. Public Interface

The implementation should expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  loadScenario(name, options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot
}
```

Interface semantics:

- `reset(options?)`: Return to an interactive launch state or the initial playing state of a specified unlocked level; it must not directly set victory, failure, rewards, vehicle removal, or best performance.
- `loadScenario(name, options?)`: Enter a valid precondition situation enumerated in this document. A scenario may only construct menus, levels, pause, settings, hint cooldown, countdown pressure, or parking situations already defined by the GDD; it must not pre-apply the postcondition being verified.
- `input(action)`: Perform one major action understandable to a player and return a stable summary after the action settles. If the action triggers animation, it may return `motionState: "animating"`, but a subsequent `getSnapshot()` must be able to observe the result after the animation completes.
- `getSnapshot()`: Return the current stable summary without advancing rules, automatically completing actions, or modifying the situation.

The interface may be tested together with real mouse, touch, and button actions. `__gameTest.input` is the contract path and does not replace the real player path; behavioral tests should still be able to trigger equivalent results through visible controls or semantic hit targets.

## 2. Action Schema

All action values are player-level or time-elapse actions:

```typescript
type Action =
  | { type: "start" }
  | { type: "openLevelSelect" }
  | { type: "selectLevel", levelIndex: number }
  | { type: "tapVehicle", vehicleId: string }
  | { type: "tapAt", screenX: number, screenY: number }
  | { type: "touchVehicle", vehicleId: string }
  | { type: "hint" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restart" }
  | { type: "nextLevel" }
  | { type: "backToMenu" }
  | { type: "openSettings" }
  | { type: "toggleSetting", setting: "music" | "sound" }
  | { type: "wait", seconds: number }
```

General action postcondition rules:

- A valid action must return a Snapshot reflecting at least one action-related change to state, HUD, panel, vehicles, or progress.
- An invalid action must not throw an uncaught exception; it should return `lastAction.ok: false` or leave the state unchanged and record the rejection reason.
- `tapAt` can only represent a player clicking a semantic region on the screen; tests should use vehicle centers or hit targets exposed by the Snapshot and must not guess fixed offsets.
- `wait` represents only ordinary time passing and is used to observe the countdown, hint cooldown, or animation completion; it must not be implemented by directly setting win/loss, cooldown, or rewards.

## 3. Scenario Schema

Optional enumeration for `loadScenario(name)`:

| Scenario | Valid precondition situation | Postcondition that can be triggered |
|---|---|---|
| `fresh_start` | Launch entry point or main menu, with no level selected yet | `start` or `openLevelSelect` enters the selectable-level flow |
| `level_select_with_progress` | At least the first level is unlocked, and level selection shows unlocked/locked summaries; if normal gameplay records exist, a completion summary may be shown | `selectLevel` enters an unlocked level; selecting a locked level should be rejected |
| `tutorial_level_start` | Initial situation of the first type of small, completable level, with no vehicles moved and a move count of 0 | `tapVehicle` can trigger movement or rejection; `hint` can mark a candidate vehicle |
| `movable_vehicle_ready` | During play, at least one vehicle has movable space ahead or can drive beyond the boundary | `tapVehicle`/`touchVehicle` triggers a move-count increase and vehicle movement or departure |
| `blocked_vehicle_ready` | During play, at least one vehicle is blocked ahead in the same lane and has no complete grid space to move into | `tapVehicle`/`touchVehicle` triggers a move-count increase and in-place rejection feedback |
| `mixed_direction_ready` | During play, vehicles with at least two of the up, down, left, and right orientations are visible, and at least one vehicle can move | After the corresponding vehicle is clicked, its screen movement direction matches its orientation |
| `hint_available` | During play, before a terminal state, with no animation, the hint not in cooldown, and a reasonable next move available in the current situation | `hint` marks a candidate vehicle, leaves moves and the vehicle situation unchanged, and enters cooldown |
| `hint_cooling_down` | During play, with the hint in cooldown and a valid vehicle situation | Another `hint` is rejected without moving vehicles or increasing moves |
| `pause_ready` | During play, before a terminal state, with the timer running | `pause` opens a blocking overlay and stops the timer; `resume` resumes it |
| `countdown_pressure` | During play, before a terminal state, with low but greater-than-0 remaining time and a valid vehicle situation | After enough time passes through `wait`, failure occurs; vehicle clicks before failure are still handled according to the rules |
| `settings_ready` | The settings entry point is available from the menu or during play | `openSettings` and `toggleSetting` change the visible music/sound-effect toggle states |

Scenario prohibitions:

- A cheating situation that has already won, already lost, already settled rewards, already removed the target vehicle, already completed a purchase/leaderboard submission, or already triggered a hint result must not be loaded to pass the corresponding test.
- Scores, star ratings, best performance, vehicle removal, hint hits, win/loss results, or collision/blocking results must not be set directly.
- If a scenario is used to test failure, it must be triggered from `countdown_pressure` through `wait`; if it is used to test victory or level progress, all vehicles must be cleared from a valid playing situation through consecutive `tapVehicle` or `touchVehicle` actions.

## 4. Snapshot Schema

Snapshot must be a stable, implementation-independent summary:

```typescript
type Snapshot = {
  phase: "loading" | "menu" | "levelSelect" | "playing" | "paused" | "result" | "settings";
  result: "none" | "win" | "lose";
  activeOverlay: "none" | "pause" | "victory" | "failure" | "settings" | "levelSelect" | "leaderboard";
  overlayBlocking: boolean;
  canInteractWithPlayfield: boolean;

  level: {
    currentIndex: number | null;
    totalCount: number;
    unlockedCount: number;
    completedCount: number;
    gridSize: number | null;
  };

  hud: {
    moves: number;
    timeRemainingSec: number | null;
    timerRunning: boolean;
    score: number | null;
    stars: 0 | 1 | 2 | 3 | null;
    warning: boolean;
  };

  playfield: {
    ready: boolean;
    bounds: { left: number, top: number, width: number, height: number } | null;
    revision: number;
    visibleVehicleCount: number;
    remainingVehicleCount: number;
  };

  vehicles: Array<{
    vehicleId: string;
    row: number;
    col: number;
    direction: "up" | "down" | "left" | "right";
    state: "parked" | "moving" | "exiting" | "blockedFeedback" | "hinted";
    canMove: boolean;
    willExitIfTapped: boolean;
    screen: { centerX: number, centerY: number, width: number, height: number } | null;
  }>;

  hint: {
    available: boolean;
    coolingDown: boolean;
    cooldownRemainingSec: number;
    highlightedVehicleId: string | null;
  };

  progress: {
    levels: Array<{
      levelIndex: number;
      unlocked: boolean;
      completed: boolean;
      bestMoves: number | null;
      bestScore: number | null;
      bestStars: 0 | 1 | 2 | 3 | null;
    }>;
  };

  settings: {
    musicEnabled: boolean;
    soundEnabled: boolean;
  };

  lastAction: {
    ok: boolean;
    type: string | null;
    outcome: "none" | "started" | "moved" | "exited" | "blocked" | "hinted" | "paused" | "resumed" | "restarted" | "selected" | "rejected" | "completed" | "failed" | "settingChanged";
    reason?: "invalidPhase" | "lockedLevel" | "noVehicle" | "blocked" | "cooldown" | "animating" | "terminal" | "notAvailable";
  };
}
```

Field rules:

- `vehicleId` only needs to remain stable within the current level's current Snapshot sequence; it does not need to follow any source-code or asset naming.
- `row`/`col` are logical grid summaries used to verify blocking and movement relationships; they do not specify rendering coordinates or internal storage.
- `screen` and `playfield.bounds` are product-level hit-target summaries for real mouse/touch input; their values are determined by runtime layout and cannot be hard-coded in tests.
- `playfield.revision` increments after vehicle movement, departure, restart, level switching, or visible situation changes; a rejected click may leave revision unchanged, but feedback must be expressed through `lastAction` or vehicle `state`.
- `hud.warning` represents the visible warning semantics of a countdown close to running out and does not require a fixed color, text, or animation style.

## 5. Feature Contract Matrix

| GDD Mechanic | Contract Input | Snapshot Output | External Postcondition |
|---|---|---|---|
| M1 Readable level parking lot | `start`, `selectLevel`, `restart` | `phase: "playing"`, `playfield.ready`, `gridSize`, vehicle summary, HUD summary | The main gameplay area is visible, vehicle orientations and the HUD are observable, and the playfield is interactive |
| M2 Click-to-move vehicle semantics | `tapVehicle`, `touchVehicle`, `tapAt` | `hud.moves` increases; `lastAction.outcome` is `moved`, `exited`, or `blocked` | Real clicking/touching the same vehicle should trigger equivalent results; click direction does not change vehicle-orientation semantics |
| M3 Path and blocking determination | `tapVehicle` in `movable_vehicle_ready` or `blocked_vehicle_ready` | A movable vehicle's row/col changes or the count decreases; a blocked vehicle's row/col remains unchanged and is `blocked` | Valid movement has visible motion/departure; a blocked vehicle has rejection feedback and does not pass through vehicles, overlap, or incorrectly trigger victory |
| M4 Moves, time, and scoring | Consecutive vehicle clicks, `wait`, completing a level | `moves` monotonically increases after clicks; `timeRemainingSec` decreases while the timer runs; `score`/`stars` have values after victory | The HUD and result panel communicate moves, time, score, and star rating |
| M5 Win/loss loop | Validly clear vehicles, use `wait` until time runs out, click a vehicle again after a terminal state | `result: "win"` or `"lose"`; `canInteractWithPlayfield: false` | The result overlay is visible, normal vehicle input is locked, and retry/next-level/return paths are available |
| M6 Level progress | After completing an unlocked level, use `nextLevel` or return to level selection | `unlockedCount` does not decrease; the completed level records best summaries | Level selection shows unlocks, completion, and star rating/best performance; selecting a locked level is rejected |
| M7 Hint system | `hint` in `hint_available`, `hint_cooling_down` | When available, `highlightedVehicleId` has a value and `coolingDown: true`; during cooldown, it is rejected | A hint only highlights; it does not move a vehicle, add a move, or complete directly |
| M8 Menus and overlay panels | `openLevelSelect`, `pause`, `resume`, `restart`, `backToMenu` | `phase`/`activeOverlay`/`overlayBlocking`/`canInteractWithPlayfield` switch correctly | While an overlay panel is open, clicks on underlying vehicles must not change the situation; the timer does not decrease while paused |
| M9 Settings feedback | `openSettings`, `toggleSetting` | `settings.musicEnabled` or `settings.soundEnabled` flips | The toggle state is immediately visible; after muting, visual feedback still communicates gameplay |
| M10 P2 leaderboard/editor | Optional entry-point action or no entry point | If present, `activeOverlay: "leaderboard"` or an equivalent P2 summary; if absent, P1 fields are unaffected | P2 panels must not block the primary path through the main menu or normal levels |

## 6. Externally Observable Postconditions

Beyond the public contract, the player-visible layer must satisfy:

- Upon entering `playing`, the main gameplay area is non-empty and readable; vehicle count, HUD move count, and countdown are synchronized with the Snapshot summary.
- When `phase: "playing"` and `overlayBlocking: false`, real mouse clicks and touchscreen taps on vehicle hit targets exposed by the Snapshot should trigger vehicle attempts.
- When `overlayBlocking: true` or `phase` is `paused`/`result`/`settings`, clicks on underlying vehicles must not change `moves`, vehicle positions, or the number of remaining vehicles.
- After victory or failure, the result layer is visible and normal vehicle input is locked; `restart` clears the result, hint, and temporary animations, restoring the current level's initial situation.
- Settings toggles, hint cooldown, countdown warnings, blocked rejection, and vehicle departure must all have visible semantic feedback, without prescribing text, colors, icons, audio resources, or animation implementations.

## 7. Invariants And Rejection

- Vehicles always occupy valid grid summaries; departed vehicles should not simultaneously appear in `vehicles`.
- At no time may two parked/moving vehicles overlap at the same stable row/col summary.
- Each normal vehicle click triggers at most one attempt by one vehicle; repeated input during animation may be rejected or queued, but must not cause duplicate removals, vehicles passing through one another, negative moves, or an incorrect terminal state.
- Moves must not decrease; after restarting the current level, moves return to 0.
- The countdown must not continue decreasing in paused, result, menu, or settings blocking states.
- Selecting a locked level must be rejected while preserving the currently available flow.
- A hint must not change `moves`, `remainingVehicleCount`, a vehicle's row/col, or `result`.
- After a terminal state, `tapVehicle`, `touchVehicle`, and `tapAt` should be rejected until the player retries, proceeds to the next level, or returns.

## 8. Prohibited Tests and Implementation Shortcuts

- Private functions, closure variables, source-code object names, DOM id/class, CSS animation names, asset names, audio names, file structures, or fixed canvas resolutions must not be required or tested.
- The test interface must not directly set victory, failure, score, star rating, best performance, vehicle removal, vehicle collision, hint hits, cooldown completion, or the countdown reaching zero.
- `{ ok: true }`, element existence, fixed text, fixed colors, fixed pixel hashes, fixed coordinates, or frame counts must not be used as passing conditions for core mechanics.
- Editors, leaderboards, external services, or decorative particles must not be used as P1 passing conditions; if present, tests may only verify that they do not block the primary path and that their own P2 summaries are correct.
