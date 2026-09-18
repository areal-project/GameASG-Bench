# Grow a Fish TDD

## Objective

This TDD defines the public testable contract that the generated version must expose. The implementation may freely organize the UI, rendering, and data, but it must make real player input and the player-level high-level `window.__gameTest` interface drive the same game state and synchronize it with the HUD, result overlay, and main water area.

## Public Interface

The following must be provided:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

### reset(options?)

Semantics:

- With no arguments, returns to the default menu or the starting point of the first level and clears the result overlay, failure overlay, temporary particles, and input state.
- `options.startPlaying === true` may directly enter the starting point of a legal level; this is only for setup and cannot grant score, level completion, or predation results.
- `options.level` may specify an unlocked level index or an index permitted by the test environment; an illegal level must be rejected or fall back to a legal level.

Postconditions:

- Returns a Snapshot.
- The HUD, menu/overlay, and main water area must be consistent with the Snapshot's `phase`, `ui.overlayBlocking`, and `ui.canInteractWithPlayfield`.

### getSnapshot()

Returns the current stable summary without exposing the internal object graph. See Snapshot Schema for fields.

### input(action)

Executes a player-level action. This interface must not directly set victory, failure, score, size, or lives; each action must be equivalent to a high-level action that the player can perform and must drive the real UI/visual state.

Legal action schema:

| Action | Required fields | Semantics |
|---|---|---|
| `{type:"start"}` | none | Equivalent to clicking start; enters the first level |
| `{type:"selectLevel", level}` | `level:number` | Attempts to enter a level from the level menu |
| `{type:"move", direction, durationMs?}` | `direction:"left"|"right"|"up"|"down"` | Equivalent to keyboard/joystick directional movement |
| `{type:"pointerMove", screenX, screenY, durationMs?}` | normalized `0..1` screen coordinates | Equivalent to mouse or touch movement toward a proportional point on the screen |
| `{type:"touchJoystick", direction, durationMs?}` | direction enum | Equivalent to dragging the virtual joystick |
| `{type:"moveToVisibleFish", targetId}` | `targetId:string` | Equivalent to the player swimming toward a currently visible fish and attempting contact |
| `{type:"eatTarget", targetId?}` | optional visible target id | The player moves to an edible target and triggers a collision |
| `{type:"approachDanger", targetId?}` | optional visible target id | The player moves onto a dangerous attack path |
| `{type:"nextLevel"}` | none | Enters the next level from the level-complete overlay |
| `{type:"retry"}` | none | Retries the current level from the failure overlay |
| `{type:"pause"}` | none | P2; if pause is implemented, enters the pause overlay |
| `{type:"resume"}` | none | P2; returns from pause to playing |

Illegal action:

- Unknown `type`.
- Illegal direction.
- Non-numeric or out-of-range `level`.
- Performing predation/danger contact in the menu.
- Continuing to move, prey, or take damage while in level-complete or failure states.
- Performing a predation action on a clearly larger fish.
- Performing a damage action from a non-attacking side of a dangerous fish or without reaching biting distance.

An illegal action must return a Snapshot or equivalent result containing `ok:false` or `rejected:true` and leave the core state unchanged.

### loadScenario(name, options?)

May only construct a legal precondition state and cannot directly grant victory, add score, complete predation, exhaust lives, or complete unlocking.

Required scenario names:

| Scenario | Legal precondition | Forbidden shortcut |
|---|---|---|
| `edible_near_player` | playing, with 1 edible fish near the player that has not yet been eaten | Must not increase size or remove the fish in advance |
| `danger_near_player` | playing, with 1 larger dangerous fish near the player and lives greater than 0 | Must not deduct a life or enter failure in advance |
| `danger_wrong_side` | playing, with 1 larger dangerous fish near the player, but the player is on a non-biting side or at a safe distance | Must not deduct a life in advance or turn the dangerous fish into an edible target |
| `oversized_near_player` | playing, with 1 clearly larger fish near the player that can be touched but is not currently edible | Must not increase size or remove the fish in advance |
| `post_hit_invulnerable` | playing or respawning, with the player having just taken one hit and being in a brief protected state, and a dangerous fish nearby | Must not enter failure or deduct a second life in advance |
| `near_level_complete` | playing, with the player below the target and an edible fish nearby that will reach the target when eaten | Must not show the level-complete overlay in advance |
| `one_life_danger` | playing, with 1 life and a dangerous fish nearby | Must not enter failure in advance |
| `locked_level_menu` | menu, with at least one visible locked level | Must not start the locked level |
| `wide_level_boundary` | playing, with the player near a level boundary but still within bounds | Must not place the player out of bounds |

## Snapshot Schema

```typescript
type Snapshot = {
  ok?: boolean,
  rejected?: boolean,
  reason?: string,
  phase: "menu"|"playing"|"respawning"|"paused"|"levelComplete"|"gameOver",
  screen: "menu"|"play"|"pause"|"result",
  level: {
    index: number,
    count: number,
    unlockedCount: number,
    targetSize: number,
    startSize: number,
    width: number,
    height: number,
    danger: "passive"|"normal"|"aggressive"|string
  },
  player: {
    size: number,
    lives: number,
    maxLives: number,
    worldX: number,
    worldY: number,
    screenX: number,
    screenY: number,
    facing: "left"|"right"|"up"|"down"|string,
    invulnerable: boolean,
    respawning?: boolean
  },
  progress: {
    growthPercent: number,
    levelComplete: boolean,
    stars?: number,
    allComplete?: boolean
  },
  entities: {
    edibleCount: number,
    dangerousCount: number,
    totalFish: number,
    visibleFish: Array<{
      id: string,
      role: "edible"|"dangerous"|"neutral",
      size: number,
      screenX: number,
      screenY: number,
      canEat?: boolean,
      canDamagePlayer?: boolean,
      approachPoint?: { screenX: number, screenY: number },
      safeApproachPoint?: { screenX: number, screenY: number },
      bounds?: { left: number, top: number, width: number, height: number }
    }>
  },
  ui: {
    hudVisible: boolean,
    overlayBlocking: boolean,
    canInteractWithPlayfield: boolean,
    menuVisible: boolean,
    resultVisible: boolean,
    gameOverVisible: boolean,
    controls: {
      start: boolean,
      retry: boolean,
      nextLevel: boolean,
      joystick: boolean,
      joystickBounds?: { left: number, top: number, width: number, height: number },
      joystickActive?: boolean,
      joystickDirection?: "left"|"right"|"up"|"down"|"neutral"|string
    }
  },
  feedback: {
    eatRevision: number,
    hitRevision: number,
    respawnRevision?: number,
    levelCompleteRevision: number,
    renderRevision: number,
    worldMotionRevision: number
  },
  playfield: {
    bounds: { left: number, top: number, width: number, height: number },
    readable: boolean,
    nonBlank: boolean
  }
}
```

Schema invariants:

- `level.count >= 20`.
- `0 <= progress.growthPercent <= 100`.
- `0 <= player.lives <= player.maxLives`.
- `entities.totalFish >= entities.edibleCount + entities.dangerousCount`.
- `player.screenX/screenY` must summarize the player's screen position in the current viewport; directional checks use this field and changes in the real view as their basis.
- `entities.visibleFish` should contain player-level summaries of the interactive fish currently on screen; `role/canEat/canDamagePlayer` conveys edible/dangerous semantics that the player can see or infer, while `approachPoint` and `safeApproachPoint` are screen-space target points used for player input and must not expose the internal object graph.
- When present, `ui.controls.joystickBounds` represents the visible joystick's touchable area; dragging in opposite directions should change `joystickDirection` or the player's screen displacement.
- `ui.overlayBlocking === false` and `ui.canInteractWithPlayfield === true` are necessary conditions for playing to be operable.

## DOM / HUD / Canvas Postconditions

- The page must contain a visible main water area, which may be a canvas or an equivalent drawable playfield.
- `playfield.nonBlank` and `playfield.readable` should reflect whether readable content has been drawn in the main water area.
- The HUD may be freely designed, but it must let the user see core information among level, lives, size, or growth progress; this information must also be reflected in the Snapshot.
- Visible fish must let the player distinguish currently edible targets from dangerous/oversized targets; this may be conveyed through markers, size, color, numbers, or equivalent feedback, and `visibleFish.role/canEat/canDamagePlayer` in the Snapshot must be consistent with these player-visible semantics.
- The touch joystick may be freely designed, but it should be discoverable and triggerable during gameplay, and the player should be able to observe the drag direction; real touch dragging and the directional semantics of `input({type:"touchJoystick"})` should be consistent.
- The result and failure overlays may be freely designed, but while displayed they must block input to the main water area, and `ui.overlayBlocking` in the Snapshot must be true.
- Legal actions from `window.__gameTest.input` must drive the same HUD/visual state; changing only the Snapshot is not allowed.

## Behavior Trajectory Contract

| Trajectory | Covered M | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Start Gameplay | M1/M6/M9 | `reset()` | Actually click start or use `input({type:"start"})` | phase playing, HUD visible, overlay does not block, playfield readable | menu no longer blocks the main playfield |
| Keyboard Directional Movement | M2 | `reset({startPlaying:true})` | Actually press D, then actually press A; actually press W/S | `player.screenX/screenY` change in opposite directions, canvas/render revision changes | Player remains within level bounds |
| Mouse Following | M2 | playing | Actually move the mouse to the right/left side of the screen | Player moves toward the target side, facing or screenX changes | Result overlay is not visible |
| Touch Joystick Direction | M2 | `reset({startPlaying:true})` | Actually touch the joystick area, drag right and then left | `joystickDirection` or `player.screenX` shows results in opposite directions | After release, the joystick does not remain active; player remains within level bounds |
| Predation and Growth | M3/M10 | `loadScenario("edible_near_player")`, with an edible target screen point in the Snapshot | Use real mouse/touch or `input({type:"moveToVisibleFish", targetId})` to touch the target; `input({type:"eatTarget"})` may be used to verify the same rule | size/progress increases, edibleCount or totalFish changes, eatRevision increases | totalFish cannot surge from nowhere; dangerousCount should not be incorrectly cleared by eating a small fish |
| Oversized Target Rejection | M3/M4 | `loadScenario("oversized_near_player")` | Touch or use `input({type:"moveToVisibleFish", targetId})` to try to approach the oversized fish | Predation is rejected or size/progress remains unchanged, and the target does not disappear as an edible fish | Level/lives do not change due to rejection unless the dangerous bite conditions are also met |
| Danger Damage | M4 | `loadScenario("danger_near_player")` | Actually move to the dangerous fish's attack point or use `input({type:"approachDanger"})` to approach the dangerous fish | lives decreases, hitRevision increases, phase respawning or playing with invulnerable | lives is not negative; repeated dangerous contact during invulnerability does not continuously deduct lives |
| Safe-Side Danger Rejection | M4 | `loadScenario("danger_wrong_side")` | Approach from the safe side or at a safe distance | lives, size, and progress remain unchanged or action is rejected | Dangerous fish is not eaten; does not enter gameOver |
| Respawn Protection | M4/M8 | `loadScenario("post_hit_invulnerable")` or after taking damage with lives remaining | Approach the same type of dangerous fish again | lives does not decrease continuously; invulnerable/respawning or respawn feedback is observable | A second life deduction is not triggered before the protection state ends |
| One-Life Failure | M4/M8/M9 | `loadScenario("one_life_danger")` | Trigger dangerous contact | phase gameOver, gameOverVisible, overlayBlocking | After gameOver, move/catch action is rejected and state unchanged |
| Near Level Completion | M6/M7 | `loadScenario("near_level_complete")` | Eat the target fish | phase levelComplete, progress complete, nextLevel available, unlocked count increases or remains at maximum | Movement after level completion does not change player position or size |
| Retry | M8/M9 | gameOver | Actually click retry or use `input({type:"retry"})` | phase playing, lives reset, growthPercent returns near its initial value, gameOverVisible false | Old failure overlay does not block |
| Locked-Level Rejection | M6 | `loadScenario("locked_level_menu")` | `input({type:"selectLevel", level: locked})` or click the locked level | rejected or phase remains menu; unlockedCount unchanged | locked level does not start playing |
| Boundary Invariant | M2 | `loadScenario("wide_level_boundary")` | Continuously move beyond the boundary | Player coordinates are clamped within legal bounds | Lives, size, and level do not change from hitting the boundary |

## Feature-Interface Mapping

| M | Public action / snapshot fields |
|---|---|
| M1 | `reset`, `getSnapshot`, `playfield`, `ui`, `feedback.renderRevision` |
| M2 | `input(move)`, real key/mouse/touch, `player.screenX/screenY`, `player.worldX/worldY` |
| M3 | `loadScenario("edible_near_player")`, `loadScenario("oversized_near_player")`, `input(moveToVisibleFish/eatTarget)`, `progress`, `entities.visibleFish`, `feedback.eatRevision` |
| M4 | `loadScenario("danger_near_player")`, `loadScenario("danger_wrong_side")`, `loadScenario("post_hit_invulnerable")`, `input(approachDanger)`, `player.lives`, `player.invulnerable/respawning`, `feedback.hitRevision/respawnRevision` |
| M5 | `feedback.worldMotionRevision`, `entities.visibleFish` |
| M6 | `input(selectLevel)`, `level.unlockedCount`, `level.count` |
| M7 | `loadScenario("near_level_complete")`, `input(eatTarget)`, `progress.levelComplete`, `ui.controls.nextLevel` |
| M8 | `loadScenario("one_life_danger")`, `input(retry)`, `ui.gameOverVisible` |
| M9 | `ui.overlayBlocking`, `ui.canInteractWithPlayfield`, `ui.menuVisible`, `ui.resultVisible` |
| M10 | `feedback.eatRevision`, `feedback.hitRevision`, `feedback.levelCompleteRevision` |
| M11 | P2 optional: `reset({mode:"edit"})` may expose configuration preview, but ordinary checks do not require it |

## Prohibited Items

- Do not provide test interfaces that directly set score, directly set victory, directly clear the fish population, directly deduct lives, or directly unlock levels.
- `loadScenario` must not include the postcondition that the test is intended to prove.
- Snapshot must not return arbitrary internal object graphs or references to private arrays.
- Do not require a fixed DOM structure, fixed coordinates, fixed colors, fixed wording, fixed assets, or a specific rendering algorithm.
- P1/P2 behavior must be triggerable through player input or public high-level actions, with postconditions observable in the HUD/visuals/Snapshot.
