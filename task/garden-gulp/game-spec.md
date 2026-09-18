# Garden Gulp Game Spec

## Requirements Overview

Garden Gulp is a top-down 2D casual swallowing game. The player controls a hole using the mouse, touch dragging, or keyboard directions, swallowing all visible objects in a garden-style playfield. Swallowing each object updates the collection progress and gradually enlarges the hole; once the hole grows larger, it can swallow larger objects. Levels have a countdown timer; clearing all objects completes the level, while running out of time causes failure and allows a retry.

## Gameplay Scope

The core scope of the game includes: entering from the opening screen, the main-screen HUD, countdown timer, swallowing progress, hole movement and growth, object fleeing/attraction/falling animations, level completion, timeout failure, next level, retry, audio toggles, and edit mode. If cuts are needed during production, they must be explicitly marked as P2 or as cut scope; the P1 core loop must not be omitted by default.

## Gameplay Requirements

### P0 Basic Experience

- By default, the game displays a visible opening/start overlay; after the player clicks or touches it, the playable main scene is entered.
- The main scene must display a non-empty top-down garden playfield, a circular hole, multiple swallowable objects, and level information, collection progress, and remaining time in the HUD.
- The game should support desktop and mobile browsers, with no page scrolling in the main scene; player input should act directly on the game area.

### P1 Core Controls and Direction Semantics

- When the player presses/drags in the game area with the mouse or touch, the hole should move smoothly toward the position indicated by the player; when dragged toward the right side of the screen, the hole's screen position changes to the right, when dragged toward the left side it changes to the left, and when dragged upward/downward it should likewise move consistently with the screen direction.
- Arrow keys and WASD are equivalent movement inputs. When pressing the right arrow or D, the hole moves toward the right side of the screen; when pressing the left arrow or A, it moves toward the left side of the screen; when pressing the up arrow or W, it moves toward the top of the screen; when pressing the down arrow or S, it moves toward the bottom of the screen. Diagonal input should be smooth and should not be noticeably faster than single-axis movement.
- The hole remains within the playfield boundaries and cannot move beyond them into invisible areas.

### P1 Swallowing and Growth

- Each object has a size tier. Small objects are easier for the initial hole to swallow, while large objects require the hole to grow before they can be swallowed.
- When the hole approaches an object, the object should have a visible reaction: from farther away it may be attracted and move toward the hole, while at very close range it may flee or jitter, increasing the sense of pursuit.
- An object starts falling into the hole only when the hole is large enough and the object's center enters the hole's swallowing range; oversized objects cannot be swallowed directly by a small hole.
- An object being swallowed should provide falling feedback by moving toward the center of the hole, shrinking, rotating, or fading out; after it finishes falling, it disappears from the scene.
- Each completed object swallow increases the collection progress and the hole's target size; growth should be smooth and visibly communicated, and the size must not exceed the limit configured for the level.
- The total object count is conserved: the number of unconsumed objects, the number of objects currently falling, and the number consumed must sum to the total at the start of the level.

### P1 Levels, Outcomes, and States

- Each level starts a countdown from a fixed time, and the time continuously decreases after entering the playable state.
- If all objects are swallowed before the countdown reaches zero, the game enters the complete state, displays completion results and time/performance information, and provides an action to enter the next level.
- If the countdown reaches zero while objects remain unswallowed, the game enters the failed state, displays the number collected, and provides a retry entry point.
- The complete or failed state prevents the main gameplay from continuing to advance; after the player clicks continue/retry, the game re-enters the playable state.
- The next level increments the level number, rotates the theme, and generates more objects; retrying a failed level keeps the same level objective.

### P2 Themes, Audio, and Editing Depth

- Level themes rotate and include at least different object sets or equivalent theme groups such as fruit, toys, vegetables, picnic, pets, candy, beach, and forest; theme changes should be reflected in level information, the background, or object appearances.
- The game includes background music and sound-effect feedback for swallowing/growth/completion and provides music and sound-effect toggles. After music or sound effects are turned off, the corresponding button state should change and prevent the corresponding sound from continuing to play or being triggered.
- Edit mode is a P2 depth feature: it allows opening a bottom editing panel, adjusting the theme, object count, initial hole size, maximum growth multiplier, and time limit, randomly generating, clearing, and adding objects, and entering playtest mode from edited content. If the generation task chooses to cut edit mode, it must explicitly declare it as a P2 cut and retain the main gameplay, level progression, and audio toggles.

## State Requirements

- `intro/menu`: The opening or start screen is visible, the game area is blocked, and the playable state is entered after the player clicks start.
- `playing`: The countdown runs, the hole can move, objects can flee/be attracted/fall in, and the HUD is synchronized with the actual state.
- `complete`: All objects have been consumed, the completion panel is displayed, main input no longer increases progress, and the continue button enters the next level.
- `failed`: The countdown is exhausted, the failure panel is displayed, main input no longer increases progress, and the retry button restarts the current level.
- `edit`: A P2 state in which the editing panel can be shown/hidden, editing actions update the level configuration, and the player can return to playtesting.

## Completion Criteria

- The player can enter the main scene from the opening and control the hole with a real mouse, touch, or keyboard.
- The hole's movement direction is consistent with the screen direction; opposite-direction inputs produce opposite screen displacement.
- At least one complete core path is playable: move the hole near an object, trigger the object's reaction, swallow the object, increase progress, and enlarge the hole.
- Clearing a level enters the complete state and allows entry to the next level; running out of time enters the failed state and allows a retry.
- The HUD, result panel, and main-scene visuals should remain consistent.

---

## GDD / Design Doc (merged from design-doc.md)

# Garden Gulp Design Doc

## MDA

### Mechanics

M1: Startup and UI flow. The player enters the game from the opening overlay, and the HUD displays the level, progress, and countdown; the complete/failed overlay provides continue or retry.

M2: Screen-space movement. The hole responds to mouse, touch, arrow keys, and WASD, moving in the screen direction seen by the player and remaining within the playfield.

M3: Object reactions. Based on their distance from the hole, objects remain still, are attracted, flee, bounce off boundaries, or avoid overlap, creating a sense of pursuit.

M4: Swallowing determination and falling feedback. Hole size and distance jointly determine whether an object can be swallowed; after being swallowed, the object falls toward the center of the hole and disappears.

M5: Growth, progress, and conservation. Swallowing increases progress and makes the hole grow; the total number of objects is conserved across unconsumed, falling, and consumed states.

M6: Countdown, completion, and failure. The countdown drives risk; clearing all objects completes the level, while timing out causes failure.

M7: Level progression. After completion, the game enters the next level, the number increases, the theme rotates, and the object count increases; after failure, the current level is retried.

M8: Audio toggles. Background music and sound effects can be toggled independently, and button states provide feedback on the toggle results.

M9: Edit mode. A P2 depth feature that allows adjusting the theme, object count, hole size, growth multiplier, and time limit, adding/clearing/randomly generating objects, and playtesting.

### Dynamics

The player first moves the hole to chase small objects, accumulates size by swallowing them, and then turns to larger objects. Close-range fleeing and mid-range attraction create slight uncertainty, requiring the player to keep adjusting the movement direction. The countdown adds pressure to the swallowing order and movement efficiency, while higher object counts and theme changes after level completion provide ongoing goals.

### Aesthetics

The overall feel should be relaxed, bright, and highly satisfying. The hole's depth, rotation, growth, and the objects' falling animations are the main sources of satisfaction; the HUD should be clear without obscuring the main scene. Failure feedback is clear but not punitive, and retrying is quick.

## Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Startup and UI flow | P1 | Click/touch the start entry point | The opening overlay no longer blocks, the game enters a playable state, and the main scene is interactive | If the blocking overlay still covers the playfield, subsequent real input cannot move the hole |
| M2 Screen-space movement | P1 | Hold the right/left arrow key or drag to the right/left side | The hole's visible position moves right/left respectively, and the main scene changes with the input | Left and right directions are reversed; out-of-bounds input must not move the hole outside the playfield |
| M2 Screen-space movement | P1 | Touch or mouse-drag toward the target point | The hole smoothly approaches the target point, and the visible movement direction is consistent with the screen | Updating only invisible state while the hole's visual remains unchanged should fail |
| M3 Object reactions | P2 | The hole approaches but has not yet swallowed an object | The object's position or presentation shows attraction, fleeing, or jittering | Hollow-shell objects that remain still and unresponsive should fail |
| M4 Swallowing determination and falling feedback | P1 | Move the hole over a swallowable small object | The object enters the falling or swallowed state, progress increases, and the number of scene entities decreases | When the hole is not large enough, it cannot directly swallow a large object |
| M5 Growth and progress | P1 | Complete one swallow | The swallowed count increases, the hole size grows, and the HUD synchronizes | The total number of objects is conserved; the same object must not be counted twice |
| M6 Countdown failure | P1 | Wait for the countdown to reach zero in a near-timeout situation | The game enters the failed state, displays a retry entry point, and freezes the main gameplay | Movement after failure cannot increase progress |
| M6 Completion | P1 | Swallow the last object in a situation with one object remaining | The game enters the complete state and displays a continue entry point | Completion cannot occur while objects remain uncleared |
| M7 Level progression | P1 | Click continue after completion | The level number increases, the game returns to a playable state, progress resets, and the new target total is valid | Retrying after failure should not incorrectly increase the level |
| M7 Failure retry | P1 | Click retry after failure | The current level restarts, progress resets, and the level number does not increase | Residual failed-state data must not affect the retried level |
| M8 Audio toggles | P2 | Click the music/sound-effect toggle | The audio toggle state and button feedback change | The toggle should not change level progress or the total number of objects |
| M9 Edit mode | P2 | Open the editing panel and adjust valid parameters | The editing panel is visible, and the level configuration and HUD/scene update | Invalid parameters are rejected; an empty playtest must not be judged complete immediately |

## Feature Priority

- P0: Stable page startup, non-empty main scene, and readable basic HUD.
- P1: Start entry, directional movement, touch/mouse dragging, swallowing and growth, progress, countdown, completion/failure, and retry/continue.
- P2: Theme rotation, audio toggles, edit mode, depth of object reactions, and richer animations.

## Interaction and Feedback Constraints

- Screen direction is the standard by which the player judges whether movement is correct; the hole's visible position needs to be judged consistently by the player and external observation.
- The main scene must be readable and non-empty; the visuals or HUD must change after core input.
- The HUD is not merely decorative: level, progress, and countdown must be synchronized with game state.
- Dialogs and panels must clearly block or release the main scene; no blocking overlay may cover the main scene in the playable state.
