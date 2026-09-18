# Perfecto Shot Gameplay Requirements

## Game Positioning

Perfecto Shot is a portrait-oriented physics-based slingshot puzzle game. In each level, the player controls one or more colored balls and uses a slingshot-style pull-back, aim, and release action to send the balls along predictable trajectories that are affected by collisions, ultimately getting all balls into baskets of the same color. The core fun comes from completing route planning, rebound-assisted shots, and precise landings with as few shots as possible.

## P1 Core Gameplay Scope

- Levels must contain visible balls, baskets of matching colors, fixed obstacles, ramps or platforms, and other route elements. A basket should appear as a catching container with boundaries and an opening, rather than as an ordinary target point.
- The player's goal is to send every ball in the current level into the basket of the corresponding color. Multi-ball levels must require all balls to be successfully basketed before the level is considered complete.
- Balls and baskets have a color-matching requirement. A ball entering a basket of the wrong color should not immediately count as a success; the level should remain incomplete and wait for the player to continue making adjustments.
- Ball movement must exhibit gravity, collision rebounds, rolling, or a tendency to gradually slow down. Obstacles, boundaries, and basket walls should alter the ball's route, producing observable bouncing, reversals, or resting behavior.
- Levels should support a gradual transition from simple tutorial-style layouts to more complex obstacle routes. P1 must cover at least several typical situations among single-ball straight-line/parabolic shots, rebound shots into baskets, ramp-assisted shots, and multi-ball or multi-basket matching.

## Controls and Causal Chain

- The player may begin aiming at a ball that has not yet entered a basket only while the game is in an interactive state. Clicking or touching near a ball selects it and enters the aiming state; clicking empty space or a ball beneath an end-state overlay should not launch it.
- Aiming uses slingshot semantics: the player drags backward from the ball's position, while the screen displays the stretch direction, a power indicator, and a predicted trajectory; upon release, the ball launches in the direction opposite the drag direction. Pulling back to the left should launch the ball to the right, and pulling back downward should launch the ball upward.
- The longer the drag distance, the greater the launch speed and predicted trajectory; after the feel-based upper limit is exceeded, the game should continue to convey a fully drawn state rather than increasing strength without limit. An extremely short drag or a click without dragging should cancel the launch and leave the shot count unchanged.
- After launch, the player cannot continue dragging the same ball while it is moving at high speed. The ball remains affected by gravity and collisions while airborne and while contacting surfaces; after landing on a surface, its horizontal speed should gradually decay so that the player can see the ball transition from high-speed bouncing to rolling or stopping.
- If the ball has not entered a basket but has stopped or nearly stopped, the level should return to an interactive state, allowing the player to shoot an incomplete ball again. Shooting again increases the shot count and uses the ball's current interactive position as the new starting point.
- Inputs in opposite directions must produce visibly opposite launch results: pulling back to the left and right of the ball should produce opposite horizontal motion, while pulling above and below the ball should produce opposite vertical tendencies. Upward shots should form a risk-reward relationship with gravity: they can clear obstacles, but may also fail because the power is insufficient or excessive.

## Visible Feedback

- An interactive ball waiting to be shot should have a clear draggable indicator that helps the player identify the currently interactive object.
- While aiming, the game must show real-time stretch feedback from the ball to the drag point, power intensity, and the predicted path. The prediction does not have to be perfectly precise, but it should match the initial direction and approximate arc after release.
- On launch, the ball should immediately be seen leaving its original position and moving in the predicted direction, then producing rebound or rolling feedback through walls, platforms, ramps, and basket walls.
- When the correct basket is hit, there should be clear success feedback, such as the ball resting in the basket, a change in basket state, a reward sound effect, or progression of the result sequence. When the level is complete, a completion panel, shot count, and star rating should be displayed.
- On failure, a failure panel should be displayed and explain that this failure occurred because the ball left the playable area. Retrying should clear the failure panel and restore the initial level layout.
- The top information area should always let the player see the current level progress and number of shots used. The shot count increases only after a valid release and launch; canceling aim, opening a menu, retrying, or selecting a level should not increment it accidentally.

## State Flow and Menus

- On first entering the game, a lobby or start screen is displayed, with a visible game theme and a sense of a dynamic background. After the player clicks Start, the first level begins and the main gameplay area should be directly interactive.
- Main level states include waiting to shoot, aiming, ball in motion, complete, and failed. While waiting to shoot, an available ball can be selected; while aiming, the player can cancel or release; while a ball is moving, the physics process is primarily displayed; the complete and failed states display their corresponding panels and prevent further accidental actions.
- Retry and pause/menu controls should be provided at the top. Retry resets the current level's balls, basket occupancy, shot count, and temporary feedback; the pause menu should allow the player to resume the game, open level selection, or return to the lobby.
- The level selection panel should list enterable level numbers or equivalent entry points. Selecting a level should close the panel and load the corresponding layout; closing the panel should return to the previously playable screen without leaving an overlay that blocks the main gameplay.
- After completing a level, the player can proceed to the next level; after completing the final level, the game should provide all-levels-complete feedback and a path back to level selection or the lobby.

## Win/Loss, Progression, and Rating

- The victory condition is that all balls in the current level have entered baskets of matching colors. Completing only some balls, entering the wrong color, or having balls still in motion must not result in victory.
- The failure condition is that a key ball leaves the bottom of the playable area or can no longer remain in the current level. After failure, the player must be able to retry the current level with one action.
- Level ratings are based on the shot count at completion and display one to three stars or an equivalent rank. Completing with fewer shots should earn a higher rating; exceeding the excellent-shot target should still allow level completion but with a lower rating.
- Progression should advance from tutorials, simple obstacles, ramps, two-ball layouts, multiple obstacles, pin arrays, or maze-like routes to high-difficulty precision shots. P1 may use a shorter but complete set of levels; P2 expands this into a complete 18-level pack.

## Rejected Paths and Rule Stability

- Before the game starts, or while the lobby overlay, pause panel, success panel, failure panel, or level selection panel is open, the main gameplay area should not receive launch inputs that change level state.
- Merely clicking a ball, not dragging, dragging too short a distance, dragging while the ball is moving, clicking a ball already in a basket, or clicking an unavailable area must not increase the shot count or alter the win/loss state.
- Entering a basket of the wrong color cannot satisfy that ball's objective. If a ball rebounds out of a basket or does not stably remain inside it, success should not be resolved prematurely.
- Continuing to click or drag after an end state should not alter the displayed result; only explicit menu actions such as Next Level, Retry, Level Select, or Return to Lobby can leave the end state.
- Retrying and switching levels must clear the previous attempt's temporary trajectory, result panel, failure state, ball motion state, and basket occupancy state.

## P2 Enhancements and Scope of Cuts

- P2: Expand into a complete long-form level pack, including more multi-ball and multi-basket layouts, pin arrays, narrow passages, rotating baskets, complex ramp combinations, and high-difficulty skill routes.
- P2: Add richer sound effects and background music, including feedback for launch, rebound, rolling, entering a basket, star rewards, and interface clicks. Without audio, P1 must still retain visual feedback.
- P2: Provide level editing capabilities, allowing balls, baskets, platforms, ramps, and hint text to be added or adjusted, and allowing editing objects to be selected, dragged, scaled, or rotated. The regular gameplay version may omit editing capabilities, but this must not affect the main gameplay.
- P2: Support customization of ball appearances or themed skins. If this capability is omitted, the default balls should remain clearly distinguishable and must not interfere with color matching.
- Scope cuts: Online sharing, account systems, leaderboards, paid shops, cloud synchronization of level saves, and external creation publishing workflows are not required.

---

## GDD / Design Doc (merged from design-doc.md)

# Perfecto Shot Design Doc

## Design Goals

Perfecto Shot is a portrait-oriented physics-based slingshot puzzle game. The player pulls back, aims, and releases to send colored balls into baskets of the same color; every shot requires a tradeoff among route prediction, power control, obstacle rebounds, and gravity risk. An acceptable experience is not simply clicking a target, but enabling the player to see bow-like charging, a predicted arc, continuous movement after launch, collision-driven redirection, basket-entry rewards, and quick retry after failure.

## MDA

### Mechanics

- **M1 Level Entry and Reset**: The game enters a level from a lobby or start screen with a theme and a sense of a dynamic background. Levels contain visible balls, baskets of matching colors, obstacles, platforms, or ramps. Retrying restores the current level's initial layout and clears the shot count, temporary trajectories, ball movement, basket occupancy, and result state.
- **M2 Slingshot Aiming Input**: While waiting to shoot, the player may select only an interactive ball that has not yet entered a basket. Holding near a ball enters aiming, and dragging backward displays the stretch direction, power indicator, and predicted path; upon release, the ball launches in the direction opposite the pull-back direction. A short drag or mere click cancels without increasing the shot count.
- **M3 Continuous Physics Motion**: After a valid release, the ball immediately leaves its original position and moves in the predicted direction, continuously affected by gravity, collision rebounds, rolling, and gradual deceleration. Walls, platforms, ramps, boundaries, and basket walls all change its route.
- **M4 Baskets and Color Matching**: Baskets are catching containers with boundaries and openings. A ball is considered complete only after it stably enters a basket of the matching color; a wrong color, grazing the basket, rebounding away, or failing to rest stably must not resolve success prematurely.
- **M5 Multi-Ball Completion Condition**: Multi-ball or multi-basket levels require all balls to enter their respective matching baskets before completion. When only some balls are complete, the level remains incomplete and allows the player to continue handling the remaining balls or shoot again.
- **M6 Shot Count and Star Rating**: Only a valid release increases the shot count. When a level is completed, a rating is displayed based on the shot count; fewer shots earn a higher rating, while exceeding the excellent target still allows completion but lowers the rating.
- **M7 Failure and Restart**: The level enters failure when a key ball leaves the bottom of the playable area or cannot remain in the current level. The failure panel communicates that the failure resulted from the ball leaving the playable area, prevents further accidental actions, and provides one-action retry.
- **M8 Menus and Blocking States**: While the lobby, pause, level selection, completion, or failure panel is open, the main gameplay area does not receive launch inputs that change level state. Pause allows resuming, selecting a level, or returning to the lobby; after completion, the player can go to the next level, select a level, or return to a higher-level screen.
- **M9 Level Progression**: P1 provides at least a short but complete set of progressive levels covering typical situations among straight-line or parabolic shots, rebounds, ramp assistance, and multi-ball or multi-basket matching. P2 expands this into a complete long-form level pack and more complex skill routes.
- **M10 Feedback and Assistive Presentation**: Interactive balls have clear indicators; aiming displays power and a predicted path; launch, rebound, rolling, correct basket entry, completion, failure, stars, and interface actions all have clear feedback. P1 must retain visual feedback; audio may be included as P2 or as an experience enhancement.
- **M11 Optional Editing and Appearance Depth**: P2 may provide level editing, object adjustment, skins, or themed appearances. The regular gameplay version may omit these capabilities, but the default levels, default balls, and color matching must remain clearly distinguishable.

### Dynamics

- The player first observes the balls, baskets, obstacles, and feasible routes, then uses a pull-back vector to determine launch direction and power.
- The longer the pull-back, the stronger the predicted path and the higher the initial speed after release; once the feel-based limit is reached, continued dragging only appears fully drawn and should not increase power without limit.
- The pull-back direction and launch direction form a clear inverse causal relationship: pulling back to the left makes the ball launch to the right, while pulling back downward makes it launch upward. Opposite inputs should produce opposite trends in on-screen movement.
- After launch, the player cannot continue dragging the same ball while it is moving at high speed, and can only observe the physics outcome. When the ball stops or nearly stops without completing, the level returns to an interactive state and allows another shot from the current interactive position.
- Upward-shot routes form a risk-reward relationship with gravity: sufficient power can clear obstacles or reach a higher landing point, insufficient power causes the ball to fall back or hit an obstacle, and excessive power may send it out of bounds or past the basket.
- Obstacles and basket walls are not decorations; through bouncing, reversals, rolling, or resting, they should alter the route and make rebound-assisted movement a means of solving the puzzle.
- Paths such as entering the wrong-color basket, failing to enter a basket stably, continuing to click after an end state, or dragging beneath an overlay should all be rejected or leave state unchanged, preventing the core gameplay from being reduced to simply clicking a target.

### Aesthetics

- **Sense of Precision**: The player can understand their shot choice through the prediction line and power feedback.
- **Physical Satisfaction**: The ball's bouncing, rolling, deceleration, and resting in a basket make the route outcome believable.
- **Friendly Trial and Error**: Failure and misses both allow quick retry or another shot without interrupting the relaxed pace.
- **Puzzle-Solving Accomplishment**: When a rebound or multi-ball route is completed with few shots, the star rating and completion feedback reinforce the reward of a “beautiful route.”
- **Clarity**: Ball colors, basket colors, interactive state, shot count, level progress, and end state must always be distinguishable.

## P1 Core Loop Executable Traces

### Loop A: Slingshot a Single Ball into a Basket

1. **Start/Reset**: The player clicks Start in the lobby to enter the first level, or clicks Retry to restore the current level. The scene displays one interactive ball, a basket of the matching color, a platform or boundary, a shot count of zero, and an interactive main gameplay area.
2. **Player Input**: The player holds near the ball to enter aiming and pulls back in the direction opposite the target. The screen displays stretch feedback, a power indicator, and a predicted path; if the player only clicks or drags too short a distance, aiming is canceled and the shot count remains unchanged.
3. **Continuous State Change**: After the player releases a valid drag, the shot count increases and the ball launches in the direction opposite the pull-back direction. The ball then falls under gravity, and after colliding with a wall, platform, ramp, or basket wall, it rebounds, reverses, rolls, and gradually slows down.
4. **Goal/Risk**: The goal is to make the ball stably enter a basket of the matching color. Risks come from insufficient power, excessive power, an incorrect angle, collision-driven redirection, missing the basket, or leaving the bottom of the playable area.
5. **Reward/Failure**: When the ball stably enters a matching basket, basket-entry success feedback appears, and after all objectives are complete, the completion panel, shot count, and star rating are displayed. When the ball leaves the bottom of the playable area, a failure panel is displayed.
6. **Progression/Restart**: After completion, the player enters the next level or level selection; after failure, the player clicks Retry to clear the panel and restore the initial layout; when the ball stops without entering a basket, the player can pull back and shoot again from its current interactive position.

### Loop B: Rebound and Ramp Routes

1. **Start/Reset**: The player enters a level with platforms, walls, ramps, or complex basket angles, where the basket is not an ordinary target point that can be reached directly.
2. **Player Input**: Based on the obstacle layout, the player pulls the ball back and selects an approximate direction and power that can first hit a wall or ramp and then enter the basket.
3. **Continuous State Change**: After release, the ball moves in the predicted direction and rebounds after hitting an obstacle or rolls along a ramp; speed and rotational tendencies gradually decay, and the route may be further altered by basket walls.
4. **Goal/Risk**: The goal is to use a rebound or ramp to alter the route and enter the correct basket. Risks include an unsuitable rebound angle, insufficient or excessive speed decay, the ball stopping on a platform, rolling out of the playable area, or entering the wrong location.
5. **Reward/Failure**: A correct route provides basket-entry feedback and advances the result sequence; a failed route either allows another shot after the ball stops, or enters the failure panel when it goes out of bounds.
6. **Progression/Restart**: After completion, a more complex layout is unlocked or entered; if incomplete, the player can continue trial shots; after failure, the current level can be retried.

### Loop C: Multi-Ball/Multi-Basket Matching

1. **Start/Reset**: The player enters a level containing multiple balls or multiple baskets, with each ball forming a target relationship with the basket of its corresponding color.
2. **Player Input**: While waiting to shoot, the player selects an interactive ball that has not entered a basket and pulls back to aim. A ball already in a basket, a moving ball, a ball beneath an overlay, or an unavailable area cannot trigger a valid launch.
3. **Continuous State Change**: Each valid release propels only the selected ball; other balls, basket occupancy states, and the shot count continue to follow the same rules. After a ball stops, the player can continue handling the remaining targets.
4. **Goal/Risk**: The goal is to get all balls into baskets of matching colors. Risks include color mismatches, completing only some objectives, one ball obstructing a later route, or extra shots lowering the star rating.
5. **Reward/Failure**: A single ball entering the correct basket provides partial success feedback, but the level completion display appears only when all objectives are complete; a wrong color or partial completion cannot resolve victory.
6. **Progression/Restart**: After all objectives are complete, the player proceeds to the next level or higher difficulty; if a route fails but the ball remains in play, the player can continue shooting; if the failed state is entered, retrying clears all temporary states.

## State Design

| State | Player Actions | Visible Result | Stable Rules |
|---|---|---|---|
| Lobby/Start | Start the game, enter a level | Themed interface, sense of a dynamic background, and visible start entry point | Main gameplay input does not change level state |
| Waiting to Shoot | Select an interactive ball that has not entered a basket | The ball has a draggable indicator; the HUD shows the level and shot count | Selecting a ball alone does not increase the shot count |
| Aiming | Drag, cancel, or release | Stretch feedback, power indicator, and predicted path change in real time | Short drags cancel; direction and power feedback must correspond to the release result |
| Ball in Motion | Observe the physics process | The ball flies, rebounds, rolls, slows down, and may enter a basket or go out of bounds | A ball moving at high speed cannot be dragged; the shot count does not increase repeatedly |
| Complete | Next level, retry, select a level, or return to lobby | Completion panel, shot count, and star rating | End-state clicks do not change the result; only explicit menu actions leave it |
| Failed | Retry or take a return-to-menu path | A failure panel communicating the out-of-bounds or departure reason | Main gameplay input is blocked after failure; retry clears the failed state |
| Pause/Level Select | Resume, select a level, close, or return to lobby | A panel is displayed and blocks the gameplay area | After closing, no overlay may remain that blocks the main gameplay |

## Mechanism Coverage Matrix

| M-feature | Priority | Player Trigger | Observable Result | Failure/Rejection/Stability Rule |
|---|---|---|---|---|
| M1 Level Entry and Reset | P1 | Start, retry, select a level | Level layout is restored; shot count and temporary feedback are cleared | Retry must not retain the end-state panel, motion state, or basket occupancy |
| M2 Slingshot Aiming Input | P1 | Hold a ball and pull back, then release | Stretch feedback, power indicator, predicted path; launches in the opposite direction after release | Clicking empty space, a mere click, a short drag, or input beneath an overlay does not launch or count |
| M3 Continuous Physics Motion | P1 | Valid release | The ball continuously flies, falls, rebounds from collisions, rolls, and slows down | Static teleporting, instant basket entry, or no collision feedback does not satisfy the core experience |
| M4 Baskets and Color Matching | P1 | Make a ball enter a basket | Success feedback after a correct-color ball stably enters a basket | A wrong color, grazing, rebounding away, or lack of stability cannot resolve completion |
| M5 Multi-Ball Completion Condition | P1 | Handle multiple objectives in sequence | Each ball completes locally; the end state occurs only after all complete | Completing only some balls must not produce victory |
| M6 Shot Count and Star Rating | P1 | Valid release and level completion | The HUD shot count increments, and the completion panel displays a rating | Canceling, menu actions, retrying, or selecting a level do not increment it accidentally; more shots lower the rating |
| M7 Failure and Restart | P1 | Retry after the ball leaves the bottom of the playable area | The failure panel appears and communicates the departure reason; retry restores the initial state | Continuing to drag after failure must not change the result |
| M8 Menus and Blocking States | P1 | Open pause, level selection, completion, or failure panel | The panel is displayed, preventing accidental gameplay actions; interaction is restored after closing | No blocking layer may remain after the panel closes |
| M9 Level Progression | P1/P2 | Complete a level and enter the next level or select a level | Levels progress from simple to complex, introducing rebounds, ramps, multiple targets, and other situations | P1 may use a short level pack; a complete long-form level pack belongs to P2 |
| M10 Feedback and Assistive Presentation | P1/P2 | Aim, launch, collide, enter a basket, complete, fail | Visual feedback is clear; sound effects may enhance it | P1 cannot have only numerical changes without visible feedback |
| M11 Optional Editing and Appearance Depth | P2 | Edit objects, adjust layouts, select skins or themes | Visible object or appearance changes | Regular gameplay may omit these, but must not compromise default levels or color recognition |

## P1 Qualification Threshold

- The player can enter an interactive level from the start screen, and can retry or continue to the next level.
- The main controls must preserve the slingshot feel: pull back to charge, release to launch in the opposite direction, power affects initial speed, short drags cancel, and opposite inputs produce opposite visible motion.
- After launch, there must be a continuous physics process, including gravity, collision rebounds, rolling or a deceleration tendency, and route interaction with obstacles and basket walls.
- Victory must result from all target balls stably entering baskets of matching colors; failure must be triggerable by risks such as going out of bounds, and retry must restore the state.
- The HUD and panels must synchronously show the level, shot count, completion, failure, star rating or equivalent rating, and overlay states must not allow the main gameplay to receive input accidentally.
- The P1 level pack may be short, but it must cover at least several types of typical routes: direct or parabolic, rebound, ramp-assisted, and some combinations of multi-ball or multi-basket matching.

## P2 Depth and Scope Cuts

- A complete long-form level pack, pin arrays, narrow passages, rotating baskets, complex ramp combinations, and high-difficulty skill routes belong to P2 depth.
- Richer sound effects and background music belong to P2 enhancements; without audio, P1 must still communicate the same gameplay results through visual feedback.
- Level editing, object adjustment, skins, or themed appearances belong to P2; online features, accounts, leaderboards, paid shops, cloud synchronization, and external publishing workflows may be omitted.
