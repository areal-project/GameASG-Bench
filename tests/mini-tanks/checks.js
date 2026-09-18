// === GDD Coverage Map ===
// M1 menu/mode/overlay: p0-1-boot-contract, p1-1-real-start-overlay-flow, p2-2-panel-touch-blocking
// M2 ammo preparation: p1-2-ammo-prep-inventory-contract, p2-1-invalid-action-invariants
// M3 angle aiming: p1-3-angle-key-causal-chain, p1-6-direction-opposite-ballistics
// M4 power control: p1-4-power-flight-coupling
// M5 firing/ballistics: p1-5-fire-lock-visible-projectile, p1-6-direction-opposite-ballistics
// M6 terrain/effects/settle: p1-5-fire-lock-visible-projectile, p1-9-practice-repeatable-loop
// M7 scoring: p2-1-invalid-action-invariants
// M8 limited movement: p1-7-direction-opposite-movement-chain, p2-1-invalid-action-invariants
// M9 turn lock: p1-5-fire-lock-visible-projectile, p1-8-turn-ai-lock
// M10 AI/local turn behavior: p1-8-turn-ai-lock, p2-3-local-two-player-turn-support
// M11 practice: p0-2-visible-battle-contract, p1-9-practice-repeatable-loop
// M12 result/restart cleanup: p1-10-endgame-result-cleanup
// M12 natural terminal path: p1-11-natural-terminal-from-legal-fire
// M13 weapon categories: p1-2-ammo-prep-inventory-contract, p1-4-power-flight-coupling
// M14 panels/nonblocking support: p2-2-panel-touch-blocking, p2-4-polish-nonblocking-flow
// === Category Map ===
// Boot & Stability: p0-1, p0-2
// UI Flow & Blocking: p1-1, p2-2
// Input Semantics: p1-3, p1-4, p1-6, p1-7
// Core Mechanic Loop: p1-2, p1-5, p1-9
// State Machine: p1-8, p1-10, p2-1
// === Rationality Map ===
// p1-1-real-start-overlay-flow: real action: browser.mouseClick on discovered visible controls; independent observation: snapshot mode/phase/activePanel/overlayBlocking and unchanged battle state under overlay; empty-shell failure: API-only menus or nonblocking panels do not change or protect state
// p1-2-ammo-prep-inventory-contract: real action: contract randomize/confirm player-level preparation from legal scenario; independent observation: phase transition plus nonnegative inventories/current weapon/HUD revision; empty-shell failure: skipping prep or entering battle with empty inventories fails
// p1-3-angle-key-causal-chain: real action: browser.keyDown/keyUp held ArrowUp then ArrowDown plus post-fire rejection; independent observation: signed angle/barrel delta, preview revision, release stability, in-flight no-op; empty-shell failure: one-way labels or controls that drift after release fail
// p1-4-power-flight-coupling: real action: browser.keyDown/keyUp ArrowLeft/ArrowRight then fire; independent observation: signed power delta, preview revision, projectile path distance trend, practice invariant; empty-shell failure: power number without flight effect fails
// p1-5-fire-lock-visible-projectile: real action: browser.mouseClick on fire control from legal aiming state; independent observation: projectile/effect/canvas or path change plus ammo delta and control lock rejection; empty-shell failure: instant score APIs or double-fire shells fail
// p1-6-direction-opposite-ballistics: real action: contract aiming and fire from legal practice state; independent observation: direction opposite via Math.sign projectile path deltas and gravity/effect evidence; empty-shell failure: fixed or mirrored projectile direction fails
// p1-7-direction-opposite-movement-chain: real action: browser.mouseClick on left and right movement controls; independent observation: direction opposite via Math.sign tank screenX deltas, move resource trend, inBounds/onTerrain, terrain surface envelope, no-move rejection; empty-shell failure: fake buttons, unlimited movement, wrong-direction movement, or detached tank rendering fails
// p1-8-turn-ai-lock: real action: player-level fire and waitForSettled from single-player legal state; independent observation: phase/turn/controlLock sequence, rejected player input during opponent/non-aiming state, opponent motion or legal return; empty-shell failure: immediate turn skips or controllable opponent turns fail
// p1-9-practice-repeatable-loop: real action: repeated player-level aim/fire/wait sequence in practice; independent observation: projectile/effect revisions and return to interactive practice aiming without terminal result; empty-shell failure: static practice galleries or one-shot lockups fail
// p1-10-endgame-result-cleanup: real action: legal fire/wait chain from low-ammo state then restart/return; independent observation: result layer/terminal lock, rejected battle input, cleanup of projectile/result state; empty-shell failure: fake result labels or stale old-round state fail
// p1-11-natural-terminal-from-legal-fire: real action: legal fire/wait from endgame precondition; independent observation: projectile/effect/resource evidence before result; empty-shell failure: direct forceGameOver/result APIs without natural combat settlement fail
// p2-1-invalid-action-invariants: real action: invalid player-level fire/move/select attempts in preparing, in-flight, no-move, and result states; independent observation: lastAction rejection or stable snapshots plus nonnegative resource invariants; empty-shell failure: cheat-like invalid accepts or negative resources fail
// p2-2-panel-touch-blocking: real action: Input.dispatchTouchEvent on discovered panel control and background; independent observation: activePanel/overlayBlocking and unchanged mode/phase under blocked input; empty-shell failure: decorative panels that neither open nor block fail
// p2-3-local-two-player-turn-support: real action: local player-level fire/wait then second-side control action; independent observation: currentSide/turn change and side resources stay nonnegative; empty-shell failure: single-side-only local shells or skipped second turns fail
// p2-4-polish-nonblocking-flow: real action: browser.mouseClick after optional title/polish delay and returnToMenu; independent observation: mode/phase transition and cleanup after return; empty-shell failure: animations or support layers that trap start/return controls fail

function PASS(detail) {
  return { status: 'PASS', detail: detail || '' };
}

function FAIL(detail) {
  return { status: 'FAIL', detail: detail || '' };
}

function isNum(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function nonNegative(value) {
  return isNum(value) && value >= 0;
}

function approxSame(a, b, eps) {
  if (!isNum(a) || !isNum(b)) return false;
  return Math.abs(a - b) <= (eps || 0.001);
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value || null));
}

function resourceOk(s) {
  return !!s && nonNegative(s.scores && s.scores.player) &&
    nonNegative(s.scores && s.scores.opponent) &&
    nonNegative(s.ammo && s.ammo.playerCount) &&
    nonNegative(s.ammo && s.ammo.opponentCount) &&
    nonNegative(s.movement && s.movement.remaining);
}

function currentTank(s) {
  if (!s || !s.tanks) return null;
  if (s.currentSide === 'opponent' || s.currentSide === 'player2') return s.tanks.opponent || null;
  return s.tanks.player || null;
}

function terrainOf(s) {
  return (s && s.terrain) || {};
}

function tankSurfaceError(s, side, label) {
  const tank = side === 'opponent' ? (s && s.tanks && s.tanks.opponent) : (s && s.tanks && s.tanks.player);
  if (!tank || tank.present !== true) return `${label}: ${side} tank missing`;
  const bounds = s && s.visible && s.visible.playfieldBounds;
  if (!bounds || !isNum(bounds.width) || !isNum(bounds.height) || bounds.width <= 0 || bounds.height <= 0) {
    return `${label}: visible.playfieldBounds missing`;
  }
  if (!isNum(tank.screenX) || !isNum(tank.screenY)) return `${label}: ${side} tank screen position missing`;
  if (typeof tank.inBounds !== 'boolean') return `${label}: ${side} tank inBounds summary missing`;
  if (!tank.inBounds) return `${label}: ${side} tank is outside the playable area`;
  // screenX/screenY may be expressed in the game's logical canvas coordinate
  // system while visible.playfieldBounds uses the browser's CSS display size.
  // Do not compare those unrelated units directly; the public inBounds flag
  // and the terrain envelope are the contract-level grounding signals.
  const envelope = terrainOf(s).tankSurfaceEnvelope && terrainOf(s).tankSurfaceEnvelope[side];
  if (tank.onTerrain === true) {
    if (!envelope || typeof envelope !== 'object') return `${label}: terrain.tankSurfaceEnvelope.${side} missing`;
    for (const key of ['tankScreenX', 'tankBaseScreenY', 'terrainScreenY', 'tolerance']) {
      if (!isNum(envelope[key])) return `${label}: terrain.tankSurfaceEnvelope.${side}.${key} must be numeric`;
    }
    if (envelope.tolerance < 0) return `${label}: terrain.tankSurfaceEnvelope.${side}.tolerance must be non-negative`;
    if (typeof envelope.tankOnVisibleSurface !== 'boolean') return `${label}: terrain.tankSurfaceEnvelope.${side}.tankOnVisibleSurface must be boolean`;
    const within = Math.abs(envelope.tankBaseScreenY - envelope.terrainScreenY) <= Math.max(1, envelope.tolerance);
    if (!envelope.tankOnVisibleSurface) return `${label}: ${side} tank onTerrain=true but not on visible terrain surface`;
    if (!within) return `${label}: ${side} tank base ${envelope.tankBaseScreenY} detached from terrain ${envelope.terrainScreenY}`;
  }
  return null;
}

function battleSurfaceError(s, label) {
  const playerError = tankSurfaceError(s, 'player', label);
  if (playerError) return playerError;
  const opponentError = tankSurfaceError(s, 'opponent', label);
  if (opponentError) return opponentError;
  return null;
}

function pathDx(s) {
  const path = s && s.projectile && Array.isArray(s.projectile.lastPathSample) ? s.projectile.lastPathSample : [];
  if (path.length < 2) return null;
  return path[path.length - 1].screenX - path[0].screenX;
}

function pathDistance(s) {
  const path = s && s.projectile && Array.isArray(s.projectile.lastPathSample) ? s.projectile.lastPathSample : [];
  if (path.length < 2) return 0;
  const first = path[0];
  const last = path[path.length - 1];
  if (!isNum(first.screenX) || !isNum(first.screenY) || !isNum(last.screenX) || !isNum(last.screenY)) return 0;
  return Math.hypot(last.screenX - first.screenX, last.screenY - first.screenY);
}

async function observeProjectilePath(game, browser, initial) {
  let current = initial || await game.snapshot();
  for (let i = 0; i < 12; i++) {
    const samples = current && current.projectile && current.projectile.lastPathSample;
    if (Array.isArray(samples) && samples.length >= 2 && pathDistance(current) > 0) return current;
    await browser.sleep(60);
    current = await game.snapshot();
  }
  if (!(pathDistance(current) > 0)) {
    const settled = await game.input({ type: 'waitForSettled' });
    if (settled) current = settled;
  }
  return current;
}

function revisionSum(s) {
  const e = (s && s.effects) || {};
  const t = (s && s.terrain) || {};
  return (e.explosionRevision || 0) + (e.damageRevision || 0) + (e.scoreRevision || 0) + (e.worldMotionRevision || 0) + (t.revision || 0);
}

function sameCoreState(a, b) {
  if (!a || !b) return false;
  return a.screen === b.screen &&
    a.phase === b.phase &&
    a.mode === b.mode &&
    a.currentSide === b.currentSide &&
    JSON.stringify(a.scores || {}) === JSON.stringify(b.scores || {}) &&
    JSON.stringify(a.ammo || {}) === JSON.stringify(b.ammo || {}) &&
    JSON.stringify(a.movement || {}) === JSON.stringify(b.movement || {});
}

async function waitUntil(fn, timeoutMs, intervalMs) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await fn();
    if (last && last.ok) return last.value;
    await new Promise(resolve => setTimeout(resolve, intervalMs || 120));
  }
  return last && last.value;
}

function createGameDriver(browser) {
  async function pageEval(source) {
    return await browser.eval(source);
  }

  async function callContract(method, arg1, arg2) {
    const encoded1 = JSON.stringify(arg1 === undefined ? null : arg1);
    const encoded2 = JSON.stringify(arg2 === undefined ? null : arg2);
    return await pageEval(`(async function() {
      const api = window.__gameTest;
      if (!api || typeof api.${method} !== 'function') return { __missing: '${method}' };
      const a = ${encoded1};
      const b = ${encoded2};
      if ('${method}' === 'getSnapshot') return await api.getSnapshot();
      if ('${method}' === 'reset') return await api.reset(a === null ? undefined : a);
      if ('${method}' === 'loadScenario') return await api.loadScenario(a, b === null ? undefined : b);
      return await api.input(a);
    })()`);
  }

  return {
    async waitForReady() {
      return await waitUntil(async () => {
        const ready = await pageEval(`(function() {
          const api = window.__gameTest;
          return !!api && ['reset','input','getSnapshot','loadScenario'].every(k => typeof api[k] === 'function');
        })()`);
        return { ok: !!ready, value: ready };
      }, 6000, 100);
    },
    async reset(options) {
      return await callContract('reset', options || null);
    },
    async snapshot() {
      return await callContract('getSnapshot');
    },
    async input(action) {
      return await callContract('input', action);
    },
    async loadScenario(name, options) {
      return await callContract('loadScenario', name, options || null);
    },
    async waitForSnapshot(predicate, timeoutMs) {
      return await waitUntil(async () => {
        const s = await callContract('getSnapshot');
        return { ok: predicate(s), value: s };
      }, timeoutMs || 4000, 140);
    },
    async findClickable(patterns, timeoutMs = 1600) {
      const encoded = JSON.stringify(patterns);
      const find = async () => await pageEval(`(function() {
        const patterns = ${encoded}.map(p => new RegExp(p, 'i'));
        const nodes = Array.from(document.querySelectorAll('button,[role="button"],a,input,select,[data-game-control],[data-action],[data-mode],[data-start],[data-panel],[data-target]'));
        function visible(el) {
          const r = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return r.width > 8 && r.height > 8 && style.visibility !== 'hidden' && style.display !== 'none' && style.pointerEvents !== 'none' && !el.disabled;
        }
        for (const el of nodes) {
          if (!visible(el)) continue;
          const dataMetadata = Array.from(el.attributes)
            .filter(attr => attr.name.indexOf('data-') === 0)
            .map(attr => attr.name + '=' + attr.value)
            .join(' ');
          const hay = [
            el.id || '',
            dataMetadata,
            el.getAttribute('data-role') || '',
            el.getAttribute('data-game-control') || '',
            el.getAttribute('data-action') || '',
            el.getAttribute('data-mode') || '',
            el.getAttribute('data-start') || '',
            el.getAttribute('data-panel') || '',
            el.getAttribute('data-target') || '',
            el.getAttribute('aria-label') || '',
            el.getAttribute('title') || '',
            el.value || '',
            el.textContent || ''
          ].join(' ')
          if (patterns.some(re => re.test(hay))) {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: hay.trim().slice(0, 80) };
          }
        }
        return null;
      })()`);
      return await waitUntil(async () => {
        const value = await find();
        return { ok: !!value, value };
      }, timeoutMs, 80);
    },
    async playfieldCenter() {
      return await pageEval(`(async function() {
        const s = window.__gameTest && window.__gameTest.getSnapshot ? await window.__gameTest.getSnapshot() : null;
        const b = s && s.visible && s.visible.playfieldBounds;
        if (b && b.width > 0 && b.height > 0) return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        const canvases = Array.from(document.querySelectorAll('canvas')).filter(c => {
          const r = c.getBoundingClientRect();
          return r.width > 50 && r.height > 50;
        });
        const c = canvases.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
        if (!c) return null;
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);
    }
  };
}

function assertCoreSnapshot(s) {
  if (!s || typeof s !== 'object') return 'snapshot is not an object';
  if (s.schemaVersion !== 1) return 'schemaVersion must be 1';
  if (!['title', 'ammoPrep', 'battle', 'result', 'library', 'info', 'updates', 'loading'].includes(s.screen)) return 'screen is outside TDD enum';
  if (!['menu', 'preparing', 'aiming', 'flying', 'effect', 'opponentTurn', 'paused', 'result'].includes(s.phase)) return 'phase is outside TDD enum';
  if (!['none', 'single', 'local2p', 'practice'].includes(s.mode)) return 'mode is outside TDD enum';
  if (!s.controls || !s.visible) return 'controls and visible summaries are required';
  if (!resourceOk(s)) return 'scores, ammo counts, and movement remaining must be nonnegative';
  return null;
}

function assertAimingPrecondition(s, mode) {
  const core = assertCoreSnapshot(s);
  if (core) return core;
  if (s.screen !== 'battle' || s.phase !== 'aiming') return 'scenario is not a battle aiming precondition';
  if (mode && s.mode !== mode) return `scenario mode ${s.mode} is not ${mode}`;
  if (!s.canInteractWithPlayfield) return 'playfield is not interactable in aiming precondition';
  if (!currentTank(s) || !currentTank(s).present) return 'current tank is not present';
  return null;
}

function aimAngle(s) {
  if (!s || !s.aim) return null;
  if (isNum(s.aim.angle)) return s.aim.angle;
  return isNum(s.aim.barrelScreenAngle) ? s.aim.barrelScreenAngle : null;
}

function circularAngleDelta(from, to) {
  if (!isNum(from) || !isNum(to)) return null;
  let delta = (to - from) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

async function runAngleKeyPair(game, browser, upKey, downKey) {
  const start = await game.loadScenario('practice_aiming_ready');
  const pre = assertAimingPrecondition(start, 'practice');
  if (pre) return { ok: false, reason: pre };
  await browser.sleep(120);

  const startAngle = aimAngle(start);
  await browser.keyDown(upKey);
  await browser.sleep(200);
  const upMid = await game.snapshot();
  await browser.sleep(200);
  const upHeld = await game.snapshot();
  await browser.keyUp(upKey);
  const up = await game.snapshot();
  const upFirstDelta = circularAngleDelta(startAngle, aimAngle(upMid));
  const upSecondDelta = circularAngleDelta(aimAngle(upMid), aimAngle(upHeld));
  const upDelta = (upFirstDelta || 0) + (upSecondDelta || 0);
  if (!(upFirstDelta > 0) || !(upSecondDelta > 0)) {
    return { ok: false, reason: `held ${upKey} did not continuously increase angle` };
  }
  if ((upHeld.aim.previewRevision || 0) <= (start.aim.previewRevision || 0) &&
      approxSame(upHeld.tanks.player.barrelScreenAngle, start.tanks.player.barrelScreenAngle)) {
    return { ok: false, reason: 'angle changed without preview or barrel observable update' };
  }
  await browser.sleep(350);
  const stable = await game.snapshot();
  const drift = circularAngleDelta(aimAngle(up), aimAngle(stable));
  if (!isNum(drift) || Math.abs(drift) > Math.max(4, Math.abs(upDelta) * 0.75)) {
    return { ok: false, reason: 'angle continued drifting after key release' };
  }

  await browser.keyDown(downKey);
  await browser.sleep(200);
  const downMid = await game.snapshot();
  await browser.sleep(200);
  const downHeld = await game.snapshot();
  await browser.keyUp(downKey);
  const downFirstDelta = circularAngleDelta(aimAngle(stable), aimAngle(downMid));
  const downSecondDelta = circularAngleDelta(aimAngle(downMid), aimAngle(downHeld));
  const downDelta = (downFirstDelta || 0) + (downSecondDelta || 0);
  if (!(downFirstDelta < 0) || !(downSecondDelta < 0)) {
    return { ok: false, reason: `held ${downKey} did not continuously reverse the angle trend` };
  }

  const locked = await game.loadScenario('post_fire_lock_window');
  if (!['flying', 'effect'].includes(locked.phase)) {
    return { ok: false, reason: 'post_fire_lock_window did not establish an in-flight/effect precondition' };
  }
  const rejected = await game.input({ type: 'adjustAngle', direction: 'up', durationMs: 300 });
  const lockDelta = circularAngleDelta(aimAngle(locked), aimAngle(rejected));
  if (!isNum(lockDelta)) return { ok: false, reason: 'locked snapshot lacks a numeric angle' };
  if (Math.abs(lockDelta) > 1 && !(rejected.lastAction && rejected.lastAction.ok === false)) {
    return { ok: false, reason: 'angle changed during locked flight/effect phase' };
  }
  return { ok: true, detail: `angle up=${upDelta.toFixed(2)}, down=${downDelta.toFixed(2)}` };
}

const suite = [
  {
    id: 'p0-1-boot-contract',
    level: 'P0',
    name: 'boot exposes stable public contract',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const ready = await game.waitForReady();
      if (!ready) return FAIL('window.__gameTest reset/input/getSnapshot/loadScenario not ready');
      const s = await game.reset();
      const err = assertCoreSnapshot(s);
      if (err) return FAIL(err);
      return PASS(`screen=${s.screen}, phase=${s.phase}, mode=${s.mode}`);
    }
  },
  {
    id: 'p0-2-visible-battle-contract',
    level: 'P0',
    name: 'visible battle snapshot is ready',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const s = await game.loadScenario('practice_aiming_ready');
      const pre = assertAimingPrecondition(s, 'practice');
      if (pre) return FAIL(pre);
      if (!s.visible.playfieldReady || s.visible.playfieldNonBlank === false) return FAIL('playfield is not visibly ready');
      if (!s.visible.playfieldBounds || s.visible.playfieldBounds.width <= 0 || s.visible.playfieldBounds.height <= 0) return FAIL('playfield bounds missing');
      if ((s.visible.tankCount || 0) < 2) return FAIL('battle must expose at least two visible tanks');
      const surfaceError = battleSurfaceError(s, 'visible battle');
      if (surfaceError) return FAIL(surfaceError);
      if (!s.controls.fire || !s.controls.moveLeft || !s.controls.moveRight) return FAIL('core battle controls not available');
      return PASS(`bounds=${Math.round(s.visible.playfieldBounds.width)}x${Math.round(s.visible.playfieldBounds.height)}`);
    }
  },
  {
    id: 'p1-1-real-start-overlay-flow',
    level: 'P1',
    name: 'real start and overlay flow blocks playfield',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('title_ready');
      const start = await game.findClickable(['practice', 'start.*practice', 'mode.*practice']);
      if (!start) return FAIL('no visible practice/start control found for real input');
      await browser.mouseClick(start.x, start.y);
      const started = await game.waitForSnapshot(s => s && s.mode === 'practice' && s.phase === 'aiming' && s.screen === 'battle', 5000);
      const startErr = assertAimingPrecondition(started, 'practice');
      if (startErr) return FAIL(`real start did not reach practice aiming: ${startErr}`);

      await game.loadScenario('title_ready');
      const panelButton = await game.findClickable(['ammo.*library', 'info', 'updates', 'patch']);
      if (!panelButton) return FAIL('no visible auxiliary panel control found');
      await browser.mouseClick(panelButton.x, panelButton.y);
      const open = await game.waitForSnapshot(s => s && (s.overlayBlocking || (s.activePanel && s.activePanel !== 'none')), 3000);
      if (!open || !open.overlayBlocking) return FAIL('panel did not become blocking after real input');
      const before = deepCopy(open);
      const center = await game.playfieldCenter();
      if (center) await browser.mouseClick(center.x, center.y);
      await browser.sleep(250);
      const after = await game.snapshot();
      if (after.mode !== before.mode || after.phase !== before.phase || after.overlayBlocking !== true) {
        return FAIL('background input changed state while overlay was blocking');
      }
      const close = await game.findClickable(['close', 'dismiss', 'cancel']);
      if (!close) return FAIL('no visible panel close control found for real input');
      await browser.mouseClick(close.x, close.y);
      const closed = await game.waitForSnapshot(
        s => s && s.screen === 'title' && s.activePanel === 'none' && s.overlayBlocking === false,
        3000
      );
      if (!closed || closed.screen !== 'title' || closed.activePanel !== 'none' || closed.overlayBlocking !== false) {
        return FAIL('closing panel did not restore title interaction');
      }
      return PASS(`started=${started.mode}/${started.phase}, panel=${open.activePanel}`);
    }
  },
  {
    id: 'p1-2-ammo-prep-inventory-contract',
    level: 'P1',
    name: 'ammo preparation creates battle inventories',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const prep = await game.loadScenario('single_ammo_prep');
      const core = assertCoreSnapshot(prep);
      if (core) return FAIL(core);
      if (prep.mode !== 'single' || prep.phase !== 'preparing') return FAIL('single_ammo_prep is not a preparing precondition');
      const beforeFire = deepCopy(prep);
      const illegal = await game.input({ type: 'fire' });
      if (!sameCoreState(beforeFire, illegal) && illegal.phase !== 'preparing' && !(illegal.lastAction && illegal.lastAction.ok === false)) {
        return FAIL('fire before ammo preparation was accepted');
      }
      let s = await game.input({ type: 'randomizeAmmo' });
      if (s.phase !== 'aiming') s = await game.input({ type: 'confirmAmmo' });
      if (s.phase !== 'aiming' || s.screen !== 'battle') return FAIL('ammo preparation did not advance to battle aiming');
      if (!nonNegative(s.ammo.playerCount) || !nonNegative(s.ammo.opponentCount) || s.ammo.playerCount <= 0 || s.ammo.opponentCount <= 0) {
        return FAIL('prepared battle lacks positive inventories for both sides');
      }
      if (!['standard', 'heavy', 'special', 'none'].includes(s.ammo.currentWeaponCategory)) return FAIL('current weapon category is outside contract enum');
      if ((s.visible.hudRevision || 0) <= (prep.visible.hudRevision || 0) && !s.ammo.currentWeaponId) return FAIL('battle weapon/HUD state did not become observable');
      return PASS(`inventory=${s.ammo.playerCount}/${s.ammo.opponentCount}, weapon=${s.ammo.currentWeaponCategory}`);
    }
  },
  {
    id: 'p1-3-angle-key-causal-chain',
    level: 'P1',
    name: 'angle keyboard causal chain',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const failures = [];
      for (const [upKey, downKey] of [['ArrowUp', 'ArrowDown'], ['KeyW', 'KeyS']]) {
        const attempt = await runAngleKeyPair(game, browser, upKey, downKey);
        if (attempt.ok) return PASS(attempt.detail);
        failures.push(`${upKey}/${downKey}: ${attempt.reason}`);
      }
      return FAIL(failures.join('; '));
    }
  },
  {
    id: 'p1-4-power-flight-coupling',
    level: 'P1',
    name: 'power control changes projectile trend',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const powerKeyPairs = [
        ['ArrowLeft', 'ArrowRight'],
        ['KeyE', 'KeyQ'],
        ['KeyA', 'KeyD']
      ];
      function samePowerSetup(before, after) {
        return after.activePanel === before.activePanel &&
          after.currentSide === before.currentSide &&
          after.ammo.currentWeaponId === before.ammo.currentWeaponId &&
          approxSame(after.aim.angle, before.aim.angle, 1);
      }
      async function samplePowerKey(key, durationMs) {
        const start = await game.loadScenario('practice_aiming_ready');
        const pre = assertAimingPrecondition(start, 'practice');
        if (pre) return { pre };
        await browser.sleep(120);
        await browser.keyDown(key);
        await browser.sleep(durationMs);
        await browser.keyUp(key);
        const ready = await game.snapshot();
        await browser.sleep(250);
        const stable = await game.snapshot();
        return { start, ready, stable, setupUnchanged: samePowerSetup(start, ready) };
      }

      let chosen = null;
      let sawLowering = false;
      let sawRaising = false;
      for (const [downKey, upKey] of powerKeyPairs) {
        const low = await samplePowerKey(downKey, 500);
        if (low.pre) return FAIL(low.pre);
        const lowDelta = low.ready.aim.power - low.start.aim.power;
        if (!(lowDelta < 0) || !low.setupUnchanged) continue;
        sawLowering = true;
        if (Math.abs(low.stable.aim.power - low.ready.aim.power) > Math.max(3, Math.abs(lowDelta) * 0.75)) return FAIL('power drifted after key release');
        await game.input({ type: 'fire' });
        const lowFired = await game.snapshot();
        const lowShot = await observeProjectilePath(game, browser, lowFired);
        const lowDistance = pathDistance(lowShot);

        const high = await samplePowerKey(upKey, 650);
        if (high.pre) return FAIL(high.pre);
        if (!samePowerSetup(low.start, high.start)) continue;
        const highDelta = high.ready.aim.power - high.start.aim.power;
        if (!(highDelta > 0) || !high.setupUnchanged) continue;
        sawRaising = true;
        if ((high.ready.aim.previewRevision || 0) <= (high.start.aim.previewRevision || 0) && high.ready.aim.power === high.start.aim.power) return FAIL('power control produced no preview or state change');
        await game.input({ type: 'fire' });
        const highFired = await game.snapshot();
        const highShot = await observeProjectilePath(game, browser, highFired);
        const highDistance = pathDistance(highShot);
        if (highShot.mode !== 'practice') return FAIL('practice power shot left practice mode unexpectedly');
        if (lowDistance > 0 && highDistance > lowDistance) {
          chosen = { lowDistance, highDistance };
          break;
        }
      }
      if (!chosen) {
        if (!sawLowering) return FAIL('held power-down input did not lower power');
        if (!sawRaising) return FAIL('held power-up input did not raise power');
        return FAIL('higher power did not produce a stronger/farther observable flight trend');
      }
      return PASS(`lowDistance=${chosen.lowDistance.toFixed(1)}, highDistance=${chosen.highDistance.toFixed(1)}`);
    }
  },
  {
    id: 'p1-5-fire-lock-visible-projectile',
    level: 'P1',
    name: 'fire creates visible projectile and locks controls',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const ready = await game.loadScenario('single_player_aiming_ready');
      const pre = assertAimingPrecondition(ready, 'single');
      if (pre) return FAIL(pre);
      const firePoint = await waitUntil(async () => {
        const point = await game.findClickable(['fire', 'shoot', 'launch']);
        return point ? { ok: true, value: point } : { ok: false, value: null };
      }, 3000, 120);
      const beforeHash = await browser.canvasPixelHash();
      if (firePoint) {
        await browser.mouseClick(firePoint.x, firePoint.y);
      } else {
        await browser.keyDown('Space');
        await browser.keyUp('Space');
      }
      const fired = await game.waitForSnapshot(s => s && (['flying', 'effect'].includes(s.phase) || s.projectile.active || s.projectile.count > 0 || revisionSum(s) > revisionSum(ready)), 3000);
      if (!fired) return FAIL('real fire input did not create projectile/effect state');
      const afterHash = await browser.canvasPixelHash();
      const projectilePositionEvidence = pathDistance(fired) > 0 || (Array.isArray(fired.projectile.lastPathSample) && fired.projectile.lastPathSample.length >= 2);
      const projectileEvidence = fired.projectile.active || fired.projectile.count > 0 || projectilePositionEvidence || revisionSum(fired) > revisionSum(ready);
      if (!projectileEvidence) return FAIL('fire lacks projectile/effect/trajectory evidence');
      if (beforeHash !== null && afterHash !== null && beforeHash === afterHash && !projectilePositionEvidence && revisionSum(fired) <= revisionSum(ready)) {
        return FAIL('real fire changed contract state without visible canvas or trajectory feedback');
      }
      if (fired.ammo.playerCount >= ready.ammo.playerCount && ready.mode !== 'practice') return FAIL('fire did not consume player ammo outside practice');
      const lockedBefore = deepCopy(fired);
      const edit = await game.input({ type: 'adjustPower', direction: 'up', durationMs: 300 });
      const refire = await game.input({ type: 'fire' });
      const lockHeld = (edit.lastAction && edit.lastAction.ok === false) ||
        edit.controlLock === 'inFlight' || edit.controlLock === 'settling' ||
        edit.phase === lockedBefore.phase;
      if (!lockHeld) return FAIL('power/angle edits were accepted during fire lock');
      if (refire.projectile.count > (lockedBefore.projectile.count || 1) + 1 && !(refire.lastAction && refire.lastAction.ok === false)) {
        return FAIL('second fire was accepted during locked projectile phase');
      }
      return PASS(`phase=${fired.phase}, ammo=${ready.ammo.playerCount}->${fired.ammo.playerCount}`);
    }
  },
  {
    id: 'p1-6-direction-opposite-ballistics',
    level: 'P1',
    name: 'opposite aiming directions produce opposite projectile travel',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      let rightReady = await game.loadScenario('practice_aiming_ready');
      const rightPre = assertAimingPrecondition(rightReady, 'practice');
      if (rightPre) return FAIL(rightPre);
      await game.input({ type: 'adjustAngle', amount: 0 });
      await game.input({ type: 'adjustPower', direction: 'up', durationMs: 200 });
      await game.input({ type: 'fire' });
      const rightShot = await observeProjectilePath(game, browser,
        await game.waitForSnapshot(s => s && (pathDx(s) !== null || s.projectile.lastHorizontalDirection !== 'none'), 3000));

      let leftReady = await game.loadScenario('practice_aiming_ready');
      const leftPre = assertAimingPrecondition(leftReady, 'practice');
      if (leftPre) return FAIL(leftPre);
      // Move just past a quarter-turn so the probe reaches the opposite
      // horizontal sector without assuming a particular default angle.
      await game.input({ type: 'adjustAngle', amount: 91 });
      await game.input({ type: 'adjustPower', direction: 'up', durationMs: 200 });
      await game.input({ type: 'fire' });
      const leftShot = await observeProjectilePath(game, browser,
        await game.waitForSnapshot(s => s && (pathDx(s) !== null || s.projectile.lastHorizontalDirection !== 'none'), 3000));

      const rightDelta = pathDx(rightShot);
      const leftDelta = pathDx(leftShot);
      const rightSign = rightShot.projectile.lastHorizontalDirection === 'right' ? 1 :
        rightShot.projectile.lastHorizontalDirection === 'left' ? -1 : Math.sign(rightDelta || 0);
      const leftSign = leftShot.projectile.lastHorizontalDirection === 'right' ? 1 :
        leftShot.projectile.lastHorizontalDirection === 'left' ? -1 : Math.sign(leftDelta || 0);
      // before/after delta evidence, direction opposite: the two legal aim inputs must produce opposite visible horizontal travel.
      if (!(Math.sign(rightSign) !== 0 && Math.sign(leftSign) !== 0 && Math.sign(rightSign) === -Math.sign(leftSign))) {
        return FAIL(`direction opposite failed: rightSign=${rightSign}, leftSign=${leftSign}`);
      }
      if (rightDelta !== null && leftDelta !== null && Math.sign(rightDelta) === Math.sign(leftDelta)) {
        return FAIL(`projectile path delta did not change opposite directions: ${rightDelta}/${leftDelta}`);
      }
      const gravityEvidence = rightShot.projectile.gravityTrend === 'downward' || leftShot.projectile.gravityTrend === 'downward' ||
        pathDistance(rightShot) > 0 || pathDistance(leftShot) > 0;
      if (!gravityEvidence) return FAIL('projectile path lacks gravity/path evidence');
      return PASS(`direction opposite signs ${rightSign}/${leftSign}`);
    }
  },
  {
    id: 'p1-7-direction-opposite-movement-chain',
    level: 'P1',
    name: 'opposite movement directions use resources and reject exhaustion',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const findMovementControl = async (patterns) => await waitUntil(async () => {
        const point = await game.findClickable(patterns);
        return { ok: !!point, value: point };
      }, 2000, 100);
      const leftStart = await game.loadScenario('practice_aiming_ready');
      const leftPre = assertAimingPrecondition(leftStart, 'practice');
      if (leftPre) return FAIL(leftPre);
      const leftPoint = await findMovementControl(['move.*left', 'left', '←', '◀']);
      if (!leftPoint) return FAIL('no visible left movement control found');
      await browser.mouseClick(leftPoint.x, leftPoint.y);
      const leftAfter = await game.waitForSnapshot(s => {
        const a = currentTank(leftStart);
        const b = currentTank(s);
        return b && a && b.screenX !== a.screenX;
      }, 2000);
      const leftDx = currentTank(leftAfter).screenX - currentTank(leftStart).screenX;

      const rightStart = await game.loadScenario('practice_aiming_ready');
      const rightPoint = await findMovementControl(['move.*right', 'right', '→', '▶']);
      if (!rightPoint) return FAIL('no visible right movement control found');
      await browser.mouseClick(rightPoint.x, rightPoint.y);
      const rightAfter = await game.waitForSnapshot(s => {
        const a = currentTank(rightStart);
        const b = currentTank(s);
        return b && a && b.screenX !== a.screenX;
      }, 2000);
      const rightDx = currentTank(rightAfter).screenX - currentTank(rightStart).screenX;
      // direction opposite: left and right player inputs must have opposite screen-space signs.
      if (!(Math.sign(leftDx) !== 0 && Math.sign(leftDx) === -Math.sign(rightDx))) {
        return FAIL(`direction opposite movement failed: leftDx=${leftDx}, rightDx=${rightDx}`);
      }
      if (!(leftAfter.movement.remaining < leftStart.movement.remaining)) return FAIL('left move did not consume movement resource');
      if (!(rightAfter.movement.remaining < rightStart.movement.remaining)) return FAIL('right move did not consume movement resource');
      if (!currentTank(leftAfter).onTerrain || !currentTank(leftAfter).inBounds || !currentTank(rightAfter).onTerrain || !currentTank(rightAfter).inBounds) {
        return FAIL('tank failed onTerrain/inBounds invariant after movement');
      }
      const leftSurface = tankSurfaceError(leftAfter, 'player', 'left movement');
      if (leftSurface) return FAIL(leftSurface);
      const rightSurface = tankSurfaceError(rightAfter, 'player', 'right movement');
      if (rightSurface) return FAIL(rightSurface);

      const noMoves = await game.loadScenario('player_no_moves_remaining');
      if (noMoves.movement.remaining !== 0) return FAIL('player_no_moves_remaining did not establish zero movement resource');
      const reject = await game.input({ type: 'move', direction: 'left' });
      if (reject.movement.remaining < 0) return FAIL('rejected move produced negative movement resource');
      if (reject.movement.remaining !== noMoves.movement.remaining && !(reject.lastAction && reject.lastAction.ok === false)) return FAIL('no-move request was not rejected or stable');
      return PASS(`movement signs ${Math.sign(leftDx)}/${Math.sign(rightDx)}`);
    }
  },
  {
    id: 'p1-8-turn-ai-lock',
    level: 'P1',
    name: 'single player turn lock and opponent action',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const ready = await game.loadScenario('single_player_aiming_ready');
      const pre = assertAimingPrecondition(ready, 'single');
      if (pre) return FAIL(pre);
      const fired = await game.input({ type: 'fire' });
      if (!['flying', 'effect', 'opponentTurn'].includes(fired.phase) && !fired.projectile.active) return FAIL('fire did not enter flight/effect/opponent sequence');
      const during = await game.input({ type: 'move', direction: 'left' });
      if (during.movement.remaining < 0 || (during.movement.remaining < fired.movement.remaining && !(during.lastAction && during.lastAction.ok === false))) {
        return FAIL('player movement changed resources during non-aiming turn lock');
      }
      const settled = await game.waitForSnapshot(s => s && ['opponentTurn', 'aiming', 'result'].includes(s.phase) && !s.projectile.active, 8000);
      if (!settled) return FAIL('fire/effect did not settle into a legal phase');
      if (settled.phase === 'opponentTurn' || settled.currentSide === 'opponent') {
        const beforeOpponent = deepCopy(settled);
        const blocked = await game.input({ type: 'fire' });
        if (blocked.scores.player !== beforeOpponent.scores.player && !(blocked.lastAction && blocked.lastAction.ok === false)) {
          return FAIL('player fire mutated score during opponent turn');
        }
        const afterOpponent = await game.input({ type: 'waitForSettled', durationMs: 1200 });
        if (afterOpponent.phase === 'opponentTurn' && revisionSum(afterOpponent) === revisionSum(beforeOpponent)) {
          return FAIL('opponent turn showed no motion/effect and did not progress');
        }
      }
      if (!resourceOk(settled)) return FAIL('resources invalid after turn settlement');
      return PASS(`settled=${settled.currentSide}/${settled.phase}`);
    }
  },
  {
    id: 'p1-9-practice-repeatable-loop',
    level: 'P1',
    name: 'practice loop remains repeatable after shots',
    timeoutMs: 28000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const firstReady = await game.loadScenario('practice_aiming_ready');
      const pre = assertAimingPrecondition(firstReady, 'practice');
      if (pre) return FAIL(pre);
      await game.input({ type: 'adjustAngle', direction: 'up', durationMs: 250 });
      await game.input({ type: 'adjustPower', direction: 'up', durationMs: 250 });
      const beforeRev = revisionSum(await game.snapshot());
      await game.input({ type: 'fire' });
      await game.input({ type: 'waitForSettled', durationMs: 2500 });
      const afterFirst = await game.waitForSnapshot(s => s && s.mode === 'practice' && s.phase === 'aiming', 6000);
      if (!afterFirst || !afterFirst.canInteractWithPlayfield) return FAIL('practice did not return to interactive aiming after first shot');
      if (afterFirst.result !== 'none') return FAIL('normal practice shot entered terminal result');
      const firstSurface = battleSurfaceError(afterFirst, 'practice after first shot');
      if (firstSurface) return FAIL(firstSurface);
      if (revisionSum(afterFirst) <= beforeRev && pathDistance(afterFirst) === 0) return FAIL('first practice shot left no projectile/effect evidence');

      await game.input({ type: 'adjustAngle', direction: 'down', durationMs: 250 });
      await game.input({ type: 'fire' });
      await game.input({ type: 'waitForSettled', durationMs: 2500 });
      const afterSecond = await game.waitForSnapshot(s => s && s.mode === 'practice' && s.phase === 'aiming', 6000);
      if (!afterSecond || !afterSecond.canInteractWithPlayfield || afterSecond.result !== 'none') return FAIL('practice was not repeatable after second shot');
      const secondSurface = battleSurfaceError(afterSecond, 'practice after second shot');
      if (secondSurface) return FAIL(secondSurface);
      return PASS(`practice revision ${beforeRev}->${revisionSum(afterSecond)}`);
    }
  },
  {
    id: 'p1-10-endgame-result-cleanup',
    level: 'P1',
    name: 'endgame result locks battle and cleanup returns clean state',
    timeoutMs: 36000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      let s = await game.loadScenario('endgame_low_ammo_ready');
      const core = assertCoreSnapshot(s);
      if (core) return FAIL(core);
      if (s.phase === 'result' || s.result !== 'none') return FAIL('endgame_low_ammo_ready already contains terminal result');
      for (let i = 0; i < 8 && s.phase !== 'result'; i++) {
        if (s.phase === 'aiming') await game.input({ type: 'fire' });
        s = await game.input({ type: 'waitForSettled', durationMs: 2500 });
      }
      if (s.phase !== 'result' || s.result === 'none' || !s.visible.resultLayerVisible) return FAIL('legal low-ammo chain did not reach visible result');
      if (s.controlLock !== 'terminal' && s.canInteractWithPlayfield) return FAIL('result did not lock battle input');
      const beforeReject = deepCopy(s);
      const rejected = await game.input({ type: 'fire' });
      if (rejected.scores.player !== beforeReject.scores.player || rejected.scores.opponent !== beforeReject.scores.opponent) return FAIL('battle input changed score after result');
      const cleaned = await game.input({ type: 'returnToMenu' });
      if (cleaned.screen !== 'title' && cleaned.phase !== 'menu') {
        const restarted = await game.input({ type: 'restart' });
        if (restarted.phase === 'result' || restarted.projectile.active) return FAIL('restart did not clear result/projectile state');
        return PASS(`result=${s.result}, restart=${restarted.screen}/${restarted.phase}`);
      }
      if (cleaned.projectile.active || cleaned.visible.resultLayerVisible || cleaned.result !== 'none') return FAIL('returnToMenu left stale projectile or result layer');
      return PASS(`result=${s.result}, cleaned=${cleaned.screen}/${cleaned.phase}`);
    }
  },
  {
    id: 'p1-11-natural-terminal-from-legal-fire',
    level: 'P1',
    name: 'legal combat fire naturally reaches terminal result',
    timeoutMs: 36000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      let s = await game.loadScenario('endgame_low_ammo_ready');
      const core = assertCoreSnapshot(s);
      if (core) return FAIL(core);
      if (s.phase === 'result' || s.result !== 'none' || s.visible.resultLayerVisible) {
        return FAIL('endgame_low_ammo_ready preloads terminal result instead of a legal playable precondition');
      }
      if (!['aiming', 'opponentTurn'].includes(s.phase)) return FAIL(`endgame precondition is not a legal active turn: ${s.phase}`);

      const start = deepCopy(s);
      let firedCount = 0;
      let sawProjectileOrEffect = false;
      let sawResourceOrCombatDelta = false;
      for (let i = 0; i < 10 && s.phase !== 'result'; i++) {
        if (s.phase === 'aiming') {
          const beforeFire = deepCopy(s);
          const fired = await game.input({ type: 'fire' });
          firedCount++;
          const fireEvidence = fired.projectile.active || (fired.projectile.count || 0) > 0 ||
            pathDistance(fired) > 0 || revisionSum(fired) > revisionSum(beforeFire);
          sawProjectileOrEffect = sawProjectileOrEffect || fireEvidence;
          sawResourceOrCombatDelta = sawResourceOrCombatDelta ||
            fired.ammo.playerCount < beforeFire.ammo.playerCount ||
            fired.ammo.opponentCount < beforeFire.ammo.opponentCount ||
            fired.scores.player !== beforeFire.scores.player ||
            fired.scores.opponent !== beforeFire.scores.opponent ||
            (fired.effects && beforeFire.effects && (
              fired.effects.damageRevision > beforeFire.effects.damageRevision ||
              fired.effects.scoreRevision > beforeFire.effects.scoreRevision ||
              fired.effects.explosionRevision > beforeFire.effects.explosionRevision
            ));
          s = fired;
        }
        s = await game.input({ type: 'waitForSettled', durationMs: 2800 });
        sawProjectileOrEffect = sawProjectileOrEffect || pathDistance(s) > 0 || revisionSum(s) > revisionSum(start);
        sawResourceOrCombatDelta = sawResourceOrCombatDelta ||
          s.ammo.playerCount < start.ammo.playerCount ||
          s.ammo.opponentCount < start.ammo.opponentCount ||
          s.scores.player !== start.scores.player ||
          s.scores.opponent !== start.scores.opponent ||
          (s.effects && start.effects && (
            s.effects.damageRevision > start.effects.damageRevision ||
            s.effects.scoreRevision > start.effects.scoreRevision ||
            s.effects.explosionRevision > start.effects.explosionRevision
          ));
      }

      if (firedCount <= 0) return FAIL('natural terminal path never submitted a legal fire action');
      if (!sawProjectileOrEffect) return FAIL('terminal path lacks projectile/effect evidence from legal fire');
      if (!sawResourceOrCombatDelta) return FAIL('terminal path lacks ammo/score/damage/resource evidence from legal fire');
      if (s.phase !== 'result' || s.result === 'none' || !s.visible.resultLayerVisible) {
        return FAIL('legal fire/wait chain did not naturally reach visible terminal result');
      }
      if (s.controlLock !== 'terminal' && s.canInteractWithPlayfield) return FAIL('natural terminal result did not lock battle input');
      return PASS(`result=${s.result}, fires=${firedCount}, scores=${s.scores.player}/${s.scores.opponent}`);
    }
  },
  {
    id: 'p2-1-invalid-action-invariants',
    level: 'P2',
    name: 'invalid actions preserve invariants',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const prep = await game.loadScenario('single_ammo_prep');
      const firePrep = await game.input({ type: 'fire' });
      if (!resourceOk(firePrep)) return FAIL('invalid fire during prep broke resource invariants');
      if (firePrep.phase !== prep.phase && !(firePrep.lastAction && firePrep.lastAction.ok === false)) return FAIL('fire during preparation was accepted');

      const flight = await game.loadScenario('post_fire_lock_window');
      if (!['flying', 'effect'].includes(flight.phase)) return FAIL('post_fire_lock_window is not a locked precondition');
      const selectFlight = await game.input({ type: 'selectWeapon', weaponId: '__missing_weapon__' });
      if (!resourceOk(selectFlight)) return FAIL('invalid weapon select broke resource invariants');
      if (selectFlight.ammo.currentWeaponId !== flight.ammo.currentWeaponId && !(selectFlight.lastAction && selectFlight.lastAction.ok === false)) return FAIL('missing weapon changed current weapon in locked phase');

      const noMoves = await game.loadScenario('player_no_moves_remaining');
      const move = await game.input({ type: 'move', direction: 'right' });
      if (!resourceOk(move) || move.movement.remaining < 0) return FAIL('no-move invalid action produced negative resources');
      if (move.movement.remaining !== noMoves.movement.remaining && !(move.lastAction && move.lastAction.ok === false)) return FAIL('no-move action consumed extra resource');

      let result = await game.loadScenario('endgame_low_ammo_ready');
      for (let i = 0; i < 8 && result.phase !== 'result'; i++) {
        if (result.phase === 'aiming') await game.input({ type: 'fire' });
        result = await game.input({ type: 'waitForSettled', durationMs: 2200 });
      }
      if (result.phase === 'result') {
        const after = await game.input({ type: 'move', direction: 'left' });
        if (after.scores.player !== result.scores.player || after.scores.opponent !== result.scores.opponent || after.movement.remaining < 0) {
          return FAIL('post-result invalid movement changed terminal score/resources');
        }
      }
      return PASS('invalid actions rejected or stayed stable with nonnegative resources');
    }
  },
  {
    id: 'p2-2-panel-touch-blocking',
    level: 'P2',
    name: 'support panel opens with touch and blocks background',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('title_ready');
      const point = await game.findClickable(['ammo.*library', 'info', 'updates', 'patch']);
      if (!point) return FAIL('no touchable support panel control found');
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: point.x, y: point.y, radiusX: 2, radiusY: 2, force: 1 }],
        modifiers: 0
      });
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
        modifiers: 0
      });
      const open = await game.waitForSnapshot(s => s && (s.overlayBlocking || (s.activePanel && s.activePanel !== 'none')), 3000);
      if (!open || !open.overlayBlocking) return FAIL('touch did not open a blocking support panel');
      const before = deepCopy(open);
      const center = await game.playfieldCenter();
      if (center) {
        await browser.cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: center.x, y: center.y, radiusX: 2, radiusY: 2, force: 1 }],
          modifiers: 0
        });
        await browser.cdp.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
          modifiers: 0
        });
      }
      await browser.sleep(250);
      const after = await game.snapshot();
      if (after.mode !== before.mode || after.phase !== before.phase || !after.overlayBlocking) {
        return FAIL('background touch changed state while panel was blocking');
      }
      return PASS(`panel=${after.activePanel}`);
    }
  },
  {
    id: 'p2-3-local-two-player-turn-support',
    level: 'P2',
    name: 'local two player turn support',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const ready = await game.loadScenario('local_current_player_aiming');
      const core = assertCoreSnapshot(ready);
      if (core) return FAIL(core);
      if (ready.mode !== 'local2p' || ready.phase !== 'aiming') return FAIL('local_current_player_aiming is not a local aiming precondition');
      const beforeSide = ready.currentSide || (ready.turn && ready.turn.currentSide);
      const beforeAmmo = ready.ammo.playerCount + ready.ammo.opponentCount;
      await game.input({ type: 'adjustAngle', direction: 'up', durationMs: 200 });
      const fired = await game.input({ type: 'fire' });
      if (!['flying', 'effect', 'aiming', 'result'].includes(fired.phase) && !fired.projectile.active) return FAIL('local player fire did not enter a legal post-action phase');
      const settled = await game.input({ type: 'waitForSettled', durationMs: 2500 });
      if (!resourceOk(settled)) return FAIL('local turn settlement broke resource invariants');
      const afterSide = settled.currentSide || (settled.turn && settled.turn.currentSide);
      if (settled.phase === 'aiming' && beforeSide === afterSide && settled.result === 'none') {
        return FAIL('local turn did not transfer or otherwise progress after a legal shot');
      }
      const afterAmmo = settled.ammo.playerCount + settled.ammo.opponentCount;
      if (afterAmmo > beforeAmmo) return FAIL('local fire increased total ammo inventory');
      if (settled.phase === 'aiming' && settled.canInteractWithPlayfield) {
        const secondAction = await game.input({ type: 'adjustPower', direction: 'down', durationMs: 200 });
        if (secondAction.phase !== 'aiming' && !(secondAction.lastAction && secondAction.lastAction.ok === false)) return FAIL('second local side could not receive a legal control action or rejection');
      }
      return PASS(`local side ${beforeSide}->${afterSide}, ammo ${beforeAmmo}->${afterAmmo}`);
    }
  },
  {
    id: 'p2-4-polish-nonblocking-flow',
    level: 'P2',
    name: 'optional polish does not block start or return',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('title_ready');
      await browser.sleep(900);
      const before = await game.snapshot();
      if (before.overlayBlocking && before.activePanel !== 'none') return FAIL('title_ready started with an unexpected blocking panel');
      const start = await game.findClickable(['practice', 'start.*practice', 'mode.*practice']);
      if (!start) return FAIL('no visible start/practice control after optional title effects');
      await browser.mouseClick(start.x, start.y);
      const battle = await game.waitForSnapshot(s => s && s.mode === 'practice' && s.phase === 'aiming', 5000);
      const pre = assertAimingPrecondition(battle, 'practice');
      if (pre) return FAIL(`optional title effects blocked battle entry: ${pre}`);
      const returned = await game.input({ type: 'returnToMenu' });
      if (returned.screen !== 'title' && returned.phase !== 'menu') return FAIL('returnToMenu did not leave battle after optional flow');
      if (returned.projectile.active || returned.visible.resultLayerVisible) return FAIL('return flow left stale projectile or result layer');
      return PASS(`flow=${before.screen}->${battle.screen}->${returned.screen}`);
    }
  }
];

module.exports = { suite };
