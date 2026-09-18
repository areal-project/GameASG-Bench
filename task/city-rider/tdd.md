# City Rider TDD

## Stable Public Contract

The implementation should expose the public top-level interface `window.__gameTest`, allowing automation and accessibility diagnostics to read the same set of player-visible state. The interface may represent only player-level actions and legal prerequisite scenarios; it must not directly add points, directly determine wins or losses, directly complete purchases successfully, directly kill targets, or bypass core rules.

```js
window.__gameTest = {
  reset(options?): Snapshot,
  getSnapshot(): Snapshot,
  input(action): Snapshot | { ok:false, reason:string, snapshot:Snapshot },
  loadScenario(name, options?): Snapshot
}
```

Public method semantics:

- `window.__gameTest.reset(options?)`: Return to the default or a specified legal initial state and return a Snapshot.
- `window.__gameTest.getSnapshot()`: Return the current stable Snapshot without advancing game rules.
- `window.__gameTest.input(action)`: Execute a player-level action and return the Snapshot after the action or a rejection object.
- `window.__gameTest.loadScenario(name, options?)`: Load a defined legal prerequisite scenario and return a Snapshot.

### Snapshot Schema

`Snapshot` must be a stable summary containing at least:

- `phase`: `"loading" | "menu" | "playing" | "paused" | "shop" | "stats" | "leaderboard" | "sector-cleared" | "danger" | "crashing" | "game-over"`
- `screen`: Current main-screen semantics, which may be the same as `phase` or more specific.
- `overlayBlocking`: Whether a visible panel is blocking main driving input.
- `canInteractWithPlayfield`: Whether the main driving area can receive player input.
- `render`: `{ ready:boolean, kind:"webgl"|"canvas3d"|"dom3d", nonBlank:boolean, mainSceneVisible:boolean, pixelDiversity?:number }`
- `playfield`: `{ bounds:{ left:number, top:number, width:number, height:number }, center:{ screenX:number, screenY:number }, leftPoint:{ screenX:number, screenY:number }, rightPoint:{ screenX:number, screenY:number } }`
- `player`: `{ lane:number, laneCount:number, screenX:number, screenY:number, speed:number, distance:number, isChangingLane:boolean, airborne?:boolean }`
- `progress`: `{ sector:number, checkpoint:number, checkpointsRequired:number, checkpointProgress:number, timeRemaining:number }`
- `score`: `{ current:number, nearMisses:number, impacts:number, crashes:number }`
- `economy`: `{ balance:number, earnedThisRun?:number, spentTotal?:number }`
- `garage`: `{ ownedTiers:number[], equippedTier:number, equippedPower:null|"cyclone"|"turbo"|"laser", nextPrice?:number, canAffordNext?:boolean }`
- `traffic`: `{ vehicleCount:number, movingCount:number, nearestAhead?:{ screenX:number, screenY:number, lane:number, distance:number, direction:"same"|"oncoming" } }`
- `world`: `{ pedestrianCount?:number, crosswalkCount?:number, collectibleCount?:number, collectedThisRun?:number, worldMotionRevision?:number }`
- `power`: `{ equippedPower:null|"cyclone"|"turbo"|"laser", available:boolean, cooldown:number, active:boolean }`
- `assist`: `{ tutorialActive?:boolean, trafficHintVisible?:boolean, suggestedDirection?:null|"left"|"right", dangerTapProgress?:number, continueCost?:number, canContinue?:boolean }`
- `ui`: `{ activePanel:null|"menu"|"shop"|"stats"|"leaderboard"|"sectorResult"|"gameOver", hasStartControl:boolean, hasRetryControl:boolean, hasContinueControl?:boolean, hasShopControl:boolean, hasPauseControl:boolean, hasStatsControl?:boolean, hasLeaderboardControl?:boolean }`
- `result`: `{ type:"none"|"sector-cleared"|"time-up"|"crash", final:boolean }`
- `revision`: `{ scene:number, hud:number, traffic:number, input:number }`

Fields may contain additional information, but must not return internal object graphs, private entity references, or render trees.

### Action Schema

`input(action)` supports player-level actions:

- `{ type:"start" }`: Equivalent to the player starting by clicking/touching/pressing a key.
- `{ type:"key", code:"ArrowLeft"|"ArrowRight"|"KeyA"|"KeyD"|"KeyV"|"KeyM"|"KeyS"|"Space" }`: Equivalent keyboard input.
- `{ type:"tapPlayfield", side:"left"|"right"|"center" }`: Equivalent to clicking/touching the main driving area.
- `{ type:"dragPlayfield", direction:"left"|"right", distance?:number }`: Equivalent to a short drag/swipe.
- `{ type:"pause" }`, `{ type:"resume" }`, `{ type:"openMenu" }`, `{ type:"closeMenu" }`
- `{ type:"openShop" }`, `{ type:"closeShop" }`, `{ type:"buyOrEquipBike", bikeTier:number }`
- `{ type:"openStats" }`, `{ type:"closeStats" }`, `{ type:"openLeaderboard" }`, `{ type:"closeLeaderboard" }`
- `{ type:"toggleView" }`
- `{ type:"usePower" }`
- `{ type:"retry" }`, `{ type:"continue" }`
- `{ type:"dangerTap" }`: One player click/key press during the danger-dodge state.

Illegal actions, illegal enum values, out-of-range purchases, insufficient balance, an unequipped ability, an ability on cooldown, driving input while paused, and so on must return `{ ok:false, reason, snapshot }` or a Snapshot with unchanged state, and must not throw an exception.

### Legal loadScenario Scenarios

`loadScenario(name)` may construct only legal prerequisite states:

- `"fresh_playing"`: Started, at low or medium speed, with no blocking panel and the player in a legal middle lane.
- `"left_edge"` / `"right_edge"`: Started, with the player in the legal leftmost/rightmost lane, for testing out-of-bounds rejection.
- `"near_checkpoint"`: Started and very close to, but not yet past, the next checkpoint; subsequent driving advancement must trigger the reward.
- `"low_time"`: Started, with very little time remaining but not yet failed; subsequent waiting or driving triggers failure.
- `"traffic_ahead"`: Started, with a visible vehicle at a legal distance ahead; subsequent lane-changing/waiting triggers avoidance, near-miss, or collision feedback.
- `"sector_result_ready"`: A sector has just been completed and the results panel is displayed; the results already come from a state summary produced by legally passing checkpoints.
- `"game_over_continue_available"`: Failure results have just been entered, a continue entry point is shown, and balance and remaining uses are sufficient to continue, but continue has not yet been executed.
- `"game_over_continue_unavailable"`: Failure results have just been entered, and the continue entry point is unavailable or balance is insufficient; retry has not yet been executed.
- `"shop_affordable"`: The shop can be opened and the balance is sufficient to purchase one unowned vehicle, but it has not yet been purchased.
- `"shop_insufficient"`: The shop can be opened, but the balance is insufficient to purchase the specified unowned vehicle.
- `"power_ready"`: A vehicle with an owned special ability is equipped, the ability is available, and there is a legal target ahead or visible space for the effect, but the ability has not yet been triggered.
- `"power_cooling"`: A special ability is equipped but is currently on cooldown and cannot yet be triggered again.
- `"danger_active"`: The danger-dodge window has been entered and has not yet succeeded or failed.
- `"assist_hint_active"`: An early-driving or traffic-obstruction hint is being shown, while the player remains in a recoverable driving state.
- `"city_world_activity"`: An urban-activity entity or reward is present ahead, and no collision or pickup result has yet occurred.

Scenarios must not directly set a reward as already collected, a purchase as completed, a vehicle as destroyed, a checkpoint as passed, or a result as locked and then treat that result as the behavior under test.

## Behavioral Trajectory Contract

| Trajectory | M Coverage | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Launch and enter driving | M1/M2 | Default load or `reset()` | Real click/touch on the main scene or `input({type:"start"})` | `phase=playing`, the overlay does not block, the main 3D scene is non-empty, and the HUD has time and progress | No fatal error should occur; after starting, driving must no longer be intercepted by a full-screen overlay |
| Left/right lane-change direction | M3 | `loadScenario("fresh_playing")` | Real Left/Right Arrow key or click on the left/right half of the screen | Left intent decreases `player.screenX`, while right intent increases `player.screenX`; the visuals or revision changes | Opposite directions must be opposite; the direction must not change only the sign in the snapshot without any on-screen change |
| Out-of-bounds rejection | M4 | `loadScenario("left_edge")` or `"right_edge"` | Continue giving outward input | `lane`, `screenX`, or the legal range remains in bounds | `totalBefore/totalAfter`: Score, balance, checkpoints, and vehicle count do not change because of illegal input |
| Continuous driving and traffic | M5 | `loadScenario("fresh_playing")` | Wait after starting and perform one lane change | `distance`, `speed`, `traffic.movingCount`, or `revision.traffic` advances, and the main scene changes | The same wait while paused should not advance distance or speed |
| Checkpoint reward | M6 | `loadScenario("near_checkpoint")` | Keep driving until crossing the checkpoint | At least one of the checkpoint count/sector result/remaining time/score increases according to the rules, and the HUD stays in sync | The same checkpoint must not be counted repeatedly |
| Collision or near-miss feedback | M7 | `loadScenario("traffic_ahead")` | The player changes lanes to pass close or stays in the lane and collides | Near misses increase, or collision feedback/impact count/speed reduction/failure state appears, with visible feedback | A traffic target must not be passed through without feedback |
| Timed failure and retry | M8 | `loadScenario("low_time")` | Wait for the countdown to expire, then trigger retry | Results are displayed after `phase=game-over`; after retry, temporary score/speed/traffic is cleared and long-term balance is retained | Driving input after a terminal result should not continue to add points or change lanes |
| Menu blocking | M9 | `loadScenario("fresh_playing")` | Use the real menu button or `input({type:"openMenu"})`, then attempt to change lanes, and finally close it | While the panel is open, `overlayBlocking=true` and lane changes/distance are frozen; interaction resumes after closing | When `phase=playing`, no blocking panel may remain over the main scene |
| Shop purchase/rejection | M11 | `loadScenario("shop_affordable")` or `"shop_insufficient"` | Open the shop and click/input to purchase | With sufficient funds, balance decreases and ownership/equipment updates; with insufficient funds, return a rejection and provide visible error feedback | Balance must not be negative; on the rejection path, owned/equipped/balance unchanged |
| Special-ability cooldown | M12 | `loadScenario("power_ready")` | Use the ability, then immediately use it a second time | The first use produces a visible effect or target change and begins cooldown; the second use is rejected or produces no additional effect | No repeated destruction/second reward during cooldown; the ability is unavailable when unequipped |
| Paid continue | M15 | `loadScenario("game_over_continue_available")` | Real continue button or `input({type:"continue"})` | Balance decreases by the displayed cost, the failure panel closes, sector/checkpoint progress is retained, and driving resumes | Balance must not be negative; an unavailable-continue scenario must reject the action with progress and balance unchanged |
| Complete early hint | M14 | `loadScenario("assist_hint_active")` | Change lanes in the hinted direction or complete the corresponding driving action | The traffic/lane-change hint disappears or enters a completed state, and driving can continue | The hint must not block permanently; its direction must not conflict with the on-screen movement result |
| Urban activity/reward | M16 | `loadScenario("city_world_activity")` | Approach a pedestrian/crosswalk/reward and wait or choose a route | At least one visible state change occurs for a pedestrian/vehicle/reward; on pickup, balance, shield, statistics, or feedback changes | The same reward must not be settled repeatedly; balance should not increase from nothing when it is not triggered |

## DOM/HUD/Canvas/WebGL Postconditions

- The main driving view must have a visible main render area, and `playfield.bounds` must match the actual clickable/touchable area.
- Real click, touch, drag, and keyboard input should act on the same game state and be reflected in the Snapshot, HUD, and main scene.
- The HUD's time, checkpoint/sector, distance/speed, earnings, or result state should remain synchronized with the Snapshot; wording and layout may differ.
- While a blocking panel is open, `overlayBlocking=true`, `canInteractWithPlayfield=false`; after it is closed, the reverse is true.
- The WebGL/3D scene must be readable: it cannot be pure black, a solid color, or only UI. After a definite input, the main-scene screenshot or `revision.scene` should show a change related to the action.
- Shop, continue, statistics, hints, and world activity must be mutually corroborated by the Snapshot summary and visible HUD/panel feedback; for example, garage ownership/equipment, continue cost, whether a hint is active, city entities, and pickup results should all be observable.

## Feature-Interface Mapping

| Feature | Required public observation/action |
|---|---|
| Launch/reset | `reset`, `input({type:"start"})`, real click/keyboard |
| Directional lane changes | `player.screenX`, `player.lane`, `playfield.leftPoint/rightPoint`, real key/click/drag |
| Out-of-bounds rejection | `loadScenario("left_edge"/"right_edge")`, illegal directional input, `unchanged` state summary |
| Traffic and collisions | `traffic.vehicleCount/movingCount/nearestAhead`, `score.impacts`, `result`, visible scene revision |
| Checkpoints/sectors | `progress.checkpoint/checkpointsRequired/timeRemaining`, `phase=sector-cleared`, HUD revision |
| Menu blocking | `ui.activePanel`, `overlayBlocking`, `canInteractWithPlayfield`, real button/key |
| Shop economy | `economy.balance`, `garage.ownedTiers/equippedTier/equippedPower` summary, rejection return |
| Abilities | `power` summary, `traffic`/player airborne/scene revision, cooldown rejection |
| Retry/continue | `result`, `phase`, separation of temporary/long-term state |
| Paid continue | `assist.continueCost/canContinue`, `economy.balance`, `progress`, visible continue entry point |
| Early hints | `assist.tutorialActive/trafficHintVisible/suggestedDirection`, real directional input, hint disappears |
| Urban activity/rewards | `world.pedestrianCount/crosswalkCount/collectibleCount/collectedThisRun`, `economy` or statistics summary, scene/world revision |

## Generation Acceptance Constraints

The generation model may read only the requirements, GDD, and this TDD. It must not read or depend on evaluation-side files, reports, old artifacts, or historical outputs. When implementing `window.__gameTest`, it must not merely return `{ ok:true }` or change only hidden variables; each action must synchronously or after a short delay drive the real HUD/DOM/3D scene to the externally visible postconditions declared in this TDD.

No fixed DOM structure, fixed wording, fixed colors, fixed pixels, fixed resolution, private variables, private functions, or specific physics algorithm may be required. P1/P2 are evaluated semantically from observable results and invariants after player input.
