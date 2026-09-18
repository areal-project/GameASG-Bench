const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// === GDD Coverage Map ===
// M1 (3D 主场景与 HUD) -> p0-boot-stability, p0-public-contract-schema, p1-ui-playfield-unblocked
// M2 (真实拖拽/触摸瞄准) -> p1-real-drag-direction-semantics, p1-real-drag-depth-semantics, p1-real-touch-drop-drops-fruit
// M3 (释放投放与冷却) -> p1-real-drag-release-drops-fruit, p1-real-touch-drop-drops-fruit, p2-invalid-lower-zone-rejected, p2-cooldown-conservation
// M4 (物理堆叠与同级合成) -> p1-contract-merge-score-loop, p2-contract-nonmatching-rejection, p2-contract-max-tier-does-not-upgrade
// M5 (得分、连击与反馈) -> p1-contract-merge-score-loop, p2-feedback-hud-result-sync
// M6 (危险线失败) -> p1-contract-danger-line-terminal, p1-contract-terminal-lock-rejects-drop
// M7 (主动搅拌终局) -> p1-contract-terminal-lock-rejects-drop, p2-real-blender-button-starts-terminal-flow, p2-contract-empty-cup-blend-result
// M8 (果昔结算动画) -> p2-real-blender-button-starts-terminal-flow, p2-contract-empty-cup-blend-result, p2-feedback-hud-result-sync
// M9 (重开与终局锁定) -> p1-real-restart-cleans-state, p1-contract-terminal-lock-rejects-drop
// M10 (排行榜、音效和提示) -> p2-feedback-hud-result-sync, p2-idle-hint-visible-and-dismissible
//
// === Category Map ===
// Boot & Stability -> p0-boot-stability, p0-public-contract-schema
// UI Flow & Blocking -> p1-ui-playfield-unblocked, p1-real-restart-cleans-state
// Input Semantics -> p1-real-drag-direction-semantics, p1-real-drag-depth-semantics, p1-real-touch-drop-drops-fruit
// Core Mechanic Loop -> p1-real-drag-release-drops-fruit, p1-real-touch-drop-drops-fruit, p1-contract-merge-score-loop
// State Machine -> p1-contract-danger-line-terminal, p1-contract-terminal-lock-rejects-drop, p1-real-restart-cleans-state
// Economy/Progression -> p1-contract-merge-score-loop, p2-feedback-hud-result-sync
// Feedback & Observability -> p0-boot-stability, p2-feedback-hud-result-sync, p2-idle-hint-visible-and-dismissible
// Invariants & Rejection -> p2-invalid-lower-zone-rejected, p2-cooldown-conservation, p2-contract-nonmatching-rejection, p2-contract-max-tier-does-not-upgrade
// Depth/Optional Systems -> p2-real-blender-button-starts-terminal-flow, p2-contract-empty-cup-blend-result
//
// === Rationality Map ===
// p1-ui-playfield-unblocked: M1/M9 | real action: reset/wait from default page | independent observation: phase + playfield bounds + overlayBlocking | empty-shell failure: blocked menu or invisible playfield fails.
// p1-real-drag-direction-semantics: M2 | real action: CDP mouse drag left and right | independent observation: aim.screenX before-after | empty-shell failure: no real drag, static target, or mirrored screen direction fails.
// p1-real-drag-depth-semantics: M2 | real action: CDP mouse drag upward/downward while held | independent observation: aim.worldZ or equivalent aim screen-depth movement | empty-shell failure: vertical/depth input ignored while horizontal works.
// p1-real-drag-release-drops-fruit: M3 | real action: CDP mouse drag and release | independent observation: fruits.count/dropRevision + fruit-local canvas pixels | empty-shell failure: API-only drop, unrendered fruits, or static canvas fails.
// p1-real-touch-drop-drops-fruit: M2/M3 | real action: CDP touch drag and release | independent observation: fruits.count/dropRevision + fruit-local canvas pixels | empty-shell failure: mouse-only, API-only input, or touch drops that do not render fruit fail.
// p1-contract-merge-score-loop: M4/M5 | real action: contract scenario plus wait player action | independent observation: score + mergeRevision + tier counts | empty-shell failure: pre-awarded score, no merge rule, or no HUD state fails.
// p1-contract-danger-line-terminal: M6 | real action: contract scenario plus time wait | independent observation: warning/phase/result | empty-shell failure: missing danger line, instant result, or no terminal transition fails.
// p1-contract-terminal-lock-rejects-drop: M7/M9 | real action: contract blender press plus ordinary drop attempt | independent observation: count/score/dropRevision unchanged | empty-shell failure: terminal state still accepts normal drops fails.
// p1-real-restart-cleans-state: M9 | real action: browser mouseClick on visible restart control | independent observation: score/count/result/canInteract | empty-shell failure: button shell or uncleared state fails.
// p2-invalid-lower-zone-rejected: M3 | real action: CDP drag in rejected lower zone | independent observation: unchanged count/score/dropRevision | empty-shell failure: any screen tap spawning fruit fails.
// p2-cooldown-conservation: M3 | real action: two immediate real drags/releases | independent observation: totalBefore/totalAfter fruit count | empty-shell failure: unlimited rapid spawning fails.
// p2-contract-nonmatching-rejection: M4/M5 | real action: contract scenario plus wait | independent observation: unchanged score/mergeRevision/tier mass | empty-shell failure: merging every collision or fake score fails.
// p2-contract-max-tier-does-not-upgrade: M4/M5 | real action: contract max-tier scenario plus wait | independent observation: unchanged score/mergeRevision/highest tier | empty-shell failure: max tier keeps upgrading or scoring fails.
// p2-real-blender-button-starts-terminal-flow: M7/M8 | real action: browser mouseClick on semantic blender button | independent observation: phase/blender/liquid/count | empty-shell failure: API-only blender or static result fails.
// p2-contract-empty-cup-blend-result: M7/M8 | real action: contract empty cup plus blender press | independent observation: empty result/zero score/restart availability | empty-shell failure: empty blend crashes, spawns fruit, or awards fake score fails.
// p2-feedback-hud-result-sync: M5/M8/M10 | real action: scenario plus terminal flow wait | independent observation: displayedScore/finalScore/result/visualRevision | empty-shell failure: state changes without visible HUD/result fails.
// p2-idle-hint-visible-and-dismissible: M10 | real action: idle wait then real mouse interaction | independent observation: hintVisible/text + playfield interactivity | empty-shell failure: no hint, blocking hint, or non-dismissible hint fails.

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function countByTierTotal(byTier) {
  if (!byTier || typeof byTier !== 'object') return 0;
  return Object.values(byTier).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function importantSnapshotParts(snap) {
  if (!snap || typeof snap !== 'object') return null;
  return {
    phase: snap.phase,
    screen: snap.screen,
    score: Number(snap.score) || 0,
    displayedScore: Number(snap.displayedScore) || 0,
    resultVisible: !!(snap.result && snap.result.visible),
    fruitCount: Number(snap.fruits && snap.fruits.count) || 0,
    totalTierMass: Number(snap.fruits && snap.fruits.totalTierMass) || 0,
    mergeRevision: Number(snap.feedback && snap.feedback.mergeRevision) || 0,
    dropRevision: Number(snap.feedback && snap.feedback.lastDropRevision) || 0,
    visualRevision: Number(snap.feedback && snap.feedback.visualRevision) || 0,
    canDrop: !!(snap.drop && snap.drop.canDrop),
    overlayBlocking: !!(snap.ui && snap.ui.overlayBlocking),
    canInteractWithPlayfield: !!(snap.ui && snap.ui.canInteractWithPlayfield),
    aimVisible: !!(snap.aim && snap.aim.visible),
    aimScreenX: snap.aim && Number(snap.aim.screenX),
    aimScreenY: snap.aim && Number(snap.aim.screenY),
    aimWorldX: snap.aim && Number(snap.aim.worldX),
    aimWorldZ: snap.aim && Number(snap.aim.worldZ),
    warningVisible: !!(snap.danger && snap.danger.warningVisible),
    blenderState: snap.blender && snap.blender.state,
    liquidLevel: Number(snap.blender && snap.blender.liquidLevel) || 0,
    blendedFruitCount: Number(snap.blender && snap.blender.blendedFruitCount) || 0,
    finalScore: Number(snap.result && snap.result.finalScore) || 0,
    resultKind: snap.result && snap.result.kind,
    restartAvailable: !!(snap.ui && snap.ui.restartAvailable),
    hintVisible: !!(snap.feedback && snap.feedback.hintVisible),
    leaderboardStatus: snap.feedback && snap.feedback.leaderboard && snap.feedback.leaderboard.status,
    leaderboardVisible: !!(snap.feedback && snap.feedback.leaderboard && snap.feedback.leaderboard.visible),
    leaderboardEntryCount: Number(snap.feedback && snap.feedback.leaderboard && snap.feedback.leaderboard.entryCount) || 0,
    tierCount: Number(snap.fruits && snap.fruits.tierCount) || 0,
    highestTier: Number(snap.fruits && snap.fruits.highestTier) || 0,
    byTier: snap.fruits && snap.fruits.byTier
  };
}

async function pageInfo(browser) {
  return await browser.eval(`
    (function() {
      const canvasList = Array.from(document.querySelectorAll('canvas'));
      let best = null;
      let bestArea = -1;
      for (const c of canvasList) {
        const r = c.getBoundingClientRect();
        const area = Math.max(0, r.width) * Math.max(0, r.height);
        if (area > bestArea) { bestArea = area; best = c; }
      }
      const rect = best ? best.getBoundingClientRect() : null;
      const visibleText = document.body ? document.body.innerText.slice(0, 3000) : '';
      return {
        hasCanvas: !!best,
        canvasCount: canvasList.length,
        rect: rect ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : null,
        text: visibleText,
        l2: window.__l2 ? { frameCount: window.__l2.frameCount, mouseListeners: window.__l2.mouseListeners } : null,
        contract: !!(window.__gameTest && typeof window.__gameTest.getSnapshot === 'function')
      };
    })()
  `);
}

async function hasContract(browser) {
  return await browser.eval(`
    !!(window.__gameTest &&
      typeof window.__gameTest.reset === 'function' &&
      typeof window.__gameTest.getSnapshot === 'function' &&
      typeof window.__gameTest.input === 'function' &&
      typeof window.__gameTest.loadScenario === 'function')
  `);
}

async function rawSnapshot(browser) {
  return await browser.eval(`
    (function() {
      if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') return null;
      return window.__gameTest.getSnapshot();
    })()
  `);
}

async function snapshot(browser) {
  return importantSnapshotParts(await rawSnapshot(browser));
}

async function resetGame(browser) {
  if (await hasContract(browser)) {
    await browser.eval(`window.__gameTest.reset()`);
    await sleep(300);
    return snapshot(browser);
  }
  const clicked = await browser.eval(`
    (function() {
      const controls = Array.from(document.querySelectorAll('button,[role="button"],a,[data-game-control]'));
      const match = controls.find(el => {
        const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('data-game-control') || '').toLowerCase();
        return /restart|reset|again|retry|重新|再玩/.test(text);
      });
      if (match) { match.click(); return true; }
      return false;
    })()
  `);
  if (clicked) await sleep(500);
  return snapshot(browser);
}

async function contractInput(browser, action) {
  return importantSnapshotParts(await browser.eval(`
    (function() {
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return null;
      return window.__gameTest.input(${JSON.stringify(action)});
    })()
  `));
}

async function loadScenario(browser, name) {
  return importantSnapshotParts(await browser.eval(`
    (function() {
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return null;
      return window.__gameTest.loadScenario(${JSON.stringify(name)});
    })()
  `));
}

function pointInPlayfield(snap, fx, fy) {
  const bounds = snap && snap.ui && snap.ui.playfieldBounds;
  if (bounds && isNumber(bounds.x) && isNumber(bounds.y) && bounds.width > 20 && bounds.height > 20) {
    return {
      x: bounds.x + bounds.width * fx,
      y: bounds.y + bounds.height * fy,
      bounds
    };
  }
  return null;
}

async function getPlayPoint(browser, fx, fy) {
  const raw = await rawSnapshot(browser);
  const semantic = pointInPlayfield(raw, fx, fy);
  if (semantic) return semantic;
  const info = await pageInfo(browser);
  if (!info || !info.rect) return null;
  return {
    x: info.rect.x + info.rect.width * fx,
    y: info.rect.y + info.rect.height * fy,
    bounds: info.rect
  };
}

async function getInvalidLowerZonePoint(browser, fx) {
  const raw = await rawSnapshot(browser);
  const info = await pageInfo(browser);
  const rect = info && info.rect;
  const bounds = raw && raw.ui && raw.ui.playfieldBounds;
  if (!rect) return null;

  let x = rect.x + rect.width * fx;
  let y = rect.y + rect.height * 0.92;
  if (bounds && isNumber(bounds.x) && isNumber(bounds.y) && bounds.width > 20 && bounds.height > 20) {
    const belowSemantic = bounds.y + bounds.height + Math.max(12, rect.height * 0.04);
    const canvasBottom = rect.y + rect.height - 10;
    if (belowSemantic < canvasBottom) {
      y = Math.max(belowSemantic, rect.y + rect.height * 0.84);
    }
  }

  const blend = raw && raw.ui && raw.ui.blendButton;
  if (blend && isNumber(blend.screenX) && isNumber(blend.screenY)) {
    const dx = x - blend.screenX;
    const dy = y - blend.screenY;
    if (Math.hypot(dx, dy) < 70) {
      const left = rect.x + rect.width * 0.22;
      const right = rect.x + rect.width * 0.78;
      x = Math.abs(left - blend.screenX) > Math.abs(right - blend.screenX) ? left : right;
    }
  }
  return { x, y, bounds: rect };
}

async function getHitInfo(browser, point) {
  return await browser.eval(`
    (function() {
      const p = ${JSON.stringify(point || null)};
      if (!p) return null;
      const el = document.elementFromPoint(p.x, p.y);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 80),
        role: el.getAttribute('role') || '',
        disabled: !!el.disabled,
        x: Math.round(r.left + r.width / 2),
        y: Math.round(r.top + r.height / 2)
      };
    })()
  `);
}

async function realDrag(browser, from, to, options = {}) {
  const steps = options.steps || 6;
  const stepDelayMs = Number.isFinite(options.stepDelayMs) ? options.stepDelayMs : 40;
  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved', x: from.x, y: from.y, modifiers: 0
  });
  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1, modifiers: 0
  });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      modifiers: 0
    });
    if (stepDelayMs > 0) await sleep(stepDelayMs);
  }
  if (!options.hold) {
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: to.x, y: to.y, button: 'left', clickCount: 1, modifiers: 0
    });
  }
}

async function realTouchDrag(browser, from, to, options = {}) {
  const steps = options.steps || 6;
  const id = options.id || 11;
  await browser.cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: from.x, y: from.y, id, radiusX: 4, radiusY: 4, force: 1 }]
  });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        id,
        radiusX: 4,
        radiusY: 4,
        force: 1
      }]
    });
    await sleep(40);
  }
  if (!options.hold) {
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
  }
}

async function releaseMouse(browser, at) {
  await browser.cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1, modifiers: 0
  });
}

async function findVerticalAimPoints(browser) {
  const valid = [];
  const fractions = Array.from({ length: 41 }, (_, index) => 0.005 + index * 0.02);
  for (const fy of fractions) {
    const raw = await rawSnapshot(browser);
    const point = pointInPlayfield(raw, 0.5, fy);
    if (!point) continue;

    await realDrag(browser, point, point, { hold: true, steps: 1, stepDelayMs: 0 });
    await sleep(100);
    const held = await rawSnapshot(browser);
    await releaseMouse(browser, point);
    await sleep(150);
    if (held && held.aim && held.aim.visible && held.aim.insidePlayfield === true) {
      valid.push(point);
    }
    await resetGame(browser);
  }
  if (valid.length < 2) return null;
  return {
    start: valid[Math.floor(valid.length / 2)],
    shallow: valid[0],
    deep: valid[valid.length - 1]
  };
}

async function findHorizontalAimPoints(browser) {
  const yFractions = [0.16, 0.24, 0.32, 0.40, 0.48, 0.56, 0.64, 0.72];
  const spans = [0.12, 0.10, 0.08, 0.06, 0.04];
  const isValid = (snap) => !!(snap && snap.aim && snap.aim.visible && snap.aim.insidePlayfield === true);

  for (const fy of yFractions) {
    const start = await getPlayPoint(browser, 0.5, fy);
    if (!start) continue;
    await realDrag(browser, start, start, { hold: true, steps: 1, stepDelayMs: 0 });
    await sleep(100);
    const centerHeld = await rawSnapshot(browser);
    await releaseMouse(browser, start);
    await sleep(150);
    await resetGame(browser);
    if (!isValid(centerHeld)) continue;

    for (const span of spans) {
      const left = await getPlayPoint(browser, 0.5 - span, fy);
      const right = await getPlayPoint(browser, 0.5 + span, fy);
      if (!left || !right) continue;

      await realDrag(browser, start, left, { hold: true, steps: 1, stepDelayMs: 0 });
      await sleep(100);
      const leftHeld = await rawSnapshot(browser);
      await releaseMouse(browser, left);
      await sleep(150);
      const leftValid = isValid(leftHeld);
      await resetGame(browser);
      if (!leftValid) continue;

      await realDrag(browser, start, right, { hold: true, steps: 1, stepDelayMs: 0 });
      await sleep(100);
      const rightHeld = await rawSnapshot(browser);
      await releaseMouse(browser, right);
      await sleep(150);
      const rightValid = isValid(rightHeld);
      await resetGame(browser);
      if (rightValid) return { start, left, right };
    }
  }
  return null;
}

async function realDragToLegalDrop(browser) {
  const horizontalFractions = [0.50, 0.35, 0.65];
  const verticalFractions = [
    0.02, 0.05, 0.08, 0.12, 0.16, 0.20, 0.26, 0.32,
    0.38, 0.44, 0.50, 0.56, 0.62, 0.68, 0.74
  ];
  for (const fy of verticalFractions) {
    for (const fx of horizontalFractions) {
      const from = await getPlayPoint(browser, fx, Math.max(0.01, fy - 0.03));
      const to = await getPlayPoint(browser, fx, fy);
      if (!from || !to) continue;
      await realDrag(browser, from, to, { hold: true, steps: 3, stepDelayMs: 20 });
      await sleep(80);
      const held = await rawSnapshot(browser);
      const aim = held && held.aim;
      const legal = !!(aim && aim.visible && aim.insidePlayfield === true);
      await releaseMouse(browser, to);
      if (legal) return { from, to };
      await sleep(80);
    }
  }
  return null;
}

async function realTouchDragToLegalDrop(browser) {
  const candidatePairs = [
    { from: [0.50, 0.30], to: [0.50, 0.40] },
    { from: [0.42, 0.34], to: [0.58, 0.42] },
    { from: [0.58, 0.34], to: [0.42, 0.42] },
    { from: [0.50, 0.38], to: [0.57, 0.46] }
  ];
  for (let index = 0; index < candidatePairs.length; index++) {
    if (index > 0) await resetGame(browser);
    const pair = candidatePairs[index];
    const from = await getPlayPoint(browser, pair.from[0], pair.from[1]);
    const to = await getPlayPoint(browser, pair.to[0], pair.to[1]);
    if (!from || !to) continue;
    await realTouchDrag(browser, from, to, { hold: true });
    await sleep(80);
    const held = await rawSnapshot(browser);
    const aim = held && held.aim;
    const legal = !!(aim && aim.visible && aim.insidePlayfield === true);
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    if (legal) return { from, to };
  }
  return null;
}

async function findRestartPoint(browser) {
  const viaDom = await browser.eval(`
    (function() {
      const controls = Array.from(document.querySelectorAll('button,[role="button"],a,[data-game-control]'));
      const candidate = controls.find(el => {
        const label = [
          el.textContent,
          el.getAttribute('aria-label'),
          el.getAttribute('title'),
          el.getAttribute('data-game-control')
        ].filter(Boolean).join(' ').toLowerCase();
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return /restart|reset|again|retry|重新|再玩/.test(label) &&
          !el.disabled &&
          rect.width > 0 && rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.pointerEvents !== 'none' &&
          Number(style.opacity) >= 0.2;
      });
      if (!candidate) return null;
      const r = candidate.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()
  `);
  if (viaDom) return viaDom;
  const viaSnapshot = await rawSnapshot(browser);
  if (viaSnapshot && viaSnapshot.ui && viaSnapshot.ui.restartButton) {
    const b = viaSnapshot.ui.restartButton;
    if (isNumber(b.screenX) && isNumber(b.screenY)) return { x: b.screenX, y: b.screenY };
  }
  return null;
}

async function findBlendButtonPoint(browser) {
  const raw = await rawSnapshot(browser);
  if (raw && raw.ui && raw.ui.blendButton && raw.ui.blendButton.enabled) {
    return { x: raw.ui.blendButton.screenX, y: raw.ui.blendButton.screenY };
  }
  return await browser.eval(`
    (function() {
      const controls = Array.from(document.querySelectorAll('button,[role="button"],[data-game-control]'));
      const candidate = controls.find(el => {
        const label = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('data-game-control') || '').toLowerCase();
        return /blend|smoothie|mix|finish|搅拌|榨汁/.test(label);
      });
      if (!candidate) return null;
      const r = candidate.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()
  `);
}

async function visibleHintEvidence(browser) {
  return await browser.eval(`
    (function() {
      const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
      const textHint = /blend|smoothie|mix|tap|button|搅拌|榨汁|按/.test(bodyText);
      const visibleNodes = Array.from(document.querySelectorAll('*')).filter((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (r.width < 8 || r.height < 8 || style.visibility === 'hidden' || style.display === 'none') return false;
        const opacity = Number(style.opacity);
        if (Number.isFinite(opacity) && opacity < 0.2) return false;
        const label = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('data-game-hint') || '').toLowerCase();
        return /blend|smoothie|mix|tap|button|搅拌|榨汁|按/.test(label);
      });
      return { textHint, visibleCount: visibleNodes.length };
    })()
  `);
}

async function fruitRenderEvidence(browser, visibleChanged) {
  return await browser.eval(`
    (function() {
      if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') {
        return { ok: false, reason: 'missing contract' };
      }
      const snap = window.__gameTest.getSnapshot();
      const visible = snap && snap.fruits && Array.isArray(snap.fruits.visible) ? snap.fruits.visible : [];
      if (!visible.length) return { ok: false, reason: 'no visible fruit coordinates' };
      const canvases = Array.from(document.querySelectorAll('canvas'));
      let canvas = null;
      let area = -1;
      for (const c of canvases) {
        const r = c.getBoundingClientRect();
        const a = r.width * r.height;
        if (a > area) { area = a; canvas = c; }
      }
      if (!canvas) return { ok: false, reason: 'no canvas' };
      const rect = canvas.getBoundingClientRect();
      const candidates = visible.filter(f =>
        Number.isFinite(f.screenX) && Number.isFinite(f.screenY) &&
        f.screenX >= rect.left && f.screenX <= rect.right &&
        f.screenY >= rect.top && f.screenY <= rect.bottom
      );
      if (!candidates.length) return { ok: false, reason: 'visible fruit coordinates outside canvas' };
      let sampleCanvas = canvas;
      const sourceCtx = canvas.getContext('2d');
      let ctx = sourceCtx;
      if (!ctx) {
        sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = Math.max(1, canvas.width);
        sampleCanvas.height = Math.max(1, canvas.height);
        ctx = sampleCanvas.getContext('2d');
        if (!ctx) return { ok: false, reason: 'no 2d sampling context' };
        try {
          ctx.drawImage(canvas, 0, 0);
        } catch (e) {
          const rendererNeutralVisible = ${JSON.stringify(Boolean(visibleChanged))};
          if (rendererNeutralVisible) {
            return { ok: true, renderer: 'non-2d', candidateCount: candidates.length, reason: 'renderer-neutral canvas/visual evidence' };
          }
          return { ok: false, reason: 'pixel copy failed: ' + e.message };
        }
      }
      const pixelWidth = sampleCanvas.width;
      const pixelHeight = sampleCanvas.height;
      const sx = pixelWidth / Math.max(1, rect.width);
      const sy = pixelHeight / Math.max(1, rect.height);
      const radiusCss = 18;
      let best = null;
      for (const f of candidates) {
        const cx = Math.round((f.screenX - rect.left) * sx);
        const cy = Math.round((f.screenY - rect.top) * sy);
        const r = Math.max(8, Math.round(radiusCss * Math.max(sx, sy)));
        const x0 = Math.max(0, cx - r);
        const y0 = Math.max(0, cy - r);
        const w = Math.min(pixelWidth - x0, r * 2 + 1);
        const h = Math.min(pixelHeight - y0, r * 2 + 1);
        if (w <= 2 || h <= 2) continue;
        let data;
        try {
          data = ctx.getImageData(x0, y0, w, h).data;
        } catch (e) {
          return { ok: false, reason: 'pixel read failed: ' + e.message };
        }
        let sampled = 0, chroma = 0, bright = 0, dark = 0, sum = 0, sum2 = 0;
        for (let y = 0; y < h; y += 2) {
          for (let x = 0; x < w; x += 2) {
            const dx = x + x0 - cx;
            const dy = y + y0 - cy;
            if (dx * dx + dy * dy > r * r) continue;
            const idx = (y * w + x) * 4;
            const rr = data[idx], gg = data[idx + 1], bb = data[idx + 2], aa = data[idx + 3];
            if (aa < 32) continue;
            const max = Math.max(rr, gg, bb);
            const min = Math.min(rr, gg, bb);
            const lum = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
            sampled++;
            sum += lum;
            sum2 += lum * lum;
            if (max - min > 28 && max > 85) chroma++;
            if (lum > 155) bright++;
            if (lum < 55) dark++;
          }
        }
        const mean = sampled ? sum / sampled : 0;
        const variance = sampled ? Math.max(0, sum2 / sampled - mean * mean) : 0;
        const contrast = Math.sqrt(variance);
        const chromaRatio = sampled ? chroma / sampled : 0;
        const brightRatio = sampled ? bright / sampled : 0;
        const darkRatio = sampled ? dark / sampled : 0;
        const ok = sampled > 20 && (chromaRatio > 0.08 || (contrast > 26 && brightRatio > 0.04 && darkRatio < 0.85));
        const evidence = {
          ok,
          tier: f.tier,
          screenX: Math.round(f.screenX),
          screenY: Math.round(f.screenY),
          sampled,
          chromaRatio: Number(chromaRatio.toFixed(3)),
          contrast: Number(contrast.toFixed(1)),
          brightRatio: Number(brightRatio.toFixed(3))
        };
        if (!best || (evidence.chromaRatio + evidence.contrast / 100) > (best.chromaRatio + best.contrast / 100)) best = evidence;
        if (ok) return evidence;
      }
      if (sourceCtx === null && ${JSON.stringify(Boolean(visibleChanged))} && (!best || !best.ok)) {
        return { ok: true, renderer: 'non-2d', candidateCount: candidates.length, reason: 'renderer-neutral canvas/visual evidence' };
      }
      return best || { ok: false, reason: 'no sampleable fruit pixels' };
    })()
  `);
}

const checks = [
  {
    id: 'p0-boot-stability',
    level: 'P0',
    name: 'Boot stability and visible playfield',
    timeoutMs: 30000,
    async run(ctx) {
      const { browser } = ctx;
      await sleep(1200);
      const info = await pageInfo(browser);
      if (ctx.browser.exceptions.length > 0) {
        return FAIL(`exception: ${ctx.browser.exceptions[0].description || ctx.browser.exceptions[0].text}`);
      }
      if (!info || !info.hasCanvas || !info.rect || info.rect.width < 120 || info.rect.height < 120) {
        return FAIL('inaccessible: no visible primary playfield/canvas');
      }
      const hash = await browser.canvasPixelHash();
      if (hash === null) return FAIL('inaccessible: screenshot/canvas hash unavailable');
      return PASS(`playfield ${Math.round(info.rect.width)}x${Math.round(info.rect.height)} hash=${hash}`);
    }
  },
  {
    id: 'p0-public-contract-schema',
    level: 'P0',
    name: 'Public contract schema reset/input/getSnapshot/loadScenario',
    timeoutMs: 20000,
    async run(ctx) {
      const { browser } = ctx;
      if (!(await hasContract(browser))) {
        return FAIL('inaccessible: window.__gameTest reset/input/getSnapshot/loadScenario is required');
      }
      const raw = await browser.eval(`window.__gameTest.reset()`);
      const snap = importantSnapshotParts(raw);
      if (!snap) return FAIL('wrong-value: reset did not return Snapshot');
      if (!['playing', 'aiming', 'cooldown', 'danger', 'blending', 'result', 'loading'].includes(snap.phase)) {
        return FAIL(`wrong-value: invalid phase ${snap.phase}`);
      }
      if (!isNumber(snap.score) || snap.score < 0) return FAIL('wrong-value: score missing or negative');
      const invalid = await browser.eval(`window.__gameTest.input({ type: 'unknownActionForContract' })`);
      const invalidParts = importantSnapshotParts(invalid);
      const rejected = invalid && (invalid.ok === false || invalid.lastError || invalid.rejected);
      if (!invalidParts || !rejected) {
        return FAIL('reject: invalid action must return a snapshot with ok:false/lastError/rejected');
      }
      return PASS(`schema phase=${snap.phase} score=${snap.score}`);
    }
  },
  {
    id: 'p1-ui-playfield-unblocked',
    level: 'P1',
    name: 'UI flow leaves playfield unblocked in playing state',
    timeoutMs: 25000,
    async run(ctx) {
      const { browser } = ctx;
      const beforeInfo = await pageInfo(browser);
      const snap = await resetGame(browser);
      if (!snap) return FAIL('inaccessible: no snapshot for playfield state');
      if (snap.phase !== 'playing' && snap.phase !== 'cooldown' && snap.phase !== 'aiming') {
        return FAIL(`wrong-value: expected playable phase, got ${snap.phase}`);
      }
      if (snap.overlayBlocking) return FAIL('wrong-value: overlayBlocking true in playable phase');
      if (!snap.canInteractWithPlayfield) return FAIL('wrong-value: playfield cannot receive input');
      const info = await pageInfo(browser);
      if (!info || !info.rect || info.rect.width < 120 || info.rect.height < 120) {
        return FAIL('inaccessible: playfield bounds are not visible');
      }
      const afterInfo = await pageInfo(browser);
      const beforeArea = beforeInfo && beforeInfo.rect ? beforeInfo.rect.width * beforeInfo.rect.height : 0;
      const afterArea = afterInfo && afterInfo.rect ? afterInfo.rect.width * afterInfo.rect.height : 0;
      if (!(afterArea > 0) || afterArea < beforeArea * 0.5) {
        return FAIL(`wrong-value: playfield area collapsed before=${Math.round(beforeArea)} after=${Math.round(afterArea)}`);
      }
      return PASS(`beforeArea=${Math.round(beforeArea)} afterArea=${Math.round(afterArea)} phase=${snap.phase}`);
    }
  },
  {
    id: 'p1-real-drag-direction-semantics',
    level: 'P1',
    name: 'Real drag direction semantics move aim left and right',
    timeoutMs: 35000,
    async run(ctx) {
      const { browser } = ctx;
      await resetGame(browser);
      const points = await findHorizontalAimPoints(browser);
      if (!points) return FAIL('inaccessible: no legal semantic aim points for direction test');
      const { start, left, right } = points;

      await realDrag(browser, start, left, { hold: true });
      await sleep(150);
      const leftSnap = await snapshot(browser);
      await releaseMouse(browser, left);
      await sleep(300);

      await resetGame(browser);
      await realDrag(browser, start, right, { hold: true });
      await sleep(150);
      const rightSnap = await snapshot(browser);
      await releaseMouse(browser, right);

      if (!leftSnap || !rightSnap) return FAIL('inaccessible: no snapshots after real drag');
      if (!leftSnap.aimVisible || !rightSnap.aimVisible) return FAIL('no-response: aim preview not visible during real drag');
      const deltaScreen = rightSnap.aimScreenX - leftSnap.aimScreenX;
      if (!(deltaScreen > 20)) {
        return FAIL(`wrong-value: right aim screenX must be greater than left, delta=${deltaScreen}`);
      }
      // direction opposite symmetry: left and right drags must move in opposite screen directions.
      const oppositeDirectionEvidence = leftSnap.aimScreenX < start.x - 8 && rightSnap.aimScreenX > start.x + 8;
      if (!oppositeDirectionEvidence) {
        return FAIL(`wrong-value: opposite directions did not move around center; center=${Math.round(start.x)} left=${Math.round(leftSnap.aimScreenX)} right=${Math.round(rightSnap.aimScreenX)}`);
      }
      return PASS(`left=${Math.round(leftSnap.aimScreenX)} right=${Math.round(rightSnap.aimScreenX)}`);
    }
  },
  {
    id: 'p1-real-drag-depth-semantics',
    level: 'P1',
    name: 'Real vertical drag changes aim depth',
    timeoutMs: 35000,
    async run(ctx) {
      const { browser } = ctx;
      await resetGame(browser);
      const points = await findVerticalAimPoints(browser);
      if (!points) return FAIL('inaccessible: no pair of semantic inside-playfield points for depth test');
      const { start, shallow, deep } = points;

      await realDrag(browser, start, shallow, { hold: true });
      await sleep(150);
      const shallowRaw = await rawSnapshot(browser);
      const shallowSnap = importantSnapshotParts(shallowRaw);
      await releaseMouse(browser, shallow);
      await sleep(300);

      await resetGame(browser);
      const start2 = start;
      await realDrag(browser, start2, deep, { hold: true });
      await sleep(150);
      const deepRaw = await rawSnapshot(browser);
      const deepSnap = importantSnapshotParts(deepRaw);
      await releaseMouse(browser, deep);

      if (!shallowSnap || !deepSnap) return FAIL('inaccessible: no snapshots after vertical drag');
      if (!shallowSnap.aimVisible || !deepSnap.aimVisible) return FAIL('no-response: aim preview not visible during vertical drag');
      if (!shallowRaw || !deepRaw || !shallowRaw.aim || !deepRaw.aim ||
        shallowRaw.aim.insidePlayfield !== true || deepRaw.aim.insidePlayfield !== true) {
        return FAIL('no-response: vertical drag did not establish an inside-playfield aim');
      }
      const worldDelta = Math.abs(Number(deepSnap.aimWorldZ) - Number(shallowSnap.aimWorldZ));
      const screenDelta = Math.abs(Number(deepSnap.aimScreenX) - Number(shallowSnap.aimScreenX)) +
        Math.abs(Number(deepSnap.aimScreenY || 0) - Number(shallowSnap.aimScreenY || 0));
      if (!(worldDelta > 0.08 || screenDelta > 16)) {
        return FAIL(`no-response: vertical drag did not change depth/aim evidence; worldZ ${shallowSnap.aimWorldZ}->${deepSnap.aimWorldZ}, screenDelta=${Math.round(screenDelta)}`);
      }
      return PASS(`worldZ ${Number(shallowSnap.aimWorldZ).toFixed(2)}->${Number(deepSnap.aimWorldZ).toFixed(2)}, screenDelta=${Math.round(screenDelta)}`);
    }
  },
  {
    id: 'p1-real-drag-release-drops-fruit',
    level: 'P1',
    name: 'Real drag release drops a fruit into the playfield',
    timeoutMs: 35000,
    async run(ctx) {
      const { browser } = ctx;
      await resetGame(browser);
      const before = await snapshot(browser);
      if (!before) return FAIL('inaccessible: no snapshot before real drop');
      const hashBefore = await browser.canvasPixelHash();
      const legalDrop = await realDragToLegalDrop(browser);
      if (!legalDrop) return FAIL('inaccessible: cannot prepare real drop in legal region');
      await sleep(900);
      const after = await snapshot(browser);
      const hashAfter = await browser.canvasPixelHash();
      if (!after) return FAIL('inaccessible: no snapshot after real drop');
      const countDelta = after.fruitCount - before.fruitCount;
      const revisionDelta = after.dropRevision - before.dropRevision;
      const visibleChange = hashBefore !== null && hashAfter !== null && hashBefore !== hashAfter;
      if (countDelta < 1 && revisionDelta < 1) {
        return FAIL(`no-response: fruit count/revision did not increase after real release (${before.fruitCount}->${after.fruitCount})`);
      }
      if (!visibleChange && after.visualRevision === before.visualRevision) {
        return FAIL('no-response: drop changed no visible scene/canvas evidence');
      }
      const fruitPixels = await fruitRenderEvidence(browser, visibleChange || after.visualRevision !== before.visualRevision);
      if (!fruitPixels || !fruitPixels.ok) {
        return FAIL(`no-response: dropped fruit has no local canvas pixel evidence (${fruitPixels && fruitPixels.reason ? fruitPixels.reason : JSON.stringify(fruitPixels)})`);
      }
      return PASS(`fruitCount ${before.fruitCount}->${after.fruitCount}, dropRevision +${revisionDelta}, fruitPixels chroma=${fruitPixels.chromaRatio} contrast=${fruitPixels.contrast}`);
    }
  },
  {
    id: 'p1-real-touch-drop-drops-fruit',
    level: 'P1',
    name: 'Real touch drag release drops a fruit into the playfield',
    timeoutMs: 35000,
    async run(ctx) {
      const { browser } = ctx;
      await resetGame(browser);
      const before = await snapshot(browser);
      const hashBefore = await browser.canvasPixelHash();
      if (!before) return FAIL('inaccessible: no snapshot before real touch drop');
      const legalDrop = await realTouchDragToLegalDrop(browser);
      if (!legalDrop) return FAIL('inaccessible: cannot prepare real touch drop in legal region');
      await sleep(900);
      const after = await snapshot(browser);
      const hashAfter = await browser.canvasPixelHash();
      if (!after) return FAIL('inaccessible: no snapshot after real touch drop');
      const countDelta = after.fruitCount - before.fruitCount;
      const revisionDelta = after.dropRevision - before.dropRevision;
      const visibleChange = hashBefore !== null && hashAfter !== null && hashBefore !== hashAfter;
      if (countDelta < 1 && revisionDelta < 1) {
        return FAIL(`no-response: touch release did not drop fruit (${before.fruitCount}->${after.fruitCount}, revision +${revisionDelta})`);
      }
      if (!visibleChange && after.visualRevision === before.visualRevision) {
        return FAIL('no-response: touch drop changed no visible scene/canvas evidence');
      }
      const fruitPixels = await fruitRenderEvidence(browser, visibleChange || after.visualRevision !== before.visualRevision);
      if (!fruitPixels || !fruitPixels.ok) {
        return FAIL(`no-response: touch-dropped fruit has no local canvas pixel evidence (${fruitPixels && fruitPixels.reason ? fruitPixels.reason : JSON.stringify(fruitPixels)})`);
      }
      return PASS(`touch fruitCount ${before.fruitCount}->${after.fruitCount}, dropRevision +${revisionDelta}, fruitPixels chroma=${fruitPixels.chromaRatio} contrast=${fruitPixels.contrast}`);
    }
  },
  {
    id: 'p1-contract-merge-score-loop',
    level: 'P1',
    name: 'Contract merge and scoring loop',
    timeoutMs: 45000,
    async run(ctx) {
      const { browser } = ctx;
      if (!(await hasContract(browser))) return FAIL('inaccessible: contract required for merge scenario');
      const before = await loadScenario(browser, 'twoMatchingFruits');
      if (!before) return FAIL('inaccessible: twoMatchingFruits scenario unavailable');
      if (before.resultVisible || before.phase === 'result') return FAIL('wrong-value: scenario pre-awarded result');
      const totalBefore = before.fruitCount;
      const tierMassBefore = before.totalTierMass;
      await contractInput(browser, { type: 'wait', ms: 1800 });
      await sleep(700);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after merge wait');
      const scoreDelta = after.score - before.score;
      const mergeDelta = after.mergeRevision - before.mergeRevision;
      const totalAfter = after.fruitCount;
      if (!(scoreDelta > 0)) return FAIL(`wrong-value: score did not increase after merge (${before.score}->${after.score})`);
      if (!(mergeDelta > 0 || totalAfter < totalBefore)) {
        return FAIL(`no-response: no merge revision/count evidence (${totalBefore}->${totalAfter})`);
      }
      if (tierMassBefore > 0 && after.totalTierMass < tierMassBefore - 0.01) {
        return FAIL(`wrong-value: tier mass unexpectedly decreased ${tierMassBefore}->${after.totalTierMass}`);
      }
      return PASS(`score +${scoreDelta}, fruitCount ${totalBefore}->${totalAfter}, mergeRevision +${mergeDelta}`);
    }
  },
  {
    id: 'p1-contract-danger-line-terminal',
    level: 'P1',
    name: 'Contract danger line warning leads to terminal flow',
    timeoutMs: 50000,
    async run(ctx) {
      const { browser } = ctx;
      if (!(await hasContract(browser))) return FAIL('inaccessible: contract required for danger scenario');
      const start = await loadScenario(browser, 'nearDangerStack');
      if (!start || !['playing', 'aiming', 'cooldown', 'danger'].includes(start.phase)) {
        return FAIL('inaccessible: nearDangerStack did not return a valid nonterminal snapshot');
      }
      if (start.resultVisible || start.phase === 'result') return FAIL('wrong-value: scenario already terminal');
      await contractInput(browser, { type: 'wait', ms: 600 });
      const early = await snapshot(browser);
      if (!early) return FAIL('inaccessible: no snapshot after danger short wait');
      if (early.resultVisible || early.phase === 'result') return FAIL('wrong-value: danger scenario jumped directly to result too early');
      await contractInput(browser, { type: 'wait', ms: 4500 });
      await sleep(700);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after danger wait');
      const terminal = after.phase === 'blending' || after.phase === 'result' || after.resultVisible;
      if (!after.warningVisible && !terminal) {
        return FAIL(`no-response: danger warning/terminal not reached; phase=${after.phase}`);
      }
      if (!terminal) return FAIL(`wrong-value: danger warning visible but terminal flow did not start; phase=${after.phase}`);
      return PASS(`phase=${after.phase} warning=${after.warningVisible}`);
    }
  },
  {
    id: 'p1-contract-terminal-lock-rejects-drop',
    level: 'P1',
    name: 'Contract terminal flow rejects ordinary drop attempts',
    timeoutMs: 40000,
    async run(ctx) {
      const { browser } = ctx;
      if (!(await hasContract(browser))) return FAIL('inaccessible: contract required for terminal lock scenario');
      const setup = await loadScenario(browser, 'oneFruitReadyToBlend');
      if (!setup) return FAIL('inaccessible: oneFruitReadyToBlend scenario unavailable');
      if (setup.resultVisible || setup.phase === 'result') return FAIL('wrong-value: scenario already terminal');
      await contractInput(browser, { type: 'pressBlender' });
      await contractInput(browser, { type: 'wait', ms: 900 });
      await sleep(300);
      const locked = await snapshot(browser);
      if (!locked) return FAIL('inaccessible: no snapshot after terminal start');
      const terminalStarted = locked.phase === 'blending' || locked.phase === 'result' || locked.resultVisible ||
        ['buttonPressed', 'capping', 'blending', 'pouring', 'drinking', 'throwing', 'done'].includes(locked.blenderState);
      if (!terminalStarted) return FAIL(`no-response: terminal flow did not start; phase=${locked.phase} blender=${locked.blenderState}`);
      const point = await getPlayPoint(browser, 0.5, 0.30);
      if (!point) return FAIL('inaccessible: no playfield point for rejected terminal drop');
      await contractInput(browser, { type: 'dropAt', screenX: point.x, screenY: point.y });
      await contractInput(browser, { type: 'wait', ms: 500 });
      await sleep(200);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after terminal drop attempt');
      if (after.fruitCount > locked.fruitCount || after.dropRevision > locked.dropRevision) {
        return FAIL(`reject: terminal drop mutated drop state count ${locked.fruitCount}->${after.fruitCount}, dropRev ${locked.dropRevision}->${after.dropRevision}`);
      }
      return PASS(`terminal rejected drop at phase=${after.phase}, fruits=${after.fruitCount}`);
    }
  },
  {
    id: 'p1-real-restart-cleans-state',
    level: 'P1',
    name: 'Real restart control clears state and restores play',
    timeoutMs: 40000,
    async run(ctx) {
      const { browser } = ctx;
      if (await hasContract(browser)) {
        await loadScenario(browser, 'oneFruitReadyToBlend');
      }
      const before = await snapshot(browser);
      const point = await findRestartPoint(browser);
      if (!point) return FAIL('inaccessible: no visible restart/retry control point');
      await browser.mouseClick(point.x, point.y);
      await sleep(700);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after restart click');
      if (after.score !== 0) return FAIL(`wrong-value: restart did not reset score (${after.score})`);
      if (after.resultVisible) return FAIL('wrong-value: result overlay still visible after restart');
      if (!after.canInteractWithPlayfield || after.overlayBlocking) return FAIL('wrong-value: playfield not interactive after restart');
      if (after.fruitCount !== 0) return FAIL(`wrong-value: restart did not clear fruits (${after.fruitCount})`);
      return PASS(`restart restored phase=${after.phase}, fruits=${after.fruitCount}`);
    }
  },
  {
    id: 'p2-invalid-lower-zone-rejected',
    level: 'P2',
    name: 'Invalid lower-zone drag is rejected unchanged',
    timeoutMs: 30000,
    async run(ctx) {
      const { browser } = ctx;
      await resetGame(browser);
      const before = await snapshot(browser);
      const from = await getInvalidLowerZonePoint(browser, 0.48);
      const to = await getInvalidLowerZonePoint(browser, 0.62);
      if (!before || !from || !to) return FAIL('inaccessible: cannot prepare invalid lower-zone action');
      const hit = await getHitInfo(browser, to);
      await realDrag(browser, from, to);
      await sleep(600);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after invalid drag');
      const unchanged = after.fruitCount === before.fruitCount &&
        after.score === before.score &&
        after.dropRevision === before.dropRevision;
      if (!unchanged) {
        return FAIL(`reject: lower-zone action mutated state count ${before.fruitCount}->${after.fruitCount}, score ${before.score}->${after.score}, hit=${hit ? `${hit.tag}:${hit.text}` : 'none'}`);
      }
      return PASS(`unchanged after rejected lower-zone drag at ${Math.round(to.x)},${Math.round(to.y)}`);
    }
  },
  {
    id: 'p2-cooldown-conservation',
    level: 'P2',
    name: 'Cooldown conserves fruit count under rapid repeated drops',
    timeoutMs: 35000,
    async run(ctx) {
      const { browser } = ctx;
      await resetGame(browser);
      const before = await snapshot(browser);
      const totalBefore = before ? before.fruitCount : 0;
      const a = await getPlayPoint(browser, 0.42, 0.27);
      const b = await getPlayPoint(browser, 0.55, 0.31);
      const c = await getPlayPoint(browser, 0.60, 0.27);
      const d = await getPlayPoint(browser, 0.48, 0.31);
      if (!before || !a || !b || !c || !d) return FAIL('inaccessible: cannot prepare rapid drop sequence');
      await realDrag(browser, a, b, { steps: 1, stepDelayMs: 0 });
      await realDrag(browser, c, d, { steps: 1, stepDelayMs: 0 });
      await sleep(900);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after rapid drops');
      const totalAfter = after.fruitCount;
      if (totalAfter > totalBefore + 1) {
        return FAIL(`wrong-value: cooldown failed; totalBefore=${totalBefore} totalAfter=${totalAfter}`);
      }
      if (totalAfter < totalBefore) {
        return FAIL(`wrong-value: fruit count decreased during drop cooldown; totalBefore=${totalBefore} totalAfter=${totalAfter}`);
      }
      return PASS(`totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
    }
  },
  {
    id: 'p2-contract-nonmatching-rejection',
    level: 'P2',
    name: 'Contract nonmatching fruits do not merge or score',
    timeoutMs: 35000,
    async run(ctx) {
      const { browser } = ctx;
      if (!(await hasContract(browser))) return FAIL('inaccessible: contract required for nonmatching scenario');
      const before = await loadScenario(browser, 'mixedNonMatchingFruits');
      if (!before) return FAIL('inaccessible: mixedNonMatchingFruits scenario unavailable');
      const totalBefore = countByTierTotal(before.byTier);
      await contractInput(browser, { type: 'wait', ms: 1600 });
      await sleep(500);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after nonmatching wait');
      const totalAfter = countByTierTotal(after.byTier);
      const unchanged = after.score === before.score &&
        after.mergeRevision === before.mergeRevision &&
        totalAfter === totalBefore;
      if (!unchanged) {
        return FAIL(`reject: nonmatching fruits changed score/revision/tier total (${before.score}->${after.score}, ${before.mergeRevision}->${after.mergeRevision}, total ${totalBefore}->${totalAfter})`);
      }
      return PASS(`unchanged score=${after.score}, totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
    }
  },
  {
    id: 'p2-contract-max-tier-does-not-upgrade',
    level: 'P2',
    name: 'Contract max-tier fruits do not upgrade or score again',
    timeoutMs: 35000,
    async run(ctx) {
      const { browser } = ctx;
      if (!(await hasContract(browser))) return FAIL('inaccessible: contract required for max-tier scenario');
      const before = await loadScenario(browser, 'maxTierPair');
      if (!before) return FAIL('inaccessible: maxTierPair scenario unavailable');
      const totalBefore = countByTierTotal(before.byTier);
      await contractInput(browser, { type: 'wait', ms: 1600 });
      await sleep(500);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after max-tier wait');
      const totalAfter = countByTierTotal(after.byTier);
      if (after.score !== before.score || after.mergeRevision !== before.mergeRevision) {
        return FAIL(`reject: max-tier pair changed score/revision (${before.score}->${after.score}, ${before.mergeRevision}->${after.mergeRevision})`);
      }
      if (after.highestTier > before.highestTier || totalAfter !== totalBefore) {
        return FAIL(`reject: max-tier pair upgraded or changed tier total highest ${before.highestTier}->${after.highestTier}, total ${totalBefore}->${totalAfter}`);
      }
      return PASS(`max-tier unchanged score=${after.score}, highest=${after.highestTier}, total=${totalAfter}`);
    }
  },
  {
    id: 'p2-real-blender-button-starts-terminal-flow',
    level: 'P2',
    name: 'Real blender button starts visible terminal smoothie flow',
    timeoutMs: 60000,
    async run(ctx) {
      const { browser } = ctx;
      if (await hasContract(browser)) {
        await loadScenario(browser, 'oneFruitReadyToBlend');
      }
      const before = await snapshot(browser);
      const button = await findBlendButtonPoint(browser);
      if (!before) return FAIL('inaccessible: no snapshot before blender action');
      if (!button || !isNumber(button.x) || !isNumber(button.y)) {
        return FAIL('inaccessible: no semantic visible blender button');
      }
      await browser.mouseClick(button.x, button.y);
      await sleep(2500);
      const mid = await snapshot(browser);
      await sleep(3500);
      const after = await snapshot(browser);
      if (!mid || !after) return FAIL('inaccessible: no snapshot after blender button');
      const started = ['buttonPressed', 'capping', 'blending', 'pouring', 'drinking', 'throwing', 'done'].includes(mid.blenderState) ||
        mid.phase === 'blending' || mid.phase === 'result';
      if (!started) return FAIL(`no-response: blender state did not start after real button (${mid.blenderState}, phase=${mid.phase})`);
      if (mid.canDrop && mid.phase === 'playing') return FAIL('wrong-value: ordinary dropping still available after blender terminal start');
      const visibleProgress = after.liquidLevel > before.liquidLevel ||
        after.blendedFruitCount > before.blendedFruitCount ||
        after.fruitCount < before.fruitCount ||
        after.resultVisible ||
        after.visualRevision > before.visualRevision;
      if (!visibleProgress) {
        return FAIL('no-response: blender produced no liquid/count/result/visual progress');
      }
      return PASS(`state=${after.blenderState}, liquid=${after.liquidLevel}, fruits ${before.fruitCount}->${after.fruitCount}`);
    }
  },
  {
    id: 'p2-contract-empty-cup-blend-result',
    level: 'P2',
    name: 'Contract empty cup blend reaches empty result without fake score',
    timeoutMs: 60000,
    async run(ctx) {
      const { browser } = ctx;
      if (!(await hasContract(browser))) return FAIL('inaccessible: contract required for empty-cup scenario');
      const setup = await loadScenario(browser, 'emptyCup');
      if (!setup) return FAIL('inaccessible: emptyCup scenario unavailable');
      if (setup.fruitCount !== 0 || setup.score !== 0) {
        return FAIL(`wrong-value: emptyCup scenario must start empty and scoreless, got fruits=${setup.fruitCount} score=${setup.score}`);
      }
      await contractInput(browser, { type: 'pressBlender' });
      await contractInput(browser, { type: 'wait', ms: 9000 });
      await sleep(1000);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after empty-cup blend');
      if (after.fruitCount !== 0) return FAIL(`wrong-value: empty blend spawned fruit (${after.fruitCount})`);
      if (after.score > 1 || after.finalScore > 1) {
        return FAIL(`wrong-value: empty blend awarded fake score score=${after.score} final=${after.finalScore}`);
      }
      const resultOk = after.resultVisible || after.phase === 'result' || after.resultKind === 'empty' || after.restartAvailable;
      if (!resultOk) return FAIL(`no-response: empty blend did not reach empty result/restart state; phase=${after.phase}`);
      return PASS(`empty blend phase=${after.phase}, result=${after.resultVisible}, score=${after.score}, restart=${after.restartAvailable}`);
    }
  },
  {
    id: 'p2-feedback-hud-result-sync',
    level: 'P2',
    name: 'Feedback observability keeps HUD and result synchronized',
    timeoutMs: 60000,
    async run(ctx) {
      const { browser } = ctx;
      if (!(await hasContract(browser))) return FAIL('inaccessible: contract required for feedback scenario');
      const setup = await loadScenario(browser, 'oneFruitReadyToBlend');
      if (!setup) return FAIL('inaccessible: oneFruitReadyToBlend scenario unavailable');
      await contractInput(browser, { type: 'pressBlender' });
      await contractInput(browser, { type: 'wait', ms: 9000 });
      await sleep(1000);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after terminal feedback flow');
      const hudSynced = Math.abs(after.displayedScore - after.score) <= Math.max(2, after.score * 0.1) ||
        (after.resultVisible && Math.abs(after.finalScore - after.score) <= Math.max(2, after.score * 0.1));
      if (!hudSynced) {
        return FAIL(`wrong-value: displayed/final score not synchronized with score (${after.displayedScore}/${after.finalScore} vs ${after.score})`);
      }
      if (!after.resultVisible && after.blenderState !== 'done' && after.visualRevision <= setup.visualRevision) {
        return FAIL('no-response: no visible terminal/result feedback after blender flow');
      }
      if (after.resultVisible) {
        const leaderboardOk = after.leaderboardVisible ||
          ['loading', 'entries', 'empty', 'unavailable'].includes(after.leaderboardStatus);
        if (!leaderboardOk) return FAIL('no-response: result visible without leaderboard or placeholder status');
      }
      return PASS(`score=${after.score}, displayed=${after.displayedScore}, final=${after.finalScore}, result=${after.resultVisible}, leaderboard=${after.leaderboardStatus || 'none'}`);
    }
  },
  {
    id: 'p2-idle-hint-visible-and-dismissible',
    level: 'P2',
    name: 'Idle hint becomes visible and dismisses on player interaction',
    timeoutMs: 45000,
    async run(ctx) {
      const { browser } = ctx;
      await resetGame(browser);
      const before = await snapshot(browser);
      if (!before) return FAIL('inaccessible: no snapshot before idle hint wait');
      if (!before.canInteractWithPlayfield || before.overlayBlocking) {
        return FAIL('wrong-value: playfield must be interactable before idle hint');
      }
      if (await hasContract(browser)) {
        await contractInput(browser, { type: 'wait', ms: 5600 });
      } else {
        await sleep(5800);
      }
      await sleep(300);
      const hinted = await snapshot(browser);
      const textEvidence = await visibleHintEvidence(browser);
      const hintVisible = !!(hinted && hinted.hintVisible) || (textEvidence && textEvidence.visibleCount > 0);
      if (!hintVisible) return FAIL('no-response: idle hint did not become visible after idle wait');
      if (hinted && (!hinted.canInteractWithPlayfield || hinted.overlayBlocking)) {
        return FAIL('wrong-value: idle hint blocks playfield interaction');
      }
      const point = await getPlayPoint(browser, 0.50, 0.28);
      if (!point) return FAIL('inaccessible: no playfield point to dismiss hint');
      await browser.mouseClick(point.x, point.y);
      await sleep(400);
      const after = await snapshot(browser);
      if (!after) return FAIL('inaccessible: no snapshot after hint dismiss interaction');
      if (after.hintVisible || after.overlayBlocking) {
        return FAIL('wrong-value: hint remained visible/blocking after player interaction');
      }
      return PASS(`hint shown and dismissed; visibleTextCandidates=${textEvidence.visibleCount}`);
    }
  }
];

module.exports = {
  sleep,
  suite: checks
};
