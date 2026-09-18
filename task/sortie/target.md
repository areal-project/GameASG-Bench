# sortie Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Sortie Complete Gameplay Requirements

## Game Positioning

Sortie is a relaxing item organization and shape-matching puzzle game. Players face a storage tray with multiple silhouette slots and a set of themed items scattered above or around the scene. By observing each item's appearance, the slot silhouettes, sizes, and positional relationships, they drag every item into the slot that truly corresponds to it.

The core objective is to put all items in a level into their proper places and advance through consecutive levels to new themed organization challenges. The game should emphasize a soothing, tidy, and correctable organizing experience: trial and error may occur, but mistakes should not cause items to become stuck or leave the player in an unrecoverable state.

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
