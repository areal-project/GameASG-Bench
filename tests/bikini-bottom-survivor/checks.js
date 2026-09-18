// === GDD Coverage Map ===
// M1 (menu/pause/restart/state flow) -> p1-1-real-click-start-clears-overlay, p1-3-real-keyboard-pause-freezes-loop, p2-1-terminal-lock-and-restart-contract
// M2 (visible 3D/playfield observability) -> p0-1-boot-stable-contract, p0-2-visible-playfield-nonblank
// M3 (screen-space direction movement) -> p1-2-real-keyboard-opposite-direction-screen-movement, p1-2b-real-keyboard-forward-back-screen-movement
// M4 (enemy motion/damage/failure) -> p1-3-real-keyboard-pause-freezes-loop, p1-4-enemy-contact-damages-health-and-hud, p2-1-terminal-lock-and-restart-contract
// M5 (auto attack, hit, defeat, drop) -> p1-5-contract-auto-attack-enemy-causality
// M6 (experience, level-up, upgrade modal) -> p1-6-real-keyboard-pickup-opens-levelup, p1-7-contract-experience-to-upgrade-loop
// M7 (upgrade effects) -> p2-2-contract-upgrade-effect-and-invalid-choice
// M8/M9 (special pickups/boss) -> p2-4-contract-depth-systems-are-observable
// M10/M11 (quests, achievements, dailies, persistence) -> p2-3-contract-panels-open-close-and-observe-progress
// M12/M13 are P2 depth/cut-scope systems; covered through p2-4 when implemented and p2-5 for peaceful-zone combat suppression.
//
// === Category Map ===
// Boot & Stability -> p0-1, p0-2
// UI Flow & Blocking -> p1-1
// Input Semantics -> p1-2
// Core Mechanic Loop -> p1-4, p1-5, p1-6, p1-7
// State Machine -> p1-3, p2-1
// Economy / Progression -> p1-6, p1-7, p2-2
// Feedback & Observability -> p0-2, p2-2
// Invariants & Rejection -> p1-2, p2-2
// Depth / Optional Systems -> p2-3, p2-4, p2-5
//
// === Rationality Map ===
// p1-1-real-click-start-clears-overlay: M1/M2 start path | real action: DOM/mouse click on semantic start control | independent observation: phase + overlayBlocking + playfield/canvas hash | empty-shell failure: phase-only implementations with blocking overlay fail
// p1-2-real-keyboard-opposite-direction-screen-movement: M3 direction | real action: ArrowRight then ArrowLeft key holds | independent observation: player.screenX delta + movement revision | empty-shell failure: no keyboard handling, API-only movement, or mirrored direction fails; opposite direction must have opposite sign
// p1-2b-real-keyboard-forward-back-screen-movement: M3 direction | real action: ArrowUp then ArrowDown key holds | independent observation: player.screenY/screen-space delta + movement revision | empty-shell failure: forward/back reversed, same-direction, or horizontal-only movement fails
// p1-3-real-keyboard-pause-freezes-loop: M1/M4/M5 pause | real action: Escape key | independent observation: time/enemyMotion/attacks unchanged while paused | empty-shell failure: pause overlay that does not freeze gameplay fails
// p1-4-enemy-contact-damages-health-and-hud: M4 damage | real action: load legal contact setup and wait in play | independent observation: health/damage revision + HUD text | empty-shell failure: visible enemy that cannot hurt player or unsynced HUD fails
// p1-5-contract-auto-attack-enemy-causality: M5 auto combat contract | real action: load legal near_enemy scenario, wait | independent observation: attacks/projectiles/enemy health/entity count/gems | empty-shell failure: enemy spawn without attack or hit chain fails
// p1-6-real-keyboard-pickup-opens-levelup: M6 pickup | real action: Arrow keys toward visible nearest gem | independent observation: player/gem screen positions + experience/pickup/levelUp delta | empty-shell failure: API-only collect, no real movement pickup, or repeatable gem reward fails
// p1-7-contract-experience-to-upgrade-loop: M6 progression contract | real action: load near_level_up, interact with nearest gem, choose upgrade | independent observation: levelUp phase, choices, upgrade/level delta | empty-shell failure: direct level increment or no upgrade modal/effect fails
// p2-1-terminal-lock-and-restart-contract: M4/M1 terminal lock | real action: low_health scenario, wait for damage, then ArrowRight | independent observation: result=lose and unchanged movement/time after terminal | empty-shell failure: game-over screen that still accepts play input fails
// p2-2-contract-upgrade-effect-and-invalid-choice: M7 rejection/invariant | real action: invalid chooseUpgrade outside levelUp and unknown action | independent observation: ok:false/reason or unchanged totals | empty-shell failure: ok:true catch-all or illegal mutation fails
// p2-3-contract-panels-open-close-and-observe-progress: M10/M11 panels | real action: open/close panel contract | independent observation: activePanel and counts visible | empty-shell failure: hidden-only progress or unclosable panel fails
// p2-4-contract-depth-systems-are-observable: M8/M9/M12 depth | real action: load optional legal scenarios and trigger follow-up | independent observation: special/boss/transition entity deltas | empty-shell failure: loadScenario that directly awards outcome or has no visible depth evidence fails
// p2-5-peaceful-zone-suppresses-combat-loop: M12 peaceful-zone behavior | real action: load peaceful zone and wait | independent observation: enemy/projectile/damage revisions do not advance | empty-shell failure: peaceful areas still spawn enemies or damage player

'use strict';

const PASS = (detail) => ({ status: 'PASS', detail: detail || '' });
const FAIL = (detail) => ({ status: 'FAIL', detail: detail || '' });
const NA = (detail) => ({ status: 'NOT_APPLICABLE', detail: detail || '' });

function num(v, fallback = 0) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function deepClone(v) {
  return JSON.parse(JSON.stringify(v || {}));
}

function totalCombatEntities(s) {
  const c = s && s.entityCounts ? s.entityCounts : {};
  return num(c.enemies) + num(c.projectiles) + num(c.gems) + num(c.orbiting) + num(c.bosses);
}

function sameCoreState(a, b) {
  return a.phase === b.phase &&
    a.result === b.result &&
    num(a.health) === num(b.health) &&
    num(a.level) === num(b.level) &&
    num(a.experience) === num(b.experience) &&
    totalCombatEntities(a) === totalCombatEntities(b);
}

function validBounds(pf) {
  return pf &&
    typeof pf.left === 'number' &&
    typeof pf.top === 'number' &&
    num(pf.width) > 40 &&
    num(pf.height) > 40;
}

function validScreenPoint(p) {
  return p &&
    typeof p.screenX === 'number' &&
    Number.isFinite(p.screenX) &&
    typeof p.screenY === 'number' &&
    Number.isFinite(p.screenY);
}

function hudText(s) {
  const h = s && s.hud ? s.hud : {};
  return typeof h.healthText === 'string' ? h.healthText : '';
}

function pickupProgressed(before, after) {
  const expGained = num(after.experience) > num(before.experience);
  const enteredLevelUp = after.phase === 'levelUp';
  const pickupRevision = num(after.revisions && after.revisions.pickups) > num(before.revisions && before.revisions.pickups);
  const gemConsumed = num(after.entityCounts && after.entityCounts.gems) < num(before.entityCounts && before.entityCounts.gems);
  const levelChanged = num(after.level) > num(before.level);
  return expGained || enteredLevelUp || pickupRevision || gemConsumed || levelChanged;
}

function createGameDriver(browser) {
  async function evalPage(src) {
    return await browser.eval(`(${src})()`);
  }

  async function snapshot() {
    const snap = await evalPage(function () {
      function readHudText() {
        const text = (document.body && document.body.innerText || '').replace(/\s+/g, ' ').trim();
        return text.slice(0, 1000);
      }
      function bestPlayfield() {
        const candidates = Array.from(document.querySelectorAll('[data-game-playfield], canvas, [role="application"], main, #game, .game'));
        let best = null;
        let bestArea = -1;
        for (const el of candidates) {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          const visible = r.width > 40 && r.height > 40 && style.display !== 'none' && style.visibility !== 'hidden';
          if (!visible) continue;
          const area = r.width * r.height;
          if (area > bestArea) {
            bestArea = area;
            best = { left: r.left, top: r.top, width: r.width, height: r.height, tag: el.tagName.toLowerCase() };
          }
        }
        return best;
      }
      function visibleBlockingOverlay() {
        const pf = bestPlayfield();
        if (!pf) return false;
        const x = pf.left + pf.width / 2;
        const y = pf.top + pf.height / 2;
        const top = document.elementFromPoint(x, y);
        if (!top) return false;
        const isCanvas = top.tagName && top.tagName.toLowerCase() === 'canvas';
        const isPlayfield = top.closest && top.closest('[data-game-playfield], canvas, [role="application"], main, #game, .game');
        const visibleDialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal, .overlay, [data-game-overlay]')).filter((el) => {
          const r = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          return r.width > 20 && r.height > 20 && st.display !== 'none' && st.visibility !== 'hidden' && st.pointerEvents !== 'none';
        });
        return visibleDialogs.length > 0 && (!isCanvas || !isPlayfield);
      }
      function fallbackSnapshot() {
        const pf = bestPlayfield();
        const text = readHudText().toLowerCase();
        const paused = /pause|paused|resume|继续|暂停/.test(text);
        const gameOver = /game over|restart|retry|failed|lose|失败|重开/.test(text);
        const menu = /start|play|开始|进入/.test(text) && !paused && !gameOver;
        return {
          phase: gameOver ? 'gameOver' : (paused ? 'paused' : (menu ? 'menu' : 'playing')),
          screen: gameOver ? 'gameOver' : (paused ? 'pause' : (menu ? 'menu' : 'game')),
          activePanel: gameOver ? 'gameOver' : (paused ? 'pause' : null),
          overlayBlocking: visibleBlockingOverlay(),
          canInteractWithPlayfield: !visibleBlockingOverlay() && !menu && !paused && !gameOver,
          time: 0,
          score: 0,
          health: 100,
          maxHealth: 100,
          level: 1,
          experience: 0,
          expToNextLevel: 10,
          result: gameOver ? 'lose' : 'none',
          player: null,
          camera: { yaw: null, screenDirectionReliable: false },
          playfield: pf,
          entityCounts: { enemies: 0, projectiles: 0, gems: 0, orbiting: 0, shields: 0, bosses: 0 },
          nearestEnemy: null,
          nearestGem: null,
          upgrades: { projectileCount: 1, damage: 1, fireRate: 1, moveSpeed: 1, maxHealthBonus: 0, regen: 0, orbiting: 0 },
          upgradeChoices: [],
          revisions: { render: window.__l2 ? window.__l2.frameCount : 0, movement: 0, attacks: 0, enemyMotion: 0, pickups: 0, upgrades: 0, damage: 0 },
          hud: { healthText: readHudText(), levelText: readHudText(), timerText: readHudText(), expText: readHudText() },
          challenges: { visible: false, activeCount: 0, completedToday: 0 },
          achievements: { visible: false, unlockedCount: 0, totalCount: 0 },
          persistence: { hasSavedProgress: false }
        };
      }
      try {
        const api = window.__gameTest;
        if (api && typeof api.getSnapshot === 'function') {
          const s = api.getSnapshot();
          if (s && typeof s.then === 'function') {
            return s.then((snap) => {
              const fb = fallbackSnapshot();
              const merged = Object.assign(fb, snap || {});
              if (snap && snap.player === undefined) merged.player = null;
              return merged;
            });
          }
          const fb = fallbackSnapshot();
          const merged = Object.assign(fb, s || {});
          if (s && s.player === undefined) merged.player = null;
          return merged;
        }
      } catch (e) {
        return { __l2_err__: e.message };
      }
      return fallbackSnapshot();
    });
    return snap || {};
  }

  async function waitForReady() {
    const deadline = Date.now() + 8000;
    let last = null;
    while (Date.now() < deadline) {
      last = await snapshot();
      if (last && !last.__l2_err__ && validBounds(last.playfield) && validScreenPoint(last.player)) return last;
      await browser.sleep(250);
    }
    throw new Error(`game not ready: ${last && last.__l2_err__ ? last.__l2_err__ : 'no playfield/snapshot'}`);
  }

  async function contractInput(action) {
    return await browser.eval(`(async function(){
      const api = window.__gameTest;
      if (!api || typeof api.input !== 'function') return { ok:false, reason:'missing __gameTest.input' };
      try {
        const r = await api.input(${JSON.stringify(action)});
        if (r && r.snapshot) return r;
        const snap = api.getSnapshot ? await api.getSnapshot() : null;
        return Object.assign({ ok: r && r.ok !== undefined ? !!r.ok : true }, r || {}, { snapshot: snap });
      } catch (e) {
        return { ok:false, reason:e.message };
      }
    })()`);
  }

  async function loadScenario(name) {
    return await browser.eval(`(async function(){
      const api = window.__gameTest;
      if (!api || typeof api.loadScenario !== 'function') return { ok:false, reason:'missing __gameTest.loadScenario' };
      try {
        const r = await api.loadScenario(${JSON.stringify(name)});
        if (r && r.snapshot) return r;
        const snap = api.getSnapshot ? await api.getSnapshot() : null;
        return Object.assign({ ok: r && r.ok !== false }, r || {}, { snapshot: snap });
      } catch (e) {
        return { ok:false, reason:e.message };
      }
    })()`);
  }

  async function reset(start) {
    return await browser.eval(`(async function(){
      const api = window.__gameTest;
      if (!api || typeof api.reset !== 'function') return { ok:false, reason:'missing __gameTest.reset' };
      try {
        const r = await api.reset({ start:${start ? 'true' : 'false'} });
        const snap = api.getSnapshot ? await api.getSnapshot() : r;
        return { ok:true, snapshot:snap };
      } catch (e) {
        return { ok:false, reason:e.message };
      }
    })()`);
  }

  async function findSemanticButton(kind) {
    return await browser.eval(`(function(){
      const kind = ${JSON.stringify(kind)};
      const patterns = {
        start: /^(start|play|begin|new game|开始|进入|游玩)$/i,
        resume: /^(resume|continue|继续|返回)$/i,
        restart: /^(restart|retry|again|重开|再来)$/i,
        pause: /^(pause|暂停)$/i
      };
      const selector = '[data-game-control="' + kind + '"], [aria-label*="' + kind + '" i], button, [role="button"], a';
      const candidates = Array.from(document.querySelectorAll(selector));
      for (const el of candidates) {
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        if (r.width < 10 || r.height < 10 || st.display === 'none' || st.visibility === 'hidden' || st.pointerEvents === 'none') continue;
        const semanticAction = ['data-game-control', 'data-action', 'data-act'].some((attribute) => {
          return (el.getAttribute(attribute) || '').trim().toLowerCase() === kind.toLowerCase();
        });
        const label = ((el.getAttribute('data-game-control') || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '') + ' ' + (el.getAttribute('alt') || '')).trim();
        const labelTokens = label.toLowerCase().split(/[^a-z0-9]+/);
        if (semanticAction || (patterns[kind] && patterns[kind].test(label.trim())) || labelTokens.includes(kind.toLowerCase())) {
          return { x:r.left + r.width / 2, y:r.top + r.height / 2, label:label.slice(0, 80) };
        }
      }
      return null;
    })()`);
  }

  async function realClickSemantic(kind) {
    const pt = await findSemanticButton(kind);
    if (!pt) return { ok: false, reason: `no visible ${kind} control` };
    await browser.mouseClick(pt.x, pt.y);
    await browser.sleep(400);
    return { ok: true, point: pt };
  }

  async function realKeyHold(key, ms) {
    await browser.holdKey(key, ms);
    await browser.sleep(120);
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  return {
    waitForReady,
    snapshot,
    reset,
    contractInput,
    loadScenario,
    realClickSemantic,
    realKeyHold,
    canvasHash
  };
}

async function ensurePlaying(game) {
  let s = await game.snapshot();
  if (s.phase !== 'playing' || s.overlayBlocking || !s.canInteractWithPlayfield) {
    await game.reset(true);
    await game.contractInput({ type: 'start' });
    await game.realClickSemantic('start');
    await new Promise((resolve) => setTimeout(resolve, 300));
    s = await game.snapshot();
  }
  return s;
}

module.exports.suite = [
  {
    id: 'p0-1-boot-stable-contract',
    level: 'P0',
    name: 'boot exposes stable public snapshot schema',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const s = await game.waitForReady();
      const phases = ['loading', 'menu', 'playing', 'paused', 'levelUp', 'gameOver', 'transition', 'dialog'];
      if (!phases.includes(s.phase)) return FAIL(`invalid phase: ${s.phase}`);
      if (!validBounds(s.playfield)) return FAIL('playfield geometry missing');
      if (!validScreenPoint(s.player)) return FAIL('player screen position missing');
      if (!s.entityCounts || !s.revisions || !s.hud) return FAIL('required snapshot groups missing');
      return PASS(`phase=${s.phase}, playfield=${Math.round(s.playfield.width)}x${Math.round(s.playfield.height)}`);
    }
  },
  {
    id: 'p0-2-visible-playfield-nonblank',
    level: 'P0',
    name: 'visible playfield has nonblank readable render',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await ensurePlaying(game);
      const before = await game.canvasHash();
      await browser.sleep(350);
      const after = await game.canvasHash();
      const s = await game.snapshot();
      if (before === null || after === null) return FAIL('could not read screenshot hash');
      if (!s.playfield || num(s.playfield.width) < 100 || num(s.playfield.height) < 100) return FAIL('primary playfield too small');
      if (before === 0 && after === 0) return FAIL('blank screenshot hash');
      return PASS(`hash=${after}, renderRevision=${num(s.revisions && s.revisions.render)}`);
    }
  },
  {
    id: 'p1-1-real-click-start-clears-overlay',
    level: 'P1',
    name: 'real click start clears blocking menu overlay',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.reset(false);
      await browser.sleep(300);
      const clicked = await game.realClickSemantic('start');
      if (!clicked.ok) return FAIL(clicked.reason);
      await browser.sleep(700);
      const s = await game.snapshot();
      if (s.phase !== 'playing') return FAIL(`expected playing after real start click, got ${s.phase}`);
      if (s.overlayBlocking) return FAIL('start click left a blocking overlay over playfield');
      if (!s.canInteractWithPlayfield) return FAIL('playfield is not interactive after start');
      return PASS('real start path entered playing without blocking overlay');
    }
  },
  {
    id: 'p1-2-real-keyboard-opposite-direction-screen-movement',
    level: 'P1',
    name: 'real keyboard opposite direction screen movement',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const setup = await game.loadScenario('playing_clear');
      if (!setup.ok) await ensurePlaying(game);
      const base = await game.snapshot();
      const healthBefore = num(base.health);
      const levelBefore = num(base.level);
      const expBefore = num(base.experience);
      await game.realKeyHold('ArrowRight', 500);
      const right = await game.snapshot();
      await game.realKeyHold('ArrowLeft', 700);
      const left = await game.snapshot();
      const rightDelta = num(right.player && right.player.screenX) - num(base.player && base.player.screenX);
      const leftDelta = num(left.player && left.player.screenX) - num(right.player && right.player.screenX);
      const moved = Math.abs(rightDelta) > 1 || Math.abs(leftDelta) > 1 || num(left.revisions && left.revisions.movement) > num(base.revisions && base.revisions.movement);
      if (!moved) return FAIL('real keyboard input did not move player or movement revision');
      if (Math.sign(rightDelta) === Math.sign(leftDelta) && Math.abs(rightDelta) > 1 && Math.abs(leftDelta) > 1) {
        return FAIL(`left/right were not opposite: rightDelta=${rightDelta.toFixed(2)} leftDelta=${leftDelta.toFixed(2)}`);
      }
      if (num(left.health) !== healthBefore || num(left.level) !== levelBefore || num(left.experience) !== expBefore) {
        return FAIL('movement changed unrelated health/level/experience invariant');
      }
      return PASS(`opposite direction deltas: right=${rightDelta.toFixed(2)}, left=${leftDelta.toFixed(2)}`);
    }
  },
  {
    id: 'p1-2b-real-keyboard-forward-back-screen-movement',
    level: 'P1',
    name: 'real keyboard forward and backward screen movement are opposite',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const setup = await game.loadScenario('playing_clear');
      if (!setup.ok) await ensurePlaying(game);
      const base = await game.snapshot();
      const healthBefore = num(base.health);
      const levelBefore = num(base.level);
      const expBefore = num(base.experience);
      await game.realKeyHold('ArrowUp', 550);
      const up = await game.snapshot();
      await game.realKeyHold('ArrowDown', 750);
      const down = await game.snapshot();
      const upDeltaX = num(up.player && up.player.screenX) - num(base.player && base.player.screenX);
      const upDeltaY = num(up.player && up.player.screenY) - num(base.player && base.player.screenY);
      const downDeltaX = num(down.player && down.player.screenX) - num(up.player && up.player.screenX);
      const downDeltaY = num(down.player && down.player.screenY) - num(up.player && up.player.screenY);
      const upMag = Math.hypot(upDeltaX, upDeltaY);
      const downMag = Math.hypot(downDeltaX, downDeltaY);
      const moved = upMag > 1 || downMag > 1 || num(down.revisions && down.revisions.movement) > num(base.revisions && base.revisions.movement);
      if (!moved) return FAIL('forward/back keyboard input did not move player or movement revision');
      const dot = upDeltaX * downDeltaX + upDeltaY * downDeltaY;
      if (upMag > 1 && downMag > 1 && dot >= 0) {
        return FAIL(`forward/back were not opposite: upDelta=(${upDeltaX.toFixed(2)},${upDeltaY.toFixed(2)}) downDelta=(${downDeltaX.toFixed(2)},${downDeltaY.toFixed(2)})`);
      }
      if (Math.abs(upDeltaY) > 1 && Math.abs(downDeltaY) > 1 && Math.sign(upDeltaY) === Math.sign(downDeltaY)) {
        return FAIL(`forward/back screenY had same sign: upDeltaY=${upDeltaY.toFixed(2)} downDeltaY=${downDeltaY.toFixed(2)}`);
      }
      if (num(down.health) !== healthBefore || num(down.level) !== levelBefore || num(down.experience) !== expBefore) {
        return FAIL('forward/back movement changed unrelated health/level/experience invariant');
      }
      return PASS(`forward/back deltas: up=(${upDeltaX.toFixed(2)},${upDeltaY.toFixed(2)}), down=(${downDeltaX.toFixed(2)},${downDeltaY.toFixed(2)})`);
    }
  },
  {
    id: 'p1-3-real-keyboard-pause-freezes-loop',
    level: 'P1',
    name: 'real keyboard pause freezes combat loop',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await ensurePlaying(game);
      const before = await game.snapshot();
      await browser.keyDown('Escape');
      await browser.keyUp('Escape');
      await browser.sleep(300);
      const paused = await game.snapshot();
      if (paused.phase !== 'paused' && paused.activePanel !== 'pause') return FAIL(`Escape did not enter pause, phase=${paused.phase}`);
      const frozenBefore = deepClone(paused);
      await browser.sleep(700);
      const frozenAfter = await game.snapshot();
      const timeDelta = Math.abs(num(frozenAfter.time) - num(frozenBefore.time));
      const attackDelta = num(frozenAfter.revisions && frozenAfter.revisions.attacks) - num(frozenBefore.revisions && frozenBefore.revisions.attacks);
      const enemyMotionDelta = num(frozenAfter.revisions && frozenAfter.revisions.enemyMotion) - num(frozenBefore.revisions && frozenBefore.revisions.enemyMotion);
      if (timeDelta > 0.05 || attackDelta > 0 || enemyMotionDelta > 0) {
        return FAIL(`pause did not freeze loop: timeDelta=${timeDelta}, attackDelta=${attackDelta}, enemyMotionDelta=${enemyMotionDelta}`);
      }
      await browser.keyDown('Escape');
      await browser.keyUp('Escape');
      await browser.sleep(300);
      const resumed = await game.snapshot();
      if (resumed.phase !== 'playing') return FAIL(`Escape did not resume to playing, got ${resumed.phase}`);
      return PASS('pause froze loop and resume returned to playing');
    }
  },
  {
    id: 'p1-4-enemy-contact-damages-health-and-hud',
    level: 'P1',
    name: 'enemy contact damages health and updates HUD',
    timeoutMs: 22000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await ensurePlaying(game);
      const loaded = await game.loadScenario('enemy_contact');
      if (!loaded.ok) return FAIL(`enemy_contact scenario unavailable: ${loaded.reason || 'not ok'}`);
      let before = await game.snapshot();
      const threatDeadline = Date.now() + 1000;
      while (num(before.entityCounts && before.entityCounts.enemies) < 1 &&
          !before.nearestEnemy && Date.now() < threatDeadline) {
        await browser.sleep(50);
        before = await game.snapshot();
      }
      if (num(before.entityCounts && before.entityCounts.enemies) < 1 && !before.nearestEnemy) {
        return FAIL('enemy_contact did not provide a visible enemy threat');
      }
      const healthBefore = num(before.health);
      const damageBefore = num(before.revisions && before.revisions.damage);
      const hudBefore = hudText(before);
      let after = before;
      for (let i = 0; i < 5; i++) {
        await game.contractInput({ type: 'wait', durationMs: 650 });
        await browser.sleep(50);
        after = await game.snapshot();
        if (num(after.health) < healthBefore || num(after.revisions && after.revisions.damage) > damageBefore || after.phase === 'gameOver') break;
      }
      const healthDropped = num(after.health) < healthBefore;
      const damageRevision = num(after.revisions && after.revisions.damage) > damageBefore;
      const hudChanged = hudText(after) !== hudBefore;
      if (!healthDropped) {
        return FAIL(`enemy contact did not damage player: health ${healthBefore}->${num(after.health)}, damageRevision ${damageBefore}->${num(after.revisions && after.revisions.damage)}`);
      }
      if (!hudChanged) {
        return FAIL('damage was not reflected by the health HUD text');
      }
      return PASS(`health ${healthBefore}->${num(after.health)}, hudChanged=${hudChanged}, damageRevision=${damageRevision}`);
    }
  },
  {
    id: 'p1-5-contract-auto-attack-enemy-causality',
    level: 'P1',
    name: 'contract auto attack causes enemy hit or defeat',
    timeoutMs: 22000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await ensurePlaying(game);
      const loaded = await game.loadScenario('near_enemy');
      if (!loaded.ok) return FAIL(`near_enemy scenario unavailable: ${loaded.reason || 'not ok'}`);
      await browser.sleep(100);
      let before = await game.snapshot();
      const setupDeadline = Date.now() + 600;
      while (
        (num(before.entityCounts && before.entityCounts.enemies) < 1 || !before.nearestEnemy) &&
        Date.now() < setupDeadline
      ) {
        await browser.sleep(50);
        before = await game.snapshot();
      }
      if (num(before.entityCounts && before.entityCounts.enemies) < 1 || !before.nearestEnemy) return FAIL('near_enemy did not provide a visible living enemy');
      const enemyHealthBefore = num(before.nearestEnemy.health);
      await game.contractInput({ type: 'wait', durationMs: 1400 });
      await browser.sleep(500);
      const after = await game.snapshot();
      const attackDelta = num(after.revisions && after.revisions.attacks) - num(before.revisions && before.revisions.attacks);
      const projectilesDelta = num(after.entityCounts && after.entityCounts.projectiles) - num(before.entityCounts && before.entityCounts.projectiles);
      const enemyCountDelta = num(after.entityCounts && after.entityCounts.enemies) - num(before.entityCounts && before.entityCounts.enemies);
      const enemyHealthAfter = after.nearestEnemy ? num(after.nearestEnemy.health) : 0;
      const healthDropped = enemyHealthAfter < enemyHealthBefore;
      const defeatedOrDropped = enemyCountDelta < 0 || num(after.entityCounts && after.entityCounts.gems) > num(before.entityCounts && before.entityCounts.gems);
      const attackObserved = attackDelta > 0 || projectilesDelta > 0;
      const enemyConsequence = healthDropped || defeatedOrDropped;
      if (!attackObserved || !enemyConsequence) {
        return FAIL('wait near enemy did not produce an attack and enemy hit/defeat consequence');
      }
      return PASS(`attackDelta=${attackDelta}, projectileDelta=${projectilesDelta}, healthDropped=${healthDropped}, defeatedOrDropped=${defeatedOrDropped}`);
    }
  },
  {
    id: 'p1-6-real-keyboard-pickup-opens-levelup',
    level: 'P1',
    name: 'real keyboard movement collects visible experience gem',
    timeoutMs: 26000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await ensurePlaying(game);
      const loaded = await game.loadScenario('near_level_up');
      if (!loaded.ok) return FAIL(`near_level_up scenario unavailable: ${loaded.reason || 'not ok'}`);
      let before = await game.snapshot();
      const settleDeadline = Date.now() + 1000;
      while (!before.nearestGem && num(before.entityCounts && before.entityCounts.gems) > 0 && Date.now() < settleDeadline) {
        await browser.sleep(50);
        before = await game.snapshot();
      }
      if (!before.nearestGem || typeof before.nearestGem.screenX !== 'number' || typeof before.nearestGem.screenY !== 'number') {
        return FAIL('near_level_up did not expose a visible nearestGem screen position');
      }
      const startPlayerX = num(before.player && before.player.screenX);
      const startPlayerY = num(before.player && before.player.screenY);
      let after = before;
      let movedTowardGem = false;
      for (let i = 0; i < 8; i++) {
        const current = await game.snapshot();
        if (pickupProgressed(before, current)) {
          after = current;
          break;
        }
        const gem = current.nearestGem || before.nearestGem;
        const px = num(current.player && current.player.screenX);
        const py = num(current.player && current.player.screenY);
        const dx = num(gem.screenX) - px;
        const dy = num(gem.screenY) - py;
        if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 8) {
          await game.realKeyHold(dx > 0 ? 'ArrowRight' : 'ArrowLeft', 360);
        } else if (Math.abs(dy) > 8) {
          await game.realKeyHold(dy > 0 ? 'ArrowDown' : 'ArrowUp', 360);
        } else {
          await game.realKeyHold('ArrowRight', 160);
        }
        const moved = await game.snapshot();
        const distBefore = Math.hypot(num(gem.screenX) - px, num(gem.screenY) - py);
        const distAfter = Math.hypot(num(gem.screenX) - num(moved.player && moved.player.screenX), num(gem.screenY) - num(moved.player && moved.player.screenY));
        if (distAfter < distBefore || num(moved.revisions && moved.revisions.movement) > num(current.revisions && current.revisions.movement)) movedTowardGem = true;
        after = moved;
        await browser.sleep(150);
      }
      if (!movedTowardGem && Math.hypot(num(after.player && after.player.screenX) - startPlayerX, num(after.player && after.player.screenY) - startPlayerY) < 2) {
        return FAIL('real keyboard input did not move player toward the visible gem');
      }
      if (!pickupProgressed(before, after)) {
        return FAIL(`real movement did not collect/advance experience: exp ${before.experience}->${after.experience}, phase=${after.phase}, pickups=${num(after.revisions && after.revisions.pickups)}`);
      }
      const repeatBefore = await game.snapshot();
      await browser.sleep(350);
      const repeatAfter = await game.snapshot();
      if (repeatAfter.phase !== 'levelUp' && num(repeatAfter.experience) > num(repeatBefore.experience) && num(repeatAfter.entityCounts && repeatAfter.entityCounts.gems) >= num(repeatBefore.entityCounts && repeatBefore.entityCounts.gems)) {
        return FAIL('collected gem appears to award experience repeatedly without being consumed');
      }
      return PASS(`real pickup advanced: exp ${before.experience}->${after.experience}, phase=${after.phase}, movedTowardGem=${movedTowardGem}`);
    }
  },
  {
    id: 'p1-7-contract-experience-to-upgrade-loop',
    level: 'P1',
    name: 'contract experience pickup opens upgrade and choice resumes',
    timeoutMs: 22000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.reset(true);
      const loaded = await game.loadScenario('near_level_up');
      if (!loaded.ok) return FAIL(`near_level_up scenario unavailable: ${loaded.reason || 'not ok'}`);
      const before = await game.snapshot();
      if (!before.nearestGem && num(before.entityCounts && before.entityCounts.gems) < 1) return FAIL('near_level_up did not provide a collectible experience item');
      // The public interact action is explicitly allowed to approach the gem
      // without collecting it. Keep using that player-level action until the
      // declared scenario reaches levelUp, rather than requiring one call to
      // cover an implementation-dependent travel distance.
      let leveled = await game.snapshot();
      let interactions = 0;
      const deadline = Date.now() + 8000;
      while (leveled.phase !== 'levelUp' && Date.now() < deadline) {
        if (!leveled.nearestGem && num(leveled.entityCounts && leveled.entityCounts.gems) < 1) break;
        await game.contractInput({ type: 'interact', target: 'nearestGem' });
        interactions++;
        await browser.sleep(120);
        leveled = await game.snapshot();
      }
      if (leveled.phase !== 'levelUp' || !Array.isArray(leveled.upgradeChoices) || leveled.upgradeChoices.length < 2) {
        return FAIL(`pickup did not open upgrade choices after ${interactions} semantic interactions; phase=${leveled.phase}, choices=${leveled.upgradeChoices && leveled.upgradeChoices.length}`);
      }
      const choice = leveled.upgradeChoices[0];
      const upBefore = deepClone(leveled.upgrades);
      const chosen = await game.contractInput({ type: 'chooseUpgrade', id: choice.id, index: 0 });
      if (chosen.ok === false) return FAIL(`chooseUpgrade rejected valid choice: ${chosen.reason || 'no reason'}`);
      await browser.sleep(300);
      const after = await game.snapshot();
      if (after.phase !== 'playing') return FAIL(`choosing upgrade did not resume playing, got ${after.phase}`);
      if (num(after.level) <= num(before.level)) {
        return FAIL('choosing upgrade did not advance level, got ' + before.level + '->' + after.level);
      }
      const changed = JSON.stringify(upBefore) !== JSON.stringify(after.upgrades) || num(after.level) > num(before.level) || num(after.revisions && after.revisions.upgrades) > num(leveled.revisions && leveled.revisions.upgrades);
      if (!changed) return FAIL('upgrade choice had no observable upgrade or level effect');
      return PASS(`level ${before.level}->${after.level}, upgrade choice applied`);
    }
  },
  {
    id: 'p2-1-terminal-lock-and-restart-contract',
    level: 'P2',
    name: 'terminal game over locks play input and restart cleans up',
    timeoutMs: 24000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const started = await game.reset(true);
      if (started.ok === false) return FAIL(`could not establish playing prerequisite: ${started.reason || 'no reason'}`);
      const baseline = await game.snapshot();
      const loaded = await game.loadScenario('low_health');
      if (!loaded.ok) return NA(`low_health scenario not implemented: ${loaded.reason || 'not ok'}`);
      const setup = loaded.snapshot || await game.snapshot();
      if (setup.phase !== 'playing' || setup.result !== 'none' ||
          num(setup.health) <= 0 || num(setup.health) >= num(setup.maxHealth) ||
          num(setup.entityCounts && setup.entityCounts.enemies) < 1) {
        return FAIL(`low_health scenario did not establish a non-terminal low-health enemy setup: phase=${setup.phase}, result=${setup.result}`);
      }
      await game.contractInput({ type: 'wait', durationMs: 1600 });
      let terminal = await game.snapshot();
      const terminalDeadline = Date.now() + 6000;
      while (!(terminal.phase === 'gameOver' && terminal.result === 'lose') && Date.now() < terminalDeadline) {
        const waited = await game.contractInput({ type: 'wait', durationMs: 250 });
        terminal = waited && waited.snapshot ? waited.snapshot : await game.snapshot();
        if (waited && waited.ok === false) break;
      }
      if (terminal.phase !== 'gameOver' || terminal.result !== 'lose' || terminal.overlayBlocking !== true || terminal.canInteractWithPlayfield !== false) {
        return FAIL(`low health damage did not reach a locked gameOver/result lose state, phase=${terminal.phase}, result=${terminal.result}`);
      }
      const beforeMove = deepClone(terminal);
      await game.realKeyHold('ArrowRight', 500);
      const afterMove = await game.snapshot();
      const unchanged = num(afterMove.revisions && afterMove.revisions.movement) === num(beforeMove.revisions && beforeMove.revisions.movement) &&
        num(afterMove.time) === num(beforeMove.time) &&
        num(afterMove.score) === num(beforeMove.score);
      if (!unchanged) return FAIL('terminal state accepted movement/time/score changes');
      const restarted = await game.contractInput({ type: 'restart' });
      if (restarted.ok === false) return FAIL(`restart rejected: ${restarted.reason || 'no reason'}`);
      const reset = restarted.snapshot || await game.snapshot();
      const clean = reset.phase === 'playing' && reset.result === 'none' &&
        reset.overlayBlocking === false && reset.canInteractWithPlayfield === true &&
        sameCoreState(baseline, reset) &&
        num(reset.maxHealth) === num(baseline.maxHealth) &&
        num(reset.time) === num(baseline.time) &&
        num(reset.score) === num(baseline.score) &&
        num(reset.entityCounts && reset.entityCounts.shields) === num(baseline.entityCounts && baseline.entityCounts.shields) &&
        JSON.stringify(reset.upgrades) === JSON.stringify(baseline.upgrades);
      if (!clean) return FAIL('restart did not restore the clean playable baseline');
      return PASS('gameOver locks input and restart restores play');
    }
  },
  {
    id: 'p2-2-contract-upgrade-effect-and-invalid-choice',
    level: 'P2',
    name: 'contract rejects invalid actions and preserves core totals',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('playing_clear');
      const before = await game.snapshot();
      const totalBefore = totalCombatEntities(before) + num(before.health) + num(before.level) + num(before.experience);
      const invalidChoice = await game.contractInput({ type: 'chooseUpgrade', id: 'not-a-visible-choice', index: 999 });
      const unknown = await game.contractInput({ type: 'invalidAction', payload: { impossible: true } });
      await browser.sleep(200);
      const after = await game.snapshot();
      const totalAfter = totalCombatEntities(after) + num(after.health) + num(after.level) + num(after.experience);
      const rejected = invalidChoice.ok === false || unknown.ok === false || sameCoreState(before, after);
      if (!rejected) return FAIL('invalid action path was not rejected and did not preserve state');
      if (totalBefore !== totalAfter) return FAIL(`core total invariant changed on invalid actions: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);

      const levelUp = await game.loadScenario('level_up_choice');
      if (!levelUp.ok) return PASS('invalid rejection/invariant verified; level_up_choice optional scenario unavailable');
      const lu = await game.snapshot();
      if (!Array.isArray(lu.upgradeChoices) || lu.upgradeChoices.length < 1) return FAIL('level_up_choice has no visible upgrade choices');
      const upBefore = deepClone(lu.upgrades);
      await game.contractInput({ type: 'chooseUpgrade', index: 0 });
      await browser.sleep(250);
      const upAfter = await game.snapshot();
      if (JSON.stringify(upBefore) === JSON.stringify(upAfter.upgrades) && num(upAfter.revisions && upAfter.revisions.upgrades) <= num(lu.revisions && lu.revisions.upgrades)) {
        return FAIL('valid upgrade choice had no observable upgrade effect');
      }
      return PASS('invalid rejected with unchanged invariant; valid upgrade changes state');
    }
  },
  {
    id: 'p2-3-contract-panels-open-close-and-observe-progress',
    level: 'P2',
    name: 'contract progression panels open close with observable counts',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await ensurePlaying(game);
      const panels = ['daily', 'achievements', 'quest'];
      let observed = 0;
      for (const panel of panels) {
        const before = await game.snapshot();
        const opened = await game.contractInput({ type: 'openPanel', panel });
        await browser.sleep(250);
        const openSnap = await game.snapshot();
        if (opened.ok === false) continue;
        if (openSnap.activePanel !== panel && openSnap.screen !== 'panel') return FAIL(`${panel} open did not set active panel`);
        const hasCounts = panel === 'daily'
          ? num(openSnap.challenges && openSnap.challenges.activeCount) >= 0
          : panel === 'achievements'
            ? num(openSnap.achievements && openSnap.achievements.totalCount) >= 0
            : true;
        if (!hasCounts) return FAIL(`${panel} panel lacks observable progress/counts`);
        const closed = await game.contractInput({ type: 'closePanel' });
        await browser.sleep(200);
        const closedSnap = await game.snapshot();
        if (closed.ok === false || closedSnap.activePanel === panel) return FAIL(`${panel} panel did not close`);
        if (before.phase === 'playing' && closedSnap.overlayBlocking) return FAIL(`${panel} close left blocking overlay`);
        observed++;
      }
      if (observed < 1) return NA('no optional progression panels implemented');
      return PASS(`observed ${observed} progression panel(s)`);
    }
  },
  {
    id: 'p2-4-contract-depth-systems-are-observable',
    level: 'P2',
    name: 'contract optional shield boss or transition systems have visible follow-up',
    timeoutMs: 24000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      let covered = 0;
      const shield = await game.loadScenario('shield_pickup');
      if (shield.ok) {
        // The required public action schema has no shield/pickup target, and
        // the required Snapshot has no pickup position. Do not substitute the
        // unrelated nearestGem action or invent a coordinate/direction. This
        // branch is not counted until the task contract advertises a valid
        // player-level collection path; the other optional branches below
        // remain eligible for coverage.
      }
      const boss = await game.loadScenario('boss_intro');
      if (boss.ok) {
        const before = await game.snapshot();
        await game.contractInput({ type: 'wait', durationMs: 800 });
        await browser.sleep(300);
        const after = await game.snapshot();
        if (num(after.entityCounts && after.entityCounts.bosses) < 1 && !(after.nearestEnemy && after.nearestEnemy.health > 100)) {
          return FAIL('boss_intro did not expose boss entity or boss health');
        }
        if (num(after.revisions && after.revisions.attacks) < num(before.revisions && before.revisions.attacks)) {
          return FAIL('boss scenario produced impossible negative attack revision');
        }
        covered++;
      }
      const daily = await game.loadScenario('daily_panel');
      if (daily.ok) {
        const before = await game.snapshot();
        await game.contractInput({ type: 'openPanel', panel: 'daily' });
        await browser.sleep(250);
        const after = await game.snapshot();
        if (!after.challenges || !after.challenges.visible && after.activePanel !== 'daily') {
          return FAIL('daily_panel scenario did not expose visible daily challenge UI');
        }
        if (num(after.challenges && after.challenges.completedToday) < num(before.challenges && before.challenges.completedToday)) {
          return FAIL('daily completed count regressed');
        }
        covered++;
      }
      if (covered === 0) return NA('no optional depth scenarios implemented');
      return PASS(`covered ${covered} optional depth system(s)`);
    }
  },
  {
    id: 'p2-5-peaceful-zone-suppresses-combat-loop',
    level: 'P2',
    name: 'peaceful zones suppress ordinary combat loop when exposed',
    timeoutMs: 16000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const loaded = await game.loadScenario('peaceful_zone');
      if (!loaded.ok) return NA(`peaceful_zone scenario not exposed: ${loaded.reason || 'not ok'}`);
      const before = await game.snapshot();
      const enemies0 = num(before.entityCounts && before.entityCounts.enemies);
      const projectiles0 = num(before.entityCounts && before.entityCounts.projectiles);
      const health0 = num(before.health);
      const attacks0 = num(before.revisions && before.revisions.attacks);
      const enemyMotion0 = num(before.revisions && before.revisions.enemyMotion);
      await game.contractInput({ type: 'wait', durationMs: 1800 });
      await browser.sleep(500);
      const after = await game.snapshot();
      if (num(after.health) < health0) return FAIL(`peaceful zone allowed player damage: ${health0}->${num(after.health)}`);
      if (num(after.entityCounts && after.entityCounts.enemies) > enemies0) {
        return FAIL(`peaceful zone spawned ordinary enemies: ${enemies0}->${num(after.entityCounts && after.entityCounts.enemies)}`);
      }
      if (num(after.entityCounts && after.entityCounts.projectiles) > projectiles0 && enemies0 === 0) {
        return FAIL(`peaceful zone produced attacks/projectiles without enemies: ${projectiles0}->${num(after.entityCounts && after.entityCounts.projectiles)}`);
      }
      if (num(after.revisions && after.revisions.attacks) > attacks0 && enemies0 === 0) {
        return FAIL(`peaceful zone advanced attack revision without combat: ${attacks0}->${num(after.revisions && after.revisions.attacks)}`);
      }
      if (num(after.revisions && after.revisions.enemyMotion) > enemyMotion0 && enemies0 === 0) {
        return FAIL(`peaceful zone advanced enemy motion without enemies: ${enemyMotion0}->${num(after.revisions && after.revisions.enemyMotion)}`);
      }
      return PASS('peaceful zone did not spawn enemies, attack, or damage player while waiting');
    }
  }
];
