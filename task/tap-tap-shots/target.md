# tap-tap-shots Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Tap-Tap Shots Gameplay Requirements

## Goal and Genre

Tap-Tap Shots is a portrait 2D physics-based rhythm basketball game. The player's goal is to make the basketball bounce, travel horizontally toward the hoop, and go in through repeated clicks or touches during a timed shooting run, accumulating as many points, coins, and high-score records as possible.

A qualifying game experience is not a static shoot button, but a continuously moving shooting loop: the ball, hoop, floor, backboard, and rim must produce physics-based feedback within the same visible court, and the player relies on tap timing to adjust the ball's height and forward rhythm.

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
