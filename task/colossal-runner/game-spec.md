# Colossal Runner Game Spec

## Requirements Overview

Colossal Runner is a third-person 3D endless runner game. The player starts running from the menu or a loading-complete entry point. The character automatically moves forward, while the player uses the keyboard or touch swipes to switch among three on-screen lanes, jump, and slide. The goal is to collect coins, avoid obstacles and moving threats on an ever-changing track, and run as far as possible. The game must provide a readable main 3D scene, HUD, a short opening or an immediate start, settings, failure, revive, and restart flows.

## Gameplay Requirements

### P0 Basic Experience

- After the game launches in the browser, it should display a visible main 3D scene or loading screen, and provide a start entry point after loading is complete.
- After starting, the HUD displays distance and coins, and blocking start/loading/end screens must be hidden. If there is a short opening chase or camera sequence, it must automatically advance to the playable state and must not block main-track input indefinitely.
- The character continuously runs forward automatically, and distance increases over time; progress continues even without input, but must be constrained by collisions, terrain, or terminal-state rules.
- The main scene must be a readable 3D runner space: the player character, track, lanes, obstacles, coins, and the environment ahead must be distinguishable on screen; a HUD-only view or static background cannot be used as a substitute.

### P1 Core Controls

- Lanes: the track contains three runnable lanes—left, center, and right—and the character starts in the center lane by default. The player presses the left/right arrow keys, A/D, or swipes left/right on the screen to trigger one lane change.
- Screen-direction semantics must be clear: a screen-left swipe or leftward input should move the character on screen to the adjacent available lane on the left; a screen-right swipe or rightward input should move the character to the adjacent available lane on the right. If the camera projection uses reversed world coordinates, the final presentation must still ensure that the screen direction seen by the player is correct.
- Lane changes at the boundaries must not move beyond the three lanes. Continuing to move left while already in the leftmost lane, or right while already in the rightmost lane, should be rejected or create a boundary-collision/stun risk, but must not move the character off the track.
- Jump: when the player presses the up arrow, W, Space, or swipes upward, the character should leave the ground and clear low- to medium-height obstacles, ramp edges, and drops between train roofs. Jumping again in midair may take effect only within an allowed buffer window or after landing; infinite consecutive jumps are not allowed.
- Slide: when the player presses the down arrow, S, or swipes downward, the character enters a low posture briefly to pass beneath obstacles with overhead clearance. Swiping down in midair should make the character descend rapidly to the ground and transition into a slide; it must not become infinite flight.
- Control feedback: lane changes, jumps, and slides must each be reflected through the character's visible action, screen position, posture, or HUD/status indication.

### P1 Runner Loop

- Coins, obstacles, trains/large blockers, low-clearance passages, jump obstacles, slide obstacles, ramps, and higher-difficulty sections are generated or arranged ahead on the track according to distance.
- Coins are collectibles. After the character's collider overlaps a coin, the coin disappears from the scene, the coin count increases, and the HUD updates accordingly. A single coin cannot be collected repeatedly during the same run.
- Obstacles have different traversal methods:
  - Low or ground obstacles must be jumped over.
  - Elevated crossbars, low passages, and stacked blockers must be passed by sliding.
  - Trains or large obstacles can be avoided by changing lanes, jumping onto safe surfaces above them, using connected ramps, or taking another visible safe path.
  - Some large obstacles span two lanes, requiring the safe lane to be identified; a head-on collision causes failure, while a graze or side collision may cause a stun.
- A giant two-lane blocker should clearly occupy two lanes before the player reaches it and leave at least one visible safe lane. A player who moves into the safe lane in advance should continue running; charging head-on into the core of the blocker should cause failure; grazing it or being squeezed back onto a safe route may cause a brief stun instead of directly granting a reward.
- The character enters a failure state upon hitting a lethal obstacle, moving threat, or oncoming train head-on. After failure, running stops, input is locked, the HUD is hidden or deemphasized, and terminal actions are displayed.
- When the character grazes a wall, train, or special obstacle, the character may enter a short stun/injured state; another collision while stunned should cause failure. The stunned state needs visible feedback, such as screen shake, a status indicator, an effect above the character's head, or a pursuing threat.
- Advancing distance should produce observable progress changes. Endless mode does not need a fixed finish; if the game includes a fixed practice track, reaching the finish should display a completion screen and allow a restart.
- As distance increases, speed may rise in stages and be conveyed through the HUD, short prompts, character animation speed, or scene movement speed.

### P1 State Flow

- States include at least: loading/menu, playing, paused/settings, gameover, complete, or an equivalent terminal state.
- Start: after the player clicks the loading-complete or start entry point, the game enters a short opening or goes directly to playing; after the short opening ends, it must enter playing. The start/loading overlay must no longer block the track.
- Failure: the terminal screen must provide a restart entry point; if there are enough coins and the revive limit has not been reached, it displays a revive entry point and cost information.
- Restart: restarting after a terminal or completion state should clear the current run's transient state, return the character to the center lane, and reset the distance and coins for the current run to zero. Temporary effects such as old obstacle collisions, stun, slide, jump, and revive shield must not remain.
- Settings: a settings panel can be opened during playing to adjust music, sound effects, and volume. The settings panel may block track input while open; after it is closed, the game must return to the previous playable state without resetting the current run.

### P2 Depth Systems

- Revive economy: at the terminal state, if the player has enough coins, the player can spend coins to revive and continue running from a short safe distance ahead of the failure point. The number of revives per run is limited, and the revive cost increases with each use. A short shield should be granted after reviving so the same obstacle does not immediately cause another failure. When coins are insufficient or the limit has been reached, the revive must be rejected, with the coin amount and revive count unchanged.
- Dynamic track: track segments progress from easy to difficult in stages, avoiding prolonged repetition of the same form; at greater distances, more complex obstacle combinations, moving threats, and giant obstacles are introduced.
- Save/leaderboard: the game may save the best distance and, upon failure, attempt to submit the current run's distance to a leaderboard or local record. The terminal screen should visibly present at least one of the current run's distance, best distance, or a leaderboard/no-ranking summary. This feature must not affect core single-player playability; it should degrade gracefully when network or platform capabilities are unavailable.
- Audio: music and sound effects can be toggled and their volume adjusted; events such as collecting coins, swiping, jumping, collisions, failure, and speed stages may have corresponding feedback. Muting audio should not prevent the game from running.
- Visual presentation: the opening may include a brief chase, rolling threat, or shot of rushing out through a doorway, and the distant sky and scenery may change with distance. The presentation must have a finite duration; if track input is temporarily unavailable during the sequence, the HUD or visuals must still let the player understand that the running state is being entered, and normal controls must resume after the sequence ends.
- Editing/preview tools are out of scope and are not player-required features of the generated target.

## State Requirements

- `loading/menu`: displays branding/loading/start entry, optionally with progress. The player cannot accidentally trigger track actions.
- `intro/opening`: optional short opening or chase sequence; the character and threat may be visible, and distance may begin advancing; it enters playing after the sequence ends and cannot block input indefinitely.
- `playing`: the character automatically moves forward, the HUD is visible, and the main track is interactive. Input changes the lane, posture, or jump state.
- `settings`: the settings panel is displayed and can be closed by the player; the current run's distance, coins, lane, and transient state are preserved.
- `gameover`: running stops, and player input no longer changes the track state; displays the failure reason, restart entry point, and optional revive entry point.
- `complete`: displays a completion screen when a fixed track is completed; endless mode may omit fixed completion but must retain failure and restart.
- `revived`: after reviving, returns to playing, coins decrease, the revive count increases, and the character returns to a safe position with brief protection.

## Completion Criteria

- P0: the page has no fatal errors, can enter the 3D runner scene, and has usable HUD and start/terminal UI.
- P1: the player can use actual keyboard and touch/pointer input to change lanes left and right, jump, and slide; distance increases while running, coins can be collected, obstacles can cause a stun or failure, and the player can restart after failure.
- P2: the revive economy, speed stages, dynamic difficulty, giant two-lane blockers, short opening presentation, settings, save/leaderboard fallback, and audio feedback work according to the rules above.

---

## GDD / Design Doc (merged from design-doc.md)

# Colossal Runner Design Doc

## MDA

### Mechanics

M1. 3D launch and UI flow: the loading/start entry point leads to playing, the HUD displays distance and coins, and blocking layers are hidden correctly.  
M2. Automatic forward movement and distance progression: the character continuously moves forward on a three-lane track, distance increases over time, and speed may increase by distance stage.  
M3. Screen-direction lane changing: keyboard and swipe input move the character to an adjacent lane according to screen-left/right semantics, and boundary input does not cross the bounds.  
M4. Jumping: upward input makes the character leave the ground and traverse obstacles or height changes that require jumping; infinite consecutive midair jumps are not allowed.  
M5. Sliding and transitioning into a slide from midair: downward input puts the character in a brief low posture to pass through low passages or beneath elevated blockers, and a midair downward swipe lands and transitions into a slide.  
M6. Coin collection: after the character overlaps a coin, the coin disappears, the coin count and HUD increase, and it cannot be counted repeatedly.  
M7. Obstacles and failure: different obstacles require a lane change, jump, or slide; a lethal collision enters the terminal state and locks track input.  
M8. Stun and second collision: a graze or light collision enters a brief danger state, another collision causes failure, and visible feedback is provided.  
M9. Revive economy: coins can be used to revive at the terminal state, with increasing cost, limited uses, rejection when coins are insufficient, and a short shield after revival.  
M10. Restart and completion: the game can be restarted after failure/completion, clearing the current run's transient state and returning to the initial running conditions.  
M11. Settings and audio: settings can be opened/closed during playing to toggle music and sound effects and adjust volume without disrupting the current run.  
M12. Track progression and depth: greater distances unlock more complex track segments, moving threats, giant obstacles, and speed stages.  
M13. Save/leaderboard fallback: the terminal state can display the current run's distance, best distance, or a leaderboard summary; the core game continues when external services are unavailable.  
M14. Giant two-lane blockers: large blockers occupy two lanes and leave a readable safe lane; the safe route continues the run, a head-on collision causes failure, and a graze may cause a stun.  
M15. Short opening and pursuing threat: the opening may include a finite chase or rolling-threat sequence, followed by normal playing without blocking core controls for an extended period.

### Dynamics

- The player reads lane risks ahead and chooses to change lanes, jump, or slide, avoiding hazards under the time pressure of automatic forward movement.
- Coins encourage risky routes and form a resource loop of "risking collection/continuing the run" with the revive system.
- Speed increases and more complex track segments add reaction pressure, making long-distance scores a long-term goal.
- A stun provides one buffer for a nonlethal error, but a second error causes immediate failure, creating a clear risk window.
- Giant two-lane blockers force the player to read the safe lane in advance instead of making only a single reaction within the current lane.
- The short opening brings the player into an escape scenario, but its pacing serves the runner gameplay and does not replace the core controls.

### Aesthetics

- Sense of speed: the ground, buildings, trains, giant obstacles, and camera follow reinforce forward motion.
- Readability: lanes, obstacle heights, coins, and safe paths must be clear within the player's reaction time.
- Arcade feedback: collection, jumping, sliding, collisions, speed increases, and terminal states must all have clear feedback.
- Sense of scale: giant blockers, pursuing threats, and distant scenery changes reinforce the "colossal chase" theme, but the safe route must always be clear.

## Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Enter playable state | P0/P1 | Click the loading-complete/start button | HUD visible, main 3D scene non-empty, overlay does not block the track | Failure if a blocking layer still blocks input while running |
| M2 Automatic forward movement | P1 | Wait briefly after starting | Distance increases, scene/character advances relative to the frame | Distance should not continue advancing during gameover/settings |
| M3 Change lanes left/right | P1 | Left/right arrow keys, A/D, left/right swipes | The character's screen position moves toward the corresponding adjacent lane, and its lane changes | Boundary input does not cross bounds; left and right input directions should be opposite |
| M4 Jump | P1 | Up arrow, W, Space, or upward swipe | Player height rises and then falls, with synchronized posture feedback | Repeated midair input cannot stack height indefinitely |
| M5 Slide | P1 | Down arrow, S, or downward swipe | Posture becomes lower and recovers after a short duration | The sliding state cannot remain stuck permanently; input causes no change during settings/terminal state |
| M6 Coin collection | P1 | Run through coins after taking a valid coin route | Coin count increases, visible coin count decreases, and HUD updates accordingly | The same coin in the scene can become a player coin only once and cannot be counted repeatedly |
| M7 Obstacle failure | P1 | After a valid obstacle setup, collide or pass with the wrong posture | Enters gameover, terminal screen visible, input locked | Continuing to press keys after the terminal state should not change distance/coins/lane |
| M8 Stun | P2 | Graze/boundary collision/special light collision | Stun feedback appears, with a brief danger window | A second collision becomes failure; a stun does not directly add score |
| M9 Revive | P2 | Click revive at the terminal state when there are enough coins | Coins decrease by the cost, returns to the running state, moves back to safety, and gains a short shield | Rejected when coins are insufficient or uses are exhausted, with resources unchanged |
| M10 Restart | P1 | Click restart after terminal state/completion | Distance, coins, and current-run state reset, HUD visible, character returns to the center lane | Old terminal state, stun, shield, slide, and obstacle hit do not remain |
| M11 Settings | P2 | Click settings, toggle audio, close | Settings panel opens/closes, audio preferences change, and the current run continues | Closing settings should not reset distance/coins |
| M12 Depth progression | P2 | Run past stage distances or enter a valid long-distance state | Speed stage/difficulty/moving threats/giant obstacles become visible | Stage progression cannot directly grant victory or coins |
| M13 Save/leaderboard | P2 | Terminal settlement | Current run distance, best distance, leaderboard summary, or no-ranking state is visible, and core restart remains available | Network failure should not disrupt the terminal state and restart |
| M14 Giant two-lane blocker | P2 | After a valid setup before a giant blocker, the player chooses the safe lane or an incorrect route | The safe lane continues the run; an incorrect core collision causes gameover; a graze may cause a stun | The obstacle must leave a readable safe route and cannot directly grant a reward |
| M15 Short opening chase | P2 | Wait through a short sequence after clicking start | Character/threat visible, sequence ends automatically and enters the running state | The opening cannot block input indefinitely or hide the HUD/track state |

## GDD Notes

- The core P1 acceptance threshold is the closed loop of "start -> actual input -> visible movement/posture -> collection or collision -> failure/restart," not merely displaying imagery with the same theme.
- Direction-sensitive lane changing must be based on screen space. Internal world coordinates may be defined arbitrarily, but the left/right directions seen by the player cannot be reversed.
- All P2 depth systems must preserve valid setup: revival can be triggered only from the terminal state, and stage progression cannot bypass the running, collection, or collision chain.
- Giant blockers and the opening sequence are P2 depth features: they enhance the theme and difficulty but must not disrupt the P1 closed loop of start, input, failure, and restart.
