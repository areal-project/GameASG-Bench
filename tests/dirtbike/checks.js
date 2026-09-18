const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// === GDD Coverage Map ===
// M1 (启动与主场景) -> p0-boot-stability, p0-visible-2d-scene
// M2 (开始/重开流程) -> p1-real-click-start-unblocks-playfield, p1-ready-throttle-starts-race, p1-restart-cleans-result
// M3 (油门前进) -> p1-ready-throttle-starts-race, p1-real-key-throttle-progress, p2-real-touch-throttle-equivalence
// M4 (方向与空中姿态) -> p1-throttle-direction-opposite-idle, p1-sustained-throttle-physics-challenge
// M5 (地形物理) -> p1-terrain-physics-observable, p1-sustained-throttle-physics-challenge
// M6 (摔车与重生) -> p1-crash-respawn-loop, p1-sustained-throttle-physics-challenge
// M7 (冲线结算) -> p1-finish-freezes-result
// M8 (多赛道) -> p2-track-switch-changes-terrain
// M9 (成绩与幽灵车) -> p2-records-and-ghosts-contract
// M9b (成绩清除) -> p2-clear-records-removes-ghosts
// M10 (翻转加速) -> p2-flip-boost-reward
// M11 (反馈与音画) -> p0-visible-2d-scene, p1-crash-respawn-loop, p2-flip-boost-reward
// M12 (编辑器裁剪) -> not required for P1; covered as explicit cut scope in GDD
//
// === Category Map ===
// Boot & Stability -> p0-boot-stability, p0-visible-2d-scene
// UI Flow & Blocking -> p1-real-click-start-unblocks-playfield, p1-ready-throttle-starts-race, p1-restart-cleans-result
// Input Semantics -> p1-ready-throttle-starts-race, p1-real-key-throttle-progress, p1-throttle-direction-opposite-idle, p2-real-touch-throttle-equivalence
// Core Mechanic Loop -> p1-terrain-physics-observable, p1-sustained-throttle-physics-challenge, p1-crash-respawn-loop, p1-finish-freezes-result
// State Machine -> p1-restart-cleans-result, p2-terminal-throttle-unchanged
// Economy/Progression -> p2-track-switch-changes-terrain, p2-records-and-ghosts-contract, p2-clear-records-removes-ghosts
// Feedback & Observability -> p0-visible-2d-scene, p2-flip-boost-reward
// Invariants & Rejection -> p2-invalid-action-rejected-conserves-state
//
// === Rationality Map ===
// p1-real-click-start-unblocks-playfield: M2 | real action: visible DOM/canvas click | independent observation: phase + overlay/canInteract | empty-shell failure: menu remains blocking or no playable state fails
// p1-ready-throttle-starts-race: M2/M3 | real action: mouse hold on playfield from ready state | independent observation: race started/time/progress + scene change | empty-shell failure: separate shell start button works but gas cannot start the core race fails
// p1-real-key-throttle-progress: M3 | real action: ArrowUp hold | independent observation: progress/worldX + canvas/hash/revision | empty-shell failure: key listener only or static timer fails
// p1-throttle-direction-opposite-idle: M3/M4 | real action: ArrowUp hold vs idle from same legal setup | independent observation: progress/velocity deltas and screen evidence | empty-shell failure: no acceleration, reversed/no forward movement, or identical tracks fail
// p1-terrain-physics-observable: M5 | real action: sustained throttle/step | independent observation: angle/airborne/grounded, bike/terrain surface envelope, or scene revision | empty-shell failure: flat sliding sprite, detached bike rendering, or physics-only hidden terrain fails
// p1-sustained-throttle-physics-challenge: M4/M5/M6 | real action: continuous ArrowUp sampled over hilly terrain | independent observation: coupled progress/velocity/angle/vertical/contact/airborne dynamics | empty-shell failure: hold-up glide with only progress or sprite angle changes fails
// p1-crash-respawn-loop: M6 | real action: near-crash scenario + key/step | independent observation: crashCount/crashVisible then respawnCount/crashed false | empty-shell failure: no crash rule or direct lose state fails
// p1-finish-freezes-result: M7 | real action: near-finish scenario + real key hold | independent observation: resultVisible/finalMs/HUD and final time unchanged | empty-shell failure: pre-awarded victory or terminal still mutable fails
// p1-restart-cleans-result: M2/M7 | real action: finish then visible restart/click or contract restart | independent observation: phase/time/result cleared | empty-shell failure: one-shot result screen cannot restart
// p2-track-switch-changes-terrain: M8 | real action: track selection contract or visible selector click | independent observation: track index + terrainSignature | empty-shell failure: fake three buttons with same terrain fails
// p2-records-and-ghosts-contract: M9 | contract setup: with-records | independent observation: sorted records + ghostCount | empty-shell failure: unsorted/static/cross-track record shell fails
// p2-clear-records-removes-ghosts: M9b | contract setup: with-records then clearRecords | independent observation: records and ghostCount drop to zero while play remains available | empty-shell failure: decorative clear button or stale ghosts fail
// p2-flip-boost-reward: M10 | contract setup: airborne + player-level throttle/step | independent observation: activeBoosts/boostVisible/velocity | empty-shell failure: no legal flip chain or no reward feedback fails
// p2-real-touch-throttle-equivalence: M3/M4 | real action: CDP touch hold/release on playfield | independent observation: progress/time/scene delta + input release | empty-shell failure: mouse-only implementation or sticky touch throttle fails
// p2-invalid-action-rejected-conserves-state: M2/M8/M10 | contract action: invalid/unknown/out-of-range | independent observation: ok:false + unchanged totals | empty-shell failure: ok:true APIs or illegal mutation fail
// p2-terminal-throttle-unchanged: M7 | setup: near-finish then real key hold after finish | independent observation: finalMs unchanged | empty-shell failure: terminal state still advances time/result fails

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function valueOr(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}

function progressOf(snapshot) {
  if (!snapshot) return null;
  if (snapshot.track && finiteNumber(snapshot.track.progress)) return snapshot.track.progress;
  if (snapshot.bike && finiteNumber(snapshot.bike.worldX)) return snapshot.bike.worldX;
  return null;
}

function velocityOf(snapshot) {
  if (!snapshot || !snapshot.bike) return 0;
  return finiteNumber(snapshot.bike.velocityX) ? snapshot.bike.velocityX : 0;
}

function phaseOf(snapshot) {
  return snapshot && (snapshot.phase || snapshot.screen || '');
}

function trackSig(snapshot) {
  if (!snapshot || !snapshot.track) return '';
  return [
    valueOr(snapshot.track.index, 'x'),
    valueOr(snapshot.track.theme, ''),
    valueOr(snapshot.track.terrainSignature, ''),
    valueOr(snapshot.track.length, '')
  ].join('|');
}

function surfaceEnvelopeError(snapshot, label) {
  const envelope = snapshot?.track?.surfaceEnvelope;
  if (!envelope || typeof envelope !== 'object') return `${label}: track.surfaceEnvelope missing`;
  const required = ['bikeScreenX', 'bikeContactScreenY', 'terrainScreenY', 'tolerance'];
  for (const key of required) {
    if (!finiteNumber(envelope[key])) return `${label}: track.surfaceEnvelope.${key} must be finite`;
  }
  if (envelope.tolerance < 0) return `${label}: track.surfaceEnvelope.tolerance must be non-negative`;
  if (typeof envelope.bikeOnVisibleSurface !== 'boolean') return `${label}: track.surfaceEnvelope.bikeOnVisibleSurface must be boolean`;
  const bike = snapshot?.bike || {};
  const mustTouchSurface = bike.grounded === true && bike.airborne !== true && bike.crashed !== true;
  const within = Math.abs(envelope.bikeContactScreenY - envelope.terrainScreenY) <= Math.max(1, envelope.tolerance);
  if (mustTouchSurface && !envelope.bikeOnVisibleSurface) return `${label}: grounded bike is not on the visible terrain surface`;
  if (mustTouchSurface && !within) return `${label}: grounded bike contact ${envelope.bikeContactScreenY} is detached from terrain ${envelope.terrainScreenY}`;
  if (envelope.bikeOnVisibleSurface && !within) return `${label}: bikeOnVisibleSurface contradicts contact/terrain coordinates`;
  return null;
}

function essentialState(snapshot) {
  if (!snapshot) return null;
  return {
    phase: snapshot.phase,
    screen: snapshot.screen,
    trackIndex: snapshot.track && snapshot.track.index,
    progress: snapshot.track && snapshot.track.progress,
    finalMs: snapshot.time && snapshot.time.finalMs,
    resultVisible: snapshot.race && snapshot.race.resultVisible,
    activeBoosts: snapshot.bike && snapshot.bike.activeBoosts,
    bestCount: snapshot.records && snapshot.records.personalBestCount
  };
}

function shallowEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createGameDriver(browser) {
  async function evalPage(src) {
    return await browser.eval(`(async function(){ ${src} })()`);
  }

  async function findClickableButton(patternSource, excludePatternSource = '') {
    return await evalPage(`
      const include = new RegExp(${JSON.stringify(patternSource)}, 'i');
      const exclude = ${JSON.stringify(excludePatternSource)} ? new RegExp(${JSON.stringify(excludePatternSource)}, 'i') : null;
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], a')).map(el => {
        const r = el.getBoundingClientRect();
        const text = ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '') + ' ' + (el.title || '')).trim();
        const style = getComputedStyle(el);
        const x = r.x + r.width / 2;
        const y = r.y + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        const hitMatches = !!hit && (hit === el || el.contains(hit) || hit.contains(el));
        return {
          text,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          visible: r.width > 8 && r.height > 8 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.05,
          hitMatches
        };
      }).filter(b => b.visible && b.hitMatches && include.test(b.text) && (!exclude || !exclude.test(b.text)));
      return candidates[0] || null;
    `);
  }

  async function getDomSummary() {
    return await evalPage(`
      const canvases = Array.from(document.querySelectorAll('canvas')).map(c => {
        const r = c.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, pixels: (c.width || 0) * (c.height || 0), visible: r.width > 80 && r.height > 80 };
      });
      let playfield = canvases.filter(c => c.visible).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a')).map(el => {
        const r = el.getBoundingClientRect();
        const text = ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '') + ' ' + (el.title || '')).trim();
        const style = getComputedStyle(el);
        return {
          text,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          visible: r.width > 8 && r.height > 8 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.05
        };
      }).filter(b => b.visible);
      const text = document.body ? document.body.innerText.slice(0, 3000) : '';
      return { playfield, buttons, text, canvasCount: canvases.length };
    `);
  }

  async function snapshot() {
    const data = await evalPage(`
      if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
        const s = await window.__gameTest.getSnapshot();
        return Object.assign({ source: 'contract' }, s || {});
      }
      const canvases = Array.from(document.querySelectorAll('canvas')).map(c => {
        const r = c.getBoundingClientRect();
        return { width: r.width, height: r.height, pixels: (c.width || 0) * (c.height || 0) };
      });
      const main = canvases.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
      const text = document.body ? document.body.innerText : '';
      const hasResult = /finish|complete|result|time|again|restart|race/i.test(text);
      return {
        source: 'dom',
        phase: hasResult ? 'unknown' : 'unknown',
        screen: 'unknown',
        overlayBlocking: false,
        canInteractWithPlayfield: !!main,
        track: { index: 0, count: 0, progress: null, length: null, terrainSignature: '' },
        time: { running: false, elapsedMs: null, finalMs: null },
        bike: { worldX: null, worldY: null, screenX: null, screenY: null, velocityX: null, velocityY: null, angle: null, angularVelocity: null, grounded: null, airborne: null, crashed: false, activeBoosts: 0 },
        input: { accelerating: false },
        race: { started: false, finished: false, resultVisible: hasResult, crashCount: 0, respawnCount: 0 },
        feedback: { canvasReady: !!main, visibleSceneRevision: window.__l2 ? window.__l2.drawCalls : 0, hudText: text.slice(0, 500), crashVisible: /crash|respawn|wreck/i.test(text), boostVisible: /boost|flip/i.test(text), confettiVisible: false, ghostCount: 0 },
        records: { personalBestCount: 0, bestTimesMs: [] },
        controls: { playfieldBounds: main ? { x: 0, y: 0, width: main.width, height: main.height } : { x: 0, y: 0, width: 0, height: 0 } },
        lastAction: { ok: true, type: 'snapshot' }
      };
    `);
    return data && !data.__l2_err__ ? data : null;
  }

  async function waitForReady() {
    const deadline = Date.now() + 8000;
    let last = null;
    while (Date.now() < deadline) {
      last = await snapshot();
      const dom = await getDomSummary();
      if (last && (last.feedback?.canvasReady || dom.playfield || last.phase === 'ready' || last.phase === 'playing')) {
        return last;
      }
      await sleep(250);
    }
    throw new Error(`game not ready: ${JSON.stringify(last)}`);
  }

  async function contractInput(action) {
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') {
        return { missing: true, lastAction: { ok: false, type: ${JSON.stringify(action.type || 'unknown')}, reason: 'missing __gameTest.input' } };
      }
      const result = await window.__gameTest.input(${JSON.stringify(action)});
      return result || (window.__gameTest.getSnapshot ? await window.__gameTest.getSnapshot() : null);
    `);
  }

  async function reset(options = {}) {
    return await evalPage(`
      if (window.__gameTest && typeof window.__gameTest.reset === 'function') {
        return await window.__gameTest.reset(${JSON.stringify(options)});
      }
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], a')).filter(el => {
        const text = ((el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '') + ' ' + (el.title || '')).toLowerCase();
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8 && /(reset|restart|again|retry|start)/i.test(text);
      });
      if (candidates[0]) candidates[0].click();
      return { ok: !!candidates[0] };
    `);
  }

  async function startByVisibleClick() {
    const dom = await getDomSummary();
    const start = (dom.buttons || []).find(b => /start|play|race|again|retry|restart/i.test(b.text));
    if (start) {
      await browser.mouseClick(start.x + start.width / 2, start.y + start.height / 2);
      await sleep(600);
      return { used: 'button', target: start.text.slice(0, 40) };
    }
    if (dom.playfield) {
      await browser.mouseClick(dom.playfield.x + dom.playfield.width / 2, dom.playfield.y + dom.playfield.height / 2);
      await sleep(600);
      return { used: 'playfield' };
    }
    const r = await contractInput({ type: 'start' });
    await sleep(300);
    return { used: 'contract', result: r };
  }

  async function ensurePlaying() {
    await waitForReady();
    let s = await snapshot();
    if (s && (s.phase === 'playing' || s.phase === 'ready') && s.overlayBlocking === false) return s;
    await startByVisibleClick();
    s = await snapshot();
    if (s && (s.phase === 'playing' || s.phase === 'ready' || s.canInteractWithPlayfield)) return s;
    return s;
  }

  async function loadScenario(name, options = {}, settleMs = 250) {
    const result = await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') {
        return { missing: true, reason: 'missing loadScenario' };
      }
      return await window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options)});
    `);
    if (settleMs > 0) await sleep(settleMs);
    return result;
  }

  async function realKeyHold(key, ms) {
    await browser.holdKey(key, ms);
    await sleep(250);
  }

  async function realMouseThrottle(ms) {
    const dom = await getDomSummary();
    if (!dom.playfield) return { ok: false, reason: 'no playfield' };
    const x = dom.playfield.x + dom.playfield.width / 2;
    const y = dom.playfield.y + dom.playfield.height / 2;
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, modifiers: 0 });
    await sleep(ms);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, modifiers: 0 });
    await sleep(250);
    return { ok: true, x, y };
  }

  async function realTouchThrottle(ms) {
    const dom = await getDomSummary();
    if (!dom.playfield) return { ok: false, reason: 'no playfield' };
    const x = dom.playfield.x + dom.playfield.width / 2;
    const y = dom.playfield.y + dom.playfield.height / 2;
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, radiusX: 8, radiusY: 8, force: 0.8, id: 1 }],
      modifiers: 0
    });
    await sleep(ms);
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
      modifiers: 0
    });
    await sleep(300);
    return { ok: true, x, y };
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  return {
    waitForReady,
    snapshot,
    getDomSummary,
    contractInput,
    reset,
    findClickableButton,
    startByVisibleClick,
    ensurePlaying,
    loadScenario,
    realKeyHold,
    realMouseThrottle,
    realTouchThrottle,
    canvasHash
  };
}

const checks = [
  {
    id: 'p0-boot-stability',
    level: 'P0',
    name: 'Boot stability and public scene readiness',
    timeoutMs: 15000,
    async run(ctx) {
      const { browser } = ctx;
      await sleep(1000);
      if (browser.exceptions.length > 0) {
        return FAIL(`runtime exception: ${browser.exceptions[0].description || browser.exceptions[0].text}`);
      }
      const game = createGameDriver(browser);
      const snap = await game.waitForReady();
      const dom = await game.getDomSummary();
      if (!snap && !dom.playfield) return FAIL('no readable snapshot or playfield');
      return PASS(`ready via ${snap?.source || 'dom'}, canvasCount=${dom.canvasCount}`);
    }
  },
  {
    id: 'p0-visible-2d-scene',
    level: 'P0',
    name: 'Visible nonblank 2D scene and render surface',
    timeoutMs: 15000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const dom = await game.getDomSummary();
      if (!dom.playfield || dom.playfield.width < 200 || dom.playfield.height < 150) {
        return FAIL('primary playfield is missing or too small');
      }
      const h1 = await game.canvasHash();
      await sleep(500);
      const h2 = await game.canvasHash();
      const snap = await game.snapshot();
      if (!h1 || !h2) return FAIL('could not read scene hash');
      if (!snap?.feedback?.canvasReady && h1 === h2 && !snap?.feedback?.visibleSceneRevision) {
        return FAIL('scene lacks readable canvas/snapshot evidence');
      }
      return PASS(`playfield ${Math.round(dom.playfield.width)}x${Math.round(dom.playfield.height)}`);
    }
  },
  {
    id: 'p1-real-click-start-unblocks-playfield',
    level: 'P1',
    name: 'UI flow real click start unblocks playfield',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.reset({ showStart: true });
      await sleep(300);
      const before = await game.snapshot();
      const start = await game.startByVisibleClick();
      const after = await game.snapshot();
      if (!after) return FAIL('no snapshot after start click');
      if (after.overlayBlocking === true || after.canInteractWithPlayfield === false) {
        return FAIL('playfield remains blocked after start');
      }
      if (!['ready', 'playing', 'race'].includes(phaseOf(after)) && before && phaseOf(before) === phaseOf(after) && start.used === 'contract') {
        return FAIL('start did not produce playable phase');
      }
      return PASS(`start path=${start.used}, phase=${phaseOf(after)}`);
    }
  },
  {
    id: 'p1-ready-throttle-starts-race',
    level: 'P1',
    name: 'UI flow real throttle starts ready race and timer',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const setup = await game.loadScenario('ready-track', { trackIndex: 0 });
      if (setup?.missing) return FAIL('missing ready-track scenario contract');
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      const throttle = await game.realMouseThrottle(900);
      if (!throttle.ok) return FAIL(`could not perform real mouse throttle: ${throttle.reason}`);
      const after = await game.snapshot();
      const hashAfter = await game.canvasHash();
      const beforeProgress = progressOf(before);
      const afterProgress = progressOf(after);
      const progressDelta = finiteNumber(beforeProgress) && finiteNumber(afterProgress) ? afterProgress - beforeProgress : 0;
      const positionDelta = finiteNumber(before?.bike?.worldX) && finiteNumber(after?.bike?.worldX) ? after.bike.worldX - before.bike.worldX : progressDelta;
      const elapsedDelta = finiteNumber(before?.time?.elapsedMs) && finiteNumber(after?.time?.elapsedMs) ? after.time.elapsedMs - before.time.elapsedMs : 0;
      const sceneChanged = hashBefore !== hashAfter || (after?.feedback?.visibleSceneRevision || 0) > (before?.feedback?.visibleSceneRevision || 0);
      const started = after?.race?.started || phaseOf(after) === 'playing' || after?.time?.running || elapsedDelta > 0;
      if (after?.overlayBlocking === true || after?.canInteractWithPlayfield === false) {
        return FAIL('playfield blocked after throttle start');
      }
      if (!started) return FAIL('ready-state throttle did not start the race');
      if (!(progressDelta > 0 || positionDelta > 0 || elapsedDelta > 0)) {
        return FAIL(`throttle start had no progress/time/scene evidence: progressDelta=${progressDelta}, elapsedDelta=${elapsedDelta}`);
      }
      if (!sceneChanged && progressDelta <= 0 && positionDelta <= 0) return FAIL('throttle start lacked visible scene or bike position evidence');
      if (after?.input?.accelerating === true) {
        return FAIL('accelerating stayed true after mouse release');
      }
      return PASS(`started=${started}, progressDelta=${progressDelta}, elapsedDelta=${elapsedDelta}, sceneChanged=${sceneChanged}`);
    }
  },
  {
    id: 'p1-real-key-throttle-progress',
    level: 'P1',
    name: 'Input semantics real keyboard throttle advances race',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.loadScenario('ready-track', { trackIndex: 0 });
      await game.ensurePlaying();
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      await game.realKeyHold('ArrowUp', 900);
      const after = await game.snapshot();
      const hashAfter = await game.canvasHash();
      const beforeProgress = progressOf(before);
      const afterProgress = progressOf(after);
      const delta = finiteNumber(beforeProgress) && finiteNumber(afterProgress) ? afterProgress - beforeProgress : null;
      const positionDelta = finiteNumber(before?.bike?.worldX) && finiteNumber(after?.bike?.worldX) ? after.bike.worldX - before.bike.worldX : delta;
      const sceneChanged = hashBefore !== hashAfter || (after?.feedback?.visibleSceneRevision || 0) > (before?.feedback?.visibleSceneRevision || 0);
      if (!(finiteNumber(delta) && delta > 0) && !(finiteNumber(positionDelta) && positionDelta > 0)) {
        return FAIL(`throttle produced no progress or visible change: delta=${delta}`);
      }
      if (!sceneChanged && !(finiteNumber(positionDelta) && positionDelta > 0)) return FAIL('keyboard throttle lacked visible scene or bike position evidence');
      if (after?.input?.accelerating === true) {
        return FAIL('accelerating stayed true after key release');
      }
      return PASS(`progress delta=${delta}, sceneChanged=${sceneChanged}`);
    }
  },
  {
    id: 'p1-throttle-direction-opposite-idle',
    level: 'P1',
    name: 'Direction semantics throttle forward differs from idle',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.loadScenario('rolling', { trackIndex: 0 });
      await game.ensurePlaying();
      const idleStart = await game.snapshot();
      await sleep(800);
      const idleEnd = await game.snapshot();
      const idleDelta = progressOf(idleStart) !== null && progressOf(idleEnd) !== null ? progressOf(idleEnd) - progressOf(idleStart) : 0;

      await game.loadScenario('rolling', { trackIndex: 0 });
      await game.ensurePlaying();
      const throttleStart = await game.snapshot();
      await game.realKeyHold('ArrowUp', 800);
      const throttleEnd = await game.snapshot();
      const throttleDelta = progressOf(throttleStart) !== null && progressOf(throttleEnd) !== null ? progressOf(throttleEnd) - progressOf(throttleStart) : 0;
      const velocityDelta = velocityOf(throttleEnd) - velocityOf(throttleStart);

      // Direction/opposite check: throttle and idle must not produce the same signed result;
      // throttle should be more forward than idle in screen/progress semantics.
      const directionOppositeOrStronger = throttleDelta > Math.max(0.01, idleDelta + 0.01) || velocityDelta > 0.01;
      if (!directionOppositeOrStronger) {
        return FAIL(`throttle did not move more forward than idle: throttleDelta=${throttleDelta}, idleDelta=${idleDelta}, velocityDelta=${velocityDelta}`);
      }
      if (throttleDelta < -0.01) {
        return FAIL(`throttle moved backward in progress semantics: ${throttleDelta}`);
      }
      return PASS(`throttleDelta=${throttleDelta}, idleDelta=${idleDelta}`);
    }
  },
  {
    id: 'p1-terrain-physics-observable',
    level: 'P1',
    name: 'Core mechanic terrain physics affects bike state',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.loadScenario('rolling', { trackIndex: 1 });
      await game.ensurePlaying();
      const before = await game.snapshot();
      await game.realMouseThrottle(1200);
      const after = await game.snapshot();
      if (!before?.bike || !after?.bike) return FAIL('bike snapshot missing');
      const surfaceBefore = surfaceEnvelopeError(before, 'terrain before throttle');
      if (surfaceBefore) return FAIL(surfaceBefore);
      const surfaceAfter = surfaceEnvelopeError(after, 'terrain after throttle');
      if (surfaceAfter) return FAIL(surfaceAfter);
      const angleChanged = finiteNumber(before.bike.angle) && finiteNumber(after.bike.angle) && Math.abs(after.bike.angle - before.bike.angle) > 0.02;
      const contactChanged = before.bike.airborne !== after.bike.airborne || before.bike.grounded !== after.bike.grounded;
      const progressDelta = progressOf(before) !== null && progressOf(after) !== null ? progressOf(after) - progressOf(before) : 0;
      if (!angleChanged && !contactChanged && !(progressDelta > 0.02)) {
        return FAIL('terrain drive did not affect angle, contact, or progress');
      }
      return PASS(`angleChanged=${angleChanged}, contactChanged=${contactChanged}, progressDelta=${progressDelta}`);
    }
  },
  {
    id: 'p1-sustained-throttle-physics-challenge',
    level: 'P1',
    name: 'Core mechanic sustained throttle exposes terrain challenge',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.loadScenario('rolling', { track: 1, index: 1, trackIndex: 1 });
      await game.ensurePlaying();
      const samples = [];
      samples.push(await game.snapshot());
      await ctx.browser.keyDown('ArrowUp');
      for (let i = 0; i < 20; i++) {
        await sleep(450);
        const sample = await game.snapshot();
        samples.push(sample);
        if (sample?.phase === 'finished' || sample?.screen === 'results') break;
      }
      await ctx.browser.keyUp('ArrowUp');
      await sleep(250);
      const afterRelease = await game.snapshot();
      const valid = samples.filter(Boolean);
      if (valid.length < 4) return FAIL('not enough readable samples during sustained throttle');

      const start = valid[0];
      const end = valid[valid.length - 1];
      const progressDelta = progressOf(start) !== null && progressOf(end) !== null ? progressOf(end) - progressOf(start) : 0;
      const velocities = valid.map(s => s?.bike?.velocityX).filter(finiteNumber);
      const velocityRange = velocities.length ? Math.max(...velocities) - Math.min(...velocities) : 0;
      const angles = valid.map(s => s?.bike?.angle).filter(finiteNumber);
      const angleRange = angles.length ? Math.max(...angles) - Math.min(...angles) : 0;
      const worldYs = valid.map(s => s?.bike?.worldY).filter(finiteNumber);
      const screenYs = valid.map(s => s?.bike?.screenY).filter(finiteNumber);
      const verticalRange = worldYs.length
        ? Math.max(...worldYs) - Math.min(...worldYs)
        : (screenYs.length ? Math.max(...screenYs) - Math.min(...screenYs) : 0);
      const airborneSeen = valid.some(s => s?.bike?.airborne === true);
      const crashedSeen = valid.some(s => s?.bike?.crashed === true || s?.feedback?.crashVisible === true);
      const crashDelta = (end?.race?.crashCount || 0) - (start?.race?.crashCount || 0);
      const respawnDelta = (end?.race?.respawnCount || 0) - (start?.race?.respawnCount || 0);
      const groundedValues = new Set(valid.map(s => s?.bike?.grounded).filter(v => typeof v === 'boolean'));
      const surfaceOffsets = valid.map(s => {
        const e = s?.track?.surfaceEnvelope;
        return e && finiteNumber(e.bikeContactScreenY) && finiteNumber(e.terrainScreenY)
          ? e.bikeContactScreenY - e.terrainScreenY
          : null;
      }).filter(finiteNumber);
      const offsetRange = surfaceOffsets.length ? Math.max(...surfaceOffsets) - Math.min(...surfaceOffsets) : 0;
      const tolerances = valid.map(s => s?.track?.surfaceEnvelope?.tolerance).filter(finiteNumber);
      const maxTolerance = tolerances.length ? Math.max(...tolerances) : 0;

      const contactChanged = groundedValues.size > 1 || offsetRange > Math.max(maxTolerance, 1);
      const challengeSeen = airborneSeen || crashedSeen || crashDelta > 0 || respawnDelta > 0 || contactChanged;
      const angleThreshold = 0.05;
      const verticalThreshold = 12;
      const coupledSignals = [
        progressDelta > 0,
        velocityRange > 20,
        angleRange > angleThreshold,
        verticalRange > verticalThreshold,
        challengeSeen
      ];
      const signalCount = coupledSignals.filter(Boolean).length;

      if (!(progressDelta > 0)) {
        return FAIL(`sustained throttle did not move forward: progressDelta=${progressDelta}`);
      }
      if (!(velocityRange > 20)) {
        return FAIL(`sustained throttle lacked velocity variation: velocityRange=${velocityRange}, progressDelta=${progressDelta}`);
      }
      if (!(angleRange > angleThreshold)) {
        return FAIL(`sustained throttle lacked bike posture variation: angleRange=${angleRange}, progressDelta=${progressDelta}`);
      }
      if (!(verticalRange > verticalThreshold)) {
        return FAIL(`sustained throttle lacked vertical terrain response: verticalRange=${verticalRange}, threshold=${verticalThreshold}, maxTolerance=${maxTolerance}`);
      }
      if (!challengeSeen) {
        return FAIL(`sustained throttle stayed grounded without terrain contact challenge: progressDelta=${progressDelta}, angleRange=${angleRange}, offsetRange=${offsetRange}`);
      }
      if (afterRelease?.input?.accelerating === true) {
        return FAIL('ArrowUp release left accelerating=true after sustained throttle');
      }
      return PASS(`signals=${signalCount}/5, progressDelta=${progressDelta}, velocityRange=${velocityRange}, angleRange=${angleRange}, verticalRange=${verticalRange}, airborne=${airborneSeen}, crashed=${crashedSeen}, offsetRange=${offsetRange}`);
    }
  },
  {
    id: 'p1-crash-respawn-loop',
    level: 'P1',
    name: 'Core mechanic crash feedback and respawn loop',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const setup = await game.loadScenario('near-crash', { trackIndex: 0 }, 0);
      if (setup?.missing) return FAIL('missing legal near-crash scenario contract');
      const before = setup?.snapshot || setup || await game.snapshot();
      await game.realKeyHold('ArrowUp', 500);
      await game.contractInput({ type: 'step', durationMs: 800 });
      const crashed = await game.snapshot();
      const crashDelta = (crashed?.race?.crashCount || 0) - (before?.race?.crashCount || 0);
      if (!(crashDelta > 0 || crashed?.bike?.crashed || crashed?.feedback?.crashVisible)) {
        return FAIL('near-crash input did not produce crash feedback');
      }
      await game.contractInput({ type: 'step', durationMs: 1800 });
      const after = await game.snapshot();
      if (after?.bike?.grounded === true && after?.bike?.crashed !== true) {
        const surfaceAfter = surfaceEnvelopeError(after, 'respawned terrain contact');
        if (surfaceAfter) return FAIL(surfaceAfter);
      }
      if (after?.bike?.activeBoosts > 0) {
        return FAIL('activeBoosts not cleared after crash/respawn');
      }
      if (after?.bike?.crashed === true && !after?.feedback?.crashVisible) {
        return FAIL('bike remains crashed without visible feedback');
      }
      return PASS(`crashDelta=${crashDelta}, respawnCount=${after?.race?.respawnCount}`);
    }
  },
  {
    id: 'p1-finish-freezes-result',
    level: 'P1',
    name: 'Core mechanic finish result freezes final time',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const setup = await game.loadScenario('near-finish', { trackIndex: 0 }, 0);
      if (setup?.missing) return FAIL('missing legal near-finish scenario contract');
      const before = await game.snapshot();
      if (before?.race?.finished || before?.race?.resultVisible) return FAIL('near-finish scenario already finished');
      await game.realKeyHold('ArrowUp', 1000);
      await game.contractInput({ type: 'step', durationMs: 500 });
      const finished = await game.snapshot();
      if (!(finished?.race?.finished || finished?.race?.resultVisible || phaseOf(finished) === 'finished')) {
        return FAIL('finish line crossing did not produce result state');
      }
      const finalBefore = finished?.time?.finalMs;
      await game.realKeyHold('ArrowUp', 700);
      const after = await game.snapshot();
      const finalAfter = after?.time?.finalMs;
      if (finiteNumber(finalBefore) && finiteNumber(finalAfter) && finalBefore !== finalAfter) {
        return FAIL(`final time changed after terminal throttle: ${finalBefore} -> ${finalAfter}`);
      }
      return PASS(`finalMs=${finalBefore}, resultVisible=${finished?.race?.resultVisible}`);
    }
  },
  {
    id: 'p1-restart-cleans-result',
    level: 'P1',
    name: 'State machine restart cleans result and race state',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const setup = await game.loadScenario('near-finish', { trackIndex: 0 });
      if (setup?.missing) return FAIL('missing near-finish scenario for restart path');
      await game.realKeyHold('ArrowUp', 1000);
      await game.contractInput({ type: 'step', durationMs: 400 });
      const finished = await game.snapshot();
      if (!(finished?.race?.finished || finished?.race?.resultVisible)) return FAIL('could not reach result before restart');
      let restartButton = await game.findClickableButton('restart|again|retry|reset', 'track');
      if (!restartButton) restartButton = await game.findClickableButton('start', 'track|clear');
      if (restartButton) {
        await ctx.browser.mouseClick(restartButton.x + restartButton.width / 2, restartButton.y + restartButton.height / 2);
      } else {
        await game.contractInput({ type: 'restart' });
      }
      const immediatelyAfter = await game.snapshot();
      if (!immediatelyAfter) return FAIL('no snapshot after restart');
      if (immediatelyAfter?.race?.resultVisible || phaseOf(immediatelyAfter) === 'finished') {
        return FAIL('restart left result state visible/active');
      }
      if (immediatelyAfter?.race?.finished === true) {
        return FAIL('restart left race finished');
      }
      if (immediatelyAfter?.time?.finalMs !== null && immediatelyAfter?.time?.finalMs !== undefined) {
        return FAIL('restart left a stale final time');
      }
      if (finiteNumber(finished?.track?.index) && finiteNumber(immediatelyAfter?.track?.index) &&
          finished.track.index !== immediatelyAfter.track.index) {
        return FAIL('restart changed the current track');
      }
      if (finiteNumber(immediatelyAfter?.track?.progress) && immediatelyAfter.track.progress > 0.05) {
        return FAIL(`restart did not return to the starting line: progress=${immediatelyAfter.track.progress}`);
      }
      if (!['ready', 'playing'].includes(phaseOf(immediatelyAfter)) ||
          immediatelyAfter.overlayBlocking === true || immediatelyAfter.canInteractWithPlayfield === false) {
        return FAIL(`restart did not leave a playable state: phase=${phaseOf(immediatelyAfter)}`);
      }
      if (finiteNumber(immediatelyAfter?.time?.elapsedMs) && immediatelyAfter.time.elapsedMs > 250) {
        return FAIL(`restart did not clear elapsed time at action: ${immediatelyAfter.time.elapsedMs}`);
      }
      await sleep(600);
      const after = await game.snapshot();
      if (!after) return FAIL('no snapshot after restart settle');
      if (after?.race?.resultVisible || phaseOf(after) === 'finished' || after?.race?.finished === true) {
        return FAIL('restart returned to a result/finished state');
      }
      if (after?.time?.finalMs !== null && after?.time?.finalMs !== undefined) {
        return FAIL('restart settle left a stale final time');
      }
      return PASS(`phase=${phaseOf(after)}, elapsed=${after?.time?.elapsedMs}, immediatePhase=${phaseOf(immediatelyAfter)}`);
    }
  },
  {
    id: 'p2-track-switch-changes-terrain',
    level: 'P2',
    name: 'Progression track selection changes terrain context',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.loadScenario('ready-track', { trackIndex: 0 });
      const before = await game.snapshot();
      const count = before?.track?.count;
      if (!finiteNumber(count) || count < 3) return FAIL(`track.count must be >= 3, got ${count}`);
      const r = await game.contractInput({ type: 'selectTrack', index: 1 });
      if (r?.missing) return FAIL('missing selectTrack public contract');
      const after = await game.snapshot();
      if (after?.overlayBlocking === true) return FAIL('track selection left blocking overlay');
      if (after?.track?.index === before?.track?.index && trackSig(after) === trackSig(before)) {
        return FAIL('selecting another track did not change index or terrain signature');
      }
      return PASS(`track ${before?.track?.index} -> ${after?.track?.index}`);
    }
  },
  {
    id: 'p2-records-and-ghosts-contract',
    level: 'P2',
    name: 'Progression records and ghost replay contract',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const setup = await game.loadScenario('with-records', { trackIndex: 0, count: 3 });
      if (setup?.missing) return FAIL('missing with-records scenario contract');
      const snap = await game.snapshot();
      const bestTimes = snap?.records?.bestTimesMs || [];
      if (!Array.isArray(bestTimes) || bestTimes.length < 1 || bestTimes.length > 3) {
        return FAIL(`bestTimesMs must contain 1..3 records, got ${bestTimes.length}`);
      }
      for (let i = 1; i < bestTimes.length; i++) {
        if (bestTimes[i] < bestTimes[i - 1]) return FAIL('bestTimesMs not sorted fastest first');
      }
      if ((snap?.feedback?.ghostCount || 0) < bestTimes.length) {
        return FAIL(`ghostCount ${snap?.feedback?.ghostCount} lower than records ${bestTimes.length}`);
      }
      return PASS(`records=${bestTimes.length}, ghosts=${snap?.feedback?.ghostCount}`);
    }
  },
  {
    id: 'p2-clear-records-removes-ghosts',
    level: 'P2',
    name: 'Progression clear records removes personal bests and ghosts',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const setup = await game.loadScenario('with-records', { trackIndex: 0, count: 2 });
      if (setup?.missing) return FAIL('missing with-records scenario contract');
      const before = await game.snapshot();
      const beforeRecords = before?.records?.bestTimesMs || [];
      if (!Array.isArray(beforeRecords) || beforeRecords.length < 1) {
        return FAIL('with-records scenario did not create records before clear');
      }
      const result = await game.contractInput({ type: 'clearRecords' });
      if (result?.missing) return FAIL('missing clearRecords public contract');
      const after = await game.snapshot();
      const afterRecords = after?.records?.bestTimesMs || [];
      const count = after?.records?.personalBestCount;
      if (Array.isArray(afterRecords) && afterRecords.length !== 0) {
        return FAIL(`records still present after clear: ${afterRecords.length}`);
      }
      if (finiteNumber(count) && count !== 0) {
        return FAIL(`personalBestCount not cleared: ${count}`);
      }
      if ((after?.feedback?.ghostCount || 0) !== 0) {
        return FAIL(`ghosts still present after clear: ${after?.feedback?.ghostCount}`);
      }
      if (after?.overlayBlocking === true || after?.canInteractWithPlayfield === false) {
        const startEntry = await game.findClickableButton('start|play|race|again|retry|restart', 'clear|track');
        if (!startEntry) {
          return FAIL('clearRecords left no usable racing entry point');
        }
      }
      return PASS(`records ${beforeRecords.length} -> 0, ghosts cleared`);
    }
  },
  {
    id: 'p2-flip-boost-reward',
    level: 'P2',
    name: 'Feedback flip boost reward follows legal airborne chain',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const setup = await game.loadScenario('airborne', { inverted: false });
      if (setup?.missing) return FAIL('missing airborne scenario contract');
      const before = await game.snapshot();
      if ((before?.bike?.activeBoosts || 0) > 0 || before?.feedback?.boostVisible) {
        return FAIL('airborne scenario already has boost result');
      }
      const samples = [];
      if (before?.bike?.airborne !== true) {
        return FAIL('airborne scenario did not expose an airborne bike');
      }
      const clearlyInverted = sample => {
        const angle = sample?.bike?.angle;
        return sample?.bike?.airborne === true && finiteNumber(angle) && Math.cos(angle) < -0.4;
      };
      let invertedSeen = false;
      const stepMs = 25;
      const maxInversionSamples = 100;
      const maxLandingSamples = 100;
      const baseCrashCount = finiteNumber(before?.race?.crashCount) ? before.race.crashCount : 0;
      const baseRespawnCount = finiteNumber(before?.race?.respawnCount) ? before.race.respawnCount : 0;
      let previous = before;
      let crashSeen = false;
      let rewardBeforeLanding = false;
      const crashOrRespawnSeen = sample =>
        sample?.phase === 'crashed' ||
        sample?.bike?.crashed === true ||
        (finiteNumber(sample?.race?.crashCount) && sample.race.crashCount > baseCrashCount) ||
        (finiteNumber(sample?.race?.respawnCount) && sample.race.respawnCount > baseRespawnCount);
      await game.contractInput({ type: 'throttle', pressed: true });
      for (let i = 0; i < maxInversionSamples && !invertedSeen; i++) {
        await game.contractInput({ type: 'step', durationMs: stepMs });
        const sample = await game.snapshot();
        samples.push(sample);
        invertedSeen = clearlyInverted(sample);
        crashSeen = crashSeen || crashOrRespawnSeen(sample);
        previous = sample;
        if (crashSeen || sample?.bike?.grounded === true) break;
      }
      await game.contractInput({ type: 'throttle', pressed: false });
      if (!invertedSeen) {
        return FAIL('airborne chain did not expose a clearly inverted airborne state');
      }
      let rewardSample = null;
      for (let i = 0; i < maxLandingSamples && !rewardSample; i++) {
        await game.contractInput({ type: 'step', durationMs: stepMs });
        const sample = await game.snapshot();
        samples.push(sample);
        const landed = sample?.bike?.grounded === true &&
          sample?.bike?.crashed !== true && sample?.phase !== 'crashed' &&
          previous?.bike?.airborne === true;
        crashSeen = crashSeen || crashOrRespawnSeen(sample);
        const reward = (sample?.bike?.activeBoosts || 0) > (before?.bike?.activeBoosts || 0) || sample?.feedback?.boostVisible === true;
        if (reward && !landed) rewardBeforeLanding = true;
        if (reward && landed && invertedSeen && !crashSeen && !rewardBeforeLanding) {
          rewardSample = sample;
        }
        previous = sample;
        if (crashSeen || sample?.bike?.grounded === true) break;
      }
      const boostDelta = Math.max(0, ...samples.map(s => (s?.bike?.activeBoosts || 0) - (before?.bike?.activeBoosts || 0)));
      if (!rewardSample) {
        const trace = samples.map((sample, index) => ({
          i: index + 1,
          phase: phaseOf(sample),
          airborne: sample?.bike?.airborne === true,
          grounded: sample?.bike?.grounded === true,
          angle: finiteNumber(sample?.bike?.angle) ? Number(sample.bike.angle.toFixed(3)) : null,
          activeBoosts: sample?.bike?.activeBoosts || 0,
          boostVisible: sample?.feedback?.boostVisible === true,
          crashCount: sample?.race?.crashCount,
          respawnCount: sample?.race?.respawnCount
        }));
        return FAIL(`legal flip chain did not produce safe boost feedback: boostDelta=${boostDelta}, invertedSeen=${invertedSeen}, crashSeen=${crashSeen}, rewardBeforeLanding=${rewardBeforeLanding}, trace=${JSON.stringify(trace)}`);
      }
      return PASS(`boostDelta=${boostDelta}, groundedReward=true`);
    }
  },
  {
    id: 'p2-real-touch-throttle-equivalence',
    level: 'P2',
    name: 'Input semantics real touch throttle advances and releases',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.loadScenario('rolling', { trackIndex: 0 });
      await game.ensurePlaying();
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      const touch = await game.realTouchThrottle(900);
      if (!touch.ok) return FAIL(`could not perform real touch throttle: ${touch.reason}`);
      const after = await game.snapshot();
      const hashAfter = await game.canvasHash();
      const beforeProgress = progressOf(before);
      const afterProgress = progressOf(after);
      const progressDelta = finiteNumber(beforeProgress) && finiteNumber(afterProgress) ? afterProgress - beforeProgress : 0;
      const positionDelta = finiteNumber(before?.bike?.worldX) && finiteNumber(after?.bike?.worldX) ? after.bike.worldX - before.bike.worldX : progressDelta;
      const velocityDelta = velocityOf(after) - velocityOf(before);
      const elapsedDelta = finiteNumber(before?.time?.elapsedMs) && finiteNumber(after?.time?.elapsedMs) ? after.time.elapsedMs - before.time.elapsedMs : 0;
      const sceneChanged = hashBefore !== hashAfter || (after?.feedback?.visibleSceneRevision || 0) > (before?.feedback?.visibleSceneRevision || 0);
      if (!(progressDelta > 0 || positionDelta > 0 || velocityDelta > 0.01 || elapsedDelta > 0)) {
        return FAIL(`touch throttle produced no movement/time/scene evidence: progressDelta=${progressDelta}, velocityDelta=${velocityDelta}, elapsedDelta=${elapsedDelta}`);
      }
      if (!sceneChanged && positionDelta <= 0 && velocityDelta <= 0.01) return FAIL('touch throttle lacked visible scene or bike position evidence');
      if (after?.input?.accelerating === true) {
        return FAIL('touch release left accelerating=true');
      }
      return PASS(`progressDelta=${progressDelta}, velocityDelta=${velocityDelta}, elapsedDelta=${elapsedDelta}, sceneChanged=${sceneChanged}`);
    }
  },
  {
    id: 'p2-invalid-action-rejected-conserves-state',
    level: 'P2',
    name: 'Invariants and rejection invalid actions preserve totals',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.loadScenario('ready-track', { trackIndex: 0 });
      const before = await game.snapshot();
      const totalBefore = (before?.records?.bestTimesMs || []).length + (before?.bike?.activeBoosts || 0) + (before?.race?.crashCount || 0);
      const essentialBefore = essentialState(before);
      const invalid = await game.contractInput({ type: 'selectTrack', index: 999 });
      const unknown = await game.contractInput({ type: 'not-a-real-action', durationMs: -500 });
      const after = await game.snapshot();
      const totalAfter = (after?.records?.bestTimesMs || []).length + (after?.bike?.activeBoosts || 0) + (after?.race?.crashCount || 0);
      const rejected = invalid?.lastAction?.ok === false || invalid?.ok === false || unknown?.lastAction?.ok === false || unknown?.ok === false;
      const unchanged = totalBefore === totalAfter && shallowEqual(essentialBefore, essentialState(after));
      if (!rejected) return FAIL('invalid actions were not rejected with ok:false or lastAction.ok:false');
      if (!unchanged) return FAIL(`invalid action mutated state: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      return PASS(`rejected=true, totalBefore=${totalBefore}, totalAfter=${totalAfter}, unchanged=${unchanged}`);
    }
  },
  {
    id: 'p2-terminal-throttle-unchanged',
    level: 'P2',
    name: 'State machine terminal throttle cannot mutate final time',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const setup = await game.loadScenario('near-finish', { trackIndex: 0 });
      if (setup?.missing) return FAIL('missing near-finish scenario contract');
      await game.realKeyHold('ArrowUp', 1000);
      await game.contractInput({ type: 'step', durationMs: 500 });
      const finished = await game.snapshot();
      if (!(finished?.race?.finished || phaseOf(finished) === 'finished')) return FAIL('not in finished state');
      const finalBefore = finished?.time?.finalMs;
      await game.realMouseThrottle(800);
      const after = await game.snapshot();
      const finalAfter = after?.time?.finalMs;
      const unchanged = !finiteNumber(finalBefore) || !finiteNumber(finalAfter) || finalBefore === finalAfter;
      if (!unchanged) return FAIL(`final time changed after terminal input: ${finalBefore} -> ${finalAfter}`);
      return PASS(`finalBefore=${finalBefore}, finalAfter=${finalAfter}, unchanged=${unchanged}`);
    }
  }
];

module.exports = {
  sleep,
  createGameDriver,
  suite: checks
};
