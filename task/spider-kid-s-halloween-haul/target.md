# spider-kid-s-halloween-haul Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Spider-Kid's Halloween Haul Gameplay Requirements

## 1. Game Positioning and Core Loop

This is a portrait-oriented 2D side-scrolling, one-button physics-based swinging collection game. The player controls a child dressed as a spider superhero, setting out above a Halloween neighborhood and using webs to attach to streetlights ahead or a small number of attachable flying targets, swinging, releasing, flying, and then catching the next anchor point to continue moving right.

The core loop is: start or restart -> the player holds the input to shoot a web -> the character attaches to a reachable anchor point ahead and swings around it -> the player releases at the right moment to gain flight speed -> passes through candy or advances the distance -> catches the next anchor point or falls and fails -> depending on the mode, enters victory, failure, continued score chasing, or restart.

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
