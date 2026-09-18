// City Rider L2 Runtime Checks
// === GDD Coverage Map ===
// M1 -> p0-boot-stability, p1-real-mouse-start-unblocks-playfield
// M2 -> p0-visible-3d-render, p2-view-toggle-preserves-render-and-direction
// M3 -> p1-real-keyboard-left-right-screen-direction, p1-real-mouse-half-screen-direction, p1-real-mouse-drag-lane-direction
// M4 -> p2-contract-edge-lane-rejection-invariant
// M5 -> p1-traffic-motion-and-driving-progress
// M6 -> p1-checkpoint-reward-loop
// M7 -> p1-traffic-risk-feedback
// M8 -> p1-low-time-gameover-and-retry
// M9 -> p1-menu-overlay-blocks-driving
// M10 -> p2-view-toggle-preserves-render-and-direction
// M11 -> p2-shop-insufficient-funds-rejection, p2-shop-affordable-purchase-contract
// M12 -> p2-power-use-and-cooldown-rejection
// M13 -> p2-shop-affordable-purchase-contract
// M14 -> p2-assist-hint-direction-completes
// M15 -> p2-paid-continue-contract
// M16 -> p2-city-world-activity-observable
//
// === Category Map ===
// Boot & Stability: p0-boot-stability, p0-contract-schema
// UI Flow & Blocking: p1-real-mouse-start-unblocks-playfield, p1-menu-overlay-blocks-driving
// Input Semantics: p1-real-keyboard-left-right-screen-direction, p1-real-mouse-half-screen-direction, p1-real-mouse-drag-lane-direction
// Core Mechanic Loop: p1-traffic-motion-and-driving-progress, p1-checkpoint-reward-loop, p1-traffic-risk-feedback
// State Machine: p1-low-time-gameover-and-retry
// Economy / Progression: p2-shop-insufficient-funds-rejection, p2-shop-affordable-purchase-contract, p2-paid-continue-contract
// Feedback & Observability: p0-visible-3d-render, p2-view-toggle-preserves-render-and-direction
// Invariants & Rejection: p2-contract-edge-lane-rejection-invariant, p2-power-use-and-cooldown-rejection
// Depth / Optional Systems: p2-power-use-and-cooldown-rejection
//
// === Rationality Map ===
// p1-real-mouse-start-unblocks-playfield: M1/M9 | real action: mouseClick on discovered playfield center | independent observation: phase/overlay/playfield + canvas hash | empty-shell failure: static splash or blocking overlay remains.
// p1-real-keyboard-left-right-screen-direction: M3 | real action: keyDown/keyUp ArrowLeft and ArrowRight | independent observation: player.screenX deltas + scene/input revision | empty-shell failure: no movement, mirrored direction, or same-direction movement fails.
// p1-real-mouse-half-screen-direction: M3 | real action: pointer/touch tap on discovered left/right playfield points | independent observation: player.screenX deltas | empty-shell failure: click zones missing or wired backward fails.
// p1-real-mouse-drag-lane-direction: M3 | real action: pointer/touch drag left and right on playfield | independent observation: player.screenX deltas + scene/input revision | empty-shell failure: click-only or mirrored drag controls fail.
// p1-traffic-motion-and-driving-progress: M5 | real action: start/wait/keyboard input | independent observation: distance/speed/traffic revision + canvas hash | empty-shell failure: static road or fake HUD without traffic motion fails.
// p1-checkpoint-reward-loop: M6 | real action: setup near checkpoint then wait/real key | independent observation: checkpoint/time/score/phase delta | empty-shell failure: checkpoint gate with no reward or HUD sync fails.
// p1-traffic-risk-feedback: M7 | real action: setup traffic ahead and drive/wait | independent observation: nearMiss/impact/result/speed/revision delta | empty-shell failure: vehicles can be ignored or pass through without feedback fails.
// p1-low-time-gameover-and-retry: M8 | real action: setup low time, wait, then real retry click/key | independent observation: game-over phase then reset state | empty-shell failure: timer not authoritative or retry not clearing state fails.
// p1-menu-overlay-blocks-driving: M9 | real action: key/menu open, real direction input, close | independent observation: overlayBlocking + unchanged distance/lane while blocked | empty-shell failure: decorative menu that does not block gameplay fails.
// p2-contract-edge-lane-rejection-invariant: M4 | contract setup + real/contract outward input | independent observation: lane bounds + totalBefore/totalAfter unchanged | empty-shell failure: illegal lane accepted or unrelated totals mutate fails.
// p2-shop-insufficient-funds-rejection: M11 | contract setup, open shop, buy | independent observation: rejected/unchanged balance/equipment | empty-shell failure: shop buys with negative balance or no rejection fails.
// p2-shop-affordable-purchase-contract: M11/M13 | contract setup, buy/equip | independent observation: balance decrease + ownership/equipped/persistence | empty-shell failure: shop UI only or state not persistent fails.
// p2-paid-continue-contract: M15 | contract setup, continue action | independent observation: balance/cost + phase/progress preservation; unavailable path unchanged | empty-shell failure: continue button decorative, free, or destructive fails.
// p2-power-use-and-cooldown-rejection: M12 | contract setup, use power twice | independent observation: cooldown/effect delta then rejection/unchanged | empty-shell failure: button exists but no effect, or cooldown ignored fails.
// p2-view-toggle-preserves-render-and-direction: M10/M2 | real key/mouse view toggle then direction input | independent observation: render nonblank + direction still signed | empty-shell failure: view toggle blackscreens or mirrors controls fails.
// p2-assist-hint-direction-completes: M14 | contract setup + real hinted direction input | independent observation: assist hint state + player screenX | empty-shell failure: permanent or wrong-way hint fails.
// p2-city-world-activity-observable: M16 | contract setup + driving wait | independent observation: world summaries + economy/score/revision delta | empty-shell failure: decorative city entities or repeated rewards fail.

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function valueAt(obj, path, fallback) {
  let cur = obj;
  for (const part of path.split('.')) {
    if (!cur || typeof cur !== 'object' || !(part in cur)) return fallback;
    cur = cur[part];
  }
  return cur;
}

function totalForInvariant(s) {
  return {
    score: Number(valueAt(s, 'score.current', 0)) || 0,
    balance: Number(valueAt(s, 'economy.balance', 0)) || 0,
    checkpoint: Number(valueAt(s, 'progress.checkpoint', 0)) || 0,
    vehicles: Number(valueAt(s, 'traffic.vehicleCount', 0)) || 0
  };
}

function progressForInvariant(s) {
  return {
    sector: Number(valueAt(s, 'progress.sector', 0)) || 0,
    checkpoint: Number(valueAt(s, 'progress.checkpoint', 0)) || 0,
    time: Number(valueAt(s, 'progress.timeRemaining', 0)) || 0
  };
}

function sameProgress(a, b) {
  return a.sector === b.sector && a.checkpoint === b.checkpoint && Math.abs(a.time - b.time) < 0.5;
}

function garageSummary(s) {
  const g = valueAt(s, 'garage', null) || {};
  return {
    owned: Array.isArray(g.ownedTiers) ? g.ownedTiers.slice().sort((a, b) => a - b) : [],
    equipped: isFiniteNumber(g.equippedTier) ? g.equippedTier : null,
    power: g.equippedPower || valueAt(s, 'power.equippedPower', null),
    next: isFiniteNumber(g.nextAffordableTier) ? g.nextAffordableTier : null
  };
}

function sameTotals(a, b) {
  return a.score === b.score &&
    a.balance === b.balance &&
    a.checkpoint === b.checkpoint &&
    a.vehicles === b.vehicles;
}

function snapshotSummary(s) {
  return JSON.stringify({
    phase: s && s.phase,
    lane: valueAt(s, 'player.lane', null),
    x: valueAt(s, 'player.screenX', null),
    time: valueAt(s, 'progress.timeRemaining', null),
    checkpoint: valueAt(s, 'progress.checkpoint', null),
    balance: valueAt(s, 'economy.balance', null),
    overlay: s && s.overlayBlocking
  });
}

function createGameDriver(browser) {
  async function pageEval(expr) {
    const result = await browser.eval(expr);
    if (result && result.__l2_err__) throw new Error(result.__l2_err__);
    return result;
  }

  async function inferSnapshot() {
    return await pageEval(`(function(){
      const canvases = Array.from(document.querySelectorAll('canvas'));
      let best = null, bestArea = -1;
      for (const c of canvases) {
        const r = c.getBoundingClientRect();
        const area = r.width * r.height;
        const style = getComputedStyle(c);
        if (area > bestArea && r.width > 20 && r.height > 20 && style.display !== 'none' && style.visibility !== 'hidden') {
          best = { left:r.left, top:r.top, width:r.width, height:r.height };
          bestArea = area;
        }
      }
      const vw = window.innerWidth || 800;
      const vh = window.innerHeight || 600;
      const bounds = best || { left:0, top:0, width:vw, height:vh };
      const visiblePanels = Array.from(document.querySelectorAll('button, [role="button"], [data-game-control], [aria-label], div, section'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 120 && r.height > 80 && cs.display !== 'none' && cs.visibility !== 'hidden' &&
            /menu|shop|leader|stat|pause|game over|time|sector|continue|retry|start/i.test((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || ''));
        });
      const overlayBlocking = visiblePanels.some(el => {
        const r = el.getBoundingClientRect();
        return r.width > vw * 0.5 && r.height > vh * 0.35;
      });
      return {
        phase: overlayBlocking ? 'menu' : 'playing',
        screen: overlayBlocking ? 'menu' : 'playing',
        overlayBlocking,
        canInteractWithPlayfield: !overlayBlocking,
        render: { ready: !!best, kind: 'webgl', nonBlank: !!best, mainSceneVisible: !!best },
        playfield: {
          bounds,
          center: { screenX: bounds.left + bounds.width / 2, screenY: bounds.top + bounds.height / 2 },
          leftPoint: { screenX: bounds.left + bounds.width * 0.25, screenY: bounds.top + bounds.height * 0.58 },
          rightPoint: { screenX: bounds.left + bounds.width * 0.75, screenY: bounds.top + bounds.height * 0.58 }
        },
        player: { lane: null, laneCount: null, screenX: bounds.left + bounds.width / 2, screenY: bounds.top + bounds.height * 0.75, speed: 0, distance: 0, isChangingLane: false },
        progress: { sector: 1, checkpoint: 0, checkpointsRequired: 1, checkpointProgress: 0, timeRemaining: null },
        score: { current: 0, nearMisses: 0, impacts: 0, crashes: 0 },
        economy: { balance: 0 },
        traffic: { vehicleCount: 0, movingCount: 0 },
        power: { equippedPower: null, available: false, cooldown: 0, active: false },
        ui: { activePanel: overlayBlocking ? 'menu' : null, hasStartControl: true, hasRetryControl: true, hasShopControl: true, hasPauseControl: true },
        result: { type: 'none', final: false },
        revision: { scene: (window.__l2 && window.__l2.frameCount) || 0, hud: 0, traffic: 0, input: 0 }
      };
    })()`);
  }

  async function snapshot() {
    const result = await pageEval(`(async function(){
      if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
        return await window.__gameTest.getSnapshot();
      }
      return null;
    })()`);
    return result || await inferSnapshot();
  }

  async function reset(options) {
    const payload = JSON.stringify(options || {});
    const result = await pageEval(`(async function(){
      if (window.__gameTest && typeof window.__gameTest.reset === 'function') {
        return await window.__gameTest.reset(${payload});
      }
      return null;
    })()`);
    await browser.sleep(250);
    return result || await snapshot();
  }

  async function hasContract() {
    return await pageEval(`(function(){
      return !!(window.__gameTest &&
        typeof window.__gameTest.reset === 'function' &&
        typeof window.__gameTest.getSnapshot === 'function' &&
        typeof window.__gameTest.input === 'function' &&
        typeof window.__gameTest.loadScenario === 'function');
    })()`);
  }

  async function contractInput(action) {
    const payload = JSON.stringify(action);
    const result = await pageEval(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') {
        return { ok:false, reason:'missing __gameTest.input', snapshot:null };
      }
      return await window.__gameTest.input(${payload});
    })()`);
    await browser.sleep(200);
    return result;
  }

  async function loadScenario(name, options) {
    const n = JSON.stringify(name);
    const o = JSON.stringify(options || {});
    const result = await pageEval(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { __missingScenario: true, reason: 'missing __gameTest.loadScenario' };
      return await window.__gameTest.loadScenario(${n}, ${o});
    })()`);
    await browser.sleep(250);
    return result || { __missingScenario: true, reason: 'loadScenario returned empty result' };
  }

  function playfieldPoint(s, which) {
    const pf = s && s.playfield;
    const p = pf && (pf[which] || (which === 'center' && pf.center));
    if (p && isFiniteNumber(p.screenX) && isFiniteNumber(p.screenY)) return p;
    const b = pf && pf.bounds;
    if (b && isFiniteNumber(b.left) && isFiniteNumber(b.width)) {
      const ratio = which === 'leftPoint' ? 0.25 : which === 'rightPoint' ? 0.75 : 0.5;
      return { screenX: b.left + b.width * ratio, screenY: b.top + b.height * 0.58 };
    }
    return null;
  }

  async function realMouseClickPoint(point) {
    if (!point || !isFiniteNumber(point.screenX) || !isFiniteNumber(point.screenY)) {
      throw new Error('missing TDD playfield point');
    }
    await browser.mouseClick(Math.round(point.screenX), Math.round(point.screenY));
    await browser.sleep(350);
  }

  async function realMouseDragPoint(start, end) {
    if (!start || !end || !isFiniteNumber(start.screenX) || !isFiniteNumber(start.screenY) || !isFiniteNumber(end.screenX) || !isFiniteNumber(end.screenY)) {
      throw new Error('missing TDD playfield drag points');
    }
    const sx = Math.round(start.screenX);
    const sy = Math.round(start.screenY);
    const ex = Math.round(end.screenX);
    const ey = Math.round(end.screenY);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sx, y: sy, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sx, y: sy, button: 'left', clickCount: 1, modifiers: 0 });
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(sx + (ex - sx) * i / steps);
      const y = Math.round(sy + (ey - sy) * i / steps);
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y,
        button: 'left',
        buttons: 1,
        modifiers: 0,
        movementX: Math.round((ex - sx) / steps),
        movementY: Math.round((ey - sy) / steps)
      });
      await browser.sleep(30);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: ex, y: ey, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.sleep(450);
  }

  async function realTouchTapPoint(point) {
    if (!point || !isFiniteNumber(point.screenX) || !isFiniteNumber(point.screenY)) {
      throw new Error('missing TDD playfield point');
    }
    const x = Math.round(point.screenX);
    const y = Math.round(point.screenY);
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, radiusX: 3, radiusY: 3, id: 1 }]
    });
    await browser.sleep(80);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await browser.sleep(450);
  }

  async function realTouchDragPoint(start, end) {
    if (!start || !end || !isFiniteNumber(start.screenX) || !isFiniteNumber(start.screenY) || !isFiniteNumber(end.screenX) || !isFiniteNumber(end.screenY)) {
      throw new Error('missing TDD playfield drag points');
    }
    const sx = Math.round(start.screenX);
    const sy = Math.round(start.screenY);
    const ex = Math.round(end.screenX);
    const ey = Math.round(end.screenY);
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: sx, y: sy, radiusX: 3, radiusY: 3, id: 1 }]
    });
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{
          x: Math.round(sx + (ex - sx) * i / steps),
          y: Math.round(sy + (ey - sy) * i / steps),
          radiusX: 3,
          radiusY: 3,
          id: 1
        }]
      });
      await browser.sleep(30);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await browser.sleep(450);
  }

  async function realKey(code, ms) {
    await browser.keyDown(code);
    await browser.sleep(ms || 80);
    await browser.keyUp(code);
    await browser.sleep(450);
  }

  async function realKeyQuick(code, settleMs) {
    await browser.keyDown(code);
    await browser.sleep(60);
    await browser.keyUp(code);
    await browser.sleep(settleMs === undefined ? 120 : settleMs);
  }

  async function renderProbe() {
    return await pageEval(`(function(){
      const canvases = Array.from(document.querySelectorAll('canvas'));
      let target = null;
      let maxArea = -1;
      for (const canvas of canvases) {
        const rect = canvas.getBoundingClientRect();
        const styles = getComputedStyle(canvas);
        const area = rect.width * rect.height;
        if (area > maxArea &&
            rect.width > 20 && rect.height > 20 &&
            styles.display !== 'none' &&
            styles.visibility !== 'hidden' &&
            styles.opacity !== '0') {
          target = canvas;
          maxArea = area;
        }
      }
      if (!target || !target.width || !target.height) {
        return { available: false, nonBlank: false, signature: null };
      }
      try {
        if (!target.getContext("2d")) {
          return { available: false, nonBlank: false, signature: null };
        }
        const sample = document.createElement('canvas');
        sample.width = 64;
        sample.height = 64;
        const context = sample.getContext('2d', { willReadFrequently: true });
        if (!context) return { available: false, nonBlank: false, signature: null };
        context.drawImage(target, 0, 0, sample.width, sample.height);
        const data = context.getImageData(0, 0, sample.width, sample.height).data;
        const colors = new Set();
        let nonTransparent = 0;
        let checksum = 0;
        for (let i = 0; i < data.length; i += 16) {
          const alpha = data[i + 3];
          if (alpha > 0) nonTransparent++;
          const color = ((data[i] >> 4) << 8) |
            ((data[i + 1] >> 4) << 4) |
            (data[i + 2] >> 4);
          colors.add(color);
          checksum = (checksum * 33 + color) >>> 0;
        }
        return {
          available: true,
          nonBlank: nonTransparent > 0 && colors.size > 4,
          signature: colors.size + ':' + checksum
        };
      } catch (e) {
        return { available: false, nonBlank: false, signature: null };
      }
    })()`);
  }

  async function startWithRealClick() {
    const s = await snapshot();
    await realMouseClickPoint(playfieldPoint(s, 'center'));
    return await snapshot();
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  async function visibleButtonsText() {
    return await pageEval(`(function(){
      return Array.from(document.querySelectorAll('button, [role="button"], [data-game-control], [aria-label]'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 5 && r.height > 5 && cs.display !== 'none' && cs.visibility !== 'hidden';
        })
        .map(el => ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).trim().toLowerCase())
        .slice(0, 30);
    })()`);
  }

  async function clickSemanticButton(pattern) {
    const source = String(pattern);
    const point = await pageEval(`(function(){
      const re = new RegExp(${JSON.stringify(source)}, 'i');
      const els = Array.from(document.querySelectorAll('button, [role="button"], [data-game-control], [aria-label], .hud-btn'));
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const label = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.dataset && Object.values(el.dataset).join(' ') || '')).trim();
        if (r.width > 5 && r.height > 5 && cs.display !== 'none' && cs.visibility !== 'hidden' && re.test(label)) {
          return { screenX: r.left + r.width / 2, screenY: r.top + r.height / 2 };
        }
      }
      return null;
    })()`);
    if (!point || !isFiniteNumber(point.screenX) || !isFiniteNumber(point.screenY)) return false;
    await browser.mouseClick(Math.round(point.screenX), Math.round(point.screenY));
    await browser.sleep(350);
    return true;
  }

  return {
    snapshot,
    reset,
    hasContract,
    contractInput,
    loadScenario,
    playfieldPoint,
    realMouseClickPoint,
    realMouseDragPoint,
    realTouchTapPoint,
    realTouchDragPoint,
    realKey,
    realKeyQuick,
    startWithRealClick,
    canvasHash,
    renderProbe,
    visibleButtonsText,
    clickSemanticButton
  };
}

async function ensureStarted(game) {
  let s = await game.snapshot();
  if (s.phase !== 'playing' || s.overlayBlocking || !s.canInteractWithPlayfield) {
    s = await game.startWithRealClick();
  }
  if (s.phase !== 'playing' && s.phase !== 'danger' && !s.canInteractWithPlayfield) {
    await game.contractInput({ type: 'start' });
    s = await game.snapshot();
  }
  return s;
}

async function requireScenario(game, name, options) {
  const s = await game.loadScenario(name, options);
  if (s && s.__missingScenario) throw new Error(`${name}: ${s.reason || 'missing scenario'}`);
  return s;
}

function schemaProblems(s) {
  const required = ['phase', 'render', 'playfield', 'player', 'progress', 'score', 'economy', 'traffic', 'power', 'ui', 'result', 'revision'];
  const missing = required.filter(k => !(s && Object.prototype.hasOwnProperty.call(s, k)));
  if (missing.length) return 'missing fields: ' + missing.join(', ');
  if (!s.playfield.bounds || !isFiniteNumber(s.playfield.bounds.width) || !isFiniteNumber(s.playfield.bounds.height)) return 'invalid playfield.bounds';
  if (!s.player || !isFiniteNumber(s.player.screenX)) return 'invalid player.screenX';
  if (!s.progress || typeof s.progress !== 'object') return 'invalid progress';
  if (!s.ui || typeof s.ui !== 'object') return 'invalid ui';
  return null;
}

const suite = [
  {
    id: 'p0-boot-stability',
    level: 'P0',
    name: 'boot stability and no fatal runtime exception',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      await browser.sleep(1200);
      const fatal = browser.exceptions.filter(e => !/ResizeObserver|Script error/i.test(e.description || e.text || ''));
      if (fatal.length) return FAIL('runtime exception: ' + (fatal[0].description || fatal[0].text));
      const game = createGameDriver(browser);
      const s = await game.snapshot();
      if (!s) return FAIL('no observable snapshot or DOM fallback');
      const bounds = valueAt(s, 'playfield.bounds', null);
      if (!bounds || bounds.width < 120 || bounds.height < 120) return FAIL('playfield too small or missing');
      return PASS('booted with observable playfield');
    }
  },
  {
    id: 'p0-visible-3d-render',
    level: 'P0',
    name: 'visible nonblank 3D render surface',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await ensureStarted(game);
      const s = await game.snapshot();
      const size = await browser.getCanvasSize();
      const hashA = await game.canvasHash();
      await browser.sleep(500);
      const hashB = await game.canvasHash();
      const renderReady = valueAt(s, 'render.ready', false) || (size && size.cssW > 100 && size.cssH > 100);
      const nonBlank = valueAt(s, 'render.nonBlank', false) || hashA !== null;
      if (!renderReady || !nonBlank) return FAIL('main render not visible/nonblank');
      if (size && (size.cssW < 120 || size.cssH < 120)) return FAIL('canvas visible area too small');
      return PASS('render visible; hash=' + hashA + '/' + hashB);
    }
  },
  {
    id: 'p0-contract-schema',
    level: 'P0',
    name: 'public __gameTest contract schema',
    timeoutMs: 10000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('missing window.__gameTest reset/input/getSnapshot/loadScenario');
      const s = await game.reset();
      const problem = schemaProblems(s);
      if (problem) return FAIL(problem);
      const invalid = await game.contractInput({ type: 'not-a-real-action' });
      const after = invalid && invalid.snapshot ? invalid.snapshot : await game.snapshot();
      if (invalid && invalid.ok === true) return FAIL('invalid action returned ok:true');
      if (schemaProblems(after)) return FAIL('snapshot after invalid action does not keep schema');
      return PASS('contract schema and invalid action rejection observed');
    }
  },
  {
    id: 'p1-real-mouse-start-unblocks-playfield',
    level: 'P1',
    name: 'real mouse click start unblocks playfield',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset();
      const beforeHash = await game.canvasHash();
      const startSnapshot = await game.snapshot();
      const clickedStart = await game.clickSemanticButton('start|ride|play|begin');
      if (!clickedStart) {
        const startPoint = game.playfieldPoint(startSnapshot, 'center');
        if (!startPoint) return FAIL('missing start control or playfield center for real mouse start');
        await browser.mouseClick(Math.round(startPoint.screenX), Math.round(startPoint.screenY));
        await browser.sleep(350);
      }
      const s = await game.snapshot();
      const afterHash = await game.canvasHash();
      if (s.overlayBlocking) return FAIL('overlay still blocking after real start click');
      if (s.canInteractWithPlayfield === false) return FAIL('playfield not interactive after start click');
      if (s.phase !== 'playing' && s.phase !== 'danger' && s.phase !== 'crashing') return FAIL('unexpected phase after start: ' + s.phase);
      if (!s.playfield || !s.playfield.bounds || !isFiniteNumber(s.playfield.bounds.width) || !isFiniteNumber(s.player && s.player.screenX)) {
        return FAIL('started state lacks playfield bounds or player screen position');
      }
      if (beforeHash === afterHash && valueAt(s, 'revision.scene', 0) === 0) return FAIL('start click produced no scene or revision evidence');
      return PASS('real click entered playable state');
    }
  },
  {
    id: 'p1-real-keyboard-left-right-screen-direction',
    level: 'P1',
    name: 'real keyboard left/right screen direction semantics',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const base = await game.snapshot();
      const baseX = valueAt(base, 'player.screenX', null);
      if (!isFiniteNumber(baseX)) return FAIL('missing player.screenX for direction oracle');

      await game.realKey('ArrowLeft');
      const left = await game.snapshot();
      const leftDelta = valueAt(left, 'player.screenX', baseX) - baseX;

      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const base2 = await game.snapshot();
      const base2X = valueAt(base2, 'player.screenX', null);
      await game.realKey('ArrowRight');
      const right = await game.snapshot();
      const rightDelta = valueAt(right, 'player.screenX', base2X) - base2X;

      if (leftDelta === 0) return FAIL('ArrowLeft did not visibly move player left; delta=' + leftDelta);
      if (rightDelta === 0) return FAIL('ArrowRight did not visibly move player right; delta=' + rightDelta);
      if (!(leftDelta < 0 && rightDelta > 0)) {
        return FAIL('screen direction wrong or not opposite: leftDelta=' + leftDelta + ', rightDelta=' + rightDelta);
      }
      if (Math.sign(leftDelta) === Math.sign(rightDelta)) return FAIL('left/right movement signs are not opposite');
      return PASS('keyboard deltas are opposite and screen-correct');
    }
  },
  {
    id: 'p1-real-mouse-half-screen-direction',
    level: 'P1',
    name: 'real mouse click left/right half screen direction',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const base = await game.snapshot();
      const baseX = valueAt(base, 'player.screenX', null);
      if (!isFiniteNumber(baseX)) return FAIL('missing player.screenX for mouse direction oracle');
      function usableSidePoint(snapshot, which) {
        const point = game.playfieldPoint(snapshot, which);
        const bounds = valueAt(snapshot, 'playfield.bounds', null);
        const pointIsFinite = point && isFiniteNumber(point.screenX) && isFiniteNumber(point.screenY);
        const boundsAreValid = bounds &&
          isFiniteNumber(bounds.left) && isFiniteNumber(bounds.top) &&
          isFiniteNumber(bounds.width) && isFiniteNumber(bounds.height) &&
          bounds.width > 0 && bounds.height > 0;
        if (!boundsAreValid) return pointIsFinite ? point : null;
        const insideBounds = pointIsFinite &&
          point.screenX >= bounds.left && point.screenX <= bounds.left + bounds.width &&
          point.screenY >= bounds.top && point.screenY <= bounds.top + bounds.height;
        if (insideBounds) return point;
        const ratio = which === 'leftPoint' ? 0.25 : 0.75;
        return {
          screenX: bounds.left + bounds.width * ratio,
          screenY: bounds.top + bounds.height * 0.58
        };
      }
      const leftPoint = usableSidePoint(base, 'leftPoint');
      if (!leftPoint) return FAIL('missing left playfield point for real mouse click');
      await browser.mouseClick(Math.round(leftPoint.screenX), Math.round(leftPoint.screenY));
      await browser.sleep(350);
      let left = await game.snapshot();
      let leftDelta = valueAt(left, 'player.screenX', baseX) - baseX;
      if (Math.abs(leftDelta) < 1) {
        await requireScenario(game, 'fresh_playing');
        await ensureStarted(game);
        const touchBase = await game.snapshot();
        const touchBaseX = valueAt(touchBase, 'player.screenX', null);
        const touchPoint = usableSidePoint(touchBase, 'leftPoint');
        if (!isFiniteNumber(touchBaseX) || !touchPoint) return FAIL('missing left touch point or player.screenX for direction oracle');
        await game.realTouchTapPoint(touchPoint);
        left = await game.snapshot();
        leftDelta = valueAt(left, 'player.screenX', touchBaseX) - touchBaseX;
      }

      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const base2 = await game.snapshot();
      const base2X = valueAt(base2, 'player.screenX', null);
      if (!isFiniteNumber(base2X)) return FAIL('missing player.screenX for mouse direction oracle');
      const rightPoint = usableSidePoint(base2, 'rightPoint');
      if (!rightPoint) return FAIL('missing right playfield point for real mouse click');
      await browser.mouseClick(Math.round(rightPoint.screenX), Math.round(rightPoint.screenY));
      await browser.sleep(350);
      let right = await game.snapshot();
      let rightDelta = valueAt(right, 'player.screenX', base2X) - base2X;
      if (Math.abs(rightDelta) < 1) {
        await requireScenario(game, 'fresh_playing');
        await ensureStarted(game);
        const touchBase = await game.snapshot();
        const touchBaseX = valueAt(touchBase, 'player.screenX', null);
        const touchPoint = usableSidePoint(touchBase, 'rightPoint');
        if (!isFiniteNumber(touchBaseX) || !touchPoint) return FAIL('missing right touch point or player.screenX for direction oracle');
        await game.realTouchTapPoint(touchPoint);
        right = await game.snapshot();
        rightDelta = valueAt(right, 'player.screenX', touchBaseX) - touchBaseX;
      }

      if (!(leftDelta < 0 && rightDelta > 0)) {
        return FAIL('mouse half-screen directions not screen-correct: left=' + leftDelta + ', right=' + rightDelta);
      }
      return PASS('mouse half-screen direction deltas are screen-correct');
    }
  },
  {
    id: 'p1-real-mouse-drag-lane-direction',
    level: 'P1',
    name: 'real mouse drag left/right lane direction semantics',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const base = await game.snapshot();
      const baseX = valueAt(base, 'player.screenX', null);
      if (!isFiniteNumber(baseX)) return FAIL('missing player.screenX for drag oracle');
      const centerPoint = game.playfieldPoint(base, 'center');
      const leftPoint = game.playfieldPoint(base, 'leftPoint');
      if (!centerPoint || !leftPoint) return FAIL('missing center/left playfield point for real mouse drag');
      await browser.mouseClick(Math.round(centerPoint.screenX), Math.round(centerPoint.screenY));
      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const dragBase = await game.snapshot();
      const dragBaseX = valueAt(dragBase, 'player.screenX', baseX);
      const dragCenter = game.playfieldPoint(dragBase, 'center');
      const dragLeft = game.playfieldPoint(dragBase, 'leftPoint');
      await game.realMouseDragPoint(dragCenter, dragLeft);
      let left = await game.snapshot();
      let leftDelta = valueAt(left, 'player.screenX', dragBaseX) - dragBaseX;
      if (Math.abs(leftDelta) < 1) {
        await requireScenario(game, 'fresh_playing');
        await ensureStarted(game);
        const touchBase = await game.snapshot();
        await game.realTouchDragPoint(game.playfieldPoint(touchBase, 'center'), game.playfieldPoint(touchBase, 'leftPoint'));
        left = await game.snapshot();
        leftDelta = valueAt(left, 'player.screenX', valueAt(touchBase, 'player.screenX', baseX)) - valueAt(touchBase, 'player.screenX', baseX);
      }

      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const base2 = await game.snapshot();
      const base2X = valueAt(base2, 'player.screenX', null);
      if (!isFiniteNumber(base2X)) return FAIL('missing player.screenX for right drag oracle');
      const centerPoint2 = game.playfieldPoint(base2, 'center');
      const rightPoint = game.playfieldPoint(base2, 'rightPoint');
      if (!centerPoint2 || !rightPoint) return FAIL('missing center/right playfield point for real mouse drag');
      await game.realMouseDragPoint(centerPoint2, rightPoint);
      let right = await game.snapshot();
      let rightDelta = valueAt(right, 'player.screenX', base2X) - base2X;
      if (Math.abs(rightDelta) < 1) {
        await requireScenario(game, 'fresh_playing');
        await ensureStarted(game);
        const touchBase = await game.snapshot();
        await game.realTouchDragPoint(game.playfieldPoint(touchBase, 'center'), game.playfieldPoint(touchBase, 'rightPoint'));
        right = await game.snapshot();
        rightDelta = valueAt(right, 'player.screenX', valueAt(touchBase, 'player.screenX', base2X)) - valueAt(touchBase, 'player.screenX', base2X);
      }

      if (Math.abs(leftDelta) < 1 || Math.abs(rightDelta) < 1) {
        return FAIL('drag input produced too little visible movement: left=' + leftDelta + ', right=' + rightDelta);
      }
      if (!(leftDelta < 0 && rightDelta > 0)) {
        return FAIL('drag direction not screen-correct: left=' + leftDelta + ', right=' + rightDelta);
      }
      if (Math.sign(leftDelta) === Math.sign(rightDelta)) return FAIL('left/right drag signs are not opposite');
      return PASS('drag deltas are opposite and screen-correct');
    }
  },
  {
    id: 'p1-traffic-motion-and-driving-progress',
    level: 'P1',
    name: 'driving progress and traffic motion loop',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      await browser.sleep(900);
      await game.realKey('ArrowRight');
      await browser.sleep(900);
      const after = await game.snapshot();
      const hashAfter = await game.canvasHash();
      const distanceDelta = Number(valueAt(after, 'player.distance', 0)) - Number(valueAt(before, 'player.distance', 0));
      const trafficDelta = Number(valueAt(after, 'revision.traffic', 0)) - Number(valueAt(before, 'revision.traffic', 0));
      const moving = Number(valueAt(after, 'traffic.movingCount', 0));
      const speed = Number(valueAt(after, 'player.speed', 0));
      const playerPositionChanged = Math.abs(Number(valueAt(after, 'player.screenX', 0)) - Number(valueAt(before, 'player.screenX', 0))) > 0.5 ||
        Math.abs(Number(valueAt(after, 'player.distance', 0)) - Number(valueAt(before, 'player.distance', 0))) > 0.5;
      if (!(distanceDelta > 0 || speed > 0 || trafficDelta > 0 || moving > 0)) {
        return FAIL('no driving progress or traffic motion; before=' + snapshotSummary(before) + ' after=' + snapshotSummary(after));
      }
      if (!playerPositionChanged && trafficDelta <= 0 && moving <= 0) return FAIL('driving progress lacks player position or traffic semantic movement');
      if (hashBefore === hashAfter && Number(valueAt(after, 'revision.scene', 0)) === Number(valueAt(before, 'revision.scene', 0))) {
        return FAIL('driving progress not reflected in scene/hash');
      }
      return PASS('distance/speed/traffic advanced');
    }
  },
  {
    id: 'p1-checkpoint-reward-loop',
    level: 'P1',
    name: 'checkpoint trigger gives time progress reward',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const scenarioStart = await requireScenario(game, 'near_checkpoint');
      await ensureStarted(game);
      const before = scenarioStart && scenarioStart.snapshot ? scenarioStart.snapshot : scenarioStart;
      await browser.sleep(1200);
      await game.realKey('ArrowRight');
      await browser.sleep(1200);
      const after = await game.snapshot();
      const checkpointDelta = Number(valueAt(after, 'progress.checkpoint', 0)) - Number(valueAt(before, 'progress.checkpoint', 0));
      const timeDelta = Number(valueAt(after, 'progress.timeRemaining', 0)) - Number(valueAt(before, 'progress.timeRemaining', 0));
      const scoreDelta = Number(valueAt(after, 'score.current', 0)) - Number(valueAt(before, 'score.current', 0));
      const sectorCleared = after.phase === 'sector-cleared' || valueAt(after, 'result.type', '') === 'sector-cleared';
      if (!(checkpointDelta > 0 || timeDelta > 0 || scoreDelta > 0 || sectorCleared)) {
        return FAIL('near checkpoint did not produce reward/progress; before=' + snapshotSummary(before) + ' after=' + snapshotSummary(after));
      }
      return PASS('checkpoint reward/progress observed');
    }
  },
  {
    id: 'p1-traffic-risk-feedback',
    level: 'P1',
    name: 'traffic ahead produces risk feedback',
    timeoutMs: 22000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await requireScenario(game, 'traffic_ahead');
      await ensureStarted(game);
      const before = await game.snapshot();
      await browser.sleep(900);
      await game.realKey('ArrowLeft');
      await browser.sleep(1400);
      const after = await game.snapshot();
      const nearMissDelta = Number(valueAt(after, 'score.nearMisses', 0)) - Number(valueAt(before, 'score.nearMisses', 0));
      const impactDelta = Number(valueAt(after, 'score.impacts', 0)) - Number(valueAt(before, 'score.impacts', 0));
      const speedDelta = Math.abs(Number(valueAt(after, 'player.speed', 0)) - Number(valueAt(before, 'player.speed', 0)));
      const resultChanged = valueAt(after, 'result.type', 'none') !== valueAt(before, 'result.type', 'none') || after.phase === 'danger' || after.phase === 'crashing' || after.phase === 'game-over';
      const trafficRevision = Number(valueAt(after, 'revision.traffic', 0)) - Number(valueAt(before, 'revision.traffic', 0));
      if (!(nearMissDelta > 0 || impactDelta > 0 || speedDelta > 3 || resultChanged || trafficRevision > 0)) {
        return FAIL('traffic ahead caused no observable risk feedback');
      }
      return PASS('traffic risk feedback observed');
    }
  },
  {
    id: 'p1-low-time-gameover-and-retry',
    level: 'P1',
    name: 'low time reaches game over and retry clears transient state',
    timeoutMs: 24000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await requireScenario(game, 'low_time');
      await ensureStarted(game);
      const before = await game.snapshot();
      await browser.sleep(2500);
      let over = await game.snapshot();
      if (over.phase !== 'game-over' && valueAt(over, 'result.final', false) !== true) {
        await browser.sleep(2500);
        over = await game.snapshot();
      }
      if (over.phase !== 'game-over' && valueAt(over, 'result.type', 'none') !== 'time-up') {
        return FAIL('low_time scenario did not reach game-over; phase=' + over.phase);
      }
      const balanceBeforeRetry = Number(valueAt(over, 'economy.balance', 0));
      const clicked = await game.clickSemanticButton('retry|again|restart|try|play');
      if (!clicked) await game.realKey('Enter');
      const after = await game.snapshot();
      if (after.phase === 'game-over' && valueAt(after, 'result.final', false)) return FAIL('retry did not leave terminal state');
      if (Number(valueAt(after, 'economy.balance', 0)) < 0) return FAIL('balance became negative after retry');
      if (Math.abs(Number(valueAt(after, 'economy.balance', 0)) - balanceBeforeRetry) > 100000000) return FAIL('retry caused implausible persistent balance mutation');
      if (Number(valueAt(after, 'traffic.vehicleCount', 0)) > Number(valueAt(before, 'traffic.vehicleCount', 0)) + 100) return FAIL('retry did not clear transient traffic');
      return PASS('game-over and retry transition observed');
    }
  },
  {
    id: 'p1-menu-overlay-blocks-driving',
    level: 'P1',
    name: 'real menu overlay blocks driving input and then closes',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      await game.realKey('KeyM');
      let menu = await game.snapshot();
      if (!menu.overlayBlocking) {
        await game.clickSemanticButton('menu|pause|shop|settings');
        menu = await game.snapshot();
      }
      if (!menu.overlayBlocking) return FAIL('menu/pause did not create blocking overlay');
      const beforeTotals = totalForInvariant(menu);
      const beforeLane = valueAt(menu, 'player.lane', null);
      const beforeDistance = Number(valueAt(menu, 'player.distance', 0));
      await game.realKey('ArrowLeft');
      await browser.sleep(600);
      const blocked = await game.snapshot();
      const afterTotals = totalForInvariant(blocked);
      const afterDistance = Number(valueAt(blocked, 'player.distance', 0));
      if (!sameTotals(beforeTotals, afterTotals)) return FAIL('menu-blocked driving changed totals');
      if (beforeLane !== null && valueAt(blocked, 'player.lane', null) !== beforeLane) return FAIL('lane changed while menu overlay was blocking');
      if (Math.abs(afterDistance - beforeDistance) > 1) return FAIL('distance advanced while menu overlay was blocking');
      await game.clickSemanticButton('close|resume|continue|back');
      const closed = await game.snapshot();
      if (closed.overlayBlocking && closed.phase === 'playing') return FAIL('playing phase still has blocking overlay after close');
      return PASS('overlay blocked input and could close');
    }
  },
  {
    id: 'p2-contract-edge-lane-rejection-invariant',
    level: 'P2',
    name: 'contract edge lane invalid direction rejection invariant',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('missing contract for edge rejection scenario');
      await requireScenario(game, 'left_edge');
      const action = { type: 'key', code: 'ArrowLeft' };
      const atomic = await browser.eval(`(async function(){
        try {
          const api = window.__gameTest;
          if (!api || typeof api.getSnapshot !== 'function' || typeof api.input !== 'function') {
            return { __l2_err__: 'missing contract for edge rejection scenario' };
          }
          const before = await api.getSnapshot();
          const result = await api.input(${JSON.stringify(action)});
          const after = result && result.snapshot ? result.snapshot : await api.getSnapshot();
          return { before, result, after };
        } catch (err) {
          return { __l2_err__: err && err.message ? err.message : String(err) };
        }
      })()`);
      if (atomic && atomic.__l2_err__) return FAIL(atomic.__l2_err__);
      if (!atomic || !atomic.before || !atomic.after) return FAIL('edge action did not expose atomic snapshots');
      const before = atomic.before;
      const totalBefore = totalForInvariant(before);
      const laneBefore = valueAt(before, 'player.lane', null);
      const result = atomic.result;
      const after = atomic.after;
      const totalAfter = totalForInvariant(after);
      const laneAfter = valueAt(after, 'player.lane', null);
      const unchanged = sameTotals(totalBefore, totalAfter);
      if (!unchanged) return FAIL('illegal edge input changed conserved totals');
      if (laneAfter !== laneBefore && Number(laneAfter) < Number(laneBefore)) return FAIL('edge lane moved farther outward');
      if (result && result.ok === true && laneAfter !== laneBefore) return FAIL('invalid edge action accepted with lane mutation');
      return PASS('edge rejection invariant held totalBefore=' + JSON.stringify(totalBefore) + ' totalAfter=' + JSON.stringify(totalAfter));
    }
  },
  {
    id: 'p2-shop-insufficient-funds-rejection',
    level: 'P2',
    name: 'contract shop insufficient funds rejection unchanged',
    timeoutMs: 16000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('missing contract for shop insufficient scenario');
      const before = await requireScenario(game, 'shop_insufficient');
      await game.contractInput({ type: 'openShop' });
      const totalBefore = totalForInvariant(await game.snapshot());
      const garageBefore = garageSummary(before);
      const result = await game.contractInput({ type: 'buyOrEquipBike', bikeTier: 6 });
      const after = result && result.snapshot ? result.snapshot : await game.snapshot();
      const totalAfter = totalForInvariant(after);
      const garageAfter = garageSummary(after);
      const rejected = result && (result.ok === false || /insufficient|reject|fund|balance|余额|不足/i.test(String(result.reason || '')));
      if (!rejected && Number(valueAt(after, 'economy.balance', 0)) < Number(valueAt(before, 'economy.balance', 0))) {
        return FAIL('insufficient purchase decreased balance without rejection');
      }
      if (!sameTotals(totalBefore, totalAfter)) return FAIL('insufficient purchase changed conserved totals');
      if (JSON.stringify(garageBefore) !== JSON.stringify(garageAfter)) return FAIL('insufficient purchase changed garage state');
      if (Number(valueAt(after, 'economy.balance', 0)) < 0) return FAIL('insufficient purchase made balance negative');
      return PASS('insufficient funds rejected unchanged');
    }
  },
  {
    id: 'p2-shop-affordable-purchase-contract',
    level: 'P2',
    name: 'contract shop affordable purchase updates progression',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('missing contract for shop affordable scenario');
      const before = await requireScenario(game, 'shop_affordable');
      await game.contractInput({ type: 'openShop' });
      const beforeGarage = garageSummary(before);
      const tier = [1, 2, 3, 4].find(t => !beforeGarage.owned.includes(t));
      if (!tier) return FAIL('shop_affordable scenario exposes no unowned purchasable tier');
      const buy = await game.contractInput({ type: 'buyOrEquipBike', bikeTier: tier });
      const after = buy && buy.snapshot ? buy.snapshot : await game.snapshot();
      const balanceBefore = Number(valueAt(before, 'economy.balance', 0));
      const balanceAfter = Number(valueAt(after, 'economy.balance', 0));
      const afterGarage = garageSummary(after);
      const ownedChanged = JSON.stringify(afterGarage.owned) !== JSON.stringify(beforeGarage.owned);
      const equippedChanged = afterGarage.equipped !== beforeGarage.equipped || afterGarage.power !== beforeGarage.power;
      if (!(balanceAfter < balanceBefore || ownedChanged || equippedChanged)) {
        return FAIL('affordable purchase did not decrease balance or update ownership/equipment');
      }
      if (balanceAfter < 0) return FAIL('affordable purchase made balance negative');
      const persisted = await game.snapshot();
      if (Number(valueAt(persisted, 'economy.balance', balanceAfter)) !== balanceAfter) return FAIL('purchase state not stable after follow-up snapshot');
      return PASS('affordable purchase/equip progression observed');
    }
  },
  {
    id: 'p2-paid-continue-contract',
    level: 'P2',
    name: 'contract paid continue preserves progress and rejects unavailable continue',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('missing contract for paid continue scenarios');

      const before = await requireScenario(game, 'game_over_continue_available');
      const balanceBefore = Number(valueAt(before, 'economy.balance', 0));
      const progressBefore = progressForInvariant(before);
      const cost = Number(valueAt(before, 'assist.continueCost', 0)) || 0;
      const canContinue = valueAt(before, 'assist.canContinue', true);
      if (canContinue === false) return FAIL('available continue scenario reports canContinue=false');
      const continued = await game.contractInput({ type: 'continue' });
      const after = continued && continued.snapshot ? continued.snapshot : await game.snapshot();
      const balanceAfter = Number(valueAt(after, 'economy.balance', 0));
      const progressAfter = progressForInvariant(after);
      if (after.phase === 'game-over' || valueAt(after, 'result.final', false) === true) return FAIL('continue did not leave terminal state');
      if (balanceAfter < 0) return FAIL('continue made balance negative');
      if (cost > 0 && !(balanceAfter <= balanceBefore - Math.min(cost, balanceBefore))) {
        return FAIL('continue did not deduct declared cost; before=' + balanceBefore + ' after=' + balanceAfter + ' cost=' + cost);
      }
      if (progressAfter.sector < progressBefore.sector || progressAfter.checkpoint < progressBefore.checkpoint) {
        return FAIL('continue regressed sector/checkpoint progress');
      }

      const unavailable = await requireScenario(game, 'game_over_continue_unavailable');
      const totalBefore = totalForInvariant(unavailable);
      const unavailableProgressBefore = progressForInvariant(unavailable);
      const denied = await game.contractInput({ type: 'continue' });
      const deniedAfter = denied && denied.snapshot ? denied.snapshot : await game.snapshot();
      const totalAfter = totalForInvariant(deniedAfter);
      const unavailableProgressAfter = progressForInvariant(deniedAfter);
      const rejected = denied && denied.ok === false;
      if (!rejected && !sameTotals(totalBefore, totalAfter)) return FAIL('unavailable continue mutated conserved totals without rejection');
      if (!sameProgress(unavailableProgressBefore, unavailableProgressAfter)) return FAIL('unavailable continue changed progress');
      if (Number(valueAt(deniedAfter, 'economy.balance', 0)) < 0) return FAIL('unavailable continue made balance negative');
      return PASS('paid continue and unavailable rejection observed');
    }
  },
  {
    id: 'p2-power-use-and-cooldown-rejection',
    level: 'P2',
    name: 'contract special power effect and cooldown rejection',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('missing contract for power scenarios');
      const before = await requireScenario(game, 'power_ready');
      const first = await game.contractInput({ type: 'usePower' });
      const afterFirst = first && first.snapshot ? first.snapshot : await game.snapshot();
      const cooldownStarted = Number(valueAt(afterFirst, 'power.cooldown', 0)) > Number(valueAt(before, 'power.cooldown', 0)) || valueAt(afterFirst, 'power.available', true) === false;
      const trafficChanged = Number(valueAt(afterFirst, 'revision.traffic', 0)) !== Number(valueAt(before, 'revision.traffic', 0)) ||
        Number(valueAt(afterFirst, 'traffic.vehicleCount', 0)) !== Number(valueAt(before, 'traffic.vehicleCount', 0));
      const playerChanged = valueAt(afterFirst, 'player.airborne', false) !== valueAt(before, 'player.airborne', false) ||
        Number(valueAt(afterFirst, 'player.speed', 0)) > Number(valueAt(before, 'player.speed', 0));
      const sceneChanged = Number(valueAt(afterFirst, 'revision.scene', 0)) !== Number(valueAt(before, 'revision.scene', 0));
      if (!(cooldownStarted && (trafficChanged || playerChanged || sceneChanged))) {
        return FAIL('first power use lacked cooldown or visible/gameplay effect');
      }
      const totalBefore = totalForInvariant(afterFirst);
      const second = await game.contractInput({ type: 'usePower' });
      const afterSecond = second && second.snapshot ? second.snapshot : await game.snapshot();
      const totalAfter = totalForInvariant(afterSecond);
      const rejected = second && second.ok === false;
      if (!rejected && !sameTotals(totalBefore, totalAfter)) return FAIL('cooldown second use mutated totals without rejection');
      return PASS('power effect and cooldown rejection observed');
    }
  },
  {
    id: 'p2-view-toggle-preserves-render-and-direction',
    level: 'P2',
    name: 'real view toggle keeps render visible and direction semantics',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await requireScenario(game, 'fresh_playing');
      await ensureStarted(game);
      const beforeToggle = await game.snapshot();
      if (beforeToggle.phase !== 'playing') return FAIL('fresh_playing did not provide playing phase; phase=' + beforeToggle.phase);
      const beforeToggleHash = await game.canvasHash();
      const beforeRenderProbe = await game.renderProbe();
      await game.realKeyQuick('KeyV', 120);
      const afterToggle = await game.snapshot();
      const afterToggleHash = await game.canvasHash();
      const afterRenderProbe = await game.renderProbe();
      const renderVisibleBySnapshot =
        valueAt(afterToggle, "render.nonBlank", false) === true &&
        valueAt(afterToggle, "render.mainSceneVisible", true) !== false;
      const renderVisible = afterRenderProbe.available
        ? afterRenderProbe.nonBlank
        : renderVisibleBySnapshot && afterToggleHash !== null;
      if (!renderVisible) return FAIL('view toggle left render blank');
      const renderedViewChanged =
        (beforeRenderProbe.available && afterRenderProbe.available &&
          beforeRenderProbe.signature !== afterRenderProbe.signature) ||
        (beforeToggleHash !== null && afterToggleHash !== null &&
          beforeToggleHash !== afterToggleHash);
      if (!renderedViewChanged) return FAIL('view toggle produced no observable rendered view change');
      if (afterToggle.phase !== 'playing') return FAIL('view toggle interrupted playing state; phase=' + afterToggle.phase);
      const baseX = valueAt(afterToggle, 'player.screenX', null);
      if (!isFiniteNumber(baseX)) return FAIL('view toggle did not expose player.screenX');
      await game.realKeyQuick('ArrowRight', 120);
      let afterRight = await game.snapshot();
      let rightX = valueAt(afterRight, "player.screenX", null);
      for (let i = 0; i < 6 &&
        afterRight.phase === "playing" &&
        valueAt(afterRight, "player.isChangingLane", false) === true &&
        isFiniteNumber(rightX) &&
        !(rightX > baseX); i++) {
        await browser.sleep(80);
        afterRight = await game.snapshot();
        rightX = valueAt(afterRight, "player.screenX", null);
      }
      if (afterRight.phase !== 'playing') return FAIL('right-direction oracle interrupted; phase=' + afterRight.phase);
      if (!isFiniteNumber(rightX)) return FAIL('right-direction oracle did not expose player.screenX');
      const rightDelta = rightX - baseX;
      if (!(rightDelta > 0)) return FAIL('view toggle broke screen-right direction; delta=' + rightDelta);
      return PASS('view render remains visible and direction preserved');
    }
  },
  {
    id: 'p2-assist-hint-direction-completes',
    level: 'P2',
    name: 'contract assist traffic hint matches real direction and completes',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('missing contract for assist hint scenario');
      const before = await requireScenario(game, 'assist_hint_active');
      await ensureStarted(game);
      const tutorialActive = !!valueAt(before, 'assist.tutorialActive', false);
      const trafficHintVisible = !!valueAt(before, 'assist.trafficHintVisible', false);
      const hintVisible = trafficHintVisible || tutorialActive;
      if (!hintVisible) return FAIL('assist_hint_active did not expose visible hint state');
      const hintedDirection = valueAt(before, 'assist.suggestedDirection', null);
      let inputDirection = hintedDirection;
      if (inputDirection !== 'left' && inputDirection !== 'right') {
        const lane = valueAt(before, 'player.lane', null);
        const laneCount = valueAt(before, 'player.laneCount', null);
        if (isFiniteNumber(lane) && isFiniteNumber(laneCount)) {
          if (lane < laneCount - 1) inputDirection = 'right';
          else if (lane > 0) inputDirection = 'left';
        }
      }
      if (inputDirection !== 'left' && inputDirection !== 'right') return FAIL('active assist hint exposes no legal lane direction');
      const baseX = valueAt(before, 'player.screenX', null);
      if (!isFiniteNumber(baseX)) return FAIL('missing player.screenX for assist direction oracle');
      await game.realKey(inputDirection === 'left' ? 'ArrowLeft' : 'ArrowRight');
      const after = await game.snapshot();
      const delta = valueAt(after, 'player.screenX', baseX) - baseX;
      if (inputDirection === 'left' && !(delta < 0)) return FAIL('left assist hint moved wrong way or not at all; delta=' + delta);
      if (inputDirection === 'right' && !(delta > 0)) return FAIL('right assist hint moved wrong way or not at all; delta=' + delta);
      const stillBlocking = after.overlayBlocking && after.canInteractWithPlayfield === false;
      if (stillBlocking) return FAIL('assist hint blocked driving after following direction');
      const completed = !valueAt(after, 'assist.tutorialActive', false) && !valueAt(after, 'assist.trafficHintVisible', false);
      if (!completed) return FAIL('assist hint did not clear or advance after correct direction input');
      return PASS('assist hint direction matched screen movement and advanced');
    }
  },
  {
    id: 'p2-city-world-activity-observable',
    level: 'P2',
    name: 'contract city world activity and collectible feedback are observable',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('missing contract for city world activity scenario');
      const before = await requireScenario(game, 'city_world_activity');
      await ensureStarted(game);
      const visibleWorldCount =
        Number(valueAt(before, 'world.pedestrianCount', 0)) +
        Number(valueAt(before, 'world.crosswalkCount', 0)) +
        Number(valueAt(before, 'world.collectibleCount', 0));
      if (!(visibleWorldCount > 0)) return FAIL('city_world_activity exposes no pedestrians, crosswalks, or collectibles');
      const balanceBefore = Number(valueAt(before, 'economy.balance', 0));
      const scoreBefore = Number(valueAt(before, 'score.current', 0));
      const collectedBefore = Number(valueAt(before, 'world.collectedThisRun', 0));
      const motionBefore = Number(valueAt(before, 'world.worldMotionRevision', valueAt(before, 'revision.traffic', 0)));
      await browser.sleep(700);
      await game.realKey('ArrowRight');
      await browser.sleep(900);
      const after = await game.snapshot();
      const balanceDelta = Number(valueAt(after, 'economy.balance', 0)) - balanceBefore;
      const scoreDelta = Number(valueAt(after, 'score.current', 0)) - scoreBefore;
      const collectedDelta = Number(valueAt(after, 'world.collectedThisRun', 0)) - collectedBefore;
      const motionDelta = Number(valueAt(after, 'world.worldMotionRevision', valueAt(after, 'revision.traffic', 0))) - motionBefore;
      const countChanged =
        Number(valueAt(after, 'world.pedestrianCount', 0)) !== Number(valueAt(before, 'world.pedestrianCount', 0)) ||
        Number(valueAt(after, 'world.collectibleCount', 0)) !== Number(valueAt(before, 'world.collectibleCount', 0));
      if (!(motionDelta > 0 || countChanged || collectedDelta > 0 || balanceDelta > 0 || scoreDelta > 0)) {
        return FAIL('city world activity produced no observable motion, pickup, or feedback delta');
      }
      if (Number(valueAt(after, 'economy.balance', 0)) < 0) return FAIL('world activity made balance negative');
      return PASS('city world activity observable through motion/pickup/feedback');
    }
  }
];

module.exports = { suite };
