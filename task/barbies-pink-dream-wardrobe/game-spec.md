# Pink Dream Wardrobe Game Spec

## Requirements Overview

This game is a collection of pink fashion dress-up activities and minigames. After entering the wardrobe, players manage coins, browse fashion items in different categories, purchase locked items, equip or unequip owned items, and observe outfit changes through the central character preview. The core loop is: enter the wardrobe -> select a category and item -> spend coins to unlock it when needed -> update the preview after equipping it -> enter a minigame to earn coins -> return to the wardrobe to continue expanding outfit combinations.

## Gameplay Scope and Priorities

- P0: The game can be launched and displays a start entry point after loading; clicking start or loading a save enters an interactive wardrobe; the main interface displays coins, category entry points, the item list, character preview, and minigame entry points.
- P1: Wardrobe categories, item locking/purchasing/equipping/unequipping, coin increases and decreases, entry and result flows for four minigames, and returning minigame coins to the wardrobe.
- P1: The catching minigame must support horizontal dragging with a mouse/touch and left/right keyboard movement. Input on the left side of the screen makes the basket visibly move left, and input on the right side of the screen makes the basket visibly move right.
- P2: Jewelry/accessory categories, first-time guidance, swipe hints, sound/voice feedback, celebration particles, automatic save/load, and layout adjustments in edit mode may be provided as enhancement systems; if cut, they must not block the P1 wardrobe and minigame loop.

## Source Feature Coverage Matrix

| Feature | Priority | Requirement |
|---|---:|---|
| M1 Launch and enter the wardrobe | P0 | After loading, enter the wardrobe by starting or loading; the overlay is removed, and the coins, categories, item list, and character preview are visible and interactive. |
| M2 Browse categories | P1 | The hair, outfit, bag, and shoes categories can switch the current list; switching must not accidentally change coins or currently equipped items. |
| M3 Equip and unequip | P1 | Owned items can be equipped and refresh the preview; non-hair items can be clicked again to unequip them; one hair selection always remains current. |
| M4 Purchase locked items | P1 | After confirmation in a modal, a locked item's price is deducted, the item is unlocked, and it is automatically equipped; cancellation or insufficient coins leaves resources and equipped items unchanged. |
| M5 Minigame entry and return | P1 | All four minigames can be entered from the wardrobe; while a minigame is running, it blocks the wardrobe underneath, and returning or continuing restores the wardrobe. |
| M6 Short color-matching round | P1 | A correct selection increases in-round coins and refreshes the question; an incorrect selection gives no reward and in-round coins do not become negative; when time expires, proceed to results. |
| M7 Fashion catching direction and collisions | P1 | The left/right keys or horizontal mouse/touch dragging move the basket in the corresponding screen direction while keeping it within bounds; catching the correct item gives a reward, while catching a distractor gives no positive reward. |
| M8 Memory card matching | P1 | Clicking cards flips them over, and two cards make one move; a match remains visible and gives a reward, a mismatch flips back after a delay, and results appear after all pairs are matched. |
| M9 Timed matching-item search | P1 | Clicking the correct candidate adds coins and refreshes the target; clicking an incorrect candidate gives error feedback or deducts time and does not add coins. |
| M10 Return result rewards | P1 | Minigame results display the earnings for the round; the reward may be credited when the result layer appears or when the player continues, but the same round may increase total coins only once, and continuing returns to the wardrobe. |
| M11 Automatic save and load | P2 | Progress can be saved after purchases, equipment changes, minigame rewards, and tutorial state changes; loading restores coins, owned items, equipment, and the tutorial summary. |
| M12 Tutorial and feedback | P2 | First-time guidance, swipe hints, purchase celebrations, encouragement for consecutive correct answers, sounds, or particle feedback may appear and can disappear without permanently blocking core interactions. |

## Main Interface and State Flow

1. Loading state
   - Display loading feedback first after entering the page.
   - Display the start menu after loading is complete; the start menu blocks wardrobe actions.

2. Start/load
   - Clicking start enters new wardrobe progress with the initial coins and default basic look.
   - When load is clicked, if a save exists, it should restore coins, unlocked items, equipped items, and tutorial state; if no save exists, it should enter new progress.
   - After entering the wardrobe, the start menu and loading overlay should no longer block interactions with the main interface.

3. Wardrobe state
   - The top of the screen displays minigame entry points and the current coins.
   - The central area displays a preview of the character's current look, which must visibly refresh after equipment changes.
   - The bottom displays the category bar and a horizontal item list for the current category.
   - Categories include at least hair, outfits, bags, and shoes; each category has multiple browsable items.
   - Jewelry/accessories may appear as additional browsable categories, but if those categories are not provided, this should not affect the complete loop for the four core categories.

4. Modals and blocking
   - Clicking a locked item opens a purchase modal that displays the item preview, price, cancel action, and purchase action.
   - While the modal is open, accidental interactions with the main interface should be prevented; after cancellation, it closes and coins, unlock state, and equipment state remain unchanged.
   - When coins are insufficient, the purchase action cannot be completed, coins cannot become negative, and the item cannot be unlocked or equipped.

## Wardrobe Rules

1. Initial state
   - The player has an initial amount of coins.
   - By default, the player owns and equips at least one basic hairstyle/basic look so that the character preview is not empty.
   - Non-hair categories may have nothing equipped.

2. Category browsing
   - Clicking a category switches the current item list and highlights or otherwise observably identifies the current category.
   - The item list supports horizontal browsing; on the first visit to hair or a list, guidance indicating that it can be swiped/browsed may be displayed.

3. Equipping and unequipping
   - Clicking an unlocked, unequipped item equips it and refreshes the character preview and item state.
   - Clicking an equipped non-hair item unequips it and refreshes the preview; after unequipping, that category should return to an observable "unequipped/empty slot" state.
   - The hair category must always retain one equipped hairstyle; clicking the current hairstyle cannot leave hair empty.

4. Purchasing
   - A successful purchase deducts the price, adds the item to the owned list, automatically equips the item, closes the modal, and refreshes the coins, list state, and character preview.
   - A successful purchase may play celebration feedback or particle effects.
   - A failed or canceled purchase must not change the coins, owned list, or current equipment.

5. Saving
   - P2: The game should save progress after purchases, equipment changes, minigame rewards, and tutorial state changes.
   - P2: The load entry point should restore the previous coins, owned items, equipment, and tutorial state.

## General Minigame Rules

1. Each minigame is entered from an entry point at the top of the wardrobe and displays a full-screen or clearly overlaying minigame interface after entry.
2. The minigame interface must have an action to return to the wardrobe; returning ends the current minigame without settling unfinished rewards, closes the minigame layer, and restores wardrobe interactions.
3. The minigame displays coins or score for the current round; minigames with a countdown display the remaining time and a progress bar.
4. When a minigame ends naturally, it proceeds to a result layer that displays the coins earned during the round; source behavior may add the reward to the wardrobe's total coins when the result layer appears, or it may add it when continue is clicked, but clicking continue must close the result and minigame layers, refresh the HUD, and the reward from the same round must not be added more than once.
5. While a minigame is running, the wardrobe underneath should not respond to obscured dress-up input.

## Minigame One: Color Match

- P1: After entry, display a target color swatch and multiple candidate color swatches.
- When the player clicks a candidate swatch that matches the target swatch, the answer is correct: the player earns in-round coins, the consecutive-correct count increases, and the next target and candidates are generated.
- When the player clicks an incorrect swatch, the answer is incorrect: in-round coins decrease slightly but not below 0, the consecutive-correct count resets to zero, and the target round does not directly grant a reward for the incorrect answer.
- The game has a countdown; when time runs out, settle the in-round coins.
- P2: Encouragement feedback may play when the consecutive-correct count reaches certain thresholds.

## Minigame Two: Fashion Catching

- P1: After entry, display a horizontally movable basket and items falling from above.
- The player moves the basket horizontally by dragging with a mouse/touch and can also use the left/right arrow keys or equivalent keys to move it.
- Screen-direction semantics must be clear: the left key or dragging left moves the basket left on the screen; the right key or dragging right moves the basket right on the screen. The basket cannot move outside the playable area.
- Falling items are divided into correct target items and incorrect distractors. When a correct target falls into the basket, in-round coins increase; when an incorrect distractor falls into the basket, in-round coins decrease, and the displayed value should not fall below 0.
- Catching an item must produce an observable causal chain: the falling item leaves the scene or its count decreases, in-round coins change, and reward feedback appears when a correct item is caught; catching a distractor cannot produce a positive reward.
- As time passes, the falling speed or spawn rate may increase.
- The game has a countdown; when time runs out, settle the non-negative in-round coins.
- P2: The basket may present a visibly fuller state based on the cumulative number of correct items caught.

## Minigame Three: Memory Cards

- P1: After entry, display a set of face-down cards made up of several pairs of fashion items.
- When the player clicks an unmatched card, it flips face up; after two cards are flipped, this counts as one move.
- If the two cards match, they remain matched, in-round coins increase, and the number of matches increases.
- If the two cards do not match, they are briefly displayed and then flip face down again, and in-round coins do not increase.
- After all pairs have been completed, proceed to the result layer, with in-round coins as the reward.

## Minigame Four: Timed Matching-Item Search

- P1: After entry, display a target item image and multiple candidate items.
- When the player clicks the candidate item that matches the target, the answer is correct: the candidate gives correct feedback, in-round coins increase, and a new target and candidates are refreshed after a short delay.
- When the player clicks an incorrect candidate, the answer is incorrect: the candidate gives error feedback, the consecutive-correct count resets to zero, and the remaining time is reduced or an equivalent time penalty is applied.
- The game has a countdown; when time runs out, settle the in-round coins.
- P2: Encouragement feedback may play when the consecutive-correct count reaches certain thresholds.

## Completion Criteria

- After entering the wardrobe from the start menu, the player can use real clicks to switch categories, click items, open the purchase modal, and cancel or purchase.
- Coins, locked state, equipped state, and the character preview must update in sync.
- At least four minigame entry points are functional; each minigame can trigger its core rules through real input and can return to the wardrobe or continue after results.
- The catching minigame must visibly reflect correct screen directions and boundary constraints; changing only numerical state is insufficient.
- Rejection paths such as failure, cancellation, insufficient coins, and incorrect answers must keep resources within bounds and must not produce rewards.

---

## GDD / Design Doc (merged from design-doc.md)

# Pink Dream Wardrobe Design Doc

## MDA Overview

**Mechanics**: Start/load to enter the wardrobe, coin HUD, category switching, horizontal item lists, purchasing locked items, equipping/unequipping owned items, refreshing the character preview, and entry, operation, return, and reward settlement for four minigames. Jewelry/accessory categories may appear as enhanced content, but the core wardrobe experience is based on hair, outfits, bags, and shoes.

**Dynamics**: After encountering locked items in the wardrobe, players need to earn coins through minigames and then return to the wardrobe to spend them on unlocks; minigames provide short rounds, immediate feedback, and result rewards that drive continued outfit creation. The catching minigame provides directional control and risk choices, memory and matching-item search provide recognition/memory challenges, and color matching provides a quick judgment challenge.

**Aesthetics**: The overall experience should be relaxed, bright, fashionable, and strongly rewarding. Players should be able to quickly understand "how many coins do I have now, is this item available, did the look change after I clicked, and did the minigame earn coins?"

## Main Systems

| System | Priority | Design Intent |
|---|---:|---|
| Launch and start menu | P0 | Give loading, starting, loading a save, and entering the wardrobe a clear state flow |
| Wardrobe categories and preview | P1 | Support the core dress-up experience and ensure that the causal link between selection and preview is visible |
| Equip and unequip rules | P1 | Owned items can change the look, non-hair categories can be cleared, and hair always retains one current selection |
| Purchasing and coin economy | P1 | Form a closed resource loop between minigame earnings and wardrobe expansion |
| Color Match | P1 | Quick click-based judgment, rewards for correct answers, penalties for incorrect answers, and countdown results |
| Fashion Catching | P1 | Real directional input, falling-item risk, rewards/penalties, and countdown results |
| Memory Cards | P1 | Card flipping, matching, moves, rewards, and results after full completion |
| Timed Matching-Item Search | P1 | Target recognition, clicking among multiple candidates, refresh after correct answers, and time deductions for incorrect answers |
| Guidance/sounds/particles/saving | P2 | Enhance feedback and retention without blocking the core loop |
| Jewelry/accessory expansion | P2 | Can extend the look with more layers; the absence of this entry point does not affect the four core categories |

## M Feature Index

### M1 Launch and enter the wardrobe
### M2 Browse categories
### M3 Equip/unequip
### M4 Purchase locked items
### M5 Minigame entry and return
### M6 Short color-matching round
### M7 Fashion catching direction and collisions
### M8 Memory card matching
### M9 Timed matching-item search
### M10 Return result rewards
### M11 Automatic save/load
### M12 Tutorial and feedback

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---:|---|---|---|
| M1 Launch and enter the wardrobe | P0 | Click start or load after waiting for loading to finish | The menu overlay is hidden, the wardrobe is interactive, and the coins and character preview are visible | Fails if the overlay still blocks wardrobe input |
| M2 Browse categories | P1 | Click the hair/outfit/bag/shoes category | The current list content switches, the active category is observable, and the number of cards matches the category | Clicking a category cannot change coins or equipment |
| M3 Equip/unequip | P1 | Click an owned item card | The equipment summary, card state, and character preview refresh; a non-hair item can be clicked again to unequip it and display an empty slot | Hair cannot be unequipped to empty; clicking an invalid position should not change equipment |
| M4 Purchase locked items | P1 | Click a locked item -> purchase modal -> click purchase | Coins decrease by the price, the item becomes owned and is automatically equipped, the modal closes, and the preview refreshes | When coins are insufficient or the purchase is canceled, coins, ownership, and equipment remain unchanged, and coins do not become negative |
| M5 Minigame entry and return | P1 | Click any minigame entry point, then click return or continue | The corresponding minigame layer is displayed; after returning/continuing, the overlay closes and the wardrobe is restored | Actions must not accidentally affect the wardrobe underneath while the minigame layer is visible |
| M6 Short color-matching round | P1 | Click a correct/incorrect candidate color swatch | A correct answer increases in-round coins and refreshes the target; an incorrect answer reduces in-round coins but not below 0 | An incorrect answer cannot give a reward; in-round rewards return to total coins only after time expires |
| M7 Fashion catching direction and collisions | P1 | Move the basket horizontally with the left/right keys, mouse, or touch and catch falling items | The basket's screen position changes in the corresponding direction; catching a correct item adds score, removes the falling item, and gives feedback, while catching an incorrect item deducts score or keeps it non-negative; results appear after the countdown | Left/right directions cannot be reversed; the basket cannot cross the bounds; an incorrect item cannot give a positive reward; displayed coins are non-negative |
| M8 Memory card matching | P1 | Click two cards | Two cards flip face up and the move count increases; a match remains and adds coins, while a mismatch flips back after a delay | Matched cards cannot give repeated rewards; results cannot appear before all pairs are matched |
| M9 Timed matching-item search | P1 | Click the candidate corresponding to the target or an incorrect candidate | A correct answer adds coins and changes to a new question; an incorrect answer deducts time/gives error feedback and does not add coins | An incorrect selection cannot give a reward; time cannot fall below 0 |
| M10 Return result rewards | P1 | The minigame ends naturally and enters the result layer, then the player clicks continue | The result layer displays the round's earnings; the reward is credited only once, either when results appear or upon continuing; continuing returns to the wardrobe | Continue cannot add the same reward again, and a round credited when results appeared cannot add coins again |
| M11 Automatic save/load | P2 | Save after purchasing, equipping, or earning coins; click load the next time | Restore the coin, ownership, and equipment summaries | A loading failure should return to new progress without blocking the game |
| M12 Tutorial and feedback | P2 | Enter the wardrobe for the first time, browse for the first time, answer correctly in succession, or complete a purchase | Guidance, sounds, particles, or encouragement feedback appears and can disappear | The feedback layer cannot permanently block core interactions |

## Interactions and Observable Feedback

- The UI shell must clearly distinguish `loading/menu/wardrobe/minigame/result` and ensure that blocking layers disappear after entering a playable state.
- The wardrobe preview may use any clear visual presentation, but the main preview must change observably after equipment changes.
- Minigames may use any clear visual presentation, but player input must drive simultaneous changes to visible objects, the status bar, and gameplay state.
- The catching minigame is direction-sensitive: visible changes to the on-screen position from left/right input are the P1 acceptance threshold.

## Cuts and Enhancements

- P2 saving, audio, voice, particles, first-time guidance, and edit mode may use lightweight presentations, but P1 core gameplay cannot depend on unavailable resources.
- Fixed image assets, fixed text, fixed color values, fixed layout coordinates, or original brand-specific visual details are not required.
