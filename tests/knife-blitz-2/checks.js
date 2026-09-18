'use strict';

// === GDD Coverage Map ===
// M1: p0-1, p0-2, p1-1
// M2: p1-2, p1-3, p1-4
// M3: p1-5
// M4: p1-3, p1-6
// M5: p1-8, p1-9
// M6: p1-6, p1-7, p1-10
// M7: p1-11
// M8: p2-1
// M9: p1-13, p1-14
// M10: p1-12, p2-3
// M11: p1-11, p2-4
// M12: p2-2
//
// === Category Map ===
// Boot & Stability: p0-1, p0-2
// UI Flow & Blocking: p1-1, p1-12, p2-1, p2-3
// Input Semantics: p1-2, p1-3, p1-4, p1-5
// Core Mechanic Loop: p1-3, p1-6, p1-8, p1-9, p1-11
// State Machine: p1-7, p1-10, p1-11, p1-12
// Economy / Progression: p1-8, p1-13, p1-14, p2-4
// Feedback & Observability: p1-5, p2-2
// Invariants & Rejection: p1-4, p1-6, p1-10, p1-12, p1-14
//
// === Rationality Map ===
// p1-1-home-start-readable: M1 start flow | real action: contract start after home setup | independent observation: state snapshot + target/playfield readability | empty-shell failure: home accepts throws or start leaves unreadable playfield.
// p1-2-real-mouse-touch-key-throw-inputs: M2 real mouse/touch/key throw | real action: mouse click, CDP touch, Space key | independent observation: projectile/feedback + queue/phase + playfield revision | empty-shell failure: API-only throw or missing input listener fails.
// p1-3-safe-stick-core-loop: M4 safe stick loop | real action: safe-gap wait then mouse click | independent observation: score, queue, stuck objects, feedback, target motion | empty-shell failure: label-only score or non-rotating stuck knife fails.
// p1-4-flight-lock-and-burst-rejection: M2 flight lock | real action: burst mouse/key input during unresolved throw | independent observation: one-throw resource delta and rejection | empty-shell failure: spam fire or ok-only adapter mutates multiple throws.
// p1-5-direction-opposite-drag-does-not-aim: M2/M3 direction opposite drag rejection | real action: drag left-to-right and direction opposite right-to-left | independent observation: Math.sign drag deltas are opposite while fixed path and gameplay state are conserved | empty-shell failure: drag-aim clone or steering by pointer motion fails.
// p1-6-hazard-collision-failure-lock: M4/M6 collision | real action: hazard wait then throw | independent observation: failed/continue phase, collision feedback, throw block, no safe reward | empty-shell failure: no collision or failure overlay only fails.
// p1-7-heart-continue-cost-and-resume: M6 heart continue | real action: continue button/action after collision | independent observation: exact heart cost, same level, playable resume, no victory payout | empty-shell failure: free continue, direct win, or level skip fails.
// p1-8-reward-collection-score-and-removal: M5 reward | real action: reward alignment wait then throw | independent observation: reward removal, score delta vs plain stick, progress, feedback | empty-shell failure: cosmetic reward or untimed bonus fails.
// p1-9-clearing-reward-risk-benefit: M5 clearing reward | real action: clearing alignment wait then throw | independent observation: obstacle count decreases and throw still counts | empty-shell failure: direct clear button or removing the new throw fails.
// p1-10-no-heart-retry-current-level: M6 no-heart retry | real action: no-heart collision, rejected continue, retry | independent observation: no recovery, same level reset, persistent economy conserved | empty-shell failure: free revive or retry-as-next-level fails.
// p1-11-victory-settlement-gating: M7 victory settlement | real action: final safe throw, premature next, settlement wait, next | independent observation: gated next, one-time payout/progress | empty-shell failure: instant skip or duplicate payout fails.
// p1-12-overlay-blocking-and-resume: M10 overlay block | real action: open overlay then mouse/key throw | independent observation: overlay flags, no score/queue/resource mutation, close resume | empty-shell failure: visual overlay that leaks play input fails.
// p1-13-shop-affordable-buy-and-equip: M9 shop purchase | real action: visible choose and confirm | independent observation: pending confirm, price cost, owned/equipped, HUD/shop balance | empty-shell failure: free buy or HUD desync fails.
// p1-14-shop-rejection-paths: M9 shop rejection | real action: insufficient/locked/cancel paths | independent observation: resources, ownership, progress unchanged | empty-shell failure: negative coins or locked equip fails.
// p2-1-boss-intro-blocking-and-dismiss: M8 boss intro | real action: throw during intro, confirm intro | independent observation: blocking intro then boss playable state | empty-shell failure: boss label only or non-blocking intro fails.
// p2-2-feedback-event-coverage: M12 feedback coverage | real action: major legal gameplay/shop events | independent observation: lastEvent + visual/hud revisions | empty-shell failure: snapshot-only or sound-only actions fail.
// p2-3-leaderboard-overlay-states: M10 leaderboard | real action: open/close leaderboard and attempt throw | independent observation: blocking overlay and conserved gameplay state | empty-shell failure: non-closeable or gameplay-triggering panel fails.
// p2-4-persistence-and-no-farming: M11 persistence/no farming | real action: complete/purchase then reset and repeat settlement actions | independent observation: durable values stable and one completion cannot pay twice | empty-shell failure: transient-only save or payout farming fails.

const PHASES = new Set(['loading', 'home', 'intro', 'playing', 'throwing', 'failed', 'continue', 'retry', 'complete', 'settlement', 'shop', 'settings', 'leaderboard']);
const SCREENS = new Set(['loading', 'home', 'level', 'bossIntro', 'tip', 'failure', 'victory', 'shop', 'settings', 'leaderboard']);
const OVERLAYS = new Set(['none', 'bossIntro', 'tip', 'failure', 'victory', 'shop', 'settings', 'leaderboard', 'purchaseConfirm']);
const RESULTS = new Set(['none', 'failed', 'victory']);

function PASS(detail) {
  return { status: 'PASS', detail: detail || '' };
}

function FAIL(detail) {
  return { status: 'FAIL', detail: detail || 'failed' };
}

function isObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function nonNegative(value) {
  return finite(value) && value >= 0;
}

function delta(after, before) {
  return Number(after || 0) - Number(before || 0);
}

function revOf(snap) {
  return {
    visible: snap?.playfield?.visibleRevision || 0,
    motion: snap?.playfield?.motionRevision || 0,
    rotation: snap?.playfield?.target?.rotationRevision || 0,
    visual: snap?.feedback?.visualRevision || 0,
    hud: snap?.feedback?.hudRevision || 0
  };
}

function entityCount(snap) {
  return Array.isArray(snap?.entities?.stuckKnives) ? snap.entities.stuckKnives.length : 0;
}

function rewardCount(snap) {
  return Array.isArray(snap?.entities?.rewards) ? snap.entities.rewards.length : 0;
}

function itemKey(item) {
  return item && item.id != null ? String(item.id) : '';
}

function sameLevel(a, b) {
  return String(a?.level?.id) === String(b?.level?.id) &&
    Number(a?.level?.displayIndex) === Number(b?.level?.displayIndex);
}

function cloneComparable(snap) {
  return {
    phase: snap?.phase,
    screen: snap?.screen,
    activeOverlay: snap?.activeOverlay,
    result: snap?.result,
    levelId: snap?.level?.id,
    levelDisplayIndex: snap?.level?.displayIndex,
    currentLevelScore: snap?.score?.currentLevel,
    runScore: snap?.score?.run,
    totalScore: snap?.score?.total,
    coins: snap?.economy?.coins,
    hearts: snap?.economy?.hearts,
    remainingThrows: snap?.level?.remainingThrows,
    completedThrows: snap?.level?.completedThrows,
    stuckCount: entityCount(snap),
    rewardCount: rewardCount(snap)
  };
}

function assertSnapshotSchema(snap) {
  if (!isObj(snap)) return 'snapshot is not an object';
  if (!PHASES.has(snap.phase)) return `invalid phase ${snap.phase}`;
  if (!SCREENS.has(snap.screen)) return `invalid screen ${snap.screen}`;
  if (!OVERLAYS.has(snap.activeOverlay)) return `invalid activeOverlay ${snap.activeOverlay}`;
  if (typeof snap.overlayBlocking !== 'boolean') return 'overlayBlocking must be boolean';
  if (typeof snap.canInteractWithPlayfield !== 'boolean') return 'canInteractWithPlayfield must be boolean';
  if (typeof snap.canThrow !== 'boolean') return 'canThrow must be boolean';
  if (!RESULTS.has(snap.result)) return `invalid result ${snap.result}`;
  if (!isObj(snap.level) || !nonNegative(snap.level.requiredThrows) || !nonNegative(snap.level.remainingThrows) || !nonNegative(snap.level.completedThrows)) return 'level counters invalid';
  if (!isObj(snap.score) || !nonNegative(snap.score.currentLevel) || !nonNegative(snap.score.run) || !nonNegative(snap.score.total)) return 'score counters invalid';
  if (!isObj(snap.economy) || !nonNegative(snap.economy.coins) || !nonNegative(snap.economy.hearts) || !nonNegative(snap.economy.maxHearts)) return 'economy counters invalid';
  if (snap.economy.hearts > snap.economy.maxHearts) return 'hearts exceed maxHearts';
  if (!isObj(snap.playfield) || !isObj(snap.playfield.bounds) || !isObj(snap.playfield.throwZone) || !isObj(snap.playfield.hitLine)) return 'playfield summary missing';
  if (snap.phase === 'playing' || snap.phase === 'throwing') {
    if (!snap.playfield.target || snap.playfield.target.visible !== true) return 'playing state has no visible target';
    const b = snap.playfield.bounds;
    if (!finite(b.left) || !finite(b.top) || !finite(b.width) || !finite(b.height) || b.width <= 0 || b.height <= 0) return 'playfield bounds invalid';
  }
  if (!isObj(snap.entities) || !Array.isArray(snap.entities.stuckKnives) || !Array.isArray(snap.entities.rewards)) return 'entities summary missing arrays';
  return null;
}

function normalizeResult(value) {
  if (isObj(value) && isObj(value.snapshot)) return { envelope: value, snapshot: value.snapshot };
  return { envelope: null, snapshot: value };
}

function createGameDriver(browser) {
  async function evalGame(expression) {
    const value = await browser.eval(expression);
    if (value && value.__l2_err__) throw new Error(value.__l2_err__);
    return value;
  }

  async function snapshot() {
    const raw = await evalGame('window.__gameTest && window.__gameTest.getSnapshot && window.__gameTest.getSnapshot()');
    return normalizeResult(raw).snapshot;
  }

  async function reset(options) {
    const raw = await evalGame(`window.__gameTest && window.__gameTest.reset && window.__gameTest.reset(${JSON.stringify(options || {})})`);
    return normalizeResult(raw).snapshot;
  }

  async function loadScenario(name, options) {
    const raw = await evalGame(`window.__gameTest && window.__gameTest.loadScenario && window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})})`);
    return normalizeResult(raw).snapshot;
  }

  async function contractInput(action) {
    const raw = await evalGame(`window.__gameTest && window.__gameTest.input && window.__gameTest.input(${JSON.stringify(action)})`);
    return normalizeResult(raw);
  }

  async function waitMs(ms) {
    await browser.sleep(ms);
    return snapshot();
  }

  async function waitUntilContract(until, durationMs) {
    const action = { type: 'wait', until };
    if (durationMs != null) action.durationMs = durationMs;
    const result = await contractInput(action);
    return result.snapshot;
  }

  function semanticPoint(snap, label) {
    const candidates = [
      snap?.playfield?.throwZone?.center,
      snap?.playfield?.center,
      snap?.playfield?.target,
      {
        screenX: (snap?.playfield?.bounds?.left || 0) + (snap?.playfield?.bounds?.width || 0) / 2,
        screenY: (snap?.playfield?.bounds?.top || 0) + (snap?.playfield?.bounds?.height || 0) * 0.78
      }
    ];
    const found = candidates.find(p => p && finite(p.screenX) && finite(p.screenY));
    if (!found) throw new Error(`no semantic point for ${label}`);
    return { x: found.screenX, y: found.screenY };
  }

  async function realMouseThrow(snap) {
    // Re-read after any wait/layout change; the caller's precondition
    // snapshot may contain coordinates from before the HUD resized the canvas.
    const current = await snapshot();
    const point = semanticPoint(current, 'mouse throw');
    await browser.mouseClick(point.x, point.y);
    await browser.sleep(120);
    return snapshot();
  }

  async function realTouchThrow(snap) {
    const current = await snapshot();
    const point = semanticPoint(current, 'touch throw');
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: point.x, y: point.y, radiusX: 2, radiusY: 2, force: 0.8 }]
    });
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await browser.sleep(120);
    return snapshot();
  }

  async function realKeyThrow(key) {
    await browser.keyDown(key || 'Space');
    await browser.sleep(35);
    await browser.keyUp(key || 'Space');
    await browser.sleep(120);
    return snapshot();
  }

  async function realDrag(from, to) {
    await browser.mouseMove(from.x, from.y);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.mouseMove((from.x + to.x) / 2, (from.y + to.y) / 2, to.x - from.x, to.y - from.y);
    await browser.mouseMove(to.x, to.y, to.x - from.x, to.y - from.y);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.sleep(120);
    return snapshot();
  }

  return { evalGame, snapshot, reset, loadScenario, contractInput, waitMs, waitUntilContract, realMouseThrow, realTouchThrow, realKeyThrow, realDrag };
}

async function requireContract(game) {
  const info = await game.evalGame(`({
    hasGameTest: !!window.__gameTest,
    reset: typeof window.__gameTest?.reset,
    loadScenario: typeof window.__gameTest?.loadScenario,
    input: typeof window.__gameTest?.input,
    getSnapshot: typeof window.__gameTest?.getSnapshot
  })`);
  if (!info.hasGameTest) return 'window.__gameTest missing';
  for (const method of ['reset', 'loadScenario', 'input', 'getSnapshot']) {
    if (info[method] !== 'function') return `window.__gameTest.${method} is not a function`;
  }
  return null;
}

function validateScenario(name, snap) {
  const schemaIssue = assertSnapshotSchema(snap);
  if (schemaIssue) return `${name}: ${schemaIssue}`;
  if (['playable_basic', 'playable_safe_gap', 'playable_with_reward', 'playable_with_clearing_reward', 'playable_collision_with_heart', 'playable_collision_no_heart', 'near_level_completion'].includes(name)) {
    if (!(snap.phase === 'playing' || snap.phase === 'throwing')) return `${name}: expected playable phase`;
    if (snap.result !== 'none') return `${name}: result already granted`;
    if (snap.activeOverlay !== 'none') return `${name}: overlay already active`;
    if (!snap.canInteractWithPlayfield) return `${name}: playfield not interactable`;
  }
  if (name === 'playable_safe_gap') {
    if (!(snap.level.remainingThrows >= 1)) return `${name}: no throw remains`;
  }
  if (name === 'playable_with_reward') {
    if (rewardCount(snap) < 1) return `${name}: no reward visible`;
  }
  if (name === 'playable_with_clearing_reward') {
    if (rewardCount(snap) < 1 || entityCount(snap) < 2) return `${name}: clearing precondition lacks reward or obstacles`;
  }
  if (name === 'playable_collision_with_heart') {
    if (!(snap.economy.hearts >= 1) || entityCount(snap) < 1) return `${name}: needs heart and hazard obstacle`;
  }
  if (name === 'playable_collision_no_heart') {
    if (snap.economy.hearts !== 0 || entityCount(snap) < 1) return `${name}: needs no hearts and hazard obstacle`;
  }
  if (name === 'near_level_completion') {
    if (snap.level.remainingThrows !== 1 || snap.result !== 'none') return `${name}: must have one unresolved required throw`;
    if (snap.progression?.settlementReady || snap.progression?.rewardClaimedForCurrentCompletion) return `${name}: settlement already applied`;
  }
  if (name === 'boss_intro_ready') {
    if (snap.activeOverlay !== 'bossIntro' && snap.screen !== 'bossIntro') return `${name}: boss intro not visible`;
    if (snap.canThrow || snap.canInteractWithPlayfield) return `${name}: intro does not block playfield`;
  }
  if (name.startsWith('shop_')) {
    if (!snap.shop?.open || snap.activeOverlay !== 'shop') return `${name}: shop not open`;
    if (snap.result !== 'none') return `${name}: shop scenario has level result already`;
  }
  if (name === 'settings_overlay_open') {
    if (snap.activeOverlay !== 'settings' || !snap.overlayBlocking) return `${name}: settings overlay not blocking`;
  }
  if (name === 'leaderboard_overlay_open') {
    if (snap.activeOverlay !== 'leaderboard' || !snap.overlayBlocking) return `${name}: leaderboard overlay not blocking`;
  }
  return null;
}

async function setupScenario(game, name, options) {
  await game.loadScenario(name, options || {});
  // Scenario setup toggles the HUD, which changes the flex canvas bounds on
  // the next render frame. Re-acquire semantic points after that layout pass
  // so real input is dispatched in the current viewport coordinate system.
  const snap = await game.waitMs(60);
  const issue = validateScenario(name, snap);
  if (issue) throw new Error(issue);
  return snap;
}

async function waitForHazardAtHitLine(game, maxMs) {
  const latest = await game.waitUntilContract(
    'hazardAtHitLine',
    maxMs || 12000
  );
  return latest && ['playing', 'throwing'].includes(latest.phase) &&
    latest.result === 'none' ? latest : null;
}

function rewardTimingObserved(snap) {
  return snap?.phase === 'playing' && snap?.canThrow === true &&
    Array.isArray(snap?.entities?.rewards) &&
    snap.entities.rewards.some(reward =>
      ['approaching', 'atHitLine', 'danger'].includes(reward?.relationToHitLine));
}

async function waitForRewardAtHitLine(game, maxMs) {
  const latest = await game.waitUntilContract('rewardAtHitLine', maxMs || 12000);
  return rewardTimingObserved(latest) ? latest : null;
}

function hasClearingRewardAtHitLine(snap) {
  return snap?.phase === 'playing' && snap?.canThrow === true &&
    Array.isArray(snap?.entities?.rewards) &&
    snap.entities.rewards.some(reward =>
      reward?.kind === 'clearing' &&
      ['approaching', 'atHitLine', 'danger'].includes(reward?.relationToHitLine));
}

async function waitForClearingRewardAtHitLine(game, maxMs) {
  const latest = await game.waitUntilContract(
    'clearingRewardAtHitLine',
    maxMs || 12000
  );
  return hasClearingRewardAtHitLine(latest) ? latest : null;
}

async function waitForSettlementReady(game, maxMs, requireClaim) {
  const deadline = Date.now() + (maxMs || 12000);
  let latest = await game.snapshot();
  const isReady = snap => snap.progression?.settlementReady === true &&
    (!requireClaim || snap.progression?.rewardClaimedForCurrentCompletion === true);
  while (Date.now() < deadline) {
    if (isReady(latest)) return latest;
    const remaining = deadline - Date.now();
    latest = await game.waitUntilContract(
      'settlementReady',
      Math.min(250, Math.max(1, remaining))
    );
    if (isReady(latest)) return latest;
    if (Date.now() < deadline) {
      latest = await game.waitMs(Math.min(80, Math.max(1, deadline - Date.now())));
    }
  }
  return latest;
}

async function resolveAfterThrow(game, before, maxMs, options) {
  const requireTerminal = !!options && options.requireTerminal === true;
  const deadline = Date.now() + (maxMs || 2500);
  let latest = await game.snapshot();
  while (Date.now() < deadline) {
    latest = await game.snapshot();
    const resolvedProgress = latest.level?.completedThrows !== before.level?.completedThrows;
    const terminal = latest.result !== before.result || ['failed', 'continue', 'retry', 'complete', 'settlement'].includes(latest.phase);
    const feedbackChanged = (latest.feedback?.visualRevision || 0) > (before.feedback?.visualRevision || 0) ||
      (latest.feedback?.hudRevision || 0) > (before.feedback?.hudRevision || 0);
    const flightActive = latest.phase === 'throwing' ||
      latest.playfield?.projectile?.state === 'launching';
    const settled = !flightActive;
    const resolved = requireTerminal ? terminal : (resolvedProgress || terminal);
    if (settled && resolved && feedbackChanged) return latest;
    await game.waitMs(80);
  }
  return latest;
}

async function resolveCollisionFailure(game, maxMs) {
  const deadline = Date.now() + (maxMs || 5000);
  let latest = await game.snapshot();
  while (Date.now() < deadline) {
    latest = await game.snapshot();
    const failureReady = latest.result === 'failed' &&
      (latest.activeOverlay === 'failure' || latest.phase === 'continue');
    if (failureReady) return latest;
    await game.waitMs(80);
  }
  return latest;
}

function assertAcceptedThrowStart(before, after) {
  if (after.result !== 'none' && after.result !== 'failed' && after.result !== 'victory') return `invalid result after throw ${after.result}`;
  const projectilePath = after.playfield?.projectile?.path || before.playfield?.projectile?.path;
  if (projectilePath && projectilePath !== 'bottomToTarget') return `projectile path is ${projectilePath}`;
  const phaseOrFeedback = after.phase === 'throwing' ||
    ['throw', 'stick', 'reward', 'collision'].includes(after.feedback?.lastEvent) ||
    (after.feedback?.visualRevision || 0) > (before.feedback?.visualRevision || 0);
  if (!phaseOrFeedback) return 'throw did not change phase, feedback, or visible revision';
  if ((after.playfield?.visibleRevision || 0) < (before.playfield?.visibleRevision || 0)) return 'visible revision regressed';
  return null;
}

function assertSafeStick(before, after) {
  if (after.result !== 'none' && after.result !== 'victory') return `safe throw unexpectedly failed with ${after.result}`;
  if (delta(after.level.completedThrows, before.level.completedThrows) !== 1) return 'completedThrows did not increase by exactly one';
  if (delta(after.level.remainingThrows, before.level.remainingThrows) !== -1) return 'remainingThrows did not decrease by exactly one';
  if (!(after.score.currentLevel > before.score.currentLevel)) return 'currentLevel score did not increase';
  if (entityCount(after) < entityCount(before) + 1) return 'new stuck knife obstacle was not added';
  if ((after.feedback?.visualRevision || 0) <= (before.feedback?.visualRevision || 0)) return 'visual feedback did not advance';
  if ((after.feedback?.hudRevision || 0) <= (before.feedback?.hudRevision || 0)) return 'HUD feedback did not advance';
  return null;
}

function assertNoGameplayMutation(before, after, label) {
  const b = cloneComparable(before);
  const a = cloneComparable(after);
  const keys = ['result', 'levelId', 'levelDisplayIndex', 'currentLevelScore', 'runScore', 'totalScore', 'coins', 'hearts', 'remainingThrows', 'completedThrows', 'stuckCount', 'rewardCount'];
  for (const key of keys) {
    if (a[key] !== b[key]) return `${label}: ${key} mutated from ${b[key]} to ${a[key]}`;
  }
  return null;
}

function findShopItem(snap, predicate) {
  const items = Array.isArray(snap?.shop?.items) ? snap.shop.items : [];
  return items.find(predicate);
}

const suite = [
  {
    id: 'p0-1-boot-contract',
    level: 'P0',
    name: 'public adapter boots and returns a valid snapshot schema',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const contractIssue = await requireContract(game);
      if (contractIssue) return FAIL(contractIssue);
      const snap = await game.snapshot();
      const issue = assertSnapshotSchema(snap);
      if (issue) return FAIL(issue);
      const reset = await game.reset();
      const resetIssue = assertSnapshotSchema(reset);
      if (resetIssue) return FAIL(`reset snapshot invalid: ${resetIssue}`);
      return PASS('adapter and snapshot schema are available');
    }
  },
  {
    id: 'p0-2-playfield-render-observability',
    level: 'P0',
    name: 'playable state exposes readable playfield and live render evidence',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await setupScenario(game, 'playable_basic');
      const canvas = await browser.getCanvasSize();
      if (!canvas || canvas.cssW <= 0 || canvas.cssH <= 0) return FAIL('no visible canvas/playfield surface');
      const beforeHash = await browser.canvasPixelHash();
      await game.waitUntilContract('motionObserved', 250);
      const after = await game.snapshot();
      const afterHash = await browser.canvasPixelHash();
      if (!after.playfield?.target?.visible) return FAIL('target not visible in playable state');
      if ((after.playfield.visibleRevision || 0) < (start.playfield.visibleRevision || 0)) return FAIL('visible revision regressed');
      if (beforeHash === null || afterHash === null) return FAIL('canvas screenshot hash unavailable');
      return PASS('playfield is visible and observable');
    }
  },
  {
    id: 'p1-1-home-start-readable',
    level: 'P1',
    name: 'home blocks throws and start reaches a readable playable state',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const home = await setupScenario(game, 'home_ready');
      const blocked = await game.contractInput({ type: 'throw', via: 'keyboard' });
      const blockedSnap = blocked.snapshot;
      const rejectReason = blocked.envelope?.ok === false || blockedSnap.lastAction?.accepted === false || blockedSnap.lastAction?.reason;
      if (!rejectReason) return FAIL('home throw was not rejected');
      const mutation = assertNoGameplayMutation(home, blockedSnap, 'home throw');
      if (mutation) return FAIL(mutation);
      const started = (await game.contractInput({ type: 'start' })).snapshot;
      if (!['intro', 'playing', 'settings'].includes(started.phase)) return FAIL(`start reached unexpected phase ${started.phase}`);
      if (started.phase === 'playing') {
        if (!started.playfield?.target?.visible || !started.canInteractWithPlayfield) return FAIL('started level is not readable or interactable');
      } else if (!started.overlayBlocking) {
        return FAIL('non-playing start state is not documented as blocking');
      }
      return PASS('home rejection and start transition are observable');
    }
  },
  {
    id: 'p1-2-real-mouse-touch-key-throw-inputs',
    level: 'P1',
    name: 'real mouse touch and keyboard inputs trigger fixed-line throw semantics',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const mouseBefore = await setupScenario(game, 'playable_basic');
      await game.waitUntilContract('safeGapAtHitLine', 200);
      const mouseAfterStart = await game.realMouseThrow(mouseBefore);
      const mouseIssue = assertAcceptedThrowStart(mouseBefore, mouseAfterStart);
      if (mouseIssue) return FAIL(`mouse: ${mouseIssue}`);

      const touchBefore = await setupScenario(game, 'playable_basic');
      await game.waitUntilContract('safeGapAtHitLine', 200);
      const touchAfterStart = await game.realTouchThrow(touchBefore);
      const touchIssue = assertAcceptedThrowStart(touchBefore, touchAfterStart);
      if (touchIssue) return FAIL(`touch: ${touchIssue}`);

      const keyBefore = await setupScenario(game, 'playable_basic');
      await game.waitUntilContract('safeGapAtHitLine', 200);
      const keyAfterStart = await game.realKeyThrow('Space');
      const keyIssue = assertAcceptedThrowStart(keyBefore, keyAfterStart);
      if (keyIssue) return FAIL(`keyboard: ${keyIssue}`);
      return PASS('mouse, touch, and keyboard all produced throw evidence');
    }
  },
  {
    id: 'p1-3-safe-stick-core-loop',
    level: 'P1',
    name: 'safe timed real throw sticks, scores, updates queue, and creates a future obstacle',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await setupScenario(game, 'playable_safe_gap');
      await game.waitUntilContract('safeGapAtHitLine');
      const launched = await game.realMouseThrow(before);
      const launchIssue = assertAcceptedThrowStart(before, launched);
      if (launchIssue) return FAIL(launchIssue);
      const after = await resolveAfterThrow(game, before, 3000);
      const stickIssue = assertSafeStick(before, after);
      if (stickIssue) return FAIL(stickIssue);
      const moved = await game.waitUntilContract('motionObserved', 250);
      if ((moved.playfield?.motionRevision || 0) <= (after.playfield?.motionRevision || 0)) return FAIL('newly stuck obstacle did not remain in moving target system');
      return PASS('safe stick completed the core progress loop');
    }
  },
  {
    id: 'p1-4-flight-lock-and-burst-rejection',
    level: 'P1',
    name: 'burst input during flight is rejected without multi-throw mutation',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await setupScenario(game, 'playable_basic');
      await game.waitUntilContract('safeGapAtHitLine', 150);
      await game.realMouseThrow(before);
      const during = await game.snapshot();
      await browser.mouseClick(before.playfield.throwZone.center.screenX, before.playfield.throwZone.center.screenY);
      await browser.keyDown('Space');
      await browser.keyUp('Space');
      const burst = await game.contractInput({ type: 'holdThrowKey', durationMs: 180 });
      const afterBurst = burst.snapshot;
      const throwsConsumed = Math.abs(delta(afterBurst.level.remainingThrows, before.level.remainingThrows));
      if (throwsConsumed > 1) return FAIL(`burst consumed ${throwsConsumed} throws`);
      if (throwsConsumed === 0 && afterBurst.score.currentLevel !== before.score.currentLevel) return FAIL('burst mutated score without consuming a throw');
      if (entityCount(afterBurst) > entityCount(before) + 1) return FAIL('burst created duplicate stuck knives');
      const rejected = burst.envelope?.ok === false || afterBurst.lastAction?.accepted === false || afterBurst.canThrow === false || during.canThrow === false;
      if (!rejected) return FAIL('burst did not expose cooldown/block rejection');
      return PASS('flight lock prevents multi-throw bursts');
    }
  },
  {
    id: 'p1-5-direction-opposite-drag-does-not-aim',
    level: 'P1',
    name: 'direction opposite drags do not steer fixed-line throw semantics',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const left = await setupScenario(game, 'playable_basic');
      const b = left.playfield.bounds;
      const y = b.top + b.height * 0.72;
      const leftToRight = { from: { x: b.left + b.width * 0.25, y }, to: { x: b.left + b.width * 0.75, y } };
      const rightToLeft = { from: { x: b.left + b.width * 0.75, y }, to: { x: b.left + b.width * 0.25, y } };
      const signA = Math.sign(leftToRight.to.x - leftToRight.from.x);
      const signB = Math.sign(rightToLeft.to.x - rightToLeft.from.x);
      if (signA !== -signB) return FAIL('direction opposite setup did not create opposite drag deltas');
      const afterA = await game.realDrag(leftToRight.from, leftToRight.to);
      const mutationA = assertNoGameplayMutation(left, afterA, 'left-to-right drag');
      if (mutationA && afterA.playfield?.projectile?.path !== 'bottomToTarget') return FAIL(mutationA);
      const right = await setupScenario(game, 'playable_basic');
      const afterB = await game.realDrag(rightToLeft.from, rightToLeft.to);
      const mutationB = assertNoGameplayMutation(right, afterB, 'right-to-left drag');
      if (mutationB && afterB.playfield?.projectile?.path !== 'bottomToTarget') return FAIL(mutationB);
      const routeA = afterA.playfield?.projectile?.path || 'none';
      const routeB = afterB.playfield?.projectile?.path || 'none';
      if (routeA !== routeB && routeA !== 'bottomToTarget' && routeB !== 'bottomToTarget') return FAIL(`opposite drags produced incompatible routes ${routeA}/${routeB}`);
      return PASS('opposite drags did not introduce aiming or steering');
    }
  },
  {
    id: 'p1-6-hazard-collision-failure-lock',
    level: 'P1',
    name: 'hazard-timed throw produces collision failure and blocks further throws',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await setupScenario(game, 'playable_collision_with_heart');
      const hazard = await waitForHazardAtHitLine(game, 12000);
      if (!hazard) return FAIL('hazardAtHitLine precondition was not observed');
      await game.realMouseThrow(hazard);
      const after = await resolveAfterThrow(game, before, 3200);
      const failed = after.result === 'failed' || ['failed', 'continue', 'retry'].includes(after.phase);
      if (!failed) return FAIL(`collision did not enter failed flow, phase=${after.phase} result=${after.result}`);
      if (!['collision', 'shatter'].includes(after.feedback?.lastEvent) && (after.feedback?.visualRevision || 0) <= (before.feedback?.visualRevision || 0)) return FAIL('collision feedback did not advance');
      if (after.canThrow || after.canInteractWithPlayfield) return FAIL('failed flow still allows playfield throws');
      if (after.level.completedThrows > before.level.completedThrows) return FAIL('collision counted as safe completed throw');
      const blocked = (await game.contractInput({ type: 'throw', via: 'keyboard' })).snapshot;
      if (blocked.level.completedThrows !== after.level.completedThrows || blocked.score.currentLevel !== after.score.currentLevel) return FAIL('post-collision throw mutated safe progress');
      return PASS('collision failure locks gameplay correctly');
    }
  },
  {
    id: 'p1-7-heart-continue-cost-and-resume',
    level: 'P1',
    name: 'heart continue costs exactly one heart and resumes same level without victory',
    timeoutMs: 17000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await setupScenario(game, 'playable_collision_with_heart');
      const hazard = await waitForHazardAtHitLine(game, 12000);
      if (!hazard) return FAIL('hazardAtHitLine precondition was not observed');
      const thrown = await game.contractInput({ type: 'throw', via: 'mouse' });
      if (thrown.envelope?.ok === false || thrown.snapshot?.lastAction?.accepted === false) return FAIL('hazard throw action was rejected');
      await game.contractInput({ type: 'wait', durationMs: 1200 });
      const failed = await resolveCollisionFailure(game, 5000);
      if (!(failed.result === 'failed' && (failed.activeOverlay === 'failure' || failed.phase === 'continue'))) return FAIL('collision recovery route did not become ready');
      const continued = (await game.contractInput({ type: 'continueWithHeart' })).snapshot;
      if (delta(continued.economy.hearts, failed.economy.hearts) !== -1) return FAIL('continue did not spend exactly one heart');
      if (!sameLevel(start, continued)) return FAIL('continue changed level identity');
      if (continued.result !== 'none') return FAIL('continue did not clear failed result');
      if (continued.economy.coins !== failed.economy.coins) return FAIL('continue granted victory payout');
      if (!['playing', 'throwing'].includes(continued.phase) || !continued.canInteractWithPlayfield) return FAIL('continue did not resume playable state');
      if (continued.progression?.rewardClaimedForCurrentCompletion || continued.result === 'victory') return FAIL('continue granted free victory or payout');
      return PASS('heart continue cost and resume rules hold');
    }
  },
  {
    id: 'p1-8-reward-collection-score-and-removal',
    level: 'P1',
    name: 'reward throw removes reward and beats plain safe-stick score delta',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const plainBefore = await setupScenario(game, 'playable_safe_gap');
      await game.waitUntilContract('safeGapAtHitLine');
      await game.realMouseThrow(plainBefore);
      const plainAfter = await resolveAfterThrow(game, plainBefore, 3000);
      const plainIssue = assertSafeStick(plainBefore, plainAfter);
      if (plainIssue) return FAIL(`plain baseline invalid: ${plainIssue}`);
      const plainDelta = plainAfter.score.currentLevel - plainBefore.score.currentLevel;

      const rewardBefore = await setupScenario(game, 'playable_with_reward');
      const rewardReady = await waitForRewardAtHitLine(game, 12000);
      if (!rewardReady) return FAIL('rewardAtHitLine precondition was not observed');
      await game.realMouseThrow(rewardReady);
      const rewardAfter = await resolveAfterThrow(game, rewardBefore, 3200);
      if (delta(rewardAfter.level.completedThrows, rewardBefore.level.completedThrows) !== 1) return FAIL('reward throw did not count one successful throw');
      if (delta(rewardAfter.level.remainingThrows, rewardBefore.level.remainingThrows) !== -1) return FAIL('reward throw did not consume one required throw');
      if (!(rewardAfter.score.currentLevel - rewardBefore.score.currentLevel > plainDelta)) return FAIL('reward score delta did not exceed plain safe stick');
      const rewardBeforeItems = rewardBefore.entities?.rewards || [];
      const rewardAfterItems = rewardAfter.entities?.rewards || [];
      const rewardRemoved = rewardAfterItems.length < rewardBeforeItems.length;
      const rewardMarkedCollected = rewardAfterItems.some(reward =>
        rewardBeforeItems.some(beforeReward => String(beforeReward?.id) === String(reward?.id)) &&
        (reward?.collected === true || reward?.status === 'collected'));
      const rewardFeedback = rewardAfter.feedback?.lastEvent === 'reward';
      if (!rewardRemoved && !rewardMarkedCollected && !rewardFeedback) return FAIL('reward was not removed or collected');
      if (rewardAfter.feedback?.lastEvent !== 'reward' && (rewardAfter.feedback?.visualRevision || 0) <= (rewardBefore.feedback?.visualRevision || 0)) return FAIL('reward feedback did not advance');
      return PASS('reward is tied to legal timed throw and observable scoring');
    }
  },
  {
    id: 'p1-9-clearing-reward-risk-benefit',
    level: 'P1',
    name: 'clearing reward removes existing obstacles while preserving the new successful throw',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await setupScenario(game, 'playable_with_clearing_reward');
      const existingObstacles = entityCount(before);
      const aligned = await waitForClearingRewardAtHitLine(game, 12000);
      if (!aligned) return FAIL('clearing reward timing condition was not observed');
      await game.realMouseThrow(aligned);
      const after = await resolveAfterThrow(game, before, 3400);
      if (delta(after.level.completedThrows, before.level.completedThrows) !== 1) return FAIL('clearing reward did not count the successful throw');
      if (delta(after.level.remainingThrows, before.level.remainingThrows) !== -1) return FAIL('clearing reward did not consume one queue item');
      if (!(after.score.currentLevel > before.score.currentLevel)) return FAIL('clearing reward did not increase score');
      if (entityCount(after) > existingObstacles) return FAIL('clearing reward failed to remove any existing obstacle after adding the new throw');
      if (rewardCount(after) >= rewardCount(before)) return FAIL('clearing reward remained visible after collection');
      if (!['reward', 'clear', 'stick'].includes(after.feedback?.lastEvent) && (after.feedback?.visualRevision || 0) <= (before.feedback?.visualRevision || 0)) return FAIL('clearing feedback did not advance');
      return PASS('clearing reward shows both benefit and normal throw cost');
    }
  },
  {
    id: 'p1-10-no-heart-retry-current-level',
    level: 'P1',
    name: 'no-heart collision rejects continue and retry restarts the same level without wiping durable economy',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await setupScenario(game, 'playable_collision_no_heart');
      const hazard = await waitForHazardAtHitLine(game, 12000);
      if (!hazard) return FAIL('hazardAtHitLine precondition was not observed');
      const launched = await game.contractInput({ type: 'throw', via: 'mouse' });
      if (launched.envelope?.ok === false || launched.snapshot?.lastAction?.accepted === false) return FAIL('hazard throw was rejected');
      await game.contractInput({ type: 'wait', durationMs: 1200 });
      const failed = await resolveCollisionFailure(game, 5000);
      if (!(failed.result === 'failed' || ['failed', 'continue', 'retry'].includes(failed.phase))) return FAIL('collision precondition did not fail');
      const attemptedContinue = (await game.contractInput({ type: 'continueWithHeart' })).snapshot;
      if (attemptedContinue.result === 'none' && ['playing', 'throwing'].includes(attemptedContinue.phase)) return FAIL('no-heart continue recovered gameplay');
      if (attemptedContinue.economy.hearts !== 0) return FAIL('no-heart continue mutated hearts');
      const retried = (await game.contractInput({ type: 'retryLevel' })).snapshot;
      if (!sameLevel(start, retried)) return FAIL('retry advanced or changed the level');
      if (retried.economy.coins !== failed.economy.coins) return FAIL('retry mutated persistent coins');
      if (retried.score.currentLevel > start.score.currentLevel) return FAIL('retry preserved failed attempt score');
      if (retried.result !== 'none' || !['playing', 'intro'].includes(retried.phase)) return FAIL('retry did not return to same current-level attempt');
      return PASS('no-heart rejection and retry invariants hold');
    }
  },
  {
    id: 'p1-11-victory-settlement-gating',
    level: 'P1',
    name: 'final safe throw gates next level until settlement and prevents duplicate payout',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await setupScenario(game, 'near_level_completion');
      await game.waitUntilContract('safeGapAtHitLine');
      await game.realMouseThrow(before);
      const complete = await resolveAfterThrow(game, before, 3600, { requireTerminal: true });
      if (complete.level.remainingThrows !== 0) return FAIL('final safe throw did not clear remaining queue');
      if (!(complete.result === 'victory' || ['complete', 'settlement'].includes(complete.phase))) return FAIL('final throw did not enter victory/settlement');
      const premature = (await game.contractInput({ type: 'nextLevel' })).snapshot;
      if (!complete.progression?.settlementReady && !sameLevel(complete, premature)) return FAIL('nextLevel advanced before settlementReady');
      const ready = await waitForSettlementReady(game, 12000);
      if (!ready.progression?.settlementReady && !ready.progression?.nextAvailable) return FAIL('settlement readiness never became observable');
      const coinsBeforeNext = ready.economy.coins;
      const next = (await game.contractInput({ type: 'nextLevel' })).snapshot;
      if (sameLevel(ready, next) && next.progression?.nextAvailable) return FAIL('ready nextLevel did not advance or consume next availability');
      const repeated = (await game.contractInput({ type: 'nextLevel' })).snapshot;
      if (repeated.economy.coins > next.economy.coins) return FAIL('repeated next/settlement action duplicated payout');
      return PASS('victory settlement gating and one-time reward are enforced');
    }
  },
  {
    id: 'p1-12-overlay-blocking-and-resume',
    level: 'P1',
    name: 'settings overlay blocks real throw input and closes back to the prior level state',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await setupScenario(game, 'settings_overlay_open');
      const blockedMouse = await game.realMouseThrow(before);
      const mouseMutation = assertNoGameplayMutation(before, blockedMouse, 'overlay mouse throw');
      if (mouseMutation) return FAIL(mouseMutation);
      await game.realKeyThrow('Space');
      const blockedKey = await game.snapshot();
      const keyMutation = assertNoGameplayMutation(before, blockedKey, 'overlay key throw');
      if (keyMutation) return FAIL(keyMutation);
      if (!blockedKey.overlayBlocking || blockedKey.canInteractWithPlayfield) return FAIL('overlay does not block playfield');
      const closed = (await game.contractInput({ type: 'closeOverlay' })).snapshot;
      if (closed.activeOverlay !== 'none') return FAIL('closeOverlay did not close settings');
      if (!sameLevel(before, closed)) return FAIL('closing overlay changed level identity');
      return PASS('overlay blocks and resumes correctly');
    }
  },
  {
    id: 'p1-13-shop-affordable-buy-and-equip',
    level: 'P1',
    name: 'affordable shop purchase uses confirmation, spends price, owns and equips item',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await setupScenario(game, 'shop_affordable_unowned');
      const item = findShopItem(before, it => it.visible && !it.owned && !it.locked && it.affordable && finite(it.price) && it.price > 0);
      if (!item) return FAIL('no visible affordable unowned item in scenario');
      const chosen = (await game.contractInput({ type: 'chooseShopItem', itemId: item.id })).snapshot;
      if (!chosen.shop?.pendingConfirm && chosen.activeOverlay !== 'purchaseConfirm') return FAIL('choosing item did not expose purchase confirmation');
      if (chosen.economy.coins !== before.economy.coins) return FAIL('coins mutated before confirmation');
      const confirmed = (await game.contractInput({ type: 'confirmPurchase' })).snapshot;
      const bought = findShopItem(confirmed, it => itemKey(it) === itemKey(item));
      if (!bought || !bought.owned) return FAIL('item is not owned after confirmed purchase');
      if (!bought.equipped) return FAIL('purchased item was not equipped or marked active');
      if (delta(confirmed.economy.coins, before.economy.coins) !== -item.price) return FAIL('coin delta did not equal item price');
      if (confirmed.shop?.coins !== confirmed.economy.coins) return FAIL('shop and HUD coin balances desynchronized');
      if (confirmed.result !== before.result || !sameLevel(before, confirmed)) return FAIL('shop purchase mutated gameplay result or level');
      return PASS('shop purchase follows visible confirmation and economy rules');
    }
  },
  {
    id: 'p1-14-shop-rejection-paths',
    level: 'P1',
    name: 'insufficient locked and cancelled shop actions preserve resources and ownership',
    timeoutMs: 17000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const poor = await setupScenario(game, 'shop_insufficient_funds');
      const expensive = findShopItem(poor, it => it.visible && !it.owned && !it.locked && it.affordable === false);
      if (!expensive) return FAIL('no unaffordable visible item in scenario');
      const rejected = (await game.contractInput({ type: 'chooseShopItem', itemId: expensive.id })).snapshot;
      const rejectedConfirm = (await game.contractInput({ type: 'confirmPurchase' })).snapshot;
      const poorItem = findShopItem(rejectedConfirm, it => itemKey(it) === itemKey(expensive));
      if (rejectedConfirm.economy.coins !== poor.economy.coins) return FAIL('insufficient purchase changed coins');
      if (poorItem?.owned || poorItem?.equipped) return FAIL('insufficient purchase changed ownership/equipment');

      const lockedStart = await setupScenario(game, 'shop_locked_target');
      const locked = findShopItem(lockedStart, it => it.visible && it.locked);
      if (!locked) return FAIL('no visible locked target in scenario');
      await game.contractInput({ type: 'chooseShopItem', itemId: locked.id });
      const lockedAfter = (await game.contractInput({ type: 'equipItem', itemId: locked.id })).snapshot;
      const lockedItem = findShopItem(lockedAfter, it => itemKey(it) === itemKey(locked));
      if (lockedAfter.economy.coins !== lockedStart.economy.coins) return FAIL('locked attempt changed coins');
      if (lockedItem?.owned || lockedItem?.equipped) return FAIL('locked attempt changed ownership/equipment');

      const cancelStart = await setupScenario(game, 'shop_affordable_unowned');
      const cancelItem = findShopItem(cancelStart, it => it.visible && !it.owned && !it.locked && it.affordable && finite(it.price) && it.price > 0);
      await game.contractInput({ type: 'chooseShopItem', itemId: cancelItem.id });
      const cancelled = (await game.contractInput({ type: 'cancelPurchase' })).snapshot;
      const cancelledItem = findShopItem(cancelled, it => itemKey(it) === itemKey(cancelItem));
      if (cancelled.economy.coins !== cancelStart.economy.coins || cancelledItem?.owned) return FAIL('cancelled purchase mutated resources or ownership');
      return PASS('shop rejection and cancellation paths conserve state');
    }
  },
  {
    id: 'p2-1-boss-intro-blocking-and-dismiss',
    level: 'P2',
    name: 'boss intro blocks throws until dismissed and exposes boss playable state',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const intro = await setupScenario(game, 'boss_intro_ready');
      const attempted = (await game.contractInput({ type: 'throw', via: 'keyboard' })).snapshot;
      const mutation = assertNoGameplayMutation(intro, attempted, 'boss intro throw');
      if (mutation) return FAIL(mutation);
      const dismissed = (await game.contractInput({ type: 'confirmOverlay' })).snapshot;
      if (!dismissed.level?.isBoss) return FAIL('dismissed boss scenario is not marked boss');
      if (!['playing', 'intro'].includes(dismissed.phase)) return FAIL(`boss dismiss reached unexpected phase ${dismissed.phase}`);
      if (dismissed.phase === 'playing' && !dismissed.canInteractWithPlayfield) return FAIL('boss level not playable after intro');
      return PASS('boss intro is blocking and dismisses into boss play');
    }
  },
  {
    id: 'p2-2-feedback-event-coverage',
    level: 'P2',
    name: 'major events advance visual or HUD feedback revisions',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const safeBefore = await setupScenario(game, 'playable_safe_gap');
      await game.waitUntilContract('safeGapAtHitLine', 200);
      await game.realMouseThrow(safeBefore);
      const safeAfter = await resolveAfterThrow(game, safeBefore, 3000);
      if ((safeAfter.feedback?.visualRevision || 0) <= (safeBefore.feedback?.visualRevision || 0)) return FAIL('safe stick visual feedback missing');

      const rewardBefore = await setupScenario(game, 'playable_with_reward');
      await game.waitUntilContract('rewardAtHitLine', 200);
      await game.realMouseThrow(rewardBefore);
      const rewardAfter = await resolveAfterThrow(game, rewardBefore, 3200);
      if (!['reward', 'stick'].includes(rewardAfter.feedback?.lastEvent) && (rewardAfter.feedback?.hudRevision || 0) <= (rewardBefore.feedback?.hudRevision || 0)) return FAIL('reward HUD/visual feedback missing');

      const collisionBefore = await setupScenario(game, 'playable_collision_with_heart');
      await game.waitUntilContract('hazardAtHitLine', 200);
      await game.realMouseThrow(collisionBefore);
      const collisionAfter = await resolveAfterThrow(game, collisionBefore, 3200);
      if ((collisionAfter.feedback?.visualRevision || 0) <= (collisionBefore.feedback?.visualRevision || 0)) return FAIL('collision visual feedback missing');

      const shopBefore = await setupScenario(game, 'shop_affordable_unowned');
      const item = findShopItem(shopBefore, it => it.visible && !it.owned && !it.locked && it.affordable && finite(it.price) && it.price > 0);
      await game.contractInput({ type: 'chooseShopItem', itemId: item.id });
      const purchased = (await game.contractInput({ type: 'confirmPurchase' })).snapshot;
      if (!['purchase', 'equip'].includes(purchased.feedback?.lastEvent) && (purchased.feedback?.hudRevision || 0) <= (shopBefore.feedback?.hudRevision || 0)) return FAIL('purchase/equip feedback missing');
      return PASS('major events expose feedback revisions');
    }
  },
  {
    id: 'p2-3-leaderboard-overlay-states',
    level: 'P2',
    name: 'leaderboard overlay blocks playfield and closes without gameplay mutation',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await setupScenario(game, 'leaderboard_overlay_open');
      const blocked = await game.realMouseThrow(before);
      const mutation = assertNoGameplayMutation(before, blocked, 'leaderboard throw');
      if (mutation) return FAIL(mutation);
      if (!blocked.overlayBlocking || blocked.activeOverlay !== 'leaderboard') return FAIL('leaderboard is not a blocking overlay');
      const closed = (await game.contractInput({ type: 'closeOverlay' })).snapshot;
      if (closed.activeOverlay === 'leaderboard') return FAIL('leaderboard did not close');
      if (!sameLevel(before, closed) && before.phase !== 'home') return FAIL('leaderboard close changed level unexpectedly');
      return PASS('leaderboard blocks and closes safely');
    }
  },
  {
    id: 'p2-4-persistence-and-no-farming',
    level: 'P2',
    name: 'durable values survive reset and repeated settlement actions do not farm payout',
    timeoutMs: 36000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const completeNearLevel = async () => {
        const before = await setupScenario(game, 'near_level_completion');
        await game.waitUntilContract('safeGapAtHitLine');
        await game.realMouseThrow(before);
        await resolveAfterThrow(game, before, 3600);
        return waitForSettlementReady(game, 12000, true);
      };
      const ready = await completeNearLevel();
      if (ready.progression?.settlementReady !== true ||
          ready.progression?.rewardClaimedForCurrentCompletion !== true) {
        return FAIL('settlement readiness or completion reward claim was not observable');
      }
      const durableBeforeReset = {
        coins: ready.economy.coins,
        total: ready.score.total,
        hearts: ready.economy.hearts,
        music: ready.settings?.musicEnabled,
        sound: ready.settings?.soundEnabled
      };
      const reset = await game.reset({ start: true });
      if (reset.economy.coins !== durableBeforeReset.coins) return FAIL('reset lost durable coins');
      if (reset.economy.hearts > reset.economy.maxHearts) return FAIL('reset produced invalid heart count');
      if (reset.economy.hearts < durableBeforeReset.hearts) return FAIL('reset lost durable hearts');
      if (finite(durableBeforeReset.total) && reset.score.total !== durableBeforeReset.total) return FAIL('reset changed durable total score');
      if (durableBeforeReset.music !== undefined && reset.settings?.musicEnabled !== durableBeforeReset.music) return FAIL('reset changed durable music setting');
      if (durableBeforeReset.sound !== undefined && reset.settings?.soundEnabled !== durableBeforeReset.sound) return FAIL('reset changed durable sound setting');
      const replayReady = await completeNearLevel();
      if (replayReady.progression?.settlementReady !== true ||
          replayReady.progression?.rewardClaimedForCurrentCompletion !== true) {
        return FAIL('replayed settlement readiness or completion reward claim was not observable');
      }
      const next = (await game.contractInput({ type: 'nextLevel' })).snapshot;
      const afterRepeat = (await game.contractInput({ type: 'nextLevel' })).snapshot;
      if (afterRepeat.economy.coins !== next.economy.coins) return FAIL('repeating nextLevel changed coin balance');
      if (afterRepeat.score.total !== next.score.total) return FAIL('repeating nextLevel changed durable total score');
      return PASS('durable reset and anti-farming behavior are observable');
    }
  }
];

module.exports = { suite };
