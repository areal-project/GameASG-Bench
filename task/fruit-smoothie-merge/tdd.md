# Fruit Smoothie Merge TDD

## Public Testing Contract

The implementation must expose a public interface with player-level semantics:

This file defines only the public testable contract: player-level actions, valid scenarios, a stable snapshot summary, candidate field values, rejections/invariants, and externally visible postconditions. Gameplay requirements are governed by `game-spec.md`; this file does not prescribe source structure, private functions/variables, DOM/CSS structure, fixed coordinates/copy/colors/assets, rendering technology, main-loop order, or a specific merge algorithm.

```javascript
window.__gameTest = {
  reset(): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot,
  loadScenario(name): Snapshot
}
```

These interfaces constitute the testable contract, not an internal structure requirement. Real UI input must drive the same game state and visible results; the public interface may express only large-scale actions understandable to the player or valid prerequisite states, and cannot directly set the score, set win/loss states, write internal objects, or skip the core rule chain.

## Snapshot Schema

`Snapshot` must be a stable summary containing at least:

```javascript
{
  phase: "loading" | "playing" | "aiming" | "cooldown" | "danger" | "blending" | "result",
  screen: "loading" | "play" | "result",
  score: number,
  displayedScore: number,
  result: { visible: boolean, kind: "none" | "empty" | "smoothie", finalScore: number },
  ui: {
    overlayBlocking: boolean,
    canInteractWithPlayfield: boolean,
    playfieldBounds: { x: number, y: number, width: number, height: number },
    restartAvailable: boolean,
    restartButton: null | { screenX: number, screenY: number, enabled: boolean },
    blendButton: null | { screenX: number, screenY: number, enabled: boolean }
  },
  drop: {
    canDrop: boolean,
    cooldownMsRemaining: number,
    currentTier: number,
    nextTier: number,
    allowedTierMin: number,
    allowedTierMax: number
  },
  aim: {
    visible: boolean,
    screenX: number,
    screenY: number,
    worldX: number,
    worldZ: number,
    insidePlayfield: boolean
  },
  fruits: {
    count: number,
    byTier: Record<string, number>,
    highestTier: number,
    tierCount: number,
    totalTierMass: number,
    visible: Array<{ id: string, tier: number, screenX: number, screenY: number, settled: boolean }>
  },
  danger: { lineVisible: boolean, warningVisible: boolean, timeAboveMs: number },
  blender: {
    state: "idle" | "buttonPressed" | "capping" | "blending" | "pouring" | "drinking" | "throwing" | "done",
    liquidLevel: number,
    blendedFruitCount: number,
    cupVisible: boolean
  },
  feedback: {
    lastDropRevision: number,
    mergeRevision: number,
    comboCount: number,
    visualRevision: number,
    soundRevision: number,
    hintVisible: boolean,
    leaderboard: { visible: boolean, status: "none" | "loading" | "entries" | "empty" | "unavailable", entryCount: number }
  }
}
```

Fields may be extended, but the semantics above must not be omitted. `screenX/screenY` are CSS pixel coordinates used for real input and screen-direction verification.

## Action Schema

`window.__gameTest.input(action)` supports the following player-level actions:

- `{ type: "pointerDown", screenX, screenY }`: Equivalent to the player pressing in the main scene.
- `{ type: "pointerMove", screenX, screenY }`: Equivalent to the player dragging the pointer; effective only while aiming.
- `{ type: "pointerUp", screenX, screenY }`: Equivalent to release; if valid and dropping is allowed, generates a fruit.
- `{ type: "dropAt", screenX, screenY }`: Shortcut player action semantically equivalent to pressing and releasing at that point.
- `{ type: "pressBlender" }`: Equivalent to clicking the visible blend button.
- `{ type: "restart" }`: Equivalent to the player clicking restart/play again.
- `{ type: "wait", ms }`: Advances game time to wait for physics, merging, the danger line, or endgame animation.

Invalid actions must be rejected without throwing an exception and return the current `Snapshot` with an `ok:false` or `lastError` summary. Typical invalid input includes an unknown `type`, missing coordinates, coordinates outside the playable area, normal dropping after the endgame, repeated dropping during cooldown, and direct merging in an empty scene.

## Valid loadScenario Prerequisites

`loadScenario(name)` may construct only valid prerequisite states and cannot directly grant a win, add points, create a post-merge state, or produce an endgame result.

- `emptyCup`: Clear all fruits, set the score to 0, and remain in playing; usable for empty-jar rejection and empty-jar blending.
- `twoMatchingFruits`: The jar already contains two matching low-tier fruits that are close but have not yet merged; the score has not been increased in advance for this test. A subsequent wait or drop must trigger the merge.
- `mixedNonMatchingFruits`: The jar already contains fruits of different tiers that are touching or close but cannot merge; used for a rejection path.
- `maxTierPair`: The jar already contains two highest-tier fruits that are touching or close but cannot be upgraded further; used for the highest-tier rejection path.
- `nearDangerStack`: The jar contains a settled stack, with existing fruit near or slightly above the danger line but not yet in the endgame; only a subsequent wait triggers the warning/endgame.
- `oneFruitReadyToBlend`: The jar contains at least one valid fruit, is in playing, and the blend button has not yet been pressed; only a subsequent button press starts the endgame flow.

After any scenario is loaded, `result.visible` must be false, `phase` must not be `result`, and the reward being verified by the test must not have been increased in advance.

## DOM/HUD/Canvas/WebGL Postconditions

- The page must have a player-visible main playfield; it may be Canvas/WebGL or an equivalent 3D container. Its geometry must be readable through `Snapshot.ui.playfieldBounds`.
- When `phase` is `playing` or `aiming`, `ui.overlayBlocking` must be false and `ui.canInteractWithPlayfield` must be true.
- The score HUD or equivalent visible text must update in sync after `score` changes; animated increments are allowed, but the displayed score should eventually approach the actual score.
- The main scene must be non-empty and readable after loading is complete; after a real drop, merge, blend, or endgame action, `feedback.visualRevision` or the visible visuals should change.
- When the results layer is displayed, it must block normal dropping and provide a real clickable restart entry point.
- Both mouse and touch are real player input paths. Touch-drag release should produce aiming and dropping results equivalent to mouse-drag release.
- After the endgame or blending flow starts, normal drop input must be rejected and cannot increase the fruit count, score, or drop revision.
- Active blending with an empty jar must complete an empty-jar result or lightweight endgame feedback and eventually allow restarting; it must not generate false fruits or a false high score.
- The idle hint and leaderboard/placeholder information must be readable through a stable summary or visible interface; they must not obscure or prevent normal restarting.

## Behavioral Trajectory Contract

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Start and enter playable state | M1 | Open by default | Wait for loading | `phase=playing`, main scene non-empty, overlay does not block | No fatal error |
| Drag direction | M2 | reset | Drag left/right without releasing, or reset after releasing | `aim.screenX` follows the screen's left/right direction, `visualRevision` or the drop point visibly changes | Left/right directions are not reversed |
| Drop fruit | M3 | reset | Perform a real drag and release | `fruits.count` increases, `lastDropRevision` increases, next fruit updates | Drop point is inside the jar |
| Touch drop | M2/M3 | reset | Perform a real touch drag and release | Consistent with a mouse drop; fruit count or drop revision increases, and the visuals change | Does not depend on mouse-only events |
| Same-tier merge scoring | M4/M5 | `twoMatchingFruits` | Wait or nudge lightly to trigger a collision | Fruit count relationship changes from 2 to 1 or `mergeRevision` increases, score increases | Total tier mass is conserved according to the merge rules |
| Danger-line failure | M6 | `nearDangerStack` | Wait beyond the danger threshold | After a warning appears, enter `blending` or `result` | A short wait should not jump directly to the result |
| Active blending | M7/M8 | `oneFruitReadyToBlend` | Click the visible button or `pressBlender` | Normal dropping is locked, blender.state advances, fruits decrease/liquid increases, and the result eventually becomes visible | An empty jar does not crash |
| Empty-jar blending | M7/M8 | `emptyCup` | Click the visible button or wait after `pressBlender` | Enter an empty-jar result or lightweight endgame feedback; the final score remains 0 or near 0, and restarting is available | Does not generate fruits, crash, or block restarting |
| Endgame lock | M7/M9 | Start blending after `oneFruitReadyToBlend` | Attempt normal dropping again | Fruit count, score, and drop revision do not increase due to normal dropping | The endgame flow continues to advance |
| Restart | M9 | Enter result or a game state containing fruits | Click restart for real or use `restart` | Score resets to zero, fruits are cleared, result hides, and interactivity is restored | Previous liquid/danger/endgame lock is cleared |
| Non-merge rejection | M4/M5 | `mixedNonMatchingFruits` or `maxTierPair` | Wait for contact | Score, merge revision, and tier relationships do not undergo a valid merge change | Physics movement may occur, but false merging cannot occur |
| Leaderboard and hint | M10 | Endgame or inactivity | Wait/first interaction | The results layer has a leaderboard or placeholder, and the idle hint appears then hides after interaction | Offline failure does not block restarting, and the hint does not block gameplay |

## Feature-to-Interface Mapping

- M1: `reset()`, `getSnapshot()`, main playfield geometry, non-empty visuals.
- M2: Real pointer/mouse/touch events, `input(pointerDown|pointerMove|pointerUp)`, `aim.screenX/screenY`.
- M3: Real release, `input(dropAt)`, `fruits.count`, `drop.canDrop`, `feedback.lastDropRevision`.
- M4/M5: `loadScenario(twoMatchingFruits)`, `input(wait)`, `fruits.byTier`, `score`, `feedback.mergeRevision`.
- M6: `loadScenario(nearDangerStack)`, `input(wait)`, `danger.warningVisible`, `phase`.
- M7/M8: Real click on `ui.blendButton` or `input(pressBlender)`, `blender.state`, `blender.liquidLevel`, `fruits.count`.
- M9: Real restart or `input(restart)`, `result.visible`, `score`, `fruits.count`.
- M10: `result.visible`, visible leaderboard/placeholder state, `feedback.soundRevision`, `feedback.hintVisible`.

## Prohibitions

- Do not use `loadScenario` to directly grant a win, directly add points, directly complete juicing, or directly submit to the leaderboard.
- Do not require fixed DOM structure, fixed copy, fixed colors, fixed canvas dimensions, a specific library, private variables, internal functions, or original asset names.
- Do not return only `{ ok: true }` without an observable state change.
- Do not separate the real input path from the public interface path: player actions and `__gameTest.input` must ultimately affect the same game state.
