# Garden Gulp TDD

## Public Test Contract

The implementation should expose a stable, coarse-grained testing interface:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name): Snapshot
}
```

These interfaces must drive the real game state and synchronize the HUD, result overlay, and canvas within a short delay. The interfaces must not merely return `{ ok:true }`, nor may they directly add score, complete a level, eliminate targets, or bypass the core rule chain. Real player paths must remain available: mouse, touch, keyboard, and visible button clicks must all act on the same state.

## Snapshot Schema

`Snapshot` includes at least:

| Field | Type | Semantics |
|---|---|---|
| `phase` | string | One of `menu`, `playing`, `complete`, `failed`, or `edit` |
| `screen` | string | Summary of the currently visible user screen, such as `intro`, `splash`, `play`, `result`, or `edit` |
| `activePanel` | string/null | Current blocking panel, such as `start`, `result`, or `edit`; `null` if none |
| `overlayBlocking` | boolean | Whether a visible overlay blocks the playfield |
| `canInteractWithPlayfield` | boolean | Whether player input can act on the main scene |
| `level` | number | Current level number |
| `theme` | string | Current theme identifier or human-readable theme name |
| `timeRemaining` | number | Current remaining seconds, decreasing during playing |
| `score` | number | Number fully swallowed |
| `consumed` | number | Number fully swallowed; may be the same as `score` |
| `falling` | number | Number of objects currently falling into the hole but not yet counted as complete |
| `remaining` | number | Number of objects not falling and not consumed |
| `totalObjects` | number | Total number of objects in the current level |
| `progressText` | string | Visible HUD progress summary |
| `timerText` | string | Visible HUD countdown summary |
| `hole` | object | `{ x, y, screenX, screenY, size, targetSize }` |
| `nearestObject` | object/null | Summary of the nearest interactive object: `{ id, size, screenX, screenY, canBeConsumed, state }` |
| `largeObject` | object/null | Summary of a large object that the current hole cannot swallow directly; may be empty |
| `objects` | object | Public target summary for the current level: `{ visible: Array<{ id, size, screenX, screenY, canBeConsumed, state }>, consumableCount, oversizedCount }`, used to verify whether the default level has a completable swallowing path; does not expose private object references |
| `entityCounts` | object | `{ visibleObjects, fallingObjects, consumedObjects }` |
| `audio` | object | `{ musicEnabled, soundEnabled }` |
| `result` | string | One of `none`, `complete`, or `failed` |
| `ui` | object | `{ resultVisible, retryAvailable, nextAvailable, editAvailable }` |
| `canvas` | object | `{ width, height, nonBlank }` or an equivalent visible main-scene summary |
| `playfieldBounds` | object | Optional but recommended: `{ left, top, right, bottom }`, representing the allowed screen bounds for the hole's visible position |
| `worldMotionRevision` | number | Increments when visible object movement/reaction occurs |

Fields may include additional information, but must not expose arbitrary internal object graphs. `screenX/screenY` must represent the position seen by the player on the screen and are used for direction verification.

## Action Schema

`window.__gameTest.input(action)` supports the following player-level actions:

| Action | Required fields | Expected postcondition |
|---|---|---|
| `start` | none | Enter playing from menu/splash, and the overlay no longer blocks the playfield |
| `moveKey` | `key: "left"|"right"|"up"|"down"`, `durationMs` | Equivalent to holding an arrow key/WASD; the hole moves in the screen direction |
| `pointerDrag` | `from: {screenX,screenY}`, `to: {screenX,screenY}`, `durationMs` | Equivalent to mouse dragging; the hole moves toward the target point |
| `touchDrag` | `from: {screenX,screenY}`, `to: {screenX,screenY}`, `durationMs` | Equivalent to touch dragging; the hole moves toward the target point |
| `wait` | `durationMs` | Advance time, animations, and object reactions |
| `toggleAudio` | `channel: "music"|"sound"` | Toggle the corresponding audio setting; level progress remains unchanged |
| `continue` | none | Enter the next level from the complete state |
| `retry` | none | Retry the current level from the failed state |
| `openEdit` | none | P2: Open the editing panel |
| `closePanel` | none | Close a closable panel and return to the previous interactive state |

For an invalid action, unknown key, negative duration, missing required field, or main-gameplay input executed in a terminal state, the implementation must return a rejection result or leave key state unchanged, and must not throw an uncaught exception.

## Valid Preconditions for loadScenario

`loadScenario(name)` constructs only valid, playable precondition states:

| Name | Setup | Must not pre-apply |
|---|---|---|
| `start_menu` | Display the start entry point; the level is initialized | Do not enter playing or move the hole |
| `fresh_level` | playing, multiple objects, ample countdown time | Do not swallow or add score |
| `small_object_near` | playing, one swallowable small object is near the hole but is not yet falling/consumed | Do not increase progress in advance |
| `large_object_near` | playing, one large object that the current hole cannot swallow directly is near the hole | Do not swallow the large object or enlarge the hole |
| `one_object_left` | playing, the last swallowable object is relatively close to the hole and has not yet been consumed | Do not directly complete |
| `near_timeout` | playing, unconsumed objects remain, and very little time is left | Do not directly fail |
| `completed_waiting_continue` | complete state, with the continue entry point visible | Do not automatically enter the next level |
| `failed_waiting_retry` | failed state, with the retry entry point visible | Do not automatically retry |

## DOM/HUD/Canvas Postconditions

- In the playing state, there should be a visible main playfield that is non-empty and readable; if canvas is used, the canvas pixels must not be nearly all blank.
- After starting, `overlayBlocking` is false, and real clicks, drags, or keyboard input at the center of the playfield change the hole position or core state.
- Progress and countdown in the HUD must be synchronized with the Snapshot; progress increases after swallowing, and the countdown decreases after waiting.
- The complete/failed state must have a visible result overlay or equivalent UI, and the continue/retry entry point can be triggered by a real click.
- Audio toggles have visible buttons or equivalent controls; after a real click, the audio fields in the Snapshot change.

## Behavioral Trajectory Contract

| Trajectory | M Coverage | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Start entry | M1 | `loadScenario("start_menu")` or default startup | Real click on the start entry point | phase is playing, the overlay does not block, and the canvas is non-empty | totalObjects does not change because of the start click |
| Keyboard directions | M2 | `loadScenario("fresh_level")` | Real press right, then real press left | hole.screenX first increases and then decreases; the visuals change | hole remains within bounds |
| Drag direction | M2 | `loadScenario("fresh_level")` | Real mouse/touch drag from the hole position to a target on the right | hole.screenX approaches toward the right; canvas or snapshot changes | After release, it does not continue moving without bounds |
| Touch direction | M2 | `loadScenario("fresh_level")` | Real touch drag from the hole position to a target on the right, then optionally drag toward the left | hole.screenX changes according to screen direction; the visuals change | The touch path cannot merely be replaced by the mouse path; hole remains within bounds |
| Swallowing growth | M4/M5 | `loadScenario("small_object_near")` | Real drag to move the hole over the small object and wait for it to fall in | consumed/score increases, hole.size or targetSize increases, and HUD progress is synchronized | `remaining + falling + consumed == totalObjects` |
| Default level can be cleared | M4/M5/M6/M7 | `loadScenario("fresh_level")` or after starting the default first level | Repeatedly select a currently swallowable target from the public `objects.visible`, use real dragging to move the hole over it, and wait, until all are cleared or no swallowable target remains | The level eventually enters complete, or every step makes progress/growth; it must not leave a final object that can never be swallowed | If all remaining objects are unswallowable and the hole has no further growth progress, it should fail |
| Large-object rejection | M4/M5 | `loadScenario("large_object_near")` | Real drag to move the hole over the oversized object and wait briefly | The large object remains unconsumed, and score does not increase | totalBefore/totalAfter is conserved |
| Completion | M6/M7 | `loadScenario("one_object_left")` | Real drag to move the hole over and swallow the last object | result is complete, the continue entry point is visible, and playing input is frozen | level does not increase before continue is clicked |
| Failure retry | M6/M7 | `loadScenario("near_timeout")` | Wait for the countdown to reach zero, then real click retry | result is failed and then returns to playing, level does not increase, and progress resets | Movement in the failed state does not increase consumed |
| Next level | M7 | `loadScenario("completed_waiting_continue")` | Real click continue | level increases, phase is playing, and progress resets | The old level's terminal state is cleared |
| Audio toggles | M8 | `loadScenario("fresh_level")` | Real click the music/sound-effect controls or `input(toggleAudio)` | The audio fields and button states toggle | score, totalObjects, and level unchanged |
| Editing panel | M9 | Implementation where edit is available | Open the editing panel, adjust valid parameters, and close it or playtest | activePanel/phase and the configuration summary change | Invalid parameters are rejected and do not directly produce completion/failure |

## Feature-to-Interface Mapping

- M1: Real start click, `input({type:"start"})`, and `phase/screen/overlayBlocking/canInteractWithPlayfield`.
- M2: Real keyboard/mouse/touch, `input({type:"moveKey"})`, `input({type:"pointerDrag"})`, `input({type:"touchDrag"})`, and `hole.screenX/screenY`.
- M3: `loadScenario("small_object_near")`, `input({type:"wait"})`, `nearestObject.state`, and `worldMotionRevision`.
- M4/M5: Real drag, `small_object_near`/`large_object_near`/`fresh_level` scenarios, `objects.visible`, and `score/consumed/falling/remaining/hole.size/progressText`.
- M6: `one_object_left`, `near_timeout`, and `result/ui.resultVisible`.
- M7: Real continue/retry buttons and `level/theme/totalObjects/progressText`.
- M8: Real audio buttons or the `toggleAudio` action, and the `audio` fields.
- M9: `openEdit`, `activePanel`, the visible state of the editing controls, and the configuration summary.

## Prohibitions

- No fixed DOM id, CSS class, exact wording, fixed coordinates, fixed colors, specific asset names, or specific algorithms are required.
- The public interface must not directly set victory, add score, kill enemies, complete swallowing, or skip the countdown-failure chain.
- Merely returning `{ ok:true }` as action success is not allowed; it must synchronously produce observable changes in the Snapshot, HUD, result overlay, or canvas.
