// City Racer X Neon Rush L2 runtime checks
// === GDD Coverage Map ===
// M1 start/menu flow -> p1-real-click-start-flow
// M2 3D/WebGL scene -> p0-boot-and-render-smoke, p1-real-click-start-flow
// M3 direction-sensitive lane input -> p1-real-keyboard-opposite-lane-direction, p1-real-touch-swipe-lane-direction, p1-input-response-window-observable, p1-rapid-reversal-remains-controllable, p1-blocked-lane-contract-rejection
// M4 automatic race progression -> p1-race-progresses-while-playing
// M5 traffic risk/collision loop -> p1-traffic-avoidance-loop
// M6 bullet-time danger challenge -> p2-bullet-time-contract
// M7 result/terminal state -> p1-finish-result-contract-terminal-lock
// M8 restart/continue -> p1-restart-contract-clears-result, p2-continue-cost-conservation
// M9 menu blocking -> p1-menu-blocking-invariant
// M10 shop/economy -> p2-shop-insufficient-rejection, p2-real-click-shop-purchase-success
// M11 nitro/super power -> p2-real-click-nitro-consumes-use, p2-power-cooldown-rejection
// M12 view/stats/persistence -> p2-real-key-view-toggle-preserves-state
//
// === Category Map ===
// Boot & Stability: p0-boot-and-render-smoke, p0-public-contract-schema
// UI Flow & Blocking: p1-real-click-start-flow, p1-menu-blocking-invariant
// Input Semantics: p1-real-keyboard-opposite-lane-direction, p1-real-touch-swipe-lane-direction, p1-input-response-window-observable, p1-rapid-reversal-remains-controllable
// Core Mechanic Loop: p1-race-progresses-while-playing, p1-traffic-avoidance-loop
// State Machine: p1-finish-result-contract-terminal-lock, p1-restart-contract-clears-result, p2-continue-cost-conservation
// Economy/Progression: p2-continue-cost-conservation, p2-shop-insufficient-rejection, p2-real-click-shop-purchase-success
// Feedback & Observability: p1-real-click-start-flow, p2-real-key-view-toggle-preserves-state
// Invariants & Rejection: p1-blocked-lane-contract-rejection, p1-menu-blocking-invariant, p2-shop-insufficient-rejection, p2-power-cooldown-rejection
// Depth/Optional Systems: p2-bullet-time-contract, p2-real-key-view-toggle-preserves-state, p2-real-click-nitro-consumes-use
//
// === Rationality Map ===
// p1-real-click-start-flow: M1/M2 | real action: mouseClick start control/playfield | independent observation: phase + overlay + render | empty-shell failure: API-only start or blank scene fails
// p1-real-keyboard-opposite-lane-direction: M3 | real action: ArrowLeft/ArrowRight | independent observation: screenX + lane bounds | empty-shell failure: no real key path, same direction, or invisible movement fails
// p1-real-touch-swipe-lane-direction: M3 | real action: Input.dispatchTouchEvent horizontal swipe | independent observation: screenX/lane + render revision | empty-shell failure: desktop-only controls or touch listener shell fails
// p1-input-response-window-observable: M3 | real action: ArrowLeft keyDown/keyUp sampled over a response window | independent observation: lane/screenX/render changes before the observation window ends | empty-shell failure: delayed, hidden, or state-only input fails
// p1-rapid-reversal-remains-controllable: M3 | real action: ArrowLeft then ArrowRight in quick succession | independent observation: later input reverses target trend and stays within road bounds | empty-shell failure: input lockout, one-shot lane change, or out-of-bounds reversal fails
// p1-blocked-lane-contract-rejection: M3/M5 | contract action: blocked lane input | independent observation: unchanged lane/screenX + feedback/road summary + resource invariant | empty-shell failure: accepts out-of-road movement or mutates resources fails
// p1-race-progresses-while-playing: M4 | real/contract setup then wait | independent observation: distance/progress/time/render revision | empty-shell failure: static state or HUD-only shell fails
// p1-traffic-avoidance-loop: M5 | real action: mouse/touch lane swipe after scenario setup | independent observation: traffic risk/result/player motion/render | empty-shell failure: no traffic, API-only lane action, or no risk delta fails
// p1-menu-blocking-invariant: M9 | contract menu + real ArrowLeft while blocked | independent observation: overlay + unchanged lane/screenX | empty-shell failure: overlay not blocking or input leaks fail
// p1-finish-result-contract-terminal-lock: M7 | contract near_finish + player action/wait | independent observation: result + reward + unchanged terminal progress | empty-shell failure: direct non-terminal finish or post-result movement fails
// p1-restart-contract-clears-result: M8 | contract crash/result setup + restart action | independent observation: overlay cleared + transient warning/result cleanup + balance invariant | empty-shell failure: restart hides UI without clearing state fails
// p2-continue-cost-conservation: M8 | contract result_with_continue | independent observation: balance delta + phase | empty-shell failure: free continue or negative balance fails
// p2-shop-insufficient-rejection: M10 | contract shop_insufficient | independent observation: balance and item unchanged + rejection | empty-shell failure: insufficient purchase accepted fails
// p2-real-click-shop-purchase-success: M10 | real action: mouseClick visible affordable shop item | independent observation: balance decrease + owned/equipped/performance summary | empty-shell failure: API-only shop or non-clickable purchase fails
// p2-real-click-nitro-consumes-use: M11 | real action: mouseClick visible nitro control | independent observation: usesLeft decrease + speed/render/active feedback | empty-shell failure: visual button without gameplay effect fails
// p2-power-cooldown-rejection: M11 | contract power_ready/power_cooldown | independent observation: cooldown/effect delta + second-use rejection | empty-shell failure: no cooldown or repeat spam fails
// p2-bullet-time-contract: M6 | contract bullet_time + bulletTap | independent observation: tapProgress and phase transition | empty-shell failure: challenge pre-resolved or taps ignored fails
// p2-real-key-view-toggle-preserves-state: M12 | real action: KeyV | independent observation: view.mode + render + economy unchanged | empty-shell failure: view key ignored or breaks scene/economy fails

function PASS(detail) {
  return { status: 'PASS', detail: detail || '' };
}

function FAIL(detail) {
  return { status: 'FAIL', detail: detail || '' };
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function approxEqual(a, b, eps) {
  return Math.abs((a || 0) - (b || 0)) <= (eps == null ? 0.001 : eps);
}

function sign(value) {
  if (Math.abs(value) < 0.5) return 0;
  return value > 0 ? 1 : -1;
}

const CONTROL_SAMPLE_INTERVAL_MS = 80;
const CONTROL_RESPONSE_WINDOW_MS = 520;
const CONTROL_REVERSAL_SETTLE_MS = 260;

async function waitUntil(fn, timeoutMs, intervalMs) {
  const deadline = Date.now() + (timeoutMs || 3000);
  let last;
  while (Date.now() < deadline) {
    last = await fn();
    if (last && last.ok) return last.value;
    await new Promise(r => setTimeout(r, intervalMs || 100));
  }
  return last && Object.prototype.hasOwnProperty.call(last, 'value') ? last.value : null;
}

function createGameDriver(browser) {
  async function evalPage(expr) {
    const result = await browser.eval(expr);
    if (result && result.__l2_err__) {
      throw new Error(result.__l2_err__);
    }
    return result;
  }

  async function hasContract() {
    return !!(await evalPage(`
      (function () {
        return !!(window.__gameTest &&
          typeof window.__gameTest.reset === 'function' &&
          typeof window.__gameTest.getSnapshot === 'function' &&
          typeof window.__gameTest.input === 'function');
      })()
    `));
  }

  async function snapshot() {
    const snap = await evalPage(`
      (function () {
        if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') return null;
        return window.__gameTest.getSnapshot();
      })()
    `);
    return snap || {};
  }

  async function reset(options) {
    const payload = JSON.stringify(options || {});
    return await evalPage(`
      (function () {
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return null;
        return window.__gameTest.reset(${payload});
      })()
    `);
  }

  async function contractInput(action) {
    const payload = JSON.stringify(action || {});
    return await evalPage(`
      (function () {
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return null;
        return window.__gameTest.input(${payload});
      })()
    `);
  }

  async function loadScenario(name, options) {
    const namePayload = JSON.stringify(name);
    const optPayload = JSON.stringify(options || {});
    return await evalPage(`
      (function () {
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return null;
        return window.__gameTest.loadScenario(${namePayload}, ${optPayload});
      })()
    `);
  }

  async function readUi() {
    return await evalPage(`
      (function () {
        const buttons = Array.from(document.querySelectorAll('*')).filter(function (el) {
          const style = getComputedStyle(el);
          return el.matches('button,[role="button"],[data-game-control],a,input[type="button"],input[type="submit"]') || style.cursor === 'pointer';
        }).map(function (el) {
          const r = el.getBoundingClientRect();
          const text = ((el.getAttribute('aria-label') || el.textContent || el.value || '') + '').trim();
          const control = el.getAttribute('data-game-control') || '';
          const style = getComputedStyle(el);
          const visible = r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          const clickable = el.matches('button,[role="button"],[data-game-control],a,input[type="button"],input[type="submit"]') || style.cursor === 'pointer';
          return { text, control, visible, clickable, left: r.left, top: r.top, width: r.width, height: r.height, centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 };
        });
        const canvases = Array.from(document.querySelectorAll('canvas')).map(function (c) {
          const r = c.getBoundingClientRect();
          return { width: c.width || 0, height: c.height || 0, cssW: r.width, cssH: r.height, left: r.left, top: r.top, centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 };
        });
        return { buttons, canvases, innerWidth: window.innerWidth, innerHeight: window.innerHeight };
      })()
    `);
  }

  async function findStartPoint() {
    const ui = await readUi();
    const start = (ui.buttons || []).find(b => b.visible && b.clickable && (
      /start|play|race|tap|begin|go/i.test(b.control) ||
      /start|play|race|tap|begin|go|开始|进入/i.test(b.text)
    ));
    if (start) return { x: start.centerX, y: start.centerY };
    const snap = await snapshot();
    if (snap.playfield && snap.playfield.bounds && isFiniteNumber(snap.playfield.bounds.centerX) && isFiniteNumber(snap.playfield.bounds.centerY)) {
      return { x: snap.playfield.bounds.centerX, y: snap.playfield.bounds.centerY };
    }
    const canvas = (ui.canvases || []).sort((a, b) => (b.cssW * b.cssH) - (a.cssW * a.cssH))[0];
    if (canvas) return { x: canvas.centerX, y: canvas.centerY };
    throw new Error('missing visible start control or playfield geometry');
  }

  async function realClickStart() {
    const pt = await findStartPoint();
    await browser.mouseClick(pt.x, pt.y);
    await browser.sleep(300);
  }

  async function pressKey(key, ms) {
    await browser.keyDown(key);
    await browser.sleep(ms || 80);
    await browser.keyUp(key);
    await browser.sleep(250);
  }

  async function playfieldPoint(fallbackSide) {
    const snap = await snapshot();
    const b = snap.playfield && snap.playfield.bounds;
    if (b && isFiniteNumber(b.centerX) && isFiniteNumber(b.centerY) && b.width > 20 && b.height > 20) {
      const x = fallbackSide === 'left' ? b.left + b.width * 0.28 : fallbackSide === 'right' ? b.left + b.width * 0.72 : b.centerX;
      return { x, y: b.centerY, bounds: b };
    }
    const ui = await readUi();
    const canvas = (ui.canvases || []).sort((a, b2) => (b2.cssW * b2.cssH) - (a.cssW * a.cssH))[0];
    if (canvas) {
      const x = fallbackSide === 'left' ? canvas.left + canvas.cssW * 0.28 : fallbackSide === 'right' ? canvas.left + canvas.cssW * 0.72 : canvas.centerX;
      return { x, y: canvas.centerY, bounds: { left: canvas.left, top: canvas.top, width: canvas.cssW, height: canvas.cssH, centerX: canvas.centerX, centerY: canvas.centerY } };
    }
    throw new Error('missing public playfield bounds or visible canvas geometry');
  }

  async function realMouseSwipe(direction) {
    const center = await playfieldPoint('center');
    const dx = direction === 'left' ? -140 : 140;
    const start = { x: center.x - dx / 2, y: center.y };
    const end = { x: center.x + dx / 2, y: center.y };
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: start.x + (end.x - start.x) * t,
        y: start.y,
        button: 'left',
        buttons: 1,
        modifiers: 0
      });
      await browser.sleep(20);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.sleep(350);
  }

  async function realTouchSwipe(direction) {
    const center = await playfieldPoint('center');
    const dx = direction === 'left' ? -140 : 140;
    const start = { x: center.x - dx / 2, y: center.y };
    const end = { x: center.x + dx / 2, y: center.y };
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: start.x, y: start.y, radiusX: 2, radiusY: 2, id: 1 }]
    });
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + (end.x - start.x) * t, y: start.y, radiusX: 2, radiusY: 2, id: 1 }]
      });
      await browser.sleep(20);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await browser.sleep(350);
  }

  async function realClickBounds(bounds) {
    if (!bounds) return false;
    const x = isFiniteNumber(bounds.centerX) ? bounds.centerX : (isFiniteNumber(bounds.left) && isFiniteNumber(bounds.width) ? bounds.left + bounds.width / 2 : NaN);
    const y = isFiniteNumber(bounds.centerY) ? bounds.centerY : (isFiniteNumber(bounds.top) && isFiniteNumber(bounds.height) ? bounds.top + bounds.height / 2 : NaN);
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return false;
    await browser.mouseClick(x, y);
    await browser.sleep(450);
    return true;
  }

  async function findShopItemPoint(itemId, itemBounds) {
    const payload = JSON.stringify(itemId);
    const boundsPayload = JSON.stringify(itemBounds || null);
    return await evalPage(`
      (function () {
        const targetId = ${payload};
        const targetBounds = ${boundsPayload};
        const candidates = Array.from(document.querySelectorAll('[data-game-shop-item],[data-shop-item],[data-bike],[data-item],[data-id],[data-item-id],[data-itemid],[data-vehicle],[data-act],button,[role="button"]'));
        const itemAttributes = ['data-game-shop-item', 'data-shop-item', 'data-bike', 'data-item', 'data-id', 'data-item-id', 'data-itemid', 'data-vehicle', 'data-act'];
        const visible = el => {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return r.width > 10 && r.height > 10 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const point = el => {
          const r = el.getBoundingClientRect();
          return { centerX: r.left + r.width / 2, centerY: r.top + r.height / 2, width: r.width, height: r.height };
        };
        const matches = candidates.filter(el => visible(el) && itemAttributes.some(name => el.getAttribute(name) === targetId));
        const controls = matches.filter(el => el.matches('button,[role="button"]'));
        if (controls.length) return point(controls[0]);
        for (const el of matches) {
          const control = Array.from(el.querySelectorAll('button,[role="button"]')).find(visible);
          if (control) return point(control);
          return point(el);
        }
        if (targetBounds && Number.isFinite(targetBounds.left) && Number.isFinite(targetBounds.top) &&
            Number.isFinite(targetBounds.width) && Number.isFinite(targetBounds.height)) {
          const control = Array.from(document.querySelectorAll('button,[role="button"]')).find(el => {
            if (!visible(el)) return false;
            const r = el.getBoundingClientRect();
            const x = r.left + r.width / 2;
            const y = r.top + r.height / 2;
            return x >= targetBounds.left && x <= targetBounds.left + targetBounds.width &&
              y >= targetBounds.top && y <= targetBounds.top + targetBounds.height;
          });
          if (control) return point(control);
        }
        return null;
      })()
    `);
  }

  async function findNitroPoint() {
    return await evalPage(`
      (function () {
        const candidates = Array.from(document.querySelectorAll('[data-game-control],button,[role="button"],canvas,div'));
        for (const el of candidates) {
          const control = (el.getAttribute('data-game-control') || el.getAttribute('aria-label') || el.textContent || '').toLowerCase();
          if (/nitro|boost|加速/.test(control)) {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (r.width > 20 && r.height > 20 && style.display !== 'none' && style.visibility !== 'hidden') {
              return { centerX: r.left + r.width / 2, centerY: r.top + r.height / 2, width: r.width, height: r.height };
            }
          }
        }
        return null;
      })()
    `);
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  return {
    hasContract,
    snapshot,
    reset,
    contractInput,
    loadScenario,
    readUi,
    realClickStart,
    pressKey,
    playfieldPoint,
    realMouseSwipe,
    realTouchSwipe,
    realClickBounds,
    findShopItemPoint,
    findNitroPoint,
    canvasHash
  };
}

function validateSnapshotShape(s) {
  const missing = [];
  if (!s || typeof s !== 'object') return ['snapshot object'];
  if (typeof s.phase !== 'string') missing.push('phase');
  if (typeof s.overlayBlocking !== 'boolean') missing.push('overlayBlocking');
  if (typeof s.canInteractWithPlayfield !== 'boolean') missing.push('canInteractWithPlayfield');
  if (!s.playfield || !s.playfield.bounds || !isFiniteNumber(s.playfield.bounds.centerX)) missing.push('playfield.bounds.centerX');
  if (!s.render || typeof s.render.nonBlank !== 'boolean') missing.push('render.nonBlank');
  if (!s.player || !isFiniteNumber(s.player.screenX) || !isFiniteNumber(s.player.lane) || !isFiniteNumber(s.player.laneCount)) missing.push('player screen/lane');
  if (s.phase === 'playing') {
    if (!s.road || !s.road.drivableBounds || !isFiniteNumber(s.road.drivableBounds.left) || !isFiniteNumber(s.road.drivableBounds.right)) {
      missing.push('road.drivableBounds');
    }
    if (!s.road || !Array.isArray(s.road.laneCenters)) missing.push('road.laneCenters');
    if (!s.player || typeof s.player.inDrivableArea !== 'boolean') missing.push('player.inDrivableArea');
  }
  if (!s.race || !isFiniteNumber(s.race.rank) || !isFiniteNumber(s.race.racerCount)) missing.push('race rank/count');
  if (!s.economy || !isFiniteNumber(s.economy.balance)) missing.push('economy.balance');
  return missing;
}

function roadMappingError(s, label) {
  if (!s || s.phase !== 'playing') return null;
  const b = s.road && s.road.drivableBounds;
  const laneCenters = s.road && s.road.laneCenters;
  const player = s.player || {};
  if (!b || !isFiniteNumber(b.left) || !isFiniteNumber(b.right) || b.right <= b.left) {
    return label + ': road.drivableBounds must expose visible drivable left/right';
  }
  if (player.inDrivableArea !== true) {
    return label + ': player.inDrivableArea must be true during legal play';
  }
  if (player.screenX < b.left - 2 || player.screenX > b.right + 2) {
    return label + ': player screenX is outside visible drivable road bounds';
  }
  if (!Array.isArray(laneCenters) || laneCenters.length < player.laneCount) {
    return label + ': road.laneCenters must cover player.laneCount';
  }
  const laneIndex = Math.round(player.lane);
  const laneCenter = laneCenters[laneIndex];
  if (!isFiniteNumber(laneCenter)) {
    return label + ': current lane center is missing';
  }
  const laneWidth = Math.max(8, (b.right - b.left) / Math.max(1, player.laneCount));
  if (Math.abs(player.screenX - laneCenter) > laneWidth * 0.65) {
    return label + ': player screenX is detached from current road lane center';
  }
  return null;
}

async function sampleSnapshots(game, browser, durationMs, intervalMs) {
  const samples = [];
  const start = Date.now();
  while (Date.now() - start <= durationMs) {
    samples.push(await game.snapshot());
    await browser.sleep(intervalMs || CONTROL_SAMPLE_INTERVAL_MS);
  }
  samples.push(await game.snapshot());
  return samples;
}

function laneResponseFromSamples(before, samples) {
  const baseX = before && before.player && before.player.screenX;
  const baseLane = before && before.player && before.player.lane;
  const baseRevision = before && before.render && before.render.revision;
  let firstMoved = null;
  let maxAbsXDelta = 0;
  let laneChanged = false;
  let revisionChanged = false;
  for (const s of samples || []) {
    if (!s || !s.player) continue;
    const xDelta = isFiniteNumber(s.player.screenX) && isFiniteNumber(baseX) ? s.player.screenX - baseX : 0;
    maxAbsXDelta = Math.max(maxAbsXDelta, Math.abs(xDelta));
    if (isFiniteNumber(s.player.lane) && isFiniteNumber(baseLane) && s.player.lane !== baseLane) laneChanged = true;
    if (s.render && isFiniteNumber(s.render.revision) && isFiniteNumber(baseRevision) && s.render.revision !== baseRevision) revisionChanged = true;
    if (!firstMoved && (Math.abs(xDelta) > 0.5 || laneChanged || revisionChanged)) {
      firstMoved = s;
    }
  }
  const last = samples && samples.length ? samples[samples.length - 1] : null;
  const finalXDelta = last && last.player && isFiniteNumber(last.player.screenX) && isFiniteNumber(baseX) ? last.player.screenX - baseX : 0;
  const finalLaneDelta = last && last.player && isFiniteNumber(last.player.lane) && isFiniteNumber(baseLane) ? last.player.lane - baseLane : 0;
  return { firstMoved, maxAbsXDelta, laneChanged, revisionChanged, finalXDelta, finalLaneDelta, last };
}

async function ensureContractReady(game) {
  if (!(await game.hasContract())) {
    return { ok: false, detail: 'window.__gameTest reset/input/getSnapshot contract missing' };
  }
  return { ok: true };
}

async function ensurePlaying(game) {
  let snap = await game.snapshot();
  if (snap.phase !== 'playing') {
    await game.reset({ phase: 'menu' });
    await game.contractInput({ type: 'start' });
    await waitUntil(async () => {
      const s = await game.snapshot();
      return { ok: s.phase === 'playing', value: s };
    }, 2500, 100);
  }
  snap = await game.snapshot();
  return snap;
}

async function waitForStableLaneGeometry(game, label) {
  let previous = null;
  return await waitUntil(async () => {
    const current = await game.snapshot();
    const mappingError = roadMappingError(current, label);
    if (mappingError) {
      previous = null;
      return { ok: false, value: null };
    }
    const centers = current.road && current.road.laneCenters;
    const previousCenters = previous && previous.road && previous.road.laneCenters;
    const sameLaneState = previous && previous.player && current.player &&
      previous.player.lane === current.player.lane &&
      previous.player.laneCount === current.player.laneCount;
    const sameProjection = Array.isArray(centers) && Array.isArray(previousCenters) &&
      centers.length === previousCenters.length &&
      centers.every((center, index) =>
        isFiniteNumber(center) && isFiniteNumber(previousCenters[index]) &&
        Math.abs(center - previousCenters[index]) <= 2
      );
    const samePlayerPosition = previous && previous.player &&
      isFiniteNumber(current.player.screenX) &&
      isFiniteNumber(previous.player.screenX) &&
      Math.abs(current.player.screenX - previous.player.screenX) <= 2;
    const stable = !!(sameLaneState && sameProjection && samePlayerPosition);
    previous = current;
    return { ok: stable, value: stable ? current : null };
  }, 2500, CONTROL_SAMPLE_INTERVAL_MS);
}

async function waitForLaneDirectionResponse(game, before, label) {
  return await waitUntil(async () => {
    const current = await game.snapshot();
    const mappingError = roadMappingError(current, label);
    if (mappingError) {
      return { ok: false, value: null };
    }
    const beforePlayer = before && before.player;
    const currentPlayer = current && current.player;
    const laneChanged = beforePlayer && currentPlayer &&
      isFiniteNumber(beforePlayer.lane) && isFiniteNumber(currentPlayer.lane) &&
      beforePlayer.lane !== currentPlayer.lane;
    const screenChanged = beforePlayer && currentPlayer &&
      isFiniteNumber(beforePlayer.screenX) && isFiniteNumber(currentPlayer.screenX) &&
      Math.abs(currentPlayer.screenX - beforePlayer.screenX) > 0.5;
    return { ok: !!(laneChanged || screenChanged), value: current };
  }, CONTROL_RESPONSE_WINDOW_MS, CONTROL_SAMPLE_INTERVAL_MS);
}

function visibleLaneDirectionDelta(before, after) {
  const beforePlayer = (before && before.player) || {};
  const afterPlayer = (after && after.player) || {};
  const rawDelta = afterPlayer.screenX - beforePlayer.screenX;
  const fromLane = Math.round(beforePlayer.lane);
  const toLane = Math.round(afterPlayer.lane);
  const centers = after && after.road && after.road.laneCenters;
  if (fromLane !== toLane && Array.isArray(centers) &&
      isFiniteNumber(centers[fromLane]) && isFiniteNumber(centers[toLane])) {
    return centers[toLane] - centers[fromLane];
  }
  return isFiniteNumber(rawDelta) ? rawDelta : 0;
}

const suite = [
  {
    id: 'p0-boot-and-render-smoke',
    name: 'boot stability and nonblank 3D render smoke',
    level: 'P0',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      if (browser.exceptions.length) {
        return FAIL('runtime exceptions: ' + browser.exceptions.slice(0, 2).map(e => e.description || e.text).join(' | '));
      }
      const game = createGameDriver(browser);
      const ui = await game.readUi();
      const canvas = (ui.canvases || []).sort((a, b) => (b.cssW * b.cssH) - (a.cssW * a.cssH))[0];
      if (!canvas || canvas.cssW < 100 || canvas.cssH < 100) return FAIL('no visible primary canvas/playfield');
      const hash = await game.canvasHash();
      if (hash == null) return FAIL('screenshot hash unavailable');
      return PASS('visible canvas ' + Math.round(canvas.cssW) + 'x' + Math.round(canvas.cssH));
    }
  },
  {
    id: 'p0-public-contract-schema',
    name: 'public contract reset/getSnapshot schema',
    level: 'P0',
    timeoutMs: 10000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.reset({ phase: 'menu' });
      const snap = await game.snapshot();
      const missing = validateSnapshotShape(snap);
      if (missing.length) return FAIL('snapshot schema missing: ' + missing.join(', '));
      if (snap.economy.balance < 0) return FAIL('balance is negative');
      return PASS('phase=' + snap.phase + ', render=' + (snap.render && snap.render.kind));
    }
  },
  {
    id: 'p1-real-click-start-flow',
    name: 'real click start hides blocking overlay and shows 3D race',
    level: 'P1',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.reset({ phase: 'menu' });
      const beforeHash = await game.canvasHash();
      await game.realClickStart();
      const after = await waitUntil(async () => {
        const s = await game.snapshot();
        return {
          ok: s.phase === 'playing' &&
            s.overlayBlocking === false &&
            s.canInteractWithPlayfield === true &&
            s.render && s.render.nonBlank === true,
          value: s
        };
      }, 3000, 100);
      if (!after) return FAIL('real click did not enter playing with overlay cleared');
      if (!after.canInteractWithPlayfield) return FAIL('playfield still not interactive after start');
      if (!after.render || after.render.nonBlank !== true) return FAIL('3D render not reported nonblank after start');
      if (!after.playfield || !after.playfield.bounds || !isFiniteNumber(after.playfield.bounds.centerX) || !isFiniteNumber(after.player.screenX) || !isFiniteNumber(after.player.lane)) {
        return FAIL('started race lacks visible playfield bounds or player lane geometry');
      }
      const roadErr = roadMappingError(after, 'after real start');
      if (roadErr) return FAIL(roadErr);
      const afterHash = await game.canvasHash();
      if (beforeHash === afterHash && (!after.render || !isFiniteNumber(after.render.revision))) {
        return FAIL('no independent render evidence after real start');
      }
      return PASS('started via real mouse; phase=' + after.phase);
    }
  },
  {
    id: 'p1-real-keyboard-opposite-lane-direction',
    name: 'real keyboard left/right produce opposite screen lane directions',
    level: 'P1',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('lane_direction');
      await ensurePlaying(game);
      let before = await waitForStableLaneGeometry(game, 'before ArrowLeft');
      if (!before) return FAIL('lane_direction did not settle to stable playable geometry before ArrowLeft');
      const startLane = before.player && before.player.lane;
      const startX = before.player && before.player.screenX;
      if (!isFiniteNumber(startX)) return FAIL('player.screenX unavailable');

      await game.pressKey('ArrowLeft', 90);
      const afterLeft = await waitForLaneDirectionResponse(game, before, 'after ArrowLeft');
      if (!afterLeft) return FAIL('ArrowLeft caused no visible lane movement');
      const leftDelta = visibleLaneDirectionDelta(before, afterLeft);
      if (sign(leftDelta) === 0 && afterLeft.player.lane === startLane) {
        return FAIL('ArrowLeft caused no visible lane movement');
      }
      if (afterLeft.player.lane < 0 || afterLeft.player.lane >= afterLeft.player.laneCount) {
        return FAIL('ArrowLeft moved lane out of bounds');
      }
      const leftRoadErr = roadMappingError(afterLeft, 'after ArrowLeft');
      if (leftRoadErr) return FAIL(leftRoadErr);

      await game.loadScenario('lane_direction');
      await ensurePlaying(game);
      before = await waitForStableLaneGeometry(game, 'before ArrowRight');
      if (!before) return FAIL('lane_direction did not settle to stable playable geometry before ArrowRight');
      await game.pressKey('ArrowRight', 90);
      const afterRight = await waitForLaneDirectionResponse(game, before, 'after ArrowRight');
      if (!afterRight) return FAIL('ArrowRight caused no visible lane movement');
      const rightDelta = visibleLaneDirectionDelta(before, afterRight);
      if (sign(rightDelta) === 0 && afterRight.player.lane === before.player.lane) {
        return FAIL('ArrowRight caused no visible lane movement');
      }
      if (afterRight.player.lane < 0 || afterRight.player.lane >= afterRight.player.laneCount) {
        return FAIL('ArrowRight moved lane out of bounds');
      }
      const rightRoadErr = roadMappingError(afterRight, 'after ArrowRight');
      if (rightRoadErr) return FAIL(rightRoadErr);
      const leftSign = sign(leftDelta);
      const rightSign = sign(rightDelta);
      if (leftSign === 0 || rightSign === 0 || leftSign === rightSign) {
        return FAIL('left/right deltas are not opposite: left=' + leftDelta + ', right=' + rightDelta);
      }
      return PASS('opposite screen direction deltas: left=' + leftDelta.toFixed(1) + ', right=' + rightDelta.toFixed(1));
    }
  },
  {
    id: 'p1-real-touch-swipe-lane-direction',
    name: 'real touch swipe changes visible lane direction',
    level: 'P1',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('lane_direction');
      const before = await ensurePlaying(game);
      const beforeX = before.player && before.player.screenX;
      const beforeLane = before.player && before.player.lane;
      const beforeRevision = before.render && before.render.revision;
      if (!isFiniteNumber(beforeX)) return FAIL('player.screenX unavailable before touch swipe');
      await game.realTouchSwipe('left');
      const after = await game.snapshot();
      const moved = Math.abs((after.player && after.player.screenX) - beforeX) > 0.5 || (after.player && after.player.lane) !== beforeLane;
      if (!moved) return FAIL('real touch swipe produced no visible lane movement');
      if (after.player.lane < 0 || after.player.lane >= after.player.laneCount) return FAIL('touch swipe moved lane out of bounds');
      const roadErr = roadMappingError(after, 'after touch swipe');
      if (roadErr) return FAIL(roadErr);
      const revisionChanged = after.render && isFiniteNumber(after.render.revision) && after.render.revision !== beforeRevision;
      if (!revisionChanged && (!after.render || after.render.nonBlank !== true)) return FAIL('touch lane input had no render evidence');
      return PASS('touch swipe moved lane ' + beforeLane + ' -> ' + after.player.lane);
    }
  },
  {
    id: 'p1-input-response-window-observable',
    name: 'real lane input produces observable response within control window',
    level: 'P1',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('lane_direction');
      const before = await ensurePlaying(game);
      const beforeRoadErr = roadMappingError(before, 'before response window');
      if (beforeRoadErr) return FAIL(beforeRoadErr);
      await browser.keyDown('ArrowLeft');
      const samples = await sampleSnapshots(game, browser, CONTROL_RESPONSE_WINDOW_MS, CONTROL_SAMPLE_INTERVAL_MS);
      await browser.keyUp('ArrowLeft');
      await browser.sleep(CONTROL_REVERSAL_SETTLE_MS);
      const response = laneResponseFromSamples(before, samples);
      if (!response.firstMoved) return FAIL('ArrowLeft produced no lane/screen/render response within the control window');
      if (!response.laneChanged && response.maxAbsXDelta <= 0.5 && !response.revisionChanged) {
        return FAIL('input response was not observable through lane, screenX, or render revision');
      }
      const after = await game.snapshot();
      const roadErr = roadMappingError(after, 'after response window');
      if (roadErr) return FAIL(roadErr);
      if (after.phase !== 'playing' || after.overlayBlocking) return FAIL('lane response left playable state');
      return PASS('response observed: laneChanged=' + response.laneChanged + ', maxScreenDelta=' + response.maxAbsXDelta.toFixed(1));
    }
  },
  {
    id: 'p1-rapid-reversal-remains-controllable',
    name: 'rapid opposite lane inputs reverse trend and stay controllable',
    level: 'P1',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('lane_direction');
      const start = await ensurePlaying(game);
      await game.pressKey('ArrowLeft', 70);
      const afterLeft = await game.snapshot();
      const leftDelta = afterLeft.player.screenX - start.player.screenX;
      if (sign(leftDelta) === 0 && afterLeft.player.lane === start.player.lane) return FAIL('first rapid input produced no left response');
      const leftRoadErr = roadMappingError(afterLeft, 'after first rapid input');
      if (leftRoadErr) return FAIL(leftRoadErr);

      await browser.keyDown('ArrowRight');
      const samples = await sampleSnapshots(game, browser, CONTROL_RESPONSE_WINDOW_MS, CONTROL_SAMPLE_INTERVAL_MS);
      await browser.keyUp('ArrowRight');
      await browser.sleep(CONTROL_REVERSAL_SETTLE_MS);
      const response = laneResponseFromSamples(afterLeft, samples);
      const afterRight = await game.snapshot();
      const rightDeltaFromLeft = afterRight.player.screenX - afterLeft.player.screenX;
      const rightLaneDeltaFromLeft = afterRight.player.lane - afterLeft.player.lane;
      const reversed = sign(rightDeltaFromLeft) > 0 || rightLaneDeltaFromLeft > 0 || response.finalLaneDelta > 0 || sign(response.finalXDelta) > 0;
      if (!reversed) {
        return FAIL('ArrowRight after ArrowLeft did not reverse lane trend: screenDelta=' + rightDeltaFromLeft + ', laneDelta=' + rightLaneDeltaFromLeft);
      }
      const roadErr = roadMappingError(afterRight, 'after rapid reversal');
      if (roadErr) return FAIL(roadErr);
      if (afterRight.phase !== 'playing' || afterRight.overlayBlocking || !afterRight.canInteractWithPlayfield) {
        return FAIL('rapid reversal left playfield non-interactive');
      }
      return PASS('rapid reversal screenDelta=' + rightDeltaFromLeft.toFixed(1) + ', laneDelta=' + rightLaneDeltaFromLeft);
    }
  },
  {
    id: 'p1-blocked-lane-contract-rejection',
    name: 'blocked lane contract rejects out-of-road movement',
    level: 'P1',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('blocked_lane');
      const before = await ensurePlaying(game);
      const blocked = before.road && before.road.blockedLane;
      if (!blocked || !isFiniteNumber(blocked.lane)) return FAIL('blocked_lane scenario lacks road.blockedLane summary');
      const direction = blocked.side === 'left' ? 'left' : blocked.side === 'right' ? 'right' : (blocked.lane < before.player.lane ? 'left' : 'right');
      const balanceBefore = before.economy && before.economy.balance;
      const rankBefore = before.race && before.race.rank;
      const progressBefore = before.hud && before.hud.progress;
      const response = await game.contractInput({ type: 'swipe', direction });
      const after = await game.snapshot();
      const unchangedLane = after.player && before.player && after.player.lane === before.player.lane && approxEqual(after.player.screenX, before.player.screenX, 0.5);
      const rejected = response && response.ok === false;
      const hasFeedback = after.feedback && typeof after.feedback.last === 'string' && after.feedback.last.length > 0;
      if (!rejected && !unchangedLane) return FAIL('blocked lane input was accepted or moved player');
      const roadErr = roadMappingError(after, 'after blocked lane input');
      if (roadErr) return FAIL(roadErr);
      if (!approxEqual(after.economy && after.economy.balance, balanceBefore, 0.001)) return FAIL('blocked lane rejection changed balance');
      if (after.race && after.race.rank !== rankBefore) return FAIL('blocked lane rejection changed rank');
      if (after.hud && progressBefore != null && after.hud.progress + 0.001 < progressBefore) return FAIL('blocked lane rejection regressed progress');
      if (!hasFeedback && !blocked.reason && !rejected) return FAIL('blocked lane rejection lacks feedback/reason evidence');
      return PASS('blocked lane rejected with lane=' + after.player.lane);
    }
  },
  {
    id: 'p1-race-progresses-while-playing',
    name: 'race progress and visible scene advance while playing',
    level: 'P1',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('race_ready');
      const before = await ensurePlaying(game);
      await browser.sleep(1200);
      const after = await game.snapshot();
      const distanceDelta = (after.player.distance || 0) - (before.player.distance || 0);
      const progressDelta = ((after.hud && after.hud.progress) || 0) - ((before.hud && before.hud.progress) || 0);
      const timeDelta = ((after.race && after.race.time) || 0) - ((before.race && before.race.time) || 0);
      const revisionDelta = ((after.render && after.render.revision) || 0) - ((before.render && before.render.revision) || 0);
      if (distanceDelta <= 0 && progressDelta <= 0 && timeDelta <= 0) {
        return FAIL('race did not progress while playing');
      }
      if (revisionDelta <= 0 && (!after.render || after.render.nonBlank !== true)) {
        return FAIL('no render revision/nonblank evidence during progress');
      }
      if (after.phase !== 'playing') return FAIL('unexpected phase during progress: ' + after.phase);
      const roadErr = roadMappingError(after, 'during race progress');
      if (roadErr) return FAIL(roadErr);
      return PASS('distanceDelta=' + distanceDelta.toFixed(2) + ', progressDelta=' + progressDelta.toFixed(4));
    }
  },
  {
    id: 'p1-traffic-avoidance-loop',
    name: 'traffic avoidance loop changes risk after player lane action',
    level: 'P1',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('traffic_near_miss');
      const before = await ensurePlaying(game);
      if (!before.traffic || before.traffic.visibleCount < 1 || !before.traffic.nearestAhead) {
        return FAIL('traffic_near_miss scenario lacks visible traffic risk');
      }
      const riskBefore = before.traffic.nearestAhead.distance;
      const safeDirection = before.traffic.safeDirection || (before.traffic.nearestAhead.screenX < before.player.screenX ? 'right' : 'left');
      await game.realMouseSwipe(safeDirection);
      await browser.sleep(500);
      const after = await game.snapshot();
      if (after.result && after.result.type && after.result.type !== 'none') {
        return FAIL('avoidance action immediately entered result=' + after.result.type);
      }
      const laneChanged = after.player && before.player && after.player.lane !== before.player.lane;
      const screenMoved = after.player && before.player && Math.abs(after.player.screenX - before.player.screenX) > 0.5;
      const riskAfter = after.traffic && after.traffic.nearestAhead ? after.traffic.nearestAhead.distance : Infinity;
      const riskImproved = riskAfter > riskBefore || !after.traffic.nearestAhead;
      if (!laneChanged && !screenMoved) return FAIL('avoidance action did not move player');
      const roadErr = roadMappingError(after, 'after traffic avoidance');
      if (roadErr) return FAIL(roadErr);
      if (!riskImproved && (!after.render || after.render.revision === before.render.revision)) {
        return FAIL('traffic risk did not improve and no visible revision changed');
      }
      return PASS('real safeDirection=' + safeDirection + ', riskBefore=' + riskBefore + ', riskAfter=' + riskAfter);
    }
  },
  {
    id: 'p1-menu-blocking-invariant',
    name: 'menu overlay blocks real keyboard lane input and then closes',
    level: 'P1',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('race_ready');
      let before = await ensurePlaying(game);
      await game.contractInput({ type: 'openMenu' });
      const opened = await game.snapshot();
      if (!opened.overlayBlocking || opened.phase !== 'paused') return FAIL('menu did not enter blocking paused state');
      const totalBefore = (opened.economy.balance || 0) + (opened.player.lane || 0);
      await game.pressKey('ArrowLeft', 90);
      const blockedAfter = await game.snapshot();
      const laneUnchanged = blockedAfter.player.lane === opened.player.lane;
      const totalAfter = (blockedAfter.economy.balance || 0) + (blockedAfter.player.lane || 0);
      if (!laneUnchanged) return FAIL('real key changed semantic lane while menu overlayBlocking=true');
      if (!approxEqual(totalBefore, totalAfter, 0.001)) return FAIL('menu blocking invariant total changed');
      await game.contractInput({ type: 'closePanel' });
      before = await game.snapshot();
      if (before.overlayBlocking || !before.canInteractWithPlayfield) return FAIL('closePanel did not restore playfield interaction');
      return PASS('blocked lane input unchanged and menu closed');
    }
  },
  {
    id: 'p1-finish-result-contract-terminal-lock',
    name: 'finish result contract appears and terminal state locks normal lane input',
    level: 'P1',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('near_finish');
      await ensurePlaying(game);
      // `near_finish` is deliberately a valid near-terminal state.  The
      // public action schema has no `advance`/teleport action; progression
      // must be observed from the game's normal running loop.
      const resultSnap = await waitUntil(async () => {
        const s = await game.snapshot();
        return { ok: s.phase === 'result' && s.result && s.result.type === 'finish', value: s };
      }, 4000, 100);
      if (!resultSnap) return FAIL('near_finish did not reach finish result through player-level advance');
      if (!resultSnap.overlayBlocking) return FAIL('finish result is not blocking playfield');
      const progressBefore = resultSnap.hud && resultSnap.hud.progress;
      const laneBefore = resultSnap.player && resultSnap.player.lane;
      await game.contractInput({ type: 'key', key: 'ArrowLeft' });
      await browser.sleep(250);
      const after = await game.snapshot();
      if (after.phase !== 'result') return FAIL('terminal result did not stay locked');
      if (!approxEqual(after.hud && after.hud.progress, progressBefore, 0.001) || after.player.lane !== laneBefore) {
        return FAIL('normal input mutated terminal state after finish');
      }
      if (!after.economy || after.economy.earnedLast < 0 || after.economy.balance < 0) {
        return FAIL('finish economy invalid');
      }
      return PASS('finish result locked with earned=' + after.economy.earnedLast);
    }
  },
  {
    id: 'p1-restart-contract-clears-result',
    name: 'restart contract clears result overlay and transient danger state',
    level: 'P1',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('crash_result');
      let before = await game.snapshot();
      if (before.phase !== 'result') {
        await game.loadScenario('result_with_continue');
        before = await game.snapshot();
      }
      if (before.phase !== 'result' || !before.overlayBlocking) return FAIL('restart precondition is not a blocking result state');
      const balanceBefore = before.economy && before.economy.balance;
      const response = await game.contractInput({ type: 'restart' });
      await browser.sleep(400);
      const after = await game.snapshot();
      if (response && response.ok === false) return FAIL('restart was rejected from result state');
      const restartedIntoStart =
        after.phase === 'menu' &&
        after.screen === 'start' &&
        after.canInteractWithPlayfield === false;
      const restartedIntoPlaying =
        after.phase === 'playing' &&
        after.screen === 'race' &&
        after.overlayBlocking === false &&
        after.canInteractWithPlayfield === true;
      if (!restartedIntoStart && !restartedIntoPlaying) return FAIL('restart did not enter a new start or playing state');
      if (after.result && after.result.type && after.result.type !== 'none') return FAIL('restart left terminal result type=' + after.result.type);
      if (after.warnings && after.warnings.bulletTimeActive) return FAIL('restart left bullet-time active');
      if (after.economy && after.economy.balance < 0) return FAIL('restart made balance negative');
      if (before.economy && after.economy && !approxEqual(after.economy.balance, balanceBefore, 0.001) && after.economy.balance < balanceBefore) {
        return FAIL('restart unexpectedly deducted balance');
      }
      if (after.player && after.player.distance < 0) return FAIL('restart produced negative distance');
      return PASS('restart cleared result; phase=' + after.phase);
    }
  },
  {
    id: 'p2-continue-cost-conservation',
    name: 'continue contract deducts cost without negative balance',
    level: 'P2',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('result_with_continue');
      const before = await game.snapshot();
      if (before.phase !== 'result' || !before.economy || before.economy.continueCost <= 0) {
        return FAIL('result_with_continue is not a legal continue precondition');
      }
      const totalBefore = before.economy.balance;
      const cost = before.economy.continueCost;
      const response = await game.contractInput({ type: 'continue' });
      await browser.sleep(300);
      const after = await game.snapshot();
      const totalAfter = after.economy.balance;
      if (response && response.ok === false) return FAIL('continue was rejected despite legal precondition');
      if (after.phase !== 'playing') return FAIL('continue did not return to playing');
      if (totalAfter < 0) return FAIL('continue made balance negative');
      if (!approxEqual(totalBefore - totalAfter, cost, 0.001)) {
        return FAIL('continue cost mismatch: before=' + totalBefore + ', after=' + totalAfter + ', cost=' + cost);
      }
      return PASS('continue deducted ' + cost);
    }
  },
  {
    id: 'p2-shop-insufficient-rejection',
    name: 'shop insufficient funds rejects purchase and preserves balance',
    level: 'P2',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('shop_insufficient');
      const before = await game.snapshot();
      const item = before.shop && Array.isArray(before.shop.items) && before.shop.items.find(i => !i.owned && i.affordable === false);
      if (!before.shop || !before.shop.open || !item) return FAIL('shop_insufficient lacks an unaffordable item');
      const totalBefore = before.economy.balance;
      const response = await game.contractInput({ type: 'buyOrEquip', itemId: item.id });
      await browser.sleep(300);
      const after = await game.snapshot();
      const afterItem = after.shop && Array.isArray(after.shop.items) && after.shop.items.find(i => i.id === item.id);
      const totalAfter = after.economy.balance;
      const unchanged = approxEqual(totalBefore, totalAfter, 0.001) && afterItem && afterItem.owned === false && afterItem.equipped === false;
      if (!unchanged) return FAIL('insufficient purchase mutated balance or ownership');
      if (response && response.ok === true) return FAIL('insufficient purchase returned ok:true');
      return PASS('rejected unaffordable item with balance unchanged');
    }
  },
  {
    id: 'p2-real-click-shop-purchase-success',
    name: 'real click shop purchase succeeds and updates equipped vehicle',
    level: 'P2',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('shop_affordable');
      const before = await game.snapshot();
      const item = before.shop && Array.isArray(before.shop.items) && before.shop.items.find(i => !i.owned && i.affordable === true && i.price > 0);
      if (!before.shop || !before.shop.open || !item) return FAIL('shop_affordable lacks a visible affordable item');
      const point = await game.findShopItemPoint(item.id, item.bounds) || item.bounds;
      if (!point) return FAIL('affordable shop item has no visible click target');
      const balanceBefore = before.economy.balance;
      const beforeEquipped = before.shop.items.find(i => i.equipped === true);
      await game.realClickBounds(point);
      await browser.sleep(700);
      const after = await game.snapshot();
      const afterItem = after.shop && Array.isArray(after.shop.items) && after.shop.items.find(i => i.id === item.id);
      if (!afterItem || afterItem.owned !== true || afterItem.equipped !== true) return FAIL('real shop click did not own/equip item');
      if (after.economy.balance < 0) return FAIL('shop purchase made balance negative');
      if (!approxEqual(balanceBefore - after.economy.balance, item.price, 1)) {
        return FAIL('shop purchase balance delta mismatch: before=' + balanceBefore + ', after=' + after.economy.balance + ', price=' + item.price);
      }
      const capabilityChanged =
        beforeEquipped && beforeEquipped.id !== afterItem.id &&
        (beforeEquipped.maxSpeed !== afterItem.maxSpeed ||
          beforeEquipped.multiplier !== afterItem.multiplier ||
          beforeEquipped.power !== afterItem.power);
      if (!capabilityChanged) return FAIL('purchase did not expose equipped/performance capability change');
      return PASS('purchased ' + item.id + ' for ' + item.price);
    }
  },
  {
    id: 'p2-real-click-nitro-consumes-use',
    name: 'real click nitro consumes a use and shows speed feedback',
    level: 'P2',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('nitro_ready');
      const before = await ensurePlaying(game);
      if (!before.nitro || before.nitro.usesLeft <= 0 || before.nitro.available === false) return FAIL('nitro_ready lacks available nitro');
      const point = before.nitro.bounds || await game.findNitroPoint();
      if (!point) return FAIL('nitro has no visible click target');
      const speedBefore = before.player && before.player.speed;
      const revisionBefore = before.render && before.render.revision;
      await game.realClickBounds(point);
      await browser.sleep(600);
      const after = await game.snapshot();
      if (!after.nitro || after.nitro.usesLeft !== before.nitro.usesLeft - 1) {
        return FAIL('real nitro click did not consume exactly one use');
      }
      if (after.nitro.usesLeft < 0) return FAIL('nitro uses went negative');
      const speedChanged = after.player && isFiniteNumber(after.player.speed) && after.player.speed > speedBefore;
      const renderChanged = after.render && isFiniteNumber(after.render.revision) && after.render.revision > revisionBefore;
      const active = after.nitro.active === true;
      if (!speedChanged && !renderChanged && !active) return FAIL('nitro click had no speed/render/active feedback');
      return PASS('nitro uses ' + before.nitro.usesLeft + ' -> ' + after.nitro.usesLeft);
    }
  },
  {
    id: 'p2-power-cooldown-rejection',
    name: 'power use creates effect/cooldown and rejects cooldown spam',
    level: 'P2',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('power_ready');
      const before = await ensurePlaying(game);
      if (!before.power || !before.power.kind || before.power.available !== true) return FAIL('power_ready lacks available power');
      const response = await game.contractInput({ type: 'usePower' });
      await browser.sleep(500);
      const after = await game.snapshot();
      if (response && response.ok === false) return FAIL('available power was rejected');
      if (!after.power || after.power.cooldown <= 0) return FAIL('power did not enter cooldown');
      const effectChanged =
        (after.render && before.render && after.render.revision > before.render.revision) ||
        (after.traffic && before.traffic && after.traffic.visibleCount !== before.traffic.visibleCount) ||
        (after.player && before.player && Math.abs(after.player.speed - before.player.speed) > 0.1);
      if (!effectChanged) return FAIL('power use had no visible/state effect beyond ok');
      const totalBefore = (after.power.cooldown || 0) + (after.economy.balance || 0);
      const second = await game.contractInput({ type: 'usePower' });
      await browser.sleep(150);
      const afterSecond = await game.snapshot();
      const totalAfter = (afterSecond.power.cooldown || 0) + (afterSecond.economy.balance || 0);
      const rejected = second && second.ok === false;
      const unchanged = approxEqual(afterSecond.economy.balance, after.economy.balance, 0.001) && afterSecond.power.cooldown > 0;
      if (!rejected && !unchanged) return FAIL('cooldown use was not rejected or preserved');
      if (totalAfter < afterSecond.economy.balance || totalBefore < after.economy.balance) return FAIL('cooldown invariant invalid');
      return PASS('power=' + before.power.kind + ', cooldown=' + after.power.cooldown);
    }
  },
  {
    id: 'p2-bullet-time-contract',
    name: 'bullet time taps advance challenge instead of pre-resolved result',
    level: 'P2',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('bullet_time');
      const before = await game.snapshot();
      if (before.phase !== 'bulletTime' || !before.warnings || before.warnings.bulletTimeActive !== true) {
        return FAIL('bullet_time scenario did not start in active challenge');
      }
      if (before.result && before.result.type !== 'none') return FAIL('bullet_time precondition already has result');
      const progressBefore = before.warnings.tapProgress || 0;
      await game.contractInput({ type: 'bulletTap' });
      await game.contractInput({ type: 'bulletTap' });
      await browser.sleep(200);
      const after = await game.snapshot();
      if (!after.warnings || after.warnings.tapProgress <= progressBefore) {
        return FAIL('bullet taps did not advance tapProgress');
      }
      if (after.phase === 'result' && after.result && after.result.type === 'finish') {
        return FAIL('bullet taps incorrectly awarded finish result');
      }
      return PASS('tapProgress ' + progressBefore + ' -> ' + after.warnings.tapProgress);
    }
  },
  {
    id: 'p2-real-key-view-toggle-preserves-state',
    name: 'real key view toggle preserves economy and keeps render visible',
    level: 'P2',
    timeoutMs: 12000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const ready = await ensureContractReady(game);
      if (!ready.ok) return FAIL(ready.detail);
      await game.loadScenario('race_ready');
      const before = await ensurePlaying(game);
      const modeBefore = before.view && before.view.mode;
      const totalBefore = (before.economy.balance || 0) + ((before.shop && before.shop.items) ? before.shop.items.filter(i => i.owned).length : 0);
      await game.pressKey('KeyV', 80);
      const after = await game.snapshot();
      const modeAfter = after.view && after.view.mode;
      const totalAfter = (after.economy.balance || 0) + ((after.shop && after.shop.items) ? after.shop.items.filter(i => i.owned).length : 0);
      if (!modeBefore || !modeAfter || modeBefore === modeAfter) return FAIL('real V key did not toggle view mode');
      if (!after.render || after.render.nonBlank !== true) return FAIL('render not visible after view toggle');
      if (!approxEqual(totalBefore, totalAfter, 0.001)) return FAIL('view toggle changed economy/ownership invariant');
      return PASS('view ' + modeBefore + ' -> ' + modeAfter);
    }
  }
];

module.exports = { suite };
