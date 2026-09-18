# city-racer-x-neon-rush Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# City Racer X Neon Rush Game Spec

## Requirements Overview

This game is a portrait-oriented 3D motorcycle racing game. After entering the city track from the menu, the player's motorcycle automatically accelerates forward and races alongside 4 AI riders. The player's core objective is to complete a multi-lap race within the specified course, avoiding traffic moving in the same direction, oncoming vehicles, pedestrians, roadside narrowing, and dynamic traffic, while accumulating a balance through placement, distance, top-speed performance, near-miss dodges, and settlement rewards to purchase and equip higher-performance motorcycles.

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
