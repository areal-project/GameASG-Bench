# gungategang Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# GunGateGang Gameplay Requirements

## 1. Game Overview

GunGateGang is a portrait-oriented squad runner shooter. The player controls a gun-wielding squad that continuously advances along a bridge roadway, choosing among multiple routes through lateral movement, passing through beneficial reinforcement gates, avoiding reduction gates and obstacles, while relying on automatic fire to repel enemies, shatter targets, upgrade weapons, and accumulate score.

The core loop is: start a run -> the squad automatically advances and fires -> the player adjusts the route left and right -> firepower changes targets ahead or eliminates enemies -> pass through gates to increase or decrease the squad, shatter obstacles to switch weapons, and kill enemies to score -> squad size and weapons affect subsequent survivability -> settle the run after the entire squad is lost and allow a restart.

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
