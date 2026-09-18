# Neon Flow: Circuit Connect TDD Public Contract

This contract defines the public, portable test surface for implementations of Neon Flow: Circuit Connect. It only covers behavior already defined in `game-spec.md` and `design-doc.md`: level selection, grid connection, legal and illegal drawing, correction tools, completion, and progression.

The contract is not an implementation design. Implementations may use any rendering, layout, data model, engine, or visual assets as long as the player-visible behavior and the public summaries below are stable.

## 1. Public Test Interface

Expose one browser-global test adapter:

```javascript
window.__gameTest = {
  reset(): Snapshot,
  getSnapshot(): Snapshot,
  input(action: Action): Snapshot,
  loadScenario(name: ScenarioName): Snapshot
}
```

### Method Semantics

- `reset()` returns the game to a stable initial application state. It must not erase durable unlock progress unless the implementation documents that progress is session-only.
- `getSnapshot()` returns a stable public summary of the current user-visible state. It must not expose private objects, renderer internals, framework component trees, animation loop details, or source-specific names.
- `input(action)` performs one player-level action, such as choosing a level, dragging across grid cells, clicking a saved line, using undo/reset/back/replay/next controls, or tapping outside the playfield. It must return the resulting snapshot after the action has settled enough for state assertions.
- `loadScenario(name)` creates a legal precondition from the documented game states. It may place the game at a menu, fresh level, partially solved level, blocked layout, or one-move-before-completion state, but it must never directly set a win, directly award unlocks, directly inject a collision/rejection result, directly grant a completed action, or bypass the player action that the test is meant to verify.

If an unsupported action or scenario is requested, the adapter must return a snapshot with `lastAction.ok === false` and a stable rejection reason, while preserving the previous gameplay state.

## 2. Action Schema

All actions are player-level semantic operations. They may be driven by the adapter for contract checks or translated by L2 tests into real mouse/touch/keyboard/visible-control input.

```typescript
type Action =
  | { type: "chooseLevel"; levelIndex: number }
  | { type: "dragPath"; cells: CellRef[]; pointer?: "mouse" | "touch" | "adapter" }
  | { type: "pointerDownCell"; cell: CellRef; pointer?: "mouse" | "touch" | "adapter" }
  | { type: "pointerMoveCell"; cell: CellRef; pointer?: "mouse" | "touch" | "adapter" }
  | { type: "pointerUp"; pointer?: "mouse" | "touch" | "adapter" }
  | { type: "tapCell"; cell: CellRef; pointer?: "mouse" | "touch" | "adapter" }
  | { type: "undo" }
  | { type: "resetLevel" }
  | { type: "backToLevelSelect" }
  | { type: "replayLevel" }
  | { type: "nextLevel" }
  | { type: "tapOutsidePlayfield" }
  | { type: "noop" };

type CellRef =
  | { row: number; col: number }
  | { id: string };
```

### Action Rules

- `chooseLevel` is equivalent to selecting a visible level entry. It may enter only an unlocked level.
- `dragPath` is shorthand for a player press on the first cell, movement through the listed cells in order, and release. Each listed cell is a semantic grid cell, not a fixed screen coordinate.
- `pointerDownCell`, `pointerMoveCell`, and `pointerUp` support stepwise tests of temporary line growth, backtracking, and failed release.
- `tapCell` represents clicking or touching a grid cell. On a saved line or its same-color endpoint it may erase that color's saved line; on unrelated empty cells it should be rejected or no-op without changing valid saved lines.
- `undo`, `resetLevel`, `backToLevelSelect`, `replayLevel`, and `nextLevel` must correspond to visible player controls when those controls are available in the current phase.
- `tapOutsidePlayfield` and `noop` exist to check terminal locks, overlay blocking, and invariants; they must not advance puzzle progress.

## 3. Scenario Schema

```typescript
type ScenarioName =
  | "initial_app"
  | "level_select"
  | "fresh_unlocked_level"
  | "fresh_locked_level_attempt"
  | "active_partial_drag"
  | "saved_single_connection"
  | "blocked_by_saved_connection"
  | "one_move_before_completion"
  | "completed_level";
```

### Scenario Requirements

- `initial_app`: legal boot or post-reset app state before a level is actively being played. Trigger to observe: wait or `chooseLevel`.
- `level_select`: legal level selection state with at least six level entries summarized. Trigger to observe: `chooseLevel` on unlocked and locked entries.
- `fresh_unlocked_level`: a playable unlocked level with no saved lines. Trigger to observe: `dragPath`, stepwise pointer actions, `resetLevel`, or `backToLevelSelect`.
- `fresh_locked_level_attempt`: a level-select state where the requested target is locked. Trigger to observe: `chooseLevel` for that locked entry; the result must remain outside that locked level.
- `active_partial_drag`: a legal in-progress drag that started on a colored endpoint and has at least one adjacent legal extension available. Trigger to observe: adjacent `pointerMoveCell`, backtracking `pointerMoveCell`, invalid `pointerMoveCell`, and `pointerUp` on an incomplete route.
- `saved_single_connection`: a legal playable state with exactly one saved same-color connection and at least one other color still unconnected. Trigger to observe: `tapCell` on that saved line or same-color endpoint, `undo`, `resetLevel`, and attempts to draw another line through its occupied cells.
- `blocked_by_saved_connection`: a legal playable state where an existing saved line occupies cells that another attempted route would need. Trigger to observe: an invalid `dragPath` or stepwise movement into occupied cells, followed by erase/undo/reset to release the space.
- `one_move_before_completion`: a legal playable state with all required connections except one already saved, no result state active, and at least one valid final route available for the remaining color. Trigger to observe: player-level `dragPath` for the final route.
- `completed_level`: a legal state reached after a completed puzzle, with result UI or equivalent result phase active. Trigger to observe: blocked playfield input, `replayLevel`, `nextLevel`, `backToLevelSelect`, and repeated irrelevant input.

Scenario setup may include saved lines that could have been produced by earlier legal `dragPath` actions. It may not pre-apply the action being tested. For example, `one_move_before_completion` must not already report `result === "complete"` before the final player drag.

## 4. Snapshot Schema

```typescript
type Snapshot = {
  ok: boolean,
  phase: "loading" | "levelSelect" | "playing" | "result",
  screen: "boot" | "levelSelect" | "playfield" | "result",
  activePanel: "none" | "levelSelect" | "completion" | "optional",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,

  level: {
    index: number | null,
    displayNumber: number | null,
    unlocked: boolean,
    gridSize: number | null,
    pairCount: number,
    completedPairCount: number,
    savedLineCount: number,
    occupiedCellCount: number,
    availableCellCount: number,
    complete: boolean
  },

  progression: {
    totalLevels: number,
    unlockedLevelCount: number,
    highestUnlockedIndex: number | null,
    hasNextLevel: boolean
  },

  grid: {
    bounds: Rect | null,
    cells: PublicCell[],
    pairs: PublicPair[],
    savedLines: PublicLine[],
    activeLine: PublicLine | null,
    targetZones: TargetZone[]
  },

  controls: {
    canUndo: boolean,
    canReset: boolean,
    canBackToLevelSelect: boolean,
    canReplay: boolean,
    canGoNext: boolean
  },

  feedback: {
    lastEvent:
      | "none"
      | "lineStarted"
      | "lineExtended"
      | "lineBacktracked"
      | "lineSaved"
      | "lineRejected"
      | "lineErased"
      | "undo"
      | "reset"
      | "levelComplete"
      | "levelRejected"
      | "navigation",
    visualRevision: number,
    hudRevision: number,
    playfieldRevision: number
  },

  result: {
    status: "none" | "complete",
    currentLevelComplete: boolean,
    rewardAppliedCount: number
  },

  routeHints?: {
    connectableRoute?: CellRef[],
    incompleteRoute?: CellRef[],
    illegalNonAdjacentRoute?: CellRef[],
    illegalOccupiedRoute?: CellRef[],
    backtrackRoute?: CellRef[],
    finalRoute?: CellRef[]
  },

  lastAction: {
    ok: boolean,
    type: string | null,
    reason:
      | "none"
      | "unsupported"
      | "invalidPhase"
      | "lockedLevel"
      | "outOfBounds"
      | "nonAdjacent"
      | "wrongEndpoint"
      | "occupiedCell"
      | "foreignEndpoint"
      | "incompletePath"
      | "blockedByResult"
      | "noUndo"
      | "noChange"
      | "scenarioUnavailable"
  }
};

type Rect = { x: number, y: number, width: number, height: number };

type PublicCell = {
  id: string,
  row: number,
  col: number,
  state: "empty" | "endpoint" | "savedLine" | "activeLine" | "blocked",
  colorKey: string | null,
  center?: { screenX: number, screenY: number }
};

type PublicPair = {
  colorKey: string,
  endpoints: [CellRef, CellRef],
  connected: boolean
};

type PublicLine = {
  colorKey: string,
  cells: CellRef[],
  complete: boolean
};

type TargetZone = {
  id: string,
  kind: "levelEntry" | "gridCell" | "control" | "playfield",
  semantic: string,
  enabled: boolean,
  bounds?: Rect,
  cell?: CellRef,
  levelIndex?: number
};
```

### Snapshot Field Rules

- `grid.cells`, `grid.pairs`, `grid.savedLines`, and `grid.activeLine` are public summaries. They may identify semantic cells and color keys, but must not expose private arrays or renderer objects.
- `center` and `targetZones.bounds` are optional but recommended for real browser-input tests. They describe current visible hit regions, not fixed coordinates.
- `routeHints` are optional deterministic action hints for contract tests. They must contain player-drawable cell sequences only. A route hint must not directly mark a route as saved, complete a level, or award progress.
- `visualRevision`, `hudRevision`, and `playfieldRevision` are monotonic public counters or equivalent revision numbers that change when the corresponding user-visible surface changes. They are not frame counters and must not advance solely because time passed.
- `rewardAppliedCount` counts completion reward applications for the current completion event. Repeated blocked inputs after completion must not increase it.

## 5. External Postconditions

The adapter result is not the only oracle. User-facing implementations must also satisfy these external conditions:

- In `playing`, the playfield is visible, nonblank, and contains a readable grid, endpoints, and any saved or active lines summarized in the snapshot.
- While `canInteractWithPlayfield === true`, real pointer or touch input on visible cell target zones can drive the same drawing actions represented by `input(action)`.
- When `overlayBlocking === true`, visible result or blocking UI prevents new playfield drawing behind it.
- HUD or equivalent progress display changes when saved line count, completed pair count, current level, unlock count, or result status changes.
- Visible controls for undo, reset, back, replay, and next are available only when their corresponding `controls.*` field says they can be used.
- Completion, saved connection, erased line, reset, and rejected line attempts must produce some observable state or visual revision change tied to the action. Static text or interface existence alone is insufficient.

## 6. Feature Contract Matrix

| GDD mechanism | Contract trigger | Required snapshot result | External postcondition |
|---|---|---|---|
| M1 Grid and paired endpoints | `loadScenario("fresh_unlocked_level")` or `chooseLevel` for an unlocked entry | `phase === "playing"`, `gridSize >= 1`, `pairCount >= 2`, pairs have two endpoints, `savedLineCount === 0` | Playfield visibly shows grid and distinguishable endpoints |
| M2 Same-color connection | `dragPath` using a legal route from one endpoint to its same-color partner | `lastAction.ok === true`, `lastEvent === "lineSaved"`, target pair `connected === true`, saved/completed counts increase | Stable line remains visible and HUD/progress reflects the saved connection |
| M3 Legal path restrictions | Stepwise movement or `dragPath` into non-adjacent, out-of-bounds, foreign endpoint, or occupied cell | `lastAction.ok === false` or `lastEvent === "lineRejected"`; saved lines and valid active prefix remain unchanged | No illegal segment appears; existing saved lines are not damaged |
| M4 Real-time drag and backtrack | `pointerDownCell`, adjacent `pointerMoveCell`, reverse `pointerMoveCell` | Active line length grows by one legal adjacent cell, then shrinks on backtrack | Active line is visually distinct from saved lines and follows screen direction |
| M5 Save, failed release, and erase | `pointerUp` on correct endpoint; `pointerUp` on incomplete route; `tapCell` on saved line or same-color endpoint | Correct release saves; incomplete release clears active line without saving; erase removes only that color's saved line | Saved line persists after success, temporary line disappears after failed release, erased cells become available |
| M6 Undo and reset | `undo` after a saved connection; `resetLevel` from a partial or completed state | Undo restores previous saved-line summary; reset clears saved/active lines, closes result, keeps current level layout | Controls visibly update; no level skip or residual completion overlay remains |
| M7 Completion and progress | `loadScenario("one_move_before_completion")` then final legal `dragPath` | `phase === "result"`, `result.status === "complete"`, `overlayBlocking === true`, unlock/progression advances at most once | Completion layer or equivalent appears and playfield input is blocked |
| M8 Menu and level flow | `loadScenario("level_select")`, `chooseLevel`, locked-level attempt, back, replay, next | Unlocked choice enters playing; locked choice rejected; back returns to level select; replay clears current level; next enters next available state | Visible panels hide/show consistently with `phase`, and blocked overlays do not remain after navigation |
| M9 Feedback and atmosphere | Any drag, save, erase, reset, completion, or rejection action | Relevant `feedback.lastEvent` and revisions change with the action | Player can tell active vs saved line, success vs erase, and completion vs playing state |
| M10 Optional depth | P2 scenarios or snapshots when implemented | Optional fields may show records, hints, settings, or extra levels without changing P1 schema | Optional systems cannot bypass core legal drawing, completion, rejection, or menu contracts |

## 7. Invariants and Rejection Semantics

- Grid cell count must remain consistent with the current level size while the same level is active.
- Every saved line must start and end on the two endpoints of its own color and contain only orthogonally adjacent cells.
- Saved lines of different colors must not overlap.
- A saved line may pass through its own endpoints only as route endpoints; it must not use unrelated colored endpoints as ordinary cells.
- Invalid movement, failed release, tapping empty space, choosing a locked level, and input blocked by the result phase must not increase saved-line count, completed-pair count, unlock count, reward count, or result status.
- Erasing one color must not remove unrelated colors.
- `resetLevel` must keep the current level's endpoint layout stable while clearing active/saved lines and result status.
- `replayLevel` from completion must return to `playing` on the same level with zero saved lines.
- `nextLevel` from completion may advance to the next unlocked or newly unlocked level, or return to level selection if no next level exists; it must not skip multiple levels from one completion.
- Repeated irrelevant input after completion must leave `rewardAppliedCount` stable and must not alter saved lines behind the blocking layer.

## 8. Prohibited Test and Adapter Shortcuts

The public adapter must not provide or require:

- direct setters for score, completion, unlocked levels, saved lines, grid occupancy, rewards, or result overlays;
- direct calls to private game functions or renderer methods;
- source-specific function names, private variable names, DOM selectors, CSS classes, asset names, file names, or copied UI text;
- fixed screen coordinates, fixed canvas size, fixed animation timing, exact colors, or exact audio assets as pass criteria;
- hidden algorithm outputs such as a full solver trace, unless represented only as optional player-level route hints that still require `dragPath` or real pointer input to produce the result;
- scenario setup that already contains the exact postcondition being tested.

Tests built from this TDD should verify trigger -> observable result. Interface existence, static text, a non-null canvas, `{ ok: true }`, or a fixed value without a preceding player-level trigger is not sufficient evidence for any P1 mechanism.
