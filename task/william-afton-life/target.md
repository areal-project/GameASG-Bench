# william-afton-life Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# William Afton life Gameplay Requirements

## 1. Game Positioning and Objectives

This is a blocky pixel-style 3D open-city life/crime sandbox. The player takes the role of William Afton, walking and driving through an explorable city, interacting with NPCs and vendors, using weapons, avoiding or provoking the police, and advancing the story and resource growth along a mission chain.

The player's long-term objective is to continuously complete city missions, earn cash and weapon resources, expand their ability to act, and survive while balancing health, wanted level, ammunition, and traffic risks. The game does not require a fixed endpoint for a single session; its main progression comes from completing missions, obtaining rewards, expanding equipment, reaching locations, and respawning after death to continue acting.

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
