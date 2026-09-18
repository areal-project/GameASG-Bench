# Fashion Couple Puzzle TDD

## Public Testable Contract

The implementation must expose a stable, coarse-grained public contract:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  input(action): Snapshot | { ok: false, reason: string, snapshot: Snapshot },
  getSnapshot(): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

These interfaces must drive the same player-visible state; they cannot merely return `{ ok:true }` or modify only hidden data. The results of real mouse/touch/button paths and `input(action)` should be consistent. `loadScenario` may only construct valid prerequisite states and must not directly grant completion, add progress, or bypass piece-placement rules.

## Snapshot Schema

```javascript
{
  phase: "loading" | "selection" | "playing" | "complete",
  screen: "loading" | "selection" | "puzzle" | "completion",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  currentLevel: number,
  levelCount: number,
  pieceCount: number,
  connectedCount: number,
  trayCount: number,
  progressText: string,
  result: "none" | "complete",
  completionVisible: boolean,
  nextAvailable: boolean,
  playfield: { left: number, top: number, width: number, height: number },
  targetArea: { left: number, top: number, width: number, height: number },
  trayArea: { left: number, top: number, width: number, height: number },
  pieces: [
    {
      id: string,
      status: "tray" | "dragging" | "connected",
      screenX: number,
      screenY: number,
      width: number,
      height: number,
      target: { screenX: number, screenY: number, width: number, height: number },
      draggable: boolean
    }
  ],
  levels: [
    { index: number, unlocked: boolean, pieceCount: number, visible: boolean }
  ],
  feedback: {
    lastAction: "none" | "select" | "drag" | "connect" | "reject" | "complete" | "restart" | "next",
    visualRevision: number,
    errorRevision: number,
    successRevision: number
  }
}
```

Field semantics:

- `connectedCount + trayCount` must equal `pieceCount`; a piece being dragged still counts toward trayCount, or has an explicit state while preserving total quantity.
- `levels[]` and `levelCount` must express long-term level depth: the P2 target is at least 50 level summaries, and piece counts must cover introductory levels with 2-4 pieces, medium levels with 20-30 pieces, and difficult levels with more than 100 pieces; fixed theme names or exact image assets are not required.
- `screenX/screenY` are the screen coordinates of the piece center and are used for real input.
- `target.screenX/screenY` are the center of that piece's own target cell, not an arbitrary target.
- `playfield/targetArea/trayArea` are player-visible geometries and must use screen coordinates.
- `visualRevision` increments when the real visible screen changes because of a player action.

## Action Schema

`window.__gameTest.input(action)` supports the following player-level actions:

| Action | Schema | Expected |
|---|---|---|
| startLevel | `{ type:"startLevel", level:number }` | Enter the specified unlocked level, with phase set to playing |
| pointerDown | `{ type:"pointerDown", pieceId:string }` or `{ type:"pointerDown", screenX:number, screenY:number }` | Select a tray piece, changing its state to dragging |
| pointerMove | `{ type:"pointerMove", screenX:number, screenY:number }` | The dragged piece's center follows nearby screen coordinates, and visualRevision increases |
| pointerUp | `{ type:"pointerUp", screenX:number, screenY:number }` | Perform correct snapping or incorrect rejection based on the release position |
| dragPiece | `{ type:"dragPiece", pieceId:string, to:"target"|"wrong" }` | Player-level convenience action, internally equivalent to down/move/up and unable to bypass rules |
| next | `{ type:"next" }` | Enter the next level from the complete state or return to selection |
| restart | `{ type:"restart" }` | Reset the current level, with connectedCount set to 0 |
| backToSelection | `{ type:"backToSelection" }` | Return to the selection state |
| invalid | Any unknown type or missing key field | Return `ok:false` or leave state unchanged without throwing an exception |

## Visible UI / HUD / Main Screen Postconditions

- A real level entry or start control should allow entry into playing through a mouse click; tests should prefer finding the target through semantic controls in the snapshot, runtime geometry, accessible names, or visible entry points, and no fixed DOM selector or `data-*` attribute is required.
- Continue, restart, and return controls must be player-visible and operable; external validation should use visible semantics, snapshot geometry, or an equivalent public control summary.
- The playing state must have a non-empty visible puzzle area, and after real dragging, the visible state of the main screen or the snapshot's `visualRevision` must change.
- The complete state must make `completionVisible=true` and `nextAvailable=true`, and present an equivalent completion layer/continue entry point in the visible interface, HUD, or public snapshot.
- When `overlayBlocking=false` and `canInteractWithPlayfield=true`, the center of the main puzzle area should not be obstructed by an overlay that cannot be closed.

## loadScenario

| Name | Purpose | Required precondition |
|---|---|---|
| `first_level` | Enter a simple incomplete level | phase=playing, connectedCount=0, at least 2 unconnected pieces |
| `one_correct_piece` | Prepare an unconnected piece that can actually be dragged to its target | That piece must not be connected in advance |
| `wrong_drop` | Prepare an unconnected piece and an obviously incorrect release point | connectedCount=0 or preserve current valid progress |
| `one_piece_remaining` | Leave only the final piece unconnected | phase=playing, result=none, completionVisible=false |
| `completed_level` | State after valid completion, used for continue/restart flows | phase=complete, nextAvailable=true |

## Behavioral Trajectory Contract

| Trajectory | Coverage M | Setup | Player Steps | Expected Oracle | Invariants |
|---|---|---|---|---|---|
| Launch into playable state | M1/M3 | reset | Wait or click start/first level | phase is selection or playing; playfield is non-empty; overlay does not block | No fatal error |
| Real level entry | M2 | reset to selection | Mouse-click a visible level entry | phase=playing, pieceCount>0, progress is 0/total | playfield is interactive after selection |
| Directional dragging | M4 | loadScenario("one_correct_piece") | Drag right with a real mouse, then drag left | The piece's screenX first increases and then decreases, and visualRevision increases | Does not change connectedCount |
| Touch dragging | M4/M5 | loadScenario("one_correct_piece") | Press a piece with real touch, move it to its own target, and release | The piece responds to the touch path; after correct release, connectedCount +1, with the HUD or visualRevision synchronized | Uses the same placement rules as the mouse path, and total quantity is conserved |
| Correct snapping | M5 | loadScenario("one_correct_piece") | Actually drag a piece to its own target and release | connectedCount +1, piece status=connected, HUD synchronized | Total quantity is conserved, and other unconnected pieces remain in the tray |
| Incorrect rejection | M6 | loadScenario("wrong_drop") | Actually drag a piece to the wrong point and release | connectedCount is unchanged, lastAction=reject or errorRevision increases | totalBefore == totalAfter |
| Complete level | M7 | loadScenario("one_piece_remaining") | Actually drag the final piece to its target | phase=complete, completionVisible=true, nextAvailable=true | Completion is triggered by placement |
| Continue after completion | M7/M10 | loadScenario("completed_level") | Actually click continue or input({type:"next"}) | Enter the next level or selection page, and the completion layer closes | New level connectedCount=0 |
| Restart cleanup | M8 | playing with existing connections | input({type:"restart"}) or click restart | connectedCount=0, result=none | pieceCount is unchanged |
| Invalid input rejection | M6/M8 | Any playing | input({type:"unknown"}) or release at invalid coordinates | Return failure or leave state unchanged | progress, total quantity, and phase are unchanged |

## Feature-Interface Mapping

| M | Public observation / action |
|---|---|
| M1 | `reset`, `getSnapshot.phase`, `overlayBlocking`, playfield geometry |
| M2 | visible level cards, `input({type:"startLevel"})`, `levels[]` |
| M3 | `pieceCount`, `connectedCount`, `trayCount`, `pieces[]`, `progressText` |
| M4 | real mouse/touch drag using `pieces[].screenX/screenY` |
| M5 | real drag to `piece.target`, snapshot + HUD delta |
| M6 | real drag to wrong point, `errorRevision`, unchanged totals |
| M7 | `loadScenario("one_piece_remaining")`, real final drag, completion fields |
| M8 | `restart`, `backToSelection`, visible controls |
| M9 | `feedback.*Revision`, canvas/DOM visible change |
| M10 | `levels[]`, `next`, optional persisted progress/settings; `levels[]` covers a long list of 50+ levels and summaries of 100+ piece difficult levels |

## Prohibited Items

- Private variables, internal functions, fixed DOM id, fixed copy, fixed pixel coordinates, fixed colors, or specific rendering algorithms must not be required.
- `loadScenario` must not directly set victory, directly increase progress, or directly mark pieces as completed to pass the rule chain.
- The public interface must not become a cheating channel; every action must synchronize the real screen, HUD, or visible state.
