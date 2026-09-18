# Knife Blitz 2 TDD Public Contract

## Scope

This file defines the portable public test contract for Knife Blitz 2. It converts the already documented gameplay into observable inputs, legal scenario setup, stable snapshot fields, and external postconditions.

The contract must not require a specific renderer, source structure, private function, private state object, DOM tree, fixed coordinate, fixed text, art asset, physics formula, timing algorithm, or main-loop order. Tests may use real browser input and this public adapter, but all adapter actions must be equivalent to player-visible actions.

## Public Adapter

Implementations should expose:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  loadScenario(name, options): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot
}
```

### Method Semantics

- `reset(options)` returns the game to a normal boot/home-ready state or, when `options.start === true`, to the current playable level through the same public start flow. It must not award resources, force a result, or skip settlement rules.
- `loadScenario(name, options)` creates a legal player-facing precondition from the scenario list below. It may choose deterministic content for stable testing, but it must not pre-apply the outcome being tested.
- `input(action)` performs one player-level action and returns the resulting snapshot after the action is accepted, rejected, or visibly pending.
- `getSnapshot()` returns the current stable snapshot without changing gameplay state.

All methods must return a snapshot object. Invalid scenario names or invalid actions must be rejected without throwing uncaught exceptions and without mutating unrelated gameplay state.

## Action Schema

Every action has `type: string` and may include `via`, `id`, `category`, `value`, `durationMs`, or `until` where defined.

### Navigation And Shell Actions

- `{ type: "start" }`: activate the visible start path from home/loading-ready into the current level.
- `{ type: "restart" }`: choose a visible retry/restart path when available.
- `{ type: "nextLevel" }`: choose the visible next-level path after victory settlement is ready.
- `{ type: "pauseOrSettings" }`: open the settings or equivalent gameplay-blocking settings overlay.
- `{ type: "openOverlay", overlay: "shop" | "settings" | "leaderboard" | "tip" }`: open a named player-facing overlay when the current screen provides that route.
- `{ type: "closeOverlay" }`: close the active auxiliary overlay without changing level result.
- `{ type: "confirmOverlay" }`: confirm a blocking intro/tip/dialog when a confirm route is visible.

### Core Throw Actions

- `{ type: "throw", via: "mouse" | "touch" | "keyboard", point?: SemanticPoint }`: trigger one knife launch through click/tap/Space/Enter semantics.
- `{ type: "holdThrowKey", durationMs: number }`: hold a keyboard throw input for a short interval; this must behave as at most one launch while a throw is unresolved.
- `{ type: "dragOnPlayfield", from: SemanticPoint, to: SemanticPoint }`: perform a visible drag on the playfield. This is a rejection/steering test action; it must not turn the game into drag aiming.
- `{ type: "wait", durationMs?: number, until?: "safeGapAtHitLine" | "rewardAtHitLine" | "clearingRewardAtHitLine" | "hazardAtHitLine" | "settlementReady" | "motionObserved" }`: let time pass as a player would while watching the rotating target or waiting for visible settlement readiness.

`SemanticPoint` values are product-level points derived from the snapshot, such as `playfield.center`, `throwZone.center`, `settingsControl.center`, `shopControl.center`, or an advertised item/control center. They are not fixed coordinates.

### Failure, Continue, And Retry Actions

- `{ type: "continueWithHeart" }`: choose the visible continue route after a collision failure when hearts are available.
- `{ type: "giveUp" }`: decline continue when the failure flow offers it.
- `{ type: "retryLevel" }`: retry the current level from a failure or result flow.

### Shop And Settings Actions

- `{ type: "selectShopCategory", category: "knife" | "background" | "target" }`: switch the visible shop category.
- `{ type: "chooseShopItem", itemId: string }`: choose a visible item from the advertised snapshot list.
- `{ type: "confirmPurchase" }`: confirm a pending purchase dialog.
- `{ type: "cancelPurchase" }`: cancel a pending purchase dialog.
- `{ type: "equipItem", itemId: string }`: equip an owned visible item.
- `{ type: "setSetting", setting: "music" | "sound" | "volume", value: boolean | number }`: change a visible setting control.

The adapter may return `{ ok: false, reason: string, snapshot: Snapshot }` for invalid actions, or it may return the unchanged snapshot with a rejection reason field. A bare `{ ok: true }` is never sufficient.

## Legal Scenario Schema

Scenarios are named legal preconditions. They may select a deterministic level, visible shop inventory, or player profile variant, but must not directly trigger safe hit, reward collection, collision, victory, purchase, unlock, heart spend, or score submission.

| Scenario | Legal Precondition | Player-Level Trigger For Tested Result |
|---|---|---|
| `home_ready` | Loading is complete and home/start controls are visible. | `start` enters the current playable level. |
| `playable_basic` | A normal level is playing with at least two throws required and at least one safe timing window. | `wait` then `throw` produces launch and either safe stick or legal rejection based on visible timing. |
| `playable_safe_gap` | A normal level is playing with obstacles arranged so a visible safe gap can rotate through the hit line. | `wait` with `safeGapAtHitLine`, then `throw` should stick safely. |
| `playable_with_reward` | A level is playing with a normal or high-value reward visibly attached to the target and not yet collected. | `wait` with `rewardAtHitLine`, then `throw` can collect it if collision-safe. |
| `playable_with_clearing_reward` | A level is playing with a clearing reward and at least two existing obstacles that can legally be removed by that reward. | `wait` with `clearingRewardAtHitLine`, then `throw` can collect and clear. |
| `playable_collision_with_heart` | A level is playing with at least one heart available and an existing obstacle that can visibly rotate into the hit line while at least one throw remains. | `wait` with `hazardAtHitLine`, then `throw` causes collision; only after that may `continueWithHeart` spend one heart and resume. |
| `playable_collision_no_heart` | A level is playing with no usable heart and an existing obstacle that can visibly rotate into the hit line while at least one throw remains. | `wait` with `hazardAtHitLine`, then `throw` causes collision; only after that must continue be unavailable or rejected and `retryLevel` restarts. |
| `near_level_completion` | A level is playing with exactly one required successful throw remaining and a legal safe timing window still available. | `wait` with `safeGapAtHitLine`, then `throw` completes the level and starts settlement; `nextLevel` remains gated until `settlementReady`. |
| `boss_intro_ready` | A Boss or milestone level is selected and its intro/tip overlay is visible before play. | Throw inputs are blocked until `confirmOverlay` or equivalent dismissal. |
| `shop_affordable_unowned` | The shop is open with enough coins for at least one visible, unlocked, unowned item. | Choose and confirm purchase, then ownership/equipment/coins update. |
| `shop_insufficient_funds` | The shop is open with at least one visible unlocked item the player cannot afford. | Choose and confirm is rejected without coin or ownership mutation. |
| `shop_locked_target` | The shop is open with a visible target cosmetic locked by Boss progress. | Choose/equip/purchase attempts are rejected until the documented unlock path has occurred. |
| `settings_overlay_open` | A playable level is paused or blocked by settings. | Throw input is rejected; settings changes and close return to the prior level state. |
| `leaderboard_overlay_open` | Leaderboard is visible in any supported loading/empty/ready/error state. | Close returns to the prior shell or level state without launching a throw. |

No scenario may begin with collision, reward collection, completion, purchase, unlock, heart spend, or score settlement already granted as the outcome under test. Those outcomes must be produced by the listed player-level trigger sequence.

## Snapshot Schema

`Snapshot` is a stable summary, not an internal object graph.

```typescript
type Snapshot = {
  phase: "loading" | "home" | "intro" | "playing" | "throwing" | "failed" | "continue" | "retry" | "complete" | "settlement" | "shop" | "settings" | "leaderboard";
  screen: "loading" | "home" | "level" | "bossIntro" | "tip" | "failure" | "victory" | "shop" | "settings" | "leaderboard";
  activeOverlay: "none" | "bossIntro" | "tip" | "failure" | "victory" | "shop" | "settings" | "leaderboard" | "purchaseConfirm";
  overlayBlocking: boolean;
  canInteractWithPlayfield: boolean;
  canThrow: boolean;
  result: "none" | "failed" | "victory";

  level: {
    id: string | number;
    displayIndex: number;
    isBoss: boolean;
    requiredThrows: number;
    remainingThrows: number;
    completedThrows: number;
    rotationPattern: "steady" | "variable" | "reversing" | "pausing" | "mixed" | "unknown";
  };

  score: {
    currentLevel: number;
    run: number;
    total: number;
    bestKnown?: number;
  };

  economy: {
    coins: number;
    hearts: number;
    maxHearts: number;
    heartRegenVisible: boolean;
  };

  playfield: {
    bounds: Bounds;
    center: SemanticPoint;
    target: TargetSummary;
    throwZone: { center: SemanticPoint; available: boolean };
    hitLine: { from: SemanticPoint; to: SemanticPoint; direction: "upward" };
    projectile?: ProjectileSummary;
    visibleRevision: number;
    motionRevision: number;
  };

  entities: {
    stuckKnives: EntitySummary[];
    rewards: RewardSummary[];
    particlesOrImpacts?: number;
  };

  shop?: ShopSummary;
  settings?: SettingsSummary;
  progression?: ProgressionSummary;
  feedback?: FeedbackSummary;
  lastAction?: ActionResultSummary;
};
```

### Snapshot Field Vocabulary

- `Bounds`: `{ left: number, top: number, width: number, height: number }` in current viewport coordinates. Values are runtime-discovered geometry, not required constants.
- `SemanticPoint`: `{ screenX: number, screenY: number, label?: string }` for public interaction points.
- `TargetSummary`: `{ visible: boolean, screenX: number, screenY: number, radius: number, rotationDirection: "cw" | "ccw" | "paused" | "alternating" | "unknown", rotationRevision: number, readableAttachedObjects: boolean }`.
- `ProjectileSummary`: `{ state: "none" | "launching" | "stuck" | "bounced", screenX: number, screenY: number, path: "bottomToTarget" | "unknown" }`.
- `EntitySummary`: `{ id: string, kind: "knife" | "obstacle", screenX: number, screenY: number, relationToHitLine: "clear" | "approaching" | "atHitLine" | "danger" | "past" | "unknown" }`.
- `RewardSummary`: `{ id: string, kind: "normal" | "highValue" | "clearing", screenX: number, screenY: number, relationToHitLine: "clear" | "approaching" | "atHitLine" | "danger" | "past" | "unknown" }`.
- `ShopSummary`: `{ open: boolean, category: "knife" | "background" | "target", coins: number, items: ShopItemSummary[], pendingConfirm?: boolean }`.
- `ShopItemSummary`: `{ id: string, category: "knife" | "background" | "target", visible: boolean, owned: boolean, equipped: boolean, locked: boolean, affordable: boolean, price?: number, center?: SemanticPoint }`.
- `SettingsSummary`: `{ open: boolean, musicEnabled?: boolean, soundEnabled?: boolean, volume?: number }`.
- `ProgressionSummary`: `{ currentLevel: string | number, unlockedBossTargets?: number, nextAvailable: boolean, settlementReady: boolean, rewardClaimedForCurrentCompletion: boolean }`.
- `FeedbackSummary`: `{ lastEvent: "none" | "throw" | "stick" | "reward" | "clear" | "collision" | "shatter" | "coinPayout" | "revive" | "purchase" | "equip", visualRevision: number, hudRevision: number }`.
- `ActionResultSummary`: `{ accepted: boolean, reason?: "blocked" | "cooldown" | "invalid" | "insufficientFunds" | "locked" | "notReady" | "noHeart" }`.

All counters and balances must be finite non-negative numbers unless explicitly representing unavailable optional data. `visibleRevision`, `motionRevision`, `hudRevision`, and `rotationRevision` are monotonic observable revision counters; they do not expose frame counts or implementation timing.

## External Postconditions

- Boot/home/start: after a valid `start`, `phase` becomes `intro`, `playing`, or `settings` only if a documented blocking overlay is visible. A playable level must expose a visible target, HUD values, remaining queue, and throw zone.
- Playfield visibility: in any playing or throwing state, the primary playfield must be nonblank and readable through `playfield.target.visible`, `playfield.bounds`, `visibleRevision`, and visible HUD/snapshot fields.
- Throw input: an accepted throw changes `phase` to `throwing` or produces a resolved `stick`, `reward`, `collision`, or `victory` feedback. It must not depend on pointer location for launch direction.
- Flight lock: while `phase === "throwing"` or `canThrow === false`, extra throw actions are rejected and must not change score, remaining throws, coins, hearts, or result.
- Safe stick: after a safe timed throw resolves, `completedThrows` increases, `remainingThrows` decreases, score increases, a stuck knife appears as a future obstacle, and feedback revisions advance.
- Reward collect: after a collision-safe reward throw resolves, the reward disappears or is marked collected, score gain is greater than a plain stick from a comparable legal state, and feedback identifies reward collection.
- Clearing reward: after a legal clearing reward collect, existing obstacle count decreases by at least one while the new successful throw still counts toward progress.
- Collision failure: after a hazard-timed throw resolves, `result === "failed"` or `phase` enters failed/continue/retry flow, collision feedback advances, and further throws are blocked until continue or retry.
- Heart continue: when available, `continueWithHeart` reduces hearts by one and returns to a playable state without advancing the level or granting a free victory. When unavailable, it is rejected without recovery.
- Retry: retrying after failure returns to the same level with transient throws, rewards, queue, and current-level attempt score reset while persistent coins, owned/equipped items, settings, and durable progress remain stable.
- Victory settlement: after the final required safe throw, the target enters complete/settlement flow, rewards and coins become visible, `nextAvailable` remains false until settlement readiness, and reward claiming for that completion can happen only once.
- Boss intro: Boss or milestone intro overlays block throws until dismissed; Boss completion follows normal victory and settlement invariants with higher or extra reward observability.
- Auxiliary overlays: shop, settings, leaderboard, tip, failure, victory, and purchase confirmation set `overlayBlocking === true` and `canInteractWithPlayfield === false`. Throw attempts during these overlays are rejected with no gameplay mutation.
- Shop purchase: an affordable, unlocked, unowned item can be purchased through visible choose/confirm actions; coins decrease, ownership becomes true, equipment updates when appropriate, and HUD/shop balances agree.
- Shop rejection: insufficient funds, locked items, and cancelled confirmation do not change coins, ownership, equipment, level result, or progress.
- Settings: changing visible settings updates settings snapshot and closing the overlay restores the prior non-terminal gameplay state.
- Persistence: after reset or reload-like reset where storage is available, durable values such as coins, hearts, owned/equipped cosmetics, settings, progress, and best-known scores remain consistent. If storage is unavailable, current visible gameplay must still continue without fatal blocking.

## Feature Contract Matrix

| GDD Feature | Contract Trigger | Required Snapshot / External Result | Rejection / Invariant |
|---|---|---|---|
| M1 Loading/home/start | `reset`, `start` from `home_ready` | `phase` reaches playable level or documented blocking intro; HUD and target summaries visible | Loading/home do not accept throws. |
| M2 Fixed-line throw | `throw` via mouse/touch/keyboard from `playable_basic` | Projectile path is `bottomToTarget`; accepted action changes throw state or resolved feedback | Pointer position/drag cannot steer; burst input is rejected during flight/cooldown. |
| M3 Rotating target | `wait` with `motionObserved` in playing state | `rotationRevision` or `motionRevision` advances; attached objects remain readable | Direction/pause changes must be observable, not numeric-only. |
| M4 Stick/collision/queue | `wait` for safe gap then `throw`; `wait` for hazard then `throw` | Safe path changes score/queue/stuck count; hazard path enters failed flow | Rejected throw does not decrease queue or score. |
| M5 Rewards and clearing | Reward scenarios plus `wait` and `throw` | Reward count/collected status changes; score delta distinguishes reward; clearing reduces existing obstacles | Reward still requires safe timing; clearing is not direct completion. |
| M6 Failure/heart/retry | Collision scenario, then `continueWithHeart` or `retryLevel` | Failure blocks throws; continue spends heart and resumes; retry resets current attempt | No-heart continue rejected; retry does not advance level. |
| M7 Victory/coins/next | `near_level_completion`, safe throw, settlement wait, `nextLevel` | Complete/settlement phases, coin/score payout, `nextAvailable` gates advancement | Reward and coin claim for one completion cannot duplicate. |
| M8 Boss | `boss_intro_ready`, dismiss, play/complete via same core actions | Intro blocks throws; Boss flag visible; completion exposes extra/higher reward or unlock summary | Boss reward obeys normal settlement and no-duplicate rules. |
| M9 Shop | Shop scenarios, category/select/confirm/equip actions | Category, item states, coins, ownership, equipped state, HUD balance sync | Locked/insufficient/cancelled actions preserve resources and ownership. |
| M10 Settings/leaderboard/tip | Open/close overlays; setting action | Active overlay and settings/leaderboard summaries visible; close returns correctly | Overlay blocks playfield throws. |
| M11 Persistence/best progress | Complete/retry/reset/reload-like reset | Durable economy/progress/settings remain consistent; best score does not farm repeated current win | Save failure cannot block core play. |
| M12 Feedback polish | Throw/stick/reward/collision/victory/purchase actions | `feedback.lastEvent` and visual/HUD revisions advance for major events | Visual feedback must remain sufficient even without audio. |

## Anti-Cheat And Non-Contract Items

The public adapter must not expose actions that directly set score, coins, hearts, level result, collision result, reward result, completed throws, owned items, equipped items, or progress as the effect under test. It must not expose direct hit, direct miss, direct collect, direct clear, direct win, direct fail, direct revive, direct buy, or direct unlock shortcuts.

The snapshot must not expose private arrays, private object references, source identifiers, implementation function names, exact render commands, exact frame counters, fixed canvas size, fixed DOM selectors, copied text, or asset filenames. Stable semantic summaries and runtime-discovered interaction points are allowed.

Tests built from this contract should prefer trigger-to-result assertions: a player-level action must cause a compatible snapshot delta and visible postcondition. Static existence of fields, controls, or `{ ok: true }` responses is not enough to pass a core mechanism.
