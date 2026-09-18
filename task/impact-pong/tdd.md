# Impact Pong TDD Public Contract

## Scope

This file defines the public, portable test contract for Impact Pong. It converts the Game Spec and Design Doc into stable player-level inputs, legal setup scenarios, snapshot summaries, and observable postconditions.

The contract does not require a specific implementation structure, rendering engine, DOM tree, physics formula, canvas size, artwork, text copy, private function, private variable, or exact coordinate. Tests may use real browser input and the public contract below, but every gameplay result must still be caused by a player-level action chain.

## Public Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?: ResetOptions): Snapshot,
  input(action: PlayerAction): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name: ScenarioName, options?: ScenarioOptions): Snapshot
}
```

`reset` starts from a clean boot-ready state or a named mode when `options.mode` is provided. It must clear transient rally, point, overlay, and result state.

`input` accepts only player-level actions listed in this contract. It must not directly set scores, stars, coins, collision flags, hit events, terminal results, unlocks, or ownership except through the declared player action and rule chain.

`getSnapshot` returns a stable public summary. It must be safe to call repeatedly and must not expose internal object graphs, private names, mutable engine objects, or implementation-only data.

`loadScenario` may construct legal precondition states that are reachable in the game design. A scenario must not already contain the result being tested. After loading a scenario, the observable result must still be triggered by later player-level actions such as start, activate, drag, wait, pause, retry, select mode, or shop interaction.

## Reset Options

```typescript
type ResetOptions = {
  mode?: "challenge" | "score";
  level?: string;
  clearPersistence?: boolean;
}
```

`level` is a semantic level id from the implementation's public level list. It is not a file name or array index requirement. `clearPersistence` may clear saved long-term state for deterministic tests, but it must not skip gameplay rules inside the current run.

## Player Actions

All actions represent player-level operations.

```typescript
type PlayerAction =
  | { type: "start" }
  | { type: "selectMode"; mode: "challenge" | "score" }
  | { type: "selectLevel"; level: string }
  | { type: "openPanel"; panel: "levelSelect" | "shop" | "leaderboard" | "settings" | "menu" }
  | { type: "closePanel" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "retry" }
  | { type: "nextLevel" }
  | { type: "activatePaddle"; at?: "handleCenter" | "visiblePaddle" | { screenX: number; screenY: number } }
  | { type: "pointerMove"; deltaX: number; deltaY: number; hold?: boolean }
  | { type: "pointerDrag"; from: SemanticPoint; moves: SemanticDragMove[]; release?: boolean }
  | { type: "touchDrag"; from: SemanticPoint; moves: SemanticDragMove[]; release?: boolean }
  | { type: "wait"; until?: WaitTarget; maxMs?: number }
  | { type: "shopSelect"; category: ShopCategory; item: string }
  | { type: "shopBuySelected" }
  | { type: "settingsToggle"; setting: "music" | "sfx"; enabled: boolean };

type SemanticPoint =
  | "paddleHandle"
  | "paddleCenter"
  | "playfieldCenter"
  | "visibleBall"
  | { screenX: number; screenY: number };

type SemanticDragMove = {
  deltaX?: number;
  deltaY?: number;
  durationMs?: number;
};

type WaitTarget =
  | "ready"
  | "rendered"
  | "paddleSettled"
  | "serveLaunched"
  | "ballCrossedNet"
  | "ballBounced"
  | "opponentReacted"
  | "pointSettled"
  | "terminal"
  | "panelStable";

type ShopCategory =
  | "table"
  | "playerPaddle"
  | "opponentPaddle"
  | "ball";
```

Action postconditions:

- `start` must move the game out of loading/start gating into a menu or playable waiting state with playfield observability.
- `activatePaddle` can succeed only from an unblocked playfield and only from a semantic point on or near the visible near paddle. Activating elsewhere must leave the paddle inactive.
- `pointerMove`, `pointerDrag`, and `touchDrag` must move the near paddle only after activation and only while gameplay input is not blocked.
- Positive `deltaX` means a rightward player gesture; negative `deltaX` means leftward. Positive `deltaY` means a downward gesture that pulls the paddle back toward the player; negative `deltaY` means an upward gesture that pushes toward the table and net.
- `wait` advances time without granting direct outcomes. Any score, star, reward, miss, hit, net result, or terminal state reached during wait must come from the current legal ball/rally state.
- Panel, pause, retry, next-level, shop, and settings actions must be observable through snapshot and visible UI state, not only through `{ ok: true }`.

## Scenario Names

```typescript
type ScenarioName =
  | "boot_ready"
  | "challenge_start"
  | "score_start"
  | "player_serve_ready"
  | "computer_serve_incoming"
  | "rally_incoming_to_player"
  | "rally_incoming_to_opponent"
  | "challenge_one_point_before_clear"
  | "score_one_point_before_player_win"
  | "score_one_point_before_player_loss"
  | "paused_from_rally"
  | "level_select_with_locked_level"
  | "shop_with_owned_and_locked_item"
  | "shop_insufficient_coins";
```

Scenario legality:

- `boot_ready` may show the game ready for the player to press start. It must not already be playing.
- `challenge_start` and `score_start` must be clean playable starts with no point already awarded.
- `player_serve_ready` must place the game in a legal waiting-to-serve state with the player as server. The player still has to activate, prepare, and push forward to launch the serve.
- `computer_serve_incoming` may start from a legal opponent serve or immediately before an opponent serve. The player must still wait, track, and return the incoming ball.
- `rally_incoming_to_player` and `rally_incoming_to_opponent` are legal live-rally states with no pending point result. They must be triggerable by wait and normal paddle/opponent play, not by a pre-applied hit or score.
- `challenge_one_point_before_clear` must set player challenge progress to exactly one required point short of completion. It must not already show a clear result or award coins. Completion must require winning the next player point through a legal rally outcome.
- `score_one_point_before_player_win` and `score_one_point_before_player_loss` must set a score match one rule-based point away from a player win or loss. They must not already be terminal.
- `paused_from_rally` must represent an active or waiting rally paused through the same semantics as a player pause action.
- `level_select_with_locked_level` may expose at least one locked level and at least one unlocked level. Selecting locked content must be rejected.
- `shop_with_owned_and_locked_item` may provide visible owned and locked choices. It must not complete a purchase until the shop buy action succeeds.
- `shop_insufficient_coins` may provide a locked item that costs more than available coins. Buy must be rejected without changing coins or ownership.

## Snapshot Schema

```typescript
type Snapshot = {
  ok: boolean;
  reason?: string;

  phase: "loading" | "start" | "menu" | "waitingServe" | "playing" | "pointSettlement" | "paused" | "terminal";
  mode: "none" | "challenge" | "score";
  result: "none" | "challengeClear" | "playerWin" | "playerLoss";

  screen: {
    activePanel: "none" | "levelSelect" | "shop" | "leaderboard" | "settings" | "menu" | "pause" | "result";
    overlayBlocking: boolean;
    canInteractWithPlayfield: boolean;
    controls: {
      start?: boolean;
      pause?: boolean;
      resume?: boolean;
      retry?: boolean;
      nextLevel?: boolean;
      menu?: boolean;
      closePanel?: boolean;
    };
  };

  playfield: {
    renderReady: boolean;
    nonBlank: boolean;
    revision: number;
    visibleEntities: {
      table: boolean;
      net: boolean;
      playerPaddle: boolean;
      opponentPaddle: boolean;
      ball: boolean;
    };
    bounds?: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  };

  paddle: {
    activated: boolean;
    screenX: number | null;
    screenY: number | null;
    normalizedX: number | null;
    normalizedDepth: number | null;
    motionState: "idle" | "following" | "swingingForward" | "settling";
    atLeftBound?: boolean;
    atRightBound?: boolean;
    atNearBound?: boolean;
    atFarBound?: boolean;
    movementRevision: number;
    swingRevision: number;
  };

  opponent: {
    screenX: number | null;
    screenY: number | null;
    motionState: "idle" | "reacting" | "pursuing" | "returning" | "missed" | "blocked";
    movementRevision: number;
    hitRevision: number;
  };

  ball: {
    state: "waiting" | "served" | "rally" | "bounced" | "hit" | "netContact" | "floorContact" | "out" | "settled";
    server: "player" | "opponent" | "none";
    screenX: number | null;
    screenY: number | null;
    side: "player" | "opponent" | "net" | "offTable" | "unknown";
    verticalTrend: "rising" | "falling" | "flat" | "unknown";
    horizontalTrend: "left" | "right" | "center" | "unknown";
    depthTrend: "towardPlayer" | "towardOpponent" | "stationary" | "unknown";
    trajectoryRevision: number;
    bounceRevision: number;
    hitRevision: number;
    netContactRevision: number;
    floorContactRevision: number;
  };

  score: {
    player: number;
    opponent: number;
    target: number | null;
    lastPoint: "none" | "player" | "opponent";
    pointRevision: number;
    pointFeedbackVisible: boolean;
  };

  challenge: {
    level: string | null;
    stars: number;
    starTarget: number | null;
    unlockedLevels: string[];
  };

  economy: {
    coins: number;
    lifetimeCoins?: number;
    lastReward: number;
    rewardRevision: number;
  };

  shop?: {
    open: boolean;
    category: ShopCategory | null;
    selectedItem: string | null;
    selectedOwned: boolean | null;
    selectedLocked: boolean | null;
    selectedAffordable: boolean | null;
    previewActive: boolean;
    purchaseAvailable: boolean;
    toastVisible?: boolean;
    equipped: Record<string, string>;
    ownershipRevision: number;
    appearanceRevision: number;
  };

  feedback: {
    activationPromptVisible: boolean;
    servePromptVisible: boolean;
    pointMessageVisible: boolean;
    resultVisible: boolean;
    celebrationRevision: number;
    settings: {
      musicEnabled: boolean;
      sfxEnabled: boolean;
    };
  };
};
```

Snapshot invariants:

- `ok` may be `false` for rejected actions, but rejected actions must still return a valid snapshot and must not throw.
- `phase === "playing"` or `phase === "waitingServe"` with `screen.activePanel === "none"` requires `screen.overlayBlocking === false` and `screen.canInteractWithPlayfield === true`.
- Any blocking panel, pause screen, shop, leaderboard, settings overlay, menu overlay, or terminal result must set `screen.overlayBlocking === true` or `screen.canInteractWithPlayfield === false`.
- Scores, stars, coins, rewards, revisions, and unlocked level counts must never become negative.
- `result !== "none"` implies `phase === "terminal"` and `feedback.resultVisible === true`.
- A single point can increase `score.pointRevision` once. Further wait or paddle input during the same point settlement must not increase score or stars again.
- `playfield.nonBlank` and `visibleEntities` summarize user-visible playfield evidence. They are not a demand for a specific render technology.

Coordinate invariants:

- `paddle.screenX/screenY`, `opponent.screenX/screenY`, `ball.screenX/screenY`, and `playfield.bounds` must describe the same visible playfield coordinate space.
- These coordinates must be usable for real browser mouse/touch targeting after a direct linear mapping from `playfield.bounds` to the rendered canvas or playfield element bounds. Implementations may use any internal canvas resolution, DPR, or renderer, but must not expose raw internal simulation coordinates that cannot be mapped to the visible playfield.
- Runtime checks may use `getBoundingClientRect()` to convert this public playfield coordinate space to viewport/CDP pixels, but must still target semantic paddle/ball/playfield points rather than fixed viewport constants.

## Feature Contract Matrix

| GDD mechanism | Contract trigger | Observable snapshot result | Required postcondition |
|---|---|---|---|
| M1 Boot and mode entry | `reset`, `input({type:"start"})`, `selectMode`, `selectLevel` | `phase`, `mode`, `challenge.level`, `screen.controls`, `playfield.renderReady` | Start gating clears only after player start; mode or level change resets transient match state. |
| M2 3D playfield readability | `start` then `wait(rendered)` | `playfield.nonBlank`, `visibleEntities`, `playfield.revision` | Table, net, both paddles, and ball are visibly represented before core play checks continue. |
| M3 Paddle activation gating | movement before and after `activatePaddle` | `paddle.activated`, `paddle.movementRevision`, `feedback.activationPromptVisible` | Movement before activation does not move/serve; activation from handle/visible paddle enables control. |
| M4 Relative paddle movement | activated `pointerDrag` or `touchDrag` in opposite directions | `paddle.screenX`, `paddle.normalizedX`, `paddle.normalizedDepth`, bound flags | Right/left and down/up gestures produce matching visible paddle direction, smoothing/trend, and bounded positions. |
| M5 Player serve | `player_serve_ready` -> activate -> pull/align -> push upward -> wait | `ball.state`, `ball.server`, `ball.depthTrend`, `ball.bounceRevision`, `ball.trajectoryRevision` | Serve launches only through forward paddle action and creates ball flight/bounce toward opponent half. |
| M6 Rally return influence | `rally_incoming_to_player` -> time paddle movement into ball | `ball.hitRevision`, `paddle.swingRevision`, `ball.horizontalTrend`, `ball.depthTrend` | Player return changes ball trajectory toward opponent; opposite lateral inputs create distinguishable return tendency. |
| M7 Ball physics and scoring | legal rally states plus wait/actions until point | `ball.bounceRevision`, `netContactRevision`, `floorContactRevision`, `score.lastPoint`, `score.pointRevision` | Points come from ball/rule outcomes; the same rally cannot score twice. |
| M8 Computer opponent | serve/return sending ball to opponent | `opponent.motionState`, `opponent.movementRevision`, `opponent.hitRevision`, `ball.hitRevision` | Opponent visibly reacts, pursues, recovers, may miss, and cannot score by direct mutation without ball play. |
| M9 Per-point reset and serve alternation | legal rally produces a point, then `wait(pointSettled)` | `phase`, `ball.server`, `ball.state`, score unchanged after settlement lock | Feedback appears, input scoring is locked, next serve is prepared or automated by legal serve state. |
| M10 Challenge progression | `challenge_one_point_before_clear` -> win next legal player point | `challenge.stars`, `result`, `economy.coins`, `challenge.unlockedLevels` | Player point increments stars; reaching target clears level, grants reward once, and may unlock next level. |
| M11 Score match progression | near-win/loss score scenarios -> next legal point | `score.player`, `score.opponent`, `result`, `economy.lastReward` | Player reaching target wins with reward; opponent reaching target loses without win reward. |
| M12 Pause/restart/menu flow | `pause`, blocked movement, `resume`, `retry`, menu actions | `phase`, `screen.overlayBlocking`, `canInteractWithPlayfield`, scores/progress after retry | Pause blocks paddle and scoring input; resume restores; retry cleans old rally/progress for current mode. |
| M13 Rewards and persistence | legal terminal-producing rally, failure, panels, previews | `economy.coins`, `rewardRevision`, `challenge.unlockedLevels` | Coins change only from declared rewards or valid purchases; panels and failures do not mutate rewards. |
| M14 Shop cosmetics P2 | open shop, select owned/locked, buy, close | `shop.selectedOwned`, `selectedLocked`, `selectedAffordable`, `ownershipRevision`, `appearanceRevision`, `economy.coins` | Owned items equip; locked item preview/buy path is visible; insufficient funds reject; unpaid preview reverts when closed. |
| M15 Leaderboard/settings/audio/celebration P2 | open leaderboard/settings; toggle settings; score/win/lose | `screen.activePanel`, `feedback.settings`, `feedback.celebrationRevision` | Auxiliary panels have visible states and do not block recovery; settings affect only settings state; visual feedback remains present. |

## External Postconditions

These are public observable outcomes that runtime checks may combine with snapshots:

- The primary playfield must be visibly nonblank after entering play and must visibly change after meaningful paddle, ball, or rally actions.
- At least one visible start/play/menu control must be reachable through a real browser click and must produce the same public start or mode-entry transition as the matching player-level contract action.
- A blocking overlay or panel must visibly prevent playfield input from changing paddle movement, ball trajectory, score, stars, or rewards.
- HUD or equivalent visible status must stay synchronized with score, stars, coins, terminal result, pause state, and active panel state.
- Real mouse and touch gestures over the visible playfield must be capable of triggering the same public state transitions as matching player-level contract actions.
- Visible directional evidence must match the player's screen-space expectation: right/left gestures move the near paddle right/left, and downward/upward gestures pull back/push forward.
- Terminal results must expose retry/menu/next choices when applicable and must lock gameplay input until one of those choices is used.

## Rejection And Invariant Contracts

- Unknown actions return `ok:false` or an equivalent rejection snapshot and leave gameplay state unchanged.
- Selecting locked levels must be rejected without changing `mode`, `challenge.level`, score, stars, or coins.
- Paddle activation outside the visible near-paddle region must be rejected without enabling control.
- Movement while unactivated, paused, in a blocking panel, menu, shop, leaderboard, settings, point terminal, or result state must not change score, stars, rewards, ball hit state, or terminal result.
- Shop buy with insufficient coins must leave coins, ownership, equipped item, and appearance committed state unchanged, while exposing a visible rejection or disabled purchase state.
- Retry must clear current-run scores/stars, current ball/rally state, point feedback, and terminal state while preserving legal long-term unlocks and owned cosmetics.
- Opening, closing, or previewing panels must not award coins, stars, points, level clears, wins, or losses.

## Forbidden Test Or Setup Paths

Tests and implementations must not rely on any of the following as contract behavior:

- Directly setting score, stars, coins, result, level clear, win/loss, ownership, ball collision, hit, net contact, floor contact, or opponent miss.
- Loading a scenario that already contains the point, reward, purchase, unlock, terminal result, hit, serve launch, return, or collision that the test is intended to prove.
- Exposing private names, private state objects, mutable engine instances, file paths, asset names, exact UI text, DOM selectors, CSS classes, hard-coded canvas dimensions, hard-coded object coordinates, fixed colors, or exact physics constants as required contract fields.
- Passing a gameplay check only because an interface exists, a value is static, a frame counter increases, or `{ ok: true }` is returned.
- Treating `loadScenario` as a cheat channel. It is only a legal precondition helper; the trigger and observable result must still form `player action -> game state change -> visible outcome`.
