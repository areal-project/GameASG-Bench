# Turbo Smash Beast Gameplay Requirements

## Goals and Experience

Turbo Smash Beast is a 3D vehicular crash-and-destruction game. The player builds up speed in a vehicle from the start of a city road, travels along a road with risks from vehicles and explosives, launches off a ramp toward a huge block monster, and reduces the monster's health through impacts, penetration, and continuous crushing. Each dash should form a clear loop: prepare the vehicle and level, hold to accelerate and adjust the line laterally, launch off the ramp, hit the monster or miss and land, then enter victory, continue/retry, or the next level according to the amount of destruction.

The core feeling is “heavy destruction after a charged dash.” The visuals must let the player see the drivable vehicle, road, ramp, giant monster, speed feedback, monster health feedback, impact debris, shake/impact feedback, and result feedback, rather than explaining the outcome only with numbers.

## Core Input Semantics and Control Feel

The primary input supports mouse and touch. After the player presses or touches within the playable area, if the vehicle is idle, it enters an accelerating dash; while the input is held, speed continues to rise, the wheels turn, the speed display intensifies, the road advances forward, and the vehicle gradually approaches the ramp. After release, the sense of engine acceleration stops, but the vehicle should not stop instantly; it should continue forward under inertia and gradually slow down. If its speed is insufficient, the vehicle may be unable to produce an effective impact.

Lateral control uses the “press point” as its reference. After pressing and holding, the player drags left or right, causing the vehicle to turn and move laterally; dragging to one side should make the vehicle continue edging toward the opposite side, with visible feedback such as the nose turning, the body leaning, or the front wheels steering, while dragging in the opposite direction produces the opposite offset. A very small drag distance should not cause obvious lateral movement, preventing slight accidental touches from changing the route. During the road phase, the vehicle is constrained by boundaries and cannot leave the road indefinitely.

After entering the ramp, the vehicle pitches up, surges upward, and transitions to the airborne state. Its post-launch speed, height, and forward distance are determined by its speed before leaving the ramp; the more speed it has, the more powerful the jump and impact. While airborne, the player may still hold and drag laterally for limited midair correction, but cannot accelerate again. The vehicle falls under gravity, and the run ends if it fails to hit the monster, flies past the target, or lands on the platform/water.

When the vehicle hits the monster, speed and hit location jointly determine the destruction effect. Frontal, bottom, or side collisions should all break blocks at the contact point and send debris flying; as the vehicle continues pushing into the monster, it should keep crushing blocks along its path and be slowed by destruction resistance. After impact, the camera, sound effects, debris, health bar, and speed display should jointly communicate the force of the collision, rather than only changing a result value.

The connection between road risks and failure must be visible. When hit by the vehicle, explosives should explode, produce flashes/debris/shake, reduce vehicle durability, and lower speed; vehicles crossing the road should move along it, turn around, or be knocked aside, and collisions should damage, slow, or laterally push the player's vehicle. When vehicle durability is depleted, it should burn or appear clearly damaged, and the run can no longer complete an effective ramp launch.

## Main Gameplay Loop

At the start of a run, the vehicle appears at the road's starting point, the camera follows it, the monster stands on a distant platform, and the current level information is displayed. After the vehicle settles or preparation is complete, the player sees a hold-to-accelerate prompt and may open available menus or begin the dash directly.

After the player holds to start the dash, top/side menus and nonessential buttons should hide or not obstruct operation. The speed display gradually intensifies as the input remains held, and the vehicle moves along the road; the player uses lateral dragging to avoid explosives and crossing vehicles while choosing the body region of the monster to hit. Upon reaching the top of the ramp, the vehicle automatically leaves the ground and flies toward the monster at its current speed and direction.

After the monster is hit, the giant beast consists of many destructible blocks, blocks near the collision point scatter, and the monster health bar decreases. If the vehicle is still advancing inside the monster, it should continue destroying blocks and slowing down; if critical supports are destroyed, the monster may undergo additional collapse-style destruction. Victory occurs when monster health reaches zero; if the monster remains undestroyed after the dash ends, the game enters a failure/continue state, preserving the destruction already inflicted or retrying the run according to the current level's rules.

After victory, show result feedback that the monster has been destroyed and unlock the next level. If victory unlocks a new vehicle, show new-vehicle reward feedback. The player can enter the next level, retry the current level, or open level selection. After failure, provide a continue/retry entry point, reset the vehicle and road risks, and let the player attempt to destroy the current monster again.

## Levels, Progression, and Difficulty

The game contains at least one set of progressively advancing levels, each featuring a large block monster with a different theme. Initially, only the first level is available; destroying the current monster unlocks the next level. The level-selection interface must distinguish unlocked levels from locked levels, and locked levels cannot be entered directly.

Difficulty increases as the levels advance: the number of crossing vehicles and explosives on the road and the number of special monster threats gradually increase; monster forms and attackable body structures should vary. The first few levels may place more emphasis on learning acceleration, steering, and hitting legs/support points, while later levels should add more road avoidance and pressure from monster counterattacks.

Player progress should be saved: unlocked levels, the currently selected vehicle, and audio preferences can still be restored upon reentry. Normal play may default to continuing from the highest unlocked level, while still allowing the player to return to unlocked levels through level selection.

## Vehicle System

The player can unlock and select multiple vehicles. Each vehicle must have a clearly distinct appearance and demonstrate differences in at least durability, size, speed feel, or impact performance. Heavy vehicles should withstand collisions better and feel more imposing; light or low-profile vehicles should be more agile but more fragile; long-bodied vehicles should provide greater impact coverage and greater steering pressure.

Vehicle selection can only be used in the ready state and should not interrupt the core gameplay during sprint, flight, impact, or result animations. Unlocked vehicles can be selected and immediately reflected by the scene vehicle; locked vehicles may be previewed or hinted at, but cannot be saved as the official selection. Closing the selection panel should restore a valid selection and reenable driving input.

## Monsters and Special Threats

Each monster should be presented as a huge destructible block target, with a health bar and observable body parts. The player does not need to precisely select body-part buttons, but instead causes different destruction through the vehicle's route, speed, and impact location. Hitting the legs, arms, head, or torso should create spatially corresponding gaps in the blocks, allowing the player to judge where to hit on the next run.

Some levels may add special monster threats as P1 or P2 depth, provided that they are visible in the scene and connected to driving risk: for example, ranged energy waves, projectiles, falling objects, or sweeping warning zones. These threats should first provide visible warnings or launch trajectories, then reduce durability, lower speed, cause shaking, or alter the route when they hit the vehicle. The player must be able to reduce the risk through speed, timing, or lateral route choice.

If electric-shock/lightning threats are not yet stable or enabled, they should be listed within the P2 cut scope; they cannot be made a requirement for the core win/loss condition.

## Menus, States, and Modes

After the game launches, it first displays a start screen and loading progress, and only allows entry into the game after loading is complete. After starting, it enters the normal gameplay flow, hides the start screen, and loads the current level. Normal gameplay states include: loading/intro, ready, sprint, flight, impact, victory, failure/waiting, and restart.

The ready state allows opening level selection, vehicle selection, and settings. Level selection allows returning and choosing an unlocked level, and after selection should transition into the corresponding level. Settings allow music and sound effects to be toggled, and closing them returns to the ready state. While any of these panels is open, it must prevent driving operations covered by the panel, and driving input must be restored after it closes.

During sprint, flight, impact, and result animations, the player should not be allowed to open settings or selection panels that would block the run. The result state must provide a clear next step: next level, retry, or level selection after victory; continue/retry after failure. Restarting should clear vehicle speed, durability damage, temporary road effects, explosion residue, crossing-vehicle state, flight/impact state, and residual prompts.

## Visible Feedback Requirements

The main scene must be a readable 3D scene: the road, city surroundings, ramp, water or platform, player vehicle, target monster, obstacles, and the camera-follow relationship should all be recognizable at a glance. The camera should follow the vehicle through acceleration, ramp ascent, flight, and impact, and may zoom in or out on impact to show the destruction, but it cannot lose the spatial relationship between the vehicle and monster.

Speed feedback must continuously reflect the vehicle's current movement trend during sprint, on the ramp, in flight, and after impact. At high speed, the speed bar may intensify, numbers may rise, tire marks, speed trails, body shake, or stronger sound effects may appear; after release or a collision, speed feedback should decrease.

Monster health feedback must be synchronized with block destruction. Health reduction should be reflected through the health bar's length/color/position or equivalently clear visible feedback; monster death should trigger clear victory feedback. Vehicle damage should also have vehicle health or damage feedback, including at least one of flashes, flames, a durability bar, shaking, or visible breakage.

Tutorial prompts should serve actual operation: in the ready state, prompt the player to hold to accelerate; early in the first level, the game may prompt the player to drag left or right to steer. If the player repeatedly misses critical supports, the camera/reticle may briefly indicate a recommended attack area. Prompts cannot obstruct the driving area for long periods.

## Failure, Rejection, and Invariants

Locked levels cannot be entered; clicking or touching a locked level can only remain in level selection and should not change the current level. Locked vehicles cannot be formally selected or saved; if preview is allowed, closing the panel must restore the original valid vehicle.

Input that opens vehicle selection, level selection, or settings outside the ready state should be rejected or ignored, cannot make the vehicle suddenly lose control, and cannot leave an obstructing panel over an active sprint scene. While a panel is open, holding or dragging in the driving area should not start the vehicle.

Vehicle lateral movement must be constrained by the road boundaries. Explosives and crossing vehicles can only cause damage after a valid collision and cannot reduce health without cause. Driving input after victory cannot continue farming destruction or repeatedly unlocking rewards; after failure/waiting, the player must use continue or retry to enter a new run.

If audio or save data is unavailable, the game should remain playable; failure of the music/sound toggles must not prevent driving, level progression, or retrying.

## P2 and Cut Scope

Optional P2 enhancements include: more special monster attacks, richer body-part weaknesses, more vehicle differences, post-impact slow motion, preservation of localized monster destruction across multiple runs, flames on buildings/roadside decorations, additional tutorial shots, layered sound effects, persistent high scores, or best-destruction records.

Nonstandard player tools such as free-camera viewing, collision-volume display, and parameter adjustment are cut and will not be implemented. Electric-shock/lightning attacks that are not yet enabled may be future P2 content and are not a P1 core requirement. A specified set of visual assets, fixed dialogue, or invisible computational details are outside the requirement scope; only consistency in player-visible behavior and the gameplay loop is required.

---

## GDD / Design Doc (merged from design-doc.md)

# Turbo Smash Beast Design Doc

## 1. Design Intent

Turbo Smash Beast is a crash game centered on building speed with a 3D vehicle, jumping, and destroying a block monster. In each run, the player drives a vehicle from the start of the road, holds to accelerate, drags to correct the lateral route, avoids road risks, launches off a ramp, and flies toward the giant monster in the distance. A successful impact spatially breaks blocks in the monster's body, reduces health, and advances level progress; failure or excessive damage leads to continue/retry and another attempt against the same target.

The design focus is not a static vehicle or numerical result, but the causal chain of “the more fully speed is built, the more accurate the route, the more forceful the impact, and the more visible the destruction.” The main scene must continuously present the vehicle, road, ramp, monster, obstacles, speed feedback, vehicle damage feedback, monster health feedback, exploding debris, and result entry points.

## 2. MDA

### Mechanics

- Press and hold the mouse or touch the playable area to start and maintain acceleration; releasing stops active acceleration, but the vehicle continues forward under inertia and gradually slows down.
- Lateral dragging uses the press point as its reference: dragging right makes the vehicle edge left, and dragging left makes the vehicle edge right; a small drag remains within the dead zone and should not cause obvious lateral movement.
- During the road phase, the vehicle is constrained by boundaries, and speed, lateral route, road explosives, and crossing vehicles jointly determine whether it can successfully reach the ramp.
- The ramp transitions the vehicle into flight; flight speed, height, and distance are determined by speed before leaving the ramp, and only limited lateral correction is allowed in the air, with no new acceleration.
- When the vehicle hits the monster, hit location and speed determine the destruction range; as the vehicle continues pushing into the monster, it continuously crushes blocks and is slowed by resistance.
- Monster health decreases in sync with block destruction; reaching zero health enters victory and unlocks subsequent levels and possible new vehicles.
- Vehicle durability is reduced by explosives, crossing vehicles, and visible monster threats; depleted durability makes the run lose its ability to perform an effective ramp launch and enters failure/continue.
- The ready state allows access to level selection, vehicle selection, and settings; during sprint, flight, impact, and result animations, these panels cannot block the run.
- Saved progress includes unlocked levels, the current valid vehicle, and audio preferences; normal entry into the game may continue from the highest unlocked level.

### Dynamics

- In the ready state, the player assesses the current vehicle, level, monster, and road risks, then holds to accelerate into a high-pressure dash.
- Continuing to hold gradually intensifies speed feedback; releasing, colliding, or encountering resistance inside the monster reduces speed feedback.
- The player must trade off acceleration gains against route risks: continuing to build speed can improve the jump and destruction, but also makes collisions with road obstacles or monster threats more likely.
- Lateral dragging is used both to avoid risks and to choose the body region to hit; the drag direction is opposite the direction in which the vehicle edges, creating a clear, learnable control feel.
- After multiple failures, the player uses gaps in the monster, its health bar, and prompts to judge whether the next run should hit the legs, support points, torso, or other remaining areas.
- Vehicle differences affect route tolerance, collision resistance, and impact coverage, making unlock rewards more than visual changes.

### Aesthetics

- Sense of speed: after holding, the speed bar, numbers, tire marks, trails, body shake, or sound-effect intensity increases.
- Sense of weight: the vehicle's ramp ascent, flight, landing, entry into blocks, and deceleration under resistance should all have visible posture and camera feedback.
- Sense of explosive destruction: debris scatters at the impact point, the camera shakes, a gap appears in the monster, and health decreases.
- Sense of risk: explosives, crossing vehicles, and monster threats have physical presence, warnings, movement, or collision feedback rather than merely subtracting values.
- Sense of progress: victory, the next level, new vehicles, and unlocked states in level selection are clearly visible.

## 3. P1 Core Loop Executable Trajectory

### P1 Main Loop: Build Speed on the Ramp, Hit the Monster, Resolve Progress

1. Start/reset: after entering an unlocked level, the vehicle lands at the road's starting point, the camera follows the vehicle, and the ramp and block monster are visible in the distance; the HUD displays level and speed/health-related feedback, and the ready state allows selection of unlocked vehicles or opening settings.
2. Player input: the player holds the mouse or touches within the playable area to begin the dash; while held, the vehicle continues accelerating. Using the press point as a reference, the player drags left or right; dragging right makes the vehicle edge left, dragging left makes the vehicle edge right, and small drags maintain a stable route.
3. Continuous state changes: speed rises with hold duration, the road rapidly recedes, and wheel rotation, body yaw, front-wheel steering, trails, or the speed HUD intensifies; after release, the sense of engine acceleration stops, and the vehicle continues forward under inertia while slowing due to resistance. The vehicle's lateral position is clamped to the road boundaries.
4. Goal/risk: before launching off the ramp, the player must maintain as much speed as possible and use lateral correction to avoid explosives and crossing vehicles while choosing a more valuable area of the monster to hit. Hitting an explosive causes an explosion, damages the vehicle, and lowers speed; hitting a crossing vehicle applies forces to both vehicles, damages the player's vehicle, lowers speed, or causes lateral displacement.
5. Reward/failure: after reaching the top of the ramp, the vehicle automatically flies out, with its flight trajectory determined by ramp speed; only slight lateral adjustment is possible in the air. If it hits the monster, blocks near the contact point scatter, the health bar decreases, and the vehicle continues crushing blocks along its path while slowing down; if speed is insufficient, the vehicle misses, flies past the target, lands, or runs out of durability, the run enters failure/continue.
6. Progress/restart: when monster health reaches zero, victory feedback appears and the next level and possible new vehicles are unlocked; the player can enter the next level, retry, or select a level. When the monster is not destroyed, a continue/retry entry point appears; vehicle speed, durability damage, temporary road risks, flight/impact state, and residual prompts are reset before returning to the ready or intro flow.

### P1 Continuous Control-Feel Chain

Holding input produces acceleration and speed feedback; releasing produces inertial coasting and gradual deceleration; left/right dragging produces lateral edging in the opposite direction, nose turning, and body-posture feedback; the ramp converts ground speed into flight height and distance; collision converts speed into block destruction, debris, camera shake, and health reduction; road collisions and monster threats convert risk into durability loss, speed decay, and the possibility of failure.

## 4. M-Features

| ID | Priority | Feature | Player Trigger | Observable Result | Failure/Rejection/Invariants |
|---|---|---|---|---|---|
| M1 | P1 | Start, loading, ready flow | Start from launch screen, enter highest unlocked or selected unlocked level | Loading progress completes, start control becomes available, play scene appears with vehicle, road, ramp and monster | Cannot begin playing before load is ready; blocking overlays must not remain over active playfield |
| M2 | P1 | Hold-to-accelerate driving | Press and hold in play area during ready/road phase | Vehicle enters sprint, speed feedback rises, wheels/road/camera imply forward motion | Releasing stops active acceleration but does not instantly freeze; panel-open input must not start the car |
| M3 | P1 | Inverted drag steering and road bounds | Hold then drag left/right from press point | Drag right moves vehicle left; drag left moves vehicle right; vehicle yaws/leans/turns visibly | Tiny drag stays near straight path; vehicle cannot leave road indefinitely |
| M4 | P1 | Road hazards | Drive through levels with explosive and crossing-vehicle risks | Explosions, moving cars, collision response, vehicle damage/health feedback, speed loss or knockback | Hazards only damage on valid collision; damage cannot occur invisibly or while unrelated |
| M5 | P1 | Ramp and flight | Reach ramp with sufficient speed | Vehicle noses up, leaves road, follows gravity, speed/hud/camera reflect flight | Air control is limited to lateral correction; no new acceleration in air |
| M6 | P1 | Monster voxel destruction | Hit monster with vehicle | Spatially corresponding body blocks break, debris flies, monster health decreases, impact feedback plays | A numeric health drop without visible breakage is insufficient; missed/weak runs do not award victory |
| M7 | P1 | Run result and restart | End after win, miss, landing, pass-over or destroyed vehicle | Victory shows next-step choices; failure shows continue/retry; restart clears transient run state | Victory locks repeat farming; retry must clear old hazards, damage effects and motion |
| M8 | P1 | Level progression | Destroy current monster | Next level unlocks, level selection distinguishes locked/unlocked, normal entry can continue from highest unlocked | Locked levels cannot be entered or silently selected |
| M9 | P1 | Vehicle selection and unlocks | Open vehicle panel in ready state, choose unlocked or locked vehicle | Unlocked selection updates current vehicle and scene; locked vehicle may preview but cannot persist | Vehicle panel is blocked outside ready state; closing locked preview restores valid selection |
| M10 | P1 | Settings and audio preference | Open settings in ready state, toggle music/sound | Panel blocks play input while open; toggles persist when available and do not break gameplay | Settings cannot interrupt sprint/flight/impact; storage/audio failure must not block play |
| M11 | P2 | Monster special threats | Reach levels with visible monster attacks | Energy waves, thrown/falling/sweeping hazards or similar threats show warning/trajectory and damage/speed effects when hit | Threats must be avoidable by route/timing and tied to visible collision; electric/lighting-style threat may remain cut scope |
| M12 | P2 | Destruction depth and guidance | Repeatedly fail or target weak support areas | Body-part gaps, collapse, reticle/camera hint or slow impact presentation helps plan next run | Hints cannot permanently cover driving; optional depth cannot be required for basic win loop |
| M13 | P2 | Expanded polish/progression | Continue through later levels and unlocks | More varied monsters, vehicles, threat combinations, audio layers, records or spectacle effects | Cosmetic variety must not replace P1 mechanics |

## 5. Source Core Loop Coverage

| Loop | Priority | Start/Reset | Player Input | State Change | Goal/Risk | Reward/Failure | Progression/Restart |
|---|---|---|---|---|---|---|---|
| Core sprint-crash loop | P1 | Vehicle and current monster reset into ready state | Hold to accelerate; drag left/right to steer | Speed rises, vehicle advances, route changes opposite drag direction, HUD/camera/vehicle visuals update | Build enough speed while avoiding hazards and choosing a hit line | Hit monster to break blocks and reduce health; miss, low speed, landing, overflight or vehicle destruction ends run | Win unlocks next level/vehicle; failure offers continue/retry and resets transient run state |
| Hazard survival loop | P1 | Road hazards respawn for the round | Maintain or change route while accelerating | Explosives and crossing cars remain visible/moving; collisions alter vehicle health, speed or lateral motion | Avoid damage that prevents effective launch | Clean route preserves speed; collision visibly damages and may fail the round | Retry clears hazard effects and restores vehicle health for the new attempt |
| Monster destruction loop | P1 | Existing or refreshed monster stands with visible health | Aim route and speed toward body area | Collision removes spatially matching blocks; continued contact plows more blocks and slows vehicle | Destroy enough body/support mass before run ends | Health reaches zero for victory; partial destruction leaves goal for next attempt where allowed | Victory advances; partial result leads to another run against current monster behavior |
| Progression loop | P1 | Start from saved/default progression | Pick unlocked level or finish current one | Locked/unlocked status and selected vehicle update visibly | Advance through harder monsters and road risk | New level/vehicle reward appears after victory | Persist progress and allow next level, retry or level select |
| Menu/preparation loop | P1 | Ready state after intro or restart | Open level, vehicle or settings panels | Panel appears and blocks driving input; valid choices update play setup | Prepare without accidentally starting or interrupting a run | Valid selection persists; invalid locked choice rejected or preview-only | Closing panel returns to ready play |
| Special-threat loop | P2 | Later themed monster encounter | Continue sprinting while threat warns or fires | Threat displays warning/trajectory, then moves/strikes in world | Use route, timing or speed to avoid impact | Hit causes vehicle damage, slow, shake or route disruption | Threat state resets on retry; disabled electric threat stays optional |

## 6. Game State Flow

1. Loading/start: content and audio readiness progress toward a startable menu.
2. Ready: vehicle is controllable only after the intro settles; preparation panels are available.
3. Accelerating: active press increases speed, drag changes route, road hazards and special threats can interact.
4. Launching: ramp converts speed into flight; gravity and limited air steering apply.
5. Impact: vehicle collides with monster, destroys blocks, slows under resistance and may trigger collapse.
6. Waiting/failure: vehicle coasts or lands, result entry appears, and the next valid action is continue or retry.
7. Victory: monster destruction locks in reward, unlocks progression and offers next level, retry or level select.
8. Restart/transition: run-specific motion, damage, hazards, threat effects, overlays and hints clear before returning to the next playable state.

## 7. Mechanism Coverage Matrix

| System | P1 Coverage Requirement | P2/Depth Requirement | Cut Scope |
|---|---|---|---|
| 3D scene readability | Road, ramp, vehicle, monster, hazards, HUD and camera relationship must be readable | Richer city decoration, fires, slow-motion impact | Fixed visual content set, exact camera math or exact visual styling |
| Driving input | Hold acceleration, release deceleration, inverted drag steering, boundaries | Better suspension, tire marks, richer feedback | Keyboard/free camera tools as normal play requirements |
| Physics flight | Speed-dependent launch, gravity, landing/pass-over failure | More nuanced roll/pitch and landing presentation | Exact formulas or numeric constants |
| Monster damage | Spatial block destruction, debris, health sync, victory on death | Body-part weak points, collapse, repeated partial-damage strategy | Hidden body-part buttons or invisible health-only combat |
| Road hazards | Explosive and moving vehicle risks with damage/speed coupling | More obstacle patterns and faster moving hazards | Damage without visible collision |
| Vehicle system | Multiple unlockable vehicles with appearance and durability/size/handling differences | More stat variety and reward presentation | Selecting locked vehicles as valid play state |
| Progression | Locked/unlocked levels, next-level unlock, saved progress | Records, best destruction, more reward layers | Required online services or failure if storage unavailable |
| Menus/settings | Start, ready prep panels, result choices, blocking behavior | More polished transitions and hints | Opening blocking panels during active sprint/flight/impact |
| Special threats | Not required for first playable core if marked P2, but visible threats must affect driving risk when included | Energy waves, projectiles, falling blocks, sweeping attacks, richer warnings | Temporarily disabled electric/lighting threat as P1 requirement |

## 8. Failure And Rejection Rules

- Locked levels are visible but not enterable; selecting them must not alter the current playable level.
- Locked vehicles may be previewed only if the active valid selection is restored when the panel closes.
- Preparation panels block driving input while open; active sprint, flight, impact and result animation reject new preparation panels.
- Victory ends reward eligibility for that run; further driving input cannot repeatedly reduce health or unlock rewards.
- Failure/continue does not leave old speed, damage fire, debris, hazards, special threats, overlays or vehicle motion in the next attempt.
- Audio or save failures degrade gracefully; they never block start, driving, retry or progression logic.

## 9. Design Review Notes

- This design doc preserves the already confirmed mechanics and scope.
- No additional hidden gameplay is introduced.
- The P1 motion/physics causality chain is retained: hold-to-accelerate, release-to-coast/decelerate, inverted drag steering, road bounds, speed-dependent launch, gravity, impact resistance, visible destruction and result progression.
- The optional electric/lighting-style threat remains outside P1, matching the declared P2/cut scope.
