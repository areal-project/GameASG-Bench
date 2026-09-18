# Capy's Flight Adventure TDD

## Public Test Contract

The target page should expose the public top-level interface:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name, options): Snapshot
}
```

These interfaces express only major player-visible actions and summarized state. Real player paths must still work through mouse, touch, keyboard, and clickable UI.

## Snapshot Schema

`Snapshot` must be a serializable object:

- `phase`: `"menu" | "launch" | "flight" | "result" | "info"`.
- `screen`: Current screen summary; `"splash" | "play" | "result" | "info"` is allowed.
- `overlayBlocking`: Whether a visible overlay is blocking the main scene.
- `canInteractWithPlayfield`: Whether the main scene can receive player input.
- `playfield`: `{ x, y, width, height }`, the main scene bounds in browser screen coordinates.
- `player`: `{ screenX, screenY, worldX, worldY, velocityX, velocityY, airborne }`.
- `slingshot`: `{ screenX, screenY }`, the slingshot anchor in the ready-to-launch phase.
- `pull`: `{ active, dx, dy, power }`, the pullback vector during the ready-to-launch phase; power is 0 when there is no pullback.
- `score`: Current score, a non-negative integer.
- `distance`: Current flight distance, a non-negative integer.
- `maxHeight`: Maximum altitude for the current run, a non-negative integer.
- `flightTime`: Flight time for the current run in seconds, a non-negative number.
- `flaps`: `{ remaining, max }`, remaining flaps and the limit.
- `buffs`: `{ visible, collected, active, nearest }`; `nearest` may be `{ type, screenX, screenY, effect, reachable }` or `null`, summarizing the nearest currently visible and uncollected item for the player.
- `result`: `{ visible, finalDistance, finalMaxHeight, finalBuffs, finalTime, finalScore, highScore }`.
- `ui`: `{ startAvailable, retryAvailable, infoOpen, infoAvailable }`.
- `renderRevision`: A number or string that should change when the main scene display updates due to player input, camera movement, or state changes.

## Action Schema

`input(action)` accepts player-level actions:

- `{ type: "start" }`: Equivalent to clicking the start entry.
- `{ type: "dragLaunch", from: { screenX, screenY }, to: { screenX, screenY }, release: true }`: Equivalent to an actual drag launch. `to - from` is the pullback vector, and the launch direction must be opposite to this vector.
- `{ type: "flap", source: "pointer" | "keyboard" }`: Performs one flap during the flight phase.
- `{ type: "openInfo" }` / `{ type: "closeInfo" }`: Opens or closes the instructions panel.
- `{ type: "retry" }`: Launches again from the result state.
- `{ type: "wait", ms }`: Waits for the game to advance naturally.

An invalid action must return `{ ok: false, reason, snapshot }` or a Snapshot with `lastAction.ok === false`; it must not throw an uncaught exception or change unrelated resources.

## Valid Prerequisites for loadScenario

- `"launch-ready"`: Enters the ready-to-launch state, with score/distance/items reset to zero and no launch yet.
- `"flight-with-flaps"`: Has been legally launched and is in the flight phase, with at least 2 flaps and without having reached results.
- `"flight-no-flaps"`: Has been legally launched and is in the flight phase, with 0 remaining flaps and without having reached results.
- `"near-visible-buff"`: Has been legally launched, with a visible, uncollected, not-yet-scored item near the pilot; `buffs.nearest` should summarize the item's position and effect, and one real flap, click on the main scene, or brief natural flight should trigger contact or a clear approach.
- `"near-landing"`: Has been legally launched and is close to landing but has not yet entered results; subsequent waiting triggers results.
- `"high-altitude"`: Has been legally launched and is at high altitude, without having reached results, for observing high-altitude feedback.

`loadScenario` may only construct these prerequisite states and must not directly award points, directly collect, directly enter results, or directly update the high score. When validating a postcondition, the postcondition must not already be present after the scenario is loaded.

## Visible UI / HUD / Main View Postconditions

- The main scene may be a canvas, a DOM composition, or an equivalent drawable area, but it must have readable playfield geometry.
- After starting, `overlayBlocking` must be `false`, and `canInteractWithPlayfield` must be `true`.
- Score, distance, maximum altitude, flap count, and result statistics must be readable from the visible HUD/interface or Snapshot and synchronized with gameplay actions; tests must not require a fixed DOM selector, fixed text, or fixed layout.
- The main scene must be non-empty; after launch, flap, collection, or results actions, `renderRevision` or canvas/hash/entity position should change.
- When the information panel is open, it should block accidental main-scene input, and closing it restores the previous phase.

## Behavioral Trajectory Contract

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Start into ready-to-launch | M1 | Default load | Actually click start or `input(start)` | `phase=launch`, the start overlay does not block, and the main scene is interactive | Score/distance are 0 |
| Reverse launch from pullback | M2/M3 | `launch-ready` | Actually drag down and left from near the pilot with the mouse and release | `phase=flight`, the player's screen position trends up and right, and the flap bar is visible | Releasing without pull force does not launch |
| Opposite-direction semantics | M2 | `launch-ready` twice | Pull down and left and down and right respectively, then release | The signs of horizontal velocity or screen horizontal trends for the two launches are opposite | Directions cannot have the same sign |
| Flap endurance | M4 | `flight-with-flaps` | Actually click the main scene or press Space | Remaining flaps decrease by 1, and vertical velocity or screen altitude shows upward improvement | Flaps do not fall below 0 |
| Item collection | M5/M6 | `near-visible-buff` | Actually click the main scene, use a key to flap, or wait for a brief flight so the pilot contacts the item | Item count or score increases, and visible item count decreases or the active buff changes | The item must not already be collected when the scenario loads; flap refill does not exceed the limit |
| Results and restart | M6 | `near-landing` | Wait to land, then actually click restart | The results overlay displays statistics; restart returns to `launch` and clears the current run's temporary values | Input in the result state does not continue adding score |
| Instructions panel | M8 | Any non-result phase | Open instructions, then close instructions | `phase` or `screen` reflects the panel and returns to the original state after closing | The main scene is not accidentally triggered while the panel is open |

## Feature-to-Interface Mapping

- M1: Real start button, `input({ type: "start" })`, `Snapshot.ui`, `overlayBlocking`.
- M2: Real mouse/touch drag, `input({ type: "dragLaunch" })`, `player`, `pull`, `renderRevision`.
- M3: `wait`, `player`, `distance`, `maxHeight`, main-scene rendering changes.
- M4: Real click/keyboard, `input({ type: "flap" })`, `flaps`, `player.velocityY`, HUD.
- M5: Player action after `loadScenario("near-visible-buff")`, `buffs`, `score`, `flaps`, active buff.
- M6: `loadScenario("near-landing")`, `result`, restart action, high score.
- M7: `loadScenario("high-altitude")`, `maxHeight`, high-altitude visible-state summary or rendering changes.
- M8: Real instructions button or `input(openInfo/closeInfo)`, `ui.infoOpen`, `overlayBlocking`.

## Rejections and Invariants

- When not in the flight phase, flap input must not consume flaps or add points.
- When remaining flaps are 0, flap input must not make them negative or continue to produce an upward effect.
- Distance, maximum altitude, score, flight time, flaps, and item count must not be negative.
- Maximum altitude can only remain the same or increase within the same run.
- In the result state, ordinary launch/flap input must not continue advancing the current run's score.
- After restarting, the current run's score, distance, item count, and active buffs are cleared, while the high score is retained.
