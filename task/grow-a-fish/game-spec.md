# Grow a Fish Game Spec

## Requirements Overview

This is a 2D underwater predation and growth game. The player starts as a small fish and swims through multiple underwater levels, eating smaller fish to grow while avoiding larger, dangerous fish. Each level has a target size, starting size, number of lives, fish population composition, and danger intensity; reaching the target size completes the level and unlocks the next one, while running out of lives leads to failure with an option to retry.

## Player Input Semantics

- P1 Desktop input:
  - When the mouse moves to a position on the screen, the player fish should swim smoothly toward that screen position, with its head facing the direction of movement.
  - `W/A/S/D` represent movement up/left/down/right on the screen, respectively; opposite directions must produce opposite displacement on the screen.
- P1 Touch input:
  - When the main playfield is touched or dragged, the player fish should move toward the corresponding point in the water and display touch feedback.
  - When the visible virtual joystick is dragged to the right, the player fish swims toward the right side of the screen; dragging left, up, or down moves it in the corresponding screen direction.
  - The joystick base, joystick knob, or equivalent control should be discoverable during play; while dragged, the control itself should show the drag direction, and it should return to an idle state when released.
- P1 Input priority:
  - Keyboard movement takes precedence over mouse following.
  - When the joystick is active, movement follows the joystick direction.
  - When not in a gameplay state, or while a result or failure overlay is displayed, movement input on the main playfield must not continue changing the playable state.

## Core Gameplay Requirements

### M1 Underwater Main Scene and HUD

- The game must have a readable main water scene showing the player fish, schools of fish, bubble or particle feedback, an underwater background, and the HUD.
- The HUD must at least convey the current level, remaining lives, current size, and growth progress from the starting size to the target size.
- The main scene must not be blank; after gameplay begins, schools of fish or an interactive water area should be observable on screen.

### M2 Player Movement and Camera Follow

- The player fish moves within a horizontally extended level and cannot swim beyond the level boundaries.
- When the player fish is in a large water area, the camera should follow the player's movement, allowing the player to explore a level wider than the viewport.
- Movement should include directional facing and light motion feedback; inputs in different directions should have clear screen-direction semantics.

### M3 Predation and Growth

- The game contains normal fish and dangerous fish across multiple size tiers.
- Each interactive fish should use size, markers, color, or an equivalent method to convey whether it is "currently edible" or "currently dangerous/inedible"; the player should not have to rely solely on trial-and-error collisions to determine this.
- When the player fish touches an edible fish, that fish disappears or is eaten, the player grows, the growth progress and size HUD update in sync, and feeding feedback appears.
- Edibility rule: the player can eat a target fish when the player's size reaches or is close to that fish's size; clearly larger fish cannot be eaten.
- When the player touches a clearly larger fish, it must not be eaten as ordinary prey; if the danger conditions are not met, the player should not gain growth or progress either.
- An eaten fish should be replenished after a short delay within a size range appropriate to the current stage, keeping the level's fish population playable.

### M4 Dangerous Fish and Lives

- Larger fish are dangerous, especially when facing the player and close enough to deal damage; contact from behind, from the side, or at insufficient distance should not count as a valid bite.
- After being bitten by a dangerous fish, the player loses 1 life and receives hit feedback; if lives remain, the player re-enters from a safe position and gains a brief period of invulnerability.
- The respawn process should provide visible feedback, such as entering from a safe position, flashing, a protected state, clearing the area, or screen feedback, so the player understands the current temporary safety.
- Respawning should prevent the player from being immediately hit again by nearby dangerous fish.
- Repeated contact with dangerous fish during invulnerability must not deduct lives continuously.
- When lives fall to 0, the game enters a failure state, stops the core gameplay loop, and displays a retry entry point.

### M5 Fish AI

- Small normal fish may swim horizontally or drift slightly.
- Some fish flee from the player when the player is large enough and nearby.
- Medium fish should cruise or move between target points.
- Large predatory fish should chase the player according to the level's danger intensity when the player is smaller; when not chasing, they may cruise.
- The danger intensity of different levels affects chase distance or chase aggressiveness.

### M6 Levels and Progression

- Include at least 20 level configurations.
- Each level configuration includes: level number or name, water-area dimensions, starting size, target size, number of lives, counts of fish in different size tiers, and danger intensity.
- Later levels should be longer, more dangerous, or have higher target sizes overall.
- Initially, only the first level is unlocked; completing the currently playable level unlocks the next level.
- The start menu must display selectable level entries; locked levels should be visible but cannot be started.

### M7 Level Completion, Star Rating, and Next Level

- Upon reaching the level's target size, gameplay stops immediately and a level-complete overlay is displayed.
- The level-complete overlay shows completion feedback for the level, a star rating or equivalent representation, and an entry point to the next level.
- The star rating is determined by the number of deaths: no deaths earns the highest rating, while a small number of deaths lowers the rating but still permits level completion.
- After completing the final level, display feedback that all levels are complete and allow the player to return to the start or replay.

### M8 Failure and Retry

- After the failure overlay appears, fish collisions, growth, life changes, and movement input should stop.
- Clicking retry should reset the current level: player size, position, lives, fish population, growth progress, and the failure overlay all return to the level's starting state.

### M9 Menu, Level Selection, and Blocking Relationships

- Enter the start menu by default; the menu background may contain underwater decorations or swimming fish.
- Clicking start should enter the first level; clicking an unlocked level should enter the corresponding level.
- After entering gameplay, the start menu must be hidden and must not cover the main playfield or intercept primary input.
- While the level-complete or failure overlay is displayed, it should block input to the main playfield; after it is closed or the next level/retry is entered, the blocking overlay disappears.

### M10 Sound Effects, Music, and Feedback

- Predation, taking damage/failure, reaching a new size tier, and level completion should have sound or strong alternative feedback.
- Background music may play in a loop, and audio may start after the user's first interaction.
- If the runtime environment restricts audio playback, the game must remain playable and retain visual feedback.

## State Requirements

- `menu`: Shows start and level selection, with the HUD hidden or de-emphasized and the main water area not playable.
- `playing`: Shows the HUD and main water area; the player can move, prey, take damage, and grow.
- `respawning`: The player returns to the play area from a safe position, is briefly invulnerable, and cannot immediately die again.
- `levelComplete`: Shows the level-complete overlay, stops gameplay, and allows proceeding to the next level or returning to the menu.
- `gameOver`: Shows the failure overlay, stops gameplay, and allows retrying the current level.
- `edit` or parameter-tuning mode is P2 and may provide adjustment and preview of level/speed/growth/danger parameters, but normal gameplay does not depend on it.

## Scope Trimming

- P2: If audio decoding fails, visual feedback alone may be retained.
- P2: The parameter-tuning/edit panel may be simplified, but it must not affect normal gameplay, levels, predation, or the failure loop.
- P2: Specific background art and fish appearances may be replaced with original designs, but the product requirements that "size is distinguishable, danger is distinguishable, and the underwater scene is readable" must be retained.

## Completion Criteria

- The player can start the game from the menu and use the mouse, keyboard, or touch joystick to control the fish's movement in a visible water area.
- The player can increase size and growth progress by eating small fish, complete the level upon reaching the target size, and unlock the next level.
- The player loses lives upon encountering larger, dangerous fish, fails after running out of lives, and clears old state when retrying.
- Level selection, rejection of locked levels, proceeding to the next level after completion, retry after failure, HUD synchronization, and blocking-overlay relationships can all be observed and operated by the player.

---

## GDD / Design Doc（merged from design-doc.md）

# Grow a Fish Design Doc

## MDA

### Mechanics

- Multi-level 2D underwater scenes: player fish, normal fish, dangerous fish, HUD, menu, level-complete overlay, and failure overlay.
- Player movement: mouse following, WASD, touch/virtual joystick, preserving screen-direction semantics and displaying touch or joystick feedback.
- Predation and growth: fish populations communicate edible/dangerous status through size or markers; edible fish disappear when eaten, the player grows, progress updates in sync, and the fish population is replenished.
- Danger and lives: larger fish deal damage when they bite the player from the front at close range; lives decrease, followed by safe respawning and brief invulnerability, with failure when lives run out.
- Fish behavior: drifting, fleeing, cruising, and chasing, affected by the level's danger intensity.
- Progression: 20 levels, unlocking, target sizes, star ratings, and next levels.

### Dynamics

The player continuously scans the sizes and edible/dangerous indicators of fish in the water, approaches edible fish to grow, and judges the facing direction and distance of large fish to avoid bites. After growing, the player can prey on medium fish that were previously dangerous, with risk and reward increasing as levels progress. Respawn protection after taking damage gives the player a brief recovery window; level completion, failure, and retry form a short-session loop, while level unlocking provides a long-term goal.

### Aesthetics

The target experience is light, bright, and intuitive underwater predation and growth. Fish sizes, edible/dangerous indicators, danger facing, HUD progress, and feeding effects should let the player quickly understand "who can be eaten now, who should be avoided, and how much remains before completing the level."

## GDD Feature Breakdown

### M1 Underwater Main Scene and HUD

Priority: P1

The main view uses a 2D water scene showing the player fish, schools of fish, background, and particle or bubble feedback. The HUD shows the level, lives, size, and growth progress. The HUD must update in sync after state changes.

### M2 Player Movement and Camera

Priority: P1

The player can move using mouse following, WASD, or a touch joystick. Left, right, up, and down inputs must correspond to the respective screen directions, and dragging the joystick must provide corresponding visible control feedback. The player cannot leave the level boundaries, and the camera follows the player while exploring a larger water area.

### M3 Predation and Growth Loop

Priority: P1

When the player touches an edible fish, feeding feedback is triggered, the fish is removed from the world, and the player's size and growth progress increase. Fish are replenished after a delay to maintain level density. When undersized, the player cannot eat larger fish; even when touched, a clearly larger fish must not give the player growth or progress.

### M4 Dangerous Fish, Damage, and Respawning

Priority: P1

When a larger fish attacks the player from the front and close enough, the player loses a life; contact from behind, from the side, or at insufficient distance should not count as a valid bite. If lives remain, a visible respawn process begins with brief invulnerability, during which repeated dangerous contact must not deduct lives continuously; when lives are exhausted, the failure overlay appears and gameplay stops.

### M5 Fish AI and Danger Intensity

Priority: P1

Fish are not static obstacles: small fish drift, some fish flee from a large player, medium fish cruise, and large predatory fish chase while the player is smaller. Level danger intensity changes the chase pressure.

### M6 Level Selection and Unlocking

Priority: P1

The menu displays level selection, with only the first level playable initially. Completing a level unlocks the next one. Locked levels are visible but rejected and should not start gameplay.

### M7 Level Completion, Star Rating, and Next Level

Priority: P1

Upon reaching the target size, gameplay stops and the level-complete overlay is displayed, providing a star rating or equivalent completion feedback. The next-level entry enters a new level, and completing the final level provides feedback that all levels are complete.

### M8 Failure and Retry

Priority: P1

When lives are exhausted, the failure overlay is displayed and blocks the main playfield. Retrying the current level resets the player, lives, fish population, growth, and HUD.

### M9 Menu/Overlay Blocking

Priority: P1

The start menu, level-complete overlay, and failure overlay must be shown/hidden correctly. After entering playing, the start overlay must not cover or intercept the main playfield; while the result/failure overlay is displayed, it must block primary input.

### M10 Audio and Visual Feedback

Priority: P2

Predation, reaching a growth tier, taking damage, and level completion provide sound effects or alternative visual feedback. Background music may loop, but unavailable audio must not block the game.

### M11 Parameter-Tuning/Edit Preview

Priority: P2

A parameter-tuning entry may be provided to adjust unlocking, speed, growth, danger, and the targets and lives of the first few levels, and to display a preview. The normal player path need not depend on this mode.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---:|---|---|---|
| M1 Main Scene and HUD | P1 | Start a level from the menu | The view is non-blank, and the HUD shows level/lives/size/progress | Blank scene; HUD does not change with state |
| M2 Screen-Direction Movement | P1 | Press A/D/W/S or drag the joystick | The player's screen position changes in the corresponding direction, joystick/touch feedback updates in sync, and the camera moves with the player | Left/right or up/down directions are the same or reversed; out of bounds |
| M3 Predation and Growth | P1 | Move to and touch a fish with an edible indicator | Fish count changes, size and progress increase, and feeding feedback appears | A larger fish is eaten despite insufficient size; progress does not change; edible/dangerous indicators are missing |
| M4 Danger Damage | P1 | Touch the close-range frontal attack zone of a larger dangerous fish | Lives decrease, and respawn/invulnerability or the failure overlay appears | Contact from behind/the side also deducts lives; negative lives; immediate repeated death after taking damage |
| M5 Fish AI | P1 | Wait near/approach different fish | Fish swim, flee, cruise, or chase | Fish population is completely static; predators pose no threat |
| M6 Level Unlocking | P1 | Return to selection/next level after completing the current level | The next level can be entered, while locked levels remain rejected | A locked level can be started; completion does not unlock the next level |
| M7 Level Completion | P1 | Reach the target size through predation | Gameplay stops, and the level-complete overlay with a star rating/next-level entry appears | Reaching the target does not settle the level; movement continues after settlement |
| M8 Failure Retry | P1 | Click retry after lives are exhausted | The current level resets, the failure overlay is hidden, and lives/progress are restored | Old fish population or old failure state remains after retry |
| M9 Blocking Overlay | P1 | start/level/retry/next operation | The corresponding overlay is shown or hidden, and the main playfield's interactive state is correct | The playing state is still covered by the menu |
| M10 Feedback | P2 | Predation/damage/level completion | Particles, flashes, vibration, sound effects, or equivalent feedback | Only values change, with no visible feedback |
| M11 Parameter-Tuning Preview | P2 | Enter parameter-tuning mode and modify parameters | The preview or parameters affect subsequent levels | Parameter tuning breaks normal gameplay |

## Key Behavior Trajectories

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Start to Playable | M1/M6/M9 | Default menu | Click start or an unlocked level | Enter gameplay state, HUD visible, blocking overlay hidden, main playfield accepts input | Locked levels must not start |
| Directional Movement | M2 | playing | Press D then A; press W then S | Screen x/y directions change oppositely | Player does not cross boundaries |
| Touch Joystick Direction | M2 | playing | Drag the visible joystick right and left | Joystick feedback changes toward the drag direction, and the player's screen position produces opposite horizontal displacement | The joystick returns to idle after release, and the player does not cross boundaries |
| Predation and Growth | M3/M10 | Legal scene containing a fish with an edible indicator | Use real movement or a player-level action to touch the target | Size/progress increases, the target fish count decreases, and feeding feedback appears | Total fish count does not increase without cause beyond replenishment rules; larger fish cannot be eaten as prey |
| Danger Damage | M4/M8 | Legal scene containing a dangerous fish | Move into the dangerous fish's close-range frontal attack zone | Lives decrease or the failure overlay appears | Lives are not negative; contact from behind/the side/at insufficient distance does not deduct lives; repeated collisions during invulnerability do not repeatedly deduct lives |
| Level Completion Unlock | M6/M7 | Close to the target size with an edible fish present | Eat the target fish | Enter level-complete state, unlock the next level, and show the star rating | Movement/predation no longer progresses after reaching the target |
| Retry Cleanup | M8/M9 | Failure state | Click retry | Return to gameplay state, with lives and progress reset | Old failure overlay does not block |
