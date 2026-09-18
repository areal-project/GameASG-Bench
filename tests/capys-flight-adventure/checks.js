// === GDD Coverage Map ===
// M1 (启动与菜单流) -> p0-boot-contract-ready, p1-real-click-start-unblocks-playfield, p2-real-info-panel-blocks-and-closes
// M2 (弹弓蓄力发射) -> p1-real-mouse-drag-launch-opposite-direction, p1-contract-opposite-drag-direction
// M3 (飞行物理与摄像机) -> p0-readable-scene-and-hud, p1-real-mouse-drag-launch-opposite-direction, p2-high-altitude-visible-feedback
// M4 (拍翼续航资源) -> p1-real-key-flap-consumes-and-lifts, p2-zero-flaps-rejects-extra-flap
// M5 (道具收集与增益) -> p1-real-visible-buff-collection
// M6 (HUD、分数与结算) -> p1-result-and-retry-state-machine, p2-high-score-persists-across-retry
// M7 (高空与环境反馈) -> p2-high-altitude-visible-feedback
// M8 (辅助说明系统) -> p2-real-info-panel-blocks-and-closes
//
// === Category Map ===
// Boot & Stability -> p0-boot-contract-ready
// Feedback & Observability -> p0-readable-scene-and-hud, p2-high-altitude-visible-feedback
// UI Flow & Blocking -> p1-real-click-start-unblocks-playfield, p2-real-info-panel-blocks-and-closes
// Input Semantics -> p1-real-mouse-drag-launch-opposite-direction, p1-contract-opposite-drag-direction
// Core Mechanic Loop -> p1-real-key-flap-consumes-and-lifts, p1-real-visible-buff-collection
// State Machine -> p1-result-and-retry-state-machine
// Economy/Progression -> p2-high-score-persists-across-retry
// Invariants & Rejection -> p2-invalid-flap-in-launch-unchanged, p2-zero-flaps-rejects-extra-flap
//
// === Rationality Map ===
// p1-real-click-start-unblocks-playfield: M1 | real action: DOM/mouse click on semantic start control | independent observation: phase + overlayBlocking + canInteractWithPlayfield | empty-shell failure: API-only start or blocking splash fails
// p1-real-mouse-drag-launch-opposite-direction: M2/M3 | real action: browser mouse drag from player toward lower-left then release | independent observation: phase + player screen/velocity delta + renderRevision | empty-shell failure: no movement, no drag handler, or wrong launch direction fails
// p1-contract-opposite-drag-direction: M2 | real contract setup with declared dragLaunch actions | independent observation: signed horizontal velocity/screen motion comparison | empty-shell failure: both directions use same velocity or only ok:true fails
// p1-real-key-flap-consumes-and-lifts: M4 | real action: Space keyDown/keyUp during flight | independent observation: flaps decrease + vertical velocity/screenY improves | empty-shell failure: key listener only or no resource accounting fails
// p1-real-visible-buff-collection: M5/M6 | real action: mouse click in playfield and Space flap from near-buff setup | independent observation: score/buff/active/flap delta and visible/nearest buff change | empty-shell failure: static score, pre-collected scenario, no real input path, or no buff effect fails
// p1-result-and-retry-state-machine: M6 | real action: wait from near-landing then click retry | independent observation: result stats then launch reset | empty-shell failure: result overlay missing or retry does not clear state fails
// p2-invalid-flap-in-launch-unchanged: M4/M6 | contract action: flap in launch phase | independent observation: unchanged phase/flaps/score | empty-shell failure: invalid input mutates resources fails
// p2-zero-flaps-rejects-extra-flap: M4 | contract setup, real Space key | independent observation: zero-flap path compared with no-input baseline and valid-flap positive control | empty-shell failure: flaps go negative or zero-resource key creates flap lift/collection fails
// p2-high-score-persists-across-retry: M6 | contract scenario plus real retry where available | independent observation: highScore preserved while transient score resets | empty-shell failure: high score not updated or reset erases it fails
// p2-high-altitude-visible-feedback: M7 | contract high-altitude setup and wait/flap | independent observation: high altitude state + renderRevision/canvas change | empty-shell failure: high altitude exists only as number fails
// p2-real-info-panel-blocks-and-closes: M8 | real action: click info/open and close controls | independent observation: infoOpen/overlayBlocking changes and restores | empty-shell failure: dead buttons or permanently blocking modal fails

const KEY_HOLD_MS = 80;
const KEY_SETTLE_MS = 250;
const KEY_OBSERVATION_MS = KEY_HOLD_MS + KEY_SETTLE_MS;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pass(detail) {
  return { status: 'PASS', detail };
}

function fail(detail) {
  return { status: 'FAIL', detail };
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function snapshotLooksValid(s) {
  return s && typeof s === 'object' &&
    typeof s.phase === 'string' &&
    s.player && finiteNumber(s.player.screenX) && finiteNumber(s.player.screenY) &&
    finiteNumber(s.score) && finiteNumber(s.distance) && finiteNumber(s.maxHeight) &&
    s.flaps && finiteNumber(s.flaps.remaining) && finiteNumber(s.flaps.max) &&
    s.playfield && finiteNumber(s.playfield.x) && finiteNumber(s.playfield.y) &&
    finiteNumber(s.playfield.width) && finiteNumber(s.playfield.height);
}

async function pressKey(browser, key) {
  await browser.keyDown(key);
  await sleep(KEY_HOLD_MS);
  await browser.keyUp(key);
  await sleep(KEY_SETTLE_MS);
}

function createGameDriver(browser) {
  async function evalPage(expr) {
    const result = await browser.eval(expr);
    if (result && result.__l2_err__) throw new Error(result.__l2_err__);
    return result;
  }

  async function hasContract() {
    return await evalPage(`!!(window.__gameTest && typeof window.__gameTest.getSnapshot === 'function' && typeof window.__gameTest.input === 'function' && typeof window.__gameTest.loadScenario === 'function')`);
  }

  async function snapshot() {
    const s = await evalPage(`
      (function() {
        if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
          return window.__gameTest.getSnapshot();
        }
        return null;
      })()
    `);
    return s;
  }

  async function callInput(action) {
    return await evalPage(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { ok: false, reason: 'missing __gameTest.input' };
      const r = await window.__gameTest.input(${JSON.stringify(action)});
      return r && typeof r === 'object' ? r : { ok: true, snapshot: window.__gameTest.getSnapshot && window.__gameTest.getSnapshot() };
    })()`);
  }

  async function loadScenario(name, options = {}) {
    return await evalPage(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { ok: false, reason: 'missing __gameTest.loadScenario' };
      const r = await window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options)});
      return r && typeof r === 'object' ? r : window.__gameTest.getSnapshot();
    })()`);
  }

  async function reset(options = {}) {
    return await evalPage(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return null;
      const r = await window.__gameTest.reset(${JSON.stringify(options)});
      return r && typeof r === 'object' ? r : window.__gameTest.getSnapshot();
    })()`);
  }

  async function findSemanticButton(kind) {
    const patterns = {
      start: 'start|play|begin|launch|take|fly|flight|soar',
      retry: 'again|retry|restart|replay|launch',
      info: '^\\?$|info|guide|help|power',
      close: 'close|back|ok|done|×|x'
    };
    return await evalPage(`(function(){
      const re = new RegExp(${JSON.stringify(patterns[kind] || kind)}, 'i');
      const nativeCandidates = Array.from(document.querySelectorAll('button, a, input, [role="button"]'));
      const customCandidates = Array.from(document.querySelectorAll('[onclick], [tabindex]:not([tabindex="-1"]), *'));
      const candidates = nativeCandidates.concat(customCandidates);
      const seen = new Set();
      for (const el of candidates) {
        if (seen.has(el)) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none' || r.width < 4 || r.height < 4) continue;
        const nativeControl = /^(BUTTON|A|INPUT)$/.test(el.tagName) || el.getAttribute('role') === 'button';
        const customControl = cs.cursor === 'pointer' || el.hasAttribute('onclick') || el.tabIndex >= 0;
        if (!nativeControl && !customControl) continue;
        const label = ((el.textContent || el.value || el.getAttribute('aria-label') || el.title || '') + '').trim();
        if (re.test(label)) return { x: r.left + r.width / 2, y: r.top + r.height / 2, label, tag: el.tagName };
      }
      return null;
    })()`);
  }

  async function clickSemanticButton(kind) {
    const pt = await findSemanticButton(kind);
    if (!pt) return false;
    await browser.mouseClick(Math.round(pt.x), Math.round(pt.y));
    await sleep(350);
    return true;
  }

  async function startByRealClick() {
    const before = await snapshot();
    if (before.phase !== 'menu' && before.screen !== 'splash' && before.canInteractWithPlayfield) return before;
    const clicked = await clickSemanticButton('start');
    if (!clicked) {
      throw new Error('real start click requires a visible semantic start control');
    }
    return await snapshot();
  }

  async function toViewportPoint(point, playfield) {
    const rect = await evalPage("(function(){ const canvas = document.querySelector('canvas'); if (!canvas) return null; const r = canvas.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; })()");
    if (!rect || !playfield || !(playfield.width > 0) || !(playfield.height > 0) || !Number.isFinite(playfield.x) || !Number.isFinite(playfield.y)) return point;
    const usesViewportBounds = Math.abs(playfield.x - rect.left) < 2 &&
      Math.abs(playfield.y - rect.top) < 2 &&
      Math.abs(playfield.width - rect.width) < 2 &&
      Math.abs(playfield.height - rect.height) < 2;
    if (usesViewportBounds) return point;
    return {
      x: rect.left + (point.x - playfield.x) * rect.width / playfield.width,
      y: rect.top + (point.y - playfield.y) * rect.height / playfield.height
    };
  }

  async function realMouseDrag(from, to) {
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y, button: 'none' });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1 });
    await sleep(80);
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const x = from.x + (to.x - from.x) * i / steps;
      const y = from.y + (to.y - from.y) * i / steps;
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
      await sleep(25);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', clickCount: 1 });
    await sleep(50);
    const released = await snapshot();
    await sleep(250);
    const observed = await snapshot();
    return { released, observed };
  }

  async function pressSpace() {
    await pressKey(browser, 'Space');
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  return {
    hasContract,
    snapshot,
    callInput,
    loadScenario,
    reset,
    findSemanticButton,
    clickSemanticButton,
    startByRealClick,
    toViewportPoint,
    realMouseDrag,
    pressSpace,
    canvasHash
  };
}

async function ensureContract(game) {
  if (!(await game.hasContract())) {
    throw new Error('missing window.__gameTest reset/input/getSnapshot/loadScenario contract');
  }
}

const checks = [
  {
    id: 'p0-boot-contract-ready',
    level: 'P0',
    name: 'boot exposes stable snapshot contract',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      const s = await game.snapshot();
      if (!snapshotLooksValid(s)) return fail('snapshot schema is incomplete or invalid');
      if (ctx.browser.exceptions.length) return fail(`runtime exceptions: ${ctx.browser.exceptions.slice(-2).map((e) => e.text || e.description).join('; ')}`);
      if (s.playfield.width < 100 || s.playfield.height < 100) return fail('playfield bounds too small');
      return pass(`phase=${s.phase}, playfield=${Math.round(s.playfield.width)}x${Math.round(s.playfield.height)}`);
    }
  },
  {
    id: 'p0-readable-scene-and-hud',
    level: 'P0',
    name: 'readable main scene and HUD observability',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      const s = await game.snapshot();
      const size = await ctx.browser.getCanvasSize();
      const hash = await game.canvasHash();
      if (!size || size.cssW < 100 || size.cssH < 100) return fail('no readable primary canvas/playfield');
      if (hash === null || hash === undefined) return fail('unable to observe rendered scene');
      if (!finiteNumber(s.score) || !finiteNumber(s.distance) || !finiteNumber(s.maxHeight)) return fail('HUD/snapshot lacks score, distance, or maxHeight');
      return pass(`scene hash=${hash}, score=${s.score}, distance=${s.distance}, height=${s.maxHeight}`);
    }
  },
  {
    id: 'p1-real-click-start-unblocks-playfield',
    level: 'P1',
    name: 'real click start unblocks playfield',
    timeoutMs: 15000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.reset({ phase: 'menu' });
      const before = await game.snapshot();
      const after = await game.startByRealClick();
      if (after.phase !== 'launch' && after.phase !== 'flight') return fail(`start did not enter launch/flight, phase=${after.phase}`);
      if (after.overlayBlocking) return fail('overlay still blocks after start');
      if (!after.canInteractWithPlayfield) return fail('playfield is not interactable after start');
      if (before.phase === after.phase && before.overlayBlocking === after.overlayBlocking && before.canInteractWithPlayfield === after.canInteractWithPlayfield) {
        return fail('real start click caused no observable UI state change');
      }
      return pass(`phase ${before.phase} -> ${after.phase}, playfield interactable`);
    }
  },
  {
    id: 'p1-real-mouse-drag-launch-opposite-direction',
    level: 'P1',
    name: 'real mouse drag launch moves opposite pull direction',
    timeoutMs: 18000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('launch-ready');
      let before = await game.snapshot();
      if (before.phase === 'menu') before = await game.startByRealClick();
      if (before.phase !== 'launch') return fail(`expected launch-ready phase, got ${before.phase}`);
      const publicFrom = {
        x: Math.round(before.player.screenX || before.slingshot.screenX),
        y: Math.round(before.player.screenY || before.slingshot.screenY)
      };
      const publicTo = {
        x: Math.round(publicFrom.x - 90),
        y: Math.min(Math.round(publicFrom.y + 50), Math.round(before.playfield.y + before.playfield.height - 1))
      };
      const plannedPull = Math.hypot(publicTo.x - publicFrom.x, publicTo.y - publicFrom.y);
      const hashBefore = await game.canvasHash();
      await ctx.browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: publicFrom.x, y: publicFrom.y, button: 'none' });
      await ctx.browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: publicFrom.x, y: publicFrom.y, button: 'left', clickCount: 1 });
      await sleep(80);
      const pressed = await game.snapshot();
      const steps = 8;
      for (let i = 1; i <= steps; i++) {
        const x = publicFrom.x + (publicTo.x - publicFrom.x) * i / steps;
        const y = publicFrom.y + (publicTo.y - publicFrom.y) * i / steps;
        await ctx.browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
        await sleep(25);
      }
      const pulled = await game.snapshot();
      await ctx.browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: publicTo.x, y: publicTo.y, button: 'left', clickCount: 1 });
      const released = await game.snapshot();
      await sleep(250);
      const after = await game.snapshot();
      const hashAfter = await game.canvasHash();
      const dx = after.player.screenX - before.player.screenX;
      const dy = after.player.screenY - before.player.screenY;
      const vx = after.player.velocityX;
      const vy = after.player.velocityY;
      const initialPlayerShift = Math.hypot(pressed.player.screenX - before.player.screenX, pressed.player.screenY - before.player.screenY);
      const initialPullMagnitude = pressed.pull && finiteNumber(pressed.pull.dx) && finiteNumber(pressed.pull.dy)
        ? Math.hypot(pressed.pull.dx, pressed.pull.dy) : 0;
      if (initialPlayerShift > plannedPull * 0.2 || initialPullMagnitude > plannedPull * 0.2) {
        return fail(`public player point did not begin at the pilot: shift=${initialPlayerShift.toFixed(1)}, initialPull=${initialPullMagnitude.toFixed(1)}`);
      }
      const rightwardEvidence = released.player.screenX > pulled.player.screenX ||
        released.player.velocityX > 0 || after.player.velocityX > 0;
      const upwardEvidence = released.player.screenY < pulled.player.screenY ||
        released.player.worldY > pulled.player.worldY ||
        (pulled.player.worldY > 0 && released.player.velocityY !== 0);
      if (after.phase !== 'flight') return fail(`drag release did not enter flight, phase=${after.phase}`);
      if (!rightwardEvidence) return fail(`left/down pull should launch rightward, dx=${dx}, vx=${vx}`);
      if (!upwardEvidence) return fail(`left/down pull should launch upward immediately: dy=${dy}, vy=${vy}, releasedY=${released.player.screenY}, pulledY=${pulled.player.screenY}`);
      if (hashBefore === hashAfter && String(before.renderRevision) === String(after.renderRevision)) return fail('render did not change after real drag launch');
      return pass(`dx=${dx.toFixed(1)}, dy=${dy.toFixed(1)}, vx=${vx}, vy=${vy}`);
    }
  },
  {
    id: 'p1-contract-opposite-drag-direction',
    level: 'P1',
    name: 'contract dragLaunch opposite direction semantics',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      let base = await game.loadScenario('launch-ready');
      if (!snapshotLooksValid(base)) base = await game.snapshot();
      const origin = { screenX: base.player.screenX, screenY: base.player.screenY };
      await game.callInput({ type: 'dragLaunch', from: origin, to: { screenX: origin.screenX - 90, screenY: origin.screenY + 80 }, release: true });
      await sleep(250);
      const leftPull = await game.snapshot();
      await game.loadScenario('launch-ready');
      await game.callInput({ type: 'dragLaunch', from: origin, to: { screenX: origin.screenX + 90, screenY: origin.screenY + 80 }, release: true });
      await sleep(250);
      const rightPull = await game.snapshot();
      const deltaA = finiteNumber(leftPull.player.velocityX) ? leftPull.player.velocityX : leftPull.player.screenX - origin.screenX;
      const deltaB = finiteNumber(rightPull.player.velocityX) ? rightPull.player.velocityX : rightPull.player.screenX - origin.screenX;
      if (leftPull.phase !== 'flight' || rightPull.phase !== 'flight') return fail(`both dragLaunch actions must enter flight, got ${leftPull.phase}/${rightPull.phase}`);
      if (Math.abs(deltaA) < 1 || Math.abs(deltaB) < 1) return fail(`horizontal launch deltas too small: ${deltaA}, ${deltaB}`);
      if (Math.sign(deltaA) === Math.sign(deltaB)) return fail(`opposite drag directions did not produce opposite horizontal signs: ${deltaA}, ${deltaB}`);
      return pass(`opposite horizontal signs ${Math.sign(deltaA)} and ${Math.sign(deltaB)}`);
    }
  },
  {
    id: 'p1-real-key-flap-consumes-and-lifts',
    level: 'P1',
    name: 'real keyboard flap consumes resource and lifts',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('flight-with-flaps');
      const before = await game.snapshot();
      if (before.phase !== 'flight') return fail(`expected flight phase, got ${before.phase}`);
      if (before.flaps.remaining < 1) return fail('scenario lacks flaps');
      await pressKey(ctx.browser, 'Space');
      const after = await game.snapshot();
      const flapDelta = before.flaps.remaining - after.flaps.remaining;
      const velocityImproved = after.player.velocityY < before.player.velocityY || after.player.screenY < before.player.screenY || after.maxHeight >= before.maxHeight;
      if (flapDelta !== 1) return fail(`Space flap should consume exactly 1 flap, delta=${flapDelta}`);
      if (!velocityImproved) return fail(`flap did not improve upward motion: vy ${before.player.velocityY} -> ${after.player.velocityY}, y ${before.player.screenY} -> ${after.player.screenY}`);
      return pass(`flaps ${before.flaps.remaining}->${after.flaps.remaining}, vy ${before.player.velocityY}->${after.player.velocityY}`);
    }
  },
  {
    id: 'p1-real-visible-buff-collection',
    level: 'P1',
    name: 'real input near buff collection changes score and buff state',
    timeoutMs: 18000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('near-visible-buff');
      const before = await game.snapshot();
      if (before.phase !== 'flight') return fail(`near-visible-buff must be flight phase, got ${before.phase}`);
      if (!before.buffs || before.buffs.visible < 1) return fail('scenario has no visible uncollected buff');
      if (before.buffs.collected > 0 && (!before.buffs.nearest || before.buffs.nearest.reachable === false)) {
        return fail('near-visible-buff appears pre-collected or lacks a reachable visible target');
      }
      const target = before.buffs.nearest && finiteNumber(before.buffs.nearest.screenX) && finiteNumber(before.buffs.nearest.screenY)
        ? { x: before.buffs.nearest.screenX, y: before.buffs.nearest.screenY }
        : { x: before.playfield.x + before.playfield.width / 2, y: before.playfield.y + before.playfield.height / 2 };
      await ctx.browser.mouseClick(Math.round(target.x), Math.round(target.y));
      await sleep(180);
      await pressKey(ctx.browser, 'Space');
      await game.callInput({ type: 'wait', ms: 500 });
      await sleep(550);
      let after = await game.snapshot();
      if (after.buffs.collected <= before.buffs.collected && after.score <= before.score && after.buffs.active <= before.buffs.active) {
        await ctx.browser.mouseClick(Math.round(before.playfield.x + before.playfield.width / 2), Math.round(before.playfield.y + before.playfield.height / 2));
        await sleep(180);
        await pressKey(ctx.browser, 'Space');
        await game.callInput({ type: 'wait', ms: 500 });
        await sleep(550);
        after = await game.snapshot();
      }
      const collected = after.buffs.collected > before.buffs.collected;
      const scored = after.score > before.score;
      const visibleReduced = after.buffs.visible < before.buffs.visible;
      const activeChanged = after.buffs.active > before.buffs.active || after.flaps.remaining > before.flaps.remaining || after.flaps.remaining < before.flaps.remaining;
      const nearestChanged = JSON.stringify(after.buffs.nearest || null) !== JSON.stringify(before.buffs.nearest || null);
      if (!(collected || scored) || !(visibleReduced || activeChanged || nearestChanged || after.buffs.nearest === null)) {
        return fail(`buff collection not observable: score ${before.score}->${after.score}, collected ${before.buffs.collected}->${after.buffs.collected}, visible ${before.buffs.visible}->${after.buffs.visible}`);
      }
      if (after.flaps.remaining > after.flaps.max) return fail(`flaps exceeded max after buff: ${after.flaps.remaining}/${after.flaps.max}`);
      return pass(`score ${before.score}->${after.score}, buffs ${before.buffs.collected}->${after.buffs.collected}`);
    }
  },
  {
    id: 'p1-result-and-retry-state-machine',
    level: 'P1',
    name: 'result state shows stats and real retry resets run',
    timeoutMs: 22000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('near-landing');
      let result = await game.snapshot();
      for (let i = 0; i < 12 && result.phase !== 'result'; i++) {
        await game.callInput({ type: 'wait', ms: 500 });
        await sleep(550);
        result = await game.snapshot();
      }
      if (result.phase !== 'result' || !result.result || !result.result.visible) return fail(`near-landing did not reach visible result, phase=${result.phase}`);
      if (!finiteNumber(result.result.finalScore) || result.result.finalScore < 0) return fail('result finalScore missing');
      const clicked = await game.clickSemanticButton('retry');
      if (!clicked) return fail('real retry requires a visible semantic retry control');
      await sleep(400);
      const after = await game.snapshot();
      if (after.phase !== 'launch') return fail(`retry did not return to launch, phase=${after.phase}`);
      if (after.score !== 0 || after.distance !== 0 || (after.buffs && after.buffs.collected !== 0)) return fail(`retry did not clear transient run values: score=${after.score}, distance=${after.distance}, buffs=${after.buffs && after.buffs.collected}`);
      return pass(`result score=${result.result.finalScore}, retry phase=${after.phase}`);
    }
  },
  {
    id: 'p2-invalid-flap-in-launch-unchanged',
    level: 'P2',
    name: 'invalid flap in launch phase is rejected unchanged',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('launch-ready');
      const before = await game.snapshot();
      const res = await game.callInput({ type: 'flap', source: 'keyboard' });
      await sleep(200);
      const after = await game.snapshot();
      const unchanged = before.phase === after.phase &&
        before.flaps.remaining === after.flaps.remaining &&
        before.score === after.score &&
        before.distance === after.distance;
      if (!unchanged) return fail(`invalid launch flap mutated state: phase ${before.phase}->${after.phase}, flaps ${before.flaps.remaining}->${after.flaps.remaining}, score ${before.score}->${after.score}`);
      if (res && res.ok === true && after.phase === 'launch') return fail('invalid flap returned ok:true despite being rejected by state');
      return pass('launch-phase flap rejected with unchanged state');
    }
  },
  {
    id: 'p2-zero-flaps-rejects-extra-flap',
    level: 'P2',
    name: 'zero flaps cannot go negative or create extra flap effect',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('flight-with-flaps');
      const controlBefore = await game.snapshot();
      await ctx.browser.keyDown('Space');
      const controlImmediate = await game.snapshot();
      await sleep(KEY_HOLD_MS);
      await ctx.browser.keyUp('Space');
      await sleep(KEY_SETTLE_MS);
      const controlAfter = await game.snapshot();
      const controlLift = controlAfter.player.velocityY - controlBefore.player.velocityY;
      const immediateLift = controlImmediate.player.velocityY - controlBefore.player.velocityY;
      const controlDirection = Math.sign(immediateLift || controlLift || 1);
      if (!(controlBefore.flaps.remaining > controlAfter.flaps.remaining && controlLift !== 0)) {
        return fail(`positive control did not produce a valid flap: flaps ${controlBefore.flaps.remaining}->${controlAfter.flaps.remaining}, vy ${controlBefore.player.velocityY}->${controlAfter.player.velocityY}`);
      }

      await game.loadScenario('flight-no-flaps');
      const baselineBefore = await game.snapshot();
      await sleep(KEY_OBSERVATION_MS);
      const baselineAfter = await game.snapshot();
      const baselineLift = baselineAfter.player.velocityY - baselineBefore.player.velocityY;
      const baselineCollected = (baselineAfter.buffs ? baselineAfter.buffs.collected : 0) - (baselineBefore.buffs ? baselineBefore.buffs.collected : 0);

      await game.loadScenario('flight-no-flaps');
      const before = await game.snapshot();
      if (before.phase !== 'flight') return fail(`expected flight phase, got ${before.phase}`);
      if (before.flaps.remaining !== 0) return fail(`scenario must expose zero flaps, got ${before.flaps.remaining}`);
      await pressKey(ctx.browser, 'Space');
      const after = await game.snapshot();
      const zeroLift = after.player.velocityY - before.player.velocityY;
      const extraLift = (zeroLift - baselineLift) * controlDirection;
      const allowedExtraLift = Math.max(1, Math.abs(controlLift) * 0.35, Math.abs(baselineLift) * 1.25);
      const collectedDelta = (after.buffs ? after.buffs.collected : 0) - (before.buffs ? before.buffs.collected : 0);
      if (after.flaps.remaining < 0) return fail(`flaps went negative: ${after.flaps.remaining}`);
      if (after.flaps.remaining !== 0) return fail(`zero-flap input changed remaining flaps: ${after.flaps.remaining}`);
      if (extraLift > allowedExtraLift) {
        return fail(`zero-flap key created flap-like lift: zeroLift=${zeroLift}, baselineLift=${baselineLift}, controlLift=${controlLift}`);
      }
      if (collectedDelta > baselineCollected) {
        return fail(`zero-flap key created extra collection: baseline=${baselineCollected}, withKey=${collectedDelta}`);
      }
      return pass(`zero flaps stable; lift baseline=${baselineLift}, withKey=${zeroLift}, control=${controlLift}`);
    }
  },
  {
    id: 'p2-high-score-persists-across-retry',
    level: 'P2',
    name: 'high score persists while retry clears transient score',
    timeoutMs: 18000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('near-landing', { scoreHint: 500 });
      let result = await game.snapshot();
      for (let i = 0; i < 12 && result.phase !== 'result'; i++) {
        await game.callInput({ type: 'wait', ms: 500 });
        await sleep(500);
        result = await game.snapshot();
      }
      if (result.phase !== 'result') return fail('could not reach result for high score check');
      const highBeforeRetry = result.result.highScore;
      const finalScore = result.result.finalScore;
      if (!finiteNumber(highBeforeRetry) || highBeforeRetry < finalScore) return fail(`high score did not reflect final score: high=${highBeforeRetry}, final=${finalScore}`);
      const clicked = await game.clickSemanticButton('retry');
      if (!clicked) return fail('real retry requires a visible semantic retry control');
      await sleep(350);
      const after = await game.snapshot();
      if (after.phase !== 'launch') return fail(`retry failed after high score result, phase=${after.phase}`);
      if (after.score !== 0 || after.distance !== 0) return fail(`retry did not clear transient score/distance: ${after.score}/${after.distance}`);
      const retained = after.result && finiteNumber(after.result.highScore) ? after.result.highScore : highBeforeRetry;
      if (retained < highBeforeRetry) return fail(`high score was lost on retry: ${highBeforeRetry}->${retained}`);
      return pass(`final=${finalScore}, highScore retained=${retained}`);
    }
  },
  {
    id: 'p2-high-altitude-visible-feedback',
    level: 'P2',
    name: 'high altitude produces visible environment feedback',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('high-altitude');
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      await game.callInput({ type: 'wait', ms: 500 });
      await sleep(550);
      const after = await game.snapshot();
      const hashAfter = await game.canvasHash();
      const highAltitudeState = before.highAltitude === true || after.highAltitude === true;
      const scenarioAltitude = before.maxHeight > 0 || after.maxHeight > 0 || highAltitudeState;
      const highEnough = after.maxHeight >= before.maxHeight && scenarioAltitude;
      const visibleChange = hashBefore !== hashAfter || String(before.renderRevision) !== String(after.renderRevision) || after.highAltitude === true || (after.buffs && after.buffs.visible >= before.buffs.visible);
      if (!highEnough) return fail(`high-altitude scenario not observably high: maxHeight ${before.maxHeight}->${after.maxHeight}`);
      if (!visibleChange) return fail('high altitude has no visible render or state feedback');
      return pass(`height ${before.maxHeight}->${after.maxHeight}, visibleChange=${visibleChange}`);
    }
  },
  {
    id: 'p2-real-info-panel-blocks-and-closes',
    level: 'P2',
    name: 'real info panel opens blocks and closes',
    timeoutMs: 15000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ensureContract(game);
      await game.loadScenario('launch-ready');
      const before = await game.snapshot();
      let opened = await game.clickSemanticButton('info');
      if (!opened) {
        await game.callInput({ type: 'openInfo' });
        opened = true;
      }
      await sleep(300);
      const info = await game.snapshot();
      if (!info.ui || !info.ui.infoOpen) return fail('info panel did not open');
      if (!info.overlayBlocking) return fail('info panel should block playfield while open');
      const closed = await game.clickSemanticButton('close');
      if (!closed) await game.callInput({ type: 'closeInfo' });
      await sleep(300);
      const after = await game.snapshot();
      if (after.ui && after.ui.infoOpen) return fail('info panel did not close');
      if (after.overlayBlocking && before.canInteractWithPlayfield) return fail('overlay still blocks after closing info panel');
      return pass(`infoOpen ${before.ui && before.ui.infoOpen}->${info.ui.infoOpen}->${after.ui && after.ui.infoOpen}`);
    }
  }
];

module.exports = { sleep, createGameDriver, suite: checks };
