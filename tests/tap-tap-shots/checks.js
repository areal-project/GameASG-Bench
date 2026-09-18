// === GDD Coverage Map ===
// M1 Home and first-play entry: p0-contract-schema-and-visible-playfield, p1-click-start-playfield-motion-chain, p1-touch-playfield-input-equivalence
// M2 Tap-driven basketball motion: p1-click-start-playfield-motion-chain, p1-tap-location-independence-contract, p1-rhythm-wait-tap-physics-chain
// M3 Hoop-side direction switch: p1-direction-opposite-hoop-side-contract
// M4 Physical collision risk: p1-collision-risk-motion-feedback
// M5 Valid basket scoring: p1-approach-hoop-scoring-feedback
// M6 Timed failure and result: p1-timer-failure-terminal-lock
// M7 Restart and home return: p1-result-retry-home-invariants
// M8 Pause/resume flow: p1-pause-resume-blocking-freeze
// M9 Coins and basic cosmetics: p1-shop-panel-blocking-and-rejection, p1-economy-result-shop-purchase
// M10 Sound setting: p1-sound-toggle-persistence-invariant
// M11 Leaderboard access: p1-shop-panel-blocking-and-rejection, p2-leaderboard-panel-invariant
// M12 Rich shot feedback and heat depth: p2-heat-feedback-depth
// M13 Expanded collection and presentation: p1-economy-result-shop-purchase, p2-leaderboard-panel-invariant
//
// === Category Map ===
// TS-P0-01 -> p0-contract-schema-and-visible-playfield, p0-invalid-action-contract-rejects
// TS-P0-02 -> p0-contract-schema-and-visible-playfield
// TS-P1-01 -> p1-click-start-playfield-motion-chain
// TS-P1-02 -> p1-tap-location-independence-contract
// TS-P1-03 -> p1-rhythm-wait-tap-physics-chain
// TS-P1-04 -> p1-touch-playfield-input-equivalence
// TS-P1-05 -> p1-direction-opposite-hoop-side-contract
// TS-P1-06 -> p1-approach-hoop-scoring-feedback
// TS-P1-07 -> p1-collision-risk-motion-feedback
// TS-P1-08 -> p1-timer-failure-terminal-lock
// TS-P1-09 -> p1-result-retry-home-invariants
// TS-P1-10 -> p1-pause-resume-blocking-freeze
// TS-P1-11 -> p1-timer-failure-terminal-lock, p1-economy-result-shop-purchase
// TS-P1-12 -> p1-economy-result-shop-purchase
// TS-P1-13 -> p1-shop-panel-blocking-and-rejection
// TS-P1-14 -> p1-click-start-playfield-motion-chain, p1-approach-hoop-scoring-feedback, p1-timer-failure-terminal-lock, p1-shop-panel-blocking-and-rejection
// TS-P1-15 -> p1-sound-toggle-persistence-invariant
// TS-P1-16 -> p1-shop-panel-blocking-and-rejection, p2-leaderboard-panel-invariant
// TS-P2-01 -> p2-heat-feedback-depth
// TS-P2-02 -> p1-economy-result-shop-purchase
// TS-P2-03 -> p2-leaderboard-panel-invariant
// TS-P2-04 -> p2-heat-feedback-depth
//
// === Rationality Map ===
// p1-click-start-playfield-motion-chain: M1/M2 | real action: browser.mouseClick on runtime playfield bounds | independent observation: phase + ball motion/trend + playfield/canvas revision | empty-shell failure: API-only start, phase-only shell, or no visible impulse fails.
// p1-touch-playfield-input-equivalence: M1/M2 | real action: Input.dispatchTouchEvent on runtime playfield bounds | independent observation: touch-start snapshot + motion/playfield revision | empty-shell failure: mouse-only or API-only implementation fails touch operability.
// p1-tap-location-independence-contract: M2 | real action: contract tapPlayfield semantic points after legal scenario setup | independent observation: accepted tap + motion revision + stable hoop-side trend | empty-shell failure: coordinate aiming, direct scoring, or tap counter shell fails.
// p1-rhythm-wait-tap-physics-chain: M2/M4 | real action: tapSequence then wait then tap through public player actions | independent observation: motion/timer/playfield revisions + vertical trend recovery + non-negative invariants | empty-shell failure: one-shot movement or no release physics fails.
// p1-direction-opposite-hoop-side-contract: M3 | real action: same tap action in right-hoop and left-hoop legal scenarios; direction opposite | independent observation: Math.sign-compatible screen/trend deltas + hoop side | empty-shell failure: mirrored, world-only, or same-direction movement fails.
// p1-approach-hoop-scoring-feedback: M5 | real action: legal approach_hoop scenario plus tapSequence/wait timing actions | independent observation: score delta + shot quality + feedback/hoop/timer revisions | empty-shell failure: direct score setter or stale feedback fails.
// p1-collision-risk-motion-feedback: M4 | real action: legal collision_risk scenario plus wait/tap timing | independent observation: collision kind + motion trend/revision + visible feedback and score invariant | empty-shell failure: cosmetic-only collision label fails.
// p1-timer-failure-terminal-lock: M6 | real action: wait long from timed_run_after_score, then tap after terminal | independent observation: timer ratio/state + result phase + locked score/motion/economy | empty-shell failure: countdown-only shell or unlocked result fails.
// p1-result-retry-home-invariants: M7 | real action: result tap rejection, retry, and home contract controls | independent observation: reset score/timer/phase and persistent best/coins preservation | empty-shell failure: overlay hide without transient cleanup fails.
// p1-pause-resume-blocking-freeze: M8 | real action: pause, wait/tap while blocked, resume through public player controls | independent observation: overlay blocking + stable motion/timer while paused + resumed motion | empty-shell failure: visual pause with running physics or live taps fails.
// p1-shop-panel-blocking-and-rejection: M9/M11 | real action: openPanel/selectShopItem/closePanel with blocked playfield tap | independent observation: overlay state + panel status + unchanged score/timer/economy on blocked/rejected path | empty-shell failure: panel that does not block or shop that mutates on rejection fails.
// p1-economy-result-shop-purchase: M9/M13 | real action: timed failure result then affordable shop selection | independent observation: coins/persistence/equipped or ownership deltas + visible revision | empty-shell failure: pre-awarded coins or label-only purchase fails.
// p1-sound-toggle-persistence-invariant: M10 | real action: toggleSound from home and playing | independent observation: sound flag + persistence revision + stable gameplay/economy fields | empty-shell failure: sound button that starts shots or resets state fails.
// p2-leaderboard-panel-invariant: M11/M13 | real action: openPanel leaderboard, blocked tap, closePanel | independent observation: legal leaderboard status + blocking + unchanged gameplay/economy | empty-shell failure: leaderboard button mutating run or not blocking fails.
// p2-heat-feedback-depth: M12 | real action: repeated approach_hoop scoring attempts and collision comparison when available | independent observation: heat/quality/effect revision relation to score/collision | empty-shell failure: static streak badge or uncoupled effect fails.

function PASS(detail) {
  return { status: 'PASS', detail: detail || '' };
}

function FAIL(detail) {
  return { status: 'FAIL', detail: detail || 'check failed' };
}

function NA(detail) {
  return { status: 'NOT_APPLICABLE', detail: detail || '' };
}

const PHASES = ['home', 'playing', 'paused', 'result', 'shop', 'leaderboard'];
const TIMER_STATES = ['hidden', 'normal', 'warning', 'danger', 'expired'];
const RESULTS = ['none', 'active', 'runEnded'];
const SIDES = ['left', 'right'];
const TRENDS = ['left', 'right', 'up', 'down', 'still'];

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function nonNegative(v) {
  return isFiniteNumber(v) && v >= 0;
}

function legalBounds(b) {
  return isObject(b) &&
    isFiniteNumber(b.left) &&
    isFiniteNumber(b.top) &&
    isFiniteNumber(b.right) &&
    isFiniteNumber(b.bottom) &&
    isFiniteNumber(b.centerX) &&
    isFiniteNumber(b.centerY) &&
    b.right > b.left &&
    b.bottom > b.top;
}

function cloneComparable(s) {
  return JSON.parse(JSON.stringify(s || {}));
}

function fieldStable(before, after, path) {
  const a = path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), before);
  const b = path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), after);
  return JSON.stringify(a) === JSON.stringify(b);
}

function changed(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function revisionAdvanced(before, after, path) {
  const a = path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), before);
  const b = path.split('.').reduce((v, k) => (v == null ? undefined : v[k]), after);
  if (isFiniteNumber(a) && isFiniteNumber(b)) return b !== a;
  return changed(a, b);
}

function ballMoved(before, after) {
  if (!before || !after || !before.ball || !after.ball) return false;
  const dx = Math.abs((after.ball.screenX || 0) - (before.ball.screenX || 0));
  const dy = Math.abs((after.ball.screenY || 0) - (before.ball.screenY || 0));
  return dx > 0.5 || dy > 0.5 || revisionAdvanced(before, after, 'ball.motionRevision');
}

function trendMatchesSide(s) {
  if (!s || !s.hoop || !s.ball) return false;
  return s.hoop.side === 'right'
    ? s.ball.horizontalTrend === 'right' || s.ball.screenX < s.hoop.screenX
    : s.ball.horizontalTrend === 'left' || s.ball.screenX > s.hoop.screenX;
}

function directionSign(s) {
  if (!s || !s.ball) return 0;
  if (s.ball.horizontalTrend === 'right') return 1;
  if (s.ball.horizontalTrend === 'left') return -1;
  return 0;
}

function stableEconomyAndScore(before, after) {
  return before.score === after.score &&
    before.coins === after.coins &&
    before.bestScore === after.bestScore &&
    JSON.stringify(before.shop && before.shop.itemCounts) === JSON.stringify(after.shop && after.shop.itemCounts) &&
    (!before.shop || !after.shop || (
      before.shop.equippedBall === after.shop.equippedBall &&
      before.shop.equippedBackground === after.shop.equippedBackground
    ));
}

function validateSnapshot(s) {
  const errors = [];
  if (!isObject(s)) errors.push('snapshot is not an object');
  if (!PHASES.includes(s.phase)) errors.push('phase enum invalid');
  if (typeof s.overlayBlocking !== 'boolean') errors.push('overlayBlocking missing boolean');
  if (typeof s.canInteractWithPlayfield !== 'boolean') errors.push('canInteractWithPlayfield missing boolean');
  if (!nonNegative(s.score) || !nonNegative(s.bestScore) || !nonNegative(s.coins)) errors.push('score/bestScore/coins must be non-negative numbers');
  if (!RESULTS.includes(s.result)) errors.push('result enum invalid');
  if (!isObject(s.timer) || !TIMER_STATES.includes(s.timer.state) || !isFiniteNumber(s.timer.ratio) || !isFiniteNumber(s.timer.revision)) errors.push('timer envelope invalid');
  if (s.timer && s.timer.ratio < 0) errors.push('timer ratio negative');
  if (!isObject(s.ball) || typeof s.ball.visible !== 'boolean' || !isFiniteNumber(s.ball.screenX) || !isFiniteNumber(s.ball.screenY) || !isFiniteNumber(s.ball.motionRevision)) errors.push('ball envelope invalid');
  if (s.ball && (!TRENDS.includes(s.ball.verticalTrend) || !TRENDS.includes(s.ball.horizontalTrend))) errors.push('ball trend enum invalid');
  if (!isObject(s.hoop) || typeof s.hoop.visible !== 'boolean' || !SIDES.includes(s.hoop.side) || !legalBounds(s.hoop.openingBounds) || !isFiniteNumber(s.hoop.revision)) errors.push('hoop envelope invalid');
  if (!isObject(s.playfield) || typeof s.playfield.visible !== 'boolean' || !legalBounds(s.playfield.bounds) || !isFiniteNumber(s.playfield.visualRevision)) errors.push('playfield envelope invalid');
  if (!isObject(s.feedback) || !isFiniteNumber(s.feedback.lastScoreDelta) || !nonNegative(s.feedback.heatLevel) || !isFiniteNumber(s.feedback.visibleEffectRevision)) errors.push('feedback envelope invalid');
  if (!isObject(s.shop) || !isObject(s.shop.itemCounts) || !nonNegative(s.shop.balance)) errors.push('shop envelope invalid');
  if (!isObject(s.sound) || typeof s.sound.enabled !== 'boolean') errors.push('sound envelope invalid');
  if (!isObject(s.leaderboard) || typeof s.leaderboard.status !== 'string') errors.push('leaderboard envelope invalid');
  if (!isObject(s.persistence) || !isFiniteNumber(s.persistence.revision)) errors.push('persistence envelope invalid');
  if (!isObject(s.lastAction) || typeof s.lastAction.ok !== 'boolean') errors.push('lastAction envelope invalid');
  if ((s.phase === 'shop' || s.phase === 'leaderboard' || s.phase === 'paused' || s.phase === 'result') && s.canInteractWithPlayfield) {
    errors.push('blocking phase reports playfield interactive');
  }
  return errors;
}

function createGameDriver(browser) {
  async function pageContract() {
    return await browser.eval(`
      (function () {
        var api = window.__gameTest;
        return {
          hasApi: !!api,
          reset: !!(api && typeof api.reset === 'function'),
          getSnapshot: !!(api && typeof api.getSnapshot === 'function'),
          input: !!(api && typeof api.input === 'function'),
          loadScenario: !!(api && typeof api.loadScenario === 'function')
        };
      })()
    `);
  }

  async function snapshot() {
    return await browser.eval(`
      (function () {
        if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') {
          return { __l2_err__: 'missing window.__gameTest.getSnapshot' };
        }
        return window.__gameTest.getSnapshot();
      })()
    `);
  }

  async function reset() {
    return await browser.eval(`
      (function () {
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') {
          return { __l2_err__: 'missing window.__gameTest.reset' };
        }
        return window.__gameTest.reset();
      })()
    `);
  }

  async function input(action) {
    const json = JSON.stringify(action);
    return await browser.eval(`
      (function () {
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') {
          return { __l2_err__: 'missing window.__gameTest.input' };
        }
        return window.__gameTest.input(${json});
      })()
    `);
  }

  async function loadScenario(name) {
    const json = JSON.stringify(name);
    return await browser.eval(`
      (function () {
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') {
          return { __l2_err__: 'missing window.__gameTest.loadScenario' };
        }
        return window.__gameTest.loadScenario(${json});
      })()
    `);
  }

  async function wait(duration) {
    await input({ type: 'wait', duration });
    await browser.sleep(duration === 'long' ? 700 : duration === 'medium' ? 350 : 120);
    return await snapshot();
  }

  async function playfieldPoint(options = {}) {
    const s = await snapshot();
    if (s && s.playfield && legalBounds(s.playfield.bounds)) {
      if (!options.avoidInteractive) {
        return { x: s.playfield.bounds.centerX, y: s.playfield.bounds.centerY };
      }
      const bounds = s.playfield.bounds;
      const payload = JSON.stringify({ bounds });
      const safe = await browser.eval(`
        (function () {
          const q = ${payload};
          const b = q.bounds;
          const selectors = [
            'button', '[role="button"]', 'input:not([type="hidden"])', 'select', 'textarea',
            'a[href]', '[tabindex]:not([tabindex="-1"])', '[data-action]', '[data-panel]', '[data-control]'
          ].join(',');
          function visible(el, r) {
            const cs = getComputedStyle(el);
            return r.width > 2 && r.height > 2 && cs.display !== 'none' && cs.visibility !== 'hidden' &&
              cs.pointerEvents !== 'none' && r.bottom >= 0 && r.right >= 0 && r.top <= innerHeight && r.left <= innerWidth;
          }
          const controls = Array.from(document.querySelectorAll(selectors)).map(el => el.getBoundingClientRect())
            .filter(r => visible(document.elementFromPoint(Math.max(0, r.left + r.width / 2), Math.max(0, r.top + r.height / 2)) || document.body, r));
          const fractions = [
            [0.04, 0.50], [0.96, 0.50], [0.50, 0.04], [0.50, 0.96],
            [0.04, 0.04], [0.96, 0.04], [0.04, 0.96], [0.96, 0.96], [0.50, 0.50]
          ];
          for (const [fx, fy] of fractions) {
            const x = b.left + (b.right - b.left) * fx;
            const y = b.top + (b.bottom - b.top) * fy;
            if (!controls.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)) {
              return { x, y };
            }
          }
          return { x: b.left + (b.right - b.left) * 0.08, y: b.top + (b.bottom - b.top) * 0.08 };
        })()
      `);
      if (safe && isFiniteNumber(safe.x) && isFiniteNumber(safe.y)) return safe;
      return { x: bounds.centerX, y: bounds.centerY };
    }
    throw new Error('playfield.bounds must expose a runtime screen center for real mouse/touch tap checks');
  }

  async function realClickPlayfield(options = {}) {
    const p = await playfieldPoint(options);
    const hit = await browser.eval(`
      (function () {
        const x = ${JSON.stringify(p.x)};
        const y = ${JSON.stringify(p.y)};
        const el = document.elementFromPoint(x, y);
        return { ok: !!el, tag: el && el.tagName, id: el && el.id, label: el && (el.getAttribute('aria-label') || el.title || el.textContent || '').trim().slice(0, 80) };
      })()
    `);
    if (!hit || !hit.ok) throw new Error('playfield semantic point is not hit-testable');
    await browser.mouseClick(p.x, p.y);
    return { point: p, hit };
  }

  async function realClickVisibleControl(terms, options = {}) {
    const payload = JSON.stringify({ terms, prefer: options.prefer || [] });
    const target = await browser.eval(`
      (function () {
        const query = ${payload};
        const terms = (query.terms || []).map(String).map(s => s.toLowerCase());
        const prefer = (query.prefer || []).map(String).map(s => s.toLowerCase());
        function visible(el, rect) {
          const cs = getComputedStyle(el);
          return rect.width > 2 && rect.height > 2 &&
            cs.visibility !== 'hidden' && cs.display !== 'none' &&
            cs.pointerEvents !== 'none' &&
            rect.bottom >= 0 && rect.right >= 0 &&
            rect.top <= innerHeight && rect.left <= innerWidth;
        }
        function labelFor(el) {
          const parts = [];
          parts.push(el.innerText || '', el.textContent || '', el.value || '');
          parts.push(el.getAttribute('aria-label') || '', el.getAttribute('title') || '');
          parts.push(el.id || '', el.getAttribute('name') || '', el.getAttribute('role') || '');
          for (const a of el.attributes || []) {
            if (/^data-(action|panel|mode|control|test|state|category|item|kind)$/i.test(a.name)) parts.push(a.value || '');
          }
          if (el.id) {
            const lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
            if (lab) parts.push(lab.innerText || lab.textContent || '');
          }
          const closestLabel = el.closest('label');
          if (closestLabel) parts.push(closestLabel.innerText || closestLabel.textContent || '');
          return parts.join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
        }
        const selectors = [
          'button', '[role="button"]', 'input:not([type="hidden"])', 'select', 'textarea',
          'a[href]', '[tabindex]:not([tabindex="-1"])', '[data-action]', '[data-panel]', '[data-control]'
        ].join(',');
        const candidates = [];
        for (const el of document.querySelectorAll(selectors)) {
          if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
          const rect = el.getBoundingClientRect();
          const label = labelFor(el);
          if (!visible(el, rect)) continue;
          let score = 0;
          for (const t of terms) if (t && label.includes(t)) score += 10;
          for (const t of prefer) if (t && label.includes(t)) score += 1;
          if (score <= 0) continue;
          candidates.push({ el, score, label, rect });
        }
        candidates.sort((a, b) => b.score - a.score || b.rect.width * b.rect.height - a.rect.width * a.rect.height);
        for (const c of candidates) {
          c.el.scrollIntoView({ block: 'center', inline: 'center' });
          const r = c.el.getBoundingClientRect();
          const x = Math.max(1, Math.min(innerWidth - 1, r.left + r.width / 2));
          const y = Math.max(1, Math.min(innerHeight - 1, r.top + r.height / 2));
          const hit = document.elementFromPoint(x, y);
          if (hit === c.el || c.el.contains(hit)) {
            return { ok: true, x, y, label: c.label, tag: c.el.tagName, id: c.el.id || '' };
          }
        }
        return { ok: false, reason: 'no visible hit-tested control', terms, candidates: candidates.slice(0, 5).map(c => c.label) };
      })()
    `);
    if (!target || !target.ok) throw new Error(`no visible control for ${terms.join('/')} (${target && target.reason || 'no target'})`);
    await browser.mouseClick(target.x, target.y);
    await browser.sleep(options.afterMs || 180);
    return target;
  }

  async function realClickShopItem(rule = {}) {
    const s = await snapshot();
    const balance = s && s.shop ? Number(s.shop.balance) || 0 : 0;
    const payload = JSON.stringify({ affordable: rule.affordable !== false, balance });
    let target = null;
    await browser.sleep(120);
    for (let attempt = 0; attempt < 4; attempt++) {
      target = await browser.eval(`
      (function () {
        const query = ${payload};
        function labelFor(el) {
          const parts = [el.innerText || '', el.textContent || '', el.value || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.id || '', el.getAttribute('name') || ''];
          for (const a of el.attributes || []) if (/^data-/i.test(a.name)) parts.push(a.value || '');
          return parts.join(' ').replace(/\\s+/g, ' ').trim();
        }
        function visible(el, rect) {
          const cs = getComputedStyle(el);
          return rect.width > 2 && rect.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none' &&
            rect.bottom >= 0 && rect.right >= 0 && rect.top <= innerHeight && rect.left <= innerWidth;
        }
        const candidates = [];
        for (const el of document.querySelectorAll('button, [role="button"], [tabindex]:not([tabindex="-1"]), [data-action], [data-control], [data-item], [onclick], [aria-label], [title], div, li, article, section, small')) {
          if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
          const rect = el.getBoundingClientRect();
          if (!visible(el, rect)) continue;
          const label = labelFor(el);
          const lower = label.toLowerCase();
          const purchaseState = (text) => /\\b(?:locked|buy|purchase|unlock|need)\\b/.test(text) || /(?:[$€£¥🪙💲💰●]\\s*\\d|\\b\\d+\\s*(?:coins?|credits?|c)\\b|\\b\\d+\\s*[$€£¥🪙💲💰])/.test(text);
          const hasPurchaseState = purchaseState(lower);
          const hasNestedPurchase = Array.from(el.querySelectorAll('button, [role="button"], [tabindex], [onclick], [aria-label], [title], div, li, article, section, small')).some(child => purchaseState(labelFor(child).toLowerCase()));
          if (!hasPurchaseState || hasNestedPurchase) continue;
          const parentLabel = el.parentElement ? labelFor(el.parentElement).toLowerCase() : '';
          if (/\\b(?:equipped|owned|already\\s+equipped)\\b/.test(parentLabel)) continue;
          if (/\\b(?:balance|wallet|total|earned|result)\\b/.test(lower) || lower.includes('shopbalance') || lower.includes('coinchip')) continue;
          if (lower.includes('tab') || lower === 'balls' || lower === 'courts' || lower.includes('close')) continue;
          const nums = label.match(/\\b\\d+\\b/g) || [];
          const price = nums.length ? Number(nums[nums.length - 1]) : NaN;
          if (query.affordable && Number.isFinite(price) && price > query.balance) continue;
          candidates.push({ el, label, rect, price: Number.isFinite(price) ? price : -1 });
        }
        candidates.sort((a, b) => {
          const ap = a.price >= 0 ? a.price : 999999;
          const bp = b.price >= 0 ? b.price : 999999;
          return ap - bp || b.rect.width * b.rect.height - a.rect.width * a.rect.height;
        });
        for (const c of candidates) {
          c.el.scrollIntoView({ block: 'center', inline: 'center' });
          const r = c.el.getBoundingClientRect();
          const x = Math.max(1, Math.min(innerWidth - 1, r.left + r.width / 2));
          const y = Math.max(1, Math.min(innerHeight - 1, r.top + r.height / 2));
          const hit = document.elementFromPoint(x, y);
          if (hit === c.el || c.el.contains(hit)) return { ok: true, x, y, label: c.label, price: c.price };
        }
        return { ok: false, reason: 'no visible affordable locked shop item', balance, candidates: candidates.map(c => c.label).slice(0, 5) };
      })()
      `);
      if (target && target.ok) break;
      if (attempt < 3) await browser.sleep(100);
    }
    if (!target || !target.ok) throw new Error(target && target.reason ? `${target.reason} balance=${target.balance}` : 'no shop item target');
    await browser.mouseClick(target.x, target.y);
    await browser.sleep(rule.afterMs || 220);
    return target;
  }

  return { pageContract, snapshot, reset, input, loadScenario, wait, playfieldPoint, realClickPlayfield, realClickVisibleControl, realClickShopItem };
}

async function requireApi(game) {
  const contract = await game.pageContract();
  if (!contract || contract.__l2_err__) return `contract probe failed: ${contract && contract.__l2_err__}`;
  const missing = ['hasApi', 'reset', 'getSnapshot', 'input', 'loadScenario'].filter(k => !contract[k]);
  return missing.length ? `missing public API parts: ${missing.join(', ')}` : '';
}

async function loadLegalScenario(game, name, expectedPhase) {
  const s = await game.loadScenario(name);
  if (!s || s.__l2_err__) return { error: s && s.__l2_err__ ? s.__l2_err__ : 'no scenario snapshot', snapshot: s };
  if (s.lastAction && s.lastAction.ok === false) return { unavailable: s.lastAction.reason || 'scenario rejected', snapshot: s };
  const schemaErrors = validateSnapshot(s);
  if (schemaErrors.length) return { error: `${name} invalid snapshot: ${schemaErrors.join('; ')}`, snapshot: s };
  if (expectedPhase && s.phase !== expectedPhase) return { error: `${name} expected phase ${expectedPhase}, got ${s.phase}`, snapshot: s };
  return { snapshot: s };
}

async function attemptApproachScore(game, options = {}) {
  const start = options.reuse
    ? { snapshot: await game.snapshot() }
    : await loadLegalScenario(game, 'approach_hoop', 'playing');
  if (start.error || start.unavailable) return start;
  let prev = start.snapshot;
  const stepWaitDuration = options.stepWaitDuration || 'short';
  for (let i = 0; i < 5; i++) {
    const action = i % 2 === 0
      ? { type: 'tapSequence', count: 2, cadence: 'medium' }
      : { type: 'wait', duration: stepWaitDuration };
    const next = await game.input(action);
    if (next && !next.__l2_err__ && (next.score > start.snapshot.score || next.feedback.lastScoreDelta > 0)) {
      return { snapshot: next, before: start.snapshot, previous: prev, scored: true };
    }
    const waited = await game.input({ type: 'wait', duration: 'short' });
    if (waited && !waited.__l2_err__ &&
      (waited.score > start.snapshot.score || waited.feedback.lastScoreDelta > 0)) {
      return { snapshot: waited, before: start.snapshot, previous: prev, scored: true };
    }
    prev = next && !next.__l2_err__ ? next : waited;
  }
  return { snapshot: await game.snapshot(), before: start.snapshot, scored: false };
}

const suite = [
  {
    id: 'p0-contract-schema-and-visible-playfield',
    level: 'P0',
    name: 'Public contract, snapshot schema, and visible playfield are available',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const apiError = await requireApi(game);
      if (apiError) return FAIL(apiError);
      const s = await game.reset();
      if (!s || s.__l2_err__) return FAIL(s && s.__l2_err__ ? s.__l2_err__ : 'reset returned no snapshot');
      const errors = validateSnapshot(s);
      if (errors.length) return FAIL(errors.join('; '));
      if (!s.playfield.visible || !s.ball.visible || !s.hoop.visible) return FAIL('playfield, ball, and hoop must be visible in safe startup state');
      const hash = await browser.canvasPixelHash();
      if (hash === null || hash === undefined) return FAIL('visible render hash unavailable');
      return PASS(`phase=${s.phase}, hash=${hash}`);
    }
  },
  {
    id: 'p0-invalid-action-contract-rejects',
    level: 'P0',
    name: 'Invalid public action rejects without corrupting snapshot schema',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const apiError = await requireApi(game);
      if (apiError) return FAIL(apiError);
      const before = await game.reset();
      const after = await game.input({ type: '__invalid_public_action__' });
      if (!after || after.__l2_err__) return FAIL(after && after.__l2_err__ ? after.__l2_err__ : 'invalid action returned no snapshot');
      const errors = validateSnapshot(after);
      if (errors.length) return FAIL(errors.join('; '));
      if (!after.lastAction || after.lastAction.ok !== false) return FAIL('invalid action did not report lastAction.ok=false');
      if (!stableEconomyAndScore(before, after)) return FAIL('invalid action mutated score/economy');
      return PASS(`reason=${after.lastAction.reason || 'reported'}`);
    }
  },
  {
    id: 'p1-click-start-playfield-motion-chain',
    level: 'P1',
    name: 'Real click on playfield starts run and produces hoop-directed motion',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await loadLegalScenario(game, 'home_fresh', 'home');
      if (start.error) return FAIL(start.error);
      if (start.unavailable) return FAIL(`home_fresh unavailable: ${start.unavailable}`);
      const p = await game.playfieldPoint({ avoidInteractive: true });
      const hit = await browser.eval(`
        (function () {
          const x = ${JSON.stringify(p.x)};
          const y = ${JSON.stringify(p.y)};
          const el = document.elementFromPoint(x, y);
          return { ok: !!el, tag: el && el.tagName, id: el && el.id };
        })()
      `);
      if (!hit || !hit.ok) return FAIL('playfield semantic point is not hit-testable');
      await browser.mouseClick(p.x, p.y);
      await browser.sleep(350);
      const after = await game.snapshot();
      if (validateSnapshot(after).length) return FAIL(validateSnapshot(after).join('; '));
      if (after.phase !== 'playing') return FAIL(`real click did not enter playing, got ${after.phase}`);
      if (!after.canInteractWithPlayfield || after.overlayBlocking) return FAIL('playfield remains blocked after real click start');
      if (!ballMoved(start.snapshot, after)) return FAIL('ball did not move or revise after real click');
      if (!(after.ball.verticalTrend === 'up' || after.ball.screenY < start.snapshot.ball.screenY || revisionAdvanced(start.snapshot, after, 'ball.motionRevision'))) {
        return FAIL('real click did not produce upward motion evidence');
      }
      if (!trendMatchesSide(after)) return FAIL(`horizontal trend ${after.ball.horizontalTrend} does not target hoop side ${after.hoop.side}`);
      if (!revisionAdvanced(start.snapshot, after, 'playfield.visualRevision')) return FAIL('no playfield visual revision evidence changed after real click');
      return PASS(`click at ${Math.round(p.x)},${Math.round(p.y)} moved ${after.ball.horizontalTrend}`);
    }
  },
  {
    id: 'p1-touch-playfield-input-equivalence',
    level: 'P1',
    name: 'Real touch input on playfield starts or impulses the ball',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await loadLegalScenario(game, 'home_fresh', 'home');
      if (start.error) return FAIL(start.error);
      if (start.unavailable) return FAIL(`home_fresh unavailable: ${start.unavailable}`);
      const p = await game.playfieldPoint({ avoidInteractive: true });
      const hit = await browser.eval(`
        (function () {
          const x = ${JSON.stringify(p.x)};
          const y = ${JSON.stringify(p.y)};
          const el = document.elementFromPoint(x, y);
          return { ok: !!el, tag: el && el.tagName, id: el && el.id };
        })()
      `);
      if (!hit || !hit.ok) return FAIL('playfield semantic point is not hit-testable');
      try {
        await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1, radiusX: 2, radiusY: 2, force: 1 }] });
        await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } catch (e) {
        return NA(`touch dispatch unavailable in this CDP environment: ${e.message || e}`);
      }
      await browser.sleep(350);
      const after = await game.snapshot();
      if (validateSnapshot(after).length) return FAIL(validateSnapshot(after).join('; '));
      if (after.phase !== 'playing') return FAIL(`touch did not enter playing, got ${after.phase}`);
      if (!ballMoved(start.snapshot, after)) return FAIL('touch did not move or revise ball');
      if (!trendMatchesSide(after)) return FAIL('touch impulse did not target active hoop side');
      return PASS(`touch accepted with ${after.ball.horizontalTrend} trend`);
    }
  },
  {
    id: 'p1-tap-location-independence-contract',
    level: 'P1',
    name: 'Semantic tap locations do not become aim controls',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const points = ['left', 'right', 'upper', 'lower', 'center'];
      const trends = [];
      let scoreBefore = null;
      let coinsBefore = null;
      for (const point of points) {
        const setup = await loadLegalScenario(game, 'playing_right_hoop', 'playing');
        if (setup.error) return FAIL(setup.error);
        if (setup.unavailable) return FAIL(`playing_right_hoop unavailable: ${setup.unavailable}`);
        const before = setup.snapshot;
        const after = await game.input({ type: 'tapPlayfield', point });
        if (!after || after.__l2_err__) return FAIL(`tap ${point} failed: ${after && after.__l2_err__}`);
        if (!after.lastAction.ok || !after.feedback.lastTapAccepted) return FAIL(`tap ${point} was not accepted`);
        if (!ballMoved(before, after)) return FAIL(`tap ${point} did not change motion`);
        if (after.ball.horizontalTrend !== 'right') return FAIL(`tap ${point} aimed ${after.ball.horizontalTrend} instead of active right hoop`);
        trends.push(after.ball.horizontalTrend);
        if (scoreBefore === null) {
          scoreBefore = before.score;
          coinsBefore = before.coins;
        }
        if (after.coins !== coinsBefore) return FAIL('tap location changed coins');
        if (after.score < scoreBefore) return FAIL('tap location lowered score');
      }
      if (new Set(trends).size !== 1) return FAIL(`tap locations produced inconsistent horizontal trends: ${trends.join(',')}`);
      return PASS(`all semantic tap points kept trend=${trends[0]}`);
    }
  },
  {
    id: 'p1-rhythm-wait-tap-physics-chain',
    level: 'P1',
    name: 'Tap sequence, wait release physics, and renewed tap form one motion chain',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegalScenario(game, 'playing_right_hoop', 'playing');
      if (setup.error) return FAIL(setup.error);
      if (setup.unavailable) return FAIL(`playing_right_hoop unavailable: ${setup.unavailable}`);
      const before = setup.snapshot;
      const afterSeq = await game.input({ type: 'tapSequence', count: 4, cadence: 'medium' });
      await browser.sleep(250);
      const seq = await game.snapshot();
      if (!ballMoved(before, seq)) return FAIL('tapSequence did not advance motion');
      const waited = await game.wait('medium');
      const waitChanged = revisionAdvanced(seq, waited, 'ball.motionRevision') ||
        revisionAdvanced(seq, waited, 'timer.revision') ||
        revisionAdvanced(seq, waited, 'playfield.visualRevision');
      if (!waitChanged) return FAIL('wait did not advance physics/timer/playfield state');
      const afterTap = await game.input({ type: 'tapPlayfield', point: 'center' });
      if (!afterTap.lastAction.ok || !afterTap.feedback.lastTapAccepted) return FAIL('renewed tap was not accepted');
      if (!(afterTap.ball.verticalTrend === 'up' || afterTap.ball.screenY < waited.ball.screenY || revisionAdvanced(waited, afterTap, 'ball.motionRevision'))) {
        return FAIL('renewed tap did not restore upward motion evidence after wait');
      }
      if (!nonNegative(afterTap.score) || !nonNegative(afterTap.coins) || !nonNegative(afterTap.feedback.heatLevel) || afterTap.timer.ratio < 0) {
        return FAIL('motion chain broke non-negative invariant');
      }
      return PASS(`sequence revision ${before.ball.motionRevision}->${afterTap.ball.motionRevision}`);
    }
  },
  {
    id: 'p1-direction-opposite-hoop-side-contract',
    level: 'P1',
    name: 'Same tap gesture produces direction opposite motion for left and right hoops',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const rightSetup = await loadLegalScenario(game, 'playing_right_hoop', 'playing');
      if (rightSetup.error) return FAIL(rightSetup.error);
      if (rightSetup.unavailable) return FAIL(`right scenario unavailable: ${rightSetup.unavailable}`);
      const rightAfter = await game.input({ type: 'tapPlayfield', point: 'center' });
      const leftSetup = await loadLegalScenario(game, 'playing_left_hoop_after_score', 'playing');
      if (leftSetup.error) return FAIL(leftSetup.error);
      if (leftSetup.unavailable) return FAIL(`left scenario unavailable: ${leftSetup.unavailable}`);
      const leftAfter = await game.input({ type: 'tapPlayfield', point: 'center' });
      if (rightSetup.snapshot.hoop.side !== 'right' || leftSetup.snapshot.hoop.side !== 'left') return FAIL('scenario preconditions did not establish opposite hoop sides');
      if (!ballMoved(rightSetup.snapshot, rightAfter) || !ballMoved(leftSetup.snapshot, leftAfter)) return FAIL('one side did not move after tap');
      const rightSign = Math.sign(directionSign(rightAfter) || (rightAfter.ball.screenX - rightSetup.snapshot.ball.screenX));
      const leftSign = Math.sign(directionSign(leftAfter) || (leftAfter.ball.screenX - leftSetup.snapshot.ball.screenX));
      if (!(rightSign > 0 && leftSign < 0 && Math.sign(rightSign) === -Math.sign(leftSign))) {
        return FAIL(`direction opposite failed: rightSign=${rightSign}, leftSign=${leftSign}`);
      }
      if (!revisionAdvanced(rightSetup.snapshot, rightAfter, 'playfield.visualRevision') && !revisionAdvanced(leftSetup.snapshot, leftAfter, 'playfield.visualRevision')) {
        return FAIL('opposite direction lacked independent visual revision evidence');
      }
      return PASS('direction opposite verified with Math.sign');
    }
  },
  {
    id: 'p1-approach-hoop-scoring-feedback',
    level: 'P1',
    name: 'Approach hoop timing can produce legitimate scoring feedback or a clean miss invariant',
    timeoutMs: 36000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const result = await attemptApproachScore(game);
      if (result.error) return FAIL(result.error);
      if (result.unavailable) return FAIL(`approach_hoop unavailable: ${result.unavailable}`);
      const before = result.before;
      const after = result.snapshot;
      if (result.scored) {
        if (!(after.score > before.score && after.feedback.lastScoreDelta > 0)) return FAIL('scored path lacks score and lastScoreDelta increase');
        if (after.feedback.lastShotQuality === 'none') return FAIL('scored path lacks shot quality feedback');
        if (!revisionAdvanced(before, after, 'feedback.visibleEffectRevision')) return FAIL('scored path lacks visible effect revision');
        if (!revisionAdvanced(before, after, 'hoop.revision') && after.hoop.side === before.hoop.side) return FAIL('scored path did not advance hoop target');
        return PASS(`score ${before.score}->${after.score}, quality=${after.feedback.lastShotQuality}`);
      }
      if (after.score !== before.score && after.feedback.lastScoreDelta > 0) return FAIL('miss path changed score with basket feedback');
      const nonScoringQuality = new Set(['none', 'miss']);
      if (!nonScoringQuality.has(after.feedback.lastShotQuality) && after.feedback.lastScoreDelta <= 0) {
        return FAIL(`miss path reported scoring shot quality without score delta: ${after.feedback.lastShotQuality}`);
      }
      return PASS('attempted approach remained a non-scoring miss without false basket feedback');
    }
  },
  {
    id: 'p1-collision-risk-motion-feedback',
    level: 'P1',
    name: 'Collision risk produces coupled motion and visible feedback without false scoring',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegalScenario(game, 'collision_risk', 'playing');
      if (setup.error) return FAIL(setup.error);
      if (setup.unavailable) return FAIL(`collision_risk unavailable: ${setup.unavailable}`);
      const before = setup.snapshot;
      let after = before;
      for (let i = 0; i < 5; i++) {
        after = i % 2 === 0 ? await game.input({ type: 'wait', duration: 'medium' }) : await game.input({ type: 'tapPlayfield', point: 'center' });
        await browser.sleep(200);
        after = await game.snapshot();
        if (after.feedback.lastCollision !== 'none') break;
      }
      if (after.feedback.lastCollision === 'none') return FAIL('collision_risk did not surface a collision after wait/timing actions');
      if (!['floor', 'rim', 'backboard'].includes(after.feedback.lastCollision)) return FAIL(`unexpected collision kind ${after.feedback.lastCollision}`);
      if (!ballMoved(before, after)) return FAIL('collision did not couple to motion revision or position');
      if (!revisionAdvanced(before, after, 'feedback.visibleEffectRevision') && !revisionAdvanced(before, after, 'playfield.visualRevision')) return FAIL('collision lacked visible feedback evidence');
      if (after.feedback.lastScoreDelta > 0 && after.score <= before.score) return FAIL('collision path reported score delta without score increase');
      return PASS(`collision=${after.feedback.lastCollision}`);
    }
  },
  {
    id: 'p1-timer-failure-terminal-lock',
    level: 'P1',
    name: 'Timer failure reaches result and locks later playfield impulses',
    timeoutMs: 40000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegalScenario(game, 'timed_run_after_score', 'playing');
      if (setup.error) return FAIL(setup.error);
      if (setup.unavailable) return FAIL(`timed_run_after_score unavailable: ${setup.unavailable}`);
      const before = setup.snapshot;
      if (before.coinsEarnedThisRun !== 0) return FAIL('timed_run_after_score pre-awarded run coins');
      const timerEvidence = (sample) => {
        if (!sample || !sample.timer) return false;
        return (Number.isFinite(sample.timer.ratio) && sample.timer.ratio < before.timer.ratio)
          || revisionAdvanced(before, sample, 'timer.revision')
          || ['warning', 'danger', 'expired'].includes(sample.timer.state)
          || !!(sample.feedback && sample.feedback.warningActive);
      };
      let current = before;
      let timerProgressObserved = false;
      for (let i = 0; i < 9 && current.phase !== 'result'; i++) {
        const duration = i === 0 ? 'short' : 'long';
        const sampled = await game.input({ type: 'wait', duration });
        timerProgressObserved = timerProgressObserved || timerEvidence(sampled);
        await browser.sleep(350);
        current = await game.snapshot();
        timerProgressObserved = timerProgressObserved || timerEvidence(current);
      }
      if (!timerProgressObserved) return FAIL('timer did not decrease or warn before result');
      if (!Number.isFinite(current.coinsEarnedThisRun) || Math.abs((current.coins - before.coins) - current.coinsEarnedThisRun) > 0.001) return FAIL('result coin award did not match coinsEarnedThisRun');
      if (current.phase !== 'result' || current.result !== 'runEnded') return FAIL(`failure did not reach result/runEnded, got ${current.phase}/${current.result}`);
      const lockedBefore = cloneComparable(current);
      const tapped = await game.input({ type: 'tapPlayfield', point: 'center' });
      await browser.sleep(200);
      const lockedAfter = await game.snapshot();
      if (tapped.lastAction.ok && tapped.feedback.lastTapAccepted) return FAIL('result accepted a playfield tap');
      if (lockedAfter.score !== lockedBefore.score || lockedAfter.coins !== lockedBefore.coins) return FAIL('result tap mutated score or coins');
      const lockedFields = [
        'coinsEarnedThisRun',
        'timer.ratio',
        'timer.state',
        'timer.revision',
        'ball.motionRevision',
        'shop.equippedBall',
        'shop.equippedBackground',
        'shop.itemCounts'
      ];
      if (lockedFields.some((path) => !fieldStable(lockedBefore, lockedAfter, path))) return FAIL('result tap mutated locked gameplay state');
      return PASS(`timer state=${current.timer.state}, result locked`);
    }
  },
  {
    id: 'p1-result-retry-home-invariants',
    level: 'P1',
    name: 'Result rejects playfield input, retry resets transient run state, and home preserves persistence',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function clickResultControl(terms, options = {}) {
        const deadline = Date.now() + 1500;
        let lastError;
        while (Date.now() < deadline) {
          try {
            return await game.realClickVisibleControl(terms, options);
          } catch (error) {
            lastError = error;
            await browser.sleep(40);
          }
        }
        throw lastError || new Error(`no visible control for ${terms.join('/')}`);
      }
      const setup = await loadLegalScenario(game, 'result_with_score', 'result');
      if (setup.error) return FAIL(setup.error);
      if (setup.unavailable) return FAIL(`result_with_score unavailable: ${setup.unavailable}`);
      const before = setup.snapshot;
      const rejected = await game.input({ type: 'tapPlayfield', point: 'center' });
      if (rejected.lastAction.ok && rejected.feedback.lastTapAccepted) return FAIL('result accepted playfield tap');
      if (rejected.score !== before.score || rejected.coins !== before.coins) return FAIL('result tap mutated score or coins');
      if (
        rejected.ball.motionRevision !== before.ball.motionRevision ||
        rejected.timer.revision !== before.timer.revision ||
        rejected.timer.ratio !== before.timer.ratio ||
        rejected.feedback.lastScoreDelta !== before.feedback.lastScoreDelta ||
        rejected.feedback.heatLevel !== before.feedback.heatLevel ||
        rejected.persistence.revision !== before.persistence.revision
      ) return FAIL('result tap mutated blocked gameplay state');
      await clickResultControl(['retry', 'again', 'replay', 'play'], { prefer: ['retry', 'again', 'replay'] });
      const retried = await game.snapshot();
      if (retried.phase !== 'playing') return FAIL(`retry did not enter playing, got ${retried.phase}`);
      if (retried.score !== 0) return FAIL(`retry did not reset score to 0, got ${retried.score}`);
      if (retried.timer.ratio <= 0 || !retried.timer.visible || !['none', 'active'].includes(retried.result)) return FAIL('retry did not restore an active playable timer/result state');
      if (retried.feedback.heatLevel !== 0 || retried.feedback.lastScoreDelta !== 0) return FAIL('retry did not clear transient heat or score delta');
      if (retried.coins < before.coins || retried.bestScore < before.bestScore) return FAIL('retry lost persistent best score or coins');
      const resultAgain = await loadLegalScenario(game, 'result_with_score', 'result');
      if (resultAgain.error) return FAIL(resultAgain.error);
      await clickResultControl(['home', 'menu', 'back'], { prefer: ['home', 'menu'] });
      const homed = await game.snapshot();
      if (homed.phase !== 'home') return FAIL(`home did not return to home, got ${homed.phase}`);
      if (homed.coins !== resultAgain.snapshot.coins || homed.bestScore !== resultAgain.snapshot.bestScore) return FAIL('home return changed persistent best score or coins');
      return PASS('result lock, retry reset, and home persistence verified');
    }
  },
  {
    id: 'p1-pause-resume-blocking-freeze',
    level: 'P1',
    name: 'Pause freezes motion and timer, blocks playfield, then resume continues the run',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function clickControlWhenReady(terms) {
        const deadline = Date.now() + 1500;
        let lastError;
        while (Date.now() < deadline) {
          try {
            return await game.realClickVisibleControl(terms);
          } catch (error) {
            lastError = error;
            if (!String(error && error.message || error).includes('no visible control')) throw error;
            await browser.sleep(60);
          }
        }
        throw lastError || new Error('no visible control for ' + terms.join('/'));
      }
      const setup = await loadLegalScenario(game, 'playing_right_hoop', 'playing');
      if (setup.error) return FAIL(setup.error);
      if (setup.unavailable) return FAIL(`playing_right_hoop unavailable: ${setup.unavailable}`);
      // Scenario setup can update the semantic state before the next paint exposes its control.
      await browser.sleep(120);
      const beforePause = await game.snapshot();
      await clickControlWhenReady(['pause']);
      const paused = await game.snapshot();
      if (paused.phase !== 'paused' || !paused.overlayBlocking || paused.canInteractWithPlayfield) return FAIL('pause did not produce blocking paused phase');
      if (paused.feedback.lastTapAccepted && !beforePause.feedback.lastTapAccepted) return FAIL('pause control triggered a playfield tap');
      const beforeBlocked = cloneComparable(paused);
      await game.input({ type: 'wait', duration: 'medium' });
      await game.realClickPlayfield({ avoidInteractive: true });
      const afterBlocked = await game.snapshot();
      if (afterBlocked.score !== beforeBlocked.score || afterBlocked.coins !== beforeBlocked.coins) return FAIL('paused wait/tap mutated score or coins');
      if (afterBlocked.ball.motionRevision !== beforeBlocked.ball.motionRevision) return FAIL('paused state advanced ball motion revision');
      if (afterBlocked.timer.revision !== beforeBlocked.timer.revision || afterBlocked.timer.ratio !== beforeBlocked.timer.ratio) return FAIL('paused state advanced timer');
      await clickControlWhenReady(['resume', 'continue']);
      const resumed = await game.snapshot();
      if (resumed.phase !== 'playing' || !resumed.canInteractWithPlayfield || resumed.overlayBlocking) return FAIL('resume did not restore playing interaction');
      await game.realClickPlayfield();
      const afterTap = await game.snapshot();
      if (!afterTap.feedback.lastTapAccepted || !ballMoved(resumed, afterTap)) return FAIL('tap after resume did not advance motion');
      return PASS('pause froze and resume restored play');
    }
  },
  {
    id: 'p1-shop-panel-blocking-and-rejection',
    level: 'P1',
    name: 'Shop and leaderboard panels block playfield and shop rejection preserves invariants',
    timeoutMs: 32000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function clickVisibleControlUntilPhase(terms, expectedPhase, options = {}) {
        const deadline = Date.now() + 1500;
        let lastError;
        while (Date.now() < deadline) {
          try {
            await browser.sleep(120);
            await game.realClickVisibleControl(terms, options);
            const after = await game.snapshot();
            if (!expectedPhase || after.phase === expectedPhase) return after;
            lastError = new Error('control did not reach ' + expectedPhase + ', got ' + after.phase);
          } catch (error) {
            lastError = error;
          }
          await browser.sleep(60);
        }
        throw lastError || new Error('no visible control for ' + terms.join('/'));
      }
      async function closePanelUntilSafe(expectedOpenPhase) {
        const deadline = Date.now() + 1500;
        let lastError;
        while (Date.now() < deadline) {
          try {
            await browser.sleep(120);
            await game.realClickVisibleControl(['close', 'back', 'x'], { prefer: [expectedOpenPhase] });
            const after = await game.snapshot();
            if (after.phase === 'home' && !after.overlayBlocking) return after;
            lastError = new Error('panel close did not return to home, got ' + after.phase);
          } catch (error) {
            lastError = error;
          }
          await browser.sleep(60);
        }
        throw lastError || new Error('panel close did not return to home');
      }
      const home = await loadLegalScenario(game, 'home_fresh', 'home');
      if (home.error || home.unavailable) return FAIL(home.error || ('home_fresh unavailable: ' + home.unavailable));
      const shop = await clickVisibleControlUntilPhase(['shop', 'store'], 'shop');
      if (shop.phase !== 'shop' || !shop.overlayBlocking || shop.canInteractWithPlayfield) return FAIL('shop did not open as blocking panel');
      await game.realClickPlayfield();
      const blocked = await game.snapshot();
      if (blocked.phase !== 'shop' || !blocked.overlayBlocking || blocked.canInteractWithPlayfield) return FAIL('shop panel stopped blocking playfield');
      if (blocked.ball.motionRevision !== shop.ball.motionRevision) return FAIL('shop panel advanced ball motion');
      if (blocked.timer.revision !== shop.timer.revision || blocked.timer.ratio !== shop.timer.ratio) return FAIL('shop panel consumed timer');
      if (blocked.feedback.lastScoreDelta !== shop.feedback.lastScoreDelta) return FAIL('shop panel changed score feedback');
      if (blocked.persistence.revision !== shop.persistence.revision) return FAIL('shop panel changed persistence');
      if (!stableEconomyAndScore(shop, blocked)) return FAIL('shop-blocked tap mutated score/economy');
      await closePanelUntilSafe('shop');
      const insufficient = await game.loadScenario('shop_insufficient_coins');
      if (!insufficient || insufficient.__l2_err__) return FAIL(insufficient && insufficient.__l2_err__ || 'shop_insufficient_coins returned no snapshot');
      if (insufficient.lastAction && insufficient.lastAction.ok === false) {
        if (insufficient.lastAction.reason !== 'unavailableScenario') return FAIL('shop_insufficient_coins rejected unexpectedly: ' + insufficient.lastAction.reason);
        const unavailableErrors = validateSnapshot(insufficient);
        if (unavailableErrors.length) return FAIL('shop_insufficient_coins unavailable snapshot invalid: ' + unavailableErrors.join('; '));
      } else {
        const schemaErrors = validateSnapshot(insufficient);
        if (schemaErrors.length) return FAIL('shop_insufficient_coins invalid snapshot: ' + schemaErrors.join('; '));
        if (insufficient.phase !== 'shop' || !insufficient.overlayBlocking || insufficient.canInteractWithPlayfield) return FAIL('shop_insufficient_coins did not open as a blocking shop');
        const beforeReject = cloneComparable(insufficient);
        const rejected = await game.input({ type: 'selectShopItem', category: 'balls', selector: 'firstUnaffordableLocked' });
        const isRejected = rejected.shop.lastShopResult === 'rejectedInsufficientFunds' || rejected.lastAction.reason === 'insufficientFunds';
        if (!isRejected) return FAIL('unaffordable item did not reject, got ' + rejected.shop.lastShopResult + '/' + rejected.lastAction.reason);
        if (rejected.shop.balance !== beforeReject.shop.balance || rejected.coins !== beforeReject.coins) return FAIL('unaffordable rejection changed balance/coins');
        if (JSON.stringify(rejected.shop.itemCounts) !== JSON.stringify(beforeReject.shop.itemCounts)) return FAIL('unaffordable rejection changed item counts');
        if (rejected.shop.equippedBall !== beforeReject.shop.equippedBall || rejected.shop['equippedBackground'] !== beforeReject.shop['equippedBackground']) return FAIL('unaffordable rejection changed equipment');
      }
      const leaderboardHome = await loadLegalScenario(game, 'home_fresh', 'home');
      if (leaderboardHome.error || leaderboardHome.unavailable) return FAIL(leaderboardHome.error || ('leaderboard baseline unavailable: ' + leaderboardHome.unavailable));
      const beforeLeaderboard = cloneComparable(leaderboardHome.snapshot);
      const leaderboard = await clickVisibleControlUntilPhase(['leaderboard', 'leader', 'rank', 'score'], 'leaderboard');
      if (leaderboard.phase !== 'leaderboard' || !leaderboard.overlayBlocking || leaderboard.canInteractWithPlayfield) return FAIL('leaderboard did not open as blocking panel');
      if (!['loading', 'entries', 'empty', 'unavailable', 'error'].includes(leaderboard.leaderboard.status)) return FAIL('leaderboard status invalid: ' + leaderboard.leaderboard.status);
      const closed = await closePanelUntilSafe('leaderboard');
      if (closed.phase !== 'home' || closed.overlayBlocking || closed.canInteractWithPlayfield !== true) return FAIL('leaderboard close did not return to home');
      const closedErrors = validateSnapshot(closed);
      if (closedErrors.length) return FAIL('leaderboard close returned invalid snapshot: ' + closedErrors.join('; '));
      if (!stableEconomyAndScore(beforeLeaderboard, closed)) return FAIL('leaderboard open/close mutated score/economy');
      if (closed.ball.motionRevision !== beforeLeaderboard.ball.motionRevision ||
          closed.timer.revision !== beforeLeaderboard.timer.revision ||
          closed.timer.ratio !== beforeLeaderboard.timer.ratio ||
          closed.persistence.revision !== beforeLeaderboard.persistence.revision) return FAIL('leaderboard open/close mutated gameplay or persistence state');
      return PASS('panels block playfield and rejection preserves state');
    }
  },
  {
    id: 'p1-economy-result-shop-purchase',
    level: 'P1',
    name: 'Result coin progression and affordable shop purchase update persistence and visible summary',
    timeoutMs: 36000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const timed = await loadLegalScenario(game, 'timed_run_after_score', 'playing');
      if (timed.error) return FAIL(timed.error);
      if (timed.unavailable) return NA(`timed run unavailable: ${timed.unavailable}`);
      if (!Number.isFinite(timed.snapshot.score) || timed.snapshot.score <= 0) return FAIL('timed_run_after_score did not establish a positive scored run');
      if (!Number.isFinite(timed.snapshot.coinsEarnedThisRun) || timed.snapshot.coinsEarnedThisRun !== 0) return FAIL('timed_run_after_score pre-awarded run coins');
      let result = timed.snapshot;
      for (let i = 0; i < 8 && result.phase !== 'result'; i++) {
        await game.input({ type: 'wait', duration: 'long' });
        await browser.sleep(250);
        result = await game.snapshot();
      }
      if (result.phase !== 'result') return FAIL('timed failure did not reach result for economy check');
      if (!Number.isFinite(result.coins) || result.coins <= timed.snapshot.coins) return FAIL('result did not increase coins');
      if (!Number.isFinite(result.coinsEarnedThisRun) || result.coinsEarnedThisRun <= 0 || Math.abs((result.coins - timed.snapshot.coins) - result.coinsEarnedThisRun) > 0.001) return FAIL('result coin award did not match a positive coinsEarnedThisRun');
      if (!revisionAdvanced(timed.snapshot, result, 'persistence.revision')) return FAIL('result coin award did not revise persistence');
      const shop = await game.loadScenario('shop_with_coins');
      if (shop.lastAction && shop.lastAction.ok === false) return NA(`shop_with_coins unavailable: ${shop.lastAction.reason || 'unavailable'}`);
      const before = cloneComparable(shop);
      await game.realClickShopItem({ affordable: true });
      const purchased = await game.snapshot();
      if (purchased.shop.balance >= before.shop.balance) return FAIL('purchase did not deduct balance');
      if (purchased.persistence.revision === before.persistence.revision) return FAIL('purchase did not revise persistence');
      const cosmeticSummaryChanged =
        purchased.shop.equippedBall !== before.shop.equippedBall ||
        purchased.shop.equippedBackground !== before.shop.equippedBackground ||
        JSON.stringify(purchased.shop.itemCounts) !== JSON.stringify(before.shop.itemCounts);
      if (!cosmeticSummaryChanged) return FAIL('purchase did not change cosmetic summary');
      if (!revisionAdvanced(before, purchased, 'playfield.visualRevision') &&
          !revisionAdvanced(before, purchased, 'ball.motionRevision') &&
          !revisionAdvanced(before, purchased, 'feedback.visibleEffectRevision')) return FAIL('purchase/equip lacked visible summary revision');
      return PASS(`shop result=${purchased.shop.lastShopResult}`);
    }
  },
  {
    id: 'p1-sound-toggle-persistence-invariant',
    level: 'P1',
    name: 'Sound toggle persists without starting shots or mutating gameplay economy',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function clickSoundControl() {
        const terms = ['sound', 'audio', 'mute', 'music', 'speaker', 'snd', '🔊', '🔇'];
        const deadline = Date.now() + 1500;
        let lastError;
        while (Date.now() < deadline) {
          try {
            return await game.realClickVisibleControl(terms);
          } catch (error) {
            lastError = error;
            await browser.sleep(40);
          }
        }
        throw lastError || new Error('no visible sound control');
      }
      const home = await loadLegalScenario(game, 'home_fresh', 'home');
      if (home.error) return FAIL(home.error);
      await clickSoundControl();
      const toggledHome = await game.snapshot();
      if (toggledHome.sound.enabled === home.snapshot.sound.enabled) return FAIL('home sound toggle did not flip enabled state');
      if (toggledHome.phase !== 'home') return FAIL('home sound toggle changed phase');
      if (toggledHome.score !== home.snapshot.score || toggledHome.coins !== home.snapshot.coins || toggledHome.ball.motionRevision !== home.snapshot.ball.motionRevision) {
        return FAIL('home sound toggle started play or mutated score/economy/motion');
      }
      if (toggledHome.persistence.revision === home.snapshot.persistence.revision) return FAIL('sound toggle did not revise persistence');
      const playing = await loadLegalScenario(game, 'playing_right_hoop', 'playing');
      if (playing.error) return FAIL(playing.error);
      await browser.sleep(120);
      await clickSoundControl();
      const toggledPlaying = await game.snapshot();
      if (toggledPlaying.sound.enabled === playing.snapshot.sound.enabled) return FAIL('playing sound toggle did not flip enabled state');
      if (toggledPlaying.score !== playing.snapshot.score || toggledPlaying.coins !== playing.snapshot.coins) return FAIL('playing sound toggle mutated score or coins');
      return PASS('sound toggle invariant verified');
    }
  },
  {
    id: 'p2-leaderboard-panel-invariant',
    level: 'P2',
    name: 'Leaderboard panel exposes legal status and preserves run and economy state',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      async function clickControlWhenReady(terms, options = {}) {
        const deadline = Date.now() + 1500;
        let lastError;
        while (Date.now() < deadline) {
          try {
            return await game.realClickVisibleControl(terms, options);
          } catch (error) {
            lastError = error;
            if (!String(error && error.message || error).includes('no visible control')) throw error;
            await browser.sleep(60);
          }
        }
        throw lastError || new Error(`no visible control for ${terms.join('/')}`);
      }
      const setup = await loadLegalScenario(game, 'home_fresh', 'home');
      if (setup.error) return FAIL(setup.error);
      if (setup.unavailable) return NA(`home_fresh unavailable: ${setup.unavailable}`);
      await browser.sleep(120);
      await clickControlWhenReady(['leaderboard', 'leader', 'rank', 'score']);
      const before = await game.snapshot();
      if (!before.overlayBlocking || before.canInteractWithPlayfield) return FAIL('leaderboard scenario is not blocking');
      if (!['loading', 'entries', 'empty', 'unavailable', 'error'].includes(before.leaderboard.status)) return FAIL(`invalid leaderboard status ${before.leaderboard.status}`);
      await game.realClickPlayfield();
      const tapped = await game.snapshot();
      if (tapped.phase !== 'leaderboard' || !tapped.overlayBlocking || tapped.canInteractWithPlayfield) {
        return FAIL('leaderboard playfield tap changed blocking state');
      }
      if (tapped.ball.motionRevision !== before.ball.motionRevision ||
          tapped.timer.revision !== before.timer.revision ||
          tapped.timer.ratio !== before.timer.ratio) {
        return FAIL('leaderboard playfield tap advanced motion or timer');
      }
      if (!stableEconomyAndScore(before, tapped)) return FAIL('leaderboard playfield tap mutated score/economy');
      await clickControlWhenReady(['close', 'back', 'home', 'x']);
      const closed = await game.snapshot();
      const expectedClosedPhase = before.priorPhase || 'home';
      if (closed.phase !== expectedClosedPhase || closed.overlayBlocking) return FAIL('leaderboard close did not return to safe state');
      if (closed.ball.motionRevision !== before.ball.motionRevision ||
          closed.timer.revision !== before.timer.revision ||
          closed.timer.ratio !== before.timer.ratio) {
        return FAIL('leaderboard close advanced motion or timer');
      }
      if (!stableEconomyAndScore(before, closed)) return FAIL('leaderboard close mutated score/economy');
      return PASS(`leaderboard=${before.leaderboard.status}`);
    }
  },
  {
    id: 'p2-heat-feedback-depth',
    level: 'P2',
    name: 'Heat and rich feedback are coupled to repeated makes and collision quality when available',
    timeoutMs: 45000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const first = await attemptApproachScore(game, { stepWaitDuration: 'medium' });
      if (first.error) return FAIL(first.error);
      if (first.unavailable) return NA(`approach scoring unavailable: ${first.unavailable}`);
      if (!first.scored) return NA('approach path did not produce a make in bounded attempts');
      const second = await attemptApproachScore(game, { reuse: true, stepWaitDuration: 'medium' });
      if (second.error) return FAIL(second.error);
      if (second.scored) {
        const secondQuality = second.snapshot.feedback.lastShotQuality;
        if ((secondQuality === 'clean' || secondQuality === 'soft') &&
            second.snapshot.feedback.heatLevel < first.snapshot.feedback.heatLevel) {
          return FAIL('heat decreased after a clean or soft repeated make');
        }
        if (secondQuality === 'rimmed' &&
            second.snapshot.feedback.heatLevel > first.snapshot.feedback.heatLevel) {
          return FAIL('heat increased after a rimmed repeated make');
        }
        if (second.snapshot.feedback.visibleEffectRevision === first.snapshot.feedback.visibleEffectRevision) return FAIL('repeated make did not revise rich feedback');
      }
      const collision = await loadLegalScenario(game, 'collision_risk', 'playing');
      if (!collision.error && !collision.unavailable) {
        let after = collision.snapshot;
        for (let i = 0; i < 4 && after.feedback.lastCollision === 'none'; i++) {
          await game.input({ type: 'wait', duration: 'medium' });
          await browser.sleep(200);
          after = await game.snapshot();
        }
        if (after.feedback.lastCollision !== 'none' &&
            after.feedback.heatLevel > collision.snapshot.feedback.heatLevel) {
          return FAIL('collision path incorrectly strengthened heat without a make');
        }
      }
      return PASS('heat feedback depth is causally observable');
    }
  }
];

module.exports = { suite };
