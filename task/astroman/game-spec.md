# AstroMan Game Spec

## Requirements Overview

AstroMan is a portrait-oriented 3D open-world urban hero game. The player moves through a city containing roads, blocks, buildings, rooftops, vehicles, pedestrians, quest characters, shops, and coastal waters, earning score and reputation by moving, flying, driving, interacting, using superpowers, and completing quests. The game must retain the WebGL/3D main scene as a player-visible product requirement: after entering the playable state, the main view must not be blank or consist only of the HUD; the player should be able to see a readable city environment, the protagonist or current vehicle, NPCs/vehicles, and other entities.

## Visible Behavior Coverage Principles

The game is defined by behaviors the player can see and operate. Open-world actions, keyboard/touch input, flight throttle, camera switching, the minimap, NPC and vehicle movement, quest chains, quest timers, shop purchases, collectible resources, pickups that reduce wanted level, superpower effects, health/death, restart, score, reputation, wanted stars, vehicle entry/exit, modal/dialog blocking, mobile tutorial prompts, and so on must all form player-level rules and visible causal chains. Different versions may use different assets, layouts, names, and copy.

## Gameplay Requirements

### P0 Basic Experience

- After the game starts, it automatically enters the playable world, either immediately or after a brief loading period; after loading, the tutorial, or a modal disappears, it must not obstruct the main scene or core input.
- The main scene is a 3D city designed primarily for a portrait aspect ratio and includes roads, buildings/rooftops, coastal or boundary areas, NPCs, vehicles, quest/shop characters, collectibles, or target markers.
- The HUD displays at least score, reputation, health/a health bar, wanted stars, the current power, a quest panel or objective guidance, and a minimap.
- After the player dies, a result overlay appears, prevents further action, and provides an entry point to restart/revive.

### P1 Core Actions

- The player can move using keyboard direction keys or WASD; in third-person view, the up/down keys make the character move in opposite directions on the screen and in the world, while the left/right keys produce opposite horizontal screen displacement or turning results. On touch devices, the left joystick should drive character movement according to the drag direction.
- The player can use throttle input to take off and land. Ascend input on the keyboard should increase throttle and visibly increase screen height, while descend input should decrease throttle and eventually return the player to the ground or a standable surface; movement is faster during flight, and leaving a rooftop or crossing water should appear as flying/hovering rather than directly falling.
- The player can switch between first-person and third-person views. In first person, left/right input primarily turns while up/down input moves forward/backward; in third person, directional input moves directly.
- The player can approach a drivable vehicle and enter it; while driving, the protagonist no longer moves on foot, the vehicle responds to acceleration, reversing, and left/right steering, and an exit-vehicle control is displayed. After exiting, the player returns to a valid position near the vehicle.
- The player can hold or click the power button to use the current power; while it is being used, a power beam, particles, or an effect on the target should appear on screen, and it stops after release. A power must not only change a value without a visible effect.

### P1 Superpowers and Risk

- Include at least three switchable powers:
  - Heat ray: emits a straight beam along the facing direction of the protagonist/vehicle and can damage NPCs, vehicles, and some quest targets; hitting civilians or law-enforcement characters lowers reputation/score and raises wanted risk.
  - Wind-push power: forms a cone of airflow in the facing direction that pushes NPCs or vehicles, causing visible displacement or loss of control.
  - Frost power: forms a cone-shaped freezing effect in the facing direction, freezing NPCs or vehicles and displaying an icy covering that clears after a period of time.
- Directional semantics must correspond to player-visible results: after the character faces right/left or turns and uses a power, the power effect should extend from the character/vehicle position toward the corresponding on-screen facing direction; opposite directional inputs should produce opposite visible movement or effect directions.
- NPCs and vehicles should move continuously or perform simple behaviors in the city. When attacked, frozen, pushed, hit, or caught in an explosion, they must react visibly, and changes to HUD score/reputation/wanted level must stay synchronized with the consequences of the action.

### P1 Quests and Progression

- The game has a main quest chain advanced through quest characters, automatic starts, or map objectives. The quest panel displays the current objective, target direction, or distance, while the minimap and world guidance are used to find the target.
- Quest types cover rescue, timed delivery, finding/bringing back a target, pursuing and stopping an out-of-control vehicle, rescuing an aircraft, stopping a robbery, or defeating a large threat. The specific quest combination may merge or trim a small number of quests as P2, but P1 must provide at least one closed loop of “accept/start quest -> travel to target -> perform action -> complete/fail -> receive reward and advance.”
- Timed quests should have remaining time and failure conditions. Completing a quest increases score and reputation; failing or harming the wrong target should provide failure feedback or negative consequences.
- After completing the main quest line, the player may enter a free-quest/patrol mode in which new quest opportunities appear randomly or periodically; this is a P2 depth requirement.

### P1 Economy, Score, and Reputation

- The game maintains score, reputation, cash/resources, and available weapon or supply state. Heroic rescues and completed quests increase score and reputation; harming citizens, destroying vehicles, or attacking law enforcement deducts score or lowers reputation and may raise the wanted level.
- The wanted level has at most five stars, with higher levels being more dangerous; at high stars, the HUD should prominently warn of the risk.
- The player can collect cash and ammunition or obtain consumable resources from quest rewards. Shops provide healing, weapons, ammunition, or quest items. A successful purchase deducts resources and produces an item/healing/ammunition/quest-progress effect; insufficient resources, duplicate purchases of non-repeatable items, or purchases of currently unavailable supplies must be rejected or refunded, with resources and item state unchanged and feedback provided.
- Weapons are not merely inventory fields: once the player owns a gun or equivalent ranged weapon, they must be able to raise/fire it through a visible firing control or key. Firing should consume the corresponding ammunition, produce a muzzle flash/projectile/recoil or equivalent visible feedback, and cause visible consequences when hitting an NPC, vehicle, quest target, or law-enforcement target. When ammunition is exhausted, firing should be rejected or only provide empty-weapon feedback; it must not generate a projectile or make ammunition negative.

### P2 Depth Systems

- The minimap can zoom in/out, displays the player, vehicles, NPCs, shops, quest targets, collectible cash/ammunition/quest items, and wanted-reducing pickups, and stays synchronized with the player’s facing direction, driving state, and quest target direction.
- The player can pick up cash, ammunition, or quest items in the world; cash increases resources or produces score feedback, ammunition only replenishes the corresponding available weapon or supply slot, quest items advance the corresponding objective, and a wanted-reducing pickup only lowers wanted stars when wanted risk exists. A pickup should provide visible feedback such as particles, a screen flash, a HUD update, or disappearance from the minimap, and must not allow resources, ammunition, or wanted level to exceed their bounds.
- Dialog windows can advance line by line; while a dialog or shop is open, movement, driving, and power input are blocked and resume after it closes.
- Advanced weapon differences, rare ammunition types, vehicle explosions, police car/law-enforcement NPC shooting, panicked NPC flight, quest-target protection/cancellation, flight wraparound at world boundaries, special rooftop/water handling, mobile touch tutorials, and FPS/debug-info toggles may be P2 or presentation enhancements. The basic weapon-firing, ammunition-consumption, projectile/muzzle feedback, and exhaustion-rejection loop is required combat coverage and cannot be replaced solely by shop purchase fields.
- This task does not require retaining any specific asset, character name, brand name, exact copy, or exact map dimensions; these are replaceable presentation details.

## State Requirements

- `loading/tutorial`: may be displayed briefly, but must enter `playing` automatically or through an explicit action and must not permanently obstruct the main scene.
- `playing/walking`: the protagonist walks or flies and can move, switch views, use powers, interact, enter shops, accept quests, and enter vehicles.
- `driving`: the current vehicle becomes the primary controlled entity and can be driven, use powers, and be exited; walking input does not simultaneously move the hidden protagonist.
- `dialog/shop/panel`: when a dialog, shop, or quest prompt is open, main-scene actions are blocked; closing it restores the previous state.
- `dead/result`: after health reaches 0, the game enters the end state, displays a result overlay, and disables actions; restarting clears projectiles, temporary effects, the death overlay, and input locks, restoring the initial playable state.
- `questComplete/questFailed`: after a quest completes or fails, visible feedback is provided, score/reputation/the quest chain is updated, and the player then returns to patrol or the next quest.

## Completion Criteria

- The player can complete the core paths for movement, flying, power use, quest progression, shop purchase/rejection, death, and restart in the 3D city using real keyboard or touch controls.
- The main scene, HUD, quest panel, minimap, and interaction panels stay synchronized with the player-visible state; a core feature whose “state changed but the player cannot see it” is not allowed.
- Direction-sensitive inputs such as left/right, up/down, throttle ascend/descend, power facing, and driving steering must produce visible, mutually opposite directional results on screen.
- Economy and quest rules must include rejection and invariants: insufficient resources cannot purchase items, the end state cannot continue to gain score, restart clears temporary entities, and invalid actions cannot create rewards from nothing or skip the quest chain.
- Pickup and wanted rules must be observable and bounded: cash/ammunition/quest items can be obtained only through proximity or valid interaction, wanted-reducing pickups cannot reduce wanted below 0, and resources and the HUD must stay synchronized.

---

## GDD / Design Doc (merged from design-doc.md)

# AstroMan Design Doc

## MDA Overview

**Mechanics**: 3D city exploration; three modes of action—walking, flying, and driving; view switching; three directional powers; an NPC/vehicle ecosystem; a quest chain; pickups and a shop economy; weapon/ammunition/healing supplies; weapon firing and projectile feedback; score/reputation/wanted level; health/death/restart; and dialog/panel blocking.

**Dynamics**: The player patrols the city and follows quest guidance to find targets; movement and flight provide spatial freedom, while vehicles provide high speed but introduce collision risk; powers can resolve threats but may also cause collateral damage, and score, reputation, and wanted stars communicate the consequences of actions to the player; shops, pickups, and quest rewards supply and advance weapons, ammunition, healing, cash, and quest items.

**Aesthetics**: An urban-hero fantasy, open patrol, fast movement, visible destruction/rescue feedback, a quest-driven sense of purpose, and the sense of risk created by “strong powers with social consequences.”

## M-Features

### M1 3D City Main Scene and HUD
After entering, the player sees a readable WebGL/3D city, the protagonist or vehicle, NPCs/vehicles, the HUD, the minimap, and quest/power/health/score information.

### M2 Walking and Screen-Directional Movement
The keyboard and touch joystick drive protagonist movement; paired up/down and left/right inputs must produce opposite visible displacement or turning results in screen space.

### M3 Flight Throttle and Altitude
Ascending/descending throttle changes altitude and movement speed; the flight state has visible altitude/posture/particle or HUD evidence and can return to the ground.

### M4 View Switching
The player can switch between third-person and first-person views; after switching, the control semantics and visible camera/protagonist presentation change.

### M5 Superpower Use and Switching
The heat, wind-push, and frost powers can be switched and held to use; effects appear along the facing direction of the character/vehicle and end when input stops.

### M6 Consequences of Power Hits
Powers affect NPCs, vehicles, or quest targets; hits cause damage, pushing, freezing, explosions, or quest-state changes and synchronize score/reputation/wanted level.

### M7 Vehicle Entry, Driving, and Exit
The player can enter a nearby vehicle; in driving mode, the vehicle responds to acceleration, reversing, and steering; exiting returns the player to a valid walking position and restores the corresponding UI.

### M8 Quest Chain and Objective Guidance
The quest panel, minimap, and world guidance direct the player through objectives such as rescue/delivery/pursuit and stopping/combat; completion or failure updates rewards and progress.

### M9 Economy, Pickups, and Shops
Cash/resources can be obtained through collection or quests; wanted-reducing pickups can lower wanted risk; shops can sell healing, weapons, ammunition, or quest items; ammunition and non-repeatable items must be restricted by availability state; insufficient resources or purchases of unavailable supplies are rejected or refunded while leaving state unchanged.

### M9b Weapon Firing and Ammunition
After obtaining a ranged weapon, the player can fire through a real button, touch control, or keyboard input; firing consumes ammunition, generates a projectile, muzzle flash, recoil, or equivalent visible feedback, and can hit an NPC, vehicle, or quest target. When ammunition is 0, firing must not generate a valid projectile or cause hit consequences, and ammunition cannot become negative.

### M10 Health, Death, and Restart
The player loses health from law-enforcement attacks, explosions, or failure events; depleted health opens the result overlay and disables input, while restarting restores the playable state.

### M11 Dialog, Tutorial, and Panel Blocking
When dialogs, shops, tutorials, and the result overlay appear as overlay UI, they should correctly block or release playfield input.

### M12 Deep Ecology and Optional Systems
NPCs/vehicles move continuously; minimap zoom, free quests, unfreezing, vehicle explosions, wanted escalation, mobile touch tutorials, and similar features enhance the world’s activity.

## Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 3D City Main Scene and HUD | P0 | Start or restart | Readable non-empty main scene; HUD displays score/reputation/health/power/minimap | Buttons alone or a black screen cannot pass; HUD and state desynchronization is a failure |
| M2 Walking and Screen-Directional Movement | P1 | Hold up/down/left/right or drag the joystick | The protagonist’s screen position, facing, or camera following changes consistently with the direction | Opposite directions producing movement in the same direction, no displacement, or crossing boundaries through water/walls is a failure |
| M3 Flight Throttle and Altitude | P1 | Hold the ascend throttle, then hold the descend throttle | Altitude/flight state increases and then decreases; speed or visual presentation changes | Out-of-bounds throttle, failing to land when descending, or flight changing only values without visual evidence is a failure |
| M4 View Switching | P2 | Click/press a key to switch views | The camera mode, protagonist visibility, or view HUD changes | Invalid switching while driving should be rejected; input semantics must not become confused after switching |
| M5 Superpower Use and Switching | P1 | Click the power button/use a shortcut to switch, then hold to use | The current power on the HUD changes; a beam/airflow/freezing visual or target effect appears during use | A power button that only lights up without producing an effect, or use that continues indefinitely after release, is a failure |
| M6 Consequences of Power Hits | P1 | Face a target and use heat/wind-push/frost | The target is damaged/frozen/pushed/explodes, and score/reputation/wanted level or quest state updates | No consequence for hitting the wrong target, rewards increasing from nothing, or an invisible target is a failure |
| M7 Vehicle Entry, Driving, and Exit | P1 | Approach a vehicle, press interact, then drive and exit | Driving state is visible, the vehicle moves/turns, and exiting returns to walking | A vehicle cannot be entered without being nearby; the protagonist should not simultaneously walk while driving |
| M8 Quest Chain and Objective Guidance | P1 | Start/accept a quest, travel to the target, and complete the action | Quest-panel progress, target markers, rewards, the next quest, or failure feedback | A quest cannot complete before the player performs the objective; timed failure should be visible |
| M9 Economy, Pickups, and Shops | P2 | Approach a pickup, open a shop, and click purchase | Cash/ammunition/quest item/wanted-reducing pickups produce visible feedback; a successful purchase deducts resources and adds an item/healing/weapon/ammunition; insufficient funds or unavailable supplies are rejected/refunded | Resources, inventory, ammunition, wanted stars, and the HUD remain synchronized; resources and ammunition cannot exceed bounds, and wanted level cannot fall below 0 |
| M9b Weapon Firing and Ammunition | P2 | Fire through a real control while owning a weapon and ammunition; fire again after ammunition is exhausted | Ammunition decreases, projectile/muzzle/recoil/hit feedback appears; when exhausted, firing is rejected or empty-weapon feedback appears | Ammunition cannot be negative; no ammunition means no valid projectile or hit reward can be generated |
| M10 Health, Death, and Restart | P1 | Take damage until health is exhausted, then click restart | The result overlay appears and input is locked; restart clears the end state and restores health/state | Continuing to score/move after the end state, or projectiles/panels remaining after restart, is a failure |
| M11 Dialog, Tutorial, and Panel Blocking | P2 | Open a dialog/shop/result overlay, then close or advance it | The overlay blocks the main scene; after it closes, the main scene is interactive | An overlay still obstructing the main scene during the playable state is a failure |
| M12 Deep Ecology and Optional Systems | P2 | Observe while idle, wait for unfreezing, zoom the minimap, or play free quests | NPCs/vehicles/the minimap/freeze timer/free quests visibly change | Only static entities or depth systems that do not affect the world are failures; after minimap zoom, it must still convey player/target/pickup semantics |

## Feature Boundaries

- The core systems of the 3D/WebGL main experience, open city, movement/flying/driving, quests, powers, economy, and health/restart must be retained.
- Quest dialog, character names, asset names, specific map dimensions, numeric constants, specific audio, or every random event do not need to be reproduced verbatim.
- If the full main quest line cannot be provided, P1 must include at least one complete quest loop; additional quests, free patrol, and special large targets are P2 depth.
