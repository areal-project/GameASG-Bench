# Super Screw TDD Public Contract

## Scope

This file defines the public, portable test contract for Super Screw. It only covers player-level actions, legal scenario setup, stable observable snapshots, and external postconditions derived from `game-spec.md` and `design-doc.md`.

The contract must not expose private game objects, source function names, source element names, fixed screen coordinates, rendering internals, physics formulas, asset names, exact UI text, or a required DOM structure. Implementations may choose any rendering and UI architecture as long as the public contract and player-visible behavior are satisfied.

## Public Test Adapter

Implementations should expose:

```javascript
window.__gameTest = {
  reset(options?): Snapshot,
  loadScenario(name, options?): Snapshot,
  input(action): Snapshot,
  getSnapshot(): Snapshot
}
```

### Method Semantics

- `reset(options?)` starts a clean app session at the boot or first playable entry state. It clears transient state such as selected screw, active hint, active tool, blocking panels, victory effects, and in-flight animation summaries. It must not erase long-term progress unless `options.clearProgress === true`.
- `loadScenario(name, options?)` loads only a legal precondition described in this file. It must not directly award victory, directly clear all boards, directly grant rewards, directly consume tools for the tested result, directly damage or remove pieces for the tested result, or bypass the player action that the test is about to verify.
- `input(action)` performs one player-level action or a small semantic player command. It returns a fresh snapshot after the action is accepted, rejected, or queued.
- `getSnapshot()` returns a stable public summary of the current player-visible state. It must be read-only and must not advance gameplay except for normal elapsed-time animations already running in the game.

All methods should return a `Snapshot` object directly, or an object with `{ ok, snapshot, reason? }`. Returning `{ ok: true }` without observable snapshot changes is not enough for a passing behavior contract.

## Action Schema

Actions are semantic equivalents of real player inputs. Tests may use them for contract checks and may also use `Snapshot` geometry to dispatch real mouse/touch/key events.

Every action object uses a `type` field matching the action name, for example `{ type: "tapScrew", screwId: "..." }`.

| Action | Required fields | Semantics |
|---|---|---|
| `start` | none | Press the start control from the boot/menu state and enter the current playable level. |
| `tapScrew` | `screwId` | Tap a currently visible screw. In idle state this begins screw selection/unscrewing. In floating state, tapping a different screw queues a switch after the current screw returns. |
| `tapHole` | `holeId` | Tap a visible hole. If a screw is floating and the hole is legal, this places the screw there. If it is the original hole, this cancels by returning the screw. |
| `tapBlank` | optional `point` from `snapshot.playfield.blankPoint` | Tap a visible non-interactable area of the playfield. |
| `tapPart` | `partId` | Tap a visible board/part. This is meaningful while the tool mode is active. |
| `control` | `control` value | Activate a visible semantic control. Candidate values: `restart`, `undo`, `hint`, `tool`, `nextLevel`, `replayLevel`, `levelSelect`, `settings`, `leaderboard`, `closePanel`, `toggleMusic`, `toggleSfx`. |
| `selectLevel` | `level` | Choose a level from the level-select panel. The level must be visible in the panel summary. |
| `key` | `key` value | Keyboard convenience action. Candidate values: `restart`, `undo`, `cancel`. It must not bypass puzzle rules. |
| `wait` | `until` or `ms` | Let visible animations settle. Candidate `until` values: `ready`, `floating`, `idle`, `pieceMotion`, `victory`, `panel`, `hintExpired`. |

Rejected actions should leave core puzzle state unchanged and expose a rejection signal through `lastFeedback`, `lastAction`, `revision` stability, or an equivalent snapshot summary.

## Scenario Schema

Scenarios are legal preconditions. Each scenario must be reachable by ordinary player-level actions from `reset()` and must still require player action to produce the postcondition under test.

| Scenario | Legal precondition | Reachable by player-level actions | Must not pre-apply |
|---|---|---|---|
| `boot_menu` | App is loaded at the start/menu screen. | `reset()` with no `start` action. | No level interaction, no selected screw, no victory. |
| `level_start` | A playable level is loaded with at least one visible screw, one visible empty hole, and at least one uncleared part. | `reset()` then `start`, or selecting an unlocked level. | No selected screw, no completed move, no cleared final board. |
| `tutorial_start` | First-level tutorial is active and points at the first required screw/hole step. | Clear progress, then `start` on level one. | No tutorial completion and no completed tutorial move. |
| `screw_floating` | A visible screw has been selected and is floating above its source hole; at least one target summary is available. | `level_start` then `tapScrew` and `wait({until:"floating"})`. | No screw placement, no board release. |
| `valid_move_available` | A screw can be selected and at least one currently legal empty hole is visible. | `level_start` or later idle puzzle state after legal moves. | No direct movement; the next `tapScrew`/`tapHole` must cause the move. |
| `blocked_hole_available` | A visible empty hole is blocked or otherwise illegal while at least one screw can be selected. | Normal play where a part covers or dynamic part blocks a hole. | No accepted illegal placement. |
| `release_candidate` | A legal screw move can change at least one part's support summary from stable to moving, blocked, falling, or cleared. | A sequence of valid screw moves from `level_start`, or an equivalent legal level start chosen for this property. | No pre-released or pre-cleared target part. |
| `undo_available` | Exactly one or more valid moves have already been made and the game is idle. | `valid_move_available` followed by a valid `tapScrew`/`tapHole` chain and settle. | No direct undo result. |
| `tool_available` | Tool control is visible, has positive uses, and at least one processable part remains. | Start or select a level where tools are unlocked and uses remain. | No consumed tool use and no pre-smashing target part. |
| `tool_empty_or_blank` | Tool mode can be activated, and there is a blank playfield point or zero-use state for rejection. | Normal play with tool visible; zero-use may be reached by legitimate prior tool uses or a legal resource state. | No tool effect when testing rejection. |
| `near_completion` | The level has at least one remaining part and at least one legal player action that can lead to victory after normal animations. | A sequence of valid moves or tool uses from `level_start`. | No victory panel, no already empty puzzle, no pre-awarded progress. |
| `panel_open` | A settings, level-select, or leaderboard panel is open over an otherwise legal current level. | From `level_start`, activate the corresponding panel control. | No level mutation caused by opening the panel. |

Victory is not a loadable setup scenario. It must be reached from `near_completion` through legal player-level actions before terminal-lock behavior is checked.

## Snapshot Schema

The snapshot is a stable public summary. It may include more fields, but these fields and vocabularies are the portable contract.

```javascript
{
  phase: "boot" | "menu" | "playing" | "animating" | "panel" | "victory",
  screen: "home" | "level" | "settings" | "levelSelect" | "leaderboard" | "victory",
  result: "none" | "win",
  overlayBlocking: boolean,
  canInteractWithPlayfield: boolean,
  revision: number,
  visualRevision: number,
  lastAction: {
    accepted: boolean,
    type: string,
    reason?: "invalidTarget" | "blocked" | "busy" | "locked" | "noUndo" | "noHint" | "noTool" | "panelBlocking" | "none"
  },
  feedback: {
    selection?: boolean,
    placement?: boolean,
    rejection?: boolean,
    hint?: boolean,
    tool?: boolean,
    pieceRelease?: boolean,
    victory?: boolean
  },
  level: {
    current: number,
    total: number,
    unlocked: number[],
    completedMax?: number
  },
  playfield: {
    bounds: { x: number, y: number, width: number, height: number },
    blankPoint?: { x: number, y: number }
  },
  controls: {
    start?: "visible" | "hidden" | "disabled",
    restart?: "visible" | "hidden" | "disabled",
    undo?: "visible" | "hidden" | "disabled",
    hint?: "visible" | "hidden" | "disabled",
    tool?: "visible" | "hidden" | "disabled" | "active",
    nextLevel?: "visible" | "hidden" | "disabled",
    replayLevel?: "visible" | "hidden" | "disabled",
    levelSelect?: "visible" | "hidden" | "disabled",
    settings?: "visible" | "hidden" | "disabled",
    leaderboard?: "visible" | "hidden" | "disabled"
  },
  puzzle: {
    screwCount: number,
    holeCount: number,
    emptyHoleCount: number,
    partCount: number,
    remainingPartCount: number,
    moves: number,
    canUndo: boolean,
    busy: boolean
  },
  screws: [
    {
      id: string,
      state: "installed" | "selected" | "floating" | "moving" | "hidden",
      screenX: number,
      screenY: number,
      originHoleId?: string,
      targetHoleId?: string
    }
  ],
  holes: [
    {
      id: string,
      state: "occupied" | "empty",
      legalTarget: boolean,
      blocked: boolean,
      screenX: number,
      screenY: number
    }
  ],
  parts: [
    {
      id: string,
      state: "stable" | "swinging" | "blocked" | "falling" | "cleared",
      screenX: number,
      screenY: number,
      visible: boolean,
      support: "multi" | "single" | "none" | "unknown"
    }
  ],
  tutorial: {
    active: boolean,
    step?: "selectScrew" | "placeScrew" | "complete",
    targetScrewId?: string,
    targetHoleId?: string
  },
  hint: {
    active: boolean,
    targetHoleIds: string[]
  },
  tool: {
    active: boolean,
    uses: number,
    recovery?: "none" | "pending",
    processablePartIds: string[]
  },
  panels: {
    active: "none" | "settings" | "levelSelect" | "leaderboard" | "victory",
    levelOptions?: [
      { level: number, state: "current" | "unlocked" | "locked" }
    ],
    settings?: {
      music: "on" | "off",
      sfx: "on" | "off"
    }
  }
}
```

### Snapshot Stability Rules

- `revision` changes only after accepted gameplay state changes such as screw movement, undo, restart, tool effect, level load, or victory transition.
- `visualRevision` may change after visible animation, particle, hint, panel, or canvas/playfield updates.
- `screenX`/`screenY` values are semantic runtime positions for real input dispatch. They are not fixed coordinates and may vary with layout.
- `id` values are stable only within a scenario/session. They are public semantic identifiers, not private implementation identifiers.
- `puzzle.screwCount` should remain conserved across ordinary valid screw moves. It may decrease only when a declared tool effect removes fixed support as part of processing a part.

## Feature Contract Matrix

| GDD feature | Contract trigger | Required observable result | Rejection / invariant |
|---|---|---|---|
| M1 Boot and level entry | `reset()` then `input({type:"start"})` | `phase` becomes `playing` or `animating`; `screen` is `level`; playfield has visible screws, holes, and parts; start screen is not blocking playfield. | `overlayBlocking` is false for normal play; playfield is non-empty. |
| M2 Screw selection and floating | `tapScrew` on an installed visible screw, then wait for floating | One screw changes to `selected`/`floating`; it remains near its source hole by semantic position; legal target holes become observable. | While `puzzle.busy` or an animation phase is active, unrelated playfield taps do not change `revision`. |
| M3 Legal hole placement | From `screw_floating`, `tapHole` on a `legalTarget` empty hole, then settle | Origin hole becomes empty, target hole becomes occupied, selected screw returns to installed state at target, `moves` and `revision` increase, visual feedback occurs. | Exactly one screw move is recorded; ordinary move preserves screw count. |
| M4 Cancel, blank, illegal, and switch handling | From `screw_floating`, tap original hole, blank point, blocked hole, or another installed screw | Original-hole tap returns screw without a move; blank/blocked tap leaves puzzle unchanged with rejection feedback; another screw eventually selects the new screw after returning the old one. | Illegal placement does not change hole occupancy, moves, or part support. |
| M5 Part support and release | From `release_candidate`, complete the declared valid move and wait for piece motion | At least one part changes support/state toward `swinging`, `blocked`, `falling`, or `cleared`; playfield visual evidence changes. | Remaining screws can block or redirect moving parts; parts are not simply hidden without a state/visual transition. |
| M6 Victory loop | From `near_completion`, perform the required legal action sequence and settle | `result` becomes `win`, `phase`/`screen` show victory, victory feedback appears, next/replay controls are available. | Ordinary `tapScrew`, `tapHole`, and `tapPart` do not mutate puzzle after victory. |
| M7 Restart and undo | After valid move, `control:undo`; from any level, `control:restart` or `key:restart` | Undo restores the previous legal arrangement and reduces `canUndo` when history is exhausted; restart restores initial level summary and clears transient states. | Empty undo is rejected without puzzle mutation. Restart clears selected screw, hint, active tool, busy state, and victory feedback. |
| M8 Tutorial and hint | In `tutorial_start`, tap wrong then right targets; in level play use `control:hint` | Wrong tutorial target does not advance or mutate key state; right target advances tutorial. Hint exposes one or more target holes or rejects when none exists. | Hint does not move screws, clear parts, consume undo, or complete the level by itself. |
| M9 Tool system | From `tool_available`, activate tool and tap a processable part | Tool active state is visible; a valid part tap consumes one use, produces tool feedback, changes part/support summary, and may trigger release. | Blank tap cancels tool without consumption; zero uses or unavailable tool rejects without effect. |
| M10 Progress and level select | After victory, `nextLevel`; from panel choose unlocked/locked levels | Next/replay/level-select load legal level states. Unlocked levels are selectable; locked levels are observable as locked. | Locked level selection is rejected and does not replace the current level. Level changes clear transient play state. |
| M11 Panels and settings | Open/close settings, level select, or leaderboard panel | `panels.active` and `overlayBlocking` reflect the panel; playfield input is blocked while panel is open; closing restores the prior level state. Settings toggles change public on/off summaries. | Opening or closing panels does not move screws, clear parts, or consume tools. |
| M12 P2 presentation/long-term systems | Open leaderboard or observe enhanced feedback after core actions | Optional richer feedback may update `visualRevision`, ranking summary, or recovery state. | Absence of P2 presentation cannot block P1 play, victory, restart, or progress. |

## External Postconditions

- Primary playfield must be visibly non-empty in playable states. A snapshot-only game with no visible screws/holes/parts fails the contract.
- Real mouse/touch taps should be possible at `screws[].screenX/screenY`, `holes[].screenX/screenY`, `parts[].screenX/screenY`, and `playfield.blankPoint` when those fields are present.
- A visible blocking panel must set `overlayBlocking === true` and `canInteractWithPlayfield === false`; normal playing state must not keep a menu or panel over the playfield.
- HUD or equivalent visible UI must reflect current level, available controls, active tool/hint/tutorial/victory states, and locked/unlocked level choices.
- Canvas, DOM, or equivalent rendered playfield evidence should change after accepted screw selection, placement, part release, tool effect, and victory. The exact art, colors, text, and animation timing are not fixed.
- Rejection feedback must be externally observable through `lastAction`, `feedback.rejection`, visible UI feedback, sound state summary, or `visualRevision`, while core puzzle state remains stable.

## Scenario Triggerability Requirements

Tests must not call `loadScenario()` and immediately assert the target outcome. Each scenario must be followed by the player-level action family that produces the observable result:

- Screw selection: `tapScrew` -> selected/floating result.
- Placement: `tapScrew` -> wait floating -> `tapHole(legalTarget)` -> move/result.
- Illegal placement: `tapScrew` -> wait floating -> `tapHole(blocked or non-legal)` -> rejected invariant.
- Part release: legal screw movement or valid tool use -> part state/visual change.
- Victory: legal final screw movement or valid tool use -> settle -> victory state.
- Undo: create at least one valid move through player-level actions or load `undo_available`, then `control:undo` -> restored state.
- Tool: `control:tool` -> `tapPart(processable)` or `tapBlank` -> effect or cancellation.
- Panel blocking: `control:settings|levelSelect|leaderboard` -> panel state, then playfield tap rejected until close.

## Forbidden Test and Adapter Behavior

- Do not expose or require private functions, closure variables, source object names, source IDs, source selectors, CSS classes, exact strings, asset names, or file layout.
- Do not require a fixed canvas size, fixed coordinate, fixed pixel color, fixed physics constant, fixed animation duration, or a specific rendering tree.
- Do not provide actions that directly set score, victory, level completion, screw ownership, board clearance, tool effect, tutorial completion, or progress.
- Do not let `loadScenario()` create an already victorious board for victory tests, an already smashed part for tool tests, an already moved screw for placement tests, or an already rejected illegal action for rejection tests.
- Do not pass core mechanisms by checking static text or fixed counts alone. Every P1 mechanism must be tested as trigger -> observable result -> invariant/rejection where applicable.

## Review Notes

- This TDD derives its gameplay surface from `game-spec.md` and `design-doc.md`: click/touch screw movement, legal/blocked holes, part release physics summaries, victory/progress, undo/restart, tutorial/hint, tool use, panel blocking, and optional long-term presentation.
- The contract contains only player-visible systems and input paths already present in the prerequisite gameplay documents. No private implementation names, implementation-specific function contracts, fixed coordinates, exact text, or asset requirements are included here.
- All scenarios are legal preconditions and identify the player-level action family that must trigger the tested result.
