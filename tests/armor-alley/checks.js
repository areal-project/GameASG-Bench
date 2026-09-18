// === GDD Coverage Map ===
// M1 start/reset/battle flow -> p0-boot-contract, p0-start-playfield, p1-menu-pause-restart
// M2 continuous helicopter flight and risk -> p1-pointer-flight-direction-opposite, p1-flight-center-counter-trend, p1-flight-risk-coupled
// M3 helicopter weapons and soldier drops -> p1-keyboard-sustained-fire-release, p1-bomb-cost-impact, p1-guided-target-reject, p1-soldier-drop-support
// M4 landing/refit -> p1-landing-refit-takeoff
// M5 production economy -> p1-production-order-queue-spawn, p1-production-rejection-invariant
// M6 autonomous ground war -> p1-autonomous-ground-war-motion
// M7 convoy victory/base failure -> p1-convoy-result-locks
// M8 control points/hazards -> p1-control-point-or-hazard-feedback
// M9 HUD/radar/tactical feedback -> p0-start-playfield, p1-hud-radar-sync
// M10 pause/modal/result invariants -> p1-menu-pause-restart, p1-production-rejection-invariant, p1-modal-result-resource-invariants
// M11 advanced entries/preferences -> p2-advanced-entry-flex, p2-settings-preference-blocking
// M12 extended battlefield flavor -> p2-radar-weather-variant
//
// === Category Map ===
// Boot & Stability -> p0-boot-contract, p0-start-playfield
// UI Flow & Blocking -> p1-menu-pause-restart
// Input Semantics -> p1-pointer-flight-direction-opposite, p1-flight-center-counter-trend
// Core Mechanic Loop -> p1-flight-risk-coupled, p1-keyboard-sustained-fire-release, p1-bomb-cost-impact, p1-guided-target-reject, p1-soldier-drop-support, p1-landing-refit-takeoff, p1-autonomous-ground-war-motion, p1-control-point-or-hazard-feedback
// Economy / Progression -> p1-production-order-queue-spawn
// Invariants & Rejection -> p1-production-rejection-invariant, p1-modal-result-resource-invariants
// State Machine -> p1-convoy-result-locks
// Feedback & Observability -> p1-hud-radar-sync
// Depth / Optional Systems -> p2-advanced-entry-flex, p2-radar-weather-variant, p2-settings-preference-blocking
//
// === Rationality Map ===
// p1-menu-pause-restart: real action: contract pause/resume/restart after battle start | independent observation: phase/overlay plus frozen revisions and cleared result | empty-shell failure: label-only pause or stale result cannot satisfy freeze/restart invariants
// p1-pointer-flight-direction-opposite: real action: browser.mouseMove to runtime playfield points from public geometry | independent observation: helicopter screen delta/trend and worldRevision | empty-shell failure: no movement or mirrored/same response fails direction opposite sign checks
// p1-flight-center-counter-trend: real action: contract setFlightIntent, centerFlightIntent, opposite intent | independent observation: movement deltas/trends across equal waits | empty-shell failure: teleport-only, ignored center, or instant freeze fails trend comparison
// p1-flight-risk-coupled: real action: move toward semantic hazard target and wait | independent observation: health/alive/combat/effects/notification changes from safe precondition | empty-shell failure: decorative hazard or pre-damaged scenario fails trigger-causality
// p1-keyboard-sustained-fire-release: real action: browser.keyDown/browser.keyUp without contract fire rescue | independent observation: ammo/projectile/combat revision growth then release plateau | empty-shell failure: fire flag without projectile/cost/release behavior fails
// p1-bomb-cost-impact: real action: dropBomb from legal airborne attack scenario | independent observation: bomb stock cost plus projectile/effect/combat evidence and unrelated resource invariant | empty-shell failure: stock-only decrement or free explosion fails cost-benefit chain
// p1-guided-target-reject: real action: select visible semantic target, launch guided weapon, then weapon_rejection invalid launch | independent observation: stock/projectile/combat target evidence and rejection feedback | empty-shell failure: always-success launch or fake target flag fails valid/invalid contrast
// p1-soldier-drop-support: real action: dropSoldier and wait from legal support opportunity | independent observation: onboard soldier decrease plus airborne/ground soldier or support revision | empty-shell failure: counter-only drop or pre-captured support state fails
// p1-landing-refit-takeoff: real action: landOrRefit, timed waits, takeOff/upward intent | independent observation: landed/refitting state, gradual resource/refit trend, mobility suppressed/restored | empty-shell failure: instant refill or landed helicopter still flying fails
// p1-production-order-queue-spawn: real action: order affordable unit and wait | independent observation: funds cost, queue growth, production HUD revision, later public unit evidence | empty-shell failure: direct spawn without cost/queue or cost-only shell fails
// p1-production-rejection-invariant: real action: blocked order from production_rejection | independent observation: lastAction rejection/notification and funds/queue/unit invariants | empty-shell failure: fake rejection that spends funds or grows queue fails
// p1-autonomous-ground-war-motion: real action: wait during active ground war | independent observation: worldMotion plus combat/entity/convoy/radar changes | empty-shell failure: static counters or background-only animation fails
// p1-convoy-result-locks: real action: wait from near-terminal convoy scenarios then ordinary inputs | independent observation: victory/defeat result, result revision, terminal lock and restart recovery | empty-shell failure: preloaded result or terminal state accepting orders fails
// p1-control-point-or-hazard-feedback: real action: soldier/order/attack or hazard movement from legal control-point/hazard scenario | independent observation: bunker/turret/hazard/combat/notification/radar changes after trigger | empty-shell failure: inert scenery or setup-only ownership changes fail
// p1-hud-radar-sync: real action: movement/production/combat wait sequence | independent observation: snapshot field change paired with HUD/radar/notification revisions | empty-shell failure: fake radar/HUD disconnected from world state fails
// p1-modal-result-resource-invariants: real action: pause/settings/result attempts with ordinary weapon/order/flight | independent observation: blocked phase plus resource/revision invariants and rejection reason | empty-shell failure: overlay flag alone fails if simulation/resources mutate
// p2-advanced-entry-flex: real action: advanced start or visible advanced entry if supported | independent observation: playable advanced battle or graceful rejection with P1 recovery | empty-shell failure: advanced UI that blocks normal play fails
// p2-radar-weather-variant: real action: variant scenario/settings plus movement/wait | independent observation: radar degradation/hazard variant and P1 path still works | empty-shell failure: cosmetic toggle that desynchronizes radar or breaks controls fails
// p2-settings-preference-blocking: real action: openSettings/closeSettings and optional preference click | independent observation: overlay blocks play, accepted setting changes public option/revision, close restores play | empty-shell failure: static settings panel that neither blocks nor restores play fails

const PASS = (detail) => ({ status: 'PASS', detail });
const FAIL = (detail) => ({ status: 'FAIL', detail });
const NA = (detail) => ({ status: 'NOT_APPLICABLE', detail });

function num(v, fallback = 0) {
  return Number.isFinite(Number(v)) ? Number(v) : fallback;
}

function clonePublic(v) {
  return JSON.parse(JSON.stringify(v == null ? null : v));
}

function rev(s, key) {
  return num(s?.revisions?.[key], 0);
}

function count(s, key) {
  return num(s?.entityCounts?.[key], 0);
}

function signOfDelta(a, b, trend) {
  const delta = num(b) - num(a);
  if (Math.abs(delta) > 0.5) return Math.sign(delta);
  if (trend === 'right' || trend === 'down') return 1;
  if (trend === 'left' || trend === 'up') return -1;
  return 0;
}

function signOfMotion(beforeH, afterH, axis) {
  const trend = axis === 'x' ? afterH?.velocityXTrend : afterH?.velocityYTrend;
  if (trend === 'right' || trend === 'down') return 1;
  if (trend === 'left' || trend === 'up') return -1;
  if (axis === 'x') {
    const progressSign = signOfDelta(beforeH?.worldProgress, afterH?.worldProgress);
    if (progressSign) return progressSign;
    return signOfDelta(beforeH?.screenX, afterH?.screenX, afterH?.velocityXTrend);
  }
  return signOfDelta(beforeH?.screenY, afterH?.screenY, afterH?.velocityYTrend);
}

function changedAny(before, after, pairs) {
  return pairs.some(([path, label]) => {
    const a = readPath(before, path);
    const b = readPath(after, path);
    return JSON.stringify(a) !== JSON.stringify(b) || (label && label(before, after));
  });
}

function readPath(obj, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}

function resources(s) {
  return {
    funds: num(s?.economy?.funds),
    ammo: num(s?.helicopter?.ammo?.current),
    bombs: num(s?.helicopter?.bombs?.current),
    guided: num(s?.helicopter?.guidedWeapons?.current),
    soldiers: num(s?.helicopter?.soldiers?.onboard),
    queue: num(s?.economy?.queueLength)
  };
}

function sameResourceSubset(a, b, keys) {
  const ra = resources(a);
  const rb = resources(b);
  return keys.every((key) => ra[key] === rb[key]);
}

function requireContract(s) {
  const missing = [];
  for (const key of ['phase', 'screen', 'result', 'playfield', 'helicopter', 'economy', 'entityCounts', 'revisions', 'radar', 'lastAction', 'notifications']) {
    if (!(key in (s || {}))) missing.push(key);
  }
  return missing;
}

function createGameDriver(browser) {
  async function call(method, arg1, arg2) {
    const args = [arg1, arg2].filter((v) => v !== undefined).map((v) => JSON.stringify(v)).join(',');
    return await browser.eval(`
      (async function() {
        const api = window.__gameTest;
        if (!api || typeof api.${method} !== 'function') return { __missingContract: '${method}' };
        return await api.${method}(${args});
      })()
    `);
  }

  return {
    async snapshot() {
      return clonePublic(await call('getSnapshot'));
    },
    async reset(options) {
      return clonePublic(await call('reset', options || {}));
    },
    async loadScenario(name, options) {
      return clonePublic(await call('loadScenario', name, options || {}));
    },
    async input(action) {
      return clonePublic(await call('input', action));
    },
    async wait(durationMs = 250) {
      const snap = clonePublic(await call('input', { type: 'wait', durationMs }));
      await browser.sleep(Math.min(Math.max(durationMs, 50), 1000));
      return snap;
    },
    async realStartClick() {
      const point = await browser.eval(`
        (function() {
          const words = /start|play|battle|tutorial|single/i;
          const els = Array.from(document.querySelectorAll('button,a,[role="button"],[data-game-control],[data-action]'))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              const text = [el.getAttribute('aria-label'), el.getAttribute('data-game-control'), el.getAttribute('data-action'), el.textContent].join(' ');
              return r.width > 8 && r.height > 8 && r.bottom >= 0 && r.right >= 0 && words.test(text || '');
            });
          const el = els[0];
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        })()
      `);
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        await browser.mouseClick(point.x, point.y);
        await browser.sleep(300);
        return true;
      }
      return false;
    },
    pointerPoint(direction, s) {
      const b = s?.playfield?.bounds;
      if (!b || !Number.isFinite(Number(b.left)) || !Number.isFinite(Number(b.top)) || !Number.isFinite(Number(b.width)) || !Number.isFinite(Number(b.height))) {
        throw new Error('missing public playfield bounds for pointer flight');
      }
      if (!Number.isFinite(Number(s?.helicopter?.screenX)) || !Number.isFinite(Number(s?.helicopter?.screenY))) {
        throw new Error('missing public helicopter screen point for pointer flight');
      }
      const hx = Number(s.helicopter.screenX);
      const hy = Number(s.helicopter.screenY);
      const dx = direction === 'left' ? -Math.max(80, b.width * 0.25) : direction === 'right' ? Math.max(80, b.width * 0.25) : 0;
      const dy = direction === 'up' ? -Math.max(60, b.height * 0.22) : direction === 'down' ? Math.max(60, b.height * 0.22) : 0;
      const x = Math.max(b.left + 4, Math.min(b.left + b.width - 4, hx + dx));
      const y = Math.max(b.top + 4, Math.min(b.top + b.height - 4, hy + dy));
      const startX = Math.max(b.left + 4, Math.min(b.left + b.width - 4, hx));
      const startY = Math.max(b.top + 4, Math.min(b.top + b.height - 4, hy));
      return { x, y, dx, dy, startX, startY };
    },
    async realPointerPressMoveRelease(startX, startY, x, y) {
      if (browser.cdp && typeof browser.cdp.send === 'function') {
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: startX, y: startY, modifiers: 0 });
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: startX, y: startY, button: 'left', clickCount: 1, modifiers: 0 });
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1, modifiers: 0, movementX: x - startX, movementY: y - startY });
        await browser.sleep(160);
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, modifiers: 0 });
      } else {
        await browser.mouseClick(startX, startY);
        await browser.mouseMove(x, y, x - startX, y - startY);
      }
    },
    async movePointerRealOnly(direction, s) {
      const p = this.pointerPoint(direction, s);
      await this.realPointerPressMoveRelease(p.startX, p.startY, p.x, p.y);
      return this.snapshot();
    },
    async movePointerContract(direction, durationMs = 300) {
      return this.input({ type: 'setFlightIntent', direction, durationMs });
    },
    async movePointerTowardRealOnly(point, s) {
      const b = s?.playfield?.bounds;
      if (!b || !Number.isFinite(Number(b.left)) || !Number.isFinite(Number(b.top)) || !Number.isFinite(Number(b.width)) || !Number.isFinite(Number(b.height))) {
        throw new Error('missing public playfield bounds for pointer target');
      }
      if (!Number.isFinite(Number(s?.helicopter?.screenX)) || !Number.isFinite(Number(s?.helicopter?.screenY))) {
        throw new Error('missing public helicopter screen point for pointer target');
      }
      const hx = Number(s.helicopter.screenX);
      const hy = Number(s.helicopter.screenY);
      const rawTx = Number(point?.screenX);
      const rawTy = Number(point?.screenY);
      const tx = Math.max(b.left + 4, Math.min(b.left + b.width - 4, rawTx));
      const ty = Math.max(b.top + 4, Math.min(b.top + b.height - 4, rawTy));
      const startX = Math.max(b.left + 4, Math.min(b.left + b.width - 4, hx));
      const startY = Math.max(b.top + 4, Math.min(b.top + b.height - 4, hy));
      await this.realPointerPressMoveRelease(startX, startY, tx, ty);
      return this.snapshot();
    }
  };
}

async function legalScenario(game, name, predicate, description) {
  const s = await game.loadScenario(name);
  const missing = requireContract(s);
  if (missing.length) return { ok: false, snap: s, detail: `${name} missing snapshot fields: ${missing.join(',')}` };
  if (!predicate(s)) return { ok: false, snap: s, detail: `${name} illegal precondition: ${description}` };
  return { ok: true, snap: s };
}

async function startPlayable(game) {
  await game.loadScenario('menu_ready');
  let s = await game.input({ type: 'startBattle', mode: 'tutorial' });
  if (s?.phase !== 'playing') s = await game.reset({ start: true });
  return s;
}

async function waitUntil(game, before, predicate, options = {}) {
  const totalMs = num(options.totalMs, 6000);
  const stepMs = num(options.stepMs, 500);
  let elapsed = 0;
  let latest = before;
  while (elapsed < totalMs) {
    latest = await game.wait(Math.min(stepMs, totalMs - elapsed));
    if (predicate(latest, before, elapsed + stepMs)) return { ok: true, snap: latest, elapsedMs: elapsed + stepMs };
    elapsed += stepMs;
  }
  return { ok: false, snap: latest, elapsedMs: elapsed };
}

async function attemptAirSupport(game, preferredTarget = 'nearestThreat', trace = null) {
  const record = (label, snap) => {
    if (trace) trace.push({ label, snapshot: { result: snap?.result, timeMs: snap?.timeMs, convoy: snap?.convoy, helicopter: snap?.helicopter, entityCounts: snap?.entityCounts, revisions: snap?.revisions, lastAction: snap?.lastAction, notifications: snap?.notifications } });
    return snap;
  };
  const before = await game.snapshot();
  record('before', before);
  const target = (before.visibleTargets || []).find((t) => {
    const actions = t.availableActions || [];
    return actions.includes('launchGuidedWeapon') || actions.includes('dropBomb') || actions.includes('holdFire');
  });
  const targetSpec = preferredTarget || target?.id;
  if (!preferredTarget && target) record('selectVisibleTarget', await game.input({ type: 'selectVisibleTarget', target: target.id }));
  const guidedAvailable = Math.max(0, Math.floor(num(before.helicopter?.guidedWeapons?.current, 0)));
  for (let i = 0; i < guidedAvailable; i += 1) {
    record(`launchGuidedWeapon:${i + 1}`, await game.input({ type: 'launchGuidedWeapon', target: targetSpec }));
    if (i + 1 < guidedAvailable) record(`cooldown:${i + 1}`, await game.wait(1500));
  }
  record('dropBomb', await game.input({ type: 'dropBomb' }));
  record('holdFire', await game.input({ type: 'holdFire', value: true, durationMs: 6000 }));
  record('fireWindow', await game.wait(6000));
  return record('releaseFire', await game.input({ type: 'holdFire', value: false }));
}

const suite = [
  {
    id: 'p0-boot-contract',
    level: 'P0',
    name: 'Boot exposes stable public contract',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.reset({ start: false });
      if (s?.__missingContract) return FAIL(`missing __gameTest.${s.__missingContract}`);
      const missing = requireContract(s);
      if (missing.length) return FAIL(`snapshot missing ${missing.join(',')}`);
      if (!['loading', 'menu', 'briefing', 'playing', 'paused', 'settings', 'result'].includes(s.phase)) return FAIL(`invalid phase ${s.phase}`);
      if (!['none', 'victory', 'defeat'].includes(s.result)) return FAIL(`invalid result ${s.result}`);
      return PASS(`contract ready at ${s.phase}/${s.screen}`);
    }
  },
  {
    id: 'p0-start-playfield',
    level: 'P0',
    name: 'Start battle reveals playable field',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.realStartClick();
      const s = await startPlayable(game);
      const ok = s.phase === 'playing' && s.screen === 'battle' && s.playfield?.visible && s.helicopter?.visible && s.radar?.visible && s.canInteractWithPlayfield && s.overlayBlocking === false;
      if (!ok) return FAIL(`not playable: phase=${s.phase} screen=${s.screen} playfield=${!!s.playfield?.visible} heli=${!!s.helicopter?.visible} radar=${!!s.radar?.visible} blocked=${s.overlayBlocking}`);
      return PASS('battle playfield, helicopter, HUD/radar, and interaction are visible');
    }
  },
  {
    id: 'p1-menu-pause-restart',
    level: 'P1',
    name: 'Pause freezes battle and restart clears stale result',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const started = await legalScenario(game, 'pause_guard', (s) => s.phase === 'playing' && s.result === 'none', 'must start active and non-terminal');
      if (!started.ok) return FAIL(started.detail);
      const beforeAdvance = await game.wait(350);
      const pause = await game.input({ type: 'pause' });
      if (!(pause.phase === 'paused' || pause.overlayBlocking === true || pause.canInteractWithPlayfield === false)) return FAIL('pause did not block playfield');
      const duringA = await game.snapshot();
      const duringB = await game.wait(500);
      const frozen = rev(duringA, 'worldMotion') === rev(duringB, 'worldMotion') && rev(duringA, 'production') === rev(duringB, 'production') && rev(duringA, 'refit') === rev(duringB, 'refit') && rev(duringA, 'result') === rev(duringB, 'result');
      if (!frozen) return FAIL('pause allowed world/production/refit/result revisions to advance');
      const resumed = await game.input({ type: 'resume' });
      if (resumed.phase !== 'playing' || resumed.overlayBlocking) return FAIL('resume did not restore active play');
      const restart = await game.input({ type: 'restart' });
      if (restart.result !== 'none' || restart.overlayBlocking || !restart.playfield?.visible) return FAIL('restart left stale result/blocking state');
      if (rev(beforeAdvance, 'worldMotion') === 0 && rev(resumed, 'worldMotion') === 0) return FAIL('scenario did not demonstrate resumable battle progress');
      return PASS('pause freezes progress, resume restores play, restart clears stale state');
    }
  },
  {
    id: 'p1-pointer-flight-direction-opposite',
    level: 'P1',
    name: 'Pointer flight direction opposite axes are correct',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function sample(direction) {
        const setup = await legalScenario(game, 'flight_control_sample', (s) => s.phase === 'playing' && s.helicopter?.visible && s.helicopter?.airborne && s.result === 'none', 'helicopter must be airborne and visible');
        if (!setup.ok) return { error: setup.detail };
        const base = setup.snap;
        await game.movePointerRealOnly(direction, base);
        const after = await game.wait(600);
        return { base, after };
      }
      const r = await sample('right');
      const l = await sample('left');
      const u = await sample('up');
      const d = await sample('down');
      for (const sampled of [r, l, u, d]) {
        if (sampled.error) return FAIL(sampled.error);
      }

      const sxRight = signOfMotion(r.base.helicopter, r.after.helicopter, 'x');
      const sxLeft = signOfMotion(l.base.helicopter, l.after.helicopter, 'x');
      const syUp = signOfMotion(u.base.helicopter, u.after.helicopter, 'y');
      const syDown = signOfMotion(d.base.helicopter, d.after.helicopter, 'y');
      const horizontalOpposite = sxRight > 0 && sxLeft < 0 && Math.sign(sxRight) !== Math.sign(sxLeft);
      const verticalOpposite = syUp < 0 && syDown > 0 && Math.sign(syUp) !== Math.sign(syDown);
      if (!horizontalOpposite || !verticalOpposite) return FAIL(`direction opposite failed: right=${sxRight} left=${sxLeft} up=${syUp} down=${syDown}`);
      if (rev(r.base, 'worldMotion') === rev(d.after, 'worldMotion') && num(r.base.worldRevision) === num(d.after.worldRevision)) return FAIL('world did not advance during sustained flight inputs');
      return PASS('left/right and up/down produce opposite visible movement signs');
    }
  },
  {
    id: 'p1-flight-center-counter-trend',
    level: 'P1',
    name: 'Center and counter intent calm flight trend',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'flight_control_sample', (s) => s.helicopter?.airborne && s.result === 'none', 'safe airborne sample required');
      if (!setup.ok) return FAIL(setup.detail);
      const before = await game.snapshot();
      await game.input({ type: 'setFlightIntent', direction: 'right', durationMs: 4000 });
      const far = await game.wait(500);
      await game.input({ type: 'centerFlightIntent', durationMs: 4000 });
      const centered = await game.wait(500);
      await game.input({ type: 'setFlightIntent', direction: 'left', durationMs: 4000 });
      const counter = await game.wait(500);
      const farDelta = Math.abs(num(far.helicopter?.screenX) - num(before.helicopter?.screenX));
      const centerDelta = Math.abs(num(centered.helicopter?.screenX) - num(far.helicopter?.screenX));
      const farSign = signOfMotion(before.helicopter, far.helicopter, 'x');
      const counterSign = signOfMotion(centered.helicopter, counter.helicopter, 'x');
      if (farSign <= 0) return FAIL('far right intent did not create rightward trend');
      if (!(centerDelta <= farDelta || ['neutral', 'left'].includes(centered.helicopter?.velocityXTrend))) return FAIL(`center did not calm trend: farDelta=${farDelta} centerDelta=${centerDelta}`);
      if (!(counterSign < 0 && Math.sign(farSign) !== Math.sign(counterSign))) return FAIL(`counter intent did not reverse sign: far=${farSign} counter=${counterSign}`);
      if (!counter.helicopter?.alive || !counter.helicopter?.airborne) return FAIL('safe control sample killed or landed helicopter');
      return PASS('center calms movement and opposite intent reverses trend without teleport pass');
    }
  },
  {
    id: 'p1-flight-risk-coupled',
    level: 'P1',
    name: 'Flight risk is caused by movement into hazard',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'air_hazard_nearby', (s) => s.phase === 'playing' && s.result === 'none' && s.helicopter?.alive && (count(s, 'airHazards') > 0 || (s.visibleTargets || []).some((t) => t.type === 'airHazard')), 'must start alive with hazard visible');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      const hazard = (before.visibleTargets || []).find((t) => t.type === 'airHazard' || t.type === 'threat') || null;
      if (hazard && Number.isFinite(Number(hazard.screenX)) && Number.isFinite(Number(hazard.screenY))) {
        await game.movePointerTowardRealOnly(hazard, before);
      } else {
        await game.movePointerRealOnly('down', before);
      }
      const waited = await waitUntil(game, before, (after) => {
        return before.helicopter?.healthState !== after.helicopter?.healthState ||
          before.helicopter?.alive !== after.helicopter?.alive ||
          rev(after, 'combat') > rev(before, 'combat') ||
          count(after, 'explosionsOrDamageEffects') > count(before, 'explosionsOrDamageEffects') ||
          ['damage', 'warning'].includes(after.notifications?.latestKind);
      }, { totalMs: 4000, stepMs: 500 });
      const after = waited.snap;
      const feedback = before.helicopter?.healthState !== after.helicopter?.healthState || before.helicopter?.alive !== after.helicopter?.alive || rev(after, 'combat') > rev(before, 'combat') || count(after, 'explosionsOrDamageEffects') > count(before, 'explosionsOrDamageEffects') || ['damage', 'warning'].includes(after.notifications?.latestKind);
      if (!feedback) return FAIL('movement into hazard did not produce damage/combat/notification evidence');
      if (before.result !== 'none') return FAIL('scenario was already terminal before hazard trigger');
      return PASS('hazard feedback follows player movement from a safe precondition');
    }
  },
  {
    id: 'p1-keyboard-sustained-fire-release',
    level: 'P1',
    name: 'Keyboard sustained fire starts and releases',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'air_attack_with_targets', (s) => s.phase === 'playing' && s.result === 'none' && s.helicopter?.airborne, 'air attack must be active and airborne');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      await browser.keyDown('Space');
      await browser.sleep(650);
      const held = await game.snapshot();
      await browser.keyUp('Space');
      await browser.sleep(300);
      const released = await game.snapshot();
      const afterRelease = await game.wait(550);
      const grewWhileHeld = count(held, 'projectiles') > count(before, 'projectiles') || rev(held, 'projectiles') > rev(before, 'projectiles') || rev(held, 'combat') > rev(before, 'combat') || num(held.helicopter?.ammo?.current) < num(before.helicopter?.ammo?.current);
      const plateauAfterRelease = count(afterRelease, 'projectiles') <= count(released, 'projectiles') + 1 || rev(afterRelease, 'projectiles') === rev(released, 'projectiles');
      if (!grewWhileHeld) return FAIL('held fire did not create projectile/combat/ammo evidence');
      if (!plateauAfterRelease) return FAIL('fire continued growing after release');
      return PASS('real key path creates and stops sustained fire without contract fire rescue');
    }
  },
  {
    id: 'p1-bomb-cost-impact',
    level: 'P1',
    name: 'Bomb release has stock cost and impact evidence',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'air_attack_with_targets', (s) => s.result === 'none' && s.helicopter?.airborne && num(s.helicopter?.bombs?.current) > 0, 'must have bombs and legal airborne context');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      const dropped = await game.input({ type: 'dropBomb' });
      const after = await game.wait(900);
      const cost = num(dropped.helicopter?.bombs?.current) < num(before.helicopter?.bombs?.current) || num(after.helicopter?.bombs?.current) < num(before.helicopter?.bombs?.current);
      const impact = count(dropped, 'projectiles') > count(before, 'projectiles') || count(after, 'explosionsOrDamageEffects') > count(before, 'explosionsOrDamageEffects') || rev(after, 'combat') > rev(before, 'combat') || rev(after, 'projectiles') > rev(before, 'projectiles');
      if (!cost) return FAIL('valid bomb did not decrease bomb stock');
      if (!impact) return FAIL('bomb stock cost had no projectile/impact/combat evidence');
      if (!sameResourceSubset(before, dropped, ['funds', 'guided', 'soldiers'])) return FAIL('bomb action changed unrelated funds/guided/soldier resources');
      return PASS('bomb costs stock and creates downstream impact evidence with unrelated resources preserved');
    }
  },
  {
    id: 'p1-guided-target-reject',
    level: 'P1',
    name: 'Guided weapon requires target and rejects invalid launch',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'air_attack_with_targets', (s) => s.result === 'none' && num(s.helicopter?.guidedWeapons?.current) > 0 && (s.visibleTargets || []).length > 0, 'guided stock and visible target required');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      const target = (before.visibleTargets || []).find((t) => (t.availableActions || []).includes('launchGuidedWeapon')) || before.visibleTargets[0];
      await game.input({ type: 'selectVisibleTarget', target: target?.id || 'nearestThreat' });
      const launch = await game.input({ type: 'launchGuidedWeapon', target: target?.id || 'nearestThreat' });
      const after = await game.wait(700);
      const validLaunch = num(launch.helicopter?.guidedWeapons?.current) < num(before.helicopter?.guidedWeapons?.current) && (rev(after, 'projectiles') > rev(before, 'projectiles') || rev(after, 'combat') > rev(before, 'combat') || count(after, 'projectiles') > count(before, 'projectiles'));
      if (!validLaunch) return FAIL('valid guided launch lacked stock cost plus projectile/combat evidence');
      const rejectSetup = await legalScenario(game, 'weapon_rejection', (s) => s.phase === 'playing' && s.result === 'none', 'weapon rejection must still be active play');
      if (!rejectSetup.ok) return FAIL(rejectSetup.detail);
      const rejectBefore = rejectSetup.snap;
      const rejected = await game.input({ type: 'launchGuidedWeapon', target: 'nearestThreat' });
      const guidedUnchanged = num(rejected.helicopter?.guidedWeapons?.current) === num(rejectBefore.helicopter?.guidedWeapons?.current);
      const rejectionSignaled = rejected.lastAction?.ok === false || rejected.lastAction?.reason === 'noTarget' || rejected.lastAction?.reason === 'noGuidedWeapon' || rejected.lastAction?.visibleFeedback === true || rejected.notifications?.latestKind === 'rejection';
      const rejectedClean = guidedUnchanged && rejectionSignaled;
      if (!rejectedClean) return FAIL('invalid guided launch was not rejected or preserved stock');
      if (num(rejected.economy?.funds) < num(rejectBefore.economy?.funds) ||
          !sameResourceSubset(rejectBefore, rejected, ['bombs', 'soldiers', 'queue'])) return FAIL('invalid guided launch mutated unrelated resources');
      return PASS('guided launch contrasts valid target path with clean rejection path');
    }
  },
  {
    id: 'p1-soldier-drop-support',
    level: 'P1',
    name: 'Soldier drop creates support entity evidence',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'soldier_drop_opportunity', (s) => s.result === 'none' && num(s.helicopter?.soldiers?.onboard) > 0, 'must have onboard soldiers before drop');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      const drop = await game.input({ type: 'dropSoldier' });
      const after = await game.wait(900);
      const cost = num(drop.helicopter?.soldiers?.onboard) < num(before.helicopter?.soldiers?.onboard) || num(after.helicopter?.soldiers?.onboard) < num(before.helicopter?.soldiers?.onboard);
      const evidence = count(after, 'soldiersAirborne') > count(before, 'soldiersAirborne') || count(after, 'soldiersGround') > count(before, 'soldiersGround') || rev(after, 'combat') > rev(before, 'combat') || ['capture', 'production', 'info'].includes(after.notifications?.latestKind);
      if (!cost) return FAIL('soldier drop did not decrease onboard soldiers');
      if (!evidence) return FAIL('soldier drop had no airborne/ground/support evidence');
      return PASS('drop consumes onboard soldier and exposes support entity feedback');
    }
  },
  {
    id: 'p1-landing-refit-takeoff',
    level: 'P1',
    name: 'Landing starts gradual refit and takeoff restores mobility',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'low_resources_near_landing', (s) => {
        const h = s.helicopter || {};
        return s.result === 'none' && (num(h.fuel?.current) < num(h.fuel?.max) || num(h.ammo?.current) < num(h.ammo?.max) || num(h.bombs?.current) < num(h.bombs?.max) || num(h.guidedWeapons?.current) < num(h.guidedWeapons?.max) || h.healthState !== 'ok');
      }, 'must start below max resource or damaged');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      const landed = await game.input({ type: 'landOrRefit', target: 'friendlyLandingArea', durationMs: 500 });
      const landingState = landed.helicopter?.landed || landed.helicopter?.refitting
        ? { ok: true, snap: landed }
        : await waitUntil(game, landed, (s) => s.helicopter?.landed || s.helicopter?.refitting);
      if (!landingState.ok) return FAIL('landOrRefit did not enter landed/refitting state after request');
      const landedSnap = landingState.snap;
      const posBefore = await game.snapshot();
      await game.movePointerContract('right', 3000);
      const whileLanded = await game.wait(450);
      const landedWorldDelta = Math.abs(num(whileLanded.helicopter?.worldProgress) - num(posBefore.helicopter?.worldProgress));
      const refitA = await game.wait(700);
      const refitB = await game.wait(700);
      const improved = num(refitB.helicopter?.fuel?.current) > num(refitA.helicopter?.fuel?.current) || num(refitB.helicopter?.ammo?.current) > num(refitA.helicopter?.ammo?.current) || num(refitB.helicopter?.bombs?.current) > num(refitA.helicopter?.bombs?.current) || num(refitB.helicopter?.guidedWeapons?.current) > num(refitA.helicopter?.guidedWeapons?.current) || rev(refitB, 'refit') > rev(refitA, 'refit');
      const notInstantFull = num(landedSnap.helicopter?.fuel?.current) < num(landedSnap.helicopter?.fuel?.max) || num(landedSnap.helicopter?.ammo?.current) < num(landedSnap.helicopter?.ammo?.max) || num(landedSnap.helicopter?.bombs?.current) < num(landedSnap.helicopter?.bombs?.max) || num(landedSnap.helicopter?.guidedWeapons?.current) < num(landedSnap.helicopter?.guidedWeapons?.max) || ['damaged', 'critical'].includes(landedSnap.helicopter?.healthState);
      if (!improved) return FAIL('refit did not improve any resource or refit revision over time');
      if (!notInstantFull) return FAIL('landing appeared to instantly fully refill all tracked resources');
      const airborne = await game.input({ type: 'takeOff' });
      const moved = await game.movePointerContract('up');
      if (!moved.helicopter?.airborne) return FAIL('takeOff/upward intent did not restore airborne state');
      if (landedWorldDelta > 0.005) return FAIL('landed/refitting state did not suppress horizontal mobility');
      return PASS('landing suppresses mobility, refit progresses over time, takeoff restores flight');
    }
  },
  {
    id: 'p1-production-order-queue-spawn',
    level: 'P1',
    name: 'Production order spends funds, queues, and spawns units',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'production_ready', (s) => s.phase === 'playing' && s.result === 'none' && (s.economy?.affordableUnits || []).length > 0, 'must expose affordable order');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      const unit = (before.economy.affordableUnits || []).find((u) => ['tank', 'missileVehicle', 'supplyVehicle', 'infantry', 'engineer'].includes(u)) || before.economy.affordableUnits[0];
      const ordered = await game.input({ type: 'orderUnit', unit });
      if (!(num(ordered.economy?.funds) < num(before.economy?.funds))) return FAIL('valid order did not spend funds');
      if (!(num(ordered.economy?.queueLength) > num(before.economy?.queueLength) || num(ordered.economy?.queueByUnit?.[unit]) > num(before.economy?.queueByUnit?.[unit]) || rev(ordered, 'production') > rev(before, 'production'))) return FAIL('valid order did not enter visible production queue');
      const completed = await waitUntil(game, ordered, (after) => {
        return num(after.economy?.queueLength) < num(ordered.economy?.queueLength) ||
          count(after, 'friendlyGround') > count(before, 'friendlyGround') ||
          rev(after, 'production') > rev(ordered, 'production');
      }, { totalMs: 7000, stepMs: 500 });
      const after = completed.snap;
      const spawnedOrCompleted = num(after.economy?.queueLength) < num(ordered.economy?.queueLength) || count(after, 'friendlyGround') > count(before, 'friendlyGround') || rev(after, 'production') > rev(ordered, 'production');
      if (!spawnedOrCompleted) return FAIL('queued order did not complete or produce public unit evidence after wait');
      if (after.result !== 'none') return FAIL('ordinary production unexpectedly ended battle');
      return PASS(`ordered ${unit}: funds spent, queue changed, and production evidence followed`);
    }
  },
  {
    id: 'p1-production-rejection-invariant',
    level: 'P1',
    name: 'Production rejection preserves funds and queue',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'production_rejection', (s) => s.phase === 'playing' && s.result === 'none', 'rejection scenario must be active non-terminal play');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      const blocked = (before.economy?.blockedUnits || []).find(Boolean) || 'tank';
      const after = await game.input({ type: 'orderUnit', unit: blocked });
      const rejected = after.lastAction?.ok === false || ['noFunds', 'unitCap', 'unavailable', 'resultLocked'].includes(after.lastAction?.reason) || after.notifications?.latestKind === 'rejection';
      if (!rejected) return FAIL('blocked order did not surface rejection');
      if (num(after.economy?.funds) !== num(before.economy?.funds)) return FAIL('blocked order changed funds');
      if (num(after.economy?.queueLength) !== num(before.economy?.queueLength)) return FAIL('blocked order changed queue length');
      if (count(after, 'friendlyGround') !== count(before, 'friendlyGround')) return FAIL('blocked order spawned friendly ground unit');
      return PASS('illegal production rejected with funds/queue/unit invariants preserved');
    }
  },
  {
    id: 'p1-autonomous-ground-war-motion',
    level: 'P1',
    name: 'Autonomous ground war advances while active',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'active_ground_war', (s) => s.phase === 'playing' && s.result === 'none' && (count(s, 'friendlyGround') + count(s, 'enemyGround') + count(s, 'friendlySupplyVehicles') + count(s, 'enemySupplyVehicles') > 0), 'ground units or convoy pressure required');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      if (num(before.timeMs) > 0) return FAIL('active ground war scenario advanced before wait');
      const after = await game.wait(1500);
      const worldMoved = rev(after, 'worldMotion') > rev(before, 'worldMotion') || num(after.worldRevision) > num(before.worldRevision);
      const tacticalChange = rev(after, 'worldMotion') > rev(before, 'worldMotion') || rev(after, 'combat') > rev(before, 'combat') || rev(after, 'radar') > rev(before, 'radar') || count(after, 'friendlyGround') !== count(before, 'friendlyGround') || count(after, 'enemyGround') !== count(before, 'enemyGround') || num(after.convoy?.friendlyProgress) !== num(before.convoy?.friendlyProgress) || num(after.convoy?.enemyProgress) !== num(before.convoy?.enemyProgress);
      if (!worldMoved) return FAIL('worldMotion/worldRevision did not advance during active ground war');
      if (!tacticalChange) return FAIL('ground war had no movement or tactical evidence');
      return PASS('active ground war advances with tactical public evidence');
    }
  },
  {
    id: 'p1-convoy-result-locks',
    level: 'P1',
    name: 'Convoy-driven results lock ordinary play',
    timeoutMs: 90000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const victorySetup = await legalScenario(game, 'convoy_near_enemy_base', (s) => s.result === 'none' && num(s.convoy?.friendlyProgress) < 1, 'friendly convoy must be near but incomplete');
      if (!victorySetup.ok) return FAIL(victorySetup.detail);
      const beforeV = victorySetup.snap;
      await game.wait(500);
      const supportTrace = [];
      await attemptAirSupport(game, 'nearestEnemyGround', supportTrace);
      const victoryWait = await waitUntil(game, beforeV, (s) => s.result === 'victory' && rev(s, 'result') > rev(beforeV, 'result'), { totalMs: 40000, stepMs: 750 });
      const victory = victoryWait.snap;
      if (victory.result !== 'victory' || rev(victory, 'result') <= rev(beforeV, 'result')) return FAIL(`friendly convoy did not trigger victory/result revision: ${JSON.stringify({timeMs: victory.timeMs, result: victory.result, convoy: victory.convoy, helicopter: victory.helicopter, entityCounts: victory.entityCounts, revisions: victory.revisions, notifications: victory.notifications, supportTrace})}`);
      const locked = await game.input({ type: 'orderUnit', unit: 'tank' });
      if (!(locked.result === 'victory' && (locked.lastAction?.ok === false || locked.lastAction?.reason === 'resultLocked' || num(locked.economy?.queueLength) === num(victory.economy?.queueLength)))) return FAIL('terminal victory did not lock ordinary production');

      const defeatSetup = await legalScenario(game, 'enemy_convoy_threat', (s) => s.result === 'none' && num(s.convoy?.enemyProgress) < 1, 'enemy convoy must be near but incomplete');
      if (!defeatSetup.ok) return FAIL(defeatSetup.detail);
      const beforeD = defeatSetup.snap;
      const defeatWait = await waitUntil(game, beforeD, (s) => s.result === 'defeat' && rev(s, 'result') > rev(beforeD, 'result'), { totalMs: 40000, stepMs: 750 });
      const defeat = defeatWait.snap;
      if (defeat.result !== 'defeat' || rev(defeat, 'result') <= rev(beforeD, 'result')) return FAIL('enemy convoy did not trigger defeat/result revision');
      const restart = await game.input({ type: 'restart' });
      if (restart.result !== 'none' || restart.phase !== 'playing') return FAIL('restart did not recover from terminal result');
      return PASS('friendly/enemy convoy results are caused by play and terminal inputs are locked until restart');
    }
  },
  {
    id: 'p1-control-point-or-hazard-feedback',
    level: 'P1',
    name: 'Control point or hazard changes after player trigger',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'contested_bunker', (s) => s.phase === 'playing' && s.result === 'none' && (count(s, 'bunkersFriendly') + count(s, 'bunkersEnemy') + count(s, 'bunkersNeutral') + count(s, 'turrets') > 0), 'must expose contested bunker/turret/control point');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      if (num(before.helicopter?.soldiers?.onboard) > 0) {
        await game.input({ type: 'dropSoldier' });
      } else if ((before.economy?.affordableUnits || []).length) {
        await game.input({ type: 'orderUnit', unit: before.economy.affordableUnits[0] });
      } else {
        await game.input({ type: 'holdFire', value: true, durationMs: 500 });
        await game.input({ type: 'holdFire', value: false });
      }
      const waited = await waitUntil(game, before, (snap) => {
        return count(snap, 'bunkersFriendly') !== count(before, 'bunkersFriendly') ||
          count(snap, 'bunkersEnemy') !== count(before, 'bunkersEnemy') ||
          count(snap, 'bunkersNeutral') !== count(before, 'bunkersNeutral') ||
          count(snap, 'turrets') !== count(before, 'turrets') ||
          count(snap, 'airHazards') !== count(before, 'airHazards') ||
          rev(snap, 'combat') > rev(before, 'combat') ||
          ['capture', 'damage', 'production'].includes(snap.notifications?.latestKind) ||
          rev(snap, 'radar') > rev(before, 'radar');
      }, { totalMs: 10000, stepMs: 500 });
      if (!waited.ok) return FAIL('control point/hazard state did not change after player support action');
      return PASS('control point or tactical hazard provides post-trigger feedback');
    }
  },
  {
    id: 'p1-hud-radar-sync',
    level: 'P1',
    name: 'HUD and radar revisions track gameplay state changes',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'radar_awareness', (s) => s.phase === 'playing' && s.radar?.visible && s.playfield?.visible, 'radar and playfield must be visible');
      if (!setup.ok) return FAIL(setup.detail);
      const before = setup.snap;
      await game.movePointerRealOnly('right', before);
      if ((before.economy?.affordableUnits || []).length) await game.input({ type: 'orderUnit', unit: before.economy.affordableUnits[0] });
      const after = await game.wait(1000);
      const gameplayChanged = num(after.helicopter?.screenX) !== num(before.helicopter?.screenX) || num(after.playfield?.scrollProgress) !== num(before.playfield?.scrollProgress) || num(after.economy?.funds) !== num(before.economy?.funds) || num(after.economy?.queueLength) !== num(before.economy?.queueLength) || rev(after, 'worldMotion') > rev(before, 'worldMotion');
      const surfacesChanged = rev(after, 'hud') > rev(before, 'hud') || rev(after, 'radar') > rev(before, 'radar') || num(after.radar?.markerRevision) > num(before.radar?.markerRevision) || after.notifications?.count !== before.notifications?.count;
      const markerConsistency = (!count(after, 'friendlyGround') && !count(after, 'enemyGround')) || after.radar?.hasFriendlyMarkers || after.radar?.hasEnemyMarkers || after.radar?.hasObjectiveMarkers;
      if (!gameplayChanged) return FAIL('movement/production/wait did not change public gameplay state');
      if (!surfacesChanged) return FAIL('HUD/radar/notification surfaces did not update after gameplay change');
      if (!markerConsistency) return FAIL('radar markers absent despite public units/objectives');
      return PASS('HUD/radar revisions stay synchronized with gameplay changes');
    }
  },
  {
    id: 'p1-modal-result-resource-invariants',
    level: 'P1',
    name: 'Modal and result locks preserve resources',
    timeoutMs: 50000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await legalScenario(game, 'pause_guard', (s) => s.phase === 'playing' && s.result === 'none', 'pause guard must be active battle');
      if (!setup.ok) return FAIL(setup.detail);
      const beforePause = setup.snap;
      await game.input({ type: 'openSettings' });
      const settingsA = await game.snapshot();
      const settingsB = await game.wait(700);
      if (!(settingsB.overlayBlocking || settingsB.phase === 'settings' || settingsB.canInteractWithPlayfield === false)) return FAIL('settings did not block playfield');
      if (rev(settingsB, 'worldMotion') !== rev(settingsA, 'worldMotion') || rev(settingsB, 'production') !== rev(settingsA, 'production') || !sameResourceSubset(settingsA, settingsB, ['funds', 'ammo', 'bombs', 'guided', 'soldiers', 'queue'])) return FAIL('settings modal allowed progress or resource mutation');
      await game.input({ type: 'closeSettings' });

      const resultSetup = await legalScenario(game, 'result_lock_from_play', (s) => s.phase === 'playing' && s.result === 'none', 'near-terminal state must not start complete');
      if (!resultSetup.ok) return FAIL(resultSetup.detail);
      const terminalWait = await waitUntil(game, resultSetup.snap, (s) => ['victory', 'defeat'].includes(s.result), { totalMs: 36000, stepMs: 1000 });
      const terminal = terminalWait.snap;
      if (!['victory', 'defeat'].includes(terminal.result)) return FAIL('result_lock_from_play did not reach terminal state through play');
      const attempt = await game.input({ type: 'dropBomb' });
      if (attempt.result !== terminal.result) return FAIL('ordinary input changed terminal result');
      if (!sameResourceSubset(terminal, attempt, ['funds', 'ammo', 'guided', 'soldiers', 'queue'])) return FAIL('result-locked ordinary action mutated unrelated resources');
      if (beforePause.result !== 'none') return FAIL('pause precondition was already terminal');
      return PASS('settings/result locks block progress and preserve resources');
    }
  },
  {
    id: 'p2-advanced-entry-flex',
    level: 'P2',
    name: 'Advanced entry starts legally or rejects gracefully',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.loadScenario('menu_ready');
      const advanced = await game.input({ type: 'startBattle', mode: 'advanced' });
      if (advanced.phase === 'playing') {
        if (!advanced.playfield?.visible || advanced.overlayBlocking) return FAIL('advanced battle started but playfield is blocked or hidden');
        return PASS(`advanced entry playable: mode=${advanced.mode} difficulty=${advanced.difficulty}`);
      }
      const graceful = advanced.lastAction?.ok === false || ['unavailable', 'invalidAction', 'notReady'].includes(advanced.lastAction?.reason) || advanced.notifications?.latestKind === 'rejection';
      if (!graceful) return FAIL('unsupported advanced entry did not reject gracefully');
      const fallback = await game.input({ type: 'startBattle', mode: 'tutorial' });
      if (fallback.phase !== 'playing' || !fallback.playfield?.visible) return FAIL('advanced rejection broke normal P1 start');
      return PASS('advanced entry is either playable or rejects without breaking tutorial battle');
    }
  },
  {
    id: 'p2-radar-weather-variant',
    level: 'P2',
    name: 'Radar or weather variant remains observable and playable',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const variant = await game.loadScenario('radar_awareness', { variant: 'weatherOrJamming' });
      if (requireContract(variant).length) return FAIL('variant setup did not return contract snapshot');
      const before = variant;
      await game.movePointerContract('right');
      const after = await game.wait(900);
      const observable = after.radar?.jammedOrDegraded || count(after, 'airHazards') !== count(before, 'airHazards') || rev(after, 'radar') > rev(before, 'radar') || num(after.radar?.markerRevision) > num(before.radar?.markerRevision);
      if (!observable) return NA('implementation does not expose optional weather/radar degradation variant');
      if (after.phase !== 'playing' || !after.canInteractWithPlayfield) return FAIL('variant broke active playfield interaction');
      return PASS('optional radar/weather variant is observable and core play remains active');
    }
  },
  {
    id: 'p2-settings-preference-blocking',
    level: 'P2',
    name: 'Settings or preference panel blocks and restores play',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const started = await startPlayable(game);
      if (started.phase !== 'playing') return FAIL('could not start playable battle before settings test');
      const opened = await game.input({ type: 'openSettings' });
      if (!(opened.overlayBlocking || opened.phase === 'settings' || opened.canInteractWithPlayfield === false)) return FAIL('settings did not block battlefield input');
      const point = await browser.eval(`
        (function() {
          const el = Array.from(document.querySelectorAll('[data-setting],[role="switch"],[role="checkbox"],input[type="checkbox"],input[type="radio"],input[type="range"],select'))
            .find((node) => {
              const r = node.getBoundingClientRect();
              return r.width > 8 && r.height > 8 && r.bottom >= 0 && r.right >= 0;
            });
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        })()
      `);
      if (point && Number.isFinite(point.x)) await browser.mouseClick(point.x, point.y);
      const maybeChanged = await game.wait(300);
      const stillBlocking = maybeChanged.overlayBlocking || maybeChanged.phase === 'settings' || maybeChanged.canInteractWithPlayfield === false;
      if (!stillBlocking) return FAIL('settings closed before frozen-motion observation');
      if (rev(maybeChanged, 'worldMotion') !== rev(opened, 'worldMotion')) return FAIL('settings panel allowed world motion while blocking');
      const closed = await game.input({ type: 'closeSettings' });
      if (closed.phase !== 'playing' || closed.overlayBlocking || !closed.canInteractWithPlayfield) return FAIL('closing settings did not restore battlefield play');
      return PASS('settings blocks play, optional visible preference click is safe, close restores interaction');
    }
  }
];

module.exports = { suite };
