# ASMR Sparkle & Shine TDD

## Public Test Contract

The target game should expose a stable public contract object:

```javascript
window.__gameTest = {
  reset(options),
  input(action),
  getSnapshot(),
  loadScenario(name, options)
}
```

These methods express only player-level actions and observable summaries and do not expose internal object graphs, private functions, internal naming, or specific rendering algorithms. All methods return serializable objects; failures or rejections must return `ok:false` or `accepted:false` with a reason and should not throw exceptions.

## Action Schema

`reset(options)`:

- `options.phase`: optional, `menu|playing`. Enters the menu by default; `playing` may only start a valid new level.
- `options.levelIndex`: optional, the index of a valid unlocked level.
- `options.clearStorage`: optional, clear persistence before resetting.

`input(action)`:

- `{ type:"start" }`: enter a playable level from the menu.
- `{ type:"openLevelSelect" }`: P2/auxiliary action. If a visible level-selection entry point is implemented, open level selection; if no normal entry point is implemented, this may be rejected but must not affect the P1 main path.
- `{ type:"selectLevel", levelIndex:number }`: select an unlocked level; selecting a locked level must be rejected while leaving progress unchanged. Even if there is no visible level-selection UI, the public contract should cover the locked-level rejection invariant.
- `{ type:"backToMenu" }`: return to the menu from playing or results.
- `{ type:"nextLevel" }`: enter the next level from the results.
- `{ type:"replay" }`: replay the current level from the results.
- `{ type:"selectTool", tool:string }`: select a tool available in the current level.
- `{ type:"cleanStroke", points:[{x:number,y:number}], coordinate:"normalizedItem|screen" }`: equivalent to the player pressing on the item and dragging along a path. `normalizedItem` uses item-local coordinates from 0 to 1.
- `{ type:"pointerDown", x:number, y:number, coordinate:"screen" }`, `{ type:"pointerMove", ... }`, `{ type:"pointerUp" }`: optional actions equivalent to a real pointer sequence.
- `{ type:"rotate", direction:"left|right" }`: equivalent to the player rotating the item for viewing.
- `{ type:"claimDailyReward" }`: P2/optional action. It must be supported only when the target implementation makes daily challenges a visible feature; when not implemented, it should return an unsupported result with `accepted:false` or `ok:false` and must not silently add coins.
- `{ type:"setSettings", settings:{ dirtIntensity?, timerEnabled?, timeLimit?, background? } }`: P2/optional action. It may be rejected when normal settings are not implemented; if accepted, it must affect subsequent new levels.

Invalid actions include an unknown `type`, a nonexistent tool, a tool not in the current level, a locked level, out-of-range coordinates, next level/replay outside the results, claiming an incomplete daily challenge, and claiming an already claimed daily challenge again. Invalid actions must be rejected while leaving key state unchanged.

## Snapshot Schema

`getSnapshot()` and the `snapshot` in action results include at least:

```javascript
{
  ready: boolean,
  phase: "loading"|"menu"|"levelSelect"|"playing"|"complete",
  activePanel: "loading"|"menu"|"levelSelect"|"complete"|null,
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  screen: { width:number, height:number },
  canvas: {
    visible:boolean,
    readable:boolean,
    nonBlank:boolean,
    diverse:boolean,
    revision:number|string,
    bounds:{ left:number, top:number, width:number, height:number }
  },
  playfield: {
    bounds:{ left:number, top:number, width:number, height:number },
    itemBounds:{ left:number, top:number, width:number, height:number, centerX:number, centerY:number },
    itemRotationDegrees:number,
    visualRevision:number|string
  },
  level: {
    index:number,
    count:number,
    unlockedCount:number,
    completedCount:number,
    currentId:string,
    materialType:string,
    dirtType:string,
    toolSequence:string[],
    locked:boolean
  },
  tools: {
    available:string[],
    selected:string|null,
    enabled:string[],
    visibleCount:number
  },
  surface: {
    cleanliness:number,
    dirt:number,
    prepared:number,
    residue:number,
    wetness:number,
    cleanCoverage:number
  },
  economy: {
    coins:number,
    totalEarned:number,
    lastReward:number
  },
  result: {
    status:"none"|"complete",
    stars:number,
    finalCleanliness:number,
    elapsedSeconds:number,
    baseReward:number,
    speedBonus:number,
    perfectBonus:number,
    firstTimeBonus:number,
    totalReward:number,
    nextLevelAvailable:boolean
  },
  progress: {
    unlockedLevelIds:string[],
    completedLevelIds:string[],
    levelStars:Record<string, number>,
    stats:{ totalItemsCleaned:number, perfectCleans:number, fastestClean:number }
  },
  daily?: {
    available:boolean,
    completed:boolean,
    claimed:boolean,
    progress:number,
    target:number,
    reward:number
  },
  achievements?: {
    unlockedCount:number,
    pendingVisible:boolean
  },
  settings?: {
    dirtIntensity:number,
    timerEnabled:boolean,
    timeLimit:number,
    background:string
  }
}
```

### Snapshot Semantics

- `surface.cleanliness` ranges from 0 to 1 and corresponds to the HUD percentage.
- `surface.dirt + surface.residue + surface.wetness` is a summary of the remaining surface burden; a valid cleaning chain should cause this total to decrease, or cause the preparation state to rise first and then fall.
- To distinguish genuine spatial coverage from button-based progress, `surface` should provide coarse local-coverage evidence such as `coverageCells`, `changedCells`, `dirtyCells`, or an equivalent summary; if no cell array is provided, drags along consecutive different paths must still produce distinguishable changes in `playfield.visualRevision`, the HUD, and canvas pixels.
- `canvas.revision` and `playfield.visualRevision` change after a real visual change; they cannot change indefinitely merely because time naturally passes.
- `overlayBlocking === false` and `canInteractWithPlayfield === true` are necessary conditions of the playable state.
- `itemRotationDegrees` is a summary of the item rotation angle visible to the player; left/right actions must produce changes with opposite signs.
- After `result.status === "complete"`, cleaning input must no longer change rewards, cleanliness, or completion state.

## Semantic UI / HUD Contract

To support real player paths, the game should make the player semantics of its main controls discoverable. Clearly visible button text, accessibility labels, stable semantic markers, or control-position summaries provided by the public contract may be used. The layout and interface structure are flexible, but player actions for start, tools, rotation, return, replay, and next level must be externally locatable and triggerable in a stable manner.

- The main menu start control must be visible and triggerable.
- State-flow controls for return to menu, next level, replay, return from results, and others must be visible and triggerable in the corresponding state.
- Left-rotation and right-rotation controls must be distinguishable and produce visible rotation in opposite directions.
- Tool buttons must express the corresponding tool semantics, and only the tools needed for the current level may be shown or enabled.
- The canvas or cleaning area must have visible geometry, and the public summary should provide the item's screen area.
- The HUD must express coins, cleanliness, time, and results rewards; these may be observed through page-visible information or the snapshot.

## Load Scenarios

`loadScenario(name, options)` may only construct valid prerequisite states and must not directly grant victory, points, kills, level completion, or bypass the core rule chain.

- `fresh-first-level`: a new session at the menu or the first unlocked level, with cleanliness near 0 and not complete.
- `prepared-first-level`: the first level has been partially covered using a valid preparation tool, but there are no results and no rewards.
- `near-complete-needs-dry`: the level has been validly cleaned to near completion but still has wetness or residue, requiring a final drying/wiping action to trigger completion.
- `locked-level`: at least one locked level exists and can be used to verify locked-level rejection.
- `phone-like-two-step`: a screen/fingerprint level is unlocked and at a new session, and allows completion only through the foam/soft-cloth chain.
- `keyboard-dry-clean`: a keyboard/debris level is unlocked and at a new session; the core chain should center on hot air/blowing away and wiping with a soft cloth, without requiring a water rinse.
- `wood-polish-chain`: a wood/dust level is unlocked and at a new session; the core chain should center on dusting, conditioner, and polishing, without completing through wet washing.
- `near-threshold-pointer-down`: the level has been validly cleaned to near completion and the pointer remains held down; results must not yet have appeared, and only a subsequent `pointerUp` followed by a wait may enter completion.
- `daily-claimable`: P2 optional scenario. Supported only when a visible daily-challenge feature is implemented; indicates that the daily challenge is complete but unclaimed and its reward has not yet been added to the coins.
- `daily-incomplete`: P2 optional scenario. Supported only when a visible daily-challenge feature is implemented; indicates that the daily challenge is incomplete.
- `completed-first-level`: the first level has been completed once and the next level is unlocked, for verifying replay and that the first-completion bonus does not repeat.

After each scenario is loaded, it must satisfy the "prerequisite-state review": `result.status` is `none`, and except for scenarios specifically intended for claiming a daily reward, it must not already contain the reward result that is about to be verified.

## Behavior Trajectories

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Enter playable state from menu | M1/M2 | `reset({phase:"menu"})` | Actually click start | `phase=playing`, overlay does not block, canvas is non-empty, toolbar is visible | Coins do not change due to starting |
| Real drag cleaning | M3/M4 | `fresh-first-level` | Actually click the first tool and drag within `itemBounds` | Cleaning/preparation/visual revision increases, the canvas changes, and the selected tool is synchronized | An equivalent drag outside the area does not change the core surface burden |
| Complete the full tool chain | M5/M6/M7 | `fresh-first-level` | Select each tool according to `toolSequence` and cover the item, then finally release and wait | `phase=complete`, star ratings and rewards are displayed, coins increase, and the next level unlocks | First completion is added only once; no results before reaching the threshold |
| Wrong-stage rejection | M5 | `fresh-first-level` or a special-material scenario | Select a tool that does not belong to the current stage or current level and drag | The action is rejected, or surface burden/rewards/results remain unchanged | The wrong tool cannot bypass the preparation, rinsing, drying, or polishing chain |
| No results while held; results after release | M6 | `near-threshold-pointer-down` | Read the state first, then `pointerUp` and wait | Still playing while the pointer is down; enters complete after release | No rewards or unlocks before release |
| Rotation direction | M9 | `fresh-first-level` | Rotate right, then left | The angle changes in opposite directions and returns close to the start | Rotation does not change coins, cleanliness, or unlocks |
| Real results buttons | M8 | Complete the current level | Click the visible replay, next level, or menu/return button | Replay resets dirt; next level increments the index; menu hides the gameplay layer | The old results layer does not block the new session |
| Locked-level rejection | M8/M11 | `locked-level` | Attempt to select a locked level | `accepted=false`, and the level, coins, and completed list remain unchanged | Unlocking cannot be obtained by selecting a locked level |
| Special-material chains | M12 | `phone-like-two-step`, `keyboard-dry-clean`, `wood-polish-chain` | Clean with the tool chain allowed by the scenario and try an incorrect wet wash/incorrect generic chain | The correct chain advances; the incorrect chain does not directly complete or add a significant reward | Special materials cannot degrade into the same wet-washing chain |
| Optional daily/settings/persistence | M13/M14 | Only when the snapshot declares available or the action is accepted | Perform claim, settings, or restore | If accepted, there must be a corresponding observable effect; if unsupported, it must be explicitly rejected without changing resources | When unsupported, it cannot silently succeed or add money |

## Function To Contract Mapping

- Start/menu/level flow -> `input(start|selectLevel|backToMenu|nextLevel|replay)` plus semantic UI controls; `openLevelSelect` is used as a UI path only when a P2 visible entry point exists.
- Tool selection -> `input(selectTool)` plus real visible tool buttons and `tools.selected`.
- Cleaning strokes -> `input(cleanStroke)` for contract; real mouse/touch drag for behavior; output is `surface`, HUD and canvas revision.
- Rotation -> `input(rotate)` plus real keyboard/buttons; output is `playfield.itemRotationDegrees`.
- Rewards/progression -> `result`, `economy`, `progress`.
- Special material depth -> `loadScenario(phone-like-two-step|keyboard-dry-clean|wood-polish-chain)` plus `level.materialType`, `level.dirtType`, `toolSequence`, `surface`.
- Optional daily/achievements/settings/persistence -> `daily`, `achievements`, `settings`, `progress`; when visible features are not implemented, related actions should be explicitly rejected and cannot be treated as a mandatory P1/P2 normal path.

## Rejection And Postconditions

- Unknown action, invalid coordinates, unavailable tools, locked levels and invalid phase transitions return rejection without throwing.
- Rejected action must keep `coins`, `completedLevelIds`, `unlockedLevelIds`, `result.status`, `surface.cleanliness` and `playfield.visualRevision` unchanged unless the action is explicitly a harmless UI close/open.
- UI/HUD must agree with snapshot for phase, cleanliness, coins and result status.
- Canvas must remain visible and readable in `playing`; after a meaningful real drag, canvas or visual revision must change due to the input.
- In `complete`, further clean strokes are rejected or ignored and reward totals remain unchanged.
