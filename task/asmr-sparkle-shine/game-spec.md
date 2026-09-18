# ASMR Sparkle & Shine Game Spec

## Requirements Overview

This is a 2D canvas-based cleaning simulation game. The player enters a level from the menu and encounters a cute item covered in mud, grease, dust, fingerprints, coffee stains, limescale, carpet stains, or wood dust. The player selects a cleaning tool allowed in the current level, then presses and drags within the item's visible area, progressing the cleanliness to nearly full through the sequence of preparation, applying foam, scrubbing, rinsing, drying, or polishing. Upon completion, a results flow displays the star rating, elapsed time, rewards, and options to continue, replay, or return.

## Gameplay Coverage Principles

This Game Spec describes the player-visible gameplay this cleaning game should include. No confirmed playable behavior, input method, menu state, level or rank, scoring and high scores, lives or failure conditions, pause and restart, sound effects or mute, hints or tutorials, special modes, items, enemies, collectibles, upgrades, saves, or other features may be omitted from the requirements.

If a feature will not be implemented for now, it must be explicitly marked as cut scope in the requirements; it cannot be omitted by default merely because the document does not mention it.

## Gameplay Requirements

### P0 Basic Experience

- The game must have a main menu, a playable cleaning scene, and a results scene, and must transition reliably between these states.
- The main scene must be a readable 2D canvas or equivalent visible cleaning area showing the background, the current dirty item, tool-use feedback, cleaning progress, and coin/timer information.
- Both mouse and touch must be supported: press down within the item area to begin using the current tool, drag to apply it continuously along the path, and release to stop.
- Keyboard shortcuts must support basic tool selection and left/right rotation for viewing the item; number keys select available tools, and the left/right arrow keys or equivalent keys rotate the item in opposite directions.
- Starting and switching states must not leave menu layers blocking the cleaning area; after entering the playable state, the player must be able to drag directly over the item area.

### P1 Core Cleaning Loop

- Each level has a dirty item, a clean target appearance, a dirt type, a material type, a background theme, a tool sequence, and step hints.
- Initially, only the first item is unlocked; completing a previously incomplete level unlocks the next item.
- The player must select a tool before dragging within the item's visible area. Having no tool selected, dragging outside the item area, or using a tool that is ineffective for the current stage should not advance the core cleaning progress.
- Cleaning must be a spatial coverage process rather than completion through a single button: areas the player drags over change locally, and progress rises gradually with valid coverage and state processing.
- The tool chain must embody multi-stage causality:
  - Preparation tools wet, soften, blow away, or apply conditioner, usually producing only a small amount of progress or a prepared state.
  - Contact tools such as sponges, brushes, soft cloths, and polishing cloths must produce foam, residue, scrubbing, wiping, or polishing effects based on areas that have been prepared.
  - Water or rinsing tools must primarily remove foam/loosened dirt and may leave water marks or a wet state.
  - Towels, hot air, or dry cloths must remove water marks/wetness; final completion must require dirt, residue, and water marks all to be below their thresholds.
- The cleanliness HUD must start near 0% and rise monotonically or approximately monotonically with valid actions; the wrong tool or actions outside the item area should not award significant progress.
- Once cleanliness is nearly full, the player releases the input and waits for brief completion feedback, after which the game enters the results state.
- Completion feedback must include a sparkle/celebration effect, star rating, elapsed time, base reward, speed bonus, perfect bonus or first-clear bonus, and an update to the total coin count.

### P1 Level and Tool Content

- Include at least 14 cleanable item levels spanning different materials, including footwear, tableware, plush items, a phone or screen, boots, drinkware, a keyboard, cookware, a wooden table, a hanging ornament, a metal sink, a carpet, a toy car, a jewelry box, and more.
- Include at least the following tool semantics: spray/moistening agent, sponge, brush, water/rinse, towel, hot air, soft cloth, dusting cloth, furniture conditioner, and polishing cloth.
- Each level may display and allow only the tools required for that item, and the tools should be ordered according to that level's recommended sequence.
- Different dirt types should have different tool logic:
  - Mud, dust, fabric dust, limescale, and carpet stains usually require moistening/applying cleaner, scrubbing, rinsing, and drying.
  - Grease, coffee, and burnt-on grime usually require moistening or cleaner, sponge treatment, rinsing, and wiping dry.
  - Fingerprint-covered screens should use foam/screen cleaner and a soft cloth and should not require rinsing with water.
  - Keyboard items should center on blowing away debris and wiping and should not require wet washing.
  - Wooden surfaces should center on dusting, conditioner spray, and polishing and should not be washed with water.
- Absorbent materials treated with water should become visibly darker or show wetness; non-absorbent materials should show a water film, droplets, or gloss; drying tools should remove these visible states.

### P1 Menu, Results, and Progression

- The main menu provides a start entry point. Starting enters the first currently unlocked and incomplete item; if all unlocked items are complete, the game restarts from the earliest level.
- The normal main path goes directly from the main menu to the first currently unlocked and incomplete item. Level selection is a P2/auxiliary path; if the game provides level selection, it must have an explicit entry point, show unlocked/locked levels, and reject entry into locked levels.
- The playable scene provides a button to return to the main menu; returning stops the current cleaning interaction and hides old popups.
- The results scene provides next level, replay, and return-to-menu options. Next level is available only when a subsequent level exists; replay resets the current level's dirt and timer.
- Star ratings must range from at least 1 to 3 stars: completion always earns at least 1 star, high completion or faster completion awards a higher rating, and near-perfect completion within a reasonable time can earn 3 stars.
- Coin rewards consist of a base reward, speed bonus, perfect bonus, and first-completion bonus; repeatedly completing the same level should not repeatedly award the first-completion bonus.
- Completing a level must update the completed list, the level's highest star rating, total items cleaned, perfect cleans, total coins, and fastest cleaning time.

### P2 Depth Systems and Scope

- Level selection is a P2/auxiliary path. If implemented, it must appear as an explicitly visible entry point; if not implemented, the normal main path must still form a complete loop through start, next level, and replay.
- Daily challenges are a P2/optional enhancement. If implemented, one cleaning objective or perfect-cleaning objective must be generated each day, with its progress, target, and reward displayed; once complete, a coin reward may be claimed once and cannot be claimed repeatedly. If not implemented, this must not affect the P1 core cleaning loop.
- The achievement system is P2: milestones such as first completion, fast completion, perfect cleaning, three stars, unlocking multiple items, and completing all items may trigger rewards; achievements may be communicated through rewards, an achievement summary, or brief notices, and are not required to use popups.
- The persistence system is a P2 target enhancement: coins, unlocked levels, completed levels, star ratings, achievements, and statistics may be saved and restored after reopening; if no visible save/restore path is implemented, it should not block the P1 core loop.
- The settings system is a P2 target enhancement: dirt intensity, whether the countdown is enabled, time limit, and background theme can be configured; settings affect new sessions, but the normal game UI is not required to provide a settings panel.
- Audio system: menu music, background music, tool sounds, coin/starlight/completion sounds, and others should play according to the state and tool use; inability to play audio should not block the game.

## State Requirements

- `loading`: the asset preparation stage, displaying loading feedback; proceeds to the main menu when complete.
- `menu`: the main menu is visible; the cleaning HUD and toolbar should not block menu interaction.
- `levelSelect`: a P2/auxiliary state. If the game provides a visible entry point, the player can browse unlocked/locked items, return to the menu, and access daily challenges; if no normal entry point is provided, the P1 main path still relies on start, next level, replay, and return to menu.
- `playing`: the canvas cleaning area is interactive; the HUD displays coins, cleanliness, and time; the toolbar displays tools required by the current level; menu layers do not block the canvas.
- `complete`: cleaning input is locked; the star rating, rewards, elapsed time, and continue/replay/menu actions are displayed.
- `paused` is cut scope: the original work has no separate pause panel, and returning to the menu serves to interrupt the current level.
- `gameOver` is cut scope: when the countdown runs out, the game settles the results rather than failing, and the game has no lives or failure rounds.

## Input Semantics and Visible Causal Chain

- Click/touch the start entry point: the menu disappears, the playable cleaning scene opens, the canvas displays the dirty item and HUD, and the cleaning area is not blocked.
- Click/touch a tool button: the current tool is highlighted and the step hint updates; subsequent drags use that tool's semantics.
- Press and drag within the item area: the tool cursor or particles follow the pointer, local dirt/foam/water-mark states along the dragged path change, and cleanliness or the preparation state advances.
- Drag outside the item area: the item state, cleanliness, rewards, and results state do not change.
- Use a tool inappropriate for the current stage: subtle particle or sound feedback may occur, but it cannot bypass the preparation, scrubbing, rinsing, and drying chain to complete directly.
- Left rotation input should rotate the item toward one screen direction, while right rotation input must produce visible rotation in the opposite direction; rotating right and then left should return it close to the initial angle.
- Continuing to hold after reaching the completion conditions should not immediately open the results; the results appear only after release and the completion feedback delay.

## Completion Criteria

- P0: the page starts, and the menu, playable scene, canvas, HUD, and toolbar are reliably visible without fatal runtime errors.
- P1: the player can start from the menu, select tools, genuinely clean the first item by dragging, complete the level through the full tool chain, see the star/reward results, and unlock the next level.
- P1: level cleaning is not completed through a button; incorrect paths, out-of-area actions, and invalid tools do not advance the core reward.
- P1: rotation, mouse, touch, and keyboard tool selection all work, and rotation direction semantics are consistent.
- P2: all 14 levels, special-material tool chains, audio fail-safety, achievement summaries, and optional level selection/daily challenges/settings/persistence work within the scope above; P2 systems cannot replace the P1 core cleaning loop.

---

## GDD / Design Doc (merged from design-doc.md)

# ASMR Sparkle & Shine Design Doc

## MDA

### Mechanics

- Multi-level cleaning objects: each level associates an item, dirt type, material, recommended tool sequence, step hints, rewards, and unlock relationships.
- Coverage-based cleaning surface: visible states for dirt, preparation, foam/residue, wetness/water marks, and others exist within the item area, and the player changes local states by dragging tools.
- Tool chain rules: different tools have different effects on different dirt and stages; final completion requires dirt, residue, and wetness all to be handled.
- UI state flow: loading, main menu, playing, results, return, replay, next level; level selection is a P2/auxiliary path and is part of the normal UI flow only when an explicitly visible entry point is provided.
- Economy and progression: coins, star ratings, first completion, speed and perfect bonuses, level unlocking, and statistics; daily challenges, achievements, save/restore, and settings are P2/enhancement scope.
- Input system: mouse/touch drag cleaning, button-based tool selection, keyboard number-key tool selection, and left/right item rotation.

### Dynamics

- The player first observes the current item and hint, selects the first tool, and covers the item's dirty areas.
- Preparation tools usually wet the surface or create a treatment layer; scrubbing/wiping tools require a prepared state to make significant progress; rinsing removes foam and dirt; drying/polishing removes wetness and finishes the surface.
- Incorrect tools produce feedback but do not skip major stages, encouraging the player to follow the tool order.
- The cleanliness bar converts local coverage into global progress; water marks or residue still need to be handled before completion, preventing the results from appearing as soon as only the dirt is wiped away.
- After an item is completed, star ratings and coins reinforce the short-session loop, while unlocking directs the player to the next item.

### Aesthetics

- ASMR: dragging, wiping, spraying, rinsing, drying, and polishing should all provide gentle, continuous feedback.
- Satisfaction: dirt gradually disappears, the clean appearance is progressively revealed, and completion is accompanied by sparkles, a star rating, and rewards.
- Cute and relaxing: items, tools, and UI should remain soft, bright, and friendly; failure pressure is low, with collection, unlocking, and perfect cleaning as the main motivations.

## Game Flow

1. Load assets and display loading feedback.
2. Enter the main menu, where the player clicks start.
3. Automatically enter the first unlocked and incomplete level; if a P2 level-selection entry point is implemented, an unlocked level may also be selected manually from level selection.
4. The playable scene displays the dirty item, cleanliness, coins, timer, and toolbar.
5. The player follows the current level's tool sequence, selecting tools and dragging within the item area.
6. Cleanliness reaches the completion condition, and the player releases the input and waits for a brief celebration.
7. The results display the star rating, elapsed time, and rewards, and update coins and unlocks.
8. The player chooses next level, replay, or return to menu.

## Source Core Loop Coverage

Machine-readable M-feature index for pipeline coverage gates:

M1: Startup and entering the playable state from the menu
M2: Readable 2D cleaning scene
M3: Tool selection
M4: Drag cleaning within the item area
M5: Multi-stage tool chain
M6: Completion determination and results
M7: Coins, star ratings, and unlocks
M8: Replay, next level, return, and locked-state flow
M9: Rotation viewing direction
M10: Touch input
M11: Level selection and locked-level rejection
M12: Special-material tool chains
M13: Achievements and optional daily challenges
M14: Settings and persistence enhancements
M15: Audio feedback

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---:|---|---|---|
| M1 Startup and entering the playable state from the menu | P0 | Click start after loading completes | The menu is hidden, the cleaning scene is displayed, the HUD/toolbar and dirty item are visible, and the canvas is interactive | The playable state must not be blocked by a menu layer; no fatal errors |
| M2 Readable 2D cleaning scene | P0 | Enter any level | The main canvas is non-empty and contains a background, item, dirt or effect layer; the HUD displays cleanliness/coins/time | A blank canvas, solid-color background, or HUD-only display is unacceptable |
| M3 Tool selection | P1 | Click a tool button or press a number key | The current tool highlight/snapshot updates, the hint corresponds to that tool's step, and cleaning is impossible with no tool selected | Disabled tools or tools not in the current level cannot be selected; selecting a tool should not change coins/star ratings |
| M4 Drag cleaning within the item area | P1 | After selecting a tool, press and drag within the item area | Particles/tool cursor appear along the pointer path, local surface state changes, and cleaning progress advances | Dragging outside the item area does not change progress; dragging with no tool does not change progress |
| M5 Multi-stage tool chain | P1 | Cover the item following the level's tool sequence | Preparation, foam/residue, rinsing, and drying states change in sequence, and final cleanliness approaches full | A single tool cannot complete directly; a tool used at the wrong stage must not bypass the chain |
| M6 Completion determination and results | P1 | Release and wait after completing the cleaning | After celebration feedback, the game enters the results and displays the star rating, elapsed time, rewards, and next-step buttons | Results must not appear immediately while input is held; results must not appear before reaching the threshold |
| M7 Coins, star ratings, and unlocks | P1 | Complete a previously incomplete level | Coins increase, the star rating record updates, the current level is completed, and the next level unlocks | The first-completion bonus cannot repeat; only the historical highest star rating is retained |
| M8 Replay/next level/return | P1 | Click replay, next level, or menu in the results; return during play | Replay clears the current session's dirt and timer; next level opens the subsequent item; return displays the menu | Old particles/popups should not block the new state; locked levels cannot be entered |
| M9 Rotation viewing direction | P1 | Left/right button or keyboard direction input | The item's visible angle changes in opposite directions; right then left returns it close to the starting direction | Left and right inputs cannot move in the same direction; rotation cannot affect coins, unlocks, or cleanliness |
| M10 Touch input | P1 | Touch tools and drag within the item area | Selects tools and produces surface changes and progress equivalently to the mouse path | Touch cannot merely prevent scrolling without triggering gameplay |
| M11 Level selection and locked-level rejection | P2 | Attempt to select a level through an explicitly visible entry point | Unlocked levels can be entered; locked levels are rejected and progress remains unchanged | If there is no normal entry point, the P1 main path still advances through start and next level |
| M12 Special-material tool chains | P2 | Enter a special-material level such as phone, keyboard, or wood | Phone does not use water; keyboard centers on blowing dry/wiping; wood centers on dusting/conditioning/polishing | Special materials cannot be replaced with a generic wet-washing chain |
| M13 Achievements and optional daily challenges | P2 | Reach a first-completion, fast, perfect, three-star, or daily objective | Achievement/daily summary or rewards update; if daily challenges have no visible entry point, they are not a mandatory normal path | The same reward cannot be issued repeatedly |
| M14 Settings/persistence enhancements | P2 | Adjust settings or restore after completion | New levels can reflect settings; if save/restore is implemented, coins, unlocks, completions, and star ratings should persist | When visible settings/restore are not implemented, P1 should not be blocked |
| M15 Audio feedback | P2 | Menu, tool selection, dragging, completion, rewards | Corresponding music or sound effects play; failure is silent under browser restrictions | Audio failure must not block input or results |

## GDD Details

### Level Design

- P1 content covers at least the first cleaning item and its complete tool sequence.
- P2 content covers 14 items, separately reflecting differences among materials such as fabric, ceramic, plastic, rubber, metal, wood, and carpet.
- Each level should declare the recommended tool order, visible dirt type, and reward after final completion.

### Cleaning Surface Model

- As visible dirt coverage decreases, the clean image is progressively revealed.
- Wetting, conditioning, blowing away, or pretreatment states alter the effects of subsequent tools.
- Foam, soap film, conditioning oil, cleaner, or fingerprint foam needs to be rinsed, wiped away, or polished.
- Water marks, saturation, or a water film need to be removed with a towel, hot air, or a dry cloth.
- The overall player-facing cleaning progress must be determined jointly by dirt, residue, and wetness states.

### Reward Model

- The completion reward consists of a fixed base value, speed bonus, perfect bonus, and first-completion bonus.
- The star rating is determined jointly by completion quality and elapsed time.
- Statistics include total items cleaned, perfect cleans, total coins, and fastest completion time.
- Daily challenges, settings, and persistence are P2/enhancement systems and should not affect the P1 completion path; if the normal player entry point is unclear, they should not be treated as mandatory UI paths.

### Rejection And Invariants

- Locked levels cannot be entered.
- Cleaning does not occur without a selected tool.
- Dragging outside the item area does not change the surface state.
- An invalid tool or wrong stage should not directly complete the level.
- The complete state locks cleaning input, and replay must regenerate the dirt.
- Economy values must not be negative; the first-completion bonus must not be issued repeatedly; if daily or achievement rewards are implemented, they also must not be issued repeatedly.
