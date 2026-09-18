# City Racer X Neon Rush TDD

## Public Testable Contract

The implementation should expose the public main interface:

```javascript
window.__gameTest = {
  reset(options),
  input(action),
  getSnapshot(),
  loadScenario(name, options)
}
```

These interfaces are player-level semantic interfaces and must drive the real game state and synchronize the HUD/DOM/3D visuals within a short time. The interfaces must not merely return `{ ok:true }`, expose the internal object graph, directly add points, directly grant victory, directly kill enemies, or bypass the rule chain.

## Snapshot Schema

`getSnapshot()` and every valid action return a stable summary:

| Field | Type | Semantics |
|---|---|---|
| `phase` | string | `menu`, `playing`, `paused`, `bulletTime`, `crashRecover`, `result` |
| `screen` | string | The currently visible main screen, such as `start`, `race`, `menu`, `shop`, `stats`, `leaderboard`, `result` |
| `overlayBlocking` | boolean | Whether a panel/result layer is blocking the track |
| `canInteractWithPlayfield` | boolean | Whether the main track accepts real player input |
| `playfield.bounds` | object | Main interactive area `{left,top,width,height,centerX,centerY}`; coordinates are viewport screen coordinates |
| `render.kind` | string | A 3D rendering summary such as `webgl` or `three-d` |
| `render.nonBlank` | boolean | The main scene has been drawn and is not blank/solid-colored |
| `render.revision` | number | Increases after real game progression/input changes the visuals or rendering summary |
| `player.lane` | number | Current lane index, starting from 0 |
| `player.laneCount` | number | Current number of road lanes; 2/4/6 or an equivalent multilane layout is allowed |
| `player.screenX` / `player.screenY` | number | Visible center position of the player's motorcycle on screen |
| `player.speed` | number | Current speed, non-negative |
| `player.distance` | number | Distance traveled in the current session, non-negative |
| `race.lap` / `race.totalLaps` | number | Current lap and total laps |
| `race.rank` / `race.racerCount` | number | Player's rank and number of participating riders |
| `race.time` | number | Race timer |
| `hud.progress` | number | Course progress from 0 to 1 |
| `traffic.visibleCount` | number | Number of traffic entities on screen or in the nearby area |
| `traffic.nearestAhead` | object/null | Summary of the nearest hazard ahead `{screenX,screenY,lane,distance,direction}` |
| `road.drivableBounds` | object | Drivable road range at the player's current screen cross-section `{left,right,width,centerX}`, in viewport screen coordinates |
| `road.laneCenters` | array | Array of current lane-center screen coordinates; its length should cover `player.laneCount` |
| `player.inDrivableArea` | boolean | Whether the player's visible center remains within the current drivable road range |
| `road.blockedLane` | object/null | Summary of a lane about to close or that cannot be entered `{lane, side, reason, screenX}`; null when there is no blockage |
| `ai.visibleCount` | number | Number of visible or nearby AI rivals |
| `result.type` | string | `none`, `finish`, `crash`, `time` |
| `result.controls` | object | Summary of controls triggerable on the result layer; may include screen bounds for `restart`, `continue`, `nextRace`, `shop` |
| `economy.balance` | number | Current balance, non-negative |
| `economy.earnedLast` | number | Income from the most recent settlement; may be 0 |
| `economy.continueCost` | number | Current continue fee; 0 means continuing is unavailable |
| `shop.open` | boolean | Whether the shop is open |
| `shop.items` | array | Vehicle item summaries `{id, owned, equipped, price, affordable, maxSpeed, multiplier, power, bounds?}`; `bounds` is a viewport-coordinate summary of the visible purchase/equip area |
| `power.kind` | string/null | Currently equipped advanced power |
| `power.cooldown` | number | Remaining power cooldown, non-negative |
| `power.available` | boolean | Whether the current power is available |
| `nitro.usesLeft` | number | Remaining nitro uses, non-negative |
| `nitro.available` | boolean | Whether the nitro button can currently be triggered |
| `nitro.active` | boolean | Whether the nitro effect is active |
| `nitro.bounds` | object/null | Visible nitro control bounds; null when there is no nitro control |
| `view.mode` | string | `thirdPerson` or `firstPerson` |
| `stats.open` | boolean | Whether the statistics panel is open |
| `stats.summary` | object | Statistics summary; may include total distance, highest speed, collisions, pedestrian/special-target hits, fall distance, income, spending, and current balance |
| `warnings.bulletTimeActive` | boolean | Whether the brief dodge challenge is active |
| `warnings.tapProgress` | number | Bullet-time tap progress, from 0 to 1 |
| `warnings.shieldsLeft` | number | Remaining hazard-forgiveness/dodge opportunities, non-negative |
| `feedback.last` | string/null | Summary of the most recent player-visible feedback, such as rejection, collision, reward, purchase, nitro, or cooldown |

## Action Schema

`input(action)` accepts player-level actions:

| Action | Required fields | Expected postcondition |
|---|---|---|
| `{type:"start"}` | none | Transitions from menu/start to playing and hides the start layer |
| `{type:"key", key:"ArrowLeft"}` | key | Equivalent to real keyboard directional input |
| `{type:"key", key:"ArrowRight"}` | key | Equivalent to real keyboard directional input |
| `{type:"tapPlayfield", side:"left"|"right"}` | side | Taps the left or right area of the main track |
| `{type:"swipe", direction:"left"|"right"}` | direction | Changes lanes with a horizontal swipe |
| `{type:"touchSwipe", direction:"left"|"right"}` | direction | Equivalent to a real touch swipe, with visible screen-direction semantics |
| `{type:"openMenu"}` | none | Opens the menu and pauses/blocks the track |
| `{type:"closePanel"}` | none | Closes the current menu/shop/statistics/leaderboard or other panel |
| `{type:"toggleView"}` | none | Switches between first-/third-person view |
| `{type:"openShop"}` | none | Opens the shop |
| `{type:"buyOrEquip", itemId}` | itemId | Purchases or equips a vehicle |
| `{type:"useNitro"}` | none | Consumes one nitro use and produces speed/visual feedback |
| `{type:"usePower"}` | none | Uses the current advanced power, starts its cooldown, and produces a visible effect |
| `{type:"bulletTap"}` | none | Advances tap progress during bullet time |
| `{type:"restart"}` | none | Restarts from the result or paused state |
| `{type:"continue"}` | none | Pays the fee and continues from the result state |
| `{type:"nextRace"}` | none | Starts the next session/stage after stage completion |

Invalid actions, unknown keys, track input while blocked by a pop-up, out-of-bounds lane changes, purchases with insufficient balance, powers on cooldown, exhausted nitro uses, continuing outside the result state, and similar operations must return `ok:false` or leave the state unchanged, with a `reason` or equivalent rejection summary.

## loadScenario Contract

`loadScenario(name, options)` can construct only valid prerequisite states:

- `race_ready`: Already in playing; the vehicle is in a safe initial lane, with traffic and AI visible.
- `lane_direction`: Already in playing; the player is in a middle lane that allows movement both left and right, for verifying opposite directions.
- `blocked_lane`: The player is near a road narrowing or a lane that cannot be entered; the next input toward an out-of-bounds/closed lane should be rejected.
- `traffic_near_miss`: There is traffic ahead or in an adjacent lane; one correct lane change can avoid it, while incorrectly staying put enters hazard feedback.
- `crash_result`: The failure result layer is visible and includes a collision/fall or failure-reason summary; restart has not yet been triggered.
- `near_finish`: The player is near the finish but has not completed it; the next segment of valid progression or waiting enters stage completion.
- `result_with_continue`: The failure result layer is visible, with a valid continue fee and sufficient balance.
- `shop_insufficient`: The shop is open, with at least one unowned vehicle whose price exceeds the balance.
- `shop_affordable`: The shop is open, with at least one unowned vehicle that can be purchased.
- `nitro_ready`: Already in playing; the nitro button is visible with at least one use remaining.
- `power_ready`: A vehicle with an advanced power is equipped, the power is available, and there is a target ahead that can be affected or a visible effect area.
- `power_cooldown`: A vehicle with an advanced power is equipped, and the power is on cooldown.
- `bullet_time`: At the start of the brief dodge challenge; it has not yet succeeded or failed.

After each scenario is loaded, it must not already contain the result that the scenario is meant to prove. For example, `near_finish` must not already be in result, `shop_affordable` must not have already completed the purchase, `power_ready` must not have already destroyed the target, and `bullet_time` must not have already completed the dodge successfully.

## DOM/HUD/Canvas/WebGL Postconditions

- The main scene must have a legible 3D/WebGL visual; when `render.nonBlank` is true, a screenshot or canvas sample should show non-empty, non-solid-color content.
- When `phase === "playing"`, `overlayBlocking` must be false and `canInteractWithPlayfield` must be true.
- When a menu, shop, statistics, leaderboard, or result layer is open, `overlayBlocking` must be true, and real track input cannot change the lane.
- The HUD must be able to represent core fields among rank, laps/progress, race time, speed, or power state, consistently with the snapshot semantics.
- The player's lateral movement must provide `player.screenX/screenY` or an equivalent visible center for verifying screen direction.
- `player.lane`, `player.screenX`, and `road.drivableBounds`/`road.laneCenters` must be mutually consistent; the vehicle center cannot leave the drivable road or map to the wrong lane center.
- Rejection due to road narrowing or out-of-bounds movement must be observable through `road.blockedLane`, `feedback.last`, or unchanged lane/screen position.
- Shop vehicle items and nitro/power/result controls must be discoverable, triggerable, and observable; the implementation can express them through semantic bounds, accessible controls, or equivalent player-clickable areas.
- Real keyboard, mouse click, touch, or swipe input must have semantics consistent with the same type of `input(action)`; `window.__gameTest.input` cannot replace the real input path.

## Behavioral Trajectory Contract

| Trajectory | Coverage M | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Enter the Race from Start | M1/M2 | reset to menu | Real click on the start area or `input({type:"start"})` | phase=playing, overlayBlocking=false, 3D scene non-empty | The start layer no longer blocks playfield |
| Screen-Direction Lane Change | M3 | `loadScenario("lane_direction")` | Real ArrowLeft, then real ArrowRight | The two inputs make `player.screenX` change in opposite directions; if inverted controls are used, the inverted relationship must be consistently visible | lane is within `[0,laneCount-1]` |
| Touch/Swipe Lane Change | M3 | `loadScenario("lane_direction")` | Perform one real touch or mouse swipe | `player.screenX` or lane changes in the declared direction, with input feedback in the rendering or HUD | HUD button areas do not accidentally trigger lane changes |
| Narrowing-Lane Rejection | M3/M5 | `loadScenario("blocked_lane")` | Input toward the closed/out-of-bounds lane | Returns a rejection or leaves lane/screenX unchanged, with visible feedback | Balance, rank, and progress do not change because of the rejection |
| Automatic Progression | M4 | `loadScenario("race_ready")` | Wait briefly | distance/progress/time/render.revision increase, with synchronized HUD | Progress is non-negative and does not regress while not paused/not in a terminal state |
| Traffic Avoidance | M5 | `loadScenario("traffic_near_miss")` | The player uses real keyboard, touch, or mouse input to move in the safe direction | The nearest traffic hazard changes, the player does not enter result/crash, and the rendering or HUD gives feedback | Not changing lanes/moving in the wrong direction cannot produce the same safe result |
| Menu Blocking | M9 | playing | Open the menu, press a directional key, then close it | While the menu is open, overlayBlocking=true and the lane is unchanged; after closing, lane changes work again | totalBefore/totalAfter lane/balance conservation |
| Stage Completion | M7 | `loadScenario("near_finish")` | Wait or advance to the finish | result.type=finish, reward and rank visible, and next-stage/shop entry points available | Ordinary lane changes do not alter progress after the terminal state |
| Restart/Continue after Failure | M8 | `loadScenario("result_with_continue")` or `loadScenario("crash_result")` | Click continue or restart | Continue deducts the fee and enters playing; restart clears the result layer, hazard challenge, and collision remnants and begins a new session | Balance is not negative; continue count/fee conservation |
| Shop Purchase Rejection | M10 | `loadScenario("shop_insufficient")` | Click an expensive unowned vehicle | ok=false or owned unchanged, balance unchanged, with visible rejection feedback | totalBefore/totalAfter balance is equal |
| Successful Shop Purchase | M10 | `loadScenario("shop_affordable")` | Real click on the area of a purchasable vehicle | owned/equipped=true, balance decreases, and the performance/power summary changes | balanceAfter = balanceBefore - cost and is non-negative |
| Nitro Button | M11 | `loadScenario("nitro_ready")` | Real click on the nitro button | usesLeft decreases; nitro.active/speed/rendering revision or the visual effect changes | usesLeft is not negative; rejected once exhausted |
| Power Use and Cooldown | M11 | `loadScenario("power_ready")` | Click the power button or press Space | power.cooldown increases, and speed/jump/traffic/rendering revision changes | Reuse during cooldown is unchanged or ok=false |
| Bullet-Time Challenge | M6 | `loadScenario("bullet_time")` | Click/press repeatedly until progress is full | tapProgress increases; after success, phase=playing and the safe lane changes | The challenge must not have already succeeded or failed when it begins |
| View Switching | M12 | playing | Click view or V | view.mode switches, the main scene remains non-empty, and directional input continues to follow screen semantics | Switching does not change the balance, owned vehicles, or rank |

## Feature-Interface Mapping

| GDD M | Public contract |
|---|---|
| M1/M2 | `reset`, `input({type:"start"})`, real click, `getSnapshot.render`, `playfield.bounds` |
| M3 | real keyboard/mouse/touch, `player.screenX`, `player.lane`, `player.laneCount`, `player.inDrivableArea`, `road.drivableBounds`, `road.laneCenters`, `road.blockedLane` |
| M4/M5 | `loadScenario("race_ready"|"traffic_near_miss"|"blocked_lane")`, `traffic`, `player.distance`, `hud.progress`, `feedback.last` |
| M6 | `loadScenario("bullet_time")`, `input({type:"bulletTap"})`, `warnings` |
| M7/M8 | `loadScenario("near_finish"|"result_with_continue"|"crash_result")`, `input({type:"restart"|"continue"|"nextRace"})`, `result`, `economy` |
| M9 | real menu click/key, `input({type:"openMenu"|"closePanel"})`, `overlayBlocking` |
| M10 | `loadScenario("shop_insufficient"|"shop_affordable")`, `input({type:"buyOrEquip"})`, `shop.items`, `economy.balance` |
| M11 | `loadScenario("nitro_ready"|"power_ready"|"power_cooldown")`, real Space/click, `power`, `nitro`, `traffic`, `render.revision` |
| M12 | real V/click, `input({type:"toggleView"})`, `view.mode`, `stats.summary` |

## Prohibited Items

- No private variables, internal functions, fixed DOM structure, fixed copy, fixed assets, fixed coordinates, fixed colors, or specific physics formulas are required.
- `loadScenario` must not directly set victory, rewards, destruction, completed purchases, or successful hazard challenges.
- Behavioral checks must not rely only on interface existence, element existence, natural animation, fixed pixels, `ok:true`, or frameCount.
