# City Racer X Neon Rush Game Spec

## Requirements Overview

This game is a portrait-oriented 3D motorcycle racing game. After entering the city track from the menu, the player's motorcycle automatically accelerates forward and races alongside 4 AI riders. The player's core objective is to complete a multi-lap race within the specified course, avoiding traffic moving in the same direction, oncoming vehicles, pedestrians, roadside narrowing, and dynamic traffic, while accumulating a balance through placement, distance, top-speed performance, near-miss dodges, and settlement rewards to purchase and equip higher-performance motorcycles.

## Gameplay Priorities

- P0: The page starts reliably, the main 3D scene is visible, the player can enter a playable state, and the HUD displays rank, lap count, time, or progress.
- P1: Race start, real directional input, lane changes, road progression, traffic hazards, collisions/dodges, rank/laps/progress, pause/menu/restart form a complete loop.
- P2: Purchasing and equipping vehicles in the shop, balance persistence, statistics and leaderboard, nitro button, advanced vehicle powers, first-/third-person view switching, bullet time/hazard warnings, and volume and visual settings.

## Core Experience

1. By default, the player sees a loading or start prompt and enters the race after clicking/touching/pressing any start key.
2. The main screen must be a legible 3D/WebGL city road scene showing the player's motorcycle, road depth, lanes, traffic vehicles, rival riders, checkpoint or finish prompts, and speed-related camera and motion feedback.
3. The motorcycle automatically accelerates forward. The player does not need to hold the throttle, but speed is affected by the current vehicle's performance, distance to the vehicle ahead, collisions, nitro capability, jumps, or special powers.
4. The player uses horizontal input to change lanes and avoid hazards. Directional semantics must be defined by the visible on-screen result: the left key/leftward control intent, the right key/rightward control intent, taps on the left and right halves of the screen, short touches, and horizontal swipes must all produce clear, observable lateral lane changes. If an inverted-control feel is used, it must be visible in the tutorial/HUD, and left/right inputs must produce verifiably opposite directions on the screen; the inputs on both sides cannot have the same effect.
5. The road includes changes between 2/4/6 lanes, and outer lanes are blocked by curbs or boundaries at narrowing sections. Input that would enter a lane about to close or leave the current road width should be rejected or strongly signaled, and the vehicle must not pass outside the drivable area; when rejected, the lane, screen position, and resources must not undergo unrelated changes.
6. The road contains traffic moving both in the same direction and oncoming. Vehicles move according to their own direction and can slow down/change lanes because of vehicles ahead, pedestrians, narrowing sections, or safe-following distance. When the player approaches a vehicle ahead, speed is limited or a traffic warning is triggered.
7. The player can earn a near-miss reward by passing close by; minor side collisions cause screen flashes, deceleration, a count impact, or a bounce-back; colliding head-on with a hazardous vehicle or pedestrian, or failing to handle a severe hazard, enters a hazard-handling, collision-recovery, or failure flow. A severe collision should have a visible impact animation, flight/fall distance, or equivalent collision presentation, and include the relevant outcome in settlement or statistics.
8. The first/first few hazards may use a "warning/forgiveness" mechanism: the screen gives a clear warning, automatically or semi-automatically moves the player to a safe lane, and consumes a visible opportunity. A severe oncoming-vehicle hazard can trigger bullet time, requiring the player to click/press repeatedly within a short time to complete the dodge; success moves the player into a safe lane, while failure enters a crash animation or failure.
9. Race progress is represented by lap count, an overall progress bar, and rank. AI rivals advance, change lanes, avoid obstacles, and participate in ranking. After the full course is completed, the game enters stage settlement, displaying the player's placement, each rider's result, prize, and balance change, and provides options to continue to the next stage or enter the shop.
10. Failure/timeout/crash settlement displays distance, remaining time or failure reason, top-speed performance, near misses, number of collisions, income/penalties, and balance change, and provides a restart option; if sufficient progress has been achieved and the balance is sufficient, the player can pay a continue fee to continue the current stage.

## Input Requirements

- Click/touch the start prompt or press any start key to enter the game.
- Keyboard left/right arrows or A/D control lateral lane changes; V switches the view; M opens the menu; S opens the shop; Space uses the advanced power.
- Short mouse/touch taps on the left or right area of the track should produce lane-change intent; a horizontal swipe should produce lane-change intent. HUD button areas must not accidentally trigger a lane change.
- On-screen buttons support view switching, menu/shop, nitro, and advanced powers.
- Close, continue, restart, next stage, shop, statistics, leaderboard, and purchase/equip operations in pop-ups must be executable through real clicks/touches.

## State Requirements

- `loading/menu`: The loading or start screen is displayed, and the main game does not accept track input.
- `playing`: The track advances, AI and traffic update, the HUD stays synchronized, and the player can change lanes and use available powers.
- `paused/menu`: When a menu, shop, statistics, leaderboard, or settings pop-up is open, the main track should be paused or clearly blocked, and play resumes after it is closed.
- `bulletTime`: The hazard-dodge state pauses ordinary progression and displays the timer, click progress, and safe-direction feedback.
- `crashRecover`: Ordinary input is restricted during the collision animation, warning, or forgiveness movement.
- `result`: Stage completion or failure settlement; the main track no longer advances, and buttons determine the next step.
- `restart/continue`: Restart clears temporary objects and old pop-ups; continue deducts a valid fee and preserves the declared stage progress.

## Resources, Progression, and Economy

- The HUD displays at least rank, laps/progress, race time, and available power/nitro status.
- Balance is a persistent resource. Settlement adds prizes or deducts continue fees/shop spending, and the balance must never become negative.
- The shop contains at least several purchasable vehicles in addition to the basic vehicle. Vehicles have different top speeds, acceleration/braking performance, and prize multipliers; advanced vehicles can have one active power.
- Owned vehicles can be equipped; when a vehicle is not owned and the balance is sufficient, it is purchased and automatically equipped; when the balance is insufficient, visible rejection feedback must be given without changing the balance or ownership state.
- The statistics panel records persistent information including total distance, total time, highest speed, highest stage, collisions, pedestrian/special-target hits, fall distance, income, spending, and current balance. The leaderboard can be a P2 network/local display, and its failure must not block the core game.

## Powers and Feedback

- The nitro button has limited uses or cooldown feedback. After it is triggered, speed, visuals, or the HUD must change visibly; triggering it again after uses are exhausted should be rejected, and remaining uses must not become negative.
- The advanced power differs according to the current vehicle and can take the form of pushing away traffic ahead, a brief jump/sprint, or firing forward energy to destroy a vehicle ahead. The power must have a cooldown, button availability, and a visible effect; triggering it again during cooldown should be rejected and must not cause erratic state changes.
- View switching changes between first-person and third-person, while the road direction, input direction, and HUD seen by the player remain consistent.
- Music, sound effects, blood/collision presentation, FPS, or effects settings are P2 and must not affect the core interaction loop.

## Scope Reduction

- P2 may omit external leaderboard network requests, avatars, precise social rankings, and remote saves, but must retain a locally visible leaderboard/statistics entry point or stable unavailable feedback.
- P2 may simplify vehicle model appearance and sound assets, but cannot omit vehicle performance differences, purchase/equip logic, advanced powers, or visible cooldowns.
- P2 may simplify environmental details such as pedestrians, airplanes, billboards, clouds, and weather, but cannot omit traffic hazards, road narrowing, AI racing, or 3D scene legibility.

## Completion Criteria

- The player can enter the 3D track from the start screen, use real input to change the on-screen lane position, avoid traffic, and advance laps/progress.
- The main scene cannot be a blank canvas or only a static background; input, speed, traffic, and progress must be presented synchronously in the visuals and HUD.
- Collisions, hazard dodges, results, restart, continue, menu blocking, and the shop economy all have observable post-states.
- Invalid input, insufficient balance, powers on cooldown, track input while a pop-up is open, and attempts to continue after the terminal state must all be rejected or locked without breaking core resource invariants.

---

## GDD / Design Doc (merged from design-doc.md)

# City Racer X Neon Rush Design Doc

## MDA

### Mechanics

### M1: Launch and Start Flow
The loading/start screen transitions into a playable state, hides the blocking layer, and makes the main 3D scene start accepting track input.

### M2: Main 3D Racing Scene
The WebGL/3D city road, player's motorcycle, lanes, traffic, AI rivals, HUD, and progress are rendered synchronously.

### M3: Direction-Sensitive Lane Changes
Keyboard, mouse taps, touch taps, and swipes can all trigger left/right lane changes, with clear screen-space directional semantics and different results for opposite inputs.

### M4: Automatic Acceleration and Progress
The player's vehicle advances over time, and speed, laps, rank, race time, and the progress bar update.

### M5: Traffic Hazards and Collisions
Same-direction/oncoming vehicles, pedestrians, road narrowing, and safe-following distance create hazards; dodges, side collisions, severe collisions, flight/fall presentation, and warnings have distinct feedback.

### M6: Hazard Forgiveness/Bullet Time
After a hazard is triggered, a warning or brief clicking challenge is displayed; success moves the player into a safe lane, while failure enters collision recovery or failure.

### M7: Stage Completion and Failure Settlement
After finishing or failing, rank/distance/rewards/penalties/balance are displayed, and ordinary track input is locked.

### M8: Restart and Continue
Restart clears temporary state; continue deducts a valid fee and preserves the stage progress that is allowed to be retained.

### M9: Menu, Pause, and Blocking
The menu, shop, statistics, leaderboard, and settings panels block track input, and closing them resumes play.

### M10: Shop and Vehicle Progression
The balance is used to purchase/equip vehicles, and different vehicles affect performance, prize multiplier, and available power; insufficient balance is rejected.

### M11: Nitro and Advanced Powers
Limited nitro and advanced vehicle powers produce visible changes in speed/traffic/effects and are constrained by cooldowns or use counts; exhausted uses or cooldown do not generate additional effects.

### M12: View, Statistics, Saves, and Leaderboard
First-/third-person view switching, statistics, and persistent balance/vehicle state are retained; the leaderboard can be displayed locally or remotely.

### Dynamics

The player continually cycles through "speed increase -> observe traffic/road -> change lanes or use a power -> reward/risk -> progress advancement." AI rivals and traffic prevent the player from simply staying in one lane; road narrowing and oncoming vehicles create short-term decision pressure. Settlement and the shop convert short-session performance into long-term progression, encouraging the player to challenge later stages with faster vehicles.

### Aesthetics

The target experience is fast, tense, clear, and arcade-like. The player should be able to see the road direction, vehicle hazards, current rank, and next-step buttons at a glance; collisions, dodges, nitro, powers, and settlement need sufficiently strong visual/audio/HUD feedback so that they are not represented only by numeric changes.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Launch and Start Flow | P1 | Click/touch the start prompt or press the start key | Enters the racing state, the start layer disappears, the main track becomes interactive, and the 3D scene updates | Failure if the blocking layer still blocks track input |
| M2 Main 3D Racing Scene | P1 | Wait briefly after entering the race | The main screen is non-empty and contains a road, vehicles, HUD, and depth motion | A blank screen, hidden main scene, or only static UI is unacceptable |
| M3 Direction-Sensitive Lane Changes | P1 | Real ArrowLeft/ArrowRight, A/D, left/right taps, touch taps, or horizontal swipes | The player's motorcycle changes its lateral screen position or lane; left and right inputs produce opposite on-screen directions | Same-direction changes, no changes, out-of-bounds movement, or acceptance of a closed lane is unacceptable |
| M4 Automatic Acceleration and Progress | P1 | Wait after starting while remaining in a playable state | At least one of distance/progress/speed/time advances continuously, with synchronized HUD | No progress outside pause/terminal states, or only internal counting without HUD/visual changes, is unacceptable |
| M5 Traffic Hazards and Collisions | P1 | Change lanes/do not change lanes after loading a valid "traffic/narrowing hazard ahead" situation | A traffic entity or narrowing boundary is visible; avoiding it causes no crash, while an impact/side collision changes speed, feedback, statistics, or result | Missing traffic, collisions without consequences, or the ability to pass through a closed lane is unacceptable |
| M6 Hazard Forgiveness/Bullet Time | P2 | Load an oncoming-hazard situation and trigger hazard handling | A warning/challenge layer appears; clicks/key presses advance the challenge; success/failure enters different states | Directly granting success/failure, a challenge without input feedback, or ordinary input erratically changing state is unacceptable |
| M7 Stage Completion and Failure Settlement | P1 | Complete the last step after reaching the finish or a valid failure situation | The settlement state, rank, reward, balance, and restart or next-stage button are visible | The track continuing to advance after the terminal state or input continuing to change the score is unacceptable |
| M8 Restart and Continue | P1 | Click restart or continue on the result layer | Restart returns to a new session/start state and clears old pop-ups, hazard challenges, and collision remnants; continue deducts a fee and preserves valid progress | Continuing with an insufficient fee, a negative balance, or remnants of old hazard entities is unacceptable |
| M9 Menu, Pause, and Blocking | P1 | Click menu/shop/close or press the keyboard menu key | While a panel is open, track input is blocked and the lane does not change; closing it resumes play | Being able to change lanes while a panel is open, or remaining blocked after it is closed, is unacceptable |
| M10 Shop and Vehicle Progression | P2 | Open the shop and click a purchasable/equippable vehicle | The balance, ownership/equipped state, and vehicle performance/power summary change | A successful purchase with insufficient balance, a negative balance, non-persistent equipment, or visible controls that cannot be clicked is unacceptable |
| M11 Nitro and Advanced Powers | P2 | Click the nitro/power button or press Space | Speed/jump/traffic is affected, the button's use count or cooldown changes, and the screen has an effect/state change | Re-triggering during cooldown, triggering with no uses remaining, or changing only numbers without visible feedback is unacceptable |
| M12 View, Statistics, Saves, and Leaderboard | P2 | Click view/statistics/leaderboard/settings | The view mode changes, and statistics and persistent balance/vehicle/collision/fall state are visible; closing the entry restores play | Incorrectly reversing the input direction after switching views or failing to update statistics after settlement is unacceptable |

## GDD Notes

- 3D/WebGL is a product-level requirement: the main experience depends on the road's depth, vehicles, camera, and screen-space lane changes, and cannot degrade into a pure menu list or static 2D background.
- Directional semantics are based on what the player sees on screen. Regardless of how position is expressed internally, the player must be able to see the lateral motion produced by left and right inputs.
- Long-chain features may be entered through valid scenario preconditions, such as "near the finish," "shop with insufficient balance," "power on cooldown," and "the moment before an oncoming hazard." These preconditions cannot already include the settlement, reward, destruction, or purchase result.
