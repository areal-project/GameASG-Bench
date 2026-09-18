# William Afton life Gameplay Requirements

## 1. Game Positioning and Objectives

This is a blocky pixel-style 3D open-city life/crime sandbox. The player takes the role of William Afton, walking and driving through an explorable city, interacting with NPCs and vendors, using weapons, avoiding or provoking the police, and advancing the story and resource growth along a mission chain.

The player's long-term objective is to continuously complete city missions, earn cash and weapon resources, expand their ability to act, and survive while balancing health, wanted level, ammunition, and traffic risks. The game does not require a fixed endpoint for a single session; its main progression comes from completing missions, obtaining rewards, expanding equipment, reaching locations, and respawning after death to continue acting.

## 2. P1 Core Experience

- Readable 3D city main scene: after entering, the player should see streets, buildings, vehicles, NPCs, pickups, vendors/mission targets, and a clear view of the player character or vehicle.
- Open movement: the player can travel through the city on foot, follow directional guidance to approach targets, and be naturally blocked or affected by bodies of water, buildings, boundaries, and vehicles.
- Driving and car theft: after approaching a stopped vehicle that can be entered, the player switches to driving mode, with the vehicle receiving control in place of the character; the player can exit the vehicle and return to walking mode.
- Mission loop: missions use an objective panel, directional arrows, distance, or target markers to guide the player to talk, deliver goods, buy items, steal vehicles, reach locations, or kill targets; completion grants cash or weapon rewards and advances to the next segment.
- Weapons and wanted status: the player can hold a gun, fire, switch weapons, and consume ammunition; attacking NPCs or vehicles or stealing a car increases wanted pressure, and police officers and police cars pursue or attack the player at a high wanted level.
- Health and failure: vehicle collisions, police bullets, explosions, or special death events reduce health; when health is depleted, a death result is shown and further actions are prevented, while respawning restores health, position, and an operable state.
- Economy and vendors: the player obtains cash through missions and pickups and can buy weapons, ammunition, healing, or mission items from vendors; when cash is insufficient or conditions are not met, the purchase is rejected and negative feedback is given.

## 3. Input Semantics and Control-Feel Causal Chain

### 3.1 Walking Movement

The player can move using the keyboard arrow keys/WASD or by dragging an on-screen joystick. Holding or dragging continuously makes the character walk in the corresponding direction, and the character's body should turn in sync with the movement direction; the more pronounced the drag, the steadier the movement. After the key is released or dragging ends, the movement vector returns to zero, and the character stops moving forward and returns to an idle pose.

The player cannot pass through buildings, impassable water, or world boundaries while moving; if movement is blocked on only one axis, the character should slide along the passable edge instead of becoming completely stuck. Movement should have a visible walking animation, slight bobbing, footstep feedback, or equivalent motion feedback. When the character is launched by a vehicle collision or explosion, normal movement is temporarily disabled, and the character flies in the direction of the force, falls, bounces, or slides; control is restored only after landing. If health is depleted during this process, the character enters the death state after landing.

### 3.2 Aiming, Raising the Weapon, and Shooting

While walking, the player can hold the fire button, spacebar, or an equivalent control to raise the weapon. After it is pressed, the arms first rise, and firing begins only after a stable aiming pose is reached; automatic weapons can keep firing until the control is released, while non-automatic weapons fire according to their firing cadence. Each shot consumes ammunition for the current weapon, and insufficient ammunition produces no effective bullet.

When aiming by dragging on the right side, the aiming direction is separate from the movement direction: left-side movement still determines character translation, while right-side dragging determines the character's facing and ballistic direction. After the drag direction changes, the muzzle, character facing, and projectile trajectory should change toward the new visible direction. Firing produces a muzzle flash, projectile trajectory, and ammunition HUD change, and gives the character slight recoil movement in the opposite direction; the recoil then gradually decays.

The hold-up/threatening action differs from firing: while the player holds it, the character maintains a raised-weapon or threatening pose without firing bullets, and lowers it after release. This action may affect the reactions of nearby vehicles or NPCs, but should not consume ammunition.

### 3.3 Driving

After entering a stopped vehicle, the player switches to driving mode, the character body is hidden or leaves the main view, the camera follows the vehicle, and the weapon button is de-emphasized or becomes an exit-vehicle action. After exiting, the vehicle stops and the character reappears at a valid position beside the vehicle.

Keyboard driving uses acceleration, brake/reverse, and steering semantics: sustained forward input gradually accelerates the vehicle, which naturally slows after release; sustained backward input first brakes forward speed strongly to a stop, then begins reversing with a limited reverse speed; left and right input produce steering only when the vehicle has sufficient speed, and steering builds gradually and briefly decays after release. When reversing, the vehicle's front-end response to left and right steering should match the reversed feel of backing up a vehicle.

Touch/mouse joystick driving uses a "point to drive" feel: the drag direction provides a target heading, and the vehicle continuously turns automatically toward that direction and moves forward; the greater the difference between the drag direction and the vehicle's heading, the more pronounced the turn, while forward speed decreases due to sharp turning. After the joystick is released, the vehicle's angular velocity and speed gradually decay.

When a vehicle hits a boundary, building, curb, NPC, or another vehicle, it must produce visible risk feedback: sparks, particles, shaking, bouncing, stopping, pushing, or objects being thrown. Hitting an NPC launches/knocks down the target and raises the wanted level; hitting a building stops the vehicle or sends it backward; a vehicle-to-vehicle collision puts the vehicle into a brief loss of control/skid before it gradually stabilizes. A rocket or explosion hitting a vehicle destroys it, creates an explosion and debris, and may injure the player inside or nearby entities.

## 4. World Systems and Visible Feedback

The city should feel like a living district: moving civilian cars and police cars are on the roads, while ordinary NPCs, police officers, mission NPCs, vendors, cash bundles, ammunition, or health packs are on the streets. NPCs and vehicles are not merely background elements; they are affected when the player approaches, raises a weapon, shoots, collides, changes the wanted level, or changes mission state.

The minimap should continuously show the position of the player or current vehicle within the city, using different markers to represent vehicles, NPCs, vendors, mission targets, cash, healing, important locations, and so on. The minimap can zoom in/out; when enlarged, it should cover a larger view but must not permanently prevent the player from returning to the main scene.

At minimum, the HUD should synchronously display health, cash, ammunition/weapon, wanted stars, and the current mission. Obtaining cash or picking up healing should produce positive on-screen feedback and a HUD update; taking damage, a failed purchase, being hit, or a wanted-level increase should produce negative feedback; switching weapons should visibly confirm that the current weapon has changed.

## 5. Mission and Progression Flow

After the game begins, the first mission may start automatically through story dialogue or a mission panel, or it may be offered by a mission NPC. Once a mission is active, the screen should show the mission title/objective summary and guide the player using arrows, distance, a target circle, NPC icon, or map marker.

Mission types should cover the following P1 playable paths:

- Talk: reach the target NPC and advance after triggering dialogue or confirming the interaction.
- Delivery: first pick up the item at the specified location, show its carried state on the HUD, and then give the item to the target.
- Buy: purchase the item required by the mission from a vendor and advance after a successful purchase; the mission cannot be completed when cash is insufficient.
- Steal/deliver a vehicle: find the target vehicle, enter driving mode, drive the vehicle to the target area, and then automatically exit or complete the delivery.
- Kill: approach the target NPC, who may flee or fight back; complete the mission after the player takes down the target with a weapon or vehicle.
- Reach a location: complete the mission after moving into the marked area.

After a mission is completed, cash, a weapon, or an equivalent reward should be granted, the current target guidance should be hidden, completion feedback should be shown, and the game should advance to the next mission or return to a freely explorable state. If the next mission begins automatically, dialogue or a notification should first help the player understand the new objective; if it does not begin automatically, a discoverable entry point to the subsequent mission should remain.

## 6. Combat, Wanted Status, and Police Risk

Attacking ordinary NPCs, police officers, vehicles, or carjacking raises the player's wanted level; the same behavior should cause greater pressure when police are nearby. The wanted level is expressed through stars or an equivalent HUD, and at high levels, police cars approach the player more aggressively while police officers exit their vehicles or spawn and shoot at the player.

Police bullets hitting the player reduce health, produce red/injury feedback, and cause slight knockback. Some pursuing units may disappear or stop pursuing after the player gets far enough away, but the wanted state should not be cleared without reason; only death and respawn clear the wanted and hostile states.

When ordinary firearms hit an NPC, they should push the target away, cause sliding, kill the target, or make it disappear, and may affect mission objectives and the wanted level. Explosive weapons should create an area explosion at the collision point, produce stronger results on vehicles, NPCs, and nearby objects, and may trigger chain vehicle destruction.

## 7. Shops, Resources, and Rejection Paths

When the vendor panel opens, it should temporarily cover or block main-scene operations and list purchasable items and their prices. A successful purchase deducts cash and immediately takes effect: granting a weapon, replenishing ammunition, restoring health, granting a mission item, or triggering a special story result. After a purchase, the HUD and the available weapon/ammunition/health state should change in sync.

Rejection paths must be visible:

- When cash is insufficient, it cannot be reduced below zero, the purchase has no effect, and failure feedback is given.
- When a weapon is not owned, its corresponding ammunition cannot be purchased or used as an effective replenishment; if payment has already been deducted, it must be rolled back, or the deduction must be rejected.
- Outside walking mode, the player cannot shoot or switch weapons; the primary interactions in driving mode should be driving and exiting the vehicle.
- When dialogue, shop, death-result, or loading states are active, main-scene inputs such as movement, shooting, and driving should be blocked.
- In the terminal death state, the player cannot continue moving, firing, purchasing, or advancing missions until choosing to respawn.

## 8. State Flow and Interface Modes

### 8.1 Startup and Loading

After the game starts, it first shows loading/scene-entry feedback, during which the main inputs are disabled. After loading completes, the blocking layer is hidden and the game enters a playable city state with the HUD, minimap, and main scene visible.

### 8.2 Main Scene

The main-scene state is divided into walking and driving. While walking, the player can move, aim, shoot, raise their hands, pick up items, talk, shop, and enter vehicles; while driving, the player can accelerate, brake, steer, collide, deliver vehicles, and exit. Both states share health, cash, mission, wanted, and map information.

### 8.3 Dialogue/Mission Panel

When dialogue is open, the combat/driving HUD is hidden or de-emphasized, and clicking or confirming advances the dialogue. After dialogue ends, the main-scene HUD is restored, and the game starts a mission, displays an objective, or returns to exploration according to the story.

### 8.4 Shop

When the shop is open, it displays the list of goods and a way to close it. The player can make a purchase, receive failure feedback, or close it and return to the main scene. After closing, the shop must no longer block movement or shooting.

### 8.5 Death and Respawn

After health reaches zero or a special death is triggered, the character displays a death animation/pose, the main inputs are disabled, and the death result and respawn entry point are shown. Respawning restores health, clears wanted status, resets hostile states, returns the player to walking mode and the spawn area, and removes the death overlay.

## 9. Victory, Defeat, Failure, and Progression

P1 victory in this game is not a single endpoint, but the completion of missions and receipt of rewards. Each completed mission forms a "victory segment": the objective is achieved, the reward is granted, the HUD is updated, target guidance is cleared, and the next objective appears or free exploration resumes.

Failure mainly comes from death and rejection paths. Death pauses the current action and requires respawning; failed purchases, inputs blocked by a panel, a vehicle hitting a wall, depleted ammunition, or not having reached a target are local failures or preserved rule states and should not directly clear long-term progress or leave the player stuck. If a mission cannot be completed because the player has not satisfied its conditions, the interface should continue to retain target guidance or provide understandable feedback.

## 10. P2 Optional Enhancements

- A more complete story mission chain, multi-stage dialogue, automatic mission continuation, and different NPC personality reactions.
- Clothing/character-form changes, as well as story death or transformation sequences triggered after purchasing special clothing.
- More varied weapon tiers, automatic weapons, explosive weapons, ammunition drops, vehicle chain explosions, and large-scale particle effects.
- More detailed police behavior: police-car deployment, police exiting vehicles, long-distance cleanup, downgrading after escape, or pursuit resumption.
- Savable long-term progress, completed missions, owned weapons, cash, best exploration results, or location unlocks.
- Dedicated arrows, entrance prompts, and themed buildings for important locations, such as a restaurant/pizzeria destination.
- A complete audio layer for music, footsteps, gunshots, explosions, and purchase feedback.

## 11. Cut Scope

- No particular brand-licensed story, real-person biography, or complete horror-series setting is required; retain only the visible action theme of a "William Afton city sandbox."
- Multiplayer, networking, leaderboards, account systems, or user-generated content are not required.
- Full indoor exploration, access to every building, complex traffic laws, or a real city map are not required.
- Every NPC is not required to have long-term memory; P1 only requires them to react visibly to the current mission, attacks, vehicles, and police risks.
- Exact art presentation, fixed interface wording, fixed colors, or a fixed layout are not required; the only requirement is that the player can understand states, objectives, risks, and results.

---

## GDD / Design Doc (merged from design-doc.md)

# William Afton life Design Doc

## 1. Design Intent

`William Afton life` is a blocky pixel-style 3D city sandbox about surviving and advancing through criminal city work. The player should feel free to roam, drive, threaten, shoot, buy, steal, deliver, and flee inside a readable urban world that reacts to violence, traffic, vendors, mission targets, police pressure, and death.

The design goal is not a single linear finish line. The core success unit is a completed city task: follow a visible objective, perform the required action, receive money or equipment, clear or update the objective, and continue into the next job or free exploration. Failure is mostly local and recoverable, except death, which locks action until respawn.

## 2. MDA

### Mechanics

- 3D city playfield with streets, buildings, water/boundaries, traffic, NPCs, vendors, pickups, task targets, HUD, and minimap.
- Walking controls through keyboard or touch/mouse joystick, with held input causing continuous movement and release stopping the movement vector.
- Direction-separated combat controls: movement can continue while aim/fire direction is controlled by gun input or right-side drag.
- Vehicle entry, driving, collision, delivery, and exit, with separate walking and driving modes.
- Mission chain with talk, delivery, buy, steal/deliver vehicle, kill, and arrive-at-location tasks.
- Cash, weapons, ammo, health, wanted level, vendor purchases, pickups, and visible rejection feedback.
- NPC, car, police, projectile, explosion, collision, injury, death, and respawn reactions.
- Dialogue, shop, death, loading, and main-scene modes that gate player input appropriately.

### Dynamics

- Players orient by reading HUD objectives, arrows, target markers, distances, and minimap marks.
- Walking produces fine navigation and interaction; driving produces faster travel, higher collision risk, and vehicle-specific task opportunities.
- Threatening, shooting, carjacking, and collisions increase power but also increase wanted pressure and police danger.
- Cash and pickups create a resource loop: earn or collect, spend at vendors, improve survival or combat capability, then take on riskier tasks.
- Death interrupts the current action, clears hostile pressure after respawn, and returns the player to the city rather than ending long-term progress.

### Aesthetics

- The city should read as lively, dangerous, and legible: moving vehicles, reacting NPCs, clear objective guidance, and visible consequences for violence or crashes.
- Controls should feel physical: walking stops when released, vehicles accelerate and coast, collisions shove or stop objects, bullets push targets, explosions throw debris and damage nearby entities.
- Feedback should be immediate and readable: HUD changes, notifications, target markers, damage effects, muzzle flashes, projectile trails, impact reactions, death/result overlays, and shop refusal feedback.

## 3. Feature Priorities

Machine-readable M-feature index for pipeline coverage gates:

M0: Boot to playable city
M1: Mode gating
M2: State feedback
M3: Walking exploration
M4: Aiming and shooting
M5: Vehicle theft and driving
M6: Mission chain
M7: Economy and vendors
M8: Wanted and police risk
M9: Health, death, respawn
M10: Living city feedback
M11: Extended narrative chain
M12: Special character/appearance events
M13: Expanded combat effects
M14: Deeper police behavior
M15: Persistence
M16: Landmark polish

### P0 Foundation

| ID | Feature | Design Requirement |
|---|---|---|
| M0 | Boot to playable city | The game enters a readable 3D city state with main HUD, minimap, player/vehicle perspective, and no blocking loading layer once play begins. |
| M1 | Mode gating | Loading, dialogue, shop, death, walking, and driving states visibly change available actions and prevent inappropriate input. |
| M2 | State feedback | Health, cash, weapon/ammo, wanted level, and current objective are visible and update after relevant actions. |

### P1 Core Gameplay

| ID | Feature | Design Requirement |
|---|---|---|
| M3 | Walking exploration | Held keyboard/joystick input moves the player in the intended direction, release stops movement, obstacles/bounds block or slide movement, and knockback temporarily overrides control. |
| M4 | Aiming and shooting | In walking mode, fire input raises the weapon, fires according to weapon/ammo limits, consumes ammo, shows firing feedback, launches projectiles in the aim direction, and applies recoil that decays. |
| M5 | Vehicle theft and driving | Near a stopped vehicle, the player can enter driving mode, accelerate/brake/turn or joystick-drive, collide with world/NPC/vehicles, and exit back to walking near the vehicle. |
| M6 | Mission chain | Objectives guide the player through talk, delivery, buy, steal/deliver vehicle, kill, and arrival tasks; completion gives rewards and advances or returns to exploration. |
| M7 | Economy and vendors | Cash and pickups support purchases of weapons, ammo, healing, or task items; successful purchases update resources and failed purchases are rejected without invalid resource loss. |
| M8 | Wanted and police risk | Attacks, carjacking, and harmful collisions raise wanted pressure; police units pursue or shoot at higher pressure, causing health loss and injury feedback. |
| M9 | Health, death, respawn | Damage can lead to death; death locks main actions and shows a respawn path; respawn restores life, clears wanted/hostility, returns to walking, and removes death blocking. |
| M10 | Living city feedback | NPCs, vendors, quest givers, pickups, cars, police, projectiles, explosions, and minimap marks must be active world elements, not just decorative numbers. |

### P2 Depth And Polish

| ID | Feature | Design Requirement |
|---|---|---|
| M11 | Extended narrative chain | More dialogue stages, automatic task handoff, varied NPC reactions, and clearer story beats. |
| M12 | Special character/appearance events | Optional outfit or form changes and special narrative consequences. |
| M13 | Expanded combat effects | More weapon tiers, automatic weapons, explosive weapons, ammo drops, vehicle chain explosions, and richer particles/audio. |
| M14 | Deeper police behavior | Police deployment, dismounting, escape downgrade, despawn/re-engage rules, and stronger chase staging. |
| M15 | Persistence | Saved cash, owned weapons, completed tasks, unlocks, best progress, or discovered locations. |
| M16 | Landmark polish | Distinct important locations, stronger destination arrows, themed buildings, and optional audio layer. |

## 4. P1 Core Loop Executable Trajectories

### Loop A: Start Or Respawn Into City Exploration

1. **Start/reset:** Play begins after loading, or the player respawns after death. The player is in walking mode with health restored, HUD and minimap visible, and main-scene controls enabled.
2. **Player input:** Hold WASD/arrow keys or drag a movement joystick.
3. **Continuous state change:** The player moves and turns toward the input direction. Releasing input zeroes movement and returns to idle. Buildings, water, hard boundaries, and vehicles block movement; partial blocking lets the player slide along passable edges. Knockback from vehicles or explosions temporarily overrides normal control until landing or settling.
4. **Goal/risk:** The player uses arrows, distance, objective text, and minimap markers to approach NPCs, vendors, pickups, cars, or task zones while avoiding collision and police danger.
5. **Reward/failure:** Reaching a valid target can open dialogue, collect cash/healing/ammo, enter a vehicle, or advance an objective. Collision or police fire can reduce health; invalid movement cannot pass through blocked terrain.
6. **Progress/restart:** The player continues to the next target, switches into another loop, or dies and must respawn before resuming.

### Loop B: Mission Task Completion

1. **Start/reset:** A current objective is active after first entry, dialogue, previous completion, or respawn continuation.
2. **Player input:** Follow the objective marker by walking or driving, then interact, pick up, buy, enter/deliver a vehicle, shoot a target, or stand in an arrival zone depending on the objective.
3. **Continuous state change:** Distance to target decreases, HUD/marker/minimap guidance updates, carried item or vehicle state changes when acquired, and relevant NPC/vendor/target state responds.
4. **Goal/risk:** The player must satisfy the task condition without dying or being blocked by missing cash, missing item, wrong mode, or insufficient combat capability.
5. **Reward/failure:** Completion grants cash, weapon/equipment, or mission item progress, clears or changes the marker, and gives completion feedback. If conditions are unmet, the objective remains active and feedback explains or implies why it did not complete.
6. **Progress/restart:** The next task starts automatically or becomes discoverable; death interrupts action and requires respawn before continuing.

### Loop C: Driving And Vehicle Delivery

1. **Start/reset:** The player is walking near a stopped usable vehicle, or a steal/delivery task points to a target vehicle.
2. **Player input:** Interact/enter vehicle. While driving, hold forward to accelerate, hold backward to brake then reverse, hold left/right to steer, or drag a joystick toward a driving direction. Use exit input to return to walking.
3. **Continuous state change:** Vehicle speed builds under sustained acceleration, coasts down after release, brakes strongly before reversing, and turns only meaningfully when moving. Joystick driving turns toward the dragged direction while speed drops during sharp turns. Driving mode shifts camera focus to the vehicle and weakens walking-only weapon controls.
4. **Goal/risk:** Drive to the target zone or use the vehicle for fast travel while avoiding buildings, road edges, NPCs, other cars, police, and explosive damage.
5. **Reward/failure:** Successful delivery completes a vehicle objective and rewards progress. Hitting NPCs can raise wanted level; hitting buildings or cars causes bounce/stop/slide/unstable motion; explosions can destroy the vehicle and injure or eject the player.
6. **Progress/restart:** Exit or delivery returns the player to walking; death from damage sends the player to the death/respawn loop.

### Loop D: Combat, Wanted Pressure, And Police Risk

1. **Start/reset:** The player is walking with an owned weapon and ammo, or near a kill target/police risk.
2. **Player input:** Hold fire or press the gun control; optionally drag aim to separate shot direction from movement. Switch weapons only among owned weapons. Hold-up/threat input raises arms or weapon without firing.
3. **Continuous state change:** The character raises the weapon before effective shooting. Firing consumes ammo, emits muzzle/projectile feedback, launches shots along the visible aim direction, and applies recoil opposite the shot direction that fades. Automatic weapons continue firing while held; non-automatic weapons fire by their cadence. No ammo means no effective projectile.
4. **Goal/risk:** Hit a target NPC, vehicle, or task enemy while managing ammo and wanted escalation. Police may close distance and shoot back when wanted pressure is high.
5. **Reward/failure:** Hits push, kill, destroy, explode, or otherwise affect targets and can complete kill objectives. Violence raises wanted pressure. Police shots reduce health and show damage feedback. Shooting in blocked modes or without ammo is rejected by state.
6. **Progress/restart:** A completed kill task rewards and advances. Surviving police pressure allows continued play; health reaching zero enters death and respawn.

### Loop E: Vendor And Resource Upgrade

1. **Start/reset:** The player has cash from missions or pickups and reaches a vendor or required buy objective.
2. **Player input:** Open the shop, choose a weapon, ammo, healing, or task item, then buy or close.
3. **Continuous state change:** Shop mode blocks main-scene movement/combat. Successful purchase subtracts cash and immediately updates owned weapons, ammo, health, task item, or objective state. Closing returns control to the city.
4. **Goal/risk:** Buy the needed item or improve survival while preserving enough resources for later tasks.
5. **Reward/failure:** Valid purchases produce positive feedback and synchronized HUD changes. Insufficient cash, missing weapon ownership for ammo, wrong mode, or unmet task condition rejects the purchase without negative cash or false completion.
6. **Progress/restart:** The player returns to exploration with updated resources, completes a buy objective when applicable, or leaves the task active until requirements are met.

### Loop F: Death And Respawn Recovery

1. **Start/reset:** The player takes cumulative damage from police fire, collisions, explosions, or special death events.
2. **Player input:** Before death, the player may flee, drive, fight, buy healing, or collect health. Once dead, only the respawn path is active.
3. **Continuous state change:** Health falls with visible injury feedback. At zero health, the player enters a death pose/result state and movement, shooting, driving, buying, and objective advancement are disabled.
4. **Goal/risk:** Avoid or recover from danger before health reaches zero.
5. **Reward/failure:** Surviving preserves current play. Death is a hard local failure that prevents further action until respawn.
6. **Progress/restart:** Respawn restores health, clears wanted and hostility, returns to walking near a valid spawn area, removes death blocking, and lets the player resume exploration or mission work.

## 5. Mechanism Coverage Matrix

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M0 Boot to playable city | P0 | Start game or respawn | City, HUD, minimap, player/vehicle view, and interactable main scene are visible | Loading/death/shop/dialogue overlays must not permanently block play once dismissed |
| M1 Mode gating | P0 | Open dialogue/shop, enter/exit vehicle, die/respawn | Available controls and HUD emphasis change with mode | Dialogue/shop/death/loading block movement, shooting, driving, and mission advancement until closed or resolved |
| M2 State feedback | P0 | Earn, spend, shoot, take damage, raise wanted | Health, cash, ammo/weapon, wanted stars, and objective display update | HUD cannot diverge from gameplay state after a visible action |
| M3 Walking exploration | P1 | Hold/release movement keys or joystick | Player moves/turns, stops on release, collides/slides, animates or otherwise visibly walks | Blocked terrain cannot be crossed; knockback temporarily overrides player movement and death can interrupt recovery |
| M4 Aiming and shooting | P1 | Hold fire, drag aim, switch owned weapon | Weapon raises, ammo decreases, projectile/muzzle/recoil feedback appears, target can be hit | No ammo produces no effective shot; unowned weapon switch is refused; driving or blocked modes prevent firing |
| M5 Vehicle theft and driving | P1 | Enter nearby stopped vehicle, accelerate/brake/turn, exit | Driving mode begins, camera follows vehicle, speed/turning respond continuously, exit returns to walking | Vehicle controls differ from walking; collisions cause visible risk; destroyed vehicle cannot behave like a normal car |
| M6 Mission chain | P1 | Follow marker and perform objective action | Objective state, marker, reward, and next task/free-roam state update | Missing item/cash/vehicle/target condition does not complete task; objective remains understandable |
| M7 Economy and vendors | P1 | Open vendor, buy item, close shop | Shop blocks play, successful purchase changes cash and resource/equipment/task state | Cash cannot go negative; invalid ammo/item purchases are rejected; closed shop no longer blocks play |
| M8 Wanted and police risk | P1 | Attack, carjack, hit NPC/vehicle, remain wanted | Wanted level rises, police approach or shoot, health can fall | Wanted does not clear without valid escape/death handling; police damage must affect health visibly |
| M9 Health, death, respawn | P1 | Take damage to zero, choose respawn | Death state locks action; respawn restores control, health, walking mode, and clears active hostility/wanted pressure | Terminal death state cannot still accept movement, shooting, buying, or task completion |
| M10 Living city feedback | P1 | Idle world update, move near NPC/vendor/car/pickup, collide/shoot | NPCs/cars/pickups/projectiles/explosions/minimap marks visibly exist and respond to proximity or actions | World elements cannot be only static background if they are part of tasks, risk, resources, or navigation |
| M11 Extended narrative chain | P2 | Complete more tasks or talk to NPCs | More dialogue stages and story feedback | Missing extended story must not break P1 mission play |
| M12 Special appearance events | P2 | Buy or trigger special item/story beat | Character appearance or special outcome changes visibly | Optional; absence cannot block P1 city loop |
| M13 Expanded combat effects | P2 | Use advanced weapons or explosive attacks | Larger effects, vehicle chain destruction, richer ammo/combat outcomes | Optional depth must preserve P1 ammo, damage, wanted, and death rules |
| M14 Deeper police behavior | P2 | Escalate or escape wanted state | Stronger chase staging, deployment, downgrade, despawn/re-engage | Optional depth must not clear wanted arbitrarily during P1 risk |
| M15 Persistence | P2 | Leave/reload or continue long-term | Saved tasks, cash, weapons, unlocks, or discoveries return | Optional; transient restart still needs P1 respawn and session progress |
| M16 Landmark polish | P2 | Follow important destination guidance | Distinct location marker/building/audio improves orientation | Optional landmark polish cannot replace generic P1 target guidance |

## 6. State Model

| State | Primary affordances | Blocked or reduced affordances | Exit condition |
|---|---|---|---|
| Loading/entry | Visual loading or entry feedback | Main scene movement, shooting, driving, shop, mission advancement | Loading clears and city becomes playable |
| Walking | Move, aim, shoot, threaten, pick up, talk, shop, enter vehicle | Driving controls | Enter vehicle, open panel, die, or remain exploring |
| Driving | Accelerate, brake/reverse, steer, collide, deliver vehicle, exit | Walking-only shooting/weapon switching and normal character interactions | Exit vehicle, deliver vehicle, vehicle destroyed, or die |
| Dialogue/task panel | Read/advance dialogue and accept/continue task | Movement, shooting, driving, shop | Dialogue closes and objective/free-roam resumes |
| Shop | Buy valid items or close | Movement, shooting, driving, mission actions unrelated to shop | Purchase completes, purchase fails, or shop closes |
| Death/result | View death and choose respawn | All main city actions and task advancement | Respawn restores walking play |

## 7. Interaction And Control Feel

### Walking

Walking input is continuous. Holding a direction moves the player and turns the body toward that direction; release removes the movement vector. Obstacles are physical rules: walls, water, hard boundaries, cars, and buildings stop or redirect movement. A one-axis obstruction should allow sliding along the free axis so the player can recover naturally.

External force has priority over normal input. Vehicle hits, explosions, or strong impacts can launch, slide, or bounce the player; normal control returns only after the force resolves unless death occurs first.

### Aiming And Weapons

Fire is a held action with readiness and cadence. The player should see the weapon posture rise before effective firing. Aim drag changes facing and projectile direction independently of walking movement. Firing consumes ammo, creates visible shot feedback, pushes the shooter backward slightly, and affects valid targets. Threat/hold-up posture is visually distinct from firing and does not consume ammo.

### Driving

Driving uses vehicle inertia instead of direct walking movement. Forward input builds speed; release coasts down; reverse input first brakes and then backs up; steering depends on vehicle motion and decays after release. Joystick driving points the vehicle toward a desired travel direction, with sharper turns trading off speed. Reverse steering should feel like backing a vehicle rather than mirroring walking input.

Vehicle collisions are gameplay, not decoration. They should cause stopping, bounce, push, instability, damage, wanted pressure, or destruction depending on what is hit.

## 8. UI, HUD, And Feedback

- The HUD must make health, cash, current weapon/ammo, wanted pressure, and current task visible during normal play.
- The minimap must support orientation by marking the player or current vehicle plus relevant world entities such as cars, NPCs, vendors, pickups, task targets, and important locations.
- Objective guidance must be visible through a panel, marker, arrow, distance indicator, map mark, or equivalent combination.
- Positive feedback includes money gain, pickup collection, successful purchase, completed objective, weapon acquisition, and health recovery.
- Negative feedback includes damage, death, purchase refusal, blocked input, wanted escalation, collision, ammo depletion, and invalid task condition.
- Shop, dialogue, loading, and death overlays may cover play temporarily but must clearly return control when closed or resolved.

## 9. Progression, Rewards, And Failure

The smallest complete win unit is task completion. A task completion should include target satisfaction, reward delivery, HUD/resource update, visible completion feedback, and either next-objective activation or free-roam restoration.

Rewards are practical: cash, weapons, ammo, healing, task items, or access to the next step. They must connect back into the next loop by improving combat, survival, purchase ability, or objective completion.

Failure has three levels:

- **Rule rejection:** invalid purchase, wrong mode, missing weapon/ammo/item, or unmet task condition. State stays consistent and gives feedback.
- **Local danger:** collision, police fire, explosion, or hostile target response. Health, wanted, vehicle state, or world entities change.
- **Death:** health reaches zero, main actions lock, and respawn is required to continue.

## 10. Cut Scope Guardrails

P1 does not require multiplayer, online accounts, leaderboards, full indoor exploration, every building as an interior, exact real-world city simulation, complete traffic law behavior, or long-term memory for every NPC. It also does not require fixed artwork, exact UI wording, fixed colors, fixed layout, or brand-licensed story details.

P1 does require that the playable city sandbox loop exists end to end: enter the city, move, orient, interact, drive, fight or threaten, earn/spend resources, complete at least the defined task categories, face police/damage risk, die, respawn, and continue.
