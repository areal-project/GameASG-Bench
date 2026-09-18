# armor-alley Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Armor Alley Gameplay Requirements

## 1. Product Positioning

Armor Alley is a side-scrolling helicopter battlefield strategy action game. The player simultaneously takes on the roles of aerial pilot and battlefield commander: personally flying a helicopter to move across the long battlefield, attack, deploy soldiers and supplies, while using funds to produce ground units and push the friendly front line from the base on the left toward the enemy base.

The core objective is to protect the friendly base from being breached by the enemy convoy and escort the friendly supply vehicle through the enemy base. The game must present a continuously operating battlefield rather than a single-aircraft shooting minigame: friendly and enemy helicopters, tanks, missile vehicles, supply vehicles, infantry, engineers, turrets, bunkers, balloons/chains, clouds, radar, and the HUD together constitute the combat information.

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
