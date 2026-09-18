# The Daughter of the Sea: Before the Foam Gameplay Requirements

## Game Positioning

This is a fairy-tale narrative puzzle game. In a portrait or adaptive display, players restore scrambled illustrations level by level, with each image corresponding to an important moment in the daughter of the sea's journey; after a puzzle is completed, story text and the next action appear, and players continue forward or choose between two options at key moments, ultimately reaching different fateful endings.

The core enjoyment comes from a three-part loop: dragging pieces, watching the image gradually come together, and reading a new story turn. The game's atmosphere should remain dreamlike, romantic, sorrowful, and evocative of an ocean fairy tale. Interaction feedback should be gentle but clear, making players feel that they are piecing memory and fate back together bit by bit.

## P1 Core Gameplay

Players begin a new journey from the main menu, or continue when unfinished progress exists. After starting, they enter a puzzle level. The center of the screen displays an image divided into a grid and scrambled, while a title or progress information tells players which part of the story they are in.

The goal of each level is to return all pieces to their correct positions. Players use a mouse or touch input to hold and drag a piece; the piece should lift from its original position and follow the pointer. If the piece has already joined correctly with adjacent pieces into a contiguous block, holding that merged block should lift and move the entire block together. The drag preview must not leave the visible screen and enter an inoperable position.

On release, the game snaps to the nearest grid displacement based on drag distance. If the displacement is valid, the dragged piece or merged block moves to the target cell, pieces displaced from the target area should give way in the opposite direction, and all related pieces then snap into their new cells with clear placement feedback. If the player does not produce a grid displacement, drags beyond the puzzle area's boundary, drags to a position that cannot accommodate the merged block, or performs a non-guided exchange in a tutorial level, the piece should rebound to its original position, and neither the puzzle state nor move count should advance.

A valid exchange increases the move count; if the move count is displayed, it should change only after an actual exchange. After an exchange, any pieces whose adjacency at their current positions matches their adjacency in the original image should merge automatically: boundary or highlight feedback indicates that they have become a contiguous image block, which can thereafter be dragged as a whole. When a merged block is moved away, replaced by other pieces, or no longer maintains a contiguous relationship, it should split or regroup into the blocks that remain connected in the current state; pieces that have been incorrectly separated must not continue to appear as a complete block.

After the puzzle is completed, puzzle input for the level is locked, celebratory completion feedback appears, and the complete image shrinks or makes room, after which the story content for this segment is displayed. If the segment only advances sequentially, the player clicks continue to enter the next image; if it is a key decision, two choices appear simultaneously, and choosing one takes the player to the corresponding subsequent level; if it is an endpoint, an ending description and replay entry point are displayed.

## Interaction Feel and Visible Causal Chain

While the pointer is held and moved, the selected piece or merged block should always follow the player's finger or mouse as an overlay preview, while the piece at the original position should enter a picked-up state so the player does not mistakenly think it was not grabbed. Drag direction matches screen direction: dragging right pushes the preview toward cells on the right, and dragging down pushes it toward cells below; opposite directions produce opposite grid displacements.

Releasing input is a discrete placement decision, not free placement. There are only two clear outcomes after release: a valid displacement snaps and exchanges pieces and updates the puzzle; an invalid displacement rebounds and restores the original state. The rebound, snap, and exchange processes should have brief animations or equivalent visible feedback, and must not change instantaneously and silently.

Dragging a merged block is a special operation with both high reward and a cost: the reward is moving multiple correctly adjacent pieces at once, helping players reconstruct a large portion of the image more quickly; the cost is that it occupies space matching its shape, a move to an unsuitable position is rejected, and other pieces displaced during the move may break existing merged relationships. Players need to weigh whether moving a large block will disrupt other areas.

The main risk is not losing health, but making an incorrect exchange that moves the image further from completion. The game must express this risk through piece positions, merged-block splitting, move-count changes, and rejected moves rebounding. Continued dragging after completion, repeated operations during an exchange animation, and clicking the puzzle while an ending or menu layer is open should all be rejected or ignored and must not disrupt the completed state.

## Levels and Progress

Levels should gradually transition from a low-difficulty tutorial to larger grids: the opening uses a very small puzzle, followed by medium grids, with larger grids used later and around the endings. Every level should use a complete illustration appropriate to the current story node, with all piece content coming from the same image so the scene is clear once restored.

The tutorial level should demonstrate the most basic exchange direction through highlighting, gesture prompts, or an equivalent method, and should allow the player to complete only the currently prompted exchange. The learned state should be saved after the tutorial is completed, so later new games need not force the full tutorial again. P2 may add an entry point for skipping or reviewing the tutorial.

Pieces should be reshuffled when entering a normal level. The initial state must not already be complete, nor should it immediately form so many automatic merges that the puzzle challenge is lost. Each time a new level is entered, the previous level's pieces, completion panel, animation state, choice buttons, and temporary drag state must be cleared.

Saved progress should record the current level, story choices already made, and tutorial completion. After players return to the menu, if continuable progress exists, they should be able to continue at the unfinished level. Upon reaching any ending and choosing replay, they should be able to return to the menu and begin a new journey; old temporary puzzle state must not block the new game.

## Story Branches

The main story begins with longing in the deep sea and progresses through nodes such as the nighttime sea surface, an encounter aboard a ship, a storm rescue, a bargain with the sea witch, misunderstanding or recognition in the human world, and a life-or-death choice brought by the sisters. At each node, the image is first restored through a puzzle, then a short story carries the emotion forward.

Key nodes offer two mutually exclusive choices, and the selection immediately determines the direction of the next level. Players should feel that their choices change the story path, rather than merely changing a passage of explanatory text. At minimum, the following types of paths should be included: leave or stay, accept or refuse the bargain, remain silent or try to convey the truth, persist in love or return to the sea, and lower the weapon or proceed toward a dark decision.

The game should provide at least five reachable endings: the tragedy of turning into sea foam, the tragedy of a dark return, a gentle ending of offering blessings from afar, a regretful ending of missing a reunion, and a hopeful ending of leaving the kingdom with the prince. Each ending should have an independent image, ending tone, and replay entry point.

## Menu, States, and Feedback

At launch, there should be a loading or preparation state, and main menu buttons should become operable only after resources are ready. The main menu must contain at least New Game; Continue is shown when saved progress exists. Clicking a button should provide visible and audible confirmation feedback, then switch to the game scene.

Game states must include at least: loading, main menu, puzzle in progress, narrative display after puzzle completion, branch choice, and ending display. Different states should be displayed mutually exclusively. After entering a puzzle in progress, no menu layer should remain to obstruct it; after entering a completion or ending state, puzzle input should be locked according to the rules.

The puzzle feedback chain must be complete: pickup feedback, drag preview, valid exchange snapping, invalid-operation rebound, correct-adjacency merge cue, completion celebration, story reveal, and the appearance of choice or continue buttons. Sound and music enhance the atmosphere, but key gameplay feedback must not rely on sound alone.

If background music is provided, it should change with the story scene or ending mood: underwater scenes, shipboard celebrations, tragic love in the human world, and tragic or hopeful endings can have different qualities. Playing sound only after the player's first interaction is acceptable; in a muted environment, state changes must still be understandable through visuals.

## Failure and Rejection Paths

An invalid drag must not exchange pieces, increase the move count, or trigger a merge or completion. Dragging outside the puzzle area, moving a merged block to a target shape that crosses the boundary, dragging repeatedly during an animation, continuing to drag after completion, and dragging while a menu or ending layer is open must all leave the state stable.

Choice buttons are available only after the current level is completed and its story reveal has finished; an incomplete puzzle cannot jump directly to subsequent story content. The continue button is available only after a sequential level is completed; replaying an ending can only return to the restart path and cannot remain in the concluded level.

If saving progress fails, the current play session should not crash; the player can still continue through this run. If resources have not finished loading, the game should not enter a blank puzzle; it should remain in a loading, error-message, or retryable state.

## P2 Enhancements and Scope of Cuts

P2 may add level selection, an ending gallery, records of achieved endings, story-segment replay, tutorial replay, a move-count display toggle, adjustable grid difficulty, volume/mute settings, and more refined transitions.

P2 may provide a creation or preview mode for selecting any story node, adjusting the grid size, or viewing parameters, but it is not part of the core gameplay required for ordinary players to complete the main story. If this mode is not provided, it should be explicitly cut without affecting the playability of the main story.

Scope of cuts: combat, health, timed failure, leaderboards, items, shops, character movement, and physical-collision levels are not required. Story illustrations and music may use equivalent original content; no particular assets or verbatim text need to be reused, but the core experience of the daughter of the sea's fairy-tale journey, puzzle restoration, and multiple-ending choices must be retained.

---

## GDD / Design Doc (merged from design-doc.md)

# The Daughter of the Sea: Before the Foam Design Doc

## Design Goals

This is a fairy-tale narrative puzzle game. By restoring scrambled illustrations of an ocean legend level by level, players advance the daughter of the sea from longing in the deep sea through a human encounter, storm rescue, and bargaining choices to multiple fateful endings. The core design should make "dragging pieces," "restoring the image," "revealing the story," and "making branch choices" form a gentle but clear loop.

The P1 qualification threshold is not merely the presence of an ocean fairy-tale theme or an ordinary puzzle. Players must be able to begin a journey from the menu, complete multiple puzzle levels along at least one main path, experience the story reveal after puzzle completion, make choices at key nodes, and ultimately reach a replayable ending. Puzzle interaction must preserve the visible causal chain of dragging, snapping to grid positions, valid exchanges, moving merged blocks as a whole, invalid-operation rebound, completion locking, and progress advancement.

## MDA

### Mechanics

- Players begin a new journey from the main menu after loading is complete, and can continue an unfinished level when progress exists.
- Each level displays an illustration corresponding to the current story node, divides it into grid pieces, and scrambles them.
- Players hold and drag a piece or a correctly merged contiguous block, with the preview moving with the pointer in screen direction.
- When the drag is released, the nearest grid position is determined from the displacement: a valid displacement triggers a snapping exchange, with displaced pieces giving way in the opposite direction; an invalid displacement rebounds and preserves the state.
- Valid exchanges advance the move count or equivalent progress feedback; invalid drags, out-of-bounds moves, repeated operations during an animation, operations after completion, and operations while blocked by a menu or ending layer do not advance it.
- Correctly adjacent pieces automatically join into contiguous blocks, which can be dragged as a whole; when moving or replacing pieces breaks a contiguous relationship, the merged block should split or regroup.
- After puzzle completion, puzzle input is locked, celebratory feedback appears, the display of the complete image is adjusted, story content is revealed, and then an entry point for continuing, making a branch choice, or replaying the ending appears.
- Key story nodes provide two mutually exclusive choices, and the choice determines the direction of subsequent levels.
- Progress records the current level, story choices already made, and tutorial completion; replay can return to a new journey.

### Dynamics

- Players first learn the basic action of "dragging to an adjacent cell and exchanging" through a small-grid tutorial, then move to larger grids.
- Single-piece exchanges are used for local repairs; moving a merged block as a whole is used to quickly relocate a restored area, but may occupy more space, be rejected when out of bounds, or disrupt other merged relationships.
- Players judge which parts are already correctly adjacent through piece boundaries, contiguous image blocks, highlighting, or equivalent feedback.
- An incorrect exchange does not cause immediate failure, but moves the image further from restoration; the risk is expressed through disordered positions, split merges, increased move count, and rejected moves rebounding.
- Completing a level provides a complete illustration and a story turn, prompting players to enter the next image or make a fateful choice.
- Branch choices change subsequent scenes and the final ending, creating the narrative rhythm of "restore memories -> bear the consequences of choices -> proceed toward fate."

### Aesthetics

- The atmosphere should be dreamlike, romantic, sorrowful, and evocative of an ocean fairy tale.
- Puzzle feedback should be gentle but clear: pickup, lift, snap, rebound, merge cues, and completion celebration should all provide satisfying tactile sensations.
- The story experience emphasizes love, sacrifice, regret, blessing, and hope, and each ending should have an independent emotional tone.
- Sound and music are enhancements; key state changes must be visually understandable.

## M-Feature List

| ID | Priority | M-feature | Design intent | Player-visible result |
|---|---|---|---|---|
| M1 | P1 | Menu start and continue | Give players a stable entry point for beginning or resuming the journey | Buttons become operable after loading completes, and the menu no longer blocks the main scene after entering the puzzle |
| M2 | P1 | Grid puzzle levels | Establish the primary playable object and restoration goal | Scrambled pieces of the story illustration appear in the center, and the current segment is identifiable |
| M3 | P1 | Single-piece drag exchange | Provide the most basic puzzle operation | A held piece lifts, drag direction matches screen direction, and release causes an exchange or rebound |
| M4 | P1 | Whole merged-block movement | Preserve core strategic depth and tactile feel | Correctly contiguous pieces form a whole and can be dragged as one block; unsuitable positions are rejected |
| M5 | P1 | Automatic merging and split/regroup | Make restoration progress visible and the rules credible | Contiguous-block feedback appears where adjacency is correct; once the relationship is broken, the block no longer incorrectly remains intact |
| M6 | P1 | Completion lock and story reveal | Turn puzzle completion into a narrative reward | After completion, input is locked and celebration, the complete image, story content, and a next-step entry point appear |
| M7 | P1 | Story branches | Make choices affect the story path | Two choices appear at key nodes, and selecting one enters the corresponding subsequent level |
| M8 | P1 | Multiple endings and replay | Close the loop for the chain of choices | At least five endings are reachable, and the journey can be restarted after the ending display |
| M9 | P1 | Tutorial and difficulty progression | Lower the cost of understanding the first level and gradually deepen the challenge | A small opening grid guides the basic exchange, and subsequent grids become larger |
| M10 | P1 | Progress saving and state cleanup | Support interruption recovery and prevent old state from contaminating new levels | The current level, choices, and tutorial state can be restored; a new level clears old drag, completion, and choice states |
| M11 | P2 | Sound and scene music | Enhance emotion and feedback | Different story segments or endings can change in character, while gameplay remains clear when muted |
| M12 | P2 | Level/ending review and settings | Provide long-term play and accessibility enhancements | Optional level selection, ending gallery, tutorial replay, and difficulty or move-display settings |
| M13 | P2 | Creation or preview mode | Serve debugging, preview, or customized experiences | Optionally select nodes or adjust the grid without affecting the ordinary main story |

## P1 Core Loop Executable Traces

### Loop A: From Beginning the Journey to Entering the First Puzzle

1. Start/reset: The game loads resources and the main menu is operable; the player selects a new journey, or selects continue when progress exists.
2. Player input: Click start or continue.
3. Continuous state changes: The menu layer exits and the game enters puzzle-in-progress; the illustration for the current story segment is divided into a small grid and scrambled; the move count or equivalent progress is initialized; whether the tutorial state appears is determined by progress.
4. Goal/risk: The goal is to restore the current illustration; the risk is that resources are not ready or old state remains, resulting in a blank puzzle, a blocking menu, or the previous level's panel still being present.
5. Reward/failure: Successfully enter a draggable puzzle level; if resources are not ready, remain in a loading, error, or retry state and do not present the player with a blank unplayable puzzle.
6. Progress/restart: A new journey records its starting point; continuing a journey restores the unfinished level; later failure or exit should not corrupt saved progress.

### Loop B: Single-Piece Drag Exchange

1. Start/reset: The puzzle is in progress, no exchange animation is running, and no completion lock is active; the player sees at least one draggable piece.
2. Player input: Hold a piece, drag it in a screen direction, then release.
3. Continuous state changes: The piece lifts from its original position and the original position enters a picked-up state; the drag preview follows the pointer and is constrained to the visible screen area. Dragging right moves the preview right, dragging down moves it down, and opposite directions produce opposite displacements.
4. Goal/risk: The goal is to move the piece to a valid adjacent or more distant cell; the risks are insufficient drag distance, crossing the boundary, failing to match the tutorial requirement, or repeated input during an animation.
5. Reward/failure: A valid displacement snaps to the target cell and exchanges with the piece at the target position, the displaced piece gives way in the opposite direction, and the move count or equivalent exchange feedback advances; an invalid displacement rebounds to the original position, and neither puzzle state nor move count advances.
6. Progress/restart: After the exchange, check correct adjacency and completion; if incomplete, continue dragging, and if complete, enter Loop E.

### Loop C: Whole Merged-Block Movement

1. Start/reset: If two or more pieces at their current cells have the same adjacency relationships as in the original image, they are displayed as a contiguous merged block.
2. Player input: Hold a valid area within the merged block, drag the entire block, and release.
3. Continuous state changes: The entire merged block moves together as an overlay preview, with pieces inside the block maintaining their relative positions; the target position is calculated from the drag displacement; other pieces that will be covered prepare to give way in the opposite direction.
4. Goal/risk: The goal is to move multiple restored pieces at once to reconstruct a larger portion of the image; the risks are that the block shape occupies more space, the target shape crosses the boundary, the landing position cannot accommodate it, or other merged relationships are displaced.
5. Reward/failure: A valid block move snaps and exchanges the entire block, displaced pieces move into the vacated positions, and all affected merged relationships are then recalculated; an invalid block move rebounds, and the original puzzle state does not advance.
6. Progress/restart: If new adjacency relationships are correct, the block expands or joins other blocks; if relationships are broken, the block splits or regroups. The player continues restoring the puzzle until the complete image is restored.

### Loop D: Tutorial-Guided Exchange

1. Start/reset: On the first new journey, a small-grid tutorial level begins, and the interface indicates the piece or direction currently allowed for exchange.
2. Player input: Drag the guided piece to complete the specified exchange; the player may also try dragging another piece or in the wrong direction.
3. Continuous state changes: A correct drag follows the ordinary drag rules for lifting, moving, releasing, and snapping; non-guided operations are rejected or ignored.
4. Goal/risk: The goal is to learn basic exchange directions and the release decision; the risk is that players mistakenly believe any drag will advance progress.
5. Reward/failure: A correct exchange advances the tutorial step and ultimately completes the tutorial; an incorrect exchange rebounds without increasing the move count or changing the puzzle.
6. Progress/restart: The state is recorded after tutorial completion; later new games need not force the full tutorial again unless a P2 review entry point is provided.

### Loop E: From Puzzle Completion to Story Progression

1. Start/reset: All pieces are in their correct cells, and the current image is complete.
2. Player input: Completion itself triggers the result; the player then clicks continue, chooses a branch, or replays the ending.
3. Continuous state changes: Puzzle input is locked and celebratory feedback appears; the complete image shrinks or makes room; story content appears; buttons appear according to the current node type.
4. Goal/risk: The goal is to turn image restoration into a story reward; the risks are that dragging remains possible after completion, story content can be skipped to before completion, old buttons remain, or the wrong node is shown.
5. Reward/failure: A sequential node shows a continue entry point, a branch node shows two mutually exclusive choices, and an endpoint shows an ending description and replay entry point; these progression entry points are unavailable when completion conditions have not been met.
6. Progress/restart: Continue enters the next level; a choice records the path and enters the corresponding level; replaying an ending returns to the new-journey entry point.

### Loop F: From Branch Choice to Multiple Endings

1. Start/reset: The current level has been completed and displays its story, and the node is in the branch-choice state.
2. Player input: Click one of the two mutually exclusive choices.
3. Continuous state changes: The choice is recorded; the current completion panel and puzzle fade out or transition equivalently; the next level is recreated, and old drag state, choice buttons, and completion panel are cleared.
4. Goal/risk: The goal is to make players feel that their choices change the story path; the risks are that a choice changes only a passage of explanatory text while the subsequent route remains identical, or that state is not cleared and blocks input.
5. Reward/failure: The player enters the subsequent story node determined by the choice and ultimately reaches one of at least five types of endings; each ending has an independent image, tone, and replay entry point.
6. Progress/restart: Every key choice and the current level can be saved; after any ending, the player can restart without retaining temporary puzzle state that blocks a new game.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure / rejection / invariant |
|---|---|---|---|---|
| M1 Menu start and continue | P1 | Click new journey or continue | Enter puzzle-in-progress; the menu does not block the puzzle area | Cannot enter a blank puzzle before loading finishes; continue is available only when progress exists |
| M2 Grid puzzle levels | P1 | Start or enter the next level | A scrambled grid illustration appears, and the level title or progress is identifiable | The initial state must not be complete; the previous level's UI and temporary drag state must be cleared |
| M3 Single-piece drag exchange | P1 | Hold, drag, and release a piece with mouse or touch | The preview follows the pointer; valid release snaps and exchanges; the move count or exchange feedback advances | Zero displacement, crossing the boundary, non-guided exchanges, and post-completion dragging do not change the state |
| M4 Whole merged-block movement | P1 | Hold and drag a contiguous merged block | The whole block lifts and moves together, displaces other pieces after placement, and recalculates merges | If the target shape crosses the boundary or cannot be accommodated, it rebounds and does not advance the move count |
| M5 Automatic merging and split/regroup | P1 | Correct adjacency is formed or broken after a valid exchange | Correct adjacency displays a contiguous block; after incorrect separation, it is no longer displayed as a complete block | Pieces whose relationship has been broken must not continue to move as a complete block |
| M6 Completion lock and story reveal | P1 | Complete all grid positions | Celebratory feedback, the complete image, story content, and a next-step entry point appear | Puzzle input is locked after completion; story progression cannot be entered directly before completion |
| M7 Story branches | P1 | Click a choice after completing a key node | The next-level direction changes and the choice is recorded | Choice buttons are available only after story reveal; the two choices are mutually exclusive |
| M8 Multiple endings and replay | P1 | Complete the endpoint level along a chain of choices | An independent ending image and replay entry point are displayed | The old puzzle cannot be operated in the ending state; replay clears old temporary state |
| M9 Tutorial and difficulty progression | P1 | Perform the prompted exchange during the first new journey | The tutorial step advances, and later grids become larger | Exchanges outside the tutorial target are rejected; tutorial completion can be saved |
| M10 Progress saving and state cleanup | P1 | Advance a level, choose, return to menu, or continue | Restore the current level and choice path; new-level state is clean | Save failure does not crash the game; a new game is not blocked by an old completion panel or drag state |
| M11 Sound and scene music | P2 | Buttons, dragging, completion, or scene transition after the first interaction | Sound effects or music enhance feedback and emotion | Gameplay remains visually understandable in a muted environment |
| M12 Level/ending review and settings | P2 | Open an optional settings or review entry point | Adjust difficulty, replay stories, or view ending records | Omitting it does not affect the P1 main-story loop |
| M13 Creation or preview mode | P2 | Select a preview node or adjust grid parameters | Preview a specified node or grid | It is not part of the ordinary main story and should not block a normal new journey |

## Mechanics Coverage Matrix

| Mechanic | P1/P2 | Input coverage | State coverage | Visible feedback coverage | Progress/failure coverage |
|---|---|---|---|---|---|
| Loading and menu | P1 | Click start/continue | Loading, menu, and puzzle-in-progress are mutually exclusive | Buttons appear and the menu exits | Do not enter a blank puzzle before ready |
| Puzzle generation | P1 | Start a level, enter the next level | Current level, grid size, and piece arrangement are initialized | Scrambled illustration pieces are visible | Initially incomplete; old state is cleared |
| Drag feel | P1 | Mouse/touch press, move, and release | Dragging, release decision, and exchanging | Lift, follow, snap, and rebound | Invalid release does not advance progress |
| Direction causality | P1 | Drag left/right/up/down | Displacement maps to the corresponding grid direction | Preview matches screen direction | Opposite directions produce opposite results |
| Single-piece exchange | P1 | Valid drag release | Two positions swap and the move count advances | Target snaps and the displaced piece gives way | Repeated input during an animation is rejected |
| Merged block | P1 | Drag a contiguous block | Multiple pieces maintain their relative positions and move together | A contiguous image block lifts and lands | Crossing the boundary or an unsuitable shape rebounds |
| Merge detection | P1 | Triggered automatically after an exchange | Correct adjacency merges; broken relationships split | Highlight, boundary, or contiguous-image feedback | Incorrect relationships cannot appear as a complete block |
| Tutorial | P1 | Drag as prompted | Tutorial step and completion state | Highlight or gesture prompt | Non-prompted exchanges do not change the state |
| Completion and narrative | P1 | Click the next step after completing the puzzle | Puzzle completion, story display, and choice or continue | Celebration, image adjustment, and text/buttons appear | Puzzle is locked after completion |
| Branch choice | P1 | Click one of two choices | Choice is recorded and determines the next-level path | Current level fades out and a new level appears | Cannot choose before completion; choices are mutually exclusive |
| Multiple endings | P1 | Complete an endpoint level | Ending state and replay state | Independent ending image and description | Replay clears the old game |
| Save and restore | P1 | Return/continue after level advancement | Current level, choices, and tutorial completion | Continue entry point is visible | Save failure does not end the current playthrough |
| Sound and music | P2 | First interaction and key actions | Current scene audio state | Sound effects/music change | Cannot be the only gameplay feedback |
| Settings/preview | P2 | Optional menu or parameter entry point | Grid, node, or review state | Corresponding preview or setting changes | Cutting it does not affect the main story |

## State Design

Game states should include at least loading, main menu, puzzle in progress, narrative display after puzzle completion, branch choice, and ending display. The states are mutually exclusive: after entering puzzle-in-progress, no menu layer may remain to block the puzzle; after entering completion, choice, or ending, puzzle input is locked according to the rules.

Level transitions must reset the current pieces, merged blocks, drag preview, exchange animation, completion panel, choice buttons, and temporary feedback. Saved progress retains only the long-term information needed by the main story and does not save temporary drag or animation states that would block a new game.

## Content Pacing

Levels should begin with longing in the deep sea and progress through nodes such as the nighttime sea surface, an encounter aboard a ship, a storm rescue, a bargain with the sea witch, misunderstanding or recognition in the human world, and the sisters' life-or-death choice. Each node first completes a puzzle, then reveals a short story. Endings must cover at least five types: turning into sea foam, dark return, offering blessings from afar, missing a reunion, and leaving the kingdom with the prince.

Difficulty begins with a small-grid tutorial and gradually progresses to medium and larger grids. Larger grids should not merely increase the number of pieces, but should also reinforce the experience of "restoring fate" through merged-block movement, splitting, and path choices.

## P2 and Scope of Cuts

P2 may enhance level selection, an ending gallery, story review, tutorial replay, a move-count display toggle, adjustable grid difficulty, volume/mute settings, and a creation or preview mode. They are not necessary for ordinary players to complete the main story.

Explicit cuts: combat, health, timed failure, leaderboards, items, shops, character movement, and physical-collision levels are not required. Reuse of specific assets, specific copy, or specific music is not required; however, the daughter of the sea's fairy-tale journey, puzzle restoration, multiple-ending choices, and the loop of tactile puzzle interaction must be preserved.
