# Frosting Frenzy TDD

## Public Contract Goal

This document defines the public testable contract that the generated version must expose. The contract describes player-level actions, stable snapshots, and external postconditions without restricting the internal architecture, rendering algorithm, assets, DOM hierarchy, or exact copy. The implementation may design the UI freely, but the real mouse/touch/keyboard paths and the large `window.__gameTest` interface must drive the same game state and remain synchronized with the player-visible display.

## Required Public Interface

The implementation must expose:

```javascript
window.__gameTest = {
  reset(options?: object): Snapshot,
  input(action: Action): Snapshot | { ok: false, reason: string, snapshot: Snapshot },
  getSnapshot(): Snapshot,
  loadScenario(name: string, options?: object): Snapshot
}
```

### Method Semantics

- `reset(options)`: Starts a new play session or resets to the playable state of the first round. Optional `options.prompt`, `options.timeLimit`, and `options.seed` are used to select a valid target and timing; it must not award points directly or evaluate the round.
- `getSnapshot()`: Returns a stable summary without exposing the internal object graph.
- `input(action)`: Performs a player-level action equivalent to a real click, drag, key press, or button operation. An invalid action must return `{ ok:false, reason, snapshot }` or an unchanged snapshot and must not throw an exception.
- `loadScenario(name, options)`: Constructs only a valid precondition state. Allowed scenarios: `basic_playing`, `target_one_step`, `partially_decorated`, `near_timeout`, `result_ready`, `config_sample`. It must not directly use a win, added points, a completed rating, or bypassing the core rule chain as a test result.

## Snapshot Schema

```javascript
{
  ok: true,
  phase: "playing" | "evaluating" | "result" | "config",
  screen: "play" | "result" | "config",
  round: number,
  totalScore: number,
  timeRemaining: number,
  timeLimit: number,
  prompt: {
    id: string,
    title: string,
    frosting: string,
    decorations: [{ type: string, minCount: number }]
  },
  selectedFrosting: string | null,
  cake: {
    frosting: string | null,
    decorationCount: number,
    decorationCounts: { [type: string]: number },
    decorations: [{ type: string, screenX: number, screenY: number }]
  },
  tools: {
    frostingColors: string[],
    decorationTypes: string[]
  },
  ui: {
    overlayBlocking: boolean,
    canInteractWithPlayfield: boolean,
    resultVisible: boolean,
    timerVisible: boolean,
    promptVisible: boolean,
    playfieldBounds: { left: number, top: number, width: number, height: number },
    cakeBounds: { left: number, top: number, width: number, height: number },
    frostingTargets: [{ color: string, centerX: number, centerY: number }],
    decorationTargets: [{ type: string, centerX: number, centerY: number }],
    controlTargets: [{ action: "undo" | "clear" | "done" | "nextRound" | "openConfig" | "closeConfig", centerX: number, centerY: number, visible: boolean, enabled: boolean }]
  },
  lastRound: {
    stars: number | null,
    metRequirements: number,
    totalRequirements: number
  }
}
```

### Field Rules

- When `phase=playing`, `ui.canInteractWithPlayfield` must be true, and no visible blocking layer may obscure the cake.
- When `phase=result`, `ui.resultVisible` must be true, and cake editing input must be locked.
- `cake.decorations[].screenX/screenY` are player screen coordinates or equivalent viewport coordinates and are used to verify the semantics of the drag release position.
- `ui.cakeBounds` and the tool target coordinates must come from the current layout and cannot be fixed invisible coordinates.
- `ui.controlTargets` describes the currently clickable centers of player-visible semantic controls; discoverable buttons, ARIA, text, or equivalent semantic controls may also satisfy the real click path, but they must not exist only in an invisible state.
- `lastRound.stars` is null before evaluation; after evaluation it is 0-3.

## Action Schema

```javascript
{ type: "selectFrosting", color: string }
{ type: "applyFrosting", screenX?: number, screenY?: number }
{ type: "dragDecoration", decorationType: string, to: "cakeCenter" | "cakeLeft" | "cakeRight" | "outsideCake" | { screenX: number, screenY: number } }
{ type: "undo" }
{ type: "clear" }
{ type: "done" }
{ type: "nextRound" }
{ type: "key", key: "z" | "c" | "Enter" | "Space" }
{ type: "openConfig" }
{ type: "setConfig", timeLimit?: number, disableOneDecoration?: boolean, disableOneFrosting?: boolean, enablePromptIds?: string[] }
{ type: "closeConfig" }
```

### Action Postconditions

- `selectFrosting`: A valid color changes `selectedFrosting` to that color; selecting it repeatedly may deselect it or keep it selected, but the result must be observable.
- `applyFrosting`: Only when `phase=playing`, a color is selected, and the position is inside the cake does `cake.frosting` change to the selected color, with a corresponding change in the display or HUD.
- `dragDecoration`: A drop point inside the cake increases `cake.decorationCount` by 1, the new decoration type is correct, and `screenX/screenY` are near the release position; a drop point outside the cake must be rejected, and the quantity must remain unchanged.
- `undo`: When there is a decoration, the quantity decreases by 1; when there is no decoration, the state remains unchanged.
- `clear`: The current round's decoration count becomes 0, and the cake frosting and current selection are cleared; `totalScore`, `round`, and `prompt.id` remain unchanged.
- `done`: Enters the result state, calculates 0-3 stars, and adds the number of stars to `totalScore`.
- `nextRound`: Valid only in the result state; returns to playing, clears the cake for the new round, and retains the total score.
- `key`: Shortcuts must be consistent with the corresponding button actions; they must not continue editing the cake in the result state.
- `setConfig`: Valid only in the configuration or configuration-sample scenario; after timing or available tools are adjusted, the change should be observable through the next round or the tool summary, and it must not leave an unplayable state with no available frosting or decorations.

## DOM, HUD, Canvas Postconditions

- The page must have a main playfield, which may be a combination of canvas, SVG, or DOM; core cake changes must be visible.
- After startup, the main playfield must not be blank, and frosting or decoration operations should produce visible changes.
- The HUD must convey core information among the countdown, current target, evaluation star rating, or cumulative score; field names and language are unrestricted.
- Core commands such as done, next round, undo, and clear must have player-visible and triggerable semantic controls; public actions cannot replace the presence of these visible controls.
- In the playable state, the tool area and cake area should not be obscured by a result, configuration, or tutorial layer.
- If a configuration panel is provided, it should have a path to close it; after closing, it returns to a consistent play/config state.

## Illegal Input and Invariants

- Unknown actions, unknown frosting, unknown decorations, missing coordinates, non-numeric coordinates, and editing actions in the result state must be rejected or leave the state unchanged.
- `totalScore` must not be negative; the decoration quantity must not be negative; the countdown must not be less than 0.
- Undo, clear, and invalid dragging should not change the cumulative score.
- From evaluation until the next round, continuing to select, apply frosting, drag, undo, or clear must not change the current round's finished cake or award points again.
- `totalBefore/totalAfter`-type conservation: clear, invalid dragging, and an invalid action must not change the total score; next round resets only the current round's cake and does not reset the cumulative score.

## Behavior Trajectory Contract

| Trajectory | M Coverage | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Playable startup | M1/M2 | `reset({ prompt:"any" })` or default startup | Wait for initialization | phase playing, target, timer, cake, and tools observable | overlayBlocking=false |
| Frosting application | M3 | basic_playing | Actually click the frosting tool, then actually click the center of the cake | selectedFrosting and cake.frosting update, display changes | Clicking outside the cake does not change the frosting |
| Decoration placement | M4 | basic_playing | Use an actual mouse or touch to drag a decoration to the center of the cake | decorationCount +1, the new decoration position is near the release point, display changes | Total score unchanged |
| Touch-equivalent placement | M4/M5 | basic_playing | Use actual touch to drag from the decoration tool to the center of the cake and release | decorationCount +1, the new decoration position is near the release touch point, display changes | The touch path must not only move the preview or be ignored |
| Screen-space dragging | M5 | basic_playing | Drag respectively to the left and right sides of the cake | The left decoration's screenX is less than the right decoration's, and the two are not fixed at the same point | Mirrored or fixed drop points fail |
| Outside-release rejection | M5 | basic_playing | Drag a decoration outside the cake and release | decorationCount unchanged, returns rejection or no change | totalScore unchanged |
| Undo and clear | M6 | partially_decorated | Click undo, then click clear | Undo removes one decoration; after clear, decorations are zero and frosting is null | Round, target, and total score unchanged |
| Completion scoring | M7/M8 | target_one_step | After completing the target requirements, click done | phase result, stars 0-3, totalScore increases by stars, result layer visible | Editing after the round ends does not change decorations or score |
| Timeout evaluation | M7/M8 | near_timeout | Do not click done; wait for the countdown to reach zero | phase result, timeRemaining is not less than 0, stars 0-3, result layer visible | After evaluation, timing stops and points are not awarded repeatedly |
| Next round | M7/M8 | result_ready | Click next round | phase playing, round increases, cake is cleared, total score is retained | Result layer closes and playfield is interactive |
| Shortcuts | M9 | partially_decorated | Press Z/C/Enter | Consistent with undo, clear, and done | Shortcut editing in the result state is rejected |
| Configuration | M10 | config_sample | Open configuration, toggle available items or timing, and close | Tool or timing configuration is reflected in the next round | Does not result in no playable target |

## Feature to Interface Mapping

| M | Public Actions | Snapshot Evidence | User-visible Evidence |
|---|---|---|---|
| M1 | reset/getSnapshot | phase, ui, tools | Main screen, cake, HUD, tools |
| M2 | reset/loadScenario | prompt | Target display |
| M3 | selectFrosting/applyFrosting | selectedFrosting, cake.frosting | Frosting selection feedback, cake changes |
| M4 | dragDecoration | decorationCount, decorations, ui.decorationTargets | Mouse/touch drag preview, decoration drop point |
| M5 | dragDecoration outside/left/right | unchanged count, screenX order | No new decoration on outside release, corresponding left/right drop points |
| M6 | undo/clear/key | decorationCount, cake.frosting | Cake clearing |
| M7 | done/nextRound | phase, resultVisible, round, timeRemaining | Result layer, next-round main screen, timeout result |
| M8 | done/loadScenario target_one_step | lastRound, totalScore | Star rating/total score HUD |
| M9 | key | state deltas | Shortcut effects and locking |
| M10 | openConfig/setConfig/closeConfig/loadScenario config_sample | screen, tools, timeLimit | Configuration panel or equivalent configurable result |

## Generation Acceptance Constraints

The generated version must implement `window.__gameTest` as a large public interface contract; it cannot merely return `{ ok:true }` or modify only invisible state. Each setup/action must drive the real HUD/playfield into the postconditions above synchronously or after a short delay. Core acceptance evidence must come from state changes after player-level input, display/HUD/result-layer changes, invariants, or rejection paths.
