# Tap-Tap Shots Gameplay Requirements

## Goal and Genre

Tap-Tap Shots is a portrait 2D physics-based rhythm basketball game. The player's goal is to make the basketball bounce, travel horizontally toward the hoop, and go in through repeated clicks or touches during a timed shooting run, accumulating as many points, coins, and high-score records as possible.

A qualifying game experience is not a static shoot button, but a continuously moving shooting loop: the ball, hoop, floor, backboard, and rim must produce physics-based feedback within the same visible court, and the player relies on tap timing to adjust the ball's height and forward rhythm.

## Core Loop

1. The initial screen displays the court, basketball, hoop, best score, coin access, shop access, leaderboard access, sound toggle, and start prompt.
2. After the player clicks the main court for the first time, the game enters the playing state, and the basketball immediately bounces upward and moves toward the current hoop.
3. The player continues clicking while the ball is flying, falling, or bouncing off the floor; each click gives the ball a new upward bounce and horizontal push toward the target hoop.
4. The player scores when the ball falls from above the hoop through the rim opening; hitting the backboard, rim, or floor causes a bounce that may change the trajectory and waste time.
5. After a successful score, the score increase and basket feedback are displayed, the current hoop is completed, the timer for this shot pauses or resets, a new hoop enters from the other side of the screen, and the player continues chasing the next shot.
6. After the timer runs out, the game enters a tense slow-motion finish or waiting-to-land phase; if the ball still goes into the hoop before the end, play continues, otherwise the result is displayed.
7. The result displays the score for this run, high score, coins earned, retry, return-home, and leaderboard access.

## Input Semantics and Control Feel

P1 only requires clicking or touching the main court as the core input; dragging, a joystick, a charge meter, or manual aiming are not required. The position the player clicks should not determine the shot direction; a click means “tap the ball,” giving it another upward bounce and pushing it toward the side where the current hoop is located.

The visible result of continuous input is a rhythmic series of bounces: if the player taps too little, gravity makes the ball fall and it may hit the floor; if the player taps too frequently, the ball is continually lifted and may pass over the hoop or hit the backboard or rim; when tapped at the right rhythm, the ball approaches the hoop along an arc and falls in from above.

Releasing or stopping clicks has no separate action; the ball continues flying at its existing velocity and is affected by gravity, air resistance, and floor friction. Its overall tendency is to fall downward while horizontal motion gradually weakens, and its bounces after landing become increasingly unfavorable for scoring quickly.

The player cannot directly press left/right to reverse-control the ball. The horizontal direction is determined by the target hoop: when the hoop is on the right, each click pushes the ball right; after the hoop switches to the left, each click pushes the ball left. This direction switch must be clearly visible on screen.

There are no special shooting actions that consume resources. High rewards come from precise rhythm: clean or soft makes can build consecutive-make heat, bringing higher points per basket and stronger feedback; a basket made after hard contact with the rim can still score, but heat decreases or no longer rises.

Risk and failure must be coupled with physical motion: hitting the backboard, rim, or floor, running out of time, and having an incorrect rhythm carry the ball away from the hoop should all be represented through the ball's trajectory, bounces, timer bar, and result state, rather than only changing numbers.

## Visible Feedback

The main court must be visible and nonblank, containing the court background, basketball, current hoop, floor boundary, and a clear HUD. The basketball needs motion feedback such as rotation, a shadow, or a trail so the player can judge its height, direction, and velocity trend.

Every click should have immediate feedback, which may be a change in the ball's velocity, a bounce sound effect, a subtle animation, or a trajectory change. Every bounce should make it apparent that the ball collided with the floor, backboard, or rim.

Basket feedback must be obvious: the score increases, a scoring prompt appears near the hoop, particle or vibration-style celebration effects appear, and sound effects distinguish clean makes from ordinary makes. Consecutive high-quality makes should represent increasing heat through a stronger trail, color, vibration, or screen feedback.

The timer bar must continuously decrease during the consecutive-shooting phase and show a warning visual change as it nears depletion. When time runs out, the player needs clear urgency feedback, followed by entry into the result state or rescue by one last valid basket.

## Scoring, Progress, and Rewards

A basic basket awards at least 1 point. Consecutive clean makes should increase heat and let subsequent clean makes earn more points; baskets involving heavy collisions should lower heat or reduce the reward.

The score from each run is used to update the high-score record. At the result, the player receives an equal or comparable amount of coins based on the run's score, and coins are saved cumulatively.

After a successful basket, the next hoop should switch to the other side and may appear at a different height. As the score rises, the range of hoop-height variation should expand or become harder to predict, making long runs test tap rhythm more.

Coins are used to purchase and equip basketball appearances and court backgrounds. Owned items can be equipped directly; unowned items are purchased and equipped when there are enough coins; purchases with insufficient coins should be rejected while leaving the balance, owned-item list, and current equipment unchanged.

The player's high-score record, coins, owned appearances, current equipment, background selection, and sound setting should persist between sessions.

## State Flow and Menus

The game includes at least the following states: initial home, playing, paused, result, shop, and leaderboard. The shop and leaderboard are overlays or panels that should prevent accidental shots from being triggered on the main court while open.

On the initial home screen, clicking the main court starts the game; clicking controls such as sound, shop, or leaderboard only performs the corresponding panel action and should not start a shot at the same time.

The playing state displays the score, pause access, sound access, and timer bar. After pausing, ball motion, timing, and the player's shooting input stop; resuming restores the same run; returning home abandons the current run and returns to the initial home screen.

The result state locks the run and no longer accepts shooting input. Retry starts over from 0 points and the initial hoop; returning home displays the latest high-score record and coins; leaderboard access displays ranking content, an empty state, or an unavailable notice.

The shop contains two categories, basketball appearances and backgrounds, displays the player's coin balance and the owned/equipped/unowned state of items, and supports closing to return to the previous state. Switching categories should not change the game state.

## Failure and Rejection Paths

The game enters the result state when time runs out and the ball does not go into the hoop in time. After the timer ends, the ball may still briefly be seen continuing under physics or finishing by landing, but the player cannot delay failure indefinitely.

While pause, result, shop, or leaderboard is open, clicking the main court should not push the basketball or change the score. The corresponding interactions resume only after the panel is closed or the game is resumed.

When there are insufficient coins to purchase an appearance or background, coins cannot be deducted, the item cannot be unlocked, and the current equipment cannot be replaced; the player needs visible rejection feedback.

Equipping an already equipped item again does not charge coins or change unrelated state. Repeatedly clicking the leaderboard close area, shop close area, or sound button should not disrupt the current score, timer, coins, or owned content.

## P1 Acceptance Bar

P1 must have a playable tap-basketball core: initial entry, tap to bounce, movement toward the hoop, falling under gravity, bounces off the floor/hoop/backboard, scoring by entering the hoop from above, hoop-side switching, timed failure, and retry from the result.

P1 must have a basic HUD and a closed state loop: score, timer, high-score record, coin settlement, pause/resume/return home, retry, sound toggle, shop open and close, and at least one set of purchasable/equippable basketball appearances.

P1 must preserve the directional semantics of the controls: the player does not aim directly, and clicking pushes the ball toward the side of the current hoop; after the hoop switches sides, the click direction reverses with it.

## P2 Enhancements

P2 may add more basketball skins, background themes, leaderboard rankings, beat percentages, mobile-device vibration, richer sound effects, particles, screen shake, heat trails, and more granular basket evaluations.

P2 may add a more complex difficulty curve, more elaborate shop previews, empty-leaderboard/loading-failure presentation, and cross-device leaderboard synchronization.

## Scope Exclusions

Multiplayer competition, real team licensing, character progression, level selection, drag aiming, a shot power meter, keyboard directional controls, complex tournament modes, and full social sharing are not required.

Developer parameter-tuning panels, hidden shortcuts, collision visualization, and one-click unlock features are outside the scope of player requirements.

---

## GDD / Design Doc (merged from design-doc.md)

# Tap-Tap Shots Design Doc

## Design Intent

Tap-Tap Shots is a portrait 2D rhythm-physics basketball game. The player does not aim with a drag, charge meter, or directional control; the entire core feel comes from repeated taps that re-launch the ball upward while pushing it toward the active hoop side. The game should feel immediate, tense, and readable: every tap changes the ball's arc, every collision costs momentum or time, and every made shot asks the player to chase the next hoop before the timer ends.

The design target is a compact arcade loop:

1. See a ball, hoop, court, score, best score, coin/shop affordances, leaderboard access, and sound controls.
2. Tap the playfield to start and make the ball jump toward the current hoop.
3. Keep tapping in rhythm while gravity, drag, floor bounce, rim, and backboard collisions change the trajectory.
4. Score by having the ball fall through the hoop opening from above.
5. Receive score, feedback, and a new hoop on the opposite side.
6. Continue until time expires and the ball fails to score, then settle, earn coins, update records, and restart or return home.

## MDA

### Mechanics

- **Tap impulse:** A click or touch on the main playfield starts play from the home state or, during play, gives the basketball a fresh upward bounce and a horizontal push toward the current hoop side.
- **Ball physics:** The ball continuously moves with gravity, air resistance, floor friction, bounce, spin, shadow, and trajectory changes that the player can read visually.
- **Directional hoop target:** The hoop alternates sides after successful shots. When the hoop is on the right, taps push the ball right; when it is on the left, taps push the ball left.
- **Hoop scoring:** A score happens only when the ball descends through the hoop opening from above. Rim, backboard, and floor contacts can redirect the ball and degrade shot quality.
- **Shot timer:** The timed phase pressures each shot. After a successful basket the timer resets for the next hoop; when it reaches zero, the game enters an urgent finish state and resolves to game over unless a valid basket is completed in time.
- **Scoring and heat:** Made baskets award points. Clean or soft makes increase heat and improve later shot rewards; heavy rim contact reduces or weakens that heat.
- **Feedback systems:** Taps, bounces, made baskets, clean shots, timer danger, and game over are communicated through motion, HUD changes, score popups, particles, screen feedback, sound, or equivalent visible effects.
- **State shell:** The game includes home, playing, paused, result, shop, and leaderboard states. Blocking overlays prevent accidental playfield taps.
- **Progression economy:** Score updates best score and converts into coins at the end of a run. Coins unlock and equip ball skins and backgrounds, with insufficient-fund rejection.
- **Persistence:** Best score, coins, owned items, equipped choices, background choice, and sound setting persist across sessions.

### Dynamics

- The player reads the ball's arc and taps when it is falling, slowing, or misaligned. Too few taps lets gravity and floor bounces take over; too many taps can lift the ball past the hoop or force awkward rim/backboard contact.
- The hoop-side alternation creates a left-right rhythm. The player must adapt because the same tap gesture reverses horizontal effect when the target changes sides.
- Clean makes create a positive pressure loop: higher rewards and stronger effects encourage the player to maintain rhythm, but collisions and time loss make the next shot riskier.
- Time pressure turns each miss, bounce, and overcorrection into a cost. The ball may continue visibly after time runs out, but the player cannot extend a failed shot indefinitely.
- Shop and persistence turn short runs into long-term progression without adding new aiming or combat mechanics.

### Aesthetics

- **Arcade immediacy:** One input, instant visible motion, no setup friction.
- **Physical readability:** The player can judge height, horizontal direction, velocity trend, floor contact, rim contact, and whether the ball is likely to drop from above.
- **Tension:** The timer, warning feedback, and awkward rebounds make every late tap meaningful.
- **Reward:** Clean makes, score bursts, heat trails, sound, coins, and record updates make successful rhythm feel satisfying.
- **Collection:** Unlockable ball and background cosmetics give repeated short runs a reason to continue.

## M-Features

| ID | Priority | Feature | Player Trigger | Observable Result | Failure / Invariant |
|---|---|---|---|---|---|
| M1 | P1 | Home and first-play entry | Tap the main playfield from home | Home UI clears, gameplay HUD appears, ball jumps upward and toward the initial hoop | Non-play controls such as sound, shop, or leaderboard do not start a shot |
| M2 | P1 | Tap-driven basketball motion | Click or touch during play | Ball receives upward motion and horizontal push toward the current hoop side; stopping taps lets gravity, drag, friction, and bounce shape the arc | Tap position does not aim the ball; paused/result/overlay states ignore playfield impulses |
| M3 | P1 | Hoop-side direction switch | Score a basket, then continue tapping for the next hoop | New hoop enters on the opposite side; later taps push the ball toward that side | Horizontal push must visibly reverse when the target side changes |
| M4 | P1 | Physical collision risk | Mistime taps so the ball contacts floor, rim, or backboard | Ball bounces, loses or redirects momentum, may tilt/animate the hoop, and time continues to matter | Collisions cannot be cosmetic-only; they must affect trajectory or scoring quality |
| M5 | P1 | Valid basket scoring | Guide the ball to fall through the hoop from above | Score increases, basket feedback plays, timer pauses or resets for the transition, and the next target becomes available | Passing from below, missing the opening, or colliding without entering does not count as a basket |
| M6 | P1 | Timed failure and result | Let the shot timer expire without a rescuing basket | Urgent warning appears, control becomes limited, the run resolves to result, score/coins/record are shown | The player cannot keep tapping forever after time has expired |
| M7 | P1 | Restart and home return | Use retry or home from result/pause | Retry starts a new zero-score run; home returns to the initial screen with latest persistent values | Result state locks scoring and motion input until restart/home |
| M8 | P1 | Pause/resume flow | Use pause during play, then resume or home | Ball motion, timer, and tap input stop while paused; resume preserves the run | Pause overlay blocks playfield taps and does not award score or coins |
| M9 | P1 | Coins and basic cosmetics | Finish runs, open shop, buy/equip an item | Coin balance updates; owned/equipped/locked states are visible; purchased item equips and affects the visible ball or background | Insufficient funds, already-equipped clicks, and category switches preserve unrelated state |
| M10 | P1 | Sound setting | Toggle sound from home or play | Sound state visibly changes and persists | Sound toggle does not trigger a shot or alter score, time, coins, or ownership |
| M11 | P1 | Leaderboard access | Open leaderboard from home or result | Ranking content, empty state, or unavailable state is shown in a blocking panel | Opening/closing it does not mutate the current score, timer, or economy |
| M12 | P2 | Rich shot feedback and heat depth | Make clean shots repeatedly | Stronger score feedback, trail, particle, vibration/screen feedback, or sound intensity communicates heat | Hard rim shots reduce or weaken heat feedback |
| M13 | P2 | Expanded collection and presentation | Use more skins, backgrounds, leaderboard detail, or beat-percentile feedback | Shop and result screens show richer cosmetics or comparison feedback | These additions cannot replace P1 scoring, timer, physics, or restart loop |

## P1 Core Loop: Executable Trajectory

### Loop A: Start, Tap, Score, Continue

1. **Start/reset:** The player begins at the home screen with the basketball resting in a visible court, the first hoop on one side, best score and coin/shop/leaderboard/sound affordances visible, and no active result overlay.
2. **Player input:** The player taps or touches the main playfield.
3. **Continuous state change:** The run enters playing state; the ball jumps upward, gains horizontal motion toward the current hoop, spins or otherwise shows movement, and then continues under gravity, drag, friction, and floor bounce when the player stops tapping.
4. **Player input continues:** The player taps again while the ball is falling or losing alignment. Each tap refreshes upward velocity and pushes the ball toward the same target side, independent of the exact tap location.
5. **Goal/risk:** The player tries to time taps so the ball approaches above the hoop opening. Mistiming can hit the floor, rim, or backboard, wasting time and changing the next arc.
6. **Reward:** If the ball descends through the hoop opening from above, score increases and visible/sound feedback confirms the basket. Clean or soft makes can raise heat and improve future score feedback.
7. **Progression:** The completed hoop is replaced by a new hoop on the opposite side, the shot timer resets for the next attempt, and subsequent taps push the ball in the new horizontal direction.
8. **Repeat:** The loop continues with rising pressure from changed hoop heights, side switching, collision risk, and the timer.

### Loop B: Timer Failure, Result, Restart

1. **Start/reset:** A run is in progress after at least one scored basket, with score and shot timer visible.
2. **Player input:** The player mistimes or stops tapping while the ball is far from a valid top-down entry.
3. **Continuous state change:** The ball keeps moving under physics, may bounce off floor/rim/backboard, and the timer decreases. As time runs low, the timer gives warning feedback.
4. **Goal/risk:** The player still needs a valid top-down basket before the run resolves. A final valid basket can rescue the run; otherwise the timer expiration becomes terminal.
5. **Failure:** When time is exhausted and no valid basket is completed during the allowed finish window, the run enters result state. Playfield taps no longer move the ball or increase score.
6. **Reward/progress:** The result screen shows the run score, best score update if applicable, and coins earned from the score. Persistent coin and record values update.
7. **Restart/reopen:** Retry resets score, timer, heat, ball, and hoop to a new playable run. Home returns to the initial screen with updated persistent values.

### Loop C: Shop Progression

1. **Start/reset:** The player has a persistent coin balance from previous runs and can open the shop from a non-blocked UI state.
2. **Player input:** The player opens the shop, switches between ball and background categories, and selects an item.
3. **State change:** Owned items equip immediately; unowned affordable items deduct coins, become owned, and equip. The visible ball or background changes according to the equipped choice.
4. **Goal/risk:** The player spends run-earned coins to customize the game. Choosing an unaffordable item must be rejected with clear feedback.
5. **Reward/failure:** A successful purchase changes ownership/equipment and balance; a rejected purchase leaves balance, ownership, and equipped item unchanged.
6. **Progress/reopen:** Closing the shop returns to the previous safe state without starting a shot or mutating the current run.

## Mechanism Coverage Matrix

| Mechanism | Covered By | P1 Requirement | P2 / Depth |
|---|---|---|---|
| Home to play transition | M1, Loop A | First playfield tap starts a run and immediately moves the ball | Animated logo or richer start hint |
| Tap impulse causality | M2, Loop A | Each play tap visibly changes vertical and horizontal motion; tap coordinates do not aim | More nuanced tap feedback |
| Gravity, drag, friction, bounce | M2, M4, Loop A/B | Ball continues moving after taps, falls, slows, bounces, and responds to collisions | More polished shadows/trails |
| Hoop-side direction | M3, Loop A | Hoop alternates sides after score; tap push direction reverses visibly | More varied hoop entry animation |
| Valid top-down scoring | M5, Loop A | Only descending entry through the opening scores; HUD and feedback update | Clean/soft/hard scoring nuance |
| Shot timer and game over | M6, Loop B | Timer counts down, warns, and leads to locked result when not rescued by a basket | Slow-motion finish polish |
| Restart/home cleanup | M7, Loop B | Retry resets transient run state; home keeps persistent values | Better result evaluation copy or presentation |
| Pause lock | M8 | Paused run stops motion, timer, and tap impulses, then resumes unchanged | Pause menu polish |
| Coin economy | M6, M9, Loop C | Result grants coins from score; shop purchase/equip changes visible selection | Larger cosmetic catalog |
| Shop rejection | M9, Loop C | Insufficient coins do not deduct, unlock, or equip | Stronger refusal animation |
| Sound setting | M10 | Toggle persists and does not trigger gameplay | More detailed audio mix |
| Leaderboard panel | M11 | Blocking panel opens from home/result and handles entries, empty, or unavailable states | Beat-percentage and richer ranking detail |
| Persistent player data | M6, M9, M10 | Best score, coins, owned/equipped items, background, and sound survive session reload | Cross-device leaderboard sync |

## State Model

| State | Purpose | Allowed Player Actions | Locked / Rejected Actions |
|---|---|---|---|
| Home | Show court, ball, first hoop, best score, coins, start prompt, sound, shop, leaderboard | Tap playfield to start; open shop/leaderboard; toggle sound | Non-play controls must not also start play |
| Playing | Core physics and scoring loop | Tap playfield; pause; toggle sound | Shop/leaderboard overlays should not allow hidden shot input |
| Paused | Temporarily freeze an active run | Resume or return home | Ball motion, timer, and scoring input |
| Result | Show score, best score, coins, restart/home/leaderboard | Retry, home, leaderboard | Additional scoring or playfield impulses |
| Shop | Buy/equip ball skins and backgrounds | Switch category, select item, close | Starting shots; mutating run score/time; unaffordable purchases |
| Leaderboard | Show ranking/empty/unavailable panel | Close or return to previous state | Starting shots or mutating run/economy state |

## Priority Boundaries

P1 is the recognizable game: portrait court, tap-to-bounce basketball physics, hoop-side horizontal push, top-down scoring, side-switching hoops, timer failure, result/retry, pause, sound toggle, leaderboard access, persistent coins, and at least one purchasable/equippable ball skin plus background handling.

P2 may improve depth and polish with more cosmetics, richer leaderboard comparison, stronger heat effects, more elaborate shot feedback, additional background themes, vibration, and refined difficulty pacing. P2 must not introduce drag aiming, directional keys, power meters, multiplayer, team licensing, character progression, level select, or social sharing as required mechanics.
