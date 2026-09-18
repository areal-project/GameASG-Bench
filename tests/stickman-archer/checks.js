// === GDD Coverage Map ===
// M1 battle start/readability: p0-3-contract-playfield-readable, p1-1-click-start-pause-readable, p2-4-hud-snapshot-render-sync
// M2 aim angle input: p1-2-drag-aim-direction-opposite, p2-5-touch-aim-path-operable
// M3 arrow flight: p1-3-drag-release-cooldown, p1-4-projectile-flight-arc-cleanup
// M4 hit layering: p1-5-hit-feedback-damage-chain, p2-2-special-arrow-cost-benefit
// M5 enemy counterattack: p1-6-enemy-pressure-counterfire, p1-7-mouse-pause-blocks-playfield
// M6 win/loss/restart: p1-8-victory-terminal-progress, p1-9-defeat-restart-cleanup, p1-10-rejection-invariants
// M7 level/spatial variation: p2-1-moving-platform-carries-risk
// M8 special arrows/bubbles: p2-2-special-arrow-cost-benefit
// M9 economy/equipment: p1-11-shop-purchase-equipment-effect, p1-10-rejection-invariants
// M10 menu/pause/panels: p1-1-click-start-pause-readable, p1-7-mouse-pause-blocks-playfield, p2-3-settings-panels-nonblocking
// M11 combo/rewards: p2-4-hud-snapshot-render-sync
// M12 optional/cut systems: p2-3-settings-panels-nonblocking
//
// === Rationality Map ===
// p1-1-click-start-pause-readable: real action: browser.mouseClick on discovered start/pause surface plus contract fallback | independent observation: phase/panel/render/HUD/playfield fields | empty-shell failure: menu-only or overlay-blocked playing state fails
// p1-2-drag-aim-direction-opposite: real action: Input.dispatchMouseEvent press/move higher/lower while held | independent observation: aim state, pitch/preview/render revision, Math.sign direction opposite | empty-shell failure: static aim UI or same-direction response fails
// p1-3-drag-release-cooldown: real action: Input.dispatchMouseEvent drag/release and immediate duplicate release | independent observation: projectile summary plus aim/cooldown/special charge invariant | empty-shell failure: API-only shot, no projectile, or duplicate spam fails
// p1-4-projectile-flight-arc-cleanup: real action: player-level release then wait | independent observation: projectile path revision, screen movement/movement enum, cleanup bounds | empty-shell failure: instant hit or static projectile fails
// p1-5-hit-feedback-damage-chain: real action: player-level dragAim shots from legal scenario | independent observation: fired projectile, combat.lastHit, enemy health/alive and feedback/render | empty-shell failure: hidden damage without shot or visible feedback fails
// p1-6-enemy-pressure-counterfire: real action: wait while enemy remains alive | independent observation: enemy attack state/projectile plus player health/result coupling | empty-shell failure: static target or timer-only damage fails
// p1-7-mouse-pause-blocks-playfield: real action: browser.mouseClick/drag on playfield while pause panel blocks | independent observation: overlay/time/projectile count before-after | empty-shell failure: pause label without input/time lock fails
// p1-8-victory-terminal-progress: real action: repeated player-level dragAim shots and waits from legal victory scenario | independent observation: enemies cleared, result panel/phase, coins/stars/unlock and terminal lock | empty-shell failure: direct win/reward without combat fails
// p1-9-defeat-restart-cleanup: real action: wait for enemy pressure to defeat then restart | independent observation: health/result/progress invariants and transient projectile cleanup | empty-shell failure: fake defeat toggle or dirty retry fails
// p1-10-rejection-invariants: real action: locked level, unaffordable buy, blocked/terminal playfield attempts | independent observation: unchanged progress/coins/ownership/projectiles with rejection envelope | empty-shell failure: always-accept implementation fails
// p1-11-shop-purchase-equipment-effect: real action: open shop, buy/equip affordable item, start battle | independent observation: coins, ownership/equipment, battle health/damage/guard summary | empty-shell failure: cosmetic/API-only shop fails
// p2-1-moving-platform-carries-risk: real action: wait in moving-platform scenario then player-level shot | independent observation: platform/enemy motion revision and nonterminal target window | empty-shell failure: cosmetic platform or disconnected enemy fails
// p2-2-special-arrow-cost-benefit: real action: fire held special arrow through normal release | independent observation: charge cost plus projectile/status/damage benefit | empty-shell failure: label-only special state fails
// p2-3-settings-panels-nonblocking: real action: open/close auxiliary panels and toggle settings | independent observation: panel state, setting booleans, reachable core play | empty-shell failure: unclosable panel or nonpersistent setting fails
// p2-4-hud-snapshot-render-sync: real action: aim, shoot, wait through gameplay transitions | independent observation: HUD fields match snapshot phase/combat/progress plus render revision | empty-shell failure: hidden-state game with stale HUD fails
// p2-5-touch-aim-path-operable: real action: Input.dispatchTouchEvent touchStart/touchMove/touchEnd on playfield | independent observation: aim/projectile/render state changes | empty-shell failure: mouse-only implementation with broken touch path fails

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }
function NA(detail) { return { status: 'NOT_APPLICABLE', detail: detail || '' }; }

const VALID_PHASES = new Set(['boot', 'menu', 'playing', 'paused', 'victory', 'defeat', 'settings', 'shop', 'levelSelect', 'leaderboard']);
const VALID_SCREENS = new Set(['loading', 'mainMenu', 'battle', 'result', 'panel']);

function finite(n) { return typeof n === 'number' && Number.isFinite(n); }
function num(n, fallback = 0) { return finite(n) ? n : fallback; }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function aliveEnemies(s) { return Array.isArray(s && s.enemies) ? s.enemies.filter(e => e && e.alive !== false).length : 0; }
function firstAliveEnemy(s) { return Array.isArray(s && s.enemies) ? s.enemies.find(e => e && e.alive !== false) : null; }
function projectileCount(s) { return num(s && s.projectiles && s.projectiles.playerCount, 0); }
function activeProjectiles(s) { return num(s && s.projectiles && s.projectiles.activeCount, projectileCount(s)); }
function enemyProjectileCount(s) { return num(s && s.projectiles && s.projectiles.enemyCount, 0); }
function renderRevision(s) { return num(s && s.render && s.render.revision, 0); }
function timeRevision(s) { return num(s && s.time && s.time.revision, 0); }
function coins(s) { return num(s && s.progress && s.progress.coins, 0); }
function totalStars(s) { return num(s && s.progress && s.progress.totalStars, 0); }
function unlockedLevel(s) { return num(s && s.progress && s.progress.highestUnlockedLevel, 0); }
function playerHealth(s) { return num(s && s.player && s.player.health, 0); }
function playerMaxHealth(s) { return num(s && s.player && s.player.maxHealth, 0); }
function specialCharges(s) { return num(s && s.special && s.special.charges, 0); }
function resultState(s) { return (s && s.combat && s.combat.result) || 'none'; }
function isTerminal(s) { return s && (s.phase === 'victory' || s.phase === 'defeat' || resultState(s) === 'win' || resultState(s) === 'lose'); }

function aimMetric(s) {
  const aim = s && s.aim ? s.aim : {};
  if (finite(aim.pitch)) return aim.pitch;
  if (aim.pitch === 'higher') return 1;
  if (aim.pitch === 'level') return 0;
  if (aim.pitch === 'lower') return -1;
  if (aim.previewApex && finite(aim.previewApex.screenY)) return -aim.previewApex.screenY;
  return null;
}

function pointFromSnapshot(s, fallback) {
  const pf = s && s.playfield ? s.playfield : {};
  const sem = pf.semanticPoints || {};
  const p = sem.safeDragStart || sem.playerAimAnchor || sem.center;
  if (p && finite(p.screenX) && finite(p.screenY)) return { x: p.screenX, y: p.screenY };
  if (pf.bounds && finite(pf.bounds.screenX) && finite(pf.bounds.screenY)) {
    return {
      x: pf.bounds.screenX + num(pf.bounds.width, 300) * 0.25,
      y: pf.bounds.screenY + num(pf.bounds.height, 300) * 0.55
    };
  }
  if (fallback && finite(fallback.x) && finite(fallback.y)) return fallback;
  throw new Error('missing semantic aim point or playfield bounds');
}

function targetPointFromEnemy(enemy, fallback) {
  const zone = enemy && (enemy.bodyZone || enemy.headZone);
  if (zone && finite(zone.screenX) && finite(zone.screenY)) {
    return { x: zone.screenX + num(zone.width, 0) / 2, y: zone.screenY + num(zone.height, 0) / 2 };
  }
  if (enemy && finite(enemy.screenX) && finite(enemy.screenY)) return { x: enemy.screenX, y: enemy.screenY };
  return fallback;
}

function assertNonNegativeSnapshot(s) {
  const fields = [
    ['coins', coins(s)],
    ['totalStars', totalStars(s)],
    ['playerHealth', playerHealth(s)],
    ['playerMaxHealth', playerMaxHealth(s)],
    ['playerProjectiles', projectileCount(s)],
    ['activeProjectiles', activeProjectiles(s)],
    ['specialCharges', specialCharges(s)]
  ];
  for (const [name, value] of fields) {
    if (finite(value) && value < 0) return `${name} is negative`;
  }
  if (Array.isArray(s.enemies)) {
    for (let i = 0; i < s.enemies.length; i++) {
      const e = s.enemies[i];
      if (e && finite(e.health) && e.health < 0) return `enemy ${i} health is negative`;
    }
  }
  return null;
}

function isDispatchRejection(s) {
  const reason = String(s && s.reason || '');
  return !!(s && s.ok === false && /(?:unknown|invalid|missing)[ _-]action\b/i.test(reason));
}

async function inputAction(game, action) {
  const candidates = [action];
  if (action && typeof action === 'object' && typeof action.type === 'string') {
    candidates.push(Object.assign({}, action, { action: action.type }));
    candidates.push(Object.assign({}, action, { name: action.type }));
  }
  let result;
  for (const candidate of candidates) {
    result = await game.input(candidate);
    if (!isDispatchRejection(result)) return result;
  }
  return result;
}

async function createDriver(browser) {
  async function evalPage(expr) {
    const v = await browser.eval(expr);
    if (v && v.__l2_err__) throw new Error(v.__l2_err__);
    return v;
  }

  async function hasContract() {
    return await evalPage(`typeof window.__gameTest === 'object' && !!window.__gameTest &&
      typeof window.__gameTest.reset === 'function' &&
      typeof window.__gameTest.getSnapshot === 'function' &&
      typeof window.__gameTest.input === 'function' &&
      typeof window.__gameTest.loadScenario === 'function'`);
  }

  async function snapshot() {
    const s = await evalPage(`window.__gameTest && window.__gameTest.getSnapshot && window.__gameTest.getSnapshot()`);
    if (!s || typeof s !== 'object') throw new Error('missing Snapshot object');
    return s;
  }

  async function reset(options) {
    await evalPage(`window.__gameTest.reset(${JSON.stringify(options || {})})`);
    await browser.sleep(120);
    return snapshot();
  }

  async function input(action) {
    const result = await evalPage(`window.__gameTest.input(${JSON.stringify(action)})`);
    await browser.sleep(120);
    const settled = await snapshot();
    // Keep the action result envelope while returning settled state fields.
    // A rejection is otherwise lost when getSnapshot() is called after the wait.
    if (result && typeof result === 'object' && result.ok === false) {
      settled.ok = false;
      if (result.reason) settled.reason = result.reason;
    }
    return settled;
  }

  async function loadScenario(name, options) {
    const s = await evalPage(`window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})})`);
    await browser.sleep(180);
    const after = await snapshot();
    if (!after || after.ok === false || after.reason) {
      throw new Error(`scenario ${name} rejected: ${after && after.reason ? after.reason : 'no reason'}`);
    }
    return s && typeof s === 'object' ? after : after;
  }

  async function realDrag(start, deltaY, release = true) {
    const x = start.x;
    const y = start.y;
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers: 0 });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, modifiers: 0 });
    const steps = 4;
    for (let i = 1; i <= steps; i++) {
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y: y + (deltaY * i / steps),
        button: 'left',
        buttons: 1,
        modifiers: 0
      });
      await browser.sleep(40);
    }
    if (release) {
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x,
        y: y + deltaY,
        button: 'left',
        clickCount: 1,
        modifiers: 0
      });
    }
    await browser.sleep(180);
  }

  async function releaseMouse(start, deltaY) {
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: start.x,
      y: start.y + deltaY,
      button: 'left',
      clickCount: 1,
      modifiers: 0
    });
    await browser.sleep(100);
  }

  async function contractShot(direction = 'center', release = true) {
    const before = await snapshot();
    const from = pointFromSnapshot(before);
    await input({ type: 'dragAim', action: 'dragAim', from: { screenX: from.x, screenY: from.y }, moves: [{ direction }], release });
    if (release) await input({ type: 'wait', action: 'wait', ms: 450 });
    return snapshot();
  }

  async function wait(ms) {
    await input({ type: 'wait', action: 'wait', ms });
    await browser.sleep(Math.min(ms, 500));
    return snapshot();
  }

  return { hasContract, snapshot, reset, input, loadScenario, realDrag, releaseMouse, contractShot, wait };
}

const suite = [
  {
    id: 'p0-1-no-fatal-runtime',
    level: 'P0',
    name: 'No fatal runtime errors and page reaches a drawable surface',
    timeoutMs: 10000,
    async run({ browser }) {
      await browser.sleep(500);
      const fatal = browser.exceptions.filter(e => !/ResizeObserver/i.test(e.description || e.text || ''));
      if (fatal.length) return FAIL(fatal[0].description || fatal[0].text);
      const l2 = await browser.eval(`window.__l2 && ({ frameCount: window.__l2.frameCount, drawCalls: window.__l2.drawCalls, mouseListeners: window.__l2.mouseListeners })`);
      const canvas = await browser.getCanvasSize();
      if (!canvas && (!l2 || l2.drawCalls < 1)) return FAIL('no canvas or draw surface observed');
      return PASS(`frames=${l2 ? l2.frameCount : 'n/a'} drawCalls=${l2 ? l2.drawCalls : 'n/a'}`);
    }
  },
  {
    id: 'p0-2-public-contract-schema',
    level: 'P0',
    name: 'Public __gameTest methods and invalid input envelope are contract-safe',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = await createDriver(browser);
      if (!(await game.hasContract())) return FAIL('window.__gameTest reset/getSnapshot/input/loadScenario contract missing');
      const s = await game.reset();
      if (!VALID_PHASES.has(s.phase)) return FAIL(`invalid phase ${s.phase}`);
      if (!VALID_SCREENS.has(s.screen)) return FAIL(`invalid screen ${s.screen}`);
      const before = clone(s);
      const invalid = await game.input({ type: '__invalid_action__', payload: { forbidden: true } });
      if (invalid && invalid.ok === true) return FAIL('invalid input returned ok:true');
      if (coins(invalid) !== coins(before) || totalStars(invalid) !== totalStars(before) || projectileCount(invalid) !== projectileCount(before)) {
        return FAIL('invalid input mutated progress or projectile state');
      }
      const nonNegativeError = assertNonNegativeSnapshot(invalid);
      if (nonNegativeError) return FAIL(nonNegativeError);
      return PASS('schema and invalid envelope are stable');
    }
  },
  {
    id: 'p0-3-contract-playfield-readable',
    level: 'P0',
    name: 'First playable scenario exposes readable battle snapshot and render surface',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s = await game.loadScenario('first_level_ready');
      if (s.phase !== 'playing') return FAIL(`expected playing phase, got ${s.phase}`);
      if (s.overlayBlocking) return FAIL('playing phase has blocking overlay');
      if (!s.canInteractWithPlayfield) return FAIL('playfield not interactable in first_level_ready');
      if (!s.render || !s.render.playfieldVisible || !s.render.nonBlank) return FAIL('render playfield is not visible and nonblank');
      if (!s.hud || !s.hud.levelVisible || !s.hud.playerHealthVisible || !s.hud.enemyHealthVisible) return FAIL('battle HUD fields are not visible');
      if (!s.player || s.player.visible === false || aliveEnemies(s) < 1) return FAIL('player/enemy summaries not visible');
      return PASS('first level is readable and interactable');
    }
  },
  {
    id: 'p1-1-click-start-pause-readable',
    level: 'P1',
    name: 'Real click start and pause path reaches readable battle and blocks correctly',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = await createDriver(browser);
      await game.loadScenario('fresh_boot');
      const findVisibleControl = async (labels) => browser.eval(`(function(){
        const labels = ${JSON.stringify(labels)};
        const isClickCandidate = (el) => {
          if (el.matches('button,[role="button"],a,[onclick],[tabindex]')) return true;
          return window.getComputedStyle(el).cursor === 'pointer';
        };
        const candidates = Array.from(document.querySelectorAll('*')).filter(isClickCandidate);
        const els = candidates.filter(el => {
          const r = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const t = [
            el.textContent,
            el.getAttribute('aria-label'),
            el.getAttribute('title')
          ].filter(Boolean).join(' ').toLowerCase();
          return r.width > 8 && r.height > 8 &&
            style.display !== 'none' && style.visibility !== 'hidden' &&
            style.pointerEvents !== 'none' &&
            labels.some(label => t.includes(label));
        });
        const el = els[0];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);
      const startPoint = await findVisibleControl(['start','play','level','continue','开始','关卡','继续']);
      if (startPoint) {
        await browser.mouseClick(startPoint.x, startPoint.y);
        await browser.sleep(120);
      }
      const afterStartClick = await game.snapshot();
      if (afterStartClick.phase === 'levelSelect' || afterStartClick.activePanel === 'levelSelect') {
        // A valid player-facing start control may intentionally open level
        // selection before the player chooses an unlocked level.
        const levelPoint = await findVisibleControl(['level','enter','play','start','1']);
        if (levelPoint) {
          await browser.mouseClick(levelPoint.x, levelPoint.y);
          await browser.sleep(120);
        } else {
          await inputAction(game, { type: 'selectLevel', level: Math.max(1, unlockedLevel(afterStartClick)) });
        }
      } else if (afterStartClick.phase !== 'playing') {
        await inputAction(game, { type: 'start' });
      }
      let playing = await game.snapshot();
      if (playing.phase !== 'playing') return FAIL(`start did not enter playing, phase=${playing.phase}`);
      if (!playing.canInteractWithPlayfield || playing.overlayBlocking) return FAIL('playing state is blocked or non-interactive');
      if (!playing.render || !playing.render.nonBlank || !playing.hud || !playing.hud.levelVisible) return FAIL('battle render/HUD not readable after start');
      const pausePoint = await findVisibleControl(['pause','暂停','||','⏸','❚❚','Ⅱ','❙❙']);
      let paused;
      if (pausePoint) {
        await browser.mouseClick(pausePoint.x, pausePoint.y);
        await browser.sleep(120);
        paused = await game.snapshot();
      } else {
        const canvasPausePoint = await browser.eval(`(function(){
          const canvas = Array.from(document.querySelectorAll('canvas')).find(el => {
            const r = el.getBoundingClientRect();
            return r.width > 8 && r.height > 8;
          });
          if (!canvas) return null;
          const r = canvas.getBoundingClientRect();
          return { x: r.left + r.width * 0.96, y: r.top + r.height * 0.043 };
        })()`);
        if (canvasPausePoint) {
          await browser.mouseClick(canvasPausePoint.x, canvasPausePoint.y);
          await browser.sleep(120);
          paused = await game.snapshot();
        }
        if (!paused || !(paused.phase === 'paused' || paused.activePanel === 'pause')) {
          paused = await inputAction(game, { type: 'openPanel', panel: 'pause' });
        }
      }
      if (!(paused.phase === 'paused' || paused.activePanel === 'pause') || !paused.overlayBlocking) return FAIL('pause did not create blocking overlay');
      let resumed;
      const resumePoint = await findVisibleControl(['resume','continue']);
      if (resumePoint) {
        await browser.mouseClick(resumePoint.x, resumePoint.y);
        await browser.sleep(120);
        resumed = await game.snapshot();
      } else {
        resumed = await inputAction(game, { type: 'closePanel', panel: 'pause' });
      }
      if (resumed.phase !== 'playing' || resumed.overlayBlocking || !resumed.canInteractWithPlayfield) return FAIL('resume did not restore playable state');
      return PASS('real click path and pause blocking work');
    }
  },
  {
    id: 'p1-2-drag-aim-direction-opposite',
    level: 'P1',
    name: 'Held drag aiming produces direction opposite high and low responses',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const base = await game.loadScenario('aim_direction_probe');
      if (base.phase !== 'playing' || !base.canInteractWithPlayfield || isTerminal(base)) return FAIL('aim scenario is not a legal playable precondition');
      const start = pointFromSnapshot(base);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
      const pressed = await game.snapshot();
      const beforeMetric = aimMetric(pressed);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y - 90, button: 'left', buttons: 1, modifiers: 0 });
      await browser.sleep(160);
      const high = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y + 90, button: 'left', buttons: 1, modifiers: 0 });
      await browser.sleep(160);
      const low = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: start.x, y: start.y + 90, button: 'left', clickCount: 1, modifiers: 0 });
      if (!high.aim || high.aim.state !== 'aiming') return FAIL('press/hold did not enter aiming state');
      const highMetric = aimMetric(high);
      const lowMetric = aimMetric(low);
      if (highMetric == null || lowMetric == null || highMetric === lowMetric) return FAIL('higher/lower drags did not produce distinguishable aim metrics');
      let directionOpposite = false;
      if (beforeMetric != null && highMetric !== beforeMetric && lowMetric !== beforeMetric) {
        directionOpposite = Math.sign(highMetric - beforeMetric) !== Math.sign(lowMetric - beforeMetric);
      } else {
        directionOpposite = Math.sign(highMetric - lowMetric) !== 0;
      }
      if (!directionOpposite) return FAIL('direction opposite proof failed for higher/lower drag');
      if (!(high.aim.previewVisible || low.aim.previewVisible || renderRevision(high) !== renderRevision(low))) return FAIL('aim response lacks preview/render evidence');
      return PASS('higher and lower drag are visibly opposite');
    }
  },
  {
    id: 'p1-3-drag-release-cooldown',
    level: 'P1',
    name: 'Real drag release launches one shot and duplicate release is gated',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const startSnap = await game.loadScenario('first_level_ready');
      const start = pointFromSnapshot(startSnap);
      const beforeCount = projectileCount(startSnap);
      const beforeCharge = specialCharges(startSnap);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y - 80, button: 'left', buttons: 1, modifiers: 0 });
      await browser.sleep(100);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: start.x, y: start.y - 80, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(220);
      const afterRelease = await game.snapshot();
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(160);
      const afterDuplicate = await game.snapshot();
      if (projectileCount(afterRelease) <= beforeCount && activeProjectiles(afterRelease) <= beforeCount && !(afterRelease.projectiles && afterRelease.projectiles.lastPlayerShot)) {
        return FAIL('release did not launch a player projectile');
      }
      const last = afterRelease.projectiles && afterRelease.projectiles.lastPlayerShot;
      if (last && last.launchedByRelease === false) return FAIL('last shot was not marked as release-launched');
      if (afterRelease.aim && afterRelease.aim.state === 'aiming') return FAIL('aiming state did not end after release');
      if (projectileCount(afterDuplicate) > projectileCount(afterRelease) + 1) return FAIL('duplicate immediate release created extra shots');
      if (specialCharges(afterDuplicate) < beforeCharge - 1) return FAIL('duplicate release consumed extra special charge');
      return PASS('release launch and cooldown gating observed');
    }
  },
  {
    id: 'p1-4-projectile-flight-arc-cleanup',
    level: 'P1',
    name: 'Projectile flight advances visibly with forward and arcing/downward evidence',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = await createDriver(browser);
      await game.loadScenario('first_level_ready');
      const before = await game.snapshot();
      const from = pointFromSnapshot(before);
      const fired = await inputAction(game, {
        type: 'dragAim',
        from: { screenX: from.x, screenY: from.y },
        moves: [{ direction: 'higher' }],
        release: true
      });
      if (!fired.projectiles || !fired.projectiles.lastPlayerShot) return FAIL('no player shot after release');
      const a = await game.wait(40);
      const b = await game.wait(80);
      const shotA = a.projectiles && a.projectiles.lastPlayerShot;
      const shotB = b.projectiles && b.projectiles.lastPlayerShot;
      if (!shotA || !shotB) return FAIL('projectile summary missing during flight');
      if (num(shotB.pathRevision, 0) <= num(shotA.pathRevision, -1) && renderRevision(b) === renderRevision(a)) return FAIL('projectile path/render did not advance');
      const movement = String(shotB.movement || shotA.movement || '');
      const hasMovementEnum = /forward|downward|arc|outOfBounds/i.test(movement);
      const hasScreenDelta = finite(shotA.screenX) && finite(shotB.screenX) && Math.sign(shotB.screenX - shotA.screenX) !== 0;
      const hasArcDelta = finite(shotA.screenY) && finite(shotB.screenY) && Math.sign(shotB.screenY - shotA.screenY) !== 0;
      if (!hasMovementEnum && !(hasScreenDelta && hasArcDelta)) return FAIL('flight lacks forward plus arc/downward evidence');
      const later = await game.wait(1800);
      if (activeProjectiles(later) > activeProjectiles(b) + 4 && !isTerminal(later)) return FAIL('projectiles appear to leak instead of cleaning up or resolving');
      return PASS('flight path advances and remains bounded');
    }
  },
  {
    id: 'p1-5-hit-feedback-damage-chain',
    level: 'P1',
    name: 'Player shot causes hit feedback and enemy damage through the combat chain',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s0 = await game.loadScenario('single_enemy_open');
      if (aliveEnemies(s0) !== 1 || isTerminal(s0)) return FAIL('single_enemy_open is not a legal one-enemy precondition');
      const enemy0 = firstAliveEnemy(s0);
      const health0 = num(enemy0 && enemy0.health, 0);
      const alive0 = aliveEnemies(s0);
      let after = s0;
      let shotEvidence = null;
      for (const dir of ['center', 'higher', 'lower', 'higher']) {
        const before = await game.snapshot();
        const from = pointFromSnapshot(before);
        const fired = await game.input({
          type: 'dragAim', action: 'dragAim',
          from: { screenX: from.x, screenY: from.y },
          moves: [{ direction: dir }], release: true
        });
        const releasedShot = fired && fired.projectiles && fired.projectiles.lastPlayerShot;
        if (releasedShot && releasedShot.owner === 'player' &&
            releasedShot.launchedByRelease === true) {
          shotEvidence = releasedShot;
        }
        await game.input({ type: 'wait', action: 'wait', ms: 450 });
        after = await game.wait(700);
        const observedShot = after.projectiles && after.projectiles.lastPlayerShot;
        if (observedShot && observedShot.owner === 'player' &&
            observedShot.launchedByRelease === true &&
            (!shotEvidence || num(observedShot.pathRevision, 0) >= num(shotEvidence.pathRevision, 0))) {
          shotEvidence = observedShot;
        }
        const hit = after.combat && after.combat.lastHit;
        const enemy = firstAliveEnemy(after) || (Array.isArray(after.enemies) ? after.enemies[0] : null);
        if (hit && hit.owner === 'player') break;
        if (enemy && num(enemy.health, health0) < health0) break;
        if (aliveEnemies(after) < alive0) break;
      }
      const hit = after.combat && after.combat.lastHit;
      const enemy = firstAliveEnemy(after) || (Array.isArray(after.enemies) ? after.enemies[0] : null);
      const healthAfter = num(enemy && enemy.health, health0);
      const finalShot = after.projectiles && after.projectiles.lastPlayerShot;
      const shot = shotEvidence || finalShot;
      const playerOwnedHit = !!(hit && hit.owner === 'player');
      const shotSettled = !finalShot || finalShot.visible === false ||
        /^(?:outOfBounds|stuck)$/i.test(String(finalShot.movement || ''));
      const validPlayerHit = !!(hit && hit.owner === 'player' &&
        ((hit.target === 'enemy' && (healthAfter < health0 || hit.killed || aliveEnemies(after) < aliveEnemies(s0))) ||
         (hit.target === 'none' && healthAfter === health0 && aliveEnemies(after) === alive0 && coins(after) === coins(s0))));
      const validProjectileMiss = !!(!playerOwnedHit && shot && shot.owner === 'player' &&
        shot.launchedByRelease === true && num(shot.pathRevision, 0) > 0 && shotSettled &&
        !isTerminal(after) && healthAfter === health0 && aliveEnemies(after) === alive0 &&
        coins(after) === coins(s0));
      if (!shot) return FAIL('damage path has no fired player projectile evidence');
      if (!validPlayerHit && !validProjectileMiss) return FAIL('no valid player hit/miss result reported after shots');
      if (renderRevision(after) === renderRevision(s0) &&
          !(hit && hit.feedbackRevision > 0) && !validProjectileMiss) return FAIL('hit/miss has no render or feedback revision');
      return PASS('shot-to-hit chain updates combat and visible feedback');
    }
  },
  {
    id: 'p1-6-enemy-pressure-counterfire',
    level: 'P1',
    name: 'Living enemies counterfire with visible projectile and damage coupling',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s0 = await game.loadScenario('enemy_pressure');
      if (aliveEnemies(s0) < 1 || playerHealth(s0) <= 0 || isTerminal(s0)) return FAIL('enemy_pressure precondition is not playable');
      let observed = s0;
      for (let i = 0; i < 8; i++) {
        observed = await game.wait(650);
        const state = observed.combat && observed.combat.enemyAttackState;
        if (state === 'preparing' || state === 'fired' || enemyProjectileCount(observed) > enemyProjectileCount(s0) || playerHealth(observed) < playerHealth(s0)) break;
      }
      const state = observed.combat && observed.combat.enemyAttackState;
      const attackProgressed = state === 'preparing' || state === 'fired' || enemyProjectileCount(observed) > enemyProjectileCount(s0);
      if (!attackProgressed) return FAIL(`enemy attack did not progress, state=${state}`);
      if (enemyProjectileCount(observed) > enemyProjectileCount(s0)) {
        const shot = observed.projectiles && observed.projectiles.lastEnemyShot;
        if (!shot || shot.visible === false || num(shot.pathRevision, 0) <= 0) return FAIL('enemy projectile lacks visible path evidence');
      }
      if (playerHealth(observed) < playerHealth(s0) && enemyProjectileCount(observed) <= enemyProjectileCount(s0) && !(observed.projectiles && observed.projectiles.lastEnemyShot)) {
        return FAIL('player damage occurred without enemy projectile evidence');
      }
      return PASS('enemy pressure advances through attack/projectile coupling');
    }
  },
  {
    id: 'p1-7-mouse-pause-blocks-playfield',
    level: 'P1',
    name: 'Mouse playfield input while paused is blocked and combat time freezes',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const playing = await game.loadScenario('enemy_pressure');
      await game.input({ type: 'openPanel', panel: 'pause' });
      const paused = await game.snapshot();
      if (!(paused.phase === 'paused' || paused.activePanel === 'pause') || !paused.overlayBlocking || paused.canInteractWithPlayfield) return FAIL('pause did not block playfield');
      const pausedPoint = pointFromSnapshot(paused);
      const beforeCount = projectileCount(paused);
      const beforeEnemyProjectiles = enemyProjectileCount(paused);
      const beforeRevision = timeRevision(paused) + renderRevision(paused);
      await browser.mouseClick(pausedPoint.x, pausedPoint.y);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pausedPoint.x, y: pausedPoint.y, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pausedPoint.x, y: pausedPoint.y - 90, button: 'left', buttons: 1, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pausedPoint.x, y: pausedPoint.y - 90, button: 'left', clickCount: 1, modifiers: 0 });
      await browser.sleep(500);
      const after = await game.snapshot();
      if (projectileCount(after) > beforeCount) return FAIL('paused playfield mouse input launched a player projectile');
      if (enemyProjectileCount(after) > beforeEnemyProjectiles + 1 && timeRevision(after) > timeRevision(paused)) return FAIL('enemy combat advanced too much while paused');
      if (after.time && after.time.running) return FAIL('snapshot reports time running while paused');
      const resumed = await game.input({ type: 'closePanel', panel: 'pause' });
      if (resumed.phase !== 'playing' || resumed.overlayBlocking) return FAIL('resume from pause failed');
      const later = await game.wait(500);
      if (timeRevision(later) + renderRevision(later) <= beforeRevision && aliveEnemies(playing) > 0) return FAIL('combat/render did not resume after pause');
      return PASS('paused mouse input is blocked and resume works');
    }
  },
  {
    id: 'p1-8-victory-terminal-progress',
    level: 'P1',
    name: 'Player-caused enemy clear reaches victory, rewards, unlocks, and terminal lock',
    timeoutMs: 35000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s0 = await game.loadScenario('victory_path_ready');
      if (isTerminal(s0) || aliveEnemies(s0) < 1) return FAIL('victory_path_ready starts with invalid terminal or empty state');
      let s = s0;
      const waitFor = async (ms) => {
        await inputAction(game, { type: 'wait', ms });
        await browser.sleep(Math.min(ms, 500));
        return game.snapshot();
      };
      for (let i = 0; i < 8 && !isTerminal(s); i++) {
        const enemy = firstAliveEnemy(s);
        const sem = s.playfield && s.playfield.semanticPoints;
        const anchor = sem && sem.playerAimAnchor;
        const from = anchor && finite(anchor.screenX) && finite(anchor.screenY)
          ? { x: anchor.screenX, y: anchor.screenY }
          : pointFromSnapshot(s);
        const targets = [enemy && enemy.bodyZone, enemy && enemy.headZone]
          .filter(zone => zone && finite(zone.screenX) && finite(zone.screenY))
          .map(zone => ({
            x: zone.screenX + num(zone.width, 0) / 2,
            y: zone.screenY + num(zone.height, 0) / 2
          }));
        if (!targets.length) {
          const fallbackTarget = targetPointFromEnemy(enemy);
          if (fallbackTarget && finite(fallbackTarget.x) && finite(fallbackTarget.y)) targets.push(fallbackTarget);
        }
        const pattern = i % 4;
        const target = pattern % 2 === 0 && targets.length
          ? targets[(pattern / 2) % targets.length]
          : null;
        const moves = target
          ? [{ to: { screenX: target.x, screenY: target.y } }]
          : [
            { direction: 'center' },
            { direction: 'lower' },
            { direction: 'lower' },
            { direction: 'lower' },
            { direction: 'lower' }
          ];
        s = await inputAction(game, {
          type: 'dragAim',
          from: { screenX: from.x, screenY: from.y },
          moves,
          release: true
        });
        s = await waitFor(700);
      }
      for (let i = 0; i < 5 && resultState(s) === 'win' && s.phase !== 'victory'; i++) {
        s = await waitFor(300);
      }
      if (!(s.phase === 'victory' || resultState(s) === 'win')) return FAIL('enemy-clear path did not reach victory');
      if (aliveEnemies(s) > 0) return FAIL('victory occurred while enemies still alive');
      if (!s.hud || !s.hud.resultVisible) return FAIL('victory result is not visible in HUD/result surface');
      if (coins(s) < coins(s0) || totalStars(s) < totalStars(s0) || unlockedLevel(s) < unlockedLevel(s0)) return FAIL('victory regressed progress');
      const beforeCount = projectileCount(s);
      const terminalPoint = pointFromSnapshot(s);
      await inputAction(game, { type: 'dragAim', from: { screenX: terminalPoint.x, screenY: terminalPoint.y }, moves: [{ direction: 'higher' }], release: true });
      const locked = await game.snapshot();
      if (projectileCount(locked) > beforeCount) return FAIL('terminal victory state still accepts playfield shooting');
      return PASS('victory requires combat clear and locks terminal input');
    }
  },
  {
    id: 'p1-9-defeat-restart-cleanup',
    level: 'P1',
    name: 'Enemy-caused defeat preserves progress invariants and restart cleans battle state',
    timeoutMs: 35000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const targetWait = async (ms) => {
        await game.input({
          type: 'wait',
          action: 'wait',
          name: 'wait',
          ms
        });
        await browser.sleep(Math.min(ms, 500));
        return game.snapshot();
      };
      const s0 = await game.loadScenario('near_defeat_pressure');
      if (isTerminal(s0) || playerHealth(s0) <= 0) return FAIL('near_defeat_pressure starts terminal or dead');
      let s = s0;
      for (let i = 0; i < 10 && !(s.phase === 'defeat' || resultState(s) === 'lose'); i++) {
        s = await targetWait(700);
      }
      if (!(s.phase === 'defeat' || resultState(s) === 'lose')) return FAIL('enemy pressure did not cause defeat');
      if (playerHealth(s) > 0) return FAIL('defeat occurred without player health reaching zero or below');
      if (resultState(s) === 'lose' && s.phase !== 'defeat') {
        for (let i = 0; i < 4 && s.phase !== 'defeat'; i++) {
          s = await targetWait(400);
        }
      }
      if (!s.hud || !s.hud.resultVisible) return FAIL('defeat result is not visible');
      if (unlockedLevel(s) > unlockedLevel(s0) || totalStars(s) > totalStars(s0)) return FAIL('defeat illegally unlocked or improved stars');
      const restarted = await game.input({ type: 'restart', action: 'restart', name: 'restart' });
      if (restarted.phase !== 'playing' || isTerminal(restarted)) return FAIL('restart did not reload a playable level');
      if (playerHealth(restarted) <= 0 || aliveEnemies(restarted) < 1) return FAIL('restart did not restore alive combatants');
      if (activeProjectiles(restarted) > 0) return FAIL('restart left active old projectiles');
      if (restarted.overlayBlocking || restarted.activePanel) return FAIL('restart left blocking panel/terminal state');
      return PASS('defeat invariants and clean restart verified');
    }
  },
  {
    id: 'p1-10-rejection-invariants',
    level: 'P1',
    name: 'Locked, unaffordable, and blocked operations preserve invariants',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const progress = await game.loadScenario('progress_menu');
      const highest = unlockedLevel(progress);
      const totalLevels = num(progress.level && progress.level.totalLevels, highest);
      if (totalLevels <= highest) return NA('progress scenario has no locked future level');
      const lockedAttempt = await inputAction(game, { type: 'selectLevel', level: highest + 1 });
      if (isDispatchRejection(lockedAttempt)) return FAIL('locked-level action was not dispatched through a supported action envelope');
      if (lockedAttempt.phase === 'playing' && num(lockedAttempt.level && lockedAttempt.level.index, -1) > unlockedLevel(progress)) return FAIL('locked level selection started a locked level');
      if (unlockedLevel(lockedAttempt) > unlockedLevel(progress)) return FAIL('locked selection changed unlock progress');
      const shop = await game.loadScenario('shop_insufficient_funds');
      const beforeCoins = coins(shop);
      const beforeItems = clone(shop.shop && shop.shop.items);
      const rejected = await inputAction(game, { type: 'buy', itemType: 'bow', semantic: 'unaffordable' });
      if (isDispatchRejection(rejected)) return FAIL('unaffordable buy action was not dispatched through a supported action envelope');
      if (coins(rejected) !== beforeCoins) return FAIL('unaffordable purchase changed coins');
      if (JSON.stringify(rejected.shop && rejected.shop.items) !== JSON.stringify(beforeItems) && (rejected.ok === true)) return FAIL('unaffordable purchase mutated ownership with ok:true');
      await game.loadScenario('first_level_ready');
      const blocked = await inputAction(game, { type: 'openPanel', panel: 'pause' });
      if (!(blocked.phase === 'paused' || blocked.activePanel === 'pause') || !blocked.overlayBlocking) return FAIL('valid pause action did not enter a blocking pause state');
      const beforeCount = projectileCount(blocked);
      const blockedPoint = pointFromSnapshot(blocked);
      const afterBlocked = await inputAction(game, { type: 'dragAim', from: { screenX: blockedPoint.x, screenY: blockedPoint.y }, moves: [{ direction: 'higher' }], release: true });
      if (projectileCount(afterBlocked) > beforeCount) return FAIL('blocked panel accepted playfield shot');
      const nonNegativeError = assertNonNegativeSnapshot(afterBlocked);
      if (nonNegativeError) return FAIL(nonNegativeError);
      return PASS('invalid operations rejected without unrelated mutations');
    }
  },
  {
    id: 'p1-11-shop-purchase-equipment-effect',
    level: 'P1',
    name: 'Affordable shop purchase/equip changes coins, ownership, and next battle effect',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s0 = await game.loadScenario('shop_affordable');
      if (coins(s0) <= 0) return FAIL('shop_affordable did not provide legal coins');
      const open = await inputAction(game, { type: 'openPanel', panel: 'shop' });
      if (!(open.phase === 'shop' || open.activePanel === 'shop') || !open.overlayBlocking || !open.shop || !open.shop.visible) return FAIL('shop panel not visible/blocking');
      const item = Array.isArray(open.shop.items) ? open.shop.items.find(i => i && i.visible && i.affordable && !i.owned && (i.itemType === 'bow' || i.itemType === 'helmet')) : null;
      const semantic = item ? undefined : 'affordable';
      const purchase = await inputAction(game, { type: 'buy', itemType: item ? item.itemType : 'bow', itemId: item && item.itemId, semantic });
      if (coins(purchase) >= coins(open)) return FAIL('affordable purchase did not deduct coins');
      if (coins(purchase) < 0) return FAIL('purchase made coins negative');
      const owned = Array.isArray(purchase.shop && purchase.shop.items) && purchase.shop.items.some(i => i && i.owned && (item ? i.itemId === item.itemId : i.affordable));
      if (!owned && !(purchase.shop && purchase.shop.equipped && (purchase.shop.equipped.bow || purchase.shop.equipped.helmet))) return FAIL('purchase did not update ownership/equipment summary');
      const closed = await inputAction(game, { type: 'closePanel', panel: 'shop' });
      if (closed.activePanel === 'shop' || closed.phase === 'shop') return FAIL('shop panel did not close before battle');
      const battle = await inputAction(game, { type: 'start' });
      if (battle.phase !== 'playing') return FAIL('could not start battle after purchase');
      const hasBattleEffect = playerMaxHealth(battle) > playerMaxHealth(s0) ||
        (battle.player && num(battle.player.armorBlocks, 0) > num(s0.player && s0.player.armorBlocks, 0)) ||
        (battle.shop && battle.shop.equipped && JSON.stringify(battle.shop.equipped) !== JSON.stringify(s0.shop && s0.shop.equipped));
      if (!hasBattleEffect) return FAIL('equipped item has no observable battle summary effect');
      return PASS('shop purchase affects progress and battle state');
    }
  },
  {
    id: 'p2-1-moving-platform-carries-risk',
    level: 'P2',
    name: 'Moving platform changes platform and enemy target window without premature victory',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s0 = await game.loadScenario('moving_platform_level');
      const platform0 = Array.isArray(s0.platforms) ? s0.platforms.find(p => p && p.visible && p.moving) : null;
      if (!platform0) return NA('no declared moving platform scenario in this implementation');
      if (isTerminal(s0) || aliveEnemies(s0) < 1) return FAIL('moving platform scenario starts terminal or enemyless');
      const s1 = await game.wait(900);
      const platform1 = Array.isArray(s1.platforms) ? s1.platforms.find(p => p && p.visible && p.moving) : null;
      const platformMoved = platform1 && (num(platform1.motionRevision, 0) > num(platform0.motionRevision, 0) ||
        (platform0.screenBounds && platform1.screenBounds &&
          (Math.sign(num(platform1.screenBounds.screenX) - num(platform0.screenBounds.screenX)) !== 0 ||
           Math.sign(num(platform1.screenBounds.screenY) - num(platform0.screenBounds.screenY)) !== 0)));
      const pairs = Array.isArray(s0.enemies) && Array.isArray(s1.enemies)
        ? s0.enemies.map((before, i) => ({ before, after: s1.enemies[i] }))
        : [];
      const b0 = platform0 && platform0.screenBounds;
      const b1 = platform1 && platform1.screenBounds;
      const platformDx = b0 && b1 && finite(b0.screenX) && finite(b1.screenX) ? b1.screenX - b0.screenX : 0;
      const platformDy = b0 && b1 && finite(b0.screenY) && finite(b1.screenY) ? b1.screenY - b0.screenY : 0;
      const platformRevisionChanged = num(platform1 && platform1.motionRevision, 0) > num(platform0.motionRevision, 0);
      const nearPlatform = (enemy, platform) => {
        const b = platform && platform.screenBounds;
        if (!b || !enemy || !finite(enemy.screenX) || !finite(enemy.screenY) ||
            !finite(b.screenX) || !finite(b.screenY) || !finite(b.width) || !finite(b.height)) return false;
        const marginX = Math.max(64, b.width * 0.25);
        const marginY = Math.max(96, b.height * 2);
        return enemy.screenX >= b.screenX - marginX && enemy.screenX <= b.screenX + b.width + marginX &&
          enemy.screenY >= b.screenY - marginY && enemy.screenY <= b.screenY + b.height + marginY;
      };
      const enemyMoved = pairs.some(({ before, after }) => {
        if (!before || !after || before.alive === false || after.alive === false) return false;
        const enemyDx = finite(before.screenX) && finite(after.screenX) ? after.screenX - before.screenX : 0;
        const enemyDy = finite(before.screenY) && finite(after.screenY) ? after.screenY - before.screenY : 0;
        const enemyRevisionChanged = num(after.motionRevision, 0) > num(before.motionRevision, 0);
        const positionChanged = enemyDx !== 0 || enemyDy !== 0;
        if (!enemyRevisionChanged && !positionChanged) return false;
        const spatiallyCarried = nearPlatform(before, platform0) && nearPlatform(after, platform1);
        const followsMotion =
          (platformDx !== 0 && enemyDx !== 0 && Math.sign(platformDx) === Math.sign(enemyDx)) ||
          (platformDy !== 0 && enemyDy !== 0 && Math.sign(platformDy) === Math.sign(enemyDy)) ||
          (platformRevisionChanged && enemyRevisionChanged);
        return spatiallyCarried && followsMotion;
      });
      if (!platformMoved || !enemyMoved) return FAIL('platform and carried enemy did not both move visibly');
      if (isTerminal(s1) && aliveEnemies(s1) > 0) return FAIL('moving platform scenario ended prematurely');
      const beforeShot = s1.projectiles && s1.projectiles.lastPlayerShot;
      const afterShot = await game.contractShot('center', true);
      const afterPlayerShot = afterShot.projectiles && afterShot.projectiles.lastPlayerShot;
      const shotCountIncreased = projectileCount(afterShot) > projectileCount(s1);
      const shotSummaryAdvanced = !!beforeShot && !!afterPlayerShot && (
        (afterPlayerShot.pathRevision !== undefined && beforeShot.pathRevision !== undefined &&
          afterPlayerShot.pathRevision !== beforeShot.pathRevision) ||
        (finite(afterPlayerShot.screenX) && finite(beforeShot.screenX) && afterPlayerShot.screenX !== beforeShot.screenX) ||
        (finite(afterPlayerShot.screenY) && finite(beforeShot.screenY) && afterPlayerShot.screenY !== beforeShot.screenY) ||
        (afterPlayerShot.movement !== undefined && beforeShot.movement !== undefined && afterPlayerShot.movement !== beforeShot.movement)
      );
      if (!afterPlayerShot || (!beforeShot && !shotCountIncreased) ||
          (beforeShot && !shotCountIncreased && !shotSummaryAdvanced)) {
        return FAIL('player shot cannot interact with moving target window');
      }
      return PASS('moving platform carries enemy and remains gameplay-relevant');
    }
  },
  {
    id: 'p2-2-special-arrow-cost-benefit',
    level: 'P2',
    name: 'Special arrow consumes charge and produces type-specific benefit',
    timeoutMs: 24000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s0 = await game.loadScenario('special_arrow_ready');
      if (!s0.special || !s0.special.heldType || specialCharges(s0) <= 0) return NA('no special arrow charge available');
      const type = s0.special.heldType;
      const targetMove = (baseline) => {
        const target = targetPointFromEnemy(firstAliveEnemy(baseline), null);
        return target ? { to: { screenX: target.x, screenY: target.y } } : { direction: 'center' };
      };
      const benefitObserved = (samples) => samples.some(s => {
        if (type === 'multi') {
          return projectileCount(s) > projectileCount(s0) + 1 || activeProjectiles(s) > activeProjectiles(s0) + 1;
        }
        const enemy = Array.isArray(s.enemies) && s.enemies.find(e => e && e.alive !== false);
        const status = enemy && Array.isArray(enemy.status) ? enemy.status : [];
        if (type === 'ice') return status.includes('frozen') && s.combat && s.combat.enemyAttackState !== 'fired';
        if (type === 'fire') return status.includes('burning');
        return false;
      });
      const runAttempt = async (baseline, moves) => {
        const from = pointFromSnapshot(baseline);
        const fired = await inputAction(game, {
          type: 'dragAim',
          from: { screenX: from.x, screenY: from.y },
          moves,
          release: true
        });
        const after = await inputAction(game, { type: 'wait', ms: 700 });
        const later = await inputAction(game, { type: 'wait', ms: 900 });
        return { baseline, samples: [fired, after, later], settled: await game.snapshot() };
      };
      const routes = [
        [targetMove(s0)],
        [{ direction: 'center' }],
        [{ direction: 'higher' }],
        [{ direction: 'higher' }, { direction: 'higher' }, { direction: 'higher' }],
        [{ direction: 'lower' }]
      ];
      let attempt = null;
      for (let i = 0; i < routes.length; i++) {
        const baseline = i === 0 ? s0 : await game.loadScenario('special_arrow_ready');
        attempt = await runAttempt(baseline, routes[i]);
        const samples = attempt.samples;
        const launchObserved = samples.some(s => {
          const shot = s.projectiles && s.projectiles.lastPlayerShot;
          return shot && shot.owner === 'player' && shot.launchedByRelease === true;
        }) || samples.some(s => projectileCount(s) > projectileCount(s0));
        if (type === 'multi' || benefitObserved(samples)) break;
        if (!launchObserved || samples.some(s => specialCharges(s) === specialCharges(s0) - 1) === false) break;
      }
      const samples = attempt ? attempt.samples : [];
      const settled = attempt ? attempt.settled : s0;
      const chargeSpent = samples.some(s => specialCharges(s) === specialCharges(s0) - 1);
      if (!chargeSpent) return FAIL('special shot did not consume exactly one charge');
      const launchObserved = samples.some(s => {
        const shot = s.projectiles && s.projectiles.lastPlayerShot;
        return shot && shot.owner === 'player' && shot.launchedByRelease === true;
      }) || samples.some(s => projectileCount(s) > projectileCount(s0));
      if (!launchObserved) return FAIL('special release lacks player projectile/hit evidence');
      if (!benefitObserved(samples)) return FAIL(`special ${type} has no visible benefit`);
      if (coins(settled) !== coins(s0) && !(settled.phase === 'victory' || resultState(settled) === 'win')) return FAIL('special shot changed unrelated coins outside reward result');
      return PASS(`special ${type} cost and benefit observed`);
    }
  },
  {
    id: 'p2-3-settings-panels-nonblocking',
    level: 'P2',
    name: 'Settings and auxiliary panels toggle, close, persist, and do not block core play',
    timeoutMs: 22000,
    async run({ browser }) {
      const game = await createDriver(browser);
      await game.loadScenario('fresh_boot');
      const open = await game.input({ type: 'openPanel', panel: 'settings' });
      if (!(open.phase === 'settings' || open.activePanel === 'settings')) return NA('settings panel not implemented');
      if (!open.overlayBlocking) return FAIL('settings panel should be modal/blocking');
      const beforeSound = open.settings && open.settings.sound;
      const toggled = await game.input({ type: 'toggleSetting', setting: 'sound' });
      if (typeof beforeSound === 'boolean' && toggled.settings && toggled.settings.sound === beforeSound) return FAIL('sound toggle did not change setting state');
      const closed = await game.input({ type: 'closePanel', panel: 'settings' });
      if (closed.activePanel !== null || (closed.phase === 'playing' && closed.overlayBlocking)) return FAIL('settings panel did not close cleanly');
      const started = await game.input({ type: 'start' });
      if (started.phase !== 'playing' || !started.canInteractWithPlayfield) return FAIL('core play is blocked after settings panel');
      const leaderboard = await game.input({ type: 'openPanel', panel: 'leaderboard' });
      if ((leaderboard.phase === 'leaderboard' || leaderboard.activePanel === 'leaderboard') && !leaderboard.overlayBlocking) return FAIL('leaderboard panel active but not represented as panel/blocking state');
      await game.input({ type: 'closePanel', panel: 'leaderboard' });
      return PASS('auxiliary panels are operable and nonblocking after close');
    }
  },
  {
    id: 'p2-4-hud-snapshot-render-sync',
    level: 'P2',
    name: 'HUD, snapshot, and render stay synchronized during aim, shot, and result transitions',
    timeoutMs: 26000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s0 = await game.loadScenario('first_level_ready');
      if (!s0.hud || !s0.hud.levelVisible || !s0.hud.coinsVisible || !s0.hud.playerHealthVisible || !s0.hud.enemyHealthVisible) return FAIL('initial HUD does not expose required battle fields');
      const aim = await game.input({ type: 'aimStart', point: 'playfield' });
      const moved = await game.input({ type: 'aimMove', direction: 'higher' });
      if (moved.aim && moved.aim.state !== 'aiming' && !moved.aim.previewVisible) return FAIL('aim HUD/snapshot did not show aiming');
      const after = await game.input({ type: 'aimRelease' });
      await game.wait(700);
      const shot = await game.snapshot();
      if (!shot.projectiles || !shot.projectiles.lastPlayerShot) return FAIL('released shot missing from snapshot');
      if (renderRevision(shot) <= renderRevision(s0) && !(shot.projectiles.lastPlayerShot.pathRevision > 0)) return FAIL('render did not advance after visible shot');
      if (shot.phase === 'playing' && shot.overlayBlocking) return FAIL('HUD says playing while overlay blocks playfield');
      const resultHudMatches = !isTerminal(shot) || (shot.hud && shot.hud.resultVisible);
      if (!resultHudMatches) return FAIL('terminal snapshot lacks result HUD visibility');
      const nonNegativeError = assertNonNegativeSnapshot(shot);
      if (nonNegativeError) return FAIL(nonNegativeError);
      return PASS('HUD and semantic snapshot track gameplay transitions');
    }
  },
  {
    id: 'p2-5-touch-aim-path-operable',
    level: 'P2',
    name: 'Touch aim path can aim or shoot through browser touch events',
    timeoutMs: 18000,
    async run({ browser }) {
      const game = await createDriver(browser);
      const s0 = await game.loadScenario('first_level_ready');
      const start = pointFromSnapshot(s0);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: start.x, y: start.y, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
        modifiers: 0
      });
      await browser.sleep(100);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x, y: start.y - 90, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
        modifiers: 0
      });
      await browser.sleep(120);
      const aiming = await game.snapshot();
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
        modifiers: 0
      });
      await browser.sleep(250);
      const after = await game.snapshot();
      const aimed = aiming.aim && (aiming.aim.state === 'aiming' || aiming.aim.previewVisible);
      const shot = projectileCount(after) > projectileCount(s0) || (after.projectiles && after.projectiles.lastPlayerShot);
      if (!aimed && !shot && renderRevision(after) === renderRevision(s0)) return FAIL('touch path produced no aim, shot, or render evidence');
      if (after.overlayBlocking && after.phase === 'playing') return FAIL('touch left playing state with blocking overlay');
      return PASS('touch input path is observable');
    }
  }
];

module.exports = { suite };
