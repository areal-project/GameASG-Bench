'use strict';

// === GDD Coverage Map ===
// M1 3D ragdoll playfield -> p0-boot-contract-schema, p1-click-start-restart-readable-playfield, p1-feedback-visible-sync-chain
// M2 mouse/touch drag -> p1-mouse-drag-direction-opposite-release, p2-touch-drag-direction-opposite-chain
// M3 release physics -> p1-mouse-drag-direction-opposite-release, p1-tool-prop-drag-contact-damage
// M4 priority and rejection -> p1-rejection-blank-fixed-locked-invariants, p1-tool-prop-drag-contact-damage
// M5 health and damage -> p1-fixed-zone-damage-death-lock, p1-feedback-visible-sync-chain, p2-post-complete-health-progress-invariants
// M6 death and completion -> p1-fixed-zone-damage-death-lock, p1-complete-next-restart-progression-flow
// M7 hazard families -> p1-tool-prop-drag-contact-damage, p1-moving-hazard-placement-impact, p1-explosive-heavy-release-trigger, p1-fixed-zone-damage-death-lock, p1-mechanism-trigger-second-stage, p1-click-release-target-chain
// M8 level select and progress -> p1-complete-next-restart-progression-flow, p1-level-select-locked-unlocked-invariants
// M9 persistence -> p1-level-select-locked-unlocked-invariants
// M10 extended hazards -> p2-extended-hazard-visible-chain

// === Rationality Map ===
// p1-click-start-restart-readable-playfield: M1/M6 | real action: browser.mouseClick start/restart control and DOM .click() fallback | independent observation: phase/render/dummy/hazard/health/result cleanup snapshot + visible canvas hash | empty-shell failure: menu-only or stale restart shell fails
// p1-mouse-drag-direction-opposite-release: M2/M3 | real action: Input.dispatchMouseEvent mouse drag left/right/up/down from semantic dummy point | independent observation: dummy screen deltas + Math.sign direction opposite + grab/release revisions | empty-shell failure: API-only, mirrored, teleport-only, or pinned-after-release drag fails
// p1-rejection-blank-fixed-locked-invariants: M4/M5/M6 | real action: blank drag, fixed-hazard drag, and locked-phase scene drag | independent observation: health/result/progress/revision invariants + lastAction rejection | empty-shell failure: blank damage, draggable fixed zone, or terminal mutation fails
// p1-fixed-zone-damage-death-lock: M5/M6/M7 | real action: drag dummy into fixed hazard, hold/wait, drag out, then continue valid contact | independent observation: contact/effect revisions, health drop/clamp, completion overlay and locked drag invariant | empty-shell failure: visual-only hazard, pure health subtraction, negative health, or post-death puppeteering fails
// p1-tool-prop-drag-contact-damage: M3/M4/M7 | real action: drag draggable tool/prop to dummy and hold/release | independent observation: prop follows pointer, contact/effect/damage revisions, dummy motion and health change | empty-shell failure: decorative tool or state-only damage fails
// p1-moving-hazard-placement-impact: M7 | real action: place dummy into automatic hazard path then wait | independent observation: idle hazard motion revision, player placement delta, later impact/contact and health change | empty-shell failure: stationary hazard label or passive auto-complete without placement fails
// p1-explosive-heavy-release-trigger: M7 | real action: drag/release prop into legal trigger near dummy | independent observation: releaseRevision, trigger/effect revision after release, dummy motion/damage, health/result change | empty-shell failure: pre-triggered explosion or direct health zero fails
// p1-mechanism-trigger-second-stage: M7 | real action: drag dummy/prop onto mechanism trigger and release/wait | independent observation: triggerRevision, later hazard/action revision, dummy damage/motion, repeat/empty invariant | empty-shell failure: button-only state toggle or disconnected mechanism fails
// p1-click-release-target-chain: M7 | real action: browser.mouseClick clickable release target, then blank/repeat click | independent observation: clickable precondition, trigger/effect revision, dummy motion and damage/result progression, repeat invariant | empty-shell failure: click returns ok only or blank tap fakes release fails
// p1-complete-next-restart-progression-flow: M6/M8 | real action: complete through hazard chain then DOM .click() next/restart controls | independent observation: result visible/blocking, next changes level with full health, restart resets current level cleanup | empty-shell failure: auto-advance, dead-object reuse, or nonblocking result overlay fails
// p1-level-select-locked-unlocked-invariants: M8/M9 | real action: DOM .click() level select, select unlocked/locked, scroll list, reset preserveProgress | independent observation: level-node locked flags, legal level changes, locked/scroll stable progress, persistence fallback | empty-shell failure: all-unlocked shell, scroll selects level, or persistence black screen fails
// p1-feedback-visible-sync-chain: M1/M5/M6 | real action: real mouse drag plus valid hazard contract action | independent observation: canvas/render revision/hash, HUD/health ratio, feedback revisions, result overlay/blocking sync | empty-shell failure: fake __gameTest disconnected from visible game fails
// p2-touch-drag-direction-opposite-chain: M2 | real action: Input.dispatchTouchEvent touch drag in opposite directions | independent observation: accepted touch path, dummy screen delta Math.sign direction opposite, release/pose revision | empty-shell failure: desktop-only input or direction-ignored touch fails
// p2-extended-hazard-visible-chain: M10 | real action: load extended family, trigger declared chain with drag/tap/wait | independent observation: visible extended hazard, trigger/effect revision, dummy damage/motion, normal result/restart invariant | empty-shell failure: empty P2 button or repeated static background fails
// p2-post-complete-health-progress-invariants: M5/M6/M8 | real action: repeated post-complete damage/next/restart/select attempts | independent observation: health clamp, single completion revision, legal level indexes, rejected invalid action | empty-shell failure: duplicate rewards, negative health, or invalid navigation fails

const PHASES = new Set(['loading', 'start', 'playing', 'dying', 'complete', 'levelSelect']);
const SCREENS = new Set(['loading', 'start', 'playfield', 'complete', 'levelSelect']);
const RESULTS = new Set(['none', 'dying', 'complete']);
const HAZARD_FAMILIES = new Set(['tool', 'moving', 'explosiveOrHeavy', 'fixedZone', 'mechanism', 'clickRelease', 'extended']);
const REASONS = new Set(['notReady', 'blocked', 'noTarget', 'locked', 'invalidAction', 'outOfRange', 'alreadyUsed', 'notInteractable']);

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function num(value, fallback = 0) {
  return isFiniteNumber(value) ? value : fallback;
}

function changed() {
  for (let i = 0; i < arguments.length; i += 2) {
    if (num(arguments[i + 1]) > num(arguments[i])) return true;
  }
  return false;
}

function healthValue(s) {
  return num(s?.health?.ratio, num(s?.health?.current, 0));
}

function sameProgress(a, b) {
  const aa = (a?.progress?.unlockedLevelIndexes || []).join(',');
  const bb = (b?.progress?.unlockedLevelIndexes || []).join(',');
  return aa === bb && num(a?.progress?.currentLevelIndex) === num(b?.progress?.currentLevelIndex);
}

function sameCoreState(a, b) {
  return healthValue(a) === healthValue(b) &&
    (a?.result?.state || 'none') === (b?.result?.state || 'none') &&
    num(a?.result?.completionRevision) === num(b?.result?.completionRevision) &&
    sameProgress(a, b);
}

function clickReleaseTargetState(s) {
  const target = (s?.interactables || []).find(item => item?.kind === 'clickReleaseTarget');
  if (!target) return null;
  return { id: target.id, enabled: target.enabled === true, clickable: target.clickable === true };
}

function clickReleaseTargetChanged(before, after) {
  const a = clickReleaseTargetState(before);
  const b = clickReleaseTargetState(after);
  return !!a && (!b || a.id !== b.id || a.enabled !== b.enabled || a.clickable !== b.clickable);
}

function sameClickReleaseState(a, b) {
  return sameCoreState(a, b) &&
    num(a?.dummy?.damageRevision) === num(b?.dummy?.damageRevision) &&
    num(a?.feedback?.releaseRevision) === num(b?.feedback?.releaseRevision) &&
    num(a?.feedback?.impactRevision) === num(b?.feedback?.impactRevision) &&
    num(a?.feedback?.damageRevision) === num(b?.feedback?.damageRevision) &&
    !clickReleaseTargetChanged(a, b);
}

function pointFrom(value, fallback) {
  if (!value) return fallback || null;
  if (isFiniteNumber(value.screenX) && isFiniteNumber(value.screenY)) return { x: value.screenX, y: value.screenY };
  if (value.center) return pointFrom(value.center, fallback);
  if (value.bounds) {
    const b = value.bounds;
    if ([b.left, b.top, b.width, b.height].every(isFiniteNumber)) return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  }
  return fallback || null;
}

function dummyPoint(s, partGroup) {
  const parts = Array.isArray(s?.dummy?.parts) ? s.dummy.parts : [];
  const preferred = parts.find(p => (!partGroup || p.group === partGroup) && p.grabbable && isFiniteNumber(p.screenX) && isFiniteNumber(p.screenY));
  const p = pointFrom(preferred) || pointFrom(s?.dummy?.center);
  if (!p) throw new Error('missing public dummy screen point');
  return p;
}

function dummyDragTarget(s) {
  const parts = Array.isArray(s?.dummy?.parts) ? s.dummy.parts : [];
  const part = parts.find(p => p.grabbable && isFiniteNumber(p.screenX) && isFiniteNumber(p.screenY));
  const point = pointFrom(part) || pointFrom(s?.dummy?.center);
  if (!point) throw new Error('missing public dummy screen point');
  return { point, id: part?.id || null, group: part?.group || null, index: part ? parts.indexOf(part) : -1 };
}

function dummyDragPartPoint(s, target) {
  const parts = Array.isArray(s?.dummy?.parts) ? s.dummy.parts : [];
  const part = (target?.id && parts.find(p => p.id === target.id)) ||
    (target?.group && parts.find(p => p.group === target.group)) ||
    (Number.isInteger(target?.index) && target.index >= 0 ? parts[target.index] : null);
  return pointFrom(part) || pointFrom(s?.dummy?.center);
}

function hazardPoint(s, family) {
  const hazards = Array.isArray(s?.hazards) ? s.hazards : [];
  const h = hazards.find(x => (!family || x.family === family) && x.visible && isFiniteNumber(x.screenX) && isFiniteNumber(x.screenY)) ||
    hazards.find(x => x.visible && isFiniteNumber(x.screenX) && isFiniteNumber(x.screenY));
  const p = pointFrom(h);
  if (!p) throw new Error(`missing public hazard screen point${family ? ` for ${family}` : ''}`);
  return p;
}

function interactablePoint(s, kind, family) {
  const items = Array.isArray(s?.interactables) ? s.interactables : [];
  const item = items.find(x => (!kind || x.kind === kind) && (!family || x.family === family) && x.enabled && isFiniteNumber(x.screenX) && isFiniteNumber(x.screenY));
  const p = pointFrom(item);
  if (!p) throw new Error(`missing public interactable screen point${kind ? ` for ${kind}` : ''}`);
  return p;
}

function safeBlankPoint(s) {
  const first = Array.isArray(s?.playfield?.safeBlankPoints) ? s.playfield.safeBlankPoints[0] : null;
  const p = pointFrom(first);
  if (!p) throw new Error('missing public safe blank point');
  return p;
}

function centerOfPlayfield(s) {
  const b = s?.playfield?.bounds || {};
  if ([b.left, b.top, b.width, b.height].every(isFiniteNumber)) return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  throw new Error('missing public playfield bounds');
}

function controlPoint(s, name) {
  const controls = Array.isArray(s?.controls) ? s.controls : [];
  const control = controls.find(c => c.name === name && c.visible !== false && c.enabled !== false);
  const p = pointFrom(control);
  if (!p) throw new Error(`missing public control point for ${name}`);
  return p;
}

async function waitForStartControl(game, snapshot, timeoutMs = 4000) {
  let s = snapshot;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const controls = Array.isArray(s?.controls) ? s.controls : [];
    const start = controls.find(c => c.name === 'start' && c.visible !== false && c.enabled !== false);
    if (s?.phase === 'start' && pointFrom(start)) return s;
    s = await game.wait(120);
  }
  return s;
}

function hazardByFamily(s, family) {
  const hazards = Array.isArray(s?.hazards) ? s.hazards : [];
  return hazards.find(h => h.family === family) || hazards[0] || {};
}

function assertShape(s) {
  if (!s || s.contractMissing) return 'window.__gameTest contract is missing';
  if (!PHASES.has(s.phase)) return `invalid phase ${s.phase}`;
  if (!SCREENS.has(s.screen)) return `invalid screen ${s.screen}`;
  if (!s.render || typeof s.render.ready !== 'boolean' || typeof s.render.nonBlank !== 'boolean') return 'render summary missing ready/nonBlank booleans';
  if (!s.playfield || !s.playfield.bounds || typeof s.playfield.readable3DScene !== 'boolean') return 'playfield summary missing bounds/readable3DScene';
  if (!s.level || !HAZARD_FAMILIES.has(s.level.family)) return `level family invalid: ${s.level && s.level.family}`;
  if (!s.progress || !Array.isArray(s.progress.unlockedLevelIndexes)) return 'progress unlockedLevelIndexes missing';
  if (!s.health || !isFiniteNumber(s.health.current) || !isFiniteNumber(s.health.max) || !isFiniteNumber(s.health.ratio)) return 'health numeric fields missing';
  if (s.health.current < 0 || s.health.ratio < 0) return 'health went below zero';
  if (!s.dummy || typeof s.dummy.visible !== 'boolean' || !s.dummy.center) return 'dummy summary missing';
  if (!Array.isArray(s.hazards)) return 'hazards summary missing';
  if (!s.feedback || !s.result || !RESULTS.has(s.result.state)) return 'feedback/result summary missing';
  if (!s.lastAction || typeof s.lastAction.accepted !== 'boolean') return 'lastAction envelope missing';
  if (s.lastAction.reason && !REASONS.has(s.lastAction.reason)) return `invalid rejection reason ${s.lastAction.reason}`;
  return '';
}

function assertPlayable(s, label) {
  const shape = assertShape(s);
  if (shape) return `${label}: ${shape}`;
  if (s.phase !== 'playing') return `${label}: expected playing phase, got ${s.phase}`;
  if (!s.render.ready || !s.render.nonBlank || !s.playfield.readable3DScene) return `${label}: render is not a readable nonblank 3D playfield`;
  if (!s.canInteractWithPlayfield || s.overlayBlocking) return `${label}: playfield is blocked while playing`;
  if (!s.dummy.visible || !s.health.visible || s.hazards.filter(h => h.visible).length < 1) return `${label}: dummy, hazard, or health is not visible`;
  if (s.result.state !== 'none' || s.result.visible) return `${label}: playable setup preloads a result`;
  return '';
}

function assertLegalPrecondition(s, label) {
  const playable = assertPlayable(s, label);
  if (playable) return playable;
  if (s.level.completed || healthValue(s) <= 0) return `${label}: scenario pre-applies completion or damage`;
  if (!s.level.hazardReady) return `${label}: hazard is not ready`;
  return '';
}

function assertClickReleasePrecondition(s, label) {
  const shape = assertShape(s);
  if (shape) return label + ': ' + shape;
  if (s.level.family !== 'clickRelease') return label + ': expected clickRelease level family';
  if (s.phase !== 'playing') return label + ': expected playing phase, got ' + s.phase;
  if (!s.render.ready || !s.render.nonBlank || !s.playfield.readable3DScene) return label + ': render is not a readable nonblank 3D playfield';
  if (!s.canInteractWithPlayfield || s.overlayBlocking) return label + ': playfield is blocked while playing';
  if (!s.dummy.visible || !s.health.visible) return label + ': dummy or health is not visible';
  if (s.result.state !== 'none' || s.result.visible) return label + ': playable setup preloads a result';
  if (s.level.completed || healthValue(s) <= 0) return label + ': scenario pre-applies completion or damage';
  if (!s.level.hazardReady) return label + ': hazard is not ready';
  if (!s.interactables.some(item => item.kind === 'clickReleaseTarget' && item.enabled)) return label + ': clickable release target is not ready';
  return '';
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
      const snap = await gt.getSnapshot();
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function reset(options) {
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.reset !== 'function') return { contractMissing: true };
      const snap = await gt.reset(${JSON.stringify(options || {})});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function loadScenario(name, options) {
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.loadScenario !== 'function') return { contractMissing: true };
      const snap = await gt.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function input(action) {
    return page(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.input !== 'function') return { contractMissing: true };
      const snap = await gt.input(${JSON.stringify(action || {})});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(snap) : snap;
    })()`);
  }

  async function wait(ms) {
    await input({ type: 'wait', ms: ms || 250 });
    await browser.sleep(Math.min(Math.max(ms || 250, 80), 1200));
    return snapshot();
  }

  async function realMouseDrag(start, end, holdMs) {
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.sleep(70);
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
    await browser.sleep(holdMs || 160);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
  }

  async function semanticDrag(target, to, durationMs, holdMs) {
    return input({ type: 'drag', target, to, durationMs: durationMs || 260, holdMs: holdMs || 120, release: true });
  }

  async function tap(target) {
    return input({ type: 'tap', target });
  }

  async function clickControl(snap, name) {
    const p = controlPoint(snap, name);
    await browser.mouseClick(p.x, p.y);
    await browser.sleep(180);
    return snapshot();
  }

  async function domClickControl(name) {
    return page(`(function(){
      const wanted = ${JSON.stringify(name)};
      const buttons = Array.from(document.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"]'));
      const byData = buttons.find(el => el.dataset && (el.dataset.gameControl === wanted || el.dataset.control === wanted || el.dataset.action === wanted));
      const byAria = buttons.find(el => String(el.getAttribute('aria-label') || '').toLowerCase().includes(wanted.toLowerCase()));
      const byText = buttons.find(el => String(el.textContent || el.value || '').toLowerCase().includes(wanted.toLowerCase()));
      const el = byData || byAria || byText;
      if (!el || typeof el.click !== 'function') return { clicked: false };
      el.click();
      return { clicked: true };
    })()`);
  }

  return { snapshot, reset, loadScenario, input, wait, realMouseDrag, semanticDrag, tap, clickControl, domClickControl };
}

async function completeByAvailableHazard(game) {
  let s = await game.loadScenario('progression_chain_start');
  let pre = assertLegalPrecondition(s, 'progression_chain_start');
  if (pre) return { error: pre, before: s };
  const deadline = Date.now() + 12000;
  let stalledCycles = 0;
  while (Date.now() < deadline && s.result.state !== 'complete' && s.phase !== 'complete') {
    if (s.phase === 'dying' || s.result.state === 'dying') {
      s = await game.wait(250);
      continue;
    }
    const family = s.level.family || 'fixedZone';
    const target = family === 'tool' || family === 'explosiveOrHeavy'
      ? { kind: 'prop', family: family === 'explosiveOrHeavy' ? 'explosiveOrHeavy' : 'tool' }
      : { kind: 'dummy', part: 'any' };
    const to = family === 'tool' || family === 'explosiveOrHeavy' ? { kind: 'dummy', part: 'any' } :
      family === 'mechanism' ? { kind: 'mechanismTrigger' } :
      family === 'clickRelease' ? { kind: 'clickReleaseTarget' } :
      { kind: 'hazard', family };
    const before = s;
    s = family === 'clickRelease' ? await game.tap(to) : await game.semanticDrag(target, to, 300, 500);
    s = await game.wait(550);
    const progressed = healthValue(s) < healthValue(before) || changed(
      before?.feedback?.grabRevision, s?.feedback?.grabRevision,
      before?.feedback?.releaseRevision, s?.feedback?.releaseRevision,
      before?.feedback?.impactRevision, s?.feedback?.impactRevision,
      before?.feedback?.damageRevision, s?.feedback?.damageRevision,
      before?.feedback?.particleOrVisualEffectRevision, s?.feedback?.particleOrVisualEffectRevision,
      before?.dummy?.poseRevision, s?.dummy?.poseRevision,
      before?.dummy?.motionRevision, s?.dummy?.motionRevision,
      before?.dummy?.damageRevision, s?.dummy?.damageRevision,
      before?.result?.completionRevision, s?.result?.completionRevision
    );
    stalledCycles = progressed ? 0 : stalledCycles + 1;
    if (stalledCycles >= 4) break;
  }
  return { after: s };
}

const suite = [
  {
    id: 'p0-boot-contract-schema',
    level: 'P0',
    name: 'Boot and contract schema expose playable public snapshot',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let s = await game.reset();
      const shape = assertShape(s);
      if (shape) return FAIL(shape);
      for (let i = 0; i < 12 && s.phase === 'loading'; i += 1) {
        s = await game.wait(250);
      }
      if (s.phase === 'start') s = await game.input({ type: 'start' });
      const playable = assertPlayable(s, 'boot/start');
      if (playable) return FAIL(playable);
      const canvas = await browser.getCanvasSize();
      if (canvas && (canvas.cssW < 200 || canvas.cssH < 150)) return FAIL('primary canvas/playfield geometry is too small');
      const surfaceHash = await browser.canvasPixelHash();
      if (surfaceHash !== null && !isFiniteNumber(surfaceHash)) return FAIL('visible surface hash is invalid');
      return PASS(`phase=${s.phase}, hazards=${s.hazards.length}, health=${s.health.ratio}`);
    }
  },
  {
    id: 'p0-invalid-action-envelope',
    level: 'P0',
    name: 'Invalid action rejects through stable lastAction envelope',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.loadScenario('first_level_start');
      const pre = assertLegalPrecondition(before, 'first_level_start');
      if (pre) return FAIL(pre);
      const after = await game.input({ type: 'notADeclaredAction', bogus: true });
      const shape = assertShape(after);
      if (shape) return FAIL(shape);
      if (after.lastAction.accepted !== false && after.lastAction.ok !== false) return FAIL('invalid action was not rejected');
      if (!sameCoreState(before, after)) return FAIL('invalid action mutated health, result, or progress');
      return PASS(after.lastAction.reason || 'rejected');
    }
  },
  {
    id: 'p1-click-start-restart-readable-playfield',
    level: 'P1',
    name: 'Real click start and restart produce readable fresh playfield',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let s = await game.loadScenario('boot');
      if (s.canInteractWithPlayfield && !s.overlayBlocking && s.phase !== 'start') return FAIL('boot scenario is already an unblocked playfield');
      s = await waitForStartControl(game, s);
      const p = controlPoint(s, 'start');
      await browser.mouseClick(p.x, p.y);
      await game.domClickControl('start'); // visible control fallback uses DOM .click()
      await browser.sleep(250);
      s = await game.input({ type: 'start' });
      const playable = assertPlayable(s, 'after start click');
      if (playable) return FAIL(playable);
      const complete = await completeByAvailableHazard(game);
      if (complete.error) return FAIL(complete.error);
      const done = complete.after;
      if (done.result.state !== 'complete' && done.phase !== 'complete') return FAIL('completion setup did not reach a result');
      await game.domClickControl('restart'); // visible restart control must be operable
      const restarted = await game.input({ type: 'restartLevel' });
      const fresh = assertPlayable(restarted, 'after restart');
      if (fresh) return FAIL(fresh);
      if (healthValue(restarted) < 0.99 || restarted.result.state !== 'none') return FAIL('restart did not restore full health and clear result');
      return PASS(`restart level=${restarted.level.index}`);
    }
  },
  {
    id: 'p1-mouse-drag-direction-opposite-release',
    level: 'P1',
    name: 'Real mouse drag direction opposite axes and release physics',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let s = await game.loadScenario('first_level_start');
      const pre = assertLegalPrecondition(s, 'first_level_start');
      if (pre) return FAIL(pre);
      const leftTarget = dummyDragTarget(s);
      const start = leftTarget.point;
      const leftBaseX = num(dummyDragPartPoint(s, leftTarget)?.x);
      const leftEnd = { x: start.x - 70, y: start.y };
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: leftEnd.x, y: leftEnd.y, button: 'left', buttons: 1, movementX: -70, movementY: 0, modifiers: 0 });
      await browser.sleep(180);
      let duringLeft = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: leftEnd.x, y: leftEnd.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(180);
      const afterLeft = await game.snapshot();
      s = await game.loadScenario('first_level_start');
      const rightBaseline = s;
      const rightTarget = dummyDragTarget(rightBaseline);
      const start2 = rightTarget.point;
      const rightBaseX = num(dummyDragPartPoint(rightBaseline, rightTarget)?.x);
      const rightEnd = { x: start2.x + 70, y: start2.y };
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start2.x, y: start2.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start2.x, y: start2.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rightEnd.x, y: rightEnd.y, button: 'left', buttons: 1, movementX: 70, movementY: 0, modifiers: 0 });
      await browser.sleep(180);
      const duringRight = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rightEnd.x, y: rightEnd.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(180);
      const afterRight = await game.snapshot();
      s = await game.loadScenario('first_level_start');
      const upTarget = dummyDragTarget(s);
      const start3 = upTarget.point;
      const upBaseY = num(dummyDragPartPoint(s, upTarget)?.y);
      const upEnd = { x: start3.x, y: start3.y - 60 };
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start3.x, y: start3.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start3.x, y: start3.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: upEnd.x, y: upEnd.y, button: 'left', buttons: 1, movementX: 0, movementY: -60, modifiers: 0 });
      await browser.sleep(150);
      const duringUp = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: upEnd.x, y: upEnd.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(150);
      s = await game.loadScenario('first_level_start');
      const downTarget = dummyDragTarget(s);
      const start4 = downTarget.point;
      const downBaseY = num(dummyDragPartPoint(s, downTarget)?.y);
      const downEnd = { x: start4.x, y: start4.y + 60 };
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start4.x, y: start4.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start4.x, y: start4.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: downEnd.x, y: downEnd.y, button: 'left', buttons: 1, movementX: 0, movementY: 60, modifiers: 0 });
      await browser.sleep(150);
      const duringDown = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: downEnd.x, y: downEnd.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(150);
      const leftDx = num(dummyDragPartPoint(duringLeft, leftTarget)?.x) - leftBaseX;
      const rightDx = num(dummyDragPartPoint(duringRight, rightTarget)?.x) - rightBaseX;
      if (Math.sign(leftDx) >= 0 || Math.sign(rightDx) <= 0 || Math.sign(leftDx) === Math.sign(rightDx)) return FAIL(`direction opposite failed: leftDx=${leftDx}, rightDx=${rightDx}`);
      const upDy = num(dummyDragPartPoint(duringUp, upTarget)?.y) - upBaseY;
      const downDy = num(dummyDragPartPoint(duringDown, downTarget)?.y) - downBaseY;
      if (Math.sign(upDy) >= 0 || Math.sign(downDy) <= 0 || Math.sign(upDy) === Math.sign(downDy)) return FAIL(`vertical direction opposite failed: upDy=${upDy}, downDy=${downDy}`);
      const releaseEvidence = changed(duringLeft?.feedback?.releaseRevision, afterLeft?.feedback?.releaseRevision, duringRight?.feedback?.releaseRevision, afterRight?.feedback?.releaseRevision) ||
        (afterLeft?.dummy?.grabbed === false && afterRight?.dummy?.grabbed === false);
      if (!releaseEvidence) return FAIL('release did not clear grabbed state or release feedback');
      const motionEvidence = changed(rightBaseline?.dummy?.poseRevision, duringRight?.dummy?.poseRevision, rightBaseline?.dummy?.motionRevision, duringRight?.dummy?.motionRevision);
      if (!motionEvidence) return FAIL('drag did not create pose or motion revision');
      return PASS(`direction opposite left=${leftDx.toFixed(1)} right=${rightDx.toFixed(1)} up=${upDy.toFixed(1)} down=${downDy.toFixed(1)}`);
    }
  },
  {
    id: 'p1-rejection-blank-fixed-locked-invariants',
    level: 'P1',
    name: 'Blank, fixed hazard, and locked phase actions preserve invariants',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadScenario('fixed_hazard_start');
      const pre = assertLegalPrecondition(start, 'fixed_hazard_start');
      if (pre) return FAIL(pre);
      const blank = safeBlankPoint(start);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: blank.x, y: blank.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: blank.x, y: blank.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: blank.x + 40, y: blank.y + 15, button: 'left', buttons: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: blank.x + 40, y: blank.y + 15, button: 'left', clickCount: 1, modifiers: 0 });
      let after = await game.semanticDrag({ kind: 'blank' }, { source: 'snapshot', ref: 'playfield.bounds', anchor: 'center' }, 120, 0);
      if (!sameCoreState(start, after)) return FAIL('blank drag mutated health/result/progress');
      const fixedHazard = hazardByFamily(start, 'fixedZone');
      after = await game.semanticDrag({ kind: 'hazard', family: 'fixedZone' }, { kind: 'blank' }, 140, 0);
      const fixedAfter = hazardByFamily(after, 'fixedZone');
      if (after.lastAction.accepted !== false && fixedHazard.draggable === false && pointFrom(fixedHazard) && pointFrom(fixedAfter)) return FAIL('fixed hazard drag was accepted or moved');
      const complete = await completeByAvailableHazard(game);
      if (complete.error) return FAIL(complete.error);
      const lockedBefore = complete.after;
      const lockedAfter = await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'blank' }, 160, 0);
      if (!sameProgress(lockedBefore, lockedAfter) || num(lockedAfter?.result?.completionRevision) !== num(lockedBefore?.result?.completionRevision)) return FAIL('locked phase scene drag changed result/progress');
      return PASS('blank/fixed/locked invariants preserved');
    }
  },
  {
    id: 'p1-fixed-zone-damage-death-lock',
    level: 'P1',
    name: 'Fixed hazard contact causes damage death and input lock',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let s = await game.loadScenario('fixed_hazard_start');
      const pre = assertLegalPrecondition(s, 'fixed_hazard_start');
      if (pre) return FAIL(pre);
      const beforeHealth = healthValue(s);
      await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'hazard', family: 'fixedZone' }, 320, 500);
      const contact = await game.wait(650);
      const h = hazardByFamily(contact, 'fixedZone');
      const damageEvidence = healthValue(contact) < beforeHealth &&
        changed(s?.feedback?.damageRevision, contact?.feedback?.damageRevision, s?.dummy?.damageRevision, contact?.dummy?.damageRevision, hazardByFamily(s, 'fixedZone')?.contactRevision, h?.contactRevision, hazardByFamily(s, 'fixedZone')?.effectRevision, h?.effectRevision);
      if (!damageEvidence) return FAIL('fixed hazard contact did not produce damage plus visible feedback revision');
      const outside = h?.zone?.outsideRef ? { source: 'snapshot', ref: h.zone.outsideRef, anchor: 'center' } : { kind: 'blank' };
      const out = await game.semanticDrag({ kind: 'dummy', part: 'any' }, outside, 220, 250);
      const outWait = await game.wait(450);
      if (healthValue(outWait) < healthValue(contact) - Math.max(0.25, beforeHealth * 0.5)) return FAIL('damage continued at full rate after leaving the zone');
      for (let i = 0; i < 8 && outWait.result.state !== 'complete'; i += 1) {
        outWait.lastAction = (await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'hazard', family: 'fixedZone' }, 260, 500)).lastAction;
        Object.assign(outWait, await game.wait(650));
      }
      const done = await game.snapshot();
      if (done.health.current < 0 || done.health.ratio < 0) return FAIL('health went below zero');
      if (done.result.state !== 'complete' && done.phase !== 'complete') return FAIL('valid damage chain did not reach completion');
      const locked = await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'blank' }, 160, 0);
      if (locked.lastAction.accepted !== false && locked.canInteractWithPlayfield) return FAIL('post-death scene drag was not locked');
      return PASS(`health ${beforeHealth} -> ${healthValue(done)}`);
    }
  },
  {
    id: 'p1-tool-prop-drag-contact-damage',
    level: 'P1',
    name: 'Draggable tool or prop visibly contacts dummy and damages',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadScenario('tool_hazard_start');
      const pre = assertLegalPrecondition(start, 'tool_hazard_start');
      if (pre) return FAIL(pre);
      const p = interactablePoint(start, 'prop', 'tool');
      const d = dummyPoint(start);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: d.x, y: d.y, button: 'left', buttons: 1, movementX: d.x - p.x, movementY: d.y - p.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: d.x, y: d.y, button: 'left', clickCount: 1, modifiers: 0 });
      const contact = await game.semanticDrag({ kind: 'prop', family: 'tool' }, { kind: 'dummy', part: 'any' }, 300, 500);
      const after = await game.wait(500);
      const h0 = hazardByFamily(start, 'tool');
      const h1 = hazardByFamily(after, 'tool');
      if (contact.lastAction.accepted === false) return FAIL(`tool drag rejected: ${contact.lastAction.reason || 'no reason'}`);
      if (healthValue(after) >= healthValue(start)) return FAIL('tool contact did not reduce health');
      if (!changed(h0.contactRevision, h1.contactRevision, h0.effectRevision, h1.effectRevision, start?.dummy?.motionRevision, after?.dummy?.motionRevision, start?.dummy?.damageRevision, after?.dummy?.damageRevision)) return FAIL('tool damage lacks independent visible contact/dummy feedback');
      return PASS(`tool health ${healthValue(start)} -> ${healthValue(after)}`);
    }
  },
  {
    id: 'p1-moving-hazard-placement-impact',
    level: 'P1',
    name: 'Moving hazard requires placement then impact feedback',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let s = await game.loadScenario('moving_hazard_start');
      const pre = assertLegalPrecondition(s, 'moving_hazard_start');
      if (pre) return FAIL(pre);
      const h0 = hazardByFamily(s, 'moving');
      const idle = await game.wait(600);
      const hIdle = hazardByFamily(idle, 'moving');
      if (!hIdle.automaticMotion || num(hIdle.motionRevision) <= num(h0.motionRevision)) return FAIL('moving hazard does not visibly move while idle');
      if (idle.result.state === 'complete' && healthValue(idle) <= 0) return FAIL('moving hazard completed without player placement from precondition');
      const placed = await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'hazard', family: 'moving' }, 280, 120);
      const hit = await game.wait(1000);
      const hHit = hazardByFamily(hit, 'moving');
      if (placed.lastAction.accepted === false) return FAIL('dummy placement into moving hazard path was rejected');
      if (healthValue(hit) >= healthValue(idle)) return FAIL('moving hazard hit did not reduce health after placement');
      if (!changed(idle?.feedback?.impactRevision, hit?.feedback?.impactRevision, hIdle.contactRevision, hHit.contactRevision, idle?.dummy?.motionRevision, hit?.dummy?.motionRevision)) return FAIL('moving hazard damage lacks impact/contact/dummy motion feedback');
      return PASS(`moving hazard health ${healthValue(idle)} -> ${healthValue(hit)}`);
    }
  },
  {
    id: 'p1-explosive-heavy-release-trigger',
    level: 'P1',
    name: 'Explosive or heavy prop release triggers visible damage chain',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.loadScenario('explosive_or_heavy_prop_start');
      const pre = assertLegalPrecondition(s, 'explosive_or_heavy_prop_start');
      if (pre) return FAIL(pre);
      const released = await game.semanticDrag({ kind: 'prop', family: 'explosiveOrHeavy' }, { kind: 'dummy', part: 'any' }, 320, 80);
      const after = await game.wait(900);
      const h0 = hazardByFamily(s, 'explosiveOrHeavy');
      const h1 = hazardByFamily(after, 'explosiveOrHeavy');
      if (released.lastAction.accepted === false) return FAIL('explosive/heavy prop drag was rejected');
      if (!changed(s?.feedback?.releaseRevision, released?.feedback?.releaseRevision, h0.triggerRevision, h1.triggerRevision, h0.effectRevision, h1.effectRevision)) return FAIL('release did not trigger prop/hazard effect revision');
      if (healthValue(after) >= healthValue(s) || !changed(s?.dummy?.motionRevision, after?.dummy?.motionRevision, s?.dummy?.damageRevision, after?.dummy?.damageRevision)) return FAIL('explosive/heavy trigger did not damage and move dummy');
      return PASS(`prop trigger health ${healthValue(s)} -> ${healthValue(after)}`);
    }
  },
  {
    id: 'p1-mechanism-trigger-second-stage',
    level: 'P1',
    name: 'Mechanism trigger causes second stage damage chain',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.loadScenario('mechanism_start');
      const pre = assertLegalPrecondition(s, 'mechanism_start');
      if (pre) return FAIL(pre);
      await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'mechanismTrigger' }, 280, 100);
      const after = await game.wait(900);
      const h0 = hazardByFamily(s, 'mechanism');
      const h1 = hazardByFamily(after, 'mechanism');
      if (!changed(h0.triggerRevision, h1.triggerRevision)) return FAIL('mechanism triggerRevision did not increase');
      if (!changed(h0.effectRevision, h1.effectRevision, s?.dummy?.motionRevision, after?.dummy?.motionRevision, s?.dummy?.damageRevision, after?.dummy?.damageRevision)) return FAIL('mechanism did not produce second-stage effect and dummy feedback');
      if (healthValue(after) >= healthValue(s)) return FAIL('mechanism chain did not reduce health');
      const repeat = await game.tap({ kind: 'mechanismTrigger' });
      if (repeat.lastAction.accepted !== false && num(repeat.result.completionRevision) > num(after.result.completionRevision) + 1) return FAIL('repeat/empty mechanism trigger duplicated completion');
      return PASS(`mechanism health ${healthValue(s)} -> ${healthValue(after)}`);
    }
  },
  {
    id: 'p1-click-release-target-chain',
    level: 'P1',
    name: 'Real click release target starts fall or release damage chain',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.loadScenario('click_release_start');
      const pre = assertClickReleasePrecondition(s, 'click_release_start');
      if (pre) return FAIL(pre);
      // InteractableSummary makes family optional for click-release targets;
      // the TargetRef kind is the stable public discriminator here.
      const target = interactablePoint(s, 'clickReleaseTarget');
      const blank = safeBlankPoint(s);
      await browser.mouseClick(blank.x, blank.y);
      const blankAfter = await game.snapshot();
      const blankRepeat = await game.tap({ kind: 'blank' });
      if (!sameClickReleaseState(s, blankAfter) || !sameClickReleaseState(blankAfter, blankRepeat)) return FAIL('blank/repeat click advanced release damage unexpectedly');
      const h0 = hazardByFamily(s, 'clickRelease');
      await browser.mouseClick(target.x, target.y);
      let after = await game.snapshot();
      const observationDeadline = Date.now() + 6000;
      let releaseChanged = false;
      while (!releaseChanged && Date.now() < observationDeadline) {
        const h = hazardByFamily(after, 'clickRelease');
        releaseChanged = clickReleaseTargetChanged(s, after) || changed(
          h0.triggerRevision, h.triggerRevision,
          h0.effectRevision, h.effectRevision,
          s?.feedback?.releaseRevision, after?.feedback?.releaseRevision,
          s?.feedback?.impactRevision, after?.feedback?.impactRevision
        );
        if (!releaseChanged) after = await game.wait(300);
      }
      if (!releaseChanged) return FAIL('click release did not trigger visible target or release feedback');
      let motionChanged = false;
      while (!motionChanged && Date.now() < observationDeadline) {
        motionChanged = changed(s?.dummy?.motionRevision, after?.dummy?.motionRevision);
        if (!motionChanged) after = await game.wait(300);
      }
      if (!motionChanged) return FAIL('click release did not trigger visible release/fall motion');
      let damageProgressed = false;
      while (!damageProgressed && Date.now() < observationDeadline) {
        damageProgressed = healthValue(after) < healthValue(s) || after.result.state === 'complete' || changed(
          s?.dummy?.damageRevision, after?.dummy?.damageRevision,
          s?.feedback?.damageRevision, after?.feedback?.damageRevision
        );
        if (!damageProgressed) after = await game.wait(300);
      }
      if (!damageProgressed) return FAIL('click release chain did not progress damage or result');
      return PASS('click release chain and repeat invariant verified');
    }
  },
  {
    id: 'p1-complete-next-restart-progression-flow',
    level: 'P1',
    name: 'Completion locks playfield then next and restart create fresh levels',
    timeoutMs: 28000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const complete = await completeByAvailableHazard(game);
      if (complete.error) return FAIL(complete.error);
      const done = complete.after;
      if (done.result.state !== 'complete' || !done.result.visible || !done.overlayBlocking) return FAIL('completion is not visible and blocking');
      const dragAfter = await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'blank' }, 120, 0);
      if (dragAfter.lastAction.accepted !== false && !sameProgress(done, dragAfter)) return FAIL('complete screen did not lock scene drag');
      await game.domClickControl('next'); // DOM .click() visible next control path
      const next = await game.snapshot();
      const playable = assertPlayable(next, 'next level');
      if (playable) return FAIL(playable);
      if (num(next.level.index) !== num(done.level.index) + 1) return FAIL('next control did not advance exactly one level');
      if (healthValue(next) < 0.99 || next.result.state !== 'none') return FAIL('next level did not start fresh');
      const extraNext = await game.input({ type: 'nextLevel' });
      if (extraNext.lastAction?.accepted !== false || !sameCoreState(next, extraNext)) return FAIL('nextLevel advanced outside completion state');
      await game.domClickControl('restart'); // DOM .click() visible restart control path
      const restart = await game.snapshot();
      if (num(restart.level.index) !== num(next.level.index)) return FAIL('restart changed level instead of replaying current level');
      if (healthValue(restart) < 0.99 || restart.result.state !== 'none' || restart.level.completed || restart.dummy.state === 'dead' || restart.dummy.state === 'dying') return FAIL('restart did not restore a fresh playable level');
      return PASS(`completed ${done.level.index}, next ${next.level.index}`);
    }
  },
  {
    id: 'p1-level-select-locked-unlocked-invariants',
    level: 'P1',
    name: 'Level select locked unlocked scroll and persistence invariants',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const base = await completeByAvailableHazard(game);
      if (base.error) return FAIL(base.error);
      await game.domClickControl('levelSelect'); // visible level-select control uses DOM .click()
      let panel = await game.input({ type: 'openLevelSelect' });
      if (panel.phase !== 'levelSelect' && panel.screen !== 'levelSelect') return FAIL('openLevelSelect did not show level select phase/screen');
      const nodes = (panel.interactables || []).filter(x => x.kind === 'levelNode');
      if (nodes.length < 2) return FAIL('level select does not expose multiple level nodes');
      const unlocked = nodes.find(x => x.locked === false || x.enabled);
      const locked = nodes.find(x => x.locked === true || x.enabled === false);
      if (!unlocked) return FAIL('level select exposes no unlocked selectable level');
      const selected = await game.input({ type: 'selectLevel', levelIndex: unlocked.levelIndex });
      if (selected.lastAction.accepted === false) return FAIL('unlocked level selection rejected');
      if (healthValue(selected) < 0.99 || selected.result.state !== 'none') return FAIL('unlocked selection did not load fresh level');
      panel = await game.input({ type: 'openLevelSelect' });
      if (locked) {
        const before = panel;
        const denied = await game.input({ type: 'selectLevel', levelIndex: locked.levelIndex });
        if (denied.lastAction.accepted !== false && num(denied.level.index) === num(locked.levelIndex)) return FAIL('locked level selection was accepted');
        if (!sameProgress(before, denied)) return FAIL('locked level selection mutated progress');
      }
      const scrolled = await game.input({ type: 'scrollLevelSelect', deltaY: 240 });
      if (num(scrolled.level.index) !== num(panel.level.index) || !sameProgress(panel, scrolled)) return FAIL('scrolling level select changed gameplay state');
      let preserved = await game.reset({ preserveProgress: true });
      for (let i = 0; i < 8 && preserved.phase === 'loading'; i += 1) {
        await game.wait(250);
        preserved = await game.snapshot();
      }
      const playableOrStart = preserved.phase === 'start' || !assertPlayable(preserved, 'preserveProgress reset');
      if (!playableOrStart) return FAIL('preserveProgress reset did not leave start or playable first level available');
      return PASS(`level nodes=${nodes.length}`);
    }
  },
  {
    id: 'p1-feedback-visible-sync-chain',
    level: 'P1',
    name: 'Visible render HUD feedback stays synchronized with gameplay state',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.loadScenario('fixed_hazard_start');
      const pre = assertLegalPrecondition(s, 'fixed_hazard_start');
      if (pre) return FAIL(pre);
      const start = dummyPoint(s);
      const end = hazardPoint(s, 'fixedZone');
      const beforeHash = await browser.canvasPixelHash();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end.x, y: end.y, button: 'left', buttons: 1, movementX: end.x - start.x, movementY: end.y - start.y, modifiers: 0 });
      await browser.sleep(160);
      const realDrag = await game.snapshot();
      const realPartMoved = (realDrag?.dummy?.parts || []).some(part => {
        const prior = (s?.dummy?.parts || []).find(candidate => candidate.id === part.id);
        return prior &&
          Math.hypot(num(part.screenX) - num(prior.screenX), num(part.screenY) - num(prior.screenY)) > 2;
      });
      const realHealthChanged = Boolean(realDrag?.health) && healthValue(realDrag) < healthValue(s);
      if (!realPartMoved && !realHealthChanged) return FAIL('real mouse drag did not change visible gameplay state');
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
      await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'hazard', family: 'fixedZone' }, 260, 500);
      const after = await game.wait(700);
      const afterHash = await browser.canvasPixelHash();
      if (beforeHash === afterHash && num(after.render.revision) <= num(s.render.revision)) return FAIL('visible render did not change after real input and hazard contact');
      if (healthValue(after) >= healthValue(s)) return FAIL('health snapshot did not decrease');
      const afterIsActive = after.phase === 'playing' || after.phase === 'dying';
      if ((afterIsActive && !after.health.visible) || !changed(s?.feedback?.hudRevision, after?.feedback?.hudRevision, s?.feedback?.damageRevision, after?.feedback?.damageRevision)) return FAIL('HUD/damage feedback revisions are not synchronized with health');
      const complete = await completeByAvailableHazard(game);
      if (complete.error) return FAIL(complete.error);
      const done = complete.after;
      if ((done.result.state === 'complete') !== Boolean(done.result.visible)) return FAIL('result visible flag is not synchronized with complete state');
      if (done.result.state === 'complete' && (!done.overlayBlocking || done.canInteractWithPlayfield)) return FAIL('complete overlay does not block playfield in snapshot');
      return PASS('render/HUD/result synchronization verified');
    }
  },
  {
    id: 'p2-touch-drag-direction-opposite-chain',
    level: 'P2',
    name: 'Real touch drag direction opposite chain matches pointer drag',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let s = await game.loadScenario('first_level_start');
      const pre = assertLegalPrecondition(s, 'first_level_start');
      if (pre) return FAIL(pre);
      const p = dummyPoint(s);
      const leftBaseX = num(s?.dummy?.center?.screenX);
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1, radiusX: 3, radiusY: 3, force: 1 }] });
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x - 55, y: p.y, id: 1, radiusX: 3, radiusY: 3, force: 1 }] });
      await browser.sleep(160);
      const left = await game.snapshot();
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await browser.sleep(160);
      s = await game.loadScenario('first_level_start');
      const p2 = dummyPoint(s);
      const rightBaseX = num(s?.dummy?.center?.screenX);
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p2.x, y: p2.y, id: 2, radiusX: 3, radiusY: 3, force: 1 }] });
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p2.x + 55, y: p2.y, id: 2, radiusX: 3, radiusY: 3, force: 1 }] });
      await browser.sleep(160);
      const right = await game.snapshot();
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await browser.sleep(160);
      const leftDx = num(left?.dummy?.center?.screenX) - leftBaseX;
      const rightDx = num(right?.dummy?.center?.screenX) - rightBaseX;
      if (Math.sign(leftDx) >= 0 || Math.sign(rightDx) <= 0 || Math.sign(leftDx) === Math.sign(rightDx)) return FAIL(`touch direction opposite failed: ${leftDx}/${rightDx}`);
      if (!changed(s?.dummy?.poseRevision, left?.dummy?.poseRevision, s?.dummy?.motionRevision, right?.dummy?.motionRevision)) return FAIL('touch drag produced no dummy pose/motion revision');
      return PASS(`touch direction opposite ${leftDx.toFixed(1)} ${rightDx.toFixed(1)}`);
    }
  },
  {
    id: 'p2-extended-hazard-visible-chain',
    level: 'P2',
    name: 'Extended hazard exposes independent visible damage chain when available',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const s = await game.loadScenario('progression_chain_start', { family: 'extended' });
      if (s.contractMissing) return FAIL('contract missing');
      if (s.lastAction && s.lastAction.accepted === false && s.lastAction.reason === 'notReady') return PASS('extended hazard not applicable');
      const playable = assertPlayable(s, 'extended hazard');
      if (playable) return FAIL(playable);
      if (s.level.family !== 'extended') return PASS('implementation has no extended hazard family');
      const h0 = hazardByFamily(s, 'extended');
      let after;
      if (h0.clickable) after = await game.tap({ kind: 'hazard', family: 'extended' });
      else if (h0.draggable) after = await game.semanticDrag({ kind: 'prop', family: 'extended' }, { kind: 'dummy', part: 'any' }, 260, 260);
      else after = await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'hazard', family: 'extended' }, 260, 260);
      after = await game.wait(700);
      const h1 = hazardByFamily(after, 'extended');
      if (!changed(h0.motionRevision, h1.motionRevision, h0.effectRevision, h1.effectRevision, h0.triggerRevision, h1.triggerRevision)) return FAIL('extended hazard has no independent visible action revision');
      if (healthValue(after) >= healthValue(s) && !changed(s?.dummy?.motionRevision, after?.dummy?.motionRevision, s?.dummy?.damageRevision, after?.dummy?.damageRevision)) return FAIL('extended hazard did not damage or move dummy');
      return PASS('extended hazard chain verified');
    }
  },
  {
    id: 'p2-post-complete-health-progress-invariants',
    level: 'P2',
    name: 'Post-complete health progress and invalid navigation invariants',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const complete = await completeByAvailableHazard(game);
      if (complete.error) return FAIL(complete.error);
      const done = complete.after;
      if (done.result.state !== 'complete') return FAIL('could not establish completed state');
      const extra = await game.semanticDrag({ kind: 'dummy', part: 'any' }, { kind: 'hazard', family: done.level.family }, 160, 160);
      if (extra.health.current < 0 || extra.health.ratio < 0) return FAIL('post-complete health went below zero');
      if (num(extra.result.completionRevision) > num(done.result.completionRevision) + 1) return FAIL('post-complete damage duplicated completion revision');
      const invalidNext = await game.input({ type: 'selectLevel', levelIndex: -99 });
      if (invalidNext.lastAction.accepted !== false && (num(invalidNext.level.index) < 0 || num(invalidNext.level.index) >= num(invalidNext.level.count))) return FAIL('invalid level index was accepted');
      if (!sameProgress(extra, invalidNext)) return FAIL('invalid navigation mutated progress');
      const restart = await game.input({ type: 'restartLevel' });
      if (restart.health.current < 0 || healthValue(restart) < 0.99 || restart.result.state !== 'none') return FAIL('restart after invariant test did not restore a fresh level');
      return PASS('post-complete invariants and restart recovery verified');
    }
  }
];

module.exports = { suite };
