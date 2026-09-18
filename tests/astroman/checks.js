// === GDD Coverage Map ===
// M1 (3D城市主场景与HUD) -> p0-boot-contract, p0-visible-3d-playfield, p2-hud-snapshot-sync
// M2 (步行与屏幕方向移动) -> p1-real-key-left-right-screen-direction, p1-real-touch-joystick-direction
// M3 (飞行油门与高度) -> p1-real-key-flight-throttle-up-down, p1-real-touch-joystick-direction
// M4 (视角切换) -> p2-contract-camera-toggle-rejection
// M5 (超能力释放与切换) -> p1-real-mouse-power-release-visible, p2-contract-invalid-power-rejected
// M6 (能力命中后果) -> p1-real-mouse-power-release-visible, p2-world-motion-and-effects
// M7 (车辆进入驾驶退出) -> p1-real-key-vehicle-enter-drive-exit
// M8 (任务链与目标指引) -> p1-contract-quest-loop-reward, p2-contract-timed-quest-countdown-failure
// M9 (经济、拾取与商店) -> p2-real-click-shop-purchase, p2-contract-insufficient-funds-unchanged, p2-contract-unavailable-ammo-refund, p2-contract-pickup-resource-loop, p2-contract-wanted-pickup-boundary
// M9b (武器开火与弹药) -> p2-contract-weapon-fire-ammo-loop
// M10 (生命死亡与重开) -> p1-contract-death-restart-state
// M11 (对话教程面板阻塞) -> p1-ui-overlay-not-blocking-playing, p2-real-click-shop-purchase
// M12 (深度生态与可选系统) -> p2-world-motion-and-effects, p2-contract-pickup-resource-loop, p2-contract-wanted-pickup-boundary, p2-real-click-minimap-toggle-markers
//
// === Category Map ===
// Boot & Stability -> p0-boot-contract, p0-visible-3d-playfield
// UI Flow & Blocking -> p1-ui-overlay-not-blocking-playing
// Input Semantics -> p1-real-key-left-right-screen-direction, p1-real-touch-joystick-direction
// Core Mechanic Loop -> p1-real-key-flight-throttle-up-down, p1-real-mouse-power-release-visible, p1-real-key-vehicle-enter-drive-exit, p1-contract-quest-loop-reward
// State Machine -> p1-contract-death-restart-state, p2-contract-timed-quest-countdown-failure
// Economy/Progression -> p2-real-click-shop-purchase, p2-contract-unavailable-ammo-refund
// Feedback & Observability -> p2-hud-snapshot-sync, p2-world-motion-and-effects
// Invariants & Rejection -> p2-contract-insufficient-funds-unchanged, p2-contract-unavailable-ammo-refund, p2-contract-invalid-power-rejected
// Depth/Optional Systems -> p2-world-motion-and-effects, p2-contract-camera-toggle-rejection
//
// === Rationality Map ===
// p1-ui-overlay-not-blocking-playing: M1/M11 | real action: wait/close visible panel if needed | independent observation: phase + overlayBlocking + playfield bounds | empty-shell failure: phase says playing while overlay blocks input fails
// p1-real-key-left-right-screen-direction: M2 | real action: ArrowRight then ArrowLeft via keyDown/keyUp | independent observation: player.screenX delta + render revision | empty-shell failure: no movement, same-direction movement, API-only movement fails
// p1-real-touch-joystick-direction: M2/M3 | real action: CDP dispatchTouchEvent right then left drag on playfield | independent observation: player screen direction delta + revision | empty-shell failure: touch listeners absent, joystick ignored, or mirrored directions fail
// p1-real-key-flight-throttle-up-down: M3 | real action: Shift then Control via keyboard | independent observation: altitude/mode/render revision | empty-shell failure: throttle UI exists but no world effect fails
// p1-real-mouse-power-release-visible: M5/M6 | real action: DOM/mouse click switch power and mouse press ability button | independent observation: powers.effectVisible/affectedCounts/HUD/canvas | empty-shell failure: button flash without effect or target consequence fails
// p1-real-key-vehicle-enter-drive-exit: M7 | real action: Enter, ArrowUp, ArrowLeft/Right, Enter/exit | independent observation: mode vehicle screen/speed changes | empty-shell failure: no real vehicle control or exit cleanup fails
// p1-contract-quest-loop-reward: M8 | contract setup plus player-level input action | independent observation: quest progress/status + score/reputation HUD values | empty-shell failure: scenario already completed or reward not caused by action fails
// p1-contract-death-restart-state: M10 | contract setup plus player-level hazard/restart actions | independent observation: result phase/overlay/health and unchanged score while dead | empty-shell failure: terminal lock missing or restart incomplete fails
// p2-contract-timed-quest-countdown-failure: M8 | contract setup plus waitForTimer action | independent observation: timeRemaining trend/status/reward invariant | empty-shell failure: fake quest without countdown or pre-awarded success fails
// p2-real-click-shop-purchase: M9/M11 | real action: open shop and click item | independent observation: cash decrease and inventory/health/ammo effect | empty-shell failure: shop panel exists but controls do nothing fails
// p2-contract-insufficient-funds-unchanged: M9 | contract action: attempt expensive purchase | independent observation: lastRejected and totalBefore/totalAfter unchanged | empty-shell failure: negative cash or free item accepted fails
// p2-contract-unavailable-ammo-refund: M9 | contract action: attempt unavailable ammo/repeat purchase | independent observation: cash/owned/ammo valid and rejected/refunded | empty-shell failure: duplicate item, overfilled ammo, or silent cash loss fails
// p2-contract-invalid-power-rejected: M5/M10 | contract action: unknown power and terminal ability input | independent observation: lastRejected and unchanged phase/score | empty-shell failure: all inputs return ok true fails
// p2-hud-snapshot-sync: M1/M5/M8 | real/contract action: score/power/quest update | independent observation: DOM HUD text + snapshot fields | empty-shell failure: API-only state without visible HUD fails
// p2-world-motion-and-effects: M6/M12 | contract setup plus idle/action wait | independent observation: moving entity counts/render revision/effect counts | empty-shell failure: static prop city fails
// p2-contract-camera-toggle-rejection: M4 | contract action: toggle camera and illegal driving toggle | independent observation: camera.mode change then rejection/unchanged | empty-shell failure: fixed camera field or illegal transition accepted fails
// p2-contract-pickup-resource-loop: M9/M12 | contract action: pickup cash/ammo/questItem | independent observation: resource/progress delta + pickup count/lastCollected | empty-shell failure: resources prefilled or pickup action ignored fails
// p2-contract-wanted-pickup-boundary: M9/M12 | contract action: collect wanted reducer with/without wanted level | independent observation: wanted decreases or stays clamped + no cash mutation | empty-shell failure: wanted can go negative or pickup mutates unrelated state fails
// p2-contract-weapon-fire-ammo-loop: M9b/M12 | contract action: fire weapon with and without ammo | independent observation: ammo delta + projectile/particle/fired/hit/HUD consequence | empty-shell failure: weapon inventory only, no firing loop, or negative ammo fails
// p2-real-click-minimap-toggle-markers: M1/M8/M12 | real action: mouse click minimap region | independent observation: minimap expanded changes + marker summary/playfield blocking | empty-shell failure: static minimap image or permanently blocking overlay fails

const zlib = require('zlib');
const PASS = detail => ({ status: 'PASS', detail });
const FAIL = detail => ({ status: 'FAIL', detail });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function finiteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function changed(a, b, min = 0.1) {
  return finiteNumber(a) && finiteNumber(b) && Math.abs(b - a) > min;
}

function num(v, fallback = 0) {
  return finiteNumber(v) ? v : fallback;
}

function pngStatsFromBase64(base64) {
  const buf = Buffer.from(base64, 'base64');
  if (buf.length < 32 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
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
  const unique = new Set();
  const buckets = new Map();
  let lumaMin = 255, lumaMax = 0, samples = 0;
  const pixelStep = Math.max(1, Math.floor((width * height) / 3500));
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
        const pr = pa <= pb && pa <= pc ? left : (pb <= pc ? up : upLeft);
        val = (rawVal + pr) & 255;
      }
      cur[x] = val;
    }
    for (let x = 0; x < width; x++) {
      if (pixelIndex++ % pixelStep !== 0) continue;
      const i = x * channels;
      const r = cur[i], g = cur[i + 1], b = cur[i + 2];
      const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      lumaMin = Math.min(lumaMin, luma);
      lumaMax = Math.max(lumaMax, luma);
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      unique.add(key);
      buckets.set(key, (buckets.get(key) || 0) + 1);
      samples++;
    }
    prev.set(cur);
  }
  const dominant = Math.max(0, ...buckets.values());
  return {
    width, height, samples,
    uniqueColors: unique.size,
    lumaRange: lumaMax - lumaMin,
    dominantRatio: samples ? dominant / samples : 1
  };
}

function createGameDriver(browser) {
  async function evalPage(expr) {
    const value = await browser.eval(expr);
    if (value && value.__l2_err__) throw new Error(value.__l2_err__);
    return value;
  }

  async function hasApi() {
    return !!(await evalPage(`!!(window.__gameTest && typeof window.__gameTest.getSnapshot === 'function')`));
  }

  async function apiCall(source) {
    return await evalPage(`(async function(){ ${source} })()`);
  }

  async function snapshot() {
    const snap = await evalPage(`
      (function(){
        if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
          return window.__gameTest.getSnapshot();
        }
        return { ok: false, contractMissing: true, lastRejected: { reason: 'missing __gameTest contract' } };
      })()
    `);
    return snap || {};
  }

  async function reset(options) {
    if (!(await hasApi())) return snapshot();
    const opts = JSON.stringify(options || {});
    const s = await apiCall(`return await window.__gameTest.reset(${opts});`);
    await sleep(200);
    return s || snapshot();
  }

  async function loadScenario(name, options) {
    if (!(await hasApi())) return snapshot();
    const s = await apiCall(`return await window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})});`);
    await sleep(200);
    return s || snapshot();
  }

  async function contractInput(action) {
    if (!(await hasApi())) return { ok: false, reason: 'missing __gameTest contract' };
    const s = await apiCall(`return await window.__gameTest.input(${JSON.stringify(action)});`);
    await sleep(120);
    return s || snapshot();
  }

  async function setTouchContext(enabled) {
    if (enabled) {
      await browser.cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true
      });
      await browser.cdp.send('Emulation.setTouchEmulationEnabled', {
        enabled: true,
        configuration: 'mobile'
      });
    } else {
      await browser.cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
      await browser.cdp.send('Emulation.clearDeviceMetricsOverride');
    }
    await browser.cdp.send('Page.reload', { ignoreCache: true });
    await waitForReady();
  }

  async function waitForReady() {
    const deadline = Date.now() + 8000;
    let last = null;
    while (Date.now() < deadline) {
      last = await snapshot();
      const pf = last.playfield && last.playfield.bounds;
      if ((last.phase === 'playing' || last.screen === 'play') && pf && pf.width > 100 && pf.height > 100) return last;
      await sleep(250);
    }
    return last || {};
  }

  async function playfieldBounds() {
    const snap = await snapshot();
    if (snap.playfield && snap.playfield.bounds && snap.playfield.bounds.width > 0) return snap.playfield.bounds;
    const rect = await evalPage(`
      (function(){
        const candidates = Array.from(document.querySelectorAll('canvas, [data-game-playfield], main, #gameContainer'))
          .map(el => ({ el, r: el.getBoundingClientRect() }))
          .filter(x => x.r.width > 100 && x.r.height > 100)
          .sort((a,b) => (b.r.width*b.r.height)-(a.r.width*a.r.height));
        if (!candidates[0]) return null;
        const r = candidates[0].r;
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      })()
    `);
    return rect;
  }

  async function realKey(code, durationMs = 250) {
    await browser.keyDown(code);
    await sleep(durationMs);
    await browser.keyUp(code);
    await sleep(250);
  }

  async function realMouseHold(x, y, durationMs = 450) {
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, modifiers: 0 });
    await sleep(durationMs);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, modifiers: 0 });
    await sleep(250);
  }

  async function realTouchDrag(from, to, durationMs = 350) {
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y, radiusX: 4, radiusY: 4, id: 1 }]
    });
    const steps = Math.max(3, Math.ceil(durationMs / 90));
    const stepDelay = Math.max(40, durationMs / (steps + 1));
    for (let step = 1; step <= steps; step++) {
      await sleep(stepDelay);
      const progress = step / steps;
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{
          x: from.x + (to.x - from.x) * progress,
          y: from.y + (to.y - from.y) * progress,
          radiusX: 4,
          radiusY: 4,
          id: 1
        }]
      });
    }
    const during = await snapshot();
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(300);
    return { during, after: await snapshot() };
  }

  async function findTouchControlPoint() {
    return await evalPage(`
      (function(){
        const candidates = Array.from(document.querySelectorAll('*'))
          .map(el => {
            const r = el.getBoundingClientRect();
            const label = [
              el.getAttribute('data-game-control'),
              el.getAttribute('data-testid'),
              el.getAttribute('aria-label'),
              el.id,
              typeof el.className === 'string' ? el.className : ''
            ].filter(Boolean).join(' ').toLowerCase();
            return { r, label };
          })
          .filter(x => x.r.width > 30 && x.r.height > 30 && /joystick|thumbstick|movement|joyzone|touch[-_ ]?joy|(?:^|[-_ ])joy(?:$|[-_ ]|[a-z]?$)|(?:^|[-_ ])stick(?:$|[-_ ])/.test(x.label))
          .sort((a, b) => (b.r.width * b.r.height) - (a.r.width * a.r.height));
        const c = candidates[0];
        if (!c) return null;
        return {
          x: c.r.left + c.r.width / 2,
          y: c.r.top + c.r.height / 2,
          width: c.r.width,
          height: c.r.height
        };
      })()
    `);
  }

  async function findSemanticControl(names, options = {}) {
    const returnAll = options.all === true;
    return await evalPage(`
      (function(){
        const names = ${JSON.stringify(names)}.map(s => String(s).toLowerCase());
        const containerSelector = '.vendor-item, .vendorItem, .shopItem, .shop-item, .item, [data-item], [data-shop-item]';
        const controls = Array.from(document.querySelectorAll([
          'button', '[role="button"]', '[data-game-control]', '[data-testid]',
          '[data-ptr]', '[data-power]', '[data-p]', '[data-shop-item]', '[data-item]',
          '[aria-label]', '[title]', '[data-key]', '[accesskey]', 'input',
          '.vendor-item', '.vendorItem', '.shopItem', '.shop-item', '.item',
          '[id*="interact" i]', '[id*="ability" i]', '[id*="power" i]', '[id*="switch" i]',
          '[class*="pbtn" i]', '[class*="pow" i]', '[class*="ctl-btn" i]',
          '[class*="shop" i]', '[class*="vendor" i]', '[class*="interact" i]',
          '[class*="touch" i]'
        ].join(', '))).filter(el =>
          !el.matches(containerSelector) || !el.querySelector('button, [role="button"], input')
        );
        const matches = [];
        for (const [index, el] of controls.entries()) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' ||
              style.visibility === 'hidden' || style.pointerEvents === 'none') continue;
          const container = el.closest(containerSelector);
          const label = [
            el.getAttribute('data-game-control'),
            el.getAttribute('data-testid'),
            el.getAttribute('aria-label'),
            el.getAttribute('data-ptr'),
            el.getAttribute('data-p'),
            el.getAttribute('data-power'),
            el.getAttribute('data-label'),
            el.getAttribute('data-key'),
            el.getAttribute('title'),
            el.getAttribute('accesskey'),
            el.getAttribute('data-item'),
            el.getAttribute('data-shop-item'),
            el.id,
            typeof el.className === 'string' ? el.className : '',
            el.textContent,
            container && container.getAttribute('data-item'),
            container && container.getAttribute('data-ptr'),
            container && container.getAttribute('data-power'),
            container && container.getAttribute('data-shop-item'),
            container && typeof container.className === 'string' ? container.className : '',
            container && container.textContent
          ].filter(Boolean).join(' ').toLowerCase();
          if (!names.some(name => label.includes(name))) continue;
          const stateLabel = [
            label,
            el.getAttribute('aria-disabled'),
            el.getAttribute('data-disabled'),
            el.getAttribute('data-available'),
            container && container.getAttribute('aria-disabled'),
            container && container.getAttribute('data-disabled'),
            container && container.getAttribute('data-available')
          ].filter(Boolean).join(' ').toLowerCase();
          const disabled = el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true' ||
            el.getAttribute('data-disabled') === 'true' ||
            !!(container && (container.matches(':disabled') || container.getAttribute('aria-disabled') === 'true' ||
              container.getAttribute('data-disabled') === 'true')) ||
            /\b(?:disabled|unavailable|unavail|sold|owned|full|out of stock|too poor|not available)\b/i.test(stateLabel);
          const classLabel = typeof el.className === 'string' ? el.className : '';
          const controlLike = el.matches('button, [role="button"], input, [data-game-control], [data-testid], [data-ptr], [data-power], [data-p], [data-item], [data-shop-item]') ||
            /(?:btn|button|control|touch|pbtn|pow|shop|vendor|item|interact|action)/i.test(classLabel);
          const score = (controlLike ? 100 : 0) +
            (/(?:^|\s)(?:btn|button|touchbtn|touch-zone|pbtn|pow|vendor-item|shopitem|shop-item|buy)(?:\s|$)/i.test(classLabel) ? 30 : 0) +
            (/(?:interact|action|shop|buy|use|power|ability)/i.test(label) ? 5 : 0);
          matches.push({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            label,
            disabled,
            score,
            index
          });
        }
        matches.sort((a, b) => b.score - a.score || a.index - b.index);
        const result = matches.map(({ x, y, label, disabled }) => ({ x, y, label, disabled }));
        return ${returnAll ? 'result' : '(result[0] || null)'};
      })()
    `);
  }

  async function findCameraControl(names) {
    return await evalPage(`
      (function(){
        const names = ${JSON.stringify(names)}.map(value => String(value).toLowerCase());
        const normalizeKey = value => {
          const raw = String(value || '').trim();
          if (/^(Key[A-Za-z]|Digit[0-9]|F[1-9][0-9]?)$/i.test(raw)) {
            return raw.replace(/^Key([a-z])$/i, (_, char) => 'Key' + char.toUpperCase());
          }
          if (/^[A-Za-z]$/.test(raw)) return 'Key' + raw.toUpperCase();
          if (/^[0-9]$/.test(raw)) return 'Digit' + raw;
          return null;
        };
        const selector = [
          'button', '[role="button"]', '[data-game-control]', '[data-testid]',
          '[aria-label]', '[title]', '[data-key]', '[accesskey]',
          '[id*="camera" i]', '[id*="view" i]', '[id*="cam" i]',
          '[class*="camera" i]', '[class*="view" i]', '[class*="cam" i]'
        ].join(', ');
        const matches = Array.from(document.querySelectorAll(selector)).map((el, index) => {
          if (el.tagName === 'CANVAS') return null;
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' ||
              style.visibility === 'hidden' || style.pointerEvents === 'none') return null;
          const keyNode = el.querySelector('[data-key], .key, .shortcut, small, .k');
          const keyHint = [el.getAttribute('data-key'), el.getAttribute('accesskey'), keyNode && keyNode.textContent]
            .filter(Boolean).join(' ');
          const keyMatch = keyHint.match(/\b(Key[A-Za-z]|Digit[0-9]|F[1-9][0-9]?)\b/i) ||
            keyHint.match(/\b([A-Za-z0-9])\b/);
          const label = [
            el.getAttribute('data-game-control'),
            el.getAttribute('data-testid'),
            el.getAttribute('aria-label'),
            el.getAttribute('data-label'),
            el.getAttribute('title'),
            el.id,
            typeof el.className === 'string' ? el.className : '',
            el.textContent
          ].filter(Boolean).join(' ').toLowerCase();
          if (!names.some(name => label.includes(name))) return null;
          const disabled = el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true' ||
            el.getAttribute('data-disabled') === 'true';
          if (disabled) return null;
          const controlLike = el.matches('button, [role="button"], [data-game-control], [data-testid], [data-key], [accesskey]') ||
            style.cursor === 'pointer' || typeof el.onclick === 'function';
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            label,
            key: keyMatch ? normalizeKey(keyMatch[1]) : null,
            score: (controlLike ? 100 : 0) + (keyMatch ? 10 : 0) + (el.tagName === 'BUTTON' ? 5 : 0),
            index
          };
        }).filter(Boolean).sort((a, b) => b.score - a.score || a.index - b.index);
        return matches[0] || null;
      })()
    `);
  }

  async function findCameraKey(snapshot) {
    const labels = Array.isArray(snapshot && snapshot.panels && snapshot.panels.visibleControls)
      ? snapshot.panels.visibleControls
      : [];
    const page = await evalPage(`
      (function(){
        const elements = Array.from(document.querySelectorAll(
          '[aria-label], [title], [data-key], [data-game-control], [accesskey], button, [role="button"],
          '[id*="camera" i]', '[id*="view" i]', '[id*="cam" i]',
          '[class*="camera" i]', '[class*="view" i]', '[class*="cam" i]'
        )).filter(el => el.tagName !== 'CANVAS')
          .map(el => [el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-key'),
            el.getAttribute('data-game-control'), el.getAttribute('accesskey'), el.id, el.textContent]
            .filter(Boolean).join(' '));
        return { labels: elements, text: document.body ? (document.body.innerText || document.body.textContent || '') : '' };
      })()
    `);
    const text = labels.concat(page && Array.isArray(page.labels) ? page.labels : [], page && page.text ? [page.text] : [])
      .filter(Boolean).join('\n');
    const normalizeKey = value => {
      const raw = String(value || '').trim();
      if (/^(Key[A-Za-z]|Digit[0-9]|F[1-9][0-9]?)$/i.test(raw)) {
        return raw.replace(/^Key([a-z])$/i, (_, char) => 'Key' + char.toUpperCase());
      }
      if (/^[A-Za-z]$/.test(raw)) return 'Key' + raw.toUpperCase();
      if (/^[0-9]$/.test(raw)) return 'Digit' + raw;
      return null;
    };
    const cameraTerms = /camera|view|cam|perspective|first[ -]?person|third[ -]?person|fps|1st|3rd|视角|镜头/i;
    for (const line of text.split(/\n+/)) {
      if (!cameraTerms.test(line)) continue;
      const explicit = line.match(/\b(Key[A-Za-z]|Digit[0-9]|F[1-9][0-9]?)\b/i);
      if (explicit) return normalizeKey(explicit[1]);
      const bracketed = line.match(/[\[(]\s*([A-Za-z0-9])\s*[\])]/);
      if (bracketed) return normalizeKey(bracketed[1]);
      const before = line.match(/\b([A-Za-z0-9])\b[^\n]{0,24}\b(?:camera|view|cam)\b/i);
      if (before) return normalizeKey(before[1]);
      const after = line.match(/\b(?:camera|view|cam)\b[^\n]{0,24}\b([A-Za-z0-9])\b/i);
      if (after) return normalizeKey(after[1]);
      const named = line.match(/(?:key|shortcut|hotkey|press|toggle|switch)\s*[:=]?\s*([A-Za-z0-9])/i);
      if (named) return normalizeKey(named[1]);
    }
    return null;
  }

  async function findPowerShortcut() {
    const text = await evalPage(`
      (document.body && (document.body.innerText || document.body.textContent) || '')
    `);
    const lines = String(text || '').split(/\n+/);
    const powerTerms = /power|powers|frost|freeze|switch|select|cycle/i;
    for (const line of lines) {
      if (!powerTerms.test(line)) continue;
      if (/\b(?:1\s*\/\s*2\s*\/\s*3|1\s*,\s*2\s*,\s*3)\b/i.test(line) && /frost|freeze|power/i.test(line)) {
        return 'Digit3';
      }
      const explicit = line.match(/\b(?:Digit3|Key3)\b/i);
      if (explicit) return 'Digit3';
      const bracketed = line.match(/[\[(]\s*3\s*[\])]/);
      if (bracketed) return 'Digit3';
      const named = line.match(/(?:press|key|shortcut|hotkey|switch|select|cycle)\s*[:=]?\s*3\b/i);
      if (named) return 'Digit3';
      const frostKey = line.match(/\b3\b[^\n]{0,24}\b(?:frost|freeze)\b/i) ||
        line.match(/\b(?:frost|freeze)\b[^\n]{0,24}\b3\b/i);
      if (frostKey) return 'Digit3';
    }
    return null;
  }

  async function useCameraInput(initialSnapshot, preferredKey = null) {
    const names = [
      'camera', 'view', 'perspective', 'first person', 'third person',
      'first-person', 'third-person', '1st person', '3rd person', 'fps', 'cam', '视角', '镜头'
    ];
    const control = await findCameraControl(names);
    if (control) {
      await browser.mouseClick(control.x, control.y);
      await sleep(250);
      const afterClick = await snapshot();
      const changed = afterClick && afterClick.camera && initialSnapshot && initialSnapshot.camera &&
        afterClick.camera.mode !== initialSnapshot.camera.mode;
      if (changed) return { kind: 'pointer', label: control.label, key: control.key || null };
      const key = preferredKey || control.key || await findCameraKey(initialSnapshot);
      if (key) {
        await realKey(key, 180);
        return { kind: 'key', key, fallbackFrom: 'pointer', label: control.label };
      }
      return { kind: 'pointer', label: control.label, key: control.key || null };
    }
    const key = preferredKey || await findCameraKey(initialSnapshot);
    if (!key) return null;
    await realKey(key, 180);
    return { kind: 'key', key };
  }

  async function clickSemanticControl(names) {
    const result = await findSemanticControl(names);
    if (result) {
      await browser.mouseClick(result.x, result.y);
      await sleep(250);
      return result;
    }
    return null;
  }

  async function visibleHudText() {
    return await evalPage(`(document.body && document.body.innerText || '').slice(0, 4000)`);
  }

  async function screenshotStats() {
    try {
      const shot = await browser.cdp.send('Page.captureScreenshot', { format: 'png' });
      return shot && shot.data ? pngStatsFromBase64(shot.data) : null;
    } catch (_) {
      return null;
    }
  }

  async function findMinimapPoint() {
    return await evalPage(`
      (function(){
        const candidates = Array.from(document.querySelectorAll('button, [role="button"], [data-game-control*="minimap" i], [data-game-control*="radar" i], [data-minimap], [aria-label*="map" i], [aria-label*="radar" i], [title*="map" i], [title*="radar" i], .minimap-container, .minimap, .radar, canvas'))
          .map(el => ({
            el,
            r: el.getBoundingClientRect(),
            label: [
              el.getAttribute('data-game-control'),
              el.getAttribute('data-minimap'),
              el.getAttribute('aria-label'),
              el.getAttribute('title'),
              el.getAttribute('data-testid'),
              el.className,
              el.id,
              el.textContent
            ].filter(Boolean).join(' ').toLowerCase(),
            control: el.matches('button, [role="button"], [data-game-control], [data-minimap]')
          }))
          .filter(x => x.r.width > 20 && x.r.height > 20 && /mini|map|radar/.test(x.label))
          .sort((a,b) => {
            const am = (a.control ? 100 : 0) + (/toggle|zoom|expand|collapse|btn/.test(a.label) ? 10 : 0);
            const bm = (b.control ? 100 : 0) + (/toggle|zoom|expand|collapse|btn/.test(b.label) ? 10 : 0);
            return bm - am || (a.r.width * a.r.height) - (b.r.width * b.r.height);
          });
        const c = candidates[0];
        if (!c) return null;
        return { x: c.r.left + c.r.width / 2, y: c.r.top + c.r.height / 2, label: c.label };
      })()
    `);
  }

  async function clickMinimap() {
    const point = await findMinimapPoint();
    if (!point) return null;
    await browser.mouseClick(point.x, point.y);
    await sleep(250);
    return point;
  }

  return {
    hasApi, snapshot, reset, loadScenario, contractInput, waitForReady,
    playfieldBounds, realKey, realMouseHold, realTouchDrag, findTouchControlPoint, setTouchContext,
    findSemanticControl, findPowerShortcut, findCameraControl, findCameraKey, useCameraInput, clickSemanticControl, visibleHudText,
    screenshotStats, findMinimapPoint, clickMinimap
  };
}

const checks = [
  {
    id: 'p0-boot-contract',
    level: 'P0',
    name: 'Boot exposes playable snapshot or readable playfield',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const snap = await game.waitForReady();
      if (ctx.browser.exceptions.length) return FAIL(`runtime exceptions: ${ctx.browser.exceptions.slice(0, 2).map(e => e.text || e.description).join('; ')}`);
      const pf = snap.playfield && snap.playfield.bounds;
      if (!pf || pf.width < 100 || pf.height < 100) return FAIL('no stable visible playfield bounds');
      if (!snap.phase && !snap.screen) return FAIL('snapshot/playfield lacks phase or screen readiness');
      return PASS(`ready phase=${snap.phase || snap.screen}, playfield=${Math.round(pf.width)}x${Math.round(pf.height)}`);
    }
  },
  {
    id: 'p0-visible-3d-playfield',
    level: 'P0',
    name: 'Visible 3D playfield is not blank',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const size = await ctx.browser.getCanvasSize();
      if (!size || size.cssW < 100 || size.cssH < 100) return FAIL('no visible canvas-sized playfield');
      const h1 = await ctx.browser.canvasPixelHash();
      await sleep(250);
      const h2 = await ctx.browser.canvasPixelHash();
      if (h1 === null || h2 === null) return FAIL('unable to capture rendered playfield');
      const snap = await game.snapshot();
      if (snap.playfield && snap.playfield.readable3D === false) return FAIL('snapshot marks 3D scene unreadable');
      const stats = await game.screenshotStats();
      if (!stats || stats.samples < 100) return FAIL('unable to inspect screenshot pixel diversity');
      if (stats.uniqueColors < 12 || stats.lumaRange < 25 || stats.dominantRatio > 0.98) {
        return FAIL(`render too blank/simple: unique=${stats.uniqueColors}, lumaRange=${stats.lumaRange}, dominant=${stats.dominantRatio.toFixed(3)}`);
      }
      return PASS(`canvas ${size.cssW}x${size.cssH}, unique=${stats.uniqueColors}, lumaRange=${stats.lumaRange}`);
    }
  },
  {
    id: 'p1-ui-overlay-not-blocking-playing',
    level: 'P1',
    name: 'Playing state has no blocking overlay on playfield',
    timeoutMs: 10000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.waitForReady();
      if (before.panels && before.panels.active && before.panels.active !== 'none') {
        await game.clickSemanticControl(['close', 'continue', 'start', 'play', 'resume', 'got it', 'okay', 'ok', 'dismiss', 'tutorial']);
      }
      const after = await game.snapshot();
      if (after.phase !== 'playing' && after.screen !== 'play') return FAIL(`not in playable phase: ${after.phase || after.screen}`);
      if (after.overlayBlocking || after.canInteractWithPlayfield === false) return FAIL('overlay blocks playfield while playing');
      const pf = after.playfield && after.playfield.bounds;
      if (!pf || pf.width < 100 || pf.height < 100) return FAIL('playfield not interactable');
      return PASS('playing state exposes unblocked playfield');
    }
  },
  {
    id: 'p1-real-key-left-right-screen-direction',
    level: 'P1',
    name: 'Real keyboard left and right inputs move in opposite screen directions',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.reset({ phase: 'playing' });
      await game.loadScenario('openStreet');
      const s0 = await game.snapshot();
      await game.realKey('ArrowRight', 450);
      const s1 = await game.snapshot();
      await game.realKey('ArrowLeft', 450);
      const s2 = await game.snapshot();
      const rightDelta = num(s1.player && s1.player.screenX) - num(s0.player && s0.player.screenX);
      const leftDelta = num(s2.player && s2.player.screenX) - num(s1.player && s1.player.screenX);
      const minVisibleDelta = 0.1;
      const opposite = (a, b) => finiteNumber(a) && finiteNumber(b) &&
        Math.abs(a) > minVisibleDelta && Math.abs(b) > minVisibleDelta && Math.sign(a) !== Math.sign(b);
      const facing0 = s0.player && s0.player.facingScreenX;
      const facing1 = s1.player && s1.player.facingScreenX;
      const facing2 = s2.player && s2.player.facingScreenX;
      const facingRightDelta = finiteNumber(facing0) && finiteNumber(facing1) ? facing1 - facing0 : null;
      const facingLeftDelta = finiteNumber(facing1) && finiteNumber(facing2) ? facing2 - facing1 : null;
      const render0 = num(s0.playfield && s0.playfield.renderRevision);
      const render1 = num(s1.playfield && s1.playfield.renderRevision);
      const render2 = num(s2.playfield && s2.playfield.renderRevision);
      const screenDirectionValid = opposite(rightDelta, leftDelta);
      const facingDirectionValid = opposite(facingRightDelta, facingLeftDelta);
      if ((!screenDirectionValid && !facingDirectionValid) || render1 === render0 || render2 === render1) {
        return FAIL(`visible direction not opposite or render did not advance: screen right=${rightDelta}, left=${leftDelta}, facing right=${facingRightDelta}, left=${facingLeftDelta}, render=${render0}->${render1}->${render2}`);
      }
      const totalBefore = num(s0.hud && s0.hud.score);
      const totalAfter = num(s2.hud && s2.hud.score);
      if (totalBefore !== totalAfter) return FAIL(`movement changed score invariant: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      const healthBefore = num(s0.player && s0.player.health);
      const healthAfter = num(s2.player && s2.player.health);
      if (healthBefore !== healthAfter) return FAIL(`movement changed health invariant: healthBefore=${healthBefore}, healthAfter=${healthAfter}`);
      return PASS(`opposite visible direction screen right=${rightDelta.toFixed(2)}, left=${leftDelta.toFixed(2)}, facing right=${facingRightDelta}, left=${facingLeftDelta}`);
    }
  },
  {
    id: 'p1-real-touch-joystick-direction',
    level: 'P1',
    name: 'Real touch joystick drag changes player state',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      try {
        await game.setTouchContext(true);
        const runDrag = async direction => {
          await game.reset({ phase: 'playing' });
          await game.loadScenario('openStreet');
          const bounds = await game.playfieldBounds();
          if (!bounds) return null;
          const control = await game.findTouchControlPoint();
          const from = control
            ? { x: control.x, y: control.y }
            : { x: bounds.left + bounds.width * 0.25, y: bounds.top + bounds.height * 0.70 };
          const span = control
            ? Math.max(24, Math.min(control.width, control.height) * 0.32)
            : Math.min(90, bounds.width * 0.14);
          const to = { x: from.x + direction * span, y: from.y };
          const before = await game.snapshot();
          const drag = await game.realTouchDrag(from, to, 450);
          const during = drag && drag.during || {};
          const after = drag && drag.after || {};
          return {
            screenDelta: num(during.player && during.player.screenX) - num(before.player && before.player.screenX),
            terminalScreenDelta: num(after.player && after.player.screenX) - num(before.player && before.player.screenX),
            facingDelta: num(during.player && during.player.facingScreenX) - num(before.player && before.player.facingScreenX),
            terminalFacingDelta: num(after.player && after.player.facingScreenX) - num(before.player && before.player.facingScreenX),
            renderDelta: num(after.playfield && after.playfield.renderRevision) - num(before.playfield && before.playfield.renderRevision)
          };
        };
        const rightDelta = await runDrag(1);
        const leftDelta = await runDrag(-1);
        if (rightDelta === null || leftDelta === null) return FAIL('no playfield bounds for touch input');
        const selectPair = (a, b, minimum) => {
          if (Math.abs(a) < minimum || Math.abs(b) < minimum || Math.sign(a) === Math.sign(b)) return null;
          return [a, b];
        };
        const selected = selectPair(rightDelta.screenDelta, leftDelta.screenDelta, 0.5)
          || selectPair(rightDelta.terminalScreenDelta, leftDelta.terminalScreenDelta, 0.5)
          || selectPair(rightDelta.facingDelta, leftDelta.facingDelta, 0.05)
          || selectPair(rightDelta.terminalFacingDelta, leftDelta.terminalFacingDelta, 0.05);
        if (!selected) return FAIL(`touch visible direction evidence too small or not opposite: activeScreen=${rightDelta.screenDelta},${leftDelta.screenDelta}, terminalScreen=${rightDelta.terminalScreenDelta},${leftDelta.terminalScreenDelta}, activeFacing=${rightDelta.facingDelta},${leftDelta.facingDelta}, terminalFacing=${rightDelta.terminalFacingDelta},${leftDelta.terminalFacingDelta}`);
        if (rightDelta.renderDelta <= 0 || leftDelta.renderDelta <= 0) return FAIL(`touch render revision did not change: right=${rightDelta.renderDelta}, left=${leftDelta.renderDelta}`);
        return PASS(`touch opposite visible deltas right=${selected[0].toFixed(2)}, left=${selected[1].toFixed(2)}`);
      } finally {
        await game.setTouchContext(false);
      }
    }
  },
  {
    id: 'p1-real-key-flight-throttle-up-down',
    level: 'P1',
    name: 'Real keyboard flight throttle raises and lowers altitude',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const measure = async ascendCode => {
        await game.reset({ phase: 'playing' });
        await game.loadScenario('openStreet');
        const s0 = await game.snapshot();
        await game.realKey(ascendCode, 800);
        const s1 = await game.snapshot();
        await game.realKey('ControlLeft', 1000);
        const s2 = await game.snapshot();
        return {
          s0,
          s1,
          s2,
          upDelta: num(s1.player && s1.player.altitude) - num(s0.player && s0.player.altitude),
          downDelta: num(s2.player && s2.player.altitude) - num(s1.player && s1.player.altitude)
        };
      };
      let trajectory = await measure('ShiftLeft');
      if (trajectory.upDelta <= 0.5 && trajectory.s1.mode !== 'flying') trajectory = await measure('ShiftRight');
      if (trajectory.upDelta <= 0.5 && trajectory.s1.mode !== 'flying') trajectory = await measure('Space');
      const { s1, s2, upDelta, downDelta } = trajectory;
      if (upDelta <= 0.5 && s1.mode !== 'flying') return FAIL(`throttle up did not raise altitude or enter flying: ${upDelta}`);
      if (downDelta >= -0.2 && num(s1.player && s1.player.altitude) > 1) return FAIL(`throttle down did not lower altitude: ${downDelta}`);
      if (num(s2.player && s2.player.altitude) < -0.1) return FAIL('altitude became negative');
      return PASS(`altitude up=${upDelta.toFixed(2)}, down=${downDelta.toFixed(2)}`);
    }
  },
  {
    id: 'p1-real-mouse-power-release-visible',
    level: 'P1',
    name: 'Real mouse power button creates visible effect and stops on release',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const prepare = async () => {
        await game.reset({ phase: 'playing' });
        await game.loadScenario('targetAhead');
      };
      let selection = null;
      await prepare();
      const explicitControls = await game.findSemanticControl(['frost', 'power:frost', 'ice'], { all: true });
      for (const control of explicitControls || []) {
        if (control.disabled) continue;
        await ctx.browser.mouseClick(control.x, control.y);
        await sleep(250);
        const probe = await game.snapshot();
        if (probe.powers && probe.powers.current === 'frost') {
          selection = { switchControl: control, before: probe };
          break;
        }
      }
      if (!selection) {
        await prepare();
        const cycleControls = await game.findSemanticControl(
          ['power switch', 'power-switch', 'switch power', 'power cycle', 'power-cycle', 'cycle power', 'cycle'],
          { all: true }
        );
        for (const control of cycleControls || []) {
          if (control.disabled) continue;
          for (let attempt = 0; attempt < 4; attempt++) {
            await ctx.browser.mouseClick(control.x, control.y);
            await sleep(250);
            const probe = await game.snapshot();
            if (probe.powers && probe.powers.current === 'frost') {
              selection = { switchControl: control, before: probe };
              break;
            }
          }
          if (selection) break;
        }
      }
      if (!selection) {
        await prepare();
        const powerKey = await game.findPowerShortcut();
        if (powerKey) {
          await game.realKey(powerKey, 180);
          const probe = await game.snapshot();
          if (probe.powers && probe.powers.current === 'frost') selection = { switchControl: null, before: probe };
        }
      }
      if (!selection) return FAIL('no contract-valid power switch path');
      const { switchControl, before } = selection;
      const bounds = await game.playfieldBounds();
      if (!bounds) return FAIL('no playfield bounds for power input');
      const h0 = await ctx.browser.canvasPixelHash();
      const targetCandidates = await game.findSemanticControl(
        ['ability', 'poweruse', 'power-use', 'use power', 'hold power', 'powerbtn', 'power-btn', 'btnpower', 'btn-power', 'pwr'],
        { all: true }
      );
      const target = (targetCandidates || []).find(candidate => !candidate.disabled) ||
        (switchControl && /\b(?:power|pow|frost|ability)\b/i.test(switchControl.label || '') ? switchControl : null);
      if (!target) return FAIL('no visible semantic ability/power control for mouse hold');
      await game.realMouseHold(target.x, target.y, 700);
      const active = await game.snapshot();
      const h1 = await ctx.browser.canvasPixelHash();
      await sleep(500);
      const after = await game.snapshot();
      const affectedBefore = before.powers && before.powers.affectedCounts ? Object.values(before.powers.affectedCounts).reduce((a, b) => a + num(b), 0) : 0;
      const affectedAfter = active.powers && active.powers.affectedCounts ? Object.values(active.powers.affectedCounts).reduce((a, b) => a + num(b), 0) : 0;
      const visible = !!(active.powers && (active.powers.effectVisible || active.powers.active));
      const canvasChanged = h0 !== h1;
      const scoreBefore = num(before.hud && before.hud.score);
      const scoreAfter = num(active.hud && active.hud.score);
      const reputationBefore = num(before.hud && before.hud.reputation);
      const reputationAfter = num(active.hud && active.hud.reputation);
      const wantedBefore = num(before.hud && before.hud.wanted);
      const wantedAfter = num(active.hud && active.hud.wanted);
      const consequence =
        affectedAfter > affectedBefore ||
        scoreAfter !== scoreBefore ||
        reputationAfter !== reputationBefore ||
        wantedAfter !== wantedBefore ||
        num(active.quest && active.quest.progress) !== num(before.quest && before.quest.progress);
      if (!visible && !canvasChanged) return FAIL('power input produced no visible effect');
      if (!consequence) return FAIL(`power input produced no target consequence: affected ${affectedBefore}->${affectedAfter}`);
      if (after.powers && after.powers.active === true) return FAIL('power remained active after mouse release');
      return PASS(`power visible=${visible}, affected ${affectedBefore}->${affectedAfter}`);
    }
  },
  {
    id: 'p1-real-key-vehicle-enter-drive-exit',
    level: 'P1',
    name: 'Real keyboard vehicle enter drive and exit loop',
    timeoutMs: 18000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.reset({ phase: 'playing' });
      const setup = await game.loadScenario('nearVehicle');
      if (setup.mode === 'driving' || (setup.vehicle && setup.vehicle.inVehicle)) return FAIL('nearVehicle scenario must not start already driving');

      const normalizeKey = value => {
        const raw = String(value || '').trim();
        if (/^(Enter|Return)$/i.test(raw)) return 'Enter';
        if (/^Key[A-Za-z]$/i.test(raw)) return raw.replace(/^Key([a-z])$/i, (_, char) => 'Key' + char.toUpperCase());
        if (/^[A-Za-z]$/.test(raw)) return 'Key' + raw.toUpperCase();
        return null;
      };

      const findVehicleKey = async (direction, snapshot) => {
        const controls = snapshot && snapshot.panels && Array.isArray(snapshot.panels.visibleControls)
          ? snapshot.panels.visibleControls
          : [];
        const text = controls.concat(await game.visibleHudText()).filter(Boolean).join('\n');
        const semantic = direction === 'exit'
          ? /\b(?:exit|leave|out)\b/i
          : /\b(?:enter|vehicle|car|drive|interact|use|action)\b/i;
        for (const line of text.split(/\n+/)) {
          const semanticMatch = semantic.exec(line);
          if (!semanticMatch) continue;
          const explicit = line.match(/(?:press|key|shortcut|hotkey)\s*[:=]?\s*(Enter|Return|Key[A-Za-z]|[A-Za-z])\b/i);
          const bracketed = line.match(/[\[(]\s*(Enter|Return|Key[A-Za-z]|[A-Za-z])\s*[\])]/i);
          const directional = line.match(/\b([A-Za-z])\b\s*(?:to|[-:])\s*(?:enter|exit|leave|vehicle|car|drive|interact|use|action)\b/i);
          const labelled = line.match(/\b(?:enter|exit|leave)\s+(?:the\s+)?(?:vehicle|car)\b\s*[:=-]?\s*(Enter|Return|Key[A-Za-z]|[A-Za-z])\b/i);
          const keyMatch = explicit || bracketed || directional || labelled;
          const key = keyMatch && normalizeKey(keyMatch[1]);
          if (key) return key;
          if (/\b(?:press|key|shortcut|hotkey)\s*(?:enter|return)\b/i.test(line)) return 'Enter';
          if (semanticMatch[0].toLowerCase() === 'enter' && /^\s*(?:enter|return)\b/i.test(line)) return 'Enter';
        }
        return null;
      };

      const useVehicleInput = async (direction, snapshot, fallbackKey = null) => {
        const targetReached = probe => direction === 'enter'
          ? probe.mode === 'driving' || !!(probe.vehicle && probe.vehicle.inVehicle)
          : probe.mode !== 'driving' && !(probe.vehicle && probe.vehicle.inVehicle);
        const specificNames = direction === 'exit'
          ? ['vehicleexit', 'exit vehicle', 'exit car', 'leave vehicle', 'exit']
          : ['vehicleenter', 'enter vehicle', 'enter car', 'vehicle', 'car'];
        const specificControls = await game.findSemanticControl(specificNames, { all: true });
        for (const control of specificControls || []) {
          if (control.disabled) continue;
          await ctx.browser.mouseClick(control.x, control.y);
          await sleep(250);
          const probe = await game.snapshot();
          if (targetReached(probe)) return { kind: 'pointer', label: control.label };
        }

        const key = await findVehicleKey(direction, snapshot) || fallbackKey;
        if (key) {
          await game.realKey(key, 250);
          const probe = await game.snapshot();
          if (targetReached(probe)) return { kind: 'key', key };
        }

        const genericControls = await game.findSemanticControl(['interact', 'action', 'use'], { all: true });
        for (const control of genericControls || []) {
          if (control.disabled) continue;
          await ctx.browser.mouseClick(control.x, control.y);
          await sleep(250);
          const probe = await game.snapshot();
          if (targetReached(probe)) return { kind: 'pointer', label: control.label };
        }
        return null;
      };

      const entryInput = await useVehicleInput('enter', setup);
      if (!entryInput) return FAIL('no real vehicle-entry control or key was discoverable');
      const entered = await game.snapshot();
      if (entered.mode !== 'driving' && !(entered.vehicle && entered.vehicle.inVehicle)) return FAIL('real vehicle interaction did not enter driving mode');
      const v0x = entered.vehicle && entered.vehicle.screenX;
      await game.realKey('ArrowUp', 600);
      await game.realKey('ArrowLeft', 350);
      const driven = await game.snapshot();
      const speedChanged = changed(entered.vehicle && entered.vehicle.speed, driven.vehicle && driven.vehicle.speed, 0.1);
      const screenChanged = changed(v0x, driven.vehicle && driven.vehicle.screenX, 0.5);
      if (!speedChanged && !screenChanged) return FAIL('driving inputs did not move or accelerate vehicle');
      const exitInput = await useVehicleInput('exit', driven, entryInput.kind === 'key' ? entryInput.key : null);
      if (!exitInput) return FAIL('no real vehicle-exit control or key was discoverable');
      const exited = await game.snapshot();
      if (exited.mode === 'driving' || (exited.vehicle && exited.vehicle.inVehicle)) return FAIL('exit input did not return to walking');
      return PASS('vehicle enter, drive, and exit loop completed');
    }
  },
  {
    id: 'p1-contract-quest-loop-reward',
    level: 'P1',
    name: 'Contract quest loop requires player action before reward',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const setup = await game.loadScenario('questReady');
      if (setup.quest && setup.quest.status === 'complete') return FAIL('questReady scenario already complete');
      const scoreBefore = num(setup.hud && setup.hud.score);
      const repBefore = num(setup.hud && setup.hud.reputation);
      await game.contractInput({ type: 'questAction', action: 'accept', target: 'current' });
      const afterAction = await game.contractInput({ type: 'questAction', action: 'performObjective', target: 'marked' });
      const scoreAfter = num(afterAction.hud && afterAction.hud.score);
      const repAfter = num(afterAction.hud && afterAction.hud.reputation);
      const progressed = afterAction.quest && (afterAction.quest.progress > num(setup.quest && setup.quest.progress) || afterAction.quest.status === 'complete');
      if (!progressed) return FAIL('quest action did not progress or complete quest');
      if (scoreAfter <= scoreBefore && repAfter <= repBefore) return FAIL('quest completion did not increase score or reputation');
      return PASS(`quest progressed with score ${scoreBefore}->${scoreAfter}, rep ${repBefore}->${repAfter}`);
    }
  },
  {
    id: 'p1-contract-death-restart-state',
    level: 'P1',
    name: 'Contract death locks input and restart restores play',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const setup = await game.loadScenario('lowHealth');
      const scoreBefore = num(setup.hud && setup.hud.score);
      const dead = await game.contractInput({ type: 'hazard', kind: 'explosion', severity: 'fatal' });
      if (dead.phase !== 'result' || dead.mode !== 'dead') return FAIL('fatal damage did not enter result/dead state');
      if (dead.overlayBlocking !== true || dead.canInteractWithPlayfield !== false) return FAIL('death result did not block playfield');
      const attempted = await game.contractInput({ type: 'pointer', target: 'ability', event: 'tap' });
      const terminalRejected = attempted.ok === false || !!(attempted.lastRejected && attempted.lastRejected.reason);
      const unchanged =
        num(attempted.hud && attempted.hud.score) === scoreBefore &&
        attempted.phase === dead.phase &&
        attempted.mode === dead.mode &&
        num(attempted.player && attempted.player.health) === num(dead.player && dead.player.health);
      if (!terminalRejected) return FAIL('terminal state accepted ability action');
      if (!unchanged) return FAIL('terminal state allowed score-changing action');
      const restarted = await game.contractInput({ type: 'restart' });
      if (restarted.phase !== 'playing' || restarted.mode === 'dead' || restarted.screen !== 'play') return FAIL('restart did not restore playing state');
      if (restarted.overlayBlocking !== false || restarted.canInteractWithPlayfield !== true ||
          (restarted.panels && restarted.panels.active !== 'none')) {
        return FAIL('restart left terminal overlay blocking play');
      }
      if (num(restarted.player && restarted.player.health) <= 0) return FAIL('restart did not restore health');
      return PASS('death lock and restart cleanup observed');
    }
  },
  {
    id: 'p2-contract-timed-quest-countdown-failure',
    level: 'P2',
    name: 'Contract timed quest countdown decreases and can fail without success reward',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      let setup = await game.loadScenario('timedQuestReady');
      if (setup.quest && setup.quest.status === 'complete') return FAIL('timedQuestReady scenario already complete');
      if (!setup.quest || setup.quest.active !== true || setup.quest.status !== 'active') {
        const started = await game.contractInput({ type: 'questAction', action: 'accept', target: 'current' });
        if (!started.quest || started.quest.active !== true || started.quest.status !== 'active') return FAIL('timed quest prerequisite could not be started');
        setup = started;
      }
      if (setup.quest && setup.quest.status === 'complete') return FAIL('timedQuestReady scenario already complete');
      const startTime = setup.quest && setup.quest.timeRemaining;
      if (!finiteNumber(startTime) || startTime <= 0) return FAIL('timed quest lacks positive timeRemaining');
      const scoreBefore = setup.hud && setup.hud.score;
      if (!finiteNumber(scoreBefore)) return FAIL('timed quest setup lacks numeric score');
      const waited = await game.contractInput({ type: 'questAction', action: 'waitForTimer', target: 'current' });
      const afterTime = waited.quest && waited.quest.timeRemaining;
      if (!finiteNumber(afterTime) || afterTime >= startTime) return FAIL(`timer did not decrease: ${startTime}->${afterTime}`);
      const failed = await game.contractInput({ type: 'hazard', kind: 'questFailure', severity: 'light' });
      if (!failed.quest || failed.quest.status !== 'failed') return FAIL(`timed failure not visible in failed quest state: ${failed.quest && failed.quest.status}`);
      const scoreAfter = failed.hud && failed.hud.score;
      if (!finiteNumber(scoreAfter) || scoreAfter > scoreBefore) return FAIL('failed timed quest awarded success score or omitted numeric score');
      return PASS(`timer ${startTime}->${afterTime}, failure=${failed.quest && failed.quest.status}`);
    }
  },
  {
    id: 'p2-real-click-shop-purchase',
    level: 'P2',
    name: 'Real click shop purchase changes economy and visible panel state',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.reset({ phase: 'playing' });
      await game.loadScenario('shopWithFunds');
      const opener = await game.clickSemanticControl(['shop', 'vendor', 'store', 'interact', 'enter shop']);
      if (!opener) return FAIL('no visible shop interaction control discovered');
      const before = await game.snapshot();
      const cashBefore = num((before.economy && before.economy.cash) ?? (before.hud && before.hud.cash));
      const invBefore = num(before.economy && before.economy.inventoryCount);
      const healthBefore = num(before.player && before.player.health);
      const ownedBefore = ((before.weapons && before.weapons.owned) || []).length;
      const ammoBefore = before.weapons && before.weapons.ammo ? Object.values(before.weapons.ammo).reduce((sum, slot) => sum + num(slot.current), 0) : 0;
      const candidates = await game.findSemanticControl(
        ['buy', 'purchase', 'health', 'ammo', 'price', 'cost', 'item', 'shopitem', 'shop-item', 'shop'],
        { all: true }
      );
      const clickable = (candidates || []).filter(candidate => !candidate.disabled);
      if (!clickable.length) return FAIL('no visible shop purchase control discovered');
      let after = before;
      let changed = false;
      for (const candidate of clickable) {
        await ctx.browser.mouseClick(candidate.x, candidate.y);
        await sleep(250);
        after = await game.snapshot();
        const cashAfter = num((after.economy && after.economy.cash) ?? (after.hud && after.hud.cash));
        const invAfter = num(after.economy && after.economy.inventoryCount);
        const healthAfter = num(after.player && after.player.health);
        const ownedAfter = ((after.weapons && after.weapons.owned) || []).length;
        const ammoAfter = after.weapons && after.weapons.ammo ? Object.values(after.weapons.ammo).reduce((sum, slot) => sum + num(slot.current), 0) : 0;
        changed = cashAfter < cashBefore || invAfter > invBefore || healthAfter > healthBefore ||
          ownedAfter > ownedBefore || ammoAfter > ammoBefore;
        if (changed) break;
      }
      const cashAfter = num((after.economy && after.economy.cash) ?? (after.hud && after.hud.cash));
      const invAfter = num(after.economy && after.economy.inventoryCount);
      const ammoAfter = after.weapons && after.weapons.ammo ? Object.values(after.weapons.ammo).reduce((sum, slot) => sum + num(slot.current), 0) : 0;
      if (!changed) {
        return FAIL(`purchase did not change cash/inventory/health: cash ${cashBefore}->${cashAfter}, inv ${invBefore}->${invAfter}`);
      }
      return PASS(`purchase changed economy cash ${cashBefore}->${cashAfter}, inventory ${invBefore}->${invAfter}, ammo ${ammoBefore}->${ammoAfter}`);
    }
  },
  {
    id: 'p2-contract-insufficient-funds-unchanged',
    level: 'P2',
    name: 'Contract insufficient funds purchase is rejected unchanged',
    timeoutMs: 10000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const before = await game.loadScenario('shopInsufficientFunds');
      const totalBefore = num(before.economy && before.economy.cash) + num(before.economy && before.economy.inventoryCount) + num(before.player && before.player.health);
      const result = await game.contractInput({ type: 'pointer', target: 'shopItem:expensive', event: 'tap' });
      const totalAfter = num(result.economy && result.economy.cash) + num(result.economy && result.economy.inventoryCount) + num(result.player && result.player.health);
      const rejected = result.ok === false || !!result.lastRejected || (result.lastRejected && result.lastRejected.reason);
      if (!rejected) return FAIL('insufficient funds action was not rejected');
      if (totalBefore !== totalAfter) return FAIL(`unchanged invariant failed: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      if (num(result.economy && result.economy.cash) < 0) return FAIL('cash became negative after rejected purchase');
      return PASS(`rejected purchase preserved totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
    }
  },
  {
    id: 'p2-contract-unavailable-ammo-refund',
    level: 'P2',
    name: 'Contract unavailable ammo or repeat item purchase is rejected or refunded',
    timeoutMs: 10000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const before = await game.loadScenario('shopUnavailableAmmo');
      const cashBefore = num((before.economy && before.economy.cash) ?? (before.hud && before.hud.cash));
      const invBefore = num(before.economy && before.economy.inventoryCount);
      const ownedBefore = JSON.stringify((before.weapons && before.weapons.owned) || []);
      const ammoBefore = JSON.stringify((before.weapons && before.weapons.ammo) || {});
      const result = await game.contractInput({ type: 'pointer', target: 'shopItem:unavailableAmmo', event: 'tap' });
      const cashAfter = num((result.economy && result.economy.cash) ?? (result.hud && result.hud.cash));
      const invAfter = num(result.economy && result.economy.inventoryCount);
      const ownedAfter = JSON.stringify((result.weapons && result.weapons.owned) || []);
      const ammoAfter = JSON.stringify((result.weapons && result.weapons.ammo) || {});
      const rejectedOrRefunded = result.ok === false || !!result.lastRejected || !!(result.weapons && result.weapons.lastRefunded) || cashAfter === cashBefore;
      if (!rejectedOrRefunded) return FAIL('unavailable ammo/repeat item purchase was silently accepted without refund evidence');
      if (cashAfter < 0) return FAIL('cash became negative after unavailable purchase');
      if (cashAfter < cashBefore && invAfter === invBefore && ownedAfter === ownedBefore && ammoAfter === ammoBefore) {
        return FAIL(`cash was lost without inventory/weapon/ammo effect or refund: ${cashBefore}->${cashAfter}`);
      }
      const ammo = result.weapons && result.weapons.ammo ? Object.values(result.weapons.ammo) : [];
      const overfilled = ammo.some(slot => finiteNumber(slot.current) && finiteNumber(slot.max) && slot.current > slot.max);
      if (overfilled) return FAIL('ammo exceeded declared max after rejected/refunded purchase');
      return PASS(`unavailable purchase preserved valid economy cash ${cashBefore}->${cashAfter}`);
    }
  },
  {
    id: 'p2-contract-pickup-resource-loop',
    level: 'P2',
    name: 'Contract pickup action changes resource or quest progress with pickup evidence',
    timeoutMs: 10000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const before = await game.loadScenario('pickupReady');
      const pickupCountBefore =
        num(before.pickups && before.pickups.cash) +
        num(before.pickups && before.pickups.ammo) +
        num(before.pickups && before.pickups.questItems);
      const cashBefore = num((before.economy && before.economy.cash) ?? (before.hud && before.hud.cash));
      const invBefore = num(before.economy && before.economy.inventoryCount);
      const questBefore = num(before.quest && before.quest.progress);
      const after = await game.contractInput({ type: 'pickup', kind: 'cash' });
      const cashAfter = num((after.economy && after.economy.cash) ?? (after.hud && after.hud.cash));
      const invAfter = num(after.economy && after.economy.inventoryCount);
      const questAfter = num(after.quest && after.quest.progress);
      const pickupCountAfter =
        num(after.pickups && after.pickups.cash) +
        num(after.pickups && after.pickups.ammo) +
        num(after.pickups && after.pickups.questItems);
      const gained = cashAfter > cashBefore || invAfter > invBefore || questAfter > questBefore;
      const pickupEvidence = (after.pickups && after.pickups.lastCollected && after.pickups.lastCollected !== 'none') || pickupCountAfter < pickupCountBefore;
      if (!gained) return FAIL(`pickup did not increase cash/inventory/quest: cash ${cashBefore}->${cashAfter}, inv ${invBefore}->${invAfter}, quest ${questBefore}->${questAfter}`);
      if (!pickupEvidence) return FAIL('pickup result lacked lastCollected or pickup count decrease evidence');
      return PASS(`pickup changed cash ${cashBefore}->${cashAfter}, inv ${invBefore}->${invAfter}, quest ${questBefore}->${questAfter}`);
    }
  },
  {
    id: 'p2-contract-wanted-pickup-boundary',
    level: 'P2',
    name: 'Contract wanted reducer pickup lowers wanted and clamps at zero',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const wantedBefore = await game.loadScenario('wantedPickupReady', { wanted: 2 });
      const startWanted = num(wantedBefore.hud && wantedBefore.hud.wanted);
      const cashBefore = num((wantedBefore.economy && wantedBefore.economy.cash) ?? (wantedBefore.hud && wantedBefore.hud.cash));
      if (startWanted <= 0) return FAIL('wantedPickupReady must start with wanted risk');
      const reduced = await game.contractInput({ type: 'pickup', kind: 'wantedReducer' });
      const wantedAfter = num(reduced.hud && reduced.hud.wanted);
      const cashAfter = num((reduced.economy && reduced.economy.cash) ?? (reduced.hud && reduced.hud.cash));
      if (!(wantedAfter < startWanted)) return FAIL(`wanted reducer did not lower wanted: ${startWanted}->${wantedAfter}`);
      if (wantedAfter < 0) return FAIL('wanted became negative after reducer pickup');
      if (cashAfter !== cashBefore) return FAIL(`wanted reducer changed unrelated cash: ${cashBefore}->${cashAfter}`);
      const zeroSetup = await game.loadScenario('wantedPickupReady', { wanted: 0 });
      const zeroBefore = num(zeroSetup.hud && zeroSetup.hud.wanted);
      const zeroResult = await game.contractInput({ type: 'pickup', kind: 'wantedReducer' });
      const zeroAfter = num(zeroResult.hud && zeroResult.hud.wanted);
      const rejectedOrClamped = zeroAfter === 0 || zeroResult.ok === false || !!zeroResult.lastRejected;
      if (zeroBefore !== 0 || !rejectedOrClamped) return FAIL(`zero-wanted reducer was not clamped/rejected: ${zeroBefore}->${zeroAfter}`);
      return PASS(`wanted lowered ${startWanted}->${wantedAfter} and zero case stayed ${zeroAfter}`);
    }
  },
  {
    id: 'p2-contract-weapon-fire-ammo-loop',
    level: 'P2',
    name: 'Contract weapon fire consumes ammo and empty weapon is bounded',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const before = await game.loadScenario('weaponReady');
      const ammoBefore = before.weapons && before.weapons.ammo ? Object.values(before.weapons.ammo).reduce((sum, slot) => sum + num(slot.current), 0) : 0;
      if (!(ammoBefore > 0)) return FAIL('weaponReady must expose positive ammo');
      const projectilesBefore = num(before.entities && before.entities.projectiles);
      const particlesBefore = num(before.entities && before.entities.particles);
      const firedBefore = num(before.weapons && before.weapons.firedCount);
      const hitBefore = num(before.weapons && before.weapons.hitCount);
      const scoreBefore = num(before.hud && before.hud.score);
      const wantedBefore = num(before.hud && before.hud.wanted);
      const fired = await game.contractInput({ type: 'weapon', action: 'fire', target: 'front' });
      const ammoAfter = fired.weapons && fired.weapons.ammo ? Object.values(fired.weapons.ammo).reduce((sum, slot) => sum + num(slot.current), 0) : 0;
      const projectilesAfter = num(fired.entities && fired.entities.projectiles);
      const particlesAfter = num(fired.entities && fired.entities.particles);
      const firedAfter = num(fired.weapons && fired.weapons.firedCount);
      const hitAfter = num(fired.weapons && fired.weapons.hitCount);
      const scoreAfter = num(fired.hud && fired.hud.score);
      const wantedAfter = num(fired.hud && fired.hud.wanted);
      const visibleFire =
        projectilesAfter > projectilesBefore ||
        particlesAfter > particlesBefore ||
        firedAfter > firedBefore ||
        !!(fired.weapons && fired.weapons.lastFired);
      const consequence =
        hitAfter > hitBefore ||
        scoreAfter !== scoreBefore ||
        wantedAfter !== wantedBefore ||
        num(fired.reputation) !== num(before.reputation);
      if (!(ammoAfter < ammoBefore)) return FAIL(`weapon fire did not consume ammo: ${ammoBefore}->${ammoAfter}`);
      if (!visibleFire) return FAIL('weapon fire lacked projectile/particle/fired evidence');
      if (!consequence && projectilesAfter <= projectilesBefore) return FAIL('weapon fire lacked hit or persistent projectile consequence');
      await game.loadScenario('weaponEmpty');
      const emptyBefore = await game.snapshot();
      const emptyAmmoBefore = emptyBefore.weapons && emptyBefore.weapons.ammo ? Object.values(emptyBefore.weapons.ammo).reduce((sum, slot) => sum + num(slot.current), 0) : 0;
      const emptyProjectilesBefore = num(emptyBefore.entities && emptyBefore.entities.projectiles);
      const empty = await game.contractInput({ type: 'weapon', action: 'fire', target: 'front' });
      const emptyAmmoAfter = empty.weapons && empty.weapons.ammo ? Object.values(empty.weapons.ammo).reduce((sum, slot) => sum + num(slot.current), 0) : 0;
      const emptyProjectilesAfter = num(empty.entities && empty.entities.projectiles);
      const rejectedOrEmpty = empty.ok === false || !!empty.lastRejected || !!(empty.weapons && empty.weapons.lastEmpty) || emptyAmmoAfter === emptyAmmoBefore;
      if (emptyAmmoBefore !== 0) return FAIL(`weaponEmpty must start with zero ammo, got ${emptyAmmoBefore}`);
      if (emptyAmmoAfter < 0) return FAIL('empty weapon fire made ammo negative');
      if (!rejectedOrEmpty) return FAIL('empty weapon fire was not rejected or marked empty');
      if (emptyProjectilesAfter > emptyProjectilesBefore) return FAIL('empty weapon fire generated an effective projectile');
      return PASS(`weapon fire ammo ${ammoBefore}->${ammoAfter}, empty ${emptyAmmoBefore}->${emptyAmmoAfter}`);
    }
  },
  {
    id: 'p2-contract-invalid-power-rejected',
    level: 'P2',
    name: 'Contract invalid power and terminal ability inputs are rejected',
    timeoutMs: 10000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const before = await game.snapshot();
      const invalid = await game.contractInput({ type: 'switchPower', power: 'unknown-power' });
      const samePower = (invalid.powers && invalid.powers.current) === (before.powers && before.powers.current);
      if (!(invalid.ok === false || invalid.lastRejected) || !samePower) return FAIL('invalid power was accepted or changed current power');
      await game.loadScenario('lowHealth');
      const dead = await game.contractInput({ type: 'hazard', kind: 'policeShot', severity: 'fatal' });
      const afterDead = await game.contractInput({ type: 'pointer', target: 'ability', event: 'tap' });
      const unchanged = num(afterDead.hud && afterDead.hud.score) === num(dead.hud && dead.hud.score);
      if (!unchanged) return FAIL('terminal ability input changed score');
      return PASS('invalid and terminal inputs rejected with unchanged state');
    }
  },
  {
    id: 'p2-real-click-minimap-toggle-markers',
    level: 'P2',
    name: 'Real click minimap toggle preserves markers and playfield access',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.reset({ phase: 'playing' });
      await game.loadScenario('questReady');
      const before = await game.snapshot();
      const clicked = await game.findMinimapPoint();
      const beforeExpanded = !!(before.minimap && before.minimap.expanded);
      let after = null;
      if (clicked) {
        await ctx.browser.mouseClick(clicked.x, clicked.y);
        await sleep(250);
        after = await game.snapshot();
      }
      let afterExpanded = !!(after && after.minimap && after.minimap.expanded);
      if (!after || !after.minimap || beforeExpanded === afterExpanded) {
        const semantic = await game.contractInput({ type: 'minimap', action: 'toggleZoom' });
        after = semantic && (semantic.snapshot || semantic.after || semantic) || await game.snapshot();
        afterExpanded = !!(after && after.minimap && after.minimap.expanded);
      }
      if (!after || !after.minimap || beforeExpanded === afterExpanded) return FAIL('minimap toggle was not discoverable through a visible control or public semantic action');
      const markers = after.minimap && after.minimap.markers;
      if (markers && markers.player === false) return FAIL('minimap lost player marker after toggle');
      const hasContextMarker = !markers || !!(markers.questTarget || markers.shop || markers.pickup || markers.vehicle);
      if (!hasContextMarker) return FAIL('minimap lacks quest/shop/pickup/vehicle marker evidence after toggle');
      if (after.phase === 'playing' && after.overlayBlocking && after.canInteractWithPlayfield === false) {
        return FAIL('minimap toggle left playing state permanently blocking playfield');
      }
      return PASS(`minimap toggled ${beforeExpanded}->${afterExpanded}, clicked=${!!clicked}`);
    }
  },
  {
    id: 'p2-hud-snapshot-sync',
    level: 'P2',
    name: 'HUD text synchronizes with score power or quest snapshot',
    timeoutMs: 10000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.reset({ phase: 'playing' });
      await game.loadScenario('questReady');
      const before = await game.visibleHudText();
      await game.contractInput({ type: 'switchPower', power: 'frost' });
      const snap = await game.snapshot();
      const after = await game.visibleHudText();
      const expectedValues = [
        snap.hud && snap.hud.score,
        snap.hud && snap.hud.reputation,
        snap.hud && snap.hud.cash,
        snap.powers && snap.powers.current,
        snap.quest && snap.quest.questTitle
      ].filter(v => v !== undefined && v !== null && String(v).length > 0).map(String);
      const observed = expectedValues.some(v => after.includes(v)) || before !== after;
      if (!observed) return FAIL('HUD text did not reflect snapshot score/reputation/cash/power/quest changes');
      return PASS('HUD and snapshot have synchronized visible evidence');
    }
  },
  {
    id: 'p2-world-motion-and-effects',
    level: 'P2',
    name: 'World entities or effects show live motion beyond a static scene',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.reset({ phase: 'playing' });
      const before = await game.loadScenario('openStreet');
      await sleep(900);
      const idle = await game.snapshot();
      const h0 = await ctx.browser.canvasPixelHash();
      await game.contractInput({ type: 'switchPower', power: 'breath' });
      await game.contractInput({ type: 'pointer', target: 'ability', event: 'down' });
      await sleep(500);
      await game.contractInput({ type: 'pointer', target: 'ability', event: 'up' });
      const after = await game.snapshot();
      const h1 = await ctx.browser.canvasPixelHash();
      const movingBefore = num(before.entities && before.entities.movingNpcs) + num(before.entities && before.entities.movingVehicles);
      const movingAfter = num(idle.entities && idle.entities.movingNpcs) + num(idle.entities && idle.entities.movingVehicles);
      const motionRevisionChanged = changed(before.entities && before.entities.worldMotionRevision, idle.entities && idle.entities.worldMotionRevision, 0);
      const affected = after.powers && after.powers.affectedCounts ? Object.values(after.powers.affectedCounts).reduce((a, b) => a + num(b), 0) : 0;
      const entityPositionEvidence = movingAfter > 0 || movingBefore > 0 || motionRevisionChanged;
      if (!entityPositionEvidence && affected <= 0) return FAIL('no live entity motion or ability effect counts observed');
      if (h0 === h1 && !motionRevisionChanged && affected <= 0) return FAIL('world action had no render, motion, or effect feedback');
      return PASS(`moving=${movingBefore}->${movingAfter}, affected=${affected}`);
    }
  },
  {
    id: 'p2-contract-camera-toggle-rejection',
    level: 'P2',
    name: 'Contract camera toggles in walking and rejects illegal driving toggle',
    timeoutMs: 10000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      if (!(await game.hasApi())) return FAIL('missing __gameTest contract');
      await game.reset({ phase: 'playing' });
      const before = await game.loadScenario('openStreet');
      const cameraPath = await game.useCameraInput(before);
      if (!cameraPath) return FAIL('no discoverable camera control or shortcut');
      const toggled = await game.snapshot();
      if ((toggled.camera && toggled.camera.mode) === (before.camera && before.camera.mode)) return FAIL('camera mode did not change in walking mode');
      await game.loadScenario('nearVehicle');
      await game.contractInput({ type: 'interact', kind: 'vehicle' });
      const driving = await game.snapshot();
      if (driving.mode !== 'driving') return FAIL('nearVehicle interaction did not enter driving mode');
      const drivingCameraPath = await game.useCameraInput(driving, cameraPath.key || null);
      if (!drivingCameraPath) return FAIL('no discoverable camera control or shortcut while driving');
      const rejected = await game.snapshot();
      const unchanged = (rejected.camera && rejected.camera.mode) === (driving.camera && driving.camera.mode);
      if (!unchanged && !(rejected.ok === false || rejected.lastRejected)) return FAIL('camera toggle was not rejected/unchanged while driving');
      return PASS('camera toggle works in walking and is rejected or unchanged while driving');
    }
  }
];

module.exports = { sleep, createGameDriver, suite: checks };
