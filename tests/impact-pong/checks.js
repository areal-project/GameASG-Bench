'use strict';

// === GDD Coverage Map ===
// M1 Boot, loading gate, start, mode entry -> p0-contract-boot-schema, p1-real-start-visible, p1-real-menu-mode-switch
// M2 Readable 3D table, net, paddles, ball -> p0-contract-boot-schema, p2-feedback-visual-emphasis
// M3 Paddle activation gating -> p1-real-activation-gated-pointer, p1-real-touch-activation-move, p1-contract-invalid-actions
// M4 Relative paddle movement and bounds -> p1-real-activation-gated-pointer, p1-real-touch-activation-move, p1-real-opposite-shot-influence
// M5 Player serve loop -> p1-mixed-player-serve-launch, p2-feedback-visual-emphasis
// M6 Rally return and shot influence -> p1-mixed-rally-return-or-miss, p1-real-opposite-shot-influence, p2-feedback-visual-emphasis
// M7 Ball physics, net/floor/bounce scoring -> p1-mixed-player-serve-launch, p1-mixed-rally-return-or-miss, p1-contract-point-settlement-lock, p1-contract-invalid-actions
// M8 Computer opponent -> p1-mixed-rally-return-or-miss, p1-contract-opponent-reacts
// M9 Per-point feedback, reset, serve alternation -> p1-mixed-player-serve-launch, p1-contract-point-settlement-lock, p1-contract-retry-clears-transients
// M10 Challenge progression -> p1-contract-challenge-clear-reward, p1-contract-invalid-actions
// M11 Score match progression -> p1-contract-score-terminal-win-loss
// M12 Pause, restart, menu blocking -> p1-real-pause-blocks-resumes, p1-real-menu-mode-switch, p1-contract-invalid-actions, p1-contract-retry-clears-transients
// M13 Rewards and persistence invariants -> p1-contract-challenge-clear-reward, p1-contract-score-terminal-win-loss, p1-contract-retry-clears-transients
// M14 Shop and cosmetics -> p2-real-shop-purchase-equip, p2-contract-shop-insufficient-coins
// M15 Leaderboard, settings, audio, celebration -> p2-real-leaderboard-recoverable, p2-real-settings-toggles, p2-feedback-visual-emphasis

// === Category Map ===
// TS-P0-01 Boot & Stability -> p0-contract-boot-schema
// TS-P0-02 Boot & Stability -> p0-contract-rejection-schema
// TS-P1-01 UI Flow & Blocking -> p1-real-start-visible
// TS-P1-02 UI Flow & Blocking -> p1-real-pause-blocks-resumes
// TS-P1-03 Input Semantics -> p1-real-activation-gated-pointer
// TS-P1-04 Input Semantics -> p1-real-touch-activation-move
// TS-P1-05 Core Mechanic Loop -> p1-mixed-player-serve-launch
// TS-P1-06 Core Mechanic Loop -> p1-mixed-rally-return-or-miss
// TS-P1-07 Input Semantics -> p1-real-opposite-shot-influence
// TS-P1-08 Core Mechanic Loop -> p1-contract-point-settlement-lock
// TS-P1-09 Core Mechanic Loop -> p1-contract-opponent-reacts
// TS-P1-10 Economy / Progression -> p1-contract-challenge-clear-reward
// TS-P1-11 Economy / Progression -> p1-contract-score-terminal-win-loss
// TS-P1-12 State Machine -> p1-real-menu-mode-switch
// TS-P1-13 Invariants & Rejection -> p1-contract-invalid-actions
// TS-P1-14 State Machine -> p1-contract-retry-clears-transients
// TS-P2-01 Depth / Optional Systems -> p2-real-shop-purchase-equip
// TS-P2-02 Invariants & Rejection -> p2-contract-shop-insufficient-coins
// TS-P2-03 UI Flow & Blocking -> p2-real-leaderboard-recoverable
// TS-P2-04 UI Flow & Blocking -> p2-real-settings-toggles
// TS-P2-05 Feedback & Observability -> p2-feedback-visual-emphasis

// === Rationality Map ===
// p1-real-start-visible | priority P1 | GDD M1/M2 | TEST_SPEC TS-P1-01 | method: real-user behavior | interaction path: visible control click | adapter: dom-click/pointer-click | trigger: real hit-tested start/play control click | independent observation: phase/mode/playfield transition | empty-shell failure: DOM-only or API-only start gates fail.
// p1-real-pause-blocks-resumes | priority P1 | GDD M12 | TEST_SPEC TS-P1-02 | method: mixed setup + real-user behavior | interaction path: visible control click plus modal blocks then releases | adapter: dom-click/pointer-click | trigger: pause, blocked playfield input, resume | independent observation: blocking snapshot and unchanged score/reward/movement | empty-shell failure: overlay-only pause or hidden scoring fails.
// p1-real-activation-gated-pointer | priority P1 | GDD M3/M4 | TEST_SPEC TS-P1-03 | method: real-user behavior | interaction path: canvas/playfield semantic point plus mouse drag from semantic bounds and opposite direction pair | adapter: pointer-click/pointer-drag | trigger: real pointer movement before activation, real paddle click, right/left/down/up drags | independent observation: activation flag, signed paddle X/depth deltas, movement revision | empty-shell failure: always-active, inverted axes, or teleport-only controls fail.
// p1-real-touch-activation-move | priority P1 | GDD M3/M4 | TEST_SPEC TS-P1-04 | method: real-user behavior | interaction path: touch drag/tap plus canvas/playfield semantic point | adapter: touch-drag | trigger: touch outside paddle, touch paddle, opposite touch moves | independent observation: activation gate and signed paddle X/depth deltas | empty-shell failure: mouse-only or ungated touch controls fail.
// p1-mixed-player-serve-launch | priority P1 | GDD M5/M7/M9 | TEST_SPEC TS-P1-05 | method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | adapter: pointer-drag | trigger: legal player_serve_ready setup, real activate/pull/push/release | independent observation: swingRevision plus ball trajectory/bounce/side/point feedback | empty-shell failure: passive auto-serve, direct scoring, or animation-only serve fails.
// p1-mixed-rally-return-or-miss | priority P1 | GDD M6/M7/M8 | TEST_SPEC TS-P1-06 | method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | adapter: pointer-drag | trigger: legal incoming rally setup, real timed paddle return | independent observation: paddle swing, ball hit/depth/rule contact, opponent response or legal point | empty-shell failure: static opponent or score-only rally fails.
// p1-real-opposite-shot-influence | priority P1 | GDD M4/M6 | TEST_SPEC TS-P1-07 | method: mixed setup + real-user behavior | interaction path: opposite direction pair | adapter: pointer-drag | trigger: paired real left/right return swings from equivalent setups | independent observation: opposite paddle displacement and distinguishable ball trend/hit evidence | empty-shell failure: mirrored controls or ignored shot influence fail.
// p1-contract-point-settlement-lock | priority P1 | GDD M7/M9 | TEST_SPEC TS-P1-08 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: legal rally waits/actions to point then extra wait/input | independent observation: ball rule revision before score and duplicate-score invariant | empty-shell failure: timer scoring or repeated same-rally scoring fails.
// p1-contract-opponent-reacts | priority P1 | GDD M8 | TEST_SPEC TS-P1-09 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: legal opponent-side threat then waits | independent observation: ball side/depth linked to opponent motion/hit/miss | empty-shell failure: static opponent or direct-score opponent fails.
// p1-contract-challenge-clear-reward | priority P1 | GDD M10/M13 | TEST_SPEC TS-P1-10 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: near-clear scenario plus legal player point | independent observation: stars target, visible result, coins/reward revision, duplicate reward lock | empty-shell failure: pre-awarded clear or repeat reward fails.
// p1-contract-score-terminal-win-loss | priority P1 | GDD M11/M13 | TEST_SPEC TS-P1-11 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: near-win/loss scenarios plus legal point | independent observation: correct result/reward direction and terminal input lock | empty-shell failure: loss reward or mutable terminal state fails.
// p1-real-menu-mode-switch | priority P1 | GDD M1/M12 | TEST_SPEC TS-P1-12 | method: mixed setup + real-user behavior | interaction path: visible control click plus modal blocks then releases | adapter: dom-click/pointer-click | trigger: open menu/panel, attempt blocked playfield input, choose legal mode | independent observation: active panel blocking, stable progression, clean mode state | empty-shell failure: decorative menus or hidden gameplay under panels fail.
// p1-contract-invalid-actions | priority P1 | GDD M3/M7/M10/M11/M12/M13 | TEST_SPEC TS-P1-13 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: outside activation, locked level, blocked/terminal movement | independent observation: ok:false/unchanged semantic core state | empty-shell failure: permissive contracts or reward leaks fail.
// p1-contract-retry-clears-transients | priority P1 | GDD M12/M13 | TEST_SPEC TS-P1-14 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: retry after live/settled progress | independent observation: transient cleanup and persistence non-decrease | empty-shell failure: superficial retry or stale result feedback fails.
// p2-real-shop-purchase-equip | priority P2 | GDD M14 | TEST_SPEC TS-P2-01 | method: mixed setup + real-user behavior | interaction path: visible control click and segmented pointer press-hold-release | adapter: dom-click/pointer-click | trigger: open shop, visible item/buy clicks, close | independent observation: coin/ownership/equipment/appearance revisions and playfield blocking | empty-shell failure: API-only shop or unpaid committed preview fails.
// p2-contract-shop-insufficient-coins | priority P2 | GDD M14 | TEST_SPEC TS-P2-02 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: unaffordable shop buy attempt | independent observation: coins/ownership/equipment/appearance unchanged and rejection visible | empty-shell failure: negative coins or silently granted items fail.
// p2-real-leaderboard-recoverable | priority P2 | GDD M15 | TEST_SPEC TS-P2-03 | method: real-user behavior | interaction path: visible control click | adapter: dom-click/pointer-click | trigger: visible leaderboard open and close | independent observation: blocking panel, stable progression, recovered source state | empty-shell failure: trapped panel or hidden scoring under panel fails.
// p2-real-settings-toggles | priority P2 | GDD M15 | TEST_SPEC TS-P2-04 | method: mixed setup + real-user behavior | interaction path: visible control click | adapter: dom-click/pointer-click | trigger: visible settings open, real toggle activations, close | independent observation: settings booleans change while gameplay progression stays unchanged | empty-shell failure: fake toggles or gameplay-mutating settings fail.
// p2-feedback-visual-emphasis | priority P2 | GDD M2/M6/M15 | TEST_SPEC TS-P2-05 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: meaningful serve/return/score actions | independent observation: playfield revision, ball/paddle trajectory evidence, score/feedback/result visibility | empty-shell failure: blank scene, state-only effects, or exact-pixel-only visuals fail.

const PHASES = ['loading', 'start', 'menu', 'waitingServe', 'playing', 'pointSettlement', 'paused', 'terminal'];
const MODES = ['none', 'challenge', 'score'];
const RESULTS = ['none', 'challengeClear', 'playerWin', 'playerLoss'];

function PASS(detail) { return { status: 'PASS', detail }; }
function FAIL(detail) { return { status: 'FAIL', detail }; }

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function num(value, fallback = 0) {
  return isFiniteNumber(value) ? value : fallback;
}

function sameScore(a, b) {
  return num(a?.score?.player) === num(b?.score?.player) &&
    num(a?.score?.opponent) === num(b?.score?.opponent) &&
    num(a?.challenge?.stars) === num(b?.challenge?.stars) &&
    num(a?.economy?.coins) === num(b?.economy?.coins) &&
    num(a?.economy?.rewardRevision) === num(b?.economy?.rewardRevision);
}

function sameTerminalState(a, b) {
  if (!sameScore(a, b)) return false;
  const fields = [
    'phase',
    'mode',
    'result',
    'screen.activePanel',
    'screen.overlayBlocking',
    'screen.canInteractWithPlayfield',
    'paddle.activated',
    'paddle.screenX',
    'paddle.screenY',
    'paddle.normalizedX',
    'paddle.normalizedDepth',
    'paddle.motionState',
    'paddle.movementRevision',
    'paddle.swingRevision',
    'opponent.screenX',
    'opponent.screenY',
    'opponent.motionState',
    'opponent.movementRevision',
    'opponent.hitRevision',
    'ball.state',
    'ball.server',
    'ball.screenX',
    'ball.screenY',
    'ball.side',
    'ball.verticalTrend',
    'ball.horizontalTrend',
    'ball.depthTrend',
    'ball.trajectoryRevision',
    'ball.bounceRevision',
    'ball.hitRevision',
    'ball.netContactRevision',
    'ball.floorContactRevision',
    'score.lastPoint',
    'score.pointRevision',
    'score.pointFeedbackVisible',
    'challenge.level',
    'challenge.stars',
    'challenge.starTarget',
    'economy.lastReward',
    'economy.lifetimeCoins',
    'economy.rewardRevision',
    'feedback.activationPromptVisible',
    'feedback.servePromptVisible',
    'feedback.pointMessageVisible',
    'feedback.resultVisible',
    'feedback.celebrationRevision'
  ];
  if (changed(a, b, fields)) return false;
  return JSON.stringify(a?.challenge?.unlockedLevels ?? null) ===
      JSON.stringify(b?.challenge?.unlockedLevels ?? null) &&
    JSON.stringify(a?.shop?.equipped ?? null) === JSON.stringify(b?.shop?.equipped ?? null);
}

function scoreTotal(s) {
  return num(s?.score?.player) + num(s?.score?.opponent) + num(s?.challenge?.stars);
}

function ballScreenPoint(s) {
  if (!s || !s.ball) return null;
  if (!isFiniteNumber(s.ball.screenX) || !isFiniteNumber(s.ball.screenY)) return null;
  return { x: s.ball.screenX, y: s.ball.screenY };
}

function pointSpread(points) {
  const valid = points.filter(Boolean);
  let max = 0;
  for (let i = 0; i < valid.length; i += 1) {
    for (let j = i + 1; j < valid.length; j += 1) {
      max = Math.max(max, Math.hypot(valid[i].x - valid[j].x, valid[i].y - valid[j].y));
    }
  }
  return max;
}

function changedValues(samples, selector) {
  return new Set(samples.map(selector).filter(v => v !== undefined && v !== null && v !== 'unknown')).size;
}

function motionFrames(points, minDelta = 2.5) {
  const valid = points.filter(Boolean);
  let count = 0;
  for (let i = 1; i < valid.length; i += 1) {
    if (Math.hypot(valid[i].x - valid[i - 1].x, valid[i].y - valid[i - 1].y) >= minDelta) count += 1;
  }
  return count;
}

function activeBallStuckFrames(samples, minDelta = 2.5) {
  let last = null;
  let run = 0;
  let maxRun = 0;
  for (const s of samples) {
    const active = s && !['waitingServe', 'pointSettlement', 'paused', 'terminal'].includes(s.phase) &&
      s.ball && s.ball.state !== 'waiting' && s.ball.state !== 'settled';
    const point = ballScreenPoint(s);
    if (!active || !point) {
      last = null;
      run = 0;
      continue;
    }
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < minDelta) {
      run += 1;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 0;
    }
    last = point;
  }
  return maxRun;
}

function feedbackRevision(s) {
  if (!s) return 0;
  return [
    s.playfield?.revision,
    s.playfield?.renderRevision,
    s.playfield?.visualRevision,
    s.paddle?.swingRevision,
    s.ball?.trajectoryRevision,
    s.ball?.bounceRevision,
    s.ball?.hitRevision,
    s.ball?.netContactRevision,
    s.ball?.floorContactRevision,
    s.opponent?.hitRevision,
    s.score?.pointRevision,
    s.feedback?.visualRevision,
    s.feedback?.effectRevision,
    s.feedback?.hitFeedbackRevision,
    s.feedback?.trailRevision,
    s.feedback?.cameraRevision,
    s.feedback?.celebrationRevision
  ].reduce((sum, value) => sum + num(value), 0);
}

function visualFeedbackAdvanced(samples, before, hashes = []) {
  const last = samples[samples.length - 1];
  return feedbackRevision(last) > feedbackRevision(before) ||
    changedValues(samples, feedbackRevision) > 1 ||
    changedValues(hashes, v => v) >= 3;
}

function validateSnapshot(s, label = 'snapshot') {
  if (!s || typeof s !== 'object') return `${label} is not an object`;
  if (typeof s.ok !== 'boolean') return `${label}.ok must be boolean`;
  if (!PHASES.includes(s.phase)) return `${label}.phase invalid: ${s.phase}`;
  if (!MODES.includes(s.mode)) return `${label}.mode invalid: ${s.mode}`;
  if (!RESULTS.includes(s.result)) return `${label}.result invalid: ${s.result}`;
  if (!s.screen || typeof s.screen !== 'object') return `${label}.screen missing`;
  if (typeof s.screen.overlayBlocking !== 'boolean') return `${label}.screen.overlayBlocking missing`;
  if (typeof s.screen.canInteractWithPlayfield !== 'boolean') return `${label}.screen.canInteractWithPlayfield missing`;
  if (!s.playfield || typeof s.playfield !== 'object') return `${label}.playfield missing`;
  if (typeof s.playfield.renderReady !== 'boolean') return `${label}.playfield.renderReady missing`;
  if (typeof s.playfield.nonBlank !== 'boolean') return `${label}.playfield.nonBlank missing`;
  const entities = s.playfield.visibleEntities || {};
  for (const key of ['table', 'net', 'playerPaddle', 'opponentPaddle', 'ball']) {
    if (typeof entities[key] !== 'boolean') return `${label}.playfield.visibleEntities.${key} missing`;
  }
  if (!s.paddle || !s.ball || !s.opponent || !s.score || !s.challenge || !s.economy || !s.feedback) {
    return `${label} missing gameplay schema groups`;
  }
  if (s.ball.screenX !== undefined && s.ball.screenX !== null && !isFiniteNumber(s.ball.screenX)) return `${label}.ball.screenX must be finite or null`;
  if (s.ball.screenY !== undefined && s.ball.screenY !== null && !isFiniteNumber(s.ball.screenY)) return `${label}.ball.screenY must be finite or null`;
  if (s.ball.verticalTrend !== undefined && !['rising', 'falling', 'flat', 'unknown'].includes(s.ball.verticalTrend)) return `${label}.ball.verticalTrend invalid`;
  for (const v of [
    s.score.player, s.score.opponent, s.score.pointRevision,
    s.challenge.stars, s.economy.coins, s.economy.lastReward,
    s.economy.rewardRevision, s.paddle.movementRevision, s.paddle.swingRevision,
    s.ball.trajectoryRevision, s.ball.bounceRevision, s.ball.hitRevision
  ]) {
    if (isFiniteNumber(v) && v < 0) return `${label} has negative counter`;
  }
  if ((s.phase === 'playing' || s.phase === 'waitingServe') &&
      s.screen.overlayBlocking && s.screen.canInteractWithPlayfield) {
    return `${label} is blocking but still accepts playfield input`;
  }
  if ((s.phase === 'playing' || s.phase === 'waitingServe') &&
      s.screen.activePanel === 'none' && !s.screen.canInteractWithPlayfield) {
    return `${label} is unblocked playable phase but playfield is not interactable`;
  }
  if (s.result !== 'none' && (s.phase !== 'terminal' || s.feedback.resultVisible !== true)) {
    return `${label} result is not terminal-visible`;
  }
  return null;
}

function normalizePoint(point, fallback) {
  if (point && isFiniteNumber(point.screenX) && isFiniteNumber(point.screenY)) {
    return { x: point.screenX, y: point.screenY };
  }
  return fallback;
}

async function visibleControlPoint(browser, intent) {
  return await browser.eval(`(function() {
    const intent = ${JSON.stringify(intent)};
    const wordMap = {
      start: /\\b(start|play|challenge|begin|continue)\\b/i,
      pause: /pause|暂停/i,
      resume: /\\b(resume|continue|继续|返回)\\b/i,
      menu: /\\b(menu|mode|level|score|challenge|vs|主菜单|模式|关卡|比分)\\b/i,
      score: /\\b(score|vs|match|比分|对战)\\b/i,
      shop: /\\b(shop|store|buy|purchase|商店|购买)\\b/i,
      leaderboard: /\\b(rank|leader|leaderboard|排行|榜)\\b/i,
      settings: /\\b(settings|setting|audio|music|sfx|sound|设置|音效|音乐)\\b/i,
      music: /\\b(music|background music|音乐)\\b/i,
      sfx: /\\b(sfx|sound effects|sound|音效)\\b/i,
      close: /(?:\\b(?:close|back|done|ok)\\b|(?:btn|button)close[A-Za-z]*|[×✕✖]|关闭|返回)/i,
      buy: /\\b(buy|purchase|unlock|购买|解锁)\\b/i,
      toggle: /\\b(music|sfx|sound|audio|音乐|音效)\\b/i
    };
    const words = wordMap[intent] || new RegExp(intent, 'i');
    const controls = Array.from(document.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"],input[type="checkbox"],input[type="range"],[tabindex]'));
    // Settings rows commonly expose the semantic label on a sibling span
    // while the actual button only says ON/OFF. Resolve that relationship
    // before broad ancestor-text matching, so a HUD button cannot inherit a
    // hidden settings label and win the locator race.
    if (intent === 'music' || intent === 'sfx') {
      const token = intent === 'music' ? /music|音乐/i : /sfx|sound|音效/i;
      const rowButton = Array.from(document.querySelectorAll('button,[role="button"]')).find(el => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (!(r.width > 8 && r.height > 8 && style.display !== 'none' && style.visibility !== 'hidden' &&
              style.pointerEvents !== 'none' && !el.disabled)) return false;
        const rowText = (el.parentElement?.textContent || '').replace(/\s+/g, ' ').trim();
        const lower = rowText.toLowerCase();
        return rowText.length <= 120 && (intent === 'music'
          ? lower.includes('music') || rowText.includes('音乐')
          : lower.includes('sfx') || lower.includes('sound') || rowText.includes('音效'));
      });
      if (rowButton) {
        const r = rowButton.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight) {
          return { x, y, text: (rowButton.textContent || rowButton.getAttribute('aria-label') || '').trim() };
        }
      }
    }
    // Prefer the control's own accessible label/title for common HUD and
    // panel actions. Parent text can be very broad (the whole HUD), while a
    // visible labeled control is already a sufficient real-click target.
    const direct = controls.filter(el => {
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (!(r.width > 8 && r.height > 8 && style.display !== 'none' && style.visibility !== 'hidden' &&
            style.pointerEvents !== 'none' && !el.disabled && el.getAttribute('aria-disabled') !== 'true')) return false;
      const ownText = [el.textContent, el.value, el.getAttribute('aria-label'), el.getAttribute('title'),
        el.id, el.name, el.dataset?.action, el.dataset?.mode, el.dataset?.panel,
        (intent === 'music' || intent === 'sfx' || intent === 'toggle') ? el.parentElement?.textContent : ''].filter(Boolean).join(' ');
      return words.test(ownText);
    });
    for (const el of direct) {
      let r = el.getBoundingClientRect();
      let x = r.left + r.width / 2;
      let y = r.top + r.height / 2;
      if (!(x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight)) {
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
        r = el.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === el || el.contains(hit))) return { x, y, text: (el.textContent || el.title || el.id || '').trim() };
      if ((intent === 'music' || intent === 'sfx' || intent === 'toggle') &&
          x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight) {
        return { x, y, text: (el.textContent || el.title || el.id || '').trim() };
      }
    }
    const candidates = controls
      .filter(el => {
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return r.width > 8 && r.height > 8 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.pointerEvents !== 'none' &&
          !el.disabled &&
          el.getAttribute('aria-disabled') !== 'true';
      })
      .map(el => {
        const r = el.getBoundingClientRect();
        const labelText = el.id ? ((document.querySelector('label[for="' + CSS.escape(el.id) + '"]') || {}).textContent || '') : '';
        const textParts = [
          el.textContent,
          el.value,
          el.getAttribute('aria-label'),
          el.getAttribute('title'),
          el.id,
          el.name,
          labelText,
          el.parentElement?.textContent,
          el.parentElement?.parentElement?.textContent
        ].filter(Boolean);
        const text = textParts.join(' ').replace(/\s+/g, ' ').trim();
        const action = el.dataset?.action || '';
        const mode = el.dataset?.mode || '';
        const panel = el.dataset?.panel || '';
        let score = 0;
        if (intent === 'start' && action === 'start') score += 10;
        if (intent === 'start' && mode === 'challenge') score += 8;
        if (intent === 'start' && words.test(text)) score += 5;
        if (intent !== 'start' && words.test(text)) score += 8;
        if (intent !== 'start' && words.test(action + ' ' + mode + ' ' + panel)) score += 6;
        if (intent === 'start' && panel) score -= 2;
        return { el, x: r.left + r.width / 2, y: r.top + r.height / 2, text, action, mode, panel, score };
      })
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);
    for (const c of candidates) {
      let r = c.el.getBoundingClientRect();
      let x = r.left + r.width / 2;
      let y = r.top + r.height / 2;
      // Keep already-visible controls in place. Some browser layouts move a
      // fixed HUD control when scrollIntoView is called unnecessarily.
      if (!(x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight)) {
        c.el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
        r = c.el.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === c.el || c.el.contains(hit))) {
        return { x, y, text: c.text, action: c.action, mode: c.mode, panel: c.panel, score: c.score };
      }
    }
    return null;
  })()`);
}

async function realClickIntent(browser, intent) {
  let point;
  if (intent === 'music' || intent === 'sfx') {
    // A settings toggle may expose only ON/OFF as its own text while the
    // semantic label is the preceding sibling in the same row. Prefer that
    // narrow relation before the generic visible-control resolver so broad
    // HUD/container text cannot select an unrelated button.
    point = await browser.eval(`(function() {
      const intent = ${JSON.stringify(intent)};
      const token = intent === 'music' ? /music|音乐/i : /sfx|sound effects|sound|音效/i;
      function visible(el) {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 8 && r.height > 8 && s.display !== 'none' && s.visibility !== 'hidden' &&
          s.pointerEvents !== 'none' && !el.disabled;
      }
      const controls = Array.from(document.querySelectorAll('*')).filter(el => {
        if (!visible(el)) return false;
        const style = getComputedStyle(el);
        const nativeControl = el.matches('button,[role="button"],input[type="checkbox"],input[type="range"],input[type="button"],input[type="submit"],a,label');
        return nativeControl || style.cursor === 'pointer' || !!el.getAttribute('onclick') || el.tabIndex >= 0;
      });
      const candidates = controls.map(el => {
        const ownText = [el.textContent, el.value, el.getAttribute('aria-label'),
          el.getAttribute('title'), el.id, el.name, el.getAttribute('data-setting')]
          .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        const relatedText = [el.parentElement?.textContent,
          el.previousElementSibling?.textContent,
          el.parentElement?.firstElementChild?.textContent]
          .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        let score = 0;
        if (token.test(ownText)) score += 10;
        if (token.test(relatedText) && relatedText.length <= 140) score += 5;
        if (getComputedStyle(el).cursor === 'pointer' ||
            el.matches('button,[role="button"],input[type="checkbox"],input[type="range"],input[type="button"],input[type="submit"]')) score += 2;
        if (/close|back|done|cancel|ok|×/i.test(ownText)) score -= 8;
        return { el, score, ownText };
      }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);
      for (const c of candidates) {
        const r = c.el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
        const hit = document.elementFromPoint(x, y);
        if (hit && (hit === c.el || c.el.contains(hit))) {
          return { x, y, text: (c.el.textContent || c.el.getAttribute('aria-label') || c.ownText || '').trim() };
        }
      }
      return null;
    })()`);
  } else {
    point = await visibleControlPoint(browser, intent);
  }
  if (!point) return { ok: false, reason: `no visible hit-testable ${intent} control found` };
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, modifiers: 0 });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
  await browser.sleep(90);
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
  await browser.sleep(180);
  return { ok: true, point };
}

function createGameDriver(browser) {
  async function evalInPage(expr) {
    const value = await browser.eval(expr);
    if (value && value.__l2_err__) throw new Error(value.__l2_err__);
    return value;
  }

  async function snapshot() {
    return await evalInPage(`(function() {
      if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') return null;
      return window.__gameTest.getSnapshot();
    })()`);
  }

  async function reset(options) {
    return await evalInPage(`(function() {
      if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return null;
      return window.__gameTest.reset(${JSON.stringify(options || {})});
    })()`);
  }

  async function input(action) {
    return await evalInPage(`(function() {
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return null;
      return window.__gameTest.input(${JSON.stringify(action)});
    })()`);
  }

  async function loadScenario(name, options) {
    return await evalInPage(`(function() {
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return null;
      return window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})});
    })()`);
  }

  async function waitUntil(target, maxMs = 900) {
    const s = await input({ type: 'wait', until: target, maxMs });
    await browser.sleep(Math.min(maxMs, 250));
    return s || await snapshot();
  }

  async function playfieldPoint(semantic = 'paddleHandle') {
    const s = await snapshot();
    const rect = await evalInPage(`(function() {
      const snap = window.__gameTest && typeof window.__gameTest.getSnapshot === 'function'
        ? window.__gameTest.getSnapshot()
        : null;
      const b = snap && snap.playfield && snap.playfield.bounds;
      const canvas = Array.from(document.querySelectorAll('canvas')).sort((a, b) =>
        ((b.clientWidth || b.width || 0) * (b.clientHeight || b.height || 0)) -
        ((a.clientWidth || a.width || 0) * (a.clientHeight || a.height || 0)))[0];
      const cr = canvas ? canvas.getBoundingClientRect() : null;
      const canvasCss = cr && cr.width > 20 && cr.height > 20
        ? { left: cr.left, top: cr.top, width: cr.width, height: cr.height }
        : null;
      if (b && Number.isFinite(b.left) && Number.isFinite(b.right) &&
          Number.isFinite(b.top) && Number.isFinite(b.bottom) &&
          b.right - b.left > 20 && b.bottom - b.top > 20) {
        return { left: b.left, top: b.top, width: b.right - b.left, height: b.bottom - b.top, source: 'contract', canvasCss };
      }
      return null;
    })()`);
    if (!rect) throw new Error('playfield bounds unavailable: expose public playfield.bounds for semantic real input checks');
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.72 };
    if (semantic === 'outside') return { x: Math.max(2, rect.left + 8), y: Math.max(2, rect.top + 8) };
    if (semantic === 'center') return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    let paddlePoint = normalizePoint({ screenX: s?.paddle?.screenX, screenY: s?.paddle?.screenY }, null);
    if (!paddlePoint) throw new Error('paddle point unavailable: expose visible paddle.screenX/screenY for real input checks');
    if (rect.source === 'contract' && rect.canvasCss) {
      const nx = (paddlePoint.x - rect.left) / rect.width;
      const ny = (paddlePoint.y - rect.top) / rect.height;
      if (Number.isFinite(nx) && Number.isFinite(ny) && nx >= -0.15 && nx <= 1.15 && ny >= -0.15 && ny <= 1.15) {
        paddlePoint = {
          x: rect.canvasCss.left + nx * rect.canvasCss.width,
          y: rect.canvasCss.top + ny * rect.canvasCss.height
        };
      }
    }
    const hit = await evalInPage(`(function() {
      const x = ${JSON.stringify(paddlePoint.x)};
      const y = ${JSON.stringify(paddlePoint.y)};
      const hit = document.elementFromPoint(x, y);
      return !!hit && (hit.tagName === 'CANVAS' || !!hit.closest('canvas'));
    })()`);
    if (!hit) throw new Error('semantic playfield point is not hit-testable against the visible playfield');
    return paddlePoint;
  }

  async function playfieldBounds() {
    return await evalInPage(`(function() {
      const canvas = Array.from(document.querySelectorAll('canvas')).sort((a, b) =>
        ((b.clientWidth || b.width || 0) * (b.clientHeight || b.height || 0)) -
        ((a.clientWidth || a.width || 0) * (a.clientHeight || a.height || 0)))[0];
      if (!canvas) return null;
      const r = canvas.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    })()`);
  }

  async function realMouseDrag(from, moves) {
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: from.x, y: from.y, modifiers: 0
    });
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1, modifiers: 0
    });
    let x = from.x;
    let y = from.y;
    for (const move of moves) {
      x += num(move.dx);
      y += num(move.dy);
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved', x, y, button: 'left', buttons: 1, modifiers: 0,
        movementX: num(move.dx), movementY: num(move.dy)
      });
      await browser.sleep(move.ms || 80);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x, y, button: 'left', clickCount: 1, modifiers: 0
    });
  }

  async function realTouchDrag(from, moves) {
    let x = from.x;
    let y = from.y;
    const id = 7;
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, radiusX: 2, radiusY: 2, id }],
      modifiers: 0
    });
    for (const move of moves) {
      x += num(move.dx);
      y += num(move.dy);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y, radiusX: 2, radiusY: 2, id }],
        modifiers: 0
      });
      await browser.sleep(move.ms || 80);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
      modifiers: 0
    });
  }

  async function ensureReady(mode = 'challenge') {
    let s = await reset({ mode, clearPersistence: true });
    if (!s || validateSnapshot(s)) s = await snapshot();
    if (!s) throw new Error('window.__gameTest snapshot unavailable');
    if (s.phase === 'loading' || s.phase === 'start' || s.phase === 'menu') {
      s = await input({ type: 'start' });
    }
    await waitUntil('rendered', 900);
    return await snapshot();
  }

  async function activateWithMouse() {
    const point = await playfieldPoint('paddleHandle');
    await browser.mouseClick(point.x, point.y);
    await browser.sleep(120);
    return await snapshot();
  }

  return {
    snapshot, reset, input, loadScenario, waitUntil, playfieldPoint, playfieldBounds,
    realMouseDrag, realTouchDrag, ensureReady, activateWithMouse
  };
}

function changed(a, b, fields) {
  return fields.some((field) => {
    const av = field.split('.').reduce((v, k) => v && v[k], a);
    const bv = field.split('.').reduce((v, k) => v && v[k], b);
    return av !== bv;
  });
}

async function establishPlayerPoint(game, scenarioName) {
  const variants = [
    // These are contract deltas (screen-direction units), not raw browser
    // pixels. Keep the serve push small enough to meet the waiting ball and
    // leave the paddle near the return lane for the ensuing rally.
    [{ deltaY: -8, durationMs: 180 }],
    [{ deltaY: -6, durationMs: 140 }, { deltaY: -3, durationMs: 100 }],
    [{ deltaY: -10, durationMs: 200 }],
    [{ deltaX: 4, durationMs: 80 }, { deltaY: -8, durationMs: 180 }],
    // The contract defines the forward direction, not a universal gesture
    // magnitude. Escalate through bounded preparation/push gestures only
    // after the conservative variants fail to establish a player point.
    [{ deltaY: 32, durationMs: 160 }, { deltaY: -64, durationMs: 200 }],
    [{ deltaY: 64, durationMs: 180 }, { deltaY: -128, durationMs: 220 }],
    [{ deltaY: 96, durationMs: 180 }, { deltaY: -192, durationMs: 240 }],
    // The contract defines direction, not a universal gesture magnitude.
    // A final fallback may use only the public visible playfield bounds.
    { adaptiveToPlayfield: true }
  ];

  function dimensions(snapshot) {
    const bounds = snapshot?.playfield?.bounds;
    const width = Number(bounds?.right) - Number(bounds?.left);
    const height = Number(bounds?.bottom) - Number(bounds?.top);
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? { width, height } : null;
  }

  function revisionAdvanced(sample, base, field) {
    return num(sample?.ball?.[field]) > num(base?.ball?.[field]);
  }

  function ballMotionEvidence(sample, base) {
    return ['trajectoryRevision', 'hitRevision', 'bounceRevision', 'netContactRevision', 'floorContactRevision']
      .some(field => revisionAdvanced(sample, base, field));
  }

  function incomingReturnMoves(sample) {
    const size = dimensions(sample);
    if (!size) return null;
    const ballX = num(sample?.ball?.screenX, NaN);
    const paddleX = num(sample?.paddle?.screenX, NaN);
    const deltaX = Number.isFinite(ballX) && Number.isFinite(paddleX)
      ? Math.max(-size.width * 0.24, Math.min(size.width * 0.24, ballX - paddleX)) : 0;
    const deltaY = -Math.max(size.height * 0.08, Math.min(size.height * 0.20, size.height * 0.14));
    const durationMs = Math.min(260, Math.max(80, Math.round(size.height * 0.18)));
    return [{ deltaX, deltaY, durationMs }];
  }

  let last = null;
  for (const moves of variants) {
    const before = await game.loadScenario(scenarioName);
    const err = validateSnapshot(before, scenarioName);
    if (err) return { err };
    if (before.phase === 'terminal' || before.result !== 'none') {
      return { err: `${scenarioName} already terminal` };
    }

    const waitingPlayerServe = before.phase === 'waitingServe' &&
      before.ball?.state === 'waiting' && before.ball?.server === 'player';
    const liveRally = before.phase === 'playing' &&
      !['waiting', 'settled'].includes(before.ball?.state);
    let selectedMoves = moves;
    if (moves?.adaptiveToPlayfield) {
      const size = dimensions(before);
      if (!size) continue;
      const durationMs = Math.min(900, Math.max(120, Math.round(size.height)));
      selectedMoves = [
        { deltaY: size.height, durationMs },
        { deltaY: -size.height, durationMs }
      ];
    }

    const actionBase = await game.input({ type: 'activatePaddle', at: 'handleCenter' });
    if (actionBase?.paddle?.activated !== true) continue;
    await game.input({ type: 'pointerDrag', from: 'paddleCenter', moves: selectedMoves, release: true });
    let after = await game.snapshot();
    let paddleProgressed = num(after?.paddle?.movementRevision) > num(actionBase?.paddle?.movementRevision) ||
      num(after?.paddle?.swingRevision) > num(actionBase?.paddle?.swingRevision);
    const ballProgressedDuringGesture = ballMotionEvidence(after, actionBase);
    let playerServeEvidence = waitingPlayerServe &&
      selectedMoves.some(move => num(move?.deltaY) < 0) &&
      after?.ball?.state !== 'waiting' && ballMotionEvidence(after, actionBase);
    let playerHitEvidence = liveRally && revisionAdvanced(after, actionBase, 'hitRevision');

    // A legal player point may need a second player action after the opponent
    // returns the serve.  Follow only public ball/paddle state and keep each
    // extra gesture bounded to the visible playfield; never synthesize an
    // outcome when the ball is not coming back toward the player.
    for (let tick = 0; tick < 30; tick += 1) {
      if (after?.phase === 'terminal' ||
          num(after?.score?.pointRevision) > num(before?.score?.pointRevision)) break;
      if (after?.phase === 'playing' && after?.ball?.depthTrend === 'towardPlayer') {
        const returnMoves = incomingReturnMoves(after);
        if (returnMoves) {
          await game.input({
            type: 'pointerDrag',
            from: 'paddleCenter',
            moves: returnMoves,
            release: true
          });
          after = await game.snapshot();
          paddleProgressed = paddleProgressed ||
            num(after?.paddle?.movementRevision) > num(actionBase?.paddle?.movementRevision) ||
            num(after?.paddle?.swingRevision) > num(actionBase?.paddle?.swingRevision);
          playerHitEvidence = playerHitEvidence || revisionAdvanced(after, actionBase, 'hitRevision') ||
            (num(after?.paddle?.swingRevision) > num(actionBase?.paddle?.swingRevision) &&
             num(after?.ball?.trajectoryRevision) > num(actionBase?.ball?.trajectoryRevision) &&
             after?.ball?.depthTrend === 'towardOpponent');
        }
      }
      after = await game.input({ type: 'wait', maxMs: 160 });
      if (!playerServeEvidence && waitingPlayerServe &&
          after?.ball?.state !== 'waiting' && ballMotionEvidence(after, actionBase)) {
        playerServeEvidence = true;
      }
      if (!playerHitEvidence && liveRally) {
        playerHitEvidence = revisionAdvanced(after, actionBase, 'hitRevision') ||
          (num(after?.paddle?.swingRevision) > num(actionBase?.paddle?.swingRevision) &&
           num(after?.ball?.trajectoryRevision) > num(actionBase?.ball?.trajectoryRevision) &&
           after?.ball?.depthTrend === 'towardOpponent');
      }
      paddleProgressed = paddleProgressed ||
        num(after?.paddle?.movementRevision) > num(actionBase?.paddle?.movementRevision) ||
        num(after?.paddle?.swingRevision) > num(actionBase?.paddle?.swingRevision);
    }

    if (after?.score?.pointRevision === before?.score?.pointRevision && after?.result === 'none') {
      after = await game.input({ type: 'wait', until: 'terminal', maxMs: 5000 });
    }
    const ballProgressed = ballProgressedDuringGesture || ballMotionEvidence(after, actionBase);
    const playerActionEvidence = waitingPlayerServe
      ? paddleProgressed && playerServeEvidence && ballProgressed
      : liveRally
        ? paddleProgressed && playerHitEvidence && ballProgressed
        : false;
    const pointObserved = num(after?.score?.pointRevision) > num(before?.score?.pointRevision);
    const playerPoint = pointObserved && after?.score?.lastPoint === 'player';
    if (playerPoint && after.phase !== 'terminal') {
      after = await game.input({ type: 'wait', until: 'terminal', maxMs: 5000 });
    }
    last = { before, after };
    if (playerPoint && playerActionEvidence &&
        (after.phase === 'terminal' || num(after.score?.pointRevision) > num(before.score?.pointRevision))) {
      return { before, after };
    }
  }
  return { err: `${scenarioName} did not produce a player point caused by a player-level action` };
}

async function establishOpponentPoint(game, scenarioName) {
  const before = await game.loadScenario(scenarioName);
  const err = validateSnapshot(before, scenarioName);
  if (err) return { err };
  if (before.phase === 'terminal' || before.result !== 'none') {
    return { err: `${scenarioName} already terminal` };
  }
  if (!['waitingServe', 'playing'].includes(before.phase)) {
    return { err: `${scenarioName} is not a legal live score state` };
  }

  const playerServeWaiting = before.phase === 'waitingServe' &&
    before.ball?.state === 'waiting' && before.ball?.server === 'player';
  if (playerServeWaiting) {
    const bounds = before.playfield?.bounds;
    const verticalSpan = Number(bounds?.bottom) - Number(bounds?.top);
    if (!Number.isFinite(verticalSpan) || verticalSpan <= 0) {
      return { err: `${scenarioName} has no usable public playfield bounds for the player serve` };
    }
    const activation = before.paddle?.activated
      ? before
      : await game.input({ type: 'activatePaddle', at: 'handleCenter' });
    if (activation?.paddle?.activated !== true) {
      return { err: `${scenarioName} could not activate the public paddle control` };
    }
    const durationMs = Math.min(900, Math.max(120, Math.round(verticalSpan)));
    await game.input({
      type: 'pointerDrag',
      from: 'paddleCenter',
      moves: [
        { deltaY: verticalSpan, durationMs },
        { deltaY: -verticalSpan, durationMs }
      ],
      release: true
    });
  }
  const after = await game.waitUntil('terminal', 6000);
  return { before, after };
}

const suite = [
  {
    id: 'p0-contract-boot-schema',
    level: 'P0',
    name: 'boot exposes contract schema and readable playfield',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const api = await browser.eval(`(function() {
        const g = window.__gameTest;
        return !!g && ['reset','input','getSnapshot','loadScenario'].every(k => typeof g[k] === 'function');
      })()`);
      if (!api) return FAIL('window.__gameTest reset/input/getSnapshot/loadScenario missing');
      const s = await game.ensureReady('challenge');
      const err = validateSnapshot(s, 'ready snapshot');
      if (err) return FAIL(err);
      if (!s.playfield.renderReady || !s.playfield.nonBlank) return FAIL('playfield not render-ready/nonblank');
      const entities = s.playfield.visibleEntities;
      if (!entities.table || !entities.net || !entities.playerPaddle || !entities.opponentPaddle || !entities.ball) {
        return FAIL('required playfield entities not visible in public snapshot');
      }
      return PASS(`phase=${s.phase}, mode=${s.mode}`);
    }
  },
  {
    id: 'p0-contract-rejection-schema',
    level: 'P0',
    name: 'unknown action rejects without corrupting snapshot',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureReady('challenge');
      const rejected = await game.input({ type: 'notARealImpactPongAction', score: 999, coins: 999 });
      const after = await game.snapshot();
      const err = validateSnapshot(after, 'post-rejection snapshot') || validateSnapshot(rejected, 'rejection envelope');
      if (err) return FAIL(err);
      if (rejected.ok !== false && !sameScore(before, after)) {
        return FAIL('unknown action was not rejected and mutated gameplay progression');
      }
      if (!sameScore(before, after)) return FAIL('unknown action changed score/stars/coins/reward');
      return PASS('unknown action rejected or no-op with stable progression');
    }
  },
  {
    id: 'p1-real-start-visible',
    level: 'P1',
    name: 'visible start control responds to a real browser click',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.reset({ clearPersistence: true });
      const beforeErr = validateSnapshot(before, 'visible start reset');
      if (beforeErr) return FAIL(beforeErr);
      let ready = before;
      const readyDeadline = Date.now() + 3000;
      while (ready.phase === 'loading' && Date.now() < readyDeadline) {
        await browser.sleep(120);
        ready = await game.snapshot();
        const readyErr = validateSnapshot(ready, 'visible start readiness');
        if (readyErr) return FAIL(readyErr);
      }
      if (ready.phase === 'loading') {
        return FAIL('loading gate did not become ready for visible control discovery');
      }
      if (ready.phase !== 'start' && ready.phase !== 'menu' && !ready.screen?.controls?.start) {
        return FAIL('reset did not expose a start/menu gate for visible control check');
      }
      await browser.sleep(80);
      const point = await visibleControlPoint(browser, 'start');
      if (!point) return FAIL('no visible semantic start/play/challenge control found');
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: point.x,
        y: point.y,
        modifiers: 0
      });
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1,
        modifiers: 0
      });
      await browser.sleep(100);
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1,
        modifiers: 0
      });
      await browser.sleep(300);
      const after = await game.snapshot();
      const afterErr = validateSnapshot(after, 'after visible start click');
      if (afterErr) return FAIL(afterErr);
      if (after.phase === before.phase && after.mode === before.mode && after.screen.activePanel === before.screen.activePanel) {
        return FAIL(`visible start control click produced no state transition: ${point.text || point.action || point.mode}`);
      }
      const enteredMenu = after.phase === 'menu' || after.screen.activePanel === 'menu';
      if (enteredMenu) {
        if (!after.screen.overlayBlocking || after.screen.canInteractWithPlayfield) {
          return FAIL('visible start control opened a menu without blocking playfield interaction');
        }
        if (!after.playfield.renderReady || !after.playfield.nonBlank ||
            !isFiniteNumber(after.playfield.revision) || after.playfield.revision <= 0) {
          return FAIL('visible start control opened a menu without a rendered playfield');
        }
        const entities = after.playfield.visibleEntities || {};
        if (['table', 'net', 'playerPaddle', 'opponentPaddle', 'ball'].some(key => !entities[key])) {
          return FAIL('visible start control opened a menu without visible playfield entities');
        }
        const menuPoint = await visibleControlPoint(browser, 'menu');
        if (!menuPoint) return FAIL('visible start control opened a menu without a visible mode/menu control');
        return PASS(`visible control "${point.text || point.action || point.mode}" entered menu`);
      }
      if (after.phase === 'start') return FAIL('visible start control did not leave start gate');
      if (after.mode === 'none') return FAIL('visible start control did not select a playable mode');
      if (after.screen.overlayBlocking || !after.screen.canInteractWithPlayfield) return FAIL('visible start control did not open an interactable playfield');
      if (!after.playfield.renderReady || !after.playfield.nonBlank ||
          !isFiniteNumber(after.playfield.revision) || after.playfield.revision <= 0) return FAIL('visible start control did not produce visible playfield');
      const entities = after.playfield.visibleEntities || {};
      if (['table', 'net', 'playerPaddle', 'opponentPaddle', 'ball'].some(key => !entities[key])) {
        return FAIL('visible start control did not produce visible playfield entities');
      }
      return PASS(`visible control "${point.text || point.action || point.mode}" entered ${after.mode}/${after.phase}`);
    }
  },
  {
    id: 'p1-real-pause-blocks-resumes',
    level: 'P1',
    name: 'pause blocks real playfield input and resumes cleanly',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadScenario('rally_incoming_to_player');
      const setupErr = validateSnapshot(setup, 'rally_incoming_to_player');
      if (setupErr) return FAIL(setupErr);
      if (setup.result !== 'none' || setup.phase === 'terminal') return FAIL('rally scenario already contains result');
      if (!setup.playfield.renderReady || !setup.playfield.nonBlank) {
        return FAIL('rally scenario did not expose a rendered nonblank playfield');
      }
      // This fixture is already a live rally.  Waiting for the separate
      // "ready" target can advance the short rally through a point or
      // terminal state and hide the pause control this check is meant to
      // exercise.
      await game.input({ type: 'wait', maxMs: 0 });
      const blockedPoint = await game.playfieldPoint('paddleHandle');
      const live = await game.snapshot();
      const beforePause = await game.snapshot();
      if (beforePause.phase === 'terminal') return FAIL('rally scenario is terminal before pause');
      const pausePoint = await visibleControlPoint(browser, 'pause');
      if (!pausePoint) return FAIL('no visible hit-testable pause control found');
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pausePoint.x, y: pausePoint.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pausePoint.x, y: pausePoint.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(80);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pausePoint.x, y: pausePoint.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(180);
      const paused = await game.snapshot();
      if (paused.phase !== 'paused' && paused.screen.activePanel !== 'pause') return FAIL('pause did not enter paused state');
      if (!paused.screen.overlayBlocking && paused.screen.canInteractWithPlayfield) return FAIL('pause does not block playfield');
      const frozenBefore = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: blockedPoint.x + 100,
        y: blockedPoint.y - 80,
        modifiers: 0
      });
      await game.input({
        type: 'pointerDrag',
        from: 'paddleCenter',
        moves: [{ deltaX: 100, deltaY: -80, durationMs: 120 }, { deltaX: -180, deltaY: 100, durationMs: 120 }],
        release: true
      });
      await game.waitUntil('pointSettled', 500);
      const frozenAfter = await game.snapshot();
      if (!sameScore(frozenBefore, frozenAfter)) return FAIL('paused real input changed score/stars/coins/reward');
      if (num(frozenAfter.paddle.movementRevision) !== num(frozenBefore.paddle.movementRevision)) {
        return FAIL('paused real input moved paddle');
      }
      const resumePoint = await visibleControlPoint(browser, 'resume');
      if (!resumePoint) return FAIL('no visible hit-testable resume control found');
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: resumePoint.x, y: resumePoint.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: resumePoint.x, y: resumePoint.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(80);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: resumePoint.x, y: resumePoint.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(180);
      const resumed = await game.snapshot();
      if (resumed.screen.overlayBlocking || !resumed.screen.canInteractWithPlayfield) return FAIL('resume did not restore playfield interaction');
      if (live.result !== 'none' && resumed.result !== live.result) return FAIL('resume changed terminal/result semantics');
      return PASS('pause blocks real input and resume restores interaction');
    }
  },
  {
    id: 'p1-real-activation-gated-pointer',
    level: 'P1',
    name: 'real mouse activation and opposite directions move paddle visibly',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadScenario('player_serve_ready');
      const setupErr = validateSnapshot(setup, 'player_serve_ready');
      if (setupErr) return FAIL(setupErr);
      const pre = await game.snapshot();
      if (pre.phase === 'terminal' || pre.ball.server !== 'player') return FAIL('player_serve_ready is not a legal player serve precondition');
      const point = await game.playfieldPoint('paddleHandle');
      const beforeUnactivated = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: point.x + 90,
        y: point.y,
        modifiers: 0
      });
      await browser.sleep(100);
      const afterUnactivated = await game.snapshot();
      if (afterUnactivated.paddle.activated) return FAIL('unpressed real mouse move activated paddle');
      if (num(afterUnactivated.paddle.movementRevision) !== num(beforeUnactivated.paddle.movementRevision)) {
        return FAIL('unpressed real mouse move moved paddle');
      }
      const freshPoint = await game.playfieldPoint('paddleHandle');
      await browser.mouseClick(freshPoint.x, freshPoint.y);
      await browser.sleep(120);
      const activated = await game.snapshot();
      if (!activated.paddle.activated) return FAIL('real mouse click near paddle did not activate');
      await game.realMouseDrag(await game.playfieldPoint('paddleHandle'), [{ dx: 120, dy: 0, ms: 120 }]);
      const right = await game.snapshot();
      await game.realMouseDrag(await game.playfieldPoint('paddleHandle'), [{ dx: -180, dy: 0, ms: 120 }]);
      const left = await game.snapshot();
      const downBase = await game.loadScenario('player_serve_ready');
      const downPoint = await game.playfieldPoint('paddleHandle');
      const downBounds = await game.playfieldBounds();
      const downDy = Math.min(100, Math.max(16, (downBounds?.bottom ?? (downPoint.y + 100)) - downPoint.y - 6));
      await browser.mouseClick(downPoint.x, downPoint.y);
      await browser.sleep(80);
      await game.realMouseDrag(downPoint, [{ dx: 0, dy: downDy, ms: 120 }]);
      const down = await game.snapshot();
      const upBase = await game.loadScenario('player_serve_ready');
      const upPoint = await game.playfieldPoint('paddleHandle');
      const upBounds = await game.playfieldBounds();
      const upDy = Math.min(100, Math.max(16, upPoint.y - (upBounds?.top ?? (upPoint.y - 100)) - 6));
      await browser.mouseClick(upPoint.x, upPoint.y);
      await browser.sleep(80);
      await game.realMouseDrag(upPoint, [{ dx: 0, dy: -upDy, ms: 120 }]);
      const up = await game.snapshot();
      const dxRight = num(right.paddle.screenX ?? right.paddle.normalizedX) - num(activated.paddle.screenX ?? activated.paddle.normalizedX);
      const dxLeft = num(left.paddle.screenX ?? left.paddle.normalizedX) - num(right.paddle.screenX ?? right.paddle.normalizedX);
      const dDepthDown = num(down.paddle.normalizedDepth) - num(downBase.paddle.normalizedDepth);
      const dDepthUp = num(up.paddle.normalizedDepth) - num(upBase.paddle.normalizedDepth);
      if (Math.sign(dxRight) !== 1 || Math.sign(dxLeft) !== -1) return FAIL(`direction opposite failed for mouse X: ${dxRight}/${dxLeft}`);
      if (Math.sign(dDepthDown) === 0 || Math.sign(dDepthUp) === 0 || Math.sign(dDepthDown) === Math.sign(dDepthUp)) {
        return FAIL(`direction opposite failed for mouse depth: ${dDepthDown}/${dDepthUp}`);
      }
      if (num(up.paddle.movementRevision) <= num(activated.paddle.movementRevision)) return FAIL('movement revision did not increase after real mouse directions');
      await browser.sleep(250);
      const settled = await game.snapshot();
      if (!['idle', 'settling', 'following', 'swingingForward'].includes(settled.paddle.motionState)) return FAIL('paddle motionState outside TDD enum after release');
      return PASS('real mouse direction opposite chain passed');
    }
  },
  {
    id: 'p1-real-touch-activation-move',
    level: 'P1',
    name: 'real touch activation gate and opposite directions work',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadScenario('player_serve_ready');
      const setupErr = validateSnapshot(setup, 'player_serve_ready');
      if (setupErr) return FAIL(setupErr);
      if (setup.ball.server !== 'player' || setup.ball.state !== 'waiting') return FAIL('touch setup is not player serve ready');
      const outside = await game.playfieldPoint('outside');
      await game.realTouchDrag(outside, [{ dx: 90, dy: 0, ms: 80 }]);
      const rejected = await game.snapshot();
      if (rejected.paddle.activated) return FAIL('touch outside paddle activated control');
      const handle = await game.playfieldPoint('paddleHandle');
      await game.realTouchDrag(handle, [{ dx: 0, dy: 0, ms: 60 }]);
      const activated = await game.snapshot();
      if (!activated.paddle.activated) return FAIL('touch near paddle did not activate');
      await game.realTouchDrag(await game.playfieldPoint('paddleHandle'), [{ dx: 110, dy: 0, ms: 120 }]);
      const right = await game.snapshot();
      await game.realTouchDrag(await game.playfieldPoint('paddleHandle'), [{ dx: -170, dy: 0, ms: 120 }]);
      const left = await game.snapshot();
      const downBase = await game.loadScenario('player_serve_ready');
      await game.realTouchDrag(await game.playfieldPoint('paddleHandle'), [{ dx: 0, dy: 0, ms: 60 }]);
      await game.realTouchDrag(await game.playfieldPoint('paddleHandle'), [{ dx: 0, dy: 100, ms: 120 }]);
      const down = await game.snapshot();
      const upBase = await game.loadScenario('player_serve_ready');
      await game.realTouchDrag(await game.playfieldPoint('paddleHandle'), [{ dx: 0, dy: 0, ms: 60 }]);
      await game.realTouchDrag(await game.playfieldPoint('paddleHandle'), [{ dx: 0, dy: -100, ms: 120 }]);
      const up = await game.snapshot();
      const dxRight = num(right.paddle.screenX ?? right.paddle.normalizedX) - num(activated.paddle.screenX ?? activated.paddle.normalizedX);
      const dxLeft = num(left.paddle.screenX ?? left.paddle.normalizedX) - num(right.paddle.screenX ?? right.paddle.normalizedX);
      const dDepthDown = num(down.paddle.normalizedDepth) - num(downBase.paddle.normalizedDepth);
      const dDepthUp = num(up.paddle.normalizedDepth) - num(upBase.paddle.normalizedDepth);
      if (Math.sign(dxRight) !== 1 || Math.sign(dxLeft) !== -1) return FAIL(`touch direction opposite failed for X: ${dxRight}/${dxLeft}`);
      if (Math.sign(dDepthDown) === 0 || Math.sign(dDepthDown) === Math.sign(dDepthUp)) {
        return FAIL(`touch direction opposite failed for depth: ${dDepthDown}/${dDepthUp}`);
      }
      if (!sameScore(activated, up)) return FAIL('touch movement alone changed progression before legal rally point');
      return PASS('real touch direction opposite chain passed');
    }
  },
  {
    id: 'p1-mixed-player-serve-launch',
    level: 'P1',
    name: 'player serve requires forward paddle action and produces ball/rule evidence',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('player_serve_ready');
      const err = validateSnapshot(pre, 'player_serve_ready');
      if (err) return FAIL(err);
      if (pre.ball.server !== 'player' || pre.ball.state !== 'waiting') return FAIL('serve scenario is not waiting for player serve');
      if (pre.paddle.activated) return FAIL('serve scenario activated paddle before real activation');
      await game.waitUntil('serveLaunched', 700);
      const passive = await game.snapshot();
      if (passive.ball.state !== 'waiting' || num(passive.score.pointRevision) !== num(pre.score.pointRevision)) {
        return FAIL('passive wait launched serve or scored before forward action');
      }
      await browser.mouseClick((await game.playfieldPoint('paddleHandle')).x, (await game.playfieldPoint('paddleHandle')).y);
      await browser.sleep(100);
      const activated = await game.snapshot();
      if (!activated.paddle.activated) return FAIL('real mouse click did not activate paddle');
      await game.realMouseDrag(await game.playfieldPoint('paddleHandle'), [
        { dx: 0, dy: 120, ms: 120 },
        { dx: 80, dy: 0, ms: 120 },
        { dx: 0, dy: -220, ms: 180 }
      ]);
      const afterGesture = await game.snapshot();
      if (num(afterGesture.paddle.movementRevision) <= num(passive.paddle.movementRevision)) return FAIL('forward serve gesture did not move paddle');
      const launched = await game.waitUntil('serveLaunched', 1500);
      const flight = await game.waitUntil('ballBounced', 1600);
      if (num(flight.ball.trajectoryRevision) <= num(passive.ball.trajectoryRevision)) return FAIL('serve did not change ball trajectory');
      const validFlight = flight.ball.state !== 'waiting' &&
        (flight.ball.depthTrend === 'towardOpponent' || flight.ball.side === 'opponent' || num(flight.ball.bounceRevision) > num(passive.ball.bounceRevision));
      const legalFailure = num(flight.score.pointRevision) > num(passive.score.pointRevision) &&
        (num(flight.ball.netContactRevision) > num(passive.ball.netContactRevision) || num(flight.ball.floorContactRevision) > num(passive.ball.floorContactRevision));
      if (!validFlight && !legalFailure) return FAIL('serve lacked flight/bounce/rule-failure evidence');
      return PASS('forward paddle action caused serve flight or legal failure');
    }
  },
  {
    id: 'p2-feedback-visual-emphasis',
    level: 'P2',
    name: 'served ball moves naturally over time without contract wait',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('player_serve_ready');
      const err = validateSnapshot(pre, 'player_serve_ready');
      if (err) return FAIL(err);
      if (pre.ball.server !== 'player' || pre.ball.state !== 'waiting') return FAIL('serve scenario is not waiting for player serve');

      await browser.sleep(700);
      const passive = await game.snapshot();
      if (passive.ball.state !== 'waiting' || num(passive.score.pointRevision) !== num(pre.score.pointRevision)) {
        return FAIL('passive natural time launched serve or scored before player swing');
      }

      const point = await game.playfieldPoint('paddleHandle');
      await browser.mouseClick(point.x, point.y);
      await browser.sleep(80);
      await game.realMouseDrag(await game.playfieldPoint('paddleHandle'), [
        { dx: 0, dy: 105, ms: 100 },
        { dx: 70, dy: 0, ms: 90 },
        { dx: 0, dy: -235, ms: 140 }
      ]);

      const samples = [];
      const hashes = [];
      for (let i = 0; i < 8; i += 1) {
        await browser.sleep(180);
        samples.push(await game.snapshot());
        hashes.push(await browser.canvasPixelHash());
      }
      for (let i = 0; i < samples.length; i += 1) {
        const sampleErr = validateSnapshot(samples[i], `natural serve sample ${i}`);
        if (sampleErr) return FAIL(sampleErr);
      }
      const points = samples.map(ballScreenPoint);
      if (points.filter(Boolean).length < 4) return FAIL('ball screenX/screenY missing during natural serve flight');
      if (pointSpread(points) < 16) return FAIL('served ball did not visibly move across screen over natural time');
      const movingFrames = motionFrames(points);
      const ruleSettled = samples.some(s => num(s.score?.pointRevision) > num(passive.score?.pointRevision) ||
        num(s.ball?.bounceRevision) > num(passive.ball?.bounceRevision) ||
        num(s.ball?.floorContactRevision) > num(passive.ball?.floorContactRevision) ||
        num(s.ball?.netContactRevision) > num(passive.ball?.netContactRevision));
      if (movingFrames < 3 && !ruleSettled) return FAIL('served ball did not animate across enough natural-time frames');
      const stuck = activeBallStuckFrames(samples);
      if (stuck >= 3) return FAIL(`served ball appears stuck for ${stuck + 1} active natural-time samples`);
      if (changedValues(hashes, v => v) < 2) return FAIL('canvas did not visibly change during served ball flight');
      const last = samples[samples.length - 1];
      const launched = samples.some(s => s.ball.state !== 'waiting' || s.ball.depthTrend === 'towardOpponent' || s.ball.side === 'opponent');
      if (!launched) return FAIL('forward swing did not launch ball toward opponent under natural time');
      if (num(last.ball.trajectoryRevision) <= num(passive.ball.trajectoryRevision)) return FAIL('natural serve did not advance trajectoryRevision');
      const physicalEvidence = changedValues(samples, s => s.ball.depthTrend) > 1 ||
        changedValues(samples, s => s.ball.side) > 1 ||
        num(last.ball.bounceRevision) > num(passive.ball.bounceRevision) ||
        num(last.ball.hitRevision) > num(passive.ball.hitRevision);
      if (!physicalEvidence) return FAIL('natural serve lacks changing side/depth/bounce/hit evidence');
      if (!visualFeedbackAdvanced(samples, passive, hashes)) {
        return FAIL('natural serve lacks playfield, trajectory, impact, or canvas feedback evidence');
      }
      return PASS('real serve created visible natural ball motion and trajectory evidence');
    }
  },
  {
    id: 'p1-contract-opponent-reacts',
    level: 'P1',
    name: 'opponent reacts to opponent-side threat through public contract',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('rally_incoming_to_opponent');
      const err = validateSnapshot(pre, 'rally_incoming_to_opponent');
      if (err) return FAIL(err);
      if (pre.result !== 'none' || pre.phase === 'terminal') return FAIL('opponent threat scenario starts after result');
      const samples = [];
      for (let i = 0; i < 10; i += 1) {
        samples.push(await game.input({ type: 'wait', until: i < 3 ? 'opponentReacted' : 'pointSettled', maxMs: 800 }));
      }
      for (let i = 0; i < samples.length; i += 1) {
        const sampleErr = validateSnapshot(samples[i], `opponent contract sample ${i}`);
        if (sampleErr) return FAIL(sampleErr);
      }
      const threatenedOpponent = pre.ball.side === 'opponent' || pre.ball.depthTrend === 'towardOpponent' ||
        samples.some(s => s.ball.side === 'opponent' || s.ball.depthTrend === 'towardOpponent');
      const opponentMoved = samples.some(s => num(s.opponent.movementRevision) > num(pre.opponent.movementRevision)) ||
        changedValues(samples, s => s.opponent.motionState) > 1;
      const opponentReturned = samples.some(s =>
        num(s.ball.hitRevision) > num(pre.ball.hitRevision) &&
        (s.ball.depthTrend === 'towardPlayer' || s.ball.side === 'player'));
      if (threatenedOpponent && !opponentMoved) return FAIL('ball threatened opponent side without natural opponent movement');
      if (opponentMoved && !opponentReturned && !samples.some(s => num(s.score.pointRevision) > num(pre.score.pointRevision))) {
        return FAIL('opponent movement did not connect to a return or legal point outcome');
      }
      return PASS('opponent reaction was linked to ball threat and rally outcome');
    }
  },
  {
    id: 'p1-mixed-rally-return-or-miss',
    level: 'P1',
    name: 'incoming rally return couples paddle, ball, and opponent response',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('rally_incoming_to_player');
      const err = validateSnapshot(pre, 'rally_incoming_to_player');
      if (err) return FAIL(err);
      if (pre.result !== 'none' || pre.phase === 'terminal') return FAIL('incoming rally starts after result');
      await browser.mouseClick((await game.playfieldPoint('paddleHandle')).x, (await game.playfieldPoint('paddleHandle')).y);
      await browser.sleep(100);
      await game.realMouseDrag(await game.playfieldPoint('paddleHandle'), [
        { dx: 70, dy: 0, ms: 120 },
        { dx: 0, dy: -160, ms: 160 }
      ]);
      const afterHit = await game.waitUntil('ballBounced', 1800);
      const afterOpponent = await game.waitUntil('opponentReacted', 1800);
      const paddleEvidence = num(afterHit.paddle.swingRevision) > num(pre.paddle.swingRevision) ||
        num(afterHit.paddle.movementRevision) > num(pre.paddle.movementRevision);
      // The first wait target is the table bounce, which may occur just
      // before the same rally reaches the near paddle. Evaluate the next
      // causal sample too; otherwise a valid return can be hidden between
      // the two independent observations.
      const ballEvidence = [afterHit, afterOpponent].some(sample =>
        num(sample.ball.hitRevision) > num(pre.ball.hitRevision) ||
        sample.ball.depthTrend === 'towardOpponent' ||
        num(sample.score.pointRevision) > num(pre.score.pointRevision));
      const opponentEvidence = num(afterOpponent.opponent.movementRevision) > num(pre.opponent.movementRevision) ||
        ['reacting', 'pursuing', 'returning', 'missed'].includes(afterOpponent.opponent.motionState);
      if (!paddleEvidence || !ballEvidence) return FAIL('return lacks paddle and ball causal evidence');
      if (!opponentEvidence && afterHit.ball.side === 'opponent') return FAIL('ball threatened opponent side without opponent response');
      return PASS('rally return produced paddle/ball/opponent causal evidence');
    }
  },
  {
    id: 'p1-real-opposite-shot-influence',
    level: 'P1',
    name: 'opposite lateral swings produce opposite visible effect and shot tendency',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function runSwing(sign, label) {
        const pre = await game.loadScenario('rally_incoming_to_player');
        const err = validateSnapshot(pre, `${label} rally_incoming_to_player`);
        if (err) return { error: err };
        if (pre.result !== 'none' || pre.phase === 'terminal') {
          return { error: `${label} swing scenario already contains result` };
        }
        const publicBounds = pre.playfield && pre.playfield.bounds;
        const publicWidth = Number(publicBounds?.right) - Number(publicBounds?.left);
        const publicHeight = Number(publicBounds?.bottom) - Number(publicBounds?.top);
        const bounds = await game.playfieldBounds();
        if (!(publicWidth > 0 && publicHeight > 0 && bounds?.width > 20 && bounds?.height > 20)) {
          return { error: label + ' rally has no usable public/visible playfield bounds' };
        }
        const activate = await game.playfieldPoint('paddleHandle');
        await browser.mouseClick(activate.x, activate.y);
        const alignX = (num(pre.ball.screenX) - num(pre.paddle.screenX)) / publicWidth * bounds.width;
        if (Math.abs(alignX) > bounds.width * 0.005) {
          await game.realMouseDrag(await game.playfieldPoint('paddleHandle'), [
            { dx: Math.max(-bounds.width * 0.25, Math.min(bounds.width * 0.25, alignX)), dy: 0, ms: 20 }
          ]);
        }

        // Observe natural motion: wait(maxMs) may return as soon as its default condition is met.
        // Start a short continuous swing only when the incoming ball is close to the paddle.
        const deadline = Date.now() + 4000;
        let ready;
        let incomingWindowReached = false;
        while (Date.now() < deadline) {
          ready = await game.snapshot();
          if (ready.result !== 'none' || ready.phase === 'terminal' ||
              num(ready.ball.hitRevision) > num(pre.ball.hitRevision)) break;
          const gap = Math.hypot(
            (Number(ready.ball.screenX) - Number(ready.paddle.screenX)) / publicWidth,
            (Number(ready.ball.screenY) - Number(ready.paddle.screenY)) / publicHeight);
          if (ready.ball.depthTrend === 'towardPlayer' && gap < 0.06) {
            incomingWindowReached = true;
            break;
          }
          await browser.sleep(20);
        }
        if (!incomingWindowReached) {
          return { error: label + ' rally did not reach a public near-paddle incoming window' };
        }
        const beforeDrag = ready;
        const aligned = ready;
        await game.realMouseDrag(await game.playfieldPoint('paddleHandle'),
          Array.from({ length: 6 }, () => ({
            dx: sign * bounds.width * 0.06 / 6, dy: -bounds.height * 0.04 / 6, ms: 20
          })));
        const afterDrag = await game.snapshot();
        const samples = [afterDrag];
        const observationEnd = Date.now() + 900;
        while (Date.now() < observationEnd) {
          if (num(samples[samples.length - 1].ball.hitRevision) > num(beforeDrag.ball.hitRevision)) break;
          await browser.sleep(20);
          samples.push(await game.snapshot());
        }
        const returnSample = samples.find(s => num(s?.ball?.hitRevision) > num(beforeDrag.ball?.hitRevision)) ||
          samples[samples.length - 1];
        return { pre, beforeDrag, aligned, afterDrag, after: returnSample, samples };
      }

      const leftRun = await runSwing(-1, 'left');
      if (leftRun.error) return FAIL(leftRun.error);
      const rightRun = await runSwing(1, 'right');
      if (rightRun.error) return FAIL(rightRun.error);
      const leftPre = leftRun.pre;
      const rightPre = rightRun.pre;
      const left = leftRun.after;
      const right = rightRun.after;
      const paddlePosition = (snapshot) => {
        const paddle = snapshot?.paddle || {};
        const screenX = num(paddle.screenX, NaN);
        return Number.isFinite(screenX) ? screenX : num(paddle.normalizedX, NaN);
      };
      const displacementExtremum = (run, sign) => {
        const base = paddlePosition(run.aligned);
        if (!Number.isFinite(base)) return NaN;
        const values = [run.afterDrag, ...(run.samples || [])]
          .map(sample => paddlePosition(sample))
          .filter(Number.isFinite)
          .map(value => value - base);
        if (!values.length) return NaN;
        return sign < 0 ? Math.min(...values) : Math.max(...values);
      };
      const leftDx = displacementExtremum(leftRun, -1);
      const rightDx = displacementExtremum(rightRun, 1);
      if (Math.sign(leftDx) !== -1 || Math.sign(rightDx) !== 1) return FAIL(`direction opposite paddle signs invalid: ${leftDx}/${rightDx}`);
      const trendDiffers = left.ball.horizontalTrend !== right.ball.horizontalTrend &&
        left.ball.horizontalTrend !== 'unknown' && right.ball.horizontalTrend !== 'unknown';
      const leftHit = num(left.ball.hitRevision) > num(leftPre.ball.hitRevision);
      const rightHit = num(right.ball.hitRevision) > num(rightPre.ball.hitRevision);
      const pairedHitEvidence = leftHit && rightHit;
      if (!trendDiffers && !pairedHitEvidence) return FAIL('opposite swings did not create distinguishable ball tendency or paired hit evidence');
      return PASS('opposite lateral inputs produced opposite visible paddle effect and shot influence evidence');
    }
  },
  {
    id: 'p1-contract-point-settlement-lock',
    level: 'P1',
    name: 'point settlement follows rule evidence and awards once',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('rally_incoming_to_opponent');
      const err = validateSnapshot(pre, 'rally_incoming_to_opponent');
      if (err) return FAIL(err);
      if (pre.result !== 'none') return FAIL('point scenario already has result');
      const after = await game.waitUntil('pointSettled', 5000);
      if (num(after.score.pointRevision) <= num(pre.score.pointRevision)) {
        await game.input({ type: 'wait', until: 'terminal', maxMs: 2500 });
      }
      let scored = await game.snapshot();
      let base = pre;
      if (num(scored.score.pointRevision) <= num(pre.score.pointRevision)) {
        base = await game.loadScenario('score_one_point_before_player_loss');
        const baseErr = validateSnapshot(base, 'score_one_point_before_player_loss settlement fallback');
        if (baseErr) return FAIL(baseErr);
        await game.waitUntil('pointSettled', 5000);
        scored = await game.snapshot();
      }
      if (num(scored.score.pointRevision) <= num(base.score.pointRevision)) return FAIL('no point settled from legal rally');
      const ruleEvidence =
        num(scored.ball.bounceRevision) > num(base.ball.bounceRevision) ||
        num(scored.ball.netContactRevision) > num(base.ball.netContactRevision) ||
        num(scored.ball.floorContactRevision) > num(base.ball.floorContactRevision) ||
        (scored.ball.side === 'offTable' && base.ball.side !== 'offTable') ||
        (scored.ball.state === 'out' && base.ball.state !== 'out');
      if (!ruleEvidence) return FAIL('score changed without public ball/rule evidence');
      const once = await game.waitUntil('pointSettled', 900);
      await game.input({ type: 'pointerDrag', from: 'paddleCenter', moves: [{ deltaX: 100, durationMs: 80 }], release: true });
      const later = await game.snapshot();
      if (num(later.score.pointRevision) > num(scored.score.pointRevision) + 1) return FAIL('same settlement allowed duplicate point revisions');
      if (scoreTotal(later) > scoreTotal(scored) + 1) return FAIL('same settlement duplicated score/stars');
      return PASS(`point settled once for ${scored.score.lastPoint}`);
    }
  },
  {
    id: 'p1-contract-challenge-clear-reward',
    level: 'P1',
    name: 'challenge clear comes from player point and rewards once',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const { before, after, err } = await establishPlayerPoint(game, 'challenge_one_point_before_clear');
      if (err) return FAIL(err);
      if (before.result !== 'none' || before.phase === 'terminal') return FAIL('challenge clear scenario pre-applied result');
      if (!isFiniteNumber(before.challenge.starTarget) || before.challenge.stars !== before.challenge.starTarget - 1) {
        return FAIL('challenge clear precondition is not exactly one point short');
      }
      if (after.result !== 'challengeClear' || after.phase !== 'terminal' || !after.feedback.resultVisible) {
        return FAIL('legal player point did not produce visible challenge clear terminal');
      }
      if (after.challenge.stars < after.challenge.starTarget) return FAIL('stars did not reach target');
      if (num(after.economy.coins) <= num(before.economy.coins) || num(after.economy.rewardRevision) <= num(before.economy.rewardRevision)) {
        return FAIL('challenge clear did not grant reward');
      }
      const postReward = await game.waitUntil('terminal', 1000);
      await game.input({ type: 'pointerDrag', from: 'paddleCenter', moves: [{ deltaY: -140, durationMs: 100 }], release: true });
      const locked = await game.snapshot();
      if (num(locked.economy.rewardRevision) !== num(postReward.economy.rewardRevision) ||
          num(locked.economy.coins) !== num(postReward.economy.coins)) {
        return FAIL('terminal challenge clear granted duplicate reward');
      }
      if (locked.screen?.controls?.nextLevel || (locked.challenge.unlockedLevels || []).length > (before.challenge.unlockedLevels || []).length) {
        const nextLevel = await game.input({ type: 'nextLevel' });
        const nextErr = validateSnapshot(nextLevel, 'nextLevel after challenge clear');
        if (nextErr) return FAIL(nextErr);
        if (nextLevel.result !== 'none' || nextLevel.phase === 'terminal') {
          return FAIL('nextLevel did not leave terminal challenge clear state');
        }
        if (nextLevel.mode !== 'challenge') return FAIL('nextLevel did not keep challenge mode');
        if (nextLevel.challenge.stars !== 0 || nextLevel.score.player !== 0 || nextLevel.score.opponent !== 0) {
          return FAIL('nextLevel kept stale score/stars from cleared level');
        }
      }
      return PASS('challenge clear and reward occur once after player point');
    }
  },
  {
    id: 'p1-contract-score-terminal-win-loss',
    level: 'P1',
    name: 'score mode win/loss terminal results and input lock are correct',
    timeoutMs: 32000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const win = await establishPlayerPoint(game, 'score_one_point_before_player_win');
      if (win.err) return FAIL(win.err);
      if (win.before.phase === 'terminal' || win.before.result !== 'none') return FAIL('win precondition already terminal');
      if (win.before.mode !== 'score' || num(win.before.score?.target) !== num(win.before.score?.player) + 1 ||
          num(win.before.economy?.lastReward) !== 0) return FAIL('win precondition is not exactly one point short and unrewarded');
      if (win.after.result !== 'playerWin' || win.after.phase !== 'terminal') return FAIL('player point did not produce playerWin terminal');
      if (!win.after.feedback?.resultVisible || win.after.score?.lastPoint !== 'player' ||
          num(win.after.score?.player) !== num(win.before.score?.player) + 1 ||
          num(win.after.score?.opponent) !== num(win.before.score?.opponent) ||
          num(win.after.score?.pointRevision) !== num(win.before.score?.pointRevision) + 1) {
        return FAIL('playerWin did not expose the expected terminal point state');
      }
      if (num(win.after.economy?.coins) <= num(win.before.economy?.coins) ||
          num(win.after.economy?.rewardRevision) !== num(win.before.economy?.rewardRevision) + 1 ||
          num(win.after.economy?.lastReward) <= 0) return FAIL('playerWin did not grant the declared reward');
      const postWin = await game.snapshot();
      await game.input({ type: 'pointerDrag', from: 'paddleCenter', moves: [{ deltaX: 120, deltaY: -160, durationMs: 120 }], release: true });
      const lockedWin = await game.snapshot();
      if (!sameTerminalState(postWin, lockedWin)) return FAIL('terminal win accepted gameplay input mutation');

      const lossRun = await establishOpponentPoint(game, 'score_one_point_before_player_loss');
      if (lossRun.err) return FAIL(lossRun.err);
      const lossPre = lossRun.before;
      const loss = lossRun.after;
      if (lossPre.mode !== 'score' || num(lossPre.score?.target) !== num(lossPre.score?.opponent) + 1 ||
          num(lossPre.economy?.lastReward) !== 0) return FAIL('loss precondition is not exactly one point short and unrewarded');
      if (loss.result !== 'playerLoss' || loss.phase !== 'terminal') return FAIL('opponent point did not produce playerLoss terminal');
      if (!loss.feedback?.resultVisible || loss.score?.lastPoint !== 'opponent' ||
          num(loss.score?.opponent) !== num(lossPre.score?.opponent) + 1 ||
          num(loss.score?.player) !== num(lossPre.score?.player) ||
          num(loss.score?.pointRevision) !== num(lossPre.score?.pointRevision) + 1) {
        return FAIL('playerLoss did not expose the expected terminal point state');
      }
      if (num(loss.economy?.rewardRevision) !== num(lossPre.economy?.rewardRevision) ||
          num(loss.economy?.coins) !== num(lossPre.economy?.coins) || num(loss.economy?.lastReward) !== 0) {
        return FAIL('playerLoss granted win reward');
      }
      const postLoss = await game.snapshot();
      await game.input({ type: 'pointerDrag', from: 'paddleCenter', moves: [{ deltaX: 120, deltaY: -160, durationMs: 120 }], release: true });
      const lockedLoss = await game.snapshot();
      if (!sameTerminalState(postLoss, lockedLoss)) return FAIL('terminal loss accepted gameplay input mutation');
      return PASS('score win/loss terminal reward and lock behavior passed');
    }
  },
  {
    id: 'p1-real-menu-mode-switch',
    level: 'P1',
    name: 'visible menu blocks playfield and real mode selection starts cleanly',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.ensureReady('challenge');
      const startErr = validateSnapshot(start, 'menu switch setup');
      if (startErr) return FAIL(startErr);
      const playfieldPointBeforePanel = await game.playfieldPoint('paddleHandle');
      // The playable HUD exposes mode buttons, but those are not the menu.
      // Enter the blocking pause state first, then use its visible Main Menu
      // control so the test does not accidentally select score mode while
      // trying to open a menu.
      const pause = await realClickIntent(browser, 'pause');
      if (!pause.ok) return FAIL(pause.reason);
      const openMenu = await realClickIntent(browser, 'menu');
      if (!openMenu.ok) return FAIL('pause opened but no visible menu/mode control was hit-testable');
      const panel = await game.snapshot();
      if (!panel.screen.overlayBlocking && panel.screen.canInteractWithPlayfield && panel.screen.activePanel === 'none') {
        return FAIL('visible menu/mode control did not open a blocking panel or menu state');
      }
      const totalBefore = scoreTotal(panel);
      const coinsBefore = num(panel.economy.coins);
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: playfieldPointBeforePanel.x + 90,
        y: playfieldPointBeforePanel.y - 80,
        modifiers: 0
      });
      await browser.sleep(160);
      const blocked = await game.snapshot();
      const totalAfter = scoreTotal(blocked);
      if (totalAfter !== totalBefore || num(blocked.economy.coins) !== coinsBefore) {
        return FAIL('blocking menu allowed hidden score/star/coin mutation');
      }
      const scoreClick = await realClickIntent(browser, 'score');
      if (!scoreClick.ok) return FAIL(scoreClick.reason);
      const after = await game.snapshot();
      const err = validateSnapshot(after, 'after real score mode selection');
      if (err) return FAIL(err);
      if (after.mode !== 'score') return FAIL('visible score/mode selection did not enter score mode');
      if (after.score.player !== 0 || after.score.opponent !== 0 || after.result !== 'none') {
        return FAIL('mode switch kept old score/result state');
      }
      if (!after.playfield.renderReady || !after.playfield.nonBlank) return FAIL('mode switch did not restore visible playfield');
      return PASS('visible menu blocked playfield and real score-mode selection started cleanly');
    }
  },
  {
    id: 'p1-contract-retry-clears-transients',
    level: 'P1',
    name: 'retry clears transient rally/progress and preserves long-term progress',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let before = await game.loadScenario('score_one_point_before_player_win');
      if (validateSnapshot(before, 'retry setup')) return FAIL(validateSnapshot(before, 'retry setup'));
      if (before.phase === 'terminal' || before.result !== 'none') return FAIL('retry setup already terminal');
      // This legal scenario is intentionally nonterminal.  Retry is allowed
      // from a paused run, so establish that state before invoking it rather
      // than assuming retry is accepted during live play.
      const paused = await game.input({ type: 'pause' });
      if (!paused || paused.ok === false || paused.phase !== 'paused') return FAIL('retry setup could not enter paused state');
      before = await game.snapshot();
      const unlockedBefore = (before.challenge.unlockedLevels || []).length;
      const coinsBefore = num(before.economy.coins);
      const retried = await game.input({ type: 'retry' });
      const err = validateSnapshot(retried, 'retried snapshot');
      if (err) return FAIL(err);
      if (retried.result !== 'none' || retried.feedback.resultVisible || retried.score.lastPoint !== 'none') {
        return FAIL('retry left result/point feedback state behind');
      }
      if (retried.mode === 'score' && (retried.score.player !== 0 || retried.score.opponent !== 0)) {
        return FAIL('retry did not clear score mode scores');
      }
      if (retried.mode === 'challenge' && retried.challenge.stars !== 0) {
        return FAIL('retry did not clear current challenge stars');
      }
      if ((retried.challenge.unlockedLevels || []).length < unlockedBefore || num(retried.economy.coins) < coinsBefore) {
        return FAIL('retry illegally erased long-term progress');
      }
      if (!['waitingServe', 'playing', 'menu', 'start'].includes(retried.phase)) return FAIL(`retry returned bad phase ${retried.phase}`);
      return PASS('retry cleaned transient state and preserved long-term progress');
    }
  },
  {
    id: 'p1-contract-invalid-actions',
    level: 'P1',
    name: 'invalid paths reject without progression mutation',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let before = await game.loadScenario('player_serve_ready');
      let setupErr = validateSnapshot(before, 'player_serve_ready');
      if (setupErr) return FAIL(setupErr);
      if (before.result !== 'none' || before.phase === 'terminal') return FAIL('player_serve_ready already contains result');
      const outside = await game.input({ type: 'activatePaddle', at: { screenX: 1, screenY: 1 } });
      let after = await game.snapshot();
      if (after.paddle.activated && outside.ok !== false) return FAIL('outside activation succeeded');
      if (!sameScore(before, after)) return FAIL('outside activation changed progression');

      before = await game.loadScenario('level_select_with_locked_level');
      setupErr = validateSnapshot(before, 'level_select_with_locked_level');
      if (setupErr) return FAIL(setupErr);
      if (!Array.isArray(before.challenge.unlockedLevels) || before.challenge.unlockedLevels.length < 1) {
        return FAIL('locked-level scenario lacks unlocked level baseline');
      }
      const lockedBefore = await game.snapshot();
      const locked = await game.input({ type: 'selectLevel', level: '__locked__' });
      after = await game.snapshot();
      if (locked.ok !== false && changed(lockedBefore, after, ['mode', 'challenge.level', 'score.player', 'score.opponent', 'challenge.stars', 'economy.coins'])) {
        return FAIL('locked level selection mutated gameplay');
      }

      const terminal = await establishPlayerPoint(game, 'score_one_point_before_player_win');
      if (terminal.err) return FAIL(terminal.err);
      const terminalBefore = terminal.after;
      await game.input({ type: 'pointerDrag', from: 'paddleCenter', moves: [{ deltaX: 160, deltaY: -160, durationMs: 120 }], release: true });
      const terminalAfter = await game.snapshot();
      if (!sameScore(terminalBefore, terminalAfter)) return FAIL('terminal movement changed progression');
      return PASS('invalid/outside/locked/terminal paths preserved invariants');
    }
  },
  {
    id: 'p2-real-shop-purchase-equip',
    level: 'P2',
    name: 'visible shop can equip or purchase cosmetic items',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('shop_with_owned_and_locked_item');
      const err = validateSnapshot(pre, 'shop_with_owned_and_locked_item');
      if (err) return FAIL(err);
      if (!pre.shop || pre.shop.ownershipRevision == null || pre.shop.appearanceRevision == null) {
        return FAIL('shop_with_owned_and_locked_item lacks shop precondition summary');
      }
      let open = await game.snapshot();
      if (!open.shop?.open || open.screen.activePanel !== 'shop') {
        const shopClick = await realClickIntent(browser, 'shop');
        if (!shopClick.ok) return FAIL(shopClick.reason);
        open = await game.snapshot();
      }
      if (!open.shop?.open || open.screen.activePanel !== 'shop') return FAIL('shop panel did not open');
      if (!open.screen.overlayBlocking && open.screen.canInteractWithPlayfield) return FAIL('shop does not block playfield');
      const coinsBefore = num(open.economy.coins);
      const ownershipBefore = num(open.shop.ownershipRevision);
      await browser.sleep(240);
      const itemPoint = await browser.eval(`(function() {
        const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          const interactive = /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) ||
            el.getAttribute('role') === 'button' || el.tabIndex >= 0 ||
            el.hasAttribute('onclick') || typeof el.onclick === 'function' ||
            s.cursor === 'pointer';
          if (!interactive || r.width <= 8 || r.height <= 8 ||
              s.display === 'none' || s.visibility === 'hidden' ||
              s.pointerEvents === 'none' || el.disabled ||
              el.getAttribute('aria-disabled') === 'true') return false;
          const text = [
            el.textContent,
            el.getAttribute('aria-label'),
            el.getAttribute('title'),
            el.getAttribute('value')
          ].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim();
          const itemState = /\\b(?:owned|equipped|free|locked|preview|price|coins?)\\b|🪙|🔒|💰|\\b\\d+(?:\\.\\d+)?\\s*(?:c|coins?)\\b/i;
          return itemState.test(text) &&
            !/not enough|buy|purchase/i.test(text);
        }).sort((a, b) => {
          const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
          return (br.width * br.height) - (ar.width * ar.height);
        });
        for (const el of candidates) {
          let r = el.getBoundingClientRect();
          let x = r.left + r.width / 2;
          let y = r.top + r.height / 2;
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) {
            el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
            r = el.getBoundingClientRect();
            x = r.left + r.width / 2;
            y = r.top + r.height / 2;
          }
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
          const hit = document.elementFromPoint(x, y);
          if (hit && (hit === el || el.contains(hit))) return { x, y };
        }
        return null;
      })()`);
      if (!itemPoint) return FAIL('no visible shop item control found');
      await browser.mouseClick(itemPoint.x, itemPoint.y);
      await browser.sleep(220);
      const selected = await game.snapshot();
      if (!selected.shop.open) return FAIL('shop selection closed shop unexpectedly');
      if (!selected.shop.selectedItem ||
          (selected.shop.selectedOwned !== true && selected.shop.selectedLocked !== true)) {
        return FAIL('visible shop item click did not update selection');
      }
      if (selected.shop.selectedLocked && selected.shop.selectedAffordable && selected.shop.purchaseAvailable) {
        const buyClick = await realClickIntent(browser, 'buy');
        if (!buyClick.ok) return FAIL(buyClick.reason);
        const bought = await game.snapshot();
        if (num(bought.economy.coins) > coinsBefore) return FAIL('purchase increased coins');
        if (num(bought.shop.ownershipRevision) <= ownershipBefore && !bought.shop.selectedOwned) {
          return FAIL('affordable locked purchase did not change ownership/equip state');
        }
      } else if (selected.shop.selectedOwned) {
        if (num(selected.economy.coins) !== coinsBefore && !selected.shop.selectedLocked) {
          return FAIL('owned item equip changed coins');
        }
        if (num(selected.shop.appearanceRevision) < num(open.shop.appearanceRevision)) {
          return FAIL('owned item equip regressed appearance revision');
        }
      }
      const closeClick = await realClickIntent(browser, 'close');
      if (!closeClick.ok) return FAIL(closeClick.reason);
      await browser.sleep(180);
      const closed = await game.snapshot();
      if (closed.screen.activePanel === 'shop' || closed.shop?.open) return FAIL('shop did not close after visible purchase/equip path');
      return PASS('visible shop path opened, blocked playfield, and changed equip/purchase state coherently');
    }
  },
  {
    id: 'p2-contract-shop-insufficient-coins',
    level: 'P2',
    name: 'insufficient shop purchase is rejected without currency or ownership mutation',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.loadScenario('shop_insufficient_coins');
      const poorErr = validateSnapshot(pre, 'shop_insufficient_coins');
      if (poorErr) return FAIL(poorErr);
      if (!pre.shop || pre.economy.coins < 0) return FAIL('shop_insufficient_coins lacks legal economy/shop baseline');
      if (!pre.shop?.open || pre.screen.activePanel !== 'shop') await game.input({ type: 'openPanel', panel: 'shop' });
      const baseline = await game.snapshot();
      const baselineErr = validateSnapshot(baseline, 'shop_insufficient_coins after opening shop');
      if (baselineErr) return FAIL(baselineErr);
      if (!baseline.shop?.open || baseline.screen.activePanel !== 'shop') return FAIL('shop panel did not open');
      const sameProgression = (a, b) =>
        sameScore(a, b) &&
        num(a?.economy?.lastReward) === num(b?.economy?.lastReward) &&
        JSON.stringify(a?.challenge?.unlockedLevels || []) === JSON.stringify(b?.challenge?.unlockedLevels || []);
      const committedEquipped = JSON.stringify(baseline.shop.equipped ?? null);
      const alreadySelected =
        baseline.shop.selectedItem != null &&
        baseline.shop.selectedLocked === true &&
        (baseline.shop.selectedAffordable === false ||
        baseline.shop.purchaseAvailable === false || baseline.shop.toastVisible === true);
      if (!alreadySelected) {
        const unaffordablePoint = await browser.eval(`(function() {
          const coins = ${JSON.stringify(num(baseline.economy?.coins))};
          const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            if (r.width <= 8 || r.height <= 8 || s.display === 'none' ||
                s.visibility === 'hidden' || s.pointerEvents === 'none' ||
                el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
            const text = [
              el.textContent || '',
              el.getAttribute('aria-label') || '',
              el.getAttribute('title') || ''
            ].join(' ').replace(/\\s+/g, ' ').trim();
            const prices = text.match(/\\d+(?:\\.\\d+)?/g) || [];
            if (!prices.some(raw => Number(raw) > coins)) return false;
            const isButton = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button';
            const purchaseControl = isButton && /\\b(?:buy|purchase)\\b/i.test(text);
            if (purchaseControl) return false;
            return isButton || typeof el.onclick === 'function' || s.cursor === 'pointer';
          });
          const el = candidates.sort((a, b) => {
            const ar = a.getBoundingClientRect();
            const br = b.getBoundingClientRect();
            return (ar.width * ar.height) - (br.width * br.height);
          })[0];
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const y = r.top + r.height / 2;
          const hit = document.elementFromPoint(x, y);
          if (!hit || (!el.contains(hit) && !hit.contains(el))) return null;
          return { x, y };
        })`);
        if (!unaffordablePoint) return FAIL('shop scenario did not expose a visible unaffordable item');
        await browser.mouseClick(unaffordablePoint.x, unaffordablePoint.y);
        await browser.sleep(220);
      }
      const selected = await game.snapshot();
      if (!selected.shop || selected.shop.selectedLocked !== true) return FAIL('shop did not expose a locked item selection');
      if (selected.shop.selectedAffordable !== false &&
          selected.shop.purchaseAvailable !== false &&
          selected.shop.toastVisible !== true) {
        return FAIL('insufficient coin precondition not observable');
      }
      await game.input({ type: 'shopBuySelected' });
      const rejected = await game.snapshot();
      if (!rejected.shop || rejected.shop.selectedLocked !== true) return FAIL('insufficient purchase lost locked selection state');
      if (rejected.shop.selectedAffordable !== false &&
          rejected.shop.purchaseAvailable !== false &&
          rejected.shop.toastVisible !== true &&
          rejected.ok !== false) {
        return FAIL('insufficient purchase rejection not observable');
      }
      if (num(rejected.economy.coins) < 0) return FAIL('shop allowed negative coins');
      if (!sameProgression(baseline, rejected)) return FAIL('insufficient purchase changed score, stars, coins, or rewards');
      if (num(rejected.shop.ownershipRevision) !== num(baseline.shop.ownershipRevision)) return FAIL('insufficient purchase changed ownership');
      if (JSON.stringify(rejected.shop.equipped ?? null) !== committedEquipped) return FAIL('insufficient purchase changed equipped state');
      await game.input({ type: 'closePanel' });
      const closed = await game.snapshot();
      if (closed.shop?.open || closed.screen.activePanel === 'shop') return FAIL('shop insufficient path did not close cleanly');
      if (!sameProgression(baseline, closed)) return FAIL('shop close changed score, stars, coins, or rewards');
      if (closed.shop?.previewActive === true) return FAIL('shop close committed an unpaid preview');
      if (closed.shop && JSON.stringify(closed.shop.equipped ?? null) !== committedEquipped) {
        return FAIL('shop close changed committed equipped state');
      }
      return PASS('insufficient purchase rejected with coins, ownership, progression, and committed appearance unchanged');
    }
  },
  {
    id: 'p2-real-settings-toggles',
    level: 'P2',
    name: 'visible settings toggles are recoverable and isolated from gameplay',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadScenario('paused_from_rally');
      const setupErr = validateSnapshot(setup, 'paused_from_rally');
      if (setupErr) return FAIL(setupErr);
      if (setup.phase !== 'paused' && setup.screen.activePanel !== 'pause') return FAIL('paused_from_rally is not paused');
      const base = await game.snapshot();
      await browser.sleep(100);
      const settingsClick = await realClickIntent(browser, 'settings');
      if (!settingsClick.ok) return FAIL(settingsClick.reason);
      let settings = await game.snapshot();
      if (settings.screen.activePanel !== 'settings') return FAIL('settings panel did not open');
      const musicBefore = settings.feedback.settings.musicEnabled;
      const sfxBefore = settings.feedback.settings.sfxEnabled;
      const musicClick = await realClickIntent(browser, 'music');
      if (!musicClick.ok) return FAIL(musicClick.reason);
      await browser.sleep(100);
      const sfxClick = await realClickIntent(browser, 'sfx');
      if (!sfxClick.ok) return FAIL(sfxClick.reason);
      await browser.sleep(100);
      settings = await game.snapshot();
      if (settings.feedback.settings.musicEnabled === musicBefore) return FAIL('music toggle was not observable');
      if (settings.feedback.settings.sfxEnabled === sfxBefore) return FAIL('sfx toggle was not observable');
      if (!sameScore(base, settings)) return FAIL('settings toggles mutated gameplay progression');
      const closeSettings = await realClickIntent(browser, 'close');
      if (!closeSettings.ok) return FAIL(closeSettings.reason);
      const closedSettings = await game.snapshot();
      if (closedSettings.phase !== base.phase ||
          closedSettings.screen.activePanel !== base.screen.activePanel) {
        return FAIL('settings panel did not return to originating screen');
      }
      return PASS('settings are observable, isolated, and recoverable');
    }
  },
  {
    id: 'p2-real-leaderboard-recoverable',
    level: 'P2',
    name: 'visible leaderboard panel blocks playfield and recovers',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.ensureReady('challenge');
      const setupErr = validateSnapshot(setup, 'leaderboard setup');
      if (setupErr) return FAIL(setupErr);
      const beforeBoard = await game.snapshot();
      const boardClick = await realClickIntent(browser, 'leaderboard');
      if (!boardClick.ok) return FAIL(boardClick.reason);
      const board = await game.snapshot();
      if (board.screen.activePanel !== 'leaderboard') return FAIL('leaderboard panel did not open');
      if (!board.screen.overlayBlocking || board.screen.canInteractWithPlayfield) return FAIL('leaderboard does not block playfield');
      if (!sameScore(beforeBoard, board)) return FAIL('leaderboard open mutated gameplay progression');
      await game.waitUntil('panelStable', 900);
      const stableBoard = await game.snapshot();
      if (stableBoard.screen.activePanel !== 'leaderboard') return FAIL('leaderboard panel did not stabilize');
      if (!stableBoard.screen.overlayBlocking || stableBoard.screen.canInteractWithPlayfield) return FAIL('leaderboard does not block playfield');
      if (!sameScore(beforeBoard, stableBoard)) return FAIL('leaderboard panel mutated gameplay progression');
      const closeDeadline = Date.now() + 2000;
      let closeClick = { ok: false, reason: 'no visible hit-testable close control found' };
      let recovered = await game.snapshot();
      while (recovered.screen.activePanel === 'leaderboard' && Date.now() < closeDeadline) {
        closeClick = await realClickIntent(browser, 'close');
        if (closeClick.ok) recovered = await game.snapshot();
        if (recovered.screen.activePanel === 'leaderboard') await browser.sleep(120);
      }
      if (!closeClick.ok) return FAIL(closeClick.reason);
      if (recovered.screen.activePanel !== 'none' ||
          recovered.screen.overlayBlocking ||
          !recovered.screen.canInteractWithPlayfield) return FAIL('leaderboard did not recover usable playfield');
      if (!sameScore(beforeBoard, recovered)) return FAIL('leaderboard close mutated gameplay progression');
      return PASS('leaderboard opened through a visible control, blocked playfield, and recovered');
    }
  }
];

module.exports = { suite };
