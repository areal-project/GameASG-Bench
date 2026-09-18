# Sortie TDD Public Test Contract

## Scope

This document defines only Sortie's public testable surface for verifying the player-visible behaviors already defined in `game-spec.md` and `design-doc.md`. The contract constrains input actions, valid prerequisite states, stable snapshot summaries, and external postconditions; it does not constrain source structure, private functions, rendering implementation, DOM hierarchy, fixed screen coordinates, specific algorithms, or asset naming.

The test entry point may verify player paths through real mouse/touch input, or it may verify the semantic contract through the following public interface. The public interface must not become a cheating channel: it may only simulate player-level actions or read summaries and cannot directly set score, victory or defeat, completion count, locked state, rewards, hint results, or item-placement results.

## Public Interface

The implementation should expose:

```javascript
window.__gameTest = {
  reset(): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name): Snapshot
}
```

### Method Semantics

- `reset()`: Return to a stable state after game startup or the initial state of the current testable session. It must not retain an old completion panel, old hint, highlight, in-progress drag state, or remnants of the previous level.
- `getSnapshot()`: Return a stable summary. It must not return an internal object graph, private instance, source-function reference, or live object that tests can directly modify.
- `input(action)`: Execute a player-level action and return the resulting `Snapshot`. An invalid action should not throw an unhandled exception; it should return a stable snapshot and express rejection or no change through `lastAction`.
- `loadScenario(name)`: Load a valid prerequisite state. A Scenario may only construct states reachable through normal player flow and must not pre-grant victory, rewards, direct completion, a direct error result, or directly lock the object under verification.

## Action Schema

`action` is an object and must contain `type`. Coordinate-based actions use semantic points exposed in the snapshot or runtime geometry conversion; requiring fixed pixel positions is prohibited.

| type | Fields | Player-level semantics | Expected post-action summary |
|---|---|---|---|
| `start` | None | Confirm the start guide | `phase` changes from `intro` or `menu` to `playing`, and the main play area becomes interactive |
| `openLevelSelect` | None | Open level selection | `screen` or `activePanel` indicates level selection, and whether main-play input is blocked is explicit |
| `chooseLevel` | `levelIndex` | Select a level entry | Keep/load an available current level; reject a future or locked level while keeping the level and progress stable |
| `closePanel` | None | Close the current closable panel | After the panel closes, restore or retain main-play input according to the state |
| `resetLevel` | None | Reset the current level | Items return to incomplete, draggable states; progress, score, combo, hint, and completion panel are cleared |
| `requestHint` | None | Request a hint | A single incomplete target slot enters the hint summary; hints do not stack when the level is complete or a hint already exists |
| `pointerDown` | `itemId` or `screenX/screenY` | Hold a draggable item | A draggable item enters the dragging state; dragging a correctly locked item is rejected |
| `pointerMove` | `screenX`, `screenY` or `dx`, `dy` | Drag an item | While dragging, the item moves in the same screen direction and remains within the playable area |
| `pointerUp` | `screenX`, `screenY` or `slotId`/`zone` | Release an item | Trigger slot snapping, incorrect trial placement, or outside-slot release evaluation |
| `dragItemTo` | `itemId`, `target` | Complete drag-and-drop gesture; `target` may be `slot:<slotId>`, `outsidePlayableArea`, `itemStartArea`, or a semantic point | Post-action result equivalent to real drag-and-drop; it cannot skip the press, movement, and release semantics |
| `nextLevel` | None | Enter the next level from the completed state | Load the next themed level or the replayable flow after the final P1 level, clearing old state |
| `retryLevel` | None | Replay or reset this level from the completed state | The current level returns to an incomplete, playable state |
| `wait` | `ms` | Player pauses briefly | Used only to observe a hint disappearing, an animation stabilizing, or feedback after waiting; it must not advance untriggered rewards |

`dragItemTo` is a player-level compound action provided for convenient contract testing; behavioral tests should still cover at least the real mouse or touch path. If an `itemId`, `slotId`, or semantic point does not exist, the action must be rejected without changing core state.

## Scenario Schema

`loadScenario(name)` supports the following valid prerequisite states. Every scenario must still require a player action to trigger its postcondition.

| name | Valid prerequisite state | Triggerable result |
|---|---|---|
| `boot` | The game has just loaded, and the start guide or an equivalent entry point is visible | `start` triggers entry into the playing state |
| `level_start` | Initial playable state of a level within P1 scope, with all items not yet correctly placed | Dragging, hint, reset, open level selection |
| `wrong_choice_ready` | Playing state, with at least one incomplete item, one target slot, and one non-target slot all visible and interactive | Dragging that item to a non-target slot triggers an incorrect trial placement; it can then be dragged away and corrected |
| `outside_drop_ready` | Playing state, with at least one incomplete item and the playable-area boundary observable | Dragging the item outside slots or near the boundary triggers a recoverable release |
| `hint_ready` | Playing state, with an incomplete item and no currently active hint | `requestHint` triggers a single hint; beginning to drag clears the hint |
| `level_select_ready` | Playing state, with the current level playable and at least one future or locked level that cannot be skipped to | Opening level selection and selecting an unavailable level triggers rejection |
| `final_p1_level_start` | Initial playable state of the 5th P1 level, incomplete and completable through normal drag-and-drop | The player completes all items to trigger the replayable flow for the final level |
| `editor_available` | Normal-play prerequisite state when a P2 creation/editing capability entry point exists | After entering the editing capability, it is isolated from normal play; if not implemented, the snapshot should clearly indicate unavailability |

Prohibited scenarios: preconfigured victory, preconfigured completion panel, preconfigured score rewards, preconfigured final item already placed, preconfigured correct item under verification already locked, directly asserting after preconfiguring an error result, or directly passing after preconfiguring a completed hint.

## Snapshot Schema

`Snapshot` must be a serializable object. Fields may include implementation-specific extensions, but the following fields are the public contract.

```typescript
type Snapshot = {
  phase: "booting" | "intro" | "menu" | "playing" | "dragging" | "paused" | "levelSelect" | "completed" | "editing";
  screen: "intro" | "play" | "levelSelect" | "completed" | "editor" | "none";
  activePanel: "intro" | "levelSelect" | "completed" | "editor" | "none";
  overlayBlocking: boolean;
  canInteractWithPlayfield: boolean;

  level: {
    index: number;
    p1LevelCount: number;
    themeLabel?: string;
    itemTotal: number;
    completedCount: number;
    availableLevelIndexes: number[];
    lockedLevelIndexes: number[];
  };

  score: {
    value: number;
    combo: number;
    longestCombo: number;
    elapsedMs: number;
  };

  playfield: {
    bounds: { screenX: number; screenY: number; width: number; height: number };
    visibleRevision: number;
    hasReadableTray: boolean;
    hasReadableSlots: boolean;
  };

  items: Array<{
    id: string;
    state: "unplaced" | "dragging" | "trial" | "placed";
    locked: boolean;
    screenX: number;
    screenY: number;
    width: number;
    height: number;
    visible: boolean;
    draggable: boolean;
    slotId: string | null;
    targetSlotId: string;
  }>;

  slots: Array<{
    id: string;
    screenX: number;
    screenY: number;
    width: number;
    height: number;
    visible: boolean;
    occupiedItemIds: string[];
    correctItemId?: string;
    highlighted: boolean;
  }>;

  hint: {
    active: boolean;
    highlightedSlotId: string | null;
    stackCount: number;
  };

  completion: {
    result: "none" | "levelComplete";
    panelVisible: boolean;
    canGoNext: boolean;
    canRetry: boolean;
    finalScore?: number;
    longestCombo?: number;
    elapsedMs?: number;
  };

  controls: {
    start: boolean;
    reset: boolean;
    hint: boolean;
    levelSelect: boolean;
    nextLevel: boolean;
    retry: boolean;
    editor: boolean;
  };

  feedback: {
    lastPlacement: "none" | "correct" | "wrong" | "outside" | "rejected";
    successRevision: number;
    errorRevision: number;
    hintRevision: number;
    celebrationRevision: number;
  };

  lastAction: {
    ok: boolean;
    type: string | null;
    reason?: "invalidAction" | "notInteractable" | "lockedItem" | "invalidLevel" | "blockedByOverlay" | "noTarget" | "alreadyComplete" | "none";
  };
}
```

### Field Rules

- `level.p1LevelCount` must be at least 5. `availableLevelIndexes` and `lockedLevelIndexes` communicate linear progression; free level skipping is not required.
- `items[].id` and `slots[].id` are opaque, stable identifiers for testing; they cannot be required to originate from any particular source naming.
- `items[].targetSlotId` and `slots[].correctItemId` are semantic hit-point summaries, used only to let tests bind drag-and-drop targets to the product semantics of a "correct/incorrect slot"; they cannot be exposed to the player by default as in-game hints.
- `screenX/screenY` represents a semantic center point in the current viewport. Tests should use these points or runtime bounds conversion and must not use fixed coordinates.
- `playfield.visibleRevision` and `feedback.*Revision` are monotonic or change-based summaries used to prove that visible feedback occurred; core mechanics must not pass solely through fixed values.
- When `phase === "playing"`, if `overlayBlocking === true`, the source of blocking must be explainable through `activePanel`. The start guide or completion panel may block input, but after closing or starting, no panel blocking main-play input may remain.
- `completedCount` may only increase because of correct placement and must be within `0..itemTotal`. Incorrect trial placement, outside-slot release, invalid level selection, hints, and opening panels must not increase it.
- `score.value` may increase only from correct placement or the level-completion reward; incorrect trial placement does not deduct points already earned, but resets `combo` to a non-consecutive state.

## External Postconditions

- Enter playing: The start guide disappears or no longer blocks input; the level/progress/tray/slots/items/controls are visible, and `canInteractWithPlayfield === true`.
- While dragging: The dragged item's `state === "dragging"` and `draggable === true`; its center follows the input's directional change, and `playfield.visibleRevision` or the item's visible position changes.
- Correct release: The target item changes to `state === "placed"`, `locked === true`, and `slotId === targetSlotId`; `completedCount` increases by 1, score increases, combo advances according to the rules, and the success-feedback revision changes.
- Incorrect release: The item changes to `state === "trial"` or an equivalent incomplete state, `locked === false`, `completedCount` does not increase, the completion result remains `none`, the error-feedback revision changes, and the item remains draggable again.
- Outside-slot release: The item remains `unplaced` or in an equivalent incomplete state, remains visible and draggable within the playable area, and does not increase progress, score, or the completion result.
- Correcting a mistake: After an item in an incorrect trial-placement or incomplete state is dragged again to its target slot, it must trigger the correct-release postconditions.
- Locked rejection: Ordinary dragging of a correctly placed item is rejected; its position, progress, and score should not change because of repeated dragging.
- Complete level: After the player completes all items through drag-and-drop, `phase` or `completion.result` indicates completion, the completion panel is visible, a results summary exists, and drag-and-drop in the old level no longer changes progress or score.
- Next level: After executing `nextLevel` from the completed state, the level index advances or the final P1 level enters a replayable flow; the new level's items, slots, progress, score, combo, hint, and completion panel are all in a new state.
- Reset: All items in the current level return to incomplete, draggable states; progress, score, combo, hint, and completion panel are cleared; pairing relationships and item/slot counts remain stable.
- Level-selection rejection: When selecting a future, locked, or out-of-range level, `lastAction.ok === false` or `reason` expresses rejection; the current level, organized progress, score, and item states remain stable, and visible rejection feedback occurs.
- Hint: Only one active hint appears after requesting a hint; repeated requests do not stack; beginning to drag an item clears the hint.
- P2 editing capability: If implemented, after entry `phase === "editing"` or `screen === "editor"`, and normal play is isolated from editing controls; if not implemented, `controls.editor === false` and P1 play must not be obstructed.

## Feature Contract Matrix

| GDD Mechanic | Contract input | Snapshot output | Valid candidates/postconditions |
|---|---|---|---|
| M1 Start guide and main interface | `loadScenario("boot")` -> `input({type:"start"})` | `phase`, `screen`, `overlayBlocking`, `canInteractWithPlayfield`, `controls` | Enters `playing`; main play is interactive and the entry panel does not block it |
| M2 Themed levels and layouts | `loadScenario("level_start")`, `nextLevel` flow | `level`, `items`, `slots`, `playfield` | At least 5 P1 levels; every level has visible item/slot elements with matching counts, and switching levels clears old state |
| M3 Responsive item dragging | `pointerDown` + `pointerMove` or the movement phase of `dragItemTo` | `items[].state`, `screenX/screenY`, `playfield.visibleRevision` | The item moves in the same direction as the input and remains visible and controllable; correctly locked items reject dragging |
| M4 Release evaluation and snapping | Execute `pointerUp` near a slot or outside slots | `items[].slotId`, `feedback.lastPlacement`, `items[].visible` | Snaps near a slot; outside slots, it does not disappear or complete |
| M5 Correct-placement rewards | Drag the item to `targetSlotId` | `completedCount`, `score`, `items[].locked`, `feedback.successRevision` | Progress and score increase and the item locks; repeating the same item must not score again |
| M6 Incorrect trial placement and correction | Drag the item to a non-`targetSlotId`, then drag it to the target slot | `items[].state`, `completedCount`, `score.combo`, `feedback.errorRevision` | An error does not count toward progress, complete, or lock; afterward, the item can be dragged away again and correctly placed |
| M7 Completion and next step | From `level_start`, complete all items through player-level drag-and-drop, then `nextLevel` | `completion`, `phase`, `level`, `score` | Completion panel and results are visible, old-level input is locked; next-level/replay flow clears state |
| M8 Reset | `resetLevel` or `retryLevel` from the completed state | `items`, `level.completedCount`, `score`, `hint`, `completion` | Return to the current level's incomplete, playable state, with pairing relationships unchanged |
| M9 Linear level selection | `openLevelSelect` -> `chooseLevel` | `activePanel`, `availableLevelIndexes`, `lockedLevelIndexes`, `lastAction` | Current level is available; future/locked/out-of-range selections are rejected and state remains stable |
| M10 Hint and clearing | `requestHint`, repeated request, begin dragging | `hint`, `feedback.hintRevision` | A single hint is highlighted, repeated requests do not stack, and dragging clears it |
| M11 More themes | `nextLevel` or available-level selection | `level.p1LevelCount`, `level.index`, `items`, `slots` | P2 themes, if present, must be playable; unimplemented themes must not be exposed as empty levels |
| M12 Editing/creation mode | Enter editing capability when `controls.editor` is true | `phase`, `screen`, `canInteractWithPlayfield` | Isolated from normal play; players are not required to use editing to complete P1 |
| M13 Enhanced audio, visuals, and celebrations | Correct placement, wait, completion | `feedback.*Revision`, `playfield.visibleRevision` | The feedback revision or visible summary changes when triggered; it cannot replace the core state causal chain |

## Anti-Cheating and Rejection Rules

- An action is not allowed to directly set `completedCount`, `score`, `combo`, `completion.result`, `items[].state`, `items[].locked`, or level completion.
- A scenario is not allowed to directly construct the reward, victory, final-step completion, error feedback, or locked result under verification.
- Private function names, source variables, fixed DOM selectors, fixed pixel coordinates, fixed colors, fixed copy, or fixed canvas dimensions are not allowed as the sole oracle.
- When `input()` returns `{ ok: true }`, that alone cannot indicate a pass; it must be supported by schema fields, a state delta, or a visible-feedback summary.
- For core P1 mechanics, tests must use trigger -> observable result: after a player-level drag-and-drop, panel click, hint, reset, or next-level action, they must observe at least a state summary and one externally visible postcondition.
- Invalid actions, non-interactive states, states blocked by the completion panel, and dragging of locked items must be rejected while keeping core progress/score stable.

## Self-Review Conclusion

- This contract extracts only the public interface, action, scenario, snapshot fields, and postconditions from the P1/P2 behaviors already defined in `game-spec.md` and `design-doc.md`; it adds no hidden gameplay.
- All Scenarios are valid prerequisite states, and completion, rewards, incorrect trial placement, hint results, and level progression must all be triggered by player-level actions.
- Every core mechanic corresponds to trigger -> observable result in the matrix and includes at least one of progress, score, visible feedback, locking/rejection, or state stability.
- The contract does not require private implementation, source functions, DOM structure, fixed coordinates, fixed algorithms, fixed assets, or exact copy.
