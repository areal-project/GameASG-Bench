# Spider-Kid's Halloween Haul TDD Contract

## 1. Scope

This file defines the portable public test contract for the player-visible behavior already specified in `game-spec.md` and `design-doc.md`. It does not define engine structure, rendering technology, private state, exact physics constants, fixed coordinates, exact UI text, specific asset names, or a required DOM tree.

All actions below are player-level actions. Test adapters may implement them through real browser input or through the public `window.__gameTest` facade, but they must not directly set score, candy totals, collision flags, win/loss flags, web attachment, boost, rescue completion, or collected-item state.

## 2. Public Facade

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  getSnapshot(): Snapshot,
  input(action): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

Method semantics:

- `reset(options?)`: returns the game to a stable title/menu state unless `options.mode` is provided. If a mode is provided, it may enter that mode through the same state transition as a player selecting it. It must clear transient web, tutorial, rescue, pause, result, score, collectible, opponent, and overlay state from the prior run.
- `getSnapshot()`: returns a stable, implementation-neutral summary of the current visible game state.
- `input(action)`: applies one player-level action and returns the resulting snapshot after any immediate state transition. For time-dependent actions, `durationMs` may be supplied to represent holding a key/pointer or waiting.
- `loadScenario(name, options?)`: creates only legal precondition states from the Game Spec/GDD. It must not preload the outcome being tested.

Returned snapshots should include `lastAction` with `{ ok, accepted, reason? }` when an action is rejected. Rejected actions must not throw.

## 3. Action Schema

`action.type` candidates:

| Type | Required fields | Semantics |
|---|---|---|
| `press` | `control` | Player starts holding the primary web control. `control = pointer | touch | space | primary`. |
| `release` | `control` | Player releases the primary web control. |
| `hold` | `control`, `durationMs` | Player holds the primary web control for a duration; equivalent to press, time passing, then optional continued pressed state. |
| `wait` | `durationMs` | Time passes with no new player command. |
| `chooseMenu` | `target` | Player activates a semantic menu choice. `target = start | tutorial | story | results | back | title`. |
| `chooseMode` | `mode` | Player chooses a playable mode. `mode = candy | endless | race`. |
| `pause` | none | Player opens pause while playing. |
| `resume` | none | Player resumes from pause. |
| `restart` | none | Player restarts from pause or result. |
| `returnTitle` | none | Player returns to title/menu from pause or result. |
| `tutorialContinue` | none | Player advances a tutorial prompt that is waiting for confirmation. |

Action rules:

- `press` may start web shooting only when playfield input is allowed and the player is not already attached, already shooting, paused, rescued, or in a terminal result.
- `release` may detach only when the player is currently attached and swinging. If no web is attached, it must not create a jump, dash, score, win, or collection.
- `hold` is not a throttle. Any movement benefit must come from legal web attachment and subsequent swing/release behavior.
- `wait` may advance physics, timer, opponent progress, world generation, and failures only when the game is playing and not paused or terminal.
- Menu and state actions must be semantic. Tests must not depend on fixed button text, fixed element ids, or a fixed layout.

## 4. Scenario Schema

`loadScenario(name)` candidates are legal preconditions only:

| Scenario | Legal precondition | Valid trigger families | Forbidden shortcut |
|---|---|---|---|
| `title` | Title/menu visible, no active run. | `chooseMenu(start)`, `chooseMenu(tutorial)`, `chooseMenu(results)` | Do not mark a mode as already selected unless `reset({mode})` is used. |
| `mode_select` | Mode choices visible, playfield not active. | `chooseMode(candy|endless|race)`, `chooseMenu(back)` | Do not spawn a playing run without a mode choice. |
| `candy_start` | Candy target mode at its normal start: score and collected count at initial values, route ahead includes reachable lamp anchors and possible collectibles. | `press/hold/release/wait`, `pause` | Do not pre-attach the web, pre-collect candy, or pre-complete distance. |
| `endless_start` | Endless mode at its normal start with no finish result available. | `press/hold/release/wait`, `pause` | Do not provide a terminal win setup. |
| `race_start` | Race mode at its normal start with opponent active, timer at initial value, finish not reached. | `press/hold/release/wait`, `pause` | Do not set player/opponent finish or rescue completed. |
| `reachable_anchor` | Playing state with the player airborne or falling and a forward reachable anchor visible; the web is not attached. | `press` or `hold` | Do not start already attached or already shooting. |
| `no_reachable_anchor` | Playing state with no forward reachable anchor in range; playfield input is allowed. | `press`, `release`, `wait` | Do not hide a reachable anchor while claiming it is unavailable. |
| `attached_swing` | Playing state after a legal attach, with the player visibly swinging on an anchor and no result state. | `hold`, `release`, `wait` | Do not inject release velocity or score before the release action. |
| `collectible_route` | Candy or endless mode with one or more collectibles ahead on a plausible swing or flight path, not yet collected. | `press/hold/release/wait` chain | Do not place the player already overlapping the collectible or mark it collected. |
| `near_goal_before_finish` | Candy target mode with progress close to, but below, the destination and a legal route to continue. | normal swing chain | Do not set victory or completed progress until player-driven movement crosses the goal. |
| `low_fall_risk` | Non-race playing state with the player above the failure boundary, falling or low enough that missed input can lead to failure. | `wait`, invalid `press`, or missed swing sequence | Do not start below the boundary or already failed. |
| `race_midcourse` | Race mode in progress with player and opponent short of the finish and timer active. | `wait`, normal swing chain, `pause` | Do not set a winner or loser. |
| `race_fall_risk` | Race mode with the player at risk of falling before the race is terminal. | `wait` or missed swing sequence | Do not begin with rescue already completed or with a terminal result. |
| `tutorial_start` | Tutorial entered from the menu and waiting at the first prompt or first practice setup. | `tutorialContinue`, `press/hold/release` | Do not skip to completed tutorial. |
| `paused_play` | A legal playing state after the player used pause. | `resume`, `restart`, `returnTitle`, core web input | Do not advance physics, timer, score, or result during setup. |

If a test needs a scenario not listed here, the missing precondition must first be added to this TDD only if the behavior already exists in `game-spec.md` and `design-doc.md`.

## 5. Snapshot Schema

Required top-level fields:

| Field | Candidate values / shape | Meaning |
|---|---|---|
| `phase` | `booting | title | modeSelect | tutorial | playing | paused | result` | Current coarse state. |
| `mode` | `none | candy | endless | race | tutorial` | Current gameplay mode. |
| `result` | `none | win | fail` | Terminal outcome, if any. |
| `resultReason` | `none | reachedGoal | fell | opponentWon | playerWon` | Public reason for terminal/result state. |
| `canInteractWithPlayfield` | boolean | Whether web input can affect play. |
| `overlayBlocking` | boolean | Whether a visible menu/pause/result/tutorial overlay blocks playfield input. |
| `availableActions` | string array | Semantic controls currently available, e.g. `start`, `pause`, `resume`, `restart`, `returnTitle`, mode choices. |
| `hud` | object | Public HUD summary: score, collected count, progress, timer, opponent status when applicable. |
| `player` | object | Public player summary, described below. |
| `web` | object | Public web summary, described below. |
| `anchors` | object | Visible/semantic anchor summary, described below. |
| `collectibles` | object | Visible collectible summary, described below. |
| `race` | object or null | Race-only opponent/timer/progress summary. |
| `tutorial` | object or null | Tutorial-only prompt/step summary. |
| `world` | object | Render/playfield readiness and visible world summary. |
| `lastAction` | object or null | Most recent action acceptance/rejection summary. |

`player` fields:

- `state = falling | flying | shooting | swinging | rescued | celebrating | inactive`
- `screenX`, `screenY`: approximate visible player center in screen coordinates.
- `worldProgress`: non-decreasing forward progress while the player advances right.
- `speedX`, `speedY`: signed movement summary; only relational changes are testable.
- `visible`: boolean.

`web` fields:

- `state = idle | shooting | attached`
- `visible`: boolean.
- `anchorAhead`: boolean when attached or shooting toward a forward target.
- `anchorScreenX`, `anchorScreenY`: present only when shooting or attached.
- `connectionRevision`: increments or changes when the visible web line appears, attaches, or disappears.

`anchors` fields:

- `visibleCount`: number of currently visible possible hang targets.
- `reachableForwardCount`: count of forward targets currently reachable by a legal press.
- `nearestReachable`: nullable semantic point `{ screenX, screenY, ahead, highlighted }`.
- `revision`: changes when relevant anchors enter, leave, or change reachability/highlight state.

`collectibles` fields:

- `visibleCount`: current visible collectible count in modes where collectibles apply.
- `nearest`: nullable semantic point `{ screenX, screenY }`.
- `collectedCount`: collected total for the current run.
- `revision`: changes when visible collectibles spawn, leave, or are collected.

`hud` fields:

- `score`: non-negative integer.
- `collectedCount`: non-negative integer.
- `progress`: number in `[0, 1]` for finite-goal modes; `null` when no finish progress applies.
- `timerMs`: non-negative integer for race mode; `null` otherwise.
- `distance`: non-negative progress summary.
- `resultSummaryVisible`: boolean.

`race` fields when `mode = race`:

- `timerMs`: non-negative integer while race is active.
- `playerProgress`, `opponentProgress`: numbers in `[0, 1]`.
- `opponentVisible` or `opponentDirection = ahead | behind | onscreen | unknown`.
- `rescueState = none | approaching | carrying | dropping | completed`.

`tutorial` fields when `phase = tutorial`:

- `step`: non-negative ordinal or semantic id.
- `waitingFor = continue | press | release | secondAttach | none`.
- `promptVisible`: boolean.
- `practiceResetCount`: non-negative integer that increases when tutorial failure resets to a teaching point.
- `completed`: boolean.

`world` fields:

- `playfieldReady`: boolean.
- `playfieldBounds`: runtime bounds of the primary playable area.
- `renderRevision`: changes when the visible playfield changes after gameplay actions.
- `environmentMotionRevision`: changes as the street/world scrolls or living-world P2 elements move.

## 6. Feature Contract Matrix

| GDD feature | Contract trigger | Required observable result |
|---|---|---|
| M1 Menu to mode flow | `reset()`, `chooseMenu(start)`, `chooseMode(mode)` | `phase` moves from `title` to `modeSelect` to `playing`; `mode` matches choice; `overlayBlocking=false` and `canInteractWithPlayfield=true` once playing. |
| M2 One-button web input | `press/hold/release` through pointer, touch, and space variants | Equivalent controls cause the same accepted/rejected web state transitions; release without attachment is rejected or no-op without jump, score, or result changes. |
| M3 Reachable lamp attachment | `loadScenario(reachable_anchor)`, then `press` or `hold` | `web.state` becomes `shooting` then `attached`; player state becomes `swinging`; anchor is ahead and visible; render/web revision changes. |
| M3 invalid attachment | `loadScenario(no_reachable_anchor)`, then `press` | No `attached` web appears; player does not teleport, score does not change, and `lastAction` reports rejection or a no-op. |
| M4 Swing and release feel | `loadScenario(attached_swing)`, `wait`, then `release` | While attached, player position changes along an arc and web remains visible; after release, `web.state=idle`, player becomes `flying` or `falling`, screen/world progress or signed speed changes are consistent with release motion. |
| M5 Candy collection | `loadScenario(collectible_route)`, then normal swing chain through a collectible | At least one collectible disappears, `score` or `collectedCount` increases, collectible revision changes, and HUD/stat summary matches snapshot. |
| M6 Candy target progression | `chooseMode(candy)` or `near_goal_before_finish`, then normal swing chain | Progress/distance increases during successful movement; crossing the finite goal produces `phase=result`, `result=win`, control lock, and stable result summary. |
| M7 Endless score chase | `chooseMode(endless)`, normal swing chain, then fall-risk failure path | No finite win is produced by distance alone; score/distance can grow, and falling produces `phase=result`, `result=fail`, with final stats visible. |
| M8 Race mode | `chooseMode(race)` or `race_midcourse`, `wait` and swing chain | Timer and opponent progress advance while playing; player/opponent finish produces one terminal result; race summary is visible. |
| M8 race rescue P2 | `race_fall_risk`, then missed swing or wait | If rescue is implemented, `rescueState` progresses visibly and player is returned with lost momentum; if not implemented, behavior must still satisfy race result rules declared for the implementation. |
| M9 Tutorial | `chooseMenu(tutorial)`, `tutorialContinue`, then prompted web actions | Tutorial enters `phase=tutorial`, exposes waiting prompts, advances after correct press/release/second attach, and failure increases `practiceResetCount` without ordinary result failure. |
| M10 Pause/restart/return | `pause`, core input while paused, `resume`, `restart`, `returnTitle` | Paused state freezes timer, progress, score, collection, failure, and movement summaries; resume continues; restart clears current-run transient state; return title exposes menu state. |
| M11 Terminal and invalid locks | After reaching win/fail through `near_goal_before_finish`, `low_fall_risk`, or race finish order, send core input; from `attached_swing`, send repeated `press` | Result state remains stable under web input; repeated press while attached does not switch anchors or create multiple web connections. |
| M12 P2 temporary hang/rescue | scenario with visible temporary target if implemented, then `press/hold/wait/release` | Temporary target can be attached only while reachable and visible; leaving or timeout detaches visibly without permanent free support. |
| M13 P2 atmosphere/feedback | normal play, collect, result, idle wait | Optional feedback may change render/audio/world revisions, but it must not obscure core player, anchor, collectible, HUD, or result observability. |
| M14 P2 results depth | `chooseMenu(results)` or result flow | Results/leaderboard/local score panel is reachable or clearly unavailable; main result summary remains visible without external service dependency. |

## 7. External Postconditions

Portable tests may combine snapshot assertions with browser-standard observations:

- When `phase=playing`, the primary playfield must be visible and nonblank enough to distinguish player, anchors, collectibles where applicable, and HUD/result state.
- When `overlayBlocking=true`, core playfield input must not change physics, timer, score, collection, result, or web state.
- When `overlayBlocking=false` and `canInteractWithPlayfield=true`, real pointer/touch/keyboard input should be able to trigger the same player-level effects as the corresponding `input(action)`.
- HUD-visible score, collected count, progress, timer, result, and pause state must agree with the snapshot summaries, but exact text and layout are not part of the contract.
- Screen-space fields such as player, anchor, collectible, and playfield bounds are semantic runtime coordinates for adaptive input. Tests must not assume fixed resolution, fixed offsets, or fixed spawn positions.

## 8. Invariants and Rejection Rules

- Score, collected count, distance, progress, and timer are never negative.
- Candy/collectible rewards require player-driven contact through a legal movement chain; `loadScenario` must not grant reward.
- Victory requires player-driven progress crossing the finite-goal condition; `loadScenario(near_goal_before_finish)` must remain below the goal.
- Failure requires player-driven falling/missed recovery or a legal opponent finish; `loadScenario(low_fall_risk)` and `race_fall_risk` must not start terminal.
- Pause freezes gameplay-sensitive summaries until resume/restart/return.
- Terminal result locks core web input and keeps final score/count/time stable.
- Race mode does not use collectibles as its main objective; race success/failure comes from finish order and timer/progress.
- Repeated press while shooting or attached cannot create multiple simultaneous web connections or change to a new anchor without a legal release/re-press chain.
- No implementation may satisfy core movement by changing only labels or counters; web state, player movement, render/world revision, and HUD/state summaries must show the same causal result.

## 9. Review Checklist

- TDD actions are player-level and do not expose private functions, private variables, selectors, DOM structure, asset names, or fixed coordinates.
- Every scenario is a legal precondition and lists the player action family that must trigger the observed result.
- No scenario directly awards score, collision, boost, rescue completion, victory, failure, attachment, or collection.
- Every P1 mechanism has a trigger-to-observable mapping in the Feature Contract Matrix.
- Snapshot fields are stable semantic summaries suitable for multiple implementations.
