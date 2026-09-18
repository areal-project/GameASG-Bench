# Smash the Dummy TDD Contract

## 1. Scope

This file defines the public observable contract for Smash the Dummy. It converts the Game Spec and Design Doc into a stable test shell: public actions, legal scenarios, snapshot summaries, field vocabularies, and trigger-to-observable postconditions.

The contract must not require a particular engine, renderer, DOM structure, physics algorithm, source naming, fixed canvas size, fixed screen coordinate, exact text, exact colors, or asset identity. All coordinates exposed here are semantic runtime observations, such as visible object centers and bounds, not hard-coded layout requirements.

## 2. Public Interface

Implementations must expose:

```javascript
window.__gameTest = {
  reset(options): Snapshot,
  loadScenario(name, options): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot
}
```

### Method Semantics

- `reset(options)` returns the game to a clean boot or first playable state. It must clear transient deaths, particles, grabbed objects, result overlays, and per-level physical residue. `options.preserveProgress` may keep saved unlocks; otherwise the implementation may start from a fresh first-level progression state.
- `loadScenario(name, options)` loads a legal precondition from the scenario list. It may choose any level matching the requested family. It must not pre-apply the outcome being tested: no direct damage, no direct victory, no pre-triggered explosion, no pre-awarded unlock, no direct collision, no completed mechanism, and no forced death.
- `input(action)` performs a player-level action or a time advance equivalent to waiting during normal play. It must drive the same state and visible feedback as the corresponding player action.
- `getSnapshot()` returns the current public summary without mutating state.

Every method returns a full `Snapshot`. If an action is rejected, the snapshot still returns the current state and records the rejection in `lastAction`.

## 3. Scenario Schema

`loadScenario(name, options)` accepts only these scenario names:

| Scenario | Legal precondition | Player-level triggers allowed to produce postconditions |
|---|---|---|
| `boot` | Game is newly loaded or reset before playfield interaction. Loading or start UI may be visible. | `start`, then normal play actions. |
| `first_level_start` | A playable first level is loaded with full health, visible dummy, visible hazard, and no damage applied. | `drag`, `pointerDown/move/up`, `wait`, `tap` if the level has a clickable target. |
| `tool_hazard_start` | A level with a draggable tool or dangerous prop is ready. The tool is present and not yet contacting the dummy. | Drag the tool to the dummy, release it, or hold contact. |
| `moving_hazard_start` | A level with an automatic moving hazard is ready. The dummy is not already completed by the hazard. | Drag or release the dummy into the hazard path; wait for a legal hazard cycle. |
| `explosive_or_heavy_prop_start` | A level with a draggable explosive, falling, rolling, or heavy prop is ready. The prop is untriggered. | Drag, release, drop, or position the prop so the normal trigger condition can occur. |
| `fixed_hazard_start` | A level with a fixed fire, acid, electric, laser, spike, blade, or equivalent hazard zone is ready. The dummy begins outside the damaging condition unless the level is an explicit visible demo. | Drag the dummy into the zone; wait during contact; drag out to verify reduced or stopped continuous damage. |
| `mechanism_start` | A level with a button, trap, support, press, or other mechanism is ready and untriggered. | Drag the dummy or prop onto the trigger area, or release it so it lands there. |
| `click_release_start` | A level with a clickable release target is ready. The target is visible and unactivated. | `tap` the target; then `wait` for the falling or released chain. |
| `progression_chain_start` | A playable unlocked level is ready with full health and a normal route to completion through one of the declared hazard families. No damage, result, or unlock has been applied. | Complete the level through valid hazard actions, then use `nextLevel`, `restartLevel`, or `openLevelSelect`. |

Scenarios may include `options.family`, `options.levelIndex`, or `options.preferUnlocked` when those values select among legal preconditions. They must not directly set health, result, damage counters, hazard impact state, completion state, or newly unlocked progress.

## 4. Action Schema

All actions are player-level. Implementations may expose both coarse semantic actions and lower-level pointer/touch actions, but both must share the same gameplay path.

```typescript
type Action =
  | { type: "start" }
  | { type: "restartLevel" }
  | { type: "nextLevel" }
  | { type: "openLevelSelect" }
  | { type: "closePanel" }
  | { type: "selectLevel", levelIndex: number }
  | { type: "scrollLevelSelect", deltaY: number }
  | { type: "pointerDown", target?: TargetRef, point?: SemanticPoint }
  | { type: "pointerMove", point: SemanticPoint }
  | { type: "pointerUp" }
  | { type: "drag", target: TargetRef, to: TargetRef | SemanticPoint, durationMs?: number, holdMs?: number, release?: boolean }
  | { type: "tap", target: TargetRef | SemanticPoint }
  | { type: "wait", ms: number }
```

### TargetRef

`TargetRef` may be:

- `{ kind: "dummy", part?: "any" | "head" | "torso" | "arm" | "leg" | "hand" | "foot" }`
- `{ kind: "hazard", family?: HazardFamily }`
- `{ kind: "prop", family?: HazardFamily }`
- `{ kind: "mechanismTrigger" }`
- `{ kind: "clickReleaseTarget" }`
- `{ kind: "blank" }`
- `{ kind: "levelNode", levelIndex: number }`
- `{ kind: "control", name: "start" | "restart" | "next" | "levelSelect" | "close" }`

### SemanticPoint

`SemanticPoint` is a runtime semantic point, not a fixed coordinate:

```typescript
{
  source: "snapshot",
  ref: string,
  anchor?: "center" | "left" | "right" | "top" | "bottom" | "inside" | "outside",
  offsetScreen?: { dx: number, dy: number }
}
```

`ref` must refer to a public snapshot item such as a dummy part, hazard zone, prop, trigger zone, clickable target, blank safe area, playfield bounds, or visible control. Tests may use `screenX/screenY` returned in the snapshot, but must derive them at runtime.

## 5. Snapshot Schema

The snapshot is a stable public summary. It must not expose internal object graphs, source-private names, engine-specific object references, or raw physics bodies.

```typescript
type Snapshot = {
  ok: boolean,
  phase: "loading" | "start" | "playing" | "dying" | "complete" | "levelSelect",
  screen: "loading" | "start" | "playfield" | "complete" | "levelSelect",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  render: RenderSummary,
  playfield: PlayfieldSummary,
  level: LevelSummary,
  progress: ProgressSummary,
  controls: ControlSummary[],
  health: HealthSummary,
  dummy: DummySummary,
  hazards: HazardSummary[],
  interactables: InteractableSummary[],
  feedback: FeedbackSummary,
  result: ResultSummary,
  lastAction: ActionResult
}
```

### Field Vocabularies

```typescript
type RenderSummary = {
  ready: boolean,
  nonBlank: boolean,
  revision: number,
  motionRevision: number
}

type PlayfieldSummary = {
  bounds: { left: number, top: number, width: number, height: number },
  visible: boolean,
  readable3DScene: boolean,
  safeBlankPoints: Array<{ id: string, screenX: number, screenY: number }>
}

type LevelSummary = {
  index: number,
  count: number,
  family: HazardFamily,
  started: boolean,
  completed: boolean,
  hazardReady: boolean
}

type HazardFamily =
  | "tool"
  | "moving"
  | "explosiveOrHeavy"
  | "fixedZone"
  | "mechanism"
  | "clickRelease"
  | "extended"

type ProgressSummary = {
  unlockedLevelIndexes: number[],
  currentLevelIndex: number,
  persisted: boolean | "unavailable",
  tutorialBlocking: boolean
}

type ControlSummary = {
  name: "start" | "restart" | "next" | "levelSelect" | "close",
  available: boolean,
  enabled: boolean,
  visible: boolean,
  screenX?: number,
  screenY?: number
}

type HealthSummary = {
  current: number,
  max: number,
  ratio: number,
  band: "full" | "high" | "mid" | "low" | "zero",
  visible: boolean
}

type DummySummary = {
  visible: boolean,
  grabbable: boolean,
  grabbed: boolean,
  state: "static" | "ragdoll" | "released" | "damaged" | "dying" | "dead",
  center: { screenX: number, screenY: number },
  parts: Array<{ id: string, group: "head" | "torso" | "arm" | "leg" | "hand" | "foot" | "other", screenX: number, screenY: number, grabbable: boolean }>,
  poseRevision: number,
  motionRevision: number,
  damageRevision: number,
  deathFeedbackRevision: number
}

type HazardSummary = {
  id: string,
  family: HazardFamily,
  visible: boolean,
  active: boolean,
  draggable: boolean,
  clickable: boolean,
  automaticMotion: boolean,
  screenX: number,
  screenY: number,
  bounds?: { left: number, top: number, width: number, height: number },
  zone?: { id: string, screenX: number, screenY: number, insideRef: string, outsideRef?: string },
  motionRevision: number,
  effectRevision: number,
  triggerRevision: number,
  contactRevision: number
}

type InteractableSummary = {
  id: string,
  kind: "dummyPart" | "prop" | "mechanismTrigger" | "clickReleaseTarget" | "control" | "levelNode" | "blank",
  family?: HazardFamily,
  grabbable: boolean,
  clickable: boolean,
  enabled: boolean,
  screenX: number,
  screenY: number,
  bounds?: { left: number, top: number, width: number, height: number },
  levelIndex?: number,
  locked?: boolean
}

type FeedbackSummary = {
  grabRevision: number,
  releaseRevision: number,
  impactRevision: number,
  damageRevision: number,
  particleOrVisualEffectRevision: number,
  hudRevision: number
}

type ResultSummary = {
  state: "none" | "dying" | "complete",
  visible: boolean,
  completedLevelIndex?: number,
  completionRevision: number
}

type ActionResult = {
  ok: boolean,
  accepted: boolean,
  actionType?: string,
  reason?:
    | "notReady"
    | "blocked"
    | "noTarget"
    | "locked"
    | "invalidAction"
    | "outOfRange"
    | "alreadyUsed"
    | "notInteractable"
}
```

Numeric revisions are monotonic public counters or equivalent stable summaries. They may increase when the matching visible event occurs. They must not require a fixed frame count or exact physics value.

## 6. Feature Contract Matrix

| GDD feature | Contract trigger | Required observable result | Rejection / invariant |
|---|---|---|---|
| M1 3D ragdoll playfield | `loadScenario("first_level_start")` or `input({ type: "start" })` | `phase="playing"`, `render.ready=true`, `render.nonBlank=true`, `playfield.readable3DScene=true`, visible dummy, visible hazard, visible health | `overlayBlocking=false` and `canInteractWithPlayfield=true` in playing state. |
| M2 mouse/touch drag | `drag` or pointer sequence from a dummy part to semantic left/right/up/down points | Dummy `grabbed` becomes true during drag; `poseRevision` or `motionRevision` increases; dummy or grabbed part moves in the same screen direction as the pointer | Dragging `blank` is rejected or leaves health, result, progress, and damage revisions unchanged. |
| M3 release physics | Drag a dummy or prop, then `pointerUp` and `wait` | `grabbed=false`; `releaseRevision` increases; motion continues or settles through visible `motionRevision` without staying locked to pointer | Releasing without a grabbed target does not cause damage, progress, or completion. |
| M4 priority and locked rejection | In a prop/tool scenario, drag a draggable prop that overlaps the dummy; in locked phases, attempt scene drag | Prop or tool is the accepted target when applicable; locked or complete phases reject scene grabs | Fixed hazards, blank areas, locked level nodes, death, and completion states cannot be used to fake damage or progress. |
| M5 health and damage | Move dummy or prop into a valid hazard condition and wait as needed | `health.current` or `health.ratio` decreases; `health.band` and `feedback.hudRevision` stay synchronized; `damageRevision` or `impactRevision` increases | Health never drops below zero; leaving a continuous hazard stops or significantly reduces further damage compared with staying in contact. |
| M6 death and completion | Continue valid hazard interaction until health reaches zero | `phase` moves through `dying` to `complete`; `result.visible=true`; `deathFeedbackRevision` and `completionRevision` increase; playfield input locks | Completion cannot appear before the death chain; scene drag during dying/complete is rejected and does not change the result. |
| M7 tool hazard | `loadScenario("tool_hazard_start")`, drag tool to dummy, hold or release | Tool contact produces damage plus visible effect, impact, or dummy force feedback | Tool cannot pass as decoration: contact without health/effect/dummy feedback is insufficient. |
| M7 moving hazard | `loadScenario("moving_hazard_start")`, place dummy into hazard path, wait | Hazard `automaticMotion=true`; `motionRevision` increases before hit; hit causes damage and dummy motion or impact feedback | Natural hazard motion alone does not complete the core loop without a valid dummy placement unless the level is an explicit visible demo. |
| M7 explosive/heavy prop | `loadScenario("explosive_or_heavy_prop_start")`, drag/release prop into valid trigger condition | Prop trigger causes explosion, impact, falling, rolling, or flying feedback; dummy damage and motion feedback follow | A pre-triggered or purely visual explosion is not a valid setup or result. |
| M7 fixed hazard zone | `loadScenario("fixed_hazard_start")`, drag dummy into zone, then out if possible | Entering the zone causes continuous or instant damage with visible effect; leaving reduces or stops continuous damage | Fixed hazard remains non-draggable unless also exposed as a prop by the level. |
| M7 mechanism | `loadScenario("mechanism_start")`, place dummy/prop onto trigger | `triggerRevision` increases; a second-stage hazard action follows; dummy damage or motion feedback is connected to that action | Pressing empty trigger or repeatedly triggering an already consumed mechanism cannot duplicate completion or corrupt state. |
| M7 click release | `loadScenario("click_release_start")`, `tap` clickable target | Click target feedback changes; falling/release chain begins; dummy later moves, takes damage, or reaches death condition | Tapping blank, disabled, or already-used target is rejected or state-stable. |
| M8 completion flow and level select | From `progression_chain_start`, complete a level through valid hazard actions, then use `nextLevel`, `restartLevel`, `openLevelSelect`, or `selectLevel` | Next level changes `level.index` and creates fresh full-health content; restart restores same level; unlocked selection loads chosen level | Completion display alone does not advance progress; locked selection is rejected; scroll does not select a level. |
| M9 persistence | Earn progress through completion and `nextLevel`, then call `reset({ preserveProgress: true })` or reload through the public boot path | Earned unlock/current level can be restored when persistence is available; otherwise game still starts first level playably | Persistence failure cannot cause black screen, blocked start, or missing first-level playability. |
| M10 extended hazards | `loadScenario` with `options.family="extended"` when available | Extended hazard exposes one of the same legal trigger chains and produces visible action, damage, and normal completion flow | Extended hazards cannot be empty buttons, repeated static backgrounds, or pure health subtraction without a visible trigger chain. |

## 7. External Postconditions

- When `phase="playing"`, the primary playfield is visible, not blocked by a menu/result overlay, and accepts player-level pointer or touch actions.
- Health must be visible during play and must update when `health.current` changes.
- Completion, level select, and start screens may block the playfield, but the snapshot must report this through `overlayBlocking` and `canInteractWithPlayfield`.
- Visible controls in `controls` must perform the same state transition as their corresponding `input(action)` contract.
- Pointer, touch, and semantic drag actions must update the same gameplay state; the test interface is not allowed to mutate a separate hidden model.
- Any scene action after death lock or completion may animate background physics, but it must not change health, result, unlocked progress, or completed level.

## 8. Anti-Cheat And Prohibited Contract Paths

The public contract must not provide or require:

- Directly setting health, score, result, completion, unlocks, damage, collision, hazard hit, explosion state, trigger state, or death.
- Loading a scenario where the target is already damaged, already dead, already colliding, already released, already exploded, already clicked, already unlocked by the tested action, or already completed.
- Private function names, private variables, raw physics bodies, engine object references, DOM selectors, CSS class names, source file names, asset names, or fixed text.
- Fixed screen coordinates, fixed viewport sizes, exact frame counts, exact physics constants, exact color values, or exact timing beyond broad action ordering such as "after wait".
- A separate fake state that makes `__gameTest` pass while real pointer/touch/control input leaves the visible game unchanged.

All core scenarios must be triggerable from their legal precondition by the action families listed in Section 3. A scenario is invalid if no player-level action can produce the advertised observable result.
