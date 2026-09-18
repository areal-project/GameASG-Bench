# Penalty King Gameplay Requirements

## Game Positioning

Penalty King is a portrait-oriented arcade penalty shootout game. During the same match, the player alternates between playing as the shooter and the goalkeeper, taking shots and making saves through a very small number of high-pressure taps, touches, or keyboard inputs. The main experience is not complex football management, but the timing decisions, directional decisions, goal feedback, save feedback, and score progression of each penalty round.

The P1 qualified version must allow the player to move from the ready-to-start state into the match, complete shooting turns and goalkeeping turns, see the ball, shooter, goalkeeper, goal, score, round, and phase feedback, and enter a win/loss result after a fixed number of rounds before restarting.

## Core Objective and Progress

The player's objective is to have a higher score than the opponent when the penalty shootout ends. The match consists of multiple rounds of alternating attack and defense, with each round containing either one player shot or one player goalkeeping turn, and the two sides alternate actions. After each shot or save determination is completed, the score and current round should update immediately, pause briefly on goal, save, or miss feedback, and then proceed to the next attack or defense.

By default, the match should provide a fixed number of rounds. P1 must support at least one complete multi-round penalty shootout; P2 may provide different length options such as 3, 5, 7, or 9 penalties per side. If the player's final score is higher, the result is a win; otherwise, the result is a loss. A draw is not a required P1 rule; if extra time or draw resolution is provided, it must be clearly presented on the result layer.

## Player Input Semantics and Control-Feel Causality Chain

The shooting phase uses two-step timed presses. After first entering shooting, the power indicator automatically oscillates between low and high; a player tap, touch, or press of the confirm key locks the current power and enters direction selection. The direction indicator then sweeps back and forth from left to right; a second tap, touch, or press of the confirm key locks the current direction and immediately takes the shot. Waiting itself is part of the action: the player continuously watches the moving indicator and chooses the appropriate moment to confirm; after confirmation, the corresponding indicator stops changing and can no longer be fine-tuned by dragging or holding.

The visible result of the shot must form a causal chain with the locked values. When power is too low, the shot is likely to pose little threat or go wide; when the direction deviates too far from the goal, the shot should go wide; suitable power and direction send the ball from the penalty spot toward the goal, shifting left, center, or right according to the locked direction. A left direction makes the ball travel down the left side, a right direction makes the ball travel down the right side, and a central direction tends toward the center of the goal. The goalkeeper should react briefly after the shot and then perform a visible action such as diving left, diving right, standing in the center, or catching the ball based on the incoming direction. If the shot is within the target range and is not controlled by the goalkeeper, the player scores; if the direction or power is poor, the shot goes wide; if the goalkeeper's direction matches the incoming ball zone and the shot is not powerful enough to overcome the save, it is saved.

The goalkeeping phase requires the player to choose a save zone while the opponent's shot is incoming. The player can click or touch three clearly operable zones—left, center, and right—or use the corresponding keys to choose left, center, or right. Choosing left should make the player-controlled goalkeeper dive to the left, choosing right should make the goalkeeper dive to the right, and choosing center should keep the goalkeeper in the center or perform a central block. The opponent's shot should fly from the far end toward the player's goal, visibly approaching, growing larger, and shifting horizontally along the way; if the player's chosen save zone matches the incoming ball zone, save feedback should be triggered, otherwise the opponent scores.

This game has no continuous running, braking, hold-to-charge, or drag aiming. P1 should not use “the longer the hold, the stronger the shot” or “drag toward the target to aim” as the primary control feel; the core risk comes from waiting for a moving indicator to reach the ideal position and then pressing to confirm, as well as choosing the correct zone in time when goalkeeping.

## Visible Feedback Chain

The main scene should clearly present the football pitch, goal, ball, shooter, and goalkeeper. During shooting, the player should see the power indicator, direction indicator, player kicking, the ball's flight path, the goalkeeper's reaction, scoring or failure feedback, and result poses such as the shooter celebrating or showing disappointment. During goalkeeping, the player should see the opponent's shot, the ball flying toward their own goal, the player's goalkeeper diving in the chosen direction, and save or conceded-goal feedback.

The score and round must remain visible throughout the match and update in sync after each determination. Phase prompts should help the player understand whether the current action is to start, lock power, lock direction, make a save, wait for the result, enter the next turn, or view the final result. Sound effects and ambience are P2 enhancements, but P1 must at least use visual feedback to clearly convey the key outcomes of events such as the opening whistle, kicking the ball, scoring, saving, missing, winning, and losing.

## State Flow

The game initially enters the ready-to-start state, displaying a static penalty scene, the initial score, and a start prompt. After the player clicks, touches, or presses the confirm key, the player shooting turn begins.

The player shooting turn flows as: power selection -> direction selection -> shooting animation -> result determination -> score/round update -> next turn. The player goalkeeping turn flows as: display save zones and initiate the opponent's shot -> player selects a save direction -> incoming-ball animation continues -> result determination -> score/round update -> next turn.

After the configured number of rounds is reached, the match enters the result state. The result state should block or disable match input, display the win/loss outcome and final score, and provide a restart option. Restarting should clear the score, round, temporary action state, and result layer, returning to the ready-to-start state.

## Menus, Modes, and Settings

P1 only requires three player-visible states—ready-to-start, in-match, and result—as well as a restart entry point after the result. After entering the match, no start layer that blocks the main scene should remain; after the result layer appears, shooting or goalkeeping input should no longer be accepted.

P2 may provide settings or adjustment modes for changing the power indicator speed, direction indicator speed, goalkeeper reaction, opponent accuracy consistency, match length, pitch color tone, and volume. Setting changes must be understandable to the player and reflected in the subsequent match experience. Level selection, shops, skins, team progression, pause menus, leaderboards, saved progress, and online multiplayer are not part of P1; if they are not provided, they should be clearly treated as cut scope rather than represented by empty placeholder buttons.

## Failure, Rejection, and Rule Boundaries

In the ready-to-start state, save-zone selections other than the start input should not change the score or round. During power selection, save-direction input should not affect the shot early; during direction selection, the semantics of an additional power input should only be to confirm the locked direction and should not modify the already locked power again. During the shooting animation and goalkeeping determination, repeated clicks should not score multiple times or skip the result. In the result state, match inputs other than restart should not change the final score.

The score may only be changed by a valid shooting or goalkeeping determination, and each penalty may add at most one point to one side. The round may advance only after a complete determination, not because of invalid clicks, setting changes, or abnormal result-layer operations. No setting may cause a negative score, infinite rounds, a result layer that cannot be closed, or a state in which the match cannot start.

## P2 and Cut Scope

P2 depth may include adjustable match lengths, more granular AI difficulty, volume and visual theme settings, more stadium atmosphere, different celebration or error animations, draw extra time, touch-zone highlighting, and stronger haptic/audio feedback on mobile devices.

Cut scope includes full football matches, free-kick tactics, player attribute progression, team management, online matches, items, shops, story missions, complex physical collision simulations, and persistent season progress. This content is not part of the core penalty shootout experience and cannot replace two-step shooting, three-direction saving, score alternation, and the final win/loss loop closure.

---

## GDD / Design Doc (merged from design-doc.md)

# Penalty King Design Doc

## Design Goals

Penalty King is a portrait-oriented arcade penalty shootout game. During a multi-round alternation of attack and defense, the player alternates between playing as the shooter and the goalkeeper, using a small number of high-pressure clicks, touches, or keyboard confirmations to take shots and make saves. The P1 goal is to allow the player to move from the ready-to-start state into the match, complete at least one full multi-round penalty shootout, and see the score, round, phase feedback, player actions, ball-flight results, final outcome, and restart.

This design covers only the penalty shootout itself. Full football matches, team management, items, shops, story, complex physics simulations, online matches, and persistent season progress are not within the core scope.

## MDA

### Mechanics

- M1 Three main visible states—ready-to-start, in-match, and result—as well as restart after the result.
- M2 Player shooting uses two-step timed presses: first watch the oscillating power indicator and confirm, then watch the oscillating direction indicator and confirm.
- M3 The shooting result is determined jointly by the locked power and locked direction: low threat, miss, saved shot, and goal must all have visible feedback.
- M4 Player goalkeeping uses left, center, and right zone selection; the selected zone determines the goalkeeper's visible save direction.
- M5 During the goalkeeping phase, the opponent's shot flies toward the player's goal; the ball's approach, horizontal displacement, and the player's save zone jointly determine a save or a conceded goal.
- M6 The score, round, and attack/defense phase advance after each complete determination, and enter the win/loss result after a fixed number of rounds.
- M7 Inputs at invalid times, repeated inputs, inputs in the result state, and inputs outside the current phase must be rejected or ignored and cannot abnormally change the score or advance the round.
- M8 P2 may include settings such as match length, indicator speed, goalkeeper reaction, opponent accuracy consistency, volume, pitch atmosphere, or visual theme, but settings cannot replace the P1 core loop.

### Dynamics

The player's main pressure comes from waiting for a moving indicator to enter the ideal position and confirming in that instant. During shooting, the first confirmation stops power selection and transitions to direction selection; the second confirmation stops direction selection and triggers the kick, after which the player can only wait for the ball's flight, the goalkeeper's reaction, and the determination result. During goalkeeping, the player must choose the left, center, or right zone while the ball is incoming; after the selection, the goalkeeper immediately assumes the corresponding pose, and a save or conceded goal is ultimately given according to the incoming ball zone.

The core rhythm is short turns, strong feedback, and rapid alternation: the player gets one scoring opportunity while shooting, then switches to goalkeeping and faces the risk of the opponent scoring. Each determination must pause briefly on goal, save, or miss feedback before updating the score and round and entering the next attack or defense.

### Aesthetics

The experience keywords are tense, direct, satisfying, and clear. The scene should let the player understand the goal, ball, shooter, goalkeeper, score, and current phase at a glance; feedback should make it clear that the player's timing choice just caused a goal, miss, saved shot, successful save, or conceded goal. Sound effects and stadium atmosphere can enhance the sports feeling, but P1 must remain understandable through visual states alone.

## P1 Core Loop Executable Traces

### Loop A: Complete Match Main Loop

Start/reset: The game is in the ready-to-start state, the score has its initial value, the round starts from the first round, and the pitch displays a static penalty scene and a start prompt.

Player input: The player clicks, touches, or presses the confirm key to start the match.

Continuous state changes: The player shooting turn begins and completes “power selection -> direction selection -> shooting animation -> result determination”; the score and round then update, the attack/defense role switches, and the player goalkeeping turn begins; the goalkeeping turn completes “display save zones and initiate the opponent's shot -> player selects a save direction -> incoming-ball animation continues -> result determination.” This attack/defense alternation repeats until the fixed number of rounds ends.

Objective/risk: The objective is for the player's score to be higher than the opponent's when the entire match ends. Risks come from poor shooting power or direction choices causing a low-threat shot, miss, or saved shot, as well as an incorrect goalkeeping direction judgment causing the opponent to score.

Reward/failure: When a valid shot scores, the player receives a point and goal feedback; on a successful save, the opponent receives no point and save feedback is shown; a mistake or incorrect judgment results in a miss, a saved shot, or a point for the opponent.

Progress/restart: Each complete determination may advance the round at most once and produce at most one score change. After the fixed number of rounds ends, the game enters the result state and displays the outcome and final score; after the player chooses restart, the score, round, temporary action state, and result layer are cleared, returning to the ready-to-start state.

### Loop B: Player Shooting Turn

Start/reset: The current phase is player shooting, the ball is near the penalty spot, the shooter is preparing to kick, the goalkeeper is guarding in front of the goal, and the power indicator begins oscillating.

Player input: The player waits for the power indicator to reach the desired position and then clicks, touches, or presses the confirm key; the direction indicator then begins oscillating left and right, and the player waits and confirms again.

Continuous state changes: The first confirmation locks the current power, the power is no longer modified by later inputs, and direction selection is displayed. The second confirmation locks the current direction, the direction indicator stops, the shooter kicks, the ball flies from the penalty spot toward the goal and shifts left, center, or right according to the locked direction, and after a brief reaction the goalkeeper performs a visible action such as standing in the center, diving left, diving right, or catching the ball.

Objective/risk: The player's objective is to lock sufficiently effective power and a direction within the goal range. Power that is too low is likely to pose little threat, and a direction too far off causes a miss; a shot within the target range is saved when the goalkeeper matches its direction and the shot is not powerful enough.

Reward/failure: When the shot passes the goalkeeper and enters the target range, the player scores, and goal and celebration feedback are displayed; when the shot goes wide or is saved, no point is awarded, and mistake, save, or disappointment feedback is displayed.

Progress/restart: After the shooting determination, the score updates in sync, the feedback pauses briefly, and the game advances to the next attack or defense. Repeated input during the shooting animation and determination cannot score multiple times or skip the result.

### Loop C: Player Goalkeeping Turn

Start/reset: The current phase is player goalkeeping, the player's goalkeeper is in front of their own goal, the left, center, and right save zones are visible, and the opponent's shot begins flying toward the player's goal.

Player input: The player clicks or touches the clearly marked left, center, or right zone, or uses the corresponding key to choose a save direction.

Continuous state changes: When left is selected, the goalkeeper dives to the left; when right is selected, the goalkeeper dives to the right; when center is selected, the goalkeeper holds a central block or performs a central save. During flight, the opponent's incoming ball approaches the player's goal, grows larger, and shifts horizontally into the left, center, or right zone; at determination time, the incoming ball zone is compared with the player's selected zone.

Objective/risk: The player's objective is to judge the incoming ball zone within a limited time and select the same zone. Choosing incorrectly or failing to cover the incoming ball zone in time causes the opponent to score.

Reward/failure: When the selected zone matches the incoming ball zone, save feedback is triggered and the opponent does not score; when they do not match, conceded-goal feedback is displayed and the opponent scores.

Progress/restart: After the goalkeeping determination, the score updates in sync, the feedback pauses briefly, and the game switches to the subsequent attack or defense or enters the result. Save inputs outside the goalkeeping phase cannot affect the score, round, or subsequent shot.

## Mechanic Coverage Matrix

| M-feature | Priority | Player trigger | Visible result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 State flow and restart | P1 | Start input; restart after the result | Ready-to-start enters the match; the result layer displays the outcome and final score; restart returns to the initial score and first round | The result state disables match input; restart clears the score, round, temporary actions, and result layer |
| M2 Two-step shooting input | P1 | Two clicks, touches, or confirm-key presses during the shooting phase | The first locks power and displays direction; the second locks direction and triggers the kick | Locked power cannot be modified again by the second confirmation; dragging or holding cannot replace the primary control feel |
| M3 Shooting direction and power causality | P1 | Confirm at different power and direction timings | The ball flies from the penalty spot toward the goal: left values go down the left side, right values go down the right side, and middle values tend toward the center; the result is a goal, miss, or saved shot | A direction too far off or power too low cannot consistently count as a valid goal; each penalty may add at most one point for the player |
| M4 Goalkeeper reaction after a shot | P1 | The player completes shot confirmation | The goalkeeper reacts briefly after the ball starts flying and performs a dive left, dive right, stand-center, or catch action according to the incoming zone | Goalkeeper feedback must relate to the shooting zone and result; the score cannot change without an action being shown |
| M5 Three-direction goalkeeping | P1 | Click/touch/press a key to select left, center, or right | The player's goalkeeper dives toward or blocks the selected zone; the opponent's incoming ball approaches and shifts horizontally | Selecting a save direction outside the goalkeeping phase does not change the score or round; a selection cannot trigger resolution multiple times |
| M6 Attack/defense alternation and score progression | P1 | Complete each shooting or goalkeeping determination | The score, round, and current attack/defense phase update in sync until the fixed number of rounds ends | Invalid clicks, setting changes, or result-layer operations cannot advance the round; the score cannot be negative |
| M7 Result resolution | P1 | Complete the last determination after the fixed number of rounds | Display the final score and outcome; provide restart | After the result layer appears, continued shooting or goalkeeping cannot rewrite the final score |
| M8 Settings and atmosphere enhancements | P2 | Adjust optional settings or enable sound effects/visual themes | Subsequent matches reflect changes to indicator speed, opponent consistency, match length, volume, or pitch atmosphere | Settings cannot cause an inability to start, a result layer that cannot be closed, infinite rounds, or a missing core loop |

## Player Input Semantics

Shooting input confirms timing; it is not drag aiming or hold-to-charge. The player waits for the power bar to oscillate and confirms at the ideal moment; then waits for the direction indicator to sweep left and right and confirms at the ideal moment. The moment of confirmation determines the locked value, the indicator stops after confirmation, and animation and determination take over the flow.

Goalkeeping input is discrete zone selection. The left zone must make the player's goalkeeper dive toward the left side of the screen, the right zone must make the player's goalkeeper dive toward the right side of the screen, and the center zone must express a central block. The opponent's incoming ball's visible horizontal motion should correspond to its final left, center, or right zone; there cannot be a direction reversal in which the player sees the ball moving left but must press right to be correct.

Keyboard, mouse, and touch are different input methods for the same set of player semantics. The implementation may freely design the appearance of controls, but they must be discoverable, triggerable, and observable in the current phase, and input during unavailable phases cannot produce hidden side effects.

## State and Feedback Requirements

During the match, the HUD must continuously communicate the score, round, and current phase. Phase prompts should cover at least the following states: ready-to-start, lock power, lock direction, goalkeeping selection, wait for result, next turn, and final result. Scene feedback must cover the goal, ball, shooter, goalkeeper, ball flight, and result poses; even without sound effects, the player should be able to determine goals, saves, misses, wins, and losses from the visuals.

Feedback should be synchronized with rule outcomes: score changes must occur after a valid determination and cannot precede the player completing the corresponding action; result feedback should pause briefly after appearing so the player can understand what just happened; when entering the next turn, the temporary animation poses and selection state from the current turn should reset.

## Priorities and Cut Scope

P1 must implement: ready-to-start through match entry, two-step shooting, three-direction goalkeeping, visible ball and player feedback, score and round progression, a result after a fixed number of rounds, restart, and rejection of invalid inputs.

P2 may implement: different match lengths, indicator-speed and difficulty adjustments, volume and visual themes, additional celebration/mistake animations, touch-zone highlighting, draw extra time, and stronger stadium atmosphere.

Explicit cut scope: full football matches, free-kick tactics, player progression, team management, online matches, shops, items, story missions, complex collision physics, and persistent season progress. Cut content cannot serve as replacement gameplay; a themed interface without the P1 core loop does not satisfy this design.

## Self-Review Conclusion

This design document develops the MDA, P1 core loop, and mechanic coverage matrix only from the confirmed original requirements and gameplay requirements; it adds no hidden gameplay, private naming, fixed copy, fixed structure, or algorithm requirements. The P1 core loop has been expanded according to “start/reset -> player input -> continuous state changes -> objective/risk -> reward/failure -> progress/restart,” while retaining the control-feel chain of two-step timed confirmation, shooting-direction causality, and three-direction saving. No P1 gaps requiring a return to supplement the gameplay requirements were found.
