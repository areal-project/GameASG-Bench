# Impact Pong Gameplay Requirements

## Product Positioning

Impact Pong is a portrait 3D table-tennis duel. The player controls the near paddle and plays physics-driven rallies against a computer opponent at the far end of a three-dimensional table. The core is not flat paddle-and-ball rebounding; instead, the player influences serves, return placement, net-contact risk, and scoring outcomes through paddle position, forward and backward movement, lateral swing speed, and timing.

The P1 acceptance threshold is: the player can progress from startup into a genuinely playable 3D table, select or continue a match mode, activate the paddle, use mouse or touch to move the paddle and complete serves and returns, rally with the computer, advance score or star progress correctly, and retry, continue, or return to the menu after the terminal state. P2 enhancements include more complete shop cosmetics, a leaderboard, audio settings, celebration particles, and long-term persistence.

## Core Scenario and Objectives

The game scene must display a readable 3D table-tennis table, a central net, a near player paddle, a far computer paddle, and a visible table-tennis ball. The ball moves among the tabletop, net, paddles, and floor, and the player should be able to clearly judge its incoming direction, landing point, bounce, and whether a point was scored.

Player objectives fall into two categories: earn enough stars in challenge levels to clear the level and unlock the next one; or reach the target score first in a score match to defeat the computer, with the player losing if the opponent reaches the target first. Every point must be followed by brief feedback before resetting for the next serve, rather than skipping the result instantly.

## State Flow

At startup, a loading state appears first; once resources are ready, the game must wait for the player to actively start. After entering the game, it defaults to the highest unlocked challenge level and displays current progress, coins, pause, and leaderboard access; the bottom menu can open level selection, score match, and the shop.

The main states of a match are: ready to serve, playing, point settlement, paused, and terminal. While ready to serve, the ball rests near the serving side; while playing, the ball, player paddle, computer paddle, and camera update continuously; during point settlement, a scoring prompt is shown and duplicate scoring is briefly locked; while paused, the match freezes and the main playfield is covered; in the terminal state, the win, loss, or level-clear result and final score or reward are shown, with access to retry, next level, menu, and settings.

Pause can be entered from playing, ready to serve, or point settlement. Resuming from pause should return to the pre-pause match state, and the serve prompt and paddle activation prompt need to be restored; choosing retry while paused clears the current rally and the score or level stars; entering the main menu while paused should first display the mode-selection overlay and must not allow the game to keep accepting paddle input beneath the overlay.

## Input Semantics and Control Feel

The player controls the near paddle with mouse or touch. After starting a match, the player must first click or touch near the paddle handle to activate the paddle; before activation, ordinary dragging should not move it. After activation, the screen gives a serve-direction prompt and enters a controllable state.

The paddle uses relative-displacement control: moving the pointer or finger right moves the paddle right, and moving it left moves the paddle left. Dragging toward the bottom of the screen pulls the paddle back toward the player; pushing toward the top of the screen drives the paddle forward toward the table and net. Continuous input continuously changes the paddle's target position, and the paddle follows smoothly instead of jumping instantly; after the mouse is released or the touch ends, no new displacement is added, and the paddle only completes the brief follow-through already produced.

Forward and backward paddle movement is closely tied to serving and striking. When the player is preparing to serve, the ball aligns horizontally with the paddle; the player needs to pull the paddle back or adjust its position first, then push forward to complete the serve. The forward push sends the ball onto the table and enters play. During a rally, when an incoming ball approaches the near paddle, the player needs to meet it at the correct time and position; the more pronounced the lateral movement, the farther the return placement biases toward the corresponding side, while a fast swing produces stronger visible swing feedback. Input in opposite directions should produce opposite paddle-position changes and distinguishable return tendencies; left and right must not be inverted.

The paddle is constrained by boundaries and cannot move infinitely beyond the playable area or pass through unreasonable positions. Pulling too far back increases the distance that must be pushed forward again; pressing too far forward makes it easier for the player to miss deep balls or fail to recover in time. The player cannot score directly by clicking the score, menu, or blank areas; all scoring must result from ball movement and the adjudication chain.

## Ball, Physics, and Adjudication

The ball needs visibly parabolic motion, gravitational descent, tabletop bounce, paddle rebound, net blocking or scraping, floor contact, and a sense of motion that gradually decays. Ball speed, bounce, and trajectory do not need to match exact numerical values, but the player must be able to see the causal relationship among “hit, bounce, cross the net, land, make an error.”

On a serve, the ball should first launch near the serving side and land on that side's own half before traveling toward the opposing half. An ordinary return should attempt to land within the opponent's half. If the ball hits the front of the net without crossing, the last hitter should lose the point; if it only clips the top of the net, its speed may be reduced and it may continue moving. If the ball first lands on the hitter's own half, bounces consecutively on the same side, hits the floor before reaching the opponent's half, or the opponent fails to return it within the required rhythm, the other side should be awarded the point according to table-tennis logic.

Duplicate scoring must be prevented during a point. After a point is scored, the paddles and ball should briefly reset, and service alternates between the player and computer; when the computer serves, the opening serve should happen automatically, while a player serve should wait for the player's forward push.

## Computer Opponent

The computer opponent controls the far paddle and moves based on predictions of the incoming ball's direction, speed, and landing point. At higher difficulty, the computer reacts faster, predicts more accurately, recovers and dashes more aggressively, and makes fewer mistakes; lower difficulty should have an obvious delay or error so that the player can score.

The computer should not always return perfectly. When the ball travels toward it, it should first show a reaction delay and then move to the predicted position; when the ball moves away, it returns to the ready area; once point settlement has begun, it no longer chases the ball to score. Computer returns should also create real ball trajectories rather than directly changing the score.

## Progression, Victory, Defeat, and Rewards

Challenge mode consists of multiple levels of increasing difficulty. Each level requires the player to earn a specified number of stars, and each player point earns one star; computer points only provide per-point feedback and do not directly fail the level. Reaching the star target displays a level-clear result, awards coins, and unlocks the next level; if another level exists, an entry point to it is provided. Retrying the current level should clear the stars earned in that attempt and serve again.

Score match is a race between the player and computer to reach the target score. If the player reaches the target first, the player wins and receives a larger coin reward; if the computer reaches the target first, the player loses and receives no victory coin reward. The terminal state must display the final score, and match input is locked after the terminal state until the player chooses retry, menu, or another next action.

Total coins and lifetime coins earned are used for long-term progression. Clearing a level or winning a score match increases coins, with the change displayed synchronously in the interface. Coins must not change without cause due to failure, previewing cosmetics, or opening the menu.

## Menus, Modes, and Auxiliary Interfaces

The bottom menu contains entries for level selection, score match, and the shop. Level selection should display unlocked and locked levels horizontally; unlocked levels can be clicked to enter, while locked levels must be visible but cannot be started. Entering another mode should close menu panels that block the game and reset the current match to that mode's starting point.

The pause screen contains resume, retry, main menu, and settings. Clicking a blank area of the pause overlay can resume; the main-menu overlay can be entered from pause or the terminal state and can open level selection, score match, and the shop. Whenever any panel is open, the main playfield should not simultaneously respond to striking input.

The shop is P2 but should be retained as an explicit scope: players can browse the colors or texture appearances of the table, player paddle, computer paddle, and ball by category; unowned items show a lock and price; selecting an owned item equips it immediately; selecting an unowned item previews it and shows a purchase entry point; a purchase with insufficient coins should be rejected and show a prompt; when the shop closes, any unpurchased temporary preview should revert, while purchased or equipped selections should be saved. Appearance changes should be reflected in the 3D scene.

The leaderboard is P2: it should provide a coin-ranking panel opened from the match interface and be capable of showing loading, list, player rank, and failure states; if an external ranking is unavailable, a local placeholder or friendly failure prompt may be retained, but it must not block the main game. Settings are P2: they should be openable from pause or the terminal state, allow toggling background music and sound effects, and return to the originating screen when closed.

## Visible Feedback

When the player scores, this must be reflected simultaneously by a score or star change, a central point prompt, and positive audio or celebratory feedback; when the computer scores, it must be reflected by an opponent-score change and point-loss feedback. Victory, defeat, and level clear should have a clear result layer, reward, or final score. Before a serve, there should be a visible paddle-activation marker and forward-push prompt.

When the ball moves at high speed, it should have a trail or equivalent motion emphasis; when a fast paddle swing connects, it should have a swing arc or equivalent impact feedback; spectator or celebratory particles after the player scores can be a P2 enhancement. The camera should lightly follow or zoom with the paddle's lateral and forward/backward position so that the player senses a change in spatial distance as the paddle approaches the table, but it must not invert left/right controls or obscure the main ball trajectory.

Audio feedback is P2: paddle hits, tabletop bounces, points scored, points lost, victory, defeat, and background music should be perceptibly distinct and affected by the settings toggles. When no audio resources are available, the game may degrade to silence, but visual and state feedback must remain complete.

## Rejection Paths and Rule Constraints

A playable rally cannot begin before start is clicked; a loading failure should remain in an understandable failure state. When the paddle is not activated, mouse movement or touch dragging cannot directly serve. When pause, menu, shop, leaderboard, settings, or terminal overlays cover the main playfield, paddle input cannot change the match result.

A purchase with insufficient coins must fail, and the coin count, ownership state, and equipped state cannot be changed illegally. Locked levels cannot be started. Continuing to move the paddle after the terminal state cannot continue scoring. The same ball cannot award points repeatedly during point settlement. Retry must clean up the old ball, old score, old stars, and celebration residue from the current attempt so that feedback from an old rally does not affect the new match.

## P2 and Scope Reductions

P2: complete shop categories, texture appearances, leaderboard, saved settings, audio, spectator celebrations, particles, ball trails, swing effects, dynamic camera adjustment, and nuanced differences among multiple difficulty tiers.

Scope reductions: a genuinely functional online ranking is not required; reuse of any specific brand, character, or licensed appearance is not required; exactly matching art assets, fixed color schemes, fixed text, fixed values, fixed table dimensions, or frame-by-frame physics trajectories are not required; an editor-style parameter panel is not required. No scope reduction may affect P1's 3D duel, input feel, scoring adjudication, mode flow, or complete retry loop.

---

## GDD / Design Doc (merged from design-doc.md)

# Impact Pong Design Doc

## GDD Summary

Impact Pong is a portrait 3D table-tennis duel built around direct paddle control, readable ball physics, and short scoring cycles. The player controls the near paddle with mouse or touch, activates the paddle from its handle area, then uses relative movement to position, pull back, push forward, serve, return, and influence shot direction. The opponent controls the far paddle with difficulty-scaled prediction, reaction, recovery, and miss behavior.

P1 playability means the player can enter a readable 3D table scene, start or select a playable mode, activate and move the paddle, serve by pushing forward, rally against the computer, earn points through ball-and-rule outcomes, see scoring or star progress, reach a terminal result, and restart or continue. P2 depth includes fuller shop presentation, leaderboard behavior, audio/settings, celebratory effects, cosmetic persistence, and richer camera or feedback polish.

## MDA

### Mechanics

M1. Boot, start, and mode entry: the game loads assets, waits for player start, then opens either a challenge level path or a score match path. Challenge mode tracks stars toward a level goal; score mode tracks player and opponent points toward a target score.

M2. 3D playfield readability: the play scene contains a visible table, net, near paddle, far paddle, and ball. The ball trajectory, bounce, net contact, paddle contact, and out-of-play results must be readable enough for the player to understand why a point was won or lost.

M3. Paddle activation and input gating: after a round starts, the player must first activate the paddle near its handle. Before activation, ordinary movement does not move the paddle or serve. Menus, pause, shop, leaderboard, settings, and terminal overlays block gameplay input.

M4. Relative paddle movement and feel: once active, pointer or touch deltas drive the paddle in matching screen directions. Moving right moves the paddle right; moving left moves it left; dragging downward pulls the paddle back toward the player; pushing upward drives it toward the table and net. The paddle follows smoothly, respects bounds, and stops receiving new displacement when the pointer or touch ends.

M5. Player serve loop: on player serve, the ball waits near the player side and follows the paddle horizontally. The player adjusts position, can pull back, then pushes forward to strike. A valid serve visibly bounces on the player side, crosses the net, and travels toward the opponent side.

M6. Rally return and shot influence: when the ball approaches the near paddle, the player must meet it with timing and position. Paddle velocity and lateral movement influence the return's landing tendency, so faster or more lateral swings produce stronger visible impact and biased shot placement. Opposite lateral inputs must create opposite paddle movement and distinguishable shot tendencies.

M7. Ball physics and scoring rules: the ball uses visible gravity, bounce, air loss, paddle rebounds, net blocking or scraping, floor contact, and side-based bounce history. Points come from the ball/rule chain: net failure, illegal own-side landing, repeated bounce on one side, failure to return after a legal bounce, or a ball landing out of playable continuation. A point can be awarded only once per rally.

M8. Computer opponent: the far paddle reacts to the incoming ball with difficulty-scaled delay, prediction, pursuit, recovery, and occasional miss behavior. It returns real ball trajectories rather than directly changing the score.

M9. Per-point reset and serve alternation: after each point, feedback appears briefly, scoring is locked, the ball and paddles reset, serve alternates between player and computer, and the next rally begins from a waiting or automated serve state.

M10. Challenge progression: challenge levels require the player to earn a target number of stars. Player points add stars; opponent points are feedback but do not directly fail the level. Reaching the star goal clears the level, awards coins, unlocks the next level when available, and offers next/retry/menu choices.

M11. Score match progression: score mode uses a player-vs-computer target score. The player wins by reaching the target first and earns a larger coin reward; the computer reaching the target first creates a loss result without the win reward.

M12. Pause, restart, and menu flow: pause freezes active play and hides or suspends serve/activation hints. Resume restores the previous round state. Restart clears the current round's transient state, score or stars as appropriate, ball state, and old feedback. Returning to menu opens mode-selection flow without letting blocked gameplay continue underneath.

M13. Rewards and persistence: coins and long-term earned coins advance only from declared rewards. Failure, previewing cosmetics, or opening panels must not mutate coins. Unlocked levels and owned/equipped cosmetics may persist as long-term progress.

M14. Shop and cosmetics (P2): the shop allows category browsing for table, paddle, opponent paddle, and ball appearance. Owned items equip directly; locked items preview with a purchase path; insufficient funds are rejected; closing after an unpaid preview restores the previous equipped state; purchased or equipped items affect the visible 3D scene.

M15. Leaderboard, settings, audio, and celebration (P2): leaderboard access shows loading, ranking/list, current player rank, empty, or failure states without blocking the core game. Settings can toggle music and effects from pause or terminal flow. Distinct sounds, ball trails, hit arcs, spectator or particle celebration, and dynamic camera motion strengthen feedback without replacing required visual state changes.

### Dynamics

The primary dynamic is a fast control-and-reaction loop. The player reads ball flight, moves the paddle with relative gestures, decides how far back or forward to play, then attempts to meet the ball before it bounces too many times or falls away. Good positioning and timely forward movement turn into a visible strike, a legal cross-net arc, and score pressure on the computer. Poor positioning, late response, or excessive forward/back position creates miss risk.

Rallies alternate control pressure. During player serve, the player's first meaningful challenge is producing a forward strike from a prepared paddle position. During computer serve or return, the player reacts to a live ball and must align both side-to-side and depth. The computer's difficulty changes how much space the player has to win points: easier opponents react late or inaccurately, while harder opponents predict and recover more aggressively.

Scoring dynamics create short loops inside longer progression. A single point gives immediate feedback, then serve alternates and the table resets. Challenge mode softens failure by making opponent points feedback while player stars remain the level objective. Score mode creates direct pressure because opponent points move toward a loss condition.

Interface dynamics must protect the playfield. Overlays and panels intentionally stop paddle control so players cannot accidentally score, buy, move, or continue a rally through a blocking UI. Restart and mode changes must visibly clean up old rallies so the next loop starts from a stable state.

### Aesthetics

The intended feel is impact-heavy, readable, and energetic. Paddle movement should feel directly connected to the player's hand, while smoothing and camera follow keep it physical rather than teleporting. Hits should feel stronger when the player swings quickly or laterally, and the ball should visibly communicate bounce, net contact, landing side, missed returns, and scoring cause.

The game should feel like a compact competitive sports match with arcade progression. Stars, coins, clear results, and cosmetic unlocks create a steady sense of advancement. P2 audio, trails, impact arcs, camera response, and celebration should amplify the core loop, but the game must remain understandable without relying on sound or decorative effects.

## P1 Core Loop Executable Trajectories

### Loop A: Player Serve Into Rally

Start/reset: player starts or restarts a challenge or score match. The playfield shows the table, net, ball near the serving side, near paddle, far paddle, HUD progress, pause access, and an activation indicator.

Player input: the player clicks or touches near the paddle handle to activate control. The player moves left or right to line up with the ball, may drag downward to pull the paddle back, then pushes upward toward the table.

Continuous state changes: after activation, relative input updates the paddle target; the paddle smoothly follows within bounds; the ball aligns horizontally with the paddle while waiting for player serve; forward paddle velocity triggers the serve. The ball bounces on the player side, clears or interacts with the net, then travels toward the opponent side. The computer begins reacting according to difficulty.

Goal/risk: the player aims to create a legal serve that reaches the opponent half. A weak, badly positioned, or net-blocked serve risks immediate point loss; excessive back position increases the need to push forward; control must not invert left/right.

Reward/failure: a legal serve enters the rally and can lead to the computer missing or returning. A failed net or illegal bounce awards the point to the opponent. Any point result shows brief feedback and updates score or stars exactly once.

Progress/restart: if no terminal target is reached, serve alternates and the next point resets from a waiting or automated serve. If the target is reached, the terminal result appears with retry, next, continue, or menu options.

### Loop B: Return, Rally, And Point

Start/reset: after a serve or per-point reset, the ball is in play or about to be served by the computer, with the player paddle active or activatable and the HUD showing current progress.

Player input: the player tracks the incoming ball with continuous mouse or touch movement. Right/left gestures shift the paddle right/left; downward gestures pull back; upward gestures close distance to the table. The player times the paddle to meet the ball.

Continuous state changes: the paddle position and swing velocity update smoothly; camera may follow without reversing controls; the ball falls, bounces, crosses the net, and collides with paddle or table. On paddle hit, lateral swing influences the target side and forward/back swing influences shot depth or timing feel. The computer returns to ready position when not pursuing and chases predicted ball paths when threatened.

Goal/risk: the player wants to return the ball legally to the opponent half and create a difficult shot. Missing the ball, letting it bounce repeatedly on the player side, hitting into the net, or returning to the wrong side creates point loss risk.

Reward/failure: a successful player return can force an opponent miss and award the player a point or star. A failed return awards the opponent a point. Feedback includes HUD progress plus central point feedback and, for player scoring, positive celebration or equivalent visual emphasis.

Progress/restart: after a point, gameplay enters a short locked settlement state, then resets the ball and paddles, alternates serve, and resumes. In challenge mode, player points accumulate stars toward clear; in score mode, both sides' points can end the match.

### Loop C: Challenge Level Completion

Start/reset: the player enters an unlocked challenge level from startup default, level selection, next-level flow, or restart. Stars for the current attempt start at zero and the level displays the required goal and difficulty.

Player input: the player completes repeated serve/return loops by activating the paddle, serving when responsible, and returning live balls.

Continuous state changes: each player point increments the challenge star count and shows star progress. Opponent points show loss-of-point feedback but do not clear the player's accumulated challenge stars. Difficulty changes the computer's reaction and shot quality across levels.

Goal/risk: the goal is reaching the required star count. The risk is losing individual points, slowing progress, and repeatedly facing harder serves or returns, not immediate level failure from one opponent score.

Reward/failure: reaching the star target clears the level, awards coins, updates long-term progress, and unlocks the next level when one exists. Restart before completion clears the current attempt's stars and old rally state.

Progress/restart: the result layer offers next level, retry, menu, and settings flow. Choosing next starts the next unlocked challenge from a clean serve state; choosing retry restarts the same level from zero current stars.

### Loop D: Score Match Win/Loss

Start/reset: the player enters score mode from the menu or popup flow. Both sides' scores reset, the target score is visible or understandable, and the match starts from a clean serve state.

Player input: the player uses the same activation, serve, and return controls to win rallies against the computer.

Continuous state changes: player and computer points both accumulate from rule-based rally outcomes. Serve alternates after nonterminal points. The computer's stronger score-mode difficulty makes returns and serves more demanding.

Goal/risk: the player aims to reach the target score before the computer. Every lost rally moves the opponent closer to the loss condition.

Reward/failure: reaching the target first shows a win result and grants the score-mode coin reward. The computer reaching it first shows a loss result without the win reward. Terminal state locks gameplay input.

Progress/restart: retry restarts the match with both scores cleared; menu returns to mode selection; settings may open from the result without resuming hidden gameplay.

## Mechanism Coverage Matrix

| M | Priority | Player Trigger | Observable Result | Failure / Rejection / Invariant |
|---|---|---|---|---|
| M1 Boot and mode entry | P1 | Start, choose level, choose score mode | Loading resolves to menu or playable mode; HUD matches selected mode | No play before start; mode change resets current match cleanly |
| M2 3D playfield readability | P1 | Enter play | Visible table, net, paddles, ball, and ball motion | Blank or unreadable playfield cannot satisfy core play |
| M3 Paddle activation gating | P1 | Click/touch near paddle handle | Activation indicator clears; serve/control prompt appears; paddle becomes controllable | Movement before activation must not move paddle or serve |
| M4 Relative paddle movement | P1 | Continuous mouse/touch movement | Paddle follows right/left/up/down causal directions with smoothing and bounds | Left/right reversal, teleporting, out-of-bounds, or movement through blocking UI fails |
| M5 Player serve | P1 | Pull/position then push forward while serving | Ball launches from player side, bounces on own half, then crosses toward opponent half | Passive movement or UI clicks cannot directly score; bad net/illegal serve awards opponent |
| M6 Rally return influence | P1 | Time paddle contact during incoming ball | Ball rebounds toward opponent half; lateral/fast swing changes visible return tendency | Hit cannot be pure score mutation; opposite inputs must not collapse to same effect |
| M7 Ball physics and scoring | P1 | Rally outcomes through ball movement | Bounce, net, floor, side history, score feedback, and HUD update | One rally scores once; invalid own-side/dual-bounce/net/floor outcomes award correct side |
| M8 Computer opponent | P1 | Ball travels to opponent side | Far paddle reacts, predicts, returns, recovers, and sometimes misses by difficulty | Computer cannot be perfect forever or directly modify score without ball play |
| M9 Per-point reset | P1 | Any nonterminal point | Short feedback, locked scoring, ball/paddles reset, serve alternates | Repeated scoring from same ball or old feedback contaminating next rally fails |
| M10 Challenge progression | P1 | Win player points in level mode | Player points add stars; reaching target clears level, grants coins, unlocks next | Opponent points must not directly fail challenge; retry clears current stars |
| M11 Score match progression | P1 | Win or lose rallies in score mode | Both scores progress; target reached by player wins, by opponent loses | Terminal state must lock gameplay and preserve final score result |
| M12 Pause/restart/menu flow | P1 | Pause, resume, retry, menu | Play freezes under pause; resume restores; retry/menu clean state | Blocked overlays must prevent paddle and scoring input |
| M13 Rewards and persistence | P1 | Clear level or win score match | Coins increase only from rewards; progress can persist | Failure, preview, menu, and blocked actions cannot alter coins illegally |
| M14 Shop cosmetics | P2 | Open shop, browse, select, buy/equip | Owned items equip; locked items preview; purchase changes ownership and visible appearance | Insufficient funds reject; unpaid preview reverts when closed |
| M15 Leaderboard/settings/audio/celebration | P2 | Open rank/settings; score/win/lose | Rank panel states, settings toggles, sounds/effects/celebrations communicate outcomes | External rank failure must not block play; audio off must not remove visual feedback |

## State And UI Design

The visible state machine is loading/start, menu or mode selection, waiting to serve, playing, point settlement, paused, terminal result, and auxiliary panels. Waiting to serve is not idle decoration: it is an active preparation state where activation, paddle alignment, and forward serve input matter. Point settlement is also a real state because it prevents duplicate scoring while feedback is visible and prepares the next serve.

Challenge and score mode share paddle, ball, opponent, scoring, pause, and restart mechanics but differ in progress meaning. Challenge mode interprets player points as stars toward level clear; score mode treats both scores as a race toward win/loss. UI should make the current progress type clear without relying on fixed wording.

Auxiliary panels sit above the playfield and must be treated as input blockers. The player can safely inspect levels, shop, leaderboard, settings, pause, or result choices without accidentally moving the paddle or changing a rally. Closing or choosing an action returns to an appropriate state with prompts restored or cleaned up.

## Feedback Design

Required feedback: activation indicator, serve/push prompt, visible paddle movement, readable ball trajectory, bounce feedback, net contact feedback, hit feedback, point notification, HUD score/star update, terminal result, and restart cleanup. These are P1 because they communicate the core input-to-outcome chain.

Enhanced feedback: ball trail, swing arc, camera follow/zoom, spectator or particle celebration, distinct audio, cosmetic visual changes, leaderboard presentation, and persistent settings. These are P2 unless needed to replace an otherwise missing P1 visual cue. Audio can be silent-degraded only if visual state and rule feedback remain complete.

## Scope Guardrails

Do not require exact artwork, fixed text, fixed numbers, fixed colors, precise dimensions, specific physics equations, or a copied UI layout. Do require the player-visible game: direct near-paddle control, non-inverted relative movement, forward serve gesture, real ball/rule scoring, computer opponent rallies, challenge stars, score win/loss, rewards, pause/menu blocking, and clean restart.

Shop, leaderboard, settings, audio, cosmetics, camera, and celebration may be simplified as P2, but their simplified forms must not break P1 input, scoring, progress, or restart loops.
