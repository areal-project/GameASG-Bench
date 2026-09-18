# Kick Skills TDD Contract

## Scope

This file defines the public, portable test contract for Kick Skills. It only covers player-level actions, legal scenario setup, stable snapshot summaries, and externally observable postconditions derived from `game-spec.md` and `design-doc.md`.

The contract must not require a specific engine, physics formula, render tree, DOM structure, asset name, private variable, source function, fixed canvas size, fixed coordinate, or exact UI copy. Tests may use semantic regions and screen-space summaries returned by the public contract, then dispatch real mouse/touch input against those regions.

## Public Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  loadScenario(name, options): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot
}
```

`reset(options)` starts a fresh local run. It may preserve long-term owned cosmetics and saved coins unless `options.clearPersistence === true`.

`loadScenario(name, options)` may only create legal pre-shot or legal non-result panel states described below. It must not pre-award score, coins, goals, misses, collisions, purchases, completed levels, or terminal outcomes. Every loaded gameplay scenario must be triggerable by ordinary play from a fresh run, and the following postcondition must still require player-level action.

`input(action)` represents a player action or a semantic wrapper around one. It must not directly set result fields. It returns the latest `Snapshot` after the action is accepted, rejected, or has advanced to a stable externally observable state.

`getSnapshot()` returns a stable product-level summary. It must not expose internal object graphs, private identifiers, implementation-only timers, exact asset paths, or algorithm-specific values.

All methods must be idempotent in the sense that an invalid action returns a valid snapshot and a rejection reason without throwing.

## Scenario Schema

`loadScenario(name)` supports these legal preconditions:

| Name | Legal State | Player-Level Trigger For Result |
|---|---|---|
| `fresh_start` | Loading/tutorial/start gate or initial ready state, depending on saved tutorial state | `start` enters play; shooting while blocked is rejected |
| `basic_target_ready` | Ready-to-shoot basic target challenge, no active shot result | `setContactPoint`, `dragShot`, and release can produce goal or miss |
| `wall_obstacle_ready` | Ready challenge with a visible blocking wall or equivalent obstacle | Low/direct shot can collide or fail; high/curved shot can attempt clearance |
| `moving_target_ready` | Ready challenge with a target whose visible position changes over time | Waiting or shooting after aim timing can change target relation and result |
| `goalkeeper_ready` | Ready challenge with a visible goalkeeper threat | Direct or poorly placed shot can be blocked; shaped shot can attempt a goal |
| `hole_gate_ready` | Ready challenge with a visible gate/opening that constrains the valid route | Shot through the opening can score; shot into the gate surface can collide/fail |
| `one_attempt_ready` | A legal ready challenge with one remaining attempt and no active result | A miss can trigger terminal result; a goal can avoid immediate terminal failure |
| `shop_open_ready` | Shop panel open from a ready non-terminal challenge | `selectShopItem`, `buySelected`, `equipSelected`, `closePanel`; shooting is rejected |
| `settings_open_ready` | Settings panel open from a ready non-terminal challenge | `toggleSetting`, reset-confirm actions, `closePanel`; shooting is rejected |
| `leaderboard_open_ready` | Leaderboard panel open from a ready non-terminal state | `closePanel`; local restart/play remains available after service empty/error states |

Scenario names are semantic. An implementation may map several names to the same representative level if the visible challenge type and trigger/result contract are preserved.

## Action Schema

Each action has a `type` and may return `lastAction.ok = false` with a stable `reason` when rejected.

| Action | Required Fields | Semantics |
|---|---|---|
| `start` | none | Dismiss tutorial/start gate and enter a ready shooting state |
| `restart` | none | Start a fresh run from terminal or in-play restart control |
| `confirmNext` | none | Confirm a goal result and advance to the next ready challenge |
| `confirmRetry` | none | Continue after a miss when attempts remain |
| `openPanel` | `panel: shop|settings|leaderboard` | Open a non-shooting panel from a legal state |
| `closePanel` | `panel: shop|settings|leaderboard|any` | Close a panel and restore the prior legal state |
| `setContactPoint` | `x: left|center|right`, `y: low|middle|high` | Move the ball contact point for the next shot without firing |
| `dragShot` | `pull: straightBack|leftBack|rightBack|weak`, optional `power: weak|medium|strong` | Press from the ball/playfield, pull backward, and release. Launch trend is opposite the pull direction |
| `beginDrag` | same fields as `dragShot` except release | Start a shot drag and expose preview/charge state without launching |
| `updateDrag` | `pull`, optional `power` | Change held drag vector/power and update preview |
| `releaseDrag` | none | Release the currently held drag; valid charge launches, weak charge cancels |
| `wait` | `duration: short|medium|long` | Let moving targets, goalkeeper, ball flight, panels, or result states settle |
| `selectShopItem` | `item: default|affordable|owned|unownedExpensive|next` | Select or preview a semantic shop item |
| `buySelected` | none | Buy selected item if affordable and unowned |
| `equipSelected` | none | Equip selected item if owned |
| `toggleSetting` | `setting: crowd|largeSpectators|scoreboard|performance` | Toggle a presentation setting |
| `requestStorageReset` | none | Open reset confirmation without changing saved progress |
| `confirmStorageReset` | `confirm: true|false` | Apply or cancel long-term reset |

For real-input checks, the snapshot must provide enough semantic screen regions to perform equivalent mouse/touch actions: playfield bounds, ball center or bounds, contact-control bounds, panel controls, and major target/obstacle/hole regions when visible.

## Snapshot Schema

`Snapshot` is a JSON-safe object with these stable fields. Numeric fields may be approximate but must be monotonic or relationally meaningful where specified.

```javascript
{
  phase: "loading" | "tutorial" | "ready" | "aiming" | "flying" | "goalResult" | "missResult" | "terminal" | "panel",
  screen: "loading" | "start" | "play" | "goalResult" | "missResult" | "gameOver" | "shop" | "settings" | "leaderboard",
  activePanel: "none" | "tutorial" | "goalResult" | "missResult" | "terminal" | "shop" | "settings" | "leaderboard" | "resetConfirm",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  canShoot: boolean,
  canRestart: boolean,

  run: {
    challengeIndex: number,
    challengeCount: number,
    challengeType: "basicTarget" | "wallObstacle" | "movingTarget" | "goalkeeper" | "holeGate" | "mixed" | "unknown",
    attemptsRemaining: number,
    score: number,
    coins: number,
    result: "none" | "goal" | "miss" | "gameOver" | "complete"
  },

  shot: {
    state: "idle" | "charging" | "flying" | "resolved",
    validCharge: boolean,
    powerBand: "none" | "weak" | "medium" | "strong",
    pullDirection: "none" | "straightBack" | "leftBack" | "rightBack",
    launchTrend: "none" | "center" | "left" | "right",
    heightTrend: "none" | "low" | "medium" | "high",
    curveTrend: "none" | "left" | "right",
    resolution: "none" | "goal" | "miss" | "blocked" | "outOfBounds" | "stalled"
  },

  contact: {
    x: "left" | "center" | "right",
    y: "low" | "middle" | "high",
    shotType: "neutral" | "low" | "chip" | "curveLeft" | "curveRight" | "mixed"
  },

  preview: {
    visible: boolean,
    revision: number,
    powerBand: "none" | "weak" | "medium" | "strong",
    directionTrend: "none" | "center" | "left" | "right",
    heightTrend: "none" | "low" | "medium" | "high",
    obstacleRisk: "none" | "clear" | "interrupted" | "groundRisk" | "unknown"
  },

  ball: {
    visible: boolean,
    screenX: number,
    screenY: number,
    heightBand: "ground" | "low" | "mid" | "high",
    motionRevision: number,
    flightRevision: number,
    spinRevision: number,
    trailVisible: boolean,
    shadowVisible: boolean,
    lastLandingTrend: "none" | "left" | "center" | "right"
  },

  scene: {
    playfield: { x: number, y: number, width: number, height: number },
    ballBounds: { x: number, y: number, width: number, height: number },
    contactControlBounds: { x: number, y: number, width: number, height: number } | null,
    targetZones: Array<{ kind: "goal" | "target" | "opening", screenX: number, screenY: number, visible: boolean }>,
    obstacleCounts: { walls: number, goalkeepers: number, holeGates: number, movingTargets: number },
    worldMotionRevision: number,
    renderReady: boolean,
    primaryViewNonBlank: boolean
  },

  resultPanel: {
    visible: boolean,
    kind: "none" | "goal" | "miss" | "terminal",
    scoreDelta: number,
    scoreBreakdownKinds: Array<"goal" | "target" | "precision" | "curve" | "power" | "post" | "obstacleClear" | "height" | "coin">,
    coinsDelta: number,
    mutuallyExclusive: boolean
  },

  shop: {
    visible: boolean,
    selectedItem: "none" | "default" | "owned" | "affordable" | "unownedExpensive" | "other",
    selectedOwned: boolean,
    selectedAffordable: boolean,
    equippedChangedRevision: number,
    previewRevision: number
  },

  settings: {
    visible: boolean,
    resetConfirmVisible: boolean,
    presentationRevision: number,
    persistenceRevision: number
  },

  leaderboard: {
    visible: boolean,
    state: "none" | "loading" | "entries" | "empty" | "error"
  },

  lastAction: {
    ok: boolean,
    type: string,
    reason: "none" | "blockedOverlay" | "notReady" | "weakDrag" | "inFlight" | "terminal" | "insufficientCoins" | "unownedItem" | "invalidAction" | "unavailable"
  }
}
```

Snapshot fields may include additional public summaries, but tests must not require extra fields unless this TDD is updated first.

## Field Invariants

- `run.challengeCount` must be at least 5 for P1 representative challenges. A full fifteen-challenge sequence is P2.
- `run.attemptsRemaining`, `run.score`, and `run.coins` must never be negative.
- `phase === "ready"` implies `canShoot === true`, no blocking overlay, and no active goal/miss/terminal panel.
- `phase === "panel"` or any blocking `activePanel` implies `canShoot === false`.
- `phase === "flying"` implies `canShoot === false`, `shot.state === "flying"`, and ordinary `dragShot` is rejected.
- Goal and miss result panels are mutually exclusive. `resultPanel.mutuallyExclusive` must be true whenever a result panel is visible.
- A weak drag cannot reduce attempts, increase score, award coins, advance challenge, or create a result panel.
- Contact-point actions cannot launch a shot, score, consume attempts, or advance challenge.
- Restart clears transient shot/result/preview/collision feedback and resets score, attempts, and challenge index for the active run.

## Feature Contract Matrix

| GDD Feature | Contract Trigger | Required Observable Result |
|---|---|---|
| M1 Start/tutorial gating | `reset`, `loadScenario("fresh_start")`, `input({type:"start"})`, blocked `dragShot` before start | `activePanel`/`overlayBlocking` changes from blocking to playable; blocked shots leave score, attempts, and challenge unchanged |
| M2 Pull-back drag shot | `beginDrag`/`updateDrag`/`releaseDrag` or `dragShot` from ready state | Preview appears during valid charge; release changes `phase` to `flying`; left-back and right-back pulls produce opposite `launchTrend` or `lastLandingTrend` |
| M3 Contact-point shaping | `setContactPoint` then comparable `dragShot` | Contact summary changes immediately without firing; later shot changes `heightTrend` or `curveTrend` relative to neutral contact |
| M4 Dynamic trajectory preview | `beginDrag`, `updateDrag` with changed pull/power/contact | `preview.visible === true`, `preview.revision` changes, and preview direction/power/height/risk summaries update; preview clears after release |
| M5 Flight and readable scene | Valid `dragShot`, then `wait` | `ball.motionRevision`/`flightRevision` increases, screen position or height band changes, trail/shadow/spin evidence appears where applicable, and primary view is nonblank |
| M6 Goal/target/scoring | Legal ready scenario plus player-level shot that resolves as goal | Goal result panel appears, score increases, breakdown contains goal/target/performance categories, optional coins are synced, and the shot resolves once |
| M7 Miss/attempt/retry | Legal ready scenario plus player-level missed/blocked/out-of-range shot | Miss result appears, attempts decrease, score does not gain goal points, challenge does not advance before retry/next action |
| M8 Representative challenges | `confirmNext` after goals or `loadScenario` for representative ready states | Snapshot exposes basic target, wall, moving target, goalkeeper, and hole-gate challenge types with matching visible obstacle counts/motion |
| M9 Terminal and restart | `loadScenario("one_attempt_ready")` then a player-level miss, or ordinary progression through the run; `restart` | Terminal rejects shooting; restart returns to a fresh ready/start state with run score reset and playability restored |
| M10 Collision/obstacle feedback | Obstacle scenario plus low/direct or mistimed shot | Resolution or impact summary changes to blocked/miss/deflected; ball path/motion revision changes; collision is tied to scoring/failure outcome |
| M11 HUD/state sync | Any score, miss, advance, coin, panel, or restart action | Snapshot run fields and visible result/panel state stay aligned and non-negative |
| M12 Full challenge set | Continue successful progression beyond P1 representatives | P2: challenge count and types cover up to the full staged set without replacing P1 representatives |
| M13 Shop progression | `openPanel("shop")`, select/buy/equip/close | Shop blocks shooting, preview changes on selection, purchase consumes coins only when affordable, equip requires ownership, close restores play state |
| M14 Settings/persistence controls | `openPanel("settings")`, `toggleSetting`, reset confirm/cancel | Settings block shooting; toggles change presentation revision; cancel reset preserves progress; confirm reset clears long-term progress summaries |
| M15 Leaderboard | `openPanel("leaderboard")`, wait, close | Leaderboard reaches entries/empty/error/loading state without blocking local restart or continued play after close |

## External Postconditions

L2 checks may combine the public snapshot with browser-standard observations. The following user-visible postconditions are part of the contract:

- The primary play view must be visibly nonblank and contain a readable soccer shooting scene when `scene.renderReady === true`.
- Real mouse or touch drag from the semantic ball/playfield region must produce the same downstream state class as `input({type:"dragShot"})`.
- Real interaction with semantic panel controls must open/close panels and must not accidentally shoot.
- HUD or visible panels must reflect challenge, attempts, score, coins, result, and restart availability consistently with the snapshot.
- During blocking overlays, result panels, terminal screens, shop, settings, and leaderboard, the playfield must not accept ordinary shooting input.
- After advancing, retrying, or restarting, stale preview, trail, landing mark, result, and collision summaries must be cleared.

## Anti-Cheat And Rejection Rules

The public contract must not provide or accept:

- Direct setters for score, coins, attempts, challenge completion, goal, miss, collision, hit target, flight outcome, or purchase ownership.
- Scenario setup that already contains the result under test, such as a pre-scored goal, pre-consumed miss, pre-collided ball, pre-awarded coins, pre-purchased item, or already-completed challenge.
- Private implementation names, source selectors, fixed DOM IDs, fixed pixel coordinates, exact text, asset names, physics constants, render-loop steps, or engine-specific objects as required behavior.
- Passing only because `input()` returns `{ ok: true }`; every accepted core action must produce a corresponding observable snapshot or external postcondition.
- A `dragShot` while blocked, terminal, in flight, or below charge threshold that mutates score, attempts, challenge, coins, or result state.

## Scenario Review Notes

All gameplay scenarios are legal pre-shot or legal post-panel states. They are designed to make a player action trigger the observed result:

- `basic_target_ready`, `wall_obstacle_ready`, `moving_target_ready`, `goalkeeper_ready`, and `hole_gate_ready` require `setContactPoint` and/or `dragShot` to produce goal, miss, movement, collision, or scoring observations.
- `one_attempt_ready` does not force game over; it only makes a subsequent player-level miss capable of reaching terminal state.
- Goal, miss, and terminal states must be reached by player-level shot actions or ordinary progression before `confirmNext`, `confirmRetry`, terminal-lock, or restart behavior is checked.
- Panel scenarios only open legal non-shooting UI states; they do not pre-buy, pre-equip, reset storage, or alter leaderboard results.
