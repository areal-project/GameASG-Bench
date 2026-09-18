# stickman-anchor Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Stickman Anchor Gameplay Requirements

## Game Positioning

Stickman Anchor is a side-view 2D stickman archery battle game. The player stands on a platform on the left, facing enemy archers on the right or on platforms at varying heights. By dragging to aim and releasing to shoot arrows that follow a curved, downward trajectory, the player defeats all enemies in the current level, earns stars, coins, and equipment progression, and continues to challenge more complex levels.

The core playability must come from genuine archery combat rather than static click-to-resolve interactions: the player, enemies, platforms, arrow trajectories, health bars, hit feedback, enemy counterattacks, and level results should always be visible on screen. The player's primary experience is reading angles and anticipating height differences and moving targets, then turning the situation around with precise headshots, combos, and special arrows before dangerous counterattacks occur.

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
