# Park Master Gameplay Requirements

## 1. Game Positioning and Objectives

Park Master is a top-down 2D parking driving game. The player drives a small car in a portrait-oriented parking lot, starting from the starting point, avoiding static obstacles, parked vehicles, and vehicles that travel along routes, and ultimately parking in the designated parking space at low speed, fully inside it, and aligned with its direction.

The core objective is to complete a series of parking levels. Each level should clearly display the current level, timer, player vehicle, target parking space, road markings, obstacles, and environmental decorations; the player needs to judge the vehicle body's position, direction of travel, steering space, and collision risk within the visible scene.

## 2. P1 Core Gameplay Scope

- A level starts in a controllable driving state, and the scene must contain the player vehicle, a target parking space, collidable obstacles, and a readable parking lot space.
- The player can control the vehicle with the keyboard arrow keys or WASD; on mobile devices or narrow screens, there should be holdable up, down, left, and right directional controls.
- Up/forward input makes the vehicle gradually accelerate along the direction of its front; down/reverse input makes the vehicle gradually move in the direction of its rear, and reverse speed should be noticeably slower or more conservative.
- Left and right inputs are not instantaneous directional movement, but provide a steering feel: the vehicle gradually changes its heading when it has speed; after left or right is released, the steering tendency returns to center; applying steering alone while the vehicle is nearly stationary should not cause noticeable displacement.
- When moving forward, left/right turns the vehicle in the corresponding direction; when reversing, the same left and right inputs should produce the opposite steering effect for reverse correction, making the player feel the need to correct the rear of the vehicle as in real parking.
- After forward/reverse is released, the vehicle continues coasting briefly and gradually slows down rather than stopping abruptly; input in the opposite direction should reduce the current motion trend and allow a transition to reverse or forward motion.
- The vehicle must be constrained by the parking lot boundaries and should not be able to leave the playable area; hitting an obstacle, parked vehicle, or moving oncoming vehicle fails the level and triggers collision feedback.
- Collision feedback should include a visible impact location or flashing/burst cue, a brief sense of loss of control or vehicle disappearance, and a reset of the level to its starting point after a short delay.
- Successful parking requires the vehicle to enter the target parking space at low speed, with the entire vehicle body inside the space and its heading substantially aligned with the space's direction; passing through at high speed, touching only the edge of the space, or having a clearly incorrect heading should not complete the level.
- After completing a level, the timer stops, and a completion panel, elapsed time, and star rating are displayed, with actions to retry or enter the next level.
- The star rating depends on completion time, with faster completion earning a higher reward; completed levels should record the best performance or at least advance to the next level.
- A pause entry should be available while driving; while paused, the vehicle, timer, and moving vehicles stop advancing, and continue and retry actions are displayed. Continuing resumes driving, while retrying returns to the starting point of the current level and clears collision/completion state.

## 3. Control Feel Causal Chain

While forward is held, the player should see the vehicle accelerate in the direction of its front, with the speedometer or equivalent feedback changing as speed increases and engine/motion feedback becoming stronger. While reverse is held, the vehicle moves in the direction of its rear, with a more restrained speed limit and acceleration feel suitable for fine adjustments.

While left or right is held, the player should see the front wheels or front of the vehicle gradually turn toward the input direction; only when the vehicle has speed should its body change heading and position along a curved path. After steering is released, the steering wheel/front-wheel visual or the vehicle's steering tendency should gradually return to center.

Left/right correction while reversing should produce the opposite turning result from forward motion: with the same left input, the player sees the paths of the rear and front of the vehicle present the reverse correction used when backing into a parking space. This difference is central to the parking feel; the left and right keys must not be implemented as screen-space translation.

After the throttle or reverse key is released, vehicle speed should gradually decrease due to resistance; if the player presses the opposite direction while coasting, the vehicle should first decelerate and then enter motion in the opposite direction. Collision risk is coupled with speed, position, and vehicle-body shape: the closer the vehicle is to an obstacle or moving oncoming vehicle, the more it requires low-speed fine adjustment.

The reward for successful parking is level completion, time settlement, and a star reward; the cost is that the player must reduce speed for precise alignment, and entering the parking space too quickly does not immediately succeed. The cost of failure is resetting the current level, with the player losing the current time and route attempt.

## 4. Visible Feedback and Information Presentation

While driving, the player vehicle's current position, heading, and movement changes should always be visible. The vehicle may use a top-down body, tires, or a direction indicator to show its heading, and steering should have sufficiently readable rotation feedback.

The parking lot should include a gray road or similar paving, lane lines, target parking-space markings, obstacles, parked vehicles, and decorative objects. Obstacles are not merely background and should be tied to collision failure; decorations can improve scene recognizability but should not obscure core driving information.

Timing starts from the player's first driving input, rather than merely upon entering the level. The timer should remain visible in the driving HUD and stop changing when the level is completed or paused.

The level completion panel should clearly communicate success, elapsed time, star rating, and the next-step choices. There should be immediate visual feedback on impact so that the player knows the failure came from a collision rather than a random reset.

On touch devices, the on-screen directional controls should support holding, releasing, and sliding into/out of button regions; when multiple directions are held, combined input should be allowed, such as forward plus left turn or reverse plus right turn.

## 5. Levels, Progression, and Win/Loss

The game should contain multiple preset levels, with difficulty gradually increasing through the starting point, parking-space orientation, obstacle density, narrow roads, parked vehicles, and moving vehicles. P1 requires at least several parking levels that can be played consecutively; P2 can expand this to a full ten levels or more.

The victory condition for each level is to enter the target parking space at low speed, fully inside it, and with a matching heading. After victory, the current level is locked and no longer responds to driving input until the player chooses retry or next level.

The failure condition is a collision with an obstacle, parked vehicle, moving vehicle, or dangerous boundary area. After failure, collision feedback should be displayed, and the current level should return to its starting point automatically or through an explicit action; after reset, the timer, speed, position, heading, and moving-vehicle state should all return to their initial states for a new attempt.

Progress should advance to the next level after a level is completed; if the player is already at the last level, the game may cycle to the first level or display an option to continue after completing all levels. Best times and highest star ratings for completed levels are P1 recommended, with persistence enhancements available in P2.

## 6. Menus, Modes, and State Flow

The startup flow should first display a loading/start screen and wait for the player to actively start before entering a drivable state. After driving begins, no residual start layer should obstruct the main scene.

Driving states include: waiting for first input, driving, paused, collision reset in progress, and level complete. A start prompt may be displayed while waiting for first input; any driving input hides the prompt and starts the timer.

The paused state should overlay the main scene but stop game progression, providing continue and retry. Continue returns to driving, and retry returns to the starting point of the current level. The completed state should overlay the main scene and provide retry and next level. During collision reset, the player should not be allowed to continue driving and cause secondary state confusion.

P2 edit mode: the game may provide a level-editing experience in which the player opens an object panel; selects objects such as obstacles, parked vehicles, road lines, target parking spaces, trees, lamp posts, and flower beds; and places, drags, copies, deletes, and adjusts their position, size, and rotation in the scene. Parked vehicles may be configured for whether they move, target position, start delay, movement speed, and loop interval. Edit mode is not part of the P1 core qualification threshold, but if provided, it must be clearly distinguished from driving mode, and the editing panel must not obstruct controls while driving.

## 7. Rejection Paths and Invariants

During pause, completion, and collision reset, driving input must not continue changing the vehicle's position, speed, or timer. After the completion panel appears, ordinary driving input other than retry or next level should be rejected.

The vehicle must not pass through obstacles or parked vehicles; moving vehicles must not be merely decorative, and entering their paths should create visible risk and collision failure.

If the vehicle is not fully inside the target parking space, its heading does not match, its speed is still clearly too high, or it only touches the edge of the space, success must not be awarded. Success determination must come from the parking posture, rather than merely touching the parking-space graphic.

Retry must clear the previous attempt's collision effects, completion panel, speed, timer, and vehicle position. Next level must switch to a new layout and reset the current attempt.

Releasing, moving out of, or canceling a touch directional control should stop the corresponding input; the vehicle must not continue accelerating or steering after the button visually appears released.

## 8. P2 Enhancements and Cut Scope

P2 enhancements include full ten-level progression, best time/star saving, background music and engine/collision/completion sound effects, a speedometer, start prompt, looping dynamic oncoming vehicles, richer environmental decoration, adjustable driving parameters, and a complete level editor.

If the P2 level editor is cut, P1 preset-level play should be retained; if the editor is provided, it should have clear feedback for object selection, placement, dragging, copying, deletion, and property adjustment.

Cut scope: realistic 3D perspective, realistic vehicle damage models, complex traffic AI, multiplayer, garage progression, a currency shop, external sharing, or exact reproduction of any particular art or sound are not required. The gameplay focus is top-down parking driving, collision risk, low-speed alignment, and timed star ratings.

---

## GDD / Design Doc (merged from design-doc.md)

# Park Master Design Doc

## 1. Design Pillars

Park Master is a top-down 2D parking-driving game about careful low-speed control, obstacle avoidance, and precise final alignment. The player should feel that parking is a continuous driving problem, not a grid movement puzzle: acceleration, steering, reverse correction, braking friction, collision risk, and final parking posture all matter.

The P1 experience is a complete preset-level loop: start the game, drive from the level start, maneuver through a readable parking lot, avoid static and moving hazards, stop fully inside the marked bay with the correct heading, receive time/star feedback, then retry or advance. P2 adds breadth through more levels, stronger persistence, richer audio/feedback, tuning, and an optional level editor.

## 2. MDA Summary

### Mechanics

- Top-down vehicle with forward acceleration, slower reverse movement, speed-dependent turning, friction after release, and counter-input braking before direction reversal.
- Steering changes heading rather than translating the car across the screen; reversing flips the effective turning outcome so backing up requires different correction.
- Parking-lot levels containing start pose, target parking bay, road markings, obstacles, parked cars, environmental objects, and moving cars that create crossing hazards.
- Collision failure against obstacles, parked cars, moving cars, or dangerous boundaries, followed by visible impact feedback and a reset to the current level start.
- Parking success only when the whole car is inside the target bay, moving slowly, and aligned with the bay orientation.
- HUD and state flow for start/loading, active driving, first-input timer start, pause/resume, retry, completion, next level, and collision reset.
- Time-based star rating and level progression after completion.
- P2 optional editor for placing, dragging, deleting, copying, resizing, rotating, and configuring parking-lot objects and moving-car behavior.

### Dynamics

- Players pulse forward and reverse inputs to manage speed, then combine throttle and steering to trace arcs through narrow gaps.
- Players slow down near obstacles because collision immediately costs the attempt, while faster completion improves the star result.
- Reverse input creates a distinct parking correction dynamic: the same left/right input changes the path differently than during forward motion, encouraging real parking-style adjustment.
- Moving cars force timing decisions: waiting, crossing before a vehicle arrives, or choosing a safer route.
- The final target encourages deliberate deceleration and alignment, because touching the bay or entering too fast is not enough.
- Pause, retry, and completion states interrupt normal driving so the player cannot accidentally continue moving while a modal state is active.

### Aesthetics

- Tense but approachable precision: the car should feel responsive enough to recover from mistakes, but heavy enough that careless inputs create risk.
- Readable spatial judgment: car heading, target bay, road lines, obstacles, and moving hazards should be visible at a glance.
- Clear consequence: crashes should be immediately understandable through impact feedback and reset; successful parking should feel conclusive through result, time, and stars.
- Mobile-friendly directness: on-screen directional controls should feel like held inputs, with clear pressed/released states and support for combined direction control.

## 3. Core M-Features

| ID | Feature | Priority | Design Requirement |
|---|---|---|---|
| M1 | Start and readable parking scene | P1 | The game starts from a loading/start screen, then enters an unobstructed driving scene with player car, target bay, HUD, obstacles, and usable controls. |
| M2 | Vehicle acceleration and braking feel | P1 | Forward/reverse inputs create gradual motion along the car heading or tail direction; release causes frictional slowdown; opposite input brakes then reverses trend. |
| M3 | Speed-dependent steering and reverse correction | P1 | Left/right inputs rotate steering over time and only meaningfully change trajectory while moving; reversing produces the opposite turning outcome from forward driving. |
| M4 | Collision risk and failure reset | P1 | Contact with obstacles, parked cars, moving cars, or unsafe boundaries causes visible crash feedback, blocks further driving during the reset, and returns the level to its start state. |
| M5 | Precise parking success | P1 | Completion requires low speed, full car containment in the target bay, and heading alignment; partial, fast, or misaligned entries remain playable but not successful. |
| M6 | Timer, stars, and completion flow | P1 | The timer starts on first driving input, stops on completion or pause, and completion shows time, star rating, retry, and next-level options. |
| M7 | Pause/retry state machine | P1 | Pause stops vehicle, timer, and moving hazards; continue resumes; retry resets position, velocity, timer, overlays, and transient effects. |
| M8 | Multi-level progression | P1 | Completing a level advances to a different preset layout or cycles after the final level; P1 needs several consecutive playable levels. |
| M9 | Touch direction controls | P1 | On-screen up/down/left/right controls support hold, release, cancellation, slide in/out, and combined inputs such as forward-left or reverse-right. |
| M10 | Moving hazard vehicles | P1 | Some parked-car-like hazards can move along routes with delays or loops; entering their path creates visible timing risk and collision failure. |
| M11 | Best performance persistence | P1 recommended / P2 | Completed levels should record best time/star or at least remember progression; persistent best records are stronger P2 depth. |
| M12 | Audio and richer feedback | P2 | Engine, crash, success, star, and background audio can reinforce state changes but are not required for the P1 gameplay contract. |
| M13 | Full ten-level breadth | P2 | A larger set of preset levels increases difficulty through tighter paths, denser obstacles, moving hazards, and varied bay orientations. |
| M14 | Level editor | P2 | An edit mode may expose object placement, dragging, copying, deletion, transforms, moving-car properties, and tuning without blocking P1 driving. |
| M15 | Driving parameter tuning | P2 | Adjustable speed, acceleration, turn rate, level selection, and object properties can support editing and polish but must not replace preset play. |

## 4. P1 Executable Core Loop

### Loop A: Normal Parking Completion

1. **Start/reset:** The player starts the game and reaches a driving level with the car at the level start, timer idle, speed zero, target bay visible, and no blocking overlay.
2. **Player input:** The player holds forward to begin moving, combines forward with left/right to follow an arc, releases to coast, taps or holds reverse to slow and reposition, and uses left/right during reverse for parking correction.
3. **Continuous state changes:** The car accelerates along its current heading, rotates gradually while moving, slows under friction when input is released, and changes trend when the opposite direction is held. The timer starts on the first driving input and visible car pose updates continuously.
4. **Goal/risk:** The player must reach the marked bay while avoiding obstacles, parked cars, moving hazards, and boundaries. The risk rises when the car is fast, close to objects, or misaligned in a narrow space.
5. **Reward/failure:** If the car is fully inside the bay, slow enough, and aligned with the bay, the level completes. If it only clips the bay, enters too fast, or points the wrong way, driving continues. If it collides, the loop goes to crash failure.
6. **Progress/reopen:** On success the timer stops, stars are calculated from completion time, a completion panel appears, and the player can retry for a better result or move to the next level.

### Loop B: Crash and Retry

1. **Start/reset:** A level begins or has just been retried with the car restored to its start pose, timer reset, speed zero, and hazards in their initial state.
2. **Player input:** The player drives too close to a solid object, crosses a moving hazard path at the wrong time, or pushes into a boundary danger area.
3. **Continuous state changes:** Car position and heading continue to update until overlap with the hazard occurs.
4. **Goal/risk:** The player is trying to preserve a clean route; collision is the immediate risk of poor speed, path, or timing.
5. **Reward/failure:** Collision produces visible impact feedback, stops driving response, and marks the attempt as failed.
6. **Progress/reopen:** After a short reset flow, the same level returns to its starting state with timer, speed, position, heading, moving hazards, crash effects, and completion state cleared.

### Loop C: Pause and Resume/Retry

1. **Start/reset:** During a playable driving attempt, the player opens pause.
2. **Player input:** The player chooses continue or retry from the pause state.
3. **Continuous state changes:** While paused, the timer, player vehicle, and moving hazards stop advancing; normal driving input is ignored.
4. **Goal/risk:** Pause prevents accidental movement and lets the player decide whether to preserve or abandon the attempt.
5. **Reward/failure:** Continue restores the same attempt; retry abandons it.
6. **Progress/reopen:** Continue returns to active driving with prior state intact; retry restarts the current level with transient state cleared.

### Loop D: Mobile Direction Control

1. **Start/reset:** A driving level is visible on a touch or narrow-screen layout with directional controls available.
2. **Player input:** The player holds up/down/left/right buttons, combines two buttons, slides between buttons, or releases/cancels touches.
3. **Continuous state changes:** Held controls map to the same acceleration, reverse, and steering behavior as keyboard input; button visuals and vehicle movement stop when touches release, cancel, or leave all buttons.
4. **Goal/risk:** The player uses touch controls to navigate the same obstacle and parking challenges.
5. **Reward/failure:** Correct touch operation can complete the level; stuck or ghost-held input can cause collision or overshoot and must be prevented.
6. **Progress/reopen:** Completion, crash reset, pause, and retry behave identically to keyboard play.

## 5. Mechanism Coverage Matrix

| Mechanism | Player Trigger | Observable Result | Failure/Rejection/Invariant |
|---|---|---|---|
| Start to play | Click/tap start after loading | Loading/start layer disappears; level scene and HUD are playable | No start overlay may remain blocking the playfield after active driving begins. |
| Forward acceleration | Hold up or W/ArrowUp | Car moves along its current nose direction with increasing speed feedback | Movement should not be a fixed screen-space translation independent of car heading. |
| Reverse motion | Hold down or S/ArrowDown | Car moves along its tail direction more cautiously than forward | Reverse should not be identical to forward speed or ignore car orientation. |
| Friction/coast | Release throttle/reverse | Car continues briefly then slows toward rest | Releasing input must not hard-stop instantly or keep accelerating forever. |
| Counter-input braking | Press opposite direction while moving | Current motion trend slows before changing direction | Opposite input must not teleport or instantly flip without visible deceleration. |
| Steering | Hold left/right while moving | Car heading changes gradually and path curves | Left/right alone while nearly still should not create strong lateral displacement. |
| Reverse correction | Hold left/right while reversing | Vehicle path shows reverse-turn behavior opposite to forward turning | A screen-space left/right slide does not satisfy parking-driving feel. |
| Static obstacle collision | Drive into barriers, greenery, parked cars, or equivalent solids | Crash feedback appears; car stops or becomes temporarily uncontrollable; level resets | Obstacles must be collidable, not only decorative background. |
| Moving hazard collision | Enter the path of a moving vehicle | Moving hazard visibly intersects risk path and collision fails the attempt | Moving hazards must create gameplay risk, not only cosmetic motion. |
| Boundary safety | Try to drive outside playable parking area | Car is constrained or failure feedback occurs if boundary is dangerous | The car must not escape the playable area. |
| Parking success | Stop fully in target bay with matching heading | Timer stops; completion panel shows success, time, stars, and next actions | Fast, partial, or misaligned bay contact must not complete the level. |
| Timer | First driving input, pause, completion | Timer starts on first input, pauses when paused, stops on completion | Timer should not run before the player acts or keep running under pause/completion. |
| Star rating | Complete a level at different times | Faster completion produces higher star outcome | Stars must be derived from completion time, not arbitrary display only. |
| Retry | Retry from completion or pause | Same level restarts with clean pose, timer, speed, overlays, hazards, and effects | Old crash/completion effects or velocity must not leak into the next attempt. |
| Next level | Choose next after completion | A new preset layout or cycled level begins from its own start state | Next level must not keep the previous car pose, timer, or result state. |
| Pause/continue | Open pause, then continue | Driving freezes during pause and resumes from the same attempt | Driving inputs during pause must not move the car or timer. |
| Touch controls | Hold/release/slide/cancel direction buttons | Vehicle responds while held and stops corresponding input when released/cancelled | Ghost input after release/cancel is invalid. |
| P2 editor | Enter edit mode and manipulate objects | Editing UI and object changes are visible and separated from driving | Editor panels must not block P1 driving mode; P1 must remain playable without editor. |
| P2 persistence | Complete levels across sessions | Progress or best performance is available later | Persistence must not corrupt retry/reset within the current attempt. |

## 6. State Flow

| State | Entry | Allowed Actions | Exit |
|---|---|---|---|
| Loading/start | Game boot | Start once loading is complete | Active level |
| Waiting first input | Level initialized | Driving input, pause | Driving/timer active or paused |
| Driving/timer active | First driving input | Hold/release direction inputs, pause | Complete, collision reset, pause |
| Paused | Pause during active level | Continue, retry | Driving/timer active or waiting first input after retry |
| Collision reset | Collision failure | No normal driving response | Same level waiting first input |
| Complete | Valid parking success | Retry, next level | Same level waiting first input or next level waiting first input |
| Edit mode | P2 mode switch | Place/select/drag/delete/configure objects | Return to play mode or remain editing |

## 7. Priority Boundaries

P1 must deliver the recognizable parking game: readable top-down scene, continuous car physics feel, keyboard and touch driving, collision failure, precise parking success, timer/stars, pause/retry, several levels, and moving-hazard risk. A target that only offers a static car, button labels, or direct success without the driving loop does not satisfy P1.

P2 may deepen the game with full ten-level breadth, richer audio, persistent best records, editor mode, configuration panels, stronger visual polish, and more varied environment details. These systems should not introduce hidden victory conditions or replace the P1 preset parking loop.

Explicit cut scope remains: no requirement for 3D camera, realistic damage simulation, complex traffic AI, multiplayer, garage economy, currency shop, external sharing, or exact art/audio reproduction.

## 8. GDD Self-Review Notes

- All listed features map to the established parking-driving requirements: careful vehicle control, obstacle and moving-hazard risk, precise bay alignment, timer/stars, pause/retry, progression, and declared P2 systems.
- The P1 loop is written as executable player trajectories from start/reset through input, continuous state change, risk, success/failure, and retry/progression.
- No hidden play systems or extra victory conditions have been added beyond the declared P1/P2 scope.
