# astroman Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# AstroMan Game Spec

## Requirements Overview

AstroMan is a portrait-oriented 3D open-world urban hero game. The player moves through a city containing roads, blocks, buildings, rooftops, vehicles, pedestrians, quest characters, shops, and coastal waters, earning score and reputation by moving, flying, driving, interacting, using superpowers, and completing quests. The game must retain the WebGL/3D main scene as a player-visible product requirement: after entering the playable state, the main view must not be blank or consist only of the HUD; the player should be able to see a readable city environment, the protagonist or current vehicle, NPCs/vehicles, and other entities.

## Workspace Documents

The target prompt is the implementation task and output constraints. Also read:
- `/envarena/workspace/game-spec.md` for the complete GDD gameplay requirements.
- `/envarena/workspace/tdd.md` for the public acceptance contract.

The TDD is binding when present: implement the required `window.__gameTest` public API, scenarios, input semantics, snapshot fields, rejection rules, invariants, and observable postconditions.

## Generation Constraints

- Generate one playable browser game at `/envarena/workspace/index.html`.
- Keep all first-party HTML, CSS, and JavaScript inline in that single file.
- Third-party libraries may be loaded from stable CDN URLs when useful.
- Do not create or require local runtime companion files such as `game.js`, `style.css`, modules, JSON, images, audio, package manifests, or assets.
- Work in saved stages inside the same `index.html`: first a runnable skeleton with visible game surface, HUD shell, inline style/script, and real `window.__gameTest` stubs wired to state; then add state, scenarios, inputs, scoring/resources/results, rendering feedback, real browser controls, and polish.
- Each stage must leave `index.html` runnable by itself.
- Before final response, verify `index.html` is non-empty, ends with `</html>`, exposes the public contract, contains inline first-party CSS/JS, and has no local first-party runtime dependencies.
