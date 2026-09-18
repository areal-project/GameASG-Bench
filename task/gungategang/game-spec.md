# GunGateGang Gameplay Requirements

## 1. Game Overview
GunGateGang is a portrait-oriented squad runner shooter. The player controls a gun-wielding squad that continuously advances along a bridge roadway, choosing among multiple routes through lateral movement, passing through beneficial reinforcement gates, avoiding reduction gates and obstacles, while relying on automatic fire to repel enemies, shatter targets, upgrade weapons, and accumulate score.

The core loop is: start a run -> the squad automatically advances and fires -> the player adjusts the route left and right -> firepower changes targets ahead or eliminates enemies -> pass through gates to increase or decrease the squad, shatter obstacles to switch weapons, and kill enemies to score -> squad size and weapons affect subsequent survivability -> settle the run after the entire squad is lost and allow a restart. P1 must allow the player to complete this entire loop; P2 may extend deeper long-term rankings, more weapons, and more complex wave pacing.

## 2. Player Goals and Progress
The player's goal is to survive as long as possible on the endlessly refreshing road, earn a higher score, and maintain the squad's size. Score comes mainly from defeating regular enemies and bosses; squad size is both a source of combat power and a health resource. When the count reaches zero, the current run fails, showing the final score and a restart entry point.

A run has no fixed endpoint. Progress is expressed through advancing waves, rising difficulty, the appearance of enemies and bosses, weapon changes, score growth, and changes in squad size. As the situation advances, enemies become denser, bosses and obstacles become harder to handle, and the range of reinforcement and reduction gate values may also increase, continually presenting the player with route risk and reward choices.

## 3. Menu, Modes, and State Flow
After the game launches, it first enters the start screen, which needs to clearly show that the game is ready and prompt the player to begin. Clicking, touching, or pressing a key starts the game and enters the play screen; repeated triggers during startup must not create multiple concurrent runs.

The play screen shows the bridge roadway, squad, incoming targets, projectile trajectories, and heads-up information. The heads-up information includes at least the current squad count, score, and current weapon type. After the entire squad is lost, the game enters the result state, play input stops taking effect, and movement, shooting, and collisions no longer advance; the player can restart a new run from the result screen, and the new run must clear enemies, projectiles, gates, obstacles, score, weapon, and squad state from the previous run.

P1 does not require pause, level selection, a shop, or settings. If such panels are added, they must not obscure the main scene or consume input that should control the squad during play; after closing or returning, the corresponding state must be restored.

## 4. Core Input Semantics and Control Feel
The player directly controls only the squad's horizontal position, not forward movement, firing, or aiming. The squad maintains forward pressure in the lower area of the road, while enemies, gates, and obstacles ahead approach the player, creating a runner perspective.

While holding the left direction, the A key, or the left half of the touchscreen, the squad center continuously moves toward the left side of the screen; while holding the right direction, the D key, or the right half of the touchscreen, the squad center continuously moves toward the right side of the screen. After the direction is released or there is no touch, the squad stops moving horizontally, but maintains its current forward progression and automatic firing. Opposite directional inputs must produce opposite horizontal results on screen; left and right must not be reversed, and touches on both sides must not both move the squad in the same direction.

Horizontal movement has a sense of squad following: the squad center moves first, and members move toward the target position in formation; when changing direction, members visibly switch to the corresponding horizontal movement animation or posture. The squad cannot move beyond the road boundaries; when the squad is large, the boundary must be enforced according to the squad's outer edge so that some members do not visibly pass outside the traversable road.

Touch input uses the currently pressed valid touch point to determine direction; after all touch points are released, direction returns to no input. Simultaneously holding left and right on the keyboard must be handled stably, without jitter or acceleration; it may retain the last explicit direction, prioritize one side, or be treated as no horizontal movement, but the result must be predictable.

## 5. Road, Gates, and Route Choice
The road is presented with perspective, with distant targets gradually approaching and growing larger. Each wave may present one or more selectable targets, usually distributed across the left, center, and right routes. The player needs to move laterally in advance so that the squad's outer edge aligns with the target when it reaches the collision area.

Blue or positive gates indicate that passing through them increases the squad count; red or negative gates indicate that passing through them decreases the squad count. The current value must be visible on the gate. After an already-used gate is touched, it immediately becomes inactive and is removed, preventing repeated calculation within the same wave. Reinforcements cannot increase the count infinitely beyond a reasonable cap; reductions cannot lower the count below zero and only remove existing members.

Automatic fire can hit gates and change their values: beneficial gates are strengthened, harmful gates become more dangerous, and a clearly visible indication should appear when a limit is reached. Adjacent positive and negative gates can form paired left-right choices; shooting one side causes visible changes to the passable areas on both sides, reinforcing the experience that "firepower changes route rewards in advance."

Gates, obstacles, and enemies should be cleaned up after leaving the screen and no longer affect the player. New waves should avoid completely unsolvable consecutive hazard combinations; even if poor play causes damage, at least one meaningful route choice or opportunity to handle the situation with firepower should remain.

## 6. Obstacles, Weapons, and Automatic Firing
The squad periodically fires automatically toward the road ahead. Projectiles originate near each surviving member and travel along the road's perspective direction toward the distance instead of firing erratically sideways. Firing only needs to produce effective hits when a threatening or actionable target is ahead; in an empty scene, dense hit effects do not need to be shown.

Obstacles are destructible targets with durability. Their surfaces must visibly show remaining durability or equivalent feedback and identify the weapon type that may be obtained after destruction. Projectile hits reduce durability; after durability is depleted, the obstacle disappears, the squad obtains the corresponding weapon, the weapon display updates, and brief acquisition feedback appears. If the squad directly collides with an undestroyed obstacle, members are lost.

Different weapons need to produce perceptible differences, such as different rates of fire, ranges, rhythms, or firepower coverage. A basic weapon can be the default at the start; a rapid-fire weapon is suitable for continuously weakening close-range targets; a long-range or heavy weapon fires more slowly but can deal with more distant targets in advance. P1 requires at least a basic weapon and one clear upgrade obtainable through an obstacle; P2 may extend more weapon types, icon presentation, and rare drops.

The benefits and costs of automatic firing must be clear: stronger firepower makes it easier to destroy obstacles, kill enemies, or strengthen gates before collision, but the player still needs to choose routes through lateral movement; shooting cannot completely replace route judgment, and weapon changes cannot be reflected only in text without visible combat differences.

## 7. Enemies, Bosses, and Combat Risk
Regular enemies appear on the road in the distance, first advancing toward the player and then tracking the nearest squad member after drawing close. When a projectile hits a regular enemy, the enemy disappears and the score increases, accompanied by score feedback. When a regular enemy contacts a member, both the enemy and that member are removed, reducing the squad count.

Bosses appear at staged intervals, with higher health and continuously visible health feedback. After approaching the squad, a boss locks onto nearby members, must provide a clear warning before attacking, and then causes losses among members within range. The player can rely on automatic fire to continuously reduce the boss's health; defeating the boss awards a large score and removes the boss threat.

The movement of enemies and bosses must be visible; they cannot merely change the score or squad count. Tracking, approach, taking hits, death, attack warning, and post-attack cooldown should all be conveyed through scene changes or heads-up information so the player understands the source of danger.

## 8. Squad Size, Collisions, and Failure
Squad count is the core health and firepower resource. Reinforcements add more members to the formation, and the number of automatic shots should also increase as members are added; reductions, collisions with obstacles, enemy contact, or boss attacks remove members, and the count display decreases in sync.

After members are removed, the squad formation should regroup or maintain reasonable boundaries; invisible members cannot remain behind and continue shooting or colliding. All collision results must be synchronized with the scene, squad count, and subsequent firepower: losing one member should remove one visible share of firepower or at least one visible sense of squad presence.

When the last member is removed, the current run fails. After failure, no new targets are generated, firing stops, collision resolution no longer continues, and the final score and restart option are displayed. Restarting must begin again with the default count, default weapon, and zero score.

## 9. Visible Feedback and Information Synchronization
Every key player action and system result needs visible feedback: horizontal input moves the squad and its posture; firing shows projectile trajectories traveling forward; hits change target durability, gate values, enemy health, or death state; reinforcements and reductions change the actual number of members on screen; scoring updates the score and shows brief score feedback; weapon changes update the weapon display and show an acquisition prompt.

Heads-up information must remain consistent with the scene. The squad count cannot remain inconsistent with the number of members on screen; the score cannot suddenly change only at the result screen; the current weapon cannot continue displaying the old state after acquisition; boss health feedback cannot remain after the boss disappears.

Sound effects and animation are enhanced feedback. P1 may use simplified audio and visual feedback as long as the player can clearly understand hits, gate passage, weapon acquisition, damage, and failure; P2 may enhance music, layers of sound effects, character animation, and richer effects.

## 10. Failure, Rejection, and Boundary Paths
Play inputs outside the start screen should not move the squad early or produce effective combat outcomes before the game begins. After results are shown, horizontal movement, firing, and collision inputs should be rejected or made ineffective until the player chooses to restart.

Count, score, weapon, and target health must stay within reasonable bounds: count does not become negative, score does not drop to an abnormal value due to damage, target durability is not displayed as interactive after death, and processed gates do not repeatedly grant rewards or penalties. Off-screen objects and objects from the previous run cannot continue causing damage or awarding score.

When the player collides with an obstacle, enemy, or harmful gate, the loss must come from a clear object on screen rather than an unexplained deduction. If there is currently no reachable target, automatic firing may continue as visible missed shots or may temporarily stop, but it must not grant score or weapons from nothing.

## 11. P1 Scope
P1 must include: entering play from the start screen; a portrait bridge main scene; horizontal movement with the left/right keys, A/D, and left/right half-screen touch; stopping the horizontal movement trend upon release; road boundary constraints; a default squad, count display, score display, and weapon display; automatic firing and projectile trajectories; regular enemy movement, tracking, kill scoring, and contact-based member loss; reinforcement gates and reduction gates; obstacles with durability and at least one weapon acquisition; result handling after the entire squad is lost; and restarting that clears the previous run.

P1 must also include the core control-feel causal chain: sustained directional input causes same-direction screen movement, opposite input causes the opposite result, and horizontal movement stops after release; firepower hits cause visible target changes; collisions cause consistent changes to count, scene, and firepower; the play state locks after failure.

## 12. P2 and Cut Scope
P2 may include: more weapon differences and rare drops; complete boss attack animations, a health bar, and large score rewards; more complex paired-gate width changes; enemy counts, obstacle durability, and gate values that grow with waves; a final-score leaderboard or personal best; more refined sound effects, character animations, and near/far perspective presentation.

Cut scope: no story, character progression, shop purchases, level selection, online multiplayer, manual aiming, manual firing, free forward/backward movement, vehicle driving, saveable equipment, complex mission system, or fixed-endpoint completion is required. If these features are added, they cannot weaken P1's squad runner shooter loop.

---

## GDD / Design Doc (merged from design-doc.md)

# GunGateGang Design Doc

## 1. GDD Summary
GunGateGang is a portrait-oriented squad runner shooter. The player does not control forward movement or firing, but instead moves a gun-wielding squad left and right on a continuously advancing bridge roadway to choose more favorable routes, letting automatic fire handle enemies, gates, and obstacles in advance while trying to maintain a larger squad, a higher score, and stronger weapons.

The design focus is to turn "squad size is firepower and health" into a visible closed loop: the more members there are, the larger the on-screen squad, the denser the automatic fire, and the more comfortably threats ahead can be handled; after members are lost, the formation, count display, and firepower all weaken in sync. The player's main decisions come from lateral route choice rather than manual aiming, manual firing, or complex progression.

## 2. MDA Breakdown

### Mechanics
- M1. Launch, play, failure, and restart state flow: enter play from the start screen, enter results after the entire squad is lost, and allow a restart after results that clears the previous run's state.
- M2. Horizontal control feel: sustained left/right input moves the squad center toward the same side of the screen, the horizontal movement trend stops after release, left and right inputs must produce visibly opposite results, and the squad is constrained by the road boundaries.
- M3. Squad size system: reinforcements add members, damage removes members, and count is a health resource that affects subsequent firepower and formation width.
- M4. Automatic firing and projectile trajectories: surviving members periodically fire toward the road ahead; trajectories, hits, and target changes are visible, and the player does not directly aim or fire.
- M5. Gates and route rewards: positive gates increase the count, negative gates decrease the count, gates have visible values, and after passage they are resolved only once and removed.
- M6. Firepower changes gate rewards: projectile hits change gate values, making positive gates more beneficial and negative gates more dangerous, with visible indication when a limit is reached; firepower can change the passable area or reward comparison of paired gates.
- M7. Obstacles and weapon acquisition: obstacles have durability and an obtainable-weapon prompt; after projectiles destroy an obstacle, the weapon is obtained and the weapon display updates; colliding with an undestroyed obstacle causes member loss.
- M8. Weapon differences: the default weapon and at least one upgraded weapon obtained through an obstacle must have a perceptible difference in firing rhythm, range, or firepower coverage.
- M9. Regular enemy combat: regular enemies approach from the distance and track members after drawing close; kills increase the score, and on contact with a member, both disappear and the squad loses a member.
- M10. Boss combat: bosses appear periodically, have higher health and visible health feedback, attack members with a warning after approaching, and award a large score and remove the threat when defeated.
- M11. Difficulty and progress expression: a run expresses progress through wave advancement, enemy density, bosses, obstacle durability, gate value ranges, score, and weapon changes.
- M12. HUD and feedback synchronization: count, score, weapon, target durability, gate values, boss health, score feedback, and failure results must remain synchronized with scene state.
- M13. Boundaries, rejection, and invariants: count does not become negative, processed objects are not resolved repeatedly, off-screen objects and objects from the previous run no longer affect the player, and play inputs stop taking effect after results.

### Dynamics
- Before road targets approach, the player moves laterally in advance, offsetting the squad's outer edge from obstacles or enemies to avoid, or aligning it with a gate to pass through.
- Automatic fire changes the situation before collision: killing enemies raises the score, reducing obstacle durability creates an opportunity to acquire a weapon, and changing gate rewards raises or lowers a route's value.
- Squad size creates positive feedback and risk pressure: more members make it easier to produce firepower, but the squad is wider and boundaries and route choices become tighter; fewer members are safer and more flexible, but firepower decreases.
- Weapon upgrades change the judgment of "whether a target can be handled before collision," but cannot replace route choice.
- Regular enemies and bosses force the player to continually move laterally to avoid danger; bosses create periodic pressure through health feedback, approach, warnings, and area damage.
- Failure locks the current run; restarting restores the default count, default weapon, zero score, and a clean road, allowing the player to re-enter the same core loop.

### Aesthetics
- Exhilaration: increases in members, denser projectile trajectories, enemies being repelled, rising scores, and weapon upgrades should become visible quickly.
- Tension: targets continually approach, and route rewards and risks require advance judgment.
- Readability: positive and negative gates, enemies, obstacles, bosses, weapons, and the HUD must clearly convey their states without relying on player guesswork.
- Fairness: member loss, scoring, weapon acquisition, and failure all arise from visible on-screen objects and their collision/hit chains.

## 3. P1 Core Loop Executable Trajectory

### P1 Loop A: Basic Run, Movement, Combat, Reward, Failure
1. Start/reset: the player clicks, touches, or presses a key on the start screen to enter a run; the new run displays the bridge roadway, default squad, zero score, default weapon, and an interactive main scene.
2. Player input: while the player holds the left direction, A key, or left half of the touchscreen, the squad center moves toward the left side of the screen; while the player holds the right direction, D key, or right half of the touchscreen, the squad center moves toward the right side of the screen; the horizontal movement trend stops after release.
3. Continuous state change: squad members follow the center and regroup into formation without crossing road boundaries; enemies, gates, and obstacles gradually approach from the distance and grow larger; surviving members periodically fire projectile trajectories toward the road ahead when actionable targets exist.
4. Objective/risk: the player chooses to pass through positive gates and avoid negative gates and obstacles, while allowing automatic fire to weaken or eliminate enemies, targets, and gates before contact.
5. Reward/failure: killing a regular enemy increases the score and displays feedback; passing through a positive gate adds members, while passing through a negative gate, colliding with an undestroyed obstacle, or being contacted by an enemy removes members; member changes must be synchronized with the formation, count HUD, and firepower presentation.
6. Progress/restart: score, squad size, weapon, and wave pressure continue to advance; when the last member is removed, the game enters results, stops further movement, firing, generation, and collisions, and displays the final score and restart entry point; restarting restores the default count, default weapon, zero score, and a clean scene.

### P1 Loop B: Gate And Obstacle Route Choice
1. Start/reset: during a run, positive gates, negative gates, or obstacles with durability appear on the road ahead.
2. Player input: the player moves left and right to choose a route for the squad to align with, and maintains or adjusts position before the target approaches.
3. Continuous state change: automatic projectiles that hit gates change gate values; hits on obstacles reduce durability; as targets approach the collision area, their size and threat become more apparent.
4. Objective/risk: positive gates increase squad size, negative gates remove members, and undestroyed obstacles cause losses; the player needs to decide whether to risk passing through a high-reward route or avoid a high-risk target.
5. Reward/failure: after passing through a positive gate, members are added and the gate becomes inactive; after passing through a negative gate, members are removed and the gate becomes inactive; destroying an obstacle awards the corresponding weapon and updates the weapon display, while colliding with an undestroyed obstacle causes member loss.
6. Progress/restart: a larger squad and better weapons improve subsequent handling capability; member loss reduces firepower and moves the player closer to failure; after the entire squad is lost, the game enters results and can be restarted.

### P1 Loop C: Weapon Upgrade And Firepower Feedback
1. Start/reset: the player enters a run with the default weapon, and the HUD displays the current weapon.
2. Player input: the player moves left and right to make the squad's firepower cover an obstacle ahead, or avoids an obstacle that cannot be destroyed in time.
3. Continuous state change: projectile trajectories continuously hit the obstacle, lowering its durability or equivalent feedback; if durability reaches zero, the obstacle disappears and triggers weapon acquisition feedback.
4. Objective/risk: the player wants to destroy the obstacle before collision and obtain the weapon; if firepower is insufficient or the route is wrong, the undestroyed obstacle causes member loss.
5. Reward/failure: after acquiring the upgraded weapon, the weapon display updates and its firing rhythm, range, or coverage effect shows a visible difference; if the squad is damaged, count and firepower decrease in sync.
6. Progress/restart: the upgraded weapon improves the ability to handle subsequent enemies, gates, and obstacles; if a mistake causes the count to reach zero, the game enters results and can be restarted.

## 4. P2 Depth Loops
- Boss pressure loop: after waves advance, a boss appears; the player keeps the squad alive through lateral movement while automatic fire reduces the boss's health; after approaching, the boss shows an attack warning and causes area losses; defeating it awards a large score. This loop strengthens periodic climaxes, but the ordinary enemy, gate, obstacle, and weapon loop remains the P1 qualification threshold.
- Difficulty growth loop: enemy count, obstacle durability, gate value range, and boss health increase as the situation advances, making a high count and good weapons more important.
- Long-term score loop: the final score may enter a personal best or leaderboard to express a long-term goal, but cannot replace failure, restart, and the core gameplay within a run.
- Presentation enhancement loop: richer sound effects, animations, effects, weapon icons, and near/far perspective can improve feedback, but cannot change P1's input semantics and state loop.

## 5. Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Launch, play, failure, and restart | P1 | Click, touch, or press a key on the start screen; choose restart after results | Enter the main scene; failure displays the final score; after restart, count, score, weapon, enemies, projectiles, gates, and obstacles return to a new-run state | Repeated starts cannot create multiple runs; play input is ineffective after results; objects from the previous run cannot continue to score or cause damage |
| M2 Horizontal control feel | P1 | Sustain left/right keys, A/D, or left/right half-screen touch, then release input | The squad center moves toward the same side of the screen, the horizontal movement trend stops after release, and members follow and regroup into formation | Left and right cannot be reversed; touches on both sides cannot move in the same direction; the squad cannot cross road boundaries |
| M3 Squad size system | P1 | Pass through gates, collide with threats, or be attacked by enemies or bosses | On-screen member count, HUD count, formation width, and sense of firepower change in sync | Count does not become negative; invisible members cannot continue shooting or colliding |
| M4 Automatic firing and projectile trajectories | P1 | Enter play with an actionable target | Surviving members fire projectile trajectories toward the road ahead, and hits cause target state changes | The player does not need to fire manually; an empty scene cannot grant score or weapons from nothing |
| M5 Gates and route rewards | P1 | Move laterally through a positive or negative gate | Positive gates add members, negative gates remove members, and gates are removed or become inactive after resolution | Used gates cannot be resolved repeatedly; reductions do not go below zero |
| M6 Firepower changes gate rewards | P1 | Automatic projectiles hit a gate | Gate values visibly change, limit states have an indication, and the route value of paired gates can be changed in advance | Hits must cause gate feedback to change; hidden values alone cannot change |
| M7 Obstacles and weapon acquisition | P1 | Automatic projectiles hit an obstacle; the squad collides with an obstacle | Durability decreases; destroying it grants a weapon and updates the HUD; collision before destruction causes member loss | An obstacle cannot continue colliding or dropping rewards after death/destruction |
| M8 Weapon differences | P1 | Destroy an obstacle to obtain at least one upgraded weapon | The weapon display updates, and firing rhythm, range, or coverage shows a perceptible change relative to the default weapon | The weapon cannot change only in text without a combat difference |
| M9 Regular enemy combat | P1 | An enemy approaches; automatic projectiles hit; an enemy contacts a member | Enemy movement/tracking is visible; kills add score; after contact, the enemy and member are removed | Score must come from a visible enemy being killed; contact losses must come from a visible threat |
| M10 Boss combat | P2 | Encounter a boss after waves advance | Boss health feedback, approach, warning attack, area member loss, and high score on defeat are visible | Boss health feedback cannot remain after the boss disappears; attacks require a warning |
| M11 Difficulty and progress expression | P2 | Continue surviving and advancing waves | Enemy density, obstacle durability, gate values, boss pressure, or score growth reflects progress | Difficulty growth cannot generate completely meaningless or unsolvable consecutive hazard combinations |
| M12 HUD and feedback synchronization | P1 | Any scoring, member change, weapon acquisition, target hit, or failure | The HUD remains consistent with scene state, and brief feedback helps explain results | Score cannot suddenly change only at results; weapon and boss feedback cannot linger |
| M13 Boundaries, rejection, and invariants | P1 | Input at invalid times, post-result input, off-screen objects, or repeated collisions | State remains stable or rejects the action; after cleanup, targets no longer affect the player | Count, score, health, durability, and result state remain within reasonable bounds |

## 6. Mechanic Coverage Matrix

| Game Spec Area | Design Mechanic | P1/P2 | Required player-visible coverage |
|---|---|---|---|
| Menu, modes, and state flow | M1, M13 | P1 | Closed loop of start, play, results, and restart; end-state lock; new-run cleanup |
| Core input semantics and control feel | M2 | P1 | Same-side horizontal movement, stopping on release, opposite inputs producing opposite results, boundary constraints, squad following |
| Road, gates, and route choice | M5, M6, M11 | P1/P2 | Targets approach on a perspective road; positive/negative gate values; firepower changes rewards; paired gates and difficulty growth may provide depth |
| Obstacles, weapons, and automatic firing | M4, M7, M8 | P1 | Automatic projectile trajectories, target hits, obstacle durability, weapon acquisition, and weapon differences |
| Enemies, bosses, and combat risk | M9, M10 | P1/P2 | Regular enemy movement and tracking, kill scoring, contact-based member loss; bosses as P2 periodic pressure |
| Squad size, collisions, and failure | M3, M13 | P1 | Count as a health and firepower resource; collision-based member loss; results after the entire squad is lost |
| Visible feedback and information synchronization | M12 | P1 | Synchronization of HUD, scene members, projectile trajectories, hits, score, weapon, and failure state |
| P2 and cut scope | M10, M11 and optional presentation enhancements | P2 | More weapons, boss details, leaderboards, audio/animation, and more complex waves; no shop, level selection, manual firing, manual aiming, or fixed endpoint required |

## 7. P1 Acceptance Boundary
The P1 qualification threshold is not merely a shell with the same theme, but a recognizable squad runner shooter loop that the player can complete: after starting, the player sees a portrait bridge and squad; real left/right keys, A/D, and left/right half-screen touch move the squad horizontally in the same direction and stop on release; automatic fire can handle enemies, gates, and obstacles; positive and negative gates can add and remove members; obstacles can be destroyed and grant at least one distinct weapon; regular enemies can move, be killed for score, or cause member loss on contact; and after the count reaches zero, results are shown and the game can be restarted.

P1 may simplify audio, art, and boss depth, but cannot omit the core causal chain: input causes movement, firepower causes target changes, collisions cause count and scene changes, count affects firepower and failure, and restarting clears old state.

## 8. Explicit Cut Scope
No story, character progression, shop purchases, level selection, online multiplayer, manual aiming, manual firing, free forward/backward movement, vehicle driving, saveable equipment, complex mission system, or fixed-endpoint completion is required. If the game adds such content, it can only serve as an additional system and cannot obscure or weaken P1's main squad runner shooter loop.
