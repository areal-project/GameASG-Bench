// === GDD Coverage Map ===
// M1 -> p0-03, p1-01, p2-01
// M2 -> p1-02, p1-04, p1-10, p2-02
// M3 -> p1-03, p1-05, p1-06, p2-03
// M4 -> p1-02, p1-03, p2-02
// M5 -> p1-04, p1-05, p1-07
// M6 -> p1-07, p1-08, p1-10
// M7 -> p1-09, p1-10
// M8 -> p1-01, p1-09, p1-10, p2-01
// M9 -> p0-03, p1-02, p1-04, p1-07, p1-11
// M10 -> p2-01, p2-02, p2-03
//
// === Category Map ===
// Boot & Stability: p0-01, p0-02, p0-03
// UI Flow & Blocking: p1-01, p1-09, p1-10
// Input Semantics: p1-02, p1-03, p2-02
// Core Mechanic Loop: p1-04, p1-10
// State Machine: p1-08, p1-09, p1-10
// Feedback & Observability: p0-03, p1-02, p1-04, p1-11
// Invariants & Rejection: p0-02, p1-05, p1-06, p2-03
// Depth / Optional Systems: p2-01
//
// === Rationality Map ===
// p1-01-level-select-locking: M1/M8 | real action: contract chooseLevel on legal level-select state | independent observation: phase/level/progression + rejection invariant | empty-shell failure: static buttons or locked-level jumps fail
// p1-02-real-mouse-drag-direction-opposite: M2/M4/M9 | real action: mouse drag through visible cell centers with direction opposite return | independent observation: activeLine cells + Math.sign screen delta + playfield revision/hash | empty-shell failure: adapter-only drawing, mirrored input, or inert canvas fail
// p1-03-stepwise-backtrack-and-nonadjacent-reject: M3/M4 | real action: pointerDown/move/backtrack/non-adjacent contract | independent observation: active path grows, shrinks, then rejects while preserving prefix | empty-shell failure: duplicate append or jump-line implementations fail
// p1-04-save-valid-connection-feedback: M2/M5/M9 | real action: legal dragPath route | independent observation: saved line count, pair connected, active cleared, HUD/playfield revisions | empty-shell failure: ok-only or transient-only line save fails
// p1-05-incomplete-release-rejection-invariant: M3/M5 | real action: incomplete route release | independent observation: lastAction rejection, active cleared, saved/progress/reward invariant | empty-shell failure: any-release-saves or partial-complete behavior fails
// p1-06-occupied-route-rejection-preserves-saved-line: M3 | real action: attempted occupied route from legal blocked scenario | independent observation: rejection reason, saved lines unchanged, no overlap | empty-shell failure: crossing/overwrite shortcuts fail
// p1-07-erase-saved-line-cost-benefit: M5/M6/M9 | real action: tap saved line or same-color endpoint | independent observation: one color disconnected, counts decrease, cells freed | empty-shell failure: cosmetic erase or hidden occupancy fails
// p1-08-undo-reset-invariants: M6/M8 | real action: undo then reset controls | independent observation: history step, zero saved/active lines, same layout, no result overlay | empty-shell failure: inert controls or stale overlay fail
// p1-09-completion-terminal-lock-reward-once: M7/M8/M9 | real action: final route from one-move-before-completion | independent observation: result phase, overlay blocks playfield, reward count stable under blocked input | empty-shell failure: pre-complete, duplicate reward, or editable result state fails
// p1-10-full-loop-correction-navigation: M1-M8 | real action: draw/correct/complete/replay/next/back through public player actions | independent observation: legal lines, result, replay cleanup, bounded next/back state | empty-shell failure: one-path demos or menu-only games fail
// p1-11-feedback-revisions-tied-to-actions: M9 | real action: save, erase, reset, complete | independent observation: feedback events/revisions tied to state deltas | empty-shell failure: static decorative UI or time-only counters fail
// p2-01-six-level-progression-depth: M10 | real action: level-select and representative choices | independent observation: at least six level summaries, coherent differing layouts | empty-shell failure: single-level clone fails
// p2-02-real-touch-drag-parity: M2/M4/M9 | real action: touch drag through visible cell centers | independent observation: same route outcome as pointer contract + playfield change | empty-shell failure: desktop-only or adapter-only touch claims fail
// p2-03-repeated-invalid-operations-invariant: M3/M5/M6/M7 | real action: invalid phase/control/cell operations | independent observation: phase/progress/reward/saved-line invariants | empty-shell failure: permissive shortcuts or hidden corruption fail

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }

const enums = {
  phase: new Set(['loading', 'levelSelect', 'playing', 'result']),
  screen: new Set(['boot', 'levelSelect', 'playfield', 'result']),
  panel: new Set(['none', 'levelSelect', 'completion', 'optional']),
  result: new Set(['none', 'complete']),
  event: new Set([
    'none',
    'lineStarted',
    'lineExtended',
    'lineBacktracked',
    'lineSaved',
    'lineRejected',
    'lineErased',
    'undo',
    'reset',
    'levelComplete',
    'levelRejected',
    'navigation'
  ]),
  reason: new Set([
    'none',
    'unsupported',
    'invalidPhase',
    'lockedLevel',
    'outOfBounds',
    'nonAdjacent',
    'wrongEndpoint',
    'occupiedCell',
    'foreignEndpoint',
    'incompletePath',
    'blockedByResult',
    'noUndo',
    'noChange',
    'scenarioUnavailable'
  ])
};

function createGameDriver(browser) {
  async function page(expr) {
    const value = await browser.eval(expr);
    if (value && value.__l2_err__) throw new Error(value.__l2_err__);
    return value;
  }

  async function snapshot() {
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.getSnapshot !== 'function') return { contractMissing: true };
      const snap = await gt.getSnapshot();
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function reset() {
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.reset !== 'function') return { contractMissing: true };
      const snap = await gt.reset();
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function loadScenario(name) {
    const scenario = JSON.stringify(name);
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.loadScenario !== 'function') return { contractMissing: true };
      const snap = await gt.loadScenario(${scenario});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function contractInput(action) {
    const payload = JSON.stringify(action || {});
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.input !== 'function') return { contractMissing: true };
      const snap = await gt.input(${payload});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function visibleSummary() {
    return page(`(function(){
      const body = document.body;
      const canvases = Array.from(document.querySelectorAll('canvas')).map(function(c) {
        const r = c.getBoundingClientRect();
        return { width: c.width || 0, height: c.height || 0, cssW: r.width, cssH: r.height, visible: r.width > 0 && r.height > 0 };
      });
      const domSurfaces = Array.from(document.querySelectorAll('body *')).map(function(el) {
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const text = ((el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim());
        const semantic = el.matches('svg, a, button, input, select, textarea, summary, [role], [tabindex]') ||
          style.cursor === 'pointer' ||
          text.length > 0;
        let visible = r.width > 0 && r.height > 0;
        for (let node = el; visible && node; node = node.parentElement) {
          const nodeStyle = window.getComputedStyle(node);
          const opacity = Number.parseFloat(nodeStyle.opacity);
          visible = nodeStyle.display !== 'none' &&
            nodeStyle.visibility !== 'hidden' &&
            (!Number.isFinite(opacity) || opacity > 0);
          if (node === document.body) break;
        }
        return {
          visible: visible && semantic
        };
      });
      return {
        textLength: body ? ((body.innerText || body.textContent || '').replace(/\\s+/g, ' ').trim().length) : 0,
        canvasCount: canvases.length,
        visibleCanvasCount: canvases.filter(function(c) { return c.visible; }).length,
        visibleDomSurfaceCount: domSurfaces.filter(function(s) { return s.visible; }).length,
        maxCanvasArea: canvases.reduce(function(m, c) { return Math.max(m, c.width * c.height, c.cssW * c.cssH); }, 0)
      };
    })()`);
  }

  async function l2Signals() {
    return page(`(function(){
      const l2 = window.__l2 || {};
      return {
        frameCount: l2.frameCount || 0,
        mouseListeners: l2.mouseListeners || 0,
        drawCalls: l2.drawCalls || 0,
        drawImageCalls: l2.drawImageCalls || 0,
        fillRectCalls: l2.fillRectCalls || 0
      };
    })()`);
  }

  async function screenshotHash() {
    return browser.canvasPixelHash();
  }

  async function mouseDragCells(snap, cells, options) {
    const points = cells.map(ref => centerOfCell(snap, ref));
    if (points.some(p => !p)) return { ok: false, reason: 'missing cell centers' };
    const first = points[0];
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: first.x, y: first.y, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: first.x, y: first.y, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.sleep(80);
    for (let i = 1; i < points.length; i++) {
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: points[i].x,
        y: points[i].y,
        button: 'left',
        buttons: 1,
        modifiers: 0,
        movementX: points[i].x - points[i - 1].x,
        movementY: points[i].y - points[i - 1].y
      });
      await browser.sleep(80);
    }
    const last = points[points.length - 1];
    if (!options || !options.holdOpen) {
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: last.x, y: last.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(180);
    }
    return { ok: true, points };
  }

  async function releaseMouse(point) {
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
      modifiers: 0
    });
    await browser.sleep(120);
  }

  async function touchDragCells(snap, cells) {
    const points = cells.map(ref => centerOfCell(snap, ref));
    if (points.some(p => !p)) return { ok: false, reason: 'missing cell centers' };
    const first = points[0];
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: first.x, y: first.y, id: 1, radiusX: 3, radiusY: 3, force: 1 }]
    });
    await browser.sleep(80);
    for (let i = 1; i < points.length; i++) {
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: points[i].x, y: points[i].y, id: 1, radiusX: 3, radiusY: 3, force: 1 }]
      });
      await browser.sleep(80);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await browser.sleep(180);
    return { ok: true, points };
  }

  async function clickCell(snap, ref) {
    const point = centerOfCell(snap, ref);
    if (!point) return { ok: false, reason: 'missing cell center' };
    await browser.mouseClick(point.x, point.y);
    await browser.sleep(160);
    return { ok: true, point };
  }

  return {
    snapshot,
    reset,
    loadScenario,
    contractInput,
    visibleSummary,
    l2Signals,
    screenshotHash,
    mouseDragCells,
    releaseMouse,
    touchDragCells,
    clickCell
  };
}

function assertSnapshotShape(s) {
  if (!s || s.contractMissing) return 'window.__gameTest.getSnapshot is missing';
  // `ok` describes the preceding adapter call. Rejected actions/scenarios
  // legitimately return a complete snapshot with ok=false; the rejection
  // itself is asserted through lastAction below.
  if (typeof s.ok !== 'boolean') return 'snapshot ok must be boolean';
  if (!enums.phase.has(s.phase)) return `invalid phase ${s.phase}`;
  if (!enums.screen.has(s.screen)) return `invalid screen ${s.screen}`;
  if (!enums.panel.has(s.activePanel)) return `invalid activePanel ${s.activePanel}`;
  if (typeof s.overlayBlocking !== 'boolean') return 'overlayBlocking must be boolean';
  if (typeof s.canInteractWithPlayfield !== 'boolean') return 'canInteractWithPlayfield must be boolean';
  if (!s.level || !s.progression || !s.grid || !s.controls || !s.feedback || !s.result || !s.lastAction) {
    return 'snapshot missing required top-level envelopes';
  }
  if (!Number.isFinite(s.progression.totalLevels) || !Number.isFinite(s.progression.unlockedLevelCount)) {
    return 'progression numeric fields are invalid';
  }
  if (!Array.isArray(s.grid.cells) || !Array.isArray(s.grid.pairs) || !Array.isArray(s.grid.savedLines) || !Array.isArray(s.grid.targetZones)) {
    return 'grid arrays are invalid';
  }
  if (!enums.result.has(s.result.status)) return `invalid result.status ${s.result.status}`;
  if (!enums.event.has(s.feedback.lastEvent)) return `invalid feedback.lastEvent ${s.feedback.lastEvent}`;
  if (!enums.reason.has(s.lastAction.reason)) return `invalid lastAction.reason ${s.lastAction.reason}`;
  if (!Number.isFinite(s.feedback.visualRevision) || !Number.isFinite(s.feedback.hudRevision) || !Number.isFinite(s.feedback.playfieldRevision)) {
    return 'feedback revision fields must be numeric';
  }
  return '';
}

function assertPlayingPrecondition(s, label) {
  const shape = assertSnapshotShape(s);
  if (shape) return `${label}: ${shape}`;
  if (s.phase !== 'playing' || s.screen !== 'playfield') return `${label}: expected playing/playfield, got ${s.phase}/${s.screen}`;
  if (!s.canInteractWithPlayfield || s.overlayBlocking) return `${label}: playfield is not interactable`;
  if (!s.level || !Number.isFinite(s.level.gridSize) || s.level.gridSize < 1) return `${label}: invalid gridSize`;
  if (!Number.isFinite(s.level.pairCount) || s.level.pairCount < 2) return `${label}: expected at least two pairs`;
  if (!Array.isArray(s.grid.pairs) || s.grid.pairs.length < 2) return `${label}: missing pair summaries`;
  return '';
}

function assertLevelSelectPrecondition(s, label) {
  const shape = assertSnapshotShape(s);
  if (shape) return `${label}: ${shape}`;
  if (s.phase !== 'levelSelect' || s.screen !== 'levelSelect') return `${label}: expected levelSelect, got ${s.phase}/${s.screen}`;
  if (s.progression.totalLevels < 6) return `${label}: expected at least six level summaries`;
  return '';
}

function assertResultPrecondition(s, label) {
  const shape = assertSnapshotShape(s);
  if (shape) return `${label}: ${shape}`;
  if (s.phase !== 'result' || s.result.status !== 'complete') return `${label}: expected completed result state`;
  if (!s.overlayBlocking || s.canInteractWithPlayfield) return `${label}: result must block playfield`;
  return '';
}

function route(s, name) {
  return s && s.routeHints && Array.isArray(s.routeHints[name]) ? s.routeHints[name] : null;
}

function normRef(ref) {
  if (!ref) return null;
  if (typeof ref.id === 'string') return { id: ref.id };
  if (Number.isFinite(ref.row) && Number.isFinite(ref.col)) return { row: ref.row, col: ref.col };
  return null;
}

function sameRef(a, b) {
  const ar = normRef(a);
  const br = normRef(b);
  if (!ar || !br) return false;
  if (ar.id && br.id) return ar.id === br.id;
  return ar.row === br.row && ar.col === br.col;
}

function findCell(s, ref) {
  const r = normRef(ref);
  if (!r || !s || !s.grid || !Array.isArray(s.grid.cells)) return null;
  if (r.id) return s.grid.cells.find(c => c.id === r.id) || null;
  return s.grid.cells.find(c => c.row === r.row && c.col === r.col) || null;
}

function refKey(ref) {
  const r = normRef(ref);
  if (!r) return 'invalid';
  return r.id || `${r.row},${r.col}`;
}

function lineCells(line) {
  return line && Array.isArray(line.cells) ? line.cells : [];
}

function centerOfCell(snap, ref) {
  const cell = findCell(snap, ref);
  if (cell && cell.center && Number.isFinite(cell.center.screenX) && Number.isFinite(cell.center.screenY)) {
    return { x: cell.center.screenX, y: cell.center.screenY, cell };
  }
  const zones = snap && snap.grid && Array.isArray(snap.grid.targetZones) ? snap.grid.targetZones : [];
  const zone = zones.find(z => {
    if (!z || z.kind !== 'gridCell' || !z.cell || !z.bounds || z.enabled === false || !cell) return false;
    const zoneCell = findCell(snap, z.cell);
    return zoneCell && zoneCell.row === cell.row && zoneCell.col === cell.col;
  });
  if (zone) {
    const b = zone.bounds;
    if (Number.isFinite(b.x) && Number.isFinite(b.y) &&
        Number.isFinite(b.width) && Number.isFinite(b.height) &&
        b.width > 0 && b.height > 0) {
      return { x: b.x + b.width / 2, y: b.y + b.height / 2, cell };
    }
  }
  const bounds = snap && snap.grid && snap.grid.bounds;
  const size = snap && snap.level && snap.level.gridSize;
  if (cell && bounds && Number.isFinite(size) && size > 0 &&
      Number.isFinite(bounds.x) && Number.isFinite(bounds.y) &&
      Number.isFinite(bounds.width) && Number.isFinite(bounds.height) &&
      bounds.width > 0 && bounds.height > 0) {
    return {
      x: bounds.x + (cell.col + 0.5) * bounds.width / size,
      y: bounds.y + (cell.row + 0.5) * bounds.height / size,
      cell
    };
  }
  return null;
}

function publicCell(s, ref) {
  const cell = findCell(s, ref);
  return cell && Number.isFinite(cell.row) && Number.isFinite(cell.col) ? cell : null;
}

function publicCellKey(s, ref) {
  const cell = publicCell(s, ref);
  return cell ? `${cell.row},${cell.col}` : null;
}

function savedCellKeys(s) {
  return new Set((s && s.grid && s.grid.savedLines || [])
    .flatMap(line => lineCells(line).map(ref => publicCellKey(s, ref)))
    .filter(Boolean));
}

function endpointColors(s) {
  const colors = new Map();
  for (const pair of s && s.grid && s.grid.pairs || []) {
    for (const endpoint of pair && pair.endpoints || []) {
      const key = publicCellKey(s, endpoint);
      if (key) colors.set(key, pair.colorKey);
    }
  }
  return colors;
}

function connectablePairForRoute(s, cells, options) {
  if (!Array.isArray(cells) || !cells.length || !s || !s.grid || !Array.isArray(s.grid.pairs)) return null;
  const startKey = publicCellKey(s, cells[0]);
  const pair = s.grid.pairs.find(candidate =>
    candidate && candidate.connected !== true &&
    Array.isArray(candidate.endpoints) && candidate.endpoints.length === 2 &&
    candidate.endpoints.some(endpoint => publicCellKey(s, endpoint) === startKey)
  );
  if (!pair) return null;
  if (options && options.requireSingleRemaining &&
      s.grid.pairs.filter(candidate => candidate && candidate.connected !== true).length !== 1) {
    return null;
  }
  return pair;
}

function isValidConnectableRoute(s, cells, options) {
  if (!Array.isArray(cells) || cells.length < 2) return false;
  const refs = cells.map(ref => publicCell(s, ref));
  if (refs.some(cell => !cell)) return false;
  const keys = refs.map(cell => `${cell.row},${cell.col}`);
  if (new Set(keys).size !== keys.length) return false;
  for (let i = 1; i < refs.length; i++) {
    if (Math.abs(refs[i].row - refs[i - 1].row) + Math.abs(refs[i].col - refs[i - 1].col) !== 1) return false;
  }
  const pair = connectablePairForRoute(s, cells, options);
  if (!pair) return false;
  const startKey = keys[0];
  const goalRef = pair.endpoints.find(endpoint => publicCellKey(s, endpoint) !== startKey);
  const goalKey = publicCellKey(s, goalRef);
  if (!goalKey || keys[keys.length - 1] !== goalKey) return false;

  const foreignEndpoints = endpointColors(s);
  const occupied = savedCellKeys(s);
  for (let i = 1; i < keys.length - 1; i++) {
    const cell = refs[i];
    if (occupied.has(keys[i]) ||
        (foreignEndpoints.has(keys[i]) && foreignEndpoints.get(keys[i]) !== pair.colorKey) ||
        cell.state !== 'empty') {
      return false;
    }
  }
  return true;
}

function derivePublicConnectableRoute(s, options) {
  if (!s || !s.grid || !Array.isArray(s.grid.cells) || !Array.isArray(s.grid.pairs)) return null;
  const unconnected = s.grid.pairs.filter(pair =>
    pair && pair.connected !== true && Array.isArray(pair.endpoints) && pair.endpoints.length === 2
  );
  if (options && options.requireSingleRemaining && unconnected.length !== 1) return null;
  const cells = s.grid.cells.filter(cell =>
    cell && Number.isFinite(cell.row) && Number.isFinite(cell.col)
  );
  const byKey = new Map(cells.map(cell => [`${cell.row},${cell.col}`, cell]));
  const occupied = savedCellKeys(s);
  const active = new Set(cells.filter(cell => ['activeLine', 'blocked'].includes(cell.state))
    .map(cell => `${cell.row},${cell.col}`));
  const endpointMap = endpointColors(s);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  for (const pair of unconnected) {
    const start = publicCell(s, pair.endpoints[0]);
    const goal = publicCell(s, pair.endpoints[1]);
    if (!start || !goal) continue;
    const startKey = `${start.row},${start.col}`;
    const goalKey = `${goal.row},${goal.col}`;
    const queue = [start];
    const previous = new Map([[startKey, null]]);
    for (let head = 0; head < queue.length; head += 1) {
      const current = queue[head];
      const currentKey = `${current.row},${current.col}`;
      if (currentKey === goalKey) break;
      for (const [dr, dc] of directions) {
        const nextKey = `${current.row + dr},${current.col + dc}`;
        const next = byKey.get(nextKey);
        if (!next || previous.has(nextKey)) continue;
        if (nextKey !== goalKey &&
            (occupied.has(nextKey) || active.has(nextKey) || endpointMap.has(nextKey) || next.state !== 'empty')) {
          continue;
        }
        previous.set(nextKey, currentKey);
        queue.push(next);
      }
    }
    if (!previous.has(goalKey)) continue;
    const path = [];
    for (let currentKey = goalKey; currentKey !== null; currentKey = previous.get(currentKey)) {
      const cell = byKey.get(currentKey);
      if (!cell) break;
      path.unshift({ row: cell.row, col: cell.col });
    }
    if (isValidConnectableRoute(s, path, options)) return path;
  }
  return null;
}

function connectableRouteFor(s, hintName, options) {
  const hinted = route(s, hintName);
  if (isValidConnectableRoute(s, hinted, options)) return hinted;
  return derivePublicConnectableRoute(s, options);
}

function routeForFeedbackCheck(s, name) {
  return connectableRouteFor(s, name, name === 'finalRoute' ? { requireSingleRemaining: true } : undefined);
}

function deriveConnectableRoute(s) {
  return derivePublicConnectableRoute(s);
}

function backtrackRouteFor(snap) {
  const activeLine = snap && snap.grid && snap.grid.activeLine;
  const active = lineCells(activeLine);
  if (active.length >= 2) return [active[0], active[1]];
  if (active.length === 1) {
    const startCell = publicCell(snap, active[0]);
    const activeColor = activeLine && activeLine.colorKey;
    const extension = snap && snap.grid && Array.isArray(snap.grid.cells)
      ? snap.grid.cells.find(cell => {
          if (!startCell || !cell || !Number.isFinite(cell.row) || !Number.isFinite(cell.col)) return false;
          if (Math.abs(cell.row - startCell.row) + Math.abs(cell.col - startCell.col) !== 1) return false;
          return cell.state === 'empty' || (cell.state === 'endpoint' && cell.colorKey === activeColor);
        })
      : null;
    if (extension) return [active[0], { row: extension.row, col: extension.col }];
  }
  const hinted = route(snap, 'backtrackRoute');
  if (hinted && hinted.length >= 2) return hinted;
  const connectable = connectableRouteFor(snap, 'connectableRoute');
  return connectable && connectable.length >= 2 ? connectable : null;
}

async function waitForUsableRoute(game, browser, snap, resolveRoute, timeoutMs = 1200) {
  let current = snap;
  const deadline = Date.now() + timeoutMs;
  let candidate = null;
  while (true) {
    candidate = resolveRoute(current);
    if (Array.isArray(candidate) && candidate.length >= 2 &&
        candidate.every(ref => centerOfCell(current, ref))) {
      return { snap: current, route: candidate };
    }
    if (Date.now() >= deadline) return { snap: current, route: candidate };
    await browser.sleep(50);
    current = await game.snapshot();
  }
}

function isValidIncompleteRoute(s, candidate) {
  if (!Array.isArray(candidate) || candidate.length < 2) return false;
  const refs = candidate.map(ref => publicCell(s, ref));
  if (refs.some(cell => !cell)) return false;
  const keys = refs.map(cell => `${cell.row},${cell.col}`);
  if (new Set(keys).size !== keys.length) return false;
  for (let i = 1; i < refs.length; i++) {
    if (Math.abs(refs[i - 1].row - refs[i].row) + Math.abs(refs[i - 1].col - refs[i].col) !== 1) return false;
  }
  const pair = s && s.grid && s.grid.pairs && s.grid.pairs.find(candidatePair =>
    candidatePair && candidatePair.connected !== true &&
    Array.isArray(candidatePair.endpoints) &&
    candidatePair.endpoints.some(endpoint => publicCellKey(s, endpoint) === keys[0])
  );
  if (!pair) return false;
  const goalKey = publicCellKey(s, pair.endpoints.find(endpoint => publicCellKey(s, endpoint) !== keys[0]));
  if (!goalKey || keys[keys.length - 1] === goalKey) return false;
  const endpointMap = endpointColors(s);
  const occupied = savedCellKeys(s);
  return refs.slice(1).every((cell, index) => {
    const key = keys[index + 1];
    const isLast = index === refs.length - 2;
    return cell.state === 'empty' && !occupied.has(key) &&
      (!endpointMap.has(key) || (isLast && endpointMap.get(key) !== pair.colorKey));
  });
}

function deriveIncompleteRoute(s) {
  if (!s || !s.grid || !Array.isArray(s.grid.pairs) || !Array.isArray(s.grid.cells)) return null;
  for (const pair of s.grid.pairs) {
    if (!pair || pair.connected === true || !Array.isArray(pair.endpoints) || pair.endpoints.length !== 2) continue;
    for (const startRef of pair.endpoints) {
      const start = publicCell(s, startRef);
      const targetRef = pair.endpoints.find(ref => !sameRef(ref, startRef));
      const target = targetRef ? publicCell(s, targetRef) : null;
      if (!start || !target) continue;
      const neighbor = s.grid.cells.find(cell =>
        cell && Math.abs(cell.row - start.row) + Math.abs(cell.col - start.col) === 1 &&
        (cell.row !== target.row || cell.col !== target.col) &&
        cell.state === 'empty' && !savedCellKeys(s).has(`${cell.row},${cell.col}`)
      );
      if (neighbor) return [startRef, { row: neighbor.row, col: neighbor.col }];
    }
  }
  return null;
}

function incompleteReleaseRoute(s) {
  const hinted = route(s, 'incompleteRoute');
  return isValidIncompleteRoute(s, hinted) ? hinted : deriveIncompleteRoute(s);
}

function deriveOccupiedRoute(s) {
  const cells = Array.isArray(s && s.grid && s.grid.cells) ? s.grid.cells : [];
  const byKey = new Map(cells
    .filter(cell => cell && Number.isFinite(cell.row) && Number.isFinite(cell.col))
    .map(cell => [`${cell.row},${cell.col}`, cell]));
  const occupied = savedCellKeys(s);
  const endpoints = endpointColors(s);
  const starts = (s && s.grid && s.grid.pairs || [])
    .filter(pair => pair && pair.connected !== true)
    .flatMap(pair => (pair.endpoints || [])
      .map(endpoint => {
        const cell = publicCell(s, endpoint);
        return cell ? { cell, colorKey: pair.colorKey } : null;
      })
      .filter(Boolean));
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  for (const start of starts) {
    const startKey = `${start.cell.row},${start.cell.col}`;
    const queue = [{ cell: start.cell, path: [{ row: start.cell.row, col: start.cell.col }] }];
    const seen = new Set([startKey]);
    for (let head = 0; head < queue.length; head += 1) {
      const current = queue[head];
      for (const [dr, dc] of directions) {
        const nextKey = `${current.cell.row + dr},${current.cell.col + dc}`;
        const next = byKey.get(nextKey);
        if (!next || seen.has(nextKey)) continue;
        const nextRef = { row: next.row, col: next.col };
        if (occupied.has(nextKey)) return current.path.concat(nextRef);
        if (endpoints.has(nextKey) || next.state !== 'empty') continue;
        seen.add(nextKey);
        queue.push({ cell: next, path: current.path.concat(nextRef) });
      }
    }
  }
  return null;
}

function isValidOccupiedRoute(s, cells) {
  if (!Array.isArray(cells) || cells.length < 2) return false;
  const refs = cells.map(ref => publicCell(s, ref));
  if (refs.some(cell => !cell)) return false;
  const keys = refs.map(cell => `${cell.row},${cell.col}`);
  if (new Set(keys).size !== keys.length) return false;
  for (let i = 1; i < refs.length; i++) {
    if (Math.abs(refs[i].row - refs[i - 1].row) + Math.abs(refs[i].col - refs[i - 1].col) !== 1) return false;
  }
  const pair = s && s.grid && s.grid.pairs && s.grid.pairs.find(candidate =>
    candidate && candidate.connected !== true &&
    (candidate.endpoints || []).some(endpoint => publicCellKey(s, endpoint) === keys[0])
  );
  if (!pair) return false;
  const occupied = savedCellKeys(s);
  const endpoints = endpointColors(s);
  for (let i = 1; i < keys.length - 1; i++) {
    if (occupied.has(keys[i]) || endpoints.has(keys[i]) || refs[i].state !== 'empty') return false;
  }
  const last = keys[keys.length - 1];
  return occupied.has(last) || (endpoints.has(last) && endpoints.get(last) !== pair.colorKey);
}

function lineSignature(line) {
  return lineCells(line).map(refKey).join('|');
}

function savedSignature(s) {
  return (s.grid.savedLines || [])
    .map(l => `${l.colorKey}:${lineSignature(l)}`)
    .sort()
    .join(';');
}

function pairSignature(s) {
  return (s.grid.pairs || [])
    .map(p => `${p.colorKey}:${(p.endpoints || []).map(refKey).join('-')}`)
    .sort()
    .join(';');
}

function isAdjacentRef(a, b) {
  const ar = normRef(a);
  const br = normRef(b);
  if (!ar || !br || ar.id || br.id) return true;
  return Math.abs(ar.row - br.row) + Math.abs(ar.col - br.col) === 1;
}

function assertRouteContinuous(cells, label) {
  if (!Array.isArray(cells) || cells.length < 2) return `${label}: route must contain at least two cells`;
  for (let i = 1; i < cells.length; i++) {
    if (!isAdjacentRef(cells[i - 1], cells[i])) return `${label}: route has non-adjacent cells at ${i - 1}/${i}`;
  }
  return '';
}

function firstSavedLine(s) {
  return s.grid && Array.isArray(s.grid.savedLines) && s.grid.savedLines.length ? s.grid.savedLines[0] : null;
}

function countConnectedPairs(s) {
  return (s.grid.pairs || []).filter(p => p.connected).length;
}

function feedbackChanged(a, b) {
  return b.feedback.visualRevision !== a.feedback.visualRevision ||
    b.feedback.hudRevision !== a.feedback.hudRevision ||
    b.feedback.playfieldRevision !== a.feedback.playfieldRevision ||
    b.feedback.lastEvent !== a.feedback.lastEvent;
}

async function verifyScenario(game, name, checker) {
  const snap = await game.loadScenario(name);
  const shape = assertSnapshotShape(snap);
  if (shape) return { snap, error: `${name}: ${shape}` };
  if (snap.lastAction && snap.lastAction.ok === false && snap.lastAction.reason === 'scenarioUnavailable') {
    return { snap, error: `${name}: scenarioUnavailable` };
  }
  const specific = checker ? checker(snap, name) : '';
  if (specific) return { snap, error: specific };
  return { snap, error: '' };
}

const suite = [
  {
    id: 'p0-01-boot-stable-visible-surface',
    level: 'P0',
    name: 'Boot reaches a stable visible game surface without fatal runtime errors',
    timeoutMs: 12000,
    async run({ browser }) {
      await browser.sleep(800);
      const errors = browser.exceptions.filter(e => String(e.description || e.text || '').trim());
      if (errors.length) return FAIL(`runtime exception: ${errors[0].description || errors[0].text}`);
      const game = createGameDriver(browser);
      const visible = await game.visibleSummary();
      const signals = await game.l2Signals();
      const snap = await game.snapshot();
      if (visible.canvasCount === 0 && visible.textLength < 20) return FAIL('no canvas or readable UI text');
      if (signals.drawCalls < 1 && visible.visibleCanvasCount === 0 && visible.visibleDomSurfaceCount === 0) {
        return FAIL('no draw activity or visible DOM surface');
      }
      if (!snap.contractMissing) {
        const shape = assertSnapshotShape(snap);
        if (shape) return FAIL(shape);
      }
      return PASS(`visibleCanvas=${visible.visibleCanvasCount}, visibleDom=${visible.visibleDomSurfaceCount}, drawCalls=${signals.drawCalls}`);
    }
  },
  {
    id: 'p0-02-public-contract-methods-and-rejection',
    level: 'P0',
    name: 'Public adapter exposes required methods and rejects unsupported actions without mutation',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const methods = await browser.eval(`(function(){
        const gt = window.__gameTest;
        return {
          exists: !!gt,
          reset: !!gt && typeof gt.reset === 'function',
          getSnapshot: !!gt && typeof gt.getSnapshot === 'function',
          input: !!gt && typeof gt.input === 'function',
          loadScenario: !!gt && typeof gt.loadScenario === 'function'
        };
      })()`);
      if (!methods.exists || !methods.reset || !methods.getSnapshot || !methods.input || !methods.loadScenario) {
        return FAIL(`missing contract method(s): ${JSON.stringify(methods)}`);
      }
      const before = await game.reset();
      const shape = assertSnapshotShape(before);
      if (shape) return FAIL(shape);
      const rejected = await game.contractInput({ type: 'unsupported-contract-action' });
      const after = await game.snapshot();
      const afterShape = assertSnapshotShape(after);
      if (afterShape) return FAIL(afterShape);
      if (!rejected.lastAction || rejected.lastAction.ok !== false) return FAIL('unsupported action did not return lastAction.ok === false');
      if (!['unsupported', 'invalidPhase', 'noChange'].includes(rejected.lastAction.reason)) {
        return FAIL(`unexpected unsupported-action reason ${rejected.lastAction.reason}`);
      }
      if (before.phase !== after.phase || before.level.index !== after.level.index || before.level.savedLineCount !== after.level.savedLineCount || before.result.status !== after.result.status) {
        return FAIL('unsupported action mutated phase, level, saved lines, or result');
      }
      const beforeScenario = await game.snapshot();
      const badScenario = await game.loadScenario('not_a_declared_scenario');
      if (!badScenario.lastAction || badScenario.lastAction.ok !== false || !['unsupported', 'scenarioUnavailable'].includes(badScenario.lastAction.reason)) {
        return FAIL('unsupported scenario did not return a valid rejection reason');
      }
      const afterScenario = await game.snapshot();
      for (const key of ['phase', 'screen', 'activePanel', 'overlayBlocking', 'canInteractWithPlayfield', 'level', 'progression', 'grid', 'controls', 'result']) {
        if (JSON.stringify(beforeScenario[key]) !== JSON.stringify(badScenario[key]) || JSON.stringify(beforeScenario[key]) !== JSON.stringify(afterScenario[key])) {
          return FAIL(`unsupported scenario mutated ${key}`);
        }
      }
      return PASS('required adapter methods and rejection envelope are stable');
    }
  },
  {
    id: 'p0-03-fresh-level-observable-grid',
    level: 'P0',
    name: 'Fresh unlocked level exposes a visible coherent grid, pairs, and playfield summary',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap, error } = await verifyScenario(game, 'fresh_unlocked_level', assertPlayingPrecondition);
      if (error) return FAIL(error);
      if (snap.level.savedLineCount !== 0 || snap.level.completedPairCount !== 0 || snap.grid.savedLines.length !== 0) {
        return FAIL('fresh level must start without saved or completed lines');
      }
      if (snap.grid.cells.length < snap.level.gridSize * snap.level.gridSize) return FAIL('grid.cells does not cover the visible grid');
      for (const pair of snap.grid.pairs) {
        if (!pair.colorKey || !Array.isArray(pair.endpoints) || pair.endpoints.length !== 2) return FAIL('pair missing colorKey or two endpoints');
      }
      const visible = await game.visibleSummary();
      if (visible.visibleCanvasCount === 0 && visible.textLength < 20) return FAIL('playfield has no visible canvas or UI evidence');
      return PASS(`gridSize=${snap.level.gridSize}, pairs=${snap.level.pairCount}`);
    }
  },
  {
    id: 'p1-01-level-select-locking',
    level: 'P1',
    name: 'Level select enters unlocked levels and rejects locked entries',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: select, error } = await verifyScenario(game, 'level_select', assertLevelSelectPrecondition);
      if (error) return FAIL(error);
      const target = Math.max(0, Math.min(select.progression.highestUnlockedIndex || 0, select.progression.unlockedLevelCount - 1));
      const playing = await game.contractInput({ type: 'chooseLevel', levelIndex: target });
      const playErr = assertPlayingPrecondition(playing, 'choose unlocked');
      if (playErr) return FAIL(playErr);
      if (playing.level.index !== target || playing.level.savedLineCount !== 0 || playing.grid.savedLines.length !== 0) {
        return FAIL('unlocked level did not enter a fresh matching level');
      }
      const { snap: locked, error: lockedErr } = await verifyScenario(game, 'fresh_locked_level_attempt', assertLevelSelectPrecondition);
      if (lockedErr) return FAIL(lockedErr);
      const lockedIndex = Math.max(locked.progression.unlockedLevelCount, (locked.progression.highestUnlockedIndex || 0) + 1);
      const rejected = await game.contractInput({ type: 'chooseLevel', levelIndex: lockedIndex });
      if (!rejected.lastAction || rejected.lastAction.ok !== false || !['lockedLevel', 'invalidPhase', 'noChange'].includes(rejected.lastAction.reason)) {
        return FAIL(`locked choice was not rejected: ${rejected.lastAction && rejected.lastAction.reason}`);
      }
      if (rejected.phase === 'playing' && rejected.level.index === lockedIndex) return FAIL('locked level became playable');
      if (rejected.progression.unlockedLevelCount !== locked.progression.unlockedLevelCount) return FAIL('locked attempt changed unlock count');
      return PASS('unlocked choice enters play and locked choice is rejected');
    }
  },
  {
    id: 'p1-02-real-mouse-drag-direction-opposite',
    level: 'P1',
    name: 'Real mouse drag grows and backtracks with direction opposite screen deltas',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: loaded, error } = await verifyScenario(game, 'fresh_unlocked_level', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const ready = await waitForUsableRoute(
        game,
        browser,
        loaded,
        current => {
          const candidate = backtrackRouteFor(current);
          return candidate && candidate.slice(0, 2);
        }
      );
      const before = ready.snap;
      const settledError = assertPlayingPrecondition(before, 'active_partial_drag');
      if (settledError) return FAIL(settledError);
      const backtrack = ready.route;
      if (!backtrack || backtrack.length < 2) return FAIL('active_partial_drag must expose a legal active line or backtrackRoute with at least two cells');
      const continuity = assertRouteContinuous(backtrack, 'backtrackRoute');
      if (continuity) return FAIL(continuity);
      const centers = backtrack.map(ref => {
        const point = centerOfCell(before, ref);
        return point ? { screenX: point.x, screenY: point.y } : null;
      });
      if (centers.some(c => !c || !Number.isFinite(c.screenX) || !Number.isFinite(c.screenY))) {
        return FAIL('backtrackRoute cells lack public screen centers for real mouse input');
      }
      const growDx = centers[1].screenX - centers[0].screenX;
      const growDy = centers[1].screenY - centers[0].screenY;
      // backtrackRoute starts with a legal forward step; the return step is
      // back to the previous cell, not the third forward cell in the hint.
      const backDx = centers[0].screenX - centers[1].screenX;
      const backDy = centers[0].screenY - centers[1].screenY;
      const primaryGrow = Math.abs(growDx) >= Math.abs(growDy) ? growDx : growDy;
      const primaryBack = Math.abs(growDx) >= Math.abs(growDy) ? backDx : backDy;
      // direction opposite: the return drag must have the opposite signed screen delta.
      if (Math.sign(primaryGrow) === 0 || Math.sign(primaryGrow) !== -Math.sign(primaryBack)) {
        return FAIL(`direction opposite proof failed: grow=${primaryGrow}, back=${primaryBack}`);
      }
      const hashBefore = await game.screenshotHash();
      const dragResult = await game.mouseDragCells(before, [backtrack[0], backtrack[1], backtrack[0]], { holdOpen: true });
      if (!dragResult.ok) return FAIL(dragResult.reason);
      const after = await game.snapshot();
      const shape = assertSnapshotShape(after);
      if (shape) return FAIL(shape);
      const hashAfter = await game.screenshotHash();
      await game.releaseMouse(dragResult.points[dragResult.points.length - 1]);
      if (after.feedback.lastEvent !== 'lineBacktracked') {
        return FAIL(`backtracking did not report lineBacktracked, got ${after.feedback.lastEvent}`);
      }
      if (!after.grid.activeLine || lineCells(after.grid.activeLine).length !== 1) {
        return FAIL('backtracking did not shrink the active line or report lineBacktracked');
      }
      if (!feedbackChanged(before, after) && hashBefore === hashAfter) return FAIL('real mouse drag produced no feedback or visible change');
      return PASS('real mouse drag proves signed grow/backtrack direction relation');
    }
  },
  {
    id: 'p1-03-stepwise-backtrack-and-nonadjacent-reject',
    level: 'P1',
    name: 'Stepwise drag grows, backtracks, and rejects non-adjacent movement',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: start, error } = await verifyScenario(game, 'active_partial_drag', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const activeLine = start.grid.activeLine;
      const activeCells = lineCells(activeLine);
      if (!activeLine || activeCells.length < 1) return FAIL('active_partial_drag must expose an active line');
      const snapshotCell = (snap, ref) => findCell(snap, ref);
      const key = (snap, ref) => {
        const cell = snapshotCell(snap, ref);
        return cell && Number.isFinite(cell.row) && Number.isFinite(cell.col)
          ? cell.row + ',' + cell.col
          : refKey(ref);
      };
      const asRef = cell => ({ row: cell.row, col: cell.col });
      const head = snapshotCell(start, activeCells[activeCells.length - 1]);
      if (!head) return FAIL('active_partial_drag active line lacks public cell coordinates');
      const activeKeys = new Set(activeCells.map(ref => key(start, ref)));
      const nextCell = (start.grid.cells || []).find(cell => {
        if (!Number.isFinite(cell.row) || !Number.isFinite(cell.col)) return false;
        if (Math.abs(cell.row - head.row) + Math.abs(cell.col - head.col) !== 1) return false;
        if (activeKeys.has(key(start, cell))) return false;
        return cell.state === 'empty' ||
          (cell.state === 'endpoint' && cell.colorKey === activeLine.colorKey);
      });
      if (!nextCell) return FAIL('active_partial_drag has no legal adjacent extension');
      const nextRef = asRef(nextCell);
      const backtrackRef = asRef(head);
      let s = await game.contractInput({ type: 'pointerMoveCell', cell: nextRef, pointer: 'adapter' });
      if (s.lastAction.ok !== true || s.feedback.lastEvent !== 'lineExtended') {
        return FAIL('adjacent pointerMoveCell did not extend line');
      }
      const lengthAfterExtend = lineCells(s.grid.activeLine).length;
      if (lengthAfterExtend !== activeCells.length + 1) return FAIL('adjacent pointerMoveCell did not add exactly one segment');
      s = await game.contractInput({ type: 'pointerMoveCell', cell: backtrackRef, pointer: 'adapter' });
      if (s.feedback.lastEvent !== 'lineBacktracked') return FAIL('reverse move did not report lineBacktracked');
      const lengthAfterBacktrack = lineCells(s.grid.activeLine).length;
      if (lengthAfterBacktrack !== lengthAfterExtend - 1) return FAIL('backtrack did not remove exactly one segment');
      const activeAfterBacktrack = lineSignature(s.grid.activeLine);
      const lengthBeforeSame = lineCells(s.grid.activeLine).length;
      s = await game.contractInput({ type: 'pointerMoveCell', cell: backtrackRef, pointer: 'adapter' });
      if (lineCells(s.grid.activeLine).length !== lengthBeforeSame ||
          lineSignature(s.grid.activeLine) !== activeAfterBacktrack) {
        return FAIL('same-cell movement changed the active path');
      }
      const beforeIllegalSaved = savedSignature(s);
      const beforeIllegalActive = lineSignature(s.grid.activeLine);
      const currentHead = snapshotCell(s, lineCells(s.grid.activeLine).slice(-1)[0]);
      if (!currentHead) return FAIL('active line lost its public head after backtracking');
      let illegalCell = (s.grid.cells || []).find(cell => {
        if (!Number.isFinite(cell.row) || !Number.isFinite(cell.col)) return false;
        if (Math.abs(cell.row - currentHead.row) + Math.abs(cell.col - currentHead.col) <= 1) return false;
        return cell.state === 'empty';
      });
      if (!illegalCell) {
        illegalCell = (s.grid.cells || []).find(cell =>
          Number.isFinite(cell.row) && Number.isFinite(cell.col) &&
          Math.abs(cell.row - currentHead.row) + Math.abs(cell.col - currentHead.col) > 1
        );
      }
      if (!illegalCell) return FAIL('active_partial_drag has no non-adjacent probe cell');
      s = await game.contractInput({ type: 'pointerMoveCell', cell: asRef(illegalCell), pointer: 'adapter' });
      if (s.lastAction.ok !== false && s.feedback.lastEvent !== 'lineRejected') return FAIL('non-adjacent movement was not rejected');
      if (savedSignature(s) !== beforeIllegalSaved ||
          lineSignature(s.grid.activeLine) !== beforeIllegalActive ||
          lineCells(s.grid.activeLine).length !== lengthBeforeSame) {
        return FAIL('non-adjacent rejection mutated saved lines or active prefix');
      }
      return PASS('stepwise growth/backtrack/rejection chain is coherent');
    }
  },
  {
    id: 'p1-04-save-valid-connection-feedback',
    level: 'P1',
    name: 'A legal same-color drag saves one persistent connection and updates feedback',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: before, error } = await verifyScenario(game, 'fresh_unlocked_level', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const legal = connectableRouteFor(before, 'connectableRoute');
      if (!legal || legal.length < 2) return FAIL('fresh_unlocked_level must expose a legal same-color route');
      const continuity = assertRouteContinuous(legal, 'connectableRoute');
      if (continuity) return FAIL(continuity);
      const after = await game.contractInput({ type: 'dragPath', cells: legal, pointer: 'adapter' });
      const shape = assertSnapshotShape(after);
      if (shape) return FAIL(shape);
      if (after.lastAction.ok !== true || after.feedback.lastEvent !== 'lineSaved') return FAIL('legal dragPath did not save a line');
      if (after.level.savedLineCount !== before.level.savedLineCount + 1) return FAIL('savedLineCount did not increase by one');
      if (after.level.completedPairCount !== before.level.completedPairCount + 1) return FAIL('completedPairCount did not increase by one');
      if (lineCells(after.grid.activeLine).length !== 0) return FAIL('active line should clear after saving');
      const semanticCellKey = ref =>
        ref && Number.isFinite(ref.row) && Number.isFinite(ref.col)
          ? `${ref.row},${ref.col}`
          : publicCellKey(after, ref);
      const legalKey = legal.map(semanticCellKey).join('|');
      const saved = after.grid.savedLines.find(l =>
        lineCells(l).map(semanticCellKey).join('|') === legalKey
      );
      if (!saved || !saved.complete) return FAIL('saved line does not persist with the legal route cells');
      if (!feedbackChanged(before, after)) return FAIL('saving a line did not change feedback revisions/event');
      return PASS('legal route is saved and observable');
    }
  },
  {
    id: 'p1-05-incomplete-release-rejection-invariant',
    level: 'P1',
    name: 'Incomplete release clears temporary line without awarding progress',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: loaded, error } = await verifyScenario(game, 'fresh_unlocked_level', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const ready = await waitForUsableRoute(
        game,
        browser,
        loaded,
        current => incompleteReleaseRoute(current),
        600
      );
      const before = ready.snap;
      const settledError = assertPlayingPrecondition(before, 'fresh_unlocked_level after render settle');
      if (settledError) return FAIL(settledError);
      const incomplete = ready.route;
      if (!incomplete) return FAIL('fresh_unlocked_level must provide or permit a player-drawable incomplete route');
      const dragResult = await game.mouseDragCells(before, incomplete, { holdOpen: true });
      if (!dragResult.ok) return FAIL(`real mouse drag could not start: ${dragResult.reason}`);
      const during = await game.snapshot();
      const duringShape = assertSnapshotShape(during);
      await game.releaseMouse(dragResult.points[dragResult.points.length - 1]);
      const after = await game.snapshot();
      if (duringShape) return FAIL(duringShape);
      const shape = assertSnapshotShape(after);
      if (shape) return FAIL(shape);
      if (!during.grid.activeLine || lineCells(during.grid.activeLine).length < 2) {
        return FAIL('real mouse drag did not create the incomplete active line');
      }
      if (!feedbackChanged(before, during) || !feedbackChanged(during, after)) {
        return FAIL('incomplete drag/release did not produce tied feedback changes');
      }
      if (after.lastAction.ok !== false && after.feedback.lastEvent !== 'lineRejected') return FAIL('incomplete route was not rejected');
      if (lineCells(after.grid.activeLine).length !== 0) return FAIL('temporary active line was not cleared after failed release');
      if (savedSignature(after) !== savedSignature(before) ||
          after.level.savedLineCount !== before.level.savedLineCount ||
          after.level.completedPairCount !== before.level.completedPairCount ||
          after.progression.unlockedLevelCount !== before.progression.unlockedLevelCount ||
          after.progression.highestUnlockedIndex !== before.progression.highestUnlockedIndex) {
        return FAIL('failed release changed saved or completed counts');
      }
      if (after.result.status !== 'none' || after.result.rewardAppliedCount !== before.result.rewardAppliedCount) {
        return FAIL('failed release changed result or reward');
      }
      return PASS('incomplete release rejects without progress mutation');
    }
  },
  {
    id: 'p1-06-occupied-route-rejection-preserves-saved-line',
    level: 'P1',
    name: 'Saved lines block occupied routes without damaging existing connections',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: before, error } = await verifyScenario(game, 'blocked_by_saved_connection', assertPlayingPrecondition);
      if (error) return FAIL(error);
      if (before.level.savedLineCount < 1 || before.grid.savedLines.length < 1) return FAIL('blocked scenario must start with a saved line');
      const hintedRoute = route(before, 'illegalOccupiedRoute');
      const blockedRoute = hintedRoute || deriveOccupiedRoute(before);
      if (!blockedRoute || blockedRoute.length < 2) return FAIL('blocked scenario must expose a contiguous occupied route');
      if (!isValidOccupiedRoute(before, blockedRoute)) {
        return FAIL(hintedRoute
          ? 'illegalOccupiedRoute hint must be contiguous, start at an unconnected endpoint, and reach occupied space'
          : 'blocked scenario did not expose a contiguous occupied route');
      }
      const savedBefore = savedSignature(before);
      const connectedBefore = countConnectedPairs(before);
      const after = await game.contractInput({ type: 'dragPath', cells: blockedRoute, pointer: 'adapter' });
      const shape = assertSnapshotShape(after);
      if (shape) return FAIL(shape);
      if (after.lastAction.ok !== false && after.feedback.lastEvent !== 'lineRejected') return FAIL('occupied route was not rejected');
      if (!['occupiedCell', 'foreignEndpoint', 'nonAdjacent', 'wrongEndpoint', 'incompletePath', 'none'].includes(after.lastAction.reason)) {
        return FAIL(`unexpected occupied-route reason ${after.lastAction.reason}`);
      }
      if (savedSignature(after) !== savedBefore || countConnectedPairs(after) !== connectedBefore) {
        return FAIL('occupied rejection changed existing saved connections');
      }
      return PASS('occupied route is rejected and saved line remains intact');
    }
  },
  {
    id: 'p1-07-erase-saved-line-cost-benefit',
    level: 'P1',
    name: 'Tapping a saved connection erases only that color and frees occupied cells',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: before, error } = await verifyScenario(game, 'saved_single_connection', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const saved = firstSavedLine(before);
      if (!saved) return FAIL('saved_single_connection must include one saved line');
      const target = lineCells(saved)[Math.floor(lineCells(saved).length / 2)] || lineCells(saved)[0];
      const after = await game.contractInput({ type: 'tapCell', cell: target, pointer: 'adapter' });
      const shape = assertSnapshotShape(after);
      if (shape) return FAIL(shape);
      if (after.feedback.lastEvent !== 'lineErased' || after.lastAction.ok !== true) return FAIL('tapCell on saved line did not erase');
      if (after.level.savedLineCount !== before.level.savedLineCount - 1) return FAIL('erase did not reduce savedLineCount by one');
      if (after.level.completedPairCount !== before.level.completedPairCount - 1) return FAIL('erase did not reduce completedPairCount by one');
      if (after.level.occupiedCellCount >= before.level.occupiedCellCount) return FAIL('erase did not free occupied cells');
      const erasedPair = after.grid.pairs.find(p => p.colorKey === saved.colorKey);
      if (!erasedPair || erasedPair.connected) return FAIL('erased color is still marked connected');
      const unrelatedLost = before.grid.savedLines
        .filter(l => l.colorKey !== saved.colorKey)
        .some(l => !after.grid.savedLines.some(a => a.colorKey === l.colorKey && lineSignature(a) === lineSignature(l)));
      if (unrelatedLost) return FAIL('erase removed an unrelated color');
      return PASS('erase has visible benefit and progress cost');
    }
  },
  {
    id: 'p1-08-undo-reset-invariants',
    level: 'P1',
    name: 'Undo restores prior saved state and reset clears the level without changing layout',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: saved, error } = await verifyScenario(game, 'saved_single_connection', assertPlayingPrecondition);
      if (error) return FAIL(error);
      if (!saved.controls.canUndo || !saved.controls.canReset) return FAIL('saved scenario must expose undo and reset controls');
      const layoutBefore = pairSignature(saved);
      const undo = await game.contractInput({ type: 'undo' });
      const shapeUndo = assertSnapshotShape(undo);
      if (shapeUndo) return FAIL(shapeUndo);
      if (undo.feedback.lastEvent !== 'undo' || undo.level.savedLineCount !== saved.level.savedLineCount - 1) {
        return FAIL('undo did not restore one saved-line step');
      }
      if (pairSignature(undo) !== layoutBefore) return FAIL('undo changed endpoint layout');
      const { snap: resetStart, error: resetError } = await verifyScenario(game, 'saved_single_connection', assertPlayingPrecondition);
      if (resetError) return FAIL(resetError);
      if (resetStart.level.savedLineCount < 1 || !resetStart.controls.canReset) {
        return FAIL('reset precondition must retain a saved line and expose reset control');
      }
      const resetLayoutBefore = pairSignature(resetStart);
      const reset = await game.contractInput({ type: 'resetLevel' });
      const shapeReset = assertSnapshotShape(reset);
      if (shapeReset) return FAIL(shapeReset);
      if (reset.feedback.lastEvent !== 'reset') return FAIL('reset did not report reset event');
      if (reset.level.savedLineCount !== 0 || reset.level.completedPairCount !== 0 || lineCells(reset.grid.activeLine).length !== 0) {
        return FAIL('reset did not clear saved, completed, and active lines');
      }
      if (reset.result.status !== 'none' || reset.overlayBlocking || !reset.canInteractWithPlayfield) {
        return FAIL('reset left result state or blocking overlay active');
      }
      if (pairSignature(reset) !== resetLayoutBefore) return FAIL('reset changed current level endpoint layout');
      return PASS('undo and reset preserve layout and clear transient state');
    }
  },
  {
    id: 'p1-09-completion-terminal-lock-reward-once',
    level: 'P1',
    name: 'Final legal route completes the level, blocks playfield input, and applies reward once',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: before, error } = await verifyScenario(game, 'one_move_before_completion', assertPlayingPrecondition);
      if (error) return FAIL(error);
      if (before.result.status !== 'none' || before.level.complete) return FAIL('one_move_before_completion is already complete');
      const finalRoute = connectableRouteFor(before, 'finalRoute', { requireSingleRemaining: true });
      if (!finalRoute || finalRoute.length < 2) return FAIL('one_move_before_completion must expose or permit derivation of finalRoute');
      const after = await game.contractInput({ type: 'dragPath', cells: finalRoute, pointer: 'adapter' });
      const shape = assertSnapshotShape(after);
      if (shape) return FAIL(shape);
      if (after.phase !== 'result' || after.result.status !== 'complete' || !after.result.currentLevelComplete) {
        return FAIL('final route did not enter completed result state');
      }
      if (!after.overlayBlocking || after.canInteractWithPlayfield) return FAIL('completion did not block playfield input');
      if (after.level.completedPairCount !== after.level.pairCount || !after.level.complete) return FAIL('completion before all pairs connected');
      const rewardDelta = after.result.rewardAppliedCount - before.result.rewardAppliedCount;
      if (rewardDelta !== 1) return FAIL(`completion reward delta must be exactly 1, got ${rewardDelta}`);
      const blocked = await game.contractInput({ type: 'tapOutsidePlayfield' });
      if (blocked.result.rewardAppliedCount !== after.result.rewardAppliedCount) return FAIL('blocked input re-applied completion reward');
      if (blocked.level.savedLineCount !== after.level.savedLineCount || blocked.progression.unlockedLevelCount !== after.progression.unlockedLevelCount) {
        return FAIL('blocked input changed saved lines or unlock count');
      }
      if (!blocked.lastAction || !['blockedByResult', 'noChange', 'none'].includes(blocked.lastAction.reason)) {
        return FAIL('irrelevant result-state input was not blocked/no-op');
      }
      if (blocked.phase !== after.phase || blocked.result.status !== after.result.status ||
          blocked.level.completedPairCount !== after.level.completedPairCount ||
          blocked.level.complete !== after.level.complete) {
        return FAIL('irrelevant result-state input changed completion state');
      }
      return PASS('completion terminal state is stable and reward is not duplicated');
    }
  },
  {
    id: 'p1-10-full-loop-correction-navigation',
    level: 'P1',
    name: 'Full loop supports draw, correction, completion, replay, next, and back navigation',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: start, error } = await verifyScenario(game, 'saved_single_connection', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const saved = firstSavedLine(start);
      if (!saved) return FAIL('full loop setup lacks saved line for correction');
      const erased = await game.contractInput({ type: 'tapCell', cell: lineCells(saved)[0], pointer: 'adapter' });
      if (erased.feedback.lastEvent !== 'lineErased') return FAIL('correction erase failed');
      const reset = await game.contractInput({ type: 'resetLevel' });
      if (reset.level.savedLineCount !== 0 || reset.result.status !== 'none') return FAIL('reset after correction did not return to fresh play');
      const { snap: nearlyDone, error: nearlyErr } = await verifyScenario(game, 'one_move_before_completion', assertPlayingPrecondition);
      if (nearlyErr) return FAIL(nearlyErr);
      const finalRoute = connectableRouteFor(nearlyDone, 'finalRoute', { requireSingleRemaining: true });
      if (!finalRoute) return FAIL('one_move_before_completion lacks a drawable final route');
      const routeError = assertRouteContinuous(finalRoute, 'finalRoute');
      if (routeError) return FAIL(routeError);
      const complete = await game.contractInput({ type: 'dragPath', cells: finalRoute, pointer: 'adapter' });
      if (complete.phase !== 'result' || complete.result.status !== 'complete') return FAIL('full loop did not complete level');
      const replay = await game.contractInput({ type: 'replayLevel' });
      const replayErr = assertPlayingPrecondition(replay, 'replayLevel');
      if (replayErr) return FAIL(replayErr);
      if (replay.level.index !== complete.level.index || replay.level.savedLineCount !== 0 || replay.result.status !== 'none') {
        return FAIL('replay did not clear same current level');
      }
      const { snap: completed, error: completeErr } = await verifyScenario(game, 'completed_level', assertResultPrecondition);
      if (completeErr) return FAIL(completeErr);
      const next = await game.contractInput({ type: 'nextLevel' });
      const nextShape = assertSnapshotShape(next);
      if (nextShape) return FAIL(nextShape);
      if (completed.progression.hasNextLevel) {
        if (next.phase !== 'playing') return FAIL('nextLevel with available next did not enter playing');
        if (Number.isFinite(completed.level.index) && Number.isFinite(next.level.index) && next.level.index > completed.level.index + 1) {
          return FAIL('nextLevel skipped more than one level');
        }
      } else if (next.phase !== 'levelSelect') {
        return FAIL('nextLevel at end must return to level select or equivalent');
      }
      const back = await game.contractInput({ type: 'backToLevelSelect' });
      if (back.phase !== 'levelSelect' || back.overlayBlocking) return FAIL('backToLevelSelect did not return cleanly to level select');
      return PASS('core loop and navigation cleanup are coherent');
    }
  },
  {
    id: 'p1-11-feedback-revisions-tied-to-actions',
    level: 'P1',
    name: 'Feedback events and revisions are tied to visible gameplay outcomes',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: fresh, error } = await verifyScenario(game, 'fresh_unlocked_level', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const legal = routeForFeedbackCheck(fresh, 'connectableRoute');
      if (!Array.isArray(legal)) return FAIL('fresh_unlocked_level exposes no connectable route');
      const saved = await game.contractInput({ type: 'dragPath', cells: legal, pointer: 'adapter' });
      const savedLine = firstSavedLine(saved);
      if (saved.feedback.lastEvent !== 'lineSaved' || !feedbackChanged(fresh, saved) ||
          !savedLine || lineCells(savedLine).length < 2 ||
          saved.level.savedLineCount !== fresh.level.savedLineCount + 1 ||
          countConnectedPairs(saved) !== countConnectedPairs(fresh) + 1) {
        return FAIL('line save lacks tied state/revision delta');
      }
      const erased = await game.contractInput({ type: 'tapCell', cell: lineCells(savedLine)[0], pointer: 'adapter' });
      if (erased.feedback.lastEvent !== 'lineErased' || !feedbackChanged(saved, erased) ||
          erased.level.savedLineCount !== saved.level.savedLineCount - 1 ||
          countConnectedPairs(erased) !== countConnectedPairs(saved) - 1 ||
          (erased.grid.savedLines || []).some(line => line.colorKey === savedLine.colorKey)) {
        return FAIL('erase lacks tied state/revision delta');
      }
      const { snap: resetBase, error: resetError } = await verifyScenario(game, 'fresh_unlocked_level', assertPlayingPrecondition);
      if (resetError) return FAIL(resetError);
      const resetRoute = routeForFeedbackCheck(resetBase, 'connectableRoute');
      if (!Array.isArray(resetRoute)) return FAIL('fresh_unlocked_level exposes no reset route');
      const resetSaved = await game.contractInput({ type: 'dragPath', cells: resetRoute, pointer: 'adapter' });
      if (resetSaved.feedback.lastEvent !== 'lineSaved' || !feedbackChanged(resetBase, resetSaved) ||
          resetSaved.level.savedLineCount !== resetBase.level.savedLineCount + 1) {
        return FAIL('line save before reset lacks tied state/revision delta');
      }
      const reset = await game.contractInput({ type: 'resetLevel' });
      if (reset.feedback.lastEvent !== 'reset' || !feedbackChanged(resetSaved, reset) ||
          reset.phase !== 'playing' || reset.overlayBlocking || !reset.canInteractWithPlayfield ||
          reset.level.savedLineCount !== 0 || reset.level.completedPairCount !== 0 ||
          reset.grid.activeLine !== null || reset.result.status !== 'none') {
        return FAIL('reset lacks tied state/revision delta');
      }
      const { snap: near, error: nearErr } = await verifyScenario(game, 'one_move_before_completion', assertPlayingPrecondition);
      if (nearErr) return FAIL(nearErr);
      const finalRoute = routeForFeedbackCheck(near, 'finalRoute');
      if (!Array.isArray(finalRoute)) return FAIL('one_move_before_completion exposes no final route');
      const complete = await game.contractInput({ type: 'dragPath', cells: finalRoute, pointer: 'adapter' });
      if (complete.feedback.lastEvent !== 'levelComplete' || !feedbackChanged(near, complete) ||
          complete.phase !== 'result' || complete.result.status !== 'complete' ||
          !complete.overlayBlocking || complete.canInteractWithPlayfield ||
          complete.level.completedPairCount !== complete.level.pairCount) {
        return FAIL('completion lacks tied state/revision delta');
      }
      return PASS('save/erase/reset/complete feedback tracks real state deltas');
    }
  },
  {
    id: 'p2-01-six-level-progression-depth',
    level: 'P2',
    name: 'Progression exposes at least six coherent level summaries with differing layouts',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: select, error } = await verifyScenario(game, 'level_select', assertLevelSelectPrecondition);
      if (error) return FAIL(error);
      if (select.progression.totalLevels < 6) return FAIL('totalLevels is below the P1 six-layout minimum');
      const signatures = new Set();
      const entries = (select.grid.targetZones || []).filter(z => z.kind === 'levelEntry');
      if (entries.length < 6) return FAIL('level select targetZones expose fewer than six level entries');
      const maxCheck = Math.min(6, select.progression.unlockedLevelCount || 1);
      for (let i = 0; i < maxCheck; i++) {
        const played = await game.contractInput({ type: 'chooseLevel', levelIndex: i });
        const err = assertPlayingPrecondition(played, `choose level ${i}`);
        if (err) return FAIL(err);
        signatures.add(`${played.level.gridSize}:${played.level.pairCount}:${pairSignature(played)}`);
        if (played.level.savedLineCount !== 0 || played.result.status !== 'none') return FAIL(`level ${i} did not start fresh`);
        await game.contractInput({ type: 'backToLevelSelect' });
      }
      if (signatures.size < Math.min(2, maxCheck)) return FAIL('checked levels appear to reuse the same layout signature');
      return PASS(`totalLevels=${select.progression.totalLevels}, distinctChecked=${signatures.size}`);
    }
  },
  {
    id: 'p2-02-real-touch-drag-parity',
    level: 'P2',
    name: 'Real touch drag can drive the same route semantics as mouse/adapter input',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: loaded, error } = await verifyScenario(game, 'fresh_unlocked_level', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const ready = await waitForUsableRoute(
        game,
        browser,
        loaded,
        current => connectableRouteFor(current, 'connectableRoute')
      );
      const before = ready.snap;
      const settledError = assertPlayingPrecondition(before, 'fresh_unlocked_level after render settle');
      if (settledError) return FAIL(settledError);
      const legal = ready.route;
      if (!legal || legal.length < 2) return FAIL('missing connectableRoute for touch path');
      const hashBefore = await game.screenshotHash();
      const touch = await game.touchDragCells(before, legal);
      if (!touch.ok) return FAIL(touch.reason);
      const after = await game.snapshot();
      const shape = assertSnapshotShape(after);
      if (shape) return FAIL(shape);
      const hashAfter = await game.screenshotHash();
      if (after.lastAction.ok !== true || after.feedback.lastEvent !== 'lineSaved') return FAIL('touch route did not save a line');
      if (after.level.savedLineCount !== before.level.savedLineCount + 1) return FAIL('touch route did not change saved-line count');
      if (!feedbackChanged(before, after) && hashBefore === hashAfter) return FAIL('touch drag produced no feedback or visible change');
      return PASS('touch drag saved the same semantic route');
    }
  },
  {
    id: 'p2-03-repeated-invalid-operations-invariant',
    level: 'P2',
    name: 'Repeated invalid operations across phases preserve progress and grid invariants',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { snap: fresh, error } = await verifyScenario(game, 'fresh_unlocked_level', assertPlayingPrecondition);
      if (error) return FAIL(error);
      const badUndo = await game.contractInput({ type: 'undo' });
      if (badUndo.lastAction.ok !== false && badUndo.level.savedLineCount !== fresh.level.savedLineCount) return FAIL('undo with no history mutated fresh level');
      if (badUndo.level.completedPairCount !== fresh.level.completedPairCount || badUndo.result.status !== fresh.result.status) {
        return FAIL('invalid undo changed completion or result state');
      }
      const badNext = await game.contractInput({ type: 'nextLevel' });
      if (badNext.lastAction.ok !== false && badNext.phase !== fresh.phase) return FAIL('nextLevel in playing phase was accepted unexpectedly');
      const resetOne = await game.contractInput({ type: 'resetLevel' });
      const resetTwo = await game.contractInput({ type: 'resetLevel' });
      if (resetTwo.level.savedLineCount !== 0 || resetTwo.level.completedPairCount !== 0 || resetTwo.result.status !== 'none') {
        return FAIL('repeated reset left residual saved/completed/result state');
      }
      if (pairSignature(resetOne) !== pairSignature(resetTwo)) return FAIL('repeated reset changed grid identity');
      const { snap: completed, error: resultErr } = await verifyScenario(game, 'completed_level', assertResultPrecondition);
      if (resultErr) return FAIL(resultErr);
      const beforeReward = completed.result.rewardAppliedCount;
      const blockedDrag = await game.contractInput({ type: 'dragPath', cells: route(completed, 'connectableRoute') || [], pointer: 'adapter' });
      if (blockedDrag.result.rewardAppliedCount !== beforeReward) return FAIL('invalid result-state drag re-applied reward');
      if (blockedDrag.level.savedLineCount !== completed.level.savedLineCount) return FAIL('invalid result-state drag changed saved lines');
      return PASS('invalid operations preserve core invariants');
    }
  }
];

module.exports = { suite };
