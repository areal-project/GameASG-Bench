# Smash the Dummy Game Spec

## 1. Game Positioning

Smash the Dummy is a third-person 3D physics-based destruction level game. The player faces a ragdoll dummy that can be grabbed, swung, and collided, along with one clearly defined hazardous device or hazardous scenario in each level. The goal is not to avoid danger, but to actively cause accidents: drag the dummy or level props into the correct position so that hazards, collisions, continuous damage, or chain reactions deplete the dummy's health.

The tone of the experience is exaggerated, comical, and stress-relieving. Players should be able to quickly understand "what is dangerous in this level," attempt to cause destruction through dragging, and see clear 3D motion feedback, particle/audio feedback, health bar changes, and result feedback when the dummy is hit, burned, exploded, cut, crushed, dropped, or electrocuted.

## 2. Core Loop

1. After entering the game, the player first sees loading and start screens, and confirms the start once loading is complete.
2. Each level generates a dummy, a readable 3D scene, the current hazardous device, and a health bar.
3. The player uses a mouse or touch to grab a body part of the dummy, or to grab a hazardous prop that the level allows them to interact with.
4. The grabbed object follows the pointer within the world plane corresponding to the screen, and continues moving under gravity and inertia after colliding with a hazardous device, triggering a mechanism, or being released.
5. After a hazard hits, it causes visible feedback such as reduced health, force applied to limbs, broken joints, color/particle/audio changes, or dismemberment on death.
6. When health reaches zero, a brief death sequence begins, followed by the completion screen.
7. The player can replay the current level, enter the next level, or open the level selection panel to return to an unlocked level.

## 3. Input Semantics and Control Feel

### 3.1 Mouse/Touch Dragging

When the player presses or touches a body part of the dummy or an interactable prop, the target is grabbed; while the pointer continues moving, the target should follow the direction in which the pointer moves on the screen. Drag left and the target moves left on the screen; drag right and the target moves right; drag up and the target rises; drag down and the target lowers. Dragging must not visibly reverse direction or merely change values without a visible position change.

The grabbed dummy changes from its initial pose into a loose ragdoll state. The grab point is pulled as though by a powerful tether, while other body parts lag, swing, and collide under joint constraints. Continued dragging keeps pulling the body and may break joints; after release, the pull disappears, and the object retains its current pose and motion tendency, continuing to swing or fall under the effects of gravity, damping, collisions, and joint rebound.

The dragging range should be restricted to the visible scene so the player cannot drag the main interactive target permanently off-screen. If the target encounters a wall, the ground, or an impassable obstacle, it should be blocked, slide, or bounce away rather than pass through hazardous geometry.

### 3.2 Grab Priority and Rejection

When the pointer lands on an interactable prop, the prop takes grab priority; otherwise, a body part of the dummy can be grabbed. Non-interactable vehicles, fixed spikes, fires, walls, clouds, electric grids, mechanism casings, and similar objects should not be draggable. New scene grabs should be rejected after the level ends, during a death sequence, during an explicitly locked falling sequence, or while the result panel is displayed.

When no interactable object is hit, pressing and moving should not change the dummy's health, level progress, or hazard state. Releasing an empty drag should not trigger the result.

### 3.3 Click-Based Targets

Some levels use a click/tap instead of dragging, such as puncturing a suspended target. After the player hits the target, the target should immediately show break/disappear/particle feedback and advance the subsequent fall or release chain. Hitting a target that has already disappeared, clicking a blank area, or clicking while the target is not interactable should leave the state unchanged.

## 4. Main Visible Systems

### 4.1 3D Scene and Dummy

Every level must present a readable 3D scene: the ground, camera view, dummy, and current hazardous device must all be clearly visible. The dummy consists of multiple body parts and can be grabbed at a single point, swung, collided, bent, and dismembered. When a body part is struck, burned, electrocuted, exploded, or cut, there must be at least one obvious form of feedback among position/pose changes, particles, or color changes.

The dummy may initially be standing, lying down, sitting, suspended, or in another pose. Regardless of the pose, the player should be able to understand the spatial relationship between the grabbable target and the hazard.

### 4.2 Health and Damage

At the start of each level, the dummy's health is restored to full. The health bar always communicates the current remaining health and decreases in sync when damage is taken. High health, medium-to-low health, and near-death states should have distinguishable bar changes; at low health, the dummy's appearance may become more damaged or charred.

Damage sources include instant lethality, continuous contact, periodic damage, and collision-intensity triggers. Continuous damage must continue for the duration of contact and stop or become significantly weaker after leaving the hazard area. A hit from an instantly lethal hazard should quickly begin the death flow. A joint being torn apart by strong force, or a critical body connection breaking, may also directly lead to the failure result.

### 4.3 Death and Completion Feedback

When health reaches zero, the player should see the dummy enter a death presentation: its body comes apart, is crushed flat, charred, stiffens from electrocution before coming apart, is scattered by an explosion, or falls and strikes the ground, with feedback appropriate to the current hazard. Drag controls for the dummy should be blocked during the death presentation so the player cannot interrupt the result chain.

After a brief presentation, display the completion screen with access to the next level, replay, and level selection. The next level advances and unlocks only after the player actively chooses to enter it; merely displaying the completion screen should not commit progress early.

## 5. Levels and Hazard Gameplay

### 5.1 P1 Core Level Types

P1 must include a set of hazard levels representative of this game, rather than only one generic sandbox. It must cover at least the following types:

- Draggable tool: the player drags a rotating or flaming tool into contact with the dummy, producing continuous damage, particles/audio, and force on the body while contact continues.
- Moving hazard: vehicles, rolling objects, or automatically moving mechanisms cycle along a visible path; after the player puts the dummy in the path, it is struck, launched, or crushed.
- Draggable explosive/heavy object: the player grabs, moves, or releases a prop so that it triggers an explosion/impact after striking, falling onto, or approaching the dummy, producing chain damage and scattering feedback.
- Fixed hazard zone: flames, acid, electric grids, lasers, or spike areas remain fixed; after the player drags the dummy into the area, it takes continuous damage or dies instantly.
- Mechanism trigger: the player presses the dummy onto a button, trap, or trigger zone, triggering a fall, clamp, crush, launch, or another second-stage hazard.
- Click release: the player clicks a suspended object or support, causing the dummy to lose support, fall, and die when it hits the ground or a hazard.

Every P1 level must have a clear "player action -> scene change -> dummy takes damage -> completion or another attempt" loop.

### 5.2 P2 Extended Level Depth

P2 may extend the game with more themed hazards: falling fruit, flying knives, lightning strikes, swinging pendulums, maze spikes, rotating blades, lateral crushing, boulder slopes, tube transport, collapsing book stacks, roasting over a fire while suspended, moving lasers, bear traps, acid containers, meteor strikes, conductive puddles, fuse bombs, beehive pursuit, and more.

If these extended levels are included in scope, they should follow the same principle: the hazard mechanism must have its own visible action, rather than only subtracting health; the player must be able to affect the result through dragging, clicking, placement, release, or triggering; after completion, the standard result, replay, next level, and level selection flow is reused.

### 5.3 Level Differentiation Requirements

Different levels cannot change only the background or hazard name. Levels should differ in at least the following aspects: grabbable objects, hazard movement, trigger conditions, damage cadence, death presentation, or the action path the player must take.

When a level contains an automatically moving hazard, the player can see the hazard move even without acting, but it does not complete the core destruction out of nowhere unless the dummy's initial position is itself designed as a hazard demonstration. The player should cause the hazard to hit by positioning the dummy or triggering a mechanism.

## 6. State Flow and Interface

### 6.1 Boot and Start

After the game boots, it displays loading progress and a start button. Play should not be allowed to begin before loading is complete. After start is clicked, the start screen is hidden and the main 3D scene becomes interactable.

### 6.2 During Play

During play, the health bar and main scene are displayed. Gesture hints may guide the player toward a drag direction or target in early levels, but should hide or stop blocking controls after the player's first actual grab.

### 6.3 Completion Screen

The completion screen overlays the scene, displays celebratory feedback that the level has been completed, and provides:

- Next level: advance to and unlock the next level.
- Replay: clear all physics objects, hazard states, particles, and health for the current level, then restart it.
- Level selection: open the list of unlocked levels.

While the completion screen is displayed, the main scene may continue to show background physics animation, but the player cannot continue changing the result by dragging within the scene.

### 6.4 Level Selection

The level selection panel lists all levels. Unlocked levels can be clicked to enter, the current level should have a visible marker, and locked levels should appear locked and cannot be entered. The list can be scrolled or dragged to browse; scrolling the list should not accidentally trigger level entry. Closing the panel returns to the completion screen or the current context.

### 6.5 Persistent Progress

The player's unlocked levels, current level, and viewed tutorial hints can be saved. These should be restored when the player re-enters the game; if saving is unavailable, the game should at least begin in a playable first-level state.

## 7. Visible Feedback Chain

Every valid player action should produce at least one form of direct feedback:

- Successful grab: the target starts following the pointer, the hint disappears, and the dummy or prop changes pose.
- During dragging: the target moves continuously, joints stretch and swing, or the prop moves with the pointer.
- Release: the target is no longer locked to the pointer and begins to be affected by gravity/inertia/collisions.
- Hazard contact: particles, flames, electric arcs, impacts, explosions, cutting, compression, discoloration, or audio appears.
- Damage: the health bar decreases in sync.
- Lethal outcome: input locks, the death presentation plays, and the completion screen appears.

Audio is an enhancement, but core feedback cannot rely on audio alone; hits, damage, and completion must still be understandable in a muted environment.

## 8. Failure, Rejection, and Invariants

The game has no traditional penalty that forces a restart after failure; the player's main failure path is that "the action is ineffective or has not yet dealt enough damage." The following cases must be correctly rejected or preserve invariants:

- The main scene cannot be controlled before the game starts.
- Play cannot begin before loading is complete.
- Clicking a blank area does not grab any object.
- Dragging a non-interactable hazardous device should not move it away.
- Locked levels cannot be entered.
- New objects cannot be grabbed during the result, death presentation, or locked falling presentation.
- Replay must restore full health, clear explosion/fire/falling/death residue from the previous attempt, and reposition the dummy and hazard.
- Entering the next level must generate new level content and cannot reuse the previous level's hazard state or dead dummy.
- Health cannot fall below zero; the result can appear only once after the death chain is complete.

## 9. Cut Scope

P1 does not require every themed level, but must retain multi-level progression, level selection, a draggable 3D dummy, health/death/result flow, and at least six core hazard gameplay types. Themed levels not included in P1 should be P2 extensions rather than being silently replaced with empty lists, placeholder buttons, or repeated levels.

P2 may add a richer variety of randomized result phrases, more particles, more audio, more level themes, small in-level tutorials, and more complex death presentations. Purely decorative art, specific fonts, specific button wording, specific color values, and the appearance of a single asset are not hard gameplay requirements.

Explicitly out of scope: no editor mode, free camera, parameter adjustment panel, online sharing, leaderboards, account system, in-app purchases, level creator, or exact asset reuse is required.

---

## GDD / Design Doc (merged from design-doc.md)

# Smash the Dummy Design Doc

## 1. MDA Overview

### Mechanics

- **M1 3D ragdoll playfield**: Every level presents a readable third-person 3D scene, dummy, ground, camera view, and current hazardous device. The dummy consists of multiple body parts and can be grabbed, swung, collided, bent, and dismembered.
- **M2 Mouse/touch grab and drag**: The player begins grabbing after pressing a body part of the dummy or an interactable level prop; while the pointer continues moving, the grabbed object moves in the same direction on the screen. Dragging left moves the object left, dragging right moves the object right, dragging up raises the object, and dragging down lowers the object.
- **M3 Post-release physics continuation**: After release, the grab pull disappears, and the dummy or prop retains its pose and motion tendency while continuing to be affected by gravity, inertia, damping, collisions, and joint rebound.
- **M4 Interaction priority and rejection**: When the pointer hits an interactable prop, the prop takes grab priority; otherwise, a body part of the dummy can be grabbed. Non-interactable hazards, walls, mechanism casings, and similar objects cannot be dragged away. New grabs are rejected before the game starts, during the death presentation, during the result, and during locked phases.
- **M5 Health and damage**: The dummy starts every level at full health, and the health bar continuously displays its remaining health. Hazard contact, strong collisions, continuous damage, explosion impacts, or critical joint breakage subtract health; health cannot fall below zero.
- **M6 Death and completion**: When health reaches zero, a death presentation matching the hazard type is triggered and scene controls are locked during it; after a brief presentation, the completion screen appears and provides the next level, replay, and level selection.
- **M7 Multi-level hazard structure**: P1 includes at least six core hazard gameplay types: draggable tools, moving hazards, draggable explosives/heavy objects, fixed hazard zones, mechanism triggers, and click release.
- **M8 Level selection and progress**: From the completion screen, the player can enter the next level, replay the current level, or open level selection. The next level advances and unlocks only after the player actively chooses it; locked levels cannot be entered.
- **M9 Persistent progress**: Unlocked levels, the current level, and viewed tutorial hints can be saved; if saving is unavailable, the game begins at least in a playable first-level state.
- **M10 P2 extended hazards**: The game may be extended with themes such as falling objects, flying knives, lightning strikes, swinging pendulums, spike mazes, rotating blades, crushing, boulders, tubes, book stacks, lasers, bear traps, acid, meteors, electrified water, fuses, and beehives, but they must follow the same input-to-hazard-to-damage-to-result loop.

### Dynamics

- The player first observes the hazard's position, then uses dragging or clicking to bring the dummy, tool, or prop into the hazard chain.
- Grabbing is not teleportation: the grab point is pulled, while other body parts lag, swing, and collide, and may break due to strong pulling or hazard contact.
- Releasing is a risk decision: releasing too early may miss the hazard, while a correct release or continued placement allows inertia, gravity, automatic hazards, or mechanisms to continue advancing the destruction.
- Automatic hazards should continue showing movement or a hazardous state even when the player does not act, but core completion usually requires the player to place the dummy in the hazard path or trigger a mechanism.
- A valid hit forms a continuous feedback chain: visible hazard action or particles/audio -> dummy pose/color/dismemberment change -> health bar decrease -> death presentation -> completion screen.
- Invalid actions preserve invariants: empty dragging, clicking blank space, dragging non-interactable objects, clicking locked levels, or grabbing during the result cannot fabricate damage, unlocking, or completion.

### Aesthetics

- **Stress relief**: The player creates exaggerated accidents through direct dragging and receives fast, clear destruction feedback with little penalty.
- **Comical impact**: The dummy's force reactions, scattering, burning, electrocution, crushing, explosions, and similar presentations should be exaggerated but readable.
- **Experimental toy feel**: Each level resembles a small mechanism experiment, and the player discovers how the hazard works by trying different drag-and-drop paths.
- **Brief reward**: The death presentation and completion screen provide a clear sense of completion and lead the player toward the next level or replay.

## 2. P1 Core Loop Trajectories

### Loop A: Start or Reset Into A Playable Level

1. **Start/reset**: After the game finishes loading, it displays the start entry point; the player confirms the start, or chooses to replay the current level from the completion screen.
2. **Player input**: The player clicks start or replay.
3. **Continuous state changes**: The start screen hides; the current level regenerates the dummy, hazardous device, health bar, particles, and physics state; the dummy returns to full health, and old death and explosion residue is cleared.
4. **Goal/risk**: The player faces a readable hazard scene, with the goal of using the current hazard to empty the dummy's health; the risk is dragging the wrong target, placing it in the wrong position, or not yet dealing enough damage.
5. **Reward/failure**: After a successful start, the scene becomes interactable; if loading is incomplete or a blocking screen remains, play cannot begin and the main scene cannot be controlled.
6. **Progress/restart**: Replay does not advance the level and only restores the current level; the next level must be triggered by an active choice after completion.

### Loop B: Drag The Dummy Into A Hazard

1. **Start/reset**: The current level displays the dummy, health bar, and a hazardous device or hazard area.
2. **Player input**: The player presses a body part of the dummy and drags it. The drag direction must match the screen direction: drag left to move left, drag right to move right, drag up to rise, and drag down to lower.
3. **Continuous state changes**: The dummy transitions from its initial pose into a loose ragdoll state; the grab point follows the pointer, while other body parts lag, swing, and collide under joint constraints. Dragging is restricted to the visible scene, and walls, the ground, or obstacles block, slide, or bounce the dummy away.
4. **Goal/risk**: The player tries to bring the dummy within contact range of the hazard. The risks are missing the hazard, being blocked by an obstacle, inertia carrying the dummy off course after release, or causing only partial damage.
5. **Reward/failure**: After the hazard is hit, the dummy shows obvious feedback among position/pose changes, particles, color changes, or audio, and the health bar decreases; a miss or empty drag does not subtract health, complete the level, or advance progress.
6. **Progress/restart**: If health reaches zero, the death presentation begins and the completion screen is displayed; if health does not reach zero, the player continues trying to drag, or replays to clear the state of this attempt.

### Loop C: Drag A Tool Or Dangerous Prop Into The Dummy

1. **Start/reset**: The current level contains an interactable tool, explosive, heavy object, torch, electrified endpoint, or similar hazardous prop.
2. **Player input**: The player hits an interactable prop and drags it; when the pointer covers both the prop and the dummy, the prop takes grab priority.
3. **Continuous state changes**: The prop follows the pointer in the same direction, or is pulled within a specified plane and range; after release, it retains its physical tendency and continues falling, swinging, rolling, or settling.
4. **Goal/risk**: The player must make the prop contact the dummy, approach a hazardous target, light a fuse, trigger an explosion, or cause an impact. The risks are that the prop is not in position, the impact is insufficient, it leaves the effective range, or it is blocked by an impassable object.
5. **Reward/failure**: Success produces continuous damage, an instant explosion, impact, flames, electric arcs, or scattering feedback, and subtracts health in sync; incorrectly dragging a non-interactable object or failing to meet the condition does not change health or progress.
6. **Progress/restart**: After health reaches zero, input is locked and the result is presented; if health does not reach zero, the player continues adjusting the prop or switches to grabbing the dummy.

### Loop D: Use Moving Or Timed Hazards

1. **Start/reset**: The current level contains a vehicle, rolling object, swinging mechanism, moving laser, rotating blade, or another automatic hazard.
2. **Player input**: The player drags the dummy or an interactable prop and places it in the hazard path, trigger point, or contact area.
3. **Continuous state changes**: The automatic hazard continues moving along a visible path; after release, the dummy continues to be affected by inertia and collisions. When the hazard hits, it launches, crushes, cuts, impacts, or maintains contact with the dummy.
4. **Goal/risk**: The goal is to keep the dummy in the hazard path long enough or have the hazard hit at the correct time. The risks are incorrect timing, the dummy being bounced away, taking only one weak hit, or not yet dying.
5. **Reward/failure**: A successful hit reduces health and provides force feedback on the body; an automatic hazard cycling without contact does not complete the core destruction out of nowhere.
6. **Progress/restart**: After health reaches zero, death and completion begin; if health does not reach zero, the player waits for the next hazard cycle or drags and places the dummy again.

### Loop E: Trigger A Mechanism Or Click Release Target

1. **Start/reset**: The current level displays a button, trap, support, suspended target, or similar triggerable object.
2. **Player input**: The player presses the dummy onto the trigger zone, or clicks/taps a clickable target.
3. **Continuous state changes**: The trigger object performs a visible action: breaking, disappearing, falling, clamping, crushing, launching, releasing support, or starting a second-stage hazard.
4. **Goal/risk**: The goal is for the second-stage hazard to hit the dummy, or for the dummy to lose support and fall into danger. The risks are inaccurate placement, clicking blank space, clicking a target that has already disappeared, or clicking during a non-interactable phase.
5. **Reward/failure**: A valid trigger produces mechanism action, dummy damage, decreased health, and the death chain; an invalid click leaves the state unchanged.
6. **Progress/restart**: After the mechanism causes death, the result begins; otherwise, the player continues dragging or triggers a legal target again.

### Loop F: Complete, Progress, Select, Or Replay

1. **Start/reset**: After health reaches zero, the dummy first enters its death presentation, followed by the completion screen.
2. **Player input**: The player chooses the next level, replay, or level selection; in level selection, the player clicks an unlocked level or attempts to click a locked level.
3. **Continuous state changes**: The next level generates a new scene, hazard, and full-health dummy; replay repositions the current level and clears residue; level selection displays unlocked, current, and locked states.
4. **Goal/risk**: The goal is to advance to a new hazard or return to an unlocked level to continue playing; the risks are accidentally treating a scrolling list as a level selection, attempting to enter a locked level, or the result overlay continuing to block play.
5. **Reward/failure**: A legal selection switches to the corresponding level; a locked level cannot be entered, and the player cannot continue dragging to change the result while the completion screen is displayed.
6. **Progress/restart**: The next level is unlocked and saved only after the player actively confirms it; replay adds no unlocks; if saving fails, the game should still be able to start from the first level.

## 3. P1 Mechanism Coverage Matrix

| M-feature | Priority | Player trigger | Observable result | Failure / rejection / invariant |
|---|---|---|---|---|
| M1 3D ragdoll playfield | P1 | Start or replay to enter a level | A readable 3D scene, dummy, hazardous device, and health bar are visible at the same time | An empty scene, invisible dummy, lack of a hazard target, or an obscured main scene cannot qualify as a playable level |
| M2 Mouse/touch grab and drag | P1 | Press a body part of the dummy and drag | The grab point moves in the same direction as the pointer, and the dummy enters a swinging ragdoll state | Reversed direction, only numeric changes, losing health from clicking blank space, or no visible position change fails |
| M3 Post-release physics continuation | P1 | Release after dragging | The pull disappears, and the dummy or prop continues to be affected by gravity, inertia, damping, and collisions | Remaining locked to the pointer after release, or stopping immediately without reasonable physics feedback fails |
| M4 Interaction priority and rejection | P1 | Hit an interactable prop, non-interactable object, blank space, or the scene during the result | Interactable props take grab priority; non-interactable objects and locked phases reject grabs; empty dragging does not change health or progress | Still being able to change the result during the result, dragging away a fixed hazard, or empty dragging triggering completion fails |
| M5 Health and damage | P1 | Make the dummy contact a hazard, be struck, take continuous damage, or trigger critical breakage | The health bar decreases in sync, low health has a distinguishable change, and health does not fall below zero | Hazards dealing no damage, health continuing to decrease at full speed after leaving a continuous hazard, negative health, or an unsynchronized health bar fails |
| M6 Death and completion | P1 | Health reaches zero | Input locks, a death presentation matching the hazard type appears, and the completion screen appears after a brief presentation | Showing the result before death, still being able to grab and change the result during death, or the completion screen appearing repeatedly fails |
| M7 Draggable tool hazard | P1 | Drag the tool into contact with the dummy | Tool contact produces continuous damage, particles/audio, or force on the body | The tool being merely decorative, or contact providing no feedback or damage, fails |
| M7 Moving hazard | P1 | Put the dummy in the automatic hazard path | The hazard continues visibly moving, and after a hit it launches, crushes, impacts, or cuts the dummy and deals damage | The automatic hazard not moving, causeless completion without player involvement, or a hit with no feedback fails |
| M7 Explosive/heavy object | P1 | Drag or release the prop to cause an impact, fall, or approach to the dummy | Explosion, impact, scattering, or heavy-hit feedback, with a clear health decrease | The prop not being operable, having no trigger condition, or the explosion being only visual and not affecting the dummy fails |
| M7 Fixed hazard zone | P1 | Drag the dummy into flames, acid, an electric grid, lasers, spikes, or another area | Continuous or instant damage, with visible burning, electric arcs, cutting, discoloration, or force | A fixed hazard being draggable, no damage upon entering the area, or unconditional continuous damage after leaving fails |
| M7 Mechanism trigger | P1 | Press the dummy onto a button, trap, or trigger zone | The mechanism performs a second-stage action such as falling, clamping, crushing, or launching and damages the dummy | No action from the trigger zone, the mechanism action being disconnected from dummy damage, or repeated triggers corrupting the state fails |
| M7 Click release | P1 | Click a suspended object or support | The target breaks/disappears/releases, and the dummy falls or enters a second-stage hazard | Clicking blank space, an already-disappeared target, or during a non-interactable phase changes the result fails |
| M8 Level selection and progress | P1 | After completion, click next level, replay, level selection, or an unlocked level | The next level generates new content; replay clears and restores the current level; an unlocked level can be entered | Merely showing completion unlocks early, a locked level can be entered, or the next level reuses a dead dummy fails |
| M9 Persistent progress | P1 | Re-enter the game after completing a level | Unlocked levels, the current level, and hint state are restored when possible | Unavailable saving cannot prevent the first level from being playable; saving failure must not cause a black screen or make the game impossible to start |
| M10 Extended hazards | P2 | When an extended theme is included, use dragging, clicking, release, or trigger controls | Every extended theme has its own visible hazard action, damage feedback, and standard result | A P2 theme cannot be only an empty button, repeated background, or pure health subtraction |

## 4. Design Requirements By System

### Playfield And Camera

- Every level's main target, hazardous device, and health bar must be immediately readable after start.
- The view may be adjusted for each level, but it cannot keep the core grab target, hazard path, or completion feedback off-screen for an extended time.
- The main scene should support desktop mouse and touch input; touch dragging should preserve the same directional semantics as mouse dragging.

### Ragdoll Interaction

- Grabbing the dummy must show a single-point pull rather than rigidly translating the whole body; body parts should lag, swing, collide, or bend.
- Continued dragging continuously changes the pose and position; after release, the motion tendency continues and naturally settles through physics and joint rebound.
- Joint breakage may result from high-intensity pulling or a hazard hit and may directly enter the death chain.

### Hazard Families

- Draggable tools must depend on the player bringing the tool to the dummy and cause continuous feedback and damage during contact.
- Moving hazards must have their own visible motion path, and the player causes them to hit by positioning the dummy.
- Explosives and heavy objects must have trigger conditions formed by dragging, releasing, impacting, approaching, or falling, and produce an impact or scattering result.
- Fixed hazard zones take effect when the dummy enters and stop or significantly reduce continuous damage after it leaves.
- Mechanism triggers must have a second-stage action and should not merely change the button state to complete.
- Click release must provide feedback that the target breaks, disappears, or releases, and connect it to a subsequent fall or hazard hit.

### UI And Flow

- Play cannot begin before loading is complete; the main scene becomes interactable only after start.
- The health bar is displayed during play. Hints may guide early levels, but should no longer block controls after the first valid grab.
- The completion screen overlays the result entry points, provides the next level, replay, and level selection, and prevents further dragging from changing the result.
- Level selection must communicate unlocked, current, and locked states; scrolling to browse should not accidentally trigger level selection.

### Feedback

- Every valid action provides at least one form of direct feedback: the object starts following, the hint disappears, the pose changes, particles/color/audio appears, the health bar changes, or the result screen appears.
- Core feedback cannot rely on audio alone; grabs, hits, damage, death, and completion must still be understandable while muted.
- The completion reward should be brief and clear, without requiring fixed copy, colors, or assets.

## 5. Priority And Cut Scope

### P1 Playability Bar

The P1 version must let the player complete the full loop: load and start, drag the dummy or props within multi-level 3D scenes, deal damage through at least six core hazard types, see health reach zero and the death presentation, enter the completion screen, replay, enter the next level, use level selection, and retain basic progress.

P1 is not a single-level sandbox, nor is it a state machine containing only buttons and health values. Core playability comes from real player input, same-screen-direction dragging, physics continuation, hazard hits, health feedback, and the progression loop all working together.

### P2 Depth

P2 may add more themed levels, more complex death presentations, more particles/audio, tutorial hints, randomized result phrases, and richer continuous-hazard presentations. P2 extensions must still follow visible hazard actions and the input causality chain.

### Explicit Cut Scope

No editor mode, free camera, parameter adjustment panel, online sharing, leaderboards, account system, in-app purchases, level creator, or exact asset reuse is required. Reproducing any single visual phrase, font, color value, button wording, or asset appearance is not required.
