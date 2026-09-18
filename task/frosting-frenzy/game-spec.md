# Frosting Frenzy Game Spec

## Requirements Overview

This is a short, single-round cake-decorating challenge. In each round, the player receives a design target and, within a limited time, selects frosting and places decorations on the cake. The goal is to satisfy the color and decoration quantity requirements, earn a 0-3 star rating, and add those stars to the total score. During a round, the player can undo the most recent decoration, clear the current cake, finish early, or wait for the countdown to reach zero and trigger automatic evaluation.

## Gameplay Scope and Priorities

- P0: The page starts reliably, and the main screen includes a visible cake, countdown, current design target, frosting selection, decoration selection, and controls for actions such as done/undo/clear.
- P1: The player can complete one round of the core loop: select frosting, click or touch the cake to apply it, drag decorations onto the cake, complete the round and evaluate it, view the star rating and cumulative score, and proceed to the next round.
- P1: Drag semantics must work in screen space. The player presses and holds a decoration in the decoration bar, uses the mouse or touch to drag it into the cake's acceptable area, and releases it; the decoration should appear near the release point. Releasing it outside the cake area should be rejected and should not add a decoration.
- P1: Scoring is judged only according to the design target requirements and must not change because of irrelevant clicks, releases outside the cake, or continued operations after the round has ended.
- P2: Keyboard shortcuts may support undo, clear, and done.
- P2: A configurable mode may allow authors to enable/disable targets, adjust timing parameters, and enable/disable frosting colors and decoration types; if this entry point is not provided to ordinary players, it may be handled as an authoring tool or non-core settings system.
- P2: Enhanced feedback such as sound effects, background music, low-time alerts, and star animations should be present, but must not be the only feedback for core gameplay.

## Core Gameplay Requirements

### Rounds and Targets

- By default, the game enters a playable round directly, without requiring an elaborate story or level selection. The cake may be a single, clear, large decoratable surface, as long as players can see changes to the frosting and decorations.
- Each round should display a clear design target. The target includes at least one required frosting color and may include one or more required decorations with minimum quantities.
- The target library should include multiple colors and multiple decoration combinations so that every round does not have the same answer. If there are not enough usable targets, the game should remain playable in a clear way and should not crash.
- When a new round starts, the cake returns to an undecorated state, the total score from previous rounds is retained, the current target is updated, and the countdown is reset to the limit for that round.

### Frosting Controls

- The tool area at the bottom or side should offer multiple frosting colors for the player to choose from.
- Clicking a frosting color selects it; clicking the same color again may deselect it, or selecting another color replaces the current selection.
- Only when frosting is selected does clicking or touching the cake's acceptable area apply that color to the cake. Clicking or touching outside the cake, or operating on the cake when no color is selected, should not change the frosting.
- There should be visible selection feedback, and applying frosting to the cake should produce a visible change. Color names, icons, or swatches may be designed freely, but players must be able to distinguish the colors.

### Decoration Dragging

- The tool area should offer multiple decoration types, each of which can be dragged.
- When the player presses and drags from a decoration tool, there should be drag feedback that follows the pointer or touch point.
- When the player releases the mouse or touch within the cake's acceptable area, one decoration of the corresponding type should be placed near the release point, and the cake display should update immediately.
- When the player releases outside the cake, the drag should be canceled, with no decoration added, no score deducted, and no false placement.
- When multiple decorations are placed, their quantities should accumulate; the same type may be placed repeatedly to satisfy a minimum-quantity target.

### Undo, Clear, and Done

- Undo removes the most recently placed decoration. When there are no decorations, undo should not change the frosting, score, round, or timing.
- Clear removes all decorations from the current round and clears the applied frosting and current frosting selection; the total score, round, and target should not be cleared.
- Done immediately ends the current round and enters evaluation. The round also ends automatically when the countdown reaches zero.
- After evaluation, operations on the cake for the current round should be locked until the player enters the next round.

### Scoring and Progress

- Each target consists of several requirements: the frosting color requirement counts as one requirement, and each decoration type together with its minimum quantity counts as one requirement.
- During evaluation, calculate the ratio of satisfied requirements to total requirements and convert it into a 0-3 star rating. A higher match earns more stars; a complete or nearly complete match should earn the highest star rating.
- The stars earned in the current round should be added to the cumulative score. The cumulative score is retained across rounds.
- The results screen should display the rating for the current round and the cumulative score. After entering the next round, the results screen closes, and the cake and tools become interactive again.

### Timing and Feedback

- Each round has a countdown and a visible progress bar or numeric readout.
- The countdown decreases only during the playable phase; it should not continue advancing the current round while evaluation, paused, or blocked by the configuration panel.
- A visual or audio alert may be provided when time is close to running out.
- The main screen should center on a visible 2D cake, and the frosting, decorations, undo, clear, and evaluation state after player input must all be observable through the display, HUD, or panels.

## State Requirements

- `playing`: Frosting can be selected, the cake can be clicked, decorations can be dragged, and undo, clear, and done are available; the countdown advances.
- `evaluating/result`: The current round has ended, the star rating and cumulative score are displayed, and cake editing input is locked.
- `next round`: After the player confirms, a new round begins, the current round's cake is cleared, the cumulative score is retained, and the target is updated.
- `configuration` (P2): Configure targets, timing, and available tools. When the configuration panel is open, it should not obscure a main scene that claims to be currently playable.

## Permitted Scope Cuts

- Specific assets, exact prompt copy, button text, fonts, branded visuals, and audio resources do not need to be retained.
- Persistent saves or leaderboards may be omitted because the core gameplay depends only on the cumulative score during the current play session.
- If a configuration entry point for ordinary players is not provided, adjustments to the target library, timing, and available tools may be placed in author settings or a non-core mode.

## Completion Criteria

- Without instructions, the player can complete one round: read the target, select frosting, click the cake, drag decorations, complete the evaluation, and enter the next round.
- Real mouse and touch dragging can both place a decoration near its release position inside the cake, and releases outside the cake are rejected.
- Scoring, total score, countdown, results layer, and main screen remain consistent, with no contradiction in which the state is shown as evaluated but the current round can still be edited.
- Undo, clear, done, next round, and illegal input all have stable, observable postconditions.

---

## GDD / Design Doc (merged from design-doc.md)

# Frosting Frenzy Design Doc

## MDA Overview

**Mechanics**: Timed rounds, design targets, frosting selection and application, mouse and touch drag-and-drop decoration placement, undo, clear, completion or timeout evaluation, star ratings, cumulative score, next-round reset, and optional configuration.

**Dynamics**: The player first observes the target, then quickly selects a color and arranges decorations on the cake. Time pressure encourages the player to prioritize the minimum requirements, undo and clear provide room to correct mistakes, and the evaluation's star rating turns the current round's performance into motivation for a continuing challenge.

**Aesthetics**: Relaxed, hands-on dessert making, quick feedback, and low penalty. The game should make players feel that they are personally completing an order, rather than merely submitting values in a panel.

## Core Game Flow

1. After entering the game, display the playable cake, target, countdown, and tool area.
2. The player selects a frosting color and clicks or touches the cake to apply the color.
3. The player uses the mouse or touch to drag decorations from the tool area into the cake area and releases them to place them; releases outside the area are rejected.
4. The player can undo the most recent decoration or clear the current cake and start again.
5. The player enters evaluation after clicking done or when the countdown reaches zero.
6. Evaluation awards a star rating according to the proportion of target requirements satisfied and adds it to the total score.
7. The player enters the next round; the cake is cleared, the target is refreshed, the timer is reset, and the total score is retained.

## M-Features

### M1: Startup and Playable Main Screen

The main screen enters the playable state by default and displays the countdown, target, cake display, frosting tools, decoration tools, and entry points for undo, clear, and done. No blocking layer should obscure cake input in the playable state.

### M2: Target-Driven Creation Task

Each round's target defines a required frosting color and minimum quantities of required decorations. The target is visible in the HUD or a panel, and changes to the target affect the scoring result.

### M3: Frosting Selection and Click Application

After the player selects a frosting color, clicking or touching the cake's acceptable area applies that color and produces a visible change to the cake. No frosting should change if no color is selected or the player clicks outside the cake.

### M4: Drag-and-Drop Decoration Placement

The player presses and drags from a decoration tool and releases within the cake area; the decoration appears near the release point, and its quantity accumulates. Both mouse dragging and touch dragging should support the core placement path; during dragging, there should be visible feedback that follows the pointer or touch point.

### M5: Drag Drop-Point Rejection and Screen-Space Semantics

Releasing outside the cake does not place a decoration; when dragging to different drop points on the left and right sides of the screen, the decoration's visible position should follow the left-right relationship of the release point and should not be mirrored or fixed at the same point.

### M6: Undo and Clear

Undo removes only the most recently placed decoration; clear removes all decorations and clears the frosting and current selection, but does not clear the total score, round, or target.

### M7: Done, Timing, and Evaluation State Machine

The done button or time running out ends the current round. The result state displays the star rating and cumulative score and locks editing input for the current round; the next-round action closes the results and returns to the playable state.

### M8: Star Rating and Cumulative Progress

The rating is converted into 0-3 stars according to the proportion of target requirements satisfied. The current round's stars are added to the cumulative score. Satisfying more requirements should result in no fewer stars than satisfying fewer requirements.

### M9: Keyboard Shortcuts and Enhanced Feedback (P2)

Keyboard undo, clear, and done may be used as auxiliary inputs; low-time alerts, placement sounds, completion sounds, star animations, and background music improve readability.

### M10: Configuration Capability (P2)

The configuration capability can adjust target enablement, timing parameters, and available frosting and decorations. Configuration should not break the ordinary playable flow.

## Source Core Loop Coverage

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Startup and playable main screen | P0 | Open the page and wait for initialization | Visible cake area, target, timer, and tool area; the main scene is not empty | No blocking layer obscures the cake; no runtime crash |
| M2 Target-driven task | P1 | Start a round or enter the next round | The current target includes a summary of frosting and decoration requirements | Must not crash when the target is empty; target requirements determine scoring |
| M3 Frosting application | P1 | Actually click a frosting tool, then click the cake | The frosting selection state changes, and the cake's frosting state and display change | Clicking the cake without selected frosting or clicking outside the cake does not change the frosting |
| M4 Decoration placement | P1 | Use an actual mouse/touch drag from a decoration tool and release inside the cake | The decoration quantity increases, the new decoration's type and drop point are observable, and the display changes | Creating only a drag preview without placing it on the cake should fail; if only one pointer path is supported, touch or mouse players will be blocked |
| M5 Drop-point rejection and screen semantics | P1 | Drag respectively to left/right drop points inside the cake and to a drop point outside the cake | The left and right drop points retain their left-right relationship in screen space; the quantity does not change on an outside release | Fixed drop points, mirrored drop points, and placement outside the cake all fail |
| M6 Undo and clear | P1 | Click undo after placing; click clear after multiple placements | Undo reduces the decorations by one; clear reduces decorations to zero and clears the frosting | Total score, target, and round should not be rewritten by undo/clear |
| M7 Done, timeout, and next round | P1 | Click done or wait for the countdown to reach zero, then click next round | Enter the result state and display the star rating/total score; the next round returns to playing with the cake cleared | Continuing to edit the current round after evaluation is rejected; the next round retains the total score; timing does not continue deducting from the current round during the result state |
| M8 Cumulative scoring | P1 | Complete a creation that satisfies requirements in a valid scenario | The star rating does not monotonically decrease as more requirements are satisfied; the total score increases by the current round's stars | Awarding points directly, not scoring according to target requirements, or an unsynchronized total score should fail |
| M9 Shortcuts and enhanced feedback | P2 | Press keys to undo/clear/done, trigger low-time or star feedback | The HUD/state is consistent with the button path, with visible or audible feedback | Shortcuts should not continue editing in the result state |
| M10 Configuration capability | P2 | Open configuration or use valid configuration data to change available items | Available frosting/decorations and timing are reflected in the tools and round according to the configuration | Configuration must not result in no playable target or an uncloseable blocker |

## UX Requirements

- Interactive areas must be large enough for both mouse and touch to complete the core decoration path.
- The cake's acceptable area should have clear spatial boundaries, but an exact fixed geometric shape is not required; a single large cake surface is sufficient for the core gameplay.
- The tool area may scroll horizontally, but at least one frosting and at least one decoration must be discoverable.
- The results layer may use icons, numbers, or text to display the star rating, but it must let the player know the rating for the current round and the cumulative score.

## Non-Goals

- A 3D scene, realistic baking simulation, complex physics, online leaderboards, or saves are not required.
- Replicating any specific assets, copy, fonts, or button layout is not required.
