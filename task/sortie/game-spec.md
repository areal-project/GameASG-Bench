# Sortie Complete Gameplay Requirements

## Game Positioning

Sortie is a relaxing item organization and shape-matching puzzle game. Players face a storage tray with multiple silhouette slots and a set of themed items scattered above or around the scene. By observing each item's appearance, the slot silhouettes, sizes, and positional relationships, they drag every item into the slot that truly corresponds to it.

The core objective is to put all items in a level into their proper places and advance through consecutive levels to new themed organization challenges. The game should emphasize a soothing, tidy, and correctable organizing experience: trial and error may occur, but mistakes should not cause items to become stuck or leave the player in an unrecoverable state.

## P1 Core Gameplay

After entering the game, the player first sees a brief start guide and enters the first level after confirming. The main interface should always display the current level, the correctly organized progress, and an interactive tray and items awaiting organization.

Each level contains a set of theme-consistent items and corresponding slots. P1 must provide at least 5 playable themed levels. The themes should present clearly distinct item categories and background atmospheres, such as medical supplies, tools, farm and garden supplies, school supplies, art supplies, and so on. The number of items in each level may vary slightly by theme, but it must be sufficient to form a complete observation, drag-and-drop, correction, and completion loop.

The player begins dragging an item that has not yet been correctly placed by holding it with a mouse or touch input. The held item should immediately receive visible feedback such as being brought to the front, enlarged, or given a shadow, and it should move continuously with the pointer. During dragging, the item should remain within the playable area and must not lose control because of rapid movement or touch input.

When the player releases an item, if the item's center is near any slot, it should snap near that slot and play brief elastic placement feedback. If that slot is the item's target slot, the item is considered correctly placed, locked within the slot, and progress increases, with sparkle, sound, score, and combo feedback. If the slot does not match, the item may also temporarily rest on the slot to create a trial-placement effect, but it does not count toward completion, cannot be locked, and must remain draggable again.

When an item is released outside all slots, it should remain in a visible and interactive position or return to a reasonable area for items awaiting organization, while remaining incomplete. The player can continue picking it up and trying other slots.

After all items are correctly placed, the game enters the level-complete state, displays a celebration panel, total score, longest combo, and completion time, and provides an entry point to proceed to the next level or play again. The completed state should prevent further accidental interaction with the old level until the player chooses the next step.

## Interaction Feel and Causal Chain

While continuously holding and dragging, the item's position should correspond directly to the pointer's displacement. When the player moves left, right, up, or down, the item should also move in the same screen direction. Dragging is not click-to-teleport or a delayed queue; the player needs to be able to guide the item by feel to near the center of a slot.

Releasing the input ends dragging and triggers drop-point evaluation. When released near a slot, the item snaps toward the slot center with a brief bounce; when released far from slots, it does not trigger a placement reward, and the item remains visible and draggable again. There is no inertia, braking, or continued sliding; the main behavior after release is immediate evaluation followed by stabilization.

The benefit of an incorrect trial placement is that it helps the player verify shape or positional relationships, while the cost is breaking the combo and requiring the item to be dragged away again. If an incorrect item overlaps a correct item or another incorrect item in the same slot, it should remain visible through clear layering or an offset. In particular, the incorrect item must remain on top and easy to pick up again; correct and incorrect items must not obscure one another to the point that play cannot continue.

The benefits of correct placement are progress, score, combo, and celebratory feedback; the cost is that the item becomes locked and no longer participates in trial and error as an ordinary draggable item. If the player needs to redo it, this must be done through an explicit action such as resetting the level, rather than accidentally dragging a completed item and destroying the result.

Risk and failure should primarily be coupled to recoverable rejection: an incorrect slot does not cause loss of life or level failure, but it breaks the combo. Locked levels, future levels, completed states, non-draggable items, and invalid drop points should all produce a clear result of "the current action is not accepted, but the game can continue."

## Visible Feedback

An item being picked up should be clearly distinguishable from stationary items, for example by being brought to the front, enlarged, given a shadow, slightly wobbled, or highlighted. Dragging sounds or gentle feedback can enhance the organizing feel, but cannot replace visible movement.

Empty slots should have sufficiently readable silhouettes or a recessed appearance to help players judge shape and size. A slot with a correctly placed item should become more settled, subdued, or complete so that the player knows it is finished. An incorrectly trial-placed item should remain conspicuous, indicating that it still needs attention.

Correct placement should produce brief snapping, sparkle, success sound, or particle feedback, while updating progress at the same time. Consecutive correct placements should display a combo or bonus prompt; an incorrect placement or removal from a correct result should break the combo and hide or reset the combo feedback.

After a long period without interaction, incomplete or incorrectly placed items may wobble slightly to remind the player that they can still be handled. The hint feature should highlight the slot corresponding to the next incomplete item, automatically disappear after a short period, and also be cleared when the player begins dragging.

## State Flow

After the game launches, it enters the start-guide state. Once the player confirms, it enters the playing state, and background music may begin after player interaction. In the playing state, the player can drag and drop items, view level selection, request a hint, and reset the current level.

Resetting the current level hides the completion panel, clears every item's slot assignment and completion state, restores the items to their initial awaiting-organization layout, and resets progress, score, combo, and timing. Play must be able to continue immediately after a reset.

When the number of correctly completed items reaches the total number of items in the level, the game enters the completed state. The completed state displays results and celebratory feedback; clicking the next level closes the completion panel and loads the next level. After completing the final P1 level, the next step should return to a replayable flow rather than entering a blank or unavailable level.

Switching levels should reload that level's themed items, slots, background, and sound effects, and reset the level's play state. Placed items, the completion panel, hint highlights, or combo display from the previous level must not persist during a switch.

## Menus, Modes, and Progression

The start guide must block game input until the player confirms the start. After confirmation, the guide disappears and the main game area becomes interactive.

In play mode, the level-selection panel should communicate linear progression: the current level can be selected, while future levels cannot be skipped to directly. Clicking a future or locked level should display clear rejection feedback and keep the current level unchanged. Completed levels may display a sense of completion or progress marker, but P1 does not require free replay of all previous levels.

Controls such as hint, reset, level selection, next level, and close panel should have clear visible states. Whenever any panel is open, it should clearly block or release main-game input; after it closes, interaction with the main game area must resume.

P2 may provide a creation/editing mode that allows adjustment of items, slots, tray shape, color, size, rotation, level order, locked state, preview, and save/restore. If this mode is included, it must be clearly separated from normal play mode, editing controls must not obstruct player gameplay, and players must not be required to use editing features to complete ordinary levels.

## Victory, Failure, Score, and Progress

This game has no lives, countdown failure, or permanent failure. The victory condition is that every item in the current level is correctly placed. Failure paths primarily consist of incorrect trial placement, invalid level selection, invalid drag-and-drop, or resetting to start over.

Each correct placement grants a base score. Consecutive correct placements form a combo, increasing the reward for subsequent correct placements and displaying brief bonus feedback. An incorrect trial placement breaks the combo, but does not deduct score already earned or reduce completed progress.

Completing a level grants an additional completion bonus and records the total score, longest combo, and completion time for display. The next level starts with new timing, score, and combo states; a cross-level total-score leaderboard is not required for P1.

## Failure, Rejection, and Invariants

When the player attempts to drag an item that has been correctly placed and locked, dragging should be rejected and the item should remain in the correct slot. The player cannot repeatedly drag a completed item to score repeatedly.

Placing an item in an incorrect slot does not increase correct progress, trigger completion, or lock the item. The incorrect item must remain selectable, draggable away, and capable of being correctly placed.

When an item is dragged out of a slot or placed near the boundary outside the playfield, it must not disappear, leave the playable area, or become unselectable.

When the player clicks a future level, a locked level, or a level outside the available range, the level should not switch; the game should indicate that the current action was rejected and keep the current level and organized state stable.

While the completion panel is open, drag-and-drop operations in the old level should not continue changing score or progress. After closing it or entering the next level, the state should recover according to the intended flow.

When the level is completed, there are no incomplete items, or a hint is already active, the hint system should not stack multiple duplicate highlights. When the player begins actually dragging an item, any existing hint should be cleared.

After a reset, all items should return to an incomplete, draggable state; progress, score, combo, timing, and the completion panel should all be cleared. Resetting should not change the item-to-slot pairing within the level itself.

## P2 and Scope Cuts

P2 may add more themed levels, including additional organization themes such as toys, kitchen, backpack, bathroom, and gardening. If these levels are not currently implemented, they should be explicitly reserved as future content, without exposing hidden or empty levels to the player.

P2 may add an editor, level management, manual save, autosave, editing restoration, grid snapping, object scaling and rotation, a shape library, and theme-order management. If the normal-play version does not include an editor, it should be treated as a scope cut; P1 requires only the complete player gameplay flow.

P2 may enhance audio, backgrounds, particles, entrance animations, idle wobbling, themed artwork, and completion celebrations. The visual presentation may be freely replaced, but the visible P1 causal chain must be preserved: responsive dragging, correct snapping, correctable mistakes, synchronized progress, and completion celebration.

Scope cuts: online leaderboards, sharing, account systems, downloads, external creator tools, genuinely persistent editing data, exact original assets, exact original copy, and management interfaces tied to a particular platform are not required.

---

## GDD / Design Doc (merged from design-doc.md)

# Sortie Design Doc

## Design Goals

Sortie is a soothing item-organization and shape-matching puzzle game. The player's primary enjoyment comes from observing scattered objects, identifying silhouette slots, experimenting through drag-and-drop, and ultimately organizing the entire level. The game does not pursue tense failure, but instead aims for responsiveness, clarity, correctability, and the satisfaction of completion.

The P1 acceptance baseline is that the player can proceed from the start guide into the first level and, across at least 5 themed levels, complete the closed loop of "pick up an item -> drag it to a slot -> correct snap or incorrect trial placement -> continue correcting -> put everything in place -> completion panel -> next level or replay." P2 consists of deeper content such as more themes, editing/creation capabilities, additional audio and visuals, and save/restore.

## MDA

### Mechanics

- Item and slot matching: Each level contains a set of themed items and corresponding silhouette slots. The correct relationships are communicated jointly through shape, size, theme, and positional cues.
- Drag-and-drop input: The player holds an unlocked item with a mouse or touch input, and the item moves continuously with the pointer; on release, the drop point determines whether it is near a slot.
- Snapping and placement: When released near a slot, the item snaps toward the slot center and produces brief placement feedback.
- Correct placement: After an item is placed in its target slot, it is locked, counted toward progress, increases score and combo, and triggers success feedback.
- Incorrect trial placement: When an item is placed in a non-target slot, it may remain temporarily, but is not locked, does not count toward progress, breaks the combo, and must be draggable away again.
- Invalid release: An item released outside a slot or near a boundary remains visible, selectable, and incomplete.
- Hint: A hint highlights the target slot for one incomplete item, disappears after a short time, and is cleared when the player begins dragging.
- Reset: Reset the current level, clearing placement, score, combo, timing, hint, and completion panel while preserving the item-to-slot relationships for that level.
- Level progression: After completing a level, the game enters the completed state and the player can proceed to the next level; after the final P1 level, the flow returns to a replayable state.
- Level selection and locking: Play mode communicates linear progression; future or locked levels are rejected and the current level remains stable.

### Dynamics

- The player first observes differences in the silhouettes of items and slots, then verifies judgments through dragging.
- Correct placement produces positive feedback that the arrangement is "becoming tidy," encouraging the player to find the next item.
- Incorrect trial placement is not a hard failure; instead, it provides shape/position feedback and allows another attempt. The broken combo provides mild risk.
- Locking correctly placed items protects the player's results and prevents accidental actions from damaging a completed state.
- Incorrect items remain conspicuous and easy to pick up, allowing the player to recover from a cluttered state.
- Hints provide direction when the player is stuck, but do not replace drag-and-drop and judgment.
- The completion panel briefly halts interaction with the old level, making rewards, results, and the choice of next step into a clear milestone.

### Aesthetics

- Soothing: There are no lives, countdown failures, or permanent penalties.
- Tidy: Completion progress takes the scene from scattered to orderly.
- Controlled: Dragging direction matches screen direction, and after release, evaluation and stabilization occur immediately.
- Satisfying: Correct placement provides snapping, sparkle, sound, particles, or other feedback while synchronously updating progress.
- Mild challenge: The player must recognize the correspondences between items and slots; mistakes break the combo but do not prevent continued play.

## M-Feature List

| ID | Priority | Feature | Player Value |
|---|---|---|---|
| M1 | P1 | Start guide and playable main interface | The player understands the objective and enters an interactive organization scene after confirming. |
| M2 | P1 | Themed levels and item/slot layout | Every level has recognizable themed items, slots, and organization objectives. |
| M3 | P1 | Responsive item dragging | After being held with a mouse or touch input, the item moves continuously in the same screen direction and remains controllable. |
| M4 | P1 | Release evaluation and slot snapping | Releasing near a slot places the item near it; releasing far from slots does not cause it to disappear or become stuck. |
| M5 | P1 | Correct-placement rewards | The correct slot locks the item, updates progress, increases score/combo, and provides success feedback. |
| M6 | P1 | Incorrect trial placement and recoverable correction | An incorrect slot does not count toward progress, complete the level, or lock the item; the item can still be dragged away again. |
| M7 | P1 | Level completion and next step | After everything is correctly placed, the game displays results and a celebration and provides the next level or replay. |
| M8 | P1 | Reset current level | The player can clear the current attempt and immediately organize again. |
| M9 | P1 | Linear level selection and rejection | The current level is playable; future/locked levels are rejected, and the current state remains stable. |
| M10 | P1 | Hints and hint clearing | The player can request a target-slot hint; hints do not stack and are cleared when dragging begins. |
| M11 | P2 | More themed levels | Extends the organization content without exposing empty or unavailable levels. |
| M12 | P2 | Creation/editing mode | Adjust items, slots, tray, order, locking, preview, and save/restore, isolated from normal play. |
| M13 | P2 | Enhanced audio, visuals, and celebrations | Strengthens the themed atmosphere, snapping, idle wobbling, and completion celebrations without replacing the P1 causal chain. |

## P1 Core Loop Executable Traces

### Loop A: Organizing a Single Item

1. Start/reset: The player confirms the start or resets the current level and enters the playing state; all incomplete items are draggable, and progress displays the number of correctly placed items in the level.
2. Player input: The player holds an item that has not been correctly placed using a mouse or touch input and moves it near the target slot.
3. Continuous state change: The item immediately receives visible pickup feedback, is placed at a more easily observed layer, and moves continuously in the same direction as the pointer left/right/up/down; it must not lose control because of rapid movement or a change in touch input during dragging.
4. Objective/risk: The objective is to bring the item's center near the matching slot; the risks are judging the wrong slot, releasing outside a slot, or breaking the combo.
5. Reward/failure: When released near the target slot, the item snaps, settles with an elastic effect, locks, increases progress, updates score and combo, and provides success feedback. When released near an incorrect slot, the item may rest there temporarily but does not count as complete or lock, and the combo breaks. When released outside a slot, the item remains visible and draggable again.
6. Progress/restart: If incomplete items remain, the player continues organizing the next one; if the player wants to clear the attempt, they can reset the current level and start over.

Interaction-feel causal chain: While held, position corresponds directly to pointer displacement; after release, there is no inertia, braking, or continued sliding, and the item instead immediately enters drop-point evaluation and a stable state. Correct items no longer participate in ordinary dragging after being locked, while incorrect items must remain on top or visibly offset so they are easy to pick up again.

### Loop B: Correcting a Mistake

1. Start/reset: The level is in the playing state, and at least one item is incorrectly trial-placed or remains unplaced.
2. Player input: The player holds the incorrectly trial-placed or incomplete item again and drags it from its current drop point toward another slot.
3. Continuous state change: The incorrect item reenters the dragging state, clears the current hint, and uses layering and visible feedback to emphasize that it can still be handled.
4. Objective/risk: The objective is to correct the prior matching error; the risk is placing it incorrectly again and continuing to break the combo, but the item will not be lost and completed progress will not be reduced.
5. Reward/failure: Placing it in the correct slot changes it to correctly placed; placing it in an incorrect slot keeps it correctable; placing it outside slots leaves it draggable again.
6. Progress/restart: The player ultimately completes the level through repeated corrections; if the situation becomes too cluttered, resetting restores the initial layout.

### Loop C: Completing and Advancing a Level

1. Start/reset: The player continues organizing individual items in the current level.
2. Player input: The player places the final incomplete item into its target slot.
3. Continuous state change: The final item snaps and locks, progress reaches the level total, and the completed state takes control of the main play input.
4. Objective/risk: The objective is to complete the entire level; the risks are that the old level might still be accidentally manipulated after the completion panel opens or that old-level content might remain in the next level's state.
5. Reward/failure: The game displays a celebration, total score, longest combo, and completion time; drag-and-drop in the old level no longer changes score or progress.
6. Progress/restart: The player chooses the next level, loading a new theme and resetting the level's timing, score, combo, hints, and completion state; after the final P1 level, the game enters a replayable flow. The player may also reset/replay the current level.

### Loop D: Linear Level Selection

1. Start/reset: The player opens the level-selection panel in play mode.
2. Player input: The player selects the current level, a future level, or a locked level.
3. Continuous state change: The panel communicates the availability of each level and clearly blocks or releases main-game input while open.
4. Objective/risk: The objective is to understand the progression path; the risk is that skipping to a future level could disrupt progress.
5. Reward/failure: Selecting the currently available level keeps or loads it; selecting a future/locked/out-of-range level displays rejection feedback, while the current level, organized state, and progress remain unchanged.
6. Progress/restart: After the panel closes, the main game resumes interaction; the next level becomes the progression objective only after the current level is completed.

## State Design

| State | Entry Method | Allowed Actions | Exit Method | Required Invariants |
|---|---|---|---|---|
| Start guide | Game launch | Read the objective, confirm start | Confirm start | Blocks main-game drag-and-drop input. |
| Playing | Start, reset, level load | Drag-and-drop, hint, reset, open level selection | Complete all items, open a blocking panel | Playable items do not disappear; correct progress only comes from correct placement. |
| Dragging | Hold a draggable item | Continuous movement, release | Release pointer/touch | The item moves in the same direction as the pointer and remains visible. |
| Completed | All items in the current level are correctly placed | View results, next level, replay | Next level or reset/replay | Drag-and-drop in the old level cannot continue changing score or progress. |
| Level selection | Open the selection panel | Select an available level, attempt a locked level, close | Load an available level or close | Invalid selection does not change the current level or organized state. |
| P2 editing/creation | Enter editing capability | Adjust and preview level content | Return to normal play | Isolated from normal play; editing cannot be required to complete P1 levels. |

## Mechanic Coverage Matrix

| M-feature | Priority | Player trigger | Observable result | Failure / rejection / invariant |
|---|---|---|---|---|
| M1 Start guide and playable main interface | P1 | Player confirms start | The guide disappears; the main scene displays the level, progress, tray, items, and available controls | Drag-and-drop is blocked while the guide is present; no blocking layer may remain after confirmation. |
| M2 Themed levels and layouts | P1 | Enter or switch a P1 level | Each level presents a theme-consistent group of items, slots, and background atmosphere, with at least 5 playable themes | Switching levels must not retain the previous level's items, hints, completion panel, or combo display. |
| M3 Responsive item dragging | P1 | Hold and move an unlocked item with mouse/touch | The item is brought to the front/enlarged/given a shadow or other feedback and moves continuously in the input direction | Correctly locked items reject ordinary dragging; rapid movement or touch input must not lose control. |
| M4 Release evaluation and snapping | P1 | Release an item near a slot or outside slots | It snaps and settles elastically near a slot; outside slots, it remains visible and draggable again | Releasing outside slots cannot make the item disappear, move out of bounds and become unselectable, or directly complete. |
| M5 Correct-placement rewards | P1 | Release an item into its target slot | The item locks in the slot, progress increases, and score/combo and success feedback appear synchronously | The same correct item cannot score repeatedly; progress cannot exceed the level total. |
| M6 Incorrect trial placement and correction | P1 | Release an item into a non-target slot, then drag it away again | The incorrect item is visible, unlocked, does not count toward progress, and can be picked up again for correction | Incorrect items cannot become so obscured that play cannot continue; incorrect trial placement cannot trigger completion. |
| M7 Completion and next step | P1 | Complete all items in the level | The completion panel displays results, longest combo, time, and the next-step entry point | While the completion panel is open, old-level input no longer changes progress/score. |
| M8 Reset | P1 | Click reset current level | Items return to the awaiting-organization layout; progress, score, combo, timing, hint, and completion panel are cleared | Resetting does not change the level's item-to-slot pairings; the level is immediately playable after a reset. |
| M9 Linear level selection | P1 | Open level selection and click a level | The current level is available; future/locked/out-of-range levels provide rejection feedback | Invalid selection keeps the current level, organized state, and progress stable. |
| M10 Hint | P1 | Click hint | One incomplete item's target slot is briefly highlighted and clears when dragging begins | Highlights do not stack when completed, when there are no incomplete items, or when a hint already exists. |
| M11 More themes | P2 | Advance or select an additional theme | More organization themes are playable without exposing empty levels | Unimplemented themes must be hidden or marked unavailable. |
| M12 Editing/creation mode | P2 | Enter the editing capability and adjust content | Items, slots, tray, order, locking, preview, and save/restore can be adjusted | Editing controls cannot obstruct normal play; ordinary levels cannot depend on editing for completion. |
| M13 Enhanced audio, visuals, and celebrations | P2 | Drag, place correctly, wait, complete | Sounds, particles, wobbling, themed backgrounds, and completion celebrations enhance feedback | Audio and visuals cannot replace the core causal chain; visuals are flexible, but the meaning of feedback must be clear. |

## Supporting Systems

- HUD: Displays the current level and correct-placement progress; combo or bonus appears briefly only when there are consecutive correct placements.
- Score: Correct placement grants a base score, and combos increase subsequent rewards; incorrect trial placement breaks the combo but does not deduct earned points.
- Time: Timing begins when the level starts/resets and completion time is displayed upon completion; it does not constitute countdown failure.
- Audio and feedback: Background music may begin after player interaction; sounds for success, snapping, completion, and so on enhance the experience but cannot be the sole feedback.
- Panel blocking: The start guide, level selection, completion panel, and so on must clearly communicate whether they block main-game input and restore interaction after closing.

## P2 and Scope Cuts

P2 can extend more themes, an editor, manual/autosave, grid snapping, object scaling and rotation, a shape library, theme-order management, additional particles, and completion celebrations. If this content is not implemented, it should be hidden or explicitly presented as a future enhancement and should not allow the player to enter a blank, impossible-to-complete flow or one that requires editing to play.

P1 does not require online leaderboards, sharing, account systems, downloads, external creator tools, genuinely persistent editing data, exact assets, exact copy, or a platform-bound management interface.
