# Pink Dream Wardrobe TDD

## Public Testable Contract

The target product must provide a player-operable UI, and providing the following public high-level interface is recommended. The interfaces are a product-level contract: they may only trigger or read states that players can understand; they cannot return internal object graphs, directly add score, directly complete the game, directly make a purchase succeed, or skip rule chains.

```javascript
window.__gameTest = {
  reset(options?: { fresh?: boolean }): Snapshot,
  getSnapshot(): Snapshot,
  input(action: Action): Snapshot,
  loadScenario(name: string): Snapshot
}
```

The real UI path must be fully playable; the public high-level interface is used to keep the same player-level actions and state summaries consistent across different products.

## Snapshot Schema

```typescript
type Snapshot = {
  phase: "loading" | "menu" | "wardrobe" | "minigame" | "result";
  activePanel: "none" | "start" | "loading" | "unlock" | "result" | "tutorial";
  overlayBlocking: boolean;
  canInteractWithWardrobe: boolean;
  coins: number;
  currentCategory: "hair" | "outfit" | "bag" | "shoes";
  categories: string[];
  itemCounts: Record<string, number>;
  unlockedCounts: Record<string, number>;
  equipped: { hair: string | null, outfit: string | null, bag: string | null, shoes: string | null };
  selectedItem?: { category: string, unlocked: boolean, cost: number, equipped: boolean } | null;
  modal?: { visible: boolean, cost?: number, canBuy?: boolean };
  previewRevision: number;
  minigame?: {
    type: "colorMatch" | "fashionRush" | "memoryMatch" | "quickStyle" | null;
    running: boolean;
    localCoins: number;
    timeLeft?: number;
    resultEarned?: number;
    resultAlreadyApplied?: boolean;
  };
  fashionRush?: {
    basketScreenX: number;
    basketBounds: { left: number, right: number, top: number, bottom: number };
    playfieldBounds: { left: number, right: number, top: number, bottom: number };
    fallingCounts: { target: number, hazard: number };
  };
  colorMatch?: {
    targetKey: string;
    options: Array<{ key: string, screenX: number, screenY: number, isTarget: boolean }>;
  };
  memoryMatch?: {
    cards: Array<{ index: number, matched: boolean, flipped: boolean, pairKey?: string, screenX: number, screenY: number }>;
    moves: number;
    matchesFound: number;
  };
  quickStyle?: {
    targetKey: string;
    choices: Array<{ key: string, screenX: number, screenY: number, isTarget: boolean }>;
  };
  hudRevision: number;
  storageAvailable?: boolean;
}
```

Field semantics:

- `phase` represents the current main state; it is `result` while the minigame result layer is displayed.
- `overlayBlocking` being `true` indicates that a menu, modal, minigame, or result layer is blocking wardrobe actions.
- `canInteractWithWardrobe` being `true` indicates that real clicks on wardrobe categories and items should take effect.
- `previewRevision` increases when equipping, unequipping, or automatic equipping after a purchase changes the main preview; an equivalent change in the visual summary may be used instead.
- `hudRevision` increases when coins, in-round coins, the countdown, move count, or result HUD changes.
- `basketScreenX` must be the center x-coordinate of the basket seen by the player on the screen; it is used to verify that left and right directions are not reversed.

## Action Schema

```typescript
type Action =
  | { type: "start"; mode?: "fresh" | "load" }
  | { type: "selectCategory"; category: "hair" | "outfit" | "bag" | "shoes" }
  | { type: "selectItem"; category?: string; itemIndex: number }
  | { type: "confirmPurchase" }
  | { type: "cancelPurchase" }
  | { type: "startMiniGame"; game: "colorMatch" | "fashionRush" | "memoryMatch" | "quickStyle" }
  | { type: "backToWardrobe" }
  | { type: "continueResult" }
  | { type: "chooseColor"; key?: string; optionIndex?: number }
  | { type: "moveBasket"; direction: "left" | "right"; amount?: number }
  | { type: "dragBasket"; fromX: number; toX: number }
  | { type: "wait"; ms: number }
  | { type: "flipCard"; index: number }
  | { type: "chooseStyle"; key?: string; optionIndex?: number };
```

Invalid input rejection:

- An unknown `type` must return `{ ok:false }` or leave the Snapshot unchanged without throwing an exception.
- A `confirmPurchase` with insufficient coins must not change coins, the owned count, equipment, or the preview.
- An invalid index for `selectItem` must not change coins or equipment.
- Minigame actions outside the minigame phase must not reward coins.
- `continueResult` on the result layer may apply the same reward only once; if the implementation has already added the reward to total coins when the result layer appeared, `continueResult` may only close the results and must leave coins unchanged.
- `wait` may only advance time, animations, and collisions for the current running round; it must not directly grant rewards unrelated to the current scene.

## DOM/HUD/Canvas Postconditions

- After starting: the start/loading overlays no longer block the wardrobe; the coin HUD, category controls, item list, and main preview are visible.
- After switching categories: the current category list and active state change, while coins remain unchanged.
- After equipping or a successful purchase: the coin/equipment/ownership states stay synchronized with the HUD, and the main preview changes visibly or `previewRevision` increases.
- Purchase modal: it blocks the wardrobe while open; after cancellation, it closes and state remains unchanged; when coins are insufficient, the purchase control cannot complete the purchase.
- Color Match: a correct option increases in-round coins and refreshes the question; an incorrect option gives no reward and in-round coins remain non-negative.
- Fashion Catching: actual left/right keys or dragging must move the basket in the same direction in screen space; after an item is caught, in-round coins change according to whether it was a target or distractor.
- Fashion Catching: starting from a valid precondition where a falling item is about to enter the basket, waiting or moving the basket must remove the falling item or reduce its count; a correct target increases in-round coins, while an incorrect distractor produces no positive reward and in-round coins remain non-negative.
- Memory Cards: after actually clicking two cards, their face-up state and the move count are visible; after a match, they remain matched and give a reward.
- Timed Matching-Item Search: a correct candidate adds coins and refreshes the target; an incorrect candidate produces an error state and deducts time or continues to give no reward.
- Continue from results: the reward may already be reflected in total coins when the result layer appears, or it may be added when continuing; after continuing, the game must return to the wardrobe and remove the block, and total coins may increase by the round's earnings at most once.

## Valid loadScenario Scenarios

`loadScenario` may only construct valid precondition states:

- `wardrobe_affordable_locked`: The current category in the wardrobe contains an unowned item that the player has enough coins to purchase; the modal has not been opened and the item has not been purchased.
- `wardrobe_insufficient_funds`: The current category in the wardrobe contains an unowned item, but the player's coins are lower than its price; the modal has not been opened and the item has not been purchased.
- `wardrobe_owned_non_hair_equipped`: The current wardrobe category is a non-hair category and contains an owned and equipped item; the current unequip action has not yet been performed.
- `color_match_ready`: Color Match is in progress, with a target and candidates present; the answer for the current round has not yet been selected.
- `fashion_rush_ready`: The catching minigame is in progress, the basket is in the middle of the playable area, and it has not yet caught the item currently in focus in the scene.
- `fashion_rush_target_near_basket`: The catching minigame is in progress, and a correct target is about to fall into the basket; the collision reward has not yet occurred.
- `fashion_rush_hazard_near_basket`: The catching minigame is in progress, and an incorrect distractor is about to fall into the basket; the collision penalty has not yet occurred.
- `memory_match_one_pair_known`: The memory game is in progress, and at least one matchable pair of cards has not yet been flipped or matched.
- `quick_style_ready`: The matching-item search is in progress, with a target and candidates present; the answer for the current round has not yet been selected.
- `result_with_reward`: A minigame has ended validly and is displaying one result reward; `resultEarned` represents the earnings for this round, and `resultAlreadyApplied` may indicate whether those earnings were written to total coins when the result layer appeared. Regardless of timing, the reward has not been written more than once.

Forbidden scenarios: directly winning, directly adding total coins without a valid result, directly setting the item in focus as purchased, directly setting cards as matched, or directly marking the catching reward as having occurred.

## Behavior Trajectory Contract

| Trajectory | Coverage M | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Launch and enter the wardrobe | M1 | Page loading complete | Actually click start or `input({type:"start"})` | `phase=wardrobe`, the overlay does not block, and the HUD/preview/categories are visible | Wardrobe clicks can change the category after entry |
| Switch categories | M2 | Wardrobe | Actually click a different category or use `selectCategory` | The current category and list summary change | `coins` and `equipped` remain unchanged |
| Equip an owned item | M3 | The wardrobe contains an owned, unequipped item | Click the item card or use `selectItem` | The equipment field changes and the preview changes | Hair cannot become `null` |
| Unequip and protect hair | M3 | The wardrobe contains an equipped non-hair item and a current hairstyle | Click the equipped non-hair item again; click the current hairstyle | The non-hair item becomes an empty slot; the current hairstyle remains equipped | Coins and the owned count remain unchanged |
| Successful purchase | M4 | `wardrobe_affordable_locked` | Click the locked item and confirm the purchase | Coins decrease, the owned count increases, the item is automatically equipped, and the modal closes | The charge equals the price, and coins are non-negative |
| Purchase cancellation/insufficient funds | M4 | `wardrobe_insufficient_funds` or the modal is open | Cancel or confirm the purchase | The modal closes or the purchase is rejected | `totalBefore/totalAfter` resource conservation: coins, owned count, and equipment remain unchanged |
| Color Match | M6 | `color_match_ready` | Click a correct candidate, then an incorrect candidate | The correct answer adds in-round coins/refreshes; the incorrect answer gives no reward and remains non-negative | The incorrect answer does not increase total coins |
| Catching direction | M7 | `fashion_rush_ready` | Use the actual left key, actual right key, or actual dragging | `basketScreenX` decreases to the left and increases to the right, observable on the screen/HUD | The basket remains within playfield bounds |
| Catching reward | M7 | `fashion_rush_target_near_basket` | Wait or move the basket to catch the target | In-round coins increase and the falling-item count changes | In-round coins are non-negative |
| Catching distractor | M7 | `fashion_rush_hazard_near_basket` | Wait or move the basket to catch the distractor | In-round coins do not increase, and the falling-item count changes or penalty feedback is produced | A distractor cannot give a positive reward, and in-round coins are non-negative |
| Card match | M8 | `memory_match_one_pair_known` | Click a pair of cards | The move count, number of matches, and in-round coins increase | Repeated clicks on matched cards do not give repeated rewards |
| Matching-item search | M9 | `quick_style_ready` | Click a correct candidate, then an incorrect candidate | The correct answer adds in-round coins/refreshes; the incorrect answer deducts time or gives error feedback | The incorrect answer does not add coins, and time is non-negative |
| Continue from results | M10 | `result_with_reward` | Click continue | Return to the wardrobe; if the reward has not been credited, total coins increase once, and if it has been credited, total coins remain unchanged | Clicking continue again or repeating the action does not claim the reward again |
| Return from a minigame | M5 | Any minigame is running | Click return to wardrobe | The minigame layer closes, the game returns to the wardrobe, and unfinished rewards are not written to total coins | The overlay is removed, and the wardrobe is interactive again |

## Feature-Interface Mapping

| Feature | Preferred real path | Public contract path | Observable oracle |
|---|---|---|---|
| Launch | Click the start/load button | `input({type:"start"})` | `phase`, overlay, HUD, categories, preview |
| Category | Click a semantic category button | `selectCategory` | Current category, list summary, coins unchanged |
| Purchase | Click a card and the purchase button | `loadScenario` + `selectItem` + `confirmPurchase` | Coins/ownership/equipment/modal/preview |
| Minigame entry | Click a minigame button | `startMiniGame` | `phase=minigame`, `minigame.type`, overlay |
| Catching direction | Actual keyboard/mouse/touch input | `moveBasket`/`dragBasket` | `basketScreenX` and canvas/HUD changes |
| Catching collision | Wait or move the basket to catch a falling item | `loadScenario` + `wait`/`moveBasket` | In-round coins, falling-item count, non-negative reward |
| Results | Click continue | `continueResult` | The reward is credited at most once, then return to the wardrobe |
