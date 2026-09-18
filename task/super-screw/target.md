# super-screw Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Super Screw Gameplay Requirements

## Gameplay Positioning

Super Screw is a 2D mechanical contraption disassembly puzzle game. On a portrait-oriented canvas, the player handles mechanical structures composed of multilayer parts, screws, and empty holes. By moving screws to change the fastening relationships, the player causes all parts to loosen and leave the contraption area. The core fun comes from judging the order of “which screw to remove first, and where to put it,” as well as the stress-relieving feedback produced when loosened parts swing, collide, and fall.

The game should prioritize ensuring a complete playable core loop: enter a level, observe the structure secured by screws, select a screw, choose a legal empty hole in which to place it, trigger a part to loosen or fall, gradually clear all parts, display victory, and enter the next level or replay.

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
