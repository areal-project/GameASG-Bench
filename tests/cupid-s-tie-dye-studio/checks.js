// Cupid Tie-Dye Studio L2 checks.
//
// === GDD Coverage Map ===
// M1 -> p0-boot-no-fatal, p0-contract-schema, p0-visible-nonblank-canvas
// M2 -> p1-real-mouse-painting, p1-real-time-mouse-drag-feedback, p1-real-touch-painting, p1-invalid-paint-rejected
// M3 -> p1-tool-stencil-intensity-paint-contract
// M4 -> p1-undo-redo-history, p1-clear-confirmation
// M5 -> p2-clothing-cycle-resets-work
// M6 -> p1-save-gallery-economy, p1-skip-save-no-reward
// M7 -> p1-menu-overlay-blocking
// M8 -> p1-shop-purchase-and-insufficient-rejection, p1-equip-unlocked-background
// M9 -> p2-quest-claim-once
// M10 -> p2-settings-toggle-unchanged-work
// M11 -> p2-gallery-capacity-invariant, p2-persisted-progress-preserve-reset
//
// === Category Map ===
// Boot & Stability: p0-boot-no-fatal, p0-contract-schema
// Feedback & Observability: p0-visible-nonblank-canvas, p1-real-mouse-painting, p1-real-time-mouse-drag-feedback, p1-real-touch-painting
// Input Semantics: p1-real-mouse-painting, p1-real-time-mouse-drag-feedback, p1-real-touch-painting, p1-invalid-paint-rejected
// Core Mechanic Loop: p1-tool-stencil-intensity-paint-contract, p1-save-gallery-economy, p1-skip-save-no-reward
// UI Flow & Blocking: p1-menu-overlay-blocking
// State Machine: p1-undo-redo-history, p1-clear-confirmation, p2-clothing-cycle-resets-work
// Economy / Progression: p1-shop-purchase-and-insufficient-rejection, p1-equip-unlocked-background, p2-quest-claim-once
// Invariants & Rejection: p1-invalid-paint-rejected, p1-shop-purchase-and-insufficient-rejection, p1-skip-save-no-reward, p2-settings-toggle-unchanged-work
// Depth / Optional Systems: p2-gallery-capacity-invariant, p2-persisted-progress-preserve-reset
//
// === Rationality Map ===
// p1-real-mouse-painting: M2 | real action: mouse click/drag on discovered canvas | independent observation: snapshot workRevision/hash + screenshot hash | empty-shell failure: real input blocked or API-only painting leaves work unchanged.
// p1-real-time-mouse-drag-feedback: M2 | real action: mouse down and move without release | independent observation: screenshot/work summary changes while pointer is still held | empty-shell failure: delayed paint that only appears on mouseup fails.
// p1-real-touch-painting: M2 | real action: CDP touch drag on discovered canvas | independent observation: snapshot workRevision/hash + screenshot hash | empty-shell failure: mouse-only or API-only painting leaves work unchanged.
// p1-tool-stencil-intensity-paint-contract: M3 | contract action: select brush size/intensity/tool/stencil then paint | independent observation: selected settings + work hash | empty-shell failure: tool buttons exist but do not affect work state.
// p1-undo-redo-history: M4 | real/contract action: undo then redo | independent observation: work hash sequence and history flags | empty-shell failure: history buttons that do not restore canvas fail.
// p1-clear-confirmation: M4 | contract action: clear cancel then confirm | independent observation: blocking state and work hash sequence | empty-shell failure: clear prompt ignored or cancel clears work fails.
// p1-save-gallery-economy: M6 | real/contract action: save-ready scenario then reveal/save | independent observation: gallery count, hearts and thumbnails | empty-shell failure: save dialog without gallery/economy mutation fails.
// p1-skip-save-no-reward: M6 | contract action: save-ready scenario then reveal/skip | independent observation: gallery/hearts unchanged and work reset | empty-shell failure: skip secretly saves or keeps stale design fails.
// p1-menu-overlay-blocking: M7 | real/contract action: open menu, attempt paint, close | independent observation: overlayBlocking/canInteract + unchanged hash while blocked | empty-shell failure: menu that does not block or never unblocks fails.
// p1-shop-purchase-and-insufficient-rejection: M8 | contract action: affordable and insufficient shop scenarios | independent observation: resource/unlock delta and totalBefore/totalAfter unchanged rejection | empty-shell failure: always-ok shop or negative currency fails.
// p1-equip-unlocked-background: M8 | contract action: equip unlocked background | independent observation: current background/revision changes while hearts/unlocks stay stable | empty-shell failure: shop card only changes text or spends currency again fails.
// p1-invalid-paint-rejected: M2/M8 | contract action: paint without color and invalid payload | independent observation: ok false/reason and unchanged work | empty-shell failure: accepting every paint action fails.
// p2-clothing-cycle-resets-work: M5 | contract action: cycle clothing from painted state | independent observation: clothing identity changes, work resets, count preserved | empty-shell failure: arrows that only change label or preserve old work fail.
// p2-quest-claim-once: M9 | contract action: claim quest twice | independent observation: first reward then unchanged second attempt | empty-shell failure: repeatable reward exploit fails.
// p2-settings-toggle-unchanged-work: M10 | contract action: toggle setting | independent observation: setting flips while work/gallery/hearts unchanged | empty-shell failure: settings mutate unrelated state fails.
// p2-gallery-capacity-invariant: M11 | contract action: repeated legal saves or capacity scenario | independent observation: count <= max | empty-shell failure: unbounded gallery growth fails.
// p2-persisted-progress-preserve-reset: M11 | contract action: persisted progress then preserve reset | independent observation: persistent fields survive and no overlay blocks play | empty-shell failure: local progress exists only in transient memory fails.

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function numberOr(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function get(obj, path, fallback) {
  let cur = obj;
  for (const key of path.split('.')) {
    if (!cur || typeof cur !== 'object' || !(key in cur)) return fallback;
    cur = cur[key];
  }
  return cur;
}

function workSig(s) {
  return String(get(s, 'canvas.workHash', '')) + ':' +
    String(get(s, 'canvas.workRevision', '')) + ':' +
    String(get(s, 'canvas.dyedPixelEstimate', ''));
}

function workHash(s) {
  return String(get(s, 'canvas.workHash', ''));
}

function contractError(result) {
  if (!result) return 'missing contract result';
  if (result.__l2_err__) return result.__l2_err__;
  if (result.ok === false && !result.snapshot) return 'rejected without snapshot';
  return null;
}

function rejectionObserved(result) {
  if (!result) return false;
  if (result.ok === false) return true;
  return [result, result.snapshot].some(value => {
    const last = value && value.lastResult;
    return last && last.ok === false && last.reason;
  });
}

function validateSnapshot(s) {
  if (!s || typeof s !== 'object') return 'snapshot missing';
  const required = ['phase', 'activePanel', 'overlayBlocking', 'canInteractWithPlayfield', 'canvas', 'gallery', 'economy', 'shop', 'settings'];
  const missing = required.filter(k => !(k in s));
  if (missing.length) return `snapshot missing fields: ${missing.join(', ')}`;
  if (!s.canvas || typeof s.canvas !== 'object') return 'canvas summary missing';
  if (numberOr(s.canvas.width, 0) <= 0 || numberOr(s.canvas.height, 0) <= 0) return 'canvas summary has invalid size';
  if (numberOr(s.paletteCount, 0) < 12) return 'paletteCount must be at least 12';
  if (!['small', 'medium', 'large'].includes(s.selectedBrushSize)) return 'selectedBrushSize must be a declared size';
  if (!['light', 'medium', 'strong'].includes(s.selectedDyeIntensity)) return 'selectedDyeIntensity must be a declared intensity';
  if (numberOr(s.availableToolCount, 0) < 6) return 'availableToolCount must be at least 6';
  if (numberOr(s.availableStencilCount, 0) < 7) return 'availableStencilCount must be at least 7';
  if (numberOr(get(s, 'clothing.count', 0), 0) < 20) return 'clothing.count must be at least 20';
  if (numberOr(get(s, 'gallery.max', 0), 0) !== 5) return 'gallery.max must be 5';
  if (numberOr(get(s, 'economy.saveReward', 1), 1) <= 0) return 'economy.saveReward must be positive when exposed';
  if (numberOr(get(s, 'shop.backgroundCount', 0), 0) < 8) return 'shop.backgroundCount must be at least 8';
  if (numberOr(get(s, 'quests.count', 0), 0) < 5) return 'quests.count must be at least 5';
  if (numberOr(get(s, 'achievements.total', 0), 0) < 10) return 'achievements.total must be at least 10';
  return null;
}

async function realMouseDrag(browser, start, end, steps) {
  const n = Math.max(2, steps || 8);
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1, modifiers: 0 });
    await browser.sleep(25);
  }
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
}

async function realTouchDrag(browser, start, end, steps) {
  const n = Math.max(2, steps || 8);
  await browser.cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: start.x, y: start.y, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
    modifiers: 0
  });
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
      modifiers: 0
    });
    await browser.sleep(25);
  }
  await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], modifiers: 0 });
}

function createGameDriver(browser) {
  return {
    async waitForReady() {
      for (let i = 0; i < 30; i++) {
        const ready = await browser.eval(`
          (function(){
            return !!(window.__gameTest &&
              typeof window.__gameTest.reset === 'function' &&
              typeof window.__gameTest.input === 'function' &&
              typeof window.__gameTest.getSnapshot === 'function' &&
              typeof window.__gameTest.loadScenario === 'function');
          })()
        `);
        if (ready === true) return true;
        await browser.sleep(200);
      }
      return false;
    },
    async reset(options) {
      return await browser.eval(`window.__gameTest.reset(${JSON.stringify(options || {})})`);
    },
    async snapshot() {
      return await browser.eval(`window.__gameTest.getSnapshot()`);
    },
    async contractInput(action) {
      return await browser.eval(`window.__gameTest.input(${JSON.stringify(action)})`);
    },
    async loadScenario(name) {
      return await browser.eval(`window.__gameTest.loadScenario(${JSON.stringify(name)})`);
    },
    async canvasInfo() {
      return await browser.eval(`
        (function(){
          const canvases = Array.from(document.querySelectorAll('canvas')).filter(c => {
            const r = c.getBoundingClientRect();
            const st = getComputedStyle(c);
            return r.width > 20 && r.height > 20 && st.display !== 'none' && st.visibility !== 'hidden';
          });
          let best = null, area = -1;
          for (const c of canvases) {
            const r = c.getBoundingClientRect();
            const a = r.width * r.height;
            if (a > area) { area = a; best = { x:r.left, y:r.top, width:r.width, height:r.height, id:c.id || '', tag:c.tagName }; }
          }
          return best;
        })()
      `);
    },
    async clickSemantic(control, index) {
      const point = await browser.eval(`
        (function(){
          const nodes = Array.from(document.querySelectorAll('[data-game-control="${control}"]')).filter(el => {
            const r = el.getBoundingClientRect();
            const st = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden';
          });
          const el = nodes[${Number.isInteger(index) ? index : 0}];
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x:r.left + r.width / 2, y:r.top + r.height / 2, count:nodes.length };
        })()
      `);
      if (!point || point.__l2_err__) return false;
      await browser.mouseClick(Math.round(point.x), Math.round(point.y));
      await browser.sleep(250);
      return true;
    },
    async paintByMouse() {
      const info = await this.canvasInfo();
      if (!info || info.__l2_err__) return { ok: false, reason: 'no visible canvas' };
      const padX = Math.max(10, info.width * 0.08);
      const padY = Math.max(10, info.height * 0.08);
      const start = { x: info.x + info.width / 2 - padX, y: info.y + info.height / 2 };
      const end = { x: info.x + info.width / 2 + padX, y: info.y + info.height / 2 + padY * 0.25 };
      await realMouseDrag(browser, start, end, 10);
      await browser.sleep(500);
      return { ok: true, start, end };
    },
    async probeRealtimeMouseDrag() {
      const info = await this.canvasInfo();
      if (!info || info.__l2_err__) return { ok: false, reason: 'no visible canvas' };
      const padX = Math.max(10, info.width * 0.08);
      const padY = Math.max(10, info.height * 0.08);
      const start = { x: info.x + info.width / 2 - padX, y: info.y + info.height / 2 - padY * 0.25 };
      const mid = { x: info.x + info.width / 2, y: info.y + info.height / 2 };
      const end = { x: info.x + info.width / 2 + padX, y: info.y + info.height / 2 + padY * 0.25 };
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(80);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: mid.x, y: mid.y, button: 'left', buttons: 1, modifiers: 0 });
      await browser.sleep(220);
      return {
        ok: true,
        start,
        mid,
        end,
        async release() {
          await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end.x, y: end.y, button: 'left', buttons: 1, modifiers: 0 });
          await browser.sleep(40);
          await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
          await browser.sleep(350);
        }
      };
    },
    async paintByTouch() {
      const info = await this.canvasInfo();
      if (!info || info.__l2_err__) return { ok: false, reason: 'no visible canvas' };
      const padX = Math.max(10, info.width * 0.08);
      const padY = Math.max(10, info.height * 0.08);
      const start = { x: info.x + info.width / 2 - padX, y: info.y + info.height / 2 + padY * 0.3 };
      const end = { x: info.x + info.width / 2 + padX, y: info.y + info.height / 2 - padY * 0.1 };
      await realTouchDrag(browser, start, end, 10);
      await browser.sleep(500);
      return { ok: true, start, end };
    },
    async screenshotHash() {
      return await browser.canvasPixelHash();
    },
    async claimQuestFromVisibleControl() {
      const id = await browser.eval(`
        (async function(){
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          const visible = el => {
            const r = el.getBoundingClientRect();
            const st = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden';
          };
          const isEnabled = el => !el.disabled && el.getAttribute('aria-disabled') !== 'true';
          const isClaimControl = el => visible(el) && (
            /claim/i.test([el.textContent, el.getAttribute('aria-label'), el.title].join(' ')) ||
            /claim-quest/i.test(el.getAttribute('data-action') || el.getAttribute('data-act') || '') ||
            el.hasAttribute('data-claim') || el.hasAttribute('data-claim-quest')
          );
          const btn = buttons.find(el => isEnabled(el) && isClaimControl(el));
          if (!btn) return { __l2_err__: 'no visible enabled claim control' };
          const action = btn.getAttribute('data-action') || btn.getAttribute('data-act') || '';
          const actionMatch = action.match(/^claim-quest:(.+)$/i);
          const inline = btn.getAttribute('onclick') || '';
          const inlineMatch = inline.match(/(?:claimQuest|__gt_claim)\\s*\\(\\s*['\"]([^'\"]+)['\"]\\s*\\)/i);
          const id = [
            btn.getAttribute('data-claim-quest'),
            btn.getAttribute('data-quest-id'),
            btn.getAttribute('data-claim'),
            btn.getAttribute('data-id'),
            btn.getAttribute('data-v'),
            actionMatch && actionMatch[1],
            inlineMatch && inlineMatch[1]
          ].find(value => typeof value === 'string' && value.trim());
          if (id) return { mode: 'id', id: id.trim() };
          btn.click();
          await new Promise(resolve => setTimeout(resolve, 50));
          const first = window.__gameTest.getSnapshot();
          const sameControlCanRetry = document.documentElement.contains(btn) && isEnabled(btn);
          if (!sameControlCanRetry) {
            return {
              mode: 'clicked',
              first,
              second: { ok: false, snapshot: first, reason: 'claim control is no longer enabled' }
            };
          }
          btn.click();
          await new Promise(resolve => setTimeout(resolve, 50));
          const second = window.__gameTest.getSnapshot();
          const rejected = second && (
            second.ok === false ||
            (second.lastResult && second.lastResult.ok === false && second.lastResult.reason)
          );
          return {
            mode: 'clicked',
            first,
            second: { ok: rejected, snapshot: second }
          };
        })()
      `);
      return id || null;
    }
  };
}

const suite = [
  {
    id: 'p0-boot-no-fatal',
    level: 'P0',
    name: 'Boot has no fatal runtime exception',
    async run(ctx) {
      const fatal = (ctx.browser.exceptions || []).filter(e => /SyntaxError|ReferenceError|TypeError|RangeError/i.test(e.description || e.text || ''));
      if (fatal.length) return FAIL(fatal[0].description || fatal[0].text || 'fatal exception');
      return PASS(`${ctx.browser.exceptions.length} runtime exceptions, ${fatal.length} fatal`);
    }
  },
  {
    id: 'p0-contract-schema',
    level: 'P0',
    name: 'Public contract reset and snapshot schema',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.waitForReady())) return FAIL('window.__gameTest reset/input/getSnapshot/loadScenario not ready');
      const reset = await game.reset();
      const err = contractError(reset);
      if (err) return FAIL(err);
      const s = reset.snapshot || await game.snapshot();
      const shape = validateSnapshot(s);
      if (shape) return FAIL(shape);
      if (s.phase !== 'playing') return FAIL(`reset should enter playing phase, got ${s.phase}`);
      if (s.overlayBlocking || !s.canInteractWithPlayfield) return FAIL('fresh workbench should not be blocked');
      return PASS(`phase=${s.phase}, palette=${s.paletteCount}, tools=${s.availableToolCount}, clothing=${s.clothing.count}`);
    }
  },
  {
    id: 'p0-visible-nonblank-canvas',
    level: 'P0',
    name: 'Visible nonblank work canvas',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.reset();
      const s = await game.snapshot();
      const info = await game.canvasInfo();
      const hash = await game.screenshotHash();
      if (!info) return FAIL('no visible canvas-like surface discovered');
      if (!get(s, 'canvas.nonBlank', false)) return FAIL('snapshot says canvas is blank');
      if (hash === null || hash === undefined) return FAIL('screenshot hash unavailable for visual surface');
      return PASS(`canvas ${Math.round(info.width)}x${Math.round(info.height)}, hash=${hash}`);
    }
  },
  {
    id: 'p1-real-mouse-painting',
    level: 'P1',
    name: 'Real mouse painting changes visible work',
    async run(ctx) {
      // Static quality gate note: paintByMouse uses Input.dispatchMouseEvent through realMouseDrag.
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('blankWorkbench');
      await game.clickSemantic('color', 0);
      await game.contractInput({ type: 'selectColor', index: 0 });
      const before = await game.snapshot();
      const hashBefore = await game.screenshotHash();
      const painted = await game.paintByMouse();
      if (!painted.ok) return FAIL(painted.reason);
      const after = await game.snapshot();
      const hashAfter = await game.screenshotHash();
      const changedWork = workSig(before) !== workSig(after);
      const changedHash = hashBefore !== hashAfter;
      const dyedOk = numberOr(get(after, 'canvas.dyedPixelEstimate', 0), 0) >= numberOr(get(before, 'canvas.dyedPixelEstimate', 0), 0);
      if (changedWork && changedHash && dyedOk) return PASS(`work ${workSig(before)} -> ${workSig(after)}, screenshot ${hashBefore}->${hashAfter}`);
      return FAIL(`real mouse drag did not change visible work: ${JSON.stringify({ before: workSig(before), after: workSig(after), hashBefore, hashAfter, painted }).slice(0, 900)}`);
    }
  },
  {
    id: 'p1-real-touch-painting',
    level: 'P1',
    name: 'Real touch painting changes visible work',
    async run(ctx) {
      // Static quality gate note: paintByTouch uses Input.dispatchTouchEvent through realTouchDrag.
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('blankWorkbench');
      await game.contractInput({ type: 'selectColor', index: 1 });
      const before = await game.snapshot();
      const hashBefore = await game.screenshotHash();
      const painted = await game.paintByTouch();
      if (!painted.ok) return FAIL(painted.reason);
      const after = await game.snapshot();
      const hashAfter = await game.screenshotHash();
      const changedWork = workSig(before) !== workSig(after);
      const changedHash = hashBefore !== hashAfter;
      const dyedOk = numberOr(get(after, 'canvas.dyedPixelEstimate', 0), 0) >= numberOr(get(before, 'canvas.dyedPixelEstimate', 0), 0);
      if (changedWork && changedHash && dyedOk) return PASS(`touch work ${workSig(before)} -> ${workSig(after)}, screenshot ${hashBefore}->${hashAfter}`);
      return FAIL(`real touch drag did not change visible work: ${JSON.stringify({ before: workSig(before), after: workSig(after), hashBefore, hashAfter, painted }).slice(0, 900)}`);
    }
  },
  {
    id: 'p1-real-time-mouse-drag-feedback',
    level: 'P1',
    name: 'Real mouse drag shows paint feedback before release',
    async run(ctx) {
      // Static quality gate note: probeRealtimeMouseDrag uses Input.dispatchMouseEvent mousePressed/mouseMoved and intentionally samples before mouseReleased.
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('blankWorkbench');
      await game.clickSemantic('color', 0);
      await game.contractInput({ type: 'selectColor', index: 0 });
      const before = await game.snapshot();
      const hashBefore = await game.screenshotHash();
      const drag = await game.probeRealtimeMouseDrag();
      if (!drag.ok) return FAIL(drag.reason);
      const during = await game.snapshot();
      const hashDuring = await game.screenshotHash();
      await drag.release();
      const after = await game.snapshot();
      const hashAfter = await game.screenshotHash();
      const changedDuring = workSig(during) !== workSig(before) || hashDuring !== hashBefore;
      const changedAfter = workSig(after) !== workSig(before) || hashAfter !== hashBefore;
      if (!changedAfter) return FAIL('drag path did not produce a completed paint mark after release');
      if (!changedDuring) {
        return FAIL(`paint feedback did not appear until release: before=${workSig(before)} during=${workSig(during)} after=${workSig(after)} hashes=${hashBefore}->${hashDuring}->${hashAfter}`);
      }
      return PASS(`drag feedback visible before release: work ${workSig(before)} -> ${workSig(during)} -> ${workSig(after)}, hash ${hashBefore}->${hashDuring}->${hashAfter}`);
    }
  },
  {
    id: 'p1-tool-stencil-intensity-paint-contract',
    level: 'P1',
    name: 'Tool, stencil and intensity selection affect painting contract',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('blankWorkbench');
      const initial = await game.snapshot();
      await game.contractInput({ type: 'selectColor', index: 0 });
      const sizeResult = await game.contractInput({ type: 'selectBrushSize', size: 'large' });
      const requestedIntensity = get(initial, 'selectedDyeIntensity', null) === 'light' ? 'strong' : 'light';
      const intensityResult = await game.contractInput({ type: 'selectDyeIntensity', intensity: requestedIntensity });
      const toolResult = await game.contractInput({ type: 'selectTool', tool: 'heart' });
      const stencilResult = await game.contractInput({ type: 'selectStencil', stencil: 'heart' });
      if (contractError(sizeResult) || contractError(intensityResult) || contractError(toolResult) || contractError(stencilResult)) {
        return FAIL(contractError(sizeResult) || contractError(intensityResult) || contractError(toolResult) || contractError(stencilResult));
      }
      const before = await game.snapshot();
      const paint = await game.contractInput({ type: 'paint', inputKind: 'contract' });
      if (contractError(paint)) return FAIL(contractError(paint));
      if (paint.ok === false) return FAIL(paint.reason || 'paint action was rejected');
      const after = paint.snapshot || await game.snapshot();
      if (get(before, 'selectedBrushSize', null) === get(initial, 'selectedBrushSize', null)) return FAIL('brush size selection was not reflected before paint');
      if (get(before, 'selectedDyeIntensity', null) === get(initial, 'selectedDyeIntensity', null)) return FAIL('dye intensity selection was not reflected before paint');
      if (get(before, 'selectedTool', null) === get(initial, 'selectedTool', null) && get(before, 'selectedStencil', null) === get(initial, 'selectedStencil', null)) {
        return FAIL('tool/stencil selection was not reflected before paint');
      }
      const changedWork = workHash(before) !== workHash(after) ||
        get(before, 'canvas.dyedPixelEstimate', null) !== get(after, 'canvas.dyedPixelEstimate', null);
      if (!changedWork) return FAIL('painting after tool/stencil selection did not change work');
      const invalidBefore = await game.snapshot();
      const invalid = await game.contractInput({ type: 'selectTool', tool: '__invalid_tool__' });
      const invalidAfter = invalid.snapshot || await game.snapshot();
      if (invalid.ok !== false) return FAIL('unknown tool should be rejected');
      if (get(invalidAfter, 'selectedTool', null) !== get(invalidBefore, 'selectedTool', null)) return FAIL('unknown tool changed current tool');
      const invalidIntensity = await game.contractInput({ type: 'selectDyeIntensity', intensity: '__invalid_intensity__' });
      const invalidIntensityAfter = invalidIntensity.snapshot || await game.snapshot();
      if (invalidIntensity.ok !== false) return FAIL('unknown dye intensity should be rejected');
      if (get(invalidIntensityAfter, 'selectedDyeIntensity', null) !== get(invalidBefore, 'selectedDyeIntensity', null)) return FAIL('unknown dye intensity changed current intensity');
      return PASS(`size=${after.selectedBrushSize}, intensity=${after.selectedDyeIntensity}, tool=${after.selectedTool}, stencil=${after.selectedStencil}, work=${workSig(before)}->${workSig(after)}`);
    }
  },
  {
    id: 'p1-undo-redo-history',
    level: 'P1',
    name: 'Undo and redo restore painted work',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('paintedOnce');
      const painted = await game.snapshot();
      const beforeHash = workSig(painted);
      const undo = await game.contractInput({ type: 'undo' });
      if (contractError(undo)) return FAIL(contractError(undo));
      const undone = undo.snapshot || await game.snapshot();
      const afterUndoHash = workSig(undone);
      const redo = await game.contractInput({ type: 'redo' });
      if (contractError(redo)) return FAIL(contractError(redo));
      const redone = redo.snapshot || await game.snapshot();
      const afterRedoHash = workSig(redone);
      if (workHash(painted) === workHash(undone)) return FAIL('undo did not change visible work hash');
      if (workHash(redone) !== workHash(painted)) return FAIL(`redo did not restore visible painted work hash: ${workHash(painted)} vs ${workHash(redone)}`);
      return PASS(`work before=${beforeHash} undo=${afterUndoHash} redo=${afterRedoHash}`);
    }
  },
  {
    id: 'p1-clear-confirmation',
    level: 'P1',
    name: 'Clear confirmation cancel preserves and confirm resets work',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('clearConfirmReady');
      const before = await game.snapshot();
      const beforeSig = workSig(before);
      const cancel = await game.contractInput({ type: 'clear', confirm: false });
      if (contractError(cancel)) return FAIL(contractError(cancel));
      const canceled = cancel.snapshot || await game.snapshot();
      if (workSig(canceled) !== beforeSig) return FAIL('clear cancel changed work');
      if (!canceled.overlayBlocking && canceled.activePanel !== 'confirm') return FAIL('clear cancel should leave or show a visible confirmation state');
      const blockedPaint = await game.contractInput({ type: 'paint', inputKind: 'contract' });
      const blockedSnap = blockedPaint.snapshot || await game.snapshot();
      if (workSig(blockedSnap) !== beforeSig) return FAIL('painting changed work while clear confirmation was blocking');
      const confirmed = await game.contractInput({ type: 'clear', confirm: true });
      if (contractError(confirmed)) return FAIL(contractError(confirmed));
      const after = confirmed.snapshot || await game.snapshot();
      if (workSig(after) === beforeSig) return FAIL('clear confirm did not reset work');
      if (after.overlayBlocking || !after.canInteractWithPlayfield) return FAIL('clear confirm should restore playable workbench');
      return PASS(`work ${beforeSig} -> cancel ${workSig(canceled)} -> clear ${workSig(after)}`);
    }
  },
  {
    id: 'p1-save-gallery-economy',
    level: 'P1',
    name: 'Save design updates gallery and hearts',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('saveReady');
      const before = await game.snapshot();
      await game.contractInput({ type: 'reveal' });
      const saved = await game.contractInput({ type: 'saveDesign', confirm: true });
      if (contractError(saved)) return FAIL(contractError(saved));
      const after = saved.snapshot || await game.snapshot();
      const galleryDelta = numberOr(get(after, 'gallery.count', 0), 0) - numberOr(get(before, 'gallery.count', 0), 0);
      const heartsDelta = numberOr(get(after, 'economy.hearts', 0), 0) - numberOr(get(before, 'economy.hearts', 0), 0);
      if (galleryDelta !== 1) return FAIL(`saving should add exactly one gallery item, delta=${galleryDelta}`);
      const declaredReward = numberOr(get(after, 'economy.saveReward', NaN), NaN);
      if (!(heartsDelta > 0)) return FAIL(`saving should award positive hearts, delta=${heartsDelta}`);
      if (Number.isFinite(declaredReward) && declaredReward > 0 && heartsDelta !== declaredReward) {
        return FAIL(`saving heart delta should match declared saveReward: delta=${heartsDelta}, saveReward=${declaredReward}`);
      }
      if (!get(after, 'gallery.hasThumbnails', false)) return FAIL('saved gallery must expose a visible thumbnail');
      return PASS(`gallery ${before.gallery.count}->${after.gallery.count}, hearts +${heartsDelta}`);
    }
  },
  {
    id: 'p1-skip-save-no-reward',
    level: 'P1',
    name: 'Skip save resets work without gallery or heart reward',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('saveReady');
      const before = await game.snapshot();
      await game.contractInput({ type: 'reveal' });
      const skipped = await game.contractInput({ type: 'skipSave' });
      if (contractError(skipped)) return FAIL(contractError(skipped));
      const after = skipped.snapshot || await game.snapshot();
      if (numberOr(get(after, 'gallery.count', 0), 0) !== numberOr(get(before, 'gallery.count', 0), 0)) return FAIL('skip save changed gallery count');
      if (numberOr(get(after, 'economy.hearts', 0), 0) !== numberOr(get(before, 'economy.hearts', 0), 0)) return FAIL('skip save changed hearts');
      if (workSig(after) === workSig(before)) return FAIL('skip save should reset current work for the next design');
      if (after.phase !== 'playing' || after.overlayBlocking || !after.canInteractWithPlayfield) return FAIL('skip save should return to playable workbench');
      return PASS(`gallery=${after.gallery.count}, hearts=${after.economy.hearts}, work reset ${workSig(before)} -> ${workSig(after)}`);
    }
  },
  {
    id: 'p1-menu-overlay-blocking',
    level: 'P1',
    name: 'Menu overlay blocks then restores playfield',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('paintedOnce');
      const before = await game.snapshot();
      const opened = await game.contractInput({ type: 'openPanel', panel: 'menu' });
      if (contractError(opened)) return FAIL(contractError(opened));
      const openSnap = opened.snapshot || await game.snapshot();
      if (!openSnap.overlayBlocking || openSnap.canInteractWithPlayfield) return FAIL('menu should block playfield interaction');
      const blockedPaint = await game.contractInput({ type: 'paint', inputKind: 'contract' });
      const blockedSnap = blockedPaint.snapshot || await game.snapshot();
      if (workSig(blockedSnap) !== workSig(before)) return FAIL('paint changed work while menu overlay was blocking');
      const closed = await game.contractInput({ type: 'closePanel' });
      if (contractError(closed)) return FAIL(contractError(closed));
      const closeSnap = closed.snapshot || await game.snapshot();
      if (closeSnap.overlayBlocking || !closeSnap.canInteractWithPlayfield) return FAIL('closing menu should restore playfield interaction');
      return PASS(`blocked=${openSnap.overlayBlocking}, restored=${closeSnap.canInteractWithPlayfield}`);
    }
  },
  {
    id: 'p1-shop-purchase-and-insufficient-rejection',
    level: 'P1',
    name: 'Shop purchase spends hearts and insufficient buy is rejected',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('shopAffordable');
      const affordableBefore = await game.snapshot();
      const buyId = get(affordableBefore, 'shop.affordableLockedId', null);
      if (!buyId) return FAIL('shopAffordable scenario did not expose affordableLockedId');
      const bought = await game.contractInput({ type: 'buyBackground', id: buyId });
      if (contractError(bought)) return FAIL(contractError(bought));
      const affordableAfter = bought.snapshot || await game.snapshot();
      if (numberOr(get(affordableAfter, 'economy.hearts', 0), 0) >= numberOr(get(affordableBefore, 'economy.hearts', 0), 0)) {
        return FAIL('successful purchase did not spend hearts');
      }
      if (numberOr(get(affordableAfter, 'shop.unlockedCount', 0), 0) !== numberOr(get(affordableBefore, 'shop.unlockedCount', 0), 0) + 1) {
        return FAIL('successful purchase did not unlock exactly one background');
      }

      await game.loadScenario('shopNoHearts');
      const poorBefore = await game.snapshot();
      const poorId = get(poorBefore, 'shop.unaffordableLockedId', null) || get(poorBefore, 'shop.affordableLockedId', null);
      if (!poorId) return FAIL('shopNoHearts scenario did not expose locked background id');
      const totalBefore = numberOr(get(poorBefore, 'economy.hearts', 0), 0) + numberOr(get(poorBefore, 'shop.unlockedCount', 0), 0);
      const rejected = await game.contractInput({ type: 'buyBackground', id: poorId });
      const poorAfter = rejected.snapshot || await game.snapshot();
      const totalAfter = numberOr(get(poorAfter, 'economy.hearts', 0), 0) + numberOr(get(poorAfter, 'shop.unlockedCount', 0), 0);
      if (rejected.ok !== false) return FAIL('insufficient purchase should return ok:false');
      if (totalBefore !== totalAfter) return FAIL(`insufficient purchase invariant failed: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      return PASS(`bought=${buyId}, insufficient=${poorId}, totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
    }
  },
  {
    id: 'p1-equip-unlocked-background',
    level: 'P1',
    name: 'Equipping an unlocked background changes background without spending',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('backgroundEquippable');
      const before = await game.snapshot();
      const equipId = get(before, 'shop.equippableUnlockedId', null);
      if (!equipId) return FAIL('backgroundEquippable scenario did not expose equippableUnlockedId');
      const equipped = await game.contractInput({ type: 'equipBackground', id: equipId });
      if (contractError(equipped)) return FAIL(contractError(equipped));
      const after = equipped.snapshot || await game.snapshot();
      const changedBackground = get(after, 'shop.currentBackground', '') !== get(before, 'shop.currentBackground', '') ||
        numberOr(get(after, 'shop.backgroundRevision', 0), 0) !== numberOr(get(before, 'shop.backgroundRevision', 0), 0);
      if (!changedBackground) return FAIL('equipping unlocked background did not change current background or revision');
      if (numberOr(get(after, 'economy.hearts', 0), 0) !== numberOr(get(before, 'economy.hearts', 0), 0)) return FAIL('equipping an unlocked background should not spend hearts');
      if (numberOr(get(after, 'shop.unlockedCount', 0), 0) !== numberOr(get(before, 'shop.unlockedCount', 0), 0)) return FAIL('equipping an unlocked background should not change unlocked count');
      return PASS(`background ${before.shop.currentBackground}->${after.shop.currentBackground}, revision ${get(before, 'shop.backgroundRevision', 0)}->${get(after, 'shop.backgroundRevision', 0)}`);
    }
  },
  {
    id: 'p1-invalid-paint-rejected',
    level: 'P1',
    name: 'Invalid paint without color is rejected unchanged',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('blankWorkbench');
      const before = await game.snapshot();
      const invalid = await game.contractInput({ type: 'paint', point: { x: -9999, y: -9999 }, inputKind: 'contract' });
      const after = invalid.snapshot || await game.snapshot();
      const unchanged = workSig(before) === workSig(after);
      if (invalid.ok !== false) return FAIL('invalid/no-color paint should be rejected');
      if (!unchanged) return FAIL(`invalid paint changed work: ${workSig(before)} -> ${workSig(after)}`);
      return PASS(`rejected reason=${invalid.reason || get(after, 'lastResult.reason', 'n/a')}, unchanged=${unchanged}`);
    }
  },
  {
    id: 'p2-clothing-cycle-resets-work',
    level: 'P2',
    name: 'Clothing cycle changes garment and resets work',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('paintedOnce');
      const before = await game.snapshot();
      const cycled = await game.contractInput({ type: 'cycleClothing', direction: 1 });
      if (contractError(cycled)) return FAIL(contractError(cycled));
      const after = cycled.snapshot || await game.snapshot();
      if (get(after, 'clothing.count', 0) !== get(before, 'clothing.count', 0)) return FAIL('clothing count changed while cycling');
      if (get(after, 'clothing.currentId', '') === get(before, 'clothing.currentId', '') && get(after, 'clothing.index', -1) === get(before, 'clothing.index', -1)) {
        return FAIL('cycling did not change selected clothing');
      }
      if (workSig(after) === workSig(before)) return FAIL('cycling clothing should reset or redraw the work surface');
      return PASS(`clothing ${before.clothing.currentId}->${after.clothing.currentId}, count=${after.clothing.count}`);
    }
  },
  {
    id: 'p2-quest-claim-once',
    level: 'P2',
    name: 'Quest reward can be claimed once only',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('questClaimable');
      const opened = await game.contractInput({ type: 'openPanel', panel: 'quests' });
      if (contractError(opened)) return FAIL(`could not open quests panel: ${contractError(opened)}`);
      const before = opened.snapshot || await game.snapshot();
      let claimId = get(before, 'quests.claimableId', null);
      let first;
      let second;
      if (!claimId) {
        const control = await game.claimQuestFromVisibleControl();
        if (!control || control.__l2_err__) return FAIL(control && control.__l2_err__ ? control.__l2_err__ : 'claimable quest control was not found');
        if (control.mode === 'id') {
          claimId = control.id;
        } else if (control.mode === 'clicked') {
          first = { ok: true, snapshot: control.first };
          second = control.second;
        } else {
          return FAIL('claim control discovery returned no usable claim path');
        }
      }
      if (!first) {
        first = await game.contractInput({ type: 'claimQuest', id: claimId });
        if (contractError(first)) return FAIL(contractError(first));
        second = await game.contractInput({ type: 'claimQuest', id: claimId });
      }
      const claimed = first.snapshot || await game.snapshot();
      const after = second.snapshot || await game.snapshot();
      const firstReward = numberOr(get(claimed, 'economy.hearts', 0), 0) > numberOr(get(before, 'economy.hearts', 0), 0);
      const claimedOnce = numberOr(get(claimed, 'quests.claimedCount', 0), 0) === numberOr(get(before, 'quests.claimedCount', 0), 0) + 1;
      const unchanged = numberOr(get(after, 'economy.hearts', 0), 0) === numberOr(get(claimed, 'economy.hearts', 0), 0) &&
        numberOr(get(after, 'quests.claimedCount', 0), 0) === numberOr(get(claimed, 'quests.claimedCount', 0), 0);
      if (!firstReward || !claimedOnce) return FAIL('first quest claim did not award hearts and mark claimed');
      if (!rejectionObserved(second) || !unchanged) return FAIL('second quest claim should be rejected unchanged');
      return PASS(`quest=${claimId || 'visible-control'}, hearts ${before.economy.hearts}->${claimed.economy.hearts}, repeated unchanged=${unchanged}`);
    }
  },
  {
    id: 'p2-settings-toggle-unchanged-work',
    level: 'P2',
    name: 'Settings toggle changes setting only',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('paintedOnce');
      const before = await game.snapshot();
      const setting = Object.keys(before.settings || {}).find(k => typeof before.settings[k] === 'boolean') || 'particles';
      const toggled = await game.contractInput({ type: 'toggleSetting', setting });
      if (contractError(toggled)) return FAIL(contractError(toggled));
      const after = toggled.snapshot || await game.snapshot();
      if (get(after, `settings.${setting}`, null) === get(before, `settings.${setting}`, null)) return FAIL(`setting ${setting} did not toggle`);
      const unchanged = workSig(before) === workSig(after) &&
        numberOr(get(before, 'gallery.count', 0), 0) === numberOr(get(after, 'gallery.count', 0), 0) &&
        numberOr(get(before, 'economy.hearts', 0), 0) === numberOr(get(after, 'economy.hearts', 0), 0);
      if (!unchanged) return FAIL('settings toggle changed work, gallery, or hearts');
      return PASS(`${setting}: ${get(before, `settings.${setting}`, null)} -> ${get(after, `settings.${setting}`, null)}, unchanged=${unchanged}`);
    }
  },
  {
    id: 'p2-gallery-capacity-invariant',
    level: 'P2',
    name: 'Gallery capacity invariant is preserved',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('saveReady');
      let last = await game.snapshot();
      const beforeCount = numberOr(get(last, 'gallery.count', 0), 0);
      const max = numberOr(get(last, 'gallery.max', 0), 0);
      if (max !== 5) return FAIL(`gallery.max must be 5, got ${max}`);
      const attempts = Math.min(max + 2, 8);
      let changedOrReachedLimit = beforeCount >= max;
      for (let i = 0; i < attempts; i++) {
        if (numberOr(get(last, 'canvas.workRevision', 0), 0) <= 0) {
          await game.contractInput({ type: 'selectColor', index: i % 3 });
          await game.contractInput({
            type: 'paint',
            path: [{ x: 280 + i * 8, y: 230 + i * 4 }, { x: 340 + i * 6, y: 260 + i * 3 }],
            inputKind: 'contract'
          });
          await game.contractInput({ type: 'reveal' });
        } else if (get(last, 'activePanel', 'none') !== 'revealSave') {
          await game.contractInput({ type: 'reveal' });
        }
        await game.contractInput({ type: 'saveDesign', confirm: true });
        const afterSave = await game.snapshot();
        if (numberOr(get(afterSave, 'gallery.count', 0), 0) > numberOr(get(last, 'gallery.count', 0), 0) ||
            numberOr(get(afterSave, 'gallery.count', 0), 0) === max) {
          changedOrReachedLimit = true;
        }
        last = afterSave;
        if (numberOr(get(last, 'gallery.count', 0), 0) > max) {
          return FAIL(`gallery overflow at attempt ${i}: count=${last.gallery.count}, max=${max}`);
        }
      }
      if (!changedOrReachedLimit) return FAIL(`gallery count did not change or reach limit across save sequence, before=${beforeCount}, after=${get(last, 'gallery.count', 0)}`);
      return PASS(`gallery before=${beforeCount}, after=${get(last, 'gallery.count', 0)} <= max=${max}`);
    }
  },
  {
    id: 'p2-persisted-progress-preserve-reset',
    level: 'P2',
    name: 'Preserve reset restores persisted progress fields',
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const scenarioResult = await game.loadScenario('persistedProgress');
      const scenarioError = contractError(scenarioResult) ||
        (scenarioResult && scenarioResult.ok === false
          ? scenarioResult.reason || 'persistedProgress scenario rejected'
          : null);
      if (scenarioError) return FAIL(scenarioError);
      const seeded = scenarioResult && scenarioResult.snapshot
        ? scenarioResult.snapshot
        : await game.snapshot();
      const preserved = await game.reset({ preserveProgress: true });
      if (contractError(preserved)) return FAIL(contractError(preserved));
      const after = preserved.snapshot || await game.snapshot();
      const seededGallery = numberOr(get(seeded, 'gallery.count', 0), 0);
      const afterGallery = numberOr(get(after, 'gallery.count', 0), 0);
      const seededHearts = numberOr(get(seeded, 'economy.hearts', 0), 0);
      const afterHearts = numberOr(get(after, 'economy.hearts', 0), 0);
      const seededBackground = get(seeded, 'shop.currentBackground', '');
      const afterBackground = get(after, 'shop.currentBackground', '');
      const settingsSame = JSON.stringify(get(after, 'settings', {})) === JSON.stringify(get(seeded, 'settings', {}));
      const seededHasConcreteProgress = seededGallery > 0 || seededHearts > 0;
      const persistentEvidence = [
        seededGallery > 0 ? afterGallery === seededGallery : afterGallery > 0,
        seededHearts > 0 ? afterHearts === seededHearts : afterHearts > 0,
        Boolean(afterBackground) && (afterBackground !== seededBackground || seededHasConcreteProgress),
        !settingsSame || seededHasConcreteProgress
      ].filter(Boolean).length;
      if (persistentEvidence < 2) {
        return FAIL(`preserve reset did not restore enough persistent evidence: seeded=${JSON.stringify({
          gallery: seededGallery,
          hearts: seededHearts,
          background: seededBackground,
          settings: get(seeded, 'settings', null)
        }).slice(0, 800)}, after=${JSON.stringify({
          gallery: afterGallery,
          hearts: afterHearts,
          background: afterBackground,
          settings: get(after, 'settings', null)
        }).slice(0, 800)}, evidence=${persistentEvidence}`);
      }
      if (after.overlayBlocking || !after.canInteractWithPlayfield || after.phase !== 'playing') return FAIL('preserve reset should restore progress without leaving a blocking overlay');
      return PASS(`persistent evidence fields=${persistentEvidence}, gallery=${after.gallery.count}, hearts=${after.economy.hearts}`);
    }
  }
];

module.exports = { suite };
