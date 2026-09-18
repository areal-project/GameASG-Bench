'use strict';

// === GDD Coverage Map ===
// M1 Start/loading/ready flow -> p0-contract-schema, p0-scenario-availability, p1-real-start-visible, p1-contract-ready-scene
// M2 Hold-to-accelerate driving -> p1-real-hold-accelerates, p1-real-release-coasts, p1-real-touch-drive-parity
// M3 Inverted drag steering and road bounds -> p1-real-steering-opposites, p1-contract-road-bounds, p1-real-touch-drive-parity
// M4 Road hazards -> p1-mixed-explosive-collision, p1-mixed-crossing-car-collision
// M5 Ramp and flight -> p1-mixed-ramp-flight-gravity, p2-mixed-air-control-no-boost
// M6 Monster voxel destruction -> p1-mixed-monster-impact-destruction, p2-contract-weak-miss-no-win
// M7 Run result and restart -> p1-real-result-retry-clean, p1-contract-victory-terminal-lock
// M8 Level progression -> p1-contract-victory-terminal-lock, p1-real-level-select-locks
// M9 Vehicle selection and unlocks -> p1-real-vehicle-select-locks
// M10 Settings and audio preference -> p1-real-settings-blocks-driving, p2-contract-active-run-panel-reject
// M11 Monster special threats -> p2-mixed-special-threat-visible-contact
// M12 Destruction depth and guidance -> p2-contract-guidance-nonblocking
// M13 Expanded polish/progression -> p2-contract-depth-progression-visible

// === Category Map ===
// TS-P0-01 Boot & Stability -> p0-contract-schema
// TS-P1-01 UI Flow & Blocking -> p1-real-start-visible
// TS-P1-02 Boot & Stability -> p1-contract-ready-scene
// TS-P1-03 Input Semantics -> p1-real-hold-accelerates
// TS-P1-04 Input Semantics -> p1-real-release-coasts
// TS-P1-05 Input Semantics -> p1-real-steering-opposites
// TS-P1-06 Input Semantics -> p1-real-touch-drive-parity
// TS-P1-07 Invariants & Rejection -> p1-contract-road-bounds
// TS-P1-08 Core Mechanic Loop -> p1-mixed-explosive-collision
// TS-P1-09 Core Mechanic Loop -> p1-mixed-crossing-car-collision
// TS-P1-10 Core Mechanic Loop -> p1-mixed-ramp-flight-gravity
// TS-P1-11 Core Mechanic Loop -> p1-mixed-monster-impact-destruction
// TS-P1-12 State Machine -> p1-real-result-retry-clean
// TS-P1-13 State Machine -> p1-contract-victory-terminal-lock
// TS-P1-14 Economy / Progression -> p1-real-level-select-locks
// TS-P1-15 Economy / Progression -> p1-real-vehicle-select-locks
// TS-P1-16 UI Flow & Blocking -> p1-real-settings-blocks-driving
// TS-P2-01 Core Mechanic Loop -> p2-mixed-air-control-no-boost
// TS-P2-02 Invariants & Rejection -> p2-contract-weak-miss-no-win
// TS-P2-03 UI Flow & Blocking -> p2-contract-active-run-panel-reject
// TS-P2-04 Depth / Optional Systems -> p2-mixed-special-threat-visible-contact
// TS-P2-05 Feedback & Observability -> p2-contract-guidance-nonblocking
// TS-P2-06 Depth / Optional Systems -> p2-contract-depth-progression-visible

// === Rationality Map ===
// p1-real-start-visible | priority P1 | GDD M1 | TEST_SPEC TS-P1-01 | check method: real-user behavior | interaction path: visible control click | input channel/action adapter: dom-click | trigger: real click/tap-equivalent on discovered start/play control after freshStart setup | independent observation: screen/phase, loadingComplete, scene semantic objects, no blocking overlay, playable bounds/render evidence | empty-shell failure reason: API-only start, static menu, or hidden overlay cannot satisfy real click plus readable scene.
// p1-contract-ready-scene | priority P1 | GDD M1 | TEST_SPEC TS-P1-02 | check method: contract/API | interaction path: contract action only | input channel/action adapter: contract-action | trigger: load readyUnlockedLevel then wait | independent observation: sceneSummary, playfield, HUD and panel state remain coherent | empty-shell failure reason: one render loop or ok:true snapshot without vehicle/road/ramp/monster/HUD semantics fails.
// p1-real-hold-accelerates | priority P1 | GDD M2 | TEST_SPEC TS-P1-03 | check method: real-user behavior | interaction path: canvas/playfield semantic point | input channel/action adapter: pointer-drag | trigger: real mouse down inside runtime playfield bounds and hold | independent observation: held flag, speed/progress/HUD and visible motion revisions rise in order | empty-shell failure reason: natural animation or contract-only acceleration cannot produce held-input causal deltas.
// p1-real-release-coasts | priority P1 | GDD M2 | TEST_SPEC TS-P1-04 | check method: real-user behavior | interaction path: segmented pointer press-hold-release | input channel/action adapter: pointer-drag | trigger: real hold builds speed, real mouse release, then passive waits | independent observation: inputHeld false, forward progress continues briefly, speed trends down | empty-shell failure reason: instant stop, fixed speed, or release-insensitive motion fails.
// p1-real-steering-opposites | priority P1 | GDD M3 | TEST_SPEC TS-P1-05 | check method: real-user behavior | interaction path: opposite direction pair | input channel/action adapter: pointer-drag | trigger: independent real right-drag and left-drag trials from semantic playfield baselines | independent observation: signed lateral/screen movement and visibleDirection/orientation prove opposite, inverted steering | empty-shell failure reason: same-direction steering, world-only fields, or accumulated boundary hits fail.
// p1-real-touch-drive-parity | priority P1 | GDD M2/M3 | TEST_SPEC TS-P1-06 | check method: real-user behavior | interaction path: touch drag/tap | input channel/action adapter: touch-drag | trigger: touchStart, hold, move laterally, touchEnd inside semantic playfield bounds | independent observation: speed/progress/HUD, signed steering, and release cleanup match driving semantics | empty-shell failure reason: mouse-only products or checks substituting contract input do not cover GDD main touch path.
// p1-contract-road-bounds | priority P1 | GDD M3 | TEST_SPEC TS-P1-07 | check method: contract/API | interaction path: contract action only | input channel/action adapter: contract-action | trigger: repeated public press/drag/hold actions toward both sides and small drag baseline | independent observation: lateral values remain within road limits, bound flags/intent align, unchanged tiny-drag baseline | empty-shell failure reason: unconstrained or layout-only steering clamp fails gameplay invariant.
// p1-mixed-explosive-collision | priority P1 | GDD M4 | TEST_SPEC TS-P1-08 | check method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | input channel/action adapter: pointer-drag | trigger: roadHazardApproach setup then real hold/route through hazard lane | independent observation: explosion/collision revisions, health/speed cost and visible effect all change after contact | empty-shell failure reason: decorative hazards, timer damage, or pre-triggered explosions fail contact-coupled oracle.
// p1-mixed-crossing-car-collision | priority P1 | GDD M4 | TEST_SPEC TS-P1-09 | check method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | input channel/action adapter: pointer-drag | trigger: roadHazardApproach setup with moving hazards, real hold/route, optional independent avoidance comparison | independent observation: moving hazard contact/knockback or collision count plus health/speed/lateral effect | empty-shell failure reason: non-moving decorative cars or always-damage setups fail.
// p1-mixed-ramp-flight-gravity | priority P1 | GDD M5 | TEST_SPEC TS-P1-10 | check method: mixed setup + real-user behavior | interaction path: segmented pointer press-hold-release | input channel/action adapter: pointer-drag | trigger: grounded rampApproach, real driving only to establish launch, then release/wait | independent observation: airborne followed by downward flight or landing; scene legality remains required | empty-shell failure reason: no takeoff or passive hovering without descent fails; screen projection and impact alone do not prove gravity.
// p1-mixed-monster-impact-destruction | priority P1 | GDD M6 | TEST_SPEC TS-P1-11 | check method: mixed setup + real-user behavior | interaction path: canvas/playfield semantic point | input channel/action adapter: pointer-drag | trigger: monsterApproach setup, real route/air correction toward semantic target zone, wait for hit | independent observation: health loss plus broken blocks, debris and impact revisions, speed/result coupling | empty-shell failure reason: numeric-only health drops or pre-broken blocks fail visible voxel destruction.
// p1-real-result-retry-clean | priority P1 | GDD M7 | TEST_SPEC TS-P1-12 | check method: real-user behavior | interaction path: visible control click | input channel/action adapter: dom-click | trigger: failureWaiting setup then real click visible continue/retry control | independent observation: result cleared, grounded ready/intro, speed/input/explosion/damage/overlay/result choices cleaned | empty-shell failure reason: repainting a button while retaining transient run state fails.
// p1-contract-victory-terminal-lock | priority P1 | GDD M7/M8 | TEST_SPEC TS-P1-13 | check method: contract/API | interaction path: contract action only | input channel/action adapter: contract-action | trigger: victoryResult setup, extra drive input, then nextLevel | independent observation: terminal health/debris/unlock/reward sets unchanged before next, next enters unlocked level | empty-shell failure reason: reward farming or always-unlock logic fails.
// p1-real-level-select-locks | priority P1 | GDD M8 | TEST_SPEC TS-P1-14 | check method: real-user behavior | interaction path: visible control click | input channel/action adapter: dom-click | trigger: level menu setup, real click unlocked candidate and real click locked candidate from comparable state | independent observation: current level changes only for unlocked, locked click is rejected/unchanged with visible locked distinction | empty-shell failure reason: silent locked entry selection or inert visible cards fail.
// p1-real-vehicle-select-locks | priority P1 | GDD M9 | TEST_SPEC TS-P1-15 | check method: real-user behavior | interaction path: visible control click | input channel/action adapter: dom-click | trigger: vehicle menu setup, real click unlocked vehicle, real click locked vehicle, real close/back | independent observation: current vehicle persists only for unlocked, locked is rejected/preview-only and close restores valid selection | empty-shell failure reason: cosmetic cards or locked vehicle persistence fail.
// p1-real-settings-blocks-driving | priority P1 | GDD M10 | TEST_SPEC TS-P1-16 | check method: real-user behavior | interaction path: visible control click | input channel/action adapter: dom-click plus dom-select-change | trigger: real click settings, visible toggle change, real playfield press while panel open, real close | independent observation: audio preference flips, speed/progress unchanged while blocked, ready interaction restored | empty-shell failure reason: transparent overlays or fake toggles fail.
// p2-mixed-air-control-no-boost | priority P2 | GDD M5 | TEST_SPEC TS-P2-01 | check method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | input channel/action adapter: pointer-drag | trigger: airborneApproach setup then real lateral drag | independent observation: lateral/visible direction changes while held/throttle state does not create speed boost | empty-shell failure reason: no air control or air drag acting as throttle fails.
// p2-contract-weak-miss-no-win | priority P2 | GDD M6 | TEST_SPEC TS-P2-02 | check method: contract/API | interaction path: contract action only | input channel/action adapter: contract-action | trigger: weak/miss public route and wait | independent observation: result/reward/destroyed state remains non-winning unless visible impact evidence supports damage | empty-shell failure reason: proximity-only or always-win implementations fail.
// p2-contract-active-run-panel-reject | priority P2 | GDD M10 | TEST_SPEC TS-P2-03 | check method: contract/API | interaction path: contract action only | input channel/action adapter: contract-action | trigger: enter accelerating via public actions then request preparation panel | independent observation: invalid/reject reason, no overlay, phase/progress preserved | empty-shell failure reason: active-run menus that pause/cover the sprint fail.
// p2-mixed-special-threat-visible-contact | priority P2 | GDD M11 | TEST_SPEC TS-P2-04 | check method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | input channel/action adapter: pointer-drag | trigger: later-level threat scenario if exposed, real drive through threat route | independent observation: warning/trajectory/motion appears before contact, then health/speed/route cost | empty-shell failure reason: invisible unavoidable random damage or cost-free decorative threats fail.
// p2-contract-guidance-nonblocking | priority P2 | GDD M12 | TEST_SPEC TS-P2-05 | check method: contract/API | interaction path: contract action only | input channel/action adapter: contract-action | trigger: damagedMonsterReady setup, observe guidance, then public driving actions | independent observation: hint/target zones visible and not permanently blocking playfield progress | empty-shell failure reason: permanent tutorial overlays or fabricated target zones detached from damage fail.
// p2-contract-depth-progression-visible | priority P2 | GDD M13 | TEST_SPEC TS-P2-06 | check method: contract/API | interaction path: contract action only | input channel/action adapter: contract-action | trigger: public progression/reward state with next/retry/menu actions | independent observation: later levels/vehicles/reward/scene variety visible while P1 readiness and locked rules remain coherent | empty-shell failure reason: hidden progression with no visible distinction or variety replacing core loop fails.

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const PASS = detail => ({ status: 'PASS', detail: detail || '' });
const FAIL = detail => ({ status: 'FAIL', detail: detail || '' });
const NA = detail => ({ status: 'NOT_APPLICABLE', detail: detail || '' });

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function setKey(value) {
  return JSON.stringify(arr(value).slice().sort());
}

function sameSet(a, b) {
  return setKey(a) === setKey(b);
}

function hasAny(list, terms) {
  const values = arr(list).map(v => String(v).toLowerCase());
  return terms.some(term => values.includes(term.toLowerCase()));
}

function approxUnchanged(a, b, tolerance) {
  if (!finite(a) || !finite(b)) return a === b;
  return Math.abs(a - b) <= (tolerance || 0.0001);
}

async function evaluate(browser, body, arg) {
  return browser.eval(`(async function(arg){
    try {
      ${body}
    } catch (error) {
      return { __error: String(error && error.message || error) };
    }
  })(${JSON.stringify(arg)})`);
}

async function call(browser, method, ...args) {
  return browser.eval(`(async function(){
    const api = window.__gameTest;
    const method = ${JSON.stringify(method)};
    const args = ${JSON.stringify(args)};
    if (!api || typeof api[method] !== 'function') {
      return { __missing: method };
    }
    try {
      const result = await Promise.resolve(api[method](...args));
      JSON.stringify(result);
      return result;
    } catch (error) {
      return { __threw: String(error && error.message || error) };
    }
  })()`);
}

function apiProblem(result) {
  if (!result) return 'returned no snapshot';
  if (result.__missing) return `missing window.__gameTest.${result.__missing}`;
  if (result.__threw) return `threw: ${result.__threw}`;
  if (result.__error) return result.__error;
  return '';
}

async function snapshot(browser) {
  return call(browser, 'getSnapshot');
}

async function scenario(browser, name, options) {
  const result = await call(browser, 'loadScenario', name, options || {});
  const problem = apiProblem(result);
  if (problem) throw new Error(`${name}: ${problem}`);
  return result;
}

async function action(browser, value) {
  return call(browser, 'input', value);
}

async function waitAction(browser, ms) {
  const s = await action(browser, { type: 'wait', durationMs: ms });
  if (apiProblem(s)) await sleep(Math.min(ms, 800));
  return snapshot(browser);
}

function requiredFamilies(snapshotValue) {
  return [
    'screen', 'phase', 'result', 'activePanel', 'overlayBlocking',
    'canInteractWithPlayfield', 'playfield', 'level', 'vehicle',
    'motion', 'road', 'monster', 'progression', 'ui'
  ].filter(k => !(k in (snapshotValue || {})));
}

function sceneElements(s) {
  return arr(s && s.playfield && s.playfield.sceneSummary && s.playfield.sceneSummary.visibleElements);
}

function isReadyLike(s) {
  return s && s.screen === 'playing' && ['ready', 'intro'].includes(s.phase);
}

function playfieldBounds(s) {
  const b = s && s.playfield && s.playfield.bounds;
  if (!b || ![b.screenX, b.screenY, b.width, b.height].every(finite)) return null;
  return b;
}

function pointFromBounds(bounds, xRatio, yRatio) {
  return {
    x: bounds.screenX + bounds.width * (xRatio == null ? 0.5 : xRatio),
    y: bounds.screenY + bounds.height * (yRatio == null ? 0.5 : yRatio)
  };
}

async function scrollHitPoint(browser, point, opts) {
  const result = await evaluate(browser, `
    const point = arg.point;
    const allowCanvas = !!arg.allowCanvas;
    const pageX = arg.pageCoordinates ? point.x : point.x + window.scrollX;
    const pageY = arg.pageCoordinates ? point.y : point.y + window.scrollY;
    const marginX = Math.max(96, window.innerWidth * 0.45);
    const marginY = Math.max(96, window.innerHeight * 0.45);
    window.scrollTo({
      left: Math.max(0, pageX - marginX),
      top: Math.max(0, pageY - marginY),
      behavior: 'instant'
    });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const x = pageX - window.scrollX;
    const y = pageY - window.scrollY;
    const el = document.elementFromPoint(x, y);
    const rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    const ok = !!el && x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight &&
      (allowCanvas || el.tagName !== 'BODY');
    return { ok, x, y, tag: el && el.tagName, id: el && el.id, cls: el && String(el.className || ''), rect };
  `, { point, allowCanvas: !!(opts && opts.allowCanvas), pageCoordinates: !!(opts && opts.pageCoordinates) });
  if (!result || result.__error) throw new Error(result && result.__error || 'hit-test failed');
  if (!result.ok) throw new Error(`semantic point not hit-testable at ${Math.round(result.x)},${Math.round(result.y)}`);
  return { x: result.x, y: result.y, target: result };
}

async function semanticPlayPoint(browser, xRatio, yRatio) {
  const s = await snapshot(browser);
  const bounds = playfieldBounds(s);
  if (!bounds) throw new Error('needs_tdd_contract: snapshot.playfield.bounds unavailable');
  const point = pointFromBounds(bounds, xRatio == null ? 0.5 : xRatio, yRatio == null ? 0.55 : yRatio);
  const hit = await scrollHitPoint(browser, point, { allowCanvas: true });
  return { x: hit.x, y: hit.y, width: bounds.width, height: bounds.height, snapshot: s };
}

async function mouseDown(browser, x, y) {
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
}

async function mouseMove(browser, x, y) {
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
}

async function mouseUp(browser, x, y) {
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

async function mouseClick(browser, x, y) {
  await mouseDown(browser, x, y);
  await sleep(60);
  await mouseUp(browser, x, y);
}

async function touchDrag(browser, points) {
  const first = points[0];
  await browser.cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: first.x, y: first.y, id: 1, radiusX: 4, radiusY: 4, force: 1 }]
  });
  for (let i = 1; i < points.length; i++) {
    await sleep(points[i].wait || 80);
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: points[i].x, y: points[i].y, id: 1, radiusX: 4, radiusY: 4, force: 1 }]
    });
  }
  await sleep(80);
  const last = points[points.length - 1];
  await browser.cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [{ x: last.x, y: last.y, id: 1, radiusX: 4, radiusY: 4, force: 0 }]
  });
}

async function pointerDrive(browser, options) {
  const p = await semanticPlayPoint(browser, options && options.xRatio, options && options.yRatio);
  await mouseDown(browser, p.x, p.y);
  if (options && options.holdBeforeMove) await sleep(options.holdBeforeMove);
  if (options && options.deltaX) {
    await mouseMove(browser, p.x + options.deltaX, p.y);
  }
  if (options && options.holdAfterMove) await sleep(options.holdAfterMove);
  if (!options || options.release !== false) await mouseUp(browser, p.x + (options && options.deltaX || 0), p.y);
  return p;
}

async function realRouteTrials(browser, scenarioOptions, routes, observe, maxMs) {
  const trials = [];
  for (const route of routes) {
    const before = await scenario(browser, 'roadHazardApproach', scenarioOptions || {});
    const p = await semanticPlayPoint(browser, 0.5, 0.6);
    const ratios = Array.isArray(route.deltaRatios) && route.deltaRatios.length
      ? route.deltaRatios
      : [finite(route.deltaRatio) ? route.deltaRatio : 0];
    const segmentMs = finite(route.segmentMs) ? Math.max(160, route.segmentMs) : 160;
    await mouseDown(browser, p.x, p.y);
    let after = before;
    const deadline = Date.now() + (maxMs || 5000);
    let deltaX = 0;
    for (const ratio of ratios) {
      if (Date.now() >= deadline || observe(after, before, route) || after.result !== 'none' || ['waiting', 'victory'].includes(after.phase)) break;
      deltaX = p.width * (finite(ratio) ? ratio : 0);
      if (deltaX) await mouseMove(browser, p.x + deltaX, p.y);
      const segmentDeadline = Math.min(deadline, Date.now() + segmentMs);
      while (Date.now() < segmentDeadline) {
        await sleep(Math.min(160, Math.max(40, segmentDeadline - Date.now())));
        after = await snapshot(browser);
        if (observe(after, before, route) || after.result !== 'none' || ['waiting', 'victory'].includes(after.phase)) break;
      }
      if (observe(after, before, route) || after.result !== 'none' || ['waiting', 'victory'].includes(after.phase)) break;
    }
    while (Date.now() < deadline && !observe(after, before, route) && after.result === 'none' && !['waiting', 'victory'].includes(after.phase)) {
      await sleep(160);
      after = await snapshot(browser);
    }
    await mouseUp(browser, p.x + deltaX, p.y);
    trials.push({ before, after, route });
  }
  return trials;
}

async function visibleCandidates(browser, terms, opts) {
  return evaluate(browser, `
    const terms = arg.terms.map(t => String(t).toLowerCase());
    const normalizedTerms = terms.map(t => t.replace(/[-_]+/g, ' '));
    const interactiveOnly = !!arg.interactiveOnly;
    const actionableOnly = !!arg.actionableOnly;
    function textFor(el) {
      const bits = [];
      const attrs = [
        'aria-label', 'title', 'id', 'name', 'role',
        'data-action', 'data-panel', 'data-mode', 'data-control',
        'data-level', 'data-lvl', 'data-idx', 'data-vehicle', 'data-veh', 'data-id',
        'data-setting', 'data-set'
      ];
      bits.push(el.innerText || '', el.textContent || '', el.value || '',
        typeof el.className === 'string' ? el.className : '');
      attrs.forEach(name => bits.push(el.getAttribute && el.getAttribute(name) || ''));
      if (el.id) {
        const label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
        if (label) bits.push(label.innerText || label.textContent || '');
      }
      const parentLabel = el.closest && el.closest('label');
      if (parentLabel) bits.push(parentLabel.innerText || parentLabel.textContent || '');
      return bits.join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
    }
    function visible(el) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width >= 8 && rect.height >= 8 && style.visibility !== 'hidden' &&
        style.display !== 'none' && Number(style.opacity || 1) > 0.05 &&
        style.pointerEvents !== 'none' && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
    }
    function actionable(el) {
      const tag = el.tagName;
      const role = String(el.getAttribute('role') || '').toLowerCase();
      const marked = [
        'data-action', 'data-panel', 'data-mode', 'data-control',
        'data-level', 'data-lvl', 'data-idx', 'data-vehicle', 'data-veh', 'data-id',
        'data-setting', 'data-set'
      ].some(name => el.hasAttribute(name));
      const style = getComputedStyle(el);
      return ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(tag) ||
        ['button', 'switch', 'checkbox'].includes(role) || marked ||
        style.cursor === 'pointer' || style.cursor === 'not-allowed';
    }
    const selector = [
      'button', '[role="button"]', 'a[href]', 'input', 'select', 'textarea',
      '[tabindex]', '[data-action]', '[data-panel]', '[data-mode]', '[data-control]',
      '[aria-label]', '[title]', '[data-level]', '[data-vehicle]', '[data-veh]', '[data-id]'
    ].concat(interactiveOnly ? [] : ['body *']).join(',');
    return Array.from(document.querySelectorAll(selector))
      .filter(el => visible(el) && (!actionableOnly && !interactiveOnly || actionable(el)))
      .map((el, index) => {
        const label = textFor(el);
        const normalizedLabel = label.replace(/[-_]+/g, ' ');
        const explicitLabel = [
          el.getAttribute('aria-label') || '',
          el.id || '',
          el.getAttribute('name') || '',
          el.getAttribute('role') || '',
          el.getAttribute('data-action') || '',
          el.getAttribute('data-panel') || '',
          el.getAttribute('data-mode') || '',
          el.getAttribute('data-control') || '',
          el.getAttribute('data-level') || '',
          el.getAttribute('data-lvl') || '',
          el.getAttribute('data-idx') || '',
          el.getAttribute('data-vehicle') || '',
          el.getAttribute('data-veh') || '',
          el.getAttribute('data-id') || '',
          el.getAttribute('data-setting') || '',
          el.getAttribute('data-set') || '',
          typeof el.className === 'string' ? el.className : ''
        ].join(' ').replace(/[-_]+/g, ' ').toLowerCase();
        const rect = el.getBoundingClientRect();
        const area = Math.max(1, rect.width * rect.height);
        const explicitMatch = normalizedTerms.reduce((sum, term) => sum + (explicitLabel.includes(term) ? 8 : 0), 0);
        const score = normalizedTerms.reduce((sum, term) => sum + (normalizedLabel.includes(term) ? 10 : 0), 0) +
          explicitMatch +
          (/^(BUTTON|INPUT|SELECT|A)$/.test(el.tagName) ? 3 : 0) +
          Math.min(4, Math.log10(Math.max(10, area)));
        return {
          index,
          label,
          score,
          area,
          tag: el.tagName,
          type: el.type || '',
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + rect.height / 2 + window.scrollY
        };
      })
      .filter(c => c.score >= 10)
      .sort((a, b) => (b.score - a.score) || (a.area - b.area))
      .slice(0, 10);
  `, {
    terms,
    interactiveOnly: !!(opts && opts.interactiveOnly),
    actionableOnly: !!(opts && opts.actionableOnly)
  });
}

async function realClickVisibleControl(browser, terms, observe, opts) {
  await evaluate(browser, `
    if (typeof window.requestAnimationFrame === 'function') {
      await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
    }
  `, {});
  const discoveryOpts = Object.assign({ actionableOnly: true }, opts || {});
  const searchTerms = terms.slice();
  if (terms.some(term => ['close', 'back', 'done'].includes(String(term).toLowerCase()))) {
    const state = await snapshot(browser);
    if (state && state.activePanel && state.activePanel !== 'none' && state.activePanel !== 'result') {
      searchTerms.push(state.activePanel);
    }
  }
  let candidates = [];
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    candidates = await visibleCandidates(browser, searchTerms, discoveryOpts);
    if (candidates && candidates.length) break;
    await sleep(50);
  }
  if (!candidates || candidates.__error) throw new Error(candidates && candidates.__error || 'candidate discovery failed');
  if (!candidates.length) throw new Error(`no visible control found for ${terms.join('/')}`);
  let lastDetail = '';
  for (const candidate of candidates) {
    const hit = await scrollHitPoint(browser, { x: candidate.x, y: candidate.y }, { allowCanvas: false, pageCoordinates: true });
    await mouseClick(browser, hit.x, hit.y);
    await sleep(250);
    const s = await snapshot(browser);
    const outcome = await observe(s, candidate);
    if (outcome === true) return { snapshot: s, candidate };
    if (typeof outcome === 'string') lastDetail = outcome;
  }
  throw new Error(lastDetail || `visible controls did not trigger ${terms.join('/')}`);
}

async function visibleLevelEntryCandidates(browser, record, count) {
  const result = await evaluate(browser, `
    const wanted = arg.record || {};
    const expectedCount = Number.isInteger(arg.count) && arg.count > 1 ? arg.count : 0;
    const attrs = [
      'aria-label', 'title', 'id', 'name', 'role', 'data-action', 'data-panel',
      'data-mode', 'data-control', 'data-level', 'data-lvl', 'data-idx',
      'data-id', 'data-setting', 'data-set'
    ];
    function visible(el) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width >= 8 && rect.height >= 8 &&
        style.visibility !== 'hidden' && style.display !== 'none' &&
        Number(style.opacity || 1) > 0.05 && style.pointerEvents !== 'none';
    }
    function label(el) {
      return [
        el.innerText || '', el.textContent || '', el.value || '',
        typeof el.className === 'string' ? el.className : '',
        ...attrs.map(name => el.getAttribute && el.getAttribute(name) || '')
      ].join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
    }
    function markedOrInteractive(el) {
      const tag = el.tagName;
      const role = String(el.getAttribute('role') || '').toLowerCase();
      const marked = attrs.some(name => el.hasAttribute && el.hasAttribute(name));
      return marked || ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(tag) ||
        ['button', 'switch', 'checkbox'].includes(role) ||
        getComputedStyle(el).cursor === 'pointer';
    }
    function area(el) {
      const rect = el.getBoundingClientRect();
      return Math.max(1, rect.width * rect.height);
    }
    const nodes = Array.from(document.querySelectorAll('body *')).filter(visible);
    const groups = [];
    const seenParents = new Set();
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || seenParents.has(parent)) continue;
      const members = Array.from(parent.children).filter(visible);
      if (members.length < 2 || (expectedCount && members.length !== expectedCount)) continue;
      const areas = members.map(area).sort((a, b) => a - b);
      const median = areas[Math.floor(areas.length / 2)] || 1;
      if (!areas.every(value => value >= median * 0.35 && value <= median * 2.8)) continue;
      seenParents.add(parent);
      groups.push({ members, totalArea: areas.reduce((sum, value) => sum + value, 0) });
    }
    groups.sort((a, b) => {
      const countDelta = expectedCount
        ? Math.abs(a.members.length - expectedCount) - Math.abs(b.members.length - expectedCount)
        : 0;
      return countDelta || b.totalArea - a.totalArea;
    });
    const group = groups[0];
    if (!group) return [];
    const ordered = group.members;
    const wantedId = String(wanted.id || '').toLowerCase();
    let node = wantedId ? ordered.find(el => label(el).includes(wantedId)) : null;
    const wantedIndex = Number(wanted.index);
    if (!node && Number.isInteger(wantedIndex) && wantedIndex >= 0) node = ordered[wantedIndex];
    if (!node) return [];
    const choices = [node];
    if (!wanted.locked) {
      const descendants = [node, ...node.querySelectorAll('*')].filter(visible);
      const marked = descendants
        .filter(markedOrInteractive)
        .sort((a, b) => {
          const aExact = wantedId && label(a).includes(wantedId) ? 1 : 0;
          const bExact = wantedId && label(b).includes(wantedId) ? 1 : 0;
          return (bExact - aExact) || (area(a) - area(b));
        });
      if (marked.length && marked[0] !== node) choices.unshift(marked[0]);
    }
    return choices.map((el, index) => {
      const rect = el.getBoundingClientRect();
      return {
        index,
        label: label(el),
        tag: el.tagName,
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + rect.height / 2 + window.scrollY
      };
    });
  `, { record, count });
  if (!result || result.__error) throw new Error(result && result.__error || 'level entry discovery failed');
  return Array.isArray(result) ? result : [];
}

async function realClickLevelEntry(browser, record, count, observe) {
  await evaluate(browser, `
    if (typeof window.requestAnimationFrame === 'function') {
      await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
    }
  `, {});
  const candidates = await visibleLevelEntryCandidates(browser, record, count);
  if (!candidates.length) throw new Error('no visible level entry matched the public level record');
  let lastDetail = '';
  for (const candidate of candidates) {
    const hit = await scrollHitPoint(browser, { x: candidate.x, y: candidate.y }, {
      allowCanvas: false,
      pageCoordinates: true
    });
    await mouseClick(browser, hit.x, hit.y);
    await sleep(250);
    const after = await snapshot(browser);
    const outcome = await observe(after, candidate);
    if (outcome === true) return { snapshot: after, candidate };
    if (typeof outcome === 'string') lastDetail = outcome;
  }
  throw new Error(lastDetail || 'visible level entry did not produce the expected state');
}

// Resolve the public vehicle record to one visible card; never probe unrelated controls.
async function realClickVehicleEntry(browser, record, observe) {
  let target;
  const deadline = Date.now() + 1500;
  do {
    target = await evaluate(browser, `
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const id = String(arg.id);
    const terms = [arg.name, arg.id].filter(Boolean).map(normalize);
    const attrs = ['data-vehicle', 'data-veh', 'data-id', 'id'];
    const nodes = Array.from(document.querySelectorAll('body *')).filter(el => {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      return el.tagName !== 'CANVAS' && r.width >= 8 && r.height >= 8 &&
        style.display !== 'none' && style.visibility !== 'hidden' &&
        Number(style.opacity) > 0.05 && style.pointerEvents !== 'none' &&
        (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' ||
         attrs.some(a => el.hasAttribute(a)) || typeof el.onclick === 'function' ||
         style.cursor === 'pointer' || style.cursor === 'not-allowed');
    });
    let matches = nodes.filter(el => attrs.some(a => el.getAttribute(a) === id));
    if (!matches.length) {
      matches = nodes.filter(el => {
        const interactive = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' ||
          typeof el.onclick === 'function' || ['pointer', 'not-allowed'].includes(getComputedStyle(el).cursor);
        const text = ' ' + normalize(el.innerText || el.textContent) + ' ';
        return interactive && terms.some(term => text.includes(' ' + term + ' '));
      });
    }
    // Nested text/icon nodes describe the same card, not independent click candidates.
    matches = matches.filter(el => !matches.some(parent => parent !== el && parent.contains(el)));
    if (matches.length > 1) matches = matches.filter(el => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit && el.contains(hit);
    });
    if (matches.length !== 1) return { error: 'vehicle ' + id + ' matched ' + matches.length + ' visible cards' };
    const el = matches[0];
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    if (!hit || !el.contains(hit)) return { error: 'vehicle ' + id + ' card is occluded by ' +
      (hit ? hit.tagName + '#' + hit.id : 'no hit target') };
    return { x, y, label: el.innerText || el.textContent, id,
      ariaDisabled: el.getAttribute('aria-disabled'), disabled: !!el.disabled };
    `, record);
    if (target && !target.__error && !target.error) break;
    await sleep(50);
  } while (Date.now() < deadline);
  if (!target || target.__error || target.error) {
    throw new Error(target && (target.__error || target.error) || 'vehicle card discovery failed');
  }
  // Disabled/locked cards must remain eligible for a real rejection attempt.
  await mouseClick(browser, target.x, target.y);
  await sleep(250);
  const after = await snapshot(browser);
  const outcome = await observe(after, target);
  if (outcome !== true) throw new Error(typeof outcome === 'string' ? outcome : 'vehicle click failed');
  return { snapshot: after, candidate: target };
}

async function changeVisibleSetting(browser, terms) {
  let result;
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    result = await evaluate(browser, `
    const terms = arg.terms.map(t => String(t).toLowerCase());
    function textFor(el) {
      const bits = [
        el.innerText || '', el.textContent || '', el.value || '',
        el.getAttribute('aria-label') || '', el.id || '', el.name || '',
        el.title || '', el.getAttribute('role') || '',
        el.getAttribute('data-setting') || '', el.getAttribute('data-set') || '',
        el.getAttribute('data-id') || '', el.getAttribute('data-control') || ''
      ];
      if (el.id) {
        const label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
        if (label) bits.push(label.innerText || label.textContent || '');
      }
      const parentLabel = el.closest && el.closest('label');
      if (parentLabel) bits.push(parentLabel.innerText || parentLabel.textContent || '');
      const row = el.closest && (el.closest('[data-setting-row]') || el.closest('[data-setting]') || el.closest('[data-set]')) || el.parentElement;
      if (row && row !== el) bits.push(row.innerText || row.textContent || '');
      return bits.join(' ').toLowerCase();
    }
    function actionable(el) {
      const tag = el.tagName;
      const role = String(el.getAttribute('role') || '').toLowerCase();
      const marked = ['data-setting', 'data-set', 'data-id', 'data-control'].some(name => el.hasAttribute(name));
      const style = getComputedStyle(el);
      return ['BUTTON', 'INPUT', 'SELECT'].includes(tag) ||
        ['button', 'switch', 'checkbox'].includes(role) || marked || style.cursor === 'pointer';
    }
    const controls = Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"], select, button, [role="switch"], [role="checkbox"], [data-setting], [data-set], [data-id], [data-control], [id]'));
    const target = controls.find(el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width >= 1 && rect.height >= 1 && style.display !== 'none' && style.visibility !== 'hidden' &&
        style.pointerEvents !== 'none' && !el.disabled && el.getAttribute('aria-disabled') !== 'true' &&
        actionable(el) && terms.some(term => textFor(el).includes(term));
    });
    if (!target) return { ok: false, reason: 'no visible setting control' };
    target.scrollIntoView({ block: 'center', inline: 'center' });
    await new Promise(r => requestAnimationFrame(r));
    if (target.tagName === 'SELECT') {
      const options = Array.from(target.options).filter(o => !o.disabled);
      const next = options.find(o => o.value !== target.value);
      if (!next) return { ok: false, reason: 'select has no alternate option' };
      target.value = next.value;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (target.type === 'checkbox' || target.type === 'radio') {
      target.checked = !target.checked;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.click();
    } else {
      target.click();
    }
    return { ok: true, tag: target.tagName, type: target.type || '', label: textFor(target) };
    `, { terms });
    if (result && result.ok) break;
    if (result && result.__error) break;
    await sleep(50);
  }
  if (!result || result.__error || !result.ok) throw new Error(result && (result.__error || result.reason) || 'setting change failed');
  await sleep(200);
  return result;
}

function gameplayCore(s) {
  return {
    screen: s.screen,
    phase: s.phase,
    result: s.result,
    activePanel: s.activePanel,
    overlayBlocking: !!s.overlayBlocking,
    currentLevel: s.level && s.level.currentId,
    currentVehicle: s.vehicle && s.vehicle.currentId,
    speed: s.motion && s.motion.speedRatio,
    progress: s.motion && s.motion.forwardProgress,
    vertical: s.motion && s.motion.verticalState,
    inputHeld: s.motion && s.motion.inputHeld,
    health: s.vehicle && s.vehicle.healthRatio,
    damaged: s.vehicle && s.vehicle.damaged,
    monsterHealth: s.monster && s.monster.healthRatio,
    monsterDestroyed: s.monster && s.monster.destroyed,
    broken: s.monster && s.monster.brokenBlockCount,
    resultChoices: s.ui && s.ui.resultChoicesVisible,
    unlockedLevels: setKey(s.progression && s.progression.unlockedLevelIds),
    unlockedVehicles: setKey(s.progression && s.progression.unlockedVehicleIds)
  };
}

function speedValue(s) {
  if (s && s.ui && finite(s.ui.speedHudValue)) return s.ui.speedHudValue;
  return s && s.motion && s.motion.speedRatio;
}

function lateralValue(s) {
  if (s && s.vehicle && s.vehicle.lateral && finite(s.vehicle.lateral.normalized)) {
    return s.vehicle.lateral.normalized;
  }
  return s && s.vehicle && s.vehicle.screenX;
}

const suite = [
  {
    id: 'p0-contract-schema',
    level: 'P0',
    name: 'TDD public game-test contract returns semantic snapshot',
    timeoutMs: 30000,
    async run({ browser }) {
      const apiSurface = await evaluate(browser, `
        const api = window.__gameTest;
        return {
          hasApi: !!api,
          reset: !!api && typeof api.reset === 'function',
          input: !!api && typeof api.input === 'function',
          getSnapshot: !!api && typeof api.getSnapshot === 'function',
          loadScenario: !!api && typeof api.loadScenario === 'function'
        };
      `);
      if (!apiSurface.hasApi || !apiSurface.reset || !apiSurface.input || !apiSurface.getSnapshot || !apiSurface.loadScenario) {
        return FAIL(`missing public API surface: ${JSON.stringify(apiSurface)}`);
      }
      const s = await call(browser, 'reset', { clearProgress: true });
      const problem = apiProblem(s);
      if (problem) return FAIL(`reset contract failed: ${problem}`);
      const missing = requiredFamilies(s);
      if (missing.length) return FAIL(`snapshot missing semantic families: ${missing.join(',')}`);
      try { JSON.stringify(s); } catch (error) { return FAIL(`snapshot not JSON serializable: ${error.message}`); }
      return PASS('public API methods exist and reset returns a JSON-serializable semantic snapshot');
    }
  },
  {
    id: 'p0-scenario-availability',
    level: 'P0',
    name: 'Core public scenarios are reachable without fatal errors',
    timeoutMs: 30000,
    async run({ browser }) {
      const names = ['freshStart', 'readyUnlockedLevel', 'readyWithPreparationPanels'];
      for (const name of names) {
        const s = await call(browser, 'loadScenario', name, {});
        const problem = apiProblem(s);
        if (problem) return FAIL(`scenario ${name} failed: ${problem}`);
        const missing = requiredFamilies(s);
        if (missing.length) return FAIL(`scenario ${name} snapshot missing ${missing.join(',')}`);
      }
      const exceptions = arr(browser.exceptions);
      if (exceptions.length) return FAIL(`browser exception during scenario load: ${exceptions.slice(0, 2).join(' | ')}`);
      return PASS('fresh start and ready scenarios load with complete snapshots and no captured fatal exception');
    }
  },
  {
    id: 'p1-real-start-visible',
    level: 'P1',
    name: 'Real visible start control enters playable scene',
    timeoutMs: 40000,
    async run({ browser }) {
      await scenario(browser, 'freshStart');
      let before = await snapshot(browser);
      const loadingDeadline = Date.now() + 8000;
      while (before.ui && before.ui.loadingComplete === false && Date.now() < loadingDeadline) {
        await sleep(100);
        before = await snapshot(browser);
      }
      if (before.ui && before.ui.loadingComplete === false) {
        throw new Error('freshStart did not reach loadingComplete within 8s');
      }
      const clicked = await realClickVisibleControl(browser, ['start', 'play', 'begin', 'go'], async s => {
        const inspect = current => {
          const elements = sceneElements(current);
          const readable = current.playfield && current.playfield.visible &&
            current.playfield.sceneSummary && current.playfield.sceneSummary.hasReadableScene &&
            hasAny(elements, ['vehicle', 'road', 'ramp', 'monster']) &&
            (current.ui.speedHudVisible || current.ui.monsterHealthVisible || elements.includes('hud'));
          return {
            current,
            elements,
            ok: current.screen === 'playing' && ['intro', 'ready'].includes(current.phase) && readable &&
              !current.overlayBlocking && current.canInteractWithPlayfield
          };
        };
        let checked = inspect(s);
        const playableDeadline = Date.now() + 5000;
        while (!checked.ok && Date.now() < playableDeadline) {
          await action(browser, { type: 'wait', durationMs: 100 });
          await sleep(100);
          checked = inspect(await snapshot(browser));
        }
        return checked.ok || `after click screen=${checked.current.screen} phase=${checked.current.phase} elements=${checked.elements.join(',')}`;
      }, { interactiveOnly: true });
      return PASS(`real start control "${clicked.candidate.label.slice(0, 60)}" opened a readable, nonblocked play scene`);
    }
  },
  {
    id: 'p1-contract-ready-scene',
    level: 'P1',
    name: 'Ready scenario exposes readable scene and HUD contract',
    timeoutMs: 25000,
    async run({ browser }) {
      const before = await scenario(browser, 'readyUnlockedLevel');
      const after = await waitAction(browser, 300);
      const elements = sceneElements(after);
      const need = ['vehicle', 'road', 'ramp', 'monster'];
      if (!['playing', 'panel'].includes(after.screen) || !['ready', 'intro'].includes(after.phase)) {
        return FAIL(`ready scene not playable: screen=${after.screen} phase=${after.phase}`);
      }
      if (!after.playfield.visible || !after.playfield.sceneSummary.hasReadableScene || need.some(x => !elements.includes(x))) {
        return FAIL(`readable scene missing semantic objects; elements=${elements.join(',')}`);
      }
      if (after.overlayBlocking || after.activePanel !== 'none' || !after.canInteractWithPlayfield) {
        return FAIL(`ready scene blocked: panel=${after.activePanel} overlay=${after.overlayBlocking}`);
      }
      if (!after.ui.speedHudVisible || !after.ui.monsterHealthVisible || !after.ui.vehicleHealthVisible) {
        return FAIL('ready HUD does not expose speed, monster health, and vehicle health summaries');
      }
      if (after.playfield.sceneSummary.visibleMotionRevision < before.playfield.sceneSummary.visibleMotionRevision) {
        return FAIL('visible motion revision regressed during stable ready wait');
      }
      return PASS('ready scenario remains readable, nonblocked, and HUD-complete');
    }
  },
  {
    id: 'p1-real-hold-accelerates',
    level: 'P1',
    name: 'Real mouse hold accelerates and updates visible motion',
    timeoutMs: 40000,
    async run({ browser }) {
      await scenario(browser, 'readyUnlockedLevel');
      const p = await semanticPlayPoint(browser, 0.5, 0.6);
      const before = await snapshot(browser);
      await mouseDown(browser, p.x, p.y);
      await sleep(350);
      const mid = await snapshot(browser);
      await sleep(450);
      const after = await snapshot(browser);
      await mouseUp(browser, p.x, p.y);
      if (!mid.motion.inputHeld || !after.motion.inputHeld) return FAIL('real mouse hold was not recognized as held input');
      if (!(after.motion.speedRatio > mid.motion.speedRatio && mid.motion.speedRatio > before.motion.speedRatio)) {
        return FAIL(`speed did not rise while held; before=${before.motion.speedRatio} mid=${mid.motion.speedRatio} after=${after.motion.speedRatio}`);
      }
      if (!(after.motion.forwardProgress > mid.motion.forwardProgress && after.motion.motionRevision > before.motion.motionRevision)) {
        return FAIL('hold did not cause forward progress plus motion revision growth');
      }
      if (!after.ui.speedHudVisible || !(speedValue(after) > speedValue(before))) {
        return FAIL('speed HUD did not follow real held acceleration');
      }
      return PASS('real held pointer input drives speed, progress, visible motion, and HUD feedback upward');
    }
  },
  {
    id: 'p1-real-release-coasts',
    level: 'P1',
    name: 'Real release clears active throttle while vehicle coasts',
    timeoutMs: 40000,
    async run({ browser }) {
      await scenario(browser, 'readyUnlockedLevel');
      const p = await semanticPlayPoint(browser, 0.5, 0.6);
      await mouseDown(browser, p.x, p.y);
      await sleep(900);
      const fast = await snapshot(browser);
      await mouseUp(browser, p.x, p.y);
      await sleep(180);
      const coast = await snapshot(browser);
      await sleep(550);
      const later = await snapshot(browser);
      if (coast.motion.inputHeld || later.motion.inputHeld) return FAIL('release did not clear inputHeld');
      if (!(coast.motion.forwardProgress > fast.motion.forwardProgress)) return FAIL('release froze vehicle instead of allowing short inertial coast');
      if (!(coast.motion.speedRatio <= fast.motion.speedRatio && later.motion.speedRatio < coast.motion.speedRatio)) {
        return FAIL(`speed did not trend down after release; fast=${fast.motion.speedRatio} coast=${coast.motion.speedRatio} later=${later.motion.speedRatio}`);
      }
      return PASS('real release stops active acceleration, preserves short coast, and then decelerates');
    }
  },
  {
    id: 'p1-real-steering-opposites',
    level: 'P1',
    name: 'Independent real drags steer visibly in opposite inverted directions',
    timeoutMs: 50000,
    async run({ browser }) {
      async function trial(direction) {
        await scenario(browser, 'readyUnlockedLevel');
        const p = await semanticPlayPoint(browser, 0.5, 0.6);
        const baseline = await snapshot(browser);
        const deltaX = (direction === 'right' ? 1 : -1) * Math.max(70, p.width * 0.2);
        await mouseDown(browser, p.x, p.y);
        await sleep(200);
        await mouseMove(browser, p.x + deltaX, p.y);
        await sleep(500);
        const steered = await snapshot(browser);
        await mouseUp(browser, p.x + deltaX, p.y);
        return {
          direction,
          delta: lateralValue(steered) - lateralValue(baseline),
          intent: steered.motion.steeringIntent,
          visible: steered.motion.visibleDirection,
          orientation: steered.vehicle.orientation,
          before: baseline,
          after: steered
        };
      }
      const rightDrag = await trial('right');
      const leftDrag = await trial('left');
      if (!(rightDrag.delta < 0 && leftDrag.delta > 0)) {
        return FAIL(`inverted signed steering missing; rightDragDelta=${rightDrag.delta}, leftDragDelta=${leftDrag.delta}`);
      }
      const rightSteersLeft = rightDrag.visible === 'left' ||
        rightDrag.orientation === 'turningLeft';
      const leftSteersRight = leftDrag.visible === 'right' ||
        leftDrag.orientation === 'turningRight';
      if (!rightSteersLeft || !leftSteersRight) {
        return FAIL(`player-visible steering did not match inverted direction; right=${rightDrag.visible}/${rightDrag.orientation} left=${leftDrag.visible}/${leftDrag.orientation}`);
      }
      return PASS('right drag moves/points vehicle left and left drag moves/points vehicle right from independent baselines');
    }
  },
  {
    id: 'p1-real-touch-drive-parity',
    level: 'P1',
    name: 'Real touch hold and drag drives acceleration, steering, and release cleanup',
    timeoutMs: 45000,
    async run({ browser }) {
      await scenario(browser, 'readyUnlockedLevel');
      const p = await semanticPlayPoint(browser, 0.5, 0.6);
      const before = await snapshot(browser);
      let afterMove;
      try {
        await browser.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
        await browser.cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: p.x, y: p.y, id: 1, radiusX: 4, radiusY: 4, force: 1 }]
        });
        await sleep(350);
        await browser.cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: p.x + Math.max(60, p.width * 0.18), y: p.y, id: 1, radiusX: 4, radiusY: 4, force: 1 }]
        });
        await sleep(250);
        afterMove = await snapshot(browser);
        await browser.cdp.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [{ x: p.x + Math.max(60, p.width * 0.18), y: p.y, id: 1, radiusX: 4, radiusY: 4, force: 0 }]
        });
      } catch (error) {
        return FAIL(`environment/product touch path failed to dispatch: ${error.message}`);
      }
      await sleep(250);
      const released = await snapshot(browser);
      if (!(afterMove.motion.speedRatio > before.motion.speedRatio || afterMove.motion.forwardProgress > before.motion.forwardProgress)) {
        return FAIL('touchStart/hold did not start acceleration or forward progress');
      }
      const leftSteeringEvidence = afterMove.motion.visibleDirection === 'left' ||
        afterMove.motion.steeringIntent === 'rightDrag' ||
        (afterMove.vehicle && afterMove.vehicle.orientation === 'turningLeft');
      if (!(lateralValue(afterMove) < lateralValue(before)) || !leftSteeringEvidence) {
        return FAIL('rightward touch drag did not produce inverted left steering tendency');
      }
      if (released.motion.inputHeld) return FAIL('touchEnd did not clear held input');
      return PASS('real touch hold accelerates, right drag steers left, and touchEnd releases input');
    }
  },
  {
    id: 'p1-contract-road-bounds',
    level: 'P1',
    name: 'Public steering actions respect road bounds and small-drag dead zone',
    timeoutMs: 35000,
    async run({ browser }) {
      await scenario(browser, 'readyUnlockedLevel');
      const base = await action(browser, { type: 'pressPlayfield', point: 'center' });
      await action(browser, { type: 'dragPlayfield', direction: 'small' });
      await action(browser, { type: 'hold', durationMs: 200 });
      const small = await snapshot(browser);
      const unchanged = Math.abs(lateralValue(small) - lateralValue(base)) < 0.06;
      if (!unchanged) return FAIL(`small drag escaped dead zone; base=${lateralValue(base)} small=${lateralValue(small)}`);
      await scenario(browser, 'readyUnlockedLevel');
      await action(browser, { type: 'pressPlayfield', point: 'center' });
      for (let i = 0; i < 14; i++) {
        await action(browser, { type: 'dragPlayfield', direction: 'left' });
        await action(browser, { type: 'hold', durationMs: 120 });
      }
      const left = await snapshot(browser);
      await scenario(browser, 'readyUnlockedLevel');
      await action(browser, { type: 'pressPlayfield', point: 'center' });
      for (let i = 0; i < 14; i++) {
        await action(browser, { type: 'dragPlayfield', direction: 'right' });
        await action(browser, { type: 'hold', durationMs: 120 });
      }
      const right = await snapshot(browser);
      const limits = left.road && left.road.bounds || right.road && right.road.bounds;
      if (!limits || !finite(limits.leftLimit) || !finite(limits.rightLimit)) return FAIL('road bounds contract missing leftLimit/rightLimit');
      if (left.vehicle.lateral.normalized < limits.leftLimit || right.vehicle.lateral.normalized > limits.rightLimit) {
        return FAIL(`lateral escaped road bounds; left=${left.vehicle.lateral.normalized} right=${right.vehicle.lateral.normalized} limits=${limits.leftLimit}/${limits.rightLimit}`);
      }
      const totalBefore = Math.abs(base.motion.forwardProgress || 0);
      const totalAfter = Math.abs(left.motion.forwardProgress || 0) + Math.abs(right.motion.forwardProgress || 0);
      if (!(totalAfter >= totalBefore)) return FAIL('steering invariant unexpectedly rewound forward progress');
      return PASS('tiny drag is unchanged and repeated steering remains clamped inside public road limits');
    }
  },
  {
    id: 'p1-mixed-explosive-collision',
    level: 'P1',
    name: 'Real route through explosive hazard causes visible damage and slowdown',
    timeoutMs: 50000,
    async run({ browser }) {
      const probe = await scenario(browser, 'roadHazardApproach', { hazard: 'explosive' });
      if (!(probe.road.hazardsVisible > 0)) return FAIL('roadHazardApproach exposes no visible hazards');
      if (probe.road.explosionRevision !== 0 || probe.road.hazardCollisionCount !== 0 || probe.vehicle.healthRatio < 0.999 || probe.road.lastHazardEffect !== 'none') {
        return FAIL('roadHazardApproach starts with a pre-triggered explosive or vehicle cost');
      }
      const trials = await realRouteTrials(browser, { hazard: 'explosive' }, [
        { deltaRatios: [-0.44, -0.22, 0, 0.22, 0.44, 0.22, 0, -0.22], segmentMs: 350 },
        { deltaRatios: [0.44, 0.22, 0, -0.22, -0.44, -0.22, 0, 0.22], segmentMs: 350 },
        { deltaRatios: [-0.44, 0.44, -0.44, 0.44, -0.44], segmentMs: 450 },
        { deltaRatios: [0.44, -0.44, 0.44, -0.44, 0.44], segmentMs: 450 },
        { deltaRatios: [0], segmentMs: 500 },
        { deltaRatios: [-0.48, -0.48, -0.48, -0.48, -0.48, -0.48], segmentMs: 300 },
        { deltaRatios: [0, 0, 0, 0, 0, 0], segmentMs: 300 },
        { deltaRatios: [0.48, 0.48, 0.48, 0.48, 0.48, 0.48], segmentMs: 300 }
      ], (after, before) => after.road.explosionRevision > before.road.explosionRevision, 5000);
      const hit = trials.find(t => {
        const collision = t.after.road.explosionRevision > t.before.road.explosionRevision &&
          t.after.road.hazardCollisionCount > t.before.road.hazardCollisionCount;
        const cost = t.after.vehicle.healthRatio < t.before.vehicle.healthRatio ||
          t.after.motion.speedRatio < t.before.motion.speedRatio ||
          t.after.road.lastHazardEffect !== 'none';
        return collision && cost;
      });
      if (!hit) return FAIL('semantic lane trials did not reach a visible explosive collision');
      const { before, after } = hit;
      return PASS('real semantic lane exploration reaches an explosive collision with gameplay cost');
    }
  },
  {
    id: 'p1-mixed-crossing-car-collision',
    level: 'P1',
    name: 'Moving road hazard collision is contact-coupled and distinguishable from avoidance',
    timeoutMs: 55000,
    async run({ browser }) {
      const probe = await scenario(browser, 'roadHazardApproach', { hazard: 'movingVehicle' });
      if (!(probe.road.movingHazardsVisible > 0)) return FAIL('roadHazardApproach exposes no moving hazards');
      const movingContactEvidence = (after, before) => {
        const movingCountDropped = finite(after.road.movingHazardsVisible) &&
          finite(before.road.movingHazardsVisible) &&
          after.road.movingHazardsVisible < before.road.movingHazardsVisible;
        const lateralPush = finite(lateralValue(after)) && finite(lateralValue(before)) &&
          Math.abs(lateralValue(after) - lateralValue(before)) > 0.05;
        const effect = after.road.lastHazardEffect;
        const gameplayCost = after.vehicle.healthRatio < before.vehicle.healthRatio ||
          after.motion.speedRatio < before.motion.speedRatio || effect !== 'none';
        const movingEffect = effect === 'knockback' || effect === 'damage' ||
          effect === 'slowdown' || effect === 'destroyedVehicle';
        return gameplayCost && (movingCountDropped || lateralPush || movingEffect);
      };
      const trials = await realRouteTrials(browser, { hazard: 'movingVehicle' }, [
        { deltaRatios: [-0.48, -0.24, 0, 0.24, 0.48, 0.24, 0, -0.24, -0.48], segmentMs: 240 },
        { deltaRatios: [0.48, 0.24, 0, -0.24, -0.48, -0.24, 0, 0.24, 0.48], segmentMs: 240 },
        { deltaRatios: [-0.36, -0.12, 0.12, 0.36, 0.12, -0.12, -0.36], segmentMs: 260 },
        { deltaRatios: [0.36, 0.12, -0.12, -0.36, -0.12, 0.12, 0.36], segmentMs: 260 },
        { deltaRatios: [-0.16, -0.16, -0.16, -0.16, -0.16, -0.16], segmentMs: 260 },
        { deltaRatios: [0.16, 0.16, 0.16, 0.16, 0.16, 0.16], segmentMs: 260 },
        { deltaRatio: 0, segmentMs: 260 }
      ], (after, before) => {
        const newContact = after.road.hazardCollisionCount > before.road.hazardCollisionCount;
        return newContact && movingContactEvidence(after, before);
      }, 5200);
      const hit = trials.find(t => {
        const newContact = t.after.road.hazardCollisionCount > t.before.road.hazardCollisionCount;
        return newContact && movingContactEvidence(t.after, t.before);
      });
      if (!hit) return FAIL('semantic lane trials showed no contact-coupled crossing-vehicle effect');
      const avoided = trials.find(t => t.after.road.hazardCollisionCount === t.before.road.hazardCollisionCount &&
        t.after.road.explosionRevision === t.before.road.explosionRevision &&
        t.after.vehicle.healthRatio >= t.before.vehicle.healthRatio &&
        t.after.road.lastHazardEffect === 'none');
      if (avoided && avoided.after.vehicle.healthRatio < hit.after.vehicle.healthRatio &&
          avoided.after.road.hazardCollisionCount >= hit.after.road.hazardCollisionCount) {
        return FAIL('avoidance baseline took equivalent or greater moving-hazard damage/collisions');
      }
      return PASS('semantic lane exploration reaches a crossing-vehicle contact with visible gameplay cost');
    }
  },
  {
    id: 'p1-mixed-ramp-flight-gravity',
    level: 'P1',
    name: 'After a ramp launch, passive flight descends under gravity',
    timeoutMs: 55000,
    async run({ browser }) {
      // Driving is setup here; acceleration is covered by the dedicated hold check.
      const approach = await scenario(browser, 'rampApproach');
      if (!approach.motion || approach.motion.verticalState !== 'grounded' || approach.result !== 'none') {
        return FAIL('rampApproach must begin grounded and non-terminal before establishing a launch');
      }
      const p = await semanticPlayPoint(browser, 0.5, 0.6);
      let airborne = approach;
      await mouseDown(browser, p.x, p.y);
      try {
        const launchDeadline = Date.now() + 6300;
        while (Date.now() < launchDeadline) {
          await sleep(80);
          airborne = await snapshot(browser);
          if (airborne.motion.verticalState === 'airborne' || airborne.result !== 'none') break;
        }
      } finally {
        await mouseUp(browser, p.x, p.y);
      }
      if (airborne.motion.verticalState !== 'airborne') {
        return FAIL(`gravity precondition failed: driving from the ramp approach did not reach airborne; vertical=${airborne.motion.verticalState}`);
      }
      const descentDeadline = Date.now() + 5000;
      while (Date.now() < descentDeadline) {
        await sleep(80);
        const fall = await snapshot(browser);
        // Screen Y alone can change with camera motion; impact alone is not descent.
        const descending = fall.motion.verticalState === 'airborne' &&
          (fall.motion.visibleDirection === 'down' || fall.vehicle.orientation === 'falling');
        if (descending || fall.motion.verticalState === 'landed') {
          return PASS('after a real ramp launch and input release, passive flight shows downward motion or landing');
        }
      }
      return FAIL('after launch and release, no downward flight or landing was observed within 5 seconds');
    }
  },
  {
    id: 'p1-mixed-monster-impact-destruction',
    level: 'P1',
    name: 'Real approach into monster breaks voxels and lowers health',
    timeoutMs: 55000,
    async run({ browser }) {
      const before = await scenario(browser, 'monsterApproach');
      if (!before.monster.visible || before.monster.destroyed) return FAIL('monsterApproach does not expose a living visible monster');
      await pointerDrive(browser, { xRatio: 0.5, yRatio: 0.6, holdBeforeMove: 120, deltaX: 0, holdAfterMove: 900, release: true });
      await sleep(1000);
      const after = await snapshot(browser);
      if (!(after.monster.impactRevision > before.monster.impactRevision && after.monster.healthRatio < before.monster.healthRatio)) {
        return FAIL('real monster approach did not produce impact revision plus health loss');
      }
      if (!(after.monster.brokenBlockCount > before.monster.brokenBlockCount && after.monster.debrisRevision > before.monster.debrisRevision)) {
        return FAIL('monster health loss lacked visible block breakage and debris evidence');
      }
      if (after.motion.speedRatio > before.motion.speedRatio && after.phase !== 'impact') {
        return FAIL('impact did not show speed resistance or impact phase coupling');
      }
      return PASS('real monster route couples impact, broken voxels, debris, health loss, and motion resistance');
    }
  },
  {
    id: 'p1-real-result-retry-clean',
    level: 'P1',
    name: 'Real continue/retry click clears failed run transients',
    timeoutMs: 40000,
    async run({ browser }) {
      const failed = await scenario(browser, 'failureWaiting');
      if (failed.result !== 'fail' || !failed.ui.resultChoicesVisible) return FAIL('failureWaiting lacks fail result choices');
      // The result controls are created by the normal render loop after the
      // scenario state is loaded.  Give that public UI one bounded frame
      // window before discovering and clicking the real continue/retry
      // control; otherwise this check can race the renderer and test a stale
      // DOM rather than the result interaction.
      await sleep(250);
      const beforeCore = gameplayCore(failed);
      const clicked = await realClickVisibleControl(browser, ['continue', 'retry', 'try again'], async () => {
        await action(browser, { type: 'wait', durationMs: 400 });
        const after = await snapshot(browser);
        return (after.result === 'none' && ['ready', 'intro'].includes(after.phase) &&
          !after.motion.inputHeld && after.motion.speedRatio <= 0.02 &&
          after.motion.verticalState === 'grounded' && !after.overlayBlocking &&
          !after.ui.resultChoicesVisible && !after.vehicle.damaged) ||
          `after retry result=${after.result} phase=${after.phase} speed=${after.motion.speedRatio}`;
      });
      const after = clicked.snapshot;
      if (after.road.explosionRevision > failed.road.explosionRevision && beforeCore.result === 'fail') {
        return FAIL('retry/continue introduced new explosion residue instead of cleanup');
      }
      return PASS('real result control clears failed-run speed, damage, overlay, airborne, and result-choice state');
    }
  },
  {
    id: 'p1-contract-victory-terminal-lock',
    level: 'P1',
    name: 'Victory is terminal until nextLevel and cannot farm rewards',
    timeoutMs: 35000,
    async run({ browser }) {
      const win = await scenario(browser, 'victoryResult');
      if (win.result !== 'win' && win.phase !== 'victory') return FAIL('victoryResult is not a terminal win state');
      const unlockedBefore = arr(win.progression.unlockedLevelIds);
      const rewardBefore = !!win.progression.newRewardVisible;
      const healthBefore = win.monster.healthRatio;
      const brokenBefore = win.monster.brokenBlockCount;
      await action(browser, { type: 'pressPlayfield', point: 'center' });
      await action(browser, { type: 'hold', durationMs: 400 });
      const locked = await snapshot(browser);
      if (!approxUnchanged(locked.monster.healthRatio, healthBefore, 0.0001) ||
        locked.monster.brokenBlockCount !== brokenBefore ||
        !sameSet(locked.progression.unlockedLevelIds, unlockedBefore) ||
        (!!locked.progression.newRewardVisible !== rewardBefore)) {
        return FAIL('post-victory driving farmed health, blocks, rewards, or unlock state');
      }
      if (!locked.progression.canGoNext) return PASS('terminal victory rejected extra driving and no next level is currently available');
      const next = await action(browser, { type: 'nextLevel' });
      if (!arr(next.progression.unlockedLevelIds).includes(next.level.currentId) || next.level.currentId === win.level.currentId) {
        return FAIL('nextLevel did not advance to a distinct unlocked level');
      }
      return PASS('victory rejects reward farming and nextLevel enters only unlocked progression');
    }
  },
  {
    id: 'p1-real-level-select-locks',
    level: 'P1',
    name: 'Real level menu clicks accept unlocked and reject locked entries',
    timeoutMs: 45000,
    async run({ browser }) {
      let s = await scenario(browser, 'lockedLevelMenu');
      const unlocked = arr(s.level.available).find(x => !x.locked && !x.selected) ||
        arr(s.level.available).find(x => !x.locked);
      let locked = arr(s.level.available).find(x => x.locked);
      if (!unlocked || !locked) return FAIL('lockedLevelMenu lacks an unlocked level and a locked level');
      const levelCount = arr(s.level.available).length;
      await sleep(100);
      await realClickLevelEntry(browser, unlocked, levelCount, async after => {
        await sleep(250);
        const now = await snapshot(browser);
        return (now.level.currentId === unlocked.id && now.activePanel !== 'levels') ||
          `unlocked click did not select ${unlocked.id}; current=${now.level.currentId} panel=${now.activePanel}`;
      });
      s = await scenario(browser, 'lockedLevelMenu');
      const currentBefore = s.level.currentId;
      const unlocksBefore = arr(s.progression.unlockedLevelIds);
      locked = arr(s.level.available).find(x => x.locked);
      if (!locked) return FAIL('lockedLevelMenu second state lacks a locked level');
      await sleep(100);
      await realClickLevelEntry(browser, locked, arr(s.level.available).length, async () => {
        await sleep(250);
        const after = await snapshot(browser);
        const reason = after.lastAction && after.lastAction.reason;
        const coherent = after.activePanel === 'levels' &&
          (!reason || reason === 'locked' || reason === 'notAvailable');
        return (after.level.currentId === currentBefore &&
          sameSet(after.progression.unlockedLevelIds, unlocksBefore) && coherent) ||
          `locked click mutated current=${after.level.currentId} panel=${after.activePanel} reason=${reason || ''}`;
      });
      return PASS('visible unlocked level applies while visible locked level preserves current progression');
    }
  },
  {
    id: 'p1-real-vehicle-select-locks',
    level: 'P1',
    name: 'Real vehicle clicks persist unlocked choice and reject locked preview on close',
    timeoutMs: 45000,
    async run({ browser }) {
      let s = await scenario(browser, 'lockedVehicleMenu');
      const unlocked = arr(s.vehicle.available).find(x => !x.locked && !x.selected) || arr(s.vehicle.available).find(x => !x.locked);
      const locked = arr(s.vehicle.available).find(x => x.locked);
      if (!unlocked || !locked) return FAIL('lockedVehicleMenu lacks both unlocked and locked vehicle candidates');
      const unlockedClick = await realClickVehicleEntry(browser, unlocked, async () => {
        await sleep(250);
        const after = await snapshot(browser);
        return after.vehicle.currentId === unlocked.id || `unlocked vehicle click did not persist ${unlocked.id}; current=${after.vehicle.currentId}`;
      });
      const unlockedIdsBefore = arr(unlockedClick.snapshot && unlockedClick.snapshot.progression &&
        unlockedClick.snapshot.progression.unlockedVehicleIds);
      await realClickVehicleEntry(browser, locked, async (after, candidate) => {
        await sleep(250);
        const currentStillUnlocked = after.vehicle.currentId === unlocked.id &&
          sameSet(arr(after.progression.unlockedVehicleIds), unlockedIdsBefore);
        const lockedRejected = after.lastAction && after.lastAction.type === 'selectVehicle' &&
          (after.lastAction.reason === 'locked' || after.lastAction.ok === false);
        const targetedLocked = candidate.id === locked.id;
        const lockedPreview = arr(after.vehicle.available).some(x => x.id === locked.id && x.previewed === true);
        return (currentStillUnlocked && (lockedRejected || lockedPreview || targetedLocked)) ||
          `locked vehicle click changed current=${after.vehicle.currentId}`;
      });
      await realClickVisibleControl(browser, ['close', 'back', '✕', '×'], async () => {
        await sleep(250);
        const after = await snapshot(browser);
        const valid = arr(after.progression.unlockedVehicleIds).includes(after.vehicle.currentId);
        return (valid && after.vehicle.currentId === unlocked.id && after.activePanel !== 'vehicles') ||
          `locked vehicle persisted current=${after.vehicle.currentId} panel=${after.activePanel}`;
      });
      return PASS(`visible vehicle cards matched public IDs; ${unlocked.id === s.vehicle.currentId ? 'current unlocked vehicle reselected (only one unlocked choice)' : 'different unlocked vehicle selected'}; locked choice rejected or preview-only and selection persists after close`);
    }
  },
  {
    id: 'p1-real-settings-blocks-driving',
    level: 'P1',
    name: 'Real settings controls block driving and restore ready interaction',
    timeoutMs: 45000,
    async run({ browser }) {
      await scenario(browser, 'readyWithPreparationPanels');
      await realClickVisibleControl(browser, ['settings', 'audio', 'sound', 'music'], async () => {
        const s = await snapshot(browser);
        return s.activePanel === 'settings' && s.overlayBlocking && !s.canInteractWithPlayfield ||
          `settings did not open as blocking panel; panel=${s.activePanel} overlay=${s.overlayBlocking}`;
      });
      const before = await snapshot(browser);
      const audioBefore = JSON.stringify(before.ui.audio || {});
      await changeVisibleSetting(browser, ['sound', 'sfx', 'music', 'audio']);
      const toggled = await snapshot(browser);
      if (JSON.stringify(toggled.ui.audio || {}) === audioBefore) return FAIL('visible audio setting did not change public audio preference');
      const p = await semanticPlayPoint(browser, 0.5, 0.6);
      const speedBefore = toggled.motion.speedRatio;
      const progressBefore = toggled.motion.forwardProgress;
      await mouseDown(browser, p.x, p.y);
      await sleep(350);
      await mouseUp(browser, p.x, p.y);
      const blocked = await snapshot(browser);
      if (!approxUnchanged(blocked.motion.speedRatio, speedBefore, 0.0001) || !approxUnchanged(blocked.motion.forwardProgress, progressBefore, 0.0001)) {
        return FAIL('real playfield input moved vehicle while settings panel was blocking');
      }
      await realClickVisibleControl(browser, ['close', 'back', 'done'], async () => {
        const after = await snapshot(browser);
        return after.activePanel === 'none' && !after.overlayBlocking && after.canInteractWithPlayfield ||
          `close did not restore ready playfield; panel=${after.activePanel} overlay=${after.overlayBlocking}`;
      });
      return PASS('real settings toggle changes audio, blocks underlying driving, and close restores ready interaction');
    }
  },
  {
    id: 'p2-mixed-air-control-no-boost',
    level: 'P2',
    name: 'Real airborne drag changes lateral route without new throttle',
    timeoutMs: 35000,
    async run({ browser }) {
      const before = await scenario(browser, 'airborneApproach');
      if (!before.motion.airControlAvailable) return NA('airborne scenario declares air control unavailable');
      const beforeLateral = lateralValue(before);
      const p = await semanticPlayPoint(browser, 0.5, 0.6);
      await mouseDown(browser, p.x, p.y);
      await mouseMove(browser, p.x - Math.max(60, p.width * 0.18), p.y);
      await sleep(350);
      const held = await snapshot(browser);
      await mouseUp(browser, p.x - Math.max(60, p.width * 0.18), p.y);
      const after = await snapshot(browser);
      const heldLateral = lateralValue(held);
      const afterLateral = lateralValue(after);
      const lateralChanged =
        (finite(beforeLateral) && finite(heldLateral) && !approxUnchanged(heldLateral, beforeLateral)) ||
        (finite(beforeLateral) && finite(afterLateral) && !approxUnchanged(afterLateral, beforeLateral));
      const horizontalDirectionChanged = [held.motion.visibleDirection, after.motion.visibleDirection].some(direction =>
        (direction === 'left' || direction === 'right') && direction !== before.motion.visibleDirection
      );
      if (!lateralChanged && !horizontalDirectionChanged) {
        return FAIL('real airborne lateral drag had no route or visible-direction effect');
      }
      if (held.motion.speedRatio > before.motion.speedRatio + 0.08 ||
          after.motion.speedRatio > before.motion.speedRatio + 0.08) {
        return FAIL('air drag created a free speed boost');
      }
      return PASS('airborne drag changes lateral route while speed remains bounded by no-boost invariant');
    }
  },
  {
    id: 'p2-contract-weak-miss-no-win',
    level: 'P2',
    name: 'Weak or missed monster run does not award victory',
    timeoutMs: 30000,
    async run({ browser }) {
      const before = await scenario(browser, 'readyUnlockedLevel', { level: 'firstUnlocked' });
      const beforeCanGoNext = before.progression.canGoNext;
      const beforeRewardVisible = before.progression.newRewardVisible;
      await action(browser, { type: 'pressPlayfield', point: 'center' });
      await action(browser, { type: 'hold', durationMs: 180 });
      await action(browser, { type: 'releasePlayfield' });
      await waitAction(browser, 1200);
      const after = await snapshot(browser);
      const newRewardVisible = after.progression.newRewardVisible && !beforeRewardVisible;
      const newlyEligibleNext = after.progression.canGoNext && !beforeCanGoNext;
      const nextEntry = after.level && Array.isArray(after.level.available) &&
        finite(after.level.currentIndex)
        ? after.level.available.find(entry =>
          finite(entry.index) && entry.index === after.level.currentIndex + 1)
        : null;
      const nextEligibilityInconsistent = !!(
        after.progression.canGoNext &&
        nextEntry &&
        (nextEntry.locked === true ||
          (Array.isArray(after.progression.unlockedLevelIds) &&
            !after.progression.unlockedLevelIds.includes(nextEntry.id)))
      );
      if (after.result === 'win' || after.monster.destroyed || newRewardVisible || newlyEligibleNext || nextEligibilityInconsistent) {
        return FAIL('weak/missed route awarded win, destroyed monster, reward, or invalid next-level eligibility');
      }
      if (after.monster.healthRatio < before.monster.healthRatio &&
        !(after.monster.brokenBlockCount > before.monster.brokenBlockCount && after.monster.debrisRevision > before.monster.debrisRevision)) {
        return FAIL('partial damage occurred without visible impact/breakage evidence');
      }
      return PASS('miss/weak public route remains non-winning and any partial damage requires visible destruction evidence');
    }
  },
  {
    id: 'p2-contract-active-run-panel-reject',
    level: 'P2',
    name: 'Active sprint rejects preparation panels without interrupting motion',
    timeoutMs: 30000,
    async run({ browser }) {
      await scenario(browser, 'readyUnlockedLevel');
      await action(browser, { type: 'pressPlayfield', point: 'center' });
      await action(browser, { type: 'hold', durationMs: 400 });
      const before = await snapshot(browser);
      const after = await action(browser, { type: 'openPanel', panel: 'levels' });
      const invalid = after.lastAction && after.lastAction.ok === false &&
        ['invalidPhase', 'blockedByPanel', 'notAvailable', 'terminalLocked'].includes(after.lastAction.reason);
      if (!invalid) return FAIL(`active panel request was not rejected; lastAction=${JSON.stringify(after.lastAction)}`);
      if (after.overlayBlocking || after.activePanel !== 'none') return FAIL('rejected active-run panel still opened a blocking overlay');
      if (after.motion.forwardProgress < before.motion.forwardProgress || after.phase === 'paused') {
        return FAIL('rejected panel interrupted, paused, or rewound active sprint');
      }
      return PASS('active run returns invalid/reject reason and preserves nonblocked sprint state');
    }
  },
  {
    id: 'p2-mixed-special-threat-visible-contact',
    level: 'P2',
    name: 'Optional special threat shows warning/motion and contact cost when exposed',
    timeoutMs: 45000,
    async run({ browser }) {
      let before;
      try {
        before = await scenario(browser, 'roadHazardApproach', { threat: 'special' });
      } catch (error) {
        return NA(`special threat scenario not exposed: ${error.message}`);
      }
      const elements = sceneElements(before).map(v => String(v).toLowerCase());
      const hasSpecialThreatSurface = elements.some(v => /threat|warning|projectile|energy|falling|sweep|reticle/.test(v)) ||
        before.road.lastHazardEffect === 'specialThreat';
      if (!hasSpecialThreatSurface) return NA('no public special-threat warning/trajectory surface exposed');
      await pointerDrive(browser, { xRatio: 0.5, yRatio: 0.6, holdBeforeMove: 150, deltaX: 0, holdAfterMove: 1500, release: true });
      await sleep(400);
      const after = await snapshot(browser);
      const visibleWarning = after.playfield.sceneSummary.visibleMotionRevision > before.playfield.sceneSummary.visibleMotionRevision ||
        after.road.hazardsVisible >= before.road.hazardsVisible ||
        after.road.movingHazardsVisible >= before.road.movingHazardsVisible;
      const cost = after.vehicle.healthRatio < before.vehicle.healthRatio ||
        after.motion.speedRatio < before.motion.speedRatio ||
        after.road.lastHazardEffect !== 'none';
      if (!visibleWarning) return FAIL('special threat route lacked visible warning, trajectory, or motion evidence');
      if (!cost) return FAIL('special threat contact did not cause damage, speed loss, shake, or route disruption summary');
      return PASS('exposed special threat has visible warning/motion before contact-coupled vehicle cost');
    }
  },
  {
    id: 'p2-contract-guidance-nonblocking',
    level: 'P2',
    name: 'Guidance or target hints are observable and nonblocking',
    timeoutMs: 30000,
    async run({ browser }) {
      let before;
      try {
        before = await scenario(browser, 'damagedMonsterReady');
      } catch (error) {
        return NA(`damagedMonsterReady guidance scenario not exposed: ${error.message}`);
      }
      const guided = !!before.ui.hintVisible || arr(before.monster.targetZones).length > 0 || sceneElements(before).includes('targetHint');
      if (!guided) return NA('no optional guidance, reticle, or target-zone surface exposed in damaged state');
      const press = await action(browser, { type: 'pressPlayfield', point: 'center' });
      await action(browser, { type: 'hold', durationMs: 350 });
      await sleep(450);
      const moved = await snapshot(browser);
      const playfieldBlocked = press.overlayBlocking || press.activePanel !== 'none' ||
        (press.lastAction && press.lastAction.ok === false);
      if (playfieldBlocked) return FAIL('guidance state exposed a blocking overlay or rejected playfield input');
      if (!(moved.motion.forwardProgress > before.motion.forwardProgress || moved.motion.speedRatio > before.motion.speedRatio)) {
        return FAIL('public driving actions did not progress while guidance was visible');
      }
      return PASS('guidance/target-zone surface is observable and does not block continued driving');
    }
  },
  {
    id: 'p2-contract-depth-progression-visible',
    level: 'P2',
    name: 'Later progression depth is visible without breaking P1 readiness',
    timeoutMs: 30000,
    async run({ browser }) {
      let s;
      try {
        s = await scenario(browser, 'victoryResult', { depth: 'laterProgression' });
      } catch (error) {
        return NA(`later progression scenario not exposed: ${error.message}`);
      }
      const levelCount = arr(s.level.available).length;
      const vehicleCount = arr(s.vehicle.available).length;
      const hasDepth = levelCount > 1 || vehicleCount > 1 || s.progression.newRewardVisible ||
        arr(s.progression.unlockedVehicleIds).length > 1 || s.playfield.sceneSummary.visibleMotionRevision > 0;
      if (!hasDepth) return FAIL('later progression scenario has no visible levels, vehicles, rewards, or spectacle depth');
      if (s.progression.canGoNext) {
        s = await action(browser, { type: 'nextLevel' });
      } else {
        s = await action(browser, { type: 'retry' });
      }
      const playable = ['playing', 'result'].includes(s.screen) && s.playfield && s.playfield.visible &&
        !s.overlayBlocking && sceneElements(s).some(x => ['vehicle', 'road', 'ramp', 'monster', 'resultChoices'].includes(x));
      if (!playable) return FAIL('depth progression action regressed core playable/result scene visibility');
      const locked = arr(s.level.available).find(x => x.locked);
      if (locked && arr(s.progression.unlockedLevelIds).includes(locked.id)) return FAIL('locked level appears in unlocked progression set');
      return PASS('later content/reward variety is visible while core scene and locked rules remain coherent');
    }
  }
];

module.exports = { suite };
