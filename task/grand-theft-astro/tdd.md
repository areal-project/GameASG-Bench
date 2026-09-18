# Grand Theft Astro TDD

## Public Runtime Contract

The implementation must expose a stable public testing contract:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  getSnapshot(): Snapshot,
  input(action): ActionResult,
  loadScenario(name, options): Snapshot
}
```

These methods are player-level semantic wrappers, not channels for accessing internal objects. `input(action)` must be equivalent to a player action or a coarse-grained UI command; `loadScenario(name)` may only construct a valid prerequisite state and cannot directly grant rewards, set win/loss, kill enemies, add points, or bypass the core rule chain.

## Visible Scene / Semantic Controls Contract

- The main playfield must be a true 3D rendered scene, preferably using WebGL/Three.js or an equivalent browser 3D rendering pipeline; a 2D canvas top-down view, isometric pseudo-3D, static background, CSS flat-layer stacking, or merely declaring 3D in the snapshot does not satisfy M1. `Snapshot.playfield.bounds` should provide the current runtime geometry, and it is recommended to also expose a read-only summary such as `playfield.rendererType` or `playfield.is3D`; tests must not depend on a fixed selector, fixed canvas ordering, or fixed coordinates.
- Controls for starting, shooting, threatening, switching weapons, entering/exiting vehicles, buying and selling in the shop, death and respawn, and optional zoom must be visible and triggerable by the player. The implementation may assist discovery through accessible names, visible text, a public snapshot control summary, or optional semantic attributes, but does not require a fixed DOM structure, fixed `data-*` attributes, or fixed control text.
- If implemented, the minimap must express current-position/threat information through a player-visible region or a public snapshot summary; tests must not require a fixed DOM region.
- The HUD must keep summaries such as cash, health, ammunition, wanted level, weapon, and quest synchronized with the snapshot; validation may use the visible HUD, public snapshot, or equivalent semantic state and does not require a fixed HUD selector.
- In a playable state, `ui.overlayBlocking` must be `false`, and `ui.canInteractWithPlayfield` must be `true`. They may indicate a blocking state while a dialog, shop, or death layer is open, but must recover after it closes.

## Snapshot Schema

`Snapshot` must be JSON-serializable and contain at least:

```javascript
{
  phase: "loading|intro|playing|paused|dialog|shop|dead",
  mode: "walking|driving",
  screen: "loading|game|dialog|shop|death",
  result: "none|dead",
  playfield: {
    ready: true,
    bounds: { left, top, width, height },
    renderRevision: number,
    nonBlank: boolean,
    rendererType?: "webgl"|"webgl2"|"three"|"other-3d",
    is3D?: boolean
  },
  ui: {
    overlayBlocking: boolean,
    canInteractWithPlayfield: boolean,
    activePanel: "none|dialog|shop|death|loading"
  },
  player: {
    health: number,
    cash: number,
    screenX: number,
    screenY: number,
    worldX: number,
    worldZ: number,
    facing: number,
    alive: boolean,
    aiming: boolean,
    threatActive: boolean
  },
  vehicle: {
    inVehicle: boolean,
    screenX: number|null,
    screenY: number|null,
    speed: number,
    heading: number
  },
  weapon: {
    current: string,
    ammo: number,
    owned: string[],
    switchable: string[],
    locked: string[]
  },
  wanted: {
    level: number,
    max: number
  },
  entityCounts: {
    npcs: number,
    police: number,
    vehicles: number,
    cashPickups: number,
    healthPickups: number,
    projectiles: number
  },
  quest: {
    active: boolean,
    type: "none|talk|reach|deliver|stealVehicle|buy|kill",
    progress: string,
    distanceToTarget: number|null,
    completedCount: number,
    targetScreenX: number|null,
    targetScreenY: number|null,
    rewardPreview: { cash?: number, weapon?: string }|null
  },
  shop: {
    open: boolean,
    selectedItem: string|null,
    visibleItems: Array<{ itemId: string, affordable: boolean, kind: "weapon|ammo|health|quest|other" }>,
    lastRejected: boolean
  },
  pickups: {
    nearestCash: { screenX: number, screenY: number, worldX: number, worldZ: number }|null,
    nearestHealth: { screenX: number, screenY: number, worldX: number, worldZ: number }|null,
    nearestAmmo: { screenX: number, screenY: number, worldX: number, worldZ: number, weapon?: string }|null
  },
  minimap: {
    visible: boolean,
    expanded: boolean,
    markerRevision: number
  },
  camera: {
    zoom: number,
    canZoomIn: boolean,
    canZoomOut: boolean
  },
  feedback: {
    lastEvent: string|null,
    hitCount: number,
    collectionCount: number,
    collisionCount: number,
    threatReactionCount: number,
    weaponSwitchCount: number,
    worldMotionRevision: number
  }
}
```

Fields may be extended, but fields required by P1 must not be removed. Numeric values may be approximate, but must stably express player-visible state.

## Action Schema

`window.__gameTest.input(action)` supports the following player-level actions:

| Action | Required fields | Semantics | Rejection |
|---|---|---|---|
| `start` | none | Close a skippable opening/loading layer and enter playing | Remain stable when already playing |
| `move` | `direction: "left|right|up|down"`, optional `durationMs` | Equivalent to arrow-key/joystick movement | Reject when a blocking panel is open or when dead |
| `aim` | `direction: "left|right|up|down"` | Change the character's visible facing | Reject when not walking or when dead |
| `threat` | `active: boolean`, optional `holdMs` | Equivalent to holding/releasing the threat button, raising a weapon without firing | Reject when not walking, dead, or a blocking panel is open |
| `fire` | optional `holdMs` | Equivalent to pressing the fire key/button | Reject when out of ammunition, dead, or driving |
| `switchWeapon` | `weaponId` or `direction: "next"` | Equivalent to clicking the weapon control or pressing the switch key | Reject an unowned weapon, during cooldown, when dead, or when driving |
| `enterVehicle` | none | Enter driving when near a valid vehicle | Reject when not near a vehicle |
| `drive` | `direction: "forward|reverse|left|right"`, optional `durationMs` | Move/steer the vehicle | Reject when not driving |
| `exitVehicle` | none | Get out at a valid position beside the vehicle | Reject when not driving |
| `collect` | `kind: "cash|health|ammo"` | Walk to and pick up a nearby pickup | Reject when there is no corresponding pickup nearby |
| `openShop` | none | Open a nearby shop | Reject when not near a shop |
| `buy` | `itemId` | Purchase a shop item | Reject when the balance is insufficient, ammunition belongs to an unowned weapon, or the shop is not open |
| `closeShop` | none | Close the shop | Remain stable when the shop is not open |
| `advanceDialog` | none | Advance the dialog by one page or close it | Remain stable when there is no dialog |
| `respawn` | none | Respawn from the death layer | Reject when not dead |
| `toggleMinimap` | none | Expand or collapse the minimap | Remain stable outside the playable state |
| `zoom` | `direction: "in|out"` | Equivalent to changing viewing distance with the wheel, pinch, or a zoom button | Remain stable and explain the reason if zoom is unsupported or in a blocking state |

`ActionResult` returns `{ ok: boolean, reason?: string, snapshot: Snapshot }`. Rejection paths must not throw exceptions and must preserve key state.

## Scenario Contract

Available names for `loadScenario(name)`:

- `streetFreeRoam`: The player is in a playable neighborhood with nearby NPCs, vehicles, and pickups; the player is not dead and nothing is obscured.
- `combatTarget`: The player is in the walking state with a living NPC ahead, the current weapon has ammunition, and no hit has yet occurred.
- `aimThreatNPC`: The player is in the walking state with an ordinary NPC nearby; before the threat, the NPC has not yet fled or dropped resources, and the current action will not fire directly.
- `weaponSwitching`: The player owns at least two weapons, with at least one unowned weapon available for the rejection path.
- `nearVehicle`: The player stands beside an enterable vehicle that is not yet controlled by the player.
- `cashPickup`: The player is within one step of a cash pickup, the cash has not yet been collected, and `pickups.nearestCash` points to that visible pickup.
- `healthOrAmmoPickup`: The player is within one step of a health pack or ammunition pack, the pickup has not yet been collected, and the current state allows it to have an effect.
- `shopWithCash`: The player is beside a shop, has enough cash to buy one basic item, and the item has not yet been purchased; after opening, `shop.visibleItems` contains a purchasable item.
- `shopInsufficientCash`: The player is beside a shop, has insufficient cash to buy the specified item, and the item has not yet been purchased; after opening, `shop.visibleItems` contains an unaffordable item.
- `lowHealthThreat`: The player's health is low, a valid danger exists that can be triggered by a subsequent action, and the player is not yet dead after loading.
- `activeReachQuest`: An arrival/dialog-type quest is active, the objective is not yet complete, and navigation is visible.
- `activeActionQuest`: A vehicle-theft, purchase, pickup-and-delivery, or target-defeat quest is active, the objective is not yet complete, and the snapshot describes the quest type, target position, or triggerable object.
- `deathState`: The player is already in the death state and can click/input respawn; this scenario is used only for the respawn contract.

After each scenario loads, it must pass a prerequisite review: it cannot already contain the reward, hit, collection, purchase, post-death respawn, or quest-completion result that the test is meant to prove.

## Behavior Trajectories

| Trajectory | Covered M | Setup | Player steps | Expected oracle | Invariants |
|---|---|---|---|---|---|
| Boot to playable | M1/M9 | reset | start or close the opening | phase=playing, playfield nonBlank, overlayBlocking=false, has WebGL/real 3D renderer evidence | No fatal error; playfield is interactive |
| Walking direction | M2 | streetFreeRoam | Real ArrowRight followed by ArrowLeft | player.screenX/screenY or an equivalent visible position changes in opposite directions, and renderRevision changes | move is rejected during dialog/shop/dead |
| Aim and threat | M3/M4/M11 | aimThreatNPC | Real drag on the firing/threat area or contract aim/threat | facing changes according to screen direction; threatActive or NPC reaction/drop feedback changes, and ammo does not decrease | A threat is not a shot; the action ends after release |
| Fire at target | M3/M4/M6 | combatTarget | Real Space or fire button | ammo decreases, projectiles/hitCount/target state changes, and wanted does not decrease | ammo is not negative; fire is rejected without ammunition |
| Weapon switch | M3/M6 | weaponSwitching | Real Q or click the weapon control, then try an unowned weapon | current weapon/HUD switches; the unowned weapon is rejected and resources remain unchanged | Switching cannot grant an unowned weapon |
| Vehicle driving | M5/M9 | nearVehicle | Actually enter the vehicle, move forward, reverse, steer left and right, and exit | mode driving -> walking, the vehicle's screen position changes, and forward/reverse and left/right steering are opposite | The exit position is valid; drive is rejected when not driving |
| Collect cash | M6 | cashPickup | Actually move toward `pickups.nearestCash` until contact | cash increases, cashPickups decreases, and the HUD synchronizes | Resources only change reasonably, with no arbitrary extra health/ammunition deduction |
| Shop buy/reject | M7 | shopWithCash/shopInsufficientCash | Open the shop, click a visible item/unaffordable item, and close it | Sufficient funds are deducted and grant the effect; insufficient funds are rejected; closing restores playability | On rejection, cash, owned, ammo, health unchanged |
| Quest progress | M8/M10 | activeReachQuest/activeActionQuest | Move toward the target/advance dialog, or perform a vehicle-theft/purchase/target-defeat/pickup-and-delivery action | distance decreases or completedCount increases; the reward and next objective are triggered by player action | loadScenario does not complete the quest directly |
| Death and respawn | M9 | lowHealthThreat/deathState | Trigger the danger or click respawn | dead locks input; after respawn, health is restored, wanted resets, and the overlay closes | Movement/shooting is impossible in the death state |
| Minimap | M10 | streetFreeRoam | Click the minimap/move | minimap expands/collapses or navigation revision updates | It can be closed after expansion and does not permanently block the playfield |
| Touch controls | M11 | streetFreeRoam | touch drag / touch fire | Directional and button feedback matches state changes | Input stops after touch release |
| Camera zoom | M13 | streetFreeRoam | wheel/pinch/zoom action | camera.zoom or visible viewing distance changes, while the HUD and player remain visible | Zoom cannot permanently obscure or lose the player |

## Illegal Input And Postconditions

- An illegal action must return `ok:false` or `reason` and must not throw an exception.
- All resource fields must remain non-negative: cash, health, ammo, wanted.
- After `health <= 0`, phase must become `dead`, and movement/fire/drive action must all be rejected until `respawn`.
- The HUD must synchronize with the Snapshot's cash, health, ammunition, wanted level, and quest state after an action.
- Visual postcondition: after the main scene starts, `playfield.nonBlank=true`, and evidence of true WebGL/3D rendering must exist; after core input, `renderRevision` or canvas image evidence must change, rather than only the snapshot changing.
- Direction postcondition: `left/right` and `up/down` must express opposite visible changes in screen space or camera space; vehicle steering must likewise have opposite facing changes.

## Feature To Contract Mapping

| Feature | Required contract |
|---|---|
| M1 main scene | Snapshot playfield + nonblank canvas + WebGL/real 3D renderer evidence + renderRevision |
| M2 movement direction | real keyboard/touch + player screen position |
| M3 shooting | real key/button + weapon ammo + projectile/hit feedback |
| M4 wanted level/NPC | wanted level + entity reaction + threatReactionCount + health damage |
| M5 driving | enter/drive/exit actions + vehicle screen position/speed/heading + forward/reverse relation |
| M6 resources/HUD | player/weapon/wanted/entityCounts + pickups + HUD sync |
| M7 shop | shop fields + visibleItems + buy/open/close actions + rejection |
| M8 quests | quest fields + target screen position + distance/progress/reward |
| M9 state machine | phase/screen/result/ui + respawn action |
| M10 minimap | minimap region or toggleMinimap + minimap markerRevision |
| M11 touch controls | touch event path + same state deltas as keyboard/button |
| M12 audio presentation | optional audio muted/playing summary; visual feedback remains primary |
| M13 camera zoom | zoom action or wheel/pinch path + camera zoom/readability summary |

## Anti-Cheat / Empty-shell Guard

The public adapter must prove the same city-action behavior that the player can see and trigger. It cannot be a separate state oracle that passes snapshots while the visible WebGL/real-3D playfield, HUD, player, NPCs, vehicles, pickups, shop panel, quest UI, minimap, weapon controls, or death/respawn overlay are missing or disconnected. A 2D canvas drawing that only imitates perspective is an empty-shell failure for M1 even if the rest of the snapshot schema exists.

Scenarios may load legal preconditions such as a nearby vehicle, a live combat target, a cash pickup, an openable shop, a low-health danger state, or an active quest target. They must not directly award cash, complete quests, kill NPCs, grant locked weapons, purchase items, collect pickups, enter vehicles, set victory/failure, or respawn the player when that result is the subject of the test.

The adapter and implementation must not provide or require hidden shortcuts such as direct resource setters, direct quest-completion commands, direct NPC removal, direct projectile/hit counters, private engine object access, fixed viewport coordinates as the only input path, source function names, or CSS selectors as the only PASS condition. Every core check must follow `trigger -> observable result`: a legal real input or public player-level action from a legal precondition must cause the asserted snapshot, HUD, DOM, and/or canvas-visible change.
