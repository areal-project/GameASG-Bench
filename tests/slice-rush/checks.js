// === GDD Coverage Map ===
// M1 readable 3D scene: p0-2-contract-readable-scene-schema, p1-1-click-start-level-readable
// M2 tap-to-flip and no hold/drag semantics: p1-2-click-playfield-tap-flip-chain, p1-3-touch-playfield-tap-chain, p1-4-no-hold-drag-charge-invariant
// M3/M5 contact and route traversal: p1-4-no-hold-drag-charge-invariant, p1-11-safe-poor-contact-outcomes, p1-12-moving-support-wait-risk
// M4 slicing score loop: p1-5-slice-score-visible-cut
// M6 hazard/fall failure: p1-6-hazard-failure-lock-retry
// M7 finish score threshold: p1-7-finish-threshold-victory-short
// M8 overlay lifecycle: p1-1-click-start-level-readable, p1-8-pause-block-resume, p1-13-retry-cleans-failure-state
// M9 level progression rejection: p1-9-level-select-reject-invariant
// Direction control non-applicability: p1-10-key-left-right-no-steering-invariant
// M10 endless optional loop: p2-1-endless-timer-pressure
// M11 shop/coins/cosmetics optional loop: p2-2-shop-rejection-resource-invariant
// M12 persistence/audio optional loop: p2-3-audio-save-reload-consistency
//
// === Rationality Map ===
// p1-1-click-start-level-readable: real action: browser.mouseClick on a discovered visible level/start control | independent observation: snapshot phase/mode/HUD plus playfield geometry | empty-shell failure: menu-only shell or stale blocking overlay fails.
// p1-2-click-playfield-tap-flip-chain: real action: browser.mouseClick on runtime playfield center | independent observation: phase/control plus knife progress/height/rotation and visual revision deltas | empty-shell failure: click handler that only returns ok or changes one debug flag fails.
// p1-3-touch-playfield-tap-chain: real action: Input.dispatchTouchEvent on runtime playfield center | independent observation: same tap-flip state family and visual revision | empty-shell failure: mouse-only or API-only implementation fails touch operability.
// p1-4-no-hold-drag-charge-invariant: real action: contract holdPlayfield and dragPlayfield setup with subsequent valid tap | independent observation: no charged/steering state, bounded motion delta, later tap still works | empty-shell failure: drag/hold driving game or unbounded charge passes neither invariant nor later-tap chain.
// p1-5-slice-score-visible-cut: real action: loadScenario legal precondition then playfield tap/wait action | independent observation: score delta with cut/target/particle/visual revision | empty-shell failure: score-only timer or hidden reward without visible cut feedback fails.
// p1-6-hazard-failure-lock-retry: real action: loadScenario legal precondition then tap/wait into hazard | independent observation: failure result, hazard feedback or visual delta, overlay lock, retry availability | empty-shell failure: hazard as decoration or score conversion fails result lock.
// p1-7-finish-threshold-victory-short: real action: loadScenario legal finish preconditions then tap/wait crossing finish | independent observation: victory versus scoreNotMet result, score relation, reward/unlock invariants | empty-shell failure: any-finish-is-victory implementation fails short-score branch.
// p1-8-pause-block-resume: real action: contract pause plus blocked playfield tap/wait and resume | independent observation: overlay blocks play, progress/score invariant while paused, later tap advances | empty-shell failure: visual-only pause or reset-on-resume fails.
// p1-9-level-select-reject-invariant: real action: openLevelSelect and select unlocked/locked/out-of-range levels | independent observation: legal level readiness and rejected selection preserves level/unlocks/score/coins | empty-shell failure: direct level bypass or no rejection state fails.
// p1-10-key-left-right-no-steering-invariant: real action: keyDown/keyUp ArrowLeft/ArrowRight/KeyA/KeyD while playable | independent observation: score/progress/visual state stays stable until valid tap | empty-shell failure: hidden keyboard steering or direction opposite movement mode fails because Slice Rush has no lateral direction control.
// p1-11-safe-poor-contact-outcomes: real action: loadScenario legal safe/poor contact preconditions then tap/wait | independent observation: blade/support contact contrasts with bounce/recovery/failure pressure and no false score grant | empty-shell failure: one-size collision that treats every contact as safe fails.
// p1-12-moving-support-wait-risk: real action: loadScenario moving_support then wait and tap | independent observation: movingElementsRevision plus scene/knife motion and continued tap risk | empty-shell failure: static route or decorative moving objects fail.
// p1-13-retry-cleans-failure-state: real action: fail via hazard trigger then retry | independent observation: result clears, score resets, playfield unblocks, knife returns to safe start | empty-shell failure: stale failure overlay, score, or collision state remains.
// p2-1-endless-timer-pressure: real action: choose endless, tap/wait, pause/wait | independent observation: timer drains only during play and not while paused | empty-shell failure: fake endless label or static timer fails.
// p2-2-shop-rejection-resource-invariant: real action: open shop, select unaffordable item, buy, attempt playfield tap | independent observation: shop blocks playfield and preserves coins/owned/equipped on rejection | empty-shell failure: API-only shop or rejected purchase that mutates resources fails.
// p2-3-audio-save-reload-consistency: real action: toggleAudio, reloadSession | independent observation: savedRevision/settings or stable session progress after reload | empty-shell failure: settings buttons that corrupt gameplay or fake persistence fail.

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }
function NA(detail) { return { status: 'NOT_APPLICABLE', detail: detail || '' }; }

const PHASES = ['boot', 'start', 'levelSelect', 'ready', 'playing', 'paused', 'shop', 'result'];
const MODES = ['none', 'level', 'endless'];
const RESULTS = ['none', 'victory', 'scoreNotMet', 'failure'];
const KNIFE_STATES = ['notReady', 'stuck', 'flipping', 'slicing', 'bouncing', 'recovering', 'tumbling', 'finished'];

function finite(n) { return typeof n === 'number' && Number.isFinite(n); }
function num(v, fallback) { return finite(v) ? v : fallback; }
function changed(a, b, eps) {
  if (!finite(a) || !finite(b)) return false;
  return Math.abs(a - b) > (eps == null ? 0.001 : eps);
}
function revisionChanged(before, after, key) {
  return finite(before?.[key]) && finite(after?.[key]) && after[key] !== before[key];
}
function unwrapEnvelope(value) {
  if (!value || typeof value !== 'object') return { ok: true, snapshot: value, responseShape: 'plain' };
  if (Object.prototype.hasOwnProperty.call(value, 'snapshot')) {
    return {
      ok: value.ok !== false,
      reason: value.reason || '',
      snapshot: value.snapshot,
      responseShape: 'envelope'
    };
  }
  return { ok: true, snapshot: value, responseShape: 'plain' };
}
function sameStableRunFields(a, b) {
  return a?.hud?.score === b?.hud?.score &&
    a?.hud?.coins === b?.hud?.coins &&
    a?.result === b?.result &&
    a?.mode === b?.mode &&
    a?.level?.index === b?.level?.index;
}
function motionEvidence(before, after) {
  const parts = [];
  if (after.phase === 'playing' && before.phase !== 'result') parts.push('phase playing');
  if (changed(before?.knife?.progress, after?.knife?.progress, 0.002)) parts.push('progress');
  if (changed(before?.knife?.height, after?.knife?.height, 0.002)) parts.push('height');
  if (changed(before?.knife?.rotationTurns, after?.knife?.rotationTurns, 0.002)) parts.push('rotation');
  if (revisionChanged(before?.scene, after?.scene, 'gameplayVisualRevision')) parts.push('visual revision');
  if (KNIFE_STATES.includes(after?.knife?.state) && after.knife.state !== before?.knife?.state) parts.push('knife state');
  return parts;
}
function validateSnapshot(s, options = {}) {
  if (!s || typeof s !== 'object') return 'snapshot missing';
  if (s.ready !== true && options.requireReady !== false) return 'ready is not true';
  if (!PHASES.includes(s.phase)) return 'invalid phase ' + s.phase;
  if (!MODES.includes(s.mode)) return 'invalid mode ' + s.mode;
  if (!RESULTS.includes(s.result)) return 'invalid result ' + s.result;
  if (!s.overlay || typeof s.overlay.blocksPlayfield !== 'boolean') return 'overlay.blocksPlayfield missing';
  if (!s.controls || typeof s.controls.canPlayfieldTap !== 'boolean') return 'controls.canPlayfieldTap missing';
  if (!s.scene || typeof s.scene.ready !== 'boolean' || typeof s.scene.readable3D !== 'boolean') return 'scene readiness missing';
  if (!s.hud || !finite(s.hud.score) || !finite(s.hud.coins)) return 'hud score/coins missing';
  if (!s.knife || !KNIFE_STATES.includes(s.knife.state) || !finite(s.knife.progress) || !finite(s.knife.height) || !finite(s.knife.rotationTurns)) return 'knife summary missing';
  if (!s.route || typeof s.route.nextPlatformVisible !== 'boolean' || !finite(s.route.movingElementsRevision)) return 'route summary missing';
  if (!s.entities || !finite(s.entities.sliceableVisible) || !finite(s.entities.hazardVisible) || !finite(s.entities.cutRevision)) return 'entity summary missing';
  if (s.hud.score < 0 || s.hud.coins < 0) return 'negative score or coins';
  if (s.phase === 'playing' && (s.overlay.blocksPlayfield || !s.controls.canPlayfieldTap)) return 'playing state is blocked';
  if (s.result !== 'none' && (s.phase !== 'result' || !s.overlay.blocksPlayfield)) return 'terminal result not locked';
  return null;
}

function createGameDriver(browser) {
  async function evalPage(expr) {
    const value = await browser.eval(expr);
    if (value && value.__l2_err__) throw new Error(value.__l2_err__);
    return value;
  }
  async function wait(ms) { await browser.sleep(ms); }
  async function waitForReady() {
    const deadline = Date.now() + 6000;
    let last = null;
    while (Date.now() < deadline) {
      last = await evalPage(`(function(){
        const api = window.__gameTest;
        const snap = api && typeof api.getSnapshot === 'function' ? api.getSnapshot() : null;
        return { hasApi: !!api, methods: api ? ['reset','input','getSnapshot','loadScenario'].filter(k => typeof api[k] === 'function') : [], snap };
      })()`);
      if (last.hasApi && last.methods.length === 4) return last;
      await wait(150);
    }
    return last || {};
  }
  async function callApi(method, arg1, arg2) {
    const payload = JSON.stringify([method, arg1, arg2]);
    const result = await evalPage(`(async function(){
      const args = ${payload};
      const api = window.__gameTest;
      if (!api || typeof api[args[0]] !== 'function') return { __l2CallError__: 'missing __gameTest.' + args[0], __l2Snapshot__: null };
      try {
        const value = await api[args[0]](args[1], args[2]);
        return { __l2Value__: value };
      } catch (e) {
        return {
          __l2CallError__: String(e && e.message || e),
          __l2Snapshot__: typeof api.getSnapshot === 'function' ? api.getSnapshot() : null
        };
      }
    })()`);
    if (result && Object.prototype.hasOwnProperty.call(result, '__l2CallError__')) {
      return {
        ok: false,
        reason: result.__l2CallError__,
        snapshot: result.__l2Snapshot__,
        responseShape: 'envelope',
        callError: true
      };
    }
    const normalized = unwrapEnvelope(result && result.__l2Value__);
    normalized.callError = false;
    return normalized;
  }
  async function snapshot() {
    const res = await callApi('getSnapshot');
    return res.snapshot;
  }
  async function reset(options) {
    const res = await callApi('reset', options || {});
    await wait(150);
    return unwrapEnvelope(res).snapshot || await snapshot();
  }
  async function input(action) {
    const res = await callApi('input', action);
    await wait(Math.min(Math.max(num(action && action.durationMs, 100), 80), 700));
    return res;
  }
  async function loadScenario(name, options) {
    const res = await callApi('loadScenario', name, options || {});
    await wait(150);
    return res;
  }
  async function playfieldPoint(options) {
    const s = await snapshot();
    const b = s?.scene?.playfieldBounds;
    if (b && finite(b.left) && finite(b.top) && finite(b.width) && finite(b.height) && b.width > 40 && b.height > 40) {
      if (options && options.avoidInteractive) {
        const safe = await evalPage(`(function(){
          const b = ${JSON.stringify(b)};
          const controls = Array.from(document.querySelectorAll('button,a,input,select,textarea,[role="button"],[data-action]'))
            .map(el => {
              const r = el.getBoundingClientRect();
              const cs = getComputedStyle(el);
              return { left:r.left, top:r.top, right:r.right, bottom:r.bottom,
                visible:r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.pointerEvents !== 'none' };
            }).filter(v => v.visible);
          const grid = [0.08, 0.25, 0.5, 0.75, 0.92];
          for (const fy of grid) for (const fx of grid) {
            const x = b.left + b.width * fx, y = b.top + b.height * fy;
            if (!controls.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)) return { x, y };
          }
          return null;
        })()`);
        if (safe && finite(safe.x) && finite(safe.y)) return safe;
      }
      return { x: b.left + b.width * 0.5, y: b.top + b.height * 0.58 };
    }
    const point = await evalPage(`(function(){
      const candidates = Array.from(document.querySelectorAll('canvas,[role="application"],main,body'))
        .map(el => {
          const r = el.getBoundingClientRect();
          return { x:r.left + r.width/2, y:r.top + r.height*0.58, area:r.width*r.height, visible:r.width>40 && r.height>40 };
        }).filter(v => v.visible).sort((a,b) => b.area-a.area);
      return candidates[0] || { x: window.innerWidth/2, y: window.innerHeight*0.58 };
    })()`);
    return point;
  }
  async function clickVisibleModeControl(mode) {
    const wanted = mode === 'endless' ? ['endless', 'survival'] : ['level', 'play', 'start'];
    const point = await evalPage(`(function(){
      const words = ${JSON.stringify(wanted)};
      const els = Array.from(document.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"]'));
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const text = ((el.innerText || el.value || el.getAttribute('aria-label') || '') + '').toLowerCase();
        const visible = r.width > 8 && r.height > 8 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
        if (visible && words.some(w => text.includes(w))) return { x:r.left+r.width/2, y:r.top+r.height/2, text };
      }
      return null;
    })()`);
    if (!point) return false;
    await browser.mouseClick(point.x, point.y);
    await wait(800);
    return true;
  }
  async function realPlayfieldClick(options) {
    const p = await playfieldPoint(options);
    await browser.mouseClick(p.x, p.y);
    await wait(250);
    return p;
  }
  return { waitForReady, snapshot, reset, input, loadScenario, playfieldPoint, clickVisibleModeControl, realPlayfieldClick, wait };
}

async function ensureApiReady(game) {
  const ready = await game.waitForReady();
  if (!ready.hasApi) return 'window.__gameTest missing';
  if ((ready.methods || []).length !== 4) return 'missing methods: ' + JSON.stringify(ready.methods || []);
  return null;
}

async function ensureLevelReady(game) {
  await game.reset();
  let s = await game.snapshot();
  if (s.phase === 'start' || s.mode !== 'level') {
    await game.input({ type: 'chooseMode', mode: 'level' });
    await game.wait(250);
    s = await game.snapshot();
  }
  if (s.phase === 'levelSelect') {
    await game.input({ type: 'selectLevel', index: (s.level && s.level.unlocked && s.level.unlocked[0]) || 0 });
    await game.wait(250);
    s = await game.snapshot();
  }
  return s;
}

async function validScenario(game, name, options = {}) {
  const res = await game.loadScenario(name);
  if (!res.ok) return { ok: false, detail: name + ' rejected: ' + (res.reason || 'no reason'), snapshot: res.snapshot };
  const s = res.snapshot || await game.snapshot();
  const err = validateSnapshot(s, options);
  if (err) return { ok: false, detail: name + ' invalid precondition: ' + err, snapshot: s };
  return { ok: true, snapshot: s };
}
async function validFinishScenario(game, name) {
  const res = await game.loadScenario(name);
  if (!res.ok) return { ok: false, detail: name + ' rejected: ' + (res.reason || 'no reason'), snapshot: res.snapshot };
  const s = res.snapshot || await game.snapshot();
  const err = validateSnapshot(s, { requireReady: false });
  if (err) return { ok: false, detail: name + ' invalid precondition: ' + err, snapshot: s };
  if (s.result !== 'none' || !['ready', 'playing'].includes(s.phase) ||
      s.overlay.blocksPlayfield || !s.controls.canPlayfieldTap || !s.route.finishAhead ||
      !finite(s.hud.targetScore)) {
    return { ok: false, detail: name + ' is not a non-terminal playable near-finish state', snapshot: s };
  }
  if (name === 'near_finish_score_met' && s.hud.targetScore > 0 && s.entities.cutRevision <= 0) {
    return { ok: false, detail: name + ' lacks prior visible cut evidence for a positive score goal', snapshot: s };
  }
  return { ok: true, snapshot: s };
}
async function finishAfterPlayerTap(game) {
  let s = await game.snapshot();
  for (let hop = 0; hop < 2 && s.result === 'none'; hop++) {
    if (!s.controls?.canPlayfieldTap) break;
    await game.input({ type: 'playfieldTap' });
    s = await game.snapshot();
    for (let i = 0; i < 16 && s.result === 'none'; i++) {
      await game.input({ type: 'wait', durationMs: 300 });
      s = await game.snapshot();
      if (s.knife?.state === 'stuck' && s.route?.finishAhead) break;
    }
    if (s.result === 'none' && !(s.knife?.state === 'stuck' && s.route?.finishAhead)) break;
  }
  return s;
}

const suite = [
  {
    id: 'p0-1-public-api-contract-available',
    level: 'P0',
    name: 'Public API exposes reset/input/getSnapshot/loadScenario',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const s = await game.snapshot();
      const schemaErr = validateSnapshot(s, { requireReady: false });
      if (schemaErr) return FAIL(schemaErr);
      const beforeInvalid = await game.snapshot();
      const bad = await game.input({ type: '__invalid_action_shape__' });
      if (bad.callError) return FAIL('invalid action threw: ' + bad.reason);
      if (!bad.snapshot) return FAIL('invalid action did not return a snapshot');
      const badSchemaErr = validateSnapshot(bad.snapshot, { requireReady: false });
      if (badSchemaErr) return FAIL('invalid action returned invalid snapshot: ' + badSchemaErr);
      const unchanged = sameStableRunFields(beforeInvalid, bad.snapshot) &&
        beforeInvalid.hud.targetScore === bad.snapshot.hud.targetScore &&
        beforeInvalid.knife.progress === bad.snapshot.knife.progress &&
        beforeInvalid.knife.height === bad.snapshot.knife.height &&
        beforeInvalid.knife.rotationTurns === bad.snapshot.knife.rotationTurns &&
        beforeInvalid.scene.gameplayVisualRevision === bad.snapshot.scene.gameplayVisualRevision &&
        JSON.stringify(beforeInvalid.level?.unlocked || []) === JSON.stringify(bad.snapshot.level?.unlocked || []);
      if (!unchanged) return FAIL('invalid action changed protected snapshot fields');
      if (bad.responseShape === 'envelope' && bad.ok !== false) return FAIL('invalid action envelope did not reject with ok:false');
      return PASS(bad.responseShape === 'plain'
        ? 'public API and stable plain-snapshot rejection are available'
        : 'public API and rejection envelope are available');
    }
  },
  {
    id: 'p0-2-contract-readable-scene-schema',
    level: 'P0',
    name: 'Contract snapshot exposes readable scene and gameplay summaries',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const s = await ensureLevelReady(game);
      const schemaErr = validateSnapshot(s);
      if (schemaErr) return FAIL(schemaErr);
      if (s.mode !== 'level') return FAIL('level mode did not become active');
      if (!s.scene.ready || !s.scene.readable3D) return FAIL('scene is not declared readable and ready');
      if (s.hud.targetScore === null || !finite(s.hud.targetScore) || s.hud.targetScore < 0) return FAIL('level targetScore missing');
      if ((s.entities.sliceableVisible + s.entities.platformVisible) <= 0) return FAIL('no route/entity visibility summary');
      return PASS('schema exposes level scene, HUD, knife, route, and entities');
    }
  },
  {
    id: 'p1-1-click-start-level-readable',
    level: 'P1',
    name: 'Real click starts level mode into readable unblocked scene',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      await game.reset();
      const control = await browser.eval(`(function(){
        const words = ['level', 'play', 'start'];
        const els = Array.from(document.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"],[data-action],[data-act]'));
        for (const el of els) {
          const r = el.getBoundingClientRect();
          const text = ((el.innerText || el.value || el.getAttribute('aria-label') || '') + '').toLowerCase();
          const top = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
          const hit = top === el || (top && el.contains(top));
          const visible = r.width > 8 && r.height > 8 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none' && hit;
          if (visible && words.some(w => text.includes(w))) return { x:r.left+r.width/2, y:r.top+r.height/2 };
        }
        return null;
      })()`);
      if (control && finite(control.x) && finite(control.y)) {
        await browser.mouseClick(control.x, control.y);
        await game.wait(800);
      } else {
        await game.input({ type: 'chooseMode', mode: 'level' });
      }
      await game.wait(500);
      let s = await game.snapshot();
      if (s.phase === 'levelSelect') {
        if (!s.overlay?.blocksPlayfield) return FAIL('level select did not block playfield');
        const unlocked = Array.isArray(s.level?.unlocked) ? s.level.unlocked : [];
        if (!unlocked.length) return FAIL('level select has no unlocked level');
        const selected = await game.input({ type: 'selectLevel', index: unlocked[0] });
        if (selected.ok === false) return FAIL('unlocked level selection was rejected: ' + (selected.reason || 'no reason'));
        await game.wait(250);
        s = selected.snapshot || await game.snapshot();
      }
      const schemaErr = validateSnapshot(s);
      if (schemaErr) return FAIL(schemaErr);
      if (s.mode !== 'level') return FAIL('level mode not active after start action');
      if (!['ready', 'playing'].includes(s.phase)) return FAIL('not in ready/playable level phase: ' + s.phase);
      if (s.overlay.blocksPlayfield || !s.controls.canPlayfieldTap) return FAIL('playfield remains blocked after level start');
      if (s.hud.score !== 0) return FAIL('score not reset at level start');
      if (!s.scene.readable3D || !s.route.nextPlatformVisible) return FAIL('readable route/scene not observable');
      return PASS('real visible start click or contract fallback reaches playable level scene');
    }
  },
  {
    id: 'p1-2-click-playfield-tap-flip-chain',
    level: 'P1',
    name: 'Real click playfield tap triggers flip motion chain',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const before = await ensureLevelReady(game);
      if (before.overlay.blocksPlayfield || !before.controls.canPlayfieldTap) return FAIL('precondition not playable');
      const point = await game.playfieldPoint();
      await browser.mouseClick(point.x, point.y);
      await game.wait(250);
      const after = await game.snapshot();
      const evidence = motionEvidence(before, after);
      if (after.overlay.blocksPlayfield) return FAIL('overlay blocks after valid tap');
      if (evidence.length < 2) return FAIL('tap did not produce combined phase/motion/visual evidence: ' + evidence.join(','));
      await game.wait(500);
      const later = await game.snapshot();
      const trend = motionEvidence(after, later);
      if (trend.length < 1 && later.result === 'none') return FAIL('wait after launch showed no gravity/contact/progression trend');
      return PASS('tap produced ' + evidence.join(', ') + ' and later trend ' + trend.join(', '));
    }
  },
  {
    id: 'p1-3-touch-playfield-tap-chain',
    level: 'P1',
    name: 'Real touch playfield tap triggers the same flip family',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const before = await ensureLevelReady(game);
      const p = await game.playfieldPoint();
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1, radiusX: 2, radiusY: 2, force: 1 }] });
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await game.wait(300);
      const after = await game.snapshot();
      const evidence = motionEvidence(before, after);
      if (evidence.length < 2) return FAIL('touch did not produce tap-flip evidence: ' + evidence.join(','));
      if (after.overlay.blocksPlayfield) return FAIL('touch left playfield blocked');
      return PASS('touch produced ' + evidence.join(', '));
    }
  },
  {
    id: 'p1-4-no-hold-drag-charge-invariant',
    level: 'P1',
    name: 'Hold and drag do not become a separate charge or steering mode',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const base = await ensureLevelReady(game);
      const hold = await game.input({ type: 'holdPlayfield', durationMs: 500 });
      if (!hold.snapshot) return FAIL('hold action returned no snapshot');
      const afterHold = await game.snapshot();
      const drag = await game.input({ type: 'dragPlayfield', from: { screenX: 200, screenY: 400 }, to: { screenX: 460, screenY: 400 }, durationMs: 500 });
      if (!drag.snapshot) return FAIL('drag action returned no snapshot');
      const afterDrag = await game.snapshot();
      const holdDelta = Math.abs(num(afterHold.knife.progress, 0) - num(base.knife.progress, 0));
      const dragDelta = Math.abs(num(afterDrag.knife.progress, 0) - num(afterHold.knife.progress, 0));
      if (['aiming', 'charging', 'steering'].includes(afterHold.knife.state) || ['aiming', 'charging', 'steering'].includes(afterDrag.knife.state)) {
        return FAIL('hold/drag exposed forbidden control state');
      }
      if (dragDelta > Math.max(holdDelta * 2 + 0.5, 2.5)) return FAIL('drag produced unbounded progress compared with hold/tap window');
      await game.wait(700);
      const beforeTap = await game.snapshot();
      const tap = await game.input({ type: 'playfieldTap' });
      const afterTap = tap.snapshot || await game.snapshot();
      const evidence = motionEvidence(beforeTap, afterTap);
      if (evidence.length < 1) return FAIL('legal tap after hold/drag did not remain operable');
      return PASS('hold/drag bounded and later tap remained valid');
    }
  },
  {
    id: 'p1-5-slice-score-visible-cut',
    level: 'P1',
    name: 'Slicing target increases score with visible cut feedback',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const pre = await validScenario(game, 'approach_sliceable', { requireReady: false });
      if (!pre.ok) return FAIL(pre.detail);
      if (pre.snapshot.entities.sliceableVisible <= 0) return FAIL('approach_sliceable has no visible target');
      const before = pre.snapshot;
      await game.input({ type: 'playfieldTap' });
      await game.input({ type: 'wait', durationMs: 900 });
      const after = await game.snapshot();
      const scoreUp = after.hud.score > before.hud.score;
      const cutChanged = after.entities.cutRevision !== before.entities.cutRevision ||
        after.entities.sliceableVisible < before.entities.sliceableVisible ||
        after.entities.particlesVisible > before.entities.particlesVisible ||
        after.scene.gameplayVisualRevision !== before.scene.gameplayVisualRevision;
      if (!scoreUp) return FAIL('score did not increase after target interaction');
      if (!cutChanged) return FAIL('score increased without cut/target/particle/visual feedback');
      if (after.hud.targetScore !== null && after.hud.scoreGoalReached !== (after.hud.score >= after.hud.targetScore)) return FAIL('goal reached flag not synchronized with score relation');
      return PASS('score and cut feedback changed together');
    }
  },
  {
    id: 'p1-6-hazard-failure-lock-retry',
    level: 'P1',
    name: 'Hazard collision causes visible failure and playfield lock',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const preResult = await game.loadScenario('hazard_ahead');
      if (!preResult.ok) return FAIL('hazard_ahead rejected: ' + (preResult.reason || 'no reason'));
      const before = preResult.snapshot || await game.snapshot();
      const preError = validateSnapshot(before, { requireReady: false });
      if (preError) return FAIL('hazard_ahead invalid precondition: ' + preError);
      if (!['ready', 'playing'].includes(before.phase) || before.result !== 'none' ||
          before.overlay.blocksPlayfield || !before.controls.canPlayfieldTap) {
        return FAIL('hazard_ahead is not a legal playable precondition');
      }
      if (before.entities.hazardVisible <= 0) return FAIL('hazard_ahead has no visible hazard');
      await game.input({ type: 'playfieldTap' });
      await game.input({ type: 'wait', durationMs: 1200 });
      const after = await game.snapshot();
      if (after.result !== 'failure' || after.phase !== 'result') return FAIL('hazard did not transition to failure result');
      if (!after.overlay.blocksPlayfield || after.controls.canPlayfieldTap) return FAIL('failure did not lock playfield');
      const feedback = after.entities.hazardFeedbackRevision !== before.entities.hazardFeedbackRevision ||
        after.scene.gameplayVisualRevision !== before.scene.gameplayVisualRevision ||
        after.knife.state === 'tumbling';
      if (!feedback) return FAIL('failure lacks hazard/visual/tumble feedback');
      const locked = await game.input({ type: 'playfieldTap' });
      const lockedSnap = locked.snapshot || await game.snapshot();
      if (lockedSnap.knife.progress !== after.knife.progress || lockedSnap.hud.score !== after.hud.score) return FAIL('playfield tap mutated terminal failure state');
      if (!after.controls.canRetry) return FAIL('retry not available after failure');
      return PASS('hazard failure locks input and exposes retry');
    }
  },
  {
    id: 'p1-7-finish-threshold-victory-short',
    level: 'P1',
    name: 'Finish result separates score-met victory from score-short retry',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const met = await validFinishScenario(game, 'near_finish_score_met');
      if (!met.ok) return FAIL(met.detail);
      if (!(met.snapshot.hud.score >= met.snapshot.hud.targetScore)) return FAIL('score-met scenario is not a legal score-met precondition');
      const metBefore = met.snapshot;
      const victory = await finishAfterPlayerTap(game);
      if (victory.result !== 'victory') return FAIL('score-met finish did not yield victory');
      if (!victory.overlay.blocksPlayfield) return FAIL('victory result not locked');
      if (!(victory.hud.score >= victory.hud.targetScore)) return FAIL('victory result did not preserve the met score relation');
      if (victory.progress.rewardRevision === metBefore.progress.rewardRevision && victory.hud.coins <= metBefore.hud.coins && !victory.controls.canGoNextLevel) {
        return FAIL('victory had no reward/progression/next-level evidence');
      }
      const short = await validFinishScenario(game, 'near_finish_score_short');
      if (!short.ok) return FAIL(short.detail);
      if (!(short.snapshot.hud.score < short.snapshot.hud.targetScore)) return FAIL('score-short scenario is not a legal short-score precondition');
      const shortBefore = short.snapshot;
      const shortAfter = await finishAfterPlayerTap(game);
      if (shortAfter.result !== 'scoreNotMet') return FAIL('score-short finish did not yield scoreNotMet');
      if (!(shortAfter.hud.score < shortAfter.hud.targetScore)) return FAIL('score-short finish changed the score relation');
      if (shortAfter.progress.rewardRevision !== shortBefore.progress.rewardRevision ||
          shortAfter.hud.coins !== shortBefore.hud.coins ||
          JSON.stringify(shortAfter.level.unlocked) !== JSON.stringify(shortBefore.level.unlocked) ||
          shortAfter.controls.canGoNextLevel) return FAIL('short finish granted reward or next-level');
      return PASS('victory and score-not-met branches are distinct');
    }
  },
  {
    id: 'p1-8-pause-block-resume',
    level: 'P1',
    name: 'Pause blocks playfield tap and resume preserves run',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const ready = await ensureLevelReady(game);
      if (!ready || !['ready', 'playing'].includes(ready.phase) ||
          !ready.controls || !ready.controls.canPlayfieldTap) return FAIL('precondition not playable');
      await game.input({ type: 'playfieldTap' });
      const running = await game.snapshot();
      if (running.phase !== 'playing' || !running.controls || !running.controls.canPause) {
        return FAIL('tap did not leave a playable run to pause');
      }
      const pausedRes = await game.input({ type: 'pause' });
      const paused = pausedRes.snapshot || await game.snapshot();
      if (paused.phase !== 'paused' || !paused.overlay.blocksPlayfield || paused.controls.canPlayfieldTap) return FAIL('pause did not block playfield');
      await game.realPlayfieldClick({ avoidInteractive: true });
      await game.input({ type: 'wait', durationMs: 500 });
      const blocked = await game.snapshot();
      if (blocked.hud.score !== paused.hud.score || Math.abs(blocked.knife.progress - paused.knife.progress) > 0.01) return FAIL('paused tap/wait changed score or progress');
      const resumed = (await game.input({ type: 'resume' })).snapshot || await game.snapshot();
      if (resumed.overlay.blocksPlayfield || !resumed.controls.canPlayfieldTap) return FAIL('resume did not re-enable playfield');
      const beforeTap = await game.snapshot();
      await game.input({ type: 'playfieldTap' });
      const afterTap = await game.snapshot();
      if (motionEvidence(beforeTap, afterTap).length < 1 && afterTap.result === running.result) return FAIL('tap after resume did not affect gameplay');
      return PASS('pause blocks hidden play and resume preserves operability');
    }
  },
  {
    id: 'p1-9-level-select-reject-invariant',
    level: 'P1',
    name: 'Level select accepts unlocked levels and rejects locked or invalid levels',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const preResult = await game.loadScenario('level_select_open');
      const pre = preResult.snapshot || await game.snapshot();
      if (!preResult.ok) return FAIL('level_select_open rejected: ' + (preResult.reason || 'no reason'));
      const schemaErr = validateSnapshot(pre, { requireReady: false });
      if (schemaErr) return FAIL('level_select_open invalid precondition: ' + schemaErr);
      if (pre.phase !== 'levelSelect') return FAIL('level_select_open did not open level select phase');
      if (!pre.overlay || pre.overlay.active !== 'levelSelect' || !pre.overlay.blocksPlayfield || pre.controls.canPlayfieldTap) return FAIL('level-select overlay did not block playfield');
      const total = pre.level && pre.level.total;
      const unlocked = pre.level && Array.isArray(pre.level.unlocked) ? pre.level.unlocked.slice() : [];
      if (!Number.isInteger(total) || total <= 0 || !unlocked.length) return FAIL('level precondition has no valid unlocked list');
      const zeroBased = unlocked.includes(0);
      const first = zeroBased ? 0 : 1;
      const last = zeroBased ? total - 1 : total;
      let lockedIndex = null;
      for (let index = first; index <= last; index++) {
        if (!unlocked.includes(index)) {
          lockedIndex = index;
          break;
        }
      }
      const stableSelection = (before, after) =>
        sameStableRunFields(before, after) &&
        before.phase === after.phase &&
        JSON.stringify((before.level && before.level.unlocked) || []) === JSON.stringify((after.level && after.level.unlocked) || []);
      if (lockedIndex !== null) {
        const beforeLocked = await game.snapshot();
        const locked = await game.input({ type: 'selectLevel', index: lockedIndex });
        const afterLocked = locked.snapshot || await game.snapshot();
        if (!stableSelection(beforeLocked, afterLocked)) return FAIL('locked level selection mutated stable fields');
        if ((afterLocked.level && afterLocked.level.unlocked || []).some(v => v === lockedIndex)) return FAIL('locked level became unlocked');
      }
      const beforeReject = await game.snapshot();
      const invalidIndex = Math.max(total + 5, 999);
      const rejected = await game.input({ type: 'selectLevel', index: invalidIndex });
      const afterReject = rejected.snapshot || await game.snapshot();
      if (!stableSelection(beforeReject, afterReject)) return FAIL('invalid level selection mutated stable fields');
      if ((afterReject.level && afterReject.level.unlocked || []).some(v => v === invalidIndex)) return FAIL('invalid level became unlocked');
      const selected = await game.input({ type: 'selectLevel', index: unlocked[0] });
      const afterUnlocked = selected.snapshot || await game.snapshot();
      if (afterUnlocked.mode !== 'level' || !['ready', 'playing'].includes(afterUnlocked.phase)) return FAIL('unlocked level did not load ready state');
      if (afterUnlocked.hud.score !== 0 || afterUnlocked.result !== 'none') return FAIL('unlocked selection did not reset run-local state');
      return PASS('unlocked selection works and locked/invalid selections preserve invariants');
    }
  },
  {
    id: 'p1-10-key-left-right-no-steering-invariant',
    level: 'P1',
    name: 'Left/right keys do not become hidden steering controls',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const before = await ensureLevelReady(game);
      if (before.overlay.blocksPlayfield || !before.controls.canPlayfieldTap) return FAIL('precondition not playable');
      await browser.keyDown('ArrowLeft');
      await game.wait(120);
      await browser.keyUp('ArrowLeft');
      await browser.keyDown('ArrowRight');
      await game.wait(120);
      await browser.keyUp('ArrowRight');
      await browser.keyDown('KeyA');
      await game.wait(120);
      await browser.keyUp('KeyA');
      await browser.keyDown('KeyD');
      await game.wait(120);
      await browser.keyUp('KeyD');
      await game.wait(250);
      const afterKeys = await game.snapshot();
      const progressDelta = Math.abs(num(afterKeys.knife.progress, 0) - num(before.knife.progress, 0));
      const scoreDelta = Math.abs(num(afterKeys.hud.score, 0) - num(before.hud.score, 0));
      const lateralDelta = finite(before?.knife?.screenX) && finite(afterKeys?.knife?.screenX)
        ? Math.abs(afterKeys.knife.screenX - before.knife.screenX)
        : 0;
      const stableStateChanged = afterKeys.phase !== before.phase ||
        afterKeys.result !== before.result ||
        afterKeys.knife.state !== before.knife.state ||
        afterKeys.overlay.blocksPlayfield !== before.overlay.blocksPlayfield ||
        afterKeys.controls.canPlayfieldTap !== before.controls.canPlayfieldTap;
      if (scoreDelta > 0 || progressDelta > 0.05 || lateralDelta > 0.5 || stableStateChanged) {
        return FAIL('left/right or A/D keys changed gameplay despite no directional control contract');
      }
      const tap = await game.input({ type: 'playfieldTap' });
      const afterTap = tap.snapshot || await game.snapshot();
      if (motionEvidence(afterKeys, afterTap).length < 1) return FAIL('valid tap did not remain the actual movement trigger after key presses');
      return PASS('direction opposite not applicable; lateral keys are inert and tap remains primary control');
    }
  },
  {
    id: 'p1-11-safe-poor-contact-outcomes',
    level: 'P1',
    name: 'Safe blade contact contrasts with poor contact outcome',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const validContactScenario = async (name) => {
        const res = await game.loadScenario(name);
        if (!res.ok) return { ok: false, detail: name + ' rejected: ' + (res.reason || 'no reason'), snapshot: res.snapshot };
        const s = res.snapshot || await game.snapshot();
        const schemaErr = validateSnapshot(s, { requireReady: false });
        if (schemaErr) return { ok: false, detail: name + ' invalid precondition: ' + schemaErr, snapshot: s };
        if (!['ready', 'playing'].includes(s.phase) || s.overlay.blocksPlayfield || !s.controls.canPlayfieldTap) {
          return { ok: false, detail: name + ' invalid precondition: not playable', snapshot: s };
        }
        return { ok: true, snapshot: s };
      };
      const hasSafeOutcome = (s) => s && (
        s.result === 'failure' ||
        (s.knife.state === 'stuck' &&
          (s.knife.contactFace === 'blade' || s.knife.supportFace !== 'none'))
      );
      const hasPoorOutcome = (s) => s && (
        s.result === 'failure' ||
        s.knife.contactFace === 'handle' ||
        s.knife.contactFace === 'poorAngle' ||
        ['bouncing', 'recovering', 'tumbling'].includes(s.knife.state)
      );
      const samplesAfterTap = async (predicate, maxSamples = 18) => {
        const samples = [];
        const record = (res) => {
          samples.push(res && res.snapshot ? res.snapshot : null);
        };
        record(await game.input({ type: 'playfieldTap' }));
        if (!samples[0]) samples[0] = await game.snapshot();
        for (let i = 0; i < maxSamples && !samples.some(predicate); i += 1) {
          record(await game.input({ type: 'wait', durationMs: 120 }));
          if (!samples[samples.length - 1]) {
            samples[samples.length - 1] = await game.snapshot();
          }
        }
        return samples;
      };
      const safe = await validContactScenario('safe_landing_gap');
      if (!safe.ok) return FAIL(safe.detail);
      const safeSamples = await samplesAfterTap(hasSafeOutcome, 36);
      if (!safeSamples.some(hasSafeOutcome)) return FAIL('safe landing scenario produced no contact/failure/support resolution');
      const poor = await validContactScenario('poor_contact');
      if (!poor.ok) return FAIL(poor.detail);
      const poorBefore = poor.snapshot;
      const poorSamples = await samplesAfterTap(hasPoorOutcome);
      if (!poorSamples.some(hasPoorOutcome)) return FAIL('poor contact did not produce bounce/recovery/failure pressure');
      if (poorSamples.some((s) => s.hud.score > poorBefore.hud.score &&
        s.entities.cutRevision === poorBefore.entities.cutRevision)) {
        return FAIL('poor contact granted score without cut evidence');
      }
      return PASS('safe and poor contact paths are observably distinct');
    }
  },
  {
    id: 'p1-12-moving-support-wait-risk',
    level: 'P1',
    name: 'Moving support changes route state and preserves tap risk',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const moving = await validScenario(game, 'moving_support', { requireReady: false });
      if (!moving.ok) return FAIL(moving.detail);
      const before = moving.snapshot;
      await game.input({ type: 'wait', durationMs: 900 });
      const afterWait = await game.snapshot();
      if (afterWait.route.movingElementsRevision === before.route.movingElementsRevision) return FAIL('moving support wait did not change movingElementsRevision');
      const visibleChange = afterWait.scene.gameplayVisualRevision !== before.scene.gameplayVisualRevision ||
        changed(before.knife.progress, afterWait.knife.progress, 0.002) ||
        changed(before.knife.height, afterWait.knife.height, 0.002) ||
        changed(before.knife.screenX, afterWait.knife.screenX, 0.5) ||
        changed(before.knife.screenY, afterWait.knife.screenY, 0.5) ||
        changed(before.knife.rotationTurns, afterWait.knife.rotationTurns, 0.002) ||
        revisionChanged(before.scene, afterWait.scene, 'renderRevision') ||
        afterWait.knife.state !== before.knife.state ||
        afterWait.result !== before.result;
      if (!visibleChange) return FAIL('moving support had no visible/knife/risk consequence');
      const beforeTap = await game.snapshot();
      await game.input({ type: 'playfieldTap' });
      const afterTap = await game.snapshot();
      if (afterTap.result === 'none' && motionEvidence(beforeTap, afterTap).length < 1) return FAIL('tap near moving support did not affect knife/risk state');
      return PASS('moving support advances and remains coupled to tap/risk');
    }
  },
  {
    id: 'p1-13-retry-cleans-failure-state',
    level: 'P1',
    name: 'Retry after failure clears result, score, and blocking state',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const pre = await validScenario(game, 'hazard_ahead', { requireReady: false });
      if (!pre.ok) return FAIL(pre.detail);
      await game.input({ type: 'playfieldTap' });
      await game.input({ type: 'wait', durationMs: 1200 });
      const failed = await game.snapshot();
      if (failed.result !== 'failure' || failed.phase !== 'result') return FAIL('could not establish legal failure before retry');
      const retry = await game.input({ type: 'retry' });
      const afterRetry = retry.snapshot || await game.snapshot();
      const schemaErr = validateSnapshot(afterRetry);
      if (schemaErr) return FAIL('retry snapshot invalid: ' + schemaErr);
      if (afterRetry.result !== 'none') return FAIL('retry did not clear result');
      if (!['ready', 'playing'].includes(afterRetry.phase)) return FAIL('retry did not return to ready/playable phase');
      if (afterRetry.overlay.blocksPlayfield || !afterRetry.controls.canPlayfieldTap) return FAIL('retry left playfield blocked');
      if (afterRetry.hud.score !== 0) return FAIL('retry did not clear run-local score');
      if (!['stuck', 'notReady'].includes(afterRetry.knife.state)) return FAIL('retry did not restore safe knife start state');
      return PASS('retry clears terminal failure and restores playable run');
    }
  },
  {
    id: 'p2-1-endless-timer-pressure',
    level: 'P2',
    name: 'Endless mode timer drains only during active play',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      await game.reset();
      const chosen = await game.input({ type: 'chooseMode', mode: 'endless' });
      const ready = chosen.snapshot || await game.snapshot();
      if (!chosen.ok || ready.mode !== 'endless') return NA('endless mode omitted as P2 cut scope');
      if (ready.phase !== 'ready') return FAIL('endless mode did not enter ready state');
      if (ready.hud.targetScore !== null) return FAIL('endless exposes fixed targetScore');
      if (!finite(ready.hud.timerValue) && !finite(ready.hud.timerRatio)) return FAIL('endless timer fields missing');
      function timerDecreased(before, after, epsilon) {
        const eps = epsilon == null ? 0.001 : epsilon;
        const drops = [];
        for (const key of ['timerValue', 'timerRatio']) {
          if (finite(before.hud[key]) && finite(after.hud[key])) {
            drops.push(after.hud[key] < before.hud[key] - eps);
          }
        }
        return drops.some(Boolean);
      }
      const readyBeforeWait = await game.snapshot();
      if (readyBeforeWait.phase !== 'ready') return FAIL('endless mode left ready state before a playfield tap');
      await game.input({ type: 'wait', durationMs: 250 });
      const readyAfterWait = await game.snapshot();
      if (readyAfterWait.phase !== 'ready') return FAIL('endless mode began playing before a playfield tap');
      if (timerDecreased(readyBeforeWait, readyAfterWait, 0.01)) return FAIL('timer drained while endless mode was ready');
      await game.input({ type: 'playfieldTap' });
      let beforeWait = await game.snapshot();
      if (beforeWait.phase !== 'playing') return FAIL('endless tap did not enter active play');
      let observedDrain = false;
      for (let attempt = 0; attempt < 8; attempt++) {
        await game.input({ type: 'wait', durationMs: 250 });
        const afterWait = await game.snapshot();
        if (afterWait.entities.cutRevision !== beforeWait.entities.cutRevision) {
          beforeWait = afterWait;
          continue;
        }
        if (!timerDecreased(beforeWait, afterWait)) return FAIL('timer did not drain during endless play without a slice');
        observedDrain = true;
        break;
      }
      if (!observedDrain) return FAIL('could not observe target-free endless timer drain');
      await game.input({ type: 'pause' });
      const paused = await game.snapshot();
      await game.input({ type: 'wait', durationMs: 700 });
      const afterPauseWait = await game.snapshot();
      const pt0 = finite(paused.hud.timerRatio) ? paused.hud.timerRatio : paused.hud.timerValue;
      const pt1 = finite(afterPauseWait.hud.timerRatio) ? afterPauseWait.hud.timerRatio : afterPauseWait.hud.timerValue;
      if (finite(pt0) && finite(pt1) && pt1 < pt0 - 0.01) return FAIL('timer drained while paused');
      return PASS('endless timer pressure is active and respects pause');
    }
  },
  {
    id: 'p2-2-shop-rejection-resource-invariant',
    level: 'P2',
    name: 'Shop blocks playfield and rejected purchase preserves resources',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const pre = await validScenario(game, 'shop_open');
      if (!pre.ok) return NA('shop omitted as P2 cut scope: ' + pre.detail);
      if (pre.snapshot.phase !== 'shop' || !pre.snapshot.overlay.blocksPlayfield) return FAIL('shop does not block playfield');
      if (!pre.snapshot.shop) return FAIL('shop snapshot missing');
      const beforeTap = pre.snapshot;
      await game.input({ type: 'playfieldTap' });
      const afterTap = await game.snapshot();
      if (afterTap.knife.progress !== beforeTap.knife.progress || afterTap.hud.score !== beforeTap.hud.score) return FAIL('shop did not block playfield tap');
      await game.input({ type: 'shopSelect', item: 'unaffordable' });
      const beforeBuy = await game.snapshot();
      const buy = await game.input({ type: 'shopBuy' });
      const afterBuy = buy.snapshot || await game.snapshot();
      if (afterBuy.hud.coins !== beforeBuy.hud.coins) return FAIL('rejected purchase changed coins');
      if (afterBuy.shop && beforeBuy.shop && (afterBuy.shop.ownedCount !== beforeBuy.shop.ownedCount || afterBuy.shop.equippedRevision !== beforeBuy.shop.equippedRevision)) {
        return FAIL('rejected purchase changed ownership/equipment');
      }
      if (afterBuy.shop && beforeBuy.shop && afterBuy.shop.rejectionRevision === beforeBuy.shop.rejectionRevision && buy.ok !== false) return FAIL('unaffordable buy had no rejection evidence');
      return PASS('shop blocks playfield and preserves resources on rejection');
    }
  },
  {
    id: 'p2-3-audio-save-reload-consistency',
    level: 'P2',
    name: 'Audio toggle and reload keep progress consistent when supported',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const err = await ensureApiReady(game);
      if (err) return FAIL(err);
      const before = await ensureLevelReady(game);
      const toggle = await game.input({ type: 'toggleAudio', channel: 'music', enabled: false });
      const toggled = toggle.snapshot || await game.snapshot();
      if (!toggle.ok) return NA('audio settings omitted as P2 cut scope');
      const toggledSchemaErr = validateSnapshot(toggled, { requireReady: false });
      if (toggledSchemaErr) return FAIL('audio toggle returned invalid snapshot: ' + toggledSchemaErr);
      if (toggled.hud.score !== before.hud.score || toggled.hud.coins !== before.hud.coins || toggled.result !== before.result) return FAIL('audio toggle corrupted gameplay state');
      const beforeUnlocked = Array.isArray(before.level?.unlocked) ? before.level.unlocked.slice().sort((a, b) => a - b) : null;
      const toggledUnlocked = Array.isArray(toggled.level?.unlocked) ? toggled.level.unlocked.slice().sort((a, b) => a - b) : null;
      if (beforeUnlocked && toggledUnlocked && JSON.stringify(toggledUnlocked) !== JSON.stringify(beforeUnlocked)) return FAIL('audio toggle changed unlocked level progress');
      if (finite(before.progress?.levelCompletedCount) && finite(toggled.progress?.levelCompletedCount) && toggled.progress.levelCompletedCount !== before.progress.levelCompletedCount) return FAIL('audio toggle changed completion progress');
      const savedBefore = toggled.progress && toggled.progress.savedRevision;
      const reload = await game.input({ type: 'reloadSession' });
      const afterReload = reload.snapshot || await game.snapshot();
      const schemaErr = validateSnapshot(afterReload, { requireReady: false });
      if (schemaErr) return FAIL('reload returned invalid snapshot: ' + schemaErr);
      const afterUnlocked = Array.isArray(afterReload.level?.unlocked) ? afterReload.level.unlocked.slice().sort((a, b) => a - b) : null;
      if (beforeUnlocked && afterUnlocked && JSON.stringify(afterUnlocked) !== JSON.stringify(beforeUnlocked)) return FAIL('reload changed unlocked level progress');
      if (finite(before.hud?.coins) && finite(afterReload.hud?.coins) && afterReload.hud.coins !== before.hud.coins) return FAIL('reload changed coin progress');
      if (finite(before.progress?.levelCompletedCount) && finite(afterReload.progress?.levelCompletedCount) && afterReload.progress.levelCompletedCount !== before.progress.levelCompletedCount) return FAIL('reload changed completion progress');
      if (finite(savedBefore) && finite(afterReload.progress.savedRevision) && afterReload.progress.savedRevision < savedBefore) return FAIL('saved revision regressed after reload');
      return PASS('toggle/reload preserved stable progress contract');
    }
  }
];

module.exports = { suite };
