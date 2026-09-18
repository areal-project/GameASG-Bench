'use strict';

// === GDD Coverage Map ===
// M1 level entry/reset -> p0-contract-schema-ready, p1-start-button-click-loads-playfield, p1-retry-clears-failure-state, p1-level-select-blocks-and-loads-level
// M2 slingshot aiming -> p1-aim-cancel-short-pull-invariant, p1-release-opposite-pull-launches-motion, p1-direction-opposite-horizontal-proof
// M3 continuous physics -> p1-release-opposite-pull-launches-motion, p1-direction-opposite-horizontal-proof, p1-continuous-motion-route-feedback
// M4 matching baskets -> p1-matching-basket-success-rating, p1-wrong-color-or-partial-target-rejection
// M5 multi-target completion -> p1-multitarget-selected-ball-and-progress
// M6 shots/stars -> p1-aim-cancel-short-pull-invariant, p1-release-opposite-pull-launches-motion, p1-matching-basket-success-rating
// M7 failure/retry -> p1-failure-overlay-locks-playfield, p1-retry-clears-failure-state
// M8 menu blocking -> p1-pause-overlay-blocks-shot-and-resumes, p1-level-select-blocks-and-loads-level
// M9 progression -> p1-next-level-after-success-resets-attempt, p2-route-variety-or-nonblocking-depth
// M10 feedback -> p0-boot-visible-canvas-and-hud, p1-aim-cancel-short-pull-invariant, p1-continuous-motion-route-feedback, p2-feedback-synchronizes-events
// M11 optional depth -> p2-optional-depth-nonblocking
//
// === Category Map ===
// Boot & Stability: p0-boot-visible-canvas-and-hud, p0-contract-schema-ready
// UI Flow & Blocking: p1-start-button-click-loads-playfield, p1-pause-overlay-blocks-shot-and-resumes, p1-level-select-blocks-and-loads-level
// Input Semantics: p1-aim-cancel-short-pull-invariant, p1-release-opposite-pull-launches-motion, p1-direction-opposite-horizontal-proof
// Core Mechanic Loop: p1-continuous-motion-route-feedback, p1-matching-basket-success-rating, p1-multitarget-selected-ball-and-progress
// State Machine: p1-failure-overlay-locks-playfield, p1-retry-clears-failure-state, p1-next-level-after-success-resets-attempt
// Invariants & Rejection: p1-wrong-color-or-partial-target-rejection, p2-invalid-action-and-empty-drag-invariants
// Depth / Optional Systems: p2-route-variety-or-nonblocking-depth, p2-optional-depth-nonblocking
//
// === Rationality Map ===
// p1-start-button-click-loads-playfield: M1/M8 | real action: browser.mouseClick on visible start control | independent observation: snapshot phase/playfield/HUD + canvas hash | empty-shell failure: start button shell without playable targets or visible playfield fails.
// p1-aim-cancel-short-pull-invariant: M2/M6/M10 | real action: contract hold drag plus cancel/short release | independent observation: aim feedback + shotCount/ball signature unchanged | empty-shell failure: aim state without visible guide or tap counted as shot fails.
// p1-release-opposite-pull-launches-motion: M2/M3/M6/M10 | real action: CDP drag release from ball bounds | independent observation: shot count + moving ball + launch direction opposite pull | empty-shell failure: direct score update, same-direction launch, or snapshot-only ok fails.
// p1-direction-opposite-horizontal-proof: M2/M3 | real action: two CDP drags with opposite horizontal pulls | independent observation: Math.sign launch deltas direction opposite | empty-shell failure: ignored pull sign or mirrored controls fail.
// p1-continuous-motion-route-feedback: M3/M10 | real action: valid slingshot release then repeated wait | independent observation: time-ordered position/revision changes + collision/route feedback | empty-shell failure: teleport-to-result, static ball, or frame-counter-only implementation fails.
// p1-failure-overlay-locks-playfield: M7/M8 | real action: risky valid release then drag under failed overlay | independent observation: motion before failed result + overlay blocks + invariant unchanged | empty-shell failure: direct failure setup or terminal still accepts shots fails.
// p1-retry-clears-failure-state: M7/M1/M6 | real action: retry after motion-caused failure | independent observation: playable snapshot, shotCount reset, stale result cleared | empty-shell failure: retry only hides panel while old physics/result remains fails.
// p1-matching-basket-success-rating: M4/M6/M9/M10 | real action: valid completing release | independent observation: basket occupancy/completed targets + success feedback + rating | empty-shell failure: click-to-win or success without basket/shot evidence fails.
// p1-wrong-color-or-partial-target-rejection: M4/M5 | real action: risky/partial valid release and wait | independent observation: result remains none until matching/all targets complete | empty-shell failure: any basket or first target triggers victory fails.
// p1-multitarget-selected-ball-and-progress: M5/M6 | real action: select one unresolved ball and release | independent observation: selected ball motion revision, unselected invariant, bounded progress | empty-shell failure: all targets complete after first shot or wrong ball moves fails.
// p1-pause-overlay-blocks-shot-and-resumes: M8/M6 | real action: open pause, attempt drag under overlay, resume | independent observation: overlay blocking + shot signature unchanged + later aim works | empty-shell failure: visual-only pause or permanently blocked resume fails.
// p1-level-select-blocks-and-loads-level: M8/M9 | real action: open level select, attempt playfield drag, select level | independent observation: blocking invariant + new level/reset attempt | empty-shell failure: nonfunctional level panel or stale overlay fails.
// p1-next-level-after-success-resets-attempt: M9/M1 | real action: complete level then nextLevel/select level | independent observation: level summary changes, result cleared, unresolved targets visible | empty-shell failure: one-level win screen without progression fails.
// p2-invalid-action-and-empty-drag-invariants: M2/M6/M8 | real action: malformed action and dragEmpty | independent observation: shot/progress/result signature unchanged | empty-shell failure: broad handlers mutate state on bad input fail.
// p2-route-variety-or-nonblocking-depth: M9 | real action: inspect/select route scenarios | independent observation: routeType/obstacle variety with playable preconditions | empty-shell failure: shallow one-layout clone fails P2 only.
// p2-feedback-synchronizes-events: M10 | real action: aim, launch, route contact, terminal path | independent observation: feedback revisions/HUD/result sync | empty-shell failure: hidden state changes with no visible feedback fail.
// p2-optional-depth-nonblocking: M11 | real action: optional extension open/close if exposed | independent observation: extension changes visible state or remains absent without blocking P1 | empty-shell failure: optional UI corrupting main play fails.

const PASS = detail => ({ status: 'PASS', detail });
const FAIL = detail => ({ status: 'FAIL', detail });
const NA = detail => ({ status: 'NOT_APPLICABLE', detail });

const PHASES = new Set(['boot', 'lobby', 'ready', 'aiming', 'moving', 'paused', 'levelSelect', 'success', 'failed']);
const SCREENS = new Set(['lobby', 'playing', 'pauseMenu', 'levelSelect', 'success', 'failed']);
const RESULTS = new Set(['none', 'success', 'failed', 'allComplete']);

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function n(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function bool(value) {
  return value === true;
}

function snapOf(value) {
  if (value && value.snapshot && isObject(value.snapshot)) return value.snapshot;
  return value;
}

function stable(value) {
  if (value === undefined) return null;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stable);
  const out = {};
  for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
  return out;
}

function ballCenter(ball) {
  if (!ball) return null;
  if (ball.bounds && Number.isFinite(n(ball.bounds.screenX, NaN))) {
    return {
      x: n(ball.bounds.screenX) + n(ball.bounds.width) / 2,
      y: n(ball.bounds.screenY) + n(ball.bounds.height) / 2
    };
  }
  const bx = n(ball.screenX, NaN);
  const by = n(ball.screenY, NaN);
  if (Number.isFinite(bx) && Number.isFinite(by)) return { x: bx, y: by };
  return null;
}

function boundsCenter(bounds) {
  if (!bounds) return null;
  const x = n(bounds.screenX, NaN);
  const y = n(bounds.screenY, NaN);
  const width = n(bounds.width, NaN);
  const height = n(bounds.height, NaN);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return { x: x + width / 2, y: y + height / 2 };
}

function basketCenter(basket) {
  return basket && boundsCenter(basket.bounds);
}

function basketAimPoint(basket, ball) {
  const center = basketCenter(basket);
  if (!center) return null;
  const bounds = basket && basket.bounds;
  const radius = ball && ball.bounds ? Math.max(1, n(ball.bounds.width) / 2) : 10;
  // A top-opening basket is entered from above; aiming at its visual center
  // can send a low shot into the front wall instead of through the opening.
  if (basket.openSide === 'top' && bounds) {
    return { x: center.x, y: n(bounds.screenY) - radius * 2 };
  }
  return center;
}

function pullToward(from, destination, strength = 'medium') {
  if (!from || !destination) return { dx: -1, dy: 0, strength };
  // The ball launches opposite the pull vector, so pull from the desired
  // landing point back toward the current ball position.
  return { dx: from.x - destination.x, dy: from.y - destination.y, strength };
}

function pointInsideBounds(point, bounds, padding = 0) {
  if (!point || !bounds) return false;
  const x = n(bounds.screenX, NaN);
  const y = n(bounds.screenY, NaN);
  const width = n(bounds.width, NaN);
  const height = n(bounds.height, NaN);
  return [x, y, width, height].every(Number.isFinite) &&
    point.x >= x - padding && point.x <= x + width + padding &&
    point.y >= y - padding && point.y <= y + height + padding;
}

function basketContact(snap, ballId, basketId) {
  const basket = (snap.baskets || []).find(item => item && item.id === basketId);
  if (!basket) return false;
  if (basket.occupiedByBallId === ballId) return true;
  const ball = ballById(snap, ballId);
  return !!ball && pointInsideBounds(ballCenter(ball), basket.bounds, 4);
}

function firstPlayableBall(snap) {
  return (snap.balls || []).find(ball => ball && ball.selectable && !ball.completed && ball.state !== 'moving') ||
    (snap.balls || []).find(ball => ball && !ball.completed && ball.state !== 'moving');
}

function ballById(snap, id) {
  return (snap.balls || []).find(ball => ball.id === id) || null;
}

function ballSignature(ball) {
  if (!ball) return null;
  return JSON.stringify(stable({
    id: ball.id,
    // A cancelled unresolved ball may legally be ready or settled, but its
    // position, motion, and completion state must remain unchanged.
    state: ball.state === 'ready' || ball.state === 'settled' ? 'interactive' : ball.state,
    completed: ball.completed,
    moving: ball.moving,
    selectable: ball.selectable,
    screenX: Math.round(n(ball.screenX) * 10) / 10,
    screenY: Math.round(n(ball.screenY) * 10) / 10
  }));
}

function attemptSignature(snap) {
  return JSON.stringify(stable({
    phase: snap.phase,
    screen: snap.screen,
    result: snap.result,
    overlay: snap.overlay,
    canInteractWithPlayfield: snap.canInteractWithPlayfield,
    shotCount: snap.shotCount,
    level: snap.level,
    balls: (snap.balls || []).map(ball => ({
      id: ball.id,
      state: ball.state,
      completed: ball.completed,
      moving: ball.moving,
      motionRevision: n(ball.motionRevision)
    })),
    baskets: (snap.baskets || []).map(basket => ({
      id: basket.id,
      completed: basket.completed,
      occupiedByBallId: basket.occupiedByBallId || null
    }))
  }));
}

function validateSnapshot(snap) {
  if (!isObject(snap)) return 'snapshot is not an object';
  if (!PHASES.has(snap.phase)) return `invalid phase ${snap.phase}`;
  if (!SCREENS.has(snap.screen)) return `invalid screen ${snap.screen}`;
  if (!RESULTS.has(snap.result)) return `invalid result ${snap.result}`;
  if (!isObject(snap.overlay)) return 'missing overlay object';
  if (typeof snap.overlay.blocksPlayfield !== 'boolean') return 'overlay.blocksPlayfield must be boolean';
  if (!isObject(snap.level)) return 'missing level summary';
  if (!Number.isFinite(n(snap.level.targetCount, NaN))) return 'level.targetCount must be numeric';
  if (!Number.isFinite(n(snap.level.completedTargetCount, NaN))) return 'level.completedTargetCount must be numeric';
  if (!Number.isFinite(n(snap.shotCount, NaN))) return 'shotCount must be numeric';
  if (!isObject(snap.playfield) || !isObject(snap.playfield.bounds)) return 'missing playfield bounds';
  if (snap.playfield.visualReady !== true) return 'playfield.visualReady must be true when playable';
  if (!Array.isArray(snap.balls)) return 'balls must be an array';
  if (!Array.isArray(snap.baskets)) return 'baskets must be an array';
  if (!Array.isArray(snap.obstacles)) return 'obstacles must be an array';
  if (!isObject(snap.feedback)) return 'missing feedback summary';
  if (!isObject(snap.controls)) return 'missing controls summary';
  if (!isObject(snap.revision)) return 'missing revision summary';
  return null;
}

function requirePlayablePrecondition(snap, name) {
  const err = validateSnapshot(snap);
  if (err) return err;
  if (snap.result !== 'none') return `${name} preloaded terminal result`;
  if (snap.overlay && snap.overlay.blocksPlayfield && name !== 'fresh_boot') return `${name} starts with blocking overlay`;
  if (n(snap.level.targetCount) <= 0) return `${name} has no targets`;
  if (!firstPlayableBall(snap)) return `${name} has no unresolved selectable ball`;
  if (!snap.baskets.length) return `${name} has no baskets`;
  if (n(snap.level.completedTargetCount) !== 0 && name !== 'near_completion_start') return `${name} pre-completed targets`;
  return null;
}

function shotDelta(before, after) {
  return n(after.shotCount) - n(before.shotCount);
}

function posDelta(beforeBall, afterBall) {
  const a = ballCenter(beforeBall);
  const b = ballCenter(afterBall);
  if (!a || !b) return null;
  return { dx: b.x - a.x, dy: b.y - a.y, dist: Math.hypot(b.x - a.x, b.y - a.y) };
}

function directionFromDelta(delta) {
  if (!delta) return { horizontal: 'none', vertical: 'none' };
  return {
    horizontal: Math.abs(delta.dx) < 0.5 ? 'none' : (delta.dx > 0 ? 'right' : 'left'),
    vertical: Math.abs(delta.dy) < 0.5 ? 'none' : (delta.dy > 0 ? 'down' : 'up')
  };
}

function directionOppositeToPull(pull, observed) {
  if (Math.abs(pull.dx || 0) >= Math.abs(pull.dy || 0)) {
    const expected = pull.dx < 0 ? 'right' : pull.dx > 0 ? 'left' : 'none';
    return observed.horizontal === expected;
  }
  const expected = pull.dy < 0 ? 'down' : pull.dy > 0 ? 'up' : 'none';
  return observed.vertical === expected;
}

function completionCount(snap) {
  return n(snap.level && snap.level.completedTargetCount);
}

function feedbackRevision(snap) {
  const f = snap.feedback || {};
  return n(f.launchFeedbackRevision) + n(f.collisionFeedbackRevision) + n(f.basketFeedbackRevision) +
    (f.aimingGuideVisible ? 1 : 0) + (f.successFeedbackVisible ? 1 : 0) + (f.failureFeedbackVisible ? 1 : 0) +
    n(snap.revision && snap.revision.playfield) + n(snap.revision && snap.revision.ui);
}

function createGameDriver(browser) {
  async function evalPage(expr) {
    const result = await browser.eval(expr);
    if (result && result.__l2_err__) throw new Error(result.__l2_err__);
    return result;
  }

  async function contractCall(method, args) {
    const value = await evalPage(`(async function(){
      const gt = window.__gameTest;
      if (!gt || typeof gt.${method} !== 'function') return { __missing__: '${method}' };
      const result = gt.${method}.apply(gt, ${JSON.stringify(args || [])});
      return await Promise.resolve(result);
    })()`);
    if (value && value.__missing__) throw new Error(`missing __gameTest.${method}`);
    return value;
  }

  async function snapshot() {
    return snapOf(await contractCall('getSnapshot'));
  }

  async function reset(options) {
    const result = snapOf(await contractCall('reset', options ? [options] : []));
    // reset() changes the public state synchronously, while the visible DOM
    // may update on the next render frame.  UI checks must observe that frame.
    await browser.sleep(80);
    return result;
  }

  async function input(action) {
    return snapOf(await contractCall('input', [action]));
  }

  async function loadScenario(name) {
    return snapOf(await contractCall('loadScenario', [name]));
  }

  async function wait(ms = 300, until) {
    await input({ type: 'wait', durationMs: ms, until });
    await browser.sleep(Math.min(Math.max(ms, 80), 900));
    return await snapshot();
  }

  async function loadPlayableScenario(names) {
    const list = Array.isArray(names) ? names : [names];
    let lastError = '';
    for (const name of list) {
      const result = snapOf(await contractCall('loadScenario', [name]));
      if (result && result.ok === false) {
        lastError = `${name}: ${result.reason || 'not available'}`;
        continue;
      }
      const snap = snapOf(result);
      const err = requirePlayablePrecondition(snap, name);
      if (!err) return { name, snap };
      lastError = err;
    }
    throw new Error(`no legal scenario from ${list.join(', ')} (${lastError})`);
  }

  async function cdpDrag(start, end, steps = 5) {
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        button: 'left',
        modifiers: 0
      });
      await browser.sleep(35);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
  }

  async function realDragBall(ball, pull, release = true) {
    const current = await snapshot();
    const currentBall = ballById(current, ball && ball.id) || ball;
    const center = ballCenter(currentBall);
    if (!center) throw new Error('selected ball has no screen center');
    const requestedDistance = Number(pull.distance);
    const strength = Number.isFinite(requestedDistance) ? Math.max(1, Math.min(130, requestedDistance)) :
      pull.strength === 'long' ? 110 : pull.strength === 'short' ? 6 : 70;
    const mag = Math.hypot(pull.dx || 0, pull.dy || 0) || 1;
    const logicalEnd = {
      x: center.x + (pull.dx || 0) / mag * strength,
      y: center.y + (pull.dy || 0) / mag * strength
    };
    const start = await toBrowserPoint(center, current);
    const end = await toBrowserPoint(logicalEnd, current);
    if (release) {
      await cdpDrag(start, end, 5);
    } else {
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end.x, y: end.y, button: 'left', modifiers: 0 });
    }
  }

  async function realReleaseAt(point) {
    const current = await snapshot();
    const target = await toBrowserPoint(point, current);
    // A cancel gesture returns the pointer to the selected ball before
    // release; releasing at the old pull endpoint is a valid launch.
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y, button: 'left', modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1, modifiers: 0 });
  }

  async function canvasGeometry() {
    return await evalPage(`(function(){
      const canvases = Array.from(document.querySelectorAll('canvas'));
      let best = null;
      let area = -1;
      for (const canvas of canvases) {
        const rect = canvas.getBoundingClientRect();
        const nextArea = Math.max(0, rect.width) * Math.max(0, rect.height);
        if (nextArea > area) { area = nextArea; best = { canvas, rect }; }
      }
      if (!best) return null;
      return {
        x: best.rect.left,
        y: best.rect.top,
        width: best.rect.width,
        height: best.rect.height,
        attrWidth: best.canvas.width,
        attrHeight: best.canvas.height
      };
    })()`);
  }

  function inside(point, rect, padding = 0) {
    return !!rect && point.x >= rect.x - padding && point.x <= rect.x + rect.width + padding &&
      point.y >= rect.y - padding && point.y <= rect.y + rect.height + padding;
  }

  async function toBrowserPoint(point, snap) {
    if (!point) return point;
    const geometry = await canvasGeometry();
    if (!geometry || geometry.width <= 0 || geometry.height <= 0) return point;
    const pf = snap && snap.playfield && snap.playfield.bounds;
    const raw = { x: n(point.x), y: n(point.y) };
    // A compliant implementation may already expose viewport coordinates.
    // Detect that case from the public playfield bounds instead of assuming a
    // fixed canvas origin or size.
    const pfViewport = pf &&
      n(pf.screenX, NaN) >= geometry.x - 8 &&
      n(pf.screenY, NaN) >= geometry.y - 8 &&
      n(pf.screenX, NaN) + n(pf.width) <= geometry.x + geometry.width + 8 &&
      n(pf.screenY, NaN) + n(pf.height) <= geometry.y + geometry.height + 8 &&
      Math.abs(n(pf.width) - geometry.width) <= Math.max(12, geometry.width * 0.12);
    if (pfViewport && inside(raw, geometry, 6)) return raw;
    if (!pf && inside(raw, geometry, 6)) return raw;

    // Some canvas games report their player-visible geometry in logical
    // canvas units. Map those units through the actual responsive canvas
    // rect, preserving the full-stretch path for ordinary buffers while
    // accounting for a centered aspect-fit surface when the live buffer
    // tracks the viewport aspect instead.
    const pfWidth = pf ? n(pf.width, NaN) : NaN;
    const pfHeight = pf ? n(pf.height, NaN) : NaN;
    const pfOriginX = pf && Number.isFinite(n(pf.screenX, NaN)) ? n(pf.screenX) : 0;
    const pfOriginY = pf && Number.isFinite(n(pf.screenY, NaN)) ? n(pf.screenY) : 0;
    const bufferAspect = geometry.attrWidth > 0 && geometry.attrHeight > 0
      ? geometry.attrWidth / geometry.attrHeight
      : NaN;
    // Some snapshots expose only a gameplay sub-rectangle (for example,
    // below a HUD) while object screen coordinates remain in the full canvas
    // frame. If restoring the reported origin also restores the live canvas
    // aspect, use that full frame instead of subtracting the sub-rectangle's
    // origin from every object coordinate.
    const fullLogicalWidth = Number.isFinite(pfWidth) && pfWidth > 0
      ? pfWidth + Math.max(0, pfOriginX) : NaN;
    const fullLogicalHeight = Number.isFinite(pfHeight) && pfHeight > 0
      ? pfHeight + Math.max(0, pfOriginY) : NaN;
    const fullLogicalAspect = Number.isFinite(fullLogicalWidth) && fullLogicalHeight > 0
      ? fullLogicalWidth / fullLogicalHeight : NaN;
    const playfieldUsesFullCanvasFrame = !!pf && (pfOriginX > 0 || pfOriginY > 0) &&
      Number.isFinite(bufferAspect) && Number.isFinite(fullLogicalAspect) &&
      Math.abs(bufferAspect - fullLogicalAspect) <= Math.max(0.04, fullLogicalAspect * 0.08);
    const logicalOriginX = playfieldUsesFullCanvasFrame ? 0 : pfOriginX;
    const logicalOriginY = playfieldUsesFullCanvasFrame ? 0 : pfOriginY;
    const logicalWidth = playfieldUsesFullCanvasFrame ? fullLogicalWidth :
      Number.isFinite(pfWidth) && pfWidth > 0 ? pfWidth : n(geometry.attrWidth, geometry.width);
    const logicalHeight = playfieldUsesFullCanvasFrame ? fullLogicalHeight :
      Number.isFinite(pfHeight) && pfHeight > 0 ? pfHeight : n(geometry.attrHeight, geometry.height);
    const logicalAspect = logicalWidth / Math.max(1, logicalHeight);
    const geometryAspect = geometry.width / Math.max(1, geometry.height);
    const bufferTracksViewport = Number.isFinite(bufferAspect) &&
      Math.abs(bufferAspect - geometryAspect) <= Math.max(0.04, geometryAspect * 0.08);
    const logicalDiffersFromBuffer = Number.isFinite(bufferAspect) &&
      Math.abs(bufferAspect - logicalAspect) > Math.max(0.04, logicalAspect * 0.08);
    const logicalPoint = {
      x: raw.x - logicalOriginX,
      y: raw.y - logicalOriginY
    };
    if (bufferTracksViewport && logicalDiffersFromBuffer) {
      const scale = Math.min(
        geometry.width / Math.max(1, logicalWidth),
        geometry.height / Math.max(1, logicalHeight)
      );
      const offsetX = (geometry.width - logicalWidth * scale) / 2;
      const offsetY = (geometry.height - logicalHeight * scale) / 2;
      return {
        x: geometry.x + offsetX + logicalPoint.x * scale,
        y: geometry.y + offsetY + logicalPoint.y * scale
      };
    }
    return {
      x: geometry.x + logicalPoint.x / Math.max(1, logicalWidth) * geometry.width,
      y: geometry.y + logicalPoint.y / Math.max(1, logicalHeight) * geometry.height
    };
  }

  async function clickControl(names) {
    async function findControl() {
      return await evalPage(`(function(){
        const wanted = ${JSON.stringify(names.map(s => String(s).toLowerCase()))};
        const els = Array.from(document.querySelectorAll('button,[role="button"],a,input[type="button"],input[type="submit"]'));
        function label(el) {
          return [
            el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-game-control'),
            el.getAttribute('data-action'), el.name, el.value, el.textContent
          ].filter(Boolean).join(' ').toLowerCase();
        }
        let hiddenMatch = false;
        for (const el of els) {
          const text = label(el);
          if (!wanted.some(w => text.includes(w))) continue;
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect.width < 4 || rect.height < 4 || style.visibility === 'hidden' || style.display === 'none') {
            hiddenMatch = true;
            continue;
          }
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, text };
        }
        if (hiddenMatch) return { hidden: true };
        return null;
      })()`);
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const hit = await findControl();
      if (!hit) {
        if (attempt === 2) return null;
      } else if (!hit.hidden) {
        await browser.mouseClick(hit.x, hit.y);
        await browser.sleep(250);
        return true;
      } else if (attempt === 2) {
        return false;
      }
      await browser.sleep(120);
    }
    return false;
  }

  async function pageEvidence() {
    return await evalPage(`(function(){
      const canvases = Array.from(document.querySelectorAll('canvas'));
      let best = null, area = -1;
      for (const c of canvases) {
        const r = c.getBoundingClientRect();
        const a = Math.max(0, r.width) * Math.max(0, r.height);
        if (a > area) { area = a; best = c; }
      }
      const rect = best ? best.getBoundingClientRect() : null;
      return {
        canvas: rect ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : null,
        text: document.body ? document.body.innerText.slice(0, 3000) : '',
        l2: window.__l2 ? {
          frameCount: window.__l2.frameCount,
          drawCalls: window.__l2.drawCalls,
          mouseListeners: window.__l2.mouseListeners,
          keyListeners: window.__l2.keyListeners
        } : null
      };
    })()`);
  }

  return {
    browser,
    evalPage,
    contractCall,
    snapshot,
    reset,
    input,
    wait,
    loadScenario,
    loadPlayableScenario,
    realDragBall,
    realReleaseAt,
    clickControl,
    pageEvidence
  };
}

async function launchWithRealDrag(game, snap, pull) {
  const ball = firstPlayableBall(snap);
  if (!ball) throw new Error('no playable ball');
  const before = await game.snapshot();
  await game.realDragBall(ball, pull, true);
  await game.browser.sleep(220);
  const after = await game.snapshot();
  await game.wait(260, 'ballMoving');
  const moving = await game.snapshot();
  return { before, after, moving, ballId: ball.id, pull };
}

const RISK_PULLS = [
  { dx: 0, dy: -1, strength: 'long' },
  { dx: -1, dy: -0.25, strength: 'long' },
  { dx: 1, dy: -0.25, strength: 'long' },
  { dx: -0.25, dy: -1, strength: 'long' },
  { dx: 0.25, dy: -1, strength: 'long' }
];

async function launchUntilFailure(game) {
  let last = null;
  for (const pull of RISK_PULLS) {
    const setup = await game.loadPlayableScenario('out_of_bounds_risk_start');
    const launched = await launchWithRealDrag(game, setup.snap, pull);
    let failed = launched.moving;
    for (let i = 0; i < 12 && failed.result !== 'failed'; i++) failed = await game.wait(350, 'levelFailed');
    last = { setup, launched, failed, pull };
    if (failed.result === 'failed' && failed.phase === 'failed') return last;
  }
  return last;
}

function scalePull(vector, distance) {
  const mag = Math.hypot(n(vector && vector.dx), n(vector && vector.dy));
  if (!mag) return { dx: -distance, dy: 0 };
  return { dx: vector.dx / mag * distance, dy: vector.dy / mag * distance };
}

function rotatePull(vector, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    dx: vector.dx * cos - vector.dy * sin,
    dy: vector.dx * sin + vector.dy * cos
  };
}

function matchingPulls(snap, ball) {
  const source = ballCenter(ball);
  const basket = (snap.baskets || []).find(item => item && item.color === ball.color && !item.completed);
  const target = basketAimPoint(basket, ball);
  if (!source || !target) return [{ dx: -1, dy: 1 }];
  const direct = pullToward(source, target);
  const directMag = Math.hypot(direct.dx, direct.dy) || 1;
  const bounds = snap && snap.playfield && snap.playfield.bounds;
  const span = bounds
    ? Math.min(n(bounds.width, directMag * 2), n(bounds.height, directMag * 2))
    : directMag * 2;
  const longDistance = Math.max(directMag * 0.75, span * 0.30);
  const openBias = basket.openSide === 'top'
    ? directMag * 0.8
    : basket.openSide === 'bottom' ? -directMag * 0.8 : 0;
  const mediumDistance = Math.min(
    longDistance,
    Math.max(directMag * 0.35, span * 0.18)
  );
  const variants = [
    { vector: { dx: direct.dx, dy: direct.dy + openBias }, distance: mediumDistance, strength: 'medium' },
    { vector: direct, distance: mediumDistance, strength: 'medium' },
    { vector: { dx: direct.dx * 0.7, dy: direct.dy + openBias * 1.35 }, distance: longDistance, strength: 'long' },
    { vector: rotatePull(direct, -Math.PI / 4), distance: longDistance, strength: 'long' },
    { vector: rotatePull(direct, Math.PI / 4), distance: longDistance, strength: 'long' },
    { vector: direct, distance: longDistance, strength: 'long' }
  ];
  return variants.map(item => ({
    ...scalePull(item.vector, item.distance),
    strength: item.strength
  }));
}

async function launchWithContractDrag(game, snap, pull) {
  const ball = firstPlayableBall(snap);
  if (!ball) throw new Error('no playable ball');
  const before = await game.snapshot();
  const actionPull = { dx: pull.dx, dy: pull.dy };
  if (pull.strength) actionPull.strength = pull.strength;
  await game.input({
    type: 'dragBall',
    ballId: ball.id,
    pull: actionPull,
    release: true
  });
  await game.browser.sleep(80);
  const after = await game.snapshot();
  await game.wait(260, 'ballMoving');
  const moving = await game.snapshot();
  return { before, after, moving, ballId: ball.id, pull };
}

async function completeMatchingTarget(game) {
  let last = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const setup = await game.loadPlayableScenario('near_completion_start');
    const ball = firstPlayableBall(setup.snap);
    const pulls = matchingPulls(setup.snap, ball);
    const launched = await launchWithContractDrag(game, setup.snap, pulls[attempt]);
    let done = launched.moving;
    for (let i = 0; i < 16 && done.result !== 'success' && done.result !== 'allComplete'; i++) done = await game.wait(300, 'levelComplete');
    last = { setup, launched, done };
    if (done.result === 'success' || done.result === 'allComplete') return last;
  }
  return last;
}

function wrongColorAimPoints(ball, basket) {
  const bounds = basket && basket.bounds;
  const center = basketCenter(basket);
  const radius = ball && ball.bounds ? Math.max(1, n(ball.bounds.width) / 2) : 10;
  if (!bounds || !center) return [basketAimPoint(basket, ball)].filter(Boolean);
  const left = n(bounds.screenX) + n(bounds.width) * 0.25;
  const right = n(bounds.screenX) + n(bounds.width) * 0.75;
  const top = basket.openSide === 'top' ? n(bounds.screenY) - radius * 2 : center.y;
  const middle = n(bounds.screenY) + n(bounds.height) * 0.45;
  return [
    basketAimPoint(basket, ball) || { x: center.x, y: top },
    { x: center.x, y: middle },
    { x: left, y: top },
    { x: right, y: top },
    { x: left, y: middle },
    { x: right, y: middle }
  ];
}

function wrongColorPulls(ball, basket) {
  const source = ballCenter(ball);
  const points = wrongColorAimPoints(ball, basket);
  if (!source || !points.length) return [{ dx: -1, dy: 0, strength: 'medium', distance: 70 }];
  const pulls = [];
  const distances = [70, 110];
  const angles = [0, -Math.PI / 8, Math.PI / 8];
  for (let pass = 0; pass < distances.length && pulls.length < 12; pass++) {
    for (let i = 0; i < points.length && pulls.length < 12; i++) {
      const direct = pullToward(source, points[i], 'medium');
      const vector = rotatePull(direct, pass === 0 ? angles[0] : angles[(i % 2) + 1]);
      pulls.push({ ...vector, strength: 'medium', distance: distances[pass] });
    }
  }
  return pulls;
}

function basketFeedbackRevisionOf(snap) {
  return n(snap && snap.feedback && snap.feedback.basketFeedbackRevision);
}

async function sampleWrongColorAttempt(game, launched, ballId, basketId) {
  let after = launched.moving;
  const baselineBasketFeedback = basketFeedbackRevisionOf(launched.before);
  const baselineCompletion = completionCount(launched.before);
  let contactSnapshot = null;
  let rejectionFeedbackSnapshot = null;
  const observe = snap => {
    if (!snap) return;
    if (!contactSnapshot && basketContact(snap, ballId, basketId)) contactSnapshot = snap;
    if (!rejectionFeedbackSnapshot && basketFeedbackRevisionOf(snap) > baselineBasketFeedback &&
        snap.result === 'none' && completionCount(snap) === baselineCompletion) {
      rejectionFeedbackSnapshot = snap;
    }
  };
  observe(after);
  for (let i = 0; i < 12 && after.phase === 'moving' && after.result === 'none'; i++) {
    after = await game.wait(120);
    observe(after);
    if (contactSnapshot || rejectionFeedbackSnapshot) break;
  }
  const evidence = contactSnapshot || rejectionFeedbackSnapshot;
  return {
    after: evidence || after,
    contactObserved: !!evidence,
    contactSnapshot,
    rejectionFeedbackObserved: !!rejectionFeedbackSnapshot
  };
}

async function exerciseWrongColor(game) {
  const setup = await game.loadPlayableScenario('wrong_color_risk_start');
  const before = setup.snap;
  const ball = firstPlayableBall(before);
  const wrong = (before.baskets || []).find(item => item && item.color !== ball.color && !item.completed);
  if (!wrong) return { setup, unsupported: true };
  const pulls = wrongColorPulls(ball, wrong);
  let last = null;
  for (const pull of pulls) {
    const fresh = await game.loadPlayableScenario('wrong_color_risk_start');
    const freshBall = firstPlayableBall(fresh.snap);
    const freshWrong = (fresh.snap.baskets || []).find(item => item && item.id === wrong.id && item.color !== freshBall.color && !item.completed);
    if (!freshBall || !freshWrong) return { setup: fresh, unsupported: true };
    const launched = await launchWithRealDrag(game, fresh.snap, pull);
    const sampled = await sampleWrongColorAttempt(game, launched, freshBall.id, freshWrong.id);
    last = { setup: fresh, launched, after: sampled.after, contactObserved: sampled.contactObserved, ballId: freshBall.id, basketId: freshWrong.id, pull };
    if (sampled.contactObserved) return last;
  }
  return last;
}

const suite = [
  {
    id: 'p0-boot-visible-canvas-and-hud',
    level: 'P0',
    name: 'Boot exposes visible play surface and runtime stability',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await browser.sleep(400);
      const info = await game.pageEvidence();
      if (!info.canvas || info.canvas.width < 120 || info.canvas.height < 120) return FAIL('no visible primary canvas/playfield');
      if (!info.l2 || info.l2.frameCount < 2 || info.l2.drawCalls < 2) return FAIL('runtime did not render multiple frames');
      if (browser.exceptions.length) return FAIL(`runtime exception: ${browser.exceptions[0].description || browser.exceptions[0].text}`);
      const hash = await browser.canvasPixelHash();
      if (hash === null) return FAIL('canvas/screenshot hash unavailable');
      return PASS(`visible canvas ${Math.round(info.canvas.width)}x${Math.round(info.canvas.height)} hash=${hash}`);
    }
  },
  {
    id: 'p0-contract-schema-ready',
    level: 'P0',
    name: 'Public contract returns coherent TDD snapshot schema',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const reset = await game.reset();
      const snap = reset && reset.phase === 'lobby' ? snapOf(await game.input({ type: 'start' })) : reset;
      await game.wait(120, 'playfieldReady');
      const ready = await game.snapshot();
      const err = validateSnapshot(ready);
      if (err) return FAIL(err);
      if (n(ready.level.targetCount) <= 0 || !ready.balls.length || !ready.baskets.length) return FAIL('ready snapshot lacks targets, balls, or baskets');
      if (!ready.feedback.hudVisible || !ready.feedback.shotCountVisible) return FAIL('HUD and shot count feedback not visible in snapshot');
      return PASS(`phase=${ready.phase}, targets=${ready.level.targetCount}, balls=${ready.balls.length}`);
    }
  },
  {
    id: 'p1-start-button-click-loads-playfield',
    level: 'P1',
    name: 'Visible start button click loads playable level',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const boot = await game.snapshot();
      if (boot.phase !== 'lobby' && boot.screen !== 'lobby') {
        return PASS('already starts in a playable state through reset contract');
      }
      const clicked = await game.clickControl(['start', 'play', 'begin']);
      if (clicked === null) {
        const info = await game.pageEvidence();
        if (!boot.controls || boot.controls.startAvailable !== true ||
            !info.canvas || info.canvas.width < 120 || info.canvas.height < 120) {
          return FAIL('lobby exposes no visible start/play/begin control for real click path');
        }
        const started = await game.input({ type: 'start' });
        if (started && started.ok === false) {
          return FAIL(`public start action rejected (${started.reason || 'unknown reason'})`);
        }
      } else if (clicked === false) {
        return FAIL('lobby exposes no visible start/play/begin control for real click path');
      }
      await game.wait(250, 'playfieldReady');
      const after = await game.snapshot();
      if (after.screen !== 'playing' || after.phase !== 'ready') return FAIL(`start did not reach ready playing state (${after.phase}/${after.screen})`);
      if (!after.canInteractWithPlayfield || after.overlay.blocksPlayfield) return FAIL('playfield is still blocked after start');
      if (!firstPlayableBall(after) || !after.baskets.length) return FAIL('start did not load unresolved ball and basket');
      const hash = await browser.canvasPixelHash();
      return PASS(`start loaded level ${after.level.id} with hash=${hash}`);
    }
  },
  {
    id: 'p1-aim-cancel-short-pull-invariant',
    level: 'P1',
    name: 'Aim feedback appears and cancel or short pull preserves shots',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario('simple_shot_start');
      const before = setup.snap;
      const ball = firstPlayableBall(before);
      await game.realDragBall(ball, { dx: -1, dy: 0, strength: 'medium' }, false);
      await browser.sleep(180);
      const aiming = await game.snapshot();
      if (aiming.phase !== 'aiming' || !aiming.aim || !aiming.aim.active) return FAIL('drag hold did not enter aiming state');
      if (!aiming.feedback.aimingGuideVisible || !aiming.aim.predictedPathVisible) return FAIL('aim guide or predicted path not visible');
      const center = ballCenter(ball);
      if (!center) return FAIL('cancel aim release requires public ball bounds/screen center');
      await game.realReleaseAt(center);
      await game.input({ type: 'cancelAim' });
      const cancelled = await game.snapshot();
      if (n(cancelled.shotCount) !== n(before.shotCount)) return FAIL('cancelled aim changed shot count');
      if (cancelled.phase !== 'ready' ||
          (cancelled.aim && cancelled.aim.active) ||
          cancelled.result !== before.result ||
          n(cancelled.level.completedTargetCount) !== n(before.level.completedTargetCount) ||
          n(cancelled.feedback.launchFeedbackRevision) !== n(before.feedback.launchFeedbackRevision)) {
        return FAIL('cancelled aim changed attempt state');
      }
      if (ballSignature(ballById(cancelled, ball.id)) !== ballSignature(ballById(before, ball.id))) return FAIL('cancelled aim changed selected ball state');
      await game.realDragBall(ball, { dx: -1, dy: 0, strength: 'short' }, true);
      await browser.sleep(180);
      const short = await game.snapshot();
      if (n(short.shotCount) !== n(before.shotCount)) return FAIL('short pull counted as a valid shot');
      return PASS('aim guide visible and cancel/short pull preserved shot invariants');
    }
  },
  {
    id: 'p1-release-opposite-pull-launches-motion',
    level: 'P1',
    name: 'Valid release launches opposite pull with one shot and motion',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario('simple_shot_start');
      const pull = { dx: -1, dy: 0, strength: 'medium' };
      const result = await launchWithRealDrag(game, setup.snap, pull);
      const beforeBall = ballById(result.before, result.ballId);
      const movingBall = ballById(result.moving, result.ballId);
      const delta = posDelta(beforeBall, movingBall);
      const observed = movingBall && movingBall.lastLaunchDirection ? movingBall.lastLaunchDirection : directionFromDelta(delta);
      if (shotDelta(result.before, result.after) !== 1) return FAIL(`valid release shot delta was ${shotDelta(result.before, result.after)}, expected 1`);
      if (!movingBall || (!movingBall.moving && movingBall.state !== 'moving' && n(movingBall.motionRevision) <= n(beforeBall && beforeBall.motionRevision))) return FAIL('released ball did not visibly enter motion');
      if (!directionOppositeToPull(pull, observed)) return FAIL(`launch direction ${JSON.stringify(observed)} was not opposite pull ${JSON.stringify(pull)}`);
      if (feedbackRevision(result.moving) <= feedbackRevision(result.before)) return FAIL('launch did not increase visible feedback/playfield revision');
      return PASS(`shot=+1 direction=${observed.horizontal}/${observed.vertical}`);
    }
  },
  {
    id: 'p1-direction-opposite-horizontal-proof',
    level: 'P1',
    name: 'Opposite horizontal pulls produce opposite visible launch trends',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const leftSetup = await game.loadPlayableScenario('simple_shot_start');
      const left = await launchWithRealDrag(game, leftSetup.snap, { dx: -1, dy: 0, strength: 'medium' });
      const leftDelta = posDelta(ballById(left.before, left.ballId), ballById(left.moving, left.ballId));
      const leftDir = ballById(left.moving, left.ballId).lastLaunchDirection || directionFromDelta(leftDelta);
      const rightSetup = await game.loadPlayableScenario('simple_shot_start');
      const right = await launchWithRealDrag(game, rightSetup.snap, { dx: 1, dy: 0, strength: 'medium' });
      const rightDelta = posDelta(ballById(right.before, right.ballId), ballById(right.moving, right.ballId));
      const rightDir = ballById(right.moving, right.ballId).lastLaunchDirection || directionFromDelta(rightDelta);
      const leftSign = leftDir.horizontal === 'right' ? 1 : leftDir.horizontal === 'left' ? -1 : Math.sign(leftDelta ? leftDelta.dx : 0);
      const rightSign = rightDir.horizontal === 'right' ? 1 : rightDir.horizontal === 'left' ? -1 : Math.sign(rightDelta ? rightDelta.dx : 0);
      if (shotDelta(left.before, left.after) !== 1 || shotDelta(right.before, right.after) !== 1) return FAIL('both opposite attempts must count exactly one valid release');
      if (!(Math.sign(leftSign) === 1 && Math.sign(rightSign) === -1)) return FAIL(`direction opposite proof failed: leftPull=${leftSign}, rightPull=${rightSign}`);
      if (left.moving.result !== 'none' || right.moving.result !== 'none') return FAIL('opposite direction proof reached terminal result before motion evidence');
      return PASS(`direction opposite: Math.sign(leftPullDelta)=${Math.sign(leftSign)}, Math.sign(rightPullDelta)=${Math.sign(rightSign)}`);
    }
  },
  {
    id: 'p1-continuous-motion-route-feedback',
    level: 'P1',
    name: 'Launched ball shows continuous motion and route feedback',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario(['ricochet_start', 'ramp_start', 'simple_shot_start']);
      const routeSnap = setup.snap;
      const hasRouteElement = routeSnap.obstacles.some(o => o.affectsMotion || o.kind === 'ramp' || o.kind === 'wall' || o.kind === 'basketWall');
      if (!hasRouteElement) return FAIL(`${setup.name} has no motion-affecting route elements`);
      const routeBall = firstPlayableBall(routeSnap);
      const routeCenter = ballCenter(routeBall);
      const field = routeSnap.playfield && routeSnap.playfield.bounds;
      const leftRoom = routeCenter && field ? routeCenter.x - n(field.screenX, NaN) : NaN;
      const rightRoom = routeCenter && field ? n(field.screenX, NaN) + n(field.width, NaN) - routeCenter.x : NaN;
      const pullDx = Number.isFinite(leftRoom) && leftRoom >= 24 ? -1 : 1;
      const availableRoom = pullDx < 0 ? leftRoom : rightRoom;
      const pullDistance = Number.isFinite(availableRoom)
        ? Math.min(110, Math.max(20, availableRoom - 4))
        : 110;
      const launched = await launchWithRealDrag(game, routeSnap, {
        dx: pullDx, dy: 0, distance: pullDistance, strength: 'long'
      });
      const releaseDelta = shotDelta(launched.before, launched.after);
      const launchFeedbackDelta = n(launched.after.feedback && launched.after.feedback.launchFeedbackRevision) -
        n(launched.before.feedback && launched.before.feedback.launchFeedbackRevision);
      const playfieldRevisionDelta = n(launched.after.revision && launched.after.revision.playfield) -
        n(launched.before.revision && launched.before.revision.playfield);
      const releaseFeedbackDelta = Math.max(launchFeedbackDelta, playfieldRevisionDelta);
      if (releaseDelta !== 1 || releaseFeedbackDelta <= 0) {
        return FAIL(`valid route drag did not produce one launch and feedback: shotDelta=${releaseDelta}, feedbackDelta=${releaseFeedbackDelta}`);
      }
      const observations = [launched.before, launched.after, launched.moving];
      for (let i = 0; i < 4; i++) observations.push(await game.wait(240));
      const positions = observations.map(s => {
        const ball = ballById(s, launched.ballId);
        const c = ballCenter(ball);
        return c ? `${Math.round(c.x)}:${Math.round(c.y)}` : 'missing';
      });
      const trajectories = observations.map(s => {
        const ball = ballById(s, launched.ballId);
        const c = ballCenter(ball);
        if (!ball || !c) return 'missing';
        const vx = Math.round(n(ball.velocity && ball.velocity.x) * 10) / 10;
        const vy = Math.round(n(ball.velocity && ball.velocity.y) * 10) / 10;
        return `${Math.round(c.x)}:${Math.round(c.y)}:${vx}:${vy}:${ball.moving ? 'moving' : 'settled'}:${ball.state || ''}`;
      });
      const uniquePositions = new Set(positions).size;
      const uniqueTrajectories = new Set(trajectories).size;
      const physicsRevisionDelta = n(observations[observations.length - 1].revision.physics) - n(observations[0].revision.physics);
      const routeFeedbackDelta = feedbackRevision(observations[observations.length - 1]) - feedbackRevision(observations[0]);
      if (uniquePositions < 3 && uniqueTrajectories < 3) return FAIL(`insufficient time-ordered motion evidence: ${positions.join(' -> ')}`);
      if (routeFeedbackDelta <= 0) return FAIL('route/launch/collision/playfield feedback did not change during motion');
      return PASS(`motion observations=${uniquePositions}, trajectory observations=${uniqueTrajectories}, physicsRevisionDelta=${physicsRevisionDelta}`);
    }
  },
  {
    id: 'p1-failure-overlay-locks-playfield',
    level: 'P1',
    name: 'Out-of-play failure follows motion and locks playfield',
    timeoutMs: 32000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const attempt = await launchUntilFailure(game);
      const launched = attempt.launched;
      const failed = attempt.failed;
      if (shotDelta(launched.before, launched.after) !== 1) return FAIL('risky shot did not count exactly one valid release');
      if (failed.result !== 'failed' || failed.phase !== 'failed') return FAIL(`risk did not produce failed state, got ${failed.phase}/${failed.result}`);
      if (!failed.feedback.failureFeedbackVisible || !failed.overlay.blocksPlayfield || failed.canInteractWithPlayfield) return FAIL('failure feedback/overlay did not block playfield');
      const beforeBlocked = attemptSignature(failed);
      const ball = firstPlayableBall(failed) || (failed.balls || [])[0];
      if (ball) await game.realDragBall(ball, { dx: -1, dy: 0, strength: 'medium' }, true);
      await game.browser.sleep(200);
      const afterBlocked = await game.snapshot();
      if (attemptSignature(afterBlocked) !== beforeBlocked) return FAIL('drag under failure overlay mutated failed attempt');
      return PASS('motion-caused failure visible and terminal overlay blocked further shots');
    }
  },
  {
    id: 'p1-retry-clears-failure-state',
    level: 'P1',
    name: 'Retry after failure restores current level attempt',
    timeoutMs: 32000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const attempt = await launchUntilFailure(game);
      const failed = attempt.failed;
      if (failed.result !== 'failed') return FAIL('could not establish legal failed precondition');
      const retried = snapOf(await game.input({ type: 'retry' }));
      await game.wait(160, 'playfieldReady');
      const after = await game.snapshot();
      if (after.result !== 'none' || after.phase !== 'ready' || after.screen !== 'playing') return FAIL(`retry did not return to ready playing state (${after.phase}/${after.result})`);
      if (n(after.shotCount) !== 0) return FAIL(`retry did not reset shot count (${after.shotCount})`);
      if (after.overlay.blocksPlayfield || after.feedback.failureFeedbackVisible) return FAIL('retry left failure overlay/feedback blocking');
      if ((after.balls || []).some(b => b.moving || b.state === 'moving') || (after.aim && after.aim.active === true)) return FAIL('retry left moving ball or active aim state');
      if (retried && retried.ok === true && !after.canInteractWithPlayfield) return FAIL('retry returned ok but playfield is not interactable');
      return PASS('retry cleared failure, shots, aim, and motion state');
    }
  },
  {
    id: 'p1-matching-basket-success-rating',
    level: 'P1',
    name: 'Matching basket completion shows success and rating',
    timeoutMs: 36000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const attempt = await completeMatchingTarget(game);
      const before = attempt.launched.before;
      const launched = attempt.launched;
      const done = attempt.done;
      if (shotDelta(launched.before, launched.after) !== 1) return FAIL('completion shot did not count exactly one release');
      const beforeBall = (before.balls || []).find(b => b.id === launched.ballId);
      const releasedBall = (launched.after.balls || []).find(b => b.id === launched.ballId);
      const releaseDelta = beforeBall && releasedBall ? posDelta(beforeBall, releasedBall) : null;
      const motionObserved = launched.after.result === 'none' &&
        launched.after.phase === 'moving' &&
        releasedBall &&
        releasedBall.moving === true &&
        (n(releasedBall.motionRevision) > n(beforeBall && beforeBall.motionRevision) ||
          (releaseDelta && releaseDelta.dist > 0.5));
      if (!motionObserved) return FAIL('completion did not expose motion before terminal result');
      if (!(done.result === 'success' || done.result === 'allComplete') || done.phase !== 'success') return FAIL(`matching completion did not produce success (${done.phase}/${done.result})`);
      if (completionCount(done) !== n(done.level.targetCount)) return FAIL('success did not require all targets complete');
      const occupied = done.baskets.some(b => b.completed || b.occupiedByBallId);
      const ballCompleted = done.balls.some(b => b.completed || b.state === 'inMatchingBasket');
      if (!occupied || !ballCompleted) return FAIL('success lacks basket occupancy/completed ball evidence');
      if (!done.feedback.successFeedbackVisible || !done.overlay.blocksPlayfield) return FAIL('success feedback or terminal overlay missing');
      if (typeof done.stars !== 'number' || !Number.isInteger(done.stars) || done.stars < 1 || done.stars > 3) return FAIL('stars/rating field missing or invalid');
      return PASS(`completed ${completionCount(done)}/${done.level.targetCount} with shots=${done.shotCount}`);
    }
  },
  {
    id: 'p1-wrong-color-or-partial-target-rejection',
    level: 'P1',
    name: 'Wrong-color or partial target progress does not complete level',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario(['wrong_color_risk_start', 'multi_target_start']);
      const before = setup.snap;
      if (setup.name === 'wrong_color_risk_start') {
        const attempt = await exerciseWrongColor(game);
        if (attempt.unsupported) return FAIL('wrong_color_risk_start lacks a distinct wrong-color basket');
        if (!attempt || !attempt.contactObserved) {
          return FAIL('could not observe the player shot contact a wrong-color basket during the shot');
        }
        if (shotDelta(attempt.launched.before, attempt.launched.after) !== 1) return FAIL('valid rejection-path shot did not count exactly one release');
        if (attempt.after.result !== 'none') return FAIL(`wrong-color contact changed result to ${attempt.after.result}`);
        if (completionCount(attempt.after) !== completionCount(attempt.launched.before)) return FAIL('wrong-color contact changed completed target count');
        return PASS(`wrong-color basket rejected, result=${attempt.after.result}`);
      }
      const launched = await launchWithRealDrag(game, before, { dx: -1, dy: 1, strength: 'medium' });
      let after = launched.moving;
      for (let i = 0; i < 8 && after.phase === 'moving'; i++) after = await game.wait(350, 'ballSettled');
      if (shotDelta(launched.before, launched.after) !== 1) return FAIL('valid rejection-path shot did not count exactly one release');
      if (setup.name === 'multi_target_start' || n(before.level.targetCount) > 1) {
        if (completionCount(after) < n(after.level.targetCount) && after.result !== 'none') return FAIL('partial target completion incorrectly ended the level');
      } else {
        if (after.result === 'success' || after.result === 'allComplete') return FAIL('wrong-color risk path produced success');
      }
      if (completionCount(after) > n(after.level.targetCount)) return FAIL('completedTargetCount exceeded targetCount');
      return PASS(`result=${after.result}, completed=${completionCount(after)}/${after.level.targetCount}`);
    }
  },
  {
    id: 'p1-multitarget-selected-ball-and-progress',
    level: 'P1',
    name: 'Multi-target shots affect selected ball and keep progress bounded',
    timeoutMs: 28000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario('multi_target_start');
      const before = setup.snap;
      if (n(before.level.targetCount) < 2 && before.balls.length < 2 && before.baskets.length < 2) return FAIL('multi_target_start lacks multiple targets or balls');
      const selected = firstPlayableBall(before);
      const other = before.balls.find(b => b.id !== selected.id && !b.completed);
      const launched = await launchWithRealDrag(game, before, { dx: -1, dy: 1, strength: 'medium' });
      let after = launched.moving;
      for (let i = 0; i < 8 && after.phase === 'moving'; i++) after = await game.wait(300, 'ballSettled');
      const selectedBefore = ballById(before, selected.id);
      const selectedAfter = ballById(after, selected.id);
      if (!selectedAfter || n(selectedAfter.motionRevision) <= n(selectedBefore.motionRevision) && ballSignature(selectedAfter) === ballSignature(selectedBefore)) return FAIL('selected ball did not receive motion/state change');
      if (other) {
        const otherBefore = ballById(before, other.id);
        const otherAfter = ballById(after, other.id);
        if (otherAfter && n(otherAfter.motionRevision) > n(otherBefore.motionRevision) && otherAfter.state === 'moving') return FAIL('unselected ball received launch motion from selected shot');
      }
      if (completionCount(after) > n(after.level.targetCount)) return FAIL('target progress exceeded target count');
      if (completionCount(after) < n(after.level.targetCount) && after.result !== 'none') return FAIL('multi-target partial progress became terminal');
      return PASS(`multi-target progress ${completionCount(after)}/${after.level.targetCount}`);
    }
  },
  {
    id: 'p1-pause-overlay-blocks-shot-and-resumes',
    level: 'P1',
    name: 'Pause overlay blocks shot mutation and resume restores aim',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario('menu_flow_start');
      const before = setup.snap;
      const paused = snapOf(await game.input({ type: 'openPause' }));
      if (paused.screen !== 'pauseMenu' && paused.phase !== 'paused') return FAIL('openPause did not enter pause screen/state');
      if (!paused.overlay.blocksPlayfield || paused.canInteractWithPlayfield) return FAIL('pause overlay does not block playfield');
      const blockedSignature = attemptSignature(paused);
      const ball = firstPlayableBall(before);
      await game.realDragBall(ball, { dx: -1, dy: 0, strength: 'medium' }, true);
      await browser.sleep(220);
      const afterBlocked = await game.snapshot();
      if (attemptSignature(afterBlocked) !== blockedSignature) return FAIL('drag under pause mutated gameplay');
      const resumed = snapOf(await game.input({ type: 'resume' }));
      if (resumed.overlay.blocksPlayfield || !resumed.canInteractWithPlayfield) return FAIL('resume did not restore playfield interaction');
      await game.realDragBall(ball, { dx: -1, dy: 0, strength: 'medium' }, false);
      await browser.sleep(180);
      const aim = await game.snapshot();
      if (aim.phase !== 'aiming' || !aim.feedback.aimingGuideVisible) return FAIL('aim could not be entered after resume');
      return PASS('pause blocked mutation and resume restored aiming');
    }
  },
  {
    id: 'p1-level-select-blocks-and-loads-level',
    level: 'P1',
    name: 'Level select blocks playfield and loads clean playable level',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario('menu_flow_start');
      const before = setup.snap;
      const opened = snapOf(await game.input({ type: 'openLevelSelect' }));
      if (opened.screen !== 'levelSelect' && opened.phase !== 'levelSelect') return FAIL('openLevelSelect did not show level select');
      if (!opened.overlay.blocksPlayfield || opened.canInteractWithPlayfield) return FAIL('level select did not block playfield');
      const blocked = attemptSignature(opened);
      const ball = firstPlayableBall(before);
      await game.realDragBall(ball, { dx: -1, dy: 0, strength: 'medium' }, true);
      await browser.sleep(200);
      if (attemptSignature(await game.snapshot()) !== blocked) return FAIL('drag under level select mutated gameplay');
      const closed = snapOf(await game.input({ type: 'closePanel' }));
      if (!closed || closed.overlay.blocksPlayfield || !closed.canInteractWithPlayfield) return FAIL('closing level select did not restore playfield');
      const reopened = snapOf(await game.input({ type: 'openLevelSelect' }));
      if (!reopened || (reopened.screen !== 'levelSelect' && reopened.phase !== 'levelSelect')) return FAIL('reopening level select failed');
      if (!reopened.overlay.blocksPlayfield || reopened.canInteractWithPlayfield) return FAIL('reopened level select did not block playfield');
      const currentId = before.level && before.level.id;
      const candidates = [1, 2].filter((targetLevel) => String(targetLevel) !== String(currentId));
      let selected = null;
      let after = null;
      let selectedTarget = null;
      for (const targetLevel of candidates) {
        const panel = await game.snapshot();
        if (!panel.overlay || !panel.overlay.blocksPlayfield) {
          const reopenedCandidate = snapOf(await game.input({ type: 'openLevelSelect' }));
          if (!reopenedCandidate || (reopenedCandidate.screen !== 'levelSelect' && reopenedCandidate.phase !== 'levelSelect')) continue;
        }
        selected = snapOf(await game.input({ type: 'selectLevel', level: targetLevel }));
        if (selected && selected.ok === false) continue;
        await game.wait(160, 'playfieldReady');
        after = await game.snapshot();
        const identityChanged = after.level.id !== before.level.id || n(after.level.index, NaN) !== n(before.level.index, NaN);
        const requestedLevelLoaded = after.level && String(after.level.id) === String(targetLevel);
        if (identityChanged && requestedLevelLoaded) {
          selectedTarget = targetLevel;
          break;
        }
      }
      if (!after || selectedTarget === null) return FAIL('selectLevel did not load requested level');
      if (after.result !== 'none' || n(after.shotCount) !== 0 || after.overlay.blocksPlayfield) return FAIL('selected level did not reset transient state');
      if (!firstPlayableBall(after) || !after.baskets.length) return FAIL('selected level is not playable');
      if (selected && selected.ok === false) return FAIL(`selectLevel rejected: ${selected.reason || 'unknown'}`);
      return PASS(`loaded level ${after.level.id}`);
    }
  },
  {
    id: 'p1-next-level-after-success-resets-attempt',
    level: 'P1',
    name: 'Next level after success clears terminal state',
    timeoutMs: 38000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const completion = await completeMatchingTarget(game);
      const done = completion && completion.done;
      if (!done || !(done.result === 'success' || done.result === 'allComplete')) return FAIL('could not establish success precondition');
      if (!done.controls.nextAvailable && !done.controls.levelSelectAvailable) return FAIL('success exposes neither next level nor level select progression');
      const beforeLevel = done.level.id;
      const progressed = done.controls.nextAvailable ? snapOf(await game.input({ type: 'nextLevel' })) : snapOf(await game.input({ type: 'openLevelSelect' }));
      if (!done.controls.nextAvailable) await game.input({ type: 'selectLevel', level: n(done.level.index, 0) + 1 });
      await game.wait(180, 'playfieldReady');
      const after = await game.snapshot();
      if (after.result !== 'none' || n(after.shotCount) !== 0 || after.overlay.blocksPlayfield) return FAIL('progression left terminal state, shots, or overlay uncleared');
      if (!firstPlayableBall(after) || completionCount(after) !== 0) return FAIL('progression did not load fresh unresolved targets');
      if (after.level.id === beforeLevel && n(after.level.total) > 1) return FAIL('progression did not change level id/index');
      if (progressed && progressed.ok === false) return FAIL(`progression action rejected: ${progressed.reason || 'unknown'}`);
      return PASS(`progressed from ${beforeLevel} to ${after.level.id}`);
    }
  },
  {
    id: 'p2-invalid-action-and-empty-drag-invariants',
    level: 'P2',
    name: 'Invalid actions and empty drags are rejected without mutation',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario('simple_shot_start');
      const before = await game.snapshot();
      const sig = attemptSignature(before);
      await game.input({ type: 'unknownAction', nonsense: true });
      await game.input({ type: 'dragEmpty', start: { screenX: before.playfield.bounds.screenX + 5, screenY: before.playfield.bounds.screenY + 5 }, end: { screenX: before.playfield.bounds.screenX + 30, screenY: before.playfield.bounds.screenY + 30 } });
      const after = await game.snapshot();
      if (attemptSignature(after) !== sig) return FAIL('invalid action or dragEmpty mutated gameplay state');
      if (setup.name !== 'simple_shot_start') return FAIL('unexpected setup route');
      return PASS('invalid actions preserved shot/progress/result invariants');
    }
  },
  {
    id: 'p2-route-variety-or-nonblocking-depth',
    level: 'P2',
    name: 'Route variety scenarios expose playable depth',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const names = ['simple_shot_start', 'ricochet_start', 'ramp_start', 'multi_target_start'];
      const routes = new Set();
      let playable = 0;
      for (const name of names) {
        const result = snapOf(await game.contractCall('loadScenario', [name]));
        if (result && result.ok === false) continue;
        const err = requirePlayablePrecondition(result, name);
        if (err) continue;
        playable++;
        if (result.level && result.level.routeType) routes.add(result.level.routeType);
        if ((result.obstacles || []).some(o => o.kind === 'ramp')) routes.add('ramp');
        if ((result.obstacles || []).some(o => o.kind === 'wall' || o.kind === 'basketWall')) routes.add('ricochet');
        if (n(result.level.targetCount) > 1 || result.balls.length > 1 || result.baskets.length > 1) routes.add('multiTarget');
      }
      if (playable < 3 || routes.size < 3) return FAIL(`insufficient P2 route variety: playable=${playable}, routes=${Array.from(routes).join(',')}`);
      return PASS(`playable scenarios=${playable}, routes=${Array.from(routes).join(',')}`);
    }
  },
  {
    id: 'p2-feedback-synchronizes-events',
    level: 'P2',
    name: 'Feedback summaries synchronize aim, launch, route and terminal events',
    timeoutMs: 28000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await game.loadPlayableScenario(['ricochet_start', 'ramp_start', 'simple_shot_start']);
      const before = setup.snap;
      const ball = firstPlayableBall(before);
      const field = before.playfield && before.playfield.bounds;
      const center = ballCenter(ball);
      if (!field || !center) return FAIL('playfield and ball geometry required for bounded real drag');
      const left = center.x - field.screenX;
      const right = field.screenX + field.width - center.x;
      const up = center.y - field.screenY;
      const down = field.screenY + field.height - center.y;
      const horizontalRoom = Math.max(left, right);
      const verticalRoom = Math.max(up, down);
      const aimPull = horizontalRoom >= verticalRoom
        ? { dx: left >= right ? -1 : 1, dy: 0, strength: 'medium' }
        : { dx: 0, dy: up >= down ? -1 : 1, strength: 'medium' };
      await game.realDragBall(ball, aimPull, false);
      await browser.sleep(180);
      const aimed = await game.snapshot();
      if (aimed.phase !== 'aiming' || !aimed.feedback.aimingGuideVisible || !aimed.aim || !aimed.aim.predictedPathVisible) return FAIL('aim feedback not synchronized with aiming state');
      await game.input({ type: 'cancelAim' });
      const launched = await launchWithRealDrag(game, await game.snapshot(), aimPull);
      let later = launched.moving;
      for (let i = 0; i < 5 && later.phase === 'moving'; i++) later = await game.wait(300);
      if (feedbackRevision(later) <= feedbackRevision(launched.before)) return FAIL('launch/motion did not increase visible feedback revisions');
      if (n(later.shotCount) !== n(launched.before.shotCount) + 1) return FAIL('HUD shot count not synchronized with launch');
      if ((later.result === 'success' && !later.feedback.successFeedbackVisible) || (later.result === 'failed' && !later.feedback.failureFeedbackVisible)) return FAIL('terminal result lacks matching visible feedback');
      return PASS(`feedback revision delta=${feedbackRevision(later) - feedbackRevision(launched.before)}`);
    }
  },
  {
    id: 'p2-optional-depth-nonblocking',
    level: 'P2',
    name: 'Optional editor or skin depth is absent or nonblocking',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.reset({ startLevel: 0 });
      const snap = await game.snapshot();
      const beforeSig = attemptSignature(snap);
      const clicked = await game.clickControl(['editor', 'edit', 'skin', 'theme', 'custom']);
      if (!clicked) return NA('optional editor/skin controls not exposed; P1 gameplay unaffected');
      await browser.sleep(300);
      const afterOpen = await game.snapshot();
      if (afterOpen.result !== 'none' && afterOpen.result !== snap.result) return FAIL('optional depth changed terminal result unexpectedly');
      await game.input({ type: 'closePanel' });
      await browser.sleep(200);
      const afterClose = await game.snapshot();
      if (afterClose.overlay.blocksPlayfield || !afterClose.canInteractWithPlayfield) return FAIL('optional panel left playfield blocked');
      if (!firstPlayableBall(afterClose) || !afterClose.baskets.length) return FAIL('optional depth corrupted default playable level');
      if (!before) return FAIL('reset did not return a snapshot before optional depth');
      return PASS(`optional control nonblocking; before=${beforeSig.length} chars`);
    }
  }
];

module.exports = { suite };
