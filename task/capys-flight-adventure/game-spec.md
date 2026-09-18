# Capy's Flight Adventure Game Spec

## Requirements Overview

This game is a side-view physics-based flight challenge. The player launches a small cardboard airplane from a slingshot starting point, controls the pilot to stay airborne, and collects buff items, with the goal of achieving the greatest possible distance, altitude, item count, and overall score in a single flight. The game needs a start screen, a readable main scene, a flight HUD, item instructions, a results panel, a high score, and a retry flow.

## Gameplay Priorities

- P0: The page can launch, the main view is readable, the start screen can enter the game, and the HUD does not obstruct primary controls.
- P1: Slingshot launch, flight physics, flap-assisted endurance, score/distance/altitude updates, landing results, and restarting must be fully playable.
- P2: Item depth, high-altitude theme changes, an instructions panel, leaderboard/high-score display, and editing or preview auxiliary panels are experience enhancements, but existing behaviors must not be silently omitted.

## Core Loop

1. The player enters the ready-to-launch state from the start screen and sees the pilot, slingshot, sky, ground, and basic HUD.
2. The player presses and holds the pilot or a nearby area and drags backward. A clear pulled-back pose, elastic connection, or trajectory indicator should appear on screen.
3. Upon release, the pilot flies in the direction opposite to the pull direction. Pulling down and left should primarily launch the pilot up and right; dragging in opposite left/right directions should produce opposite visible horizontal flight trends.
4. During flight, gravity and drag affect the pilot, the camera follows the pilot, and distance, altitude, score, and remaining flap count stay continuously synchronized with the flight state.
5. While airborne, the player clicks/touches the main scene or presses Space, Up Arrow, or W to perform one flap. Each valid flap consumes 1 flap and gives the pilot visible upward endurance feedback; once the count is depleted, the same inputs should no longer provide an upward effect.
6. Contacting an item during flight collects it, increases the item count and score, and produces the corresponding visible/state effect.
7. After the pilot lands, the pilot may bounce briefly if enough speed remains; when speed is insufficient or the bounce ends, the game enters the results state, displays the run's distance, maximum altitude, item count, flight time, score, and high score, and provides an option to launch again.

## Input Requirements

- Start: The player clicks the start button to enter the ready-to-launch state. After the start overlay disappears, it must not continue blocking the main scene.
- Slingshot drag: After the mouse or touch is pressed near the pilot/airplane and moved, the pilot follows the drag and is constrained within the visible play area; on release, the pilot launches if there is valid pull force.
- Direction semantics: The launch direction must be opposite to the pullback vector. After dragging down and left and releasing, the pilot should visibly move up and right on screen; dragging in the opposite direction should show the opposite horizontal movement trend.
- Flap: Clicking/touching the main scene or pressing Space, Up Arrow, or W during the flight phase can trigger it. Flap input during the ready-to-launch and results phases must be rejected or have no effect.
- Panel controls: The instructions entry can open the item instructions, and closing them returns to the previous state; the launch-again button on the results panel resets the current run's data and returns to ready-to-launch.

## HUD and Observable Feedback

- The persistent HUD displays at least the score, flight distance, and maximum altitude.
- The flight phase should display the remaining flap count or an equivalent energy bar, decreasing with valid flaps and recovering with the corresponding item.
- Items should appear in the scene as collectible entities and disappear from the scene or play collection feedback after being collected.
- Collecting buffs, flapping, landing, and results should all have observable feedback, which may be animation, particles, sound effects, HUD changes, or state panel changes.
- The main scene must be non-empty and update with flight input and camera changes; it must not display only a static background or pure numbers.

## Resources, Score, and Progress

- The score grows jointly from flight distance, collected item count, and flight time. Item collection provides at least a fixed reward, and flying farther and longer should also increase the current run's score.
- Distance cannot be negative; maximum altitude should record the greatest altitude reached during the current run and must not decrease while descending.
- The high score should be saved locally or in an equivalent persistence layer and updated when a new score exceeds the old one.
- Results statistics must match the current run's flight trajectory and should not grant rewards out of nowhere when no flight or collection occurred.

## Items and Special Effects

- Speed boost: Provides a clear forward speed increase after collection.
- Updraft: Provides a clear upward speed increase after collection.
- Glide boost: Temporarily reduces the tendency to fall after collection and has an active-state indicator during its duration.
- Spring/bounce boost: Provides an upward bounce and some forward momentum after collection.
- Flap refill: Restores the flap count after collection, without exceeding the maximum limit.
- High-altitude power boost (P2): Appears after reaching a higher altitude and provides strong upward movement, forward speed, and a small flap refill.
- Scope adjustment: If the leaderboard service or editing preview panel is not included in the base version for now, it may be reduced to P2; however, the high score, item instructions, flight buffs, and high-altitude theme changes still need to remain as player-visible systems or be explicitly marked as P2 simplifications.

## State Requirements

- `loading/menu`: Displays start visuals, loading progress, or a start entry; may optionally display a leaderboard summary.
- `launch`: The pilot is positioned on the slingshot, pullback charging is allowed, the HUD is reset, and the results overlay is hidden.
- `flight`: The pilot moves, flapping and item collection are allowed, and the HUD continuously updates.
- `result`: The flight has ended, the main scene retains the final position or background, and the results panel displays statistics and allows launching again.
- `info`: The instructions panel overlays item instructions and returns to the state from before it was opened when closed; launch or flap must not be triggered accidentally while the panel is open.

## Completion Criteria

- The player can start a run from the start screen, drag to launch, use flaps to stay airborne and collect at least one type of item during flight, see correct results after landing, and start a new run by launching again.
- Launching and flapping must produce screen-visible flight trajectory changes, and the direction semantics must conform to reverse launch from a slingshot pullback.
- The HUD, results, high score, and item state are synchronized with actual gameplay.
- Invalid or phase-mismatched input does not corrupt resources, score, phase, or flap count.

---

## GDD / Design Doc (merged from design-doc.md)

# Capy's Flight Adventure Design Doc

## MDA

### Mechanics

M1: Start and menu flow. The player enters a playable ready-to-launch state from the start overlay, the instructions panel can be opened/closed, and a new run can be started after results.

M2: Slingshot charged launch. The player drags the pilot to form a pullback vector, launches in the opposite direction upon release, and sees trajectory, pose, and speed changes.

M3: Flight physics and camera. The pilot is affected by gravity, horizontal velocity, bouncing, and camera following, and the scene scrolls as the position changes.

M4: Flap endurance resource. During flight, clicking/touching/pressing a key consumes a limited flap count and provides upward endurance; once the count is depleted, it no longer takes effect.

M5: Item collection and buffs. Multiple collectible buffs appear in the scene and produce speed, upward movement, gliding, bouncing, or flap-restoration effects upon contact.

M6: HUD, score, and results. Distance, altitude, score, item count, flight time, high score, and the results panel stay synchronized with the current run's state.

M7: High-altitude and environmental feedback. After altitude increases, the sky, stars, moon, helmet/high-altitude theme, and high-altitude buffs strengthen the sense of flight goals.

M8: Auxiliary systems such as leaderboard/instructions/preview. The instructions panel explains items, while leaderboard or preview systems serve as P2 depth displays.

### Dynamics

The player first decides the pull direction and strength, then manages limited flaps and item routes during flight. Each flap extends airtime but consumes a resource, while items alter the next segment of the trajectory, prompting the player to make immediate judgments between "going farther" and "climbing higher." Landing results provide clear statistics, encouraging the player to try again with a better launch angle, flap timing, and collection route.

### Aesthetics

The experience should be lighthearted, retro, and clear. The player needs to feel elasticity when dragging to charge, impact when launching, changes in altitude during flight, a sense of reward from collection, and a sense of achievement from results. The visuals should prioritize readability of direction, distance, altitude, resources, and items.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Start the game | P1 | Click the start entry | The start overlay is hidden, the phase changes to ready-to-launch, and the main scene is interactive | After entry, the blocking overlay must not cover the main scene |
| M2 Pullback launch | P1 | Use mouse/touch to hold near the pilot, drag backward, and release | The pilot moves opposite to the pullback direction, the phase enters flight, and the flap bar is displayed | Releasing with no pull force must not launch; opposite drags should produce opposite horizontal trends |
| M3 Flight physics | P1 | Wait several frames after launch | Position, distance, altitude, scene scrolling, or velocity changes | Distance is non-negative; flight is not static numerical change |
| M4 Flap endurance | P1 | Click the main scene or press Space/Up/W during flight | Remaining flaps decrease, and the pilot's screen altitude or vertical velocity shows upward feedback | Flaps cannot fall below 0; input outside the flight phase does not consume them |
| M5 Item collection | P1 | The pilot contacts a visible item | Item count/score increases, the item disappears or plays collection feedback, and the corresponding buff takes effect | No reward without contact; flap refill does not exceed the limit |
| M6 Results and restart | P1 | The flight lands, or wait after loading a situation close to landing; click restart | The results panel displays distance, altitude, time, and score; restart returns to ready-to-launch and clears the current run's temporary values | Normal flight input does not continue adding score after the run ends; the high score updates only for a higher score |
| M7 High-altitude feedback | P2 | Reach a high altitude or load a high-altitude flight prerequisite | Visible feedback such as a darkened sky, stars and moon/helmet/high-altitude buff appears | The complete high-altitude state should not be displayed at low altitude |
| M8 Instructions and leaderboard/preview | P2 | Open the instructions or view the results/start leaderboard | The instructions panel can be closed; the leaderboard/preview does not block core gameplay | The main scene cannot be accidentally triggered while the panel is open, and interactivity is restored after it closes |

## System Details

### Launch System

Dragging uses screen-space semantics: the player pulls backward, then flies in the opposite direction upon release. Visual feedback is required during dragging, including at least one of changes to the pilot's position/orientation, an elastic connection, or a predicted trajectory. Pull force may be capped to prevent the pilot from being dragged outside the operable area.

### Flight and Resources

During the flight phase, position, velocity, distance, maximum altitude, and the camera need to update continuously. Flaps are a limited resource, with the maximum fixed or determined by balance configuration. Each valid flap should be consumed immediately and produce an upward trajectory improvement; input after the resource is depleted must observably be ineffective.

### Items

Items are rewards and strategic points along the flight route. The effects need to cover at least speed increase, upward increase, gliding, bouncing, and flap restoration. Each effect must have an observable state change: HUD, entity disappearance, active icon, speed/altitude/flap change, or particle feedback.

### Results and Persistent Feedback

After landing, the game enters a result state in which continued operation is not possible. Results data comes from the current run's flight trajectory. After restarting, distance, score, item count, flaps, active buffs, and the results overlay return to their new-run state. The high score is updated and retained when the new score is higher.
