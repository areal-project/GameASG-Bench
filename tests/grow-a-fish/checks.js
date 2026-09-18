// === GDD Coverage Map ===
// M1 (海底主场景与 HUD) -> p0-boot-stability, p0-contract-snapshot-schema, p1-real-mouse-click-start-unblocks, p2-feedback-observability
// M2 (玩家移动与镜头) -> p1-real-keyboard-direction-opposite, p1-real-mouse-pointer-follow, p1-real-touch-joystick-opposite, p2-boundary-invariant
// M3 (捕食成长循环) -> p1-real-mouse-eat-growth-loop, p2-oversized-fish-not-edible, p2-feedback-observability
// M4 (危险鱼、受伤与重生) -> p1-real-mouse-danger-lives-loop, p2-danger-safe-side-rejected, p2-respawn-invulnerability-prevents-chain-hit, p2-terminal-lock-unchanged
// M5 (鱼群 AI 与危险强度) -> p2-world-motion-feedback
// M6 (关卡选择与解锁) -> p0-contract-snapshot-schema, p1-contract-level-complete-unlocks, p2-locked-level-rejected
// M7 (过关、星级与下一关) -> p1-contract-level-complete-unlocks
// M8 (失败与重试) -> p1-real-mouse-click-retry-resets, p2-terminal-lock-unchanged
// M9 (菜单/遮罩阻塞) -> p1-real-mouse-click-start-unblocks, p1-real-mouse-click-retry-resets
// M10 (音频与视觉反馈) -> p2-feedback-observability
// M11 (调参/编辑预览) -> P2 optional, not required for core runtime checks.
//
// === Category Map ===
// Boot & Stability -> p0-boot-stability, p0-contract-snapshot-schema
// UI Flow & Blocking -> p1-real-mouse-click-start-unblocks, p1-real-mouse-click-retry-resets
// Input Semantics -> p1-real-keyboard-direction-opposite, p1-real-mouse-pointer-follow, p1-real-touch-joystick-opposite
// Core Mechanic Loop -> p1-real-mouse-eat-growth-loop, p1-real-mouse-danger-lives-loop, p1-contract-level-complete-unlocks
// State Machine -> p1-real-mouse-click-retry-resets, p2-terminal-lock-unchanged
// Economy/Progression -> p1-contract-level-complete-unlocks, p2-locked-level-rejected
// Feedback & Observability -> p2-feedback-observability, p2-world-motion-feedback
// Invariants & Rejection -> p2-locked-level-rejected, p2-boundary-invariant, p2-oversized-fish-not-edible, p2-danger-safe-side-rejected, p2-respawn-invulnerability-prevents-chain-hit, p2-terminal-lock-unchanged
// Depth/Optional Systems -> p2-world-motion-feedback
//
// === Rationality Map ===
// p1-real-mouse-click-start-unblocks: M1/M6/M9 | real action: browser mouseClick on semantic start control | independent observation: phase + HUD/playfield blocking | empty-shell failure: static menu button without state transition fails
// p1-real-keyboard-direction-opposite: M2 | real action: KeyD then KeyA, KeyW then KeyS | independent observation: screen/world position deltas + bounds | empty-shell failure: no movement or same-direction movement fails; direction opposite is required
// p1-real-mouse-pointer-follow: M2 | real action: browser mouseMove/mouseClick into playfield side | independent observation: player position/facing/render revision | empty-shell failure: API-only movement or inert canvas fails
// p1-real-touch-joystick-opposite: M2 | real action: dispatchTouchEvent drag right then left on joystick | independent observation: joystick direction/player screen delta | empty-shell failure: desktop-only or same-direction touch controls fail
// p1-real-mouse-eat-growth-loop: M3/M10 | real action: mouseMove/mouseClick toward visible edible target after legal setup | independent observation: size/progress/entity count/eatRevision | empty-shell failure: API-only feeding or no collision path fails
// p1-real-mouse-danger-lives-loop: M4 | real action: mouseMove/mouseClick toward visible predator attack point after legal setup | independent observation: lives delta + hitRevision/phase | empty-shell failure: predator without real damage path fails
// p1-contract-level-complete-unlocks: M6/M7 | contract action: near_level_complete then eatTarget | independent observation: levelComplete/result/nextLevel/unlocked count | empty-shell failure: direct static result or no unlock fails
// p1-real-mouse-click-retry-resets: M8/M9 | real action: mouseClick retry after one-life danger | independent observation: phase/lives/progress/overlay | empty-shell failure: retry button without reset fails
// p2-locked-level-rejected: M6 | contract action: locked level select | independent observation: rejected or phase unchanged + unlocked unchanged | empty-shell failure: all levels startable fails
// p2-boundary-invariant: M2 | contract action: repeated outward movement | independent observation: coordinates clamped + totalBefore/totalAfter life/size unchanged | empty-shell failure: boundary escape or unrelated mutation fails
// p2-oversized-fish-not-edible: M3/M4 | contract action: oversized_near_player then moveToVisibleFish/eatTarget | independent observation: size/progress unchanged and no prey consumption | empty-shell failure: all fish are edible fails
// p2-danger-safe-side-rejected: M4 | contract action: danger_wrong_side then approachDanger/moveToVisibleFish | independent observation: lives/size/progress unchanged | empty-shell failure: any overlap with predator damages player fails
// p2-respawn-invulnerability-prevents-chain-hit: M4 | contract action: post_hit_invulnerable then approachDanger | independent observation: lives do not drop again + invulnerable/respawn state | empty-shell failure: no protection after hit fails
// p2-terminal-lock-unchanged: M4/M8 | contract action: move/eat after gameOver | independent observation: unchanged position/size/lives | empty-shell failure: terminal state still accepts input fails
// p2-feedback-observability: M1/M3/M4/M10 | contract actions: eat and danger | independent observation: feedback revisions and HUD/snapshot state | empty-shell failure: hidden-only state changes fail
// p2-world-motion-feedback: M5 | real wait in playing state | independent observation: worldMotionRevision or fish screen positions change | empty-shell failure: decorative static fish fail

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function nearlySame(a, b, eps = 0.001) {
  return Math.abs((a || 0) - (b || 0)) <= eps;
}

function positionOf(snap) {
  const p = snap && snap.player ? snap.player : {};
  return {
    screenX: isNum(p.screenX) ? p.screenX : null,
    screenY: isNum(p.screenY) ? p.screenY : null,
    worldX: isNum(p.worldX) ? p.worldX : null,
    worldY: isNum(p.worldY) ? p.worldY : null,
    facing: p.facing || ''
  };
}

function deltaAxis(before, after, axis) {
  const b = positionOf(before);
  const a = positionOf(after);
  const screenKey = axis === 'x' ? 'screenX' : 'screenY';
  const worldKey = axis === 'x' ? 'worldX' : 'worldY';
  const screenDelta = isNum(b[screenKey]) && isNum(a[screenKey]) ? a[screenKey] - b[screenKey] : null;
  const worldDelta = isNum(b[worldKey]) && isNum(a[worldKey]) ? a[worldKey] - b[worldKey] : null;
  if (isNum(worldDelta) && Math.abs(worldDelta) > 0.5 &&
      (!isNum(screenDelta) || Math.abs(screenDelta) <= 0.5 || Math.sign(screenDelta) !== Math.sign(worldDelta))) {
    return worldDelta;
  }
  if (isNum(screenDelta) && Math.abs(screenDelta) > 0.5) {
    return screenDelta;
  }
  if (isNum(worldDelta)) {
    return worldDelta;
  }
  return 0;
}

function visibleFishList(snap) {
  return snap && snap.entities && Array.isArray(snap.entities.visibleFish) ? snap.entities.visibleFish : [];
}

function pickFish(snap, predicate) {
  return visibleFishList(snap).find(predicate) || null;
}

function pointFromFish(fish, playfield) {
  if (!fish) return null;
  const source = fish.approachPoint || fish.safeApproachPoint || fish;
  let x = isNum(source.screenX) ? source.screenX : null;
  let y = isNum(source.screenY) ? source.screenY : null;
  if (!isNum(x) || !isNum(y)) return null;
  const bounds = playfield && playfield.bounds ? playfield.bounds : null;
  if (bounds && x >= 0 && x <= 1 && y >= 0 && y <= 1) {
    x = bounds.left + bounds.width * x;
    y = bounds.top + bounds.height * y;
  }
  return { x, y };
}

function pointFromSafeFish(fish, playfield) {
  if (!fish || !fish.safeApproachPoint) return pointFromFish(fish, playfield);
  let x = fish.safeApproachPoint.screenX;
  let y = fish.safeApproachPoint.screenY;
  const bounds = playfield && playfield.bounds ? playfield.bounds : null;
  if (bounds && x >= 0 && x <= 1 && y >= 0 && y <= 1) {
    x = bounds.left + bounds.width * x;
    y = bounds.top + bounds.height * y;
  }
  return isNum(x) && isNum(y) ? { x, y } : null;
}

function createGameDriver(browser) {
  async function evalPage(src) {
    return await browser.eval(`(function(){ ${src} })()`);
  }

  async function snapshot() {
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') return null;
      return window.__gameTest.getSnapshot();
    `);
  }

  async function reset(options) {
    const payload = JSON.stringify(options || {});
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return { __missing: 'reset' };
      return window.__gameTest.reset(${payload});
    `);
  }

  async function contractInput(action) {
    const payload = JSON.stringify(action || {});
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { __missing: 'input' };
      return window.__gameTest.input(${payload});
    `);
  }

  async function loadScenario(name, options) {
    const scenario = JSON.stringify(name);
    const payload = JSON.stringify(options || {});
    return await evalPage(`
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { __missing: 'loadScenario' };
      return window.__gameTest.loadScenario(${scenario}, ${payload});
    `);
  }

  async function waitForReady(maxWait = 12000) {
    const deadline = Date.now() + maxWait;
    while (Date.now() < deadline) {
      const ready = await evalPage(`
        const hasContract = !!(window.__gameTest && typeof window.__gameTest.getSnapshot === 'function');
        const playfield = document.querySelector('[data-game-playfield], canvas, [role="application"], .playfield, .game-area');
        const rect = playfield ? playfield.getBoundingClientRect() : null;
        return {
          hasContract,
          hasPlayfield: !!(rect && rect.width >= 200 && rect.height >= 200),
          readyState: document.readyState
        };
      `);
      if (ready && ready.readyState !== 'loading' && (ready.hasContract || ready.hasPlayfield)) return ready;
      await sleep(250);
    }
    return null;
  }

  async function startButtonPoint() {
    return await evalPage(`
      const candidates = Array.from(document.querySelectorAll('button,[role="button"],[data-game-control]'));
      function visible(el) {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 20 && r.height > 20 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity || 1) > 0.05;
      }
      const start = candidates.find(el => {
        const semantic = ((el.getAttribute('data-game-control') || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.id || '').replace(/([a-z])([A-Z])/g, '$1 $2') + ' ' + (el.textContent || '')).toLowerCase();
        return visible(el) && /\\b(start|play|begin|dive in|enter)\\b/.test(semantic) &&
          !/\\b(how to play|instructions|help)\\b/.test(semantic);
      });
      if (!start) return null;
      const r = start.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    `);
  }

  async function retryButtonPoint() {
    return await evalPage(`
      const candidates = Array.from(document.querySelectorAll('button,[role="button"],[data-game-control]'));
      function visible(el) {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 20 && r.height > 20 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity || 1) > 0.05;
      }
      const retry = candidates.find(el => {
        const semantic = ((el.getAttribute('data-game-control') || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.textContent || '')).toLowerCase();
        return visible(el) && /(retry|restart|try again|again)/.test(semantic);
      });
      if (!retry) return null;
      const r = retry.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    `);
  }

  async function playfieldPoint(xRatio, yRatio) {
    const snap = await snapshot();
    const b = snap && snap.playfield && snap.playfield.bounds;
    if (!b || !isNum(b.left) || !isNum(b.top) || !isNum(b.width) || !isNum(b.height) || b.width <= 0 || b.height <= 0) {
      throw new Error('playfield.bounds must expose positive numeric bounds for real mouse follow checks');
    }
    const dom = await evalPage(`
      const playfield = document.querySelector('[data-game-playfield], canvas, [role="application"], .playfield, .game-area');
      const rect = playfield ? playfield.getBoundingClientRect() : null;
      return rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
    `);
    if (!dom || !isNum(dom.left) || !isNum(dom.top) || !isNum(dom.width) || !isNum(dom.height) || dom.width <= 20 || dom.height <= 20) {
      throw new Error('visible playfield must expose a runtime screen area for real mouse follow checks');
    }
    return { x: dom.left + dom.width * xRatio, y: dom.top + dom.height * yRatio, width: dom.width, height: dom.height };
  }

  async function realMouseClick(point) {
    await browser.mouseClick(point.x, point.y);
  }

  async function realMouseMove(point) {
    await browser.mouseMove(point.x, point.y);
  }

  async function holdKey(key, ms) {
    await browser.holdKey(key, ms);
  }

  async function realTouchDrag(from, to, ms = 450) {
    const steps = 6;
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y, radiusX: 5, radiusY: 5, id: 1 }]
    });
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      await sleep(ms / steps);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y, radiusX: 5, radiusY: 5, id: 1 }]
      });
    }
    await sleep(80);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  async function joystickCenter() {
    return await evalPage(`
      const snap = window.__gameTest && typeof window.__gameTest.getSnapshot === 'function' ? window.__gameTest.getSnapshot() : null;
      const b = snap && snap.ui && snap.ui.controls && snap.ui.controls.joystickBounds;
      const playfield = Array.from(document.querySelectorAll('canvas, [data-game-playfield], [role="application"], .playfield, .game-area')).find(el => {
        const r = el.getBoundingClientRect();
        return r.width > 1 && r.height > 1;
      });
      const playfieldRect = playfield ? playfield.getBoundingClientRect() : null;
      const candidates = Array.from(document.querySelectorAll('[data-game-control], [aria-label], [id], [class], button, div'));
      function visible(el) {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width >= 50 && r.height >= 50 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity || 1) > 0.05;
      }
      const joy = candidates.find(el => {
        const semantic = ((el.id || '') + ' ' + (el.getAttribute('data-game-control') || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (typeof el.className === 'string' ? el.className : '')).toLowerCase();
        return visible(el) && /(joystick|joy|dpad|virtual.?stick|touch.?control)/.test(semantic);
      });
      if (joy) {
        const r = joy.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
      }
      if (b && playfieldRect) {
        const pb = snap && snap.playfield && snap.playfield.bounds;
        const normalized = b.width > 0 && b.height > 0 && b.width <= 1.5 && b.height <= 1.5 &&
          b.left >= -1 && b.top >= -1 && b.left + b.width <= 2 && b.top + b.height <= 2;
        if (normalized) {
          return { x: playfieldRect.left + (b.left + b.width / 2) * playfieldRect.width, y: playfieldRect.top + (b.top + b.height / 2) * playfieldRect.height, width: b.width * playfieldRect.width, height: b.height * playfieldRect.height };
        }
        if (pb && pb.width > 1 && pb.height > 1) {
          const originX = Number(pb.left) || 0;
          const originY = Number(pb.top) || 0;
          return { x: playfieldRect.left + ((b.left - originX) + b.width / 2) / pb.width * playfieldRect.width, y: playfieldRect.top + ((b.top - originY) + b.height / 2) / pb.height * playfieldRect.height, width: b.width / pb.width * playfieldRect.width, height: b.height / pb.height * playfieldRect.height };
        }
      }
      if (b && b.width > 20 && b.height > 20) return { x: b.left + b.width / 2, y: b.top + b.height / 2, width: b.width, height: b.height };
      return null;
    `);
  }

  return {
    waitForReady,
    snapshot,
    reset,
    contractInput,
    loadScenario,
    startButtonPoint,
    retryButtonPoint,
    playfieldPoint,
    realMouseClick,
    realMouseMove,
    holdKey,
    realTouchDrag,
    joystickCenter
  };
}

async function resetPlaying(game) {
  await game.reset({ startPlaying: true });
  await sleep(300);
  let snap = await game.snapshot();
  if (!snap || snap.phase !== 'playing') {
    await game.contractInput({ type: 'start' });
    await sleep(400);
    snap = await game.snapshot();
  }
  return snap;
}

function basicSnapshotProblems(snap) {
  const problems = [];
  if (!snap || typeof snap !== 'object') problems.push('snapshot missing');
  if (!snap || !['menu', 'playing', 'respawning', 'paused', 'levelComplete', 'gameOver'].includes(snap.phase)) problems.push('invalid phase');
  if (!snap || !snap.level || !isNum(snap.level.count) || snap.level.count < 20) problems.push('level.count < 20');
  if (!snap || !snap.player || !isNum(snap.player.size) || !isNum(snap.player.lives)) problems.push('player size/lives missing');
  if (!snap || !snap.progress || !isNum(snap.progress.growthPercent)) problems.push('progress missing');
  if (snap && snap.progress && (snap.progress.growthPercent < 0 || snap.progress.growthPercent > 100)) problems.push('growthPercent out of range');
  if (!snap || !snap.entities || !isNum(snap.entities.totalFish)) problems.push('entities missing');
  if (!snap || !snap.ui || typeof snap.ui.overlayBlocking !== 'boolean') problems.push('ui overlayBlocking missing');
  if (!snap || !snap.playfield || typeof snap.playfield.nonBlank !== 'boolean') problems.push('playfield nonBlank missing');
  return problems;
}

const checks = [
  {
    id: 'p0-boot-stability',
    level: 'P0',
    name: 'boot stability and visible playfield readiness',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const ready = await game.waitForReady();
      if (!ready) return FAIL('timeout: no public contract or visible playfield became ready');
      const fatal = (ctx.browser.exceptions || []).filter(e => /error|exception|typeerror|referenceerror|syntaxerror/i.test((e.text || '') + ' ' + (e.description || '')));
      if (fatal.length) return FAIL('exception: ' + fatal[0].description);
      return PASS(`ready contract=${ready.hasContract} playfield=${ready.hasPlayfield}`);
    }
  },
  {
    id: 'p0-contract-snapshot-schema',
    level: 'P0',
    name: 'contract snapshot schema and initial bounds',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const snap = await game.reset();
      const current = snap && snap.phase ? snap : await game.snapshot();
      const problems = basicSnapshotProblems(current);
      if (problems.length) return FAIL('wrong-value: ' + problems.join(', '));
      if (current.player.lives < 0 || current.player.lives > current.player.maxLives) return FAIL('wrong-value: lives outside maxLives');
      return PASS(`phase=${current.phase} levels=${current.level.count}`);
    }
  },
  {
    id: 'p1-real-mouse-click-start-unblocks',
    level: 'P1',
    name: 'real mouse click start unblocks playable water',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.reset();
      await sleep(300);
      const point = await game.startButtonPoint();
      if (!point) return FAIL('inaccessible: no visible semantic start control');
      await game.realMouseClick(point);
      await sleep(700);
      const after = await game.snapshot();
      if (!after || after.phase !== 'playing') return FAIL(`no-response: start click did not enter playing (phase=${after && after.phase})`);
      if (!after.ui || after.ui.overlayBlocking || !after.ui.canInteractWithPlayfield) return FAIL('wrong-value: playfield remains blocked after start');
      if (!after.playfield || !after.playfield.nonBlank) return FAIL('wrong-value: playfield is blank after start');
      return PASS('real start click entered playing and unblocked playfield');
    }
  },
  {
    id: 'p1-real-keyboard-direction-opposite',
    level: 'P1',
    name: 'real keyboard left right up down movement has opposite screen direction',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const start = await resetPlaying(game);
      if (!start || start.phase !== 'playing') return FAIL('inaccessible: could not start playing for keyboard movement');
      const p0 = await game.snapshot();
      await game.holdKey('KeyD', 650);
      await sleep(150);
      const pRight = await game.snapshot();
      await game.holdKey('KeyA', 900);
      await sleep(150);
      const pLeft = await game.snapshot();
      await game.holdKey('KeyW', 650);
      await sleep(150);
      const pUp = await game.snapshot();
      await game.holdKey('KeyS', 900);
      await sleep(150);
      const pDown = await game.snapshot();

      const deltaRight = deltaAxis(p0, pRight, 'x');
      const deltaLeft = deltaAxis(pRight, pLeft, 'x');
      const deltaUp = deltaAxis(pLeft, pUp, 'y');
      const deltaDown = deltaAxis(pUp, pDown, 'y');

      if (Math.abs(deltaRight) < 0.5 || Math.abs(deltaLeft) < 0.5) return FAIL(`no-response: horizontal movement too small right=${deltaRight} left=${deltaLeft}`);
      if (Math.sign(deltaRight) === Math.sign(deltaLeft)) return FAIL(`wrong-value: left/right are not opposite directions (${deltaRight}, ${deltaLeft})`);
      if (Math.abs(deltaUp) < 0.5 || Math.abs(deltaDown) < 0.5) return FAIL(`no-response: vertical movement too small up=${deltaUp} down=${deltaDown}`);
      if (Math.sign(deltaUp) === Math.sign(deltaDown)) return FAIL(`wrong-value: up/down are not opposite directions (${deltaUp}, ${deltaDown})`);
      const pos = positionOf(pDown);
      const lvl = pDown.level || {};
      if (isNum(pos.worldX) && (pos.worldX < 0 || pos.worldX > lvl.width)) return FAIL('wrong-value: player escaped horizontal bounds');
      if (isNum(pos.worldY) && (pos.worldY < 0 || pos.worldY > lvl.height)) return FAIL('wrong-value: player escaped vertical bounds');
      return PASS(`opposite direction deltas x=(${deltaRight.toFixed(2)},${deltaLeft.toFixed(2)}) y=(${deltaUp.toFixed(2)},${deltaDown.toFixed(2)})`);
    }
  },
  {
    id: 'p1-real-mouse-pointer-follow',
    level: 'P1',
    name: 'real mouse pointer movement influences player direction',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await resetPlaying(game);
      if (!before || before.phase !== 'playing') return FAIL('inaccessible: could not start playing for mouse follow');
      const rightPoint = await game.playfieldPoint(0.85, 0.5);
      const leftPoint = await game.playfieldPoint(0.15, 0.5);
      await game.realMouseMove(rightPoint);
      await game.realMouseClick(rightPoint);
      await sleep(700);
      const afterRight = await game.snapshot();
      await game.realMouseMove(leftPoint);
      await sleep(900);
      const afterLeft = await game.snapshot();
      const dRight = deltaAxis(before, afterRight, 'x');
      const dLeft = deltaAxis(afterRight, afterLeft, 'x');
      const beforeFacing = String(positionOf(before).facing || '').toLowerCase();
      const rightFacing = String(positionOf(afterRight).facing || '').toLowerCase();
      const leftFacing = String(positionOf(afterLeft).facing || '').toLowerCase();
      const rightResponded = Math.abs(dRight) >= 0.5 || (rightFacing === 'right' && rightFacing !== beforeFacing);
      const leftResponded = Math.abs(dLeft) >= 0.5 || (leftFacing === 'left' && leftFacing !== rightFacing);
      if (!rightResponded || !leftResponded) {
        return FAIL(`no-response: right=${dRight.toFixed(2)} left=${dLeft.toFixed(2)} facing=${beforeFacing}->${rightFacing}->${leftFacing}`);
      }
      if (Math.abs(dRight) >= 0.5 && Math.abs(dLeft) >= 0.5 && Math.sign(dRight) === Math.sign(dLeft)) return FAIL('wrong-value: pointer left/right did not produce opposite response');
      return PASS(`mouse follow deltas right=${dRight.toFixed(2)} left=${dLeft.toFixed(2)}`);
    }
  },
  {
    id: 'p1-real-touch-joystick-opposite',
    level: 'P1',
    name: 'real touch joystick drag has opposite screen direction',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const start = await resetPlaying(game);
      if (!start || start.phase !== 'playing') return FAIL('inaccessible: could not start playing for touch joystick');
      if (!start.ui || !start.ui.controls || !start.ui.controls.joystick) return FAIL('inaccessible: snapshot does not expose a visible joystick control');
      const center = await game.joystickCenter();
      if (!center) return FAIL('inaccessible: no visible joystick bounds/center found');
      // realTouchDrag sends CDP Input.dispatchTouchEvent events.
      const distance = Math.max(35, Math.min(90, center.width * 0.45));
      const p0 = await game.snapshot();
      await game.realTouchDrag({ x: center.x, y: center.y }, { x: center.x + distance, y: center.y }, 550);
      await sleep(250);
      const pRight = await game.snapshot();
      await game.realTouchDrag({ x: center.x, y: center.y }, { x: center.x - distance, y: center.y }, 700);
      await sleep(250);
      const pLeft = await game.snapshot();
      const dRight = deltaAxis(p0, pRight, 'x');
      const dLeft = deltaAxis(pRight, pLeft, 'x');
      const dirRight = pRight && pRight.ui && pRight.ui.controls ? pRight.ui.controls.joystickDirection : '';
      const dirLeft = pLeft && pLeft.ui && pLeft.ui.controls ? pLeft.ui.controls.joystickDirection : '';
      const directionEvidence = /right/i.test(String(dirRight)) && /left/i.test(String(dirLeft));
      if (!directionEvidence && (Math.abs(dRight) < 0.5 || Math.abs(dLeft) < 0.5)) return FAIL(`no-response: joystick touch drag did not move or expose direction (${dRight}, ${dLeft})`);
      if (!directionEvidence && Math.sign(dRight) === Math.sign(dLeft)) return FAIL(`wrong-value: joystick right/left produced same direction (${dRight}, ${dLeft})`);
      return PASS(`touch joystick direction observed delta=(${dRight.toFixed(2)},${dLeft.toFixed(2)}) dirs=(${dirRight},${dirLeft})`);
    }
  },
  {
    id: 'p1-real-mouse-eat-growth-loop',
    level: 'P1',
    name: 'real mouse target movement grows player and consumes prey',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('edible_near_player');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(edible_near_player) contract missing');
      if (before.phase !== 'playing') return FAIL('wrong-value: edible scenario is not playing');
      const fish = pickFish(before, f => f.role === 'edible' || f.canEat === true);
      if (!fish) return FAIL('inaccessible: no visible edible target in snapshot');
      const totalBefore = before.entities ? before.entities.totalFish : null;
      const edibleBefore = before.entities ? before.entities.edibleCount : null;
      const sizeBefore = before.player ? before.player.size : null;
      const progressBefore = before.progress ? before.progress.growthPercent : null;
      const feedbackBefore = before.feedback ? before.feedback.eatRevision : null;
      let snap = before;
      for (let i = 0; i < 8; i++) {
        const currentFish = pickFish(snap, f => f.id === fish.id) || pickFish(snap, f => f.role === 'edible' || f.canEat === true);
        const point = pointFromFish(currentFish, snap.playfield);
        if (!currentFish || !point) break;
        await game.realMouseMove(point);
        await game.realMouseClick(point);
        await sleep(240);
        snap = await game.snapshot();
        if (snap && (snap.player.size > sizeBefore || snap.progress.growthPercent > progressBefore || snap.feedback.eatRevision > feedbackBefore)) break;
      }
      if (!snap || snap.__missing) return FAIL('inaccessible: snapshot missing after real edible target input');
      if (!(snap.player.size > sizeBefore || snap.progress.growthPercent > progressBefore)) return FAIL('wrong-value: real target movement did not increase size or growth progress');
      const totalAfter = snap.entities.totalFish;
      const edibleAfter = snap.entities.edibleCount;
      if (!(totalAfter < totalBefore || edibleAfter < edibleBefore || snap.feedback.eatRevision > feedbackBefore)) return FAIL('wrong-value: prey was not consumed and eat feedback did not advance after real input');
      if (snap.entities.dangerousCount < 0) return FAIL('wrong-value: dangerousCount became negative');
      return PASS(`real eat target=${fish.id} size ${sizeBefore}->${snap.player.size}, progress ${progressBefore}->${snap.progress.growthPercent}`);
    }
  },
  {
    id: 'p1-real-mouse-danger-lives-loop',
    level: 'P1',
    name: 'real mouse danger approach removes life and gives hit feedback',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('danger_near_player');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(danger_near_player) contract missing');
      if (before.phase !== 'playing') return FAIL('wrong-value: danger scenario is not playing');
      const fish = pickFish(before, f => f.role === 'dangerous' || f.canDamagePlayer === true);
      const point = pointFromFish(fish, before.playfield);
      if (!fish || !point) return FAIL('inaccessible: no visible dangerous target attack point in snapshot');
      const livesBefore = before.player.lives;
      const hitBefore = before.feedback.hitRevision;
      await game.realMouseMove(point);
      await game.realMouseClick(point);
      await sleep(1400);
      const snap = await game.snapshot();
      if (!snap || snap.__missing) return FAIL('inaccessible: snapshot missing after real danger input');
      if (!(snap.player.lives < livesBefore)) return FAIL(`wrong-value: real danger approach did not reduce lives (${livesBefore}->${snap.player.lives})`);
      if (!(snap.feedback.hitRevision > hitBefore || snap.phase === 'respawning' || snap.player.invulnerable || snap.phase === 'gameOver')) return FAIL('wrong-value: hit feedback/respawn state missing after damage');
      if (snap.player.lives < 0) return FAIL('wrong-value: lives went negative');
      return PASS(`real danger target=${fish.id} lives ${livesBefore}->${snap.player.lives}, phase=${snap.phase}`);
    }
  },
  {
    id: 'p1-contract-level-complete-unlocks',
    level: 'P1',
    name: 'contract near-complete feeding shows result and unlocks progression',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('near_level_complete');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(near_level_complete) contract missing');
      if (before.progress.levelComplete) return FAIL('wrong-value: scenario already complete before player action');
      const unlockedBefore = before.level.unlockedCount;
      const levelIndex = before.level.index;
      const after = await game.contractInput({ type: 'eatTarget' });
      await sleep(250);
      const snap = after && after.phase ? after : await game.snapshot();
      if (!snap || snap.__missing) return FAIL('inaccessible: input(eatTarget) contract missing');
      if (snap.phase !== 'levelComplete' || !snap.progress.levelComplete) return FAIL(`wrong-value: target-size feeding did not complete level (phase=${snap.phase})`);
      if (!snap.ui || !snap.ui.resultVisible || !snap.ui.overlayBlocking) return FAIL('wrong-value: level complete result overlay is not visible/blocking');
      const shouldUnlock = levelIndex + 1 < snap.level.count;
      if (shouldUnlock && snap.level.unlockedCount < Math.max(unlockedBefore, levelIndex + 1)) return FAIL('wrong-value: next level was not unlocked after completion');
      if (!snap.ui.controls || !snap.ui.controls.nextLevel) return FAIL('wrong-value: next level control unavailable after completion');
      return PASS(`completed level=${levelIndex}, unlocked=${unlockedBefore}->${snap.level.unlockedCount}`);
    }
  },
  {
    id: 'p1-real-mouse-click-retry-resets',
    level: 'P1',
    name: 'real mouse click retry resets game over state',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('one_life_danger');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(one_life_danger) contract missing');
      await game.contractInput({ type: 'approachDanger' });
      await sleep(500);
      const over = await game.snapshot();
      if (!over || over.phase !== 'gameOver' || !over.ui.gameOverVisible) return FAIL(`wrong-value: one-life danger did not reach gameOver (phase=${over && over.phase})`);
      const point = await game.retryButtonPoint();
      if (!point) return FAIL('inaccessible: no visible retry control after gameOver');
      await game.realMouseClick(point);
      await sleep(700);
      const after = await game.snapshot();
      if (!after || after.phase !== 'playing') return FAIL(`no-response: retry click did not return to playing (phase=${after && after.phase})`);
      if (after.ui.gameOverVisible || after.ui.overlayBlocking) return FAIL('wrong-value: retry left gameOver overlay blocking');
      if (!(after.player.lives === after.player.maxLives || after.player.lives > 0)) return FAIL('wrong-value: retry did not restore lives');
      if (after.progress.growthPercent > 5) return FAIL('wrong-value: retry did not reset growth progress near start');
      return PASS(`retry restored phase=${after.phase}, lives=${after.player.lives}`);
    }
  },
  {
    id: 'p2-locked-level-rejected',
    level: 'P2',
    name: 'contract invalid locked level selection is rejected unchanged',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('locked_level_menu');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(locked_level_menu) contract missing');
      const unlockedBefore = before.level.unlockedCount;
      const lockedLevel = Math.min(before.level.count, unlockedBefore + 1);
      if (lockedLevel <= unlockedBefore) return PASS('all levels unlocked, no locked level to reject');
      const after = await game.contractInput({ type: 'selectLevel', level: lockedLevel });
      await sleep(150);
      const snap = after && after.phase ? after : await game.snapshot();
      const rejected = !!(snap.rejected || snap.ok === false || snap.reason);
      if (!rejected && snap.phase === 'playing' && snap.level.index === lockedLevel) return FAIL('wrong-value: locked level started playing instead of being rejected');
      if (snap.level.unlockedCount !== unlockedBefore) return FAIL('wrong-value: locked level selection changed unlockedCount');
      return PASS(`locked level ${lockedLevel} rejected=${rejected}, phase=${snap.phase}`);
    }
  },
  {
    id: 'p2-boundary-invariant',
    level: 'P2',
    name: 'contract boundary movement clamps player and preserves life size invariant',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('wide_level_boundary');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(wide_level_boundary) contract missing');
      const totalBefore = {
        lives: before.player.lives,
        size: before.player.size,
        level: before.level.index
      };
      const outward = before.player.worldX > before.level.width / 2 ? 'right' : 'left';
      for (let i = 0; i < 8; i++) {
        await game.contractInput({ type: 'move', direction: outward, durationMs: 250 });
      }
      const after = await game.snapshot();
      const totalAfter = {
        lives: after.player.lives,
        size: after.player.size,
        level: after.level.index
      };
      if (after.player.worldX < 0 || after.player.worldX > after.level.width || after.player.worldY < 0 || after.player.worldY > after.level.height) {
        return FAIL('wrong-value: player escaped level bounds');
      }
      if (totalBefore.lives !== totalAfter.lives || !nearlySame(totalBefore.size, totalAfter.size) || totalBefore.level !== totalAfter.level) {
        return FAIL(`wrong-value: boundary movement changed invariant totalBefore=${JSON.stringify(totalBefore)} totalAfter=${JSON.stringify(totalAfter)}`);
      }
      return PASS(`boundary preserved totalBefore=${JSON.stringify(totalBefore)} totalAfter=${JSON.stringify(totalAfter)}`);
    }
  },
  {
    id: 'p2-oversized-fish-not-edible',
    level: 'P2',
    name: 'contract oversized fish contact does not grant eating growth',
    timeoutMs: 22000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('oversized_near_player');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(oversized_near_player) contract missing');
      const target = pickFish(before, f => f.role === 'dangerous' || f.canEat === false || f.size > before.player.size);
      const action = target && target.id ? { type: 'moveToVisibleFish', targetId: target.id } : { type: 'eatTarget' };
      const after = await game.contractInput(action);
      await sleep(200);
      const snap = after && after.phase ? after : await game.snapshot();
      if (!snap || snap.__missing) return FAIL('inaccessible: oversized fish contact action/snapshot missing');
      const rejected = !!(snap.rejected || snap.ok === false || snap.reason);
      const growthUnchanged = nearlySame(snap.player.size, before.player.size, 0.001) &&
        nearlySame(snap.progress.growthPercent, before.progress.growthPercent, 0.001);
      if (!rejected && !growthUnchanged) return FAIL('wrong-value: oversized fish contact increased size/progress instead of rejecting eating');
      if (snap.entities.dangerousCount < 0 || snap.entities.totalFish < 0) return FAIL('wrong-value: fish counts became invalid after oversized rejection');
      if (snap.level.index !== before.level.index) return FAIL('wrong-value: oversized rejection changed level');
      return PASS(`oversized contact rejected=${rejected} size=${before.player.size}->${snap.player.size}`);
    }
  },
  {
    id: 'p2-danger-safe-side-rejected',
    level: 'P2',
    name: 'contract predator safe side or distance does not damage player',
    timeoutMs: 22000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('danger_wrong_side');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(danger_wrong_side) contract missing');
      const target = pickFish(before, f => f.role === 'dangerous');
      if (!target || !target.id) return FAIL('inaccessible: danger_wrong_side has no visible dangerous target');
      if (!before.player || !isNum(before.player.lives) || !isNum(before.player.size) ||
          !before.progress || !isNum(before.progress.growthPercent)) {
        return FAIL('inaccessible: danger_wrong_side snapshot lacks numeric core state');
      }

      const screenPoint = (value, playfield) => {
        if (!value || !isNum(value.screenX) || !isNum(value.screenY)) return null;
        let x = value.screenX;
        let y = value.screenY;
        const bounds = playfield && playfield.bounds;
        if (bounds && isNum(bounds.left) && isNum(bounds.top) &&
            isNum(bounds.width) && isNum(bounds.height) &&
            x >= 0 && x <= 1 && y >= 0 && y <= 1) {
          x = bounds.left + bounds.width * x;
          y = bounds.top + bounds.height * y;
        }
        return { x, y };
      };
      const playerPoint = screenPoint(before.player, before.playfield);
      const attackPoint = screenPoint(target.approachPoint, before.playfield);
      const safePoint = screenPoint(target.safeApproachPoint, before.playfield);
      if (playerPoint && attackPoint && safePoint) {
        const attackDistance = Math.hypot(playerPoint.x - attackPoint.x, playerPoint.y - attackPoint.y);
        const safeDistance = Math.hypot(playerPoint.x - safePoint.x, playerPoint.y - safePoint.y);
        if (safeDistance > attackDistance) return FAIL('wrong-value: danger_wrong_side did not place player on the advertised safe side');
      }

      const action = { type: 'moveToVisibleFish', targetId: target.id };
      const after = await game.contractInput(action);
      await sleep(200);
      const snap = after && after.phase ? after : await game.snapshot();
      if (!snap || snap.__missing) return FAIL('inaccessible: safe-side danger action/snapshot missing');
      if (!snap.player || !isNum(snap.player.lives) || !isNum(snap.player.size) ||
          !snap.progress || !isNum(snap.progress.growthPercent)) {
        return FAIL('inaccessible: safe-side danger response lacks numeric core state');
      }
      if (snap.player.lives !== before.player.lives) return FAIL(`wrong-value: safe-side predator contact changed lives (${before.player.lives}->${snap.player.lives})`);
      if (!nearlySame(snap.player.size, before.player.size, 0.001)) return FAIL('wrong-value: safe-side danger contact changed player size');
      if (!nearlySame(snap.progress.growthPercent, before.progress.growthPercent, 0.001)) return FAIL('wrong-value: safe-side danger contact changed progress');
      if (snap.phase === 'gameOver') return FAIL('wrong-value: safe-side danger contact entered gameOver');
      return PASS(`safe-side predator preserved lives=${snap.player.lives}`);
    }
  },
  {
    id: 'p2-respawn-invulnerability-prevents-chain-hit',
    level: 'P2',
    name: 'contract respawn invulnerability prevents immediate chain hit',
    timeoutMs: 22000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await game.loadScenario('post_hit_invulnerable');
      if (!before || before.__missing) return FAIL('inaccessible: loadScenario(post_hit_invulnerable) contract missing');
      if (!before.player.invulnerable && !before.player.respawning && before.phase !== 'respawning') return FAIL('wrong-value: scenario is not in a protected respawn state');
      const livesBefore = before.player.lives;
      const hitBefore = before.feedback.hitRevision;
      const after = await game.contractInput({ type: 'approachDanger' });
      await sleep(200);
      const snap = after && after.phase ? after : await game.snapshot();
      if (!snap || snap.__missing) return FAIL('inaccessible: invulnerability action/snapshot missing');
      if (snap.player.lives < livesBefore) return FAIL(`wrong-value: protected player took an immediate second hit (${livesBefore}->${snap.player.lives})`);
      if (snap.feedback.hitRevision > hitBefore + 1) return FAIL('wrong-value: hit feedback advanced repeatedly during protection');
      if (snap.phase === 'gameOver' && livesBefore > 1) return FAIL('wrong-value: protected player entered gameOver with lives remaining');
      return PASS(`protected respawn preserved lives=${livesBefore}->${snap.player.lives}`);
    }
  },
  {
    id: 'p2-terminal-lock-unchanged',
    level: 'P2',
    name: 'contract game over rejects movement and eating unchanged',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.loadScenario('one_life_danger');
      await game.contractInput({ type: 'approachDanger' });
      await sleep(400);
      const before = await game.snapshot();
      if (!before || before.phase !== 'gameOver') return FAIL('wrong-value: could not reach gameOver for terminal lock');
      await game.contractInput({ type: 'move', direction: 'right', durationMs: 500 });
      await game.contractInput({ type: 'eatTarget' });
      await sleep(150);
      const after = await game.snapshot();
      const unchanged = nearlySame(before.player.size, after.player.size) &&
        before.player.lives === after.player.lives &&
        nearlySame(before.player.worldX, after.player.worldX, 1) &&
        nearlySame(before.player.worldY, after.player.worldY, 1) &&
        before.phase === after.phase;
      if (!unchanged) return FAIL('wrong-value: terminal gameOver state accepted movement/eating instead of staying unchanged');
      return PASS('gameOver terminal state rejected further gameplay actions unchanged');
    }
  },
  {
    id: 'p2-feedback-observability',
    level: 'P2',
    name: 'contract feedback revisions mirror eat damage and completion',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const eatBefore = await game.loadScenario('edible_near_player');
      const eatAfter = await game.contractInput({ type: 'eatTarget' });
      const dangerBefore = await game.loadScenario('danger_near_player');
      const dangerAfter = await game.contractInput({ type: 'approachDanger' });
      const completeBefore = await game.loadScenario('near_level_complete');
      const completeAfter = await game.contractInput({ type: 'eatTarget' });
      if (!(eatAfter.feedback.eatRevision > eatBefore.feedback.eatRevision)) return FAIL('wrong-value: eatRevision did not advance after eating');
      if (!(dangerAfter.feedback.hitRevision > dangerBefore.feedback.hitRevision)) return FAIL('wrong-value: hitRevision did not advance after danger damage');
      if (!(completeAfter.feedback.levelCompleteRevision > completeBefore.feedback.levelCompleteRevision || completeAfter.ui.resultVisible)) return FAIL('wrong-value: completion feedback/result not observable');
      if (!completeAfter.ui.hudVisible && completeAfter.phase === 'playing') return FAIL('wrong-value: HUD not observable during playing');
      return PASS('eat, hit, and complete feedback are observable');
    }
  },
  {
    id: 'p2-world-motion-feedback',
    level: 'P2',
    name: 'world fish motion changes over time in playing state',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const before = await resetPlaying(game);
      if (!before || before.phase !== 'playing') return FAIL('inaccessible: could not start playing for world motion');
      await sleep(1200);
      const after = await game.snapshot();
      const beforeRev = before.feedback ? before.feedback.worldMotionRevision : null;
      const afterRev = after.feedback ? after.feedback.worldMotionRevision : null;
      let moved = isNum(beforeRev) && isNum(afterRev) && afterRev > beforeRev;
      const beforeFish = before.entities && Array.isArray(before.entities.visibleFish) ? before.entities.visibleFish : [];
      const afterFish = after.entities && Array.isArray(after.entities.visibleFish) ? after.entities.visibleFish : [];
      if (!moved && beforeFish.length && afterFish.length) {
        const byId = new Map(afterFish.map(f => [f.id, f]));
        moved = beforeFish.some(f => {
          const next = byId.get(f.id);
          return next && (Math.abs(next.screenX - f.screenX) > 0.01 || Math.abs(next.screenY - f.screenY) > 0.01);
        });
      }
      if (!moved) return FAIL('no-response: worldMotionRevision and visible fish positions did not change');
      return PASS(`world motion observed revision ${beforeRev}->${afterRev}`);
    }
  }
];

module.exports = {
  sleep,
  suite: checks
};
