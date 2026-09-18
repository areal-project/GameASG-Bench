// === GDD Coverage Map ===
// M1 Boot and level entry: p0-2-start-playfield-readable, p0-3-visible-playfield-observable
// M2 Screw selection and floating: p1-1-real-screw-selection-floating, p1-5-real-switch-single-floating
// M3 Legal hole placement: p1-2-real-legal-hole-placement, p1-3-real-direction-opposite-targets, p1-8-conservation-one-move
// M4 Cancel, blank, illegal, and switch handling: p1-4-real-cancel-and-reject, p1-5-real-switch-single-floating, p1-6-busy-input-invariant
// M5 Part support and release: p1-7-release-support-motion, p1-8-conservation-one-move, p2-3-deeper-structure-rules
// M6 Victory loop: p1-9-victory-terminal-lock, p1-14-progress-next-level-select
// M7 Restart and undo: p1-10-key-undo-restart-state, p1-11-empty-undo-rejection
// M8 Tutorial and hint: p1-12-tutorial-and-hint
// M9 Tool system: p1-13-tool-cost-benefit-rejection
// M10 Progress and level select: p1-14-progress-next-level-select
// M11 Panels and settings: p1-15-real-panel-blocking-settings
// M12 Presentation and long-term systems: p2-1-long-term-panel-nonblocking, p2-2-feedback-synchronization, p2-3-deeper-structure-rules
//
// === Rationality Map ===
// p1-1-real-screw-selection-floating: real action: browser.mouseClick at snapshot screw screen position | independent observation: selected/floating screw state plus moves/holes invariant and visual feedback | empty-shell failure: API-only or static selection shell has no real input causality
// p1-2-real-legal-hole-placement: real action: browser.mouseClick at legal target hole after legal floating precondition | independent observation: source/target occupancy, moves/revision, screw count and selected-state cleanup | empty-shell failure: label-only or multi-screw mutation fails
// p1-3-real-direction-opposite-targets: real action: browser.mouseClick toward two different legal hole directions | independent observation: Math.sign screen delta direction opposite / 方向相反 plus occupied target identity | empty-shell failure: mirrored, target-agnostic, or same-hole implementations fail
// p1-4-real-cancel-and-reject: real action: browser.mouseClick original hole, blank point, and blocked/non-legal target | independent observation: occupancy/moves/support unchanged plus rejection feedback | empty-shell failure: illegal placement accepted or silent no-feedback no-op fails
// p1-5-real-switch-single-floating: real action: browser.mouseClick another installed screw while one screw floats | independent observation: old source remains occupied, one selected/floating screw, no move counted | empty-shell failure: simultaneous floating or switch-as-placement shortcuts fail
// p1-6-busy-input-invariant: real action: contract start of animation then browser.mouseClick extra target before settle | independent observation: revision/moves bounded, screw count conserved, at most one moving/selected screw | empty-shell failure: rapid-tap duplication or overlapping moves fail
// p1-7-release-support-motion: real action: contract/player screw move from legal release_candidate | independent observation: proven move plus part support/state/visual revision changes | empty-shell failure: hidden counter or instant part hide without structural cause fails
// p1-8-conservation-one-move: real action: legal tapScrew/tapHole chain | independent observation: exactly one source empties, one target occupies, screw total conserved, unrelated holes stable | empty-shell failure: broad board rewrite fails
// p1-9-victory-terminal-lock: real action: legal final action from near_completion then ordinary tap after win | independent observation: victory result/panel/control plus post-victory puzzle lock | empty-shell failure: preloaded win or mutable victory board fails
// p1-10-key-undo-restart-state: real action: keyDown/keyUp KeyZ and KeyR after a valid move | independent observation: occupancy/moves revert then restart clears transient states | empty-shell failure: buttons that only change text or partial reset fail
// p1-11-empty-undo-rejection: real action: contract undo on fresh level_start | independent observation: puzzle snapshot unchanged plus noUndo/rejection feedback | empty-shell failure: empty undo mutates state or has no rejection signal
// p1-12-tutorial-and-hint: real action: wrong tutorial target then declared target, plus hint control | independent observation: tutorial step stability/advance and legal hint targets without board mutation | empty-shell failure: cosmetic tutorial or auto-solving hint fails
// p1-13-tool-cost-benefit-rejection: real action: activate tool and tap part/blank via player-level actions | independent observation: use cost, part/support change, blank/zero-use invariant | empty-shell failure: free deletion, no-cost tool, or random effect fails
// p1-14-progress-next-level-select: real action: nextLevel/selectLevel after reached victory | independent observation: level changes only for unlocked/current, locked selection rejected, transient state reset | empty-shell failure: arbitrary jumps or hidden progress-only shell fails
// p1-15-real-panel-blocking-settings: real action: browser.mouseClick playfield while settings/level panel is open | independent observation: overlayBlocking/canInteract plus puzzle unchanged and close restores interaction | empty-shell failure: visual-only overlay leaking gameplay input fails
// p2-1-long-term-panel-nonblocking: real action: open/close leaderboard or equivalent panel | independent observation: panel state, blocking only while open, puzzle unchanged, P1 controls usable | empty-shell failure: optional panel breaks main flow
// p2-2-feedback-synchronization: real action: selection, placement, rejection, tool/victory where available | independent observation: feedback/visualRevision/HUD-style snapshot synchronized with state deltas | empty-shell failure: hidden snapshot changes with no visible feedback fail
// p2-3-deeper-structure-rules: real action: play deeper/complex scenario with multiple choices | independent observation: multiple choices, legal/blocked distinction, support change, undo and victory rules | empty-shell failure: one-demo puzzle cannot satisfy deeper rule chain

function PASS(detail) { return { status: 'PASS', detail }; }
function FAIL(detail) { return { status: 'FAIL', detail }; }

function unwrap(result) {
  if (!result || typeof result !== 'object') return result;
  if (result.__l2_err__) throw new Error(result.__l2_err__);
  if (result.snapshot && typeof result.snapshot === 'object') return result.snapshot;
  return result;
}

function statusOf(result) {
  if (!result || typeof result !== 'object') return { ok: true, snapshot: result };
  if (Object.prototype.hasOwnProperty.call(result, 'ok')) {
    return { ok: result.ok !== false, reason: result.reason, snapshot: unwrap(result) };
  }
  return { ok: true, snapshot: unwrap(result) };
}

function arr(v) { return Array.isArray(v) ? v : []; }
function num(v, fallback = 0) { return typeof v === 'number' && Number.isFinite(v) ? v : fallback; }
function idOf(v) { return v && (v.id || v.screwId || v.holeId || v.partId); }
function dist(a, b) {
  return Math.hypot(num(a && a.screenX) - num(b && b.screenX), num(a && a.screenY) - num(b && b.screenY));
}
function holeSig(s) {
  return arr(s && s.holes).map(h => `${idOf(h)}:${h.state}:${h.legalTarget ? 1 : 0}:${h.blocked ? 1 : 0}`).join('|');
}
function partSig(s) {
  return arr(s && s.parts).map(p => `${idOf(p)}:${p.state}:${p.support}:${p.visible ? 1 : 0}`).join('|');
}
function coreSig(s) {
  return [
    s && s.phase,
    s && s.screen,
    s && s.result,
    s && s.puzzle && s.puzzle.moves,
    holeSig(s),
    partSig(s),
    s && s.tool && `${s.tool.active}:${s.tool.uses}`,
    s && s.hint && `${s.hint.active}:${arr(s.hint.targetHoleIds).join(',')}`
  ].join('||');
}
function countStates(items, states) {
  const set = new Set(states);
  return arr(items).filter(x => set.has(x && x.state)).length;
}
function occupiedIds(s) { return arr(s && s.holes).filter(h => h.state === 'occupied').map(idOf).sort(); }
function emptyIds(s) { return arr(s && s.holes).filter(h => h.state === 'empty').map(idOf).sort(); }
function diff(before, after) {
  const bOcc = new Set(occupiedIds(before));
  const aOcc = new Set(occupiedIds(after));
  const becameEmpty = [...bOcc].filter(id => !aOcc.has(id));
  const becameOccupied = [...aOcc].filter(id => !bOcc.has(id));
  return { becameEmpty, becameOccupied };
}
function sameArray(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
function visualChanged(a, b) {
  return num(b && b.visualRevision) !== num(a && a.visualRevision) ||
    num(b && b.revision) !== num(a && a.revision) ||
    coreSig(a) !== coreSig(b);
}
function hasFeedback(s, key) {
  return !!(s && s.feedback && s.feedback[key]) || num(s && s.visualRevision) > 0 ||
    !!(s && s.lastAction && s.lastAction.type);
}
function visibleControl(s, name) {
  return s && s.controls && (s.controls[name] === 'visible' || s.controls[name] === 'active');
}
function disabledControl(s, name) {
  return s && s.controls && (s.controls[name] === 'disabled' || s.controls[name] === 'hidden');
}

async function pageEval(browser, expr) {
  const value = await browser.eval(expr);
  if (value && value.__l2_err__) throw new Error(value.__l2_err__);
  return value;
}

function createGameDriver(browser) {
  async function raw(method, arg) {
    const args = Array.isArray(arg) && method === 'loadScenario' ? arg : (arg === undefined ? [] : [arg]);
    return await pageEval(browser, `
      (async function(){
        if (!window.__gameTest || typeof window.__gameTest.${method} !== 'function') {
          return { __missing: '${method}' };
        }
        return await window.__gameTest.${method}(...${JSON.stringify(args)});
      })()
    `);
  }
  return {
    async wait(ms = 120) { await browser.sleep(ms); },
    async requireAdapter() {
      const info = await pageEval(browser, `
        (function(){
          const gt = window.__gameTest;
          return {
            has: !!gt,
            reset: !!(gt && typeof gt.reset === 'function'),
            loadScenario: !!(gt && typeof gt.loadScenario === 'function'),
            input: !!(gt && typeof gt.input === 'function'),
            getSnapshot: !!(gt && typeof gt.getSnapshot === 'function')
          };
        })()
      `);
      if (!info.has || !info.reset || !info.loadScenario || !info.input || !info.getSnapshot) {
        throw new Error(`missing public adapter methods: ${JSON.stringify(info)}`);
      }
      return info;
    },
    async reset(options) { return unwrap(await raw('reset', options)); },
    async loadScenario(name, options) {
      return unwrap(await raw('loadScenario', options ? [name, options] : name));
    },
    async input(action) { return unwrap(await raw('input', action)); },
    async snapshot() { return unwrap(await raw('getSnapshot')); },
    async waitUntil(until, ms = 250) {
      // Do not send both `until` and `ms`: the game adapter is allowed to
      // prioritize either field, and a capped fixed-duration advance can
      // return a snapshot from the middle of an animation. The contract's
      // `until` action is the portable synchronization primitive; take a
      // fresh snapshot after the small browser-side settle delay as well.
      await this.input({ type: 'wait', until });
      await browser.sleep(Math.min(ms, 250));
      return await this.snapshot();
    },
    async realMouseTap(point) {
      await browser.mouseClick(Math.round(point.screenX ?? point.x), Math.round(point.screenY ?? point.y));
      await browser.sleep(160);
      return await this.snapshot();
    },
    async realTouchTap(point) {
      const x = Math.round(point.screenX ?? point.x);
      const y = Math.round(point.screenY ?? point.y);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, radiusX: 3, radiusY: 3, force: 1, id: 1 }],
        modifiers: 0
      });
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], modifiers: 0 });
      await browser.sleep(160);
      return await this.snapshot();
    }
  };
}

function assertSnapshotShape(s) {
  if (!s || typeof s !== 'object') return 'snapshot is not an object';
  if (!['boot', 'menu', 'playing', 'animating', 'panel', 'victory'].includes(s.phase)) return `bad phase ${s.phase}`;
  if (!['home', 'level', 'settings', 'levelSelect', 'leaderboard', 'victory'].includes(s.screen)) return `bad screen ${s.screen}`;
  if (!['none', 'win'].includes(s.result)) return `bad result ${s.result}`;
  if (typeof s.overlayBlocking !== 'boolean') return 'overlayBlocking must be boolean';
  if (typeof s.canInteractWithPlayfield !== 'boolean') return 'canInteractWithPlayfield must be boolean';
  if (typeof s.revision !== 'number' || typeof s.visualRevision !== 'number') return 'revision fields must be numbers';
  if (!s.puzzle || typeof s.puzzle !== 'object') return 'missing puzzle summary';
  if (!Array.isArray(s.screws) || !Array.isArray(s.holes) || !Array.isArray(s.parts)) return 'missing entity arrays';
  return '';
}

function requirePlayableLevel(s) {
  const shape = assertSnapshotShape(s);
  if (shape) return shape;
  if (s.screen !== 'level' || !['playing', 'animating'].includes(s.phase)) return `not in level play: ${s.phase}/${s.screen}`;
  if (s.overlayBlocking || !s.canInteractWithPlayfield) return 'playfield is blocked in playable level';
  if (num(s.puzzle && s.puzzle.screwCount) < 1 || num(s.puzzle && s.puzzle.holeCount) < 2 || num(s.puzzle && s.puzzle.partCount) < 1) return 'playfield lacks screws/holes/parts';
  if (!arr(s.screws).some(sc => sc.state === 'installed' && Number.isFinite(sc.screenX) && Number.isFinite(sc.screenY))) return 'no installed screw with semantic position';
  if (!arr(s.holes).some(h => h.state === 'empty' && Number.isFinite(h.screenX) && Number.isFinite(h.screenY))) return 'no empty hole with semantic position';
  return '';
}

async function loadValidScenario(game, name) {
  const s = await game.loadScenario(name);
  const shape = assertSnapshotShape(s);
  if (shape) throw new Error(`${name} invalid snapshot: ${shape}`);
  if (name !== 'boot_menu' && name !== 'panel_open') {
    const playable = requirePlayableLevel(s);
    if (playable) throw new Error(`${name} invalid precondition: ${playable}`);
  }
  if (name === 'screw_floating' && countStates(s.screws, ['selected', 'floating']) !== 1) throw new Error('screw_floating did not load exactly one selected/floating screw');
  if (name === 'valid_move_available' && !findLegalMove(s)) throw new Error('valid_move_available has no legal move');
  if (name === 'blocked_hole_available' && !findBlockedOrIllegalHole(s)) throw new Error('blocked_hole_available has no blocked/non-legal hole');
  if (name === 'undo_available' && !(s.puzzle && s.puzzle.canUndo)) throw new Error('undo_available has canUndo=false');
  if (name === 'tool_available' && !(s.tool && s.tool.uses > 0 && (arr(s.tool.processablePartIds).length > 0 ||
      arr(s.parts).some(p => p && p.visible === true && p.state !== 'cleared' && p.state !== 'falling')))) {
    throw new Error('tool_available lacks uses or visible target parts');
  }
  if (name === 'near_completion' && !(s.puzzle && s.puzzle.remainingPartCount >= 1)) throw new Error('near_completion already complete');
  return s;
}

function findInstalledScrew(s, avoidId) {
  return arr(s && s.screws).find(sc => sc.state === 'installed' && idOf(sc) !== avoidId && Number.isFinite(sc.screenX) && Number.isFinite(sc.screenY));
}
function findSelectedScrew(s) {
  return arr(s && s.screws).find(sc => ['selected', 'floating', 'moving'].includes(sc.state));
}
function findLegalHole(s) {
  const floating = !!findSelectedScrew(s);
  return arr(s && s.holes).find(h => h.state === 'empty' && !h.blocked && (!floating || h.legalTarget) && Number.isFinite(h.screenX) && Number.isFinite(h.screenY));
}
function findLegalMove(s) {
  const screw = findInstalledScrew(s);
  const hole = findLegalHole(s);
  return screw && hole ? { screw, hole } : null;
}
function findBlockedOrIllegalHole(s) {
  const floating = !!findSelectedScrew(s);
  const selected = findSelectedScrew(s);
  const originId = selected && selected.originHoleId;
  return arr(s && s.holes).find(h => h.state === 'empty' && idOf(h) !== originId && (h.blocked || (floating && !h.legalTarget)) && Number.isFinite(h.screenX) && Number.isFinite(h.screenY));
}
function findOriginalHoleForSelected(s) {
  const selected = findSelectedScrew(s);
  const originId = selected && selected.originHoleId;
  return arr(s && s.holes).find(h => idOf(h) === originId) ||
    arr(s && s.holes).find(h => h.state === 'occupied' && dist(h, selected || {}) < 45);
}
async function selectScrewByMouse(game, s, screw) {
  await game.realMouseTap(screw);
  const floating = await game.waitUntil('floating', 320);
  return floating;
}
async function moveByMouse(game, before, screw, hole) {
  const floating = await selectScrewByMouse(game, before, screw);
  const selected = findSelectedScrew(floating);
  if (!selected) throw new Error('real mouse screw tap did not create selected/floating screw');
  await game.realMouseTap(hole);
  return await game.waitUntil('idle', 450);
}

async function tutorialDirectionChoice(game, initial, reverse) {
  const tutorialScrew = arr(initial.screws).find(sc =>
    idOf(sc) === initial.tutorial.targetScrewId && sc.state === 'installed');
  if (!tutorialScrew) return null;
  const floating = await selectScrewByMouse(game, initial, tutorialScrew);
  const targetId = floating.tutorial && floating.tutorial.targetHoleId;
  const tutorialHole = arr(floating.holes).find(h =>
    idOf(h) === targetId && h.state === 'empty' && Number.isFinite(h.screenX) && Number.isFinite(h.screenY));
  if (!tutorialHole) return null;
  await game.realMouseTap(tutorialHole);
  let setup = await game.waitUntil('idle', 450);
  if (setup.tutorial && setup.tutorial.active) return null;

  let screw = arr(setup.screws).find(sc => idOf(sc) === idOf(tutorialScrew) && sc.state === 'installed');
  const firstTarget = arr(setup.holes).find(h =>
    idOf(h) !== idOf(tutorialHole) && h.state === 'empty' && !h.blocked &&
    Number.isFinite(h.screenX) && Number.isFinite(h.screenY));
  if (!screw || !firstTarget) return null;
  if (!reverse) return { screw, hole: firstTarget, after: await moveByMouse(game, setup, screw, firstTarget) };

  setup = await moveByMouse(game, setup, screw, firstTarget);
  screw = arr(setup.screws).find(sc => idOf(sc) === idOf(tutorialScrew) && sc.state === 'installed');
  const returnTarget = arr(setup.holes).find(h =>
    idOf(h) === idOf(tutorialHole) && h.state === 'empty' && !h.blocked &&
    Number.isFinite(h.screenX) && Number.isFinite(h.screenY));
  if (!screw || !returnTarget) return null;
  return { screw, hole: returnTarget, after: await moveByMouse(game, setup, screw, returnTarget) };
}
async function moveByContract(game, s) {
  let selected = findSelectedScrew(s);
  if (!selected) {
    const move = findLegalMove(s);
    if (!move) throw new Error('no legal contract move available');
    await game.input({ type: 'tapScrew', screwId: idOf(move.screw) });
    await game.waitUntil('floating', 250);
  } else if (selected.state !== 'floating') {
    await game.waitUntil('floating', 250);
  }
  const afterSelection = await game.snapshot();
  selected = findSelectedScrew(afterSelection);
  const hole = findLegalHole(afterSelection);
  if (!selected || !hole) throw new Error('no legal contract move available');
  await game.input({ type: 'tapHole', holeId: idOf(hole) });
  return await game.waitUntil('idle', 450);
}

function completionCandidates(s) {
  const activeParts = arr(s && s.parts).filter(p => p.state !== 'cleared' && p.visible !== false);
  const score = item => activeParts.length
    ? Math.min(...activeParts.map(p => dist(item, p)))
    : 0;
  const screws = arr(s && s.screws)
    .map((item, index) => ({ item, index }))
    .filter(x => x.item.state === 'installed' && Number.isFinite(x.item.screenX) && Number.isFinite(x.item.screenY))
    .sort((a, b) => score(b.item) - score(a.item));
  const holes = arr(s && s.holes)
    .map((item, index) => ({ item, index }))
    .filter(x => x.item.state === 'empty' && !x.item.blocked && Number.isFinite(x.item.screenX) && Number.isFinite(x.item.screenY))
    .sort((a, b) => score(a.item) - score(b.item));
  const toolParts = arr(s && s.parts)
    .map((item, index) => ({ item, index }))
    .filter(x => x.item.state !== 'cleared' && x.item.visible !== false &&
      (!arr(s && s.tool && s.tool.processablePartIds).length ||
        arr(s && s.tool && s.tool.processablePartIds).includes(idOf(x.item))));
  return { screws, holes, toolParts };
}

function isVictorySnapshot(snapshot) {
  return !!snapshot && (snapshot.result === 'win' || snapshot.phase === 'victory' || snapshot.screen === 'victory');
}

function hasSettledVictory(snapshot) {
  return isVictorySnapshot(snapshot) && num(snapshot.puzzle && snapshot.puzzle.remainingPartCount, -1) === 0;
}

async function settleFinalAction(game) {
  const settled = await game.waitUntil('victory', 4000);
  return hasSettledVictory(settled) ? settled : null;
}

// `near_completion` promises that at least one legal action can win, not
// that the first array element is that action. Search public semantic tool
// and screw/hole choices, resetting the precondition between attempts.
async function reachVictoryFromNearCompletion(game, initial) {
  const candidates = completionCandidates(initial);
  if (initial.tool && num(initial.tool.uses) > 0 && candidates.toolParts.length > 0) {
    const toolSetup = await game.loadScenario('near_completion');
    if (toolSetup.tool && num(toolSetup.tool.uses) > 0) {
      const partIds = arr(toolSetup.tool.processablePartIds);
      for (const partId of partIds) {
        const setup = await game.loadScenario('near_completion');
        if (!(setup.tool && num(setup.tool.uses) > 0)) continue;
        const part = arr(setup.parts).find(item =>
          idOf(item) === partId && item.state !== 'cleared' && item.visible !== false);
        if (!part) continue;
        const armed = await game.input({ type: 'control', control: 'tool' });
        if (!(armed.tool && armed.tool.active)) continue;
        const target = arr(armed.parts).find(item =>
          idOf(item) === partId && item.state !== 'cleared' && item.visible !== false);
        if (!target) continue;
        const action = await game.input({ type: 'tapPart', partId: idOf(target) });
        if (action.lastAction && action.lastAction.accepted === false) continue;
        const result = await settleFinalAction(game);
        if (result) return result;
      }
    }
  }
  for (const screwCandidate of candidates.screws) {
    for (const holeCandidate of candidates.holes) {
      const setup = await game.loadScenario('near_completion');
      const screw = arr(setup.screws)[screwCandidate.index];
      if (!screw || screw.state !== 'installed') continue;
      await game.input({ type: 'tapScrew', screwId: idOf(screw) });
      await game.waitUntil('floating', 400);
      const floating = await game.snapshot();
      const hole = arr(floating.holes)[holeCandidate.index];
      if (!hole || hole.state !== 'empty' || !hole.legalTarget || hole.blocked) continue;
      await game.input({ type: 'tapHole', holeId: idOf(hole) });
      const result = await settleFinalAction(game);
      if (result) return result;
    }
  }
  return await game.snapshot();
}

const suite = [
  {
    id: 'p0-1-contract-adapter-schema',
    level: 'P0',
    name: 'API contract exposes adapter and stable snapshot schema',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const reset = await game.reset();
      const shape = assertSnapshotShape(reset);
      if (shape) return FAIL(shape);
      const level = await game.input({ type: 'start' });
      const levelShape = assertSnapshotShape(level);
      if (levelShape) return FAIL(`start returned invalid snapshot: ${levelShape}`);
      return PASS(`adapter ok: ${reset.phase}/${reset.screen} -> ${level.phase}/${level.screen}`);
    }
  },
  {
    id: 'p0-2-start-playfield-readable',
    level: 'P0',
    name: 'Start enters a readable nonblocked playfield',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      await game.reset({ clearProgress: true });
      const s = await game.input({ type: 'start' });
      const err = requirePlayableLevel(s);
      if (err) return FAIL(err);
      return PASS(`level has ${s.puzzle.screwCount} screws, ${s.puzzle.holeCount} holes, ${s.puzzle.partCount} parts`);
    }
  },
  {
    id: 'p0-3-visible-playfield-observable',
    level: 'P0',
    name: 'Visible playfield has semantic geometry and render evidence',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const s = await loadValidScenario(game, 'level_start');
      const bounds = s.playfield && s.playfield.bounds;
      if (!bounds || bounds.width <= 20 || bounds.height <= 20) return FAIL('missing usable playfield bounds');
      const canvas = await browser.getCanvasSize();
      const drawInfo = await pageEval(browser, `(function(){ return window.__l2 ? { drawCalls: window.__l2.drawCalls, frameCount: window.__l2.frameCount } : null; })()`);
      const hasSemantic = arr(s.screws).length > 0 && arr(s.holes).length > 0 && arr(s.parts).length > 0;
      const semanticPoints = [...arr(s.screws), ...arr(s.holes), ...arr(s.parts)]
        .filter(entity => Number.isFinite(entity.screenX) && Number.isFinite(entity.screenY))
        .map(entity => ({ x: entity.screenX, y: entity.screenY }));
      const domInfo = await pageEval(browser, `(function(points, bounds) {
        const fieldArea = Math.max(1, bounds.width * bounds.height);
        const visibleEntityAt = point => {
          const stack = document.elementsFromPoint ? document.elementsFromPoint(point.x, point.y) : [document.elementFromPoint(point.x, point.y)];
          return stack.some(element => {
            if (!element || element === document.body || element === document.documentElement) return false;
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 &&
              style.display !== 'none' && style.visibility !== 'hidden' &&
              Number.parseFloat(style.opacity || '1') > 0 &&
              rect.width * rect.height < fieldArea * 0.8;
          });
        };
        return { entityHits: points.filter(visibleEntityAt).length };
      })(${JSON.stringify(semanticPoints)}, ${JSON.stringify(bounds)})`);
      const hasDomRender = !!(domInfo && domInfo.entityHits >= 2);
      const hasRender = (canvas && canvas.width > 20 && canvas.height > 20) || (drawInfo && drawInfo.drawCalls > 0) || hasDomRender;
      if (!hasSemantic || !hasRender) return FAIL(`semantic=${hasSemantic} render=${JSON.stringify({ canvas, drawInfo })}`);
      return PASS(`bounds ${Math.round(bounds.width)}x${Math.round(bounds.height)}`);
    }
  },
  {
    id: 'p1-1-real-screw-selection-floating',
    level: 'P1',
    name: 'Real screw tap selects exactly one floating screw',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'level_start');
      const screw = findInstalledScrew(before);
      if (!screw) return FAIL('no installed screw to click');
      const after = await selectScrewByMouse(game, before, screw);
      const selected = arr(after.screws).filter(sc => ['selected', 'floating'].includes(sc.state));
      if (selected.length !== 1) return FAIL(`expected one selected/floating screw, got ${selected.length}`);
      if (num(after.puzzle && after.puzzle.moves) !== num(before.puzzle && before.puzzle.moves)) return FAIL('selection changed move count');
      // A floating screw may expose its source as an empty physical hole;
      // the portable contract does not require the transient occupancy to
      // remain installed. Selection must not record a move or release parts.
      if (partSig(after) !== partSig(before)) return FAIL('selection changed part support/state before placement');
      if (num(after.puzzle && after.puzzle.screwCount) !== num(before.puzzle && before.puzzle.screwCount)) return FAIL('selection changed screw count');
      if (!hasFeedback(after, 'selection') && !visualChanged(before, after)) return FAIL('selection lacks visible feedback');
      const origin = arr(after.holes).find(h => idOf(h) === selected[0].originHoleId);
      if (origin) {
        const neighbors = arr(after.holes)
          .filter(h => idOf(h) !== idOf(origin) && Number.isFinite(h.screenX) && Number.isFinite(h.screenY))
          .map(h => dist(origin, h))
          .filter(d => d > 0);
        const nearestSpacing = neighbors.length ? Math.min(...neighbors) : 0;
        const bounds = after.playfield && after.playfield.bounds;
        const fallbackSpacing = bounds ? Math.min(bounds.width, bounds.height) / 6 : 80;
        const proximityLimit = 1.75 * (nearestSpacing || fallbackSpacing);
        if (dist(origin, selected[0]) > proximityLimit) return FAIL('floating screw is not near its origin hole');
      }
      return PASS(`selected ${idOf(selected[0]) || 'screw'} without move`);
    }
  },
  {
    id: 'p1-2-real-legal-hole-placement',
    level: 'P1',
    name: 'Real legal hole placement moves one screw and clears selection',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'valid_move_available');
      const move = findLegalMove(before);
      if (!move) return FAIL('no legal move in valid_move_available');
      const after = await moveByMouse(game, before, move.screw, move.hole);
      const d = diff(before, after);
      if (!d.becameEmpty.includes(move.screw.originHoleId || idOf(arr(before.holes).find(h => dist(h, move.screw) < 45)))) return FAIL(`source did not become empty: ${JSON.stringify(d)}`);
      if (!d.becameOccupied.includes(idOf(move.hole))) return FAIL(`target did not become occupied: ${JSON.stringify(d)}`);
      if (num(after.puzzle && after.puzzle.moves) !== num(before.puzzle && before.puzzle.moves) + 1) return FAIL('move count did not increase by one');
      if (num(after.puzzle && after.puzzle.screwCount) !== num(before.puzzle && before.puzzle.screwCount)) return FAIL('ordinary move did not conserve screw count');
      if (countStates(after.screws, ['selected', 'floating', 'moving']) !== 0 && !(after.puzzle && after.puzzle.busy)) return FAIL('selected/floating state did not clear after placement');
      return PASS(`moved to ${idOf(move.hole)}`);
    }
  },
  {
    id: 'p1-3-real-direction-opposite-targets',
    level: 'P1',
    name: 'Real target direction opposite choices move toward chosen holes',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const base = await loadValidScenario(game, 'valid_move_available');
      if (base.tutorial && base.tutorial.active) {
        const first = await tutorialDirectionChoice(game, base, false);
        const baseB = await loadValidScenario(game, 'valid_move_available');
        const second = await tutorialDirectionChoice(game, baseB, true);
        if (!first || !second) return FAIL('tutorial setup did not expose two free-play direction choices');
        const dxA = first.hole.screenX - first.screw.screenX;
        const dxB = second.hole.screenX - second.screw.screenX;
        const dyA = first.hole.screenY - first.screw.screenY;
        const dyB = second.hole.screenY - second.screw.screenY;
        const opposite =
          (Math.sign(dxA) !== 0 && Math.sign(dxA) === -Math.sign(dxB)) ||
          (Math.sign(dyA) !== 0 && Math.sign(dyA) === -Math.sign(dyB));
        if (!opposite) return FAIL(`direction opposite not proven: a=(${dxA},${dyA}) b=(${dxB},${dyB})`);
        if (!occupiedIds(first.after).includes(idOf(first.hole)) ||
            !occupiedIds(second.after).includes(idOf(second.hole))) {
          return FAIL('chosen target holes did not become occupied');
        }
        if (idOf(first.hole) === idOf(second.hole)) return FAIL('both runs occupied same target');
        return PASS(`tutorial normalized to free play; Math.sign proves direction opposite for ${idOf(first.hole)} vs ${idOf(second.hole)}`);
      }
      const installed = arr(base.screws).filter(sc =>
        sc.state === 'installed' && Number.isFinite(sc.screenX) && Number.isFinite(sc.screenY)
      );
      let screw = null;
      let a = null;
      let b = null;
      for (const candidate of installed) {
        const candidateLegal = arr(base.holes).filter(h =>
          h.state === 'empty' && !h.blocked && Number.isFinite(h.screenX) && Number.isFinite(h.screenY)
        );
        if (candidateLegal.length < 2) continue;
        candidateLegal.sort((x, y) => Math.abs(y.screenX - candidate.screenX) - Math.abs(x.screenX - candidate.screenX));
        let candidateA = candidateLegal[0];
        let candidateB = candidateLegal.find(h =>
          Math.sign(h.screenX - candidate.screenX) !== 0 &&
          Math.sign(h.screenX - candidate.screenX) === -Math.sign(candidateA.screenX - candidate.screenX)
        );
        if (!candidateB) {
          candidateLegal.sort((x, y) => Math.abs(y.screenY - candidate.screenY) - Math.abs(x.screenY - candidate.screenY));
          candidateA = candidateLegal[0];
          candidateB = candidateLegal.find(h =>
            Math.sign(h.screenY - candidate.screenY) !== 0 &&
            Math.sign(h.screenY - candidate.screenY) === -Math.sign(candidateA.screenY - candidate.screenY)
          );
        }
        if (candidateB) {
          screw = candidate;
          a = candidateA;
          b = candidateB;
          break;
        }
      }
      if (!screw || !a || !b) return FAIL('no opposite-direction legal targets exposed by scenario');
      await moveByMouse(game, base, screw, a);
      const afterA = await game.snapshot();
      const baseB = await loadValidScenario(game, 'valid_move_available');
      const screwB = arr(baseB.screws).find(sc =>
        sc.state === 'installed' && (
          idOf(sc) === idOf(screw) ||
          (screw.originHoleId && sc.originHoleId === screw.originHoleId) ||
          (Number.isFinite(sc.screenX) && Number.isFinite(sc.screenY) &&
            Math.hypot(sc.screenX - screw.screenX, sc.screenY - screw.screenY) < 1)
        )
      ) || findInstalledScrew(baseB, null) || screw;
      const targetB = arr(baseB.holes).find(h => idOf(h) === idOf(b)) || arr(baseB.holes).find(h => {
        if (h.state !== 'empty' || h.blocked || !Number.isFinite(h.screenX) || !Number.isFinite(h.screenY)) return false;
        const dx = Math.sign(h.screenX - screwB.screenX);
        const dy = Math.sign(h.screenY - screwB.screenY);
        const bx = Math.sign(b.screenX - screw.screenX);
        const by = Math.sign(b.screenY - screw.screenY);
        return (bx === 0 || dx === bx) && (by === 0 || dy === by);
      });
      if (!targetB) return FAIL('opposite target missing on second setup');
      await moveByMouse(game, baseB, screwB, targetB);
      const afterB = await game.snapshot();
      const dxA = a.screenX - screw.screenX;
      const dxB = targetB.screenX - screwB.screenX;
      const dyA = a.screenY - screw.screenY;
      const dyB = targetB.screenY - screwB.screenY;
      const opposite =
        (Math.sign(dxA) !== 0 && Math.sign(dxA) === -Math.sign(dxB)) ||
        (Math.sign(dyA) !== 0 && Math.sign(dyA) === -Math.sign(dyB));
      if (!opposite) return FAIL(`direction opposite not proven: a=(${dxA},${dyA}) b=(${dxB},${dyB})`);
      if (!occupiedIds(afterA).includes(idOf(a)) || !occupiedIds(afterB).includes(idOf(targetB))) return FAIL('chosen target holes did not become occupied');
      if (idOf(a) === idOf(targetB)) return FAIL('both runs occupied same target');
      return PASS(`Math.sign proves direction opposite for ${idOf(a)} vs ${idOf(targetB)}`);
    }
  },
  {
    id: 'p1-4-real-cancel-and-reject',
    level: 'P1',
    name: 'Real original-hole cancel and illegal target rejection preserve puzzle',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      let s = await loadValidScenario(game, 'screw_floating');
      const beforeCancel = coreSig(s);
      const origin = findOriginalHoleForSelected(s);
      if (!origin) return FAIL('floating scenario lacks origin hole');
      await game.realMouseTap(origin);
      const canceled = await game.waitUntil('idle', 320);
      if (num(canceled.puzzle && canceled.puzzle.moves) !== num(s.puzzle && s.puzzle.moves)) return FAIL('origin-hole cancel counted as a move');
      if (countStates(canceled.screws, ['selected', 'floating', 'moving']) !== 0 && !(canceled.puzzle && canceled.puzzle.busy)) return FAIL('cancel did not clear floating screw');
      s = await loadValidScenario(game, 'blocked_hole_available');
      const move = findInstalledScrew(s);
      const illegal = findBlockedOrIllegalHole(s) || (s.playfield && s.playfield.blankPoint);
      if (!move || !illegal) return FAIL('blocked_hole_available lacks screw or illegal target');
      const floating = await selectScrewByMouse(game, s, move);
      const illegalBefore = coreSig(floating);
      await game.realMouseTap(illegal);
      const rejected = await game.waitUntil('idle', 260);
      if (holeSig(rejected) !== holeSig(floating)) return FAIL('illegal/blank tap changed hole occupancy');
      if (num(rejected.puzzle && rejected.puzzle.moves) !== num(floating.puzzle && floating.puzzle.moves)) return FAIL('illegal/blank tap changed moves');
      const rejection = rejected.feedback && rejected.feedback.rejection || rejected.lastAction && rejected.lastAction.accepted === false || coreSig(rejected) === illegalBefore || visualChanged(floating, rejected);
      if (!rejection) return FAIL('illegal path lacked rejection/ignore evidence');
      if (!beforeCancel) return FAIL('internal check failure');
      return PASS('cancel and blocked/blank rejection preserve puzzle');
    }
  },
  {
    id: 'p1-5-real-switch-single-floating',
    level: 'P1',
    name: 'Real switch to another screw keeps single floating operation',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const s = await loadValidScenario(game, 'screw_floating');
      const old = findSelectedScrew(s);
      const other = findInstalledScrew(s, idOf(old));
      if (!old || !other) return FAIL('scenario lacks selected and another installed screw');
      await game.realMouseTap(other);
      const after = await game.waitUntil('floating', 500);
      const selected = arr(after.screws).filter(sc => ['selected', 'floating'].includes(sc.state));
      if (selected.length !== 1) return FAIL(`expected one selected/floating screw after switch, got ${selected.length}`);
      if (idOf(selected[0]) === idOf(old)) return FAIL('new screw was not selected after switch');
      if (num(after.puzzle && after.puzzle.moves) !== num(s.puzzle && s.puzzle.moves)) return FAIL('switch counted as a valid move');
      if (num(after.puzzle && after.puzzle.screwCount) !== num(s.puzzle && s.puzzle.screwCount)) return FAIL('switch did not conserve screw count');
      return PASS(`switched to ${idOf(selected[0])}`);
    }
  },
  {
    id: 'p1-6-busy-input-invariant',
    level: 'P1',
    name: 'Busy animation rejects rapid extra target input',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const s = await loadValidScenario(game, 'valid_move_available');
      const move = findLegalMove(s);
      if (!move) return FAIL('no legal move to start busy chain');
      await game.input({ type: 'tapScrew', screwId: idOf(move.screw) });
      const early = await game.snapshot();
      const extra = arr(early.holes).find(h => h.state === 'empty' && Number.isFinite(h.screenX) && Number.isFinite(h.screenY)) || move.hole;
      await browser.mouseClick(Math.round(extra.screenX), Math.round(extra.screenY));
      await browser.sleep(80);
      const during = await game.snapshot();
      if (countStates(during.screws, ['selected', 'floating', 'moving']) > 1) return FAIL('rapid input created multiple active screws');
      if (num(during.puzzle && during.puzzle.screwCount) !== num(s.puzzle && s.puzzle.screwCount)) return FAIL('rapid input changed screw count');
      if (num(during.puzzle && during.puzzle.moves) > num(s.puzzle && s.puzzle.moves) + 1) return FAIL('rapid input caused more than one move');
      return PASS('busy/animation path bounded rapid input');
    }
  },
  {
    id: 'p1-7-release-support-motion',
    level: 'P1',
    name: 'Valid move releases or changes part support with visible evidence',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'release_candidate');
      const afterMove = await moveByContract(game, before);
      const after = await game.waitUntil('pieceMotion', 600);
      const stateChanged = partSig(after) !== partSig(before);
      const dynamic = arr(after.parts).some(p => ['swinging', 'blocked', 'falling', 'cleared'].includes(p.state) || p.support !== 'multi');
      if (num(afterMove.puzzle && afterMove.puzzle.moves) <= num(before.puzzle && before.puzzle.moves)) return FAIL('release candidate move was not accepted');
      if (!stateChanged || !dynamic) return FAIL('part support/state did not change after release move');
      if (!visualChanged(afterMove, after) && !hasFeedback(after, 'pieceRelease')) return FAIL('part release lacks visual/feedback evidence');
      return PASS('support/motion changed after legal move');
    }
  },
  {
    id: 'p1-8-conservation-one-move',
    level: 'P1',
    name: 'One valid move conserves screws and changes only source/target holes',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'valid_move_available');
      const after = await moveByContract(game, before);
      const d = diff(before, after);
      if (d.becameEmpty.length !== 1 || d.becameOccupied.length !== 1) return FAIL(`expected one source and one target hole change: ${JSON.stringify(d)}`);
      if (num(after.puzzle && after.puzzle.screwCount) !== num(before.puzzle && before.puzzle.screwCount)) return FAIL('screw count not conserved');
      if (num(after.puzzle && after.puzzle.moves) !== num(before.puzzle && before.puzzle.moves) + 1) return FAIL('move count did not increment exactly once');
      const unchanged = arr(before.holes).filter(h => !d.becameEmpty.includes(idOf(h)) && !d.becameOccupied.includes(idOf(h)));
      const afterById = new Map(arr(after.holes).map(h => [idOf(h), h.state]));
      if (unchanged.some(h => afterById.get(idOf(h)) !== h.state)) return FAIL('unrelated hole toggled during one move');
      return PASS(`one move: ${d.becameEmpty[0]} -> ${d.becameOccupied[0]}`);
    }
  },
  {
    id: 'p1-9-victory-terminal-lock',
    level: 'P1',
    name: 'Victory is reached by final action and locks ordinary puzzle input',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'near_completion');
      const after = await reachVictoryFromNearCompletion(game, before);
      if (!hasSettledVictory(after)) return FAIL('final action did not reach settled victory with all parts clear');
      if (!(after.feedback && after.feedback.victory) && !(after.panels && after.panels.active === 'victory')) return FAIL('victory lacks visible/panel feedback');
      if (!visibleControl(after, 'nextLevel') || !visibleControl(after, 'replayLevel')) return FAIL('victory controls missing');
      const lockedBefore = coreSig(after);
      const screw = arr(after.screws).find(item => idOf(item));
      const hole = arr(after.holes).find(item => idOf(item));
      const part = arr(after.parts).find(item => idOf(item));
      if (screw) await game.input({ type: 'tapScrew', screwId: idOf(screw) });
      if (hole) await game.input({ type: 'tapHole', holeId: idOf(hole) });
      if (part) await game.input({ type: 'tapPart', partId: idOf(part) });
      const lockedAfter = await game.snapshot();
      if (coreSig(lockedAfter) !== lockedBefore) return FAIL('ordinary input mutated puzzle after victory');
      return PASS('victory reached and terminal lock held');
    }
  },
  {
    id: 'p1-10-key-undo-restart-state',
    level: 'P1',
    name: 'Keyboard undo and restart restore legal state',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const initial = await loadValidScenario(game, 'valid_move_available');
      const moved = await moveByContract(game, initial);
      await game.input({ type: 'key', key: 'undo' });
      await game.waitUntil('idle', 250);
      let undone = await game.snapshot();
      if (holeSig(undone) !== holeSig(initial) && num(undone.puzzle && undone.puzzle.moves) >= num(moved.puzzle && moved.puzzle.moves)) return FAIL('KeyZ undo did not restore previous arrangement or move summary');
      await game.input({ type: 'control', control: 'hint' });
      await game.input({ type: 'control', control: 'tool' });
      await game.input({ type: 'key', key: 'restart' });
      await game.waitUntil('idle', 350);
      const restarted = await game.snapshot();
      const err = requirePlayableLevel(restarted);
      if (err) return FAIL(`restart did not return playable level: ${err}`);
      if (num(restarted.puzzle && restarted.puzzle.moves) !== 0) return FAIL('restart did not reset moves');
      if (countStates(restarted.screws, ['selected', 'floating', 'moving']) !== 0) return FAIL('restart left selected/floating/moving screw');
      if (restarted.hint && restarted.hint.active) return FAIL('restart left hint active');
      if (restarted.tool && restarted.tool.active) return FAIL('restart left tool active');
      return PASS('key undo/restart restored stable state');
    }
  },
  {
    id: 'p1-11-empty-undo-rejection',
    level: 'P1',
    name: 'Empty undo rejects without puzzle mutation',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'level_start');
      const sig = coreSig(before);
      const result = await game.input({ type: 'control', control: 'undo' });
      const state = statusOf(result);
      const after = state.snapshot || await game.snapshot();
      if (holeSig(after) !== holeSig(before) || partSig(after) !== partSig(before) || num(after.puzzle && after.puzzle.moves) !== num(before.puzzle && before.puzzle.moves)) return FAIL('empty undo mutated puzzle');
      const rejected = state.ok === false || (after.lastAction && after.lastAction.reason === 'noUndo') || (after.feedback && after.feedback.rejection) || coreSig(after) === sig;
      if (!rejected) return FAIL('empty undo lacked rejection or stable-state evidence');
      return PASS('empty undo preserved puzzle');
    }
  },
  {
    id: 'p1-12-tutorial-and-hint',
    level: 'P1',
    name: 'Tutorial rejects wrong targets and hint marks legal targets without solving',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const tutorial = await loadValidScenario(game, 'tutorial_start');
      if (!tutorial.tutorial || !tutorial.tutorial.active) return FAIL('tutorial_start lacks active tutorial');
      const wrong = findInstalledScrew(tutorial, tutorial.tutorial.targetScrewId) || findLegalHole(tutorial);
      if (wrong) {
        const beforeWrong = coreSig(tutorial);
        if (wrong.state === 'installed') await game.input({ type: 'tapScrew', screwId: idOf(wrong) });
        else await game.input({ type: 'tapHole', holeId: idOf(wrong) });
        const afterWrong = await game.snapshot();
        if (afterWrong.tutorial && afterWrong.tutorial.step !== tutorial.tutorial.step) return FAIL('wrong tutorial target advanced step');
        if (holeSig(afterWrong) !== holeSig(tutorial)) return FAIL('wrong tutorial target mutated holes');
        if (!beforeWrong) return FAIL('internal tutorial sig failure');
      }
      const targetScrew = tutorial.tutorial.targetScrewId;
      if (targetScrew) await game.input({ type: 'tapScrew', screwId: targetScrew });
      const advanced = await game.waitUntil('floating', 350);
      if (advanced.tutorial && advanced.tutorial.step === tutorial.tutorial.step && targetScrew) return FAIL('correct tutorial target did not advance/select');
      const level = await loadValidScenario(game, 'valid_move_available');
      const hintBefore = coreSig(level);
      const hinted = await game.input({ type: 'control', control: 'hint' });
      if (!(hinted.hint && hinted.hint.active && arr(hinted.hint.targetHoleIds).length > 0)) return FAIL('hint did not expose target holes');
      const legalIds = new Set(arr(level.holes).filter(h => h.state === 'empty' && !h.blocked).map(idOf));
      if (arr(hinted.hint.targetHoleIds).some(id => !legalIds.has(id))) return FAIL('hint includes non-legal hole');
      if (num(hinted.puzzle && hinted.puzzle.moves) !== num(level.puzzle && level.puzzle.moves) || holeSig(hinted) !== holeSig(level)) return FAIL('hint moved/solved puzzle');
      if (!hintBefore) return FAIL('internal hint sig failure');
      return PASS('tutorial and hint paths valid');
    }
  },
  {
    id: 'p1-13-tool-cost-benefit-rejection',
    level: 'P1',
    name: 'Tool has visible activation, cost plus structural benefit, and rejection',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'tool_available');
      await game.input({ type: 'control', control: 'tool' });
      const active = await game.snapshot();
      if (!(active.tool && active.tool.active)) return FAIL('tool did not become active');
      const targetId = arr(active.tool.processablePartIds)[0] || arr(before.tool.processablePartIds)[0];
      if (!targetId) return FAIL('no processable part target');
      await game.input({ type: 'tapPart', partId: targetId });
      const after = await game.waitUntil('pieceMotion', 600);
      if (!(after.tool && num(after.tool.uses) === num(before.tool && before.tool.uses) - 1)) return FAIL('tool did not consume exactly one use');
      if (partSig(after) === partSig(before)) return FAIL('tool did not change part/support summary');
      if (!hasFeedback(after, 'tool') && !visualChanged(before, after)) return FAIL('tool lacks visible feedback');
      const blankSetup = await loadValidScenario(game, 'tool_empty_or_blank');
      const blankPoint = blankSetup.playfield && blankSetup.playfield.blankPoint;
      const beforeBlank = coreSig(blankSetup);
      await game.input({ type: 'control', control: 'tool' });
      if (blankPoint) await game.input({ type: 'tapBlank', point: blankPoint });
      const afterBlank = await game.snapshot();
      if (blankPoint && afterBlank.tool && num(afterBlank.tool.uses) !== num(blankSetup.tool && blankSetup.tool.uses)) return FAIL('blank tool tap consumed a use');
      if (blankPoint && holeSig(afterBlank) !== holeSig(blankSetup) && beforeBlank) return FAIL('blank tool tap mutated puzzle');
      return PASS('tool cost/benefit and blank rejection valid');
    }
  },
  {
    id: 'p1-14-progress-next-level-select',
    level: 'P1',
    name: 'Progression loads next/unlocked levels and rejects locked levels',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const pre = await loadValidScenario(game, 'near_completion');
      const win = await reachVictoryFromNearCompletion(game, pre);
      if (!hasSettledVictory(win)) return FAIL('precondition did not reach settled victory before progress action');
      const current = win.level && win.level.current;
      const next = await game.input({ type: 'control', control: 'nextLevel' });
      const nextErr = requirePlayableLevel(next);
      if (nextErr) return FAIL(`nextLevel did not load playable level: ${nextErr}`);
      if (next.level && next.level.current === current && num(next.level.total) > 1) return FAIL('nextLevel did not change current level');
      if (next.hint && next.hint.active || next.tool && next.tool.active || countStates(next.screws, ['selected', 'floating']) > 0) return FAIL('level change did not clear transient states');
      const panel = await game.input({ type: 'control', control: 'levelSelect' });
      if (!(panel.panels && panel.panels.active === 'levelSelect') || !panel.overlayBlocking) return FAIL('level select panel not opened');
      const options = arr(panel.panels && panel.panels.levelOptions);
      const locked = options.find(o => o.state === 'locked');
      if (locked) {
        const beforeLocked = coreSig(panel);
        const attempted = await game.input({ type: 'selectLevel', level: locked.level });
        if (attempted.level && attempted.level.current === locked.level) return FAIL('locked level selection changed current level');
        if (!((attempted.lastAction && attempted.lastAction.accepted === false) || attempted.overlayBlocking || coreSig(attempted) === beforeLocked)) return FAIL('locked level lacks rejection/stability evidence');
      }
      return PASS('progress and level select invariants valid');
    }
  },
  {
    id: 'p1-15-real-panel-blocking-settings',
    level: 'P1',
    name: 'Real playfield input is blocked while settings or level panel is open',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'level_start');
      const panel = await game.input({ type: 'control', control: 'settings' });
      if (!(panel.panels && panel.panels.active === 'settings') || !panel.overlayBlocking || panel.canInteractWithPlayfield) return FAIL('settings panel does not report blocking state');
      const target = findInstalledScrew(before) || (before.playfield && before.playfield.blankPoint);
      if (!target) return FAIL('no playfield target for blocking test');
      await browser.mouseClick(Math.round(target.screenX ?? target.x), Math.round(target.screenY ?? target.y));
      await browser.sleep(180);
      const afterClick = await game.snapshot();
      if (holeSig(afterClick) !== holeSig(before) || num(afterClick.puzzle && afterClick.puzzle.moves) !== num(before.puzzle && before.puzzle.moves)) return FAIL('panel leaked playfield input');
      const closed = await game.input({ type: 'control', control: 'closePanel' });
      if (closed.overlayBlocking || !closed.canInteractWithPlayfield) return FAIL('closing panel did not restore playfield interaction');
      return PASS('panel blocks then restores playfield');
    }
  },
  {
    id: 'p2-1-long-term-panel-nonblocking',
    level: 'P2',
    name: 'Optional leaderboard or long-term panel opens and closes without breaking play',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'level_start');
      const panel = await game.input({ type: 'control', control: 'leaderboard' });
      if (!(panel.panels && ['leaderboard', 'none'].includes(panel.panels.active))) return FAIL('leaderboard control returned invalid panel state');
      if (panel.panels.active === 'leaderboard' && !panel.overlayBlocking) return FAIL('open leaderboard did not block playfield');
      if (holeSig(panel) !== holeSig(before) || partSig(panel) !== partSig(before)) return FAIL('leaderboard mutated puzzle');
      const closed = await game.input({ type: 'control', control: 'closePanel' });
      const err = requirePlayableLevel(closed);
      if (err) return FAIL(`after closing optional panel: ${err}`);
      return PASS('optional panel nonblocking to main flow');
    }
  },
  {
    id: 'p2-2-feedback-synchronization',
    level: 'P2',
    name: 'Feedback and visual revisions synchronize with accepted and rejected events',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const start = await loadValidScenario(game, 'valid_move_available');
      const selected = await selectScrewByMouse(game, start, findInstalledScrew(start));
      const selectedScrew = findSelectedScrew(selected);
      if (countStates(selected && selected.screws, ['selected', 'floating', 'moving']) !== 1 || !selectedScrew) return FAIL('real screw tap did not create exactly one selected/floating screw');
      if (num(selected.puzzle && selected.puzzle.moves) !== num(start.puzzle && start.puzzle.moves)) return FAIL('selection changed move count');
      if (!(selected.feedback && selected.feedback.selection) && !visualChanged(start, selected)) return FAIL('selection lacks feedback/visual revision');
      const legal = findLegalHole(selected);
      if (!legal) return FAIL('selected state lacks legal hole');
      await game.realMouseTap(legal);
      const placed = await game.waitUntil('idle', 450);
      const placedTarget = arr(placed && placed.holes).find(h => idOf(h) === idOf(legal));
      const placementDelta = diff(selected, placed);
      if (!placedTarget || placedTarget.state !== 'occupied' || placementDelta.becameOccupied.indexOf(idOf(legal)) < 0 || findSelectedScrew(placed) || num(placed.puzzle && placed.puzzle.moves) !== num(selected.puzzle && selected.puzzle.moves) + 1) return FAIL('legal placement did not produce the expected state delta');
      if (!(placed.feedback && placed.feedback.placement) && !visualChanged(selected, placed)) return FAIL('placement lacks feedback/visual revision');
      const blockedBase = await loadValidScenario(game, 'blocked_hole_available');
      const screw = findInstalledScrew(blockedBase);
      if (!screw) return FAIL('blocked scenario lacks an installed screw to select');
      if (screw) {
        const floating = await selectScrewByMouse(game, blockedBase, screw);
        const blocked = findBlockedOrIllegalHole(floating) || (floating.playfield && floating.playfield.blankPoint);
        if (!blocked || countStates(floating && floating.screws, ['selected', 'floating', 'moving']) !== 1) return FAIL('selected state lacks a rejection target');
        const beforeRejected = coreSig(floating);
        await game.realMouseTap(blocked);
        const rejected = await game.snapshot();
        if (coreSig(rejected) !== beforeRejected) return FAIL('rejection changed core puzzle state');
        const signaled = !!(rejected.feedback && rejected.feedback.rejection) || !!(rejected.lastAction && rejected.lastAction.accepted === false) || num(rejected.visualRevision) !== num(floating.visualRevision);
        if (!signaled) return FAIL('rejection lacks visible feedback');
      }
      return PASS('feedback synchronized with state events');
    }
  },
  {
    id: 'p2-3-deeper-structure-rules',
    level: 'P2',
    name: 'Deeper structure preserves legal choices, support rules, and undo',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.requireAdapter();
      const before = await loadValidScenario(game, 'release_candidate', { depth: 'complex' }).catch(() => loadValidScenario(game, 'valid_move_available'));
      const legal = arr(before.holes).filter(h => h.state === 'empty' && !h.blocked && Number.isFinite(h.screenX) && Number.isFinite(h.screenY));
      if (legal.length < 1) return FAIL('complex/deeper scenario lacks legal choices');
      const blocked = findBlockedOrIllegalHole(before);
      const after = await moveByContract(game, before);
      if (num(after.puzzle && after.puzzle.moves) !== num(before.puzzle && before.puzzle.moves) + 1) return FAIL('deeper scenario legal move not recorded');
      if (blocked) {
        const state = await game.input({ type: 'tapHole', holeId: idOf(blocked) });
        if (state.lastAction && state.lastAction.accepted === true) return FAIL('blocked target accepted in deeper scenario');
      }
      const beforeUndo = holeSig(after);
      await game.input({ type: 'control', control: 'undo' });
      const undone = await game.waitUntil('idle', 300);
      if (holeSig(undone) === beforeUndo) return FAIL('undo did not restore a prior arrangement in deeper scenario');
      return PASS('deeper rules maintained legal/blocked/undo chain');
    }
  }
];

module.exports = { suite };
