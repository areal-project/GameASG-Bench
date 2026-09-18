# Infinite Charms TDD

## Public Testable Contract

It is recommended to expose the following public high-level interface:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  input(action): ActionResult,
  getSnapshot(): Snapshot,
  loadScenario(name): Snapshot
}
```

These interfaces express only player-level actions and stable summaries; they do not expose the internal object graph. The real UI must remain operable; the interfaces cannot replace mouse, touch, keyboard, and visible controls.

## Snapshot Schema

`Snapshot` should include at least:

- `phase`: `"loading" | "editing"`.
- `screen`: `"creator"` or an equivalent identifier for the creation interface.
- `activePanel`: `"none" | "settings" | "color" | "adjust"`.
- `overlayBlocking`: boolean, whether there is a visible layer blocking the main creation area.
- `canInteractWithPlayfield`: boolean, whether the character preview and panel are usable.
- `canvas`: `{ present, nonBlank, width, height, revision }`. `revision` increments or changes after a visible change occurs in the preview.
- `activeCategory`: current category semantics, for example `"hair" | "eyes" | "mouth" | "nose" | "accessories" | "skin" | "base" | "blush" | "eyebrows" | "facialMarks"`.
- `activeSubMode`: `"styles" | "colors" | "none"`.
- `categories`: category summary array, with each item containing `{ id, optionCount, selectedOptionId? }`. id is a semantic category name and does not need to match any resource filename.
- `character`: current character summary:
  - `baseType`
  - `skinTone`
  - `hairStyle`
  - `hairColor`
  - `hairColorIntensity`
  - `eyeStyle`
  - `eyeColor`
  - `eyeColorIntensity`
  - `mouthStyle`
  - `noseStyle`
  - `accessories`
  - `decorations`, which may contain semantic slots such as blush/eyebrows/facialMarks.
- `adjustable`: current adjustable-part summary: `{ target, position: { screenX, screenY, offsetX, offsetY }, scale, canDrag, minScale, maxScale }`. `screenX/screenY` must be the screen-direction position seen by the player.
- `ui`: `{ settingsOpen, colorControlsVisible, adjustmentControlsVisible, randomAvailable, clearAvailable }`.
- `audio`: `{ soundEffectsEnabled, musicVolume }`.
- `lastAction`: `{ ok, type, reason? }`; invalid or rejected actions must have `ok:false` or leave the state unchanged.

## Action Schema

`window.__gameTest.input(action)` supports the following player-level actions:

- `{ type: "selectCategory", category }`
- `{ type: "selectSubMode", subMode }`
- `{ type: "selectOption", category, optionId? }`. When `optionId` is omitted, another valid option under the current category may be selected for contract checks.
- `{ type: "selectColor", category, colorId? }`. category allows only hair/eyes.
- `{ type: "setColorIntensity", category, value }`, with value in the range 0..1.
- `{ type: "toggleAccessory", optionId? }`
- `{ type: "clearAccessories" }`
- `{ type: "openSettings" }`, `{ type: "closeSettings" }`
- `{ type: "adjust", target, dx?, dy?, scaleDelta? }`. dx/dy are screen-direction offsets, with right/down positive.
- `{ type: "resetAdjustment", target }`
- `{ type: "randomize" }`
- `{ type: "clearAll" }`
- `{ type: "setSoundEffects", enabled }`
- `{ type: "setMusicVolume", value }`

Examples of invalid actions: unknown `type`, unknown `category`, setting a color for a non-color category, dragging a non-adjustable category, out-of-range intensity/volume, missing required fields, or non-numeric displacement or scaling. Invalid actions must not throw uncaught exceptions and must not change unrelated configuration.

## loadScenario Contract

`loadScenario(name)` can only construct valid prerequisite states:

- `"defaultCreator"`: basic creation state.
- `"hairColorReady"`: already in hairstyle color mode, without presetting the new color result that this check is intended to prove.
- `"accessorySelected"`: already has one accessory, making it convenient to verify removal, clearing, and dragging.
- `"adjustHair"`: the current category is hairstyle and the hairstyle is adjustable; the drag for this check has not yet been performed.
- `"settingsOpen"`: the settings panel is open, making it convenient to verify closing or audio configuration.

A scenario must not directly complete randomization, clearing, victory/defeat, rewards, or the target action of the current check.

## Visible Interface / HUD / Main View Postconditions

- The game must provide real clickable category controls, option controls, random controls, clear controls, and settings controls. Tests should discover controls through the public snapshot summary, accessible names, visible text, runtime geometry, or optional semantic attributes; a fixed DOM structure, fixed `data-*` attributes, or fixed wording is not required.
- After the fine-adjustment panel is opened, the current adjustable category must provide real triggerable horizontal, vertical, size, and reset controls, or equivalent operable sliders/step controls. After triggering move right/move left/move down/move up/scale up/scale down, `adjustable.position.screenX/screenY` or `adjustable.scale` must change according to screen semantics and be synchronized with the character preview; after triggering reset, position and size return near their defaults and editing can still continue.
- The character preview can be canvas, SVG, or DOM layers; if canvas is used, screenshots/pixel changes must be able to prove that it is non-empty and changes with dress-up operations.
- After a real category click, `Snapshot.activeCategory` must match the visible panel.
- After a real option click, at least one of the corresponding slot in `Snapshot.character`, `canvas.revision`, or visible preview evidence must change.
- When the settings panel is open, `overlayBlocking` must not prevent continuing to close it or view the preview.
- After clearing and randomization, `phase` remains editing.

## Behavioral Trajectory Contract

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Start and enter creation | M1 | Open the page | Wait for loading | phase editing, non-empty preview, interactive controls | overlayBlocking false |
| Select a part by category | M2/M3 | Default creation | Really click a category, then click a different option | activeCategory changes, slot or preview changes | Other unrelated slots are not cleared |
| Color and intensity | M4 | hairColorReady | Select a color, drag/set intensity | hairColor and intensity change, preview revision changes | intensity remains within 0..1 |
| Accessory toggle | M5 | Default creation | Enter accessories, click an accessory, then click again or clear | accessory count increases or decreases | totalBefore/totalAfter does not create a duplicate of the same item |
| Drag direction | M6 | adjustHair | Really drag right, then drag left | screenX changes in the positive/negative direction, preview changes | screenY does not substantially drift when no vertical input is provided |
| Size range | M7 | adjustHair | Scale up/down | scale changes in the corresponding direction and remains in range | scale is non-negative and not NaN |
| Fine-adjustment controls | M6/M7/M8 | adjustHair | Open the fine-adjustment panel and really trigger move right, move down, scale up, and reset | screenX/screenY/scale change according to screen semantics, return near defaults after reset, and the preview provides evidence of change | The panel does not permanently block; non-adjustable categories should not incorrectly modify adjustable parts |
| Settings panel | M8/M11 | Default creation | Click settings, toggle sound effects or volume, then close | settingsOpen and audio change | The panel does not permanently block |
| Random generation | M9 | Default creation | Really click random | Multiple slots or the preview change | phase editing |
| Clear and reset | M10 | accessorySelected | Really click clear | accessories is 0, adjustments return to the default range | Parts can still be selected |
| Reject invalid actions | M2/M4/M6/M7 | Default creation | Send an unknown action or invalid category | ok false or unchanged | Configuration summary remains unchanged |

## Feature-Interface Mapping

- M1: `reset()`, `getSnapshot()`, visible preview detection.
- M2/M3: real category/option clicks, `input({ type:"selectCategory" })`, `input({ type:"selectOption" })`.
- M4: real color controls, `input({ type:"selectColor" })`, `input({ type:"setColorIntensity" })`.
- M5: real accessory controls, `input({ type:"toggleAccessory" })`, `input({ type:"clearAccessories" })`.
- M6/M7: real drag/wheel/settings controls, `input({ type:"adjust" })`, `adjustable.screenX/screenY/scale`.
- M8/M11: real settings controls, `input({ type:"openSettings" })`, audio action.
- M9/M10: real random/clear controls, `input({ type:"randomize" })`, `input({ type:"clearAll" })`.

## Prohibited Items

- Private variables, internal functions, fixed DOM id, fixed CSS class, fixed asset names, fixed wording, fixed color values, or a specific drawing algorithm are not required.
- The public interface must not allow an arbitrary configuration object to be written directly to bypass player actions.
- `{ ok:true }` cannot be the sole passing evidence; a stable snapshot must be returned or visible postconditions must be produced.
