// GDD Coverage Map
// M1 Menu and level entry: p0-1-public-contract-ready, p0-2-playfield-entry-visible, p1-1-level-entry-and-locked-rejection
// M2 Drag aim feel: p1-2-real-drag-aim-direction-opposite, p1-3b-real-touch-aim-release-operable
// M3 Release-to-shoot projectile: p1-3-real-drag-release-projectile-cooldown, p1-3b-real-touch-aim-release-operable, p1-4-miss-keeps-enemy-undamaged
// M4 Enemy archer counterfire: p1-5-enemy-counterfire-risk-chain, p1-11-pause-freeze-resume-restart
// M5 Hit zones and feedback: p1-6-body-hit-feedback-health-sync, p1-7-head-and-protection-outcomes
// M6 Victory and defeat flow: p1-8-victory-reward-progress-terminal, p1-9-defeat-route-terminal-blocking
// M7 Platform and wave pressure: p1-10-platform-motion-and-wave-gating
// M8 Power-up bubbles and special arrows: p1-12-powerup-collection-and-special-cost-benefit
// M9 Stars, coins, unlocks, combos: p1-8-victory-reward-progress-terminal
// M10 Equipment shop: p1-13-shop-affordable-and-rejection-invariants
// M11 Pause, restart, state blocking: p1-9-defeat-route-terminal-blocking, p1-11-pause-freeze-resume-restart
// M12 Settings and leaderboard shell: p2-1-settings-and-leaderboard-nonblocking
// M13 Tutorial onboarding: p2-2-tutorial-clears-after-real-aim
// M14 Enhanced presentation: p2-3-presentation-feedback-coupled-to-state
//
// Rationality Map
// p1-1-level-entry-and-locked-rejection: real action: contract selectLevel mirrors visible level choice from level_select_mixed; independent observation: phase/screen/playfield plus progress invariants; empty-shell failure: all-level-unlocked shells or phase-only combat fail
// p1-2-real-drag-aim-direction-opposite: real action: Input.dispatchMouseEvent drag higher and lower on playfield; independent observation: aim state/preview revision plus Math.sign screenVector or angleCategory direction opposite; empty-shell failure: static aim, same-direction mapping, or API-only aiming fails
// p1-3-real-drag-release-projectile-cooldown: real action: Input.dispatchMouseEvent press/move/release twice; independent observation: projectile fired revision, aim exit, canvas/playfield revision, cooldown rejection; empty-shell failure: click-to-damage or spam-fire shell fails
// p1-3b-real-touch-aim-release-operable: real action: Input.dispatchTouchEvent touchStart/touchMove/touchEnd on playfield; independent observation: aim or projectile/render revision changes without overlay lock; empty-shell failure: mouse-only or API-only touch path fails
// p1-4-miss-keeps-enemy-undamaged: real action: contract dragAimAndRelease lower/off-target then wait; independent observation: projectile path/canvas revision plus stable hit/damage/enemy health; empty-shell failure: auto-hit or instant damage shells fail
// p1-5-enemy-counterfire-risk-chain: real action: wait in combat_enemy_pressure without killing enemies; independent observation: enemy attack state/projectile revision plus player health/death or visual motion; empty-shell failure: passive target gallery fails
// p1-6-body-hit-feedback-health-sync: real action: contract shot at semantic enemy body zone; independent observation: hit/damage revision, enemy health/death, visible feedback/HUD revision; empty-shell failure: hidden numeric damage or visual-only impact fails
// p1-7-head-and-protection-outcomes: real action: contract shots at head and protected head semantic zones; independent observation: headshot/protection revisions plus health/death consistency; empty-shell failure: one generic damage path fails
// p1-8-victory-reward-progress-terminal: real action: contract shots defeat all remaining enemies then wait; independent observation: zero remaining enemies, result/rewards/progress deltas, terminal block; empty-shell failure: pre-won reward popup or unsaved progress fails
// p1-9-defeat-route-terminal-blocking: real action: wait/miss in defeat route then attempt aim/release; independent observation: player death feedback, failure result, unchanged completion/rewards/projectiles after terminal input; empty-shell failure: direct fail screen or farmable terminal state fails
// p1-10-platform-motion-and-wave-gating: real action: wait on moving platform and defeat active wave enemy; independent observation: platform and enemy carried revisions, queued/spawn counts, no early victory; empty-shell failure: background-only platform or one-enemy shortcut fails
// p1-11-pause-freeze-resume-restart: real action: pause, wait, attempt aim, resume, restart; independent observation: frozen motion while paused, playable after resume, transient cleanup after restart; empty-shell failure: overlay-only pause or dirty restart fails
// p1-12-powerup-collection-and-special-cost-benefit: real action: shoot visible bubble, wait, then release held effect; independent observation: collection revision, held type/charges, special shot benefit and charge cost; empty-shell failure: preloaded label or unlimited special effect fails
// p1-13-shop-affordable-and-rejection-invariants: real action: browser.mouseClick on visible shop area plus contract shopAction buy/equip/reject; independent observation: coins/ownership/equipped/downstream combat field and insufficient-funds invariants; empty-shell failure: cosmetic shop, free gear, negative coins, or API-only panel fails
// p2-1-settings-and-leaderboard-nonblocking: real action: contract open/toggle/close settings and leaderboard; independent observation: settings persistence plus nonblocking playable route; empty-shell failure: temporary toggles or network-blocking panel fails
// p2-2-tutorial-clears-after-real-aim: real action: Input.dispatchMouseEvent first aim gesture or dismissTutorial; independent observation: tutorial panel clears, tutorialComplete, playfield remains operable; empty-shell failure: permanent onboarding overlay fails
// p2-3-presentation-feedback-coupled-to-state: real action: trigger headshot, protection block, special arrow, and victory scenarios; independent observation: visibleFeedbackRevision paired with feature-specific state revisions; empty-shell failure: polish-only effects or state-only feedback fails

'use strict';

const PASS = (detail) => ({ status: 'PASS', detail: detail || '' });
const FAIL = (detail) => ({ status: 'FAIL', detail: detail || 'failed' });

const LEGAL_PHASES = new Set(['loading', 'menu', 'levelSelect', 'playing', 'paused', 'victoryPending', 'result', 'failure']);
const LEGAL_SCREENS = new Set(['loading', 'menu', 'levelSelect', 'combat', 'shop', 'settings', 'leaderboard', 'result', 'failure']);

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function revisionValue() {
  let best = 0;
  for (const value of arguments) {
    if (finiteNumber(value)) best += value;
  }
  return best;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value == null ? null : value));
}

function enemyHealthSum(snap) {
  const visible = snap && snap.enemies && Array.isArray(snap.enemies.visible) ? snap.enemies.visible : [];
  return visible.reduce((sum, enemy) => sum + (finiteNumber(enemy.health) ? enemy.health : 0), 0);
}

function nonNegativePublicNumbers(snap) {
  const checks = [
    ['progress.coins', snap && snap.progress && snap.progress.coins],
    ['progress.totalStars', snap && snap.progress && snap.progress.totalStars],
    ['player.health', snap && snap.player && snap.player.health],
    ['player.maxHealth', snap && snap.player && snap.player.maxHealth],
    ['powerUps.charges', snap && snap.powerUps && snap.powerUps.charges],
    ['result.coinsAwarded', snap && snap.result && snap.result.coinsAwarded],
    ['result.comboBonusCoins', snap && snap.result && snap.result.comboBonusCoins],
    ['projectiles.playerActive', snap && snap.projectiles && snap.projectiles.playerActive],
    ['projectiles.enemyActive', snap && snap.projectiles && snap.projectiles.enemyActive]
  ];
  const bad = checks.filter(([, value]) => finiteNumber(value) && value < 0).map(([name]) => name);
  return bad;
}

function getFirstVisibleEnemy(snap) {
  const visible = snap && snap.enemies && Array.isArray(snap.enemies.visible) ? snap.enemies.visible : [];
  return visible.find((enemy) => enemy && enemy.alive !== false && enemy.spawned !== false) || visible[0] || null;
}

function getFirstProtectedVisibleEnemy(snap) {
  const visible = snap && snap.enemies && Array.isArray(snap.enemies.visible) ? snap.enemies.visible : [];
  return visible.find((enemy) => enemy && enemy.alive !== false && enemy.spawned !== false && enemy.headProtection > 0) || null;
}

function getVisibleEnemyByRef(snap, ref) {
  const visible = snap && snap.enemies && Array.isArray(snap.enemies.visible) ? snap.enemies.visible : [];
  return visible.find((enemy) => enemy && enemy.ref === ref) || null;
}

function semanticPoint(zone) {
  if (!zone || zone.visible === false) return null;
  if (finiteNumber(zone.screenX) && finiteNumber(zone.screenY)) return { x: zone.screenX, y: zone.screenY };
  if (zone.bounds && finiteNumber(zone.bounds.left) && finiteNumber(zone.bounds.top) && finiteNumber(zone.bounds.width) && finiteNumber(zone.bounds.height)) {
    return { x: zone.bounds.left + zone.bounds.width / 2, y: zone.bounds.top + zone.bounds.height / 2 };
  }
  return null;
}

async function visiblePlayfieldRect(browser) {
  return await pageEval(browser, `
    const surfaces = Array.from(document.querySelectorAll('canvas'));
    let best = null;
    for (const surface of surfaces) {
      const r = surface.getBoundingClientRect();
      if (r.width > 80 && r.height > 80 && (!best || r.width * r.height > best.width * best.height)) {
        best = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
    }
    return best;
  `);
}

async function snapshotPointToPage(browser, snap, point) {
  if (!point || !finiteNumber(point.x) || !finiteNumber(point.y)) return null;
  const rect = await visiblePlayfieldRect(browser);
  const bounds = snap && snap.playfield && snap.playfield.bounds;
  if (rect && bounds && finiteNumber(bounds.left) && finiteNumber(bounds.top) && finiteNumber(bounds.width) && finiteNumber(bounds.height) && bounds.width > 0 && bounds.height > 0) {
    return {
      x: rect.left + ((point.x - bounds.left) / bounds.width) * rect.width,
      y: rect.top + ((point.y - bounds.top) / bounds.height) * rect.height
    };
  }
  return rect ? { x: rect.left + point.x, y: rect.top + point.y } : point;
}

async function semanticPagePoint(browser, snap, zone) {
  return await snapshotPointToPage(browser, snap, semanticPoint(zone));
}

async function playerAimPagePoint(browser, game, snap) {
  const player = snap && snap.player;
  const raw = player && finiteNumber(player.screenX) && finiteNumber(player.screenY)
    ? { x: player.screenX, y: player.screenY }
    : null;
  return (await snapshotPointToPage(browser, snap, raw)) || await game.playfieldPoint(0.16, 0.72);
}

async function realDrag(browser, start, end, holdMs) {
  if (!start || !end) return false;
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end.x, y: end.y, button: 'left', buttons: 1, modifiers: 0 });
  await browser.sleep(holdMs || 140);
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
  return true;
}

async function realDragToPagePoint(browser, game, snap, end) {
  const start = await playerAimPagePoint(browser, game, snap);
  if (!start || !end) return null;
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
  await browser.sleep(100);
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end.x, y: end.y, button: 'left', buttons: 1, modifiers: 0 });
  await browser.sleep(140);
  const aiming = await game.snapshot();
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
  await browser.sleep(40);
  return { aiming, after: await game.snapshot() };
}

async function realDragToZone(browser, game, snap, zone) {
  return await realDragToPagePoint(browser, game, snap, await semanticPagePoint(browser, snap, zone));
}

function findSemanticZone(snap, ref) {
  if (!snap || !ref) return null;
  const enemies = snap.enemies && Array.isArray(snap.enemies.visible) ? snap.enemies.visible : [];
  for (const enemy of enemies) {
    const zones = enemy && enemy.targetZones ? Object.values(enemy.targetZones) : [];
    const match = zones.find((zone) => zone && zone.ref === ref);
    if (match) return match;
  }
  const bubbles = snap.powerUps && Array.isArray(snap.powerUps.visible) ? snap.powerUps.visible : [];
  const bubble = bubbles.find((item) => item && (item.ref === ref || (item.zone && item.zone.ref === ref)));
  return bubble ? (bubble.zone || bubble) : null;
}

async function realWaveKillSearch(browser, game, baseline, enemyRef, zone, maxAttempts) {
  let current = baseline;
  const aimCandidates = [
    { xFactor: 0, arcFactor: 0 },
    { xFactor: -0.5, arcFactor: 0.2 },
    { xFactor: 0.5, arcFactor: 0.2 },
    { xFactor: -1, arcFactor: 0.4 },
    { xFactor: 1, arcFactor: 0.4 },
    { xFactor: 0, arcFactor: 0.6 },
    { xFactor: -1, arcFactor: 0.6 },
    { xFactor: 1, arcFactor: 0.6 },
    { xFactor: 0, arcFactor: 0.8 },
    { xFactor: -0.5, arcFactor: 0.8 },
    { xFactor: 0.5, arcFactor: 0.8 },
    { xFactor: 0, arcFactor: 1.0 }
  ];
  let successfulAim = null;
  const baselineAlive = baseline && baseline.enemies && baseline.enemies.alive;
  const attempts = Math.min(maxAttempts || aimCandidates.length, aimCandidates.length * 2);
  for (let i = 0; i < attempts; i++) {
    if (!current || current.phase !== 'playing') break;
    if (finiteNumber(baselineAlive) && current.enemies && finiteNumber(current.enemies.alive) &&
        current.enemies.alive < baselineAlive) return current;
    if (i > 0) current = await waitUntil(game, (s) => !!(s.phase === 'playing' && s.combat && s.combat.cooldownReady === true), 2200, 100);
    if (!current || current.phase !== 'playing') break;
    const visible = current.enemies && Array.isArray(current.enemies.visible) ? current.enemies.visible : [];
    const enemy = visible.find((item) => item && item.ref === enemyRef && item.alive !== false && item.spawned !== false);
    if (!enemy) break;
    const liveZone = (enemy.targetZones && enemy.targetZones.body) || findSemanticZone(current, zone && zone.ref) || zone;
    const target = await semanticPagePoint(browser, current, liveZone);
    const rect = await visiblePlayfieldRect(browser);
    if (!target || !rect) break;
    const bounds = current.playfield && current.playfield.bounds;
    const pageScale = bounds && finiteNumber(bounds.width) && bounds.width > 0 ? rect.width / bounds.width : 1;
    const zoneWidth = liveZone.bounds && finiteNumber(liveZone.bounds.width)
      ? Math.max(8, liveZone.bounds.width * pageScale)
      : Math.max(12, rect.width * 0.025);
    const candidate = successfulAim || aimCandidates[i % aimCandidates.length];
    const beforeHealth = finiteNumber(enemy.health) ? enemy.health : null;
    const end = {
      x: Math.max(rect.left + 4, Math.min(rect.left + rect.width - 4, target.x + zoneWidth * candidate.xFactor)),
      y: Math.max(rect.top + 4, Math.min(rect.top + rect.height - 4, target.y - rect.height * candidate.arcFactor))
    };
    const gesture = await realDragToPagePoint(browser, game, current, end);
    if (!gesture) break;
    current = await waitForShotResolution(game, gesture.after, 3600);
    const afterVisible = current.enemies && Array.isArray(current.enemies.visible) ? current.enemies.visible : [];
    const afterEnemy = afterVisible.find((item) => item && item.ref === enemyRef);
    const targetHealthDropped = !!(afterEnemy && finiteNumber(beforeHealth) && finiteNumber(afterEnemy.health) &&
      afterEnemy.health < beforeHealth);
    if (targetHealthDropped) successfulAim = candidate;
    if (!afterEnemy || afterEnemy.alive === false ||
        (current.enemies && finiteNumber(baselineAlive) && current.enemies.alive < baselineAlive)) return current;
  }
  return current;
}

async function realDragToPlayfieldPoint(browser, game, snap, nx, ny) {
  const start = await playerAimPagePoint(browser, game, snap);
  const end = await game.playfieldPoint(nx, ny);
  if (!start || !end) return null;
  await realDrag(browser, start, end, 140);
  return await game.snapshot();
}

async function waitUntil(game, predicate, maxMs, stepMs) {
  let snap = await game.snapshot();
  const step = stepMs || 100;
  for (let elapsed = 0; elapsed < (maxMs || 3000); elapsed += step) {
    if (predicate(snap)) return snap;
    snap = await game.wait(step);
  }
  return snap;
}

async function waitForShotResolution(game, snap, maxMs) {
  return await waitUntil(game, (current) => !!(current.projectiles && current.projectiles.playerActive === 0), maxMs || 3200, 100);
}

function unlockedLevelRef(snap) {
  const candidates = [
    snap && snap.progress && snap.progress.highestUnlockedRef,
    snap && snap.level && snap.level.currentRef
  ];
  return candidates.find((value) => value !== null && value !== undefined);
}

function findSemanticEnemy(snap, zoneName, predicate) {
  const visible = snap && snap.enemies && Array.isArray(snap.enemies.visible) ? snap.enemies.visible : [];
  return visible.find((enemy) => {
    if (!enemy || enemy.alive === false || enemy.spawned === false) return false;
    const zone = enemy.targetZones && enemy.targetZones[zoneName];
    return !!zone && zone.visible !== false && (!predicate || predicate(enemy));
  }) || null;
}

function semanticEnemyByRef(snap, ref) {
  const visible = snap && snap.enemies && Array.isArray(snap.enemies.visible) ? snap.enemies.visible : [];
  return visible.find((enemy) => enemy && enemy.ref === ref) || null;
}

async function realSemanticEnemyZoneSearch(browser, game, baseline, enemyRef, zoneName, success, maxAttempts) {
  let current = baseline;
  const sweepFactors = [0, -0.25, 0.25, -0.5, 0.5, -0.75, 0.75, -0.875, 0.875, -1, 1];
  const attempts = Math.min(maxAttempts || sweepFactors.length, sweepFactors.length);
  for (let i = 0; i < attempts; i++) {
    if (success(current)) return current;
    if (i > 0) current = await waitUntil(game, (s) => !!(s.phase === 'playing' && s.combat && s.combat.cooldownReady === true), 2200, 100);
    const enemy = semanticEnemyByRef(current, enemyRef);
    const liveZone = enemy && enemy.alive !== false && enemy.spawned !== false && enemy.targetZones && enemy.targetZones[zoneName] && enemy.targetZones[zoneName].visible !== false
      ? enemy.targetZones[zoneName] : null;
    const target = await semanticPagePoint(browser, current, liveZone);
    const rect = await visiblePlayfieldRect(browser);
    if (!target || !rect) break;
    const start = await playerAimPagePoint(browser, game, current);
    const zoneBounds = liveZone && liveZone.bounds;
    const playfieldBounds = current.playfield && current.playfield.bounds;
    const zoneHeight = zoneBounds && playfieldBounds && finiteNumber(zoneBounds.height) && finiteNumber(playfieldBounds.height) && playfieldBounds.height > 0
      ? (zoneBounds.height / playfieldBounds.height) * rect.height : rect.height * 0.04;
    const distance = start && finiteNumber(start.x) ? Math.abs(target.x - start.x) : rect.width * 0.5;
    const sweep = Math.max(zoneHeight, Math.min(rect.height * 0.45, Math.max(rect.height * 0.08, distance * 0.25)));
    const end = {
      x: target.x,
      y: Math.max(rect.top + 4, Math.min(rect.top + rect.height - 4, target.y + sweep * sweepFactors[i]))
    };
    const gesture = await realDragToPagePoint(browser, game, current, end);
    if (!gesture) break;
    current = await waitForShotResolution(game, gesture.after, 3600);
  }
  return current;
}

function hasUntouchedLiveEnemies(snap) {
  const visible = snap && snap.enemies && Array.isArray(snap.enemies.visible) ? snap.enemies.visible : [];
  const live = visible.filter((enemy) => enemy && enemy.alive !== false && enemy.spawned !== false);
  return live.length > 0 && live.every((enemy) =>
    finiteNumber(enemy.health) && finiteNumber(enemy.maxHealth) && enemy.health === enemy.maxHealth);
}

async function visibleLevelCandidate(browser, locked) {
  return await pageEval(browser, `
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const controls = Array.from(document.querySelectorAll(
      'button,[role="button"],[data-level-ref],[data-level],[data-lv],[data-ref],[data-act],[data-action],[class~="locked"]'
    ));
    const candidates = controls.map((el) => {
      const r = el.getBoundingClientRect();
      const dataAction = el.getAttribute('data-act') || el.getAttribute('data-action') || '';
      const dataRef = el.getAttribute('data-level-ref') || el.getAttribute('data-level') ||
        el.getAttribute('data-lv') || el.getAttribute('data-ref') ||
        (/^level[:/]/i.test(dataAction) ? dataAction.replace(/^level[:/]/i, '') : '');
      const label = [el.textContent, el.value, el.getAttribute('aria-label'), el.title,
        el.getAttribute('name'), el.id, dataRef, dataAction]
        .filter(Boolean).join(' ').trim();
      const number = label.match(/(?:^|\\s)(\\d+)(?:\\s|$)/);
      const refValue = dataRef || el.value || (number && number[1]);
      const state = [el.className, el.getAttribute('data-state'), el.getAttribute('data-status'), label]
        .filter((value) => typeof value === 'string').join(' ');
      const isLocked = !!el.disabled || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true' ||
        el.getAttribute('data-locked') === 'true' || /(?:^|\\s)locked(?:\\s|$)/i.test(state);
      return { label, ref: /^\\d+$/.test(String(refValue || '')) ? Number(refValue) : refValue, isLocked,
        visible: r.width > 20 && r.height > 20 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth,
        point: { x: r.left + r.width / 2, y: r.top + r.height / 2 } };
    }).filter((item) => item.visible && (item.ref !== undefined && item.ref !== null || item.isLocked));
    return candidates.find((item) => item.isLocked === ${locked ? 'true' : 'false'}) || null;
  `);
}

function combatRevision(snap) {
  return revisionValue(
    snap && snap.playfield && snap.playfield.revision,
    snap && snap.observability && snap.observability.canvasRevision,
    snap && snap.observability && snap.observability.visibleFeedbackRevision,
    snap && snap.projectiles && snap.projectiles.playerFiredRevision,
    snap && snap.projectiles && snap.projectiles.enemyFiredRevision,
    snap && snap.combat && snap.combat.hitRevision,
    snap && snap.combat && snap.combat.damageRevision
  );
}

async function pageEval(browser, body) {
  const result = await browser.eval(`(async function(){ ${body} })()`);
  if (result && result.__l2_err__) throw new Error(result.__l2_err__);
  return result;
}

function createGameDriver(browser) {
  async function call(method, arg1, arg2) {
    return await pageEval(browser, `
      const api = window.__gameTest;
      if (!api || typeof api[${JSON.stringify(method)}] !== 'function') return { __missing: ${JSON.stringify(method)} };
      const value = await api[${JSON.stringify(method)}](${JSON.stringify(arg1)}, ${JSON.stringify(arg2)});
      return value;
    `);
  }

  return {
    browser,
    async contractStatus() {
      return await pageEval(browser, `
        const api = window.__gameTest || null;
        return {
          has: !!api,
          reset: !!(api && typeof api.reset === 'function'),
          loadScenario: !!(api && typeof api.loadScenario === 'function'),
          input: !!(api && typeof api.input === 'function'),
          getSnapshot: !!(api && typeof api.getSnapshot === 'function')
        };
      `);
    },
    async reset(options) {
      const snap = await call('reset', options || {});
      return snap && snap.ready !== undefined ? snap : this.snapshot();
    },
    async snapshot() {
      return await call('getSnapshot');
    },
    async input(action) {
      const snap = await call('input', action);
      return snap && snap.ready !== undefined ? snap : this.snapshot();
    },
    async loadScenario(name, options) {
      const snap = await call('loadScenario', name, options || {});
      if (snap && snap.__missing) throw new Error('missing loadScenario');
      return snap && snap.ready !== undefined ? snap : this.snapshot();
    },
    async ensureScenario(name, predicate, label) {
      const snap = await this.loadScenario(name);
      if (!snap || snap.__missing) throw new Error(`scenario ${name} is not available`);
      if (predicate && !predicate(snap)) throw new Error(`scenario ${name} did not establish ${label || 'legal precondition'}`);
      return snap;
    },
    async wait(durationMs) {
      return await this.input({ type: 'wait', durationMs });
    },
    async playfieldPoint(nx, ny) {
      const rect = await visiblePlayfieldRect(browser);
      if (rect) return { x: rect.left + rect.width * nx, y: rect.top + rect.height * ny };
      const snap = await this.snapshot();
      const b = snap && snap.playfield && snap.playfield.bounds;
      if (b && finiteNumber(b.left) && finiteNumber(b.top) && finiteNumber(b.width) && finiteNumber(b.height)) {
        return { x: b.left + b.width * nx, y: b.top + b.height * ny };
      }
      return null;
    }
  };
}

function validateSnapshotShape(snap) {
  if (!snap || typeof snap !== 'object') return 'snapshot is not an object';
  if (snap.ready !== true) return 'snapshot.ready is not true';
  if (!LEGAL_PHASES.has(snap.phase)) return `illegal phase ${snap.phase}`;
  if (!LEGAL_SCREENS.has(snap.screen)) return `illegal screen ${snap.screen}`;
  if (snap.phase === 'playing') {
    if (snap.screen !== 'combat') return 'playing phase must use combat screen';
    if (!snap.playfield || snap.playfield.visible !== true) return 'playing phase must expose visible playfield';
    if (snap.overlayBlocking !== false) return 'playing phase must not be overlay-blocked';
  }
  const bad = nonNegativePublicNumbers(snap);
  if (bad.length) return `negative public numbers: ${bad.join(', ')}`;
  return null;
}

async function aimContract(game, direction, targetRef) {
  const action = targetRef
    ? { type: 'dragAimAndRelease', direction, targetRef, strength: 'normal' }
    : { type: 'dragAimAndRelease', direction, strength: 'normal' };
  return await game.input(action);
}

async function shootAtZone(game, zone, fallbackDirection) {
  const point = semanticPoint(zone);
  if (zone && zone.ref) return await game.input({ type: 'dragAimAndRelease', direction: fallbackDirection || 'higher', targetRef: zone.ref, strength: 'normal' });
  if (point) return await game.input({ type: 'dragAimAndRelease', direction: fallbackDirection || 'higher', targetRef: { zone: 'playfield', nx: 0.75, ny: 0.35 }, strength: 'normal' });
  return await game.input({ type: 'dragAimAndRelease', direction: fallbackDirection || 'higher', strength: 'normal' });
}

async function prepareSemanticAim(game, semantic, ref) {
  const point = { semantic, ref };
  await game.input({ type: 'aimStart', point });
  return await game.input({ type: 'aimMove', point });
}

async function releaseSemanticShot(game, maxMs) {
  const released = await game.input({ type: 'aimRelease' });
  return await waitForShotResolution(game, released, maxMs || 3600);
}

async function waitForPresentationCooldown(game) {
  return await waitUntil(game, (current) => current.phase === 'playing' &&
    current.combat && current.combat.cooldownReady !== false, 2200, 100);
}

async function shootPresentationTarget(game, semantic, ref, changed) {
  let last = { aiming: null, after: await game.snapshot() };
  for (const direction of [null, 'higher']) {
    await waitForPresentationCooldown(game);
    const point = { semantic, ref };
    await game.input({ type: 'aimStart', point });
    const aiming = direction
      ? await game.input({ type: 'aimMove', direction })
      : await game.input({ type: 'aimMove', point });
    const after = await releaseSemanticShot(game);
    last = { aiming, after };
    if (!changed || changed(after)) return last;
  }
  return last;
}

async function reachPresentationResultByContract(game, maxSteps) {
  let snap = await game.snapshot();
  for (let i = 0; i < maxSteps && snap.result && snap.result.type === 'none'; i++) {
    const enemy = getFirstVisibleEnemy(snap);
    if (!enemy || !enemy.ref) {
      snap = await waitUntil(game, (current) => current.result && current.result.type !== 'none', 2200, 100);
      break;
    }
    const headshotBefore = snap.combat && snap.combat.headshotRevision || 0;
    const attempt = await shootPresentationTarget(game, 'enemyHead', enemy.ref, (current) => {
      const same = getVisibleEnemyByRef(current, enemy.ref);
      return !!(current.result && current.result.type !== 'none') ||
        !same || same.alive === false ||
        !!(current.combat && current.combat.headshotRevision > headshotBefore);
    });
    snap = attempt.after;
    if (snap.result && snap.result.type === 'none') snap = await game.wait(500);
  }
  return snap;
}

async function reachResultByContract(game, maxSteps) {
  let snap = await game.snapshot();
  for (let i = 0; i < maxSteps && snap.result && snap.result.type === 'none'; i++) {
    const enemy = getFirstVisibleEnemy(snap);
    const body = enemy && enemy.targetZones && (enemy.targetZones.body || enemy.targetZones.head);
    snap = await shootAtZone(game, body, 'higher');
    snap = await game.wait(500);
  }
  return snap;
}

async function reachVictoryResultByContract(browser, game, maxSteps) {
  let snap = await game.snapshot();
  for (let i = 0; i < maxSteps && snap.result && snap.result.type === 'none' && snap.phase !== 'victoryPending'; i++) {
    const enemy = getFirstVisibleEnemy(snap);
    if (!enemy || !enemy.ref) {
      snap = await game.wait(500);
      continue;
    }
    const zone = enemy.targetZones && (enemy.targetZones.body || enemy.targetZones.head);
    snap = await realWaveKillSearch(browser, game, snap, enemy.ref, zone, 12);
    if (snap.result && snap.result.type !== 'none') break;
    if (snap.phase === 'playing') snap = await game.wait(500);
  }
  // Enemy death may finish its visible feedback before the result and reward appear.
  if (snap.phase === 'victoryPending') {
    snap = await waitUntil(game, current => !!(current.result && current.result.type !== 'none'), 3000, 100);
  }
  return snap;
}

const suite = [
  {
    id: 'p0-1-public-contract-ready',
    level: 'P0',
    name: 'Public contract is ready and returns legal snapshot',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const status = await game.contractStatus();
      if (!status.has || !status.reset || !status.loadScenario || !status.input || !status.getSnapshot) {
        return FAIL(`missing contract methods ${JSON.stringify(status)}`);
      }
      const snap = await game.reset();
      const shape = validateSnapshotShape(snap);
      if (shape) return FAIL(shape);
      return PASS(`phase=${snap.phase} screen=${snap.screen}`);
    }
  },
  {
    id: 'p0-2-playfield-entry-visible',
    level: 'P0',
    name: 'Start route exposes a nonblank playable combat field',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      let snap = await game.input({ type: 'startGame' });
      if (snap.screen === 'levelSelect') {
        const levelRef = unlockedLevelRef(snap);
        if (levelRef === undefined) return FAIL('level select exposed no unlocked semantic candidate');
        snap = await game.input({ type: 'selectLevel', levelRef });
      }
      if (snap.phase !== 'playing' || snap.screen !== 'combat') return FAIL(`did not enter combat: ${snap.phase}/${snap.screen}`);
      if (!snap.playfield || snap.playfield.visible !== true || snap.playfield.nonBlank !== true) return FAIL('playfield is missing or blank');
      if (snap.overlayBlocking || snap.canInteractWithPlayfield !== true) return FAIL('combat is still blocked by overlay');
      const enemyCount = snap.enemies && finiteNumber(snap.enemies.alive) ? snap.enemies.alive : 0;
      if (enemyCount < 1) return FAIL('combat entered without live enemy summary');
      return PASS(`combat visible with ${enemyCount} enemy summary`);
    }
  },
  {
    id: 'p1-1-level-entry-and-locked-rejection',
    level: 'P1',
    name: 'Level entry accepts unlocked levels and rejects locked levels',
    timeoutMs: 16000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pre = await game.ensureScenario('level_select_mixed', (s) => s.screen === 'levelSelect' || s.activePanel === 'levelSelect', 'level select mixed state');
      const progressBefore = deepClone(pre.progress);
      const currentBefore = pre.level && pre.level.currentRef;
      const levelBefore = pre.level || {};
      const lockedStateChanged = (snap) => {
        const level = snap && snap.level;
        const progress = snap && snap.progress;
        if (!level || !progress) return true;
        for (const field of ['currentRef', 'unlockedCount', 'selectedUnlocked', 'completedCount', 'bestStarsForCurrent']) {
          if (level[field] !== levelBefore[field]) return true;
        }
        for (const field of ['coins', 'totalStars', 'highestUnlockedRef', 'tutorialComplete']) {
          if (progress[field] !== progressBefore[field]) return true;
        }
        return JSON.stringify(progress.bestStarsByLevel || {}) !== JSON.stringify(progressBefore.bestStarsByLevel || {}) ||
          JSON.stringify(progress.settings || {}) !== JSON.stringify(progressBefore.settings || {});
      };
      const lockedRefFromCandidate = (candidate) => {
        if (candidate && candidate.ref !== undefined && candidate.ref !== null) return candidate.ref;
        const frontier = pre.progress && pre.progress.highestUnlockedRef;
        return typeof frontier === 'number' ? frontier + 1 : undefined;
      };
      const lockedCandidate = await visibleLevelCandidate(browser, true);
      let locked;
      if (lockedCandidate) {
        await browser.mouseClick(lockedCandidate.point.x, lockedCandidate.point.y);
        locked = await game.snapshot();
      } else if (typeof (pre.progress && pre.progress.highestUnlockedRef) === 'number') {
        locked = await game.input({ type: 'selectLevel', levelRef: pre.progress.highestUnlockedRef + 1 });
      } else {
        return FAIL('level select exposed no semantic locked candidate');
      }
      const rejected = (locked.lastAction && locked.lastAction.ok === false) || ((locked.level && locked.level.currentRef) === currentBefore);
      if (!rejected) return FAIL('locked level selection was not rejected or no-op');
      if (lockedStateChanged(locked)) return FAIL('locked level changed playable state or progress');
      const publicLockedRef = lockedRefFromCandidate(lockedCandidate);
      if (publicLockedRef !== undefined) {
        const publicLocked = await game.input({ type: 'selectLevel', levelRef: publicLockedRef });
        const publicRejected = (publicLocked.lastAction && publicLocked.lastAction.ok === false) ||
          ((publicLocked.level && publicLocked.level.currentRef) === currentBefore);
        if (!publicRejected || lockedStateChanged(publicLocked)) return FAIL('public locked level selection changed playable state or progress');
      }
      const unlockedCandidate = await visibleLevelCandidate(browser, false);
      let after;
      if (unlockedCandidate) {
        await browser.mouseClick(unlockedCandidate.point.x, unlockedCandidate.point.y);
        after = await game.snapshot();
      } else {
        const unlockedRef = unlockedLevelRef(pre);
        if (unlockedRef === undefined) return FAIL('level select exposed no unlocked semantic candidate');
        after = await game.input({ type: 'selectLevel', levelRef: unlockedRef });
      }
      if (after.phase !== 'playing' || after.screen !== 'combat' || after.overlayBlocking) return FAIL('unlocked level did not enter unblocked combat');
      if (!after.playfield || after.playfield.visible !== true || after.canInteractWithPlayfield !== true) return FAIL('unlocked level lacks playable field');
      return PASS('locked rejection plus unlocked combat entry verified');
    }
  },
  {
    id: 'p1-2-real-drag-aim-direction-opposite',
    level: 'P1',
    name: 'Real drag aiming has visible direction opposite evidence',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const captureDirection = async (nx, ny) => {
        const baseline = await game.ensureScenario('combat_aim_direction', (s) => s.phase === 'playing' && s.canInteractWithPlayfield === true, 'playable aim state');
        const start = await game.playfieldPoint(0.16, 0.72);
        const end = await game.playfieldPoint(0.46, ny);
        if (!start || !end) return null;
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end.x, y: end.y, button: 'left', buttons: 1, modifiers: 0 });
        await browser.sleep(160);
        const aiming = await game.snapshot();
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
        return { baseline, aiming };
      };
      const upCapture = await captureDirection(0.46, 0.28);
      const downCapture = await captureDirection(0.46, 0.82);
      if (!upCapture || !downCapture) return FAIL('no playfield point for real drag');
      const up = upCapture.aiming;
      const down = downCapture.aiming;
      const upAim = up.player && up.player.aim ? up.player.aim : {};
      const downAim = down.player && down.player.aim ? down.player.aim : {};
      if (upAim.state !== 'aiming' && downAim.state !== 'aiming') return FAIL('real drag did not enter aiming state');
      if (!upAim.previewVisible && !upAim.drawnVisible && !downAim.previewVisible && !downAim.drawnVisible) return FAIL('aim preview/drawn feedback not visible');
      const upDy = upAim.screenVector && finiteNumber(upAim.screenVector.dy) ? upAim.screenVector.dy : null;
      const downDy = downAim.screenVector && finiteNumber(downAim.screenVector.dy) ? downAim.screenVector.dy : null;
      const signedTrend = upDy !== null && downDy !== null && downDy > upDy;
      const categoryOpposite = upAim.angleCategory === 'higher' && downAim.angleCategory === 'lower';
      const upVisible = (finiteNumber(upAim.previewRevision) && upAim.previewRevision > ((upCapture.baseline.player && upCapture.baseline.player.aim && upCapture.baseline.player.aim.previewRevision) || 0)) ||
        (up.observability && upCapture.baseline.observability && up.observability.visibleFeedbackRevision > (upCapture.baseline.observability.visibleFeedbackRevision || 0));
      const downVisible = (finiteNumber(downAim.previewRevision) && downAim.previewRevision > ((downCapture.baseline.player && downCapture.baseline.player.aim && downCapture.baseline.player.aim.previewRevision) || 0)) ||
        (down.observability && downCapture.baseline.observability && down.observability.visibleFeedbackRevision > (downCapture.baseline.observability.visibleFeedbackRevision || 0));
      // A gravity-compensated arc may remain upward for both endpoints; require the lower endpoint to move the signed screen vector downward or use declared categories.
      if (!(signedTrend || categoryOpposite) || !upVisible || !downVisible) return FAIL(`direction opposite evidence missing: up=${JSON.stringify(upAim)} down=${JSON.stringify(downAim)}`);
      return PASS('real drag produced opposite visible aim direction');
    }
  },
  {
    id: 'p1-3-real-drag-release-projectile-cooldown',
    level: 'P1',
    name: 'Real drag release fires one projectile and cooldown blocks spam',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('combat_ready_basic', (s) => s.phase === 'playing' && s.canInteractWithPlayfield === true, 'ready combat');
      const point = await game.playfieldPoint(0.28, 0.5);
      if (!point) return FAIL('no playfield point for release');
      const end = { x: point.x + 150, y: point.y - 70 };
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end.x, y: end.y, button: 'left', buttons: 1, modifiers: 0 });
      await browser.sleep(120);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(220);
      const fired = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(120);
      const blocked = await game.snapshot();
      const beforeRev = before.projectiles && before.projectiles.playerFiredRevision;
      const firedRev = fired.projectiles && fired.projectiles.playerFiredRevision;
      const blockedRev = blocked.projectiles && blocked.projectiles.playerFiredRevision;
      if (!(finiteNumber(firedRev) && firedRev > (beforeRev || 0))) return FAIL('release did not increase player fired revision');
      if (fired.player && fired.player.aim && fired.player.aim.state === 'aiming') return FAIL('aiming did not end after release');
      if (fired.combat && fired.combat.cooldownReady === true) return FAIL('cooldown remained ready immediately after shot');
      if (finiteNumber(blockedRev) && blockedRev > firedRev + 1) return FAIL('cooldown allowed extra spam projectiles');
      if (combatRevision(fired) <= combatRevision(before)) return FAIL('shot did not change visible combat revision');
      return PASS(`shot revision ${beforeRev || 0}->${firedRev}, blocked=${blockedRev}`);
    }
  },
  {
    id: 'p1-3b-real-touch-aim-release-operable',
    level: 'P1',
    name: 'Real touch drag release can aim or fire through the playfield',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.ensureScenario('combat_ready_basic', (s) => s.phase === 'playing' && s.canInteractWithPlayfield === true, 'touch-operable combat');
      const before = await game.snapshot();
      const point = await game.playfieldPoint(0.28, 0.62);
      if (!point) return FAIL('no playfield point for touch release');
      const end = { x: point.x + 90, y: point.y - 70 };
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: point.x, y: point.y, radiusX: 3, radiusY: 3, force: 1, id: 1 }],
        modifiers: 0
      });
      await browser.sleep(160);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: end.x, y: end.y, radiusX: 3, radiusY: 3, force: 1, id: 1 }],
        modifiers: 0
      });
      await browser.sleep(180);
      const aiming = await game.snapshot();
      await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], modifiers: 0 });
      await browser.sleep(260);
      const after = await game.snapshot();
      const beforeFire = before.projectiles && before.projectiles.playerFiredRevision;
      const afterFire = after.projectiles && after.projectiles.playerFiredRevision;
      const aimed = aiming.player && aiming.player.aim &&
        (aiming.player.aim.state === 'aiming' || aiming.player.aim.previewVisible || aiming.player.aim.drawnVisible);
      const fired = finiteNumber(afterFire) && afterFire > (beforeFire || 0);
      const visualChanged = combatRevision(after) > combatRevision(before);
      if (!aimed && !fired && !visualChanged) return FAIL('real touch path produced no aim, shot, or visible combat revision');
      if (after.overlayBlocking && after.phase === 'playing') return FAIL('touch path left playing state blocked by overlay');
      return PASS(`touch aimed=${aimed} fired=${fired} visualChanged=${visualChanged}`);
    }
  },
  {
    id: 'p1-4-miss-keeps-enemy-undamaged',
    level: 'P1',
    name: 'Missed low shot travels without awarding enemy damage',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const missPoints = [
        { zone: 'playfield', nx: 0.96, ny: 0.96 },
        { zone: 'playfield', nx: 0.96, ny: 0.08 },
        { zone: 'playfield', nx: 0.08, ny: 0.96 },
        { zone: 'playfield', nx: 0.08, ny: 0.08 },
        { zone: 'playfield', nx: 0.72, ny: 0.02 },
        { zone: 'playfield', nx: 0.72, ny: 0.98 },
        { zone: 'playfield', nx: 0.32, ny: 0.02 },
        { zone: 'playfield', nx: 0.32, ny: 0.98 }
      ];
      let launched = false;
      let resolvedMiss = false;
      let lastFailure = '';
      for (const missPoint of missPoints) {
        const before = await game.ensureScenario('combat_ready_basic', (s) => s.phase === 'playing' &&
          s.canInteractWithPlayfield === true && s.playfield && s.playfield.visible === true &&
          s.enemies && s.enemies.alive > 0, 'ready enemy target');
        const healthBefore = enemyHealthSum(before);
        const aliveBefore = before.enemies && finiteNumber(before.enemies.alive) ? before.enemies.alive : null;
        const bounds = before.playfield && before.playfield.bounds;
        const liveZones = [];
        const visibleEnemies = before.enemies && Array.isArray(before.enemies.visible) ? before.enemies.visible : [];
        for (const enemy of visibleEnemies) {
          const targetZones = enemy && enemy.targetZones ? Object.values(enemy.targetZones) : [];
          for (const zone of targetZones) {
            if (zone && zone.visible !== false) liveZones.push(zone);
          }
        }
        if (bounds && finiteNumber(bounds.left) && finiteNumber(bounds.top) && finiteNumber(bounds.width) && finiteNumber(bounds.height) && bounds.width > 0 && bounds.height > 0 && liveZones.length) {
          const x = bounds.left + bounds.width * missPoint.nx;
          const y = bounds.top + bounds.height * missPoint.ny;
          const endpointOutside = liveZones.every((zone) => {
            const b = zone.bounds;
            if (b && finiteNumber(b.left) && finiteNumber(b.top) && finiteNumber(b.width) && finiteNumber(b.height)) {
              return x < b.left - 8 || x > b.left + b.width + 8 || y < b.top - 8 || y > b.top + b.height + 8;
            }
            if (finiteNumber(zone.screenX) && finiteNumber(zone.screenY)) return Math.hypot(x - zone.screenX, y - zone.screenY) > 48;
            return true;
          });
          if (!endpointOutside) continue;
        }
        const firedBefore = before.projectiles && before.projectiles.playerFiredRevision;
        let after = await game.input({ type: 'aimStart', point: missPoint });
        after = await game.input({ type: 'aimMove', point: missPoint });
        after = await game.input({ type: 'aimRelease' });
        const firedAfter = after.projectiles && after.projectiles.playerFiredRevision;
        if (!(finiteNumber(firedAfter) && firedAfter > (firedBefore || 0))) {
          lastFailure = 'miss input did not launch a player projectile';
          continue;
        }
        launched = true;
        after = await waitForShotResolution(game, after, 4200);
        if (!after.projectiles || after.projectiles.playerActive !== 0) {
          lastFailure = 'miss projectile did not resolve';
          continue;
        }
        const shot = after.projectiles.lastPlayerShot;
        const shotPathObserved = !!(shot && (shot.curvedPathObserved === true || shot.missed === true || (finiteNumber(shot.pathRevision) && shot.pathRevision > 0)));
        const scenePathObserved = !!((after.playfield && before.playfield && finiteNumber(after.playfield.revision) && finiteNumber(before.playfield.revision) && after.playfield.revision > before.playfield.revision) || (after.observability && before.observability && finiteNumber(after.observability.canvasRevision) && finiteNumber(before.observability.canvasRevision) && after.observability.canvasRevision > before.observability.canvasRevision));
        if (!shotPathObserved && !scenePathObserved) {
          lastFailure = 'miss shot produced no projectile/path evidence';
          continue;
        }
        if (enemyHealthSum(after) < healthBefore) {
          lastFailure = 'all candidate trajectories damaged an enemy';
          continue;
        }
        if (aliveBefore !== null && after.enemies && finiteNumber(after.enemies.alive) && after.enemies.alive < aliveBefore) {
          lastFailure = 'all candidate trajectories removed an enemy';
          continue;
        }
        if (after.enemies && after.enemies.alive < 1) {
          lastFailure = 'all candidate trajectories removed all enemies';
          continue;
        }
        resolvedMiss = true;
        break;
      }
      if (!launched) return FAIL(lastFailure || 'miss input did not launch a player projectile');
      if (!resolvedMiss) return FAIL(lastFailure || 'no resolved off-target trajectory preserved enemy health');
      return PASS('resolved off-target trajectory preserved enemy health and pressure state');
    }
  },
  {
    id: 'p1-5-enemy-counterfire-risk-chain',
    level: 'P1',
    name: 'Enemy counterfire creates visible risk while player waits',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('combat_enemy_pressure', (s) => s.phase === 'playing' && s.enemies && s.enemies.alive > 0, 'enemy pressure');
      const beforeFire = before.projectiles && before.projectiles.enemyFiredRevision;
      const beforeHealth = before.player && before.player.health;
      const after = await waitUntil(game, (s) => {
        const enemyFire = (s.projectiles && s.projectiles.enemyFiredRevision) > (beforeFire || 0) || (s.projectiles && s.projectiles.enemyActive > (before.projectiles ? before.projectiles.enemyActive || 0 : 0));
        const playerDamage = (finiteNumber(beforeHealth) && finiteNumber(s.player && s.player.health) && s.player.health < beforeHealth) || (s.player && s.player.alive === false);
        return (enemyFire || playerDamage) && combatRevision(s) > combatRevision(before);
      }, 12000, 100);
      const enemyFire = (after.projectiles && after.projectiles.enemyFiredRevision) > (beforeFire || 0) || (after.projectiles && after.projectiles.enemyActive > (before.projectiles ? before.projectiles.enemyActive || 0 : 0));
      const playerDamage = (finiteNumber(beforeHealth) && finiteNumber(after.player && after.player.health) && after.player.health < beforeHealth) || (after.player && after.player.alive === false);
      const playerRisk = enemyFire || playerDamage;
      const visibleRisk = combatRevision(after) > combatRevision(before);
      if (!playerRisk) return FAIL('enemy did not fire or damage player while alive');
      if (!visibleRisk) return FAIL('enemy pressure had no visible projectile, damage, or motion risk');
      return PASS('enemy attack state/projectile risk observed');
    }
  },
  {
    id: 'p1-6-body-hit-feedback-health-sync',
    level: 'P1',
    name: 'Body hit changes enemy health and visible feedback together',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('combat_single_enemy', (s) => s.phase === 'playing' && s.enemies && s.enemies.alive > 0, 'single live enemy');
      const enemy = getFirstVisibleEnemy(before);
      const body = enemy && enemy.targetZones && enemy.targetZones.body;
      const targetRef = enemy && enemy.ref;
      const targetHealthBefore = enemy && enemy.health;
      const targetWasAlive = !!enemy && enemy.alive !== false;
      const hitBefore = before.combat && before.combat.hitRevision;
      const feedbackBefore = before.observability && before.observability.visibleFeedbackRevision;
      if (!body) return FAIL('live enemy did not expose a usable semantic body zone');
      const targetHealthChanged = (s) => {
        const visible = s && s.enemies && Array.isArray(s.enemies.visible) ? s.enemies.visible : [];
        const target = targetRef != null
          ? visible.find((candidate) => candidate && candidate.ref === targetRef)
          : (visible.length === 1 ? visible[0] : null);
        if (target && finiteNumber(targetHealthBefore) && finiteNumber(target.health) && target.health < targetHealthBefore) return true;
        if (targetWasAlive && target && target.alive === false) return true;
        return targetWasAlive && !target && s && s.enemies &&
          finiteNumber(s.enemies.alive) &&
          finiteNumber(before.enemies && before.enemies.alive) &&
          s.enemies.alive < before.enemies.alive;
      };
      let after = await realSemanticEnemyZoneSearch(browser, game, before, targetRef, 'body', targetHealthChanged, 7);
      const hitDelta = (after.combat && after.combat.hitRevision) > (hitBefore || 0) || (after.combat && after.combat.damageRevision > (before.combat ? before.combat.damageRevision || 0 : 0));
      const healthDelta = targetHealthChanged(after);
      const feedbackDelta = (after.observability && after.observability.visibleFeedbackRevision) > (feedbackBefore || 0) || (after.observability && after.observability.hudRevision > (before.observability ? before.observability.hudRevision || 0 : 0));
      if (!hitDelta || !healthDelta || !feedbackDelta) return FAIL(`body hit evidence incomplete hit=${hitDelta} health=${healthDelta} feedback=${feedbackDelta} fired=${after.projectiles && after.projectiles.playerFiredRevision} active=${after.projectiles && after.projectiles.playerActive}`);
      return PASS('body hit synchronized damage and visible feedback');
    }
  },
  {
    id: 'p1-7-head-and-protection-outcomes',
    level: 'P1',
    name: 'Head hit and protected head outcomes are distinguishable',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const headPre = await game.ensureScenario('combat_single_enemy', (s) => s.phase === 'playing' && s.enemies && s.enemies.alive > 0, 'unprotected head target');
      const headEnemy = findSemanticEnemy(headPre, 'head', (enemy) =>
        finiteNumber(enemy.headProtection) && enemy.headProtection <= 0);
      const headZone = headEnemy && headEnemy.targetZones && headEnemy.targetZones.head;
      const headBefore = headPre.combat && headPre.combat.headshotRevision;
      if (!headEnemy || !headZone || !headEnemy.ref) return FAIL('unprotected enemy did not expose a usable semantic head zone');
      let headAfter = await realSemanticEnemyZoneSearch(browser, game, headPre, headEnemy.ref, 'head', (s) =>
        (s.combat && s.combat.headshotRevision > (headBefore || 0)) || (s.enemies && s.enemies.alive < headPre.enemies.alive), 11);
      const headshot = (headAfter.combat && headAfter.combat.headshotRevision) > (headBefore || 0) || (headAfter.enemies && headAfter.enemies.alive < headPre.enemies.alive);

      const protPre = await game.ensureScenario('combat_protected_enemy', (s) => s.phase === 'playing' && s.enemies && s.enemies.alive > 0, 'protected enemy');
      const protEnemy = findSemanticEnemy(protPre, 'protectedHead', (enemy) =>
        finiteNumber(enemy.headProtection) && enemy.headProtection > 0);
      const protZone = protEnemy && protEnemy.targetZones && protEnemy.targetZones.protectedHead;
      const protRef = protEnemy && protEnemy.ref;
      const blockBefore = protPre.combat && protPre.combat.protectionBlockRevision;
      const protectBefore = protEnemy && finiteNumber(protEnemy.headProtection) ? protEnemy.headProtection : null;
      if (!protEnemy || !protZone || !protRef) return FAIL('protected enemy did not expose a usable semantic protected-head zone');
      let protAfter = await realSemanticEnemyZoneSearch(browser, game, protPre, protRef, 'protectedHead', (s) =>
        (s.combat && s.combat.protectionBlockRevision > (blockBefore || 0)) ||
        (protectBefore !== null && semanticEnemyByRef(s, protRef) && finiteNumber(semanticEnemyByRef(s, protRef).headProtection) && semanticEnemyByRef(s, protRef).headProtection < protectBefore), 11);
      const protAfterEnemy = semanticEnemyByRef(protAfter, protRef);
      const blocked = (protAfter.combat && protAfter.combat.protectionBlockRevision) > (blockBefore || 0) ||
        (protectBefore !== null && protAfterEnemy && finiteNumber(protAfterEnemy.headProtection) && protAfterEnemy.headProtection < protectBefore);
      const feedback = combatRevision(headAfter) > combatRevision(headPre) && combatRevision(protAfter) > combatRevision(protPre);
      if (!headshot) return FAIL(`unprotected head hit did not produce headshot/death evidence fired=${headAfter.projectiles && headAfter.projectiles.playerFiredRevision} active=${headAfter.projectiles && headAfter.projectiles.playerActive}`);
      if (!blocked) return FAIL('protected head hit did not consume or block protection');
      if (!feedback) return FAIL('head/protection outcomes lacked visible feedback revision');
      return PASS('headshot and protected-head block are distinct');
    }
  },
  {
    id: 'p1-8-victory-reward-progress-terminal',
    level: 'P1',
    name: 'Victory requires enemy defeat and updates rewards/progress with terminal block',
    timeoutMs: 45000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('combat_victory_route_ready', (s) =>
        s.phase === 'playing' && s.enemies && s.enemies.alive > 0 && hasUntouchedLiveEnemies(s),
        'victory route ready with untouched live enemies');
      const coinsBefore = before.progress && before.progress.coins;
      const unlockedBefore = before.level && before.level.unlockedCount;
      const after = await reachVictoryResultByContract(browser, game, 12);
      if (!after.result || after.result.type !== 'victory' || after.result.visible !== true) return FAIL(`victory not reached: ${after.result && after.result.type}`);
      if (after.enemies && (after.enemies.alive > 0 || after.enemies.spawnedAlive > 0 || after.enemies.queued > 0)) return FAIL('victory shown with remaining enemies or queue');
      if (!finiteNumber(after.result.stars) || after.result.stars < 1 || after.result.stars > 3) return FAIL('victory stars outside TDD range');
      if (!finiteNumber(after.result.coinsAwarded) || after.result.coinsAwarded < 0) return FAIL('victory coin award invalid');
      if (finiteNumber(coinsBefore) && after.progress && after.progress.coins < coinsBefore) return FAIL('victory reduced coins');
      if (finiteNumber(unlockedBefore) && after.level && after.level.unlockedCount < unlockedBefore) return FAIL('victory reduced unlock count');
      if (after.canInteractWithPlayfield !== false || !after.combat || after.combat.terminalInputBlocked !== true) return FAIL('victory result did not block playfield input');
      return PASS(`victory stars=${after.result.stars} coinsAwarded=${after.result.coinsAwarded}`);
    }
  },
  {
    id: 'p1-9-defeat-route-terminal-blocking',
    level: 'P1',
    name: 'Defeat follows player damage and terminal state blocks further shots',
    timeoutMs: 42000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('combat_defeat_route_ready', (s) =>
        s.phase === 'playing' && s.player && s.player.alive === true &&
        finiteNumber(s.player.health) && finiteNumber(s.player.maxHealth) &&
        s.player.health === s.player.maxHealth, 'defeat route ready at full health');
      let after = before;
      for (let elapsedMs = 0; elapsedMs < 36000 && (!after.result || after.result.type === 'none'); elapsedMs += 1000) {
        after = await game.wait(1000);
      }
      const damaged = (finiteNumber(before.player.health) && finiteNumber(after.player && after.player.health) && after.player.health < before.player.health) ||
        (after.player && after.player.alive === false) ||
        (after.combat && after.combat.deathRevision > (before.combat ? before.combat.deathRevision || 0 : 0));
      if (!damaged) return FAIL('defeat route did not show player damage/death before terminal result');
      if (!after.result || after.result.type !== 'defeat') return FAIL(`defeat result not reached: ${after.result && after.result.type}`);
      const terminal = deepClone(after);
      const shotBefore = terminal.projectiles && terminal.projectiles.playerFiredRevision;
      const rewardBefore = terminal.result && terminal.result.coinsAwarded;
      const blocked = await game.input({ type: 'dragAimAndRelease', direction: 'higher', strength: 'normal' });
      if (blocked.canInteractWithPlayfield !== false || !blocked.combat || blocked.combat.terminalInputBlocked !== true) return FAIL('failure terminal did not keep playfield blocked');
      if ((blocked.projectiles && blocked.projectiles.playerFiredRevision) > (shotBefore || 0)) return FAIL('terminal failure allowed new shot');
      if ((blocked.result && blocked.result.coinsAwarded) !== rewardBefore) return FAIL('terminal input mutated reward');
      if (blocked.level && finiteNumber(blocked.level.bestStarsForCurrent) && blocked.level.bestStarsForCurrent > (before.level ? before.level.bestStarsForCurrent || 0 : 0)) return FAIL('defeat incorrectly improved completion stars');
      return PASS('defeat damage and terminal blocking verified');
    }
  },
  {
    id: 'p1-10-platform-motion-and-wave-gating',
    level: 'P1',
    name: 'Moving platforms carry enemies and waves gate victory',
    timeoutMs: 36000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const movingBefore = await game.ensureScenario('combat_moving_platform', (s) => s.phase === 'playing' && s.platforms && s.platforms.movingCount > 0, 'moving platform');
      const movingAfter = await game.wait(1500);
      const platformMoved = movingAfter.platforms && movingAfter.platforms.motionRevision > (movingBefore.platforms ? movingBefore.platforms.motionRevision || 0 : 0);
      const carried = movingAfter.platforms && movingAfter.platforms.enemyCarriedRevision > (movingBefore.platforms ? movingBefore.platforms.enemyCarriedRevision || 0 : 0);
      if (!platformMoved || !carried) return FAIL(`moving platform did not carry enemy platformMoved=${platformMoved} carried=${carried}`);

      const waveBefore = await game.ensureScenario('combat_wave_queue', (s) => s.phase === 'playing' && s.enemies && s.enemies.queued > 0, 'queued enemy wave');
      const waveEnemy = getFirstVisibleEnemy(waveBefore);
      const waveZone = waveEnemy && waveEnemy.targetZones && waveEnemy.targetZones.body;
      if (!waveEnemy || !waveEnemy.ref || !waveZone) return FAIL('wave enemy did not expose a usable semantic body zone');
      let waveAfter = await realWaveKillSearch(browser, game, waveBefore, waveEnemy.ref, waveZone, 24);
      const activeDefeated = !!(waveAfter && waveAfter.enemies && waveAfter.enemies.alive < waveBefore.enemies.alive);
      if (!activeDefeated) return FAIL(
        'active wave enemy was not defeated by validated semantic shots ' +
        'fired=' + (waveAfter.projectiles && waveAfter.projectiles.playerFiredRevision) +
        ' hit=' + (waveAfter.combat && waveAfter.combat.hitRevision) +
        ' damage=' + (waveAfter.combat && waveAfter.combat.damageRevision)
      );
      const queuedBefore = waveBefore.enemies && waveBefore.enemies.queued;
      waveAfter = await waitUntil(game, (current) => !!(
        current && current.enemies && finiteNumber(queuedBefore) &&
        finiteNumber(current.enemies.queued) &&
        current.enemies.queued < queuedBefore &&
        finiteNumber(current.enemies.spawnedAlive) && current.enemies.spawnedAlive > 0
      ), 3000, 100);
      const queueChanged = !!(waveAfter && waveAfter.enemies &&
        finiteNumber(queuedBefore) && finiteNumber(waveAfter.enemies.queued) &&
        waveAfter.enemies.queued < queuedBefore &&
        finiteNumber(waveAfter.enemies.spawnedAlive) && waveAfter.enemies.spawnedAlive > 0);
      const remainingEnemies = !!(waveAfter && waveAfter.enemies &&
        (waveAfter.enemies.queued > 0 || waveAfter.enemies.spawnedAlive > 0));
      const noEarlyVictory = !(remainingEnemies &&
        (waveAfter.phase === 'victoryPending' || (waveAfter.result && waveAfter.result.type === 'victory')));
      if (!queueChanged) return FAIL(`defeating active wave enemy did not affect queued/spawned summaries fired=${waveAfter.projectiles && waveAfter.projectiles.playerFiredRevision} active=${waveAfter.projectiles && waveAfter.projectiles.playerActive} alive=${waveAfter.enemies && waveAfter.enemies.alive}`);
      if (!noEarlyVictory) return FAIL('victory appeared while queued/spawned enemies remained');
      return PASS('platform carry and wave gating verified');
    }
  },
  {
    id: 'p1-11-pause-freeze-resume-restart',
    level: 'P1',
    name: 'Pause freezes combat, resume restores play, restart clears transient state',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const pauseFreezeRevision = (snap) => revisionValue(
        snap && snap.observability && snap.observability.worldMotionRevision,
        snap && snap.platforms && snap.platforms.motionRevision,
        snap && snap.platforms && snap.platforms.enemyCarriedRevision,
        snap && snap.projectiles && snap.projectiles.playerFiredRevision,
        snap && snap.projectiles && snap.projectiles.enemyFiredRevision,
        snap && snap.combat && snap.combat.hitRevision,
        snap && snap.combat && snap.combat.damageRevision,
        snap && snap.combat && snap.combat.headshotRevision,
        snap && snap.combat && snap.combat.protectionBlockRevision,
        snap && snap.combat && snap.combat.deathRevision,
        snap && snap.powerUps && snap.powerUps.collectionRevision,
        snap && snap.powerUps && snap.powerUps.effectRevision
      );
      const pauseTransientState = (snap) => ({
        cooldownReady: snap && snap.combat ? snap.combat.cooldownReady : null,
        comboCount: snap && snap.combat ? snap.combat.comboCount : null,
        comboBonusCoins: snap && snap.combat ? snap.combat.comboBonusCoins : null
      });
      const before = await game.ensureScenario('paused_from_combat', (s) => s.phase === 'playing' && s.canInteractWithPlayfield === true, 'pauseable combat');
      const paused = await game.input({ type: 'pause' });
      if (paused.phase !== 'paused' || paused.canInteractWithPlayfield !== false || paused.overlayBlocking !== true) return FAIL('pause did not block combat');
      const motionBefore = pauseFreezeRevision(paused);
      const waited = await game.wait(900);
      const motionAfter = pauseFreezeRevision(waited);
      const shotBefore = waited.projectiles && waited.projectiles.playerFiredRevision;
      const blockedAim = await game.input({ type: 'dragAimAndRelease', direction: 'higher', strength: 'normal' });
      if ((blockedAim.projectiles && blockedAim.projectiles.playerFiredRevision) > (shotBefore || 0)) return FAIL('paused combat allowed shooting');
      if (motionAfter !== motionBefore) return FAIL('pause did not freeze combat revisions');
      const resumed = await game.input({ type: 'resume' });
      if (resumed.phase !== 'playing' || resumed.canInteractWithPlayfield !== true) return FAIL('resume did not restore play');
      const firedAfterResume = await game.input({ type: 'dragAimAndRelease', direction: 'higher', strength: 'normal' });
      let dirty;
      if (firedAfterResume.phase === 'playing') {
        const pausedAfterShot = await game.input({ type: 'pause' });
        if (pausedAfterShot.phase !== 'paused' || pausedAfterShot.canInteractWithPlayfield !== false || pausedAfterShot.overlayBlocking !== true) return FAIL('pause after shot did not block combat');
        const transientBefore = pauseTransientState(pausedAfterShot);
        const pausedAfterWait = await game.wait(900);
        const transientAfter = pauseTransientState(pausedAfterWait);
        if (transientAfter.cooldownReady !== transientBefore.cooldownReady || transientAfter.comboCount !== transientBefore.comboCount || transientAfter.comboBonusCoins !== transientBefore.comboBonusCoins) return FAIL('pause changed cooldown/combo state');
        const resumedAfterShot = await game.input({ type: 'resume' });
        if (resumedAfterShot.phase !== 'playing' || resumedAfterShot.canInteractWithPlayfield !== true) return FAIL('resume after shot pause did not restore play');
        dirty = await game.wait(250);
      } else {
        dirty = await game.wait(250);
      }
      const restarted = await game.input({ type: 'restart' });
      if (restarted.phase !== 'playing' || restarted.result.type !== 'none') return FAIL('restart did not return to active combat');
      if (restarted.projectiles && restarted.projectiles.playerActive > 0) return FAIL('restart left active player projectiles');
      if (restarted.powerUps && restarted.powerUps.heldType !== 'none' && restarted.powerUps.charges > 0) return FAIL('restart left held power-up effect');
      if (dirty.progress && restarted.progress && dirty.progress.coins !== restarted.progress.coins) return FAIL('restart mutated long-term coins');
      if (before.player && restarted.player && restarted.player.alive !== true) return FAIL('restart did not restore living player');
      return PASS('pause/resume/restart state machine verified');
    }
  },
  {
    id: 'p1-12-powerup-collection-and-special-cost-benefit',
    level: 'P1',
    name: 'Power-up bubble collection and special shot couple benefit with charge cost',
    timeoutMs: 42000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('combat_powerup_multi_available', (s) => s.phase === 'playing' && s.powerUps && s.powerUps.visible && s.powerUps.visible.length > 0 && s.powerUps.heldType === 'none', 'visible uncollected multi bubble');
      const bubble = before.powerUps.visible.find((p) => p.type === 'multi') || before.powerUps.visible[0];
      const bubbleZone = bubble && bubble.zone;
      if (!bubbleZone) return FAIL('power-up bubble did not expose a usable semantic zone');
      const collectWithSemanticArc = async (baseline, targetZone) => {
        let current = baseline;
        const arcFactors = Array.from({ length: 13 }, (_, index) => index / 12);
        for (let i = 0; i < arcFactors.length; i++) {
          if (current && current.powerUps && current.powerUps.heldType !== 'none' &&
              current.powerUps.charges > 0 &&
              current.powerUps.collectionRevision > (before.powerUps.collectionRevision || 0)) return current;
          if (!current || current.phase !== 'playing') break;
          if (i > 0) current = await waitUntil(game, (s) =>
            !!(s.phase === 'playing' && s.combat && s.combat.cooldownReady === true), 2200, 100);
          if (!current || current.phase !== 'playing') break;
          const liveZone = findSemanticZone(current, targetZone && targetZone.ref) || targetZone;
          const target = await semanticPagePoint(browser, current, liveZone);
          const rect = await visiblePlayfieldRect(browser);
          if (!target || !rect) break;
          const end = {
            x: target.x,
            y: Math.max(rect.top + 4, Math.min(rect.top + rect.height - 4,
              target.y - rect.height * arcFactors[i]))
          };
          const gesture = await realDragToPagePoint(browser, game, current, end);
          if (!gesture) break;
          current = await waitForShotResolution(game, gesture.after, 3600);
        }
        return current;
      };
      let collected = await collectWithSemanticArc(before, bubbleZone);
      if (!collected.powerUps || collected.powerUps.heldType === 'none' || collected.powerUps.charges <= 0) return FAIL(`bubble shot did not collect a held effect fired=${collected.projectiles && collected.projectiles.playerFiredRevision} active=${collected.projectiles && collected.projectiles.playerActive} visible=${collected.powerUps && collected.powerUps.visible && collected.powerUps.visible.length}`);
      if (collected.powerUps.collectionRevision <= (before.powerUps.collectionRevision || 0)) return FAIL('collection revision did not advance');
      const chargesBefore = collected.powerUps.charges;
      const firedBefore = collected.projectiles && collected.projectiles.playerFiredRevision;
      const ready = await waitUntil(game, (current) => !!(current.combat && current.combat.cooldownReady === true), 2200, 100);
      const usedGesture = await realDragToPlayfieldPoint(browser, game, ready, 0.62, 0.34);
      if (!usedGesture) return FAIL('special effect shot had no playable target point');
      let used = await waitForShotResolution(game, usedGesture, 2600);
      const shot = used.projectiles && used.projectiles.lastPlayerShot;
      const benefit = shot && (shot.type === 'multi' || shot.count > 1);
      const cost = used.powerUps && used.powerUps.charges < chargesBefore && used.powerUps.charges >= 0;
      if (!benefit || !cost) return FAIL(`special benefit/cost missing benefit=${benefit} cost=${cost}`);
      return PASS(`special ${collected.powerUps.heldType} charges ${chargesBefore}->${used.powerUps.charges}`);
    }
  },
  {
    id: 'p1-13-shop-affordable-and-rejection-invariants',
    level: 'P1',
    name: 'Shop purchase/equip and rejection preserve currency invariants',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('shop_affordable', (s) => s.progress && finiteNumber(s.progress.coins), 'affordable shop');
      let opened = before;
      if (opened.activePanel !== 'shop' && opened.screen !== 'shop') {
        const shopPoint = await pageEval(browser, `
          const controls = Array.from(document.querySelectorAll('button,[role="button"],[data-act],[data-action],[data-panel],[data-mode]'));
          const semantic = (el) => [
            el.textContent,
            el.value,
            el.getAttribute('aria-label'),
            el.title,
            el.getAttribute('data-action'),
            el.getAttribute('data-panel'),
            el.getAttribute('data-mode'),
            el.getAttribute('data-act'),
            el.id,
            el.name,
            el.labels ? Array.from(el.labels).map((label) => label.textContent).join(' ') : '',
            el.closest('label') ? el.closest('label').textContent : ''
          ].filter(Boolean).join(' ').toLowerCase();
          const target = controls.find((el) => {
            const r = el.getBoundingClientRect();
            const tokens = semantic(el).split(/[^a-z0-9]+/);
            return r.width > 20 && r.height > 20 && r.right > 0 && r.bottom > 0 &&
              r.left < innerWidth && r.top < innerHeight && tokens.includes('shop');
          });
          if (!target) return null;
          const r = target.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        `);
        if (!shopPoint) return FAIL('visible shop control was not discoverable');
        await browser.mouseClick(shopPoint.x, shopPoint.y);
        opened = await game.snapshot();
      }
      if (!opened || (opened.activePanel !== 'shop' && opened.screen !== 'shop') ||
          !opened.shop || opened.shop.visible !== true) return FAIL('visible shop route did not open');
      const item = opened.shop && Array.isArray(opened.shop.items) ? opened.shop.items.find((it) => it.affordable && !it.owned) : null;
      if (!item) return FAIL('affordable scenario lacks an affordable unowned item');
      const bought = await game.input({ type: 'shopAction', kind: 'buy', category: item.category, itemRef: item.ref });
      const boughtItem = bought.shop && Array.isArray(bought.shop.items) ? bought.shop.items.find((it) => it.ref === item.ref) : null;
      if (!boughtItem || boughtItem.owned !== true) return FAIL('buy did not mark item owned');
      if (bought.progress.coins !== before.progress.coins - item.price) return FAIL('coin delta did not match item price');
      const equipped = await game.input({ type: 'shopAction', kind: 'equip', category: item.category, itemRef: item.ref });
      const equippedItem = equipped.shop && Array.isArray(equipped.shop.items) ? equipped.shop.items.find((it) => it.ref === item.ref) : null;
      if (!equippedItem || equippedItem.equipped !== true) return FAIL('equip did not mark item equipped');
      const already = await game.input({ type: 'shopAction', kind: 'equip', category: item.category, itemRef: item.ref });
      const alreadyItem = already.shop && Array.isArray(already.shop.items) ? already.shop.items.find((it) => it.ref === item.ref) : null;
      if (!alreadyItem || already.progress.coins !== equipped.progress.coins ||
          alreadyItem.owned !== equippedItem.owned ||
          alreadyItem.equipped !== equippedItem.equipped ||
          !already.lastAction || already.lastAction.ok !== false) return FAIL('already-equipped action was not rejected without mutation');
      const combat = await game.loadScenario('combat_ready_basic');
      const preMaxHealth = before.player && finiteNumber(before.player.maxHealth) ? before.player.maxHealth : null;
      const preHeadProtection = before.player && finiteNumber(before.player.headProtection) ? before.player.headProtection : null;
      const helmetReflected = item.category !== 'helmet' ||
        (combat.player && finiteNumber(combat.player.maxHealth) && preMaxHealth !== null && combat.player.maxHealth >= preMaxHealth) ||
        (combat.player && finiteNumber(combat.player.headProtection) && preHeadProtection !== null && combat.player.headProtection >= preHeadProtection) ||
        (combat.player && combat.player.equipped && combat.player.equipped.helmetRef != null);
      if (!helmetReflected) return FAIL('helmet equipment not reflected in combat summary');

      const poor = await game.loadScenario('shop_insufficient');
      const poorItem = poor.shop && poor.shop.items ? poor.shop.items.find((it) => !it.owned && !it.affordable) : null;
      if (!poorItem) return FAIL('insufficient scenario lacks unaffordable unowned item');
      const reject = await game.input({ type: 'shopAction', kind: 'buy', category: poorItem.category, itemRef: poorItem.ref });
      const rejectItem = reject.shop.items.find((it) => it.ref === poorItem.ref);
      if (!rejectItem || reject.progress.coins !== poor.progress.coins || reject.progress.coins < 0 ||
          rejectItem.owned !== poorItem.owned || rejectItem.equipped !== poorItem.equipped ||
          !reject.lastAction || reject.lastAction.ok !== false) return FAIL('rejected purchase changed shop state or lacked rejection');
      return PASS('shop spend/equip/rejection invariants verified');
    }
  },
  {
    id: 'p2-1-settings-and-leaderboard-nonblocking',
    level: 'P2',
    name: 'Settings persist and leaderboard shell is nonblocking',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('settings_available', (s) => s.screen === 'menu' || s.activePanel === 'settings', 'settings availability');
      const opened = await game.input({ type: 'openPanel', panel: 'settings' });
      if (opened.activePanel !== 'settings') return FAIL('settings panel did not open');
      const sfxBefore = opened.progress && opened.progress.settings && opened.progress.settings.sfx;
      const toggled = await game.input({ type: 'toggleSetting', setting: 'sfx' });
      if (toggled.progress && toggled.progress.settings && toggled.progress.settings.sfx === sfxBefore) return FAIL('sfx setting did not toggle');
      const reset = await game.reset({ keepProgress: true });
      if (reset.progress && reset.progress.settings && toggled.progress && toggled.progress.settings && reset.progress.settings.sfx !== toggled.progress.settings.sfx) return FAIL('setting did not persist across keepProgress reset');
      const leader = await game.input({ type: 'openPanel', panel: 'leaderboard' });
      if (leader.activePanel !== 'leaderboard') return FAIL('leaderboard panel did not open');
      const closed = await game.input({ type: 'closePanel', panel: 'leaderboard' });
      if (closed.activePanel === 'leaderboard' || closed.screen === 'leaderboard') return FAIL('leaderboard stayed open after close');
      const route = await game.input({ type: 'startGame' });
      if (route.screen !== 'levelSelect' && route.phase !== 'playing') return FAIL('settings/leaderboard flow blocked play route');
      if (before.progress && before.progress.coins < 0) return FAIL('settings scenario exposed negative coins');
      return PASS('settings persistence and leaderboard nonblocking flow verified');
    }
  },
  {
    id: 'p2-2-tutorial-clears-after-real-aim',
    level: 'P2',
    name: 'Tutorial clears after real first aim and does not block combat',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const before = await game.ensureScenario('tutorial_first_level', (s) => s.phase === 'playing' || s.activePanel === 'tutorial', 'tutorial first level');
      const point = await game.playfieldPoint(0.25, 0.52);
      if (!point) return FAIL('no playfield point for tutorial aim');
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + 80, y: point.y - 40, button: 'left', buttons: 1, modifiers: 0 });
      await browser.sleep(120);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x + 80, y: point.y - 40, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(250);
      let after = await game.snapshot();
      if (after.activePanel === 'tutorial') {
        after = await game.input({ type: 'dismissTutorial' });
      }
      if (after.activePanel === 'tutorial') return FAIL('tutorial remained active after first aim/dismiss');
      if (after.progress && after.progress.tutorialComplete === false) return FAIL('tutorial completion was not recorded');
      if (after.canInteractWithPlayfield !== true && after.phase === 'playing') return FAIL('tutorial blocked combat after clearing');
      if (combatRevision(after) <= combatRevision(before)) return FAIL('real aim did not produce visible gameplay feedback');
      return PASS('tutorial cleared and combat remains operable');
    }
  },
  {
    id: 'p2-3-presentation-feedback-coupled-to-state',
    level: 'P2',
    name: 'Enhanced presentation feedback is coupled to real state changes',
    timeoutMs: 42000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const headPre = await game.ensureScenario('combat_single_enemy', (s) => s.phase === 'playing' && s.enemies && s.enemies.alive > 0, 'headshot presentation');
      const headEnemy = getFirstVisibleEnemy(headPre);
      const headAttempt = headEnemy
        ? await shootPresentationTarget(game, 'enemyHead', headEnemy.ref, (current) =>
          !!(current.combat && current.combat.headshotRevision > (headPre.combat && headPre.combat.headshotRevision || 0)))
        : { aiming: null, after: headPre };
      const headAiming = headAttempt.aiming;
      const headAfter = headAttempt.after;
      const headFeedback = !!(headAiming && headAfter.observability && headAiming.observability && headAfter.observability.visibleFeedbackRevision > (headAiming.observability.visibleFeedbackRevision || 0));
      const headState = !!(headAfter.combat && headPre.combat && headAfter.combat.headshotRevision > (headPre.combat.headshotRevision || 0));

      const protectedPre = await game.ensureScenario('combat_protected_enemy', (s) => {
        const enemy = getFirstProtectedVisibleEnemy(s);
        return s.phase === 'playing' && s.enemies && s.enemies.alive > 0 && enemy && enemy.headProtection > 0;
      }, 'protected-head presentation');
      const protectedEnemy = getFirstProtectedVisibleEnemy(protectedPre);
      const protectedBlockBefore = protectedPre.combat && protectedPre.combat.protectionBlockRevision || 0;
      const protectedHeadBefore = protectedEnemy && protectedEnemy.headProtection;
      const protectedAttempt = protectedEnemy
        ? await shootPresentationTarget(game, 'enemyHead', protectedEnemy.ref, (current) => {
          const same = getVisibleEnemyByRef(current, protectedEnemy.ref);
          return !!(current.combat && current.combat.protectionBlockRevision > protectedBlockBefore) ||
            !!(protectedHeadBefore !== undefined && same && same.headProtection < protectedHeadBefore);
        })
        : { aiming: null, after: protectedPre };
      const protectedAiming = protectedAttempt.aiming;
      const protectedAfter = protectedAttempt.after;
      const protectedAfterEnemy = getVisibleEnemyByRef(protectedAfter, protectedEnemy && protectedEnemy.ref);
      const protectedState = !!(protectedAfter.combat && protectedAfter.combat.protectionBlockRevision > protectedBlockBefore) ||
        !!(protectedHeadBefore !== undefined && protectedAfterEnemy && protectedAfterEnemy.headProtection < protectedHeadBefore);
      const protectedFeedback = !!(protectedAiming && protectedAfter.observability && protectedAiming.observability && protectedAfter.observability.visibleFeedbackRevision > (protectedAiming.observability.visibleFeedbackRevision || 0));

      const powerPre = await game.ensureScenario('combat_powerup_fire_available', (s) => s.phase === 'playing' && s.enemies && s.enemies.alive > 0 && s.powerUps && s.powerUps.visible && s.powerUps.visible.length > 0, 'fire power-up presentation');
      const bubble = powerPre.powerUps.visible.find((p) => p.type === 'fire') || powerPre.powerUps.visible[0];
      const powerAttempt = await shootPresentationTarget(game, 'powerUpBubble', bubble.ref, (current) =>
        !!(current.powerUps && current.powerUps.heldType !== 'none' && current.powerUps.collectionRevision > (powerPre.powerUps.collectionRevision || 0)));
      const powerAiming = powerAttempt.aiming;
      let powerAfter = powerAttempt.after;
      powerAfter = await waitUntil(game, (current) => !!(current.powerUps && current.powerUps.heldType !== 'none' && current.powerUps.collectionRevision > (powerPre.powerUps.collectionRevision || 0)), 3600, 100);
      const collected = powerAfter.powerUps && powerAfter.powerUps.heldType !== 'none' && powerAfter.powerUps.collectionRevision > (powerPre.powerUps.collectionRevision || 0);
      const powerFeedback = !!(powerAiming && powerAfter.observability && powerAiming.observability && powerAfter.observability.visibleFeedbackRevision > (powerAiming.observability.visibleFeedbackRevision || 0));
      powerAfter = await waitForPresentationCooldown(game);
      const powerEnemy = getFirstVisibleEnemy(powerAfter);
      const effectBefore = powerAfter.powerUps && powerAfter.powerUps.effectRevision || 0;
      const effectAttempt = powerEnemy
        ? await shootPresentationTarget(game, 'enemyBody', powerEnemy.ref, (current) => {
          const shot = current.projectiles && current.projectiles.lastPlayerShot;
          const burning = current.enemies && powerAfter.enemies && current.enemies.burning > (powerAfter.enemies.burning || 0);
          const damage = current.combat && powerAfter.combat && current.combat.damageRevision > (powerAfter.combat.damageRevision || 0);
          return !!(shot && shot.type === 'fire' &&
            ((current.powerUps && current.powerUps.effectRevision > effectBefore) || burning || damage));
        })
        : { aiming: null, after: powerAfter };
      const effectAiming = effectAttempt.aiming;
      const effectAfter = effectAttempt.after;
      const effectShot = !!(effectAfter.projectiles && effectAfter.projectiles.lastPlayerShot && effectAfter.projectiles.lastPlayerShot.type === 'fire');
      const effectState = effectShot && !!((effectAfter.powerUps && effectAfter.powerUps.effectRevision > effectBefore) ||
        (effectAfter.enemies && effectAfter.enemies.burning > (powerAfter.enemies ? powerAfter.enemies.burning || 0 : 0)) ||
        (effectAfter.combat && powerAfter.combat && effectAfter.combat.damageRevision > (powerAfter.combat.damageRevision || 0)));
      const effectFeedback = !!(effectAiming && effectAfter.observability && effectAiming.observability && effectAfter.observability.visibleFeedbackRevision > (effectAiming.observability.visibleFeedbackRevision || 0));

      const victoryPre = await game.ensureScenario('combat_victory_route_ready', (s) => s.phase === 'playing', 'victory presentation');
      const victory = await reachPresentationResultByContract(game, 12);
      const victoryFeedback = victory.result && victory.result.type === 'victory' && (victory.observability && victory.observability.resultRevision > (victoryPre.observability ? victoryPre.observability.resultRevision || 0 : 0));
      if (!headFeedback || !headState) return FAIL('headshot presentation was not coupled to state');
      if (!protectedState || !protectedFeedback) return FAIL('protected-head presentation was not coupled to block state');
      if (!collected || !powerFeedback || !effectState || !effectFeedback) return FAIL('power-up presentation was not coupled to effect state');
      if (!victoryFeedback) return FAIL('victory presentation was not coupled to result state');
      return PASS('presentation feedback is paired with gameplay state');
    }
  }
];

module.exports = { suite };
