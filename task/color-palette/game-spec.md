# Color Palette Game Spec

## Requirements Overview

This is a lightweight digital coloring game. After selecting a color, the player clicks, touches, or uses an equivalent high-level action input on an enclosed region of the black-and-white line art, filling that region with the current color. The game provides multiple switchable line-art images, a color palette with a fixed number of colors, a clear confirmation flow, and keyboard shortcuts; there are no lives, enemies, time limits, scores, or win/loss conditions.

## Gameplay Coverage Principles

This Game Spec must cover the complete coloring experience that players can actually perceive and operate: canvas loading, line-art display, color selection, region filling, touch and mouse input, keyboard color selection and image switching, clear confirmation, clear cancellation, a new canvas after switching line art, readjustment after window size changes, and ensuring that clicks are not mistaken for coloring in creation mode. Features not listed here cannot be assumed to be required by default; if subsequently cut, they should be explicitly marked as P2 or within the cut scope.

## Gameplay Requirements

### P0 Basic Experience

- After the game launches, it must enter a creatable state directly, without requiring an additional start menu.
- The main area must display a high-contrast black-and-white line-art image containing multiple clear, enclosed, fillable regions.
- The canvas must adapt to the current screen and remain visible, non-empty, and clickable in desktop and mobile viewports; it should not be obscured by the bottom tool area.
- The lower or equivalent tool area must provide a color palette with at least 8 selectable colors. The currently selected color must have a visible selected state.
- The tool area must provide a browsable entry point for switching line art, with at least 8 line-art images of different themes available and a clearly visible selection state.
- The tool area must provide an entry point for clearing the current work and use a confirmation flow to prevent accidental clearing.

### P1 Core Coloring Loop

- When the player clicks or touches a white enclosed region in the line art, the entire region should be filled with the currently selected color.
- Coloring must respect the black outline boundaries: the color should not visibly spread across the lines into adjacent enclosed regions.
- Clicking a black outline, outside the canvas, a blank area of the tool area, or a region that is already the same color should not produce destructive changes.
- After switching colors, the next valid fill must use the new color while preserving other regions that have already been filled.
- Mouse clicks and touch taps should have equivalent semantics: the enclosed region containing the trigger point is filled with the current color.
- The visible result on the canvas should remain synchronized with the tool-area state, such as the current color, current line art, number of filled regions, or an equivalent creation progress summary.

### P1 Line-Art Switching and Reset

- After the player selects another line-art image, the main canvas should switch to the new black-and-white line art and clear the visible coloring result from the previous image.
- The selection state of the current line art must be visible, and the canvas must remain colorable after switching.
- After clicking the clear entry point, a blocking confirmation panel or equivalent confirmation state should appear; existing colors must not be erased before confirmation.
- After selecting cancel in the confirmation panel, the panel closes and the canvas retains the coloring result from before the clear request.
- After selecting confirm in the confirmation panel, the current line art returns to an uncolored state without disrupting the color palette or current line-art selection.

### P1 Keyboard and Quick Actions

- Number keys should quickly select the correspondingly numbered colors; the valid numeric range must match the number of colors in the palette.
- The left and right arrow keys should cycle among the available line-art images, with screen semantics as follows: the left key switches to the previous image and the right key switches to the next image.
- The clear shortcut should open the same clear confirmation flow instead of erasing directly.
- Invalid keys should not change the color, line art, canvas content, or confirmation state.

### P2 Depth and Polish

- Supporting more line-art images with different themes is recommended; thumbnails should be horizontally browsable or otherwise allow the player to select them directly.
- It is recommended that the main canvas retain roughly 70% of the space across different screen sizes, with a compact tool area, though the exact proportion may be adjusted according to the design.
- Supporting an edit/creation configuration mode is recommended: in this mode, an explanatory overlay or configuration panel is displayed, canvas clicks do not trigger coloring, and updates to color and background configuration are visible.
- It is recommended that the line-art size be readjusted after window size changes, but retaining every filled region from before the redraw is not required.
- Saving, sharing, undoing, downloading the work, and similar features are optional; if implemented, they must not disrupt the core coloring, switching, and clearing flows.

## State Requirements

- `ready/playing`: the default state, in which the canvas can be colored and the tool area can be operated.
- `confirm-clear`: the clear confirmation state, in which the confirmation panel blocks canvas coloring and line-art switching; returns to `playing` after cancellation or confirmation.
- `edit`: an optional configuration state in which the canvas does not respond to coloring and appearance parameters such as the palette or background can be configured.
- The game has no `win`, `lose`, `game over`, lives, or timed-failure state.
- Restart semantics are equivalent to clearing the current line art; line-art switching semantics are equivalent to loading another uncolored line-art image.

## Resources, Progress, and Feedback

- The palette is the primary resource, but selecting a color does not consume resources.
- Progress may be expressed using `filledCount`, `coloredPixelRatio`, the number of filled regions, or an equivalent summary; no score is required.
- After each valid fill, the canvas should immediately display the color change, and a snapshot or HUD summary should also reflect the increase in coloring progress.
- After confirming clear, coloring progress returns to 0 or close to the uncolored state.
- After switching line art, the current image index and fillable-region summary should change.

## Cut Scope

- P2 may be cut: extra line-art images beyond the core catalog size, edit configuration mode, save/share/download, undo, animations, and sound effects.
- Must not be cut: a visible canvas at launch, a palette with at least 8 colors, at least 8 line-art images, real mouse/touch coloring, color switching, line-art switching, clear confirmation, and cancellation.

## Completion Criteria

- Without reading instructions, the player can select a color, click a line-art region, and see that region filled.
- The player can switch among at least 8 different line-art images and continue coloring each one.
- The player can clear the current work, and canceling a clear does not lose existing colors.
- Mouse, touch, and keyboard shortcut actions all follow the same set of state rules.
- The canvas, tool area, confirmation panel, and progress summary remain consistent after state changes.

---

## GDD / Design Doc (merged from design-doc.md)

# Color Palette Design Doc

## MDA

### Mechanics

- The player selects the current color through the color palette.
- The player clicks or touches an enclosed line-art region on the main canvas, triggering a fill of the entire region.
- The player switches works within a rich line-art catalog through thumbnails, buttons, or an equivalent selector.
- The player enters a confirmation state through the clear entry point, resets the current line art after confirming, and retains the work after canceling.
- The player can use number keys to select colors, the left and right arrow keys to cycle through line art, and the clear shortcut to open the confirmation flow.

### Dynamics

- The core loop is “select a color -> click an enclosed region -> see the entire region change color -> continue selecting colors or switch images.”
- Line-art boundaries create a light rule constraint: the player’s colors should stay within enclosed regions, and clicking boundaries or invalid regions does not damage the work.
- Clear confirmation enables low-risk exploration: the player can start over at any time without losing the work directly because of an accidental input.
- Multiple line-art images give the player an ongoing supply of new creative goals using the same set of actions, rather than merely moving back and forth among a small number of samples.

### Aesthetics

- The experience should be relaxing, bright, and low-pressure.
- Interaction feedback should be immediate and clear, suitable for children and casual players.
- The UI should feel more like a workbench than a level challenge: the palette, line-art selection, and clear control are always easy to find.

## GDD Feature List

### M1: Launch and Visible Creation Canvas

After launch, the game directly displays a non-empty black-and-white line-art canvas and an operable tool area. The canvas is large enough for the player to see the regions awaiting color.

### M2: Palette Selection

At least 8 colors are selectable. Clicking the palette or pressing a valid number key changes the current color and provides visible selection feedback.

### M3: Primary Coloring Action

After the player clicks or touches an enclosed white region, that region is filled with the current color, and the boundary lines prevent the color from visibly overflowing.

### M4: Invalid Coloring Rejection

Clicking a black outline, outside the canvas, a blank area of the tool area, submitting an invalid action, or clicking a region of the same color should not change work progress, the current color, or the current line art.

### M5: Line-Art Switching

The player can select among at least 8 line-art images with different themes. After switching, the canvas displays the new line art, and the visible coloring from the old line art does not continue to remain on the new line art.

### M6: Clear Confirmation Flow

The clear entry point first enters a confirmation state. Canceling keeps the work unchanged; only confirmation resets the coloring result of the current line art and returns to a creatable state.

### M7: Keyboard Shortcuts

Valid number keys select colors, the left and right arrow keys cycle to the previous or next line-art image according to screen semantics, the clear shortcut opens the confirmation flow, and invalid keys keep the state unchanged.

### M8: Observable Progress and UI Synchronization

After a valid fill, line-art switch, or confirmed clear, the canvas, current selection, confirmation state, and progress summary remain consistent.

### M9: Edit/Configuration Mode

P2. If a configuration mode is provided, canvas clicks do not color, and the interface visibly updates after configuring the palette or background.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Launch and visible creation canvas | P0 | Open the game | The main canvas is non-empty, the tool area is visible, and the game is in a creatable state by default | A blank canvas, unreadable canvas, or tool area that obscures the main area is a failure |
| M2 Palette selection | P1 | Click the palette or press a number key | The current color index and selection feedback change, and the next fill uses the new color | An invalid number key does not change the color; selecting a color does not change filled regions |
| M3 Primary coloring action | P1 | Mouse-click or touch an enclosed region | A region of the current color appears on the canvas and progress increases | Changing only the state without changing the canvas, no response to a click, or color overflow is a failure |
| M4 Invalid coloring rejection | P1 | Click a boundary/outside the canvas/a same-color region, or submit an unknown action | The work, progress, line art, and color remain unchanged | An invalid action that increases progress or clears the work is a failure |
| M5 Line-art switching | P1 | Click another line-art entry point or press an arrow key | The current line art changes, the canvas graphic/summary changes, and coloring can continue | Too few line-art options, old coloring still displayed after switching, or inability to continue coloring is a failure |
| M6 Clear confirmation flow | P1 | Click clear -> cancel or confirm | Canceling retains the work; after confirmation, progress resets to zero and the panel closes | Immediate erasure upon clicking clear, lost work on cancel, or failure to clear on confirm is a failure |
| M7 Keyboard shortcuts | P2 | Number keys, left/right arrow keys, clear shortcut, invalid key | Valid keys trigger the corresponding state changes, and invalid keys retain the state | Reversed directional cycling or an invalid key changing the work is a failure |
| M8 Observable progress and UI synchronization | P1 | Any valid fill, image switch, or clear | The snapshot/HUD/canvas summary changes in sync | A changed canvas with unchanged progress, or changed state with unchanged visible UI, is a failure |
| M9 Edit/configuration mode | P2 | Enter configuration mode and click the canvas or modify configuration | Clicking the canvas does not color; configuration changes are visible | Coloring still occurs in configuration mode or the configuration is not visible is a failure |

## State Flow

| State | Entry | Player actions | Exit | Invariants |
|---|---|---|---|---|
| `playing` | Default launch, cancel clear, after confirming clear | Select color, color, switch image, open clear confirmation | `confirm-clear` or `edit` | The canvas is interactive and the confirmation panel does not block it |
| `confirm-clear` | Click clear or use the clear shortcut | Confirm, cancel | `playing` | The panel blocks the main canvas; canceling does not change the work |
| `edit` | Optional configuration entry point | Configure colors/background | `playing` or remain in configuration | Clicking the canvas does not color |

## Risks and Acceptance Focus

- Coloring must not degrade into placing a small dot; it must appear as a change to the entire enclosed region.
- Real mouse and touch paths must work; state cannot be changed only through helper actions.
- The clear flow must have both confirmation and cancellation branches.
- Line-art switching must provide a visible and browsable selection entry point; it cannot offer only a hidden keyboard capability or a small number of placeholder samples.
- Canvas visuals and the public summary must stay synchronized, preventing updates to only the UI or only the canvas.
