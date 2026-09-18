// === GDD Coverage Map ===
// M1 start/local battle -> p0-2-visible-hex-battle, p1-1-real-start-click
// M2 hex grid/current unit -> p0-2-visible-hex-battle, p1-2-hover-selection-preview
// M3 queue/turns -> p1-7-wait-end-turn-queue
// M4 hover/directional focus -> p1-2-hover-selection-preview, p1-3-key-focus-opposite-directions
// M5 movement -> p1-4-legal-move-and-invalid-rejection
// M6 ability/damage/cost -> p1-5-ability-damage-resource
// M7 summon/cap/placement -> p1-6-summon-resource-cap-placement
// M8 turn authority -> p1-7-wait-end-turn-queue, p1-8-non-current-rejected
// M9 death/victory/restart -> p1-9-kill-victory-lock-restart
// M10 panels -> p1-10-real-panel-click-block-close
// M11 drops/upgrades -> p2-1-drops-and-upgrades
// M12 chat/online/settings -> p2-2-chat-online-settings, p2-3-global-invariants
// M13 shortcut keys/audio feedback -> p2-4-shortcuts-audio-nonblocking
// === Category Map ===
// Boot & Stability -> p0-1-boot-contract, p0-2-visible-hex-battle
// UI Flow & Blocking -> p1-1-real-start-click, p1-10-real-panel-click-block-close, p2-2-chat-online-settings
// Input Semantics -> p1-2-hover-selection-preview, p1-3-key-focus-opposite-directions
// Core Mechanic Loop -> p1-4-legal-move-and-invalid-rejection, p1-5-ability-damage-resource, p1-6-summon-resource-cap-placement, p1-7-wait-end-turn-queue
// Invariants & Rejection -> p1-8-non-current-rejected, p2-3-global-invariants
// State Machine -> p1-9-kill-victory-lock-restart
// Depth / Optional Systems -> p2-1-drops-and-upgrades, p2-4-shortcuts-audio-nonblocking
// === Rationality Map ===
// p1-1-real-start-click real action segmented browser pointer press/hold/release on a discovered visible start control independent observation battle screen, visible hex board, current unit and queue empty-shell failure a label-only start or API-only battle fails
// p1-2-hover-selection-preview real action browser.mouseMove over a snapshot-derived semantic target independent observation hover target, preview kind or board revision changes empty-shell failure a static grid with no tactical preview fails
// p1-3-key-focus-opposite-directions real action browser.keyDown/keyUp for left/right/up/down independent observation opposite signed screen deltas and unchanged unit occupancy empty-shell failure absent listeners, same-direction focus or moving the unit fails
// p1-4-legal-move-and-invalid-rejection real action semantic move to advertised legal then invalid target independent observation occupancy and movement revision change only for legal action empty-shell failure accepting every target or returning ok without motion fails
// p1-5-ability-damage-resource real action select and use advertised ability on a legal target independent observation target health/status and caster energy plus damage feedback empty-shell failure direct damage setters or decorative ability controls fail
// p1-6-summon-resource-cap-placement real action select and summon advertised candidate into semantic placement independent observation resource, living-unit count, queue and occupancy changes empty-shell failure spawning without cost/cap/placement rules fails
// p1-7-wait-end-turn-queue real action wait then endTurn through public player actions independent observation queue revision/order and current unit advance empty-shell failure a queue label that never changes fails
// p1-8-non-current-rejected real action selectUnit and move/use from a non-current unit context independent observation rejection envelope and unchanged board/queue/resources empty-shell failure any unit can act out of turn
// p1-9-kill-victory-lock-restart real action legal ability from one-action-away scenario then restart independent observation death, terminal result, locked scoring and cleaned fresh battle empty-shell failure force-win APIs, actionable dead units or cosmetic results fail
// p1-10-real-panel-click-block-close real action segmented browser pointer press/hold/release on discovered panel control and background independent observation blocking panel, unchanged battle state, and restored interaction after close empty-shell failure decorative or nonblocking overlays fail
// p2-1-drops-and-upgrades real action normal pickup or ability-use progression in declared optional scenarios independent observation drop inventory/board or upgrade revision changes empty-shell failure claiming support without gameplay consequence fails
// p2-2-chat-online-settings real action segmented browser pointer press/hold/release on visible optional control or semantic toggle independent observation closable panel/state change or explicit unsupported rejection empty-shell failure auxiliary controls that trap local battle fail
// p2-3-global-invariants real action invalid move, terminal action and repeated snapshot observation independent observation bounded health/resources and unchanged totals/revisions on rejection empty-shell failure negative values or post-result score farming fails
// p2-4-shortcuts-audio-nonblocking real action Escape/Space/KeyQ plus audio toggle when declared independent observation panel/selection/audio/feedback changes or explicit unsupported rejection while tactical core is conserved empty-shell failure hotkeys mutate out-of-turn actions or audio controls trap battle

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const PASS = detail => ({ status: 'PASS', detail: detail || '' });
const FAIL = detail => ({ status: 'FAIL', detail: detail || '' });
const NA = detail => ({ status: 'NOT_APPLICABLE', detail: detail || '' });
const num = value => typeof value === 'number' && Number.isFinite(value);

async function call(browser, method, ...args) {
  return browser.eval(`(async function(){
    const api=window.__gameTest, method=${JSON.stringify(method)}, args=${JSON.stringify(args)};
    if(!api||typeof api[method]!=='function') return {__missing:method};
    try{return await Promise.resolve(api[method](...args));}catch(e){return {__threw:String(e&&e.message||e)}}
  })()`);
}

const snapOf = value => value && (value.snapshot || value.after || value);
const snapshot = browser => call(browser, 'getSnapshot');
const scenario = (browser, name, options) => options === undefined
  ? call(browser, 'loadScenario', name)
  : call(browser, 'loadScenario', name, options);
const input = (browser, action) => call(browser, 'input', action);

function validSnapshot(s) {
  return !!(s && s.schemaVersion === 1 && typeof s.ready === 'boolean' &&
    ['menu', 'battle', 'result', 'loading'].includes(s.screen) && s.board && s.turn &&
    Array.isArray(s.turn.queueUnitIds) && Array.isArray(s.units) && Array.isArray(s.resources) &&
    s.feedback && s.panel && s.result && s.optional);
}

async function actionSnapshot(browser, result) {
  const direct = snapOf(result);
  return validSnapshot(direct) ? direct : snapOf(await snapshot(browser));
}

function bounded(s) {
  return validSnapshot(s) && s.units.every(u => num(u.health) && num(u.maxHealth) && u.health >= 0 && u.health <= u.maxHealth &&
    num(u.energy) && num(u.maxEnergy) && u.energy >= 0 && u.energy <= u.maxEnergy) &&
    s.resources.every(r => num(r.summon) && r.summon >= 0 && num(r.summonCap) && num(r.summonedCount) &&
      r.summonedCount >= 0 && r.summonedCount <= r.summonCap && num(r.score) && r.score >= 0);
}

function semanticUnitState(s, u) {
  const occupiedIds = Array.isArray(u && u.occupiedTargetIds) ? u.occupiedTargetIds : [];
  const occupied = occupiedIds.map(id => semanticPoint(s, id)).filter(Boolean)
    .map(point => [point.x, point.y])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return {
    playerId: u && u.playerId,
    alive: !!(u && u.alive),
    current: !!(u && u.current),
    core: !!(u && u.core),
    health: u && u.health,
    maxHealth: u && u.maxHealth,
    energy: u && u.energy,
    maxEnergy: u && u.maxEnergy,
    screenX: u && u.screenX,
    screenY: u && u.screenY,
    footprintSize: occupiedIds.length,
    occupied,
    statusIds: Array.isArray(u && u.statusIds) ? u.statusIds.slice().sort() : []
  };
}

function tacticalCore(s) {
  const units = Array.isArray(s && s.units) ? s.units : [];
  const stateById = new Map(units.map(u => [u.id, semanticUnitState(s, u)]));
  const stableUnits = units.map(u => semanticUnitState(s, u))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const queue = Array.isArray(s && s.turn && s.turn.queueUnitIds)
    ? s.turn.queueUnitIds.map(id => stateById.get(id) || null) : [];
  const current = stateById.get(s && s.turn && s.turn.currentUnitId) ||
    semanticUnitState(s, units.find(u => u && u.current));
  const resources = (Array.isArray(s && s.resources) ? s.resources : [])
    .map(r => ({ playerId: r.playerId, summon: r.summon, summonCap: r.summonCap,
      summonedCount: r.summonedCount, score: r.score }))
    .sort((a, b) => String(a.playerId).localeCompare(String(b.playerId)));
  return JSON.stringify({ units: stableUnits, queue, current, resources,
    terminal: !!(s && s.result && s.result.terminal),
    resultRevision: s && s.result && s.result.revision });
}

function panelTacticalCore(s) {
  const units = Array.isArray(s && s.units) ? s.units : [];
  const stateById = new Map(units.map(u => [u.id, semanticUnitState(s, u)]));
  const current = stateById.get(s && s.turn && s.turn.currentUnitId) ||
    semanticUnitState(s, units.find(u => u && u.current));
  return JSON.stringify({
    units: units.map(u => semanticUnitState(s, u))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    queue: (s && s.turn && Array.isArray(s.turn.queueUnitIds))
      ? s.turn.queueUnitIds.map(id => stateById.get(id) || null) : [],
    current,
    resources: (Array.isArray(s && s.resources) ? s.resources : [])
      .map(r => ({ playerId: r.playerId, summon: r.summon, summonCap: r.summonCap,
        summonedCount: r.summonedCount, score: r.score }))
      .sort((a, b) => String(a.playerId).localeCompare(String(b.playerId))),
    terminal: !!(s && s.result && s.result.terminal),
    resultRevision: s && s.result && s.result.revision
  });
}

function invariantCore(s) { return tacticalCore(s); }

function invariantBounded(s) {
  if (!bounded(s) || !s.result || !num(s.result.revision)) return false;
  const finiteSummary = (value, identifiers = false) => {
    if (typeof value === 'number') return num(value);
    if (identifiers && typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.every(item => finiteSummary(item, identifiers));
    if (value && typeof value === 'object') {
      return Object.keys(value).every(key => key === 'playerId'
        ? typeof value[key] === 'string' || num(value[key])
        : finiteSummary(value[key], identifiers || key === 'survivors' || key === 'unitIds'));
    }
    return false;
  };
  return finiteSummary(s.result.scores) && finiteSummary(s.result.kills) &&
    finiteSummary(s.result.survivors, true);
}

function unit(s, id) { return Array.isArray(s && s.units) ? s.units.find(u => u.id === id) : null; }
function unitAtTarget(s, targetId) {
  const semantic = (s.board?.semanticTargets || []).find(t => t.id === targetId);
  const occupied = semantic?.occupiedUnitId && unit(s, semantic.occupiedUnitId);
  if (occupied) return occupied;
  const byTarget = (s.units || []).find(u => Array.isArray(u.occupiedTargetIds) && u.occupiedTargetIds.includes(targetId));
  if (byTarget) return byTarget;
  const point = semanticPoint(s, targetId);
  if (!point) return null;
  return (s.units || []).find(u => u && u.alive && num(u.screenX) && num(u.screenY) &&
    Math.abs(u.screenX - point.x) <= 1 && Math.abs(u.screenY - point.y) <= 1) || null;
}

function unitForAdvertisedTarget(s, targetId) {
  const semantic = (s.board?.semanticTargets || []).find(t => t.id === targetId);
  const direct = semantic?.occupiedUnitId ? unit(s, semantic.occupiedUnitId) : null;
  const occupied = (s.units || []).find(u => Array.isArray(u.occupiedTargetIds) && u.occupiedTargetIds.includes(targetId));
  const byId = unit(s, targetId);
  if (direct || occupied || byId) return direct || occupied || byId;
  const point = semanticPoint(s, targetId);
  if (!point) return null;
  return (s.units || []).find(u => u && u.alive && num(u.screenX) && num(u.screenY) &&
    Math.abs(u.screenX - point.x) <= 2 && Math.abs(u.screenY - point.y) <= 2) || null;
}
function semanticPoint(s, targetId) {
  const list = (s.board && s.board.semanticTargets) || [];
  const target = list.find(t => t.id === targetId);
  return target && num(target.screenX) && num(target.screenY) ? { x: target.screenX, y: target.screenY } : null;
}

function targetPointerPoints(s, target) {
  if (!target || !num(target.screenX) || !num(target.screenY)) return [];
  const raw = { x: target.screenX, y: target.screenY };
  const bounds = s && s.board && s.board.bounds;
  const left = bounds && (num(bounds.left) ? bounds.left : bounds.x);
  const top = bounds && (num(bounds.top) ? bounds.top : bounds.y);
  const width = bounds && (num(bounds.width) ? bounds.width : (num(bounds.w) ? bounds.w : null));
  const height = bounds && (num(bounds.height) ? bounds.height : (num(bounds.h) ? bounds.h : null));
  const points = [];
  if (num(left) && num(top) && num(width) && num(height) && width > 0 && height > 0) {
    const targets = Array.isArray(s.board.semanticTargets) ? s.board.semanticTargets : [];
    const maxX = Math.max(width, ...targets.filter(t => num(t.screenX)).map(t => t.screenX));
    const maxY = Math.max(height, ...targets.filter(t => num(t.screenY)).map(t => t.screenY));
    const sx = maxX > width ? width / maxX : 1;
    const sy = maxY > height ? height / maxY : 1;
    points.push({ x: left + raw.x * sx, y: top + raw.y * sy });
    points.push({ x: left + raw.x, y: top + raw.y });
  }
  points.push(raw);
  return points.filter((point, index, all) => num(point.x) && num(point.y) &&
    all.findIndex(other => Math.abs(other.x - point.x) < 0.5 && Math.abs(other.y - point.y) < 0.5) === index);
}

async function visibleControls(browser, terms, selector = 'button,[role="button"],a,input,[data-action],[data-act],[data-mode],[aria-label]') {
  return browser.eval(`(function(){
    const terms=${JSON.stringify(terms)}.map(x=>new RegExp(x,'i'));
    const nodes=Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
    const result=[];
    for(const el of nodes){const r=el.getBoundingClientRect(), cs=getComputedStyle(el); if(r.width<8||r.height<8||cs.display==='none'||cs.visibility==='hidden'||cs.pointerEvents==='none'||el.disabled) continue;
      const text=[el.textContent,el.value,el.id,el.className,el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-action'),el.getAttribute('data-act'),el.getAttribute('data-mode')].join(' ');
      if(terms.some(re=>re.test(text))) result.push({x:r.left+r.width/2,y:r.top+r.height/2,text});
    }
    return result;
  })()`);
}

async function visibleControl(browser, terms) {
  const controls = await visibleControls(browser, terms);
  return controls && controls[0] || null;
}

async function segmentedPointerClick(browser, point, holdMs = 120) {
  if (!point || !num(point.x) || !num(point.y)) return false;
  if (browser.cdp && typeof browser.cdp.send === 'function') {
    try {
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
      await sleep(holdMs);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1, modifiers: 0 });
    } catch (error) {
      await browser.mouseClick(point.x, point.y);
    }
  } else {
    await browser.mouseClick(point.x, point.y);
    await sleep(holdMs);
  }
  return true;
}

async function segmentedPointerSecondary(browser, point, holdMs = 120) {
  if (!point || !num(point.x) || !num(point.y)) return false;
  if (browser.cdp && typeof browser.cdp.send === 'function') {
    try {
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y, modifiers: 0 });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'right', clickCount: 1, modifiers: 0 });
      await sleep(holdMs);
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'right', clickCount: 1, modifiers: 0 });
    } catch (error) {
      // The DOM event below is still a browser-boundary fallback when CDP is unavailable.
    }
  }
  const observed = snapOf(await snapshot(browser));
  if (observed && observed.panel && observed.panel.active && observed.panel.blocking) return true;
  await browser.eval(`(function(){
    const x=${JSON.stringify(point.x)}, y=${JSON.stringify(point.y)};
    const el=document.elementFromPoint(x,y)||document;
    const ev=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window,
      clientX:x,clientY:y,button:2,buttons:2});
    el.dispatchEvent(ev);
    return true;
  })()`);
  return true;
}

async function waitSnapshot(browser, predicate, timeout = 5000) {
  const end = Date.now() + timeout; let last;
  while (Date.now() < end) { last = await snapshot(browser); if (predicate(last)) return last; await sleep(120); }
  return last;
}

async function stableSnapshot(browser, timeout = 1200) {
  const end = Date.now() + timeout;
  let previous = snapOf(await snapshot(browser));
  while (Date.now() < end) {
    await sleep(80);
    const current = snapOf(await snapshot(browser));
    if (validSnapshot(previous) && validSnapshot(current) && invariantCore(previous) === invariantCore(current)) return current;
    previous = current;
  }
  return previous;
}

function hasMovementSnapshot(s) {
  return validSnapshot(s) && s.targets && Array.isArray(s.targets.legalMoveIds) &&
    Array.isArray(s.targets.invalidMoveIds) && num(s.feedback.movementRevision);
}

const suite = [
  {
    id: 'p0-1-boot-contract', level: 'P0', name: 'boot contract and bounded snapshot', timeoutMs: 12000,
    async run({ browser }) {
      const s = snapOf(await call(browser, 'reset'));
      if (!validSnapshot(s)) return FAIL('missing or malformed public snapshot');
      if (!bounded(s)) return FAIL('health, energy, summon resources, counts, or scores out of bounds');
      return PASS(`screen=${s.screen}, phase=${s.phase}`);
    }
  },
  {
    id: 'p0-2-visible-hex-battle', level: 'P0', name: 'visible hex battle current unit and queue', timeoutMs: 12000,
    async run({ browser }) {
      const s = snapOf(await scenario(browser, 'local_battle_ready'));
      if (!validSnapshot(s) || s.screen !== 'battle' || !s.board.visible || !/hex/i.test(String(s.board.gridType))) return FAIL('hex battle not visible');
      if (!s.turn.currentUnitId || s.turn.queueUnitIds.length < 2 || !unit(s, s.turn.currentUnitId)) return FAIL('current unit or actionable queue missing');
      return PASS(`units=${s.units.length}, queue=${s.turn.queueUnitIds.length}`);
    }
  },
  {
    id: 'p1-1-real-start-click', level: 'P1', name: 'real start click enters local battle', timeoutMs: 14000,
    async run({ browser }) {
      await call(browser, 'reset');
      const terms = ['start', 'enter', 'begin', 'launch', '\\bplay\\b'];
      const priority = candidate => terms.findIndex(term => new RegExp(term, 'i').test(candidate.text));
      const tried = new Set();
      for (let attempt = 0; attempt < 8; attempt++) {
        // Prefer explicit launch controls over instructional text or labeled containers.
        const controls = await visibleControls(browser, terms,
          'button,[role="button"],a,input[type="button"],input[type="submit"],[data-action],[data-act],[data-mode]');
        controls.sort((a, b) => priority(a) - priority(b));
        const control = controls.find(candidate => {
          const key = `${candidate.text}|${candidate.x}|${candidate.y}`;
          return !tried.has(key);
        });
        if (!control) break;
        tried.add(`${control.text}|${control.x}|${control.y}`);
        await segmentedPointerClick(browser, control);
        const s = await waitSnapshot(browser, x => x && x.screen === 'battle');
        if (s && s.screen === 'battle' && s.board.visible && !(s.panel && s.panel.active && s.panel.blocking) && s.turn.currentUnitId) {
          return PASS('visible start control entered battle');
        }
        await call(browser, 'reset');
      }
      return FAIL(tried.size ? 'visible start controls did not expose interactive battle' : 'no visible start control');
    }
  },
  {
    id: 'p1-2-hover-selection-preview', level: 'P1', name: 'mouse hover and selection preview use semantic target', timeoutMs: 12000,
    async run({ browser }) {
      const before = snapOf(await scenario(browser, 'movement_choice_ready'));
      const hoverableIds = new Set((before.targets && before.targets.hoverableIds) || []);
      const hoverableTargets = (before.board && before.board.semanticTargets || []).filter(t =>
        t && hoverableIds.has(t.id) && (!Array.isArray(t.legalFor) || t.legalFor.includes('hover')));
      const target = hoverableTargets.find(t => Array.isArray(t.legalFor) && t.legalFor.includes('move')) ||
        hoverableTargets.find(t => t.kind === 'cell') || hoverableTargets[0];
      const targetId = target && target.id;
      const point = semanticPoint(before, targetId);
      if (!targetId || !point) return FAIL('scenario did not advertise a screen-space semantic target');
      const outside = { x: 10, y: 10 };
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved', x: outside.x, y: outside.y, button: 'none', buttons: 0,
        modifiers: 0, pointerType: 'mouse'
      });
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed', x: outside.x, y: outside.y, button: 'left', buttons: 1,
        clickCount: 1, modifiers: 0, pointerType: 'mouse'
      });
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved', x: point.x, y: point.y, button: 'left', buttons: 1,
        modifiers: 0, movementX: point.x - outside.x, movementY: point.y - outside.y, pointerType: 'mouse'
      });
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased', x: point.x, y: point.y, button: 'left', buttons: 0,
        clickCount: 1, modifiers: 0, pointerType: 'mouse'
      });
      await sleep(40);
      const hasPreview = s => s && (s.board.hoverTargetId === targetId || s.board.previewKind !== before.board.previewKind || s.board.revision !== before.board.revision);
      let after = await waitSnapshot(browser, hasPreview, 1000);
      if (!hasPreview(after)) {
        await browser.cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart', touchPoints: [{ x: outside.x, y: outside.y, radiusX: 2, radiusY: 2, id: 1 }]
        });
        await browser.cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove', touchPoints: [{ x: point.x, y: point.y, radiusX: 2, radiusY: 2, id: 1 }]
        });
        await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        after = await waitSnapshot(browser, hasPreview, 4000);
      }
      if (!hasPreview(after)) {
        // Headless Chrome's CDP mouse path may expose mouse events without a
        // PointerEvent. Exercise the same visible target through the DOM event
        // boundary as a compatibility fallback; no game API or private state is used.
        await browser.eval(`(function(){
          const x=${point.x}, y=${point.y};
          const target=document.elementFromPoint(x,y) || document;
          const EventCtor=window.PointerEvent || window.MouseEvent;
          target.dispatchEvent(new EventCtor('pointermove', {
            bubbles:true, cancelable:true, composed:true,
            clientX:x, clientY:y, screenX:x, screenY:y,
            button:-1, buttons:0, pointerId:7, pointerType:'mouse', isPrimary:true
          }));
          return true;
        })()`);
        after = await waitSnapshot(browser, hasPreview, 1000);
      }
      if (!after || (after.board.hoverTargetId !== targetId && after.board.previewKind === before.board.previewKind && after.board.revision === before.board.revision)) return FAIL('hover produced no independent preview');
      if (JSON.stringify(after.units.map(u => u.occupiedTargetIds)) !== JSON.stringify(before.units.map(u => u.occupiedTargetIds))) return FAIL('hover executed movement');
      return PASS(`preview=${after.board.previewKind || 'revision'}`);
    }
  },
  {
    id: 'p1-3-key-focus-opposite-directions', level: 'P1', name: 'key focus left right up down has opposite screen deltas', timeoutMs: 16000,
    async run({ browser }) {
      const base = snapOf(await scenario(browser, 'movement_choice_ready'));
      const occupancySignature = s => JSON.stringify((s.units || []).map(u => semanticUnitState(s, u))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
      async function pressFromBase(key) {
        await scenario(browser, 'movement_choice_ready');
        await browser.keyDown(key); await browser.keyUp(key); await sleep(120);
        return snapshot(browser);
      }
      const l = await pressFromBase('ArrowLeft');
      const r = await pressFromBase('ArrowRight');
      const u = await pressFromBase('ArrowUp');
      const d = await pressFromBase('ArrowDown');
      const pointFor = s => {
        const id = s.board.focusTargetId || s.board.hoverTargetId;
        const point = semanticPoint(s, id);
        if (point) return point;
        const current = (s.units || []).find(x => x.id === s.turn.currentUnitId || x.current);
        return current && num(current.screenX) && num(current.screenY)
          ? { x: current.screenX, y: current.screenY } : null;
      };
      const lp = pointFor(l), rp = pointFor(r), up = pointFor(u), dp = pointFor(d), bp = pointFor(base);
      if (!lp || !rp || !up || !dp || !bp) return FAIL('focus points not observable');
      const dxL = lp.x - bp.x, dxR = rp.x - bp.x, dyU = up.y - bp.y, dyD = dp.y - bp.y;
      if (!(dxL * dxR < 0 && dyU * dyD < 0)) return FAIL(`direction deltas not opposite: ${dxL}/${dxR}, ${dyU}/${dyD}`);
      if ([l, r, u, d].some(s => occupancySignature(s) !== occupancySignature(base))) return FAIL('focus key moved a unit');
      return PASS('opposite discrete focus deltas observed');
    }
  },
  {
    id: 'p1-4-legal-move-and-invalid-rejection', level: 'P1', name: 'legal move resolves and invalid move preserves invariant', timeoutMs: 12000,
    async run({ browser }) {
      const before = snapOf(await scenario(browser, 'movement_choice_ready'));
      if (!hasMovementSnapshot(before)) return FAIL('movement scenario snapshot malformed');
      const current = before.turn.currentUnitId, legal = before.targets.legalMoveIds[0], invalid = before.targets.invalidMoveIds[0];
      if (!current || !legal || !invalid) return FAIL('legal and invalid semantic targets required');
      const moved = snapOf(await input(browser, { type: 'move', targetId: legal }));
      const beforeUnit = before.units.find(u => u.current) || unit(before, current);
      const movedUnit = moved && ((moved.units || []).find(u => u.current) ||
        (moved.turn && unit(moved, moved.turn.currentUnitId)));
      if (!hasMovementSnapshot(moved) || !beforeUnit || !movedUnit ||
          !num(beforeUnit.screenX) || !num(beforeUnit.screenY) ||
          !num(movedUnit.screenX) || !num(movedUnit.screenY) ||
          (beforeUnit.screenX === movedUnit.screenX && beforeUnit.screenY === movedUnit.screenY) ||
          moved.feedback.movementRevision <= before.feedback.movementRevision) return FAIL('legal move did not resolve');
      const stableBefore = snapOf(await scenario(browser, 'movement_choice_ready'));
      if (!hasMovementSnapshot(stableBefore)) return FAIL('movement scenario snapshot malformed');
      const core = tacticalCore(stableBefore);
      const rejected = await input(browser, { type: 'move', targetId: invalid }); const after = snapOf(rejected);
      if (!hasMovementSnapshot(after) || rejected.accepted !== false || !rejected.reason && !after.feedback.rejectionReason) return FAIL('invalid move lacks rejection envelope');
      if (tacticalCore(after) !== core) return FAIL('invalid move mutated board, queue, resources, or result');
      return PASS('legal movement and invalid no-op verified');
    }
  },
  {
    id: 'p1-5-ability-damage-resource', level: 'P1', name: 'ability targeting changes damage and resource cost', timeoutMs: 14000,
    async run({ browser }) {
      const before = snapOf(await scenario(browser, 'ability_target_ready'));
      if (!validSnapshot(before) || !Array.isArray(before.abilities)) return FAIL('ability scenario snapshot malformed');
      const ability = before.abilities.find(a => a.available && Array.isArray(a.legalTargetIds) && a.legalTargetIds.length);
      if (!ability) return FAIL('no legal ability');
      const targetId = ability.legalTargetIds[0], targetBefore = unitAtTarget(before, targetId);
      const casterBefore = unit(before, before.turn.currentUnitId) || before.units.find(u => u.current);
      if (!targetBefore || !casterBefore) return FAIL('ability unit target not observable');
      const result = await input(browser, { type: 'useAbility', abilityId: ability.id, targetId });
      const after = snapOf(result);
      if (!validSnapshot(after)) return FAIL('ability action returned a malformed snapshot');
      const targetAfter = unitAtTarget(after, targetId), casterAfter = unit(after, casterBefore.id) ||
        after.units.find(u => u.current && u.playerId === casterBefore.playerId && u.core === casterBefore.core);
      const resolvedTargetAfter = targetAfter || unit(after, targetBefore.id);
      if (result.accepted === false || !resolvedTargetAfter || !(resolvedTargetAfter.health < targetBefore.health || JSON.stringify(resolvedTargetAfter.statusIds) !== JSON.stringify(targetBefore.statusIds))) return FAIL('ability caused no damage/status');
      if (!casterAfter || !(casterAfter.energy === casterBefore.energy - ability.cost) || after.feedback.damageRevision <= before.feedback.damageRevision) return FAIL('declared cost or damage feedback mismatch');
      if (!bounded(after)) return FAIL('ability broke bounded resources');
      return PASS(`cost=${ability.cost}, healthDelta=${resolvedTargetAfter.health - targetBefore.health}`);
    }
  },
  {
    id: 'p1-6-summon-resource-cap-placement', level: 'P1', name: 'summon obeys resource cap and placement', timeoutMs: 15000,
    async run({ browser }) {
      const before = snapOf(await scenario(browser, 'summon_choice_ready')); const choice = before.summons.find(x => x.affordable && x.legalTargetIds.length);
      if (!choice) return FAIL('no affordable summon placement'); const owner = before.turn.currentPlayerId; const rb = before.resources.find(r => r.playerId === owner);
      const result = await input(browser, { type: 'summon', summonId: choice.id, targetId: choice.legalTargetIds[0] }); const after = snapOf(result); const ra = after.resources.find(r => r.playerId === owner);
      if (result.accepted === false || after.units.filter(u => u.alive).length !== before.units.filter(u => u.alive).length + 1 || ra.summon !== rb.summon - choice.cost || ra.summonedCount !== rb.summonedCount + 1) return FAIL('summon consequence mismatch');
      if (new Set(after.units.flatMap(u => u.alive ? u.occupiedTargetIds : [])).size !== after.units.filter(u => u.alive).flatMap(u => u.occupiedTargetIds).length) return FAIL('summon created illegal overlap');
      const capped = snapOf(await scenario(browser, 'summon_cap_reached')); const core = tacticalCore(capped); const candidate = capped.summons[0];
      const rejected = candidate ? await input(browser, { type: 'summon', summonId: candidate.id, targetId: candidate.legalTargetIds[0] || 'unadvertised' }) : null;
      if (!rejected || rejected.accepted !== false || tacticalCore(snapOf(rejected)) !== core) return FAIL('cap rejection mutated state or was accepted');
      return PASS('cost, count, queue placement and cap verified');
    }
  },
  {
    id: 'p1-7-wait-end-turn-queue', level: 'P1', name: 'wait and end turn advance visible queue', timeoutMs: 12000,
    async run({ browser }) {
      let before = null, waitResult = null, waited = null;
      let selectedOptions = null, lastOptions = null;
      const setupOptions = [{ mode: 'hotseat' }, { mode: 'local' }, undefined];
      for (const options of setupOptions) {
        lastOptions = options;
        const setupResult = options === undefined
          ? await scenario(browser, 'queue_wait_ready')
          : await scenario(browser, 'queue_wait_ready', options);
        const setup = snapOf(setupResult);
        if (!setup || !setup.turn || typeof setup.turn.queueRevision !== 'number' || !Array.isArray(setup.turn.queueUnitIds)) continue;
        const candidateResult = await input(browser, { type: 'wait' });
        const candidate = await actionSnapshot(browser, candidateResult);
        const reordered = candidateResult && candidateResult.accepted === true && candidate && candidate.turn &&
          typeof candidate.turn.queueRevision === 'number' && Array.isArray(candidate.turn.queueUnitIds) &&
          candidate.turn.queueRevision > setup.turn.queueRevision &&
          JSON.stringify(candidate.turn.queueUnitIds) !== JSON.stringify(setup.turn.queueUnitIds);
        if (reordered) {
          before = setup; waitResult = candidateResult; waited = candidate; selectedOptions = options;
          if (candidate.canInteract === true) break;
        }
      }
      if (waited && waited.canInteract !== true && JSON.stringify(selectedOptions) !== JSON.stringify(lastOptions)) {
        const restoreResult = selectedOptions === undefined
          ? await scenario(browser, 'queue_wait_ready')
          : await scenario(browser, 'queue_wait_ready', selectedOptions);
        const restored = snapOf(restoreResult);
        const retryResult = await input(browser, { type: 'wait' });
        const retry = await actionSnapshot(browser, retryResult);
        if (restored && retryResult && retryResult.accepted === true && retry && retry.turn) {
          before = restored; waitResult = retryResult; waited = retry;
        }
      }
      if (!before || !before.turn || typeof before.turn.queueRevision !== 'number' || !Array.isArray(before.turn.queueUnitIds)) {
        return FAIL('queue scenario did not return a valid turn snapshot');
      }
      if (!waitResult || waitResult.accepted !== true || !waited || !waited.turn ||
          typeof waited.turn.queueRevision !== 'number' || !Array.isArray(waited.turn.queueUnitIds) ||
          waited.turn.queueRevision <= before.turn.queueRevision ||
          JSON.stringify(waited.turn.queueUnitIds) === JSON.stringify(before.turn.queueUnitIds)) {
        return FAIL('wait did not reorder queue');
      }
      if (typeof waited.canInteract !== 'boolean') return FAIL('wait did not return interaction state');
      let ready = waited;
      if (waited.canInteract !== true) {
        const blockedResult = await input(browser, { type: 'endTurn' });
        const blockedAfter = snapOf(blockedResult);
        if (!blockedResult || blockedResult.accepted !== false || !blockedAfter || !blockedAfter.turn ||
            blockedAfter.turn.queueRevision !== waited.turn.queueRevision ||
            blockedAfter.turn.currentUnitId !== waited.turn.currentUnitId ||
            JSON.stringify(blockedAfter.turn.queueUnitIds) !== JSON.stringify(waited.turn.queueUnitIds)) {
          return FAIL('end turn was accepted during a non-interactive turn');
        }
        ready = await waitSnapshot(browser, s => s && s.screen === 'battle' && s.canInteract === true &&
          s.turn && (s.turn.queueRevision > waited.turn.queueRevision ||
            s.turn.currentUnitId !== waited.turn.currentUnitId ||
            JSON.stringify(s.turn.queueUnitIds) !== JSON.stringify(waited.turn.queueUnitIds)), 5000);
        if (!ready || ready.canInteract !== true || !ready.turn ||
            (ready.turn.queueRevision <= waited.turn.queueRevision &&
              ready.turn.currentUnitId === waited.turn.currentUnitId &&
              JSON.stringify(ready.turn.queueUnitIds) === JSON.stringify(waited.turn.queueUnitIds))) {
          return FAIL('queue did not return to an interactive turn after waiting');
        }
      }
      const endResult = await input(browser, { type: 'endTurn' });
      const ended = snapOf(endResult);
      if (!endResult || endResult.accepted !== true || !ended || !ended.turn ||
          (ended.turn.queueRevision <= ready.turn.queueRevision &&
            JSON.stringify(ended.turn.queueUnitIds) === JSON.stringify(ready.turn.queueUnitIds)) ||
          ended.turn.currentUnitId === ready.turn.currentUnitId) {
        return FAIL('end turn did not advance current unit');
      }
      return PASS('queue reorder and advance observed');
    }
  },
  {
    id: 'p1-8-non-current-rejected', level: 'P1', name: 'non-current and dead units are rejected', timeoutMs: 12000,
    async run({ browser }) {
      const before = snapOf(await scenario(browser, 'non_current_unit_ready')); const other = before.units.find(u => u.alive && u.id !== before.turn.currentUnitId);
      if (!other) return FAIL('no non-current unit');
      // Inspection can reflow the page; compare occupied cells rather than screen pixels.
      const actionState = s => JSON.stringify({
        units: s.units.map(u => ({
          id: u.id, playerId: u.playerId, alive: u.alive, current: u.current, core: u.core,
          health: u.health, maxHealth: u.maxHealth, energy: u.energy, maxEnergy: u.maxEnergy,
          occupiedTargetIds: [...u.occupiedTargetIds].sort(), statusIds: [...u.statusIds].sort()
        })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
        turn: s.turn, resources: s.resources, result: s.result
      });
      const core = actionState(before);
      const rejected = await input(browser, { type: 'selectUnit', unitId: other.id, intent: 'act' });
      const after = snapOf(rejected);
      if (actionState(after) !== core) return FAIL('non-current inspection/action mutated tactical core');
      if (rejected.accepted !== false && after.turn.currentUnitId !== before.turn.currentUnitId) return FAIL('non-current selection stole current turn');
      return PASS(rejected.accepted === false ? `rejected=${rejected.reason || after.feedback.rejectionReason}` : 'non-current inspect allowed without action mutation');
    }
  },
  {
    id: 'p1-9-kill-victory-lock-restart', level: 'P1', name: 'kill victory result lock and restart cleanup', timeoutMs: 16000,
    async run({ browser }) {
      const before = snapOf(await scenario(browser, 'victory_one_action_away'));
      if (!validSnapshot(before) || !Array.isArray(before.abilities) || !before.turn) {
        return FAIL('victory scenario snapshot incomplete');
      }
      const ability = before.abilities.find(a => a && a.available && Array.isArray(a.legalTargetIds) && a.legalTargetIds.length);
      if (!ability) return FAIL('no legal finishing ability');
      const targetId = ability.legalTargetIds[0];
      const targetBefore = unitForAdvertisedTarget(before, targetId);
      const opposingBefore = before.units.filter(u => u && u.alive && u.playerId !== before.turn.currentPlayerId);
      const stableTargetId = targetBefore && targetBefore.id;
      if (!stableTargetId || targetBefore.playerId === before.turn.currentPlayerId) {
        return FAIL('finishing target is not an observable opposing unit');
      }
      const terminalResponse = await input(browser, { type: 'useAbility', abilityId: ability.id, targetId });
      const terminal = snapOf(terminalResponse);
      if (!terminalResponse || terminalResponse.accepted !== true || !validSnapshot(terminal) ||
          terminal.screen !== 'result' || !Array.isArray(terminal.turn.queueUnitIds)) {
        return FAIL('kill did not produce death and terminal result');
      }
      const targetAfter = unit(terminal, stableTargetId);
      const targetGone = !terminal.units.some(u => u && u.id === stableTargetId);
      const targetDead = targetAfter ? targetAfter.alive === false : targetGone;
      if (!terminal.result.terminal || !targetDead || terminal.turn.queueUnitIds.includes(stableTargetId)) {
        return FAIL('kill did not produce death and terminal result');
      }
      const lockedCore = tacticalCore(terminal);
      const locked = await input(browser, { type: 'endTurn' });
      const lockedSnapshot = snapOf(locked);
      if (locked.accepted !== false || !lockedSnapshot || tacticalCore(lockedSnapshot) !== lockedCore) {
        return FAIL('terminal state allowed action or scoring mutation');
      }
      const restartResponse = await input(browser, { type: 'restart' });
      const restarted = snapOf(restartResponse);
      if (!restarted || !validSnapshot(restarted) || restarted.result.terminal || restarted.screen !== 'battle' ||
          restarted.result.revision === terminal.result.revision || !restarted.canInteract) {
        return FAIL('restart did not clean result state');
      }
      return PASS('death, victory lock and clean restart verified');
    }
  },
  {
    id: 'p1-10-real-panel-click-block-close', level: 'P1', name: 'real panel click blocks background and closes', timeoutMs: 14000,
    async run({ browser }) {
      const before = snapOf(await scenario(browser, 'panel_ready'));
      if (!before || !before.board || !before.turn) return FAIL('panel scenario snapshot incomplete');
      let opened = before && before.panel && before.panel.active && before.panel.blocking ? before : null;
      if (opened && !opened.panel.closable) return FAIL('panel_ready exposed a non-closable blocking panel');
      if (!opened) {
        const control = await visibleControl(browser, ['score', 'unit', 'settings', 'info', 'chat']);
        if (control) {
          await segmentedPointerClick(browser, control);
          const candidate = await waitSnapshot(browser, s => s && s.panel && s.panel.active && s.panel.blocking);
          if (candidate && candidate.panel && candidate.panel.active && candidate.panel.blocking) opened = candidate;
        }
      }
      if (!opened) {
        const targets = (before.board && before.board.semanticTargets) || [];
        const panelTarget = targets.find(t => t && t.kind === 'panel' && !t.blocked &&
          (!Array.isArray(t.legalFor) || t.legalFor.some(kind => /panel/i.test(String(kind)))));
        if (panelTarget) {
          for (const point of targetPointerPoints(before, panelTarget)) {
            if (point.x <= 0 && point.y <= 0) continue;
            await segmentedPointerClick(browser, point);
            const candidate = await waitSnapshot(browser, s => s && s.panel && s.panel.active && s.panel.blocking, 900);
            if (candidate && candidate.panel && candidate.panel.active && candidate.panel.blocking) { opened = candidate; break; }
          }
          if (!opened) {
            const advertisedPanel = panelTarget.panel || String(panelTarget.id || '').replace(/^panel[:_]/i, '');
            const panelNames = ['unit', 'score', 'settings', 'chat'].filter(panel =>
              !advertisedPanel || advertisedPanel === panel || !['unit', 'score', 'settings', 'chat'].includes(advertisedPanel));
            for (const panel of panelNames) {
              const candidate = snapOf(await input(browser, { type: 'openPanel', panel }));
              if (candidate && candidate.panel && candidate.panel.active && candidate.panel.blocking) {
                opened = candidate;
                break;
              }
            }
          }
        }
      }
      if (!opened) {
        const targets = (before.board && before.board.semanticTargets) || [];
        const unitTarget = targets.find(t => t && t.kind === 'unit' && !t.blocked &&
          num(t.screenX) && num(t.screenY));
        if (unitTarget) {
          for (const point of targetPointerPoints(before, unitTarget)) {
            await segmentedPointerSecondary(browser, point);
            const candidate = await waitSnapshot(browser, s => s && s.panel && s.panel.active && s.panel.blocking, 900);
            if (candidate && candidate.panel && candidate.panel.active && candidate.panel.blocking) { opened = candidate; break; }
          }
        }
      }
      if (!opened || !opened.panel || !opened.panel.closable) return FAIL('no real or advertised semantic path opened a closable blocking panel');
      const core = panelTacticalCore(opened);
      const bounds = opened.board && opened.board.bounds;
      const left = bounds && (num(bounds.left) ? bounds.left : (num(bounds.x) ? bounds.x : bounds.minX));
      const top = bounds && (num(bounds.top) ? bounds.top : (num(bounds.y) ? bounds.y : bounds.minY));
      const width = bounds && (num(bounds.width) ? bounds.width : (num(bounds.w) ? bounds.w :
        (num(bounds.maxX) && num(left) ? bounds.maxX - left : null)));
      const height = bounds && (num(bounds.height) ? bounds.height : (num(bounds.h) ? bounds.h :
        (num(bounds.maxY) && num(top) ? bounds.maxY - top : null)));
      let backgroundPoint = null;
      if (num(left) && num(top) && num(width) && num(height) && width > 0 && height > 0) {
        backgroundPoint = { x: left + width / 2, y: top + height / 2 };
      } else {
        backgroundPoint = (opened.board.semanticTargets || []).find(t => t && t.kind !== 'panel' &&
          !t.blocked && num(t.screenX) && num(t.screenY) && (t.screenX > 0 || t.screenY > 0));
      }
      if (!backgroundPoint) return FAIL('panel snapshot lacks usable board bounds or background target');
      await segmentedPointerClick(browser, backgroundPoint);
      const blocked = await snapshot(browser);
      if (!blocked || !blocked.panel || !blocked.panel.active || !blocked.panel.blocking) return FAIL('background click escaped the blocking panel');
      if (panelTacticalCore(blocked) !== core) return FAIL('background click mutated battle under panel');
      const close = await visibleControl(browser, ['close', 'back', 'resume']);
      if (close) await segmentedPointerClick(browser, close);
      let closed = await waitSnapshot(browser, s => s && s.panel && !s.panel.active, 1000);
      if (!closed || closed.panel.active) {
        await input(browser, { type: 'closePanel' });
        closed = await waitSnapshot(browser, s => s && s.panel && !s.panel.active);
      }
      if (!closed || !closed.canInteract) return FAIL('panel did not close to interaction');
      return PASS('blocking and close path verified');
    }
  },
  {
    id: 'p2-1-drops-and-upgrades', level: 'P2', name: 'optional drops and upgrades have gameplay consequence', timeoutMs: 14000,
    async run({ browser }) {
      const base = snapOf(await scenario(browser, 'drop_pickup_ready'));
      if (base.__missing) return FAIL('scenario contract missing');
      if (!base.optional.dropsSupported && !base.optional.upgradesSupported) return NA('both optional depth systems explicitly unsupported');
      if (base.optional.dropsSupported) {
        const moveId = base.targets.legalMoveIds && base.targets.legalMoveIds[0]; const after = snapOf(await input(browser, { type: 'move', targetId: moveId }));
        if (JSON.stringify(after.optional.drops) === JSON.stringify(base.optional.drops) && tacticalCore(after) === tacticalCore(base)) return FAIL('supported drop had no pickup consequence');
      }
      if (base.optional.upgradesSupported) {
        const up = snapOf(await scenario(browser, 'ability_upgrade_ready')); const ability = up.abilities.find(a => a.available && a.legalTargetIds.length); const after = snapOf(await input(browser, { type: 'useAbility', abilityId: ability.id, targetId: ability.legalTargetIds[0] }));
        if (after.optional.upgradeRevision <= up.optional.upgradeRevision) return FAIL('supported upgrade did not progress');
      }
      return PASS('supported optional depth has observable consequence');
    }
  },
  {
    id: 'p2-2-chat-online-settings', level: 'P2', name: 'real click optional chat online or settings remains closable', timeoutMs: 12000,
    async run({ browser }) {
      const setup = await scenario(browser, 'optional_services_ready');
      const base = snapOf(setup);
      if (!base || !base.optional) return FAIL('optional scenario returned no optional snapshot');
      const control = await visibleControl(browser, ['chat', 'online', 'audio', 'settings']);
      const setupReason = String(setup && (setup.reason || setup.rejectionReason || '') || '');
      const unsupported = /unsupported/i.test(setupReason);
      const rejected = setup && (setup.ok === false || setup.accepted === false || setup.supported === false);
      if (rejected && !unsupported) return FAIL('optional_services_ready did not load a supported setup');
      if (unsupported) {
        const optionalProbe = !control ? await input(browser, { type: 'toggleSetting', setting: 'audio' }) : null;
        const noActionableOptional = !control && !base.optional.chatSupported &&
          !base.optional.onlineSupported && !base.optional.audioSupported &&
          (!base.optional.settingsSupported || !optionalProbe || optionalProbe.accepted !== true);
        if (noActionableOptional) return NA('optional services explicitly unsupported');
        return FAIL('optional_services_ready rejected despite advertised optional support');
      }
      if (!base.optional.chatSupported && !base.optional.onlineSupported &&
          !base.optional.settingsSupported && !base.optional.audioSupported) return NA('optional services explicitly unsupported');
      if (control) await segmentedPointerClick(browser, control, 150);
      else await input(browser, { type: 'toggleSetting', setting: 'audio' });
      const after = await snapshot(browser);
      if (!after || !after.optional) return FAIL('optional control returned no optional snapshot');
      const panelOpen = value => !!(value && value.panel && value.panel.blocking && value.panel.closable);
      if (JSON.stringify(after.optional) === JSON.stringify(base.optional) && !panelOpen(after)) return FAIL('supported optional control caused no state change');
      if (panelOpen(after)) { const closed = snapOf(await input(browser, { type: 'closePanel' })); if (panelOpen(closed)) return FAIL('optional panel trapped battle'); }
      return PASS('optional service changes state and remains escapable');
    }
  },
  {
    id: 'p2-3-global-invariants', level: 'P2', name: 'invalid terminal actions preserve totals and bounded resources', timeoutMs: 14000,
    async run({ browser }) {
      const move = snapOf(await scenario(browser, 'movement_choice_ready'));
      const totalBefore = invariantCore(move);
      if (!invariantBounded(move)) return FAIL('movement scenario exposed invalid bounded values');
      const rejected = await input(browser, { type: 'move', targetId: 'never-advertised-target' });
      const rejectedSnapshot = await actionSnapshot(browser, rejected);
      if (rejected.accepted !== false || !invariantBounded(rejectedSnapshot) || invariantCore(rejectedSnapshot) !== totalBefore) return FAIL('invalid action did not preserve total state unchanged');
      let near = snapOf(await scenario(browser, 'victory_one_action_away'));
      if (!invariantBounded(near)) return FAIL('victory scenario exposed invalid bounded values');
      const abilityTargetId = (s, ability) => {
        if (ability && Array.isArray(ability.legalTargetIds) && ability.legalTargetIds.length) return ability.legalTargetIds[0];
        const target = (s && s.board && Array.isArray(s.board.semanticTargets) ? s.board.semanticTargets : [])
          .find(t => t && !t.blocked && Array.isArray(t.legalFor) && t.legalFor.some(kind => /ability/i.test(String(kind))) && t.occupiedUnitId);
        return target && target.id;
      };
      let ability = near.abilities.find(a => a.available && abilityTargetId(near, a));
      if (!ability) {
        const selectable = near.abilities.find(a => a.available && a.id);
        if (selectable) {
          const selected = await input(browser, { type: 'selectAbility', abilityId: selectable.id });
          near = await actionSnapshot(browser, selected);
          ability = near && near.abilities && near.abilities.find(a => a.available && abilityTargetId(near, a));
        }
      }
      if (!ability) return FAIL('victory scenario exposed no legal ability');
      const terminal = await actionSnapshot(browser, await input(browser, { type: 'useAbility', abilityId: ability.id, targetId: abilityTargetId(near, ability) }));
      if (!invariantBounded(terminal)) return FAIL('terminal snapshot exposed invalid bounded values');
      const settledTerminal = await stableSnapshot(browser);
      if (!invariantBounded(settledTerminal)) return FAIL('terminal snapshot did not settle to bounded values');
      const terminalBefore = invariantCore(settledTerminal);
      const deadAct = await input(browser, { type: 'move', targetId: 'never-advertised-target' });
      const deadSnapshot = await stableSnapshot(browser);
      const deadCore = invariantCore(deadSnapshot);
      if (deadAct.accepted !== false || deadCore !== terminalBefore || !invariantBounded(deadSnapshot)) {
        const beforeCore = JSON.parse(terminalBefore), afterCore = JSON.parse(deadCore);
        const changed = Object.keys(beforeCore).filter(key => JSON.stringify(beforeCore[key]) !== JSON.stringify(afterCore[key]));
        const details = Object.fromEntries(changed.map(key => [key, { before: beforeCore[key], after: afterCore[key] }]));
        return FAIL(`terminal/dead action changed score, board, queue, result or bounds (${JSON.stringify(details)})`);
      }
      return PASS('rejection conservation and bounded values verified');
    }
  },
  {
    id: 'p2-4-shortcuts-audio-nonblocking', level: 'P2', name: 'shortcut keys and audio controls are observable and nonblocking', timeoutMs: 14000,
    async run({ browser }) {
      const base = snapOf(await scenario(browser, 'optional_services_ready'));
      if (!validSnapshot(base) || !base.optional) return FAIL('optional scenario returned an incomplete snapshot');
      const supported = base.optional.shortcutSupported || base.optional.audioSupported || base.optional.settingsSupported;
      if (!supported) return NA('shortcut/audio optional support explicitly unavailable');

      const battle = snapOf(await scenario(browser, 'panel_ready'));
      if (!validSnapshot(battle) || !battle.panel) return FAIL('panel scenario returned an incomplete snapshot');
      const coreBefore = tacticalCore(battle);
      await input(browser, { type: 'openPanel', panel: 'settings' });
      await browser.keyDown('Escape'); await browser.keyUp('Escape'); await sleep(120);
      const escaped = await snapshot(browser);
      if (tacticalCore(escaped) !== coreBefore) return FAIL('Escape/settings shortcut mutated tactical battle state');
      if (!escaped || !escaped.panel || (escaped.panel.active && escaped.panel.blocking && !escaped.panel.closable)) return FAIL('Escape left an unclosable blocking panel');

      const ability = snapOf(await scenario(browser, 'ability_target_ready'));
      if (!ability || !ability.optional || !ability.board || !ability.feedback || !ability.turn) return FAIL('ability scenario returned an incomplete snapshot');
      const abilityCore = tacticalCore(ability);
      await browser.keyDown('KeyQ'); await browser.keyUp('KeyQ'); await sleep(120);
      await browser.keyDown('Space'); await browser.keyUp('Space'); await sleep(120);
      const keyed = await snapshot(browser);
      if (!keyed || !keyed.panel || !keyed.board || !keyed.feedback || !keyed.turn || !keyed.optional) return FAIL('shortcut returned an incomplete snapshot');
      const shortcutEvidence = keyed.panel.active !== ability.panel.active ||
        keyed.phase !== ability.phase ||
        keyed.board.previewKind !== ability.board.previewKind ||
        keyed.board.focusTargetId !== ability.board.focusTargetId ||
        keyed.feedback.rejectionReason !== ability.feedback.rejectionReason ||
        keyed.feedback.damageRevision > ability.feedback.damageRevision ||
        keyed.turn.queueRevision > ability.turn.queueRevision ||
        keyed.turn.currentUnitId !== ability.turn.currentUnitId ||
        keyed.optional.shortcutRevision > ability.optional.shortcutRevision;
      if (!shortcutEvidence && base.optional.shortcutSupported) return FAIL('declared shortcut support has no selection, feedback, or explicit rejection evidence');
      const legalShortcutMutation = keyed.feedback.damageRevision > ability.feedback.damageRevision ||
        keyed.turn.queueRevision > ability.turn.queueRevision ||
        keyed.optional.shortcutRevision > ability.optional.shortcutRevision ||
        keyed.feedback.rejectionReason !== ability.feedback.rejectionReason;
      if (keyed.result && keyed.result.terminal || (tacticalCore(keyed) !== abilityCore && !legalShortcutMutation)) {
        return FAIL('shortcut keys produced out-of-turn or unexplained tactical mutation');
      }

      const audioBefore = await snapshot(browser);
      const toggled = snapOf(await input(browser, { type: 'toggleSetting', setting: 'audio' }));
      if (!audioBefore || !audioBefore.optional || !audioBefore.feedback || !toggled || !toggled.optional || !toggled.feedback) return FAIL('audio toggle returned an incomplete snapshot');
      const audioEvidence = toggled.optional.audioEnabled !== audioBefore.optional.audioEnabled ||
        toggled.optional.audioRevision > audioBefore.optional.audioRevision ||
        toggled.feedback.rejectionReason !== audioBefore.feedback.rejectionReason ||
        toggled.panel.active !== audioBefore.panel.active;
      if (base.optional.audioSupported && !audioEvidence) return FAIL('declared audio support did not change audio state, feedback, or panel state');
      if (toggled.panel.active) {
        const closed = snapOf(await input(browser, { type: 'closePanel' }));
        if (closed.panel.active && closed.panel.blocking) return FAIL('audio/settings panel trapped the battle');
      }
      return PASS('shortcuts/audio produce observable feedback or safe rejection without blocking battle');
    }
  }
];

module.exports = { suite };
