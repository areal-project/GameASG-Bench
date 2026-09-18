# Tadpol.io Gameplay Requirements

## 1. Game Positioning

Tadpol.io is a top-down 2D aquatic survival growth game. The player controls a tadpole swimming through a broad river channel, growing by eating food and smaller tadpoles, striving to make continuous progress in the size leaderboard, survival time, kill count, or level objectives while avoiding larger tadpoles, giant predators, boundaries, and obstacles.

The P1 acceptance threshold is: the player can enter the main endless growth game from the menu, complete the full loop of “move to find food -> eat food and grow larger -> chase edible targets or flee threats -> receive feedback and respawn after being eaten by a larger target,” and see progress feedback such as the leaderboard/time/kill count. Growth levels, settings, seasons/fog, giant predators, and auxiliary displays are extended-depth features, but if present, they must produce genuinely visible effects.

## 2. Core Player Objectives

- Survive as long as possible and grow as large as possible in endless mode, improving the player's position in the size ranking.
- Grow steadily by eating food, and gain substantial growth and kills by eating smaller opponents.
- Avoid being eaten by larger opponents or high-risk predators; after death, re-enter the situation in a new, weak state.
- Complete level objectives in growth levels, including surviving for a specified duration, reaching a specified size, and defeating a specified number of tadpoles, and unlock subsequent levels.

## 3. Control Feel and Input Semantics

### 3.1 Movement

The player's tadpole moves through the river channel from a camera-following top-down view. While a direction is continuously input, the tadpole's head, body orientation, and screen position continuously advance in that direction; after input stops, the tadpole should clearly stop actively swimming or retain only a very brief sense of inertia, and should not continue drifting indefinitely. Opposite directional inputs must produce opposite screen-motion trends; for example, moving left makes the character advance toward the left side of the screen, while moving right makes the character advance toward the right side of the screen.

Desktop supports the arrow keys or WASD as discrete directional input, as well as mouse-directed movement: when the player moves the pointer to water beyond the immediate vicinity of the character, the tadpole swims toward the pointer's world position. Keyboard directional input takes priority over mouse targeting to prevent the two control sources from competing for direction at the same time.

Touchscreens support a virtual joystick. When the player presses and drags the joystick, the drag direction is the tadpole's swimming direction; the farther the drag, the closer it gets to full speed, and movement input returns to zero when it returns to the dead zone or is released. The joystick must have a visible base/joystick feedback so the player can understand the current input direction.

### 3.2 Boost

The player can hold boost while a movement direction already exists. Boost must make the tadpole swim noticeably faster, make its tail undulate more rapidly, and produce bubbles or equivalent acceleration feedback. The benefit of boosting is rapidly pursuing food/small targets, escaping large threats, or crossing dangerous areas; the cost is continuous size consumption, and effective boosting cannot continue when size is too small. After boost is released, speed falls back to normal swimming speed and size consumption stops.

Boost cannot become a cost-free state when there is no movement direction; it cannot merely light up a button without changing speed, size, or visual feedback. When reversing movement while boosting, the tadpole should accelerate in the new direction instead of drifting along the old direction.

### 3.3 Collision and Risk Coupling

River boundaries limit the movement area. After hitting a boundary, the character should remain within the playable area and show a visible tendency to stop, remain against the edge, or rebound, and must not pass out of the arena. Obstacles alter swimming routes: floating plants can be pushed aside and gradually come to a stop; hard and wooden obstacles bounce the tadpole away or block it. The player needs to navigate around obstacles while pursuing food or escaping, and collisions cannot be merely decorative.

## 4. Core Loop

1. Enter the main game from the menu; the player appears near the center of the river channel at a relatively small size and briefly enters a safe respawn state.
2. The player moves to find food. Food is distributed throughout the arena; some food is stationary, while some worm-like food swims slowly.
3. After contacting edible food, the food disappears or enters a state of waiting to reappear, the character grows larger, and an eating sound, particles, or equivalent feedback appears.
4. When the player is noticeably larger than a tadpole, contacting that target allows the player to eat it, gaining its size benefit and increasing the kill count, while the eaten target respawns.
5. When a larger opponent contacts the player while the player is not in the protection period, the player dies, eaten feedback is displayed, and after the score is submitted/recorded, the player respawns at the initial small size.
6. Size growth increases offensive opportunities, but also makes the player more likely to attract the attention of powerful enemies; boost acceleration can address short-term pursuit and escape, but consumes the gains from growth.

## 5. World Entities and Visible Feedback

- Player tadpole: Must have a clear body, tail, orientation, and name or size marker; after growth, its size visibly increases.
- Food: Must include at least multiple kinds of algae or equivalent edible items with different values/sizes; worm-like food should have a sense of slow movement and undulation.
- AI tadpoles: Continuously active within the river channel, able to seek food, pursue smaller targets, and flee larger targets. They must be visible to the player, participate in collisions, and participate in rankings.
- Background life: Distant tadpoles or silhouettes that do not participate in the core rules may be present to make the water feel more alive; this is a P2 atmosphere enhancement.
- Obstacles: Floating plants, rocks, branches, or equivalent aquatic obstacles must be visible in the scene and produce different blocking/pushing effects on movement.
- Particles/sound effects: Eating, boosting, and death should have immediate feedback. When audio is unavailable, visual feedback must still be sufficient to communicate the event.
- Camera: Follows the player's position so the player can always clearly see themselves, nearby food, threats, and boundaries. The camera cannot reverse or mirror player input.

## 6. AI and Ecosystem

P1 requires opponents that move, grow, and hunt/flee. AI should move away when it encounters a larger threat, pursue an edible target when one is detected, move toward nearby food, and wander when it lacks a target. AI can also eat food and one another, thereby changing the leaderboard and the situation.

P2 can present a richer ecosystem: similarly sized AI briefly forage together and may betray one another after cooperating for a period of time; an extremely large unit appearing attracts a giant predator; background tadpoles swim in the distance without interfering with the core rules. If these depth features are not implemented for now, they must explicitly be treated as P2 and must not affect the P1 core loop.

## 7. Growth, Scoring, and Leaderboard

The player's primary numerical progress consists of size, survival time, kills, and rank. Size comes from eating food or tadpoles; boosting consumes size, but should not reduce it so far that it undermines basic playability after respawning. The leaderboard compares the player and AI by size, must update periodically, and highlights the player's own position.

Endless mode has no fixed victory endpoint; the goal is to continue growing and improve the score. Death is not the end of the entire game, but a respawn with feedback; respawning clears the current run's size, time, and kills, and grants brief protection so the player has a chance to start again.

If a persistent leaderboard is supported, displaying the highest size or an equivalent score is sufficient. Online leaderboards, account rankings, and remote submission are P2; an offline version can use a local best score instead.

## 8. Growth Level Mode

Growth levels are a P1.5/P2 depth mode, but if an entry point exists, they must be completable. The level selection screen shows unlocked, completed, and locked states; locked levels cannot be entered and should provide clear rejection feedback or appear unclickable.

After entering a level, the arena size, food density, and AI count may vary with difficulty. The level HUD should show the current objective and progress. After the objective is completed, the game pauses and displays the completion result, allowing a retry, entry into the next level, or a return to the menu; completing the current level saves progress and unlocks the next level.

Growth levels should cover at least three types of objectives: survive until a specified time, grow to a specified size, and defeat a specified number of opponents. If only endless mode is implemented, growth levels must be identified as cut scope; if a growth entry point is implemented but completable objectives are not, it is not acceptable.

## 9. Menu, Pause, and Settings

The main menu provides paths to enter endless mode, enter growth levels, open settings, and view scores. After the game starts, the menu overlay must close and the player can directly interact with the scene; no residual panel that blocks play may remain.

The pause entry point is available during play. After pausing, world time, character movement, AI, food reappearance, season/fog countdowns, and similar elements should stop progressing; after resuming, the game continues from its state at the time of pausing. The pause menu allows returning to the main menu; starting again after returning should produce a clean new game or a clearly defined mode state.

Settings can switch the auxiliary display in the upper-right corner among the leaderboard, minimap, or hidden auxiliary display. The minimap should show approximate positions for the player, AI, and food concentration information; hidden mode should clear the corresponding panel without affecting core gameplay. Festive appearance is P2 decoration and may change the menu atmosphere, character decorations, or food colors, but cannot change the core rules.

## 10. Environmental Changes and High-Risk Events

Day/night or water-color changes may serve as continuous atmospheric feedback. The season system is P2, but if enabled, it should affect trends in swimming speed or food scarcity that the player can observe, and the HUD should indicate the current season. Seasons should not silently change the rules; the player must be able to perceive them through movement feel, food distribution, or panel feedback.

Danger fog is a P2 high-pressure event: when it appears periodically or randomly, the river channel darkens, a visible ring of fog appears around the player, food becomes scarcer, and some creatures become faster or more aggressive. The environment returns to normal after the fog ends. Danger fog should not suddenly kill the player without warning; instead, it should increase risk through visibility, speed, food, and predation pressure.

The giant predator is a P2 late-game risk: when the player or another tadpole reaches an extreme size, a larger fish threat appears and hunts enormous targets. It must be visible, move, be able to eat qualifying enormous targets, and leave or stop applying pressure when no target exists.

## 11. State Flow

- Menu: Displays the title, mode entry points, settings, and score entry point; the scene background may move, but cannot advance a formal run.
- Level select: Displays level cards, unlocked/completed states, and a return entry point; growth levels can be entered only from here.
- Playing: The player, AI, food, obstacles, HUD, and camera all operate.
- Paused: An overlay blocks gameplay input and world updates are frozen; the player can resume, access settings, view scores, or return to the menu.
- Death/respawn feedback: After the player is eaten, failure feedback appears briefly, and the player then respawns in the initial state.
- Level complete: Displays the completion result and freezes the current level; the player can retry, proceed to the next level, or return to the menu.

Illegal state transitions must be rejected or leave the state unchanged: locked levels cannot be entered; movement or eating cannot continue while paused; objective progress cannot continue accumulating after level completion; the scene cannot be controlled while the menu is open; and settlement should not be repeated multiple times during death feedback.

## 12. Victory, Defeat, and Restarting

Endless mode has no traditional victory; the player gains a sense of progress through larger size, longer survival, higher rank, and more kills. Failure means being eaten by a larger enemy or giant predator, resulting in displayed feedback, a recorded score, and respawning.

Growth levels have explicit victory conditions: achieving the level objective completes the level, saves its completed state, and unlocks subsequent levels. Failure in a growth level may use the same death and respawn as endless mode, or may reset the current level, but it must provide clear feedback and cannot silently treat failure as completion.

After restarting or returning to the menu, temporary state from the old game cannot leak into the new game: player size, kills, survival time, protection period, scene entities, and pause overlay should all return to the initial state for the corresponding mode. Completed levels and best scores may be retained.

## 13. Cut Scope and Priorities

P1 must include: entering endless mode from the menu, genuine directional movement, the cost and benefit of boosting, growth from food, size-based eating/being eaten, death and respawn, leaderboard/survival/kill HUD, AI activity, basic obstacle collisions, and pause/resume/return to menu.

Optional P2 enhancements include: the complete growth-level unlock chain, minimap/display-mode switching, festive appearance, local or online scoreboards, seasons, danger fog, giant predators, AI cooperation/betrayal, background creatures, audio details, and a creator-facing tuning panel.

Cut scope: multiplayer networking, account systems, remote leaderboard services, creator-facing tuning tools, external platform parameter panels, any specified icon or audio resource, fixed copy, and fixed art assets are not core delivery requirements. Equivalent visual, audio, and UI presentation may be used to express the same player-visible results.

---

## GDD / Design Doc (merged from design-doc.md)

# Tadpol.io Design Doc

## 1. Design Intent

Tadpol.io is a top-down 2D river survival growth game. The player begins as a small tadpole, swims through a broad water arena, eats food and smaller tadpoles to grow, and avoids larger rivals and environmental hazards. The experience should feel light, readable, and tense: every movement decision can shift between hunting, escaping, conserving size, or taking a risky boost.

The P1 playable identity is an endless growth loop: enter play from the menu, move with correct screen-direction control, eat food to visibly grow, use boost with a real size cost, interact with AI tadpoles through size-based predator/prey rules, die when eaten by larger threats, receive feedback, and restart from a protected small state while progress HUDs continue to explain the run.

## 2. MDA Summary

### Mechanics

- Top-down player movement by keyboard, mouse direction, or touch joystick.
- Boost while moving, with higher speed, stronger swim feedback, and ongoing size cost.
- Food collection, including multiple food values and slow-moving worm-like food.
- Size-based consumption between player and AI tadpoles.
- AI tadpoles that move, seek food, chase smaller targets, flee larger threats, grow, respawn, and affect ranking.
- River borders and obstacles that constrain, block, push, or redirect movement.
- Endless-mode HUD for size/rank context, survival time, kills, and player-relative standing.
- Death feedback, score recording where available, and respawn with temporary protection.
- Menu, growth-mode selection, pause/resume, settings, auxiliary display modes, and results panels.
- Optional depth: growth levels, minimap, festive presentation, local/online-like best scores, seasonal changes, danger fog, giant predator, AI cooperation/betrayal, background life, and audio polish.

### Dynamics

- The player scans for nearby food and small prey while watching for larger rivals.
- Growth increases offensive opportunity but also changes the local threat profile.
- Boost creates a tradeoff: it improves pursuit and escape in the short term while spending accumulated size.
- Obstacles turn straight-line pursuit into route planning, especially under chase pressure.
- AI movement creates a living ecosystem where food and ranking shift without player action.
- Death is not a final stop in endless mode; it resets the run and pushes the player back into the weak-to-strong arc.
- In growth mode, the same swimming and eating verbs are aimed at explicit objectives.

### Aesthetics

- Survival pressure: larger bodies nearby should feel dangerous before contact.
- Growth satisfaction: eating should immediately read as body expansion, score/rank improvement, or stronger hunt potential.
- Fluidity: movement, tail motion, camera follow, boost bubbles, and food/AI motion should make the water feel active.
- Fairness: threats, protection, collision, and objective progress must be visible enough for players to understand outcomes.
- Replayability: short runs, leaderboard feedback, and optional level goals encourage another attempt.

## 3. M-Feature List

| ID | Feature | Priority | Player-facing requirement |
|---|---|---:|---|
| M1 | Entry and state shell | P1 | The player can move from menu to endless play, pause/resume, return to menu, and start a clean new run without blocking overlays left on the playfield. |
| M2 | Directional swimming | P1 | Sustained left/right/up/down, mouse direction, or joystick input moves the tadpole in the corresponding visible screen direction; release stops active swimming or leaves only brief inertia. |
| M3 | Boost tradeoff | P1 | Boost only matters while a movement direction exists; it increases visible speed and swim feedback, consumes size over time, and ends cleanly on release or when too small. |
| M4 | Food growth | P1 | Food exists in the arena, can be collected by contact, disappears or waits before returning, and immediately increases visible player size with clear feedback. |
| M5 | Predator/prey tadpole combat | P1 | Contact with sufficiently smaller tadpoles lets the player eat them for growth and kills; contact with larger threats after protection kills the player. |
| M6 | AI ecosystem | P1 | Rival tadpoles are visible, move continuously, eat food and each other, chase or flee based on size, respawn after being eaten, and participate in rank pressure. |
| M7 | Boundaries and obstacles | P1 | Borders keep the player inside the river; soft obstacles can be pushed, and hard obstacles block or bounce movement so collision changes route and risk. |
| M8 | HUD and progress feedback | P1 | The play screen shows run progress such as survival time, kills, size/rank standing, and the player's position in the current ecosystem. |
| M9 | Death, feedback, and respawn | P1 | Being eaten shows failure feedback, records available best-score context, resets run size/time/kills, and respawns the player with temporary protection. |
| M10 | Growth level mode | P2 | Level select, locked/unlocked/completed states, objective HUD, completion result, retry, next-level, and saved progression support survival, size, and kill objectives. |
| M11 | Auxiliary display and settings | P2 | Settings can switch the right-side helper between leaderboard, minimap, or blank display; decorative settings affect presentation without changing core rules. |
| M12 | Environmental pressure | P2 | Seasons, day/night, danger fog, and giant predator events are visible and alter movement pressure, food availability, visibility, or late-game threat without silent rule changes. |
| M13 | Ecosystem depth and atmosphere | P2 | AI cooperation/betrayal, background tadpoles, audio, particles, and celebratory/menu effects add life and feedback while remaining secondary to the P1 loop. |

## 4. P1 Core Loop As Executable Trajectory

### Endless Growth Loop

1. **Start/reset:** From the menu, the player starts endless mode. The playfield appears without a blocking menu, the player spawns small near a safe starting area, AI tadpoles, food, obstacles, borders, camera follow, and HUD become active. Respawn or new run resets size, survival time, kills, movement input, protection state, and temporary event feedback.
2. **Player input:** The player holds a direction by keyboard, mouse targeting, or touch joystick. The tadpole's body and head orient toward that direction and its screen position advances consistently with the input. If the player reverses direction, the visible motion trend reverses. If the player releases input, active propulsion stops or quickly settles.
3. **Continuous state change:** While swimming, camera follow keeps the player readable; the world continues updating with moving AI, food, obstacle interactions, timers, and HUD. Holding boost during movement increases speed and tail/bubble or equivalent feedback while size decreases over time. Releasing boost returns to normal speed and stops the size drain.
4. **Goal/risk:** The immediate goal is to reach edible food or smaller tadpoles before larger threats reach the player. The risks are overextending into bigger opponents, spending too much size on boost, being redirected by obstacles, hitting borders, or entering high-pressure environmental events.
5. **Reward/failure:** Contact with food produces eat feedback and visible growth. Contact with a sufficiently smaller tadpole grants larger growth and increases kill progress while the eaten target respawns. Contact with a larger predator after protection produces death feedback and submits or records the run result where available.
6. **Progress/reopen:** Growth improves rank, threat reach, and hunt potential; survival time and kills continue updating. After death, the player returns to a small protected state and can immediately repeat the weak-to-strong arc. Returning to menu and starting again gives a clean run while persistent best/progression data may remain.

### Growth Level Loop

1. **Start/reset:** The player opens growth mode, selects an unlocked level, and enters a tailored river setup with an objective HUD.
2. **Player input:** The same movement, boost, eating, chase, and escape verbs apply.
3. **Continuous state change:** Objective progress changes through survival time, reached size, or kill count while AI, food, obstacles, and hazards continue to operate.
4. **Goal/risk:** The goal is the level objective; the risks are death, wasted boost size, and route pressure from rivals and obstacles.
5. **Reward/failure:** Completing the objective pauses the level and shows a completion result. Death must be clearly treated as failure/retry or a reset within the level, not as silent completion.
6. **Progress/reopen:** Completion saves the level state, unlocks the next level where applicable, and offers retry, next level, or menu return.

## 5. Control Feel Requirements

- Directional movement is screen-consistent. Left and right inputs must not be mirrored by camera, projection, or coordinate conversion.
- Keyboard movement takes priority over mouse targeting when both are active, so the player can intentionally override pointer drift.
- Touch joystick drag direction is the swimming direction. Drag distance controls strength up to full movement, and returning to center or releasing clears movement input.
- Boost is not a cosmetic toggle. It requires movement, increases speed, adds visible acceleration feedback, costs size continuously, and stops costing size on release.
- Boundaries and obstacles are part of navigation. A player trying to cut through them must visibly stop, slide, push, or bounce instead of passing through.
- Death and eating are caused by contact plus size relationship; feedback must connect the collision to the outcome.

## 6. Gameplay Systems

### Player and Growth

The player tadpole needs a readable body, tail, facing direction, size, and identity/size context. Size growth must be visible on the character and reflected in ranking/progress. The minimum post-respawn state must remain playable, and boost cost cannot shrink the player below a functional threshold.

### Food

Food should be distributed throughout the arena with varied value/size. Static food supports predictable growth paths; moving worm-like food adds light pursuit. Food collection must have visible disappearance, feedback, and eventual replenishment or replacement.

### AI Tadpoles

AI tadpoles are not background decoration in P1. They need visible movement, size, collision, and behavior states that make them seek food, chase prey, flee threats, and wander when no target is relevant. They should grow through the same food/prey logic enough to keep the leaderboard and threat landscape dynamic.

### Obstacles and Arena

The river must have visible boundaries and obstacles. Soft floating obstacles may shift when contacted; harder obstacles should block or bounce tadpoles. These interactions create route choices and must affect both player and AI movement enough to be noticeable.

### HUD and Feedback

HUD feedback must cover survival time, kills, rank/position or equivalent ecosystem standing, and mode-specific objective progress. Eating, boost, death, level completion, pause, and invalid mode actions should all have visible feedback. Audio can reinforce events but cannot be the only evidence of a critical outcome.

## 7. State Flow

| State | Purpose | Required transitions and invariants |
|---|---|---|
| Menu | Entry, settings, score/progression access, mode selection | Starting endless mode hides the menu and enables play. Opening settings or scores must not start the world. |
| Level select | Growth-mode level choice | Unlocked levels can start; locked levels are visibly unavailable or rejected; back returns to menu. |
| Playing | Main simulation | Player, AI, food, obstacles, camera, HUD, collision, and timers update unless paused or terminal. |
| Paused | Temporary stop | World updates and playfield input stop; resume continues from the same state; return to menu clears transient run state. |
| Death/respawn feedback | Endless-mode failure handoff | Failure feedback appears once, run score is recorded where available, and player respawns small with protection. |
| Level complete | Growth-mode success | Simulation freezes, completion is saved, next level may unlock, and retry/next/menu choices are available. |

Illegal transitions must be rejected or leave state unchanged: controlling from menu, moving while paused, entering locked levels, accumulating level objectives after completion, repeated death scoring from the same collision, and keeping old overlays on top of the playfield.

## 8. Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---:|---|---|---|
| M1 Entry and state shell | P1 | Click/tap endless start, pause, resume, return to menu | Playfield becomes interactive, overlays hide/show appropriately, new run is clean | Menu/pause overlay cannot block playing; menu state cannot accept playfield control |
| M2 Directional swimming | P1 | Hold keyboard direction, move pointer toward water, or drag joystick | Player body, facing, and screen position move in the intended direction; release stops active propulsion | Opposite directions must produce opposite visible trends; camera cannot mirror direction |
| M3 Boost tradeoff | P1 | Hold boost while moving, then release | Speed and swim feedback increase; size decreases during boost; speed/cost stop after release | Boost without movement or with too-small size cannot provide free speed |
| M4 Food growth | P1 | Swim into visible food | Food is consumed, feedback appears, player size grows, HUD/rank can update | Food cannot be collected through non-contact; collected food should not immediately double-count |
| M5 Predator/prey tadpole combat | P1 | Contact smaller or larger tadpole after protection conditions | Smaller target is eaten, player grows and kill count rises; larger predator kills player | Size relationship and protection gate the outcome; same collision cannot both reward and kill |
| M6 AI ecosystem | P1 | Let world run, approach AI, or lure AI near food/prey/threats | AI moves, seeks, flees/chases, eats, respawns, and affects ranking | Static decorative rivals are insufficient; AI must remain inside arena and obey size rules |
| M7 Boundaries and obstacles | P1 | Swim into border, soft obstacle, or hard obstacle | Player stays in arena; obstacle pushes or player blocks/bounces; route changes visibly | No pass-through outside arena; collision cannot be purely decorative |
| M8 HUD and progress feedback | P1 | Play over time, eat food/prey, die/respawn | Survival, kills, rank/position, size context, and mode progress update | HUD cannot remain stale after gameplay changes; hidden helper mode must not break core play |
| M9 Death, feedback, and respawn | P1 | Larger predator contacts player after protection | Failure feedback appears, run resets to small protected player, progress starts over | Death must not silently continue old size/kills/time; protection prevents immediate repeat death |
| M10 Growth level mode | P2 | Select unlocked level and complete objective | Objective HUD progresses, completion freezes play, saves progress, unlocks next available level | Locked levels cannot start; completion cannot be awarded without objective progress |
| M11 Auxiliary display and settings | P2 | Open settings and switch helper display or decoration | Leaderboard/minimap/blank helper changes visibly; decoration changes presentation only | Settings must not mutate core rules unless explicitly part of the selected system |
| M12 Environmental pressure | P2 | Let season/fog/predator conditions occur | Environment changes are visible and affect speed, food scarcity, visibility, or late threat | Environmental changes cannot silently alter outcomes without HUD/visual feedback |
| M13 Ecosystem depth and atmosphere | P2 | Observe longer run or optional presentation toggles | Background life, cooperation/betrayal, particles, audio, and menu effects enrich the scene | Atmosphere cannot replace P1 AI, food, collision, or death mechanics |

## 9. Mechanism Coverage Matrix

| Mechanism | M-features | Priority | Required player-visible coverage |
|---|---|---:|---|
| Menu and overlays | M1, M11 | P1/P2 | Start, pause, resume, settings, score/progression panels, and return paths do not leave stale blocking UI. |
| Continuous movement physics | M2, M3, M7 | P1 | Held input changes position and facing; release/boost/counter-direction change motion trend; collisions constrain movement. |
| Growth economy | M4, M5, M8, M9 | P1 | Food and prey increase size; boost spends size; death resets temporary progress; HUD communicates the current run. |
| Predator/prey risk | M5, M6, M9 | P1 | Size comparison determines eating versus being eaten; protection and respawn make failure fair and recoverable. |
| Living ecosystem | M6, M8, M13 | P1/P2 | AI motion and growth alter ranking and local danger; optional cooperation/background life adds depth without replacing AI. |
| Objective progression | M10 | P2 | Growth levels expose goals, progress, completion, retry, next-level unlock, and saved completion. |
| Environment and events | M12 | P2 | Seasons, fog, and giant predator are announced or visible, change play pressure, and restore/resolve coherently. |
| Feedback layer | M3, M4, M8, M9, M10 | P1/P2 | Boost, eating, death, progress, and completion are visible even when audio is unavailable. |

## 10. Priority And Cut Scope

P1 must deliver the recognizable endless tadpole survival game: startable play, correct movement direction, boost with cost and benefit, food growth, predator/prey tadpole collisions, AI activity, obstacle/border interaction, HUD progress, pause/resume/menu flow, death feedback, and respawn.

P2 adds depth and polish: full growth-level progression, minimap/display modes, festive visuals, persistent best scores, seasons, danger fog, giant predator, AI cooperation/betrayal, background life, richer audio, and creator-facing tuning panels.

Explicitly outside the core target are real multiplayer networking, account systems, remote leaderboard service requirements, fixed art assets, exact UI wording, exact audio files, and any specific implementation structure. Equivalent presentation is acceptable when it preserves the player-visible mechanics and state flow above.

## 11. Self Review

- This document expands only the already approved gameplay requirements for this stage.
- No hidden mechanics were added beyond the P1/P2/cut-scope items already described there.
- P1 movement and physics mechanisms preserve the required causality chain: sustained input changes visible motion, release stops active movement, opposite inputs reverse direction, boost has speed benefit and size cost, and collision connects to navigation risk.
- The P1 core loop is expressed as a complete trajectory from start/reset through input, continuous state changes, goal/risk, reward/failure, and progress/respawn.
- The document avoids implementation-specific names, private structures, fixed selectors, fixed assets, and executable-check requirements.
