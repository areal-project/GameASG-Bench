# the-daughter-of-the-sea-before-the-foam Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# The Daughter of the Sea: Before the Foam Gameplay Requirements

## Game Positioning

This is a fairy-tale narrative puzzle game. In a portrait or adaptive display, players restore scrambled illustrations level by level, with each image corresponding to an important moment in the daughter of the sea's journey; after a puzzle is completed, story text and the next action appear, and players continue forward or choose between two options at key moments, ultimately reaching different fateful endings.

The core enjoyment comes from a three-part loop: dragging pieces, watching the image gradually come together, and reading a new story turn. The game's atmosphere should remain dreamlike, romantic, sorrowful, and evocative of an ocean fairy tale. Interaction feedback should be gentle but clear, making players feel that they are piecing memory and fate back together bit by bit.

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
