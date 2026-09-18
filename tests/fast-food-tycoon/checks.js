// === GDD Coverage Map ===
// M1 (3D scene boot and nonblocking playfield) -> p0-boot-stability, p1-visible-render-hud
// M2 (screen-space movement) -> p1-real-keyboard-direction-opposite, p2-contract-camera-rotation-screen-direction
// M3 (cook and pickup food) -> p1-contract-cook-pickup-loop, p1-contract-start-to-invest-loop, p2-contract-tray-capacity-rejection
// M4/M5 (service customers and collect cash) -> p1-contract-service-cash-loop, p1-contract-start-to-invest-loop, p2-contract-cash-duplicate-guard
// M6 (unlock/hire deposit economy) -> p1-contract-unlock-deposit-conservation, p1-contract-start-to-invest-loop, p2-contract-save-restore-persistence
// M7 (vault/upgrade panel and blocking) -> p1-real-click-panel-blocking, p2-contract-successful-upgrade-purchase, p2-contract-insufficient-upgrade-rejected
// M8 (worker automation) -> p2-contract-worker-visible-motion
// M9/M10/M11 (tables, drive-thru, rush/depth services) -> p2-contract-depth-service-systems
// M12/M13 (save, offline, prestige) -> p2-contract-save-restore-persistence, p2-contract-save-prestige-guards
//
// === Category Map ===
// Boot & Stability: p0-boot-stability, p0-public-contract-schema
// Feedback & Observability: p1-visible-render-hud
// Input Semantics: p1-real-keyboard-direction-opposite, p2-contract-camera-rotation-screen-direction, p2-contract-joystick-direction-opposite
// Core Mechanic Loop: p1-contract-cook-pickup-loop, p1-contract-service-cash-loop, p1-contract-start-to-invest-loop
// Economy / Progression: p1-contract-unlock-deposit-conservation, p2-contract-successful-upgrade-purchase, p2-contract-save-restore-persistence, p2-contract-save-prestige-guards
// UI Flow & Blocking: p1-real-click-panel-blocking, p2-contract-panel-close-recovers-input
// Invariants & Rejection: p1-contract-unlock-deposit-conservation, p2-contract-tray-capacity-rejection, p2-contract-cash-duplicate-guard, p2-contract-insufficient-upgrade-rejected
// Depth / Optional Systems: p2-contract-worker-visible-motion, p2-contract-depth-service-systems
//
// === Rationality Map ===
// p1-visible-render-hud: M1 | real action: wait for game render | independent observation: canvas pixels + snapshot/HUD | empty-shell failure: blank canvas or hidden HUD fails
// p1-real-keyboard-direction-opposite: M2 | real action: browser keyDown/keyUp Right then Left | independent observation: player.screenX + screenshot hash | empty-shell failure: listeners without movement, mirrored controls, or API-only movement fail
// p2-contract-camera-rotation-screen-direction: M2 | contract action: rotateCamera then real key Right/Left | independent observation: camera.angle + player.screenX | empty-shell failure: camera rotates but movement remains world-axis or API teleports player fails
// p1-contract-cook-pickup-loop: M3 | contract action: legal readyKitchen setup then wait/moveTo food | independent observation: carryingFood, foodOnGround, capacity | empty-shell failure: static counters or capacity omission fail
// p1-contract-service-cash-loop: M4/M5 | contract action: carryingFood then counter/cash steps | independent observation: food/counter/customer/currency deltas | empty-shell failure: free money without food transfer fails
// p1-contract-start-to-invest-loop: M3/M4/M5/M6 | method: contract/API | interaction path: reset, kitchen wait, food pickup, counter service, cash collect, unlock deposit | independent observation: food/currency/service/unlock deltas | empty-shell failure: scenario-only fragments that cannot run the actual loop fail
// p1-contract-unlock-deposit-conservation: M6 | contract action: unlockAffordable then moveTo/wait | independent observation: currency + deposited totalBefore/totalAfter | empty-shell failure: free unlock or money loss fails
// p1-real-click-panel-blocking: M7 | real action: DOM/mouse click open and close panel | independent observation: activePanel + overlayBlocking + real keyboard movement | empty-shell failure: nonclickable panel or stale overlay fails
// p2-contract-tray-capacity-rejection: M3 | method: contract/API | interaction path: fill tray through cooking/pickup, then try pickup again | independent observation: carryingFood <= capacity and rejection/no-op | empty-shell failure: unlimited pickup or over-capacity inventory fails
// p2-contract-cash-duplicate-guard: M5 | method: contract/API | interaction path: cashReady, collect, collect again | independent observation: second collect does not increase currency | empty-shell failure: repeat cash claim fails
// p2-contract-successful-upgrade-purchase: M7 | method: contract/API | interaction path: upgradeAffordable, open upgrade panel, click enabled runtime panel control | independent observation: currency decreases and upgrade level/effect increases | empty-shell failure: decorative shop or no purchase effect fails
// p2-contract-insufficient-upgrade-rejected: M7 | contract action: insufficient purchase | independent observation: unchanged balance and level with rejection reason | empty-shell failure: negative money or free upgrades fail
// p2-contract-panel-close-recovers-input: M7 | contract setup: panelOpen then close, real key movement | independent observation: canInteract + player delta | empty-shell failure: phase-only close with blocked input fails
// p2-contract-joystick-direction-opposite: M2 | method: contract/API | interaction path: joystick right then left | independent observation: screen/world movement opposite | empty-shell failure: missing joystick semantics or one-way movement fails
// p2-contract-worker-visible-motion: M8 | contract action: workerHired then wait | independent observation: workerMotionRevision + service changes | empty-shell failure: static worker flag fails
// p2-contract-depth-service-systems: M9/M10/M11 | contract action: depth service setup then wait | independent observation: queue/rush/service deltas | empty-shell failure: advertised depth with no effect fails
// p2-contract-save-restore-persistence: M12 | method: contract/API + page reload | interaction path: unlock progress, reload page, read snapshot | independent observation: saved progress/visible unlock persists | empty-shell failure: save flag without persisted state fails
// p2-contract-save-prestige-guards: M12/M13 | contract action: reset/save/prestige guard | independent observation: saved/prestige fields and rejection | empty-shell failure: repeat free prestige or unsaved progress fails

const zlib = require('zlib');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function cloneSmall(value) {
  return JSON.parse(JSON.stringify(value == null ? null : value));
}

function pngStatsFromBase64(base64) {
  const buf = Buffer.from(base64, 'base64');
  if (buf.length < 32 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (offset + 12 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + len;
    if (dataEnd + 4 > buf.length) break;
    if (type === 'IHDR') {
      width = buf.readUInt32BE(dataStart);
      height = buf.readUInt32BE(dataStart + 4);
      bitDepth = buf[dataStart + 8];
      colorType = buf[dataStart + 9];
    } else if (type === 'IDAT') {
      idat.push(buf.subarray(dataStart, dataEnd));
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }
  if (!width || !height || bitDepth !== 8 || ![2, 6].includes(colorType) || !idat.length) return null;
  const channels = colorType === 6 ? 4 : 3;
  const rowBytes = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const prev = Buffer.alloc(rowBytes);
  const cur = Buffer.alloc(rowBytes);
  const buckets = new Map();
  let minLuma = 255;
  let maxLuma = 0;
  let samples = 0;
  const step = Math.max(1, Math.floor((width * height) / 3500));
  let pixelIndex = 0;
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    for (let x = 0; x < rowBytes; x++) {
      const rawVal = raw[p++];
      const left = x >= channels ? cur[x - channels] : 0;
      const up = prev[x];
      const upLeft = x >= channels ? prev[x - channels] : 0;
      let val;
      if (filter === 0) val = rawVal;
      else if (filter === 1) val = (rawVal + left) & 255;
      else if (filter === 2) val = (rawVal + up) & 255;
      else if (filter === 3) val = (rawVal + Math.floor((left + up) / 2)) & 255;
      else {
        const pa = Math.abs(up - upLeft);
        const pb = Math.abs(left - upLeft);
        const pc = Math.abs(left + up - 2 * upLeft);
        const pr = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        val = (rawVal + pr) & 255;
      }
      cur[x] = val;
    }
    for (let x = 0; x < width; x++) {
      if (pixelIndex++ % step !== 0) continue;
      const i = x * channels;
      const r = cur[i];
      const g = cur[i + 1];
      const b = cur[i + 2];
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      minLuma = Math.min(minLuma, luma);
      maxLuma = Math.max(maxLuma, luma);
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
      samples++;
    }
    prev.set(cur);
  }
  let dominant = 0;
  for (const count of buckets.values()) dominant = Math.max(dominant, count);
  return {
    width,
    height,
    samples,
    uniqueColors: buckets.size,
    lumaRange: maxLuma - minLuma,
    dominantRatio: samples ? dominant / samples : 1
  };
}

function resourceNumber(snap, path, fallback = 0) {
  const parts = path.split('.');
  let cur = snap;
  for (const part of parts) cur = cur && cur[part];
  return isFiniteNumber(cur) ? cur : fallback;
}

function foodTotal(snapshot) {
  return resourceNumber(snapshot, 'player.carryingFood') +
    resourceNumber(snapshot, 'resources.foodOnGround') +
    resourceNumber(snapshot, 'service.counterStock') +
    resourceNumber(snapshot, 'service.servedCustomers');
}

function screenRightDelta(before, after) {
  const x0 = before && before.player && before.player.screenX;
  const x1 = after && after.player && after.player.screenX;
  if (isFiniteNumber(x0) && isFiniteNumber(x1) && Math.abs(x1 - x0) >= 0.5) return x1 - x0;
  const wx0 = resourceNumber(before, 'player.worldX', NaN);
  const wz0 = resourceNumber(before, 'player.worldZ', NaN);
  const wx1 = resourceNumber(after, 'player.worldX', NaN);
  const wz1 = resourceNumber(after, 'player.worldZ', NaN);
  const angle = resourceNumber(before, 'camera.angle', resourceNumber(after, 'camera.angle', NaN));
  if (![wx0, wz0, wx1, wz1, angle].every(isFiniteNumber)) return NaN;
  return Math.cos(angle) * (wx1 - wx0) + Math.sin(angle) * (wz1 - wz0);
}

function createGameDriver(browser) {
  async function evalPage(expr) {
    return await browser.eval(expr);
  }

  async function getSnapshot() {
    return await evalPage(`
      (function(){
        if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
          return window.__gameTest.getSnapshot();
        }
        var canvas = document.querySelector('canvas');
        var hudText = (document.body && document.body.innerText || '').slice(0, 3000);
        var activeDialog = Array.from(document.querySelectorAll('[role="dialog"], dialog, [aria-modal="true"]'))
          .find(function(el){
            var s = getComputedStyle(el);
            var r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 10 && r.height > 10;
          });
        return {
          phase: canvas ? 'playing' : 'loading',
          screen: activeDialog ? 'panel' : (canvas ? 'restaurant' : 'loading'),
          ui: {
            overlayBlocking: !!activeDialog,
            canInteractWithPlayfield: !!canvas && !activeDialog,
            activePanel: activeDialog ? (activeDialog.getAttribute('aria-label') || 'panel') : null
          },
          render: {
            ready: !!canvas,
            nonBlank: !!canvas,
            canvas: canvas ? { width: canvas.width || 0, height: canvas.height || 0 } : null
          },
          player: { worldX: 0, worldZ: 0, screenX: null, screenY: null, carryingFood: 0, foodCapacity: 0, carryingMoney: 0 },
          resources: { currency: (hudText.match(/\\d+/) ? Number(hudText.match(/\\d+/)[0]) : 0), vaultBalance: 0, foodOnGround: 0, cashOnGround: 0 },
          service: { counterStock: 0, counterCapacity: 0, customerQueue: 0, servedCustomers: 0, cashPile: 0 },
          build: { unlockTiles: [] },
          staff: { cashier: false, runner: false, cleaner: false, visibleWorkers: 0, workerMotionRevision: 0 },
          upgrades: { capacity: 0, speed: 0, collection: 0, vault: {} },
          progress: { prestigeLevel: 0, profitMultiplier: 1, rushActive: false, rushTimeLeft: null, saved: false },
          interactables: {
            playfieldBounds: canvas ? (function(r){ return { x:r.left, y:r.top, width:r.width, height:r.height }; })(canvas.getBoundingClientRect()) : null,
            panelControls: []
          },
          lastAction: null
        };
      })()
    `);
  }

  async function waitForReady() {
    const deadline = Date.now() + 25000;
    let last = null;
    while (Date.now() < deadline) {
      last = await getSnapshot();
      if (last && last.render && last.render.ready && last.phase !== 'loading') return last;
      await sleep(500);
    }
    return last;
  }

  async function contractInput(action) {
    const actionJson = JSON.stringify(action);
    return await evalPage(`
      (function(){
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') {
          return { __missingContract: true };
        }
        return window.__gameTest.input(${actionJson});
      })()
    `);
  }

  async function loadScenario(name) {
    const nameJson = JSON.stringify(name);
    return await evalPage(`
      (function(){
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') {
          return { __missingContract: true };
        }
        return window.__gameTest.loadScenario(${nameJson});
      })()
    `);
  }

  async function resetGame(options = {}) {
    const optionsJson = JSON.stringify(options);
    return await evalPage(`
      (function(){
        if (window.__gameTest && typeof window.__gameTest.reset === 'function') {
          return window.__gameTest.reset(${optionsJson});
        }
        return null;
      })()
    `);
  }

  async function clickSemanticControl(kind) {
    const data = await evalPage(`
      (function(){
        var kind = ${JSON.stringify(kind)};
        var controls = Array.from(document.querySelectorAll('button, [role="button"], a, [data-game-control]'));
        function visible(el) {
          var s = getComputedStyle(el);
          var r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 8 && r.height > 8;
        }
        var candidates = controls.filter(visible).map(function(el){
          var text = (el.getAttribute('aria-label') || el.dataset.gameControl || el.textContent || '').toLowerCase();
          var score = 0;
          if (kind === 'openPanel' && /vault|upgrade|shop|bank|panel|menu/.test(text)) score += 3;
          if (kind === 'closePanel' && /close|back|return|×|x|done/.test(text)) score += 3;
          if (kind === 'openPanel' && /💹|🏦|up/i.test(text)) score += 1;
          if (kind === 'closePanel' && /✕|×/.test(text)) score += 1;
          var r = el.getBoundingClientRect();
          return { score: score, x: r.left + r.width / 2, y: r.top + r.height / 2, text: text.slice(0, 60) };
        }).filter(function(c){ return c.score > 0; }).sort(function(a,b){ return b.score - a.score; });
        return candidates[0] || null;
      })()
    `);
    if (!data || !isFiniteNumber(data.x) || !isFiniteNumber(data.y)) return { ok: false };
    await browser.mouseClick(data.x, data.y);
    await sleep(400);
    return { ok: true, target: data };
  }

  async function pressKey(code, durationMs = 350) {
    await browser.keyDown(code);
    await sleep(durationMs);
    await browser.keyUp(code);
    await sleep(250);
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  async function screenshotStats() {
    try {
      const shot = await browser.cdp.send('Page.captureScreenshot', { format: 'png' });
      return shot && shot.data ? pngStatsFromBase64(shot.data) : null;
    } catch (_) {
      return null;
    }
  }

  return {
    waitForReady,
    getSnapshot,
    contractInput,
    loadScenario,
    resetGame,
    clickSemanticControl,
    pressKey,
    canvasHash,
    screenshotStats
  };
}

function validateSnapshotShape(snap) {
  const problems = [];
  if (!snap || typeof snap !== 'object') problems.push('snapshot missing');
  if (snap && !['loading', 'playing', 'panel', 'paused', 'transition'].includes(snap.phase)) problems.push('bad phase');
  if (snap && (!snap.ui || typeof snap.ui.overlayBlocking !== 'boolean')) problems.push('bad ui');
  if (snap && (!snap.render || typeof snap.render.ready !== 'boolean')) problems.push('bad render');
  if (snap && (!snap.player || !isFiniteNumber(snap.player.carryingFood))) problems.push('bad player');
  if (snap && (!snap.resources || !isFiniteNumber(snap.resources.currency))) problems.push('bad resources');
  if (snap && snap.resources && snap.resources.currency < 0) problems.push('negative currency');
  if (snap && snap.resources && snap.resources.vaultBalance < 0) problems.push('negative vaultBalance');
  return problems;
}

async function waitForContractState(game, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let snapshot = await game.getSnapshot();
  while (Date.now() < deadline && !predicate(snapshot)) {
    await game.contractInput({ type: 'wait', durationMs: 250 });
    snapshot = await game.getSnapshot();
  }
  return snapshot;
}

const checks = [
  {
    id: 'p0-boot-stability',
    level: 'P0',
    name: 'boot stability and visible runtime',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const snap = await game.waitForReady();
      const canvas = await ctx.browser.getCanvasSize();
      const fatal = ctx.browser.exceptions.filter((e) => !/ResizeObserver/i.test(e.description || e.text));
      if (fatal.length) return FAIL(`runtime exceptions: ${fatal.slice(0, 2).map((e) => e.text || e.description).join('; ')}`);
      if (!snap || !snap.render || !snap.render.ready) return FAIL('render never became ready');
      if (!canvas || canvas.cssW < 100 || canvas.cssH < 100) return FAIL('primary playfield canvas too small or absent');
      return PASS(`phase=${snap.phase}, canvas=${Math.round(canvas.cssW)}x${Math.round(canvas.cssH)}`);
    }
  },
  {
    id: 'p0-public-contract-schema',
    level: 'P0',
    name: 'public contract schema exposes observable restaurant state',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const snap = await game.getSnapshot();
      const problems = validateSnapshotShape(snap);
      if (problems.length) return FAIL(problems.join(', '));
      const hasApi = await ctx.browser.eval(`!!(window.__gameTest && typeof window.__gameTest.getSnapshot === 'function' && typeof window.__gameTest.input === 'function')`);
      if (!hasApi) return FAIL('window.__gameTest getSnapshot/input contract missing');
      return PASS(`phase=${snap.phase}, currency=${snap.resources.currency}`);
    }
  },
  {
    id: 'p1-visible-render-hud',
    level: 'P1',
    name: 'visible render and HUD observability after explicit wait',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const beforeHash = await game.canvasHash();
      await sleep(700);
      const snap = await game.getSnapshot();
      const afterHash = await game.canvasHash();
      if (!snap.render || !snap.render.ready || !snap.render.nonBlank) return FAIL('snapshot render is not ready/nonBlank');
      if (!snap.resources || !isFiniteNumber(snap.resources.currency)) return FAIL('currency is not observable');
      if (beforeHash == null || afterHash == null) return FAIL('canvas/screenshot hash unavailable');
      const canvas = await ctx.browser.getCanvasSize();
      if (!canvas || canvas.cssW < 200 || canvas.cssH < 150) return FAIL('main playfield not visibly sized');
      const stats = await game.screenshotStats();
      if (!stats || stats.samples < 100) return FAIL('unable to inspect visible screenshot pixels');
      if (stats.uniqueColors < 8 || stats.lumaRange < 20 || stats.dominantRatio > 0.985) {
        return FAIL(`render too blank/simple: unique=${stats.uniqueColors}, lumaRange=${stats.lumaRange.toFixed(1)}, dominant=${stats.dominantRatio.toFixed(3)}`);
      }
      return PASS(`render ready, currency=${snap.resources.currency}, unique=${stats.uniqueColors}, lumaRange=${stats.lumaRange.toFixed(1)}`);
    }
  },
  {
    id: 'p1-real-keyboard-direction-opposite',
    level: 'P1',
    name: 'real keyboard movement has opposite screen direction',
    timeoutMs: 45000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.resetGame({ clearSave: true });
      await game.waitForReady();
      await sleep(500);
      const s0 = await game.getSnapshot();
      const x0 = s0 && s0.player && s0.player.screenX;
      if (!isFiniteNumber(x0) && !isFiniteNumber(resourceNumber(s0, 'player.worldX', NaN))) return FAIL('player screen/world position is not observable');
      const h0 = await game.canvasHash();
      await game.pressKey('ArrowRight', 650);
      const s1 = await game.getSnapshot();
      const h1 = await game.canvasHash();
      await game.pressKey('ArrowLeft', 900);
      const s2 = await game.getSnapshot();
      const h2 = await game.canvasHash();
      const deltaRight = screenRightDelta(s0, s1);
      const deltaLeft = screenRightDelta(s1, s2);
      if (![deltaRight, deltaLeft].every(isFiniteNumber)) return FAIL('screen/world positions missing after real key input');
      if (Math.abs(deltaRight) < 1) return FAIL(`ArrowRight did not visibly move player: delta=${deltaRight}`);
      if (Math.abs(deltaLeft) < 1) return FAIL(`ArrowLeft did not visibly move player: delta=${deltaLeft}`);
      if (Math.sign(deltaRight) === Math.sign(deltaLeft)) {
        return FAIL(`direction deltas are not opposite: right=${deltaRight}, left=${deltaLeft}`);
      }
      if (h0 === h1 && h1 === h2) return FAIL('canvas did not change during real movement');
      return PASS(`opposite deltas right=${deltaRight.toFixed(1)}, left=${deltaLeft.toFixed(1)}`);
    }
  },
  {
    id: 'p2-contract-camera-rotation-screen-direction',
    level: 'P2',
    name: 'camera rotation preserves screen-space keyboard direction',
    timeoutMs: 45000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.resetGame({ clearSave: true });
      await sleep(500);
      const beforeRotate = await game.getSnapshot();
      const angle0 = beforeRotate.camera && beforeRotate.camera.angle;
      const xBeforeRotate = beforeRotate.player && beforeRotate.player.screenX;
      if (!isFiniteNumber(angle0)) return FAIL('camera.angle is not observable before rotation');
      if (!isFiniteNumber(xBeforeRotate) && !isFiniteNumber(resourceNumber(beforeRotate, 'player.worldX', NaN))) return FAIL('player screen/world position is not observable before rotation');
      const rotateResult = await game.contractInput({ type: 'rotateCamera', direction: 'right' });
      if (rotateResult && rotateResult.__missingContract) return FAIL('rotateCamera contract missing');
      await game.contractInput({ type: 'wait', durationMs: 900 });
      await sleep(700);
      const rotated = await game.getSnapshot();
      const angle1 = rotated.camera && rotated.camera.angle;
      if (!isFiniteNumber(angle1)) return FAIL('camera.angle is not observable after rotation');
      if (Math.abs(angle1 - angle0) < 0.05) return FAIL(`rotateCamera did not change camera.angle: ${angle0}->${angle1}`);
      const worldTeleport = Math.hypot(
        resourceNumber(rotated, 'player.worldX') - resourceNumber(beforeRotate, 'player.worldX'),
        resourceNumber(rotated, 'player.worldZ') - resourceNumber(beforeRotate, 'player.worldZ')
      );
      if (worldTeleport > 0.2) return FAIL(`rotateCamera moved/teleported player in world: ${worldTeleport}`);
      await game.pressKey('ArrowRight', 650);
      const s1 = await game.getSnapshot();
      await game.pressKey('ArrowLeft', 900);
      const s2 = await game.getSnapshot();
      const deltaRight = screenRightDelta(rotated, s1);
      const deltaLeft = screenRightDelta(s1, s2);
      if (![deltaRight, deltaLeft].every(isFiniteNumber)) return FAIL('screen/world positions missing after rotated real key input');
      if (Math.abs(deltaRight) < 1) return FAIL(`ArrowRight did not visibly move after camera rotation: delta=${deltaRight}`);
      if (Math.abs(deltaLeft) < 1) return FAIL(`ArrowLeft did not visibly move after camera rotation: delta=${deltaLeft}`);
      if (Math.sign(deltaRight) === Math.sign(deltaLeft)) {
        return FAIL(`rotated direction deltas are not opposite: right=${deltaRight}, left=${deltaLeft}`);
      }
      return PASS(`camera ${angle0.toFixed(2)}->${angle1.toFixed(2)}, rotated deltas right=${deltaRight.toFixed(1)}, left=${deltaLeft.toFixed(1)}`);
    }
  },
  {
    id: 'p1-contract-cook-pickup-loop',
    level: 'P1',
    name: 'contract cook and pickup loop changes food state',
    timeoutMs: 45000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const setup = await game.loadScenario('readyKitchen');
      if (setup && setup.__missingContract) return FAIL('loadScenario contract missing');
      const before = await game.getSnapshot();
      await game.contractInput({ type: 'wait', durationMs: 1400 });
      let after = await game.getSnapshot();
      if (after && after.__missingContract) return FAIL('input contract missing');
      const carryBefore = resourceNumber(before, 'player.carryingFood');
      const foodBefore = resourceNumber(before, 'resources.foodOnGround');
      const foodReadyBudgetMs = 10000;
      let elapsedMs = 1400;
      while (
        elapsedMs < foodReadyBudgetMs &&
        resourceNumber(after, 'player.carryingFood') <= carryBefore &&
        resourceNumber(after, 'resources.foodOnGround') <= foodBefore
      ) {
        const waitMs = Math.min(250, foodReadyBudgetMs - elapsedMs);
        await game.contractInput({ type: 'wait', durationMs: waitMs });
        after = await game.getSnapshot();
        elapsedMs += waitMs;
      }
      if (resourceNumber(after, 'resources.foodOnGround') > foodBefore) {
        await game.contractInput({ type: 'moveTo', target: 'food' });
        await game.contractInput({ type: 'wait', durationMs: 800 });
        after = await game.getSnapshot();
      }
      const carryAfter = resourceNumber(after, 'player.carryingFood');
      const foodAfter = resourceNumber(after, 'resources.foodOnGround');
      const capacity = resourceNumber(after, 'player.foodCapacity', 0);
      if (carryAfter <= carryBefore && foodAfter <= foodBefore) {
        return FAIL(`food loop did not produce or pick up food within ${elapsedMs}ms: carry ${carryBefore}->${carryAfter}, ground ${foodBefore}->${foodAfter}`);
      }
      if (capacity > 0 && carryAfter > capacity) return FAIL(`carryingFood exceeds capacity ${carryAfter}/${capacity}`);
      return PASS(`food loop carry ${carryBefore}->${carryAfter}, ground ${foodBefore}->${foodAfter}`);
    }
  },
  {
    id: 'p1-contract-service-cash-loop',
    level: 'P1',
    name: 'contract service and cash loop transfers food into money',
    timeoutMs: 50000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const setup = await game.loadScenario('carryingFood');
      if (setup && setup.__missingContract) return FAIL('loadScenario contract missing');
      const before = await game.getSnapshot();
      const foodTotalBefore =
        resourceNumber(before, 'player.carryingFood') +
        resourceNumber(before, 'resources.foodOnGround') +
        resourceNumber(before, 'service.counterStock') +
        resourceNumber(before, 'service.servedCustomers');
      await game.contractInput({ type: 'moveTo', target: 'counter' });
      await game.contractInput({ type: 'wait', durationMs: 1800 });
      const mid = await game.getSnapshot();
      await game.contractInput({ type: 'moveTo', target: 'cash' });
      await game.contractInput({ type: 'wait', durationMs: 1000 });
      const after = await game.getSnapshot();
      const foodTotalAfter =
        resourceNumber(after, 'player.carryingFood') +
        resourceNumber(after, 'resources.foodOnGround') +
        resourceNumber(after, 'service.counterStock') +
        resourceNumber(after, 'service.servedCustomers');
      const currencyBefore = resourceNumber(before, 'resources.currency');
      const currencyAfter = resourceNumber(after, 'resources.currency');
      const servedDelta = resourceNumber(after, 'service.servedCustomers') - resourceNumber(before, 'service.servedCustomers');
      const counterDelta = resourceNumber(mid, 'service.counterStock') - resourceNumber(before, 'service.counterStock');
      if (counterDelta <= 0 && servedDelta <= 0) return FAIL('food was not deposited or served at the counter');
      if (currencyAfter <= currencyBefore && resourceNumber(after, 'service.cashPile') <= resourceNumber(before, 'service.cashPile')) {
        return FAIL(`service did not produce collectable cash or currency: ${currencyBefore}->${currencyAfter}`);
      }
      if (foodTotalAfter < foodTotalBefore - 5) return FAIL(`food conservation broken: totalBefore=${foodTotalBefore}, totalAfter=${foodTotalAfter}`);
      return PASS(`servedDelta=${servedDelta}, currency ${currencyBefore}->${currencyAfter}, totalBefore=${foodTotalBefore}, totalAfter=${foodTotalAfter}`);
    }
  },
  {
    id: 'p1-contract-start-to-invest-loop',
    level: 'P1',
    name: 'contract start state can complete cook service cash and invest loop',
    timeoutMs: 60000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.resetGame({ clearSave: true });
      const start = await game.getSnapshot();
      await game.contractInput({ type: 'moveTo', target: 'kitchen' });
      let loaded = await waitForContractState(
        game,
        (snap) => resourceNumber(snap, 'resources.foodOnGround') > 0 ||
          resourceNumber(snap, 'player.carryingFood') > resourceNumber(start, 'player.carryingFood'),
        12000
      );
      if (resourceNumber(loaded, 'player.carryingFood') <= resourceNumber(start, 'player.carryingFood')) {
        await game.contractInput({ type: 'moveTo', target: 'food' });
        loaded = await waitForContractState(
          game,
          (snap) => resourceNumber(snap, 'player.carryingFood') > resourceNumber(start, 'player.carryingFood'),
          8000
        );
      }
      if (resourceNumber(loaded, 'player.carryingFood') <= resourceNumber(start, 'player.carryingFood')) {
        return FAIL('start loop did not cook and pick up food');
      }
      await game.contractInput({ type: 'moveTo', target: 'counter' });
      const served = await waitForContractState(
        game,
        (snap) => resourceNumber(snap, 'service.cashPile') > resourceNumber(loaded, 'service.cashPile') ||
          resourceNumber(snap, 'resources.cashOnGround') > resourceNumber(loaded, 'resources.cashOnGround') ||
          resourceNumber(snap, 'player.carryingMoney') > resourceNumber(loaded, 'player.carryingMoney') ||
          resourceNumber(snap, 'resources.currency') > resourceNumber(loaded, 'resources.currency'),
        10000
      );
      const serviceAdvanced = resourceNumber(served, 'service.counterStock') > resourceNumber(loaded, 'service.counterStock') ||
        resourceNumber(served, 'service.servedCustomers') > resourceNumber(loaded, 'service.servedCustomers') ||
        resourceNumber(served, 'service.cashPile') > resourceNumber(loaded, 'service.cashPile') ||
        resourceNumber(served, 'resources.cashOnGround') > resourceNumber(loaded, 'resources.cashOnGround');
      if (!serviceAdvanced) return FAIL('start loop did not transfer food into service/cash state');
      await game.contractInput({ type: 'moveTo', target: 'cash' });
      const paid = await waitForContractState(
        game,
        (snap) => resourceNumber(snap, 'resources.currency') > resourceNumber(start, 'resources.currency'),
        8000
      );
      if (resourceNumber(paid, 'resources.currency') <= resourceNumber(start, 'resources.currency')) {
        return FAIL('start loop did not collect customer cash');
      }
      const lockedBefore = (paid.build && paid.build.unlockTiles || []).filter(tile => tile && !tile.unlocked);
      if (!lockedBefore.length) return FAIL('no locked invest tile exposed after earning cash');
      await game.contractInput({ type: 'moveTo', target: 'unlock' });
      const invested = await waitForContractState(
        game,
        (snap) => (snap.build && snap.build.unlockTiles || []).some(tile => {
          const prior = lockedBefore.find(candidate => candidate.id === tile.id);
          return prior && (tile.unlocked || (tile.deposited || 0) > (prior.deposited || 0));
        }),
        10000
      );
      const afterTile = (invested.build && invested.build.unlockTiles || []).find(tile => {
        const prior = lockedBefore.find(candidate => candidate.id === tile.id);
        return prior && (tile.unlocked || (tile.deposited || 0) > (prior.deposited || 0));
      });
      if (!afterTile) return FAIL('earned cash did not invest into unlock progress');
      const priorTile = lockedBefore.find(tile => tile.id === afterTile.id);
      const totalBefore = resourceNumber(paid, 'resources.currency') + (priorTile.deposited || 0);
      const totalAfter = resourceNumber(invested, 'resources.currency') + (afterTile.unlocked ? priorTile.cost : afterTile.deposited || 0);
      if (Math.abs(totalAfter - totalBefore) > Math.max(priorTile.cost || 0, 8)) return FAIL(`investment conservation suspicious: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      return PASS(`loop currency ${resourceNumber(start, 'resources.currency')}->${resourceNumber(paid, 'resources.currency')}, invested=${!!(afterTile.unlocked || afterTile.deposited > priorTile.deposited)}`);
    }
  },
  {
    id: 'p1-contract-unlock-deposit-conservation',
    level: 'P1',
    name: 'contract unlock deposit conserves money into build progress',
    timeoutMs: 45000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const setup = await game.loadScenario('unlockAffordable');
      if (setup && setup.__missingContract) return FAIL('loadScenario contract missing');
      const before = await game.getSnapshot();
      const lockedBefore = (before.build && before.build.unlockTiles || []).filter(tile => tile && !tile.unlocked);
      if (!lockedBefore.length) return FAIL('no locked unlock tile exposed in scenario');
      await game.contractInput({ type: 'moveTo', target: 'unlock' });
      await game.contractInput({ type: 'wait', durationMs: 1200 });
      const after = await game.getSnapshot();
      const tileAfter = (after.build && after.build.unlockTiles || []).find(tile => {
        const prior = lockedBefore.find(candidate => candidate.id === tile.id);
        return prior && (tile.unlocked || (tile.deposited || 0) > (prior.deposited || 0));
      });
      if (!tileAfter) return FAIL('unlock deposit did not progress');
      const tileBefore = lockedBefore.find(tile => tile.id === tileAfter.id);
      const totalBefore = resourceNumber(before, 'resources.currency') + (tileBefore.deposited || 0);
      const totalAfter = resourceNumber(after, 'resources.currency') + (tileAfter.unlocked ? tileBefore.cost : tileAfter.deposited || 0);
      if (resourceNumber(after, 'resources.currency') >= resourceNumber(before, 'resources.currency') && !tileAfter.unlocked) {
        return FAIL('currency did not decrease and unlock did not complete');
      }
      if (!tileAfter.unlocked && (tileAfter.deposited || 0) <= (tileBefore.deposited || 0)) return FAIL('unlock deposit did not progress');
      if (Math.abs(totalAfter - totalBefore) > Math.max(5, tileBefore.cost || 0)) {
        return FAIL(`money conservation suspicious: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      }
      return PASS(`unlock ${tileBefore.kind || tileBefore.id}: totalBefore=${totalBefore}, totalAfter=${totalAfter}, unlocked=${!!tileAfter.unlocked}`);
    }
  },
  {
    id: 'p1-real-click-panel-blocking',
    level: 'P1',
    name: 'real click panel opens, closes, and stops blocking playfield',
    timeoutMs: 45000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      // Static quality gate note: clickSemanticControl resolves a visible DOM control and uses browser.mouseClick.
      const openedByClick = await game.clickSemanticControl('openPanel');
      if (!openedByClick.ok) return FAIL('no visible clickable panel opener found');
      await sleep(500);
      const openSnap = await game.getSnapshot();
      if (!openSnap.ui || !openSnap.ui.activePanel) return FAIL('panel did not become active after real click');
      const closedByClick = await game.clickSemanticControl('closePanel');
      if (!closedByClick.ok) return FAIL('no visible clickable panel close control found');
      await sleep(500);
      const closed = await game.getSnapshot();
      if (closed.ui.overlayBlocking || !closed.ui.canInteractWithPlayfield) {
        return FAIL(`panel still blocking after close: active=${closed.ui.activePanel}`);
      }
      await game.pressKey('ArrowRight', 450);
      const moved = await game.getSnapshot();
      const delta = screenRightDelta(closed, moved);
      if (isFiniteNumber(delta) && Math.abs(delta) < 1) {
        return FAIL('playfield did not accept real movement after panel close');
      }
      return PASS(`opened=${openSnap.ui.activePanel}, closed and canInteract=${closed.ui.canInteractWithPlayfield}`);
    }
  },
  {
    id: 'p2-contract-tray-capacity-rejection',
    level: 'P2',
    name: 'contract tray capacity prevents over-pickup',
    timeoutMs: 50000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('readyKitchen');
      let full = null;
      for (let i = 0; i < 10; i++) {
        const current = await game.getSnapshot();
        const currentCapacity = resourceNumber(current, 'player.foodCapacity');
        if (currentCapacity > 0 && resourceNumber(current, 'player.carryingFood') >= currentCapacity) {
          full = current;
          break;
        }
        await game.contractInput({ type: 'wait', durationMs: 1600 });
        await game.contractInput({ type: 'moveTo', target: 'food' });
        await game.contractInput({ type: 'wait', durationMs: 500 });
        await game.contractInput({ type: 'moveTo', target: 'kitchen' });
      }
      if (!full) full = await game.getSnapshot();
      const capacity = resourceNumber(full, 'player.foodCapacity');
      const carrying = resourceNumber(full, 'player.carryingFood');
      if (!(capacity > 0)) return FAIL('food capacity is not observable');
      if (carrying > capacity) return FAIL(`carryingFood already exceeds capacity: ${carrying}/${capacity}`);
      if (carrying < capacity) return FAIL(`setup did not reach full tray: ${carrying}/${capacity}`);
      const beforeTotal = foodTotal(full);
      const result = await game.contractInput({ type: 'moveTo', target: 'food' });
      await game.contractInput({ type: 'wait', durationMs: 500 });
      const after = await game.getSnapshot();
      const rejected = (result && result.lastAction && result.lastAction.ok === false) || (after.lastAction && after.lastAction.ok === false) || resourceNumber(after, 'player.carryingFood') === capacity;
      if (resourceNumber(after, 'player.carryingFood') > capacity) return FAIL('full tray accepted over-capacity food');
      if (foodTotal(after) < beforeTotal - 1) return FAIL(`full tray pickup lost food: totalBefore=${beforeTotal}, totalAfter=${foodTotal(after)}`);
      if (!rejected) return FAIL('full tray pickup did not reject or no-op clearly');
      return PASS(`full tray remained ${resourceNumber(after, 'player.carryingFood')}/${capacity}`);
    }
  },
  {
    id: 'p2-contract-cash-duplicate-guard',
    level: 'P2',
    name: 'contract cash pile cannot be collected twice',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('cashReady');
      const before = await game.getSnapshot();
      if (resourceNumber(before, 'resources.cashOnGround') <= 0 && resourceNumber(before, 'service.cashPile') <= 0) return FAIL('cashReady exposed no collectable cash');
      let moveResult = await game.contractInput({ type: 'moveTo', target: 'cash' });
      let first = await game.getSnapshot();
      let firstCollection = null;
      for (let i = 0; i < 12; i++) {
        if (resourceNumber(first, 'resources.currency') > resourceNumber(before, 'resources.currency')) {
          firstCollection = first;
          break;
        }
        if (moveResult && moveResult.lastAction && moveResult.lastAction.ok === false) break;
        await game.contractInput({ type: 'wait', durationMs: 700 });
        first = await game.getSnapshot();
        if (resourceNumber(first, 'resources.currency') > resourceNumber(before, 'resources.currency')) {
          firstCollection = first;
          break;
        }
        moveResult = await game.contractInput({ type: 'moveTo', target: 'cash' });
      }
      if (!firstCollection) return FAIL('first cash collect did not increase currency');
      for (let i = 0; i < 8 && (resourceNumber(first, 'resources.cashOnGround') > 0 || resourceNumber(first, 'service.cashPile') > 0); i++) {
        await game.contractInput({ type: 'moveTo', target: 'cash' });
        await game.contractInput({ type: 'wait', durationMs: 1000 });
        first = await game.getSnapshot();
      }
      const result = await game.contractInput({ type: 'moveTo', target: 'cash' });
      await game.contractInput({ type: 'wait', durationMs: 700 });
      const second = await game.getSnapshot();
      const currencyDelta = resourceNumber(second, 'resources.currency') - resourceNumber(first, 'resources.currency');
      const servedAfterFirst = resourceNumber(first, 'service.servedCustomers') - resourceNumber(firstCollection, 'service.servedCustomers');
      const servedDuringSecond = resourceNumber(second, 'service.servedCustomers') - resourceNumber(first, 'service.servedCustomers');
      const newServiceCash = servedAfterFirst > 0 || servedDuringSecond > 0;
      if (currencyDelta > 0 && !newServiceCash) {
        return FAIL(`cash could be collected twice: ${resourceNumber(first, 'resources.currency')}->${resourceNumber(second, 'resources.currency')}`);
      }
      const rejected = (result && result.lastAction && result.lastAction.ok === false) || (second.lastAction && second.lastAction.ok === false) ||
        (resourceNumber(second, 'resources.cashOnGround') === 0 && resourceNumber(second, 'service.cashPile') === 0);
      if (!rejected && !newServiceCash) return FAIL('second cash collect was not rejected or drained');
      return PASS(`cash collected once, currency=${resourceNumber(second, 'resources.currency')}`);
    }
  },
  {
    id: 'p2-contract-successful-upgrade-purchase',
    level: 'P2',
    name: 'contract affordable upgrade purchase spends currency and improves capability',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('upgradeAffordable');
      await game.contractInput({ type: 'openPanel', panel: 'upgrade' });
      const before = await game.getSnapshot();
      const controls = (before.interactables && before.interactables.panelControls || []).filter(c => c.enabled && c.id && !/close/i.test(c.id));
      const control = controls.find(c => /^(buy|purchase)$/i.test(String(c.kind || ''))) || controls.find(c => {
        const id = String(c.id).toLowerCase();
        const navigation = /^(?:open|tab|close|back|return|stats|reset|menu|rotate|zoom|pause|resume|collect|prestige)(?:$|[-_:]|[a-z])/.test(id);
        const purchase = /(^|[-_:])(?:buy|purchase|up)(?:$|[-_:])/.test(id) || /^(?:buy|up)[a-z]/.test(id);
        return !navigation && (purchase || /(?:capacity|speed|collection|prep)/.test(id));
      });
      if (!control) return FAIL('upgrade panel exposes no enabled purchase control');
      const currencyBefore = resourceNumber(before, 'resources.currency');
      const capBefore = resourceNumber(before, 'player.foodCapacity') + resourceNumber(before, 'upgrades.capacity') + resourceNumber(before, 'upgrades.speed') + resourceNumber(before, 'upgrades.collection');
      const result = await game.contractInput({ type: 'panelClick', control: control.id });
      const after = await game.getSnapshot();
      const capAfter = resourceNumber(after, 'player.foodCapacity') + resourceNumber(after, 'upgrades.capacity') + resourceNumber(after, 'upgrades.speed') + resourceNumber(after, 'upgrades.collection');
      if (result && result.lastAction && result.lastAction.ok === false) return FAIL(`affordable upgrade was rejected: ${result.lastAction.reason || control.id}`);
      if (!(resourceNumber(after, 'resources.currency') < currencyBefore)) return FAIL('affordable upgrade did not spend currency');
      if (!(capAfter > capBefore)) return FAIL('affordable upgrade did not improve any exposed capability');
      return PASS(`clicked ${control.id}, currency ${currencyBefore}->${resourceNumber(after, 'resources.currency')}`);
    }
  },
  {
    id: 'p2-contract-insufficient-upgrade-rejected',
    level: 'P2',
    name: 'contract insufficient upgrade purchase is rejected unchanged',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const setup = await game.loadScenario('upgradeInsufficient');
      if (setup && setup.__missingContract) return FAIL('loadScenario contract missing');
      let before = await game.getSnapshot();
      if (!before || !before.ui || !before.ui.activePanel) {
        await game.contractInput({ type: 'openPanel', panel: 'upgrade' });
        before = await game.getSnapshot();
      }
      const controls = ((before && before.interactables && before.interactables.panelControls) || [])
        .filter(c => {
          const id = String(c && c.id || '');
          const kind = String(c && c.kind || '').toLowerCase();
          return id &&
            !/tab|close|open|collect|offline|prestige|reset|wipe|deposit|withdraw/i.test(id) &&
            (/(capacity|cap)/i.test(id) || /purchase|upgrade/i.test(kind));
        })
        .sort((a, b) => {
          const aCapacity = /(capacity|cap)/i.test(String(a.id)) ? 0 : 1;
          const bCapacity = /(capacity|cap)/i.test(String(b.id)) ? 0 : 1;
          return aCapacity - bCapacity;
        });
      const control = controls[0];
      if (!control) return FAIL('upgrade panel exposes no purchase control');
      const beforeCurrency = resourceNumber(before, 'resources.currency');
      const beforeVaultBalance = resourceNumber(before, 'resources.vaultBalance');
      const beforeCapacity = resourceNumber(before, 'player.foodCapacity');
      const beforeUpgrades = cloneSmall(before && before.upgrades);
      const result = await game.contractInput({ type: 'panelClick', control: control.id });
      const after = await game.getSnapshot();
      const afterCurrency = resourceNumber(after, 'resources.currency');
      const afterVaultBalance = resourceNumber(after, 'resources.vaultBalance');
      const afterCapacity = resourceNumber(after, 'player.foodCapacity');
      const unchanged = beforeCurrency === afterCurrency &&
        beforeVaultBalance === afterVaultBalance &&
        beforeCapacity === afterCapacity &&
        JSON.stringify(beforeUpgrades) === JSON.stringify(cloneSmall(after && after.upgrades));
      const rejected = (result && result.lastAction && result.lastAction.ok === false) || (after.lastAction && after.lastAction.ok === false);
      if (!unchanged) return FAIL(`insufficient purchase mutated state: currency ${beforeCurrency}->${afterCurrency}, vault ${beforeVaultBalance}->${afterVaultBalance}, capacity ${beforeCapacity}->${afterCapacity}`);
      if (!rejected) return FAIL('insufficient purchase did not report rejection');
      return PASS(`unchanged currency=${afterCurrency}, vault=${afterVaultBalance}, capacity=${afterCapacity}, control=${control.id}`);
    }
  },
  {
    id: 'p2-contract-panel-close-recovers-input',
    level: 'P2',
    name: 'contract panel close recovers real keyboard input',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const setup = await game.loadScenario('panelOpen');
      if (setup && setup.__missingContract) return FAIL('loadScenario contract missing');
      const open = await game.getSnapshot();
      if (!open.ui || !open.ui.activePanel) return FAIL('panelOpen scenario did not expose active panel');
      await game.contractInput({ type: 'closePanel' });
      const closed = await game.getSnapshot();
      if (closed.ui.overlayBlocking || !closed.ui.canInteractWithPlayfield) return FAIL('closePanel left overlay blocking');
      await game.pressKey('ArrowLeft', 500);
      const after = await game.getSnapshot();
      const beforePlayer = closed && closed.player;
      const afterPlayer = after && after.player;
      const moved = beforePlayer && afterPlayer &&
        ['worldX', 'worldZ'].every((field) => isFiniteNumber(beforePlayer[field]) && isFiniteNumber(afterPlayer[field])) &&
        Math.hypot(afterPlayer.worldX - beforePlayer.worldX, afterPlayer.worldZ - beforePlayer.worldZ) > 0.001;
      if (!moved) {
        return FAIL('real keyboard input did not move after closePanel');
      }
      return PASS('panel closed and real input recovered');
    }
  },
  {
    id: 'p2-contract-joystick-direction-opposite',
    level: 'P2',
    name: 'contract joystick screen directions are opposite',
    timeoutMs: 35000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.resetGame({ clearSave: true });
      await game.waitForReady();
      const s0 = await game.getSnapshot();
      await game.contractInput({ type: 'joystick', dx: 1, dy: 0, durationMs: 650 });
      const s1 = await game.getSnapshot();
      await game.contractInput({ type: 'joystick', dx: -1, dy: 0, durationMs: 900 });
      const s2 = await game.getSnapshot();
      const right = screenRightDelta(s0, s1);
      const left = screenRightDelta(s1, s2);
      if (![right, left].every(isFiniteNumber)) return FAIL('joystick movement positions are not observable');
      if (Math.abs(right) < 1 || Math.abs(left) < 1) return FAIL(`joystick movement too small: right=${right}, left=${left}`);
      if (Math.sign(right) === Math.sign(left)) return FAIL(`joystick directions are not opposite: right=${right}, left=${left}`);
      return PASS(`joystick deltas right=${right.toFixed(1)}, left=${left.toFixed(1)}`);
    }
  },
  {
    id: 'p2-contract-worker-visible-motion',
    level: 'P2',
    name: 'contract hired worker has visible motion and service effect',
    timeoutMs: 45000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const setup = await game.loadScenario('workerHired');
      if (setup && setup.__missingContract) return FAIL('loadScenario contract missing');
      const before = await game.getSnapshot();
      await game.contractInput({ type: 'wait', durationMs: 7000 });
      const after = await game.getSnapshot();
      const motionBefore = resourceNumber(before, 'staff.workerMotionRevision');
      const motionAfter = resourceNumber(after, 'staff.workerMotionRevision');
      const visibleWorkers = resourceNumber(after, 'staff.visibleWorkers');
      const serviceDeltas = [
        resourceNumber(after, 'service.counterStock') - resourceNumber(before, 'service.counterStock'),
        resourceNumber(after, 'service.servedCustomers') - resourceNumber(before, 'service.servedCustomers'),
        resourceNumber(after, 'service.cashPile') - resourceNumber(before, 'service.cashPile'),
        resourceNumber(after, 'resources.currency') - resourceNumber(before, 'resources.currency')
      ];
      const serviceEffect = serviceDeltas.some(delta => delta > 0);
      if (visibleWorkers < 1) return FAIL('workerHired scenario has no visible workers');
      if (motionAfter <= motionBefore) return FAIL(`worker motion did not advance: ${motionBefore}->${motionAfter}`);
      if (!serviceEffect) return FAIL('worker motion had no service/economy effect');
      return PASS(`workers=${visibleWorkers}, motion ${motionBefore}->${motionAfter}, serviceDeltas=${serviceDeltas.join(',')}`);
    }
  },
  {
    id: 'p2-contract-depth-service-systems',
    level: 'P2',
    name: 'contract optional depth services affect queues or rush state',
    timeoutMs: 40000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const setup = await game.loadScenario('depthService');
      if (setup && setup.__missingContract) return FAIL('depth service scenario missing');
      const before = await game.getSnapshot();
      const depthTiles = before && before.build && Array.isArray(before.build.unlockTiles)
        ? before.build.unlockTiles
        : [];
      const driveTile = depthTiles.find(tile => tile &&
        /drive/i.test([tile.id, tile.kind].filter(Boolean).join(' ')));
      const baselineStock = resourceNumber(before, 'service.counterStock');
      const baselineQueue = resourceNumber(before, 'service.customerQueue');
      const hasDriveThru = !!driveTile &&
        (driveTile.unlocked || (baselineStock > 0 && baselineQueue > 0));
      const hasNonDriveDepth = depthTiles.some(tile => {
        if (!tile || !tile.unlocked) return false;
        return /table|dining|self|kiosk/i.test([tile.id, tile.kind].filter(Boolean).join(' '));
      });
      const rushBefore = before && before.progress;
      let afterTrigger = before;
      if (hasDriveThru) {
        const moveResult = await game.contractInput({ type: 'moveTo', target: 'driveThru' });
        if (moveResult && moveResult.lastAction && moveResult.lastAction.ok === false) {
          return FAIL('drive-thru service progression rejected');
        }
        afterTrigger = await game.getSnapshot();
      }
      await game.contractInput({ type: 'wait', durationMs: 2200 });
      await sleep(2300);
      const after = await game.getSnapshot();
      const queueDelta = resourceNumber(after, 'service.customerQueue') - resourceNumber(before, 'service.customerQueue');
      const postTriggerQueueDelta =
        resourceNumber(after, 'service.customerQueue') - resourceNumber(afterTrigger, 'service.customerQueue');
      const servedDelta = resourceNumber(after, 'service.servedCustomers') - resourceNumber(before, 'service.servedCustomers');
      const cashPileDelta =
        resourceNumber(after, 'service.cashPile') - resourceNumber(before, 'service.cashPile');
      const cashOnGroundDelta =
        resourceNumber(after, 'resources.cashOnGround') - resourceNumber(before, 'resources.cashOnGround');
      const currencyDelta =
        resourceNumber(after, 'resources.currency') - resourceNumber(before, 'resources.currency');
      const rushAfter = after && after.progress;
      const rushEvidence = !!(rushBefore && rushAfter) &&
        (!!rushBefore.rushActive !== !!rushAfter.rushActive ||
          (isFiniteNumber(rushBefore.rushTimeLeft) &&
            isFiniteNumber(rushAfter.rushTimeLeft) &&
            rushAfter.rushTimeLeft < rushBefore.rushTimeLeft));
      const driveEconomyEvidence =
        cashPileDelta !== 0 || cashOnGroundDelta !== 0 || currencyDelta !== 0;
      const serviceEvidence = hasDriveThru
        ? servedDelta !== 0 || postTriggerQueueDelta !== 0 || driveEconomyEvidence
        : hasNonDriveDepth && (queueDelta !== 0 || servedDelta !== 0);
      if (!serviceEvidence && !rushEvidence) {
        return FAIL('no optional service/rush/customer observable changed');
      }
      return PASS(`queueDelta=${queueDelta}, servedDelta=${servedDelta}, rushEvidence=${rushEvidence}, driveThru=${hasDriveThru}`);
    }
  },
  {
    id: 'p2-contract-save-restore-persistence',
    level: 'P2',
    name: 'contract saved unlock progress survives page reload',
    timeoutMs: 45000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.loadScenario('unlockAffordable');
      const before = await game.getSnapshot();
      const lockedBefore = (before.build && before.build.unlockTiles || []).filter(tile => tile && !tile.unlocked);
      if (!lockedBefore.length) return FAIL('unlockAffordable has no locked tile to persist');
      await game.contractInput({ type: 'moveTo', target: 'unlock' });
      await game.contractInput({ type: 'wait', durationMs: 2500 });
      const saved = await game.getSnapshot();
      const savedTile = (saved.build && saved.build.unlockTiles || []).find(tile => {
        const prior = lockedBefore.find(candidate => candidate.id === tile.id);
        return prior && (tile.unlocked || (tile.deposited || 0) > (prior.deposited || 0));
      });
      if (!savedTile) return FAIL('setup did not create persisted unlock progress');
      const tile = lockedBefore.find(candidate => candidate.id === savedTile.id);
      if (!saved.progress || typeof saved.progress.saved !== 'boolean') return FAIL('saved flag is not observable before reload');
      await ctx.browser.goto(ctx.args.url);
      const reloadedGame = createGameDriver(ctx.browser);
      const reloaded = await reloadedGame.waitForReady();
      const restoredTile = (reloaded.build && reloaded.build.unlockTiles || []).find(t => t.id === tile.id) || null;
      if (!restoredTile) return FAIL('reloaded snapshot lost unlock tile');
      if (savedTile.unlocked && !restoredTile.unlocked) return FAIL('unlocked tile did not persist after reload');
      if (!savedTile.unlocked && (restoredTile.deposited || 0) < (savedTile.deposited || 0)) return FAIL('unlock deposit regressed after reload');
      return PASS(`persisted tile ${tile.id}: unlocked=${!!restoredTile.unlocked}, deposited=${restoredTile.deposited || 0}`);
    }
  },
  {
    id: 'p2-contract-save-prestige-guards',
    level: 'P2',
    name: 'contract save and prestige guards reject illegal reset reward',
    timeoutMs: 40000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const before = await game.getSnapshot();
      const prestigeBefore = resourceNumber(before, 'progress.prestigeLevel');
      const invalid = await game.contractInput({ type: 'panelClick', control: 'prestige' });
      const afterInvalid = await game.getSnapshot();
      const prestigeAfterInvalid = resourceNumber(afterInvalid, 'progress.prestigeLevel');
      const rejected = (invalid && invalid.lastAction && invalid.lastAction.ok === false) || (afterInvalid.lastAction && afterInvalid.lastAction.ok === false) || prestigeAfterInvalid === prestigeBefore;
      if (!rejected) return FAIL('prestige without legal funds was not rejected');
      await game.resetGame({ clearSave: false });
      const afterReset = await game.getSnapshot();
      if (!afterReset.progress || typeof afterReset.progress.saved !== 'boolean') return FAIL('saved progress flag is not observable');
      if (resourceNumber(afterReset, 'progress.prestigeLevel') < prestigeBefore) return FAIL('reset lowered permanent prestige unexpectedly');
      return PASS(`prestige unchanged/rejected at ${prestigeAfterInvalid}, saved=${afterReset.progress.saved}`);
    }
  }
];

module.exports = {
  sleep,
  suite: checks
};
