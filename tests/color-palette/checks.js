// === GDD Coverage Map ===
// M1 -> p0-boot-no-fatal, p0-contract-and-ui, p1-visible-canvas-nonblank
// M2 -> p1-real-mouse-color-and-fill, p2-keyboard-color-and-image
// M3 -> p1-real-mouse-color-and-fill, p1-real-touch-fill
// M4 -> p2-invalid-action-rejection-invariant
// M5 -> p0-contract-and-ui, p1-real-image-switch-resets-work, p1-no-exit-image-cycle-remains-colorable
// M6 -> p1-clear-cancel-preserves-work, p1-clear-confirm-resets-work, p2-key-clear-opens-confirm
// M7 -> p2-keyboard-color-and-image, p2-key-clear-opens-confirm
// M8 -> p1-visible-canvas-nonblank, p2-progress-observability-sync
// M9 -> p2-edit-mode-rejects-fill
//
// === Category Map ===
// Boot & Stability: p0-boot-no-fatal, p0-contract-and-ui
// UI Flow & Blocking: p1-clear-cancel-preserves-work, p1-clear-confirm-resets-work
// Input Semantics: p1-real-mouse-color-and-fill, p1-real-touch-fill, p2-keyboard-color-and-image
// Core Mechanic Loop: p1-real-image-switch-resets-work, p1-no-exit-image-cycle-remains-colorable
// State Machine: p1-clear-cancel-preserves-work, p1-clear-confirm-resets-work, p2-key-clear-opens-confirm
// Economy/Progression: p2-progress-observability-sync
// Feedback & Observability: p1-visible-canvas-nonblank
// Invariants & Rejection: p2-invalid-action-rejection-invariant
// Depth/Optional Systems: p2-edit-mode-rejects-fill
//
// === Rationality Map ===
// p1-visible-canvas-nonblank: M1/M8 | real action: boot | independent observation: canvas pixels/screenshot | empty-shell failure: blank or single-color surface fails
// p1-real-mouse-color-and-fill: M2/M3/M8 | real action: mouse click color + mouse click fill point | independent observation: snapshot progress + canvas/hash delta | empty-shell failure: UI-only or API-only fill fails
// p1-real-touch-fill: M3/M8 | real action: CDP touchStart/touchEnd at fill point | independent observation: progress/canvas delta | empty-shell failure: mouse-only implementation fails
// p1-real-image-switch-resets-work: M5/M8 | real action: fill then click image control | independent observation: broad image count + image index + progress/canvas change | empty-shell failure: token thumbnails without state or redraw fail
// p1-no-exit-image-cycle-remains-colorable: M5/M8 | real action: click next/previous image controls and fill again | independent observation: no terminal exit/level state, image index cycles, fill still changes progress/canvas | empty-shell failure: treating next image as a level exit or leaving the canvas non-colorable fails
// p1-clear-cancel-preserves-work: M6 | real action: click clear then cancel | independent observation: phase/panel + unchanged progress/canvas | empty-shell failure: immediate clear or missing cancel fails
// p1-clear-confirm-resets-work: M6/M8 | real action: click clear then confirm | independent observation: progress reset + controls still available | empty-shell failure: hidden panel only or stuck UI fails
// p2-invalid-action-rejection-invariant: M4 | contract action: invalid input | independent observation: totalBefore/totalAfter unchanged | empty-shell failure: accepting illegal actions or throwing fails
// p2-keyboard-color-and-image: M2/M5/M7 | real action: Digit2, ArrowRight, ArrowLeft | independent observation: color/image deltas and opposite direction semantics | empty-shell failure: listener-only keyboard fails
// p2-key-clear-opens-confirm: M6/M7 | real action: KeyC | independent observation: confirm phase and progress preserved | empty-shell failure: shortcut direct-clears or does nothing fails
// p2-edit-mode-rejects-fill: M9 | contract setup + real click | independent observation: unchanged filledCount/canvas | empty-shell failure: edit mode still colors fails
// p2-progress-observability-sync: M8 | contract + real fill/clear trajectory | independent observation: progress mirrors visible canvas | empty-shell failure: desynced HUD/snapshot fails

function pass(detail) { return { status: 'PASS', detail: detail || '' }; }
function fail(detail) { return { status: 'FAIL', detail: detail || '' }; }

function createGameDriver(browser) {
  const evalPage = (body) => browser.eval(`(async function(){ ${body} })()`);

  async function waitForReady() {
    for (let i = 0; i < 20; i++) {
      const ready = await evalPage(`
        const snap = await getPortableSnapshot();
        return !!(snap && snap.canvas && snap.canvas.screenW > 20 && snap.canvas.screenH > 20);

        async function getPortableSnapshot() {
          if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
            try {
              const s = await window.__gameTest.getSnapshot();
              if (s) return normalizeSnapshot(s);
            } catch (_) {}
          }
          return normalizeSnapshot(discoverSnapshot());
        }
        function normalizeSnapshot(s) { return Object.assign(discoverSnapshot(), s || {}); }
        function rectObj(el) {
          if (!el || !el.getBoundingClientRect) return null;
          const r = el.getBoundingClientRect();
          return { screenX: r.left, screenY: r.top, screenW: r.width, screenH: r.height };
        }
        function discoverSnapshot() {
          const canvas = Array.from(document.querySelectorAll('canvas')).sort((a,b) => (b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];
          const cRect = rectObj(canvas) || { screenX: 0, screenY: 0, screenW: 0, screenH: 0 };
          return { phase: 'playing', screen: 'coloring', activePanel: 'none', overlayBlocking: false, canInteractWithPlayfield: true,
            currentColorIndex: selectedIndex(findColorControls()), paletteCount: findColorControls().length,
            imageIndex: selectedIndex(findImageControls()), imageCount: findImageControls().length,
            filledCount: null, coloredPixelRatio: null,
            canvas: Object.assign({ width: canvas ? canvas.width : 0, height: canvas ? canvas.height : 0, nonBlank: !!canvas }, cRect),
            ui: { colorControls: controlsToRects(findColorControls()), imageControls: controlsToRects(findImageControls()),
              clearControl: rectObj(findButton(['clear','erase','reset','清空','重置'])) },
            samplePoints: discoverSamplePoints(canvas)
          };
        }
        function visible(el) {
          if (!el || !el.getBoundingClientRect) return false;
          const r = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          return r.width > 8 && r.height > 8 && st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
        }
        function textOf(el) { return ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '') + ' ' + (el.dataset ? Object.values(el.dataset).join(' ') : '')).toLowerCase(); }
        function findColorControls() {
          const all = Array.from(document.querySelectorAll('button,[role=button],input[type=color],select option,[data-game-color],[data-color],.color-swatch'));
          return all.filter(el => visible(el) && (el.matches('input[type=color],[data-game-color],[data-color],.color-swatch') || /color|palette|swatch|颜色|色板/.test(textOf(el)) || hasColorBackground(el))).slice(0, 16);
        }
        function hasColorBackground(el) {
          const bg = getComputedStyle(el).backgroundColor;
          return /^rgb/.test(bg) && !/rgba\\(0, 0, 0, 0\\)/.test(bg) && el.getBoundingClientRect().width >= 20 && el.getBoundingClientRect().height >= 20;
        }
        function findImageControls() {
          const all = Array.from(document.querySelectorAll('button,[role=button],img,select option,[data-game-image],[data-image],.image-thumb'));
          return all.filter(el => visible(el) && (el.matches('img,[data-game-image],[data-image],.image-thumb') || /image|template|drawing|line|picture|图|稿/.test(textOf(el)))).slice(0, 40);
        }
        function findButton(words) {
          const els = Array.from(document.querySelectorAll('button,[role=button],a,input[type=button],input[type=submit],[data-game-control]')).filter(visible);
          return els.find(el => words.some(w => textOf(el).includes(String(w).toLowerCase()))) || null;
        }
        function controlsToRects(list) { return list.map((el, index) => Object.assign({ index, selected: isSelected(el) }, rectObj(el))).filter(Boolean); }
        function selectedIndex(list) {
          const idx = list.findIndex(isSelected);
          return idx >= 0 ? idx : 0;
        }
        function isSelected(el) { return !!(el && (el.checked || el.selected || /selected|active|current/.test(String(el.className || '').toLowerCase()) || el.getAttribute('aria-pressed') === 'true')); }
        function discoverSamplePoints(canvas) {
          if (!canvas) return { fillable: [], boundary: [] };
          const r = canvas.getBoundingClientRect();
          return {
            fillable: [{ x: Math.floor(canvas.width * 0.5), y: Math.floor(canvas.height * 0.5), screenX: r.left + r.width * 0.5, screenY: r.top + r.height * 0.5 }],
            boundary: [{ x: 0, y: 0, screenX: r.left + 1, screenY: r.top + 1 }]
          };
        }
      `);
      if (ready === true) return true;
      await browser.sleep(250);
    }
    return false;
  }

  async function snapshot() {
    return await evalPage(`
      return await getPortableSnapshot();

      async function getPortableSnapshot() {
        let discovered = discoverSnapshot();
        if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
          try {
            const s = await window.__gameTest.getSnapshot();
            if (s && typeof s === 'object') discovered = mergeSnapshot(discovered, s);
          } catch (e) {
            discovered.contractError = e.message;
          }
        }
        return discovered;
      }
      function mergeSnapshot(base, s) {
        const out = Object.assign({}, base, s || {});
        out.canvas = Object.assign({}, base.canvas || {}, (s && s.canvas) || {});
        out.ui = Object.assign({}, base.ui || {}, (s && s.ui) || {});
        out.samplePoints = Object.assign({}, base.samplePoints || {}, (s && s.samplePoints) || {});
        return out;
      }
      function rectObj(el) {
        if (!el || !el.getBoundingClientRect) return null;
        const r = el.getBoundingClientRect();
        return { screenX: r.left, screenY: r.top, screenW: r.width, screenH: r.height };
      }
      function visible(el) {
        if (!el || !el.getBoundingClientRect) return false;
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        return r.width > 8 && r.height > 8 && st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
      }
      function textOf(el) { return ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '') + ' ' + (el.value || '') + ' ' + (el.dataset ? Object.values(el.dataset).join(' ') : '')).toLowerCase(); }
      function hasColorBackground(el) {
        const bg = getComputedStyle(el).backgroundColor;
        return /^rgb/.test(bg) && !/rgba\\(0, 0, 0, 0\\)/.test(bg) && el.getBoundingClientRect().width >= 20 && el.getBoundingClientRect().height >= 20;
      }
      function findColorControls() {
        const all = Array.from(document.querySelectorAll('button,[role=button],input[type=color],[data-game-color],[data-color],.color-swatch'));
        return all.filter(el => visible(el) && (el.matches('input[type=color],[data-game-color],[data-color],.color-swatch') || /color|palette|swatch|颜色|色板/.test(textOf(el)) || hasColorBackground(el))).slice(0, 16);
      }
      function findImageControls() {
        const all = Array.from(document.querySelectorAll('button,[role=button],img,[data-game-image],[data-image],.image-thumb'));
        return all.filter(el => visible(el) && (el.matches('img,[data-game-image],[data-image],.image-thumb') || /image|template|drawing|line|picture|图|稿/.test(textOf(el)))).slice(0, 40);
      }
      function findButton(words) {
        const els = Array.from(document.querySelectorAll('button,[role=button],a,input[type=button],input[type=submit],[data-game-control]')).filter(visible);
        return els.find(el => words.some(w => textOf(el).includes(String(w).toLowerCase()))) || null;
      }
      function isSelected(el) { return !!(el && (el.checked || /selected|active|current/.test(String(el.className || '').toLowerCase()) || el.getAttribute('aria-pressed') === 'true')); }
      function selectedIndex(list) {
        const idx = list.findIndex(isSelected);
        return idx >= 0 ? idx : 0;
      }
      function controlsToRects(list) { return list.map((el, index) => Object.assign({ index, selected: isSelected(el) }, rectObj(el))).filter(Boolean); }
      function discoverSamplePoints(canvas) {
        if (!canvas) return { fillable: [], boundary: [] };
        const r = canvas.getBoundingClientRect();
        let fillable = [];
        let boundary = [];
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const w = canvas.width, h = canvas.height;
          const data = ctx.getImageData(0, 0, w, h).data;
          const cssBackground = getComputedStyle(canvas).backgroundColor;
          const backgroundMatch = cssBackground.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
          const background = backgroundMatch ? [Number(backgroundMatch[1]), Number(backgroundMatch[2]), Number(backgroundMatch[3])] : null;
          for (let yy = Math.floor(h * 0.15); yy < h * 0.9 && fillable.length < 3; yy += Math.max(4, Math.floor(h / 18))) {
            for (let xx = Math.floor(w * 0.15); xx < w * 0.9 && fillable.length < 3; xx += Math.max(4, Math.floor(w / 18))) {
              const p = (yy * w + xx) * 4;
              const r0 = data[p], g0 = data[p+1], b0 = data[p+2], a0 = data[p+3];
              if (a0 > 0 && r0 > 180 && g0 > 180 && b0 > 180) fillable.push(point(canvas, xx, yy));
              if (a0 > 0 && r0 < 70 && g0 < 70 && b0 < 70 && boundary.length < 3) boundary.push(point(canvas, xx, yy));
            }
          }
        } catch (_) {}
        if (!fillable.length) fillable.push(point(canvas, Math.floor(canvas.width * 0.5), Math.floor(canvas.height * 0.5)));
        if (!boundary.length) boundary.push(point(canvas, 0, 0));
        return { fillable, boundary };
      }
      function point(canvas, x, y) {
        const r = canvas.getBoundingClientRect();
        return { x, y, screenX: r.left + (x / Math.max(1, canvas.width)) * r.width, screenY: r.top + (y / Math.max(1, canvas.height)) * r.height };
      }
      function canvasDiversity(canvas) {
        if (!canvas) return { ok: false, unique: 0, lumaRange: 0 };
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const w = canvas.width, h = canvas.height;
          const data = ctx.getImageData(0, 0, w, h).data;
          const seen = new Set();
          let min = 255, max = 0, samples = 0;
          for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 25))) {
            for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 25))) {
              const p = (y * w + x) * 4;
              const alpha = data[p + 3] / 255;
              const r = background ? Math.round(data[p] * alpha + background[0] * (1 - alpha)) : data[p];
              const g = background ? Math.round(data[p + 1] * alpha + background[1] * (1 - alpha)) : data[p + 1];
              const b = background ? Math.round(data[p + 2] * alpha + background[2] * (1 - alpha)) : data[p + 2];
              const l = Math.round((r + g + b) / 3);
              min = Math.min(min, l); max = Math.max(max, l);
              seen.add(r + ',' + g + ',' + b);
              samples++;
            }
          }
          return { ok: seen.size >= 2 && max - min > 20, unique: seen.size, lumaRange: max - min, samples };
        } catch (e) {
          return { ok: true, unique: null, lumaRange: null, tainted: true };
        }
      }
      function discoverSnapshot() {
        const canvas = Array.from(document.querySelectorAll('canvas')).sort((a,b) => (b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];
        const colors = findColorControls();
        const images = findImageControls();
        const modalVisible = Array.from(document.querySelectorAll('[role=dialog],dialog,.modal,[data-game-panel]')).some(el => visible(el) && /clear|confirm|cancel|erase|reset|清空|确认|取消/.test(textOf(el)));
        const cRect = rectObj(canvas) || { screenX: 0, screenY: 0, screenW: 0, screenH: 0 };
        return {
          phase: modalVisible ? 'confirm-clear' : 'playing',
          screen: 'coloring',
          activePanel: modalVisible ? 'clear-confirm' : 'none',
          overlayBlocking: modalVisible,
          canInteractWithPlayfield: !!canvas && !modalVisible,
          currentColorIndex: selectedIndex(colors),
          paletteCount: colors.length,
          imageIndex: selectedIndex(images),
          imageCount: images.length,
          filledCount: null,
          coloredPixelRatio: null,
          canvas: Object.assign({ width: canvas ? canvas.width : 0, height: canvas ? canvas.height : 0, nonBlank: !!canvas, diversity: canvasDiversity(canvas) }, cRect),
          samplePoints: discoverSamplePoints(canvas),
          ui: { colorControls: controlsToRects(colors), imageControls: controlsToRects(images),
            clearControl: rectObj(findButton(['clear','erase','reset','清空','重置'])),
            confirmControl: rectObj(findButton(['yes','confirm','ok','clear','确认','清空'])),
            cancelControl: rectObj(findButton(['cancel','no','back','取消','否'])) }
        };
      }
    `);
  }

  async function contractInput(action) {
    return await browser.eval(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { ok:false, reason:'missing __gameTest.input' };
      try {
        const r = await window.__gameTest.input(${JSON.stringify(action)});
        if (r && r.snapshot) return r;
        const snap = window.__gameTest.getSnapshot ? await window.__gameTest.getSnapshot() : null;
        return { ok: !(r && r.ok === false), reason: r && r.reason, snapshot: snap || r };
      } catch (e) {
        return { ok:false, reason:e.message, threw:true };
      }
    })()`);
  }

  async function reset(options) {
    return await browser.eval(`(async function(){
      if (window.__gameTest && typeof window.__gameTest.reset === 'function') {
        try { return await window.__gameTest.reset(${JSON.stringify(options || {})}); } catch (e) { return { error:e.message }; }
      }
      return null;
    })()`);
  }

  async function loadScenario(name) {
    return await browser.eval(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { ok:false, reason:'missing loadScenario' };
      try { return await window.__gameTest.loadScenario(${JSON.stringify(name)}); } catch (e) { return { ok:false, reason:e.message, threw:true }; }
    })()`);
  }

  async function clickPoint(point) {
    if (!point || !Number.isFinite(point.screenX) || !Number.isFinite(point.screenY)) return false;
    const x = Number.isFinite(point.left) && Number.isFinite(point.screenW) && point.screenW > 4
      ? point.left + point.screenW / 2
      : Number.isFinite(point.screenW) && point.screenW > 4 ? point.screenX + point.screenW / 2 : point.screenX;
    const y = Number.isFinite(point.top) && Number.isFinite(point.screenH) && point.screenH > 4
      ? point.top + point.screenH / 2
      : Number.isFinite(point.screenH) && point.screenH > 4 ? point.screenY + point.screenH / 2 : point.screenY;
    await browser.mouseClick(x, y);
    await browser.sleep(250);
    return true;
  }

  async function touchPoint(point) {
    if (!point || !Number.isFinite(point.screenX) || !Number.isFinite(point.screenY)) return false;
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.screenX, y: point.screenY, radiusX: 2, radiusY: 2, force: 1 }] });
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await browser.sleep(250);
    return true;
  }

  async function clickColor(index) {
    const s = await snapshot();
    const c = s.ui && s.ui.colorControls && s.ui.colorControls[index];
    return await clickPoint(c);
  }

  async function clickImage(index) {
    const s = await snapshot();
    const c = s.ui && s.ui.imageControls && s.ui.imageControls[index];
    return await clickPoint(c);
  }

  async function clickClear() {
    const s = await snapshot();
    return await clickPoint(s.ui && s.ui.clearControl);
  }

  async function clickConfirm() {
    const s = await snapshot();
    return await clickPoint(s.ui && s.ui.confirmControl);
  }

  async function clickCancel() {
    const s = await snapshot();
    return await clickPoint(s.ui && s.ui.cancelControl);
  }

  function progressValue(s) {
    const n = Number(s && s.filledCount);
    if (Number.isFinite(n)) return n;
    const r = Number(s && s.coloredPixelRatio);
    if (Number.isFinite(r)) return r;
    return null;
  }

  function totalProgress(s) {
    const p = progressValue(s);
    const image = Number(s && s.imageIndex);
    const color = Number(s && s.currentColorIndex);
    return `${Number.isFinite(image) ? image : 'x'}:${Number.isFinite(color) ? color : 'x'}:${p == null ? 'na' : p}`;
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  return {
    waitForReady, snapshot, reset, loadScenario, contractInput,
    clickPoint, touchPoint, clickColor, clickImage, clickClear, clickConfirm, clickCancel,
    progressValue, totalProgress, canvasHash
  };
}

const suite = [
  {
    id: 'p0-boot-no-fatal',
    name: 'P0 boot has no fatal runtime errors',
    level: 'P0',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const fatal = (browser.exceptions || []).filter(e => !/ResizeObserver/i.test(e.description || e.text || ''));
      if (fatal.length) return fail(`runtime exceptions: ${fatal.slice(0, 2).map(e => e.description || e.text).join(' | ')}`);
      const game = createGameDriver(browser);
      const ready = await game.waitForReady();
      if (!ready) return fail('visible drawing surface was not ready');
      return pass('page loaded and drawing surface is ready');
    }
  },
  {
    id: 'p0-contract-and-ui',
    name: 'P0 public contract or discoverable UI exposes coloring controls',
    level: 'P0',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const hasContract = await browser.eval(`!!(window.__gameTest && typeof window.__gameTest.getSnapshot === 'function' && typeof window.__gameTest.input === 'function' && typeof window.__gameTest.reset === 'function')`);
      const s = await game.snapshot();
      if (!s.canvas || s.canvas.screenW < 20 || s.canvas.screenH < 20) return fail('canvas/playfield geometry missing');
      if (Number(s.paletteCount) < 8) return fail(`paletteCount < 8 (${s.paletteCount})`);
      if (Number(s.imageCount) < 8) return fail(`imageCount < 8 (${s.imageCount})`);
      if (!hasContract) return fail('window.__gameTest reset/input/getSnapshot contract is missing');
      return pass(`contract present, palette=${s.paletteCount}, images=${s.imageCount}`);
    }
  },
  {
    id: 'p1-visible-canvas-nonblank',
    name: 'P1 visible canvas contains readable line art',
    level: 'P1',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const before = await game.snapshot();
      await game.waitForReady();
      const after = await game.snapshot();
      const s = after;
      const d = after.canvas && after.canvas.diversity;
      const changed = !before.canvas || before.canvas.screenW !== after.canvas.screenW || before.canvas.screenH !== after.canvas.screenH ||
        (before.canvas.diversity && after.canvas.diversity && before.canvas.diversity.unique !== after.canvas.diversity.unique);
      if (!after.canvas || !after.canvas.nonBlank || after.canvas.screenW < 80 || after.canvas.screenH < 80) return fail('main drawing surface too small or missing');
      if (d && d.ok === false) return fail(`canvas lacks pixel diversity unique=${d.unique} range=${d.lumaRange}`);
      const hash = await game.canvasHash();
      if (hash == null && (!d || !d.ok)) return fail('no readable canvas or screenshot evidence');
      return pass(`canvas ${Math.round(s.canvas.screenW)}x${Math.round(s.canvas.screenH)} visible; changed=${changed}`);
    }
  },
  {
    id: 'p1-real-mouse-color-and-fill',
    name: 'P1 real mouse click selects color and fills a region',
    level: 'P1',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const before = await game.snapshot();
      const colorIndex = Math.min(1, Math.max(0, Number(before.paletteCount || 1) - 1));
      if (!(await game.clickColor(colorIndex))) return fail('could not click a color control');
      const afterColor = await game.snapshot();
      if (Number(afterColor.currentColorIndex) === Number(before.currentColorIndex) && Number(before.paletteCount) > 1) {
        return fail('mouse click on color control did not change current color');
      }
      const points = afterColor.samplePoints && afterColor.samplePoints.fillable || [];
      if (!points.length) return fail('no fillable point for mouse click');
      let afterFill = null;
      let progressChanged = false;
      for (const point of points) {
        const hashBefore = await game.canvasHash();
        const progressBefore = game.progressValue(await game.snapshot());
        if (!(await game.clickPoint(point))) continue;
        const candidate = await game.snapshot();
        if (Number(candidate.imageIndex) !== Number(afterColor.imageIndex)) {
          return fail('fill unexpectedly changed imageIndex');
        }
        const hashAfter = await game.canvasHash();
        const progressAfter = game.progressValue(candidate);
        const candidateProgressChanged = progressBefore == null || progressAfter == null ? false : progressAfter > progressBefore;
        const candidateCanvasChanged = hashBefore !== hashAfter;
        if (candidateProgressChanged || candidateCanvasChanged) {
          afterFill = candidate;
          progressChanged = candidateProgressChanged;
          break;
        }
      }
      if (!afterFill) return fail('mouse fill did not change progress or canvas at any advertised fillable point');
      return pass(`mouse fill changed ${progressChanged ? 'progress' : 'canvas'}`);
    }
  },
  {
    id: 'p1-real-touch-fill',
    name: 'P1 real touch fills a region',
    level: 'P1',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const before = await game.snapshot();
      const point = before.samplePoints && before.samplePoints.fillable && before.samplePoints.fillable[1] || before.samplePoints.fillable[0];
      const progressBefore = game.progressValue(before);
      const hashBefore = await game.canvasHash();
      if (!(await game.touchPoint(point))) return fail('no fillable point for touch input');
      const after = await game.snapshot();
      const progressAfter = game.progressValue(after);
      const hashAfter = await game.canvasHash();
      const progressChanged = progressBefore == null || progressAfter == null ? false : progressAfter > progressBefore;
      if (!progressChanged && hashBefore === hashAfter) return fail('touch input did not change progress or canvas');
      return pass('touch input produced fill feedback');
    }
  },
  {
    id: 'p1-real-image-switch-resets-work',
    name: 'P1 real click switches line art and resets current work',
    level: 'P1',
    timeoutMs: 22000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      let s = await game.snapshot();
      if (Number(s.imageCount) < 8) return fail(`image catalog too small (${s.imageCount})`);
      const fillPoint = s.samplePoints && s.samplePoints.fillable && s.samplePoints.fillable[0];
      await game.clickPoint(fillPoint);
      const filled = await game.snapshot();
      const hashFilled = await game.canvasHash();
      const nextIndex = Number(filled.imageIndex) === 1 ? 0 : 1;
      if (!(await game.clickImage(nextIndex))) return fail('could not click an alternate image control');
      const switched = await game.snapshot();
      const hashSwitched = await game.canvasHash();
      if (Number(switched.imageIndex) === Number(filled.imageIndex) && Number(switched.imageCount) > 1) return fail('image index did not change after real click');
      const p = game.progressValue(switched);
      const filledProgress = game.progressValue(filled);
      if (p != null && filledProgress != null && p > filledProgress) return fail('switching images increased fill progress unexpectedly');
      if (hashFilled === hashSwitched && Number(switched.imageIndex) === Number(filled.imageIndex)) return fail('image switch produced no visible or state change');
      const canStillFill = switched.canInteractWithPlayfield !== false;
      if (!canStillFill) return fail('playfield not interactable after image switch');
      return pass(`image switched to ${switched.imageIndex}`);
    }
  },
  {
    id: 'p1-no-exit-image-cycle-remains-colorable',
    name: 'P1 image next/previous cycle has no level exit and remains colorable',
    level: 'P1',
    timeoutMs: 24000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const before = await game.snapshot();
      if (Number(before.imageCount) < 8) return fail(`image catalog too small (${before.imageCount})`);
      if (!(await game.clickImage(1))) return fail('could not click next image control');
      const next = await game.snapshot();
      if (Number(next.imageIndex) === Number(before.imageIndex)) return fail('next image control did not change imageIndex');
      if (/win|lose|level|exit|complete|game-over/i.test(String(next.phase || '') + ' ' + String(next.activePanel || ''))) {
        return fail(`image switch incorrectly entered terminal/level exit state phase=${next.phase} panel=${next.activePanel}`);
      }
      const bounds = next.canvas && { width: Number(next.canvas.screenW), height: Number(next.canvas.screenH) };
      if (!bounds || bounds.width < 20 || bounds.height < 20) return fail('image switch lost visible canvas bounds');
      if (next.canInteractWithPlayfield === false || next.overlayBlocking === true) return fail('image switch left playfield blocked');
      const point = next.samplePoints && next.samplePoints.fillable && next.samplePoints.fillable[0];
      const progressBefore = game.progressValue(next);
      const hashBefore = await game.canvasHash();
      if (!(await game.clickPoint(point))) return fail('could not fill after image switch');
      const filled = await game.snapshot();
      const progressAfter = game.progressValue(filled);
      const hashAfter = await game.canvasHash();
      const canFill = progressBefore != null && progressAfter != null ? progressAfter > progressBefore : hashAfter !== hashBefore;
      if (!canFill) return fail('switched image was not colorable');
      if (!(await game.clickImage(0))) return fail('could not click previous/original image control');
      const back = await game.snapshot();
      if (Number(back.imageIndex) !== Number(before.imageIndex)) return fail('previous/original image control did not return to the starting image');
      return pass('image catalog cycle stayed in coloring mode and remained colorable');
    }
  },
  {
    id: 'p1-clear-cancel-preserves-work',
    name: 'P1 clear cancel preserves colored work',
    level: 'P1',
    timeoutMs: 22000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const setup = await game.loadScenario('one_region_colored');
      if (!setup || setup.error || setup.ok === false) return fail('colored precondition scenario could not be loaded');
      const colored = await game.snapshot();
      const totalBefore = game.totalProgress(colored);
      const progressSetup = game.progressValue(colored);
      if (progressSetup == null || progressSetup <= 0) return fail(`colored precondition was not established progress=${progressSetup}`);
      if (!(await game.clickClear())) return fail('clear control could not be clicked');
      const modal = await game.snapshot();
      if (modal.phase !== 'confirm-clear' && modal.activePanel !== 'clear-confirm' && modal.overlayBlocking !== true) return fail('clear did not open a blocking confirmation state');
      if (!(await game.clickCancel())) return fail('cancel control could not be clicked');
      const after = await game.snapshot();
      const totalAfter = game.totalProgress(after);
      const progressBefore = game.progressValue(colored);
      const progressAfter = game.progressValue(after);
      const unchanged = totalBefore === totalAfter && (progressBefore == null || progressAfter == null || progressAfter === progressBefore);
      if (!unchanged) return fail(`cancel did not preserve work totalBefore=${totalBefore} totalAfter=${totalAfter}`);
      if (after.phase === 'confirm-clear' || after.overlayBlocking === true) return fail('cancel left confirmation overlay blocking playfield');
      return pass('cancel preserved work and closed confirmation');
    }
  },
  {
    id: 'p1-clear-confirm-resets-work',
    name: 'P1 clear confirm resets colored work',
    level: 'P1',
    timeoutMs: 22000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const setup = await game.loadScenario('one_region_colored');
      if (!setup || setup.ok === false) return fail('colored precondition scenario could not be loaded');
      const colored = await game.snapshot();
      const progressColored = game.progressValue(colored);
      if (progressColored == null || progressColored <= 0) return fail('colored precondition was not established');
      if (!(await game.clickClear())) return fail('clear control could not be clicked');
      const beforeConfirm = await game.snapshot();
      if (beforeConfirm.phase !== 'confirm-clear' && beforeConfirm.activePanel !== 'clear-confirm' && beforeConfirm.overlayBlocking !== true) return fail('clear confirmation not visible before confirm');
      if (!(await game.clickConfirm())) return fail('confirm control could not be clicked');
      const after = await game.snapshot();
      const progressAfter = game.progressValue(after);
      if (after.phase === 'confirm-clear' || after.overlayBlocking === true) return fail('confirmation remained open after clear');
      if (progressColored != null && progressAfter != null && progressAfter >= progressColored) return fail(`clear did not reduce progress ${progressColored} -> ${progressAfter}`);
      if (Number(after.paletteCount) < 8 || Number(after.imageCount) < 8) return fail('controls disappeared after clearing');
      return pass('confirm clear reset work and kept controls available');
    }
  },
  {
    id: 'p2-invalid-action-rejection-invariant',
    name: 'P2 contract rejects invalid actions and preserves invariant',
    level: 'P2',
    timeoutMs: 15000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const before = await game.snapshot();
      const totalBefore = game.totalProgress(before);
      const invalids = [
        { type: 'selectColor', index: -1 },
        { type: 'selectImage', index: 9999 },
        { type: 'fill', x: -50, y: -50 },
        { type: 'unknownAction' }
      ];
      for (const action of invalids) {
        const r = await game.contractInput(action);
        if (r && r.threw) return fail(`invalid action threw: ${action.type}`);
      }
      const after = await game.snapshot();
      const totalAfter = game.totalProgress(after);
      const unchanged = totalBefore === totalAfter;
      if (!unchanged) return fail(`invalid actions changed invariant totalBefore=${totalBefore} totalAfter=${totalAfter}`);
      return pass('invalid actions rejected or left state unchanged');
    }
  },
  {
    id: 'p2-keyboard-color-and-image',
    name: 'P2 real keyboard color selection and opposite image directions',
    level: 'P2',
    timeoutMs: 20000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const before = await game.snapshot();
      await browser.keyDown('Digit2');
      await browser.keyUp('Digit2');
      await browser.sleep(200);
      const afterDigit = await game.snapshot();
      if (Number(before.paletteCount) > 1 && Number(afterDigit.currentColorIndex) === Number(before.currentColorIndex)) return fail('Digit2 did not change current color');
      await browser.keyDown('ArrowRight');
      await browser.keyUp('ArrowRight');
      await browser.sleep(250);
      const afterRight = await game.snapshot();
      await browser.keyDown('ArrowLeft');
      await browser.keyUp('ArrowLeft');
      await browser.sleep(250);
      const afterLeft = await game.snapshot();
      const count = Number(afterLeft.imageCount || afterRight.imageCount || before.imageCount);
      if (count > 1 && Number(afterRight.imageIndex) === Number(afterDigit.imageIndex)) return fail('ArrowRight did not advance image');
      if (count > 1 && Number(afterLeft.imageIndex) !== Number(afterDigit.imageIndex)) return fail('ArrowLeft did not reverse ArrowRight direction');
      const rightDelta = ((Number(afterRight.imageIndex) - Number(afterDigit.imageIndex) + count) % count);
      const leftDelta = ((Number(afterLeft.imageIndex) - Number(afterRight.imageIndex) + count) % count);
      const directionOpposite = count <= 1 || (rightDelta === 1 && leftDelta === count - 1);
      if (!directionOpposite) return fail(`left/right direction not opposite: rightDelta=${rightDelta}, leftDelta=${leftDelta}`);
      return pass('keyboard color and opposite image directions work');
    }
  },
  {
    id: 'p2-key-clear-opens-confirm',
    name: 'P2 real keyboard clear opens confirmation without immediate erase',
    level: 'P2',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const s = await game.snapshot();
      await game.clickPoint(s.samplePoints && s.samplePoints.fillable && s.samplePoints.fillable[0]);
      const colored = await game.snapshot();
      const totalBefore = game.totalProgress(colored);
      await browser.keyDown('KeyC');
      await browser.keyUp('KeyC');
      await browser.sleep(250);
      const after = await game.snapshot();
      const totalAfter = game.totalProgress(after);
      if (after.phase !== 'confirm-clear' && after.activePanel !== 'clear-confirm' && after.overlayBlocking !== true) return fail('clear shortcut did not open confirmation');
      const unchanged = totalBefore === totalAfter;
      if (!unchanged) return fail(`clear shortcut erased before confirmation totalBefore=${totalBefore} totalAfter=${totalAfter}`);
      return pass('keyboard clear opened confirmation and preserved work');
    }
  },
  {
    id: 'p2-edit-mode-rejects-fill',
    name: 'P2 edit mode rejects canvas fill',
    level: 'P2',
    timeoutMs: 18000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      const loaded = await game.loadScenario('edit_mode');
      if (!loaded || loaded.ok === false) return fail('missing or rejected loadScenario("edit_mode") contract');
      await game.waitForReady();
      const before = await game.snapshot();
      const totalBefore = game.totalProgress(before);
      const hashBefore = await game.canvasHash();
      const point = before.samplePoints && before.samplePoints.fillable && before.samplePoints.fillable[0];
      await game.clickPoint(point);
      const after = await game.snapshot();
      const totalAfter = game.totalProgress(after);
      const hashAfter = await game.canvasHash();
      const unchanged = totalBefore === totalAfter || hashBefore === hashAfter;
      if (!unchanged) return fail(`edit mode allowed fill totalBefore=${totalBefore} totalAfter=${totalAfter}`);
      return pass('edit mode rejected fill input');
    }
  },
  {
    id: 'p2-progress-observability-sync',
    name: 'P2 progress observability syncs with fill and clear',
    level: 'P2',
    timeoutMs: 22000,
    run: async ({ browser }) => {
      const game = createGameDriver(browser);
      await game.reset({ imageIndex: 0, colorIndex: 0 });
      await game.waitForReady();
      const blank = await game.snapshot();
      const p0 = game.progressValue(blank);
      const hash0 = await game.canvasHash();
      const fillable = blank.samplePoints && blank.samplePoints.fillable || [];
      let p1 = p0;
      let hash1 = hash0;
      let fillObserved = false;
      for (const point of fillable) {
        if (!(await game.clickPoint(point))) continue;
        const filled = await game.snapshot();
        p1 = game.progressValue(filled);
        hash1 = await game.canvasHash();
        const progressChanged = p0 != null && p1 != null && p1 > p0;
        const canvasChanged = hash0 != null && hash1 != null && hash0 !== hash1;
        if (progressChanged || canvasChanged) {
          fillObserved = true;
          break;
        }
      }
      if (!fillObserved) return fail(`neither progress summary nor canvas changed after fill ${p0} -> ${p1}`);
      if (p0 != null && p1 != null && !(p1 > p0)) return fail(`progress did not increase after fill ${p0} -> ${p1}`);
      if (hash0 != null && hash1 != null && hash0 === hash1) return fail('canvas did not change after fill');
      if (!(await game.clickClear())) return fail('clear control could not be clicked');
      const beforeConfirm = await game.snapshot();
      if (beforeConfirm.phase !== 'confirm-clear' && beforeConfirm.activePanel !== 'clear-confirm' && beforeConfirm.overlayBlocking !== true) {
        return fail('clear confirmation not visible before confirm');
      }
      if (!(await game.clickConfirm())) return fail('confirm control could not be clicked');
      const cleared = await game.snapshot();
      const p2 = game.progressValue(cleared);
      const hash2 = await game.canvasHash();
      if (cleared.phase === 'confirm-clear' || cleared.activePanel === 'clear-confirm' || cleared.overlayBlocking === true) {
        return fail('confirmation remained open after clear');
      }
      if (p1 != null && p2 != null && p2 >= p1) return fail(`progress did not decrease after confirm clear ${p1} -> ${p2}`);
      if (hash1 != null && hash2 != null && hash1 === hash2) return fail('canvas did not change after confirm clear');
      return pass('progress/canvas observations track fill and clear');
    }
  }
];

module.exports = { suite };
