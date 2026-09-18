# Neon Flow: Circuit Connect Game Requirements

## 1. Game Positioning and Objectives

Neon Flow: Circuit Connect is a neon circuit-themed grid connection puzzle game. The player's objective is to connect all nodes of the same color in each level, form a continuous light path between every pair of nodes, and effectively plan the entire grid into a non-overlapping network of lines.

The core enjoyment comes from "spatial planning + smooth line dragging + corrective reconnection." Players need to judge the route of each line, avoid blocking other colors, and gradually correct the layout by undoing, resetting, or erasing lines. When a level is completed, the screen should provide a clear completion overlay, progression choices, and celebratory feedback.

## 2. Core Gameplay Rules

1. Each level is a regular square grid containing multiple color-distinguished pairs of nodes.
2. The player must connect the two nodes of the same color; a complete line must start from one node of that color and end at the other node of the same color.
3. Lines may advance only through orthogonally adjacent cells and cannot skip cells, connect diagonally, or extend outside the grid.
4. Lines of different colors cannot occupy the same cell or cross each other.
5. A line cannot pass through a node of another color; a same-color line may use only the two endpoints of its own color as its start and end targets.
6. Only one valid line for a given color may be retained at a time. If the player starts again from a node of that color or clicks that color's existing line, the old line should be cleared so it can be replanned.
7. A level is complete when all colors form legal connections, the line network has no overlaps, and the entire usable grid has been planned into a complete circuit. If certain levels explicitly retain unusable or decorative empty spaces, this should be visibly stated in the level objective; otherwise, players cannot pass off an obviously unfinished solution with empty spaces as an answer.

## 3. Input Semantics and Interaction Feel

### 3.1 Dragging to Connect

The player presses with the mouse or touches and holds a colored node to begin laying a line. While holding, when the pointer or finger moves to an adjacent cell, the line should extend to that cell in real time, forming a glowing trail that grows in the direction of the input: drag right and the trail extends right; dragging left, up, or down should likewise advance to the adjacent cell in the same direction on the screen.

Continuous dragging must have a discrete grid feel: a new line segment is added only upon moving into an adjacent legal cell; remaining on the same cell should not cause repeated growth, and skipping across non-adjacent cells should not connect them directly. Players should receive consistent cell-path feedback whether dragging slowly or quickly.

### 3.2 Release and Completion

When the player releases the input, if the current line ends at the other node of the same color, the line is retained and visible or audio feedback for a successful connection is played; if the line is too short, stops on a normal cell, returns to the same endpoint, or does not reach the correct target, the temporary line should disappear and not be saved as complete.

After release, a saved line must continue to appear in its color on the grid, becoming an obstacle and visual reference for subsequent planning. If this connection completes all colors, the game enters the level-complete state.

### 3.3 Backtracking, Erasing, and Correcting

When the player drags backward to the previous cell while drawing a line, the most recent segment should be retracted instead of producing a crossing or occupying a cell twice. This backtracking should be reflected immediately in the light path's length, allowing players to fine-tune the route.

When the player clicks a completed line or one of its same-color nodes, that color's line should be erased, freeing space for reconnection. The benefit of erasing is clearing a blockage and redrawing the route; the cost is canceling that color's completion state and potentially moving the level from the verge of completion back to an incomplete state.

### 3.4 Rejection and Risk Coupling

Illegal input should be quietly rejected while preserving the current valid state: dragging to a non-adjacent cell, dragging outside the board, attempting to enter another color's line, or attempting to pass through a different-colored node should not add a line segment. The player's risk comes from path-planning mistakes: occupying a critical passage too early will block later colors, requiring erase, undo, or reset to recover.

## 4. Visible Feedback Chain

1. The main scene should display a dark sci-fi circuit background, a clear grid, glowing colored nodes, and glowing lines. The visual style may vary freely, but node colors, line ownership, and cell occupancy must be distinguishable at a glance.
2. A line currently being dragged should be shown with a more active glow or equivalent emphasis so that players can distinguish a temporary line from a saved line.
3. Successfully connecting a pair of nodes should provide immediate positive feedback, such as a short electronic sound, a line settling into a stable glow, a slight flash, or other visible confirmation.
4. Erasing or undoing a line should provide clear disconnection feedback, and line occupancy on the grid should immediately decrease.
5. When a level is completed, a completion overlay or equivalent result state should appear and offer choices to continue to the next level or replay the current one.
6. The top HUD or equivalent should display the current level number, grid size, or progress information; if counters are shown, they should remain consistent with real progress such as the current number of completed connections, move count, or score, rather than serving as static decoration.

## 5. State Flow and Menus

### 5.1 Launch and Level Selection

After launch, the game enters a loading or ready state and then displays level selection. The level list should present multiple selectable challenges and use visible states to distinguish unlocked levels from levels that are not yet unlocked. Selecting an unlocked level takes the player into the play scene; selecting a locked level should not enter that level.

### 5.2 During Play

The play scene contains the grid, nodes, current-level information, and controls for undo, reset, and returning to level selection. The player can repeatedly draw, erase, undo, and reset until completing the level or leaving voluntarily.

### 5.3 Completion, Continue, and Replay

After completing the current level, main-grid input should be blocked by the result overlay or placed into a state where drawing cannot continue, preventing the player from continuing to make changes behind the completion prompt. The player can replay the current level or proceed to the next level; if there is no next level, the game should return to level selection or display a state indicating that all challenges have been completed.

### 5.4 Return and Reset

Returning to level selection should hide the result overlay and play-blocking layer while preserving level unlock progress. Resetting the current level should clear all lines, close the completion overlay, and preserve the current level and node layout.

## 6. Progression and Level Structure

P1 requires at least one set of handcrafted levels progressing from introductory to highly difficult: early levels use smaller grids and fewer colors, while later levels expand to larger grids, more colors, and more congested passages. Level selection should provide at least six different playable layouts, and completing the previous level should unlock or guide the player to the next one.

P2 may add additional locked late-game challenges, more complex color combinations, more node pairs, higher-density layouts, and records for best move count or best time. If these enhancements are added, the basic connection rules and path-rejection behavior must remain consistent.

## 7. Victory, Failure, and Invariants

This game has no countdown failure or life-based failure. Failure primarily occurs when the player creates a layout from which completion is impossible and must actively erase, undo, or reset. Illegal dragging, accidentally clicking an empty cell, or clicking a locked level must never damage existing legal lines, skip a level, or directly trigger completion.

After a level is completed, the result state should remain stable: the continue button or next-level entry advances progress, while the replay button clears the current level's lines and returns to a playable state. Repeated clicks, background clicks, or irrelevant drags in the completed state should not cause duplicate rewards, abnormal duplicate unlocks, or a lingering blocking layer.

## 8. Scope Exclusions

P1 does not require online leaderboards, an account system, a level editor, random daily puzzles, item-based hints, ad revives, a store, skin collection, or cross-device saves.

P2 may add background music, a sound-effect toggle, reduced animations, persistent unlock progress, a hint system, and additional reward presentation; these enhancements cannot replace core drag-to-connect gameplay, legality rejection, level completion, and menu flow.

---

## GDD / Design Doc (merged from design-doc.md)

# Neon Flow: Circuit Connect Design Document

## 1. Design Goals

Neon Flow: Circuit Connect is a neon circuit-themed grid connection puzzle game. In each level grid, the player connects each pair of same-color nodes one-to-one, laying continuous, clear, non-overlapping energy lines and planning the entire usable grid into a complete circuit.

The design focuses on preserving three things: the pressure of spatial planning, the smooth feel of dragging lines across discrete grid cells, and a reconnection flow that allows correction at any time. The game has no lives, countdown, or combat failure; the challenge comes from blockages caused by path occupancy and from the closed loop of replanning after the player actively erases, undoes, or resets.

## 2. MDA Breakdown

### Mechanics

M1. Level grid and paired nodes: Each level consists of a regular square grid and multiple color-distinguished pairs of nodes. Level size, color count, and passage congestion increase with progression.

M2. Same-color connection rule: The player presses and holds a node of a given color and drags through orthogonally adjacent cells to lay a line; it forms a valid connection only when it ultimately reaches the other node of the same color.

M3. Legal path restrictions: Lines cannot move diagonally, skip cells, go out of bounds, pass through differently colored nodes, occupy another color's line, or overlap other lines. Only one valid line of each color may be retained at a time.

M4. Real-time drawing and backtracking: While the input is held, the line grows as the pointer or finger enters adjacent legal cells; dragging backward to the previous cell retracts the most recent segment, while remaining on the same cell or skipping over non-adjacent cells adds no line segment.

M5. Saving, failed-release cleanup, and erasing: If the line connects both same-color endpoints when released, it is saved as a stable line; if it does not reach the correct target, the temporary line disappears. Clicking a completed line or a node of the same color erases that color's line and cancels that connection state.

M6. Undo and reset: Undo restores the state from before the most recently saved line; reset clears all lines in the current level, closes the completion state, and preserves the current level layout.

M7. Completion and progression: After all colors form legal connections, the line network has no overlaps, and the current level's complete-circuit objective is satisfied, the game enters the level-complete state, displays result feedback, and unlocks or guides the player to the next level.

M8. Menu and level flow: After launch, the game proceeds from a loading or ready state to level selection; unlocked levels can be entered, while locked levels cannot. During play, the player can return to level selection; after completion, the player can replay or continue.

M9. Visible feedback and audiovisual atmosphere: The main scene presents a dark sci-fi circuit background, a clear grid, glowing nodes, and glowing lines. Temporary lines, saved lines, successful connections, erasing, and the completion state should all have distinguishable feedback.

M10. P2 depth enhancements: Additional highly difficult levels, more node pairs, higher-density layouts, best move counts or times, persistent progression, hints, and sound settings may enhance the experience, but cannot replace the core connection rules.

### Dynamics

The player enters a solvable puzzle from level selection, observes the distribution of colored nodes, and first tries to connect an obvious path. As lines are saved, occupied cells become obstacles for subsequent colors; upon discovering a blockage, the player frees space through drag backtracking, click-to-erase, undo, or reset, and then rearranges the lines. Every line is both progress and a new constraint. Upon completion, all lines form a stable, non-overlapping circuit network, the result overlay blocks further accidental input, and the game provides choices for the next step.

Dragging must create a clear tactile cause-and-effect chain: when the player drags toward the right side of the screen, the trail advances to the adjacent cell on the right; the same applies when dragging left, up, or down. Continuous input changes the line only when entering an adjacent legal cell, while an illegal direction or target preserves the current valid state. Release is a commitment action: a correct connection is saved and rewarded, while an incomplete connection discards the temporary line.

### Aesthetics

The target experience is the precision and satisfaction of "debugging a futuristic circuit." Players should be able to identify node ownership, line occupancy, and the current drawing state at a glance; receive a stable glow or equivalent positive feedback upon a successful connection; and clearly see the circuit disconnect when erasing or resetting. The overall pace should emphasize puzzling and planning rather than speed reactions or punishing failure.

## 3. Executable P1 Core Loop Trajectories

### Trajectory A: Enter a Level and Complete One Line

Start/reset: The player enters an unlocked level from level selection, or clicks reset in the current level, and sees a grid with no lines, paired colored nodes, current-level information, and available controls.

Player input: The player presses and holds a node of a given color and drags through orthogonally adjacent cells on the screen, laying a line toward the other node of the same color.

Continuous state changes: A temporary glowing trail begins growing from the starting point; each entry into an adjacent legal cell adds one segment to the path; dragging back to the previous cell shortens the path; going out of bounds, skipping cells, moving diagonally, touching a differently colored node, or touching another line does not extend the current path.

Objective/risk: The objective is to connect the other node of the same color; the risk is that the path occupies a critical passage or touches an illegal area along the way and cannot continue growing.

Reward/failure: If the line connects one endpoint of its color to the other when released, the line is saved as a stable light path and successful-connection feedback is given; if it stops on a normal cell, returns to the same endpoint, is too short, or does not reach the correct target, the temporary line disappears and does not count as complete.

Progress/restart: After a line is saved, the completed count for that color increases, and the saved line also becomes an obstacle for subsequent planning. The player continues connecting other colors; if the layout is wrong, the player can erase, undo, or reset.

### Trajectory B: Correct and Reconnect After a Planning Blockage

Start/reset: One or more saved lines already exist in the level, grid space is partially occupied, and subsequent colors cannot be connected successfully with the current layout.

Player input: The player clicks a saved line or one of its same-color nodes, or uses the undo or reset control.

Continuous state changes: Clicking a line or a same-color node removes that color's line; undo returns to the state from before the most recently saved line; reset clears all lines in the current level. The corresponding cells become free again.

Objective/risk: The objective is to free occupied passages and replan. The risk is that erasing cancels that color's completed state and may move a nearly completed position back to incomplete.

Reward/failure: After a successful erase or undo, the player gains new viable space; illegal clicks, accidentally clicking an empty cell, or clicking a locked level should not damage existing legal lines.

Progress/restart: The player drags from a node again and tries a better route; if the state becomes confusing, the player can reset the current level and restart with the same node layout.

### Trajectory C: Complete a Level and Advance

Start/reset: The player is in active play with several saved lines, and at least one pair of nodes is not yet legally connected.

Player input: The player completes the final required line and releases.

Continuous state changes: The final line is saved; the completion-state check verifies all color connections, the absence of line overlaps, and the complete-circuit objective.

Objective/risk: The objective is to close all colors legally while avoiding an incomplete, overlapping, or obviously half-finished solution with empty spaces. The risk is that an incorrect path leaves a color unconnected or the grid incompletely planned, requiring a return to correction.

Reward/failure: If the completion conditions are met, the game displays a completion overlay or equivalent result state, plays or presents celebratory feedback, and blocks further drawing on the main grid; if they are not met, the level remains playable.

Progress/restart: The player can enter the next level or return to level selection; the next level is unlocked or clearly presented as the next step. The player may also replay the current level, clearing its lines and restoring a playable state.

## 4. Mechanic Coverage Matrix

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Level grid and paired nodes | P1 | Enter an unlocked level from level selection | A regular grid, multiple paired colored nodes, and current-level information appear | Locked levels cannot be entered; node colors and cell occupancy must be distinguishable |
| M2 Same-color connection rule | P1 | Press and hold a colored node and drag to the other node of the same color | A continuous same-color light path is saved, and the completion count or progress changes in sync | Releasing on a differently colored endpoint, an empty-cell endpoint, or the same endpoint does not save |
| M3 Legal path restrictions | P1 | Drag diagonally, to a non-adjacent cell, out of bounds, into a differently colored node, or into an occupied line | The existing temporary path remains unchanged, with no illegal segment added | Saved legal lines are not damaged by illegal input; lines do not overlap |
| M4 Real-time drawing and backtracking | P1 | Continue dragging into an adjacent cell, or drag backward to the previous cell | The line grows or shrinks one cell at a time in the screen direction | Remaining on the same cell does not cause repeated growth; skipping multiple cells does not connect them directly |
| M5 Saving, failed-release cleanup, and erasing | P1 | Release the input; click a saved line or a same-color node | A correct connection is saved; an incorrect release clears the temporary line; erasing removes the corresponding color's line | Erasing affects only the target color; it cancels the completed state without damaging other lines |
| M6 Undo and reset | P1 | Click the undo or reset control | Undo restores the previous saved state; reset clears the current level's lines | The current level's node layout is preserved; the completion overlay closes; no level skipping, duplicate completion, or lingering blocking layer occurs |
| M7 Completion and progression | P1 | Complete the final legal line | The result state appears, main-grid drawing is blocked, and continue/replay options are available | Repeated irrelevant input after completion should not cause duplicate rewards, abnormal unlocks, or continued line editing |
| M8 Menu and level flow | P1 | Launch, select a level, return, continue to the next level, or replay | Loading/ready, level selection, play, and result states transition clearly | Returning hides the blocking layer; replay clears lines; locked levels reject entry |
| M9 Visible feedback and audiovisual atmosphere | P1 | Draw, connect, erase, or complete | Temporary and saved lines are distinguishable, and connecting/disconnecting/completing has clear feedback | Feedback must represent the true state and cannot serve as mere static decoration |
| M10 Additional depth and records | P2 | Complete late-game levels, view records, or use hints or settings | Higher-density layouts, records, or assistive systems strengthen long-term objectives | P2 systems must not bypass basic legal connection, completion evaluation, or menu flow |

## 5. State Design

Loading or ready: Game resources and the basic interface are being prepared, and players cannot accidentally enter a partially initialized level.

Level selection: Displays multiple challenges and distinguishes playable from locked levels. The player selects a playable level to begin; selecting a locked level does not change current progress.

Playing: The grid accepts drag input, the HUD displays the level, size, or real progress, and undo, reset, and return are available. Temporary lines exist only while the input is held, while saved lines become stable after a successful release.

Completion result: A completion overlay or equivalent result state appears and grid input is blocked. Continue enters the next level, replay clears the current level, and returning to level selection preserves unlock progress.

## 6. Level and Progression Pacing

P1 includes at least six different layouts, gradually transitioning from small grids, few colors, and spacious passages to larger grids, more colors, and more congested passages. Early levels teach adjacent-cell line dragging, saving, and erasing; middle levels emphasize avoiding blockages; later levels require the player to rearrange lines multiple times to fill the complete-circuit objective.

The unlock pacing should make completing one level lead naturally to the next. Any additional late-game challenges belong to P2 depth or bonus content, but must still follow the same set of core connection rules.

## 7. Explicit Exclusions

P1 does not include online leaderboards, accounts, a level editor, random daily puzzles, ad revives, a store, skin collection, cross-device saves, or combat failure. P2 may add music, a sound-effect toggle, reduced animations, persistent unlocks, hints, best records, and additional reward presentation, but these enhancements cannot replace drag-to-connect gameplay, illegal-input rejection, correction, completion, and menu progression.
