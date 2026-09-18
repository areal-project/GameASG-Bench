# Fruit Smoothie Merge Game Spec

## Requirements Overview

This game is a portrait-mode 3D physics-based fruit merge game. The player selects a drop point above the blender jar and releases a fruit. Gravity pulls the fruit into the jar, and when it collides with another fruit of the same tier, they merge into a fruit of the next tier and award points. The player aims for a high score by planning drop points, creating chain merges, and preventing the fruit pile from reaching a dangerous height, ultimately proceeding to the smoothie results either by losing when the jar becomes too full or by actively pressing the blend button.

## Experience Scope

The game should retain the complete loop of dropping, merging, the danger line, active blending, endgame juicing, results, and restarting. Online leaderboards, real audio, and high-fidelity materials are P2 enhancements; even if these enhancements are downgraded, equivalent visible placeholders, button feedback, result feedback, and a flow that allows continued play must still be provided.

## Gameplay Requirements

### P0 Basic Experience

- The game must be a standalone H5 page that can be opened directly and enters a playable state by default. A brief loading layer is allowed, but it must not obscure the main scene after loading is complete.
- The main scene must be a readable 3D blender jar/container scene containing a transparent jar, a tabletop or kitchen-atmosphere background, visible fruits, a drop-point indicator, a dangerous-height indicator line, a score HUD, a next-fruit preview, a restart entry point, and an endgame layer.
- The main playable area must render non-empty content; the player can see fruits fall into the jar, move under physics, collide, bounce, and stack.

### P1 Core Input and Dropping

- The player presses and drags with a mouse or touch within the playable area above the jar opening, and the on-screen drop-point marker, vertical drop line, and translucent fruit preview must follow the input.
- The horizontal screen-space semantics must be clear: when dragging toward the left side of the screen, the drop point and preview move left on the screen; when dragging toward the right side of the screen, the drop point and preview move right on the screen. Vertical dragging adjusts front-to-back depth and should also produce a visible change in the drop point on the screen.
- After the input is released, the current fruit falls vertically into the blender jar from directly above the drop point. The drop point must be constrained to the valid droppable area inside the jar and cannot be placed outside the jar walls or off-screen.
- The area near the blender base at the bottom of the screen must not accidentally trigger fruit drops; if this area contains the blend button, clicking it should prioritize the button action.
- Dropping has a short cooldown; repeated releases during the cooldown should not generate unlimited fruits.
- After each drop, the next-fruit preview updates; ordinary droppable fruits should be selected randomly or pseudo-randomly from low-tier fruits and must not continuously offer only the highest-tier fruit. The merge chain should contain multiple progressively larger fruit tiers, giving the player a clear progression goal.

### P1 Merging, Scoring, and Stacking

- Fruits of the same tier should merge into a fruit of the next tier after a physics collision: the two old fruits disappear, one higher-tier fruit appears near the collision, and conspicuous pop, sound, or particle feedback is produced.
- The score increases after a merge; higher-tier fruits should award more points. Merges performed in quick succession should create combo or multiplier feedback, which may be conveyed through the HUD, an overlay, animation, or sound.
- Fruits of different tiers cannot merge, and fruits of the highest tier cannot be upgraded further.
- Merging must conserve entities: one valid merge should turn two fruits of the same tier into one fruit of the next tier, without causing other fruits to disappear or generating additional unrelated fruits.

### P1 Failure, Results, and Restarting

- The screen must contain a dangerous-height line or an equivalent indicator. When settled fruits remain above the dangerous height for a period of time, the game enters the endgame flow.
- The endgame must not immediately cut to a black screen or static pop-up: the blender starting, the lid closing or locking, blades or container moving, fruits being juiced into a smoothie one by one, the liquid increasing, the smoothie being poured into a cup, drunk, and the cup tossed, or an equivalent smoothie results animation should be visible.
- The results layer displays the final score and provides an entry point to play again.
- Restarting clears the fruits in the jar, the score, the endgame layer, danger indicators, liquid, and animation remnants, restoring a fresh droppable state.

### P2 Active Blending and In-Depth Feedback

- The player can click a visible button on the blender to actively end the current game and start the juicing flow. The button should provide pressed feedback, and fruit drops are no longer allowed after it is pressed.
- If blending is started while the jar contains no fruit, the game should proceed to empty-jar results or provide lightweight feedback; it must not crash or award a false high score.
- The juicing process should award extra points or result points based on the number and tiers of fruits in the jar; fruits should gradually be removed from the scene, and the smoothie liquid level or color should change as fruits are juiced.
- The endgame may attempt to submit to or display a leaderboard; when offline, when there is no score, or when the service is unavailable, it should display an understandable placeholder/failure state and must not block restarting.
- Sound effects and background music are P2 atmosphere requirements: dropping, merging, the endgame, and blending should have perceptible audio feedback; when the browser restricts autoplay, starting audio after the first interaction is acceptable.
- After a period of inactivity, a hint such as “Press the button to blend” may appear; player interaction should make it disappear.

## State Requirements

- `loading`: Resources are being prepared and progress may be shown; upon completion, transition to `playing`.
- `playing`: The player can aim and drop fruits; the score, next fruit, danger indicators, and scene update in sync.
- `aiming`: While the player presses/holds and drags, display the drop point, vertical drop line, or fruit preview; after release, generate a fruit if dropping is allowed.
- `cooldown`: A brief interval after a drop during which fruits cannot be generated repeatedly.
- `danger`: Display a warning when settled fruits cross the dangerous height; if the danger clears, reset the warning and timer.
- `blending`: After being triggered by the endgame or the active button, stop normal dropping and perform the juicing and smoothie animations.
- `result`: Display the final score, leaderboard or placeholder information, and a restart entry point.
- `restarting`: After restarting, clear all remnants from the previous game and return to `playing`.

## Completion Criteria

- P1 completion threshold: The player can use real mouse or touch input to complete aiming, dropping, physics-based stacking, same-tier merging, scoring, danger-line failure, results, and restarting.
- P1 observability threshold: The 3D scene is not blank; after real input, the visuals, HUD, or visible state must update in sync; the visible on-screen result of directional input must not be reversed.
- P2 completion threshold: The active blend button, smoothie animation, combo feedback, sound effects, idle hint, leaderboard placeholder/failure handling, and a more complete endgame sequence are available.
- Replacing visible gameplay with purely numerical state is prohibited: core fruits, the jar, drop point, merging, danger line, blending, and results must all be visible to the player or confirmable through the HUD/results layer.

---

## GDD / Design Doc (merged from design-doc.md)

# Fruit Smoothie Merge Design Doc

## MDA

**Mechanics**: The player selects a drop point and drops fruits into a portrait-mode 3D blender jar; fruits fall, collide, and stack under physics; two fruits of the same tier merge into a higher tier and increase the score; stacking too high triggers the danger line and endgame; the player can also press a visible blend button to actively enter the juicing results; restarting clears the current game and allows the challenge to continue.

**Dynamics**: Within the limited space of the jar, the player weighs “placing fruits of the same tier close together to merge” against “avoiding stacking too high.” Merging creates larger fruits, which both award more points and occupy more space; consecutive merges create combos and rewards. Endgame juicing converts the current board into a visible smoothie animation and a final result.

**Aesthetics**: Lighthearted, bright, food-themed, with a physical-toy feel and satisfying juicing. The player should be able to quickly understand the currently droppable fruit, drop point, danger level, score changes, and whether the next action is available.

## GDD Feature List

### M1: 3D Main Scene and Readable HUD

Priority: P0. The game presents a portrait-mode 3D blender jar, tabletop/kitchen atmosphere, score, next fruit, danger line, restart entry point, and endgame layer. After loading completes, the main scene is visible and unobstructed.

### M2: Real Drag/Touch Aiming

Priority: P1. When the player presses and drags in the playable area, the drop-point marker, vertical drop line, and fruit preview follow the screen input. The left/right screen directions must match the drop-point directions seen by the player.

### M3: Release to Drop and Cooldown

Priority: P1. After the player releases the input, the current fruit is generated above the target position and falls into the jar; after dropping, a short cooldown begins, and repeated releases during the cooldown cannot generate additional fruits; the next-fruit preview updates. Ordinary drops select only from low-tier fruits, while the merge chain provides a long-term goal of gradually increasing fruit size.

### M4: Physics-Based Stacking and Same-Tier Merging

Priority: P1. Fruits collide, bounce, and stack inside the jar; same-tier fruits merge into the next tier, the old fruits disappear, and a new fruit appears near the collision; different-tier fruits do not merge, and the highest tier cannot be upgraded further.

### M5: Scoring, Combos, and Feedback

Priority: P1. Dropping itself does not need to award points, but merging and juicing increase the score; higher-tier fruits award more points; merges performed in quick succession display a combo or equivalent feedback; the HUD score stays synchronized with the internal score.

### M6: Danger-Line Failure

Priority: P1. When settled fruits remain above the dangerous height, display a warning and start a timer; after the limit is continuously exceeded, stop normal dropping and enter the endgame juicing flow; clear the warning when the danger is resolved.

### M7: Active-Blending Endgame

Priority: P2. The player clicks a visible button on the blender to actively end the current game; the button provides pressed feedback, after which the lid-closing, blade-spinning, juicing, and smoothie flow begins, and normal dropping is locked.

### M8: Smoothie Results Animation

Priority: P2. During the endgame flow, the lid closes or locks, blades/container move, fruits are gradually removed, and liquid/bubbles/color or equivalent visual feedback gradually intensifies. Then the smoothie is poured out, drunk, the cup is tossed, or an equivalent sequence transitions to the results layer. Actively blending an empty jar proceeds to an empty-jar result or lightweight feedback.

### M9: Restarting and Endgame Lock

Priority: P1. The results layer provides an entry point to play again; restarting clears the previous game's fruits, liquid, danger, score, and animation remnants. The endgame state does not accept normal drops.

### M10: Leaderboard, Sound Effects, and Hints

Priority: P2. The endgame may display a leaderboard or offline placeholder; dropping, merging, failure, and blending provide sound or haptic feedback; an idle hint guides the player to actively blend and hides after interaction.

## Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---:|---|---|---|
| M1 3D Main Scene and HUD | P0 | Open the page and wait for loading | The main canvas is non-empty, the HUD displays the score/next fruit, and the main scene is interactive | The loading layer cannot block permanently; a blank canvas is a failure |
| M2 Real Drag/Touch Aiming | P1 | Press above the jar opening and drag left/right or up/down | The drop point/preview follows movement in screen space: dragging left moves it left, and dragging right moves it right | Reversed directions, no drop-point feedback, or changing only a numeric value is a failure |
| M3 Release to Drop and Cooldown | P1 | Release after dragging | A new fruit falls from above the drop point, the fruit count increases, and the next fruit updates | Repeated releases during the cooldown cannot generate unlimited fruits; the invalid bottom area cannot initiate drops |
| M4 Physics-Based Stacking and Same-Tier Merging | P1 | Make two fruits of the same tier touch | Two fruits of the same tier merge into one higher-tier fruit, changing the scene and count | The total fruit relationship is conserved; different-tier/highest-tier fruits do not merge |
| M5 Scoring and Combos | P1 | Trigger one merge or consecutive merges | The score increases, and combo/feedback is visible or its state is readable | Dropping with no result should not falsely add a large number of points; the HUD and score stay synchronized |
| M6 Danger-Line Failure | P1 | Keep settled fruits above the dangerous height | A warning appears, followed by a transition to the juicing/endgame state | Briefly crossing the danger line should not cause immediate failure; after the danger clears, the warning resets |
| M7 Active Blending | P2 | Click the blend button | Button feedback appears, the lid/blades/juicing begins, and dropping is locked | Starting with an empty jar cannot crash; normal dropping cannot be triggered repeatedly during the endgame |
| M8 Smoothie Animation | P2 | Enter the endgame and wait | Fruits gradually decrease, and the liquid/cup/pouring/drinking or other sequence advances | The game cannot jump directly to a static score with no visible flow |
| M9 Restarting and Lock | P1 | Use the restart entry point on the results layer or at the top | The score resets to zero, the jar is cleared, the results layer hides, and dropping is restored | Normal dropping is rejected after the endgame; restarting cannot retain entities from the previous game |
| M10 Leaderboard/Sound Effects/Hints | P2 | Endgame, first interaction, or inactivity | The leaderboard/empty state/offline placeholder is visible, sound/haptics trigger, and the hint appears/hides | An offline leaderboard cannot block restarting; the hint cannot obstruct gameplay |

## Interaction and Visible Semantics

- The primary input is pointer or touch dragging, and a drop occurs only on release. A click can be treated as a short drag with immediate release, but it must still comply with the playable area and cooldown.
- Screen space is the player's criterion for judging direction, not internal world coordinates. Input on the left should correspond to a drop point on the left side of the screen, and input on the right should correspond to a drop point on the right side of the screen.
- 3D/physics is a product experience requirement: different engines or custom simplified physics may be used, but the player must see three-dimensional stacking and collision motion inside the jar, along with the endgame juicing sequence.

## Scope Reduction

- P2 may be downgraded: online leaderboard submission, real external audio, complex textures, avatar display, and detailed kitchen materials.
- Must not be omitted: a visible 3D main scene, real dropping, same-tier merging, score, danger line, active or passive endgame juicing, results, and restarting.
