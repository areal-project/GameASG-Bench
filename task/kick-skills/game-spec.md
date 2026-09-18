# Kick Skills Gameplay Requirements

## Product Positioning

Kick Skills is a 3D arcade soccer shooting challenge game. From a fixed shooting position, the player faces the goal, drags to build power, chooses a shot direction, and adjusts the contact point on the ball to create different heights and curves. The goal is to complete a series of shooting challenges within a limited number of attempts, accumulate points, earn coins, and unlock ball appearances.

A qualifying game experience is not simply clicking to score. It must present a readable field, ball, goal, target ring, obstacles, goalkeeper, and feedback panel, allowing the player to judge the route before each shot and see the ball's flight, spin, bounce, collision, entry into the net, or miss after the shot.

## Core Loop

1. After entering the game, the player first sees a tutorial or start entry. After starting, the player enters the shooting setup for the current level.
2. The player observes the goal, targets, obstacles, and remaining attempts, adjusts the ball's contact point, drags the ball backward to build power, and previews the trajectory.
3. After the player releases the drag, the ball flies out and is affected by height, lateral direction, curve, gravity, resistance, and collisions.
4. After the ball enters the goal, a score breakdown for the shot, the awarded total, and any possible coins are displayed, and the player confirms to enter the next level.
5. If the ball does not enter the goal, or an obstacle, goalkeeper, or boundary disrupts its route, miss feedback is displayed and one attempt is consumed. If attempts remain, the current level resets; if attempts are exhausted, the end screen appears.
6. After completing all levels or failing, the player can restart; surrounding systems allow viewing rankings, configuring presentation options, and using coins to purchase or equip ball appearances.

## Operation Feel and Input Semantics

### Shot Drag

P1 must support mouse or touch dragging in the main scene area containing the ball. After pressing and beginning to drag, the regular HUD recedes and the game enters a power-charging aim state; the farther the drag, the greater the shot power, and a visible predicted trajectory or equivalent aiming feedback should appear on screen.

The drag direction uses “pull back and release” shooting semantics: the player presses at the ball, drags backward, and upon release the ball flies in the direction opposite the drag. Pulling left-back should give the ball a rightward shooting tendency, while pulling right-back should give it a leftward shooting tendency; the more noticeably the player pulls downward or away from the goal, the stronger the ball's forward travel toward the goal. Releasing after an insufficient drag must not shoot; it must restore the ready-to-shoot state and preserve the current attempt.

After release, the player cannot charge again or change the current shot during flight; the ball continues forward and is gradually affected by resistance and falling, and should tend to bounce and slow after landing. Drags in opposite directions must be reflected on screen as opposite lateral flight or landing tendencies, rather than changing only invisible values.

### Contact-Point Control

P1 must provide an independent ball contact-point control. When the player drags the contact point, the interface should enlarge or highlight the current contact location and provide understandable shot-type feedback.

The contact point's vertical position changes the height tendency: hitting higher on the ball makes a chip or higher arc more likely, while hitting lower makes a low, flat shot close to the ground more likely. The contact point's horizontal offset changes the curve tendency: an offset to the left or right makes the ball gradually bend laterally during flight and may earn a curve bonus. The contact-point control must not shoot directly; it only changes the ball path after the next drag release.

### Preview, Release, and Risk Coupling

During drag charging, the trajectory preview must change with drag power, direction, and contact point, and must show a clear interruption or change when the path strikes a nearby obstacle or risks hitting the ground. After release, the preview disappears, while the ball itself, its shadow, spin, trail, and the follow camera collectively convey speed, height, and direction.

The benefit of a high-power shot is that it can more easily clear distant or difficult targets and may earn extra points; the cost is reduced precision, which may cause the ball to hit a post, fly high, go wide, or rebound from an obstacle. Curved and high shots can go around or over obstacles and earn rewards, but if their height, direction, or timing is wrong, they will collide with a wall, special goal panel, goalkeeper, goalpost, crossbar, advertising boundary, or the ground and lose the ideal route.

## Levels and Progression

P1 must include continuous level progression, covering at least an increasing set of challenges from simple stationary shooting to obstacles, moving targets, goalkeepers, and special goals with openings. The player advances to the next level after each successful shot; failure does not advance, and only deducts an attempt and resets the current level.

The complete level set should contain fifteen shooting challenges: a basic target, wall obstacles, a horizontally moving target, a vertically moving target, a stationary goalkeeper, a moving goalkeeper, multi-section or wide wall obstacles, a special goal with an opening, a moving opening, and combinations of these elements. If the first version cannot provide all fifteen levels in full, P1 must retain at least five representative challenge types: basic target, wall obstacle, moving target, goalkeeper, and special goal with an opening; the remaining combination levels are marked as P2 depth content.

At the start of each level, the previous ball's result, miss, trajectory, landing marker, and temporary collision feedback must be cleared, the ball must be restored to the ready-to-shoot position, and total score, coins, current level, and remaining attempts must remain visible.

## Scoring, Rewards, and Win/Loss

P1 scoring is driven by shot results. A normal goal grants base points, hitting a target area inside the goal grants more points, and precisely hitting the center of a target grants the highest base reward. Additional rewards should come from player-visible performance, such as a pronounced curve, high power, scoring after hitting a post, clearing an obstacle, or notable flight height.

After each goal, the score breakdown and total for the shot must be displayed, and the cumulative score must be updated. High-value shots may award coins, and the coin count must change in sync in the HUD and result display.

The player has a limited number of attempts. A shot that goes wide, passes below the valid area, is blocked by an obstacle or goalkeeper without producing a valid goal, flies outside the playable area, or runs out of speed without completing a goal is considered a miss. After a miss, clear failure feedback and the remaining attempts are displayed; when attempts are exhausted or the level progresses beyond the final level, the end screen appears, displaying the final total score and offering a restart.

After the terminal state, ordinary shooting input must be rejected until the player chooses to restart. Restarting must clear the current run's score and restore the initial attempts and first level, but retain earned and saved long-term appearance/coin progress unless the player resets the saved data.

## Field and Visible Feedback

P1's main scene must be a readable 3D soccer shooting field: the ball is in the foreground, the goal and net are in the distance, level targets are in the goal area, and obstacles and the goalkeeper are visible along the shooting path. While waiting for a shot, the camera stably shows the overall scene; while the ball is in flight, it follows the ball's route so the player can understand the direction, height, collision, and goal result.

During flight, the ball should have spin, a shadow, height changes, a landing bounce, and speed decay. Fast or powerful shots should display a trail or equivalent speed feedback; collisions with goalposts, the crossbar, net, walls, ground, or special panels should produce sound, shake, deformation, rebound, a marker, or other observable feedback.

A goal should produce celebratory feedback: a responsive net, crowd or scene animation, the appearance of a score panel, a success sound, or equivalent reinforced feedback. A miss should produce disappointment or failure feedback and must not display a success result at the same time.

## Menus, Panels, and Modes

P1's startup flow includes a loading state and a tutorial or start entry. While the tutorial/start overlay is displayed, the main scene must not respond to shots; after starting, the overlay closes and the game enters a shootable state. If the player has already completed the tutorial, the game may directly enter a playable state.

P1 must provide a restart path: a new run can be started from the terminal screen; during ordinary play, a visible reset/restart control can also return the game to its initial state.

P2's settings panel allows the player to toggle presentation options such as background crowds, large spectators, the score display, and performance display, and provides a confirmation flow for resetting long-term saved data. Opening the settings panel must not accidentally trigger a shot, and closing it restores the previous playable state.

P2's leaderboard panel allows the player to view a high-score list and submit a final score when available. If loading fails, it should display an understandable error or empty state without blocking continued local gameplay.

## Shop, Coins, and Long-Term Progression

P2's shop allows the player to view ball appearances, preview a ball, purchase unowned appearances, and equip owned appearances. While the shop is open, shooting input in the main scene is paused, and the camera or display area should highlight the currently previewed ball; closing the shop restores the previous level and ball position.

Coins can only be earned through well-performed goals, and purchasing appearances consumes coins. When coins are insufficient, the purchase must be rejected with visible cannot-purchase feedback; the balance cannot become negative, and an unowned appearance cannot be equipped.

P2 should save coins, whether the tutorial has been viewed, owned appearances, and the currently equipped appearance. Resetting saved data requires confirmation; after confirmation, coins and purchased appearances are cleared and the default ball is restored; canceling the confirmation must not change progress.

## Rejection Paths and Stability Rules

When drag power is insufficient, the game must not shoot, deduct an attempt, or hide key HUD elements. Ordinary shooting input must be rejected while the ball is in flight, the shop or settings/leaderboard panel is open, a tutorial/start overlay is present, or the terminal screen is present.

The same ball can be resolved only once during flight; it cannot repeatedly add points, repeatedly deduct lives, or display success and failure at the same time. Advancing to the next level after a goal must wait for player confirmation; the game cannot continue responding to shots while the result panel is still blocking play.

The current level, remaining attempts, total score, and coins must stay consistent with visible panels. Coins cannot be negative, owned appearances cannot be charged for repeatedly, and closing the shop cannot change an unpurchased preview appearance.

## P1 Qualification Scope

P1 must include: a readable 3D main scene, a tutorial/start entry, pull-back drag charging and shooting, contact-point control, dynamic trajectory preview, physical feedback for ball flight, representative levels featuring a goal/target/obstacle/goalkeeper/special opening, goal and miss resolution, limited attempts, level progression, a terminal state, and restart.

P1 may simplify but must not remove: the number of levels may be less than the full fifteen, but the five representative challenge types must remain; visual assets may be replaced, but they must convey the ball, goal, target, obstacles, goalkeeper, net, HUD, and result feedback; sound effects may be replaced with equivalent feedback, but the differences among success, shooting, collisions, and misses must be perceptible.

## P2 Depth Content

P2 includes the complete fifteen levels and all combined variations, leaderboard submission and ranking display, a shop display camera, a draggable rotating ball preview, multiple skins and colors, long-term saved data, saved-data reset confirmation, presentation setting toggles, crowd/score display/large-screen animation, coin reward animation, special high-score titles, and richer sound effects.

## Cut Scope

Integration with real online services, real user avatars, real remote resources, a fixed branded interface, or fixed art assets is not required; these may be replaced with local equivalents. Developer mode, hidden level navigation, performance counters, platform-specific vibration, external logs, specific billboard content, and exact copy are not core gameplay requirements.

Fixed physics values, camera parameters, colors, fonts, button shapes, or fixed point values for each reward do not need to be copied exactly; however, player-observable direction semantics, drag charging, curve/height control, collision risk, level progression, scoring structure, and the failure loop must be preserved.

---

## GDD / Design Doc (merged from design-doc.md)

# Kick Skills Design Doc

## Design Intent

Kick Skills is a 3D arcade soccer shooting challenge about judging drag direction, shot power, ball contact point, curve, height, and obstacles. The player should feel that every shot is a deliberate physical attempt: prepare the ball effect, pull back to build force, release, watch the ball fly through the field, then receive a clear goal or miss outcome.

The P1 experience must be playable as a complete shooting run, not just a score button or themed shell. A valid game needs a readable field with a ball, goal, target areas, obstacles, goalkeeper pressure, special gate openings, visible HUD/progress, shot feedback, scoring, limited attempts, game over, and restart.

## MDA Overview

### Mechanics

- P1: Start or tutorial gate that blocks play until the player enters the shooting state.
- P1: Mouse or touch drag from the ball/playfield to aim and build power.
- P1: Pull-back shooting semantics: the ball launches opposite the drag vector, with stronger pull producing a stronger shot.
- P1: Independent ball contact-point control that changes the next shot's height and curve without firing by itself.
- P1: Dynamic aim or trajectory feedback that updates while dragging and reacts to power, direction, contact point, and near obstacle risk.
- P1: Post-release football motion with forward travel, height, curve, gravity, resistance, bounce, spin, shadow, trail or equivalent speed feedback, and camera/readability support.
- P1: Goal, target, wall or obstacle, goalkeeper, special hole-gate, posts, crossbar, field boundary, ground, and net interactions that can redirect, stop, reward, or fail a shot.
- P1: Level progression with representative challenge types: basic target, wall obstacle, moving target, goalkeeper, and special hole-gate.
- P1: Finite attempts, miss handling, score breakdown on goals, cumulative score, possible coin reward for high-value goals, terminal game-over state, and restart.
- P1: Rejection rules for too-weak drags, in-flight input, blocking overlays, terminal state, and non-shooting panels.
- P2: Full fifteen-challenge set and richer combinations of moving target, moving goalkeeper, wall patterns, hole gates, and mixed hazards.
- P2: Shop, ball appearance preview, purchase/equip flow, coin persistence, settings, leaderboard, storage reset, crowd/display options, and richer audiovisual feedback.

### Dynamics

- The player scans the goal layout, chooses a contact-point setup, then pulls away from the intended launch direction to build force.
- While dragging, the player uses the changing trajectory/aim feedback to judge whether the shot will clear an obstacle, pass through a hole, hit a target, or drift wide.
- Release commits the shot. The player can no longer steer, so success depends on the pre-shot contact point and drag vector.
- Strong shots help clear distant or difficult layouts but increase precision risk. High arcs and curve shots can solve obstacles and earn bonuses, but can also hit posts, fly over, collide, or lose speed.
- A successful shot produces a visible celebration and score breakdown, then waits for player confirmation before the next challenge.
- A failed shot consumes an attempt and returns the same challenge if attempts remain; running out of attempts ends the run.
- Long-term systems give extra motivation through coins, skins, saved ownership, leaderboard viewing, and settings, but they must not interrupt or replace the shooting loop.

### Aesthetics

- Precision: the player should believe that small changes in pull angle, power, and ball contact point matter.
- Physicality: the ball should feel like a moving 3D object with readable height, speed, collision, rebound, and net impact.
- Tension: limited attempts and escalating obstacles make each shot consequential.
- Reward: goals should feel satisfying through visible celebration, score detail, coin feedback when earned, and progress to the next challenge.
- Mastery: curve, chip, low shot, obstacle clearance, post rebounds, and target precision should support repeat attempts and skill growth.

## P1 Core Loop Trajectory

### Main Shooting Loop

1. **Start/reset:** The player enters from loading/tutorial/start into a ready-to-shoot challenge. Restart returns to the first challenge with score and attempts reset, while allowed long-term ownership progress may remain.
2. **Player input:** The player optionally moves the ball contact point to choose height and curve behavior, then presses on the ball or playfield and drags backward from the intended shot direction.
3. **Continuous state changes:** While held, normal HUD elements may recede, aim feedback appears, power grows with drag distance, and the preview updates from the drag vector plus contact point. Too little drag remains a cancellable preparation state.
4. **Goal/risk:** The player is trying to send the ball into the goal and target area while avoiding or solving walls, moving targets, goalkeeper position, special holes, posts, crossbar, ground, side boundaries, and loss of speed.
5. **Reward/failure:** Releasing a valid pull launches the ball opposite the drag direction. The ball flies with visible speed, height, curve, spin, shadow, bounce, camera follow, collision, and net/target feedback. A valid goal opens a score breakdown; a miss or blocked/invalid trajectory consumes an attempt and shows failure feedback.
6. **Progress/reopen:** On a goal, the player confirms to advance to the next challenge. On a miss with attempts remaining, the same challenge resets to a ready state. On attempts exhausted or full challenge completion, the game enters a terminal result screen with restart available.

### Operation Feel Causality Chain

- **Hold/drag:** Dragging farther increases power and should visibly change preview length, intensity, or equivalent aim feedback.
- **Direction:** Pulling left-back should make the released ball trend right; pulling right-back should make it trend left. Pulling farther away from the goal direction should increase forward launch toward the goal. Opposite inputs must produce opposite visible horizontal flight or landing tendency.
- **Contact height:** Moving the contact point upward biases the next shot toward a higher/chipped trajectory; moving it downward biases toward a lower placed shot.
- **Contact side:** Moving the contact point left or right creates curve tendency during flight and may support curve scoring.
- **Release:** Release commits the shot; mid-flight steering or another shot charge must be unavailable until the current shot resolves.
- **Resistance and collision:** The ball should fall, slow, bounce, and rebound from physical surfaces; collision feedback must connect directly to changed flight path or failure risk.
- **Risk/reward:** Power, height, curve, obstacle clearance, target precision, post rebounds, and high arcs can improve scoring, but the same choices can also cause blocked, wide, high, low, or exhausted shots.

## M-Feature Breakdown

| ID | Feature | Priority | Player Trigger | Observable Result | Failure / Invariant |
|---|---|---:|---|---|---|
| M1 | Start, tutorial, and play gating | P1 | Use the start/tutorial entry or restart path | Blocking overlay closes; ready challenge and HUD become playable | Shooting is ignored while a blocking overlay is present |
| M2 | Pull-back drag shot | P1 | Mouse/touch press, drag backward, release | Preview appears while dragging; valid release launches the ball opposite the pull direction | Too-weak drag cancels without shot, attempt loss, or score change |
| M3 | Contact-point shot shaping | P1 | Move the contact point before shooting | Shot type feedback appears; next shot height/curve changes visibly | Contact adjustment alone must not fire or score |
| M4 | Dynamic trajectory preview | P1 | Change drag vector, power, or contact point while held | Aim/trajectory feedback updates and can shorten/change around obstacle or ground risk | Preview disappears after release and cannot remain as stale guidance |
| M5 | Flight physics and readable 3D feedback | P1 | Release a valid shot | Ball moves through the field with height, curve, spin, shadow, bounce, trail/speed cue, and readable camera support | Mid-flight input cannot overwrite the committed shot |
| M6 | Goal, target, and scoring result | P1 | Land a valid goal or target hit | Goal celebration and score breakdown appear; cumulative score updates; high-value goals can award coins | A shot can resolve only once and cannot show success and failure together |
| M7 | Miss, attempt loss, and retry | P1 | Shoot wide, low, blocked, out of range, or stalled | Miss feedback appears; attempts decrease; current challenge resets if attempts remain | Miss does not advance the challenge or award goal score |
| M8 | Representative escalating challenges | P1 | Advance through successful shots | Challenges introduce basic target, wall, moving target, goalkeeper, and special hole-gate layouts | Each new challenge clears prior transient shot feedback while preserving run score/attempt state |
| M9 | Terminal result and restart | P1 | Exhaust attempts or finish the challenge run; choose restart | Final score/result appears; restart begins a fresh run | Terminal state rejects normal shooting until restart |
| M10 | Collision and obstacle feedback | P1 | Hit wall, goalkeeper, post, crossbar, net, ground, boundary, or special gate surface | Ball path changes, impact feedback appears, and scoring/failure reflects the outcome | Collision must affect play, not only cosmetic state |
| M11 | HUD and state synchronization | P1 | Shoot, score, miss, advance, restart, earn coins | Level, attempts, score, coins, result panel, and playability state stay aligned | Score/coins/attempts cannot go negative or contradict visible result state |
| M12 | Full challenge set | P2 | Continue beyond representative challenge coverage | Up to fifteen staged shooting challenges with mixed moving and static hazards | Omitted combinations are acceptable only as P2 depth, not as replacement for P1 representatives |
| M13 | Shop and ball appearance progression | P2 | Open shop, preview, buy, equip, close | Shop pauses shooting, shows preview, updates owned/equipped state and coins | Insufficient coins reject purchase; unowned skins cannot be equipped; closing restores the play state |
| M14 | Settings and persistence controls | P2 | Open settings, toggle presentation options, confirm/cancel reset | Presentation options change visibly; reset confirmation protects saved progress | Open settings blocks shooting; cancel reset leaves progress unchanged |
| M15 | Leaderboard and long-term score context | P2 | Open leaderboard or submit eligible final score | Scores list, loading, empty, or error state appears without blocking local play | Network or service failure cannot prevent local restart/play |

## Source Core Loop Coverage

| Loop | M-feature Coverage | Priority | Start/Reset | Player Input | State Change | Goal/Risk | Reward/Failure | Progression/Restart |
|---|---|---:|---|---|---|---|---|---|
| Core shot resolution | M2, M3, M4, M5, M6, M7, M10 | P1 | Ready challenge with ball reset and HUD visible | Set contact point, drag backward, release | Preview changes, ball launches, flies, curves, falls, bounces, collides | Hit goal/target while avoiding walls, goalkeeper, posts, gate panels, boundaries, speed loss | Score breakdown and celebration, or miss overlay and attempt loss | Goal waits for next confirmation; miss resets same challenge; terminal after attempts exhausted |
| Level progression run | M1, M6, M7, M8, M9, M11 | P1 | Start from tutorial/entry or restart first challenge | Complete each shot or retry after misses | Challenge index, attempts, score, and transient feedback update | Later layouts add more moving or blocking threats | Goals advance; misses consume attempts; game over ends input | Player confirms next challenge or restarts from terminal |
| Shot shaping mastery | M3, M4, M5, M6, M10 | P1 | Ball ready with contact control visible | Move contact point, then perform drag shot | Height and curve tendencies alter preview and flight | Use chip/low/curve choices to clear obstacles or hit targets | Better target, curve, power, height, obstacle-clear, or rebound outcomes can improve scoring | Same challenge/run continues according to goal or miss result |
| Panel blocking and restart safety | M1, M9, M11, M13, M14, M15 | P1 for start/restart, P2 for shop/settings/leaderboard | Overlay, result, game-over, shop, settings, or leaderboard is open | Try closing, restarting, buying/equipping, toggling, or shooting | Panel state changes; playfield interaction is paused or restored | Avoid accidental shots and invalid state mutation while panels block play | Confirmed actions apply; rejected actions preserve state | Closing panel resumes prior play; restart creates fresh run |
| Long-term progression | M6, M11, M13, M14, M15 | P2 | Existing saved coins/owned appearance or fresh save | Earn coins through strong goals, buy/equip, reset storage, view leaderboard | Coins, owned/equipped appearance, saved tutorial/progress metadata update | Purchases compete with limited coins; service failures may occur | Valid purchase/equip changes appearance; insufficient funds or canceled reset preserves state | Persistence survives sessions where supported; reset confirmation clears long-term progress only when confirmed |

## Challenge Design Notes

P1 must include a compact but recognizable progression of challenge types:

- Basic goal and target placement for learning aim, power, and scoring.
- Wall or blocking obstacle that forces height, curve, or side choice.
- Moving target that requires timing or predictive aiming.
- Goalkeeper pressure that can block a direct shot and rewards placement or arc.
- Special hole-gate that requires passing through a visible opening rather than simply crossing the goal plane.

P2 expands this into the full fifteen-challenge arc with side placements, vertical target motion, moving goalkeeper, wider or multi-slot walls, moving hole-gates, and final combinations.

## Feedback Requirements

- During preparation, the player sees a clear difference between idle, adjusting contact point, dragging below threshold, and dragging a valid shot.
- During flight, the player can read horizontal direction, height, curve, speed, impact, and whether the ball is still live.
- On success, the game presents goal feedback, target/precision feedback when relevant, scoring components, cumulative score, and possible coin gain.
- On miss, the game presents failure feedback and remaining attempts without showing a success result.
- On reset or next challenge, previous shot trails, marks, overlays, and temporary collision effects are cleared.

## Priority Boundaries

### P1 Must Not Be Cut

- Readable 3D soccer shooting scene.
- Start/tutorial gate and restart path.
- Pull-back drag shot with correct opposite-direction launch.
- Contact-point shot shaping for height and curve.
- Dynamic preview and visible post-release flight.
- Goal/target scoring, miss handling, finite attempts, game over, and restart.
- Representative obstacle, moving target, goalkeeper, and special hole-gate challenges.
- Rejection while blocked, in flight, terminal, or below drag threshold.

### P2 Depth

- Full fifteen-stage challenge sequence and all mixed variants.
- Shop preview, purchase/equip depth, multiple appearances, saved ownership, and storage reset confirmation.
- Leaderboard viewing/submission, network empty/error states, and persistence polish.
- Settings for crowd, display elements, performance readout, and richer audiovisual/crowd reactions.

### Cut Scope

The design does not require fixed art resources, fixed copy, exact physics constants, exact score values, online service integration, platform-specific vibration, developer shortcuts, external logs, or specific UI styling. Equivalent presentation is acceptable when the player-visible shooting semantics, risk/reward, result flow, and progression loop remain intact.
