// === GDD Coverage Map ===
// M1 Menu to mode flow -> p0-2-reset-title-contract, p0-3-visible-playfield-candy, p1-1-menu-mode-flow
// M2 One-button web input -> p1-2-real-mouse-touch-space-input, p1-6-hold-release-not-throttle, p1-16-pause-freeze-resume, p1-18-invalid-terminal-locks
// M3 Reachable lamp attachment -> p1-3-reachable-anchor-attach, p1-4-no-anchor-rejection, p1-7-forward-direction-semantics
// M4 Swing and release physics feel -> p1-5-swing-release-causality, p1-6-hold-release-not-throttle, p1-7-forward-direction-semantics
// M5 Candy collection and score -> p1-8-candy-collection-loop, p2-5-reward-value-feedback
// M6 Candy target progression -> p1-9-candy-target-win-lock, p1-10-low-fall-failure
// M7 Endless score chase -> p1-11-endless-no-finite-win
// M8 Race mode -> p1-12-race-timer-opponent, p1-13-race-terminal-order, p2-2-race-rescue-cost
// M9 Tutorial -> p1-14-tutorial-flow, p1-15-tutorial-failure-reset
// M10 Pause and restart state flow -> p1-16-pause-freeze-resume, p1-17-restart-return-cleanup
// M11 Terminal and invalid input locks -> p1-4-no-anchor-rejection, p1-9-candy-target-win-lock, p1-10-low-fall-failure, p1-13-race-terminal-order, p1-18-invalid-terminal-locks
// M12 Moving temporary hang points and rescue -> p2-1-moving-temporary-hangpoint, p2-2-race-rescue-cost
// M13 Atmosphere and feedback polish -> p2-3-atmosphere-nonblocking, p2-5-reward-value-feedback
// M14 Leaderboard or local results depth -> p2-4-results-depth
// === Category Map ===
// Boot & Stability -> p0-1-boot-contract-schema, p0-2-reset-title-contract, p0-3-visible-playfield-candy
// UI Flow & Blocking -> p1-1-menu-mode-flow, p1-14-tutorial-flow, p1-16-pause-freeze-resume, p1-17-restart-return-cleanup
// Input Semantics -> p1-2-real-mouse-touch-space-input, p1-6-hold-release-not-throttle, p1-7-forward-direction-semantics
// Core Mechanic Loop -> p1-3-reachable-anchor-attach, p1-5-swing-release-causality, p1-8-candy-collection-loop, p1-9-candy-target-win-lock, p1-10-low-fall-failure, p1-11-endless-no-finite-win, p1-12-race-timer-opponent
// State Machine -> p1-13-race-terminal-order, p1-15-tutorial-failure-reset, p1-18-invalid-terminal-locks
// Invariants & Rejection -> p1-4-no-anchor-rejection, p1-6-hold-release-not-throttle, p1-16-pause-freeze-resume, p1-18-invalid-terminal-locks
// Depth / Optional Systems -> p2-1-moving-temporary-hangpoint, p2-2-race-rescue-cost, p2-3-atmosphere-nonblocking, p2-4-results-depth, p2-5-reward-value-feedback
// === Rationality Map ===
// p1-1-menu-mode-flow: real action: contract chooseMenu/chooseMode as player menu actions | independent observation: phase/mode/overlayBlocking/canInteractWithPlayfield/HUD | empty-shell failure: menu labels without playable mode transition fail
// p1-2-real-mouse-touch-space-input: real action: browser.mouseClick, Input.dispatchMouseEvent, Input.dispatchTouchEvent, keyDown/keyUp Space | independent observation: web/player revisions after each real input family | empty-shell failure: API-only input or one-device input shells fail
// p1-3-reachable-anchor-attach: real action: loadScenario reachable_anchor then contract hold/press | independent observation: web visible/attached, anchor ahead, player shooting/swinging, render revision | empty-shell failure: ok-only attach or behind-target attach fails
// p1-4-no-anchor-rejection: real action: loadScenario no_reachable_anchor then press/hold | independent observation: web remains unattached, score/count/result stable, lastAction rejected or no-op | empty-shell failure: always-attach or press-to-score shells fail
// p1-5-swing-release-causality: real action: loadScenario attached_swing, wait held, release, wait | independent observation: attached arc motion, connection revision, free-flight/falling trend, render revision | empty-shell failure: labels-only movement, no detach, no gravity trend fail
// p1-6-hold-release-not-throttle: real action: hold while attached and release while idle | independent observation: hold preserves attachment without reward-only progress; idle release leaves score/result/web stable | empty-shell failure: hold-to-increment and release-as-jump shells fail
// p1-7-forward-direction-semantics: real action: attach to reachable anchor then release chain | independent observation: anchor ahead and Math.sign forward delta/progress direction opposite to backwards/no-switch behavior | empty-shell failure: mirrored/backwards or arbitrary anchor switching fails
// p1-8-candy-collection-loop: real action: collectible_route then normal press/hold/release/wait chain | independent observation: collectible revision/visible count plus score/count/HUD delta | empty-shell failure: pre-awarded score or HUD-unsynced shells fail
// p1-9-candy-target-win-lock: real action: near_goal_before_finish then legal swing chain and extra input | independent observation: win result, reachedGoal reason, result summary, terminal stats invariant | empty-shell failure: direct-win setup or unlocked win screen fails
// p1-10-low-fall-failure: real action: low_fall_risk then missed recovery/wait and post-result input | independent observation: fail result, fell reason, nonnegative final stats, terminal lock | empty-shell failure: no-failure or continuing-after-fail shells fail
// p1-11-endless-no-finite-win: real action: choose endless, swing/progress, then fall-risk failure | independent observation: no finite progress win, distance/score path, final fail summary | empty-shell failure: endless mapped to candy victory or no result feedback fails
// p1-12-race-timer-opponent: real action: race_midcourse wait and player swing chain | independent observation: timer/opponent progress advance and player progress responds to input | empty-shell failure: race skin with no opponent/timer fails
// p1-13-race-terminal-order: real action: race finish path through wait/movement and extra input | independent observation: single terminal result reason, time summary, locked final stats | empty-shell failure: double result or race continuing after finish fails
// p1-14-tutorial-flow: real action: choose tutorial, tutorialContinue, prompted press/release | independent observation: tutorial step/waiting prompt changes and completion/unblocked play | empty-shell failure: static instruction panel without practice fails
// p1-15-tutorial-failure-reset: real action: tutorial_start then miss/wait through failure risk | independent observation: practiceResetCount or teaching step reset while result remains none | empty-shell failure: tutorial ordinary game-over or unrecoverable lesson fails
// p1-16-pause-freeze-resume: real action: pause, wait, web input, resume | independent observation: timer/progress/score/player/web stable while paused and changes after resume | empty-shell failure: visual pause overlay that does not freeze fails
// p1-17-restart-return-cleanup: real action: restart and returnTitle from paused/result states | independent observation: fresh run summaries and title state with stale overlays cleared | empty-shell failure: stale web/candy/result/opponent state leaks fail
// p1-18-invalid-terminal-locks: real action: repeated press while attached and core input after terminal | independent observation: one web connection, same valid anchor, final stats/result invariant | empty-shell failure: accept-every-action or multi-web shells fail
// p2-1-moving-temporary-hangpoint: real action: optional temporary hangpoint scenario attach/wait/release | independent observation: target movement/time limit and visible detach if advertised | empty-shell failure: decorative advertised temporary target or permanent support fails
// p2-2-race-rescue-cost: real action: race_fall_risk missed recovery/wait | independent observation: rescueState progression with input blocked and momentum/time/progress cost | empty-shell failure: no-cost teleport or invisible rescue fails
// p2-3-atmosphere-nonblocking: real action: normal play idle wait and core action | independent observation: world/environment revisions while player/web/anchor/HUD remain readable | empty-shell failure: atmosphere blocking core observability/input fails
// p2-4-results-depth: real action: choose results or view post-run result path | independent observation: reachable/unavailable results reason and title/final-summary navigation invariants | empty-shell failure: external-service-only or trapping panel fails
// p2-5-reward-value-feedback: real action: optional multi-value collectible route | independent observation: nonnegative reward deltas and stronger/special feedback when advertised | empty-shell failure: advertised reward classes with identical/no feedback fail

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function PASS(detail) { return { status: 'PASS', detail }; }
function FAIL(detail) { return { status: 'FAIL', detail }; }
function NA(detail) { return { status: 'NOT_APPLICABLE', detail }; }

const PHASES = ['booting', 'title', 'modeSelect', 'tutorial', 'playing', 'paused', 'result'];
const MODES = ['none', 'candy', 'endless', 'race', 'tutorial'];
const RESULTS = ['none', 'win', 'fail'];
const WEB_STATES = ['idle', 'shooting', 'attached'];
const PLAYER_STATES = ['falling', 'flying', 'shooting', 'swinging', 'rescued', 'celebrating', 'inactive'];

function num(v, fallback = null) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function nonneg(v) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

function stableStats(s) {
  return {
    phase: s && s.phase,
    mode: s && s.mode,
    result: s && s.result,
    resultReason: s && s.resultReason,
    score: s && s.hud && s.hud.score,
    collectedCount: s && s.collectibles && s.collectibles.collectedCount,
    hudCollected: s && s.hud && s.hud.collectedCount,
    progress: s && s.hud && s.hud.progress,
    distance: s && s.hud && s.hud.distance,
    timerMs: s && s.hud && s.hud.timerMs,
    playerX: s && s.player && s.player.screenX,
    playerY: s && s.player && s.player.screenY,
    worldProgress: s && s.player && s.player.worldProgress,
    webState: s && s.web && s.web.state,
    webRevision: s && s.web && s.web.connectionRevision
  };
}

function sameCoreStats(a, b) {
  const keys = ['result', 'resultReason', 'score', 'collectedCount', 'hudCollected'];
  return keys.every(k => JSON.stringify(a[k]) === JSON.stringify(b[k]));
}

function hasAction(s, name) {
  return Array.isArray(s && s.availableActions) && s.availableActions.includes(name);
}

function movementDelta(a, b) {
  return {
    dx: num(b && b.player && b.player.screenX, 0) - num(a && a.player && a.player.screenX, 0),
    dy: num(b && b.player && b.player.screenY, 0) - num(a && a.player && a.player.screenY, 0),
    progress: num(b && b.player && b.player.worldProgress, 0) - num(a && a.player && a.player.worldProgress, 0),
    distance: num(b && b.hud && b.hud.distance, 0) - num(a && a.hud && a.hud.distance, 0)
  };
}

function assertSnapshotShape(s, label) {
  if (!s || typeof s !== 'object') return `${label}: snapshot missing`;
  if (!PHASES.includes(s.phase)) return `${label}: invalid phase ${s.phase}`;
  if (!MODES.includes(s.mode)) return `${label}: invalid mode ${s.mode}`;
  if (!RESULTS.includes(s.result)) return `${label}: invalid result ${s.result}`;
  if (typeof s.canInteractWithPlayfield !== 'boolean') return `${label}: canInteractWithPlayfield must be boolean`;
  if (typeof s.overlayBlocking !== 'boolean') return `${label}: overlayBlocking must be boolean`;
  if (!Array.isArray(s.availableActions)) return `${label}: availableActions must be array`;
  if (!s.hud || typeof s.hud !== 'object') return `${label}: hud missing`;
  if (!s.player || typeof s.player !== 'object') return `${label}: player missing`;
  if (!PLAYER_STATES.includes(s.player.state)) return `${label}: invalid player.state ${s.player.state}`;
  if (typeof s.player.visible !== 'boolean') return `${label}: player.visible must be boolean`;
  if (!s.web || typeof s.web !== 'object') return `${label}: web missing`;
  if (!WEB_STATES.includes(s.web.state)) return `${label}: invalid web.state ${s.web.state}`;
  if (!s.anchors || typeof s.anchors !== 'object') return `${label}: anchors missing`;
  if (!s.collectibles || typeof s.collectibles !== 'object') return `${label}: collectibles missing`;
  if (!s.world || typeof s.world !== 'object') return `${label}: world missing`;
  if (typeof s.world.playfieldReady !== 'boolean') return `${label}: world.playfieldReady must be boolean`;
  if (!nonneg(s.hud.score) || !nonneg(s.hud.collectedCount) || !nonneg(s.hud.distance)) return `${label}: hud numeric summaries must be nonnegative`;
  return null;
}

function createGameDriver(browser) {
  async function call(expr) {
    const result = await browser.eval(expr);
    if (result && result.__l2_err__) throw new Error(result.__l2_err__);
    return result;
  }

  return {
    async ensureContract() {
      return await call(`(function(){
        const api = window.__gameTest;
        return !!(api && typeof api.reset === 'function' && typeof api.input === 'function' &&
          typeof api.getSnapshot === 'function' && typeof api.loadScenario === 'function');
      })()`);
    },
    async snapshot() {
      return await call(`Promise.resolve(window.__gameTest.getSnapshot())`);
    },
    async reset(options) {
      return await call(`Promise.resolve(window.__gameTest.reset(${JSON.stringify(options || {})}))`);
    },
    async input(action) {
      return await call(`Promise.resolve(window.__gameTest.input(${JSON.stringify(action)}))`);
    },
    async loadScenario(name, options) {
      return await call(`Promise.resolve(window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})}))`);
    },
    async wait(durationMs) {
      const s = await this.input({ type: 'wait', durationMs });
      await browser.sleep(Math.min(durationMs, 250));
      return s;
    },
    async playfieldPoint() {
      const point = await browser.eval(`(function(){
        const snap = window.__gameTest && window.__gameTest.getSnapshot ? window.__gameTest.getSnapshot() : null;
        if (snap && snap.world && snap.world.playfieldBounds) {
          const b = snap.world.playfieldBounds;
          const left = Number(b.left != null ? b.left : b.x);
          const top = Number(b.top != null ? b.top : b.y);
          const width = Number(b.width != null ? b.width : (b.w != null ? b.w : b.right - left));
          const height = Number(b.height != null ? b.height : (b.h != null ? b.h : b.bottom - top));
          if (Number.isFinite(left) && Number.isFinite(top) && width > 0 && height > 0) {
            return { x: left + width * 0.5, y: top + height * 0.5 };
          }
        }
        return null;
      })()`);
      return point;
    },
    async startMode(mode) {
      await this.reset();
      let s = await this.input({ type: 'chooseMenu', target: 'start' });
      if (s.phase !== 'modeSelect' && s.phase !== 'playing') return s;
      s = await this.input({ type: 'chooseMode', mode });
      return s;
    },
    async chainSwing() {
      let s = await this.input({ type: 'press', control: 'primary' });
      s = await this.input({ type: 'hold', control: 'primary', durationMs: 450 });
      s = await this.wait(250);
      s = await this.input({ type: 'release', control: 'primary' });
      s = await this.wait(450);
      return s;
    }
  };
}

async function requireContractGame(browser) {
  const game = createGameDriver(browser);
  const ok = await game.ensureContract();
  if (!ok) return { game, error: 'window.__gameTest reset/input/getSnapshot/loadScenario contract missing' };
  return { game, error: null };
}

async function loadAndValidate(game, name, predicate) {
  const s = await game.loadScenario(name);
  const shape = assertSnapshotShape(s, `scenario ${name}`);
  if (shape) return { snapshot: s, error: shape };
  const pred = predicate ? predicate(s) : null;
  if (pred) return { snapshot: s, error: `scenario ${name} invalid precondition: ${pred}` };
  return { snapshot: s, error: null };
}

const suite = [
  {
    id: 'p0-1-boot-contract-schema',
    level: 'P0',
    name: 'Boot exposes the public snapshot contract',
    timeoutMs: 15000,
    async run({ browser }) {
      if (browser.exceptions.length) return FAIL(`fatal runtime exception: ${browser.exceptions[0].description || browser.exceptions[0].text}`);
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const s = await game.snapshot();
      const shape = assertSnapshotShape(s, 'boot');
      if (shape) return FAIL(shape);
      return PASS(`phase=${s.phase}, mode=${s.mode}, result=${s.result}`);
    }
  },
  {
    id: 'p0-2-reset-title-contract',
    level: 'P0',
    name: 'Reset returns to a non-playing title state',
    timeoutMs: 12000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const s = await game.reset();
      const shape = assertSnapshotShape(s, 'reset');
      if (shape) return FAIL(shape);
      if (s.phase !== 'title' && s.phase !== 'modeSelect') return FAIL(`reset should show title/menu, got ${s.phase}`);
      if (s.mode !== 'none') return FAIL(`reset should clear mode, got ${s.mode}`);
      if (s.result !== 'none' || s.web.state !== 'idle') return FAIL('reset left result or web state active');
      if (!s.overlayBlocking || s.canInteractWithPlayfield) return FAIL('title/menu must block playfield input');
      if (!hasAction(s, 'start')) return FAIL('start action not available after reset');
      return PASS('reset cleared transient run state and exposed start');
    }
  },
  {
    id: 'p0-3-visible-playfield-candy',
    level: 'P0',
    name: 'Candy mode exposes visible playable world summaries',
    timeoutMs: 15000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const s = await game.startMode('candy');
      const shape = assertSnapshotShape(s, 'candy mode');
      if (shape) return FAIL(shape);
      if (s.phase !== 'playing' || s.mode !== 'candy') return FAIL(`expected playing candy mode, got ${s.phase}/${s.mode}`);
      if (s.overlayBlocking || !s.canInteractWithPlayfield) return FAIL('playfield remains blocked in candy mode');
      if (!s.world.playfieldReady || !s.player.visible) return FAIL('playfield or player not observable');
      if (num(s.anchors.visibleCount, 0) < 1 && num(s.anchors.reachableForwardCount, 0) < 1) return FAIL('no visible or reachable anchor summary in candy mode');
      if (s.world.renderRevision == null) return FAIL('renderRevision missing for visible playfield evidence');
      return PASS('playfield ready with player, anchors, HUD, and render summary');
    }
  },
  {
    id: 'p1-1-menu-mode-flow',
    level: 'P1',
    name: 'Menu mode flow enters candy, endless, and race play',
    timeoutMs: 25000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const modes = ['candy', 'endless', 'race'];
      for (const mode of modes) {
        const s = await game.startMode(mode);
        const shape = assertSnapshotShape(s, mode);
        if (shape) return FAIL(shape);
        if (s.phase !== 'playing' || s.mode !== mode) return FAIL(`${mode} did not enter playing mode: ${s.phase}/${s.mode}`);
        if (s.overlayBlocking || !s.canInteractWithPlayfield) return FAIL(`${mode} playfield is blocked`);
        if (mode === 'race' && (!s.race || typeof s.race !== 'object')) return FAIL('race mode missing race summary');
      }
      return PASS('all three declared modes become playable through semantic menu actions');
    }
  },
  {
    id: 'p1-2-real-mouse-touch-space-input',
    level: 'P1',
    name: 'Real mouse, touch, and Space input drive the primary web action',
    timeoutMs: 30000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);

      let setup = await loadAndValidate(game, 'reachable_anchor', s => {
        if (s.phase !== 'playing') return 'not playing';
        if (!s.canInteractWithPlayfield || s.overlayBlocking) return 'playfield blocked';
        if (s.web.state !== 'idle') return 'web not idle';
        if (num(s.anchors.reachableForwardCount, 0) < 1) return 'no reachable forward anchor';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const playPoint = await game.playfieldPoint();
      if (!playPoint) return FAIL('real mouse web input requires public runtime world.playfieldBounds');
      await browser.mouseClick(playPoint.x, playPoint.y);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: playPoint.x, y: playPoint.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(260);
      let afterMouse = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: playPoint.x, y: playPoint.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(160);
      if (!['shooting', 'attached'].includes(afterMouse.web.state) && !['shooting', 'swinging'].includes(afterMouse.player.state)) {
        return FAIL(`mouse input did not start web action, web=${afterMouse.web.state}, player=${afterMouse.player.state}`);
      }

      setup = await loadAndValidate(game, 'reachable_anchor', s => {
        if (s.phase !== 'playing' || s.web.state !== 'idle') return 'invalid touch precondition';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const touchPoint = await game.playfieldPoint();
      if (!touchPoint) return FAIL('real touch web input requires public runtime world.playfieldBounds');
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: touchPoint.x, y: touchPoint.y, radiusX: 4, radiusY: 4, force: 1, id: 7 }],
        modifiers: 0
      });
      await browser.sleep(260);
      let afterTouch = await game.snapshot();
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], modifiers: 0 });
      await browser.sleep(160);
      if (!['shooting', 'attached'].includes(afterTouch.web.state) && !['shooting', 'swinging'].includes(afterTouch.player.state)) {
        return FAIL(`touch input did not start web action, web=${afterTouch.web.state}, player=${afterTouch.player.state}`);
      }

      setup = await loadAndValidate(game, 'reachable_anchor', s => {
        if (s.phase !== 'playing' || s.web.state !== 'idle') return 'invalid Space precondition';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      await browser.keyDown('Space');
      await browser.sleep(260);
      const afterSpace = await game.snapshot();
      await browser.keyUp('Space');
      await browser.sleep(160);
      if (!['shooting', 'attached'].includes(afterSpace.web.state) && !['shooting', 'swinging'].includes(afterSpace.player.state)) {
        return FAIL(`Space input did not start web action, web=${afterSpace.web.state}, player=${afterSpace.player.state}`);
      }
      return PASS('mouse, touch, and Space all trigger observable primary web state');
    }
  },
  {
    id: 'p1-3-reachable-anchor-attach',
    level: 'P1',
    name: 'Reachable forward anchor attaches and becomes visible web',
    timeoutMs: 20000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'reachable_anchor', s => {
        if (s.web.state !== 'idle') return 'web not idle';
        if (num(s.anchors.reachableForwardCount, 0) < 1 || !s.anchors.nearestReachable) return 'no semantic reachable anchor';
        if (s.result !== 'none') return 'terminal before trigger';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const before = setup.snapshot;
      let after = await game.input({ type: 'press', control: 'primary' });
      after = await game.input({ type: 'hold', control: 'primary', durationMs: 350 });
      if (!['shooting', 'attached'].includes(after.web.state)) return FAIL(`web did not shoot/attach: ${after.web.state}`);
      if (!after.web.visible) return FAIL('web not visible after reachable attach action');
      if (after.web.state === 'attached' && after.web.anchorAhead !== true) return FAIL('attached anchor is not marked ahead');
      if (!['shooting', 'swinging'].includes(after.player.state)) return FAIL(`player did not enter shooting/swinging: ${after.player.state}`);
      if (after.web.connectionRevision === before.web.connectionRevision && after.world.renderRevision === before.world.renderRevision) {
        return FAIL('no web/render revision changed after attach');
      }
      return PASS(`web=${after.web.state}, player=${after.player.state}, anchorAhead=${after.web.anchorAhead}`);
    }
  },
  {
    id: 'p1-4-no-anchor-rejection',
    level: 'P1',
    name: 'No reachable anchor rejects attachment without reward side effects',
    timeoutMs: 18000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'no_reachable_anchor', s => {
        if (s.phase !== 'playing' || s.result !== 'none') return 'not active play';
        if (num(s.anchors.reachableForwardCount, 0) !== 0) return 'reachable anchor is present';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const before = setup.snapshot;
      const after = await game.input({ type: 'press', control: 'primary' });
      const later = await game.wait(250);
      if (after.web.state === 'attached' || later.web.state === 'attached') return FAIL('web attached despite no reachable anchor');
      if (after.result !== before.result) return FAIL('press without anchor changed result');
      const naturalFall = later.result === 'fail' &&
        later.resultReason === 'fell' &&
        (after.player.state === 'falling' || after.player.state === 'flying');
      if (later.result !== before.result && !naturalFall) return FAIL('no-anchor wait changed result unexpectedly');
      if (later.hud.score !== before.hud.score || later.collectibles.collectedCount !== before.collectibles.collectedCount) {
        return FAIL('press without anchor changed reward summaries');
      }
      const progressJump = num(later.player.worldProgress, 0) - num(before.player.worldProgress, 0);
      // worldProgress is a distance summary, not a normalized [0, 1] value.
      // A short wait may legitimately advance a player that was already flying;
      // only flag progress that is disproportionate to the reported motion.
      const elapsedSeconds = 0.25;
      const maxSpeed = Math.max(
        Math.abs(num(before.player.speedX, 0)),
        Math.abs(num(later.player.speedX, 0))
      );
      const naturalProgressBound = maxSpeed * elapsedSeconds * 4;
      if (progressJump > naturalProgressBound) return FAIL('no-anchor press caused teleport or disproportionate progress jump');
      const last = later.lastAction || after.lastAction || {};
      if (last.accepted === true && last.ok === true && after.web.state !== 'idle') return FAIL('no-anchor action was accepted with a non-idle web');
      return PASS('no-anchor press was rejected or state-equivalent no-op with rewards invariant');
    }
  },
  {
    id: 'p1-5-swing-release-causality',
    level: 'P1',
    name: 'Swing hold and release produce arc, detach, and falling trend',
    timeoutMs: 24000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'attached_swing', s => {
        if (s.web.state !== 'attached' || !s.web.visible) return 'not attached';
        if (s.player.state !== 'swinging') return 'not swinging';
        if (s.result !== 'none') return 'terminal before release';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const before = setup.snapshot;
      const mid = await game.wait(420);
      const arc = movementDelta(before, mid);
      const playerPositionArc = Math.abs(arc.dx) + Math.abs(arc.dy);
      if (mid.web.state !== 'attached' || !mid.web.visible) return FAIL('web did not remain attached during hold');
      if (playerPositionArc < 4) {
        return FAIL('attached wait did not show player position swing motion');
      }
      const released = await game.input({ type: 'release', control: 'primary' });
      const free1 = await game.wait(260);
      const free2 = await game.wait(420);
      if (released.web.state !== 'idle' && free1.web.state !== 'idle') return FAIL('release did not detach web');
      if (!['flying', 'falling'].includes(free1.player.state)) return FAIL(`after release player state is ${free1.player.state}`);
      if (free1.web.connectionRevision === mid.web.connectionRevision && free1.world.renderRevision === mid.world.renderRevision) {
        return FAIL('release did not change web/render revision');
      }
      const fallTrend = num(free2.player.screenY, 0) - num(free1.player.screenY, 0);
      const speedTrend = num(free2.player.speedY, 0) - num(free1.player.speedY, 0);
      if (!(fallTrend > -2 || speedTrend > 0)) return FAIL('free flight did not show downward/gravity trend after release');
      return PASS(`arc dx=${arc.dx.toFixed(1)}, dy=${arc.dy.toFixed(1)}, fallTrend=${fallTrend.toFixed(1)}`);
    }
  },
  {
    id: 'p1-6-hold-release-not-throttle',
    level: 'P1',
    name: 'Holding is attachment control, idle release is no-op',
    timeoutMs: 22000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let setup = await loadAndValidate(game, 'attached_swing', s => s.web.state === 'attached' ? null : 'not attached');
      if (setup.error) return FAIL(setup.error);
      const beforeHold = setup.snapshot;
      const afterHold = await game.input({ type: 'hold', control: 'primary', durationMs: 500 });
      if (afterHold.web.state !== 'attached') return FAIL('hold did not maintain attachment while swinging');
      const scoreDelta = num(afterHold.hud.score, 0) - num(beforeHold.hud.score, 0);
      const countDelta = num(afterHold.collectibles.collectedCount, 0) - num(beforeHold.collectibles.collectedCount, 0);
      const collectibleRevisionChanged = afterHold.collectibles.revision !== beforeHold.collectibles.revision;
      const playerMotion = Math.abs(num(afterHold.player.screenX, 0) - num(beforeHold.player.screenX, 0))
        + Math.abs(num(afterHold.player.screenY, 0) - num(beforeHold.player.screenY, 0));
      const forwardProgress = Math.max(
        0,
        num(afterHold.player.worldProgress, 0) - num(beforeHold.player.worldProgress, 0),
        num(afterHold.hud.distance, 0) - num(beforeHold.hud.distance, 0)
      );
      if (countDelta > 0 && !collectibleRevisionChanged) {
        return FAIL('hold changed collection count without collectible evidence');
      }
      if (scoreDelta > 0 && !collectibleRevisionChanged && playerMotion < 1 && forwardProgress <= 0) {
        return FAIL('hold appears to reward without collectible or movement evidence');
      }

      setup = await loadAndValidate(game, 'no_reachable_anchor', s => s.web.state === 'idle' ? null : 'web not idle');
      if (setup.error) return FAIL(setup.error);
      const beforeRelease = setup.snapshot;
      const afterRelease = await game.input({ type: 'release', control: 'primary' });
      const dx = Math.abs(num(afterRelease.player.screenX, 0) - num(beforeRelease.player.screenX, 0));
      const dy = Math.abs(num(afterRelease.player.screenY, 0) - num(beforeRelease.player.screenY, 0));
      if (afterRelease.web.state !== 'idle') return FAIL('idle release changed web state');
      if (afterRelease.hud.score !== beforeRelease.hud.score || afterRelease.result !== beforeRelease.result) return FAIL('idle release changed score or result');
      if (dx > 120 || dy > 120) return FAIL('idle release created a jump/teleport');
      return PASS('hold preserves swing without reward-only throttle; idle release is stable');
    }
  },
  {
    id: 'p1-7-forward-direction-semantics',
    level: 'P1',
    name: 'Forward direction semantics use ahead anchors and positive progress',
    timeoutMs: 22000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'reachable_anchor', s => {
        if (!s.anchors.nearestReachable) return 'missing nearestReachable';
        if (s.anchors.nearestReachable.ahead !== true) return 'nearest anchor not ahead';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const before = setup.snapshot;
      const anchorX = num(before.anchors.nearestReachable.screenX);
      const playerX = num(before.player.screenX);
      if (anchorX !== null && playerX !== null && anchorX <= playerX) return FAIL('reachable anchor is not forward in screen space');
      await game.input({ type: 'press', control: 'primary' });
      const attached = await game.wait(360);
      const repeatPress = await game.input({ type: 'press', control: 'primary' });
      const released = await game.input({ type: 'release', control: 'primary' });
      const after = await game.wait(500);
      const delta = movementDelta(before, after);
      const forwardEvidence = delta.progress > 0 || delta.distance > 0 || num(after.player.speedX, 0) > 0;
      const directionOpposite = Math.sign(num(after.player.worldProgress, 0) - num(before.player.worldProgress, 0)) >= 0;
      if (!forwardEvidence || !directionOpposite) return FAIL(`no forward progress after legal release chain, delta=${JSON.stringify(delta)}`);
      if (attached.web.state === 'attached') {
        const repeatRejected = repeatPress.lastAction && repeatPress.lastAction.accepted === false;
        const connectionStable = repeatPress.web.state === 'attached' &&
          repeatPress.web.connectionRevision === attached.web.connectionRevision;
        if (!repeatRejected || !connectionStable) {
          return FAIL('repeated press changed or recreated the attached connection');
        }
      }
      if (released.web.state !== 'idle' && after.web.state !== 'idle') return FAIL('release did not detach forward anchor');
      return PASS('direction opposite risk covered: ahead anchor plus positive progress and no behind-anchor switch');
    }
  },
  {
    id: 'p1-8-candy-collection-loop',
    level: 'P1',
    name: 'Candy collection changes collectible and reward summaries',
    timeoutMs: 26000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'collectible_route', s => {
        if (s.phase !== 'playing') return 'not playing';
        if (num(s.collectibles.visibleCount, 0) < 1 && !s.collectibles.nearest) return 'no collectible route';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const before = setup.snapshot;
      let after = before;
      const rewardChanged = s =>
        num(s.collectibles.collectedCount, 0) > num(before.collectibles.collectedCount, 0) ||
        num(s.hud.score, 0) > num(before.hud.score, 0);
      const collectibleChanged = s =>
        s.collectibles.visibleCount !== before.collectibles.visibleCount ||
        s.collectibles.revision !== before.collectibles.revision;
      const collectibleDistance = s => {
        const p = s && s.player;
        const c = s && s.collectibles && s.collectibles.nearest;
        const values = [
          num(p && p.screenX, null),
          num(p && p.screenY, null),
          num(c && c.screenX, null),
          num(c && c.screenY, null),
        ];
        return values.every(v => v !== null)
          ? Math.hypot(values[2] - values[0], values[3] - values[1])
          : null;
      };
      for (let i = 0; i < 12 && after.phase === 'playing'; i++) {
        await game.input({ type: 'press', control: 'primary' });
        after = await game.input({ type: 'hold', control: 'primary', durationMs: 180 });
        let previousDistance = collectibleDistance(after);
        for (let sample = 0; sample < 10 && after.phase === 'playing'; sample++) {
          if (rewardChanged(after) && collectibleChanged(after)) break;
          const next = await game.wait(80);
          const nextDistance = collectibleDistance(next);
          const passedClosestPoint = after.web && after.web.state === 'attached' &&
            previousDistance !== null && nextDistance !== null && nextDistance > previousDistance;
          after = next;
          if (rewardChanged(after) && collectibleChanged(after)) break;
          if (passedClosestPoint) break;
          previousDistance = nextDistance;
        }
        if (rewardChanged(after) && collectibleChanged(after)) break;
        if (after.phase === 'playing') {
          after = await game.input({ type: 'release', control: 'primary' });
          after = await game.wait(300);
        }
      }
      const scoreDelta = num(after.hud.score, 0) - num(before.hud.score, 0);
      const countDelta = num(after.collectibles.collectedCount, 0) - num(before.collectibles.collectedCount, 0);
      const visibleChanged = after.collectibles.visibleCount !== before.collectibles.visibleCount || after.collectibles.revision !== before.collectibles.revision;
      if (!(scoreDelta > 0 || countDelta > 0)) return FAIL('movement through collectible route did not increase score or collected count');
      if (!visibleChanged) return FAIL('collectible reward changed without collectible disappearance/revision evidence');
      if (after.hud.collectedCount !== after.collectibles.collectedCount) return FAIL('HUD collected count does not match snapshot collectibles count');
      return PASS(`scoreDelta=${scoreDelta}, countDelta=${countDelta}`);
    }
  },
  {
    id: 'p1-9-candy-target-win-lock',
    level: 'P1',
    name: 'Candy target win is player-driven and locks input',
    timeoutMs: 30000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'near_goal_before_finish', s => {
        if (s.phase !== 'playing' || s.mode !== 'candy' || s.result !== 'none' ||
            !s.canInteractWithPlayfield) return 'not a playable non-terminal candy prefinish';
        if (!(s.hud.progress === null || num(s.hud.progress, 0) < 1)) return 'progress already complete';
        if (!s.web || s.web.state !== 'idle') return 'web already active before player input';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      let webInteractionObserved = false;
      let acceptedPlayerActionObserved = false;
      let movementObserved = false;
      function observeTransition(before, after, actionIssued) {
        const accepted = Boolean(actionIssued && after && after.lastAction && after.lastAction.accepted);
        if (accepted) acceptedPlayerActionObserved = true;
        const activeWeb = Boolean(after && after.web &&
          (after.web.state === 'shooting' || after.web.state === 'attached'));
        const beforeRevision = num(before && before.web && before.web.connectionRevision, null);
        const afterRevision = num(after && after.web && after.web.connectionRevision, null);
        const revisionChanged = beforeRevision !== null && afterRevision !== null &&
          afterRevision !== beforeRevision;
        const webTransition = activeWeb || revisionChanged;
        if (acceptedPlayerActionObserved && webTransition) webInteractionObserved = true;
        const delta = movementDelta(before, after);
        if (webTransition && (Math.abs(delta.dx) > 0 || Math.abs(delta.dy) > 0 ||
            delta.progress > 0 || delta.distance > 0)) {
          movementObserved = true;
        }
      }
      function sameTerminalStats(a, b) {
        return sameCoreStats(a, b) &&
          ['phase', 'mode', 'progress', 'distance', 'timerMs', 'worldProgress',
            'webState', 'webRevision'].every(k => JSON.stringify(a[k]) === JSON.stringify(b[k]));
      }
      async function adaptiveGoalSwing() {
        let before = setup.snapshot;
        let s = await game.input({ type: 'hold', control: 'primary', durationMs: 180 });
        observeTransition(before, s, true);
        let attachedSamples = 0;
        for (let i = 0; i < 18 && s.phase !== 'result'; i++) {
          if (s.web.state === 'attached') {
            attachedSamples += 1;
            const movingForward = num(s.player.speedX, 0) > 0;
            const movingUpward = num(s.player.speedY, 0) < 0;
            if (attachedSamples > 1 && movingForward && movingUpward) break;
          } else if (s.web.state !== 'shooting') {
            break;
          }
          before = s;
          s = await game.wait(80);
          observeTransition(before, s, false);
        }
        if (s.phase !== 'result' && s.web.state === 'attached') {
          before = s;
          s = await game.input({ type: 'release', control: 'primary' });
          observeTransition(before, s, true);
        }
        if (s.phase !== 'result') {
          before = s;
          s = await game.wait(450);
          observeTransition(before, s, false);
        }
        return s;
      }
      let after = setup.snapshot;
      for (let i = 0; i < 5 && after.phase !== 'result'; i++) after = await adaptiveGoalSwing();
      if (after.phase !== 'result' || after.result !== 'win') return FAIL(`goal chain did not produce win result: ${after.phase}/${after.result}`);
      if (after.resultReason !== 'reachedGoal') return FAIL(`wrong win reason: ${after.resultReason}`);
      if (!webInteractionObserved || !movementObserved) return FAIL('goal chain did not establish observable player-driven web movement');
      if (after.canInteractWithPlayfield) return FAIL('canInteractWithPlayfield still true after win');
      if (!after.hud.resultSummaryVisible) return FAIL('win result summary not visible in HUD snapshot');
      const finalStats = stableStats(after);
      await game.input({ type: 'press', control: 'primary' });
      await game.input({ type: 'release', control: 'primary' });
      const lockedSnapshot = await game.wait(250);
      const locked = stableStats(lockedSnapshot);
      if (!sameTerminalStats(finalStats, locked) || locked.result !== 'win' ||
          !lockedSnapshot.hud.resultSummaryVisible) return FAIL('terminal web input changed win result or final stats');
      return PASS('player-driven goal win reached and terminal lock preserved final summary');
    }
  },
  {
    id: 'p1-10-low-fall-failure',
    level: 'P1',
    name: 'Low fall risk produces fail result and terminal lock',
    timeoutMs: 30000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'low_fall_risk', s => {
        if (s.phase !== 'playing' || s.result !== 'none') return 'not non-terminal play';
        if (s.mode === 'race') return 'race scenario not valid for low_fall_risk';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      let after = setup.snapshot;
      for (let i = 0; i < 8 && after.phase !== 'result'; i++) after = await game.wait(500);
      if (after.phase !== 'result' || after.result !== 'fail') return FAIL(`fall risk did not fail: ${after.phase}/${after.result}`);
      if (after.resultReason !== 'fell') return FAIL(`wrong fail reason: ${after.resultReason}`);
      if (!after.hud.resultSummaryVisible || after.canInteractWithPlayfield) return FAIL('fail summary not visible or input not locked');
      if (!nonneg(after.hud.score) || !nonneg(after.collectibles.collectedCount)) return FAIL('final fail stats are negative or missing');
      const finalStats = stableStats(after);
      await game.input({ type: 'press', control: 'primary' });
      const locked = stableStats(await game.input({ type: 'release', control: 'primary' }));
      if (!sameCoreStats(finalStats, locked) || locked.result !== 'fail') return FAIL('terminal web input changed fail stats/result');
      return PASS('fall failure visible with nonnegative final stats and input lock');
    }
  },
  {
    id: 'p1-11-endless-no-finite-win',
    level: 'P1',
    name: 'Endless mode scores distance without finite win',
    timeoutMs: 32000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.startMode('endless');
      if (s.phase !== 'playing' || s.mode !== 'endless') return FAIL(`could not enter endless: ${s.phase}/${s.mode}`);
      if (s.hud.progress !== null) return FAIL('endless should not expose finite destination progress');
      const before = s;
      for (let i = 0; i < 3; i++) s = await game.chainSwing();
      if (s.result === 'win') return FAIL('endless produced finite win during ordinary progress');
      const delta = movementDelta(before, s);
      if (delta.distance < 0 || num(s.hud.score, 0) < num(before.hud.score, 0)) return FAIL('endless distance/score regressed during play');
      const risk = await game.loadScenario('low_fall_risk');
      if (risk.mode === 'race') return FAIL('low_fall_risk returned race mode for endless/fail path');
      let fail = risk;
      for (let i = 0; i < 8 && fail.phase !== 'result'; i++) fail = await game.wait(500);
      if (fail.phase !== 'result' || fail.result !== 'fail' || !fail.hud.resultSummaryVisible) return FAIL('endless/fall path did not show final fail summary');
      return PASS('endless avoids finite win and reaches visible final result on fall');
    }
  },
  {
    id: 'p1-12-race-timer-opponent',
    level: 'P1',
    name: 'Race timer, opponent, and player progress are observable',
    timeoutMs: 26000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'race_midcourse', s => {
        if (s.phase !== 'playing' || s.mode !== 'race') return 'not race playing';
        if (!s.race) return 'race summary missing';
        if (s.result !== 'none') return 'race already terminal';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const before = setup.snapshot;
      const waited = await game.wait(700);
      if (!waited.race || !nonneg(waited.race.timerMs)) return FAIL('race timer missing after wait');
      if (num(waited.race.timerMs, 0) <= num(before.race.timerMs, 0)) return FAIL('race timer did not advance while playing');
      if (num(waited.race.opponentProgress, 0) === num(before.race.opponentProgress, 0) && waited.race.opponentDirection === 'unknown') {
        return FAIL('opponent progress/direction did not provide race evidence');
      }
      const afterInput = await game.chainSwing();
      if (!afterInput.race) return FAIL('race summary disappeared after player input');
      if (!nonneg(before.player && before.player.worldProgress) || !nonneg(afterInput.player && afterInput.player.worldProgress)) {
        return FAIL('player world progress missing after swing input');
      }
      if (afterInput.player.worldProgress < before.player.worldProgress) return FAIL('player world progress regressed after swing input');
      const rescueActive = [before.race.rescueState, afterInput.race.rescueState]
        .some(state => state && state !== 'none');
      if (!rescueActive && num(afterInput.race.playerProgress, 0) < num(before.race.playerProgress, 0)) {
        return FAIL('player race progress regressed after swing input');
      }
      if (afterInput.hud.timerMs !== null && Math.abs(num(afterInput.hud.timerMs, 0) - num(afterInput.race.timerMs, 0)) > 1000) {
        return FAIL('race HUD timer does not agree with race summary');
      }
      return PASS('timer, opponent progress, and player input progress are observable');
    }
  },
  {
    id: 'p1-13-race-terminal-order',
    level: 'P1',
    name: 'Race terminal order creates one locked result',
    timeoutMs: 36000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.loadScenario('race_midcourse');
      const shape = assertSnapshotShape(s, 'race terminal setup');
      if (shape) return FAIL(shape);
      if (s.mode !== 'race' || s.result !== 'none') return FAIL('race terminal setup not a non-terminal race');
      const deadline = Date.now() + 30000;
      let turn = 0;
      while (s.phase !== 'result' && Date.now() < deadline) {
        s = turn++ % 2 === 0 ? await game.chainSwing() : await game.wait(800);
      }
      if (s.phase !== 'result') return FAIL('race did not reach terminal result from legal wait/movement path');
      if (!['win', 'fail'].includes(s.result) || !['playerWon', 'opponentWon'].includes(s.resultReason)) {
        return FAIL(`invalid race terminal result: ${s.result}/${s.resultReason}`);
      }
      if (s.canInteractWithPlayfield || !s.hud.resultSummaryVisible) return FAIL('race result did not lock input or show summary');
      const finalStats = stableStats(s);
      await game.input({ type: 'press', control: 'primary' });
      const locked = stableStats(await game.wait(300));
      if (locked.result !== finalStats.result || locked.resultReason !== finalStats.resultReason || locked.timerMs !== finalStats.timerMs) {
        return FAIL('race terminal result or time changed after core input');
      }
      return PASS(`race terminal ${s.resultReason} locked final state`);
    }
  },
  {
    id: 'p1-14-tutorial-flow',
    level: 'P1',
    name: 'Tutorial advances through prompted web practice',
    timeoutMs: 36000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      await game.reset();
      let s = await game.input({ type: 'chooseMenu', target: 'tutorial' });
      if (s.phase !== 'tutorial' || s.mode !== 'tutorial' || !s.tutorial) return FAIL(`tutorial did not start: ${s.phase}/${s.mode}`);
      const tutorialWaitStates = ['continue', 'press', 'release', 'secondAttach', 'none'];
      if (!tutorialWaitStates.includes(s.tutorial.waitingFor)) return FAIL(`tutorial exposes unsupported waiting state: ${s.tutorial.waitingFor}`);
      if (!s.tutorial.promptVisible && s.tutorial.waitingFor === 'none') return FAIL('tutorial lacks visible prompt/waiting state');
      if (s.tutorial.waitingFor === 'continue') {
        s = await game.input({ type: 'tutorialContinue' });
        if (s.phase !== 'tutorial' || !s.tutorial) return FAIL('tutorial continue left tutorial flow');
        if (!tutorialWaitStates.includes(s.tutorial.waitingFor)) return FAIL(`tutorial exposes unsupported waiting state: ${s.tutorial.waitingFor}`);
      }
      if (s.tutorial.waitingFor !== 'press') return FAIL(`tutorial did not expose first web prompt: ${s.tutorial.waitingFor}`);
      const practiceStartStep = s.tutorial.step;
      s = await game.input({ type: 'press', control: 'primary' });
      if (!s.tutorial || !s.web || (s.web.state !== 'shooting' && s.web.state !== 'attached')) return FAIL('prompted press did not start web practice');
      if (!tutorialWaitStates.includes(s.tutorial.waitingFor)) return FAIL(`tutorial exposes unsupported waiting state: ${s.tutorial.waitingFor}`);
      s = await game.input({ type: 'hold', control: 'primary', durationMs: 450 });
      if (!s.tutorial || !s.web || s.web.state !== 'attached') return FAIL('prompted press did not reach an attached web');
      if (!tutorialWaitStates.includes(s.tutorial.waitingFor)) return FAIL(`tutorial exposes unsupported waiting state: ${s.tutorial.waitingFor}`);
      const attachedStep = s.tutorial.step;
      if (attachedStep === practiceStartStep && s.tutorial.waitingFor === 'press') return FAIL('attached web did not advance tutorial prompt');
      s = await game.input({ type: 'release', control: 'primary' });
      if (!s.tutorial && s.phase !== 'playing') return FAIL('tutorial summary disappeared before completion/play transition');
      if (s.tutorial && !tutorialWaitStates.includes(s.tutorial.waitingFor)) return FAIL(`tutorial exposes unsupported waiting state: ${s.tutorial.waitingFor}`);
      if (s.tutorial && s.web && s.web.state === 'attached') return FAIL('prompted release did not detach web');
      const advanced = s.phase === 'playing' || (s.tutorial && (s.tutorial.completed || attachedStep !== practiceStartStep || s.tutorial.step !== attachedStep));
      if (!advanced) return FAIL('tutorial did not advance after prompted press/release practice');
      if (s.tutorial && s.tutorial.completed && s.overlayBlocking && s.canInteractWithPlayfield) return FAIL('completed tutorial left contradictory blocking/playfield state');
      return PASS('tutorial prompt state advanced through real web practice actions');
    }
  },
  {
    id: 'p1-15-tutorial-failure-reset',
    level: 'P1',
    name: 'Tutorial failure resets practice instead of normal game-over',
    timeoutMs: 30000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      const setup = await loadAndValidate(game, 'tutorial_start', s => {
        if (s.phase !== 'tutorial' || !s.tutorial) return 'not tutorial precondition';
        return null;
      });
      if (setup.error) return FAIL(setup.error);
      const before = setup.snapshot;
      let after = before;
      for (let i = 0; i < 8; i++) {
        after = await game.wait(500);
        if (after.tutorial && (num(after.tutorial.practiceResetCount, 0) > num(before.tutorial.practiceResetCount, 0) || after.tutorial.step !== before.tutorial.step)) break;
      }
      if (after.result !== 'none') return FAIL('tutorial miss produced ordinary result state');
      if (after.phase !== 'tutorial' && !(after.tutorial && after.tutorial.completed)) return FAIL('tutorial miss left tutorial flow');
      const resetEvidence = after.tutorial && (num(after.tutorial.practiceResetCount, 0) > num(before.tutorial.practiceResetCount, 0) || after.tutorial.step <= before.tutorial.step);
      if (!resetEvidence) return FAIL('tutorial miss did not reset/hold a teaching point');
      return PASS('tutorial failure path remains instructional and non-terminal');
    }
  },
  {
    id: 'p1-16-pause-freeze-resume',
    level: 'P1',
    name: 'Pause freezes gameplay and resume unblocks play',
    timeoutMs: 26000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.startMode('race');
      if (s.phase !== 'playing') return FAIL('could not enter active play for pause');
      s = await game.input({ type: 'pause' });
      if (s.phase !== 'paused' || !s.overlayBlocking || s.canInteractWithPlayfield) return FAIL('pause did not block playfield');
      const frozen = stableStats(s);
      await game.wait(700);
      await game.input({ type: 'press', control: 'primary' });
      await game.input({ type: 'release', control: 'primary' });
      const still = stableStats(await game.snapshot());
      if (still.result !== frozen.result || still.score !== frozen.score || still.collectedCount !== frozen.collectedCount) {
        return FAIL('paused wait/input changed result or rewards');
      }
      if (Math.abs(num(still.timerMs, 0) - num(frozen.timerMs, 0)) > 50) return FAIL('race timer advanced while paused');
      s = await game.input({ type: 'resume' });
      if (s.phase !== 'playing' || s.overlayBlocking || !s.canInteractWithPlayfield) return FAIL('resume did not restore active play');
      const afterResume = await game.wait(500);
      if (afterResume.mode === 'race' && num(afterResume.hud.timerMs, 0) <= num(s.hud.timerMs, 0)) return FAIL('timer did not continue after resume');
      return PASS('pause freezes state and resume restores gameplay');
    }
  },
  {
    id: 'p1-17-restart-return-cleanup',
    level: 'P1',
    name: 'Restart and return title clear transient run state',
    timeoutMs: 26000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.loadScenario('paused_play');
      const shape = assertSnapshotShape(s, 'paused_play');
      if (shape) return FAIL(shape);
      if (s.phase !== 'paused') return FAIL('paused_play scenario did not create paused state');
      const restarted = await game.input({ type: 'restart' });
      if (restarted.phase !== 'playing') return FAIL(`restart did not begin fresh play: ${restarted.phase}`);
      if (restarted.result !== 'none' || restarted.web.state !== 'idle') return FAIL('restart left result or web active');
      if (num(restarted.hud.score, 0) < 0 || num(restarted.collectibles.collectedCount, 0) < 0) return FAIL('restart produced invalid rewards');
      if (restarted.overlayBlocking || !restarted.canInteractWithPlayfield) return FAIL('restart left blocking overlay');

      s = await game.loadScenario('paused_play');
      if (s.phase !== 'paused') return FAIL('second paused setup invalid');
      const title = await game.input({ type: 'returnTitle' });
      if (title.phase !== 'title' || title.mode !== 'none') return FAIL(`returnTitle did not clear to title: ${title.phase}/${title.mode}`);
      if (!title.overlayBlocking || title.canInteractWithPlayfield || title.result !== 'none' || title.web.state !== 'idle') {
        return FAIL('returnTitle left playfield/result/web active');
      }
      return PASS('restart creates fresh run and returnTitle clears to menu');
    }
  },
  {
    id: 'p1-18-invalid-terminal-locks',
    level: 'P1',
    name: 'Invalid repeated and terminal core inputs are locked',
    timeoutMs: 30000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let setup = await loadAndValidate(game, 'attached_swing', s => s.web.state === 'attached' ? null : 'not attached');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snapshot;
      const pressed = await game.input({ type: 'press', control: 'primary' });
      if (pressed.web.state !== 'attached') return FAIL('repeated press while attached broke attachment');
      if (pressed.web.connectionRevision !== before.web.connectionRevision && pressed.web.anchorScreenX !== before.web.anchorScreenX) {
        return FAIL('repeated press created a new connection/anchor without release');
      }
      if (pressed.hud.score !== before.hud.score || pressed.result !== before.result) return FAIL('repeated press changed rewards/result');

      setup = await loadAndValidate(game, 'low_fall_risk', s => s.result === 'none' ? null : 'already terminal');
      if (setup.error) return FAIL(setup.error);
      let terminal = setup.snapshot;
      for (let i = 0; i < 8 && terminal.phase !== 'result'; i++) terminal = await game.wait(500);
      if (terminal.phase !== 'result') return FAIL('could not establish terminal fail precondition');
      const finalStats = stableStats(terminal);
      await game.input({ type: 'press', control: 'primary' });
      await game.input({ type: 'hold', control: 'primary', durationMs: 250 });
      const locked = stableStats(await game.input({ type: 'release', control: 'primary' }));
      if (!sameCoreStats(finalStats, locked) || locked.webState !== finalStats.webState) return FAIL('terminal core input mutated final stats or web state');
      return PASS('invalid repeated press and terminal input preserve invariants');
    }
  },
  {
    id: 'p2-1-moving-temporary-hangpoint',
    level: 'P2',
    name: 'Optional moving temporary hang point is time-limited when advertised',
    timeoutMs: 24000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.loadScenario('reachable_anchor', { preferTemporary: true });
      const shape = assertSnapshotShape(s, 'temporary hangpoint setup');
      if (shape) return FAIL(shape);
      const advertised = s.anchors && (s.anchors.temporaryVisible || s.anchors.movingVisible || s.anchors.nearestReachable && s.anchors.nearestReachable.temporary);
      if (!advertised) return NA('optional temporary hang point not advertised by snapshot');
      const before = s;
      s = await game.input({ type: 'press', control: 'primary' });
      s = await game.input({ type: 'hold', control: 'primary', durationMs: 500 });
      if (s.web.state !== 'attached') return FAIL('advertised temporary hang point did not attach');
      const attachedX = num(s.web.anchorScreenX);
      const afterWait = await game.input({ type: 'hold', control: 'primary', durationMs: 2600 });
      const moved = attachedX !== null && num(afterWait.web.anchorScreenX) !== null && Math.abs(num(afterWait.web.anchorScreenX) - attachedX) > 3;
      const detached = afterWait.web.state === 'idle' || ['flying', 'falling'].includes(afterWait.player.state);
      if (!moved && afterWait.anchors.revision === before.anchors.revision) return FAIL('temporary hang point did not visibly move/revise');
      if (!detached) return FAIL('temporary hang point stayed permanent beyond its safe window');
      return PASS('advertised temporary hang point moves/revises and detaches after time limit');
    }
  },
  {
    id: 'p2-2-race-rescue-cost',
    level: 'P2',
    name: 'Race rescue has visible cost if implemented',
    timeoutMs: 30000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.loadScenario('race_fall_risk');
      const shape = assertSnapshotShape(s, 'race_fall_risk');
      if (shape) return FAIL(shape);
      if (s.mode !== 'race' || !s.race) return FAIL('race_fall_risk is not race mode');
      const before = s;
      for (let i = 0; i < 8; i++) {
        s = await game.wait(500);
        if (s.race && s.race.rescueState && s.race.rescueState !== 'none') break;
        if (s.phase === 'result') break;
      }
      if (s.phase === 'result') {
        if (!['win', 'fail'].includes(s.result)) return FAIL('race fall terminal path has invalid result');
        return NA('rescue absent; race followed terminal result path');
      }
      if (!s.race || s.race.rescueState === 'none') return NA('race rescue not implemented or not triggered');
      if (s.canInteractWithPlayfield) return FAIL('web input remains enabled during rescue');
      const later = await game.wait(1200);
      const progressCost = num(later.race.playerProgress, 0) <= num(before.race.playerProgress, 0) + 0.15;
      const timerCost = num(later.race.timerMs, 0) > num(before.race.timerMs, 0);
      if (!progressCost && !timerCost) return FAIL('rescue had no momentum/progress/time cost');
      return PASS(`rescueState=${later.race.rescueState}, timerCost=${timerCost}, progressCost=${progressCost}`);
    }
  },
  {
    id: 'p2-3-atmosphere-nonblocking',
    level: 'P2',
    name: 'Atmosphere feedback does not block core readability',
    timeoutMs: 22000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.loadScenario('attached_swing');
      const shape = assertSnapshotShape(s, 'attached_swing atmosphere setup');
      if (shape) return FAIL(shape);
      if (s.phase !== 'playing' || s.overlayBlocking || !s.canInteractWithPlayfield) {
        return FAIL('atmosphere setup did not provide active play');
      }
      const beforeEnv = s.world.environmentMotionRevision;
      s = await game.wait(1000);
      if (!s.player.visible || !s.world.playfieldReady) return FAIL('player/playfield became unreadable during atmosphere wait');
      if (!Number.isFinite(s.player.screenX) || !Number.isFinite(s.player.screenY)) return FAIL('player position became unreadable during atmosphere wait');
      if (num(s.anchors.visibleCount, 0) < 1 && num(s.anchors.reachableForwardCount, 0) < 1) return FAIL('anchors became unreadable during atmosphere wait');
      const afterAction = await game.input({ type: 'press', control: 'primary' });
      if (afterAction.overlayBlocking) return FAIL('atmosphere or overlay blocked core input');
      if (afterAction.world.environmentMotionRevision !== beforeEnv || afterAction.world.renderRevision !== s.world.renderRevision) {
        return PASS('atmosphere/render revised while core observability stayed intact');
      }
      return PASS('core observability stayed intact; optional atmosphere may be static');
    }
  },
  {
    id: 'p2-4-results-depth',
    level: 'P2',
    name: 'Results depth is reachable or explicitly unavailable without trapping title',
    timeoutMs: 20000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.reset();
      const hadTitle = s.phase === 'title';
      if (!hadTitle) return FAIL('reset did not provide title state for results path');
      s = await game.input({ type: 'chooseMenu', target: 'results' });
      const last = s.lastAction || {};
      if (last.accepted === false || last.ok === false) {
        if (!last.reason) return FAIL('results unavailable without reason');
        if (s.phase !== 'title') return FAIL('unavailable results changed away from title');
        return PASS(`results explicitly unavailable: ${last.reason}`);
      }
      if (s.phase === 'playing') return FAIL('results menu started gameplay');
      if (!s.overlayBlocking) return FAIL('results panel/path should block playfield from title');
      const back = await game.input({ type: 'chooseMenu', target: 'back' });
      if (back.phase !== 'title') return FAIL('results path did not allow returning to title');
      return PASS('results/local score path is reachable or explicitly unavailable and navigable');
    }
  },
  {
    id: 'p2-5-reward-value-feedback',
    level: 'P2',
    name: 'Advertised higher-value collectibles give stronger reward feedback',
    timeoutMs: 30000,
    async run({ browser }) {
      const { game, error } = await requireContractGame(browser);
      if (error) return FAIL(error);
      let s = await game.loadScenario('collectible_route', { preferRewardVariety: true });
      const shape = assertSnapshotShape(s, 'reward variety setup');
      if (shape) return FAIL(shape);
      const classes = s.collectibles.rewardClasses || s.collectibles.visibleTypes || [];
      if (!Array.isArray(classes) || classes.length < 2) return NA('no multiple collectible reward classes advertised');
      const before = s;
      let after = before;
      for (let i = 0; i < 5; i++) {
        after = await game.chainSwing();
        if (after.collectibles.revision !== before.collectibles.revision &&
            (num(after.hud.score, 0) > num(before.hud.score, 0) || num(after.collectibles.collectedCount, 0) > num(before.collectibles.collectedCount, 0))) break;
      }
      const delta = num(after.hud.score, 0) - num(before.hud.score, 0);
      if (delta < 0) return FAIL('reward score delta is negative');
      if (delta === 0 && num(after.collectibles.collectedCount, 0) === num(before.collectibles.collectedCount, 0)) {
        return FAIL('advertised reward route produced no reward');
      }
      if (after.collectibles.rewardRevision != null && after.collectibles.rewardRevision === before.collectibles.rewardRevision) {
        return FAIL('reward changed without reward feedback revision');
      }
      return PASS(`reward classes=${classes.join(',')}, scoreDelta=${delta}`);
    }
  }
];

module.exports = { suite };
