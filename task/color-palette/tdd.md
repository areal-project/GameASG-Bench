# Color Palette TDD

## Objective

This document defines the public testable contract and player-level behavior trajectories. The implementation may freely choose the UI structure, drawing method, and internal data, but it must expose the following broad player-understandable interface and keep interface actions consistent with the real UI, HUD, and canvas results.

## Public Interface

The following must be exposed:

```javascript
window.__gameTest = {
  reset(options),
  input(action),
  getSnapshot(),
  loadScenario(name)
}
```

### `reset(options)`

- Semantics: return to the default creatable state, with the current line art set to the first image or a specified valid image, the current color set to the first color or a specified valid color, and the current line art uncolored.
- Input: `options` is optional and permits `{ imageIndex, colorIndex, phase }`; invalid values must be rejected or fall back to valid defaults.
- Output: `Snapshot`.
- External postconditions: the confirmation panel is closed, the canvas displays uncolored line art, and the tool area is operable.

### `getSnapshot()`

Returns a stable summary without exposing the internal object graph. Recommended fields:

```javascript
{
  phase: "playing" | "confirm-clear" | "edit",
  screen: "coloring",
  activePanel: "none" | "clear-confirm" | "edit",
  overlayBlocking: false,
  canInteractWithPlayfield: true,
  currentColorIndex: 0,
  currentColor: "#RRGGBB",
  paletteCount: 8,
  imageIndex: 0,
  imageCount: 8,
  filledCount: 0,
  coloredPixelRatio: 0,
  canvas: { width: 0, height: 0, screenX: 0, screenY: 0, screenW: 0, screenH: 0, nonBlank: true },
  samplePoints: {
    fillable: [{ x, y, screenX, screenY }],
    boundary: [{ x, y, screenX, screenY }]
  },
  ui: {
    colorControls: [{ index, selected, screenX, screenY, screenW, screenH }],
    imageControls: [{ index, selected, screenX, screenY, screenW, screenH }],
    clearControl: { screenX, screenY, screenW, screenH },
    confirmControl: { screenX, screenY, screenW, screenH },
    cancelControl: { screenX, screenY, screenW, screenH }
  }
}
```

Field requirements:

- `phase` and `activePanel` must reflect the confirmation panel or edit state.
- When `overlayBlocking` is true, the main canvas should not receive coloring input.
- When `canInteractWithPlayfield` is true, a real click/touch on the canvas should trigger valid coloring.
- At least one of `filledCount` or `coloredPixelRatio` must express coloring progress; it increases after a valid fill and returns to the uncolored state after a confirmed clear.
- `samplePoints.fillable` provides at least one fillable point within the current canvas; `samplePoints.boundary` provides at least one outline or non-fillable point. If these are not provided, real-input checks may discover semantic points by scanning the canvas at runtime.

### `input(action)`

Actions must be high-level player actions and must not directly add score, directly set win/loss, or write private state.

| Action | Schema | Expected result |
|---|---|---|
| Select color | `{ type: "selectColor", index }` | A valid index changes the current color; an invalid index returns `ok:false` or leaves the state unchanged |
| Color | `{ type: "fill", x, y }` or `{ type: "fillAtSample", sampleIndex }` | A valid fillable point changes the canvas and progress; a boundary/out-of-canvas/same-color point does not change progress |
| Switch image | `{ type: "selectImage", index }` | A valid index switches line art and resets coloring progress for the current image; an invalid index leaves the state unchanged |
| Previous/next image | `{ type: "switchImage", direction: "prev" | "next" }` | Cyclically changes `imageIndex` in the specified direction |
| Clear request | `{ type: "requestClear" }` | Enters `confirm-clear`; the work is not cleared immediately |
| Confirm clear | `{ type: "confirmClear" }` | Restores the current line art to an uncolored state and returns to `playing` |
| Cancel clear | `{ type: "cancelClear" }` | Returns to `playing` and leaves the work unchanged |
| Key press | `{ type: "key", key }` | Number keys, left/right arrow keys, and the clear shortcut take effect according to the Game Spec; an invalid key leaves the state unchanged |

The return value of every action is recommended to be `{ ok, reason?, snapshot }` or directly return `Snapshot`. `ok:true` cannot be the only postcondition; the real UI, canvas, and summary must also stay synchronized.

### `loadScenario(name)`

Only valid precondition states may be constructed:

| Scenario | Setup result | Forbidden shortcut |
|---|---|---|
| `blank` | Default uncolored line art, interactive | Must not be pre-colored |
| `one_region_colored` | One colored region obtained through valid coloring | Must not bypass the canvas state and change only the count |
| `confirm_after_colored` | A colored region exists and the clear confirmation panel is open | Must not already be cleared |
| `edit_mode` | Configuration state in which canvas clicks do not color | Must not hide the tool area and make it impossible to exit |

## DOM / HUD / Canvas Postconditions

- The main canvas or equivalent drawing surface must be visible, non-empty, and reasonably sized.
- After a valid fill, at least one of the drawing surface's pixel summary, HUD progress, or `Snapshot` progress must change in a semantically appropriate way.
- The color selection controls must be able to change the current color through a real click.
- The line-art switching controls must be able to change the current line art through a real click, and the public summary or discoverable controls should represent at least 8 selectable line-art images; the keyboard left and right arrows must also change images according to previous/next semantics.
- When the clear confirmation panel is open, it must block coloring on the main canvas; after cancellation closes it, the work remains, and after confirmation closes it, the work is cleared.

## Behavior Trajectory Contract

| Trajectory | Coverage M | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Launch ready to create | M1/M8 | Open the game or `reset()` | None | The canvas is non-empty, palette count >= 8, line-art count >= 8, `phase=playing` | No blocking panel |
| Real-click coloring | M2/M3/M8 | `reset()` | Real-click the second palette color, then real-click a fillable point | The current color changes, canvas pixels/progress change, and the fill uses the current color | The line-art index remains unchanged |
| Touch coloring | M3/M8 | `reset()` | Use a real touch tap on a fillable point | Progress increases or the canvas changes | Semantics match a mouse click |
| Invalid coloring rejection | M4 | `reset()` | Click a boundary point or submit an out-of-canvas fill action | Progress, color, and line art remain unchanged | `totalBefore` and `totalAfter` are equivalent |
| Switch line art | M5/M7 | After coloring | Click another line-art image or press an arrow key | `imageIndex` changes, the canvas summary changes, and coloring progress resets | The palette count and current color remain valid |
| Cancel clear | M6 | `one_region_colored` | Click clear, then click cancel | The panel closes, and coloring progress and the canvas are retained | Canceling does not clear |
| Confirm clear | M6 | `one_region_colored` | Click clear, then click confirm | The panel closes and progress returns to uncolored | The current line art and palette remain operable |
| Keyboard shortcuts | M2/M5/M6/M7 | `reset()` | Number key, left/right arrow key, clear shortcut, invalid key | Valid keys change the corresponding state; an invalid key retains the state | Must not clear directly |
| Edit mode | M9 | `loadScenario("edit_mode")` | Click the canvas | Does not produce coloring progress | The tool area remains visible |

## Feature-Interface Mapping

| Feature | Public action / observation |
|---|---|
| M1 Launch canvas | `getSnapshot().canvas` + visible drawing surface |
| M2 Palette selection | Real click on a color control; `input({type:"selectColor"})` |
| M3 Primary coloring | Real mouse/touch click; `input({type:"fill"})` |
| M4 Rejection paths | Boundary click, out-of-canvas action, invalid index |
| M5 Line-art switching | Real click on a line-art control; `input({type:"selectImage"})`; left/right arrow keys |
| M6 Clear confirmation | Real click on clear/cancel/confirm; corresponding clear actions |
| M7 Keyboard | Real key press; `input({type:"key"})` |
| M8 Synchronized feedback | `filledCount` / `coloredPixelRatio` / canvas pixel summary / HUD |
| M9 Edit mode | `loadScenario("edit_mode")` |

## Invalid Input and Rejection

- When the index for `selectColor` is less than 0, exceeds the palette count, or is not an integer, it must be rejected or leave the state unchanged.
- When the index for `selectImage` is less than 0, exceeds the line-art count, or is not an integer, it must be rejected or leave the state unchanged.
- Out-of-canvas coordinates, boundary points, and unknown action types must be rejected or leave the state unchanged without throwing an uncaught exception.
- `confirmClear` must not damage the work when the confirmation state has not been entered.
- `cancelClear` must not change the work when the confirmation state has not been entered.

## Prohibited Items

- No private variables, internal functions, fixed DOM structure, fixed coordinates, fixed copy, fixed color values, or specific fill algorithm are required.
- The public interface must not directly set the fill count, clear directly without updating the canvas, or return only `{ ok:true }`.
- `loadScenario` must not directly provide the final result that a trajectory is intended to verify.
