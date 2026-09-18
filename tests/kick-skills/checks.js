// === GDD Coverage Map ===
// M1 -> p0-02, p1-01, p1-11
// M2 -> p1-02, p1-03, p1-04
// M3 -> p1-05, p1-06
// M4 -> p1-02, p1-07
// M5 -> p0-02, p1-03, p1-04
// M6 -> p1-08, p1-10
// M7 -> p1-09, p1-11
// M8 -> p1-10
// M9 -> p1-11
// M10 -> p1-07, p1-09
// M11 -> p0-01, p0-02, p1-08, p1-09, p1-10, p1-11
// M12 -> p2-01
// M13 -> p2-02
// M14 -> p2-03
// M15 -> p2-04
//
// === Category Map ===
// Boot & Stability: p0-01, p0-02
// UI Flow & Blocking: p1-01, p1-11, p2-03, p2-04
// Input Semantics: p1-02, p1-03, p1-04, p1-05, p1-06
// Core Mechanic Loop: p1-04, p1-07, p1-08, p1-09, p1-10
// Invariants & Rejection: p1-01, p1-04, p1-11, p2-02
// Economy / Progression: p1-10, p2-01, p2-02
// Feedback & Observability: p0-02, p1-08, p1-09
//
// === Rationality Map ===
// p1-01-start-gate-real-mouse-blocking: M1 gating | real action: drag over playfield while blocked | independent observation: run unchanged + canShoot/overlay + screenshot hash | empty-shell failure: overlay that does not block or start that does not enter play fails
// p1-02-real-mouse-drag-charging-preview: M2/M4 charging | real action: mouse drag from semantic ball region | independent observation: charging phase + preview revision + unchanged run + screenshot hash | empty-shell failure: fake listeners or no preview fail
// p1-03-direction-opposite-real-drag: M2/M5 direction opposite | real action: same mouse drag class leftBack vs rightBack | independent observation: Math.sign horizontal deltas and launch/landing trends | empty-shell failure: mirrored or direction-ignored controls fail
// p1-04-real-mouse-release-flight-and-inflight-reject: M2/M5 flight chain | real action: valid mouse release then blocked second shot | independent observation: flying state + ball motion + rejected in-flight input + screenshot delta | empty-shell failure: no-motion or repeat-shot implementations fail
// p1-05-contract-weak-drag-rejection-invariant: M2 rejection | real action: weak dragShot contract | independent observation: lastAction reason + run unchanged + ready state | empty-shell failure: any-release-is-shot implementations fail
// p1-06-contract-contact-height-shapes-flight: M3 contact height contract | real action: setContactPoint high/low then comparable shot | independent observation: contact summary + height trend + unchanged pre-shot run | empty-shell failure: cosmetic contact UI fails
// p1-07-contract-contact-side-curve-shapes-flight: M3 contact side contract | real action: setContactPoint left/right then comparable shot | independent observation: curve/landing trend changes and no contact-only scoring | empty-shell failure: side contact ignored fails
// p1-08-contract-obstacle-preview-risk-chain: M4/M10 obstacle preview | real action: obstacle scenario begin/update drag | independent observation: obstacle precondition + preview risk/height/power revision | empty-shell failure: stale preview or decorative obstacle fails
// p1-09-contract-goal-scoring-result: M6 scoring | real action: goal-capable semantic shot from legal ready scenario | independent observation: goal panel + score increase + breakdown + mutual exclusion | empty-shell failure: score button, duplicate result, or success/failure overlap fails
// p1-10-contract-miss-attempt-and-no-advance: M7/M10 miss | real action: risky low/direct shot in obstacle state | independent observation: miss/blocked resolution + attempt decrease + score invariant + no advance | empty-shell failure: decorative collision or failure that awards/advances fails
// p1-11-contract-advance-clears-transients: M8/M11 progression | real action: confirmNext after player-caused goal | independent observation: challenge advances and transient result/preview clears | empty-shell failure: stale overlays or lost score fail
// p1-12-terminal-lock-and-restart: M9 terminal/restart | real action: miss on one-attempt scenario, rejected shot, restart | independent observation: terminal lock + unchanged rejected shot + fresh playable run | empty-shell failure: terminal still accepts shots or restart keeps stale run fails
// p2-01-contract-representative-and-depth-challenges: M12 depth | real action: scenario-load representative/deep states | independent observation: challenge count/type coverage + legal precondition | empty-shell failure: one generic challenge for all scenarios fails
// p2-02-shop-purchase-rejection-and-blocking: M13 shop | real action: open shop, select/buy/equip/close | independent observation: panel blocks shooting + coin ownership invariants | empty-shell failure: API-only shop, negative currency, unowned equip fail
// p2-03-settings-reset-confirmation-invariants: M14 settings | real action: open settings, toggle, cancel/confirm reset | independent observation: presentation/persistence revisions and blocked play | empty-shell failure: decorative or destructive settings fail
// p2-04-leaderboard-local-play-recovery: M15 leaderboard | real action: open leaderboard, wait, close | independent observation: allowed service state + local play restored | empty-shell failure: leaderboard traps local play fail

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }

const enums = {
  phases: new Set(['loading', 'tutorial', 'ready', 'aiming', 'flying', 'goalResult', 'missResult', 'terminal', 'panel']),
  screens: new Set(['loading', 'start', 'play', 'goalResult', 'missResult', 'gameOver', 'shop', 'settings', 'leaderboard']),
  resultKinds: new Set(['none', 'goal', 'miss', 'terminal']),
  leaderboardStates: new Set(['none', 'loading', 'entries', 'empty', 'error'])
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

  async function reset(options) {
    const opts = JSON.stringify(options || {});
    return page(`(async function(){
      const snap = await window.__gameTest.reset(${opts});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function loadScenario(name, options) {
    const scenario = JSON.stringify(name);
    const opts = JSON.stringify(options || {});
    return page(`(async function(){
      const snap = await window.__gameTest.loadScenario(${scenario}, ${opts});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function contractInput(action) {
    const payload = JSON.stringify(action || {});
    return page(`(async function(){
      const snap = await window.__gameTest.input(${payload});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function wait(duration) {
    await contractInput({ type: 'wait', duration: duration || 'short' });
    await browser.sleep(duration === 'long' ? 900 : duration === 'medium' ? 450 : 180);
    return snapshot();
  }

  function regionCenter(bounds, fallback) {
    const b = bounds || {};
    if (Number.isFinite(b.screenX) && Number.isFinite(b.screenY)) return { x: b.screenX, y: b.screenY };
    if (Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.width) && Number.isFinite(b.height)) {
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    }
    if (fallback && Number.isFinite(fallback.x) && Number.isFinite(fallback.y)) return fallback;
    throw new Error('missing public semantic region center');
  }

  function ballPoint(snap) {
    const scene = snap.scene || {};
    const ball = snap.ball || {};
    if (Number.isFinite(ball.screenX) && Number.isFinite(ball.screenY)) return { x: ball.screenX, y: ball.screenY };
    const playfield = scene.playfield ? regionCenter(scene.playfield) : null;
    return regionCenter(scene.ballBounds, playfield);
  }

  function dragEndpoint(start, pull, power) {
    const magnitude = power === 'weak' ? 24 : power === 'strong' ? 170 : 120;
    const side = pull === 'leftBack' ? -1 : pull === 'rightBack' ? 1 : 0;
    return { x: start.x + side * magnitude * 0.8, y: start.y + magnitude };
  }

  async function realMouseDragFromSnapshot(snap, pull, power, holdOnly) {
    const start = ballPoint(snap);
    const end = dragEndpoint(start, pull || 'straightBack', power || 'medium');
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.sleep(80);
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: end.x,
      y: end.y,
      button: 'left',
      buttons: 1,
      modifiers: 0,
      movementX: end.x - start.x,
      movementY: end.y - start.y
    });
    await browser.sleep(180);
    if (!holdOnly) {
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
    }
    return { start, end, deltaX: end.x - start.x };
  }

  async function releaseMouseAt(point) {
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
      modifiers: 0
    });
  }

  async function realTouchTapPlayfield(snap) {
    const p = regionCenter((snap.scene || {}).playfield);
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: p.x, y: p.y, id: 1, radiusX: 2, radiusY: 2, force: 1 }]
    });
    await browser.sleep(60);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  async function screenshotHash() {
    return browser.canvasPixelHash();
  }

  async function visibleText() {
    return page(`(function(){
      const body = document.body;
      if (!body) return '';
      return (body.innerText || body.textContent || '').replace(/\\s+/g, ' ').slice(0, 2000);
    })()`);
  }

  return {
    snapshot,
    reset,
    loadScenario,
    contractInput,
    wait,
    realMouseDragFromSnapshot,
    releaseMouseAt,
    realTouchTapPlayfield,
    screenshotHash,
    visibleText
  };
}

function assertContractShape(s) {
  if (!s || s.contractMissing) return 'window.__gameTest.getSnapshot is missing';
  if (!enums.phases.has(s.phase)) return `invalid phase ${s.phase}`;
  if (!enums.screens.has(s.screen)) return `invalid screen ${s.screen}`;
  if (!s.run || !s.shot || !s.scene || !s.resultPanel || !s.lastAction) return 'snapshot missing required envelopes';
  if (!Number.isFinite(s.run.score) || !Number.isFinite(s.run.coins) || !Number.isFinite(s.run.attemptsRemaining)) return 'run numeric fields are invalid';
  if (s.run.score < 0 || s.run.coins < 0 || s.run.attemptsRemaining < 0) return 'score, coins, or attempts is negative';
  if (!s.scene.playfield || !Number.isFinite(s.scene.playfield.width) || !Number.isFinite(s.scene.playfield.height)) return 'semantic playfield bounds missing';
  if (typeof s.scene.primaryViewNonBlank !== 'boolean' || typeof s.scene.renderReady !== 'boolean') return 'scene render flags missing';
  return '';
}

function assertLegalReadyScenario(s, expectedName) {
  const shape = assertContractShape(s);
  if (shape) return `${expectedName}: ${shape}`;
  if (s.phase !== 'ready') return `${expectedName}: expected ready phase, got ${s.phase}`;
  if (s.run.result !== 'none') return `${expectedName}: scenario already has result ${s.run.result}`;
  if (s.resultPanel && s.resultPanel.visible) return `${expectedName}: scenario preloads result panel`;
  if (!s.canInteractWithPlayfield || !s.canShoot) return `${expectedName}: playfield is not shootable`;
  return '';
}

function cloneRun(s) {
  return {
    challengeIndex: s.run.challengeIndex,
    attemptsRemaining: s.run.attemptsRemaining,
    score: s.run.score,
    coins: s.run.coins,
    result: s.run.result
  };
}

function sameRun(a, b) {
  return a.challengeIndex === b.run.challengeIndex &&
    a.attemptsRemaining === b.run.attemptsRemaining &&
    a.score === b.run.score &&
    a.coins === b.run.coins &&
    a.result === b.run.result;
}

function trendSign(value) {
  if (value === 'left') return -1;
  if (value === 'right') return 1;
  if (value === 'center' || value === 'none') return 0;
  if (Number.isFinite(value)) return Math.sign(value);
  return 0;
}

function horizontalEvidence(before, after) {
  const startX = before && before.ball && Number.isFinite(before.ball.screenX) ? before.ball.screenX : null;
  const endX = after && after.ball && Number.isFinite(after.ball.screenX) ? after.ball.screenX : null;
  const screenSign = startX === null || endX === null ? 0 : Math.sign(endX - startX);
  const landingSign = trendSign(after && after.ball ? after.ball.lastLandingTrend : 'none');
  const launchSign = trendSign(after && after.shot ? after.shot.launchTrend : 'none');
  return screenSign || landingSign || launchSign;
}

function requireChanged(before, after, fields) {
  for (const field of fields) {
    const parts = field.split('.');
    let a = before;
    let b = after;
    for (const p of parts) {
      a = a && a[p];
      b = b && b[p];
    }
    if (a !== b) return true;
  }
  return false;
}

async function resolveGoalShot(game) {
  const attempts = [
    [{ type: 'setContactPoint', x: 'center', y: 'middle' }, { type: 'dragShot', pull: 'straightBack', power: 'medium' }],
    [{ type: 'setContactPoint', x: 'center', y: 'low' }, { type: 'dragShot', pull: 'straightBack', power: 'medium' }],
    [{ type: 'setContactPoint', x: 'center', y: 'high' }, { type: 'dragShot', pull: 'straightBack', power: 'medium' }],
    [{ type: 'setContactPoint', x: 'center', y: 'middle' }, { type: 'dragShot', pull: 'straightBack', power: 'strong' }],
    [{ type: 'setContactPoint', x: 'left', y: 'middle' }, { type: 'dragShot', pull: 'rightBack', power: 'medium' }],
    [{ type: 'setContactPoint', x: 'right', y: 'middle' }, { type: 'dragShot', pull: 'leftBack', power: 'medium' }],
    [{ type: 'setContactPoint', x: 'left', y: 'high' }, { type: 'dragShot', pull: 'rightBack', power: 'strong' }],
    [{ type: 'setContactPoint', x: 'right', y: 'high' }, { type: 'dragShot', pull: 'leftBack', power: 'strong' }],
    [{ type: 'setContactPoint', x: 'center', y: 'low' }, { type: 'dragShot', pull: 'straightBack', power: 'strong' }]
  ];
  for (const sequence of attempts) {
    const before = await game.loadScenario('basic_target_ready');
    const pre = assertLegalReadyScenario(before, 'basic_target_ready');
    if (pre) return { before, after: before, error: pre };
    for (const action of sequence) await game.contractInput(action);
    await game.wait('long');
    const after = await game.snapshot();
    if (after.resultPanel && after.resultPanel.kind === 'goal') return { before, after };
  }
  return { before: await game.snapshot(), after: await game.snapshot(), error: 'no goal result after declared goal-capable shots' };
}

async function resolveMissShot(game, scenario) {
  const scenarioName = scenario || 'wall_obstacle_ready';
  if (scenarioName === 'wall_obstacle_ready') {
    const attempts = [
      { x: 'center', y: 'low', pull: 'straightBack', power: 'medium' },
      { x: 'left', y: 'low', pull: 'rightBack', power: 'medium' },
      { x: 'right', y: 'low', pull: 'leftBack', power: 'medium' },
      { x: 'left', y: 'low', pull: 'rightBack', power: 'strong' },
      { x: 'right', y: 'low', pull: 'leftBack', power: 'strong' },
      { x: 'left', y: 'low', pull: 'leftBack', power: 'strong' },
      { x: 'right', y: 'low', pull: 'rightBack', power: 'strong' },
      { x: 'center', y: 'low', pull: 'straightBack', power: 'strong' }
    ];
    let last = null;
    for (const attempt of attempts) {
      const before = await game.loadScenario(scenarioName);
      const pre = assertLegalReadyScenario(before, scenarioName);
      if (pre) return { before, after: before, error: pre };
      const counts = before.scene && before.scene.obstacleCounts;
      const hasObstacle = counts && Object.keys(counts).some(key => Number.isFinite(counts[key]) && counts[key] > 0);
      if (!hasObstacle) return { before, after: before, error: scenarioName + ': visible obstacle is missing' };
      await game.contractInput({ type: 'setContactPoint', x: attempt.x, y: attempt.y });
      const held = await game.contractInput({
        type: 'beginDrag',
        pull: attempt.pull,
        power: attempt.power
      });
      const previewRisk = held && held.preview ? held.preview.obstacleRisk : null;
      const heldReady = !!held && (held.phase === 'aiming' || (held.shot && held.shot.state === 'charging'));
      if (heldReady) await game.contractInput({ type: 'releaseDrag' });
      else await game.contractInput({ type: 'dragShot', pull: attempt.pull, power: attempt.power });
      await game.wait('long');
      const after = await game.snapshot();
      last = { before, after };
      if (after.resultPanel && after.resultPanel.kind === 'miss') return last;
      if ((previewRisk === 'interrupted' || previewRisk === 'groundRisk') &&
          after.resultPanel && after.resultPanel.kind === 'goal') {
        return { before, after, error: 'risky obstacle route resolved as goal: ' + after.shot.resolution + '/' + after.resultPanel.kind };
      }
    }
    const resolution = last && last.after.shot && last.after.shot.resolution || 'unknown';
    const resultKind = last && last.after.resultPanel && last.after.resultPanel.kind || 'none';
    return {
      before: last ? last.before : null,
      after: last ? last.after : null,
      error: 'no miss result after legal obstacle routes: ' + resolution + '/' + resultKind
    };
  }
  const before = await game.loadScenario(scenarioName);
  const pre = assertLegalReadyScenario(before, scenarioName);
  if (pre) return { before, after: before, error: pre };
  await game.contractInput({ type: 'setContactPoint', x: 'center', y: 'low' });
  await game.contractInput({ type: 'dragShot', pull: 'straightBack', power: 'medium' });
  await game.wait('long');
  const after = await game.snapshot();
  return { before, after };
}

async function resolveTerminalMissShot(game) {
  async function resolveCurrentWallMissRoute(game, route) {
    const before = await game.snapshot();
    const pre = assertLegalReadyScenario(before, 'wall_obstacle_ready');
    if (pre) return { before, after: before, error: pre };
    const counts = before.scene && before.scene.obstacleCounts;
    const hasObstacle = counts && Object.keys(counts).some(key => Number.isFinite(counts[key]) && counts[key] > 0);
    if (!hasObstacle) return { before, after: before, error: 'wall_obstacle_ready: visible obstacle is missing' };
    await game.contractInput({ type: 'setContactPoint', x: route.x, y: 'low' });
    const held = await game.contractInput({ type: 'beginDrag', pull: route.pull, power: 'medium' });
    const heldReady = !!held && (held.phase === 'aiming' || (held.shot && held.shot.state === 'charging'));
    if (heldReady) await game.contractInput({ type: 'releaseDrag' });
    else await game.contractInput({ type: 'dragShot', pull: route.pull, power: 'medium' });
    await game.wait('long');
    let after = await game.snapshot();
    if (after.phase === 'flying') {
      await game.wait('long');
      after = await game.snapshot();
    }
    return { before, after };
  }

  const routes = [
    { x: 'center', pull: 'straightBack' },
    { x: 'left', pull: 'rightBack' },
    { x: 'right', pull: 'leftBack' }
  ];
  let selectedRoute = null;
  let last = null;
  for (const route of routes) {
    const loaded = await game.loadScenario('wall_obstacle_ready');
    const pre = assertLegalReadyScenario(loaded, 'wall_obstacle_ready');
    if (pre) return { before: loaded, after: loaded, error: pre };
    const attempt = await resolveCurrentWallMissRoute(game, route);
    if (attempt.error) return attempt;
    last = attempt;
    const miss = attempt.after.resultPanel &&
      (attempt.after.resultPanel.kind === 'miss' || attempt.after.resultPanel.kind === 'terminal') &&
      attempt.after.run.attemptsRemaining < attempt.before.run.attemptsRemaining;
    if (miss) {
      selectedRoute = route;
      break;
    }
  }
  if (!selectedRoute) {
    const resolution = last && last.after.shot && last.after.shot.resolution || 'unknown';
    const resultKind = last && last.after.resultPanel && last.after.resultPanel.kind || 'none';
    return {
      before: last ? last.before : null,
      after: last ? last.after : null,
      error: `no player-level miss after legal obstacle routes: ${resolution}/${resultKind}`
    };
  }

  let before = last.before;
  let after = last.after;
  while (after.run.attemptsRemaining > 0) {
    const retry = await game.contractInput({ type: 'confirmRetry' });
    if (!retry.lastAction || retry.lastAction.ok !== true) {
      return { before, after: retry, error: 'confirmRetry did not restore a ready state after a miss' };
    }
    const repeated = await resolveCurrentWallMissRoute(game, selectedRoute);
    if (repeated.error) return repeated;
    const repeatedMiss = repeated.after.resultPanel &&
      (repeated.after.resultPanel.kind === 'miss' || repeated.after.resultPanel.kind === 'terminal') &&
      repeated.after.run.attemptsRemaining < repeated.before.run.attemptsRemaining;
    if (!repeatedMiss) {
      const resolution = repeated.after.shot && repeated.after.shot.resolution || 'unknown';
      const resultKind = repeated.after.resultPanel && repeated.after.resultPanel.kind || 'none';
      return {
        before: repeated.before,
        after: repeated.after,
        error: `selected miss route no longer produced a miss: ${resolution}/${resultKind}`
      };
    }
    before = repeated.before;
    after = repeated.after;
  }

  const terminalMiss = after.phase === 'terminal' &&
    after.run.result === 'gameOver' && after.run.attemptsRemaining === 0 &&
    after.resultPanel && after.resultPanel.visible && after.resultPanel.kind === 'terminal';
  if (terminalMiss) return { before, after };
  return { before, after, error: `observed misses did not reach terminal state: ${after.phase}/${after.screen}/${after.run.result}` };
}

const suite = [
  {
    id: 'p0-01-api-contract-schema',
    level: 'P0',
    name: 'API contract exposes stable snapshot schema and invalid action rejection',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const present = await browser.eval(`(function(){
        const gt = window.__gameTest;
        return !!gt && ['reset','loadScenario','input','getSnapshot'].every(function(k){ return typeof gt[k] === 'function'; });
      })()`);
      if (!present) return FAIL('window.__gameTest reset/loadScenario/input/getSnapshot contract missing');
      const s = await game.reset({ clearPersistence: true });
      const shape = assertContractShape(s);
      if (shape) return FAIL(shape);
      const before = cloneRun(s);
      const bad = await game.contractInput({ type: 'unknownActionForContract' });
      if (!bad.lastAction || bad.lastAction.ok !== false) return FAIL('invalid action did not return lastAction.ok=false');
      if (bad.lastAction.reason !== 'invalidAction' && bad.lastAction.reason !== 'unavailable') return FAIL(`invalid action reason was ${bad.lastAction.reason}`);
      if (!sameRun(before, bad)) return FAIL('invalid action mutated run state');
      return PASS('schema valid, invalid action rejected, run invariant held');
    }
  },
  {
    id: 'p0-02-visible-playfield-and-hud',
    level: 'P0',
    name: 'Visible playfield exposes nonblank scene and semantic regions',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let s = await game.loadScenario('basic_target_ready');
      const pre = assertLegalReadyScenario(s, 'basic_target_ready');
      if (pre) return FAIL(pre);
      for (let i = 0; i < 20 && (!s.scene.renderReady || !s.scene.primaryViewNonBlank); i++) {
        await browser.sleep(50);
        s = await game.snapshot();
      }
      if (!s.scene.renderReady || !s.scene.primaryViewNonBlank) return FAIL('scene render flags are not ready and nonblank');
      if (!s.ball || !s.ball.visible) return FAIL('ball is not visible in snapshot');
      const hash = await game.screenshotHash();
      const text = await game.visibleText();
      if (!Number.isFinite(hash)) return FAIL('screenshot hash unavailable for visible scene');
      if (!text || text.length < 3) return FAIL('visible HUD/body text is empty');
      return PASS('scene nonblank, ball visible, semantic bounds and HUD text observable');
    }
  },
  {
    id: 'p1-01-start-gate-real-mouse-blocking',
    level: 'P1',
    name: 'Start gate blocks real mouse shot until start action',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const fresh = await game.loadScenario('fresh_start');
      const shape = assertContractShape(fresh);
      if (shape) return FAIL(shape);
      const before = cloneRun(fresh);
      const beforeHash = await game.screenshotHash();
      await game.realMouseDragFromSnapshot(fresh, 'straightBack', 'strong', false);
      await browser.sleep(250);
      const blocked = await game.snapshot();
      if (!sameRun(before, blocked)) return FAIL('real drag while start/tutorial gate was active mutated run state');
      if (blocked.phase === 'flying' || blocked.shot.state === 'flying') return FAIL('blocked overlay allowed a shot to fly');
      await game.contractInput({ type: 'start' });
      await browser.sleep(150);
      const after = await game.snapshot();
      if (after.overlayBlocking || !after.canInteractWithPlayfield || !after.canShoot) return FAIL('start did not restore playable shooting state');
      const afterHash = await game.screenshotHash();
      if (beforeHash === afterHash && fresh.overlayBlocking) return FAIL('start transition produced no visible screen change');
      return PASS('blocked real drag preserved run; start opened playable state');
    }
  },
  {
    id: 'p1-02-real-mouse-drag-charging-preview',
    level: 'P1',
    name: 'Real mouse drag creates charging preview without pre-shot mutation',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const loaded = await game.loadScenario('basic_target_ready');
      const pre = assertLegalReadyScenario(loaded, 'basic_target_ready');
      if (pre) return FAIL(pre);
      await browser.sleep(120);
      const ready = await game.snapshot();
      const readyPre = assertLegalReadyScenario(ready, 'basic_target_ready');
      if (readyPre) return FAIL(readyPre);
      const beforeRun = cloneRun(ready);
      const beforeHash = await game.screenshotHash();
      const drag = await game.realMouseDragFromSnapshot(ready, 'straightBack', 'medium', true);
      const held = await game.snapshot();
      if (held.phase !== 'aiming' && held.shot.state !== 'charging') return FAIL(`held real drag did not enter aiming/charging, phase=${held.phase}, shot=${held.shot.state}`);
      if (!held.preview || held.preview.visible !== true) return FAIL('preview not visible during held drag');
      if (!(held.preview.revision > ready.preview.revision)) return FAIL('preview revision did not increase during held drag');
      if (!sameRun(beforeRun, held)) return FAIL('charging preview changed score, coins, attempts, challenge, or result');
      const heldHash = await game.screenshotHash();
      await game.releaseMouseAt(drag.end);
      if (beforeHash === heldHash) return FAIL('real drag charging produced no visible screen change');
      return PASS('real mouse drag caused charging preview and preserved pre-shot run invariant');
    }
  },
  {
    id: 'p1-03-direction-opposite-real-drag',
    level: 'P1',
    name: 'Opposite-direction drag produces opposite visible horizontal result',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const leftLoaded = await game.loadScenario('basic_target_ready');
      const leftPre = assertLegalReadyScenario(leftLoaded, 'basic_target_ready');
      if (leftPre) return FAIL(leftPre);
      // loadScenario may reset the camera synchronously while the semantic
      // screen bounds are refreshed on the next render frame. Re-acquire the
      // public region before dispatching real input so this comparison does
      // not depend on the previous shot's camera state.
      await browser.sleep(120);
      const leftStart = await game.snapshot();
      const leftReady = assertLegalReadyScenario(leftStart, 'basic_target_ready');
      if (leftReady) return FAIL(leftReady);
      await game.realMouseDragFromSnapshot(leftStart, 'leftBack', 'strong', false);
      await game.wait('medium');
      const leftAfter = await game.snapshot();

      const rightLoaded = await game.loadScenario('basic_target_ready');
      const rightPre = assertLegalReadyScenario(rightLoaded, 'basic_target_ready');
      if (rightPre) return FAIL(rightPre);
      await browser.sleep(120);
      const rightStart = await game.snapshot();
      const rightReady = assertLegalReadyScenario(rightStart, 'basic_target_ready');
      if (rightReady) return FAIL(rightReady);
      await game.realMouseDragFromSnapshot(rightStart, 'rightBack', 'strong', false);
      await game.wait('medium');
      const rightAfter = await game.snapshot();

      const leftSign = horizontalEvidence(leftStart, leftAfter);
      const rightSign = horizontalEvidence(rightStart, rightAfter);
      if (leftAfter.shot.state !== 'flying' && leftAfter.phase !== 'flying' && leftAfter.shot.state !== 'resolved') return FAIL('left-back drag did not launch or resolve a shot');
      if (rightAfter.shot.state !== 'flying' && rightAfter.phase !== 'flying' && rightAfter.shot.state !== 'resolved') return FAIL('right-back drag did not launch or resolve a shot');
      if (leftSign === 0) return FAIL('left-back shot lacks horizontal visible/semantic evidence');
      if (rightSign === 0) return FAIL('right-back shot lacks horizontal visible/semantic evidence');
      if (Math.sign(leftSign) === Math.sign(rightSign)) return FAIL(`direction opposite check failed: leftSign=${leftSign}, rightSign=${rightSign}`);
      const leftResultVisible = !!(leftAfter.resultPanel && leftAfter.resultPanel.visible);
      const rightResultVisible = !!(rightAfter.resultPanel && rightAfter.resultPanel.visible);
      if (!leftResultVisible && leftAfter.run.score !== leftStart.run.score) return FAIL('left direction shot scored before a result was visible');
      if (!rightResultVisible && rightAfter.run.score !== rightStart.run.score) return FAIL('right direction shot scored before a result was visible');
      if (leftResultVisible && leftAfter.resultPanel.kind === 'miss' && leftAfter.run.score > leftStart.run.score) return FAIL('left miss result increased score');
      if (rightResultVisible && rightAfter.resultPanel.kind === 'miss' && rightAfter.run.score > rightStart.run.score) return FAIL('right miss result increased score');
      return PASS(`direction opposite verified with signs ${leftSign} and ${rightSign}`);
    }
  },
  {
    id: 'p1-04-real-mouse-release-flight-and-inflight-reject',
    level: 'P1',
    name: 'Real mouse release commits flight, motion, and in-flight rejection',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const loaded = await game.loadScenario('basic_target_ready');
      const pre = assertLegalReadyScenario(loaded, 'basic_target_ready');
      if (pre) return FAIL(pre);
      await browser.sleep(120);
      const ready = await game.snapshot();
      const readyPre = assertLegalReadyScenario(ready, 'basic_target_ready');
      if (readyPre) return FAIL(readyPre);
      const hashBefore = await game.screenshotHash();
      await game.realMouseDragFromSnapshot(ready, 'straightBack', 'strong', false);
      await browser.sleep(200);
      const flying = await game.snapshot();
      if (flying.phase !== 'flying' && flying.shot.state !== 'flying') return FAIL(`release did not enter flying state: ${flying.phase}/${flying.shot.state}`);
      if (flying.canShoot !== false) return FAIL('canShoot stayed true during flight');
      const rejected = await game.contractInput({ type: 'dragShot', pull: 'straightBack', power: 'strong' });
      if (!rejected.lastAction || rejected.lastAction.ok !== false) return FAIL('second shot during flight was not rejected');
      if (rejected.lastAction.reason !== 'inFlight' && rejected.lastAction.reason !== 'notReady' && rejected.lastAction.reason !== 'blockedOverlay') return FAIL(`in-flight rejection reason was ${rejected.lastAction.reason}`);
      await game.wait('medium');
      const later = await game.snapshot();
      const moved = later.ball.motionRevision > ready.ball.motionRevision || later.ball.flightRevision > ready.ball.flightRevision || later.ball.heightBand !== ready.ball.heightBand || later.ball.screenY !== ready.ball.screenY;
      if (!moved) return FAIL('ball motion, flight revision, height, and screen position did not change after release');
      const hashAfter = await game.screenshotHash();
      if (hashBefore === hashAfter) return FAIL('released shot produced no visible screen change');
      return PASS('valid release caused flight, motion, visible change, and in-flight rejection');
    }
  },
  {
    id: 'p1-05-contract-weak-drag-rejection-invariant',
    level: 'P1',
    name: 'API contract weak drag rejects without run mutation',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const ready = await game.loadScenario('basic_target_ready');
      const pre = assertLegalReadyScenario(ready, 'basic_target_ready');
      if (pre) return FAIL(pre);
      const before = cloneRun(ready);
      const after = await game.contractInput({ type: 'dragShot', pull: 'weak', power: 'weak' });
      if (!after.lastAction || after.lastAction.ok !== false) return FAIL('weak drag was not rejected');
      if (after.lastAction.reason !== 'weakDrag' && after.lastAction.reason !== 'invalidAction') return FAIL(`weak drag reason was ${after.lastAction.reason}`);
      if (!sameRun(before, after)) return FAIL('weak drag changed score, coins, attempts, challenge, or result');
      if (after.shot.state !== 'idle' || after.resultPanel.visible) return FAIL('weak drag left shot/result feedback active');
      if (!after.canShoot) return FAIL('weak drag did not return to shootable state');
      return PASS('weak drag rejection preserved run and readiness invariants');
    }
  },
  {
    id: 'p1-06-contract-contact-height-shapes-flight',
    level: 'P1',
    name: 'API contract contact height changes shot height without firing',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const highReady = await game.loadScenario('basic_target_ready');
      const highPre = assertLegalReadyScenario(highReady, 'basic_target_ready');
      if (highPre) return FAIL(highPre);
      const highBase = cloneRun(highReady);
      const highContact = await game.contractInput({ type: 'setContactPoint', x: 'center', y: 'high' });
      if (highContact.contact.y !== 'high') return FAIL('high contact point not reflected in snapshot');
      if (!sameRun(highBase, highContact)) return FAIL('contact-point change fired or mutated run state');
      await game.contractInput({ type: 'dragShot', pull: 'straightBack', power: 'strong' });
      await game.wait('medium');
      const highAfter = await game.snapshot();

      const lowReady = await game.loadScenario('basic_target_ready');
      const lowPre = assertLegalReadyScenario(lowReady, 'basic_target_ready');
      if (lowPre) return FAIL(lowPre);
      const lowBase = cloneRun(lowReady);
      const lowContact = await game.contractInput({ type: 'setContactPoint', x: 'center', y: 'low' });
      if (lowContact.contact.y !== 'low') return FAIL('low contact point not reflected in snapshot');
      if (!sameRun(lowBase, lowContact)) return FAIL('low contact point fired or mutated run state');
      await game.contractInput({ type: 'dragShot', pull: 'straightBack', power: 'strong' });
      await game.wait('medium');
      const lowAfter = await game.snapshot();

      if (highAfter.shot.heightTrend === lowAfter.shot.heightTrend && highAfter.ball.heightBand === lowAfter.ball.heightBand) return FAIL('high and low contacts produced the same height evidence');
      return PASS(`height shaping differs: high=${highAfter.shot.heightTrend}/${highAfter.ball.heightBand}, low=${lowAfter.shot.heightTrend}/${lowAfter.ball.heightBand}`);
    }
  },
  {
    id: 'p1-07-contract-contact-side-curve-shapes-flight',
    level: 'P1',
    name: 'API contract side contact changes curve or landing trend without contact-only scoring',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const leftReady = await game.loadScenario('basic_target_ready');
      const leftPre = assertLegalReadyScenario(leftReady, 'basic_target_ready');
      if (leftPre) return FAIL(leftPre);
      const leftBase = cloneRun(leftReady);
      const leftContact = await game.contractInput({ type: 'setContactPoint', x: 'left', y: 'middle' });
      if (leftContact.contact.x !== 'left') return FAIL('left contact not reflected in snapshot');
      if (!sameRun(leftBase, leftContact)) return FAIL('left contact mutated run state before shot');
      await game.contractInput({ type: 'dragShot', pull: 'straightBack', power: 'strong' });
      await game.wait('medium');
      const leftAfter = await game.snapshot();

      const rightReady = await game.loadScenario('basic_target_ready');
      const rightPre = assertLegalReadyScenario(rightReady, 'basic_target_ready');
      if (rightPre) return FAIL(rightPre);
      const rightBase = cloneRun(rightReady);
      const rightContact = await game.contractInput({ type: 'setContactPoint', x: 'right', y: 'middle' });
      if (rightContact.contact.x !== 'right') return FAIL('right contact not reflected in snapshot');
      if (!sameRun(rightBase, rightContact)) return FAIL('right contact mutated run state before shot');
      await game.contractInput({ type: 'dragShot', pull: 'straightBack', power: 'strong' });
      await game.wait('medium');
      const rightAfter = await game.snapshot();

      const leftCurve = trendSign(leftAfter.shot.curveTrend) || trendSign(leftAfter.ball.lastLandingTrend);
      const rightCurve = trendSign(rightAfter.shot.curveTrend) || trendSign(rightAfter.ball.lastLandingTrend);
      if (leftCurve === 0 || rightCurve === 0) return FAIL(`curve evidence missing: left=${leftAfter.shot.curveTrend}, right=${rightAfter.shot.curveTrend}`);
      if (Math.sign(leftCurve) === Math.sign(rightCurve)) return FAIL(`side contacts did not produce opposite curve/landing signs: ${leftCurve}/${rightCurve}`);
      return PASS('side contact changes curve or landing trend without contact-only scoring');
    }
  },
  {
    id: 'p1-08-contract-obstacle-preview-risk-chain',
    level: 'P1',
    name: 'API contract obstacle preview reacts to power and height before release',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const ready = await game.loadScenario('wall_obstacle_ready');
      const pre = assertLegalReadyScenario(ready, 'wall_obstacle_ready');
      if (pre) return FAIL(pre);
      if (!ready.scene.obstacleCounts || ready.scene.obstacleCounts.walls < 1) return FAIL('wall obstacle scenario lacks visible wall count');
      await game.contractInput({ type: 'setContactPoint', x: 'center', y: 'low' });
      const lowHeld = await game.contractInput({ type: 'beginDrag', pull: 'straightBack', power: 'medium' });
      if (!lowHeld.preview.visible || (lowHeld.phase !== 'aiming' && lowHeld.shot.state !== 'charging')) return FAIL('beginDrag did not expose charging preview');
      const lowRevision = lowHeld.preview.revision;
      const lowRisk = lowHeld.preview.obstacleRisk;
      await game.contractInput({ type: 'setContactPoint', x: 'center', y: 'high' });
      const highHeld = await game.contractInput({ type: 'updateDrag', pull: 'straightBack', power: 'strong' });
      if (!(highHeld.preview.revision > lowRevision)) return FAIL('preview revision did not update after contact/power change');
      if (highHeld.preview.powerBand === lowHeld.preview.powerBand && highHeld.preview.heightTrend === lowHeld.preview.heightTrend && highHeld.preview.obstacleRisk === lowRisk) return FAIL('preview power, height, and obstacle risk all stayed unchanged');
      if (highHeld.run.score !== ready.run.score || highHeld.run.attemptsRemaining !== ready.run.attemptsRemaining) return FAIL('preview-only update changed score or attempts');
      return PASS('obstacle preview updated before release and preserved run state');
    }
  },
  {
    id: 'p1-09-contract-goal-scoring-result',
    level: 'P1',
    name: 'API contract goal shot produces scoring panel and synchronized run state',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const outcome = await resolveGoalShot(game);
      if (outcome.error) return FAIL(outcome.error);
      const before = outcome.before;
      const after = outcome.after;
      if (!after.resultPanel.visible || after.resultPanel.kind !== 'goal') return FAIL('goal result panel is not visible');
      if (!(after.run.score > before.run.score)) return FAIL('goal did not increase cumulative score');
      if (!(after.resultPanel.scoreDelta > 0)) return FAIL('goal result lacks positive score delta');
      if (!Array.isArray(after.resultPanel.scoreBreakdownKinds) || after.resultPanel.scoreBreakdownKinds.length < 1) return FAIL('goal result lacks scoring breakdown kinds');
      if (!after.resultPanel.mutuallyExclusive) return FAIL('goal and miss result mutual exclusion flag is false');
      if (after.canShoot) return FAIL('goal result panel still allows ordinary shooting');
      if (after.run.coins < before.run.coins) return FAIL('goal path reduced coins');
      return PASS('goal shot increased score, showed exclusive panel, and synchronized result state');
    }
  },
  {
    id: 'p1-10-contract-miss-attempt-and-no-advance',
    level: 'P1',
    name: 'API contract obstacle miss consumes attempt without goal reward or advance',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const outcome = await resolveMissShot(game, 'wall_obstacle_ready');
      if (outcome.error) return FAIL(outcome.error);
      const before = outcome.before;
      const after = outcome.after;
      const missResolution = new Set(['miss', 'blocked', 'outOfBounds', 'stalled']);
      if (!missResolution.has(after.shot.resolution) && after.resultPanel.kind !== 'miss') return FAIL(`shot did not resolve as miss/blocked path: ${after.shot.resolution}/${after.resultPanel.kind}`);
      if (!after.resultPanel.visible || after.resultPanel.kind !== 'miss') return FAIL('miss result panel is not visible');
      if (after.run.attemptsRemaining !== before.run.attemptsRemaining - 1) return FAIL(`attempts did not decrease by one: ${before.run.attemptsRemaining} -> ${after.run.attemptsRemaining}`);
      if (after.run.challengeIndex !== before.run.challengeIndex) return FAIL('miss advanced the challenge');
      if (after.run.score > before.run.score) return FAIL('miss increased score');
      if (!after.resultPanel.mutuallyExclusive) return FAIL('miss panel is not mutually exclusive');
      return PASS('miss consumed one attempt, preserved challenge, and did not award goal score');
    }
  },
  {
    id: 'p1-11-contract-advance-clears-transients',
    level: 'P1',
    name: 'API contract confirmNext advances challenge and clears transient result state',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const outcome = await resolveGoalShot(game);
      if (outcome.error) return FAIL(outcome.error);
      const scored = outcome.after;
      const scoreBeforeNext = scored.run.score;
      const next = await game.contractInput({ type: 'confirmNext' });
      if (next.phase !== 'ready') return FAIL(`confirmNext did not return to ready phase: ${next.phase}`);
      if (next.resultPanel.visible || next.activePanel !== 'none') return FAIL('result panel or active panel stayed visible after confirmNext');
      if (next.preview.visible || next.shot.state !== 'idle') return FAIL('preview or shot state was not cleared for next challenge');
      if (next.run.result !== 'none') return FAIL('run result was not cleared after confirmNext');
      if (next.shot.resolution !== 'none' || next.shot.validCharge ||
          next.ball.trailVisible || next.ball.lastLandingTrend !== 'none') {
        return FAIL('transient shot evidence was not cleared after confirmNext');
      }
      if (next.run.score !== scoreBeforeNext) return FAIL('run score was not preserved after advancing');
      const progressed = next.run.challengeIndex > scored.run.challengeIndex || next.run.challengeType !== scored.run.challengeType;
      if (!progressed) return FAIL('challenge did not advance or change type after goal confirmation');
      if (next.run.attemptsRemaining < 0 || next.run.coins < 0) return FAIL('attempts or coins went negative after advance');
      return PASS('confirmNext advanced challenge and cleared transient shot/result evidence');
    }
  },
  {
    id: 'p1-12-terminal-lock-and-restart',
    level: 'P1',
    name: 'API contract terminal state rejects shooting and restart restores a fresh run',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const outcome = await resolveTerminalMissShot(game);
      if (outcome.error) return FAIL(outcome.error);
      const terminal = outcome.after;
      if (terminal.phase !== 'terminal' && terminal.screen !== 'gameOver' && terminal.run.result !== 'gameOver') return FAIL(`last miss did not reach terminal state: ${terminal.phase}/${terminal.screen}/${terminal.run.result}`);
      if (terminal.canShoot) return FAIL('terminal state allows shooting');
      const terminalRun = cloneRun(terminal);
      const rejected = await game.contractInput({ type: 'dragShot', pull: 'straightBack', power: 'strong' });
      if (!rejected.lastAction || rejected.lastAction.ok !== false) return FAIL('terminal shot was not rejected');
      if (!sameRun(terminalRun, rejected)) return FAIL('rejected terminal shot mutated run state');
      const fresh = await game.contractInput({ type: 'restart' });
      if (fresh.run.score !== 0) return FAIL('restart did not reset active run score');
      if (fresh.run.challengeIndex > 1) return FAIL('restart did not return to initial challenge');
      if (fresh.resultPanel.visible || fresh.shot.state === 'flying') return FAIL('restart left result or flight state active');
      if (!fresh.canRestart && !fresh.canShoot && fresh.phase !== 'tutorial') return FAIL('restart did not restore a playable or startable state');
      return PASS('terminal lock rejected shot; restart reset run and cleared transient state');
    }
  },
  {
    id: 'p2-01-contract-representative-and-depth-challenges',
    level: 'P2',
    name: 'API contract representative challenge scenarios are legal and diverse',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const names = ['basic_target_ready', 'wall_obstacle_ready', 'moving_target_ready', 'goalkeeper_ready', 'hole_gate_ready'];
      const seenTypes = new Set();
      for (const name of names) {
        const s = await game.loadScenario(name);
        const pre = assertLegalReadyScenario(s, name);
        if (pre) return FAIL(pre);
        seenTypes.add(s.run.challengeType);
        if (name === 'wall_obstacle_ready' && s.scene.obstacleCounts.walls < 1) return FAIL('wall scenario lacks wall obstacle count');
        if (name === 'moving_target_ready' && s.scene.obstacleCounts.movingTargets < 1 && s.scene.worldMotionRevision < 1) return FAIL('moving target scenario lacks motion evidence');
        if (name === 'goalkeeper_ready' && s.scene.obstacleCounts.goalkeepers < 1) return FAIL('goalkeeper scenario lacks goalkeeper count');
        if (name === 'hole_gate_ready' && s.scene.obstacleCounts.holeGates < 1 && !s.scene.targetZones.some(z => z.kind === 'opening' && z.visible)) return FAIL('hole gate scenario lacks opening evidence');
      }
      const last = await game.snapshot();
      if (last.run.challengeCount < 5) return FAIL(`challengeCount below P1 representative minimum: ${last.run.challengeCount}`);
      if (seenTypes.size < 4) return FAIL(`representative scenarios collapsed to too few challenge types: ${Array.from(seenTypes).join(',')}`);
      return PASS('representative scenarios are legal, triggerable, and diverse');
    }
  },
  {
    id: 'p2-02-shop-purchase-rejection-and-blocking',
    level: 'P2',
    name: 'Shop panel blocks shooting and enforces coin ownership invariants',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset({ clearPersistence: true });
      const shop = await game.loadScenario('shop_open_ready');
      const shape = assertContractShape(shop);
      if (shape) return FAIL(shape);
      if (shop.phase !== 'panel' || !shop.shop.visible || shop.activePanel !== 'shop') return FAIL('shop scenario did not open the shop panel');
      if (shop.canShoot) return FAIL('shop panel allows shooting');
      const runBefore = cloneRun(shop);
      await game.realTouchTapPlayfield(shop);
      const afterTouch = await game.snapshot();
      if (!sameRun(runBefore, afterTouch)) return FAIL('real touch on playfield mutated run while shop was open');
      const selected = await game.contractInput({ type: 'selectShopItem', item: 'unownedExpensive' });
      if (!selected.shop.visible || selected.shop.selectedItem !== 'unownedExpensive') return FAIL('expensive unowned shop item was not selected');
      if (selected.shop.selectedOwned || selected.shop.selectedAffordable) return FAIL('unowned-expensive selection did not expose unowned unaffordable state');
      const coinsBefore = selected.run.coins;
      const rejected = await game.contractInput({ type: 'buySelected' });
      if (selected.shop.selectedAffordable === false && (!rejected.lastAction || rejected.lastAction.ok !== false)) return FAIL('unaffordable purchase was not rejected');
      if (rejected.run.coins < 0) return FAIL('shop purchase made coins negative');
      if (rejected.run.coins > coinsBefore) return FAIL('rejected purchase increased coins');
      const equipRevisionBefore = selected.shop.equippedChangedRevision;
      const unownedEquip = await game.contractInput({ type: 'equipSelected' });
      if (!unownedEquip.lastAction || unownedEquip.lastAction.ok !== false) return FAIL('unowned shop item was equippable');
      if (unownedEquip.shop.equippedChangedRevision !== equipRevisionBefore) return FAIL('rejected unowned equip changed equipment revision');
      if (unownedEquip.run.coins !== coinsBefore) return FAIL('rejected unowned equip changed coins');
      const owned = await game.contractInput({ type: 'selectShopItem', item: 'owned' });
      if (!owned.shop.visible || !owned.shop.selectedOwned) return FAIL('owned shop item was not selected');
      const ownedCoinsBefore = owned.run.coins;
      const ownedPurchase = await game.contractInput({ type: 'buySelected' });
      if (!ownedPurchase.lastAction || ownedPurchase.lastAction.ok !== false) return FAIL('owned shop item was purchasable');
      if (ownedPurchase.run.coins !== ownedCoinsBefore) return FAIL('owned-item purchase changed coins');
      const closed = await game.contractInput({ type: 'closePanel', panel: 'shop' });
      if (closed.shop.visible || closed.phase === 'panel') return FAIL('closing shop did not return from panel state');
      if (!closed.canInteractWithPlayfield) return FAIL('closing shop did not restore playfield interaction');
      return PASS('shop blocked play, rejected invalid purchase, preserved coin invariants, and closed cleanly');
    }
  },
  {
    id: 'p2-03-settings-reset-confirmation-invariants',
    level: 'P2',
    name: 'API contract settings panel blocks shooting and protects persistence through confirmation',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const settings = await game.loadScenario('settings_open_ready');
      const shape = assertContractShape(settings);
      if (shape) return FAIL(shape);
      if (settings.phase !== 'panel' || !settings.settings.visible || settings.activePanel !== 'settings') return FAIL('settings scenario did not open settings panel');
      if (settings.canShoot) return FAIL('settings panel allows shooting');
      const before = cloneRun(settings);
      const toggled = await game.contractInput({ type: 'toggleSetting', setting: 'performance' });
      if (!(toggled.settings.presentationRevision > settings.settings.presentationRevision)) return FAIL('presentation toggle did not change presentation revision');
      const requested = await game.contractInput({ type: 'requestStorageReset' });
      if (!requested.settings.resetConfirmVisible && requested.activePanel !== 'resetConfirm') return FAIL('reset confirmation did not become visible');
      const canceled = await game.contractInput({ type: 'confirmStorageReset', confirm: false });
      if (canceled.settings.persistenceRevision !== requested.settings.persistenceRevision) return FAIL('canceling reset changed persistence revision');
      if (canceled.run.coins !== before.coins) return FAIL('canceling reset changed current coin summary');
      const staleConfirm = await game.contractInput({ type: 'confirmStorageReset', confirm: true });
      if (!staleConfirm.lastAction || staleConfirm.lastAction.ok !== false ||
          !sameRun(before, staleConfirm) ||
          staleConfirm.settings.persistenceRevision !== canceled.settings.persistenceRevision ||
          staleConfirm.settings.presentationRevision !== canceled.settings.presentationRevision) {
        return FAIL('confirming reset after cancellation mutated state without a new request');
      }
      const requestedAgain = await game.contractInput({ type: 'requestStorageReset' });
      if (!requestedAgain.settings.resetConfirmVisible && requestedAgain.activePanel !== 'resetConfirm') return FAIL('reset confirmation did not reopen after cancellation');
      const confirmed = await game.contractInput({ type: 'confirmStorageReset', confirm: true });
      const resetChangedPublicState =
        confirmed.settings.persistenceRevision !== canceled.settings.persistenceRevision ||
        confirmed.settings.presentationRevision !== canceled.settings.presentationRevision ||
        confirmed.run.coins !== canceled.run.coins;
      if (!resetChangedPublicState) return FAIL('confirming reset produced no observable persistence change');
      if (confirmed.run.coins < 0) return FAIL('confirmed reset produced negative coins');
      return PASS('settings blocked play, toggled presentation, and guarded persistence reset');
    }
  },
  {
    id: 'p2-04-leaderboard-local-play-recovery',
    level: 'P2',
    name: 'API contract leaderboard panel reaches legal state and releases local play after close',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const board = await game.loadScenario('leaderboard_open_ready');
      const shape = assertContractShape(board);
      if (shape) return FAIL(shape);
      if (board.phase !== 'panel' || !board.leaderboard.visible || board.activePanel !== 'leaderboard') return FAIL('leaderboard panel did not open');
      if (board.canShoot) return FAIL('leaderboard panel allows shooting');
      await game.wait('medium');
      const loaded = await game.snapshot();
      if (!enums.leaderboardStates.has(loaded.leaderboard.state)) return FAIL(`invalid leaderboard state ${loaded.leaderboard.state}`);
      const closed = await game.contractInput({ type: 'closePanel', panel: 'leaderboard' });
      if (closed.leaderboard.visible || closed.phase === 'panel') return FAIL('leaderboard close left panel active');
      if (!closed.canRestart && !closed.canInteractWithPlayfield) return FAIL('leaderboard close did not leave local play or restart available');
      return PASS(`leaderboard state ${loaded.leaderboard.state} did not trap local play`);
    }
  }
];

module.exports = { suite };
