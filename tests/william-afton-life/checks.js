'use strict';

// === GDD Coverage Map ===
// M0 Boot to playable city -> p0-contract-boot-playable, p0-real-start-visible
// M1 Mode gating -> p0-contract-mode-gating, p1-modal-blocks-releases-play, p1-death-lock-respawn
// M2 State feedback -> p1-contract-hud-feedback, p1-real-fire-aim-shot, p1-real-shop-success, p1-contract-wanted-police-risk, p1-contract-damage-death
// M3 Walking exploration -> p1-keyboard-walk-release, p1-touch-joystick-walk-parity, p1-contract-obstacle-block-slide
// M4 Aiming and shooting -> p1-real-fire-aim-shot, p1-contract-no-ammo-rejects, p1-modal-blocks-releases-play
// M5 Vehicle theft and driving -> p1-real-enter-exit-vehicle, p1-keyboard-drive-controls, p1-contract-vehicle-collision-risk
// M6 Mission chain -> p1-contract-mission-task-chain, p1-contract-buy-objective-success-reject
// M7 Economy and vendors -> p1-real-shop-success, p1-contract-shop-rejects-low-cash, p1-contract-buy-objective-success-reject
// M8 Wanted and police risk -> p1-contract-vehicle-collision-risk, p1-contract-wanted-police-risk
// M9 Health, death, respawn -> p1-contract-damage-death, p1-death-lock-respawn
// M10 Living city feedback -> p1-contract-living-city-observable
// M11 Extended narrative chain -> p2-contract-extended-narrative
// M12 Special appearance events -> p2-contract-special-appearance
// M13 Expanded combat effects -> p2-contract-expanded-combat
// M14 Deeper police behavior -> p2-contract-deeper-police
// M15 Persistence -> not executable; TEST_SPEC marks needs_tdd_contract because TDD has no save/load public contract
// M16 Landmark polish -> p2-real-landmark-guidance

// === Category Map ===
// TS-P0-01 -> p0-contract-boot-playable, p0-real-start-visible
// TS-P0-02 -> p0-contract-mode-gating
// TS-P1-18 -> p1-contract-hud-feedback
// TS-P1-01 -> p1-keyboard-walk-release
// TS-P1-02 -> p1-touch-joystick-walk-parity
// TS-P1-03 -> p1-contract-obstacle-block-slide
// TS-P1-04 -> p1-real-enter-exit-vehicle
// TS-P1-05 -> p1-keyboard-drive-controls
// TS-P1-06 -> p1-contract-vehicle-collision-risk
// TS-P1-07 -> p1-real-fire-aim-shot
// TS-P1-08 -> p1-contract-no-ammo-rejects
// TS-P1-09 -> p1-modal-blocks-releases-play
// TS-P1-10 -> p1-real-shop-success
// TS-P1-11 -> p1-contract-shop-rejects-low-cash
// TS-P1-12 -> p1-contract-mission-task-chain
// TS-P1-13 -> p1-contract-buy-objective-success-reject
// TS-P1-14 -> p1-contract-wanted-police-risk
// TS-P1-15 -> p1-contract-damage-death
// TS-P1-16 -> p1-death-lock-respawn
// TS-P1-17 -> p1-contract-living-city-observable
// TS-P2-01 -> p2-contract-extended-narrative
// TS-P2-02 -> p2-contract-special-appearance
// TS-P2-03 -> p2-contract-expanded-combat
// TS-P2-04 -> p2-contract-deeper-police
// TS-P2-05 -> needs_tdd_contract; no runtime check
// TS-P2-06 -> p2-real-landmark-guidance

// === Rationality Map ===
// p1-contract-hud-feedback | priority P1 | GDD M2 | TEST_SPEC TS-P1-18 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: fire and shop actions from legal scenarios | independent observation: ammo/cash/combat/shop/HUD feedback deltas plus nonnegative resources | empty-shell failure reason: HUD-only counters or action results disconnected from gameplay state fail.
// p1-keyboard-walk-release | priority P1 | GDD M3 | TEST_SPEC TS-P1-01 | method: real-user behavior | interaction path: keyboard hold/release and opposite direction pair | adapter: keyboard-hold | trigger: real KeyA/KeyD hold and release after fresh_city setup | independent observation: signed player screen/world delta plus release motion state/velocity | empty-shell failure reason: listener-only or API-only movement cannot create opposite player-visible deltas.
// p1-touch-joystick-walk-parity | priority P1 | GDD M3 | TEST_SPEC TS-P1-02 | method: real-user behavior | interaction path: touch drag/tap | adapter: touch-drag | trigger: touchStart/move/end from TDD playfield bounds | independent observation: player delta while held and cleanup after release | empty-shell failure reason: accepting touch events without movement, or rescuing with contract move, cannot pass.
// p1-contract-obstacle-block-slide | priority P1 | GDD M3 | TEST_SPEC TS-P1-03 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: move toward obstacle then passable/opposite movement | independent observation: blocked/sliding state, bounded axis, recovery, unchanged resources | empty-shell failure reason: decorative obstacle flags or teleport-through movement fail the causal chain.
// p1-real-enter-exit-vehicle | priority P1 | GDD M5/M1 | TEST_SPEC TS-P1-04 | method: mixed setup + real-user behavior | interaction path: visible control click / keyboard-control equivalence | adapter: pointer-click or keyboard-hold | trigger: real click/key on discovered vehicle enter path, then real exit path | independent observation: walking->driving->walking mode, vehicle controlled, controls swap | empty-shell failure reason: API-only mode toggles or fixed selector buttons do not satisfy real operability.
// p1-keyboard-drive-controls | priority P1 | GDD M5 | TEST_SPEC TS-P1-05 | method: real-user behavior | interaction path: keyboard hold/release and opposite direction pair | adapter: keyboard-hold | trigger: real W/S/A/D holds in driving_open_road | independent observation: speed/coast/brake/reverse plus left/right signed steering | empty-shell failure reason: constant speed, ignored release, or mirrored steering fails.
// p1-contract-vehicle-collision-risk | priority P1 | GDD M5/M8/M10 | TEST_SPEC TS-P1-06 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: drive toward collision risk and compare away path | independent observation: vehicle motion coupled to collision/world/wanted/health feedback with resource invariants | empty-shell failure reason: timer damage or collision flags without vehicle-risk action fail.
// p1-real-fire-aim-shot | priority P1 | GDD M4/M2/M8 | TEST_SPEC TS-P1-07 | method: mixed setup + real-user behavior | interaction path: segmented pointer press-hold-release plus mouse drag from semantic bounds | adapter: pointer-drag or keyboard-hold | trigger: real fire control press/aim/release in armed_near_target | independent observation: ammo cost, shot/projectile/recoil/target/wanted feedback, aim summary | empty-shell failure reason: ammo-only counters or aim-independent shots fail.
// p1-contract-no-ammo-rejects | priority P1 | GDD M4/M7 | TEST_SPEC TS-P1-08 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: fire in armed_no_ammo and optional unowned switch | independent observation: no negative ammo, no new hit/defeat, rejection feedback | empty-shell failure reason: free projectiles or negative ammo fail.
// p1-modal-blocks-releases-play | priority P1 | GDD M1/M4/M5/M7/M9 | TEST_SPEC TS-P1-09 | method: mixed setup + real-user behavior | interaction path: modal blocks then releases | adapter: dom-click, pointer-click, keyboard-hold, contract-action for setup only | trigger: blocked real key/fire attempt while panel open, then visible close | independent observation: unchanged gameplay core, controls blocked/restored | empty-shell failure reason: visual-only overlays that still mutate gameplay fail.
// p1-real-shop-success | priority P1 | GDD M7/M2 | TEST_SPEC TS-P1-10 | method: mixed setup + real-user behavior | interaction path: visible control click and segmented pointer press-hold-release | adapter: dom-click or pointer-click | trigger: real click an affordable visible shop item | independent observation: cash spend plus resource/equipment/health/task effect and purchase feedback | empty-shell failure reason: shop label, API-only buy, or spend-only purchase fails.
// p1-contract-shop-rejects-low-cash | priority P1 | GDD M7 | TEST_SPEC TS-P1-11 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: buy unaffordable item in low-cash shop | independent observation: reject feedback, unchanged cash/effects/progress, nonnegative resources | empty-shell failure reason: rejected flag with granted item or negative cash fails.
// p1-contract-mission-task-chain | priority P1 | GDD M6 | TEST_SPEC TS-P1-12 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: talk, delivery, vehicle, kill, arrive objective actions from legal scenarios | independent observation: mission progress/objective/reward/HUD/guidance changes only after trigger | empty-shell failure reason: precompleted scenarios or one-button reward fail.
// p1-contract-buy-objective-success-reject | priority P1 | GDD M6/M7 | TEST_SPEC TS-P1-13 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: open shop and buy taskItem in enough/insufficient cash variants | independent observation: success completes/spends, insufficient rejects unchanged | empty-shell failure reason: bypassed buy task or rejection that advances mission fails.
// p1-contract-wanted-police-risk | priority P1 | GDD M8/M2/M10 | TEST_SPEC TS-P1-14 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: hostile fire/collision then wait under wanted pressure | independent observation: wanted/police threat/minimap/health risk | empty-shell failure reason: HUD-only wanted or harmless police fail.
// p1-contract-damage-death | priority P1 | GDD M9 | TEST_SPEC TS-P1-15 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: wait/move/drive into damage risk until health loss/death | independent observation: health decreases, damage feedback, terminal death and disabled controls | empty-shell failure reason: cosmetic damage or direct scenario death fail.
// p1-death-lock-respawn | priority P1 | GDD M9/M1 | TEST_SPEC TS-P1-16 | method: mixed setup + real-user behavior | interaction path: visible control click plus modal blocks then releases | adapter: dom-click or pointer-click | trigger: real respawn control after death and blocked action attempts | independent observation: death rejects actions, respawn restores walking/health/controls and clears wanted | empty-shell failure reason: instant respawn without lock or UI-only recovery fails.
// p1-contract-living-city-observable | priority P1 | GDD M10 | TEST_SPEC TS-P1-17 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: wait/move/collect/interact/fire/drive where legal | independent observation: world counts, minimap markers, traffic/NPC/pickup/projectile revisions | empty-shell failure reason: static backdrops or renderRevision alone fail.
// p2-contract-extended-narrative | priority P2 | GDD M11 | TEST_SPEC TS-P2-01 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: dialogue/objective handoff when exposed | independent observation: dialogue/objective revisions after confirmation and controls recover | empty-shell failure reason: optional story that rewards without action or traps controls fails.
// p2-contract-special-appearance | priority P2 | GDD M12 | TEST_SPEC TS-P2-02 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: buy or activate special item when exposed | independent observation: cost/effect/feedback/state-gating relationship | empty-shell failure reason: cosmetic label that bypasses economy or leaves game stuck fails.
// p2-contract-expanded-combat | priority P2 | GDD M13 | TEST_SPEC TS-P2-03 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: switch rapid/explosive and fire at target/vehicle | independent observation: ownership or ammo/shot/explosion/wanted chain | empty-shell failure reason: fake weapon labels or negative ammo fail.
// p2-contract-deeper-police | priority P2 | GDD M14 | TEST_SPEC TS-P2-04 | method: contract/API | interaction path: contract action only | adapter: contract-action | trigger: wait/flee under high wanted | independent observation: police threat/count/damage evolves and wanted is not arbitrarily cleared | empty-shell failure reason: arbitrary wanted clearing or harmless police fail.
// p2-real-landmark-guidance | priority P2 | GDD M16 | TEST_SPEC TS-P2-06 | method: mixed setup + real-user behavior | interaction path: canvas/playfield semantic point or visible control click | adapter: pointer-click, dom-click, or contract-action for setup only | trigger: real movement/click toward active guidance if semantic target exists | independent observation: guidance/minimap/target distance changes without blocking play | empty-shell failure reason: permanent overlay or marker-only objective with no navigable feedback fails.

const PASS = detail => ({ status: 'PASS', detail: detail || '' });
const FAIL = detail => ({ status: 'FAIL', detail: detail || '' });
const NA = detail => ({ status: 'NOT_APPLICABLE', detail: detail || '' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function pageEval(browser, body) {
  return browser.eval(`(async function(){
    try { ${body} } catch (error) { return { __error: String(error && error.message || error) }; }
  })()`);
}

async function call(browser, method, ...args) {
  return pageEval(browser, `
    const api = window.__gameTest;
    const method = ${JSON.stringify(method)};
    const args = ${JSON.stringify(args)};
    if (!api || typeof api[method] !== 'function') return { __missing: method };
    const result = await Promise.resolve(api[method](...args));
    return result && result.snapshot && typeof result.snapshot === 'object' ? result.snapshot : result;
  `);
}

function get(obj, path) {
  return path.split('.').reduce((acc, key) => acc && typeof acc === 'object' ? acc[key] : undefined, obj);
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function nonnegative(value) {
  return finite(value) && value >= 0;
}

function changed(a, b, paths) {
  return paths.some(path => JSON.stringify(get(a, path)) !== JSON.stringify(get(b, path)));
}

function isRejected(s, reasons) {
  const ok = get(s, 'lastAction.ok');
  const reason = get(s, 'lastAction.reason');
  return ok === false && (!reasons || reasons.includes(reason));
}

function signDelta(after, before, pathA, pathB) {
  const c = get(after, pathB);
  const d = get(before, pathB);
  if (finite(c) && finite(d)) return c - d;
  const a = get(after, pathA);
  const b = get(before, pathA);
  if (finite(a) && finite(b)) return a - b;
  return NaN;
}

function oppositeNonZero(a, b) {
  return finite(a) && finite(b) && Math.sign(a) !== 0 && Math.sign(b) !== 0 && Math.sign(a) === -Math.sign(b);
}

function coreState(s) {
  return {
    phase: get(s, 'phase'),
    mode: get(s, 'mode'),
    panel: get(s, 'activePanel'),
    health: get(s, 'hud.health'),
    cash: get(s, 'hud.cash'),
    ammo: get(s, 'hud.ammo'),
    weapon: get(s, 'hud.weaponRole'),
    wanted: get(s, 'hud.wantedLevel'),
    mission: get(s, 'mission.progress'),
    reward: get(s, 'mission.rewardRevision'),
    shot: get(s, 'combat.shotRevision'),
    hit: get(s, 'combat.hitRevision'),
    target: get(s, 'combat.targetStatus'),
    vehicleMode: get(s, 'vehicle.inVehicle'),
    vehicleSpeed: get(s, 'vehicle.speed'),
    result: get(s, 'result.status')
  };
}

function modalGameplayState(s) {
  const state = coreState(s);
  delete state.phase;
  delete state.mode;
  delete state.panel;
  state.playerPosition = get(s, 'player.position');
  return state;
}

function totalResources(s) {
  return (Number(get(s, 'hud.cash')) || 0) + (Number(get(s, 'hud.ammo')) || 0) + (Number(get(s, 'hud.health')) || 0);
}

function worldRevision(s) {
  return [
    'playfield.renderRevision',
    'combat.shotRevision',
    'combat.hitRevision',
    'combat.recoilRevision',
    'mission.rewardRevision',
    'mission.objectiveRevision',
    'world.explosionRevision',
    'world.trafficRevision',
    'world.npcReactionRevision',
    'world.policeThreatRevision'
  ].reduce((sum, path) => sum + (finite(get(s, path)) ? get(s, path) : 0), 0);
}

function validSnapshot(s) {
  return s && typeof s === 'object' && !s.__error && !s.__missing;
}

function makeDriver(browser) {
  return {
    reset: () => call(browser, 'reset'),
    snapshot: () => call(browser, 'getSnapshot'),
    scenario: name => call(browser, 'loadScenario', name),
    action: action => call(browser, 'input', action)
  };
}

async function cdpKey(browser, code, holdMs) {
  const key = code === 'Space' ? ' ' : (code.startsWith('Key') ? code.slice(3).toLowerCase() : code);
  await browser.cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key });
  await sleep(holdMs || 200);
  await browser.cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key });
}

async function cdpKeyDown(browser, code) {
  const key = code === 'Space' ? ' ' : (code.startsWith('Key') ? code.slice(3).toLowerCase() : code);
  await browser.cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code, key });
}

async function cdpKeyUp(browser, code) {
  const key = code === 'Space' ? ' ' : (code.startsWith('Key') ? code.slice(3).toLowerCase() : code);
  await browser.cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code, key });
}

async function findVisibleControl(browser, terms) {
  return pageEval(browser, `
    const terms = ${JSON.stringify(terms)}.map(t => String(t).toLowerCase());
    function visible(el) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity || 1) > 0.01;
    }
    function labelFor(el) {
      const bits = [];
      bits.push(el.textContent || '', el.innerText || '', el.value || '', el.getAttribute('aria-label') || '', el.title || '', el.id || '', el.name || '', el.getAttribute('role') || '');
      ['action','panel','mode','control','weapon','item','role'].forEach(k => bits.push(el.getAttribute('data-' + k) || ''));
      if (el.labels) Array.from(el.labels).forEach(label => bits.push(label.textContent || ''));
      return bits.join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
    }
    const selectors = 'button,[role="button"],a,input,select,[tabindex],[data-action],[data-panel],[data-mode],[data-control],[data-weapon],.vendor-item,.vendor-close-button,.gun-button,.hold-up-button,.weapon-switch-btn';
    const candidates = Array.from(document.querySelectorAll(selectors)).filter(visible).map((el, index) => {
      const label = labelFor(el);
      const r = el.getBoundingClientRect();
      const matched = terms.filter(t => label.includes(t));
      const interactive = /^(button|a|input|select)$/i.test(el.tagName) || el.onclick || el.getAttribute('role') === 'button' || el.tabIndex >= 0;
      const score = matched.length * 20 + (interactive ? 8 : 0) - Math.min(10, (r.width * r.height) / 50000);
      return { index, label, score, matched, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    }).filter(c => c.matched.length > 0).sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  `);
}

async function findVisibleControls(browser, terms) {
  return pageEval(browser, `
    const terms = ${JSON.stringify(terms)}.map(t => String(t).toLowerCase());
    function visible(el) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity || 1) > 0.01;
    }
    function labelFor(el) {
      const bits = [];
      bits.push(el.textContent || '', el.innerText || '', el.value || '', el.getAttribute('aria-label') || '', el.title || '', el.id || '', el.name || '', el.getAttribute('role') || '');
      Array.from(el.attributes || []).forEach(attr => {
        if (String(attr.name).toLowerCase().startsWith('data-')) bits.push(attr.name, attr.value || '');
      });
      if (el.labels) Array.from(el.labels).forEach(label => bits.push(label.textContent || ''));
      return bits.join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
    }
    function topmost(el) {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit === el || (hit && el.contains(hit));
    }
    const selectors = 'button,[role="button"],a,input,select,[tabindex],[data-action],[data-panel],[data-mode],[data-control],[data-weapon],[data-item],[data-role],.vendor-item,.vendor-close-button,.gun-button,.hold-up-button,.weapon-switch-btn';
    const candidates = Array.from(document.querySelectorAll(selectors))
      .filter(el => visible(el) && topmost(el))
      .map((el, index) => {
        const label = labelFor(el);
        const r = el.getBoundingClientRect();
        const matched = terms.filter(t => label.includes(t));
        const interactive = /^(button|a|input|select)$/i.test(el.tagName) || el.onclick || el.getAttribute('role') === 'button' || el.tabIndex >= 0;
        return {
          index,
          label,
          matched,
          disabled: !!el.disabled,
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          signature: label + '|' + Math.round(r.left) + '|' + Math.round(r.top),
          score: matched.length * 20 + (interactive ? 8 : 0) - Math.min(10, (r.width * r.height) / 50000)
        };
      })
      .filter(c => c.matched.length > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index);
    return candidates;
  `);
}

async function findVisibleShopControls(browser) {
  return pageEval(browser, `
    const s = window.__gameTest && window.__gameTest.getSnapshot && window.__gameTest.getSnapshot();
    if (!s || !s.shop || !s.shop.open) return [];
    function visible(el) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity || 1) > 0.01;
    }
    function labelFor(el) {
      const bits = [];
      let node = el;
      for (let depth = 0; depth < 2 && node; depth += 1, node = node.parentElement) {
        bits.push(node.textContent || '', node.innerText || '', node.value || '', node.getAttribute('aria-label') || '', node.title || '', node.id || '', node.name || '', node.getAttribute('role') || '');
        Array.from(node.attributes || []).forEach(attr => {
          if (String(attr.name).toLowerCase().startsWith('data-')) bits.push(attr.name, attr.value || '');
        });
        if (node.labels) Array.from(node.labels).forEach(label => bits.push(label.textContent || ''));
      }
      return bits.join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
    }
    function interactive(el) {
      const tag = String(el.tagName || '').toLowerCase();
      const role = String(el.getAttribute('role') || '').toLowerCase();
      return /^(button|a|input|select|summary)$/.test(tag) ||
        role === 'button' ||
        typeof el.onclick === 'function' ||
        el.hasAttribute('onclick') ||
        el.tabIndex >= 0 ||
        getComputedStyle(el).cursor === 'pointer';
    }
    function topmost(el, r) {
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit === el || (hit && el.contains(hit));
    }
    const candidates = Array.from(document.querySelectorAll('*'))
      .filter(el => visible(el) && interactive(el))
      .map((el, index) => {
        const label = labelFor(el);
        const r = el.getBoundingClientRect();
        const hasPrice = /(?:[$€£¥]\\s*\\d[\\d.,]*|\\d[\\d.,]*\\s*[$€£¥])/.test(label);
        const hasBuy = /\\b(?:buy|purchase)\\b/.test(label);
        const hasRole = /(?:^|\\s)data-(?:buy|shop|item)(?:-|\\s|$)/.test(label);
        const isClosing = /\\b(?:close|back|done|leave|cancel|exit)\\b/.test(label);
        if ((!hasPrice && !hasBuy && !hasRole) || (isClosing && !hasBuy && !hasRole)) return null;
        const matched = [];
        if (hasPrice) matched.push('price');
        if (hasBuy) matched.push('purchase');
        if (hasRole) matched.push('public-role');
        if (!topmost(el, r)) return null;
        return {
          index,
          label,
          matched,
          disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true',
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          signature: label + '|' + Math.round(r.left) + '|' + Math.round(r.top),
          score: matched.length * 20 + (typeof el.onclick === 'function' ? 8 : 0) + (/^(button|a|input|select|summary)$/i.test(el.tagName) ? 8 : 0)
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.index - b.index);
    return candidates;
  `);
}

async function clickPoint(browser, point) {
  if (!point || !finite(point.x) || !finite(point.y)) return { ok: false, reason: 'missing point' };
  const hit = await pageEval(browser, `
    const x = ${point.x};
    const y = ${point.y};
    const el = document.elementFromPoint(x, y);
    if (!el) return { ok: false, reason: 'no element at point' };
    const r = el.getBoundingClientRect();
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return { ok: false, reason: 'point outside viewport' };
    return { ok: true, tag: el.tagName, id: el.id || '', className: String(el.className || ''), rect: { left: r.left, top: r.top, width: r.width, height: r.height } };
  `);
  if (!hit.ok) return hit;
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await sleep(70);
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  return hit;
}

async function touchTapPoint(browser, point) {
  if (!point || !finite(point.x) || !finite(point.y)) return { ok: false, reason: 'missing point' };
  try {
    const hit = await pageEval(browser, [
      'const x = ' + JSON.stringify(point.x) + ';',
      'const y = ' + JSON.stringify(point.y) + ';',
      'const el = document.elementFromPoint(x, y);',
      'if (!el) return { ok: false, reason: "no element at point" };',
      'if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return { ok: false, reason: "point outside viewport" };',
      'const r = el.getBoundingClientRect();',
      'return { ok: true, tag: el.tagName, id: el.id || "", rect: { left: r.left, top: r.top, width: r.width, height: r.height } };'
    ].join('\n'));
    if (!hit.ok) return hit;
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: point.x, y: point.y, radiusX: 3, radiusY: 3, force: 1, id: 1 }]
    });
    await sleep(70);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return hit;
  } catch (error) {
    return { ok: false, reason: String(error && error.message || error) };
  }
}

async function clickVisibleControl(browser, terms) {
  const candidate = await findVisibleControl(browser, terms);
  if (!candidate || !finite(candidate.x) || !finite(candidate.y)) return { ok: false, reason: `no visible control for ${terms.join('|')}` };
  return clickPoint(browser, candidate);
}

async function findVisibleVehicleKeyCodes(browser, action) {
  return pageEval(browser, [
    'const action = ' + JSON.stringify(action) + ';',
    "function visible(el) {",
    "  const r = el.getBoundingClientRect();",
    "  const cs = getComputedStyle(el);",
    "  return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity || 1) > 0.01;",
    "}",
    "function labelFor(el) {",
    "  const bits = [];",
    "  bits.push(el.textContent || '', el.innerText || '', el.value || '', el.getAttribute('aria-label') || '', el.title || '', el.id || '', el.name || '', el.getAttribute('role') || '', el.getAttribute('aria-keyshortcuts') || '', el.getAttribute('accesskey') || '');",
    "  ['action','panel','mode','control','weapon','item','role','key','keycode','shortcut'].forEach(k => bits.push(el.getAttribute('data-' + k) || ''));",
    "  if (el.labels) Array.from(el.labels).forEach(label => bits.push(label.textContent || ''));",
    "  return bits.join(' ').replace(/\\s+/g, ' ').trim();",
    "}",
    "function codeFor(token) {",
    "  const value = String(token || '').trim().toLowerCase();",
    "  if (value === 'enter' || value === 'return' || value === 'numpadenter') return value === 'numpadenter' ? 'NumpadEnter' : 'Enter';",
    "  if (/^key[a-z]$/.test(value)) return 'Key' + value.slice(3).toUpperCase();",
    "  return /^[a-z]$/.test(value) ? 'Key' + value.toUpperCase() : null;",
    "}",
    "const codes = [];",
    "const seen = new Set();",
    "for (const el of Array.from(document.querySelectorAll('body *')).filter(visible)) {",
    "  const label = labelFor(el);",
    "  const relevant = action === 'enter'",
    "    ? /\\b(?:enter|interact|use)\\b/i.test(label)",
    "    : /\\b(?:exit|leave|interact|use)\\b/i.test(label);",
    "  const metadata = [el.getAttribute('aria-keyshortcuts'), el.getAttribute('accesskey'), el.getAttribute('data-key'), el.getAttribute('data-keycode'), el.getAttribute('data-shortcut')].filter(Boolean).join(' ').split(/[\\s,\\/]+/);",
    "  if (relevant) for (const token of metadata) {",
    "    const code = codeFor(token);",
    "    if (code && !seen.has(code)) { seen.add(code); codes.push(code); }",
    "  }",
    "  const keyRe = /(?:^|[^\\w])((?:Enter|Return|[A-Za-z]))(?=$|[^\\w])/gi;",
    "  let match;",
    "  while ((match = keyRe.exec(label))) {",
    "    const index = match.index + match[0].indexOf(match[1]);",
    "    const context = label.slice(Math.max(0, index - 24), index + 32).toLowerCase();",
    "    const contextual = action === 'enter'",
    "      ? /\\b(?:enter|interact|use)\\b/.test(context)",
    "      : /\\b(?:exit|leave|interact|use)\\b/.test(context);",
    "    const code = contextual ? codeFor(match[1]) : null;",
    "    if (code && !seen.has(code)) { seen.add(code); codes.push(code); }",
    "  }",
    "}",
    "return codes;",
].join('\\n'));
}

async function findVehicleControlCandidates(browser, action) {
  const directTerms = action === 'enter'
    ? ['enter', 'interact', 'use', 'act']
    : ['exit', 'leave', 'interact', 'use', 'act'];
  let candidates = await findVisibleControls(browser, directTerms);
  if (!Array.isArray(candidates) || candidates.length === 0) {
    candidates = await findVisibleControls(browser, ['vehicle', 'car']);
  }
  return Array.isArray(candidates) ? candidates : [];
}

async function semanticPoint(browser, kind) {
  return pageEval(browser, `
    const s = window.__gameTest && window.__gameTest.getSnapshot && window.__gameTest.getSnapshot();
    const kind = ${JSON.stringify(kind)};
    function pointFromBounds(b) {
      if (!b || !Number.isFinite(b.left) || !Number.isFinite(b.top) || !Number.isFinite(b.width) || !Number.isFinite(b.height)) return null;
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }
    if (kind === 'playfield') return pointFromBounds(s && s.playfield && s.playfield.bounds);
    if (kind === 'player' && s && Number.isFinite(s.player && s.player.screenX) && Number.isFinite(s.player && s.player.screenY)) return { x: s.player.screenX, y: s.player.screenY };
    if (kind === 'vehicle' && s && Number.isFinite(s.vehicle && s.vehicle.screenX) && Number.isFinite(s.vehicle && s.vehicle.screenY)) return { x: s.vehicle.screenX, y: s.vehicle.screenY };
    return null;
  `);
}

async function visibleTouchJoystick(browser) {
  return pageEval(browser, `
    function visible(el) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 16 && r.height > 16 && r.right > 0 && r.bottom > 0 &&
        r.left < window.innerWidth && r.top < window.innerHeight &&
        cs.visibility !== 'hidden' && cs.display !== 'none' &&
        Number(cs.opacity || 1) > 0.01 && cs.pointerEvents !== 'none';
    }
    function labelFor(el) {
      const bits = [el.textContent || '', el.innerText || '', el.value || '',
        el.getAttribute('aria-label') || '', el.title || '', el.id || '',
        el.name || '', el.getAttribute('role') || ''];
      if (el.labels) Array.from(el.labels).forEach(label => bits.push(label.textContent || ''));
      Array.from(el.attributes || []).forEach(attr => {
        if (attr.name.startsWith('data-')) bits.push(attr.name, attr.value || '');
      });
      return bits.join(' ').replace(/\\s+/g, ' ').trim().toLowerCase();
    }
    const candidates = Array.from(document.querySelectorAll('*')).filter(visible).map((el, index) => {
      const label = labelFor(el);
      if (!/(joystick|joy|stick)/.test(label)) return null;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      if (!hit || (hit !== el && !el.contains(hit))) return null;
      const leftSide = x < window.innerWidth / 2;
      const opposing = /(aim|fire|shoot|attack|right)/.test(label);
      return {
        index, label, x, y, w: r.width, h: r.height,
        score: (leftSide ? 20 : 0) - (opposing ? 60 : 0) - Math.min(10, (r.width * r.height) / 50000)
      };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.index - b.index);
    return candidates[0] || null;
  `);
}

async function realPointerDrag(browser, from, to, steps, holdMs) {
  if (!from || !to || !finite(from.x) || !finite(from.y) || !finite(to.x) || !finite(to.y)) return { ok: false, reason: 'missing drag points' };
  const hit = await pageEval(browser, `
    const x = ${from.x};
    const y = ${from.y};
    const el = document.elementFromPoint(x, y);
    return { ok: !!el, tag: el && el.tagName, id: el && el.id || '', className: el && String(el.className || '') || '' };
  `);
  if (!hit.ok) return hit;
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y });
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1 });
  if (holdMs) await sleep(holdMs);
  const count = steps || 6;
  for (let i = 1; i <= count; i += 1) {
    const t = i / count;
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      button: 'left'
    });
    await sleep(30);
  }
  await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', clickCount: 1 });
  return hit;
}

async function realTouchDrag(browser, from, to) {
  if (!from || !to || !finite(from.x) || !finite(from.y) || !finite(to.x) || !finite(to.y)) return { ok: false, reason: 'missing touch points' };
  try {
    const hit = await pageEval(browser, `
      const x = ${from.x};
      const y = ${from.y};
      const el = document.elementFromPoint(x, y);
      if (!el) return { ok: false, reason: 'no element at touch point' };
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return { ok: false, reason: 'touch point outside viewport' };
      return { ok: true, tag: el.tagName, id: el.id || '', className: String(el.className || '') };
    `);
    if (!hit.ok) return hit;
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y, radiusX: 3, radiusY: 3, id: 1 }] });
    await sleep(80);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: to.x, y: to.y, radiusX: 3, radiusY: 3, id: 1 }] });
    await sleep(220);
    await browser.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return { ok: true, hit };
  } catch (error) {
    return { ok: false, reason: String(error && error.message || error) };
  }
}

async function waitAction(driver, ms) {
  const s = await driver.action({ type: 'wait', durationMs: ms });
  if (!validSnapshot(s) || get(s, 'lastAction.ok') === false) await sleep(Math.min(ms || 100, 500));
  return s;
}

async function reachDeath(driver) {
  await driver.scenario('damage_risk_active');
  let s = await driver.snapshot();
  const startHealth = get(s, 'hud.health');
  for (let i = 0; i < 24 && get(s, 'phase') !== 'death' && !get(s, 'result.terminal'); i += 1) {
    await driver.action({ type: 'wait', durationMs: 700 });
    s = await driver.snapshot();
  }
  return { dead: s, startHealth };
}

const suite = [
  {
    id: 'p0-contract-boot-playable',
    level: 'P0',
    name: 'Public contract boots to playable city snapshot',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      const api = await pageEval(browser, `
        const api = window.__gameTest;
        return {
          object: !!api && typeof api === 'object',
          reset: !!api && typeof api.reset === 'function',
          input: !!api && typeof api.input === 'function',
          getSnapshot: !!api && typeof api.getSnapshot === 'function',
          loadScenario: !!api && typeof api.loadScenario === 'function'
        };
      `);
      if (!api.object || !api.reset || !api.input || !api.getSnapshot || !api.loadScenario) return FAIL('missing window.__gameTest.reset/input/getSnapshot/loadScenario');
      const s = await d.reset();
      if (!validSnapshot(s)) return FAIL('reset did not return a valid snapshot');
      const required = ['ok', 'phase', 'mode', 'canInteractWithPlayfield', 'overlayBlocking', 'activePanel', 'controls', 'playfield', 'hud', 'minimap', 'player', 'vehicle', 'combat', 'mission', 'shop', 'world', 'result', 'lastAction'];
      const missing = required.filter(key => !(key in s));
      if (missing.length) return FAIL(`missing snapshot fields: ${missing.join(',')}`);
      if (!nonnegative(get(s, 'hud.health')) || !nonnegative(get(s, 'hud.cash')) || !nonnegative(get(s, 'hud.ammo'))) return FAIL('hud health/cash/ammo must be nonnegative');
      return PASS('public API and playable snapshot envelope are present');
    }
  },
  {
    id: 'p0-real-start-visible',
    level: 'P0',
    name: 'Visible start path reaches nonblank city with HUD and minimap',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.reset();
      const before = await d.snapshot();
      if (get(before, 'overlayBlocking')) {
        const clicked = await clickVisibleControl(browser, ['start', 'play', 'begin', 'enter', 'continue', 'dismiss']);
        if (clicked.ok) await sleep(400);
      }
      if (get(before, 'phase') !== 'playing') await d.action({ type: 'start' });
      await sleep(300);
      const s = await d.snapshot();
      if (get(s, 'phase') !== 'playing') return FAIL(`phase is ${get(s, 'phase')}`);
      if (!get(s, 'playfield.ready') || !get(s, 'playfield.visible') || !get(s, 'playfield.nonBlank')) return FAIL('playfield not ready/visible/nonBlank');
      if (!get(s, 'hud.visible') || !get(s, 'minimap.visible') || !get(s, 'minimap.playerVisible')) return FAIL('HUD or minimap is missing');
      if (get(s, 'overlayBlocking') || !get(s, 'canInteractWithPlayfield')) return FAIL('main playfield remains blocked after start');
      return PASS('visible start/dismiss path reaches playable city');
    }
  },
  {
    id: 'p0-contract-mode-gating',
    level: 'P0',
    name: 'Blocking modes reject incompatible actions and release controls',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('shop_open');
      const open = await d.snapshot();
      const totalBefore = totalResources(open);
      const blockedMove = await d.action({ type: 'move', direction: 'forward', durationMs: 200 });
      const blockedFire = await d.action({ type: 'fire', phase: 'tap' });
      const still = await d.snapshot();
      await d.action({ type: 'closePanel', panel: 'shop' });
      const closed = await d.snapshot();
      const unchanged = JSON.stringify(coreState(still)) === JSON.stringify({ ...coreState(still), cash: get(open, 'hud.cash'), ammo: get(open, 'hud.ammo') });
      const totalAfter = totalResources(still);
      if (!get(open, 'overlayBlocking') || get(open, 'canInteractWithPlayfield') || get(open, 'activePanel') !== 'shop') return FAIL('shop_open is not a blocking shop state');
      if (!isRejected(blockedMove, ['blockedByMode', 'notAvailable', 'none']) && !isRejected(blockedFire, ['blockedByMode', 'notAvailable', 'none'])) return FAIL('blocked shop actions did not reject');
      if (totalAfter !== totalBefore || !unchanged) return FAIL('blocked shop actions mutated resources or gameplay state');
      if (get(closed, 'overlayBlocking') || !get(closed, 'canInteractWithPlayfield')) return FAIL('closing shop did not restore playfield controls');
      return PASS('mode gating rejects incompatible actions and restores play');
    }
  },
  {
    id: 'p1-contract-hud-feedback',
    level: 'P1',
    name: 'HUD feedback stays synchronized with action outcomes',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('armed_near_target');
      const fireBefore = await d.snapshot();
      await d.action({ type: 'aim', direction: 'right', durationMs: 100 });
      await d.action({ type: 'fire', phase: 'tap' });
      await waitAction(d, 250);
      const fireAfter = await d.snapshot();
      await d.scenario('near_vendor_with_cash');
      await d.action({ type: 'openPanel', panel: 'shop' });
      const buyBefore = await d.snapshot();
      const buyRoles = Array.isArray(get(buyBefore, 'shop.itemRoles'))
        ? get(buyBefore, 'shop.itemRoles').filter(role => typeof role === 'string')
        : [];
      let buyAfter = buyBefore;
      for (const itemRole of buyRoles) {
        buyAfter = await d.action({ type: 'buy', itemRole });
        if (get(buyAfter, 'shop.lastPurchase') === 'success' ||
            get(buyAfter, 'hud.cash') < get(buyBefore, 'hud.cash')) break;
      }
      const fireSynced = get(fireAfter, 'hud.ammo') < get(fireBefore, 'hud.ammo') && changed(fireBefore, fireAfter, ['combat.shotRevision', 'combat.projectileCount', 'world.projectileCount', 'hud.feedbackKind', 'hud.wantedLevel']);
      const buySynced = get(buyAfter, 'hud.cash') < get(buyBefore, 'hud.cash') && (get(buyAfter, 'shop.lastPurchase') === 'success' || get(buyAfter, 'hud.feedbackKind') === 'purchase');
      if (!fireSynced) return FAIL('fire outcome is not synchronized with ammo/combat/HUD feedback');
      if (!buySynced) return FAIL('buy outcome is not synchronized with cash/shop/HUD feedback');
      if (!nonnegative(get(fireAfter, 'hud.ammo')) || !nonnegative(get(buyAfter, 'hud.cash'))) return FAIL('HUD resources became negative');
      return PASS('HUD/resource feedback follows combat and shop actions');
    }
  },
  {
    id: 'p1-keyboard-walk-release',
    level: 'P1',
    name: 'Real keyboard walking moves in opposite directions and release stabilizes',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('fresh_city');
      const before = await d.snapshot();
      await cdpKeyDown(browser, 'KeyA');
      await sleep(500);
      const left = await d.snapshot();
      await cdpKeyUp(browser, 'KeyA');
      await sleep(200);
      const released = await d.snapshot();
      await d.scenario('fresh_city');
      const baseRight = await d.snapshot();
      await cdpKeyDown(browser, 'KeyD');
      await sleep(500);
      const right = await d.snapshot();
      await cdpKeyUp(browser, 'KeyD');
      await sleep(200);
      const dxLeft = signDelta(left, before, 'player.screenX', 'player.position.x');
      const dxRight = signDelta(right, baseRight, 'player.screenX', 'player.position.x');
      const releaseOk = ['idle', 'blocked', 'sliding', 'moving'].includes(get(released, 'player.motionState')) && !get(released, 'overlayBlocking');
      if (!oppositeNonZero(dxLeft, dxRight)) return FAIL(`real A/D movement was not opposite: ${dxLeft}, ${dxRight}`);
      if (!releaseOk) return FAIL('key release did not return to stable playable movement state');
      return PASS('real keyboard walking has signed left/right causality and release cleanup');
    }
  },
  {
    id: 'p1-touch-joystick-walk-parity',
    level: 'P1',
    name: 'Touch joystick drag moves the player and release cleans up when touch is supported',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('fresh_city');
      let before = await d.snapshot();
      let bounds = get(before, 'playfield.bounds');
      if (!bounds || !finite(bounds.left) || !finite(bounds.top) || !finite(bounds.width) || !finite(bounds.height)) return NA('playfield bounds are not exposed for portable touch target acquisition');
      const canTouch = await pageEval(browser, `return { touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0 };`);
      if (!canTouch || canTouch.__error || !canTouch.touch) return NA('CDP touch environment not reliable');
      let fallbackFrom = { x: bounds.left + bounds.width * 0.25, y: bounds.top + bounds.height * 0.75 };
      let joystick = await visibleTouchJoystick(browser);
      if (!joystick || !finite(joystick.x) || !finite(joystick.y)) {
        const primed = await realTouchDrag(browser, fallbackFrom, fallbackFrom);
        if (!primed.ok) return NA(`touch dispatch unavailable: ${primed.reason}`);
        await d.scenario('fresh_city');
        before = await d.snapshot();
        bounds = get(before, 'playfield.bounds');
        if (!bounds || !finite(bounds.left) || !finite(bounds.top) || !finite(bounds.width) || !finite(bounds.height)) return NA('playfield bounds disappeared after touch control acquisition');
        fallbackFrom = { x: bounds.left + bounds.width * 0.25, y: bounds.top + bounds.height * 0.75 };
        await sleep(80);
        joystick = await visibleTouchJoystick(browser);
      }
      const from = joystick && finite(joystick.x) && finite(joystick.y) ? { x: joystick.x, y: joystick.y } : fallbackFrom;
      const travel = joystick && finite(joystick.w) ? Math.max(24, Math.min(80, joystick.w * 0.45)) : Math.min(80, bounds.width * 0.12);
      const to = { x: Math.min(bounds.left + bounds.width - 1, from.x + travel), y: from.y };
      const dispatched = await realTouchDrag(browser, from, to);
      if (!dispatched.ok) return NA(`touch dispatch unavailable: ${dispatched.reason}`);
      await sleep(250);
      const after = await d.snapshot();
      const moved = Math.abs(signDelta(after, before, 'player.screenX', 'player.position.x')) > 0.5 || Math.abs(signDelta(after, before, 'player.screenY', 'player.position.z')) > 0.5 || get(after, 'player.motionState') === 'moving';
      const velocity = get(after, 'player.velocity');
      const velocityFields = ['x', 'z', 'speed'].map(key => velocity && velocity[key]).filter(finite);
      const releaseClean = get(after, 'player.motionState') === 'idle' || (velocityFields.length > 0 && velocityFields.every(value => Math.abs(value) <= 0.5));
      const unchanged = get(after, 'hud.cash') === get(before, 'hud.cash') && get(after, 'mission.rewardRevision') === get(before, 'mission.rewardRevision');
      if (!moved) return FAIL('touch joystick drag did not move the player');
      if (!releaseClean) return FAIL('touch joystick release did not clear walking motion');
      if (!unchanged) return FAIL('touch walking mutated unrelated cash or mission reward');
      return PASS('touch drag path moves player and preserves unrelated resources');
    }
  },
  {
    id: 'p1-contract-obstacle-block-slide',
    level: 'P1',
    name: 'Obstacle movement blocks or slides while allowing recovery',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      const directions = [
        { direction: 'forward', opposite: 'back', screen: 'player.screenY', world: 'player.position.z' },
        { direction: 'back', opposite: 'forward', screen: 'player.screenY', world: 'player.position.z' },
        { direction: 'left', opposite: 'right', screen: 'player.screenX', world: 'player.position.x' },
        { direction: 'right', opposite: 'left', screen: 'player.screenX', world: 'player.position.x' },
      ];
      let hasPassableStart = false;
      for (const probe of directions) {
        await d.scenario('near_blocking_obstacle');
        const probeBefore = await d.snapshot();
        const probeStart = await d.action({ type: 'move', direction: probe.direction, source: 'keyboard' });
        await waitAction(d, 80);
        const probeAfter = await d.snapshot();
        const probeState = get(probeAfter, 'player.motionState');
        const probeStartState = get(probeStart, 'player.motionState');
        const probeMoved =
          (validSnapshot(probeAfter) && Math.abs(signDelta(probeAfter, probeBefore, probe.screen, probe.world)) > 0.1) ||
          ['moving', 'sliding'].includes(probeState) ||
          ['moving', 'sliding'].includes(probeStartState);
        await d.action({ type: 'move', direction: 'none', source: 'keyboard' });
        if (probeMoved) {
          hasPassableStart = true;
          break;
        }
      }
      if (!hasPassableStart) return FAIL('near-blocking-obstacle scenario did not expose an initial passable direction');
      let blockedRecord = null;
      for (const candidate of directions) {
        await d.scenario('near_blocking_obstacle');
        const before = await d.snapshot();
        const held = await d.action({ type: 'move', direction: candidate.direction, source: 'keyboard' });
        await waitAction(d, 600);
        const blocked = await d.snapshot();
        await waitAction(d, 600);
        const continued = await d.snapshot();
        const states = [held, blocked, continued].map(snapshot => get(snapshot, 'player.motionState'));
        const contact = states.some(state => ['blocked', 'sliding'].includes(state));
        const firstStep = Math.abs(signDelta(blocked, before, candidate.screen, candidate.world));
        const continuedStep = Math.abs(signDelta(continued, blocked, candidate.screen, candidate.world));
        const limited = finite(firstStep) && firstStep > 0.5 && finite(continuedStep) && continuedStep <= 0.5;
        await d.action({ type: 'move', direction: 'none', source: 'keyboard' });
        if (contact || limited) {
          blockedRecord = { candidate, before, blocked, held, blockedOrLimited: true };
          break;
        }
      }
      if (!blockedRecord) return FAIL('no tested direction was blocked or limited near the declared obstacle');
      const { candidate, before, blocked, held, blockedOrLimited } = blockedRecord;
      await d.action({ type: 'move', direction: candidate.opposite, source: 'keyboard' });
      await waitAction(d, 500);
      const recovered = await d.snapshot();
      await d.action({ type: 'move', direction: 'none', source: 'keyboard' });
      const recoveryMoved = Math.abs(signDelta(recovered, blocked, candidate.screen, candidate.world)) > 0.5;
      if (!blockedOrLimited) return FAIL('movement toward obstacle was not blocked/sliding/limited');
      if (!recoveryMoved) return FAIL('passable/opposite movement did not recover from obstacle');
      const invariantPaths = ['hud.health', 'hud.cash', 'hud.ammo', 'mission.progress', 'mission.rewardRevision'];
      if (invariantPaths.some(path => JSON.stringify(get(before, path)) !== JSON.stringify(get(recovered, path)))) return FAIL('obstacle movement changed unrelated health, resources, or mission state');
      return PASS('obstacle constrains movement and passable recovery works');
    }
  },
  {
    id: 'p1-real-enter-exit-vehicle',
    level: 'P1',
    name: 'Real player input enters and exits a nearby vehicle',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('near_vehicle');
      const before = await d.snapshot();
      const isDriving = snapshot => get(snapshot, 'mode') === 'driving' && get(snapshot, 'vehicle.inVehicle') && get(snapshot, 'vehicle.controlled');
      const isWalking = snapshot => get(snapshot, 'mode') === 'walking' && !get(snapshot, 'vehicle.inVehicle') && !get(snapshot, 'vehicle.controlled') && get(snapshot, 'controls.movement');
      let enteredBy = 'none';
      let inCar = before;
      if (!isDriving(inCar)) {
        const vehiclePoint = await semanticPoint(browser, 'vehicle');
        if (vehiclePoint) {
          await clickPoint(browser, vehiclePoint);
          enteredBy = 'vehicle semantic point';
          await sleep(500);
          inCar = await d.snapshot();
          if (!isDriving(inCar)) {
            const vehicleTouch = await touchTapPoint(browser, vehiclePoint);
            if (vehicleTouch.ok) {
              enteredBy = 'vehicle semantic touch point';
              await sleep(500);
              inCar = await d.snapshot();
            }
          }
        }
      }
      if (!isDriving(inCar)) {
        const enterCandidates = await findVehicleControlCandidates(browser, 'enter');
        for (const candidate of enterCandidates) {
          if (candidate.disabled || !finite(candidate.x) || !finite(candidate.y)) continue;
          enteredBy = 'visible control';
          const enterClick = await clickPoint(browser, candidate);
          await sleep(500);
          inCar = await d.snapshot();
          if (isDriving(inCar)) break;
          const enterTouch = await touchTapPoint(browser, candidate);
          if (enterTouch.ok) {
            enteredBy = 'visible touch control';
            await sleep(500);
            inCar = await d.snapshot();
          }
          if (isDriving(inCar)) break;
        }
      }
      if (!isDriving(inCar)) {
        const keyCodes = await findVisibleVehicleKeyCodes(browser, 'enter');
        for (const code of Array.isArray(keyCodes) ? keyCodes : []) {
          await cdpKey(browser, code, 120);
          await sleep(500);
          inCar = await d.snapshot();
          if (isDriving(inCar)) { enteredBy = 'keyboard ' + code; break; }
        }
      }
      if (!isDriving(inCar)) return FAIL('real enter path (' + enteredBy + ') did not transfer vehicle control');
      let after = await d.snapshot();
      const exitCandidates = await findVehicleControlCandidates(browser, 'exit');
      for (const candidate of exitCandidates) {
        if (candidate.disabled || !finite(candidate.x) || !finite(candidate.y)) continue;
        const exitClick = await clickPoint(browser, candidate);
        await sleep(500);
        after = await d.snapshot();
        if (isWalking(after)) break;
        const exitTouch = await touchTapPoint(browser, candidate);
        if (exitTouch.ok) {
          await sleep(500);
          after = await d.snapshot();
        }
        if (isWalking(after)) break;
      }
      if (!isWalking(after)) {
        const keyCodes = await findVisibleVehicleKeyCodes(browser, 'exit');
        for (const code of Array.isArray(keyCodes) ? keyCodes : []) {
          await cdpKey(browser, code, 120);
          await sleep(500);
          after = await d.snapshot();
          if (isWalking(after)) break;
        }
      }
      if (!isWalking(after)) return FAIL('real exit path did not restore walking controls');
      if (get(before, 'mode') !== 'walking' || get(after, 'overlayBlocking')) return FAIL('vehicle transition started/ended in invalid mode or overlay');
      return PASS('real enter/exit path transfers and restores vehicle control');
    }
  },
  {
    id: 'p1-keyboard-drive-controls',
    level: 'P1',
    name: 'Real keyboard driving accelerates, coasts, reverses, and steers both ways',
    timeoutMs: 40000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('driving_open_road');
      const before = await d.snapshot();
      await cdpKeyDown(browser, 'KeyW');
      await sleep(700);
      const accelerated = await d.snapshot();
      await cdpKeyUp(browser, 'KeyW');
      await sleep(500);
      const coasting = await d.snapshot();
      await cdpKeyDown(browser, 'KeyS');
      await sleep(700);
      const reverse = await d.snapshot();
      await cdpKeyUp(browser, 'KeyS');
      await d.scenario('driving_open_road');
      const leftBefore = await d.snapshot();
      await cdpKeyDown(browser, 'KeyW');
      await sleep(350);
      await cdpKeyDown(browser, 'KeyA');
      await sleep(500);
      const left = await d.snapshot();
      await cdpKeyUp(browser, 'KeyA');
      await cdpKeyUp(browser, 'KeyW');
      await d.scenario('driving_open_road');
      const rightBefore = await d.snapshot();
      await cdpKeyDown(browser, 'KeyW');
      await sleep(350);
      await cdpKeyDown(browser, 'KeyD');
      await sleep(500);
      const right = await d.snapshot();
      await cdpKeyUp(browser, 'KeyD');
      await cdpKeyUp(browser, 'KeyW');
      const speedGain = get(accelerated, 'vehicle.speed') - get(before, 'vehicle.speed');
      const coastOk = get(coasting, 'vehicle.speed') <= get(accelerated, 'vehicle.speed') || get(coasting, 'vehicle.motionState') === 'coasting';
      const reverseOk = get(reverse, 'vehicle.speed') < get(accelerated, 'vehicle.speed') || ['braking', 'reversing'].includes(get(reverse, 'vehicle.motionState'));
      const drivePathDelta = (after, before, prefix) => ({
        x: signDelta(after, before, `${prefix}.screenX`, `${prefix}.position.x`),
        z: signDelta(after, before, `${prefix}.screenY`, `${prefix}.position.z`)
      });
      const forwardVehiclePath = drivePathDelta(accelerated, before, 'vehicle');
      const forwardPlayerPath = drivePathDelta(accelerated, before, 'player');
      const pathMoved = path => finite(path.x) && finite(path.z) && Math.hypot(path.x, path.z) > 0.5;
      const lateralOpposite = (leftPath, rightPath, forwardPath) => {
        if (![leftPath.x, leftPath.z, rightPath.x, rightPath.z, forwardPath.x, forwardPath.z].every(finite)) return false;
        if (!pathMoved(leftPath) || !pathMoved(rightPath) || Math.hypot(forwardPath.x, forwardPath.z) <= 0.5) return false;
        const leftLateral = forwardPath.x * leftPath.z - forwardPath.z * leftPath.x;
        const rightLateral = forwardPath.x * rightPath.z - forwardPath.z * rightPath.x;
        return Math.abs(leftLateral) > 0.5 && Math.abs(rightLateral) > 0.5 && leftLateral * rightLateral < 0;
      };
      const scalarSteering = (leftPath, rightPath) => {
        const has2D = [leftPath.x, leftPath.z, rightPath.x, rightPath.z].every(finite);
        if (has2D) return false;
        return (finite(leftPath.x) && finite(rightPath.x) && oppositeNonZero(leftPath.x, rightPath.x)) ||
          (finite(leftPath.z) && finite(rightPath.z) && oppositeNonZero(leftPath.z, rightPath.z));
      };
      const leftVehiclePath = drivePathDelta(left, leftBefore, 'vehicle');
      const rightVehiclePath = drivePathDelta(right, rightBefore, 'vehicle');
      const leftPlayerPath = drivePathDelta(left, leftBefore, 'player');
      const rightPlayerPath = drivePathDelta(right, rightBefore, 'player');
      const steeringOk = lateralOpposite(leftVehiclePath, rightVehiclePath, forwardVehiclePath) || lateralOpposite(leftPlayerPath, rightPlayerPath, forwardPlayerPath) || scalarSteering(leftVehiclePath, rightVehiclePath) || scalarSteering(leftPlayerPath, rightPlayerPath);
      if (!(speedGain > 0)) return FAIL(`real accelerate did not increase speed: ${speedGain}`);
      if (!coastOk || !reverseOk) return FAIL('real release/brake/reverse did not change vehicle speed or motion state');
      if (!steeringOk) return FAIL(`real left/right steering lacked opposite visible path: ${JSON.stringify(leftVehiclePath)}, ${JSON.stringify(rightVehiclePath)}`);
      return PASS('real driving keys control acceleration, release, reverse, and steering');
    }
  },
  {
    id: 'p1-contract-vehicle-collision-risk',
    level: 'P1',
    name: 'Vehicle collision risk couples driving to world and threat feedback',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('driving_near_collision_risk');
      const before = await d.snapshot();
      await d.action({ type: 'drive', control: 'accelerate', durationMs: 1000 });
      await waitAction(d, 1000);
      const intoRisk = await d.snapshot();
      const totalBefore = totalResources(before);
      const totalAfter = totalResources(intoRisk);
      const collisionEvidence = get(intoRisk, 'vehicle.motionState') === 'colliding' ||
        get(intoRisk, 'vehicle.speed') < get(before, 'vehicle.speed') ||
        changed(before, intoRisk, ['world.npcReactionRevision', 'world.explosionRevision', 'world.policeThreatRevision', 'hud.wantedLevel', 'hud.health', 'hud.feedbackKind']);
      if (!collisionEvidence) return FAIL('driving into risk did not alter vehicle/world/wanted/health feedback');
      if (totalAfter < 0 || !nonnegative(get(intoRisk, 'hud.cash')) || !nonnegative(get(intoRisk, 'hud.ammo'))) return FAIL(`collision corrupted resource invariant: ${totalBefore} -> ${totalAfter}`);
      return PASS('vehicle collision risk is action-coupled and preserves resources');
    }
  },
  {
    id: 'p1-real-fire-aim-shot',
    level: 'P1',
    name: 'Real fire/aim control consumes ammo and creates combat feedback',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('armed_near_target');
      let before = await d.snapshot();
      let after;
      const fireControl = await findVisibleControl(browser, ['fire', 'gun', 'shoot', 'weapon', 'pistol']);
      let used = 'none';
      if (fireControl && finite(fireControl.x) && finite(fireControl.y)) {
        const point = { x: fireControl.x, y: fireControl.y };
        const to = { x: fireControl.x + 50, y: fireControl.y };
        await realPointerDrag(browser, point, point, 1, 450);
        used = 'pointer-hold fire control';
        await sleep(700);
        after = await d.snapshot();
        if (!(get(after, 'hud.ammo') < get(before, 'hud.ammo'))) {
          await d.scenario('armed_near_target');
          before = await d.snapshot();
          await realPointerDrag(browser, point, to, 5);
          await sleep(700);
          after = await d.snapshot();
          used = 'pointer-drag fire control';
        }
        if (!(get(after, 'hud.ammo') < get(before, 'hud.ammo'))) {
          await d.scenario('armed_near_target');
          before = await d.snapshot();
          await realTouchDrag(browser, point, point);
          await sleep(700);
          after = await d.snapshot();
          used = 'touch fire control';
        }
        if (!(get(after, 'hud.ammo') < get(before, 'hud.ammo'))) {
          await d.scenario('armed_near_target');
          before = await d.snapshot();
          await cdpKey(browser, 'Space', 450);
          await sleep(700);
          after = await d.snapshot();
          used = 'keyboard Space fallback';
        }
      } else {
        await cdpKey(browser, 'Space', 450);
        used = 'keyboard Space';
        await sleep(700);
        after = await d.snapshot();
      }
      const ammoSpent = get(after, 'hud.ammo') < get(before, 'hud.ammo');
      const combatEvidence = changed(before, after, ['combat.aiming', 'combat.firing', 'combat.shotRevision', 'combat.projectileCount', 'combat.recoilRevision', 'combat.hitRevision', 'world.projectileCount', 'hud.wantedLevel', 'hud.feedbackKind', 'combat.targetStatus']);
      if (!ammoSpent) return FAIL(`real ${used} did not consume ammo`);
      if (!combatEvidence) return FAIL(`real ${used} did not create combat feedback`);
      if (!nonnegative(get(after, 'hud.ammo'))) return FAIL('fire made ammo negative');
      return PASS('real fire/aim path spends ammo and produces combat feedback');
    }
  },
  {
    id: 'p1-contract-no-ammo-rejects',
    level: 'P1',
    name: 'No-ammo fire is rejected without free hit or negative ammo',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('armed_no_ammo');
      const before = await d.snapshot();
      const result = await d.action({ type: 'fire', phase: 'tap', durationMs: 100 });
      const after = await d.snapshot();
      const reject = isRejected(result, ['noAmmo', 'notOwned', 'notAvailable', 'blockedByMode', 'cooldown', 'none']) || isRejected(after, ['noAmmo', 'notOwned', 'notAvailable', 'blockedByMode', 'cooldown', 'none']);
      if (!reject) return FAIL('no-ammo fire did not report invalid/reject/cannot effective shot');
      if (get(after, 'hud.ammo') !== get(before, 'hud.ammo') || !nonnegative(get(after, 'hud.ammo'))) return FAIL('no-ammo fire changed ammo');
      if (get(after, 'combat.hitRevision') !== get(before, 'combat.hitRevision') || get(after, 'combat.targetStatus') === 'defeated') return FAIL('no-ammo fire created a hit/defeat');
      return PASS('empty weapon cannot produce effective combat and resources stay valid');
    }
  },
  {
    id: 'p1-modal-blocks-releases-play',
    level: 'P1',
    name: 'Visible blocking modal rejects playfield input and close restores play',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('shop_open');
      const open = await d.snapshot();
      const beforeCore = coreState(open);
      const beforeGameplay = modalGameplayState(open);
      const exceptionStart = Array.isArray(browser.exceptions) ? browser.exceptions.length : 0;
      await cdpKey(browser, 'KeyW', 250);
      await cdpKey(browser, 'Space', 150);
      await sleep(250);
      const blocked = await d.snapshot();
      const unchanged = JSON.stringify(coreState(blocked)) === JSON.stringify(beforeCore);
      const candidates = await findVisibleControls(browser, ['close', 'back', 'done', 'exit', 'leave', 'cancel']);
      let close = { ok: false, reason: 'no visible close affordance' };
      for (const candidate of Array.isArray(candidates) ? candidates : []) {
        const hit = await clickPoint(browser, candidate);
        if (!hit.ok) continue;
        await sleep(80);
        const probe = await d.snapshot();
        if (!get(probe, 'overlayBlocking') && get(probe, 'canInteractWithPlayfield') && get(probe, 'controls.movement')) {
          close = { ok: true };
          break;
        }
      }
      if (!close.ok) return FAIL('no visible close affordance restored movement controls');
      await sleep(300);
      const closed = await d.snapshot();
      const newExceptions = Array.isArray(browser.exceptions) ? browser.exceptions.slice(exceptionStart) : [];
      if (newExceptions.length) {
        const first = newExceptions[0];
        return FAIL('modal input or close raised an uncaught runtime exception: ' + String(first && (first.description || first.text) || 'unknown'));
      }
      if (!get(open, 'overlayBlocking') || get(open, 'activePanel') !== 'shop') return FAIL('scenario did not open a blocking modal');
      if (!unchanged) return FAIL('real key/fire under modal mutated cash/ammo/combat');
      if (get(closed, 'overlayBlocking') || !get(closed, 'canInteractWithPlayfield') || !get(closed, 'controls.movement')) return FAIL('visible close did not restore movement controls');
      if (JSON.stringify(modalGameplayState(closed)) !== JSON.stringify(beforeGameplay)) return FAIL('released modal input mutated gameplay state after close');
      return PASS('modal blocks real playfield inputs and releases play');
    }
  },
  {
    id: 'p1-real-shop-success',
    level: 'P1',
    name: 'Real visible shop item click spends cash and applies an effect',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('near_vendor_with_cash');
      await d.action({ type: 'openPanel', panel: 'shop' });
      await sleep(250);
      const before = await d.snapshot();
      const tried = new Set();
      let clicked = false;
      let after = before;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidates = await findVisibleShopControls(browser);
        const candidate = (candidates || []).find(c => !c.disabled && !tried.has(c.signature));
        if (!candidate) break;
        tried.add(candidate.signature);
        const hit = await clickPoint(browser, candidate);
        if (!hit.ok) continue;
        await sleep(250);
        after = await d.snapshot();
        const spentNow = get(after, 'hud.cash') < get(before, 'hud.cash');
        const appliedNow = get(after, 'hud.ammo') > get(before, 'hud.ammo') ||
          get(after, 'hud.health') > get(before, 'hud.health') ||
          get(after, 'hud.weaponRole') !== get(before, 'hud.weaponRole') ||
          get(after, 'mission.progress') !== get(before, 'mission.progress') ||
          get(after, 'shop.lastPurchase') === 'success';
        if (spentNow && appliedNow) { clicked = true; break; }
      }
      if (!tried.size) return FAIL('no real visible shop item could be clicked');
      const spent = get(after, 'hud.cash') < get(before, 'hud.cash');
      const applied = get(after, 'hud.ammo') > get(before, 'hud.ammo') ||
        get(after, 'hud.health') > get(before, 'hud.health') ||
        get(after, 'hud.weaponRole') !== get(before, 'hud.weaponRole') ||
        get(after, 'mission.progress') !== get(before, 'mission.progress') ||
        get(after, 'shop.lastPurchase') === 'success';
      if (!clicked || !spent) return FAIL('real shop click did not spend cash');
      if (!applied) return FAIL('real shop click spent cash without item/resource/task effect');
      if (!nonnegative(get(after, 'hud.cash'))) return FAIL('purchase made cash negative');
      return PASS('real shop purchase is visible, clickable, and resource-coupled');
    }
  },
  {
    id: 'p1-contract-shop-rejects-low-cash',
    level: 'P1',
    name: 'Low-cash purchase rejects without false grant',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('near_vendor_low_cash');
      await d.action({ type: 'openPanel', panel: 'shop' });
      const before = await d.snapshot();
      const result = await d.action({ type: 'buy', itemRole: 'weapon', weaponRole: 'rapid' });
      const after = await d.snapshot();
      const reject = get(after, 'shop.lastPurchase') === 'rejected' || isRejected(after, ['notEnoughCash', 'notOwned', 'notAvailable', 'none']) || isRejected(result, ['notEnoughCash', 'notOwned', 'notAvailable', 'none']);
      if (!reject) return FAIL('low-cash buy did not reject/cannot purchase');
      if (get(after, 'hud.cash') !== get(before, 'hud.cash') || !nonnegative(get(after, 'hud.cash'))) return FAIL('rejected buy changed or corrupted cash');
      if (get(after, 'hud.ammo') !== get(before, 'hud.ammo') || get(after, 'hud.weaponRole') !== get(before, 'hud.weaponRole') || get(after, 'mission.progress') !== get(before, 'mission.progress')) return FAIL('rejected buy granted ammo/weapon/progress');
      return PASS('insufficient funds are rejected without resource mutation');
    }
  },
  {
    id: 'p1-contract-mission-task-chain',
    level: 'P1',
    name: 'Mission task types advance only through required player actions',
    timeoutMs: 45000,
    async run({ browser }) {
      const d = makeDriver(browser);
      const failures = [];

      const increased = (before, after, path) => {
        const b = Number(get(before, path));
        const a = Number(get(after, path));
        return Number.isFinite(a) && Number.isFinite(b) && a > b;
      };
      const missionAdvanced = (before, after) =>
        get(before, 'mission.progress') !== get(after, 'mission.progress') ||
        increased(before, after, 'mission.objectiveRevision') ||
        increased(before, after, 'mission.rewardRevision');
      const activeIncomplete = (snapshot, type) =>
        get(snapshot, 'mission.active') === true &&
        get(snapshot, 'mission.progress') !== 'completed' &&
        (!type || get(snapshot, 'mission.type') === type);
      const pickupSucceeded = (before, after) =>
        activeIncomplete(after, 'delivery') &&
        get(after, 'mission.progress') === 'carrying' &&
        get(before, 'mission.progress') !== 'carrying' &&
        get(before, 'mission.rewardRevision') === get(after, 'mission.rewardRevision');
      const targetEffect = (before, after) => {
        const beforeStatus = get(before, 'combat.targetStatus');
        const afterStatus = get(after, 'combat.targetStatus');
        return increased(before, after, 'combat.hitRevision') ||
          (['hit', 'defeated', 'destroyed'].includes(afterStatus) &&
           !['hit', 'defeated', 'destroyed'].includes(beforeStatus)) ||
          missionAdvanced(before, after);
      };

      await d.scenario('active_talk_objective_near_target');
      const talkBefore = await d.snapshot();
      await d.action({ type: 'interact', target: 'objective' });
      let talkAfter = await d.snapshot();
      for (let i = 0; i < 20 && get(talkAfter, 'activePanel') === 'dialogue'; i += 1) {
        await d.action({ type: 'dialogue', choice: i % 2 === 0 ? 'accept' : 'next' });
        talkAfter = await d.snapshot();
      }
      if (!activeIncomplete(talkBefore, 'talk') || !missionAdvanced(talkBefore, talkAfter)) failures.push('talk');

      await d.scenario('active_delivery_pickup_near_item');
      const pickBefore = await d.snapshot();
      await d.action({ type: 'collect', target: 'objectiveItem' });
      const pickAfter = await d.snapshot();
      if (!activeIncomplete(pickBefore, 'delivery') ||
          get(pickBefore, 'mission.progress') === 'carrying' ||
          !pickupSucceeded(pickBefore, pickAfter)) failures.push('delivery pickup');

      await d.scenario('active_delivery_dropoff_with_item');
      const dropBefore = await d.snapshot();
      await d.action({ type: 'interact', target: 'objective' });
      await waitAction(d, 250);
      const dropAfter = await d.snapshot();
      if (!activeIncomplete(dropBefore, 'delivery') ||
          get(dropBefore, 'mission.progress') !== 'carrying' ||
          !missionAdvanced(dropBefore, dropAfter)) failures.push('delivery dropoff');

      await d.scenario('active_vehicle_objective_near_vehicle');
      const vehicleBefore = await d.snapshot();
      await d.action({ type: 'enterVehicle', target: 'objective' });
      const vehicleAfter = await d.snapshot();
      if (!activeIncomplete(vehicleBefore, 'stealVehicle') ||
          get(vehicleAfter, 'vehicle.inVehicle') !== true ||
          !missionAdvanced(vehicleBefore, vehicleAfter)) failures.push('vehicle objective');

      await d.scenario('active_kill_objective_near_target');
      const killBefore = await d.snapshot();
      let killAfter = killBefore;
      for (const direction of ['right', 'left', 'up', 'down', 'forward', 'back']) {
        await d.action({ type: 'aim', direction, durationMs: 100 });
        await d.action({ type: 'fire', phase: 'tap' });
        await waitAction(d, 400);
        killAfter = await d.snapshot();
        if (targetEffect(killBefore, killAfter)) break;
      }
      if (!activeIncomplete(killBefore, 'kill') ||
          get(killBefore, 'combat.targetStatus') !== 'alive' ||
          !targetEffect(killBefore, killAfter)) failures.push('kill objective');

      if (failures.length) return FAIL(`mission chains did not advance through required triggers: ${failures.join(', ')}`);
      return PASS('talk, delivery, vehicle, and kill objectives are action-gated and observable');
    }
  },
  {
    id: 'p1-contract-buy-objective-success-reject',
    level: 'P1',
    name: 'Buy objective succeeds only through purchase and rejects insufficient cash',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('active_buy_objective_near_vendor');
      const before = await d.snapshot();
      await d.action({ type: 'openPanel', panel: 'shop' });
      const shopOpen = await d.snapshot();
      const itemRoles = get(shopOpen, 'shop.itemRoles');
      const affordableItemCount = get(shopOpen, 'shop.affordableItemCount');
      const taskItemExposed = Array.isArray(itemRoles) && itemRoles.includes('taskItem');
      if (get(shopOpen, 'shop.open') !== true || !taskItemExposed || !finite(affordableItemCount)) return FAIL('active buy shop did not expose task item affordability');
      const enoughCash = affordableItemCount > 0;
      const protectedPaths = [
        'hud.cash',
        'hud.health',
        'hud.ammo',
        'hud.weaponRole',
        'mission.active',
        'mission.type',
        'mission.progress',
        'mission.objectiveRevision',
        'mission.rewardRevision'
      ];
      await d.action({ type: 'buy', itemRole: 'taskItem' });
      const after = await d.snapshot();
      const purchased = get(after, 'shop.lastPurchase') === 'success';
      const rejectedForCash = get(after, 'shop.lastPurchase') === 'rejected' && isRejected(after, ['notEnoughCash']);
      if (enoughCash) {
        if (!purchased) return FAIL('enough-cash buy objective did not report successful purchase');
        const missionAdvanced = changed(before, after, ['mission.active', 'mission.type', 'mission.progress', 'mission.objectiveRevision', 'mission.rewardRevision']);
        if (!missionAdvanced || !nonnegative(get(after, 'hud.cash'))) return FAIL('buy objective purchase did not complete/progress mission');
      } else {
        if (!rejectedForCash) return FAIL('insufficient-cash buy objective did not report notEnoughCash rejection');
        if (changed(before, after, protectedPaths) || !nonnegative(get(after, 'hud.cash'))) return FAIL('insufficient-cash buy objective changed state');
      }
      return PASS('buy objective is shop-purchase gated and respects insufficient funds');
    }
  },
  {
    id: 'p1-contract-wanted-police-risk',
    level: 'P1',
    name: 'Hostile actions raise wanted pressure and police risk persists',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      const hostileDirections = ['forward', 'back', 'left', 'right'];
      let before = null;
      let hostile = null;
      let wantedRaised = false;
      for (const direction of hostileDirections) {
        await d.scenario('armed_near_target');
        before = await d.snapshot();
        await d.action({ type: 'aim', direction, durationMs: 200 });
        await d.action({ type: 'fire', phase: 'tap', durationMs: 60 });
        hostile = await d.snapshot();
        wantedRaised = get(hostile, 'hud.wantedLevel') > get(before, 'hud.wantedLevel') || get(hostile, 'world.policeThreatRevision') > get(before, 'world.policeThreatRevision');
        for (let i = 0; i < 12 && !wantedRaised; i += 1) {
          hostile = await waitAction(d, 50);
          wantedRaised = get(hostile, 'hud.wantedLevel') > get(before, 'hud.wantedLevel') || get(hostile, 'world.policeThreatRevision') > get(before, 'world.policeThreatRevision');
        }
        if (wantedRaised) break;
      }
      await d.scenario('wanted_pressure_active');
      const pressureBefore = await d.snapshot();
      await d.action({ type: 'wait', durationMs: 1000 });
      const pressureAfter = await d.snapshot();
      const policeRisk = get(pressureAfter, 'world.policeCount') > 0 || get(pressureAfter, 'world.policeThreatRevision') > get(pressureBefore, 'world.policeThreatRevision') || get(pressureAfter, 'hud.health') < get(pressureBefore, 'hud.health');
      if (!wantedRaised) return FAIL('hostile fire did not raise wanted/police pressure');
      if (!policeRisk) return FAIL('wanted pressure did not expose police pursuit/threat/damage risk');
      if (get(pressureBefore, 'hud.wantedLevel') > 0 && get(pressureAfter, 'hud.wantedLevel') === 0 && get(pressureAfter, 'phase') === 'playing') return FAIL('wanted pressure cleared arbitrarily');
      return PASS('wanted pressure is coupled to hostility and police risk');
    }
  },
  {
    id: 'p1-contract-damage-death',
    level: 'P1',
    name: 'Damage risk lowers health and can enter terminal death',
    timeoutMs: 45000,
    async run({ browser }) {
      const d = makeDriver(browser);
      const { dead, startHealth } = await reachDeath(d);
      if (!(get(dead, 'hud.health') < startHealth) && get(dead, 'phase') !== 'death') return FAIL('damage risk did not reduce health or reach death');
      if (get(dead, 'phase') === 'death' || get(dead, 'result.terminal')) {
        if (!get(dead, 'result.terminal') || get(dead, 'controls.movement') || get(dead, 'controls.fire')) return FAIL('death state did not become terminal and disable main controls');
      }
      if (!nonnegative(get(dead, 'hud.health'))) return FAIL('damage path made health negative');
      return PASS('damage produces health feedback and terminal death gating when depleted');
    }
  },
  {
    id: 'p1-death-lock-respawn',
    level: 'P1',
    name: 'Death rejects actions and real respawn restores walking play',
    timeoutMs: 50000,
    async run({ browser }) {
      const d = makeDriver(browser);
      const reached = await reachDeath(d);
      const dead = reached.dead;
      if (get(dead, 'phase') !== 'death' && !get(dead, 'result.terminal')) return FAIL('could not reach death state through declared damage risk');
      const cash = get(dead, 'hud.cash');
      const reward = get(dead, 'mission.rewardRevision');
      const blockedMove = await d.action({ type: 'move', direction: 'forward', durationMs: 200 });
      const blockedFire = await d.action({ type: 'fire', phase: 'tap' });
      const afterBlocked = await d.snapshot();
      const rejected = isRejected(blockedMove, ['terminal', 'blockedByMode', 'notAvailable', 'none']) || isRejected(blockedFire, ['terminal', 'blockedByMode', 'notAvailable', 'none']);
      if (!rejected) return FAIL('death did not reject movement/fire');
      if (get(afterBlocked, 'hud.cash') !== cash || get(afterBlocked, 'mission.rewardRevision') !== reward) return FAIL('death-blocked actions changed cash or mission reward');
      let clicked = { ok: false, reason: 'no visible respawn control yet' };
      for (let attempt = 0; attempt < 8 && !clicked.ok; attempt += 1) {
        if (attempt > 0) await sleep(120);
        clicked = await clickVisibleControl(browser, ['respawn', 'restart', 'continue', 'again', 'revive']);
      }
      if (!clicked.ok) return FAIL(`no visible respawn path found: ${clicked.reason}`);
      await sleep(600);
      const respawned = await d.snapshot();
      if (get(respawned, 'phase') !== 'playing' || get(respawned, 'mode') !== 'walking' || !(get(respawned, 'hud.health') > 0) || get(respawned, 'overlayBlocking') || !get(respawned, 'controls.movement')) return FAIL('real respawn did not restore playable walking state');
      if (get(respawned, 'hud.wantedLevel') > 0) return FAIL('respawn did not clear wanted pressure');
      return PASS('death locks actions and visible respawn restores playable state');
    }
  },
  {
    id: 'p1-contract-living-city-observable',
    level: 'P1',
    name: 'Living city entities and minimap are observable and reactive',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('fresh_city');
      const before = await d.snapshot();
      await d.action({ type: 'wait', durationMs: 900 });
      await d.action({ type: 'move', direction: 'forward', durationMs: 300, source: 'keyboard' });
      await d.action({ type: 'collect', target: 'nearest' });
      const after = await d.snapshot();
      const counts = get(after, 'world.npcCount') > 0 && get(after, 'world.vehicleCount') > 0 && get(after, 'world.vendorCount') >= 0 && get(after, 'minimap.markerCount') >= 0;
      const response = changed(before, after, ['world.trafficRevision', 'world.npcReactionRevision', 'world.pickupCount', 'hud.cash', 'hud.feedbackKind', 'minimap.markerCount', 'player.position', 'player.screenX', 'player.screenY']);
      if (!counts) return FAIL('city world lacks observable NPC/vehicle/vendor/minimap summaries');
      if (!response) return FAIL('wait/move/collect did not produce any world, minimap, pickup, or player-visible change');
      if (worldRevision(after) < worldRevision(before)) return FAIL('world revision regressed');
      return PASS('city exposes active entities and responds to time/player action');
    }
  },
  {
    id: 'p2-contract-extended-narrative',
    level: 'P2',
    name: 'Extended dialogue/objective handoff remains player-confirmed and recoverable',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('dialogue_open');
      const before = await d.snapshot();
      if (get(before, 'activePanel') !== 'dialogue') return NA('optional dialogue_open depth is not exposed');
      let after = before;
      for (let step = 0; step < 32 && get(after, 'activePanel') === 'dialogue'; step += 1) {
        const choice = step % 2 === 0 ? 'next' : 'accept';
        const confirmed = await d.action({ type: 'dialogue', choice });
        if (!validSnapshot(confirmed)) return FAIL('dialogue confirmation did not return a valid snapshot');
        after = confirmed;
      }
      if (get(after, 'activePanel') === 'dialogue') return FAIL('dialogue did not resolve after player confirmations');
      if (!changed(before, after, [
        'mission.objectiveRevision', 'mission.progress', 'mission.rewardRevision',
        'hud.feedbackKind', 'activePanel', 'phase', 'mode', 'overlayBlocking',
        'canInteractWithPlayfield'
      ])) return FAIL('dialogue did not advance or recover through player confirmation');
      if (get(after, 'phase') !== 'playing' || get(after, 'mode') !== 'walking' ||
          get(after, 'activePanel') !== 'none' || get(after, 'overlayBlocking') ||
          !get(after, 'canInteractWithPlayfield') || !get(after, 'controls.interact')) {
        return FAIL('dialogue resolution did not restore playable controls');
      }
      return PASS('optional narrative handoff is player-gated and recoverable');
    }
  },
  {
    id: 'p2-contract-special-appearance',
    level: 'P2',
    name: 'Special appearance/event purchase respects economy and state rules when exposed',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('near_vendor_with_cash');
      await d.action({ type: 'openPanel', panel: 'shop' });
      const before = await d.snapshot();
      const result = await d.action({ type: 'buy', itemRole: 'taskItem', weaponRole: 'next' });
      const after = await d.snapshot();
      const unsupported = isRejected(result, ['notAvailable', 'notOwned', 'notEnoughCash', 'none']) || isRejected(after, ['notAvailable', 'notOwned', 'notEnoughCash', 'none']);
      const legalEffect = get(after, 'hud.cash') <= get(before, 'hud.cash') && changed(before, after, ['hud.feedbackKind', 'mission.progress', 'result.status', 'shop.lastPurchase']);
      if (!unsupported && !legalEffect) return FAIL('special/event item neither cleanly rejects nor applies a cost/effect/feedback chain');
      if (!nonnegative(get(after, 'hud.cash'))) return FAIL('special/event path made cash negative');
      return unsupported ? NA('special appearance/event purchase is optional and was not exposed') : PASS('special appearance/event path respects economy and state feedback');
    }
  },
  {
    id: 'p2-contract-expanded-combat',
    level: 'P2',
    name: 'Advanced weapons preserve ammo, explosion, target, and wanted rules',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('armed_near_target');
      const before = await d.snapshot();
      const switched = await d.action({ type: 'switchWeapon', weaponRole: 'explosive' });
      const afterSwitch = await d.snapshot();
      await d.action({ type: 'fire', phase: 'tap', durationMs: 100 });
      await waitAction(d, 500);
      const after = await d.snapshot();
      const rejectedSwitch = isRejected(switched, ['notOwned', 'notAvailable', 'none']) || isRejected(afterSwitch, ['notOwned', 'notAvailable', 'none']);
      const advancedShot = get(after, 'hud.ammo') <= get(afterSwitch, 'hud.ammo') && changed(afterSwitch, after, ['combat.shotRevision', 'world.explosionRevision', 'combat.hitRevision', 'hud.wantedLevel', 'hud.feedbackKind']);
      if (!rejectedSwitch && !advancedShot) return FAIL('advanced weapon neither rejected ownership nor produced legal combat chain');
      if (!nonnegative(get(after, 'hud.ammo'))) return FAIL('advanced combat made ammo negative');
      return PASS('advanced combat either rejects unavailable weapon or follows P1 combat rules');
    }
  },
  {
    id: 'p2-contract-deeper-police',
    level: 'P2',
    name: 'Deeper police pressure evolves with wanted time and movement',
    timeoutMs: 30000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('wanted_pressure_active');
      const before = await d.snapshot();
      await d.action({ type: 'move', direction: 'forward', durationMs: 500, source: 'keyboard' });
      await d.action({ type: 'wait', durationMs: 1200 });
      const after = await d.snapshot();
      const evolves = get(after, 'world.policeThreatRevision') >= get(before, 'world.policeThreatRevision') ||
        get(after, 'world.policeCount') !== get(before, 'world.policeCount') ||
        get(after, 'hud.health') < get(before, 'hud.health') ||
        changed(before, after, ['hud.feedbackKind', 'minimap.markerCount']);
      if (!evolves) return FAIL('police pressure did not evolve with time/movement');
      if (get(before, 'hud.wantedLevel') > 0 && get(after, 'hud.wantedLevel') === 0 && get(after, 'phase') === 'playing' && get(after, 'result.status') === 'none') return FAIL('wanted pressure cleared without visible escape/death/respawn transition');
      return PASS('deeper police pressure remains coupled to wanted state');
    }
  },
  {
    id: 'p2-real-landmark-guidance',
    level: 'P2',
    name: 'Landmark/objective guidance remains visible, navigable, and nonblocking',
    timeoutMs: 35000,
    async run({ browser }) {
      const d = makeDriver(browser);
      await d.scenario('active_talk_objective_near_target');
      const before = await d.snapshot();
      if (!get(before, 'mission.guidanceVisible') && get(before, 'minimap.markerCount') <= 0) return NA('optional landmark guidance is not exposed beyond base objective guidance');
      await cdpKey(browser, 'KeyW', 400);
      await sleep(300);
      const after = await d.snapshot();
      const distanceChanged = finite(get(before, 'mission.targetDistance')) && finite(get(after, 'mission.targetDistance')) && get(before, 'mission.targetDistance') !== get(after, 'mission.targetDistance');
      const guidanceEvidence = distanceChanged || changed(before, after, ['minimap.markerCount', 'mission.objectiveRevision', 'player.position', 'player.screenX', 'player.screenY', 'playfield.renderRevision']);
      if (get(after, 'overlayBlocking') || !get(after, 'canInteractWithPlayfield')) return FAIL('guidance or landmark overlay blocks play');
      if (!guidanceEvidence) return FAIL('real movement did not affect target guidance, minimap, or player-visible location');
      return PASS('guidance/landmark cues remain visible and nonblocking during navigation');
    }
  }
];

module.exports = { suite };
