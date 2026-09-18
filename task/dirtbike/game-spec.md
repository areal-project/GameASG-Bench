# Dirtbike Game Spec

## Requirements Overview

This game is a 2D side-view dirt bike time trial. The player starts at the beginning of the track and holds the throttle via keyboard, mouse, or touch to propel the bike along the track toward the right, while after release the vehicle continues to be affected by inertia and terrain. The player must use ramps to jump, control the bike's orientation in the air, avoid crashing the rider's head or the bike into the ground while overturned, and complete the track in the shortest possible time.

## Priorities

- P0: The page launches reliably, the main scene is visible, and the basic HUD and controls are usable.
- P1: Complete race loop, throttle input, physics-based forward movement, crash respawn, finish-line results, and restart.
- P2: Multiple track switching, personal bests, ghost replays, flip boosts, sound effects, and track editing capability.

## Gameplay Requirements

### Tracks and Objectives

- The game provides at least 3 selectable side-view dirt bike tracks. Each track should have visibly different combinations of slopes, themed backgrounds, or terrain, so players can perceive that the current track is different.
- Each run starts at the starting line, with the finish line at the end of the current track's length. The player advances from left to right and completes the run after crossing the finish line.
- Tracks should support continuous terrain: flat ground, uphill slopes, downhill slopes, depressions, jumps, and elevation changes can all affect speed, airtime, and landing risk.
- The HUD displays the current total elapsed time; after the race ends, it displays the total time for the run and provides a way to start again.

### Input Semantics

- P1 Throttle: The player can hold the Up Arrow key, the Space key, or hold the screen/mouse to accelerate. While held, the bike should receive power in the track's direction of travel toward the right side of the screen, the tires or body should provide visible motion feedback, and HUD time should continue advancing.
- P1 Initial start: When the vehicle is in the ready state at the starting line, the player's first throttle hold can start the run, and timing begins advancing after the start action; if the game has a separate start button, that button cannot be the only way to play.
- P1 Release: After the player releases the throttle, the bike should not continue accelerating with the same power; its speed should gradually be affected by terrain, inertia, friction, and gravity.
- P1 Direction semantics: The throttle is not a button for moving left or downward. The screen-space result after holding the throttle must show the vehicle advancing along the track's direction of travel; in the same playable state, "holding the throttle" and "releasing the throttle/no input" must produce an observable difference in speed or displacement.
- P1 Airborne orientation: After becoming airborne, the vehicle remains affected by angular velocity and gravity. Holding and releasing the throttle in the air should create different body rotation tendencies or landing orientations, giving the player room to control the bike.
- P2 Touch equivalence: Touching and holding the main game area should be equivalent to holding the mouse/keyboard throttle, and releasing the touch should stop acceleration.

### Physics and Feedback

- The bike includes visible representations of at least the body, front and rear wheels, and rider. The tires should follow terrain contact, while the body angle changes with slopes, collisions, and airborne movement.
- When the front and rear wheels contact the ground, there should be suspension compression, tire rotation, dust, or equivalent feedback; becoming airborne and landing should have clear state changes.
- Accelerating on a ramp can make the vehicle jump; landing too hard or with an unstable orientation creates risk.
- A crash is triggered when the rider's head or the bike body hits the terrain in a dangerous orientation.
- A crash displays clear impact feedback, such as a red flash, fragments/tumbling, vibration, or a prompt; the vehicle then returns near the crash location or to the nearest safe position, its momentum is reset to zero, and the race can continue.
- A crash should not immediately result in race failure; it is a time loss and pacing penalty.

### Flip Rewards

- P2 supports flip boosts: after the player makes the bike become clearly inverted while airborne and then lands safely, a short speed boost is awarded.
- The flip reward must have visible feedback, such as a pop-up prompt, speed lines, particles, sound effects, or a HUD status.
- The first landing after a crash cannot be treated as a successful flip reward; it must be triggered by a valid sequence of becoming airborne, becoming inverted, and landing safely.

### Timing, Progress, and Results

- Total time starts counting after the race begins. Waiting to start and the ready state after a reset should not count toward the run time.
- After crossing the finish line, the run's total time is frozen, the results overlay is displayed, and celebration feedback is played.
- After the results, the player can restart the same track; restarting should clear the current run's crashes, particles, speed boosts, timing, and temporary state.
- P2 allows a seamless next run: after a short delay following the results, place the vehicle back at the next starting position, and the player can hold the throttle again to begin a new run.

### Multiple Tracks and Records

- P2 provides a track selection entry point. The player can select another track before starting or while idle; after selection, the main scene, slope shapes, and records list should switch.
- Personal best times are stored independently for each track, retaining the three fastest valid times in fastest-to-slowest order.
- After completing a race, if the time ranks in the top three, it should be saved and visible in the track selection or records panel.
- P2 Ghost bikes: When a track already has saved records, playing it again should display up to 3 translucent or visually differentiated ghost bikes that start from the same starting point and follow the saved records' movement trajectories as racing references. Ghost bikes should not block the player.
- P2 Records management: The player can clear saved personal bests and ghost records. After clearing, the records list is empty, ghost bikes disappear, and the current track can still start a new race normally; failure to clear or unavailable storage must not block core racing.

### Menus, State, and Restart

- On first entry, the game may directly display a playable starting point or show a start/track selection screen; whichever approach is used, the player must be able to start the race through a visible entry point.
- The game may include a loading overlay; after loading completes, no blocking overlay may cover the main game area.
- The game provides an entry point to reset the current race. After reset, the vehicle returns to the starting line, the timer returns to zero, the results overlay is hidden, and the current track remains unchanged.
- If there is a track drawer or panel, tracks can be browsed and switched while it is open, and after closing it or making a selection it must not continue blocking the main game area.
- Pause/mute is not a P1 requirement; if these options are provided, they should not break the race loop.

## Scope Cuts

- P2 Track editing mode may be cut. A game that provides this mode should make it only an aid for creation/tuning, not part of the P1 player racing loop.
- P2 Sound effects may be replaced by equivalent visible feedback, but engine, impact, landing, and celebration sounds are bonus experiences.
- External leaderboards, account systems, sharing, and cloud synchronization are not required features.

## Completion Criteria

- The player can enter a race from the launch state, hold the throttle to see the bike advance along the track toward the right side of the screen, and release it to stop applying power.
- The vehicle can become airborne due to ramps, rotate, land, and crash and respawn when it dangerously hits the ground.
- The player can cross the finish line to receive the run time, see results feedback, and start again.
- At least 3 tracks are selectable; P2 personal bests and ghost bikes must be stored and displayed independently by track.

---

## GDD / Design Doc (merged from design-doc.md)

# Dirtbike Design Doc

## MDA

### Mechanics

- Single-button throttle-driven 2D side-view bike physics: hold to gain forward power, and release to continue moving under inertia, slope, gravity, and friction.
- Continuous undulating tracks: slopes, jumps, depressions, and drops change vehicle speed, body angle, and landing risk.
- Crash and respawn: hitting the ground in a dangerous orientation triggers crash feedback, followed by returning to a safe position after a short penalty while timing continues.
- Time-trial loop: start, timing, finish-line crossing, results, record saving, and restart.
- P2 Flip boost: receive a short speed reward after becoming inverted in the air and landing safely.
- P2 Multiple tracks, personal bests, and ghost bikes.

### Dynamics

- Holding the throttle before a slope gives the player speed, but the higher the speed, the more the player must control the body angle after becoming airborne.
- Releasing the throttle can reduce power input and help stabilize the vehicle on slopes and in the air.
- Crashing does not end the race, but it costs time and speed, so the player weighs "faster" against "safer."
- Flip rewards encourage high-risk actions: speed increases after safely landing while inverted, while failure causes a crash and costs time.
- Ghost bikes provide comparisons with historical records, encouraging players to optimize routes and pacing.

### Aesthetics

- Sense of speed: camera following, scrolling terrain, tire rotation, dust, speed lines, and engine feedback.
- Sense of skill: jumping, flipping, pushing the front end down, and compressing the suspension on landing.
- Tension: large slopes, inversion, the rider's head approaching the ground, and crash warnings.
- Sense of achievement: finish-line timing, celebration feedback, setting a new personal best, and ghost opponents appearing.

## M-Features

### M1 Launch and Main Scene

After the game loads, it displays a non-empty 2D main scene, bike, track, and basic HUD. The main game area is interactive after the loading overlay disappears.

### M2 Start/Restart Flow

The player starts the race through a visible entry point or the first throttle input while ready at the starting line; during the race or after the results, the current track can be reset, which clears temporary state and returns to the starting line.

### M3 Throttle Forward Movement

After holding the keyboard, mouse, or touch throttle, the bike advances along the track toward the right side of the screen, with visible changes in speed, position, wheels, or the scene; power stops after release.

### M4 Direction and Airborne Orientation

Throttle input and no input produce different speed or rotation tendencies in the same state. While airborne, body orientation changes with input, gravity, and angular velocity, and the landing orientation affects stability.

### M5 Terrain Physics

Continuous undulating terrain affects tire contact, body angle, jumping, landing, and speed, and the main scene should continuously show interaction between the slope shapes and the vehicle.

### M6 Crash and Respawn

A dangerous impact with the ground triggers crash feedback, temporarily prevents normal vehicle control, and is followed by respawning at a safe position with speed and flip rewards cleared, while the race can still continue.

### M7 Finish-Line Results

After crossing the finish line, the result is frozen, results feedback is displayed, and the next run or a restart is allowed.

### M8 Multiple Tracks

The player can select at least 3 tracks; after switching, the terrain/theme and track records context change.

### M9 Records and Ghost Bikes

P2: Each track saves the top three personal bests; when playing again, the corresponding ghost bikes are displayed as historical trajectory references.

### M9b Records Clearing

P2: The player can clear saved personal bests and ghost records. After clearing, the records/ghost summary is reset to zero, while the current track selection and main racing entry point remain usable.

### M10 Flip Boost

P2: A short boost and visible reward feedback are triggered after a valid sequence of becoming airborne, becoming inverted, and landing safely; crash respawn cannot falsely produce this reward.

### M11 Feedback and Audiovisuals

P2: Engine, landing, crash, flip, and victory can be represented through sound effects or equivalent visual feedback; the HUD and state remain synchronized.

### M12 Editor Scope Cut

P2: Track editing mode may be within the cut scope; when this mode is provided, dragging/adjusting points only affects editing state and should not break the main race loop.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Launch and Main Scene | P0 | Open the page and wait for loading | Canvas/main scene is non-empty, bike and track are visible, HUD is readable | Blank canvas, permanently blocking loading overlay, or runtime exception fails |
| M2 Start/Restart Flow | P1 | Click start or a visible starting entry point, or hold the throttle while ready at the starting line; click reset/start again | State moves from ready/results back to the race, timing resets to zero or advances after starting, and the vehicle returns to the starting line | Old results overlay still blocks after reset, or old speed/rewards are not cleared fails |
| M3 Throttle Forward Movement | P1 | Hold ArrowUp/Space or hold the mouse/touch on the main scene | Bike world progress increases, wheels/track/camera change on screen, and time advances | Only the HUD changes while the vehicle does not move; input is blocked; incorrect throttle direction fails |
| M4 Direction and Airborne Orientation | P1 | In a playable state, separately perform holding the throttle and no input/release | The two trajectories have different speed or angle changes; screen direction shows advancement toward the right | Holding and releasing have the same effect, body orientation is not observable, or reversed direction fails |
| M5 Terrain Physics | P1 | Continue driving over slopes | Vehicle becomes airborne/lands, and body angle and tire contact change with the slope shape | Flat-ground slider-style movement or no terrain interaction fails |
| M6 Crash and Respawn | P1 | Hit the ground in a dangerous orientation in a valid scene, or continue input after loading the "near crash" precondition | Crash feedback appears, speed is cleared or control is briefly locked, and then the vehicle returns to a safe state and can continue | No crash feedback, crash directly completes the race, or respawn retains flip rewards fails |
| M7 Finish-Line Results | P1 | Hold the throttle to cross the finish line after a valid near-finish precondition | Timing freezes, results are visible, and continued input no longer changes the run result | Results appear without crossing the finish line, the result continues changing after the run ends, or restart is impossible fails |
| M8 Multiple Tracks | P2 | Open the track entry point and select another track | Track number/theme/slope summary changes, and the vehicle returns to the new track's starting line | Panel blocks the main scene, selection has no effect, or fewer than three tracks fails |
| M9 Records and Ghost Bikes | P2 | Complete a valid race and enter the same track again | The result enters that track's best list, and ghost bike count/record summary appears | Records contaminate other tracks, more than the top three are saved, or ghosts block the player fails |
| M9b Records Clearing | P2 | Trigger the clear entry point when records/ghost records exist | Personal bests and ghost records are cleared, and the current track can still start a race | Old ghosts remain visible after clearing, clearing breaks the racing entry point, or storage failure blocks the main flow fails |
| M10 Flip Boost | P2 | Load a valid airborne precondition, become inverted, and then land safely | Boost state, speed lines/prompt, or reward summary appears, and speed increases | Reward without inversion, reward after crash respawn, or reward does not clear over time fails |
| M11 Feedback and Audiovisuals | P2 | Accelerate, land, crash, cross the finish line | HUD, particles/vibration/sound effects, and other feedback are synchronized with state | State changes without visible feedback, or HUD and results are not synchronized fails |
| M12 Editor Scope Cut | P2 | If an editing entry point is provided, drag/adjust terrain points | Editing state is visible, and racing is not blocked after saving/closing | Editing controls contaminating race state fails |

## State Model

- `loading`: Resources and scene are being prepared; main interaction is unavailable.
- `ready`: The vehicle is at the starting line, waiting for the player to begin; the HUD is visible but timing for the run has not started.
- `playing`: Timing, physics, input, and progress operate normally.
- `crashed`: Crash feedback and respawn process; the player's normal throttle temporarily cannot advance the vehicle.
- `finished`: The finish line for the run has been crossed, the result is frozen, and results/start again are available.
- `track_select`: The track selection panel is open; after selection, return to `ready` or an idle state before `playing`.

## Non-Goals

- Reproducing any fixed artwork, copy, assets, or production method is not required.
- A fixed physics formula is not required; only input, physics feedback, state results, and player-visible semantics must be consistent.
