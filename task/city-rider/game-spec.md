# City Rider Game Spec

## Requirements Overview

“City Rider” is a portrait-oriented 3D urban motorcycle driving game. The player sets out from the start of a city road and continuously drives forward, changing lanes and avoiding traffic and road boundaries under countdown pressure, gaining time and points by passing checkpoints, then settling earnings after completing a sector and continuing to challenge higher sectors. The game must retain a complete player flow including a visible 3D scene, a sense of speed, HUD progress, menus/shop/statistics, restarting, and continuing.

## Gameplay Requirements

### P0 Basic Experience

- After the game launches, it should first present a visible 3D main scene or launch overlay. The user enters a drivable state after starting via click, touch, or keyboard.
- The main view must contain a non-empty 3D/WebGL driving scene: the road extends into the distance; the player motorcycle is perceptible near the bottom of the screen or from a first-person perspective; and traffic, checkpoint gates, the city background, and road boundaries should be visible to the player.
- The HUD should continuously display at least the following understandable information: remaining time, current sector or checkpoint progress, distance traveled/progress, speed or feedback conveying a sense of speed, and a pause/menu entry point.
- The game must support blocking driving input when paused or when a menu is open, and restoring driving after it is closed; a blocking layer from the menu must not remain over the main scene while the game is playable.
- On first entering the driving state, a brief lane tutorial, traffic warning, or direction hint may be provided. The hint must relate to the actual road situation and must not permanently block driving; it should disappear naturally after the player changes lanes or passes an early objective.

### P1 Core Driving Loop

- The player automatically drives forward, with speed gradually increasing from a low speed and being affected by vehicle performance. At higher speeds, the visuals should convey a stronger sense of motion through road movement, the camera, the speed display, particles/lines, or other means.
- The player's primary action is changing lanes. Directional semantics must be clear:
  - The keyboard Left Arrow or A key means that the player intends to “move toward the left side of the screen/left lane”; the keyboard Right Arrow or D key means “move toward the right side of the screen/right lane.”
  - Touching/clicking the left half of the screen should make the motorcycle move toward a lane on the left side of the screen, and touching the right half should make it move toward a lane on the right side of the screen.
  - Drag/swipe input should also be based on the visible screen direction: dragging left should make the motorcycle move toward a lane on the left side of the screen, and dragging right should make it move toward a lane on the right side of the screen.
  - Regardless of how internal coordinates or the camera are configured, the motorcycle, lane indicator, or camera-follow result seen by the player must agree with the screen directions above; reversed mapping is a core error.
- A lane change must be visible motion, rather than merely changing a number instantly. The motorcycle or camera target should move laterally to an adjacent legal lane over a short period and must not go beyond the currently usable lane range of the road.
- The road includes dynamic lane counts or narrowing sections. If the player's lane is about to be blocked by a boundary, the player must be able to avoid it by changing lanes; an illegal out-of-bounds lane change should be rejected or clamped, while unrelated state such as score, balance, and checkpoint progress remains unchanged.
- Traffic entities include same-direction vehicles, oncoming vehicles, larger vehicles, and other obstacles. They should move along the road, maintain spacing, or perform simple avoidance so that the road is not a static set piece.
- The road may include crosswalks, pedestrians, or other urban activity. Vehicles may slow down, stop, or change lanes when encountering a crosswalk or obstruction; when the player hits a pedestrian, vehicle, or road edge, there should be visible feedback and a statistical impact rather than silent pass-through.
- When the player collides with a same-direction vehicle or an edge, non-terminal feedback may include slowing down, being pushed back, a screen flash, vibration, or an increased impact count; a head-on danger or countdown expiration should enter a failure or penalty flow.
- High-risk collisions such as with oncoming vehicles may trigger a brief slow-motion/emergency-dodge opportunity: the visuals enter an obvious danger/reaction state and the player must click/touch/press a key repeatedly to complete the dodge; success returns to driving, while failure or exhaustion of the opportunity enters the crash/failure flow. This system is P2 depth, but if implemented it must be consistent with the main state machine.
- Approaching a vehicle and successfully passing it at close range should produce a near-miss reward or notification and increase score/earnings-related statistics; it should not only display a notification without any progress or statistical change.
- When the player passes a checkpoint, they should receive a time reward and a score/progress reward, the checkpoint count increases, HUD progress updates, and the next checkpoint objective is generated.
- A sector requires completing a specified number of checkpoints. Upon completion, a sector results panel appears and shows visible results including distance, remaining time, highest gear/high-speed ratio, near misses, collisions/mistakes, earnings, and the new balance. The player can continue to the next sector or enter the shop.
- When the countdown reaches zero, the game enters failure results, showing the failure reason, driving statistics, earnings/penalties, and a retry entry point. Retry should clear traffic, temporary effects, speed, the countdown, and the current run's score, while retaining long-term progress such as earned long-term balance, owned vehicles, and reached sectors.
- Failure results may offer a paid continue. Continuing must clearly display the cost or availability; when the balance is sufficient and the number of continues allows it, deduct the long-term balance and resume driving while retaining the current sector/checkpoint progress. When the balance is insufficient or continuing is unavailable, it should be rejected, with balance and progress not changed incorrectly.

### P1 Feedback and State

- When the HUD countdown is close to ending, there should be obvious urgent feedback, such as one or more of a color change, flashing, sound, or vibration.
- Passing a checkpoint should have clear visual or audio feedback, and the countdown should increase or sector results should be triggered.
- A collision or sideswipe should have visible feedback, such as a screen flash, camera shake, vehicle/player position changes, collision count, speed reduction, or a results penalty.
- Pause, menu, shop, statistics, leaderboard, sector results, and failure results are all blocking panels; while a panel is open, main driving input must not continue to change vehicle position or scoring, and driving can resume only after the panel is closed.
- View switching should support third-person and first-person views or equivalent driving-view switching. After switching, directional input must still remain consistent with screen direction.

### P2 Progression, Economy, and Depth Systems

- The player has a long-term balance. The balance comes from earnings in sector completion or failure results based on distance, remaining time, high-speed performance, near misses, sector rewards, and so on; collisions, failure, or continuing may cause deductions. The balance must not become negative without reason.
- The shop offers multiple motorcycles that can be purchased/equipped. Different motorcycles should provide a higher top speed, acceleration, earnings multiplier, or special ability. Purchased vehicles can be equipped; attempting to purchase an unowned vehicle with insufficient balance should be rejected with error feedback, while the balance, owned list, and equipped state remain unchanged.
- Higher-tier motorcycles may have special abilities:
  - Storm/impact-type abilities: visibly push away/launch vehicles or pedestrians within a cone-shaped area ahead.
  - Turbo/jump-type abilities: briefly jump or accelerate, with visible height/speed changes and a landing grace period.
  - Beam/attack-type abilities: produce a visible ray and destruction/launch effect against a target ahead in the same lane.
- Special abilities can be used only while the game is in progress, not paused, not on cooldown, and with the corresponding vehicle equipped. Using one starts its cooldown; triggering it again during cooldown should be rejected and must not produce the effect repeatedly.
- The statistics panel should display long-term information such as cumulative distance, driving time, highest sector, top speed, high-speed ratio, total impacts/crashes, cumulative earnings/spending, and balance.
- Collectible rewards may appear on city roads. A collectible should be visible in the main scene; after pickup it should provide feedback and change the balance, shield, statistics, or other public progress. A collectible that was not picked up, or the same collectible picked up repeatedly, should not grant repeated rewards from nothing.
- A leaderboard or score submission may be implemented as a P2 online/persistence capability; an offline implementation may show a local best score or placeholder list, but it should not disrupt the main game flow.
- Settings such as volume, sound effects, visual blood/collision presentation, ability cooldowns, speed lines, camera shake, clouds/weather, and debug starting balance are P2; if implemented, they should be adjustable in the menu and reflected in visible feedback.
- Local saves should preserve the long-term balance, owned and equipped vehicles, highest sector, cumulative statistics, and preferences. Restarting should not clear long-term progress, except on an explicit reset or new save.

## State Requirements

- `loading/menu`: Loading or launch overlay. Displays a prompt to start; the main scene may be prepared, but driving does not advance.
- `playing`: Driving in progress. The countdown, distance, speed, traffic, checkpoints, collisions, near misses, and ability cooldown update normally.
- `paused/menu/shop/stats/leaderboard`: Blocking-panel states. Settings can be adjusted, statistics viewed, and vehicles purchased/equipped; main driving is paused.
- `sector-cleared`: Sector-completion results. Settle earnings, update balance, and allow the shop to be opened or the next sector to be continued; after closing the panel, enter driving for the next sector.
- `danger/bullet-time`: Brief danger-dodge state. Repeated clicks/touches/key presses advance progress; success restores driving, while failure enters crash handling.
- `crashing`: Crash or fall presentation state. Shows an obvious collision/fall/camera change, then restores driving or enters failure results according to the rules.
- `game-over`: Countdown failure or terminal failure results. Displays statistics, earnings/penalties, and retry/continue entry points; retry begins a new run.

## Completion Criteria

- From the default entry point, the player can enter driving through a real click/touch/key press and see a readable 3D city road and moving traffic.
- Left/right directional input behaves consistently on screen, and inputs in opposite directions produce opposite visible lateral motion.
- The player can complete the loop of “start -> drive and change lanes -> avoidance/collision feedback -> pass a checkpoint -> gain time/progress -> sector or failure results -> retry/continue.”
- Menus, pause, shop, and results panels do not pass through into the playable state; driving input is ineffective while a blocking panel is open.
- If economy, shop, abilities, statistics, and saving are provided, they should follow the P2 rules and have clear rejection paths and stable rules.

---

## GDD / Design Doc (merged from design-doc.md)

# City Rider Design Doc

## MDA

### Mechanics

- Automatically advancing 3D motorcycle driving: speed, distance, timer, and road motion update continuously.
- Screen-space lane changes: keyboard, click, touch, and drag all express “move toward the left/right side of the screen” and produce visible lateral motion.
- Dynamic roads and traffic: multiple lanes, narrowing, same-direction/oncoming vehicles, larger obstacles, pedestrians, and road boundaries jointly create risk.
- Checkpoints and sectors: passing checkpoints grants time and points, and completing the specified checkpoints enters sector results.
- Collisions, near misses, and danger dodges: collisions bring penalties or failure, close passes grant rewards, and high-risk collisions can trigger a brief dodge window.
- Economy and shop: earn balance at results, purchase/equip stronger motorcycles, and reject purchases when balance is insufficient.
- Special abilities: under cooldown constraints, higher-tier motorcycles can trigger forward effects such as pushing away, jumping/accelerating, or beam destruction.
- Driving assistance and urban activity: early traffic hints, lane-change guidance, pedestrian crosswalks, collectible rewards, and vehicle avoidance make the city roads feel more alive.
- UI state machine: launch, driving, pause/menu, shop, statistics, leaderboard, sector results, failure results, retry/continue.

### Dynamics

- Under countdown pressure, the player weighs speed against risk: high speed is more rewarding and exciting, but makes it easier to hit traffic or miss the opportunity to change lanes.
- Road narrowing and moving traffic force the player to anticipate screen direction rather than merely react to the current position.
- Checkpoint rewards create a rhythm of “just a little farther”; sector results and the shop provide long-term growth goals.
- Collision feedback, near-miss rewards, and emergency-dodge windows make risk more than a single failure, creating tension, recovery, and reward choices.

### Aesthetics

- Fast, tense, and arcade-like.
- City depth and moving vehicles create a sense of space.
- The HUD and results emphasize progress, earnings, and the next challenge.
- The shop and higher-tier abilities provide progression and showmanship goals.

## Source Core Loop Coverage

### M-Feature Index

M1: Launch and enter driving.
M2: Non-empty 3D city driving scene.
M3: Screen-space left/right lane changes.
M4: Legal lane boundaries.
M5: Continuous driving and traffic risks.
M6: Checkpoint rewards.
M7: Collision/near-miss feedback.
M8: Timed failure and retry.
M9: Menu/pause/blocking layer.
M10: View switching.
M11: Shop purchase and equip.
M12: Special abilities and cooldowns.
M13: Statistics/leaderboard/persistent progress.
M14: Early tutorial/traffic hints.
M15: Paid continue.
M16: Pedestrians, crosswalks, and collectibles.

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Launch and enter driving | P0 | Click/touch the main view or press any key to start | The launch overlay is hidden, the main 3D scene is visible, and the HUD starts updating | Failure if only a static page is displayed, the overlay still blocks interaction, or there is no readable main scene |
| M2 Non-empty 3D city driving scene | P0 | The page loads and enters driving | The main canvas has non-empty rendering such as the road, motorcycle/view, traffic/checkpoints/city background, and screenshot pixels have sufficient variation | Failure if the canvas is blank/solid-color or only the HUD is present without a main scene |
| M3 Screen-space left/right lane changes | P1 | Left/Right Arrow, A/D, clicks on the left/right side of the screen, left/right drags | The motorcycle or camera target moves toward the corresponding side along the screen X direction; opposite inputs produce opposite screen displacement | Failure if directions are reversed, both directions produce the same result, or only an internal number changes without visible lateral movement |
| M4 Legal lane boundaries | P1 | Continue giving outward input in the leftmost/rightmost lane | The vehicle remains within usable lanes, and score/balance/checkpoints are not changed for unrelated reasons | Failure if it crosses the boundary, jumps to an illegal lane, or an illegal input adds points or deducts money |
| M5 Continuous driving and traffic risks | P1 | Enter driving and wait/change lanes to avoid hazards | Distance, speed, or forward scene motion updates, and traffic entities move and affect the safe route | Failure if the scene naturally remains still, traffic is a static set piece, or speed/distance does not advance |
| M6 Checkpoint rewards | P1 | Drive to a checkpoint, or continue forward after legally loading near a checkpoint | Checkpoint count/progress increases, remaining time increases or the sector completes, and the HUD/notification stays in sync | Failure if passing the objective gives no reward, the HUD does not change, or the same checkpoint can be repeatedly farmed for rewards |
| M7 Collision/near-miss feedback | P1 | Approach, pass close to, or hit a vehicle | A near miss increases score/statistics; a collision produces a screen flash/shake/slowdown/impact count or failure flow | Failure if obstacles can be passed through without feedback, or a collision only changes hidden state or has no penalty |
| M8 Timed failure and retry | P1 | The countdown expires, or continue after legally loading a low-time state | Enter failure results showing statistics and a retry entry point; retry clears temporary state and returns to driving/start | Failure if scoring can continue after a terminal result, or retry does not clear traffic/countdown/speed |
| M9 Menu/pause/blocking layer | P1 | Click menu/pause or press a menu key, then close it | Driving input freezes while the panel is open; interaction resumes after closing | Failure if a panel still blocks the playable state, or lane changes/scoring continue while the panel is open |
| M10 View switching | P2 | Click the view button or press the view key | Switch between first-person/third-person or equivalent views; the main scene remains readable and left/right semantics do not change | Failure if the screen goes black or directions are mirrored after switching |
| M11 Shop purchase and equip | P2 | Open the shop and purchase/equip a vehicle | With sufficient balance, the balance decreases, owned and equipped states update, and vehicle performance or the earnings multiplier changes | Failure if a purchase succeeds with insufficient balance, balance becomes negative, or equipping has no effect |
| M12 Special abilities and cooldowns | P2 | Use an ability after equipping a higher-tier bike | Visible effects on forward entities/player height/speed/beams change, and cooldown begins | Failure if usable while unequipped, takes effect repeatedly during cooldown, or only a button exists without an effect |
| M13 Statistics/leaderboard/persistent progress | P2 | Complete a sector, open statistics, or reload | Cumulative distance/time/highest sector/balance/owned vehicles are retained and can be displayed | Failure if restarting loses long-term progress, or statistics are inconsistent with results |
| M14 Early tutorial/traffic hints | P2 | First enter driving, encounter an early traffic obstruction, or follow traffic for a long time | A lane-change/traffic hint relevant to the current risk appears on screen; it disappears after changing lanes or leaving the risk | Failure if the hint blocks permanently, its direction conflicts with a safe movement direction, or it still blocks after the action is completed |
| M15 Paid continue | P2 | Choose continue in failure results | When eligible to continue, show the cost, deduct long-term balance, retain current sector progress, and return to driving | Failure if continuing succeeds with insufficient balance, balance is negative afterward, or continuing incorrectly clears the current sector |
| M16 Pedestrians, crosswalks, and collectibles | P2 | Approach a crosswalk/pedestrian/reward, then wait or drive through | Pedestrians and vehicles visibly interact on the road; after a collectible is collected, it gives feedback and changes balance, shield, or statistics | Failure if city entities are static set pieces, collisions/pickups have no feedback, or the same reward can be repeatedly farmed |

## GDD Feature Structure

### Main Scene and Camera

The main scene is a portrait-oriented city road with depth. The third-person view should show the motorcycle near the lower part of the road, while the first-person view should convey the lanes and traffic ahead. The camera may follow the player laterally and produce shake or FOV changes at high speed and during collisions, but it must not reverse left/right input on screen.

### Input Semantics

Core input centers on lane switching rather than free steering. All input is based on screen space: left intent produces leftward screen movement, and right intent produces rightward screen movement. Touches on the left/right half of the screen, mouse clicks on the left/right half, drag direction, and keyboard directions should be treated as equivalent player intent. An illegal out-of-bounds input produces only a rejection/no change and does not affect economy or progress.

### Risks and Rewards

Traffic, narrowing roads, and the timer jointly create risk. The player avoids obstacles by changing lanes; passing close to vehicles grants a small reward, while impacts or forced slowing reduce performance, and countdown expiration enters failure results. Checkpoints are positive objectives that provide time and progress. After completing a sector, earnings are settled before moving into the next sector.

### Economic Progression

The long-term balance lets the player purchase higher-performance vehicles. The shop is not merely a display: it must support purchase, equip, rejection for insufficient balance, and differences in performance or abilities after equipping. Special abilities are a depth mechanic for higher-tier vehicles and must have visible effects and cooldown constraints.

### Assistance, Continue, and City Details

Early hints should support learning to drive: when traffic blocks the way or the player needs to change lanes, provide a directionally clear hint and dismiss it after the player completes the lane change. Continuing after failure is part of risk management: the player spends long-term balance to retain current sector progress, whereas retry clears the temporary run state for a new attempt. Pedestrians, crosswalks, and collectibles add urban vitality and extra rewards, but must not break the main driving state machine.

## Scope Reduction and Priorities

- P0/P1 are the playable qualification threshold: 3D scene, launch, real input, directional semantics, traffic risks, checkpoints, timed failure, retry, and menu blocking.
- P2 covers depth and long-term retention: emergency slow motion, paid continue, early tutorial/traffic hints, pedestrian crosswalks, collectibles, all special abilities, a complete leaderboard, all settings, rich statistics, online submission, and complex weather/clouds. These may be simplified, but must not conflict with the implemented P0/P1 state machine.
