// === GDD Coverage Map ===
// M1 state flow and restart: p1-1-click-start-readable, p1-9-click-restart-cleanup
// M2 two-step shooting input: p1-2-key-two-step-shooting-contract, p1-3-click-shot-flight-feedback
// M3 shooting direction and power causality: p1-3-click-shot-flight-feedback, p1-4-direction-opposite-shot-path
// M4 goalkeeper reaction after shot: p1-3-click-shot-flight-feedback, p1-4-direction-opposite-shot-path
// M5 three-zone goalkeeping: p1-5-click-goalkeeper-three-zone-direction, p1-6-key-save-concede-contrast
// M6 score and round progression: p1-7-round-score-invariant-after-two-penalties, p1-10-rejection-invariants-contract
// M7 final result and terminal lock: p1-8-final-result-terminal-lock, p1-9-click-restart-cleanup
// M8 optional settings and atmosphere: p2-1-optional-match-length-setting, p2-2-optional-difficulty-setting, p2-3-optional-atmosphere-setting
//
// === Category Map ===
// Boot & Stability: p0-1-contract-snapshot-schema, p0-2-visible-render-and-hud
// UI Flow & Blocking: p1-1-click-start-readable, p1-9-click-restart-cleanup
// Input Semantics: p1-2-key-two-step-shooting-contract, p1-4-direction-opposite-shot-path, p1-5-click-goalkeeper-three-zone-direction, p1-6-key-save-concede-contrast, p1-11-touch-start-and-save-path
// Core Mechanic Loop: p1-3-click-shot-flight-feedback, p1-7-round-score-invariant-after-two-penalties
// State Machine: p1-8-final-result-terminal-lock, p1-10-rejection-invariants-contract
// Feedback & Observability: p0-2-visible-render-and-hud, p1-12-feedback-hud-scene-sync
// Depth / Optional Systems: p2-1-optional-match-length-setting, p2-2-optional-difficulty-setting, p2-3-optional-atmosphere-setting
//
// === Rationality Map ===
// p1-1-click-start-readable: M1 | real action: browser.mouseClick on playfield | independent observation: phase/screen plus overlay/playfield and HUD | empty-shell failure: API-only start or blocking start overlay fails
// p1-2-key-two-step-shooting-contract: M2 | real action: keyDown/keyUp Space confirm and contract invalid save | independent observation: power locks, direction moves, score/round unchanged | empty-shell failure: one-click shooting or mutable locked power fails
// p1-3-click-shot-flight-feedback: M2/M3/M4 | real action: browser.mouseClick after direction setup | independent observation: ball motion, actor feedback, lastEvent, score delta limit | empty-shell failure: score-only shell or double scoring fails
// p1-4-direction-opposite-shot-path: M3/M4 | real action: browser.mouseClick on left and right direction windows | independent observation: ball screen zone/screenX and Math.sign delta; direction opposite | empty-shell failure: mirrored or same-path left/right shots fail
// p1-5-click-goalkeeper-three-zone-direction: M5 | real action: browser.mouseClick save-left/save-center/save-right regions | independent observation: selectedZone plus keeper pose/screen direction | empty-shell failure: three zones mapped to same response fail
// p1-6-key-save-concede-contrast: M5/M6 | real action: keyDown/keyUp for matching and non-matching save choices | independent observation: saved/conceded event, opponent score delta, HUD | empty-shell failure: pre-baked or input-independent save result fails
// p1-7-round-score-invariant-after-two-penalties: M6 | real action: contract player actions through complete shot and save | independent observation: round side/index, score deltas, phase, HUD | empty-shell failure: no alternation, invalid score jumps, or stale HUD fails
// p1-8-final-result-terminal-lock: M7 | real action: final legal penalty chain plus post-result confirm | independent observation: result screen, result enum, stable final score | empty-shell failure: direct-load result or mutable terminal state fails
// p1-9-click-restart-cleanup: M1/M7 | real action: browser.mouseClick restart region | independent observation: score/round reset, result hidden, start available | empty-shell failure: hidden overlay with stale score or API-only restart fails
// p1-10-rejection-invariants-contract: M6/M7 | real action: contract invalid and duplicate player-level actions | independent observation: score/round/result invariant | empty-shell failure: phase guards missing or repeated scoring fails
// p1-11-touch-start-and-save-path: M1/M5 | real action: Input.dispatchTouchEvent on playfield and save zone | independent observation: phase transition and selectedZone/keeper pose | empty-shell failure: mouse-only or contract-only implementation fails
// p1-12-feedback-hud-scene-sync: M1-M7 | real action: contract core loop transitions | independent observation: snapshot plus HUD text and canvas/draw revision | empty-shell failure: pure hidden-state game, blank scene, or stale HUD fails
// p2-1-optional-match-length-setting: M8 | real action: contract optional setting when exposed | independent observation: round.total/HUD and loop remains valid | empty-shell failure: inert or breaking match length setting fails
// p2-2-optional-difficulty-setting: M8 | real action: contract optional setting when exposed | independent observation: setting summary and subsequent moving indicator/valid round | empty-shell failure: direct score/result setting or broken core loop fails
// p2-3-optional-atmosphere-setting: M8 | real action: contract optional setting when exposed | independent observation: setting summary, playfield nonblocking, core controls still work | empty-shell failure: decorative panel that blocks P1 controls fails

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }
function NA(detail) { return { status: 'NOT_APPLICABLE', detail: detail || '' }; }

const PHASES = new Set(['ready', 'shootingPower', 'shootingDirection', 'shootingFlight', 'goalkeeping', 'roundFeedback', 'result']);
const SCREENS = new Set(['start', 'playing', 'result']);
const PROMPTS = new Set(['start', 'lockPower', 'lockDirection', 'save', 'wait', 'result']);
const RESULTS = new Set(['none', 'win', 'lose', 'draw']);
const EVENTS = new Set(['none', 'powerLocked', 'shotStarted', 'goal', 'miss', 'saved', 'conceded', 'roundAdvanced', 'matchEnded', 'restarted', 'invalidIgnored']);
const SIDES = new Set(['playerShoot', 'playerSave', 'complete']);
const ZONES = new Set(['left', 'center', 'right']);
const SHOT_ZONES = new Set(['left', 'center', 'right', 'wideLeft', 'wideRight']);

function isObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function scoreTotal(s) {
  return (s && s.score ? s.score.player + s.score.opponent : NaN);
}

function scoreDelta(a, b) {
  return {
    player: (b.score?.player ?? 0) - (a.score?.player ?? 0),
    opponent: (b.score?.opponent ?? 0) - (a.score?.opponent ?? 0)
  };
}

function sameScoreRound(a, b) {
  return JSON.stringify(a.score) === JSON.stringify(b.score) &&
    JSON.stringify(a.round) === JSON.stringify(b.round) &&
    a.result === b.result;
}

function normalizeZone(z) {
  if (z === 'wideLeft') return 'left';
  if (z === 'wideRight') return 'right';
  return z;
}

function zoneSign(z) {
  const n = normalizeZone(z);
  if (n === 'left') return -1;
  if (n === 'right') return 1;
  if (n === 'center') return 0;
  return null;
}

function keeperSign(s) {
  const pose = s.actors?.keeperPose || 'none';
  if (String(pose).includes('left')) return -1;
  if (String(pose).includes('right')) return 1;
  if (String(pose).includes('center') || String(pose).includes('save')) return 0;
  return null;
}

function assertSnapshotShape(s) {
  if (!isObj(s)) return 'snapshot is not an object';
  if (!PHASES.has(s.phase)) return `invalid phase ${s.phase}`;
  if (!SCREENS.has(s.screen)) return `invalid screen ${s.screen}`;
  if (!PROMPTS.has(s.prompt)) return `invalid prompt ${s.prompt}`;
  if (!RESULTS.has(s.result)) return `invalid result ${s.result}`;
  if (!isObj(s.score) || !Number.isInteger(s.score.player) || !Number.isInteger(s.score.opponent)) return 'score.player/opponent must be integers';
  if (s.score.player < 0 || s.score.opponent < 0) return 'score must be non-negative';
  if (!isObj(s.round) || !Number.isInteger(s.round.index) || !Number.isInteger(s.round.total) || !SIDES.has(s.round.side)) return 'round summary is invalid';
  if (s.round.index < 0 || s.round.total < 1) return 'round index must be non-negative and total must be positive';
  if (typeof s.canInteractWithPlayfield !== 'boolean') return 'canInteractWithPlayfield must be boolean';
  if (typeof s.overlayBlocking !== 'boolean') return 'overlayBlocking must be boolean';
  if (!Number.isInteger(s.revision)) return 'revision must be an integer';
  if (s.lastEvent !== undefined && !EVENTS.has(s.lastEvent)) return `invalid lastEvent ${s.lastEvent}`;
  return null;
}

function legalPrecondition(name, s) {
  const shape = assertSnapshotShape(s);
  if (shape) return shape;
  if (name !== 'result_ready' && (s.screen === 'result' || s.phase === 'result' || s.result !== 'none')) {
    return `${name} is already terminal`;
  }
  if (name !== 'result_ready' && ['goal', 'miss', 'saved', 'conceded', 'matchEnded'].includes(s.lastEvent)) {
    return `${name} already contains resolved outcome ${s.lastEvent}`;
  }
  if (name === 'fresh_match' && !(s.screen === 'start' && s.result === 'none' && scoreTotal(s) === 0)) return 'fresh_match is not a clean start state';
  if (name === 'shooting_power_ready' && !(s.phase === 'shootingPower' && s.shooting?.powerState === 'moving')) return 'shooting_power_ready must expose moving power state';
  if (name === 'shooting_direction_ready' && !(s.phase === 'shootingDirection' && s.shooting?.powerState === 'locked' && s.shooting?.directionState === 'moving')) return 'shooting_direction_ready must expose locked power and moving direction';
  if (name === 'goalkeeping_live' && !(s.phase === 'goalkeeping' && Array.isArray(s.goalkeeping?.availableZones))) return 'goalkeeping_live must expose available save zones';
  const finalPendingIndex = s.round?.index === s.round?.total ||
    s.round?.index === s.round?.total - 1;
  if (name === 'final_penalty_pending' && !(finalPendingIndex && s.phase !== 'result')) return 'final_penalty_pending must be the last unresolved penalty';
  if (name === 'result_ready' && !(s.screen === 'result' && s.phase === 'result' && RESULTS.has(s.result) && s.result !== 'none')) return 'result_ready must be a natural terminal result';
  return null;
}

function createGameDriver(browser) {
  async function evalGame(expr) {
    const out = await browser.eval(`(async function(){ ${expr} })()`);
    if (out && out.__l2_err__) throw new Error(out.__l2_err__);
    return out;
  }

  return {
    async waitForReady() {
      await browser.sleep(300);
      return this.snapshot();
    },
    async hasContract() {
      return !!(await browser.eval(`!!(window.__gameTest && typeof window.__gameTest.reset === 'function' && typeof window.__gameTest.getSnapshot === 'function' && typeof window.__gameTest.input === 'function' && typeof window.__gameTest.loadScenario === 'function')`));
    },
    async reset() {
      return evalGame(`
        const t = window.__gameTest;
        if (!t || typeof t.reset !== 'function') return { missingContract: true };
        return await t.reset();
      `);
    },
    async snapshot() {
      return evalGame(`
        const t = window.__gameTest;
        if (t && typeof t.getSnapshot === 'function') return await t.getSnapshot();
        return { missingContract: true };
      `);
    },
    async input(action) {
      const payload = JSON.stringify(action);
      return evalGame(`
        const t = window.__gameTest;
        if (!t || typeof t.input !== 'function') return { missingContract: true };
        return await t.input(${payload});
      `);
    },
    async loadScenario(name, options) {
      const payload = JSON.stringify({ name, options: options || {} });
      return evalGame(`
        const t = window.__gameTest;
        if (!t || typeof t.loadScenario !== 'function') return { missingContract: true };
        const p = ${payload};
        return await t.loadScenario(p.name, p.options);
      `);
    },
    async loadLegalScenario(name, options) {
      const s = await this.loadScenario(name, options);
      const err = legalPrecondition(name, s);
      if (err) throw new Error(`${name} illegal precondition: ${err}`);
      return s;
    },
    async waitAction(until, ms) {
      return this.input({ type: 'wait', until, ms: ms || 100 });
    },
    async waitUntil(predicate, timeoutMs, stepMs) {
      const end = Date.now() + timeoutMs;
      let last = await this.snapshot();
      while (Date.now() < end) {
        if (predicate(last)) return last;
        await this.waitAction('indicatorMoved', stepMs || 80);
        await browser.sleep(stepMs || 80);
        last = await this.snapshot();
      }
      return last;
    },
    async region(name) {
      const s = await this.snapshot();
      const r = s.observableRegions || {};
      const map = {
        playfield: r.playfield,
        restart: r.restart,
        saveLeft: r.saveLeft,
        saveCenter: r.saveCenter,
        saveRight: r.saveRight
      };
      const hit = map[name];
      if (hit && hit.visible !== false && num(hit.centerX) && num(hit.centerY)) return hit;
      throw new Error(`no observable region for ${name}; expose observableRegions.${name}`);
    },
    async readUi() {
      return browser.eval(`(function(){
        const text = (document.body && document.body.innerText || '').replace(/\\s+/g, ' ').trim();
        const canvases = Array.from(document.querySelectorAll('canvas')).map(c => {
          const b = c.getBoundingClientRect();
          return { width: c.width || 0, height: c.height || 0, cssW: b.width, cssH: b.height, visible: b.width > 20 && b.height > 20 };
        });
        const visibleButtons = Array.from(document.querySelectorAll('button,[role="button"],input[type="button"],input[type="range"],select')).filter(el => {
          const b = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          return b.width > 1 && b.height > 1 && st.visibility !== 'hidden' && st.display !== 'none';
        }).map(el => ({ text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim(), tag: el.tagName, role: el.getAttribute('role') || '' }));
        return { text, canvases, visibleButtons, l2: window.__l2 || null };
      })()`);
    },
    async completeCurrentPenalty() {
      let s = await this.snapshot();
      if (s.phase === 'shootingPower') {
        s = await this.input({ type: 'confirm' });
        await this.waitUntil(x => x.phase === 'shootingDirection', 1200, 80);
        s = await this.input({ type: 'confirm' });
        s = await this.waitAction('shotResolved', 1800);
      } else if (s.phase === 'shootingDirection') {
        s = await this.input({ type: 'confirm' });
        s = await this.waitAction('shotResolved', 1800);
      } else if (s.phase === 'goalkeeping') {
        const zone = normalizeZone(s.goalkeeping?.incomingZone || 'center');
        s = await this.input({ type: 'save', zone: ZONES.has(zone) ? zone : 'center' });
        s = await this.waitAction('shotResolved', 1800);
      }
      await browser.sleep(250);
      return this.snapshot();
    }
  };
}

async function ensureContract(driver) {
  if (!(await driver.hasContract())) throw new Error('window.__gameTest contract is missing or incomplete');
}

async function waitForResult(driver) {
  const end = Date.now() + 3500;
  let s = await driver.snapshot();
  while (Date.now() < end) {
    if (s.screen === 'result' || s.phase === 'result') return s;
    await driver.waitAction('resultShown', 200);
    await new Promise(r => setTimeout(r, 120));
    s = await driver.snapshot();
  }
  return s;
}

const suite = [
  {
    id: 'p0-1-contract-snapshot-schema',
    level: 'P0',
    name: 'Contract exposes reset/getSnapshot/input/loadScenario and stable Snapshot schema',
    timeoutMs: 8000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const s = await game.reset();
      const err = assertSnapshotShape(s);
      if (err) return FAIL(err);
      if (s.screen === 'result' || s.result !== 'none') return FAIL('reset must not start in terminal result');
      const again = await game.snapshot();
      const err2 = assertSnapshotShape(again);
      if (err2) return FAIL(`getSnapshot after reset: ${err2}`);
      return PASS(`phase=${again.phase}, screen=${again.screen}, score=${again.score.player}-${again.score.opponent}`);
    }
  },
  {
    id: 'p0-2-visible-render-and-hud',
    level: 'P0',
    name: 'Initial scene and HUD are observable, nonblank, and synchronized with snapshot',
    timeoutMs: 9000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const s = await game.reset();
      const ui = await game.readUi();
      const canvas = (ui.canvases || []).find(c => c.visible);
      const playfield = s.observableRegions?.playfield;
      const equivalentSurface = playfield && playfield.visible !== false &&
        num(playfield.width) && num(playfield.height) && playfield.width > 20 && playfield.height > 20;
      if (!canvas && !equivalentSurface) return FAIL('no visible playfield canvas or equivalent surface region');
      const domTextAvailable = Boolean(ui.text && ui.text.length >= 4);
      if (!domTextAvailable && !canvas) return FAIL('no visible HUD/status text');
      const hash1 = await browser.canvasPixelHash();
      await browser.sleep(250);
      const hash2 = await browser.canvasPixelHash();
      if (hash1 === null || hash2 === null) return FAIL('canvas/screenshot hash unavailable');
      const uiText = String(ui.text || '');
      if (domTextAvailable) {
        const scoreVisible = uiText.includes(String(s.score.player)) && uiText.includes(String(s.score.opponent));
        const roundVisible = uiText.includes(String(s.round.index)) && uiText.includes(String(s.round.total));
        if (!scoreVisible && !roundVisible && !uiText.match(/\b(start|round|score)\b|开始|比分|轮/i)) {
          return FAIL('visible HUD does not expose synchronized score, round, or start/status information');
        }
      }
      const surfaceSize = canvas
        ? `${Math.round(canvas.cssW)}x${Math.round(canvas.cssH)}`
        : `${Math.round(playfield.width)}x${Math.round(playfield.height)} semantic region`;
      return PASS(`visible surface ${surfaceSize}, phase=${s.phase}`);
    }
  },
  {
    id: 'p1-1-click-start-readable',
    level: 'P1',
    name: 'Real click starts match and clears blocking start overlay',
    timeoutMs: 9000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const before = await game.loadScenario('fresh_match');
      if (!before ||
          before.screen !== 'start' ||
          before.phase !== 'ready' ||
          before.result !== 'none' ||
          !before.score ||
          !Number.isInteger(before.score.player) ||
          !Number.isInteger(before.score.opponent) ||
          before.score.player < 0 ||
          before.score.opponent < 0 ||
          scoreTotal(before) !== 0 ||
          !before.round ||
          !Number.isInteger(before.round.index) ||
          !Number.isInteger(before.round.total) ||
          !SIDES.has(before.round.side) ||
          before.round.index < 0 ||
          before.round.total < 1) {
        return FAIL('fresh_match did not expose a clean ready first-round state');
      }
      const r = before.observableRegions?.playfield;
      if (!r ||
          !num(r.centerX) ||
          !num(r.centerY) ||
          !num(r.width) ||
          !num(r.height) ||
          r.width <= 0 ||
          r.height <= 0) {
        return FAIL('fresh_match did not expose a usable playfield region');
      }
      await browser.mouseClick(r.centerX, r.centerY);
      await browser.sleep(250);
      const after = await game.snapshot();
      if (before.screen !== 'start') return FAIL('fresh_match did not begin on start screen');
      if (!(after.screen === 'playing' && after.phase === 'shootingPower')) return FAIL(`click did not enter shooting power phase: ${after.screen}/${after.phase}`);
      if (after.overlayBlocking || !after.canInteractWithPlayfield) return FAIL('playfield is still blocked after starting');
      if (scoreTotal(after) !== scoreTotal(before) || after.round.index !== before.round.index) return FAIL('start click changed score or round before a penalty');
      return PASS('real click started playable shootingPower state with score/round stable');
    }
  },
  {
    id: 'p1-2-key-two-step-shooting-contract',
    level: 'P1',
    name: 'Keyboard confirm locks power, exposes direction, and rejects wrong-stage save input',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const before = await game.loadLegalScenario('shooting_power_ready');
      await game.waitAction('indicatorMoved', 180);
      const moving = await game.snapshot();
      await browser.keyDown('Space');
      await browser.keyUp('Space');
      await browser.sleep(180);
      const after = await game.snapshot();
      if (after.phase !== 'shootingDirection') return FAIL(`Space did not move to shootingDirection: ${after.phase}`);
      if (after.shooting?.powerState !== 'locked' || after.shooting?.directionState !== 'moving') return FAIL('power was not locked while direction became moving');
      if (scoreTotal(after) !== scoreTotal(before) || after.round.index !== before.round.index) return FAIL('first confirm changed score or round');
      if (moving.revision === before.revision && moving.shooting?.lockedPowerBand === before.shooting?.lockedPowerBand) return FAIL('waiting did not visibly move or revise power indicator');
      const invalid = await game.input({ type: 'save', zone: 'left' });
      if (!sameScoreRound(after, invalid)) return FAIL('wrong-stage save mutated score/round/result during shooting direction');
      return PASS('keyboard confirm caused lockPower without scoring; invalid save preserved invariants');
    }
  },
  {
    id: 'p1-3-click-shot-flight-feedback',
    level: 'P1',
    name: 'Real click second confirm triggers shot flight, actor feedback, and bounded scoring',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const before = await game.loadLegalScenario('shooting_direction_ready');
      await game.waitAction('indicatorMoved', 160);
      const r = await game.region('playfield');
      await browser.mouseClick(r.centerX, r.centerY);
      await browser.sleep(250);
      const flight = await game.snapshot();
      await game.input({ type: 'wait', ms: 200 });
      const reaction = await game.snapshot();
      await game.waitAction('shotResolved', 1800);
      await browser.sleep(250);
      const after = await game.snapshot();
      if (!['shootingFlight', 'roundFeedback', 'goalkeeping', 'result'].includes(flight.phase) && flight.lastEvent !== 'shotStarted') return FAIL(`second click did not start flight/feedback: ${flight.phase}/${flight.lastEvent}`);
      if (!flight.ball || !['towardGoal', 'resolved'].includes(flight.ball.motion)) return FAIL('ball motion did not show shot toward goal');
      if (!flight.actors || !['kick', 'celebrate', 'disappointed', 'ready'].includes(flight.actors.shooterPose || '')) return FAIL('shooter feedback pose missing after shot');
      const keeperPoses = [flight.actors?.keeperPose, reaction.actors?.keeperPose, after.actors?.keeperPose];
      if (!keeperPoses.some(p => ['left', 'center', 'right', 'save'].includes(p))) return FAIL('keeper feedback pose missing during shot/feedback');
      const d = scoreDelta(before, after);
      if (d.player < 0 || d.opponent !== 0 || d.player > 1) return FAIL(`invalid scoring delta for one player shot: ${JSON.stringify(d)}`);
      if (!['goal', 'miss', 'saved', 'roundAdvanced', 'matchEnded', 'none'].includes(after.lastEvent)) return FAIL(`unexpected shot result event: ${after.lastEvent}`);
      return PASS(`shot produced ${after.lastEvent}, player score delta ${d.player}`);
    }
  },
  {
    id: 'p1-4-direction-opposite-shot-path',
    level: 'P1',
    name: 'Left and right shot confirmations produce direction opposite visible paths',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      async function shoot(desired) {
        const targetSign = zoneSign(desired);
        for (let attempt = 0; attempt < 24; attempt++) {
          await game.loadLegalScenario('shooting_direction_ready');
          // Advance the public timed indicator through bounded player-level
          // waits. Each reset starts at the same side, so increasing the
          // number of waits samples both left and right windows without
          // inspecting private implementation state.
          for (let step = 0; step <= attempt; step++) {
            await game.input({ type: 'wait', until: 'indicatorMoved', ms: 160 });
          }
          await browser.sleep(40);
          const pre = await game.snapshot();
          const r = await game.region('playfield');
          await browser.mouseClick(r.centerX, r.centerY);
          await browser.sleep(250);
          let mid = await game.snapshot();
          if (!mid.ball || (!mid.ball.screenZone && !num(mid.ball.screenX))) {
            await game.waitAction('shotResolved', 300);
            mid = await game.snapshot();
          }
          const lockedSign = zoneSign(mid.shooting?.lockedDirectionZone || mid.ball?.screenZone);
          if (lockedSign === targetSign || (targetSign !== 0 && zoneSign(mid.ball?.screenZone) === targetSign)) {
            return { pre, mid };
          }
        }
        throw new Error(`could not lock an observable ${desired} shot with player-level timing`);
      }
      const left = await shoot('left');
      const right = await shoot('right');
      const leftSign = zoneSign(left.mid.ball?.screenZone);
      const rightSign = zoneSign(right.mid.ball?.screenZone);
      let relationOk = false;
      if (leftSign !== null && rightSign !== null) {
        relationOk = Math.sign(leftSign) === -Math.sign(rightSign) && Math.sign(leftSign) < 0;
      } else if (num(left.mid.ball?.screenX) && num(right.mid.ball?.screenX)) {
        const center = left.pre.observableRegions?.playfield?.centerX || right.pre.observableRegions?.playfield?.centerX;
        if (!num(center)) return FAIL('ball.screenX direction comparison requires observableRegions.playfield.centerX');
        relationOk = Math.sign(left.mid.ball.screenX - center) === -Math.sign(right.mid.ball.screenX - center);
      }
      if (!relationOk) return FAIL('left/right confirmations did not produce direction opposite visible ball paths');
      return PASS('Math.sign confirmed direction opposite relationship for left and right shot paths');
    }
  },
  {
    id: 'p1-5-click-goalkeeper-three-zone-direction',
    level: 'P1',
    name: 'Real clicks on left, center, and right save regions map to visible keeper directions',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const cases = [
        ['left', 'saveLeft', -1],
        ['center', 'saveCenter', 0],
        ['right', 'saveRight', 1]
      ];
      for (const [zone, regionName, expectedSign] of cases) {
        const before = await game.loadLegalScenario('goalkeeping_live', { incomingZone: 'center' });
        const r = await game.region(regionName);
        await browser.mouseClick(r.centerX, r.centerY);
        await browser.sleep(180);
        const after = await game.snapshot();
        if (after.goalkeeping?.selectedZone !== zone) return FAIL(`${zone} click selected ${after.goalkeeping?.selectedZone || 'nothing'}`);
        const observed = keeperSign(after);
       if (observed !== expectedSign) return FAIL(`${zone} click produced wrong or missing visible keeper direction sign ${observed}`);
        const d = scoreDelta(before, after);
        if (d.player !== 0 || d.opponent < 0 || d.opponent > 1) return FAIL(`single save click caused invalid score delta ${JSON.stringify(d)}`);
      }
      return PASS('left/center/right real clicks map to distinct selected zones and keeper directions');
    }
  },
  {
    id: 'p1-6-key-save-concede-contrast',
    level: 'P1',
    name: 'Keyboard save choice contrasts matching save and non-matching concede paths',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const scenarioProbe = await game.loadLegalScenario('goalkeeping_live', { incomingZone: 'right' });
      if (scenarioProbe.goalkeeping?.incomingZone !== 'right') return FAIL('goalkeeping_live did not honor requested incoming zone: ' + (scenarioProbe.goalkeeping?.incomingZone || 'unknown'));
      const matchedBefore = await game.loadLegalScenario('goalkeeping_live', { incomingZone: 'left' });
      if (matchedBefore.goalkeeping?.incomingZone !== 'left') return FAIL('matching scenario did not expose requested incoming zone: ' + (matchedBefore.goalkeeping?.incomingZone || 'unknown'));
      await browser.keyDown('KeyA');
      await browser.keyUp('KeyA');
      await browser.sleep(120);
      const matchedChoice = await game.snapshot();
      await game.input({ type: 'wait', until: 'shotResolved' });
      await browser.sleep(250);
      const matched = await game.snapshot();
      const mismatchBefore = await game.loadLegalScenario('goalkeeping_live', { incomingZone: 'left' });
      if (mismatchBefore.goalkeeping?.incomingZone !== 'left') return FAIL('mismatch scenario did not expose requested incoming zone: ' + (mismatchBefore.goalkeeping?.incomingZone || 'unknown'));
      await browser.keyDown('KeyD');
      await browser.keyUp('KeyD');
      await browser.sleep(120);
      const mismatchChoice = await game.snapshot();
      await game.input({ type: 'wait', until: 'shotResolved' });
      await browser.sleep(250);
      const mismatch = await game.snapshot();
      if (matchedChoice.goalkeeping?.selectedZone !== 'left') return FAIL(`KeyA did not select left save zone during goalkeeping: ${matchedChoice.goalkeeping?.selectedZone || 'none'}`);
      if (mismatchChoice.goalkeeping?.selectedZone !== 'right') return FAIL(`KeyD did not select right save zone during goalkeeping: ${mismatchChoice.goalkeeping?.selectedZone || 'none'}`);
      if (matched.lastEvent !== 'saved') return FAIL(`matching save did not produce saved event: ${matched.lastEvent}`);
      if (mismatch.lastEvent !== 'conceded') return FAIL(`non-matching save did not produce conceded event: ${mismatch.lastEvent}`);
      const md = scoreDelta(matchedBefore, matched);
      const xd = scoreDelta(mismatchBefore, mismatch);
      if (md.opponent !== 0) return FAIL('matched save still awarded opponent score');
      if (xd.opponent !== 1) return FAIL('mismatched save did not award exactly one opponent point');
      return PASS(`matched=${matched.lastEvent}, mismatch=${mismatch.lastEvent}, conceded delta=${xd.opponent}`);
    }
  },
  {
    id: 'p1-7-round-score-invariant-after-two-penalties',
    level: 'P1',
    name: 'Completing a shot then a save advances attack/defense with bounded scoring',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const shotBefore = await game.loadLegalScenario('shooting_direction_ready');
      const shotAfter = await game.completeCurrentPenalty();
      await game.waitAction('roundAdvanced', 1800);
      const afterRound = await game.snapshot();
      const shotDelta = scoreDelta(shotBefore, shotAfter);
      if (shotDelta.player < 0 || shotDelta.player > 1 || shotDelta.opponent !== 0) return FAIL(`invalid player shot score delta ${JSON.stringify(shotDelta)}`);
      if (afterRound.round.index < shotBefore.round.index) return FAIL('round index moved backward after shot');
      const saveBefore = await game.loadLegalScenario('goalkeeping_live', { incomingZone: 'center' });
      await game.input({ type: 'save', zone: 'center' });
      await game.waitAction('shotResolved', 1800);
      await game.waitAction('roundAdvanced', 1800);
      const saveAfter = await game.snapshot();
      const saveDelta = scoreDelta(saveBefore, saveAfter);
      if (saveDelta.opponent < 0 || saveDelta.opponent > 1 || saveDelta.player !== 0) return FAIL(`invalid save score delta ${JSON.stringify(saveDelta)}`);
      if (saveAfter.round.index < saveBefore.round.index) return FAIL('round index moved backward after save');
      return PASS(`bounded deltas shot=${shotDelta.player}, saveOpponent=${saveDelta.opponent}`);
    }
  },
  {
    id: 'p1-8-final-result-terminal-lock',
    level: 'P1',
    name: 'Final legal penalty reaches result and terminal state rejects further play input',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      await game.loadLegalScenario('final_penalty_pending');
      await game.completeCurrentPenalty();
      const result = await waitForResult(game);
      if (!(result.screen === 'result' && result.phase === 'result' && result.result !== 'none')) return FAIL(`final penalty did not show result: ${result.screen}/${result.phase}/${result.result}`);
      const finalScore = JSON.stringify(result.score);
      await game.input({ type: 'confirm' });
      await game.input({ type: 'save', zone: 'left' });
      await game.waitAction('shotResolved', 300);
      const after = await game.snapshot();
      if (JSON.stringify(after.score) !== finalScore || after.result !== result.result) return FAIL('terminal result changed after extra play input');
      return PASS(`terminal result ${result.result} locked final score ${result.score.player}-${result.score.opponent}`);
    }
  },
  {
    id: 'p1-9-click-restart-cleanup',
    level: 'P1',
    name: 'Real click restart clears result, score, round, and temporary action state',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      await game.loadLegalScenario('result_ready');
      const r = await game.region('restart');
      await browser.mouseClick(r.centerX, r.centerY);
      await browser.sleep(250);
      const after = await game.snapshot();
      if (!(after.screen === 'start' || after.phase === 'ready')) return FAIL(`restart click did not return to start/ready: ${after.screen}/${after.phase}`);
      if (after.result !== 'none') return FAIL('restart did not clear result enum');
      if (scoreTotal(after) !== 0) return FAIL(`restart did not reset score: ${after.score.player}-${after.score.opponent}`);
      if (!Number.isInteger(after.round.index) || (after.round.index !== 0 && after.round.index !== 1)) {
        return FAIL(`restart did not reset to first round: ${after.round.index}`);
      }
      if (after.shooting?.powerState === 'locked' || after.shooting?.directionState === 'locked' ||
          ['left', 'center', 'right'].includes(after.goalkeeping?.selectedZone)) {
        return FAIL('restart left temporary shooting/goalkeeping selections visible');
      }
      return PASS('real restart click returned to clean start state');
    }
  },
  {
    id: 'p1-10-rejection-invariants-contract',
    level: 'P1',
    name: 'Invalid-stage and duplicate actions preserve score, round, and terminal invariants',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const fresh = await game.loadLegalScenario('fresh_match');
      const badStartSave = await game.input({ type: 'save', zone: 'left' });
      if (!sameScoreRound(fresh, badStartSave)) return FAIL('save in fresh_match changed score/round/result');
      await game.loadLegalScenario('shooting_direction_ready');
      await game.input({ type: 'confirm' });
      const inFlight = await game.snapshot();
      await game.input({ type: 'confirm' });
      await game.input({ type: 'save', zone: 'right' });
      const afterDuplicates = await game.snapshot();
      const d = scoreDelta(inFlight, afterDuplicates);
      if (d.player > 1 || d.opponent > 1 || d.player < 0 || d.opponent < 0) return FAIL(`duplicate in-flight input caused impossible score delta ${JSON.stringify(d)}`);
      const terminal = await game.loadLegalScenario('result_ready');
      await game.input({ type: 'confirm' });
      await game.input({ type: 'save', zone: 'center' });
      const terminalAfter = await game.snapshot();
      if (!sameScoreRound(terminal, terminalAfter)) return FAIL('terminal state accepted play input');
      return PASS('invalid and duplicate inputs preserved score/round/result invariants');
    }
  },
  {
    id: 'p1-11-touch-start-and-save-path',
    level: 'P1',
    name: 'Real touch input can start play and choose a save zone',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      await game.loadLegalScenario('fresh_match');
      const play = await game.region('playfield');
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: play.centerX, y: play.centerY, id: 1, radiusX: 4, radiusY: 4, force: 1 }] });
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await browser.sleep(250);
      const started = await game.snapshot();
      if (!(started.screen === 'playing' && started.phase === 'shootingPower')) return FAIL('touch on playfield did not start match');
      await game.loadLegalScenario('goalkeeping_live', { incomingZone: 'right' });
      await game.waitUntil(s => {
        const saveRight = s.observableRegions?.saveRight;
        return saveRight && saveRight.visible !== false && Number.isFinite(saveRight.centerX) && Number.isFinite(saveRight.centerY);
      }, 1200, 50);
      const save = await game.region('saveRight');
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: save.centerX, y: save.centerY, id: 2, radiusX: 4, radiusY: 4, force: 1 }] });
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await browser.sleep(250);
      const after = await game.snapshot();
      if (after.goalkeeping?.selectedZone !== 'right') return FAIL(`touch saveRight selected ${after.goalkeeping?.selectedZone || 'nothing'}`);
      if (keeperSign(after) !== null && keeperSign(after) !== 1) return FAIL('touch saveRight did not produce right keeper direction');
      return PASS('touch path starts play and selects right save zone');
    }
  },
  {
    id: 'p1-12-feedback-hud-scene-sync',
    level: 'P1',
    name: 'HUD and visible scene stay synchronized through core transitions',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const start = await game.reset();
      const uiStart = await game.readUi();
      const hashStart = await browser.canvasPixelHash();
      await game.input({ type: 'start' });
      await game.input({ type: 'confirm' });
      const mid = await game.snapshot();
      const uiMid = await game.readUi();
      const hashMid = await browser.canvasPixelHash();
      await game.input({ type: 'confirm' });
      await game.waitAction('shotResolved', 1800);
      const after = await game.snapshot();
      const uiAfter = await game.readUi();
     const hashAfter = await browser.canvasPixelHash();
     if (uiStart.text === uiMid.text && start.revision === mid.revision) return FAIL('start/confirm transitions did not change HUD or snapshot revision');
      const sceneChanged = hashStart !== hashMid || hashMid !== hashAfter || (uiAfter.l2?.drawCalls || 0) >= 5;
      if (!sceneChanged) return FAIL('scene did not visibly update during core shooting loop');
     const scoreText = `${after.score.player}`;
      const domShowsScore = String(uiAfter.text).includes(scoreText);
      const visibleCanvas = Array.isArray(uiAfter.canvases) &&
        uiAfter.canvases.some(c => c.visible && c.width > 20 && c.height > 20);
      if (!domShowsScore && !visibleCanvas) return FAIL('visible HUD does not expose current score summary');
      if (after.screen === 'playing' && after.overlayBlocking) return FAIL('playing state has blocking overlay');
      return PASS('snapshot, HUD, and scene evidence changed through core loop');
    }
  },
  {
    id: 'p2-1-optional-match-length-setting',
    level: 'P2',
    name: 'Optional match length setting changes total rounds without breaking core loop',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const before = await game.reset();
      const supported = before.settings?.supportedActions || before.matchSettings?.supportedActions || [];
      const adapterSetting = Array.isArray(supported) && supported.includes('setting');
      let target = 3;
      let changed;
      if (adapterSetting) {
        changed = await game.input({ type: 'setting', setting: 'matchLength', value: target });
        if (changed.missingContract || changed.lastEvent === 'invalidIgnored') return FAIL('advertised match-length setting action was ignored');
      } else {
        const publicLength = Number.isInteger(before.settings?.matchLength)
          ? before.settings.matchLength
          : (Number.isInteger(before.matchSettings?.matchLength) ? before.matchSettings.matchLength : null);
        const visibleSetting = await browser.eval(`(function(current){
          const visible = el => {
            if (!el || el.disabled) return false;
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return rect.width > 8 && rect.height > 8 && style.display !== 'none' &&
              style.visibility !== 'hidden' && style.pointerEvents !== 'none' &&
              Number(style.opacity || 1) > 0.02;
          };
          const controls = Array.from(document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"],a,[tabindex]'))
            .filter(visible);
          const candidates = controls.map(el => {
            const label = [el.getAttribute('aria-label'), el.textContent, el.value, el.title]
              .filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim();
            const match = label.match(/(?:^|\\s)(3|5|7|9)(?:\\s|$)/);
            if (!match) return null;
            let context = '';
            for (let node = el, depth = 0; node && depth < 3; node = node.parentElement, depth++) {
              context += ' ' + (node.innerText || node.textContent || '');
            }
            if (!/(match|penalt|round|length|比赛|罚球|轮|回合)/i.test(context)) return null;
            const rect = el.getBoundingClientRect();
            const cls = typeof el.className === 'string' ? el.className : '';
            const selected = /(?:^|\\s)(?:active|checked|chosen|current|on|selected|sel)(?:\\s|$)/i.test(cls) ||
              el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-selected') === 'true' ||
              el.getAttribute('aria-pressed') === 'true';
            return { value: Number(match[1]), selected, x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2, label: label.slice(0, 80) };
          }).filter(Boolean);
          const selected = candidates.find(c => c.selected);
          return candidates.find(c => c.value !== (current == null ? selected?.value : current)) || candidates[0] || null;
        })(${JSON.stringify(publicLength)})`);
        if (!visibleSetting) return NA('no player-visible match-length setting was discoverable');
        target = visibleSetting.value;
        await browser.mouseClick(visibleSetting.x, visibleSetting.y);
        await browser.sleep(250);
        changed = await game.snapshot();
      }
      if (changed.score.player !== before.score.player || changed.score.opponent !== before.score.opponent) return FAIL('setting changed score directly');
      if (changed.result !== 'none') return FAIL('setting directly changed match result');
      await game.input({ type: 'start' });
      const playing = await game.snapshot();
      const expectedTotals = new Set([target, target * 2]);
      if (!expectedTotals.has(playing.round.total)) return FAIL(`match length setting not reflected in round total: ${playing.round.total}`);
      if (playing.phase !== 'shootingPower') return FAIL('core loop did not remain startable after match length setting');
      let state = playing;
      const maxSteps = Math.max(20, target * 2 + 4);
      for (let step = 0; step < maxSteps && state.screen !== 'result' && state.phase !== 'result'; step++) {
        if (state.phase === 'roundFeedback') state = await game.waitAction('roundAdvanced', 200);
        else if (['shootingPower', 'shootingDirection', 'goalkeeping'].includes(state.phase)) state = await game.completeCurrentPenalty();
        else state = await game.waitAction('resultShown', 250);
      }
      if (state.screen !== 'result' || state.phase !== 'result') return FAIL('match length setting did not complete the result loop');
      if (!Number.isInteger(state.score.player) || !Number.isInteger(state.score.opponent) || state.score.player < 0 || state.score.opponent < 0)
        return FAIL('match length setting produced an invalid final score');
      return PASS(`match length setting reflected round total ${playing.round.total} and completed the result loop`);
    }
  },
  {
    id: 'p2-2-optional-difficulty-setting',
    level: 'P2',
    name: 'Optional difficulty or indicator speed setting affects later play without direct scoring',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const before = await game.reset();
      if (!before.settings && !before.matchSettings && !before.controls?.settings) return NA('no optional difficulty/speed setting exposed');
      const supported = before.settings?.supportedActions || before.matchSettings?.supportedActions || [];
      if (Array.isArray(supported) && supported.length > 0 && !supported.includes('setting')) return NA('settings exposed without public setting action');
      const changed = await game.input({ type: 'setting', setting: 'indicatorSpeed', value: 'fast' });
      if (changed.lastEvent === 'invalidIgnored') return NA('difficulty/speed setting not exposed in public contract');
      if (scoreTotal(changed) !== scoreTotal(before) || changed.result !== 'none') return FAIL('difficulty setting directly changed score or result');
      await game.loadLegalScenario('shooting_power_ready');
      const a = await game.snapshot();
      await game.waitAction('indicatorMoved', 300);
      const b = await game.snapshot();
      if (a.revision === b.revision && a.shooting?.lockedPowerBand === b.shooting?.lockedPowerBand) return FAIL('indicator did not remain observable after setting change');
      return PASS('optional setting preserved core shooting indicator and did not score directly');
    }
  },
  {
    id: 'p2-3-optional-atmosphere-setting',
    level: 'P2',
    name: 'Optional atmosphere setting does not block playfield or hide core HUD',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await ensureContract(game);
      const before = await game.reset();
      const settings = before.settings || before.matchSettings;
      const settingKeys = settings && typeof settings === 'object' ? Object.keys(settings) : [];
      const hasAtmosphereSetting = settingKeys.some(key => /atmos|ambien|theme|tone|volume|sound|audio|stadium/i.test(key));
      if (!hasAtmosphereSetting) return NA('no optional atmosphere setting exposed');
      const supported = settings?.supportedActions || [];
     if (Array.isArray(supported) && supported.length > 0 && !supported.includes('setting')) return NA('settings exposed without public setting action');
      const changed = await game.input({ type: 'setting', setting: 'atmosphere', value: 'alternate' });
      if (changed.lastEvent === 'invalidIgnored') return NA('atmosphere setting not exposed in public contract');
      await game.input({ type: 'start' });
      const after = await game.snapshot();
      const ui = await game.readUi();
      if (after.overlayBlocking || !after.canInteractWithPlayfield) return FAIL('atmosphere setting left playfield blocked');
      const uiText = String(ui.text || '');
      const count = value => {
        const token = String(value);
        return token ? uiText.split(token).length - 1 : 0;
      };
      const scorePairVisible = /\d+\s*[-:]\s*\d+/.test(uiText);
      const scoreNodesVisible = count(after.score.player) > 0 && count(after.score.opponent) > 0 &&
        /\b(?:you|player|cpu|opponent|score)\b|比分/i.test(uiText);
      const roundVisible = count(after.round.index) > 0 && count(after.round.total) > 0 &&
        /\b(?:round|penalty|turn|match)\b|轮|回合/i.test(uiText);
      if (!uiText || !(scorePairVisible || scoreNodesVisible || roundVisible)) return FAIL('atmosphere setting hid core HUD');
      if (after.score.player < 0 || after.score.opponent < 0) return FAIL('atmosphere setting produced negative score');
      return PASS('optional atmosphere setting kept core playfield and HUD usable');
    }
  }
];

module.exports = { suite };
