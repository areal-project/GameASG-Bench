// GunGateGang L2 runtime checks
// === GDD Coverage Map ===
// p0-api-contract: M1/M12 public contract availability and snapshot schema.
// p0-boot-visible-scene: M1/M12 boot stability, visible canvas/playfield, no fatal runtime errors.
// p1-real-click-start-playable: M1/M12/M13 real start input enters an unblocked playable scene.
// p1-keyboard-direction-opposite-chain: M2/M13 keyboard movement causality, release trend, direction opposite relation.
// p1-touch-direction-opposite-chain: M2/M13 touch half-screen movement direction opposite relation.
// p1-boundary-and-reverse-control: M2/M13 road bounds, boundary invariant, reverse input recovery.
// p1-auto-fire-target-coupling: M4/M6/M12 automatic fire changes a declared target and feedback.
// p1-gate-reward-risk-single-settlement: M3/M5/M12/M13 route reward/risk and no repeated settlement.
// p1-obstacle-weapon-benefit-chain: M4/M7/M8/M12 obstacle damage, weapon pickup, benefit evidence.
// p1-enemy-risk-score-or-loss: M3/M4/M9/M12 visible enemy pressure coupled to score or team loss.
// p1-failure-lock-and-restart-cleanup: M1/M3/M13 terminal lock and clean restart.
// p1-invalid-action-and-invariants: M13 rejection path and non-negative invariants.
// p2-progression-threat-growth: M11 long-run progression and threat/world changes.
// p2-boss-pressure-contract: M10 boss pressure depth loop when implemented.
//
// === Rationality Map ===
// p1-real-click-start-playable: real action: mouseClick start | independent observation: snapshot phase + HUD/world summaries + canvas hash | empty-shell failure: phase-only shell without visible playable state fails.
// p1-keyboard-direction-opposite-chain: real action: ArrowLeft/ArrowRight keyDown/keyUp | independent observation: team.screenX, velocity sign, world/projectile revision | empty-shell failure: API-only movement, mirrored movement, or release disabling loop fails.
// p1-touch-direction-opposite-chain: real action: CDP touchStart/touchEnd left/right halves | independent observation: Math.sign(delta) direction opposite comparison + playable HUD | empty-shell failure: both touch zones moving same way fails.
// p1-boundary-and-reverse-control: real action: held keyboard input then reverse | independent observation: team bounds against road bounds + reverse center delta | empty-shell failure: unclamped or stuck-at-edge movement fails.
// p1-auto-fire-target-coupling: contract setup, player wait action | independent observation: projectile revision + target public revision + feedback | empty-shell failure: bullets or target labels without causally changed target fail.
// p1-gate-reward-risk-single-settlement: contract setup, route action then wait | independent observation: gate status + team/HUD delta + repeat invariant | empty-shell failure: gates that only repaint or settle repeatedly fail.
// p1-obstacle-weapon-benefit-chain: contract setup, route/wait action | independent observation: obstacle hp/status + weapon/HUD change + projectile evidence | empty-shell failure: free weapon labels or invisible obstacle damage fail.
// p1-enemy-risk-score-or-loss: contract setup, player wait/adjust | independent observation: enemy motion/status + projectile/hit feedback + score/team/HUD | empty-shell failure: static enemies, free score, or invisible damage fail.
// p1-failure-lock-and-restart-cleanup: contract setup, player wait/restart | independent observation: result layer, finalScore, world/result lock, clean new snapshot | empty-shell failure: result screen that still plays or dirty restart fails.
// p1-invalid-action-and-invariants: real/contract invalid action | independent observation: lastAction rejection or unchanged core fields + non-negative resources | empty-shell failure: cheat action accepted or negative counters fail.
// p2-progression-threat-growth: contract/player wait | independent observation: wave/difficulty plus world/threat revision | empty-shell failure: timer-only progression fails.
// p2-boss-pressure-contract: contract setup, player wait/adjust | independent observation: boss hp/warning/attack and score/team/feedback | empty-shell failure: static boss label without pressure fails.

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }

const VALID_PHASES = ['booting', 'menu', 'playing', 'paused', 'result'];
const VALID_SCREENS = ['start', 'play', 'pause', 'result'];
const VALID_RESULTS = ['none', 'lose'];

function finite(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function sameCore(a, b) {
  return a && b &&
    a.phase === b.phase &&
    a.result === b.result &&
    a.score === b.score &&
    a.finalScore === b.finalScore &&
    a.team && b.team &&
    a.team.count === b.team.count &&
    a.weapon && b.weapon &&
    a.weapon.kind === b.weapon.kind;
}

function targetSig(target) {
  if (!target) return 'none';
  return [
    target.id || '',
    target.status || '',
    target.used === true ? 'used' : 'unused',
    finite(target.value) ? target.value : '',
    finite(target.valueRevision) ? target.valueRevision : '',
    finite(target.hp) ? target.hp : '',
    finite(target.hpRevision) ? target.hpRevision : '',
    target.limitState || ''
  ].join('|');
}

function firstActive(list) {
  if (!Array.isArray(list)) return null;
  return list.find(t => t && !['processed', 'offscreen', 'destroyed', 'defeated', 'contacted'].includes(t.status)) || list[0] || null;
}

function assertSnapshotSchema(s) {
  if (!s || typeof s !== 'object') return 'snapshot is not an object';
  if (typeof s.ok !== 'boolean') return 'snapshot.ok must be boolean';
  if (!VALID_PHASES.includes(s.phase)) return `invalid phase ${s.phase}`;
  if (!VALID_SCREENS.includes(s.screen)) return `invalid screen ${s.screen}`;
  if (!VALID_RESULTS.includes(s.result)) return `invalid result ${s.result}`;
  if (typeof s.canInteractWithPlayfield !== 'boolean') return 'canInteractWithPlayfield must be boolean';
  if (typeof s.overlayBlocking !== 'boolean') return 'overlayBlocking must be boolean';
  if (!finite(s.score) || s.score < 0) return 'score must be non-negative number';
  if (!(s.finalScore === null || finite(s.finalScore))) return 'finalScore must be null or number';
  if (!finite(s.wave) || s.wave < 0) return 'wave must be non-negative number';
  if (!finite(s.difficultyTier) || s.difficultyTier < 0) return 'difficultyTier must be non-negative number';
  if (!s.team || !finite(s.team.count) || !finite(s.team.visibleCount)) return 'team count summaries missing';
  if (s.team.count < 0 || s.team.visibleCount < 0) return 'team counts must be non-negative';
  if (!s.team.center || !finite(s.team.center.screenX) || !finite(s.team.center.screenY)) return 'team center screen coordinates missing';
  if (!s.team.bounds || !finite(s.team.bounds.left) || !finite(s.team.bounds.right)) return 'team bounds missing';
  if (!s.team.roadBoundsAtTeam || !finite(s.team.roadBoundsAtTeam.left) || !finite(s.team.roadBoundsAtTeam.right)) return 'team road bounds missing';
  if (![-1, 0, 1].includes(s.team.horizontalVelocitySign)) return 'horizontalVelocitySign must be -1, 0, or 1';
  if (!s.weapon || typeof s.weapon.kind !== 'string' || typeof s.weapon.isDefault !== 'boolean') return 'weapon summary missing';
  if (!['slow', 'normal', 'fast'].includes(s.weapon.fireCadenceClass)) return 'invalid fire cadence class';
  if (!['short', 'normal', 'long'].includes(s.weapon.rangeClass)) return 'invalid range class';
  if (!['narrow', 'normal', 'wide'].includes(s.weapon.coverageClass)) return 'invalid coverage class';
  if (!s.world || !s.world.playfield || !s.world.projectiles) return 'world playfield/projectile summaries missing';
  if (typeof s.world.playfield.roadVisible !== 'boolean') return 'roadVisible must be boolean';
  if (!finite(s.world.worldMotionRevision)) return 'worldMotionRevision missing';
  if (!s.hud || typeof s.hud.matchesSnapshot !== 'boolean') return 'HUD summary missing';
  if (!s.feedback || !s.lastAction) return 'feedback/lastAction summaries missing';
  return null;
}

function assertPlayingPrecondition(s, label) {
  const schema = assertSnapshotSchema(s);
  if (schema) return `${label}: ${schema}`;
  if (s.phase !== 'playing' || s.screen !== 'play') return `${label}: expected playing/play precondition`;
  if (!s.canInteractWithPlayfield || s.overlayBlocking) return `${label}: playfield blocked`;
  if (!s.world.playfield.roadVisible) return `${label}: road not visible`;
  if (s.team.count <= 0 || s.team.visibleCount <= 0) return `${label}: team not alive before trigger`;
  return null;
}

function assertNotAlreadyResult(s, label) {
  if (s.phase === 'result' || s.result !== 'none') return `${label}: scenario already contains terminal result`;
  return null;
}

function createGameDriver(browser) {
  async function evalPage(source) {
    return await browser.eval(`(async function(){ ${source} })()`);
  }

  async function snapshot() {
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') return { __missing: 'getSnapshot' };
      return await window.__gameTest.getSnapshot();
    `);
  }

  async function reset() {
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return { __missing: 'reset' };
      return await window.__gameTest.reset();
    `);
  }

  async function contractInput(action) {
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { __missing: 'input' };
      return await window.__gameTest.input(${JSON.stringify(action)});
    `);
  }

  async function loadScenario(name) {
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { __missing: 'loadScenario' };
      return await window.__gameTest.loadScenario(${JSON.stringify(name)});
    `);
  }

  async function viewportPoint(xRatio, yRatio) {
    return await browser.eval(`(function(){
      const c = Array.from(document.querySelectorAll('canvas')).sort((a,b) =>
        ((b.clientWidth || b.width || 0) * (b.clientHeight || b.height || 0)) -
        ((a.clientWidth || a.width || 0) * (a.clientHeight || a.height || 0))
      )[0];
      const r = c ? c.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
      return { x: r.left + r.width * ${xRatio}, y: r.top + r.height * ${yRatio}, width: r.width, height: r.height };
    })()`);
  }

  async function realStartClick() {
    const buttonPoint = await browser.eval(`(function(){
      const candidates = Array.from(document.querySelectorAll('button,[role="button"],[data-game-control]'));
      function visible(el) {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 20 && r.height > 20 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) > 0.05;
      }
      const btn = candidates.find(el => visible(el) && /start|play|begin|run|开始/.test(((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).toLowerCase()));
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    const p = buttonPoint || await viewportPoint(0.5, 0.78);
    await browser.mouseClick(p.x, p.y);
    await browser.sleep(450);
    return await snapshot();
  }

  async function focusPlayfield() {
    const p = await viewportPoint(0.5, 0.72);
    await browser.mouseClick(p.x, p.y);
    await browser.sleep(80);
  }

  async function holdKey(key, ms) {
    await focusPlayfield();
    await browser.keyDown(key);
    await browser.sleep(ms);
    await browser.keyUp(key);
    await browser.sleep(120);
    return await snapshot();
  }

  async function releaseKeys() {
    await browser.keyUp('ArrowLeft');
    await browser.keyUp('ArrowRight');
    await browser.keyUp('KeyA');
    await browser.keyUp('KeyD');
    await browser.sleep(180);
    return await snapshot();
  }

  async function touchHalf(side, ms) {
    const p = await viewportPoint(side === 'left' ? 0.22 : 0.78, 0.72);
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: p.x, y: p.y, radiusX: 12, radiusY: 12, force: 1, id: 1 }]
    });
    await browser.sleep(ms);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await browser.sleep(120);
    return await snapshot();
  }

  async function wait(ms) {
    return await contractInput({ type: 'wait', durationMs: ms });
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  return {
    browser,
    snapshot,
    reset,
    contractInput,
    loadScenario,
    realStartClick,
    focusPlayfield,
    holdKey,
    releaseKeys,
    touchHalf,
    wait,
    canvasHash
  };
}

const suite = [
  {
    id: 'p0-api-contract',
    level: 'P0',
    name: 'Public API contract and snapshot schema are available',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const api = await browser.eval(`(function(){
        const t = window.__gameTest;
        return {
          has: !!t,
          reset: !!t && typeof t.reset === 'function',
          getSnapshot: !!t && typeof t.getSnapshot === 'function',
          input: !!t && typeof t.input === 'function',
          loadScenario: !!t && typeof t.loadScenario === 'function'
        };
      })()`);
      if (!api.has || !api.reset || !api.getSnapshot || !api.input || !api.loadScenario) {
        return FAIL(`missing public API methods: ${JSON.stringify(api)}`);
      }
      const s = await game.reset();
      const err = assertSnapshotSchema(s);
      if (err) return FAIL(err);
      if (s.phase === 'playing' && s.overlayBlocking) return FAIL('playing snapshot reports blocking overlay');
      return PASS(`phase=${s.phase}, screen=${s.screen}`);
    }
  },
  {
    id: 'p0-boot-visible-scene',
    level: 'P0',
    name: 'Boot has no fatal errors and exposes a visible scene surface',
    timeoutMs: 12000,
    async run({ browser }) {
      await browser.sleep(800);
      const canvas = await browser.getCanvasSize();
      const domSurface = await browser.eval("(function(){ const body = document.body; if (!body) return null; const visible = Array.from(body.children).map(el => { const rect = el.getBoundingClientRect(); const style = getComputedStyle(el); return { width: rect.width, height: rect.height, visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.05 }; }).filter(item => item.visible); return visible.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null; })()");
      const hasCanvas = !!(canvas && canvas.cssW > 0 && canvas.cssH > 0);
      const hasDomSurface = !!(domSurface && domSurface.width > 0 && domSurface.height > 0);
      if (!hasCanvas && !hasDomSurface) return FAIL('no visible canvas or DOM/CSS playfield surface');
      const l2 = await browser.eval(`(function(){ return window.__l2 ? {
        frames: window.__l2.frameCount,
        draws: window.__l2.drawCalls,
        errors: window.__l2._rafErrCount
      } : null; })()`);
      const hash = await browser.canvasPixelHash();
      if (!finite(hash)) return FAIL('unable to capture visible scene hash');
      if (l2 && l2.errors > 0) return FAIL(`RAF callback errors observed: ${l2.errors}`);
      if (!hasCanvas) return PASS('dom=' + Math.round(domSurface.width) + 'x' + Math.round(domSurface.height) + ', hash=' + hash);
      return PASS(`canvas=${canvas.cssW}x${canvas.cssH}, hash=${hash}`);
    }
  },
  {
    id: 'p1-real-click-start-playable',
    level: 'P1',
    name: 'Real pointer start enters an unblocked playable scene',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const menu = await game.loadScenario('fresh_menu');
      const menuErr = assertSnapshotSchema(menu);
      if (menuErr) return FAIL(`fresh_menu invalid: ${menuErr}`);
      if (menu.phase !== 'menu' && menu.screen !== 'start') return FAIL('fresh_menu is not a start/menu precondition');
      const beforeHash = await game.canvasHash();
      const after = await game.realStartClick();
      const err = assertPlayingPrecondition(after, 'after real pointer start');
      if (err) return FAIL(err);
      if (!after.hud.scoreVisible || !after.hud.teamCountVisible || !after.hud.weaponVisible || !after.hud.matchesSnapshot) {
        return FAIL('playable HUD is not visible and synchronized after start');
      }
      const afterHash = await game.canvasHash();
      if (beforeHash === afterHash) return FAIL('visible scene hash did not change after real start input');
      return PASS(`team=${after.team.count}, score=${after.score}`);
    }
  },
  {
    id: 'p1-keyboard-direction-opposite-chain',
    level: 'P1',
    name: 'Keyboard left/right movement has direction opposite screen deltas and release trend',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadScenario('fresh_run');
      const preErr = assertPlayingPrecondition(start, 'fresh_run');
      if (preErr) return FAIL(preErr);
      const terminalErr = assertNotAlreadyResult(start, 'fresh_run');
      if (terminalErr) return FAIL(terminalErr);

      const left = await game.holdKey('ArrowLeft', 420);
      const leftDelta = left.team.center.screenX - start.team.center.screenX;
      const leftSign = Math.sign(leftDelta);
      if (!(leftSign < 0)) return FAIL(`ArrowLeft did not move team left on screen: delta=${leftDelta}`);
      if (!(left.team.horizontalVelocitySign <= 0)) return FAIL(`ArrowLeft velocity sign not left/settled: ${left.team.horizontalVelocitySign}`);

      const released = await game.releaseKeys();
      const afterReleaseWait = await game.wait(260);
      const releaseDelta = afterReleaseWait.team.center.screenX - released.team.center.screenX;
      if (Math.abs(releaseDelta) >= Math.abs(leftDelta) * 0.75) {
        return FAIL(`release did not reduce horizontal trend: releaseDelta=${releaseDelta}, leftDelta=${leftDelta}`);
      }
      const snapshotsWithWorld = [start, released, afterReleaseWait];
      const worldWasObservable = snapshotsWithWorld.some(snapshot => {
        const world = snapshot.world || {};
        const projectiles = world.projectiles || {};
        return (Array.isArray(world.gates) && world.gates.length > 0) ||
          (Array.isArray(world.obstacles) && world.obstacles.length > 0) ||
          (Array.isArray(world.enemies) && world.enemies.length > 0) ||
          world.boss != null ||
          Number(projectiles.visibleCount) > 0;
      });
      if (worldWasObservable &&
          afterReleaseWait.world.worldMotionRevision <= start.world.worldMotionRevision &&
          afterReleaseWait.world.projectiles.revision <= start.world.projectiles.revision) {
        return FAIL('release stopped world/projectile progression');
      }

      const beforeRight = afterReleaseWait;
      const right = await game.holdKey('ArrowRight', 420);
      const rightDelta = right.team.center.screenX - beforeRight.team.center.screenX;
      const rightSign = Math.sign(rightDelta);
      if (!(rightSign > 0)) return FAIL(`ArrowRight did not move team right on screen: delta=${rightDelta}`);
      if (Math.sign(leftDelta) !== -Math.sign(rightDelta)) {
        return FAIL(`direction opposite relation failed: left=${leftDelta}, right=${rightDelta}`);
      }
      if (right.phase !== 'playing' || right.overlayBlocking || !right.hud.matchesSnapshot) {
        return FAIL('movement left the game blocked or HUD unsynchronized');
      }
      return PASS(`direction opposite deltas left=${leftDelta.toFixed(2)}, right=${rightDelta.toFixed(2)}`);
    }
  },
  {
    id: 'p1-touch-direction-opposite-chain',
    level: 'P1',
    name: 'Touch half-screen controls produce opposite visible directions',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadScenario('fresh_run');
      const preErr = assertPlayingPrecondition(start, 'fresh_run');
      if (preErr) return FAIL(preErr);
      const left = await game.touchHalf('left', 430);
      const leftDelta = left.team.center.screenX - start.team.center.screenX;
      if (!(Math.sign(leftDelta) < 0)) return FAIL(`left touch did not move left: delta=${leftDelta}`);
      await game.releaseKeys();
      const midpoint = await game.wait(180);
      const right = await game.touchHalf('right', 430);
      const rightDelta = right.team.center.screenX - midpoint.team.center.screenX;
      if (!(Math.sign(rightDelta) > 0)) return FAIL(`right touch did not move right: delta=${rightDelta}`);
      if (Math.sign(leftDelta) !== -Math.sign(rightDelta)) {
        return FAIL(`direction opposite touch proof failed: left=${leftDelta}, right=${rightDelta}`);
      }
      if (!right.canInteractWithPlayfield || right.phase !== 'playing' || !right.hud.matchesSnapshot) {
        return FAIL('touch movement broke playable/HUD state');
      }
      return PASS(`touch direction opposite signs ${Math.sign(leftDelta)} and ${Math.sign(rightDelta)}`);
    }
  },
  {
    id: 'p1-boundary-and-reverse-control',
    level: 'P1',
    name: 'Held movement respects road bounds and reverse input recovers',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadScenario('fresh_run');
      const preErr = assertPlayingPrecondition(start, 'fresh_run');
      if (preErr) return FAIL(preErr);
      let s = start;
      for (let i = 0; i < 5; i++) s = await game.holdKey('ArrowLeft', 320);
      const margin = Math.max(4, (s.team.bounds.right - s.team.bounds.left) * 0.04);
      // roadBoundsAtTeam describes the legal formation-center range.  The
      // public team.bounds are the outer member bounds, so comparing those
      // two spaces rejects a correctly clamped formation at the edge.  Use
      // the actual visible road bounds for the outer team envelope.
      const road = s.world?.playfield?.bounds || null;
      const roadLeft = finite(road?.left) ? road.left : s.team.roadBoundsAtTeam.left;
      if (s.team.bounds.left < roadLeft - margin) {
        return FAIL(`team exceeded left road bound: team=${s.team.bounds.left}, road=${roadLeft}`);
      }
      const edgeX = s.team.center.screenX;
      const right = await game.holdKey('ArrowRight', 520);
      const reverseDelta = right.team.center.screenX - edgeX;
      if (!(Math.sign(reverseDelta) > 0)) return FAIL(`reverse input did not move away from left boundary: delta=${reverseDelta}`);
      const rightRoad = right.world?.playfield?.bounds || road;
      const rightRoadEdge = finite(rightRoad?.right) ? rightRoad.right : right.team.roadBoundsAtTeam.right;
      if (right.team.bounds.right > rightRoadEdge + margin) {
        return FAIL(`team exceeded right road bound after reverse: team=${right.team.bounds.right}, road=${rightRoadEdge}`);
      }
      return PASS(`reverseDelta=${reverseDelta.toFixed(2)}`);
    }
  },
  {
    id: 'p1-auto-fire-target-coupling',
    level: 'P1',
    name: 'Automatic fire changes a shootable gate through projectile and feedback evidence',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('shootable_gate');
      const preErr = assertPlayingPrecondition(pre, 'shootable_gate');
      if (preErr) return FAIL(preErr);
      const terminalErr = assertNotAlreadyResult(pre, 'shootable_gate');
      if (terminalErr) return FAIL(terminalErr);
      const gate = firstActive(pre.world.gates);
      if (!gate) return FAIL('shootable_gate has no visible gate precondition');
      if (gate.used || gate.status === 'processed') return FAIL('shootable_gate already processed before trigger');
      const beforeTeam = pre.team.count;
      const beforeGate = targetSig(gate);
      let after = pre;
      let afterGate = gate;
      for (let i = 0; i < 8; i++) {
        after = await game.wait(1000);
        afterGate = (after.world.gates || []).find(g => g.id === gate.id) || null;
        const gateChanged = afterGate
          ? targetSig(afterGate) !== beforeGate
          : after.feedback.gateChangeRevision > pre.feedback.gateChangeRevision;
        if (gateChanged) break;
      }
      if (after.team.count !== beforeTeam) return FAIL('waiting for fire settled team count before gate collision');
      if (!(after.world.projectiles.revision > pre.world.projectiles.revision || after.world.projectiles.visibleCount > pre.world.projectiles.visibleCount)) {
        return FAIL('projectile summary did not advance while firing at gate');
      }
      if (!afterGate && after.feedback.gateChangeRevision <= pre.feedback.gateChangeRevision) return FAIL('gate public summary did not change after automatic fire');
      if (afterGate && targetSig(afterGate) === beforeGate) return FAIL('gate public summary did not change after automatic fire');
      if (!(after.feedback.gateChangeRevision > pre.feedback.gateChangeRevision)) {
        return FAIL('gate hit feedback revision did not advance');
      }
      return PASS(`gate ${gate.id || 'target'} changed via fire`);
    }
  },
  {
    id: 'p1-gate-reward-risk-single-settlement',
    level: 'P1',
    name: 'Positive and negative gate routes change team in opposite directions and settle once',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function runGateRoute(polarity) {
        const pre = await game.loadScenario('gate_choice');
        const preErr = assertPlayingPrecondition(pre, `gate_choice ${polarity}`);
        if (preErr) return { error: preErr };
        const terminalErr = assertNotAlreadyResult(pre, 'gate_choice');
        if (terminalErr) return { error: terminalErr };
        const gate = (pre.world.gates || []).find(g => g.polarity === polarity && !g.used) || null;
        if (!gate) return { error: `no ${polarity} gate precondition` };
        if (gate.used || gate.status === 'processed') return { error: `${polarity} gate already settled before trigger` };
        const alreadyAligned = gate.bounds && pre.team.bounds &&
          gate.bounds.left <= pre.team.bounds.right &&
          gate.bounds.right >= pre.team.bounds.left &&
          gate.bounds.top <= pre.team.bounds.bottom &&
          gate.bounds.bottom >= pre.team.bounds.top;
        const needsSteering = !alreadyAligned;
        let after = pre;
        let matched = null;
        for (let i = 0; i < 12; i++) {
          matched = (after.world.gates || []).find(g => g.id === gate.id) || null;
          const settled = after.team.count !== pre.team.count ||
            (matched && (matched.used || ['processed', 'offscreen'].includes(matched.status)));
          if (settled) break;
          if (needsSteering) {
            const currentGate = matched || gate;
            const gateX = Number(currentGate?.center?.screenX);
            const teamX = Number(after.team?.center?.screenX);
            if (Number.isFinite(gateX) && Number.isFinite(teamX) && Math.abs(gateX - teamX) > 8) {
              after = await game.holdKey(gateX < teamX ? 'ArrowLeft' : 'ArrowRight', 160);
            }
          }
          after = await game.wait(800);
        }
        matched = (after.world.gates || []).find(g => g.id === gate.id) || null;
        const repeatBase = after.team.count;
        const repeat = await game.wait(700);
        return { pre, after, repeat, gate, matched, repeatBase };
      }
      const positive = await runGateRoute('positive');
      if (positive.error) return FAIL(positive.error);
      const positiveDelta = positive.after.team.count - positive.pre.team.count;
      if (!(Math.sign(positiveDelta) > 0)) return FAIL(`positive gate did not increase team: delta=${positiveDelta}`);
      if (positive.matched && !(positive.matched.used || ['processed', 'offscreen'].includes(positive.matched.status))) {
        return FAIL('positive gate did not become used/processed/offscreen');
      }
      if (positive.repeat.team.count !== positive.repeatBase) return FAIL('positive gate settled more than once');

      const negative = await runGateRoute('negative');
      if (negative.error) return FAIL(negative.error);
      const negativeDelta = negative.after.team.count - negative.pre.team.count;
      if (!(Math.sign(negativeDelta) < 0)) return FAIL(`negative gate did not reduce team: delta=${negativeDelta}`);
      if (negative.matched && !(negative.matched.used || ['processed', 'offscreen'].includes(negative.matched.status))) {
        return FAIL('negative gate did not become used/processed/offscreen');
      }
      if (negative.repeat.team.count !== negative.repeatBase) return FAIL('negative gate settled more than once');
      if (!positive.after.hud.matchesSnapshot || !negative.after.hud.matchesSnapshot) return FAIL('gate result not synchronized to HUD');
      return PASS(`positiveDelta=${positiveDelta}, negativeDelta=${negativeDelta}`);
    }
  },
  {
    id: 'p1-obstacle-weapon-benefit-chain',
    level: 'P1',
    name: 'Obstacle damage leads to weapon pickup with visible firepower benefit',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('weapon_upgrade_comparison');
      const preErr = assertPlayingPrecondition(pre, 'weapon_upgrade_comparison');
      if (preErr) return FAIL(preErr);
      if (!pre.weapon.isDefault) return FAIL('weapon comparison scenario does not start with default weapon');
      const obstacle = firstActive(pre.world.obstacles);
      if (!obstacle) return FAIL('weapon comparison has no obstacle precondition');
      if (['destroyed', 'processed', 'offscreen'].includes(obstacle.status)) return FAIL('obstacle already processed before trigger');
      // The fixture deliberately places the obstacle in the team lane.  A
      // centered target does not require lateral steering; moving right on an
      // equality tie makes the check dodge its own target and can suppress
      // the public projectile/weapon path.  Only steer when the target is
      // visibly offset, and keep the correction short enough to preserve the
      // lane overlap.
      let aligned = pre;
      for (let i = 0; i < 8; i++) {
        const currentObstacle = (aligned.world.obstacles || []).find(o => o.id === obstacle.id);
        const obstacleCenter = currentObstacle && currentObstacle.center && Number(currentObstacle.center.screenX);
        const teamCenter = aligned.team && aligned.team.center && Number(aligned.team.center.screenX);
        const obstacleBounds = currentObstacle && currentObstacle.bounds;
        const teamBounds = aligned.team && aligned.team.bounds;
        const boundsOverlap = obstacleBounds && teamBounds &&
          Number.isFinite(obstacleBounds.left) && Number.isFinite(obstacleBounds.right) &&
          Number.isFinite(teamBounds.left) && Number.isFinite(teamBounds.right) &&
          obstacleBounds.left <= teamBounds.right && obstacleBounds.right >= teamBounds.left;
        if (boundsOverlap || !Number.isFinite(obstacleCenter) || !Number.isFinite(teamCenter) ||
            Math.abs(obstacleCenter - teamCenter) <= 8) break;
        aligned = await game.holdKey(
          obstacleCenter < teamCenter ? 'ArrowLeft' : 'ArrowRight',
          160
        );
      }
      let damaged = aligned;
      let afterObstacle = obstacle;
      for (let i = 0; i < 10; i++) {
        damaged = await game.wait(1000);
        afterObstacle = (damaged.world.obstacles || []).find(o => o.id === obstacle.id) || null;
        const changed = afterObstacle &&
          (afterObstacle.hp < obstacle.hp || afterObstacle.hpRevision > obstacle.hpRevision ||
            ['damaged', 'destroyed', 'processed', 'offscreen'].includes(afterObstacle.status));
        if (changed) break;
      }
      if (!(damaged.world.projectiles.revision > pre.world.projectiles.revision || damaged.feedback.damageOrHitRevision > pre.feedback.damageOrHitRevision)) {
        return FAIL('no projectile or hit feedback while attacking obstacle');
      }
      if (afterObstacle && !(afterObstacle.hp < obstacle.hp || afterObstacle.hpRevision > obstacle.hpRevision || ['damaged', 'destroyed', 'processed', 'offscreen'].includes(afterObstacle.status))) {
        return FAIL('obstacle durability/status did not change');
      }
      let upgraded = damaged;
      for (let i = 0; i < 10 && upgraded.weapon.isDefault; i++) upgraded = await game.wait(1000);
      if (upgraded.weapon.isDefault) return FAIL('weapon did not upgrade after obstacle destruction path');
      const classChanged =
        upgraded.weapon.fireCadenceClass !== pre.weapon.fireCadenceClass ||
        upgraded.weapon.rangeClass !== pre.weapon.rangeClass ||
        upgraded.weapon.coverageClass !== pre.weapon.coverageClass;
      if (!classChanged) return FAIL('upgraded weapon has no cadence/range/coverage benefit');
      if (!upgraded.hud.weaponVisible || !upgraded.hud.matchesSnapshot) return FAIL('weapon pickup not synchronized to HUD');
      const actionableTarget = (upgraded.world.enemies || []).some(e => ['approaching', 'tracking'].includes(e.status)) ||
        (upgraded.world.gates || []).some(g => !g.used) ||
        (upgraded.world.obstacles || []).some(o => o.hp > 0 && !['processed', 'destroyed', 'offscreen'].includes(o.status)) ||
        !!(upgraded.world.boss && upgraded.world.boss.status !== 'defeated');
      if (actionableTarget) {
        const postFire = await game.wait(600);
        if (!(postFire.world.projectiles.revision > upgraded.world.projectiles.revision || postFire.feedback.damageOrHitRevision > upgraded.feedback.damageOrHitRevision)) {
          return FAIL('upgraded weapon did not produce projectile/target evidence while an actionable target remained');
        }
      }
      return PASS(`weapon ${pre.weapon.kind} -> ${upgraded.weapon.kind}`);
    }
  },
  {
    id: 'p1-enemy-risk-score-or-loss',
    level: 'P1',
    name: 'Enemy pressure couples visible enemy motion to score or team loss',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('enemy_pressure');
      const preErr = assertPlayingPrecondition(pre, 'enemy_pressure');
      if (preErr) return FAIL(preErr);
      const enemy = firstActive(pre.world.enemies);
      if (!enemy) return FAIL('enemy_pressure has no enemy precondition');
      if (['defeated', 'contacted', 'offscreen'].includes(enemy.status)) return FAIL('enemy already resolved before trigger');
      let after = pre;
      let matched = enemy;
      // The fixture starts the enemy at a public distance of 950 while
      // projectiles and the runner advance independently. One 1300ms sample
      // can observe a shot in flight but still precede both a kill and a
      // collision. Continue in bounded public wait windows until the enemy
      // resolves or the check's ordinary interaction budget is exhausted.
      for (let i = 0; i < 8; i++) {
        after = await game.wait(700);
        matched = (after.world.enemies || []).find(e => e.id === enemy.id) || firstActive(after.world.enemies);
        if (matched && ['defeated', 'contacted', 'offscreen'].includes(matched.status)) break;
        if (after.score > pre.score || after.team.count < pre.team.count) break;
      }
      const enemyChanged = matched && (targetSig(matched) !== targetSig(enemy) || matched.motionRevision > enemy.motionRevision);
      if (!enemyChanged && !(after.world.worldMotionRevision > pre.world.worldMotionRevision)) {
        return FAIL('enemy did not visibly move or change status');
      }
      if (!(after.world.projectiles.revision > pre.world.projectiles.revision || after.feedback.damageOrHitRevision > pre.feedback.damageOrHitRevision)) {
        return FAIL('enemy pressure did not couple with projectiles or hit feedback');
      }
      const scoreDelta = after.score - pre.score;
      const teamDelta = after.team.count - pre.team.count;
      const defeated = matched && matched.status === 'defeated';
      const contacted = matched && matched.status === 'contacted';
      if (defeated && !(scoreDelta > 0)) return FAIL('defeated enemy did not increase score');
      if (contacted && !(teamDelta < 0)) return FAIL('contacted enemy did not reduce team');
      if (!defeated && !contacted && !(scoreDelta > 0 || teamDelta < 0)) {
        return FAIL('enemy interaction produced no score or risk outcome');
      }
      if (!after.hud.matchesSnapshot) return FAIL('enemy outcome not synchronized to HUD');
      return PASS(`scoreDelta=${scoreDelta}, teamDelta=${teamDelta}`);
    }
  },
  {
    id: 'p1-failure-lock-and-restart-cleanup',
    level: 'P1',
    name: 'Failure result locks play and restart creates a clean new run',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('near_failure');
      const preErr = assertPlayingPrecondition(pre, 'near_failure');
      if (preErr) return FAIL(preErr);
      if (pre.team.count > Math.max(3, pre.team.visibleCount)) return FAIL('near_failure is not a low-team precondition');
      let result = pre;
      for (let i = 0; i < 8 && result.phase !== 'result'; i++) result = await game.wait(650);
      if (result.phase !== 'result' || result.result !== 'lose') return FAIL(`near_failure did not reach lose result, phase=${result.phase}`);
      if (!finite(result.finalScore) || result.finalScore < 0) return FAIL('finalScore is not visible/non-negative');
      if (!result.hud.resultVisible && !result.feedback.resultVisible) return FAIL('result visibility not reported');
      const lockedBefore = result;
      await browser.keyDown('ArrowLeft');
      await browser.sleep(420);
      await browser.keyUp('ArrowLeft');
      await browser.sleep(120);
      const lockedAfter = await game.wait(500);
      if (lockedAfter.phase !== 'result' || lockedAfter.result !== 'lose') return FAIL('play input left terminal result state');
      if (lockedAfter.score !== lockedBefore.score || lockedAfter.team.count !== lockedBefore.team.count) {
        return FAIL('terminal state still changes score or team after play input');
      }
      const restarted = await game.contractInput({ type: 'restart', via: 'api' });
      const restartErr = assertPlayingPrecondition(restarted, 'restart result');
      if (restartErr) return FAIL(restartErr);
      if (restarted.score !== 0 || restarted.finalScore !== null || !restarted.weapon.isDefault) {
        return FAIL('restart did not clear score/finalScore/default weapon');
      }
      if (restarted.overlayBlocking || !restarted.hud.matchesSnapshot) return FAIL('restart left blocking overlay or unsynchronized HUD');
      return PASS('terminal lock and restart cleanup verified');
    }
  },
  {
    id: 'p1-invalid-action-and-invariants',
    level: 'P1',
    name: 'Invalid actions are rejected and public invariants are conserved',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const menu = await game.loadScenario('fresh_menu');
      const schema = assertSnapshotSchema(menu);
      if (schema) return FAIL(`fresh_menu invalid: ${schema}`);
      const before = await game.snapshot();
      const invalid = await game.contractInput({ type: 'setScore', value: 99999 });
      const after = await game.snapshot();
      const rejected = invalid && invalid.lastAction && invalid.lastAction.accepted === false;
      if (!rejected && !sameCore(before, after)) return FAIL('cheat-like invalid action changed core state');
      if (after.team.count < 0 || after.team.visibleCount < 0 || after.score < 0) {
        return FAIL('non-negative invariant violated after invalid action');
      }
      const playInput = await game.contractInput({ type: 'holdDirection', direction: 'left', durationMs: 250, via: 'api' });
      const afterMenuInput = await game.snapshot();
      if (menu.phase === 'menu' && !sameCore(after, afterMenuInput) && !(playInput.lastAction && playInput.lastAction.accepted === false)) {
        return FAIL('menu accepted play movement before start');
      }
      return PASS('invalid action rejected or conserved state');
    }
  },
  {
    id: 'p2-progression-threat-growth',
    level: 'P2',
    name: 'Sustained play advances wave or difficulty with world changes',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('fresh_run');
      const preErr = assertPlayingPrecondition(pre, 'fresh_run progression');
      if (preErr) return FAIL(preErr);
      let after = pre;
      let progressed = false;
      let worldChanged = false;
      let threatsChanged = false;
      const hasProgressionThreatChange = (before, candidate) => {
        const groups = [
          { before: before.world.enemies || [], after: candidate.world.enemies || [] },
          { before: before.world.gates || [], after: candidate.world.gates || [] },
          { before: before.world.obstacles || [], after: candidate.world.obstacles || [] }
        ];
        const targetConfigChanged = groups.some(({ before: beforeTargets, after: afterTargets }) => {
          const beforeIds = new Set(beforeTargets.map((target) => target.id));
          if (afterTargets.length > beforeTargets.length || afterTargets.some((target) => !beforeIds.has(target.id))) return true;
          const beforeById = new Map(beforeTargets.map((target) => [target.id, target]));
          return afterTargets.some((target) => {
            const previous = beforeById.get(target.id);
            return previous && (
              previous.value !== target.value ||
              previous.valueRevision !== target.valueRevision ||
              previous.hp !== target.hp ||
              previous.hpMax !== target.hpMax ||
              previous.hpRevision !== target.hpRevision
            );
          });
        });
        const bossChanged = (!before.world.boss && candidate.world.boss) ||
          (before.world.boss && candidate.world.boss &&
            (before.world.boss.hp !== candidate.world.boss.hp || before.world.boss.hpMax !== candidate.world.boss.hpMax));
        return targetConfigChanged || bossChanged;
      };
      for (let i = 0; i < 26 && after.phase === 'playing'; i++) {
        after = await game.wait(1000);
        if (!after || (after.phase !== 'playing' && after.phase !== 'result')) break;
        progressed = progressed || after.wave > pre.wave || after.difficultyTier > pre.difficultyTier;
        worldChanged = worldChanged || after.world.worldMotionRevision > pre.world.worldMotionRevision;
        threatsChanged = threatsChanged || hasProgressionThreatChange(pre, after);
      }
      if (after.phase !== 'playing' && after.phase !== 'result') return FAIL(`unexpected phase during progression: ${after.phase}`);
      if (!progressed) return FAIL('wave/difficulty did not advance during sustained play');
      if (!worldChanged || !threatsChanged) return FAIL('progression is not coupled to visible world/threat changes');
      return PASS(`wave ${pre.wave}->${after.wave}, tier ${pre.difficultyTier}->${after.difficultyTier}`);
    }
  },
  {
    id: 'p2-boss-pressure-contract',
    level: 'P2',
    name: 'Boss pressure scenario exposes HP, warning/attack, or defeat pressure',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('boss_pressure');
      if (pre && pre.lastAction && pre.lastAction.accepted === false) return FAIL('boss_pressure scenario rejected');
      const preErr = assertPlayingPrecondition(pre, 'boss_pressure');
      if (preErr) return FAIL(preErr);
      if (!pre.world.boss) return FAIL('boss_pressure has no boss summary');
      if (!(finite(pre.world.boss.hp) && finite(pre.world.boss.hpMax) && pre.world.boss.hp > 0 && pre.world.boss.hpMax >= pre.world.boss.hp)) {
        return FAIL('boss hp summary invalid');
      }
      let after = pre;
      let pressureObserved = false;
      for (let i = 0; i < 16; i++) {
        after = await game.wait(i === 0 ? 1400 : 1000);
        const boss = after.world.boss;
        const hpChanged = boss && boss.hp !== pre.world.boss.hp;
        const pressureChanged = boss && (boss.warningActive !== pre.world.boss.warningActive || boss.attackRevision > pre.world.boss.attackRevision || boss.status !== pre.world.boss.status);
        const resolved = !boss && (after.score > pre.score || after.feedback.damageOrHitRevision > pre.feedback.damageOrHitRevision);
        if (hpChanged || pressureChanged || resolved) {
          pressureObserved = true;
          break;
        }
      }
      if (!pressureObserved) return FAIL('boss did not show hp, warning, or defeat pressure after bounded wait');
      if (!after.hud.matchesSnapshot) return FAIL('boss pressure state not synchronized to HUD');
      return PASS('boss pressure observable');
    }
  }
];

module.exports = { suite };
