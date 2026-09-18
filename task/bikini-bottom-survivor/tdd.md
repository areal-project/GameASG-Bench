# Bikini Bottom Survivor TDD

## Public Test Contract Goals

The game must expose the player-level public contract `window.__gameTest` to describe game state reliably and perform coarse-grained player actions. This contract is not an internal object graph and must not require private variables, a specific render tree, a fixed DOM structure, fixed coordinates, fixed colors, or a specific algorithm. All public actions must drive actual game state and produce corresponding postconditions in the HUD, panels, main view, or snapshot.

Recommended interface:

```javascript
window.__gameTest = {
  reset(options),
  input(action),
  getSnapshot(),
  loadScenario(name)
}
```

## Interface Semantics

### `reset(options)`

- Input: Optional `{ start: true|false }`. `start: true` means entering playing; if omitted or false, the game may return to the default menu/entry point after loading.
- Output: `Snapshot`.
- Postconditions: Clears the current run's enemies, projectiles, drops, temporary items, results screen, and upgrade screen; restores initial health, level, experience, time, and interactive state. If returning to the menu, the playfield is visible but blocked by the start screen; if starting directly, the playfield is interactive.

### `getSnapshot()`

Returns a stable summary containing at least:

```javascript
{
  phase: "loading|menu|playing|paused|levelUp|gameOver|transition|dialog",
  screen: "loading|menu|game|pause|levelUp|gameOver|panel",
  activePanel: null|"pause"|"levelUp"|"gameOver"|"quest"|"achievements"|"daily",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  time: number,
  score: number,
  health: number,
  maxHealth: number,
  level: number,
  experience: number,
  expToNextLevel: number,
  result: "none|lose",
  player: { screenX:number, screenY:number, worldX:number, worldZ:number, moving:boolean },
  camera: { yaw:number|null, screenDirectionReliable:boolean },
  playfield: { left:number, top:number, width:number, height:number },
  entityCounts: { enemies:number, projectiles:number, gems:number, orbiting:number, shields:number, bosses:number },
  nearestEnemy: null|{ screenX:number, screenY:number, health:number, distance:number },
  nearestGem: null|{ screenX:number, screenY:number, value:number, distance:number },
  upgrades: { projectileCount:number, damage:number, fireRate:number, moveSpeed:number, maxHealthBonus:number, regen:number, orbiting:number },
  upgradeChoices: [{ id:string, label:string, category:string }],
  revisions: { render:number, movement:number, attacks:number, enemyMotion:number, pickups:number, upgrades:number, damage:number },
  hud: { healthText:string, levelText:string, timerText:string, expText:string },
  challenges: { visible:boolean, activeCount:number, completedToday:number },
  achievements: { visible:boolean, unlockedCount:number, totalCount:number },
  persistence: { hasSavedProgress:boolean }
}
```

Field semantics:

- `phase` is the sole primary state; `screen` is the currently visible main screen.
- `overlayBlocking=true` indicates that a menu/panel prevents the playfield from receiving ordinary input.
- `canInteractWithPlayfield=true` is permitted only while playing and when no blocking panel is present.
- `player.screenX/screenY` must be the protagonist's on-screen position as seen by the player or the center of the bounds, for validating directional semantics.
- `revisions.*` is a summary of observable behavior counts and increases only when the corresponding behavior actually occurs.

### `input(action)`

All action values are player-level actions. Returns `{ ok:boolean, reason?:string, snapshot:Snapshot }` or directly returns `Snapshot`, but invalid actions must be observable through `ok:false`, `reason`, or unchanged state.

Action schema:

| Action | Schema | Semantics |
|---|---|---|
| start | `{ type:"start" }` | Equivalent to clicking the start button |
| pause | `{ type:"pause" }` | Equivalent to pressing Escape/the pause button |
| resume | `{ type:"resume" }` | Equivalent to the resume button |
| restart | `{ type:"restart" }` | Equivalent to restarting from the results/pause screen |
| key | `{ type:"key", key:"ArrowLeft|ArrowRight|ArrowUp|ArrowDown|KeyA|KeyD|KeyW|KeyS|ShiftLeft", durationMs?:number }` | Equivalent to holding an actual key for a period of time |
| pointerMove | `{ type:"pointerMove", dx:number, dy:number, durationMs?:number }` | Equivalent to a touch joystick or dragged directional input |
| chooseUpgrade | `{ type:"chooseUpgrade", id?:string, index?:number }` | Selects a visible upgrade while in levelUp |
| wait | `{ type:"wait", durationMs:number }` | Waits for the game to advance naturally |
| openPanel | `{ type:"openPanel", panel:"quest|achievements|daily" }` | Opens a meta-system panel |
| closePanel | `{ type:"closePanel" }` | Closes the current panel |
| interact | `{ type:"interact", target:"npc|portal|nearestGem" }` | Interacts with or approaches the currently visible semantic target to collect it |

Invalid input rejection:

- Unknown `type`, an invalid directional key, a negative or excessively long duration, selecting an upgrade outside the levelUp state, performing movement in the gameOver state, and performing combat actions in the menu state must all be rejected or leave core state unchanged.
- `loadScenario` cannot directly grant victory, add score, kill enemies, complete the game, or bypass the core rule chain. After a scenario loads, subsequent player actions must still be required to trigger the result.

### `loadScenario(name)`

Allowed scenarios:

| Name | Valid prerequisite state | Prohibited preset results |
|---|---|---|
| `playing_clear` | playing, with the player in an open area, at full health, and no blocking panel | Must not already have kills, a level-up, or defeat |
| `near_enemy` | playing, with at least one enemy within visible range and the player at full health | Must not already have hits or dead enemies |
| `enemy_contact` | playing, with one enemy nearby but before it has caused this instance of damage | Must not deduct this damage in advance or go directly to gameOver |
| `near_gem` | playing, with an experience item at a visible position outside pickup range | Must not increase the experience from this pickup in advance |
| `near_level_up` | playing, with experience close to the threshold and one collectible experience item | Must not already have entered levelUp |
| `level_up_choice` | levelUp, with multiple upgrade choices displayed and combat frozen | Must not already have applied this upgrade |
| `low_health` | playing, with low health and one enemy capable of causing defeat | Must not already be gameOver |
| `boss_intro` | P2, with a boss about to appear or already present but not dead | Must not grant rewards or complete the boss objective in advance |
| `shield_pickup` | P2, with a visible shield pickup that has not been collected | Must not already have the hit result for this shield |
| `daily_panel` | P2, with the daily challenge panel available to open | Must not directly complete today's objectives |
| `peaceful_zone` | P2, with the player in a peaceful zone or non-combat area defined in the source, and currently under no ordinary enemy-wave pressure | Must not preset kills, experience, damage, or combat rewards |

## DOM/HUD/Canvas/WebGL Postconditions

- After entering playing, the main canvas/WebGL or equivalent main playfield must be visible, have non-zero dimensions, and show a non-empty view. After actual input, at least one of the view, protagonist position, or HUD must change observably.
- The HUD's health, level, time, and experience must match the snapshot summary; graphical bars, numbers, or a combination may be used, but changes must be visible.
- When the menu/pause/upgrade/results panel is a visible blocking layer, `overlayBlocking=true` and `canInteractWithPlayfield=false`.
- While `phase=playing`, if there is no blocking panel, `overlayBlocking=false`, and actual keyboard/touch input changes the protagonist's on-screen position or movement revision.
- The WebGL/3D scene must remain a player-visible product requirement; the implementation may use WebGL, Canvas 2D pseudo-3D, or DOM 3D, but it must provide a non-empty, readable main scene, screen-space positions, and visible changes after actions.

## Behavioral Trajectory Contract

| Trajectory | Coverage M | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Start and enter game | M1/M2 | Default loading or `reset(false)` | Actually click start or `input({type:"start"})` | phase=playing, overlayBlocking=false, the playfield is interactive, and the main scene is non-empty | The menu blocking layer cannot remain |
| Directional movement | M3 | `loadScenario("playing_clear")` | Actually press ArrowRight/ArrowLeft, then ArrowUp/ArrowDown or W/S | The signs of player.screenX displacement in the left and right directions are opposite; the signs of player.screenY displacement, or equivalent on-screen displacement in the forward and backward directions, are opposite; movement revision increases | health, level, and experience do not change from movement alone |
| Pause freeze | M1/M4/M5 | playing, with enemies or timing running | Press Escape to pause, wait, then resume | While paused, time/enemyMotion/attacks do not advance; they may advance after resuming | Damage and pickups cannot occur while paused |
| Enemy damage and defeat | M4 | `loadScenario("enemy_contact")` or `low_health` | Wait for an enemy attack | health decreases; at low health, phase=gameOver/result=lose | Movement input remains unchanged after the end state |
| Automatic attacks and enemy defeat | M5 | `loadScenario("near_enemy")` | Wait for automatic attacks | attacks revision/projectiles increase; enemy health decreases or enemies decreases; a gem may appear | A scene with no enemies cannot increase kills/experience |
| Experience and level-up | M6 | `loadScenario("near_level_up")` | Actually move toward the experience item according to screen direction, or use equivalent interaction to collect it | experience changes or the levelUp phase occurs; the upgrade panel appears | Combat freezes after entering levelUp; after an experience item is collected, it cannot remain in the same position and be resolved repeatedly |
| Select upgrade | M7 | `loadScenario("level_up_choice")` | Select a visible upgrade | phase returns to playing; fields such as upgrades or maxHealth/projectileCount change | Selecting an upgrade outside levelUp is rejected and state remains unchanged |
| Shield/transformation | M8 | `loadScenario("shield_pickup")` | Collect it and wait/take damage | shield count or transform state appears and is subsequently consumed/ends | Temporary abilities cannot bypass damage permanently |
| Boss | M9 | `loadScenario("boss_intro")` | Wait/attack the boss | bosses>0, boss health/HUD is visible, and progression occurs after death | Boss rewards cannot be granted before the boss dies |
| Panel systems | M10/M11 | playing or menu | Open/close quest, achievement, and daily panels | activePanel and visible counts change correctly | Closing returns to the prior state |
| Peaceful zone combat freeze | M12 | `loadScenario("peaceful_zone")` | Wait for a period of time and attempt ordinary combat progression | Enemies/projectiles do not grow naturally, health does not decrease, and attacks/enemy motion do not advance | A peaceful zone cannot continue spawning ordinary enemy waves or damaging the player in the background |

## Feature-Interface Mapping

| M | Public observations/actions |
|---|---|
| M1 | `input(start/pause/resume/restart)`, `phase`, `screen`, `overlayBlocking`, `canInteractWithPlayfield` |
| M2 | `playfield`, `player.screenX/screenY`, `revisions.render`, canvas/WebGL visibility |
| M3 | Actual `holdKey`, `input(key)`, `player.screenX/screenY`, `revisions.movement` |
| M4 | `entityCounts.enemies`, `nearestEnemy.distance`, `health`, `result`, `revisions.damage/enemyMotion` |
| M5 | `entityCounts.projectiles/gems/enemies`, `nearestEnemy.health`, `revisions.attacks/pickups` |
| M6 | `experience`, `expToNextLevel`, `level`, `upgradeChoices`, `phase=levelUp` |
| M7 | `upgrades`, `entityCounts.orbiting`, `revisions.upgrades` |
| M8 | `entityCounts.shields`, `activePanel`, `revisions.damage`, ability-related snapshot summaries |
| M9 | `entityCounts.bosses`, `nearestEnemy`, boss HUD in `hud` or snapshot |
| M10/M11/M12 | `input(openPanel/closePanel/interact)`, `activePanel`, `challenges`, `achievements`, `persistence` |

## Public Contract Consistency Requirements

`window.__gameTest` must not merely return `{ ok:true }` or only change hidden state; every setup/action must drive the actual HUD, panel, main view, or snapshot to the postconditions above synchronously or after a short delay.

If public `window.__gameTest` is absent, the public contract is not satisfied. If a P2 scenario has not yet been implemented, `loadScenario(name)` may return `{ ok:false, reason:"not_implemented" }`, but the corresponding visible UI should not pretend that the system has already been completed.
