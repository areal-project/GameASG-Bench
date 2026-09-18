# Stickman Anchor Gameplay Requirements

## Game Positioning

Stickman Anchor is a side-view 2D stickman archery battle game. The player stands on a platform on the left, facing enemy archers on the right or on platforms at varying heights. By dragging to aim and releasing to shoot arrows that follow a curved, downward trajectory, the player defeats all enemies in the current level, earns stars, coins, and equipment progression, and continues to challenge more complex levels.

The core playability must come from genuine archery combat rather than static click-to-resolve interactions: the player, enemies, platforms, arrow trajectories, health bars, hit feedback, enemy counterattacks, and level results should always be visible on screen. The player's primary experience is reading angles and anticipating height differences and moving targets, then turning the situation around with precise headshots, combos, and special arrows before dangerous counterattacks occur.

## P1 Core Gameplay

- After entering a level, the player sees a side-view battlefield: the player archer is located on a platform on one side, while enemy archers are distributed on the other side or on platforms at different heights. Platforms can be stationary or move horizontally or vertically as a level challenge.
- The player presses or touches the battlefield to begin drawing the bow and aiming. During continuous dragging, the orientation of the player's upper body and bow should change continuously, the bowstring/nocked-arrow state should appear to be building tension, and a readable aim control or trajectory preview should appear on screen.
- When the input is released, if shooting is currently allowed, an arrow flies from the position of the player's bow, travels in the current aiming direction, and forms an arc under the influence of gravity. An arrow does not hit instantly on click; it must move through the scene and may hit an enemy, a power-up bubble, or fly out of bounds.
- The player does not move the character directly. The core controls only change aiming direction and shot timing, so level challenges come from shooting angles, height differences, target movement, enemy counterattacks, and shooting cooldowns.
- Enemies have visible health and bow-holding states. Enemies periodically aim at the player, draw their bows, and shoot arrows in counterattack; enemy arrows also travel in arcs and may hit the player's body or head. When the player's health reaches zero, the failure flow begins.
- Hitting an enemy's body with an arrow deals damage and leaves hit feedback; hitting the head should produce stronger headshot feedback and usually knock down an unprotected enemy immediately. After a hit, particles, a hit sound effect, or equivalently strong feedback should appear, and the arrow may remain visibly embedded in the target.
- The level is won after all enemies already present and in subsequent waves have been defeated. Victory should be delayed long enough for the player to see the knockdown animation and feedback, then display the star rating, coin reward, combo bonus, and continuation flow.
- After the player is defeated by an enemy arrow, death/fall feedback should play before the failure panel is displayed. Failure must not clear the battlefield immediately; the player should be able to understand that they failed because they were hit by an arrow.

## Control Feel Causal Chain

- While pressing and dragging continuously, the player sees the archer continuously follow the input to change angle, with the trajectory preview changing in sync; the clearer the dragging motion, the more stable the aiming change should be, and minor jitter should not cause large jumps.
- Adjusting upward should raise the bow and preview trajectory so that, after release, the arrow travels upward sooner before falling; adjusting downward should lower the bow and trajectory so that, after release, the arrow travels toward the ground or a lower target sooner. Dragging in opposite directions must produce opposite visible aiming results.
- Releasing the input confirms the shot. After release, the bowstring snaps back, the arrow leaves the string, the player's aiming state ends, and the arrow's flight outcome is determined by the direction at the instant of release.
- There is a brief cooldown or equivalent pacing restriction after shooting. Releasing again during the cooldown cannot rapidly create successive arrows; the player should see feedback indicating the cooldown or inability to fire again.
- Arrows are affected by downward acceleration while in flight, and farther targets require higher aim; high, low, and moving targets change the best release timing. An arrow that leaves the screen or misses the target deals no damage.
- Risk is strongly tied to input: the longer the player aims, the more likely an enemy is to complete a bow-drawing counterattack; a wrong angle wastes the cooldown and gives the enemy an attack window; pursuing headshots and combos offers greater rewards but also makes a miss more likely.

## Hits, Damage, and Feedback

- Every character should have a visible health state. Player health is shown on the battlefield or in the HUD, enemy health is shown near each enemy, and the value or health bar should decrease in sync after a hit.
- Body hits deal normal damage and may require multiple arrows to defeat strong enemies. Hit location should affect feedback: a body hit is a standard hit, while a head hit is a high-value hit.
- Headshots should have prominent feedback, such as a special icon, slow motion, vibration/screen shake, a particle burst, or enhanced audio. If the target has head protection, a headshot should first consume the protection and show blocking, deflection, or the helmet falling off, then be handled as normal damage; only after the protection is depleted does the head become a lethal weak point again.
- Defeated characters should fall or enter a clear death state and cannot continue aiming or attacking. Embedded arrows, dropped protection, or death animations on defeated enemies may remain as battlefield feedback.
- After an enemy dies, if the platform or level configuration has a subsequent wave, the next enemy should spawn after a brief interval with visible arrival feedback. The player must defeat all waves to complete the level.

## Enemies and Platforms

- Enemies should face the player's side and be able to adjust their aiming posture based on the player's position. When an enemy draws a bow, the player should be able to see that an attack is imminent; after release, the enemy arrow flies from the position of the enemy's bow toward the player.
- Enemies may differ in body size, health, protection, weapon strength, shooting frequency, hit tendency, and headshot tendency. The differences should appear in combat pacing, durability, and danger, rather than only as hidden values.
- Platforms are part of the level structure. Characters should stand on platform surfaces; moving platforms should carry the enemies standing on them, forcing the player to anticipate target positions.
- Some platforms may serve as wave control points and be visible or active only when the corresponding enemy appears. When later enemies appear, the relationship between the platform and enemy positions must be clear.

## Power-Ups and Special Arrows

- Floating or falling power-up bubbles appear during combat. Bubbles should move, sway, or fall within the shootable area and disappear after timing out or leaving the battlefield.
- The player must hit a bubble with an arrow to obtain the power-up. After being hit, the bubble should burst and indicate collection through an icon flying toward the player or a change in the HUD.
- The player can hold only one current special-arrow effect at a time; obtaining a new effect replaces or refreshes the current effect. The HUD should show the current effect and remaining uses.
- The multi-arrow effect causes the next shot, or a limited number of subsequent shots, to fire multiple slightly spread arrows. Its benefit is covering a wider angle and improving the chance of a hit or combo, at the cost of consuming power-up uses while remaining subject to cooldown and aiming risks.
- After an ice arrow hits an enemy, it should produce a freezing visual and temporarily prevent the enemy from aiming or shooting, creating a safe window; when the freeze ends, thawing feedback should appear and the enemy resumes acting.
- After a fire arrow hits an enemy, it should produce a burning visual and deal damage over time, helping make up damage or defeat an enemy with low remaining health; the burning should remain visible during its duration and affect the enemy's health.

## Combos, Rewards, and Progress

- Defeating enemies in rapid succession should produce combo feedback. Combos or consecutive headshots can provide additional coin rewards, shown on the battlefield or in the results as extra earnings.
- The victory star rating primarily reflects the quality of the player's level completion and should at least relate to remaining health. Higher health produces a higher star rating; even the lowest-quality victory should provide a result that allows progression to continue.
- Victory rewards include the level's base coins, rewards after the star-rating effect, and a combo bonus. Failure may also grant a small amount of consolation coins, but it cannot advance the level-completion star rating.
- After a level is completed, its highest star rating should be saved, and the level record should increase only when a new result is better. Completing the current highest unlocked level unlocks the next level.
- The main menu should display total stars, the number of completed levels, and overall progress. Level selection should distinguish completed, current, locked, and star-rating states; locked levels cannot be started.

## Equipment Shop

- The shop should offer two categories of equipment: bows and head protection. Bows affect the player's arrow damage or combat efficiency; head protection increases health or provides a limited number of headshot blocks.
- Shop items should display price, purchased/unpurchased status, equipped status, and key effects. The player can purchase an item when they have enough coins, after which it is equipped automatically or can be equipped immediately.
- A purchase should be rejected when there are insufficient coins; the coin amount, purchased status, and equipped status remain unchanged, and a clear unavailable-for-purchase state is shown.
- Purchased equipment can be switched; an equipped item should not incur another charge. Equipment changes should be reflected in the player's health, protection, or damage performance on the next attempt or after restarting the current level.
- The shop can be entered from the main menu or from the failure flow, allowing the player to use coins earned from failure to adjust strategy before retrying.

## Menus, States, and Flow

- After launch, loading should complete before entering the main menu or first-time play flow. A first-time player may enter the first level directly; after returning to the menu, progress, play, shop, settings, and leaderboard entries should be visible.
- Starting the game proceeds through level selection. After an unlocked level is selected, the menu obstruction closes, an operable battlefield appears, and the loop begins.
- Pause can be triggered only during normal combat. After pausing, battlefield updates stop, the pause panel prevents further shooting, and options to resume, restart, and return to the menu are provided. After resuming, the battlefield continues; restarting should clear old arrows, enemy states, power-ups, and temporary rewards.
- The victory result should allow continuation to the next level or a reasonable retry/return flow; the failure result should allow retrying, entering the shop, or returning to the main menu.
- While a terminal panel is displayed, battlefield input should not continue to fire arrows or change the combat result. Returning to the menu should stop the current level loop and hide the combat panel.
- Settings should at least cover sound-effect and music toggles and save the player's choices. The leaderboard may display rankings by total stars; when the network is unavailable or no ranking data exists, it should show an empty state or load-failure state rather than blocking the game.
- Tutorial prompts may appear in the first few levels to demonstrate dragging to aim and releasing to shoot. After the player's first real interaction, the tutorial should disappear and save its completion state.

## Failure, Rejection, and Invariants

- In a non-combat state, while paused, after the player has died, while victory is pending, while a result panel is open, or before the cooldown has ended, the player cannot successfully fire a new arrow.
- A locked level cannot be clicked to start; closing level selection should return to the previous menu or combat state and should not accidentally start a level.
- Coins cannot become negative. Failure rewards, victory rewards, purchase costs, and combo bonuses must be synchronized across all visible coin displays.
- Health cannot contradict itself between the display layer and combat layer; after a character dies, health should be zero or the character should be in a clear death state, and the character cannot continue attacking.
- Power-up uses cannot be less than zero; after a special arrow is fired, a use should be consumed, and after uses are depleted, arrows return to normal.
- Restarting or entering a new level must clear old arrows, particles, temporary power-ups, combo timing, death states, and pause state, while preserving long-term progress, coins, purchased equipment, and settings.

## Priority and Scope Reduction

- P1 must include: main menu/level entry, genuine drag aiming and release-to-shoot, curved flight, enemies taking hits and counterattacking, the player taking damage/failing, victory after eliminating all enemies, stars/coins/unlocks, pause/restart, basic shop equipment purchases, locked-level rejection, and insufficient-coin rejection.
- Optional P2 enhancements include: online leaderboard, complete tutorial demonstration animations, rich sound effects and music, elaborate wave fade-ins, slow motion/screen shake/vibration, embedded arrows rotating with bodies, dropped-protection animations, appearance previews for all equipment, and fully differentiated artwork for all levels.
- Scope reduction: creation/editing modes, debug hotkeys, development parameter panels, level preset editing, exact asset appearance, exact audio resources, fixed copy, fixed layout, and any internal tools that serve only debugging or creation are not part of the target playability bar.

---

## GDD / Design Doc (merged from design-doc.md)

# Stickman Anchor Design Doc

## Design Intent

Stickman Anchor is a side-view 2D stickman archery duel. The player controls aiming and shot timing, not character movement. Playability comes from reading the battlefield, dragging to set a bow angle, releasing an arrow with visible gravity, surviving enemy counterfire, and converting accurate hits into level progress, coins, stars, and equipment growth.

The game must feel like a real projectile duel instead of a click-to-resolve combat screen. The player should always be able to connect input to visible bow posture, trajectory preview, arrow flight, impact feedback, enemy behavior, health changes, rewards, and retry or continuation flow.

## MDA

### Mechanics

- Enter an unlocked level from a menu or first-time flow, then play on a side-view battlefield with a player archer, enemies, platforms, health bars, arrows, and HUD rewards.
- Press or touch the battlefield to begin aiming. While held, dragging continuously changes the player's upper body, bow direction, bowstring/drawn-arrow state, aim control, and trajectory preview.
- Release to shoot when combat state and cooldown allow it. The arrow leaves the bow, travels through the scene, drops under gravity, and can hit enemies, hit a power-up bubble, or miss by leaving the field.
- The player does not walk or jump. The main input changes aim angle and shot moment, so challenge comes from angle reading, gravity, height differences, moving targets, enemy counterfire, cooldown, and risk of over-aiming.
- Enemy archers aim and fire back on their own cadence. Their arrows also travel visibly and can damage or defeat the player through body or head hits.
- Body hits deal normal damage. Head hits are high-value hits with stronger feedback and can instantly defeat unprotected targets. Head protection can block limited head hits before becoming ineffective.
- Defeated enemies stop attacking and fall or enter a clear death state. Queued enemies can appear after a delay on their platform, with visible arrival feedback.
- Victory occurs after all active and queued enemies for the level are defeated. Defeat occurs after the player is killed by enemy arrows and the death feedback has been shown.
- Power-up bubbles appear during combat, move through the shootable area, and must be popped by arrows. Collected power-ups replace the current held special arrow effect.
- Special arrows add tactical depth: multi-arrow widens the next shot pattern, ice arrows temporarily stop enemy attacks, and fire arrows visibly burn enemies while dealing continuing damage.
- Fast kills and repeated headshots can build combo feedback and bonus coins.
- Victory grants stars and coins, updates the highest star record for that level, and unlocks the next level when appropriate. Failure can grant small recovery coins without marking the level complete.
- The shop allows buying and equipping bows and head protection. Bows improve offensive efficiency; head protection improves survival or headshot blocking. Purchases require enough coins and must not double-charge equipped or owned items.
- Pause, restart, return to menu, settings, level select, locked-level rejection, and result panels define the outer state machine.

### Dynamics

- The player studies enemy placement and platform motion, then chooses how long to aim before releasing. Longer aiming can improve accuracy but gives enemies more time to fire.
- Dragging upward should visibly lift the bow and preview so the released arrow rises before falling. Dragging downward should visibly lower the bow and preview so the arrow travels flatter or descends sooner. Opposite drag directions must produce opposite visible aim results.
- Missed shots cost time and cooldown. Because enemies continue their own attack loop, every poor angle increases the chance of taking damage before the player can correct.
- Headshots offer faster kills, stronger feedback, combo potential, and higher reward pressure, but they require finer aim and may be mitigated by head protection.
- Moving platforms and height differences create prediction challenges: the best release angle and moment shift as enemies move or stand above or below the player.
- Power-up bubbles introduce opportunistic decisions. Shooting a bubble can improve the next attack but may also consume time or cause the player to miss a direct enemy shot opportunity.
- Equipment creates a long-term loop: coins from victory, combo, and failure let the player buy better gear, then gear makes later levels more survivable or faster.
- Pause and result overlays interrupt the action; the player cannot keep shooting while these states block the battlefield.

### Aesthetics

- Precision: the player feels that better reading of angle, gravity, and timing produces better outcomes.
- Tension: enemies visibly prepare and fire back, so aiming is not free.
- Impact: arrows have readable flight, trails or equivalent motion cues, hit particles, health changes, stuck-arrow or impact feedback, and stronger headshot effects.
- Progress: stars, coins, unlocks, gear ownership, and menu progress make each completed level feel consequential.
- Recovery: failure still gives a clear cause and routes the player toward retrying or visiting the shop.

## Core Loop

### P1 Executable Trajectory: Level Combat

1. **Start or reset:** The player launches the game, enters an unlocked level, or restarts the current level. The battlefield becomes visible with the player on one platform, enemies on other platforms, health indicators, coins or level HUD, and no blocking overlay.
2. **Player input:** The player presses or touches the battlefield, drags to aim, and watches the bow posture, drawn string or arrow, aim control, and trajectory preview update continuously.
3. **Continuous state change:** Upward drag raises the visible aim and projected arc; downward drag lowers it. Releasing while allowed ends aim state and fires one normal or special shot. The arrow travels forward from the bow, curves under gravity, and leaves a readable path.
4. **Goal and risk:** The goal is to hit enemies, preferably headshots, while avoiding enemy counterfire. Risk increases when the player takes too long, chooses a bad angle, fires during poor timing, misses moving targets, or wastes cooldown.
5. **Reward or failure:** A hit reduces enemy health or kills the enemy with body/head-specific feedback. A miss does no damage and leaves the enemy attack loop active. Enemy arrows can reduce player health or kill the player, after which death feedback leads to failure.
6. **Progress or restart:** Defeating all enemies and queued waves triggers a delayed victory result with stars, coins, combo bonus, saved level progress, and next-level continuation. Player death triggers a delayed failure result with retry, shop, or menu routes. Restart clears transient arrows, power-ups, particles, deaths, combo state, cooldown, and pause state while preserving long-term progress.

### P1 Executable Trajectory: Progress And Gear

1. **Start or reset:** From the menu, the player sees total progress, available level selection, coin total, and shop entry.
2. **Player input:** The player selects an unlocked level to play, or opens the shop and chooses a bow or head-protection item.
3. **Continuous state change:** Completing levels increases stars, coins, and unlock state. Buying gear subtracts coins only when affordable and changes owned/equipped status. Equipping owned gear changes the next combat attempt's damage, health, or head protection.
4. **Goal and risk:** The goal is to advance through harder levels. Risk comes from spending limited coins poorly, attempting locked levels, or replaying without enough gear improvement.
5. **Reward or failure:** Successful purchases improve combat capability. Insufficient coins or locked levels are rejected without mutating progress, coins, ownership, or equipped state.
6. **Progress or restart:** The player returns to level selection or retries combat with updated long-term state. Failed combat can still feed the shop loop through small coin recovery, but it does not award stars or level completion.

## M-Features

| ID | Feature | Priority | Player-Facing Requirement |
|---|---|---|---|
| M1 | Menu and level entry | P1 | The player can start from first-time flow or menu, view progress, open level select, and enter unlocked levels without a blocking overlay remaining over combat. |
| M2 | Drag aim feel | P1 | Press/hold/drag continuously changes bow posture, drawn state, aim control, and trajectory preview with correct up/down visual causality. |
| M3 | Release-to-shoot projectile | P1 | Releasing allowed aim fires visible arrows that start from the bow, travel through the battlefield, curve downward, can miss, and obey cooldown pacing. |
| M4 | Enemy archer counterfire | P1 | Enemies visibly aim, pull, and fire back; enemy arrows can damage or kill the player. Frozen or dead enemies do not continue attacking. |
| M5 | Hit zones and feedback | P1 | Body hits, head hits, protected head hits, death states, particles/effects, health bars, stuck arrows or equivalent impact evidence all communicate combat results. |
| M6 | Victory and defeat flow | P1 | All enemies and queued waves defeated leads to delayed victory rewards; player death leads to delayed failure with retry/shop/menu options. |
| M7 | Platform and wave pressure | P1 | Platforms structure the battlefield; moving platforms carry enemies, and queued enemies appear with visible feedback before they participate in combat. |
| M8 | Power-up bubbles and special arrows | P1 | Shootable bubbles can be collected; the current special arrow is shown and consumed; multi, ice, and fire effects alter combat with visible benefit and cost. |
| M9 | Stars, coins, unlocks, combos | P1 | Level quality produces stars, rewards include coins and combo bonuses, best stars persist, and completing the frontier unlocks the next level. |
| M10 | Equipment shop | P1 | Bows and head protection can be bought, equipped, rejected when unaffordable, and reflected in later combat damage, health, or head protection. |
| M11 | Pause, restart, state blocking | P1 | Pause stops combat and blocks shooting; restart cleans transient state; terminal/result states block further battlefield shots. |
| M12 | Settings and leaderboard shell | P2 | Audio settings persist, and leaderboard can show ranking, empty, loading, or failed-load states without blocking the game. |
| M13 | Tutorial onboarding | P2 | Early levels can show drag/release guidance that disappears after real player interaction and remains completed later. |
| M14 | Enhanced presentation | P2 | Slow motion, shake, vibration, rich audio, detailed gear previews, falling protection, and animation polish deepen feedback but are not required for P1 playability. |

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure, rejection, or invariant |
|---|---|---|---|---|
| M1 Menu and level entry | P1 | Start game, open level select, choose unlocked level | Menu closes, combat battlefield becomes playable, current level state appears | Locked levels cannot start; menu panels must not block active combat after level entry |
| M2 Drag aim feel | P1 | Hold and drag on battlefield | Bow/body angle, drawn-string state, aim control, and trajectory preview update continuously | Opposite up/down drag directions must not produce the same visible aim; non-combat overlays block aiming |
| M3 Release-to-shoot projectile | P1 | Release after aiming while cooldown and combat state allow | Arrow launches from bow, follows visible curved path, may hit or miss | Cooldown or invalid phase prevents extra shots; missed arrows do not damage enemies |
| M4 Enemy counterfire | P1 | Let combat run while enemies are alive | Enemies pull bows, fire visible arrows, and can damage the player | Dead, frozen, unspawned, paused, or terminal-state enemies cannot keep attacking |
| M5 Hit zones and feedback | P1 | Hit body, head, or protected head | Health changes, death/impact feedback, stronger headshot feedback, protection block or removal feedback | Dead characters stop attacking; health display and combat state must not contradict each other |
| M6 Victory and defeat | P1 | Defeat all enemies, or let player die | Victory or failure panel appears after visible feedback delay; retry/continue/menu routes appear | Terminal panels block new shots; failure does not mark level completion |
| M7 Platforms and waves | P1 | Play levels with moving platforms or queued enemies | Platforms carry enemies; next enemy appears after a killed enemy when the queue requires it | Victory waits for queued enemies; unspawned enemies are not valid targets or attackers |
| M8 Power-ups | P1 | Shoot a moving bubble, then fire with collected effect | Bubble breaks, collection feedback reaches player/HUD, special arrow is consumed and applies its effect | Only one current special effect is held; charges cannot go below zero |
| M9 Progress rewards | P1 | Win a level or chain quick kills | Stars, coins, combo bonus, saved best stars, and unlock progress update visibly | Coins remain non-negative; lower star replays do not reduce best stars |
| M10 Shop equipment | P1 | Buy/equip affordable or owned gear; attempt unaffordable gear | Coins, ownership, equipped state, and later combat stats change appropriately | Unaffordable purchase and already-equipped item do not spend coins incorrectly |
| M11 Pause/restart | P1 | Pause, resume, restart, or return to menu | Combat stops/resumes, restart resets transient combat, menu return hides battlefield loop | Pause/result/menu states block shooting and prevent stale arrows or deaths from leaking into new runs |
| M12 Settings/leaderboard | P2 | Toggle audio settings or open leaderboard | Settings persist; ranking/empty/loading/failure state is visible | Network or missing ranking data must not block play |
| M13 Tutorial | P2 | First early-level interaction | Guidance appears before use, then disappears and saves completion | Tutorial must not permanently block combat input |
| M14 Presentation depth | P2 | Trigger headshot, protection block, special arrows, victory | Stronger audiovisual and animation feedback reinforces outcomes | Polish cannot replace actual hit, reward, or state transitions |

## Mechanism Coverage Matrix

| Game Spec Area | Covered M-features | P1 Coverage Expectation |
|---|---|---|
| Side-view battlefield and player/enemy/platform readability | M1, M4, M7 | Player, enemies, platforms, arrows, health, and HUD are visible during combat. |
| Drag aiming and operation feel | M2, M3 | Continuous hold/drag/release chain preserves correct visible aim direction, trajectory preview, release, cooldown, and gravity. |
| Projectile hit resolution | M3, M5 | Arrows travel through space; body, head, protected head, miss, and off-field outcomes remain distinct. |
| Enemy behavior and risk | M4, M6 | Enemy aiming and arrows create real failure pressure; death/freeze/terminal state removes that pressure. |
| Waves and moving platforms | M7 | Moving targets and queued enemies affect the combat objective and victory timing. |
| Power-ups and special arrows | M8 | Bubbles, collection, held effect, consumption, multi/ice/fire benefits, and charges are visible. |
| Rewards and progression | M6, M9 | Victory, failure, stars, coins, combo bonus, unlocks, and saved best records form a closed progression loop. |
| Shop and equipment | M10 | Coins can be spent on gear, gear can be equipped, insufficient funds are rejected, and gear affects later combat. |
| State machine and overlays | M1, M6, M11 | Menu, level select, pause, victory, failure, retry, shop, and menu return have clear blocking and cleanup rules. |
| Secondary systems | M12, M13, M14 | Settings, leaderboard, tutorial, and presentation enhancements enrich the game without adding hidden P1 win conditions. |

## State Flow

- **Loading:** Essential visuals and UI prepare. When complete, the player reaches first-time play or the main menu.
- **Menu:** Progress, play, shop, settings, and leaderboard are available. Starting play opens level selection.
- **Level select:** Unlocked levels can start; locked levels visibly remain unavailable.
- **Playing:** The battlefield updates: aiming, arrows, enemies, platforms, power-ups, health, combo, cooldown, and HUD are active.
- **Paused:** Battlefield updates and shooting stop until resume, restart, or menu return.
- **Victory pending:** Final combat feedback remains visible briefly after the last enemy dies; new shots are blocked.
- **Result:** Victory rewards and continuation choices appear. Continuing advances to the next available level or a sensible loop.
- **Failure:** Death feedback precedes the failure panel. Retry resets the level; shop and menu options preserve long-term state.

## Priority And Scope

P1 is the playable identity of the game: menu/level entry, drag aim, release shooting, gravity projectiles, enemy counterfire, body/head hit feedback, player death, all-enemy victory, stars/coins/unlocks, pause/restart, basic shop, locked-level rejection, and insufficient-coin rejection.

P2 is depth and polish: online leaderboard, richer tutorial animation, advanced audiovisual effects, elaborate protection-drop animation, detailed gear previews, complete cosmetic variation, and nonblocking ranking failure states.

Cut scope stays outside the required gameplay target: editor tools, development shortcuts, parameter panels, level creation tooling, specific visual/audio materials, fixed text, fixed layout, and any non-player-facing construction details.

## Design Review

- `design-doc.md` expands only the behaviors already present in `source-anatomy.md` and `game-spec.md`.
- The P1 core loop is expressed as executable trajectories from start/reset through input, continuous state change, risk, reward/failure, and progress/restart.
- Direction-sensitive archery feel is preserved: drag direction visibly changes aim and preview, release fires according to that aim, gravity changes the arrow path, cooldown gates repeated shots, and missed shots increase counterfire risk.
- No hidden gameplay beyond `game-spec.md` was added. The reviewed player-visible mechanics were already represented in `game-spec.md`, so no rollback edit to `game-spec.md` was required.
