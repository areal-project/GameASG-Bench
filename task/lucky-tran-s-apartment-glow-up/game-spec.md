# Lucky Tran’s Apartment Glow-Up Gameplay Requirements

## Game Positioning
This is a casual apartment makeover game. In soft, cute interior scenes, the player chooses a room, wall tones, and sets of furniture and decorations, gradually completing the room through tapping and pressing and holding. The game has no combat or failure penalties. The goal is to complete every decoration spot in a room, earn points, receive celebratory feedback and a final showcase, and then continue decorating other rooms.

## P1 Core Experience Scope
- The first screen should be an interactive start screen. After entering, the player proceeds in order through room selection, wall tone selection, room decoration, completion celebration, and result showcase.
- Provide at least three room entries: living room, bedroom, and kitchen. Each room should have a corresponding background, wall tone choices, and multiple spots to decorate.
- Each spot to decorate provides three candidate items. Candidate items should appear as recognizable cards or equivalent selection controls, and the player can place only one choice at a time for the currently highlighted spot.
- Room decoration progresses in a fixed sequence: after the currently highlighted spot is completed, a brief celebration occurs, and then the game switches to the next spot; after all spots are completed, it enters the completion state.
- Player progress is represented by placed items, the current spot to decorate, score, or equivalent progress feedback. Each completed placement should increase the score or progress, and placed items should remain in the room.
- The screen should remain nonblank and readable: the room background, placed items, currently highlighted spot, candidate selection area, top room/progress information, and celebration feedback should all be visible.

## Input Semantics and Interaction Feel
- Start: the player clicks or touches the start control. The control should provide pressed/transition feedback and enter room selection.
- Room selection: the player clicks a room preview card to enter the preparation flow for the corresponding room; clicks on unavailable or non-card areas should not skip the flow.
- Wall selection: the player clicks a tone preview card to confirm the wall appearance, then enters the decoration phase; without a selection, the game should not proceed directly to decoration.
- Item selection: after the player clicks a candidate card, that card becomes selected, and a translucent preview or equivalent placeholder feedback appears at the current room hotspot.
- Hold to place: the player must keep pressing the preview position of the selected item within the currently highlighted hotspot. While the press is maintained, an increasingly filled progress ring or equivalent charge-up feedback should appear on screen; when progress is full, the item is automatically placed.
- Release/cancel: if the player releases before progress completes, the placement is canceled, progress is cleared, and the item remains available for selection but does not score, advance the spot, or trigger a completion celebration.
- Effects of contrary/deviating input: holding outside the hotspot, holding without an item selected, or clicking a non-candidate area should not trigger placement or advancement; the player should remain at the current step.
- Benefits and costs of the special action: the benefits of completing the hold are item placement, a score increase, positive feedback such as sparkle sound effects/vibration, and progression to the next step; the cost is that the player must keep holding, and releasing too early loses the progress of that attempt.
- Touch and mouse semantics should be consistent: click/touch is used for selection, holding is used for placement, and moving the pointer affects only hover or editing feedback and should not alter the P1 placement rules.

## Visible Feedback Flow
- After a candidate item is selected, the candidate card should be highlighted, a translucent preview of the selected item should appear at the room hotspot, and a first-time guidance prompt may appear.
- The current placeable spot should have a glowing frame, pulse, or equivalent emphasis so that the player can tell where to act next.
- During a hold, there should be a central progress ring or equivalent progress feedback. Progress should increase monotonically while the press is maintained; after cancellation, the feedback disappears or resets to zero.
- On a successful placement, the item changes from a preview into a solid object and remains in the room, while sparkle particles, brief celebration text, a success sound, or vibration feedback appears.
- After each placement, there should be a companion-character prompt or equivalent encouragement feedback describing the current decoration effect or guiding the next step, but it must not prevent the player from continuing to interact.
- The score or progress display should increase in sync with placement results; placed items must not disappear before completion.
- After the room is completed, a full-screen celebration, confetti, or equivalent completion feedback should appear, followed by a photo/share-style view showcasing the decoration result.

## State Flow
- Startup/loading: display loading feedback, and enter the start screen after resources are ready.
- Start screen: clicking start enters room selection; the game should not automatically enter decoration before start is clicked.
- Room selection: clicking a room enters that room's loading/preparation, then enters wall selection.
- Wall selection: clicking a tone enters the decoration phase.
- Decorating: the player repeatedly performs the “select a candidate item -> press and hold at the highlighted spot -> successfully place -> celebrate -> next spot” loop.
- Short celebration: after success, current placement input is temporarily locked while celebration and encouragement are shown, then decoration resumes at the next spot; after the final spot is completed, the game enters completion waiting.
- Completion state: display room-completion feedback, then transition to the result showcase screen.
- Result showcase: display the final room as a thumbnail/photo-style result and provide an entry to continue decorating other rooms; selecting another room should reset the current round's decoration state and return to wall selection.

## Win/Loss, Progress, and Restart
- This game has no traditional failure ending. The victory condition is completing all decoration spots in the current room.
- Each successful placement is a clear unit of progress; after all spots are completed, the current room round is won.
- Score should accumulate according to the number of successful placements; cancellations, clicks in incorrect areas, and holds without a selected item cannot add score.
- The “decorate other rooms” entry in the result showcase should start a new room flow, clear the current round's placed items and score, and preserve the new room target the player just selected.
- If the same round is restarted or the room is switched, the old room's temporary decorations, celebration particles, hold progress, and prompt state should be cleared to prevent remnants from obstructing the next round.

## Menus, Modes, and Assistive Systems
- The P1 menu flow includes start, room selection, wall selection, decoration, completion showcase, and continuing to decorate other rooms.
- P1 does not require a pause menu, level-selection list, shop, failure retry, or save loading; if these entries are provided, they cannot obstruct the main flow or disrupt current progress.
- Background music and success sound effects are P2 enhancements; when there is no sound, the game must still be completable through visual feedback.
- A companion character, speech-bubble prompts, first-time guidance gestures, and personalized encouragement are part of the P1 experience; the wording may vary but must convey guidance, celebration, or a next-step prompt.
- Social share buttons are P2: clicking them may provide a share prompt or feedback, but they do not need to actually connect to an external platform; the share entry cannot replace the final result showcase.

## Rooms and Decoration Content
- P1 covers at least three themed rooms. Each room contains multiple types of decoration spots, such as large furniture, floor items, wall decorations, curtains/lighting, tabletop ornaments, plants, or small household items.
- Each spot should have three styles available, and the differences among choices should be visible both in the card previews and in the final room.
- Wall tones should provide at least four available appearances. After selection, the room background or overall wall appearance should change.
- The room should be displayed from a fixed viewpoint. Item placement should fit the room's spatial relationships; items cannot all be stacked at the same point or placed outside the room's main area.
- The candidate selection area should remain visible during the decoration phase, and until the current step ends, it should display only the candidate set corresponding to the current hotspot.

## Rejection Paths and Fixed Rules
- Before start is clicked, room-selection and decoration inputs should be invalid.
- Before room selection is completed, wall-selection and decoration inputs should be invalid.
- Before wall selection is completed, candidate cards and placement hotspots should not directly begin decoration.
- When no candidate item is selected, pressing and holding at the hotspot should not place any item.
- Holding outside the hotspot, releasing too early, clicking a blank area, or repeatedly clicking a completed hotspot cannot add score or skip the current step.
- During successful placement and the short celebration, repeated triggering of the same spot should be prevented; a spot can advance only once from one successful hold.
- The completion and result showcase states should no longer accept ordinary decoration input; a new room can be started only through an explicit continue-decorating entry.
- Score and placed count cannot decrease because of a cancellation, nor can they increase because of an invalid click.

## P2 Optional Enhancements
- Edit mode: this may be provided as a creator/advanced mode, allowing the player to select a placed item, then drag its position, adjust its size, flip it, rotate it, switch to another variant for the same spot, and save the current room layout. This mode is not part of the P1 player flow.
- Parameter adjustment: P2 may provide settings for the overall color theme, hold duration, sparkle intensity, or furniture style; these settings cannot disable the core hold-to-place loop.
- Share prompts: the result showcase may provide multiple platform-style buttons that, when clicked, show a screenshot-sharing prompt; actual publishing or external authorization is not required.
- Richer animation: title animations, floating buttons, fade-in/fade-out transitions, confetti, character expressions, and environmental decorations can enhance the atmosphere, but cannot replace the interactive decoration loop.

## Scope Cuts
- Free-placement sandboxing, grid construction, budget economies, purchase unlocks, mission scoring, NPC dialogue trees, multiplayer interaction, and actual social publishing are not required.
- Physics collisions, dragging items to complete P1 placement, combat, driving, flying, and time pressure are not required.
- No specific wording, asset names, numerical positions, or visual styles need to be retained; only the player-visible room makeover flow, hold-to-place interaction feel, progress advancement, and warm, cute feedback experience need to be retained.

---

## GDD / Design Doc (merged from design-doc.md)

# Lucky Tran's Apartment Glow-Up Design Doc

## Design Intent
Lucky Tran's Apartment Glow-Up is a relaxed room makeover game about choosing a room, choosing a wall tone, and completing a sequence of decoration placements. The experience should feel soft, cute, guided, and rewarding: the player makes simple preference choices, holds to commit each item, watches the space become more complete, and receives warm celebration feedback.

The design does not rely on combat, time pressure, budgets, purchasing, freeform construction, physics, or failure punishment. The core satisfaction comes from visible before/after room transformation, small personal choices, and a tactile hold-to-place loop.

## MDA

### Mechanics
- Start and reset flow: the player begins from a clear title/start screen, enters room selection, chooses a room, chooses a wall tone, decorates, reaches completion, and can continue with another room.
- Room selection: at least three room choices are available: living room, bedroom, and kitchen. Selecting a room prepares that room's decoration flow.
- Wall tone selection: each room offers at least four wall or room color treatments. A wall choice must visibly affect the room before item placement begins.
- Sequential decoration spots: each room has multiple ordered placement spots. Only the current spot is active, highlighted, and paired with its current candidate choices.
- Three-way item choice: each active spot presents three visibly distinct candidate items. The player selects one candidate before placement can begin.
- Hold-to-place commitment: after selecting an item, the player must press and hold on the current highlighted spot. Hold progress grows while the press is maintained and completes placement only when full.
- Cancel and rejection rules: releasing early, holding outside the active spot, holding without an item selected, clicking empty areas, clicking completed spots, or trying to skip earlier flow steps must not place an item, add score, or advance the sequence.
- Placement reward: successful placement turns the preview into a persistent placed object, increases score or progress, emits sparkle or equivalent positive feedback, shows encouragement, and advances to the next spot after a brief celebration.
- Room completion: completing all spots produces a full-room celebration and then a photo/share-style showcase of the final decorated room.
- Continue flow: from the showcase, the player can choose another room to decorate. Starting another room clears the prior room's temporary placement state, hold progress, particles, and current score.
- Optional enhancements: music, success sounds, richer animation, share feedback, and advanced edit controls can add polish, but they must not replace or break the P1 flow.

### Dynamics
- The player first makes broad identity choices, then repeats a focused micro-loop of choose, preview, hold, place, celebrate.
- The current highlighted spot reduces uncertainty: the player always knows which part of the room is being decorated next.
- Candidate cards encourage preference and style comparison without requiring inventory, pricing, or strategy.
- The hold mechanic creates light tactile commitment. The player sees progress build over time, and early release clearly cancels the attempt.
- Short celebrations pace the sequence and create a feeling that each placement matters.
- The room steadily fills with visible objects, so progress is both numeric and spatial.
- Invalid actions are gentle blockers rather than punishments. The game keeps the player in the same step and preserves current progress.
- Completion converts the work-in-progress room into a final keepsake view, then routes the player toward another room if they want to continue.

### Aesthetics
- Cozy: rooms should read as warm apartment interiors rather than abstract menus.
- Sweet: item choices, wall tones, feedback, and companion prompts should feel cute and gentle.
- Satisfying: each successful placement should have visible sparkle, motion, sound, vibration, or equivalent positive confirmation.
- Guided: the game should communicate the next action through highlight, preview, progress, and encouragement rather than pressure.
- Personal: three item variants and wall choices should make the resulting room feel meaningfully selected by the player.
- Low-stress: there is no fail state, countdown, punishment, or resource anxiety.

## P1 Executable Core Loop

### Full Room Trajectory
1. Start/reset: the game opens to a start screen. The player taps or clicks start and sees a transition into room selection.
2. Player input: the player selects one of the available room cards.
3. Continuous state changes: the chosen room becomes the active target, the game prepares that room, then shows wall tone options instead of immediately entering placement.
4. Goal/risk: the player must choose a wall tone before decorating. Clicking outside the wall choices cannot skip ahead.
5. Reward/failure: a valid wall choice changes the visible room treatment and unlocks the decoration phase; invalid input leaves the player in wall selection.
6. Progress/restart: the game starts the first decoration spot with no placed items, no score for that room, and a visible current-step highlight.

### Repeated Placement Trajectory
1. Start/reset: a room is in decorating phase with a current highlighted spot, three candidate items, score/progress visible, and any previously placed items still shown.
2. Player input: the player clicks or touches one candidate item.
3. Continuous state changes: the selected candidate becomes highlighted, and the current room spot shows a preview or equivalent placement hint for that item.
4. Player input: the player presses and holds inside the highlighted spot.
5. Continuous state changes: hold progress grows while the press is maintained. The preview and progress feedback remain connected to the current spot.
6. Goal/risk: the player is trying to fill the hold progress. The risk is releasing early, pressing outside the active spot, or attempting placement without a selected item.
7. Failure/rejection: if the player releases before progress is full, or holds in an invalid place, progress clears or disappears, the item is not placed, score/progress does not increase, and the current spot remains active.
8. Reward: if hold progress reaches full, the selected item becomes a persistent room object, score or progress increases, sparkle/celebration/encouragement feedback appears, and input for that spot is briefly locked to prevent duplicate placement.
9. Progress/restart: after the short celebration, the game advances to the next spot with a fresh candidate set. If all spots are complete, it enters room completion instead of returning to normal placement.

### Completion And Continue Trajectory
1. Start/reset: the last placement in the room has succeeded and all required spots are filled.
2. Continuous state changes: the game enters a completion state with full-room celebration and then transitions to a final showcase view of the decorated room.
3. Goal/risk: the player should be able to inspect the completed room and choose another room if available. Normal placement input should no longer affect the completed room.
4. Reward/failure: the reward is the final decorated-room presentation. Attempts to keep placing during completion/showcase are rejected unless they use the explicit continue path.
5. Progress/restart: choosing another room starts a new room flow, clears the previous room's temporary score, selected item, hold progress, particles, and placed objects for the new round, and returns to wall tone selection for the new target.

## M-Feature Coverage Matrix

| M-feature | Priority | Player trigger | Observable result | Failure/rejection/invariant |
|---|---|---|---|---|
| M1 Start and phase gating | P1 | Click or touch start | Start screen transitions to room selection | Room/wall/placement actions before their phase do not skip ahead |
| M2 Room selection | P1 | Click or touch a room card | Selected room becomes active and prepares its own wall/decor flow | Non-card clicks do not select a room or enter decorating |
| M3 Wall tone selection | P1 | Click or touch a wall tone card | Room background or wall treatment visibly changes; decorating unlocks | Decorating cannot begin before a wall tone is chosen |
| M4 Active spot guidance | P1 | Enter decorating or advance after placement | Current spot is highlighted; only that spot's three candidates are available | Completed or inactive spots cannot be used to skip sequence |
| M5 Candidate item selection | P1 | Click or touch one of three candidates | Candidate visibly selected; preview or placement hint appears at the active spot | Empty-area clicks and no-selection holds do not place or score |
| M6 Hold-to-place progress | P1 | Press and hold inside active highlighted spot after selecting an item | Progress ring or equivalent fills continuously while held | Releasing early clears progress and does not advance |
| M7 Successful placement reward | P1 | Maintain hold until progress completes | Item becomes persistent, score/progress increases, sparkle/celebration/encouragement appears | One spot can advance only once per successful hold |
| M8 Sequential room completion | P1 | Complete every spot in the room | Final celebration and completed-room showcase appear | Completed/showcase state rejects ordinary placement input |
| M9 Continue to another room | P1 | Use the explicit continue/decorate-other-room entry | New room flow starts with cleared temporary placement state and fresh wall selection | Old hold progress, selected item, particles, and placed objects do not block the new room |
| M10 Visible progress and HUD | P1 | Any valid placement | Score/progress and placed count visibly match successful placements | Cancelled or invalid input cannot increase score/progress |
| M11 Companion guidance and encouragement | P1 | First selection, placement success, or next-step transition | Non-blocking prompt or character-style feedback guides or celebrates | Guidance must not cover controls or prevent the next action |
| M12 Three-room content breadth | P1 | Navigate room selection and continue flow | Living room, bedroom, and kitchen each provide room visuals, wall tones, and multiple placement spots | P1 cannot collapse all rooms into the same single empty scene |
| M13 Visual readability | P1 | Load any main phase | Room, active spot, candidate choices, progress/HUD, and feedback are visible and nonblank | Core play cannot be hidden behind blocking overlays |
| M14 Audio/haptics polish | P2 | Start, choose, or place successfully | Optional music, chime, vibration, or equivalent sensory polish | Visual feedback must still carry the game if audio is unavailable |
| M15 Share-style feedback | P2 | Use share prompt in the showcase | In-game share-style response or prompt appears | Sharing cannot replace the required final room showcase |
| M16 Advanced edit/settings controls | P2 | Enter optional edit/settings controls if provided | Player can adjust or save layout/style options as an enhancement | These controls are not required for P1 and must not break the guided hold-to-place loop |

## State Model

| State | Purpose | Required exits | Guardrails |
|---|---|---|---|
| Loading | Communicate setup readiness | Start screen | Must not expose broken or blank playfield as playable |
| Start | Invite the player into the game | Start action to room selection | No room, wall, or placement progress before start |
| Room selection | Choose which room to decorate | Valid room card to wall selection | Non-card input is ignored |
| Wall selection | Choose the room's wall tone | Valid wall card to decorating | Placement controls stay unavailable until a tone is chosen |
| Decorating | Repeat choose-item and hold-place loop | Successful hold to celebration; all spots to completion | Invalid holds/clicks do not score or advance |
| Short celebration | Confirm one successful placement | Timed return to decorating or completion path | Duplicate placement for the same spot is locked out |
| Completion | Celebrate all spots filled | Transition to final showcase | Ordinary placement input is disabled |
| Showcase | Present final decorated room | Continue to another room | New room starts with transient state cleaned |

## Feedback Requirements
- Room transformation must be spatial: placed items remain visible in their appropriate room areas instead of being represented only as numbers.
- Selected candidates must be distinguishable from unselected candidates.
- The active spot must remain visually discoverable before and during hold.
- Hold progress must be time-based and monotonic during a maintained press.
- Success feedback must combine at least a persistent room change with a score/progress change and a celebratory visual or prompt.
- Cancelled or invalid actions should be quiet but clear: the game stays in the same step, clears hold progress when applicable, and preserves previous valid progress.
- Final showcase must display the completed room outcome, not just a generic completion message.

## Priority Boundaries
- P1 is satisfied only when the player can complete the full guided loop for at least the required room set: start, choose room, choose wall tone, select item, hold to place, repeat through all spots, view completion, and continue to another room.
- P2 may add richer animation, music, share prompts, edit controls, and tuneable presentation settings.
- Cut scope excludes freeform sandbox placement, purchase economies, unlock budgets, NPC dialogue trees, multiplayer, real social publishing, physics challenges, combat, driving, and time-pressure failure.
