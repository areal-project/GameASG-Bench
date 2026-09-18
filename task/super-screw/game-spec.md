# Super Screw Gameplay Requirements

## Gameplay Positioning

Super Screw is a 2D mechanical contraption disassembly puzzle game. On a portrait-oriented canvas, the player handles mechanical structures composed of multilayer parts, screws, and empty holes. By moving screws to change the fastening relationships, the player causes all parts to loosen and leave the contraption area. The core fun comes from judging the order of “which screw to remove first, and where to put it,” as well as the stress-relieving feedback produced when loosened parts swing, collide, and fall.

The game should prioritize ensuring a complete playable core loop: enter a level, observe the structure secured by screws, select a screw, choose a legal empty hole in which to place it, trigger a part to loosen or fall, gradually clear all parts, display victory, and enter the next level or replay.

## Player Goals and Progress

- P1: The goal of each level is to make all parts in the current contraption detach or disappear. The level is considered complete once the contraption has been cleared.
- P1: Levels should have progressively advancing progress. After completing a level, the player can enter the next level; if multiple levels have been completed, reentering the game should continue from an appropriate incomplete level or near the highest progress reached.
- P1: Level selection should allow entry only into the currently playable level and unlocked levels; locked levels should be shown as unavailable.
- P1: Restarting the current level should restore its initial screws, empty holes, parts, tool selection, hint state, and in-progress animations.
- P1: Undo should return to the state before the previous valid move; when there is no step to undo, it should not change the state and should give mild rejection feedback.
- P2: Leaderboards, player rankings, and long-term performance displays are enhancements; their absence must not affect the core puzzle flow.

## Core Input Semantics

- P1: The primary input is clicking or touching screws and empty holes in the level. Mouse and touch input should express the same player action.
- P1: When idle, clicking a visible screw should unscrew and lift it from its current position, putting it into a floating state awaiting placement.
- P1: While a screw is floating, clicking a legal empty hole should move the screw from its original hole to above the target empty hole, then screw it in and occupy that hole; the original hole becomes empty.
- P1: While a screw is floating, clicking its original hole should return the screw to its original position without producing a valid move.
- P1: While a screw is floating, clicking another screw should first return the current screw, then begin processing the newly clicked screw, preventing multiple screws from being manipulated simultaneously.
- P1: While a screw is floating, clicking a blank area or an invalid placement location should not change which hole owns the screw.
- P1: While animations such as unscrewing, moving, and screwing in are in progress, new level clicks should not interrupt them or cause overlapping operations.
- P1: The keyboard may provide convenient shortcuts for restarting, undoing, and canceling the currently floating screw; these shortcuts must not bypass normal puzzle rules.
- P2: Dragging a screw to a hole may be provided as an alternative interaction enhancement, but it is not required for the primary path; if provided, its result must be semantically consistent with “click the screw, then click the hole.”

## Interaction Feel and Visible Cause-and-Effect Chain

- P1: Immediate feedback when clicking a screw should include perceptible changes such as mechanical rotation, lifting, or particles/sound effects, making it clear to the player that the screw has been selected.
- P1: A floating screw should remain above its original hole and may show a slight waiting or swaying motion to remind the player that a placement location is being chosen.
- P1: After a legal empty hole is selected, the screw should move along an on-screen path to the target hole and display placement feedback as it drops in. The player should be able to see the causal relationship of “where it was removed from and where it was placed.”
- P1: When canceling or switching screws, the currently floating screw should return to its original hole rather than disappearing or jumping directly to a new position.
- P1: The effect of opposite choices should be determined by the target hole position: clicking different empty holes moves the screw in different screen directions and changes fastening relationships at different positions.
- P1: The benefit of placing a screw is unlocking or changing the forces on parts; the cost is occupying a new hole, which may block later placement paths or continue securing other parts.
- P1: Risk and failure are coupled through blocked holes and stuck states: an empty hole covered by a part cannot accept a screw, and an incorrect move order may temporarily leave the currently floating screw with no legal destination, requiring the player to undo, switch screws, use a hint, or use a tool.
- P1: When a part has only one screw left securing it, it should dynamically swing around the pivot, collide, or become stuck; once completely unsecured, it should fall under gravity and may collide with, bounce off, rotate around, or be blocked by remaining screws.
- P1: After a part leaves the playable area, it should disappear or be marked as cleared, accompanied by completion feedback such as particles, vibration, or sound effects.

## Level Structure and Puzzle Rules

- P1: Each level contains multiple empty holes, parts with screw holes, and several installed screws. Parts may overlap and occlude one another according to their layers, and the player must determine the disassembly order from the visible structure.
- P1: A screw can be placed only in a hole that is currently empty and not occluded by a moving part. A hole covered by the solid area of a part, blocked by a dynamic part, or outside the clickable hit area cannot be a valid target.
- P1: After a screw moves, the game should reevaluate which parts are still secured by screws. A part secured by multiple screws remains stable; a part secured by only one screw begins to swing or becomes blocked; a part secured by no screws begins to fall or flip.
- P1: Swinging or falling parts affect the availability of placement holes. If a moving part reveals or blocks an empty hole, legal targets should update accordingly.
- P1: When a part hits another screw, it should visibly be blocked, bounce, rotate, or tend to become stuck instead of passing through the screw.
- P1: Once all parts are cleared, the current level enters the victory state and normal level input is locked to prevent the state from being changed after victory.
- P2: More complex irregular parts, precise collisions, additional layers, and longer level chains are depth enhancements; P1 must include at least enough parts, screws, and empty holes to form a genuine order-based puzzle.

## Tutorial and Guidance

- P1: The first level should provide a brief beginner tutorial that prompts the player step by step to click a specified screw and then a specified empty hole until one complete move chain has been performed.
- P1: During the tutorial, clicking anything other than the current guided target should not advance the tutorial or change key puzzle state.
- P1: After the tutorial is complete, the guidance overlay should exit, allowing the player to operate independently in subsequent levels.
- P1: The hint button should highlight or indicate the currently available empty holes. If there is no target to hint, it should give rejection feedback without changing the state.
- P1: When a screw is floating with no legal placement hole and there is an obstruction that a tool could resolve, a gentle stuck-state prompt should appear, reminding the player to change strategy or use a tool.

## Tool System

- P1: The game should provide a powerful tool with a limited number of uses, allowing the player to directly knock away a visible part or remove its fastening influence when stuck.
- P1: The tool should have an obvious active state after being enabled; clicking a processable part should play impact feedback and consume one tool use, while clicking a blank area should cancel tool mode.
- P1: After the tool takes effect, the processed part should fall or be cleared, the related screw-fastening relationships should update accordingly, and other parts may be released in a chain reaction.
- P1: When tool uses are zero, the button should appear unavailable or show a recovery countdown, and clicking it should not trigger an effect.
- P2: Daily recovery, countdown prompts, and a first-use explanation bubble are experience enhancements; if provided, they must be consistent with the number of available uses.

## Interface and State Flow

- P1: After launch, the game should first display a start screen from which play can begin; after the player starts, the current level is entered and the start screen no longer occludes the playable area.
- P1: The level interface should include controls relevant to the current scope among current-level progress information, restart, undo, hint, tool, level selection, settings, and leaderboard entry.
- P1: The settings panel should at least allow background music and sound effects to be toggled; opening settings may block level input, and closing it restores the original level.
- P1: The victory panel should appear after level completion, provide choices to enter the next level and replay the current level, and display celebratory feedback.
- P1: The level-selection panel should show the available/locked state of every level; after an available level is selected, the panel should close and load that level.
- P1: If provided, the leaderboard panel should be openable and closable, and unavailability should be handled with failure feedback without disrupting the current level.
- P1: There is no requirement for separate pause gameplay; while any panel is open, it may be treated as temporarily blocking input, with the current state resuming after the panel closes.

## Failure, Rejection, and Stability Rules

- P1: This game does not use running out of moves as its primary failure condition. An incorrect order generally causes the puzzle to become stuck or inefficient rather than immediately failing.
- P1: Illegal clicks, occluded holes, blank clicks, repeated clicks during animations, clicks on targets outside the tutorial, no steps to undo, no hint targets, and insufficient tool uses should all be rejected or ignored while preserving the core puzzle state.
- P1: Each valid screw move should change only one screw's source hole and target hole; the total number of screws should not increase or decrease without cause unless a tool explicitly removes the associated fastening.
- P1: Restarting, changing levels, and continuing after victory should clear floating screws, hint highlights, tool activation, residual particles, and any currently playing victory effects.
- P1: In the victory state, normal level clicks should not continue moving screws or releasing more parts; the state can be exited only through explicit actions such as next level, replay, or level selection.

## Audio and Visual Feedback

- P1: Key events such as unscrewing, placement, illegal operations, parts falling, and victory should have clearly distinct sounds or visible alternative feedback.
- P1: The level view should be non-empty and readable, with sufficiently clear layering among screws, empty holes, and parts so the player can identify clickable objects and occluded areas.
- P1: Hints, highlights, tool activation, locked levels, victory, and rejection states must be expressed through the visible interface rather than only changing hidden state.
- P2: Rich backgrounds, character designs, confetti, leaderboard avatars, detailed particles, and additional audio are presentation enhancements; their absence should not affect core gameplay evaluation.

## Cut Scope

- Cut: Level creation, non-player shortcuts, and arbitrary creation tools are not part of P1 player-facing gameplay.
- Cut: Exact reproduction of specific images, audio, fonts, button styles, copy, or brand presentation is not required; the goal is to preserve visible gameplay, the feedback chain, and state flow.
- Cut: Online services are not required to be available. Progress, leaderboards, or tool recovery may be represented through local equivalents, but user-visible behavior must remain consistent.
- P2: If time is limited, the number of levels, leaderboards, and advanced visual particles may be reduced first, but the core loop of clicking screws, legal placement, part-release physics, undo/restart, hints/tools, and victory progression cannot be cut.

---

## GDD / Design Doc (merged from design-doc.md)

# Super Screw Design Doc

## Design Goals

Super Screw is a portrait-oriented 2D screw-disassembly contraption puzzle game. By observing the fastening relationships among multilayer parts, screws, and empty holes, the player moves screws from their current holes to legal empty holes, progressively releases parts, clears the contraption, and advances through levels.

The design focuses on a mechanical disassembly experience that is “relaxing but requires order-based judgment”: every click should let the player see the screw being removed, waiting for placement, moving toward the target hole, and fastening again, after which parts swing, become stuck, fall, or clear as fastening relationships change. Failure pressure comes primarily from blocked holes and stuck states rather than running out of moves.

## MDA

### Mechanics

- Click or touch a visible screw to unscrew and lift it into a floating state awaiting placement.
- While a screw is floating, click a legal empty hole to move the screw to the target hole and screw it in; the original hole becomes empty and the target hole becomes occupied.
- Click the original hole to cancel the move; when another screw is clicked, the currently floating screw returns first, then the interaction chain for the new screw begins.
- A legal empty hole must be empty, clickable, and not occluded by a moving or stationary part.
- After each valid move, reevaluate part fastening relationships: a part secured by multiple screws is stable, one secured by a single screw swings or is blocked, and one with no fastening falls, flips, or is cleared.
- Swinging or falling parts change hole availability and may collide with, bounce off, rotate around, or become stuck on remaining screws.
- Restart, undo, hints, the powerful tool, level selection, settings, and victory progression form the supporting systems.
- The first level teaches the complete “click the screw, then click the empty hole” chain through a guidance overlay and target prompts.

### Dynamics

- The player first observes the layered structure and looks for screws that can free hole positions or release key parts.
- After the selected screw floats, the player must determine which empty holes are currently available and which parts will be released or remain secured after placement.
- Moving a screw may release a part immediately, or may leave it with only one pivot and cause it to swing dynamically; part movement can in turn open or block subsequent hole positions.
- An incorrect order generally does not cause immediate failure, but it can reduce the number of legal holes, leave a screw with nowhere to go, or cause a part to be blocked by other screws, prompting the player to undo, restart, switch screws, view a hint, or use a tool.
- The tool provides an escape from stuck states, but its uses are limited; using it should consume a resource and update parts and fastening relationships accordingly.
- After a level is completed, normal level input is locked, and the player continues through next level, replay, or level selection.

### Aesthetics

- Stress relief: Unscrewing and screwing in, parts loosening and falling, and victory feedback should be clear and weighty.
- Cleverness: Through order-based decisions and hole management, the player can see how their choices affect the contraption structure.
- Experimentation: Screws can return after a click, and the player can undo or restart, allowing low-pressure experimentation.
- Mechanical authenticity: Parts cannot ignore fastening relationships or pass through screws; dynamic states must be mutually explicable with the visible structure.
- Light sense of progression: Level advancement, unlocking, and victory celebrations create a continuous challenge for the player.

## M-Features

| ID | Priority | Feature | Player Trigger | Observable Result | Failure / Invariant |
|---|---|---|---|---|---|
| M1 | P1 | Launch and level entry | Start the game from the start screen or load current progress | The start screen closes, and a readable level, current-level information, and an interactive contraption appear | After starting, the start screen must not occlude the playable area; the level must be non-empty |
| M2 | P1 | Screw selection and floating | Click a visible screw | The screw unscrews, lifts, and remains above its original hole, and legal empty holes can be identified | Ignore new level clicks during animations; multiple screws cannot float simultaneously |
| M3 | P1 | Legal empty-hole placement | While floating, click an unoccluded empty hole | The screw moves along an on-screen path and screws into the target hole; the original hole becomes empty and the target hole becomes occupied | Each valid move changes only one screw's source and target; the total number of screws is conserved |
| M4 | P1 | Cancel and switch screws | While floating, click the original hole, blank area, illegal position, or another screw | Clicking the original hole returns the screw; blank/illegal positions do not change the state; clicking another screw returns the first before processing the new target | Illegal clicks cannot change fastening relationships or consume a valid step |
| M5 | P1 | Part fastening relationships and physical release | Complete one valid screw move | According to remaining fastening points, parts remain stable, swing, become stuck, fall, or clear | Parts cannot pass through screws; dynamic parts affect subsequent hole availability |
| M6 | P1 | Level-completion loop | Clear every part in the current level | Victory feedback and the victory panel appear, and normal level clicks are locked | Screws cannot continue to move after victory; next level/replay/level selection are the ways to leave the victory state |
| M7 | P1 | Restart and undo | Click restart, undo, or the corresponding shortcut | Restart restores the level's initial state; undo returns to the state before the previous valid move | When there is no step to undo, preserve the state and give rejection feedback; restart clears floating screws, hints, tool activation, and animation residue |
| M8 | P1 | Tutorial and hints | Follow the guidance clicks in the first level; click hint | The tutorial highlights the specified target and advances only on the correct action; the hint identifies a currently available placement target or is rejected | Non-tutorial targets cannot advance the tutorial; no hint target means the state cannot change |
| M9 | P1 | Powerful tool | After activating the tool, click a processable part | The tool state is visible; after impact feedback, a use is consumed, the part falls or clears, and fastening relationships update | Insufficient uses or clicking blank space should not trigger an effect; the tool cannot violate screw/part state conservation |
| M10 | P1 | Level progress and selection | Next level after victory; open level selection and choose a playable level | Unlocked levels can be entered and locked levels appear locked; progress is saved to an appropriate level | Locked levels cannot be entered; changing levels must clear current transient state |
| M11 | P1 | Panels and settings | Open/close settings, leaderboard, or other panels | While visible, a panel blocks level input; after closing, the original state resumes | A panel cannot permanently occlude or disrupt the level; unavailable information must produce rejection or placeholder feedback |
| M12 | P2 | Presentation and long-term enhancements | Long level chains, leaderboards, recovery countdowns, rich particles/audio | Richer feedback, ranking, or long-term goals | Their absence does not affect the P1 core puzzle loop |

## P1 Core Loop Executable Trajectory

### Core Disassembly Loop

1. Start/Reset: The player enters the current playable level from the start screen, or clicks restart to restore the level's initial structure. The screen shows multilayer parts, installed screws, empty holes, level progress, and supporting buttons; no victory or settings panel occludes the playable area.
2. Player Input: The player clicks a visible screw. If the tutorial is still active in the first level, only the current guided target can advance it; non-target clicks are ignored.
3. Continuous State Change: The screw begins to unscrew and lift, entering the floating state. It remains above its original hole, while the game marks or keeps identifiable the list of legal empty holes in real time. New level operations are not accepted while the animation is in progress.
4. Player Input: The player clicks a target hole.
5. Continuous State Change: If the target hole is empty and not occluded by a part, the screw moves from the original hole along an on-screen path to the target hole, screws in, and occupies the target hole; the original hole becomes empty. If the player clicks the original hole, the screw returns; if the player clicks a blank area or occluded hole, the state remains unchanged; if the player clicks another screw, the current screw returns before the new screw interaction begins.
6. Goal/Risk: A valid move changes fastening relationships. The player's goal is to release all parts; risks include the target hole being occupied or occluded, a swinging part blocking a hole, or an incorrect order leaving the floating screw with no legal destination.
7. Reward/Failure: If the move releases a part, the part swings, collides, falls, or clears and provides feedback such as particles, vibration, or sound effects. If the move yields no benefit, the player retains the current state but may become stuck, requiring undo, restart, switching screws, viewing a hint, or using a tool; this game does not use running out of moves as its primary failure.
8. Progress/Restart: After all parts are cleared, victory feedback and next-level/replay entry points appear, progress advances, and subsequent levels unlock. Before completion, the player can continue disassembling, undo one step, restart the level, or switch to an unlocked level through level selection.

### Tool Escape Loop

1. Start/Reset: The player is in a level other than the first, or in a level where the tool is available, and the current state may be difficult to continue because of occlusion or blocked holes.
2. Player Input: The player activates the powerful tool.
3. Continuous State Change: The tool button or scene state visibly enters active mode; normal screw operations temporarily yield to tool selection.
4. Player Input: The player clicks a processable part, or clicks a blank area to cancel the tool.
5. Goal/Risk: The goal is to remove an obstruction or break a stuck state; the risk is that tool uses are limited, and a misclick cannot produce a benefit without cause.
6. Reward/Failure: When a processable part is hit, impact feedback plays, one tool use is consumed, the part falls or clears, and the related fastening relationships are released accordingly; a blank click cancels the tool, and insufficient uses produce rejection.
7. Progress/Restart: The new structure created by the tool returns to the core disassembly loop and may release more parts in a chain reaction; if the puzzle remains stuck, the player can undo, restart, or continue looking for a legal move.

### Victory and Progress Loop

1. Start/Reset: The current level still has at least one uncleared part.
2. Player Input: The player completes a series of legal screw moves or tool operations.
3. Continuous State Change: The final part loses its fastening and leaves the playable area, clearing the contraption.
4. Goal/Risk: The goal is to confirm the cleared state and end the level; the risk is that additional input after the victory state could corrupt the state.
5. Reward/Failure: The victory panel, celebratory feedback, and progress information appear; normal level clicks are locked.
6. Progress/Restart: The player chooses next level to enter a new contraption, or replays the current level to restore its initial layout; unlocked progress is retained.

## Source Core Loop Coverage

| Loop | M-feature | Priority | Start / Reset | Player Input | State Change | Goal / Risk | Reward / Failure | Progress / Restart |
|---|---|---|---|---|---|---|---|---|
| L1 Core disassembly | M1-M6 | P1 | Enter the current level or restart it | Click a screw, then click a legal empty hole | The screw unscrews, floats, moves, and screws in; part fastening relationships are reevaluated | Clear the parts; risks are blocked holes, occlusion, and stuck states | Parts swing/fall/clear; illegal targets are rejected | Next level after victory; before victory, continue, undo, or restart |
| L2 Cancel/switch | M2-M4 | P1 | A screw is floating | Click the original hole, blank area, illegal hole, or another screw | Return, no change, or switch to a new screw chain | Prevent mistaken operations from corrupting the state | Rejection feedback or return feedback | Return to the state awaiting an operation or continue processing the new screw |
| L3 Dynamic structure | M5 | P1 | A part fastening point has changed | Complete a valid move | Parts remain stable, swing, become stuck, fall, or clear; hole availability updates | Open subsequent paths through structural changes; the risk is moving parts occluding holes | Mechanical feedback and visible causality; collisions prevent penetration | Return to the core disassembly loop until cleared |
| L4 Tutorial/hint | M8 | P1 | First level or player requests a hint | Click the guided target or hint button | Guidance advances and the hint highlights legal targets | Teach the complete move chain; the risk is clicking the wrong target or having no target to hint | Correct actions advance; incorrect actions are rejected | Enter free play after the tutorial ends |
| L5 Tool escape | M9 | P1 | The tool has uses and the state is processable | Activate the tool and click a part | The part is struck, falls, or clears; uses decrease | Remove occlusion or a stuck state; the risk is exhausting uses | Visible impact and chain release; blank/no uses are rejected | Return to the core disassembly loop |
| L6 Progress panels | M6, M10, M11 | P1 | Level victory, or open level selection or settings | Next level, replay, select level, open/close panel | Level loads, progress saves, panel shows/hides | Continue the challenge without corrupting the current state | Unlocking and celebration feedback; locked levels are rejected | Enter the next level, replay, or resume the current level |
| L7 Long-term presentation | M12 | P2 | The core loop is playable | View the leaderboard or experience enhanced feedback | Rankings, particles, sounds, recovery prompts, and similar elements update | Increase retention and presentation quality | Enhances when available; unavailability cannot block the core flow | Does not affect P1 level progression |

## Mechanics Coverage Matrix

| Game Spec Area | Covered By | P1 / P2 | Design Coverage |
|---|---|---|---|
| Player goals and progress | M1, M6, M10 | P1 | Clear parts in each level, victory lock, next level/replay/unlocked level selection |
| Core input semantics | M2, M3, M4 | P1 | Click screw, click empty hole, original-hole cancel, blank/illegal rejection, switch screws |
| Interaction feel and visible cause-and-effect chain | M2, M3, M5 | P1 | Unscrewing, floating, moving, screwing in, and part swinging/falling remain continuously visible |
| Level structure and puzzle rules | M3, M5 | P1 | Multilayer parts, screws, empty holes, occluded holes, fastening relationships, and collision blocking |
| Tutorial and guidance | M8 | P1 | First-level target guidance, non-target rejection, hint highlighting, and no-target rejection |
| Tool system | M9 | P1 | Active state, click part to apply, consume use, blank cancellation, insufficient-use rejection |
| Interface and state flow | M1, M6, M10, M11 | P1 | Start screen, level UI, victory panel, level selection, settings/leaderboard panel blocking and restoration |
| Failure, rejection, and stability rules | M4, M7, M9, M11 | P1 | Illegal clicks, input during animation, empty undo stack, insufficient tools, input lock after victory |
| Audio and visual feedback | M2, M3, M5, M6, M8, M9, M12 | P1/P2 | Key events require sound or visible alternative feedback; advanced particles/rankings are P2 |
| Cut scope | M12 | P2 / Cut | No editor, online services, specific asset copy, or exact brand presentation required |

## State Flow

| State | Entry | Player Actions | Exit |
|---|---|---|---|
| Start screen | After launch | Start game | Current level active |
| Level awaiting input | Level load, return completed, valid move completed | Click screw, restart, undo, hint, tool, open panel | Screw unscrewing, panel blocking, victory, restart |
| Screw unscrewing | Click a visible screw | Wait for the animation to complete; other level clicks are ignored | Screw floating and awaiting placement |
| Screw floating and awaiting placement | Unscrewing completes | Click a legal empty hole, original hole, blank/illegal position, or another screw | Screw moving/screwing in, level awaiting input, switch chain |
| Screw moving/screwing in | Select a legal target or return | Wait for the animation to complete; other level clicks are ignored | Level awaiting input, and trigger part fastening relationship update |
| Dynamic part changes | A part swings, becomes stuck, falls, or clears | The player may continue operating when safe; dynamic changes affect hole availability | Level awaiting input or victory |
| Panel blocking | Settings, level selection, leaderboard, or another panel is open | Close, select an available level, replay, or next level | Return to the current level or load a level |
| Victory | All parts cleared | Next level, replay, level selection | New level active or current level restarted |

## Priority Boundaries

- P1 acceptance line: Entry from the start screen, at least one genuine order-based puzzle, clicking screws, legal empty-hole placement, occlusion rejection, part-release physics, level-completion victory, restart, undo, hints, tools, and a complete level-selection/settings-panel loop.
- P2 enhancements: More complex levels, more precise collisions, leaderboards and ranking displays, long-term recovery prompts, rich character presentation, additional particles, and audio layers.
- Cut: Level editing, non-player shortcuts, exact reproduction of assets/fonts/copy/branding, and hard dependencies on online services.

## Design Review Notes

- This document expands only the gameplay already defined in the prerequisite requirements document and adds no hidden gameplay.
- The P1 core loop retains click-based input, screw state changes, target-hole legality, part-motion physics, risk/rejection, victory progression, and restart/undo paths.
- The motion/physics mechanics retain the interaction's cause-and-effect chain: clicking causes unscrewing and floating, a legal target causes on-screen movement and screwing in, changes in fastening relationships cause swinging/collision/falling, and dynamic parts in turn affect subsequently available placement holes.
