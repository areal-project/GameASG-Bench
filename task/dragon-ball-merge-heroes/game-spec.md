# Dragon Ball Merge Heroes Game Spec

## Requirements Overview

This game is a portrait-oriented merge idle card game. Players spend currency to recruit basic heroes and place them in a 4x4 training grid, improving the team's tier by using real drag interactions to move, swap, delete, or merge heroes. Heroes on the board continuously generate currency according to their own tiers; that currency is then used to recruit new heroes and purchase backgrounds. The ultimate goal is to expand the collection, increase income per second, and unlock more visible content.

## Core Experience Principles

The game must retain the core player-visible behaviors: loading into the main screen, a 4x4 training grid, a recruit button, a currency and income-per-second HUD, drag-to-move/swap/merge/delete interactions, rejection feedback for a full grid and insufficient balance, hero collection progress, a background shop, long-term saves, and reset. The art and copy may differ, but players must be able to complete the same input sequences and observe results with the same semantics.

## Gameplay Requirements

### P0 Basic Interface and Startup

- After startup, the game displays a playable portrait-oriented main screen. The main scene includes the training grid, currency amount, income per second, recruit entry point, collection entry point, shop entry point, and delete zone.
- The main scene must have a readable 2D presentation; the grid, cards, and HUD must not be blank or overlap one another.
- After the loading or transition layer ends, it must not block players from clicking the training grid or main buttons.

### P1 Core Loop

- The training area is a 4x4 grid. Each cell can hold at most one hero card. Empty cells can receive moved or newly recruited heroes.
- Players recruit by clicking the recruit button or pressing the spacebar. Recruiting costs a fixed base amount of currency and can succeed only when the balance is sufficient and an empty cell is available.
- A newly recruited hero is generated randomly from the basic hero pool, placed in the first available empty cell, and displayed as a draggable card. After recruiting, currency decreases, and the recruit button and HUD update immediately.
- Each hero card has a tier, production capability, collection unlock state, and visible card face. The hero collection must include at least 24 unlockable forms: two standard 9-tier progression lines and two 3-tier fusion progression lines formed by fusing the basic factions. The production capabilities of all heroes on the board are summed to determine income per second, and the game continuously increases currency over time during play.
- When a player presses and drags a card, the card should follow the pointer or touchpoint, and the target cell should display feedback indicating whether placement or merging is possible.
- Releasing a card onto an empty cell moves the card and leaves the source cell empty; releasing it onto an occupied cell with which it cannot merge swaps the two cards; releasing it onto its own cell or outside the training area does not change the team.
- Two identical standard heroes can merge into a hero of the next tier. After merging, the source cell is cleared, a higher-tier hero appears in the target cell, collection progress updates, production capability increases, and merge feedback appears.
- Two specified heroes from different basic factions can merge into a random fusion-line hero. The fusion still follows the rules that the source cell is cleared, the target cell is upgraded, the collection is unlocked, and income is updated.
- Fusion-line heroes can continue to merge with identical fusion heroes into higher-tier fusion heroes until the maximum tier.
- Maximum-tier heroes cannot advance to another tier; two maximum-tier heroes of the same type and the same enhancement level can merge into a hero of the same type with a higher enhancement level, up to enhancement level 5. After enhancement, production capability is multiplied according to the enhancement level.
- Merging does not cost additional currency. A failed merge must not deduct currency, delete cards, or change collection progress.

### P1 Deletion and Resource Recovery

- Players can drag a hero card from the board to the delete zone and release it. After a successful deletion, the card disappears from the training grid and returns currency matching its tier and enhancement level.
- Deleting a higher-tier or enhanced hero should return more currency than deleting a basic hero, reflecting that it was merged from multiple basic heroes.
- Deletion must have visible delete/recovery feedback, and the currency HUD and income per second must update in sync.

### P1 Rejections and Invariants

- Recruiting must not be possible when the balance is insufficient; currency, the grid, and collection remain unchanged, and the recruit entry point appears unavailable or displays failure feedback.
- Recruiting must not be possible when the training grid is full; the existing total number of cards remains unchanged, and full-grid feedback is given.
- When a non-mergeable combination is dragged onto an occupied cell, the cards may only be swapped; no new hero may be generated, no hero may be lost, and the collection may not increase.
- Cancelling a drag, releasing in an invalid area, or repeatedly clicking recruit in rapid succession must not produce negative currency, duplicate cards, or more than 16 cards on the board.

### P2 Collection and Progress

- When the collection entry point is opened, it displays overall hero collection and background collection progress. Unlocked and not-yet-unlocked content must have clearly distinct states.
- When the player obtains a type of hero for the first time or purchases a background, the collection count and progress bar should increase.
- The collection panel can be closed; while the collection is open, accidental operations on the training grid should not be possible, and after it is closed, training-grid interaction resumes.

### P2 Shop and Backgrounds

- The shop entry point opens a background purchase/selection panel. Players can view at least 7 background options, their prices, owned states, and currently selected state.
- Owned backgrounds can be clicked to select them and immediately change the main-scene background.
- An unowned background can be purchased only when there is enough currency; a successful purchase deducts currency, adds it to the owned list, and selects it. When the balance is insufficient, the purchase is rejected, and the currency and owned list remain unchanged.
- The shop panel can be closed; while the panel is open, training-grid operations should be blocked, and they resume after it is closed.

### P2 Saves, Reset, and Settings

- Gameplay progress must be saved: currency, recruit count, training-grid contents, collection unlocks, purchased backgrounds, and the current background can be restored after a refresh or re-entry.
- The game may provide a debug or edit mode, but normal gameplay must not depend on debug buttons.
- If reset is provided, it requires a second confirmation. After confirmation, the training grid is cleared, currency returns to its initial value, the collection returns to its initially available state, and the current run's progress is cleared from the save.

## State Requirements

- `loading`: Resource loading and preparation phase; displays loading feedback and does not allow training-grid operations.
- `playing`: Main gameplay phase; training grid, recruiting, dragging, deletion, collection, shop, and income timing are available.
- `collection`: Collection panel is open; the main training area is covered by the panel, and closing it returns to `playing`.
- `shop`: Shop panel is open; the main training area is covered by the panel, purchasing or selecting a background keeps the game in the shop, and closing it returns to `playing`.
- `resetConfirm`: Optional reset confirmation phase; the first reset operation only displays the confirmation requirement, and only the second confirmation clears progress.

## Completion Criteria

- Starting from an empty board, the player can recruit at least two heroes by clicking or using the keyboard, complete movement, merging, and deletion by dragging, and see currency, income, and collection progress change according to the rules.
- The core economy loop is complete: heroes on the board increase income per second, and the income can continue to purchase recruits and backgrounds.
- All illegal paths have explicit rejection or no-change outcomes; currency never becomes negative, grid capacity is never exceeded, cards do not appear or disappear without cause, and the main scene cannot be accidentally activated while covered by a panel.
- The visuals and HUD must communicate gameplay state; internal numeric changes alone are insufficient.

---

## GDD / Design Doc (merged from design-doc.md)

# Dragon Ball Merge Heroes Design Doc

## MDA Overview

**Mechanics**: Fixed training grid, recruitment cost, drag-to-move/swap/merge, delete for return, idle currency generation, collection unlocks, background shop, saves, and reset.

**Dynamics**: Players manage card density and merge order within a limited grid. Recruiting introduces random basic units, merging compresses the grid and increases income, and deleting converts low-value or space-blocking resources back into currency. Long-term income drives further recruiting and background purchases.

**Aesthetics**: Light collection, the feeling of continuous growth, the immediate satisfaction of card upgrades, and clear feedback for one-handed operation on a portrait-oriented mobile screen.

## Core Experience

Every time players enter, they should immediately see the training grid and resource HUD. The shortest loop is: recruit a basic hero, wait for income to grow, then recruit again or drag heroes to merge them into a higher tier. The longer loop is: unlock the collection through merging, sell surplus heroes to recover resources, purchase and switch backgrounds, and save long-term progress.

## Core Loop Coverage

### M1 Startup and Main-Scene Readability
### M2 Recruit Basic Heroes
### M3 Drag Movement and Swapping
### M4 Standard Merge Upgrades
### M5 Fusion and Enhancement Merging
P2: The hero collection must cover at least 24 forms, including two standard 9-tier progression lines and two 3-tier fusion progression lines; fusion and maximum-tier enhancement cannot be simplified into a small number of generic cards.

### M6 Idle Currency Generation
### M7 Delete for Recovery
### M8 Collection Panel
### M9 Background Shop
### M10 Saves and Reset

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Startup and main-scene readability | P0 | Page finishes loading | Visible training grid, HUD, main buttons, and non-empty 2D main scene | The loading layer must not block permanently; the scene must not be blank |
| M2 Recruit basic heroes | P1 | Click the recruit button or press the spacebar | Currency decreases, a new hero appears in an empty cell, the board count increases, and button state updates in sync | Insufficient balance or a full grid does not change currency/the grid |
| M3 Drag movement and swapping | P1 | Drag from a cell with a card to an empty cell or an occupied cell with a non-mergeable card | Moving clears the source cell and occupies the target cell; swapping exchanges the two cards | The card count is conserved; cards cannot be duplicated or lost |
| M4 Standard merge upgrades | P1 | Drag a mergeable card onto a matching card and release | The source cell is cleared, the target advances a tier, income increases, collection progress increases, and feedback appears | Non-mergeable combinations cannot generate new cards or deduct resources |
| M5 Fusion and enhancement merging | P2 | Drag a special basic combination or matching maximum-tier cards with the same enhancement | A fusion-line or enhanced hero is generated, and the target card's income increases | Further tier advancement or enhancement is rejected after reaching the limit |
| M6 Idle currency generation | P1 | Heroes are on the board and time passes | Currency grows according to income per second, and the HUD updates in sync | Income is 0 when there are no heroes; income cannot be negative |
| M7 Delete for recovery | P1 | Drag a hero to the delete zone and release | The hero is removed, currency increases, income decreases, and recovery feedback appears | A hero is not deleted without dragging or when released in an invalid area |
| M8 Collection panel | P2 | Click the collection entry point, then close it | The panel displays hero/background unlock progress, and closing it restores training-grid interaction | The training grid should not be accidentally activated while the panel is open |
| M9 Background shop | P2 | Click the shop entry point, then purchase/select/close | A background list is visible; purchasing deducts currency and grants ownership, while selecting changes the background state | A purchase with insufficient balance is rejected and resources remain unchanged |
| M10 Saves and reset | P2 | Auto-save/re-enter/confirm reset | Progress can be restored; confirming reset returns to the initial state | A single accidental reset click cannot clear progress |

## Interaction Model

- Mouse and touch have equal priority as primary inputs: click buttons, press and hold cards, drag them to target positions, and release.
- The keyboard spacebar is an equivalent shortcut input for recruiting.
- Dragging uses screen-space semantics: the card must follow the pointer or touchpoint, and the cell or delete zone containing the release point determines the resulting outcome.
- Panel UIs are blocking layers: while the collection or shop is open, the training grid does not accept drags; interaction resumes after closing.

## Feedback Model

- HUD: Currency, income per second, collection progress, and recruit availability must change with state.
- Training grid: Empty cells, occupied cells, drag hover, mergeable targets, and movable targets should all have visible differences.
- Cards: They must communicate tier and production capability; higher-tier, fusion, or enhanced cards should have stronger feedback.
- Event feedback: Recruiting, merging, deletion, insufficient balance, a full grid, and purchase success or failure all require visible or audible feedback, with visible feedback mandatory.

## State And Progression

- Initial state: Fixed initial currency, an empty training grid, the default background owned, and collection progress that includes the default background but no heroes or only heroes actually obtained.
- Growth state: Obtaining each new hero type or background increases collection progress; each merge raises the card's tier or enhancement level; income per second is determined by the total capability of heroes on the board.
- Collection depth: The hero collection totals at least 24 and the background collection totals at least 7; collection/shop summaries must communicate these totals and avoid implementing only a small number of example items.
- The endgame is not a mandatory victory, but an open-ended collection goal: unlock as many hero forms as possible, enhance maximum-tier heroes, and purchase backgrounds.

## Cut Scope

- P2 may be cut: Debug/edit mode, additional performance adjustment options, and audio details do not need to be core completion requirements.
- Cannot be cut: 4x4 merge grid, recruiting, drag merging, delete for recovery, idle currency generation, collection/shop panels, and save semantics.
