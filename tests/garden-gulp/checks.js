// Garden Gulp L2 runtime checks
// === GDD Coverage Map ===
// M1 启动与 UI 流 -> p0-boot-stability, p1-start-overlay-real-click
// M2 屏幕空间移动 -> p1-keyboard-opposite-direction, p1-real-mouse-drag-direction, p1-real-touch-drag-direction
// M3 物件反应 -> p2-world-motion-or-edit-depth
// M4 吞噬判定与落入反馈 -> p1-consume-grow-progress, p1-first-level-clearable-real-route, p2-large-object-rejection-invariant
// M5 成长、进度与守恒 -> p0-contract-schema, p1-consume-grow-progress, p1-first-level-clearable-real-route
// M6 倒计时、完成与失败 -> p1-first-level-clearable-real-route, p1-complete-terminal-real-input, p1-timeout-retry
// M7 关卡推进 -> p1-first-level-clearable-real-route, p1-next-level-progression
// M8 音频开关 -> p2-audio-toggle-unchanged
// M9 编辑模式 -> p2-world-motion-or-edit-depth
//
// === Category Map ===
// Boot & Stability: p0-boot-stability, p0-contract-schema
// UI Flow & Blocking: p1-start-overlay-real-click
// Input Semantics: p1-keyboard-opposite-direction, p1-real-mouse-drag-direction, p1-real-touch-drag-direction
// Core Mechanic Loop: p1-consume-grow-progress, p1-first-level-clearable-real-route
// State Machine: p1-complete-terminal-real-input, p1-timeout-retry
// Economy/Progression: p1-next-level-progression
// Feedback & Observability: p2-audio-toggle-unchanged
// Invariants & Rejection: p2-large-object-rejection-invariant
// Depth/Optional Systems: p2-world-motion-or-edit-depth
//
// === Rationality Map ===
// p1-start-overlay-real-click: M1 | real action: mouseClick/DOM click start | independent observation: phase + overlayBlocking + canvas nonblank | empty-shell failure: menu remains blocking or playfield cannot receive input
// p1-keyboard-opposite-direction: M2 | real action: ArrowRight then ArrowLeft | independent observation: hole.screenX deltas + canvas hash | empty-shell failure: no movement or same-direction movement fails
// p1-real-mouse-drag-direction: M2 | real action: browser mouse drag to the right | independent observation: hole.screenX + canvas hash | empty-shell failure: API-only movement or mirrored screen direction fails
// p1-real-touch-drag-direction: M2 | real action: CDP touch drag to the right | independent observation: hole.screenX + canvas hash | empty-shell failure: mouse/API-only movement fails
// p1-consume-grow-progress: M4/M5 | real action: mouse drag hole over small object | independent observation: score/progress/hole size/HUD + totalBefore/totalAfter conservation | empty-shell failure: direct score without entity/growth/HUD sync fails
// p1-first-level-clearable-real-route: M4/M5/M6/M7 | real action: repeated public target selection and real mouse drags in fresh_level | independent observation: progress/growth/result and objects.visible | empty-shell failure: artificial one-object scenarios pass but default first level leaves unreachable final object
// p1-complete-terminal-real-input: M6 | real action: consume last object then try extra movement | independent observation: result visible + terminal score unchanged | empty-shell failure: completion without last-item trigger or terminal not locked fails
// p2-large-object-rejection-invariant: M4/M5 | real action: drag small hole over too-large object | independent observation: unchanged score and total conservation | empty-shell failure: accepting illegal consume fails
// p1-timeout-retry: M6/M7 | real action: wait to timeout, click retry | independent observation: failed result then playing same level | empty-shell failure: timer/result/retry shell fails
// p1-next-level-progression: M7 | real action: click continue from completed state | independent observation: level increases and progress resets | empty-shell failure: button only hides modal fails
// p2-audio-toggle-unchanged: M8 | real action: visible audio click or contract toggle | independent observation: audio state changes, score/total unchanged | empty-shell failure: icon-only or resource-mutating toggle fails
// p2-world-motion-or-edit-depth: M3/M9 | real action: wait near object or open edit | independent observation: worldMotionRevision or activePanel | empty-shell failure: static world and no edit depth fails

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }
function NA(detail) { return { status: 'NOT_APPLICABLE', detail: detail || '' }; }

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function totalOf(s) {
  return Number(s && (s.remaining || 0)) + Number(s && (s.falling || 0)) + Number(s && (s.consumed || s.score || 0));
}

function visibleScore(s) {
  return Number(s && (isNum(s.consumed) ? s.consumed : s.score || 0));
}

function approxChanged(a, b, eps) {
  return isNum(a) && isNum(b) && Math.abs(a - b) > (eps || 2);
}

function holeInsideBounds(s) {
  const h = s && s.hole;
  const b = (s && s.playfieldBounds) || (s && s.canvas);
  if (!h || !b || !isNum(h.screenX) || !isNum(h.screenY)) return true;
  if (![b.left, b.top, b.right, b.bottom].every(isNum)) return true;
  const radius = Math.max(0, Number(h.size || 0) / 2);
  return h.screenX >= b.left - radius && h.screenX <= b.right + radius &&
    h.screenY >= b.top - radius && h.screenY <= b.bottom + radius;
}

function createGameDriver(browser) {
  async function evalPage(src) {
    const result = await browser.eval(src);
    if (result && result.__l2_err__) throw new Error(result.__l2_err__);
    return result;
  }

  async function snapshot() {
    return await evalPage(`
      (function() {
        function parseProgressText() {
          var text = Array.from(document.querySelectorAll('body *')).map(function(el) {
            return el && el.textContent ? el.textContent.trim() : '';
          }).filter(Boolean).join(' | ');
          return text.slice(0, 2000);
        }
        function canvasInfo() {
          var canvases = Array.from(document.querySelectorAll('canvas'));
          var best = canvases.sort(function(a, b) {
            return ((b.width || b.clientWidth || 0) * (b.height || b.clientHeight || 0)) -
              ((a.width || a.clientWidth || 0) * (a.height || a.clientHeight || 0));
          })[0] || null;
          if (!best) return null;
          var r = best.getBoundingClientRect();
          var nonBlank = false;
          try {
            var ctx = best.getContext && best.getContext('2d');
            if (ctx && best.width > 0 && best.height > 0) {
              var data = ctx.getImageData(Math.floor(best.width / 2), Math.floor(best.height / 2), 3, 3).data;
              for (var i = 0; i < data.length; i += 4) {
                if (data[i] || data[i + 1] || data[i + 2] || data[i + 3]) { nonBlank = true; break; }
              }
            }
          } catch (_) {
            nonBlank = true;
          }
          return { width: best.width || 0, height: best.height || 0, left: r.left, top: r.top, right: r.right, bottom: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2, nonBlank: nonBlank };
        }
        var api = window.__gameTest;
        var raw = null;
        if (api && typeof api.getSnapshot === 'function') {
          raw = api.getSnapshot();
        }
        var s = raw && typeof raw === 'object' ? raw : {};
        var c = canvasInfo();
        var phase = s.phase || (s.result && s.result !== 'none' ? String(s.result) : null);
        var blocking = s.overlayBlocking;
        if (typeof blocking !== 'boolean') {
          var blockers = Array.from(document.querySelectorAll('body *')).filter(function(el) {
            var st = getComputedStyle(el);
            var r = el.getBoundingClientRect();
            if (st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) === 0) return false;
            if (st.pointerEvents === 'none') return false;
            if (r.width < window.innerWidth * 0.4 || r.height < window.innerHeight * 0.25) return false;
            var zi = parseInt(st.zIndex, 10);
            return st.position === 'fixed' || st.position === 'absolute' || zi > 5;
          });
          blocking = blockers.some(function(el) {
            var text = (el.textContent || '').toLowerCase();
            return /start|play|continue|retry|again|level|time|tap/.test(text);
          });
        }
        var canvas = s.canvas || c || {};
        var hole = s.hole || {};
        if ((!isFinite(hole.screenX) || !isFinite(hole.screenY)) && c) {
          hole.screenX = isFinite(hole.x) ? c.left + (hole.x % Math.max(1, canvas.width || c.width || 720)) : null;
          hole.screenY = isFinite(hole.y) ? c.top + (hole.y % Math.max(1, canvas.height || c.height || 1280)) : null;
        }
        return Object.assign({}, s, {
          phase: phase || s.screen || 'unknown',
          overlayBlocking: blocking,
          canInteractWithPlayfield: typeof s.canInteractWithPlayfield === 'boolean' ? s.canInteractWithPlayfield : !blocking,
          hole: hole,
          canvas: canvas,
          bodyText: parseProgressText()
        });
      })()
    `);
  }

  async function waitForReady() {
    await browser.sleep(500);
    const ready = await evalPage(`!!document.body && (document.readyState === 'complete' || document.readyState === 'interactive')`);
    if (!ready) throw new Error('document not ready');
    return snapshot();
  }

  async function hasContract() {
    return await evalPage(`!!(window.__gameTest && typeof window.__gameTest.getSnapshot === 'function' && typeof window.__gameTest.input === 'function' && typeof window.__gameTest.loadScenario === 'function')`);
  }

  async function reset(options) {
    return await evalPage(`
      (function() {
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return { ok:false, reason:'missing reset' };
        return window.__gameTest.reset(${JSON.stringify(options || {})});
      })()
    `);
  }

  async function loadScenario(name) {
    return await evalPage(`
      (function() {
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { ok:false, reason:'missing loadScenario' };
        return window.__gameTest.loadScenario(${JSON.stringify(name)});
      })()
    `);
  }

  async function contractInput(action) {
    return await evalPage(`
      (function() {
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { ok:false, reason:'missing input' };
        return window.__gameTest.input(${JSON.stringify(action)});
      })()
    `);
  }

  async function canvasPoint() {
    const s = await snapshot();
    const c = s.canvas || {};
    if (isNum(c.cx) && isNum(c.cy)) return { x: c.cx, y: c.cy, left: c.left, top: c.top, right: c.right, bottom: c.bottom };
    const size = await browser.getCanvasSize();
    if (!size || !size.cssW || !size.cssH) return null;
    return await evalPage(`
      (function() {
        var c = document.querySelector('canvas');
        if (!c) return null;
        var r = c.getBoundingClientRect();
        return { x:r.left + r.width/2, y:r.top + r.height/2, left:r.left, top:r.top, right:r.right, bottom:r.bottom };
      })()
    `);
  }

  async function clickStart() {
    const point = await evalPage(`
      (function() {
        function visible(el) {
          if (!el) return false;
          var st = getComputedStyle(el), r = el.getBoundingClientRect();
          return st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) !== 0 && r.width > 10 && r.height > 10;
        }
        var candidates = Array.from(document.querySelectorAll('button, [role=button], a, input[type=button], input[type=submit]'));
        var btn = candidates.find(function(el) {
          var t = ((el.textContent || el.value || el.getAttribute('aria-label') || '') + '').toLowerCase();
          return visible(el) && /start|play|begin|tap|continue/.test(t);
        });
        if (!btn) return null;
        var r = btn.getBoundingClientRect();
        return { x:r.left + r.width/2, y:r.top + r.height/2 };
      })()
    `);
    if (point && isNum(point.x) && isNum(point.y)) {
      await browser.mouseClick(point.x, point.y);
      await browser.sleep(700);
      return true;
    }
    const p = await canvasPoint();
    if (p) {
      await browser.mouseClick(p.x, p.y);
      await browser.sleep(700);
      return true;
    }
    return false;
  }

  async function clickSemanticButton(kind, afterClickMs) {
    let point = null;
    const attempts = kind === 'continue' ? 15 : 1;
    for (let attempt = 0; attempt < attempts && !point; attempt++) {
      point = await evalPage(`
      (function() {
        var re = ${kind === 'retry' ? '/retry|again|try/i' : kind === 'continue' ? '/next|continue|proceed|advance/i' : kind === 'music' ? '/music|sound|audio|mute|🔊|🎵|🔈|🔇/i' : '/edit|settings|gear|panel/i'};
        function visible(el) {
          if (!el) return false;
          var st = getComputedStyle(el), r = el.getBoundingClientRect();
          return st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) !== 0 && r.width > 8 && r.height > 8;
        }
        var candidates = Array.from(document.querySelectorAll('button, [role=button], a, input, select'));
        var btn = candidates.find(function(el) {
          var t = ((el.textContent || el.value || el.title || el.getAttribute('aria-label') || '') + '').toLowerCase();
          return visible(el) && re.test(t);
        });
        if (!btn) return null;
        var r = btn.getBoundingClientRect();
        return { x:r.left + r.width/2, y:r.top + r.height/2 };
      })()
      `);
      if (!point && attempt + 1 < attempts) await browser.sleep(100);
    }
    if (!point || !isNum(point.x) || !isNum(point.y)) return false;
    await browser.mouseClick(point.x, point.y);
    await browser.sleep(typeof afterClickMs === 'number' ? afterClickMs : 500);
    return true;
  }

  async function holdKey(key, ms) {
    await browser.holdKey(key, ms || 300);
    await browser.sleep(250);
  }

  async function realMouseDrag(from, to, steps) {
    const count = steps || 8;
    await browser.mouseMove(from.x, from.y);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1, modifiers: 0 });
    for (let i = 1; i <= count; i++) {
      const x = from.x + (to.x - from.x) * (i / count);
      const y = from.y + (to.y - from.y) * (i / count);
      await browser.mouseMove(x, y);
      await browser.sleep(40);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.sleep(450);
  }

  async function realTouchTap(x, y) {
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 4, radiusY: 4, id: 1 }] });
    await browser.sleep(80);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await browser.sleep(250);
  }

  async function realTouchDrag(from, to, steps) {
    const count = steps || 8;
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y, radiusX: 5, radiusY: 5, id: 1 }] });
    for (let i = 1; i <= count; i++) {
      const x = from.x + (to.x - from.x) * (i / count);
      const y = from.y + (to.y - from.y) * (i / count);
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, radiusX: 5, radiusY: 5, id: 1 }] });
      await browser.sleep(45);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await browser.sleep(450);
  }

  async function dragHoleTowardObject(obj) {
    const s = await snapshot();
    const hole = s.hole || {};
    const p = await canvasPoint();
    const from = {
      x: isNum(hole.screenX) ? hole.screenX : p.x,
      y: isNum(hole.screenY) ? hole.screenY : p.y
    };
    const to = {
      x: isNum(obj && obj.screenX) ? obj.screenX : from.x + 60,
      y: isNum(obj && obj.screenY) ? obj.screenY : from.y
    };
    await realMouseDrag(from, to, 10);
  }

  async function hash() {
    return await browser.canvasPixelHash();
  }

  return {
    waitForReady,
    hasContract,
    reset,
    loadScenario,
    contractInput,
    snapshot,
    canvasPoint,
    clickStart,
    clickSemanticButton,
    holdKey,
    realMouseDrag,
    realTouchTap,
    realTouchDrag,
    dragHoleTowardObject,
    hash
  };
}

const suite = [
  {
    id: 'p0-boot-stability',
    name: 'boot stability and visible playfield',
    level: 'P0',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const s = await game.waitForReady();
      if (browser.exceptions.length) return FAIL('runtime exceptions: ' + browser.exceptions[0].description);
      const c = s.canvas || {};
      if (!isNum(c.width) || !isNum(c.height) || c.width < 200 || c.height < 200) return FAIL('main canvas/playfield is missing or too small');
      const hash = await game.hash();
      if (hash === null) return FAIL('could not read visible scene hash');
      return PASS('scene ready with canvas ' + c.width + 'x' + c.height);
    }
  },
  {
    id: 'p0-contract-schema',
    name: 'public contract schema reset/getSnapshot',
    level: 'P0',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('window.__gameTest reset/input/getSnapshot/loadScenario contract missing');
      await game.reset();
      const s = await game.snapshot();
      const required = ['phase', 'level', 'timeRemaining', 'hole', 'totalObjects', 'remaining', 'consumed', 'canvas'];
      const missing = required.filter(k => !(k in s));
      if (missing.length) return FAIL('snapshot missing fields: ' + missing.join(','));
      if (!s.hole || !isNum(s.hole.screenX) || !isNum(s.hole.screenY) || !isNum(s.hole.size)) return FAIL('hole screen position/size not observable');
      if (!isNum(s.totalObjects) || s.totalObjects < 0) return FAIL('totalObjects invalid');
      if (!s.objects || !Array.isArray(s.objects.visible)) return FAIL('snapshot missing objects.visible public target summaries');
      const badObject = s.objects.visible.find(o => !o || !isNum(o.screenX) || !isNum(o.screenY) || !isNum(o.size) || typeof o.canBeConsumed !== 'boolean');
      if (badObject) return FAIL('objects.visible entries must expose screenX/screenY/size/canBeConsumed');
      const invalid = await game.contractInput({ type: 'moveKey', key: 'sideways', durationMs: -50 });
      const after = await game.snapshot();
      if (invalid && invalid.ok === true) return FAIL('invalid action returned ok:true');
      if (totalOf(after) !== totalOf(s)) return FAIL('invalid action changed object total');
      return PASS('schema fields present and invalid action rejected/unchanged');
    }
  },
  {
    id: 'p1-start-overlay-real-click',
    name: 'real mouse click start clears blocking overlay',
    level: 'P1',
    timeoutMs: 25000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('start_menu');
      const before = await game.snapshot();
      const totalBefore = totalOf(before);
      const clicked = await game.clickStart();
      if (!clicked) return FAIL('no start/play target discovered for real click');
      const after = await game.snapshot();
      if (after.phase !== 'playing') return FAIL('phase did not enter playing after start, got ' + after.phase);
      if (after.overlayBlocking || after.canInteractWithPlayfield === false) return FAIL('overlay still blocks playfield after start');
      const hash = await game.hash();
      if (hash === null) return FAIL('no visible playfield after start');
      if (totalBefore && totalOf(after) !== totalBefore) return FAIL('start click changed object total');
      return PASS('start click opened playable scene');
    }
  },
  {
    id: 'p1-keyboard-opposite-direction',
    name: 'real keyboard left/right opposite screen direction',
    level: 'P1',
    timeoutMs: 25000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('fresh_level');
      await game.contractInput({ type: 'start' });
      let s0 = await game.snapshot();
      const hash0 = await game.hash();
      await game.holdKey('ArrowRight', 500);
      let s1 = await game.snapshot();
      await game.holdKey('ArrowLeft', 700);
      let s2 = await game.snapshot();
      const rightDelta = (s1.hole.screenX || 0) - (s0.hole.screenX || 0);
      const leftDelta = (s2.hole.screenX || 0) - (s1.hole.screenX || 0);
      if (!(rightDelta > 2)) return FAIL('ArrowRight did not move hole right on screen: delta=' + rightDelta);
      if (!(leftDelta < -2)) return FAIL('ArrowLeft did not move hole left on screen: delta=' + leftDelta);
      if (Math.sign(rightDelta) === Math.sign(leftDelta)) return FAIL('left/right deltas are not opposite');
      if (!holeInsideBounds(s2)) return FAIL('hole moved outside visible playfield bounds after keyboard input');
      const hash2 = await game.hash();
      if (hash0 === hash2) return FAIL('canvas did not visibly change after keyboard movement');
      return PASS('opposite keyboard directions verified');
    }
  },
  {
    id: 'p1-real-mouse-drag-direction',
    name: 'real mouse drag moves hole in screen direction',
    level: 'P1',
    timeoutMs: 25000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('fresh_level');
      const before = await game.snapshot();
      const p = await game.canvasPoint();
      if (!p) return FAIL('no canvas point for drag');
      const start = { x: before.hole.screenX || p.x, y: before.hole.screenY || p.y };
      const target = { x: Math.min(p.right - 20, start.x + 120), y: start.y };
      const hashBefore = await game.hash();
      await game.realMouseDrag(start, target, 10);
      const after = await game.snapshot();
      const delta = after.hole.screenX - before.hole.screenX;
      if (!(delta > 5)) return FAIL('rightward mouse drag did not move hole right, delta=' + delta);
      const hashAfter = await game.hash();
      if (hashBefore === hashAfter) return FAIL('canvas did not change after real drag');
      if (!holeInsideBounds(after)) return FAIL('hole moved outside visible playfield bounds after mouse drag');
      return PASS('real mouse drag direction verified');
    }
  },
  {
    id: 'p1-real-touch-drag-direction',
    name: 'real touch drag moves hole in screen direction',
    level: 'P1',
    timeoutMs: 25000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('fresh_level');
      const before = await game.snapshot();
      const p = await game.canvasPoint();
      if (!p) return FAIL('no canvas point for touch drag');
      const start = { x: before.hole.screenX || p.x, y: before.hole.screenY || p.y };
      const target = { x: Math.min(p.right - 20, start.x + 120), y: start.y };
      const hashBefore = await game.hash();
      await game.realTouchDrag(start, target, 10);
      const after = await game.snapshot();
      const delta = after.hole.screenX - before.hole.screenX;
      if (!(delta > 5)) return FAIL('rightward touch drag did not move hole right, delta=' + delta);
      const hashAfter = await game.hash();
      if (hashBefore === hashAfter) return FAIL('canvas did not change after real touch drag');
      if (!holeInsideBounds(after)) return FAIL('hole moved outside visible playfield bounds after touch drag');
      return PASS('real touch drag direction verified');
    }
  },
  {
    id: 'p1-consume-grow-progress',
    name: 'real drag consume small object grows hole and updates HUD',
    level: 'P1',
    timeoutMs: 30000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('small_object_near');
      const before = await game.snapshot();
      const target = before.nearestObject;
      if (!target || target.canBeConsumed === false) return FAIL('small_object_near did not expose a consumable object');
      const totalBefore = totalOf(before);
      const scoreBefore = visibleScore(before);
      const sizeBefore = before.hole.targetSize || before.hole.size;
      await game.dragHoleTowardObject(target);
      await game.contractInput({ type: 'wait', durationMs: 1200 });
      await browser.sleep(900);
      const after = await game.snapshot();
      const scoreAfter = visibleScore(after);
      const sizeAfter = after.hole.targetSize || after.hole.size;
      const totalAfter = totalOf(after);
      if (!(scoreAfter > scoreBefore)) return FAIL('consume did not increase score/consumed');
      if (!(sizeAfter > sizeBefore || after.hole.size > before.hole.size)) return FAIL('hole did not grow after consume');
      if (totalBefore !== totalAfter) return FAIL('object conservation failed totalBefore=' + totalBefore + ' totalAfter=' + totalAfter);
      if (after.progressText && !String(after.progressText).match(String(scoreAfter))) return FAIL('HUD progress does not reflect consumed count');
      return PASS('consume/grow/progress loop verified');
    }
  },
  {
    id: 'p1-first-level-clearable-real-route',
    name: 'default first level can be cleared through public target list',
    level: 'P1',
    timeoutMs: 60000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('fresh_level');
      let snap = await game.snapshot();
      if (!snap || snap.phase !== 'playing') return FAIL('fresh_level did not enter playing state');
      const total = Number(snap.totalObjects) || totalOf(snap);
      if (!(total > 0)) return FAIL('fresh_level has no objects to clear');
      const list = snap.objects && Array.isArray(snap.objects.visible) ? snap.objects.visible : null;
      if (!list) return FAIL('fresh_level missing public objects.visible target list for clearability check');

      let lastScore = visibleScore(snap);
      let progressSteps = 0;
      let routeAttempts = 0;
      let stalledAttempts = 0;
      const routeDeadline = Date.now() + 52000;
      const candidatesFor = (state) => {
        const objects = state.objects && Array.isArray(state.objects.visible) ? state.objects.visible : [];
        const h = state.hole || {};
        return objects
          .filter(o => o && o.canBeConsumed === true && o.state !== 'falling' &&
            isNum(o.screenX) && isNum(o.screenY))
          .sort((a, b) => {
            const da = Math.hypot(a.screenX - h.screenX, a.screenY - h.screenY);
            const db = Math.hypot(b.screenX - h.screenX, b.screenY - h.screenY);
            return da - db;
          });
      };
      while (routeAttempts < total + 4 && Date.now() < routeDeadline) {
        snap = await game.snapshot();
        if (snap.result === 'complete' || snap.phase === 'complete') {
          return PASS(`first level cleared in ${progressSteps} consume steps`);
        }
        if (snap.phase !== 'playing') return FAIL(`fresh level left playing state before completion: ${snap.phase}`);
        const hole = snap.hole || {};
        if (!isNum(hole.screenX) || !isNum(hole.screenY)) return FAIL('fresh_level missing public hole screen coordinates');
        const visibleObjects = snap.objects && Array.isArray(snap.objects.visible) ? snap.objects.visible : [];
        const candidates = candidatesFor(snap);
        if (!candidates.length) {
          const remaining = Number(snap.remaining) || (snap.entityCounts && Number(snap.entityCounts.visibleObjects)) || visibleObjects.length;
          if (Number(snap.falling) > 0) {
            await game.contractInput({ type: 'wait', durationMs: 1300 });
            await browser.sleep(700);
            routeAttempts += 1;
            continue;
          }
          return FAIL(`first level has no currently consumable public target before completion; remaining=${remaining}, oversized=${snap.objects && snap.objects.oversizedCount}`);
        }
        const target = candidates[0];
        let advanced = false;
        // Targets may flee while the hole approaches; reacquire the public geometry
        // for several bounded real-input chase segments before declaring a stall.
        const maxChaseSegments = 6;
        for (let attempt = 0; attempt < maxChaseSegments && Date.now() < routeDeadline; attempt++) {
          const fresh = await game.snapshot();
          if (fresh.result === 'complete' || fresh.phase === 'complete') {
            return PASS(`first level cleared in ${progressSteps} consume steps`);
          }
          const freshCandidates = candidatesFor(fresh);
          const liveTarget = freshCandidates.find(o => o.id === target.id) || freshCandidates[0];
          if (!liveTarget) break;
          const liveHole = fresh.hole || {};
          if (!isNum(liveHole.screenX) || !isNum(liveHole.screenY)) return FAIL('route snapshot missing public hole screen coordinates');
          const distance = Math.hypot(liveTarget.screenX - liveHole.screenX, liveTarget.screenY - liveHole.screenY);
          const dragSteps = Math.max(10, Math.min(36, Math.ceil(distance / 24)));
          await game.realMouseDrag(
            { x: liveHole.screenX, y: liveHole.screenY },
            { x: liveTarget.screenX, y: liveTarget.screenY },
            dragSteps
          );
          await game.contractInput({ type: 'wait', durationMs: 900 });
          await browser.sleep(400);
          const after = await game.snapshot();
          if (after.result === 'complete' || after.phase === 'complete') {
            return PASS(`first level cleared in ${progressSteps} consume steps`);
          }
          const score = visibleScore(after);
          const beforeHole = fresh.hole || {};
          const afterHole = after.hole || {};
          const grew = (isNum(beforeHole.size) && isNum(afterHole.size) && afterHole.size > beforeHole.size + 0.5) ||
            (isNum(beforeHole.targetSize) && isNum(afterHole.targetSize) && afterHole.targetSize > beforeHole.targetSize + 0.5);
          if (score > lastScore || grew) {
            if (score > lastScore) {
              progressSteps += Math.max(1, score - lastScore);
              lastScore = score;
            } else {
              progressSteps += 1;
            }
            advanced = true;
            break;
          }
        }
        routeAttempts += 1;
        if (advanced) {
          stalledAttempts = 0;
        } else {
          stalledAttempts += 1;
          if (stalledAttempts >= 3) {
            const latest = await game.snapshot();
            const stillCandidates = candidatesFor(latest);
            return FAIL(`public target did not make progress after bounded real-input retries; target=${target.id || 'unknown'}, candidates=${stillCandidates.length}, score=${lastScore}`);
          }
        }
      }
      snap = await game.snapshot();
      if (snap.result === 'complete' || snap.phase === 'complete') return PASS(`first level cleared in ${progressSteps} consume steps`);
      return FAIL(`first level did not complete after ${progressSteps} progress steps; score=${visibleScore(snap)}, total=${snap.totalObjects}`);
    }
  },
  {
    id: 'p1-complete-terminal-real-input',
    name: 'last object consume completes and terminal locks scoring',
    level: 'P1',
    timeoutMs: 30000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('one_object_left');
      const before = await game.snapshot();
      const target = before.nearestObject;
      if (!target) return FAIL('one_object_left has no target object');
      await game.dragHoleTowardObject(target);
      await game.contractInput({ type: 'wait', durationMs: 1600 });
      await browser.sleep(1000);
      const complete = await game.snapshot();
      if (complete.result !== 'complete' && complete.phase !== 'complete') return FAIL('last consume did not produce complete result');
      if (!complete.ui || complete.ui.nextAvailable !== true) return FAIL('complete result did not expose continue/next action');
      const scoreAtComplete = visibleScore(complete);
      await game.holdKey('ArrowRight', 500);
      await game.contractInput({ type: 'wait', durationMs: 500 });
      const afterMove = await game.snapshot();
      if (visibleScore(afterMove) !== scoreAtComplete) return FAIL('terminal state allowed extra scoring');
      return PASS('completion and terminal lock verified');
    }
  },
  {
    id: 'p2-large-object-rejection-invariant',
    name: 'large object illegal consume rejected and total unchanged',
    level: 'P2',
    timeoutMs: 25000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('large_object_near');
      const before = await game.snapshot();
      const target = before.largeObject || (before.nearestObject && before.nearestObject.canBeConsumed === false ? before.nearestObject : null);
      if (!target) return FAIL('large_object_near did not expose an oversized unconsumable target');
      const totalBefore = totalOf(before);
      const scoreBefore = visibleScore(before);
      await game.dragHoleTowardObject(target);
      await game.contractInput({ type: 'wait', durationMs: 700 });
      await browser.sleep(700);
      const after = await game.snapshot();
      const totalAfter = totalOf(after);
      if (visibleScore(after) !== scoreBefore) return FAIL('oversized object was illegally consumed');
      if (totalBefore !== totalAfter) return FAIL('totalBefore/totalAfter changed on rejected consume');
      if (target.id && after.largeObject && after.largeObject.id === target.id && after.largeObject.state === 'consumed') return FAIL('large object state became consumed');
      return PASS('illegal oversized consume rejected with conservation');
    }
  },
  {
    id: 'p1-timeout-retry',
    name: 'timeout fails then real retry restarts same level',
    level: 'P1',
    timeoutMs: 30000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('near_timeout');
      await game.contractInput({ type: 'start' });
      const before = await game.snapshot();
      await game.contractInput({ type: 'wait', durationMs: 2500 });
      await browser.sleep(2200);
      const failed = await game.snapshot();
      if (failed.result !== 'failed' && failed.phase !== 'failed') return FAIL('near_timeout did not reach failed state');
      const clicked = await game.clickSemanticButton('retry');
      if (!clicked) return FAIL('no visible retry control discovered after timeout');
      await browser.sleep(500);
      const after = await game.snapshot();
      if (after.phase !== 'playing') return FAIL('retry did not return to playing');
      if (after.level !== before.level) return FAIL('retry changed level from ' + before.level + ' to ' + after.level);
      if (visibleScore(after) !== 0 && after.remaining >= 0) return FAIL('retry did not reset consumed progress');
      return PASS('timeout and retry verified');
    }
  },
  {
    id: 'p1-next-level-progression',
    name: 'real continue click advances to next level',
    level: 'P1',
    timeoutMs: 25000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('completed_waiting_continue');
      const before = await game.snapshot();
      const clicked = await game.clickSemanticButton('continue', 0);
      if (!clicked) return FAIL('no visible continue/next control discovered from completed state');
      const after = await game.snapshot();
      if (!(after.level > before.level)) return FAIL('continue did not increase level');
      if (after.phase !== 'playing') return FAIL('continue did not return to playing');
      if (visibleScore(after) !== 0) return FAIL('new level did not reset progress');
      return PASS('next level progression verified');
    }
  },
  {
    id: 'p2-audio-toggle-unchanged',
    name: 'real audio toggle changes audio while score and total unchanged',
    level: 'P2',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('fresh_level');
      await game.contractInput({ type: 'start' });
      const before = await game.snapshot();
      const totalBefore = totalOf(before);
      const scoreBefore = visibleScore(before);
      const clicked = await game.clickSemanticButton('music');
      if (!clicked) await game.contractInput({ type: 'toggleAudio', channel: 'music' });
      await browser.sleep(400);
      const after = await game.snapshot();
      const changed = before.audio && after.audio &&
        (before.audio.musicEnabled !== after.audio.musicEnabled || before.audio.soundEnabled !== after.audio.soundEnabled);
      if (!changed) return FAIL('audio toggle did not change audio snapshot state');
      if (visibleScore(after) !== scoreBefore) return FAIL('audio toggle changed score unexpectedly');
      if (totalOf(after) !== totalBefore) return FAIL('audio toggle changed object total');
      return PASS('audio toggle state changed with gameplay unchanged');
    }
  },
  {
    id: 'p2-world-motion-or-edit-depth',
    name: 'world reaction or edit depth observable',
    level: 'P2',
    timeoutMs: 25000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.loadScenario('small_object_near');
      await game.contractInput({ type: 'start' });
      const before = await game.snapshot();
      await game.contractInput({ type: 'wait', durationMs: 1000 });
      await browser.sleep(900);
      const afterWait = await game.snapshot();
      if (isNum(before.worldMotionRevision) && isNum(afterWait.worldMotionRevision) && afterWait.worldMotionRevision > before.worldMotionRevision) {
        return PASS('world motion revision increased');
      }
      const clicked = await game.clickSemanticButton('edit');
      if (!clicked) {
        const r = await game.contractInput({ type: 'openEdit' });
        if (r && r.ok === false) return NA('edit mode not implemented and worldMotionRevision unavailable');
      }
      await browser.sleep(500);
      const afterEdit = await game.snapshot();
      if (afterEdit.activePanel === 'edit' || afterEdit.phase === 'edit' || (afterEdit.ui && afterEdit.ui.editAvailable === true)) {
        return PASS('edit/depth panel observable');
      }
      return FAIL('no object reaction revision and no edit depth observable');
    }
  }
];

module.exports = { suite };
