# Grand Theft Astro Game Spec

## Requirements Overview

This game is a 3D open-city action sandbox. The player starts in a city neighborhood and can explore on foot, drive vehicles, use weapons, rob or take down targets, collect cash and supplies, purchase weapons, ammunition, and healing, and continually earn rewards and new objectives through a quest chain. The core experience is “free action -> trigger risk or objective -> gain resources/progress -> continue exploring or respawn after failure.”

## Priority Description

- P0: The page can launch, the main 3D scene is visible, and the HUD and player state are readable.
- P1: Walking movement, shooting, driving, resources/health/wanted level, death and respawn, and basic quest objectives must form a complete playable loop.
- P2: Shop details, weapon upgrades, later stages of the quest chain, mobile touch controls, minimap expansion, complex traffic/police chases, and long-term saves are depth requirements; they may be simplified if time is limited, but the P1 core of the city action sandbox cannot be removed.

## Gameplay Requirements

### 3D City and Visible World

- The game must present a non-empty, readable 3D city scene containing roads, blocks, building obstacles, terrain elevation differences, vehicles, pedestrians, quest objectives, pickups, and the player character.
- Here, 3D is a hard rendering and spatial-presentation requirement: the main scene must use WebGL/Three.js or an equivalent true 3D rendering pipeline, with a perspective camera, depth relationships, three-dimensional buildings/vehicles/characters, and visible elevation differences. It cannot be replaced by a pure 2D canvas top-down view, isometric pseudo-3D, scaled flat icons, or a static background.
- The main view is an overhead third-person view that follows the player or vehicle. The camera follows as the player moves, and the primary subject always remains in the visible scene.
- World boundaries and impassable areas such as buildings and bodies of water must block the player or vehicle. Collisions must not allow the player or vehicle to pass through walls, leave the world, or fall into an unrecoverable state.
- The city should provide feedback that it is “alive”: NPCs patrol or stand in neighborhoods, vehicles move along roads, police cars/officers pose a greater threat at high wanted levels, and cash, supplies, and quest objectives can be observed in the world or on the minimap.

### Player Movement and Direction Semantics

- The keyboard supports WASD and arrow-key movement; mobile supports a virtual joystick or equivalent touch dragging.
- Screen-space directions must match player expectations: pressing right/dragging right should move the player's visible position toward the right side of the screen or camera; pressing left/dragging left should produce visible motion in the opposite direction; up/down should likewise be opposite in screen or camera space.
- Player movement changes the character's position, facing, footstep/motion feedback, and camera follow position; during movement, the playable area cannot be obscured by the HUD or popups.
- Diagonal movement needs to be normalized and cannot be noticeably faster than movement in a single direction. Speed gradually returns to zero when stationary.
- Normal movement input should be rejected or paused while dialog, death, loading, a shop, or a blocking panel is open.

### Weapons, Aiming, and Shooting

- The player starts with a basic firearm and limited ammunition. The HUD must display the current weapon and ammunition.
- The player can switch among owned weapons; after switching, the current-weapon HUD, button icon, or equivalent indicator must synchronize. Unowned weapons should be shown as unavailable or be rejected when clicked; they cannot be switched to directly or consume resources.
- Shooting can be triggered by a keyboard key, an on-screen fire button, or touch-and-hold. When pressed, the character raises the weapon, and the action ends when released; automatic weapons can fire continuously while held, while ordinary weapons observe a rate-of-fire cooldown.
- Aiming can change the character's facing by dragging a right-side button or an equivalent method; the drag direction must correspond to the visible change in facing on the screen. Movement and aiming can be decoupled: while aiming, the character can shoot in one direction while moving in a movement direction.
- Threatening/raising a weapon without firing should exist as an independent action: while the threat button is held, the character raises the weapon or adopts a threatening stance, nearby ordinary NPCs flee or drop resources, and police or special targets may enter an attack state; the threatening stance ends when released.
- Shooting consumes ammunition and produces a visible trajectory or firing feedback. Projectiles hitting NPCs cause knockback/death, particle feedback, and an increased wanted level; those hitting buildings disappear or explode; rocket-type weapons cause area explosions, vehicle destruction, and chain damage.
- When ammunition is insufficient, shooting must not create projectiles or damage from nothing, and the HUD should not show negative ammunition.

### NPCs, Police, and Wanted Level

- Ordinary NPCs can move through or stand in neighborhoods; when shot, caught in an explosion, hit by a vehicle, or threatened, they must have a visible reaction, such as fleeing, falling, sliding, being thrown into the air, disappearing, or dying.
- When police or police vehicles are present, illegal acts such as attacking, hitting pedestrians, stealing vehicles, or causing explosions raise the wanted level. The wanted level is shown as stars or an equivalent HUD indicator, and the highest level should bring stronger pursuit pressure.
- At high wanted levels, police can chase or shoot the player; after the player takes damage, health decreases and there is screen/particle/knockback feedback.
- After escaping pursuit or respawning, the wanted level should reset or decrease according to the rules and cannot remain permanently stuck.

### Vehicles and Driving

- The city contains drivable vehicles and AI vehicles. The player can enter the driving state after approaching a suitable vehicle; after entry, the player character is hidden or seated inside the vehicle, and the semantics of the enter/exit button in the HUD change.
- Driving supports forward, reverse, left/right steering, and mobile directional dragging. Screen-space left and right steering must be opposite; forward and reverse must produce opposite visible displacement.
- Vehicles have speed, acceleration, deceleration, steering inertia, and collision feedback. Hitting a building causes the vehicle to stop or slide and produces sparks; hitting an NPC launches/damages them and raises the wanted level; hitting other vehicles causes physical displacement or rotation of both vehicles.
- The player can exit a vehicle. On exit, a standable position beside the vehicle must be found; if there is no valid nearby position, use a safe respawn point or another valid position, and do not place the player inside a building, in water, or outside the world.

### Resources, Pickups, and Shop

- The HUD displays at least health, cash, ammunition, current weapon, wanted level, and a current quest summary.
- Cash bundles, health packs, and ammunition packs must appear as visible objects in the world and be picked up by the player through movement contact or equivalent collision. When touched by the player, a cash bundle increases cash, is removed from the world, and produces visible collection feedback. When touched by the player, a health pack restores health and is removed from the world. An ammunition pack takes effect only when the corresponding ammunition can be increased.
- A shop NPC or shop entrance allows the purchase of weapons, ammunition, healing, and quest items. A purchase deducts cash and immediately changes ownership status, ammunition, or health; when the balance is insufficient, the purchase must be rejected, with cash and items unchanged.
- Ammunition for an unowned weapon cannot be purchased or used; an accidental activation should be refunded or rejected and cannot deduct money with no effect.
- The shop should be a player-visible, closable interaction panel. After opening the shop, the player should be able to see items, prices, purchase feedback, and insufficient-balance feedback; after it closes, main-scene input resumes.

### Quests and Progress

- The game should have a quest chain or equivalent objective system. The basic quest chain should cover multiple objective types: dialog/arrival, item pickup and delivery, stealing and delivering a vehicle, purchasing a quest item, and eliminating a target. Each objective should advance through player actions rather than completing automatically when the quest appears.
- The current quest must display its title/objective summary in the HUD and provide a directional arrow, distance, minimap marker, or equivalent navigation feedback.
- Quest objectives must be completed by player actions: walking to a location, clicking a target NPC icon to advance dialog, picking up an item, driving a specified vehicle into a delivery area, purchasing a specified item, defeating a specified target, and so on.
- After a quest is completed, grant a reward such as cash or a weapon, update quest progress, and start or prompt the next quest. Quest rewards cannot be granted directly when loading a prerequisite scene.
- Random quests can be a P2 depth system, but the basic chain should cover at least one completable dialog/arrival quest and one action-oriented quest.

### State and UI

- After the page launches, it should transition from loading/opening into a playable state. If there is a start screen, dialog, or loading layer, it must no longer obscure the main scene after completion or closing.
- A dialog window blocks normal movement/shooting, and clicking or a button can advance dialog; after closing, the HUD and playable input resume.
- The shop, quest popup, and death/respawn layer must clearly show and hide. In the playable state, no blocking layer can cover the playfield.
- Death condition: after health drops to 0, enter the result state, lock player input, and display the death/respawn layer. After respawn is clicked, health is restored, the player returns to a valid position, the wanted level resets, the death layer is hidden, and input resumes.
- A pause menu is not required for P1; if pause is provided, the world and input freeze while paused and continue after resuming.
- P2: The player can adjust camera distance through the wheel, pinch zoom, or an equivalent control. Zooming cannot hide the HUD, permanently obscure objectives, or cause the player to lose visible tracking of the character/vehicle.

### Audio and Feedback

- P2: Background music, footsteps, gunshots, explosions, collection, damage, and purchase feedback can enhance immersion; mute must be provided or browser autoplay restrictions must be observed.
- Visual feedback includes at least HUD value changes, button-pressed states, trajectories/particles/screen flashes, quest-completion prompts, the death layer, and minimap updates.

## Scope Reductions

- P2 may simplify specific NPC dialog text, the number of place names, vehicle-model appearances, quest-chain length, exact economy values, long-term saves, camera-zoom details, and the complete audio library.
- The P1 visible WebGL/true-3D city, walking directional input, shooting causal chain, vehicle entry/driving/exit, cash/health/ammunition/wanted HUD, death and respawn, and at least two completable quest objectives cannot be cut.

## Completion Criteria

- After entering the page, the player can see a non-empty 3D city and truly move the character using the keyboard and/or touch.
- The player can shoot and see causal changes in ammunition, trajectory/hits, NPCs/police/wanted level.
- The player can enter a vehicle, drive, collide, and exit, with clear HUD/input distinctions between driving and walking states.
- The player can collect resources, make purchases or have purchases rejected, complete quests, and receive rewards.
- When health reaches zero, the game enters the death state; respawning clears the death layer and restores the playable state.

---

## GDD / Design Doc (merged from design-doc.md)

# Grand Theft Astro Design Doc

## MDA

### Mechanics

M1: 3D city main scene. The player moves through a city composed of roads, blocks, buildings, vehicles, NPCs, and pickups; the scene must be readable, non-empty, and interactive.

M2: Walking movement and direction. The keyboard and touch joystick drive the character in screen/camera directions, and left/right and up/down inputs must have opposite visible motion.

M3: Weapons, aiming, and shooting. The player switches among owned weapons, drag aiming changes visible facing, and shooting consumes ammunition and produces trajectory/hit/explosion feedback, affecting NPCs, vehicles, buildings, and the wanted level; unowned weapons or no-ammunition states are rejected according to the rules.

M4: NPCs, police, threats, and wanted level. NPCs react visibly to threats, gunfire, impacts, and explosions; illegal acts raise the wanted level, and police chase or attack the player at high wanted levels.

M5: Driving vehicles. After entering a vehicle, the player switches to the driving state and controls it using forward/reverse/steering; forward and reverse, and left and right steering, must each have opposite visible effects. Collisions produce physics and particle feedback, and exiting returns the player to a valid position.

M6: Resources and HUD. Health, cash, ammunition, current weapon, wanted level, and quest objective are synchronized in the HUD; pickups, purchases, and damage update the visible state.

M7: Shop and equipment. The shop sells weapons, ammunition, healing, and quest items; a fully funded purchase deducts money and changes equipment/health/ammunition, while an insufficient balance or unowned weapon causes rejection with state preserved.

M8: Quest chain. Quests advance through objectives such as dialog/arrival, pickup and delivery, stealing and delivering a vehicle, purchasing a quest item, and defeating a target; completion grants rewards and displays the next objective, and an objective cannot complete automatically when it appears.

M9: State machine and respawn. States including loading, dialog, shop, playable, driving, death, and respawn are managed exclusively; death locks input, while respawn restores health, position, wanted level, and playable interaction.

M10: Minimap and navigation. The minimap displays summaries of the player, vehicles/NPCs/pickups/objectives, and so on; quest arrows or distance indicators help the player move toward objectives, and clicking can expand or close it.

M11: Mobile touch controls and buttons. A left-side or dynamic joystick handles movement, while right-side fire/threat/exit buttons handle actions; button presses and dragging must have visible feedback.

M12: Audio and presentation layer. Background audio, footsteps, gunshots, explosions, collection, damage, and purchases can be a P2 presentation layer, but visual feedback must cover core states.

M13: Camera zoom and readability. The player can use the wheel, pinch, or an equivalent operation to adjust viewing distance; after zooming, the character/vehicle, objective navigation, and HUD remain readable.

### Dynamics

The player constantly makes risk choices in the city: shooting, crashing, stealing vehicles, and advancing quests bring cash or progress, but also raise the wanted level and the risk of injury. Vehicles provide speed and impact capability but are harder to control and more likely to trigger pursuit. The shop turns cash into firepower, ammunition, or survivability. Death is not the end, but a punitive reset that prompts the player to continue exploring and completing objectives.

### Aesthetics

The game should provide the immediate thrill of blocky urban crime action: the city has density, vehicles and pedestrians move, shootouts/explosions/impacts have clear feedback, the HUD gives the player enough information, and quest navigation prevents the player from getting lost on the open map. The overall pace should be fast, accessible, and replayable.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 3D city main scene | P0 | Page launch or respawn enters the playable state | The main 3D city area is non-empty, the HUD is readable, and the player, city, and entities can be observed | Failure if the main scene is blank, only the HUD is present without a city, or a blocking layer covers the playable area |
| M2 walking movement direction | P1 | Press ArrowRight/ArrowLeft, ArrowUp/ArrowDown, or drag the movement joystick | The player's screen position and world summary change, with left/right and up/down producing opposite directions | Failure if movement is in the same direction, only values change without updating the image, or movement continues during dialog/shop |
| M3 weapons, aiming, and shooting | P1 | Switch to an owned weapon, drag to aim, press the fire key/click the fire button, then release | The current weapon and ammunition HUD synchronize, character facing changes according to drag direction, ammunition decreases, projectile or muzzle feedback appears, and the target is hit or the wanted level changes | Failure if an unowned weapon can be switched to directly, firing occurs without ammunition, a hit does not affect the NPC/wanted level, or only a button flash is shown |
| M4 NPCs/threats/wanted level | P1 | Threaten or attack an NPC, hit an NPC, or be shot by police | The NPC flees/falls/attacks/drops resources, wanted stars/HUD increase, and player health may decrease | Failure if a threat has no reaction, the wanted level does not change, an NPC remains still without reacting, or health can become negative |
| M5 driving vehicles | P1 | Approach and enter a vehicle, press forward/reverse/left/right steering, and click exit | State changes to driving, the vehicle's screen position/speed/facing changes, forward/reverse and left/right steering are opposite, and exit returns to walking | Failure if the player is placed despite there being no valid exit point, driving left/right are the same direction, forward/reverse are the same direction, or the vehicle passes through a building |
| M6 resources and HUD | P1 | Move into cash/supplies, take damage, or consume ammunition | HUD values and visible state synchronize, pickups decrease in the world, and collection feedback appears | Failure if cash/ammunition/health is negative, the entity does not decrease after pickup, or the HUD is not synchronized |
| M7 shop and equipment | P2 | Open the visible shop, click purchase, close it, or attempt a purchase with insufficient balance | With sufficient funds, cash decreases and the item is obtained; with insufficient funds, the purchase is rejected and cash/inventory remain unchanged; after closing, main-scene input resumes | Failure if money is still deducted or the item is granted with insufficient balance, buying ammunition for an unowned weapon is not handled, or the shop continues blocking after closing |
| M8 quest chain | P1/P2 | Complete dialog/arrival, pickup and delivery, vehicle theft and delivery, quest-item purchase, or target defeat | The quest HUD/navigation updates, the reward is granted, and the next objective appears or a completion prompt is shown | Failure if an objective completes as soon as it appears, a reward is not triggered by player action, navigation is missing, or quest types are only text without gameplay |
| M9 death and respawn | P1 | Click respawn after health reaches zero | The death layer appears and locks input; after respawn, health is restored, the wanted level resets, and the layer is hidden | Failure if movement/shooting remains possible at the end, or respawn does not clean up state or duplicates entities |
| M10 minimap navigation | P2 | Click the minimap, move, or change the quest objective | The minimap size/state switches, and the relative positions of the player and objective update | Failure if the minimap is static, does not change with the player/objective, or cannot be closed after expanding and remains blocking |
| M11 touch buttons | P2 | touch-drag the joystick, touch the fire/threat/exit button | Corresponding movement, aiming, shooting, threatening, or exit feedback appears | Failure if touch events do not work, all touch directions move the same way, or a button does not release |
| M12 audio presentation | P2 | Move, shoot, explode, collect, or mute | Optional sound-effect/music state changes, while visual feedback still works independently | Lack of audio should not affect P1; if mute is provided, audio must not continue playing after muting |
| M13 camera zoom | P2 | Wheel, pinch, or equivalent zoom input | Viewing distance changes, while the player/vehicle, quest navigation, and HUD remain readable | Failure if the character is lost after zooming, the HUD is obscured, or the playable view cannot be restored |

## System Notes

- The main-scene technology can be freely chosen, but the player must see a readable 3D city and character/vehicle motion.
- Game state should always be expressed through the HUD, scene objects, panels, and feedback, avoiding hidden value changes without player-visible results.
- Quests, purchases, pickups, defeats, and respawns must all have results triggered by player actions; they cannot skip the loop directly when entering a scene or opening a panel.
