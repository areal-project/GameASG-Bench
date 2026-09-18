# Mini Tanks Gameplay Requirements

## Game Positioning

Mini Tanks is a 2D side-view turn-based artillery game. Two tanks stand on opposite sides of randomly undulating terrain that can be changed by explosions, and players attack their opponent by selecting ammunition and fine-tuning the barrel angle and firing power. The fun of the game comes from predicting parabolic trajectories, terrain obstruction and destruction, positioning decisions created by limited movement, and exaggerated chain-reaction feedback produced by multiple weapons.

The core experience consists of a 2D battlefield, tactile physics-based aiming, turn-based combat, ammunition selection, and menu state flow. P1 must allow the player to complete the full core loop: enter combat, allocate or obtain ammunition, adjust aim, fire, see the projectile trajectory and hit feedback, see the score change, switch turns, reach final results, and return to the menu.

## Priority Scope

P0 must launch successfully, display primary interfaces such as the title, battlefield, and results, prevent primary buttons or touch areas from being incorrectly obscured, and ensure that the combat view is not blank.

P1 must include single-player battle, practice mode, ammunition selection, angle and power controls, firing, projectile flight, terrain destruction, explosions, damage scoring, limited movement, AI turns, game over, and restart or return to menu.

P2 includes local two-player battle, leaderboard display and submission, an ammunition library, instructions/update panels, music and sound effects, title animation, a fireworks victory presentation, a rich selection of special weapons, and long-term balance depth. If P2 features are temporarily excluded from delivery, they must remain within an explicitly defined cut scope and must not affect the P1 core loop.

## Menus and Modes

The title screen provides entry points for single-player battle, local two-player, practice, the ammunition library, and information panels. Entering combat should not jump directly to the firing phase; the player should first complete ammunition preparation, or receive usable ammunition directly in practice mode.

In single-player battle, the player controls the tank on the left, while the computer on the right automatically selects ammunition, moves, or aims and fires. Practice mode always keeps the player in control, provides a complete space for test-firing weapons, does not submit to the leaderboard, and does not interrupt the player's practice with opponent actions. Local two-player mode lets two players take turns controlling the two tanks, with both sides able to aim, move, switch ammunition, and fire.

When panels such as the ammunition library, instructions, or update information are open, they should block or pause interaction with the corresponding menu; after they close, the interface should return to its original menu level. The in-combat ammunition selection pop-up may be used only during the aiming phase, and confirming or canceling should return to the combat view.

## Combat Start and Ammunition Preparation

Before a standard battle starts, generate a limited ammunition pool from which both sides alternately select visible cards until each has obtained a set of weapons usable in that battle. In single-player mode, the enemy's selections can be completed automatically; in local two-player mode, the second player needs to select manually. A random allocation entry point may also be provided, immediately creating both sides' ammunition inventories after randomization.

After combat begins, the interface should continuously display the current turn, current weapon, both sides' scores, and remaining weapon counts. Each shot consumes the currently used ammunition by default; practice mode does not consume ammunition. If the current player has no ammunition, play should skip to the side that can act; when both sides have exhausted their ammunition, proceed to results.

## Core Input Semantics and Feel

Aiming is a direction-sensitive core input. When the player drags or clicks the vertical angle control, moving the control point upward should increase the barrel angle, while moving it downward should decrease the barrel angle; the numeric value and barrel direction must change in sync. While the player holds the up/down keys or equivalent keys on the keyboard, the barrel should rotate continuously and smoothly, stopping when the keys are released. The angle must cover a full circular range, allowing the player to point the barrel left, right, up, or down.

Power is controlled through continuous input. When the player drags or clicks the vertical power control, moving the control point upward should increase power, while moving it downward should decrease power; while the player holds the right/left keys or equivalent keys on the keyboard, power should continuously increase or decrease, retaining its last value when the keys are released. Higher power should give the projectile greater initial velocity and make the parabola travel farther or more forcefully; lower power should make the landing point nearer.

Firing responds only during the aiming phase. After the player clicks the fire button or presses the fire key, the current tank fires the current weapon in the direction of its barrel, and combat enters the flight/effect phase; during this phase, angle, power, movement, and ammunition switching can no longer alter that projectile. After leaving the barrel, the projectile should be affected by gravity to form a visible arc, leave a flight trail or movement feedback, and trigger a result when it encounters terrain, a tank, a boundary, or a weapon-specific condition.

Movement is an action with limited benefit each turn. When the player clicks move left/right, the current tank moves a short distance in the corresponding screen direction and settles onto the current terrain surface, reducing the number of remaining moves. Opposite directions should produce opposite screen displacement; when the battlefield boundary has been reached, all moves have been used, or a special ground effect restricts movement, the movement request should be rejected without incorrectly consuming resources.

## Visible Feedback Chain

When angle and power are adjusted, the barrel, control values, and trajectory preview should update immediately. The trajectory preview should start from the current muzzle and broadly convey the flight trend under the current power, angle, and gravity; it is displayed only while the current controllable player is aiming.

After firing, the player should see the projectile or weapon effect move across the screen. When it hits terrain, explosion, particle, or shake feedback appears, leaving a visible crater, gap, mound, perforation, or other change in the terrain. When it hits near a tank, explosion feedback should appear, the tank should be pushed away or fall, the score should increase, and the tank should then resettle onto the terrain.

When a projectile leaves the battlefield or does not cause a valid hit, the shot should still end and proceed to a turn switch rather than becoming stuck in the flight phase. The turn should not switch early before all persistent effects end; only after the persistent effects end should the next turn begin.

## Terrain, Physics, and Risk

The battlefield terrain is randomly generated each game and must contain at least noticeable elevation changes, obstructions, or usable slopes, so the same angle and power produce different outcomes in different situations. Tanks spawn on the terrain surface on the left and right sides and cannot begin suspended in the air.

Explosions should change the terrain, affecting subsequent aiming, movement, and landing points. After the terrain beneath a tank is hollowed out, the tank may fall and settle back onto the surface; a tank pushed by an explosion should remain within the battlefield. Terrain changes are a primary source of risk and strategy: players can either strike the tank directly or destroy the ground beneath it or obstructing terrain to create an opportunity for the next turn.

Projectile physics should convey that “firing direction and power determine initial motion, while gravity gradually pulls the trajectory downward.” A barrel pointing in the opposite direction should launch the projectile toward the opposite horizontal side; an upward high angle is more like a lobbed shot, while a low angle is more like a direct shot. Special weapons may alter this rule, but must have a visible reason, such as splitting, bouncing, guidance, persistent areas, vertical strikes, or delayed bursts.

## Weapon System

P1 requires at least two clearly distinct weapon types: a standard shell and a heavy explosive shell. The standard shell provides a basic parabolic hit, while the heavy weapon provides a larger explosion and more terrain destruction. Multi-shot, bouncing, spread, guided, persistent burning, descending strikes, laser/beam, terrain generation, position swapping, turn skipping, shields, special summons, and similar effects belong to P2 depth.

Every usable weapon must be distinguishable in ammunition selection and the current weapon display, and must produce a visible result matching its category after firing. P2 weapons do not need to be retained completely one by one, but if a weapon type appears, both its cost and benefit must be reflected: it consumes one unit of ammunition, produces a unique trajectory or effect, may increase damage/control/terrain impact, and may also be wasted because of incorrect aiming.

The ammunition inventory is a combat resource. Players cannot select weapons they do not have in their inventory, cannot change weapons outside the aiming phase, and cannot reuse consumed ammunition. Practice mode may relax consumption restrictions, but should still clearly display the current weapon.

## AI and Opponent Behavior

In single-player battle, the enemy should be able to complete its turn automatically: make a small movement if necessary, select available ammunition, rotate its barrel, and then fire. The enemy does not need to aim accurately every time, but its shots should show intent toward the player rather than firing randomly in irrelevant directions.

During the enemy's turn, the player's firing, movement, ammunition switching, and aiming inputs should be disabled or have no effect. After the enemy completes flight and persistent effects, the turn should return to the player; if the enemy has no ammunition, it should be skipped or the game should proceed to results.

## Scoring, Victory/Defeat, and Progress

The game uses score to determine the final result. The attacking side gains points when its explosion or weapon effect hits near the opposing tank; better hits, stronger weapons, or more successful persistent effects may award more points. Accidentally hitting oneself or landing ineffectively should not award the attacker points for attacking the opponent.

Standard battles and local two-player battles reach results after both sides have exhausted their ammunition: a higher player score means victory, a lower score means defeat, and equal scores mean a draw. When the game ends, combat input is locked and the final scores, victory/defeat result, and entry points to return to the menu/restart are displayed. Standard single-player battle may display a leaderboard and rank; practice and local two-player should not submit to the leaderboard.

A short presentation may appear before or after victory or defeat, such as fireworks, sound effects, or emphasis on the outcome, but it cannot permanently prevent returning to the menu. Returning to the menu should clear old projectiles, persistent effects, ammunition, scores, and the result layer, and redisplay the title screen from which a new game can be entered.

## Failure, Rejection, and Stability Rules

Clicking fire, dragging angle/power, moving, or switching ammunition outside the aiming phase should be rejected or have no effect, and cannot change the projectile in flight, current turn, or inventory. Player input during the enemy's turn should likewise be rejected.

Paths such as having insufficient moves, reaching a boundary, being trapped by an effect that restricts movement, selecting nonexistent ammunition, having an empty ammunition pool, or continuing to fire after results should all be handled stably without errors, deadlocks, or negative inventory. When a projectile reaches an abnormal position, leaves the boundary, or a persistent effect ends, the current shot should end safely and advance the state.

During combat, scores should remain nonnegative, ammunition counts should not fall below zero, only one side should be able to act on the current turn, and scores should not continue changing after results. When an overlay panel is open, the underlying combat or menu should not be triggered accidentally; interaction state should be restored when the panel closes.

## Cut Scope

P2 may be cut: complete one-by-one retention of dozens of unusual weapons, real online leaderboard submission, title background animation, full music rotation, all sound effects, long descriptions in the ammunition library, update logs, complex decorative stickers, rare Easter eggs, and social platform capabilities.

The P1 core that cannot be cut is: a visible 2D battlefield, two tanks, variable terrain, turn-based aiming and firing, angle/power input semantics, physical projectile trajectories, explosive destruction, hit scoring, ammunition consumption, AI or second-player turns, results, and return to menu.

---

## GDD / Design Doc (merged from design-doc.md)

# Mini Tanks Design Document

## Design Goals

Mini Tanks is a lighthearted and exaggerated 2D side-view turn-based artillery game. Players control tanks on randomly undulating terrain that can be changed by explosions, select ammunition, adjust the barrel angle and firing power, and use parabolic projectiles to strike their opponent and compete for a higher score.

The design focus is to make the short-turn sequence of “aim, predict, fire, see the result” a clear closed loop: every player action should immediately affect the barrel, power value, trajectory preview, tank position, or ammunition state; after firing, the player should see the projectile fly, an explosion, terrain changes, the tank being affected, the score change, and the turn advance.

## MDA

### Mechanics

M1. Menu and mode flow: enter single-player battle, local two-player, practice, the ammunition library, and information panels from the title screen; an open overlay panel blocks accidental input to the underlying layer, and closing it restores the original level.

M2. Combat start and ammunition preparation: standard battles complete ammunition preparation before entering combat; players take turns selecting from the visible ammunition pool, the opponent may select automatically in single-player mode, or random allocation may be used to begin immediately.

M3. Angle aiming: the player continuously adjusts the barrel direction through a vertical angle control or equivalent keys. Moving the control point upward increases the angle, and moving it downward decreases the angle; the barrel direction, numeric value, and trajectory preview remain synchronized.

M4. Power control: the player continuously adjusts firing power through a vertical power control or equivalent keys. Moving the control point upward increases power, and moving it downward decreases power; the last power is retained on release, and high power makes the projectile travel farther or more forcefully.

M5. Firing and trajectory: firing is permitted only during the aiming phase. The current tank fires the current weapon in the barrel direction, the projectile forms a visible arc under gravity, and a result is triggered upon encountering terrain, a tank, a boundary, or a weapon condition.

M6. Terrain destruction and tank grounding: explosions change the battlefield terrain, leaving visible changes such as craters, gaps, mounds, or perforations; after being affected by an explosion or terrain change, tanks should resettle onto the terrain and remain within the battlefield.

M7. Hits, damage, and scoring: the attacking side gains points for hitting near the opposing tank; better hits or stronger effects may give greater rewards. Ineffective landing points or accidentally hitting oneself should not award points for attacking the opponent.

M8. Limited movement: the player on the current turn may request movement to the left or right, and the tank moves a short distance in the corresponding screen direction and settles onto the terrain surface, reducing the number of remaining moves. Boundaries, exhausted moves, or restricting effects reject movement.

M9. Turn control and input locking: the current projectile cannot be adjusted further, nor can the player move or switch ammunition, during the flight or persistent-effect phase; the turn switches only after all persistent effects end. During the enemy's turn, player combat inputs are disabled or have no effect.

M10. AI and local two-player: in single-player battle, the opponent automatically selects ammunition, may move, aims, and fires, with shots showing intent toward the player. In local two-player, two players alternate control of both sides.

M11. Practice mode: practice always keeps the player in control, provides a complete test-firing space and a clear current weapon display, does not submit to the leaderboard, and is not interrupted by opponent actions.

M12. Results and restart: standard battles and local two-player compare scores and reach results after both sides exhaust their ammunition, displaying victory, defeat, or draw, locking combat input, and providing entry points to return to the menu or restart. Returning to the menu should clear old projectiles, persistent effects, ammunition, scores, and the result layer.

M13. Weapon system: P1 includes at least two clearly distinct weapons: a standard shell and a heavy explosive shell. P2 may add richer effects such as multi-shot, bouncing, spread, guidance, persistent areas, vertical strikes, beams, terrain generation, position swapping, skipping, shields, or summons.

M14. Supplemental presentation: P2 may include leaderboard display and submission, an ammunition library, instructions/update panels, music and sound effects, title animation, a fireworks victory presentation, and more complete special-weapon depth.

### Dynamics

D1. Before firing, the player makes tactical choices using angle, power, ammunition, and limited movement: lob over terrain, fire directly at a low angle, move first to find an angle, or use a heavy explosion to expand the destruction.

D2. Terrain changes alter positioning, obstruction, and landing points in subsequent turns, so each shot is both an attempt to score and a way to create an opportunity or risk for the next turn.

D3. The ammunition inventory forces the player to decide when to use standard weapons, heavy weapons, and optional special weapons; incorrect aiming wastes ammunition, while practice mode reduces the pressure of consumption.

D4. Turn locking forces the player to accept the outcome after firing and wait for the projectile and persistent effects to end; this reinforces prediction and dramatic feedback.

D5. The AI or second player counterattacks using the same terrain, ammunition, and scoring rules, requiring the player to trade off between attacking and avoiding exposure.

### Aesthetics

A1. Lighthearted exaggeration: tanks, projectiles, explosions, and victory/defeat feedback should feel toy-like and dramatic, rather than pursuing the oppressive feel of realistic warfare.

A2. Readable strategy: the player should be able to read the barrel direction, power trend, available ammunition, current turn, both sides' scores, remaining moves, and result state.

A3. The fun of physics prediction: firing direction, power, and gravity jointly determine the trajectory, allowing the player to build a causal understanding from the preview and actual trajectory.

A4. Chaotic surprises: special weapons and terrain destruction can produce exaggerated chain-reaction feedback, but cannot break the P1 turn, scoring, ammunition, and result rules.

## P1 Core Loop Executable Traces

### Trace A: Standard Single-Player Battle Core Loop

Start/reset: The player enters single-player battle from the title screen and first sees the ammunition preparation interface. The player obtains ammunition for the game through selection or random allocation, and the opponent also obtains ammunition. When combat begins, the 2D battlefield, two tanks, current turn, current weapon, both sides' scores, remaining moves, angle/power controls, and firing entry point are displayed.

Player input: On the player's turn, the player selects currently available ammunition; clicks move left/right as needed, moving the tank in the corresponding screen direction and keeping it grounded on the terrain; continuously adjusts the barrel through the angle control or equivalent keys; continuously adjusts firing power through the power control or equivalent keys; and clicks fire or presses the fire key to confirm.

Continuous state changes: Movement changes the tank's horizontal position and reduces the number of remaining moves; angle changes synchronize the barrel direction, angle value, and trajectory preview; power changes synchronize the power value and the range of the trajectory preview. After firing, the current ammunition is consumed, combat enters the flight/effect phase, and the projectile leaves in the direction of the muzzle and falls under gravity to form a visible arc; during this phase, angle, power, movement, and ammunition switching no longer alter this projectile.

Goal/risk: The goal is to hit near the opposing tank and obtain a higher score with limited ammunition. Risks include terrain obstruction, misjudging power or angle, wasting ammunition, exhausting moves, the projectile leaving the battlefield, hitting an ineffective location, destroying terrain in a way that worsens subsequent positioning, or making it easier for the opponent to hit on the next turn.

Reward/failure: When a shot hits near the opponent, explosion and tank feedback appear, terrain changes, and the attacking side's score increases; hitting terrain without causing valid damage should still leave terrain changes or explosion feedback, but should not award points for attacking the opponent; leaving the battlefield or the end of a persistent effect must also safely end the current shot.

Progress/restart: After persistent effects end, the turn switches to the opponent. The single-player opponent automatically selects ammunition, may move, aims, and fires toward the player; after the opponent's effect ends, control returns to the player. When both sides have exhausted their ammunition, the game proceeds to results, displays the final scores and victory/defeat/draw, locks combat input, and allows returning to the menu or restarting. After returning to the menu, the old game's state is cleared and the player can start a new game.

### Trace B: Practice Test-Firing Loop

Start/reset: The player enters practice mode from the title screen and proceeds directly to a controllable battlefield, with usable weapons available for test-firing and the turn remaining in a player-controllable state.

Player input: The player selects a weapon, adjusts angle and power, moves if necessary, and then fires.

Continuous state changes: After firing, the same projectile trajectory, explosion, terrain change, tank feedback, and score display appear; when the current effect ends, the player returns to an aiming state without entering an enemy turn that interrupts practice.

Goal/risk: The goal is to understand how different ammunition, angles, power levels, and terrain interact. The risk primarily comes from incorrect aiming causing an ineffective result or terrain changes affecting the next test shot, but practice should not be interrupted by ammunition consumption or leaderboard submission.

Reward/failure: Valid hits may still display hit feedback and score changes; ineffective landing points still complete explosion or out-of-bounds handling. Failure in practice does not enter standard battle results.

Progress/restart: After the effect ends, the player's turn continues; the player can repeatedly switch ammunition, adjust, and test-fire, or return to the menu to begin another mode.

### Trace C: Local Two-Player Turn Loop

Start/reset: Two players enter local two-player and proceed to combat after completing ammunition preparation for both sides. Each side has its own inventory and score.

Player input: The current player uses the same movement, ammunition switching, angle, power, and firing actions as in single-player.

Continuous state changes: Firing consumes the current player's ammunition, and the projectile and explosion are resolved under the same physics and terrain rules. After the effect ends, the other player takes a turn controlling the other tank.

Goal/risk: The two players take turns competing for a higher score, with risks from wasted ammunition, incorrect positioning, terrain being exploited by the opponent, and exhausted movement resources.

Reward/failure: Hitting near the opponent adds points for the current attacking side; ineffective or self-damaging paths should not award points for attacking the opponent. Neither side can alter a shot in progress outside its own aiming phase.

Progress/restart: After both sides exhaust their ammunition, compare scores, display victory, defeat, or draw, do not submit to the leaderboard, and allow returning to the menu or restarting.

## Input Feel Causal Chains

Angle causal chain: Continuously adjusting upward increases the angle, synchronously changes the barrel direction and angle value, and raises or redirects the trajectory preview accordingly; continuously adjusting downward decreases the angle. After release, the angle stops changing. When the barrel faces the opposite horizontal side, the projectile should fly toward the opposite horizontal side; a high angle is more like a lobbed shot, while a low angle is more like a direct shot.

Power causal chain: Continuously adjusting upward increases power, making the trajectory preview farther or more forceful; continuously adjusting downward decreases power, bringing the landing point nearer. After release, power retains its last value. High power cannot merely increase a number; it must affect the projectile's initial velocity and visible flight result.

Firing causal chain: The fire key takes effect only during the aiming phase; once activated, it locks the current angle, power, weapon, and position, and the projectile leaves in the barrel direction while gravity changes its trend downward. The turn advances only after the projectile collides, leaves the boundary, or the weapon's persistent effect ends.

Movement causal chain: Left/right movement requests produce opposite screen displacement and cause the tank to resettle onto the terrain; every valid movement reduces the remaining count. When a boundary, insufficient remaining moves, or a restricting effect causes rejection, movement resources should not be incorrectly consumed.

Risk causal chain: An incorrect angle, incorrect power, or incorrect position causes an ineffective landing point, wastes ammunition, or creates an opportunity for the opponent; after an explosion changes the terrain, subsequent movement, landing points, and obstruction relationships change accordingly.

## Mechanics Coverage Matrix

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Menu and mode flow | P0/P1 | Click the single-player, local two-player, practice, library, or information entry point | The corresponding interface is displayed; the battlefield is operable after entering combat; closing an overlay returns to the original level | An overlay must not permit accidental input to the underlying layer; after entering playing, no menu layer should remain that blocks the battlefield |
| M2 Ammunition preparation | P1 | Select ammunition before a standard battle or use random allocation | Both sides form their ammunition inventories for this game; combat begins with the current weapon and remaining weapon information displayed | Standard firing should not begin before preparation is complete; inventory cannot be negative |
| M3 Angle aiming | P1 | Drag/click the angle control or continuously hold equivalent keys | The barrel, angle value, and trajectory preview change in sync | Input outside the aiming phase or during the enemy's turn must not change the current shot |
| M4 Power control | P1 | Drag/click the power control or continuously hold equivalent keys | The power value and trajectory preview range change in sync; flight distance is affected after firing | Values must not continue drifting after release; input outside the aiming phase must not alter a projectile in flight |
| M5 Firing and trajectory | P1 | Click fire or press the fire key during the aiming phase | The projectile leaves in the barrel direction and forms a visible arc affected by gravity | Cannot fire again or switch ammunition during flight; out-of-bounds/abnormal positions must end safely |
| M6 Terrain destruction | P1 | A projectile or weapon effect hits the terrain | Explosion feedback and terrain shape changes; tanks resettle onto the terrain when necessary | Tanks must not remain permanently suspended or out of bounds after terrain changes |
| M7 Hit scoring | P1 | An explosion or weapon effect hits near the opposing tank | Hit feedback, effect on the tank, and an increase in the attacking side's score | Self-damage, ineffective landing points, or hitting one's own side must not award points for attacking the opponent; scores are nonnegative |
| M8 Limited movement | P1 | Click move left/right during the current turn | The tank moves left/right on the screen and remains grounded on the terrain; remaining moves decrease | Reject when moves are exhausted, at a boundary, or under a restricting effect, without incorrectly deducting resources |
| M9 Turn control | P1 | A shot ends, a persistent effect ends, or one side has no ammunition | The turn switches to the next side; player input is disabled during the enemy's turn | Only the current side can act at any one time; the turn must not switch early before persistent effects end |
| M10 AI/two-player opponent | P1 | Single-player enters an enemy turn, or local two-player reaches the second player's turn | The AI automatically completes an intentional shot; the other side can be operated manually in local two-player | The AI should not continuously fire randomly in irrelevant directions; the player should not control the enemy's turn |
| M11 Practice mode | P1 | Click the practice entry point and test-fire | The player remains in control and can switch ammunition, aim, move, fire, and see effects | Does not submit to the leaderboard; practice is not interrupted by enemy actions |
| M12 Results and return | P1 | Both sides exhaust their ammunition, or return is selected from results | The terminal layer displays the final scores and victory/defeat/draw; returning to the menu clears the old game | Combat input is locked after results; old projectiles, effects, ammunition, and scores do not remain after returning |
| M13 P1 weapon distinction | P1 | Select and fire a standard shell or heavy explosive shell | The standard shell provides a basic parabolic hit; the heavy weapon produces a larger explosion and more terrain destruction | Weapons outside the inventory cannot be selected; consumed ammunition cannot be reused |
| M13 P2 special-weapon depth | P2 | Select and fire an optional special weapon | Effects matching the category appear, such as trajectories, areas, splitting, bouncing, guidance, or vertical strikes | If a special weapon type is included, its consumption, unique effect, and possibility of being wasted must all be reflected |
| M14 Supplemental presentation | P2 | Open the library/instructions/updates, or view the leaderboard after standard single-player results | Panels, leaderboard, sound effects, title animation, or victory presentation are visible | Supplemental presentations cannot permanently prevent returning to the menu; practice and local two-player do not submit to the leaderboard |

## Progress, State, and Feedback

Combat state should be organized around player-understandable phases: menu, ammunition preparation, aiming, flight/effect, and results. The current phase determines which inputs are available; the player cannot be allowed to alter an already-fired projectile during flight or continue changing the score after results.

The HUD should continuously convey the current turn, current weapon, both sides' scores, remaining weapons or available ammunition, remaining moves, angle, and power. The HUD is not decorative; it must remain synchronized with the actual combat state.

The visible battlefield should always contain two tanks, terrain, and projectile/effect feedback. The combat view cannot be blank; projectiles, explosions, terrain changes, and feedback showing tanks grounded on the terrain are part of the core gameplay.

## Cuts and Priorities

P1 cannot be cut: a visible 2D battlefield, two tanks, randomly undulating terrain, destructible terrain, angle and power input semantics, physical projectile trajectories, standard and heavy weapon types, ammunition consumption, limited movement, AI or second-player turns, hit scoring, results, and return to menu.

P2 may be cut or downgraded: complete one-by-one retention of many special weapons, real online leaderboard submission, title background animation, full music rotation, all sound effects, long ammunition-library descriptions, update logs, complex decorative stickers, rare Easter eggs, and social platform capabilities.

If P2 is included, it must comply with the P1 state machine and resource rules: special weapons cannot bypass ammunition consumption, turn locking, nonnegative scores, terminal-state locking, or return-to-menu cleanup.
