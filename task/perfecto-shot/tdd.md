# Perfecto Shot TDD Contract

## Scope

This file defines the public, portable test contract for Perfecto Shot. It only covers behavior already specified in `game-spec.md` and `design-doc.md`: menu flow, slingshot aiming, continuous ball motion, matching baskets, multi-target completion, shot count, scoring feedback, failure/retry, blocking overlays, and progression.

The contract must not require a particular engine, source file layout, private function, private variable, DOM tree, canvas size, fixed coordinate, exact physics formula, or copied text. Implementations may choose their own UI and rendering, but they must expose the public semantic contract below.

## Public Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?: ResetOptions): Snapshot,
  getSnapshot(): Snapshot,
  input(action: Action): Snapshot | ActionResult,
  loadScenario(name: ScenarioName): Snapshot | ActionResult
}
```

`reset()` returns the game to a fresh boot state unless `options.startLevel` is provided. `startLevel` is a public level number or semantic level id, not a private data key.

`getSnapshot()` returns a stable gameplay summary. It must not expose mutable internal object graphs.

`input(action)` performs a player-level action or waits for normal time to pass. It must return either a full `Snapshot` or `{ ok, reason?, snapshot }`. `{ ok: true }` alone is not enough.

`loadScenario(name)` may load only legal precondition layouts described below. It must not pre-apply the result being tested: no direct win, direct reward, direct basket success, direct collision result, direct launch, direct failure, direct shot count edit, or direct terminal panel setup.

## ResetOptions

```typescript
type ResetOptions = {
  startLevel?: number | string
}
```

`startLevel` may start a playable level from its initial layout. It may not mark balls as completed, award stars, create a failed state, or alter shot count.

## Action Schema

All action coordinates are semantic or screen-space values derived from the current snapshot, not fixed constants.

```typescript
type Action =
  | { type: "start" }
  | { type: "openPause" }
  | { type: "resume" }
  | { type: "openLevelSelect" }
  | { type: "closePanel" }
  | { type: "selectLevel", level: number | string }
  | { type: "retry" }
  | { type: "nextLevel" }
  | { type: "tapBall", ballId: string }
  | { type: "dragBall", ballId: string, pull: PullVector, release?: boolean }
  | { type: "dragFromPoint", start: ScreenPoint, end: ScreenPoint, release?: boolean }
  | { type: "dragEmpty", start: ScreenPoint, end: ScreenPoint }
  | { type: "cancelAim" }
  | { type: "wait", durationMs?: number, until?: WaitCondition };

type PullVector = {
  dx: number,
  dy: number,
  strength?: "short" | "medium" | "long"
};

type ScreenPoint = { screenX: number, screenY: number };

type WaitCondition =
  | "aimingVisible"
  | "ballMoving"
  | "ballSettled"
  | "levelComplete"
  | "levelFailed"
  | "overlayVisible"
  | "playfieldReady";
```

`dragBall.pull` is the player's pull from the ball toward the held pointer. Releasing a valid pull must launch the selected ball in the opposite screen-space direction. For example, a negative `dx` pull means the player pulled left of the ball and the initial visible launch trend should move right; a positive `dy` pull means the player pulled below the ball and the launch trend should move upward.

`strength: "short"` represents a tap or too-small drag and must cancel rather than launch. `medium` and `long` are valid player pulls; `long` may reach the game's pull cap but must not grow without bound.

`wait` only advances normal gameplay time and observation. It must not settle, score, fail, or complete the level by direct state mutation.

## Scenario Names

Scenarios are legal starting situations. Each must be reachable as a normal level layout or equivalent initial level state.

| Scenario | Legal precondition | Trigger families that may produce the observed result | Forbidden setup |
|---|---|---|---|
| `fresh_boot` | Lobby/start screen before a level is playing | `start`, `openLevelSelect`, `selectLevel` | No preloaded terminal panel or modified progress |
| `simple_shot_start` | A playable level with at least one unscored ball and its matching basket visible | `dragBall`, `dragFromPoint`, `wait` | No pre-launched ball, no scored basket, no existing completion |
| `ricochet_start` | A playable level where obstacle or wall contact is part of a possible route | `dragBall`, `wait` | No precomputed collision, no ball already touching its final basket as success |
| `ramp_start` | A playable level where a ramp or sloped surface can affect a launched ball | `dragBall`, `wait` | No direct velocity injection, no pre-marked ramp contact |
| `multi_target_start` | A playable level with multiple balls or multiple color-matched baskets, all initially unresolved | `dragBall`, `tapBall`, `wait` | No completed subset, no occupied basket, no terminal result |
| `wrong_color_risk_start` | A legal color-matching level where a wrong-color basket can be approached before all targets are solved | `dragBall`, `wait`, `retry` | No ball pre-placed as wrong-color success or failure |
| `out_of_bounds_risk_start` | A playable level where an ordinary shot can leave the bottom of the playfield | `dragBall`, `wait`, `retry` | No pre-failed state, no removed ball |
| `near_completion_start` | A legal level start or reset state from which a player shot can complete the remaining required target chain | `dragBall`, `wait`, `nextLevel`, `retry` | No completed level panel, no awarded stars before player action |
| `menu_flow_start` | A playable level with pause, retry, and level select controls available | `openPause`, `resume`, `openLevelSelect`, `closePanel`, `selectLevel`, `retry` | No hidden blocking overlay at load unless opened by action |

If an implementation cannot supply a named scenario from its level set, `loadScenario` must return `ok:false` with a reason, and checks may use another scenario that covers the same GDD mechanism. A missing P1 scenario is still a coverage risk for generated implementations.

## Snapshot Schema

```typescript
type Snapshot = {
  phase: Phase,
  screen: Screen,
  result: Result,
  overlay: OverlayState,
  canInteractWithPlayfield: boolean,
  level: LevelSummary,
  shotCount: number,
  stars?: number | null,
  playfield: PlayfieldSummary,
  aim?: AimSummary | null,
  balls: BallSummary[],
  baskets: BasketSummary[],
  obstacles: ObstacleSummary[],
  feedback: FeedbackSummary,
  controls: ControlSummary,
  revision: RevisionSummary
};

type Phase = "boot" | "lobby" | "ready" | "aiming" | "moving" | "paused" | "levelSelect" | "success" | "failed";
type Screen = "lobby" | "playing" | "pauseMenu" | "levelSelect" | "success" | "failed";
type Result = "none" | "success" | "failed" | "allComplete";

type OverlayState = {
  active: boolean,
  kind: "none" | "pause" | "levelSelect" | "success" | "failed" | "lobby",
  blocksPlayfield: boolean
};

type LevelSummary = {
  id: number | string,
  index?: number,
  total?: number,
  routeType?: "direct" | "ricochet" | "ramp" | "multiTarget" | "mixed",
  targetCount: number,
  completedTargetCount: number
};

type PlayfieldSummary = {
  bounds: Bounds,
  orientation: "portrait" | "landscape" | "square",
  visualReady: boolean
};

type Bounds = {
  screenX: number,
  screenY: number,
  width: number,
  height: number
};

type AimSummary = {
  active: boolean,
  ballId?: string,
  pull?: PullVector,
  predictedPathVisible: boolean,
  strengthLevel?: "none" | "short" | "medium" | "long" | "capped",
  releaseDirection?: DirectionSummary
};

type DirectionSummary = {
  horizontal: "left" | "right" | "none",
  vertical: "up" | "down" | "none"
};

type BallSummary = {
  id: string,
  color: string,
  state: "ready" | "aiming" | "moving" | "settled" | "inMatchingBasket" | "outOfPlay",
  screenX: number,
  screenY: number,
  bounds: Bounds,
  velocity?: { x: number, y: number, speed: number },
  moving: boolean,
  selectable: boolean,
  completed: boolean,
  lastLaunchDirection?: DirectionSummary,
  motionRevision?: number
};

type BasketSummary = {
  id: string,
  color: string,
  bounds: Bounds,
  openSide?: "top" | "angled" | "unknown",
  occupiedByBallId?: string | null,
  completed: boolean
};

type ObstacleSummary = {
  id: string,
  kind: "wall" | "platform" | "ramp" | "boundary" | "basketWall" | "other",
  bounds: Bounds,
  affectsMotion: boolean
};

type FeedbackSummary = {
  hudVisible: boolean,
  shotCountVisible: boolean,
  levelProgressVisible: boolean,
  aimingGuideVisible: boolean,
  launchFeedbackRevision?: number,
  collisionFeedbackRevision?: number,
  basketFeedbackRevision?: number,
  failureFeedbackVisible: boolean,
  successFeedbackVisible: boolean
};

type ControlSummary = {
  startAvailable: boolean,
  retryAvailable: boolean,
  pauseAvailable: boolean,
  resumeAvailable: boolean,
  levelSelectAvailable: boolean,
  nextAvailable: boolean
};

type RevisionSummary = {
  playfield: number,
  physics: number,
  ui: number
};
```

`id` fields are stable semantic identifiers within a run. They are not source object names and need not persist across page reloads.

`screenX`, `screenY`, and `bounds` describe current player-visible geometry. Tests may use these values to generate player input, but the contract does not prescribe fixed screen coordinates.

`revision` and feedback revision fields are monotonic summaries for visible or gameplay changes. They must change only when the corresponding player-visible state changes.

## Feature Contract Matrix

| GDD feature | Contract trigger | Snapshot outputs | Required postcondition |
|---|---|---|---|
| M1 level entry/reset | `start`, `selectLevel`, `retry`, `reset({startLevel})` | `phase`, `screen`, `level`, `shotCount`, `balls`, `baskets`, `overlay` | Playable level has visible unresolved targets, shot count is reset for a new attempt, terminal overlays are cleared |
| M2 slingshot aiming | `tapBall`, `dragBall` with `release:false`, `dragBall` with valid release | `phase`, `aim`, `shotCount`, selected ball position | Tap/short pull cancels without shot; valid pull shows aim feedback then launches opposite the pull direction |
| M3 continuous motion | valid `dragBall`, then `wait` | `balls[].moving`, `velocity`, `motionRevision`, `revision.physics`, `feedback.collisionFeedbackRevision` | Launched ball moves over time, may change trend after surfaces, and later settles or reaches terminal state |
| M4 matching baskets | valid shots in matching or wrong-color risk scenarios | `baskets`, `balls[].state`, `completedTargetCount`, `result`, `basketFeedbackRevision` | Only stable matching basket entry completes a target; wrong color or unstable contact does not complete the level |
| M5 multi-target completion | `multi_target_start` plus valid shots and waits | `targetCount`, `completedTargetCount`, `result`, `balls`, `baskets` | Partial completion stays non-terminal; all targets completed transitions to success |
| M6 shots/stars | valid release, short release, menu actions, completion | `shotCount`, `stars`, `feedback.shotCountVisible`, `successFeedbackVisible` | Shot count increments once per valid release only; completion exposes rating based on attempt count |
| M7 failure/retry | risky valid shot, `wait`, `retry` | `phase`, `result`, `failureFeedbackVisible`, `overlay`, `balls`, `shotCount` | Leaving bottom/out-of-play produces failed state and blocking feedback; retry restores current level attempt |
| M8 menu blocking | `openPause`, `openLevelSelect`, `closePanel`, attempted drag under overlay | `screen`, `overlay`, `canInteractWithPlayfield`, `controls`, `shotCount` | Blocking overlays prevent launch/state mutation; closing/resuming restores playfield interaction |
| M9 progression | completion trigger, `nextLevel`, `selectLevel` | `level.index`, `level.total`, `routeType`, `controls.nextAvailable`, `result` | Completion allows next level or level selection; loaded layouts expose declared route variety |
| M10 feedback | aiming, launch, collision, basket, success, failure | `feedback`, `revision.playfield`, `revision.ui` | Gameplay events have visible feedback, not snapshot-only state changes |
| M11 optional depth | optional editor/skin actions if implemented | implementation-specific public extension fields | Optional features may be absent; absence must not weaken P1 gameplay contracts |

## External Postconditions

The public snapshot must align with visible player-facing state:

- If `phase` is `ready`, an unresolved selectable ball and matching target information must be visible, and `canInteractWithPlayfield` must be true.
- If `phase` is `aiming`, aim feedback must be visible and associated with exactly one selectable unresolved ball.
- If a valid release occurs, `shotCount` increases by one, the selected ball's visible position or motion summary changes after time advances, and launch feedback is observable.
- If a ball is moving, repeated `wait` observations must show motion progression, collision/route change, settlement, success, or failure; a moving shot may not be represented only as an instant score update.
- If `result` is `success` or `failed`, a blocking result overlay or equivalent result state must be visible and playfield launch input must not mutate the attempt.
- If a pause or level-select overlay is active, `overlay.blocksPlayfield` must be true and drag actions against the playfield must leave shot count, result, and ball states unchanged.
- HUD or equivalent status output must expose level progress and shot count during play, and completion must expose shot count plus a one-to-three-star or equivalent rating.

## Rejection and Invariants

- Unknown actions, malformed actions, invalid ball ids, and out-of-phase actions must return `ok:false` or leave the snapshot unchanged without throwing.
- `shotCount` is non-negative and increases only on valid release.
- `completedTargetCount` is between `0` and `targetCount`.
- `result` remains `none` until the declared success or failure condition is reached by player-level action and normal time.
- A completed or out-of-play ball is not selectable for another launch in the same attempt.
- A moving ball cannot be relaunched until the game exposes it as settled and selectable again.
- Retrying a level clears aim state, moving state, terminal result, temporary feedback, and basket occupancy for that attempt.
- Opening or closing menus does not by itself launch, score, fail, or complete a level.

## Anti-Cheat Setup Rules

Tests and implementations must not use the public contract to:

- set a ball directly into a basket;
- mark a basket occupied or a target complete;
- set `shotCount`, `stars`, `result`, or terminal overlays directly;
- inject velocity, collision, bounce, boost, damage, reward, or failure outcomes except through player-level pull/release and normal time;
- skip from a precondition scenario directly to success, failure, next level, or reward without the declared trigger;
- expose private arrays, source object references, DOM selectors, engine objects, or implementation-specific update steps.

Every core mechanism must be tested as trigger -> observable result. Fixed schema values may support checks, but they cannot be the only proof that the mechanism works.
