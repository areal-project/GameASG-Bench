# Armor Alley Gameplay Requirements

## 1. Product Positioning

Armor Alley is a side-scrolling helicopter battlefield strategy action game. The player simultaneously takes on the roles of aerial pilot and battlefield commander: personally flying a helicopter to move across the long battlefield, attack, deploy soldiers and supplies, while using funds to produce ground units and push the friendly front line from the base on the left toward the enemy base.

The core objective is to protect the friendly base from being breached by the enemy convoy and escort the friendly supply vehicle through the enemy base. The game must present a continuously operating battlefield rather than a single-aircraft shooting minigame: friendly and enemy helicopters, tanks, missile vehicles, supply vehicles, infantry, engineers, turrets, bunkers, balloons/chains, clouds, radar, and the HUD together constitute the combat information.

## 2. Core Loop

1. The player selects the tutorial, a single-player campaign difficulty, or an optional multiplayer/editor-related entry from the menu to start a battle.
2. After the battle begins, the player moves the helicopter to scout the battlefield, using the radar, scrolling view, HUD, and prompts to assess friendly and enemy positions, resources, ammunition, fuel, and dangers.
3. The player uses the helicopter to attack enemy ground units, enemy aircraft, turrets, balloons, missiles, and bunkers, or deploys infantry to capture/repair key positions.
4. The player spends funds to produce ground units, which depart in a queue from the friendly base and automatically advance along the ground, exchange fire, block, escort, or get destroyed.
5. Victory occurs if the friendly supply vehicle reaches the enemy base; defeat occurs if the enemy supply vehicle reaches the friendly base. After defeat or victory, the battle-end state is displayed, and the player may restart or return to the menu.

## 3. Cause-and-Effect Chain of Control Feel

### 3.1 Helicopter Movement

P1 must provide continuous flight input. Desktop players control the helicopter's intended direction by moving the pointer: when the pointer is to the right of the helicopter's visible center, the helicopter accelerates right; when it is to the left, the helicopter accelerates left; when it is above, the helicopter rises; and when it is below, the helicopter descends. The closer the pointer is to the center, the more the horizontal and vertical velocities level off; the farther away the pointer is, the more pronounced the movement becomes, while still being limited by a maximum speed.

Releasing the mouse button should not stop flight, because movement input comes from the pointer position rather than from holding and dragging; the player reduces speed by moving the pointer back near the helicopter, moving it in the opposite direction, approaching the ground/landing area, or triggering landing and refit. Opposite-direction input must produce the opposite screen-movement trend: left/right affects horizontal position and the battlefield's scrolling direction, while up/down affects altitude.

Touch or gamepad mode uses virtual pointer/joystick semantics: dragging after touch begins moves the virtual pointer and continuously changes the helicopter's direction; after release, the pointer position no longer continues changing, and the next touch can set the direction again. Mobile must preserve the same directional relationships as desktop and must not reverse the left/right or up/down mappings.

Helicopter flight carries risks. Contacting the ground at high speed causes a crash; running out of fuel or having no pilot causes the helicopter to lose control and fall; colliding with hostile units, terrain hazards, chains, enemy fire, or explosions damages or destroys the helicopter. Horizontal movement is suppressed while landed or on a landing area, and the player needs to move upward to take off again.

### 3.2 Weapons and Special Actions

P1 must support sustained fire, bombing, launching guided weapons, and deploying infantry. Holding fire continuously consumes ammunition and generates visible projectiles traveling in the helicopter's facing/target direction; releasing it stops sustained fire. Bombing releases a bomb from beneath the helicopter; the bomb is affected by falling and forward movement trends, produces explosion or flame feedback after hitting the ground or a unit, and consumes bomb stock.

Guided weapons require available ammunition and a valid target; when a target exists, launching should produce a projectile that tracks the target and begin a brief relaunch interval; when there is no target or no ammunition, rejection feedback must be given and unrelated resources must not be consumed without cause. Deploying infantry consumes the number of soldiers onboard; an aerial deployment should produce a parachuting soldier, while a landed or near-ground deployment should produce a ground soldier.

The benefits and costs of special actions must be visible: firing suppresses or destroys targets but consumes ammunition; bombing can quickly destroy ground targets but requires flying into dangerous positions; guided weapons are suitable for handling enemy aircraft or high-threat targets but are limited in number; deploying soldiers can capture bunkers or perform repairs/resupply, but reduces the number of personnel onboard and exposes the soldiers to ground fire.

### 3.3 Landing, Refit, and Repair

P1 must support landing and refit. After the helicopter lands in a safe area or landing area, fuel, ammunition, bombs, guided weapons, and damaged state should gradually recover, with the HUD, animation, or state prompts indicating that refit is in progress. Refit does not restore everything to full instantly; the player sacrifices mobility during refit and may miss an interception because they are away from the front line.

When friendly engineers or infantry interact with a landed helicopter, they can be picked up or provide partial resupply/repair benefits; enemy infantry approaching a landed helicopter should pose a close-range danger. Refit, pickup, and danger must all have observable feedback rather than merely changing numeric values.

## 4. Battlefield Entities and Visible Feedback

### 4.1 Helicopters

The player's helicopter must always be the focus of the battlefield view and HUD. It needs to display facing, damage, smoke/explosions, onboard soldiers, ammunition, bombs, guided weapons, fuel, or refit state. Enemy helicopters appear as major threats in non-tutorial battles and can move, attack, evade, refit, launch weapons, or bomb key targets.

After a helicopter is destroyed, there should be explosion, wreckage/smoke, or crash feedback. In limited-lives mode, losing a helicopter reduces the number of available lives; after lives are exhausted, purchase or revival should be rejected and feedback given. Infinite-lives or tutorial mode may reduce the pressure from lives, but still requires a visible representation of death, respawn, or an unavailable state.

### 4.2 Ground Units

P1 ground units include tanks, missile vehicles, supply vehicles, infantry, and engineers. They appear from the friendly base or order queue, advance along the ground toward the enemy, and automatically stop, exchange fire, repair, capture, or wait when they encounter enemy targets, friendly blockers, or key buildings.

Tanks are the primary ground firepower and should be able to attack enemy units and buildings, using stronger close-range flame/explosion effects against specific targets. Missile vehicles are anti-helicopter threats; after detecting an enemy helicopter, they should sacrifice themselves or enter a launch state and produce a tracking projectile. Supply vehicles are key to victory or defeat; they are slow, need protection, and trigger victory upon reaching the enemy base. Infantry can shoot enemies and capture bunkers; engineers focus on repairing turrets and bunkers or supporting helicopters.

Ground units must have death, damage, stop-and-go, firing, explosion, smoke, radar marker, or queue feedback. Friendly units must not unconditionally overlap and pass through one another when congested; they should appear to pause, wait, or advance in a queue.

### 4.3 Buildings and Battlefield Objects

P1 buildings include the friendly base, enemy base, endpoint bunkers, ordinary bunkers, turrets, and landing areas. Bases are endgame objectives; bunkers and turrets are front-line control points; landing areas provide refit and repairs. Ordinary bunkers can be captured by infantry and, after capture, should change their displayed allegiance and affect the surrounding front line or production pressure.

Balloons, chains, clouds, weather, and terrain decorations serve as battlefield hazard or concealment systems. Balloons and chains obstruct or damage helicopters; clouds can provide concealment and may also be accompanied by danger; weather, radar interference, and visibility effects should increase the pressure of reading the battlefield. P1 must provide at least balloons/chains or equivalent aerial obstacles, as well as clouds or equivalent concealment hazards; more complex weather is P2.

## 5. Economy, Production, and Progression

P1 must have funds and a production queue. Player funds are displayed on the HUD, and producing ground units or purchasing helicopters consumes funds; changes to funds should be displayed in sync through numbers, animations, prompts, or purchasable states. After an order enters the queue, it should be displayed as under construction or waiting; after completion, the corresponding unit appears on the battlefield from the friendly base.

When funds are insufficient, the order must be rejected, funds must not decrease, the queue must not increase, and a sound, prompt, disabled state, or other visible feedback must be provided. New orders must also be rejected when the unit-count cap is reached, with an indication that funds are not the issue. New production orders should not continue to be accepted after the battle ends.

The enemy also needs to produce convoys or units according to funds and the battle situation, keeping pressure on the battlefield. Enemy production can be more automated than the player's, but it must create a visible offensive rhythm: enemy units advance from the far base, forcing the player to intercept, escort, or adjust the queue.

P1 progression includes a tutorial/practice battle, at least one regular campaign difficulty, and multiple optional battlefield layouts. Different battlefields can vary bunkers, turrets, balloons, weather, radar, enemy intelligence, ammunition types, and fairness. A complete multi-battle list, online-only maps, and a custom map editor are P2.

## 6. HUD, Radar, and Information Feedback

P1 must provide a readable HUD: funds, queue/production state, helicopter ammunition, bombs, guided weapons, onboard soldiers, lives/respawn state, refit state, prompts/notifications, and battle-end state. HUD changes must be synchronized with actual gameplay; state must not change only in the background without being displayed.

The radar must show the positions of key units and buildings on the long battlefield and remain synchronized as the view scrolls. The player should be able to use the radar to understand friendly/enemy advances, dangerous targets, the friendly helicopter's position, and the front-line state. When radar interference or an enemy interference vehicle appears, the radar should show noise, obstruction, missing markers, or warning feedback; it recovers after the interference disappears.

Battle prompts should support tactical decisions: an enemy supply vehicle approaching the base, missile threats, insufficient funds, unit completion, building capture, helicopter damage, refit start/completion, victory and defeat results, and similar events all need immediate feedback.

## 7. Menu, Modes, and State Flow

### 7.1 Startup and Menu

The P1 menu must allow selection of starting a battle, the tutorial, difficulty/campaign, settings, or return. After starting a battle, the menu fades out or closes and the battlefield becomes the interactive primary view; no overlay that blocks the battlefield may remain. Tutorial mode can provide a safer initial battle and prompts.

Settings can include sound, controls, display, game speed, radar, mobile, or difficulty-related options. Full preference persistence, complex control rebinding, theme packs, and video/introduction sequences are P2; P1 only requires that the player can start, pause/resume, restart, or return to the menu.

### 7.2 Battle State

The state flow is: loading/menu -> battle preparation -> battle in progress -> pause/settings or continue battle -> victory/defeat -> restart/return to menu. While paused, the battle loop stops and input should not continue advancing the battle; the battle continues after resuming. When the settings panel is open, it should prevent accidental battlefield actions and restore the correct state after being closed.

After the battle ends, the victory or defeat state must lock core gameplay: units must not continue causing multiple terminal outcomes, and production orders and ordinary attacks should not change the final result. The result screen or prompt should allow restarting the same battle or returning to the menu.

### 7.3 Multiplayer, Editor, and Advanced Entries

The advanced scope includes multiplayer, cooperative/versus play, level selection, an editor, theme packs, special ammunition appearances, and numerous preferences. P1 may provide a local single-player battle, tutorial, basic settings, and several levels; P2 includes online synchronization, chat, a cooperative bank, a more complete map editor, the full map list, theme packs, complete preference migration, and special holiday/Easter egg sequences.

## 8. Victory, Defeat, Failure, and Rejection Paths

P1 victory condition: the friendly supply vehicle reaches the enemy base and triggers destruction of the enemy base, a victory prompt, a battle-end lock, and a restart path. P1 defeat condition: the enemy supply vehicle reaches the friendly base, or, in limited-lives mode, the player's helicopter resources are exhausted and effective defense can no longer continue; defeat should have base destruction or equivalently strong feedback.

Individual helicopter failures include hitting the ground at high speed, running out of fuel, being hit by enemy fire, being hit by a tracking missile, being caught in a bomb/explosion, or colliding with a hostile unit or aerial obstacle. An individual failure does not always have to cause immediate battle defeat, but it must cause helicopter destruction, lives/respawn/purchase pressure, a short-term loss of air control, or a clear penalty.

Rejection paths must cover: insufficient funds, the unit cap, placing an order after battle end, launching a guided weapon without a target, firing/bombing/launching without ammunition, deploying without soldiers, battlefield input while paused, accidental clicks while the settings panel is blocking, and purchasing a redundant helicopter in tutorial or infinite-lives mode. Rejection must not consume the wrong resources, advance the queue or terminal outcome, and must provide visible or audible feedback.

## 9. Scalable Scope

The P1 qualification threshold is: a side-scrolling single-player battlefield is fully playable; continuous helicopter flight, weapons, soldier deployment, refit, production with funds, ground-unit advance, enemy pressure, radar/HUD, pause, victory and defeat, and restart are all functional.

P2 enhancements include: online versus/cooperative play, chat, a level editor, complete campaign and online level lists, theme packs and Easter eggs, detailed weather variants, complex enemy-intelligence parameters, savable preferences, complete menu navigation with a gamepad, all advanced mobile controls, all special ammunition appearances, post-battle statistics, and long-term scoreboards.

Cut scope: there is no requirement to reuse any existing brand assets, exact wording, original menu visuals, specific sound effects, specific level names, a particular network protocol, hidden debug entries, or internal organization. An equivalent finished product may use different art and layouts, but it must preserve the player-visible battlefield loop, input directions, feedback chain, and closed victory/defeat loop.

---

## GDD / Design Doc (merged from design-doc.md)

# Armor Alley Design Doc

## 1. Design Intent

Armor Alley is a side-scrolling helicopter battlefield strategy game. The player is both pilot and commander: they fly a helicopter over a long battlefield, attack or support visible units, manage limited resources, order ground forces, and protect a slow convoy long enough for it to reach the enemy base.

The game should feel like an active warfront, not a single-aircraft shooter. Air control, landing/refit timing, ground production, radar reading, and convoy protection all contribute to the same objective: keep the player's base safe while pushing friendly forces to the enemy base.

## 2. MDA Overview

### Mechanics

- Continuous helicopter movement driven by pointer, touch, or equivalent directional intent.
- Helicopter weapons: sustained gunfire, bombs, guided weapons, and soldier drops.
- Landing/refit loop that restores fuel, ammunition, bombs, guided weapons, and damage over time while reducing mobility.
- Ground production funded by a visible resource pool and constrained by costs, queue timing, unit caps, and battle state.
- Autonomous ground units: tanks, missile vehicles, supply vehicles, infantry, and engineers move, stop, attack, repair, capture, block, or wait based on battlefield contact.
- Bases, bunkers, turrets, landing areas, air obstacles, clouds or equivalent cover/danger, radar, HUD, notifications, pause, result, retry, and menu state.

### Dynamics

- The player repeatedly leaves safety to scout or attack, then returns or lands when fuel, damage, ammunition, or tactical pressure demands it.
- Air attacks can remove immediate threats, but they expose the helicopter to ground fire, missiles, obstacles, collision, and fuel pressure.
- Ground orders create delayed strategic pressure: spending funds now produces units later, and poor timing can leave the convoy unsupported.
- Radar and HUD information compress the long battlefield into tactical choices: intercept enemy supply vehicles, protect friendly ones, respond to missile threats, or reinforce captured points.
- Landing and refit are deliberate tradeoffs: they restore capability but temporarily remove the player's active air control from the front.

### Aesthetics

- Tension from simultaneous air danger and ground pressure.
- Agency from combining direct helicopter skill with production choices.
- Readability from radar, HUD, unit motion, attack feedback, damage, smoke, explosion, capture, repair, and result states.
- Satisfaction from a protected convoy breaking through and destroying the enemy base.
- Urgency from enemy advances, low fuel, incoming missiles, resource shortage, unit losses, and base threats.

## 3. M-Features

| ID | Priority | Feature | Player-Facing Design Requirement |
|---|---|---|---|
| M1 | P1 | Start, reset, and battle state flow | The player can enter a playable single-player battle from menu or tutorial, pause/resume, reach win/loss, and restart or return without a blocking overlay remaining over active play. |
| M2 | P1 | Continuous helicopter flight | Pointer, touch, or equivalent directional input causes continuous visible helicopter movement with correct left/right/up/down causality, smoothing near the center, opposite-direction correction, and risk from ground, obstacles, fuel, damage, and hostile fire. |
| M3 | P1 | Helicopter weapon loop | Sustained fire, bombing, guided weapon use, and soldier drops consume the correct limited stock and produce visible projectiles, drops, impact, damage, rejection, or threat responses. |
| M4 | P1 | Landing, refit, and pickup support | Safe landing areas let the helicopter gradually regain fuel, weapons, and repair state while reducing mobility; nearby friendly soldiers or engineers can visibly interact, and enemy proximity remains dangerous. |
| M5 | P1 | Ground production economy | Funds and queue state let the player order tanks, missile vehicles, supply vehicles, infantry, and engineers; affordable valid orders spend funds and later spawn units, while invalid orders are rejected without wrong resource changes. |
| M6 | P1 | Autonomous ground war | Friendly and enemy ground units advance from bases, stop or queue around blockers, attack enemies/buildings, protect or threaten supply vehicles, die or show damage, and visibly affect the front line. |
| M7 | P1 | Convoy victory and base failure | A friendly supply vehicle reaching the enemy base wins; an enemy supply vehicle reaching the player's base or an unrecoverable defense collapse loses. Result states lock ordinary play and expose retry/menu recovery. |
| M8 | P1 | Bunkers, turrets, landing areas, and air hazards | Bases, bunkers, turrets, landing areas, air obstacles, and clouds or equivalent cover/danger create visible tactical points, collision/risk, capture/repair opportunities, and map-reading pressure. |
| M9 | P1 | HUD, radar, and tactical feedback | Funds, queue, helicopter status, fuel, weapons, soldiers, lives/recovery, refit, messages, radar positions, enemy advances, missile danger, capture/repair, and result states stay synchronized with actual play. |
| M10 | P1 | Pause, modal blocking, and rejection invariants | Pause/settings/result states prevent unintended battlefield progress; invalid actions such as no funds, no ammo, no target, no soldiers, unit cap, or terminal-state orders do not secretly mutate unrelated systems. |
| M11 | P2 | Advanced modes and map breadth | Multiplayer, cooperative or versus modes, editor, full battle list, advanced difficulty variations, theme packs, full preference persistence, and specialized weather are depth goals beyond the P1 playable loop. |
| M12 | P2 | Extended battlefield flavor | Richer enemy behavior, detailed special weapon variants, advanced radar interference, additional weather types, long-term stats, and extensive cosmetic variants deepen the same loop without replacing it. |

## 4. P1 Core Loop Executable Trajectories

### Loop A: Battle Entry To First Tactical Choice

1. Start/reset: The player opens the game, chooses tutorial or a single-player battle, and starts from a ready state with visible battlefield, helicopter, HUD, radar, funds, queue area, and no blocking menu over the playfield.
2. Player input: The player moves the pointer or touch intent away from the helicopter center.
3. Continuous state changes: The helicopter accelerates in the matching visible direction; the camera/long battlefield scrolls as needed; radar and HUD continue updating; nearby units and hazards continue moving.
4. Goal/risk: The player scouts for enemy units, supply vehicles, bunkers, turrets, landing areas, and convoy positions while managing collision, fuel, hostile fire, and distance from base.
5. Reward/failure: Good movement reveals tactical targets and positions the helicopter to support the front; poor movement can cause ground collision, obstacle impact, enemy fire damage, or fuel pressure.
6. Progress/restart: The battle remains active with better tactical information, or the player loses the helicopter and must recover, refit, rebuy, respawn, or eventually restart if defense collapses.

### Loop B: Flight Control Feel

1. Start/reset: The helicopter is airborne and visible with fuel and status shown.
2. Player input: Pointer right of center produces rightward acceleration; pointer left produces leftward acceleration; pointer above produces climb; pointer below produces descent. Touch/virtual pointer input follows the same screen-direction meaning.
3. Continuous state changes: Movement trends continue while the directional intent remains; near-center intent slows changes; opposite-direction intent counteracts previous motion; releasing touch stops changing the virtual intent rather than magically freezing the helicopter.
4. Goal/risk: The player tries to line up attacks, dodge bullets/missiles, avoid obstacles, land safely, or maintain a combat position.
5. Reward/failure: Correct control enables precision attack, retreat, landing, and missile evasion; wrong direction, excessive speed near ground, fuel exhaustion, or hazard contact causes damage, crash, or loss of control.
6. Progress/restart: Surviving flight keeps the player in the tactical loop; destruction temporarily removes air control and can lead to life/resource pressure or battle failure.

### Loop C: Air Attack And Soldier Drop

1. Start/reset: The helicopter has limited ammunition, bombs, guided weapons, and/or onboard soldiers, with targets or support opportunities visible in the battlefield or radar.
2. Player input: The player holds fire, drops a bomb, launches a guided weapon at a valid target, or drops soldiers.
3. Continuous state changes: Gunfire repeats while held and stops when released; bombs fall from the helicopter and detonate on ground or targets; guided weapons visibly track eligible targets after launch; dropped soldiers descend or become ground units depending on altitude/landing context.
4. Goal/risk: The player wants to destroy enemies, suppress threats, capture or repair positions, protect supply vehicles, or break defensive chokepoints while spending limited resources.
5. Reward/failure: Hits create damage, explosions, smoke, target removal, capture/repair opportunities, or reduced pressure; missed attacks waste stock, expose the helicopter, or leave threats active. No ammo, no target, or no soldiers rejects the action without unrelated resource loss.
6. Progress/restart: Successful attacks open a safer path for ground units and convoy progress; repeated failure can lead to depleted weapons, helicopter destruction, lost ground, or eventual defeat.

### Loop D: Landing, Refit, And Return To Front

1. Start/reset: The helicopter is low on fuel, ammunition, weapons, or repair state, and a safe landing area or base-side recovery opportunity is available.
2. Player input: The player guides the helicopter to a safe landing zone, reduces speed or altitude appropriately, and lands.
3. Continuous state changes: Horizontal mobility is suppressed or reduced while landed; fuel, ammunition, bombs, guided weapons, and damage state recover over time; HUD and visible effects show refit progress. Friendly soldiers or engineers may board or provide support, while enemy infantry nearby remains dangerous.
4. Goal/risk: The player trades temporary absence from the battlefront for restored capability.
5. Reward/failure: A completed refit returns the helicopter to useful combat strength; landing in danger, leaving too early, or ignoring front pressure may allow enemy units or supply vehicles to advance.
6. Progress/restart: The player takes off and resumes interception/support, or the lost time contributes to base threat and possible defeat.

### Loop E: Production, Ground Push, And Convoy Protection

1. Start/reset: The battle is active, funds are visible, and the production queue is ready.
2. Player input: The player orders a tank, missile vehicle, supply vehicle, infantry, or engineer.
3. Continuous state changes: Valid orders spend funds, enter a visible queue, complete after a delay, and spawn units from the player base. Units then advance automatically, stop or wait around blockers, attack enemies, repair or capture where appropriate, and appear on radar/HUD feedback.
4. Goal/risk: The player builds a push that can protect the friendly supply vehicle and contest enemy units before they reach the player base.
5. Reward/failure: Good production timing creates escorts, air-defense coverage, repairs, captures, and convoy momentum; bad timing, insufficient funds, unit caps, or terminal-state orders are rejected or leave the front under-defended.
6. Progress/restart: The friendly supply vehicle reaching the enemy base triggers victory; the enemy supply vehicle reaching the player base or an unrecoverable defense collapse triggers failure and restart/menu recovery.

### Loop F: Radar/HUD-Driven Response

1. Start/reset: The long battlefield contains off-screen units, structures, hazards, and possible radar interference.
2. Player input: The player reads radar, HUD, notifications, and visible playfield cues, then moves, attacks, lands, or orders units.
3. Continuous state changes: Radar markers, scroll position, resource displays, queue state, weapon stock, fuel, refit, warnings, capture/repair state, and result cues change as the battle evolves.
4. Goal/risk: The player must choose between intercepting enemy supply vehicles, protecting friendly ones, attacking threats, refitting, or investing in production.
5. Reward/failure: Accurate information enables timely defense and convoy progress; jammed/obscured radar, ignored warnings, or stale HUD feedback creates tactical mistakes and user confusion.
6. Progress/restart: Correct responses keep the battle alive and advance toward victory; missed threats produce helicopter loss, ground-unit losses, base pressure, or defeat.

## 5. Source Core Loop Coverage Matrix

| Mechanism | Priority | Core Player Trigger | Continuous/State Result | Goal, Risk, Reward, Failure |
|---|---|---|---|---|
| Menu to playable battle | P1 | Start tutorial or single-player battle, restart after result | Menu closes, battle becomes interactive, HUD/radar/playfield visible | Establishes playable state; blocking overlays or stale result state break the loop. |
| Pause/settings/result lock | P1 | Pause/resume, open/close settings, reach terminal state | Battle stops during pause/settings; resumes cleanly; terminal state locks ordinary production/attack changes | Prevents accidental progress and duplicate outcomes; incorrect blocking or continued simulation is failure. |
| Directional helicopter flight | P1 | Pointer/touch directional intent around helicopter | Visible acceleration/movement follows intended left/right/up/down; opposite input reverses trend; center slows trend | Enables scouting, dodge, attack alignment, landing; wrong mapping, no movement, or impossible stopping fails the core feel. |
| Ground and obstacle risk | P1 | Fly low, fast, into hazards, through combat zones | Damage, crash, smoke, explosion, loss of control, or life/resource pressure | Flight choices carry stakes; harmless collision or invisible failure is not sufficient. |
| Sustained gunfire | P1 | Hold fire, release fire | Repeated visible shots while held, ammo decreases, firing stops on release | Suppresses or destroys targets; no ammo rejects without unrelated cost. |
| Bombing | P1 | Trigger bomb release while airborne | Bomb falls from helicopter, moves with flight context, impacts and explodes/burns | Strong ground attack with position risk; no bombs rejects. |
| Guided weapon | P1 | Launch when ammo and target are valid | Tracking projectile appears, ammo decreases, short reuse pressure applies | Handles high-threat targets; no target or no ammo rejects with feedback. |
| Soldier drop | P1 | Drop soldier from air or near ground | Onboard soldiers decrease; parachute or ground soldier appears; soldier can fight/capture/repair later | Supports capture/repair or missile diversion; no soldiers rejects. |
| Landing/refit | P1 | Land in safe area or landing point | Mobility reduced; fuel/weapons/repair recover gradually; HUD/effects show refit | Restores capability at tactical time cost; unsafe landing or enemy proximity remains risky. |
| Friendly pickup/support | P1 | Land near friendly soldier/engineer where interaction is available | Boarding, local repair, or resupply feedback appears | Connects air and ground systems; invisible numeric-only changes are insufficient. |
| Funds and production orders | P1 | Order ground units from visible controls or equivalent command | Funds decrease, queue displays order, build completes, unit spawns at base | Converts resources into front-line pressure; insufficient funds/caps/terminal state reject without wrong mutation. |
| Ground unit advance and contact | P1 | Produce units or wait as enemy produces | Units move toward opposing base, stop/wait around blockers, attack, repair, capture, die, or show damage | Creates living battlefield; static units or overlap-only movement fails strategy loop. |
| Supply vehicle victory/failure | P1 | Protect friendly supply vehicle or fail to stop enemy supply vehicle | Friendly arrival at enemy base creates victory; enemy arrival at player base creates failure | Defines battle outcome; result must show and lock with retry/menu path. |
| Bunkers and turrets | P1 | Attack, capture, repair, or fight near control points | Ownership, damage, repair, firing, or capture feedback changes | Makes terrain strategically meaningful; inert scenery is insufficient. |
| Air obstacles and cover/danger | P1 | Fly near balloons/chains/clouds or equivalent hazards | Collision, obstruction, concealment, warning, damage, or risk feedback occurs | Forces map reading and flight discipline; purely decorative hazards do not satisfy P1. |
| Radar and long-battlefield awareness | P1 | Observe radar while moving or while units advance | Key units/buildings/vehicle positions update with scroll and battle state; interference can degrade clarity | Supports off-screen decisions; stale or fake radar breaks battlefield command. |
| HUD and notifications | P1 | Any resource, weapon, refit, damage, queue, warning, capture, or result change | Visible HUD/message state updates consistently with gameplay | Maintains tactical clarity; hidden state changes fail observability. |
| Enemy pressure | P1 | Time passing, player aggression, or enemy production cycle | Enemy air/ground units advance, attack, hide, refit, or threaten objectives | Forces response; a passive battlefield cannot satisfy the game identity. |
| Multiple battle layouts/difficulty basics | P1 | Choose tutorial or a regular battle/difficulty | Layout or pressure changes through structures, hazards, enemy capability, resources, or guidance | Provides learning and at least one normal campaign challenge. |
| Multiplayer/editor/full campaign breadth | P2 | Choose advanced entries | Optional modes, maps, editing, theme or preference depth | Enhances scope but is not required for P1 single-player loop. |
| Advanced weather/special variants/statistics | P2 | Use settings, special maps, long play, or advanced modes | More varied interference, weapon skins, AI differences, post-battle stats, persistence | Adds richness without replacing P1 loops. |

## 6. Systems Design Notes

### Helicopter Control

The helicopter is the player's primary embodied tool. Its motion must preserve the cause-and-effect chain in the Game Spec: directional intent relative to the visible helicopter changes acceleration and movement trend; close-to-center intent calms movement; opposite intent corrects movement; touch/virtual controls keep the same visible direction semantics. Stopping or landing should be an achieved state, not an instant side effect of releasing a button.

### Combat And Unit Interaction

Combat must be visible as trajectories, impacts, damage, smoke, explosions, deaths, capture, repair, warnings, or target removal. It should not be reduced to silent counters. The same battlefield object can be part of several loops: a bunker can be a target, cover/control point, capture objective, radar marker, and source of strategic pressure.

### Economy And Production

Production should express delayed commitment. The player spends funds, sees the order enter a queue, waits for completion, and then sees a unit leave the base. Rejection states are part of the design: no funds, unit cap, battle over, or invalid context should preserve resource integrity and produce clear feedback.

### Information Design

The playfield shows immediate action; radar shows long-field position and threats; HUD shows the helicopter, resources, queue, and result state. These surfaces must agree. The player should be able to answer: where is my helicopter, what can I spend, what is in the queue, what weapons/fuel remain, where is the convoy, and what threat needs response now.

### Failure And Recovery

Personal helicopter failure and battle failure are related but distinct. Helicopter death should temporarily remove or penalize air control and create recovery pressure. Battle failure occurs when base defense collapses or the enemy supply vehicle completes its objective. Both need clear feedback and a path to restart or return.

## 7. Priority Boundaries

### P1 Playable Contract

P1 is satisfied only when a player can complete the full single-player loop:

start or reset battle -> fly with correct continuous control -> attack/support/land/refit/order units -> observe ground war and radar/HUD feedback -> protect a friendly supply vehicle or stop an enemy one -> reach victory or failure -> restart or return.

Every P1 mechanism must be player-triggerable, visibly stateful, and connected to either tactical choice, risk, reward, rejection, or result.

### P2 Depth

P2 covers richer modes and breadth: network play, cooperation/versus, editor, full map list, full preference persistence, advanced weather, special visual themes, detailed special weapon variants, expanded enemy intelligence, long-term scoring, and extensive cosmetic or seasonal details.

### Cut Scope

The target game does not need to reproduce existing brand assets, exact wording, original menu visuals, exact sounds, named battle list, network protocol, hidden debug behavior, internal organization, or particular implementation details. Equivalent art, layout, names, and technology are valid when the player-visible loops and feedback above remain intact.
