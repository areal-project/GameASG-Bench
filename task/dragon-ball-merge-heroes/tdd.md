# Dragon Ball Merge Heroes TDD

## Public Test Contract

The implementation must expose a player-semantic-level public contract:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name): Snapshot
}
```

These interfaces may only drive or read public gameplay state and must not require tests to know private variables, internal functions, a fixed DOM structure, fixed assets, or a specific rendering algorithm. Interface actions must be equivalent to player actions; real button, mouse, touch, and keyboard input must also drive the same game state and visuals.

## Snapshot Schema

`Snapshot` must include at least:

- `phase`: `loading | playing | collection | shop | resetConfirm`
- `screen`: Summary of the currently visible main screen, usually consistent with `phase`
- `overlayBlocking`: Whether a panel or loading layer blocks the training grid
- `canInteractWithPlayfield`: Whether the training grid can receive player input
- `currency`: Current currency, a non-negative number
- `incomePerSecond`: Current income per second, a non-negative number
- `recruitCost`: Current recruitment cost, a positive number
- `canRecruit`: Whether recruitment is currently possible
- `gridSize`: Fixed at 4
- `board`: `{ occupiedCount, capacity, cells }`
- `board.cells[]`: Each cell is `{ index, occupied, heroId?, family?, tier?, enhancement?, production?, bounds? }`
- `collection`: `{ unlockedHeroes, totalHeroes, unlockedBackgrounds, totalBackgrounds, progressPercent }`
- `shop`: `{ open, selectedBackground, ownedBackgrounds, items }`
- `shop.items[]`: `{ id, owned, selected, price, canAfford, bounds? }`
- `ui`: `{ recruitButton?, shopButton?, collectionButton?, closeButton?, trashZone?, playfieldBounds? }`
- `lastEvent`: The most recent player-semantic result, such as `recruited | moved | swapped | merged | fused | enhanced | deleted | rejected | purchased | selected | opened | closed | reset`
- `revision`: State change sequence number. Any action that successfully changes gameplay state should increment it.

`bounds` uses screen CSS coordinates: `{ x, y, width, height, centerX, centerY }`. It is used for real mouse/touch input and does not require fixed coordinates.

Collection depth requirements: `collection.totalHeroes >= 24`, representing two standard 9-tier progression lines and two 3-tier fusion progression lines; `collection.totalBackgrounds >= 7`, and the shop's `shop.items` should expose equivalent background depth.

## Action Schema

`input(action)` supports the following player-semantic actions:

- `{ type: "recruit" }`
- `{ type: "keyboardRecruit" }`
- `{ type: "dragCell", from, to }`
- `{ type: "dragToTrash", from }`
- `{ type: "openCollection" }`
- `{ type: "closePanel" }`
- `{ type: "openShop" }`
- `{ type: "buyBackground", itemId }`
- `{ type: "selectBackground", itemId }`
- `{ type: "confirmReset" }`
- `{ type: "wait", ms }`

Illegal actions, out-of-range cells, an incorrect action type, purchases with insufficient balance, recruitment with a full grid, and merges that cannot advance further must all return a snapshot or result object containing rejection semantics; they must not throw exceptions or change unrelated state. Returning `{ ok:false, reason, snapshot }` is allowed, but passing conditions cannot depend only on `ok`.

## Scenario Contract

`loadScenario(name)` may only construct valid precondition states:

- `emptyStart`: Initial currency, empty training grid, default background.
- `oneAffordableRecruit`: Sufficient balance and at least one empty cell.
- `oneProducer`: One basic hero on the board, income greater than 0, with no waiting income granted in advance.
- `sameTierPair`: Two same-tier heroes of the same type that can undergo a standard merge are on the board and have not yet merged.
- `newUnlockMergePair`: Two same-tier heroes of the same type that can undergo a standard merge are on the board, and the merge result has not yet been counted in the hero collection.
- `fusionPair`: Two specified heroes from different basic factions are on the board and have not yet fused; dragging them together should generate one fusion-line hero.
- `differentPair`: Two non-mergeable heroes are on the board; dragging them together should swap them or reject the merge.
- `fullBoardNoMerge`: The training grid is full and has no empty cell immediately available for recruitment.
- `trashReady`: A deletable hero is on the board, and no deletion return has yet been received.
- `directionMove`: A hero has at least one empty cell on both its left and right, for validating screen-space drag direction; no movement postcondition has occurred after loading.
- `affordableShop`: The balance is sufficient to purchase at least one unowned background.
- `expensiveShop`: At least one background is unowned and unaffordable with the current balance.
- `maxTierPair`: Two maximum-tier heroes of the same type and same enhancement level are on the board and have not yet been enhanced.

No scenario may directly set victory, directly add score, directly complete a merge, directly purchase a background, or directly delete a hero. The tested postcondition must be triggered by a subsequent player action.

## DOM/HUD/Canvas Postconditions

- The main scene must have visible training-grid and card rendering. If canvas is used, the main canvas should be non-empty and should show a visible change related to the action after real input.
- The HUD must synchronously communicate `currency`, `incomePerSecond`, `canRecruit`, and collection progress.
- When the collection or shop is opened, `overlayBlocking=true` and `canInteractWithPlayfield=false`; after closing, these are reversed.
- Real mouse dragging must be completed using `board.cells[].bounds` or a semantically equivalent area and must not require fixed pixels.
- The delete zone must expose `ui.trashZone.bounds` or a semantic area that can be clicked or receive a drag-and-drop.

## Behavior Trajectories

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Boot to playable | M1 | Page load or `reset` | Wait for loading to finish | `phase=playing`, training grid and HUD visible, main scene non-empty | overlay does not block the training grid |
| Recruit by button/key | M2 | `oneAffordableRecruit` | Real click on recruit or press the spacebar | Currency decreases, occupied cells increase, HUD updates | Currency is not negative, at most 16 cards |
| Move card | M3 | One of two cells has a card and the other is empty | Real drag to the empty cell | Card position changes, occupied count remains unchanged | `totalBefore === totalAfter` |
| Touch move card | M3 | One of two cells has a card and the other is empty | Real touch drag to the empty cell | Card position changes, occupied count remains unchanged | The touch path and mouse path drive the same state |
| Screen-space drag direction | M3 | `directionMove` | Perform real drags to the empty cell on the right and the empty cell on the left respectively | The target card's `bounds.centerX` changes toward the right and left sides of the screen respectively | right delta and left delta have opposite signs |
| Merge pair | M4 | `sameTierPair` | Perform a real drag of one card onto the other and release | Source cell empty, target advances a tier, income or collection increases, merge feedback appears | The postcondition must not already exist before the merge |
| First-unlock merge progress | M4 | `newUnlockMergePair` | Perform a real drag of one card onto the other and release | The number of unlocked heroes or collection progress increases, and the target card advances a tier | The merge result cannot be marked as unlocked in advance |
| Different-family fusion | M5 | `fusionPair` | Perform a real drag of a hero from one basic faction onto a hero from the other and release | Source cell cleared, a fusion-line hero appears in the target cell, income or collection increases | It cannot merely swap and cannot generate a standard same-line tier advancement |
| Idle income | M6 | `oneProducer` | Wait at least 1 second | Currency increases, income HUD is greater than 0 | Currency cannot decrease without input |
| Delete to trash | M7 | `trashReady` | Perform a real drag to the delete zone | Occupied count decreases, currency increases, income decreases | Deletion does not affect the unlocked collection |
| Invalid merge | M3/M4 | `differentPair` | Perform a real drag onto a non-mergeable card | No higher-tier card is generated; cards only swap or stay in place | Card count is conserved, currency unchanged |
| Shop purchase/reject | M9 | `affordableShop` / `expensiveShop` | Open the shop and click a background item | On success, currency is deducted and the background is owned; when insufficient, nothing changes | The rejection path does not change the owned list |
| Collection panel | M8 | Any non-empty progress | Open/close the collection | Progress visible, playable after closing | The training grid is not accidentally activated while the panel is open |
| Collection depth | M5/M8/M9 | Any playable state | Read the collection/shop summary | At least 24 hero forms and 7 backgrounds, with the number of shop items matching the background total or being explainable | A small number of example cards/backgrounds cannot pass |
| Persistence/reset | M10 | Progress exists | Save/reload or confirm reset | Progress restored; confirming reset clears it | A single accidental click cannot clear it |

## Feature Interface Mapping

- M1: `getSnapshot`, DOM/HUD/canvas visibility
- M2: Real click/key + `input({type:"recruit"})`
- M3: Real drag + `input({type:"dragCell"})`
- M4/M5: Real drag from valid preconditions provided by `loadScenario`
- M6: `input({type:"wait"})` or real waiting + HUD/snapshot
- M7: Real drag to trash + `input({type:"dragToTrash"})`
- M8/M9: Real DOM click + `input({type:"openCollection"|"openShop"|"closePanel"})`
- M10: `reset`, `loadScenario`, read snapshot after persistence

## Prohibited Contract Shortcuts

- Do not directly set currency and then claim income growth.
- Do not directly set the target cell to a higher-tier hero and then claim a successful merge.
- Do not use the test interface to directly mark a background as purchased and then claim a successful purchase.
- Do not read or require private object graphs, closure variables, source-file naming, fixed DOM id, fixed copy, fixed colors, or asset names.
