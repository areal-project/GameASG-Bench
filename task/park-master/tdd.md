# Park Master TDD Public Contract

This contract defines the public, portable test surface for Park Master. It is derived from `game-spec.md` and `design-doc.md` only: top-down parking play, continuous car control, collision/reset, precise parking completion, timer/stars, pause/retry, level progression, touch controls, moving hazards, and optional editor behavior.

The contract must not require a particular renderer, DOM structure, private function, physics formula, asset, exact text, fixed coordinate, or source naming. Implementations may use any UI and internals if the public player actions and observable snapshot results below are stable.

## 1. Public Interface

Implementations expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  loadScenario(name, options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot
}
```

### Method Semantics

- `reset(options?)` starts a fresh playable session at a valid level start. It clears transient crash/completion/pause effects, sets vehicle speed to rest, sets the timer to idle, and returns a `Snapshot`.
- `loadScenario(name, options?)` loads one of the legal precondition scenarios in this document. A scenario may choose a level layout or safe pose already allowed by the game design, but it must not pre-award success, pre-trigger a crash, grant stars, skip collision, force a boost, alter health/resources, or directly complete a rule outcome.
- `input(action)` applies one player-level action and returns the post-action `Snapshot` after the action has had time to settle according to its `durationMs` or requested wait.
- `getSnapshot()` returns a stable public summary without mutating game state.

All methods must be callable repeatedly without throwing. Invalid actions return a snapshot with `lastAction.ok === false` or `lastAction.rejected === true`, and must not corrupt the current attempt.

## 2. Action Schema

`action.type` values and fields:

| Action | Fields | Player meaning |
|---|---|---|
| `start` | none | Activate the game from the start/loading screen. |
| `holdControl` | `control`, `durationMs`, optional `source` | Hold a directional control for a duration. `control = forward|reverse|left|right`; `source = keyboard|touch|contract`. |
| `releaseControl` | `control`, optional `source` | Release one held directional control. |
| `releaseAllControls` | none | Release all held driving controls. |
| `comboHold` | `controls`, `durationMs`, optional `source` | Hold two or more compatible controls, such as `forward+left` or `reverse+right`. |
| `wait` | `durationMs` | Let gameplay time advance without new player input. |
| `pause` | none | Open pause from a playable attempt. |
| `resume` | none | Continue from pause. |
| `retry` | optional `from = pause|complete|play` | Restart the current level through a player-visible retry path. |
| `nextLevel` | none | Advance after completion through a player-visible next-level path. |
| `touchStartControl` | `control`, optional `pointerId` | Begin a touch hold on an on-screen direction control. |
| `touchMoveControl` | `control|null`, optional `pointerId` | Slide an active touch into another direction control or out of all direction controls. |
| `touchEndControl` | optional `pointerId` | End or cancel a touch control. |
| `editor` | `command`, fields by command | Optional P2 editor command if the implementation exposes edit mode. |

Allowed `editor.command` values, when editor mode exists: `enter`, `exit`, `selectPaletteItem`, `placeAt`, `selectObject`, `dragSelected`, `copySelected`, `deleteSelected`, `setSelectedProperty`. These actions must represent visible editor operations, not private object mutation.

`durationMs` is a test-requested hold/wait interval. Tests may use relative comparisons across snapshots; implementations must not require exact frame counts.

## 3. Legal Scenarios

Scenarios are legal precondition states. Each scenario must be reachable in ordinary play or be a clean level start/attempt state consistent with the GDD. None may contain the already-produced result being tested.

| Scenario | Required precondition | Valid triggers to produce result |
|---|---|---|
| `fresh_start` | Start/loading or pre-play screen with no active attempt. | `start` enters playable driving. |
| `level_start` | A current level is initialized, vehicle at rest at its start pose, timer idle, target bay and hazards present, no blocking overlay. | Direction holds start timer and vehicle motion. |
| `open_lane` | Vehicle at rest with safe open space ahead and no imminent collision. | `holdControl(forward)`, `releaseAllControls`, `holdControl(reverse)` prove acceleration, friction, braking, and reverse. |
| `steering_lane` | Vehicle at rest or slow in a safe lane with enough room to curve; no obstacle is immediately touching. | `comboHold(forward,left/right)` and `comboHold(reverse,left/right)` prove steering and reverse correction. |
| `obstacle_approach` | Vehicle at a safe distance from a solid obstacle or parked car, not already colliding. | Driving toward the object triggers crash feedback and reset. |
| `moving_hazard_crossing` | A moving hazard route is visible, and the player vehicle starts outside the hazard path. | Waiting and/or driving into the route at a risky time triggers visible moving-hazard risk and collision failure. |
| `parking_approach` | Vehicle is near the target bay entrance but outside a completed pose, with room to enter slowly and align. | Low-speed directional input and release can complete; fast/partial/misaligned approaches must not complete. |
| `partial_or_fast_bay_contact` | Vehicle can reach or touch the bay while still too fast, partially outside, or visibly misaligned. It is not already complete. | Driving into this invalid posture leaves the level playable and `result = none`. |
| `active_driving` | Vehicle is moving or has moved, timer active, no modal result, no crash reset. | `pause`, directional input while paused, `resume`, and `retry` prove state machine behavior. |
| `completed_level` | A level has been completed by valid parking input and the completion overlay is visible. | `retry` restarts same level; `nextLevel` starts a different layout or valid cycle. |
| `post_crash_reset` | A prior collision has finished its reset flow. | Snapshot must show same level ready at start with timer idle, no stale crash/completion state. |
| `touch_controls_ready` | Playfield is visible with semantic direction controls available. | Touch start/move/end/cancel actions map to held/released driving controls. |
| `editor_ready` | Optional P2 edit mode is available and not blocking P1 play. | Editor actions visibly place/select/drag/copy/delete/configure objects, then return to driving. |

If an implementation does not support P2 editor mode, `loadScenario("editor_ready")` may reject with `unsupported`, but all P1 scenarios must be supported.

## 4. Snapshot Schema

`Snapshot` is a stable, public summary. Numeric fields may be approximate and normalized, but they must be monotonic or relational enough for tests to compare before/after behavior.

```typescript
type Snapshot = {
  ok: boolean,
  phase: "loading" | "start" | "waitingInput" | "playing" | "paused" | "crashReset" | "complete" | "editor",
  screen: "loading" | "start" | "driving" | "pause" | "complete" | "editor",
  result: "none" | "win" | "crash",
  level: {
    index: number,
    count: number,
    layoutId: string,
    hasTargetBay: boolean,
    staticObstacleCount: number,
    parkedVehicleCount: number,
    movingHazardCount: number
  },
  timer: {
    state: "idle" | "running" | "paused" | "stopped",
    elapsedMs: number
  },
  stars: {
    current: 0 | 1 | 2 | 3 | null,
    bestByLevel?: Record<string, 0 | 1 | 2 | 3>
  },
  vehicle: {
    visible: boolean,
    screenX: number,
    screenY: number,
    headingDeg: number,
    speed: number,
    signedSpeed: number,
    steering: "left" | "right" | "center",
    bounds: { screenX: number, screenY: number, width: number, height: number },
    fullyInsideTarget: boolean,
    alignedWithTarget: boolean,
    inTargetZone: boolean
  },
  target: {
    visible: boolean,
    screenX: number,
    screenY: number,
    headingDeg: number,
    bounds: { screenX: number, screenY: number, width: number, height: number }
  },
  hazards: {
    staticSolidVisible: boolean,
    movingVisible: boolean,
    movingMotionRevision: number,
    nearestSolidDistance?: number,
    nearestMovingDistance?: number
  },
  controls: {
    canDrive: boolean,
    held: Array<"forward" | "reverse" | "left" | "right">,
    semanticControls: Record<string, {
      available: boolean,
      pressed: boolean,
      bounds?: { left: number, top: number, width: number, height: number }
    }>
  },
  overlays: {
    blocking: boolean,
    startPrompt: boolean,
    pause: boolean,
    complete: boolean,
    crashFeedback: boolean
  },
  playfield: {
    visible: boolean,
    bounds: { left: number, top: number, width: number, height: number },
    renderRevision: number,
    visualDiversity: "blank" | "low" | "readable"
  },
  progress: {
    completedLevels: number,
    currentLevelUnlocked: boolean,
    lastCompletedLevel?: number
  },
  lastAction: {
    type?: string,
    ok: boolean,
    rejected?: boolean,
    reason?: "invalidPhase" | "unsupported" | "invalidControl" | "notAvailable" | "ruleRejected"
  }
}
```

### Field Rules

- `phase = playing` requires `overlays.blocking === false`, `controls.canDrive === true`, and a visible playfield.
- `phase = paused|complete|crashReset` requires `controls.canDrive === false` for normal driving input.
- `screenX/screenY` and `bounds` are screen-space observables for portable input and direction checks. They are not fixed layout requirements.
- `layoutId` is an opaque public identifier that changes when a genuinely different level layout starts. It must not expose file names or internal object arrays.
- `renderRevision` increments or otherwise changes when the visible playfield changes after meaningful gameplay input. It is not a frame counter by itself.
- `visualDiversity = readable` means the primary scene is not blank and visibly contains differentiated car/target/parking-lot/hazard information.
- `movingMotionRevision` changes when a moving hazard visibly advances while gameplay is active.

## 5. Feature Contract Matrix

| GDD feature | Contract trigger | Observable result | Rejection/invariant |
|---|---|---|---|
| M1 start and readable scene | `loadScenario("fresh_start")`, then `input({type:"start"})` | `phase` becomes `waitingInput` or `playing`; playfield visible/readable; vehicle, target, HUD, hazards, and available controls are observable. | No blocking start overlay may remain when driving is available. |
| M2 acceleration/braking feel | `open_lane`: hold forward, release, wait, then hold reverse | Forward increases signed motion along vehicle heading; release reduces speed trend; opposite input first reduces trend then permits reverse movement. | Movement cannot be instant teleport, fixed screen slide independent of heading, or hard stop on release. |
| M3 steering/reverse correction | `steering_lane`: forward-left/right and reverse-left/right combos | Heading changes gradually while moving; forward and reverse steering produce opposite turning outcomes; steering-only near rest does not create strong lateral displacement. | Left/right cannot be implemented as direct screen-space translation. |
| M4 collision/reset | `obstacle_approach`: drive toward solid hazard | Crash feedback appears, `result = crash` during reset, driving is blocked, then same level returns to a clean start. | Scenario must start safe; crash must be caused by player driving into the hazard. |
| M5 precise parking success | `parking_approach`: enter slowly and align | `fullyInsideTarget`, `alignedWithTarget`, low speed, `result = win`, timer stopped, completion overlay visible. | Fast, partial, or misaligned bay contact keeps `result = none` and remains playable. |
| M6 timer/stars/completion | First driving input, pause/complete, successful parking | Timer starts only after driving input, stops during pause and completion, stars are 0-3 after win and depend on elapsed time bands. | Timer cannot run before first input or continue under pause/completion. |
| M7 pause/retry | `active_driving`: pause, try driving, resume or retry | Pause blocks movement/timer/hazard motion; resume preserves attempt; retry resets pose, speed, timer, overlays, hazards, and transient effects. | Driving input during pause must be rejected or have no gameplay effect. |
| M8 progression | From `completed_level`, trigger `nextLevel` | Starts another valid preset layout or a documented cycle, with clean timer/speed/result state. | Next level cannot keep previous pose, result, timer, or stale overlay. |
| M9 touch controls | `touch_controls_ready`: touch start/combo/move/end/cancel | Touch-held controls mirror keyboard semantics; pressed state is observable; release/move-out/cancel clears held input. | Ghost-held controls after release/cancel are invalid. |
| M10 moving hazards | `moving_hazard_crossing`: wait/drive around route | Moving hazard is visible and has motion revision while active; entering its path can cause crash/reset. | Moving hazards cannot be cosmetic only if declared present. |
| M11 best/progress record | Valid completion and restart/session reset if supported | Progress or best star/time summary updates without breaking retry/reset. | Persistence must not inject completion into a fresh attempt. |
| M14 P2 editor | `editor_ready` plus editor actions | Editor mode is distinct; object operation effects are visible; returning to play restores unobstructed driving. | Editor may be unsupported, but if present it must not block P1 driving. |

## 6. External Postconditions

The public snapshot is necessary but not sufficient for user-visible features. Runtime checks may also use browser-level evidence, provided they do not depend on private implementation:

- The primary playfield must be visible, nonblank, and visually changed by driving, crash, completion, or editor actions when those actions occur.
- HUD or equivalent visible status must reflect level, timer, pause/completion/crash state, and star/time result without relying on exact wording.
- A blocking overlay is allowed in start, pause, completion, crash reset, and editor panels; it must not block playfield input when `phase = playing`.
- Direction controls must be discoverable semantically through `controls.semanticControls` and may also be operated by real keyboard/touch/mouse events.
- Completion, pause, retry, and next-level controls must be user-operable through visible controls or equivalent semantic actions.

## 7. Invalid Input And State Invariants

- Unknown action types, unknown controls, negative durations, and phase-inappropriate actions must be rejected without throwing.
- During `paused`, `complete`, and `crashReset`, normal driving actions must not change vehicle pose, speed trend, timer, or moving hazard state.
- A successful level remains terminal until retry or next-level action.
- Retry and post-crash reset must clear crash feedback, completion overlay, speed, held controls, timer progress, and transient motion state.
- Vehicle snapshots must remain inside or constrained by the playable area; an implementation may either constrain boundary overrun or treat dangerous boundary contact as crash, as defined by the GDD.
- Static obstacles and parked vehicles counted as solid must not be pass-through scenery.
- `input()` must not expose direct win, direct crash, direct star award, direct level completion, direct collision, direct resource/progress mutation, or direct boost actions.

## 8. Scenario Review Notes

- `parking_approach` is valid only if the vehicle starts outside a completed parking posture; the observable win must follow player-level slow entry and alignment actions.
- `obstacle_approach` and `moving_hazard_crossing` are valid only if the vehicle starts non-colliding and the failure follows player-level movement or timing.
- `completed_level` may be loaded only as a previously achieved result state for testing retry/next-level controls; it must not be used to prove parking success.
- `post_crash_reset` may be loaded only after a triggered crash/reset flow or as a clean equivalent reset state; it must not be used to prove collision.
- Editor scenarios are P2 and optional. They must never replace or shortcut P1 preset driving scenarios.

## 9. TDD Self-Review

- This file defines only public interface, player-level actions, legal scenarios, stable snapshot fields, feature-to-contract mapping, and external postconditions.
- It does not require private source functions, private variables, DOM selectors, asset names, file layout, fixed canvas dimensions, fixed coordinates, exact strings, or specific algorithms.
- Every P1 mechanism maps to a trigger and an observable result, with rejection or invariant coverage for shell implementations.
- Scenarios are legal preconditions and do not pre-apply the success, crash, reward, boost, damage, or completion outcome that tests must trigger.
- No behavior has been added beyond `game-spec.md` and `design-doc.md`; optional editor and persistence remain P2/P1-recommended boundaries as documented there.
