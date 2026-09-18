# Fashion Couple Puzzle Game Spec

## Requirements Overview

This is a 2D casual puzzle game. Players are presented with a series of fashion-couple-themed illustrations. After selecting or continuing an image, they drag pieces from the bottom tray to the target grid above. A piece snaps into place and counts toward progress only when placed in its corresponding position; a misplaced piece returns to the tray and provides gentle error feedback. After the entire image is completed, the game displays celebratory feedback and allows the player to proceed to the next image or return to the selection list.

## Gameplay Coverage Principles

P1 must preserve the complete player-visible puzzle loop: after loading, the player can enter a playable screen containing a target outline, tray pieces, and progress; the player can drag pieces with a mouse or touch; correct placement snaps into place, increases progress, and keeps the placed portion visible in the image; incorrect placement does not increase progress and returns the piece to the tray; after all pieces are completed, a celebration state and an entry point to the next level appear.

P2 preserves level selection, a substantial level count and increasing difficulty, sound effect/music toggles or volume, post-completion scatter transition animations, background sparkles, celebratory particles, and other depth and presentation layers. The source game provides more than 50 playable puzzles and gradually increases the piece count from 2-4 pieces to highly difficult levels with more than 100 pieces; if scope must be narrowed, P2 presentation may be simplified, but the long list and difficulty ladder must not be compressed into only a few levels.

## Gameplay Requirements

### P0 Launch and Screen

- After launch, the game should enter the main flow following a brief loading or preparation state; it should not show a blank screen or freeze.
- The main playable area is a 2D puzzle canvas or equivalent visible puzzle area capable of displaying the target area, piece tray, progress HUD, and completion feedback.
- The layout must adapt to desktop and mobile viewports, and the main puzzle area, tray, and HUD should not overlap one another.

### P1 Core Puzzle Loop

- Each level consists of a themed illustration divided into rectangular pieces, and the total number of pieces must equal the piece count shown to the player for that level.
- The target area above displays a faded complete image or a clear partitioned outline so the player knows where each piece should be placed.
- The tray below displays all unconnected pieces. The pieces' initial order should be shuffled and must not naturally be neatly arranged in completion order at their target positions.
- After the player presses or touches a tray piece, the piece should follow the pointer; visible selection/lift feedback should appear during dragging.
- When the piece is released, if its center is sufficiently close to the center of its own target cell, the piece snaps into that target cell, displays confirmation feedback, and increases progress by 1.
- When the piece is released, if it is not close to its own target cell, it must not connect, progress remains unchanged, and it returns to the tray or its original position while displaying gentle error feedback.
- A connected piece is locked in its target cell, can no longer be dragged back to the tray, and cannot score repeatedly.
- Progress is displayed as the number connected / total number of pieces and is updated after every correct connection.
- When the connected count reaches the total piece count, the current level enters the complete state, displays a celebratory prompt, particles, or equivalent positive feedback, and shows a continue entry point.

### P1 Input Semantics

- Mouse path: press or click to select a tray piece, move it to the target area, and release to complete placement.
- Touch path: touch start selects a tray piece, touch move drags it, and touch end completes placement.
- Drag direction must match screen-space semantics: when the pointer moves right, the dragged piece's screen x coordinate should increase; it should decrease when the pointer moves left; the same applies to upward/downward movement.
- The post-release check accepts only that piece's own target position. Dragging a piece to another cell, a blank area, or outside the tray should not be treated as success.

### P1 State and Flow

- After the `loading` or preparation state ends, enter `selection` or directly enter the first level; whichever entry is used, it must be possible to start the first level.
- The `selection` state displays multiple selectable puzzle cards. P1 must at least allow entry into the first level; P2 requires a nearly complete long list comparable to the source game, with summaries for at least 50 playable levels visible or observable through the contract.
- The `playing` state displays the current level, target area, tray, progress, and interactive pieces.
- The `complete` state displays celebratory feedback and a continue entry point; while complete, repeated connections must no longer be allowed to add progress to the completed level.
- The continue entry point should enter the next level; after the final level is completed, it may return to the selection list or loop back to the selection flow.
- A player path should be provided to restart the current level or return to the selection list. After restarting, the connected count is reset to zero, the pieces return to the tray, and the completion prompt closes.

### P2 Levels and Progression

- The level count should form a clear difficulty ladder: simple levels have approximately 2-4 pieces, medium levels approximately 6-30 pieces, and difficult levels should reach more than 100 pieces; the full-depth target may reach several hundred pieces.
- Level cards should display a theme preview and piece count; locked levels, if present, should be visible but inaccessible.
- The next-level transition may include completed pieces scattering, fading out, or sparkling animations, but the animation should not block the subsequent playable state for longer than a reasonable period.
- The current level, completed levels, or most recent progress may be recorded, but long-term saving is not required; if saving is provided, resetting/starting a new game must not corrupt completed-level state.

### P2 Feedback and Audio

- A correct connection should have snapping, sparkle, sound, or equivalent positive feedback.
- An incorrect placement should have a slight shake, bounce, short sound, or equivalent rejection feedback and must not interrupt the game with punitive failure.
- Completing the entire image should provide a celebratory prompt, particles, or equivalent high-intensity feedback and display a continue entry point.
- Music and sound effects may begin after the first user action due to browser policies; if volume settings are provided, changes to those settings should affect subsequent audio.

## Completion Criteria

- The player can enter a playable puzzle from the launch flow.
- Real mouse and touch dragging can both move pieces and trigger placement checks.
- Correct placement, incorrect placement, completion, continuing to the next level, and restarting or returning to selection form a closed loop.
- The canvas or puzzle area is not blank; the target area, tray pieces, progress, and completion feedback can all be observed by the player.
- All invalid placements and repeated input after completion must preserve state invariants and must not falsely increase progress.

---

## GDD / Design Doc (merged from design-doc.md)

# Fashion Couple Puzzle Design Doc

## MDA

**Mechanics**

- M1 Launch, loading, and playable entry: after preparation is complete, enter level selection or the first level, and the player can see the puzzle area.
- M2 Level selection and difficulty list: the source game has more than 50 themed puzzles, with piece counts gradually increasing from 2-4 pieces to more than 100 or even several hundred pieces, and cards provide entry to playable levels.
- M3 Puzzle area and tray layout: target outline/faded image above, unconnected piece tray below, and a HUD showing progress.
- M4 Real drag input: pieces can be dragged with mouse and touch, and their screen positions follow the pointer's direction.
- M5 Correct snapping: after a piece is released near its own target cell, it snaps into place, locks, and increases progress.
- M6 Incorrect rejection: after a piece is released in the wrong position, it bounces back or returns to the tray, while progress and the connected count remain unchanged.
- M7 Completion and continue: after all pieces are connected, enter the complete state and display celebratory feedback and an entry point to the next level.
- M8 Restart/return flow: the player can clear the current board, return to selection, or restart the current level.
- M9 Presentation feedback: correct, incorrect, completion, and transition actions have visible animations/particles/sounds.
- M10 Long-term progression and optional settings: increasing difficulty, optional volume/music, completed progress, or most recent level.

**Dynamics**

The player first enters a puzzle from the list or the default first level, observes the target outline and tray pieces, and drags one piece at a time to its target position. Each correct snap reduces the burden in the tray and increases progress, while an incorrect attempt gently bounces back, encouraging continued trial and error. After the entire image is completed, celebratory feedback and the next-level entry point propel the player toward challenges with higher piece counts.

**Aesthetics**

The overall experience is a relaxed, sparkling fashion-couple-themed puzzle with strong positive feedback. The visuals should be bright without obscuring the puzzle area; failure feedback is friendly, and completion feedback feels ceremonial. Difficult levels should give players a sense of accumulation through "piece-by-piece completion," rather than relying on automatic completion.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Launch, loading, and playable entry | P0 | Open the page and wait for preparation to complete | Enter selection or the first level; the main puzzle area is non-empty; no blocking overlay | Blank screen, permanently obstructing loading layer, or runtime error fails |
| M2 Level selection and difficulty list | P2 | Click a visible level card or use the entry point to start the first level | The current level changes, the total piece count matches the card difficulty, and the level catalog approaches the source game's long-list scale | Locked or disabled cards are inaccessible; the selection screen should not block playing; a shell with only a few levels does not satisfy depth |
| M3 Puzzle area and tray layout | P1 | Start a level | Target area, tray pieces, and progress HUD are visible; the total number of pieces equals the level total | Quantity conservation: connected + tray = total |
| M4 Real drag input | P1 | Hold and move a piece with mouse/touch | The piece follows the pointer; dragging right increases screen x, and dragging left decreases screen x | No input response or reversed direction fails |
| M5 Correct snapping | P1 | Drag a piece to its own target cell and release | The piece locks to the target cell, progress +1, the HUD updates, and the connected piece appears in the image | The same piece cannot score repeatedly; the state of other pieces is not damaged |
| M6 Incorrect rejection | P1 | Drag a piece to the wrong cell or a blank area and release | The piece returns to the tray/original position, progress is unchanged, and error feedback appears | An incorrect release cannot increase progress or connect to the wrong cell |
| M7 Completion and continue | P1 | Connect the final piece through a valid placement | The complete state, celebratory feedback, and a continue entry point appear | Completion must be triggered by the final valid placement; repeated input after completion does not change progress |
| M8 Restart/return flow | P2 | Click restart or return to selection | The current board is cleared or the list is displayed, the blocking layer closes, and interaction can continue | After restart, connected is 0 and the completion layer is closed |
| M9 Presentation feedback | P2 | Correct, incorrect, completion, next level | Connection sparkle/bounce/celebration/transition animation or equivalent visible change | Feedback cannot replace rules; rule state must stay synchronized |
| M10 Long-term progression and optional settings | P2 | Complete a level, enter the next level, adjust volume | Difficulty advances or settings take effect; optional saved state does not corrupt a new game | Resource/progress fields must not be negative or out of range |

## GDD Key Points

### M-feature List

### M1: Launch, Loading, and Playable Entry
After preparation is complete, enter level selection or the first level, and the player can see the puzzle area.

### M2: Level Selection and Difficulty List
More than 50 themed puzzles form a difficulty gradient by piece count, and cards provide entry to playable levels; simple, medium, and difficult levels should all be observable in the catalog.

### M3: Puzzle Area and Tray Layout
Target outline/faded image above, unconnected piece tray below, and a HUD showing progress.

### M4: Real Drag Input
Pieces can be dragged with mouse and touch, and their screen positions follow the pointer's direction.

### M5: Correct Snapping
After a piece is released near its own target cell, it snaps into place, locks, and increases progress.

### M6: Incorrect Rejection
After a piece is released in the wrong position, it bounces back or returns to the tray, while progress and the connected count remain unchanged.

### M7: Completion and Continue
After all pieces are connected, enter the complete state and display celebratory feedback and an entry point to the next level.

### M8: Restart/Return Flow
The player can clear the current board, return to selection, or restart the current level.

### M9: Presentation Feedback
Correct, incorrect, completion, and transition actions have visible animations/particles/sounds.

### M10: Long-Term Progression and Optional Settings
Increasing difficulty, optional volume/music, completed progress, or most recent level.

### Spatial Layout

The puzzle area should be divided into a target area and a tray area. The target area displays a faded preview of the complete image or clear grid lines, while the tray area displays unconnected pieces. The HUD should display current progress, level information, and necessary navigation without obstructing the primary drag paths.

### Piece Rules

Each piece has a public semantic target cell. On drag release, "whether it is near its own target cell" is used as the success condition. After success, the piece transitions to locked/connected and no longer participates in dragging; after failure, it remains unconnected and returns to the tray or the nearest valid unconnected position.

### State Machine

`loading -> selection -> playing -> complete -> playing(next) | selection` is the complete state flow. Direct entry from loading into first playing is allowed, but a selection or return path should still be provided. No state may be permanently blocked by a visible overlay.

### Scope Reduction

P2 may simplify the number of branded illustrations, audio details, and particle effects; P1 does not allow removing dragging, correct/incorrect placement, progress, completion, or continuing to the next level.
