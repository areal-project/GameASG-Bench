# Colossal Runner TDD

## Public Contract Goals

The game may freely choose its internal structure, but it must expose a player-level testable contract to demonstrate that the 3D runner experience can be launched, controlled, and observed. The recommended interface is:

```javascript
window.__gameTest = {
  reset(options),
  input(action),
  getSnapshot(),
  loadScenario(name)
}
```

The public interface may only perform player-level high-level actions or construct valid prerequisite states. It must not directly set scores, directly set wins or losses, directly kill enemies, directly complete the game, directly add coins, or bypass the collision/collection/revive rule chain.

## Snapshot Schema

`getSnapshot()` and every `reset/input/loadScenario` return a stable summary:

- `phase`: `"loading" | "menu" | "intro" | "playing" | "settings" | "paused" | "gameover" | "complete"`.
- `screen`: current main-screen semantics, such as `"loading" | "start" | "play" | "settings" | "gameover" | "complete"`.
- `overlayBlocking`: boolean indicating whether a visible overlay is currently blocking the playfield.
- `canInteractWithPlayfield`: boolean, true when playing with no blocking layer.
- `hud`: `{ visible, distanceText, coinsText }`; the text may be numeric strings or parseable values.
- `distance`: current run distance, a nonnegative number.
- `bestDistance`: optional historical best distance, a nonnegative number.
- `coins`: current run coins, a nonnegative integer.
- `lane`: `0 | 1 | 2`, ordered from left to right on the player's screen.
- `laneCount`: fixed at 3.
- `player`: `{ screenX, screenY, worldZ, heightState, airborne, sliding, stunned, shielded }`. `screenX/screenY` are the center of the player's visible position and must be consistent with screen direction.
- `playfield`: `{ bounds: { x, y, width, height }, canvasReady, renderNonBlank }`.
- `entityCounts`: `{ visibleCoins, obstacles, movingThreats }`.
- `obstacleCue`: optional `{ kind, blockedLanes, safeLanes, distanceAhead, visible }`, describing only risks ahead that the player can read from the screen; `blockedLanes/safeLanes` use on-screen lane numbers 0..2.
- `cinematic`: optional `{ active, visibleThreat, inputLocked, elapsedMs }`, indicating whether the short opening or chase sequence is still in progress.
- `speedStage`: nonnegative integer indicating the current speed stage.
- `result`: `"none" | "lose" | "complete"`.
- `revive`: `{ offered, cost, used, max, shielded }`.
- `progressSummary`: optional `{ runDistance, bestDistance, leaderboardVisible, leaderboardUnavailable }`, used for the terminal or completion-screen summary; when an external leaderboard is unavailable, fallback should be expressible through `leaderboardUnavailable=true` or an equivalent visible summary.
- `lastAction`: optional `{ ok, type, reason }`; invalid input should return `ok:false` or leave a rejection reason in the snapshot.

## Action Schema

`input(action)` accepts player-level actions:

- `{ type: "start" }`: enters a short opening or playing from menu/loading-ready; after the short opening ends, it should enter playing.
- `{ type: "button", target: "start" | "restart" | "revive" | "settings" | "settingsClose" }`.
- `{ type: "key", key: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "KeyA" | "KeyD" | "KeyW" | "KeyS" | "Space" }`.
- `{ type: "swipe", direction: "left" | "right" | "up" | "down" }`.
- `{ type: "wait", ms }`: advances valid time and must not directly change state other than through resulting outcomes.
- `{ type: "toggleAudio", channel: "music" | "sfx", enabled }`.
- `{ type: "setVolume", channel: "music" | "sfx", value }`; the `value` range is 0..1.

Invalid action values, unknown key values, unknown scenario values, out-of-range volume values, and track actions during a short opening that is not playing and has not unlocked controls must be rejected. They must not throw uncaught exceptions or change unrelated state such as distance, coins, or lane.

## loadScenario Contract

`loadScenario(name)` may only construct valid prerequisites:

- `"running-clear"`: already started with a safe short distance ahead, and distance can continue increasing.
- `"near-coin"`: the character is on a valid route and about to collect one or more coins; the coins have not yet been collected after loading.
- `"near-jump-obstacle"`: an obstacle ahead requires jumping and has not yet been hit or passed after loading.
- `"near-slide-obstacle"`: an obstacle ahead requires sliding and has not yet been hit or passed after loading.
- `"near-fatal-obstacle"`: an obstacle ahead will cause failure after an incorrect action; after loading, `result` is still `none`.
- `"near-giant-obstacle"`: a large blocker ahead occupies two lanes; after loading, the game is still playing, `obstacleCue.safeLanes` contains at least one available on-screen lane, and the blocker has not yet been hit or passed.
- `"stunned"`: the character is within the stunned danger window and has not yet failed.
- `"gameover-with-coins"`: the terminal state has been reached through a valid collision, with enough coins to revive.
- `"gameover-no-coins"`: the terminal state has been reached through a valid collision, without enough coins to revive.
- `"late-run"`: a great distance has already been run, a speed stage or complex threat is observable, and the game is still playing.
- `"opening"`: a short opening sequence has just begun or is about to begin; if the implementation has no short opening, it may return a normal playing snapshot and use `cinematic.active=false` to indicate an immediate start.

No scenario may already include the postcondition that the test is intended to prove, such as adding score in advance, completing collection in advance, reviving in advance, completing the game in advance, or applying restart effects in advance.

## DOM/HUD/Canvas/WebGL Postconditions

- The main playfield must have a visible geometric region with `bounds.width/height` greater than 0.
- The main 3D/WebGL scene must be non-empty and readable; `renderNonBlank` is true, or canvas/screenshot pixel diversity reaches the non-empty threshold.
- After starting, the HUD is visible, and the distance and coin HUD are synchronized with the snapshot.
- Actual keyboard and pointer/touch swipe input must drive player actions equivalent to `input(action)`.
- When overlays such as gameover/complete/settings are visible, `overlayBlocking` should reflect their blocking state; after returning to playing, `overlayBlocking=false` and `canInteractWithPlayfield=true`.

## Behavioral Trajectory Contract

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Start flow | M1/M15 | Default or reset | Click/contract start, waiting for the short opening to end if necessary | phase playing, or enters playing after a brief intro; HUD visible, overlayBlocking false, renderNonBlank true | playfield bounds usable; intro cannot lock input indefinitely |
| Auto run | M2 | running-clear | wait 500-1200ms | distance increases, HUD synchronized | coins do not increase from nothing merely by waiting |
| Direction lane | M3 | running-clear | Actual ArrowLeft/ArrowRight or left/right swipe | player.screenX directions for left and right are opposite, lane within 0..2 | Boundaries are not crossed |
| Jump | M4 | running-clear | ArrowUp/Space or upward swipe | airborne true or heightState enters jump, then falls back | Does not trigger when not playing |
| Slide | M5 | running-clear | ArrowDown or downward swipe | sliding true/low posture, recovers after a short time | Does not remain permanently stuck in slide |
| Coin collect | M6 | near-coin | wait or stay on the route and run through coins | coins increases, visibleCoins decreases, HUD synchronized | totalBefore = coins + visibleCoins; totalAfter should not decrease without cause beyond the collection transfer |
| Fatal collision | M7 | near-fatal-obstacle | Do not evade, or wait after performing the wrong action | phase gameover/result lose, terminal screen visible | Track input unchanged after terminal state |
| Stun chain | M8 | stunned | Collide again/wait for the dangerous threat | gameover or clear stunned feedback | Does not grant a coin reward |
| Revive | M9 | gameover-with-coins | Click revive | phase playing, coins decreases by cost, shielded true | used increases by 1; cost is not negative |
| Revive rejection | M9 | gameover-no-coins | Click revive | phase remains gameover, coins/used unchanged | lastAction ok false or offered false |
| Restart | M10 | gameover | Click restart | phase playing, distance returns to initial value, coins resets to zero, lane centered | old result/stun/slide cleared |
| Settings | M11 | playing | Click settings, toggle, close | settings appears and then closes, returns to playing | distance/coins preserved while closing |
| Late depth | M12 | late-run | wait/observe | speedStage or movingThreats/obstacles visible | loadScenario does not directly cause victory |
| Giant obstacle safe lane | M14 | near-giant-obstacle | Select a safe lane from `obstacleCue.safeLanes` and pass, or choose a route through the blocker's core | Safe route remains playing and distance advances; incorrect route enters gameover or stun risk | At least one safe lane is readable; passing does not directly reward coins |
| Terminal summary | M13 | terminal state | Observe the summary after settlement and restart | Current run distance, bestDistance, or leaderboardVisible/leaderboardUnavailable observable; restart still available | Unavailable external leaderboard does not block gameover/restart |

## Feature-to-Interface Mapping

- M1/M10: actual button clicks take priority; `input({type:"start"})` and `input({type:"button",target:"restart"})` serve as the contract.
- M2/M6/M7/M8/M9/M12: `loadScenario` only constructs prerequisites; subsequent results must be triggered with `wait`, actual input, or player-level `input`.
- M3/M4/M5: at least one P1 path uses an actual keyboard or actual pointer/touch; the contract only supplements the schema and state summary.
- M11: actual settings button or `input({type:"button",target:"settings"})`; verify that the current run's state is preserved after closing.
- M13: the post-terminal summary is expressed through `progressSummary`, HUD/panel, or an equivalent visible result; an unavailable leaderboard must not block restart.
- M14: `loadScenario("near-giant-obstacle")` only constructs a valid running prerequisite with a giant blocker ahead; safe traversal/incorrect collision is subsequently triggered through an actual lane change, waiting, or player-level input.
- M15: `loadScenario("opening")` only constructs a short-opening or immediate-start prerequisite; checks should verify that the sequence is finite and ultimately enters controllable running.

## Prohibitions

- Must not require a fixed DOM id, fixed internal function, fixed resource name, fixed color, fixed copy, or fixed coordinates.
- Must not use `window.__gameTest.input` as a substitute for the actual input path.
- Must not return an internal object graph, private array, or engine node; the snapshot may return only a stable summary.
- Must not use `ok:true` alone as the basis for passing; every valid action must have state, HUD, DOM, or canvas/WebGL postconditions.
