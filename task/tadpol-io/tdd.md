# Tadpol.io TDD Public Contract

## 1. Scope

This file defines the public, portable test contract for Tadpol.io implementations. It is derived only from `game-spec.md` and `design-doc.md`: menu/state flow, top-down swimming, boost tradeoff, food growth, size-based predator/prey interactions, AI ecosystem, boundaries/obstacles, HUD progress, death/respawn, and P2 mode/display/environment depth.

The contract describes player-level actions and stable observable summaries. It does not require a specific engine, render tree, DOM structure, source function, private object graph, fixed coordinate, asset, exact wording, physics formula, or update-loop order.

## 2. Required Public Interface

Implementations must expose one public test adapter:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  getSnapshot(): Snapshot,
  input(action): Snapshot,
  loadScenario(name, options?): Snapshot
}
```

### 2.1 Method Semantics

- `reset(options?)` returns the game to a clean state. With no options it returns the menu. `options.mode` may be `endless` or `growth` to begin a clean playable run in that mode when the mode is available.
- `getSnapshot()` returns the current stable public summary without mutating gameplay.
- `input(action)` performs a player-equivalent action and returns the resulting `Snapshot` after the requested action and any short visible settling time.
- `loadScenario(name, options?)` creates only legal precondition states that are reachable within the rules described by the GDD. It must not directly award growth, kills, death, level completion, purchases, collision results, boost effects, or objective completion. The expected result must still be triggered by a later player-level action.

All methods must be synchronous or return a Promise resolving to `Snapshot`. Invalid scenarios or invalid actions must not throw uncaught errors; they return a snapshot with `lastAction.ok === false` or leave state unchanged with a clear public rejection reason.

## 3. Action Schema

Every action has a `type` string. Optional `durationMs` values represent a player holding an input or waiting while the world runs; they are not frame or algorithm requirements.

| Action | Fields | Player-level meaning | Required postcondition surface |
|---|---|---|---|
| `pressControl` | `control` | Activate a visible semantic control: `startEndless`, `openGrowth`, `back`, `pause`, `resume`, `returnMenu`, `openSettings`, `closeSettings`, `openScores`, `retryLevel`, `nextLevel` | `phase`, `activePanel`, `overlayBlocking`, `canInteractWithPlayfield` update coherently |
| `selectLevel` | `levelIndex` | Select a visible growth level from level select | Unlocked level enters playable growth mode; locked level is rejected or remains unavailable |
| `holdDirection` | `direction`, `durationMs` | Hold keyboard/button-equivalent swim direction. `direction = left|right|up|down` | Player screen position and facing trend move in that visible direction while playing |
| `releaseDirection` | none | Release directional swim input | Active propulsion stops or rapidly settles; movement trend does not continue indefinitely |
| `pointTo` | `target` or `screenX/screenY`, `durationMs` | Move pointer toward a visible playfield point or semantic target | Player moves toward that point when no keyboard direction overrides it |
| `dragJoystick` | `direction`, `strength`, `durationMs` | Touch joystick drag in a direction with strength `0..1` | Player moves in joystick drag direction; joystick feedback is visible while active |
| `releaseJoystick` | none | Let go of touch joystick | Joystick input clears and active propulsion settles |
| `holdBoost` | `durationMs` | Hold boost while existing movement input is active | Speed band/feedback increases and size decreases while enough size remains |
| `releaseBoost` | none | Stop boost input | Boost state and size cost stop; speed returns toward normal swim trend |
| `swimToVisibleTarget` | `targetKind`, `targetId`, `durationMs` | Swim toward a target listed in the snapshot: food, smaller tadpole, threat, boundary, soft obstacle, hard obstacle | Contact or approach produces the corresponding rule outcome if legal |
| `wait` | `durationMs` | Let the current legal state run without new player input | World, HUD, AI, timers, or event pressure progress only when not paused/terminal |
| `setHelperDisplay` | `mode` | Choose auxiliary helper display mode | `helperDisplay.mode = leaderboard|minimap|blank` and matching public visibility state changes |
| `restartRun` | none | Restart current run or retry after a result when available | Transient run state is cleaned; persistent best/progression may remain |

The adapter may support equivalent aliases, but the canonical actions above must work. Actions must be rejected when their screen state does not make sense, for example swimming from menu, boosting while paused, selecting a locked level, or completing a level without objective progress.

## 4. Scenario Schema

Scenarios are legal precondition states. They may position visible actors into reachable arrangements, but they must leave enough separation and state for the tested outcome to be caused by later player input.

| Scenario | Legal precondition | Valid trigger family | Must not pre-apply |
|---|---|---|---|
| `fresh_menu` | Menu visible, no active run input, playfield not accepting swim controls | `pressControl` | Playing state, pause state, score, growth, death |
| `endless_start` | Clean endless run just after entry, player small and protected, food/AI/obstacles/HUD present | `holdDirection`, `pointTo`, `dragJoystick`, `wait` | Food collection, prey kill, death, boost cost |
| `boost_ready` | Endless run with enough player size, clear nearby swim lane, no current boost | `holdDirection` then `holdBoost` | Size drain, speed increase, boost feedback |
| `near_food` | Visible collectible food is near but not touching the player, path is reachable | `swimToVisibleTarget` or directional input toward that target | Consumed food, size increase, eat feedback |
| `near_moving_food` | A moving food target is visible and reachable but not yet collected | `wait`, `swimToVisibleTarget` | Collection or frozen target |
| `near_smaller_tadpole` | A smaller unprotected tadpole is nearby but not in contact; player can reach it | `swimToVisibleTarget` | Kill count, target respawn, growth |
| `near_larger_threat` | A larger threat is nearby but not in contact; player protection has naturally expired or is absent in this legal run state | `holdDirection`, `swimToVisibleTarget`, `wait` | Death, respawn, score submission |
| `ai_activity` | Playfield contains multiple visible AI tadpoles and food with no terminal overlay | `wait`, optional approach to AI | AI movement, eating, fleeing/chasing result |
| `near_boundary` | Player is inside the arena near a visible border with room to swim into it | `holdDirection` toward border | Out-of-bounds state |
| `near_soft_obstacle` | Player is near a visible pushable obstacle but not overlapping it | `swimToVisibleTarget` | Obstacle displacement or collision revision |
| `near_hard_obstacle` | Player is near a visible blocking obstacle but not overlapping it | `swimToVisibleTarget` | Pass-through or ignored collision |
| `paused_run` | A legal playing run with pause overlay active | `wait`, `holdDirection`, `resume` | World advancement while paused, hidden overlay |
| `level_select` | Growth level select visible with locked/unlocked/completed summaries | `selectLevel`, `pressControl(back)` | Entering locked level, completing objective |
| `growth_objective_active` | An unlocked growth level in progress with objective HUD visible and incomplete | `wait`, `swimToVisibleTarget`, `holdDirection` | Completion result without objective progress |
| `helper_display_ready` | Playing or paused state where settings/helper controls are reachable | `setHelperDisplay` or settings controls | Core gameplay mutation |
| `environment_pressure_pending` | A legal long-run state where an optional season/fog/predator condition can occur after time or growth pressure | `wait`, continued play actions | Event already resolved, instant silent death |

If a P2 system is intentionally omitted by an implementation, `loadScenario` may reject only the P2 scenario with `lastAction.reason = "unsupported_optional_feature"` or equivalent. P1 scenarios must be supported.

## 5. Snapshot Schema

`Snapshot` must be JSON-serializable and stable across calls. Numeric values may be approximate; tests should use relational changes unless a field is explicitly an enum or count.

```typescript
type Snapshot = {
  phase: "menu" | "levelSelect" | "playing" | "paused" | "deathFeedback" | "levelComplete";
  mode: "none" | "endless" | "growth";
  result: "none" | "death" | "levelComplete";
  activePanel: "none" | "menu" | "levelSelect" | "pause" | "settings" | "scores" | "death" | "levelComplete";
  overlayBlocking: boolean;
  canInteractWithPlayfield: boolean;
  render: RenderSummary;
  player: PlayerSummary;
  hud: HudSummary;
  world: WorldSummary;
  helperDisplay: HelperDisplaySummary;
  level?: LevelSummary;
  events?: EventSummary;
  lastAction?: ActionResult;
};
```

### 5.1 RenderSummary

```typescript
type RenderSummary = {
  playfieldVisible: boolean;
  playfieldNonBlank: boolean;
  playfieldRevision: number;
  cameraFollowsPlayer: boolean;
  playerVisible: boolean;
};
```

`playfieldRevision` changes when meaningful visual gameplay output changes. It is not a frame counter by itself; a static shell cannot pass gameplay checks only by incrementing it.

### 5.2 PlayerSummary

```typescript
type PlayerSummary = {
  screenX: number;
  screenY: number;
  arenaX: number;      // normalized 0..1 position inside the playable arena
  arenaY: number;      // normalized 0..1 position inside the playable arena
  size: number;
  sizeBand: "tiny" | "small" | "medium" | "large" | "huge";
  speed: number;
  speedBand: "idle" | "normal" | "boost";
  facing: "left" | "right" | "up" | "down" | "diagonal" | "unknown";
  protected: boolean;
  boosting: boolean;
  alive: boolean;
};
```

### 5.3 HudSummary

```typescript
type HudSummary = {
  visible: boolean;
  sizeShown: number | null;
  survivalSeconds: number;
  kills: number;
  rank: number | null;
  totalRanked: number | null;
  bestSize?: number | null;
  feedback: {
    eatRevision: number;
    boostRevision: number;
    collisionRevision: number;
    deathRevision: number;
  };
};
```

HUD values must stay synchronized with the visible run state. The contract does not require exact display wording.

### 5.4 WorldSummary

```typescript
type WorldSummary = {
  arenaBoundsVisible: boolean;
  entityCounts: {
    foodVisible: number;
    movingFoodVisible: number;
    aiVisible: number;
    smallerTadpolesVisible: number;
    largerThreatsVisible: number;
    softObstaclesVisible: number;
    hardObstaclesVisible: number;
    giantPredatorsVisible?: number;
  };
  visibleFood: Array<{
    targetId: string;
    screenX: number;
    screenY: number;
    moving: boolean;
    valueBand: "small" | "medium" | "large";
    reachable: boolean;
  }>;
  visibleTadpoles: Array<{
    targetId: string;
    screenX: number;
    screenY: number;
    relationToPlayer: "smaller" | "similar" | "larger";
    moving: boolean;
    protected: boolean;
  }>;
  visibleObstacles: Array<{
    targetId: string;
    screenX: number;
    screenY: number;
    kind: "soft" | "hard" | "boundary";
    reachable: boolean;
  }>;
  worldMotionRevision: number;
  aiInteractionRevision: number;
};
```

`targetId` is a public semantic handle valid for the current snapshot only. It must not expose private array indexes or source object names.

### 5.5 HelperDisplaySummary

```typescript
type HelperDisplaySummary = {
  mode: "leaderboard" | "minimap" | "blank";
  leaderboardVisible: boolean;
  minimapVisible: boolean;
  blankVisible: boolean;
};
```

### 5.6 LevelSummary

```typescript
type LevelSummary = {
  selectedIndex: number | null;
  availableCount: number;
  unlocked: number[];
  completed: number[];
  objectiveType: "none" | "survive" | "reachSize" | "eatTadpoles";
  objectiveProgress: number;
  objectiveTarget: number | null;
  objectiveComplete: boolean;
};
```

### 5.7 EventSummary

```typescript
type EventSummary = {
  season?: "spring" | "summer" | "fall" | "winter" | "none";
  fogActive?: boolean;
  pressureVisible?: boolean;
  foodScarcityBand?: "normal" | "scarce" | "unknown";
  giantPredatorActive?: boolean;
};
```

Optional P2 events may use `"none"` or omit fields when unsupported.

### 5.8 ActionResult

```typescript
type ActionResult = {
  ok: boolean;
  reason?: "invalid_phase" | "locked_level" | "unsupported_optional_feature" | "target_missing" | "not_reachable" | "too_small" | "no_direction" | "already_terminal" | "unknown_action";
  triggered?: string[];
};
```

`ok: true` is never sufficient evidence by itself. A valid action must also produce the observable postconditions declared below.

## 6. Feature Contract Matrix

| GDD feature | Contract trigger | Snapshot/output fields | Observable postcondition |
|---|---|---|---|
| M1 Entry and state shell | `reset`, `pressControl(startEndless)`, `pressControl(pause/resume/returnMenu)` | `phase`, `activePanel`, `overlayBlocking`, `canInteractWithPlayfield`, `render.playfieldVisible` | Starting play hides blocking menu and enables playfield; pause blocks play and freezes updates; returning to menu clears transient run state |
| M2 Directional swimming | `holdDirection`, `pointTo`, `dragJoystick`, then release | `player.screenX/Y`, `player.facing`, `player.speedBand`, `render.playfieldRevision` | Held input moves in matching visible direction; opposite directions create opposite screen trends; release stops active propulsion |
| M3 Boost tradeoff | `holdDirection` + `holdBoost`, then `releaseBoost`; invalid boost without direction | `player.boosting`, `player.speedBand`, `player.size`, `hud.feedback.boostRevision`, `lastAction.reason` | Boost increases movement trend and feedback while size decreases; release stops cost; no-direction or too-small boost is rejected or has no free benefit |
| M4 Food growth | `near_food` + `swimToVisibleTarget(food)` | `player.size`, `world.entityCounts.foodVisible`, `hud.feedback.eatRevision`, `render.playfieldRevision` | Contact consumes/replaces food, increases visible size, and updates HUD/feedback; non-contact does not count |
| M5 Predator/prey combat | `near_smaller_tadpole` or `near_larger_threat` + movement/contact action | `player.size`, `hud.kills`, `player.alive`, `result`, `hud.feedback.deathRevision`, `world.aiInteractionRevision` | Eating smaller target grows player and increments kills; larger contact after protection causes death feedback and respawn path, never both reward and death |
| M6 AI ecosystem | `ai_activity` + `wait` or approach | `world.worldMotionRevision`, `world.aiInteractionRevision`, `visibleTadpoles[].moving`, `hud.rank` | Rival tadpoles visibly move, interact with food/prey/threats, affect ranking, and stay legal in arena |
| M7 Boundaries and obstacles | `near_boundary`, `near_soft_obstacle`, `near_hard_obstacle` + swim toward target | `player.arenaX/Y`, `hud.feedback.collisionRevision`, `world.visibleObstacles`, `render.playfieldRevision` | Player remains inside arena; soft obstacles can be displaced; hard obstacles block/bounce so route changes |
| M8 HUD and progress feedback | Play, eat, wait, kill, die, change helper display | `hud.visible`, `hud.survivalSeconds`, `hud.kills`, `hud.rank`, `hud.sizeShown`, `helperDisplay` | HUD reflects run state after gameplay changes and helper modes do not break core play |
| M9 Death, feedback, respawn | `near_larger_threat` + contact after protection | `phase`, `result`, `player.size`, `player.protected`, `hud.survivalSeconds`, `hud.kills`, `hud.feedback.deathRevision` | Death feedback appears once, run size/time/kills reset, player respawns small with protection |
| M10 Growth level mode | `level_select`, `selectLevel`, objective-progress actions, `retryLevel`, `nextLevel` | `mode`, `level.*`, `phase`, `activePanel`, `canInteractWithPlayfield` | Unlocked levels start; locked levels reject; objective progress can complete a level; completion freezes play and updates progression |
| M11 Auxiliary display/settings | `setHelperDisplay`, settings controls | `helperDisplay.*`, `overlayBlocking`, `canInteractWithPlayfield` | Leaderboard/minimap/blank helper changes visibly; settings overlay opens/closes without mutating core run state |
| M12 Environmental pressure | `environment_pressure_pending` + `wait` or long-run actions | `events.*`, `world.entityCounts`, `render.playfieldRevision`, `player.speedBand` | Optional season/fog/predator pressure is visible and tied to movement, food scarcity, visibility, or late threat; no silent rule change |
| M13 Atmosphere/depth | Longer play, optional toggles, P2 scenarios | `render.playfieldRevision`, `world.worldMotionRevision`, feedback revisions | Atmosphere/particles/audio-equivalent feedback can enrich play but cannot replace P1 food, AI, collision, HUD, or death observability |

## 7. External Postconditions

- In `phase === "playing"`, no active panel may block swim input: `overlayBlocking === false` and `canInteractWithPlayfield === true`.
- In `phase === "paused"` or terminal result states, playfield input is blocked and `wait` must not advance player movement, AI movement, food respawn, survival time, boost cost, or objective progress except for visible UI feedback.
- The primary playfield must be visible and nonblank during playing, with the player, food, AI, arena boundaries, and relevant obstacles/events observable through render summary and/or semantic snapshot fields.
- Real player controls and `__gameTest.input` must agree on downstream state: an implementation cannot pass by updating only the adapter snapshot while leaving visible play unchanged.
- HUD/progress fields must change after the corresponding player action and remain stable when the action is invalid or rejected.
- Terminal or feedback states must not allow repeated scoring, repeated death credit, repeated level completion, or hidden progression without a new legal run/action chain.

## 8. Rejection And Invariant Rules

- Swimming, boosting, food contact, prey eating, death, and objective progress are rejected or unchanged from menu, level select, settings-only, score-only, paused, or terminal states.
- Invalid target handles are rejected with `target_missing` or equivalent and must not mutate size, kills, result, objective progress, or persistent progression.
- Locked growth levels remain unavailable and do not enter playing.
- Boost without movement direction cannot increase speed for free and cannot drain size as if a valid boost happened unless movement is active.
- Food and prey cannot be credited without a player-triggered approach/contact path from a legal precondition.
- Being eaten requires a larger threat, contact, and no active protection. Protection prevents immediate repeat death after respawn.
- Arena bounds keep normalized player position in `0..1` for both axes after settling.
- Persistent best score or completed level data may survive reset; transient run fields such as size, survival time, kills, active boost, protection timer, current objective progress, and blocking overlays must reset appropriately for a new run.

## 9. Anti-Cheat Contract Boundaries

- The public adapter must not expose direct setters for size, score, kills, rank, death, respawn, protection, boost effect, food collection, AI collision, obstacle collision, objective progress, level completion, or persistent progress.
- A scenario must not begin with the postcondition under test already applied. Food, prey, threat, boundary, obstacle, boost, and objective scenarios are legal preconditions only; the visible result must come from the later player-level action chain.
- Tests must not pass from `{ ok: true }`, static text, element presence, frame counters, private object names, source identifiers, exact pixels, fixed spawn coordinates, fixed physics constants, or hidden adapter-only state.
- Every core check must follow `trigger -> observable result`: a legal precondition, player-level input or time passage, a public snapshot/render/HUD delta, and an invariant or rejection that prevents empty-shell success.

## 10. Self Review

- This TDD defines only public interface, player-level actions, legal scenarios, stable snapshot fields, feature mapping, and external postconditions.
- The scenarios are legal preconditions and identify the action family that must trigger the observable result; none starts with an already-awarded reward, death, collision, boost effect, or completed objective.
- Every P1 mechanism from the GDD has a trigger-to-observable-result path, and P2 mechanisms are represented as optional contract surfaces with explicit unsupported handling.
- The document avoids private source names, internal function/class names, DOM selectors, CSS details, fixed canvas size, fixed coordinates, fixed artwork/audio, exact UI copy, and algorithmic constants.
