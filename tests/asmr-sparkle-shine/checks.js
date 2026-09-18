const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// === GDD Coverage Map ===
// M1 (startup/menu to playing) -> p0-boot-no-fatal-and-readable, p1-real-start-click-unblocks-playfield
// M2 (readable 2D cleaning scene) -> p0-boot-no-fatal-and-readable, p0-contract-schema-reset-snapshot, p1-hud-canvas-observability
// M3 (tool selection) -> p1-real-tool-click-and-mouse-drag-mutates-surface, p1-contract-clean-stroke-progresses-surface
// M4 (item-area drag cleaning) -> p1-real-tool-click-and-mouse-drag-mutates-surface, p1-real-touch-drag-equivalent, p1-contract-clean-stroke-progresses-surface, p2-outside-stroke-rejected-invariant
// M5 (multi-stage tool chain) -> p1-full-tool-sequence-completes-and-rewards, p1-wrong-stage-tool-does-not-bypass-chain
// M6 (completion settlement) -> p1-full-tool-sequence-completes-and-rewards, p1-release-required-before-complete, p1-real-result-controls-state-machine
// M7 (coins, stars, unlocks) -> p1-full-tool-sequence-completes-and-rewards, p2-first-time-reward-not-repeated
// M8 (replay/next/back/locked state flow) -> p1-real-result-controls-state-machine, p2-locked-level-rejected
// M9 (opposite rotation semantics) -> p1-keyboard-rotation-opposite-directions, p1-visible-rotate-buttons-opposite-directions
// M10 (touch input) -> p1-real-touch-drag-equivalent
// M11 (level lock invariant) -> p2-locked-level-rejected
// M12 (special material chains) -> p2-phone-chain-rejects-water-shortcut, p2-keyboard-and-wood-special-chains
// M13/M14 (optional achievements/settings/persistence) -> p2-first-time-reward-not-repeated
// M15 (audio failure safety) -> p2-audio-failure-does-not-block-core-actions

// === Category Map ===
// Boot & Stability -> p0-boot-no-fatal-and-readable, p0-contract-schema-reset-snapshot
// UI Flow & Blocking -> p1-real-start-click-unblocks-playfield
// Input Semantics -> p1-real-tool-click-and-mouse-drag-mutates-surface, p1-real-touch-drag-equivalent, p1-keyboard-rotation-opposite-directions, p1-visible-rotate-buttons-opposite-directions
// Core Mechanic Loop -> p1-contract-clean-stroke-progresses-surface, p1-full-tool-sequence-completes-and-rewards, p1-wrong-stage-tool-does-not-bypass-chain, p1-release-required-before-complete
// State Machine -> p1-real-result-controls-state-machine
// Economy/Progression -> p2-first-time-reward-not-repeated
// Feedback & Observability -> p1-hud-canvas-observability
// Invariants & Rejection -> p2-outside-stroke-rejected-invariant, p2-locked-level-rejected
// Depth/Optional Systems -> p2-phone-chain-rejects-water-shortcut, p2-keyboard-and-wood-special-chains, p2-audio-failure-does-not-block-core-actions

// === Rationality Map ===
// p1-real-start-click-unblocks-playfield: real action: click semantic start control; independent observation: phase, overlayBlocking, playfield bounds, canvas readability; empty shell failure: a menu button that only changes text or leaves an overlay blocking the canvas fails.
// p1-real-tool-click-and-mouse-drag-mutates-surface: real action: visible tool click plus CDP mouse drag inside item bounds; independent observation: selected tool, surface delta, canvas/screenshot or visual revision; empty shell failure: API-only or decorative tool buttons do not mutate the visible surface.
// p1-real-touch-drag-equivalent: real action: visible/contract tool selection plus CDP touch drag; independent observation: surface or visual revision changes; empty shell failure: mouse-only implementations fail.
// p1-contract-clean-stroke-progresses-surface: contract action: selectTool + cleanStroke on normalized item points; independent observation: prepared/cleanliness/burden/visual revision changes; empty shell failure: returning ok without surface consequences fails.
// p1-full-tool-sequence-completes-and-rewards: contract action: iterate the declared toolSequence and clean strokes; independent observation: complete phase, stars, reward, coin delta, unlock/progress; empty shell failure: hardcoded completion without the tool chain and reward deltas fails.
// p1-wrong-stage-tool-does-not-bypass-chain: contract action: use a later/wrong tool before prerequisites; independent observation: no completion/reward and limited surface effect; empty shell failure: any tool can complete the level.
// p1-release-required-before-complete: contract setup: near-threshold pointer-down; independent observation: still playing until pointerUp, then complete; empty shell failure: threshold auto-settles while the player is still dragging.
// p1-keyboard-rotation-opposite-directions: real action: ArrowRight then ArrowLeft; independent observation: itemRotationDegrees sign symmetry plus unchanged resources; empty shell failure: keyboard listener absence, same-direction rotation, or resource mutation fails.
// p1-visible-rotate-buttons-opposite-directions: real action: rotate buttons; independent observation: opposite itemRotationDegrees deltas; empty shell failure: visible controls are decorative.
// p1-real-result-controls-state-machine: real action: result replay/next/menu controls; independent observation: surface reset, result closed, next level/menu phase; empty shell failure: only contract transitions exist.
// p1-hud-canvas-observability: trigger: start and clean stroke; independent observation: snapshot/HUD numeric agreement and readable changed playfield; empty shell failure: internal-only state or static canvas fails.
// p2-outside-stroke-rejected-invariant: trigger: outside cleanStroke and outside real drag; independent observation: totalBefore/totalAfter burden and unchanged economy/progress; empty shell failure: accepting every coordinate or mutating rewards fails.
// p2-locked-level-rejected: trigger: locked-level scenario then select locked index; independent observation: rejected action and unchanged current level/unlocks/coins; empty shell failure: visual lock only with enterable locked content fails.
// p2-first-time-reward-not-repeated: trigger: completed-first-level replay completion; independent observation: completed set preserved and reward delta excludes repeated first-time bonus; empty shell failure: paying first-time bonus every replay fails.
// p2-phone-chain-rejects-water-shortcut: scenario action: phone-like chain and water shortcut attempt; independent observation: phone tool sequence avoids water and shortcut cannot complete; empty shell failure: all materials share one water-wash solution.
// p2-keyboard-and-wood-special-chains: scenario action: keyboard and wood starts; independent observation: appropriate dry/polish tools and first stroke effect; empty shell failure: content depth is absent.
// p2-audio-failure-does-not-block-core-actions: trigger: tool/drag/complete while browser may reject audio; independent observation: no fatal audio exception and actions continue; empty shell failure: unhandled audio errors block input.

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isFatalException(e) {
  const text = `${e.text || ''} ${e.description || ''}`;
  const ignored = [
    'net::ERR',
    'Failed to load resource',
    'AudioContext',
    'decodeAudioData',
    'NotAllowedError',
    'play() request was interrupted',
    'no global run() found',
    "Failed to execute 'setPointerCapture'",
    'No active pointer with the given id'
  ];
  return !ignored.some(token => text.includes(token));
}

function summarize(value, limit = 900) {
  try {
    return JSON.stringify(value).slice(0, limit);
  } catch (_) {
    return String(value);
  }
}

async function callGameTest(browser, method, ...args) {
  return await browser.eval(`
    (async function(){
      const method = ${JSON.stringify(method)};
      const args = ${JSON.stringify(args)};
      const api = window.__gameTest;
      if (!api || typeof api[method] !== 'function') {
        return { __missing: true, method, available: api ? Object.keys(api) : [] };
      }
      try {
        return await Promise.resolve(api[method](...args));
      } catch (error) {
        return { __threw: true, method, message: error && error.message ? error.message : String(error) };
      }
    })()
  `);
}

async function getSnapshot(browser) {
  return await callGameTest(browser, 'getSnapshot');
}

async function resetGame(browser, options = {}) {
  return await callGameTest(browser, 'reset', options);
}

async function input(browser, action) {
  return await callGameTest(browser, 'input', action);
}

async function loadScenario(browser, name, options = {}) {
  return await callGameTest(browser, 'loadScenario', name, options);
}

function invalidContract(result, method) {
  if (!result) return `${method} returned no result`;
  if (result.__missing) return `missing window.__gameTest.${method}`;
  if (result.__threw) return `window.__gameTest.${method} threw: ${result.message}`;
  return '';
}

function snapshotOf(result) {
  if (!result) return null;
  return result.snapshot || result.after || result;
}

function validBounds(bounds) {
  return bounds &&
    isNumber(bounds.left) &&
    isNumber(bounds.top) &&
    isNumber(bounds.width) &&
    isNumber(bounds.height) &&
    bounds.width > 20 &&
    bounds.height > 20;
}

function validSnapshot(s) {
  return !!(
    s &&
    !s.__missing &&
    !s.__threw &&
    s.ready === true &&
    ['loading', 'menu', 'levelSelect', 'playing', 'complete'].includes(s.phase) &&
    s.canvas &&
    typeof s.canvas.visible === 'boolean' &&
    typeof s.canvas.nonBlank === 'boolean' &&
    validBounds(s.canvas.bounds) &&
    s.playfield &&
    validBounds(s.playfield.bounds) &&
    validBounds(s.playfield.itemBounds) &&
    isNumber(s.playfield.itemRotationDegrees) &&
    s.level &&
    Number.isInteger(s.level.index) &&
    Number.isInteger(s.level.count) &&
    s.level.count >= 1 &&
    Array.isArray(s.level.toolSequence) &&
    s.level.toolSequence.length >= 1 &&
    s.tools &&
    Array.isArray(s.tools.available) &&
    s.surface &&
    isNumber(s.surface.cleanliness) &&
    isNumber(s.surface.dirt) &&
    isNumber(s.surface.prepared) &&
    isNumber(s.surface.residue) &&
    isNumber(s.surface.wetness) &&
    s.economy &&
    isNumber(s.economy.coins) &&
    s.result &&
    typeof s.result.status === 'string' &&
    s.progress &&
    Array.isArray(s.progress.unlockedLevelIds) &&
    Array.isArray(s.progress.completedLevelIds)
  );
}

function isCompleteSnapshot(s) {
  return validSnapshot(s) && (s.phase === 'complete' || s.result.status === 'complete');
}

function isPlayableSnapshot(s) {
  return validSnapshot(s) && s.phase === 'playing' &&
    s.overlayBlocking === false && s.canInteractWithPlayfield === true;
}

function isSettlingSnapshot(s) {
  return validSnapshot(s) && s.phase === 'playing' &&
    (s.overlayBlocking === true || s.canInteractWithPlayfield === false);
}

async function settleAfterInput(browser, s) {
  if (isCompleteSnapshot(s) || isPlayableSnapshot(s)) return s;
  if (!isSettlingSnapshot(s)) return s;
  return await waitForSnapshot(browser, next => isCompleteSnapshot(next) || isPlayableSnapshot(next), 5000);
}

async function waitForSnapshot(browser, predicate, timeoutMs = 9000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await getSnapshot(browser);
    if (predicate(last)) return last;
    await sleep(180);
  }
  return last;
}

function burden(s) {
  if (!s || !s.surface) return NaN;
  return Number(s.surface.dirt || 0) + Number(s.surface.residue || 0) + Number(s.surface.wetness || 0);
}

function surfaceDelta(before, after) {
  if (!before || !after || !before.surface || !after.surface) return 0;
  return Math.abs(after.surface.cleanliness - before.surface.cleanliness) +
    Math.abs(after.surface.prepared - before.surface.prepared) +
    Math.abs(after.surface.dirt - before.surface.dirt) +
    Math.abs(after.surface.residue - before.surface.residue) +
    Math.abs(after.surface.wetness - before.surface.wetness);
}

function revisionChanged(before, after) {
  return !!(before && after && before.playfield && after.playfield &&
    String(before.playfield.visualRevision) !== String(after.playfield.visualRevision));
}

async function canvasVisualStats(browser) {
  return await browser.eval(`
    (function(){
      const canvases = Array.from(document.querySelectorAll('canvas'));
      if (!canvases.length) return { ok: false, reason: 'missing-canvas' };
      const visible = canvases
        .map((c, index) => {
          const r = c.getBoundingClientRect();
          const cs = getComputedStyle(c);
          return { c, index, area: r.width * r.height, rect: r, visible: cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.02 && r.width > 40 && r.height > 40 };
        })
        .filter(x => x.visible)
        .sort((a, b) => b.area - a.area);
      if (!visible.length) return { ok: false, reason: 'no-visible-canvas' };
      const item = visible[0];
      const c = item.c;
      let data;
      try {
        const ctx = c.getContext('2d');
        if (!ctx) return { ok: false, reason: 'missing-2d-context', rect: { width: item.rect.width, height: item.rect.height } };
        data = ctx.getImageData(0, 0, c.width, c.height).data;
      } catch (error) {
        return { ok: false, reason: 'unreadable-canvas', message: error && error.message ? error.message : String(error), rect: { width: item.rect.width, height: item.rect.height } };
      }
      const step = Math.max(4, Math.floor((data.length / 4) / 12000) * 4);
      const buckets = new Map();
      let sampled = 0;
      let opaque = 0;
      let minLuma = 255;
      let maxLuma = 0;
      for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        sampled++;
        if (a > 8) opaque++;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        minLuma = Math.min(minLuma, luma);
        maxLuma = Math.max(maxLuma, luma);
        const key = [r >> 5, g >> 5, b >> 5, a > 8 ? 1 : 0].join(':');
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      let dominant = 0;
      for (const count of buckets.values()) dominant = Math.max(dominant, count);
      return {
        ok: true,
        width: c.width,
        height: c.height,
        rect: { left: item.rect.left, top: item.rect.top, width: item.rect.width, height: item.rect.height },
        sampled,
        opaqueRatio: sampled ? opaque / sampled : 0,
        bucketCount: buckets.size,
        dominantRatio: sampled ? dominant / sampled : 1,
        lumaRange: maxLuma - minLuma
      };
    })()
  `);
}

function readableCanvas(stats, snap) {
  if (snap && snap.canvas && snap.canvas.visible && snap.canvas.nonBlank && snap.canvas.diverse !== false) return true;
  return !!(stats && stats.ok && stats.opaqueRatio > 0.8 && stats.bucketCount >= 8 && stats.dominantRatio < 0.98 && stats.lumaRange > 20);
}

async function findSemanticControl(browser, kind, target = {}) {
  return await browser.eval(`
    (function(){
      const kind = ${JSON.stringify(kind)};
      const target = ${JSON.stringify(target)};
      function visible(el) {
        if (!el || el.disabled) return false;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.pointerEvents !== 'none' &&
          Number(cs.opacity || 1) > 0.02 && r.width > 8 && r.height > 8;
      }
      const all = Array.from(document.querySelectorAll('button, [role="button"], [data-game-control], [data-game-tool], a')).filter(visible);
      const textOf = el => ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '') + ' ' + (el.title || '')).toLowerCase();
      let candidates = [];
      if (kind === 'start') {
        candidates = all.filter(el => el.getAttribute('data-game-control') === 'start' || /\\b(start|play|begin)\\b/.test(textOf(el)));
      } else if (kind === 'tool') {
        candidates = all.filter(el => {
          const tool = el.getAttribute('data-game-tool') || el.getAttribute('data-game-id');
          const txt = textOf(el);
          return (target.tool && tool === target.tool) ||
            el.getAttribute('data-game-control') === 'tool' ||
            (target.tool && txt.includes(String(target.tool).replace(/_/g, ' ')));
        });
      } else if (kind === 'rotate-left') {
        candidates = all.filter(el => {
          const action = el.getAttribute('data-act');
          const direction = el.getAttribute('data-dir');
          const text = textOf(el);
          return el.getAttribute('data-game-control') === 'rotate-left' ||
            (action === 'rotate' && direction === 'left') ||
            /\\b(left|rotate left|turn left)\\b/.test(text) ||
            /[↶↺⟲]/.test(text);
        });
      } else if (kind === 'rotate-right') {
        candidates = all.filter(el => {
          const action = el.getAttribute('data-act');
          const direction = el.getAttribute('data-dir');
          const text = textOf(el);
          return el.getAttribute('data-game-control') === 'rotate-right' ||
            (action === 'rotate' && direction === 'right') ||
            /\\b(right|rotate right|turn right)\\b/.test(text) ||
            /[↷↻⟳]/.test(text);
        });
      } else if (kind === 'replay') {
        candidates = all.filter(el => el.getAttribute('data-game-control') === 'replay' || /\\b(replay|retry|restart)\\b/.test(textOf(el)));
      } else if (kind === 'next') {
        candidates = all.filter(el => el.getAttribute('data-game-control') === 'next' || /\\b(next|continue)\\b/.test(textOf(el)));
      } else if (kind === 'menu') {
        candidates = all.filter(el => el.getAttribute('data-game-control') === 'menu' || /\\b(menu|home)\\b/.test(textOf(el)));
      } else if (kind === 'back') {
        candidates = all.filter(el => el.getAttribute('data-game-control') === 'back' || /\\b(back|return)\\b/.test(textOf(el)));
      }
      const el = candidates[0] || null;
      if (!el) return { found: false, kind, visibleCount: all.length };
      const r = el.getBoundingClientRect();
      return { found: true, kind, x: r.left + r.width / 2, y: r.top + r.height / 2, text: textOf(el).slice(0, 80) };
    })()
  `);
}

async function realClick(browser, point) {
  await browser.mouseClick(point.x, point.y);
  await sleep(350);
}

async function dispatchPointerDrag(browser, start, end, steps = 8, pointerType = 'mouse') {
  await browser.eval(`
    (async function(){
      const start = ${JSON.stringify(start)};
      const end = ${JSON.stringify(end)};
      const steps = ${Number(steps)};
      const pointerType = ${JSON.stringify(pointerType)};
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
      const OriginalPointerEvent = window.PointerEvent || window.MouseEvent;
      const originalSetPointerCapture = Element.prototype.setPointerCapture;
      const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
      Element.prototype.setPointerCapture = function(pointerId) {
        try { return originalSetPointerCapture && originalSetPointerCapture.call(this, pointerId); } catch (_) {}
      };
      Element.prototype.releasePointerCapture = function(pointerId) {
        try { return originalReleasePointerCapture && originalReleasePointerCapture.call(this, pointerId); } catch (_) {}
      };
      function dispatch(type, x, y, buttons) {
        const target = document.elementFromPoint(x, y) || document;
        const event = new OriginalPointerEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
          button: buttons ? 0 : -1,
          buttons,
          pointerId: pointerType === 'touch' ? 9 : 7,
          pointerType,
          isPrimary: true
        });
        target.dispatchEvent(event);
      }
      try {
        dispatch('pointerdown', start.x, start.y, 1);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          dispatch('pointermove', start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t, 1);
          await sleep(35);
        }
        dispatch('pointerup', end.x, end.y, 0);
      } finally {
        if (originalSetPointerCapture) Element.prototype.setPointerCapture = originalSetPointerCapture;
        if (originalReleasePointerCapture) Element.prototype.releasePointerCapture = originalReleasePointerCapture;
      }
      return true;
    })()
  `);
  await sleep(250);
}

async function dragMouse(browser, start, end, steps = 8) {
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0, pointerType: 'mouse' });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', buttons: 1, clickCount: 1, modifiers: 0, pointerType: 'mouse' });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1, modifiers: 0, pointerType: 'mouse' });
    await sleep(45);
  }
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', buttons: 0, clickCount: 1, modifiers: 0, pointerType: 'mouse' });
  await dispatchPointerDrag(browser, start, end, steps, 'mouse');
  await sleep(550);
}

async function dragTouch(browser, start, end, steps = 8) {
  await browser.cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y, radiusX: 3, radiusY: 3, id: 1 }]
  });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y, radiusX: 3, radiusY: 3, id: 1 }]
    });
    await sleep(45);
  }
  await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await dispatchPointerDrag(browser, start, end, steps, 'touch');
  await sleep(550);
}

function itemDragPoints(s) {
  const b = s.playfield.itemBounds;
  const centerX = Number.isFinite(b.centerX) ? b.centerX : b.left + b.width / 2;
  const centerY = Number.isFinite(b.centerY) ? b.centerY : b.top + b.height / 2;
  const spanX = Math.min(32, b.width * 0.12);
  return {
    start: { x: centerX - spanX, y: centerY },
    end: { x: centerX + spanX, y: centerY },
    center: { x: centerX, y: centerY },
    outside: { x: Math.max(4, b.left - 80), y: Math.max(4, b.top - 80) }
  };
}

function gridStrokePoints() {
  return [
    { x: 0.20, y: 0.28 }, { x: 0.50, y: 0.28 }, { x: 0.80, y: 0.28 },
    { x: 0.80, y: 0.50 }, { x: 0.50, y: 0.50 }, { x: 0.20, y: 0.50 },
    { x: 0.20, y: 0.72 }, { x: 0.50, y: 0.72 }, { x: 0.80, y: 0.72 }
  ];
}

function fullCoverageStrokePoints() {
  const points = [];
  const rows = 30;
  for (let row = 0; row < rows; row++) {
    const y = (row + 0.5) / rows;
    if (row % 2 === 0) {
      points.push({ x: 0.01, y }, { x: 0.99, y });
    } else {
      points.push({ x: 0.99, y }, { x: 0.01, y });
    }
  }
  return points;
}

function denseCoverageStrokePoints() {
  const points = [];
  const rows = 30;
  const columns = 30;
  for (let row = 0; row < rows; row++) {
    const y = (row + 0.5) / rows;
    if (row % 2 === 0) {
      for (let column = 0; column < columns; column++) {
        points.push({ x: (column + 0.5) / columns, y });
      }
    } else {
      for (let column = columns - 1; column >= 0; column--) {
        points.push({ x: (column + 0.5) / columns, y });
      }
    }
  }
  return points;
}

function coverageStrokePatterns() {
  return [
    fullCoverageStrokePoints(),
    gridStrokePoints(),
    [
      { x: 0.12, y: 0.18 }, { x: 0.34, y: 0.18 }, { x: 0.56, y: 0.18 }, { x: 0.78, y: 0.18 },
      { x: 0.88, y: 0.38 }, { x: 0.66, y: 0.38 }, { x: 0.44, y: 0.38 }, { x: 0.22, y: 0.38 }
    ],
    [
      { x: 0.15, y: 0.62 }, { x: 0.38, y: 0.62 }, { x: 0.62, y: 0.62 }, { x: 0.85, y: 0.62 },
      { x: 0.82, y: 0.82 }, { x: 0.58, y: 0.82 }, { x: 0.34, y: 0.82 }, { x: 0.12, y: 0.82 }
    ],
    [
      { x: 0.18, y: 0.20 }, { x: 0.28, y: 0.42 }, { x: 0.18, y: 0.66 }, { x: 0.36, y: 0.84 },
      { x: 0.58, y: 0.66 }, { x: 0.74, y: 0.42 }, { x: 0.86, y: 0.20 }
    ]
  ];
}

const KNOWN_TOOLS = [
  'spray', 'sponge', 'brush', 'water', 'rinse', 'towel', 'hairdryer',
  'dryer', 'cloth', 'soft-cloth', 'furniture-polish', 'polish',
  'dusting-cloth', 'polish-cloth'
];

function normalizedToolText(tools) {
  return (tools || []).join(' ').toLowerCase().replace(/_/g, '-');
}

function hasAnyTool(tools, patterns) {
  const text = normalizedToolText(tools);
  return patterns.some(pattern => text.includes(pattern));
}

async function ensurePlaying(browser, options = {}) {
  let snap = await getSnapshot(browser);
  if (validSnapshot(snap) && snap.phase === 'playing') return snap;
  if (!Number.isInteger(options.levelIndex)) {
    const start = await input(browser, { type: 'start' });
    snap = snapshotOf(start);
    if (validSnapshot(snap) && snap.phase === 'playing') return snap;
  }
  const reset = await resetGame(browser, {
    phase: 'playing',
    ...(Number.isInteger(options.levelIndex) ? { levelIndex: options.levelIndex } : {})
  });
  snap = snapshotOf(reset);
  return snap;
}

async function selectFirstToolContract(browser, snap) {
  const tool = snap && snap.level && snap.level.toolSequence && snap.level.toolSequence[0];
  if (!tool) return { ok: false, reason: 'missing first tool', snapshot: snap };
  return await input(browser, { type: 'selectTool', tool });
}

async function contractStroke(browser, points = gridStrokePoints(), coordinate = 'normalizedItem') {
  return await input(browser, { type: 'cleanStroke', coordinate, points });
}

async function recoverPriorStage(browser, sequence, toolIndex, patterns, patternIndex) {
  const recoveryPattern = patterns[0] || gridStrokePoints();
  for (let priorIndex = 0; priorIndex < toolIndex; priorIndex++) {
    const priorTool = sequence[priorIndex];
    const selected = await input(browser, { type: 'selectTool', tool: priorTool });
    if (selected.ok === false || selected.accepted === false || invalidContract(selected, 'input')) continue;
    const before = snapshotOf(selected) || await getSnapshot(browser);
    const stroked = await contractStroke(browser, recoveryPattern, 'normalizedItem');
    const err = invalidContract(stroked, 'input');
    const after = snapshotOf(stroked) || await getSnapshot(browser);
    if (err || stroked.accepted === false) return null;
    if (!validSnapshot(before) || !validSnapshot(after) ||
        (surfaceDelta(before, after) <= 0.001 && !revisionChanged(before, after))) return null;
  }
  const restored = await input(browser, { type: 'selectTool', tool: sequence[toolIndex] });
  if (restored.ok === false || restored.accepted === false || invalidContract(restored, 'input')) return null;
  return snapshotOf(restored) || await getSnapshot(browser);
}

async function completeByToolSequence(browser, options = {}) {
  let snap = await ensurePlaying(browser);
  if (!validSnapshot(snap)) return { ok: false, reason: `invalid playing snapshot: ${summarize(snap)}` };
  const sequence = snap.level.toolSequence.slice();
  const patterns = [denseCoverageStrokePoints()];
  const allowEarlyCompletion = options.allowEarlyCompletion === true;
  const maxStrokesPerTool = 24;
  const maxConsecutiveNoEffect = maxStrokesPerTool;
  for (let toolIndex = 0; toolIndex < sequence.length; toolIndex++) {
    const tool = sequence[toolIndex];
    if (isCompleteSnapshot(snap)) {
      if (allowEarlyCompletion) break;
      return { ok: false, reason: `level completed before declared tool ${tool} was used`, snapshot: snap };
    }
    const selected = await input(browser, { type: 'selectTool', tool });
    if (selected.ok === false || selected.accepted === false || invalidContract(selected, 'input')) {
      return { ok: false, reason: `selectTool ${tool} rejected: ${summarize(selected)}`, snapshot: snapshotOf(selected) };
    }
    let acceptedStrokes = 0;
    let stageEffectObserved = false;
    let noEffectStreak = 0;
    let beforeAttempt = snapshotOf(selected) || await getSnapshot(browser);
    for (let i = 0; i < maxStrokesPerTool; i++) {
      const points = patterns[i % patterns.length];
      const stroked = await contractStroke(browser, points, 'normalizedItem');
      const err = invalidContract(stroked, 'input');
      let strokedSnap = snapshotOf(stroked);
      if (err) return { ok: false, reason: `cleanStroke ${tool} failed: ${err}`, snapshot: strokedSnap };
      strokedSnap = await settleAfterInput(browser, strokedSnap);
      if (stroked.accepted === false) {
        if (isCompleteSnapshot(strokedSnap)) {
          if (!allowEarlyCompletion && toolIndex < sequence.length - 1) {
            return { ok: false, reason: `level completed before declared tool sequence finished: ${summarize(strokedSnap.level)}`, snapshot: strokedSnap };
          }
          if (!stageEffectObserved) {
            return { ok: false, reason: `level completed without an observable ${tool} stage effect`, snapshot: strokedSnap };
          }
          acceptedStrokes = Math.max(acceptedStrokes, 1);
          break;
        }
        if (stageEffectObserved) {
          const settled = await waitForSnapshot(browser, next => isCompleteSnapshot(next), 1800);
          if (isCompleteSnapshot(settled)) {
            if (!allowEarlyCompletion && toolIndex < sequence.length - 1) {
              return { ok: false, reason: `level completed before declared tool sequence finished: ${summarize(settled.level)}`, snapshot: settled };
            }
            strokedSnap = settled;
            acceptedStrokes = Math.max(acceptedStrokes, 1);
            break;
          }
          if (toolIndex > 0) {
            const recovered = await recoverPriorStage(browser, sequence, toolIndex, patterns, i);
            if (recovered) {
              beforeAttempt = recovered;
              continue;
            }
          }
          break;
        }
        if (i < maxStrokesPerTool - 1) {
          beforeAttempt = strokedSnap || await getSnapshot(browser);
          continue;
        }
        return { ok: false, reason: `cleanStroke ${tool} rejected before producing a stage effect: ${summarize(stroked)}`, snapshot: strokedSnap };
      }
      acceptedStrokes++;
      const effectObserved = validSnapshot(beforeAttempt) && validSnapshot(strokedSnap) &&
        (surfaceDelta(beforeAttempt, strokedSnap) > 0.001 || revisionChanged(beforeAttempt, strokedSnap));
      if (effectObserved) {
        stageEffectObserved = true;
        noEffectStreak = 0;
      } else if (stageEffectObserved) {
        noEffectStreak++;
      }
      if (isCompleteSnapshot(strokedSnap)) {
        if (!stageEffectObserved) {
          return { ok: false, reason: `level completed without an observable ${tool} stage effect`, snapshot: strokedSnap };
        }
        if (!allowEarlyCompletion && toolIndex < sequence.length - 1) {
          return { ok: false, reason: `level completed before declared tool sequence finished: ${summarize(strokedSnap.level)}`, snapshot: strokedSnap };
        }
        break;
      }
      if (!effectObserved && stageEffectObserved && noEffectStreak < maxConsecutiveNoEffect) {
        beforeAttempt = strokedSnap;
        continue;
      }
      if (!effectObserved && stageEffectObserved) {
        if (toolIndex > 0) {
          const recovered = await recoverPriorStage(browser, sequence, toolIndex, patterns, i);
          if (recovered) {
            beforeAttempt = recovered;
            noEffectStreak = 0;
            continue;
          }
        }
        break;
      }
      if (!effectObserved && !stageEffectObserved) {
        if (toolIndex > 0) {
          const recovered = await recoverPriorStage(browser, sequence, toolIndex, patterns, i);
          if (recovered) {
            beforeAttempt = recovered;
            continue;
          }
        }
        if (i < maxStrokesPerTool - 1) {
          beforeAttempt = strokedSnap;
          continue;
        }
        return { ok: false, reason: `cleanStroke ${tool} accepted without surface or visual effect: ${summarize(strokedSnap.surface)}`, snapshot: strokedSnap };
      }
      beforeAttempt = strokedSnap || await getSnapshot(browser);
      await sleep(80);
    }
    if (!acceptedStrokes) return { ok: false, reason: `tool ${tool} produced no accepted cleaning stroke`, snapshot: await getSnapshot(browser) };
    snap = await getSnapshot(browser);
    snap = await settleAfterInput(browser, snap);
    if (isCompleteSnapshot(snap)) {
      if (!stageEffectObserved) return { ok: false, reason: `level completed without an observable ${tool} stage effect`, snapshot: snap };
      if (!allowEarlyCompletion && toolIndex < sequence.length - 1) {
        return { ok: false, reason: `level completed before declared tool sequence finished: ${summarize(snap.level)}`, snapshot: snap };
      }
      break;
    }
    if (!isPlayableSnapshot(snap)) {
      return { ok: false, reason: `tool ${tool} did not return to a playable state: ${summarize(snap)}`, snapshot: snap };
    }
    if (toolIndex < sequence.length - 1) {
      const probe = await input(browser, { type: 'selectTool', tool: sequence[toolIndex + 1] });
      if (probe.accepted === false || invalidContract(probe, 'input')) {
        return { ok: false, reason: `next tool ${sequence[toolIndex + 1]} could not be selected after ${tool}: ${summarize(probe)}`, snapshot: snapshotOf(probe) };
      }
      snap = snapshotOf(probe) || await getSnapshot(browser);
    }
  }
  await input(browser, { type: 'pointerUp' });
  const finalSnap = await waitForSnapshot(browser, s => validSnapshot(s) && s.phase === 'complete', 7000);
  return { ok: validSnapshot(finalSnap) && finalSnap.phase === 'complete', snapshot: finalSnap, sequence };
}

async function completeNearThreshold(browser, snap) {
  const sequence = snap && snap.level && Array.isArray(snap.level.toolSequence)
    ? snap.level.toolSequence
    : [];
  const finalTool = sequence[sequence.length - 1];
  if (!finalTool) return { ok: false, reason: 'near-threshold setup has no final tool', snapshot: snap };
  const selected = await input(browser, { type: 'selectTool', tool: finalTool });
  if (selected.accepted === false || invalidContract(selected, 'input')) {
    return { ok: false, reason: `final tool ${finalTool} could not be selected: ${summarize(selected)}`, snapshot: snapshotOf(selected) };
  }
  const rowCount = 30;
  const finalPath = [];
  for (let row = 0; row < rowCount; row++) {
    const y = (row + 0.5) / rowCount;
    const points = row % 2 === 0
      ? [{ x: 0.02, y }, { x: 0.98, y }]
      : [{ x: 0.98, y }, { x: 0.02, y }];
    finalPath.push(...points);
  }
  const patterns = [denseCoverageStrokePoints(), finalPath, ...coverageStrokePatterns()];
  let last = snapshotOf(selected) || await getSnapshot(browser);
  for (let i = 0; i < 96; i++) {
    const current = await getSnapshot(browser);
    if (isCompleteSnapshot(current)) {
      last = current;
      break;
    }
    const stroked = await contractStroke(browser, patterns[i % patterns.length], 'normalizedItem');
    const err = invalidContract(stroked, 'input');
    let next = snapshotOf(stroked) || await getSnapshot(browser);
    if (err) return { ok: false, reason: `final tool ${finalTool} failed: ${err}`, snapshot: next };
    const wasSettling = isSettlingSnapshot(next);
    next = await settleAfterInput(browser, next);
    if (stroked.accepted === false) {
      const settled = await waitForSnapshot(browser, candidate => isCompleteSnapshot(candidate), 1800);
      if (isCompleteSnapshot(settled)) {
        next = settled;
        break;
      }
      if (wasSettling && isPlayableSnapshot(next)) {
        i--;
        continue;
      }
      return { ok: false, reason: `final tool ${finalTool} stroke rejected: ${summarize(stroked)}`, snapshot: next };
    }
    last = next;
    if (isCompleteSnapshot(next)) break;
    if (!isPlayableSnapshot(next)) {
      return { ok: false, reason: `final tool ${finalTool} did not return to a playable state: ${summarize(next)}`, snapshot: next };
    }
    await sleep(80);
  }
  await input(browser, { type: 'pointerUp' });
  const complete = await waitForSnapshot(browser, s => validSnapshot(s) && s.phase === 'complete', 7000);
  return {
    ok: validSnapshot(complete) && complete.phase === 'complete',
    reason: validSnapshot(complete) && complete.phase === 'complete' ? '' : `final tool did not complete: ${summarize(last)}`,
    snapshot: complete
  };
}

const suite = [
  {
    id: 'p0-boot-no-fatal-and-readable',
    level: 'P0',
    name: 'Boot has no fatal errors and exposes a readable play surface or menu',
    timeoutMs: 20000,
    async run(ctx) {
      await sleep(1200);
      const fatal = (ctx.browser.exceptions || []).filter(isFatalException);
      if (fatal.length) return FAIL(`fatal runtime exception: ${summarize(fatal[0])}`);
      const snap = await getSnapshot(ctx.browser);
      const stats = await canvasVisualStats(ctx.browser);
      const startControl = await findSemanticControl(ctx.browser, 'start');
      const hasMenuOrCanvas = await ctx.browser.eval(`
        (function(){
          const visible = el => {
            if (!el) return false;
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.02 && r.width > 20 && r.height > 20;
          };
          return Array.from(document.querySelectorAll('canvas, button, [role="button"]')).some(visible);
        })()
      `);
      if (!hasMenuOrCanvas) return FAIL('no visible canvas or operable menu controls');
      const readyMenu = snap && !snap.__missing && !snap.__threw &&
        snap.ready === true && snap.phase === 'menu' && snap.activePanel === 'menu' && startControl.found;
      if (readyMenu) return PASS('ready menu with visible start control');
      if (snap && !snap.__missing && !snap.__threw && validSnapshot(snap)) return PASS(`snapshot phase=${snap.phase}`);
      if (readableCanvas(stats, null)) return PASS('readable canvas without contract snapshot');
      return FAIL(`not ready/readable; snapshot=${summarize(snap)} stats=${summarize(stats)}`);
    }
  },
  {
    id: 'p0-contract-schema-reset-snapshot',
    level: 'P0',
    name: 'Public reset/getSnapshot contract returns complete schema',
    timeoutMs: 20000,
    async run(ctx) {
      const reset = await resetGame(ctx.browser, { phase: 'playing', clearStorage: true });
      const err = invalidContract(reset, 'reset');
      if (err) return FAIL(err);
      const snap = snapshotOf(reset);
      if (!validSnapshot(snap)) return FAIL(`invalid snapshot schema: ${summarize(snap)}`);
      if (snap.phase !== 'playing') return FAIL(`reset to playing returned phase=${snap.phase}`);
      if (snap.overlayBlocking) return FAIL('playing snapshot reports overlayBlocking=true');
      if (!snap.canInteractWithPlayfield) return FAIL('playing snapshot reports canInteractWithPlayfield=false');
      return PASS(`levelCount=${snap.level.count}, tools=${snap.level.toolSequence.length}`);
    }
  },
  {
    id: 'p1-real-start-click-unblocks-playfield',
    level: 'P1',
    name: 'Real start click enters playable unblocked cleaning scene',
    timeoutMs: 25000,
    async run(ctx) {
      await resetGame(ctx.browser, { phase: 'menu', clearStorage: true });
      await sleep(300);
      const before = await getSnapshot(ctx.browser);
      const coinsBefore = before && before.economy && before.economy.coins;
      const start = await findSemanticControl(ctx.browser, 'start');
      if (!start.found) return FAIL(`missing visible start control: ${summarize(start)}`);
      await realClick(ctx.browser, start);
      const after = await waitForSnapshot(ctx.browser, s => validSnapshot(s) && s.phase === 'playing', 7000);
      if (!validSnapshot(after)) return FAIL(`invalid snapshot after start: ${summarize(after)}`);
      if (after.overlayBlocking || !after.canInteractWithPlayfield) return FAIL(`playfield blocked after start: overlay=${after.overlayBlocking}, canInteract=${after.canInteractWithPlayfield}`);
      const stats = await canvasVisualStats(ctx.browser);
      if (!readableCanvas(stats, after)) return FAIL(`canvas not readable after start: ${summarize(stats)}`);
      if (isNumber(coinsBefore) && after.economy.coins !== coinsBefore) return FAIL(`start changed coins ${coinsBefore}->${after.economy.coins}`);
      return PASS(`started level ${after.level.index} with ${after.tools.visibleCount} visible tools`);
    }
  },
  {
    id: 'p1-real-tool-click-and-mouse-drag-mutates-surface',
    level: 'P1',
    name: 'Real tool click and mouse drag mutate visible surface',
    timeoutMs: 30000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      const err = invalidContract(loaded, 'loadScenario');
      if (err) return FAIL(err);
      let before = await ensurePlaying(ctx.browser);
      if (!validSnapshot(before)) return FAIL(`fresh-first-level setup did not become playable: ${summarize(before)}`);
      const tool = before.level.toolSequence[0];
      const control = await findSemanticControl(ctx.browser, 'tool', { tool });
      if (!control.found) return FAIL(`missing visible tool control for ${tool}: ${summarize(control)}`);
      await realClick(ctx.browser, control);
      await sleep(200);
      const selected = await getSnapshot(ctx.browser);
      if (!validSnapshot(selected) || selected.tools.selected !== tool) return FAIL(`real tool click did not select ${tool}: ${summarize(selected && selected.tools)}`);
      const points = itemDragPoints(selected);
      const hashBefore = await ctx.browser.canvasPixelHash();
      await dragMouse(ctx.browser, points.start, points.end, 10);
      const after = await waitForSnapshot(ctx.browser, s => validSnapshot(s) && (surfaceDelta(selected, s) > 0.001 || revisionChanged(selected, s)), 5000);
      const hashAfter = await ctx.browser.canvasPixelHash();
      if (!validSnapshot(after)) return FAIL(`invalid snapshot after real drag: ${summarize(after)}`);
      if (surfaceDelta(selected, after) <= 0.001 && !revisionChanged(selected, after)) return FAIL(`real drag caused no surface or visual change: before=${summarize(selected.surface)} after=${summarize(after.surface)}`);
      if (hashBefore === hashAfter && !revisionChanged(selected, after)) return FAIL('real drag did not change screenshot hash or playfield visual revision');
      return PASS(`tool=${tool}, surfaceDelta=${surfaceDelta(selected, after).toFixed(4)}`);
    }
  },
  {
    id: 'p1-contract-clean-stroke-progresses-surface',
    level: 'P1',
    name: 'Contract cleanStroke progresses surface through selected tool',
    timeoutMs: 25000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      const err = invalidContract(loaded, 'loadScenario');
      if (err) return FAIL(err);
      const before = await ensurePlaying(ctx.browser);
      if (!validSnapshot(before)) return FAIL(`invalid fresh snapshot: ${summarize(before)}`);
      const selected = await selectFirstToolContract(ctx.browser, before);
      if (invalidContract(selected, 'input') || selected.accepted === false) return FAIL(`select first tool failed: ${summarize(selected)}`);
      const mid = snapshotOf(selected);
      const stroked = await contractStroke(ctx.browser);
      if (invalidContract(stroked, 'input') || stroked.accepted === false) return FAIL(`cleanStroke rejected: ${summarize(stroked)}`);
      const after = snapshotOf(stroked);
      if (!validSnapshot(after)) return FAIL(`invalid snapshot after cleanStroke: ${summarize(after)}`);
      const changed = surfaceDelta(mid, after);
      if (changed <= 0.001 && !revisionChanged(mid, after)) return FAIL(`cleanStroke accepted without surface/visual effect: before=${summarize(mid.surface)} after=${summarize(after.surface)}`);
      if (after.phase === 'complete') return FAIL('single initial cleanStroke should not instantly complete the full tool chain');
      return PASS(`surface changed by ${changed.toFixed(4)}, cleanliness=${after.surface.cleanliness.toFixed(3)}`);
    }
  },
  {
    id: 'p1-full-tool-sequence-completes-and-rewards',
    level: 'P1',
    name: 'Full tool sequence completes level and awards progression',
    timeoutMs: 45000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      const err = invalidContract(loaded, 'loadScenario');
      if (err) return FAIL(err);
      const before = await ensurePlaying(ctx.browser);
      if (!validSnapshot(before)) return FAIL(`invalid setup: ${summarize(before)}`);
      const coinsBefore = before.economy.coins;
      const unlockedBefore = before.progress.unlockedLevelIds.length;
      const completedBefore = before.progress.completedLevelIds.length;
      const done = await completeByToolSequence(ctx.browser);
      if (!done.ok || !validSnapshot(done.snapshot)) return FAIL(done.reason || `did not complete: ${summarize(done.snapshot)}`);
      const after = done.snapshot;
      if (after.result.status !== 'complete' || after.phase !== 'complete') return FAIL(`completion state mismatch: ${summarize(after.result)}`);
      if (!isNumber(after.result.stars) || after.result.stars < 1 || after.result.stars > 3) return FAIL(`invalid stars: ${after.result.stars}`);
      if (!isNumber(after.result.totalReward) || after.result.totalReward <= 0) return FAIL(`invalid totalReward: ${after.result.totalReward}`);
      if (after.economy.coins <= coinsBefore) return FAIL(`coins did not increase: ${coinsBefore}->${after.economy.coins}`);
      if (after.progress.completedLevelIds.length < completedBefore + 1) return FAIL('completed levels did not record the finished level');
      if (before.level.count > 1 && after.progress.unlockedLevelIds.length < unlockedBefore + 1) return FAIL('next level was not unlocked after first completion');
      return PASS(`completed via ${done.sequence.length} tools, reward=${after.result.totalReward}, coins=${coinsBefore}->${after.economy.coins}`);
    }
  },
  {
    id: 'p1-wrong-stage-tool-does-not-bypass-chain',
    level: 'P1',
    name: 'Wrong-stage or unavailable tools cannot bypass the cleaning chain',
    timeoutMs: 30000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      const err = invalidContract(loaded, 'loadScenario');
      if (err) return FAIL(err);
      const before = await ensurePlaying(ctx.browser);
      if (!validSnapshot(before)) return FAIL(`invalid setup: ${summarize(before)}`);
      const sequence = before.level.toolSequence || [];
      const wrongTool = sequence.length > 1 ? sequence[sequence.length - 1] : KNOWN_TOOLS.find(t => !sequence.includes(t));
      if (!wrongTool) return FAIL(`cannot identify wrong-stage/unavailable tool from sequence: ${summarize(sequence)}`);
      const totalBefore = burden(before);
      const coinsBefore = before.economy.coins;
      const selected = await input(ctx.browser, { type: 'selectTool', tool: wrongTool });
      if (selected.accepted === false) {
        const afterReject = snapshotOf(selected) || await getSnapshot(ctx.browser);
        if (!validSnapshot(afterReject)) return FAIL(`invalid rejection snapshot: ${summarize(afterReject)}`);
        if (afterReject.economy.coins !== coinsBefore || afterReject.phase !== 'playing') return FAIL(`rejected wrong tool changed protected state: ${summarize(afterReject)}`);
        return PASS(`wrong tool ${wrongTool} rejected before stroke`);
      }
      const mid = snapshotOf(selected) || await getSnapshot(ctx.browser);
      const stroked = await contractStroke(ctx.browser);
      const after = snapshotOf(stroked) || await getSnapshot(ctx.browser);
      if (!validSnapshot(after)) return FAIL(`invalid wrong-stage after snapshot: ${summarize(after)}`);
      if (after.phase === 'complete' || after.result.status === 'complete') return FAIL(`wrong-stage tool completed the level: ${summarize(after.result)}`);
      if (after.economy.coins !== coinsBefore) return FAIL(`wrong-stage tool changed coins: ${coinsBefore}->${after.economy.coins}`);
      const burdenDrop = totalBefore - burden(after);
      const cleanGain = after.surface.cleanliness - before.surface.cleanliness;
      if (burdenDrop > 0.18 || cleanGain > 0.08) {
        return FAIL(`wrong-stage tool had too much effect: burdenDrop=${burdenDrop.toFixed(3)}, cleanGain=${cleanGain.toFixed(3)}, before=${summarize(before.surface)} after=${summarize(after.surface)}`);
      }
      return PASS(`wrong tool ${wrongTool} did not bypass chain; selected=${summarize(mid && mid.tools)}, cleanGain=${cleanGain.toFixed(3)}`);
    }
  },
  {
    id: 'p1-release-required-before-complete',
    level: 'P1',
    name: 'Near-threshold cleaning does not settle until pointer release',
    timeoutMs: 25000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'near-threshold-pointer-down');
      const err = invalidContract(loaded, 'loadScenario');
      if (err) return FAIL(err);
      const before = snapshotOf(loaded);
      if (!validSnapshot(before) || before.phase !== 'playing' || before.result.status !== 'none') {
        return FAIL(`invalid pointer-down near-threshold setup: ${summarize(before)}`);
      }
      const coinsBefore = before.economy.coins;
      await sleep(900);
      const held = await getSnapshot(ctx.browser);
      if (!validSnapshot(held)) return FAIL(`invalid held snapshot: ${summarize(held)}`);
      if (held.phase === 'complete' || held.result.status === 'complete' || held.economy.coins !== coinsBefore) {
        return FAIL(`completed or paid before pointer release: ${summarize({ phase: held.phase, result: held.result, coinsBefore, coinsAfter: held.economy.coins })}`);
      }
      const up = await input(ctx.browser, { type: 'pointerUp' });
      if (invalidContract(up, 'input') || up.accepted === false) return FAIL(`pointerUp rejected: ${summarize(up)}`);
      const after = await waitForSnapshot(ctx.browser, s => validSnapshot(s) && s.phase === 'complete', 7000);
      if (!validSnapshot(after) || after.phase !== 'complete' || after.result.status !== 'complete') {
        return FAIL(`release did not settle to complete: ${summarize(after)}`);
      }
      if (after.economy.coins <= coinsBefore) return FAIL(`completion after release did not award coins: ${coinsBefore}->${after.economy.coins}`);
      return PASS(`held phase=${held.phase}; released reward=${after.result.totalReward}`);
    }
  },
  {
    id: 'p1-keyboard-rotation-opposite-directions',
    level: 'P1',
    name: 'Keyboard left/right rotation changes visible angle in opposite directions',
    timeoutMs: 25000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      if (invalidContract(loaded, 'loadScenario')) return FAIL(invalidContract(loaded, 'loadScenario'));
      const s0 = await ensurePlaying(ctx.browser);
      if (!validSnapshot(s0)) return FAIL(`invalid setup: ${summarize(s0)}`);
      await ctx.browser.keyDown('ArrowRight');
      await sleep(220);
      await ctx.browser.keyUp('ArrowRight');
      await sleep(500);
      const s1 = await getSnapshot(ctx.browser);
      await ctx.browser.keyDown('ArrowLeft');
      await sleep(220);
      await ctx.browser.keyUp('ArrowLeft');
      await sleep(700);
      const s2 = await getSnapshot(ctx.browser);
      if (!validSnapshot(s1) || !validSnapshot(s2)) return FAIL(`invalid rotation snapshots: ${summarize({ s1, s2 })}`);
      const rightDelta = s1.playfield.itemRotationDegrees - s0.playfield.itemRotationDegrees;
      const leftDelta = s2.playfield.itemRotationDegrees - s1.playfield.itemRotationDegrees;
      if (Math.abs(rightDelta) < 1 || Math.abs(leftDelta) < 1) return FAIL(`rotation deltas too small: right=${rightDelta}, left=${leftDelta}`);
      if (Math.sign(rightDelta) === Math.sign(leftDelta)) return FAIL(`left/right rotation moved same direction: right=${rightDelta}, left=${leftDelta}`);
      if (s2.economy.coins !== s0.economy.coins || Math.abs(s2.surface.cleanliness - s0.surface.cleanliness) > 0.001) {
        return FAIL('rotation changed economy or cleanliness');
      }
      return PASS(`rightDelta=${rightDelta.toFixed(1)}, leftDelta=${leftDelta.toFixed(1)}`);
    }
  },
  {
    id: 'p1-visible-rotate-buttons-opposite-directions',
    level: 'P1',
    name: 'Visible rotate buttons change angle in opposite directions',
    timeoutMs: 25000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      if (invalidContract(loaded, 'loadScenario')) return FAIL(invalidContract(loaded, 'loadScenario'));
      const s0 = await ensurePlaying(ctx.browser);
      if (!validSnapshot(s0)) return FAIL(`invalid setup: ${summarize(s0)}`);
      const right = await findSemanticControl(ctx.browser, 'rotate-right');
      const left = await findSemanticControl(ctx.browser, 'rotate-left');
      if (!right.found || !left.found) return FAIL(`missing visible rotate controls: left=${summarize(left)} right=${summarize(right)}`);
      await realClick(ctx.browser, right);
      await sleep(500);
      const s1 = await getSnapshot(ctx.browser);
      await realClick(ctx.browser, left);
      await sleep(700);
      const s2 = await getSnapshot(ctx.browser);
      if (!validSnapshot(s1) || !validSnapshot(s2)) return FAIL(`invalid button rotation snapshots: ${summarize({ s1, s2 })}`);
      const rightDelta = s1.playfield.itemRotationDegrees - s0.playfield.itemRotationDegrees;
      const leftDelta = s2.playfield.itemRotationDegrees - s1.playfield.itemRotationDegrees;
      if (Math.abs(rightDelta) < 1 || Math.abs(leftDelta) < 1) return FAIL(`button rotation deltas too small: right=${rightDelta}, left=${leftDelta}`);
      if (Math.sign(rightDelta) === Math.sign(leftDelta)) return FAIL(`rotate buttons moved same direction: right=${rightDelta}, left=${leftDelta}`);
      if (s2.economy.coins !== s0.economy.coins || Math.abs(s2.surface.cleanliness - s0.surface.cleanliness) > 0.001) {
        return FAIL('rotate buttons changed economy or cleanliness');
      }
      return PASS(`button rightDelta=${rightDelta.toFixed(1)}, leftDelta=${leftDelta.toFixed(1)}`);
    }
  },
  {
    id: 'p1-real-result-controls-state-machine',
    level: 'P1',
    name: 'Visible result controls reset, advance, or return without stale overlays',
    timeoutMs: 45000,
    async run(ctx) {
      const ready = await loadScenario(ctx.browser, 'near-complete-needs-dry');
      if (invalidContract(ready, 'loadScenario')) return FAIL(invalidContract(ready, 'loadScenario'));
      const near = snapshotOf(ready);
      if (!validSnapshot(near) || near.phase !== 'playing' || near.result.status !== 'none') return FAIL(`invalid near-complete setup: ${summarize(near)}`);
      const completed = await completeNearThreshold(ctx.browser, near);
      if (!completed.ok || !validSnapshot(completed.snapshot)) return FAIL(completed.reason || `near-complete did not settle to complete: ${summarize(completed.snapshot)}`);
      const complete = completed.snapshot;
      const completedIndex = complete.level.index;
      const replayControl = await findSemanticControl(ctx.browser, 'replay');
      if (!replayControl.found) return FAIL(`missing visible replay control on result screen: ${summarize(replayControl)}`);
      await realClick(ctx.browser, replayControl);
      const replaySnap = await waitForSnapshot(ctx.browser, s => validSnapshot(s) && s.phase === 'playing', 7000);
      if (!validSnapshot(replaySnap) || replaySnap.phase !== 'playing') return FAIL(`replay did not return to playing: ${summarize(replaySnap)}`);
      if (replaySnap.level.index !== completedIndex) return FAIL(`replay changed level index ${completedIndex}->${replaySnap.level.index}`);
      const completedBurden = burden(complete);
      const replayBurden = burden(replaySnap);
      const replayResetSurface = replaySnap.result.status === 'none' &&
        Number.isFinite(completedBurden) && Number.isFinite(replayBurden) &&
        (replayBurden > completedBurden + 0.001 || replaySnap.surface.cleanliness < complete.surface.cleanliness - 0.001);
      if (!replayResetSurface) return FAIL(`replay did not restore dirty surface: complete=${summarize(complete.surface)} replay=${summarize(replaySnap.surface)}`);
      const near2 = await loadScenario(ctx.browser, 'near-complete-needs-dry', { levelIndex: completedIndex });
      if (invalidContract(near2, 'loadScenario')) return FAIL(invalidContract(near2, 'loadScenario'));
      const sNear2 = snapshotOf(near2);
      const completed2 = await completeNearThreshold(ctx.browser, sNear2);
      if (!completed2.ok || !validSnapshot(completed2.snapshot)) return FAIL(completed2.reason || 'second completion setup failed before nextLevel');
      const complete2 = completed2.snapshot;
      if (!complete2.result.nextLevelAvailable) return PASS('replay verified; no later level available for nextLevel path');
      const nextControl = await findSemanticControl(ctx.browser, 'next');
      if (!nextControl.found) return FAIL(`missing visible next control while next level is available: ${summarize(nextControl)}`);
      await realClick(ctx.browser, nextControl);
      const nextSnap = await waitForSnapshot(ctx.browser, s => validSnapshot(s) && s.phase === 'playing', 7000);
      if (!validSnapshot(nextSnap) || nextSnap.phase !== 'playing') return FAIL(`nextLevel did not enter playing: ${summarize(nextSnap)}`);
      if (nextSnap.level.index <= completedIndex) return FAIL(`nextLevel did not advance: ${completedIndex}->${nextSnap.level.index}`);
      return PASS(`replay reset and next advanced to level ${nextSnap.level.index}`);
    }
  },
  {
    id: 'p1-hud-canvas-observability',
    level: 'P1',
    name: 'HUD/canvas observability follows cleaning and result state',
    timeoutMs: 30000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      if (invalidContract(loaded, 'loadScenario')) return FAIL(invalidContract(loaded, 'loadScenario'));
      const before = await ensurePlaying(ctx.browser);
      if (!validSnapshot(before)) return FAIL(`invalid setup: ${summarize(before)}`);
      const hudBefore = await readHudNumbers(ctx.browser);
      const tool = before.level.toolSequence[0];
      await input(ctx.browser, { type: 'selectTool', tool });
      await contractStroke(ctx.browser);
      const after = await getSnapshot(ctx.browser);
      const hudAfter = await readHudNumbers(ctx.browser);
      const stats = await canvasVisualStats(ctx.browser);
      if (!validSnapshot(after)) return FAIL(`invalid after snapshot: ${summarize(after)}`);
      if (!readableCanvas(stats, after)) return FAIL(`canvas not readable: ${summarize(stats)}`);
      if (hudAfter.percentValues.length && after.surface.cleanliness > before.surface.cleanliness + 0.01) {
        const maxPercent = Math.max(...hudAfter.percentValues);
        if (maxPercent < Math.floor(after.surface.cleanliness * 100) - 8) {
          return FAIL(`HUD percent too low for snapshot cleanliness: hud=${maxPercent}, snap=${after.surface.cleanliness}`);
        }
      }
      if (hudBefore.coinValues.length && hudAfter.coinValues.length && before.economy.coins !== after.economy.coins) {
        const beforeMax = Math.max(...hudBefore.coinValues);
        const afterMax = Math.max(...hudAfter.coinValues);
        if (beforeMax === afterMax) return FAIL('coin HUD did not change while snapshot coins changed');
      }
      if (surfaceDelta(before, after) <= 0.001 && !revisionChanged(before, after)) return FAIL('observability stroke produced no snapshot-visible change');
      return PASS(`canvas readable; hud percents=${hudAfter.percentValues.slice(0, 3).join(',')}`);
    }
  },
  {
    id: 'p2-outside-stroke-rejected-invariant',
    level: 'P2',
    name: 'Outside item strokes are rejected or leave core totals unchanged',
    timeoutMs: 30000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      if (invalidContract(loaded, 'loadScenario')) return FAIL(invalidContract(loaded, 'loadScenario'));
      const before = await ensurePlaying(ctx.browser);
      if (!validSnapshot(before)) return FAIL(`invalid setup: ${summarize(before)}`);
      const tool = before.level.toolSequence[0];
      await input(ctx.browser, { type: 'selectTool', tool });
      const selected = await getSnapshot(ctx.browser);
      const totalBefore = burden(selected);
      const coinsBefore = selected.economy.coins;
      const completedBefore = selected.progress.completedLevelIds.join('|');
      const rejected = await input(ctx.browser, {
        type: 'cleanStroke',
        coordinate: 'normalizedItem',
        points: [{ x: -0.25, y: 0.5 }, { x: -0.1, y: 0.6 }]
      });
      const embeddedSnapshot = rejected && (rejected.snapshot || rejected.after);
      const afterContract = embeddedSnapshot ||
        (validSnapshot(rejected) ? rejected : await getSnapshot(ctx.browser));
      const totalAfter = burden(afterContract);
      if (!validSnapshot(afterContract)) return FAIL(`invalid after outside contract stroke: ${summarize(afterContract)}`);
      if (Math.abs(totalAfter - totalBefore) > 0.001 ||
          afterContract.economy.coins !== coinsBefore ||
          afterContract.progress.completedLevelIds.join('|') !== completedBefore) {
        return FAIL(`outside contract stroke mutated burden: ${totalBefore}->${totalAfter}, action=${summarize(rejected)}`);
      }
      const points = itemDragPoints(afterContract);
      await dragMouse(ctx.browser, points.outside, { x: points.outside.x + 40, y: points.outside.y + 30 }, 5);
      const afterReal = await getSnapshot(ctx.browser);
      const unchanged = Math.abs(burden(afterReal) - totalAfter) <= 0.001 &&
        afterReal.economy.coins === coinsBefore &&
        afterReal.progress.completedLevelIds.join('|') === completedBefore;
      if (!unchanged) return FAIL(`outside real drag changed protected state: before=${summarize(afterContract.surface)} after=${summarize(afterReal.surface)}`);
      return PASS(`totalBefore=${totalBefore.toFixed(4)}, totalAfter=${burden(afterReal).toFixed(4)}, unchanged=${unchanged}`);
    }
  },
  {
    id: 'p2-locked-level-rejected',
    level: 'P2',
    name: 'Locked level selection is rejected without changing progress',
    timeoutMs: 25000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'locked-level');
      if (invalidContract(loaded, 'loadScenario')) return FAIL(invalidContract(loaded, 'loadScenario'));
      if (loaded.ok === false) return FAIL(`locked-level setup rejected: ${summarize(loaded)}`);
      const before = (loaded && (loaded.snapshot || loaded.after)) || await getSnapshot(ctx.browser);
      const hasNumericBounds = bounds => bounds && ['left', 'top', 'width', 'height'].every(key => isNumber(bounds[key]));
      const validLockedState = s => !!(
        s &&
        !s.__missing &&
        !s.__threw &&
        s.ready === true &&
        ['menu', 'levelSelect', 'playing'].includes(s.phase) &&
        s.canvas &&
        typeof s.canvas.visible === 'boolean' &&
        hasNumericBounds(s.canvas.bounds) &&
        s.playfield &&
        hasNumericBounds(s.playfield.bounds) &&
        hasNumericBounds(s.playfield.itemBounds) &&
        isNumber(s.playfield.itemRotationDegrees) &&
        (isNumber(s.playfield.visualRevision) || typeof s.playfield.visualRevision === 'string') &&
        s.level &&
        Number.isInteger(s.level.index) &&
        Number.isInteger(s.level.count) &&
        s.level.count > 1 &&
        Number.isInteger(s.level.unlockedCount) &&
        s.level.unlockedCount >= 0 &&
        s.level.unlockedCount < s.level.count &&
        (typeof s.level.currentId === 'string' || (['menu', 'levelSelect'].includes(s.phase) && s.level.currentId === null)) &&
        Array.isArray(s.level.toolSequence) &&
        s.tools &&
        Array.isArray(s.tools.available) &&
        s.surface &&
        isNumber(s.surface.cleanliness) &&
        isNumber(s.surface.dirt) &&
        isNumber(s.surface.prepared) &&
        isNumber(s.surface.residue) &&
        isNumber(s.surface.wetness) &&
        s.economy &&
        isNumber(s.economy.coins) &&
        s.result &&
        typeof s.result.status === 'string' &&
        s.progress &&
        Array.isArray(s.progress.unlockedLevelIds) &&
        Array.isArray(s.progress.completedLevelIds)
      );
      if (!validLockedState(before)) return FAIL(`invalid locked-level setup: ${summarize(before)}`);
      if (before.result.status !== 'none') return FAIL(`locked-level setup has a result: ${summarize(before.result)}`);
      const lockedIndex = Number.isInteger(before.lockedLevelIndex) ? before.lockedLevelIndex : Math.max(before.level.unlockedCount, 1);
      if (lockedIndex < 0 || lockedIndex >= before.level.count || lockedIndex < before.level.unlockedCount) {
        return FAIL(`locked-level setup has no valid locked index: ${summarize(before.level)}`);
      }
      const result = await input(ctx.browser, { type: 'selectLevel', levelIndex: lockedIndex });
      const after = await getSnapshot(ctx.browser);
      if (!validLockedState(after)) return FAIL(`invalid after locked select: ${summarize(after)}`);
      const rejected = result && (result.accepted === false || result.ok === false);
      if (!rejected || result.accepted === true) return FAIL(`locked level action was not rejected: ${summarize(result)}`);
      const sameIds = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(id => b.includes(id));
      const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const unchanged =
        after.phase === before.phase &&
        after.level.index === before.level.index &&
        after.level.currentId === before.level.currentId &&
        after.level.unlockedCount === before.level.unlockedCount &&
        after.level.completedCount === before.level.completedCount &&
        after.economy.coins === before.economy.coins &&
        after.economy.totalEarned === before.economy.totalEarned &&
        sameValue(after.economy.lastReward, before.economy.lastReward) &&
        sameIds(after.progress.unlockedLevelIds, before.progress.unlockedLevelIds) &&
        sameIds(after.progress.completedLevelIds, before.progress.completedLevelIds) &&
        after.result.status === before.result.status &&
        after.surface.cleanliness === before.surface.cleanliness &&
        after.playfield.visualRevision === before.playfield.visualRevision;
      if (!unchanged) return FAIL(`locked select changed protected state: before=${summarize(before)} after=${summarize(after)}`);
      return PASS(`locked index ${lockedIndex} rejected; protected state unchanged`);
    }
  },
  {
    id: 'p2-first-time-reward-not-repeated',
    level: 'P2',
    name: 'Replay completion does not repeat first-time reward or reduce stars',
    timeoutMs: 45000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'completed-first-level');
      if (invalidContract(loaded, 'loadScenario')) return FAIL(invalidContract(loaded, 'loadScenario'));
      const beforeScenario = snapshotOf(loaded);
      if (!validSnapshot(beforeScenario)) return FAIL(`invalid completed-first-level setup: ${summarize(beforeScenario)}`);
      const before = await ensurePlaying(ctx.browser, { levelIndex: 0 });
      if (!validSnapshot(before)) return FAIL(`invalid completed-first-level setup: ${summarize(before)}`);
      if (!before.progress.completedLevelIds.includes(before.level.currentId)) {
        return FAIL(`completed-first-level setup does not mark the current level complete: ${before.level.currentId}`);
      }
      const completedBefore = new Set(before.progress.completedLevelIds);
      const starsBefore = before.progress.levelStars[before.level.currentId] || 0;
      const coinsBefore = before.economy.coins;
      const done = await completeByToolSequence(ctx.browser, { allowEarlyCompletion: true });
      if (!done.ok || !validSnapshot(done.snapshot)) return FAIL(done.reason || `replay completion failed: ${summarize(done.snapshot)}`);
      const after = done.snapshot;
      const completedAfter = new Set(after.progress.completedLevelIds);
      const completedSetUnchanged = completedBefore.size === completedAfter.size &&
        [...completedBefore].every(id => completedAfter.has(id));
      if (!completedSetUnchanged) return FAIL(`completed set changed on replay: ${completedBefore.size}->${completedAfter.size}`);
      const starsAfter = after.progress.levelStars[before.level.currentId] || 0;
      if (starsAfter < starsBefore) return FAIL(`stars decreased on replay: ${starsBefore}->${starsAfter}`);
      if (after.result.firstTimeBonus > 0) return FAIL(`first-time bonus repeated: ${after.result.firstTimeBonus}`);
      const repeatReward = after.result.baseReward + after.result.speedBonus + after.result.perfectBonus;
      if (after.result.totalReward !== repeatReward) return FAIL(`repeat reward includes a non-repeat component: reported=${after.result.totalReward}, components=${repeatReward}`);
      const coinDelta = after.economy.coins - coinsBefore;
      if (coinDelta < repeatReward) return FAIL(`coin delta is below repeat reward: delta=${coinDelta}, reward=${repeatReward}`);
      return PASS(`repeat reward=${after.result.totalReward}, firstTimeBonus=${after.result.firstTimeBonus}`);
    }
  },
  {
    id: 'p2-phone-chain-rejects-water-shortcut',
    level: 'P2',
    name: 'Phone-like screen cleaning uses foam/cloth and rejects a water shortcut',
    timeoutMs: 35000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'phone-like-two-step');
      if (invalidContract(loaded, 'loadScenario')) return FAIL(invalidContract(loaded, 'loadScenario'));
      const before = snapshotOf(loaded);
      if (!validSnapshot(before) || before.phase !== 'playing') return FAIL(`invalid phone-like setup: ${summarize(before)}`);
      const tools = before.level.toolSequence || [];
      if (!hasAnyTool(tools, ['spray', 'foam', 'cleaner']) || !hasAnyTool(tools, ['cloth', 'soft'])) {
        return FAIL(`phone-like chain does not expose cleaner/cloth semantics: ${summarize(tools)}`);
      }
      if (hasAnyTool(tools, ['water', 'rinse'])) return FAIL(`phone-like chain should not require water/rinse: ${summarize(tools)}`);
      const waterTool = KNOWN_TOOLS.find(t => /water|rinse/.test(t));
      const coinsBefore = before.economy.coins;
      const water = await input(ctx.browser, { type: 'selectTool', tool: waterTool });
      if (water.accepted !== false) {
        await contractStroke(ctx.browser);
        const afterWater = await getSnapshot(ctx.browser);
        if (!validSnapshot(afterWater)) return FAIL(`invalid after water shortcut: ${summarize(afterWater)}`);
        if (afterWater.phase === 'complete' || afterWater.economy.coins !== coinsBefore || afterWater.surface.cleanliness - before.surface.cleanliness > 0.08) {
          return FAIL(`water shortcut affected phone-like level too much: before=${summarize(before.surface)} after=${summarize(afterWater.surface)}`);
        }
      }
      const done = await completeByToolSequence(ctx.browser);
      if (!done.ok || !validSnapshot(done.snapshot) || done.snapshot.phase !== 'complete') {
        return FAIL(done.reason || `phone-like correct chain did not complete: ${summarize(done.snapshot)}`);
      }
      return PASS(`phone chain=${tools.join('>')}, reward=${done.snapshot.result.totalReward}`);
    }
  },
  {
    id: 'p2-keyboard-and-wood-special-chains',
    level: 'P2',
    name: 'Keyboard and wood levels expose distinct dry and polish tool chains',
    timeoutMs: 35000,
    async run(ctx) {
      const keyboard = await loadScenario(ctx.browser, 'keyboard-dry-clean');
      if (invalidContract(keyboard, 'loadScenario')) return FAIL(invalidContract(keyboard, 'loadScenario'));
      const kb = snapshotOf(keyboard);
      if (!validSnapshot(kb) || kb.phase !== 'playing') return FAIL(`invalid keyboard scenario: ${summarize(kb)}`);
      if (!hasAnyTool(kb.level.toolSequence, ['hairdryer', 'dryer', 'cloth'])) {
        return FAIL(`keyboard chain lacks dry/cloth semantics: ${summarize(kb.level.toolSequence)}`);
      }
      if (hasAnyTool(kb.level.toolSequence, ['water', 'rinse'])) return FAIL(`keyboard chain should not require water/rinse: ${summarize(kb.level.toolSequence)}`);
      const kbFirst = kb.level.toolSequence[0];
      await input(ctx.browser, { type: 'selectTool', tool: kbFirst });
      const kbStroke = await contractStroke(ctx.browser);
      const kbAfter = snapshotOf(kbStroke) || await getSnapshot(ctx.browser);
      if (!validSnapshot(kbAfter) || (surfaceDelta(kb, kbAfter) <= 0.001 && !revisionChanged(kb, kbAfter))) {
        return FAIL(`keyboard first tool caused no visible/surface effect: ${summarize(kbAfter && kbAfter.surface)}`);
      }

      const wood = await loadScenario(ctx.browser, 'wood-polish-chain');
      if (invalidContract(wood, 'loadScenario')) return FAIL(invalidContract(wood, 'loadScenario'));
      const wd = snapshotOf(wood);
      if (!validSnapshot(wd) || wd.phase !== 'playing') return FAIL(`invalid wood scenario: ${summarize(wd)}`);
      if (!hasAnyTool(wd.level.toolSequence, ['dust', 'furniture', 'polish'])) {
        return FAIL(`wood chain lacks dust/polish semantics: ${summarize(wd.level.toolSequence)}`);
      }
      if (hasAnyTool(wd.level.toolSequence, ['water', 'rinse'])) return FAIL(`wood chain should not require water/rinse: ${summarize(wd.level.toolSequence)}`);
      const wdFirst = wd.level.toolSequence[0];
      await input(ctx.browser, { type: 'selectTool', tool: wdFirst });
      const wdStroke = await contractStroke(ctx.browser);
      const wdAfter = snapshotOf(wdStroke) || await getSnapshot(ctx.browser);
      if (!validSnapshot(wdAfter) || (surfaceDelta(wd, wdAfter) <= 0.001 && !revisionChanged(wd, wdAfter))) {
        return FAIL(`wood first tool caused no visible/surface effect: ${summarize(wdAfter && wdAfter.surface)}`);
      }
      return PASS(`keyboard=${kb.level.toolSequence.join('>')}; wood=${wd.level.toolSequence.join('>')}`);
    }
  },
  {
    id: 'p1-real-touch-drag-equivalent',
    level: 'P1',
    name: 'Touch drag over item mutates the cleaning surface',
    timeoutMs: 30000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      if (invalidContract(loaded, 'loadScenario')) return FAIL(invalidContract(loaded, 'loadScenario'));
      const before = await ensurePlaying(ctx.browser);
      if (!validSnapshot(before)) return FAIL(`invalid setup: ${summarize(before)}`);
      const tool = before.level.toolSequence[0];
      const control = await findSemanticControl(ctx.browser, 'tool', { tool });
      if (!control.found) {
        const selected = await input(ctx.browser, { type: 'selectTool', tool });
        if (selected.accepted === false) return FAIL(`cannot select tool for touch setup: ${summarize(selected)}`);
      } else {
        await realClick(ctx.browser, control);
      }
      const selected = await getSnapshot(ctx.browser);
      if (!validSnapshot(selected)) return FAIL(`invalid selected snapshot: ${summarize(selected)}`);
      if (selected.tools.selected !== tool) {
        return FAIL(`visible tool selection did not settle: expected=${tool} actual=${summarize(selected.tools.selected)}`);
      }
      const visual = await canvasVisualStats(ctx.browser);
      const reportedCanvas = selected.canvas.bounds;
      const actualCanvas = visual && visual.rect;
      const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 2;
      if (!visual || visual.ok !== true || !actualCanvas ||
          !close(reportedCanvas.left, actualCanvas.left) ||
          !close(reportedCanvas.top, actualCanvas.top) ||
          !close(reportedCanvas.width, actualCanvas.width) ||
          !close(reportedCanvas.height, actualCanvas.height)) {
        return FAIL(`snapshot canvas bounds do not match visible canvas geometry: snapshot=${summarize(reportedCanvas)} actual=${summarize(actualCanvas)}`);
      }
      const bounds = selected.playfield.itemBounds;
      if (bounds.left < actualCanvas.left - 2 || bounds.top < actualCanvas.top - 2 ||
          bounds.left + bounds.width > actualCanvas.left + actualCanvas.width + 2 ||
          bounds.top + bounds.height > actualCanvas.top + actualCanvas.height + 2) {
        return FAIL(`itemBounds are not a visible screen area: item=${summarize(bounds)} canvas=${summarize(actualCanvas)}`);
      }
      const fractions = [0.5, 0.25, 0.75];
      const spanX = Math.min(Math.max(bounds.width * 0.08, 4), 20);
      let after = selected;
      let changed = false;
      for (const yFraction of fractions) {
        for (const xFraction of fractions) {
          const x = bounds.left + bounds.width * xFraction;
          const y = bounds.top + bounds.height * yFraction;
          await dragTouch(ctx.browser, { x: x - spanX / 2, y }, { x: x + spanX / 2, y }, 8);
          after = await getSnapshot(ctx.browser);
          if (!validSnapshot(after)) return FAIL(`invalid after touch snapshot: ${summarize(after)}`);
          if (surfaceDelta(selected, after) > 0.001 || revisionChanged(selected, after)) {
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
      if (!changed) {
        return FAIL(`touch drag caused no cleaning effect: before=${summarize(selected.surface)} after=${summarize(after.surface)}`);
      }
      return PASS(`touch surfaceDelta=${surfaceDelta(selected, after).toFixed(4)}`);
    }
  },
  {
    id: 'p2-audio-failure-does-not-block-core-actions',
    level: 'P2',
    name: 'Audio failures do not block tool use, cleaning, or completion',
    timeoutMs: 45000,
    async run(ctx) {
      const loaded = await loadScenario(ctx.browser, 'fresh-first-level');
      const setupError = invalidContract(loaded, 'loadScenario');
      if (setupError) return FAIL(setupError);
      const before = await ensurePlaying(ctx.browser);
      if (!validSnapshot(before)) return FAIL(`invalid setup: ${summarize(before)}`);
      const fatalBefore = (ctx.browser.exceptions || []).filter(isFatalException).length;
      const selected = await selectFirstToolContract(ctx.browser, before);
      const selectedError = invalidContract(selected, 'input');
      if (selectedError || !selected || selected.ok === false || selected.accepted === false) {
        return FAIL(selectedError || `first tool selection rejected: ${summarize(selected)}`);
      }
      const selectedSnap = snapshotOf(selected) || await getSnapshot(ctx.browser);
      if (!validSnapshot(selectedSnap)) return FAIL(`invalid selected-tool snapshot: ${summarize(selectedSnap)}`);
      const stroked = await contractStroke(ctx.browser);
      const strokeError = invalidContract(stroked, 'input');
      let afterStroke = snapshotOf(stroked) || await getSnapshot(ctx.browser);
      if (strokeError || !stroked || stroked.ok === false || stroked.accepted === false) {
        return FAIL(strokeError || `clean stroke rejected: ${summarize(stroked)}`);
      }
      afterStroke = await settleAfterInput(ctx.browser, afterStroke);
      if (!validSnapshot(afterStroke)) return FAIL(`invalid after-stroke snapshot: ${summarize(afterStroke)}`);
      if (surfaceDelta(selectedSnap, afterStroke) <= 0.001 && !revisionChanged(selectedSnap, afterStroke)) {
        return FAIL(`tool/drag caused no cleaning effect: before=${summarize(selectedSnap.surface)} after=${summarize(afterStroke.surface)}`);
      }
      const core = await completeByToolSequence(ctx.browser, { allowEarlyCompletion: true });
      if (!core.ok || !validSnapshot(core.snapshot) || core.snapshot.phase !== 'complete') {
        return FAIL(core.reason || `core actions blocked before completion: ${summarize(core.snapshot)}`);
      }
      const near = await loadScenario(ctx.browser, 'near-threshold-pointer-down');
      const nearError = invalidContract(near, 'loadScenario');
      const nearSnap = snapshotOf(near);
      if (nearError || !validSnapshot(nearSnap) || nearSnap.phase !== 'playing') {
        return FAIL(nearError || `invalid near-threshold setup: ${summarize(nearSnap)}`);
      }
      let released = await input(ctx.browser, { type: 'pointerUp' });
      const releaseError = invalidContract(released, 'input');
      if (releaseError === '' && released && released.ok === false && released.reason === 'invalid point') {
        const b = nearSnap.playfield.itemBounds;
        released = await input(ctx.browser, { type: 'pointerUp', x: b.centerX, y: b.centerY });
      }
      if (releaseError || !released || released.ok === false || released.accepted === false) {
        return FAIL(releaseError || `pointer release rejected: ${summarize(released)}`);
      }
      const finalSnap = await waitForSnapshot(ctx.browser, s => validSnapshot(s) && s.phase === 'complete', 7000);
      const fatalAfter = (ctx.browser.exceptions || []).filter(isFatalException).length;
      if (fatalAfter > fatalBefore) {
        const fatal = (ctx.browser.exceptions || []).filter(isFatalException).slice(fatalBefore)[0];
        return FAIL(`fatal exception during audio-sensitive core actions: ${summarize(fatal)}`);
      }
      if (!validSnapshot(finalSnap) || finalSnap.phase !== 'complete') {
        return FAIL(`core actions blocked before completion: ${summarize(finalSnap)}`);
      }
      return PASS(`completed despite browser audio policy; reward=${finalSnap.result && finalSnap.result.totalReward}`);
    }
  }
];

async function readHudNumbers(browser) {
  return await browser.eval(`
    (function(){
      const text = Array.from(document.body ? document.body.querySelectorAll('*') : [])
        .filter(el => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        })
        .map(el => el.textContent || '')
        .join(' ');
      const percentValues = [];
      text.replace(/(\\d{1,3})\\s*%/g, (_, n) => { percentValues.push(Number(n)); return ''; });
      const coinValues = [];
      const nums = text.match(/\\b\\d{1,6}\\b/g) || [];
      for (const n of nums.slice(0, 80)) coinValues.push(Number(n));
      return { percentValues, coinValues };
    })()
  `);
}

module.exports = {
  sleep,
  suite
};
