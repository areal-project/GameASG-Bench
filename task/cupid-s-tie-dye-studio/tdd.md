# Cupid Tie-Dye Studio TDD

## Public Testable Contract

The generated game must expose:

```javascript
window.__gameTest = {
  reset(options),
  input(action),
  getSnapshot(),
  loadScenario(name)
}
```

These methods are player-level major actions and stable summaries, and must not return the internal object graph. Each action must synchronously, or after a short delay, drive the real UI, HUD, canvas, or panel to the same state; it must not merely return `{ ok: true }`.

## Snapshot Schema

`getSnapshot()` and the other interfaces return:

```javascript
{
  ok: true,
  phase: "playing|menu|panel|revealing|blocked",
  activePanel: "none|menu|gallery|shop|settings|quests|achievements|help|confirm|revealSave",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  canvas: {
    width: number,
    height: number,
    visible: boolean,
    nonBlank: boolean,
    workRevision: number,
    workHash: string|number,
    dyedPixelEstimate: number,
    bounds: { x:number, y:number, width:number, height:number },
    safePaintPoint: { x:number, y:number }
  },
  selectedColor: string|null,
  paletteCount: number,
  selectedBrushSize: "small|medium|large",
  selectedDyeIntensity: "light|medium|strong",
  selectedTool: string,
  selectedStencil: string|null,
  availableToolCount: number,
  availableStencilCount: number,
  clothing: { currentId:string, currentLabel:string, index:number, count:number },
  history: { canUndo:boolean, canRedo:boolean, length:number },
  gallery: { count:number, max:number, hasThumbnails:boolean },
  economy: { hearts:number, saveReward:number },
  shop: { backgroundCount:number, unlockedCount:number, currentBackground:string, affordableLockedId:string|null, unaffordableLockedId:string|null, equippableUnlockedId:string|null, backgroundRevision:number },
  quests: { count:number, completedUnclaimed:number, claimedCount:number, progressedCount:number },
  achievements: { total:number, unlocked:number },
  settings: { particles:boolean, mascot:boolean, confirmClear:boolean, confirmSave:boolean, music:boolean },
  lastResult: { type:string|null, ok:boolean|null, reason:string|null }
}
```

## Action Schema

- `{ type:"selectColor", index:number }`: select a palette color. Reject an out-of-range value.
- `{ type:"selectBrushSize", size:"small|medium|large" }`: select a size. Reject an unknown value.
- `{ type:"selectDyeIntensity", intensity:"light|medium|strong" }`: select dye intensity. Reject an unknown value; a valid switch affects only subsequent drawing and must not immediately modify the design.
- `{ type:"selectTool", tool:string }`: select a pattern tool. Reject an unknown value.
- `{ type:"selectStencil", stencil:string|null }`: select a print or the normal brush. Reject an unknown print.
- `{ type:"paint", point?:{x,y}, path?:[{x,y}], inputKind?:"mouse|touch|contract" }`: equivalent to the player clicking or dragging within a safe area of the canvas. Reject normal tools when no color is selected; blending tools may be used without selecting a color. `inputKind:"mouse"` and `inputKind:"touch"` must produce the same type of design changes as real browser mouse/touch paths.
- `{ type:"undo" }`, `{ type:"redo" }`: history operations.
- `{ type:"clear", confirm?:boolean }`: clear. When confirmation is required, `confirm:false` or omission only opens/maintains the confirmation without modifying the design; only `confirm:true` clears it.
- `{ type:"cycleClothing", direction:-1|1 }` or `{ type:"selectClothing", index:number }`: switch clothing.
- `{ type:"openPanel", panel:"menu|gallery|shop|settings|quests|achievements|help" }`, `{ type:"closePanel" }`: panel flow.
- `{ type:"reveal" }`, `{ type:"saveDesign", confirm?:boolean }`, `{ type:"skipSave" }`: reveal and save flow. Confirming save awards `economy.saveReward` hearts; skipping save must not increase the gallery or hearts and should clear the current design to a state where creation can continue.
- `{ type:"buyBackground", id:string }`, `{ type:"equipBackground", id:string }`: shop behavior.
- `{ type:"toggleSetting", setting:string }`: toggle a setting.
- `{ type:"claimQuest", id:string }`: claim a completed quest.

An invalid action must return `{ ok:false, reason:string, snapshot }` or record the rejection reason in `lastResult`, and must not throw an exception.

## loadScenario

- `blankWorkbench`: a valid initial workbench with at least one selectable color and an undyed design.
- `paintedOnce`: a color has been selected and one drawing stroke completed, usable as a precondition for undo/redo; undo or save has not been performed in advance.
- `saveReady`: a saveable design exists and is before the reveal/save entry; the gallery or hearts have not been increased in advance.
- `clearConfirmReady`: a design exists and clear confirmation is enabled; the design has not been cleared in advance.
- `shopNoHearts`: the shop has at least one locked background and resources are 0; no purchase has been made in advance.
- `shopAffordable`: resources are sufficient to buy at least one locked background; no purchase has been made in advance.
- `backgroundEquippable`: at least one background is unlocked but not equipped; that background has not been equipped in advance.
- `questClaimable`: at least one quest is completed and unclaimed; its reward has not been granted in advance.
- `persistedProgress`: saved gallery, hearts, settings, or background progress exists; after loading, it is used to verify retained progress without performing a new reward or purchase in advance.

`loadScenario` may only construct a valid precondition state and must not directly set victory, granted rewards, completed purchases, gallery additions, or claimed quests as the result to be verified.

## Visible UI / HUD / Main-Screen Postconditions

- The main canvas or equivalent drawing surface must be visible, have dimensions greater than 0, and be provably non-blank through a screenshot or summary.
- Controls for colors, brushes, intensity, tools, stencils, undo, redo, clear, reveal, save, gallery, menu, close, shop, settings, backgrounds, and similar functions must be discoverable and triggerable by the player. Tests should discover controls through the public snapshot summary, accessible names, visible text, runtime geometry, or optional semantic attributes, without requiring a fixed DOM hierarchy, fixed `data-*` attributes, or fixed copy.
- After real mouse/touch drawing, at least one of the canvas image and `canvas.workRevision` must change, and `dyedPixelEstimate` in the HUD/summary must not decrease.
- While a panel is open, `overlayBlocking=true` and `canInteractWithPlayfield=false`; restore them after it is closed.
- After confirming save, `gallery.count` increases, `economy.hearts` increases by one positive reward, and a gallery thumbnail is visible. If the snapshot exposes `economy.saveReward`, it must be positive, and the increase in hearts should match that reward.
- After skipping save, `gallery.count` and `economy.hearts` remain unchanged, and the current design returns to the new-design state.
- After a successful shop purchase, resources decrease and the unlocked count increases; when resources are insufficient, both remain unchanged.
- After equipping an unlocked background, `shop.currentBackground` or `shop.backgroundRevision` must change, while resources and the unlocked count must not change.

## Behavioral Trajectory Contract

| Trajectory | Coverage M | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Launch Workbench | M1 | `reset()` | None | playing, non-blank canvas, colors and tools available | No exceptions; canvas is interactive |
| Real Drawing | M2 | `blankWorkbench` + real color click | Real mouse drag near the safe point | workRevision/workHash/dye estimate changes | Gallery and hearts unchanged |
| Real Touch Drawing | M2 | `blankWorkbench` + select color | Real touch drag near the safe point | workRevision/workHash/dye estimate changes | Gallery and hearts unchanged |
| Reject No Selected Color | M2 | `blankWorkbench` and selectedColor=null | `input({type:"paint"})` | ok false or lastResult reason | Design hash unchanged |
| Tool-Switch Drawing | M3 | `blankWorkbench` | selectBrushSize/selectDyeIntensity/selectTool/selectStencil, then paint | selectedBrushSize/selectedDyeIntensity/selectedTool/selectedStencil update, design changes | Unknown tool or intensity is rejected and the current selection remains unchanged |
| Undo and Redo | M4 | `paintedOnce` | undo -> redo | hash reverts, then is restored | History boundaries are not exceeded |
| Clear Confirmation | M4 | `clearConfirmReady` | clear(false) -> clear(true) | Canceling does not modify the design; after confirmation the design resets | Drawing is disabled while the confirmation dialog blocks interaction |
| Clothing Switching | M5 | `paintedOnce` | cycleClothing(1) | clothing index/id changes, design resets | clothing.count remains unchanged |
| Save to Gallery | M6 | `saveReady` | reveal -> saveDesign(confirm) | gallery +1, hearts increase by one positive reward, thumbnail visible | Save each design only once |
| Skip Save | M6 | `saveReady` | reveal -> skipSave | gallery and hearts unchanged, design resets | Skipping must not secretly grant a reward |
| Menu Blocking | M7 | playing | openPanel(menu) -> closePanel | blocking true -> false | Drawing does not modify the design while the panel is open |
| Shop Purchase | M8 | `shopAffordable` | buyBackground(id) | hearts deducted, unlocked +1 | The unlocked count does not exceed the total background count |
| Insufficient Resources | M8 | `shopNoHearts` | buyBackground(locked id) | Rejection feedback | totalBefore/totalAfter resources and unlocked set remain unchanged |
| Equip Background | M8 | `backgroundEquippable` | equipBackground(id) | currentBackground or backgroundRevision changes | hearts and unlockedCount unchanged |
| Claim Quest | M9 | `questClaimable` | claimQuest(id) | hearts increase, claimedCount increases | Repeated claims do not increase them again |
| Setting Toggle | M10 | playing | toggleSetting(setting) | Setting boolean value is inverted and saved | Design, gallery, hearts unchanged |
| Persistence Recovery | M11 | `persistedProgress` | reset({ preserveProgress:true }) | Gallery, hearts, background, or settings are restored | A normal restart must not retain overlays |

## Feature-Interface Mapping

- M1: `reset`, `getSnapshot`, canvas/HUD visibility.
- M2: real mouse/touch, `input(selectColor)`, `input(paint)`, canvas summary.
- M3: `input(selectBrushSize/selectDyeIntensity/selectTool/selectStencil/paint)`.
- M4: `input(undo/redo/clear)`.
- M5: `input(cycleClothing/selectClothing)`.
- M6: `input(reveal/saveDesign/skipSave/openPanel gallery)`.
- M7: `input(openPanel/closePanel)` and `overlayBlocking`.
- M8: `loadScenario(shopNoHearts/shopAffordable/backgroundEquippable)`, `input(buyBackground/equipBackground)`.
- M9: `loadScenario(questClaimable)`, `input(claimQuest)`.
- M10: `input(toggleSetting)`.
- M11: `loadScenario(persistedProgress)` and `reset({ preserveProgress:true })` can restore persistent fields; a normal `reset()` can clear transient panels.

## Prohibitions

Fixed coordinates, fixed colors, fixed copy, fixed DOM structure, internal variables, private functions, specific algorithms, or asset names must not be required. The public interface must not provide fine-grained cheat functions such as directly adding hearts, directly inserting items into the gallery, directly completing purchases, or directly claiming rewards.
