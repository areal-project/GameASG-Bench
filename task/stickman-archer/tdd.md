# Stickman Archer TDD Contract

This file defines the public, portable test contract for Stickman Archer. It only describes player-level actions, legal scenarios, stable observable snapshots, and external postconditions derived from `game-spec.md` and `design-doc.md`. It does not prescribe rendering technology, private state, source names, DOM structure, fixed coordinates, or physics algorithms.

## Public Test Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  getSnapshot(): Snapshot,
  input(action): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

- `reset(options?)` returns the game to a clean boot/play state. It may accept `{ preserveProgress: boolean }`; the default should clear transient battle state and start from a deterministic new session suitable for tests.
- `getSnapshot()` returns a stable summary of user-visible game state. It must not expose private object graphs, source-specific names, raw engine instances, or exact implementation data.
- `input(action)` performs one player-level action and returns a post-action snapshot after the action has been accepted, rejected, or queued. It must not directly award damage, rewards, victory, defeat, purchases, unlocks, special arrows, or collisions.
- `loadScenario(name, options?)` loads a legal precondition already described by the GDD. A scenario may set up a level, progress state, enemy composition, player equipment, or shop affordability state, but it must not pre-apply the result that a test is supposed to cause.

All methods must be safe to call repeatedly. Invalid actions or invalid scenario names must return a snapshot with an action result such as `{ ok: false, reason }` or preserve state without throwing uncaught errors.

## Action Schema

Every action is a player-level action. Implementations may support additional actions, but the following names and meanings must be stable.

| Action | Required fields | Meaning | Observable postcondition |
|---|---|---|---|
| `start` | optional `level` | Use a player-facing start path to enter an unlocked level. | `phase` becomes `playing`, playfield is interactable, level HUD and battle entities are visible. |
| `openPanel` | `panel: levelSelect|shop|settings|leaderboard|pause` | Open a player-facing panel or pause overlay. | `activePanel` updates, overlay blocking is true for modal panels, playfield interaction is blocked when applicable. |
| `closePanel` | optional `panel` | Close the active auxiliary panel or resume from a non-terminal overlay when allowed. | `activePanel` clears or returns to the prior allowed state. |
| `selectLevel` | `level` | Select an unlocked level through the level selection path. | An unlocked level starts; a locked level is rejected with progress unchanged. |
| `aimStart` | `point: playfield|aimAnchor|screenPoint` | Press or touch the battle playfield to begin aiming. | `aim.state` becomes `aiming` when combat is playable; rejected when blocked or terminal. |
| `aimMove` | `direction: higher|lower|center` or `to: screenPoint` | Drag while aiming to adjust shot angle. | `aim.pitch`, `aim.previewVisible`, `aim.previewApex`, or equivalent screen-space aim summary changes consistently with the drag direction. |
| `aimRelease` | none | Release the pointer/touch after aiming. | At most one player projectile is launched if firing is allowed; aiming state ends. |
| `dragAim` | `from`, `moves`, `release: boolean` | A complete pointer/touch drag sequence equivalent to press, drag, and optional release. | Combines the aim and firing postconditions above. |
| `wait` | `ms` or `ticks` | Let visible game time advance. | Projectiles, enemy preparation, enemies, platforms, bubbles, status effects, and timers may advance when not paused or terminal. |
| `restart` | none | Use the retry/restart path for the current level. | Current level transient battle state is cleared and reloaded; persistent legal progress remains. |
| `nextLevel` | none | Continue from a victory result to the next unlocked level. | A new playable level loads only after victory/unlock conditions are met. |
| `buy` | `itemType: bow|helmet`, `itemId` or `semantic: affordable|unaffordable` | Attempt a shop purchase through the player-facing shop path. | Coins and ownership change only on affordable valid purchase; insufficient funds are rejected. |
| `equip` | `itemType: bow|helmet`, `itemId` | Equip an owned item through the player-facing shop path. | Equipment summary changes only for owned items. |
| `toggleSetting` | `setting: sound|music` | Toggle a settings control. | Setting state changes and persists in snapshot without blocking core play. |

`screenPoint` values are semantic points returned by `Snapshot.playfield`, `Snapshot.aim`, or target/bubble bounds. Tests must not rely on hard-coded page coordinates.

## Scenario Schema

Scenarios create legal preconditions only. They must be reachable from normal play, progress, or menu/shop state by player actions, even if the public loader skips the time needed to reach them.

| Scenario | Legal precondition | Player action that must trigger the result |
|---|---|---|
| `fresh_boot` | New or reset session before any required player input. | `start`, `openPanel`, or menu actions. |
| `first_level_ready` | An unlocked first playable level with player, at least one enemy, platform, HUD, and no terminal result. | `aimStart`, `dragAim`, `wait`, `openPanel: pause`. |
| `aim_direction_probe` | A playable battle where the player can aim safely long enough to observe high and low drag responses. | `aimStart` followed by `aimMove: higher` and `aimMove: lower`. |
| `single_enemy_open` | A playable battle with one reachable enemy and no pre-existing hit outcome. Enemy is alive before the shot. | Player `dragAim`/`aimRelease` launches an arrow; `wait` advances flight and possible hit/miss. |
| `armored_enemy_open` | A playable battle with an alive helmeted or guarded enemy whose protection has not already been consumed. | Player shot to a declared head or body target zone causes visible damage or guard feedback without direct setup damage. |
| `enemy_pressure` | A playable battle with at least one alive enemy able to attack and player health above zero. | `wait` or normal player aiming allows enemy preparation, projectile launch, and possible player damage. |
| `near_defeat_pressure` | A legal battle state where the player is alive with low health and an enemy attack window is reachable. It must not start in defeat. | `wait` for enemy attack or continued combat triggers damage and possible failure. |
| `victory_path_ready` | A legal playable level where enemies are alive but low enough, positioned, or simple enough that player shots can clear the level. It must not start in victory. | Player shots and `wait` eliminate remaining enemies, triggering victory. |
| `progress_menu` | A legal menu/progress state with at least one unlocked level and at least one locked future level if multiple levels exist. | `selectLevel`, `openPanel: levelSelect`, `nextLevel` after victory. |
| `shop_affordable` | A legal progress state with enough coins to buy at least one basic P1 bow or helmet that is not yet owned. | `openPanel: shop`, then `buy` and optional `equip`. |
| `shop_insufficient_funds` | A legal progress state with too few coins for at least one locked shop item. | `buy` attempts are rejected with coins and ownership unchanged. |
| `helmet_equipped_battle` | A playable battle with a legally owned/equipped helmet before combat starts. | Enemy/player head-hit or damage interactions can show increased health or guard feedback through normal combat. |
| `moving_platform_level` | A playable level containing a visible moving platform and an alive enemy carried by it. | `wait` shows platform/enemy motion; player shots interact with the changing window. |
| `powerup_bubble_open` | P2 playable battle with a visible collectable bubble that has not been collected or expired. | Player arrow must hit the bubble to collect a special arrow; waiting without hit may expire it. |
| `special_arrow_ready` | P2 playable battle where the player legally holds one special arrow charge before shooting. | `dragAim`/`aimRelease` consumes a charge and creates the declared special effect. |

Forbidden scenario setup: starting in victory or defeat for a result test, pre-awarding coins/stars/unlocks for the action under test, pre-marking a purchase complete, pre-creating a collision or damage event, pre-freezing/burning an enemy before a special arrow is fired, pre-consuming armor for an armor test, or spawning arrows already in flight when the test is meant to verify firing.

## Snapshot Schema

`Snapshot` must be JSON-serializable and stable across equivalent implementations. Numeric fields should use relative or screen-space summaries, not fixed source constants.

```typescript
type Snapshot = {
  ok?: boolean;
  reason?: string;
  phase: 'boot' | 'menu' | 'playing' | 'paused' | 'victory' | 'defeat' | 'settings' | 'shop' | 'levelSelect' | 'leaderboard';
  screen: 'loading' | 'mainMenu' | 'battle' | 'result' | 'panel';
  activePanel: null | 'pause' | 'victory' | 'defeat' | 'levelSelect' | 'shop' | 'settings' | 'leaderboard' | 'chest';
  overlayBlocking: boolean;
  canInteractWithPlayfield: boolean;
  time: { running: boolean; revision: number };
  render: {
    playfieldVisible: boolean;
    nonBlank: boolean;
    revision: number;
    bounds?: Bounds;
  };
  playfield: {
    bounds?: Bounds;
    semanticPoints?: {
      center?: ScreenPoint;
      playerAimAnchor?: ScreenPoint;
      safeDragStart?: ScreenPoint;
    };
  };
  hud: {
    levelVisible: boolean;
    coinsVisible: boolean;
    playerHealthVisible: boolean;
    enemyHealthVisible: boolean;
    specialVisible: boolean;
    resultVisible: boolean;
  };
  level: {
    index: number;
    unlocked: boolean;
    completed: boolean;
    stars: number;
    totalLevels?: number;
  };
  progress: {
    coins: number;
    totalStars: number;
    highestUnlockedLevel: number;
    completedLevels: number;
  };
  player: CombatantSummary;
  enemies: CombatantSummary[];
  platforms: Array<{ visible: boolean; moving: boolean; screenBounds?: Bounds; motionRevision?: number }>;
  aim: {
    state: 'idle' | 'aiming' | 'cooldown' | 'blocked';
    pitch: 'lower' | 'level' | 'higher' | number;
    previewVisible: boolean;
    previewApex?: ScreenPoint;
    releaseReady: boolean;
    dragZones?: { higher?: ScreenPoint; lower?: ScreenPoint; neutral?: ScreenPoint };
  };
  projectiles: {
    playerCount: number;
    enemyCount: number;
    activeCount: number;
    lastPlayerShot?: ProjectileSummary;
    lastEnemyShot?: ProjectileSummary;
  };
  combat: {
    lastHit: null | HitSummary;
    comboCount?: number;
    enemyAttackState: 'idle' | 'preparing' | 'fired' | 'blocked' | 'stopped';
    result: 'none' | 'win' | 'lose';
  };
  special: {
    heldType: null | 'multi' | 'ice' | 'fire';
    charges: number;
    bubblesVisible: number;
    visibleBubbles?: Array<{ type: 'multi' | 'ice' | 'fire'; bounds: Bounds; collectible: boolean }>;
  };
  shop: {
    coinsVisible: boolean;
    visible: boolean;
    items?: Array<ShopItemSummary>;
    equipped: { bow?: string; helmet?: string };
  };
  settings?: { sound: boolean; music: boolean };
  controls: {
    start: boolean;
    pause: boolean;
    resume: boolean;
    restart: boolean;
    nextLevel: boolean;
    home: boolean;
    shop: boolean;
  };
};
```

Supporting types:

```typescript
type Bounds = { screenX: number; screenY: number; width: number; height: number };
type ScreenPoint = { screenX: number; screenY: number };

type CombatantSummary = {
  visible: boolean;
  alive: boolean;
  health: number;
  maxHealth: number;
  screenX?: number;
  screenY?: number;
  headZone?: Bounds;
  bodyZone?: Bounds;
  armorBlocks?: number;
  status?: Array<'normal' | 'frozen' | 'burning' | 'guarded' | 'dead'>;
  attackReady?: boolean;
  motionRevision?: number;
};

type ProjectileSummary = {
  owner: 'player' | 'enemy';
  visible: boolean;
  launchedByRelease: boolean;
  screenX?: number;
  screenY?: number;
  movement: 'forward' | 'downward' | 'arc' | 'outOfBounds' | 'stuck' | 'unknown';
  pathRevision: number;
};

type HitSummary = {
  owner: 'player' | 'enemy';
  target: 'enemy' | 'player' | 'bubble' | 'none';
  zone: 'head' | 'body' | 'armor' | 'miss' | 'bubble';
  damageApplied: boolean;
  killed: boolean;
  feedbackRevision: number;
};

type ShopItemSummary = {
  itemType: 'bow' | 'helmet';
  itemId: string;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
  visible: boolean;
};
```

Stable invariants:

- `progress.coins`, health values, stars, special charges, projectile counts, and completed levels must never be negative.
- `phase === 'playing'` with a blocking overlay still active is invalid.
- When `phase` is `paused`, `victory`, `defeat`, `shop`, `settings`, `leaderboard`, or `levelSelect`, playfield input must not launch a new shot.
- Dead enemies must not continue effective attacks.
- Defeat must not unlock a level or improve stars.
- Restart must clear transient battle objects and terminal state while preserving legitimate persistent progress.

## Feature Contract Matrix

| GDD mechanism | Contract trigger | Snapshot observation | Required postcondition |
|---|---|---|---|
| M1 battle start/readability | `reset`, `start`, `selectLevel` | `phase`, `render`, `hud`, `player`, `enemies`, `platforms` | A playable level exposes a nonblank playfield, visible player/enemy/platform summaries, health HUD, level HUD, and playfield interaction. |
| M2 aim angle input | `aimStart`, `aimMove: higher/lower`, `dragAim` without release | `aim.state`, `aim.pitch`, `aim.previewVisible`, `aim.previewApex`, `render.revision` | Press enters aiming; higher and lower drags produce opposite observable angle or preview changes; blocked phases reject aiming. |
| M3 arrow flight | `dragAim` with release, then `wait` | `projectiles`, `lastPlayerShot`, `render.revision` | Release launches at most one player arrow; it remains visible for a flight interval, moves forward, and shows an arcing/downward trend before hit or cleanup. |
| M4 hit layering | Legal target scenario plus player shot and `wait` | `combat.lastHit`, enemy health/alive/armor/status, HUD, render revision | Body hits reduce health; unguarded head hits can kill; guarded head hits consume or show guard feedback before instant kill is allowed. |
| M5 enemy counterattack | `enemy_pressure` plus `wait` while playing | `combat.enemyAttackState`, `projectiles.lastEnemyShot`, player health, render revision | Living enemies prepare and fire through visible time; enemy shots may reduce player health; paused/dead/frozen/terminal states stop effective attacks. |
| M6 win/loss/restart | `victory_path_ready` with player shots; `near_defeat_pressure` with enemy attack; `restart` | `phase`, `combat.result`, `progress`, `controls`, transient counts | Victory gives result, stars/coins/unlock as allowed; defeat gives failure state without unlock/star improvement; restart reloads current level cleanly. |
| M7 level/spatial variation | `selectLevel` unlocked later level or `moving_platform_level` plus `wait` | enemy counts/status, platform `motionRevision`, enemy `motionRevision`, level summary | Later or declared platform scenarios show additional enemies, guarded/high-health targets, waves, or platform motion without premature victory. |
| M8 P2 special arrows/bubbles | `powerup_bubble_open` with player shot; `special_arrow_ready` with shot | `special`, `combat.lastHit`, enemy status, projectile count | Bubble collection requires an arrow hit; special charge appears; multi/ice/fire shots consume charge and cause visible declared effect. |
| M9 economy/equipment | `shop_affordable`/`shop_insufficient_funds`, `openPanel: shop`, `buy`, `equip`, then battle start | `progress.coins`, `shop.items`, `shop.equipped`, player health/damage/guard summaries | Affordable purchase deducts coins and owns/equips item; insufficient purchase preserves coins/ownership; equipped bow/helmet has observable battle effect. |
| M10 menu/pause/panels | `openPanel`, `closePanel`, `restart`, `start` | `phase`, `activePanel`, `overlayBlocking`, `canInteractWithPlayfield`, `time.running` | Panels are visible and blocking as appropriate; pause stops battle time and rejects playfield shots; resume restores playing. |
| M11 P2 combo/rewards | Consecutive legal kills in a battle | `combat.comboCount`, `progress.coins`, result/reward HUD | Combo or boss rewards appear only after real kills and reset on new level/window expiry. |
| M12 P2/cut systems | Declared P2 action paths only when implemented | relevant panel/snapshot fields | Optional systems may be absent, but if exposed they must be operable, observable, and non-blocking to P1 play. |

## External Postconditions

Runtime checks may combine the public snapshot with browser-standard observations. The implementation must make the following player-visible outcomes observable without relying on a single DOM structure or exact text:

- The primary playfield is visible, nonblank, and changes after battle actions that should animate or render.
- HUD or an equivalent visible status surface reflects level, coins, player health, enemy health, result, and special arrow status when those states are relevant.
- A visible or semantic panel state distinguishes menu, level select, shop, settings, leaderboard, pause, victory, and defeat.
- When an overlay blocks play, playfield pointer/touch actions do not launch arrows or mutate battle state.
- Shop controls are discoverable through player-facing purchase/equip actions and synchronize with coin/ownership/equipment summaries.
- Result controls for retry, next level, home/menu, and shop are discoverable when the corresponding result state is active.

## Rejection And Anti-Cheat Rules

The contract forbids:

- Directly setting win/loss, score, stars, coins, unlocks, health damage, kills, collisions, special-arrow ownership, purchase completion, armor consumption, freeze/burn state, or projectile hits through `input`.
- Using `loadScenario` to start with the result under test already applied.
- Returning only `{ ok: true }` without a schema-compliant snapshot and downstream observable state.
- Requiring tests to know private function names, private variables, raw config arrays, source DOM selectors, source file structure, exact wording, exact colors, fixed canvas dimensions, or fixed screen coordinates.
- Letting API-only state pass while the player-facing path is inoperable or visually absent.

Checks built from this TDD should prove `trigger -> observable result`: each core action must change a relevant snapshot field and at least one independent visible or semantic surface, or preserve state with a clear rejection reason for invalid actions.
