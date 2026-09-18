# turbo-smash-beast Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Turbo Smash Beast Gameplay Requirements

## Goals and Experience

Turbo Smash Beast is a 3D vehicular crash-and-destruction game. The player builds up speed in a vehicle from the start of a city road, travels along a road with risks from vehicles and explosives, launches off a ramp toward a huge block monster, and reduces the monster's health through impacts, penetration, and continuous crushing. Each dash should form a clear loop: prepare the vehicle and level, hold to accelerate and adjust the line laterally, launch off the ramp, hit the monster or miss and land, then enter victory, continue/retry, or the next level according to the amount of destruction.

The core feeling is “heavy destruction after a charged dash.” The visuals must let the player see the drivable vehicle, road, ramp, giant monster, speed feedback, monster health feedback, impact debris, shake/impact feedback, and result feedback, rather than explaining the outcome only with numbers.

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
