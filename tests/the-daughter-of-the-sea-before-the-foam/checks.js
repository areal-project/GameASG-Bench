// === GDD Coverage Map ===
// M1 menu start and continue -> p1-real-menu-new-game, p1-real-continue-unfinished
// M2 puzzle generation and progression -> p1-real-menu-new-game, p2-contract-puzzle-progression, p2-contract-piece-cell-conservation
// M3 single-piece drag exchange and rejection -> p1-real-piece-drag-exchange, p1-real-opposite-direction-and-invalid-drag, p1-real-tutorial-guided-swap, p2-contract-busy-repeat-lock, p2-contract-piece-cell-conservation
// M4 merged group movement and invalid placement -> p1-real-group-legal-and-invalid-drag, p2-contract-busy-repeat-lock, p2-contract-piece-cell-conservation
// M5 auto merge and split/reform -> p1-real-group-legal-and-invalid-drag, p1-contract-merge-and-split-reform, p2-contract-piece-cell-conservation
// M6 completion, story reveal, and lock -> p1-real-completion-story-lock, p2-contract-invalid-phase-controls, p2-contract-visual-feedback-without-audio
// M7 branch choice and path change -> p1-real-branch-choice-path-change, p1-contract-ending-variety-reachability, p2-contract-invalid-phase-controls
// M8 endings and replay -> p1-real-ending-replay-cleanup, p1-contract-ending-variety-reachability
// M9 tutorial and increasing difficulty -> p1-real-tutorial-guided-swap, p2-contract-puzzle-progression
// M10 save and state cleanup -> p1-real-ending-replay-cleanup, p1-real-continue-unfinished, p2-contract-storage-failure-tolerance
// M11 audio atmosphere, non-required feedback -> p2-contract-visual-feedback-without-audio
// M12 settings/review -> p2-real-optional-panel-nonblocking
// M13 preview/custom mode -> p2-real-optional-panel-nonblocking
//
// === Category Map ===
// TS-P0-01 boot schema -> p0-contract-boot-schema
// TS-P0-02 reset/menu stability -> p0-contract-reset-menu-stability
// TS-P1-01 visible menu start -> p1-real-menu-new-game
// TS-P1-02 real piece drag exchange -> p1-real-piece-drag-exchange
// TS-P1-03 opposite direction plus invalid release -> p1-real-opposite-direction-and-invalid-drag
// TS-P1-04 tutorial guided swap -> p1-real-tutorial-guided-swap
// TS-P1-05 merged group legal and invalid drag -> p1-real-group-legal-and-invalid-drag
// TS-P1-06 merge and split/reform summary -> p1-contract-merge-and-split-reform
// TS-P1-07 completion, story reveal, lock -> p1-real-completion-story-lock
// TS-P1-08 branch choice path change -> p1-real-branch-choice-path-change
// TS-P1-09 ending replay cleanup -> p1-real-ending-replay-cleanup
// TS-P1-10 continue unfinished save -> p1-real-continue-unfinished
// TS-P1-11 ending variety reachability -> p1-contract-ending-variety-reachability
// TS-P2-01 puzzle progression -> p2-contract-puzzle-progression
// TS-P2-02 invalid phase controls -> p2-contract-invalid-phase-controls
// TS-P2-03 busy repeat lock -> p2-contract-busy-repeat-lock
// TS-P2-04 piece/cell conservation -> p2-contract-piece-cell-conservation
// TS-P2-06 optional panel nonblocking -> p2-real-optional-panel-nonblocking
// TS-P2-07 visual feedback without audio -> p2-contract-visual-feedback-without-audio
// TS-P2-08 storage failure tolerance -> p2-contract-storage-failure-tolerance
// TS-P2-09 touch drag parity -> p2-touch-drag-parity
//
// === Rationality Map ===
// p1-real-menu-new-game | priority P1 | GDD M1/M2 | TEST_SPEC TS-P1-01 | method: real-user behavior | interaction path: visible control click | adapter: dom-click/pointer-click | trigger: real click on runtime-discovered new journey control | independent observation: playing phase, puzzle geometry, unblocked visible playfield | empty-shell failure: menu-only or API-only start without visible puzzle fails
// p1-real-piece-drag-exchange | priority P1 | GDD M3/M5 | TEST_SPEC TS-P1-02 | method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | adapter: pointer-drag | trigger: real mouseDown/move/up from semantic piece center to legal target cell | independent observation: arrangement/exchange/visual revision plus conservation | empty-shell failure: listener-only or counter-only drag fails
// p1-real-opposite-direction-and-invalid-drag | priority P1 | GDD M3 | TEST_SPEC TS-P1-03 | method: mixed setup + real-user behavior | interaction path: opposite direction pair | adapter: pointer-drag | trigger: independent real drags in left/right or up/down plus invalid zero-distance release | independent observation: signed cell direction and rejected unchanged state | empty-shell failure: mirrored controls, same-direction movement, or free placement fails
// p1-real-tutorial-guided-swap | priority P1 | GDD M9/M3 | TEST_SPEC TS-P1-04 | method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | adapter: pointer-drag | trigger: real wrong tutorial drag then real guided drag | independent observation: wrong path rejected unchanged, guided path accepted with tutorial progress | empty-shell failure: tutorial label without gating or auto-complete fails
// p1-real-group-legal-and-invalid-drag | priority P1 | GDD M4/M5 | TEST_SPEC TS-P1-05 | method: mixed setup + real-user behavior | interaction path: mouse drag from semantic bounds | adapter: pointer-drag | trigger: real drag of group bounds to legal target, then real out-of-bounds group drag | independent observation: group-size evidence, arrangement delta, rejected unchanged group summary | empty-shell failure: fake group labels or missing shape rejection fails
// p1-contract-merge-and-split-reform | priority P1 | GDD M5 | TEST_SPEC TS-P1-06 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: public dragPiece action from mergeCandidatePuzzle, then public break/reform move if exposed | independent observation: mergeCount/groups and feedback revisions | empty-shell failure: move counter without group semantics fails
// p1-real-completion-story-lock | priority P1 | GDD M6 | TEST_SPEC TS-P1-07 | method: mixed setup + real-user behavior | interaction path: modal blocks then releases | adapter: pointer-drag | trigger: real final drag then attempted post-completion drag | independent observation: story/branch/ending phase, playfield lock, rejected stable drag | empty-shell failure: story skip, solve-by-wait, or unlocked completed puzzle fails
// p1-real-branch-choice-path-change | priority P1 | GDD M7 | TEST_SPEC TS-P1-08 | method: mixed setup + real-user behavior | interaction path: visible control click | adapter: dom-click/pointer-click | trigger: independent real clicks on branch A and B | independent observation: one recorded choice and distinct path/puzzle summary | empty-shell failure: decorative choices or duplicate/unrecorded choices fail
// p1-real-ending-replay-cleanup | priority P1 | GDD M8/M10 | TEST_SPEC TS-P1-09 | method: mixed setup + real-user behavior | interaction path: visible control click | adapter: dom-click/pointer-click | trigger: real click on ending replay/restart control | independent observation: terminal state clears to menu or fresh playable puzzle | empty-shell failure: replay that leaves old overlays/input locks fails
// p1-real-continue-unfinished | priority P1 | GDD M1/M10 | TEST_SPEC TS-P1-10 | method: real-user behavior | interaction path: visible control click | adapter: dom-click/pointer-click | trigger: real click on enabled continue control from unfinished save menu | independent observation: restored playable puzzle plus no-save rejection/disabled state | empty-shell failure: always-visible continue or stale ending save fails
// p1-contract-ending-variety-reachability | priority P1 | GDD M7/M8 | TEST_SPEC TS-P1-11 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: public legal ending/path scenarios and public progression evidence | independent observation: five reached ending types with replay control | empty-shell failure: single ending or hidden direct setter evidence fails
// p2-contract-puzzle-progression | priority P2 | GDD M2/M9 | TEST_SPEC TS-P2-01 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: continueStory from completedSequentialStory | independent observation: later active puzzle, level/grid progress, cleared overlays | empty-shell failure: static board or stale story overlay fails
// p2-contract-invalid-phase-controls | priority P2 | GDD M6/M7/M8 | TEST_SPEC TS-P2-02 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: chooseBranch/continueStory/drag in invalid phases | independent observation: rejected actions and semantic state unchanged | empty-shell failure: hidden skipping controls fail
// p2-contract-busy-repeat-lock | priority P2 | GDD M3/M4/M6 | TEST_SPEC TS-P2-03 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: overlapping public drag actions while busy/exchange may be active | independent observation: at most one exchange, conservation, settled not busy | empty-shell failure: duplicate increments or corrupted board fail
// p2-contract-piece-cell-conservation | priority P2 | GDD M2/M3/M4/M5 | TEST_SPEC TS-P2-04 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: accepted single/group moves, rejected move, final move | independent observation: totalBefore/totalAfter piece/cell/occupant invariants | empty-shell failure: disappearing/duplicated pieces fail
// p2-real-optional-panel-nonblocking | priority P2 | GDD M12/M13 | TEST_SPEC TS-P2-06 | method: real-user behavior | interaction path: visible control click | adapter: dom-click/dom-select-change/pointer-click | trigger: visible optional panel control click if present | independent observation: panel preference/review delta and close returns without corrupting play | empty-shell failure: optional overlay trapping input fails
// p2-contract-visual-feedback-without-audio | priority P2 | GDD M11/M6/M3 | TEST_SPEC TS-P2-07 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: public drag/reject/complete actions while audio is ignored | independent observation: visual/HUD/story revisions and no audio-only oracle | empty-shell failure: sound-only feedback or audio crash fails
// p2-contract-storage-failure-tolerance | priority P2 | GDD M10 | TEST_SPEC TS-P2-08 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: current-session progression while Storage.setItem throws | independent observation: no fatal exception, legal playable/menu phase, clean continue state | empty-shell failure: storage exception blank screen fails
// p2-touch-drag-parity | priority P2 | GDD M3/M4 | TEST_SPEC TS-P2-09 | method: mixed setup + real-user behavior | interaction path: touch drag/tap | adapter: touch-drag | trigger: touchStart/move/end from semantic piece or group bounds | independent observation: same accepted/rejected result class and release cleanup | empty-shell failure: touch never releases or guessed coordinates fail

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }
function NA(detail) { return { status: 'NOT_APPLICABLE', detail: detail || '' }; }
function isObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function isNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
function clone(v) { return JSON.parse(JSON.stringify(v == null ? null : v)); }

function centerOf(bounds) {
  if (!bounds || !isNumber(bounds.x) || !isNumber(bounds.y) || !isNumber(bounds.width) || !isNumber(bounds.height)) return null;
  return { screenX: bounds.x + bounds.width / 2, screenY: bounds.y + bounds.height / 2 };
}

function pointFromCell(puzzle, cell) {
  if (!puzzle || !Array.isArray(puzzle.cells) || !cell) return null;
  const found = puzzle.cells.find((c) => c.row === cell.row && c.col === cell.col);
  return found ? (found.center || centerOf(found.bounds)) : null;
}

function getPiece(puzzle, id) {
  return puzzle && Array.isArray(puzzle.pieces) ? puzzle.pieces.find((p) => p.id === id) : null;
}

function getGroup(puzzle, id) {
  return puzzle && Array.isArray(puzzle.groups) ? puzzle.groups.find((g) => g.id === id) : null;
}

function getSubjectPoint(puzzle, move) {
  if (!puzzle || !move) return null;
  if (move.subjectType === 'group') {
    const group = getGroup(puzzle, move.subjectId);
    if (!group) return null;
    // A geometric group center can fall in the gap between adjacent DOM
    // pieces.  Start on a member's semantic bounds so the real pointer drag
    // actually targets the group, independent of rendering gaps.
    const member = (group.pieceIds || []).map((id) => getPiece(puzzle, id)).find(Boolean);
    return (member && centerOf(member.bounds)) || centerOf(group.bounds) || null;
  }
  const piece = getPiece(puzzle, move.subjectId);
  return piece && (centerOf(piece.bounds) || pointFromCell(puzzle, piece.currentCell));
}

function movePoints(puzzle, move) {
  const start = getSubjectPoint(puzzle, move);
  const end = pointFromCell(puzzle, move && move.toCell);
  return start && end ? { start, end } : null;
}

function outsidePoint(puzzle) {
  const b = puzzle && puzzle.playfieldBounds;
  if (!b) return null;
  return { screenX: Math.max(1, b.x - Math.max(48, b.width * 0.2)), screenY: b.y + b.height / 2 };
}

function findMove(puzzle, opts = {}) {
  const moves = Array.isArray(puzzle && puzzle.legalMoves) ? puzzle.legalMoves : [];
  return moves.find((m) => {
    if (opts.subjectType && m.subjectType !== opts.subjectType) return false;
    if (opts.direction && m.direction !== opts.direction) return false;
    if (opts.completesPuzzle != null && !!m.completesPuzzle !== opts.completesPuzzle) return false;
    if (opts.createsMerge != null && !!m.createsMerge !== opts.createsMerge) return false;
    return true;
  }) || null;
}

function directionDelta(direction) {
  return {
    left: { row: 0, col: -1 },
    right: { row: 0, col: 1 },
    up: { row: -1, col: 0 },
    down: { row: 1, col: 0 }
  }[direction] || null;
}

function pieceCell(puzzle, id) {
  const piece = getPiece(puzzle, id);
  if (piece && piece.currentCell) return piece.currentCell;
  const cell = (puzzle && Array.isArray(puzzle.cells) ? puzzle.cells : []).find((c) => c.occupantId === id);
  return cell ? { row: cell.row, col: cell.col } : null;
}

function findRepeatableMove(puzzle) {
  const moves = Array.isArray(puzzle && puzzle.legalMoves) ? puzzle.legalMoves : [];
  const n = puzzle && Number(puzzle.gridSize);
  return moves.find((move) => {
    if (!move || move.subjectType !== 'piece' || !move.direction ||
        move.completesPuzzle || move.createsMerge) return false;
    const from = move.fromCell || pieceCell(puzzle, move.subjectId);
    const delta = directionDelta(move.direction);
    if (!from || !delta || !Number.isInteger(n)) return false;
    return from.row + (2 * delta.row) >= 0 &&
      from.row + (2 * delta.row) < n &&
      from.col + (2 * delta.col) >= 0 &&
      from.col + (2 * delta.col) < n;
  }) || null;
}

function directionalActionForMove(move) {
  const action = actionForMove(move);
  if (action && move && move.direction) delete action.toCell;
  return action;
}

function scenarioGroupMove(snap, group) {
  const recommended = snap && snap.scenario && snap.scenario.recommendedAction;
  if (!recommended) return null;
  const isGroup = recommended.type === 'dragGroup' || recommended.subjectType === 'group';
  const subjectId = recommended.groupId != null ? recommended.groupId : recommended.subjectId;
  if (!isGroup || subjectId == null || String(subjectId) !== String(group.id)) return null;
  const move = { subjectType: 'group', subjectId: group.id };
  if (recommended.fromCell) move.fromCell = recommended.fromCell;
  if (recommended.toCell) move.toCell = recommended.toCell;
  if (recommended.direction) move.direction = recommended.direction;
  return move.direction || move.toCell ? move : null;
}

function groupMovePoints(puzzle, move) {
  const group = getGroup(puzzle, move && move.subjectId);
  if (!group || !Array.isArray(group.pieceIds) || group.pieceIds.length < 2) return null;
  const origin = move.fromCell || null;
  const memberId = (group.pieceIds || []).find((id) => {
    const cell = pieceCell(puzzle, id);
    return cell && origin && cell.row === origin.row && cell.col === origin.col;
  }) || group.pieceIds[0];
  const memberCell = pieceCell(puzzle, memberId);
  const member = getPiece(puzzle, memberId);
  const start = (member && centerOf(member.bounds)) || (memberCell && pointFromCell(puzzle, memberCell));
  if (!start || !memberCell) return null;

  if (move.fromCell && move.toCell) {
    const end = pointFromCell(puzzle, move.toCell);
    return end ? { start, end } : null;
  }

  const delta = directionDelta(move.direction);
  if (delta) {
    const cell = (puzzle.cells || []).find((c) => c.row === memberCell.row && c.col === memberCell.col);
    const bounds = cell && cell.bounds;
    if (!bounds || !isNumber(bounds.width) || !isNumber(bounds.height)) return null;
    return {
      start,
      end: { screenX: start.screenX + delta.col * bounds.width, screenY: start.screenY + delta.row * bounds.height }
    };
  }
  const end = pointFromCell(puzzle, move.toCell);
  return end ? { start, end } : null;
}

function groupMoveDelta(move) {
  if (move && move.fromCell && move.toCell) {
    return { row: move.toCell.row - move.fromCell.row, col: move.toCell.col - move.fromCell.col };
  }
  return directionDelta(move && move.direction);
}

function groupMovedTogether(beforePuzzle, afterPuzzle, group, move) {
  const delta = groupMoveDelta(move);
  if (!delta || (delta.row === 0 && delta.col === 0)) return false;
  return (group.pieceIds || []).length >= 2 && group.pieceIds.every((id) => {
    const before = pieceCell(beforePuzzle, id);
    const after = pieceCell(afterPuzzle, id);
    return before && after && after.row - before.row === delta.row && after.col - before.col === delta.col;
  });
}

function invalidGroupRejected(beforeSnap, result) {
  const afterSnap = result && result.after;
  const beforePuzzle = beforeSnap && beforeSnap.puzzle;
  const afterPuzzle = afterSnap && afterSnap.puzzle;
  if (!beforePuzzle || !afterPuzzle) return false;
  if (semanticRealReleaseRejected(beforeSnap, result)) return true;
  const unchanged = afterPuzzle.arrangementSignature === beforePuzzle.arrangementSignature &&
    afterPuzzle.exchangeCount === beforePuzzle.exchangeCount &&
    groupSummary(afterSnap) === groupSummary(beforeSnap);
  const beforeFeedback = beforeSnap && beforeSnap.visual && beforeSnap.visual.feedbackRevision;
  const afterFeedback = afterSnap && afterSnap.visual && afterSnap.visual.feedbackRevision;
  const feedbackChanged = isNumber(beforeFeedback) && isNumber(afterFeedback) &&
    afterFeedback !== beforeFeedback;
  const released = !afterPuzzle.dragging || afterPuzzle.dragging.active !== true;
  const remainsPlayable = afterSnap.phase === 'playing' && afterSnap.screen === 'puzzle' && afterPuzzle.solved === false;
  if (!unchanged || !released || !remainsPlayable || assertConservation(afterSnap)) return false;
  if (JSON.stringify(semanticCore(beforeSnap)) !== JSON.stringify(semanticCore(afterSnap))) return false;
  return rejected(afterSnap) || feedbackChanged;
}

function moveSubjectIds(puzzle, move) {
  if (!puzzle || !move) return [];
  if (move.subjectType === 'group') {
    const group = getGroup(puzzle, move.subjectId);
    return group && Array.isArray(group.pieceIds) ? group.pieceIds.slice() : [];
  }
  const piece = getPiece(puzzle, move.subjectId);
  if (piece) return [piece.id];
  const singleton = getGroup(puzzle, move.subjectId);
  return singleton && Array.isArray(singleton.pieceIds) && singleton.pieceIds.length === 1
    ? singleton.pieceIds.slice()
    : [];
}

function actionForMove(move, puzzle) {
  if (!move) return null;
  if (move.subjectType === 'group') {
    if (puzzle && !getGroup(puzzle, move.subjectId)) return null;
    return { type: 'dragGroup', groupId: move.subjectId, toCell: move.toCell, direction: move.direction, pointerKind: 'mouse' };
  }
  let pieceId = move.subjectId;
  if (puzzle && !getPiece(puzzle, pieceId)) {
    const singleton = getGroup(puzzle, pieceId);
    if (!singleton || !Array.isArray(singleton.pieceIds) || singleton.pieceIds.length !== 1) return null;
    pieceId = singleton.pieceIds[0];
  }
  if (puzzle && !getPiece(puzzle, pieceId)) return null;
  return { type: 'dragPiece', pieceId, toCell: move.toCell, direction: move.direction, pointerKind: 'mouse' };
}

function publicMoveScore(puzzle, move) {
  const delta = groupMoveDelta(move);
  if (!delta) return -Infinity;
  const ids = moveSubjectIds(puzzle, move);
  if (!ids.length) return -Infinity;
  return ids.reduce((score, id) => {
    const piece = getPiece(puzzle, id);
    if (!piece || !piece.currentCell || !piece.homeCell) return score;
    const current = piece.currentCell;
    const home = piece.homeCell;
    const next = { row: current.row + delta.row, col: current.col + delta.col };
    const before = Math.abs(current.row - home.row) + Math.abs(current.col - home.col);
    const after = Math.abs(next.row - home.row) + Math.abs(next.col - home.col);
    return score + before - after;
  }, 0);
}

function publicMoveKey(move) {
  return JSON.stringify([move.subjectType, move.subjectId, move.fromCell, move.toCell, move.direction]);
}

function accepted(snap) {
  return !!(snap && snap.lastAction && snap.lastAction.accepted === true);
}

function rejected(snap) {
  return !!(snap && snap.lastAction && snap.lastAction.accepted === false);
}

function visualRevision(snap) {
  const v = (snap && snap.visual) || {};
  return [v.playfieldChangedRevision, v.hudRevision, v.feedbackRevision].filter(isNumber).join(':');
}

function groupSummary(snap) {
  const groups = snap && snap.puzzle && Array.isArray(snap.puzzle.groups) ? snap.puzzle.groups : [];
  return groups.map((g) => `${g.id}:${(g.pieceIds || []).slice().sort().join(',')}`).sort().join('|');
}

function semanticCore(snap) {
  const p = snap && snap.puzzle;
  return {
    phase: snap && snap.phase,
    screen: snap && snap.screen,
    canInteractWithPlayfield: snap && snap.canInteractWithPlayfield,
    story: snap && snap.story ? {
      nodeId: snap.story.nodeId,
      pathKey: snap.story.pathKey,
      revealed: snap.story.revealed,
      isBranch: snap.story.isBranch,
      isEnding: snap.story.isEnding,
      endingType: snap.story.endingType,
      choicesMade: snap.story.choicesMade
    } : null,
    progress: snap && snap.progress ? {
      hasSave: snap.progress.hasSave,
      currentLevelIndex: snap.progress.currentLevelIndex,
      completedTutorial: snap.progress.completedTutorial,
      reachedEndingTypes: snap.progress.reachedEndingTypes
    } : null,
    puzzle: p ? {
      gridSize: p.gridSize,
      totalPieces: p.totalPieces,
      arrangementSignature: p.arrangementSignature,
      solved: p.solved,
      exchangeCount: p.exchangeCount,
      mergeCount: p.mergeCount,
      groups: groupSummary(snap),
      occupants: Array.isArray(p.cells) ? p.cells.map((c) => c.occupantId).sort() : []
    } : null
  };
}

function assertSnapshot(snap) {
  const phases = new Set(['loading', 'menu', 'playing', 'story', 'branch', 'ending', 'error']);
  const screens = new Set(['loading', 'menu', 'puzzle', 'story', 'branch', 'ending', 'settings', 'error']);
  if (!isObject(snap)) return 'snapshot is not an object';
  if (!phases.has(snap.phase)) return `illegal phase ${snap.phase}`;
  if (!screens.has(snap.screen)) return `illegal screen ${snap.screen}`;
  if (typeof snap.ready !== 'boolean') return 'ready must be boolean';
  if (typeof snap.overlayBlocking !== 'boolean') return 'overlayBlocking must be boolean';
  if (typeof snap.canInteractWithPlayfield !== 'boolean') return 'canInteractWithPlayfield must be boolean';
  if (!isObject(snap.controls)) return 'controls envelope missing';
  if (!isObject(snap.story)) return 'story envelope missing';
  if (!Array.isArray(snap.story.choicesMade)) return 'story.choicesMade must be an array';
  if (!isObject(snap.progress)) return 'progress envelope missing';
  return null;
}

function assertPlayablePuzzle(snap) {
  const p = snap && snap.puzzle;
  if (assertSnapshot(snap)) return assertSnapshot(snap);
  if (snap.phase !== 'playing' || snap.screen !== 'puzzle') return `not in active puzzle: ${snap.phase}/${snap.screen}`;
  if (snap.overlayBlocking || !snap.canInteractWithPlayfield) return 'playfield blocked during active puzzle';
  if (!p) return 'puzzle snapshot missing';
  if (!isNumber(p.gridSize) || p.gridSize < 2) return 'gridSize must be >= 2';
  if (p.totalPieces !== p.gridSize * p.gridSize) return 'totalPieces must equal gridSize squared';
  if (!Array.isArray(p.cells) || p.cells.length !== p.totalPieces) return 'cells count mismatch';
  if (!Array.isArray(p.pieces) || p.pieces.length !== p.totalPieces) return 'pieces count mismatch';
  if (!p.playfieldBounds || !snap.visual || snap.visual.playfieldVisible !== true) return 'visible playfield evidence missing';
  if (p.solved) return 'active puzzle starts solved';
  return null;
}

function assertConservation(snap) {
  const p = snap && snap.puzzle;
  if (!p) return 'puzzle missing';
  if (p.totalPieces !== p.gridSize * p.gridSize) return 'grid accounting mismatch';
  if (!Array.isArray(p.pieces) || !Array.isArray(p.cells)) return 'pieces/cells missing';
  if (p.pieces.length !== p.totalPieces || p.cells.length !== p.totalPieces) return 'piece or cell count changed';
  const pieceIds = new Set(p.pieces.map((piece) => piece.id));
  const occupants = new Set(p.cells.map((cell) => cell.occupantId));
  if (pieceIds.size !== p.totalPieces) return 'piece ids are not unique';
  if (occupants.size !== p.totalPieces) return 'cell occupants are not unique';
  return null;
}

function directionSign(direction) {
  if (direction === 'left' || direction === 'up') return -1;
  if (direction === 'right' || direction === 'down') return 1;
  return 0;
}

function isHorizontal(direction) {
  return direction === 'left' || direction === 'right';
}

function createGameDriver(browser) {
  async function evalPage(expr) {
    const result = await browser.eval(expr);
    if (result && result.__l2_err__) throw new Error(result.__l2_err__);
    return result;
  }

  async function call(method, ...args) {
    return await evalPage(`
      (async function(){
        const api = window.__gameTest;
        const method = ${JSON.stringify(method)};
        const args = ${JSON.stringify(args)};
        if (!api || typeof api[method] !== 'function') return { __missingContract: method };
        try { return await Promise.resolve(api[method](...args)); }
        catch (e) { return { __threw: String(e && e.message || e) }; }
      })()
    `);
  }

  async function snapshot() { return await call('getSnapshot'); }
  async function reset(options) { return await call('reset', options || {}); }
  async function input(action) { return await call('input', action); }
  async function scenario(name, options) {
    const snap = await call('loadScenario', name, options || {});
    if (snap && !snap.__missingContract && (!snap.scenario || snap.scenario.name !== name || snap.scenario.legal !== true)) {
      snap.__scenarioError = `scenario ${name} did not report legal=true`;
    }
    return snap;
  }

  async function waitFor(predicate, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    let last = await snapshot();
    while (Date.now() < deadline) {
      if (predicate(last)) return last;
      await sleep(120);
      last = await snapshot();
    }
    return last;
  }

  async function waitSettled(timeoutMs = 5000) {
    return await waitFor((snap) => !snap.puzzle || snap.puzzle.busy === false, timeoutMs);
  }

  async function pointToViewport(point) {
    if (!point || !isNumber(point.screenX) || !isNumber(point.screenY)) return null;
    return await evalPage(`
      (function(){
        const pageX = ${point.screenX} + window.scrollX;
        const pageY = ${point.screenY} + window.scrollY;
        const margin = 24;
        let nextLeft = window.scrollX;
        let nextTop = window.scrollY;
        if (pageX < window.scrollX + margin) nextLeft = Math.max(0, pageX - margin);
        else if (pageX > window.scrollX + window.innerWidth - margin) nextLeft = Math.max(0, pageX - window.innerWidth + margin);
        if (pageY < window.scrollY + margin) nextTop = Math.max(0, pageY - margin);
        else if (pageY > window.scrollY + window.innerHeight - margin) nextTop = Math.max(0, pageY - window.innerHeight + margin);
        window.scrollTo({ left: nextLeft, top: nextTop, behavior: 'instant' });
        const x = pageX - window.scrollX;
        const y = pageY - window.scrollY;
        const el = document.elementFromPoint(x, y);
        if (!el || x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
          return { ok:false, x, y, reason:'point not in viewport' };
        }
        const style = getComputedStyle(el);
        const visible = style.visibility !== 'hidden' && style.display !== 'none' && style.pointerEvents !== 'none';
        const tag = (el.tagName || '').toLowerCase();
        const weakHit = tag === 'html' || tag === 'body';
        return { ok: visible && !weakHit, x, y, tag, label: (el.getAttribute('aria-label') || el.textContent || '').slice(0, 80), reason: visible ? '' : 'hit element hidden' };
      })()
    `);
  }

  async function realClickPoint(point) {
    const hit = await pointToViewport(point);
    if (!hit || !hit.ok) return { error: `click target not hit-testable: ${hit && hit.reason || 'missing point'}` };
    await browser.mouseClick(hit.x, hit.y);
    await sleep(350);
    return { hit, snap: await snapshot() };
  }

  async function findVisibleControl(terms, controlState) {
    if (controlState && controlState.visible && controlState.enabled && controlState.bounds) {
      const semanticTarget = await evalPage(`
        (function(){
          const hint = ${JSON.stringify(controlState.bounds)};
          const selectors = 'button,[role="button"],a[href],input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])';
          const candidates = Array.from(document.querySelectorAll(selectors));
          const target = candidates.find((el) => {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true';
            const visible = r.width > 4 && r.height > 4 && style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none';
            return visible && !disabled &&
              Math.abs(r.left - hint.x) <= 3 && Math.abs(r.top - hint.y) <= 3 &&
              Math.abs(r.width - hint.width) <= 3 && Math.abs(r.height - hint.height) <= 3;
          });
          if (!target) return null;
          if (typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ block:'center', inline:'center', behavior:'auto' });
          }
          const r = target.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const y = r.top + r.height / 2;
          const hit = document.elementFromPoint(x, y);
          const hitStyle = hit ? getComputedStyle(hit) : null;
          const hitVisible = !!hit && hitStyle.visibility !== 'hidden' && hitStyle.display !== 'none' && hitStyle.pointerEvents !== 'none';
          if (!hitVisible || (hit !== target && !target.contains(hit))) return null;
          return { screenX:x, screenY:y };
        })()
      `);
      if (semanticTarget) return { ...semanticTarget, source: 'snapshot-control-dom' };
      const point = centerOf(controlState.bounds);
      const hit = await pointToViewport(point);
      if (hit && hit.ok) return { point, source: 'snapshot-control-bounds' };
    }
    return await evalPage(`
      (function(){
        const terms = ${JSON.stringify(terms.map((t) => String(t)))};
        function normalizeLabel(value) {
          return String(value || '')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .replace(/\\s+/g, ' ')
            .trim()
            .toLowerCase();
        }
        function matchesTerm(label, term) {
          const normalized = normalizeLabel(term);
          if (normalized.length === 1) {
            return new RegExp('(^|[^a-z0-9])' + normalized + '([^a-z0-9]|$)').test(label);
          }
          return label.includes(normalized);
        }
        function labelFor(el) {
          const bits = [
            el.textContent || '',
            el.innerText || '',
            el.value || '',
            el.getAttribute('aria-label') || '',
            el.getAttribute('title') || '',
            el.getAttribute('id') || '',
            el.getAttribute('name') || '',
            el.getAttribute('role') || '',
            el.getAttribute('data-action') || '',
            el.getAttribute('data-panel') || '',
            el.getAttribute('data-mode') || '',
            el.getAttribute('data-control') || '',
            el.getAttribute('data-choice') || ''
          ];
          if (el.id) {
            const lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
            if (lab) bits.push(lab.textContent || '');
          }
          return bits.map(normalizeLabel).join(' ');
        }
        const selectors = 'button,[role="button"],a[href],input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])';
        const candidates = Array.from(document.querySelectorAll(selectors)).map((el) => {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          const label = labelFor(el);
          const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true';
          const visible = r.width > 4 && r.height > 4 && style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none';
          const matched = terms.some((t) => matchesTerm(label, t));
          return { el, r, label, visible, disabled, matched, area: r.width * r.height };
        }).filter((c) => c.visible && !c.disabled && c.matched);
        candidates.sort((a, b) => b.area - a.area);
        for (const c of candidates) {
          const pageX = c.r.left + c.r.width / 2 + window.scrollX;
          const pageY = c.r.top + c.r.height / 2 + window.scrollY;
          const margin = 24;
          let nextLeft = window.scrollX;
          let nextTop = window.scrollY;
          if (pageX < window.scrollX + margin) nextLeft = Math.max(0, pageX - margin);
          else if (pageX > window.scrollX + window.innerWidth - margin) nextLeft = Math.max(0, pageX - window.innerWidth + margin);
          if (pageY < window.scrollY + margin) nextTop = Math.max(0, pageY - margin);
          else if (pageY > window.scrollY + window.innerHeight - margin) nextTop = Math.max(0, pageY - window.innerHeight + margin);
          window.scrollTo({ left: nextLeft, top: nextTop, behavior: 'instant' });
          const x = pageX - window.scrollX;
          const y = pageY - window.scrollY;
          const hit = document.elementFromPoint(x, y);
          if (hit && (hit === c.el || c.el.contains(hit))) return { screenX:x, screenY:y, source:'dom-visible-control', label:c.label.slice(0, 100) };
        }
        return null;
      })()
    `);
  }

  async function realClickControl(terms, controlState, options = {}) {
    const target = await findVisibleControl(terms, controlState);
    if (!target) {
      if (options.allowMissing) return { notApplicable: `no visible enabled control for ${terms.join('/')}` };
      return { error: `cannot find visible enabled control for ${terms.join('/')}` };
    }
    const point = target.screenX != null ? { screenX: target.screenX, screenY: target.screenY } : target.point;
    return await realClickPoint(point);
  }

  async function realDrag(start, end, steps = 8) {
    if (!start || !end) return { error: 'semantic drag points missing' };
    const startPage = await evalPage(`(function(){ return { pageX:${start.screenX} + window.scrollX, pageY:${start.screenY} + window.scrollY }; })()`);
    const endPage = await evalPage(`(function(){ return { pageX:${end.screenX} + window.scrollX, pageY:${end.screenY} + window.scrollY }; })()`);
    const startHit = await pointToViewport({ screenX: startPage.pageX - (await evalPage('window.scrollX')), screenY: startPage.pageY - (await evalPage('window.scrollY')) });
    if (!startHit || !startHit.ok) return { error: `drag source not hit-testable: ${startHit && startHit.reason || 'missing'}` };
    const sx = startHit.x;
    const sy = startHit.y;
    const currentScroll = await evalPage('(function(){ return { x: window.scrollX, y: window.scrollY }; })()');
    const ex = endPage.pageX - currentScroll.x;
    const ey = endPage.pageY - currentScroll.y;
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sx, y: sy, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sx, y: sy, button: 'left', clickCount: 1, modifiers: 0 });
    await sleep(70);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: sx + (ex - sx) * t,
        y: sy + (ey - sy) * t,
        button: 'left',
        modifiers: 0
      });
      await sleep(30);
    }
    const during = await snapshot();
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: ex, y: ey, button: 'left', clickCount: 1, modifiers: 0 });
    await sleep(450);
    const after = await waitSettled();
    return { during, after };
  }

  async function realTouchDrag(start, end, steps = 6) {
    const touch = await evalPage(`
      (function(){
        return !!(window.TouchEvent || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
      })()
    `);
    if (!touch) return { notApplicable: 'browser context does not advertise reliable touch dispatch' };
    const hit = await pointToViewport(start);
    if (!hit || !hit.ok) return { error: `touch source not hit-testable: ${hit && hit.reason || 'missing'}` };
    const endHit = await pointToViewport(end);
    if (!endHit || !endHit.ok) return { error: `touch target not hit-testable: ${endHit && endHit.reason || 'missing'}` };
    const id = 7;
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hit.x, y: hit.y, id }] });
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: hit.x + (endHit.x - hit.x) * t, y: hit.y + (endHit.y - hit.y) * t, id }]
      });
      await sleep(35);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(450);
    return { after: await waitSettled() };
  }

  return { evalPage, call, snapshot, reset, input, scenario, waitFor, waitSettled, realClickControl, realClickPoint, realDrag, realTouchDrag };
}

async function loadLegal(game, name, options) {
  const snap = await game.scenario(name, options);
  if (!snap || snap.__missingContract) return { error: 'loadScenario public contract missing', snap };
  if (snap.__threw) return { error: `loadScenario threw: ${snap.__threw}`, snap };
  if (snap.__scenarioError) return { error: snap.__scenarioError, snap };
  const err = assertSnapshot(snap);
  if (err) return { error: err, snap };
  return { snap };
}

async function realClickBranchChoice(game, choice, controlState) {
  const terms = choice === 'A'
    ? ['option a', 'choice a', 'branch a', 'a']
    : ['option b', 'choice b', 'branch b', 'b'];
  const direct = await game.realClickControl(terms, controlState, { allowMissing: true });
  if (!direct.notApplicable || direct.error) return direct;
  const target = await game.evalPage(`
    (function(){
      const choice = ${JSON.stringify(choice)};
      const selectors = 'button,[role="button"],a[href],input:not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])';
      function visibleEnabled(el) {
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 4 || rect.height <= 4) return false;
        for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
        }
        return true;
      }
      const candidates = Array.from(document.querySelectorAll(selectors)).filter(visibleEnabled);
      const parents = [];
      candidates.forEach((el) => {
        if (el.parentElement && !parents.includes(el.parentElement)) parents.push(el.parentElement);
      });
      const groups = parents.map((parent) => candidates.filter((el) => el.parentElement === parent))
        .filter((group) => group.length === 2);
      groups.sort((a, b) => {
        const ar = a[0].parentElement.getBoundingClientRect();
        const br = b[0].parentElement.getBoundingClientRect();
        return ar.width * ar.height - br.width * br.height;
      });
      const group = groups[0];
      const target = group && group[choice === 'A' ? 0 : 1];
      if (!target) return null;
      target.scrollIntoView({ block:'center', inline:'center', behavior:'auto' });
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      const hitStyle = hit ? getComputedStyle(hit) : null;
      const hitVisible = !!hit && hitStyle.display !== 'none' && hitStyle.visibility !== 'hidden' && hitStyle.pointerEvents !== 'none';
      if (!hitVisible || (hit !== target && !target.contains(hit))) return null;
      return { screenX:x, screenY:y, source:'dom-branch-pair-order' };
    })()
  `);
  if (!target) return { error: `cannot find visible enabled branch choice ${choice}` };
  return await game.realClickPoint(target);
}

async function performRealMove(game, before, move) {
  const points = movePoints(before.puzzle, move);
  if (!points) return { error: 'semantic move points missing' };
  return await game.realDrag(points.start, points.end);
}

function semanticRealMoveAccepted(before, result) {
  const during = result && result.during;
  const after = result && result.after;
  const beforePuzzle = before && before.puzzle;
  const afterPuzzle = after && after.puzzle;
  if (!beforePuzzle || !afterPuzzle) return false;
  if (!during || !during.puzzle || !during.puzzle.dragging || !during.puzzle.dragging.active) return false;
  if (!afterPuzzle.dragging || afterPuzzle.dragging.active) return false;
  if (after.phase !== 'playing' || after.screen !== 'puzzle' ||
      after.overlayBlocking || !after.canInteractWithPlayfield) return false;
  if (afterPuzzle.arrangementSignature === beforePuzzle.arrangementSignature) return false;
  if (!(afterPuzzle.exchangeCount > beforePuzzle.exchangeCount)) return false;
  if (afterPuzzle.busy) return false;
  return !assertConservation(after);
}

function semanticRealMoveDirection(before, after, move) {
  const beforePuzzle = before && before.puzzle;
  const afterPuzzle = after && after.puzzle;
  if (!beforePuzzle || !afterPuzzle || !move) return null;
  const ids = move.subjectType === 'group'
    ? ((getGroup(beforePuzzle, move.subjectId) || {}).pieceIds || [])
    : [move.subjectId];
  const id = ids[0];
  const beforePiece = getPiece(beforePuzzle, id);
  const afterPiece = getPiece(afterPuzzle, id);
  if (!beforePiece || !afterPiece || !beforePiece.currentCell || !afterPiece.currentCell) return null;
  const axis = isHorizontal(move.direction) ? 'col' : 'row';
  const delta = afterPiece.currentCell[axis] - beforePiece.currentCell[axis];
  return Math.sign(delta) === directionSign(move.direction);
}

function semanticRealReleaseRejected(before, result) {
  const during = result && result.during;
  const after = result && result.after;
  const beforePuzzle = before && before.puzzle;
  const afterPuzzle = after && after.puzzle;
  if (!beforePuzzle || !afterPuzzle) return false;
  if (!during || !during.puzzle || !during.puzzle.dragging || !during.puzzle.dragging.active) return false;
  if (!afterPuzzle.dragging || afterPuzzle.dragging.active) return false;
  if (afterPuzzle.busy !== beforePuzzle.busy) return false;
  if (JSON.stringify(semanticCore(before)) !== JSON.stringify(semanticCore(after))) return false;
  if (assertConservation(after)) return false;
  const releaseFeedbackChanged = visualRevision(after) !== visualRevision(during);
  if (!rejected(after) && !releaseFeedbackChanged) return false;
  return true;
}

function recommendedGroupAction(snap) {
  const action = snap && snap.scenario && snap.scenario.recommendedAction;
  if (!action || action.type !== 'dragGroup' || action.groupId == null) return null;
  if (!action.toCell && !action.direction) return null;
  return Object.assign({ pointerKind: 'mouse' }, action);
}

async function performContractMove(game, move) {
  const action = actionForMove(move);
  if (!action) return null;
  return await game.input(action);
}

// Complete a legal active puzzle using only public snapshot geometry and
// player-level drag actions.  The optional homeCell field is used only when
// exposed; without it, the public contract does not provide enough
// information to solve an arbitrary shuffled puzzle without a hidden setter.
async function completePublicPuzzle(game, maxSteps = 120) {
  let last = await game.snapshot();
  const attempted = new Set();
  for (let step = 0; step < maxSteps; step++) {
    if (!last || last.phase !== 'playing') return { snap: last };
    const puzzle = last.puzzle;
    if (!puzzle) return { error: `step=${step}: puzzle snapshot missing`, snap: last };
    if (puzzle.solved) {
      const transitioned = await game.waitFor((snap) => snap && snap.phase !== 'playing', 2500);
      if (transitioned && transitioned.phase !== 'playing') return { snap: transitioned };
      return { error: 'step=' + step + ': solved puzzle did not enter story/branch/ending', snap: transitioned || last };
    }

    const legalMoves = Array.isArray(puzzle.legalMoves) ? puzzle.legalMoves : [];
    const beforeSignature = puzzle.arrangementSignature;
    const candidates = legalMoves.map((candidate) => ({ candidate, action: actionForMove(candidate, puzzle) }))
      .filter((entry) => entry.action)
      .sort((a, b) => {
        if (!!a.candidate.completesPuzzle !== !!b.candidate.completesPuzzle) {
          return Number(!!b.candidate.completesPuzzle) - Number(!!a.candidate.completesPuzzle);
        }
        const mergeDiff = Number(!!b.candidate.createsMerge) - Number(!!a.candidate.createsMerge);
        if (mergeDiff) return mergeDiff;
        const aScore = publicMoveScore(puzzle, a.candidate);
        const bScore = publicMoveScore(puzzle, b.candidate);
        if (aScore !== bScore) return bScore - aScore;
        return publicMoveKey(a.candidate).localeCompare(publicMoveKey(b.candidate));
      });
    const fresh = candidates.find((entry) => !attempted.has(String(beforeSignature) + ':' + publicMoveKey(entry.candidate)));
    const selected = fresh || candidates[0];
    let move = selected ? selected.candidate : null;
    if (!move) {
      const misplaced = (puzzle.pieces || []).find((piece) => {
        if (piece.inGroup || !piece.currentCell || !piece.homeCell) return false;
        const current = piece.currentCell;
        const home = piece.homeCell;
        const sameAxis = current && home &&
          (current.row === home.row || current.col === home.col) &&
          (current.row !== home.row || current.col !== home.col);
        return sameAxis;
      });
      if (misplaced) {
        const current = misplaced.currentCell;
        const home = misplaced.homeCell;
        const sameAxis = current && home &&
          (current.row === home.row || current.col === home.col) &&
          (current.row !== home.row || current.col !== home.col);
        if (sameAxis) move = { subjectType: 'piece', subjectId: misplaced.id, toCell: home };
      }
    }
    if (!move) return { error: `step=${step}: no public legal move or solver geometry`, snap: last };

    const action = actionForMove(move, puzzle);
    if (!action) return { error: 'step=' + step + ': no usable public action', snap: last };
    attempted.add(String(beforeSignature) + ':' + publicMoveKey(move));
    const result = await game.input(action);
    if (!accepted(result)) return { error: `step=${step}: public puzzle move rejected (${result && result.lastAction && result.lastAction.reason})`, snap: result };
    last = await game.waitFor((snap) => {
      if (!snap) return false;
      if (snap.phase === 'playing') return !!snap.puzzle && snap.puzzle.busy === false && !snap.puzzle.solved;
      if (snap.phase === 'story' || snap.phase === 'branch' || snap.phase === 'ending') return !!snap.story && snap.story.revealed === true;
      return true;
    }, 2500);
    if (last && last.phase === 'playing' && last.puzzle && last.puzzle.arrangementSignature === beforeSignature) {
      return { error: `step=${step}: accepted move did not change arrangement`, snap: last };
    }
  }
  return { error: `puzzle did not settle within ${maxSteps} public moves`, snap: last };
}

async function advancePublicPath(game, initial) {
  let current = initial;
  for (let step = 0; step < 240; step++) {
    if (!current) return { error: 'public path returned no snapshot' };
    if (current.phase === 'playing') {
      const completed = await completePublicPuzzle(game);
      if (completed.error) return completed;
      current = completed.snap;
      continue;
    }
    if (current.phase === 'story') {
      if (!current.story || current.story.revealed !== true) {
        current = await game.waitFor((snap) => snap && snap.phase === 'story' && snap.story && snap.story.revealed === true, 2500);
      }
      if (!current || current.phase !== 'story' || !current.story || current.story.revealed !== true) {
        return { error: 'story did not reveal before continueStory', snap: current };
      }
      const continued = await game.input({ type: 'pressControl', control: 'continueStory' });
      if (!accepted(continued)) return { error: 'continueStory was rejected', snap: continued };
      current = continued;
      continue;
    }
    if (current.phase === 'branch') {
      if (!current.story || current.story.revealed !== true) {
        current = await game.waitFor((snap) => snap && snap.phase === 'branch' && snap.story && snap.story.revealed === true, 2500);
      }
      if (!current || current.phase !== 'branch' || !current.story || current.story.revealed !== true) {
        return { error: 'branch story did not reveal', snap: current };
      }
      return { snap: current };
    }
    if (current.phase === 'ending') {
      if (!current.story || current.story.revealed !== true) {
        current = await game.waitFor((snap) => snap && snap.phase === 'ending' && snap.story && snap.story.revealed === true, 2500);
      }
      if (!current || current.phase !== 'ending' || !current.story || current.story.revealed !== true) {
        return { error: 'ending did not reveal', snap: current };
      }
      return { snap: current };
    }
    return { error: 'unsupported path phase ' + current.phase, snap: current };
  }
  return { error: 'public path exceeded transition budget', snap: current };
}

async function followEndingPath(game, choices, expectedEnding) {
  const setup = await loadLegal(game, 'completedBranchStory');
  if (setup.error) return { error: setup.error };
  let current = setup.snap;
  let advanced = await advancePublicPath(game, current);
  if (advanced.error) return advanced;
  current = advanced.snap;
  for (let i = 0; i < choices.length; i++) {
    if (current.phase !== 'branch' || !current.story || !current.story.isBranch) {
      return { error: `choice ${i + 1} did not start from a completed branch`, snap: current };
    }
    const controls = current.controls || {};
    if (!['branchA', 'branchB'].every((key) => {
      const control = controls[key];
      return control && control.visible === true && control.enabled === true;
    })) {
      return { error: 'branch choices are not visible/enabled', snap: current };
    }
    const chosen = await game.input({ type: 'chooseBranch', choice: choices[i] });
    if (!accepted(chosen)) return { error: `choice ${choices[i]} was rejected`, snap: chosen };
    advanced = await advancePublicPath(game, chosen);
    if (advanced.error) return advanced;
    current = advanced.snap;
  }
  if (expectedEnding != null && (!current || current.phase !== 'ending' || !current.story || current.story.endingType !== expectedEnding)) {
    return { error: 'path ended at ' + (current && current.phase) + '/' + (current && current.story && current.story.endingType), snap: current };
  }
  if (current && current.phase === 'ending') {
    const ending = current.story && current.story.endingType;
    if (!ending) return { error: 'ending type missing', snap: current };
    const replay = current.controls && current.controls.replayEnding;
    if (!(replay && replay.visible && replay.enabled)) return { error: ending + ': replay control missing', snap: current };
    const reached = Array.isArray(current.progress && current.progress.reachedEndingTypes) ? current.progress.reachedEndingTypes : [];
    if (!reached.includes(ending)) return { error: ending + ': progress did not record reached ending', snap: current };
  }
  return { snap: current };
}

const suite = [
  {
    id: 'p0-contract-boot-schema',
    level: 'P0',
    name: 'boot exposes public test contract and stable snapshot schema',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const contract = await game.evalPage(`(function(){
        const api = window.__gameTest;
        return { has: !!api, reset: !!api && typeof api.reset === 'function', input: !!api && typeof api.input === 'function', getSnapshot: !!api && typeof api.getSnapshot === 'function', loadScenario: !!api && typeof api.loadScenario === 'function' };
      })()`);
      if (!contract.has) return FAIL('window.__gameTest missing');
      for (const key of ['reset', 'input', 'getSnapshot', 'loadScenario']) {
        if (!contract[key]) return FAIL(`window.__gameTest.${key} missing`);
      }
      const first = await game.snapshot();
      const second = await game.snapshot();
      const err = assertSnapshot(first) || assertSnapshot(second);
      if (err) return FAIL(err);
      if (JSON.stringify(semanticCore(first)) !== JSON.stringify(semanticCore(second))) return FAIL('getSnapshot mutated semantic state between reads');
      if (browser.exceptions.length) return FAIL(`runtime exception: ${browser.exceptions[0].description || browser.exceptions[0].text}`);
      return PASS(`phase=${first.phase}, screen=${first.screen}`);
    }
  },
  {
    id: 'p0-contract-reset-menu-stability',
    level: 'P0',
    name: 'reset clears terminal overlays and stale drag state',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const snap = await game.reset({ clearSave: true });
      const err = assertSnapshot(snap);
      if (err) return FAIL(err);
      if (snap.phase === 'branch' || snap.phase === 'ending') return FAIL('fresh reset remained in terminal branch/ending phase');
      if (snap.puzzle && (snap.puzzle.solved || (snap.puzzle.dragging && snap.puzzle.dragging.active))) return FAIL('fresh reset preserved solved or dragging puzzle state');
      if (snap.overlayBlocking && snap.canInteractWithPlayfield) return FAIL('blocking overlay inconsistent with playfield interaction');
      return PASS(`reset phase=${snap.phase}, screen=${snap.screen}`);
    }
  },
  {
    id: 'p1-real-menu-new-game',
    level: 'P1',
    name: 'real new game control starts an unblocked visible puzzle',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'menuReady', { clearSave: true });
      if (setup.error) return FAIL(setup.error);
      const clicked = await game.realClickControl(['new', 'start', 'story', 'journey'], setup.snap.controls && setup.snap.controls.newGame);
      if (clicked.error) return FAIL(clicked.error);
      const snap = await game.waitFor((s) => s.phase === 'playing' && s.screen === 'puzzle', 7000);
      const err = assertPlayablePuzzle(snap) || assertConservation(snap);
      if (err) return FAIL(err);
      if (snap.controls.branchA && snap.controls.branchA.visible) return FAIL('branch control visible in active puzzle');
      if (snap.controls.replayEnding && snap.controls.replayEnding.visible) return FAIL('ending replay control visible in active puzzle');
      return PASS(`started grid=${snap.puzzle.gridSize}, pieces=${snap.puzzle.totalPieces}`);
    }
  },
  {
    id: 'p1-real-piece-drag-exchange',
    level: 'P1',
    name: 'real single-piece drag accepts a grid exchange with visible feedback',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'activePuzzle');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      const err = assertPlayablePuzzle(before) || assertConservation(before);
      if (err) return FAIL(err);
      const move = findMove(before.puzzle, { subjectType: 'piece' });
      if (!move) return FAIL('activePuzzle lacks a legal single-piece move');
      const beforeVisual = visualRevision(before);
      const result = await performRealMove(game, before, move);
      if (result.error) return FAIL(result.error);
      const after = result.after;
      const postErr = assertConservation(after);
      if (postErr) return FAIL(postErr);
      if (after.puzzle.arrangementSignature === before.puzzle.arrangementSignature) return FAIL('arrangement unchanged after accepted drag');
      if (!(after.puzzle.exchangeCount > before.puzzle.exchangeCount)) return FAIL('exchangeCount did not increase after accepted drag');
      const hadPickupEvidence = result.during && result.during.puzzle && result.during.puzzle.dragging && result.during.puzzle.dragging.active;
      if (!hadPickupEvidence && visualRevision(after) === beforeVisual) return FAIL('no pickup/visual feedback evidence changed after explicit drag');
      return PASS(`exchange ${before.puzzle.exchangeCount}->${after.puzzle.exchangeCount}`);
    }
  },
  {
    id: 'p1-real-opposite-direction-and-invalid-drag',
    level: 'P1',
    name: 'opposite real drags map to opposite directions and invalid release is rejected',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const checked = [];
      for (const pair of [['left', 'right'], ['up', 'down']]) {
        const a = await loadLegal(game, 'directionProbePuzzle');
        if (a.error) return FAIL(a.error);
        const moveA = findMove(a.snap.puzzle, { direction: pair[0] });
        if (!moveA) continue;
        const afterA = await performRealMove(game, a.snap, moveA);
        if (afterA.error) return FAIL(afterA.error);
        if (!semanticRealMoveAccepted(a.snap, afterA)) return FAIL(`${pair[0]} legal real drag was not accepted`);
        if (semanticRealMoveDirection(a.snap, afterA.after, moveA) !== true) return FAIL(`${pair[0]} real drag moved opposite to pointer direction`);
        const b = await loadLegal(game, 'directionProbePuzzle');
        if (b.error) return FAIL(b.error);
        const moveB = findMove(b.snap.puzzle, { direction: pair[1] });
        if (!moveB) continue;
        const afterB = await performRealMove(game, b.snap, moveB);
        if (afterB.error) return FAIL(afterB.error);
        if (!semanticRealMoveAccepted(b.snap, afterB)) return FAIL(`${pair[1]} legal real drag was not accepted`);
        if (semanticRealMoveDirection(b.snap, afterB.after, moveB) !== true) return FAIL(`${pair[1]} real drag moved opposite to pointer direction`);
        checked.push(pair.join('/'));
      }
      if (!checked.length) return FAIL('directionProbePuzzle lacks opposite legal direction pairs');
      const rejectSetup = await loadLegal(game, 'directionProbePuzzle');
      if (rejectSetup.error) return FAIL(rejectSetup.error);
      const piece = rejectSetup.snap.puzzle.pieces.find((p) => p.movable);
      const start = piece && centerOf(piece.bounds);
      const invalid = await game.realDrag(start, start, 2);
      if (invalid.error) return FAIL(invalid.error);
      if (!semanticRealReleaseRejected(rejectSetup.snap, invalid)) return FAIL('invalid zero-distance drag was not rejected');
      const unchanged = invalid.after.puzzle.arrangementSignature === rejectSetup.snap.puzzle.arrangementSignature &&
        invalid.after.puzzle.exchangeCount === rejectSetup.snap.puzzle.exchangeCount;
      if (!unchanged) return FAIL('invalid/rejected drag changed arrangement or exchange count');
      return PASS(`opposite directions ${checked.join(', ')} plus invalid rejection verified`);
    }
  },
  {
    id: 'p1-real-tutorial-guided-swap',
    level: 'P1',
    name: 'tutorial rejects non-guided real drag and accepts guided real swap',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'freshTutorialPuzzle');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      const err = assertPlayablePuzzle(before);
      if (err) return FAIL(err);
      const tutorial = before.puzzle.tutorial;
      if (!tutorial || tutorial.active !== true || !tutorial.guidedPieceId || !tutorial.guidedTargetCell) return FAIL('tutorial public guided move is missing');
      const guidedPiece = before.puzzle.pieces.find((p) => p.id === tutorial.guidedPieceId && centerOf(p.bounds));
      const wrongPiece = before.puzzle.pieces.find((p) => p.id !== tutorial.guidedPieceId && centerOf(p.bounds));
      const wrongSubject = wrongPiece || guidedPiece;
      if (!wrongSubject) return FAIL('tutorial scenario lacks a visible wrong tutorial path');
      const wrongStart = centerOf(wrongSubject.bounds);
      const currentCell = wrongSubject.currentCell;
      const adjacentCell = currentCell && before.puzzle.cells.find((cell) =>
        Math.abs(cell.row - currentCell.row) + Math.abs(cell.col - currentCell.col) === 1 &&
        (cell.row !== tutorial.guidedTargetCell.row || cell.col !== tutorial.guidedTargetCell.col));
      const wrongTargetCell = wrongPiece
        ? (currentCell && (currentCell.row !== tutorial.guidedTargetCell.row || currentCell.col !== tutorial.guidedTargetCell.col)
          ? tutorial.guidedTargetCell
          : adjacentCell)
        : adjacentCell;
      const wrongEnd = pointFromCell(before.puzzle, wrongTargetCell);
      if (!wrongStart || !wrongEnd) return FAIL('tutorial scenario lacks a visible wrong tutorial path');
      const wrong = await game.realDrag(wrongStart, wrongEnd, 5);
      if (wrong.error) return FAIL(wrong.error);
      const beforeTutorial = before.puzzle.tutorial;
      const sameTutorial = !!(wrong.after && wrong.after.puzzle && wrong.after.puzzle.tutorial) &&
        wrong.after.puzzle.tutorial.active === beforeTutorial.active &&
        wrong.after.puzzle.tutorial.stepIndex === beforeTutorial.stepIndex &&
        wrong.after.puzzle.tutorial.guidedPieceId === beforeTutorial.guidedPieceId &&
        wrong.after.puzzle.tutorial.guidedTargetCell &&
        wrong.after.puzzle.tutorial.guidedTargetCell.row === beforeTutorial.guidedTargetCell.row &&
        wrong.after.puzzle.tutorial.guidedTargetCell.col === beforeTutorial.guidedTargetCell.col &&
        wrong.after.progress && wrong.after.progress.completedTutorial === before.progress.completedTutorial;
      if (wrong.after.puzzle.arrangementSignature !== before.puzzle.arrangementSignature ||
          wrong.after.puzzle.exchangeCount !== before.puzzle.exchangeCount ||
          wrong.after.puzzle.solved !== before.puzzle.solved || !sameTutorial) {
        return FAIL('wrong tutorial drag changed puzzle or tutorial state');
      }
      const fresh = await loadLegal(game, 'freshTutorialPuzzle');
      if (fresh.error) return FAIL(fresh.error);
      const freshTutorial = fresh.snap.puzzle.tutorial;
      if (!freshTutorial || freshTutorial.active !== true || !freshTutorial.guidedPieceId || !freshTutorial.guidedTargetCell) {
        return FAIL('fresh tutorial guidance is missing');
      }
      const move = { subjectType: 'piece', subjectId: freshTutorial.guidedPieceId, toCell: freshTutorial.guidedTargetCell };
      const tutorialProgressed = (snap, base) => {
        if (!snap) return false;
        if (snap.phase === 'story' || snap.phase === 'branch' || snap.phase === 'ending') return true;
        const t = snap.puzzle && snap.puzzle.tutorial;
        return !t || t.active === false || t.stepIndex !== base.puzzle.tutorial.stepIndex ||
          !!(snap.progress && snap.progress.completedTutorial !== base.progress.completedTutorial);
      };
      const guided = await performRealMove(game, fresh.snap, move);
      if (guided.error) return FAIL(guided.error);
      const guidedPuzzle = guided.after && guided.after.puzzle;
      if (!guidedPuzzle || guidedPuzzle.arrangementSignature === fresh.snap.puzzle.arrangementSignature ||
          !(guidedPuzzle.exchangeCount > fresh.snap.puzzle.exchangeCount)) {
        return FAIL('guided real tutorial drag was not accepted');
      }
      let progressed = tutorialProgressed(guided.after, fresh.snap);
      if (!progressed) {
        const eventual = await game.waitFor((snap) => tutorialProgressed(snap, fresh.snap), 2500);
        progressed = tutorialProgressed(eventual, fresh.snap);
      }
      if (!progressed) return FAIL('tutorial progress did not advance or complete');
      return PASS('tutorial rejection and guided progression verified');
    }
  },
  {
    id: 'p1-real-group-legal-and-invalid-drag',
    level: 'P1',
    name: 'real merged group drag moves as a group and invalid placement rebounds',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'mergedGroupPuzzle');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      const group = (before.puzzle.groups || []).find((g) => g.movable && (g.pieceIds || []).length >= 2);
      if (!group) return FAIL('mergedGroupPuzzle lacks visible movable group with at least two pieces');
      const move = (Array.isArray(before.puzzle.legalMoves) ? before.puzzle.legalMoves.find((candidate) =>
        candidate.subjectType === 'group' && String(candidate.subjectId) === String(group.id)) : null) ||
        scenarioGroupMove(before, group);
      if (!move) return FAIL('mergedGroupPuzzle lacks legal group move');
      const points = groupMovePoints(before.puzzle, move);
      if (!points) return FAIL('mergedGroupPuzzle lacks semantic group drag geometry');
      const result = await game.realDrag(points.start, points.end);
      if (result.error) return FAIL(result.error);
      const after = result.after;
      if (!semanticRealMoveAccepted(before, result)) return FAIL('legal group drag did not produce a settled real exchange');
      if (after.puzzle.arrangementSignature === before.puzzle.arrangementSignature) return FAIL('group drag did not change arrangement');
      if (!(after.puzzle.exchangeCount > before.puzzle.exchangeCount)) return FAIL('group drag did not increment exchange count');
      if (!groupMovedTogether(before.puzzle, after.puzzle, group, move)) return FAIL('legal group drag did not move all group members together');
      const cons = assertConservation(after);
      if (cons) return FAIL(cons);
      const invalidSetup = await loadLegal(game, 'mergedGroupPuzzle');
      if (invalidSetup.error) return FAIL(invalidSetup.error);
      const invalidGroup = (invalidSetup.snap.puzzle.groups || []).find((g) => g.movable && (g.pieceIds || []).length >= 2);
      if (!invalidGroup) return FAIL('mergedGroupPuzzle lacks visible movable group for invalid placement');
      const invalidStart = getSubjectPoint(invalidSetup.snap.puzzle, {
        subjectType: 'group', subjectId: invalidGroup.id
      });
      const invalid = await game.realDrag(invalidStart, outsidePoint(invalidSetup.snap.puzzle), 7);
      if (invalid.error) return FAIL(invalid.error);
      if (!invalidGroupRejected(invalidSetup.snap, invalid)) return FAIL('invalid/out-of-bounds group drag was not rejected');
      const unchanged = invalid.after.puzzle.arrangementSignature === invalidSetup.snap.puzzle.arrangementSignature &&
        invalid.after.puzzle.exchangeCount === invalidSetup.snap.puzzle.exchangeCount &&
        groupSummary(invalid.after) === groupSummary(invalidSetup.snap);
      if (!unchanged) return FAIL('invalid group drag changed arrangement, count, or group membership summary');
      return PASS('group legal movement and invalid rejection verified');
    }
  },
  {
    id: 'p1-contract-merge-and-split-reform',
    level: 'P1',
    name: 'public merge action creates or reforms visible group summary',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'mergeCandidatePuzzle');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      const move = findMove(before.puzzle, { createsMerge: true }) || (before.scenario && before.scenario.recommendedAction);
      const actionMove = move && move.subjectId ? move : findMove(before.puzzle, { subjectType: 'piece' });
      if (!actionMove) return FAIL('mergeCandidatePuzzle lacks public merge candidate action');
      const visualBefore = visualRevision(before);
      const after = await performContractMove(game, actionMove);
      if (!accepted(after)) return FAIL('merge candidate public drag action was not accepted');
      if (after.puzzle.mergeCount === before.puzzle.mergeCount && groupSummary(after) === groupSummary(before)) return FAIL('mergeCount/groups did not change');
      if (visualRevision(after) === visualBefore) return FAIL('merge action produced no visible feedback revision');
      const breakMove = (after.puzzle.legalMoves || []).find((m) => m.subjectType === 'piece' || m.subjectType === 'group');
      if (breakMove) {
        const later = await performContractMove(game, breakMove);
        if (later && accepted(later) && assertConservation(later)) return FAIL(assertConservation(later));
      }
      return PASS(`merge summary ${before.puzzle.mergeCount}->${after.puzzle.mergeCount}`);
    }
  },
  {
    id: 'p1-real-completion-story-lock',
    level: 'P1',
    name: 'real final move reveals story and locks completed puzzle',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'nearCompletionPuzzle');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      if (before.puzzle.solved || before.story.revealed) return FAIL('nearCompletionPuzzle already solved or revealed');
      const finalMove = findMove(before.puzzle, { completesPuzzle: true });
      if (!finalMove) return FAIL('nearCompletionPuzzle lacks final legal move');
      const moved = await performRealMove(game, before, finalMove);
      if (moved.error) return FAIL(moved.error);
      const after = await game.waitFor((s) => s.story && s.story.revealed && ['story', 'branch', 'ending'].includes(s.phase) && s.puzzle && s.puzzle.solved === true, 8000);
      if (!after.story || after.story.revealed !== true) return FAIL('story was not revealed after final move');
      if (!['story', 'branch', 'ending'].includes(after.phase)) return FAIL(`completion entered illegal phase ${after.phase}`);
      if (!after.puzzle || after.puzzle.solved !== true) return FAIL('final real drag did not solve the puzzle');
      const arrangementKey = (snap) => {
        const puzzle = snap && snap.puzzle;
        if (!puzzle) return null;
        if (puzzle.arrangementSignature !== undefined) return String(puzzle.arrangementSignature);
        return JSON.stringify((puzzle.pieces || []).map((p) => [p.id, p.currentCell]));
      };
      if (arrangementKey(after) === arrangementKey(before)) return FAIL('final real drag did not change puzzle arrangement');
      if (!(after.puzzle.exchangeCount > before.puzzle.exchangeCount)) return FAIL('final real drag did not increment exchange count');
      if (after.canInteractWithPlayfield !== false) return FAIL('completed puzzle did not lock playfield input');
      const requiredControls = after.phase === 'story' ? ['continueStory'] : after.phase === 'branch' ? ['branchA', 'branchB'] : ['replayEnding'];
      if (requiredControls.some((control) => !after.controls || !after.controls[control] || after.controls[control].visible !== true || after.controls[control].enabled !== true)) return FAIL('completion controls were not exposed and enabled');
      const terminalFingerprint = (snap) => {
        const story = snap && snap.story;
        const controls = snap && snap.controls ? snap.controls : {};
        return {
          phase: snap && snap.phase,
          canInteractWithPlayfield: snap && snap.canInteractWithPlayfield,
          puzzle: snap && snap.puzzle ? { solved: snap.puzzle.solved, arrangement: arrangementKey(snap), exchangeCount: snap.puzzle.exchangeCount } : null,
          story: story ? { revealed: story.revealed, isBranch: story.isBranch, isEnding: story.isEnding, endingType: story.endingType, pathKey: story.pathKey, choicesMade: story.choicesMade || [] } : null,
          controls: Object.keys(controls).sort().map((key) => {
            const control = controls[key] || {};
            return [key, control.visible === true, control.enabled === true];
          })
        };
      };
      const piece = before.puzzle.pieces[0];
      const locked = await game.input({ type: 'dragPiece', pieceId: piece && piece.id, direction: 'right', pointerKind: 'mouse' });
      if (!rejected(locked)) return FAIL('post-completion drag was not rejected');
      if (!locked.story || locked.story.revealed !== true) return FAIL('post-completion drag disturbed story reveal');
      if (JSON.stringify(terminalFingerprint(locked)) !== JSON.stringify(terminalFingerprint(after))) return FAIL('post-completion drag changed terminal state');
      return PASS(`completion phase=${after.phase}`);
    }
  },
  {
    id: 'p1-real-branch-choice-path-change',
    level: 'P1',
    name: 'real branch choices are mutually exclusive and alter path evidence',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setupA = await loadLegal(game, 'completedBranchStory', { branchSeed: 'A' });
      if (setupA.error) return FAIL(setupA.error);
      if (setupA.snap.phase !== 'branch' || !setupA.snap.story.isBranch) return FAIL('completedBranchStory is not branch phase');
      if (!(setupA.snap.controls.branchA && setupA.snap.controls.branchA.enabled && setupA.snap.controls.branchB && setupA.snap.controls.branchB.enabled)) return FAIL('both branch controls are not enabled');
      const baseChoices = setupA.snap.story.choicesMade.length;
      const clickA = await realClickBranchChoice(game, 'A', setupA.snap.controls.branchA);
      if (clickA.error) return FAIL(clickA.error);
      const afterA = await game.waitFor((s) => s.story && s.story.choicesMade && s.story.choicesMade.length === baseChoices + 1, 5000);
      if (afterA.story.choicesMade.length !== baseChoices + 1) return FAIL('choice A did not append exactly one choice');
      const selectedA = afterA.story.choicesMade[baseChoices];
      if (!selectedA || selectedA.choice !== 'A') return FAIL('real click for branch A did not record A');
      const pathA = afterA.story.pathKey || afterA.story.nodeId || (afterA.progress && afterA.progress.currentLevelIndex) || (afterA.puzzle && afterA.puzzle.arrangementSignature);
      await game.reset({ clearSave: true });
      const setupB = await loadLegal(game, 'completedBranchStory', { branchSeed: 'B' });
      if (setupB.error) return FAIL(setupB.error);
      const clickB = await realClickBranchChoice(game, 'B', setupB.snap.controls.branchB);
      if (clickB.error) return FAIL(clickB.error);
      const afterB = await game.waitFor((s) => s.story && s.story.choicesMade && s.story.choicesMade.length === setupB.snap.story.choicesMade.length + 1, 5000);
      if (afterB.story.choicesMade.length !== setupB.snap.story.choicesMade.length + 1) return FAIL('choice B did not append exactly one choice');
      const selectedB = afterB.story.choicesMade[setupB.snap.story.choicesMade.length];
      if (!selectedB || selectedB.choice !== 'B') return FAIL('real click for branch B did not record B');
      const pathB = afterB.story.pathKey || afterB.story.nodeId || (afterB.progress && afterB.progress.currentLevelIndex) || (afterB.puzzle && afterB.puzzle.arrangementSignature);
      if (pathA === pathB && JSON.stringify(afterA.puzzle && afterA.puzzle.arrangementSignature) === JSON.stringify(afterB.puzzle && afterB.puzzle.arrangementSignature)) {
        return FAIL('branch A and B led to indistinguishable path/puzzle state');
      }
      if ((afterA.overlayBlocking && afterA.canInteractWithPlayfield) || (afterB.overlayBlocking && afterB.canInteractWithPlayfield)) return FAIL('branch overlay left inconsistent playfield state');
      return PASS(`branch paths A=${pathA}, B=${pathB}`);
    }
  },
  {
    id: 'p1-real-ending-replay-cleanup',
    level: 'P1',
    name: 'real replay from ending clears terminal state',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'endingRevealed');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      const allowed = new Set(['foam', 'dark', 'blessing', 'missed', 'escape', 'other', 'none']);
      if (before.phase !== 'ending' || !before.story.isEnding || !allowed.has(before.story.endingType)) return FAIL(`invalid ending state/type ${before.phase}/${before.story && before.story.endingType}`);
      const clicked = await game.realClickControl([
        'replay', 'restart', 'begin again', 'again', 'new journey', 'back to menu', 'return to menu', 'start over'
      ], before.controls.replayEnding);
      if (clicked.error) return FAIL(clicked.error);
      const after = await game.waitFor((s) => s.phase === 'menu' || s.phase === 'playing', 6000);
      if (after.phase === 'ending' || after.screen === 'ending') return FAIL('replay left ending active');
      if (after.puzzle && (after.puzzle.solved || (after.puzzle.dragging && after.puzzle.dragging.active))) return FAIL('replay preserved solved/dragging puzzle state');
      if (after.overlayBlocking && after.canInteractWithPlayfield) return FAIL('replay cleanup left inconsistent blocking state');
      return PASS(`ending ${before.story.endingType} cleaned to ${after.phase}`);
    }
  },
  {
    id: 'p1-real-continue-unfinished',
    level: 'P1',
    name: 'real continue restores unfinished saved puzzle and no-save path rejects',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'savedProgressMenu');
      if (setup.error) return FAIL(setup.error);
      if (setup.snap.progress.hasSave !== true) return FAIL('savedProgressMenu does not report unfinished save');
      const clicked = await game.realClickControl(['continue', 'resume'], setup.snap.controls.continueGame);
      if (clicked.error) return FAIL(clicked.error);
      const active = await game.waitFor((s) => s.phase === 'playing' && s.screen === 'puzzle', 6000);
      const err = assertPlayablePuzzle(active);
      if (err) return FAIL(`continue did not restore playable puzzle: ${err}`);
      await game.reset({ clearSave: true });
      const freshMenu = await loadLegal(game, 'menuReady');
      if (freshMenu.error) return FAIL(freshMenu.error);
      if (freshMenu.snap.progress.hasSave === true) return FAIL('clearSave menu still reports save');
      if (freshMenu.snap.controls.continueGame && freshMenu.snap.controls.continueGame.enabled) return FAIL('continue is enabled without unfinished save');
      return PASS('unfinished save restored; no-save continue unavailable');
    }
  },
  {
    id: 'p1-contract-ending-variety-reachability',
    level: 'P1',
    name: 'five ending categories are represented by legal public path evidence',
    timeoutMs: 240000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const requiredEndings = ['foam', 'dark', 'blessing', 'missed', 'escape'];
      const found = new Set();
      const queue = [[]];
      const enqueued = new Set([JSON.stringify([])]);
      const visitedBranches = new Set();
      const maxChoiceDepth = 24;
      while (queue.length && found.size < requiredEndings.length) {
        const choices = queue.shift();
        const result = await followEndingPath(game, choices);
        if (result.error) return FAIL('choices=' + (choices.join(',') || '(none)') + ': ' + result.error);
        const current = result.snap;
        if (current && current.phase === 'ending') {
          const ending = current.story && current.story.endingType;
          if (requiredEndings.includes(ending)) found.add(ending);
          continue;
        }
        if (!current || current.phase !== 'branch' || !current.story || current.story.isBranch !== true) {
          return FAIL('choices=' + (choices.join(',') || '(none)') + ': path did not expose a revealed branch or ending');
        }
        const branchKey = JSON.stringify({
          nodeId: current.story.nodeId || null,
          pathKey: current.story.pathKey || null,
          choicesMade: current.story.choicesMade || choices
        });
        if (visitedBranches.has(branchKey)) continue;
        visitedBranches.add(branchKey);
        if (choices.length >= maxChoiceDepth) return FAIL('branch search exceeded ' + maxChoiceDepth + ' choices');
        for (const choice of ['A', 'B']) {
          const nextChoices = choices.concat(choice);
          const nextKey = JSON.stringify(nextChoices);
          if (!enqueued.has(nextKey)) {
            enqueued.add(nextKey);
            queue.push(nextChoices);
          }
        }
      }
      if (found.size !== requiredEndings.length) {
        return FAIL('reachable endings=' + Array.from(found).sort().join(',') + '; required=' + requiredEndings.join(','));
      }
      return PASS('endings=' + requiredEndings.join(','));
    }
  },
  {
    id: 'p2-contract-puzzle-progression',
    level: 'P2',
    name: 'continueStory creates a later valid puzzle and clears overlays',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const first = await loadLegal(game, 'freshTutorialPuzzle');
      if (first.error) return FAIL(first.error);
      const firstErr = assertPlayablePuzzle(first.snap) || assertConservation(first.snap);
      if (firstErr) return FAIL(firstErr);
      const story = await loadLegal(game, 'completedSequentialStory');
      if (story.error) return FAIL(story.error);
      if (!story.snap.story.revealed || !(story.snap.controls.continueStory && story.snap.controls.continueStory.enabled)) return FAIL('completedSequentialStory lacks revealed story and enabled continue');
      const continued = await game.input({ type: 'pressControl', control: 'continueStory' });
      if (!accepted(continued)) return FAIL('continueStory public action was not accepted');
      const later = await game.waitFor((s) => s.phase === 'playing' && s.screen === 'puzzle', 6000);
      const laterErr = assertPlayablePuzzle(later) || assertConservation(later);
      if (laterErr) return FAIL(laterErr);
      if (later.progress.currentLevelIndex != null && first.snap.progress.currentLevelIndex != null && later.progress.currentLevelIndex === first.snap.progress.currentLevelIndex) return FAIL('level index did not advance');
      if (later.story.revealed || later.overlayBlocking) return FAIL('previous story overlay still blocks later puzzle');
      if (later.puzzle.gridSize < first.snap.puzzle.gridSize) return FAIL('later grid regressed below tutorial grid');
      return PASS(`grid ${first.snap.puzzle.gridSize}->${later.puzzle.gridSize}`);
    }
  },
  {
    id: 'p2-contract-invalid-phase-controls',
    level: 'P2',
    name: 'invalid phase controls reject without semantic state mutation',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'activePuzzle');
      if (setup.error) return FAIL(setup.error);
      const beforeCore = semanticCore(setup.snap);
      const branch = await game.input({ type: 'chooseBranch', choice: 'A' });
      if (!rejected(branch)) return FAIL('chooseBranch accepted in active puzzle phase');
      const cont = await game.input({ type: 'pressControl', control: 'continueStory' });
      if (!rejected(cont)) return FAIL('continueStory accepted before story reveal');
      const afterCore = semanticCore(await game.snapshot());
      if (JSON.stringify(afterCore) !== JSON.stringify(beforeCore)) return FAIL('invalid/rejected phase controls changed semantic state');
      return PASS('invalid phase controls rejected with unchanged semantic state');
    }
  },
  {
    id: 'p2-contract-busy-repeat-lock',
    level: 'P2',
    name: 'overlapping public drag attempts settle to one legal exchange without corruption',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'activePuzzle');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      const move = findRepeatableMove(before.puzzle);
      if (!move) return NA('activePuzzle lacks a repeatable non-completing legal piece move for overlap probe');
      const firstAction = directionalActionForMove(move);
      const secondAction = directionalActionForMove(move);
      if (!firstAction || !secondAction) return NA('repeatable legal move lacks a public direction action');
      const [first, second] = await Promise.all([
        game.input(firstAction),
        game.input(secondAction)
      ]);
      if (first && first.__threw) return FAIL(`first public input threw: ${first.__threw}`);
      if (second && second.__threw) return FAIL(`second public input threw: ${second.__threw}`);
      if (!accepted(first)) return FAIL('declared legal first move was not accepted');
      const settled = await game.waitSettled(5000);
      const cons = assertConservation(settled);
      if (cons) return FAIL(cons);
      const delta = settled.puzzle.exchangeCount - before.puzzle.exchangeCount;
      if (delta < 1 || delta > 1) return FAIL(`overlapping/repeated input changed exchangeCount by ${delta}`);
      const secondReason = second && second.lastAction && second.lastAction.reason;
      const busyRejected = rejected(second) && secondReason === 'busy';
      const safelyCoalesced = accepted(second) && delta === 1;
      if (!busyRejected && !safelyCoalesced) {
        return FAIL('overlapping duplicate was neither rejected as busy nor safely coalesced');
      }
      if (settled.puzzle.busy !== false) return FAIL('puzzle did not settle after repeat input');
      return PASS('repeat input preserved one-exchange invariant');
    }
  },
  {
    id: 'p2-contract-piece-cell-conservation',
    level: 'P2',
    name: 'piece and cell conservation holds across accepted and rejected actions',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const active = await loadLegal(game, 'activePuzzle');
      if (active.error) return FAIL(active.error);
      const totalBefore = active.snap.puzzle.totalPieces;
      const single = findMove(active.snap.puzzle, { subjectType: 'piece' });
      if (!single) return FAIL('no legal single move for conservation');
      const afterSingle = await performContractMove(game, single);
      if (!accepted(afterSingle)) return FAIL('single conservation move not accepted');
      if (assertConservation(afterSingle)) return FAIL(assertConservation(afterSingle));
      const groupSetup = await loadLegal(game, 'mergedGroupPuzzle');
      if (groupSetup.error) return FAIL(groupSetup.error);
      const groupMove = findMove(groupSetup.snap.puzzle, { subjectType: 'group' });
      const groupAction = groupMove ? actionForMove(groupMove) : recommendedGroupAction(groupSetup.snap);
      if (!groupAction) return FAIL('no legal group move for conservation');
      const afterGroup = await game.input(groupAction);
      if (!accepted(afterGroup)) return FAIL('group conservation move not accepted');
      if (assertConservation(afterGroup)) return FAIL(assertConservation(afterGroup));
      const rejectSetup = await loadLegal(game, 'activePuzzle');
      if (rejectSetup.error) return FAIL(rejectSetup.error);
      const rejectPiece = rejectSetup.snap.puzzle.pieces.find((p) => p.movable);
      const invalid = await game.input({ type: 'dragPiece', pieceId: rejectPiece && rejectPiece.id, direction: 'none', pointerKind: 'mouse' });
      if (!rejected(invalid)) return FAIL('invalid conservation drag was not rejected');
      if (assertConservation(invalid)) return FAIL(assertConservation(invalid));
      const totalAfter = invalid.puzzle.totalPieces;
      if (totalBefore !== totalAfter) return FAIL(`totalBefore/totalAfter mismatch ${totalBefore}/${totalAfter}`);
      return PASS(`totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
    }
  },
  {
    id: 'p2-real-optional-panel-nonblocking',
    level: 'P2',
    name: 'optional settings review or preview panel is nonblocking when present',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'activePuzzle');
      if (setup.error) return FAIL(setup.error);
      const beforeCore = semanticCore(setup.snap);
      const settings = setup.snap.controls && setup.snap.controls.settings;
      if (!settings || settings.visible !== true) return NA('optional settings/review/preview controls absent; P2 cut scope');
      const clicked = await game.realClickControl(
        ['settings', 'options', 'review', 'preview', 'sound', 'audio'],
        settings,
        { allowMissing: true }
      );
      if (clicked.notApplicable) return NA('optional settings/review/preview controls absent; P2 cut scope');
      if (clicked.error) return FAIL(clicked.error);
      const panel = await game.snapshot();
      if (panel.screen !== 'settings' && !panel.overlayBlocking) return FAIL('optional control did not open a distinguishable panel/state');
      const closed = await game.input({ type: 'pressControl', control: 'closePanel' });
      if (!accepted(closed)) return FAIL('closePanel was not accepted for optional panel');
      const after = await game.waitFor((s) => s.phase === setup.snap.phase && s.screen === setup.snap.screen, 4000);
      const afterCore = semanticCore(after);
      if (afterCore.puzzle && beforeCore.puzzle && (afterCore.puzzle.arrangementSignature !== beforeCore.puzzle.arrangementSignature || afterCore.puzzle.exchangeCount !== beforeCore.puzzle.exchangeCount)) {
        return FAIL('optional panel corrupted puzzle state');
      }
      if (after.overlayBlocking && after.canInteractWithPlayfield) return FAIL('optional panel close left inconsistent blocking state');
      return PASS('optional panel closed without corrupting play');
    }
  },
  {
    id: 'p2-contract-visual-feedback-without-audio',
    level: 'P2',
    name: 'drag and completion feedback are observable without audio oracle',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'mergeCandidatePuzzle');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      const move = findMove(before.puzzle, { createsMerge: true }) || findMove(before.puzzle, { subjectType: 'piece' });
      if (!move) return FAIL('no public move for visual feedback path');
      const visualBefore = visualRevision(before);
      const after = await performContractMove(game, move);
      if (!accepted(after)) return FAIL('visual feedback move was not accepted');
      if (visualRevision(after) === visualBefore) return FAIL('no visual/HUD/feedback revision changed without audio evidence');
      if (browser.exceptions.some((e) => /audio|media|sound/i.test(e.description || e.text || ''))) return FAIL('audio exception disrupted core play');
      return PASS('visual feedback revisions prove action without audio oracle');
    }
  },
  {
    id: 'p2-contract-storage-failure-tolerance',
    level: 'P2',
    name: 'storage write failure does not crash current session',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.evalPage(`(function(){
        window.__l2StoragePatch = window.__l2StoragePatch || {};
        if (!window.__l2StoragePatch.setItem) window.__l2StoragePatch.setItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(){ throw new Error('l2 simulated storage failure'); };
        return true;
      })()`);
      try {
        const menu = await loadLegal(game, 'menuReady', { clearSave: true });
        if (menu.error) return FAIL(menu.error);
        const started = await game.input({ type: 'pressControl', control: 'newGame' });
        const snap = await game.waitFor((s) => s.phase === 'playing' || s.phase === 'menu' || s.phase === 'error', 5000);
        if (snap.phase === 'error') return FAIL('storage failure put game into error phase');
        if (browser.exceptions.some((e) => /l2 simulated storage failure/i.test(e.description || e.text || ''))) return FAIL('storage exception escaped uncaught');
        if (snap.phase === 'playing') {
          const err = assertPlayablePuzzle(snap);
          if (err) return FAIL(`current session not playable after storage failure: ${err}`);
        } else if (!rejected(started) && !(snap.controls.newGame && snap.controls.newGame.enabled)) {
          return FAIL('storage failure left neither playable session nor recoverable menu');
        }
        return PASS(`storage failure tolerated in phase=${snap.phase}`);
      } finally {
        await game.evalPage(`(function(){
          if (window.__l2StoragePatch && window.__l2StoragePatch.setItem) Storage.prototype.setItem = window.__l2StoragePatch.setItem;
          return true;
        })()`);
      }
    }
  },
  {
    id: 'p2-touch-drag-parity',
    level: 'P2',
    name: 'touch drag parity uses semantic bounds when touch is available',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const setup = await loadLegal(game, 'activePuzzle');
      if (setup.error) return FAIL(setup.error);
      const before = setup.snap;
      const move = findMove(before.puzzle, { subjectType: 'piece' });
      if (!move) return FAIL('activePuzzle lacks legal move for touch parity');
      const points = movePoints(before.puzzle, move);
      if (!points) return FAIL('touch parity semantic points missing');
      const result = await game.realTouchDrag(points.start, points.end);
      if (result.notApplicable) return NA(result.notApplicable);
      if (result.error) return FAIL(result.error);
      const after = result.after;
      const semanticAccepted = after && after.puzzle &&
        after.puzzle.arrangementSignature !== before.puzzle.arrangementSignature &&
        after.puzzle.exchangeCount === before.puzzle.exchangeCount + 1;
      if (!semanticAccepted) return FAIL('touch drag did not produce accepted result class');
      if (after.puzzle.dragging && after.puzzle.dragging.active) return FAIL('touch drag did not release cleanup');
      return PASS('touch drag parity accepted and released cleanly');
    }
  }
];

module.exports = { suite };
