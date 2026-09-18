# Diner Dasher TDD

## Objective

This TDD defines the public testable contract and player-level actions. The generated work may freely choose its internal structure, rendering method, copy, and art, but it must allow the same set of player behaviors and public summaries to express the states, inputs, and postconditions of `game-spec.md` and `design-doc.md`.

## Stable Public Interface

The following is recommended and required to be exposed:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  getSnapshot(): Snapshot,
  input(action): ActionResult,
  loadScenario(name, options): Snapshot
}
```

### `reset(options)`

- Semantics: Clears the temporary state of the current business day and uses `options` to determine whether to clear long-term progress.
- Input: `{ clearSave?: boolean, day?: number, money?: number }`.
- Output: `Snapshot`.
- Postcondition: If `clearSave` is true, the day returns to 1, funds return to 0, the basic menu is unlocked, and upgrades are 0; the current screen is `menu` or `playing`, and the business day can be started through an actual or public action.

### `getSnapshot()`

- Semantics: Returns a player-understandable state summary without exposing the internal object graph.
- Output: See Snapshot Schema.

### `input(action)`

- Semantics: Executes a player-level action and must drive the actual HUD/screen state synchronously or after a short delay.
- Output: `ActionResult = { ok: boolean, reason?: string, snapshot: Snapshot }`.
- Rule: A valid action returns `ok: true` and produces the corresponding postcondition; an invalid action returns `ok: false` or keeps the state unchanged and provides a rejection reason, and must not throw an exception.

### `loadScenario(name, options)`

Only valid prerequisite states may be constructed; it cannot directly grant a victory, award points, complete a purchase, complete an order, or skip the core rule chain.

Allowed scenarios:

- `active_shift_basic`: During business, there is at least 1 customer, the order comes from the basic menu, stations are empty, and the tray is empty.
- `ready_station_item`: During business, there is a customer, and a station has a completed item that has not yet been collected.
- `tray_with_correct_item`: During business, there is a customer, the tray contains an item that customer needs and that has not yet been delivered, and income and the number of customers served have not yet increased.
- `tray_with_wrong_item`: During business, there is a customer, and the tray contains an item that is not part of that customer’s order.
- `tray_with_duplicate_item`: During business, one item in a customer’s order has already been delivered, the tray still contains the same item, and income has not increased because of the duplicate item.
- `tray_at_capacity`: During business, the tray item count equals its capacity, and another completed station item is available to collect.
- `impatient_customer`: During business, at least 1 customer is close to running out of patience, and the tray and income state do not have successful results preset.
- `locked_menu_item`: During business, at least 1 locked menu item is visible, and the related station is idle.
- `shop_with_money`: In the shop, the player has enough funds to purchase at least one upgrade that is not at maximum level or an unlock that is not owned.
- `shop_insufficient_money`: In the shop, the player has insufficient funds to purchase a visible upgrade item.
- `shop_scrollable`: In the shop, the upgrade/unlock list extends beyond the currently visible range, and items can be accessed by scrolling, dragging, or pagination.
- `shop_with_tray_upgrade`: In the shop, the player can purchase an upgrade that increases tray capacity, and it is not yet at maximum level.
- `day_near_close`: During business, it is close to closing time and should not proceed directly to the end-of-day summary; the summary is entered only after subsequently waiting or clearing the customers.

## Action Schema

| Action | Required fields | Semantics |
|---|---|---|
| `{ type: "startShift" }` | none | Enter the business day from the menu |
| `{ type: "tapMenuItem", itemId }` | `itemId` is a public menu id | Equivalent to the player clicking a preparation button |
| `{ type: "collectStation", stationId }` | `stationId = fryer|grill|drinks|generic` | Equivalent to the player clicking a completed station |
| `{ type: "dragTrayItemToCustomer", trayIndex, customerId }` | `trayIndex`, `customerId` | Equivalent to dragging from the tray and releasing in a customer area |
| `{ type: "dragTrayItemToPoint", trayIndex, screenX, screenY }` | `trayIndex`, `screenX`, `screenY` | Equivalent to dragging to and releasing at any screen point, for an invalid release |
| `{ type: "touchDragTrayItemToCustomer", trayIndex, customerId }` | `trayIndex`, `customerId` | Equivalent to touching and holding a tray item, moving it to a customer area, and releasing |
| `{ type: "wait", seconds }` | `seconds > 0` | Advance time; preparation, patience, and business time should update |
| `{ type: "continueToShop" }` | none | Enter the shop from the end-of-day summary |
| `{ type: "buy", upgradeId }` | `upgradeId` is a public upgrade/unlock id | Attempt a purchase |
| `{ type: "scrollShop", deltaY }` | `deltaY` is a finite number | Equivalent to the player dragging/scrolling the shop list, changing the visible item range |
| `{ type: "startNextDay" }` | none | Use the next-day entry point from the shop |
| `{ type: "pause" }`, `{ type: "resume" }` | none | Optional P2; if supported, pause/resume business timing |

Invalid actions: an unknown `type`, a nonexistent `itemId/stationId/customerId/upgradeId`, an out-of-bounds `trayIndex`, non-finite numeric coordinates, a non-positive `wait.seconds`, an item that cannot be purchased, or a locked menu item must all be rejected, and key state must remain unchanged.

## Snapshot Schema

```javascript
{
  phase: "menu" | "playing" | "dayComplete" | "shop" | "paused",
  screen: "menu" | "playing" | "dayComplete" | "shop",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  day: number,
  clock: { hour: number, minute: number, isClosingTime: boolean },
  money: { total: number, today: number },
  stats: { customersServedToday: number, lifetimeEarnings?: number, daysPlayed?: number },
  customers: [
    {
      id: string | number,
      order: [{ itemId: string, served: boolean }],
      patience: { current: number, max: number, ratio: number },
      mood: "neutral" | "impatient" | "angry" | "happy" | "leaving",
      bounds: { screenX: number, screenY: number, width: number, height: number }
    }
  ],
  stations: [
    {
      id: "fryer" | "grill" | "drinks" | string,
      category: "fried" | "grilled" | "drink" | string,
      busy: boolean,
      ready: boolean,
      itemId: string | null,
      progress: number,
      bounds: { screenX: number, screenY: number, width: number, height: number }
    }
  ],
  menuItems: [
    {
      itemId: string,
      category: "fried" | "grilled" | "drink" | string,
      unlocked: boolean,
      bounds: { screenX: number, screenY: number, width: number, height: number }
    }
  ],
  tray: {
    capacity: number,
    items: [{ itemId: string, bounds: { screenX: number, screenY: number, width: number, height: number } }]
  },
  upgrades: [{ upgradeId: string, level: number, maxLevel: number, cost: number | null, owned?: boolean, affordable?: boolean }],
  shop: {
    scrollOffset?: number,
    maxScroll?: number,
    visibleItems?: [{ upgradeId: string, affordable?: boolean, bounds: { screenX: number, screenY: number, width: number, height: number } }],
    nextDayBounds?: { screenX: number, screenY: number, width: number, height: number }
  },
  feedback: { lastEvent?: string, messages?: string[] },
  tutorial: { visible: boolean, targetItemId?: string },
  drag: {
    active: boolean,
    itemId?: string,
    screenX?: number,
    screenY?: number
  },
  observability: {
    playfieldBounds: { screenX: number, screenY: number, width: number, height: number },
    canvasReadable: boolean,
    renderRevision: number,
    hudRevision: number
  },
  persistence?: {
    saveAvailable?: boolean,
    lastSavedDay?: number,
    lastSavedMoney?: number,
    externalPanelBlocking?: boolean
  }
}
```

Field requirements:

- `bounds.screenX/screenY` are the browser screen coordinates of the center of an element or semantic region and can be used for actual mouse/touch input.
- `renderRevision` or `hudRevision` must increment after the visible screen/HUD changes due to a player action; they cannot increase only because a natural animation is idling.
- `money.today` is synchronized with today’s income in the HUD; `money.total` is synchronized with long-term funds in the menu/shop.
- When `drag.active` is true, `drag.screenX/screenY` represent the visible center of the item the player is dragging on screen; it must move with the mouse or touch position.
- `shop.visibleItems[].bounds` represents the clickable shop item region; after the shop is scrolled or dragged, the visible item range, `scrollOffset`, or equivalent summary should update.
- If provided, `persistence.externalPanelBlocking` must remain false when external results/saving fail, indicating that core gameplay is not blocked.

## DOM/HUD/Canvas Postconditions

- There must be a primary visible playfield describable by `observability.playfieldBounds`; either canvas or DOM may be used.
- The main scene must be non-empty and readable, and after a player action, a change must be observable through at least one of `renderRevision`, HUD values, or the customer/station/tray summaries.
- When `phase === "playing"`, `overlayBlocking` must be false and `canInteractWithPlayfield` must be true.
- An actual mouse click or touch on `menuItems[].bounds` should be equivalent to `input({ type: "tapMenuItem" })`.
- An actual mouse drag or touch drag from `tray.items[].bounds` to `customers[].bounds` should be equivalent to `input({ type: "dragTrayItemToCustomer" })`, while keeping the dragged item’s screen direction consistent with the pointer direction.
- An actual click or tap on `shop.visibleItems[].bounds` should be equivalent to `input({ type: "buy" })`; actually dragging/scrolling the shop list should change the visible item range or keep it within valid boundaries.

## Behavioral Trajectory Contract

| Trajectory | Coverage M | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Launch and enter business | M1/M2 | `reset({clearSave:true})` | `input({type:"startShift"})` or actually click the start entry point | `phase=playing`, the playfield is interactive, and the HUD/scene is readable | No blocking overlay appears |
| Prepare and collect | M4/M5 | `active_shift_basic` | Click an unlocked menu item, wait for completion, and click the station | The station goes from `busy`->`ready`->empty, and the tray count is +1 | Clicking another item of the same type while busy does not replace it |
| Actual drag for correct serving | M6/M7 | `tray_with_correct_item` | Use an actual mouse to drag from the center of the tray item to the center of the target customer | The number of served order items increases; if the order is complete, income/customers served increases and the customer is satisfied or leaves | The quantity removed from the tray matches successful deliveries |
| Touch drag for correct serving | M6/M7 | `tray_with_correct_item` | Use an actual touch to drag from the center of the tray item to the center of the target customer | The number of served order items increases; if the order is complete, income/customers served increases and the customer is satisfied or leaves | The touch path must not update only hidden state |
| Reject invalid release | M6/M8 | `tray_with_correct_item` | Drag to a non-customer playfield point and release | Income, completion count, and customers served are unchanged; the tray retains the item or does not count the action as successful | The order must not be completed |
| Reject incorrect item | M8 | `tray_with_wrong_item` | Drag it to the customer | `ok=false` or error feedback; income is unchanged | Customer order completion is unchanged |
| Reject duplicate item | M8 | `tray_with_duplicate_item` | Drag the already completed item to the same customer again | Rejection or error feedback; income, completion count, and the quantity successfully removed from the tray are unchanged | Duplicate items must not score a second time |
| Tray capacity | M5/M8 | `tray_at_capacity` | Attempt to collect the additional completed item | Reject and give a prompt; the tray count still equals capacity | The finished item remains visible at the station |
| Departure after patience depletion | M3/M9 | `impatient_customer` | Wait until the customer’s patience is depleted | The customer becomes angry/leaving or leaves the scene; income and customers served do not increase | Depleted patience must not award a reward |
| End-of-day summary | M9 | `day_near_close` | Wait until closing and handle/wait for existing customers to leave | `phase=dayComplete`, displaying today’s income and customers served | The increment in `money.total` equals today’s income |
| Shop purchase | M10 | `shop_with_money` | Actually click a visible purchasable upgrade or `input({type:"buy"})` | Total funds decrease and the upgrade level/owned status increases | Funds are non-negative and costs are conserved |
| Shop scrolling | M10 | `shop_scrollable` | Drag/scroll in the shop list | The visible item range or scrolling summary changes and remains within valid boundaries | Items in a long list cannot be permanently unreachable |
| Reject insufficient funds | M10 | `shop_insufficient_money` | Attempt a purchase | Rejection feedback; funds and level are unchanged | Free acquisition is not allowed |
| Next-day progress | M11 | Shop | `input({type:"startNextDay"})` | Day +1, long-term progress retained, and the temporary tray/customers/stations cleared | Upgrades and unlocks are not lost |
| Subsequent effect of an upgrade | M11 | `shop_with_tray_upgrade` | Purchase the capacity upgrade and start the next day | Subsequent tray capacity increases or the upgrade effect summary increases | A purchase cannot change only the shop number |
| Reject locked item | M11b | `locked_menu_item` | Attempt to prepare the locked menu item | Rejection feedback; the corresponding station remains idle and the tray does not increase | A locked item cannot be prepared for free |
| New-player prompt | M12 | First business day of a new save | Click a preparation button for the first time | The prompt changes from visible to invisible | The prompt must not block the click |

## Feature-Interface Mapping

| GDD M | Public contract |
|---|---|
| M1/M2 | `reset`, `input(startShift)`, `getSnapshot.phase`, `observability` |
| M3 | `customers`, `input(wait)`, `patience` |
| M4 | `input(tapMenuItem)`, `stations`, `menuItems` |
| M5 | `input(collectStation)`, `tray` |
| M6 | `bounds`, `drag`, actual mouse/touch drag, `input(dragTrayItemToCustomer/Point/touchDragTrayItemToCustomer)` |
| M7/M8 | `customers[].order.served`, `money.today`, `stats.customersServedToday`, `feedback` |
| M9 | `input(wait)`, `phase=dayComplete`, `money` |
| M10/M11 | `upgrades`, `shop`, `input(buy/scrollShop/startNextDay)`, `loadScenario(shop_*)` |
| M11b | `menuItems[].unlocked`, `persistence`, `input(tapMenuItem)`, `loadScenario(locked_menu_item)` |
| M12/M13 | `tutorial`, `feedback`, `observability.renderRevision/hudRevision`, `persistence.externalPanelBlocking` |

## Delivery Acceptance Constraints

The deliverable must be independently completable based on the requirements document and this TDD. `window.__gameTest` must not merely return `{ ok: true }` or only change invisible variables; every setup/action must drive the actual HUD/screen/interactive state to the external postconditions declared by this TDD.
