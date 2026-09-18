# Cupid Tie-Dye Studio Game Spec

## Requirements Overview

This is a 2D canvas creation sandbox. At a visible clothing workbench, the player selects a blank garment, chooses dye colors and brush effects, and applies them directly within the garment area using a mouse or touch to create tie-dye-style designs. The core loop is: select clothing and tools -> draw on the canvas -> adjust with undo/redo or clear -> reveal the finished design -> save it to the gallery and earn resources -> use resources to unlock backgrounds or continue creating.

## Complete Gameplay Coverage Principles

The requirements must retain player-visible drawing, tool selection, clothing switching, menu panels, gallery, resources, shop, quests, achievements, settings, sound toggles, and persistent progress. Original visual themes, icons, typography, and copy are allowed, but functions that change the player's flow must not be omitted. If any in-depth feature is simplified, it must be labeled P2, and the core creation loop must remain playable.

## Gameplay Requirements

### P0 Basic Experience

- After launch, the game enters the creation workbench directly, with no additional level selection required.
- The main scene must have a readable 2D clothing canvas. The canvas must not be blank or a solid-color placeholder; its initial state displays a dyeable white garment or an equivalent clothing template.
- The screen must simultaneously provide color selection, brush/pattern selection access, undo, redo, clear, save/reveal, gallery, and menu access.
- Both mouse and touch must support drawing on the main canvas. Real dragging must continuously leave color marks along the pointer path; a single click must also leave localized dye at the clicked point. Mouse and touch are both required player input paths.

### P1 Core Creation Loop

- Color selection: the player selects the current color from 12 visible dye colors. After selection, the UI must show the current choice, and subsequent drawing uses that color or an effect related to that color.
- Brush size: provide at least small, medium, and large sizes, affecting the visible area of a single drawing mark. A large size should cover a larger area, while a small size should be more precise.
- Dye intensity: provide at least light, medium, and strong levels, affecting the opacity, saturation, or blending strength of dye marks. Switching intensity must not modify the design by itself; only subsequent drawing reflects the difference.
- Pattern tools: include 6 visible pattern effects covering spiral, heart, target rings, random bleeding, stripes, blending/softening, and similar types. Different patterns drawn at the same position should produce distinguishable visible shapes or textures.
- Stencil prints: provide 7 selectable print shapes. After one is selected, clicking the canvas should place a dyed imprint of the corresponding shape; switching back to the normal brush restores freehand drawing.
- Drawing restriction: colors should affect only the areas declared dyeable on the garment or work surface, and should not treat menus, buttons, or the background outside the workbench as the primary drawing target.
- Undo/redo: each completed drawing stroke enters the history. Undo reverts the most recent drawing stroke, and redo restores an undone stroke; when there is nothing to undo or redo, the corresponding action must be rejected and the state must remain unchanged.
- Clear: clearing returns the current design to the garment's initial state. If clear confirmation is enabled in settings, the player must confirm before clearing; canceling or clicking outside to close must leave the design unchanged.
- Clothing switching: left/right switching or an equivalent selection control can cycle among 20 garment/accessory templates. After switching, the canvas displays the new template and clears the old design, and the currently selected clothing name or thumbnail information must be visible.
- Reveal and save: after the player clicks the reveal/save entry, they see finished-design reveal feedback and then decide whether to save. Confirming save adds a thumbnail to the gallery, awards a visible amount of hearts, and resets the workbench; skipping save or closing the save decision does not increase the gallery or hearts, but clears the current design so the player can begin the next one.

### P1 Menus and Panels

- The menu entry opens a side or pop-up panel providing access to quests, achievements, the shop, settings, and help; while it is open, the main canvas must be blocked, and the main canvas becomes interactive again after it is closed.
- The gallery entry opens a design collection view. It displays an empty state when there are no designs and thumbnails after designs have been saved. Clicking a thumbnail can open a large view, and returning keeps the player in the gallery.
- The settings panel provides at least these toggleable options: drawing particle effects, character/decorative reactions, clear confirmation, save confirmation, and background music. A change must immediately apply to subsequent behavior and be saved to player progress.

### P1 Resources and Progress

- Saving a design awards a fixed number of heart resources, and the resource total is displayed in the shop or progress panel.
- The shop displays 8 background themes. The default background is unlocked; other backgrounds require spending hearts to purchase. When resources are sufficient, a purchase deducts the cost and unlocks the background; when resources are insufficient, the purchase is rejected, resources and unlock state remain unchanged, and visible feedback is provided.
- An unlocked but inactive background can be equipped. After it is equipped, the workbench background visibly changes and the state is saved.
- The quest system displays 5 objectives, progress bars, and rewards. Creation-related behavior, such as using multiple colors, using prints, saving multiple designs, trying multiple patterns, and designing different garments, should advance the corresponding quests. Rewards can be claimed after completion, and each claim occurs only once.
- The achievement system displays 10 achievement entries and a summary of the current unlocked state. The source version initializes achievements as unlocked during the demo/test flow, so the generated target must provide the achievement panel, count, and state display; if dynamic unlocking is implemented, it may be advanced by long-term behavior such as saving designs, trying tools, designing different garments, accumulating resources, and unlocking backgrounds, but dynamic unlocking is not a required P1/P2 loop.

### P2 Depth and Polish

- Celebration animations such as folding/unfolding or sparkles may play while revealing a finished design, but the animation must not block the final save/skip choice.
- Particles and cute character reactions may appear while drawing; after the corresponding settings are turned off, this feedback no longer appears.
- Background music may loop and can be started or stopped through the settings toggle; the volume may use a default value.
- The gallery capacity limit is 5 designs; when the limit is exceeded, keep the most recent designs.
- Player progress should be saved locally, including the gallery, hearts, unlocked backgrounds, current background, settings, quests, and achievements.

## State Requirements

- `playing`: the default creation state; the canvas can be drawn on, and tools and colors can be switched.
- `menu`: the main menu is open, and the main canvas is covered or disabled; closing it returns to `playing`.
- `panel`: the gallery, shop, settings, quests, achievements, help, confirmation dialog, or reveal/save flow is open; the current panel should be explicit, and closing or completing it returns to an appropriate state.
- `revealing`: the finished-design reveal animation is in progress, and drawing input is temporarily unavailable; when it ends, the save decision begins.
- `blocked`: while a confirmation dialog awaits the player's choice, game input other than confirm/cancel must not modify the design.

## Completion Criteria

- Without reading instructions, the player can complete one design: select a color, drag to draw, undo or continue drawing, reveal and save, and see the design in the gallery.
- Resources and progress form a complete loop: saving awards hearts, the shop can sell backgrounds, insufficient resources cause rejection, quests can express progress and provide claimable rewards, and the achievement panel can display summaries for 10 states.
- Every overlay has a way to close it and does not continue covering the canvas after being closed.
- The canvas, HUD, and panels remain consistent: the design, resources, gallery count, current tool, and current clothing that the player sees match the actual game state.

---

## GDD / Design Doc (merged from design-doc.md)

# Cupid Tie-Dye Studio Design Doc

## MDA

**Mechanics**: 2D clothing canvas, 12 dye colors, brush sizes, dye intensity, 6 pattern tools, 7 stencil prints, mouse/touch drag drawing, undo/redo, clear confirmation, switching among 20 garments, finished-design reveal, saving to the gallery, heart resources, a shop with 8 backgrounds, quests, achievements, settings, audio toggles, and local progress.

**Dynamics**: the player continually experiments with combinations of colors and tools, observes immediate changes on the canvas, makes corrections with undo/redo, saves favored results, and then uses the earned hearts to unlock backgrounds. The menu system provides long-term goals without interrupting core creation.

**Aesthetics**: relaxing, sweet, handcrafted, and collectible. Feedback should be explicit: selected states, drawing marks, design thumbnails, resource changes, quest progress, shop rejection, save celebrations, and the closing of overlays must all be visible.

## GDD Feature List

### M1 Launch and Main Workbench
P0. After launch, enter the creation state and display a non-blank 2D clothing canvas, color and tool controls, and save/gallery/menu entries.

### M2 Color Selection and Real Drawing
P1. After the player clicks a color in the 12-color palette and then clicks/drags on the canvas with a mouse or touch, visible dye marks appear in the garment area; when no color is selected, drawing with a non-blending tool must be rejected and the design must remain unchanged.

### M3 Brush Size, Dye Intensity, Pattern Tools, and Stencil Prints
P1. Size affects the mark area; dye intensity affects opacity, saturation, or blending strength; 6 pattern tools produce different textures; 7 stencil prints place recognizable shapes at the clicked position.

### M4 Undo, Redo, and Clear
P1. Each completed drawing action creates a history step; undo reverts and redo restores; clear may require confirmation, and canceling leaves the design unchanged.

### M5 Clothing Switching
P1. The player uses left/right switching or equivalent controls to cycle among 20 garments/accessories. The canvas and clothing label update together, and switching clears the current design.

### M6 Finished-Design Reveal, Save, and Gallery
P1. The reveal flow provides celebration feedback. Saving adds a thumbnail to the gallery, awards a visible amount of hearts, and resets the workbench; skipping save clears the design without increasing the gallery or hearts; the gallery can show an empty state, thumbnails, and large images.

### M7 Menus, Panels, and Blocking
P1. The menu and child panels block the main canvas while open, and closing them restores drawing. Panels include quests, achievements, the shop, settings, and help.

### M8 Heart Resources and Background Shop
P1. Saving earns resources; the shop displays 8 backgrounds; purchasing a background deducts resources and unlocks it; insufficient resources cause rejection without changing resources/unlock state; unlocked backgrounds can be equipped and change the workbench background.

### M9 Quests and Achievements
P2. Creation behavior advances quests; rewards can be claimed after quest completion and only once. The achievement system provides 10 entries and a summary of the current unlocked state. The source demo flow initializes achievements as unlocked, so dynamic achievement unlocking may be implemented but is not a required loop.

### M10 Settings, Particles, Character Reactions, and Audio
P2. Settings can toggle particles, character reactions, confirmation dialogs, and music; settings affect subsequent feedback and are saved.

### M11 Local Progress and Capacity
P2. The gallery, resources, backgrounds, settings, quests, and achievements are saved locally; when the gallery exceeds 5 designs, keep the most recent designs.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Launch and Main Workbench | P0 | Open the game | Non-blank clothing canvas, selectable colors, tools, and menu entry | A blank canvas, white screen, or no interactive area is a failure |
| M2 Color Selection and Real Drawing | P1 | Click a color, then perform a real mouse or touch click/drag on the canvas | The design visibly changes with dye, and the current color remains visible | Normal drawing without a selected color does not change the design |
| M3 Tools, Intensity, and Prints | P1 | Switch size, intensity, tool, or print, then draw in the same area | Design revision increases, the tool summary changes, and mark area, intensity, or type differs | An unknown tool/intensity is rejected without corrupting the current tool |
| M4 History and Clear | P1 | Undo/redo/cancel clear after drawing | The design appearance reverts/is restored; canceling clear leaves it unchanged | Undo/redo with no history does not change the design |
| M5 Clothing Switching | P1 | Click left/right switch or select clothing | The current clothing changes, and the canvas resets to the new template | The clothing count remains constant, and an out-of-range selection is rejected |
| M6 Save and Gallery | P1 | Reveal and confirm save, then open the gallery | Gallery count increases, hearts increase by 2, and a thumbnail is visible | Skipping save does not increase the gallery or hearts, and the design enters a new blank state |
| M7 Menus and Blocking | P1 | Open a menu/panel, then close the panel | The current panel and blocking state visibly change, and canvas interactivity is restored | Drawing is blocked while a panel is open; after closing it is no longer blocked |
| M8 Shop Economy | P1 | Earn hearts by saving, then purchase/equip a background | Resources are deducted, the unlocked set changes, and the background changes | With insufficient resources, the resources and unlocked set remain unchanged |
| M9 Quests and Achievements | P2 | Use colors/tools, save, switch clothing, claim quests, and open the achievement panel | Quest progress bars advance, completed quests can be claimed, rewards arrive; the achievement panel displays 10 entries and an unlocked summary | Claimed quests cannot award rewards again; displaying achievements must not award resources |
| M10 Settings and Feedback | P2 | Toggle particle/character/confirmation/music settings | Subsequent drawing, clearing, saving, or music state follows the settings | Toggles must not change the design, resources, or gallery |
| M11 Persistence and Capacity | P2 | Read progress after saving, reloading, or reset | Persistent fields are restored, and the gallery does not exceed 5 designs | After exceeding the limit, the total does not exceed capacity, and the newest designs remain |

## Interaction and Observability Constraints

- The main canvas must have clear dimensions, a drawable area, and visible design-change feedback.
- Real mouse/touch input must act on the same design the player is viewing, instead of only changing interface styling.
- The menu, gallery, shop, settings, quests, achievements, confirmation dialogs, and reveal flow must all have a way to close them.
- Resources, gallery count, current clothing, current color, current tool, current panel, and blocking state must be visible to the player and remain consistent.
