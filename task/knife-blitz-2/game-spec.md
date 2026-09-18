# Knife Blitz 2 Gameplay Requirements

## Product Positioning

Knife Blitz 2 is a single-screen 2D timing arcade game about throwing knives. The player faces a continuously rotating circular target and launches knives toward it from the bottom of the screen, with the goal of sticking the required number of knives into the target in each level without hitting any existing knives. The game should emphasize short pacing, strong feedback, and tension that escalates from level to level: every throw is fast, decisive, and irreversible; success delivers satisfying hits and reward progression, while failure delivers a clear collision interruption and a quick retry.

## Core Gameplay Loop

1. The player proceeds from loading and the home screen into the current level.
2. The level displays the rotating target, stuck-knife obstacles, the remaining knife queue, score, coins, hearts, and commonly used entry points.
3. The player observes the target's rotation rhythm and gaps, then triggers a throw at the right moment.
4. The knife flies vertically upward from the bottom of the screen toward the target's fixed hit direction.
5. If the hit position is safely separated from existing knives, the knife sticks into the target, the remaining count decreases, the score increases, and an edge reward object may be collected.
6. If the hit position collides with an existing knife, the current level fails, the knife bounces away, and the continue or retry flow begins.
7. After all knives have been successfully stuck, the target shatters, victory rewards, score settlement, and credited coins are shown, and the player may enter the next level or open the shop.

## Input Semantics and Control-Feel Causal Chain

P1 input must support a mouse click, touch tap, Space, or Enter to trigger one throw. A throw is not drag aiming, nor is its trajectory determined by the click position; any valid throw input outside a UI overlay area should make one knife fly upward from the bottom-center position of the screen toward the same hit point on the rotating target. The click position only produces brief click feedback and does not change the launch angle.

Each throw is a discrete action: pressing or clicking immediately puts the knife into flight, and the knife advances toward the target over a short period; while it is in flight, holding, releasing, providing reverse input, or moving the pointer cannot adjust its trajectory. Throws have a brief pacing restriction, so the player cannot fire indefinitely while the preceding knife has not yet resolved. The next valid throw becomes available only after a success or failure has resolved.

The target rotates continuously, so what the player truly controls is the timing of the throw. Waiting causes obstacles, reward objects, and gaps on the target to pass through the fixed hit direction; throwing too early or too late changes the final sticking angle. Different levels may use steady speed, variable speed, pauses, reversals, oscillation, or segmented rotation rhythms, and the player must adapt to those rhythm changes. Rotation in the opposite direction should visibly change the direction in which obstacles pass the hit point; it cannot merely change a numeric value.

Risk and failure must be tightly bound to collision: when a new knife's landing point is too close to an existing knife, failure occurs immediately; failure feedback includes the sensation of a metal collision, the knife bouncing away, screen/target shake or a similar impact presentation, and a temporary block on further throws. Success feedback includes the knife sticking into the target, wood chips or a flash, slight target shake, floating score feedback, and a change to the remaining knife queue. Special reward objects provide higher scores and breathing room by clearing existing obstacles, but the player must take the same timing risk to hit the area containing the reward object.

## Scenes and State Flow

After the game starts, it first displays loading progress and then enters the home screen. The home screen should have a clear start entry point; starting enters the level corresponding to the current progress. The first level should provide lightweight tap-to-throw guidance that disappears after the player's first valid throw.

Normal levels enter a throwable state directly. Boss levels display a brief intimidating introduction before becoming throwable; Boss levels should have a stronger visual/audio atmosphere and higher rewards.

Settings, the leaderboard, the shop, or level tips may be opened during play. Such overlays must clearly cover and block underlying throws; closing or confirming them returns to the original level state. While an overlay is open, accidental input on the underlying layer should not launch a knife or change the level result.

The failure state first displays a brief post-collision bounce/impact, then presents continue or retry paths. If the player has a heart, they may choose to spend one heart to continue from the point of failure, restoring the temporary score earned in the current level and current group before the failure while retaining the cost of the throw already consumed when the failure occurred; if the player gives up or has no heart, the failure settlement is shown and manual retry is allowed, and the current level may also retry automatically after a countdown. Retrying the current level does not advance the level.

The victory state first plays the target-shattering sequence, then displays the settlement panel. Settlement should show how this score is added to the total score, whether a new personal best was set, the reward process of converting knives into coins, and the next-level entry point. Before the reward animation is complete, the next-level entry point may be visible but unusable; continuing is allowed only after the reward has arrived.

## Targets, Levels, and Difficulty

Each level defines the number of knives that must be thrown successfully in that level, the target's initial obstacles, reward-object positions, and rotation rhythm. Stuck knives are real obstacles to later throws and do not reduce the number of knives the level requires the player to throw. As levels progress, pressure should increase through more knives, denser obstacles, more direction changes, harder-to-predict variable-speed rhythms, or Boss rules.

The rotating target must be clearly readable in the main scene. The player should be able to see that the target is rotating, existing knives are rotating with the target, and reward objects are attached to the target's edge and move with it. After a knife hits, it should become a new obstacle on the target and rotate with the target.

Reward objects are divided into normal, high-value, and special obstacle-clearing types. Normal reward objects provide a score clearly higher than a normal hit; high-value reward objects provide an even higher score; special reward objects provide a high score while clearing multiple existing knives. Clearing knives should produce visible bounce-away or fragment feedback so the player understands that safe space has been opened.

Boss levels are part of the P1 progression experience: they may feature a unique target appearance, a brief entrance, double coin rewards, and the ability to unlock a specific circular-target skin or similar collectible reward. If production scope is limited, at minimum preserve the Boss level's entrance, difficulty peak, and extra reward; the exclusive collectible may be reduced to P2.

## Score, Coins, Hearts, and Progress

Each safe stick grants at least a base score. Hitting reward objects grants a higher score and uses floating score text, a scoring pulse, or similar feedback to let the player see the difference. The current level's score is not submitted on failure; failure clears the temporary earnings from the current group attempt unless the player spends a heart to continue.

The game progresses through level groups. Completing a level within a group advances to the next level in that group; only after completing the final level of the group are the results from the group's levels written to the long-term best results. The long-term total score should be the sum of the best result for each level, preventing endless score accumulation by repeatedly farming the same level. Leaderboard submission uses the player's currently visible total score or an equivalent result.

Coins are used to purchase or equip appearances. After completing a level, coins are awarded based on the number of knives in that level, with Boss levels providing higher coin earnings. Settlement should show knives converting into coins, coins flying toward the HUD, or a similar visible process. The coin balance must remain synchronized across the HUD, victory settlement, and shop.

Hearts are used to continue after failure. The player has a limited number of hearts; spending a heart reduces the heart count and returns to the point of failure to continue. When the heart count is below the maximum, a recovery countdown should be shown, and hearts should gradually recover with online time. The heart count, coins, skins, volume settings, and level progress should persist between sessions; if saving fails, the current visible state should still be maintained within the current session, and core gameplay should not be blocked.

## Shop, Appearances, and Auxiliary Panels

The shop is a P1 auxiliary system and should support at least three visible appearance categories: knives, backgrounds, and circular targets. The shop should display the coin balance and purchasable/owned/equipped/free/locked states, and support switching categories, scrolling through items, confirming purchases, and equipping owned appearances. When the balance is insufficient, the item cannot be purchased, and ownership or equipment state should not change. A successful purchase deducts coins, adds the item to the owned list, and equips it, with the HUD and shop balances updating in sync.

Some circular-target appearances may be unlocked through Boss progress. While not unlocked, they should display the reason for being locked and reject purchase or equipment. A free initial appearance must be available, ensuring that new players can play normally with no coins.

The settings panel should support music and sound-effect toggles, volume adjustment, restarting the current level, and closing to return. Opening settings pauses or blocks throw input; closing it resumes the current level. The leaderboard panel should be able to display loading, no-data, success, or failure states and can be closed to return. The level-tip panel should be able to explain the current challenge at the start of specific levels and allow throwing after confirmation.

## Player-Visible Feedback

The main scene must contain non-empty, readable targets, knives, reward objects, HUD, and interaction entry points. The HUD must show at least the current score, coins, hearts, level identifier, and remaining knife queue. The remaining knife queue must update with every successful throw so the player knows how many more hits are required.

A successful hit should change both the scene and HUD: the new knife is embedded in the target, the target provides impact feedback, the score increases, the remaining queue decreases, and, when applicable, the reward object disappears and produces a flash or particles. Failure should change both the scene and state: the knife bounces away from the target or fragments scatter, a failure overlay or continue confirmation is entered, and underlying throws are locked.

Victory feedback should form a complete reward chain: the target shatters, celebration effects appear, the score is settled, coins are converted and credited, and the next-level entry point unlocks. When a Boss collectible is unlocked, there should be an additional celebration or prompt, and the corresponding collectible should be shown as available in the shop.

Audio and vibration-style feedback enhance the experience: throwing, a successful hit, knife-collision failure, collection, victory, revival, and credited coins should have mutually distinct sounds or equivalent feedback. If audio cannot be played, visual feedback must still fully convey the same results.

## Rejection Paths and Stability Rules

Underlying throws cannot be triggered during loading, the home screen, a Boss entrance, a tip, the shop, settings, the leaderboard, a failure dialog, or a victory settlement that is not yet ready. While a knife is in flight, a throw is on cooldown, or no knives remain, extra throw input should be rejected without changing the score, remaining knives, level result, or coins.

After a knife-collision failure, throwing cannot continue until the continue or retry choice is complete. Continuing by spending a heart must deduct a heart and cannot be free; when the heart count is zero, an available continue benefit cannot appear. A retry after failure must reset the knives, reward objects, remaining queue, and temporary score in the current level, but should not clear saved coins, skins, or long-term best results.

A shop purchase requires sufficient coins, an unowned item, and an unlocked item. Cancelling purchase confirmation does not deduct coins or change equipment; clicking with insufficient funds or while locked only preserves the original state. Equipping an owned item does not deduct coins. Scrolling the shop should not accidentally trigger a purchase; the end of a drag may have inertia but must respect content boundaries.

Level-completion rewards must be settled only once. Reopening the victory panel, waiting for animations, or clicking an unavailable next-level entry point should not add coins again, resubmit the score, or skip a level. When saving or submission at the end of a group is slow, the victory flow may cover the wait with animation but cannot become permanently stuck; after a timeout, the player should be allowed to continue, and visible progress within the current session must remain consistent.

## Priority and Cut Scope

P1 must include: loading to the home screen, starting the current level, click/touch/keyboard throwing, a rotating target, knife collision detection, successful sticking, reward-object collection, failure/retry, victory/next level, HUD synchronization, coin rewards, heart continue, shop purchase and equipment, settings blocking input, leaderboard entry and closing, and Boss entrance and extra rewards.

P2 may enhance: more refined rotation programs, more skin categories and collection animations, Boss-exclusive appearance-unlock celebrations, complete online-leaderboard error recovery, audio-mixing details, richer particles, a first-level gesture animation, more polished masking while waiting for saves, and an editing experience for level designers.

Cut scope: creator-assistance pages, exporting configuration, cheat shortcuts, level-skip entry points, or other content outside the player's challenge are not required. Specific art assets, fixed copy, specified screen dimensions, or a specified production method are also not required; only player-visible behavior, input semantics, the feedback chain, and progression results must be consistent with these requirements.

---

## GDD / Design Doc (merged from design-doc.md)

# Knife Blitz 2 Design Doc

## Design Intent

Knife Blitz 2 is a single-screen timing arcade game about committing to one precise throw at a time. The player does not steer or aim after input; the meaningful decision is when to launch a knife as the target, existing knives, and rewards rotate past the fixed hit line.

The experience should feel fast, readable, and high pressure. A good throw gives immediate physical feedback, score feedback, and visible progress toward clearing the level. A bad throw creates a sharp collision stop, blocks further throws, and asks the player to spend a heart, retry, or restart the current challenge.

## MDA Summary

### Mechanics

- Start from loading and home into the current saved level.
- Tap, click, Space, or Enter launches one knife from the bottom center toward the target.
- The rotating target carries existing knives and rewards around the hit line.
- A launched knife either safely sticks, collects a reward, triggers special clearing, or collides with an existing knife.
- Safe sticks reduce the remaining knife queue and increase score.
- Collisions fail the current level, discard uncommitted attempt score, and open continue/retry flow.
- Clearing all required throws shatters the target and starts the reward sequence.
- Coins, hearts, best scores, equipped cosmetics, audio settings, and progress persist across sessions when possible.
- Shop, settings, leaderboard, level tips, failure, victory, and Boss intro overlays block playfield throws while active.

### Dynamics

- The player watches the rotation rhythm rather than moving an aiming reticle.
- Waiting is both useful and dangerous: it can align a gap or reward with the fixed hit line, but it can also bring an existing knife into the danger zone.
- Every successful throw makes the target more crowded because the new knife becomes a future obstacle.
- Rewards tempt the player to take riskier timing windows for more score or a safer board state.
- Later and Boss levels raise pressure through denser obstacles, more required throws, direction changes, speed variation, pauses, or more complex rotation patterns.
- Failure and retry are intentionally short, keeping the game in a rapid attempt loop.
- Long-term score discourages farming by committing best results through progress rather than endlessly adding repeated attempts.

### Aesthetics

- Tension: the player feels the narrowing window as each stuck knife adds risk.
- Precision: the fixed hit line and visible rotating obstacles make success feel earned.
- Impact: stick, collision, shatter, reward, coin, and revive feedback should be distinct.
- Momentum: victory quickly converts level success into score, coins, unlocks, and the next challenge.
- Clarity: HUD, queue, overlays, and reward states must communicate what can be done now.

## Feature Model

| ID | Feature | Priority | Player Value |
|---|---|---|---|
| M1 | Loading, home, start, and current progress entry | P1 | Gives a clear route into the saved challenge. |
| M2 | Fixed-line knife throw input | P1 | Preserves the one-tap timing identity of the game. |
| M3 | Rotating target with carried knives and rewards | P1 | Makes timing readable and risk visible. |
| M4 | Collision, safe stick, and remaining knife queue | P1 | Creates the core success/failure rule. |
| M5 | Reward objects, including higher-value and clearing rewards | P1 | Adds risk-reward decisions inside the same throw loop. |
| M6 | Failure, heart continue, retry, and score discard rules | P1 | Completes the fail/recover loop without hidden outcomes. |
| M7 | Victory shatter, score settlement, coins, and next level | P1 | Turns successful completion into progression. |
| M8 | Boss intro, harder encounter, extra reward, and optional unlock | P1/P2 | Provides difficulty peaks and collection motivation. |
| M9 | Shop purchase, equip, lock, insufficient-funds, and category flow | P1 | Gives coins a visible use without blocking new players. |
| M10 | Settings, leaderboard, and level tip overlays | P1 | Supports common game shell actions while protecting gameplay state. |
| M11 | Persistence and best-score progression | P1 | Keeps long-term progress stable and prevents repeated reward abuse. |
| M12 | Audio, particles, shake, pulse, and celebration polish | P2 | Strengthens feedback while remaining secondary to visual state. |

## P1 Core Loop Executable Trajectory

### Trajectory A: Normal Level Completion

1. Start/reset: the game loads, reaches the home screen, and the player starts the current level.
2. Initial state: the playfield shows a rotating circular target, visible existing knives or empty slots, reward objects when present, score, coins, hearts, level label, and the remaining knife queue.
3. Player input: the player taps/clicks the playfield or presses Space/Enter while no blocking overlay is active.
4. Continuous state change: one knife launches from bottom center toward the same fixed hit point; during flight, holding, releasing, dragging, or pointer position does not alter the route.
5. Timing dependency: while the knife travels, the target rotation determines which target angle reaches the fixed hit point.
6. Safe result: if the impact angle is safely separated from existing knives, the knife sticks into the target, the target reacts, score rises, and the remaining queue decreases.
7. Accumulating risk: the stuck knife now rotates with the target as a new obstacle for later throws.
8. Repeat input: the player waits for a new gap and launches the next knife after the prior throw has resolved.
9. Goal: all required knives for the level must be safely stuck.
10. Reward: when the queue reaches zero, the target breaks, the victory sequence shows score settlement and coin conversion, and the next-level action becomes available only after rewards are ready.
11. Progress: choosing next level advances within the current group or saves group completion as defined by the progress model.

### Trajectory B: Collision Failure and Restart

1. Start/reset: the player is in an active level with at least one existing knife on the target.
2. Player input: the player launches a knife as an existing knife rotates near the fixed hit point.
3. Continuous state change: the knife travels upward on the fixed route and the target continues moving its obstacles through the danger zone.
4. Risk: the new impact angle is too close to an existing knife.
5. Failure: the game immediately enters a failed state, shows a collision response such as bounce, metal/shard feedback, impact shake, and blocks further throws.
6. Recovery choice: if the player has hearts, a continue option can consume one heart and resume from the failure point according to the saved attempt state; without a heart, continue must not grant a free recovery.
7. Retry: giving up, retrying, or waiting for auto-retry restarts the same level without advancing progress.
8. Reset outcome: current-level thrown knives, rewards, queue, and uncommitted attempt score reset; persistent coins, cosmetics, long-term best score, settings, and progress remain intact.

### Trajectory C: Reward Timing and Clearing

1. Start/reset: the player enters a level containing visible rewards attached to the target edge.
2. Player input: the player waits for a reward to rotate through the fixed hit line, then launches a knife.
3. Continuous state change: the reward, existing knives, and target rotate together while the knife travels along the fixed upward path.
4. Goal/risk: the player wants the reward angle to align at impact without colliding with existing knives.
5. Reward: a normal reward grants more than a plain stick, a higher-value reward grants more again, and a clearing reward also removes multiple existing obstacles.
6. Observable result: the collected reward disappears, scoring feedback differentiates the reward value, and any cleared knives leave visible removal or bounce feedback.
7. Progress: the thrown knife still counts as a successful stick and the level continues unless it completes the queue.

### Trajectory D: Overlay Blocking and Resume

1. Start/reset: the player is in a playable level.
2. Player input: the player opens settings, shop, leaderboard, a level tip, failure dialog, victory dialog, or Boss intro.
3. State change: the overlay becomes the active interaction layer and the playfield is no longer accepting throw input.
4. Rejection: tap, click, touch, or keyboard throw attempts while the overlay is active must not launch a knife, change score, consume queue, or alter the level result.
5. Resume: closing or confirming the overlay returns to the appropriate previous level state unless the overlay action explicitly restarts, continues, buys, equips, advances, or retries.

## Mechanism Coverage Matrix

| M | Priority | Trigger | Observable Result | Failure/Rejection/Invariants |
|---|---|---|---|---|
| M1 | P1 | Load, home start, retry/reset | Clear transition from loading to home to current level; level and HUD appear | Loading/home overlays do not accept throws; reset does not corrupt saved progress. |
| M2 | P1 | Tap/click playfield or Space/Enter | One knife launches from bottom center toward the fixed target hit line | Click location and drag do not steer; extra input during flight/cooldown is rejected. |
| M3 | P1 | Wait in a level | Target, stuck knives, and rewards rotate together; direction changes are visible | Rotation changes cannot be numeric-only; carried objects must remain readable. |
| M4 | P1 | Safe timed throw | Knife sticks, queue decreases, score increases, target reacts | Stuck knife becomes future obstacle; no queue decrease on rejected input. |
| M5 | P1 | Throw when reward aligns | Reward disappears, score feedback shows higher value, clearing reward removes obstacles | Reward collection still requires collision-safe timing; clearing cannot remove the newly thrown knife as a shortcut. |
| M6 | P1 | Throw into existing knife; choose continue/retry | Collision feedback, failure layer, heart consumption or current-level restart | Failure blocks throws; no-heart continue is unavailable; retry does not advance level. |
| M7 | P1 | Complete all required safe throws | Target shatters, score settles, coins animate/add, next level unlocks after reward readiness | Reward cannot be claimed repeatedly; next cannot skip unfinished settlement. |
| M8 | P1/P2 | Reach Boss level | Boss intro, stronger encounter presentation, higher reward; optional collection unlock | Intro blocks throws; Boss reward follows normal victory invariants. |
| M9 | P1 | Open shop, switch categories, buy/equip | Coins, ownership, equipped state, and locks update visibly across shop and HUD | Insufficient funds, locked items, and cancelled confirmation do not mutate ownership or coins. |
| M10 | P1 | Open/close settings, leaderboard, tip | Panel state is visible; settings changes apply; leaderboard can show loading/empty/success/failure | Panels block playfield throws and close back to the correct state. |
| M11 | P1 | Complete groups, reload, fail/retry | Best scores, progress, coins, hearts, skins, and settings persist when storage works | Save failure does not block core play; repeated wins do not duplicate the same reward. |
| M12 | P2 | Throw, stick, collect, fail, win, revive, coin payout | Distinct sound or visual substitutes for each major event | Visual feedback remains sufficient if audio is unavailable. |

## State Flow

The game state model should be understandable to the player:

- Loading: shows progress and blocks gameplay.
- Home: offers start and non-play options without launching knives.
- Boss intro or level tip: introduces a challenge and blocks throws until dismissed or completed.
- Playing: target rotates and valid inputs can launch one knife.
- Throwing: one knife is in flight; no additional throw may be accepted.
- Failed impact: collision feedback plays before continue/retry choices become active.
- Continue: spending a heart returns to the failed attempt state with the declared score restoration behavior.
- Retry: restarts the same level and clears transient level state.
- Level complete: shatter and reward animation play.
- Victory settlement: score and coin conversion complete before next level is enabled.
- Auxiliary overlay: shop, settings, and leaderboard interrupt throwing but preserve the underlying level unless their own action changes it.

## Control Feel Requirements

- The main input is a discrete launch, not drag aiming, steering, or charge release.
- The visible launch path is consistently bottom-to-target and does not depend on pointer position.
- The player controls timing; target rotation controls the eventual hit angle.
- Waiting must visibly move hazards and rewards through the hit line.
- Opposite or changed rotation patterns must be visible through the movement of target-attached objects.
- During one throw, the player cannot correct a bad timing decision.
- Cooldown and flight locking must prevent accidental multi-throws from a single burst of input.

## Progression And Economy

The progression model combines short attempts with long-term retention:

- Each level has its own required throw count, starting obstacles, rewards, and rotation behavior.
- Group progress determines when best scores are committed.
- Total score reflects durable best performance rather than endless repeated farming.
- Coins are earned from victories and are spent on visible cosmetic categories.
- Hearts are limited recovery resources and regenerate over time when below the cap.
- Boss levels create milestone pressure through presentation, higher reward, and possible collection unlocks.

## UI And Feedback Principles

- HUD must always make score, coins, hearts, level identity, and remaining throws readable during play.
- The remaining knife queue is gameplay-critical because it marks progress toward victory.
- Success feedback must pair scene change with HUD change.
- Failure feedback must pair scene impact with state lock.
- Victory feedback must show the full chain from target break to reward settlement to next challenge.
- Shop and settings feedback must synchronize with HUD and persistence-sensitive values.

## P2 Enhancement Scope

P2 can deepen the game without changing the P1 identity:

- More nuanced rotation programs and level pacing.
- More cosmetic categories, collection celebrations, and Boss unlock presentation.
- Richer particle, screen, audio, and haptic-style feedback.
- More graceful online leaderboard and save error recovery.
- More polished first-level gesture coaching.

## Cut Scope

The design does not require creator/editor tools, exported configuration workflows, cheat shortcuts, skip-level controls, specific artwork, fixed text, fixed screen dimensions, or a fixed technical structure. Any product shape is acceptable when it preserves the player-visible loop, input semantics, feedback, state transitions, rewards, failure rules, and progression behavior above.
