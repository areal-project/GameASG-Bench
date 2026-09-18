# Stickman Archer Gameplay Requirements

## Product Positioning

Stickman Archer is a side-view 2D stickman archery combat game. The player controls an archer on the platform on the left and exchanges arrows with enemy archers on platforms on the right, clearing the enemies in each level by dragging to aim, releasing to shoot, and judging projectile drop and the rhythm of enemy counterattacks. The game needs to present a readable battlefield, archer poses, arrow flight trajectories, hit feedback, health changes, victory and defeat overlays, level progression, and equipment growth.

The P1 acceptance threshold is: the player can enter a level from the menu, use a mouse or touch to draw the bow, aim, and shoot, arrows fly at a visible angle and are affected by drop, hitting an enemy causes visible damage or a kill, enemies counterattack, and the player can win, lose, retry, pause, and continue progressing along at least one level route. P2 covers a longer level path, complete shop equipment, special arrows, combos, a leaderboard, audio settings, chests, and editor-type extensions.

## Core Loop

Each level begins with a visible battlefield: the player's archer is on the left, enemies and platforms are on the right or at higher positions, and both sides' health bars are displayed near their characters. The player drags to adjust the bow angle and releases to fire an arrow; the arrow flies across the battlefield and may hit an enemy's head, body, armor, or an item bubble, or fly out of bounds. Hitting an enemy reduces its health bar and produces particles/sound effects/an embedded arrow or a death animation; missing gives enemies more time to counterattack.

Enemies are not static targets. Surviving enemies aim at the player and periodically draw and shoot, and enemy arrows can likewise hit the player's head or body. When the player's health is depleted, the defeat flow begins, a small consolation reward is granted, and the player can retry, return to the main menu, or open the shop. After all enemies that have appeared are eliminated, the victory flow begins, stars and coins are awarded based on remaining health, the best star rating is saved, and subsequent levels are unlocked.

## Input Semantics and Control Feel

The primary input is pressing, dragging, and releasing a mouse or touch on the battlefield. After pressing the battlefield, the player immediately enters the bow-drawing aim state: the archer's upper body and bow rotate toward the current angle, the bowstring/draw pose becomes visible, and a preview appears to help judge the flight arc. Dragging does not change shot power; instead, it continuously adjusts the launch angle along a virtual curved control region. Dragging upward should move the bow and preview trajectory toward a higher arc, dragging downward should move them toward a lower arc, and dragging in opposite directions must produce opposite visible angle responses.

During continuous dragging, the bow angle must change smoothly and be constrained to a forward-firing range the player can understand, avoiding backward shots or sudden angle jumps. Releasing immediately fires one arrow at the current angle; the arrow leaves from near the bow, first travels in the direction the bow points, then gradually drops under gravity and leaves a visible trail. After firing, the bow returns to the non-drawn state, and repeated releases within a short period must not create extra arrows or consume special arrows. Battlefield dragging must not continue firing while paused, after victory or defeat, when the player is dead, or while a panel blocks the battlefield.

The shooting feel of this game is “hold to draw and adjust the angle, then release to fire at fixed power,” not “pull backward away from the target to charge and then slingshot in the opposite direction.” The player's risk comes from judging angles, projectile drop, enemy firing times, moving platforms, and the difference between head and body hits, rather than from a charge meter or variable firing speed.

## Combat Rules and Visible Feedback

Arrows need a real flight process and cannot determine hits instantly. During flight, their direction and speed trend should remain readable; they should curve gradually under the effect of drop and be cleaned up after leaving the battlefield. Both player and enemy arrows can hit characters; enemy arrows that hit the player reduce player health, and player arrows that hit enemies reduce enemy health or kill them.

Head hits are high-value actions: a head hit on an unarmored target should kill instantly and provide stronger feedback, such as a special icon, particles, a brief pause, screen shake, or a more prominent sound effect. Body hits only deal damage and show the result through the health bar, damage particles, and embedded arrows. Armor can block a limited number of instant kills from head hits, converting them to normal damage and showing armor-block or armor-drop feedback; after the armor is depleted, subsequent head hits regain the instant-kill effect.

After an enemy dies, it should show falling down, dropping, or other death feedback before disappearing, and it must no longer fire. If a platform or level configuration contains waves of enemies, subsequent enemies must appear visibly after the current enemy dies so the player does not mistakenly think the level has ended. High-health enemies or bosses need to be tougher and provide additional reward feedback when defeated.

## Enemy and Scene Systems

Enemies should aim based on the player's position, briefly prepare by drawing the bow, and then shoot an arrow. Enemy hit behavior can include body hits, misses, and head threats; different enemies may have different health, body sizes, bows, armor, accuracy, shooting rhythms, and degrees of head-shot threat. Frozen enemies should temporarily stop drawing and firing; burning enemies should take continuous damage and display flames or burning feedback.

Platforms are part of the battlefield space. Normal platforms support characters; moving platforms travel back and forth horizontally or vertically and carry enemies standing on them, changing the player's required lead and hit window. Platform movement should be visible and smooth, with an understandable rhythm at endpoints or when reversing direction.

## Special Arrows and Battlefield Items

Floating or falling item bubbles may appear during combat. The player must hit a bubble with an arrow to collect it; when hit, the bubble should burst, and its icon or energy should fly toward the player, after which the current special arrow and remaining uses are shown in the HUD or bow-and-arrow effects. If a bubble times out or leaves the battlefield, it should disappear naturally and must not reward the player.

Special arrows are a P2 depth system: a multi-arrow shot fires multiple arrows in a fan on the next shot, increasing coverage while consuming one special opportunity; an ice arrow freezes an enemy on hit, creating a brief safe window; a fire arrow continuously burns an enemy after hitting, allowing a delayed kill. When a special arrow hits armor, it should still visibly apply its status effect, but it cannot bypass the armor's head-hit blocking rule. A new special arrow can replace the currently held special arrow, avoiding stacks of unreadable states.

## Levels, Victory and Defeat, and Progress

Levels should gradually increase in difficulty, including more enemies, enemy waves, moving platforms, armored enemies, high-health bosses, greater enemy hit threats, and more complex positioning. After victory, the player receives a rating of 1 to 3 stars based on remaining health; replaying the same level only saves a better star rating. Completing a level unlocks the next level, and the main menu and level selection need to display the number of cleared levels, total stars, a progress bar, unlocked/locked states, and each level's star rating.

Defeat occurs after the player's health is depleted. A visible falling-down or dropping response should play before the defeat panel appears; the defeat panel needs to provide paths to retry, return to the main menu, and enter the shop. Defeat can grant a small consolation coin reward, but it cannot unlock the next level or improve the star rating. After victory and defeat panels appear, battlefield input should be locked, and old arrows, enemies, and state must not contaminate a retry or the next level.

## Menus, Panels, and Modes

Startup needs loading or preparation feedback. First-time play may enter the first level directly; players with existing progress should see the main menu, which provides at least start/level selection, shop, settings, and leaderboard entries. The start entry opens the level selection panel, and the player can only enter unlocked levels; locked levels must be visible but cannot be started.

The game needs an in-game pause button. Pausing displays a blocking panel and stops combat progression, offering continue, restart, and return to main menu; continue resumes combat, restart clears the current level's transient state and begins it again from its opening state, and return to main menu stops the current battle and displays progress. When panels such as the shop, settings, leaderboard, and level selection appear, they should clearly block the view and prevent accidental battlefield input; closing them or clicking the background returns to the previous operable state.

The settings panel provides at least sound-effect and music toggles and saves those choices. The leaderboard is P2: it displays rankings by total stars, the player's rank, or a no-data state; when the leaderboard is unavailable, it should display an empty state or loading-failure notice rather than blocking the main flow.

## Economy, Shop, and Equipment

Coins come from level-clear rewards, combo/boss rewards, and defeat consolation rewards. The coin count needs to remain synchronized across the main screen, combat HUD, victory/defeat, and shop. Coins must not become negative.

The shop needs equipment categories, current coins, purchasable/unpurchasable/owned/equipped states, and equipment previews. P1 covers at least bows and helmets: bows increase player damage, helmets increase health and provide head-hit blocks, and a successful purchase is equipped automatically or manually and reflected in damage, health, or armor feedback in the next battle. When coins are insufficient, the purchase button should be unavailable or have no effect when clicked, and the coin and ownership states must remain unchanged.

P2 equipment includes chest armor, leg armor, gloves, chests, and set effects. After spending coins, a chest randomly grants one piece of equipment, displays the acquired item, and allows continued shop browsing. Complete armor can increase health or trigger special set benefits, such as continuous ascent or additional survivability; these benefits must have a visible manifestation and a clear cost in battle. If P2 equipment does not fully support saving, purchase state, and battle effects, it must be marked as an optional extension in the delivery scope and must not be presented as P1.

## Combos, Rewards, and Presentation

Consecutive kills within a short time should form a combo, display a combo notice on screen, and grant extra coins; consecutive head hits may form an additional reward. Defeating a boss should grant extra coins and more prominent text or visual feedback. The combo resets to zero after the combo window ends and also when a new level begins.

Hits, shooting, bubble bursts, special arrows, victory, defeat, and head hits should all have sufficient visual feedback; audio enhances the experience but cannot be the only feedback. The HUD displays at least the current level, coins, player health, enemy health, and special-arrow state. The battlefield image must be nonblank and readable, and characters, platforms, arrows, health bars, and panels must not overlap enough to interfere with play.

## Failure, Rejection, and Stability Rules

During non-combat phases, while paused, during victory/defeat phases, after player death, on locked levels, when coins are insufficient, or after special-arrow uses are depleted, player actions should be rejected or leave state unchanged and give a visible unavailable state or a naturally ineffective result. Rejection must not deduct coins, fire arrows, unlock levels, increase stars, or change equipment ownership.

Retry must clear the level's transient objects: flying arrows, embedded arrows, particles, temporary special arrows, enemy death state, player death state, screen shake, combos, and pause state. Returning to the main menu must stop combat progression and the combat music state. Entering the next level must load that level's new enemies, platforms, background, player position, and reward rules.

## P2 and Cut Scope

P2: a complete long progression of more than twenty levels, distinct boss-battle music, leaderboard submission, complete armor slots, random chest rewards, set-based flying abilities, audio asset quality, tutorial gestures, fine-grained enemy body-size editing, a level editor, hidden maintenance shortcuts, and creation-mode tools.

Cut scope: P1 does not require a level editor, hidden maintenance shortcuts, an available external leaderboard service, exact consistency for all equipment icons, an exactly matching total number of long-progression levels, or a reliably available online storage service. If these systems are omitted, the game must still retain the core shooting combat, victory-and-defeat loop, level unlocking, and the primary visible coin-shop path, and clearly mark them as P2 in the product scope.

---

## GDD / Design Doc (merged from design-doc.md)

# Stickman Archer Design Doc

## Design Goals

Stickman Archer is a side-view 2D stickman archery duel game. The player controls an archer on the left platform, using press-and-hold, drag-to-adjust-angle, and release-to-shoot controls to defeat enemy archers on platforms to the right or above. The core experience is readable bow-drawing poses, continuous angle adjustment, arrow trajectories affected by drop, the difference between head and body hits, the pressure of enemy counterattacks, victory and defeat resolution, level unlocking, and coin-and-equipment growth.

The P1 acceptance threshold is a complete playable combat loop: after entering a level, both sides, the platforms, health, and arrows are clearly visible; player input can change the bow angle and trajectory preview; releasing produces a shot with a flight process and drop; hits change health and feedback; enemies draw and counterattack on a rhythm; the player can win, lose, pause, retry, enter the next level, or return to the menu; and coins, stars, unlocks, and the basic shop form a progression system. P2 covers a longer level path, complete equipment slots, deeper special-arrow systems, combos, chests, a leaderboard, tutorials, settings, audio, and editor-type extensions.

## MDA

### Mechanics

- **M1 Battle Start and Scene Readability**: After entering a level from the menu or on first play, the player archer, enemy archer, platforms, health, level information, coins, and interactive battlefield are shown; pause, victory/defeat, and other panels prevent accidental battlefield input.
- **M2 Bow-Drawing Angle Input**: The player presses the battlefield to enter the aiming state and continuously drags to smoothly change the angle of the bow and preview trajectory; dragging upward makes the preview higher, dragging downward makes it lower, and input in opposite directions must produce opposite visible responses. This control feel uses fixed-power, angle-adjusted shooting, not a backward pull to charge followed by a reverse slingshot.
- **M3 Arrow Flight and Hits**: Releasing fires an arrow at the current angle; it leaves from near the bow, travels along its initial direction, and gradually drops. Arrows can hit enemies, the player, or item bubbles, or fly out of bounds.
- **M4 Layered Hit Feedback**: A head hit on an unarmored target directly kills it and provides stronger feedback; a body hit deals damage and gives feedback through the health bar, particles, and embedded arrows; armor blocks instant kills from head hits a limited number of times and converts them to normal damage, with head-hit instant kills restored after depletion.
- **M5 Enemy Counterattack**: Surviving, unfrozen enemies aim at the player, first prepare by drawing the bow, and then fire arrows on a rhythm; enemy arrows likewise have a flight process and can hit the player.
- **M6 Level Victory-and-Defeat Loop**: Victory occurs after all enemies that have appeared are eliminated, granting stars and coins based on remaining health and unlocking subsequent levels; when player health is depleted, death feedback plays and the defeat panel appears, and defeat grants only a small amount of coins without unlocking levels or improving stars.
- **M7 Level and Spatial Variation**: Levels gradually add more enemies, enemy waves, moving platforms, armor, high-health enemies, bosses, and complex positioning; moving platforms carry enemies and change the aiming window.
- **M8 Special Arrows and Item Bubbles**: Bubbles may appear in combat and the player must hit them with an arrow to collect them; special arrows include multi, ice, and fire arrows as a P2 depth enhancement.
- **M9 Economy and Equipment**: Coins come from victory, combo/boss rewards, and defeat consolation rewards; at P1, the shop supports at least bows and helmets, with bows affecting damage and helmets affecting health and head-hit blocking; insufficient coins, owned, and equipped states are all explicit.
- **M10 Menus, Pause, and Auxiliary Panels**: The main menu, level selection, shop, settings, leaderboard, victory, defeat, and pause panels form a clear state flow; opening a panel prevents battlefield input, and closing it returns to the correct state.
- **M11 Combos, Rewards, and Presentation**: Consecutive kills and consecutive head hits within a short period may grant extra rewards and notices; defeating a boss grants additional feedback. This system enhances satisfaction and gains and is P2 depth.
- **M12 P2 Cut Systems**: The complete long level path, complete armor slots, random chest rewards, set abilities, leaderboard service, tutorial gestures, audio quality, level editor, and hidden maintenance tools are all P2 or cut scope rather than required P1 items.

### Dynamics

- The player adjusts the shooting angle by observing enemy height, platform movement, projectile drop, and the rhythm of enemy counterattacks. Dragging aim increasingly higher or lower directly changes the preview and the next arrow's trajectory, forming a continuous “read the scene -> adjust the angle -> release the arrow -> watch the trajectory -> correct” learning process.
- Combat pressure comes from enemies not waiting for the player: dragging and trial shots consume time, and misses give enemies a counterattack window; after enemy arrows hit the player, remaining health affects both the risk of defeat and the victory star rating.
- Head hits offer high rewards but require precision; body hits are more reliable but may require multiple arrows, giving enemies more chances to fire. Armored enemies prevent the player from relying only on a single head hit and require follow-up shots based on armor feedback.
- Moving platforms and enemy waves change the hit window, requiring the player to judge lead and rhythm. When subsequent enemies appear, the level objective expands from a single target to continuous clearing.
- Coins and equipment connect the outcome of a single battle to long-term growth: better bows make subsequent battles end sooner, and helmets increase tolerance for error, but purchases must be constrained by coins.

### Aesthetics

- **Sense of Precision**: The bow angle, preview, and flight trajectory must make the player believe that hits or misses result from their own angle judgment.
- **Sense of Tension**: Enemies drawing their bows and incoming arrows create countdown pressure, and pause and panels must clearly interrupt that pressure.
- **Sense of Impact**: Head hits, enemies falling, screen feedback, particles, and reward notices reinforce high-value actions.
- **Sense of Growth**: Stars, coins, unlocked levels, and equipment states let the player see continued improvement.
- **Readability**: Characters, platforms, arrows, health bars, bubbles, and panels must not overlap enough to interfere with judgment.

## P1 Core Loop Executable Traces

### Loop A: Normal Level Combat Loop

1. **Start/Reset**: The player enters an unlocked level from first-time play, the main menu, or level selection; retry clears old arrows, particles, death, pause, temporary special arrows, and combo state, then reloads the player, enemies, platforms, health, and HUD for the current level.
2. **Player Input**: The player presses and continuously drags on the battlefield. Pressing immediately enters the bow-drawing aim state, and the archer's upper body, bow, and preview trajectory respond; dragging upward makes the firing angle and preview arc higher, dragging downward makes them lower, and the drag changes smoothly while remaining constrained to a forward-firing range.
3. **Continuous State Changes**: During dragging, the bow angle continuously updates, while surviving enemies continue waiting or drawing; after release, only one arrow is fired at the current angle, the bow returns to its non-drawn state, and repeated releases during the firing cooldown do not create extra arrows.
4. **Goal/Risk**: The player's goal is to hit enemies with arrows and clear the level. Risks come from arrows dropping and missing, enemy counterattacks, moving platforms changing positions, differences between head/body detection, and declining player health.
5. **Reward/Failure**: A player arrow hitting an enemy causes body damage or a head-hit kill and produces health-bar, particle, embedded-arrow, death, or head-hit effects; a miss gives no reward and gives enemies more time to fire. An enemy arrow hitting the player reduces health, and the player dies and enters the defeat panel when health is depleted.
6. **Progress/Restart**: After all enemies die, the victory result is shown, stars and coins are awarded based on remaining health, a better star rating is saved, and the next level is unlocked; defeat gives a small number of coins but does not unlock. Battlefield input is locked after victory or defeat, and the player can retry, return to the menu, enter the shop, or continue along an unlocked route.

### Loop B: Enemy Counterattack and Survival Loop

1. **Start/Reset**: At level start, enemies are visibly alive and their health and platform positions are readable; pause, victory/defeat, or player death stops their effective attacks.
2. **Player Input**: While the player aims or waits, enemies independently adjust their aim based on the player's position; the player can reduce risk through faster kills, freezing effects, or equipment tolerance.
3. **Continuous State Changes**: An enemy enters a bow-drawing preparation, then fires an arrow; the enemy arrow has a visible flight, drop, and hit/miss process.
4. **Goal/Risk**: The player needs to deal enough damage before the enemy's next arrow. The enemy may hit the body or head; head threats are greater, and a helmet can mitigate them a limited number of times.
5. **Reward/Failure**: Successfully killing an enemy stops it from continuing to fire and may trigger a wave of enemies; failing to handle it in time causes player damage or death.
6. **Progress/Restart**: Victory begins after all enemies are cleared; player death leads to defeat, and retry restores the level's initial combat state.

### Loop C: Coin and Equipment Growth Loop

1. **Start/Reset**: The main menu, combat HUD, victory/defeat panels, and shop display synchronized coins; unlocked levels and star ratings are visible.
2. **Player Input**: The player earns coins by clearing, replaying, or failing levels, and can also enter the shop to purchase or equip bows and helmets.
3. **Continuous State Changes**: A successful purchase deducts coins and updates ownership/equipment state; when coins are insufficient, purchasing is unavailable or ineffective, and coin and ownership state remain unchanged.
4. **Goal/Risk**: The player's goal is to use coins to increase damage or survivability. The risk is that coins are limited, and equipment choices affect tolerance and enemy-clear speed in the next battle.
5. **Reward/Failure**: An equipped bow should appear in battle as higher damage, and a helmet as higher health or head-hit blocking feedback; a failed purchase cannot secretly change state.
6. **Progress/Restart**: Equipment and progress are saved for subsequent play; retry resets only the current level's transient state and does not clear legitimate progress or purchased equipment.

## Mechanism Coverage Matrix

| M-feature | Priority | Player Trigger | Observable Result | Failure/Rejection/Invariant |
|---|---|---|---|---|
| M1 Battle Start and Scene Readability | P1 | First entry, start, or selection of an unlocked level | The player, enemies, platforms, health bars, level, coins, and operable battlefield are visible | Locked levels cannot be started; the battlefield cannot be accidentally operated while a panel is open |
| M2 Bow-Drawing Angle Input | P1 | Press, drag, and release on the battlefield | Pressing enters aim, dragging continuously changes the bow angle and preview, and releasing fires | Cannot shoot outside combat, while paused, after victory/defeat, or when dead; cannot repeatedly create arrows during cooldown |
| M3 Arrow Flight and Hits | P1 | Release to fire, or an enemy completes drawing | The arrow leaves from near the bow, travels forward and drops, and its trajectory is readable | Flight cannot be replaced by instant hit detection; out-of-bounds arrows should be cleaned up |
| M4 Layered Hit Feedback | P1 | An arrow hits a head, body, or armor | A head hit kills or is blocked by armor; a body hit reduces health; health bars and feedback stay synchronized | Cannot be instantly killed by a head hit before armor blocks are depleted; dead enemies no longer fire |
| M5 Enemy Counterattack | P1 | The enemy's rhythm elapses while the player drags, waits, or after the player misses | The enemy aims, draws, and fires, and the player may take damage or die | Frozen or dead enemies, or enemies during pause or victory/defeat, cannot continue effective attacks |
| M6 Victory/Defeat Resolution and Restart | P1 | Clear enemies, player death, click retry/next level/return to menu | Victory stars and coins, defeat reward, retry cleanup, and next-level loading | Defeat does not unlock or improve stars; battlefield input is locked after a terminal result |
| M7 Level and Spatial Variation | P1/P2 | Enter a subsequent level or replay an unlocked level | More enemies, waves, armor, moving platforms, and high-health targets are visible | Enemy waves must appear clearly and cannot cause a mistaken premature victory |
| M8 Special Arrows and Bubbles | P2 | Hit a bubble with an arrow, then shoot | The bubble bursts and grants a special arrow; multi, ice, and fire have visible effects | Timed-out or departed bubbles grant no reward; normal shooting resumes after special uses are depleted |
| M9 Economy and Equipment | P1/P2 | Earn coins, purchase, equip, or attempt a purchase with insufficient coins | Coins stay synchronized; bows affect damage; helmets affect health or blocking; P2 armor and chests can extend the system | Coins cannot be negative; unpurchased items cannot be equipped; an insufficient purchase does not change ownership state |
| M10 Menus, Pause, and Auxiliary Panels | P1/P2 | Open the menu, level selection, pause, shop, settings, or leaderboard | The current panel clearly blocks the view and closing it returns to the correct state | Combat progression and battlefield input are locked according to state while a panel is open |
| M11 Combos and Extra Rewards | P2 | Consecutive kills or head hits within a short time | Combo notices, extra coins, and extra boss feedback | Combo resets when a new level begins or the window ends |
| M12 P2 Cut Systems | P2/Cut | Use the long level path, complete armor, chests, leaderboard, tutorials, or editor-type capabilities | If implemented, they should have visible UI, state saving, and battle effects | When not implemented, they must not be presented as P1; they cannot block the core combat loop |

## System Design Notes

### Combat and Physics Feel

The key to the combat design is “fixed power, continuous angle adjustment, release to fire.” Player input requires neither a charge meter nor interpreting drag direction in reverse as a slingshot. The bow angle and preview trajectory are the player's primary feedback for learning the projectile path; arrow flight must visibly progress from straight travel to drop so the player can correct the next arrow based on the previous one.

Hit feedback should be layered by value: head hits are strongest, body hits are clear but weaker, and armor blocks must tell the player why the instant kill did not occur. Enemy death, player death, embedded arrows, particles, screen feedback, and health-bar changes together communicate combat results, which should not be expressed only through numeric changes.

### Enemies and Level Rhythm

Enemies need to create active pressure rather than act as static targets. Each enemy follows a readable rhythm from aiming to drawing to firing, within which the player can choose to shoot quickly, wait for a better angle, or use a special arrow to create a window. Later levels increase difficulty through enemy count, armor, health, platform movement, and changes in positioning.

When enemies appear in waves, after the current enemy dies, new enemies or new platform states must visibly enter combat so the player does not mistakenly think they have already won. Moving platforms should travel smoothly back and forth and carry enemies to change the hit window.

### Progress, Economy, and Equipment

The star rating reflects remaining health after victory, and replays only save a better result. Coin rewards connect to the shop; the basic shop should at least let the player buy and equip bows and helmets and see a damage or survival difference in the next battle. Coin displays must stay synchronized among the main screen, combat, results, and shop.

The P1 goal of the equipment system is “purchasable, equippable, able to affect combat, and able to reject invalid purchases.” Complete armor slots, chests, and set abilities are P2; if provided, they must retain purchase costs, acquisition feedback, equipment state, and visible benefits in battle.

### UI State and Stability

Game state should maintain clear boundaries among the menu, combat, pause, victory, defeat, shop, settings, leaderboard, and level selection. Whenever a blocking panel appears, battlefield dragging cannot continue firing; pause should stop combat progression; after victory or defeat, old arrows and enemies must not contaminate a retry or the next level.

Settings and the leaderboard enhance completeness but cannot block the main flow. When the leaderboard is unavailable, it should show an empty state or failure notice. Audio can enhance hits, arrow shots, victory/defeat, and special-arrow experiences, but cannot be the only feedback.

## P1 and P2 Scope

### P1 Must Include

- A readable side-view battlefield, player and enemies, platforms, arrows, health bars, HUD, and victory/defeat panels.
- Mouse or touch press, drag-to-adjust-angle, and release-to-shoot controls; upward/downward drags produce opposite visible angle responses.
- Real arrow flight, drop, hits, out-of-bounds cleanup, and hit feedback.
- Health for both player and enemies, head/body differences, basic armor blocking, enemy counterattacks, and player death.
- Victory stars, coin rewards, defeat consolation rewards, retry, next level/return to menu, pause, and input locking.
- Level unlocking, level selection, a basic coin shop, and purchase/equip/insufficient-funds rejection for bows and helmets.

### P2 Depth and Optional Enhancements

- Multi arrows, ice arrows, fire arrows, bubble collection, combos, boss rewards, and more complex visual presentation.
- A long level path, more enemy body sizes and bosses, moving-platform combinations, and deeper enemy waves.
- Complete armor slots, chests, set abilities, a leaderboard, audio settings, and tutorial gestures.
- A level editor, enemy body-size editing, and hidden maintenance tools.

### Explicit Cuts

P1 does not require all long-progression level counts to match exactly, a reliably available external leaderboard service, a complete editor, exactly matching equipment icons or audio assets, or complete saving for P2 armor and chests. Cuts cannot weaken the core shooting combat, victory-and-defeat loop, level progression, primary coin-shop path, or input feel.
