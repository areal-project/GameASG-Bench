// === GDD Coverage Map ===
// M1 start guide and playable interface: p0-1-contract-ready, p0-2-playfield-readable, p1-1-start-overlay-gates-playfield
// M2 theme levels and layouts: p0-2-playfield-readable, p1-10-p1-level-progression-count
// M3 continuous item dragging: p1-2-real-mouse-drag-axis-direction, p1-3-real-touch-outside-drop-recovers, p1-6-wrong-placement-correction
// M4 release judgment and slot snap: p1-3-real-touch-outside-drop-recovers, p1-4-correct-placement-reward-lock
// M5 correct placement reward: p1-4-correct-placement-reward-lock, p1-5-locked-item-repeat-rejected
// M6 wrong trial and correction: p1-6-wrong-placement-correction
// M7 completion and next step: p1-7-completion-blocks-and-next-cleans
// M8 reset current level: p1-8-reset-restores-current-level
// M9 linear level select: p1-9-level-select-rejects-future
// M10 hint lifecycle: p1-11-hint-single-and-clears-on-drag
// M11 more themes: p2-1-extra-theme-exposure-safe
// M12 editor isolation: p2-2-editor-isolation-optional
// M13 feedback enhancement: p2-3-feedback-revisions-follow-actions, p2-4-invalid-actions-preserve-invariants
// === Rationality Map ===
// p1-1-start-overlay-gates-playfield: M1 | real action: contract start after blocked pre-start drag attempt | independent observation: overlay/canInteract plus progress/item invariants | empty-shell failure: always-playable or permanently-blocked shell fails
// p1-2-real-mouse-drag-axis-direction: M3 | real action: Input.dispatchMouseEvent mouse press and held drag on item | independent observation: item screenX/screenY deltas plus visibleRevision/hash | empty-shell failure: API-only, teleport, mirrored, or no-drag shell fails; direction opposite uses Math.sign
// p1-3-real-touch-outside-drop-recovers: M3/M4 | real action: Input.dispatchTouchEvent touch drag to outside/edge and release | independent observation: item visible/draggable unfinished plus progress/score/result invariant | empty-shell failure: touchless, auto-success, disappearing-item shell fails
// p1-4-correct-placement-reward-lock: M4/M5 | real action: player-level dragItemTo target slot | independent observation: item locked in target plus progress/score/feedback delta | empty-shell failure: ok-only or visual-only placement fails
// p1-5-locked-item-repeat-rejected: M5 | real action: repeat drag of already placed item | independent observation: progress/score/position unchanged and rejection reason | empty-shell failure: duplicate reward farming fails
// p1-6-wrong-placement-correction: M6 | real action: wrong slot drop then correction drag to target | independent observation: wrong trial no progress then target placement exactly once | empty-shell failure: any-slot-correct or stuck-wrong-item shell fails
// p1-7-completion-blocks-and-next-cleans: M7 | real action: complete all items then attempt old input and nextLevel | independent observation: completion panel/result then fresh next/replay level state | empty-shell failure: decorative completion or stale next-level shell fails
// p1-8-reset-restores-current-level: M8 | real action: resetLevel after partial correct/wrong attempts | independent observation: all items unfinished/draggable, score/hint/completion cleared, pairings usable | empty-shell failure: reset-label-only or pairing-corruption shell fails
// p1-9-level-select-rejects-future: M9 | real action: openLevelSelect choose locked/future/invalid level then close | independent observation: panel blocking plus level/progress/score/item invariants | empty-shell failure: unrestricted skipping or state-reset panel fails
// p1-10-p1-level-progression-count: M2/M7 | real action: complete levels and nextLevel across P1 count | independent observation: p1LevelCount, nonempty item/slot layout, fresh progress per visited level | empty-shell failure: single-level clone, empty later level, or broken final flow fails
// p1-11-hint-single-and-clears-on-drag: M10 | real action: requestHint twice then pointerDown drag | independent observation: one highlighted slot, stackCount invariant, hint clears on drag | empty-shell failure: decorative hint, stacked hints, or drag-blocking hint fails
// p2-1-extra-theme-exposure-safe: M11 | real action: choose exposed extra/non-P1 level if available | independent observation: playable extra layout or stable rejection | empty-shell failure: empty exposed bonus level fails
// p2-2-editor-isolation-optional: M12 | real action: enter editor if control exposed, then close/back/reset | independent observation: editing phase isolated or editor unavailable while P1 play remains | empty-shell failure: editor overlay that traps ordinary play fails
// p2-3-feedback-revisions-follow-actions: M13 | real action: correct placement, wait, complete level | independent observation: feedback/visible revisions change without idle score/progress mutation | empty-shell failure: feedback-only or idle-mutating shell fails
// p2-4-invalid-actions-preserve-invariants: M8/M9/M10 | real action: invalid action types and nonexistent ids | independent observation: rejection envelope and level/progress/score/lock invariants | empty-shell failure: permissive test API or thrown-error shell fails

function pass(detail) {
  return { status: 'PASS', detail: detail || '' };
}

function fail(detail) {
  return { status: 'FAIL', detail };
}

function na(detail) {
  return { status: 'NOT_APPLICABLE', detail };
}

function num(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function approxSame(a, b, tolerance) {
  return Math.abs(num(a, 0) - num(b, 0)) <= tolerance;
}

function centerOf(entity) {
  return {
    x: num(entity.screenX, 0),
    y: num(entity.screenY, 0)
  };
}

function itemById(snap, id) {
  return (snap.items || []).find(item => item.id === id);
}

function slotById(snap, id) {
  return (snap.slots || []).find(slot => slot.id === id);
}

function firstDraggableItem(snap) {
  return (snap.items || []).find(item => item.visible && item.draggable && !item.locked && item.state !== 'placed');
}

function firstCorrectPair(snap) {
  const item = firstDraggableItem(snap);
  if (!item) return null;
  const slot = slotById(snap, item.targetSlotId);
  return slot && slot.visible ? { item, slot } : null;
}

function firstWrongPair(snap) {
  const item = firstDraggableItem(snap);
  if (!item) return null;
  const slot = (snap.slots || []).find(s => s.visible && s.id !== item.targetSlotId);
  return slot ? { item, slot } : null;
}

function coreState(snap) {
  const items = (snap.items || []).map(item => ({
    id: item.id,
    state: item.state,
    locked: !!item.locked,
    slotId: item.slotId || null,
    screenX: Math.round(num(item.screenX, 0)),
    screenY: Math.round(num(item.screenY, 0))
  })).sort((a, b) => a.id.localeCompare(b.id));
  return {
    phase: snap.phase,
    screen: snap.screen,
    activePanel: snap.activePanel,
    levelIndex: snap.level && snap.level.index,
    completedCount: snap.level && snap.level.completedCount,
    score: snap.score && snap.score.value,
    combo: snap.score && snap.score.combo,
    result: snap.completion && snap.completion.result,
    panelVisible: snap.completion && snap.completion.panelVisible,
    hintActive: snap.hint && snap.hint.active,
    items
  };
}

function sameCore(a, b) {
  return JSON.stringify(coreState(a)) === JSON.stringify(coreState(b));
}

function assertContractShape(snap) {
  if (!snap || typeof snap !== 'object') return 'snapshot is not an object';
  if (!snap.level || !snap.playfield || !snap.score || !snap.completion || !snap.controls || !snap.feedback || !snap.lastAction) {
    return 'snapshot missing required public groups';
  }
  if (!Array.isArray(snap.items) || !Array.isArray(snap.slots)) return 'snapshot items/slots must be arrays';
  if (typeof snap.overlayBlocking !== 'boolean' || typeof snap.canInteractWithPlayfield !== 'boolean') {
    return 'snapshot missing boolean blocking/interact fields';
  }
  return null;
}

function assertPlayablePrecondition(snap, scenarioName) {
  const shapeError = assertContractShape(snap);
  if (shapeError) return `${scenarioName}: ${shapeError}`;
  if (!snap.level || snap.level.itemTotal <= 0) return `${scenarioName}: itemTotal is not positive`;
  if (!snap.playfield.hasReadableTray || !snap.playfield.hasReadableSlots) return `${scenarioName}: tray/slots are not readable`;
  if (!firstCorrectPair(snap)) return `${scenarioName}: no visible draggable item with target slot`;
  if (snap.completion.result !== 'none') return `${scenarioName}: scenario already completed`;
  return null;
}

function createGameDriver(browser) {
  return {
    async api() {
      return await browser.eval(`(function(){
        var t = window.__gameTest;
        return {
          exists: !!t,
          reset: !!(t && typeof t.reset === 'function'),
          input: !!(t && typeof t.input === 'function'),
          getSnapshot: !!(t && typeof t.getSnapshot === 'function'),
          loadScenario: !!(t && typeof t.loadScenario === 'function')
        };
      })()`);
    },
    async snapshot() {
      return await browser.eval(`(function(){
        if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') return { __missing: true };
        return window.__gameTest.getSnapshot();
      })()`);
    },
    async reset() {
      return await browser.eval(`(function(){
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return { __missing: true };
        return window.__gameTest.reset();
      })()`);
    },
    async input(action) {
      const actionJson = JSON.stringify(action);
      return await browser.eval(`(function(){
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { __missing: true };
        return window.__gameTest.input(${actionJson});
      })()`);
    },
    async loadScenario(name) {
      const nameJson = JSON.stringify(name);
      return await browser.eval(`(function(){
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { __missing: true };
        return window.__gameTest.loadScenario(${nameJson});
      })()`);
    },
    async loadPlayableScenario(name) {
      const snap = await this.loadScenario(name);
      const err = assertPlayablePrecondition(snap, name);
      if (err) throw new Error(err);
      return snap;
    },
    async dragItemTo(itemId, target) {
      return await this.input({ type: 'dragItemTo', itemId, target });
    },
    async visibleHash() {
      return await browser.canvasPixelHash();
    }
  };
}

async function placeOneCorrect(game, snap) {
  const pair = firstCorrectPair(snap);
  if (!pair) throw new Error('no correct pair available');
  const before = clone(snap);
  await game.dragItemTo(pair.item.id, `slot:${pair.slot.id}`);
  await waitForStablePlacement(game);
  const after = await game.snapshot();
  const placed = itemById(after, pair.item.id);
  return { before, after, item: placed, beforeItem: pair.item, slot: pair.slot };
}

async function waitForStablePlacement(game) {
  await game.input({ type: 'wait', ms: 250 });
  await new Promise(resolve => setTimeout(resolve, 250));
}

function visibleRevision(snap) {
  return num(snap.playfield && snap.playfield.visibleRevision, 0) +
    num(snap.feedback && snap.feedback.successRevision, 0) +
    num(snap.feedback && snap.feedback.errorRevision, 0) +
    num(snap.feedback && snap.feedback.hintRevision, 0) +
    num(snap.feedback && snap.feedback.celebrationRevision, 0);
}

function scoreValue(snap) {
  return num(snap.score && snap.score.value, 0);
}

function completedCount(snap) {
  return num(snap.level && snap.level.completedCount, 0);
}

async function completeCurrentLevel(game, maxSteps) {
  let snap = await game.snapshot();
  const total = num(snap.level && snap.level.itemTotal, 0);
  const limit = maxSteps || Math.max(total + 2, 4);
  for (let i = 0; i < limit; i++) {
    snap = await game.snapshot();
    if (snap.completion && snap.completion.result === 'levelComplete') return snap;
    if (completedCount(snap) >= total && total > 0) {
      await game.input({ type: 'wait', ms: 400 });
      return await game.snapshot();
    }
    await placeOneCorrect(game, snap);
  }
  return await game.snapshot();
}

const suite = [
  {
    id: 'p0-1-contract-ready',
    level: 'P0',
    name: 'Public TDD contract is callable and returns a snapshot envelope',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const api = await game.api();
      if (!api.exists || !api.reset || !api.input || !api.getSnapshot || !api.loadScenario) {
        return fail(`missing __gameTest methods: ${JSON.stringify(api)}`);
      }
      const snap = await game.reset();
      const shapeError = assertContractShape(snap);
      if (shapeError) return fail(shapeError);
      if (!['booting', 'intro', 'menu', 'playing', 'dragging', 'paused', 'levelSelect', 'completed', 'editing'].includes(snap.phase)) {
        return fail(`invalid phase ${snap.phase}`);
      }
      return pass(`phase=${snap.phase}, items=${snap.items.length}, slots=${snap.slots.length}`);
    }
  },
  {
    id: 'p0-2-playfield-readable',
    level: 'P0',
    name: 'Started level exposes readable tray, slots, items, controls, and nonblank visible evidence',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let snap = await game.loadScenario('level_start');
      const preError = assertPlayablePrecondition(snap, 'level_start');
      if (preError) return fail(preError);
      if (snap.overlayBlocking || !snap.canInteractWithPlayfield) {
        await game.input({ type: 'start' });
        snap = await game.snapshot();
      }
      const shapeError = assertContractShape(snap);
      if (shapeError) return fail(shapeError);
      if (!snap.playfield.hasReadableTray || !snap.playfield.hasReadableSlots) return fail('playfield tray or slots not readable');
      if (snap.items.length <= 0 || snap.slots.length <= 0) return fail('empty item/slot summary');
      if (completedCount(snap) < 0 || completedCount(snap) > num(snap.level.itemTotal, -1)) return fail('completedCount out of range');
      const hash = await game.visibleHash();
      if (hash === null && visibleRevision(snap) <= 0) return fail('no canvas/screen hash and no visible revision evidence');
      return pass(`items=${snap.items.length}, slots=${snap.slots.length}, revision=${visibleRevision(snap)}`);
    }
  },
  {
    id: 'p1-1-start-overlay-gates-playfield',
    level: 'P1',
    name: 'Start overlay rejects playfield input before start and clears after start',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const boot = await game.loadScenario('boot');
      const shapeError = assertContractShape(boot);
      if (shapeError) return fail(`boot: ${shapeError}`);
      const before = clone(boot);
      await game.input({ type: 'pointerDown', screenX: 30, screenY: 30 });
      const blocked = await game.snapshot();
      if (!before.overlayBlocking && before.canInteractWithPlayfield) {
        return fail('boot scenario does not expose a blocking intro/menu precondition');
      }
      if (completedCount(blocked) !== completedCount(before) || scoreValue(blocked) !== scoreValue(before)) {
        return fail('pre-start playfield input changed progress or score');
      }
      const afterStart = await game.input({ type: 'start' });
      if (afterStart.overlayBlocking || !afterStart.canInteractWithPlayfield) {
        return fail('start did not clear blocking overlay and enable playfield');
      }
      const pair = firstCorrectPair(afterStart);
      if (!pair) return fail('no draggable item after start');
      const down = await game.input({ type: 'pointerDown', itemId: pair.item.id });
      const active = itemById(down, pair.item.id);
      if (!active || active.state !== 'dragging') return fail('pointerDown after start did not enter dragging state');
      return pass('intro/menu blocks before start and drag begins after start');
    }
  },
  {
    id: 'p1-2-real-mouse-drag-axis-direction',
    level: 'P1',
    name: 'Real mouse drag follows same screen direction and proves direction opposite on both axes',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('level_start');
      const pair = firstCorrectPair(start);
      const p = centerOf(pair.item);
      const beforeHash = await game.visibleHash();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(120);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x + 80, y: p.y, button: 'left', modifiers: 0, movementX: 80, movementY: 0 });
      await browser.sleep(180);
      const right = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x - 80, y: p.y, button: 'left', modifiers: 0, movementX: -160, movementY: 0 });
      await browser.sleep(180);
      const left = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y + 80, button: 'left', modifiers: 0, movementX: 80, movementY: 80 });
      await browser.sleep(180);
      const down = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y - 80, button: 'left', modifiers: 0, movementX: 0, movementY: -160 });
      await browser.sleep(180);
      const up = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y - 80, button: 'left', clickCount: 1, modifiers: 0 });
      const rItem = itemById(right, pair.item.id);
      const lItem = itemById(left, pair.item.id);
      const dItem = itemById(down, pair.item.id);
      const uItem = itemById(up, pair.item.id);
      if (!rItem || !lItem || !dItem || !uItem) return fail('dragged item missing from snapshots');
      if (rItem.state !== 'dragging' || lItem.state !== 'dragging' || dItem.state !== 'dragging' || uItem.state !== 'dragging') {
        return fail('held mouse input did not maintain dragging state');
      }
      const xRight = rItem.screenX - pair.item.screenX;
      const xLeft = lItem.screenX - rItem.screenX;
      const yDown = dItem.screenY - lItem.screenY;
      const yUp = uItem.screenY - dItem.screenY;
      if (Math.sign(xRight) !== 1 || Math.sign(xLeft) !== -1) {
        return fail(`horizontal direction opposite failed: right=${xRight}, left=${xLeft}`);
      }
      if (Math.sign(yDown) !== 1 || Math.sign(yUp) !== -1) {
        return fail(`vertical direction opposite failed: down=${yDown}, up=${yUp}`);
      }
      const b = start.playfield.bounds;
      const inside = [rItem, lItem, dItem, uItem].every(item =>
        item.visible &&
        item.screenX >= b.screenX &&
        item.screenX <= b.screenX + b.width &&
        item.screenY >= b.screenY &&
        item.screenY <= b.screenY + b.height
      );
      if (!inside) return fail('dragged item left playfield bounds or became invisible');
      const afterHash = await game.visibleHash();
      if (beforeHash === afterHash && visibleRevision(up) <= visibleRevision(start)) {
        return fail('real mouse drag produced no visible revision/hash change');
      }
      return pass(`direction opposite x=${Math.sign(xRight)}/${Math.sign(xLeft)}, y=${Math.sign(yDown)}/${Math.sign(yUp)}`);
    }
  },
  {
    id: 'p1-3-real-touch-outside-drop-recovers',
    level: 'P1',
    name: 'Real touch outside release leaves item recoverable without progress gain',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('outside_drop_ready');
      const pair = firstCorrectPair(start);
      const p = centerOf(pair.item);
      const b = start.playfield.bounds;
      const edge = { x: Math.max(b.screenX + 4, b.screenX + b.width - 8), y: Math.max(b.screenY + 4, b.screenY + 8) };
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1, radiusX: 2, radiusY: 2, force: 1 }] });
      await browser.sleep(120);
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: edge.x, y: edge.y, id: 1, radiusX: 2, radiusY: 2, force: 1 }] });
      await browser.sleep(160);
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await waitForStablePlacement(game);
      const after = await game.snapshot();
      const item = itemById(after, pair.item.id);
      if (!item) return fail('touched item missing after outside release');
      if (completedCount(after) !== completedCount(start)) return fail('outside release changed completion progress');
      if (scoreValue(after) !== scoreValue(start)) return fail('outside release changed score');
      if ((after.completion && after.completion.result) !== 'none') return fail('outside release triggered completion');
      if (item.locked || item.state === 'placed' || !item.visible || !item.draggable) {
        return fail(`outside release did not leave item recoverable: state=${item.state}, locked=${item.locked}`);
      }
      const bounds = after.playfield.bounds;
      if (item.screenX < bounds.screenX || item.screenX > bounds.screenX + bounds.width || item.screenY < bounds.screenY || item.screenY > bounds.screenY + bounds.height) {
        return fail('outside release left item outside playable bounds');
      }
      return pass('touch outside release preserved recoverable unfinished item');
    }
  },
  {
    id: 'p1-4-correct-placement-reward-lock',
    level: 'P1',
    name: 'Correct placement snaps to target, locks item, advances progress and feedback',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('level_start');
      const result = await placeOneCorrect(game, start);
      const after = result.after;
      const item = result.item;
      if (!item) return fail('placed item missing after correct drag');
      if (item.state !== 'placed' || !item.locked || item.slotId !== result.beforeItem.targetSlotId) {
        return fail(`correct placement did not lock in target: state=${item.state}, locked=${item.locked}, slot=${item.slotId}`);
      }
      if (completedCount(after) !== completedCount(start) + 1) return fail('correct placement did not increase completedCount by exactly 1');
      if (scoreValue(after) < scoreValue(start)) return fail('score decreased after correct placement');
      if (scoreValue(after) === scoreValue(start) && (after.completion && after.completion.result) !== 'levelComplete') {
        return fail('score did not increase for non-final correct placement');
      }
      if (visibleRevision(after) <= visibleRevision(start)) return fail('correct placement produced no visible/feedback revision');
      const slot = slotById(after, result.beforeItem.targetSlotId);
      if (slot && (!approxSame(item.screenX, slot.screenX, Math.max(slot.width, item.width)) || !approxSame(item.screenY, slot.screenY, Math.max(slot.height, item.height)))) {
        return fail('placed item is not near target slot semantic center');
      }
      return pass(`completed ${completedCount(start)} -> ${completedCount(after)}, score ${scoreValue(start)} -> ${scoreValue(after)}`);
    }
  },
  {
    id: 'p1-5-locked-item-repeat-rejected',
    level: 'P1',
    name: 'Locked correct item cannot be dragged again for duplicate reward',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('level_start');
      const placed = await placeOneCorrect(game, start);
      const locked = placed.item;
      const beforeRepeat = clone(placed.after);
      const repeatResult = await game.dragItemTo(locked.id, `slot:${locked.targetSlotId}`);
      await waitForStablePlacement(game);
      const afterRepeat = await game.snapshot();
      const repeated = itemById(afterRepeat, locked.id);
      if (!repeated || !repeated.locked || repeated.state !== 'placed') return fail('locked item became unlocked after repeat drag');
      if (completedCount(afterRepeat) !== completedCount(beforeRepeat)) return fail('repeat drag changed completedCount');
      if (scoreValue(afterRepeat) !== scoreValue(beforeRepeat)) return fail('repeat drag changed score');
      if (!approxSame(repeated.screenX, locked.screenX, Math.max(locked.width || 40, 40)) || !approxSame(repeated.screenY, locked.screenY, Math.max(locked.height || 40, 40))) {
        return fail('repeat drag moved locked item materially');
      }
      // `waitForStablePlacement` is an observation step and may legitimately
      // overwrite lastAction with a successful wait. Inspect the result of the
      // attempted repeat gesture for the rejection reason instead.
      const repeatAction = repeatResult && repeatResult.lastAction;
      const reason = repeatAction && repeatAction.reason;
      if (repeatAction && repeatAction.ok === true && !['lockedItem', 'notInteractable', 'alreadyComplete'].includes(reason)) {
        return fail('repeat drag was not rejected or stabilized by a lock reason');
      }
      return pass('duplicate scoring and locked-item mutation rejected');
    }
  },
  {
    id: 'p1-6-wrong-placement-correction',
    level: 'P1',
    name: 'Wrong slot trial stays unfinished and can be corrected to target',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('wrong_choice_ready');
      const wrong = firstWrongPair(start);
      if (!wrong) return fail('wrong_choice_ready has no non-target slot');
      await game.dragItemTo(wrong.item.id, `slot:${wrong.slot.id}`);
      await waitForStablePlacement(game);
      const wrongAfter = await game.snapshot();
      const trial = itemById(wrongAfter, wrong.item.id);
      if (!trial) return fail('wrong-trial item missing');
      if (completedCount(wrongAfter) !== completedCount(start)) return fail('wrong placement changed completedCount');
      if ((wrongAfter.completion && wrongAfter.completion.result) !== 'none') return fail('wrong placement completed level');
      if (trial.locked || trial.state === 'placed' || trial.slotId === trial.targetSlotId) {
        return fail(`wrong placement incorrectly locked/completed item: state=${trial.state}, slot=${trial.slotId}`);
      }
      if (visibleRevision(wrongAfter) <= visibleRevision(start) && scoreValue(wrongAfter) !== scoreValue(start)) {
        return fail('wrong placement changed score without visible/error feedback');
      }
      const beforeCorrectionCount = completedCount(wrongAfter);
      await game.dragItemTo(trial.id, `slot:${trial.targetSlotId}`);
      await waitForStablePlacement(game);
      const corrected = await game.snapshot();
      const correctedItem = itemById(corrected, trial.id);
      if (!correctedItem || correctedItem.state !== 'placed' || !correctedItem.locked || correctedItem.slotId !== trial.targetSlotId) {
        return fail('wrong item could not be corrected to target');
      }
      if (completedCount(corrected) !== beforeCorrectionCount + 1) return fail('correction did not increase progress exactly once');
      if (scoreValue(corrected) < scoreValue(wrongAfter)) return fail('score decreased on correction');
      return pass('wrong trial was recoverable and corrected once');
    }
  },
  {
    id: 'p1-7-completion-blocks-and-next-cleans',
    level: 'P1',
    name: 'Completing a level shows terminal panel, blocks old play, and next/retry cleans state',
    timeoutMs: 45000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.loadPlayableScenario('level_start');
      const completed = await completeCurrentLevel(game);
      if (!completed.completion || completed.completion.result !== 'levelComplete') return fail('level did not reach levelComplete after all correct drags');
      if (!completed.completion.panelVisible) return fail('completion panel not visible');
      if (completedCount(completed) !== num(completed.level.itemTotal, -1)) return fail('completion count does not equal itemTotal');
      const oldState = clone(completed);
      const oldItem = (completed.items || [])[0];
      if (oldItem) {
        await game.input({ type: 'pointerDown', itemId: oldItem.id });
        await game.input({ type: 'pointerMove', dx: 60, dy: 0 });
        await game.input({ type: 'pointerUp', screenX: oldItem.screenX + 60, screenY: oldItem.screenY });
      }
      const blocked = await game.snapshot();
      if (completedCount(blocked) !== completedCount(oldState) || scoreValue(blocked) !== scoreValue(oldState)) {
        return fail('old playfield input changed score/progress while completion panel visible');
      }
      const next = await game.input({ type: 'nextLevel' });
      if (next.completion && next.completion.panelVisible) return fail('nextLevel left completion panel visible');
      if (completedCount(next) !== 0) return fail('nextLevel/replay did not reset completedCount');
      if (scoreValue(next) !== 0 || num(next.score && next.score.combo, 0) !== 0) return fail('nextLevel/replay did not reset score/combo');
      if (next.hint && next.hint.active) return fail('nextLevel/replay carried active hint');
      if (!firstCorrectPair(next)) return fail('nextLevel/replay did not expose a fresh playable layout');
      return pass(`completed level ${oldState.level.index}, next/replay level ${next.level.index}`);
    }
  },
  {
    id: 'p1-8-reset-restores-current-level',
    level: 'P1',
    name: 'Reset clears partial progress, hints, scores, completion, and preserves pairings',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('wrong_choice_ready');
      const correct = await placeOneCorrect(game, start);
      const wrongBase = await game.snapshot();
      const wrong = firstWrongPair(wrongBase);
      if (wrong) {
        await game.dragItemTo(wrong.item.id, `slot:${wrong.slot.id}`);
        await waitForStablePlacement(game);
      }
      await game.input({ type: 'requestHint' });
      const partial = await game.snapshot();
      if (completedCount(partial) <= 0) return fail('partial setup did not create progress to reset');
      const beforeTargets = new Map((partial.items || []).map(item => [item.id, item.targetSlotId]));
      const reset = await game.input({ type: 'resetLevel' });
      if (reset.level.index !== partial.level.index) return fail('reset changed current level index');
      if (completedCount(reset) !== 0) return fail('reset did not clear completedCount');
      if (scoreValue(reset) !== 0 || num(reset.score && reset.score.combo, 0) !== 0) return fail('reset did not clear score/combo');
      if (reset.hint && reset.hint.active) return fail('reset did not clear hint');
      if (reset.completion && reset.completion.panelVisible) return fail('reset left completion panel visible');
      const badItems = (reset.items || []).filter(item => item.locked || item.state === 'placed' || !item.visible || !item.draggable);
      if (badItems.length) return fail(`reset left non-draggable/placed items: ${badItems.map(i => i.id).join(',')}`);
      for (const item of reset.items || []) {
        if (beforeTargets.has(item.id) && beforeTargets.get(item.id) !== item.targetSlotId) {
          return fail(`reset changed pairing for ${item.id}`);
        }
      }
      const afterPair = await placeOneCorrect(game, reset);
      if (completedCount(afterPair.after) !== 1) return fail('post-reset pairings are not usable for correct placement');
      return pass('reset produced a fresh playable current level');
    }
  },
  {
    id: 'p1-9-level-select-rejects-future',
    level: 'P1',
    name: 'Level select blocks playfield and rejects future or invalid level without mutation',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('level_select_ready');
      const progress = await placeOneCorrect(game, start);
      const before = await game.snapshot();
      const opened = await game.input({ type: 'openLevelSelect' });
      if (opened.activePanel !== 'levelSelect' && opened.screen !== 'levelSelect' && opened.phase !== 'levelSelect') {
        return fail('openLevelSelect did not expose level-select panel state');
      }
      if (!opened.overlayBlocking) return fail('level-select panel does not block playfield');
      const locked = (opened.level.lockedLevelIndexes || [])[0];
      const future = locked != null ? locked : num(opened.level.index, 0) + 99;
      const rejected = await game.input({ type: 'chooseLevel', levelIndex: future });
      if (rejected.lastAction && rejected.lastAction.ok !== false && rejected.level.index !== before.level.index) {
        return fail('future/locked level was accepted or changed level');
      }
      if (rejected.level.index !== before.level.index || completedCount(rejected) !== completedCount(before) || scoreValue(rejected) !== scoreValue(before)) {
        return fail('rejected level choice mutated current level, progress, or score');
      }
      const beforeItems = JSON.stringify(coreState(before).items);
      const afterItems = JSON.stringify(coreState(rejected).items);
      if (beforeItems !== afterItems) return fail('rejected level choice mutated item states');
      const closed = await game.input({ type: 'closePanel' });
      if (closed.overlayBlocking || !closed.canInteractWithPlayfield) return fail('closePanel did not restore playfield interaction');
      if (!progress.item) return fail('partial setup did not place item');
      return pass('future/locked level rejection preserved state');
    }
  },
  {
    id: 'p1-10-p1-level-progression-count',
    level: 'P1',
    name: 'At least five P1 levels are playable and each visited level loads fresh layout',
    timeoutMs: 90000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      let snap = await game.loadPlayableScenario('level_start');
      if (num(snap.level.p1LevelCount, 0) < 5) return fail(`p1LevelCount ${snap.level.p1LevelCount} is below 5`);
      const visited = new Set();
      const targetVisits = Math.min(num(snap.level.p1LevelCount, 5), 5);
      for (let i = 0; i < targetVisits; i++) {
        snap = await game.snapshot();
        if (!firstCorrectPair(snap)) return fail(`level ${snap.level.index} has no playable item/slot pair`);
        if (snap.items.length <= 0 || snap.slots.length <= 0) return fail(`level ${snap.level.index} has empty layout`);
        if (completedCount(snap) !== 0) return fail(`level ${snap.level.index} did not start fresh`);
        visited.add(String(snap.level.index));
        const completed = await completeCurrentLevel(game);
        if (!completed.completion || completed.completion.result !== 'levelComplete') return fail(`level ${snap.level.index} could not be completed`);
        const next = await game.input({ type: 'nextLevel' });
        if (i < targetVisits - 1 && completedCount(next) !== 0) return fail('next P1 level did not reset completedCount');
      }
      if (visited.size < targetVisits) return fail(`visited only ${visited.size}/${targetVisits} distinct P1 level states`);
      return pass(`visited ${visited.size} playable P1 levels`);
    }
  },
  {
    id: 'p1-11-hint-single-and-clears-on-drag',
    level: 'P1',
    name: 'Hint highlights one target, does not stack, and clears when dragging begins',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('hint_ready');
      const first = await game.input({ type: 'requestHint' });
      if (!first.hint || !first.hint.active || !first.hint.highlightedSlotId) return fail('first hint did not activate a highlighted target slot');
      if (num(first.hint.stackCount, 0) !== 1) return fail(`first hint stackCount expected 1, got ${first.hint.stackCount}`);
      const highlighted = slotById(first, first.hint.highlightedSlotId);
      if (!highlighted || !highlighted.visible || !highlighted.highlighted) return fail('highlighted hint slot not visible/highlighted in snapshot');
      if (visibleRevision(first) <= visibleRevision(start)) return fail('hint produced no feedback/visible revision');
      const second = await game.input({ type: 'requestHint' });
      if (num(second.hint && second.hint.stackCount, 0) !== 1) return fail('repeated hint stacked duplicate highlights');
      if (completedCount(second) !== completedCount(start) || scoreValue(second) !== scoreValue(start)) return fail('hint changed progress or score');
      const pair = firstCorrectPair(second);
      if (!pair) return fail('no draggable item after hint');
      const drag = await game.input({ type: 'pointerDown', itemId: pair.item.id });
      const active = itemById(drag, pair.item.id);
      if (!active || active.state !== 'dragging') return fail('drag did not begin after hint');
      if (drag.hint && drag.hint.active) return fail('hint did not clear on drag start');
      return pass('single hint lifecycle works');
    }
  },
  {
    id: 'p2-1-extra-theme-exposure-safe',
    level: 'P2',
    name: 'Exposed extra themes are playable or rejected without breaking P1 state',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('level_start');
      const extraIndex = num(start.level.p1LevelCount, 5) + 1;
      if (!(start.level.availableLevelIndexes || []).includes(extraIndex) && !(start.level.lockedLevelIndexes || []).includes(extraIndex)) {
        return na('no extra theme exposed beyond P1 count');
      }
      const before = clone(start);
      await game.input({ type: 'openLevelSelect' });
      const result = await game.input({ type: 'chooseLevel', levelIndex: extraIndex });
      if (result.lastAction && result.lastAction.ok === false) {
        if (result.level.index !== before.level.index || completedCount(result) !== completedCount(before) || scoreValue(result) !== scoreValue(before)) {
          return fail('rejected extra theme mutated P1 state');
        }
        return pass('extra theme unavailable and safely rejected');
      }
      if (!firstCorrectPair(result) || result.items.length <= 0 || result.slots.length <= 0) {
        return fail('exposed extra theme loaded empty or unplayable layout');
      }
      const placed = await placeOneCorrect(game, result);
      if (completedCount(placed.after) !== completedCount(result) + 1) return fail('exposed extra theme cannot accept a correct placement');
      return pass('exposed extra theme is playable');
    }
  },
  {
    id: 'p2-2-editor-isolation-optional',
    level: 'P2',
    name: 'Optional editor is isolated, or explicitly unavailable while P1 remains playable',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('editor_available');
      if (!start.controls || !start.controls.editor) {
        if (!start.canInteractWithPlayfield || !firstCorrectPair(start)) return fail('editor absent but P1 play is not available');
        return na('editor unavailable by contract and P1 play remains usable');
      }
      const entered = await game.input({ type: 'openEditor' });
      if (entered.phase !== 'editing' && entered.screen !== 'editor' && entered.activePanel !== 'editor') {
        return fail('editor control exists but does not enter editing/editor state');
      }
      if (entered.canInteractWithPlayfield && entered.phase === 'editing') return fail('editor state is not isolated from ordinary play controls');
      const restored = await game.input({ type: 'closePanel' });
      if (restored.overlayBlocking || !restored.canInteractWithPlayfield || !firstCorrectPair(restored)) {
        return fail('closing editor did not restore ordinary play');
      }
      return pass('editor is isolated and ordinary play recovers');
    }
  },
  {
    id: 'p2-3-feedback-revisions-follow-actions',
    level: 'P2',
    name: 'Feedback revisions follow placement/completion and idle wait does not mutate gameplay',
    timeoutMs: 32000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('level_start');
      const placed = await placeOneCorrect(game, start);
      if (visibleRevision(placed.after) <= visibleRevision(start)) return fail('correct placement produced no feedback/visible revision');
      const idleBefore = await game.snapshot();
      await game.input({ type: 'wait', ms: 700 });
      const idleAfter = await game.snapshot();
      if (completedCount(idleAfter) !== completedCount(idleBefore) || scoreValue(idleAfter) !== scoreValue(idleBefore)) {
        return fail('idle wait mutated progress or score');
      }
      const completed = await completeCurrentLevel(game);
      if (!completed.completion || completed.completion.result !== 'levelComplete') return fail('completion was not reached for feedback check');
      if (num(completed.feedback && completed.feedback.celebrationRevision, 0) <= num(idleAfter.feedback && idleAfter.feedback.celebrationRevision, 0) &&
          visibleRevision(completed) <= visibleRevision(idleAfter)) {
        return fail('completion produced no celebration/visible feedback revision');
      }
      return pass('feedback revisions are tied to actions, idle is stable');
    }
  },
  {
    id: 'p2-4-invalid-actions-preserve-invariants',
    level: 'P2',
    name: 'Invalid public actions reject cleanly without unrelated mutation',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const start = await game.loadPlayableScenario('level_start');
      const before = clone(await game.snapshot());
      const badActions = [
        { type: 'notARealAction', completedCount: 999, score: 999 },
        { type: 'dragItemTo', itemId: '__missing_item__', target: 'slot:__missing_slot__' },
        { type: 'chooseLevel', levelIndex: -999 },
        { type: 'pointerDown', itemId: '__missing_item__' },
        { type: 'pointerUp', slotId: '__missing_slot__' }
      ];
      for (const action of badActions) {
        let after;
        try {
          after = await game.input(action);
        } catch (e) {
          return fail(`invalid action threw: ${action.type}: ${e.message}`);
        }
        if (!after || !after.lastAction) return fail(`invalid action ${action.type} did not return snapshot/lastAction`);
        if (after.lastAction.ok !== false && !['invalidAction', 'notInteractable', 'invalidLevel', 'noTarget', 'blockedByOverlay'].includes(after.lastAction.reason)) {
          return fail(`invalid action ${action.type} was not rejected`);
        }
        if (after.level.index !== before.level.index || completedCount(after) !== completedCount(before) || scoreValue(after) !== scoreValue(before)) {
          return fail(`invalid action ${action.type} mutated level/progress/score`);
        }
        const beforeLocks = (before.items || []).map(item => `${item.id}:${item.locked}:${item.state}:${item.slotId || ''}`).sort().join('|');
        const afterLocks = (after.items || []).map(item => `${item.id}:${item.locked}:${item.state}:${item.slotId || ''}`).sort().join('|');
        if (beforeLocks !== afterLocks) return fail(`invalid action ${action.type} mutated item lock/state/slot`);
      }
      return pass('invalid actions rejected and invariants preserved');
    }
  }
];

module.exports = { suite };
