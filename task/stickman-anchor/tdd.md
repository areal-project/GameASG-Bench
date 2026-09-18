# Stickman Anchor TDD Public Contract

## Scope

This file defines the portable public test contract for Stickman Anchor. It is a semantic shell for player-level actions and observable state summaries only. It does not require a particular renderer, DOM layout, physics formula, file structure, private function, internal object graph, fixed coordinate, exact text, or asset name.

The contract must be implemented by playable builds so automated checks can drive the same game through menu, combat, progression, shop, pause, and optional secondary systems. All gameplay expectations come from `game-spec.md` and `design-doc.md`; this file only names the public inputs, legal setup scenarios, stable snapshot fields, and external postconditions needed to observe those expectations.

## Public Interface

Expose this object after the game is ready:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  loadScenario(name, options): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot
}
```

### Method Semantics

- `reset(options)` returns the game to a fresh boot-equivalent public state. It may preserve long-term progress only when `options.keepProgress === true`; otherwise it starts from a deterministic baseline with the first playable level unlocked, baseline coins and gear, no active combat, no transient arrows, no active result, and no blocking error panel.
- `loadScenario(name, options)` loads one of the legal precondition states listed below. It must not directly award victory, defeat, purchases, damage, hits, collected power-ups, special-arrow effects, combo credit, level completion, or enemy/player death. Any such result must be caused later by `input(action)` or normal elapsed time.
- `input(action)` performs a player-level action or advances time. It returns a new `Snapshot`. Invalid or unavailable actions must not throw; they return a snapshot with either `lastAction.ok === false` or unchanged relevant fields plus a rejection reason.
- `getSnapshot()` returns the latest stable public summary without mutating gameplay.

The public interface may be backed by real pointer, touch, keyboard, or UI interactions. `input(action)` is not a cheat channel: action types below must be equivalent to what a player could do through visible controls or waiting.

## Action Schema

Every action has a `type` string and may include `durationMs` for actions that represent hold or wait time. Coordinates, when used, are normalized to a semantic area returned in the snapshot, not fixed page pixels.

| Action | Required fields | Player-level meaning | Required observable result |
|---|---|---|---|
| `startGame` | none | Activate the main play route from boot or menu | `screen` becomes `levelSelect` or `playing`; blocking boot/menu overlay no longer covers active combat once a level starts |
| `openPanel` | `panel: levelSelect|shop|settings|leaderboard` | Open a visible menu panel | `activePanel` matches the requested panel and `overlayBlocking` reflects whether playfield input is blocked |
| `closePanel` | optional `panel` | Close the active non-terminal panel | `activePanel` clears or returns to the previous legal screen |
| `selectLevel` | `levelRef` | Choose a listed level | Unlocked levels enter `playing`; locked levels are rejected without changing current playable level |
| `pause` | none | Press the pause control during combat | `phase` becomes `paused`, playfield input is blocked, combat motion revisions stop changing except allowed presentation-only death feedback |
| `resume` | none | Continue from pause | `phase` returns to `playing` and combat can update again |
| `restart` | none | Retry the current combat | Current level remains selected, transient combat state is reset, long-term progress remains |
| `returnToMenu` | none | Leave combat/result/panel flow for menu | `screen` becomes `menu`; combat input is blocked and no stale result remains active |
| `aimStart` | `point` | Press or touch the battlefield to begin aiming | `aim.state` becomes `aiming`, drawn/preview observables become active when combat allows it |
| `aimMove` | `point` or `direction: up|down|higher|lower` | Continue dragging to adjust aim | `aim.angleCategory`, `aim.screenVector`, or `aim.previewRevision` changes in the corresponding visible direction |
| `aimRelease` | none | Release to shoot | When allowed, aiming ends and player projectile count or projectile revision increases; when blocked by cooldown/phase, no extra shot is created |
| `dragAimAndRelease` | `direction`, optional `strength`, optional `targetRef` | Convenience wrapper for a press-drag-release player gesture | Same as the three aim actions, with visible aim change before release and shot/cooldown postcondition after release |
| `wait` | `durationMs` | Let the game run | Enemy counterfire, projectile motion, platform motion, bubbles, status effects, pending victory/defeat, or cooldown may advance according to current state |
| `activateResultAction` | `action: continue|retry|shop|menu` | Choose a visible result route | Moves to the declared next flow and respects terminal-state cleanup |
| `shopAction` | `kind: buy|equip`, `category: bow|helmet`, `itemRef` | Buy or equip visible shop gear | Affordable buy changes coins/ownership/equipped state; unaffordable or already-equipped action is rejected without incorrect spending |
| `toggleSetting` | `setting: sfx|music` | Toggle an audio setting | Setting value changes and persists across reset with progress kept |
| `dismissTutorial` | none | Complete onboarding by real first interaction or explicit dismissal if offered | Tutorial no longer blocks combat input and completion is reflected in snapshot |

`point` uses one of these forms:

```javascript
{ "zone": "playfield", "nx": 0.0, "ny": 0.0 }
{ "semantic": "playerAimHandle|playerBow|enemyBody|enemyHead|powerUpBubble", "ref": "stableRefFromSnapshot" }
```

Normalized `nx` and `ny` are relative to the current `playfield.bounds` in the snapshot. Tests may also use semantic targets exposed by `enemies.visible[].targetZones` and `powerUps.visible[].zone`. Implementations must not require tests to guess fixed coordinates.

## Legal Scenario Schema

`loadScenario(name)` may set up these public preconditions. Each scenario must be reachable as a normal game state described by the Game Spec, and each listed result requires the stated trigger after loading.

| Scenario | Legal precondition | Allowed trigger for observed result | Forbidden setup shortcut |
|---|---|---|---|
| `boot_fresh` | Fresh boot or first menu with baseline progress | `startGame`, `openPanel`, `selectLevel` | Starting in a completed victory/failure or pre-opened reward state |
| `menu_with_progress` | Menu with at least one completed level, visible coins, stars, unlock progress | `openPanel`, `selectLevel`, `shopAction` | Directly changing best stars or coins as the check result |
| `level_select_mixed` | Level select contains unlocked, current/completed, and locked entries | `selectLevel` on locked or unlocked entries | Treating a locked selection as completed or opened |
| `combat_ready_basic` | A normal playable battlefield with player, at least one live spawned enemy, platforms, health, HUD, no blocking overlay, no active projectile | `aimStart`, `aimMove`, `aimRelease`, `wait`, `pause` | Pre-damaging enemies, pre-firing arrows, pre-awarding combo, victory, or defeat |
| `combat_aim_direction` | Same as `combat_ready_basic`, with stable aim controls visible | Opposite `aimMove` or `dragAimAndRelease` directions | Returning only static aim values with no player gesture |
| `combat_single_enemy` | A legal simple combat level with one live enemy and normal player health | Repeated player shots and wait time can produce hit, defeat, or victory | Loading with enemy already dead, player boosted, or victory pending |
| `combat_enemy_pressure` | A legal combat state with at least one enemy able to aim and fire after time passes | `wait` while playing; optional player miss/long aim to leave attack window | Loading player already damaged/dead or enemy arrow already hitting |
| `combat_moving_platform` | A legal level where at least one active enemy stands on a moving platform | `wait` while playing; optional aim gestures at moving target | Directly teleporting enemies or platform to satisfy motion result |
| `combat_wave_queue` | A legal level where an active enemy has queued enemies behind it | Player defeat of the active enemy through shots, then `wait` | Loading next enemy already spawned as the check result or victory pending |
| `combat_powerup_available` | Playing state with at least one visible moving shootable power-up bubble and no held special effect | Player arrow hits bubble, then wait for collection, then fire | Pre-collecting the bubble, pre-setting held effect, or injecting special arrow charges |
| `combat_powerup_multi_available` | Playing state with a visible uncollected multi-shot bubble and no held special effect | Player arrow hits bubble, waits for collection, then releases a shot | Loading an already-held multi-shot effect or already-fired extra arrows |
| `combat_powerup_ice_available` | Playing state with a visible uncollected ice bubble and no held special effect | Player arrow hits bubble, waits for collection, then hits a live enemy | Loading enemy already frozen or pre-setting ice charges |
| `combat_powerup_fire_available` | Playing state with a visible uncollected fire bubble and no held special effect | Player arrow hits bubble, waits for collection, then hits a live enemy and waits | Loading enemy already burning or pre-applying burn damage |
| `combat_protected_enemy` | A live enemy with visible head protection and normal health | Player hit to protected head zone, then later valid hits | Pre-removing protection, pre-counting headshot, or forcing enemy death |
| `shop_affordable` | Shop or menu state with enough earned coins for at least one unowned item | `openPanel(shop)`, `shopAction(buy/equip)` | Pre-owning the item that is being tested for purchase |
| `shop_insufficient` | Shop or menu state with too few coins for at least one unowned item | `shopAction(buy)` | Letting coins go negative or marking item owned despite rejection |
| `paused_from_combat` | A normal combat state before pause is pressed | `pause`, then aim or wait, then `resume`/`restart` | Loading already paused as the observed pause result |
| `combat_victory_route_ready` | A normal combat state where all remaining enemies can be defeated through player shots | Player shots and wait time reach victory, then `activateResultAction(continue|retry|menu)` | Loading with victory already visible or enemies already defeated |
| `combat_defeat_route_ready` | A normal combat state where live enemies can defeat the player if the player waits or misses | `wait` or missed player shots reach failure, then `activateResultAction(retry|shop|menu)` | Loading player already dead, failure already visible, or level already marked complete |
| `settings_available` | Menu state with settings available | `toggleSetting` and reset with progress kept | Blocking play because settings or ranking data cannot load |
| `tutorial_first_level` | Early playable level before tutorial completion | First real aim interaction or `dismissTutorial` | Tutorial permanently blocking combat after interaction |

Power-up scenarios must start from visible uncollected bubbles and no held special effect. Special-arrow behavior is only observable after the player shoots the bubble, waits for collection feedback, and then releases a normal player shot.

## Snapshot Schema

`Snapshot` is a stable, implementation-neutral summary. Fields may include additional public data, but the fields below must keep their names and meanings.

```typescript
type Snapshot = {
  ready: boolean,
  phase: "loading" | "menu" | "levelSelect" | "playing" | "paused" | "victoryPending" | "result" | "failure",
  screen: "loading" | "menu" | "levelSelect" | "combat" | "shop" | "settings" | "leaderboard" | "result" | "failure",
  activePanel: "none" | "levelSelect" | "shop" | "settings" | "leaderboard" | "pause" | "result" | "failure" | "tutorial",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  lastAction?: { ok: boolean, type: string, reason?: string },

  playfield: {
    visible: boolean,
    nonBlank: boolean,
    revision: number,
    bounds?: { left: number, top: number, width: number, height: number }
  },

  level: {
    currentRef: string | number | null,
    unlockedCount: number,
    selectedUnlocked: boolean,
    completedCount: number,
    bestStarsForCurrent: 0 | 1 | 2 | 3
  },

  progress: {
    coins: number,
    totalStars: number,
    bestStarsByLevel: Record<string, 0 | 1 | 2 | 3>,
    highestUnlockedRef: string | number,
    settings?: { sfx: boolean, music: boolean },
    tutorialComplete?: boolean
  },

  player: {
    alive: boolean,
    health: number,
    maxHealth: number,
    headProtection: number,
    screenX?: number,
    screenY?: number,
    aim?: {
      state: "idle" | "aiming" | "cooldown" | "blocked",
      angleCategory: "higher" | "level" | "lower" | "unknown",
      screenVector?: { dx: number, dy: number },
      previewVisible: boolean,
      previewRevision: number,
      drawnVisible: boolean
    },
    equipped?: { bowRef: string, helmetRef: string | null }
  },

  enemies: {
    total: number,
    alive: number,
    spawnedAlive: number,
    queued: number,
    attacking: number,
    frozen: number,
    burning: number,
    visible: Array<{
      ref: string,
      alive: boolean,
      spawned: boolean,
      health: number,
      maxHealth: number,
      headProtection: number,
      screenX?: number,
      screenY?: number,
      motionRevision?: number,
      attackState: "idle" | "aiming" | "pulling" | "cooldown" | "blocked" | "dead" | "unspawned",
      targetZones?: {
        body?: SemanticZone,
        head?: SemanticZone,
        protectedHead?: SemanticZone
      }
    }>
  },

  projectiles: {
    playerActive: number,
    enemyActive: number,
    playerFiredRevision: number,
    enemyFiredRevision: number,
    lastPlayerShot?: {
      type: "normal" | "multi" | "ice" | "fire",
      count: number,
      pathRevision: number,
      curvedPathObserved: boolean,
      missed?: boolean
    }
  },

  combat: {
    cooldownReady: boolean,
    damageRevision: number,
    hitRevision: number,
    headshotRevision: number,
    protectionBlockRevision: number,
    deathRevision: number,
    comboCount: number,
    comboBonusCoins: number,
    terminalInputBlocked: boolean
  },

  platforms: {
    visibleCount: number,
    movingCount: number,
    motionRevision: number,
    enemyCarriedRevision: number
  },

  powerUps: {
    visible: Array<{ ref: string, type: "multi" | "ice" | "fire" | "unknown", zone?: SemanticZone, motionRevision?: number }>,
    heldType: "none" | "multi" | "ice" | "fire",
    charges: number,
    collectionRevision: number,
    effectRevision: number
  },

  shop: {
    visible: boolean,
    categories: Array<"bow" | "helmet">,
    items: Array<{
      ref: string,
      category: "bow" | "helmet",
      affordable: boolean,
      owned: boolean,
      equipped: boolean,
      price: number,
      effectSummary: string
    }>
  },

  result: {
    type: "none" | "victory" | "defeat",
    visible: boolean,
    stars: 0 | 1 | 2 | 3,
    coinsAwarded: number,
    comboBonusCoins: number,
    routes: Array<"continue" | "retry" | "shop" | "menu">
  },

  observability: {
    hudRevision: number,
    canvasRevision?: number,
    resultRevision: number,
    worldMotionRevision: number,
    visibleFeedbackRevision: number
  }
}

type SemanticZone = {
  ref: string,
  screenX?: number,
  screenY?: number,
  bounds?: { left: number, top: number, width: number, height: number },
  visible: boolean
}
```

### Field Rules

- Numeric health, coins, charges, and counts must never be negative.
- `phase === "playing"` requires `screen === "combat"`, `playfield.visible === true`, and `overlayBlocking === false`.
- When a terminal result is visible, `canInteractWithPlayfield === false` and `combat.terminalInputBlocked === true`.
- `playfield.revision`, `observability.canvasRevision`, or equivalent visual revisions must change after a visible gameplay action that changes combat visuals.
- `targetZones` and `SemanticZone` values are product-level hit or interaction summaries. They are not internal collision geometry and do not require a specific shape; they only provide stable points or bounds for player-level input.
- Refs such as `levelRef`, `itemRef`, `enemy.ref`, and `powerUps.visible[].ref` must be stable during the current snapshot/action chain, but they must not expose source file names, private object IDs, or asset names.

## Feature Contract Matrix

| GDD feature | Contract trigger | Snapshot outputs | Postcondition and invariant |
|---|---|---|---|
| M1 Menu and level entry | `reset`, `startGame`, `openPanel(levelSelect)`, `selectLevel` | `phase`, `screen`, `activePanel`, `overlayBlocking`, `level`, `playfield` | Unlocked selection reaches playable combat; locked selection is rejected and does not mutate progress or selected playable level |
| M2 Drag aim feel | `aimStart`, opposite `aimMove`, `dragAimAndRelease` | `player.aim`, `player.aim.previewVisible`, `player.aim.previewRevision`, `playfield.revision`, `observability.visibleFeedbackRevision` | Upward/higher and downward/lower gestures produce distinct visible aim summaries; overlays, pause, result, and dead player block aim |
| M3 Release projectile | `aimRelease` after legal aiming; repeated release during cooldown | `projectiles.playerActive`, `projectiles.playerFiredRevision`, `lastPlayerShot`, `combat.cooldownReady` | Legal release creates a visible player projectile and ends aiming; cooldown or invalid phase prevents extra shots |
| M4 Enemy counterfire | `wait` in `combat_enemy_pressure` | `enemies.attacking`, `projectiles.enemyActive`, `enemyFiredRevision`, `player.health`, `deathRevision` | Live enemies can aim/fire and damage player; frozen, dead, unspawned, paused, or terminal enemies cannot keep attacking |
| M5 Hit zones and feedback | Player shots using `targetZones` from legal combat scenarios | `hitRevision`, `headshotRevision`, `protectionBlockRevision`, enemy health/death, `visibleFeedbackRevision` | Body, head, and protected-head outcomes are distinguishable; dead characters stop attacking and health summary matches death state |
| M6 Victory and defeat flow | Defeat enemies through shots; or wait for enemy damage in pressure scenario | `phase`, `result`, `combat.terminalInputBlocked`, `progress` | Victory and failure appear only after visible combat feedback; terminal input cannot fire or change outcome; failure does not award completion stars |
| M7 Platforms and waves | `wait` in moving-platform scenario; kill active enemy in wave scenario then `wait` | `platforms.motionRevision`, `enemyCarriedRevision`, `enemies.queued`, `spawnedAlive`, `visibleFeedbackRevision` | Moving platforms carry enemies; queued enemies appear before victory; unspawned enemies cannot be hit or attack |
| M8 Power-ups and special arrows | Shoot visible uncollected bubble, wait for collection, then release the collected effect | `powerUps.visible`, `heldType`, `charges`, `collectionRevision`, `effectRevision`, `lastPlayerShot.type` | Bubble collection changes held effect through visible feedback; exactly one current effect is held; charges decrease on use and never go below zero |
| M9 Stars, coins, unlocks, combos | Win level, chain quick kills, replay lower-quality win | `result.stars`, `result.coinsAwarded`, `progress.coins`, `bestStarsByLevel`, `unlockedCount`, `comboBonusCoins` | Coins stay non-negative; best stars do not decrease; frontier win unlocks next level; combo bonus is separate from base reward summary |
| M10 Equipment shop | `shopAction(buy/equip)` in affordable and insufficient scenarios | `shop.items`, `progress.coins`, `player.equipped`, later `player.maxHealth` or damage/hit effect summary | Affordable buy spends coins and owns/equips; unaffordable or already-equipped action does not spend incorrectly; equipment affects later combat summaries |
| M11 Pause, restart, blocking | `pause`, aim while paused, `resume`, `restart`, result input attempts | `phase`, `activePanel`, `overlayBlocking`, `canInteractWithPlayfield`, transient revisions | Pause blocks shooting and stops combat updates; restart clears arrows, effects, deaths, combo, cooldown and pause while preserving long-term progress |
| M12 Settings and leaderboard | `openPanel(settings)`, `toggleSetting`, `openPanel(leaderboard)` | `progress.settings`, `activePanel`, `screen`, leaderboard state in `activePanel` or optional public summary | Settings persist; leaderboard empty/loading/failure states are nonblocking |
| M13 Tutorial | `loadScenario(tutorial_first_level)`, first aim interaction or `dismissTutorial` | `activePanel`, `progress.tutorialComplete`, `canInteractWithPlayfield` | Tutorial guidance can appear early but disappears after real interaction and cannot permanently block combat |
| M14 Presentation depth | Trigger headshot, protection block, special arrow, victory | `visibleFeedbackRevision`, feature-specific revisions | Presentation feedback must accompany real state changes; visual polish alone cannot satisfy hit, reward, or terminal contracts |

## External Postconditions

- Combat must provide visible battlefield evidence: player, enemies, platforms, arrows or equivalent projectile trails, health state, and HUD/progress feedback. A snapshot-only combat state without visible playfield evidence is not contract-compliant.
- Menu, level select, shop, settings, leaderboard, pause, victory, and failure flows must expose whether they block playfield input through `activePanel`, `overlayBlocking`, and `canInteractWithPlayfield`.
- Real browser pointer/touch or semantic `input` aiming must be able to drive the same aim and shooting outcomes. The public action interface can assist deterministic tests, but it must reflect player-operable controls.
- HUD/result/progress summaries must stay synchronized with snapshot values for health, coins, stars, special-arrow charges, equipped gear, current level, victory, defeat, and blocking state.
- Restart and new-level entry must clear transient combat summaries: active projectiles, temporary power-up effect, particles/effect revisions for the previous attempt, combo count, cooldown block, deaths, pause state, and result state. Long-term progress, coins, owned gear, equipped gear, and settings remain unless `reset` explicitly clears them.

## Rejection And Anti-Cheat Rules

- No public action may directly set score, coins, stars, health, damage, enemy death, player death, combo, victory, defeat, collected bubbles, fired arrows, frozen/burning state, unlock completion, or ownership as the result being tested.
- No scenario may start with the exact postcondition under test already applied. For example, bubble collection starts from a visible uncollected bubble; special-effect impact starts from a held effect and a live target; victory starts only after player-level shots defeat enemies; defeat starts only after enemy-level attacks damage the player.
- Invalid phase actions are rejected or no-op with stable snapshot evidence: shooting from menu, pause, terminal result, dead player, locked level, or cooldown must not create a new player projectile.
- Shop rejection must preserve coins, ownership, and equipped state. Locked-level rejection must preserve selected playable level and progress.
- Tests must use semantic zones, normalized playfield points, or visible controls from snapshots. Fixed page coordinates, exact text, CSS/DOM structure, private names, asset names, and hardcoded visual constants are outside this contract.

## Self Review

- This TDD defines only public test interfaces, player-level actions, legal scenarios, stable snapshots, feature-to-contract mapping, and observable postconditions.
- Legal scenarios are preconditions and identify which player-level action or elapsed time triggers the expected result. They do not pre-award victory, damage, collision, rewards, purchases, boosts, collection, freezing, burning, or completion.
- Every P1 mechanism in the design doc maps to a trigger and observable snapshot or external result.
- The contract uses semantic refs, normalized playfield points, and visible summaries instead of private implementation names, fixed coordinates, DOM structure, exact copy, algorithm details, or source asset identifiers.
