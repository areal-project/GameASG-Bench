# ancient-beast Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Ancient Beast Gameplay Requirements

## 1. Game Positioning

Ancient Beast is a turn-based hex-grid strategy battle game with a dark sci-fi style. Each player controls a core priest unit and uses resources to summon beasts of different factions, sizes, and ability roles, taking turns on a shared battlefield to move, attack, use abilities, wait, or end turns. The goal is to defeat the enemy faction under the pressure of limited resources and action order, then provide clear victory, defeat, and scoring feedback at the end based on kills, survival, battlefield control, and efficiency.

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
