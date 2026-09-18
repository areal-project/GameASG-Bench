// Frosting Frenzy L2 runtime checks.
//
// === GDD Coverage Map ===
// M1 -> p0-boot-contract-schema, p0-playfield-and-tools, p1-ui-flow-not-blocked, p2-visible-feedback-canvas-hud
// M2 -> p0-playfield-and-tools, p1-visible-order-tool-mapping, p1-real-current-order-completion, p1-core-loop-contract-scoring
// M3 -> p1-real-click-frosting-apply, p1-visible-order-tool-mapping, p1-real-current-order-completion
// M4 -> p1-real-drag-decoration-place, p1-real-touch-drag-decoration-place
// M5 -> p1-real-drag-screen-space-left-right, p1-real-touch-drag-decoration-place, p1-invalid-outside-drop-rejected
// M6 -> p1-undo-clear-invariant, p2-real-keyboard-shortcuts
// M7 -> p1-core-loop-contract-scoring, p1-timeout-auto-result, p1-result-lock-and-next-round
// M8 -> p1-core-loop-contract-scoring, p1-timeout-auto-result, p2-scoring-monotonic-contract
// M9 -> p2-real-keyboard-shortcuts
// M10 -> p2-config-contract
//
// === Category Map ===
// Boot & Stability: p0-boot-contract-schema, p0-playfield-and-tools
// UI Flow & Blocking: p1-ui-flow-not-blocked, p1-visible-order-tool-mapping
// Input Semantics: p1-real-click-frosting-apply, p1-real-drag-decoration-place, p1-real-touch-drag-decoration-place, p1-real-drag-screen-space-left-right
// Core Mechanic Loop: p1-real-current-order-completion, p1-core-loop-contract-scoring, p1-timeout-auto-result, p1-result-lock-and-next-round
// State Machine: p1-timeout-auto-result, p1-result-lock-and-next-round, p2-real-keyboard-shortcuts
// Economy/Progression: p2-scoring-monotonic-contract
// Feedback & Observability: p2-visible-feedback-canvas-hud
// Invariants & Rejection: p1-invalid-outside-drop-rejected, p1-undo-clear-invariant
// Depth/Optional Systems: p2-config-contract
//
// === Rationality Map ===
// p1-ui-flow-not-blocked: real action: reset plus click on playfield; independent observation: phase/ui bounds/canInteract; empty-shell failure: overlay-blocked playfield or no semantic bounds fails.
// p1-real-click-frosting-apply: real action: browser mouseClick on frosting target and cake; independent observation: selectedFrosting/cake.frosting plus canvas hash; empty-shell failure: inert tools or API-only color state fails.
// p1-visible-order-tool-mapping: real observation: prompt-derived requirements are matched to hit-tested visible controls; independent observation: elementFromPoint/labels/tools; empty-shell failure: hidden semantic targets or unmapped order requirements fail.
// p1-real-drag-decoration-place: real action: real mouse drag from decoration tool to cake center; independent observation: decorationCount/type/screen position plus canvas hash; empty-shell failure: preview-only drag or no placement fails.
// p1-real-touch-drag-decoration-place: real action: CDP touchStart/touchMove/touchEnd from decoration tool to cake center; independent observation: decorationCount/screen position plus canvas hash; empty-shell failure: mouse-only implementations fail.
// p1-real-drag-screen-space-left-right: real action: two real drags to opposite left/right cake points; independent observation: decorations screenX order and separated positions; empty-shell failure: fixed, mirrored, or ignored release positions fail.
// p1-invalid-outside-drop-rejected: real action: drag to outsideCake plus invalid contract action; independent observation: count and totalScore unchanged with rejection; empty-shell failure: accepting outside drops or unknown actions fails.
// p1-undo-clear-invariant: real action: contract setup then visible undo/clear controls; independent observation: decoration count/frosting/score; empty-shell failure: missing/inert controls or clear total score fail.
// p1-real-current-order-completion: real action: reads current prompt, clicks matching frosting, drags each required matching decoration count, and clicks done; independent observation: met/total requirements, stars, result UI, score delta; empty-shell failure: first-tool demos or unfinishable visible orders fail.
// p1-core-loop-contract-scoring: contract action sequence from legal near-complete setup plus real done control; independent observation: result phase, resultVisible, stars, score delta; empty-shell failure: ok:true only, no scoring, or no result layer fails.
// p1-timeout-auto-result: real action: passive wait from near-timeout scenario; independent observation: result phase, time floor, score single-settlement; empty-shell failure: timer does not end round or repeatedly scores fails.
// p1-result-lock-and-next-round: contract setup to result then edit attempt and real nextRound control; independent observation: terminal unchanged, round increment, cake reset, score preserved; empty-shell failure: terminal state still editable or next round resets score fails.
// p2-visible-feedback-canvas-hud: real action: click/drag/done; independent observation: canvasPixelHash and prompt/timer/result fields; empty-shell failure: pure state API with unchanged visible surface fails.
// p2-real-keyboard-shortcuts: real action: keyDown/keyUp for KeyZ, KeyC, Enter; independent observation: counts, frosting, phase/result; empty-shell failure: keyboard ignored or active after result fails.
// p2-scoring-monotonic-contract: contract actions from low/high completion setups; independent observation: stars and score relation; empty-shell failure: random/non-monotonic stars or score mismatch fails.
// p2-config-contract: contract action opens/closes config or config scenario; independent observation: screen/tools/timeLimit; empty-shell failure: config facade that cannot affect observable tools or close fails.

function PASS(detail) {
  return { status: 'PASS', detail: detail || '' };
}

function FAIL(detail) {
  return { status: 'FAIL', detail: detail || '' };
}

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function arr(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeSnapshot(value) {
  if (!value) return value;
  if (value.snapshot && typeof value.snapshot === 'object') return value.snapshot;
  return value;
}

function cakeCount(s) {
  return Number(s && s.cake && s.cake.decorationCount) || 0;
}

function totalScore(s) {
  return Number(s && s.totalScore) || 0;
}

function lastStars(s) {
  return s && s.lastRound && typeof s.lastRound.stars === 'number' ? s.lastRound.stars : null;
}

function near(a, b, tolerance) {
  return Math.abs(a - b) <= tolerance;
}

function targetBy(list, key, value) {
  return arr(list).find(item => item && item[key] === value && isNum(item.centerX) && isNum(item.centerY)) || null;
}

async function realDrag(browser, from, to) {
  await browser.mouseMove(from.x, from.y);
  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: from.x,
    y: from.y,
    button: 'left',
    clickCount: 1,
    modifiers: 0
  });
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y,
      button: 'left',
      buttons: 1,
      modifiers: 0
    });
    await browser.sleep(25);
  }
  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: to.x,
    y: to.y,
    button: 'left',
    clickCount: 1,
    modifiers: 0
  });
}

async function realTouchDrag(browser, from, to) {
  const point = (p) => ({ x: p.x, y: p.y, radiusX: 4, radiusY: 4, id: 1 });
  await browser.cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point(from)]
  });
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [point({ x, y })]
    });
    await browser.sleep(30);
  }
  await browser.cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  });
}

function createGameDriver(browser) {
  async function evalApi(expr) {
    const result = await browser.eval(`(async function() {
      const api = window.__gameTest;
      if (!api) return { __missing: true };
      try {
        return await (${expr});
      } catch (e) {
        return { __l2_err__: e && e.message ? e.message : String(e) };
      }
    })()`);
    return result;
  }

  async function snapshot() {
    const result = await evalApi('api.getSnapshot()');
    return normalizeSnapshot(result);
  }

  async function reset(options) {
    const json = JSON.stringify(options || {});
    const result = await evalApi(`api.reset(${json})`);
    await browser.sleep(120);
    return normalizeSnapshot(result);
  }

  async function loadScenario(name, options) {
    const result = await evalApi(`api.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})})`);
    await browser.sleep(120);
    return normalizeSnapshot(result);
  }

  async function contractInput(action) {
    const result = await evalApi(`api.input(${JSON.stringify(action)})`);
    await browser.sleep(120);
    return normalizeSnapshot(result);
  }

  function uiPoint(s, key, index) {
    const list = arr(s && s.ui && s.ui[key]);
    const item = list[index || 0];
    if (!item || !isNum(item.centerX) || !isNum(item.centerY)) return null;
    return { x: item.centerX, y: item.centerY, item };
  }

  function uiPointBy(s, listKey, itemKey, value) {
    const item = targetBy(s && s.ui && s.ui[listKey], itemKey, value);
    if (!item) return null;
    return { x: item.centerX, y: item.centerY, item };
  }

  async function cakeBoundsInViewport(browser, s) {
    const raw = s && s.ui && s.ui.cakeBounds;
    if (!raw || !isNum(raw.left) || !isNum(raw.top) || !isNum(raw.width) || !isNum(raw.height)) return null;

    let left = raw.left;
    let top = raw.top;
    const playfield = s && s.ui && s.ui.playfieldBounds;
    if (playfield && isNum(playfield.left) && isNum(playfield.top) &&
        isNum(playfield.width) && isNum(playfield.height)) {
      const fitsPlayfield = (x, y) =>
        x >= playfield.left - 1 && y >= playfield.top - 1 &&
        x + raw.width <= playfield.left + playfield.width + 1 &&
        y + raw.height <= playfield.top + playfield.height + 1;
      if (!fitsPlayfield(left, top) && fitsPlayfield(playfield.left + raw.left, playfield.top + raw.top)) {
        left += playfield.left;
        top += playfield.top;
      }
    }

    const fallback = { left, top, width: raw.width, height: raw.height };
    try {
      const live = await browser.eval(`(function() {
        const expected = ${JSON.stringify({ width: raw.width, height: raw.height })};
        const candidates = Array.from(document.querySelectorAll('*')).map(function(el) {
          const name = [
            el.id || '',
            typeof el.className === 'string' ? el.className : '',
            el.getAttribute('aria-label') || ''
          ].join(' ');
          if (!/cake/i.test(name)) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (r.width <= 8 || r.height <= 8 || cs.display === 'none' || cs.visibility === 'hidden') return null;
          return { left: r.left, top: r.top, width: r.width, height: r.height };
        }).filter(Boolean);
        const matching = candidates.filter(function(r) {
          return Math.abs(r.width - expected.width) <= 2 &&
            Math.abs(r.height - expected.height) <= 2;
        });
        return (matching.length ? matching : candidates)
          .sort(function(a, b) { return (b.width * b.height) - (a.width * a.height); })[0] || null;
      })()`);
      if (live && isNum(live.left) && isNum(live.top) &&
          isNum(live.width) && isNum(live.height)) {
        return live;
      }
    } catch (_) {
      // Keep the live snapshot geometry when no identifiable cake element exists.
    }
    return fallback;
  }

  async function cakePoint(browser, s, where) {
    const b = await cakeBoundsInViewport(browser, s);
    if (!b || !isNum(b.left) || !isNum(b.top) || !isNum(b.width) || !isNum(b.height)) return null;
    const clampY = b.top + b.height * 0.5;
    if (where === 'left') return { x: b.left + b.width * 0.28, y: clampY };
    if (where === 'right') return { x: b.left + b.width * 0.72, y: clampY };
    if (where === 'outside') return { x: Math.max(5, b.left - Math.max(60, b.width * 0.25)), y: clampY };
    return { x: b.left + b.width * 0.5, y: clampY };
  }

  function controlPoint(s, actionName) {
    const list = arr(s && s.ui && s.ui.controlTargets);
    const item = list.find(c => c && c.action === actionName && c.visible !== false && c.enabled !== false);
    if (!item || !isNum(item.centerX) || !isNum(item.centerY)) return null;
    return { x: item.centerX, y: item.centerY, item };
  }

  async function discoverVisibleControl(actionName) {
    const patterns = {
      undo: '\\b(undo|back|remove last|撤销|↶|↺)\\b',
      clear: '\\b(clear|reset cake|remove all|清空|✕|×)\\b',
      done: '\\b(done|finish|complete|submit|check|完成|✓)\\b',
      nextRound: '\\b(next|continue|next round|again|下一|继续)\\b'
    };
    return await browser.eval(`(function() {
      const actionName = ${JSON.stringify(actionName)};
      const pattern = new RegExp(${JSON.stringify(patterns[actionName] || '')}, 'i');
      function visible(el) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none';
      }
      const nodes = Array.from(document.querySelectorAll('button, [role="button"], [data-game-control], [aria-label], input[type="button"], input[type="submit"], a'));
      const exact = nodes.find(function(el) {
        const ctl = (el.getAttribute('data-game-control') || '').toLowerCase();
        if (!visible(el)) return false;
        if (actionName === 'nextRound') return ctl === 'nextround' || ctl === 'next-round' || ctl === 'next';
        return ctl === actionName.toLowerCase();
      });
      const found = exact || nodes.find(function(el) {
        if (!visible(el)) return false;
        const label = [
          el.textContent || '',
          el.value || '',
          el.title || '',
          el.getAttribute('aria-label') || '',
          el.getAttribute('data-game-control') || ''
        ].join(' ');
        return pattern.test(label);
      });
      if (!found) return null;
      const initialRect = found.getBoundingClientRect();
      if (initialRect.top < 0 || initialRect.bottom > window.innerHeight ||
          initialRect.left < 0 || initialRect.right > window.innerWidth) {
        found.scrollIntoView({ block: 'center', inline: 'center' });
      }
      const r = found.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
  }

  async function clickFrosting(index) {
    const s = await snapshot();
    const p = uiPoint(s, 'frostingTargets', index || 0);
    if (!p) throw new Error('missing frosting target coordinates');
    await browser.mouseClick(p.x, p.y);
    await browser.sleep(150);
    return { point: p, snapshot: await snapshot() };
  }

  async function clickFrostingColor(color) {
    const s = await snapshot();
    const p = uiPointBy(s, 'frostingTargets', 'color', color);
    if (!p) throw new Error(`missing visible frosting target for ${color}`);
    await browser.mouseClick(p.x, p.y);
    await browser.sleep(150);
    return { point: p, snapshot: await snapshot() };
  }

  async function clickCake(where) {
    const s = await snapshot();
    const p = await cakePoint(browser, s, where || 'center');
    if (!p) throw new Error('missing cake bounds');
    await browser.mouseClick(p.x, p.y);
    await browser.sleep(180);
    return { point: p, snapshot: await snapshot() };
  }

  async function dragDecoration(where, index) {
    const s = await snapshot();
    const from = uiPoint(s, 'decorationTargets', index || 0);
    const to = await cakePoint(browser, s, where || 'center');
    if (!from) throw new Error('missing decoration target coordinates');
    if (!to) throw new Error('missing cake bounds');
    await realDrag(browser, from, to);
    await browser.sleep(220);
    return { from, to, snapshot: await snapshot() };
  }

  async function dragDecorationType(type, where, offsetIndex) {
    const s = await snapshot();
    const from = uiPointBy(s, 'decorationTargets', 'type', type);
    let to = await cakePoint(browser, s, where || 'center');
    if (!from) throw new Error(`missing visible decoration target for ${type}`);
    if (!to) throw new Error('missing cake bounds');
    if (Number.isFinite(offsetIndex) && s.ui && s.ui.cakeBounds) {
      const b = s.ui.cakeBounds;
      const spread = Math.min(b.width, b.height) * 0.12;
      const phase = offsetIndex % 6;
      to = {
        x: to.x + (phase - 2.5) * spread * 0.42,
        y: to.y + ((Math.floor(offsetIndex / 2) % 3) - 1) * spread * 0.34
      };
    }
    await realDrag(browser, from, to);
    await browser.sleep(220);
    return { from, to, snapshot: await snapshot() };
  }

  async function hitTestPoint(point) {
    return await browser.eval(`(function() {
      const x = ${JSON.stringify(point && point.x)};
      const y = ${JSON.stringify(point && point.y)};
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      function visible(node) {
        const r = node.getBoundingClientRect();
        const cs = getComputedStyle(node);
        return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none';
      }
      let node = el;
      while (node && node !== document.body && !/^(BUTTON|A)$/i.test(node.tagName) && node.getAttribute('role') !== 'button') {
        node = node.parentElement;
      }
      const target = node || el;
      const r = target.getBoundingClientRect();
      return {
        tag: target.tagName,
        text: (target.textContent || target.getAttribute('aria-label') || target.getAttribute('title') || '').trim(),
        dataColor: target.getAttribute('data-color'),
        dataType: target.getAttribute('data-type'),
        disabled: !!target.disabled,
        visible: visible(target),
        width: Math.round(r.width),
        height: Math.round(r.height)
      };
    })()`);
  }

  async function touchDragDecoration(where, index) {
    const s = await snapshot();
    const from = uiPoint(s, 'decorationTargets', index || 0);
    const to = await cakePoint(browser, s, where || 'center');
    if (!from) throw new Error('missing decoration target coordinates');
    if (!to) throw new Error('missing cake bounds');
    await realTouchDrag(browser, from, to);
    await browser.sleep(260);
    return { from, to, snapshot: await snapshot() };
  }

  async function clickButton(actionName) {
    const s = await snapshot();
    let point = await discoverVisibleControl(actionName);
    if (!point) point = controlPoint(s, actionName);
    if (!point || !isNum(point.x) || !isNum(point.y)) {
      throw new Error(`missing visible ${actionName} control`);
    }
    await browser.mouseClick(point.x, point.y);
    await browser.sleep(180);
    return snapshot();
  }

  return {
    snapshot,
    reset,
    loadScenario,
    contractInput,
    clickFrosting,
    clickCake,
    dragDecoration,
    dragDecorationType,
    touchDragDecoration,
    clickButton,
    clickFrostingColor,
    hitTestPoint,
    canvasHash: () => browser.canvasPixelHash()
  };
}

function validateBaseSnapshot(s) {
  if (!s || s.__missing) return 'window.__gameTest is missing';
  if (s.__l2_err__) return s.__l2_err__;
  if (!['playing', 'evaluating', 'result', 'config'].includes(s.phase)) return 'invalid phase';
  if (!s.tools || arr(s.tools.frostingColors).length < 1) return 'no frosting tools';
  if (!s.tools || arr(s.tools.decorationTypes).length < 1) return 'no decoration tools';
  if (!s.ui || !s.ui.cakeBounds || !isNum(s.ui.cakeBounds.width) || s.ui.cakeBounds.width <= 20) return 'invalid cake bounds';
  return null;
}

const suite = [
  {
    id: 'p0-boot-contract-schema',
    name: 'Boot exposes contract schema without fatal errors',
    level: 'P0',
    timeoutMs: 12000,
    async run({ browser }) {
      if (browser.exceptions.length) {
        return FAIL('runtime exceptions: ' + browser.exceptions.slice(0, 2).map(e => e.description || e.text).join(' | '));
      }
      const game = createGameDriver(browser);
      const s = await game.reset({ prompt: 'any' });
      const err = validateBaseSnapshot(s);
      if (err) return FAIL(err);
      if (!s.prompt || typeof s.prompt !== 'object') return FAIL('missing prompt snapshot');
      return PASS(`phase=${s.phase}, frostings=${arr(s.tools.frostingColors).length}, decorations=${arr(s.tools.decorationTypes).length}`);
    }
  },
  {
    id: 'p0-playfield-and-tools',
    name: 'Playfield geometry and tool targets are visible',
    level: 'P0',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.reset({ prompt: 'any' });
      const canvas = await browser.getCanvasSize();
      const bounds = s && s.ui && s.ui.playfieldBounds;
      const hasSurface = (canvas && canvas.cssW > 100 && canvas.cssH > 100) ||
        (bounds && bounds.width > 100 && bounds.height > 100);
      if (!hasSurface) return FAIL('no visible playfield surface');
      if (arr(s.ui && s.ui.frostingTargets).length < 1) return FAIL('no semantic frosting target');
      if (arr(s.ui && s.ui.decorationTargets).length < 1) return FAIL('no semantic decoration target');
      if (s.ui.overlayBlocking || !s.ui.canInteractWithPlayfield) return FAIL('playfield blocked at boot');
      return PASS(`surface=${canvas ? `${canvas.cssW}x${canvas.cssH}` : `${bounds.width}x${bounds.height}`}`);
    }
  },
  {
    id: 'p1-ui-flow-not-blocked',
    name: 'Real click path can reach an unblocked playfield',
    level: 'P1',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset({ prompt: 'any' });
      const before = await game.snapshot();
      if (before.phase !== 'playing') return FAIL('not in playing phase');
      if (before.ui.overlayBlocking || !before.ui.canInteractWithPlayfield) return FAIL('overlayBlocking prevents play');
      const click = await game.clickCake('center');
      const after = click.snapshot;
      if (after.phase !== 'playing') return FAIL('playfield click unexpectedly left playing phase');
      if (after.ui.overlayBlocking || !after.ui.canInteractWithPlayfield) return FAIL('playfield became blocked after real click');
      return PASS(`clicked cake at ${Math.round(click.point.x)},${Math.round(click.point.y)}`);
    }
  },
  {
    id: 'p1-real-click-frosting-apply',
    name: 'Real mouse click applies selected frosting to cake',
    level: 'P1',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.loadScenario('basic_playing');
      const hashBefore = await game.canvasHash();
      const select = await game.clickFrosting(0);
      const selected = select.snapshot.selectedFrosting;
      if (!selected) return FAIL('real frosting click did not select a frosting');
      const afterClick = await game.clickCake('center');
      const after = afterClick.snapshot;
      const hashAfter = await game.canvasHash();
      if (after.cake.frosting !== selected) {
        return FAIL(`cake frosting did not match selection: selected=${selected}, cake=${after.cake.frosting}`);
      }
      if (hashBefore === hashAfter && !after.cake.frosting) return FAIL('no visible or state change after applying frosting');
      return PASS(`selected=${selected}, score=${totalScore(after)}, canvasChanged=${hashBefore !== hashAfter}`);
    }
  },
  {
    id: 'p1-visible-order-tool-mapping',
    name: 'Current visible order maps to hit-tested visible tools',
    level: 'P1',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.reset({ prompt: 'any' });
      const prompt = s.prompt || {};
      if (!prompt.frosting) return FAIL('current prompt lacks frosting requirement');
      const frosting = targetBy(s.ui && s.ui.frostingTargets, 'color', prompt.frosting);
      if (!frosting) return FAIL(`no visible frosting target for prompt frosting ${prompt.frosting}`);
      const frostingHit = await game.hitTestPoint({ x: frosting.centerX, y: frosting.centerY });
      if (!frostingHit || !frostingHit.visible || frostingHit.disabled) {
        return FAIL(`frosting target is not hit-testable: ${JSON.stringify(frostingHit)}`);
      }
      if (frostingHit.dataColor && frostingHit.dataColor !== prompt.frosting) {
        return FAIL(`frosting hit target mismatch: prompt=${prompt.frosting}, hit=${frostingHit.dataColor}`);
      }
      if (!String(frostingHit.text || '').trim()) return FAIL('frosting target has no readable label/text');

      const required = arr(prompt.decorations);
      for (const req of required) {
        if (!req || !req.type || !(Number(req.minCount) > 0)) {
          return FAIL(`invalid decoration requirement: ${JSON.stringify(req)}`);
        }
        const target = targetBy(s.ui && s.ui.decorationTargets, 'type', req.type);
        if (!target) return FAIL(`no visible decoration target for prompt decoration ${req.type}`);
        const hit = await game.hitTestPoint({ x: target.centerX, y: target.centerY });
        if (!hit || !hit.visible || hit.disabled) {
          return FAIL(`decoration target ${req.type} is not hit-testable: ${JSON.stringify(hit)}`);
        }
        if (hit.dataType && hit.dataType !== req.type) {
          return FAIL(`decoration hit target mismatch: prompt=${req.type}, hit=${hit.dataType}`);
        }
        if (!String(hit.text || '').trim()) return FAIL(`decoration target ${req.type} has no readable label/text`);
      }
      return PASS(`mapped frosting=${prompt.frosting}, decorations=${required.map(r => `${r.type}x${r.minCount}`).join(',')}`);
    }
  },
  {
    id: 'p1-real-current-order-completion',
    name: 'Real mouse path can complete the current prompt-derived order',
    level: 'P1',
    timeoutMs: 32000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.reset({ prompt: 'any' });
      const prompt = start.prompt || {};
      if (!prompt.frosting) return FAIL('current prompt lacks frosting requirement');
      const scoreBefore = totalScore(start);
      const hashBefore = await game.canvasHash();

      const selected = await game.clickFrostingColor(prompt.frosting);
      if (selected.snapshot.selectedFrosting !== prompt.frosting) {
        return FAIL(`real click did not select prompt frosting: expected=${prompt.frosting}, got=${selected.snapshot.selectedFrosting}`);
      }
      const frosted = await game.clickCake('center');
      if (frosted.snapshot.cake.frosting !== prompt.frosting) {
        return FAIL(`real cake click did not apply prompt frosting: expected=${prompt.frosting}, got=${frosted.snapshot.cake.frosting}`);
      }

      let dragIndex = 0;
      for (const req of arr(prompt.decorations)) {
        const needed = Math.max(0, Math.ceil(Number(req.minCount) || 0));
        for (let i = 0; i < needed; i++) {
          const placed = await game.dragDecorationType(req.type, 'center', dragIndex);
          const counts = placed.snapshot.cake && placed.snapshot.cake.decorationCounts || {};
          if ((Number(counts[req.type]) || 0) < i + 1) {
            return FAIL(`real drag did not increase required ${req.type} count to ${i + 1}`);
          }
          dragIndex += 1;
        }
      }

      const beforeDone = await game.snapshot();
      const hashBeforeDone = await game.canvasHash();
      const afterDone = await game.clickButton('done');
      const hashAfter = await game.canvasHash();
      if (afterDone.phase !== 'result') return FAIL(`done did not enter result phase after full real order: ${afterDone.phase}`);
      if (!afterDone.ui || !afterDone.ui.resultVisible) return FAIL('result screen not visible after full real order');
      const totalReq = Number(afterDone.lastRound && afterDone.lastRound.totalRequirements) || 0;
      const metReq = Number(afterDone.lastRound && afterDone.lastRound.metRequirements) || 0;
      const stars = lastStars(afterDone);
      if (totalReq <= 0 || metReq < totalReq) {
        return FAIL(`full real order did not satisfy all requirements: met=${metReq}, total=${totalReq}`);
      }
      if (!isNum(stars) || stars < 2 || stars > 3) return FAIL(`unexpected stars after full real order: ${stars}`);
      if (totalScore(afterDone) !== totalScore(beforeDone) + stars) {
        return FAIL(`score delta mismatch after full real order: before=${totalScore(beforeDone)}, stars=${stars}, after=${totalScore(afterDone)}`);
      }
      const visualChanged = hashBefore !== hashBeforeDone || hashBeforeDone !== hashAfter;
      if (!visualChanged) return FAIL('full real order produced no visible playfield/result change');
      return PASS(`completed prompt=${prompt.id || 'current'}, met=${metReq}/${totalReq}, stars=${stars}, score ${scoreBefore}->${totalScore(afterDone)}`);
    }
  },
  {
    id: 'p1-real-drag-decoration-place',
    name: 'Real mouse drag places decoration near release point',
    level: 'P1',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.loadScenario('basic_playing');
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      const placed = await game.dragDecoration('center', 0);
      const after = placed.snapshot;
      const hashAfter = await game.canvasHash();
      const beforeCount = cakeCount(before);
      const afterCount = cakeCount(after);
      if (afterCount !== beforeCount + 1) return FAIL(`decorationCount did not increase by 1: ${beforeCount} -> ${afterCount}`);
      const last = arr(after.cake && after.cake.decorations).slice(-1)[0];
      if (!last || !isNum(last.screenX) || !isNum(last.screenY)) return FAIL('new decoration lacks screen position');
      const tolerance = Math.max(40, (after.ui.cakeBounds.width || 200) * 0.2);
      if (!near(last.screenX, placed.to.x, tolerance) || !near(last.screenY, placed.to.y, tolerance)) {
        return FAIL(`decoration not near release point: got ${Math.round(last.screenX)},${Math.round(last.screenY)}`);
      }
      if (hashBefore === hashAfter && afterCount === beforeCount) return FAIL('canvas and state unchanged after real drag');
      return PASS(`count ${beforeCount}->${afterCount}, score=${totalScore(after)}, canvasChanged=${hashBefore !== hashAfter}`);
    }
  },
  {
    id: 'p1-real-touch-drag-decoration-place',
    name: 'Real touch drag places decoration near release point',
    level: 'P1',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      // touchDragDecoration dispatches real Input.dispatchTouchEvent events.
      await game.loadScenario('basic_playing');
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      const placed = await game.touchDragDecoration('center', 0);
      const after = placed.snapshot;
      const hashAfter = await game.canvasHash();
      const beforeCount = cakeCount(before);
      const afterCount = cakeCount(after);
      if (afterCount !== beforeCount + 1) return FAIL(`touch decorationCount did not increase by 1: ${beforeCount} -> ${afterCount}`);
      const last = arr(after.cake && after.cake.decorations).slice(-1)[0];
      if (!last || !isNum(last.screenX) || !isNum(last.screenY)) return FAIL('touch-placed decoration lacks screen position');
      const tolerance = Math.max(45, (after.ui.cakeBounds.width || 200) * 0.22);
      if (!near(last.screenX, placed.to.x, tolerance) || !near(last.screenY, placed.to.y, tolerance)) {
        return FAIL(`touch decoration not near release point: got ${Math.round(last.screenX)},${Math.round(last.screenY)}`);
      }
      if (hashBefore === hashAfter && afterCount === beforeCount) return FAIL('canvas and state unchanged after real touch drag');
      return PASS(`touch count ${beforeCount}->${afterCount}, canvasChanged=${hashBefore !== hashAfter}`);
    }
  },
  {
    id: 'p1-real-drag-screen-space-left-right',
    name: 'Real mouse drag preserves opposite left/right screen-space placement',
    level: 'P1',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.loadScenario('basic_playing');
      const leftDrop = await game.dragDecoration('left', 0);
      const rightDrop = await game.dragDecoration('right', 0);
      const after = rightDrop.snapshot;
      const decos = arr(after.cake && after.cake.decorations);
      if (decos.length < 2) return FAIL('not enough decorations after two real drags');
      const leftPlaced = decos[decos.length - 2];
      const rightPlaced = decos[decos.length - 1];
      const delta = rightPlaced.screenX - leftPlaced.screenX;
      const releaseDelta = rightDrop.to.x - leftDrop.to.x;
      if (!(delta > 20 && releaseDelta > 20)) {
        return FAIL(`screen-space left/right order failed: placedDelta=${delta}, releaseDelta=${releaseDelta}`);
      }
      if (Math.sign(delta) !== Math.sign(releaseDelta)) {
        return FAIL('opposite horizontal drag endpoints produced mirrored screen direction');
      }
      return PASS(`opposite drag direction preserved; delta=${Math.round(delta)}`);
    }
  },
  {
    id: 'p1-invalid-outside-drop-rejected',
    name: 'Invalid outside drop and unknown action are rejected unchanged',
    level: 'P1',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.loadScenario('basic_playing');
      const before = await game.snapshot();
      const totalBefore = totalScore(before);
      const countBefore = cakeCount(before);
      const outside = await game.dragDecoration('outside', 0);
      const afterOutside = outside.snapshot;
      if (cakeCount(afterOutside) !== countBefore) {
        return FAIL(`outside drop changed decoration count: ${countBefore} -> ${cakeCount(afterOutside)}`);
      }
      if (totalScore(afterOutside) !== totalBefore) {
        return FAIL(`outside drop changed totalScore: ${totalBefore} -> ${totalScore(afterOutside)}`);
      }
      const invalid = await game.contractInput({ type: 'invalidAction', nonsense: true });
      const invalidSnap = normalizeSnapshot(invalid.snapshot ? invalid.snapshot : invalid);
      const unchanged = cakeCount(invalidSnap) === countBefore && totalScore(invalidSnap) === totalBefore;
      if (invalid && invalid.ok === true && !invalid.reason && !unchanged) {
        return FAIL('unknown action was accepted and changed state');
      }
      if (!unchanged) return FAIL('unknown action did not preserve count/score');
      return PASS(`reject/unchanged count=${countBefore}, totalBefore=${totalBefore}, totalAfter=${totalScore(invalidSnap)}`);
    }
  },
  {
    id: 'p1-undo-clear-invariant',
    name: 'Undo and clear preserve score while changing cake state',
    level: 'P1',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const loaded = await game.loadScenario('partially_decorated');
      const before = await game.snapshot();
      if (cakeCount(before) < 1) return FAIL(`scenario did not provide a decoration: ${cakeCount(before)}`);
      const totalBefore = totalScore(before);
      const afterUndo = await game.clickButton('undo');
      if (cakeCount(afterUndo) !== cakeCount(before) - 1) {
        return FAIL(`undo did not remove one decoration: ${cakeCount(before)} -> ${cakeCount(afterUndo)}`);
      }
      const afterClear = await game.clickButton('clear');
      if (cakeCount(afterClear) !== 0) return FAIL('clear did not remove all decorations');
      if (afterClear.cake.frosting !== null) return FAIL('clear did not remove cake frosting');
      const unchanged = totalScore(afterClear) === totalBefore && afterClear.round === before.round &&
        afterClear.prompt && before.prompt && afterClear.prompt.id === before.prompt.id;
      if (!unchanged) return FAIL('clear/undo changed score, round, or prompt invariant');
      return PASS(`count ${cakeCount(loaded)}->${cakeCount(afterUndo)}->0, totalBefore=${totalBefore}, totalAfter=${totalScore(afterClear)}`);
    }
  },
  {
    id: 'p1-core-loop-contract-scoring',
    name: 'Core loop contract scores a completed target and shows result',
    level: 'P1',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadScenario('target_one_step');
      if (start.phase !== 'playing') return FAIL('target_one_step is not a legal playing setup');
      const prompt = start.prompt || {};
      const color = prompt.frosting || arr(start.tools && start.tools.frostingColors)[0];
      if (color) await game.contractInput({ type: 'selectFrosting', color });
      if (color) await game.contractInput({ type: 'applyFrosting', to: 'cakeCenter' });
      for (const req of arr(prompt.decorations)) {
        const n = Math.max(0, Number(req.minCount) || 0);
        for (let i = 0; i < n; i++) {
          await game.contractInput({ type: 'dragDecoration', decorationType: req.type, to: 'cakeCenter' });
        }
      }
      const beforeDone = await game.snapshot();
      const scoreBefore = totalScore(beforeDone);
      const afterDone = await game.clickButton('done');
      if (afterDone.phase !== 'result') return FAIL(`done did not enter result phase: ${afterDone.phase}`);
      if (!afterDone.ui || !afterDone.ui.resultVisible) return FAIL('result screen not observable');
      const stars = lastStars(afterDone);
      if (!isNum(stars) || stars < 0 || stars > 3) return FAIL(`invalid stars=${stars}`);
      if (totalScore(afterDone) !== scoreBefore + stars) {
        return FAIL(`score delta mismatch: before=${scoreBefore}, stars=${stars}, after=${totalScore(afterDone)}`);
      }
      const invalid = await game.contractInput({ type: 'unknownAfterDone' });
      const invalidSnap = normalizeSnapshot(invalid.snapshot ? invalid.snapshot : invalid);
      if (totalScore(invalidSnap) !== totalScore(afterDone)) return FAIL('invalid post-result action changed score');
      return PASS(`stars=${stars}, score ${scoreBefore}->${totalScore(afterDone)}`);
    }
  },
  {
    id: 'p1-timeout-auto-result',
    name: 'Near-timeout round automatically reaches result once',
    level: 'P1',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadScenario('near_timeout');
      if (start.phase !== 'playing') return FAIL('near_timeout is not a playing setup');
      const scoreBefore = totalScore(start);
      const deadline = Date.now() + 12000;
      let after = start;
      while (after.phase === 'playing' && Date.now() < deadline) {
        await browser.sleep(100);
        after = await game.snapshot();
      }
      if (after.phase !== 'result') return FAIL(`timeout did not enter result phase: ${after.phase}`);
      if (!after.ui || !after.ui.resultVisible) return FAIL('timeout result screen not observable');
      if (after.timeRemaining < 0) return FAIL(`timeRemaining below zero: ${after.timeRemaining}`);
      const stars = lastStars(after);
      if (!isNum(stars) || stars < 0 || stars > 3) return FAIL(`invalid timeout stars=${stars}`);
      if (totalScore(after) !== scoreBefore + stars) {
        return FAIL(`timeout score delta mismatch: before=${scoreBefore}, stars=${stars}, after=${totalScore(after)}`);
      }
      await browser.sleep(500);
      const later = await game.snapshot();
      if (totalScore(later) !== totalScore(after)) return FAIL('timeout result kept adding score after settlement');
      if (later.timeRemaining < 0) return FAIL('timer continued below zero after result');
      return PASS(`timeout stars=${stars}, score ${scoreBefore}->${totalScore(after)}`);
    }
  },
  {
    id: 'p1-result-lock-and-next-round',
    name: 'Result state locks editing and next round preserves score',
    level: 'P1',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const result = await game.loadScenario('result_ready');
      if (result.phase !== 'result') return FAIL('result_ready did not produce result phase');
      const countBefore = cakeCount(result);
      const totalBefore = totalScore(result);
      const editAttempt = await game.contractInput({ type: 'dragDecoration', decorationType: arr(result.tools.decorationTypes)[0], to: 'cakeCenter' });
      const locked = cakeCount(editAttempt) === countBefore && totalScore(editAttempt) === totalBefore;
      if (!locked) return FAIL('result phase accepted cake editing');
      const next = await game.clickButton('nextRound');
      if (next.phase !== 'playing') return FAIL('nextRound did not return to playing');
      if (next.round <= result.round) return FAIL(`round did not advance: ${result.round} -> ${next.round}`);
      if (cakeCount(next) !== 0 || next.cake.frosting !== null) return FAIL('next round did not reset cake');
      if (totalScore(next) !== totalBefore) return FAIL('next round did not preserve total score');
      if (next.ui.overlayBlocking || !next.ui.canInteractWithPlayfield) return FAIL('next round playfield blocked');
      return PASS(`round ${result.round}->${next.round}, score=${totalBefore}`);
    }
  },
  {
    id: 'p2-visible-feedback-canvas-hud',
    name: 'Visible playfield and HUD change after gameplay actions',
    level: 'P2',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.loadScenario('basic_playing');
      const start = await game.snapshot();
      if (!start.ui.timerVisible || !start.ui.promptVisible) return FAIL('timer or prompt not observable in HUD');
      const hashBefore = await game.canvasHash();
      await game.clickFrosting(0);
      await game.clickCake('center');
      await game.dragDecoration('center', 0);
      const mid = await game.snapshot();
      const hashMid = await game.canvasHash();
      const done = await game.clickButton('done');
      const hashAfter = await game.canvasHash();
      const visualChanged = hashBefore !== hashMid || hashMid !== hashAfter;
      if (!visualChanged && cakeCount(mid) < 1) return FAIL('no visible or semantic feedback after user actions');
      if (done.phase !== 'result' || !done.ui.resultVisible) return FAIL('done did not show observable result');
      return PASS(`canvasChanged=${visualChanged}, resultVisible=${done.ui.resultVisible}, score=${totalScore(done)}`);
    }
  },
  {
    id: 'p2-real-keyboard-shortcuts',
    name: 'Real keyboard shortcuts mirror undo clear and done',
    level: 'P2',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.loadScenario('partially_decorated');
      const before = await game.snapshot();
      if (cakeCount(before) < 1) return FAIL('partially_decorated lacks a decoration');
      await browser.keyDown('KeyZ');
      await browser.keyUp('KeyZ');
      await browser.sleep(160);
      const afterUndo = await game.snapshot();
      if (cakeCount(afterUndo) !== cakeCount(before) - 1) return FAIL('KeyZ did not undo one decoration');
      let beforeClear = afterUndo;
      if (cakeCount(beforeClear) === 0) {
        const decorationTypes = arr(beforeClear.tools && beforeClear.tools.decorationTypes);
        if (decorationTypes.length === 0) return FAIL('no decoration tool available for clear shortcut');
        beforeClear = await game.contractInput({
          type: 'dragDecoration',
          decorationType: decorationTypes[0],
          to: 'cakeCenter'
        });
        if (cakeCount(beforeClear) !== 1) return FAIL('could not establish a decoration for clear shortcut');
      }
      await browser.keyDown('KeyC');
      await browser.keyUp('KeyC');
      await browser.sleep(160);
      const afterClear = await game.snapshot();
      if (cakeCount(afterClear) !== 0) return FAIL('KeyC did not clear decorations');
      if (afterClear.cake && afterClear.cake.frosting !== null) return FAIL('KeyC did not clear cake frosting');
      if (afterClear.selectedFrosting !== null) return FAIL('KeyC did not clear frosting selection');
      await browser.keyDown('Enter');
      await browser.keyUp('Enter');
      await browser.sleep(220);
      const afterEnter = await game.snapshot();
      if (afterEnter.phase !== 'result') return FAIL('Enter did not finish round');
      const totalAfterResult = totalScore(afterEnter);
      await browser.keyDown('KeyC');
      await browser.keyUp('KeyC');
      await browser.sleep(120);
      const locked = await game.snapshot();
      if (totalScore(locked) !== totalAfterResult || cakeCount(locked) !== cakeCount(afterEnter)) {
        return FAIL('keyboard editing changed terminal result state');
      }
      return PASS(`keyboard path result phase=${afterEnter.phase}, score=${totalAfterResult}`);
    }
  },
  {
    id: 'p2-scoring-monotonic-contract',
    name: 'Scoring contract is monotonic and score delta equals stars',
    level: 'P2',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const low = await game.loadScenario('basic_playing');
      const lowBefore = totalScore(low);
      const lowResult = await game.contractInput({ type: 'done' });
      const lowStars = lastStars(lowResult);
      if (!isNum(lowStars)) return FAIL('low completion did not produce stars');
      if (totalScore(lowResult) !== lowBefore + lowStars) return FAIL('low score delta mismatch');

      const high = await game.loadScenario('target_one_step');
      const prompt = high.prompt || {};
      const color = prompt.frosting || arr(high.tools && high.tools.frostingColors)[0];
      if (color) await game.contractInput({ type: 'selectFrosting', color });
      if (color) await game.contractInput({ type: 'applyFrosting', to: 'cakeCenter' });
      for (const req of arr(prompt.decorations)) {
        for (let i = 0; i < (Number(req.minCount) || 0); i++) {
          await game.contractInput({ type: 'dragDecoration', decorationType: req.type, to: 'cakeCenter' });
        }
      }
      const highBefore = await game.snapshot();
      const highResult = await game.contractInput({ type: 'done' });
      const highStars = lastStars(highResult);
      if (!isNum(highStars)) return FAIL('high completion did not produce stars');
      if (highStars < lowStars) return FAIL(`high completion stars lower than low completion: ${highStars} < ${lowStars}`);
      if (totalScore(highResult) !== totalScore(highBefore) + highStars) return FAIL('high score delta mismatch');
      return PASS(`lowStars=${lowStars}, highStars=${highStars}, totalAfter=${totalScore(highResult)}`);
    }
  },
  {
    id: 'p2-config-contract',
    name: 'Config contract changes observable tools or timer and can close',
    level: 'P2',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('config_sample');
      const baseToolTotal = arr(before.tools && before.tools.frostingColors).length + arr(before.tools && before.tools.decorationTypes).length;
      const opened = await game.contractInput({ type: 'openConfig' });
      if (!['config', 'play', 'playing'].includes(opened.phase) && opened.screen !== 'config') {
        return FAIL('openConfig produced invalid phase/screen');
      }
      const changed = await game.contractInput({ type: 'setConfig', timeLimit: 45, disableOneDecoration: true });
      const afterToolTotal = arr(changed.tools && changed.tools.frostingColors).length + arr(changed.tools && changed.tools.decorationTypes).length;
      const timerChanged = changed.timeLimit === 45 || changed.timeLimit !== before.timeLimit;
      const toolsChanged = afterToolTotal !== baseToolTotal;
      if (!timerChanged && !toolsChanged) return FAIL('config did not affect timer or observable tools');
      const closed = await game.contractInput({ type: 'closeConfig' });
      if (closed.ui && closed.ui.overlayBlocking && closed.phase === 'playing') return FAIL('config close left blocking overlay');
      if (arr(closed.tools && closed.tools.frostingColors).length < 1 || arr(closed.tools && closed.tools.decorationTypes).length < 1) {
        return FAIL('config left no playable tools');
      }
      return PASS(`timerChanged=${timerChanged}, toolsChanged=${toolsChanged}`);
    }
  }
];

module.exports = { suite };
