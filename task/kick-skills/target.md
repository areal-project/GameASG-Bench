# kick-skills Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Kick Skills Gameplay Requirements

## Product Positioning

Kick Skills is a 3D arcade soccer shooting challenge game. From a fixed shooting position, the player faces the goal, drags to build power, chooses a shot direction, and adjusts the contact point on the ball to create different heights and curves. The goal is to complete a series of shooting challenges within a limited number of attempts, accumulate points, earn coins, and unlock ball appearances.

A qualifying game experience is not simply clicking to score. It must present a readable field, ball, goal, target ring, obstacles, goalkeeper, and feedback panel, allowing the player to judge the route before each shot and see the ball's flight, spin, bounce, collision, entry into the net, or miss after the shot.

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
