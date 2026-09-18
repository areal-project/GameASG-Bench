'use strict';

// === GDD Coverage Map ===
// p0-1-contract-schema-and-ready: M1 public adapter, snapshot schema, readable playfield, no fatal boot state.
// p0-2-start-scene-readable: M1 start flow, unblocked driving scene, visible car/target/hazards/controls.
// p1-1-key-forward-release-reverse-chain: M2 real keyboard acceleration, release friction, reverse braking, render/timer coupling.
// p1-2-key-steering-direction-opposite: M3 real keyboard left/right steering, direction opposite via Math.sign heading deltas.
// p1-3-reverse-steering-correction-opposite: M3 reverse correction creates opposite turning outcome from forward steering.
// p1-4-touch-controls-hold-move-end: M9 real touch hold/slide/release, held state, vehicle response, ghost input rejection.
// p1-5-collision-reset-causal-chain: M4 player-level driving causes crash feedback, drive lock, and clean same-level reset.
// p1-6-precise-parking-success-and-reject: M5/M6 slow aligned full parking wins, fast/partial contact is rejected.
// p1-7-pause-freezes-and-resume-preserves: M7 pause blocks driving, timer, and hazards; resume preserves attempt.
// p1-8-retry-and-next-level-clean-state: M7/M8 retry clears transient state; next level starts a clean different/cycled layout.
// p1-9-moving-hazard-risk-coupling: M10 moving hazards visibly advance, pause freezes them, player risk can crash.
// p1-10-invalid-action-invariants: M2/M5/M7 invalid actions and modal driving reject without unrelated mutation.
// p2-1-progress-record-does-not-pollute-reset: M11 progress/best summary can update but fresh attempts remain uncompleted.
// p2-2-editor-optional-visible-operations: M14 optional editor mode has visible operations and returns to unblocked driving.

// === Category Map ===
// Boot & Stability: p0-1-contract-schema-and-ready
// UI Flow & Blocking: p0-2-start-scene-readable, p1-7-pause-freezes-and-resume-preserves, p1-8-retry-and-next-level-clean-state
// Input Semantics: p1-1-key-forward-release-reverse-chain, p1-2-key-steering-direction-opposite, p1-3-reverse-steering-correction-opposite, p1-4-touch-controls-hold-move-end
// Core Mechanic Loop: p1-5-collision-reset-causal-chain, p1-6-precise-parking-success-and-reject, p1-9-moving-hazard-risk-coupling
// Invariants & Rejection: p1-10-invalid-action-invariants
// Economy / Progression: p2-1-progress-record-does-not-pollute-reset
// Depth / Optional Systems: p2-2-editor-optional-visible-operations

// === Rationality Map ===
// p1-1-key-forward-release-reverse-chain: M2 | real action: keyDown/keyUp ArrowUp then ArrowDown | independent observation: signedSpeed, heading projection, timer, renderRevision | empty-shell failure: label-only controls, hard-stop release, or same-speed reverse fails
// p1-2-key-steering-direction-opposite: M3 | real action: keyDown/keyUp ArrowUp+ArrowLeft versus ArrowUp+ArrowRight | independent observation: Math.sign heading delta direction opposite + render revision | empty-shell failure: left/right collapse, screen slide, or hidden field-only steering fails
// p1-3-reverse-steering-correction-opposite: M3 | real action: contract comboHold forward-left then reverse-left | independent observation: Math.sign forward/reverse heading deltas direction opposite with signedSpeed polarity | empty-shell failure: reverse steering same as forward or no motion-coupled turning fails
// p1-4-touch-controls-hold-move-end: M9 | real action: Input.dispatchTouchEvent touchStart/touchMove/touchEnd on semantic controls | independent observation: held/pressed controls + vehicle/timer/render deltas | empty-shell failure: touch buttons that only style, mouse-only controls, or ghost-held input fail
// p1-5-collision-reset-causal-chain: M4 | real action: player-level holdControl drives from safe obstacle_approach | independent observation: result/phase, crash overlay, canDrive lock, same-level reset cleanup | empty-shell failure: pre-crashed setup, decorative obstacles, or stale reset state fails
// p1-6-precise-parking-success-and-reject: M5/M6 | real action: parking_approach slow controls and partial_or_fast_bay_contact fast controls | independent observation: target containment/alignment/low speed/result/timer/overlay plus rejection path | empty-shell failure: touching bay directly wins, result-only shell, or missing negative path fails
// p1-7-pause-freezes-and-resume-preserves: M7 | real action: pause then keyDown/keyUp ArrowUp while paused then resume | independent observation: pose/timer/hazard invariant and overlay/canDrive state | empty-shell failure: pause overlay while physics continues or resume resets attempt fails
// p1-8-retry-and-next-level-clean-state: M7/M8 | real action: retry and nextLevel public player actions | independent observation: timer/speed/held/overlay cleanup and layout/index transition | empty-shell failure: buttons only hide panels or carry stale result/velocity fails
// p1-9-moving-hazard-risk-coupling: M10 | real action: wait, pause, resume, then drive into risk route | independent observation: movingMotionRevision active/frozen and crash/reset coupling | empty-shell failure: moving hazard count only or cosmetic motion without risk fails
// p1-10-invalid-action-invariants: M2/M5/M7 | real action: invalid public actions plus modal driving attempts | independent observation: rejected lastAction and phase/level/timer/vehicle/progress invariants | empty-shell failure: always-ok adapter, direct result mutation, or invalid state corruption fails
// p2-1-progress-record-does-not-pollute-reset: M11 | real action: completed_level retry/reset/nextLevel | independent observation: progress or best summary non-regression and fresh result none | empty-shell failure: fixed progress field or reset starting already complete fails
// p2-2-editor-optional-visible-operations: M14 | real action: editor contract enter/place/drag/delete/exit | independent observation: editor phase, playfield revision, object count/revision, unblocked driving after exit | empty-shell failure: editor panel-only shell or editor blocking P1 play fails

const PHASES = ['loading', 'start', 'waitingInput', 'playing', 'paused', 'crashReset', 'complete', 'editor'];
const SCREENS = ['loading', 'start', 'driving', 'pause', 'complete', 'editor'];
const RESULTS = ['none', 'win', 'crash'];
const CONTROLS = ['forward', 'reverse', 'left', 'right'];

function PASS(detail) { return { status: 'PASS', detail }; }
function FAIL(detail) { return { status: 'FAIL', detail }; }

function finite(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function num(v, fallback = 0) {
  return finite(v) ? v : fallback;
}

function abs(v) {
  return Math.abs(num(v));
}

function dist(a, b) {
  if (!a || !b) return 0;
  return Math.hypot(num(a.screenX) - num(b.screenX), num(a.screenY) - num(b.screenY));
}

function pose(s) {
  return {
    screenX: num(s?.vehicle?.screenX),
    screenY: num(s?.vehicle?.screenY),
    headingDeg: num(s?.vehicle?.headingDeg),
    speed: num(s?.vehicle?.speed),
    signedSpeed: num(s?.vehicle?.signedSpeed)
  };
}

function headingDelta(a, b) {
  let d = num(b?.vehicle?.headingDeg) - num(a?.vehicle?.headingDeg);
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

function headingProjection(a, b) {
  const start = pose(a);
  const end = pose(b);
  const rad = start.headingDeg * Math.PI / 180;
  const hx = Math.sin(rad);
  const hy = -Math.cos(rad);
  return (end.screenX - start.screenX) * hx + (end.screenY - start.screenY) * hy;
}

function changedRender(a, b) {
  return num(b?.playfield?.renderRevision) !== num(a?.playfield?.renderRevision);
}

function stableAttemptFields(s) {
  return JSON.stringify({
    phase: s?.phase,
    result: s?.result,
    levelIndex: s?.level?.index,
    layoutId: s?.level?.layoutId,
    timerState: s?.timer?.state,
    elapsedBucket: Math.floor(num(s?.timer?.elapsedMs) / 100),
    vehicleX: Math.round(num(s?.vehicle?.screenX)),
    vehicleY: Math.round(num(s?.vehicle?.screenY)),
    heading: Math.round(num(s?.vehicle?.headingDeg)),
    completedLevels: s?.progress?.completedLevels
  });
}

function validateSnapshot(s, label = 'snapshot') {
  if (!s || typeof s !== 'object') return `${label} is not an object`;
  if (typeof s.ok !== 'boolean') return `${label}.ok must be boolean`;
  if (!PHASES.includes(s.phase)) return `${label}.phase invalid: ${s.phase}`;
  if (!SCREENS.includes(s.screen)) return `${label}.screen invalid: ${s.screen}`;
  if (!RESULTS.includes(s.result)) return `${label}.result invalid: ${s.result}`;
  if (!s.level || typeof s.level !== 'object') return `${label}.level missing`;
  for (const key of ['index', 'count', 'staticObstacleCount', 'parkedVehicleCount', 'movingHazardCount']) {
    if (!finite(s.level[key])) return `${label}.level.${key} must be finite`;
  }
  if (typeof s.level.layoutId !== 'string') return `${label}.level.layoutId must be string`;
  if (typeof s.level.hasTargetBay !== 'boolean') return `${label}.level.hasTargetBay must be boolean`;
  if (!s.timer || !['idle', 'running', 'paused', 'stopped'].includes(s.timer.state) || !finite(s.timer.elapsedMs)) {
    return `${label}.timer schema invalid`;
  }
  if (!s.stars || !(s.stars.current === null || [0, 1, 2, 3].includes(s.stars.current))) return `${label}.stars.current invalid`;
  if (!s.vehicle || typeof s.vehicle !== 'object') return `${label}.vehicle missing`;
  for (const key of ['visible', 'fullyInsideTarget', 'alignedWithTarget', 'inTargetZone']) {
    if (typeof s.vehicle[key] !== 'boolean') return `${label}.vehicle.${key} must be boolean`;
  }
  for (const key of ['screenX', 'screenY', 'headingDeg', 'speed', 'signedSpeed']) {
    if (!finite(s.vehicle[key])) return `${label}.vehicle.${key} must be finite`;
  }
  if (!['left', 'right', 'center'].includes(s.vehicle.steering)) return `${label}.vehicle.steering invalid`;
  if (!s.target || typeof s.target.visible !== 'boolean' || !finite(s.target.screenX) || !finite(s.target.screenY)) return `${label}.target schema invalid`;
  if (!s.hazards || typeof s.hazards.staticSolidVisible !== 'boolean' || typeof s.hazards.movingVisible !== 'boolean' || !finite(s.hazards.movingMotionRevision)) {
    return `${label}.hazards schema invalid`;
  }
  if (!s.controls || typeof s.controls.canDrive !== 'boolean' || !Array.isArray(s.controls.held) || typeof s.controls.semanticControls !== 'object') {
    return `${label}.controls schema invalid`;
  }
  for (const held of s.controls.held) {
    if (!CONTROLS.includes(held)) return `${label}.controls.held contains invalid control`;
  }
  if (!s.overlays || typeof s.overlays.blocking !== 'boolean' || typeof s.overlays.pause !== 'boolean' || typeof s.overlays.complete !== 'boolean' || typeof s.overlays.crashFeedback !== 'boolean') {
    return `${label}.overlays schema invalid`;
  }
  if (!s.playfield || typeof s.playfield.visible !== 'boolean' || !finite(s.playfield.renderRevision) || !['blank', 'low', 'readable'].includes(s.playfield.visualDiversity)) {
    return `${label}.playfield schema invalid`;
  }
  if (!s.progress || !finite(s.progress.completedLevels) || typeof s.progress.currentLevelUnlocked !== 'boolean') return `${label}.progress schema invalid`;
  if (!s.lastAction || typeof s.lastAction.ok !== 'boolean') return `${label}.lastAction schema invalid`;
  if (s.phase === 'playing' && (s.overlays.blocking || !s.controls.canDrive || !s.playfield.visible)) {
    return `${label} violates playing field rules`;
  }
  if (['paused', 'complete', 'crashReset'].includes(s.phase) && s.controls.canDrive) {
    return `${label} allows driving in modal/reset phase`;
  }
  return null;
}

function validatePrecondition(name, s) {
  const base = validateSnapshot(s, `${name} precondition`);
  if (base) return base;
  if (s.lastAction && s.lastAction.ok === false && s.lastAction.reason !== 'unsupported') {
    return `${name} was rejected unexpectedly: ${s.lastAction.reason || 'unknown'}`;
  }
  if (name !== 'fresh_start' && name !== 'completed_level' && name !== 'editor_ready') {
    if (!s.level.hasTargetBay || !s.vehicle.visible || !s.target.visible || !s.playfield.visible) return `${name} lacks visible level/car/target/playfield`;
  }
  if (['level_start', 'open_lane', 'steering_lane', 'obstacle_approach', 'moving_hazard_crossing', 'parking_approach', 'partial_or_fast_bay_contact', 'touch_controls_ready'].includes(name)) {
    if (s.result !== 'none') return `${name} already has result ${s.result}`;
    if (s.overlays.blocking) return `${name} starts with blocking overlay`;
    if (!s.controls.canDrive) return `${name} cannot drive`;
  }
  if (name === 'open_lane' && abs(s.vehicle.signedSpeed) > 1) return 'open_lane must start at rest';
  if (name === 'parking_approach' && (s.vehicle.fullyInsideTarget && s.vehicle.alignedWithTarget)) return 'parking_approach is already complete';
  if (name === 'partial_or_fast_bay_contact' && s.result !== 'none') return 'partial_or_fast_bay_contact already complete';
  if (name === 'obstacle_approach' && s.result !== 'none') return 'obstacle_approach starts collided';
  if (name === 'moving_hazard_crossing' && (!s.hazards.movingVisible || s.level.movingHazardCount < 1)) return 'moving_hazard_crossing lacks moving hazard precondition';
  if (name === 'completed_level' && (s.result !== 'win' || !s.overlays.complete)) return 'completed_level must be a visible completed precondition';
  return null;
}

function sameLevel(a, b) {
  return a?.level?.index === b?.level?.index && a?.level?.layoutId === b?.level?.layoutId;
}

function cleanAttempt(s) {
  return s?.result === 'none' &&
    ['idle', 'paused'].includes(s?.timer?.state) &&
    abs(s?.vehicle?.speed) < 2 &&
    (s?.controls?.held || []).length === 0 &&
    !s?.overlays?.complete &&
    !s?.overlays?.crashFeedback;
}

function controlCenter(s, name) {
  const c = s?.controls?.semanticControls?.[name];
  const b = c?.bounds;
  if (!c || c.available !== true || !b || !finite(b.left) || !finite(b.top) || !finite(b.width) || !finite(b.height) || b.width <= 0 || b.height <= 0) return null;
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
}

async function runtimeTouchControlCenter(browser, name) {
  const point = await browser.eval(`(function() {
    const wantedName = ${JSON.stringify(name)};
    const aliases = {
      forward: ['forward', 'up', 'accelerate', 'throttle', 'gas', '▲', '↑'],
      left: ['left', 'steerleft', 'steer-left', '◀', '←']
    };
    const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
    const wanted = aliases[wantedName] || [wantedName];
    const matches = value => {
      if (!value) return false;
      const raw = String(value).toLowerCase();
      const compact = normalize(value);
      return wanted.some(alias => {
        const aliasRaw = String(alias).toLowerCase();
        const aliasCompact = normalize(alias);
        return raw.includes(aliasRaw) || (aliasCompact && (compact === aliasCompact || compact.includes(aliasCompact)));
      });
    };
    const nodes = Array.from(document.querySelectorAll('button,[role="button"],[data-control],[data-ctrl],[data-c]'));
    for (const node of nodes) {
      const values = [
        node.getAttribute('data-control'),
        node.getAttribute('data-ctrl'),
        node.getAttribute('data-c'),
        node.getAttribute('aria-label'),
        node.getAttribute('title'),
        node.id,
        node.textContent
      ];
      if (!values.some(matches)) continue;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none' || rect.width <= 0 || rect.height <= 0) continue;
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return null;
  })()`);
  if (!point || !finite(point.x) || !finite(point.y)) return null;
  return point;
}

async function touchControlCenter(browser, snapshot, name) {
  const semanticPoint = controlCenter(snapshot, name);
  return semanticPoint || (await runtimeTouchControlCenter(browser, name));
}

async function withTouchLayout(browser, fn) {
  await browser.cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await browser.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, configuration: 'mobile' });
  try {
    await browser.eval(`(function() { window.dispatchEvent(new Event('resize')); return true; })()`);
    await browser.sleep(50);
    return await fn();
  } finally {
    await browser.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await browser.cdp.send('Emulation.clearDeviceMetricsOverride');
    await browser.eval(`(function() { window.dispatchEvent(new Event('resize')); return true; })()`);
  }
}

function createGameDriver(browser) {
  async function evalInPage(expr) {
    const value = await browser.eval(expr);
    if (value && value.__l2_err__) throw new Error(value.__l2_err__);
    return value;
  }

  return {
    async wait(ms) {
      await browser.sleep(ms);
    },
    async snapshot() {
      return await evalInPage(`(function() {
        if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') return null;
        return window.__gameTest.getSnapshot();
      })()`);
    },
    async reset(options = {}) {
      return await evalInPage(`(function() {
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return null;
        return window.__gameTest.reset(${JSON.stringify(options)});
      })()`);
    },
    async loadScenario(name, options = {}) {
      return await evalInPage(`(function() {
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return null;
        return window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options)});
      })()`);
    },
    async input(action) {
      return await evalInPage(`(function() {
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return null;
        return window.__gameTest.input(${JSON.stringify(action)});
      })()`);
    },
    async primaryCanvasHash() {
      return await browser.canvasPixelHash();
    },
    async visibleButtonPoint(kind) {
      return await evalInPage(`(function() {
        const wanted = ${JSON.stringify(kind)};
        const words = {
          start: ['start', 'play', 'begin'],
          pause: ['pause', 'menu'],
          resume: ['resume', 'continue'],
          retry: ['retry', 'restart'],
          next: ['next']
        }[wanted] || [wanted];
        const nodes = Array.from(document.querySelectorAll('button,[role="button"],a,input[type=button],input[type=submit]'));
        for (const node of nodes) {
          const rect = node.getBoundingClientRect();
          if (rect.width < 4 || rect.height < 4) continue;
          const style = getComputedStyle(node);
          if (style.visibility === 'hidden' || style.display === 'none' || style.pointerEvents === 'none') continue;
          const text = ((node.innerText || node.value || node.getAttribute('aria-label') || '') + ' ' + (node.id || '') + ' ' + (node.className || '')).toLowerCase();
          if (words.some(w => text.includes(w))) {
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
        }
        return null;
      })()`);
    }
  };
}

async function releaseAllKeys(browser) {
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']) {
    await browser.keyUp(key);
  }
}

const suite = [
  {
    id: 'p0-1-contract-schema-and-ready',
    level: 'P0',
    name: 'Public contract exposes valid snapshot schema and readable playfield',
    timeoutMs: 6000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const reset = await game.reset();
      const err = validateSnapshot(reset, 'reset');
      if (err) return FAIL(err);
      const snap = await game.snapshot();
      const snapErr = validateSnapshot(snap, 'getSnapshot');
      if (snapErr) return FAIL(snapErr);
      if (snap.playfield.visualDiversity === 'blank') return FAIL('playfield is blank in public snapshot');
      if (!snap.playfield.visible) return FAIL('playfield is not visible');
      return PASS(`phase=${snap.phase}, screen=${snap.screen}, visualDiversity=${snap.playfield.visualDiversity}`);
    }
  },
  {
    id: 'p0-2-start-scene-readable',
    level: 'P0',
    name: 'Start flow enters unblocked readable driving scene',
    timeoutMs: 7000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('fresh_start');
      const preErr = validatePrecondition('fresh_start', pre);
      if (preErr) return FAIL(preErr);
      const point = await game.visibleButtonPoint('start');
      if (point) await browser.mouseClick(point.x, point.y);
      await game.input({ type: 'start' });
      await browser.sleep(250);
      const after = await game.snapshot();
      const err = validateSnapshot(after, 'after start');
      if (err) return FAIL(err);
      if (!['waitingInput', 'playing'].includes(after.phase)) return FAIL(`start did not enter driving phase: ${after.phase}`);
      if (after.overlays.blocking || !after.controls.canDrive) return FAIL('start left a blocking overlay or disabled driving');
      if (!after.vehicle.visible || !after.target.visible || !after.playfield.visible || after.playfield.visualDiversity !== 'readable') {
        return FAIL('driving scene lacks readable vehicle/target/playfield');
      }
      if (!after.hazards.staticSolidVisible ||
          (after.level.staticObstacleCount < 1 && after.level.parkedVehicleCount < 1)) {
        return FAIL('driving scene lacks observable solid risk');
      }
      return PASS(`entered ${after.phase} level=${after.level.index}`);
    }
  },
  {
    id: 'p1-1-key-forward-release-reverse-chain',
    level: 'P1',
    name: 'Real keyboard forward, release friction, and reverse braking chain',
    timeoutMs: 9000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('open_lane');
      const preErr = validatePrecondition('open_lane', pre);
      if (preErr) return FAIL(preErr);
      const h0 = await game.primaryCanvasHash();
      await browser.keyDown('ArrowUp');
      await browser.sleep(550);
      const fwd = await game.snapshot();
      await browser.keyUp('ArrowUp');
      await browser.sleep(180);
      const coast1 = await game.snapshot();
      await browser.sleep(520);
      const coast2 = await game.snapshot();
      await browser.keyDown('ArrowDown');
      await browser.sleep(750);
      const rev = await game.snapshot();
      await browser.keyUp('ArrowDown');
      await releaseAllKeys(browser);
      const h1 = await game.primaryCanvasHash();

      if (validateSnapshot(fwd, 'forward')) return FAIL(validateSnapshot(fwd, 'forward'));
      if (fwd.timer.state !== 'running') return FAIL('timer did not start on real forward key');
      if (fwd.vehicle.signedSpeed <= pre.vehicle.signedSpeed + 2) return FAIL('forward key did not increase signed speed');
      if (headingProjection(pre, fwd) <= 0.5) return FAIL('forward movement did not project along vehicle heading');
      if (!changedRender(pre, fwd) && h0 === h1) return FAIL('forward input did not change visible playfield evidence');
      if ((coast1.controls.held || []).length !== 0) return FAIL('release did not clear held controls');
      if (dist(fwd.vehicle, coast1.vehicle) <= 0.1) return FAIL('release caused a hard stop with no visible coast');
      if (abs(coast2.vehicle.signedSpeed) >= abs(coast1.vehicle.signedSpeed)) return FAIL('coast did not reduce speed trend after release');
      if (abs(rev.vehicle.signedSpeed) >= abs(fwd.vehicle.signedSpeed) && rev.vehicle.signedSpeed > 0) {
        return FAIL('reverse input did not brake the prior forward trend');
      }
      if (rev.vehicle.signedSpeed >= coast2.vehicle.signedSpeed - 0.1) return FAIL('reverse input did not move speed trend toward reverse');
      return PASS(`forward=${fwd.vehicle.signedSpeed.toFixed(2)}, coast=${coast2.vehicle.signedSpeed.toFixed(2)}, reverse=${rev.vehicle.signedSpeed.toFixed(2)}`);
    }
  },
  {
    id: 'p1-2-key-steering-direction-opposite',
    level: 'P1',
    name: 'Real keyboard left and right steering have direction opposite visible results',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const preLeft = await game.loadScenario('steering_lane', { branch: 'left' });
      const preLeftErr = validatePrecondition('steering_lane', preLeft);
      if (preLeftErr) return FAIL(preLeftErr);
      await browser.keyDown('ArrowUp');
      await browser.keyDown('ArrowLeft');
      await browser.sleep(700);
      const left = await game.snapshot();
      await browser.keyUp('ArrowLeft');
      await browser.keyUp('ArrowUp');
      await releaseAllKeys(browser);

      const preRight = await game.loadScenario('steering_lane', { branch: 'right' });
      const preRightErr = validatePrecondition('steering_lane', preRight);
      if (preRightErr) return FAIL(preRightErr);
      await browser.keyDown('ArrowUp');
      await browser.keyDown('ArrowRight');
      await browser.sleep(700);
      const right = await game.snapshot();
      await browser.keyUp('ArrowRight');
      await browser.keyUp('ArrowUp');
      await releaseAllKeys(browser);

      const dl = headingDelta(preLeft, left);
      const dr = headingDelta(preRight, right);
      if (Math.sign(dl) === 0 || Math.sign(dr) === 0) return FAIL(`steering did not change heading: left=${dl}, right=${dr}`);
      if (Math.sign(dl) === Math.sign(dr)) return FAIL(`direction opposite failed: Math.sign(leftDelta)=${Math.sign(dl)} Math.sign(rightDelta)=${Math.sign(dr)}`);
      if (left.vehicle.speed <= 1 || right.vehicle.speed <= 1) return FAIL('steering test did not produce moving vehicle evidence');
      if (dist(preLeft.vehicle, left.vehicle) <= 0.5 || dist(preRight.vehicle, right.vehicle) <= 0.5) return FAIL('steering produced no visible trajectory change');
      if (!changedRender(preLeft, left) || !changedRender(preRight, right)) return FAIL('steering did not update visible playfield revision');
      return PASS(`direction opposite via Math.sign: left=${Math.sign(dl)}, right=${Math.sign(dr)}`);
    }
  },
  {
    id: 'p1-3-reverse-steering-correction-opposite',
    level: 'P1',
    name: 'Reverse steering correction is opposite to forward steering',
    timeoutMs: 9000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const forwardPre = await game.loadScenario('steering_lane', { branch: 'forward-left' });
      const forwardErr = validatePrecondition('steering_lane', forwardPre);
      if (forwardErr) return FAIL(forwardErr);
      const forward = await game.input({ type: 'comboHold', controls: ['forward', 'left'], durationMs: 800, source: 'contract' });
      await game.wait(50);
      const forwardSettled = await game.snapshot();

      const reversePre = await game.loadScenario('steering_lane', { branch: 'reverse-left' });
      const reverseErr = validatePrecondition('steering_lane', reversePre);
      if (reverseErr) return FAIL(reverseErr);
      const reverse = await game.input({ type: 'comboHold', controls: ['reverse', 'left'], durationMs: 950, source: 'contract' });
      await game.wait(50);
      const reverseSettled = await game.snapshot();
      await game.input({ type: 'releaseAllControls' });

      const df = headingDelta(forwardPre, forwardSettled);
      const dr = headingDelta(reversePre, reverseSettled);
      if (Math.sign(df) === 0 || Math.sign(dr) === 0) return FAIL(`forward/reverse steering did not change heading: ${df}, ${dr}`);
      if (Math.sign(df) === Math.sign(dr)) return FAIL(`direction opposite failed for reverse correction: Math.sign(forward)=${Math.sign(df)} Math.sign(reverse)=${Math.sign(dr)}`);
      if (forwardSettled.vehicle.signedSpeed <= 1) return FAIL('forward steering did not establish forward motion');
      if (reverseSettled.vehicle.signedSpeed >= -0.5) return FAIL('reverse steering did not establish reverse motion');
      if (!changedRender(forwardPre, forwardSettled) || !changedRender(reversePre, reverseSettled)) return FAIL('forward/reverse steering lacks visible playfield change');
      return PASS(`reverse correction opposite: forwardSign=${Math.sign(df)}, reverseSign=${Math.sign(dr)}`);
    }
  },
  {
    id: 'p1-4-touch-controls-hold-move-end',
    level: 'P1',
    name: 'Real touch controls hold, slide, and release without ghost input',
    timeoutMs: 9000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      return withTouchLayout(browser, async () => {
      const pre = await game.loadScenario('touch_controls_ready');
      const preErr = validatePrecondition('touch_controls_ready', pre);
      if (preErr) return FAIL(preErr);
      const forward = await touchControlCenter(browser, pre, 'forward');
      const left = await touchControlCenter(browser, pre, 'left');
      if (!forward || !left) return FAIL('visible semantic touch control geometry is required');

      const id = 41;
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: forward.x, y: forward.y, radiusX: 3, radiusY: 3, id }],
        modifiers: 0
      });
      await browser.sleep(350);
      const heldForward = await game.snapshot();
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: left.x, y: left.y, radiusX: 3, radiusY: 3, id }],
        modifiers: 0
      });
      await browser.sleep(350);
      const movedLeft = await game.snapshot();
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
        modifiers: 0
      });
      await browser.sleep(420);
      const released = await game.snapshot();

      if (!heldForward.controls.held.includes('forward')) return FAIL('touchStart did not hold forward');
      if (heldForward.vehicle.signedSpeed <= pre.vehicle.signedSpeed + 0.5) return FAIL('touch forward did not move vehicle');
      if (!movedLeft.controls.held.includes('left')) return FAIL('touchMove did not slide into left control');
      if (Math.sign(headingDelta(heldForward, movedLeft)) === 0) return FAIL('touch slide into left did not affect heading');
      if ((released.controls.held || []).length !== 0) return FAIL('touchEnd left ghost-held controls');
      if (abs(released.vehicle.signedSpeed) > abs(movedLeft.vehicle.signedSpeed) + 0.5) return FAIL('touch release did not stop acceleration trend');
      if (!changedRender(pre, heldForward) || !changedRender(heldForward, movedLeft)) return FAIL('touch control did not visibly update playfield');
      return PASS(`touch held=${heldForward.controls.held.join('+')} released=${released.controls.held.length}`);
      });
    }
  },
  {
    id: 'p1-5-collision-reset-causal-chain',
    level: 'P1',
    name: 'Player-level collision causes crash feedback, drive lock, and clean reset',
    timeoutMs: 11000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('obstacle_approach');
      const preErr = validatePrecondition('obstacle_approach', pre);
      if (preErr) return FAIL(preErr);
      if (pre.result !== 'none' || pre.overlays.crashFeedback) return FAIL('scenario starts already crashed');
      let crash = null;
      for (let i = 0; i < 6; i += 1) {
        crash = await game.input({ type: 'holdControl', control: 'forward', durationMs: 450, source: 'contract' });
        if (crash.result === 'crash' || crash.phase === 'crashReset' || crash.overlays.crashFeedback) break;
      }
      if (!(crash.result === 'crash' || crash.phase === 'crashReset' || crash.overlays.crashFeedback)) return FAIL('driving toward obstacle did not trigger crash');
      if (crash.controls.canDrive) return FAIL('driving remained enabled during crash/reset');
      if (!crash.overlays.crashFeedback && crash.result !== 'crash') return FAIL('crash lacks public feedback/result evidence');
      await game.input({ type: 'wait', durationMs: 2300 });
      const reset = await game.snapshot();
      const resetErr = validateSnapshot(reset, 'post crash reset');
      if (resetErr) return FAIL(resetErr);
      if (!sameLevel(pre, reset)) return FAIL('crash reset did not return to same level');
      if (!cleanAttempt(reset)) return FAIL('post crash reset did not clean timer/speed/held/overlays');
      return PASS(`crash=${crash.phase}/${crash.result}, reset level=${reset.level.index}`);
    }
  },
  {
    id: 'p1-6-precise-parking-success-and-reject',
    level: 'P1',
    name: 'Precise parking requires slow full alignment and rejects partial or fast contact',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('parking_approach');
      const preErr = validatePrecondition('parking_approach', pre);
      if (preErr) return FAIL(preErr);
      async function parkingHold(controls, durationMs) {
        const unique = Array.from(new Set(controls));
        if (unique.length === 1) {
          return game.input({ type: 'holdControl', control: unique[0], durationMs, source: 'contract' });
        }
        return game.input({ type: 'comboHold', controls: unique, durationMs, source: 'contract' });
      }

      let win = pre;
      let approachControl = null;
      for (let i = 0; i < 80 && win.result !== 'win'; i += 1) {
        const v = win.vehicle;
        const t = win.target;
        if (!v || !t || !finite(v.screenX) || !finite(v.screenY) ||
            !finite(v.headingDeg) || !finite(v.signedSpeed) ||
            !finite(t.screenX) || !finite(t.screenY) || !finite(t.headingDeg)) {
          return FAIL('parking snapshot lacks target-aware pose/speed observability');
        }

        const distance = Math.hypot(t.screenX - v.screenX, t.screenY - v.screenY);
        if (approachControl === null) {
          const probe = await game.input({ type: 'holdControl', control: 'forward', durationMs: 40, source: 'contract' });
          if (probe.result === 'win') {
            win = probe;
            break;
          }
          const pv = probe.vehicle;
          if (!pv || !finite(pv.screenX) || !finite(pv.screenY)) {
            return FAIL('slow parking direction probe did not expose finite public vehicle state');
          }
          const probeDistance = Math.hypot(t.screenX - pv.screenX, t.screenY - pv.screenY);
          approachControl = probeDistance < distance ? 'forward' : 'reverse';
          win = probe;
          await game.input({ type: 'releaseAllControls' });
          continue;
        }

        let controls = [];
        const fullyAligned = v.fullyInsideTarget && v.alignedWithTarget;
        if (fullyAligned && Math.abs(v.signedSpeed) > 2) {
          controls = [v.signedSpeed > 0 ? 'reverse' : 'forward'];
        } else if (!fullyAligned) {
          const braking = v.inTargetZone && Math.abs(v.signedSpeed) > 12;
          controls = [braking ? (v.signedSpeed > 0 ? 'reverse' : 'forward') : approachControl];
          const headingError = ((t.headingDeg - v.headingDeg + 540) % 360) - 180;
          if (!braking && !v.alignedWithTarget && Math.abs(headingError) > 8) {
            controls.push(headingError > 0 ? 'right' : 'left');
          }
        }
        if (controls.length === 0) {
          win = await game.input({ type: 'wait', durationMs: 80, source: 'contract' });
          continue;
        }
        win = await parkingHold(controls, v.inTargetZone ? 55 : 75);
        await game.input({ type: 'releaseAllControls' });
        if (win.result === 'win') break;
        win = await game.input({ type: 'wait', durationMs: v.inTargetZone ? 45 : 60, source: 'contract' });
      }
      if (win.result !== 'win') return FAIL('slow parking approach did not complete');
      if (!win.vehicle.fullyInsideTarget || !win.vehicle.alignedWithTarget) return FAIL('win lacks full containment and target alignment');
      if (!finite(win.vehicle.speed) || !finite(win.vehicle.signedSpeed)) return FAIL('win lacks public speed observability');
      if (win.timer.state !== 'stopped' || !win.overlays.complete || ![0, 1, 2, 3].includes(win.stars.current)) {
        return FAIL('completion did not stop timer/show overlay/expose star rating');
      }

      const badPre = await game.loadScenario('partial_or_fast_bay_contact');
      const badErr = validatePrecondition('partial_or_fast_bay_contact', badPre);
      if (badErr) return FAIL(badErr);
      const bad = await game.input({ type: 'holdControl', control: 'forward', durationMs: 700, source: 'contract' });
      if (bad.result !== 'none') return FAIL('partial or fast bay contact incorrectly completed the level');
      if (bad.overlays.complete || bad.timer.state === 'stopped') return FAIL('invalid bay contact showed completion or stopped timer');
      if (bad.vehicle.fullyInsideTarget && bad.vehicle.alignedWithTarget && abs(bad.vehicle.speed) <= abs(win.vehicle.speed)) {
        return FAIL('negative bay scenario did not expose a fast, partial, or misaligned rejection reason');
      }
      if (!bad.controls.canDrive && bad.phase !== 'crashReset') return FAIL('invalid bay contact did not remain playable/recoverable');
      return PASS(`win stars=${win.stars.current}, invalid result=${bad.result}`);
    }
  },
  {
    id: 'p1-7-pause-freezes-and-resume-preserves',
    level: 'P1',
    name: 'Pause freezes vehicle, timer, hazards, and resume preserves attempt',
    timeoutMs: 9000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('active_driving');
      const preErr = validatePrecondition('active_driving', pre);
      if (preErr) return FAIL(preErr);
      const paused = await game.input({ type: 'pause' });
      if (paused.phase !== 'paused' || !paused.overlays.pause || paused.controls.canDrive) return FAIL('pause did not enter blocking paused state');
      await browser.keyDown('ArrowUp');
      await browser.sleep(450);
      await browser.keyUp('ArrowUp');
      const afterKey = await game.snapshot();
      await game.input({ type: 'wait', durationMs: 650 });
      const afterWait = await game.snapshot();
      if (dist(paused.vehicle, afterKey.vehicle) > 0.5 || abs(afterKey.vehicle.signedSpeed - paused.vehicle.signedSpeed) > 0.5) {
        return FAIL('real driving key changed vehicle while paused');
      }
      if (Math.abs(num(afterWait.timer.elapsedMs) - num(paused.timer.elapsedMs)) > 80) return FAIL('timer advanced while paused');
      if (num(afterWait.hazards.movingMotionRevision) !== num(paused.hazards.movingMotionRevision)) return FAIL('moving hazard advanced while paused');
      const resumed = await game.input({ type: 'resume' });
      if (!['waitingInput', 'playing'].includes(resumed.phase) || resumed.overlays.blocking || !resumed.controls.canDrive) return FAIL('resume did not restore driving');
      if (dist(paused.vehicle, resumed.vehicle) > 1.5) return FAIL('resume did not preserve attempt pose');
      return PASS(`paused elapsed=${paused.timer.elapsedMs}, resumed phase=${resumed.phase}`);
    }
  },
  {
    id: 'p1-8-retry-and-next-level-clean-state',
    level: 'P1',
    name: 'Retry cleans current attempt and next level starts clean layout',
    timeoutMs: 9000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const active = await game.loadScenario('active_driving');
      const activeErr = validatePrecondition('active_driving', active);
      if (activeErr) return FAIL(activeErr);
      const retry = await game.input({ type: 'retry', from: 'play' });
      if (!sameLevel(active, retry)) return FAIL('retry changed level instead of restarting current level');
      if (!cleanAttempt(retry)) return FAIL('retry did not clear speed/timer/held/overlays');

      const complete = await game.loadScenario('completed_level');
      const completeErr = validatePrecondition('completed_level', complete);
      if (completeErr) return FAIL(completeErr);
      if (complete.level.count < 2) return FAIL('multi-level progression requires at least two levels');
      const next = await game.input({ type: 'nextLevel' });
      const nextErr = validateSnapshot(next, 'nextLevel');
      if (nextErr) return FAIL(nextErr);
      const changed = next.level.index !== complete.level.index || next.level.layoutId !== complete.level.layoutId;
      const legalCycle = complete.level.count > 1 && complete.level.index === complete.level.count - 1 && next.level.index === 0;
      if (!changed && !legalCycle) return FAIL('nextLevel did not advance to a different layout or legal cycle');
      if (!cleanAttempt(next) || next.overlays.blocking) return FAIL('nextLevel did not start a clean unblocked attempt');
      return PASS(`retry level=${retry.level.index}, next level=${next.level.index}`);
    }
  },
  {
    id: 'p1-9-moving-hazard-risk-coupling',
    level: 'P1',
    name: 'Moving hazards visibly move, freeze on pause, and couple to crash risk',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('moving_hazard_crossing');
      const preErr = validatePrecondition('moving_hazard_crossing', pre);
      if (preErr) return FAIL(preErr);
      const isCrash = (snapshot) => Boolean(snapshot && (
        snapshot.result === 'crash' ||
        snapshot.phase === 'crashReset' ||
        snapshot.overlays?.crashFeedback
      ));
      const activate = async (snapshot) => {
        if (snapshot.phase !== 'waitingInput') return snapshot;
        const started = await game.input({ type: 'holdControl', control: 'forward', durationMs: 120, source: 'contract' });
        if (isCrash(started)) return started;
        await game.input({ type: 'releaseAllControls' });
        return await game.snapshot();
      };
      const pauseAndFreeze = async (label) => {
        const paused = await game.input({ type: 'pause' });
        if (paused?.lastAction?.ok === false || paused?.phase !== 'paused' || !paused?.overlays?.pause) return label + ' pause was not accepted';
        const frozenA = num(paused.hazards.movingMotionRevision);
        await game.input({ type: 'wait', durationMs: 900 });
        const frozen = await game.snapshot();
        if (num(frozen.hazards.movingMotionRevision) !== frozenA) return label + ' moving hazard did not freeze under pause';
        const resumed = await game.input({ type: 'resume' });
        if (resumed?.lastAction?.ok === false || resumed?.overlays?.pause) return label + ' resume was not accepted';
        return null;
      };
      if (pre.phase === 'waitingInput') {
        const waitingPauseErr = await pauseAndFreeze('waitingInput');
        if (waitingPauseErr) return FAIL(waitingPauseErr);
      }
      const activeSource = pre.phase === 'waitingInput'
        ? await game.loadScenario('moving_hazard_crossing')
        : pre;
      const activeErr = validatePrecondition('moving_hazard_crossing', activeSource);
      if (activeErr) return FAIL(activeErr);
      const activePre = await activate(activeSource);
      const activePreErr = validateSnapshot(activePre, 'active moving precondition');
      if (activePreErr) return FAIL(activePreErr);
      if (isCrash(activePre) || activePre.result !== 'none' || !activePre.controls.canDrive) return FAIL('moving_hazard_crossing did not reach active driving');
      const observeActiveMotion = async (snapshot) => {
        const initialRevision = num(snapshot?.hazards?.movingMotionRevision);
        let latest = snapshot;
        for (let i = 0; i < 20; i += 1) {
          latest = await game.input({ type: 'wait', durationMs: 60 });
          if (isCrash(latest)) return { snapshot: latest, error: 'moving_hazard_crossing crashed before active motion could be paused' };
          if (num(latest?.hazards?.movingMotionRevision) !== initialRevision) {
            return { snapshot: latest, error: null };
          }
        }
        return { snapshot: latest, error: 'moving hazard did not visibly advance while active' };
      };
      const activeMotion = await observeActiveMotion(activePre);
      if (activeMotion.error) return FAIL(activeMotion.error);
      const moved = activeMotion.snapshot;
      const pauseErr = await pauseAndFreeze('active');
      if (pauseErr) return FAIL(pauseErr);
      const riskPre = await game.loadScenario('moving_hazard_crossing');
      const riskErr = validatePrecondition('moving_hazard_crossing', riskPre);
      if (riskErr) return FAIL(riskErr);
      const movingDistance = (snapshot) => finite(snapshot?.hazards?.nearestMovingDistance)
        ? snapshot.hazards.nearestMovingDistance
        : null;
      const vehicleClearance = (snapshot) => {
        const bounds = snapshot?.vehicle?.bounds;
        if (!finite(bounds?.width) || !finite(bounds?.height)) return null;
        return Math.max(bounds.width, bounds.height) * 0.75;
      };
      let movingRiskObserved = false;
      let advancedTowardRoute = false;
      const noteMovingRisk = (snapshot) => {
        const distance = movingDistance(snapshot);
        const clearance = vehicleClearance(snapshot);
        if (distance !== null && clearance !== null && distance <= clearance) movingRiskObserved = true;
      };
      const crashAttributableToMovingHazard = (snapshot) => {
        noteMovingRisk(snapshot);
        if (!isCrash(snapshot)) return false;
        const distance = movingDistance(snapshot);
        const clearance = vehicleClearance(snapshot);
        const solidDistance = snapshot?.hazards?.nearestSolidDistance;
        if (distance !== null && finite(solidDistance) && distance > solidDistance) return false;
        return movingRiskObserved ||
          (advancedTowardRoute && (distance === null || snapshot?.hazards?.movingVisible === true)) ||
          (distance !== null && clearance !== null && distance <= clearance);
      };
      let risk = await activate(riskPre);
      if (isCrash(risk)) return FAIL('moving_hazard_crossing crashed during activation');
      let crash = null;
      for (let i = 0; i < 140; i += 1) {
        if (crashAttributableToMovingHazard(risk)) {
          crash = risk;
          break;
        }
        const distance = movingDistance(risk);
        const clearance = vehicleClearance(risk);
        // Keep the initial crossing window for fixtures already near the traffic route.
        // If no collision occurs, advance in short segments with released waiting intervals.
        const drive = i < 60
          ? !(distance !== null && clearance !== null && distance > clearance)
          : i % 2 === 0;
        const durationMs = i < 60 ? 90 : 180;
        const action = drive
          ? { type: 'holdControl', control: 'forward', durationMs, source: 'contract' }
          : { type: 'wait', durationMs };
        const next = await game.input(action);
        if (dist(risk.vehicle, next?.vehicle) > 0.5) advancedTowardRoute = true;
        if (crashAttributableToMovingHazard(next)) {
          crash = next;
          break;
        }
        risk = next;
        if (action.type === 'holdControl') {
          const released = await game.input({ type: 'releaseAllControls' });
          if (crashAttributableToMovingHazard(released)) {
            crash = released;
            break;
          }
          risk = await game.snapshot();
          if (crashAttributableToMovingHazard(risk)) {
            crash = risk;
            break;
          }
        }
      }
      if (!crash) return FAIL('bounded waiting and forward entry did not produce a crash attributable to a moving hazard');
      return PASS('moving revision ' + activePre.hazards.movingMotionRevision + '->' + moved.hazards.movingMotionRevision + ', crash=' + crash.result);
    }
  },
  {
    id: 'p1-10-invalid-action-invariants',
    level: 'P1',
    name: 'Invalid public actions and modal driving reject without state corruption',
    timeoutMs: 8000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('level_start');
      const preErr = validatePrecondition('level_start', pre);
      if (preErr) return FAIL(preErr);
      const before = stableAttemptFields(pre);
      const invalid = await game.input({ type: 'holdControl', control: 'sideways', durationMs: -50, source: 'contract' });
      if (!(invalid.lastAction && (invalid.lastAction.ok === false || invalid.lastAction.rejected === true))) return FAIL('invalid action did not return rejected lastAction');
      if (!['invalidControl', 'ruleRejected', 'unsupported', 'notAvailable'].includes(invalid.lastAction.reason)) return FAIL(`invalid action reason not in contract: ${invalid.lastAction.reason}`);
      const after = stableAttemptFields(invalid);
      if (before !== after) return FAIL('invalid action mutated attempt fields');

      const complete = await game.loadScenario('completed_level');
      const completeBaseErr = validateSnapshot(complete, 'completed_level precondition');
      if (completeBaseErr) return FAIL(completeBaseErr);
      if (complete.lastAction && complete.lastAction.type === 'loadScenario' && complete.lastAction.ok === false) {
        return FAIL(`completed_level was rejected unexpectedly: ${complete.lastAction.reason || 'unknown'}`);
      }
      if (complete.result !== 'win' || !complete.overlays.complete) {
        return FAIL('completed_level must be a visible completed precondition');
      }
      const driveComplete = await game.input({ type: 'holdControl', control: 'forward', durationMs: 500, source: 'contract' });
      if (driveComplete.result !== 'win' || driveComplete.phase !== 'complete') return FAIL('terminal complete state did not remain locked after driving input');
      if (dist(complete.vehicle, driveComplete.vehicle) > 0.5 || num(driveComplete.timer.elapsedMs) !== num(complete.timer.elapsedMs)) {
        return FAIL('driving input changed pose/timer in complete state');
      }
      return PASS(`invalid reason=${invalid.lastAction.reason}, terminal locked`);
    }
  },
  {
    id: 'p2-1-progress-record-does-not-pollute-reset',
    level: 'P2',
    name: 'Progress or best record does not pollute fresh attempts',
    timeoutMs: 8000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const complete = await game.loadScenario('completed_level');
      const completeErr = validatePrecondition('completed_level', complete);
      if (completeErr) return FAIL(completeErr);
      const completedLevels = num(complete.progress.completedLevels);
      const bestCount = complete.stars.bestByLevel && typeof complete.stars.bestByLevel === 'object' ? Object.keys(complete.stars.bestByLevel).length : 0;
      const next = await game.input({ type: 'nextLevel' });
      const reset = await game.reset();
      if (reset.result !== 'none' || reset.overlays.complete) return FAIL('fresh reset inherited completed result/overlay');
      if (num(reset.progress.completedLevels) < completedLevels) return FAIL('progress summary regressed after reset');
      const resetBestCount = reset.stars.bestByLevel && typeof reset.stars.bestByLevel === 'object' ? Object.keys(reset.stars.bestByLevel).length : 0;
      if (resetBestCount < bestCount) return FAIL('bestByLevel summary regressed after reset');
      if (next.result !== 'none' || next.timer.state !== 'idle') return FAIL('next level after completion did not start as a fresh attempt');
      return PASS(`progress=${reset.progress.completedLevels}, bestRecords=${resetBestCount}`);
    }
  },
  {
    id: 'p2-2-editor-optional-visible-operations',
    level: 'P2',
    name: 'Optional editor has visible object operations and returns to driving',
    timeoutMs: 9000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const editor = await game.loadScenario('editor_ready');
      if (editor && editor.lastAction && editor.lastAction.reason === 'unsupported') {
        return PASS('editor_ready unsupported as allowed P2 optional feature');
      }
      const editorErr = validatePrecondition('editor_ready', editor);
      if (editorErr) return FAIL(editorErr);
      if (editor.phase !== 'editor') return FAIL('editor_ready did not enter editor phase');
      const beforeRev = num(editor.playfield.renderRevision);
      const place = await game.input({ type: 'editor', command: 'placeAt', x: editor.playfield.bounds.left + editor.playfield.bounds.width / 2, y: editor.playfield.bounds.top + editor.playfield.bounds.height / 2 });
      if (place.lastAction && place.lastAction.ok === false) return FAIL(`editor placeAt rejected: ${place.lastAction.reason || 'unknown'}`);
      if (num(place.playfield.renderRevision) === beforeRev) return FAIL('editor placeAt did not visibly change work surface');
      const del = await game.input({ type: 'editor', command: 'deleteSelected' });
      if (del.lastAction && del.lastAction.ok === false) return FAIL(`editor deleteSelected rejected: ${del.lastAction.reason || 'unknown'}`);
      const exit = await game.input({ type: 'editor', command: 'exit' });
      if (exit.phase === 'editor' || exit.overlays.blocking || !exit.controls.canDrive) return FAIL('exiting editor did not restore unblocked driving');
      return PASS(`editor revision ${beforeRev}->${place.playfield.renderRevision}`);
    }
  }
];

module.exports = { suite };
