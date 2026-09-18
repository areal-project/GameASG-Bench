# barbies-pink-dream-wardrobe Implementation Task

Build the runnable browser game described below and in the workspace GDD/TDD.

## Gameplay Brief

# Pink Dream Wardrobe Game Spec

## Requirements Overview

This game is a collection of pink fashion dress-up activities and minigames. After entering the wardrobe, players manage coins, browse fashion items in different categories, purchase locked items, equip or unequip owned items, and observe outfit changes through the central character preview. The core loop is: enter the wardrobe -> select a category and item -> spend coins to unlock it when needed -> update the preview after equipping it -> enter a minigame to earn coins -> return to the wardrobe to continue expanding outfit combinations.

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
