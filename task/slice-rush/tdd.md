# Slice Rush TDD Public Contract

This file defines the portable public test contract for Slice Rush. It is a semantic shell for player-level testing only. It does not require a specific renderer, DOM structure, physics algorithm, asset name, source function, fixed coordinate, or exact UI text.

## 1. Public Test API

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

### Method Semantics

- `reset(options?)` returns the game to a clean boot or start-flow state. Optional `options` may choose a legal mode or level only if that mode/level is unlocked by the current progress model.
- `input(action)` performs one player-level action and returns the latest stable `Snapshot`. It must not mutate private state directly except as the semantic equivalent of that player action.
- `getSnapshot()` returns a stable, implementation-neutral summary of the current player-visible state.
- `loadScenario(name, options?)` may compress setup into a legal precondition already defined by the Game Spec and GDD. It must never pre-apply the result that a check is supposed to trigger.

The API may return either a plain `Snapshot` or `{ ok, snapshot, reason }`. If the wrapper form is used, `ok:false` means the action was rejected without throwing and `snapshot` must still describe the current state.

## 2. Snapshot Schema

All fields are public summaries. Numeric values may be approximate and should be compared relationally unless a range or enum is specified here.

```typescript
type Snapshot = {
  ready: boolean;
  phase: "boot" | "start" | "levelSelect" | "ready" | "playing" | "paused" | "shop" | "result";
  mode: "none" | "level" | "endless";
  result: "none" | "victory" | "scoreNotMet" | "failure";
  overlay: {
    active: "none" | "start" | "levelSelect" | "pause" | "shop" | "result" | "loading";
    blocksPlayfield: boolean;
  };
  controls: {
    canPlayfieldTap: boolean;
    canPause: boolean;
    canRetry: boolean;
    canResume: boolean;
    canOpenLevelSelect: boolean;
    canOpenShop: boolean;
    canGoNextLevel: boolean;
  };
  scene: {
    ready: boolean;
    readable3D: boolean;
    playfieldBounds?: Bounds;
    renderRevision: number;
    gameplayVisualRevision: number;
  };
  hud: {
    score: number;
    targetScore: number | null;
    scoreGoalReached: boolean;
    coins: number;
    levelLabel?: string;
    timerValue?: number | null;
    timerRatio?: number | null;
  };
  level: {
    index: number | null;
    unlocked: number[];
    total: number;
  };
  knife: {
    state: "notReady" | "stuck" | "flipping" | "slicing" | "bouncing" | "recovering" | "tumbling" | "finished";
    screenX?: number;
    screenY?: number;
    progress: number;
    height: number;
    rotationTurns: number;
    contactFace: "none" | "blade" | "handle" | "poorAngle";
    supportFace: "none" | "top" | "bottom" | "side";
  };
  route: {
    nextPlatformVisible: boolean;
    gapAhead: boolean;
    finishAhead: boolean;
    movingElementsRevision: number;
  };
  entities: {
    sliceableVisible: number;
    hazardVisible: number;
    platformVisible: number;
    particlesVisible: number;
    cutRevision: number;
    hazardFeedbackRevision: number;
  };
  progress: {
    levelCompletedCount: number;
    rewardRevision: number;
    savedRevision?: number;
  };
  shop?: {
    activeCategory: "knife" | "scene" | "platform" | "none";
    previewActive: boolean;
    selectedOwned: boolean;
    selectedEquipped: boolean;
    selectedAffordable: boolean;
    ownedCount: number;
    equippedRevision: number;
    purchaseRevision: number;
    rejectionRevision: number;
  };
}

type Bounds = { left: number; top: number; width: number; height: number };
```

### Snapshot Invariants

- Scores, coins, timers, entity counts, revisions, unlocked level indices, and progress counters must be finite. Scores and coins must not become negative.
- `phase === "playing"` requires `overlay.blocksPlayfield === false` and `controls.canPlayfieldTap === true`.
- `phase === "paused" | "shop" | "levelSelect" | "result" | "start"` requires playfield tap blocking.
- `result !== "none"` requires `phase === "result"` and playfield tap blocking.
- In level mode, `hud.targetScore` is a non-negative number. In endless mode, `hud.targetScore` is `null` and timer fields are present when play has begun.
- `scene.gameplayVisualRevision` must change after meaningful visible gameplay actions such as flip, slice, stick, bounce, failure, restart, or result transition.

## 3. Player-Level Action Schema

All actions represent public player operations. Actions may include semantic targets or runtime-derived screen points, but tests must not rely on fixed coordinates.

```typescript
type Action =
  | { type: "chooseMode"; mode: "level" | "endless" }
  | { type: "selectLevel"; index: number }
  | { type: "playfieldTap"; point?: Point }
  | { type: "playfieldTouch"; point?: Point }
  | { type: "holdPlayfield"; durationMs: number; point?: Point }
  | { type: "dragPlayfield"; from?: Point; to?: Point; durationMs: number }
  | { type: "wait"; durationMs: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "retry" }
  | { type: "nextLevel" }
  | { type: "backToStart" }
  | { type: "openLevelSelect" }
  | { type: "closeOverlay" }
  | { type: "openShop" }
  | { type: "shopCategory"; category: "knife" | "scene" | "platform" }
  | { type: "shopSelect"; item: "owned" | "affordable" | "unaffordable" | "next" }
  | { type: "shopBuy" }
  | { type: "shopEquip" }
  | { type: "shopClose" }
  | { type: "toggleAudio"; channel: "music" | "sfx"; enabled: boolean }
  | { type: "reloadSession" };

type Point = { screenX: number; screenY: number };
```

### Action Postconditions

- `chooseMode("level")` from start flow enters a legal level-ready state or a level-select state where unlocked choices are available.
- `chooseMode("endless")` enters endless-ready if endless mode is implemented. If omitted, it must be absent or rejected as P2 cut scope rather than pretending to run level mode.
- `selectLevel(index)` may enter only unlocked levels. Locked or out-of-range levels are rejected with phase/progress unchanged.
- `playfieldTap` or `playfieldTouch` while ready/playing and unblocked triggers the tap-to-flip chain. The expected observable result is a phase/state transition to playing, increased knife progress or height/rotation change, and `scene.gameplayVisualRevision` change.
- `holdPlayfield` and `dragPlayfield` must not create a separate aiming, steering, charge, or continuous acceleration mode. They may include the initial tap effect only if the same gesture would naturally begin with a tap.
- Repeated `playfieldTap` during the rhythm gate must not grant unlimited launch revisions or impossible progress. It should either be rejected or produce a smaller/no additional state change until the gate clears.
- `wait` advances only systems that should move while the current phase allows it, such as flight, falling, moving route elements, endless timer during play, and particles. It must not advance play when paused, in shop, in result, or at start.
- Menu and overlay actions must change `phase`, `overlay`, and `controls` consistently with playfield blocking.
- `nextLevel` applies only after a level-mode victory when a next unlocked or newly unlocked level is available. Otherwise it must be rejected without changing progress.
- Shop actions apply only in `phase === "shop"` and must preserve coin and ownership invariants on rejection.

## 4. Legal Scenario Schema

`loadScenario` names are legal preconditions for testing triggerable outcomes. Each scenario must be reachable by ordinary player-level actions, even if the adapter compresses the setup.

| Scenario | Legal Precondition | Reachable By | Required Trigger For Result |
|---|---|---|---|
| `fresh_start` | Boot/start flow is visible, no run result has been applied. | `reset()` | `chooseMode` or equivalent visible start control. |
| `level_ready` | An unlocked level is loaded at its start, score is cleared, knife is safely stuck, route and HUD are visible. | `chooseMode("level")`, optional unlocked `selectLevel` | `playfieldTap` starts playing and launches the knife. |
| `approach_sliceable` | The knife is before a visible sliceable target that has not been cut; no score for that target has been awarded. | Level start plus legal tap/wait sequence | Timed `playfieldTap`/`wait` causes blade interaction or a valid miss/bounce path. |
| `approach_stack` | The knife is before grouped sliceable targets, none already counted for the test. | Level route progress with previous legal actions | Timed tap/wait can cause multiple cut revisions and score growth. |
| `safe_landing_gap` | The knife is before a gap or next support, not already landed or failed. | Level start plus legal tap/wait sequence | Tap/wait sequence either lands blade-first or misses into failure. |
| `poor_contact` | The knife is approaching a support or target at a readable bad-contact risk, no bounce/recovery result pre-applied. | Legal timing sequence with current rotation/height | Wait or tap timing produces bounce/recovery/failure pressure without counting as a clean slice/stick. |
| `hazard_ahead` | A visible hazard is ahead, no collision feedback or failure has occurred. | Unlocked level with hazards plus legal tap/wait sequence | Tap/wait sequence can collide with hazard and produce failure. |
| `moving_support` | Knife is legally stuck on or near a moving support or moving route element; no failure already triggered. | Unlocked route with moving elements and legal landing | `wait` changes moving-element revision and may carry risk; `playfieldTap` can leave support. |
| `near_finish_score_met` | Knife is before the finish in level mode, and the score relation is already `score >= targetScore` through prior legal slicing. Result/reward/unlock not applied. | Route play plus enough legal slice actions | Tap/wait crossing finish produces victory, reward, and progression postconditions. |
| `near_finish_score_short` | Knife is before the finish in level mode, and the score relation is `score < targetScore` through prior legal play. Result not applied. | Route play while skipping or missing enough targets | Tap/wait crossing finish produces score-not-met, no reward/unlock. |
| `failed_result` | A failure result is visible after legal hazard/fall/bad-contact outcome. | `hazard_ahead` or `safe_landing_gap` plus failure trigger | `retry` resets the current run. |
| `paused_play` | A playable run is paused while the scene remains visible. | `level_ready`, `playfieldTap`, then `pause` | Playfield tap/wait cannot advance gameplay until `resume` or `retry`. |
| `level_select_open` | Level-select overlay is visible from start or in-run level control. | Start flow or `openLevelSelect` from level mode | Locked selection is rejected; unlocked selection loads a legal ready state. |
| `shop_open` | Shop overlay is visible and blocks playfield input. | `openShop` from a legal run state | Selecting/buying/equipping updates shop/coins or rejects without mutation. |
| `endless_ready` | Endless mode is loaded at a legal start with timer/pressure available. | `chooseMode("endless")` if implemented | Tap/wait starts timer drain; slicing can replenish; depletion/hazard/fall fails. |

Scenarios must not directly set victory, failure, score rewards, collision flags, cut flags, purchased ownership, unlocked progress, timer depletion, or completed routes unless the scenario itself is explicitly a post-result state used only to test menu recovery such as `failed_result`.

## 5. Feature Contract Matrix

| GDD Feature | Contract Input | Snapshot Output | Observable Postcondition |
|---|---|---|---|
| M1 readable 3D play scene | `chooseMode("level")`, `loadScenario("level_ready")` | `scene.ready`, `scene.readable3D`, visible route/entity counts, HUD fields | Primary playfield is visible and not blocked; route, knife, HUD, and risk/target summaries are observable. |
| M2 tap-to-flip control | `playfieldTap` or `playfieldTouch` while ready/playing | `phase`, `knife.state`, `knife.progress`, `knife.height`, `knife.rotationTurns`, visual revision | One valid tap starts/continues flipping; hold/drag does not introduce separate steering or charge. |
| M2 rhythm gate | Rapid repeated `playfieldTap` | launch/progress/revision relation | Extra taps during the gate do not create unlimited launches or impossible progress. |
| M3 contact outcomes | `loadScenario("safe_landing_gap")`, `loadScenario("poor_contact")`, timed tap/wait | `knife.contactFace`, `knife.supportFace`, `knife.state` | Blade-first contact sticks or slices; handle/poor-angle contact produces bounce/recovery/risk rather than perfect success. |
| M4 slicing and score | `loadScenario("approach_sliceable")`, timed tap/wait | `hud.score`, `entities.sliceableVisible`, `entities.cutRevision`, particles/revision | Score increases only with visible target interaction; target count or cut revision changes. |
| M4 chain cutting | `loadScenario("approach_stack")`, timed tap/wait | score delta, `cutRevision`, `knife.state` | Multiple cut outcomes are observable and still coupled to knife motion/risk. |
| M5 platform/gap route | `loadScenario("safe_landing_gap")`, tap/wait | `knife.state`, `route.nextPlatformVisible`, progress/result | Safe landing creates a next launch point; missed landing can fail. |
| M5 moving supports | `loadScenario("moving_support")`, `wait`, then optional tap | `route.movingElementsRevision`, knife progress/height/state, result | Moving elements visibly change; a stuck knife can be carried or face new risk. |
| M6 hazard/fall failure | `loadScenario("hazard_ahead")` or gap scenario plus tap/wait | `result`, `phase`, `hazardFeedbackRevision`, `controls.canPlayfieldTap` | Collision/fall produces failure feedback, result overlay, and playfield lock. |
| M7 finish score threshold | `near_finish_score_met` / `near_finish_score_short`, tap/wait crossing finish, optional `nextLevel` after victory | `result`, score relation, coins/unlocks/rewardRevision | Score-met finish yields victory/reward/unlock; score-short finish yields score-not-met without reward/unlock; next-level entry is available only when legal. |
| M8 pause/retry/back flow | `pause`, `resume`, `retry`, `backToStart` | `phase`, `overlay`, controls, score/knife reset fields | Overlays block play; resume preserves run; retry clears run-local state; back returns to start without stale result blocking. |
| M9 level progression | `openLevelSelect`, `selectLevel` | `level.unlocked`, `level.index`, rejection state | Unlocked levels load; locked levels remain blocked; victory can unlock next legal level. |
| M10 endless mode P2 | `chooseMode("endless")`, tap/wait/slice | `mode`, timer fields, result | Timer drains only during endless play, slicing can replenish, depletion/hazard/fall fails. |
| M11 shop/coins/cosmetics P2 | `openShop`, category/select/buy/equip/close | `shop`, `hud.coins`, `progress.savedRevision` | Affordable purchase deducts and unlocks/equips; unaffordable or duplicate purchase is rejected without incorrect coin loss; unpurchased preview reverts on close. |
| M12 audio/save P2 | `toggleAudio`, `reloadSession` | saved/progress revisions, optional settings summary | Supported settings and progress persist across reload; if persistence is cut, single-session state remains internally consistent. |

## 6. External Postconditions

Runtime checks may use any combination of public snapshot, browser input, HUD/overlay visibility, and playfield pixel or render-revision evidence. They must verify trigger -> observable result, not only static values.

- A real click/touch on a player-operable start or playfield region must produce the same downstream state family as `input({ type: "chooseMode" })` or `input({ type: "playfieldTap" })`.
- A game in `phase === "playing"` must not have a visible blocking overlay over the playfield.
- Score, target, timer, coin, result, and level-select surfaces must stay synchronized with snapshot fields.
- Playfield visuals must change after flip, cut, bounce, failure, restart, and mode transitions that affect the scene.
- Pause, shop, level-select, start, and result overlays must block playfield flip input while still allowing their own semantic controls.
- Terminal result states must remain locked until retry, next-level, back, or mode-switch actions.

## 7. Invalid Action And Rejection Semantics

- Invalid action shape, unknown action type, unknown scenario, locked level selection, out-of-range level selection, shop actions outside the shop, retry where unavailable, and next-level action where unavailable must reject without throwing.
- Rejected actions must not change score, coins, unlocked levels, result, mode, or knife progress except for harmless feedback/rejection revision fields.
- Playfield tap while paused, in shop, in level select, at start, or in result must not flip the knife or advance score/progress.
- Purchase rejection must preserve coins, ownership, equipment, and selected legal item state except for rejection feedback.

## 8. Explicitly Forbidden Test/Implementation Shortcuts

The contract forbids using `loadScenario` or `input` as a cheat channel. Tests and implementations must not:

- directly set score, coins, timer, victory, failure, unlocks, purchases, cuts, collisions, or finish completion as a substitute for player-triggered actions;
- expose private object graphs, source variable names, source function names, renderer internals, DOM selectors, CSS classes, asset names, or fixed world coordinates as required contract;
- require a fixed canvas size, fixed camera position, fixed pixel color, exact text, exact route coordinates, or a specific physics formula;
- pass core features from `{ ok: true }`, element existence, static HUD text, frame count, or a fixed value without a trigger and resulting observable delta;
- let `__gameTest.input` replace real browser input for behavior checks. It is only the contract path or a legal setup accelerator; at least one behavior path must use real player input for start/playfield/menu controls.

## 9. TDD Self-Review

- The contract maps only behavior already present in `game-spec.md` and `design-doc.md`: tap-flip, contact outcomes, slicing/score, route hazards, score-threshold finish, menus, progression, and P2 endless/shop/save systems.
- Scenario setup entries are legal preconditions and each lists a player-level trigger that must still cause the postcondition.
- No private source function, variable, DOM selector, file structure, asset identifier, fixed coordinate, or exact algorithm is required.
- Each core mechanism has a trigger -> snapshot/visible postcondition path and rejection/invariant coverage.
