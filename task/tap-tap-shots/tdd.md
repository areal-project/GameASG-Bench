# Tap-Tap Shots TDD Contract

## Scope

This file defines the public, portable test contract for Tap-Tap Shots. It only describes player-level actions, legal scenario setup, stable observable snapshots, and external postconditions derived from `game-spec.md` and `design-doc.md`.

The contract must not require a specific rendering engine, DOM tree, physics formula, file layout, private function, private state object, fixed canvas size, fixed screen coordinate, asset identifier, or exact UI copy.

## Public Test API

Implementations must expose:

```javascript
window.__gameTest = {
  reset(): Snapshot,
  getSnapshot(): Snapshot,
  input(action: Action): Snapshot,
  loadScenario(name: ScenarioName): Snapshot
}
```

### Method Semantics

- `reset()` returns the game to a fresh home state with persistent player data still present unless the implementation also provides an explicit test-only storage reset outside this contract.
- `getSnapshot()` returns a stable product-level summary of the current game. It must not expose internal object graphs or engine-specific structures.
- `input(action)` performs one player-level action or time passage and returns the post-action snapshot. It must never set score, coins, ownership, result, collision, boost, damage, basket success, or timer completion directly.
- `loadScenario(name)` may place the game into a legal precondition that could occur through normal play. It must not pre-apply the result being tested, such as a completed basket, awarded coins, purchased item, terminal result, accepted collision, or already-triggered rejection.

All methods should return a valid `Snapshot` even when an action is rejected. Invalid actions must be rejected without throwing and without mutating unrelated gameplay state.

## Action Schema

Every action has a `type` string. Optional fields are ignored unless listed here.

| Action | Required / Optional Fields | Player-Level Meaning | Expected Contract Shape |
|---|---|---|---|
| `tapPlayfield` | optional `point: "center"|"upper"|"lower"|"left"|"right"` | Click or touch the main court. The point is semantic only; it must not aim the shot. | In home, starts play. In playing, gives the ball an upward impulse and horizontal push toward the active hoop side. In blocked states, rejected or ignored without motion/score change. |
| `tapSequence` | `count: number`, optional `cadence: "slow"|"medium"|"fast"` | A short sequence of real court taps over time. | Produces cumulative tap-driven motion; may trigger score, collision, or miss only through normal ball movement. |
| `wait` | `duration: "short"|"medium"|"long"|"untilSettled"` | Let time and motion advance without player input. | Ball motion, timer, warnings, score transitions, or result may advance according to current phase. |
| `openPanel` | `panel: "shop"|"leaderboard"` | Use a visible non-play control to open a blocking panel. | Opens the named panel and blocks playfield input. |
| `closePanel` | `panel: "shop"|"leaderboard"` | Close a blocking panel. | Returns to the prior safe phase or home/result as appropriate. |
| `pause` | none | Use pause during a run. | Enters paused phase only from playing. |
| `resume` | none | Continue from pause. | Returns to the same run state. |
| `home` | none | Use a visible home/back control from pause or result. | Returns to home with persistent values retained. |
| `retry` | none | Use the result retry control. | Starts a new playing run with transient score/timer/heat reset. |
| `toggleSound` | none | Toggle the sound setting. | Changes sound state and persists it without starting a shot or mutating score, timer, coins, or ownership. |
| `shopCategory` | `category: "balls"|"backgrounds"` | Switch shop category. | Changes visible category only; gameplay and economy totals remain stable. |
| `selectShopItem` | `category: "balls"|"backgrounds"`, `selector: "equipped"|"ownedUnequipped"|"firstAffordableLocked"|"firstUnaffordableLocked"` | Select a semantic item card in the shop. | Equips owned items, purchases affordable locked items, rejects unaffordable items, or no-ops on already equipped items. |

`tapPlayfield.point` values are for testing tap-position independence. They are not coordinates and do not authorize aiming behavior.

## Scenario Schema

`loadScenario(name)` supports these legal preconditions:

| Scenario Name | Legal Precondition | Player Actions That Trigger Results | Prohibited Shortcut |
|---|---|---|---|
| `home_fresh` | Home screen with visible court, ball, first hoop, HUD affordances, and no blocking panel. | `tapPlayfield`, `openPanel`, `toggleSound`. | Must not start play, change score, or award coins during setup. |
| `playing_right_hoop` | A run has just begun or been reset with the active hoop on the right and score at the current run value. | `tapPlayfield`, `tapSequence`, `wait`, `pause`, `toggleSound`. | Must not pre-score a basket or place the ball already inside the hoop. |
| `playing_left_hoop_after_score` | A legal run state after at least one prior basket, with the next active hoop on the left and timer available for the next shot. | `tapPlayfield`, `tapSequence`, `wait`, `pause`. | Setup may include prior score as history, but must not pre-trigger the next basket or direction result. |
| `approach_hoop` | Ball is in a legal in-flight approach toward the active hoop, with a valid basket still requiring subsequent player timing or time passage. | `tapPlayfield`, `tapSequence`, `wait`. | Must not mark the basket as made, set score delta, or bypass top-down entry. |
| `collision_risk` | Ball is in legal motion where mistimed taps or waiting can cause floor, rim, or backboard contact. | `tapPlayfield`, `wait`. | Must not pre-register a collision event or force a collision outcome. |
| `timed_run_after_score` | A run after at least one valid basket, timer visible and counting for the current shot. | `wait`, `tapSequence`. | Must not set the timer to expired or directly enter result. |
| `paused_run` | A playing run has been paused through the pause action. | `tapPlayfield`, `resume`, `home`. | Must not alter ball motion or score during setup. |
| `result_with_score` | A completed run result reached through normal timer failure from a nonzero or zero score. This scenario is only for terminal lock, retry, home, and panel behavior. | `retry`, `home`, `openPanel`, `tapPlayfield`. | Must not grant extra coins or score after loading, and must not be used as the trigger for testing coin-award causality. |
| `shop_with_coins` | Shop is open with enough persistent coins for at least one locked item if such an item exists. | `shopCategory`, `selectShopItem`, `closePanel`, `tapPlayfield`. | Must not pre-purchase the selected locked item. |
| `shop_insufficient_coins` | Shop is open with at least one locked item that costs more than the current balance if such an item exists. | `selectShopItem`, `closePanel`, `tapPlayfield`. | Must not deduct coins, unlock, equip, or show purchase success during setup. |
| `leaderboard_open` | Leaderboard panel is open from a safe home or result state. | `closePanel`, `tapPlayfield`. | Must not mutate score, timer, coins, or current run state. |

If an implementation cannot offer a scenario because the related item state does not exist, `loadScenario` must return a snapshot with `lastAction.ok === false` and a stable rejection reason such as `unavailableScenario`, while leaving the game in a safe state.

## Snapshot Schema

`Snapshot` is a plain serializable object with the fields below. Numeric fields may be rounded summaries; tests should compare direction, ordering, deltas, and candidate values rather than exact constants.

```typescript
type Snapshot = {
  phase: "home"|"playing"|"paused"|"result"|"shop"|"leaderboard";
  priorPhase?: "home"|"playing"|"paused"|"result";
  overlayBlocking: boolean;
  canInteractWithPlayfield: boolean;

  score: number;
  bestScore: number;
  coins: number;
  coinsEarnedThisRun: number;
  result: "none"|"active"|"runEnded";

  timer: {
    visible: boolean;
    ratio: number;
    state: "hidden"|"normal"|"warning"|"danger"|"expired";
    revision: number;
  };

  ball: {
    visible: boolean;
    screenX: number;
    screenY: number;
    motionRevision: number;
    verticalTrend: "up"|"down"|"still";
    horizontalTrend: "left"|"right"|"still";
    onFloor: boolean;
  };

  hoop: {
    visible: boolean;
    side: "left"|"right";
    screenX: number;
    screenY: number;
    openingBounds: SemanticBounds;
    revision: number;
  };

  playfield: {
    visible: boolean;
    bounds: SemanticBounds;
    visualRevision: number;
  };

  feedback: {
    lastTapAccepted: boolean;
    lastScoreDelta: number;
    lastShotQuality: "none"|"clean"|"soft"|"rimmed"|"miss";
    heatLevel: number;
    lastCollision: "none"|"floor"|"rim"|"backboard";
    warningActive: boolean;
    visibleEffectRevision: number;
  };

  shop: {
    category: "none"|"balls"|"backgrounds";
    balance: number;
    equippedBall: string;
    equippedBackground: string;
    itemCounts: {
      ballsOwned: number;
      ballsLocked: number;
      backgroundsOwned: number;
      backgroundsLocked: number;
    };
    lastShopResult: "none"|"equipped"|"purchased"|"rejectedInsufficientFunds"|"alreadyEquipped"|"unavailable";
  };

  sound: {
    enabled: boolean;
  };

  leaderboard: {
    status: "closed"|"loading"|"entries"|"empty"|"unavailable"|"error";
  };

  persistence: {
    revision: number;
  };

  lastAction: {
    ok: boolean;
    type?: string;
    reason?: "notAllowedInPhase"|"blockedByOverlay"|"invalidAction"|"unavailableScenario"|"insufficientFunds"|"alreadyEquipped"|"noMatchingItem";
  };
};

type SemanticBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
};
```

### Field Requirements

- `phase` and `overlayBlocking` must agree: shop, leaderboard, pause, and result overlays that block playfield input must set `overlayBlocking: true` and `canInteractWithPlayfield: false`.
- `ball.screenX/screenY`, `hoop.screenX/screenY`, `hoop.openingBounds`, and `playfield.bounds` are semantic visible positions for portable interaction and observation. They must be viewport/screen coordinates that a browser pointer/touch event can use directly after current layout and scaling, derived from the rendered playfield, not fixed constants or unscaled canvas-internal coordinates.
- `motionRevision`, `visualRevision`, `timer.revision`, `hoop.revision`, `visibleEffectRevision`, and `persistence.revision` increment or otherwise change when the corresponding visible system changes.
- `horizontalTrend` reports the player-visible direction of ball motion on screen. It must not report an invisible world coordinate if the screen direction differs.
- `lastScoreDelta` is zero unless a basket has just been made through normal play.
- `heatLevel` is a non-negative gameplay summary. Exact values are flexible; it must increase or stay meaningfully elevated on clean/soft consecutive makes and weaken after hard rim contact.
- `shop.equippedBall` and `shop.equippedBackground` are stable semantic item keys chosen by the implementation; they must remain consistent across snapshots and persistence.

## Feature Contract Matrix

| GDD Mechanism | Contract Input | Observable Snapshot / External Postcondition | Candidate Values / Postconditions |
|---|---|---|---|
| M1 Home and first-play entry | `reset()` then `tapPlayfield` | `phase`, `canInteractWithPlayfield`, ball motion, playfield visual revision | Home moves to playing; ball becomes visible, `verticalTrend` becomes `up` or `motionRevision` changes, and horizontal trend points toward `hoop.side`. |
| M2 Tap-driven motion | `tapPlayfield`, `tapSequence`, `wait` in playing scenarios | `ball.motionRevision`, `verticalTrend`, `horizontalTrend`, `playfield.visualRevision` | Accepted taps change ball motion; waiting without taps lets the ball trend downward or settle according to physics; tap point does not select left/right aim. |
| M3 Hoop-side direction switch | `playing_right_hoop` / `playing_left_hoop_after_score` plus player taps | `hoop.side`, `ball.horizontalTrend`, `hoop.revision` | Right hoop taps push visible motion right; left hoop taps push visible motion left. After a valid basket, hoop side changes and later tap direction reverses. |
| M4 Physical collision risk | `collision_risk` plus mistimed tap or wait | `feedback.lastCollision`, `ball.motionRevision`, `feedback.visibleEffectRevision` | Floor, rim, or backboard contact changes ball motion and produces visible feedback; collision is not just a static label. |
| M5 Valid basket scoring | `approach_hoop` plus player timing/wait | `score`, `feedback.lastScoreDelta`, `feedback.lastShotQuality`, `hoop.revision`, timer state | Score increases only after a top-down make through the opening; basket feedback changes; next hoop becomes available. |
| M6 Timed failure and result | `timed_run_after_score` plus `wait` or failed tap sequence | `timer.ratio/state`, `feedback.warningActive`, `phase`, `result`, `coinsEarnedThisRun` | Timer decreases, warning appears near expiration, and unresolved failure reaches result; playfield taps stop affecting score/motion after result. |
| M7 Restart and home return | `result_with_score` plus `retry` or `home` | `phase`, `score`, `timer`, `coins`, `bestScore` | Retry starts a new zero-score run; home returns to home while retaining persistent best score/coins. |
| M8 Pause/resume flow | `pause`, `tapPlayfield`, `wait`, `resume` | `phase`, `overlayBlocking`, ball/timer revisions | Pause freezes ball motion and timer and blocks playfield impulses; resume preserves and continues the same run. |
| M9 Coins and basic cosmetics | `timed_run_after_score` followed by unresolved failure, `shop_with_coins`, `shop_insufficient_coins`, shop actions | `coins`, `coinsEarnedThisRun`, `shop.itemCounts`, equipped keys, `persistence.revision`, playfield/ball visual revision | Result grants coins from score only after the failure/result path is triggered by play or waiting; affordable locked item purchase deducts coins, unlocks, equips, and changes visible cosmetic summary; insufficient funds preserve balance, ownership, and equipment. |
| M10 Sound setting | `toggleSound` from home or playing | `sound.enabled`, `persistence.revision`, stable score/timer/economy | Sound state toggles and persists; it does not start a shot or mutate score, time, coins, or ownership. |
| M11 Leaderboard access | `openPanel({panel:"leaderboard"})`, `closePanel` | `phase`, `leaderboard.status`, `overlayBlocking` | Leaderboard opens as a blocking panel with entries, empty, unavailable, loading, or error state; closing returns without gameplay/economy mutation. |
| M12 Heat and rich feedback | Repeated legal makes from `approach_hoop` or normal play | `feedback.heatLevel`, `lastShotQuality`, `visibleEffectRevision`, score deltas | Clean/soft makes strengthen feedback and score progression; hard rim makes weaken heat. |
| M13 Expanded collection | Shop category and item selection actions | `shop.category`, item counts, equipped keys, visible revisions | Extra cosmetics or presentation may exist, but cannot replace P1 score, timer, physics, or restart contracts. |

## External Postconditions

- The primary playfield must be visible and nonblank in home and playing phases. `playfield.visible` and `playfield.visualRevision` must reflect visible game changes after accepted gameplay input.
- A visible HUD or equivalent status surface must express score, timer state when applicable, best score, coins, current phase, and blocking overlays.
- Real mouse or touch interaction with the main playfield must have the same gameplay effect as `input({type:"tapPlayfield"})` when `canInteractWithPlayfield` is true.
- Visible controls for pause/resume, retry/home, sound, shop, leaderboard, category switching, and item selection must be discoverable and operable without relying on the public test API.
- When `overlayBlocking` is true, real playfield clicks/touches and `tapPlayfield` must not move the ball, increase score, consume timer, or mutate coins/ownership.
- Result phase must lock scoring and playfield impulses until retry or home.
- Persistence-affecting actions must change `persistence.revision`; after a browser reload or fresh boot, best score, coins, equipped choices, owned items, background choice, and sound setting should be observable through the same snapshot fields.

## Rejection And Invariants

- Invalid action types return `lastAction.ok === false` and do not throw.
- `tapPlayfield` in paused, result, shop, or leaderboard phase is rejected or ignored with no ball motion revision, no score delta, no timer consumption, and no economy change.
- `pause` outside a playing run is rejected or ignored without changing score, timer, coins, ownership, or result.
- Unaffordable shop selection returns `lastShopResult: "rejectedInsufficientFunds"` or `lastAction.reason: "insufficientFunds"` and preserves balance, ownership counts, and equipped item keys.
- Selecting an already equipped item returns `lastShopResult: "alreadyEquipped"` or a no-op success and preserves balance and unrelated state.
- Shop category switching must not alter score, timer, coins, ownership, equipped items, or current run progress.
- Leaderboard open/close must not alter score, timer, coins, ownership, equipped items, or current run progress.
- Score, coins, best score, item counts, timer ratio, and heat level must never become negative.

## Scenario Review Notes

All declared scenarios are legal preconditions rather than result injection:

- Scoring scenarios require later `tapPlayfield`, `tapSequence`, or `wait` to produce a basket.
- Collision scenarios require later mistimed tapping or waiting to produce collision feedback.
- Timer scenarios begin with time still available and require waiting or failed play to reach warning/result.
- Shop scenarios only set balance/item availability; purchase, equip, rejection, and visual/economy changes must be caused by `selectShopItem`.
- Paused, result, shop, and leaderboard scenarios represent states reachable by player controls and are used to verify blocking, restart, return, and rejection behavior.

## Forbidden Test Contract Shortcuts

Tests and implementations must not use this contract to:

- Set score, best score, coins, timer, heat, result, or basket success directly.
- Mark a collision, clean shot, purchase, equip, leaderboard result, or terminal state as already completed when the tested action is supposed to cause it.
- Expose or depend on source-private variables, functions, class names, DOM selectors, CSS classes, asset names, exact text, animation frame order, or physics constants.
- Depend on fixed pixel coordinates, fixed canvas dimensions, fixed colors, fixed fonts, or a unique layout.
- Pass a core mechanism solely from interface existence, `{ ok: true }`, static text, a static number, or an unchanged visual surface.
