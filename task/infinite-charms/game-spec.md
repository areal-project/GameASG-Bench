# Infinite Charms Game Spec

## Requirements Overview

This game is a Halloween-themed character dress-up creation tool. The player's goal is not to win points, but to create a satisfying character appearance by continuously selecting, coloring, moving, scaling, and resetting parts. On the initial screen, the game must provide a visible character preview, an operable category panel, and appearance choices with immediate feedback.

## Scope Coverage Principles

The requirements must preserve behaviors already represented as player-visible experiences: character preview, category switching, part selection, color selection, opacity/intensity adjustment, fine adjustment of part position and size, canvas dragging and scaling, random generation, clear and reset, basic settings, loading state, and sound effect/music toggles or volume configuration. If an item is excluded from the base scope as an enhancement, it must be marked as P2 cut scope and cannot be assumed not to exist by default.

## Gameplay Requirements

### P0 Basic Experience

- After the game starts, it first displays loading feedback, then enters the creation interface once the resources are ready.
- The creation interface is divided into a character preview area and a control panel. The preview area must display a character composed of multiple layers of appearance parts; it cannot be blank or merely a placeholder image.
- The control panel must allow categories to be browsed and display the available options under the current category. After the player clicks a category, the panel title, option list, and selection state should update in sync.
- Each available option must have a clickable/touchable preview cell. After selection, the character preview must visibly change, and the currently selected item must be identifiable.

### P1 Core Dress-up Loop

- Categories include at least: base body/character type, skin tone, hairstyle, eyes, mouth, nose, and accessories; P2 enhancement categories include blush, eyebrows, and facial marks.
- The hairstyle and eyes categories must include two sub-modes: “style” and “color.” Style mode changes the shape of the part; color mode provides a multicolor palette and allows a return to the original color.
- After selecting a hair color or eye color, color intensity adjustment should appear. While dragging the intensity control, the character preview should update continuously: low intensity is closer to the original image, while high intensity shows the selected color more clearly.
- Accessories are stackable selections. Clicking an unselected accessory adds it to the character; clicking the same accessory again removes it; selecting the “no accessories” semantic clears all accessories and their independent position/scaling adjustments.
- Blush, eyebrows, and facial marks use single selection or empty selection. Selecting the “none” semantic hides the current part in that category.
- Dress-up actions do not produce scores, lives, or a countdown. Progress is reflected in the current character configuration and visual changes.

### P1 Position, Direction, and Scaling Semantics

- Adjustable parts include hair, eyes, mouth, nose, accessories, and the P2 blush, eyebrows, and facial marks.
- After opening the fine-adjustment panel, the current adjustable category should display horizontal position, vertical position, size, and reset controls. Non-adjustable categories such as base body and skin tone should show that no items can be adjusted or keep the fine-adjustment controls unavailable.
- Horizontal direction semantics must match screen space: when dragging to the right or clicking the move-right control, the target part moves toward the right side of the screen in the preview; when dragging to the left or clicking the move-left control, it moves toward the left side of the screen.
- Vertical direction semantics must match screen space: when dragging downward or clicking the move-down control, the target part moves toward the bottom of the screen in the preview; when dragging upward or clicking the move-up control, it moves toward the top of the screen.
- The mouse wheel, two-finger touch scaling, or size controls should change the size of parts matching the current category. After scaling up, the part should be larger; after scaling down, it should be smaller, and it must be protected by minimum/maximum limits.
- Only adjustable parts matching the current category can be dragged or scaled. For example, when the eyes category is selected, dragging the hair area cannot move the hair; the hair can be dragged only after switching to the hair category.

### P1 Quick Creation and Reset

- The random generation button should change multiple parts at once, including base type, skin tone, hairstyle, color, eyes, mouth, nose, and optional decorative parts. After randomization, the character preview and current configuration summary must change.
- The clear button should return the character to the basic default appearance: no accessories, no optional decorative parts, position and size returned to the default range, and colors returned to the original or base state.
- Neither randomization nor clearing can break interface interactivity; afterward, category selection, coloring, dragging, and scaling must remain available.

### P1 Settings and State

- The settings entry point should open/close a settings area that does not permanently obscure the preview and control panel.
- The settings area provides at least a sound effects toggle and music volume configuration. After sound effects are disabled, dress-up operations should not trigger audible feedback; volume adjustment should affect background music volume or an equivalent music state summary.
- The game has no traditional pause, victory, defeat, or level-completion state. The main states are loading, editing, settings-open. No button or contract action can push the game into an unrecoverable terminal state.

### P2 Depth and Cut Scope

- P2: Retain richer quantities of hairstyles, eyes, mouths, noses, skin tones, accessories, and decorative categories; the quantities do not need to match any single version exactly, but should be clearly greater than a minimal example.
- P2: Support switching categories with the keyboard left/right arrow keys and quickly jumping to the first few categories with number keys.
- P2: Support touch dragging, two-finger touch scaling, and mouse-wheel scaling.
- P2: Support local persistence or session-level saving so that the player's latest character configuration can be restored after a refresh; if excluded, it must be explicitly marked as cut.
- P2: Support background music, click sound effects, replacement sound effects, and playback on the first interaction when autoplay is restricted.

## State Requirements

- loading: Displays loading feedback and does not allow the player to mistakenly believe editing is already available; automatically enters editing after loading completes.
- editing: The default main state; the character preview is visible, the category panel is usable, and all dress-up operations take effect immediately.
- settings-open: An overlay substate of the editing state; the settings panel is open but should not prevent continuing to view the character or closing the panel.
- reset/randomized: Not an independent terminal state, but merely a configuration change within the editing state. After execution, the state remains editing.

## Completion Criteria

- Without instructions, the player can complete the loop of “select category -> select part -> see the character change -> color/fine-adjust -> randomize or clear -> continue editing.”
- The primary input paths support mouse and touch; direction-sensitive dragging and movement controls must be consistent with screen directions.
- The character preview must be able to express multi-layer dress-up results, and the HUD/panel/public summary must be able to express the current category, currently selected item, adjustable part position and scaling, color intensity, accessory count, and settings state.
- Invalid inputs must be rejected or leave the state unchanged, such as an unknown category, unknown part, incorrect action type, dragging a non-adjustable category, or out-of-range scaling or opacity values.

---

## GDD / Design Doc (merged from design-doc.md)

# Infinite Charms Design Doc

## MDA Overview

**Mechanics**: Category-based character dress-up, part selection, color and intensity adjustment, accessory stacking/removal, draggable positioning of adjustable parts, scaling, random generation, clear and reset, and settings toggles.

**Dynamics**: The player forms a creation loop through rapid trial and error. Every click or drag immediately changes the preview, encouraging the player to continue comparing different parts and adjusting their positions and colors until a satisfying appearance is formed.

**Aesthetics**: Cute, Halloween-themed, and with a relaxed workshop feel. Visual feedback must be clear, controls must be suitable for repeated clicking and touching, and the preview must always be the main visual focus.

## GDD Features

### M1: Startup and Visible Creation Interface

After entering the game, it transitions from the loading state to the editing state and displays a non-empty character preview and an operable control panel. The preview area and panel cannot overlap each other to the point of being unusable.

### M2: Category Switching and Option Browsing

The player switches among categories such as body type, skin tone, hairstyle, eyes, mouth, nose, and accessories through category tabs or equivalent controls. After switching, the current category, option list, and selection state update in sync.

### M3: Part Selection and Immediate Preview

Clicking/touching an available option changes the corresponding appearance slot and immediately refreshes the character preview. Single-selection categories replace the old part; empty-selection categories can clear the current part.

### M4: Color and Intensity Adjustment

Hairstyle and eyes provide style/color sub-modes. After selecting a color, the player can adjust the color intensity, and both the preview and summary reflect changes in color and intensity.

### M5: Accessory Stacking, Removal, and Clearing

Multiple accessories can exist at the same time. Selecting the same accessory again removes it; selecting no accessories clears all accessories and removes accessory-specific position/scaling records.

### M6: Drag Positioning Consistent with Screen Directions

Adjustable parts matching the current category can be dragged with real mouse/touch input. Dragging right moves the part's screen position right, and dragging left moves it left; dragging down moves it down, and dragging up moves it up. Dragging for a non-matching category should be rejected.

### M7: Size Adjustment and Range Protection

Adjustable parts can be resized through settings controls, the mouse wheel, or touch scaling. Scaling should be limited to a reasonable range and cannot make a part invisible, negative, or infinitely large.

### M8: Fine-adjustment Settings Panel

The settings entry point can expand/collapse the fine-adjustment panel. For adjustable categories, it displays horizontal, vertical, size, and reset controls; for non-adjustable categories, it displays no adjustable item or a disabled state. After the panel opens, it can still be closed to return to normal editing.

### M9: Random Generation

The random button changes multiple appearance dimensions at once while keeping the character visible and editable. Randomization is not a terminal state and produces no score or victory/defeat.

### M10: Clear and Reset

The clear button restores the basic appearance, removes accessories and decorative parts, and resets position and scaling. After clearing, the game remains in the editing state.

### M11: Settings and Audio State

The settings system provides sound effect toggle and music volume semantics. After sound effects are disabled, dress-up actions should not generate sound effect requests; volume changes should be reflected in the state summary or observable audio settings.

### M12: Keyboard and Touch Enhancements

P2 supports switching categories with keyboard left/right arrow keys or number keys, touch dragging, and two-finger scaling. Without these enhancements, the core mouse/click path must still be complete.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Startup and visible creation interface | P0 | Open the page and wait for loading to complete | phase is editing, the character preview is non-empty, and controls are interactive | Blank preview, permanent loading, or inoperable controls fail |
| M2 Category switching and option browsing | P1 | Click a category tab or press a key to switch | The current category changes, the option list changes, and the selection state remains readable | Unknown categories are rejected; switching cannot lose the current configuration |
| M3 Part selection and immediate preview | P1 | Click different options in the current category | The corresponding slot changes, and preview pixels/summary change | Clicking an invalid item should not change other slots |
| M4 Color and intensity adjustment | P1 | Enter the color sub-mode, select a color, and drag the intensity | The color summary and preview change, and intensity is within the 0..1 range | Out-of-range intensity is clamped or rejected |
| M5 Accessory stacking, removal, and clearing | P1 | Select an accessory, select the same accessory again, or select no accessories | The accessory count increases or decreases; after clearing, the count is 0 | The total accessory count cannot grow indefinitely from repeatedly adding the same item |
| M6 Drag positioning consistent with screen directions | P1 | Perform a real drag on the current adjustable category | screenX/screenY change according to the drag direction, and the preview changes | A non-matching category or dragging outside the canvas leaves the state unchanged |
| M7 Size adjustment and range protection | P1 | Click a size control, use the wheel, or pinch | scale increases or decreases and remains within a valid range, and the preview changes | scale must not be negative, 0, NaN, or out of range |
| M8 Fine-adjustment settings panel | P1 | Click the settings entry point and use position/size/reset | The panel opens/closes, and values and preview stay in sync | Opening the panel cannot permanently block the control panel |
| M9 Random generation | P1 | Click the random button | Multiple slots change, the preview changes, and phase remains editing | It cannot change only one unrelated field or enter a terminal state |
| M10 Clear and reset | P1 | Click the clear button | Accessories and decorations are cleared, position/size return to defaults, and the preview refreshes | Parts can still be selected after clearing |
| M11 Settings and audio state | P2 | Open settings and toggle sound effects or adjust volume | The audio settings summary changes | Invalid volume is rejected or clamped |
| M12 Keyboard and touch enhancements | P2 | Press arrow keys/number keys, touch-drag, or use two-finger scaling | The category or adjustable part changes according to the semantics | The keyboard should not break the mouse path; touch directions must be consistent |

## System Constraints

- There are no scores, lives, enemies, level victories/defeats, or level-completion rewards; do not add these loops as a substitute for dress-up creation.
- Character configuration is the primary progress. All core operations must affect the configuration summary, preview image, or both.
- Direction semantics are based on screen coordinates, not hidden world coordinates.
- Randomization, clearing, settings, and fine adjustment should all return to the same editing loop and cannot produce a state from which play cannot continue.
