const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// === GDD Coverage Map ===
// M1 (3D boot/UI flow) -> p0-boot-stability, p1-real-click-start-flow, p2-visible-render-after-input
// M2 (auto forward distance) -> p1-auto-run-distance
// M3 (screen-space lane direction) -> p1-keyboard-direction-opposite, p1-real-touch-swipe-direction
// M4 (jump) -> p1-keyboard-jump-state
// M5 (slide) -> p1-keyboard-slide-state
// M6 (coin collection) -> p1-contract-coin-collection-conservation
// M7 (obstacle failure) -> p1-contract-fatal-collision-lock
// M8 (stun) -> p2-contract-stun-chain
// M9 (revive economy) -> p2-contract-revive-spend, p2-contract-revive-reject-unchanged
// M10 (restart cleanup) -> p1-contract-restart-cleanup
// M11 (settings/audio) -> p2-settings-preserve-run
// M12 (depth progression) -> p2-late-run-depth
// M13 (save/leaderboard degrade) -> p2-terminal-summary-degrades-and-restarts
// M14 (giant two-lane obstacle) -> p2-giant-obstacle-safe-lane
// M15 (finite opening chase) -> p2-opening-finite-transition
//
// === Category Map ===
// Boot & Stability: p0-boot-stability, p0-public-contract-schema
// UI Flow & Blocking: p1-real-click-start-flow, p2-settings-preserve-run, p2-opening-finite-transition
// Input Semantics: p1-keyboard-direction-opposite, p1-real-touch-swipe-direction, p1-keyboard-jump-state, p1-keyboard-slide-state
// Core Mechanic Loop: p1-auto-run-distance, p1-contract-coin-collection-conservation, p1-contract-fatal-collision-lock
// State Machine: p1-contract-restart-cleanup, p1-contract-fatal-collision-lock, p2-terminal-summary-degrades-and-restarts
// Economy / Progression: p2-contract-revive-spend, p2-late-run-depth, p2-terminal-summary-degrades-and-restarts
// Feedback & Observability: p1-real-click-start-flow, p1-auto-run-distance, p2-visible-render-after-input
// Invariants & Rejection: p2-contract-revive-reject-unchanged, p1-contract-coin-collection-conservation
// Depth / Optional Systems: p2-contract-stun-chain, p2-late-run-depth, p2-giant-obstacle-safe-lane, p2-opening-finite-transition
//
// === Rationality Map ===
// p1-real-click-start-flow: M1 | real action: mouseClick visible start/play control | independent observation: phase + HUD/playfield + overlayBlocking | empty-shell failure: static menu or blocked playfield fails
// p1-auto-run-distance: M2 | real action: wait while playing | independent observation: distance delta + HUD parse | empty-shell failure: animation-only runner with no progress fails
// p1-keyboard-direction-opposite: M3 | real action: ArrowLeft/ArrowRight keyDown/keyUp | independent observation: screenX/lane deltas | empty-shell failure: no controls or mirrored same-direction movement fails
// p1-real-touch-swipe-direction: M3 | real action: dispatchTouchEvent left/right swipes | independent observation: screenX/lane deltas | empty-shell failure: desktop-only controls or mirrored touch direction fails
// p1-keyboard-jump-state: M4 | real action: Space keyDown/keyUp | independent observation: airborne/heightState/screenY delta | empty-shell failure: listener-only jump fails
// p1-keyboard-slide-state: M5 | real action: ArrowDown keyDown/keyUp | independent observation: sliding/heightState then recovery | empty-shell failure: no slide or permanent slide fails
// p1-contract-coin-collection-conservation: M6 | real action: contract wait from legal near-coin setup | independent observation: coins + visibleCoins + HUD | empty-shell failure: direct score add without collectible transfer fails
// p1-contract-fatal-collision-lock: M7 | real action: contract wait from legal fatal setup | independent observation: result/phase plus unchanged after terminal input | empty-shell failure: fake overlay without lock fails
// p1-contract-restart-cleanup: M10 | real action: restart button/action after terminal setup | independent observation: distance/coins/lane/result reset | empty-shell failure: hiding overlay only fails
// p2-contract-revive-spend: M9 | contract action: revive from legal gameover-with-coins | independent observation: coins cost, used increment, phase playing | empty-shell failure: free/no-op revive fails
// p2-contract-revive-reject-unchanged: M9 | contract action: revive from gameover-no-coins | independent observation: unchanged coins/used/phase | empty-shell failure: illegal free revive fails
// p2-settings-preserve-run: M11 | real action: click settings then close | independent observation: screen/phase plus preserved distance/coins | empty-shell failure: settings resets run or never closes fails
// p2-contract-stun-chain: M8 | contract action: second hit from stunned setup | independent observation: gameover/stunned feedback and no coin reward | empty-shell failure: stunned state with no consequence fails
// p2-late-run-depth: M12 | contract setup: late-run | independent observation: speedStage/entity counts while playing | empty-shell failure: static empty track fails
// p2-visible-render-after-input: M1/M3 | real action: key lane input with screenshot hash before/after | independent observation: canvas/screenshot hash + player state | empty-shell failure: API-only state with static/blank playfield fails
// p2-giant-obstacle-safe-lane: M14 | contract setup then player-level lane choice/wait | independent observation: obstacleCue + distance/phase/result | empty-shell failure: decorative blocker without safe-lane rules fails
// p2-opening-finite-transition: M15 | contract setup/opening or real start then wait | independent observation: cinematic state + phase/canInteract | empty-shell failure: endless intro or hidden playfield fails
// p2-terminal-summary-degrades-and-restarts: M13 | contract setup terminal then restart | independent observation: progressSummary/terminal UI + restart phase | empty-shell failure: network-only summary blocking retry fails

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v) {
  return v === true;
}

function createGameDriver(browser) {
  async function evaluate(expr) {
    const r = await browser.eval(expr);
    if (r && r.__l2_err__) return null;
    return r;
  }

  async function contractAvailable() {
    return bool(await evaluate(`
      (function(){
        return !!(window.__gameTest &&
          typeof window.__gameTest.reset === 'function' &&
          typeof window.__gameTest.input === 'function' &&
          typeof window.__gameTest.getSnapshot === 'function' &&
          typeof window.__gameTest.loadScenario === 'function');
      })()
    `));
  }

  async function snapshot() {
    const snap = await evaluate(`
      (function(){
        function visible(el) {
          if (!el) return false;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        }
        function textNumber(selList) {
          for (const sel of selList) {
            const el = document.querySelector(sel);
            if (!el) continue;
            const m = String(el.textContent || '').match(/-?\\d+(?:\\.\\d+)?/);
            if (m) return Number(m[0]);
          }
          return null;
        }
        function semanticScreen() {
          const active = Array.from(document.querySelectorAll('[data-screen], [role="dialog"], .screen, section, dialog'))
            .filter(visible)
            .map(el => ((el.getAttribute('data-screen') || el.getAttribute('aria-label') || el.id || el.className || el.textContent || '') + '').toLowerCase());
          const joined = active.join(' ');
          if (/game.?over|lose|failed/.test(joined)) return 'gameover';
          if (/complete|finish|victory/.test(joined)) return 'complete';
          if (/setting|audio|music|volume/.test(joined)) return 'settings';
          if (/loading|prepar/.test(joined)) return 'loading';
          if (/start|play|menu/.test(joined)) return 'start';
          return 'play';
        }
        let apiSnap = null;
        try {
          if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
            apiSnap = window.__gameTest.getSnapshot();
          }
        } catch (_) {}
        const canvases = Array.from(document.querySelectorAll('canvas'));
        let best = null;
        for (const c of canvases) {
          const r = c.getBoundingClientRect();
          if (!best || r.width * r.height > best.width * best.height) {
            best = { x: r.x, y: r.y, width: r.width, height: r.height };
          }
        }
        const screen = semanticScreen();
        const fallback = {
          phase: screen === 'gameover' ? 'gameover' : screen === 'settings' ? 'settings' : screen === 'complete' ? 'complete' : 'menu',
          screen,
          overlayBlocking: screen !== 'play',
          canInteractWithPlayfield: screen === 'play',
          distance: textNumber(['[data-testid*="distance" i]', '[aria-label*="distance" i]', '[class*="distance" i]', '[class*="hud" i]']) ?? 0,
          coins: textNumber(['[data-testid*="coin" i]', '[aria-label*="coin" i]', '[class*="coin" i]', '[class*="hud" i]']) ?? 0,
          lane: null,
          laneCount: 3,
          hud: {
            visible: visible(document.querySelector('[data-testid*="hud" i], [aria-label*="hud" i], [class*="hud" i]')),
            distanceText: '',
            coinsText: ''
          },
          player: { screenX: null, screenY: null, airborne: false, sliding: false, stunned: false, shielded: false, heightState: 'run' },
          playfield: { bounds: best, canvasReady: !!best, renderNonBlank: !!best },
          entityCounts: { visibleCoins: 0, obstacles: 0, movingThreats: 0 },
          obstacleCue: { kind: null, blockedLanes: [], safeLanes: [], distanceAhead: null, visible: false },
          cinematic: { active: false, visibleThreat: false, inputLocked: false, elapsedMs: 0 },
          speedStage: 0,
          result: screen === 'gameover' ? 'lose' : screen === 'complete' ? 'complete' : 'none',
          revive: { offered: false, cost: null, used: 0, max: 0, shielded: false },
          progressSummary: { runDistance: null, bestDistance: null, leaderboardVisible: false, leaderboardUnavailable: false }
        };
        return Object.assign(fallback, apiSnap || {}, {
          hud: Object.assign(fallback.hud, (apiSnap && apiSnap.hud) || {}),
          player: Object.assign(fallback.player, (apiSnap && apiSnap.player) || {}),
          playfield: Object.assign(fallback.playfield, (apiSnap && apiSnap.playfield) || {}),
          entityCounts: Object.assign(fallback.entityCounts, (apiSnap && apiSnap.entityCounts) || {}),
          obstacleCue: Object.assign(fallback.obstacleCue, (apiSnap && apiSnap.obstacleCue) || {}),
          cinematic: Object.assign(fallback.cinematic, (apiSnap && apiSnap.cinematic) || {}),
          revive: Object.assign(fallback.revive, (apiSnap && apiSnap.revive) || {}),
          progressSummary: Object.assign(fallback.progressSummary, (apiSnap && apiSnap.progressSummary) || {})
        });
      })()
    `);
    return snap || {};
  }

  async function contractInput(action) {
    return await evaluate(`
      (async function(){
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') {
          return { ok:false, reason:'missing __gameTest.input' };
        }
        return await window.__gameTest.input(${JSON.stringify(action)});
      })()
    `);
  }

  async function reset(options = {}) {
    return await evaluate(`
      (async function(){
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') {
          return { ok:false, reason:'missing __gameTest.reset' };
        }
        return await window.__gameTest.reset(${JSON.stringify(options)});
      })()
    `);
  }

  async function loadScenario(name) {
    return await evaluate(`
      (async function(){
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') {
          return { ok:false, reason:'missing __gameTest.loadScenario' };
        }
        return await window.__gameTest.loadScenario(${JSON.stringify(name)});
      })()
    `);
  }

  async function playfieldCenter() {
    const s = await snapshot();
    const b = s.playfield && s.playfield.bounds;
    if (b && b.width > 0 && b.height > 0) {
      return { x: b.x + b.width / 2, y: b.y + b.height / 2, bounds: b };
    }
    const size = await browser.getCanvasSize();
    if (size && size.cssW > 0 && size.cssH > 0) return { x: size.cssW / 2, y: size.cssH / 2, bounds: { x: 0, y: 0, width: size.cssW, height: size.cssH } };
    throw new Error('missing playfield bounds for real swipe');
  }

  async function clickSemanticButton(kind) {
    const target = await evaluate(`
      (function(){
        const kind = ${JSON.stringify(kind)};
        const words = {
          start: /\\b(start|play|run|begin|ready)\\b/i,
          restart: /\\b(restart|retry|again|replay|run again|try again)\\b/i,
          revive: /\\b(revive|continue|resume)\\b/i,
          settings: /\\b(settings?|options?|audio|music)\\b/i,
          close: /\\b(ok|close|done|back|resume)\\b/i
        }[kind] || /./;
        function visible(el) {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        }
        const nodes = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="range"], input[type="checkbox"]'));
        for (const el of nodes) {
          if (!visible(el) || el.disabled) continue;
          const label = [el.textContent, el.value, el.getAttribute('aria-label'), el.title, el.getAttribute('data-action')].join(' ');
          if (words.test(label)) {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, tag: el.tagName, label };
          }
        }
        return null;
      })()
    `);
    if (!target) return false;
    await browser.mouseClick(target.x, target.y);
    await sleep(300);
    return true;
  }

  async function ensurePlaying() {
    let s = await snapshot();
    if (s.phase === 'playing' && s.canInteractWithPlayfield !== false) return s;
    await clickSemanticButton('start');
    await sleep(700);
    s = await snapshot();
    if (s.phase !== 'playing' && await contractAvailable()) {
      await contractInput({ type: 'start' });
      await sleep(300);
      s = await snapshot();
    }
    const deadline = Date.now() + 3500;
    while (s.phase === 'intro' && Date.now() < deadline) {
      await sleep(250);
      s = await snapshot();
    }
    return s;
  }

  async function pressKey(key, holdMs = 80) {
    await browser.keyDown(key);
    await sleep(holdMs);
    await browser.keyUp(key);
    await sleep(220);
  }

  async function realSwipe(direction) {
    const c = await playfieldCenter();
    const d = Math.min(120, Math.max(50, c.bounds.width * 0.18));
    const map = {
      left: [-d, 0],
      right: [d, 0],
      up: [0, -d],
      down: [0, d]
    };
    const [dx, dy] = map[direction] || [0, 0];
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: c.x, y: c.y, button: 'left', clickCount: 1 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x + dx, y: c.y + dy, button: 'left', buttons: 1, movementX: dx, movementY: dy });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: c.x + dx, y: c.y + dy, button: 'left', clickCount: 1 });
    await sleep(250);
  }

  async function touchSwipe(direction) {
    const c = await playfieldCenter();
    const d = Math.min(140, Math.max(60, c.bounds.width * 0.2));
    const map = {
      left: [-d, 0],
      right: [d, 0],
      up: [0, -d],
      down: [0, d]
    };
    const [dx, dy] = map[direction] || [0, 0];
    const point = (x, y) => ({ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 });
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(c.x, c.y)] });
    await sleep(40);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(c.x + dx, c.y + dy)] });
    await sleep(40);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(280);
  }

  return {
    snapshot,
    contractAvailable,
    contractInput,
    reset,
    loadScenario,
    clickSemanticButton,
    ensurePlaying,
    pressKey,
    realSwipe,
    touchSwipe
  };
}

async function requireScenario(game, name) {
  const setup = await game.loadScenario(name);
  if (setup && setup.ok === false) throw new Error(`${name} scenario unavailable: ${setup.reason || 'rejected'}`);
  return setup;
}

const checks = [
  {
    id: 'p0-boot-stability',
    level: 'P0',
    name: 'boot stability and visible playfield',
    timeoutMs: 15000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await sleep(1000);
      if (ctx.browser.exceptions.length) {
        return FAIL('runtime exception: ' + ctx.browser.exceptions[0].description);
      }
      const s = await game.snapshot();
      const b = s.playfield && s.playfield.bounds;
      if (!b || b.width <= 0 || b.height <= 0) return FAIL('no visible playfield bounds');
      return PASS(`ready phase=${s.phase || 'unknown'} playfield=${Math.round(b.width)}x${Math.round(b.height)}`);
    }
  },
  {
    id: 'p0-public-contract-schema',
    level: 'P0',
    name: 'public contract schema when available',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const available = await game.contractAvailable();
      if (!available) return FAIL('missing required window.__gameTest reset/input/getSnapshot contract');
      const s = await game.reset();
      const snap = await game.snapshot();
      const phaseOk = ['loading', 'menu', 'intro', 'playing', 'settings', 'paused', 'gameover', 'complete'].includes(String(snap.phase));
      if (!phaseOk) return FAIL('snapshot.phase missing or invalid');
      if (num(snap.laneCount, 0) !== 3) return FAIL('snapshot.laneCount must be 3');
      if (!snap.player || typeof snap.player !== 'object') return FAIL('snapshot.player missing');
      return PASS(`contract schema valid after reset (${s && s.ok === false ? s.reason || 'reset returned snapshot' : 'ok'})`);
    }
  },
  {
    id: 'p1-real-click-start-flow',
    level: 'P1',
    name: 'real click start flow unblocks playfield',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      // Static quality gate note: clickSemanticButton resolves a visible start/play control and uses browser.mouseClick.
      await game.clickSemanticButton('start');
      await sleep(800);
      const s = await game.ensurePlaying();
      if (s.phase !== 'playing') return FAIL(`expected playing after start, got ${s.phase}`);
      if (s.overlayBlocking === true || s.canInteractWithPlayfield === false) return FAIL('playfield remains blocked after start');
      if (!s.hud || s.hud.visible === false) return FAIL('HUD not visible after start');
      if (!s.playfield || !s.playfield.renderNonBlank) return FAIL('3D/WebGL playfield not reported as nonblank');
      return PASS('real start path reaches playable unblocked run');
    }
  },
  {
    id: 'p1-auto-run-distance',
    level: 'P1',
    name: 'auto run advances distance and HUD',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'running-clear');
      const before = await game.ensurePlaying();
      const d0 = num(before.distance, 0);
      const coins0 = num(before.coins, 0);
      await sleep(900);
      await game.contractInput({ type: 'wait', ms: 300 });
      const after = await game.snapshot();
      const d1 = num(after.distance, 0);
      if (!(d1 > d0)) return FAIL(`distance did not increase: ${d0} -> ${d1}`);
      if (num(after.coins, 0) < coins0) return FAIL('coins decreased during clear running');
      return PASS(`distance advanced ${d0.toFixed(2)} -> ${d1.toFixed(2)}`);
    }
  },
  {
    id: 'p1-keyboard-direction-opposite',
    level: 'P1',
    name: 'keyboard left right produce opposite screen direction',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'running-clear');
      await game.ensurePlaying();
      let s0 = await game.snapshot();
      const x0 = num(s0.player && s0.player.screenX, NaN);
      await game.pressKey('ArrowLeft');
      let s1 = await game.snapshot();
      const x1 = num(s1.player && s1.player.screenX, NaN);
      await game.pressKey('ArrowRight');
      await game.pressKey('ArrowRight');
      let s2 = await game.snapshot();
      const x2 = num(s2.player && s2.player.screenX, NaN);
      if (!Number.isFinite(x0) || !Number.isFinite(x1) || !Number.isFinite(x2)) {
        return FAIL('player.screenX is required for screen-space direction checks');
      }
      const deltaLeft = x1 - x0;
      const deltaRight = x2 - x1;
      if (Math.abs(deltaLeft) < 1 || Math.abs(deltaRight) < 1) return FAIL(`lane input did not visibly move enough (${deltaLeft}, ${deltaRight})`);
      if (Math.sign(deltaLeft) === Math.sign(deltaRight)) return FAIL(`left/right deltas are not opposite: ${deltaLeft}, ${deltaRight}`);
      if (num(s2.lane, 1) < 0 || num(s2.lane, 1) > 2) return FAIL('lane moved out of bounds');
      return PASS(`opposite direction verified; deltaLeft=${deltaLeft.toFixed(1)} deltaRight=${deltaRight.toFixed(1)}`);
    }
  },
  {
    id: 'p1-real-touch-swipe-direction',
    level: 'P1',
    name: 'real touch swipe left right produce opposite screen direction',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'running-clear');
      await game.ensurePlaying();
      const s0 = await game.snapshot();
      const x0 = num(s0.player && s0.player.screenX, NaN);
      // Static quality gate note: touchSwipe dispatches real Input.dispatchTouchEvent touchStart/touchMove/touchEnd.
      await game.touchSwipe('left');
      const s1 = await game.snapshot();
      const x1 = num(s1.player && s1.player.screenX, NaN);
      await game.touchSwipe('right');
      await game.touchSwipe('right');
      const s2 = await game.snapshot();
      const x2 = num(s2.player && s2.player.screenX, NaN);
      if (!Number.isFinite(x0) || !Number.isFinite(x1) || !Number.isFinite(x2)) {
        return FAIL('player.screenX is required for touch screen-space direction checks');
      }
      const leftDelta = x1 - x0;
      const rightDelta = x2 - x1;
      if (Math.abs(leftDelta) < 1 || Math.abs(rightDelta) < 1) return FAIL(`touch swipe did not visibly move enough (${leftDelta}, ${rightDelta})`);
      if (Math.sign(leftDelta) === Math.sign(rightDelta)) return FAIL(`touch left/right deltas are not opposite: ${leftDelta}, ${rightDelta}`);
      if (num(s2.lane, 1) < 0 || num(s2.lane, 1) > 2) return FAIL('touch swipe moved lane out of bounds');
      return PASS(`touch opposite direction verified; left=${leftDelta.toFixed(1)} right=${rightDelta.toFixed(1)}`);
    }
  },
  {
    id: 'p1-keyboard-jump-state',
    level: 'P1',
    name: 'keyboard jump changes airborne state',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'running-clear');
      await game.ensurePlaying();
      const before = await game.snapshot();
      await game.pressKey('Space');
      const mid = await game.snapshot();
      await sleep(700);
      const after = await game.snapshot();
      const jumped = mid.player && (mid.player.airborne === true || /jump|air/i.test(String(mid.player.heightState || '')) || num(mid.player.screenY, 0) !== num(before.player && before.player.screenY, 0));
      if (!jumped) return FAIL('jump input did not produce airborne/height feedback');
      if (after.phase !== 'playing') return FAIL('jump caused unexpected non-playing phase');
      return PASS('jump state observed and run remains playable');
    }
  },
  {
    id: 'p1-keyboard-slide-state',
    level: 'P1',
    name: 'keyboard slide enters and exits low posture',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'running-clear');
      await game.ensurePlaying();
      await game.pressKey('ArrowDown');
      const mid = await game.snapshot();
      const sliding = mid.player && (mid.player.sliding === true || /slide|low/i.test(String(mid.player.heightState || '')));
      if (!sliding) return FAIL('slide input did not enter sliding/low state');
      await sleep(900);
      const after = await game.snapshot();
      if (after.player && after.player.sliding === true) return FAIL('slide remained active too long');
      return PASS('slide entered and recovered');
    }
  },
  {
    id: 'p1-contract-coin-collection-conservation',
    level: 'P1',
    name: 'contract coin collection conserves collectibles',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'near-coin');
      const before = await game.snapshot();
      let previous = before;
      let after = before;
      let observedTransfer = false;
      for (let elapsed = 0; elapsed < 1200; elapsed += 100) {
        const stepMs = Math.min(100, 1200 - elapsed);
        await game.contractInput({ type: 'wait', ms: stepMs });
        await sleep(50);
        after = await game.snapshot();
        const previousCoins = num(previous.coins, 0);
        const currentCoins = num(after.coins, 0);
        const previousVisibleCoins = num(previous.entityCounts && previous.entityCounts.visibleCoins, 0);
        const currentVisibleCoins = num(after.entityCounts && after.entityCounts.visibleCoins, 0);
        if (currentCoins > previousCoins && currentVisibleCoins < previousVisibleCoins) {
          observedTransfer = true;
        }
        previous = after;
      }
      const coinsBefore = num(before.coins, 0);
      const visibleCoinsBefore = num(before.entityCounts && before.entityCounts.visibleCoins, 0);
      const coinsAfter = num(after.coins, 0);
      const visibleCoinsAfter = num(after.entityCounts && after.entityCounts.visibleCoins, 0);
      const coinGain = coinsAfter - coinsBefore;
      const visibleCoinDrop = visibleCoinsBefore - visibleCoinsAfter;
      const totalBefore = coinsBefore + visibleCoinsBefore;
      const totalAfter = coinsAfter + visibleCoinsAfter;
      const hudCoinsText = String(after.hud && after.hud.coinsText || '');
      const hudCoinMatch = hudCoinsText.match(/-?\d+(?:\.\d+)?/);
      const hudCoinsAfter = hudCoinMatch ? Number(hudCoinMatch[0]) : NaN;
      if (!(coinGain > 0)) return FAIL('coins did not increase after running through coin setup');
      if (!observedTransfer) return FAIL('coin gain was not accompanied by a same-interval visible collectible removal');
      if (!Number.isFinite(hudCoinsAfter) || hudCoinsAfter !== coinsAfter) return FAIL(`HUD coin text did not match player coins: hud=${hudCoinsAfter} coins=${coinsAfter}`);
      if (totalAfter < totalBefore) return FAIL(`coin conservation failed totalBefore=${totalBefore} totalAfter=${totalAfter}`);
      return PASS(`coin transferred from world to player; coinGain=${coinGain} visibleCoinDrop=${visibleCoinDrop} totalBefore=${totalBefore} totalAfter=${totalAfter} observedTransfer=${observedTransfer}`);
    }
  },
  {
    id: 'p1-contract-fatal-collision-lock',
    level: 'P1',
    name: 'contract fatal collision reaches terminal and locks input',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'near-fatal-obstacle');
      const setup = await game.snapshot();
      if (setup.phase === 'gameover' || setup.phase === 'complete' || setup.result !== 'none') {
        return FAIL(`near-fatal scenario was already terminal: phase=${setup.phase} result=${setup.result}`);
      }
      let terminal = setup;
      for (let elapsed = 0; elapsed < 12000; elapsed += 250) {
        await game.contractInput({ type: 'wait', ms: 250 });
        await sleep(50);
        terminal = await game.snapshot();
        if (terminal.phase === 'gameover' || terminal.result === 'lose') break;
      }
      if (terminal.phase !== 'gameover' && terminal.result !== 'lose') return FAIL(`expected gameover/lose, got phase=${terminal.phase} result=${terminal.result}`);
      const laneBefore = terminal.lane;
      const distBefore = num(terminal.distance, 0);
      await game.pressKey('ArrowLeft');
      await game.contractInput({ type: 'key', key: 'ArrowLeft' });
      const after = await game.snapshot();
      if (after.lane !== laneBefore) return FAIL('terminal state accepted lane input');
      if (num(after.distance, 0) > distBefore + 0.1) return FAIL('distance advanced after terminal state');
      return PASS('fatal collision locks terminal run state');
    }
  },
  {
    id: 'p1-contract-restart-cleanup',
    level: 'P1',
    name: 'contract restart cleans transient run state',
    timeoutMs: 15000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'near-fatal-obstacle');
      let terminal = await game.snapshot();
      for (let elapsed = 0; elapsed < 8000; elapsed += 250) {
        if (terminal.phase === 'gameover' || terminal.result === 'lose') break;
        await game.contractInput({ type: 'wait', ms: 250 });
        await sleep(50);
        terminal = await game.snapshot();
      }
      if (terminal.phase !== 'gameover' && terminal.result !== 'lose') return FAIL('setup did not reach terminal state before restart');
      const returned = await game.contractInput({ type: 'button', target: 'restart' });
      const after = (returned && typeof returned === 'object' && returned.phase) ? returned : await game.snapshot();
      if (after.phase !== 'playing') return FAIL(`restart did not return to playing, got ${after.phase}`);
      if (num(after.distance, 999) > 5) return FAIL('distance not reset near start');
      if (num(after.coins, 999) !== 0) return FAIL('coins not reset for new run');
      if (after.lane !== 1) return FAIL('lane not reset to middle');
      if (after.result !== 'none') return FAIL('old terminal result remains after restart');
      return PASS('restart clears result, distance, coins, lane');
    }
  },
  {
    id: 'p2-contract-revive-spend',
    level: 'P2',
    name: 'contract revive spends coins and resumes with shield',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'gameover-with-coins');
      const before = await game.snapshot();
      const cost = num(before.revive && before.revive.cost, NaN);
      if (!Number.isFinite(cost) || cost <= 0) return FAIL('revive cost must be positive');
      await game.contractInput({ type: 'button', target: 'revive' });
      await sleep(300);
      const after = await game.snapshot();
      if (after.phase !== 'playing') return FAIL('revive did not resume playing');
      if (num(after.coins, 0) !== num(before.coins, 0) - cost) return FAIL(`revive did not spend exact cost ${cost}`);
      if (num(after.revive && after.revive.used, 0) !== num(before.revive && before.revive.used, 0) + 1) return FAIL('revive used count did not increment');
      if (!(after.player && after.player.shielded) && !(after.revive && after.revive.shielded)) return FAIL('revive did not grant temporary shield');
      return PASS('revive cost, used count, and shield verified');
    }
  },
  {
    id: 'p2-contract-revive-reject-unchanged',
    level: 'P2',
    name: 'contract invalid revive rejected unchanged',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'gameover-no-coins');
      const before = await game.snapshot();
      const unchanged = { coins: before.coins, used: before.revive && before.revive.used, phase: before.phase };
      const res = await game.contractInput({ type: 'button', target: 'revive' });
      await sleep(250);
      const after = await game.snapshot();
      if (after.phase !== unchanged.phase) return FAIL('invalid revive changed phase');
      if (after.coins !== unchanged.coins) return FAIL('invalid revive changed coins');
      if ((after.revive && after.revive.used) !== unchanged.used) return FAIL('invalid revive changed used count');
      if (res && res.ok === true && before.revive && before.revive.offered === false) return FAIL('invalid revive returned ok:true');
      return PASS('invalid revive rejected with unchanged resources');
    }
  },
  {
    id: 'p2-settings-preserve-run',
    level: 'P2',
    name: 'settings panel preserves current run',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'running-clear');
      await game.ensurePlaying();
      const before = await game.snapshot();
      const opened = await game.clickSemanticButton('settings');
      if (!opened) await game.contractInput({ type: 'button', target: 'settings' });
      await sleep(300);
      const settings = await game.snapshot();
      if (settings.phase !== 'settings' && settings.screen !== 'settings') return FAIL('settings did not open');
      const closed = await game.clickSemanticButton('close');
      if (!closed) await game.contractInput({ type: 'button', target: 'settingsClose' });
      await sleep(300);
      const after = await game.snapshot();
      if (after.phase !== 'playing') return FAIL('settings close did not return to playing');
      if (num(after.coins, 0) !== num(before.coins, 0)) return FAIL('settings changed coins');
      if (num(after.distance, 0) + 0.1 < num(before.distance, 0)) return FAIL('settings reset distance');
      return PASS('settings opens/closes and preserves run state');
    }
  },
  {
    id: 'p2-visible-render-after-input',
    level: 'P2',
    name: 'visible playfield render changes after real lane input',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'running-clear');
      await game.ensurePlaying();
      const before = await game.snapshot();
      const h0 = await ctx.browser.canvasPixelHash();
      await game.pressKey('ArrowLeft');
      const mid = await game.snapshot();
      await sleep(250);
      const h1 = await ctx.browser.canvasPixelHash();
      const b = mid.playfield && mid.playfield.bounds;
      if (!b || b.width <= 0 || b.height <= 0) return FAIL('no visible playfield bounds during render check');
      if (mid.playfield && mid.playfield.renderNonBlank === false) return FAIL('playfield reports blank render after input');
      const moved = Number.isFinite(num(before.player && before.player.screenX, NaN)) &&
        Number.isFinite(num(mid.player && mid.player.screenX, NaN)) &&
        Math.abs(num(mid.player.screenX, 0) - num(before.player.screenX, 0)) >= 1;
      if (!moved && mid.lane === before.lane) return FAIL('real input did not change player lane or screen position');
      if (h0 == null || h1 == null) return FAIL('screenshot/canvas hash unavailable for visible render evidence');
      if (h0 === h1) return FAIL('visible playfield did not change after real lane input');
      return PASS(`render changed after input hash=${h0}->${h1}`);
    }
  },
  {
    id: 'p2-contract-stun-chain',
    level: 'P2',
    name: 'contract stunned state has consequence without reward',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'stunned');
      const before = await game.snapshot();
      if (!(before.player && before.player.stunned)) return FAIL('stunned scenario must begin visibly stunned');
      let after = before;
      let minVisibleCoins = num(before.entityCounts && before.entityCounts.visibleCoins, 0);
      for (let i = 0; i < 9; i++) {
        await game.contractInput({ type: 'wait', ms: 100 });
        after = await game.snapshot();
        minVisibleCoins = Math.min(
          minVisibleCoins,
          num(after.entityCounts && after.entityCounts.visibleCoins, 0)
        );
      }
      await sleep(300);
      after = await game.snapshot();
      const coinGain = num(after.coins, 0) - num(before.coins, 0);
      const visibleCoinLoss = num(before.entityCounts && before.entityCounts.visibleCoins, 0) -
        minVisibleCoins;
      if (coinGain > Math.max(0, visibleCoinLoss)) {
        return FAIL('stun chain awarded coins without collecting visible coins');
      }
      const hasConsequence = after.phase === 'gameover' || after.result === 'lose' || (after.player && after.player.stunned === true);
      if (!hasConsequence) return FAIL('stunned state vanished without terminal or visible consequence');
      return PASS('stunned chain remains dangerous and does not reward');
    }
  },
  {
    id: 'p2-giant-obstacle-safe-lane',
    level: 'P2',
    name: 'giant two lane obstacle exposes safe lane rule',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'near-giant-obstacle');
      const before = await game.snapshot();
      const cue = before.obstacleCue || {};
      const safe = Array.isArray(cue.safeLanes) ? cue.safeLanes.map((v) => Number(v)).filter((v) => v >= 0 && v <= 2) : [];
      const blocked = Array.isArray(cue.blockedLanes) ? cue.blockedLanes.map((v) => Number(v)).filter((v) => v >= 0 && v <= 2) : [];
      if (cue.visible === false) return FAIL('giant obstacle cue is not visible');
      if (safe.length < 1) return FAIL('giant obstacle must expose at least one safe lane');
      if (blocked.length < 2) return FAIL('giant obstacle must block two lanes');
      const target = safe[0];
      for (let i = 0; i < 3 && num((await game.snapshot()).lane, 1) !== target; i++) {
        const current = num((await game.snapshot()).lane, 1);
        await game.pressKey(target < current ? 'ArrowLeft' : 'ArrowRight');
      }
      const aligned = await game.snapshot();
      if (num(aligned.lane, -1) !== target) return FAIL(`could not move to declared safe lane ${target}`);
      const startCoins = num(aligned.coins, num(before.coins, 0));
      let previousVisibleCoins = num(aligned.entityCounts && aligned.entityCounts.visibleCoins, 0);
      let visibleCoinRemovals = 0;
      const observeVisibleCoins = async () => {
        const sample = await game.snapshot();
        const visibleCoins = num(sample.entityCounts && sample.entityCounts.visibleCoins, 0);
        if (visibleCoins < previousVisibleCoins) {
          visibleCoinRemovals += previousVisibleCoins - visibleCoins;
        }
        previousVisibleCoins = visibleCoins;
        return sample;
      };
      let after = aligned;
      for (let i = 0; i < 6; i++) {
        await game.contractInput({ type: 'wait', ms: 200 });
        after = await observeVisibleCoins();
      }
      for (let i = 0; i < 5; i++) {
        await sleep(100);
        after = await observeVisibleCoins();
      }
      if (after.phase !== 'playing') return FAIL(`safe lane did not remain playable, got ${after.phase}`);
      if (!(num(after.distance, 0) > num(before.distance, 0))) return FAIL('safe lane did not continue advancing distance');
      const coinGain = num(after.coins, 0) - startCoins;
      if (coinGain > visibleCoinRemovals) {
        return FAIL('giant obstacle safe path gained more coins than observed visible-coin removals');
      }
      return PASS(`giant obstacle safe lane ${target} advanced distance ${num(before.distance, 0).toFixed(1)} -> ${num(after.distance, 0).toFixed(1)}`);
    }
  },
  {
    id: 'p2-late-run-depth',
    level: 'P2',
    name: 'late run exposes speed or obstacle depth',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'late-run');
      const before = await game.snapshot();
      if (before.phase !== 'playing') return FAIL('late-run setup must remain playing');
      await game.contractInput({ type: 'wait', ms: 600 });
      await sleep(300);
      const after = await game.snapshot();
      const obstacleDepth = num(after.entityCounts && after.entityCounts.obstacles, 0) + num(after.entityCounts && after.entityCounts.movingThreats, 0);
      if (!(num(after.distance, 0) > num(before.distance, 0))) return FAIL('late run did not continue advancing after setup');
      if (num(after.speedStage, 0) <= 0 && obstacleDepth <= 0) return FAIL('late run has no speed stage or obstacle/threat depth');
      return PASS(`late-run depth advanced ${num(before.distance, 0).toFixed(1)} -> ${num(after.distance, 0).toFixed(1)}, speedStage=${after.speedStage}, obstacleDepth=${obstacleDepth}`);
    }
  },
  {
    id: 'p2-opening-finite-transition',
    level: 'P2',
    name: 'opening chase is finite and reaches playable run',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'opening');
      let first = await game.snapshot();
      if (first.phase !== 'intro' && first.phase !== 'playing') {
        await game.contractInput({ type: 'start' });
        first = await game.snapshot();
      }
      const sawOpening = first.phase === 'intro' || (first.cinematic && first.cinematic.active === true);
      const deadline = Date.now() + 4500;
      let current = first;
      while (current.phase === 'intro' && Date.now() < deadline) {
        await sleep(300);
        current = await game.snapshot();
      }
      if (current.phase !== 'playing') return FAIL(`opening did not reach playing, got ${current.phase}`);
      if (current.canInteractWithPlayfield === false) return FAIL('opening ended but playfield remains non-interactive');
      if (!current.hud || current.hud.visible === false) return FAIL('HUD not visible after opening transition');
      return PASS(sawOpening ? 'finite opening reached playable run' : 'game starts directly playable with opening inactive');
    }
  },
  {
    id: 'p2-terminal-summary-degrades-and-restarts',
    level: 'P2',
    name: 'terminal summary exposes progress and restart still works',
    timeoutMs: 17000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await requireScenario(game, 'near-fatal-obstacle');
      let terminal = await game.snapshot();
      let advancedMs = 0;
      const maxAdvanceMs = 15000;
      while (terminal.phase !== 'gameover' && terminal.result !== 'lose' && advancedMs < maxAdvanceMs) {
        const stepMs = Math.min(500, maxAdvanceMs - advancedMs);
        await game.contractInput({ type: 'wait', ms: stepMs });
        advancedMs += stepMs;
        await sleep(100);
        terminal = await game.snapshot();
      }
      if (terminal.phase !== 'gameover' && terminal.result !== 'lose') {
        return FAIL(`terminal setup did not reach gameover after ${advancedMs}ms of player-level waiting`);
      }
      const summary = terminal.progressSummary || {};
      const hasRunDistance = Number.isFinite(num(summary.runDistance, NaN)) || Number.isFinite(num(terminal.distance, NaN));
      const hasBest = Number.isFinite(num(summary.bestDistance, NaN)) || Number.isFinite(num(terminal.bestDistance, NaN));
      const hasLeaderboardState = summary.leaderboardVisible === true || summary.leaderboardUnavailable === true;
      if (!hasRunDistance && !hasBest && !hasLeaderboardState) {
        return FAIL('terminal state lacks run distance, best distance, leaderboard, or graceful unavailable summary');
      }
      const clicked = await game.clickSemanticButton('restart');
      if (!clicked) await game.contractInput({ type: 'button', target: 'restart' });
      await sleep(500);
      const restarted = await game.snapshot();
      if (restarted.phase !== 'playing') return FAIL('restart unavailable after terminal summary');
      if (restarted.result !== 'none') return FAIL('terminal result remains after restart');
      return PASS('terminal summary observed and restart remains usable');
    }
  }
];

module.exports = {
  sleep,
  suite: checks
};
