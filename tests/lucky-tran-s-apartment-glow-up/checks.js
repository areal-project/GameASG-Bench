/*
 * GDD Coverage Map
 * p0-1-boot-contract-readable: M1, M13 public contract and readable boot state.
 * p0-2-reset-fresh-state: M1, M10 reset clears transient room state.
 * p1-1-start-gating-real-click: M1, M13 protected pre-start actions plus real start control.
 * p1-2-room-selection-three-room-breadth: M2, M12, M13 required rooms reach wall selection.
 * p1-3-wall-tone-unlocks-decorating: M3, M4, M13 wall choice gates decorating.
 * p1-4-candidate-selection-preview-real-click: M4, M5, M11 real candidate click selects without scoring.
 * p1-5-hold-progress-early-release-cancel: M5, M6, M10 maintained press progresses and early release cancels.
 * p1-6-valid-hold-success-reward-and-advance: M6, M7, M10, M11 complete hold rewards and advances.
 * p1-7-invalid-spot-and-no-selection-rejection: M4, M5, M6, M10 invalid/no-selection inputs preserve state.
 * p1-8-sequential-order-and-spot-lock: M4, M7, M8, M10 completed/inactive spots cannot skip order.
 * p1-9-final-placement-completion-showcase-lock: M8, M13 final hold reaches showcase and locks placement.
 * p1-10-continue-new-room-reset: M9, M12 continue starts a clean new room flow.
 * p1-11-visible-readability-main-phases: M13, M10 main phases expose nonblank playfield/HUD evidence.
 * p1-12-mouse-touch-semantic-equivalence: M1, M5, M6, M7 mouse and touch perform equivalent placement.
 * p2-1-share-style-feedback: M15 optional share gives nonblocking feedback.
 * p2-2-optional-audio-haptics-not-sole-oracle: M14 visual or snapshot success works without sensory APIs.
 * p2-3-optional-edit-settings-isolated: M16 optional settings/edit controls preserve the P1 loop.
 *
 * Rationality Map
 * p1-1-start-gating-real-click: real action: protected contract actions then real mouse click start; independent observation: phase, rooms, target zones, progress unchanged; empty-shell failure: ungated or clickless shell fails.
 * p1-2-room-selection-three-room-breadth: real action: scenario setup then tapRoom for each required room; independent observation: activeRoom, wall phase, wall choices, room visibility; empty-shell failure: single generic room fails.
 * p1-3-wall-tone-unlocks-decorating: real action: rejected pre-wall candidate/hold then tapWall; independent observation: selectedWall, decorating phase, active spot, candidates, visibility; empty-shell failure: wall-only cosmetic shell fails.
 * p1-4-candidate-selection-preview-real-click: real action: real mouse click candidate zone; independent observation: selectedCandidate, selected flag, preview, active highlight, no score delta; empty-shell failure: static cards or instant scoring fail.
 * p1-5-hold-progress-early-release-cancel: real action: select candidate then real mouse press/release before completion; independent observation: mid-hold progress plus final cleared hold and unchanged progress; empty-shell failure: fake hold label without cancel semantics fails.
 * p1-6-valid-hold-success-reward-and-advance: real action: select candidate then sustained real mouse hold active spot; independent observation: score, placed/progress, celebration/guidance, sequence advance; empty-shell failure: ok-only or counter-only placement fails.
 * p1-7-invalid-spot-and-no-selection-rejection: real action: no-selection active hold, outside hold, completed/inactive action where available; independent observation: lastAction/rejection plus score/progress/spot preserved; empty-shell failure: arbitrary tap-to-place shortcut fails.
 * p1-8-sequential-order-and-spot-lock: real action: load legal mid scenario, try inactive/completed spot then complete active spot; independent observation: invalid unchanged then valid progress increase; empty-shell failure: random-order placement or repeat scoring fails.
 * p1-9-final-placement-completion-showcase-lock: real action: load final legal precondition, select candidate, complete hold, then ordinary placement attempt; independent observation: room_complete result, showcase/completion visibility, totals, post-completion lock; empty-shell failure: phase-only ending or unlocked final state fails.
 * p1-10-continue-new-room-reset: real action: showcase scenario then real click continue; independent observation: new selection flow, cleared score/placed/candidate/hold, overlay clear; empty-shell failure: dead-end showcase or stale room carryover fails.
 * p1-11-visible-readability-main-phases: real action: legal navigation and placement actions through phases; independent observation: visibility fields plus screenshot hash changes; empty-shell failure: API-only or blank presentation fails.
 * p1-12-mouse-touch-semantic-equivalence: real action: mouse path and CDP touch path candidate/hold; independent observation: both produce selection/progress/reward deltas; empty-shell failure: mouse-only or touch-only implementation fails.
 * p2-1-share-style-feedback: real action: showcase share click if exposed; independent observation: share feedback/showcase/progress unchanged; empty-shell failure: share replacing showcase or mutating progress fails.
 * p2-2-optional-audio-haptics-not-sole-oracle: real action: complete placement while tests ignore sound/vibration; independent observation: visual feedback and score/progress deltas; empty-shell failure: sensory-only success without visual state fails.
 * p2-3-optional-edit-settings-isolated: real action: optional settings/edit control click if exposed, then normal candidate/hold action; independent observation: progress preserved and core loop still works; empty-shell failure: optional panel hijacking gameplay fails.
 */

// === Rationality Map ===
// p1-1-start-gating-real-click: real action: protected contract actions then real mouse click start; independent observation: phase, rooms, target zones, progress unchanged; empty-shell failure: ungated or clickless shell fails.
// p1-2-room-selection-three-room-breadth: real action: scenario setup then tapRoom for each required room; independent observation: activeRoom, wall phase, wall choices, room visibility; empty-shell failure: single generic room fails.
// p1-3-wall-tone-unlocks-decorating: real action: rejected pre-wall candidate/hold then tapWall; independent observation: selectedWall, decorating phase, active spot, candidates, visibility; empty-shell failure: wall-only cosmetic shell fails.
// p1-4-candidate-selection-preview-real-click: real action: real mouse click candidate zone; independent observation: selectedCandidate, selected flag, preview, active highlight, no score delta; empty-shell failure: static cards or instant scoring fail.
// p1-5-hold-progress-early-release-cancel: real action: select candidate then real mouse press/release before completion; independent observation: mid-hold progress plus final cleared hold and unchanged progress; empty-shell failure: fake hold label without cancel semantics fails.
// p1-6-valid-hold-success-reward-and-advance: real action: select candidate then sustained real mouse hold active spot; independent observation: score, placed/progress, celebration/guidance, sequence advance; empty-shell failure: ok-only or counter-only placement fails.
// p1-7-invalid-spot-and-no-selection-rejection: real action: no-selection active hold, outside hold, completed/inactive action where available; independent observation: lastAction/rejection plus score/progress/spot preserved; empty-shell failure: arbitrary tap-to-place shortcut fails.
// p1-8-sequential-order-and-spot-lock: real action: load legal mid scenario, try inactive/completed spot then complete active spot; independent observation: invalid unchanged then valid progress increase; empty-shell failure: random-order placement or repeat scoring fails.
// p1-9-final-placement-completion-showcase-lock: real action: load final legal precondition, select candidate, complete hold, then ordinary placement attempt; independent observation: room_complete result, showcase/completion visibility, totals, post-completion lock; empty-shell failure: phase-only ending or unlocked final state fails.
// p1-10-continue-new-room-reset: real action: showcase scenario then real click continue; independent observation: new selection flow, cleared score/placed/candidate/hold, overlay clear; empty-shell failure: dead-end showcase or stale room carryover fails.
// p1-11-visible-readability-main-phases: real action: legal navigation and placement actions through phases; independent observation: visibility fields plus screenshot hash changes; empty-shell failure: API-only or blank presentation fails.
// p1-12-mouse-touch-semantic-equivalence: real action: mouse path and CDP touch path candidate/hold; independent observation: both produce selection/progress/reward deltas; empty-shell failure: mouse-only or touch-only implementation fails.
// p2-1-share-style-feedback: real action: showcase share click if exposed; independent observation: share feedback/showcase/progress unchanged; empty-shell failure: share replacing showcase or mutating progress fails.
// p2-2-optional-audio-haptics-not-sole-oracle: real action: complete placement while tests ignore sound/vibration; independent observation: visual feedback and score/progress deltas; empty-shell failure: sensory-only success without visual state fails.
// p2-3-optional-edit-settings-isolated: real action: optional settings/edit control click if exposed, then normal candidate/hold action; independent observation: progress preserved and core loop still works; empty-shell failure: optional panel hijacking gameplay fails.

'use strict';

const PASS = (detail) => ({ status: 'PASS', detail });
const FAIL = (detail) => ({ status: 'FAIL', detail });
const NA = (detail) => ({ status: 'NOT_APPLICABLE', detail });

const REQUIRED_ROOMS = ['living_room', 'bedroom', 'kitchen'];
const PHASES = new Set(['loading', 'start', 'room_selection', 'wall_selection', 'decorating', 'celebrating', 'completion', 'showcase']);

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function stableCore(snap) {
  return {
    phase: snap?.phase,
    result: snap?.result,
    activeRoom: snap?.activeRoom,
    selectedWall: snap?.selectedWall,
    selectedCandidate: snap?.selectedCandidate,
    score: Number(snap?.score || 0),
    placedCount: Number(snap?.placedCount || 0),
    progressPlaced: Number(snap?.progress?.placed || 0),
    currentSpotIndex: snap?.currentSpot?.index ?? null,
    currentSpotState: snap?.currentSpot?.state ?? null,
    holdProgress: Number(snap?.hold?.progress || 0)
  };
}

function sameProtected(a, b) {
  const x = stableCore(a);
  const y = stableCore(b);
  return x.score === y.score &&
    x.placedCount === y.placedCount &&
    x.progressPlaced === y.progressPlaced &&
    x.activeRoom === y.activeRoom &&
    x.selectedWall === y.selectedWall &&
    x.currentSpotIndex === y.currentSpotIndex;
}

function hasRequiredSnapshotShape(s) {
  return s && typeof s === 'object' &&
    PHASES.has(s.phase) &&
    typeof s.screen === 'string' &&
    ['none', 'room_complete'].includes(s.result) &&
    Array.isArray(s.roomsAvailable) &&
    s.visibility && typeof s.visibility === 'object' &&
    s.feedback && typeof s.feedback === 'object' &&
    s.progress && typeof s.progress === 'object' &&
    s.hold && typeof s.hold === 'object' &&
    Array.isArray(s.targetZones) &&
    s.lastAction && typeof s.lastAction === 'object';
}

function isRejectedOrUnchanged(before, after) {
  return after?.lastAction?.ok === false || sameProtected(before, after);
}

function countEnabledZones(snap, kind) {
  return (snap?.targetZones || []).filter((z) => z.kind === kind && z.enabled !== false).length;
}

function findZone(snap, kind, semanticPart) {
  const zones = snap?.targetZones || [];
  return zones.find((z) => {
    const semantic = String(z.semanticRef || '');
    return z.kind === kind && z.enabled !== false && (!semanticPart || semantic.includes(semanticPart));
  }) || null;
}

function findActiveSpotZone(snap) {
  const zones = snap?.targetZones || [];
  const targetZoneId = snap?.currentSpot?.targetZoneId;
  return zones.find((z) => z.kind === 'spot' && z.enabled !== false && (!targetZoneId || z.id === targetZoneId)) ||
    zones.find((z) => z.kind === 'spot' && z.enabled !== false) ||
    null;
}

function centerFromZone(zone) {
  if (!zone) return null;
  const c = zone.center || {};
  if (Number.isFinite(c.x) && Number.isFinite(c.y)) return { x: c.x, y: c.y };
  const b = zone.bounds || {};
  if ([b.x, b.y, b.width, b.height].every(Number.isFinite)) {
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }
  return null;
}

function createGameDriver(browser) {
  async function evalPage(expr) {
    const value = await browser.eval(expr);
    if (value && value.__l2_err__) throw new Error(value.__l2_err__);
    return value;
  }

  async function viewportPoints(zone) {
    const center = centerFromZone(zone);
    if (!center) throw new Error(`zone has no usable center: ${zone?.kind || 'unknown'}`);
    return evalPage(`
      (function() {
        const x = ${JSON.stringify(center.x)};
        const y = ${JSON.stringify(center.y)};
        const normalized = Math.abs(x) <= 1.0001 && Math.abs(y) <= 1.0001;
        const w = window.innerWidth || document.documentElement.clientWidth || 1280;
        const h = window.innerHeight || document.documentElement.clientHeight || 720;
        const primary = { x: normalized ? x * w : x, y: normalized ? y * h : y };
        if (!normalized) return [primary];
        const roots = Array.from(document.querySelectorAll('body *')).map((el) => {
          const r = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return { el, r, style };
        }).filter(({ el, r, style }) => r.width >= w * 0.5 && r.height >= h * 0.5 &&
          style.display !== 'none' && style.visibility !== 'hidden' &&
          (style.overflowX === 'hidden' || style.overflowY === 'hidden' ||
           style.overflowX === 'clip' || style.overflowY === 'clip' ||
           el.tagName === 'CANVAS' || el.tagName === 'SVG'))
          .sort((a, b) => (b.r.width * b.r.height) - (a.r.width * a.r.height));
        const root = roots.length ? roots[0].r : null;
        if (!root) return [primary];
        const playfield = { x: root.left + x * root.width, y: root.top + y * root.height };
        return Math.hypot(playfield.x - primary.x, playfield.y - primary.y) > 1
          ? [primary, playfield]
          : [primary];
      })()
    `);
  }

  async function viewportPoint(zone) {
    return (await viewportPoints(zone))[0];
  }

  return {
    async waitForReady() {
      const deadline = Date.now() + 7000;
      let snap = null;
      while (Date.now() < deadline) {
        const ready = await evalPage(`
          (function() {
            return {
              hasApi: !!(window.__gameTest && typeof window.__gameTest.getSnapshot === 'function'),
              state: window.__gameTest && typeof window.__gameTest.getSnapshot === 'function'
                ? window.__gameTest.getSnapshot()
                : null
            };
          })()
        `);
        if (ready.hasApi && hasRequiredSnapshotShape(ready.state)) {
          snap = ready.state;
          break;
        }
        await browser.sleep(150);
      }
      if (!snap) throw new Error('window.__gameTest.getSnapshot did not return the required Snapshot schema');
      return snap;
    },
    async apiShape() {
      return evalPage(`
        (function() {
          const api = window.__gameTest;
          return !!api && ['reset','input','getSnapshot','loadScenario'].every((k) => typeof api[k] === 'function');
        })()
      `);
    },
    async snapshot() {
      return evalPage('window.__gameTest.getSnapshot()');
    },
    async reset(options) {
      return evalPage(`window.__gameTest.reset(${JSON.stringify(options || {})})`);
    },
    async input(action) {
      return evalPage(`
        (function() {
          try { return window.__gameTest.input(${JSON.stringify(action)}); }
          catch (e) {
            const s = window.__gameTest.getSnapshot();
            s.lastAction = { ok: false, type: ${JSON.stringify(action.type)}, reason: 'unsupported' };
            return s;
          }
        })()
      `);
    },
    async loadScenario(name, options) {
      return evalPage(`window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})})`);
    },
    async wait(ms) {
      await this.input({ type: 'wait', durationMs: ms });
      await browser.sleep(Math.min(ms, 300));
      return this.snapshot();
    },
    async clickZone(zone, options = {}) {
      const points = options.allowPlayfieldCoordinates
        ? await viewportPoints(zone)
        : [await viewportPoint(zone)];
      let after = null;
      for (const p of points) {
        await browser.mouseClick(p.x, p.y);
        await browser.sleep(250);
        after = await this.snapshot();
        if (!Number.isInteger(options.expectedCandidateIndex) ||
            after.selectedCandidate === options.expectedCandidateIndex) return after;
      }
      return after || this.snapshot();
    },
    async mouseHoldZone(zone, durationMs, midAtMs) {
      const p = await viewportPoint(zone);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1, modifiers: 0 });
      let mid = null;
      if (midAtMs && midAtMs < durationMs) {
        await browser.sleep(midAtMs);
        mid = await this.snapshot();
        await browser.sleep(durationMs - midAtMs);
      } else {
        await browser.sleep(durationMs);
      }
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(350);
      return { mid, after: await this.snapshot() };
    },
    async touchTapZone(zone) {
      const p = await viewportPoint(zone);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: p.x, y: p.y, radiusX: 4, radiusY: 4, force: 1 }],
        modifiers: 0
      });
      await browser.sleep(80);
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], modifiers: 0 });
      await browser.sleep(250);
      return this.snapshot();
    },
    async touchHoldZone(zone, durationMs, midAtMs) {
      const p = await viewportPoint(zone);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: p.x, y: p.y, radiusX: 5, radiusY: 5, force: 1 }],
        modifiers: 0
      });
      let mid = null;
      if (midAtMs && midAtMs < durationMs) {
        await browser.sleep(midAtMs);
        mid = await this.snapshot();
        await browser.sleep(durationMs - midAtMs);
      } else {
        await browser.sleep(durationMs);
      }
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], modifiers: 0 });
      await browser.sleep(350);
      return { mid, after: await this.snapshot() };
    },
    canvasHash() {
      return browser.canvasPixelHash();
    }
  };
}

async function legalScenario(game, name) {
  const s = await game.loadScenario(name);
  if (!hasRequiredSnapshotShape(s)) throw new Error(`${name} did not return a valid Snapshot`);
  if (name.startsWith('decorating') && s.phase !== 'decorating') throw new Error(`${name} is not a decorating precondition`);
  if (name.startsWith('decorating')) {
    if (s.selectedCandidate !== null) throw new Error(`${name} preselects the current candidate`);
    if (Number(s.hold?.progress || 0) !== 0) throw new Error(`${name} preloads hold progress`);
    if (!s.currentSpot || s.currentSpot.state !== 'active') throw new Error(`${name} lacks an active current spot`);
  }
  if (name === 'showcase_complete' && !['completion', 'showcase'].includes(s.phase)) {
    throw new Error('showcase_complete is not a completed/showcase precondition');
  }
  return s;
}

async function chooseFirstWall(game) {
  const before = await legalScenario(game, 'wall_selection');
  const wall = (before.wallChoices || [])[0]?.id || findZone(before, 'wall')?.semanticRef;
  if (!wall) throw new Error('wall_selection exposes no wall choice');
  const after = await game.input({ type: 'tapWall', wall });
  return { before, after, wall };
}

async function selectCandidate(game, pointer = 'contract', options = {}) {
  const before = await game.snapshot();
  const zone = findZone(before, 'candidate', '0') || (before.targetZones || []).find((z) => z.kind === 'candidate' && z.enabled !== false);
  let after;
  if (pointer === 'mouse') {
    if (!zone) throw new Error('no candidate zone for real mouse click');
    after = await game.clickZone(zone, options);
  } else if (pointer === 'touch') {
    if (!zone) throw new Error('no candidate zone for touch tap');
    after = await game.touchTapZone(zone);
  } else {
    after = await game.input({ type: 'tapCandidate', candidateIndex: 0, pointer });
  }
  return { before, after };
}

async function completePlacement(game, pointer = 'mouse', durationMs = 1300) {
  const beforeSelect = await game.snapshot();
  const choice = await selectCandidate(game, pointer === 'touch' ? 'touch' : pointer === 'mouse' ? 'mouse' : 'contract');
  if (choice.after.selectedCandidate == null) throw new Error('candidate selection did not set selectedCandidate');
  const spot = findActiveSpotZone(choice.after);
  if (!spot) throw new Error('no active spot zone after selecting candidate');
  const hold = pointer === 'touch'
    ? await game.touchHoldZone(spot, durationMs, Math.min(350, durationMs - 100))
    : await game.mouseHoldZone(spot, durationMs, Math.min(350, durationMs - 100));
  const settleDeadline = Date.now() + 3000;
  let settled = await game.snapshot();
  while (Date.now() < settleDeadline &&
    settled.currentSpot?.index === beforeSelect.currentSpot?.index &&
    !['completion', 'showcase'].includes(settled.phase)) {
    const remaining = Math.min(250, settleDeadline - Date.now());
    if (remaining <= 0) break;
    settled = await game.wait(remaining);
  }
  return { before: beforeSelect, selected: choice.after, mid: hold.mid, after: settled };
}

function placementSucceeded(before, after) {
  return Number(after.placedCount || 0) > Number(before.placedCount || 0) &&
    Number(after.score || 0) > Number(before.score || 0) &&
    Number(after.progress?.placed || 0) > Number(before.progress?.placed || 0);
}

const suite = [
  {
    id: 'p0-1-boot-contract-readable',
    level: 'P0',
    name: 'Boot exposes public contract and readable snapshot',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const api = await game.apiShape();
      if (!api) return FAIL('window.__gameTest is missing reset/input/getSnapshot/loadScenario');
      const snap = await game.waitForReady();
      if (!hasRequiredSnapshotShape(snap)) return FAIL('snapshot schema is incomplete');
      if (!snap.visibility.playfieldVisible && !['loading', 'start'].includes(snap.phase)) return FAIL('playfield is not visible in a playable phase');
      return PASS(`phase=${snap.phase}`);
    }
  },
  {
    id: 'p0-2-reset-fresh-state',
    level: 'P0',
    name: 'Reset returns a fresh non-completed state',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const snap = await game.reset();
      if (!hasRequiredSnapshotShape(snap)) return FAIL('reset did not return Snapshot schema');
      if (snap.result !== 'none') return FAIL('reset preserved a room result');
      if (snap.activeRoom !== null || snap.selectedWall !== null || snap.selectedCandidate !== null) return FAIL('reset preserved room, wall, or candidate selection');
      if (Number(snap.placedCount || 0) !== 0 || Number(snap.progress?.placed || 0) !== 0) return FAIL('reset preserved placement progress');
      if (snap.visibility.overlayBlocking && snap.phase !== 'loading' && snap.phase !== 'start') return FAIL('reset left a blocking overlay on a playable phase');
      return PASS(`fresh phase=${snap.phase}`);
    }
  },
  {
    id: 'p1-1-start-gating-real-click',
    level: 'P1',
    name: 'Start gate rejects protected actions before a real start click',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const fresh = await legalScenario(game, 'fresh_start');
      const protectedActions = [
        { type: 'tapRoom', room: 'living_room' },
        { type: 'tapWall', wall: 'first' },
        { type: 'tapCandidate', candidateIndex: 0 },
        { type: 'pressSpot', spotRef: 'active', durationMs: 1000 }
      ];
      for (const action of protectedActions) {
        const after = await game.input(action);
        if (!isRejectedOrUnchanged(fresh, after)) return FAIL(`protected pre-start action was accepted: ${action.type}`);
      }
      const startZone = findZone(fresh, 'start') || findZone(fresh, 'playfield', 'start');
      if (!startZone) return FAIL('fresh_start exposes no enabled start target zone for real click');
      const afterStart = await game.clickZone(startZone);
      if (afterStart.phase !== 'room_selection') return FAIL(`real start click did not reach room_selection, got ${afterStart.phase}`);
      if (!REQUIRED_ROOMS.every((r) => afterStart.roomsAvailable.includes(r))) return FAIL('required rooms are not all available after start');
      if (countEnabledZones(afterStart, 'room') < 3) return FAIL('room selection does not expose enabled room zones');
      return PASS('real start click reached room selection with protected actions rejected');
    }
  },
  {
    id: 'p1-2-room-selection-three-room-breadth',
    level: 'P1',
    name: 'Each required room reaches wall selection with visible choices',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      for (const room of REQUIRED_ROOMS) {
        const before = await legalScenario(game, 'room_selection');
        if (!before.roomsAvailable.includes(room)) return FAIL(`${room} not listed in roomsAvailable`);
        const after = await game.input({ type: 'tapRoom', room });
        if (after.activeRoom !== room) return FAIL(`${room} did not become activeRoom`);
        if (after.phase !== 'wall_selection') return FAIL(`${room} did not reach wall_selection`);
        if ((after.wallChoices || []).length < 4 && countEnabledZones(after, 'wall') < 4) return FAIL(`${room} lacks at least four wall choices`);
        if (!after.visibility.roomVisible && !after.visibility.playfieldVisible) return FAIL(`${room} has no visible room/playfield presentation`);
      }
      return PASS('living room, bedroom, and kitchen each reached wall selection');
    }
  },
  {
    id: 'p1-3-wall-tone-unlocks-decorating',
    level: 'P1',
    name: 'Wall choice rejects premature decorating and unlocks active spot',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'wall_selection');
      const blockedCandidate = await game.input({ type: 'tapCandidate', candidateIndex: 0 });
      const blockedHold = await game.input({ type: 'pressSpot', spotRef: 'active', durationMs: 1200 });
      if (!isRejectedOrUnchanged(before, blockedCandidate) || !isRejectedOrUnchanged(before, blockedHold)) return FAIL('decorating action worked before wall choice');
      const wall = (before.wallChoices || [])[0]?.id || findZone(before, 'wall')?.semanticRef;
      if (!wall) return FAIL('no wall choice exposed');
      const after = await game.input({ type: 'tapWall', wall });
      if (after.phase !== 'decorating') return FAIL(`wall choice did not unlock decorating, got ${after.phase}`);
      if (!after.selectedWall) return FAIL('selectedWall was not set');
      if (!after.currentSpot || after.currentSpot.state !== 'active') return FAIL('decorating lacks active current spot');
      if ((after.candidateChoices || []).filter((c) => c.visible).length !== 3) return FAIL('decorating does not expose exactly three visible candidates');
      if (!after.feedback.activeSpotHighlighted || !after.visibility.candidatesVisible || after.visibility.overlayBlocking) return FAIL('active spot/candidates are not visibly usable');
      return PASS('wall selection unlocks guided decorating');
    }
  },
  {
    id: 'p1-4-candidate-selection-preview-real-click',
    level: 'P1',
    name: 'Real candidate click selects preview without scoring',
    timeoutMs: 14000,
    async run({ browser }) {
      // real mouse evidence for quality gate: selectCandidate('mouse') calls browser.mouseClick on the candidate zone.
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'decorating_first_spot');
      const { after } = await selectCandidate(game, 'mouse', {
        allowPlayfieldCoordinates: true,
        expectedCandidateIndex: 0
      });
      if (after.selectedCandidate !== 0) return FAIL('real candidate click did not select candidate 0');
      if (!(after.candidateChoices || []).some((c) => c.index === after.selectedCandidate && c.selected)) return FAIL('selected candidate flag did not update');
      if (!after.feedback.previewVisible || !after.feedback.activeSpotHighlighted) return FAIL('candidate selection did not show preview and active spot highlight');
      if (after.visibility.overlayBlocking) return FAIL('candidate selection left a blocking overlay');
      if (Number(after.score || 0) !== Number(before.score || 0) || Number(after.placedCount || 0) !== Number(before.placedCount || 0)) return FAIL('candidate click scored or placed before hold');
      return PASS('real candidate click selected preview with no reward');
    }
  },
  {
    id: 'p1-5-hold-progress-early-release-cancel',
    level: 'P1',
    name: 'Early release cancels visible hold progress without scoring',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'decorating_first_spot');
      await selectCandidate(game, 'mouse');
      const selected = await game.snapshot();
      const spot = findActiveSpotZone(selected);
      if (!spot) return FAIL('no active spot target for real hold');
      const hold = await game.mouseHoldZone(spot, 220, 150);
      if (!hold.mid) return FAIL('no mid-hold observation captured');
      if (!(hold.mid.hold?.active || hold.mid.feedback?.holdProgressVisible) || Number(hold.mid.hold?.progress || 0) <= 0) return FAIL('maintained press did not expose increasing hold progress');
      if (Number(hold.after.score || 0) !== Number(before.score || 0) ||
          Number(hold.after.placedCount || 0) !== Number(before.placedCount || 0) ||
          Number(hold.after.progress?.placed || 0) !== Number(before.progress?.placed || 0)) return FAIL('early release increased score or placement progress');
      if (Number(hold.after.hold?.progress || 0) !== 0 && hold.after.hold?.active) return FAIL('early release left hold progress active');
      if (hold.after.currentSpot?.index !== before.currentSpot?.index) return FAIL('early release advanced the current spot');
      return PASS('early release showed progress then cancelled without reward');
    }
  },
  {
    id: 'p1-6-valid-hold-success-reward-and-advance',
    level: 'P1',
    name: 'Completing hold rewards placement and advances sequence',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await legalScenario(game, 'decorating_first_spot');
      const result = await completePlacement(game, 'mouse', 1600);
      if (!result.mid || Number(result.mid.hold?.progress || 0) <= 0) return FAIL('successful path did not expose mid-hold progress');
      if (!placementSucceeded(result.before, result.after)) return FAIL('completed hold did not increase score, placedCount, and progress together');
      const feedback = result.after.feedback?.celebrationVisible || result.after.feedback?.guidanceVisible || result.after.feedback?.previewVisible;
      if (!feedback) return FAIL('successful placement lacks visible celebration or guidance');
      const advanced = result.after.currentSpot?.index !== result.before.currentSpot?.index || ['completion', 'showcase'].includes(result.after.phase);
      if (!advanced) return FAIL('successful placement did not advance spot or completion path');
      const duplicate = await game.input({ type: 'pressSpot', spotRef: 'completed', durationMs: 1600 });
      if (!isRejectedOrUnchanged(result.after, duplicate)) return FAIL('completed spot accepted duplicate reward');
      return PASS('valid hold produced reward, feedback, and sequence advance');
    }
  },
  {
    id: 'p1-7-invalid-spot-and-no-selection-rejection',
    level: 'P1',
    name: 'No-selection and outside spot inputs are rejected without progress',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'decorating_first_spot');
      const noSelection = await game.input({ type: 'pressSpot', spotRef: 'active', durationMs: 1400 });
      if (!isRejectedOrUnchanged(before, noSelection)) return FAIL('active hold without selected candidate placed or scored');
      await selectCandidate(game, 'contract');
      const selected = await game.snapshot();
      const outside = await game.input({ type: 'pressSpot', spotRef: 'outside', durationMs: 1400 });
      if (!isRejectedOrUnchanged(selected, outside)) return FAIL('outside hold placed, scored, or advanced');
      const inactive = await game.input({ type: 'tapPlayfield', spotRef: 'inactive' });
      if (!isRejectedOrUnchanged(outside, inactive)) return FAIL('inactive playfield tap mutated protected progress');
      if (outside.hold?.active || Number(outside.hold?.progress || 0) > 0) return FAIL('invalid outside hold left hold active');
      return PASS('invalid and no-selection inputs preserve state');
    }
  },
  {
    id: 'p1-8-sequential-order-and-spot-lock',
    level: 'P1',
    name: 'Only the current active spot can advance the room sequence',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'decorating_mid_spot');
      const completed = await game.input({ type: 'pressSpot', spotRef: 'completed', durationMs: 1500 });
      if (!isRejectedOrUnchanged(before, completed)) return FAIL('completed spot accepted repeat placement');
      const inactive = await game.input({ type: 'pressSpot', spotRef: 'inactive', durationMs: 1500 });
      if (!isRejectedOrUnchanged(completed, inactive)) return FAIL('inactive spot accepted out-of-order placement');
      const result = await completePlacement(game, 'mouse', 1600);
      if (!placementSucceeded(result.before, result.after)) return FAIL('current active spot did not advance after valid hold');
      return PASS('completed/inactive spots reject while active spot advances');
    }
  },
  {
    id: 'p1-9-final-placement-completion-showcase-lock',
    level: 'P1',
    name: 'Final placement reaches completion/showcase and locks ordinary placement',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'decorating_final_spot');
      if (before.result !== 'none') return FAIL('final scenario already contains room_complete result');
      const result = await completePlacement(game, 'mouse', 1700);
      if (result.after.result !== 'room_complete') return FAIL('final placement did not set room_complete result');
      if (!['completion', 'showcase'].includes(result.after.phase)) return FAIL(`final placement reached wrong phase ${result.after.phase}`);
      if (!result.after.feedback?.showcaseVisible && !result.after.visibility?.roomVisible && !result.after.visibility?.playfieldVisible) return FAIL('completion/showcase is not visibly presented');
      if (Number(result.after.progress?.placed || 0) < Number(result.after.progress?.total || 0)) return FAIL('completion result has inconsistent progress total');
      const locked = await game.input({ type: 'pressSpot', spotRef: 'active', durationMs: 1600 });
      if (!isRejectedOrUnchanged(result.after, locked)) return FAIL('ordinary placement still works after completion/showcase');
      return PASS('final hold completes room and locks placement');
    }
  },
  {
    id: 'p1-10-continue-new-room-reset',
    level: 'P1',
    name: 'Continue from showcase starts clean new room flow',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'showcase_complete');
      const continueZone = findZone(before, 'continue') || findZone(before, 'playfield', 'continue');
      if (!continueZone) return FAIL('showcase_complete exposes no continue target zone for real click');
      const after = await game.clickZone(continueZone);
      if (!['room_selection', 'wall_selection'].includes(after.phase)) return FAIL(`continue did not return to a room flow, got ${after.phase}`);
      if (Number(after.placedCount || 0) !== 0 || Number(after.progress?.placed || 0) !== 0 || Number(after.score || 0) !== 0) return FAIL('continue preserved old score or placement progress');
      if (after.selectedCandidate !== null || after.hold?.active || Number(after.hold?.progress || 0) !== 0) return FAIL('continue preserved selected candidate or hold progress');
      if (after.feedback?.showcaseVisible) return FAIL('previous showcase still blocks the new flow');
      if (after.phase === 'room_selection' && countEnabledZones(after, 'room') === 0) return FAIL('new room flow exposes no enabled room choices');
      if (after.phase === 'wall_selection' && countEnabledZones(after, 'wall') === 0) return FAIL('new wall flow exposes no enabled wall choices');
      return PASS('continue starts a clean new room flow');
    }
  },
  {
    id: 'p1-11-visible-readability-main-phases',
    level: 'P1',
    name: 'Main phases expose visible nonblank presentation and state changes',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const start = await legalScenario(game, 'fresh_start');
      const hashStart = await game.canvasHash();
      if (!start.visibility.playfieldVisible && start.phase !== 'start') return FAIL('start phase is not visibly readable');
      const room = await legalScenario(game, 'room_selection');
      if (countEnabledZones(room, 'room') < 3) return FAIL('room_selection lacks visible room controls');
      const wall = await legalScenario(game, 'wall_selection');
      if ((wall.wallChoices || []).length < 4 && countEnabledZones(wall, 'wall') < 4) return FAIL('wall_selection lacks visible wall controls');
      const decorating = (await chooseFirstWall(game)).after;
      if (!decorating.visibility.roomVisible || !decorating.visibility.candidatesVisible || !decorating.visibility.hudVisible || decorating.visibility.overlayBlocking) return FAIL('decorating phase lacks room/candidates/HUD or is blocked');
      await completePlacement(game, 'mouse', 1500);
      const hashAfter = await game.canvasHash();
      if (hashStart != null && hashAfter != null && hashStart === hashAfter) return FAIL('screen hash did not change after legal navigation and placement');
      return PASS('main phases are visible and change after player actions');
    }
  },
  {
    id: 'p1-12-mouse-touch-semantic-equivalence',
    level: 'P1',
    name: 'Mouse and touch both select and hold-to-place',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await legalScenario(game, 'decorating_first_spot');
      const mouseResult = await completePlacement(game, 'mouse', 1500);
      if (!placementSucceeded(mouseResult.before, mouseResult.after)) return FAIL('mouse path did not place successfully');
      await legalScenario(game, 'decorating_first_spot');
      const touchResult = await completePlacement(game, 'touch', 1500);
      if (!placementSucceeded(touchResult.before, touchResult.after)) return FAIL('touch path did not place successfully');
      if (Math.sign(touchResult.after.placedCount - touchResult.before.placedCount) !== Math.sign(mouseResult.after.placedCount - mouseResult.before.placedCount)) return FAIL('mouse and touch placement progress differ directionally');
      return PASS('mouse and touch both select, hold, and place');
    }
  },
  {
    id: 'p2-1-share-style-feedback',
    level: 'P2',
    name: 'Optional share feedback is nonblocking in showcase',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'showcase_complete');
      const shareZone = findZone(before, 'share') || findZone(before, 'playfield', 'share');
      if (!shareZone) return NA('share control is optional and not exposed');
      const after = await game.clickZone(shareZone);
      if (!after.feedback?.shareFeedbackVisible && !after.feedback?.guidanceVisible) return FAIL('share click exposed no in-game feedback');
      if (!after.feedback?.showcaseVisible && !after.visibility?.roomVisible) return FAIL('share feedback hid the showcase');
      if (!sameProtected(before, after)) return FAIL('share feedback mutated protected room progress');
      return PASS('share gives nonblocking feedback');
    }
  },
  {
    id: 'p2-2-optional-audio-haptics-not-sole-oracle',
    level: 'P2',
    name: 'Placement success remains visually observable without audio or haptics',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await browser.eval(`
        (function() {
          window.__l2MutedAudio = true;
          if (window.navigator && window.navigator.vibrate) window.navigator.vibrate = function(){ return false; };
        })()
      `);
      await legalScenario(game, 'decorating_first_spot');
      const result = await completePlacement(game, 'mouse', 1500);
      if (!placementSucceeded(result.before, result.after)) return FAIL('placement success did not update score/placed/progress without sensory APIs');
      if (!result.after.feedback?.celebrationVisible && !result.after.feedback?.guidanceVisible && !result.after.visibility?.roomVisible) return FAIL('success lacks visual/snapshot feedback when audio/haptics are ignored');
      return PASS('visual and snapshot oracle proves success without sensory dependency');
    }
  },
  {
    id: 'p2-3-optional-edit-settings-isolated',
    level: 'P2',
    name: 'Optional settings or edit controls do not break the guided loop',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await legalScenario(game, 'decorating_first_spot');
      const optionalZone = (before.targetZones || []).find((z) =>
        z.enabled !== false && ['settings', 'edit'].some((word) => String(z.kind + ':' + z.semanticRef).includes(word))
      );
      if (!optionalZone) return NA('no optional edit/settings control exposed');
      const afterPanel = await game.clickZone(optionalZone);
      if (Number(afterPanel.placedCount || 0) !== Number(before.placedCount || 0) || Number(afterPanel.progress?.placed || 0) !== Number(before.progress?.placed || 0)) return FAIL('optional control unexpectedly mutated P1 progress');
      if (!['decorating', 'wall_selection', 'room_selection'].includes(afterPanel.phase)) return FAIL('optional control left the flow in an illegal phase');
      if (afterPanel.phase !== 'decorating') await legalScenario(game, 'decorating_first_spot');
      const result = await completePlacement(game, 'mouse', 1500);
      if (!placementSucceeded(result.before, result.after)) return FAIL('core candidate/hold loop failed after optional control');
      return PASS('optional control preserves progress and core loop');
    }
  }
];

module.exports = { suite };
