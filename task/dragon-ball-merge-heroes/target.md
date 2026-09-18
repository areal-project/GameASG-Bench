# dragon-ball-merge-heroes Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Dragon Ball Merge Heroes Game Spec

## Requirements Overview

This game is a portrait-oriented merge idle card game. Players spend currency to recruit basic heroes and place them in a 4x4 training grid, improving the team's tier by using real drag interactions to move, swap, delete, or merge heroes. Heroes on the board continuously generate currency according to their own tiers; that currency is then used to recruit new heroes and purchase backgrounds. The ultimate goal is to expand the collection, increase income per second, and unlock more visible content.

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
