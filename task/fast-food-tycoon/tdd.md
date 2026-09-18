# Fast Food Tycoon TDD

## Public Test Contract Objectives

The implementation must expose the player-level public contract `window.__gameTest` for stable observation and construction of valid prerequisite states. This contract cannot directly set victory, directly add score, directly eliminate objects, or bypass the business chain; real player input must drive the same state and visuals.

This document defines only the public testable contract: player-level action, valid scenario, stable snapshot summaries, candidate field values, rejection/invariants, and externally visible postconditions. Gameplay requirements are governed by `game-spec.md`; this document does not specify source structure, private functions/variables, DOM/CSS structure, fixed coordinates/text/colors/assets, rendering technology, main-loop ordering, or specific business algorithms.

Recommended interface:

```javascript
window.__gameTest = {
  reset(options?: { clearSave?: boolean }): Snapshot,
  getSnapshot(): Snapshot,
  input(action: Action): Snapshot,
  loadScenario(name: string): Snapshot
}
```

## Snapshot Schema

`Snapshot` must be a serializable summary:

- `phase`: `"loading" | "playing" | "panel" | "paused" | "transition"`.
- `screen`: `"loading" | "restaurant" | "vault" | "upgrade" | "offline" | "prestige"`.
- `ui`: `{ overlayBlocking:boolean, canInteractWithPlayfield:boolean, activePanel:string|null }`.
- `render`: `{ ready:boolean, nonBlank:boolean, canvas:{ width:number, height:number } | null }`.
- `player`: `{ worldX:number, worldZ:number, screenX:number, screenY:number, carryingFood:number, foodCapacity:number, carryingMoney:number }`.
- `camera`: `{ angle:number, zoom:string }`.
- `resources`: `{ currency:number, vaultBalance:number, foodOnGround:number, cashOnGround:number }`.
- `service`: `{ counterStock:number, counterCapacity:number, customerQueue:number, servedCustomers:number, cashPile:number }`.
- `build`: `{ unlockTiles:Array<{ id:string, kind:string, cost:number, deposited:number, unlocked:boolean, screenX:number, screenY:number }> }`.
- `staff`: `{ cashier:boolean, runner:boolean, cleaner:boolean, visibleWorkers:number, workerMotionRevision:number }`.
- `upgrades`: `{ capacity:number, speed:number, collection:number, vault:Record<string, number> }`.
- `progress`: `{ prestigeLevel:number, profitMultiplier:number, rushActive:boolean, rushTimeLeft:number|null, saved:boolean }`.
- `interactables`: `{ playfieldBounds:{ x:number, y:number, width:number, height:number }, playerBounds?:{ x:number, y:number, width:number, height:number }, joystickBounds?:{ x:number, y:number, width:number, height:number }, panelControls?:Array<{ id:string, kind:string, enabled:boolean, screenX:number, screenY:number }> }`.
- `lastAction`: `{ ok:boolean, type:string, reason?:string, changed?:Array<string> } | null`.

Numerical values may be approximate, but must stably reflect player-visible state. `screenX/screenY` are browser CSS pixel coordinates used to verify screen direction.

## Action Schema

`input(action)` accepts player-level actions:

- `{ type:"key", key:"ArrowLeft"|"ArrowRight"|"ArrowUp"|"ArrowDown"|"KeyW"|"KeyA"|"KeyS"|"KeyD", durationMs?:number }`
- `{ type:"joystick", dx:number, dy:number, durationMs?:number }`, where `dx/dy` represent screen direction and have a range of `[-1,1]`.
- `{ type:"moveTo", target:"kitchen"|"food"|"counter"|"cash"|"unlock"|"staff"|"vault"|"driveThru"|"trash", id?:string }`, representing player-understandable automatic pathfinding or equivalent continuous movement, which cannot directly complete the target result.
- `{ type:"wait", durationMs:number }`
- `{ type:"openPanel", panel:"vault"|"upgrade"|"offline" }`
- `{ type:"closePanel" }`
- `{ type:"rotateCamera", direction:"left"|"right" }`, equivalent to the player clicking the camera rotation button; it must not directly move the player or change business resources.
- `{ type:"toggleZoom" }`, equivalent to the player clicking the zoom button; it must not directly move the player or change business resources.
- `{ type:"panelClick", control:string }`, such as purchasing an upgrade category, switching to the statistics page, or executing long-term progression.
- `{ type:"resetRun", clearSave?:boolean }`

An invalid action, unknown target, out-of-range parameter, purchase with insufficient balance, pickup while fully loaded, or deposit into full inventory must return `lastAction.ok === false` or `reason`, and keep related resources unchanged.

## Valid Prerequisites for loadScenario

Allowed scenarios:

- `readyKitchen`: The player is near kitchen equipment, the equipment is ready, and the player is not fully loaded; the food for this preparation has not yet been generated.
- `carryingFood`: The player already possesses a small amount of food through a valid chain, the service point can accept it, and a customer queue exists.
- `cashReady`: Service has been completed, a cash pile exists, and the player has not yet collected it.
- `upgradeAffordable`: The player has sufficient funds to purchase a vault or basic upgrade, and the purchase has not yet occurred.
- `upgradeInsufficient`: The player’s funds are below the specified upgrade cost, and the purchase has not yet occurred.
- `unlockAffordable`: The player has sufficient funds and is standing in front of an incomplete unlock/hiring plot, and the plot has not yet been completed.
- `workerHired`: At least one employee has been hired, a resource that can be transported or served exists, and the employee has not yet completed this work.
- `depthService`: At least one dining table, drive-thru, self-service point, or rush-period system is in a valid observable prerequisite state; if the implementation trims a P2 system, the scenario should return another P2 service system that remains observable, and subsequent waiting, restocking, or service actions have not yet completed this result.
- `panelOpen`: A panel is open, and the main scene is marked as blocked or partially blocked.
- `nearBoundary`: The player is near the restaurant boundary for verifying that the boundary cannot be crossed.

Scenarios are prohibited from directly providing “purchase just completed,” “cash just collected,” “service just completed,” or “prestige completed” as a postcondition; these must be triggered by a subsequent action or real input.

## DOM/HUD/Canvas Postconditions

- When `render.ready` and `render.nonBlank` are true, the main 3D view must be readable; after real movement or business actions, the visual pixels or the player’s `screenX/screenY` should change.
- The HUD must represent funds; when food, inventory, cash piles, queues, or upgrades change, the HUD/panel or snapshot must synchronize in at least one place.
- After a panel opens, `ui.activePanel` is non-empty; after it closes, `ui.overlayBlocking === false` and `ui.canInteractWithPlayfield === true`.
- Real keyboard, real mouse click, and touch joystick paths should produce the same type of state changes as `input(action)`.

## Behavioral Trajectory Contract

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Startup to playable | M1 | Empty | Wait for loading | phase/screen indicate the restaurant, render is non-empty, and the HUD has funds | overlay does not block |
| Directional movement | M2 | reset or nearBoundary | Actually press right and then left, or move the joystick right/left | The direction of the player’s screenX change is opposite | Does not cross the boundary |
| Directional movement after rotation | M2 | reset | After rotateCamera left/right, actually press right and then left | camera.angle changes, and the player’s screenX still produces opposite directional displacement for screen left and right | The rotation action must not directly change resources or teleport the player |
| Prepare and pick up | M3 | readyKitchen | Wait for preparation, approach the food | carryingFood increases, and foodOnGround first increases and then decreases | carryingFood <= foodCapacity |
| Service and cash | M4/M5 | carryingFood | moveTo counter, wait, moveTo cash | counterStock/servedCustomers/cashPile/currency advance according to the chain | The total amount of food transferred does not increase from nothing |
| Unlock/hire | M6 | unlockAffordable | moveTo unlock/staff, wait | currency decreases, deposited increases, and a facility/employee is visible after completion | totalBefore/totalAfter conservation of funds + investment |
| Panel upgrade | M7 | upgradeAffordable | Open the panel, click purchase, close | The level increases, the balance decreases, and movement is possible after closing | insufficient-balance purchase unchanged |
| Employee work | M8 | workerHired | wait | workerMotionRevision increases, and inventory/cash/queue changes validly | No earnings are produced without resources |
| Long-term progression | M13 | Valid prerequisite with high funds | Open the panel and execute long-term progression | prestigeLevel increases, and temporary business state resets | Rejected when funds are insufficient |

## Feature-Interface Mapping

- M1: `getSnapshot().render`, `getSnapshot().ui`, DOM/canvas visibility.
- M2: Real `keyDown/keyUp`, `input({type:"key"})`, `input({type:"rotateCamera"})`, `player.screenX/screenY`, `camera.angle`.
- M3: `loadScenario("readyKitchen")` + `input({type:"wait"})` + `resources.foodOnGround/player.carryingFood`.
- M4/M5: `loadScenario("carryingFood"|"cashReady")` + `input({type:"moveTo"})`/real input + `service/resources`.
- M6: `loadScenario("unlockAffordable")` + `input({type:"moveTo", target:"unlock"})` + `input({type:"wait"})`.
- M7: Real DOM click on panel buttons, `input({type:"openPanel"})`, `input({type:"panelClick"})`.
- M8-M13: `loadScenario` only constructs valid prerequisites, and subsequent `wait`, panel clicks, or player movement triggers them.

## Rejections and Invariants

- Any purchase with insufficient balance, unknown action, unknown panel, unknown camera direction, negative duration, joystick value outside the range, pickup while fully loaded, or deposit into a full service point must be rejected and `unchanged`.
- `currency`, `vaultBalance`, `carryingFood`, `counterStock`, and `cashPile` must not be negative.
- A single food deposit satisfies `foodTotalBefore === foodTotalAfter`, where total is the observable summary of food carried by the player, food on the ground, counter inventory, food in flight, and the served count.
- After a panel closes, real movement input must change the player’s position; otherwise it is considered a residual blocking layer.
