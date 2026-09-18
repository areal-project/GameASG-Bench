# Penalty King TDD Public Test Contract

## Scope

This document defines only Penalty King's public testable surface: player-level inputs, valid prerequisite scenarios, stable snapshot summaries, candidate field values, and externally observable postconditions after input. Gameplay expectations are governed by `game-spec.md` and `design-doc.md`; this contract does not add gameplay or prescribe internal implementation, rendering structure, fixed coordinates, specific algorithms, source-code naming, or a unique UI structure.

The implementation may freely choose Canvas, HTML, SVG, or a combined rendering approach, but it must make two-step shooting, three-direction goalkeeping, score alternation, results, and restart discoverable, triggerable, and observable to the player.

## Public Interface

The following test adapter entry point is recommended:

```javascript
window.__gameTest = {
  reset(): Snapshot,
  getSnapshot(): Snapshot,
  input(action): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

Interface semantics:

- `reset()`: Clears the match score, round, temporary locked values, animation result, and result layer, returning to the ready-to-start state.
- `getSnapshot()`: Returns the current stable summary without returning the internal object graph, private functions, source-code structure, or complete rendering tree.
- `input(action)`: Executes a coarse-grained action equivalent to a player action and returns the summary after the action. Invalid actions should be rejected or ignored, but must not throw an unhandled exception.
- `loadScenario(name, options?)`: Enters a valid prerequisite state that is already defined by the GDD, understandable to the player, and not yet resolved. A scenario cannot directly set a win or loss, directly add points, directly complete a penalty, directly create a save result, or skip the player action chain.

If the implementation does not use this name, it must provide an equivalent global public entry point whose identical semantics can be discovered reliably when generating the test adapter. Real player input must still remain available; `__gameTest.input` cannot replace visible controls, keyboard, mouse, or touch paths.

## Action Schema

All actions are player-level actions or coarse-grained public actions.

```typescript
type Action =
  | { type: "start" }
  | { type: "confirm" }
  | { type: "save", zone: "left" | "center" | "right" }
  | { type: "wait", until?: "indicatorMoved" | "shotResolved" | "roundAdvanced" | "resultShown", ms?: number }
  | { type: "restart" }
  | { type: "key", key: "confirm" | "left" | "center" | "right" }
  | { type: "pointer", target: "playfield" | "save-left" | "save-center" | "save-right" | "restart" }
  | { type: "touch", target: "playfield" | "save-left" | "save-center" | "save-right" | "restart" }
```

Action semantics:

- `start`: Equivalent to the player clicking, touching, or pressing the confirm key to start the match while in the ready-to-start state.
- `confirm`: Equivalent to the player clicking, touching, or pressing the confirm key during the shooting phase. The first is used to lock power, and the second to lock direction and take the shot.
- `save`: Equivalent to the player selecting the left, center, or right save zone during the goalkeeping phase.
- `wait`: Allows an active timed indicator, ball flight, brief pause, or round progression to develop naturally; it cannot directly specify the result.
- `restart`: Equivalent to restarting from the result state.
- `key`: Used to verify the keyboard path, with semantics identical to the corresponding `confirm` or `save`.
- `pointer` / `touch`: Used to verify real mouse or touch paths. The target is a semantic region, not a fixed coordinate; tests should trigger the input through runtime-discovered playfield bounds, control bounds, or the center of a semantic region in the snapshot.

Contract for illegal actions or actions outside the current phase:

- In the ready-to-start state, `save` and save-zone input do not change the score or round.
- During power selection, `save` does not affect the shot early.
- During direction selection, confirming again only locks direction and does not modify the already locked power again.
- Repeated match inputs during the shooting animation, goalkeeping determination, round transition, and result state cannot score repeatedly, skip multiple rounds, or rewrite the final score.

## Scenario Schema

`loadScenario(name, options?)` permits only the following valid prerequisite states. Each state must still require a player-level action to trigger the tested postcondition.

| Scenario | Valid prerequisite state | Triggerable action | Permitted observable postcondition |
|---|---|---|---|
| `fresh_match` | Ready-to-start state, initial score, first round, no result displayed | `start` or real confirmation-type input | Enter power selection for the player's shot; match input becomes available |
| `shooting_power_ready` | Player shooting turn, power indicator oscillating, power not yet locked | `confirm`, `key(confirm)`, `pointer(playfield)`, `touch(playfield)` | Power is locked and direction selection begins; score and round remain unchanged |
| `shooting_direction_ready` | Direction selection entered through one valid confirmation, direction indicator oscillating, shot not yet taken | `confirm`, `key(confirm)`, `pointer(playfield)`, `touch(playfield)`, followed by `wait(shotResolved)` | Kick, ball flight, goalkeeper reaction, and one shooting determination; at most 1 point is added for the player and progression occurs once |
| `goalkeeping_live` | Player goalkeeping turn, opponent's incoming ball not yet resolved, left/center/right save zones available | `save(zone)`, corresponding keyboard/pointer/touch input, followed by `wait(shotResolved)` | The goalkeeper acts toward the selected zone; one save or conceded-goal determination; at most 1 point is added for the opponent and progression occurs once |
| `round_transition_pending` | One valid penalty has been determined and is in a brief pause, but the next attack/defense has not yet begun | `wait(roundAdvanced)` | Advance only to the next attack/defense or result; no additional scoring |
| `final_penalty_pending` | The last penalty in the fixed number of rounds has not yet been determined; the existing score comes from valid completed penalties, but the final result is not displayed | The `confirm` or `save` chain corresponding to the current phase, followed by `wait(resultShown)` | Enter the result state after the final determination; the result is decided by the final score |
| `result_ready` | The match has naturally completed and displays the final score and outcome, with match input disabled | `restart`, `pointer(restart)`, `touch(restart)` | Return to ready-to-start, reset the score and round, and make the result layer disappear |

Optional `options` may only select public, product-level prerequisites, such as `turn: "shoot" | "save"`, `incomingZone: "left" | "center" | "right"`, or a supported `matchLength`. These options are used only to construct valid, unresolved states and cannot directly set the score, the result of the current penalty, directly add points, directly set a win or loss, directly create a successful save, directly create a miss, or directly complete the match. If the last-shot resolution needs to be tested, the historical score in `final_penalty_pending` may only appear as a valid summary intrinsic to that scenario and cannot be exposed as an arbitrarily writable parameter.

## Snapshot Schema

The snapshot must be a stable summary. It may have more fields than those below, but tests cannot be required to read private implementation.

```typescript
type Snapshot = {
  phase: "ready" | "shootingPower" | "shootingDirection" | "shootingFlight" | "goalkeeping" | "roundFeedback" | "result";
  screen: "start" | "playing" | "result";
  canInteractWithPlayfield: boolean;
  overlayBlocking: boolean;
  score: { player: number; opponent: number };
  round: { index: number; total: number; side: "playerShoot" | "playerSave" | "complete" };
  prompt: "start" | "lockPower" | "lockDirection" | "save" | "wait" | "result";
  shooting?: {
    powerState: "moving" | "locked" | "hidden";
    directionState: "moving" | "locked" | "hidden";
    lockedPowerBand?: "low" | "medium" | "high";
    lockedDirectionZone?: "left" | "center" | "right" | "wideLeft" | "wideRight";
  };
  goalkeeping?: {
    availableZones: Array<"left" | "center" | "right">;
    selectedZone?: "left" | "center" | "right" | "none";
    incomingZone?: "left" | "center" | "right" | "unknown";
  };
  ball?: {
    visible: boolean;
    motion: "stationary" | "towardGoal" | "towardPlayerGoal" | "resolved";
    screenZone?: "left" | "center" | "right" | "wideLeft" | "wideRight";
    progress?: "start" | "mid" | "end";
  };
  actors?: {
    shooterPose?: "ready" | "kick" | "celebrate" | "disappointed";
    keeperPose?: "ready" | "left" | "center" | "right" | "save";
  };
  lastEvent?: "none" | "powerLocked" | "shotStarted" | "goal" | "miss" | "saved" | "conceded" | "roundAdvanced" | "matchEnded" | "restarted" | "invalidIgnored";
  result?: "none" | "win" | "lose" | "draw";
  controls?: {
    start?: "available" | "disabled" | "hidden";
    confirm?: "available" | "disabled" | "hidden";
    saveZones?: "available" | "disabled" | "hidden";
    restart?: "available" | "disabled" | "hidden";
  };
  observableRegions?: {
    playfield?: Region;
    saveLeft?: Region;
    saveCenter?: Region;
    saveRight?: Region;
    restart?: Region;
  };
  revision: number;
}

type Region = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  visible: boolean;
}
```

Field semantics:

- `phase` is the rules phase; `screen` is the major screen state visible to the player.
- When `overlayBlocking === true`, main match input should be blocked; during `phase === "shootingPower" | "shootingDirection" | "goalkeeping"`, no start layer should block the playfield.
- `score` may contain only non-negative integers, and one complete penalty determination may add at most 1 point to one side.
- `round.index` advances only after a complete determination; invalid input, repeated input, and setting operations cannot advance it.
- `lockedPowerBand` and `lockedDirectionZone` are public summaries and do not require exact values to be exposed.
- `incomingZone` may be `unknown`, but when the implementation specifies the incoming ball zone through a public scenario or when the visuals are sufficient to determine it, the summary should indicate left, center, or right.
- `observableRegions` are semantic interaction regions that tests may hit with real pointer/touch input; they do not prescribe a DOM structure or fixed screen coordinates.
- `revision` increments when the visible state, score, phase, ball/character feedback, or interactive state changes, and is used to distinguish a static shell from a real response.

## Feature Contract Matrix

| GDD Mechanic | Contract Input | Snapshot Output | External Postcondition |
|---|---|---|---|
| M1 State flow and restart | `reset()` -> `input({type:"start"})`; `restart` after the result | `screen` changes from `start` to `playing`; after the result, restart returns it to `start`; score and round reset | The start layer does not block the match; the result layer disables match input; the match can be started again after restart |
| M2 Two-step shooting input | `shooting_power_ready` + `confirm`; `shooting_direction_ready` + `confirm` | After the first, `phase="shootingDirection"` and `powerState="locked"`; after the second, `phase` enters flight/feedback | The power indicator stops and the direction indicator is visible; the second confirmation triggers a kick instead of charging again |
| M3 Shooting direction and power causality | Valid shot confirmation chain + `wait(shotResolved)`; summary scenarios with different directions/power may be compared | `ball.motion="towardGoal"`, `ball.screenZone` matches the direction summary; `lastEvent` is one of goal, miss, or saved | The ball, shooter, goalkeeper, and HUD change in sync; one shot adds at most 1 point for the player |
| M4 Goalkeeper reaction after a shot | Wait after completing shot-direction confirmation | `actors.keeperPose` changes from ready to one of left/right/center/save, and relates to the incoming ball zone/result | The score cannot change alone; there should be a visible goalkeeper reaction or save pose |
| M5 Three-direction goalkeeping | `goalkeeping_live` + `save(left|center|right)` or the corresponding real input | `goalkeeping.selectedZone` matches the input; `actors.keeperPose` expresses the corresponding direction; after resolution, `lastEvent` is saved or conceded | Left input dives toward the player's visible left, right input dives toward the player's visible right, and center input blocks the center |
| M6 Attack/defense alternation and score progression | `wait(roundAdvanced)` after each valid determination | `round.index` or `round.side` advances; the score changes only because of a determination | The score, round, and current attack/defense in the HUD match the snapshot; invalid input cannot advance them |
| M7 Result resolution | Complete the current valid action chain in `final_penalty_pending` and wait for the result | `screen="result"`, `phase="result"`, and `result` is one of win/lose/draw; the final score is stable | The result layer displays the outcome and final score; match input is disabled; only restart can clear the result |
| M8 P2 settings and atmosphere | If settings are provided, use a player-visible setting action and then start/continue the match | The public setting summary changes; subsequent play still has valid phases and a non-negative score | Settings cannot break starting, round progression, results, or restart; an implementation without settings should not have empty placeholders blocking P1 |

## Externally Visible Postconditions

Tests may combine the following public evidence, but must not depend on a unique DOM structure, fixed pixels, or exact copy:

- The HUD or equivalent visible information can communicate the score, round, current phase, and final result.
- The main scene has a visible goal, ball, shooter, goalkeeper, or equivalent football penalty elements; after entering the match, the main playfield is not covered by the start layer.
- Power and direction selection must have visible movement or state changes and can be stopped or advanced to the next phase through confirmation.
- After a shot, ball and character feedback should change; after a goalkeeping selection, the player's goalkeeper pose should change.
- After the result appears, main match input is disabled or ignored, and the restart entry point is visible and triggerable.
- Mouse, touch, and keyboard should at least cover available paths within the same set of core semantics; different input methods do not need to have exactly the same appearance.

## Anti-Cheating and Invariants

- `loadScenario` cannot directly enter an already-won, already-lost, already-scored, already-saved, already-missed, or already-awarded state to pass core mechanic tests.
- No action may directly set the score, directly set the result, directly deduct health/award a reward, directly complete the current penalty, or directly skip the fixed number of rounds.
- It is not sufficient to return only `{ ok: true }` or static fields to pass tests; after an action, there must be causal changes in the phase, score, feedback, revision, HUD, or visible state.
- Invalid-phase input must keep the score, round, and final result stable and return an unchanged state or `lastEvent="invalidIgnored"`.
- One penalty can be resolved at most once; repeated clicks, repeated goalkeeping selections, and input while waiting cannot repeatedly add points.
- Match actions in the result state cannot change the final score; after restart, the previous match's temporary locked values, save selection, or result layer cannot remain.

## Self-Review Conclusion

This TDD extracts the public test contract only from the mechanics already defined in `game-spec.md` and `design-doc.md`, and uses the original source code as minimal calibration evidence to confirm player input paths. The document does not require private functions, internal variables, source-file structure, a fixed DOM, fixed coordinates, asset names, exact copy, specific physics formulas, or a rendering loop. Every scenario is a valid prerequisite state that has not yet been resolved and must trigger postconditions through `start`, `confirm`, `save`, real pointer/touch/keyboard input, or natural progression while waiting; there is no cheating setup that directly sets a win or loss, directly awards a reward, directly creates a save, directly creates a miss, or directly completes the match.
