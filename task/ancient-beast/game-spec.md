# Ancient Beast Gameplay Requirements

## 1. Game Positioning

Ancient Beast is a turn-based hex-grid strategy battle game with a dark sci-fi style. Each player controls a core priest unit and uses resources to summon beasts of different factions, sizes, and ability roles, taking turns on a shared battlefield to move, attack, use abilities, wait, or end turns. The goal is to defeat the enemy faction under the pressure of limited resources and action order, then provide clear victory, defeat, and scoring feedback at the end based on kills, survival, battlefield control, and efficiency.

The P1 core experience must be a fully playable local 1v1 battle or practice match against the computer: players can enter the battlefield; see the hex grid and both sides' initial core units; take unit turns according to the action queue; move and use abilities; summon beasts; deal damage or score kills; end turns; trigger the endgame; and restart. P2 depth includes 2v2, online lobbies and matchmaking, more unit combinations, drops, ability upgrades, detailed scoring items, replays/logs, chat, audio, fullscreen, and other supporting experiences.

## 2. Core Loop

1. The player selects a battle mode and rule options from the menu and starts a battle.
2. The battlefield displays the hex grid, both factions, the action queue, the current acting unit, resources/health/energy, and available abilities.
3. The current unit is clearly marked, and the player observes its movement range, target range, remaining resources, and queue position.
4. The player clicks or touches a valid hex to move, or selects an ability and then clicks/touches a target unit, target hex, or target area to use it.
5. Visible feedback must appear after an action: the path preview disappears and movement plays, the unit faces the target, health/energy/resource bars change, the target is hit or its status changes, the queue updates, and a log or prompt explains the change in the battle state.
6. During the same turn, the player may continue using abilities that remain available, or choose to wait, delay, or end the turn. After the turn ends, the queue advances to the next unit; after a round's queue is exhausted, the next round begins.
7. When one faction is defeated, a player concedes, time expires, or the connection fails, the game enters the results state, displays victory or defeat, score sources, a survival/kill summary, and paths to restart or return to the menu.

## 3. Menu, Modes, and Rule Options

P1: The menu must provide a path to start a local 1v1 match and allow at least one player to be computer-controlled so a single player can complete the core loop. After the match starts, the menu must not block battlefield input, and the loading state must transition into an interactive battle state.

P1 rule options must at least represent: the number of players in the battle, which seats are player-controlled, the initial amount of summon resources, the maximum number of summoned units each side may control simultaneously, and whether turn time or total time is enabled. Adjustments to these options should be visible after the match begins through resources, unit limits, timer displays, or turn rules.

P2 modes include 2v2, creating/joining online rooms, matchmaking queues, an entry point for bot practice, chat, copying/entering room codes, fallback after connection failure, and results after disconnection. If online functionality is omitted, local hot-seat play and practice against the computer must explicitly remain available; online entry points must not be the only way to start.

P2 settings include audio toggles, fullscreen, device-orientation adaptation, saving/replaying the most recent battle process, and special rule toggles. They may be omitted, but if an entry point appears, it must produce a visible state change or rejection feedback.

## 4. Battlefield and Units

The battlefield is a horizontally presented tactical hex grid. A unit occupies one or more contiguous hexes, and its size affects occupancy, passability, hit range, and the effects of certain abilities. Hexes can display different tactical information, such as movable, selectable, hovered, unreachable, target range, path preview, summon preview, traps, or drops.

Each player initially has one core priest unit. The core priest summons beasts and can also attack, protect, or consume special resources. Summoned beasts have different health, energy, movement, active/passive abilities, sizes, faction tags, and possible drops. P1 must provide at least several summonable units with different roles and demonstrate at least two types of differences among melee damage, ranged/area abilities, larger size, or special movement; P2 may expand to complete factions and a large unit pool.

When a unit's health falls to zero, it must be removed from the battlefield and action queue or clearly enter a dead state, and its kill, faction defeat, or drops must be resolved. The death of a core priest or the elimination of an entire team should cause the corresponding player to lose the ability to continue fighting; in 1v1, the match enters the endgame when one side loses the ability to fight, while in 2v2 it may be determined according to team survival.

## 5. Input Semantics and the Cause-and-Effect Chain of Controls

The game's main interactions are discrete tactical inputs, not continuous physical movement. Holding a direction key or continuously moving the pointer should not cause a unit to drift automatically; it should only continue moving the cursor/focus, scroll through selectable targets, or refresh the hover preview. After the input is released, the selection remains at the last focus or hover state, with no inertia or extra displacement. Input in the opposite direction should move the focus, selection, or browsing direction toward the opposite hex or option on the screen.

When the mouse/touch pointer moves over a battlefield hex, the player should see hover feedback for that hex and any related unit: reachable hexes are emphasized, paths or target ranges are displayed, obscured units remain identifiable, and the target unit's health or identity is indicated. Clicking/tapping a valid hex confirms the action; clicking/tapping an invalid hex must not execute an action and should cancel the preview, preserve the state, or display feedback that the action cannot be performed. A secondary input such as right-click or long press is used to view unit information and should not accidentally trigger movement or an attack.

The cause-and-effect chain for movement must be clear: the current unit's movable range appears, the player selects an empty hex within that range, and the unit faces the target and moves along the previewed route to the target position; movement to a target blocked by another unit, a blocking hex, a size conflict, insufficient movement, or impassable rules must not occur. After movement, the position, facing, queue action state, ability availability, and path visuals must all update in sync.

The cause-and-effect chain for abilities must be clear: the player selects an ability button or shortcut, and the interface displays whether the ability is available, its cost, target range, or the reason a target is missing; after a legal target is selected, the ability plays a visible effect and changes the target's health, status, position, summons, traps, drops, or resources. Using an ability generally consumes energy, special resources, health, or a per-turn use; its benefits are damage, control, summoning, displacement, protection, healing, resource changes, or a queue advantage. When resources are insufficient, the target is invalid, the ability is on cooldown, a newly summoned unit cannot act, or it is not the current player's turn, the ability must be rejected without incorrectly deducting key resources.

Combat risk must be coupled with visible outcomes: entering a dangerous hex may trigger a trap or pickup; approaching an enemy exposes the unit to melee or area abilities; killing an enemy unit advances victory and scoring, but using a high-cost ability reduces later action capability; waiting or delaying can change a unit's position in the action queue but may give the enemy more opportunities to act.

## 6. Turns, Queue, and Action Rules

The action queue must always be visible or queryable and show the current unit, subsequent units, the boundary of the next round, and delayed units. When a unit's turn begins, it is highlighted on the battlefield and in the panel, while its health, energy, resources, abilities, and owning player update in sync.

During its own turn, each unit can move, use eligible abilities, wait, delay, or end its turn. Specific action combinations may be designed according to unit abilities, but a non-current unit must not be allowed to act out of turn. While a bot or remote opponent acts, the local player's battlefield input should be locked or limited to viewing information, with a waiting state displayed.

Ending a turn removes the current unit from the current action and advances the queue. Delaying moves the current unit to a later position in the round or an appropriate delayed segment and must produce a visible change in the queue. When no legal action is available, the game should guide the player to skip or automatically provide a path to skip instead of becoming stuck.

When turn time and total time are enabled, they must affect the game: the countdown is visible, a warning appears as it nears expiration, and timing out automatically ends the current turn or causes the player to lose. When time is disabled, the related bar should appear unlimited or non-pressured.

## 7. Resources, Summoning, and Progression

Special summon resources are used by the core priest to summon beasts and as costs for some abilities. Before summoning, the player should be able to browse candidate units from their faction or unit pool and see unit information, size, level, or cost. After a summonable unit is selected, the battlefield displays the legal summon range and preview; invalid occupancy or insufficient resources should cause rejection.

A successful summon deducts the corresponding resource, creates the unit on the target hex, and adds it to the player's team and action queue. A newly summoned unit may have action restrictions during its first turn; such restrictions must be represented with an icon, status, unavailable abilities, or a prompt. Each side's summoned-unit limit must be visible, and no further units may be summoned after the limit is reached.

Ability upgrades are P2. If enabled, repeated ability use should produce visible upgrade feedback, and the upgraded range, damage, cost, effect, or status should have an observable difference from before the upgrade and may be included in the results. If upgrades are omitted, the rule option must be disabled or marked unavailable.

Drops are P2. If enabled, killed units may leave visible items on hexes, and other units that move to those hexes receive attribute, resource, or scoring feedback. If drops are omitted, the menu should not promise to enable them.

## 8. Health, Energy, Status, and Feedback

The current unit's health and energy must be displayed as bars, numbers, or an equivalent representation, and update in sync with damage, recovery, consumption, and the start of a turn. A non-current unit should also allow the player to determine its health and faction when hovered, selected, attacked, or obscured.

Status effects may include shields, freezing, poison, traps, disabling, fatigue, resurrection, or other unit traits. P1 must include at least one clearly visible protection or abnormal status, and that status must affect an actual action or damage outcome. P2 may expand to complete status combinations, durations in turns, overlapping effects, and special death handling.

All critical feedback must be doubly visible: the battlefield entity must change, and the panel/queue/prompt must update in sync. For example, damage must not only change a number without a hit indicator, summoning must not only deduct resources without making a unit appear, and skipping a turn must not only change text without advancing the queue.

## 9. Victory, Results, and Progress

P1 victory conditions: In 1v1, the match ends when one side's core faction is defeated, its entire team loses the ability to fight, it concedes, or its time expires. After the endgame, battlefield input is locked, a victory/defeat and results summary is displayed, and options are provided to restart the current match or return to the menu.

The results should display player scores or rankings. Scores may come from the first kill, kills of regular units, kills of core units, complete elimination, surviving units, no-death bonuses, time bonuses, pickups, and ability upgrades. P1 may implement simplified scoring, but must at least distinguish the winner, loser, kills/survival, or total score; P2 may implement a complete breakdown.

Restarting must clear units, traps, drops, queues, timers, endgame panels, and temporary prompts from the previous match, then re-enter an interactive battle. Returning to the menu must restore mode options without leaving an old results layer that blocks the battlefield or menu.

## 10. Rejection Paths and Invariants

Invalid movement cannot change a unit's position, consume an action, or advance the queue. An invalid target cannot deal damage, deduct resources, or trigger cooldown. Insufficient resources cannot allow summoning or ability use, and the original resources should be preserved. Input from anyone other than the current player or current unit cannot execute an action. After the endgame, movement, summoning, attacking, or farming score cannot continue.

Battlefield invariants: Units cannot illegally overlap, pass through impassable or occupied hexes, continue acting after death, or remain as ordinary actionable entries in the queue after removal, and resources and health cannot show negative values that players cannot understand. If a special ability breaks normal restrictions on movement, resurrection, or traversal, clear and visible special effects and costs must be shown before and after use.

Menu invariants: After a battle begins, the start menu should not cover the main battlefield; when panels such as scoring, unit details, settings, or chat are open, the game must either clearly be in a viewing state or allow the player to close them and return to the battle. Cancel, close, back, and retry must all have stable paths.

## 11. Scope Reduction

P1 must retain: a hex-grid battlefield, turn queue, current-unit indicator, click/touch movement, ability selection and target confirmation, health/energy/summon resources, core-priest summoning, at least several differentiated units, damage/kills, skipping or delaying turns, 1v1 against the computer or hot-seat play, endgame results, and restart.

P2 optional enhancements: all seven factions and the complete unit library, 2v2, online lobbies/matchmaking/room codes, chat, drops, ability upgrades, complex status combinations, traps and environments, replays/logs, an audio player, fullscreen and device-orientation adaptation, special rule toggles, detailed scoring breakdowns, and persistent records.

Explicit reductions: No specific art, sound effects, fonts, fixed wording, networking service, room service, auxiliary rule toggles, or complete number of units is required. As long as the core tactical loop, input semantics, visible feedback, state progression, victory/defeat results, and rejection paths work, a new interface layout, asset style, and data scale may be used.

---

## GDD / Design Doc (merged from design-doc.md)

# Ancient Beast Design Document

## 1. Design Goals and MDA

On a readable hex battlefield, players should make short-cycle but consequential tactical decisions through action order, distance, occupancy, limited resources, and combinations of abilities.

- Mechanics: hex-grid movement and occupancy, unit action queue, ability targets and costs, core-unit summoning, damage/status/death, waiting or ending turns, resource caps, and endgame locking.
- Dynamics: players balance acting first against delaying and waiting, balance dealing immediate damage against preserving summon/ability resources, and use positioning to create legal targets, protect core units, or block enemies.
- Aesthetics: a clear sense of tactical control, pressure that rises with each turn, the impact of ability hits and kills, and predictability formed through queue and battlefield feedback.

## 2. Executable P1 Loops

### Loop A: From Start to First Action

1. Start a local 1v1 or practice match against the computer from the menu.
2. Enter an interactive battlefield; the hex grid, both core units, the current unit, the queue, and resources are visible simultaneously.
3. Hover or move focus to view legal hexes, paths, or target previews.
4. Confirm a legal move; position and preview update, while an invalid target does not change critical state.

### Loop B: Abilities and Damage

1. The current unit selects an available ability.
2. The legal target range is presented; the player confirms a semantic target.
3. Energy or ability uses are deducted, the target's health or status changes, and dual battlefield and panel feedback is produced.
4. Requests with no resources, an incorrect target, a non-current unit, or a dead unit are rejected without side effects.

### Loop C: Summoning and Team Expansion

1. The current core unit browses affordable summon candidates.
2. After a candidate is selected, a legal occupancy preview is displayed.
3. After confirmation, summon resources are deducted, and the unit appears on an unoccupied legal hex and joins the subsequent queue.
4. When resources are insufficient, the quantity limit has been reached, or occupancy conflicts, resources, units, and the queue remain unchanged.

### Loop D: Queue Progression and Endgame

1. The current unit waits/delays or ends its turn.
2. The queue visibly changes, and the next surviving unit becomes the current unit.
3. Moving, using abilities, summoning, and advancing the queue repeat until one side loses the ability to fight.
4. The results layer locks battle and scoring; restarting clears the old match and restores an interactive initial state.

## 3. M-Feature Matrix

| Feature | Priority | Player Behavior | Observable Result | Primary Rejection Path |
|---|---|---|---|---|
| M1 Start and Local Battle | P1 | Select local/practice and start | Menu exits and battlefield becomes interactive | Loading or panels cannot block permanently |
| M2 Hex Battlefield and Units | P1 | Browse hexes and units | Grid, occupancy, and current unit are queryable | Illegal overlap cannot occur |
| M3 Action Queue | P1 | Wait or end turn | Current unit and queue order advance | Non-current units cannot act |
| M4 Hover, Selection, and Directional Focus | P1 | Hover the pointer or browse up/down/left/right | Preview and focus change in screen directions | Browsing does not directly execute actions |
| M5 Legal Movement | P1 | Select a semantic hex within range | Unit position changes and feedback is revised | Blocked/out-of-bounds/out-of-range targets do not change state |
| M6 Abilities, Damage, and Costs | P1 | Select an ability and confirm a target | Health, energy, status, and feedback change | Incorrect targets or insufficient resources have no side effects |
| M7 Summoning | P1 | Select a candidate and legal hex | Resources decrease, and units and queue entries increase | Limit/resource/occupancy rejection |
| M8 Wait and End Turn | P1 | Wait, delay, or end | Queue and current unit change visibly | Duplicate or unauthorized requests are rejected |
| M9 Death and Victory/Defeat | P1 | Kill through a real ability chain | Dead unit leaves action and results appear | Dead/endgame units cannot act or farm score |
| M10 Panels and Input Blocking | P1 | Open and close details/score/settings | Panel state is visible; closing restores battle | Background actions do not execute while a panel is open |
| M11 Drops and Upgrades | P2 | Kill, pick up, or accumulate ability uses | Drop/upgrade status and benefits are visible | Benefits cannot be granted directly before conditions are met |
| M12 Chat, Online, and Settings | P2 | Open a supporting feature or attempt online play | It can be closed, changes state, or clearly rejects | Supporting features cannot stall the local loop |
| M13 Shortcuts and Audio Feedback | P2 | Use ability shortcuts, confirm/cancel keys, or audio/mute controls | Selection, cancellation, confirmation, or audio state changes observably, or is clearly marked unavailable | Shortcuts cannot act out of turn; audio/settings cannot block local battle |

## 4. State Flow

`menu → loading → battle.turnReady ↔ battle.targeting ↔ battle.resolving → battle.turnReady → result → battle.turnReady/menu`

- `targeting` only establishes a preview and should not deduct resources or deal damage prematurely.
- `resolving` locks duplicate submissions until the effect is complete.
- Each queue advancement skips units that are dead or no longer eligible to act.
- `result` freezes movement, abilities, summoning, and scoring; it can be exited only by restarting or returning to the menu.
- Panels are overlay states: while open they block background battle actions, and when closed they return to the previous battle state.

## 5. Feedback Design

- Battlefield: current-unit emphasis, legal hex/target ranges, path or summon-occupancy previews, and hit/status/death changes.
- HUD: health, energy, summon resources, ability availability, and unit limits update in sync.
- Queue: the current entry, subsequent entries, new position after waiting, and removal upon death are distinguishable.
- Rejection: return a stable reason category while position, queue, health, resources, and score remain unchanged.
- Endgame: victory/defeat, a kill/survival or total-score summary, and a restart path are presented simultaneously.

## 6. Priority and Completion Order

1. P0: Loads without fatal errors, can enter a local battle, and can observe basic state.
2. P1-A: Local battle, hex grid, current unit, and queue.
3. P1-B: Hover/directional focus, movement, ability damage, and resource consumption.
4. P1-C: Summoning, wait/end, death, victory/defeat, endgame lock, and restart.
5. P1-D: Panel blocking and closing, rejection paths, and numeric boundaries.
6. P2: Drops, upgrades, chat, online play, settings, audio, and shortcut enhancements; these features must not block P1.
