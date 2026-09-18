# Dirtbike TDD

## Public Testable Contract Objectives

The implementation should provide a player-level public contract describing a stable behavioral summary of the same game. The recommended exposure is:

```javascript
window.__gameTest = {
  reset(options),
  input(action),
  getSnapshot(),
  loadScenario(name, options)
}
```

These interfaces must drive or read the same game state as the real player path. `input(action)` cannot directly add points, directly complete the game, directly save records, or bypass the collision/timing/physics chain; `loadScenario` can only construct valid precondition states.

## Snapshot Schema

`getSnapshot()` and the return value after an action should contain the following stable summary fields. Fields may be extended, but core fields must not be removed.

```javascript
{
  phase: "loading|ready|playing|crashed|finished|track_select",
  screen: "loading|start|race|results|track_select",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  track: {
    index: number,
    count: number,
    theme: string,
    progress: number,
    length: number,
    terrainSignature: string,
    surfaceEnvelope: null | {
      bikeScreenX: number,
      bikeContactScreenY: number,
      terrainScreenY: number,
      tolerance: number,
      bikeOnVisibleSurface: boolean
    }
  },
  time: {
    running: boolean,
    elapsedMs: number,
    finalMs: number|null
  },
  bike: {
    worldX: number,
    worldY: number,
    screenX: number,
    screenY: number,
    velocityX: number,
    velocityY: number,
    angle: number,
    angularVelocity: number,
    grounded: boolean,
    airborne: boolean,
    crashed: boolean,
    activeBoosts: number
  },
  input: {
    accelerating: boolean
  },
  race: {
    started: boolean,
    finished: boolean,
    resultVisible: boolean,
    crashCount: number,
    respawnCount: number
  },
  feedback: {
    canvasReady: boolean,
    visibleSceneRevision: number,
    hudText: string,
    crashVisible: boolean,
    boostVisible: boolean,
    confettiVisible: boolean,
    ghostCount: number
  },
  records: {
    personalBestCount: number,
    bestTimesMs: number[]
  },
  controls: {
    playfieldBounds: { x: number, y: number, width: number, height: number },
    startButtonBounds?: { x: number, y: number, width: number, height: number },
    resetButtonBounds?: { x: number, y: number, width: number, height: number },
    trackSelectorBounds?: { x: number, y: number, width: number, height: number }
  },
  lastAction: {
    ok: boolean,
    type: string,
    reason?: string
  }
}
```

### Field Semantics

- `bike.screenX/screenY` are the coordinates of the player-controlled bike or its visible center on the player's screen, used to verify direction semantics.
- `track.surfaceEnvelope` is a summary of the player-visible terrain surface at the screen cross-section where the bike is located. `terrainScreenY` is the visible terrain surface at that cross-section, `bikeContactScreenY` is the bike's tire/body contact point or equivalent bottom summary, and `bikeOnVisibleSurface` indicates whether the contact point falls within the tolerance of the visible terrain surface. This field only represents the player-visible bike-terrain alignment relationship and does not expose terrain arrays, collision bodies, or render nodes. When `bike.grounded === true` and the bike has not crashed, `bikeOnVisibleSurface === true` must hold; while airborne it may be false, but it should be consistent with `bike.airborne === true`.
- `track.progress` is the normalized progress from the starting line to the finish line for the current run, with a recommended range of `0..1`; it may be `0` before the race starts.
- `visibleSceneRevision` increments when the main scene changes visibly due to physics, input, a crash, switching tracks, or results feedback. The mere passage of time may increment it, but P1 behavior cannot pass solely through this field.
- `overlayBlocking === false` and `canInteractWithPlayfield === true` indicate that the main game area is not blocked by a menu or results overlay.
- `records.bestTimesMs` must be sorted from fastest to slowest, with at most 3 entries.

## Action Schema

```javascript
// Start and restart
{ type: "start" }
{ type: "reset", showStart?: boolean }
{ type: "restart" }

// Throttle input
{ type: "throttle", pressed: boolean, durationMs?: number }
{ type: "key", key: "ArrowUp|Space", pressed: boolean, durationMs?: number }
{ type: "pointerThrottle", pressed: boolean, x?: number, y?: number, durationMs?: number }
{ type: "touchThrottle", pressed: boolean, x?: number, y?: number, durationMs?: number }

// Tracks
{ type: "openTrackSelect" }
{ type: "selectTrack", index: number }
{ type: "closePanel" }
{ type: "clearRecords" }

// Valid progression helper
{ type: "step", durationMs: number }
```

Invalid actions must be rejected and return `lastAction.ok === false` or an equivalent error summary, and should not change core race state. Invalid examples:

- Unknown `type`.
- Out-of-range `selectTrack`.
- Negative or excessively large `durationMs`.
- Continuing `throttle` in the `finished` state must not change `time.finalMs`.
- Throttle during the locked window in the `crashed` state must not immediately produce normal forward progress benefits.
- Executing `clearRecords` when there are no records may return success or no-op, but must not break the current track or main racing entry point.

## loadScenario Contract

`loadScenario(name, options)` can only prepare valid precondition situations and cannot directly set the result under test.

Recommended scenarios:

- `ready-track`: The starting line of the specified track, with phase as `ready` and timing not started.
- `rolling`: The race has started, the bike is traveling stably at low speed, and has not crashed or crossed the finish line.
- `airborne`: The bike has validly become airborne from a ramp, and has not yet become inverted or received a reward.
- `near-crash`: The bike is in a dangerous orientation or near a collision, and subsequent real input/step will trigger a crash.
- `near-finish`: The bike is before the finish line and has not crossed it; subsequent throttle will complete the race.
- `with-records`: The current track already has 1-3 valid personal best records and ghost bikes can appear; the current run must not be completed in advance.

## DOM/HUD/Canvas Postconditions

- The main scene must be readable and non-empty: it has a visible track, bike, and background; purely blank or purely solid-color scenes are not accepted.
- The bike and terrain rendering must be self-consistent: while grounded/landing, the visible bottom of the bike or the tire contact point should fall near the visible terrain surface described by `track.surfaceEnvelope`; if the bike leaves this surface, the snapshot must simultaneously express an airborne, crashed, or other non-grounded state.
- After real throttle input, `bike.worldX` or `track.progress` should increase, and the scene/screenshot hash or `visibleSceneRevision` should change with the input.
- Real throttle input in the ready state should be able to start the run: `race.started === true` or `phase === "playing"`, and timing subsequently advances.
- The throttle direction must be the screen's forward direction: under camera following, the bike may remain relatively stable on screen, but progress increasing, track scrolling, or changes to on-screen objects must prove that the vehicle advances toward the right side of the track.
- After `finished`, there must be a visible results overlay or equivalent HUD state, and `time.finalMs` is frozen.
- During `crashed`, there must be visible impact feedback or `feedback.crashVisible === true`; after respawn, `bike.crashed === false` and `activeBoosts === 0`.
- When the track selection panel is open, `phase === track_select` or `screen === track_select`; after closing/selecting, it must not continue blocking the main game area.

## Behavioral Trajectory Contract

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Launch into playable state | M1/M2 | Default launch | Wait for loading, click start, or execute a real starting entry point | Main scene is non-empty, phase is ready/playing, and overlay does not block | No runtime exceptions |
| Initial throttle start | M2/M3 | ready-track | Actually hold keyboard, mouse, or touch throttle | race.started or phase playing, elapsedMs begins advancing, vehicle/scene changes | Must be playable without a separate start button; menus must not block |
| Throttle advancement | M3/M5 | ready-track or rolling | Actually hold ArrowUp/Space or hold the mouse on the main scene | progress/worldX increases, HUD time advances, scene changes, and while grounded `track.surfaceEnvelope.bikeOnVisibleSurface=true` | After throttle release, `input.accelerating` is false |
| Touch equivalence | M3/M4 | ready-track or rolling | Actually touch and hold, then release, on the main game area | Produces forward movement, timing, or scene changes consistent with mouse/keyboard throttle | accelerating should not remain active after touch release |
| Direction semantics | M3/M4 | rolling | Compare throttle-held and no-input trajectories from the same state | Throttle trajectory has greater forward distance/speed than no input; screen presentation does not reverse | phase should not be changed illegally by input |
| Crash respawn | M6 | near-crash | step or continue throttle | crashVisible/crashCount increases, then respawnCount increases and play can continue; after respawn, grounded state again satisfies the visible terrain surface envelope | activeBoosts resets to zero, result is not completed directly |
| Finish-line results | M7 | near-finish | Actually hold throttle to cross the finish line | resultVisible true, finalMs fixed, confetti/results feedback visible | Continuing throttle after finished does not change finalMs |
| Track switching | M8 | ready-track | Open track selection and select another track | track.index and terrainSignature change, and return to the starting line | track.count >= 3, panel leaves no residual blocking |
| Records/ghosts | M9 | with-records | Start the race or read the snapshot | ghostCount matches the number of records, bestTimesMs is sorted with at most 3 entries | Records cannot contaminate other tracks |
| Clear records | M9b | with-records | `input({type:"clearRecords"})` or actually click the clear-records entry point | `records.bestTimesMs` is empty, `personalBestCount=0`, `ghostCount=0`, or old ghosts are no longer displayed when entering the race next time | Current track and start entry point remain usable, and storage failure must not block the main flow |
| Flip reward | M10 | airborne | Control the bike into an inverted position and land safely, or use contract step to complete a valid chain | activeBoosts increases, boostVisible true, speed increases | No reward without inversion or after crash respawn |
| Invalid input rejection | M2/M8 | ready-track | unknown action, out-of-range track, negative duration | lastAction.ok false, state unchanged | totalBefore/totalAfter core resources are conserved |

## Feature-Interface Mapping

- M1: `getSnapshot()` + canvas/DOM observation.
- M2: Real start/reset clicks, or the `input({type:"start"})` / `input({type:"reset"})` contract.
- M3/M4: Real keyboard/mouse/touch input takes precedence; `input({type:"throttle"})` is only used for the contract.
- M5: `bike`, `track.progress`, `track.surfaceEnvelope`, `visibleSceneRevision`, canvas changes.
- M6: `loadScenario("near-crash")` + player-level step/throttle.
- M7: `loadScenario("near-finish")` + real throttle.
- M8: Real track UI or the `input({type:"selectTrack"})` contract.
- M9/M9b: `loadScenario("with-records")` + `records`/`feedback.ghostCount`, `input({type:"clearRecords"})`.
- M10: `loadScenario("airborne")` + player-level input or valid step.

## Prohibitions

- Private variables, internal functions, fixed DOM structure, fixed coordinates, fixed colors, fixed copy, or specific physics algorithms must not be required.
- `loadScenario` must not be used to directly provide victory, add points, grant a flip reward, produce finish-line results, or produce a crash result.
- `input` must not return `{ ok: true }` without changing the corresponding visible state.
