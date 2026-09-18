# knife-blitz-2 Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Knife Blitz 2 Gameplay Requirements

## Product Positioning

Knife Blitz 2 is a single-screen 2D timing arcade game about throwing knives. The player faces a continuously rotating circular target and launches knives toward it from the bottom of the screen, with the goal of sticking the required number of knives into the target in each level without hitting any existing knives. The game should emphasize short pacing, strong feedback, and tension that escalates from level to level: every throw is fast, decisive, and irreversible; success delivers satisfying hits and reward progression, while failure delivers a clear collision interruption and a quick retry.

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
