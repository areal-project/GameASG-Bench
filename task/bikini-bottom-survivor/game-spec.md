# Bikini Bottom Survivor Game Spec

## Requirements Overview

This game is a 3D underwater survival action roguelite. From the main menu, the player enters an explorable underwater scene, controls the protagonist to move and evade groups of enemies, automatically attacks the nearest enemy, picks up experience after defeating enemies, and pauses combat upon leveling up to choose one of several upgrades. The primary goal is to survive for as long as possible under pressure from increasingly powerful enemy waves, special enemies, and bosses, while building long-term progression through quests, achievements, daily challenges, and scene exploration.

## Scope Principles

A qualifying version of the game must prioritize preserving the core survival loop that players can experience directly: entering from the menu, a readable 3D scene, directional movement, enemy threats, automatic attacks, drop collection, upgrade selection, pausing, defeat, and restarting. Meta objectives, scene exploration, special abilities, bosses, and editing tools are depth systems; if they are not yet fully implemented, they should be marked as P2 or as cut scope in the corresponding sections to avoid reducing the core experience to only a shell with the same theme.

## Gameplay Requirements

### P0 Basic Operation and 3D Scene

- The game must provide a readable, non-empty, continuously rendered 3D main scene. After the player enters a playable state, the protagonist, ground, boundaries or buildings/obstacles, HUD, and the locations where enemies or interactive targets appear should be visible.
- The main scene should support an oblique top-down or third-person follow view. The camera may smoothly follow the protagonist, and it must not make left/right or forward/backward input appear reversed on screen.
- The HUD must display at least health, level, experience progress, and survival time. HUD values must update in sync with the actual game state as it changes.

### P1 Menu, Pause, and Restart

- After initial loading, the main menu or an equivalent start screen should be displayed, and the player enters the game through an actual click. After entering, the blocking menu must disappear and the main scene must be interactive.
- The game can be paused/resumed with the keyboard Escape key or a visible pause button. While paused, enemies, timing, automatic attacks, pickups, and damage resolution are frozen; they resume afterward.
- After defeat, a results screen is displayed, showing at least the survival time for the run or an equivalent score, and providing a restart entry point. Restarting clears enemies, projectiles, drops, and temporary upgrades, and restores health, time, the starting level, and the playable state.

### P1 Player Movement and Directional Semantics

- Desktop supports movement with WASD and the arrow keys; movement direction is based on the player's screen perception: when pressing right, the protagonist's screen position should move to the right or forward-right; when pressing left, it should move in the opposite direction; when pressing up/forward, the protagonist should move away from the bottom of the screen or toward the forward direction defined by the camera; and when pressing down/backward, the opposite should occur.
- Movement supports diagonal normalization to prevent diagonals from being noticeably faster than movement in a single direction. Desktop may support Shift sprinting; sprinting only increases movement speed and should not bypass collisions, boundaries, or the paused state.
- Movement must be constrained by scene boundaries and obstacles. The player cannot pass through blocking objects or leave the playable area; invalid input or input that cannot cause movement does not change unrelated state such as health, level, experience, or kills.
- While moving, the protagonist turns toward the actual direction of movement or plays movement feedback; after stopping, the protagonist returns to idle feedback.
- P2 mobile support includes a touch virtual joystick on the left. When the joystick is dragged right/left/up/down, the visible on-screen movement direction must match the drag direction; after release, movement stops and the joystick is hidden or reset.

### P1 Enemies, Damage, and Defeat

- Enemies gradually spawn around the player or at the edges of the scene, with spawn frequency and strength increasing with level. Enemies must be visible in the scene and actively move or pathfind toward the player.
- Enemy contact or attacks deduct health and trigger changes in the health HUD. When health reaches 0, the game enters the defeat state and ordinary combat interactions stop.
- Enemies should not continue attacking the player normally in peaceful/non-combat scenes or while blocked by a menu.
- Enemy types include at least a basic pursuing enemy; P2 includes tougher elite enemies, floating enemies that leave slowing areas, small enemies that make ranged attacks, and boss enemies that appear every 5 levels.

### P1 Automatic Attacks, Defeating Enemies, and Experience Pickups

- The player does not need to aim manually; at each attack interval, the character automatically fires a visible projectile at the nearest enemy. The projectile must originate from the player's position, travel toward the enemy, and be removed on hit, timeout, or collision with a blocking object.
- When a projectile hits an enemy, it deducts enemy health and produces visible hit feedback. When enemy health reaches zero, the enemy is removed from the scene, the kill count or quest progress is updated, and a collectible experience item is dropped at the death location.
- Experience items are automatically collected when the player approaches them. After collection, experience progress increases, the experience item disappears from the scene, and sound/particle/prompt feedback may be triggered.
- If there are no enemies, automatic attacks should not generate valid hits, kills, or experience out of thin air.

### P1 Levels and Upgrade Selection

- The player levels up when experience reaches the threshold for the current level. Upon leveling up, combat pauses and approximately 3 selectable upgrade cards are displayed; after the player clicks any upgrade, the upgrade takes effect, the upgrade screen closes, and combat continues.
- The upgrade pool should include increased damage, increased attack speed, increased projectile count, increased projectile speed, increased movement speed, increased maximum health, health regeneration, orbiting attack objects, and so on. Upgrade effects must affect subsequent observable behavior or the HUD.
- At higher levels, the experience threshold increases and enemy health/damage/spawn pressure increase. Every 5th level is a boss round; when a boss appears, the normal enemy-wave rules may be paused or reduced.

### P2 Special Abilities, Pickups, and Bosses

- A temporary shield pickup may appear. After activation, it displays a protective bubble around the player, can block a limited number of instances of damage, and breaks after being depleted.
- A temporary transformation pickup may appear. After activation, the player's form or attack style changes noticeably and can damage enemies with a sustained beam or powerful attack; the player returns to the normal state when the duration ends.
- The orbiting attack object upgrade generates visible objects that rotate around the player and damage enemies on contact; multiple orbiting objects should be distributed evenly.
- Boss enemies should have a dedicated health bar, warnings for ranged/area attacks, phase or shield changes, and clear exit feedback upon death. Boss death advances the level or long-term objectives.

### P2 Scene Exploration, NPCs, and Quests

- The game may include multiple underwater locations or indoor/outdoor areas. After the player remains within a teleport/entrance area for a set amount of time, a progress prompt appears and the game switches to the destination scene. There is overlay/cutscene feedback during the scene transition, and the player appears at a valid entrance after the switch.
- Some areas are peaceful zones where enemies are cleared or do not spawn; the player can approach an NPC and click to talk, opening quest dialogue.
- The quest system includes a quest list, the currently tracked quest, a progress bar, completion prompts, and rewards. Quest objectives may include defeating enemies, collecting recipe fragments, exploring locations, reaching a level, or completing a boss objective. Rewards may increase the experience multiplier, health, or other long-term abilities.
- If the quest or scene system is not fully implemented, at least a quest panel/progress display and one observable quest completion path must be retained; long multi-location exploration chains may be marked as P2 cut scope.

### P2 Achievements, Daily Challenges, and Save Data

- The achievement system records milestones such as the first play session, number of kills, leveling up, defeating bosses, exploring locations, and using special abilities. A popup appears when an achievement is unlocked, and the achievement panel allows locked/unlocked states to be viewed.
- The daily challenge system displays 2 objectives each day. Objectives come from categories such as survival time, kill count, reaching a level, and defeating a boss; a progress bar and countdown to the next refresh are displayed. Completion is recorded persistently to prevent the challenge from being completed repeatedly on the same day.
- Game progress should save quest state, some long-term level/experience information, achievements, and daily completion status. Long-term progress can be restored when the game is reopened, but a new combat run should still begin in a valid playable state.

### P2 Editor/Debug Mode Cut Scope

- The regular player version does not require a complete editor. If editing tools are provided for scene collisions, teleport zones, spawn points, NPC placement, boundary regions, or interface position adjustments, these tools are only P2 depth features.
- If an editing mode is implemented, it may be P2: it must be isolated from normal gameplay, editing input must not accidentally trigger combat resolution, and collision, boundary, or teleport settings generated by the editing tools should visibly take effect during gameplay.

## State Requirements

- `loading/menu`: Resource loading and main menu. Achievements and daily challenges can be viewed, or the game can be started. Combat that can damage the player should not run before the game starts.
- `playing`: The main scene is interactive; timing, movement, enemies, attacks, drops, pickups, and quest updates are running.
- `paused`: Entered through the pause button, Escape, or the upgrade screen. Normal combat is frozen, but menu buttons are interactive.
- `levelUp`: Upgrade selection state. Combat is frozen, and selecting an upgrade returns the game to `playing`.
- `gameOver`: Entered after health reaches 0. Results and restart are displayed; normal input cannot continue moving, attacking, collecting items, or adding score.
- `transition`: Movement and combat resolution are briefly blocked during scene transitions, with progress or cutscene feedback displayed.
- `dialog/panel`: Panels for quests, achievements, daily challenges, and so on. After a panel is closed, the game should return to the menu or paused/playing state from which it was entered.

## Completion Criteria

- The player can start through an actual click from the menu, see a non-empty 3D scene and HUD, and use keyboard directional input to move the protagonist with on-screen directions matching input semantics.
- Enemies appear, pursue, and damage the player; automatic projectiles hit enemies and defeated enemies drop experience; collecting experience advances the experience bar and triggers upgrade selection.
- Pause, resume, defeat, and restart all form complete loops, and combat does not continue to advance in paused/end states.
- At least a basic enemy, basic projectile, experience pickup, upgrade card, health/level/time HUD, one negative rejection path, and one invariant constraint are implemented.
- P2 depth systems may be implemented in stages, but if quests/achievements/daily challenges/bosses/special pickups/scene transitions appear, they must have visible panel, progress, or effect feedback and cannot exist only in hidden state.

---

## GDD / Design Doc (merged from design-doc.md)

# Bikini Bottom Survivor Design Doc

## MDA

**Mechanics**

M1: Start, loading, main menu, start game, pause, resume, defeat, and restart states.

M2: 3D underwater main scene, follow/oblique top-down camera, readable HUD, and a non-empty interactive view.

M3: Keyboard/touch directional movement, sprinting, boundary and obstacle collisions, and screen-direction consistency.

M4: Enemy spawning, pursuit, attacks, health deduction, and defeat.

M5: Projectile attacks that automatically target the nearest enemy, hit feedback, defeats, and drops.

M6: Experience pickups, experience bar, level thresholds, pausing for level-up, and upgrade selection.

M7: Upgrade effects, including damage, attack speed, multiple projectiles, movement, health, regeneration, and orbiting attack objects.

M8: Special pickups and temporary abilities, including shields, transformation, and area/beam feedback.

M9: Boss rounds, boss health bars, telegraphed attacks, phases/shields, and progression on death.

M10: Quests, NPC conversations, tracking, progress, rewards, and prompts.

M11: Achievements, daily challenges, long-term progression, and persistence.

M12: Multi-location exploration, teleport areas, peaceful zones, and scene-transition feedback.

M13: P2 editing tool isolation: collision/teleport/boundary/spawn point/NPC placement is only an optional non-player feature.

**Dynamics**

Within a limited field of view, the player constantly adjusts position, creates distance from groups of enemies, waits for automatic attacks to clear threats, and then retrieves experience. Experience drives level-ups, and upgrade choices change the subsequent rhythm: faster kills, safer movement, stronger survival, or broader area control. As the level increases, enemies become denser and tougher, and special enemies and bosses force the player to use movement directions, boundaries, and upgrade combinations to stay safe.

**Aesthetics**

The overall feel should be relaxed, cartoonish, and bright, but the core experience is the tension of "holding out just a little longer before being surrounded." The player should clearly understand the result of every input, instance of damage, pickup, and upgrade, and feel the progression curve from weak to stronger.

## GDD Key Points

### World and Perspective

The main scene is a freely traversable 3D underwater area containing ground, readable boundaries, and decorations or obstacles. The camera follows the player and maintains a stable view, allowing slight rotation or zoom, but directional input must be based on screen perception. If indoor/peaceful zones are present, enemy spawning and combat pressure should pause or decrease significantly.

### Player

The player has health, maximum health, experience, level, survival time, and a set of upgrades. The player moves with WASD/the arrow keys, and Shift can be used to sprint. Movement is limited by boundaries and obstacles; collisions only prevent position changes and should not change unrelated state such as experience, kills, or level.

### Combat

Enemies spawn at the perimeter and pursue the player. Ordinary enemies deal damage through contact or attacks with a short cooldown. Automatic attacks look for the nearest enemy at set intervals and fire visible projectiles; projectiles have outcomes for flight, hits, expiration, and collision with blocking objects. Enemies drop experience items after death, which the player collects by approaching.

### Progression

Reaching the experience threshold triggers the level-up screen and freezes combat. The level-up screen offers multiple upgrade options; after a selection, the screen closes and the upgrade affects subsequent movement, attacks, survival, or orbiting attack behavior. Increasing the level also increases difficulty. Boss rounds and special enemies are P2 depth features, but if implemented, they must form a visible threat-and-reward loop.

### Meta Systems

Quests/achievements/daily challenges provide long-term objectives expressed through panels, progress bars, popups, and persistent state. They must not block the core gameplay path; after a panel is opened and closed, the game must return to the correct state. Scene transitions and NPC conversations are P2 depth features and should be presented with clear prompts and progress feedback.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Menu to playable state | P1 | Actually click start from the default screen | The blocking menu is hidden, phase changes to playing, the HUD and main scene are visible, and the playfield is interactive | Failure if phase is playing but overlay still blocks interaction |
| M1 Pause/resume/restart | P1 | Escape, pause button, resume button, restart button | The pause panel is shown/hidden; timing and entities do not advance while paused; restarting clears temporary entities and restores the initial combat state | Normal movement/attacks cannot rewrite combat progress in the end or paused state |
| M2 Non-empty 3D main scene | P0 | Start and enter playing | The main view has readable scene depth, and the protagonist's position on screen can be observed consistently | An empty canvas, purely static shell, or HUD-only implementation fails |
| M3 Directional movement | P1 | Hold ArrowRight/ArrowLeft, ArrowUp/ArrowDown, or WASD; drag the joystick on mobile | The protagonist's screenX/screenY or visible bounds produce displacements with opposite signs in opposite directions, and the HUD is not changed unintentionally | Failure if left/right move the same way, forward/backward move the same way, movement continues while paused/in the end state, or the player crosses boundaries/walls |
| M4 Enemy pursuit and damage | P1 | Wait in a valid scene or load a nearby-enemy scene and remain still | enemy count increases or enemy distance closes; health decreases after contact/an attack, with result=lose at 0 | Failure if enemies do not move, health does not change, or normal input still has an effect after defeat |
| M5 Automatic attacks and defeats | P1 | Load a nearby-enemy prerequisite scene and wait for automatic attacks or enter attack range | projectile count/attack revision increases, enemy health decreases or the enemy is removed, and kills/drops change | Kills or experience cannot be generated out of thin air when there are no enemies |
| M6 Experience and leveling | P1 | Move to a drop after defeating an enemy, or load a valid prerequisite close to leveling and collect a pickup | experience increases; reaching the threshold enters levelUp; after selecting an upgrade, level increases and phase returns to playing | Combat is frozen before an upgrade is selected; normal combat cannot continue without a selection |
| M7 Upgrade effects | P2 | Select a type of upgrade in levelUp | Subsequent attack count/rate, movement speed, maximum health, or orbiting-object count changes accordingly | Selecting an invalid card, making a repeated invalid selection, or anomalous resource/level changes are rejected |
| M8 Special pickups | P2 | Collect a shield or transformation item | shield/transform state, visible effects, and a duration appear; taking damage consumes the shield or the state is restored when time expires | The shield should not block damage indefinitely; after transformation ends, all temporary effects cannot remain |
| M9 Boss round | P2 | Reach a boss level or load a boss prerequisite scene | A boss appears, bossHealth is visible, and telegraph/attack/death progression is visible | Rewards cannot be granted directly before the boss dies; normal damage should not bypass a shield phase |
| M10 Quests/NPCs | P2 | Approach an NPC and click to talk; complete a quest objective | The dialogue/quest panel is displayed, tracked progress changes, and rewards and prompts appear after completion | Closing the panel returns to the previous state; rewards cannot be claimed before conditions are met |
| M11 Achievements/daily/save data | P2 | Open a panel, complete an objective, refresh/restart | Milestone unlocks, daily progress, and a persistence summary are visible | A challenge completed on the same day cannot grant rewards repeatedly; a new run does not inherit temporary combat entities |
| M12 Scene transition | P2 | Remain in a teleport zone for a set amount of time | A progress prompt, overlay/cutscene, destination scene, and valid spawn point appear | Combat is frozen during the transition; ordinary enemy waves should not continue spawning in a peaceful zone |
| M13 Editing tool isolation | P2 | Enter editing mode and place/move an object | Edited objects are visible, and the settings take effect after exiting or during gameplay | Editing-mode input cannot trigger combat kills, experience, or defeat |

## Priority Cut Scope

P1 is the playable qualification threshold: entering from the menu, a readable 3D view, directional movement, enemy pursuit/damage, automatic attacks, drop collection, upgrade selection, pausing, and restarting. P2 consists of depth requirements: bosses, special abilities, quests/NPCs, multiple scenes, achievements, daily challenges, persistence, and editing tools. P2 may be completed in stages, but once shown in the UI, it must have real, visible behavior.
