// === GDD Coverage Map ===
// M1 (启动、加载与可玩入口) -> p0-boot-no-fatal, p0-contract-schema
// M2 (关卡选择与难度列表) -> p1-real-click-level-entry, p2-level-depth
// M3 (拼图区与托盘布局) -> p0-contract-schema, p2-render-and-feedback-observable
// M4 (真实拖拽输入) -> p1-real-mouse-drag-direction, p1-real-touch-drag-connects
// M5 (正确吸附) -> p1-real-correct-drop-connects, p1-real-touch-drag-connects
// M6 (错误拒绝) -> p1-real-wrong-drop-rejected, p2-invalid-action-rejected
// M7 (完成与继续) -> p1-final-piece-completes, p2-next-progresses
// M8 (重开/返回流程) -> p2-restart-clears-progress
// M9 (表现反馈) -> p2-render-and-feedback-observable
// M10 (长线进度与可选设置) -> p2-level-depth, p2-next-progresses
//
// === Category Map ===
// Boot & Stability: p0-boot-no-fatal, p0-contract-schema
// UI Flow & Blocking: p1-real-click-level-entry
// Input Semantics: p1-real-mouse-drag-direction, p1-real-touch-drag-connects
// Core Mechanic Loop: p1-real-correct-drop-connects, p1-real-touch-drag-connects, p1-final-piece-completes
// State Machine: p1-final-piece-completes, p2-next-progresses, p2-restart-clears-progress
// Economy/Progression: p2-level-depth, p2-next-progresses
// Feedback & Observability: p2-render-and-feedback-observable
// Invariants & Rejection: p1-real-wrong-drop-rejected, p2-invalid-action-rejected, p2-restart-clears-progress
// Depth/Optional Systems: p2-level-depth
//
// === Rationality Map ===
// p1-real-click-level-entry: M2/M3 | real action: mouse click visible level/start control | independent observation: phase + pieceCount + overlay fields | empty-shell failure: inert menu or blocking overlay fails
// p1-real-mouse-drag-direction: M4 | real action: browser mouse down/move right/left | independent observation: piece screenX and visualRevision | empty-shell failure: no drag response or mirrored movement fails
// p1-real-touch-drag-connects: M4/M5 | real action: browser touchStart/touchMove/touchEnd from piece to target | independent observation: connectedCount + piece status + visualRevision/progressText | empty-shell failure: mouse-only or API-only puzzle fails
// p1-real-correct-drop-connects: M5 | real action: browser mouse drag to piece target | independent observation: connectedCount + piece status + progressText | empty-shell failure: API-only progress or missing snap fails
// p1-real-wrong-drop-rejected: M6 | real action: browser mouse drag to wrong point | independent observation: unchanged connectedCount + errorRevision/lastAction | empty-shell failure: accepting all drops or mutating totals fails
// p1-final-piece-completes: M7 | real action: final legal mouse drop after one_piece_remaining setup | independent observation: phase/completionVisible/nextAvailable | empty-shell failure: pre-completed scenario or missing completion UI fails
// p2-next-progresses: M7/M10 | real action: DOM/mouse click next or contract next | independent observation: currentLevel/phase/connectedCount/result | empty-shell failure: stuck completion overlay fails
// p2-restart-clears-progress: M8 | real action: contract restart after legal connected setup | independent observation: totalBefore/totalAfter and connected reset | empty-shell failure: reset button hiding UI without state cleanup fails
// p2-invalid-action-rejected: M6/M8 | real action: contract invalid action | independent observation: unchanged snapshot + ok:false/reason | empty-shell failure: accepts unknown action or changes progress fails
// p2-render-and-feedback-observable: M3/M5/M9 | real action: correct drag | independent observation: canvasPixelHash/visualRevision/progressText | empty-shell failure: state-only implementation with blank unchanged playfield fails
// p2-level-depth: M2/M10 | contract observation: levels list | independent observation: levelCount + pieceCount range including 50+ catalog and 100+ high difficulty | empty-shell failure: one-level or shallow toy puzzle fails

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }

function createGameDriver(browser) {
  const sleep = (ms) => browser.sleep(ms);

  async function snapshot() {
    return await browser.eval(`
      (function() {
        if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
          return window.__gameTest.getSnapshot();
        }
        return { __missingContract: true };
      })()
    `);
  }

  async function reset(options) {
    return await browser.eval(`
      (function() {
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') {
          return { __missingContract: true };
        }
        return window.__gameTest.reset(${JSON.stringify(options || {})});
      })()
    `);
  }

  async function contractInput(action) {
    return await browser.eval(`
      (function() {
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') {
          return { __missingContract: true };
        }
        return window.__gameTest.input(${JSON.stringify(action)});
      })()
    `);
  }

  async function loadScenario(name, options) {
    return await browser.eval(`
      (function() {
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') {
          return { __missingContract: true };
        }
        return window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})});
      })()
    `);
  }

  async function waitForPhase(phase, timeoutMs) {
    const deadline = Date.now() + (timeoutMs || 2500);
    let state = await snapshot();
    while (state && !state.__missingContract && state.phase !== phase && Date.now() < deadline) {
      await sleep(100);
      state = await snapshot();
    }
    return state;
  }

  async function uiState() {
    return await browser.eval(`
      (function() {
        const visible = Array.from(document.querySelectorAll('body *'))
          .filter(el => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none' && !el.disabled &&
              (cs.cursor === 'pointer' || el.matches('button,[role="button"],a,input,[data-game-control],[aria-label],[title],[onclick],[tabindex]'));
          })
          .map(el => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return {
              tag: el.tagName || '',
              text: [el.innerText, el.textContent, el.getAttribute('aria-label'), el.getAttribute('title')].filter(Boolean).join(' ').trim(),
              role: el.getAttribute('role') || '',
              ariaLabel: el.getAttribute('aria-label') || '',
              title: el.getAttribute('title') || '',
              control: el.getAttribute('data-game-control') || '',
              levelIndex: el.getAttribute('data-level-index') || '',
              cursor: cs.cursor || '',
              left: r.left, top: r.top, width: r.width, height: r.height
            };
          });
        return { controls: visible };
      })()
    `);
  }

  async function clickFirstLevelOrStart() {
    const ui = await uiState();
    const controls = (ui && ui.controls) || [];
    const entrySemantics = /\b(level|start|play|begin|enter|go|select|puzzle|stage|continue)\b/i;
    const preferred = controls.filter(c => c.control === 'level-card' || c.control === 'start' || c.levelIndex || entrySemantics.test(c.text));
    const semantic = controls.filter(c =>
      c.tag === 'BUTTON' || c.tag === 'A' || c.tag === 'INPUT' || c.role === 'button' || c.control || c.levelIndex || c.ariaLabel || c.title || c.cursor === 'pointer'
    );
    const candidates = [];
    for (const c of preferred.concat(semantic)) {
      if (!candidates.includes(c)) candidates.push(c);
    }
    if (!candidates.length) {
      return { clicked: false, detail: 'no visible level/start control discovered' };
    }
    for (const candidate of candidates) {
      await browser.mouseClick(candidate.left + candidate.width / 2, candidate.top + candidate.height / 2);
      await sleep(700);
      const after = await snapshot();
      if (after && after.phase === 'playing') return { clicked: true, control: candidate };
      await reset({ phase: 'selection' });
      await waitForPhase('selection', 2500);
    }
    return { clicked: false, detail: 'visible controls did not enter playing' };
  }

  async function realMouseDrag(from, to, steps) {
    const count = steps || 8;
    await browser.mouseMove(from.x, from.y);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1, modifiers: 0 });
    for (let i = 1; i <= count; i++) {
      const t = i / count;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      await browser.mouseMove(x, y, x - from.x, y - from.y);
      await sleep(35);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', clickCount: 1, modifiers: 0 });
    await sleep(850);
  }

  async function realTouchDrag(from, to, steps) {
    const count = steps || 8;
    const point = (x, y) => ({ x, y, radiusX: 4, radiusY: 4, force: 0.8, id: 1 });
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point(from.x, from.y)],
      modifiers: 0
    });
    await sleep(80);
    for (let i = 1; i <= count; i++) {
      const t = i / count;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [point(x, y)],
        modifiers: 0
      });
      await sleep(45);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
      modifiers: 0
    });
    await sleep(850);
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  function firstDraggable(snap) {
    const pieces = Array.isArray(snap && snap.pieces) ? snap.pieces : [];
    return pieces.find(p => p && p.draggable !== false && p.status !== 'connected' && Number.isFinite(p.screenX) && Number.isFinite(p.screenY) && p.target);
  }

  function wrongPoint(snap, piece) {
    const pf = snap && snap.playfield;
    const tray = snap && snap.trayArea;
    const target = piece && piece.target;
    const candidates = [];
    if (tray) candidates.push({ x: tray.left + Math.max(20, tray.width * 0.1), y: tray.top + Math.max(20, tray.height * 0.2) });
    if (pf) candidates.push({ x: pf.left + pf.width * 0.08, y: pf.top + pf.height * 0.5 });
    candidates.push({ x: piece.screenX + 120, y: piece.screenY });
    return candidates.find(pt => !target || Math.hypot(pt.x - target.screenX, pt.y - target.screenY) > Math.max(target.width || 40, target.height || 40)) || candidates[0];
  }

  return { snapshot, reset, contractInput, loadScenario, waitForPhase, clickFirstLevelOrStart, realMouseDrag, realTouchDrag, canvasHash, firstDraggable, wrongPoint };
}

function validSnapshot(s) {
  return s && !s.__missingContract && !s.__l2_err__ && typeof s.phase === 'string' &&
    typeof s.pieceCount === 'number' && typeof s.connectedCount === 'number' &&
    typeof s.trayCount === 'number' && s.playfield && typeof s.playfield.width === 'number';
}

function totalPieces(s) {
  return (Number(s.connectedCount) || 0) + (Number(s.trayCount) || 0);
}

function changed(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

module.exports = {
  suite: [
    {
      id: 'p0-boot-no-fatal',
      level: 'P0',
      name: 'boot no fatal runtime error and visible playfield',
      timeoutMs: 20000,
      async run({ browser }) {
        await browser.sleep(1200);
        if (browser.exceptions.length) return FAIL('runtime exceptions: ' + browser.exceptions.slice(0, 2).map(e => e.description || e.text).join(' | '));
        const size = await browser.getCanvasSize();
        const dom = await browser.eval(`({ bodyText: document.body.innerText.slice(0, 200), hasCanvas: !!document.querySelector('canvas') })`);
        if ((!size || size.cssW < 100 || size.cssH < 100) && !dom.bodyText) return FAIL('no visible canvas or DOM content');
        return PASS('booted with visible content');
      }
    },
    {
      id: 'p0-contract-schema',
      level: 'P0',
      name: 'contract reset and snapshot schema',
      timeoutMs: 20000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const s = await game.reset();
        if (s && s.__missingContract) return FAIL('window.__gameTest.reset missing');
        const snap = validSnapshot(s) ? s : await game.snapshot();
        if (!validSnapshot(snap)) return FAIL('invalid snapshot schema');
        const phases = ['loading', 'selection', 'playing', 'complete'];
        if (!phases.includes(snap.phase)) return FAIL('invalid phase ' + snap.phase);
        if (snap.pieceCount > 0 && totalPieces(snap) !== snap.pieceCount) return FAIL('piece total invariant broken after reset');
        if (snap.playfield.width <= 50 || snap.playfield.height <= 50) return FAIL('playfield geometry too small');
        return PASS('phase=' + snap.phase + ', total=' + snap.pieceCount);
      }
    },
    {
      id: 'p1-real-click-level-entry',
      level: 'P1',
      name: 'real mouse click level entry unblocks playfield',
      timeoutMs: 25000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        await game.reset({ phase: 'selection' });
        let before = await game.waitForPhase('selection', 2500);
        if (!before || before.__missingContract) return FAIL('contract missing');
        if (before.phase !== 'selection') {
          await game.contractInput({ type: 'backToSelection' });
          before = await game.waitForPhase('selection', 1500);
        }
        if (!before || before.phase !== 'selection') return FAIL('selection state unavailable after reset');
        const clicked = await game.clickFirstLevelOrStart();
        if (!clicked.clicked) return FAIL(clicked.detail || 'no visible semantic level/start control');
        const after = await game.snapshot();
        if (after.phase !== 'playing') return FAIL('phase did not enter playing after level/start action');
        if (after.overlayBlocking || !after.canInteractWithPlayfield) return FAIL('playfield blocked after entering playing');
        if (!(after.pieceCount > 0 && Array.isArray(after.pieces) && after.pieces.length > 0)) return FAIL('no playable pieces after entry');
        return PASS('entered playing with ' + after.pieceCount + ' pieces');
      }
    },
    {
      id: 'p1-real-mouse-drag-direction',
      level: 'P1',
      name: 'real mouse drag direction follows screen space',
      timeoutMs: 25000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        let snap = await game.loadScenario('one_correct_piece');
        if (snap.__missingContract) return FAIL('loadScenario missing');
        let piece = game.firstDraggable(snap);
        if (!piece) return FAIL('no draggable piece with screen coordinates');
        const start = { x: piece.screenX, y: piece.screenY };
        const viewport = await browser.eval(`({ width: window.innerWidth })`);
        if (!viewport || !Number.isFinite(viewport.width) || viewport.width <= 2) return FAIL('viewport width unavailable for directional probe');
        const probeDelta = Math.min(80, (viewport.width - 2) / 2);
        if (!(probeDelta > 20)) return FAIL('insufficient in-viewport horizontal margin for directional probe');
        const baseX = Math.min(viewport.width - probeDelta - 1, Math.max(probeDelta + 1, start.x));
        const rightX = baseX + probeDelta;
        const leftX = baseX - probeDelta;
        await browser.mouseMove(start.x, start.y);
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
        await browser.mouseMove(rightX, start.y, rightX - start.x, 0);
        await browser.sleep(120);
        const right = await game.snapshot();
        const movedRight = (right.pieces || []).find(p => p.id === piece.id);
        await browser.mouseMove(leftX, start.y, leftX - rightX, 0);
        await browser.sleep(120);
        const left = await game.snapshot();
        const movedLeft = (left.pieces || []).find(p => p.id === piece.id);
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: leftX, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
        await browser.sleep(500);
        if (!movedRight || !movedLeft) return FAIL('dragging piece disappeared from snapshot');
        const deltaRight = movedRight.screenX - start.x;
        const deltaLeft = movedLeft.screenX - movedRight.screenX;
        const directionOpposite = Math.sign(deltaRight) !== Math.sign(deltaLeft);
        if (!(deltaRight > 20 && deltaLeft < -20 && directionOpposite)) return FAIL('screen-space drag direction not preserved: right=' + deltaRight.toFixed(1) + ', left=' + deltaLeft.toFixed(1));
        if ((right.connectedCount || 0) !== (snap.connectedCount || 0)) return FAIL('direction drag should not connect a piece');
        return PASS('opposite direction deltas observed');
      }
    },
    {
      id: 'p1-real-correct-drop-connects',
      level: 'P1',
      name: 'real mouse drag correct drop connects one piece',
      timeoutMs: 30000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const before = await game.loadScenario('one_correct_piece');
        const piece = game.firstDraggable(before);
        if (!piece) return FAIL('no draggable piece for correct drop');
        const target = piece.target;
        await game.realMouseDrag({ x: piece.screenX, y: piece.screenY }, { x: target.screenX, y: target.screenY }, 10);
        const after = await game.snapshot();
        if (after.connectedCount !== before.connectedCount + 1) return FAIL('connectedCount did not increase by one');
        const placed = (after.pieces || []).find(p => p.id === piece.id);
        if (!placed || placed.status !== 'connected') return FAIL('dragged piece not locked as connected');
        if (totalPieces(after) !== after.pieceCount) return FAIL('total piece invariant broken after correct drop');
        if (after.progressText && !String(after.progressText).includes(String(after.connectedCount))) return FAIL('progressText not synchronized with connectedCount');
        return PASS('connected ' + before.connectedCount + ' -> ' + after.connectedCount);
      }
    },
    {
      id: 'p1-real-touch-drag-connects',
      level: 'P1',
      name: 'real touch drag correct drop connects one piece',
      timeoutMs: 30000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const before = await game.loadScenario('one_correct_piece');
        const piece = game.firstDraggable(before);
        if (!piece) return FAIL('no draggable piece for touch drop');
        const target = piece.target;
        await game.realTouchDrag({ x: piece.screenX, y: piece.screenY }, { x: target.screenX, y: target.screenY }, 10);
        const after = await game.snapshot();
        if (after.connectedCount !== before.connectedCount + 1) return FAIL('touch drag did not increase connectedCount by one');
        const placed = (after.pieces || []).find(p => p.id === piece.id);
        if (!placed || placed.status !== 'connected') return FAIL('touch-dragged piece not locked as connected');
        if (totalPieces(after) !== after.pieceCount) return FAIL('total piece invariant broken after touch drop');
        const visibleDelta = (after.feedback && before.feedback && after.feedback.visualRevision > before.feedback.visualRevision) ||
          (after.progressText && after.progressText !== before.progressText);
        if (!visibleDelta) return FAIL('touch connection did not update visible feedback or progress');
        return PASS('touch connected ' + before.connectedCount + ' -> ' + after.connectedCount);
      }
    },
    {
      id: 'p1-real-wrong-drop-rejected',
      level: 'P1',
      name: 'real mouse wrong drop is rejected unchanged',
      timeoutMs: 30000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const before = await game.loadScenario('wrong_drop');
        const piece = game.firstDraggable(before);
        if (!piece) return FAIL('no draggable piece for wrong drop');
        const totalBefore = totalPieces(before);
        const dest = game.wrongPoint(before, piece);
        await game.realMouseDrag({ x: piece.screenX, y: piece.screenY }, dest, 8);
        const after = await game.snapshot();
        const totalAfter = totalPieces(after);
        const unchanged = after.connectedCount === before.connectedCount && totalBefore === totalAfter;
        if (!unchanged) return FAIL('wrong drop changed progress or total pieces');
        const feedbackChanged = (after.feedback && before.feedback) && (
          after.feedback.errorRevision > before.feedback.errorRevision || after.feedback.lastAction === 'reject'
        );
        if (!feedbackChanged) return FAIL('wrong drop rejected state not observable through feedback');
        return PASS('wrong drop rejected with invariant preserved');
      }
    },
    {
      id: 'p1-final-piece-completes',
      level: 'P1',
      name: 'real mouse final piece triggers completion state',
      timeoutMs: 30000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const before = await game.loadScenario('one_piece_remaining');
        if (before.phase !== 'playing' || before.result !== 'none') return FAIL('scenario is not legal pre-completion playing state');
        const piece = game.firstDraggable(before);
        if (!piece) return FAIL('no final draggable piece');
        await game.realMouseDrag({ x: piece.screenX, y: piece.screenY }, { x: piece.target.screenX, y: piece.target.screenY }, 10);
        await browser.sleep(700);
        const after = await game.snapshot();
        if (after.phase !== 'complete' && after.result !== 'complete') return FAIL('final legal drop did not enter complete state');
        if (!after.completionVisible || !after.nextAvailable) return FAIL('completion layer or next control not available');
        if (after.connectedCount !== after.pieceCount) return FAIL('completion without all pieces connected');
        return PASS('completion visible after final drop');
      }
    },
    {
      id: 'p2-next-progresses',
      level: 'P2',
      name: 'next action leaves completion and advances progression',
      timeoutMs: 25000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const before = await game.loadScenario('completed_level');
        if (!before.nextAvailable) return FAIL('completed scenario lacks nextAvailable');
        const ui = await browser.eval(`
          (function() {
            const el = Array.from(document.querySelectorAll('button,[role="button"],[data-game-control]')).find(b => {
              const ctl = b.getAttribute('data-game-control') || '';
              const r = b.getBoundingClientRect();
              return r.width > 5 && r.height > 5 && ctl === 'next';
            });
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()
        `);
        if (ui && Number.isFinite(ui.x)) {
          await browser.mouseClick(ui.x, ui.y);
        } else {
          await game.contractInput({ type: 'next' });
        }
        await browser.sleep(1200);
        const after = await game.snapshot();
        if (after.phase === 'complete' && after.currentLevel === before.currentLevel) return FAIL('next did not leave current completion state');
        if (after.completionVisible) return FAIL('completion overlay still visible after next');
        if (after.phase === 'playing' && after.connectedCount !== 0) return FAIL('new level did not reset connectedCount');
        return PASS('next progressed to phase=' + after.phase + ', level=' + after.currentLevel);
      }
    },
    {
      id: 'p2-restart-clears-progress',
      level: 'P2',
      name: 'restart clears connected progress while preserving total',
      timeoutMs: 25000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('one_correct_piece');
        const piece = game.firstDraggable(setup);
        if (!piece) return FAIL('no piece to create restart progress');
        await game.realMouseDrag({ x: piece.screenX, y: piece.screenY }, { x: piece.target.screenX, y: piece.target.screenY }, 8);
        const before = await game.snapshot();
        if (before.connectedCount < 1) return FAIL('setup did not create connected progress');
        const totalBefore = totalPieces(before);
        await game.contractInput({ type: 'restart' });
        await browser.sleep(400);
        const after = await game.snapshot();
        const totalAfter = totalPieces(after);
        if (after.connectedCount !== 0) return FAIL('restart did not clear connectedCount');
        if (totalBefore !== totalAfter || totalAfter !== after.pieceCount) return FAIL('restart broke total invariant');
        if (after.result !== 'none' || after.completionVisible) return FAIL('restart left completion state visible');
        return PASS('restart cleared progress with totalBefore=' + totalBefore + ', totalAfter=' + totalAfter);
      }
    },
    {
      id: 'p2-invalid-action-rejected',
      level: 'P2',
      name: 'contract invalid action rejected without mutation',
      timeoutMs: 20000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const before = await game.loadScenario('one_correct_piece');
        const result = await game.contractInput({ type: 'unknown_action', payload: { connectedCount: 999 } });
        const after = await game.snapshot();
        const unchanged = before.phase === after.phase &&
          before.connectedCount === after.connectedCount &&
          before.pieceCount === after.pieceCount &&
          totalPieces(before) === totalPieces(after);
        if (!unchanged) return FAIL('invalid action mutated phase/progress/totals');
        if (!(result && (result.ok === false || result.reason || result.snapshot))) return FAIL('invalid action did not return rejection detail');
        return PASS('invalid action rejected unchanged');
      }
    },
    {
      id: 'p2-render-and-feedback-observable',
      level: 'P2',
      name: 'correct connection changes visible render and feedback',
      timeoutMs: 30000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const before = await game.loadScenario('one_correct_piece');
        const piece = game.firstDraggable(before);
        if (!piece) return FAIL('no draggable piece for feedback check');
        const hashBefore = await game.canvasHash();
        await game.realMouseDrag({ x: piece.screenX, y: piece.screenY }, { x: piece.target.screenX, y: piece.target.screenY }, 10);
        await browser.sleep(600);
        const after = await game.snapshot();
        const hashAfter = await game.canvasHash();
        const feedback = after.feedback && before.feedback && (
          after.feedback.successRevision > before.feedback.successRevision ||
          after.feedback.visualRevision > before.feedback.visualRevision ||
          after.feedback.lastAction === 'connect'
        );
        if (after.connectedCount !== before.connectedCount + 1) return FAIL('connection did not change gameplay progress');
        if (!feedback) return FAIL('success/visual feedback revision did not change');
        if (hashBefore === hashAfter && after.progressText === before.progressText) return FAIL('no visible canvas/HUD change after correct connection');
        return PASS('render/feedback changed after input');
      }
    },
    {
      id: 'p2-level-depth',
      level: 'P2',
      name: 'level list exposes difficulty depth',
      timeoutMs: 20000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const snap = await game.reset();
        const levels = Array.isArray(snap.levels) ? snap.levels : [];
        if (snap.levelCount < 50 || levels.length < 50) return FAIL('level depth too shallow for source long-list expectation');
        const counts = levels.map(l => l && l.pieceCount).filter(n => typeof n === 'number' && isFinite(n));
        if (!counts.some(n => n <= 4)) return FAIL('missing simple starter puzzles');
        if (!counts.some(n => n >= 20 && n <= 30)) return FAIL('missing medium difficulty puzzles');
        if (!counts.some(n => n >= 100)) return FAIL('missing source-scale high difficulty puzzles');
        if (!levels.some(l => l.visible && l.unlocked)) return FAIL('no visible unlocked playable level');
        return PASS('levels=' + snap.levelCount + ', range=' + Math.min(...counts) + '-' + Math.max(...counts));
      }
    }
  ]
};
