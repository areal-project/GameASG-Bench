# Park Pal Gameplay Requirements

## 1. Game Positioning

Park Pal is a portrait-oriented, top-down parking-unblocking puzzle game. Players observe the orientations and blocking relationships of multiple colorful vehicles in a grid-based parking lot, then click or touch vehicles to make them drive straight ahead or reposition along their own orientation, ultimately clearing the parking lot.

The game should maintain a relaxing, bright, low-frustration casual experience. Every valid click must provide clear sliding animation, departure feedback, and move-count progression; every invalid click must gently tell the player “it cannot move right now,” rather than making the player think the input failed.

## 2. Core Loop

1. Enter a level and see the parking-lot grid, vehicle orientations, remaining time, move count, and available actions.
2. The player selects a vehicle by clicking or touching it.
3. The game determines whether the vehicle is blocked by another vehicle ahead in the same row or column and whether it can reach the boundary.
4. When movement is possible, the vehicle slides along its orientation; if it can drive beyond the boundary, it leaves the playfield and disappears from the parking lot, otherwise it stops at a valid grid position before the obstacle.
5. When movement is impossible, the vehicle attempts to move in place, shakes, or emits brief feedback. The move is still recorded, and the situation is not incorrectly changed.
6. Once all vehicles have left the playfield, the level is complete, showing time used, moves, score, star rating, and paths to continue; when time runs out, the game enters a failure result and allows retrying or returning.

## 3. Levels and Playfield

P1 requires a set of progressively harder parking puzzles covering at least small, medium, and large grids, with the number of vehicles growing from a few in tutorial situations to many in crowded situations. The target content is 40 levels, primarily using grid sizes from 5x5 to 8x8, with vehicle orientations covering up, down, left, and right.

Each level consists of a square parking area and several vehicles. Each vehicle occupies one grid space and has a color and orientation; color distinguishes vehicles, while orientation determines the movement direction after a click. Vehicles do not need to be dragged, and players do not need to change vehicle orientations during normal play.

Levels must be completable: through a sequence of valid vehicle clicks, the player can eventually make every vehicle leave the playfield. Early levels should have a clear first move or tutorial prompt. Later levels create greater strategic depth through denser arrangements, longer blocking chains, and higher optimal move counts.

## 4. Input Semantics and Control Feel

The player's core input is clicking or touching the position occupied by a vehicle. Mouse clicks and touchscreen taps should be equivalent; touchscreen actions should prevent page scrolling or accidental background touches from causing incorrect state changes.

After a vehicle is clicked, it responds only to its own orientation, not the click direction. An upward-facing vehicle moves toward the top of the screen, a downward-facing vehicle moves toward the bottom, a left-facing vehicle moves toward the left side, and a right-facing vehicle moves toward the right side. The player does not specify a direction by dragging and cannot accelerate by holding continuously.

The feedback chain for a movable vehicle must be complete: after the click, the move count increases, the vehicle immediately enters a short sliding animation, and motion smoke or a similar effect may appear behind it. After the animation ends, the parking-lot state updates. If the vehicle can pass directly beyond the boundary, it should continue driving in the same direction, leave the screen, and disappear; if it is blocked by a vehicle ahead but still has space, it should slide to the nearest valid stopping position.

The feedback chain for an immovable vehicle must also be complete: after the click, the move count increases, the vehicle remains in its original grid position, and it gives a shake, brief smoke, slight vibration, sound effect, or equivalent visible/perceptible rejection feedback. A blocked rejection must not move the vehicle, remove the vehicle, or incorrectly trigger victory.

While an animation is in progress, the same vehicle or situation should not produce overlapping vehicles, vehicles passing through one another, duplicate removals, or move-count confusion. Subsequent input may be briefly ignored or queued, but the result must preserve an understandable rhythm of one vehicle and one movement, with the state updating after the animation completes.

## 5. Goals, Progress, and Win/Loss

The level goal is to clear all vehicles. Once all vehicles are cleared, the game enters the victory state, the timer stops, and the current level's moves, time used, score, and star rating are shown, along with paths to replay, return to level selection, or enter the next level.

The failure condition is the level timer running out. Once the timer reaches zero, normal vehicle actions should stop, a failure panel should appear, and the player should be able to retry the current level or return to level selection. After failure, old animations or old result layers that would block the next play attempt must not remain.

Each level should record the historical best move count, historical highest score, and best star rating. Completing the currently unlocked level unlocks the next level; after completing the final level, the player returns to level selection or remains on the completion result.

The score is based primarily on remaining time, while the star rating considers both move efficiency and completion speed. Fewer moves and a shorter completion time should give the player a better evaluation; performance below the target can still complete the level, but earns fewer stars and a lower score.

## 6. Menus, Modes, and Panels

The game should have a clear entry point after launch. New players can enter the first level directly and see tutorial guidance; returning players should be able to see the main menu and a total-score or progress entry point before entering level selection.

Level selection needs to show overall level progress, completed levels, currently playable levels, locked levels, and star-rating results. Locked levels should clearly be unavailable for selection; unlocked levels can be entered directly.

During play, the current level, moves, countdown, pause, restart, and hint controls need to be displayed. The pause panel should cover the game and stop the timer, providing paths to resume and return; after resuming, the timer continues from the paused point and should not deduct time spent paused.

The settings panel needs to let players toggle sound effects and music. Toggle feedback should be visible immediately; turning off music stops gameplay background music, while turning off sound effects stops feedback sounds for vehicle movement, blocking, victory, and similar events.

Leaderboards and total-score displays are P2 enhancements. If provided, they should show player high-score rankings, empty-board/loading-failure states, and a close path; an unavailable leaderboard should not block the main menu or level gameplay.

## 7. Hint System

P1 requires a usable hint button. A hint should mark a reasonable next vehicle in the current situation, generally through flashing, highlighting, a pointing gesture, or an equivalent visible method.

A hint must not move the vehicle for the player or change level progress. After using a hint, the system should enter cooldown; during cooldown, the button cannot take effect again and displays a waiting state. The button is restored after the cooldown ends.

If the current situation is already complete, has no available solution, has an animation playing, or the game is not in the playing state, the hint request should be gently rejected and must not change the move count, move a vehicle, or open an incorrect panel.

## 8. Visible Feedback and Atmosphere

The main gameplay screen should be a bright, top-down parking lot or road environment. Vehicles must be clearly distinguishable, with their orientation apparent from appearance or rotation. The parking area, vehicles, and result panels should remain readable and tappable at portrait phone sizes.

Vehicle movement should use smooth easing, and departing vehicles may fade out or continue driving away; blocking should provide brief failure feedback; victory should provide celebratory particles, star-rating animation, sound effects, or equivalent pleasant feedback. A prominent warning should appear when the countdown is close to running out.

Sound effects, vibration, and music enhance the experience, but cannot be the only feedback for understanding gameplay. Even when muted, players must be able to understand movement, blocking, victory, failure, pause, and hint states through visuals.

## 9. State Flow and Stability Rules

The basic state flow is: loading/main menu -> level selection -> playing -> pause or result -> retry/next level/return. Whenever an overlay panel is open, the parking lot underneath should not continue accepting normal vehicle clicks that would change the situation.

Restarting the current level must restore the level's initial vehicles, reset the move count to zero, clear hints and temporary animations, and restart the countdown. Returning to the main menu or level selection should stop the timer and background gameplay actions.

After victory or failure enters the result state, normal vehicle clicks must not continue changing vehicles on the playfield or the move count. Only explicit actions on the result panel, such as replay, next level, or return, may change the flow.

Saved progress should include unlocked levels, best move counts, best scores, and best star ratings. Clearing or resetting data is a P2 management capability and is not part of the normal player's primary path.

## 10. P2 and Scope Reduction

Optional P2 enhancements include: online leaderboards, a top-three preview on the main menu, a complete level editor, grid-size and vehicle-parameter adjustments in creator mode, creating new levels, duplicating/deleting vehicles, more vehicle sizes or types, more decorative particles, finer-grained haptics, and richer audio layering.

Scope reduction: the normal player version does not need to expose debug shortcuts, creator editing panels, external leaderboard service dependencies, unused large-vehicle gameplay, account systems, or real network submission. If these capabilities are absent, the core parking-unblocking gameplay, level progress, hints, timer, scoring, and menu loop must still be complete.

---

## GDD / Design Doc (merged from design-doc.md)

# Park Pal Design Doc

## 1. Design Pillars

Park Pal is a relaxing and bright portrait-oriented, top-down parking-unblocking puzzle game. The design goal is for players to clear a crowded parking lot by observing vehicle orientations, judging blocking relationships, and clicking vehicles in sequence.

The core experience consists of three pillars:

- Readable at a glance: vehicle colors, orientations, grid positions, remaining time, move count, and available actions must be clear.
- Every tap has clear cause and effect: after a vehicle is clicked, it responds only along its own orientation; whether it can move, is blocked, leaves the playfield, wins, or loses must all have directly visible feedback.
- Every round has an evaluation: after completing a level, the player receives time used, moves, score, star rating, and progress advancement; after failure, the player can retry.

## 2. MDA

### Mechanics

M1. Level parking lot: each level consists of a square grid, several single-cell vehicles, vehicle colors, and vehicle orientations. Levels gradually progress from small tutorial situations to more crowded medium and large situations, with orientations covering up, down, left, and right.

M2. Click-to-move vehicles: the player clicks or touches a vehicle. The vehicle does not move based on click direction and does not accept dragging to change its orientation; instead, it attempts to move in a straight line along its own orientation.

M3. Path and blocking determination: the same row or column ahead of a vehicle determines the movement result. If the path ahead leads to the boundary, the vehicle drives off the playfield and disappears; if there is an obstacle ahead but still some space, the vehicle slides to the nearest valid grid position; if there is no room to move, the vehicle stays in place and provides rejection feedback.

M4. Moves, time, and scoring: every vehicle click records a move. Levels have a countdown; upon completion, the timer stops, and a score and star rating are awarded based on remaining time and move efficiency.

M5. Win/loss loop: victory occurs once all vehicles have left the playfield; failure occurs when time runs out. Both victory and failure enter a result state, normal vehicle input stops, and the player may only replay, continue, or return through the result panel.

M6. Level progress: completed levels record best moves, highest score, and best star rating; completing the currently unlocked level unlocks the next level. Level selection shows completion, unlock states, and star-rating results.

M7. Hint system: during play, the hint button marks a reasonable next vehicle without playing on the player's behalf or changing moves or level progress. Hints have a cooldown; they are gently rejected outside gameplay, during animation, after completion, or when no valid hint exists.

M8. Menus and overlay panels: the game includes a launch entry point, level selection, pause, results, settings, and an optional leaderboard. While an overlay panel is open, the parking lot underneath must not continue accepting normal vehicle input that would change the situation.

M9. Audio and feedback settings: players can toggle music and sound effects. Toggle states should be visible immediately; after muting, it must still be possible to understand movement, blocking, victory, failure, pause, and hints through visuals.

M10. P2 depth and management capabilities: leaderboards, total-score previews, a complete level editor, creator mode, creating new levels, duplicating/deleting vehicles, more decorative particles, and richer audio layering are enhancements, not part of the normal player's primary path.

### Dynamics

The player first scans the grid, looking for vehicles with clear space ahead in their orientation or vehicles that can create space. One correct click reduces the vehicles on the playfield or changes the blocking chain, providing the immediate reward of a “clearer situation.” One incorrect click does not damage the situation, but increases the move count and provides a gentle rejection, prompting the player to reconsider.

As levels grow and more vehicles are added, the player needs to shift from identifying locally movable vehicles to planning a sequence: first move out vehicles near the boundary, then open blocking chains, and finally clear the remaining vehicles. The countdown adds light pressure to evaluating the situation, while moves and star ratings motivate players to optimize after completing a level.

Hints prevent players from becoming stuck, but only point out a candidate next move and do not complete the action for them. Hint cooldown prevents players from repeatedly relying on hints to skip the core observation and judgment.

### Aesthetics

The game should convey a relaxing, bright, low-frustration sense of unblocking a parking lot. Valid movement should be smooth and satisfying, with a rewarding sense of departure and move-count progression; invalid clicks should be clear but not punishing. Victory feedback should be pleasant, while failure feedback should allow a quick retry without creating high-pressure frustration.

## 3. P1 Core Loop Executable Trajectory

### P1 Main Loop: Clear the Parking Lot

1. Start/reset: the player enters a level from the launch entry point, or restarts the current level from failure/pause/results. The game displays the parking grid, vehicle orientations, remaining time, move count, pause, restart, and hint entry points; vehicles return to the level's initial layout, the move count resets to zero, and the countdown starts or resumes.
2. Player input: the player clicks or touches a vehicle. The input semantics are unrelated to the direction of the click point and mean only “try to make this vehicle move along its own orientation.”
3. Continuous state change: the game reads the vehicle's orientation and checks empty spaces, blocking vehicles, and the boundary ahead in the same row or column. The move count increases. If the vehicle can move, it immediately enters a short sliding animation; an upward-facing vehicle moves toward the top of the screen, a downward-facing vehicle toward the bottom, a left-facing vehicle toward the left side, and a right-facing vehicle toward the right side. If it can reach the boundary, the vehicle continues driving out in the same direction and disappears from the playfield; if it can only reposition, it stops at the nearest valid grid position ahead. After the animation completes, the parking-lot state updates, changing the blocking relationships accordingly.
4. Goal/risk: the player's goal is to clear all vehicles in a reasonable sequence. Risks come from an incorrect order, wasting moves by clicking blocked vehicles, rhythm disruption from repeated input during animation, and the countdown running out.
5. Reward/failure: a valid click rewards the player with vehicle sliding, departure, fewer remaining vehicles, an opening situation, and move-count feedback. An invalid click does not move or remove a vehicle and does not trigger victory; it only gives shaking, smoke, sound, vibration, or equivalent rejection feedback. Victory occurs after all vehicles have left the playfield; failure occurs when time reaches zero.
6. Progress/restart: victory shows moves, time used, score, star rating, and a path to continue, while saving the best performance and unlocking the next level. Failure shows paths to retry or return. Restarting clears old animations, hint states, and result layers, restores the current level's initial layout, and restarts the countdown.

### P1 Control-Feel Cause-and-Effect Chain

- Sustained input is not a core mechanic: vehicles do not accelerate from holding and do not change direction from dragging; a single click triggers one vehicle attempt.
- Directional cause and effect must remain stable: a vehicle's screen movement direction is determined by its orientation and cannot be inferred from the click position, finger-swipe direction, or nearest boundary.
- Valid movement must first show visible motion and then update to an understandable new situation; during animation, maintain one vehicle and one movement to avoid overlap, vehicles passing through one another, duplicate removals, and move-count errors.
- A blocked rejection must preserve the original situation, increasing only the move count and feedback; it cannot silently do nothing or incorrectly change a vehicle, level, or win/loss state.
- Benefits and limitations of special actions: a hint only marks a reasonable next move, with the benefit of reducing stuck situations; the cost/limitation is cooldown and rejection outside the playing state, and it does not automatically complete a movement.
- Risk connection: moves affect evaluation, time reaching zero causes failure, and overlay panels and terminal states lock normal vehicle input.

## 4. Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Readable level parking lot | P1 | Enter or restart a level | Grid, vehicles, orientations, remaining time, moves, and action entry points are visible | The primary path is not satisfied with an empty scene, indistinguishable orientations, or no HUD |
| M2 Click-to-move vehicle semantics | P1 | Click/touch a vehicle | The vehicle begins moving along its own orientation; click direction does not change movement direction | Dragging to reorient, moving left by clicking the left side, and holding to accelerate all violate the core semantics |
| M3 Path and blocking determination | P1 | Click a movable or blocked vehicle | A movable vehicle slides to a valid position or departs; a blocked vehicle gives rejection feedback in place | Passing through vehicles, overlap, removing a blocked vehicle, or providing no rejection feedback all break gameplay |
| M4 Moves, time, and scoring | P1 | Click continuously during play and complete a level | Moves are recorded with clicks, the timer advances, and score and star rating are shown after victory | Unchanged moves, timer not affecting failure, or evaluation disconnected from performance weakens the loop |
| M5 Win/loss loop | P1 | Clear the vehicles or let the countdown reach zero | A victory or failure result panel appears, and normal vehicle input stops | Moving vehicles after a terminal state or old animations blocking restart after failure is unacceptable |
| M6 Level progress | P1 | Complete an unlocked level and enter level selection | The next level unlocks; level selection shows completion and star rating/best performance | Freely entering locked levels or receiving no progress feedback after completion fails the progress loop |
| M7 Hint system | P1 | Click the hint button | The current situation highlights a reasonable candidate vehicle, and the button enters cooldown | A hint directly moving a vehicle, increasing moves, or taking effect repeatedly during cooldown is unacceptable |
| M8 Menus and overlay panels | P1 | Start, pause, resume, restart, return, result buttons | Screen states switch clearly; overlay panels prevent input to underlying vehicles | The panel being open while the underlying situation still changes, or pause not stopping the timer, is unacceptable |
| M9 Settings feedback | P1 | Toggle music/sound effects | Toggle state changes immediately, audio feedback obeys settings, and visual feedback remains understandable | Gameplay becoming incomprehensible when muted or toggles having no visible state is unacceptable |
| M10 Leaderboards/editors and other depth capabilities | P2 | Open a leaderboard or creator-related entry point | Shows rankings, empty-board/failure states, or a creation management flow | Must not block the main menu or normal levels; absence does not affect the P1 gameplay acceptance threshold |

## 5. Gameplay State Flow

Basic state flow:

Loading/launch entry point -> main menu or direct entry -> level selection -> playing -> pause or result -> retry/next level/return.

State rules:

- After loading completes, it must be possible to enter an interactive entry point; the game cannot remain on a blocking screen.
- Level selection can only allow unlocked levels to enter play; locked levels should clearly be unavailable.
- The playing state displays the HUD and allows vehicle clicks, hints, pausing, and restarting.
- The paused state stops the timer and covers the game; after resuming, it continues from the paused point without deducting time spent paused.
- Victory and failure states lock normal vehicle clicks and accept only explicit flow actions on the result panel.
- Restarting the current level restores the initial vehicles, move count, countdown, hint cooldown, and temporary animations.
- Returning to the menu or level selection stops the current level's countdown and underlying gameplay input.

## 6. Level And Progression Design

P1 levels need to form a completable difficulty progression:

- Target content: provide 40 levels, mainly using grids from 5x5 to 8x8.
- Tutorial/early levels: small grids, few vehicles, and a clear first move or tutorial guidance.
- Mid-game levels: more vehicles and mixed horizontal and vertical blocking chains, requiring the player to open space before moving vehicles out.
- Late-game levels: more crowded grids, longer blocking chains, and higher optimal move counts, encouraging the player to optimize the sequence.

Level-completion evaluation:

- The goal is always to clear all vehicles.
- Fewer moves and less time lead to a higher score, star rating, and best-performance record.
- Performance below the target can still complete the level, but with a lower evaluation.
- Historical records include unlocked levels, best moves, highest score, and best star rating.

## 7. Feedback Requirements

Vehicle and playfield feedback:

- Vehicle appearance or orientation must be sufficient to distinguish up, down, left, and right.
- Valid movement needs a smooth sliding animation, while departure needs to continue in the same direction or fade out.
- A blocked vehicle needs brief, gentle, visible or perceptible rejection feedback.
- A clear warning should appear when the countdown is close to running out.

Result and panel feedback:

- Victory shows moves, time used, score, star rating, and subsequent paths.
- Failure shows that time ran out and provides paths to retry/return.
- Hint highlighting must be visible and distinguishable from normal vehicle-selection or movement states.
- Settings toggles must immediately communicate their current states.

## 8. Mechanic Coverage Matrix

| Mechanic | P1/P2 | Core player promise | Required visible consequence | Notes |
|---|---|---|---|---|
| Parking grid readability | P1 | The player can understand the current situation | Grid, vehicles, orientations, and HUD are clear | Remains readable and tappable at portrait phone sizes |
| Vehicle tap action | P1 | Clicking a vehicle means trying to make it move along its orientation | Move count increases, and the vehicle moves or gives rejection feedback | Does not introduce dragging to turn or direction buttons |
| Direction causality | P1 | Orientation matches screen movement | Up/down/left/right correspond to screen up/down/left/right respectively | Core acceptance threshold for control feel |
| Blocking rules | P1 | Vehicles ahead block, while empty spaces allow movement | Stop at a valid grid position, depart, or reject in place | Vehicles cannot pass through one another or overlap |
| Completion | P1 | Clearing the parking lot completes the level | Victory panel, scoring, star rating, and progress saving | Normal input is locked after the terminal state |
| Timer failure | P1 | Running out of time causes failure | Failure panel, retry/return, and timer stops | Failure does not retain old blocking states |
| Restart | P1 | The player can retry the current level | Initial layout, moves reset to zero, countdown restarts | Clears temporary hint and animation states |
| Pause | P1 | The player can interrupt and resume | Panel covers the game, timer pauses, and resume restores play | Underlying vehicles cannot change while paused |
| Hint | P1 | Receive next-move guidance when stuck | A reasonable vehicle is highlighted, and the button enters cooldown | Does not move for the player |
| Level select/unlock | P1 | The player can see and advance through levels | Progress, unlocks, star ratings/best performance are visible | Locked levels cannot be selected |
| Settings | P1 | The player can control audio | Toggles provide immediate feedback; the game remains playable when muted | Visual feedback cannot depend on audio |
| Leaderboard/total score | P2 | The player can compare high scores | Rankings, empty-board/failure states, and a close path | Cannot block the primary path |
| Creator/editor tools | P2 | Creators can adjust level content | Clear editing, creation, or management entry points | Can be omitted from the normal player version |

## 9. Scope Boundaries

P1 must fully implement the loop for parking unblocking, level progress, hints, timer, scoring, menus, pause, settings, win/loss, and restart.

P2 may enhance leaderboards, total-score previews, editors, creator mode, more decorative particles, finer-grained haptics, and audio layering.

Scope reduction includes debug shortcuts, account systems, real network submission dependencies, strong external-service dependencies, creator panels unnecessary for normal players, unused large-vehicle gameplay, and management capabilities outside the primary path. When reducing this content, the P1 core parking-unblocking loop must not be weakened.
