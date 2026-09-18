# Tankor Arena Gameplay Requirements

## Objectives and Core Loop

Tankor Arena is a retro neon wireframe tank arena game. The player drives a tank within an enclosed arena, moving, turning, aiming, and firing, using obstacles and distance to evade enemy fire, and advancing to higher levels after destroying all enemy tanks in the current level. The core loop is: enter the battlefield -> observe enemies and obstacles -> maneuver to evade and adjust orientation -> fire to hit enemies or obstacles -> gain score, take risks, or clear cover -> level up after eliminating all enemies, or see the results and restart after running out of lives.

The P1 acceptance threshold must allow the player to complete a playable tank-combat loop: a visible battlefield, a drivable tank, aiming and firing, enemies that move and attack, projectiles that can hit enemies or obstacles, synchronized health and score feedback, level progression, and restarting after failure. P2 depth includes more complete power-up rotations, hidden power-ups, boss levels, leaderboards, tuning/editor modes, distant atmospheric units, and more detailed spatial audio.

## Battlefield and Camera

The game's main scene is a 3D tank arena with a neon wireframe look on a black background. The ground should have a readable grid or boundary treatment so the player can judge direction, distance, and obstacle locations; the arena contains obstacles that can block movement and lines of fire, and projectiles can progressively damage or destroy them, with an explosion, fragmentation, or visible feedback of equivalent intensity when destroyed.

By default, the player observes their tank from a third-person chase view and can also switch to a first-person/turret view. The chase view should clearly show the player's tank, the battlefield ahead, and incoming fire; the first-person view should emphasize reticle aiming and head-on firefights. Switching views must not change movement and firing semantics, only the manner of observation.

A minimap or equivalent battlefield overview is P1: the player should be able to see the approximate relative positions of themselves, enemies, and major obstacles, updated in sync with combat movement. The center of the screen should provide a reticle or aiming feedback; when the player aims at an attackable target or obstacle, there should be a clear sense of locking on, highlighting, or prompting to help determine what the shot may hit.

## Input Semantics and Control Feel

Desktop input: the forward key or up direction accelerates the tank forward along its current facing, while the reverse key or down direction moves the tank backward along its current rear direction; left/right input continuously turns the hull in the corresponding direction. Pressing the fire key once triggers one firing cycle; the pause key opens or closes pause; the camera key switches between the two combat views; during the terminal state or pause, the confirm key may be used to resume, restart, or continue.

Touch input: touching the left side should display or activate a virtual joystick; pushing upward means moving forward, pushing downward means reversing, and pushing left/right means turning in the corresponding direction. After the joystick is released, it returns to center and the tank no longer continuously receives input in that direction. Touching the right side or a dedicated fire button means firing, and releasing it clears the pressed state; the pause/camera region in the upper-right corner should not accidentally trigger firing.

The controls must convey the tank's weight. Sustained forward or reverse input gradually builds speed, and sustained turning input gradually builds rotational momentum; after movement or turning is released, the tank should briefly continue to coast or rotate along its current trend and gradually decay instead of stopping instantly. Input in the opposite direction offsets the current trend and gradually changes direction; for example, pressing reverse while moving forward should first slow the tank before reversing, while pressing right during a left turn should first weaken the left turn before turning right.

The tank's position is constrained by the arena boundaries and cannot pass out of the battlefield on contact. When it hits an obstacle, the tank should be blocked or pushed away and its velocity trend weakened; when it hits an enemy tank, both take damage and impact, with feedback such as shaking, flashing, explosions, or damage numbers visible to the player. Movement, collisions, and firefight risks must be coupled: high-speed maneuvers without watching the path make it easier to hit obstacles, take projectiles, or let enemies close in.

Firing has pacing limits and a replenishment process. When the player presses fire, a visible projectile is launched in the direction of the muzzle, accompanied by muzzle flash, recoil/shake, audio, or equivalent feedback; holding fire cannot produce unlimited shots without intervals and must be constrained by ammunition or cooldown pacing. Firing again before ammunition has recovered should be rejected or have no effect, and a cooldown bar, refill progress, or button state should explain why. Enhanced states such as double cannons may allow a single shot to launch more projectiles, but must still consume a firing cycle and incur exposure or cooldown costs.

## Combat System

Enemy tanks should be active combat entities rather than stationary targets. Normal enemies patrol, turn, and search for the player, pursuing or firing when vision and range conditions are met; obstacles block sightlines and firing lines, making cover, flanking, and drawing enemies into the open effective strategies. When hit, enemies should lose health, display hit feedback, and may briefly retreat or change behavior; when destroyed, they should explode, disappear, or become unable to fight, and award score.

Enemy projectiles that hit the player reduce health and trigger feedback such as damage flashes, camera shake, health-bar changes, and hit audio; when the player's health reaches zero, they lose one life and respawn in the current level after a short delay. After all lives are exhausted, the game enters the terminal results state, displays the final score and level reached, and provides a restart entry point. Battlefield input should be locked during the terminal state so the player cannot continue moving, firing, farming score, or advancing levels.

Projectiles should produce impact feedback when they hit obstacles; after taking enough hits, an obstacle is destroyed and may change sightlines, movement routes, or reveal a hidden reward. Projectiles should disappear after leaving the valid area or existing for too long to avoid unexplained old fire remaining in the arena. When changing levels or restarting, old projectiles and expired explosions should be cleared so the player cannot be harmed in the new state by a projectile from the previous state.

Score should come from observable combat outcomes: hitting enemies, destroying enemies, and long-range or consecutive kills can increase rewards. Score changes must have on-screen feedback and cannot increase automatically based only on time. Higher levels can increase enemy count, hit threat, maneuvering pressure, or boss strength, making survival and accurate hits more difficult.

## Levels, Progression, and Bosses

At the start of each level, the player and enemies enter the arena at positions separated from one another, with the player facing the combat area and enemies distributed in distant or different areas of the battlefield. Level 1 has at least one enemy; later levels can add more enemies or shift to stronger boss battles. The primary objective within each level is to eliminate all enemies that can still fight.

When all enemies in the current level have been destroyed, the game should enter a brief level-complete state: clear projectiles from the arena, give the player a clear level-up prompt, award remaining health or performance points, and enter the next level through elevation, teleportation, a fade, or another visible transition. Normal combat input should be temporarily restricted during the transition so the player cannot continue firing or be attacked during the transition animation.

Boss levels are strongly recommended within P1 progression depth and may at minimum be P2. A boss should be visibly larger, more durable, or present a greater threat through multiple cannons, ramming, or similar capabilities, and be distinguished from ordinary enemies through the minimap, health bar, or scale. Higher-tier bosses can increase projectile count, ramming range, or damage, but the player must still be able to win by evading, using cover, aiming, and counterattacking.

## Power-ups and Temporary Enhancements

Starting in higher levels, collectible power-ups may appear on the battlefield. A power-up should be presented through rotation, floating, an icon, or another clear method; the player collects it by driving the tank into contact, with audio, a flash, or a prompt on collection, after which it takes effect in a visible state.

P1 may retain at least two types of enhancements: a speed enhancement makes the tank move faster for a short time but also increases collision or exposure risk; a shield or repair enhancement restores the player's health or blocks some damage. P2 includes double cannons, stealth, enhancements hidden in obstacles, and more complex level rotations. If stealth is included in the game, it should make it difficult for enemies to detect the player for a short time, but firing or colliding briefly reveals the player, creating a tradeoff between "safe approach" and "exposure by firing."

Enhancements cannot stack permanently to maximum without cost. Temporary enhancements should have a duration, be cleared at level end, or have an equivalent restriction; repeated pickups should refresh them, stack up to a limit, or be explicitly rejected. Enhancement states must have a presentation visible to the player, such as changes to the tank's appearance, status indicators, weapon count, speed feel, or health bar.

## Interface, Menus, and State Flow

There may be a brief brand/intro screen after launch, but the player must be able to skip it using the keyboard, mouse, or touch, and it should automatically enter a playable battlefield. After entering the playing state, the main battlefield must not be blocked by unrelated overlays.

The playing state should display health, remaining lives, the current level, score, reticle, cooldown/ammunition feedback, minimap, and pause and camera-switch entries. After moving or firing, these displays should remain synchronized with the actual combat state: taking damage reduces health, hits or kills increase score, completing a level updates the level, and an incomplete cooldown is shown as not ready.

The paused state stops the player, enemies, projectiles, power-ups, and level progression, and displays a resume entry point plus current control instructions or equivalent information. During pause, movement, firing, taking damage, scoring, and completing a level cannot continue; resuming returns to the same combat state. The terminal state displays the current run's results, an optional leaderboard, and a restart entry point; after restarting, the game should begin from the initial level and initial lives, clearing old enemies, projectiles, explosions, power-ups, and the terminal overlay.

The editor/tuning mode is P2 or Cut scope. If included, it should be separate from normal play and used only to place enemies or adjust speed, firing rate, starting level, and similar parameters; it should not be a necessary entry point for the player to complete the core combat. If it is not currently included, the normal game must still provide a complete playable flow of levels, enemies, obstacles, and restarting.

## Failure, Rejection, and Stability Constraints

The player cannot continue producing combat outcomes during the intro overlay, pause, level transition, respawn delay after losing health, or terminal results. If input occurs in these states, it should be ignored or only trigger operations allowed by the corresponding state, such as skipping the intro, resuming, switching views, or restarting.

Tanks, enemies, obstacles, projectiles, and power-ups must all remain within an explainable battlefield range or lifecycle. The player cannot pass through obstacles, cross boundaries, or continue moving and firing after health reaches zero; enemies cannot continue dealing damage after being destroyed; old projectiles cannot persist across levels or restarts.

Resources and score should not change in reversed or cheat-like ways: a miss cannot award kill score, an incomplete cooldown cannot generate additional projectiles, health cannot exceed its allowed maximum without reason, remaining lives cannot become negative, and level completion requires all enemies to have been eliminated. If a leaderboard or persistent records are unavailable, the game should still display the current run's results and restart normally and should not deadlock.

## Cut Scope

P2 optional: online leaderboards, a complete boss progression, multiple hidden power-ups, complex enemy investigation/retreat details, atmospheric events such as distant aircraft and volcanoes, distance-layered audio, a formal editor/tuning interface, fine-grained kill-streak multipliers, and long-term high-score displays.

Explicitly cut: reproducing a specific branded intro, fixed copy, fixed icons, fixed color palette, fixed layout, fixed audio assets, or a fixed tuning panel is not required. As long as the player-visible core tank-arena loop, control feel, combat feedback, state flow, and closed progression loop are present, equivalent visual and content designs may be used.

---

## GDD / Design Doc (merged from design-doc.md)

# Tankor Arena Design Doc

## Design Goals

Tankor Arena is a retro neon wireframe-style tank arena game. The player drives a tank in an enclosed 3D arena, engaging enemy tanks that actively move and attack through movement, turning, aiming, and paced firing. The core experience should emphasize the tank's sense of weight, the pressure of firefights, cover tradeoffs, hit feedback, level progression, and the closed loop of restarting after failure.

This GDD only elaborates on the gameplay scope already defined in `source-anatomy.md` and `game-spec.md`. P1 is a recognizable tank-combat main loop that can be completed and restarted; P2 provides more complete power-ups, bosses, leaderboards, tuning modes, and atmospheric depth.

## MDA

### Mechanics

- The player's tank continuously moves forward, reverses, and turns within an enclosed arena, constrained by boundaries, obstacles, and collisions.
- The player can switch between third-person chase and first-person/turret views, with the same movement and firing semantics in both views.
- One press of fire triggers one projectile-launch cycle; projectiles travel from the muzzle direction and are limited by cooldown or ammunition recovery.
- Enemy tanks patrol, turn, and search for the player, pursuing or firing when line-of-sight and range requirements are met.
- Projectiles deal damage when they hit enemies, and destroying enemies awards score; projectiles produce impacts when they hit obstacles and can progressively damage them.
- The player loses health when hit by a projectile or an enemy tank; when health reaches zero, a remaining life is lost, and exhausting all lives enters the terminal results state.
- After all enemies in the current level are eliminated, the game enters a level-complete transition, clears old combat state, and proceeds to a higher level.
- The HUD displays health, remaining lives, level, score, reticle, cooldown/ammunition, minimap, pause, and camera-switch entries, and remains synchronized with the actual combat state.
- Pause, level transitions, death-respawn delays, and the terminal state restrict normal combat input.
- Temporary enhancements may appear in higher levels; enhancements are triggered by battlefield pickups and have durations, caps, or level-end clearing.

### Dynamics

- When the player holds forward/reverse, the tank gradually builds speed; after release, it briefly coasts and decays; reverse-direction input first offsets the original trend before changing direction.
- When the player holds left/right, the tank gradually builds rotational momentum; after release, rotation gradually decays; opposite turning input weakens the original turn before turning to the other side.
- The player must continually trade off between accelerating to approach, navigating around obstacles, keeping the reticle aligned, waiting for cooldown, and evading enemy fire.
- Cover can protect the player but also blocks the player's firing line; destroying obstacles changes sightlines, routes, and dangerous exposure surfaces.
- Enemy movement, firing, and closing distance force the player to reposition rather than only shoot at stationary targets.
- Continuing to fire before cooldown recovery does not create unlimited projectiles; the player needs to understand the firing cadence through the HUD or button state.
- Rising levels bring more enemies, stronger bosses, or greater threats, and the player must survive through better movement, aiming, and resource judgment.
- Power-ups provide short-term advantages, but increased speed amplifies collision and exposure risks; protection or repair increases room for error; if stealth appears, exposure through firing or collisions creates a tradeoff.

### Aesthetics

- The primary emotions are high pressure, precision, retro science fiction, and victory feedback.
- Neon wireframes on a black background, grid boundaries, wireframe tanks, projectile trails, explosions, shaking, and warnings reinforce battlefield readability.
- The first-person view emphasizes reticle lock-on and incoming fire, while the chase view emphasizes the player's tank posture, navigating obstacles, and incoming projectiles.
- Score ticks, kill explosions, level prompts, health warnings, and the terminal panel should make the consequence of every action clear to the player.

## P1 Core Loop Executable Trajectories

### Trajectory A: Combat Entry and Driving Feel

Start/reset: the player skips the intro or enters Level 1 from a restart and sees an enclosed arena, the player's tank, enemies, obstacles, a reticle, a minimap, and the HUD.

Player input: the player holds forward or pushes the joystick upward, causing the tank to accelerate along its current facing; holds left/right or pushes the joystick horizontally, causing the tank to turn continuously in the corresponding direction; after release, movement and rotation gradually decay; with opposite-direction input, the original trend first weakens before direction changes.

Continuous state changes: the tank's position, orientation, and visible on-screen movement change continuously; the player's position on the minimap updates in sync; near a boundary or obstacle, the speed trend is weakened, and the tank cannot leave the battlefield or pass through cover.

Objective/risk: the player needs to align the tank's front and reticle toward enemies or destructible obstacles while avoiding high-speed collisions with obstacles, enemies closing in, and enemy projectiles.

Reward/failure: correct maneuvering provides a firing angle and safe distance; incorrect maneuvering results in collisions, damage, lost lives, or forced respawning.

Progress/restart: while the player remains alive, combat in the current level continues; after all lives are exhausted, the game enters the terminal state and can be restarted at the initial level with the initial lives.

### Trajectory B: Aiming, Firing, Hits, and Scoring

Start/reset: the player is in the playing state, at least one enemy or obstacle is observable in the arena, and projectile cooldown or ammunition is available.

Player input: through movement and turning, the player aims the muzzle/line of sight at an enemy or obstacle; the reticle provides lock-on, highlighting, or equivalent feedback on an attackable target; the player presses the fire key once or touches the fire region on the right.

Continuous state changes: the muzzle produces a flash, recoil/shake, audio, or equivalent feedback; a visible projectile travels in the muzzle direction; the cooldown or ammunition UI enters a not-ready state and gradually recovers.

Objective/risk: the player wants the projectile to hit an enemy to reduce its health or kill it, and may also break an obstacle blocking a route/sightline; firing reveals the player's position and is limited by cooldown, and another attempt while not ready should be rejected or have no effect.

Reward/failure: hitting an enemy displays hit feedback and increases score, while destroying an enemy produces an explosion and a kill reward; hitting an obstacle displays an impact and can weaken or destroy the obstacle; a miss does not award kill score.

Progress/restart: eliminating all enemies triggers level completion; if the player runs out of lives during the firefight, the game enters the death/terminal flow and can be restarted.

### Trajectory C: Enemy Pressure, Life Loss, and Failure Loop

Start/reset: the player and enemies spawn apart, the enemies are in a combat-capable state, and the player has health and remaining lives.

Player input: the player moves, turns, and uses obstacles to attempt evasion, then counterattacks during a safe window.

Continuous state changes: enemies patrol, turn, pursue, or fire; enemy projectiles visibly travel; when the player is hit or rammed, damage feedback appears and the health bar decreases.

Objective/risk: the player's objective is to eliminate enemies and preserve health; risks come from enemy fire, enemies closing in, obstacles blocking routes, and losing control during high-speed movement.

Reward/failure: successful evasion and counterattacks preserve the player's health and earn score; when health reaches zero, one remaining life is lost and the player respawns in the current level after a short delay; exhausting remaining lives enters the terminal results state.

Progress/restart: the terminal state displays the final score and level reached and locks normal combat input; after the player confirms restart, old enemies, projectiles, explosions, power-ups, and the terminal overlay are cleared, returning to the initial level.

### Trajectory D: Level Completion and Higher Levels

Start/reset: enemies remain in the current level, and the player is in a combat-capable state.

Player input: the player destroys all enemies still able to fight through driving, aiming, and firing.

Continuous state changes: after the last enemy is destroyed, the battlefield enters a level-complete transition, old projectiles are cleared, normal combat input is temporarily restricted, and the player sees a level-up prompt or visible transition.

Objective/risk: the player's objective is to enter a higher level; during the transition, the player should not be able to continue farming score, firing, or taking damage from old projectiles.

Reward/failure: completion rewards can include level progression, remaining health, or performance-point feedback; if higher levels contain stronger enemies, more enemies, or a boss, risk increases with progression.

Progress/restart: after the transition completes, the next level begins, the HUD level updates, and enemies, obstacles, power-ups, and battlefield state refresh; failure still follows the terminal restart loop.

## M-Feature Mechanism List

| ID | Priority | Mechanism | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|---|
| M1 | P1 | Battlefield startup and readable 3D arena | Skip the intro or wait to enter | Visible grid/boundaries, tanks, enemies, obstacles, HUD, minimap, reticle | The playing state cannot be blocked by an unrelated overlay |
| M2 | P1 | Tank movement, turning, and weight | Keyboard direction/movement keys or virtual joystick | Speed and rotation gradually build, decay after release, and change direction under opposite input | Cannot cross boundaries or obstacles; collisions weaken motion trends |
| M3 | P1 | Camera switching | Camera key or camera entry point | Switch between chase and first-person/turret views, changing the reticle and manner of observation | Camera switching cannot change movement and firing semantics |
| M4 | P1 | Aiming and lock-on feedback | Adjust the hull/line of sight toward an enemy or obstacle | Reticle position or state indicates the current attackable target | Obstacles should block enemy lock-on or firing-line judgment |
| M5 | P1 | Firing, projectiles, and cooldown | Fire key, button, or right-side touch fire region | Projectile travels in the muzzle direction, firing feedback appears, cooldown/ammunition state changes | Cannot fire endlessly before recovery; old projectiles should disappear according to their lifecycle |
| M6 | P1 | Enemy AI and enemy fire | Player enters enemy line of sight/range or combat continues | Enemies move, turn, pursue, and fire; enemy projectiles are visible | Destroyed enemies cannot continue attacking |
| M7 | P1 | Damage, health, and death | Hit by an enemy projectile or colliding with an enemy tank | Health decreases, damage feedback appears, remaining lives change, and respawn or terminal state occurs | Health/remaining lives cannot be negative; the terminal state locks combat input |
| M8 | P1 | Enemy hits, destruction, and scoring | Player projectile hits an enemy | Hit feedback, enemy health decrease, explosion/disappearance, score increase | A miss or non-kill cannot award kill score |
| M9 | P1 | Obstacle blocking and destruction | Move into an obstacle or hit an obstacle with a projectile | Movement is blocked or pushed away, obstacle hit/destruction feedback appears, routes and sightlines change | The player and projectiles cannot pass through valid obstacles without explanation |
| M10 | P1 | Level completion and progression | Eliminate all enemies in the current level | Completion prompt, old projectile clearing, brief transition, level update | Level completion requires all enemies to be eliminated; normal combat is restricted during transition |
| M11 | P1 | Pause and resume | Pause key/entry point, resume confirmation | Combat pauses and resumes in the same state | During pause, movement, firing, damage, scoring, or level completion cannot occur |
| M12 | P1 | Terminal state and restart | Confirm restart after exhausting lives | Results display score and level; restart returns to the initial state | Restart clears old enemies, projectiles, explosions, power-ups, and overlays |
| M13 | P1 | HUD and battlefield overview synchronization | Triggered naturally through combat | Health, remaining lives, level, score, reticle, cooldown, and minimap change in sync | The HUD cannot diverge from the actual combat state |
| M14 | P1/P2 | Boss level | Reach a boss level or higher level | A larger, more durable, or more threatening enemy distinguished by health bar or minimap | The boss must still be defeatable through evasion, cover, and aimed counterattacks |
| M15 | P1/P2 | Temporary enhancements | Drive the tank into contact with an enhancement on the battlefield | Collection feedback; short-term states such as speed/shield/repair take effect | Enhancements have duration, cap, clearing, or rejection rules |
| M16 | P2 | Stealth, double cannons, and hidden enhancement depth | Pick up the corresponding enhancement or destroy an obstacle containing a reward | Stealth can reduce enemy detection, double cannons change firing presentation, hidden rewards appear | Firing or collisions can reveal stealth; enhancements cannot stack permanently to maximum without cost |
| M17 | P2 | Leaderboards and persistent records | Submit or view after the terminal state | Optionally display rankings or historical scores | If the leaderboard is unavailable, results and restart must still work |
| M18 | P2/Cut | Editor/tuning mode | Enter a separate tuning entry point | Can adjust enemies, speed, firing rate, starting level, and similar settings | Should not be a necessary path for completing normal combat |
| M19 | P2/Cut | Atmospheric units, volcanoes, layered audio, and other presentation depth | Occurs naturally during combat | Distant motion and spatial audio strengthen the battlefield atmosphere | Does not affect the P1 core win/loss loop |

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 + M2 Battlefield entry and driving | P1 | After skipping the intro, hold forward/reverse/left/right or use the virtual joystick | Tank position and orientation change continuously, the minimap stays synchronized, and movement decays after release | Boundary and obstacle constraints remain effective; opposite input changes the trend instead of drifting in the same direction |
| M3 + M4 Camera and aiming | P1 | Switch views and adjust orientation toward a target | The observation view changes, the reticle still identifies an attackable target, and aiming feedback is readable | Camera switching does not reverse or break driving/firing semantics |
| M5 + M8 Shooting, hits, and scoring | P1 | Aim at an enemy and fire | Projectile, firing feedback, cooldown, enemy hit/explosion, and score change | Cannot fire endlessly before cooldown completes; misses do not award kills |
| M6 + M7 Enemy pressure and health failure | P1 | Player enters the enemy threat range and attempts to evade | Enemies move and fire; the player's health/remaining lives change after being hit | Destroyed enemies cannot continue attacking; combat input is locked after the terminal state |
| M9 Obstacle tactics | P1 | Collide with an obstacle or fire at one | The tank is blocked/pushed away, the obstacle is hit or destroyed, and routes/firing lines change | Obstacles cannot be mere decoration; projectiles and tanks cannot penetrate without explanation |
| M10 Level progression | P1 | Eliminate all enemies in the current level | Completion prompt, old projectile clearing, transition to the next level, level HUD update | Cannot complete the level before all enemies are eliminated; cannot farm score or be hit by old projectiles during transition |
| M11 + M12 State flow | P1 | Pause, resume, die, restart | Pause menu/terminal results appear; state is correct after resuming or restarting | Pause/terminal/respawn delay does not allow normal combat outcomes to continue |
| M13 HUD and minimap | P1 | Move, take damage, fire, kill, complete a level | Health, remaining lives, score, level, cooldown, reticle, and minimap update with state | On-screen feedback cannot be only static decoration or inconsistent with combat state |
| M14 Boss level | P1/P2 | Enter a higher level or boss level | Boss is clearly distinguished and more threatening, while remaining defeatable | Boss cannot be unsolvable or merely non-interactive decoration |
| M15 + M16 Enhancement system | P1/P2 | Contact a collectible enhancement or trigger a hidden reward | Collection feedback and temporary state take effect, and the state is visible | Enhancements cannot stack endlessly without cost; level-end or duration rules are clear |
| M17-M19 Supporting depth | P2/Cut | View records in the terminal state, enter tuning, observe atmospheric events | Adds long-term feedback, creation/debugging, or battlefield atmosphere | Must not replace or block the P1 tank-combat loop |

## State Flow

1. Intro/startup: allows a brief brand screen or prompt; the player can skip it using the keyboard, mouse, or touch, or it may automatically enter play.
2. Playing: the player, enemies, projectiles, obstacles, power-ups, HUD, minimap, and reticle are active.
3. Paused: pauses combat progression and displays a resume entry point; after resuming, returns to the original combat state.
4. Level-complete transition: after all enemies are eliminated, clears old projectiles and expired effects, displays level-up feedback, and enters the next level.
5. Death and respawn: when the player's health reaches zero but remaining lives still exist, respawns in the current level after a short delay.
6. Terminal state: after remaining lives are exhausted, displays results and locks normal combat input.
7. Restart: starts again from the initial level, initial lives, and a clean battlefield state.

## Mechanism Coverage Matrix

| System | P1 required coverage | P2/optional depth | Explicitly cut |
|---|---|---|---|
| Arena presentation | Readable 3D battlefield, boundaries, obstacles, tanks, projectiles, explosion/HUD feedback | Distant units, volcanoes, stars, or richer audio | Fixed branded intro, fixed color palette, fixed layout |
| Control feel | Keyboard movement/turning/firing/pause/camera, touch joystick and fire region | More control prompts or tuning entry points | Fixed key copy or a single UI arrangement |
| Movement physics | Acceleration, decay, opposite-direction cancellation, boundary and obstacle collisions, player-enemy collision damage | More detailed impact feedback and vibration layers | Specific physics formulas or numeric constants |
| Firefights | Fire in the muzzle direction, cooldown/ammunition limits, hits on enemies/obstacles, lifecycle clearing | Double cannons, multi-cannon bosses, distance/kill-streak scoring | Unlimited firing or automatic score increases over time |
| Enemies | Active movement, pursuit/firing, hit/death feedback | Retreat, different threat tiers, boss ramming/multiple cannons | Stationary-target enemies as a substitute for P1 |
| Progression | Level 1 is playable, eliminating all enemies completes the level, later levels are harder or stronger | Complete boss progression, long-term high-score leaderboard | A single scene with no level-completion loop |
| Power-ups | Retain at least temporary enhancements such as speed and protection/repair as the P1/P2 boundary | Stealth, double cannons, hidden power-ups, rotation combinations | Permanent stacking to maximum without cost |
| State flow | Skippable intro, pause/resume, terminal/restart, transition clearing | Leaderboard, control prompts, tuning mode | Continuing to farm score or input passing through after the terminal state |

## Design Risks and Constraints

- Movement/physics feel is core and cannot be reduced to discrete grid movement or teleportation.
- Enemies must be combat entities that move and attack and cannot be reduced to stationary targets.
- Score, health, level, and cooldown must come from combat events and synchronize visible feedback; they cannot be only a static HUD.
- Level transitions, pause, death delay, and the terminal state must block combat outcomes that should not occur.
- P2 systems must not conceal missing P1 features: leaderboards, tuning, atmospheric effects, and hidden power-ups cannot replace driving, aiming, firing, enemies, damage, level completion, and restarting.
