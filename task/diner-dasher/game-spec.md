# Diner Dasher Game Spec

## Requirements Overview

This game is a portrait-oriented 2D restaurant service management game. The player faces the counter, customer area, preparation area, and tray area, completing a cycle of “taking orders, preparing, collecting, dragging to serve, and settling earnings” within a compressed evening business day. The game must support multi-day progression, persistent money, shop upgrades, and menu unlocks, allowing the player to invest each day’s earnings in faster preparation, greater room for error, and more dishes.

## Gameplay Requirements

### P0 Basic Experience

- The game’s initial screen must reliably enter a playable state. On the first day of a new save, the business day may begin directly or may be started through the main menu; with existing progress, the current day, accumulated funds, and an entry point for starting the business day should be visible.
- The main play area must be visible: the top HUD displays business time, the current day, and today’s income; the middle displays up to two customers and each customer’s order, completed items, and patience; the bottom displays three preparation stations, food/drink buttons, and the tray.
- Player input is primarily mouse and touch: click or tap a button to start preparation, click or tap a completed station to collect the item, and hold a tray item, drag it to the customer area, and release to complete delivery. Both mouse and touch should be able to complete the same service path.

### P1 Core Service Loop

- Customers will be seated with 1 to 3 order items. Order items are selected from the currently unlocked menu and must be shown on the customer card or bubble with icons or clear labels.
- Customer patience decreases over time. Patience should be represented by a progress bar, value, expression, or equivalently visible feedback; customers should become more agitated when patience is low. Once patience is depleted, the customer leaves dissatisfied and provides no earnings.
- Three types of preparation stations must exist: fried, grilled, and drinks. Each station can process only one item at a time; clicking another item of the same type while it is busy should be rejected with visible feedback.
- After an available menu item is clicked, the corresponding station enters a preparation state and displays progress. When preparation is complete, the station should clearly indicate that the item is ready to collect; after the player clicks that station, the finished item enters the tray and the station is cleared.
- The tray has a capacity limit. Once the capacity limit is reached, further collection must be rejected without losing the finished item at the station or allowing the tray to exceed capacity.
- Drag direction semantics must match screen space: a tray item should follow the player’s finger/mouse from the starting point to the release point; when dragged left, the item’s visual position moves toward the left side of the screen, and when dragged right, it moves toward the right side of the screen. Delivery is attempted only when released in a customer area; releasing in a non-customer area should not complete an order or remove the item.
- When a correct order item that has not already been delivered is delivered to a customer, that item changes to a completed state in the order and the corresponding item is removed from the tray. If the entire order is completed, the customer enters a satisfied/leaving state and the player receives earnings.
- Delivering an incorrect item or repeatedly delivering the same order item must be rejected: the customer shows dissatisfied feedback, earnings cannot increase, the incorrect or duplicate item cannot count toward order completion, and an item that was not successfully delivered cannot be removed from the tray.
- Earnings are determined jointly by order size and remaining patience. Completing an order must at least increase today’s income; a reward with higher remaining patience must not be lower than the reward for completion with lower patience.
- The business day begins in the evening and ends at night. After closing time, no new customers are generated, but customers already present should still be handled; when the business is closed and no customers remain, proceed to the end-of-day summary.

### P1 State and Flow

- The state flow is: main menu or direct business day -> business in progress -> end-of-day summary -> shop -> next-day menu/business day.
- The end-of-day summary must display the number of customers served that day, today’s income, and accumulated income or accumulated funds, and provide a continue entry point to the shop.
- The shop must display current funds, an upgrade/unlock list, costs, and levels or owned status. When the list content exceeds one screen, later items must be accessible by dragging, scrolling, or pagination. After a successful purchase, funds decrease and the display updates immediately; purchases must be rejected with feedback when funds are insufficient or an item is at maximum level or already owned.
- When starting the next day from the shop, the day increases, temporary business state is cleared, and long-term funds, upgrades, unlocked menu items, and statistics are retained.

### P2 Progression, Depth, and Feedback

- The initial menu includes at least one fried food, one grilled food, and two drinks. The shop can unlock an additional fried food, an additional grilled food, and an additional drink; locked items should appear locked or unavailable in the preparation area, and attempts to prepare a locked item must be rejected without occupying a station.
- Upgrades include: fryer station speed, grill station speed, drinks station speed, customer patience increase, and tray capacity increase. Speed upgrades should shorten the preparation wait for the corresponding category; patience upgrades should extend how long customers wait; tray upgrades should increase the number of items that can be carried.
- As the day count increases, customer arrival intervals shorten and orders more often contain 2 to 3 items, creating greater service pressure.
- New players should receive a lightweight prompt on the first day pointing to the preparation button needed for the first order; the prompt disappears after the player first clicks any preparation button.
- Completing an order, incorrect delivery, a busy station, a locked item, a full tray, a successful purchase, and insufficient funds should all have visible feedback, which may use floating text, animation, vibration, sound effects, or equivalent presentation.
- A leaderboard or historical results panel may be included, but it must not block offline single-player gameplay; when network or storage is unavailable, the core business day and shop must remain playable. Long-term progress should be saved when available and restored after reopening; when saving is unavailable, it should degrade gracefully to playability for the current session.

## State Requirements

- `menu`: The current day and total funds can be viewed, and the current day’s business can be started; even if the first day enters business directly, there must still be a stable reset entry point.
- `playing`: The HUD, customers, orders, patience, preparation stations, ingredient buttons, and tray are all interactive. Apart from the menu/end-of-day summary/shop, there should be no blocking layer covering the main play area.
- `dayComplete`: Stops updating the service loop for the day, displays the results, and allows entry into the shop.
- `shop`: Displays funds, upgrades/unlocks, scrolling or pagination, purchase feedback, and an entry point for starting the next day.
- `paused` is optional P2; if pause is provided, the timer, preparation, and customer patience should stop while paused and continue after resuming.
- Persistent progress should save the current day, funds, unlocked menu items, upgrade levels, and accumulated statistics; reset clears only the temporary state of the current business day.

## Scope Exclusions

- Fixed branding, specific art assets, exact copy, audio tracks, online leaderboards, and edit modes are not required matching items.
- Leaderboards, audio, and pause are P2; their absence does not affect the P1 core loop, but if provided, they must not disrupt the main flow.

## Completion Criteria

- Through actual clicks/touches, the player can complete one closed loop of “start the business day -> prepare an order item -> collect it onto the tray -> drag it to a customer -> receive earnings/order progress.”
- The player can see changes in customer patience, station preparation progress, tray capacity, correct/incorrect delivery feedback, the end-of-day summary, and shop fund changes.
- Shop purchases, insufficient funds, locked menu items, busy stations, and a full tray must all have explicit rejection results and state invariants.
- Multi-day management is sustainable: the next day resets temporary orders/stations/tray while retaining long-term progress and increasing or maintaining management pressure; purchased capacity, patience, or speed upgrades should produce observable effects on subsequent business days.

---

## GDD / Design Doc (merged from design-doc.md)

# Diner Dasher Design Doc

## MDA Overview

**Mechanics**: During a business day, the player handles customer orders, clicks or taps food/drinks to begin preparation, waits for station progress to complete, collects items onto the tray, and then uses mouse or touch to drag the items to customers. Customers have a patience countdown, and orders may contain multiple items. At the end of each day, funds enter a long-term account, and the shop provides speed, patience, tray capacity, and menu unlocks.

**Dynamics**: Customer patience, station occupancy, tray capacity, and business-time pressure all exist simultaneously. The player needs to decide which type of item to prepare first, when to collect it, which customer to serve, and whether to invest funds in short-term efficiency or long-term menu expansion. On later days, orders become more complex and customers arrive faster, while upgrades provide a buffer.

**Aesthetics**: The experience should be busy, clear, and readable counter service. Every correct delivery should provide immediate reward feedback; incorrect actions and busy, locked, and capacity limitations should be apparent without interrupting the rhythm. The end-of-day summary and shop provide a sense of management growth: “earned money today, stronger tomorrow.”

## M-Features

### M1: Launch, Main Menu, and Business Entry Point
Priority: P0  
The player can reliably enter the game, see the current day/funds, and interact with the main play area after starting the business day; direct entry into business is allowed on the first day.

### M2: Readable Main Play Scene and HUD
Priority: P0  
During business, time, day, today’s income, customer orders, patience, stations, menu buttons, and the tray must be displayed, and the main scene must be non-empty and readable.

### M3: Customer Generation, Orders, and Patience
Priority: P1  
Customers appear with orders, orders come from the unlocked menu, and patience decreases over time with a visible state; when it is depleted, the customer leaves without earnings.

### M4: Preparation Stations and Progress
Priority: P1  
Clicking a menu item starts preparation at the corresponding station, and a new item is rejected when the same station is busy; once complete, the station indicates that the item is ready to collect.

### M5: Tray Collection and Capacity Limit
Priority: P1  
Completed items can be collected from stations onto the tray, which has a capacity limit; collection is rejected when full without losing the item.

### M6: Drag-to-Serve and Screen-Direction Semantics
Priority: P1  
The player drags items from the tray to customers. The item’s visual position follows the actual mouse or touch path, with left/right movement matching screen-space direction; delivery is triggered only by release in a customer area.

### M7: Correct Delivery, Earnings, and Customer Departure
Priority: P1  
A correct, non-duplicate item advances the order. When the order is completed, the customer leaves satisfied, and the number of customers served and today’s income increase.

### M8: Rejection of Incorrect Delivery, Duplicate Delivery, and Invalid Release
Priority: P1  
An incorrect item, duplicate item, or item dragged to a non-customer area cannot complete an order or increase earnings; dissatisfied/error feedback should appear, related resources remain consistent, and an item that was not successfully delivered cannot be consumed.

### M9: Business Hours, Closing, and End-of-Day Summary
Priority: P1  
Business time advances, and new customers stop arriving at closing time; after customers already present leave or are served, proceed to the end-of-day summary, display the day’s statistics, and merge the income into long-term funds.

### M10: Shop Purchases, Upgrades, and Unlocks
Priority: P1  
Enter the shop after the end-of-day summary. When funds are sufficient, upgrades or unlocks can be purchased and the funds/level/owned status updates immediately; purchases are rejected when funds are insufficient or the item is at maximum level. When the shop has many items, the player must be able to access off-screen items by scrolling, dragging, or pagination.

### M11: Multi-Day Progression and Difficulty Changes
Priority: P2  
Starting the next day increases the day count, clears temporary business state, and retains long-term progress; on later days, customers arrive faster and orders are more complex. Purchased capacity, patience, or speed upgrades produce visible effects during subsequent business days.

### M11b: Locked Menu and Persistent Progress
Priority: P2  
Locked menu items are visible but cannot be prepared, and attempts to prepare them are rejected without occupying a station. Long-term progress is saved and restored when available; unavailable external leaderboards or storage do not block the core offline flow.

### M12: New-Player Prompt
Priority: P2  
A lightweight prompt pointing to the first required item may appear on the first day; the prompt disappears after the player’s first preparation input.

### M13: Feedback, Audio, and Leaderboard/Historical Results
Priority: P2  
Success, errors, busy states, locked states, a full tray, purchase results, and so on all have visible feedback. Audio and a leaderboard/historical results can enhance the experience but cannot block core gameplay.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Launch and entry point | P0 | Open the page or click to start the business day | Enters the business day, the main play area is interactive, and there is no blocking layer | Runtime errors, a blank scene, or a menu that still blocks the game after starting should fail |
| M2 Main scene and HUD | P0 | Enter the business day | HUD values, customer area, stations, buttons, and tray are visible; the main scene is non-empty and readable | Displaying only a static cover or omitting key areas cannot pass |
| M3 Customers/orders/patience | P1 | Wait or load valid business prerequisites | Customer count, order items, and patience reading/bar change | Patience not decreasing, orders not visible, or earnings still being awarded on depletion should fail |
| M4 Preparation stations | P1 | Click an available menu item | The corresponding station begins preparation, progress increases, and the item can be collected when complete | Clicking a busy station again should not replace the original item or generate a free finished item |
| M5 Tray capacity | P1 | Collect a completed item | The tray count increases; collection is rejected when full | After the tray is full, the count must not exceed capacity and the finished station item must not disappear without cause |
| M6 Drag direction and serving | P1 | Use an actual mouse or touch to drag from the tray to a customer | The dragged item’s screen position follows the pointer, and release in the customer area triggers delivery | Reversed left/right direction or completing an order after release outside a customer should fail |
| M7 Correct-delivery earnings | P1 | Prepare the correct item and drag it to the target customer | Completed order count, customers served, and today’s income increase; the customer is satisfied or leaves; the HUD/scene stays in sync | Unchanged income or customer, or an on-screen result out of sync should fail |
| M8 Incorrect/duplicate rejection | P1 | Drag an incorrect item, a duplicate item, or make an invalid release | Error feedback appears; earnings and completion do not increase; the unsuccessfully delivered item is retained | An incorrect path awarding points, consuming the item, or completing the order should fail |
| M9 End-of-day summary | P1 | Business ends with no customers | Enters the end-of-day summary, displays customers served and income for the day, and updates long-term funds | Generating customers after closing, failing to display the summary, or violating fund conservation should fail |
| M10 Shop | P1 | Click a shop purchase item, drag the list, or start the next day | A successful purchase deducts money and applies an improvement; insufficient funds/maximum level is rejected; a long list is accessible; the next day resets temporary state | Negative funds, free upgrades, upgrades not affecting later days, or inaccessible off-screen items should fail |
| M11 Multi-day difficulty | P2 | Start the next day from the shop and run multiple business days | The day increases, long-term progress is retained, order complexity/customer arrival pressure increases, and upgrade effects are visible | Losing upgrades on the next day or failing to clear temporary state should fail |
| M11b Locked and persistent progress | P2 | Attempt a locked item, reopen, or read results | The locked item is rejected and the station is unchanged; an available save is restored; external failure does not block business | Free preparation of a locked item, a save breaking the flow, or external failure blocking the flow should fail |
| M12 New-player prompt | P2 | Start the first day, then click to prepare for the first time | The prompt appears first and disappears after the first preparation | A prompt that blocks actions or never disappears should fail |
| M13 Feedback/results | P2 | Success, error, purchase, or leaderboard read failure | Visible feedback or a non-blocking state; the core flow continues | Missing feedback may be degraded, but an external service failure blocking business should fail |

## Game Flow

1. Enter the menu or the first business day.
2. A customer appears and displays an order.
3. The player selects the corresponding menu item, and the station begins preparation.
4. After preparation is complete, the player collects the item onto the tray.
5. The player drags the tray item to the customer area.
6. Correct delivery advances the order; completing the order awards today’s income.
7. After business ends, proceed to the end-of-day summary, then enter the shop.
8. The player browses the shop, purchases upgrades/unlocks, or directly starts the next day.

## Key Invariants

- Today’s income, long-term funds, tray item count, upgrade levels, and unlocked menu items must not have negative values.
- A busy station cannot be overwritten by a new item.
- The tray item count must not exceed capacity.
- Incorrect delivery, duplicate delivery, and invalid release cannot increase earnings or order completion, nor can they remove an item that was not successfully delivered.
- At the end-of-day summary, the increase in long-term funds should equal today’s income; entering the next day resets only temporary business state and does not clear long-term progress.
- A locked menu item cannot occupy a station or generate a finished item.
