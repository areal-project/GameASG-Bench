# Spider-Kid's Halloween Haul Gameplay Requirements

## 1. Game Positioning and Core Loop

This is a portrait-oriented 2D side-scrolling, one-button physics-based swinging collection game. The player controls a child dressed as a spider superhero, setting out above a Halloween neighborhood and using webs to attach to streetlights ahead or a small number of attachable flying targets, swinging, releasing, flying, and then catching the next anchor point to continue moving right.

The core loop is: start or restart -> the player holds the input to shoot a web -> the character attaches to a reachable anchor point ahead and swings around it -> the player releases at the right moment to gain flight speed -> passes through candy or advances the distance -> catches the next anchor point or falls and fails -> depending on the mode, enters victory, failure, continued score chasing, or restart.

The P1 qualification threshold is not merely that the character can move, but that the player can complete at least one continuous sequence of swings through a real hold/release rhythm and see the character, web, anchor points, candy, score, progress, and failure/victory feedback form a complete loop.

## 2. Player Input and Control Feel

### 2.1 Core Input

The game needs only one primary action and must support mouse/touch hold and release as well as keyboard spacebar press and release. Holding means attempting to shoot a web, and releasing means releasing the current web.

On press, if the character is not swinging, no web is currently being shot, the game is not paused or in a result state, and a reachable anchor point exists ahead, feedback showing the web extending toward that anchor point should appear immediately on screen; after a brief extension, the character enters the swinging state. If no reachable anchor point exists ahead, pressing may produce a subtle sound effect or no change, but it must not attach to a distant target out of nowhere or interrupt an already established result state.

On release, if the character is swinging, the web breaks, and the character flies out along the current direction of motion while retaining a clear speed benefit; the closer the release timing is to the rightward-and-upward part of the arc, the more favorable the flight distance. If the character is not swinging, releasing should not produce an extra jump, dash, or score.

### 2.2 Swinging Causal Chain

Holding continuously is not itself a throttle. The benefit of holding is to shoot a web and enter an anchored swing; once attached, the character should move in a visible arc around the anchor point, with the web line connecting the character and anchor point, and the character's pose should differ from free flight.

Releasing is the main skill point. After release, the character is no longer constrained by the anchor point, continues flying right/upward or right/downward at the current velocity, and then gradually falls under gravity. Releasing too early or too late reduces forward height or distance and increases the risk of missing the next anchor point.

Drag and motion trends must be visible: during free flight, the character gradually falls; successive successful swings should make the player feel speed building progressively, but must not allow unlimited, risk-free acceleration. Missing an anchor point, releasing too low, or failing to press again in time while falling will bring the character to the bottom of the screen and trigger failure or that mode's rescue/penalty flow.

Directional semantics must be clear: the game always encourages movement to the right. The player has no left/right steering input; the character's forward direction comes from the swing arc and release timing. Attachable targets should preferentially appear ahead of the character, and anchor points behind the player must not provide the primary forward momentum.

### 2.3 Special Anchor Points and Risks

P1 anchor points are streetlights in the neighborhood, and the area near the top of a streetlight must have a clear attachable indicator when reachable. P2 may add flying targets as temporary anchor points: they move and can be attached to by a web, but remain only for a limited time and may offer a higher position or a more dangerous route; if the player stays too long, the flying target's departure cuts the web and causes the character to fall.

## 3. Visible Feedback Chain

The main view must continuously render a Halloween neighborhood at night: the night sky, street, houses, streetlights, candy, character, and foreground/background motion must all make the horizontal progression readable to the player. The presentation must not be a pure UI number game.

The character should have distinguishable poses or motion performances during free flight, web shooting, swinging, falling, and the victorious flight offscreen. The shooting process must show the connection extending from the character to the anchor point; swinging must show a stable connection line; after release, the connection line disappears.

When the character approaches an attachable streetlight, the streetlight's anchor point should glow or show a prominent indicator; the tutorial should also clearly display the reachable range and direction of the next anchor point. An indicator may only communicate "attachable now" and must not make unreachable targets appear attachable.

When the character touches a candy item, it should disappear and simultaneously produce a score increase, candy count increase, brief score popup, or equivalent reward feedback. Candies of different values may have different appearances and stronger reward feedback, but no fixed colors or fixed shapes are required.

The HUD must include at least the current score, candy collection count or result statistics, and mode-specific progress. A finite-distance mode should display the player's progress toward the destination; race mode should show both the relative progress of the player and opponent and the timer; endless mode does not display victory progress toward a finish.

Sound effects and music are P2 polish, but core actions should preferably have immediate audio feedback: shooting, releasing from a swing, collecting high-value candy, failing, and button operations may use distinct sound effects to strengthen the rhythm.

## 4. State Flow and Menus

### 4.1 Startup and Main Menu

After the game starts, it first enters the title/main menu. The main menu should provide the primary items among start, tutorial, story/background information, and leaderboard or results entry. Start should not force the player directly into a single mode, but should enter mode selection.

Mode selection must include at least candy target mode, endless mode, and race mode. Gameplay begins only after the player selects a mode, and the title and mode layers must be hidden without covering the main gameplay view.

### 4.2 Tutorial

The tutorial is P1. It should explain in steps how to hold to shoot, release to fly out, find the next anchor point, collect candy, and avoid falling. The tutorial may pause or slow down key moments and should give a clear prompt when the player is too low or reaches the appropriate timing.

Tutorial failure does not enter the normal result flow, but resets to a teaching precondition point and prompts the player to try again. After the tutorial is completed, it should return to a state where play can continue, with the progress bar and normal gameplay HUD restored.

### 4.3 Pause, Resume, Restart, and Return

Gameplay must have a pause entry. After pausing, physics, timing, generation, scoring, and failure checks all stop, and the pause menu covers the view and prevents the main playfield from continuing to receive gameplay input. Resume restores the previous state; restarting from pause clears old candy, popup feedback, temporary targets, result state, and player motion; returning to title clears the current run and displays the main menu.

A failure result must provide restart and return-to-title options. A victory result must provide return to title; it may also provide restart or next run, but this is not required for P1.

## 5. Modes and Progress

### 5.1 Candy Target Mode

Candy target mode is the P1 main path. The player sets out from the beginning of the neighborhood, collecting candy randomly distributed in the air while swinging. The road continuously generates houses, streetlights, and candy ahead, and victory is triggered after the player reaches the destination distance.

On victory, the character should leave player control and fly offscreen or complete a clear celebration sequence, after which the victory layer appears and summarizes the score and candy count. Falling to the bottom of the screen before reaching the destination causes failure and displays the final score and candy count.

### 5.2 Endless Mode

Endless mode is a P1 extended path. The player follows the same rules as in candy target mode, but there is no finish-line victory; the goal is to swing as far as possible and earn a high score. On failure, the final score and candy count are displayed.

Endless mode may connect to a leaderboard or high-score submission in P2. If there is no external leaderboard, it must still retain the current run's result display and must not leave the player without result feedback after failure.

### 5.3 Race Mode

Race mode is an independent P1 mode. The player and one opponent start near the beginning of the neighborhood, and the opponent automatically moves toward the finish. This mode focuses on speed and route rhythm and does not generate candy collection objectives; the HUD should display the timer, finish progress, and opponent's relative position.

If the player reaches the finish first, the player wins and the result displays the elapsed time; if the opponent reaches it first, the player fails and the result displays the current run's time or failure outcome. When the opponent is offscreen, a direction indicator should let the player know whether it is ahead or behind.

An ordinary fall in race mode should not immediately end the entire run and may trigger a visible rescue: a flying target carries the player back to a safer preceding position and drops them, after which the player has lost forward momentum and needs to reconnect to a swing. This is race mode's risk penalty and must not become a cost-free teleport.

## 6. World Systems

The neighborhood should continuously generate houses, streetlights, and collectibles ahead and clean up objects behind. Streetlight spacing must support a rhythmic hold/release challenge: spacing that is too dense removes the sense of timing, while spacing that is too sparse makes the core loop impossible to complete.

Candy should be distributed at different heights and horizontal positions, encouraging the player to adjust release timing to pass through reward routes. High-value candy should be rarer and provide stronger feedback when collected. Candy appears only in modes appropriate for collection, and race mode should not treat candy as its main objective.

P2 may add other Halloween pedestrians on the ground and falling leaves as atmospheric objects. They may move and make the neighborhood livelier, but should not prevent the player from reading the anchor points, candy, and character position.

P2 may add flying targets as moving anchor points and as the race rescue presentation. Their motion, attachable indicators, and feedback when departure causes disconnection must be clear so that players do not mistake them for pure background decoration.

## 7. Victory, Defeat, Failure, and Rejection Paths

If the player falls past the bottom of the screen while not in a race rescue state, the game should enter a failure result. After failure, core input no longer allows the character to continue scoring, moving, or collecting; a new state can be started only through restart or return to title.

The victory state after reaching the target distance must lock player control to prevent further shooting, collection, or repeated result triggers during the victory sequence. After the victory layer appears, the score, candy count, or race time remains stable.

While paused, no hold, release, touch, mouse, or keyboard input may advance physics, collect candy, change race time, or trigger failure. After resuming, play continues from the state before the pause.

Holding when no anchor point is in range must not attach out of nowhere; repeated holding while swinging must not switch to another anchor point; repeated holding while a web is being shot must not generate multiple webs; holding or releasing in a result state must not restart the game.

After switching modes or returning to title, the previous run's score, candy, opponent, rescue, tutorial prompts, pause layer, and victory/defeat layer must not remain in the new run.

## 8. Cut Scope and Priorities

P1 must include: main menu to mode selection, three mode entries, tutorial, one-button hold/release swinging, streetlight anchor points, falling during free flight, candy collection and scoring, finite-distance victory, endless failure result, race opponent and timed result, pause/resume/restart/return, and core rejection paths.

P2 may include: leaderboard/high-score submission, story background page, moving flying anchor points, race fall rescue, neighborhood pedestrians, falling leaves, character/opponent speech bubbles, audio details, richer candy rarity, and celebration sequences.

Cut scope: creator-facing level editing, runtime parameter tuning, external platform account profiles, server leaderboard dependencies, fixed branded assets, fixed exact copy, fixed art assets, and exact numerical values are outside the target scope. If no external service exists, the leaderboard entry may be downgraded to a local results display or marked unavailable, but the main gameplay results must be complete.

---

## GDD / Design Doc (merged from design-doc.md)

# Spider-Kid's Halloween Haul Design Doc

## 1. Design Intent

This is a portrait-oriented 2D side-scrolling, one-button physics-based swinging collection game. The player plays as a child dressed as a spider superhero, moving right through a Halloween neighborhood by holding to shoot a web and releasing to detach from the swing along streetlight anchor points, collecting candy and avoiding falls.

The P1 goal is for the player to be able to enter a mode from the main menu and complete a real continuous sequence of swings: after holding, the player sees a web connect to a reachable anchor point ahead and the character enters an arcing swing; after releasing, the character flies out with the current velocity and falls under gravity; the player holds again to connect to the next anchor point, collecting candy and advancing distance along the way, and eventually enters a victory, failure, or race result. The game must not be reduced to a pure numeric clicker, nor may it merely move the character automatically without a causal hold/release timing chain.

## 2. MDA

### Mechanics

- One-button hold/release: mouse, touch, and spacebar should all express the same core action. Holding attempts to shoot a web, and releasing releases the current web.
- Anchor-point swinging: reachable streetlights ahead are P1 anchor points. After a successful hold, the web first extends to the anchor point, and the character then moves in a visible arc around it.
- Free flight and falling: after release, the connection line disappears, the character flies out along the velocity at that moment, and then gradually falls under gravity.
- Candy collection: in applicable modes, when the character touches candy, the candy disappears and the score, collection count, or result statistics increase in sync.
- Progress and results: in candy target mode, reaching the destination is a victory and falling is a failure; endless mode has no finish and presents results after a fall; race mode compares whether the player or opponent reaches the finish first and their elapsed times.
- Menus and states: title, mode selection, tutorial, pause, resume, restart, return to title, victory result, and failure result form a complete state flow.
- Rejection paths: attachment must not occur out of nowhere when no reachable anchor point exists; repeated holding while swinging must not change attachment; core input must not continue advancing the game during results or pause.

### Dynamics

- Under the pressure of falling, the player looks for the next moment to hold, entering a predictable swing arc after successfully attaching.
- Release timing determines the launch direction, height, and subsequent reachability: a rightward-and-upward arc is more favorable, while releasing too early or too late lowers height, shortens distance, or increases the risk of falling.
- Candy routes encourage the player to adjust release timing for rewards rather than simply following the safest, lowest-cost route.
- Successive successful swings produce smoother forward movement and higher scores, but speed, height, and distance to the next anchor point jointly create risk.
- Race mode turns the swinging rhythm into time pressure; opponent progress and direction indicators let the player understand whether they are ahead or behind.

### Aesthetics

- Lighthearted, tense, and playful: the player should feel that every anchor catch is timely and that every release has the thrill of "flying out."
- Halloween neighborhood adventure: the night sky, street, houses, streetlights, candy, and background motion together convey a horizontally progressing scene.
- Superhero-style leaps: the character's poses, web line, arcing swing, flight, and successful collection feedback should make the action easy to read.
- Readability first: anchor indicators, the web, character position, candy, and HUD must not be obscured by atmospheric objects.

## 3. M-Features

| ID | Priority | Feature | Player Experience |
|---|---|---|---|
| M1 | P1 | Menu to mode flow | The player enters mode selection from the title, then selects candy target, endless, or race mode to begin playing; stale overlays must not block the main view. |
| M2 | P1 | One-button web input | Holding attempts to shoot a web, and releasing releases the web; mouse, touch, and spacebar have consistent semantics. |
| M3 | P1 | Reachable lamp attachment | Only reachable anchor points ahead can be attached to; on success, web extension and connection are shown, while failure must not attach out of nowhere. |
| M4 | P1 | Swing and release physics feel | After attaching, the character swings in an arc around the anchor point; after release, the character retains the speed benefit and enters free flight and falling. |
| M5 | P1 | Candy collection and score | In applicable modes, touching candy removes it and synchronously provides reward feedback, score, or collection statistics. |
| M6 | P1 | Candy target progression | Candy target mode displays destination progress, locks control on arrival, and enters the victory result; falling enters the failure result. |
| M7 | P1 | Endless score chase | Endless mode has no finish-line victory; the player pursues a current-run result through distance, score, and candy count, and the result is shown after a fall. |
| M8 | P1 | Race mode | Race mode has an automatically advancing opponent, a timer, finish progress, and relative-position feedback; reaching the finish first determines victory or defeat. |
| M9 | P1 | Tutorial | The tutorial explains holding, releasing, the next anchor point, collection, and avoiding falls step by step; failure returns to the teaching precondition point. |
| M10 | P1 | Pause and restart state flow | Pause freezes physics, timing, generation, scoring, and failure; resume restores them, while restart and return to title clear current-run remnants. |
| M11 | P1 | Terminal and invalid input locks | States such as victory, failure, pause, no anchor point, and repeated holding while swinging have explicit rejection or no-change behavior. |
| M12 | P2 | Moving temporary hang points and rescue | Moving temporary anchor points may be added; race falls may have a visible rescue and momentum penalty. |
| M13 | P2 | Atmosphere and feedback polish | Pedestrians, leaves, character/opponent speech bubbles, sound effects, stronger feedback for rare candy, and celebration sequences may be added. |
| M14 | P2 | Leaderboard or local results depth | A leaderboard may connect to an external service or be downgraded to a local results display, but the main gameplay results must be complete. |

## 4. P1 Core Loop as Executable Trajectories

### 4.1 Shared Swing Segment

1. Start/reset: the player enters mode selection from the main menu and, after selecting a mode, enters the main gameplay view; the character is above the neighborhood, a readable streetlight anchor point exists ahead, and the HUD shows state relevant to the current mode.
2. Player input: the player holds the mouse, touch, or spacebar.
3. Continuous state change: if the anchor point ahead is within reachable range, the web extends from the character toward it; once extension is complete, the character is connected to the anchor point and swings around it, with the connection line remaining visible. If no reachable anchor point exists, the character continues the current flight or fall and receives no hidden jump or teleport.
4. Goal/risk: the player observes the character's arc, the next anchor point, the candy route, and height. Continuous holding is not a throttle; risk comes from poor release timing, missing the next anchor point, or falling to the bottom of the screen.
5. Reward/failure: when the player releases, the web breaks and the character flies out at the current velocity. A well-timed release advances to the right and may pass through candy for a reward; a poorly timed release leaves the character too low, short on distance, or more likely to fall.
6. Progress/restart: the player continues holding to connect to the next anchor point, forming multiple swing segments; if the character falls, the current mode enters its failure or rescue flow; after the result, the player can restart or return to title.

### 4.2 Candy Target Mode Loop

1. Start/reset: after candy target mode is selected, the score, candy statistics, and destination progress are reset or enter the initial state for the current run, and the neighborhood, streetlights, and candy begin appearing ahead.
2. Player input: the player repeatedly follows the rhythm of holding to attach and releasing to fly.
3. Continuous state change: the character advances to the right and the scene scrolls continuously; new houses, streetlights, and candy are generated ahead, objects behind are cleaned up, and candy disappears when touched.
4. Goal/risk: the goal is to collect as much candy as possible and maintain height before reaching the destination. The risk is falling after missing an anchor point or releasing too low.
5. Reward/failure: collecting candy increases the score and statistics; reaching the destination triggers victory, while falling to the bottom triggers failure.
6. Progress/restart: a stable result is shown after victory or failure; restart clears old candy, motion, prompts, pause, and result remnants before returning to this mode's initial state.

### 4.3 Endless Mode Loop

1. Start/reset: after selecting endless mode, the player enters the same swinging neighborhood, but no finish-line victory progress is displayed.
2. Player input: the player maintains swings and searches for candy routes through successive holds/releases.
3. Continuous state change: distance, score, and candy statistics grow with successful progress and collection; the neighborhood continuously generates ahead.
4. Goal/risk: the goal is to travel as far as possible and score as highly as possible; risk accumulates through successive mistakes, low height, and missed anchor points.
5. Reward/failure: candy and distance make up the current run's result; falling immediately enters the endless result screen.
6. Progress/restart: the result displays the current run's score and candy count; the player can restart to pursue a higher result or return to title.

### 4.4 Race Mode Loop

1. Start/reset: after selecting race mode, the player and opponent set out near the start, and the HUD displays the timer, finish progress, and opponent's relative position; candy is not a main objective.
2. Player input: the player advances to the right as quickly as possible by holding/releasing to swing.
3. Continuous state change: the opponent automatically advances toward the finish; the timer continuously increases; the progress bar or directional feedback expresses the relative positions of both participants.
4. Goal/risk: the goal is to reach the finish before the opponent. Risks come from mistakes that cost speed, low height, missing anchor points, and falling behind the opponent.
5. Reward/failure: if the player reaches the finish first, the player wins and the elapsed time is shown; if the opponent arrives first, the player fails and the current run's result is shown. If rescue is enabled, falling triggers a visible rescue and loss of momentum rather than cost-free continuation.
6. Progress/restart: the result locks player control; restarting clears the opponent, timer, rescue, progress, and motion state.

### 4.5 Tutorial Loop

1. Start/reset: the player enters the tutorial from the main menu, and the normal HUD and tutorial prompts enter the teaching state.
2. Player input: as prompted, the player holds to shoot a web, releases to fly out, and holds again to connect to the next anchor point.
3. Continuous state change: the tutorial may pause or slow down key moments and display the reachable range, direction of the next anchor point, and release-timing prompts.
4. Goal/risk: the goal is to understand the one-button swinging chain; risks are getting too low, failing to attach in time, or misunderstanding release timing.
5. Reward/failure: after completing the steps, the tutorial displays completion and enters a state where play can continue; tutorial failure does not enter the normal result flow, but returns to a teaching precondition point.
6. Progress/restart: after the tutorial ends, the normal gameplay HUD and progress are restored; returning to title or restarting should clear tutorial prompts.

## 5. State Flow

```text
Title
  -> Mode Select
      -> Candy Target Playing -> Paused -> Playing
                              -> Win Result -> Retry or Title
                              -> Fail Result -> Retry or Title
      -> Endless Playing      -> Paused -> Playing
                              -> Fail Result -> Retry or Title
      -> Race Playing         -> Paused -> Playing
                              -> Win/Lose Result -> Retry or Title
  -> Tutorial Playing         -> Tutorial Reset Point or Completed Play
  -> Story/Background Panel   -> Title
  -> Leaderboard/Results Panel -> Title
```

State rules:

- After entering Playing, the title, mode, story, leaderboard, and result layers must not obscure the main gameplay view.
- During pause, physics, timing, generation, collection, failure, and victory checks are all frozen.
- During results, core input no longer allows the character to move, score, collect, or trigger repeated results.
- Return to title and restart must clear the previous run's motion, score, candy, opponent, rescue, tutorial prompts, pause layer, and victory/defeat layer.

## 6. Feedback Requirements

- The main view must continuously present a horizontally progressing Halloween neighborhood, with the character, anchor points, candy, and HUD as the core readable objects.
- A clear indicator should appear when an anchor point is reachable; unreachable targets must not be presented as attachable.
- When shooting the web, the extension from the character to the anchor point should be visible; while swinging, a stable connection line should be visible; after release, the connection line disappears.
- The character should have distinguishable poses, motion, or state feedback during free flight, shooting, swinging, falling, victory, or failure.
- Candy collection requires the scene object to disappear in sync with changes to HUD/result statistics.
- Race mode requires timer, finish progress, and opponent-relative-position feedback; even when the opponent is offscreen, the player should understand whether it is ahead or behind.

## 7. Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure / rejection / invariant |
|---|---|---|---|---|
| M1 Menu to mode flow | P1 | Click start and select a mode | The corresponding mode HUD and main gameplay view appear, and the menu layer is hidden | In the Playing state, stale menu or mode layers must not block input |
| M2 One-button web input | P1 | Hold with mouse/touch or press spacebar, then release | Holding attempts to shoot a web; releasing detaches the web or produces no extra action | Release must not cause a jump out of nowhere; input does not advance during pause/results |
| M3 Reachable lamp attachment | P1 | Hold while an anchor point ahead is reachable | The web extends to the anchor point ahead, and the character enters a connected swing | No attachment without a reachable anchor point; anchor points behind must not become the main source of forward movement |
| M4 Swing and release physics feel | P1 | Remain attached, then release along the arc | The character swings around the anchor point, then flies out with velocity after release and gradually falls | Continuous holding must not act as a throttle; remaining constrained by the connection after release is a failure |
| M5 Candy collection and score | P1 | Pass through candy via swinging/flight | The candy disappears, and the score, collection count, or reward feedback changes in sync | Score must not increase without touching candy; collection must not continue after results |
| M6 Candy target progression | P1 | Continue advancing right in target mode | Destination progress increases, followed by the victory result on arrival | Control locks after arrival; falling before arrival enters failure |
| M7 Endless score chase | P1 | Select endless and continue swinging and collecting | There is no finish-line victory, and distance/score/candy statistics grow | The current run's result must be shown after a fall; it must not stop without feedback |
| M8 Race mode | P1 | Select race and continue swinging | The timer increases, the opponent advances automatically, and both participants' progress is readable | Results lock after the player or opponent reaches the finish first; candy should not be the main objective |
| M9 Tutorial | P1 | Enter the tutorial and follow the prompts | Step-by-step prompts, slow motion/pause, reachable range, and next-anchor feedback | Tutorial failure returns to a teaching precondition point rather than entering the normal failure result |
| M10 Pause and restart state flow | P1 | Pause, resume, restart, and return during play | Pause freezes, resume restores, and restart/return clear the current run state | During pause, physics, timing, collection, and failure do not advance |
| M11 Terminal and invalid input locks | P1 | Repeated input during results, pause, no-anchor, and swinging states | The state remains unchanged or gives lightweight rejection feedback | No multiple webs, repeated results, attachment out of nowhere, or restart |
| M12 Moving temporary hang points and rescue | P2 | Attach to a moving target or fall during a race | The temporary anchor point moves and departure detaches the web; rescue returns the player to a safe position but removes momentum | Temporary anchor points must not be permanently reliable like static streetlights; rescue must not be free |
| M13 Atmosphere and feedback polish | P2 | Normal play, collection, failure, and victory | Sound effects, atmospheric objects, rare-candy feedback, and celebration presentation enhance the experience | Atmospheric objects must not obscure core anchor points, candy, or character readings |
| M14 Leaderboard or local results depth | P2 | Open the results entry or submit/view results | Displays leaderboard or local-result state | When an external service is unavailable, the main result must remain readable |

## 8. Coverage Notes and Cut Scope

The core of P1 coverage is the complete loop of "one-button physics-based swinging -> candy/distance/race objective -> victory, defeat, or score result -> restart." The three modes, tutorial, pause, restart, state locks, and core rejection paths are all part of the playability qualification threshold.

P2 allows enhancements with moving temporary anchor points, race rescue, leaderboard, story page, audio, candy rarity tiers, neighborhood pedestrians, falling leaves, speech bubbles, and celebration sequences. They can improve completeness, but cannot replace the P1 hold/release swinging causal chain.

Cut scope includes creator tools, runtime parameter tuning, external account profiles, server leaderboard dependencies, fixed branded assets, fixed exact copy, fixed art assets, and exact numerical values. The finished product may use different art, layout, and parameters as long as the player-visible semantics of input, feedback, state flow, victory/defeat, and progress hold.
