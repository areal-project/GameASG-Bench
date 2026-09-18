# Fast Food Tycoon Game Spec

## Requirements Overview

This game is a 3D fast-food restaurant tycoon. The player starts with a controllable employee and a small amount of startup capital, runs around inside the restaurant, approaches kitchen equipment to prepare food, collects the food and delivers it to service points, generates cash when customers make purchases, and then invests the cash in facilities, employees, and permanent progression. The core experience is the loop of “run errands personally -> earn money through service -> invest in automation -> unlock a larger restaurant.”

## Gameplay Scope and Priorities

- P0: The game must start reliably and display a non-empty 3D main scene, the player character, the restaurant floor/facilities, and the HUD; after the loading layer ends, the main scene must be interactive.
- P1: Player movement, preparing/picking up food, restocking service points, customer queuing/consumption, cash collection, funds HUD synchronization, and basic unlocking/hiring must form a closed loop.
- P2: Drive-thru, self-service points, table cleaning, employee AI, vault upgrades, offline earnings, rush periods, sound effects/music, and long-term prestige are depth systems and should be retained as much as possible; if the deliverable is trimmed, the basic entry points and visible placeholders must be retained as a P2 trimming note and must not affect the P1 closed loop.

## 3D Scene and View

- The game uses a 3D restaurant scene as the primary gameplay space. Restaurant sections, kitchen equipment, service counters, customer queues, cash piles, unlock plots, and employee-hiring plots must be visible to the player.
- The primary view is an angled top-down view that follows the player, with the player character always kept within a readable range; provide player controls for zooming and rotating the camera left and right. After rotation, directional input must remain understandable relative to the current screen/camera: when pressing right or dragging the joystick to the right, the player’s on-screen movement should trend toward the right side, and pressing left should produce the opposite trend.
- The main screen cannot be blank, a plain background, or only a HUD; restaurant entities, the player, facilities, or dynamic objects must be visible. After the player moves, prepares food, deposits items, collects cash, or upgrades, at least one visible aspect of the scene or HUD must change accordingly.

## Input Semantics

- Desktop supports keyboard directional input: W/Up produces a movement trend toward the top of the screen, S/Down produces a movement trend toward the bottom of the screen, A/Left produces a movement trend toward the left side of the screen, and D/Right produces a movement trend toward the right side of the screen; the arrow keys are equivalent. After the camera rotates, the screen-direction semantics must remain consistent.
- Touchscreen devices support a virtual joystick. When the player drags from the joystick center in a direction, the character should move in the same on-screen direction; after release, the character stops and the joystick returns to center.
- Mouse or touch buttons are used to open/close panels such as upgrades, vault, and statistics, and to click purchase/switch tab/close controls within panels. When a panel is open, it may cover the corresponding UI, but after it is closed it must no longer block the main gameplay area.

## Core Business Loop

1. The player moves near kitchen equipment. If the equipment is ready and the player has not reached carrying capacity, remaining there for a short period starts preparation progress.
2. After preparation is completed, the equipment briefly cools down and generates several food items scattered near the equipment; the food appears as visible objects or an equivalent representation.
3. When the player approaches food, the items are drawn in/picked up one by one onto the tray, and the tray count and capacity are synchronized in the HUD or another player-visible state.
4. The player moves to the deposit area of a service counter or another unlocked service point, and food is transferred one item at a time from the player’s tray to service inventory; the service point inventory display updates in sync with decreases/increases.
5. Customers queue while waiting for service. When a service point has inventory and the player or a hired employee satisfies the service conditions, the customer is served and leaves, producing a cash pile, banknotes, or an equivalent cash object.
6. The player approaches a cash pile to collect it, the funds enter the spendable balance, and the HUD immediately reflects the increase.
7. The player invests the balance in unlock plots, employee plots, or upgrade buttons. Once the cost is completed, new facilities, employees, or permanent attributes take effect, creating higher production capacity.

## Resources, Capacity, and Economy

- Funds are the primary currency and must be non-negative. Purchases, construction, hiring, upgrades, and long-term progression deduct funds; serving customers, collecting cash, and offline earnings add funds.
- Food carrying has a capacity limit. After reaching the limit, the player cannot continue picking up food, and the character may display full-load feedback; upgrades can increase capacity.
- Service points have inventory limits and cash-pile limits. When inventory is full, they should not continue accepting food; when a cash pile is full, customer-service or collection prompts should guide the player to handle the cash.
- Resource transactions must be conserved: one deposit only removes items from the player’s carried amount and transfers them to the target inventory, and one purchase only deducts funds and increases the level/unlocked state when funds are sufficient. Invalid operations or operations with an insufficient balance cannot produce free upgrades, negative funds, or duplicate unlocks.

## Unlocks, Employees, and Automation

- Unlock plots are completed by having the player stand in the corresponding area and continuously invest funds, and the plot should display the remaining cost or progress. After completion, the plot disappears or transforms into a new facility.
- Basic unlocks include dining tables, more kitchen equipment, service counters, trash/cleaning-related facilities, employee plots, drive-thru, and other late-stage business facilities. The unlock sequence may be simplified, but there must be a chain of “funds invested -> visible progress -> new function appears.”
- Employees are obtained through hiring plots. At minimum, there should be visible state representations for cashier/service employees and runner employees: cashier employees help serve customers, and runner employees automatically collect food from equipment/the floor and restock. Cleaning employees and vault-collection employees are P2.
- Employee AI must be able to move within the scene or clearly express an active working state; it cannot merely be a static icon accompanied by numerical changes.

## Customers, Dining Tables, Drive-Thru, and Additional Services

- Customers spawn over time and enter a queue to wait for service. The number of customers, waiting state, or queue length needs to be observable.
- The dining-table system is P2: customers can use dining tables and leave behind trash that needs cleaning after they depart; once the player or a cleaning employee cleans it, the table becomes available again.
- Drive-thru is P2: vehicles enter in a queue, the player restocks the window, and vehicles produce cash piles after being served.
- Self-service points are P2: customers queue at self-service points to place orders and then enter the service chain; this may be simplified into an additional customer source, but it must be visible and affected by inventory/service capacity.

## Upgrades, Vault, Offline Earnings, and Long-Term Progression

- Regular upgrades affect capacity, movement speed, or preparation speed; the vault panel provides permanent upgrades, such as offline earnings, capacity, customer tips/rare-customer probability, movement speed, preparation speed, service speed, and cash-pile capacity.
- The vault/upgrade panel must be openable, allow information switching, purchase available items, reject items when the balance is insufficient, and be closable to return to a playable state.
- Rush periods are P2: periodically increase customer or vehicle spawn speed and increase the earnings multiplier, with the HUD displaying the remaining time.
- Offline earnings are P2: upon re-entry, calculate one-time earnings based on the operating scale when the player left, and provide visible collection feedback.
- Long-term prestige is P2: after reaching a large amount of funds, most restaurant progress can be reset, the long-term profit multiplier increases, and a new restaurant layout is generated or selected.

## State and UI

- States include loading, playing, panel, paused/result-like overlay (if a pause/result layer is implemented), and prestige/reset transition. There may be a loading layer before entering playing by default, but once loading ends, no overlay that blocks the main scene may remain.
- The HUD displays at least the funds; it should additionally display applicable items among tray/inventory, customer queue, cash pile, vault balance, rush period, or tutorial prompts.
- Gameplay may pause or partially pause while a panel is open, but it should clearly show that a panel is covering the view; after closing, the main scene becomes interactive again and real movement input resumes.
- Support resetting the current business run or starting over. A reset should clear temporary food, the customer queue, flying objects, and temporary cash piles, while preserving or handling permanent progression according to the rules.

## Save Data

- The game should periodically save funds, upgrades, employee hires, facility unlocks, dining tables, vault, long-term progression, and timestamps related to offline earnings. After reloading, the player can see unlocked facilities, employees, and the restored balance.
- The user can explicitly restart the current business run or clear progress from within the game; an ordinary restart cannot destroy long-term progression unless the player explicitly chooses a full save wipe.

## Completion Criteria

- Using a keyboard or touchscreen, the player can start empty-handed, prepare and pick up food, supply a service point, have customers make purchases, collect cash, and complete at least one unlock or hire.
- Funds, inventory, capacity, queue, employees, upgrades, and panel states all have stable, observable representations.
- Real input, the public action contract, and the HUD/3D scene remain synchronized; invalid operations are rejected and do not produce negative funds, duplicate rewards, or resources from nothing.

---

## GDD / Design Doc (merged from design-doc.md)

# Fast Food Tycoon Design Doc

## MDA Overview

**Mechanics**: 3D character movement, proximity-triggered preparation/pickup/deposit/collection, customer queues, cash earnings, unlock plots, employee AI, upgrades/vault/long-term progression.

**Dynamics**: The player plans routes among the kitchen, counter, cash piles, and unlock plots, first maintaining service through manual errands and then investing in automation to reduce pressure; customers and cash piles make the player choose between production capacity and retrieving funds.

**Aesthetics**: Busy but relaxed, continuously expandable, with every investment immediately producing a change in the scene. The player should feel that the restaurant is becoming increasingly “alive,” rather than merely watching numbers grow.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 3D scene startup and loading dismissal | P0 | Open the game and wait for loading to complete | A non-empty 3D main scene, player, facilities/HUD are visible, and the main scene is interactive | Failure if there is only a blank screen, only a loading layer, or a blocking overlay |
| M2 Screen-direction movement and camera rotation | P1 | Keyboard WASD/arrow keys or opposite-direction virtual joystick input; input again after rotating the camera | The player’s screen position changes in the corresponding direction, and opposite directions produce opposite displacement trends; screen-direction semantics remain intact after rotation | Failure if left/right or up/down are reversed, movement still follows the old world axes after camera rotation, input has no effect, or the player crosses out of the restaurant bounds |
| M3 Preparing and picking up food | P1 | The player moves to ready kitchen equipment and remains there, then approaches the dropped food | Preparation progress, equipment cooldown, and food appear, and the amount on the player’s tray increases | No more food can be picked up when fully loaded; the total amount of food cannot disappear without cause |
| M4 Restocking service points and customer consumption | P1 | The player brings food to the counter/service point and remains there | The player’s tray decreases, service inventory increases, the customer queue advances, and cash is generated | Further deposits are rejected when inventory is full; service is impossible without food |
| M5 Cash collection and funds HUD | P1 | The player approaches a cash pile/collection area | The cash pile decreases, and the funds balance and HUD increase | The balance cannot be negative; the same cash cannot be collected repeatedly |
| M6 Unlock plots/hiring plots | P1 | The player has sufficient funds and stands on a plot to invest continuously | Funds decrease, plot progress increases, and a new facility/employee appears after completion | When the balance is insufficient, progress and funds remain unchanged; completed plots cannot deduct funds repeatedly |
| M7 Upgrade/vault panel | P1 | Click the panel button, switch tabs, click purchase, close | The panel shows balance/level/cost; a successful purchase deducts funds and upgrades, and the main scene is interactive after closing | Insufficient-balance buttons reject the action; the panel should not permanently cover the main gameplay |
| M8 Employee automation | P2 | Wait after completing a hire or loading prerequisite resources | Employees move/work in the scene, and service, transport, or cleaning advances the business state | Employees cannot only change hidden values; they should wait when there are no resources |
| M9 Dining tables, trash, and cleaning | P2 | Customers sit after dining tables are unlocked, and the player/employee cleans | A table returns from occupied/dirty to available, and customer flow continues | An uncleaned table cannot receive unlimited customers |
| M10 Drive-thru/self-service | P2 | Unlock and restock additional service points | Vehicles or additional customer queues appear and generate earnings after being served | Without restocking, the queue waits and must not settle for free |
| M11 Rush periods and rare customers | P2 | Wait for a periodic trigger or scene setup | The HUD displays a countdown, customers/vehicles increase, and the earnings multiplier rises | The multiplier returns to normal after the period ends |
| M12 Offline earnings and save data | P2 | Re-enter after saving or load an offline scenario | Unlocked content is restored, and offline earnings can be collected and added to the balance | Clear-save/reset semantics are explicit, and offline earnings cannot be collected repeatedly |
| M13 Long-term prestige | P2 | Execute a long-term reset in the vault after reaching a large amount of funds | Most business progress is cleared, the long-term level/multiplier increases, and a new layout or higher costs appear | Rejected when funds are insufficient; temporary objects must be cleared after prestige |

## Gameplay Flow

1. Loading: Display loading feedback and initialize the 3D scene, player, initial equipment, HUD, and interactive panels.
2. Start: The player uses directional keys/the joystick to move to kitchen equipment, remains there to prepare food, and picks up the food.
3. Service: The player delivers food to the counter, the customer queue is processed, and cash is generated.
4. Collection: The player collects cash, the balance grows, and the HUD stays synchronized with cash piles in the scene.
5. Investment: The player unlocks plots, hires employees, or purchases upgrades, strengthening the restaurant’s capabilities.
6. Depth: Employees automatically run errands, while dining tables/drive-thru/self-service/vault/prestige extend the progression curve.

## UI/UX Requirements

- The HUD must be small and clear and must not obstruct core routes; panels cover the bottom or one side only when the player opens them.
- Panel buttons need a disabled state or rejection feedback, and the level, balance, and ability effects synchronize after a purchase.
- Tutorial prompts may exist, but cannot replace playable functions; prompts should point to the next objective or the reason for a blockage.
- 3D objects should have explicit states: ready, cooling down, accepting funds, completed, fully loaded, waiting for customers, and cash available for collection.

## Observable Behavior Notes

- Movement is a direction-sensitive mechanic and must be verified using screen-space semantics: after left/right or up/down input, the player’s visible position changes in opposite directions; screen-direction semantics must also be verified again after camera rotation and cannot be correct only under the default view.
- Business operations are triggered by proximity to areas and must have visible progress or resulting objects; they cannot only change numbers instantly.
- The economy must allow resource transfers to be tracked from player actions: food, inventory, cash, and balance need observable differences before and after every action.
