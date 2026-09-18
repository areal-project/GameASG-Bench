'use strict';

// === GDD Coverage Map ===
// M1 Entry/state shell -> p0-boot-contract, p0-reset-start-contract, p1-click-start-visible-flow, p1-pause-freeze-resume, p1-restart-clears-transient-run
// M2 Directional swimming -> p1-keyboard-direction-opposite, p1-vertical-direction-opposite, p1-pointer-targeting-override, p2-touch-joystick-direction-opposite
// M3 Boost tradeoff -> p1-boost-cost-benefit-release, p1-boost-invalid-rejection, p1-boost-reverse-direction
// M4 Food growth -> p1-food-contact-growth, p1-food-invalid-target-invariant
// M5 Predator/prey combat -> p1-smaller-tadpole-eat, p1-larger-threat-death-respawn, p1-respawn-protection-invariant
// M6 AI ecosystem -> p1-ai-world-motion-pressure
// M7 Boundaries/obstacles -> p1-boundary-blocks-passthrough, p1-soft-hard-obstacle-collision
// M8 HUD/progress feedback -> p0-playfield-ecosystem-ready, p1-hud-sync-after-actions
// M9 Death/respawn -> p1-larger-threat-death-respawn, p1-respawn-protection-invariant, p1-restart-clears-transient-run
// M10 Growth level mode -> p2-growth-level-selection-and-lock
// M11 Auxiliary display/settings -> p2-helper-display-settings-invariant
// M12 Environmental pressure -> p2-environment-pressure-optional-contract
// M13 Ecosystem depth/atmosphere -> p2-atmosphere-does-not-replace-core
// === Rationality Map ===
// p1-click-start-visible-flow: M1 | real action: browser.mouseClick visible start control | independent observation: snapshot phase/mode plus overlay/playfield/render | empty-shell failure: adapter-only state or blocking menu shell fails
// p1-pause-freeze-resume: M1/M8 | real action: contract pause/resume and forbidden movement while paused | independent observation: survival/world/player digest freeze then resumed progress | empty-shell failure: visual pause label without simulation freeze fails
// p1-restart-clears-transient-run: M1/M9 | real action: returnMenu/restartRun/startEndless controls | independent observation: transient size/kills/time/boost/panel reset | empty-shell failure: stale run state or overlay leak fails
// p1-keyboard-direction-opposite: M2 | real action: keyDown/keyUp ArrowRight then ArrowLeft | independent observation: signed screenX deltas, facing/speed/revision, release settle | empty-shell failure: direction opposite / 方向相反 Math.sign relation catches mirrored or one-way input
// p1-vertical-direction-opposite: M2 | real action: keyDown/keyUp ArrowUp then ArrowDown | independent observation: signed screenY deltas, visibility and render revision | empty-shell failure: direction opposite / 方向相反 Math.sign relation catches invisible or mirrored vertical control
// p1-pointer-targeting-override: M2 | real action: Input.dispatchMouseEvent movement to playfield target then keyDown keyboard override | independent observation: target distance decreases, then key trend overrides pointer drift | empty-shell failure: cosmetic cursor or fighting input sources fail
// p1-boost-cost-benefit-release: M3 | real action: holdDirection then holdBoost/releaseBoost | independent observation: speed/boost feedback plus size cost and release cleanup | empty-shell failure: boost label, free speed, or stuck boost fails
// p1-boost-invalid-rejection: M3 | real action: invalid no-direction and paused/menu boost attempts | independent observation: reason envelope or unchanged speed/size/feedback | empty-shell failure: permissive boost toggle or invalid resource mutation fails
// p1-boost-reverse-direction: M2/M3 | real action: moving boost then opposite direction input | independent observation: Math.sign screen trend reverses while boost remains movement-coupled | empty-shell failure: stale velocity or mirrored boost fails
// p1-food-contact-growth: M4/M8 | real action: legal near_food then swimToVisibleTarget food | independent observation: size/HUD/eat feedback plus food/render revision | empty-shell failure: direct size increment without contact or stale HUD fails
// p1-food-invalid-target-invariant: M4 | real action: move away/wait and invalid target handle | independent observation: size/kills/eat feedback unchanged and rejection reason | empty-shell failure: auto-award food or target-handle cheating fails
// p1-smaller-tadpole-eat: M5/M8 | real action: near_smaller_tadpole then swimToVisibleTarget tadpole | independent observation: kills/size/AI interaction and no death | empty-shell failure: single counter mutation or reward+death overlap fails
// p1-larger-threat-death-respawn: M5/M9 | real action: near_larger_threat then player contact/wait | independent observation: death feedback/result plus small protected respawn reset | empty-shell failure: silent death or no respawn fails
// p1-respawn-protection-invariant: M5/M9 | real action: protected start then approach larger threat | independent observation: alive/result/deathRevision stable through protection | empty-shell failure: spawn-camping repeat death fails
// p1-ai-world-motion-pressure: M6/M8 | real action: ai_activity wait | independent observation: worldMotion/AI interaction/rank or visible tadpole motion changes | empty-shell failure: static decorative AI or frame-only counter fails
// p1-boundary-blocks-passthrough: M7 | real action: near_boundary holdDirection toward border | independent observation: arenaX/Y bounds plus collision/render feedback | empty-shell failure: decorative borders or off-map movement fails
// p1-soft-hard-obstacle-collision: M7 | real action: near_soft_obstacle and near_hard_obstacle swimToVisibleTarget | independent observation: collision revision, obstacle route/block/displacement, alive/in-bounds | empty-shell failure: non-interactive obstacle art fails
// p1-hud-sync-after-actions: M8 | real action: wait, eat, kill/death legal scenarios | independent observation: HUD survival/size/kills/rank feedback follows gameplay | empty-shell failure: API-only counters or stale HUD fail
// p1-invalid-action-rejection: M1-M9 | real action: malformed/invalid-phase contract actions | independent observation: lastAction reason plus gameplay digest invariant | empty-shell failure: ok-only adapter or hidden mutation fails
// p2-helper-display-settings-invariant: M11 | real action: setHelperDisplay modes/settings controls | independent observation: helper booleans and unchanged core run digest | empty-shell failure: label-only settings or core-rule mutation fails
// p2-growth-level-selection-and-lock: M10 | real action: level_select then selectLevel unlocked/locked | independent observation: growth mode/objective entry and locked rejection | empty-shell failure: decorative level menu or locked entry fails
// p2-environment-pressure-optional-contract: M12 | real action: environment_pressure_pending wait/play | independent observation: events/render/HUD pressure or explicit unsupported_optional_feature | empty-shell failure: hidden flags or silent death fail
// p2-atmosphere-does-not-replace-core: M13 | real action: longer play/wait after endless_start | independent observation: optional render/world activity while P1 food/AI/collision/HUD remain valid | empty-shell failure: decorative atmosphere replacing required core systems fails
// p2-touch-joystick-direction-opposite: M2 | real action: Input.dispatchTouchEvent right and left drags | independent observation: Math.sign screen deltas and release settle | empty-shell failure: direction opposite / 方向相反 catches unified-direction or API-only touch

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const PASS = detail => ({ status: 'PASS', detail });
const FAIL = detail => ({ status: 'FAIL', detail });

function finite(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function approxChanged(a, b, epsilon = 0.01) {
  return finite(a) && finite(b) && Math.abs(b - a) > epsilon;
}

function signOf(n, epsilon = 0.5) {
  if (!finite(n) || Math.abs(n) <= epsilon) return 0;
  return Math.sign(n);
}

function p(s) {
  return s && s.player ? s.player : {};
}

function hud(s) {
  return s && s.hud ? s.hud : {};
}

function feedback(s) {
  return hud(s).feedback || {};
}

function world(s) {
  return s && s.world ? s.world : {};
}

function counts(s) {
  return world(s).entityCounts || {};
}

function render(s) {
  return s && s.render ? s.render : {};
}

function helper(s) {
  return s && s.helperDisplay ? s.helperDisplay : {};
}

function last(s) {
  return s && s.lastAction ? s.lastAction : {};
}

function level(s) {
  return s && s.level ? s.level : null;
}

function events(s) {
  return s && s.events ? s.events : {};
}

function digestRun(s) {
  return JSON.stringify({
    phase: s && s.phase,
    mode: s && s.mode,
    result: s && s.result,
    panel: s && s.activePanel,
    canInteract: s && s.canInteractWithPlayfield,
    player: {
      size: p(s).size,
      sizeBand: p(s).sizeBand,
      x: p(s).screenX,
      y: p(s).screenY,
      alive: p(s).alive,
      boosting: p(s).boosting
    },
    hud: {
      survival: hud(s).survivalSeconds,
      kills: hud(s).kills,
      rank: hud(s).rank,
      feedback: feedback(s)
    },
    level: level(s) && {
      selectedIndex: level(s).selectedIndex,
      objectiveProgress: level(s).objectiveProgress,
      objectiveComplete: level(s).objectiveComplete
    }
  });
}

function transientDigest(s) {
  return {
    size: p(s).size,
    sizeBand: p(s).sizeBand,
    kills: hud(s).kills,
    survival: hud(s).survivalSeconds,
    boosting: p(s).boosting,
    result: s && s.result,
    phase: s && s.phase,
    panel: s && s.activePanel
  };
}

function strictSnapshotError(s, label) {
  if (!s || typeof s !== 'object') return `${label} is not an object`;
  if (!['menu', 'levelSelect', 'playing', 'paused', 'deathFeedback', 'levelComplete'].includes(s.phase)) return `${label}.phase invalid`;
  if (!['none', 'endless', 'growth'].includes(s.mode)) return `${label}.mode invalid`;
  if (!['none', 'death', 'levelComplete'].includes(s.result)) return `${label}.result invalid`;
  if (!['none', 'menu', 'levelSelect', 'pause', 'settings', 'scores', 'death', 'levelComplete'].includes(s.activePanel)) return `${label}.activePanel invalid`;
  if (typeof s.overlayBlocking !== 'boolean' || typeof s.canInteractWithPlayfield !== 'boolean') return `${label} blocking booleans missing`;
  if (!s.render || typeof s.render.playfieldVisible !== 'boolean' || typeof s.render.playfieldNonBlank !== 'boolean' || !finite(s.render.playfieldRevision) || typeof s.render.playerVisible !== 'boolean') return `${label}.render schema incomplete`;
  if (!s.player || !finite(s.player.screenX) || !finite(s.player.screenY) || !finite(s.player.arenaX) || !finite(s.player.arenaY) || !finite(s.player.size) || !finite(s.player.speed)) return `${label}.player numeric schema incomplete`;
  if (!['tiny', 'small', 'medium', 'large', 'huge'].includes(s.player.sizeBand)) return `${label}.player.sizeBand invalid`;
  if (!['idle', 'normal', 'boost'].includes(s.player.speedBand)) return `${label}.player.speedBand invalid`;
  if (!['left', 'right', 'up', 'down', 'diagonal', 'unknown'].includes(s.player.facing)) return `${label}.player.facing invalid`;
  if (typeof s.player.protected !== 'boolean' || typeof s.player.boosting !== 'boolean' || typeof s.player.alive !== 'boolean') return `${label}.player booleans missing`;
  if (!s.hud || typeof s.hud.visible !== 'boolean' || !finite(s.hud.survivalSeconds) || !finite(s.hud.kills)) return `${label}.hud schema incomplete`;
  if (!s.hud.feedback || !finite(s.hud.feedback.eatRevision) || !finite(s.hud.feedback.boostRevision) || !finite(s.hud.feedback.collisionRevision) || !finite(s.hud.feedback.deathRevision)) return `${label}.hud.feedback schema incomplete`;
  if (!s.world || !s.world.entityCounts || !Array.isArray(s.world.visibleFood) || !Array.isArray(s.world.visibleTadpoles) || !Array.isArray(s.world.visibleObstacles)) return `${label}.world schema incomplete`;
  for (const key of ['foodVisible', 'aiVisible', 'smallerTadpolesVisible', 'largerThreatsVisible', 'softObstaclesVisible', 'hardObstaclesVisible']) {
    if (!finite(s.world.entityCounts[key]) || s.world.entityCounts[key] < 0) return `${label}.world.entityCounts.${key} invalid`;
  }
  if (!finite(s.world.worldMotionRevision) || !finite(s.world.aiInteractionRevision)) return `${label}.world revisions invalid`;
  if (!s.helperDisplay || !['leaderboard', 'minimap', 'blank'].includes(s.helperDisplay.mode)) return `${label}.helperDisplay schema incomplete`;
  if (s.phase === 'playing' && (s.overlayBlocking || !s.canInteractWithPlayfield || s.result !== 'none')) return `${label}.playing invariant invalid`;
  if ((s.phase === 'paused' || s.phase === 'levelComplete') && s.canInteractWithPlayfield) return `${label}.blocked phase remains interactable`;
  if (s.player.arenaX < -0.02 || s.player.arenaX > 1.02 || s.player.arenaY < -0.02 || s.player.arenaY > 1.02) return `${label}.player outside normalized arena`;
  return null;
}

function anyRevisionChanged(before, after, names) {
  return names.some(name => approxChanged(before[name], after[name], 0));
}

function targetOf(s, kind) {
  if (!s || !s.world) return null;
  if (kind === 'food' || kind === 'movingFood') {
    const player = p(s);
    const candidates = (s.world.visibleFood || []).filter(t =>
      t && (kind !== 'movingFood' || t.moving) &&
      t.reachable !== false && t.targetId &&
      finite(t.screenX) && finite(t.screenY)
    );
    return candidates.reduce((nearest, target) => {
      if (!nearest) return target;
      const targetDistance = Math.hypot(target.screenX - player.screenX, target.screenY - player.screenY);
      const nearestDistance = Math.hypot(nearest.screenX - player.screenX, nearest.screenY - player.screenY);
      return targetDistance < nearestDistance ? target : nearest;
    }, null);
  }
  if (kind === 'smallerTadpole') {
    const px = p(s).screenX;
    const py = p(s).screenY;
    return (s.world.visibleTadpoles || [])
      .filter(t => t && t.relationToPlayer === 'smaller' && !t.protected && t.targetId && finite(t.screenX) && finite(t.screenY))
      .sort((a, b) =>
        Math.hypot(a.screenX - px, a.screenY - py) -
        Math.hypot(b.screenX - px, b.screenY - py)
      )[0] || null;
  }
  if (kind === 'largerThreat') {
    const px = p(s).screenX;
    const py = p(s).screenY;
    return (s.world.visibleTadpoles || [])
      .filter(t => t && t.relationToPlayer === 'larger' && t.targetId && finite(t.screenX) && finite(t.screenY))
      .sort((a, b) =>
        Math.hypot(a.screenX - px, a.screenY - py) -
        Math.hypot(b.screenX - px, b.screenY - py)
      )[0] || null;
  }
  if (kind === 'softObstacle') return (s.world.visibleObstacles || []).find(t => t && t.kind === 'soft' && t.reachable !== false && t.targetId);
  if (kind === 'hardObstacle') return (s.world.visibleObstacles || []).find(t => t && t.kind === 'hard' && t.reachable !== false && t.targetId);
  if (kind === 'boundary') return (s.world.visibleObstacles || []).find(t => t && t.kind === 'boundary' && t.targetId);
  return null;
}

async function swimToObstacleTarget(game, targetKind, targetId) {
  const aliases = targetKind === 'softObstacle'
    ? ['softObstacle', 'soft_obstacle']
    : ['hardObstacle', 'hard_obstacle'];
  let after = null;
  for (const kind of aliases) {
    after = await game.input({
      type: 'swimToVisibleTarget',
      targetKind: kind,
      targetId,
      durationMs: 1200
    });
    const action = last(after);
    if (action.ok !== false || (action.reason !== 'target_missing' && action.reason !== 'unknown_action')) return after;
  }
  return after;
}

function nearestTargetOf(s, kind) {
  if (!s || !s.world) return null;
  let targets = [];
  if (kind === 'food') {
    targets = (s.world.visibleFood || []).filter(t => t && t.reachable !== false && t.targetId);
  } else if (kind === 'smallerTadpole') {
    targets = (s.world.visibleTadpoles || []).filter(t => t && t.relationToPlayer === 'smaller' && !t.protected && t.targetId);
  }
  const px = p(s).screenX;
  const py = p(s).screenY;
  return targets
    .filter(t => finite(t.screenX) && finite(t.screenY))
    .sort((a, b) => Math.hypot(a.screenX - px, a.screenY - py) - Math.hypot(b.screenX - px, b.screenY - py))[0] || null;
}

async function swimToTargetAction(game, targetKind, targetId, durationMs) {
  const targetKinds = targetKind === 'smallerTadpole' ? ['smallerTadpole', 'smaller_tadpole'] : [targetKind];
  let result = null;
  for (const kind of targetKinds) {
    result = await game.input({ type: 'swimToVisibleTarget', targetKind: kind, targetId, durationMs });
    const action = last(result);
    if (action.ok !== false || !['unknown_action', 'target_missing'].includes(action.reason)) return result;
  }
  return result;
}

async function pursueSmallerTarget(game, initial, maxPursuitMs = 6000) {
  let after = initial;
  let target = nearestTargetOf(after, 'smallerTadpole');
  let targetKindIndex = 0;
  let elapsedMs = 0;
  const targetKinds = ['smallerTadpole', 'smaller_tadpole'];
  while (after.phase === 'playing' &&
      hud(after).kills <= hud(initial).kills &&
      elapsedMs < maxPursuitMs) {
    if (!target) break;
    const durationMs = Math.min(300, maxPursuitMs - elapsedMs);
    after = await game.input({
      type: 'swimToVisibleTarget',
      targetKind: targetKinds[targetKindIndex],
      targetId: target.targetId,
      durationMs
    });
    const action = last(after);
    elapsedMs += durationMs;
    if (action.ok === false && ['unknown_action', 'target_missing'].includes(action.reason)) {
      if (targetKindIndex === 0) {
        targetKindIndex = 1;
        continue;
      }
      target = nearestTargetOf(after, 'smallerTadpole');
      continue;
    }
    target = nearestTargetOf(after, 'smallerTadpole');
  }
  return after;
}

async function swimToThreatTarget(game, targetId, durationMs) {
  const targetKinds = ['threat', 'larger_threat', 'largerThreat'];
  let result = null;
  for (const targetKind of targetKinds) {
    result = await game.input({ type: 'swimToVisibleTarget', targetKind, targetId, durationMs });
    const action = last(result);
    if (action.ok !== false || !['unknown_action', 'target_missing'].includes(action.reason)) return result;
  }
  return result;
}

async function pursueLargerThreat(game, initial, maxPursuitMs = 8000) {
  let after = initial;
  let target = targetOf(after, 'largerThreat');
  let elapsedMs = 0;
  while (after.phase === 'playing' &&
      feedback(after).deathRevision <= feedback(initial).deathRevision &&
      elapsedMs < maxPursuitMs) {
    if (!target) break;
    const durationMs = Math.min(600, maxPursuitMs - elapsedMs);
    after = await swimToThreatTarget(game, target.targetId, durationMs);
    elapsedMs += durationMs;
    target = targetOf(after, 'largerThreat');
  }
  return after;
}

function createGameDriver(browser) {
  async function evalAsync(expr) {
    return browser.eval(`(async function(){${expr}})()`);
  }

  return {
    async snapshot() {
      return evalAsync(`
        if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') return { __l2_err__: 'missing getSnapshot' };
        return await window.__gameTest.getSnapshot();
      `);
    },
    async reset(options) {
      return evalAsync(`
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return { __l2_err__: 'missing reset' };
        return await window.__gameTest.reset(${JSON.stringify(options || null)});
      `);
    },
    async input(action) {
      return evalAsync(`
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { __l2_err__: 'missing input' };
        return await window.__gameTest.input(${JSON.stringify(action)});
      `);
    },
    async loadScenario(name, options) {
      return evalAsync(`
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { __l2_err__: 'missing loadScenario' };
        return await window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || null)});
      `);
    },
    async startEndlessViaContract() {
      let s = await this.reset({ mode: 'endless' });
      if (!s || s.phase !== 'playing') s = await this.input({ type: 'pressControl', control: 'startEndless' });
      await browser.sleep(120);
      return this.snapshot();
    },
    async visibleControlCenter(words) {
      return browser.eval(`(function(){
        const words = ${JSON.stringify(words)}.map(w => String(w).toLowerCase());
        const nodes = Array.from(document.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"],[data-game-control],[data-ctl],[class~="btn"]'));
        function visible(el) {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0;
        }
        for (const el of nodes) {
          if (!visible(el)) continue;
          const text = [el.textContent, el.value, el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-game-control')]
            .filter(Boolean).join(' ').toLowerCase();
          if (words.some(w => text.includes(w))) {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, text };
          }
        }
        return null;
      })()`);
    },
    async playfieldPoint(offsetX, offsetY) {
      const s = await this.snapshot();
      const x = finite(p(s).screenX) ? p(s).screenX : 640;
      const y = finite(p(s).screenY) ? p(s).screenY : 400;
      return { x: x + offsetX, y: y + offsetY };
    },
    async realKeyHold(key, ms) {
      await browser.keyDown(key);
      await browser.sleep(ms);
      await browser.keyUp(key);
      await browser.sleep(100);
      return this.snapshot();
    },
    async realMouseMoveTo(x, y, ms) {
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers: 0 });
      await browser.sleep(ms);
      return this.snapshot();
    },
    async canvasHash() {
      return browser.canvasPixelHash();
    },
    async touchAnchor() {
      return browser.eval(`(() => {
        const visible = (el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width >= 64 && rect.height >= 64 &&
            rect.right > 0 && rect.bottom > 0 &&
            rect.left < innerWidth && rect.top < innerHeight;
        };
        const explicit = Array.from(document.querySelectorAll('#stick,[id*="joystick" i],[id*="stick" i],[class*="joystick" i]'))
          .find(visible);
        if (explicit) {
          const rect = explicit.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          return { x, y, leftX: Math.max(8, x - 120), rightX: Math.min(innerWidth - 8, x + 120) };
        }
        const candidates = Array.from(document.querySelectorAll('body *'))
          .filter(visible)
          .map((el) => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const label = [el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-game-control')]
              .filter(Boolean).join(' ').toLowerCase();
            const ratio = Math.min(rect.width, rect.height) / Math.max(rect.width, rect.height);
            const round = style.borderRadius.split(' ').some((part) => parseFloat(part) >= 35);
            const smallCanvas = el.tagName === 'CANVAS' &&
              rect.width <= 220 && rect.height <= 220 && ratio >= 0.85;
            return {
              rect,
              score: (/(joystick|stick)/.test(label) ? 1000 : 0) +
                (round || smallCanvas ? 100 : 0) + Math.min(rect.width, rect.height),
              pointerEvents: style.pointerEvents
            };
          })
          .filter((entry) => {
            const { rect } = entry;
            const ratio = Math.min(rect.width, rect.height) / Math.max(rect.width, rect.height);
            return ratio >= 0.85 && rect.width <= 220 && rect.height <= 220 &&
              rect.top + rect.height / 2 > innerHeight * 0.5 &&
              (entry.score >= 1000 || entry.pointerEvents !== 'none');
          })
          .sort((a, b) => b.score - a.score);
        const selected = candidates[0];
        if (selected) {
          const x = selected.rect.left + selected.rect.width / 2;
          const y = selected.rect.top + selected.rect.height / 2;
          return { x, y, leftX: Math.max(8, x - 120), rightX: Math.min(innerWidth - 8, x + 120) };
        }
        const canvas = Array.from(document.querySelectorAll('canvas'))
          .filter(visible)
          .sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height -
            a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const x = rect.left + rect.width * 0.25;
        const y = rect.top + rect.height * 0.75;
        return { x, y, leftX: Math.max(rect.left + 8, x - 120), rightX: Math.min(rect.right - 8, x + 120) };
      })()`);
    },
    async touchDrag(x1, y1, x2, y2, ms) {
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: x1, y: y1, radiusX: 4, radiusY: 4, force: 1, id: 1 }]
      });
      await browser.sleep(40);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x2, y: y2, radiusX: 4, radiusY: 4, force: 1, id: 1 }]
      });
      await browser.sleep(ms);
      const active = await this.snapshot();
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await browser.sleep(120);
      return { active, released: await this.snapshot() };
    }
  };
}

async function requireScenario(game, name, predicate, label) {
  const s = await game.loadScenario(name);
  if (!s || s.__l2_err__) throw new Error(`${name} not loadable: ${s && s.__l2_err__}`);
  const err = strictSnapshotError(s, `${name} precondition`);
  if (err) throw new Error(err);
  if (!predicate(s)) throw new Error(`${name} illegal precondition: ${label}`);
  return s;
}

async function ensurePlaying(game) {
  const s = await game.startEndlessViaContract();
  const err = strictSnapshotError(s, 'playing snapshot');
  if (err) return { ok: false, detail: err, snapshot: s };
  if (s.phase !== 'playing' || s.mode !== 'endless' || s.overlayBlocking || !s.canInteractWithPlayfield) {
    return { ok: false, detail: 'endless play did not become interactive', snapshot: s };
  }
  return { ok: true, snapshot: s };
}

function movementEvidence(before, after, axis) {
  const delta = axis === 'x' ? p(after).screenX - p(before).screenX : p(after).screenY - p(before).screenY;
  return {
    delta,
    moved: Math.abs(delta) > 1,
    renderChanged: approxChanged(render(before).playfieldRevision, render(after).playfieldRevision, 0),
    speedActive: p(after).speed > 0 || p(after).speedBand === 'normal' || p(after).speedBand === 'boost'
  };
}

const suite = [
  {
    id: 'p0-boot-contract',
    level: 'P0',
    name: 'boot exposes stable Tadpol.io public contract',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.snapshot();
      if (!s || s.__l2_err__) return FAIL('window.__gameTest.getSnapshot missing or failed');
      const err = strictSnapshotError(s, 'initial snapshot');
      if (err) return FAIL(err);
      return PASS(`phase=${s.phase}, mode=${s.mode}`);
    }
  },
  {
    id: 'p0-reset-start-contract',
    level: 'P0',
    name: 'reset and endless start produce coherent state shell',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const menu = await game.reset();
      const errMenu = strictSnapshotError(menu, 'reset snapshot');
      if (errMenu) return FAIL(errMenu);
      if (menu.phase !== 'menu' || menu.activePanel !== 'menu' || !menu.overlayBlocking) return FAIL('plain reset must return menu with blocking entry panel');
      const playing = await game.startEndlessViaContract();
      const errPlay = strictSnapshotError(playing, 'endless snapshot');
      if (errPlay) return FAIL(errPlay);
      if (playing.phase !== 'playing' || playing.mode !== 'endless' || playing.overlayBlocking || !playing.canInteractWithPlayfield) return FAIL('endless start did not create interactive play');
      if (!render(playing).playfieldVisible || !render(playing).playfieldNonBlank || !render(playing).playerVisible) return FAIL('playing render summary not visible/nonblank/player-visible');
      return PASS('menu reset and endless start contract are coherent');
    }
  },
  {
    id: 'p0-playfield-ecosystem-ready',
    level: 'P0',
    name: 'endless play exposes visible ecosystem summaries',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const started = await ensurePlaying(game);
      if (!started.ok) return FAIL(started.detail);
      const s = started.snapshot;
      if (!hud(s).visible) return FAIL('HUD not visible in play');
      if (counts(s).foodVisible < 1 || counts(s).aiVisible < 1) return FAIL('food and AI counts must be present for core loop');
      if (!world(s).arenaBoundsVisible) return FAIL('arena bounds not observable');
      if ((counts(s).softObstaclesVisible + counts(s).hardObstaclesVisible) < 1) return FAIL('obstacle summaries missing');
      return PASS(`food=${counts(s).foodVisible}, ai=${counts(s).aiVisible}`);
    }
  },
  {
    id: 'p1-click-start-visible-flow',
    level: 'P1',
    name: 'click start closes menu and enables visible playfield',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      await browser.sleep(500);
      const center = await game.visibleControlCenter(['io mode', 'endless', 'start', 'play']);
      if (!center) return FAIL('no visible start/endless control found');
      await browser.mouseClick(center.x, center.y);
      await browser.sleep(500);
      const s = await game.snapshot();
      const err = strictSnapshotError(s, 'after click start');
      if (err) return FAIL(err);
      if (s.phase !== 'playing' || s.mode !== 'endless' || s.overlayBlocking || !s.canInteractWithPlayfield) return FAIL('real click did not reach unblocked endless play');
      if (!render(s).playfieldVisible || !render(s).playfieldNonBlank || !hud(s).visible) return FAIL('visible playfield/HUD evidence missing after click start');
      return PASS('real click start produced interactive endless run');
    }
  },
  {
    id: 'p1-pause-freeze-resume',
    level: 'P1',
    name: 'pause freezes world and resume restores interaction',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const base = await ensurePlaying(game);
      if (!base.ok) return FAIL(base.detail);
      await browser.sleep(250);
      const before = await game.snapshot();
      const paused = await game.input({ type: 'pressControl', control: 'pause' });
      if (paused.phase !== 'paused' || !paused.overlayBlocking || paused.canInteractWithPlayfield) return FAIL('pause did not block playfield');
      const frozenBefore = await game.snapshot();
      await game.input({ type: 'holdDirection', direction: 'right', durationMs: 500 });
      await game.input({ type: 'wait', durationMs: 600 });
      const frozenAfter = await game.snapshot();
      const moved = Math.hypot(p(frozenAfter).screenX - p(frozenBefore).screenX, p(frozenAfter).screenY - p(frozenBefore).screenY);
      const worldAdvanced = approxChanged(world(frozenBefore).worldMotionRevision, world(frozenAfter).worldMotionRevision, 0);
      const timeAdvanced = (hud(frozenAfter).survivalSeconds - hud(frozenBefore).survivalSeconds) > 0.2;
      if (moved > 1 || worldAdvanced || timeAdvanced) return FAIL('paused state allowed movement/world/time advancement');
      const resumed = await game.input({ type: 'pressControl', control: 'resume' });
      if (resumed.phase !== 'playing' || resumed.overlayBlocking || !resumed.canInteractWithPlayfield) return FAIL('resume did not restore interaction');
      await game.input({ type: 'holdDirection', direction: 'right', durationMs: 350 });
      const afterMove = await game.snapshot();
      if (!approxChanged(p(resumed).screenX, p(afterMove).screenX, 1) && !approxChanged(hud(resumed).survivalSeconds, hud(afterMove).survivalSeconds, 0.1)) return FAIL('world did not resume after pause');
      if (digestRun(before) === digestRun(frozenAfter)) {
        return PASS('pause freeze and resume verified without hidden run mutation');
      }
      return PASS('pause blocked play and resume restored motion/time');
    }
  },
  {
    id: 'p1-restart-clears-transient-run',
    level: 'P1',
    name: 'return menu and restart clear transient run state',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await requireScenario(game, 'near_food', s => s.phase === 'playing' && targetOf(s, 'food'), 'food target must exist');
      const preEat = await game.snapshot();
      const food = targetOf(preEat, 'food');
      await game.input({ type: 'swimToVisibleTarget', targetKind: 'food', targetId: food.targetId, durationMs: 900 });
      await game.input({ type: 'holdBoost', durationMs: 250 });
      const dirty = await game.snapshot();
      await game.input({ type: 'pressControl', control: 'pause' });
      const paused = await game.snapshot();
      if (paused.phase !== 'paused' || paused.activePanel !== 'pause' || !paused.overlayBlocking || paused.canInteractWithPlayfield) return FAIL('pause did not expose blocking pause menu');
      await game.input({ type: 'pressControl', control: 'returnMenu' });
      const menu = await game.snapshot();
      if (menu.phase !== 'menu' || menu.activePanel !== 'menu' || !menu.overlayBlocking || menu.canInteractWithPlayfield) return FAIL('returnMenu did not return to blocking menu');
      if (menu.result !== 'none' || p(menu).boosting) return FAIL('transient state leaked into menu');
      if (finite(hud(menu).kills) && hud(menu).kills !== 0) return FAIL('kills not cleared on return to menu');
      if (finite(hud(menu).survivalSeconds) && hud(menu).survivalSeconds > 0.1) return FAIL('survival time not cleared on return to menu');
      if (finite(p(menu).size) && finite(p(preEat).size) && p(menu).size > Math.max(1, p(preEat).size * 1.1)) return FAIL('grown size leaked into menu');
      await game.input({ type: 'pressControl', control: 'startEndless' });
      await browser.sleep(120);
      const fresh = await game.snapshot();
      const t = transientDigest(fresh);
      if (fresh.phase !== 'playing' || fresh.activePanel !== 'none' || fresh.overlayBlocking || !fresh.canInteractWithPlayfield) return FAIL('fresh start after return menu not playable');
      if (t.boosting || fresh.result !== 'none') return FAIL('boost/result leaked into new run');
      if (p(fresh).protected !== true) return FAIL('fresh run did not restore spawn protection');
      if (finite(hud(dirty).kills) && hud(fresh).kills > 0) return FAIL('kills leaked into new run');
      if (finite(hud(dirty).survivalSeconds) && hud(fresh).survivalSeconds > Math.max(2, hud(dirty).survivalSeconds * 0.75)) return FAIL('survival time did not reset');
      if (p(fresh).size > Math.max(p(preEat).size * 1.5, p(dirty).size * 0.9)) return FAIL('grown size leaked into fresh run');
      return PASS('fresh run cleared transient state and overlays');
    }
  },
  {
    id: 'p1-keyboard-direction-opposite',
    level: 'P1',
    name: 'keyboard left and right directions are visible opposites',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'endless_start', s => s.phase === 'playing' && s.canInteractWithPlayfield, 'playing lane required');
      await browser.sleep(120);
      const right = await (async () => {
        await browser.keyDown('ArrowRight');
        await browser.sleep(650);
        const held = await game.snapshot();
        await browser.keyUp('ArrowRight');
        await browser.sleep(120);
        const released = await game.snapshot();
        return { held, released };
      })();
      await browser.sleep(220);
      const settled = await game.snapshot();
      const left = await (async () => {
        await browser.keyDown('ArrowLeft');
        await browser.sleep(650);
        const held = await game.snapshot();
        await browser.keyUp('ArrowLeft');
        await browser.sleep(120);
        const released = await game.snapshot();
        return { held, released };
      })();
      const r = movementEvidence(start, right.held, 'x');
      const l = movementEvidence(settled, left.held, 'x');
      if (!r.moved || !r.speedActive || !r.renderChanged) return FAIL('right key did not produce movement/speed/render evidence');
      if (!l.moved || !l.speedActive) return FAIL('left key did not produce movement/speed evidence');
      if (!(Math.sign(r.delta) > 0 && Math.sign(l.delta) < 0 && Math.sign(r.delta) === -Math.sign(l.delta))) return FAIL(`direction opposite failed for left/right: right=${r.delta}, left=${l.delta}`);
      const releaseDrift = Math.abs(p(settled).screenX - p(right.released).screenX);
      if (p(settled).speedBand === 'boost' || releaseDrift > Math.max(Math.abs(r.delta) * 0.8, 80)) return FAIL('release did not settle active propulsion');
      return PASS(`direction opposite verified with Math.sign: right=${r.delta.toFixed(2)}, left=${l.delta.toFixed(2)}`);
    }
  },
  {
    id: 'p1-vertical-direction-opposite',
    level: 'P1',
    name: 'keyboard up and down directions are visible opposites',
    timeoutMs: 17000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'endless_start', s => s.phase === 'playing' && s.canInteractWithPlayfield, 'playing lane required');
      await browser.sleep(120);
      const up = await (async () => {
        await browser.keyDown('ArrowUp');
        await browser.sleep(600);
        const held = await game.snapshot();
        await browser.keyUp('ArrowUp');
        await browser.sleep(120);
        const settled = await game.snapshot();
        return { held, settled };
      })();
      await browser.sleep(220);
      const mid = await game.snapshot();
      const down = await (async () => {
        await browser.keyDown('ArrowDown');
        await browser.sleep(600);
        const held = await game.snapshot();
        await browser.keyUp('ArrowDown');
        await browser.sleep(120);
        const settled = await game.snapshot();
        return { held, settled };
      })();
      const u = movementEvidence(start, up.held, 'y');
      const d = movementEvidence(mid, down.held, 'y');
      if (!u.moved || !u.speedActive || !u.renderChanged) return FAIL(`up key did not produce movement/speed/render evidence: up=${u.delta}`);
      if (!d.moved || !d.speedActive) return FAIL(`down key did not produce movement/speed evidence: down=${d.delta}`);
      if (!(Math.sign(u.delta) < 0 && Math.sign(d.delta) > 0 && Math.sign(u.delta) === -Math.sign(d.delta))) return FAIL(`direction opposite failed for up/down: up=${u.delta}, down=${d.delta}`);
      if (!render(up.held).playerVisible || !render(down.held).playerVisible) return FAIL('player not visible during vertical movement');
      if (p(up.held).facing !== 'up' || p(down.held).facing !== 'down') return FAIL(`facing trend failed for up/down: up=${p(up.held).facing}, down=${p(down.held).facing}`);
      if (!u.renderChanged && !d.renderChanged) return FAIL('vertical input did not change visible playfield revision');
      const upReleaseDrift = Math.abs(p(up.settled).screenY - p(up.held).screenY);
      const downReleaseDrift = Math.abs(p(down.settled).screenY - p(down.held).screenY);
      if (p(up.settled).speedBand === 'boost' || p(down.settled).speedBand === 'boost' ||
          upReleaseDrift > Math.max(Math.abs(u.delta) * 0.8, 80) ||
          downReleaseDrift > Math.max(Math.abs(d.delta) * 0.8, 80)) return FAIL('release did not settle active propulsion');
      return PASS(`vertical direction opposite verified with Math.sign: up=${u.delta.toFixed(2)}, down=${d.delta.toFixed(2)}`);
    }
  },
  {
    id: 'p1-pointer-targeting-override',
    level: 'P1',
    name: 'pointer targeting moves toward target and keyboard overrides drift',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await requireScenario(game, 'endless_start', s => s.phase === 'playing' && s.canInteractWithPlayfield, 'playing lane required');
      await browser.sleep(120);
      const start = await game.snapshot();
      const settledError = strictSnapshotError(start, 'endless_start settled');
      if (settledError || start.phase !== 'playing' || !start.canInteractWithPlayfield) return FAIL(settledError || 'playing lane did not settle');
      const target = { x: p(start).screenX + 160, y: p(start).screenY + 80 };
      const beforeDist = Math.hypot(target.x - p(start).screenX, target.y - p(start).screenY);
      const viewportTarget = await browser.eval(`
        (function() {
          const point = ${JSON.stringify(target)};
          const canvases = Array.from(document.querySelectorAll('canvas')).map(canvas => {
            const rect = canvas.getBoundingClientRect();
            const style = getComputedStyle(canvas);
            return { canvas, rect, visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.02 && rect.width > 40 && rect.height > 40 };
          }).filter(item => item.visible).sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height);
          const item = canvases[0];
          if (!item) return null;
          const dpr = window.devicePixelRatio || 1;
          const logicalWidth = item.canvas.width / dpr;
          const logicalHeight = item.canvas.height / dpr;
          if (!(logicalWidth > 0 && logicalHeight > 0)) return null;
          return {
            mapped: {
              x: item.rect.left + point.x * item.rect.width / logicalWidth,
              y: item.rect.top + point.y * item.rect.height / logicalHeight
            },
            raw: { x: point.x, y: point.y }
          };
        })()
      `);
      if (!viewportTarget || !viewportTarget.mapped ||
          !finite(viewportTarget.mapped.x) || !finite(viewportTarget.mapped.y) ||
          !finite(viewportTarget.raw.x) || !finite(viewportTarget.raw.y)) return FAIL('visible playfield canvas geometry unavailable');
      const pointerPoints = [viewportTarget.mapped, viewportTarget.raw];
      let afterPointer = null;
      for (const point of pointerPoints) {
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, modifiers: 0 });
        await browser.sleep(500);
        const candidate = await game.snapshot();
        if (!afterPointer ||
            Math.hypot(target.x - p(candidate).screenX, target.y - p(candidate).screenY) <
            Math.hypot(target.x - p(afterPointer).screenX, target.y - p(afterPointer).screenY)) {
          afterPointer = candidate;
        }
        if (Math.hypot(target.x - p(candidate).screenX, target.y - p(candidate).screenY) < beforeDist - 4) break;
      }
      const afterDist = Math.hypot(target.x - p(afterPointer).screenX, target.y - p(afterPointer).screenY);
      if (!(afterDist < beforeDist - 4)) return FAIL('pointer target did not reduce target distance');
      const pointerDeltaX = p(afterPointer).screenX - p(start).screenX;
      await browser.keyDown('ArrowLeft');
      await browser.sleep(550);
      await browser.keyUp('ArrowLeft');
      const afterKey = await game.snapshot();
      const keyDeltaX = p(afterKey).screenX - p(afterPointer).screenX;
      if (!(Math.sign(keyDeltaX) < 0)) return FAIL('keyboard override did not force left screen trend');
      if (Math.sign(pointerDeltaX) > 0 && Math.sign(keyDeltaX) >= 0) return FAIL('keyboard did not override previous pointer drift');
      return PASS('pointer target approach and keyboard override verified');
    }
  },
  {
    id: 'p1-boost-cost-benefit-release',
    level: 'P1',
    name: 'boost gives speed benefit, visible feedback, size cost, and release cleanup',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'boost_ready', s => s.phase === 'playing' && p(s).size > 0 && !p(s).boosting, 'positive size and no active boost required');
      await game.input({ type: 'holdDirection', direction: 'right', durationMs: 500 });
      const normal = await game.snapshot();
      const boosted = await game.input({ type: 'holdBoost', durationMs: 700 });
      const released = await game.input({ type: 'releaseBoost' });
      await browser.sleep(180);
      const settled = await game.snapshot();
      const normalDx = Math.abs(p(normal).screenX - p(start).screenX);
      const boostDx = Math.abs(p(boosted).screenX - p(normal).screenX);
      const speedBenefit = p(boosted).speedBand === 'boost' || p(boosted).speed > p(normal).speed || boostDx > normalDx * 0.9;
      if (!speedBenefit) return FAIL('boost did not increase speed band/speed/displacement trend');
      if (!(p(boosted).size < p(normal).size)) return FAIL('boost did not consume size');
      if (!p(boosted).boosting || !approxChanged(feedback(normal).boostRevision, feedback(boosted).boostRevision, 0)) return FAIL('boost feedback/boosting state did not change');
      if (p(settled).boosting || p(settled).speedBand === 'boost') return FAIL('release did not stop boost state');
      if (p(settled).size < p(released).size - 0.5) return FAIL('size cost continued after release');
      return PASS('boost benefit/cost/feedback/release chain verified');
    }
  },
  {
    id: 'p1-boost-invalid-rejection',
    level: 'P1',
    name: 'invalid boost has no free benefit or hidden mutation',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'endless_start', s => s.phase === 'playing', 'playing state required');
      await game.input({ type: 'releaseDirection' });
      const noDirBefore = await game.snapshot();
      const noDir = await game.input({ type: 'holdBoost', durationMs: 400 });
      if (p(noDir).speedBand === 'boost' || p(noDir).boosting) return FAIL('no-direction boost became active');
      if (p(noDir).size < p(noDirBefore).size - 0.1) return FAIL('no-direction boost drained size');
      if (feedback(noDir).boostRevision > feedback(noDirBefore).boostRevision && last(noDir).ok !== false) return FAIL('no-direction boost feedback advanced without rejection');
      await game.input({ type: 'pressControl', control: 'pause' });
      const pausedBefore = await game.snapshot();
      const pausedBoost = await game.input({ type: 'holdBoost', durationMs: 300 });
      if (p(pausedBoost).boosting || p(pausedBoost).size < p(pausedBefore).size - 0.1 || pausedBoost.canInteractWithPlayfield) return FAIL('paused boost mutated play state');
      const reasonOk = last(noDir).ok === false || last(pausedBoost).ok === false || digestRun(pausedBefore) === digestRun(pausedBoost);
      if (!reasonOk) return FAIL('invalid boost lacked rejection envelope or invariant evidence');
      return PASS('invalid boost rejected or left state unchanged');
    }
  },
  {
    id: 'p1-boost-reverse-direction',
    level: 'P1',
    name: 'boost follows reversed movement direction',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'boost_ready', s => s.phase === 'playing' && s.mode === 'endless' && !p(s).boosting, 'boost-ready state required');
      await game.input({ type: 'holdDirection', direction: 'right', durationMs: 300 });
      const rightBoost = await game.input({ type: 'holdBoost', durationMs: 500 });
      const reversed = await game.input({ type: 'holdDirection', direction: 'left', durationMs: 650 });
      const dx1 = p(rightBoost).screenX - p(start).screenX;
      const dx2 = p(reversed).screenX - p(rightBoost).screenX;
      if (!(Math.sign(dx1) > 0 && Math.sign(dx2) < 0 && Math.sign(dx1) === -Math.sign(dx2))) return FAIL(`boost direction opposite failed: first=${dx1}, reversed=${dx2}`);
      if (!render(reversed).playerVisible || p(reversed).arenaX < 0 || p(reversed).arenaX > 1) return FAIL('reverse boost left player invisible or outside arena');
      if (p(rightBoost).size <= p(reversed).size && !p(reversed).boosting && p(reversed).speedBand !== 'boost') return FAIL('reverse phase was not movement-coupled with boost/cost');
      return PASS('boost reversed screen trend with Math.sign direction opposite');
    }
  },
  {
    id: 'p1-food-contact-growth',
    level: 'P1',
    name: 'food contact grows player and updates visible feedback',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'near_food', s => s.phase === 'playing' && targetOf(s, 'food'), 'reachable visible food required');
      const food = targetOf(start, 'food');
      const after = await game.input({ type: 'swimToVisibleTarget', targetKind: 'food', targetId: food.targetId, durationMs: 1800 });
      if (!(p(after).size > p(start).size || p(after).sizeBand !== p(start).sizeBand)) return FAIL('player did not grow after food contact');
      const countChanged = counts(after).foodVisible !== counts(start).foodVisible;
      const eatChanged = approxChanged(feedback(start).eatRevision, feedback(after).eatRevision, 0);
      const renderChanged = approxChanged(render(start).playfieldRevision, render(after).playfieldRevision, 0);
      const targetGone = !(world(after).visibleFood || []).some(target => target && target.targetId === food.targetId);
      const collectionObserved = targetGone || countChanged || eatChanged;
      const feedbackObserved = eatChanged || renderChanged;
      const hudSize = hud(after).sizeShown;
      const hudSynced = finite(hudSize) && Math.abs(hudSize - p(after).size) <= 1;
      if (!collectionObserved || !feedbackObserved || !hudSynced) return FAIL('food contact lacked collection/feedback/HUD evidence');
      return PASS('food contact growth, feedback, and HUD/render sync verified');
    }
  },
  {
    id: 'p1-food-invalid-target-invariant',
    level: 'P1',
    name: 'food is not credited without contact or valid target',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'near_food', s => s.phase === 'playing' && targetOf(s, 'food'), 'reachable visible food required');
      const food = targetOf(start, 'food');
      const dx = food.screenX - p(start).screenX;
      const dy = food.screenY - p(start).screenY;
      const awayDirection = Math.abs(dx) >= Math.abs(dy)
        ? (dx >= 0 ? 'left' : 'right')
        : (dy >= 0 ? 'up' : 'down');
      await game.input({ type: 'holdDirection', direction: awayDirection, durationMs: 250 });
      const away = await game.input({ type: 'wait', durationMs: 350 });
      if (p(away).size > p(start).size + 0.5 && feedback(away).eatRevision > feedback(start).eatRevision) return FAIL('food credited without intentional contact');
      const invalidBefore = await game.snapshot();
      const invalid = await game.input({ type: 'swimToVisibleTarget', targetKind: 'food', targetId: 'missing-visible-food-target', durationMs: 500 });
      if (p(invalid).size !== p(invalidBefore).size || hud(invalid).kills !== hud(invalidBefore).kills || feedback(invalid).eatRevision !== feedback(invalidBefore).eatRevision) return FAIL('invalid food target mutated gameplay state');
      if (!(last(invalid).ok === false || digestRun(invalid) === digestRun(invalidBefore))) return FAIL('invalid food target did not expose rejection or invariant');
      return PASS('non-contact and invalid food target preserved invariants');
    }
  },
  {
    id: 'p1-smaller-tadpole-eat',
    level: 'P1',
    name: 'eating a smaller tadpole gives growth and kill progress only',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'near_smaller_tadpole', s => s.phase === 'playing' && targetOf(s, 'smallerTadpole'), 'reachable smaller tadpole required');
      const after = await pursueSmallerTarget(game, start, 8000);
      if (!(hud(after).kills > hud(start).kills)) return FAIL('kill count did not increase after smaller tadpole contact');
      if (!(p(after).size > p(start).size)) return FAIL('player size did not increase after eating smaller tadpole');
      if (after.result === 'death' || p(after).alive === false) return FAIL('same contact both rewarded and killed the player');
      if (!approxChanged(world(start).aiInteractionRevision, world(after).aiInteractionRevision, 0) && counts(after).smallerTadpolesVisible === counts(start).smallerTadpolesVisible) return FAIL('AI interaction/target evidence did not change');
      return PASS('predator reward path verified without death overlap');
    }
  },
  {
    id: 'p1-larger-threat-death-respawn',
    level: 'P1',
    name: 'larger threat contact causes death feedback and protected respawn',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'near_larger_threat', s => s.phase === 'playing' && targetOf(s, 'largerThreat') && !p(s).protected, 'unprotected larger threat required');
      const after = await pursueLargerThreat(game, start);
      const deathEvidence = after.result === 'death' || after.phase === 'deathFeedback' || feedback(after).deathRevision > feedback(start).deathRevision;
      if (!deathEvidence) return FAIL('larger threat contact produced no death feedback/result');
      let respawn = after;
      for (let elapsed = 0; elapsed < 7000 &&
          (!p(respawn).alive || !p(respawn).protected ||
           !['tiny', 'small'].includes(p(respawn).sizeBand)); elapsed += 250) {
        await game.input({ type: 'wait', durationMs: 250 });
        await browser.sleep(200);
        respawn = await game.snapshot();
      }
      if (!p(respawn).alive) return FAIL('player did not respawn alive');
      if (!p(respawn).protected) return FAIL('respawn protection missing');
      if (!['tiny', 'small'].includes(p(respawn).sizeBand)) return FAIL('respawn did not return to small playable size');
      if (hud(respawn).kills > hud(start).kills) return FAIL('kills were not reset or were incorrectly awarded by death');
      return PASS('death feedback and protected respawn verified');
    }
  },
  {
    id: 'p1-respawn-protection-invariant',
    level: 'P1',
    name: 'spawn protection prevents immediate repeat death',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'endless_start', s => s.phase === 'playing' && p(s).protected, 'protected fresh start required');
      const beforeDeath = feedback(start).deathRevision;
      const threat = targetOf(start, 'largerThreat');
      let after;
      if (threat) {
        after = await swimToThreatTarget(game, threat.targetId, 700);
      } else {
        after = await game.input({ type: 'wait', durationMs: 700 });
      }
      if (!p(after).alive || after.result === 'death') return FAIL('protected player died immediately');
      if (feedback(after).deathRevision > beforeDeath) return FAIL('death feedback double-counted during protection');
      if (!after.canInteractWithPlayfield) return FAIL('protected start became non-interactive');
      return PASS('respawn/start protection prevented immediate death');
    }
  },
  {
    id: 'p1-ai-world-motion-pressure',
    level: 'P1',
    name: 'AI ecosystem visibly moves and changes pressure',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'ai_activity', s => s.phase === 'playing' && counts(s).aiVisible >= 2, 'multiple AI required');
      const observations = [start];
      let after = start;
      const positions = snapshot => (world(snapshot).visibleTadpoles || [])
        .filter(t => finite(t.screenX) && finite(t.screenY))
        .map(t => ({ x: t.screenX, y: t.screenY }))
        .sort((a, b) => a.x - b.x || a.y - b.y);
      const motionBetween = (before, next) => {
        const previous = positions(before);
        const current = positions(next);
        if (!previous.length || !current.length) return false;
        const pairCount = Math.min(previous.length, current.length);
        if (previous.slice(0, pairCount).some((point, index) =>
          Math.hypot(current[index].x - point.x, current[index].y - point.y) > 1
        )) return true;
        const center = points => {
          const sum = points.reduce((acc, point) => ({
            x: acc.x + point.x,
            y: acc.y + point.y
          }), { x: 0, y: 0 });
          return { x: sum.x / points.length, y: sum.y / points.length };
        };
        const beforeCenter = center(previous);
        const afterCenter = center(current);
        return Math.hypot(afterCenter.x - beforeCenter.x, afterCenter.y - beforeCenter.y) > 1 ||
          previous.length !== current.length;
      };
      const pressureBetween = (before, next) =>
        world(next).aiInteractionRevision > world(before).aiInteractionRevision ||
        hud(next).rank !== hud(before).rank ||
        motionBetween(before, next);
      for (let i = 0; i < 5; i++) {
        after = await game.input({ type: 'wait', durationMs: 1000 });
        observations.push(after);
        if (pressureBetween(observations[observations.length - 2], after)) break;
      }
      const motionRevision = observations.slice(1).some((snapshot, index) =>
        world(snapshot).worldMotionRevision > world(observations[index]).worldMotionRevision
      );
      const visibleMotion = observations.slice(1).some((snapshot, index) =>
        motionBetween(observations[index], snapshot)
      );
      const pressureEvidence = observations.slice(1).some((snapshot, index) =>
        pressureBetween(observations[index], snapshot)
      );
      if (!motionRevision || !visibleMotion) return FAIL('AI world motion was not visible beyond static counts');
      if (!pressureEvidence) return FAIL('AI did not expose interaction, rank, or visible motion pressure');
      if (p(after).arenaX < 0 || p(after).arenaX > 1 || p(after).arenaY < 0 || p(after).arenaY > 1) return FAIL('world motion pushed player outside arena');
      return PASS('AI motion and pressure revisions verified');
    }
  },
  {
    id: 'p1-boundary-blocks-passthrough',
    level: 'P1',
    name: 'arena boundary blocks pass-through movement',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'near_boundary', s => s.phase === 'playing' && world(s).arenaBoundsVisible, 'near visible boundary required');
      const boundaryCandidates = (world(start).visibleObstacles || [])
        .filter(t => t && t.kind === 'boundary' && finite(t.screenX) && finite(t.screenY));
      const boundary = boundaryCandidates.reduce((nearest, candidate) => {
        if (!nearest) return candidate;
        const candidateDistance = Math.hypot(candidate.screenX - p(start).screenX, candidate.screenY - p(start).screenY);
        const nearestDistance = Math.hypot(nearest.screenX - p(start).screenX, nearest.screenY - p(start).screenY);
        return candidateDistance < nearestDistance ? candidate : nearest;
      }, null);
      const direction = boundary && finite(boundary.screenX) && finite(boundary.screenY)
        ? (Math.abs(boundary.screenX - p(start).screenX) > Math.abs(boundary.screenY - p(start).screenY)
          ? (boundary.screenX < p(start).screenX ? 'left' : 'right')
          : (boundary.screenY < p(start).screenY ? 'up' : 'down'))
        : (p(start).arenaX < 0.5 ? 'left' : 'right');
      const after = await game.input({ type: 'holdDirection', direction, durationMs: 1500 });
      if (p(after).arenaX < -0.001 || p(after).arenaX > 1.001 || p(after).arenaY < -0.001 || p(after).arenaY > 1.001) return FAIL('player passed outside normalized arena');
      const collision = feedback(after).collisionRevision > feedback(start).collisionRevision || render(after).playfieldRevision > render(start).playfieldRevision;
      if (!collision) return FAIL('boundary contact lacked collision/render feedback');
      const farther = await game.input({ type: 'holdDirection', direction, durationMs: 900 });
      if (p(farther).arenaX < -0.001 || p(farther).arenaX > 1.001 || p(farther).arenaY < -0.001 || p(farther).arenaY > 1.001) return FAIL('continued boundary input crossed arena');
      return PASS('boundary constrained movement and preserved arena invariant');
    }
  },
  {
    id: 'p1-soft-hard-obstacle-collision',
    level: 'P1',
    name: 'soft and hard obstacles affect route instead of acting as decoration',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const softStart = await requireScenario(game, 'near_soft_obstacle', s => s.phase === 'playing' && targetOf(s, 'softObstacle'), 'soft obstacle required');
      const soft = targetOf(softStart, 'softObstacle');
      const softAfter = await swimToObstacleTarget(game, 'softObstacle', soft.targetId);
      const softCollision = feedback(softAfter).collisionRevision > feedback(softStart).collisionRevision || render(softAfter).playfieldRevision > render(softStart).playfieldRevision;
      const softObstacleAfter = targetOf(softAfter, 'softObstacle');
      const softMoved = softObstacleAfter && softObstacleAfter.targetId === soft.targetId && Math.hypot(softObstacleAfter.screenX - soft.screenX, softObstacleAfter.screenY - soft.screenY) > 1;
      if (!softCollision || (!softMoved && p(softAfter).alive === false)) return FAIL('soft obstacle lacked push/route/collision evidence');
      const hardStart = await requireScenario(game, 'near_hard_obstacle', s => s.phase === 'playing' && targetOf(s, 'hardObstacle'), 'hard obstacle required');
      const hard = targetOf(hardStart, 'hardObstacle');
      const hardBeforeDist = Math.hypot(hard.screenX - p(hardStart).screenX, hard.screenY - p(hardStart).screenY);
      const hardAfter = await swimToObstacleTarget(game, 'hardObstacle', hard.targetId);
      const hardAfterTarget = targetOf(hardAfter, 'hardObstacle') || hard;
      const hardAfterDist = Math.hypot(hardAfterTarget.screenX - p(hardAfter).screenX, hardAfterTarget.screenY - p(hardAfter).screenY);
      const hardCollision = feedback(hardAfter).collisionRevision > feedback(hardStart).collisionRevision || render(hardAfter).playfieldRevision > render(hardStart).playfieldRevision;
      if (!hardCollision || hardAfterDist < Math.max(1, hardBeforeDist * 0.1) && p(hardAfter).arenaX >= 0 && p(hardAfter).arenaX <= 1) return FAIL('hard obstacle did not block/bounce route with feedback');
      if (!p(softAfter).alive || !p(hardAfter).alive) return FAIL('obstacle collision incorrectly killed player');
      return PASS('soft and hard obstacle collision evidence verified');
    }
  },
  {
    id: 'p1-hud-sync-after-actions',
    level: 'P1',
    name: 'HUD progress remains synchronized after wait, eat, and prey actions',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await ensurePlaying(game);
      if (!start.ok) return FAIL(start.detail);
      const beforeWait = start.snapshot;
      const afterWait = await game.input({ type: 'wait', durationMs: 1500 });
      if (!(hud(afterWait).survivalSeconds > hud(beforeWait).survivalSeconds)) return FAIL('survival HUD did not increase while playing');
      const foodStart = await requireScenario(game, 'near_food', s => nearestTargetOf(s, 'food'), 'food required');
      const food = nearestTargetOf(foodStart, 'food');
      const foodAfter = await swimToTargetAction(game, 'food', food.targetId, 3000);
      if (hud(foodAfter).sizeShown !== null && finite(hud(foodAfter).sizeShown) && hud(foodAfter).sizeShown < p(foodStart).size) return FAIL('HUD size moved opposite to food growth');
      if (!(feedback(foodAfter).eatRevision > feedback(foodStart).eatRevision)) return FAIL('HUD/feedback eat revision did not change after food');
      const preyStart = await requireScenario(game, 'near_smaller_tadpole', s => nearestTargetOf(s, 'smallerTadpole'), 'prey required');
      const preyAfter = await pursueSmallerTarget(game, preyStart, 12000);
      if (!(hud(preyAfter).kills > hud(preyStart).kills)) return FAIL('kills HUD did not update after prey');
      if (hud(preyAfter).rank !== null && hud(preyAfter).totalRanked !== null && hud(preyAfter).rank > hud(preyAfter).totalRanked) return FAIL('rank HUD invariant invalid');
      return PASS('HUD survival, size/eat feedback, kills, and rank invariants verified');
    }
  },
  {
    id: 'p1-invalid-action-rejection',
    level: 'P1',
    name: 'invalid phase and malformed actions are rejected without mutation',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const menuBefore = await game.snapshot();
      const menuMove = await game.input({ type: 'holdDirection', direction: 'right', durationMs: 400 });
      if (digestRun(menuBefore) !== digestRun(menuMove) && last(menuMove).ok !== false) return FAIL('menu movement mutated state without rejection');
      const started = await ensurePlaying(game);
      if (!started.ok) return FAIL(started.detail);
      const beforeBad = await game.snapshot();
      const bad = await game.input({ type: 'unknownActionForContract' });
      if (digestRun(beforeBad) !== digestRun(bad) && last(bad).ok !== false) return FAIL('unknown action mutated state without rejection');
      const badTarget = await game.input({ type: 'swimToVisibleTarget', targetKind: 'tadpole', targetId: 'missing-target', durationMs: 100 });
      if ((p(badTarget).size !== p(bad).size || hud(badTarget).kills !== hud(bad).kills || badTarget.result !== bad.result) && last(badTarget).ok !== false) return FAIL('invalid target mutated reward/death state');
      return PASS('invalid actions expose rejection or preserve gameplay digest');
    }
  },
  {
    id: 'p2-helper-display-settings-invariant',
    level: 'P2',
    name: 'helper display modes switch without mutating core run state',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const started = await ensurePlaying(game);
      if (!started.ok) return FAIL(started.detail);
      const before = await game.snapshot();
      const modes = ['leaderboard', 'minimap', 'blank'];
      for (const mode of modes) {
        const s = await game.input({ type: 'setHelperDisplay', mode });
        if (last(s).ok === false && last(s).reason === 'unsupported_optional_feature') return PASS('helper display optional feature explicitly unsupported');
        if (helper(s).mode !== mode) return FAIL(`helper mode did not switch to ${mode}`);
        if (mode === 'leaderboard' && !helper(s).leaderboardVisible) return FAIL('leaderboard helper not visible');
        if (mode === 'minimap' && !helper(s).minimapVisible) return FAIL('minimap helper not visible');
        if (mode === 'blank' && !helper(s).blankVisible) return FAIL('blank helper state not visible');
        if (p(s).size !== p(before).size || hud(s).kills !== hud(before).kills || s.result !== before.result) return FAIL('helper display changed core run state');
      }
      return PASS('helper display modes and invariants verified');
    }
  },
  {
    id: 'p2-growth-level-selection-and-lock',
    level: 'P2',
    name: 'growth level select accepts unlocked and rejects locked levels',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const select = await game.loadScenario('level_select');
      if (last(select).ok === false && last(select).reason === 'unsupported_optional_feature') return PASS('growth mode optional feature explicitly unsupported');
      const err = strictSnapshotError(select, 'level select');
      if (err) return FAIL(err);
      if (select.phase !== 'levelSelect' || !level(select) || !Array.isArray(level(select).unlocked)) return FAIL('level_select scenario did not expose level summary');
      const unlocked = level(select).unlocked[0];
      if (!finite(unlocked)) return FAIL('no unlocked level available');
      const entered = await game.input({ type: 'selectLevel', levelIndex: unlocked });
      if (entered.mode !== 'growth' || entered.phase !== 'playing' || !level(entered) || level(entered).objectiveType === 'none') return FAIL('unlocked level did not enter growth play with objective');
      await game.loadScenario('level_select');
      const latest = await game.snapshot();
      const available = level(latest).availableCount;
      const lockedIndex = finite(available) ? Array.from({ length: available }, (_, i) => i).find(i => !(level(latest).unlocked || []).includes(i)) : null;
      if (lockedIndex === undefined || lockedIndex === null) return PASS('unlocked level entry verified; no locked level exposed');
      const beforeLocked = await game.snapshot();
      const locked = await game.input({ type: 'selectLevel', levelIndex: lockedIndex });
      if (locked.mode === 'growth' && locked.phase === 'playing') return FAIL('locked level entered playable state');
      if (!(last(locked).ok === false || locked.phase === beforeLocked.phase)) return FAIL('locked level lacked rejection or unchanged state');
      return PASS('growth unlocked entry and locked rejection verified');
    }
  },
  {
    id: 'p2-environment-pressure-optional-contract',
    level: 'P2',
    name: 'environment pressure is visible when supported',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadScenario('environment_pressure_pending');
      if (last(start).ok === false && last(start).reason === 'unsupported_optional_feature') return PASS('environment pressure optional feature explicitly unsupported');
      const err = strictSnapshotError(start, 'environment pressure precondition');
      if (err) return FAIL(err);
      let after = start;
      let eventChanged = false;
      let pressureVisible = false;
      let gameplayPressure = false;
      for (let elapsedMs = 0; elapsedMs < 15000; elapsedMs += 1000) {
        after = await game.input({ type: 'wait', durationMs: 1000 });
        eventChanged = JSON.stringify(events(start)) !== JSON.stringify(events(after));
        pressureVisible = events(after).pressureVisible || events(after).fogActive || events(after).giantPredatorActive || events(after).season !== events(start).season;
        const scarcityChanged = events(after).foodScarcityBand !== events(start).foodScarcityBand;
        gameplayPressure = counts(after).foodVisible !== counts(start).foodVisible || p(after).speedBand !== p(start).speedBand || scarcityChanged;
        if (eventChanged && pressureVisible && gameplayPressure) break;
      }
      if (!eventChanged && !pressureVisible) return FAIL('environment pressure produced no public event visibility');
      if (!gameplayPressure) return FAIL('environment pressure not tied to render, food scarcity, speed, or threat pressure');
      if (after.result === 'death' && feedback(after).deathRevision === feedback(start).deathRevision) return FAIL('environment caused silent death without feedback');
      return PASS('environment pressure visibility and gameplay coupling verified');
    }
  },
  {
    id: 'p2-atmosphere-does-not-replace-core',
    level: 'P2',
    name: 'optional atmosphere exists only alongside core systems',
    timeoutMs: 17000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await requireScenario(game, 'endless_start', s => s.phase === 'playing', 'endless start required');
      const after = await game.input({ type: 'wait', durationMs: 1500 });
      const optionalActivity = render(after).playfieldRevision > render(start).playfieldRevision || world(after).worldMotionRevision > world(start).worldMotionRevision;
      if (!optionalActivity) return FAIL('no render/world activity visible during longer run');
      if (counts(after).foodVisible < 1 || counts(after).aiVisible < 1 || !hud(after).visible || !world(after).arenaBoundsVisible) return FAIL('optional activity replaced or broke P1 food/AI/HUD/bounds');
      if (!render(after).playfieldNonBlank || !render(after).playerVisible) return FAIL('atmosphere left primary playfield unreadable');
      return PASS('optional activity coexists with P1 core observability');
    }
  },
  {
    id: 'p2-touch-joystick-direction-opposite',
    level: 'P2',
    name: 'touch joystick drags produce opposite visible directions',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await browser.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      const start = await requireScenario(game, 'endless_start', s => s.phase === 'playing' && s.canInteractWithPlayfield, 'playing state required');
      const anchor = await game.touchAnchor();
      if (!anchor) return FAIL('touch joystick/playfield geometry unavailable');
      const right = await game.touchDrag(anchor.x, anchor.y, anchor.rightX, anchor.y, 650);
      await game.input({ type: 'releaseJoystick' });
      await browser.sleep(200);
      const mid = await game.snapshot();
      const left = await game.touchDrag(anchor.x, anchor.y, anchor.leftX, anchor.y, 650);
      const dxRight = p(right.active).screenX - p(start).screenX;
      const dxLeft = p(left.active).screenX - p(mid).screenX;
      if (!(Math.sign(dxRight) > 0 && Math.sign(dxLeft) < 0 && Math.sign(dxRight) === -Math.sign(dxLeft))) return FAIL(`touch direction opposite failed: right=${dxRight}, left=${dxLeft}`);
      if (p(left.released).speedBand === 'boost' || !render(left.released).playerVisible) return FAIL('touch release/visibility invariant failed');
      return PASS('touch direction opposite verified while active and after release');
    }
  }
];

module.exports = { suite };
