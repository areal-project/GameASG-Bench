# Lucky Tran's Apartment Glow-Up TDD Contract

## Scope

This contract defines the public, implementation-neutral test surface for the gameplay described in `game-spec.md` and `design-doc.md`. It covers player-level actions, legal setup scenarios, stable snapshot summaries, and observable postconditions.

The contract must not be implemented as a shortcut around gameplay. Public actions are semantic equivalents of player clicks, touches, and press-and-hold gestures. Snapshots expose stable summaries only, not private object graphs, render trees, source function names, fixed pixel coordinates, asset names, or algorithms.

## Public API

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

### Method Semantics

- `reset(options?)`: starts a fresh run at the loading or start screen. It clears selected room, selected wall tone, selected candidate, hold progress, transient celebration, placed objects, score, and result for the current run.
- `getSnapshot()`: returns the current stable `Snapshot` without changing gameplay state.
- `input(action)`: performs one player-level action and returns the resulting `Snapshot`. Invalid actions must not throw; they return a snapshot with `lastAction.ok === false` or an equivalent rejection summary, and the protected gameplay state remains unchanged.
- `loadScenario(name, options?)`: moves the game to a legal, reachable precondition state defined below. It may prepare prior ordinary progress only when that progress is not the outcome being tested. It must not directly award the action result under test, directly fill the current hold, directly add score for the current step, directly complete the room, or directly trigger continue.

## Action Schema

All actions use:

```javascript
{
  type: string,
  target?: string,
  room?: "living_room" | "bedroom" | "kitchen",
  wall?: string,
  candidateIndex?: 0 | 1 | 2,
  spotRef?: "active" | "inactive" | "completed" | "outside",
  durationMs?: number,
  pointer?: "mouse" | "touch",
  phaseHint?: string
}
```

### Action Types

- `tapControl`: player activates a semantic control such as `start`, `continue`, or optional `share`.
- `tapRoom`: player chooses a room card. Requires `room`.
- `tapWall`: player chooses a visible wall tone card. Requires `wall` or a valid wall choice from the snapshot.
- `tapCandidate`: player chooses one of the three visible candidate items for the active spot. Requires `candidateIndex`.
- `pressSpot`: player presses and holds a spot area. Requires `spotRef` and `durationMs`. A completing hold is a sustained press inside `spotRef: "active"` after a candidate has been selected. Early release is represented by a shorter `durationMs`.
- `tapPlayfield`: player taps a semantic playfield area without beginning a valid hold. Requires `spotRef`.
- `wait`: lets visible transitions, celebrations, or hold progress advance for `durationMs`; it cannot by itself select, place, score, complete, or continue.

Actions may include `pointer: "mouse"` or `pointer: "touch"` so checks can verify both input families. The meaning of an action must be the same for mouse and touch.

## Scenario Schema

`loadScenario(name, options?)` may support only these legal preconditions:

| Scenario | Legal precondition | Allowed trigger for result |
|---|---|---|
| `fresh_start` | Fresh game before start is activated. No room, wall, item, score, or placement is selected. | `tapControl(start)` moves to room selection. |
| `room_selection` | Start has been activated and the room selection screen is waiting for a room choice. | `tapRoom` moves toward wall selection for that room. |
| `wall_selection` | A valid room has been selected and no wall tone has been chosen for the current run. | `tapWall` unlocks decorating. |
| `decorating_first_spot` | A room and wall tone have been chosen; no item has been placed; the first spot is active with three candidates. | `tapCandidate` then `pressSpot(active)` can place the first item. |
| `decorating_mid_spot` | The current room has at least one earlier spot already placed through the normal sequence; the current spot is unplaced and active. | `tapCandidate` then `pressSpot(active)` can place the current item and advance. |
| `decorating_final_spot` | All required earlier spots in the current room are already placed through the normal sequence; the final spot is unplaced and active. | `tapCandidate` then completing `pressSpot(active)` can trigger room completion and showcase flow. |
| `showcase_complete` | The current room has already been completed and the final showcase is visible. Ordinary placement is disabled. | `tapControl(continue)` begins another room flow. |

Scenario setup must keep candidate selection unset and hold progress at zero unless the scenario explicitly represents a player currently holding for a hold-progress observability check. No scenario may preload the current successful placement, current celebration reward, current score increment, current completion transition, or current continue action.

## Snapshot Schema

`Snapshot` must be JSON-serializable and include stable summaries:

```javascript
{
  phase: "loading" | "start" | "room_selection" | "wall_selection" | "decorating" | "celebrating" | "completion" | "showcase",
  screen: string,
  result: "none" | "room_complete",
  activeRoom: null | "living_room" | "bedroom" | "kitchen",
  roomsAvailable: ["living_room", "bedroom", "kitchen"],
  wallChoices: [{ id: string, selected: boolean }],
  selectedWall: null | string,
  currentSpot: null | {
    index: number,
    total: number,
    state: "active" | "locked" | "completed",
    targetZoneId: string
  },
  candidateChoices: [{ index: 0 | 1 | 2, selected: boolean, visible: boolean }],
  selectedCandidate: null | 0 | 1 | 2,
  hold: {
    active: boolean,
    progress: number,
    canStart: boolean,
    targetZoneId: null | string
  },
  score: number,
  placedCount: number,
  progress: {
    placed: number,
    total: number,
    label: string
  },
  targetZones: [{
    id: string,
    kind: "start" | "room" | "wall" | "candidate" | "spot" | "continue" | "share" | "playfield",
    enabled: boolean,
    semanticRef: string,
    bounds: { x: number, y: number, width: number, height: number },
    center: { x: number, y: number }
  }],
  feedback: {
    selectionVisible: boolean,
    previewVisible: boolean,
    activeSpotHighlighted: boolean,
    holdProgressVisible: boolean,
    celebrationVisible: boolean,
    guidanceVisible: boolean,
    showcaseVisible: boolean,
    shareFeedbackVisible: boolean
  },
  visibility: {
    playfieldVisible: boolean,
    roomVisible: boolean,
    candidatesVisible: boolean,
    hudVisible: boolean,
    overlayBlocking: boolean,
    canInteractWithPlayfield: boolean
  },
  lastAction: {
    ok: boolean,
    type: string,
    reason?: "wrong_phase" | "invalid_target" | "no_selection" | "early_release" | "locked" | "complete" | "unsupported"
  }
}
```

### Field Rules

- `phase` is the canonical state-machine field. `screen` may use any stable label consistent with the phase.
- `roomsAvailable` must include at least the three P1 room values. Additional rooms may be present only if they do not replace those values.
- `wallChoices` must expose at least four choices during wall selection. Their `id` values are semantic stable identifiers chosen by the implementation, not visual style requirements.
- `currentSpot.index` is zero-based or one-based only if the implementation documents it consistently in the snapshot; tests must compare relative changes rather than assume a start value.
- `currentSpot.total` and `progress.total` must be at least the room's required placement count and remain stable for the active room.
- `candidateChoices` contains exactly three visible choices during decorating before a spot is placed.
- `hold.progress` is normalized from `0` to `1`. It must increase during a maintained valid hold and return to `0` or inactive after early release.
- `targetZones.bounds` use normalized viewport or playfield coordinates in the range `0..1`. They are semantic hit regions for tests, not fixed layout requirements.
- `feedback` and `visibility` summarize user-visible outcomes. They may be backed by canvas, DOM, SVG, WebGL, or another presentation layer.

## Feature Contract Matrix

| GDD mechanism | Contract trigger | Required snapshot result | External postcondition |
|---|---|---|---|
| M1 Start and phase gating | `reset` then `tapControl(start)` | `phase` changes from `start` or `loading` to `room_selection`; protected pre-start actions are rejected | Start control is visible before activation; room/decorating controls do not operate before start. |
| M2 Room selection | `loadScenario(room_selection)` then `tapRoom(room)` | `activeRoom` becomes the chosen room; `phase` becomes `wall_selection` after any loading transition | A room choice is visibly selected or the wall-selection screen for that room becomes visible. |
| M3 Wall tone selection | `loadScenario(wall_selection)` then `tapWall(wall)` | `selectedWall` is set; `phase` becomes `decorating`; `wallChoices[].selected` reflects the choice | The room treatment visibly changes or is summarized as changed before item placement begins. |
| M4 Active spot guidance | Enter any decorating scenario or advance after placement | `currentSpot.state === "active"`; an enabled active spot target exists; `feedback.activeSpotHighlighted === true` | The next placement location is discoverable and ordinary inactive spots cannot skip sequence. |
| M5 Candidate item selection | `tapCandidate(candidateIndex)` in decorating | `selectedCandidate` is set; matching candidate selected; `feedback.previewVisible === true` | Candidate selection is visible and a preview or equivalent placement hint appears at the active spot. |
| M6 Hold-to-place progress | After selection, `pressSpot(active, durationMs)` shorter than completion | `hold.progress` increases while held, then resets or becomes inactive after early release; score and placed count do not increase | Hold progress feedback is visible during the press and disappears or clears on cancellation. |
| M7 Successful placement reward | After selection, completing `pressSpot(active, durationMs)` | `placedCount` and `score` increase; current spot becomes completed or advances; `feedback.celebrationVisible` or guidance feedback appears | The selected item becomes persistent in the room and success feedback is visible. |
| M8 Sequential room completion | `loadScenario(decorating_final_spot)`, select candidate, complete hold | `result === "room_complete"` and `phase` reaches `completion` or `showcase` after transition | Final room celebration and showcase are visible; ordinary placement input is rejected afterward. |
| M9 Continue to another room | `loadScenario(showcase_complete)` then `tapControl(continue)` and choose a room if prompted | New run returns to `room_selection` or `wall_selection`; score, selected candidate, hold progress, and placed count reset for the new room | Previous-room transient effects do not block the new room flow. |
| M10 Visible progress and HUD | Any valid completed placement | `score`, `placedCount`, and `progress.placed` increase together | HUD or equivalent progress display updates with the placement. |
| M11 Companion guidance | First selection, placement success, or transition wait | `feedback.guidanceVisible === true` at least during guidance moments; `visibility.overlayBlocking === false` in playable phases | Guidance is visible but does not block candidate or spot interaction. |
| M12 Three-room breadth | `room_selection` plus `tapRoom` for each P1 room | Each required room can reach wall selection and decorating with its own room identity | Each required room has visible room presentation, wall choices, and multiple spots. |
| M13 Visual readability | `getSnapshot` in each main phase | `visibility.playfieldVisible`, phase-relevant controls, HUD/feedback fields are true where applicable | The playable scene is nonblank and not hidden behind a blocking overlay. |
| M14 Optional audio/haptics polish | Start, choose, or successful placement when supported | Optional sensory summary may change, but core visual fields must still prove success | Audio or haptics cannot be the only success oracle. |
| M15 Share-style feedback | In `showcase_complete`, `tapControl(share)` if share is available | `feedback.shareFeedbackVisible === true` or a non-blocking guidance response appears | Share feedback does not replace or hide the final showcase. |
| M16 Optional edit/settings controls | Optional semantic controls if provided | Optional settings/edit state is summarized without mutating P1 progress unexpectedly | Optional controls must not break the guided hold-to-place loop. |

## Required Rejection Contracts

Each rejection must preserve `score`, `placedCount`, `progress.placed`, selected room, selected wall, and current active spot unless the action is a valid navigation action.

- Before start, `tapRoom`, `tapWall`, `tapCandidate`, and `pressSpot` are rejected.
- In room selection, non-room playfield taps and wall/decorating actions are rejected.
- In wall selection, `tapCandidate` and `pressSpot` are rejected until a wall tone is selected.
- In decorating, `pressSpot(active)` without a selected candidate is rejected with no score or placement change.
- In decorating, `pressSpot(outside)` and `tapPlayfield(outside)` are rejected with no score or placement change.
- In decorating, early release from `pressSpot(active)` clears hold progress and does not place an item.
- During short celebration, repeated placement for the just-completed spot is rejected or locked until the next spot becomes active.
- During completion and showcase, ordinary candidate and spot actions are rejected; only explicit continue or optional share actions are accepted.

## User-Visible Postconditions

Runtime checks may verify these external outcomes through public snapshots, semantic hit regions, visible controls, HUD text, canvas/WebGL/DOM changes, or equivalent browser-observable evidence:

- The primary playfield is visible and nonblank in start, room selection, wall selection, decorating, completion, and showcase phases.
- When `phase === "decorating"`, no blocking overlay prevents candidate selection or active-spot press actions.
- Starting, choosing a room, choosing a wall, selecting a candidate, holding, placing, completing, continuing, and optional sharing have visible state changes after their trigger.
- A valid placement must have at least two independent visible or snapshot results: persistent room object/progress, score or placed-count increase, celebration/guidance feedback, or visible playfield change.
- Invalid or cancelled actions must be observable as no progress change plus rejection/cleared hold feedback.

## Prohibited Test Shortcuts

- No direct score setting, direct placed-count mutation, direct room-complete mutation, direct reward spawning, direct hold-fill mutation, direct current-spot completion, or direct continue completion.
- No requirement for a specific DOM tree, CSS selector, canvas size, render loop, image asset, exact wording, exact color, fixed coordinate, private variable, private function, class name, source file structure, or physics/math formula.
- No scenario may start with the current action's success already applied.
- Passing cannot rely only on API existence, `{ ok: true }`, static text, a fixed snapshot value, or an optional audio/haptic signal.
