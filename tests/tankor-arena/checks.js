// === GDD Coverage Map ===
// M1 battlefield startup/readable arena -> p0-boot-contract-schema, p0-visible-playfield-no-blocking, p1-hud-minimap-render-sync, p2-mouse-click-visible-controls
// M2 tank movement/turning/weight -> p1-key-forward-back-opposite-motion-chain, p1-key-left-right-direction-opposite, p1-boundary-obstacle-coupling, p1-touch-joystick-direction-opposite
// M3 camera switching -> p1-camera-toggle-preserves-fire-semantics, p2-mouse-click-visible-controls
// M4 aim/lock feedback -> p1-camera-toggle-preserves-fire-semantics, p1-fire-enemy-hit-score-loop, p1-obstacle-fire-damage-route
// M5 fire/projectile/cooldown -> p1-fire-enemy-hit-score-loop, p1-fire-cooldown-reject-invariant, p1-obstacle-fire-damage-route
// M6 enemy AI/fire pressure -> p1-enemy-pressure-damage-risk
// M7 damage/lives/death -> p1-enemy-pressure-damage-risk, p1-terminal-restart-clean
// M8 enemy hit/destroy/score -> p1-fire-enemy-hit-score-loop, p1-level-transition-cleanup
// M9 obstacle blocking/destruction -> p1-boundary-obstacle-coupling, p1-obstacle-fire-damage-route
// M10 level completion/progression -> p1-level-transition-cleanup
// M11 pause/resume -> p1-pause-freeze-resume-invariant
// M12 terminal/restart -> p1-terminal-restart-clean
// M13 HUD/minimap sync -> p1-hud-minimap-render-sync plus all P1 gameplay deltas
// M14 boss/high-level pressure -> p2-boss-higher-level-pressure
// M15 powerups -> p2-powerup-pickup-bounded-effect
// M16 advanced powerups -> p2-advanced-powerup-cost-benefit
// M17 records -> p2-result-records-do-not-block-restart
// M18 optional tuning -> p2-optional-depth-nonblocking
// M19 atmosphere -> p2-optional-depth-nonblocking
//
// === Category Map ===
// Boot & Stability: p0-boot-contract-schema, p0-visible-playfield-no-blocking
// Input Semantics: p1-key-forward-back-opposite-motion-chain, p1-key-left-right-direction-opposite, p1-touch-joystick-direction-opposite, p2-mouse-click-visible-controls
// Core Mechanic Loop: p1-fire-enemy-hit-score-loop, p1-fire-cooldown-reject-invariant, p1-enemy-pressure-damage-risk, p1-level-transition-cleanup
// State Machine: p1-pause-freeze-resume-invariant, p1-terminal-restart-clean
// Feedback & Observability: p1-hud-minimap-render-sync, p1-obstacle-fire-damage-route
// Invariants & Rejection: p1-invalid-action-rejection-invariants, p1-boundary-obstacle-coupling, p1-fire-cooldown-reject-invariant
// Depth / Optional Systems: p2-boss-higher-level-pressure, p2-powerup-pickup-bounded-effect, p2-advanced-powerup-cost-benefit, p2-result-records-do-not-block-restart, p2-optional-depth-nonblocking
//
// === Rationality Map ===
// p1-key-forward-back-opposite-motion-chain: M2 | contract action: holdMove forward then backward with wait | independent observation: movingState/speedTrend plus player/minimap/render deltas | empty-shell failure: no sustained motion, no release damping, or missing forward/back direction opposite fails
// p1-key-left-right-direction-opposite: M2 | contract action: holdMove left then right with wait | independent observation: Math.sign heading/turn deltas and render/minimap revisions | empty-shell failure: direction opposite / 方向相反 catches one-way or mirrored steering
// p1-boundary-obstacle-coupling: M2/M9 | real action: contract driveToward boundary and obstacle from legal scenarios | independent observation: contact/containment plus speed trend/render evidence | empty-shell failure: decorative boundaries or pass-through obstacles fail
// p1-fire-enemy-hit-score-loop: M4/M5/M8 | real action: contract aimAt enemy, fire, wait | independent observation: lock/projectile/cooldown plus enemy damage/destruction and score/HUD delta | empty-shell failure: score buttons, fake projectiles, or ok-only combat fail
// p1-fire-cooldown-reject-invariant: M5 | real action: contract fire then immediate fire/holdFire during cooldown | independent observation: cooldown ratio, projectile count, score invariant, rejection reason | empty-shell failure: unlimited rapid fire or label-only cooldown fails
// p1-camera-toggle-preserves-fire-semantics: M3/M4/M5 | real action: contract toggleCamera then aim/fire in both views | independent observation: camera/render/reticle change plus accepted fire evidence | empty-shell failure: cosmetic camera label or broken view controls fail
// p1-obstacle-fire-damage-route: M4/M5/M9 | real action: contract aimAt obstacle, fire, wait | independent observation: obstacle lock, projectile/muzzle, damage/destruction/render route evidence and score invariant | empty-shell failure: obstacle background art or obstacle score farming fails
// p1-enemy-pressure-damage-risk: M6/M7 | real action: contract enemy_pressure wait and evasive movement | independent observation: enemy/world motion, enemy projectile/damage/HUD feedback | empty-shell failure: static enemy counters or silent damage fail
// p1-pause-freeze-resume-invariant: M11 | real action: contract pause, forbidden wait/move/fire, resume | independent observation: phase/overlay plus frozen combat digest and post-resume action | empty-shell failure: visual pause without simulation lock fails
// p1-level-transition-cleanup: M8/M10 | real action: contract one_enemy_remaining aim/fire until final enemy destroyed | independent observation: all-clear before levelComplete, projectile cleanup, blocked transition input, level increase | empty-shell failure: free level advance or stale bullets fail
// p1-terminal-restart-clean: M7/M12 | real action: contract enemy pressure to terminal then restart | independent observation: terminal lock, result fields, clean baseline after restart | empty-shell failure: terminal still mutable or restart leaves stale combat fails
// p1-hud-minimap-render-sync: M13 | real action: contract movement/fire/damage/progress actions | independent observation: gameplay deltas paired with HUD/minimap/render revision | empty-shell failure: hidden-state game or decorative static HUD fails
// p1-invalid-action-rejection-invariants: TDD rejection | real action: contract malformed and invalid-phase actions | independent observation: ok/reason envelope and stable combat digest | empty-shell failure: permissive debug API or mutation-like action fails
// p1-touch-joystick-direction-opposite: M2 | contract action: joystick right then left displacement with end | independent observation: Math.sign screen/turn deltas and neutral release | empty-shell failure: direction opposite / 方向相反 catches unsupported or same-direction joystick controls
// p2-mouse-click-visible-controls: M1/M3/M5/M11/M12 | real action: browser.mouseClick visible semantic controls | independent observation: same snapshot fields as contract controls plus overlay/playfield state | empty-shell failure: API-only implementation with nonclickable UI fails
// p2-boss-higher-level-pressure: M14 | real action: contract higher_level/boss_battle combat actions | independent observation: boss/high-threat summary plus damageable enemy pressure | empty-shell failure: boss label with no combat difference fails
// p2-powerup-pickup-bounded-effect: M15 | real action: contract driveToward visible powerup | independent observation: powerup count/status/HUD/render plus bounded benefit | empty-shell failure: direct status toggle or unbounded permanent boost fails
// p2-advanced-powerup-cost-benefit: M16 | real action: contract collect advanced powerup then fire/collide | independent observation: weapon/stealth benefit plus cooldown/exposure/cap invariant | empty-shell failure: labels with no cost/benefit tradeoff fail
// p2-result-records-do-not-block-restart: M17 | real action: terminal result inspection then restart | independent observation: leaderboard optional state and restart availability | empty-shell failure: external record flow traps local restart fail
// p2-optional-depth-nonblocking: M18/M19 | real action: optional mode or atmosphere wait then return/play | independent observation: optional state separated from combat and core digest remains explainable | empty-shell failure: optional depth replacing or blocking core play fails

const PASS = detail => ({ status: 'PASS', detail });
const FAIL = detail => ({ status: 'FAIL', detail });
const NA = detail => ({ status: 'NOT_APPLICABLE', detail });

function finite(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function num(v, fallback = 0) {
  return finite(v) ? v : fallback;
}

function changed(a, b, epsilon = 0.01) {
  return finite(a) && finite(b) && Math.abs(b - a) > epsilon;
}

function signOf(v, epsilon = 0.01) {
  if (!finite(v) || Math.abs(v) <= epsilon) return 0;
  return Math.sign(v);
}

function arr(v) {
  return Array.isArray(v) ? v : [];
}

function player(s) { return (s && s.player) || {}; }
function weapon(s) { return (s && s.weapon) || {}; }
function entities(s) { return (s && s.entities) || {}; }
function targets(s) { return (s && s.targets) || {}; }
function hud(s) { return (s && s.hud) || {}; }
function minimap(s) { return (s && s.minimap) || {}; }
function render(s) { return (s && s.render) || {}; }
function result(s) { return (s && s.result) || {}; }
function progress(s) { return (s && s.progress) || {}; }
function controls(s) { return (s && s.controls) || {}; }
function lastEvent(s) { return (s && s.lastEvent) || {}; }

function unwrap(value) {
  if (!value || typeof value !== 'object') return value;
  if (value.__l2_err__) throw new Error(value.__l2_err__);
  if (value.snapshot && typeof value.snapshot === 'object') return value.snapshot;
  return value;
}

function statusOf(value) {
  if (!value || typeof value !== 'object') return { ok: true, snapshot: value };
  if (value.__l2_err__) throw new Error(value.__l2_err__);
  return {
    ok: value.ok !== false,
    reason: value.reason,
    snapshot: unwrap(value)
  };
}

function combatDigest(s) {
  const p = player(s);
  const w = weapon(s);
  const e = entities(s);
  const r = result(s);
  return [
    s && s.phase,
    s && s.screen,
    s && s.score,
    s && s.level,
    s && s.lives,
    p.alive,
    p.screenX,
    p.screenY,
    p.movingState,
    p.turningState,
    p.activePowerups && p.activePowerups.join(','),
    s && s.health && s.health.current,
    w.projectileCount,
    w.playerProjectileCount,
    e.activeEnemyCount,
    e.destroyedEnemyCount,
    e.damagedObstacleCount,
    e.destroyedObstacleCount,
    e.powerupCount,
    r.state
  ].join('|');
}

function visibleDigest(s) {
  return [
    render(s).visualRevision,
    hud(s).revision,
    minimap(s).revision,
    entities(s).enemyMotionRevision,
    entities(s).worldMotionRevision,
    entities(s).explosionRevision,
    weapon(s).muzzleFeedbackRevision,
    weapon(s).projectileMotionRevision
  ].map(v => String(v == null ? '' : v)).join('|');
}

function assertSnapshotShape(s) {
  if (!s || typeof s !== 'object') return 'snapshot missing';
  if (!['boot', 'intro', 'playing', 'paused', 'transition', 'respawning', 'gameOver'].includes(s.phase)) {
    return `invalid phase ${s.phase}`;
  }
  if (!['intro', 'play', 'pause', 'levelComplete', 'result'].includes(s.screen)) {
    return `invalid screen ${s.screen}`;
  }
  if (typeof s.canInteractWithPlayfield !== 'boolean') return 'canInteractWithPlayfield missing boolean';
  if (typeof s.overlayBlocking !== 'boolean') return 'overlayBlocking missing boolean';
  if (!s.player || !s.weapon || !s.entities || !s.hud || !s.render) return 'required summary group missing';
  if (!s.health || !finite(s.health.current) || !finite(s.health.max)) return 'health summary invalid';
  if (!finite(s.score) || !finite(s.level) || !finite(s.lives)) return 'score/level/lives invalid';
  return null;
}

function isPlayable(s) {
  return s && s.phase === 'playing' && s.canInteractWithPlayfield === true && s.overlayBlocking === false;
}

function hasRenderReady(s) {
  const r = render(s);
  return r.playfieldVisible === true && r.nonBlank === true && (r.playerVisible === true || player(s).visible === true);
}

function motionEvidence(before, after) {
  const bp = player(before);
  const ap = player(after);
  return changed(bp.screenX, ap.screenX, 0.2) ||
    changed(bp.screenY, ap.screenY, 0.2) ||
    visibleDigest(before) !== visibleDigest(after) ||
    minimap(before).revision !== minimap(after).revision;
}

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
      const s = await gt.getSnapshot();
      return window.__l2 && window.__l2.__d ? window.__l2.__d(s) : s;
    })()`);
  }

  async function reset(options) {
    const payload = JSON.stringify(options || {});
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.reset !== 'function') return { contractMissing: true };
      const s = await gt.reset(${payload});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(s) : s;
    })()`);
  }

  async function input(action) {
    const payload = JSON.stringify(action || {});
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.input !== 'function') return { contractMissing: true };
      const s = await gt.input(${payload});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(s) : s;
    })()`);
  }

  async function loadScenario(name, options) {
    const scenario = JSON.stringify(name);
    const payload = JSON.stringify(options || {});
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.loadScenario !== 'function') return { contractMissing: true };
      const s = await gt.loadScenario(${scenario}, ${payload});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(s) : s;
    })()`);
  }

  async function ensureFreshBattle() {
    const s = unwrap(await loadScenario('fresh_battle'));
    const shape = assertSnapshotShape(s);
    if (shape) throw new Error(`fresh_battle invalid precondition: ${shape}`);
    if (!isPlayable(s)) throw new Error('fresh_battle is not playable');
    if (entities(s).activeEnemyCount < 1) throw new Error('fresh_battle has no active enemy');
    return s;
  }

  async function ensureScenario(name, predicate, detail) {
    const s = unwrap(await loadScenario(name));
    const shape = assertSnapshotShape(s);
    if (shape) throw new Error(`${name} invalid precondition: ${shape}`);
    if (predicate && !predicate(s)) throw new Error(`${name} invalid precondition: ${detail || 'predicate failed'}`);
    return s;
  }

  async function canvasHash() {
    return browser.canvasPixelHash();
  }

  async function visibleControl(action) {
    const s = await snapshot();
    const match = arr(controls(s).semanticControls).find(c =>
      c && c.action === action && c.visible !== false && c.enabled !== false && c.bounds &&
      finite(c.bounds.left) && finite(c.bounds.top) && finite(c.bounds.width) && finite(c.bounds.height) &&
      c.bounds.width > 0 && c.bounds.height > 0);
    if (!match) return null;
    return {
      x: match.bounds.left + match.bounds.width / 2,
      y: match.bounds.top + match.bounds.height / 2,
      control: match
    };
  }

  return { page, snapshot, reset, input, loadScenario, ensureFreshBattle, ensureScenario, canvasHash, visibleControl };
}

const suite = [
  {
    id: 'p0-boot-contract-schema',
    level: 'P0',
    name: 'Boot exposes public contract and valid Tankor snapshot schema',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const exists = await game.page(`(function(){
        const gt = window.__gameTest;
        return !!gt && ['reset','input','getSnapshot','loadScenario'].every(k => typeof gt[k] === 'function');
      })()`);
      if (!exists) return FAIL('window.__gameTest reset/input/getSnapshot/loadScenario missing');
      const s = unwrap(await game.reset());
      const shape = assertSnapshotShape(s);
      if (shape) return FAIL(shape);
      const started = s.phase === 'playing' ? s : unwrap(await game.input({ type: 'start', method: 'auto' }));
      const startShape = assertSnapshotShape(started);
      if (startShape) return FAIL(`start returned invalid snapshot: ${startShape}`);
      if (!['intro', 'playing'].includes(started.phase) && started.screen !== 'play') return FAIL(`unexpected start phase ${started.phase}`);
      return PASS('contract methods and snapshot envelope are valid');
    }
  },
  {
    id: 'p0-visible-playfield-no-blocking',
    level: 'P0',
    name: 'Playable state has visible nonblank playfield and no blocking overlay',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.ensureFreshBattle();
      const canvas = await browser.getCanvasSize();
      if (!canvas || canvas.cssW <= 0 || canvas.cssH <= 0) return FAIL('primary canvas/playfield has no visible geometry');
      const hash = await game.canvasHash();
      if (!hash) return FAIL('screenshot hash unavailable for visible playfield');
      if (!isPlayable(s)) return FAIL('playing state is blocked or cannot interact with playfield');
      if (!hasRenderReady(s)) return FAIL('render summary does not show visible nonblank arena/player');
      if (hud(s).visible !== true || minimap(s).visible !== true || targets(s).reticleVisible !== true) {
        return FAIL('HUD, minimap, or reticle is not visible in playable battle');
      }
      return PASS('playfield, HUD, minimap, and reticle are visible and unblocked');
    }
  },
  {
    id: 'p1-key-forward-back-opposite-motion-chain',
    level: 'P1',
    name: 'Player-level forward/back direction opposite movement has hold release and reverse trend',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.ensureFreshBattle();
      // Use the TDD player-level action after API scenario setup.  The
      // scenario API may legitimately run a deterministic simulation mode;
      // mixing it with live key events would test the harness mode switch
      // instead of the public movement contract.  Real visible controls are
      // covered separately by p2-mouse-click-visible-controls.
      const forward = unwrap(await game.input({ type: 'holdMove', direction: 'forward', durationMs: 450 }));
      await game.input({ type: 'releaseMove' });
      const released = unwrap(await game.input({ type: 'wait', durationMs: 300 }));
      const back = unwrap(await game.input({ type: 'holdMove', direction: 'backward', durationMs: 450 }));

      const forwardMoved = motionEvidence(start, forward);
      const forwardSemantic = changed(player(start).screenX, player(forward).screenX, 0.2) ||
        changed(player(start).screenY, player(forward).screenY, 0.2) ||
        ['accelerating', 'moving', 'coasting'].includes(player(forward).movingState) ||
        ['increasing', 'steady'].includes(player(forward).speedTrend);
      const releaseDamped = ['coasting', 'braking', 'idle'].includes(player(released).movingState) ||
        ['decreasing', 'steady', 'stopped'].includes(player(released).speedTrend);
      const backTrend = ['braking', 'reversing'].includes(player(back).movingState) ||
        ['decreasing', 'reversing'].includes(player(back).speedTrend);
      const dxForward = num(player(forward).screenX, NaN) - num(player(start).screenX, NaN);
      const dyForward = num(player(forward).screenY, NaN) - num(player(start).screenY, NaN);
      const dxBack = num(player(back).screenX, NaN) - num(player(released).screenX, NaN);
      const dyBack = num(player(back).screenY, NaN) - num(player(released).screenY, NaN);
      const forwardDistance = Math.hypot(dxForward, dyForward);
      const backDistance = Math.hypot(dxBack, dyBack);
      const screenDirectionOpposite = forwardDistance > 0.2 && backDistance > 0.2 &&
        dxForward * dxBack + dyForward * dyBack < 0;
      const semanticDirectionEvidence = backTrend && motionEvidence(released, back);
      const directionOpposite = screenDirectionOpposite || semanticDirectionEvidence;
      if (!forwardMoved) return FAIL('forward hold did not produce player/minimap/render motion evidence');
      if (!forwardSemantic) return FAIL('forward hold did not produce semantic player movement or speed-state evidence');
      if (!releaseDamped) return FAIL('release did not show coasting/damping/stopping trend');
      if (!backTrend) return FAIL('backward hold did not show braking/reversing trend');
      if (!directionOpposite) {
        return FAIL('forward/back direction opposite evidence missing');
      }
      if (visibleDigest(start) === visibleDigest(back) && minimap(start).revision === minimap(back).revision) return FAIL('public visual/minimap evidence did not change after movement chain');
      return PASS('forward hold, release damping, and backward reverse chain observed');
    }
  },
  {
    id: 'p1-key-left-right-direction-opposite',
    level: 'P1',
    name: 'Player-level left/right direction opposite steering changes visible heading',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const signedAngleDelta = (from, to) => {
        if (!finite(from) || !finite(to)) return NaN;
        const period = Math.max(Math.abs(from), Math.abs(to)) > (Math.PI * 2 + 0.5) ? 360 : Math.PI * 2;
        let delta = (to - from) % period;
        if (delta > period / 2) delta -= period;
        if (delta < -period / 2) delta += period;
        return delta;
      };
      const turnSignal = (snapshot, side) => {
        const p = player(snapshot);
        return p.turningState === side || p.turnTrend === `${side}Increasing`;
      };
      const start = await game.ensureFreshBattle();
      const left = unwrap(await game.input({ type: 'holdMove', direction: 'left', durationMs: 420 }));
      const leftActive = unwrap(await game.input({ type: 'holdMove', direction: 'left' }));
      const leftObserved = unwrap(await game.input({ type: 'wait', durationMs: 120 }));
      await game.input({ type: 'releaseMove' });
      const released = unwrap(await game.input({ type: 'wait', durationMs: 250 }));
      const right = unwrap(await game.input({ type: 'holdMove', direction: 'right', durationMs: 420 }));
      const rightActive = unwrap(await game.input({ type: 'holdMove', direction: 'right' }));
      const rightObserved = unwrap(await game.input({ type: 'wait', durationMs: 120 }));

      const leftDelta = signedAngleDelta(num(player(start).headingScreenAngle, NaN), num(player(leftObserved).headingScreenAngle, NaN));
      const rightDelta = signedAngleDelta(num(player(released).headingScreenAngle, NaN), num(player(rightObserved).headingScreenAngle, NaN));
      const leftActionChanged = changed(player(start).headingScreenAngle, player(left).headingScreenAngle, 0.001) ||
        visibleDigest(start) !== visibleDigest(left);
      const rightActionChanged = changed(player(released).headingScreenAngle, player(right).headingScreenAngle, 0.001) ||
        visibleDigest(released) !== visibleDigest(right);
      const leftHeadingChanged = changed(player(start).headingScreenAngle, player(leftObserved).headingScreenAngle, 0.001) ||
        visibleDigest(start) !== visibleDigest(leftObserved);
      const rightHeadingChanged = changed(player(released).headingScreenAngle, player(rightObserved).headingScreenAngle, 0.001) ||
        visibleDigest(released) !== visibleDigest(rightObserved);
      const leftTurnObserved = [left, leftActive, leftObserved].some(s => turnSignal(s, 'left'));
      const rightTurnObserved = [right, rightActive, rightObserved].some(s => turnSignal(s, 'right'));
      const trendOpposite = leftTurnObserved && rightTurnObserved;
      const signOpposite = signOf(leftDelta, 0.001) !== 0 && signOf(rightDelta, 0.001) !== 0 &&
        Math.sign(leftDelta) !== Math.sign(rightDelta);
      const releaseDamped = ['damping', 'none'].includes(player(released).turningState) ||
        ['damping', 'steady', 'none'].includes(player(released).turnTrend);
      if (!leftActionChanged || !rightActionChanged || !leftHeadingChanged || !rightHeadingChanged) {
        return FAIL('left/right steering did not produce visible heading or render change');
      }
      if (!trendOpposite && !signOpposite) return FAIL('left/right direction opposite steering evidence missing');
      if (!releaseDamped) return FAIL('turn release did not damp or settle');
      if (visibleDigest(start) === visibleDigest(rightObserved) && !changed(player(start).headingScreenAngle, player(rightObserved).headingScreenAngle, 0.001)) {
        return FAIL('visible heading/render evidence did not change');
      }
      return PASS('left and right player-level actions produce opposite steering trends');
    }
  },
  {
    id: 'p1-boundary-obstacle-coupling',
    level: 'P1',
    name: 'Boundary and obstacle movement couple containment contact and speed trend',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const boundaryStart = await game.ensureScenario(
        'near_boundary',
        s => isPlayable(s) && player(s).boundaryContact !== true,
        'not playable or already at boundary'
      );
      const boundaryAfter = unwrap(await game.input({ type: 'driveToward', target: 'arenaBoundary', durationMs: 2500 }));
      const boundaryBeforePlayer = player(boundaryStart);
      const boundaryAfterPlayer = player(boundaryAfter);
      const boundaryTrendEvidence =
        boundaryAfterPlayer.speedTrend !== boundaryBeforePlayer.speedTrend &&
        ['decreasing', 'stopped', 'steady'].includes(boundaryAfterPlayer.speedTrend);
      if (boundaryAfterPlayer.boundaryContact !== true && !boundaryTrendEvidence) {
        return FAIL('boundary drive did not show contact, containment, or reduced speed trend');
      }

      const obstacleStart = await game.ensureScenario(
        'near_obstacle',
        s => isPlayable(s) && entities(s).obstacleCount > 0 && player(s).obstacleContact !== true,
        'no legal obstacle precondition'
      );
      const obstacleAfter = unwrap(await game.input({ type: 'driveToward', target: 'obstacle', durationMs: 2500 }));
      const obstacleStartPlayer = player(obstacleStart);
      const obstacleAfterPlayer = player(obstacleAfter);
      const obstacleTrendEvidence =
        obstacleAfterPlayer.speedTrend !== obstacleStartPlayer.speedTrend &&
        ['decreasing', 'stopped'].includes(obstacleAfterPlayer.speedTrend);
      const contact = obstacleAfterPlayer.obstacleContact === true ||
        entities(obstacleAfter).damagedObstacleCount > entities(obstacleStart).damagedObstacleCount ||
        obstacleTrendEvidence;
      if (!contact) return FAIL('obstacle drive did not show contact, deflection, damage, or speed reduction');
      if (render(obstacleAfter).visualRevision === render(obstacleStart).visualRevision &&
          minimap(obstacleAfter).revision === minimap(obstacleStart).revision) {
        return FAIL('obstacle/boundary interaction lacks visible or minimap evidence');
      }
      return PASS('boundary containment and obstacle coupling are observable');
    }
  },
  {
    id: 'p1-fire-enemy-hit-score-loop',
    level: 'P1',
    name: 'Aim fire enemy hit loop creates projectile cooldown damage and score feedback',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('aimable_enemy', s =>
        isPlayable(s) && entities(s).activeEnemyCount > 0 && weapon(s).ready === true, 'enemy not aimable or weapon not ready');
      const aimed = unwrap(await game.input({ type: 'aimAt', target: 'enemy' }));
      if (targets(aimed).lockState !== 'enemy' && targets(aimed).aimTargetKind !== 'enemy' && arr(targets(aimed).visibleTargets).length === 0) {
        return FAIL('aimAt enemy produced no lock or visible target evidence');
      }
      const fired = unwrap(await game.input({ type: 'fire', method: 'key' }));
      const after = unwrap(await game.input({ type: 'wait', durationMs: 900 }));
      if (weapon(fired).lastFireAccepted !== true) return FAIL('ready fire was not accepted');
      if (weapon(fired).projectileCount <= weapon(before).projectileCount &&
          weapon(fired).muzzleFeedbackRevision <= weapon(before).muzzleFeedbackRevision &&
          weapon(fired).projectileMotionRevision <= weapon(before).projectileMotionRevision) {
        return FAIL('fire produced no projectile or muzzle evidence');
      }
      if (!(weapon(fired).cooldownRatio < weapon(before).cooldownRatio || weapon(fired).ready === false)) {
        return FAIL('fire did not start cooldown or make weapon not ready');
      }
      const enemyChanged = entities(after).destroyedEnemyCount > entities(before).destroyedEnemyCount ||
        entities(after).activeEnemyCount < entities(before).activeEnemyCount ||
        entities(after).explosionRevision > entities(before).explosionRevision ||
        lastEvent(after).type === 'hitEnemy' || lastEvent(after).type === 'destroyEnemy';
      if (!enemyChanged) return FAIL('enemy hit/damage/destruction evidence missing after aimed shot');
      if (after.score < before.score) return FAIL('score decreased after valid enemy shot');
      if (after.score > before.score && hud(after).revision === hud(before).revision) return FAIL('score changed without HUD revision');
      return PASS('enemy aim/fire loop produced projectile, cooldown, combat, and score/HUD evidence');
    }
  },
  {
    id: 'p1-fire-cooldown-reject-invariant',
    level: 'P1',
    name: 'Fire cooldown rejects extra shots and preserves score and projectile invariants',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('cooldown_ready', s => isPlayable(s) && weapon(s).ready === true, 'weapon not ready');
      const first = unwrap(await game.input({ type: 'fire', method: 'key' }));
      if (weapon(first).lastFireAccepted !== true) return FAIL('first ready shot was not accepted');
      const secondResult = statusOf(await game.input({ type: 'fire', method: 'key' }));
      const second = secondResult.snapshot;
      const rejected = secondResult.ok === false ||
        weapon(second).lastFireAccepted === false ||
        weapon(second).lastFireRejectedReason === 'cooldown' ||
        lastEvent(second).type === 'cooldownReject';
      const projectileStable = weapon(second).projectileCount <= weapon(first).projectileCount + 1;
      if (!rejected && !projectileStable) return FAIL('cooldown shot was accepted as extra projectile without rejection evidence');
      if (second.score !== first.score) return FAIL('cooldown rejection changed score');
      const recovering = unwrap(await game.input({ type: 'wait', durationMs: 1300 }));
      if (!(weapon(recovering).ready === true || weapon(recovering).cooldownRatio > weapon(second).cooldownRatio)) {
        return FAIL('cooldown did not recover after wait');
      }
      return PASS('cooldown rejects rapid fire and later recovers');
    }
  },
  {
    id: 'p1-camera-toggle-preserves-fire-semantics',
    level: 'P1',
    name: 'Camera toggle changes view while preserving aim and fire semantics',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('aimable_enemy', s => isPlayable(s), 'not playable');
      const toggled = unwrap(await game.input({ type: 'toggleCamera', method: 'key' }));
      if (toggled.cameraMode === before.cameraMode) return FAIL('toggleCamera did not change cameraMode');
      if (targets(toggled).reticleVisible !== true) return FAIL('reticle not visible after camera toggle');
      if (render(toggled).visualRevision === render(before).visualRevision && visibleDigest(toggled) === visibleDigest(before)) {
        return FAIL('camera toggle produced no visual evidence');
      }
      const aimed = unwrap(await game.input({ type: 'aimAt', target: 'enemy' }));
      const fired = unwrap(await game.input({ type: 'fire', method: 'key' }));
      if (weapon(fired).lastFireAccepted !== true) return FAIL('fire no longer works after camera toggle');
      if (targets(aimed).lockState !== 'enemy' && targets(aimed).aimTargetKind !== 'enemy' && targets(aimed).reticleVisible !== true) {
        return FAIL('aim/reticle semantics broke after camera toggle');
      }
      return PASS('camera view changed and combat controls still work');
    }
  },
  {
    id: 'p1-obstacle-fire-damage-route',
    level: 'P1',
    name: 'Obstacle aim and fire damages blocking object without enemy score farming',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('aimable_obstacle', s =>
        isPlayable(s) && entities(s).obstacleCount > 0 && weapon(s).ready === true, 'obstacle not aimable or weapon not ready');
      const aimed = unwrap(await game.input({ type: 'aimAt', target: 'obstacle' }));
      if (targets(aimed).lockState !== 'obstacle' && targets(aimed).aimTargetKind !== 'obstacle') {
        return FAIL('aimAt obstacle produced no obstacle lock evidence');
      }
      const fired = unwrap(await game.input({ type: 'fire', method: 'key' }));
      const after = unwrap(await game.input({ type: 'wait', durationMs: 900 }));
      if (weapon(fired).lastFireAccepted !== true) return FAIL('obstacle shot was not accepted');
      const obstacleChanged = entities(after).damagedObstacleCount > entities(before).damagedObstacleCount ||
        entities(after).destroyedObstacleCount > entities(before).destroyedObstacleCount ||
        entities(after).explosionRevision > entities(before).explosionRevision ||
        lastEvent(after).type === 'hitObstacle' || lastEvent(after).type === 'destroyObstacle';
      if (!obstacleChanged) return FAIL('obstacle damage/destruction feedback missing');
      const scoreDelta = after.score - before.score;
      const eventType = lastEvent(after).type;
      const obstacleReward = scoreDelta > 0 &&
        (eventType === 'hitObstacle' || eventType === 'destroyObstacle') &&
        lastEvent(after).scoreDelta === scoreDelta;
      const enemyReward = scoreDelta > 0 &&
        (eventType === 'hitEnemy' || eventType === 'destroyEnemy' ||
          entities(after).destroyedEnemyCount > entities(before).destroyedEnemyCount);
      if (scoreDelta > 0 && (enemyReward || !obstacleReward)) {
        return FAIL('obstacle-only shot awarded enemy score');
      }
      if (render(after).visualRevision === render(before).visualRevision && minimap(after).revision === minimap(before).revision) {
        return FAIL('obstacle hit has no visible route/render/minimap evidence');
      }
      return PASS('obstacle fire path damages obstacle and preserves score invariant');
    }
  },
  {
    id: 'p1-enemy-pressure-damage-risk',
    level: 'P1',
    name: 'Enemy pressure creates world motion fire risk and damage feedback coupling',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('enemy_pressure', s =>
        isPlayable(s) && entities(s).activeEnemyCount > 0 && player(s).alive === true, 'no active enemy pressure');
      const waited = unwrap(await game.input({ type: 'wait', durationMs: 1200 }));
      const moved = unwrap(await game.input({ type: 'holdMove', direction: 'left', durationMs: 500 }));
      const enemyMotion = entities(waited).enemyMotionRevision > entities(before).enemyMotionRevision ||
        entities(waited).worldMotionRevision > entities(before).worldMotionRevision ||
        weapon(waited).projectileMotionRevision > weapon(before).projectileMotionRevision ||
        entities(moved).enemyMotionRevision > entities(before).enemyMotionRevision;
      const firePressure = weapon(waited).enemyProjectileCount > weapon(before).enemyProjectileCount ||
        weapon(waited).visibleProjectileCount > weapon(before).visibleProjectileCount ||
        entities(waited).visibleProjectileCount > entities(before).visibleProjectileCount;
      const damageOrEvasion = (waited.health && before.health && waited.health.current < before.health.current) ||
        player(waited).damageFeedbackActive === true ||
        motionEvidence(waited, moved);
      if (!enemyMotion) return FAIL('active enemies did not show motion/world revision');
      if (!firePressure && !damageOrEvasion) return FAIL('enemy pressure produced neither fire pressure nor movement-coupled risk evidence');
      if (waited.health && waited.health.current < before.health.current && hud(waited).revision === hud(before).revision) {
        return FAIL('damage changed without HUD feedback');
      }
      return PASS('enemy pressure is active and coupled to risk/damage or evasion');
    }
  },
  {
    id: 'p1-pause-freeze-resume-invariant',
    level: 'P1',
    name: 'Pause freezes combat inputs and resume restores play',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureFreshBattle();
      const paused = unwrap(await game.input({ type: 'pause', method: 'key' }));
      if (paused.phase !== 'paused' || paused.screen !== 'pause') return FAIL('pause did not enter paused screen');
      if (paused.overlayBlocking !== true || paused.canInteractWithPlayfield !== false) return FAIL('pause does not block playfield combat');
      const pausedDigest = combatDigest(paused);
      await game.input({ type: 'wait', durationMs: 900 });
      await game.input({ type: 'holdMove', direction: 'forward', durationMs: 600 });
      await game.input({ type: 'fire', method: 'key' });
      const afterForbidden = await game.snapshot();
      if (combatDigest(afterForbidden) !== pausedDigest) return FAIL('combat state mutated while paused');
      const resumed = unwrap(await game.input({ type: 'resume', method: 'key' }));
      if (resumed.phase !== 'playing' || resumed.overlayBlocking === true) return FAIL('resume did not restore playable state');
      const moved = unwrap(await game.input({ type: 'holdMove', direction: 'forward', durationMs: 500 }));
      if (!motionEvidence(resumed, moved)) return FAIL('valid movement did not work after resume');
      if (before.score !== resumed.score) return FAIL('pause/resume changed score');
      return PASS('pause freezes combat and resume restores controls');
    }
  },
  {
    id: 'p1-level-transition-cleanup',
    level: 'P1',
    name: 'Destroying final enemy triggers level transition cleanup and next battle',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('one_enemy_remaining', s =>
        isPlayable(s) && entities(s).activeEnemyCount === 1, 'not exactly one enemy remaining');
      let current = before;
      let shots = 0;
      while (shots < 8 && entities(current).activeEnemyCount > 0 && current.phase === 'playing') {
        if (weapon(current).ready !== true) current = unwrap(await game.input({ type: 'wait', durationMs: 900 }));
        if (entities(current).activeEnemyCount > 0 && current.phase === 'playing') {
          current = unwrap(await game.input({ type: 'aimAt', target: 'enemy' }));
          if (entities(current).activeEnemyCount > 0 && current.phase === 'playing') {
            current = unwrap(await game.input({ type: 'fire', method: 'key' }));
            current = unwrap(await game.input({ type: 'wait', durationMs: 1000 }));
          }
        }
        shots++;
      }
      const complete = current;
      if (entities(complete).activeEnemyCount > 0) return FAIL('final enemy was not destroyed through aim/fire actions');
      if (complete.level < before.level && progress(complete).levelTransitionActive !== true) return FAIL('level regressed after final enemy');
      if (result(complete).state !== 'levelComplete' && complete.phase !== 'transition' && complete.screen !== 'levelComplete' && progress(complete).nextLevelAvailable !== true) {
        return FAIL('enemy all-clear did not expose level-complete transition');
      }
      if (progress(complete).oldProjectilesClearedOnTransition === false) return FAIL('transition reports old projectiles not cleared');
      const blockedFire = statusOf(await game.input({ type: 'fire', method: 'key' }));
      const blockedSnap = blockedFire.snapshot;
      if (blockedSnap.score > complete.score && weapon(blockedSnap).lastFireAccepted === true) {
        return FAIL('transition allowed combat fire/score mutation');
      }
      const next = unwrap(await game.input({ type: 'wait', durationMs: 1800 }));
      if (!(next.level > before.level || progress(next).nextLevelAvailable === true || next.phase === 'playing')) {
        return FAIL('level did not advance or become available after transition wait');
      }
      return PASS('final enemy destruction causes transition, cleanup, and next-level availability');
    }
  },
  {
    id: 'p1-terminal-restart-clean',
    level: 'P1',
    name: 'Terminal state locks combat and restart returns clean battle baseline',
    timeoutMs: 120000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('enemy_pressure', s => isPlayable(s), 'not playable');
      let current = before;
      // The contract requires a legal damage/life-loss chain, but does not
      // prescribe a fixed attack cadence or iteration count. Use a
      // timeout-compatible simulated-time budget and adapt to respawn or
      // transition phases while recording observed pressure progress.
      const pressureBudgetMs = 108000;
      let pressureElapsedMs = 0;
      let pressureStep = 0;
      let damageObserved = false;
      let lifeLossObserved = false;
      let lastHealth = before.health.current;
      let lastLives = before.lives;
      while (pressureElapsedMs < pressureBudgetMs && current.phase !== 'gameOver' && result(current).state !== 'gameOver') {
        const action = current.phase === 'playing' && pressureStep % 2 === 0
          ? { type: 'driveToward', target: 'enemy', durationMs: 900 }
          : { type: 'wait', durationMs: 900 };
        current = unwrap(await game.input(action));
        pressureElapsedMs += action.durationMs;
        if (finite(current.health && current.health.current) && finite(lastHealth) && current.health.current < lastHealth) damageObserved = true;
        if (finite(current.lives) && finite(lastLives) && current.lives < lastLives) lifeLossObserved = true;
        if (finite(current.health && current.health.current)) lastHealth = current.health.current;
        if (finite(current.lives)) lastLives = current.lives;
        pressureStep += 1;
      }
      if (current.phase !== 'gameOver' && result(current).state !== 'gameOver') {
        return FAIL(`terminal state was not reachable through enemy pressure exposure (damage observed: ${damageObserved}, life loss observed: ${lifeLossObserved})`);
      }
      if (!damageObserved || !lifeLossObserved) return FAIL('terminal state was reached without the complete observable damage/life-loss chain');
      const terminalDigest = combatDigest(current);
      const afterFire = unwrap(await game.input({ type: 'fire', method: 'key' }));
      if (combatDigest(afterFire) !== terminalDigest && afterFire.score !== current.score) return FAIL('terminal state accepted combat mutation');
      if (result(current).restartAvailable !== true && controls(current).restartAvailable !== true) return FAIL('restart is not available at terminal result');
      const restarted = unwrap(await game.input({ type: 'restart', method: 'key' }));
      if (!isPlayable(restarted)) return FAIL('restart did not return to unblocked play');
      if (restarted.level > before.level || restarted.score > before.score || restarted.lives <= 0) {
        return FAIL('restart did not restore clean baseline score/level/lives');
      }
      if (weapon(restarted).projectileCount > 0 || arr(player(restarted).activePowerups).length > 0 || result(restarted).state !== 'none') {
        return FAIL('restart left stale projectiles, powerups, or result state');
      }
      return PASS('terminal locks combat and restart clears transient state');
    }
  },
  {
    id: 'p1-hud-minimap-render-sync',
    level: 'P1',
    name: 'HUD minimap reticle and render revisions synchronize with gameplay deltas',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.ensureFreshBattle();
      if (hud(start).visible !== true || minimap(start).visible !== true || targets(start).reticleVisible !== true) {
        return FAIL('initial HUD/minimap/reticle not visible');
      }
      const moved = unwrap(await game.input({ type: 'holdMove', direction: 'forward', durationMs: 600 }));
      const firedSetup = await game.ensureScenario('cooldown_ready', s =>
        isPlayable(s) && weapon(s).ready === true, 'weapon not ready for HUD sync fire setup');
      const fired = unwrap(await game.input({ type: 'fire', method: 'key' }));
      const syncMovement = motionEvidence(start, moved) &&
        (hud(moved).revision !== hud(start).revision || minimap(moved).revision !== minimap(start).revision || render(moved).visualRevision !== render(start).visualRevision);
      const syncFire = weapon(fired).lastFireAccepted === true &&
        (hud(fired).revision !== hud(firedSetup).revision || render(fired).visualRevision !== render(firedSetup).visualRevision ||
         weapon(fired).muzzleFeedbackRevision > weapon(firedSetup).muzzleFeedbackRevision);
      if (!syncMovement) return FAIL('movement delta is not synchronized to HUD/minimap/render evidence');
      if (!syncFire) return FAIL('fire delta is not synchronized to cooldown/HUD/render evidence');
      if (hud(fired).cooldownVisible !== true && weapon(fired).ready === false && weapon(fired).cooldownRatio < 1) {
        return FAIL('cooldown state is not visible in HUD summary');
      }
      return PASS('visible summaries track movement and fire gameplay changes');
    }
  },
  {
    id: 'p1-invalid-action-rejection-invariants',
    level: 'P1',
    name: 'Invalid action and non-playing combat inputs reject without mutating invariants',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureFreshBattle();
      const rejectionInvariantDigest = (s) => {
        const p = player(s);
        const w = weapon(s);
        const e = entities(s);
        const r = result(s);
        const h = s && s.health;
        return [
          s && s.phase,
          s && s.screen,
          s && s.score,
          s && s.level,
          s && s.lives,
          h && h.current,
          h && h.max,
          p.alive,
          p.activePowerups && p.activePowerups.join(','),
          w.projectileCount,
          w.playerProjectileCount,
          w.enemyProjectileCount,
          e.enemyCount,
          e.activeEnemyCount,
          e.destroyedEnemyCount,
          e.obstacleCount,
          e.damagedObstacleCount,
          e.destroyedObstacleCount,
          e.powerupCount,
          r.state,
          r.finalScore,
          r.finalLevel
        ].join('|');
      };
      const hasRejectionEnvelope = (outcome) => {
        const event = lastEvent(outcome.snapshot);
        return outcome.ok === false || !!outcome.reason || event.accepted === false;
      };
      const badAttempt = await game.page("(async function(){ const gt=window.__gameTest; const decode=value => window.__l2 && window.__l2.__d ? window.__l2.__d(value) : value; const pre=decode(await gt.getSnapshot()); const outcome=decode(await gt.input({type:'teleportAndKill',score:9999,level:99,durationMs:-1})); return {pre,outcome}; })()");
      const bad = statusOf(badAttempt.outcome);
      const badSnap = bad.snapshot;
      if (!hasRejectionEnvelope(bad)) {
        return FAIL('invalid action has no rejection envelope');
      }
      if (rejectionInvariantDigest(badSnap) !== rejectionInvariantDigest(badAttempt.pre)) return FAIL('invalid mutation-like action changed combat invariants');
      const paused = unwrap(await game.input({ type: 'pause', method: 'key' }));
      const pausedDigest = combatDigest(paused);
      const blockedMove = statusOf(await game.input({ type: 'holdMove', direction: 'forward', durationMs: 500 }));
      if (!hasRejectionEnvelope(blockedMove)) return FAIL('paused movement has no rejection envelope');
      const blockedFire = statusOf(await game.input({ type: 'fire', method: 'key' }));
      if (!hasRejectionEnvelope(blockedFire)) return FAIL('paused fire has no rejection envelope');
      const stillPaused = await game.snapshot();
      if (combatDigest(stillPaused) !== pausedDigest) return FAIL('paused non-playing phase accepted movement/fire mutation');
      if (stillPaused.score < 0 || stillPaused.lives < 0 || stillPaused.health.current < 0 ||
          entities(stillPaused).activeEnemyCount < 0 || weapon(stillPaused).projectileCount < 0) {
        return FAIL('numeric invariant became negative');
      }
      return PASS('invalid and non-playing combat actions reject without hidden mutation');
    }
  },
  {
    id: 'p1-touch-joystick-direction-opposite',
    level: 'P1',
    name: 'Player-level joystick direction opposite left and right input affects tank steering',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const mobile = unwrap(await game.loadScenario('mobile_controls_ready'));
      const preconditionShape = assertSnapshotShape(mobile);
      if (preconditionShape) return FAIL('mobile_controls_ready invalid precondition: ' + preconditionShape);
      if (controls(mobile).joystickAvailable === false) {
        return NA('touch joystick not applicable in this non-touch-capable viewport');
      }
      if (!isPlayable(mobile)) return FAIL('mobile_controls_ready invalid precondition: not playable');
      const before = mobile;
      // Exercise the required semantic joystick action.  This keeps the P1
      // oracle independent of viewport geometry and of whether loadScenario
      // switches the app into deterministic API stepping; real touch regions
      // remain covered by the visible-control checks.
      const headingDelta = (from, to) => {
        const a = num(player(from).headingScreenAngle, NaN);
        const b = num(player(to).headingScreenAngle, NaN);
        if (!finite(a) || !finite(b)) return NaN;
        const period = Math.max(Math.abs(a), Math.abs(b)) <= (2 * Math.PI + 0.5) ? 2 * Math.PI : 360;
        let delta = b - a;
        while (delta > period / 2) delta -= period;
        while (delta < -period / 2) delta += period;
        return delta;
      };
      const steeringProgressed = (from, to) => {
        const delta = headingDelta(from, to);
        const fromVisual = render(from).visualRevision;
        const toVisual = render(to).visualRevision;
        const fromMinimap = minimap(from).revision;
        const toMinimap = minimap(to).revision;
        return signOf(delta, 0.01) !== 0 ||
          (finite(fromVisual) && finite(toVisual) && fromVisual !== toVisual) ||
          (finite(fromMinimap) && finite(toMinimap) && fromMinimap !== toMinimap);
      };
      const turnStateMatches = (snapshot, expected) => {
        const p = player(snapshot);
        const trend = expected === 'right' ? 'rightIncreasing' : 'leftIncreasing';
        return p.turningState === expected || p.turnTrend === trend;
      };
      const directionalTurnEvidence = (from, to, expected) =>
        turnStateMatches(to, expected) && steeringProgressed(from, to);
      const probeJoystick = async (base, direction, expected) => {
        let latest = base;
        let durationProgressed = false;
        for (const magnitude of [50, 8, 1]) {
          await game.input({ type: 'joystick', x: 0, y: 0, phase: 'start' });
          const attempt = statusOf(await game.input({
            type: 'joystick',
            x: direction * magnitude,
            y: 0,
            phase: 'move',
            durationMs: 450
          }));
          const snapshot = attempt.snapshot;
          if (snapshot && typeof snapshot === 'object') latest = snapshot;
          if (attempt.ok && snapshot && steeringProgressed(base, snapshot)) durationProgressed = true;
          if (attempt.ok && snapshot && directionalTurnEvidence(base, snapshot, expected)) return snapshot;
          await game.input({ type: 'joystick', x: 0, y: 0, phase: 'end' });
        }
        // Some valid implementations clear transient turn labels after a
        // duration-bearing action. Only use an active move plus normal wait
        // when the timed action already demonstrated simulation progress;
        // handlers that merely store duration input remain real failures.
        if (durationProgressed) {
          for (const magnitude of [50, 8, 1]) {
            await game.input({ type: 'joystick', x: 0, y: 0, phase: 'start' });
            const activeAttempt = statusOf(await game.input({
              type: 'joystick',
              x: direction * magnitude,
              y: 0,
              phase: 'move'
            }));
            const progressedAttempt = statusOf(await game.input({ type: 'wait', durationMs: 450 }));
            const active = activeAttempt.snapshot;
            const progressed = progressedAttempt.snapshot;
            if (progressedAttempt.ok && progressed && directionalTurnEvidence(base, progressed, expected)) return progressed;
            if (activeAttempt.ok && active && directionalTurnEvidence(base, active, expected)) return active;
            if (progressed && typeof progressed === 'object') latest = progressed;
            else if (active && typeof active === 'object') latest = active;
            await game.input({ type: 'joystick', x: 0, y: 0, phase: 'end' });
          }
        }
        return latest;
      };
      const finishJoystick = async () => {
        const ended = unwrap(await game.input({ type: 'joystick', x: 0, y: 0, phase: 'end' }));
        const neutral = unwrap(await game.input({ type: 'wait', durationMs: 250 }));
        const settled = unwrap(await game.input({ type: 'wait', durationMs: 250 }));
        const firstResidual = headingDelta(ended, neutral);
        const secondResidual = headingDelta(neutral, settled);
        const neutralState = ['damping', 'none'].includes(player(neutral).turningState) ||
          ['damping', 'steady', 'none'].includes(player(neutral).turnTrend);
        const residualDecays = finite(firstResidual) && finite(secondResidual) &&
          (Math.abs(secondResidual) <= 0.01 || Math.abs(secondResidual) < Math.abs(firstResidual) - 0.005);
        return { ended, neutral, settled, ok: neutralState || residualDecays };
      };

      const right = await probeJoystick(before, 1, 'right');
      const rightRelease = await finishJoystick();
      const leftBase = rightRelease.settled;
      const left = await probeJoystick(leftBase, -1, 'left');
      const leftRelease = await finishJoystick();

      const rightDelta = headingDelta(before, right);
      const leftDelta = headingDelta(leftBase, left);
      const rightVisible = directionalTurnEvidence(before, right, 'right');
      const leftVisible = directionalTurnEvidence(leftBase, left, 'left');
      const headingOpposite = signOf(rightDelta, 0.01) !== 0 &&
        signOf(leftDelta, 0.01) !== 0 && Math.sign(rightDelta) !== Math.sign(leftDelta);
      const semanticOpposite = turnStateMatches(right, 'right') && turnStateMatches(left, 'left');
      const turnOpposite = rightVisible && leftVisible && (headingOpposite || semanticOpposite);
      if (!turnOpposite) return FAIL('joystick left/right direction opposite evidence missing');
      if (!rightRelease.ok || !leftRelease.ok) {
        return FAIL('touch release did not neutralize or damp joystick steering');
      }
      return PASS('joystick right and left actions produce opposite steering with release neutral');
    }
  },
  {
    id: 'p2-mouse-click-visible-controls',
    level: 'P2',
    name: 'Mouse click visible controls operate start pause camera fire and restart paths',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function segmentedClick(point) {
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, modifiers: 0 });
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
        await browser.sleep(90);
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
      }
      async function keyTap(code) {
        const key = ({ Enter: 'Enter', KeyC: 'c', KeyP: 'p', Space: ' ' })[code] || code;
        await browser.cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key });
        await browser.sleep(90);
        await browser.cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key });
      }
      await game.reset();
      const startControl = await game.visibleControl('start');
      if (startControl) {
        await segmentedClick(startControl);
        await browser.sleep(500);
      } else {
        await keyTap('Enter');
        await browser.sleep(350);
      }
      let s = await game.snapshot();
      if (!isPlayable(s) && startControl) {
        await keyTap('Enter');
        await browser.sleep(350);
        s = await game.snapshot();
      }
      if (!isPlayable(s)) return FAIL('start control/path did not enter playable state');

      const cameraControl = await game.visibleControl('camera');
      const beforeMode = s.cameraMode;
      if (cameraControl) {
        await segmentedClick(cameraControl);
        await browser.sleep(350);
        s = await game.snapshot();
      }
      if (s.cameraMode === beforeMode) {
        await keyTap('KeyC');
        await browser.sleep(350);
        s = await game.snapshot();
      }
      if (s.cameraMode === beforeMode) return FAIL('camera control/path did not toggle camera');

      const fireControl = await game.visibleControl('fire');
      if (weapon(s).ready === true) {
        const before = s;
        if (fireControl) {
          await segmentedClick(fireControl);
          await browser.sleep(350);
          s = await game.snapshot();
        }
        if (weapon(s).lastFireAccepted !== true && weapon(s).muzzleFeedbackRevision <= weapon(before).muzzleFeedbackRevision) {
          await keyTap('Space');
          await browser.sleep(350);
          s = await game.snapshot();
        }
        if (weapon(s).lastFireAccepted !== true && weapon(s).muzzleFeedbackRevision <= weapon(before).muzzleFeedbackRevision) {
          return FAIL('fire control/path produced no fire evidence');
        }
      }

      const pauseControl = await game.visibleControl('pause');
      if (pauseControl) {
        await segmentedClick(pauseControl);
        await browser.sleep(350);
      } else {
        await keyTap('KeyP');
        await browser.sleep(350);
      }
      s = await game.snapshot();
      if (s.phase !== 'paused' || s.overlayBlocking !== true) {
        if (pauseControl) {
          await keyTap('KeyP');
          await browser.sleep(350);
          s = await game.snapshot();
        }
      }
      if (s.phase !== 'paused' || s.overlayBlocking !== true) return FAIL('pause control/path did not pause/block play');
      const resumeControl = await game.visibleControl('resume');
      if (resumeControl) {
        await segmentedClick(resumeControl);
        await browser.sleep(350);
      } else {
        await keyTap('KeyP');
        await browser.sleep(350);
      }
      s = await game.snapshot();
      if (!isPlayable(s) && resumeControl) {
        await keyTap('KeyP');
        await browser.sleep(350);
        s = await game.snapshot();
      }
      if (!isPlayable(s)) return FAIL('resume control/path did not return to playable state');
      return PASS('visible controls are operable through declared pointer/keyboard paths');
    }
  },
  {
    id: 'p2-boss-higher-level-pressure',
    level: 'P2',
    name: 'Higher level or boss pressure is distinguishable and damageable',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let before;
      try {
        before = await game.ensureScenario('boss_battle', s => isPlayable(s), 'boss_battle not playable');
      } catch (_) {
        before = await game.ensureScenario('higher_level', s => isPlayable(s), 'higher_level not playable');
      }
      if (entities(before).bossPresent !== true && before.level <= 1 && entities(before).activeEnemyCount <= 1) {
        return NA('no declared boss/high-level distinction present');
      }
      const pressure = unwrap(await game.input({ type: 'wait', durationMs: 1200 }));
      const isEnemyTarget = target =>
        target && target.kind === 'enemy' && target.active !== false && target.targetable !== false;
      const enemyTargets = [];
      const seenTargetIds = new Set();
      for (const snapshot of [pressure, before]) {
        for (const target of arr(targets(snapshot).visibleTargets)) {
          if (!isEnemyTarget(target)) continue;
          const key = target.id == null ? 'anonymous-' + enemyTargets.length : String(target.id);
          if (seenTargetIds.has(key)) continue;
          seenTargetIds.add(key);
          enemyTargets.push(target);
        }
      }
      const hasEnemyAim = snapshot =>
        targets(snapshot).lockState === 'enemy' || targets(snapshot).aimTargetKind === 'enemy';
      const aimActionFor = target => {
        const action = { type: 'aimAt', target: 'enemy' };
        if (target && target.id != null) action.targetId = target.id;
        return action;
      };
      let aimed = null;
      for (const enemyTarget of enemyTargets.slice(0, 3)) {
        const aimAction = aimActionFor(enemyTarget);
        aimed = unwrap(await game.input(aimAction));
        if (hasEnemyAim(aimed)) break;
        if (enemyTarget.id != null) {
          aimed = unwrap(await game.input({
            type: 'driveToward',
            target: 'enemy',
            targetId: enemyTarget.id,
            durationMs: 900
          }));
          if (hasEnemyAim(aimed)) break;
          aimed = unwrap(await game.input(aimAction));
          if (hasEnemyAim(aimed)) break;
        }
      }
      if (!hasEnemyAim(aimed)) {
        aimed = unwrap(await game.input({ type: 'aimAt', target: 'enemy' }));
      }
      if (!hasEnemyAim(aimed)) {
        await game.input({ type: 'driveToward', target: 'openSpace', durationMs: 900 });
        aimed = unwrap(await game.input({ type: 'aimAt', target: 'enemy' }));
      }
      if (!hasEnemyAim(aimed)) return FAIL('boss/high-level target cannot be aimed after normal exposure');
      const fireBaseline = aimed;
      const fired = unwrap(await game.input({ type: 'fire', method: 'key' }));
      if (weapon(fired).lastFireAccepted !== true) return FAIL('player cannot fire at boss/high-level enemy');
      let afterFire = fired;
      let enemyDamageEvent = [lastEvent(fired)]
        .some(event => event.type === 'hitEnemy' || event.type === 'destroyEnemy');
      let enemyDestroyed = num(entities(fired).destroyedEnemyCount) >
        num(entities(fireBaseline).destroyedEnemyCount);
      let scoreChanged = num(fired && fired.score) > num(fireBaseline && fireBaseline.score);
      for (let i = 0; i < 8 && !enemyDamageEvent && !enemyDestroyed && !scoreChanged; i++) {
        afterFire = unwrap(await game.input({ type: 'wait', durationMs: 350 }));
        enemyDamageEvent = enemyDamageEvent || [lastEvent(afterFire)]
          .some(event => event.type === 'hitEnemy' || event.type === 'destroyEnemy');
        enemyDestroyed = enemyDestroyed ||
          num(entities(afterFire).destroyedEnemyCount) > num(entities(fireBaseline).destroyedEnemyCount);
        scoreChanged = scoreChanged ||
          num(afterFire && afterFire.score) > num(fireBaseline && fireBaseline.score);
      }
      if (!enemyDamageEvent && !enemyDestroyed && !scoreChanged) {
        return FAIL('player fire produced no observable higher-level/boss damage');
      }
      return PASS('higher-level/boss threat is observable and interactable');
    }
  },
  {
    id: 'p2-powerup-pickup-bounded-effect',
    level: 'P2',
    name: 'Powerup pickup requires driving contact and produces bounded visible effect',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('powerup_visible', s =>
        isPlayable(s) && entities(s).powerupCount > 0, 'no visible powerup');
      const powerupTarget = arr(targets(before).visibleTargets).find(t =>
        t && t.kind === 'powerup' && t.active !== false);
      const driveDurationMs = 1200;
      const maxDriveAttempts = 12;
      const driveAction = { type: 'driveToward', target: 'powerup', durationMs: driveDurationMs };
      if (powerupTarget && powerupTarget.id != null) driveAction.targetId = powerupTarget.id;
      let after = before;
      let collected = false;
      for (let attempt = 0; attempt < maxDriveAttempts && !collected; attempt++) {
        after = unwrap(await game.input(driveAction));
        collected = entities(after).powerupCount < entities(before).powerupCount ||
          arr(player(after).activePowerups).length > arr(player(before).activePowerups).length ||
          lastEvent(after).type === 'powerupCollected';
      }
      if (!collected) return FAIL('driveToward powerup did not collect or activate visible status');
      if (hud(after).statusMessage !== 'powerup' && hud(after).revision === hud(before).revision && render(after).visualRevision === render(before).visualRevision) {
        return FAIL('powerup collection lacks visible HUD/render feedback');
      }
      const repeated = unwrap(await game.input(driveAction));
      if (arr(player(repeated).activePowerups).length > arr(player(after).activePowerups).length + 2) {
        return FAIL('powerups stack without visible bound');
      }
      return PASS('powerup pickup is player-triggered, visible, and bounded');
    }
  },
  {
    id: 'p2-advanced-powerup-cost-benefit',
    level: 'P2',
    name: 'Advanced powerups have observable benefit with cooldown exposure or cap',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('powerup_visible', s => isPlayable(s), 'powerup scenario not playable');
      const picked = unwrap(await game.input({ type: 'driveToward', target: 'powerup', durationMs: 1200 }));
      const active = arr(player(picked).activePowerups);
      if (!active.some(x => ['doubleCannon', 'stealth'].includes(x))) return NA('advanced powerup not present in this implementation');
      const beforeFire = weapon(picked);
      const fired = unwrap(await game.input({ type: 'fire', method: 'key' }));
      if (active.includes('doubleCannon')) {
        if (weapon(fired).lastFireAccepted !== true) return FAIL('double cannon state cannot fire');
        if (!(weapon(fired).projectileCount > beforeFire.projectileCount || weapon(fired).muzzleFeedbackRevision > beforeFire.muzzleFeedbackRevision)) {
          return FAIL('double cannon has no projectile/muzzle benefit');
        }
        if (!(weapon(fired).ready === false || weapon(fired).cooldownRatio < beforeFire.cooldownRatio)) {
          return FAIL('double cannon has no cooldown/cadence cost');
        }
      }
      if (active.includes('stealth')) {
        const exposed = fired;
        if (!arr(player(exposed).activePowerups).includes('stealth') && lastEvent(exposed).visibleFeedback !== true) {
          return FAIL('stealth has no visible feedback or exposure event after firing');
        }
      }
      return PASS('advanced powerup exposes benefit and cost/cap semantics');
    }
  },
  {
    id: 'p2-result-records-do-not-block-restart',
    level: 'P2',
    name: 'Optional result records never block local restart',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let terminal = await game.ensureScenario('enemy_pressure', s => isPlayable(s), 'not playable');
      for (let i = 0; i < 18 && result(terminal).state !== 'gameOver' && terminal.phase !== 'gameOver'; i++) {
        terminal = unwrap(await game.input({ type: 'wait', durationMs: 900 }));
        if (i % 4 === 0) terminal = unwrap(await game.input({ type: 'driveToward', target: 'enemy', durationMs: 500 }));
      }
      if (result(terminal).state !== 'gameOver' && terminal.phase !== 'gameOver') return NA('terminal result not reachable within budget');
      if (result(terminal).restartAvailable !== true && controls(terminal).restartAvailable !== true) {
        return FAIL('restart unavailable while optional leaderboard/records may be pending');
      }
      if (result(terminal).leaderboardAvailable !== true && result(terminal).leaderboardAvailable !== false && result(terminal).leaderboardAvailable !== null) {
        return FAIL('leaderboardAvailable is not optional boolean/null');
      }
      const restarted = unwrap(await game.input({ type: 'restart', method: 'key' }));
      if (!isPlayable(restarted)) return FAIL('restart blocked by optional record flow');
      return PASS('record availability is optional and restart remains local');
    }
  },
  {
    id: 'p2-optional-depth-nonblocking',
    level: 'P2',
    name: 'Optional tuning or atmosphere does not replace or block core combat',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureFreshBattle();
      const waited = unwrap(await game.input({ type: 'wait', durationMs: 1600 }));
      if (waited.phase !== 'playing') return FAIL('optional/ambient activity pushed game out of play unexpectedly');
      if (waited.score !== before.score && lastEvent(waited).scoreDelta === 0) return FAIL('ambient wait changed score without explainable event');
      if (waited.health.current !== before.health.current && player(waited).damageFeedbackActive !== true && lastEvent(waited).healthDelta === 0) {
        return FAIL('ambient wait changed health without damage feedback');
      }
      const moved = unwrap(await game.input({ type: 'holdMove', direction: 'right', durationMs: 450 }));
      const fired = unwrap(await game.input({ type: 'fire', method: 'key' }));
      if (!motionEvidence(waited, moved)) return FAIL('core movement blocked after optional/ambient wait');
      if (weapon(fired).lastFireAccepted !== true && weapon(fired).lastFireRejectedReason !== 'cooldown') {
        return FAIL('core fire path unavailable after optional/ambient wait');
      }
      return PASS('optional depth remains nonblocking and core combat stays explainable');
    }
  }
];

module.exports = { suite };
