# Mini Tanks TDD Public Test Contract

## Contract Boundaries

This document defines only the public testable shell for Mini Tanks, used to convert the gameplay already defined in `game-spec.md` and `design-doc.md` into stable inputs, scenarios, snapshots, and postconditions. The implementation may freely choose rendering, layout, state organization, physics details, and UI structure, but it must expose equivalent player-level behavior and observable summaries.

This contract must not be implemented as a cheating channel: the test interface must not directly set scores, victory or defeat, damage, hits, explosion results, terrain destruction results, ammunition consumption results, AI hit results, or result outcomes. All results must be triggered by player-level action from a legal precondition state.

## Public Interface

The implementation must provide the following after the page is ready:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

Interface semantics:

- `reset(options?)`: clears the current game and returns to the title or a specified legal starting point; it must not retain old projectiles, old persistent effects, old ammunition, or old scores.
- `input(action)`: performs a coarse-grained action equivalent to a player operation and returns a stable snapshot after the action. Illegal actions must be rejected or have no effect and must not throw unhandled exceptions.
- `getSnapshot()`: returns only a stable summary, not internal object graphs, rendering nodes, private functions, exact algorithm parameters, or resource filenames.
- `loadScenario(name, options?)`: enters a legal precondition state that is defined by the GDD and reachable through a player path. It may only prepare an operable state and cannot preemptively cause the victory/defeat, reward, hit, collision, explosion, health deduction, terrain destruction, or ammunition consumption result to be verified.

The return value should be a `Snapshot`. `input()` may attach a `lastAction` summary at the top level of the snapshot to indicate whether the action was accepted, but `{ ok: true }` cannot be the sole evidence that a feature passes.

## Action Schema

All actions are player-level semantic actions. The implementation may map them to buttons, keyboard, mouse, touch, dragging, or custom controls.

```javascript
{
  type: string,
  target?: string,
  mode?: string,
  direction?: string,
  weaponId?: string,
  amount?: number,
  durationMs?: number,
  point?: { screenX: number, screenY: number },
  from?: { screenX: number, screenY: number },
  to?: { screenX: number, screenY: number }
}
```

Candidate actions:

- `startMode`: `mode = single|local2p|practice`, enters the corresponding mode from the title.
- `openPanel` / `closePanel`: `target = ammoLibrary|info|updates|ammoSelect|result|menu`, opens or closes a player-visible overlay panel.
- `selectFromAmmoPool`: selects a currently visible ammunition card during the ammunition preparation phase; `weaponId` must come from the selectable options exposed by the snapshot.
- `randomizeAmmo`: uses the random allocation entry point during the ammunition preparation phase to form inventories for both sides.
- `confirmAmmo` / `cancelAmmo`: confirms or cancels ammunition selection during combat.
- `selectWeapon`: selects `weaponId` from the current side's inventory during the aiming phase.
- `adjustAngle`: `direction = up|down`, or `amount` is a relative change; a continuous action may include `durationMs`.
- `dragAngle`: adjusts the vertical angle control using `from/to` or a target semantic point.
- `adjustPower`: `direction = up|down`, or `amount` is a relative change; a continuous action may include `durationMs`.
- `dragPower`: adjusts the vertical power control using `from/to` or a target semantic point.
- `move`: `direction = left|right`, requests limited movement for the currently controllable tank.
- `fire`: fires the current weapon during the aiming phase.
- `waitForSettled`: waits for flight, explosions, persistent effects, tank falling, or AI actions to enter the next stable phase; it cannot directly skip result rules.
- `pause` / `resume`: switches the interactive state when the implementation provides combat pausing or an overlay panel.
- `restart`: starts a new game from an available entry point in results or combat.
- `returnToMenu`: returns from combat or results to the title level and clears the old game.
- `realInput`: used in L2 to trigger a semantic area through real browser input; `target` may be `fire|moveLeft|moveRight|angleControl|powerControl|weaponChoice|panelControl|playfield`.

Illegal or inapplicable actions must return an unchanged state or `lastAction.ok = false`, while preserving resources, scores, turns, and terminal-state locking.

## Scenario Schema

`loadScenario(name)` may construct only the following legal precondition states. Each scenario must be reachable as the same type of state through the listed player-level action path.

| Scenario | Legal precondition state | Reachable player path | Triggerable post-result |
|---|---|---|---|
| `title_ready` | The title level is displayed and combat has not begun | `reset()` | `startMode` opens ammunition preparation or practice combat; a panel action changes the overlay state |
| `single_ammo_prep` | A single-player battle is in ammunition preparation, with a visible ammunition pool, and has not yet entered a phase in which firing is possible | `reset` -> `startMode(single)` | `selectFromAmmoPool` or `randomizeAmmo` forms inventories and advances combat |
| `local2p_ammo_prep` | A local two-player battle is in ammunition preparation, with both sides taking ammunition in turn according to the rules | `reset` -> `startMode(local2p)` | Both sides enter local combat after selecting or receiving random allocations |
| `practice_aiming_ready` | In practice mode, the player can aim, move, select weapons, and fire | `reset` -> `startMode(practice)` | After adjusting angle, adjusting power, moving, switching ammunition, and firing, control returns to the player |
| `single_player_aiming_ready` | In a standard single-player battle, it is the player's turn, aiming is possible, and both sides have legal inventories | `reset` -> `startMode(single)` -> complete ammunition preparation | Adjust angle, adjust power, move, switch ammunition, and fire to enter flight/effect and advance to AI or results |
| `local_current_player_aiming` | In a local two-player battle, the current side can aim and has inventory | `reset` -> `startMode(local2p)` -> complete ammunition preparation | The current side moves, switches ammunition, aims, and fires; after resolution, the turn switches to the other side |
| `player_near_left_boundary` | The current side's tank has moved legally to near the left boundary and remains on the terrain surface | From any aiming scenario, repeat `move(left)` until restricted by the boundary | Another `move(left)` should be rejected or have no effect, without incorrectly consuming movement resources |
| `player_no_moves_remaining` | The current side's movement count for this turn has been exhausted through legal movement | From any aiming scenario, repeat valid `move` until the count reaches zero | Subsequent `move(left|right)` should be rejected and the state should remain stable |
| `post_fire_lock_window` | The current side has just executed `fire` and entered the flight or effect phase | Any aiming scenario -> `fire` | Adjusting angle, adjusting power, moving, switching ammunition, and firing a second time are rejected; `waitForSettled` then advances the turn |
| `single_opponent_turn` | The opponent is able to act or is acting in a single-player battle | Single-player player turn -> `fire` -> `waitForSettled` until the opponent's turn | Player combat inputs are rejected; after waiting, play should return to the player, skip a side with no ammunition, or proceed to results |
| `endgame_low_ammo_ready` | A standard battle or local two-player battle is near the terminal state, both sides have only a small amount of legal ammunition remaining, and the game is still on an actionable turn | From standard/local combat, consume inventory through legal firing until it is nearly exhausted | Continue using `fire` and `waitForSettled` to consume the remaining ammunition and naturally enter results |

Scenarios such as `direct_hit`, `enemy_dead`, `score_awarded`, `terrain_destroyed`, `weapon_already_exploded`, `instant_win`, `instant_lose`, and `free_reward`, which already contain the result under test, must not be provided.

## Snapshot Schema

`Snapshot` must be a JSON-serializable object. When fields are unavailable, this must be expressed with `null`, an empty array, or an explicit Boolean value rather than an undefined internal object.

```javascript
{
  schemaVersion: 1,
  screen: "title|ammoPrep|battle|result|library|info|updates|loading",
  phase: "menu|preparing|aiming|flying|effect|opponentTurn|paused|result",
  mode: "none|single|local2p|practice",
  activePanel: "none|ammoLibrary|info|updates|ammoSelect|result|menu",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  controlLock: "none|overlay|notCurrentTurn|inFlight|settling|terminal|preparing",
  currentSide: "none|player|opponent|player1|player2",
  result: "none|win|lose|draw",

  scores: { player: number, opponent: number },
  turn: { index: number, currentSide: string, canAct: boolean },
  ammo: {
    poolCount: number,
    selectablePool: Array<{ id: string, category: "standard|heavy|special", selectable: boolean }>,
    playerCount: number,
    opponentCount: number,
    currentWeaponId: string | null,
    currentWeaponCategory: "standard|heavy|special|none",
    ownedWeaponIds: string[]
  },

  aim: {
    angle: number,
    power: number,
    barrelScreenAngle: number,
    previewVisible: boolean,
    previewRevision: number,
    reticle?: { screenX: number, screenY: number } | null
  },

  movement: {
    remaining: number,
    lastMoveAccepted: boolean | null,
    blockedReason: "none|boundary|noMoves|restricted|notAllowed"
  },

  tanks: {
    player: TankSummary,
    opponent: TankSummary
  },

  projectile: {
    active: boolean,
    count: number,
    lastPathSample: Array<{ screenX: number, screenY: number }>,
    lastHorizontalDirection: "left|right|none",
    gravityTrend: "downward|flat|unknown"
  },

  terrain: {
    revision: number,
    visibleVariation: "flat|varied|unknown",
    lastImpact?: { screenX: number, screenY: number, kind: "terrain|tank|boundary|effect|unknown" } | null,
    tankSurfaceEnvelope: null | {
      player?: TankSurfaceEnvelope,
      opponent?: TankSurfaceEnvelope
    }
  },

  effects: {
    explosionRevision: number,
    damageRevision: number,
    scoreRevision: number,
    worldMotionRevision: number
  },

  controls: {
    startSingle: boolean,
    startLocal2p: boolean,
    startPractice: boolean,
    fire: boolean,
    moveLeft: boolean,
    moveRight: boolean,
    angle: boolean,
    power: boolean,
    weaponSelect: boolean,
    returnToMenu: boolean,
    restart: boolean
  },

  visible: {
    playfieldReady: boolean,
    playfieldBounds: { left: number, top: number, width: number, height: number } | null,
    playfieldNonBlank: boolean | null,
    hudRevision: number,
    resultLayerVisible: boolean,
    tankCount: number
  },

  lastAction?: {
    type: string,
    ok: boolean,
    reason?: string
  }
}
```

`TankSummary`:

```javascript
{
  present: boolean,
  side: "player|opponent|player1|player2",
  screenX: number,
  screenY: number,
  onTerrain: boolean,
  inBounds: boolean,
  barrelScreenAngle: number
}
```

`TankSurfaceEnvelope`:

```javascript
{
  tankScreenX: number,
  tankBaseScreenY: number,
  terrainScreenY: number,
  tolerance: number,
  tankOnVisibleSurface: boolean
}
```

Field semantics:

- `screen` represents the main level seen by the player; `phase` represents the combat state-machine phase.
- When `overlayBlocking = true`, the underlying combat or menu must not be triggered accidentally.
- `canInteractWithPlayfield = true` is allowed to appear only when the current player can act and no blocking overlay is present.
- `currentSide` and `turn.currentSide` must consistently represent the side currently able to act.
- `scores.*`, `ammo.*Count`, and `movement.remaining` must be nonnegative numbers.
- `aim.previewRevision`, `terrain.revision`, and `effects.*Revision` are stable incrementing or change summaries used to prove that visible feedback occurred; fixed values are not required.
- `visible.playfieldBounds` is the semantic playable area and does not require a fixed canvas size or DOM structure.
- `terrain.tankSurfaceEnvelope` is a grounding summary for the tank on the current visible terrain cross-section. It represents only the player-visible alignment between the bottom of the tank and the terrain surface and does not expose terrain arrays, collision bodies, pixel colors, or rendering nodes. When `tanks.*.onTerrain === true`, the corresponding `tankOnVisibleSurface` must be true, and `tankBaseScreenY` should be within `terrainScreenY ± tolerance`; if the tank leaves that surface, the snapshot must explain it through a public state such as `onTerrain=false`, flight/falling/results.

## External Postconditions

Outside the public interface, the player-visible layer must remain synchronized with the snapshot:

- When `screen = battle` and `phase = aiming`, the main battlefield is visible, at least two tanks and terrain are observable, and the HUD expresses core state including the current side, current weapon, score, movement, angle, and power.
- When `overlayBlocking = true`, a visible overlay blocks input to the underlying playfield; closing it restores the original level and interactivity.
- After adjusting the angle, the snapshot's `aim.angle` or `aim.barrelScreenAngle` changes, and the barrel direction or preview summary changes in sync.
- After adjusting power, the snapshot's `aim.power` changes, and the preview summary or the trend of subsequent flight distance changes in sync.
- After valid movement, the current tank's `screenX` changes in the requested direction, `movement.remaining` decreases, and the tank remains `onTerrain` and `inBounds`.
- After valid firing, `phase` enters `flying` or `effect`, an active projectile or effect summary appears, and the current weapon inventory decreases; combat input is locked during flight/effect.
- After the projectile or effect ends, the game must enter the next legal turn, continue in a player-controllable practice state, skip a side with no ammunition, or enter results, and cannot remain stuck in the flight phase for an extended period.
- After terrain is hit, `terrain.revision` or the visible terrain summary changes, along with a change in the explosion or effect revision; after resolution/landing, tanks that remain on the terrain must again satisfy the visible grounding relationship in `terrain.tankSurfaceEnvelope`.
- After hitting near the opposing side, the attacking side's score increases; an ineffective landing point, self-damage, or hitting one's own side must not increase the score for attacking the opponent.
- At results, `resultLayerVisible = true`, `phase = result`, and combat input is locked; returning to the menu or restarting clears the old game state.

## Feature Contract Matrix

| GDD mechanic | Contract input | Snapshot output | Postcondition / invariant |
|---|---|---|---|
| M1 Menu and mode flow | `startMode`, `openPanel`, `closePanel`, `returnToMenu` | `screen`, `mode`, `activePanel`, `overlayBlocking`, `canInteractWithPlayfield`, `controls` | Overlay panels block accidental input to the underlying layer; after entering combat, no menu overlay blocks the playfield |
| M2 Ammunition preparation | `selectFromAmmoPool`, `randomizeAmmo` | `phase=preparing|aiming`, `ammo.poolCount`, `ammo.playerCount`, `ammo.opponentCount` | Firing is not allowed until preparation is complete; standard combat can begin only after inventories are formed |
| M3 Angle aiming | `adjustAngle`, `dragAngle`, real angle-control input | `aim.angle`, `aim.barrelScreenAngle`, `aim.previewRevision`, `tanks.*.barrelScreenAngle` | Adjusting upward increases the angle, and adjusting downward decreases it; reject outside the aiming phase |
| M4 Power control | `adjustPower`, `dragPower`, real power-control input | `aim.power`, `aim.previewRevision`, `projectile.lastPathSample` | Adjusting upward increases power, and adjusting downward decreases it; retain the value after release; high and low power produce different subsequent flight trends |
| M5 Firing and trajectory | `fire`, followed by `waitForSettled` | `phase`, `projectile.active`, `projectile.lastPathSample`, `projectile.gravityTrend`, `ammo.playerCount/opponentCount` | Takes effect only during the aiming phase; locks input after firing; flight is affected by direction, power, and gravity |
| M6 Terrain destruction and grounding | In an aiming scenario, `fire` hits terrain or the effect ends | `terrain.revision`, `terrain.lastImpact`, `terrain.tankSurfaceEnvelope`, `effects.explosionRevision`, `tanks.*.onTerrain` | The terrain summary changes; tanks ultimately remain grounded and in bounds, consistent with the visible terrain-surface envelope |
| M7 Hit scoring | In an aiming scenario, cause a valid hit through aiming and `fire` | `scores`, `effects.damageRevision`, `effects.scoreRevision`, `terrain.lastImpact` | A valid hit increases the attacking side's score; ineffective/self-damaging paths do not increase the score for attacking the opponent; scores are nonnegative |
| M8 Limited movement | `move(left|right)` | The current side's corresponding `tanks.player/opponent.screenX`, `movement.remaining`, `movement.blockedReason` | Left and right produce opposite screen displacement; valid movement deducts a move; boundary/no-moves rejection does not incorrectly deduct resources |
| M9 Turn control and locking | `fire`, input during flight, `waitForSettled` | `phase`, `controlLock`, `turn.currentSide`, `canInteractWithPlayfield` | The projectile cannot be altered during flight/effect; a legal turn advances only after it ends |
| M10 AI/two-player opponent | Wait after single-player `fire`, or alternate in local two-player | `currentSide`, `turn.canAct`, `effects.worldMotionRevision`, `projectile.lastHorizontalDirection` | The single-player opponent acts automatically while player input is locked; the other side can be operated manually in local two-player |
| M11 Practice mode | `startMode(practice)`, repeated `fire` + `waitForSettled` | `mode=practice`, `phase=aiming`, `ammo.currentWeaponId`, `canInteractWithPlayfield` | Returns to player control after the effect ends; not interrupted by AI or standard results |
| M12 Results and return | From `endgame_low_ammo_ready`, continue legal `fire` and `waitForSettled`, followed by `restart`, `returnToMenu` | `phase=result`, `result`, `visible.resultLayerVisible`, `controls.restart/returnToMenu` | The terminal state must be triggered naturally by the ammunition exhaustion rules; input is locked in the terminal state; restart/return clears old projectile/effects/ammo/scores |
| M13 P1 weapon distinction | After `selectWeapon` for a standard/heavy category, `fire` | `ammo.currentWeaponCategory`, `terrain.revision`, `effects.explosionRevision`, `scores` | Both weapon types have consumption and visible effects; the heavy category produces a trend toward a stronger explosion or terrain impact |
| M13 P2 special-weapon depth | After `selectWeapon` for a special category, `fire` | `ammo.currentWeaponCategory=special`, `projectile.count`, `effects.*Revision` | If a special category is implemented, it must reflect consumption, a unique visible effect, and the possibility of being wasted |
| M14 Supplemental presentation | `openPanel(ammoLibrary|info|updates)`, leaderboard-related entry points after single-player results | `screen/activePanel`, `overlayBlocking`, `visible.resultLayerVisible` | Supplemental panels do not break the core loop; practice/local do not submit standard leaderboard results |

## Valid Assertion Examples

- After `loadScenario("practice_aiming_ready")`, execute `adjustAngle(up)`; `aim.angle` increases, and `aim.previewRevision` or the barrel-angle summary changes.
- Move left and right separately in the same aiming scenario; the direction of change in the current tank's `screenX` is opposite, and valid movement reduces `movement.remaining`.
- After moving in the same aiming scenario, the current tank remains within `visible.playfieldBounds`; if `onTerrain=true`, the corresponding `terrain.tankSurfaceEnvelope` must show the bottom of the tank aligned with the visible terrain surface.
- In `single_player_aiming_ready`, execute `fire`; the snapshot enters the flight/effect phase and inventory decreases; subsequently executing `adjustPower(up)` is rejected or leaves the state unchanged.
- In `post_fire_lock_window`, execute `waitForSettled`; the snapshot enters an opponent turn, player turn, player-controllable practice state, or results, and cannot remain indefinitely in the active-projectile phase.
- In `player_no_moves_remaining`, execute `move(left)`; `movement.remaining` does not fall below zero, and the tank position does not become illegally out of bounds.

## Prohibited Items

- Must not require a fixed DOM id, CSS class, HTML structure, fixed canvas size, fixed coordinates, fixed font, fixed color, asset name, or source function name.
- Must not require a specific physics formula, core-loop order, rendering engine, collision algorithm, or private state structure.
- Must not directly set victory/defeat, scores, damage, hits, explosions, ammunition deduction, terrain destruction, successful AI firing, or leaderboard submission through a scenario or action.
- Must not determine that a core mechanic passes using only static text, button presence, increasing frame counts, fixed pixels, or `{ ok: true }`.
- Must not allow `waitForSettled` to skip the rule chain; it can only wait for flight, effects, AI, or results already triggered by a player-level action to stabilize naturally.
