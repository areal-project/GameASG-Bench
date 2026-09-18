# Slice Rush Gameplay Requirements

## 1. Game Positioning

Slice Rush is a 3D knife-flipping parkour level game. The player controls a knife moving forward along platforms extending into the depth of the scene, tapping or touching to make the knife flip through the air, slice targets along the way, and land on platforms or object surfaces while continuously judging between dangerous hazards, gaps, score requirements, and rhythmic pressure.

The P1 objective is to create a fully playable core loop: enter a game mode, see the 3D scene and knife, start tapping from the starting point to flip the knife, slice sliceable objects to gain score and feedback, land the knife safely to continue forward, fail by hitting a hazard or falling, and after reaching the finish, resolve the run as a victory or retry for not meeting the score requirement. P2 objectives include endless mode, a coin shop, cosmetic unlocks, audio toggles, saved progress, and richer level content.

## 2. Player Input and Control Feel

### 2.1 Core Input Semantics

The player taps or touches a non-menu area in the main scene to start the run or trigger a knife flip. The first valid input transitions from the ready state into the playing state and hides the prompt; subsequent valid inputs give the knife a new forward, upward flipping action, allowing it to continue along the route.

Input is not dragging, aiming, or charging. Holding does not continuously accelerate, and releasing does not change the existing flight trajectory; the rhythm comes from the player's choice of when to tap again, together with the knife's current orientation, position, and the object it is about to contact. Tapping repeatedly too quickly should be subject to a brief rhythm limit and must not become unlimited, cost-free rapid fire; while a pause, result, shop, or level-select overlay is present, tapping the main scene should not continue flipping the knife.

### 2.2 Observable Motion Causal Chain

After a valid knife flip, the knife leaps forward and upward from its current orientation and continues rotating, then gradually descends toward a platform or object under a falling tendency. Tapping again gives the knife renewed forward-upward flipping momentum and rotational rhythm, which the player can use to cross gaps, adjust the landing point, or continue slicing, but bad timing will cause the knife to hit a platform or hazard at an unfavorable angle or fall out of the safe route.

The blade, handle, and back must produce different outcomes: when the blade contacts a platform, it sticks and stops flying, becoming the starting point for the next flip; when the blade contacts a sliceable object, it slices the target and awards points; when the handle makes contact or contact occurs at an unfavorable orientation, the knife bounces, briefly loses control, or transitions into a corrective sticking action, causing rhythm loss and a risk of failure. While in flight, the knife should have a clear trajectory, rotation, and following camera so the player can judge height, forward distance, the next landing point, and hazard positions.

### 2.3 Risk Coupling

Dangerous hazards should be able to trigger failure both while the knife is flying and while the knife is stuck and being carried by a moving platform. Falling below the safe surface of the play area should also cause failure. Moving platforms, moving sliceable objects, and moving hazards change the player's waiting and tapping timing; if the knife is stuck in a moving platform, it should move with that platform and may be carried toward a hazard.

## 3. Core Gameplay Loop

The normal level loop is: choose level mode and enter a level -> tap to start flipping the knife -> slice targets to gain score and feedback -> land the blade on a platform or load-bearing surface to continue forward -> avoid hazards and gaps -> reach the finish -> produce a victory, score-not-met, or failure result according to the score requirement -> continue to the next level, retry, or return to mode selection.

The player mainly pursues two parallel goals: reaching the finish safely and slicing enough targets along the way to meet the level's score requirement. Simply rushing to the finish without enough score does not count as a complete victory; the game should display a score-not-met result and encourage a retry. As more targets are sliced and the goal becomes closer, the score display should update in real time.

## 4. Sliceable Objects, Hazards, and Scene Feedback

Sliceable objects include fruit, food, books, wooden objects, geometric blocks, and other varied shapes. They may appear individually or in chains, stacks, or moving arrangements. After the blade slices one, the object is removed from the scene or split apart, producing fragments, particles, a score popup, and the corresponding slicing sound effect; when continuously slicing stacked targets, the knife should present a satisfying process of cutting through, slowing down, or locking its orientation, rather than merely changing the score.

Dangerous hazards should have clearly distinguishable dangerous appearances and collision feedback. After a collision, flashing or impact feedback should appear, the knife should enter a failure tumble/landing animation, and then the failure result should be displayed. After failure, main-scene input is locked, and the player can recover only through retry, return, or other menu actions.

Platforms are central to the route's rhythm. Platforms can have different heights, lengths, spacing, and appearances; some levels may add upper boundaries, side faces, bottom faces, or moving platforms, allowing the knife to stick into the top, side, or bottom and continue flipping from different faces. Different landing faces affect the direction and risk of the next knife flip, but the knife's position and orientation should always remain readable to the player on screen.

## 5. Level Mode

Level mode contains multiple fixed levels that unlock progressively. Each level consists of a starting platform, several intermediate platforms, sliceable objects, dangerous hazards, and a finish, together with the level's score goal and completion reward. After the player enters a level, the interface should display the current level, current score, target score, coin balance, and pause/shop entry points.

Upon reaching the finish, if the current score meets the level goal, the game should display a victory result, award coins, unlock the next level, and provide paths to enter the next level or replay. If the score is insufficient, it should display a score-not-met result showing the gap between the current score and target, award no full completion reward, unlock no next level, and provide a retry.

The level-select interface should show unlocked and locked levels. Unlocked levels can be entered; locked levels should be visible but not selectable, and tapping locked content must not bypass progression. Tapping the level entry point during play can pause the current scene and enter level selection; canceling or choosing the current level should resume, while choosing another unlocked level should reset to that level's starting point.

## 6. Endless Mode

Endless mode is P2, but if an entry point is provided, the mode must be fully playable. This mode has no fixed finish; it continuously generates the route ahead using the existing platform, sliceable-object, and hazard rhythms while clearing the scene behind. The player's goal is to survive as far and as long as possible while continually slicing to sustain the run.

Endless mode should display a countdown or survival-pressure bar. The timer is consumed only during play, and slicing targets resets or replenishes survival time; time depletion, hitting a hazard, or falling all cause failure. Endless mode should not display a fixed level target score, but should retain the current score and coin entry point. A separate high score or leaderboard may be used for endless mode as P2.

## 7. Menus, Pause, and Mode Flow

After launch, the game should first enter the start screen, where the player can choose level mode or endless mode. Level mode enters the highest level the player has unlocked by default or allows entry into the level-selection flow; endless mode directly enters a continuous route. A progress prompt may appear during loading, but once the main scene is ready, it should not be blocked by the startup overlay.

After pausing during play, physics, the countdown, and player input should stop while the 3D scene remains visible. The pause interface should provide at least resume, retry, switch mode, return to the start screen, and music and sound-effect toggles. Resume restores the original run; retry clears the run's score and fragments and returns to the starting point of the current mode; switching modes resets to a legal starting point for the target mode; returning to the start screen should not retain an old result layer that blocks the main scene.

The result interface has failure, victory, and score-not-met states. Failure provides retry; victory provides replay and next level; score-not-met provides retry. While in a result state, tapping the main scene must not continue moving the knife.

## 8. Shop, Coins, and Cosmetic Progression

Coins and the shop are P2, but if provided, they must form a complete, visible loop. Completion rewards increase the coin count and update its display; the shop can be opened from the gameplay interface, and main-scene actions should be blocked while it is open. The shop is divided into at least three categories: knife, scene, and platform appearances, with each category showing owned, equipped, unowned, and price states.

Selecting an owned item equips it and previews it immediately; selecting an unowned item displays a purchase entry point. When coins are insufficient, the purchase should be rejected with visible feedback while coin and ownership states remain unchanged; when enough coins are available, the coins are deducted, the item is unlocked, equipped or made available to equip, and progress is saved. When the shop closes, any unpurchased temporary preview should revert to the equipped appearance.

Saving progress is P2: unlocked levels, coin balance, audio toggles, and owned/equipped appearances should persist after refreshing or re-entering. If persistence is not implemented, progress must be retained within a single session and declared in the cut scope.

## 9. Feedback and Readability

The main scene must use a readable 3D view, with the camera following the knife forward while keeping the route ahead, the knife's current orientation, the next platform, sliceable objects, and hazards visible. The scene cannot contain only a static background or changing numbers; every knife flip, slice, bounce, stick, failure, and victory must produce on-screen motion or an overlay change.

The score display should increase in real time with slicing, the target score should be visible in level mode, and a clear achieved state should appear after the target is met. The coin display should stay synchronized with rewards and purchases. Sound effects and music are P2, but core actions should at least be communicated through visual feedback and must not depend on sound for the result to be understood.

## 10. Failure, Rejection, and Rule Constraints

While the pause, shop, start, level-select, or result interface is open, tapping the main scene should not propel the knife. After failure or victory, the game state should remain locked except for menu actions such as retry, resume, next level, and return.

Locked levels cannot be entered; purchases cannot be made with insufficient coins; repeatedly selecting an owned item should not deduct coins again; switching modes or retrying must clear old score, fragments, failure animations, and result overlays. After failure in endless mode, the countdown should not continue decreasing, and after a level-mode result, collisions should not continue triggering or additional rewards be added.

## 11. P2 and Cut Scope

Optional P2 enhancements include: endless mode and survival countdown, coin rewards and a cosmetic shop, progress persistence, leaderboards, music/sound-effect toggles, multiple scene themes, multiple knife and platform appearances, more complex combinations of moving objects, and longer level groups.

Cut scope: built-in level editors, tuning panels, debug views, frame-by-frame debugging, object-dragging editing, developer trajectory displays, and backstage creation tools are not player-facing requirements. The target game does not need to provide these creation capabilities, but that must not result in omitting the player-visible levels, slicing, hazards, win/loss states, menus, modes, and progression loops.

---

## GDD / Design Doc (merged from design-doc.md)

# Slice Rush Design Doc

## 1. Design Intent

Slice Rush is a short-session 3D knife-flip runner. The player reads a forward route, taps at the right rhythm, sends the knife into a new upward-forward flip, cuts targets for score, lands blade-first to continue, and avoids hazards or falls until the level resolves.

The design priority is a simple input with visible physical consequence. A tap is not an aim, drag, hold, or charge action; it is a timed commitment. The player should understand success or failure from the knife's arc, spin, contact face, slice feedback, score HUD, and result overlay.

## 2. MDA

### Mechanics

- Tap or touch the playfield to start a run from ready state and to trigger each knife flip while playing.
- Each valid flip launches the knife forward and upward, rotates it, then lets it fall toward platforms, sliceable objects, hazards, or empty space.
- A short rhythm gate prevents unlimited tap spamming from replacing timing.
- Blade contact slices valid targets, awards score, refreshes endless survival pressure, and creates visible cutting feedback.
- Blade contact with a support surface sticks the knife, stops motion, and creates the next launch point.
- Handle or poor-angle contact causes bounce, rotation-to-stick recovery, or loss of control, creating timing risk.
- Hazards and falling below the safe route cause failure; hazards remain dangerous even when the knife is stuck on a moving support.
- Level mode resolves at a finish line by comparing current score to the level goal.
- Endless mode is P2 and replaces the fixed finish with survival pressure that drains during play and refills through slicing.
- Pause, shop, level select, start, and result overlays block playfield flips while active.

### Dynamics

- The player watches the knife's height, forward progress, rotation, and next contact target, then chooses whether to tap immediately, wait, or accept a safer landing.
- Cutting objects improves score but may alter speed or posture; chasing every target increases route risk.
- Missing a blade-first landing can lead to bounce, delayed recovery, collision, or a fall.
- Moving platforms, moving targets, moving hazards, gaps, vertical changes, roofs, side faces, and bottom faces vary the timing puzzle without changing the core tap input.
- Level play balances two goals: reaching the finish and collecting enough score for a true win.
- Endless play emphasizes survival tempo: cutting is both scoring and time management.

### Aesthetics

- Fast, readable, satisfying action: each tap produces a visible flip and each clean cut produces an immediate reward.
- Risky but fair timing: failures should feel connected to a visible obstacle, fall, or bad contact.
- Progression pressure: the player wants to replay for cleaner routes, higher score, more unlocked levels, and optional cosmetics.
- Toy-like physical feedback: cut halves, particles, score pops, bounce, stick, tumble, and result overlays make state changes legible without relying on sound.

## 3. M-Features

| ID | Feature | Priority | Player Value |
|---|---|---:|---|
| M1 | 3D readable play scene with knife, forward route, targets, hazards, HUD, and following camera | P1 | The player can see the route, timing targets, current score, and risk. |
| M2 | Tap-to-flip control with upward-forward launch, rotation, gravity, cooldown, and no hold/drag semantics | P1 | The core rhythm is a repeated timing decision rather than steering or charging. |
| M3 | Blade/handle/contact-face outcomes: slice, stick, bounce, recovery, or failure pressure | P1 | The physical feel is recognizable and not reduced to a simple score button. |
| M4 | Sliceable target chain with score gain, object removal or splitting, particles/popup feedback, and score goal sync | P1 | Cutting is rewarding and drives the level objective. |
| M5 | Platform route with gaps, varied heights, supported faces, moving supports, and readable landing states | P1 | Landing and route traversal form the main skill challenge. |
| M6 | Hazard and fall failure with collision feedback, tumble/defeat animation, locked playfield, and retry path | P1 | Mistakes produce a clear fail state and clean restart loop. |
| M7 | Level finish and score-threshold result: true win, score-not-reached, rewards, unlocks, replay/next-level choices | P1 | Reaching the end is not enough unless score requirements are met. |
| M8 | Start, mode selection, pause, retry, back, and in-run level selection flow with overlay blocking rules | P1 | The player can enter, pause, restart, and switch legal content without stale overlays. |
| M9 | Locked/unlocked level progression and level-select rejection for locked content | P1 | Progress cannot be bypassed and completed levels open the next challenge. |
| M10 | Endless mode with generated route, survival timer/pressure, slice-to-extend loop, and endless failure | P2 | A longer survival variant reuses the core skill loop. |
| M11 | Coins, shop categories, ownership/equip states, purchase rejection, preview/revert, and cosmetic persistence | P2 | Optional progression gives rewards beyond level completion. |
| M12 | Audio toggles, action sounds, saved player progress, and optional leaderboard/high-score surfaces | P2 | Adds polish and continuity without redefining core play. |

## 4. P1 Core Loop As Executable Trajectory

### Level Mode Main Loop

1. **Start/reset:** The player enters level mode from the start flow or retries an active level. The run resets to a ready state with score cleared, the knife visibly inserted at the start, the route visible ahead, HUD visible, and previous particles/result overlays removed.
2. **Player input:** The player taps or touches the non-menu playfield. The first valid tap starts play; each later valid tap during play triggers a new flip unless blocked by cooldown, pause, shop, level select, or result state.
3. **Continuous state changes:** The knife leaves its current stuck face, gains upward-forward motion, rotates, and falls. The camera follows forward. Moving platforms, moving targets, and moving hazards continue to change the immediate landing/collision situation. If the knife is already stuck on a moving support, it follows that support.
4. **Goal/risk:** The player tries to time taps so the blade cuts valuable targets and lands safely on the next support while avoiding hazards, gaps, poor-angle contact, and falls. The visible target score creates pressure to cut enough objects before the finish.
5. **Reward/failure:** Blade contact with a sliceable target removes or splits it, gives points, and updates score feedback. Blade-first contact with a support sticks and creates the next safe launch point. Hazard collision or falling below the route starts failure feedback and locks playfield movement. Reaching the finish resolves the run: enough score gives victory, rewards, and unlock progress; insufficient score gives a retry-focused not-met result.
6. **Progress/restart:** On victory, the player may replay or proceed to the next unlocked level. On failure or score-not-reached, the player retries from the level start with clean state. Returning to start or switching modes clears stale result and play overlays.

### Core Control Feel Chain

Tap while playable -> knife jumps forward/upward and spins -> gravity pulls it down -> contact is interpreted by blade/handle/face -> clean blade contact slices or sticks -> bad contact bounces or forces recovery -> hazard/fall/finish state resolves. Holding, dragging, or releasing does not steer or charge the knife; only the timing of discrete taps changes the next launch.

## 5. Supporting Loops

### Score Collection Loop

Approach target -> time flip so blade intersects target -> target splits/removes with visual feedback -> score HUD increases -> level goal indicator reflects progress -> player decides whether to continue chasing targets or prioritize survival.

### Level Progression Loop

Complete level with enough score -> receive reward -> next level becomes available -> select or continue to the next challenge -> harder route introduces more timing, obstacle, height, and movement variation.

### Failure And Retry Loop

Bad timing or collision -> visible impact/tumble/fail overlay -> playfield input locked -> retry command resets knife, score, objects, particles, timer pressure, and overlays -> player immediately reattempts the route.

### P2 Endless Loop

Choose endless mode -> tap through a continuously extending route -> timer drains only while playing -> cutting targets restores pressure -> survival ends on timer depletion, hazard, or fall -> result supports retry and optional high-score progression.

### P2 Shop Loop

Earn coins from successful level completion -> open shop overlay that blocks playfield input -> browse knife/scene/platform categories -> preview item -> buy if affordable or receive rejection if not -> equip owned item and preserve selection, or close to revert unpurchased preview.

## 6. Mechanism Coverage Matrix

| Mechanism | Priority | Player Trigger | Observable Result | Failure / Rejection / Invariant |
|---|---:|---|---|---|
| Start into playable scene | P1 | Choose level mode or retry | 3D route, knife, HUD, pause/shop access, and tap hint/readiness are visible | No stale start/result overlay may block the playfield once play is ready. |
| Tap-to-flip | P1 | Tap/touch non-menu playfield while ready/playing | Ready becomes playing; knife launches upward-forward, rotates, and camera follows | Taps during cooldown or blocking overlays do not create extra launches. |
| No drag/hold control | P1 | Hold, release, or drag instead of timed tap | No separate steering, charge, or hold acceleration is introduced | Core success depends on tap timing, not hidden aim or continuous input. |
| Blade slice | P1 | Land blade through a valid target | Target visually splits/removes, score increases, score feedback appears | Score cannot increase without visible target interaction. |
| Stacked/chain cutting | P1 | Continue through grouped targets | Multiple visible cut results can occur with slowed/locked cutting feel | Chain cutting still preserves risk; it is not just a bulk score grant. |
| Blade-first support landing | P1 | Contact support with blade in a valid orientation | Knife sticks to top, bottom, or side as readable next launch point | If it does not stick, the next flip should not be available from a false safe state. |
| Handle or poor-angle contact | P1 | Contact target/support without clean blade outcome | Bounce, rotation-to-stick, or rhythm loss is visible | Bad contact should not silently count as a perfect landing or slice. |
| Moving supports and hazards | P1 | Wait or launch near moving elements | Objects shift visibly; stuck knife can be carried with support | Moving hazards remain dangerous and can fail the player. |
| Fall failure | P1 | Miss a safe surface or fall below route | Knife tumbles/lands, failure overlay appears, input locks | Further playfield taps cannot continue the failed run. |
| Hazard failure | P1 | Collide with dangerous obstacle | Hazard feedback, failure animation, failure overlay | Hazard collision cannot be converted into score or safe landing. |
| Finish resolution | P1 | Reach finish in level mode | Run locks and result overlay appears | Score below goal produces not-met result, no next-level unlock. |
| True victory progression | P1 | Reach finish with enough score | Victory result, reward, next-level unlock/next option where valid | Last level or non-level mode must not show invalid next-level progression. |
| Retry/reset cleanup | P1 | Use retry from fail, not-met, victory, or pause | Score, knife, objects, particles, timer pressure, and overlays reset | Old collision, reward, particles, or result layers do not persist into the new run. |
| Pause flow | P1 | Pause during playable state | Physics/timer/input stop while scene remains visible; menu commands appear | Playfield taps do not flip the knife while paused. |
| Level select flow | P1 | Open level selection from valid level state | Unlocked levels selectable; locked levels visible but blocked | Locked level selection cannot bypass progression. |
| Mode switching | P1 | Choose level/endless from start or pause flow | Target mode starts at its legal beginning with correct HUD | Switching clears incompatible score goals, timers, and overlays. |
| Endless survival timer | P2 | Play endless mode | Timer/pressure decreases during play and replenishes through slicing | Timer does not drain while not playing; depletion causes failure. |
| Shop purchase/equip | P2 | Open shop, select item, buy/equip | Coins, owned/equipped state, preview, and visible skin/category update | Insufficient funds or duplicate ownership does not deduct coins incorrectly. |
| Saved progress/options | P2 | Complete levels, buy/equip items, toggle audio, reload/re-enter | Unlocks, coins, equipped items, and toggles persist when supported | If persistence is omitted, single-session progress still remains internally consistent. |

## 7. Screen And State Flow

Start screen -> mode choice -> level-ready or endless-ready -> playing -> paused/shop/level-select as temporary blocking overlays -> result state on fail, not-met, or victory -> retry, next, mode switch, or back to start.

Playfield input is valid only in ready/playing gameplay states with no blocking overlay. Result, pause, shop, start, and level-select states must visibly dominate interaction and prevent hidden knife movement.

## 8. Priority Boundaries

P1 is the minimum recognizable game: readable 3D scene, tap-flip physics, blade/handle outcomes, slicing and score goal, platforms/gaps/hazards, level result rules, retry, pause, mode entry, level progression, and overlay blocking.

P2 deepens the game with endless mode, survival timer, coins, cosmetic shop, persistence, leaderboard/high-score surfaces, audio controls, more themes, and richer route combinations.

Cut scope excludes player-facing creation tools, tuning panels, trajectory authoring, object dragging for level creation, frame stepping, and backstage creation workflows. Their absence must not remove the playable level route, slicing, hazards, menus, win/fail flow, or progression loop.

## 9. Design Review Notes

- This document expands only the gameplay and scope already defined by the preceding Slice Rush requirements.
- The P1 loop preserves the stated operation-feel chain: discrete tap -> upward-forward flip -> rotation and gravity -> blade/handle/face contact -> slice/stick/bounce/fail -> score/result/retry.
- No hidden control scheme, extra weapon, or backstage creation workflow is introduced here.
