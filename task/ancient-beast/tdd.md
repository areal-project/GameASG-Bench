# Ancient Beast Public Test Contract

## 1. Purpose

The implementation exposes `window.__gameTest` solely as a player-level test boundary. It reports observable tactical state and accepts the same semantic decisions a player can make. It must not expose private objects or offer direct setters for health, resources, damage, score, victory, queue order, or unit position.

## 2. Required methods

- `window.__gameTest.reset(options?)`: clears the previous match and returns a menu or fresh local-battle snapshot. Supported options may include `{ mode: "local" | "practice" }`.
- `window.__gameTest.getSnapshot()`: returns the current snapshot without changing game state.
- `window.__gameTest.input(action)`: attempts one public action and returns `{ ok, accepted, reason?, snapshot }`. Rejections use `ok: true`, `accepted: false`, and a stable reason category; malformed requests may use `{ ok: false, accepted: false, reason }`.
- `window.__gameTest.loadScenario(name, options?)`: loads a declared legal precondition. It cannot preload a win, set arbitrary values, directly damage a unit, or bypass the action rules.

Methods may be synchronous or Promise-returning. Returned data must be JSON-serializable.

## 3. Public action schemas

All board targets come from semantic targets advertised by the current snapshot; tests never invent coordinates.

| Action | Shape | Meaning |
|---|---|---|
| Start | `{ type: "startBattle", mode: "local" | "practice" }` | Follow the normal start path. |
| Hover | `{ type: "hoverTarget", targetId }` | Preview an advertised grid cell or unit. |
| Direction focus | `{ type: "focusDirection", direction: "left" | "right" | "up" | "down" }` | Move tactical focus one discrete screen direction. |
| Select unit | `{ type: "selectUnit", unitId }` | Select a visible unit for inspection or a legal action. |
| Move | `{ type: "move", targetId }` | Confirm an advertised legal movement target. |
| Select ability | `{ type: "selectAbility", abilityId }` | Enter targeting for an available ability. |
| Use ability | `{ type: "useAbility", abilityId, targetId }` | Confirm an advertised legal target and resolve normally. |
| Select summon | `{ type: "selectSummon", summonId }` | Enter summon placement preview. |
| Summon | `{ type: "summon", summonId, targetId }` | Confirm an advertised affordable placement. |
| Wait | `{ type: "wait" }` | Move the current unit to its legal later queue position. |
| End turn | `{ type: "endTurn" }` | End the current unit action and advance the queue. |
| Panel | `{ type: "openPanel", panel: "unit" | "score" | "settings" | "chat" }`, `{ type: "closePanel" }` | Open/close a player-facing overlay. |
| Restart | `{ type: "restart" }` | Restart only through the result flow. |
| Optional setting | `{ type: "toggleSetting", setting: "audio" | "fullscreen" }` | Toggle an exposed P2 setting or reject as unsupported. |
| Shortcut key equivalent | Real keyboard Escape/Space/Enter/QWER or `{ type: "shortcut", key }` when implemented | Trigger the same public cancel/confirm/ability-selection semantics as visible controls, or reject/ignore safely when unsupported. |

## 4. Scenario catalog

- `local_battle_ready`: normal 1v1 battle with the first current unit ready.
- `movement_choice_ready`: current unit has at least one legal and one invalid/blocked semantic movement target.
- `ability_target_ready`: an available damaging ability has a legal living target and sufficient cost resource.
- `summon_choice_ready`: current core unit has an affordable candidate and legal placement.
- `summon_cap_reached`: normal team composition is at the configured summon cap.
- `queue_wait_ready`: at least two living units are in the actionable queue and the current unit may wait.
- `non_current_unit_ready`: exposes both current and non-current selectable units.
- `victory_one_action_away`: a legal advertised ability can kill the final opposing combat-capable unit through normal damage resolution.
- `panel_ready`: battle is interactive and at least one closable blocking panel is available.
- `drop_pickup_ready`, `ability_upgrade_ready`, `optional_services_ready`: P2 legal preconditions; implementations may return a documented unsupported rejection when the optional feature is omitted.

## 5. Snapshot schema

The root contains:

- `schemaVersion: 1`, `ready: boolean`.
- `screen: "menu" | "battle" | "result" | "loading"`; `phase: "menu" | "turnReady" | "targeting" | "resolving" | "waiting" | "result"`.
- `mode: "none" | "local" | "practice"`; `canInteract: boolean`.
- `board: { visible, gridType, bounds, focusTargetId, hoverTargetId, previewKind, revision, semanticTargets }` where bounds are screen-space and `gridType` identifies a hex board.
- `board.semanticTargets: [{ id, kind, screenX, screenY, blocked, occupiedUnitId?, legalFor? }]` advertises public target handles with runtime screen-space points for real pointer tests. `kind` is a product-level category such as `"cell" | "unit" | "move" | "ability" | "summon" | "panel"`; `legalFor` may list public action categories such as `"hover"`, `"move"`, `"ability"`, or `"summon"`. These points are semantic runtime geometry, not fixed coordinates, and must come from the same rendered board state used by the player.
- `turn: { round, currentUnitId, currentPlayerId, queueUnitIds, queueRevision }`.
- `units: [{ id, playerId, alive, current, core, health, maxHealth, energy, maxEnergy, screenX, screenY, occupiedTargetIds, statusIds }]`.
- `resources: [{ playerId, summon, summonCap, summonedCount, score }]`.
- `abilities: [{ id, available, cost, targetKind, legalTargetIds }]` for the current unit.
- `summons: [{ id, affordable, cost, size, legalTargetIds }]` for the current player.
- `targets: { hoverableIds, legalMoveIds, invalidMoveIds, occupiedIds }`.
- `feedback: { lastAction, accepted, rejectionReason, damageRevision, movementRevision, summonRevision, statusRevision, messageRevision }`.
- `panel: { active, blocking, closable }`.
- `result: { terminal, winnerPlayerId, scores, kills, survivors, revision }`.
- `optional: { dropsSupported, upgradesSupported, chatSupported, onlineSupported, settingsSupported, audioSupported, shortcutSupported, drops, upgradeRevision, shortcutRevision, chatOpen, onlineState, audioEnabled, audioRevision }`.

Health, energy, summon resources, counts, costs, scores, and revisions are finite numbers. Health and energy stay within `[0, max]`; summon resources and counts never become negative.

## 6. Trigger-to-observable contracts

| Feature | Trigger | Observable postcondition |
|---|---|---|
| Start | `startBattle` or real start control | `screen=battle`, hex board visible, current unit and queue present, menu no longer blocks. |
| Hover/focus | hover target or opposite direction inputs | hover/preview changes; left/right produce opposite `screenX` deltas and up/down opposite `screenY` deltas, without moving a unit. |
| Move | advertised `legalMoveIds` target | current unit occupied target and movement revision change; queue identity remains current unless rules end the action. |
| Ability | advertised ability and legal target | cost resource decreases by the declared cost and target health/status changes; damage feedback advances. |
| Summon | affordable candidate and advertised placement | summon resource decreases by cost; living unit and queue membership increase without illegal overlap. |
| Wait/end | normal wait or end action | queue revision advances and current unit/order changes consistently. |
| Kill/victory | legal ability from `victory_one_action_away` | target becomes dead and cannot act; result becomes terminal, winner/summary appears, later battle actions reject. |
| Restart | restart from result | terminal/result state clears; old transient revisions/entities do not remain as active match state. |
| Panel | real or semantic open then background action | blocking panel is visible; background action rejects or leaves battle unchanged; close restores interaction. |
| Optional depth | P2 legal scenario and normal action | supported features change their advertised summary; unsupported features reject without blocking battle. |
| Shortcuts/audio | real Escape/Space/Enter/QWER or audio toggle | Shortcut keys change selection/cancel/confirm feedback without out-of-turn mutation; audio controls change audio summary or explicitly reject and remain closable. |

## 7. Invariants and anti-cheat

- Invalid movement, target, summon, non-current-unit action, dead-unit action, resolving-state duplicate, panel-blocked action, and terminal action return a rejection envelope.
- A rejected action preserves unit positions/health, queue order, resources, score and result revision.
- Scenario options may choose a documented mode but cannot accept arbitrary state, direct outcomes, direct damage, direct score, direct resource, direct position, or direct queue mutation.
- Dead units are absent from actionable queue entries. Terminal state freezes scoring and combat revisions until `restart`.
- Semantic target IDs are opaque public handles valid only for the snapshot that advertised them; tests do not rely on fixed coordinates or private identifiers.
