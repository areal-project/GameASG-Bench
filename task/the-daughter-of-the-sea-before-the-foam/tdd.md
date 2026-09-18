# The Daughter of the Sea: Before the Foam TDD Contract

## Scope

This contract defines a portable public test surface for the story-driven puzzle game described in `game-spec.md` and `design-doc.md`. It exposes only player-level actions, legal scenario entry points, stable snapshot summaries, semantic playfield geometry, and observable postconditions.

The contract must not require a specific rendering technology, DOM structure, file layout, private function, private state object, copied source wording, exact asset, fixed coordinate, or particular puzzle algorithm. Equivalent implementations may use different UI, art, animations, storage, and internal data as long as the public behavior below is observable.

## Public Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  getSnapshot(): Snapshot,
  input(action): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

The public callable method names are:

- `window.__gameTest.reset(options?)`
- `window.__gameTest.getSnapshot()`
- `window.__gameTest.input(action)`
- `window.__gameTest.loadScenario(name, options?)`

Method semantics:

- `reset(options?)` returns the game to a fresh boot/menu state. It may accept `{ clearSave: true }` to clear persistent progress before reset. It must not award progress, complete a puzzle, or force an ending.
- `getSnapshot()` returns the current stable public summary without mutating gameplay.
- `input(action)` performs one player-level action or a short player-equivalent gesture and returns the resulting snapshot after relevant immediate effects settle.
- `loadScenario(name, options?)` loads a legal precondition state listed in this document. It may choose deterministic puzzle arrangements for testability, but those arrangements must be valid playable states and must not already contain the outcome being tested.

All methods should return a `Snapshot`. Invalid actions should not throw; they should return a snapshot with `lastAction.accepted === false` or an equivalent rejection summary while preserving gameplay state.

## Action Schema

Every action uses a `type` string and optional fields. Coordinates, when needed, must be semantic positions from the current snapshot, not fixed screen constants.

| Action | Required fields | Meaning |
|---|---|---|
| `pressControl` | `control` | Activates a semantic UI control. Candidate controls: `newGame`, `continueGame`, `restartJourney`, `continueStory`, `replayEnding`, `backToMenu`, `settings`, `closePanel`. |
| `dragPiece` | `pieceId`, `toCell` or `direction`, optional `pointerKind` | Presses a visible single piece, drags in screen direction or to a semantic target cell, and releases. `pointerKind = mouse|touch|either`. |
| `dragGroup` | `groupId`, `toCell` or `direction`, optional `pointerKind` | Presses a visible merged group, drags the group, and releases. |
| `pointerDrag` | `start`, `end`, optional `pointerKind` | Browser-level drag using semantic points such as a piece center, group center, or target cell center from snapshot geometry. |
| `chooseBranch` | `choice` | Selects one of the two visible branch choices. Candidate values: `A|B`. Only valid after a completed branch story is revealed. |
| `wait` | optional `until`, `ms` | Waits for animations, loading, story reveal, or screen transition. Candidate `until`: `ready|settled|storyRevealed|transitionComplete`. |
| `setPreference` | `key`, `value` | Optional P2 preference action for visible settings such as sound or move display when implemented. |

Action postcondition requirements:

- Drag actions must behave like real pointer input: a held piece or group enters a picked-up/preview state, movement follows screen direction, and release performs the legal exchange or rejection.
- `pressControl` and `chooseBranch` must be equivalent to visible player controls and must not skip puzzle completion requirements.
- `wait` cannot advance story, solve puzzles, grant choices, or award endings by itself.

## Scenario Schema

`loadScenario(name)` may support the following legal preconditions. Each scenario must return `scenario.name`, `scenario.legal === true`, and enough snapshot geometry for player-level follow-up actions.

| Scenario | Legal precondition | Player action that triggers the tested result | Explicitly forbidden setup |
|---|---|---|---|
| `menuReady` | Loading has completed; main menu controls are available. A save may or may not exist according to options. | `pressControl(newGame)` or `pressControl(continueGame)` enters a playable puzzle. | Must not start inside a puzzle or mark a level complete. |
| `freshTutorialPuzzle` | First journey puzzle is active, small grid, not complete, with a visible guided move available. | Correct `dragPiece` advances tutorial; non-guided `dragPiece` is rejected. | Must not pre-complete tutorial or perform the guided exchange. |
| `activePuzzle` | A normal playable puzzle is active, shuffled, not complete, no blocking story/result overlay. | Valid `dragPiece` changes arrangement and exchange count; invalid drag is rejected. | Must not start solved or with story controls visible. |
| `directionProbePuzzle` | Active puzzle with at least one piece that can be dragged horizontally and vertically without immediate completion. | Opposite `dragPiece` or `pointerDrag` directions produce opposite screen-space preview/target movement or corresponding rejection. | Must not fake direction by only changing a hidden field. |
| `mergeCandidatePuzzle` | Active puzzle where a valid exchange can create or expand at least one correct-adjacent merged group, but the puzzle is not complete. | The declared valid `dragPiece` triggers merge feedback and group summary change. | Must not start with the target merge already counted as newly created. |
| `mergedGroupPuzzle` | Active puzzle with at least one legal merged group already visible and movable; not complete. This state must be reachable through earlier valid exchanges. | `dragGroup` moves the whole group when legal; an out-of-bounds or shape-invalid `dragGroup` is rejected. | Must not directly solve the puzzle, skip displacement, or bypass the drag gesture. |
| `nearCompletionPuzzle` | Active puzzle is one valid player exchange away from completion; not currently complete; no story controls visible. | The declared valid `dragPiece` or `dragGroup` completes the puzzle and triggers story reveal. | Must not mark `complete`, show story, or expose continue/choice controls before the move. |
| `completedSequentialStory` | A sequential story node has been completed by puzzle play; story is revealed and a continue control is visible. | `pressControl(continueStory)` enters the next active puzzle and clears prior temporary state. | Must not directly choose a branch or enter an ending. |
| `completedBranchStory` | A branch story node has been completed by puzzle play; exactly two branch choices are visible. | `chooseBranch(A|B)` records one choice and enters the corresponding next puzzle. | Must not preselect a choice or make both choices active. |
| `endingRevealed` | An ending has been reached through a valid path; ending display and replay control are visible. | `pressControl(replayEnding)` or `pressControl(restartJourney)` returns to a fresh journey/menu state. | Must not leave old puzzle input active or preserve temporary completion panels. |
| `savedProgressMenu` | Menu state with a valid saved unfinished journey. | `pressControl(continueGame)` restores the saved puzzle and path summary. | Must not use an already ended journey as continue progress. |

Scenarios are setup aids, not cheat channels. They may expose `recommendedAction` describing a valid next player action, but they must not expose direct setters for score, step count, completion, choices, or ending.

## Snapshot Schema

`Snapshot` must be JSON-serializable and stable across equivalent implementations. Extra fields are allowed, but tests will only rely on public fields declared here.

```typescript
type Snapshot = {
  ok?: boolean,
  phase: "loading" | "menu" | "playing" | "story" | "branch" | "ending" | "error",
  screen: "loading" | "menu" | "puzzle" | "story" | "branch" | "ending" | "settings" | "error",
  ready: boolean,
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  controls: {
    newGame?: ControlState,
    continueGame?: ControlState,
    continueStory?: ControlState,
    replayEnding?: ControlState,
    branchA?: ControlState,
    branchB?: ControlState
  },
  story: {
    nodeId?: string,
    pathKey?: string,
    revealed: boolean,
    isBranch: boolean,
    isEnding: boolean,
    endingType?: "foam" | "dark" | "blessing" | "missed" | "escape" | "other" | "none",
    choicesMade: Array<{ nodeId: string, choice: "A" | "B" }>
  },
  puzzle?: PuzzleSnapshot,
  progress: {
    hasSave: boolean,
    currentLevelIndex?: number,
    completedTutorial: boolean,
    reachedEndingTypes: string[]
  },
  lastAction?: {
    type?: string,
    accepted?: boolean,
    reason?: "ok" | "invalidPhase" | "invalidTarget" | "outOfBounds" | "notGuided" | "locked" | "busy" | "notAvailable" | "noChange" | "unknown"
  },
  visual?: {
    playfieldVisible: boolean,
    playfieldChangedRevision?: number,
    hudRevision?: number,
    feedbackRevision?: number
  },
  scenario?: {
    name?: string,
    legal?: boolean,
    recommendedAction?: object
  }
}
```

```typescript
type ControlState = {
  visible: boolean,
  enabled: boolean,
  bounds?: Bounds
}

type PuzzleSnapshot = {
  gridSize: number,
  totalPieces: number,
  arrangementSignature: string,
  solved: boolean,
  exchangeCount: number,
  busy: boolean,
  dragging: {
    active: boolean,
    subjectType?: "piece" | "group",
    subjectId?: string,
    previewBounds?: Bounds,
    originCell?: CellCoord,
    currentScreen?: Point
  },
  playfieldBounds: Bounds,
  cells: Array<{
    row: number,
    col: number,
    center: Point,
    bounds: Bounds,
    occupantId: string
  }>,
  pieces: Array<{
    id: string,
    currentCell: CellCoord,
    homeCell?: CellCoord,
    bounds: Bounds,
    movable: boolean,
    inGroup?: string
  }>,
  groups: Array<{
    id: string,
    pieceIds: string[],
    cellShape: CellCoord[],
    bounds: Bounds,
    movable: boolean
  }>,
  mergeCount: number,
  tutorial?: {
    active: boolean,
    stepIndex?: number,
    guidedPieceId?: string,
    guidedTargetCell?: CellCoord,
    allowedDirection?: "left" | "right" | "up" | "down" | "horizontal" | "vertical"
  },
  legalMoves?: Array<{
    subjectType: "piece" | "group",
    subjectId: string,
    fromCell: CellCoord,
    toCell: CellCoord,
    direction: "left" | "right" | "up" | "down",
    completesPuzzle?: boolean,
    createsMerge?: boolean
  }>
}
```

```typescript
type Bounds = { x: number, y: number, width: number, height: number }
type Point = { screenX: number, screenY: number }
type CellCoord = { row: number, col: number }
```

Snapshot field rules:

- `arrangementSignature` must change after an accepted exchange and remain unchanged after a rejected drag. It must be opaque and not reveal internal arrays.
- `exchangeCount` must increase only after accepted exchanges.
- `playfieldBounds`, `cells[].center`, `pieces[].bounds`, and `groups[].bounds` are semantic geometry for portable tests. They are measured at runtime and must not require a fixed viewport or fixed coordinates.
- `groups` summarizes only player-visible merged blocks. It must not expose private merge graph details.
- `visual.playfieldChangedRevision`, `visual.hudRevision`, and `visual.feedbackRevision` are monotonic or changing summaries that allow tests to observe visible updates without relying on exact pixels or text.

## Feature Contract Matrix

| GDD feature | Public trigger | Required snapshot result | External postcondition |
|---|---|---|---|
| M1 menu start and continue | `pressControl(newGame)` from `menuReady`; `pressControl(continueGame)` from `savedProgressMenu` | `phase=playing`, `screen=puzzle`, `ready=true`, `canInteractWithPlayfield=true`, puzzle present | Menu or loading overlay no longer blocks playfield; puzzle area is visible and non-empty. |
| M2 puzzle generation | Start, continue, or story transition into puzzle | `puzzle.gridSize >= 2`, `totalPieces = gridSize * gridSize`, `solved=false`, non-empty piece and cell summaries | A shuffled story illustration puzzle is visible; previous story/choice/end overlays are absent or non-blocking. |
| M3 single-piece drag exchange | Valid `dragPiece` or `pointerDrag` from active puzzle | `lastAction.accepted=true`, `arrangementSignature` changes, `exchangeCount` increases, `busy` eventually returns false | Pick-up, preview, snap/exchange, and displaced-piece feedback are visible or reflected by feedback revision. |
| M3 invalid drag rejection | Zero-distance, out-of-bounds, locked, busy, or non-guided `dragPiece` | `lastAction.accepted=false`; arrangement and exchange count unchanged | The piece/group returns to its original cell; no story or completion controls appear. |
| M3 direction causality | Opposite semantic drags from `directionProbePuzzle` | Preview or accepted target direction corresponds to screen direction; opposite directions produce opposite target cells or symmetric rejections | The dragged preview moves toward the same screen side as the pointer movement. |
| M4 merged group movement | `dragGroup` from `mergedGroupPuzzle` | Legal move changes arrangement, keeps group subject pieces relatively together during drag, then recalculates groups | Whole block visibly lifts/moves; displaced pieces or groups give way when applicable. |
| M4 group invalid placement | Out-of-bounds or invalid-shape `dragGroup` | `lastAction.accepted=false`; arrangement, exchange count, and group membership summary unchanged | Group visibly rebounds or remains in place; no partial move remains. |
| M5 auto merge and split/reform | Valid exchange from `mergeCandidatePuzzle`; later exchange that breaks adjacency | `mergeCount` or `groups` changes after merge; broken relationship no longer appears as one complete group | Correct adjacency receives visible boundary/highlight/continuous-block feedback; broken adjacency loses that feedback. |
| M6 completion and story reveal | Valid final move from `nearCompletionPuzzle` followed by `wait(storyRevealed)` | `puzzle.solved=true`, `phase=story|branch|ending`, `canInteractWithPlayfield=false`, story revealed | Celebration/completion feedback appears, image presentation changes, and the appropriate next-step control appears. |
| M6 completion lock | Any `dragPiece` or `dragGroup` after completion story is revealed | `lastAction.accepted=false`; solved state and story controls remain stable | Completed puzzle cannot be disrupted by further dragging. |
| M7 branch choice | `chooseBranch(A)` or `chooseBranch(B)` from `completedBranchStory` | One choice appended to `choicesMade`; next puzzle or path key changes according to selected branch | Exactly one selected path proceeds; old branch buttons stop blocking the new puzzle. |
| M8 endings and replay | Completing a valid path to ending; `pressControl(replayEnding)` | Ending phase has `endingType` in declared candidates; replay returns to menu or fresh journey with transient puzzle state cleared | Ending display is visible and distinct enough to identify its type; replay does not leave old overlays/input locks. |
| M9 tutorial progression | Correct guided `dragPiece`; wrong guided-state drag | Correct move advances tutorial or completes it; wrong move rejected with puzzle unchanged | Guidance is visible while active; non-guided attempts do not progress the tutorial. |
| M10 save and state cleanup | Progress transition then reset/menu/continue | `progress.hasSave` reflects unfinished progress; continue restores current level/path; new journey clears temporary drag/story state | Continue control is available only for unfinished saved progress; new puzzle is not blocked by previous overlays. |
| M11 P2 audio atmosphere | First interaction, completion, scene/ending transition when audio implemented | Optional audio state may change; gameplay snapshots remain valid when audio is unavailable or muted | Visual feedback remains sufficient without sound. |
| M12 P2 settings/review | `pressControl(settings)` or `setPreference` when available | Preference or review snapshot changes without corrupting puzzle state | Settings/review panels do not permanently block normal play after close/resume. |
| M13 P2 preview/custom mode | Optional preview/setup controls | Preview state is distinguishable from main journey and can return to normal play | Preview cannot satisfy main story completion or ending requirements by itself. |

## External Observable Postconditions

Runtime checks may combine the snapshot with browser-visible evidence:

- The primary playfield must be visible and non-empty whenever `phase=playing`.
- `overlayBlocking=false` and `canInteractWithPlayfield=true` must agree: a visible menu/story/ending overlay cannot block puzzle input while the snapshot claims active play.
- Real mouse or touch drags against semantic piece/group bounds must produce the same accepted/rejected result as the corresponding `input` drag action.
- Story, branch, and ending controls must be discoverable through semantic control states or visible enabled controls. Tests must not rely on exact button text.
- Completion, merge, snap, rebound, and transition feedback may be observed by snapshot revisions, visible state changes, canvas/image change summaries, or semantic UI state. Exact animation timing, color, sound, and text are not fixed.

## Rejection And Invariants

- No action may directly set `solved`, `endingType`, `exchangeCount`, `choicesMade`, or saved progress except through the declared player-level flow.
- Rejected drags preserve `arrangementSignature`, `exchangeCount`, puzzle completion state, and story path.
- While `puzzle.busy=true`, new puzzle drag input is rejected or queued without corrupting the arrangement.
- `phase=story`, `phase=branch`, and `phase=ending` lock puzzle dragging until a valid next-step control transitions back to playing or menu.
- `chooseBranch` is valid only when two branch choices are visible and enabled.
- `continueStory` is valid only after a completed sequential story reveal.
- `continueGame` is valid only when `progress.hasSave=true` for an unfinished journey.
- Starting a fresh journey clears transient drag previews, completion panels, branch controls, and ending locks.
- Endings must be reached through valid path progression; `loadScenario` may enter an already reached ending only to test replay cleanup, not to satisfy ending reachability checks.

## Forbidden Contract Requirements

The TDD and future checks must not require:

- private variable names, private function names, classes, source selectors, source file names, or source asset identifiers;
- a fixed grid pixel size, viewport, coordinate, animation duration, color, font, or exact text;
- a specific canvas, DOM, WebGL, framework, storage key, or rendering hierarchy;
- direct mutation of pieces, groups, progress, choices, score/moves, solved state, or ending state;
- a test-only action that swaps pieces, completes a puzzle, grants a merge, opens a story, selects a hidden path, or awards an ending without the corresponding player-level trigger.
