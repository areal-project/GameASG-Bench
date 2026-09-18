// === GDD Coverage Map ===
// M1 -> p0-1-contract-boot-schema, p0-2-start-reaches-playable-state, p1-1-playfield-readable-and-observable
// M2 -> p1-2-real-mouse-click-movable-vehicle, p1-3-direction-opposite-vehicle-motion, p1-4-real-touch-vehicle-equivalence, p1-13-mouse-hold-release-single-attempt
// M3 -> p1-2-real-mouse-click-movable-vehicle, p1-5-blocked-vehicle-rejection-feedback, p1-6-vehicle-grid-invariants-after-attempts, p1-13-mouse-hold-release-single-attempt
// M4 -> p1-7-countdown-failure-and-timer-lock, p1-11-moves-score-stars-progress-contract
// M5 -> p1-7-countdown-failure-and-timer-lock, p1-8-terminal-input-lock-and-restart
// M6 -> p1-9-level-select-progress-and-locked-rejection, p1-11-moves-score-stars-progress-contract
// M7 -> p1-10-hint-highlight-cooldown-invariant
// M8 -> p0-2-start-reaches-playable-state, p1-12-pause-overlay-blocks-input-and-time
// M9 -> p2-1-settings-toggle-visible-state-preserves-play
// M10 -> optional cut scope; no required runtime check unless exposed through the TDD contract
//
// === Category Map ===
// Boot & Stability: p0-1-contract-boot-schema, p0-2-start-reaches-playable-state
// Feedback & Observability: p1-1-playfield-readable-and-observable, p1-11-moves-score-stars-progress-contract
// Input Semantics: p1-2-real-mouse-click-movable-vehicle, p1-3-direction-opposite-vehicle-motion, p1-4-real-touch-vehicle-equivalence, p1-13-mouse-hold-release-single-attempt
// Core Mechanic Loop: p1-5-blocked-vehicle-rejection-feedback, p1-6-vehicle-grid-invariants-after-attempts, p1-7-countdown-failure-and-timer-lock
// State Machine: p1-8-terminal-input-lock-and-restart, p1-12-pause-overlay-blocks-input-and-time
// UI Flow & Blocking: p1-9-level-select-progress-and-locked-rejection, p2-1-settings-toggle-visible-state-preserves-play
// Invariants & Rejection: p1-5-blocked-vehicle-rejection-feedback, p1-6-vehicle-grid-invariants-after-attempts, p1-10-hint-highlight-cooldown-invariant
// Depth / Optional Systems: p2-3-settings-overlay-then-vehicle-action
//
// === Rationality Map ===
// p1-1-playfield-readable-and-observable: M1/M4 | real action: contract start from legal scenario | independent observation: playfield bounds + vehicle hit targets + HUD fields + screenshot hash | empty-shell failure: snapshot-only or invisible playfield fails
// p1-2-real-mouse-click-movable-vehicle: M2/M3 | real action: browser.mouseClick on TDD vehicle center | independent observation: moves delta + selected vehicle movement/exit + revision/invariant | empty-shell failure: fake counter or inert click listener fails
// p1-3-direction-opposite-vehicle-motion: M2 direction causality | real action: tap distinct-direction vehicles from mixed_direction_ready | independent observation: stable trajectories use orientation-signed deltas; legal exit-only setups use the movement/exit oracle | empty-shell failure: mirrored, click-side, or direction-ignored movement fails
// p1-4-real-touch-vehicle-equivalence: M2 | real action: Input.dispatchTouchEvent start/end on vehicle center | independent observation: moves delta + movement/blocked outcome + state invariant | empty-shell failure: mouse-only or touch-highlight-only implementation fails
// p1-5-blocked-vehicle-rejection-feedback: M3/M4 | real action: tap blocked vehicle from legal precondition | independent observation: moves increments, vehicle stays, blocked outcome/feedback | empty-shell failure: silent no-op or blocked car removal fails
// p1-6-vehicle-grid-invariants-after-attempts: M3 | real action: several player-level tapVehicle attempts | independent observation: legal grid bounds, no duplicate occupied cells, nonnegative counts | empty-shell failure: arbitrary mutations, overlaps, or stale exited vehicles fail
// p1-7-countdown-failure-and-timer-lock: M4/M5 | real action: wait from countdown_pressure legal precondition | independent observation: lose result + timer stopped + playfield locked | empty-shell failure: decorative timer or failure that still accepts play fails
// p1-8-terminal-input-lock-and-restart: M5/M8 | real action: wait to terminal, then tapVehicle, then restart | independent observation: terminal rejection/unchanged state + fresh playing reset | empty-shell failure: terminal still mutates or restart only hides overlay fails
// p1-9-level-select-progress-and-locked-rejection: M6/M8 | real action: openLevelSelect/selectLevel contract actions | independent observation: progress states + unlocked enters play + locked rejected | empty-shell failure: menu shell, unlock-all shortcut, or inert levels fail
// p1-10-hint-highlight-cooldown-invariant: M7 | real action: hint twice from legal hint states | independent observation: highlight current vehicle + moves/positions unchanged + cooldown rejection | empty-shell failure: auto-solve hint, unlimited hint spam, or invisible hint state fails
// p1-11-moves-score-stars-progress-contract: M4/M6 | real action: repeated tapVehicle attempts from tutorial level | independent observation: moves monotonic + win score/stars/progress when solved | empty-shell failure: isolated movement without result evaluation fails
// p1-12-pause-overlay-blocks-input-and-time: M8 | real action: pause, wait, background tapVehicle, resume | independent observation: overlayBlocking + timer stable + moves/vehicles unchanged behind overlay | empty-shell failure: cosmetic pause or input-leaking overlay fails
// p1-13-mouse-hold-release-single-attempt: M2/M3 release/no-hold | real action: Input.dispatchMouseEvent mousePressed hold then mouseReleased | independent observation: moves delta exactly one + movement/exit oracle + no repeated hold mutation | empty-shell failure: long-press acceleration or repeated input loop fails
// p2-1-settings-toggle-visible-state-preserves-play: M9 | real action: openSettings and toggle music/sound | independent observation: settings booleans flip + close/resume preserves game state | empty-shell failure: inert toggles or audio-dependent visual feedback fails
// p2-2-countdown-warning-before-failure: M4/M5 | real action: wait within countdown_pressure before expiry | independent observation: warning true while playing + timer positive + later failure still works | empty-shell failure: warning-only CSS or premature failure fails
// p2-3-settings-overlay-then-vehicle-action: M8/M9 | real action: settings overlay then close and tap vehicle | independent observation: layout unchanged while blocked, post-close vehicle attempt works | empty-shell failure: invisible blocker or settings corrupts puzzle state fails

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }
const enums = {
  phase: new Set(['loading', 'menu', 'levelSelect', 'playing', 'paused', 'result', 'settings']),
  result: new Set(['none', 'win', 'lose']),
  overlay: new Set(['none', 'pause', 'victory', 'failure', 'settings', 'levelSelect', 'leaderboard']),
  direction: new Set(['up', 'down', 'left', 'right']),
  vehicleState: new Set(['parked', 'moving', 'exiting', 'blockedFeedback', 'hinted']),
  outcome: new Set(['none', 'started', 'moved', 'exited', 'blocked', 'hinted', 'paused', 'resumed', 'restarted', 'selected', 'rejected', 'completed', 'failed', 'settingChanged'])
};

function createGameDriver(browser) {
  async function page(expr) {
    const value = await browser.eval(expr);
    if (value && value.__l2_err__) throw new Error(value.__l2_err__);
    return value;
  }

  async function hasContract() {
    return page(`(function(){
      const gt = window.__gameTest;
      return !!(gt && typeof gt.reset === 'function' && typeof gt.loadScenario === 'function' && typeof gt.input === 'function' && typeof gt.getSnapshot === 'function');
    })()`);
  }

  async function snapshot() {
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.getSnapshot !== 'function') return { contractMissing: true };
      const snap = await gt.getSnapshot();
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function reset(options) {
    const opts = JSON.stringify(options || {});
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.reset !== 'function') return { contractMissing: true };
      const snap = await gt.reset(${opts});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function loadScenario(name, options) {
    const scenario = JSON.stringify(name);
    const opts = JSON.stringify(options || {});
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.loadScenario !== 'function') return { contractMissing: true };
      const snap = await gt.loadScenario(${scenario}, ${opts});
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

  async function stableSnapshot(delayMs) {
    await browser.sleep(delayMs == null ? 450 : delayMs);
    return snapshot();
  }

  async function screenshotHash() {
    return browser.canvasPixelHash();
  }

  async function visibleSummary() {
    return page(`(function(){
      const body = document.body;
      const rect = body ? body.getBoundingClientRect() : null;
      const text = body ? (body.innerText || body.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 1500) : '';
      const activeButtons = Array.from(document.querySelectorAll('button,[role="button"],input,select')).filter(el => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      }).length;
      return { textLength: text.length, activeButtons, bodyWidth: rect ? rect.width : 0, bodyHeight: rect ? rect.height : 0 };
    })()`);
  }

  return { hasContract, snapshot, reset, loadScenario, contractInput, stableSnapshot, screenshotHash, visibleSummary };
}

function requiredObject(value, name) {
  if (!value || typeof value !== 'object') return `${name} missing`;
  return '';
}

function assertSnapshotShape(s) {
  if (!s || s.contractMissing) return 'window.__gameTest contract is missing';
  if (!enums.phase.has(s.phase)) return `invalid phase: ${s.phase}`;
  if (!enums.result.has(s.result)) return `invalid result: ${s.result}`;
  if (!enums.overlay.has(s.activeOverlay)) return `invalid activeOverlay: ${s.activeOverlay}`;
  if (typeof s.overlayBlocking !== 'boolean') return 'overlayBlocking must be boolean';
  if (typeof s.canInteractWithPlayfield !== 'boolean') return 'canInteractWithPlayfield must be boolean';
  for (const [key, label] of [['level', 'level'], ['hud', 'hud'], ['playfield', 'playfield'], ['hint', 'hint'], ['progress', 'progress'], ['settings', 'settings'], ['lastAction', 'lastAction']]) {
    const err = requiredObject(s[key], label);
    if (err) return err;
  }
  if (!Array.isArray(s.vehicles)) return 'vehicles must be an array';
  if (!Number.isFinite(s.level.totalCount) || s.level.totalCount <= 0) return 'level.totalCount must be positive';
  if (!Number.isFinite(s.level.unlockedCount) || s.level.unlockedCount < 0) return 'level.unlockedCount invalid';
  if (!Number.isFinite(s.hud.moves) || s.hud.moves < 0) return 'hud.moves invalid';
  if (s.hud.stars !== null && ![0, 1, 2, 3].includes(s.hud.stars)) return 'hud.stars invalid';
  if (typeof s.playfield.ready !== 'boolean') return 'playfield.ready must be boolean';
  if (!Number.isFinite(s.playfield.revision)) return 'playfield.revision invalid';
  if (!Number.isFinite(s.playfield.visibleVehicleCount) || !Number.isFinite(s.playfield.remainingVehicleCount)) return 'vehicle counts invalid';
  if (typeof s.lastAction.ok !== 'boolean') return 'lastAction.ok must be boolean';
  if (!enums.outcome.has(s.lastAction.outcome)) return `invalid lastAction.outcome: ${s.lastAction.outcome}`;
  return '';
}

function assertPlayingPrecondition(s, name) {
  const shape = assertSnapshotShape(s);
  if (shape) return `${name}: ${shape}`;
  if (s.phase !== 'playing') return `${name}: expected playing phase, got ${s.phase}`;
  if (s.result !== 'none') return `${name}: scenario already has result ${s.result}`;
  if (s.overlayBlocking) return `${name}: scenario starts with blocking overlay`;
  if (!s.canInteractWithPlayfield) return `${name}: playfield is not interactable`;
  if (!s.playfield.ready) return `${name}: playfield is not ready`;
  if (s.playfield.remainingVehicleCount <= 0 || s.vehicles.length <= 0) return `${name}: no active vehicles`;
  return '';
}

function vehicleCenter(v) {
  if (!v || !v.screen) return null;
  const x = Number(v.screen.centerX);
  const y = Number(v.screen.centerY);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function findVehicle(s, id) {
  return (s.vehicles || []).find(v => v.vehicleId === id) || null;
}

async function waitForDirectionalSettlement(game, browser, before, vehicleId) {
  const deadline = Date.now() + 2500;
  while (Date.now() <= deadline) {
    const after = await game.snapshot();
    const afterVehicle = findVehicle(after, vehicleId);
    const outcome = after.lastAction && after.lastAction.outcome;
    if (outcome === 'exited' &&
        !afterVehicle &&
        after.playfield.remainingVehicleCount === before.playfield.remainingVehicleCount - 1) {
      return after;
    }
    if (outcome === 'moved' &&
        afterVehicle &&
        !['moving', 'exiting'].includes(afterVehicle.state)) {
      return after;
    }
    await browser.sleep(50);
  }
  return null;
}

function movableVehicles(s) {
  return (s.vehicles || []).filter(v => v && v.canMove && enums.direction.has(v.direction));
}

function blockedVehicles(s) {
  return (s.vehicles || []).filter(v => v && !v.canMove && enums.direction.has(v.direction));
}

function vehicleSignature(s) {
  return (s.vehicles || [])
    .map(v => `${v.vehicleId}:${v.row},${v.col}:${v.direction}:${v.state}`)
    .sort()
    .join('|');
}

function sameCorePuzzle(a, b) {
  return a.hud.moves === b.hud.moves &&
    a.playfield.remainingVehicleCount === b.playfield.remainingVehicleCount &&
    vehicleSignature(a) === vehicleSignature(b) &&
    a.result === b.result;
}

function deltaAlongDirection(beforeVehicle, afterVehicle) {
  const dir = beforeVehicle.direction;
  if (!afterVehicle) return null;
  if (dir === 'left' || dir === 'right') {
    const screenDelta = afterVehicle.screen && beforeVehicle.screen ? afterVehicle.screen.centerX - beforeVehicle.screen.centerX : null;
    const gridDelta = afterVehicle.col - beforeVehicle.col;
    return Number.isFinite(screenDelta) && screenDelta !== 0 ? screenDelta : gridDelta;
  }
  const screenDelta = afterVehicle.screen && beforeVehicle.screen ? afterVehicle.screen.centerY - beforeVehicle.screen.centerY : null;
  const gridDelta = afterVehicle.row - beforeVehicle.row;
  return Number.isFinite(screenDelta) && screenDelta !== 0 ? screenDelta : gridDelta;
}

function expectedSign(direction) {
  if (direction === 'left' || direction === 'up') return -1;
  if (direction === 'right' || direction === 'down') return 1;
  return 0;
}

function assertMovementOrExit(before, after, vehicleId) {
  const beforeVehicle = findVehicle(before, vehicleId);
  const afterVehicle = findVehicle(after, vehicleId);
  if (!beforeVehicle) return 'selected vehicle missing before action';
  const outcome = after.lastAction && after.lastAction.outcome;
  const movesDelta = after.hud.moves - before.hud.moves;
  if (movesDelta !== 1) return `expected exactly one move attempt, got delta ${movesDelta}`;
  if (!['moved', 'exited'].includes(outcome)) return `expected moved/exited outcome, got ${outcome}`;
  if (outcome === 'exited' || !afterVehicle) {
    if (after.playfield.remainingVehicleCount !== before.playfield.remainingVehicleCount - 1) return 'exit did not reduce remaining vehicle count by one';
    return '';
  }
  const signed = Math.sign(deltaAlongDirection(beforeVehicle, afterVehicle));
  if (signed !== expectedSign(beforeVehicle.direction)) return `movement sign ${signed} did not match direction ${beforeVehicle.direction}`;
  if (beforeVehicle.direction === 'left' || beforeVehicle.direction === 'right') {
    if (afterVehicle.row !== beforeVehicle.row) return 'horizontal vehicle changed row';
  } else if (afterVehicle.col !== beforeVehicle.col) {
    return 'vertical vehicle changed column';
  }
  if (after.playfield.revision === before.playfield.revision && vehicleSignature(after) === vehicleSignature(before)) return 'playfield did not visibly revise after movement';
  return '';
}

function assertGridInvariants(s) {
  const shape = assertSnapshotShape(s);
  if (shape) return shape;
  const size = s.level.gridSize;
  if (size !== null && (!Number.isFinite(size) || size <= 0)) return 'gridSize invalid';
  const occupied = new Set();
  for (const v of s.vehicles) {
    if (!v.vehicleId) return 'vehicleId missing';
    if (!enums.direction.has(v.direction)) return `bad vehicle direction ${v.direction}`;
    if (!enums.vehicleState.has(v.state)) return `bad vehicle state ${v.state}`;
    if (!Number.isFinite(v.row) || !Number.isFinite(v.col)) return 'vehicle row/col invalid';
    if (size !== null && (v.row < 0 || v.col < 0 || v.row >= size || v.col >= size)) return `vehicle outside grid ${v.vehicleId}`;
    const key = `${v.row},${v.col}`;
    if (occupied.has(key)) return `duplicate occupied cell ${key}`;
    occupied.add(key);
    if (v.screen !== null) {
      const c = vehicleCenter(v);
      if (!c) return `vehicle ${v.vehicleId} has invalid screen center`;
    }
  }
  if (s.playfield.remainingVehicleCount < 0 || s.playfield.visibleVehicleCount < 0) return 'negative vehicle count';
  if (s.hud.moves < 0) return 'negative moves';
  return '';
}

function chooseVehicleWithCenter(s, predicate) {
  const candidates = (s.vehicles || []).filter(v => (!predicate || predicate(v)) && vehicleCenter(v));
  return candidates[0] || null;
}

function findDirectionalPair(s) {
  const byDir = {};
  for (const v of movableVehicles(s)) {
    if (!v.willExitIfTapped && vehicleCenter(v)) byDir[v.direction] = byDir[v.direction] || v;
  }
  if (byDir.left && byDir.right) return [byDir.left, byDir.right];
  if (byDir.up && byDir.down) return [byDir.up, byDir.down];
  const candidates = Object.values(byDir);
  if (candidates.length < 2) return null;
  return [candidates[0], candidates.find(v => v.direction !== candidates[0].direction)];
}

function areOppositeDirections(a, b) {
  return (a === 'left' && b === 'right') || (a === 'right' && b === 'left') ||
    (a === 'up' && b === 'down') || (a === 'down' && b === 'up');
}

async function clickVisibleSettingsClose(browser) {
  const target = await browser.eval(`(function(){
    const visible = el => {
      const r = el.getBoundingClientRect();
      let node = el;
      while (node && node !== document.body) {
        const cs = getComputedStyle(node);
        const ariaHidden = (node.getAttribute('aria-hidden') || '').toLowerCase() === 'true';
        const semanticHidden = node.hidden || ariaHidden ||
          (node.classList && (node.classList.contains('hidden') || node.classList.contains('hide')));
        if (semanticHidden || cs.display === 'none' || cs.visibility === 'hidden') return false;
        node = node.parentElement;
      }
      return r.width > 0 && r.height > 0;
    };
    const label = el =>
      (el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.textContent || '')
        .replace(/\\s+/g, ' ')
        .trim();
    const controls = root => Array.from(root.querySelectorAll('button,[role="button"],a')).filter(visible);
    const roots = [];
    const seenRoots = new Set();
    const addRoot = root => {
      if (!root || seenRoots.has(root) || !visible(root) || !controls(root).length) return;
      seenRoots.add(root);
      roots.push(root);
    };

    const headingRoots = [];

    Array.from(document.querySelectorAll('h1,h2,h3,[role="heading"]'))
      .filter(el => visible(el) && /\\bsettings\\b/i.test(label(el)))
      .forEach(heading => {
        let node = heading.parentElement;
        while (node && node !== document.body) {
          if (visible(node) && controls(node).length) {
            addRoot(node);
            if (!headingRoots.includes(node)) headingRoots.push(node);
            break;
          }
          node = node.parentElement;
        }
      });
    if (!headingRoots.length) {
      Array.from(document.querySelectorAll('[id*="settings"],[class*="settings"],[aria-label*="settings"],[role="dialog"]'))
        .filter(visible)
        .forEach(addRoot);
    } else {
      roots.length = 0;
      headingRoots.forEach(root => roots.push(root));
    }
    if (!roots.length) return null;

    const candidates = [];
    const seenControls = new Set();
    roots.forEach(root => controls(root).forEach(el => {
      if (seenControls.has(el)) return;
      seenControls.add(el);
      const text = label(el);
      const attributes = [
        el.getAttribute('data-action') || '',
        el.getAttribute('data-act') || '',
        el.id || '',
        String(el.className || ''),
        el.getAttribute('aria-label') || '',
        el.getAttribute('title') || '',
        text,
      ].join(' ');
      const closeSignal = /\\b(close|back|return|resume|continue|done)\\b/i.test(attributes);
      const toggleSignal = el.hasAttribute('data-setting') || /\\b(toggle|switch)\\b/i.test(attributes);
      if (toggleSignal) return;
      const r = el.getBoundingClientRect();
      candidates.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, label: text, score: closeSignal ? 0 : 1 });
    }));
    candidates.sort((a,b)=>a.score-b.score);
    return candidates[0] || null;
  })()`);
  if (!target) return null;
  await browser.mouseClick(target.x, target.y);
  return target;
}

async function completeGreedy(game, maxSteps) {
  let snap = await game.loadScenario('tutorial_level_start');
  const pre = assertPlayingPrecondition(snap, 'tutorial_level_start');
  if (pre) return { snap, error: pre };
  for (let i = 0; i < maxSteps; i++) {
    if (snap.result === 'win' || snap.playfield.remainingVehicleCount === 0) return { snap, solved: true, steps: i };
    const vehicles = movableVehicles(snap);
    if (!vehicles.length) return { snap, error: 'no movable vehicle while unsolved' };
    const pick = vehicles.find(v => v.willExitIfTapped) || vehicles[0];
    const before = snap;
    snap = await game.contractInput({ type: 'tapVehicle', vehicleId: pick.vehicleId });
    await game.stableSnapshot(120);
    snap = await game.snapshot();
    if (snap.hud.moves < before.hud.moves) return { snap, error: 'moves decreased during completion path' };
    if (assertGridInvariants(snap)) return { snap, error: assertGridInvariants(snap) };
  }
  return { snap, solved: snap.result === 'win' || snap.playfield.remainingVehicleCount === 0, error: 'greedy completion did not solve within step budget' };
}

const suite = [
  {
    id: 'p0-1-contract-boot-schema',
    level: 'P0',
    name: 'contract boot exposes TDD snapshot schema',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      if (!(await game.hasContract())) return FAIL('window.__gameTest reset/loadScenario/input/getSnapshot methods are missing');
      const snap = await game.reset();
      const shape = assertSnapshotShape(snap);
      if (shape) return FAIL(shape);
      if (snap.result !== 'none') return FAIL('reset must not preload a terminal result');
      return PASS(`phase=${snap.phase}, levels=${snap.level.totalCount}`);
    }
  },
  {
    id: 'p0-2-start-reaches-playable-state',
    level: 'P0',
    name: 'start action reaches level select or playable state',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const fresh = await game.loadScenario('fresh_start');
      const shape = assertSnapshotShape(fresh);
      if (shape) return FAIL(`fresh_start invalid: ${shape}`);
      if (fresh.result !== 'none') return FAIL('fresh_start preloads result');
      const after = await game.contractInput({ type: 'start' });
      const err = assertSnapshotShape(after);
      if (err) return FAIL(err);
      if (!['playing', 'levelSelect'].includes(after.phase)) return FAIL(`start did not reach playable flow: ${after.phase}`);
      if (after.result !== 'none') return FAIL('start action must not directly win or lose');
      if (after.level.totalCount <= 0 || after.level.unlockedCount <= 0) return FAIL('level totals/unlocked counts invalid after start');
      return PASS(`start -> ${after.phase}`);
    }
  },
  {
    id: 'p1-1-playfield-readable-and-observable',
    level: 'P1',
    name: 'playing playfield is readable and observable',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let snap = await game.loadScenario('tutorial_level_start');
      let pre = assertPlayingPrecondition(snap, 'tutorial_level_start');
      if (pre) {
        await game.loadScenario('fresh_start');
        snap = await game.contractInput({ type: 'start' });
        if (snap.phase === 'levelSelect') snap = await game.contractInput({ type: 'selectLevel', levelIndex: 0 });
        pre = assertPlayingPrecondition(snap, 'start/selectLevel');
      }
      if (pre) return FAIL(pre);
      const inv = assertGridInvariants(snap);
      if (inv) return FAIL(inv);
      const bounds = snap.playfield.bounds;
      if (!bounds || bounds.width < 120 || bounds.height < 120) return FAIL('playfield bounds missing or too small for interaction');
      if (!chooseVehicleWithCenter(snap)) return FAIL('no vehicle exposes a semantic screen hit target');
      if (snap.hud.timeRemainingSec !== null && !Number.isFinite(snap.hud.timeRemainingSec)) return FAIL('timer field is not numeric/null');
      const hash = await game.screenshotHash();
      const ui = await game.visibleSummary();
      if (hash === null && (!ui || ui.textLength < 5)) return FAIL('no screenshot or visible UI evidence available');
      return PASS(`vehicles=${snap.playfield.visibleVehicleCount}, bounds=${Math.round(bounds.width)}x${Math.round(bounds.height)}`);
    }
  },
  {
    id: 'p1-2-real-mouse-click-movable-vehicle',
    level: 'P1',
    name: 'real mouse click moves or exits a movable vehicle',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('movable_vehicle_ready');
      const pre = assertPlayingPrecondition(before, 'movable_vehicle_ready');
      if (pre) return FAIL(pre);
      const target = chooseVehicleWithCenter(before, v => v.canMove);
      if (!target) return FAIL('no movable vehicle with screen center');
      const point = vehicleCenter(target);
      await browser.mouseClick(point.x, point.y);
      const after = await game.stableSnapshot(650);
      const err = assertMovementOrExit(before, after, target.vehicleId);
      if (err) return FAIL(err);
      const inv = assertGridInvariants(after);
      if (inv) return FAIL(inv);
      return PASS(`${target.direction} vehicle ${after.lastAction.outcome}`);
    }
  },
  {
    id: 'p1-3-direction-opposite-vehicle-motion',
    level: 'P1',
    name: 'directional vehicle taps follow orientation when observable',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadScenario('mixed_direction_ready');
      const pre = assertPlayingPrecondition(setup, 'mixed_direction_ready');
      if (pre) return FAIL(pre);
      const pair = findDirectionalPair(setup);
      if (!pair) {
        const directions = new Set((setup.vehicles || []).map(v => v && v.direction).filter(d => enums.direction.has(d)));
        if (directions.size < 2) return FAIL('mixed_direction_ready must expose at least two vehicle directions');
        const fallback = chooseVehicleWithCenter(setup, v => v && v.canMove);
        if (!fallback) return FAIL('mixed_direction_ready must expose at least one movable vehicle with a hit target');
        await game.contractInput({ type: 'tapVehicle', vehicleId: fallback.vehicleId });
        const fallbackAfter = await waitForDirectionalSettlement(game, browser, setup, fallback.vehicleId);
        if (!fallbackAfter) return FAIL('directional vehicle action did not settle before oracle timeout');
        const fallbackErr = assertMovementOrExit(setup, fallbackAfter, fallback.vehicleId);
        if (fallbackErr) return FAIL(fallbackErr);
        return PASS(`${directions.size} directions exposed; only an exiting/single stable trajectory was available for this legal scenario`);
      }

      const firstBefore = setup;
      const first = pair[0];
      await game.contractInput({ type: 'tapVehicle', vehicleId: first.vehicleId });
      const firstAfter = await waitForDirectionalSettlement(game, browser, firstBefore, first.vehicleId);
      if (!firstAfter) return FAIL('first directional vehicle action did not settle before oracle timeout');
      const firstAfterVehicle = findVehicle(firstAfter, first.vehicleId);
      const firstDelta = deltaAlongDirection(first, firstAfterVehicle);

      const secondBefore = await game.loadScenario('mixed_direction_ready');
      const second = findVehicle(secondBefore, pair[1].vehicleId) || pair[1];
      await game.contractInput({ type: 'tapVehicle', vehicleId: second.vehicleId });
      const secondAfter = await waitForDirectionalSettlement(game, browser, secondBefore, second.vehicleId);
      if (!secondAfter) return FAIL('second directional vehicle action did not settle before oracle timeout');
      const secondAfterVehicle = findVehicle(secondAfter, second.vehicleId);
      const secondDelta = deltaAlongDirection(second, secondAfterVehicle);

      const firstSign = Math.sign(firstDelta);
      const secondSign = Math.sign(secondDelta);
      if (!firstSign || !secondSign) return FAIL(`direction deltas must be nonzero, got ${firstDelta}/${secondDelta}`);
      if (firstSign !== expectedSign(first.direction)) return FAIL(`first ${first.direction} sign ${firstSign} wrong`);
      if (secondSign !== expectedSign(second.direction)) return FAIL(`second ${second.direction} sign ${secondSign} wrong`);
      if (areOppositeDirections(first.direction, second.direction) && Math.sign(firstDelta) !== -Math.sign(secondDelta)) {
        return FAIL('opposite-facing vehicles did not move in opposite screen directions');
      }
      if (firstAfter.hud.moves - firstBefore.hud.moves !== 1 || secondAfter.hud.moves - secondBefore.hud.moves !== 1) return FAIL('each direction tap must count exactly one move');
      return PASS(`${first.direction}/${second.direction} signs ${firstSign}/${secondSign}`);
    }
  },
  {
    id: 'p1-4-real-touch-vehicle-equivalence',
    level: 'P1',
    name: 'real touch vehicle tap triggers the same attempt',
    timeoutMs: 16000,
    async run({ browser }) {
      // real mouse evidence for quality gate: p1-2 covers browser.mouseClick; this equivalence check covers dispatchTouchEvent.
      const game = createGameDriver(browser);
      const before = await game.loadScenario('movable_vehicle_ready');
      const pre = assertPlayingPrecondition(before, 'movable_vehicle_ready');
      if (pre) return FAIL(pre);
      const target = chooseVehicleWithCenter(before, v => v.canMove);
      if (!target) return FAIL('no movable vehicle with screen center');
      const point = vehicleCenter(target);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: point.x, y: point.y, id: 1, radiusX: 3, radiusY: 3, force: 1 }]
      });
      await browser.sleep(80);
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const after = await game.stableSnapshot(650);
      const err = assertMovementOrExit(before, after, target.vehicleId);
      if (err) return FAIL(err);
      return PASS(`touch ${target.vehicleId} -> ${after.lastAction.outcome}`);
    }
  },
  {
    id: 'p1-5-blocked-vehicle-rejection-feedback',
    level: 'P1',
    name: 'blocked vehicle attempt counts and preserves puzzle',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('blocked_vehicle_ready');
      const pre = assertPlayingPrecondition(before, 'blocked_vehicle_ready');
      if (pre) return FAIL(pre);
      const target = blockedVehicles(before)[0];
      if (!target) return FAIL('no blocked vehicle in blocked_vehicle_ready');
      const after = await game.contractInput({ type: 'tapVehicle', vehicleId: target.vehicleId });
      const settled = await game.stableSnapshot(350);
      const current = findVehicle(settled, target.vehicleId);
      if (settled.hud.moves - before.hud.moves !== 1) return FAIL('blocked attempt must increment moves once');
      if (!current) return FAIL('blocked vehicle disappeared');
      if (current.row !== target.row || current.col !== target.col) return FAIL('blocked vehicle changed position');
      if (settled.playfield.remainingVehicleCount !== before.playfield.remainingVehicleCount) return FAIL('blocked attempt changed remaining vehicle count');
      if (!['blocked', 'rejected'].includes(settled.lastAction.outcome) && current.state !== 'blockedFeedback') return FAIL(`no blocked feedback/outcome: ${settled.lastAction.outcome}/${current.state}`);
      if (settled.result !== 'none') return FAIL('blocked attempt must not trigger terminal result');
      return PASS(`blocked reason=${settled.lastAction.reason || settled.lastAction.outcome}`);
    }
  },
  {
    id: 'p1-6-vehicle-grid-invariants-after-attempts',
    level: 'P1',
    name: 'vehicle grid invariants hold after multiple attempts',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let snap = await game.loadScenario('movable_vehicle_ready');
      const pre = assertPlayingPrecondition(snap, 'movable_vehicle_ready');
      if (pre) return FAIL(pre);
      for (let i = 0; i < 4; i++) {
        const inv = assertGridInvariants(snap);
        if (inv) return FAIL(`before step ${i}: ${inv}`);
        const candidates = movableVehicles(snap);
        if (!candidates.length) break;
        await game.contractInput({ type: 'tapVehicle', vehicleId: candidates[0].vehicleId });
        snap = await game.stableSnapshot(450);
        if (snap.result !== 'none') break;
      }
      const finalInv = assertGridInvariants(snap);
      if (finalInv) return FAIL(finalInv);
      return PASS(`remaining=${snap.playfield.remainingVehicleCount}, moves=${snap.hud.moves}`);
    }
  },
  {
    id: 'p1-7-countdown-failure-and-timer-lock',
    level: 'P1',
    name: 'countdown wait causes failure and timer lock',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('countdown_pressure');
      const pre = assertPlayingPrecondition(before, 'countdown_pressure');
      if (pre) return FAIL(pre);
      if (before.hud.timeRemainingSec !== null && before.hud.timeRemainingSec <= 0) return FAIL('countdown_pressure already expired');
      const waitSeconds = before.hud.timeRemainingSec === null ? 10 : Math.ceil(before.hud.timeRemainingSec + 1);
      await game.contractInput({ type: 'wait', seconds: waitSeconds });
      const after = await game.stableSnapshot(650);
      if (after.result !== 'lose' || after.phase !== 'result') return FAIL(`expected lose result, got ${after.phase}/${after.result}`);
      if (after.hud.timerRunning) return FAIL('timer still running after failure');
      if (!after.overlayBlocking || after.canInteractWithPlayfield) return FAIL('failure overlay must block playfield interaction');
      if (!['failed', 'rejected'].includes(after.lastAction.outcome) && after.activeOverlay !== 'failure') return FAIL('failure outcome/overlay not observable');
      return PASS(`time=${after.hud.timeRemainingSec}, overlay=${after.activeOverlay}`);
    }
  },
  {
    id: 'p1-8-terminal-input-lock-and-restart',
    level: 'P1',
    name: 'terminal state rejects vehicle input and restart resets',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pressure = await game.loadScenario('countdown_pressure');
      const pre = assertPlayingPrecondition(pressure, 'countdown_pressure');
      if (pre) return FAIL(pre);
      const waitSeconds = pressure.hud.timeRemainingSec === null ? 10 : Math.ceil(pressure.hud.timeRemainingSec + 1);
      await game.contractInput({ type: 'wait', seconds: waitSeconds });
      const terminal = await game.stableSnapshot(650);
      if (terminal.result !== 'lose') return FAIL('could not establish terminal failure through wait');
      const target = (terminal.vehicles || [])[0] || (pressure.vehicles || [])[0];
      const afterTap = target ? await game.contractInput({ type: 'tapVehicle', vehicleId: target.vehicleId }) : await game.contractInput({ type: 'tapAt', screenX: 10, screenY: 10 });
      if (afterTap.result !== terminal.result) return FAIL('terminal tap changed result');
      if (afterTap.hud.moves !== terminal.hud.moves || afterTap.playfield.remainingVehicleCount !== terminal.playfield.remainingVehicleCount) return FAIL('terminal tap mutated moves or vehicles');
      if (afterTap.lastAction.ok && afterTap.lastAction.outcome !== 'rejected') return FAIL('terminal tap should be rejected or unchanged');
      const restarted = await game.contractInput({ type: 'restart' });
      const settled = await game.stableSnapshot(450);
      if (settled.phase !== 'playing' || settled.result !== 'none') return FAIL(`restart did not return to fresh playing: ${settled.phase}/${settled.result}`);
      if (settled.hud.moves !== 0) return FAIL('restart did not reset moves to zero');
      if (settled.overlayBlocking || !settled.canInteractWithPlayfield) return FAIL('restart left blocking overlay or disabled playfield');
      return PASS('terminal lock and restart reset verified');
    }
  },
  {
    id: 'p1-9-level-select-progress-and-locked-rejection',
    level: 'P1',
    name: 'level select shows progress and rejects locked levels',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let snap = await game.loadScenario('level_select_with_progress');
      const shape = assertSnapshotShape(snap);
      if (shape) return FAIL(shape);
      if (!['levelSelect', 'menu'].includes(snap.phase) && snap.activeOverlay !== 'levelSelect') return FAIL(`expected level select/menu state, got ${snap.phase}/${snap.activeOverlay}`);
      if (!Array.isArray(snap.progress.levels) || snap.progress.levels.length !== snap.level.totalCount) return FAIL('progress.levels does not match totalCount');
      const unlocked = snap.progress.levels.find(l => l.unlocked);
      if (!unlocked) return FAIL('no unlocked level in progress summary');
      const playing = await game.contractInput({ type: 'selectLevel', levelIndex: unlocked.levelIndex });
      const pre = assertPlayingPrecondition(playing, 'select unlocked level');
      if (pre) return FAIL(pre);

      snap = await game.loadScenario('level_select_with_progress');
      const locked = (snap.progress.levels || []).find(l => !l.unlocked);
      if (locked) {
        const rejected = await game.contractInput({ type: 'selectLevel', levelIndex: locked.levelIndex });
        if (rejected.level.currentIndex === locked.levelIndex && rejected.phase === 'playing') return FAIL('locked level became playable');
        if (rejected.lastAction.ok && rejected.lastAction.reason !== 'lockedLevel') return FAIL('locked level selection was not rejected');
      }
      return PASS(`unlocked=${snap.level.unlockedCount}/${snap.level.totalCount}`);
    }
  },
  {
    id: 'p1-10-hint-highlight-cooldown-invariant',
    level: 'P1',
    name: 'hint highlights without moving and cooldown rejects repeat',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('hint_available');
      const pre = assertPlayingPrecondition(before, 'hint_available');
      if (pre) return FAIL(pre);
      if (!before.hint.available || before.hint.coolingDown) return FAIL('hint_available precondition invalid');
      const beforeSig = vehicleSignature(before);
      const hinted = await game.contractInput({ type: 'hint' });
      const after = await game.stableSnapshot(250);
      if (!after.hint.highlightedVehicleId) return FAIL('hint did not highlight a vehicle');
      if (!findVehicle(after, after.hint.highlightedVehicleId)) return FAIL('highlighted vehicle is not present');
      if (!after.hint.coolingDown || after.hint.cooldownRemainingSec <= 0) return FAIL('hint did not enter cooldown');
      if (after.hud.moves !== before.hud.moves) return FAIL('hint changed moves');
      if (after.playfield.remainingVehicleCount !== before.playfield.remainingVehicleCount || vehicleSignature(after).replace(/:hinted/g, ':parked') === '') return FAIL('hint corrupted vehicle summary');
      const afterPositions = (after.vehicles || []).map(v => `${v.vehicleId}:${v.row},${v.col}`).sort().join('|');
      const beforePositions = (before.vehicles || []).map(v => `${v.vehicleId}:${v.row},${v.col}`).sort().join('|');
      if (afterPositions !== beforePositions) return FAIL(`hint moved vehicles; before=${beforeSig}`);
      const repeat = await game.contractInput({ type: 'hint' });
      if (repeat.hud.moves !== after.hud.moves || repeat.playfield.remainingVehicleCount !== after.playfield.remainingVehicleCount) return FAIL('cooldown hint changed puzzle');
      if (repeat.lastAction.ok && repeat.lastAction.reason !== 'cooldown') return FAIL('cooldown hint was accepted');
      return PASS(`highlight=${after.hint.highlightedVehicleId}`);
    }
  },
  {
    id: 'p1-11-moves-score-stars-progress-contract',
    level: 'P1',
    name: 'moves are monotonic and completion records evaluation',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const initial = await game.loadScenario('tutorial_level_start');
      const pre = assertPlayingPrecondition(initial, 'tutorial_level_start');
      if (pre) return FAIL(pre);
      const first = movableVehicles(initial)[0];
      if (!first) return FAIL('tutorial level has no movable vehicle');
      const afterOne = await game.contractInput({ type: 'tapVehicle', vehicleId: first.vehicleId });
      if (afterOne.hud.moves !== initial.hud.moves + 1) return FAIL('first vehicle attempt did not increment moves by one');
      if (afterOne.hud.moves < initial.hud.moves) return FAIL('moves decreased');
      const solved = await completeGreedy(game, 90);
      if (solved.error && !solved.solved) return FAIL(solved.error);
      const final = solved.snap;
      if (final.result !== 'win' || final.phase !== 'result') return FAIL(`completion did not reach win result: ${final.phase}/${final.result}`);
      if (final.playfield.remainingVehicleCount !== 0) return FAIL('win result with remaining vehicles');
      if (typeof final.hud.score !== 'number' || final.hud.score < 0) return FAIL('victory score missing or negative');
      if (![1, 2, 3].includes(final.hud.stars)) return FAIL(`victory stars invalid: ${final.hud.stars}`);
      const record = (final.progress.levels || []).find(l => l.levelIndex === final.level.currentIndex);
      if (!record || !record.completed) return FAIL('completed progress record missing');
      if (final.canInteractWithPlayfield) return FAIL('victory did not lock playfield');
      return PASS(`won in ${final.hud.moves} moves, stars=${final.hud.stars}`);
    }
  },
  {
    id: 'p1-12-pause-overlay-blocks-input-and-time',
    level: 'P1',
    name: 'pause overlay blocks input and time',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('pause_ready');
      const pre = assertPlayingPrecondition(before, 'pause_ready');
      if (pre) return FAIL(pre);
      const paused = await game.contractInput({ type: 'pause' });
      if (paused.phase !== 'paused' && paused.activeOverlay !== 'pause') return FAIL(`pause did not open pause state: ${paused.phase}/${paused.activeOverlay}`);
      if (!paused.overlayBlocking || paused.canInteractWithPlayfield) return FAIL('pause must block playfield');
      const timerBefore = paused.hud.timeRemainingSec;
      await game.contractInput({ type: 'wait', seconds: 2 });
      const waited = await game.stableSnapshot(250);
      if (timerBefore !== null && waited.hud.timeRemainingSec !== null && waited.hud.timeRemainingSec < timerBefore - 0.25) return FAIL('timer decreased materially while paused');
      const target = (before.vehicles || [])[0];
      if (target) await game.contractInput({ type: 'tapVehicle', vehicleId: target.vehicleId });
      const behind = await game.stableSnapshot(250);
      if (behind.hud.moves !== waited.hud.moves || behind.playfield.remainingVehicleCount !== waited.playfield.remainingVehicleCount || vehicleSignature(behind) !== vehicleSignature(waited)) return FAIL('background vehicle input mutated puzzle under pause overlay');
      const resumed = await game.contractInput({ type: 'resume' });
      if (resumed.phase !== 'playing' || resumed.overlayBlocking || !resumed.canInteractWithPlayfield) return FAIL('resume did not restore playable state');
      return PASS('pause blocks input and resumes cleanly');
    }
  },
  {
    id: 'p1-13-mouse-hold-release-single-attempt',
    level: 'P1',
    name: 'mouse hold release produces one vehicle attempt',
    timeoutMs: 18000,
    async run({ browser }) {
      // release/cost evidence for quality gate: mousePressed hold then mouseReleased must still cost exactly one move.
      const game = createGameDriver(browser);
      const before = await game.loadScenario('movable_vehicle_ready');
      const pre = assertPlayingPrecondition(before, 'movable_vehicle_ready');
      if (pre) return FAIL(pre);
      const target = chooseVehicleWithCenter(before, v => v.canMove);
      if (!target) return FAIL('no movable vehicle with screen center');
      const point = vehicleCenter(target);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(420);
      const duringHold = await game.snapshot();
      if (duringHold.hud.moves - before.hud.moves > 1) return FAIL('holding mouse repeated vehicle attempts before release');
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
      const after = await game.stableSnapshot(650);
      const err = assertMovementOrExit(before, after, target.vehicleId);
      if (err) return FAIL(err);
      if (after.hud.moves - before.hud.moves !== 1) return FAIL('hold and release should settle as exactly one attempt');
      return PASS('hold/release generated one attempt without repeated acceleration');
    }
  },
  {
    id: 'p2-1-settings-toggle-visible-state-preserves-play',
    level: 'P2',
    name: 'settings toggles change state and preserve play',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('settings_ready');
      const shape = assertSnapshotShape(before);
      if (shape) return FAIL(shape);
      const opened = await game.contractInput({ type: 'openSettings' });
      if (opened.phase !== 'settings' && opened.activeOverlay !== 'settings') return FAIL('openSettings did not expose settings overlay');
      const musicBefore = opened.settings.musicEnabled;
      const soundBefore = opened.settings.soundEnabled;
      const musicAfter = await game.contractInput({ type: 'toggleSetting', setting: 'music' });
      if (musicAfter.settings.musicEnabled === musicBefore) return FAIL('music toggle did not flip');
      const soundAfter = await game.contractInput({ type: 'toggleSetting', setting: 'sound' });
      if (soundAfter.settings.soundEnabled === soundBefore) return FAIL('sound toggle did not flip');
      let closed;
      if (before.phase === 'menu') {
        closed = await game.contractInput({ type: 'backToMenu' });
      } else {
        const closeControl = await clickVisibleSettingsClose(browser);
        if (!closeControl) return FAIL('settings overlay exposes no visible close control');
        closed = await game.stableSnapshot(100);
      }
      if (closed.result !== before.result) return FAIL('settings changed terminal result');
      if (before.phase === 'playing' && closed.phase !== 'playing') return FAIL('settings did not return to play');
      return PASS(`music=${musicAfter.settings.musicEnabled}, sound=${soundAfter.settings.soundEnabled}`);
    }
  },
  {
    id: 'p2-2-countdown-warning-before-failure',
    level: 'P2',
    name: 'countdown warning appears before failure',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('countdown_pressure');
      const pre = assertPlayingPrecondition(before, 'countdown_pressure');
      if (pre) return FAIL(pre);
      if (before.hud.timeRemainingSec !== null && before.hud.timeRemainingSec <= 0) return FAIL('countdown warning precondition already expired');
      if (!before.hud.warning) {
        await game.contractInput({ type: 'wait', seconds: 1 });
      }
      const warning = await game.stableSnapshot(250);
      if (warning.result !== 'none' || warning.phase !== 'playing') return FAIL('warning window should remain playable before failure');
      if (warning.hud.timeRemainingSec !== null && warning.hud.timeRemainingSec <= 0) return FAIL('warning should occur before timer reaches zero');
      if (!warning.hud.warning) return FAIL('low-time warning semantic field never became true');
      const vehicle = movableVehicles(warning)[0] || blockedVehicles(warning)[0];
      if (vehicle) {
        const afterTap = await game.contractInput({ type: 'tapVehicle', vehicleId: vehicle.vehicleId });
        if (afterTap.result !== 'none') return FAIL('ordinary vehicle tap during warning prematurely ended the level');
      }
      return PASS(`warning with time=${warning.hud.timeRemainingSec}`);
    }
  },
  {
    id: 'p2-3-settings-overlay-then-vehicle-action',
    level: 'P2',
    name: 'settings overlay closes before vehicle action resumes',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('movable_vehicle_ready');
      const pre = assertPlayingPrecondition(before, 'movable_vehicle_ready');
      if (pre) return FAIL(pre);
      const opened = await game.contractInput({ type: 'openSettings' });
      if (
        opened.phase !== 'settings' ||
        opened.activeOverlay !== 'settings' ||
        !opened.overlayBlocking ||
        opened.canInteractWithPlayfield
      ) return FAIL('settings overlay did not enter a blocking settings state');
      const target = movableVehicles(before)[0];
      if (!target) return FAIL('movable_vehicle_ready exposes no movable vehicle');
      await game.contractInput({ type: 'tapVehicle', vehicleId: target.vehicleId });
      const blocked = await game.stableSnapshot(250);
      if (!sameCorePuzzle(opened, blocked)) return FAIL('vehicle input changed puzzle while settings overlay was open');
      const closeControl = await clickVisibleSettingsClose(browser);
      if (!closeControl) return FAIL('settings overlay exposes no visible close control');
      const playable = await game.stableSnapshot(250);
      if (
        playable.phase !== 'playing' ||
        playable.activeOverlay !== 'none' ||
        playable.overlayBlocking ||
        !playable.canInteractWithPlayfield
      ) return FAIL('settings close did not restore playing state');
      const after = await game.contractInput({ type: 'tapVehicle', vehicleId: target.vehicleId });
      if (
        after.hud.moves !== playable.hud.moves + 1 ||
        !after.lastAction.ok ||
        !['moved', 'exited', 'completed'].includes(after.lastAction.outcome)
      ) return FAIL('vehicle action did not work after closing settings');
      return PASS('settings overlay blocks then releases playfield');
    }
  }
];

module.exports = { suite };
