// === GDD Coverage Map ===
// p0-boot-stability: M1 startup stability and visible shell
// p0-visible-playfield: M1/M3 wardrobe preview or playable render is visible
// p1-real-start-click-unblocks-wardrobe: M1 UI flow, overlay blocking, real start path
// p1-real-category-click-preserves-economy: M2 real category switching and economy invariant
// p1-minigame-entry-back-real-flow: M5 real mini-game entry/back, overlay blocking, no unfinished reward
// p1-equip-unequip-hair-invariant: M3 equip/unequip loop and hair non-empty invariant
// p1-purchase-success-contract: M4 purchase loop with cost, ownership, equip, preview update
// p1-purchase-rejection-invariant: M4 insufficient/cancel path with resource conservation
// p1-fashion-rush-real-key-direction: M7 screen-space left/right basket semantics with real keyboard input
// p1-fashion-rush-real-drag-direction: M7 screen-space drag basket semantics with real mouse events
// p1-fashion-rush-catch-reward-rejection: M7 target catch reward and hazard non-reward
// p1-color-match-correct-wrong-loop: M6 correct/wrong color match reward and rejection
// p1-memory-match-pair-loop: M8 memory pair loop
// p1-quick-style-correct-wrong-loop: M9 target matching loop
// p1-result-continue-single-reward: M10 result continue closes overlay and no double reward regardless of settlement timing
// p1-preview-feedback-after-equip: M3/M4 visible preview feedback after equip/purchase
// p2-invalid-item-index-preserves-state: M3/M4 invalid item action preserves economy/equipment
// p2-fashion-rush-boundary-clamp: M7 repeated movement preserves basket/playfield bounds
// p2-out-of-phase-minigame-action-rejected: M6/M9 mini-game actions outside mini-game do not reward
// p2-result-continue-idempotent-after-reward: M10 repeated result continuation cannot duplicate reward
// p2-storage-load-nonblocking: M11 save/load either restores progress or gracefully starts playable wardrobe
// p2-tutorial-feedback-nonblocking: M12 tutorial/feedback layers must dismiss or avoid blocking core wardrobe
//
// === Category Map ===
// Boot & Stability: p0-boot-stability, p0-visible-playfield
// UI Flow & Blocking: p1-real-start-click-unblocks-wardrobe, p1-minigame-entry-back-real-flow
// Input Semantics: p1-fashion-rush-real-key-direction, p1-fashion-rush-real-drag-direction
// Core Mechanic Loop: p1-color-match-correct-wrong-loop, p1-fashion-rush-catch-reward-rejection, p1-memory-match-pair-loop, p1-quick-style-correct-wrong-loop
// State Machine: p1-result-continue-single-reward
// Economy / Progression: p1-purchase-success-contract
// Feedback & Observability: p1-preview-feedback-after-equip
// Invariants & Rejection: p1-real-category-click-preserves-economy, p1-purchase-rejection-invariant, p1-equip-unequip-hair-invariant
//
// === Rationality Map ===
// p1-real-start-click-unblocks-wardrobe: M1 | real action: mouse click start/load | independent observation: overlay/canInteract + category click effect | empty-shell failure: phase flag without operable wardrobe fails
// p1-real-category-click-preserves-economy: M2 | real action: mouse click category | independent observation: category/list changes + coins unchanged | empty-shell failure: static buttons or mutating economy fails
// p1-minigame-entry-back-real-flow: M5 | real action: mouse click mini-game/back or contract fallback | independent observation: phase/minigame/blocking + coins invariant | empty-shell failure: decorative mini-game buttons or stuck overlay fail
// p1-equip-unequip-hair-invariant: M3 | contract player-level item selection | independent observation: equipped summary + preview/resource invariant | empty-shell failure: no unequip rule or hair empty state fails
// p1-purchase-success-contract: M4 | contract setup/action | independent observation: coins delta + unlocked/equipped + modal/preview | empty-shell failure: ok-only or partial purchase fails
// p1-purchase-rejection-invariant: M4 | contract setup/action | independent observation: totalBefore/totalAfter unchanged | empty-shell failure: illegal purchase, negative coins, or mutation fails
// p1-fashion-rush-real-key-direction: M7 | real action: ArrowLeft/ArrowRight | independent observation: basketScreenX signed delta + bounds | empty-shell failure: blocked input, reversed direction, or no visible basket fails
// p1-fashion-rush-real-drag-direction: M7 | real action: mouse drag across playfield | independent observation: basketScreenX signed delta + bounds | empty-shell failure: drag handlers missing or mirrored drag fails
// p1-fashion-rush-catch-reward-rejection: M7 | contract legal scene + wait/move | independent observation: localCoins + fallingCounts + nonnegative invariant | empty-shell failure: moving basket without collision/reward rules fails
// p1-color-match-correct-wrong-loop: M6 | contract action using declared option | independent observation: localCoins/target/HUD revision | empty-shell failure: wrong answers reward or correct answers do nothing fail
// p1-memory-match-pair-loop: M8 | contract/player-level card flips | independent observation: moves/matches/localCoins | empty-shell failure: cards do not flip/match or repeat reward fails
// p1-quick-style-correct-wrong-loop: M9 | contract action using declared choice | independent observation: localCoins/time/target | empty-shell failure: choices are decorative or wrong choice rewards fail
// p1-result-continue-single-reward: M10 | contract result setup + continue | independent observation: phase/coins and unchanged second continue | empty-shell failure: no result flow, lost reward, or double reward fails
// p1-preview-feedback-after-equip: M3 | contract item selection | independent observation: equipped + previewRevision/canvas hash | empty-shell failure: state-only equip without visible preview fails
// p2-invalid-item-index-preserves-state: M3/M4 | contract invalid player selection | independent observation: resource/equipment total unchanged | empty-shell failure: illegal indexes mutate wardrobe state
// p2-fashion-rush-boundary-clamp: M7 | repeated player-level movement | independent observation: basket bounds remain inside playfield | empty-shell failure: movement works only by allowing out-of-bounds state
// p2-out-of-phase-minigame-action-rejected: M6/M9 | player-level mini-game actions in wardrobe | independent observation: total/local reward and phase unchanged | empty-shell failure: detached action handlers grant rewards
// p2-result-continue-idempotent-after-reward: M10 | repeated continue action | independent observation: no second coin delta | empty-shell failure: result flow can be farmed
// p2-storage-load-nonblocking: M11 | load-mode start after reset | independent observation: wardrobe remains playable and storage restore is coherent when available | empty-shell failure: load path traps player or corrupts resources
// p2-tutorial-feedback-nonblocking: M12 | first-entry/tutorial state observation | independent observation: overlay can be dismissed or wardrobe remains interactable | empty-shell failure: tutorial/feedback permanently blocks the game

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }

function finite(n) { return typeof n === 'number' && Number.isFinite(n); }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

async function waitUntil(browser, fn, timeoutMs = 5000, stepMs = 100) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await fn();
    if (last) return last;
    await browser.sleep(stepMs);
  }
  return last;
}

function createGameDriver(browser) {
  async function evalPage(src) {
    return await browser.eval(src);
  }

  async function snapshot() {
    const snap = await evalPage(`(async function(){
      if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
        const s = await window.__gameTest.getSnapshot();
        return window.__l2 && window.__l2.__d ? window.__l2.__d(s) : s;
      }
      const visible = el => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && Number(getComputedStyle(el).opacity || 1) > 0.02;
      const text = (document.body && document.body.innerText || '').toLowerCase();
      const buttons = Array.from(document.querySelectorAll('button,[role="button"],[data-game-control]')).filter(visible);
      const overlays = Array.from(document.querySelectorAll('[role="dialog"],.modal,.overlay,.screen,[data-panel]')).filter(visible);
      const canvases = Array.from(document.querySelectorAll('canvas')).filter(visible).map(c => {
        const r = c.getBoundingClientRect();
        return { width: c.width || 0, height: c.height || 0, cssW: r.width, cssH: r.height, screenX: r.left + r.width / 2, screenY: r.top + r.height / 2 };
      });
      const coinMatch = text.match(/(?:coins?|金币|coin)\\D{0,8}(\\d+)/) || text.match(/(\\d+)\\s*(?:coins?|金币)/);
      const phase = /play|开始|start|load game|读取/.test(text) && overlays.length ? 'menu' : 'wardrobe';
      return {
        phase,
        activePanel: overlays.length ? 'start' : 'none',
        overlayBlocking: overlays.length > 0 && phase !== 'wardrobe',
        canInteractWithWardrobe: buttons.length > 0,
        coins: coinMatch ? Number(coinMatch[1]) : 0,
        currentCategory: null,
        categories: buttons.map(b => (b.getAttribute('aria-label') || b.title || b.textContent || '').trim()).filter(Boolean).slice(0, 20),
        itemCounts: {},
        unlockedCounts: {},
        equipped: {},
        previewRevision: (window.__l2 && window.__l2.drawCalls) || canvases.length,
        hudRevision: document.body ? document.body.innerText.length : 0,
        canvases
      };
    })()`);
    return snap && !snap.__l2_err__ ? snap : null;
  }

  async function contractInput(action) {
    return await evalPage(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { __missing: true };
      const r = await window.__gameTest.input(${JSON.stringify(action)});
      const snap = r && r.snapshot
        ? r.snapshot
        : (r && r.ok === false && typeof window.__gameTest.getSnapshot === 'function'
          ? await window.__gameTest.getSnapshot()
          : null);
      const normalized = snap && r && typeof r === 'object'
        ? Object.assign({}, snap, r, { snapshot: snap })
        : r;
      return window.__l2 && window.__l2.__d ? window.__l2.__d(normalized) : normalized;
    })()`);
  }

  async function reset() {
    return await evalPage(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return { __missing: true };
      const r = await window.__gameTest.reset({ fresh: true });
      return window.__l2 && window.__l2.__d ? window.__l2.__d(r) : r;
    })()`);
  }

  async function loadScenario(name) {
    return await evalPage(`(async function(){
      if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { __missing: true };
      const r = await window.__gameTest.loadScenario(${JSON.stringify(name)});
      return window.__l2 && window.__l2.__d ? window.__l2.__d(r) : r;
    })()`);
  }

  async function findSemanticPoint(kind, avoidLabel) {
    return await evalPage(`(function(){
      const kind = ${JSON.stringify(kind)};
      const avoid = ${JSON.stringify(avoidLabel || '')}.toLowerCase();
      const visible = el => {
        if (!el) return false;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.05 && r.width > 8 && r.height > 8;
      };
      const label = el => ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.dataset && Object.values(el.dataset).join(' ') || '') + ' ' + (el.textContent || '')).toLowerCase();
      const patterns = {
        start: /\\b(start|begin|load game|load|new game|continue|enter)\\b|开始|进入|读取/,
        categoryAlt: /outfit|dress|服装|bag|手袋|包|shoes?|鞋/,
        colorGame: /color|颜色/,
        rushGame: /rush|catch|basket|接|篮/,
        memoryGame: /memory|card|记忆|翻牌/,
        quickGame: /quick|style|match|同款|搭配/
      };
      const baseSelector = 'button,[role="button"],a,input[type="button"],input[type="submit"],[data-game-control]';
      const candidateSelector = kind === 'categoryAlt'
        ? baseSelector + ',.cat,[data-cat],[data-category]'
        : baseSelector;
      const receivesPointer = el => {
        if (kind !== 'start') return true;
        const r = el.getBoundingClientRect();
        const x = Math.max(0, Math.min(window.innerWidth - 1, r.left + r.width / 2));
        const y = Math.max(0, Math.min(window.innerHeight - 1, r.top + r.height / 2));
        const top = document.elementFromPoint(x, y);
        return top === el || !!(top && el.contains(top));
      };
      const candidates = Array.from(document.querySelectorAll(candidateSelector)).filter(visible);
      const re = patterns[kind];
      const isAvoidedCategory = e => {
        if (kind !== 'categoryAlt' || !avoid) return false;
        const dataCat = e.dataset && (e.dataset.cat || e.dataset.category)
          ? String(e.dataset.cat || e.dataset.category).toLowerCase()
          : '';
        return dataCat === avoid || label(e).split(/\\s+/).includes(avoid);
      };
      const explicitCategories = kind === 'categoryAlt'
        ? candidates.filter(e => e.matches('.cat,[data-cat],[data-category]'))
        : [];
      let el = (explicitCategories.length ? explicitCategories : candidates)
        .find(e => re && re.test(label(e)) && !isAvoidedCategory(e) && receivesPointer(e));
      if (!el && kind === 'start') {
        el = candidates.find(e => {
          const layer = e.closest('.overlay,[role="dialog"],[aria-modal="true"]');
          return /\\bplay\\b/.test(label(e)) && layer && visible(layer) && receivesPointer(e);
        });
      }
      if (!el) return null;
      if (kind === 'categoryAlt') {
        const initial = el.getBoundingClientRect();
        if (initial.top < 0 || initial.bottom > window.innerHeight ||
            initial.left < 0 || initial.right > window.innerWidth) {
          el.scrollIntoView({ block: 'center', inline: 'center' });
        }
      }
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: label(el).slice(0, 80) };
    })()`);
  }

  async function clickSemantic(kind, avoidLabel) {
    const p = await findSemanticPoint(kind, avoidLabel);
    if (!p || !finite(p.x) || !finite(p.y)) return { ok: false, reason: `no ${kind} control` };
    await browser.mouseClick(p.x, p.y);
    await browser.sleep(350);
    return { ok: true, point: p };
  }

  async function clickBackToWardrobe() {
    const p = await evalPage(`(function(){
      const visible = el => {
        if (!el) return false;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.05 && r.width > 8 && r.height > 8;
      };
      const label = el => ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.textContent || '')).toLowerCase();
      const candidates = Array.from(document.querySelectorAll('button,[role="button"],a,[data-game-control]')).filter(visible);
      const el = candidates.find(e => /back|return|wardrobe|dress-up|衣柜|返回|继续|continue/.test(label(e)));
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: label(el).slice(0, 80) };
    })()`);
    if (!p || !finite(p.x) || !finite(p.y)) return { ok: false, reason: 'no visible back/continue control' };
    await browser.mouseClick(p.x, p.y);
    await browser.sleep(400);
    return { ok: true, point: p };
  }

  async function dispatchRushDrag(direction) {
    const surface = await evalPage(`(function(){
      const isVisibleSurface = el => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 120 && r.height > 80 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.05;
      };
      const candidates = Array.from(document.querySelectorAll('canvas,[id],[class],[data-game-control],[role="application"],main,section,div')).filter(isVisibleSurface);
      const score = el => {
        const name = (String(el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '')).toLowerCase();
        if (/(?:playfield|play-field|rush[-_ ]?(?:play|field)|fr[-_ ]?(?:play|field|canvas)|mg[-_ ]?(?:play|stage|body|canvas)|fashion[-_ ]?play)/.test(name)) return 3;
        if (el.tagName === 'CANVAS') return 2;
        return 0;
      };
      const depth = el => {
        let value = 0;
        for (let node = el; node; node = node.parentElement) value += 1;
        return value;
      };
      const fallback = candidates.sort((a, b) => {
        const scoreDelta = score(b) - score(a);
        return scoreDelta || depth(b) - depth(a);
      })[0];
      const r = fallback && (function(rect){ return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }; })(fallback.getBoundingClientRect());
      return r && r.width > 20 && r.height > 20 ? r : null;
    })()`);
    if (!surface) return { ok: false, reason: 'no visible drag surface' };
    if (!browser.cdp || typeof browser.cdp.send !== 'function') return { ok: false, reason: 'real pointer driver unavailable' };

    const fromX = direction === 'left'
      ? surface.left + surface.width * 0.72
      : surface.left + surface.width * 0.28;
    const toX = direction === 'left'
      ? surface.left + surface.width * 0.28
      : surface.left + surface.width * 0.72;
    const y = surface.top + surface.height * 0.82;
    const sendMouse = (type, x, buttons) => browser.cdp.send('Input.dispatchMouseEvent', {
      type, x, y, button: type === 'mouseMoved' && !buttons ? 'none' : 'left',
      buttons, clickCount: 1, modifiers: 0, pointerType: 'mouse'
    });

    await sendMouse('mouseMoved', fromX, 0);
    await sendMouse('mousePressed', fromX, 1);
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      await sendMouse('mouseMoved', fromX + (toX - fromX) * t, 1);
      await browser.sleep(30);
    }
    await sendMouse('mouseReleased', toX, 0);
    return { ok: true, fromX, toX, y };
  }

  async function startWardrobe() {
    const before = await snapshot();
    if (before && before.phase === 'wardrobe' && before.canInteractWithWardrobe && !before.overlayBlocking) return before;
    const clicked = await clickSemantic('start');
    if (!clicked.ok) {
      const r = await contractInput({ type: 'start', mode: 'fresh' });
      if (r && !r.__missing) return r;
      return before;
    }
    return await waitUntil(browser, async () => {
      const s = await snapshot();
      return s && (s.phase === 'wardrobe' || s.canInteractWithWardrobe) ? s : null;
    }, 5000);
  }

  async function startMiniGame(game) {
    const map = { colorMatch: 'colorGame', fashionRush: 'rushGame', memoryMatch: 'memoryGame', quickStyle: 'quickGame' };
    const clicked = await clickSemantic(map[game]);
    if (!clicked.ok) {
      const r = await contractInput({ type: 'startMiniGame', game });
      if (r && !r.__missing) return r;
    }
    await browser.sleep(500);
    return await snapshot();
  }

  return {
    snapshot,
    contractInput,
    reset,
    loadScenario,
    clickSemantic,
    clickBackToWardrobe,
    dispatchRushDrag,
    findSemanticPoint,
    startWardrobe,
    startMiniGame
  };
}

async function ensureContract(game) {
  const s = await game.snapshot();
  if (!s) return { ok: false, detail: 'snapshot unavailable' };
  const hasContract = await game.contractInput({ type: '__schema_probe__' });
  return { ok: !(hasContract && hasContract.__missing), snap: s };
}

const suite = [
  {
    id: 'p0-boot-stability',
    level: 'P0',
    name: 'boot shows a stable playable shell',
    timeoutMs: 12000,
    async run({ browser }) {
      await browser.sleep(1000);
      const fatal = browser.exceptions.filter(e => !/ResizeObserver|favicon/i.test(e.description || e.text || ''));
      if (fatal.length) return FAIL(`runtime exception: ${fatal[0].description || fatal[0].text}`);
      const game = createGameDriver(browser);
      const s = await game.snapshot();
      if (!s) return FAIL('no snapshot or DOM shell could be observed');
      const hasShell = s.phase || (Array.isArray(s.categories) && s.categories.length >= 2) || (Array.isArray(s.canvases) && s.canvases.length);
      if (!hasShell) return FAIL('no menu, wardrobe controls, or preview canvas visible');
      return PASS(`phase=${s.phase || 'unknown'}`);
    }
  },
  {
    id: 'p0-visible-playfield',
    level: 'P0',
    name: 'visible preview or playfield is nonblank after boot',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.startWardrobe();
      await browser.sleep(500);
      const size = await browser.getCanvasSize();
      const hash = await browser.canvasPixelHash();
      const draw = await browser.eval(`(window.__l2 && {drawCalls: window.__l2.drawCalls, fillRectCalls: window.__l2.fillRectCalls, drawImageCalls: window.__l2.drawImageCalls}) || null`);
      const hasCanvas = size && size.width > 50 && size.height > 50 && size.cssW > 20 && size.cssH > 20;
      const hasDraw = draw && (draw.drawCalls > 0 || draw.fillRectCalls > 0 || draw.drawImageCalls > 0);
      if (!hasCanvas && !hash) return FAIL('no readable visible canvas or screenshot evidence');
      if (hasCanvas && !hasDraw && !hash) return FAIL('canvas exists but no draw/screenshot evidence');
      return PASS(`canvas=${hasCanvas ? `${size.width}x${size.height}` : 'screenshot'} hash=${hash}`);
    }
  },
  {
    id: 'p1-real-start-click-unblocks-wardrobe',
    level: 'P1',
    name: 'real start click unblocks wardrobe interaction',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const afterStart = await game.startWardrobe();
      if (!afterStart) return FAIL('start path did not reach an observable state');
      if (afterStart.overlayBlocking && afterStart.phase === 'wardrobe') return FAIL('wardrobe phase is still blocked by an overlay');
      const before = await game.snapshot();
      const clicked = await game.clickSemantic('categoryAlt', before && before.currentCategory);
      if (!clicked.ok) {
        const contract = await game.contractInput({ type: 'selectCategory', category: 'outfit' });
        if (!contract || contract.__missing) return FAIL('no real category control and no declared category action');
      }
      const after = await game.snapshot();
      const changed = after && before && (after.currentCategory !== before.currentCategory || after.hudRevision !== before.hudRevision || !same(after.categories, before.categories));
      if (!after || after.overlayBlocking) return FAIL('wardrobe remained blocked after start');
      if (!changed && clicked.ok) return FAIL('real category click after start produced no observable effect');
      return PASS('start path reached operable wardrobe');
    }
  },
  {
    id: 'p1-real-category-click-preserves-economy',
    level: 'P1',
    name: 'real category click changes list while preserving coins',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.startWardrobe();
      const before = await game.snapshot();
      const totalBefore = finite(before && before.coins) ? before.coins : null;
      const clicked = await game.clickSemantic('categoryAlt', before && before.currentCategory);
      let after = await game.snapshot();
      if (!clicked.ok) {
        after = await game.contractInput({ type: 'selectCategory', category: 'outfit' });
        if (!after || after.__missing) return FAIL('category selection is not exposed through UI or contract');
      }
      const totalAfter = finite(after && after.coins) ? after.coins : null;
      if (totalBefore !== null && totalAfter !== null && totalBefore !== totalAfter) {
        return FAIL(`category switch mutated coins: totalBefore=${totalBefore} totalAfter=${totalAfter}`);
      }
      const observable = after && before && (after.currentCategory !== before.currentCategory || !same(after.itemCounts, before.itemCounts) || after.hudRevision !== before.hudRevision);
      if (!observable) return FAIL('category trigger produced no list/category observable change');
      return PASS('category changed and economy was conserved');
    }
  },
  {
    id: 'p1-minigame-entry-back-real-flow',
    level: 'P1',
    name: 'real click mini-game entry and back returns to wardrobe without unfinished reward',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.startWardrobe();
      const before = await game.snapshot();
      const coins0 = finite(before && before.coins) ? before.coins : null;
      const miniPoint = await game.findSemanticPoint('colorGame');
      let entered = null;
      if (miniPoint && finite(miniPoint.x) && finite(miniPoint.y)) {
        await browser.mouseClick(miniPoint.x, miniPoint.y);
        await browser.sleep(500);
        entered = await game.snapshot();
      }
      if (!entered || entered.__missing || entered.phase !== 'minigame') {
        entered = await game.contractInput({ type: 'startMiniGame', game: 'colorMatch' });
      }
      if (!entered || entered.__missing) return FAIL('mini-game entry is unavailable through UI or contract');
      const isMini = entered.phase === 'minigame' || (entered.minigame && entered.minigame.type === 'colorMatch');
      if (!isMini) return FAIL(`mini-game entry did not expose minigame phase: phase=${entered.phase}`);
      if (entered.canInteractWithWardrobe && !entered.overlayBlocking) return FAIL('mini-game did not block wardrobe interaction while active');
      let back = await game.clickBackToWardrobe();
      let after = await game.snapshot();
      if (!back.ok || !after || after.phase === 'minigame') {
        after = await game.contractInput({ type: 'backToWardrobe' });
      }
      if (!after || after.__missing) return FAIL('back to wardrobe action unavailable');
      if (after.phase !== 'wardrobe') return FAIL(`back did not return to wardrobe: phase=${after.phase}`);
      if (after.overlayBlocking) return FAIL('back left an overlay blocking the wardrobe');
      if (coins0 !== null && finite(after.coins) && after.coins !== coins0) {
        return FAIL(`unfinished mini-game changed total coins: before=${coins0} after=${after.coins}`);
      }
      return PASS('mini-game entry blocked wardrobe and back restored it without reward');
    }
  },
  {
    id: 'p1-equip-unequip-hair-invariant',
    level: 'P1',
    name: 'equipped non-hair item can be unequipped while hair remains selected',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.loadScenario('wardrobe_owned_non_hair_equipped');
      if (!before || before.__missing) return FAIL('loadScenario("wardrobe_owned_non_hair_equipped") contract missing');
      const category = before.currentCategory;
      if (!category || category === 'hair') return FAIL(`scenario must use a non-hair category, got ${category}`);
      const equipped0 = before.equipped && before.equipped[category];
      const hair0 = before.equipped && before.equipped.hair;
      if (!equipped0) return FAIL('scenario did not start with a non-hair item equipped');
      const coins0 = before.coins;
      const unlocked0 = before.unlockedCounts;
      const afterUnequip = await game.contractInput({ type: 'selectItem', category, itemIndex: 0 });
      if (!afterUnequip || afterUnequip.__missing) return FAIL('selectItem contract missing for unequip');
      if (afterUnequip.equipped && afterUnequip.equipped[category] === equipped0) return FAIL('clicking equipped non-hair item did not clear that slot');
      if (!afterUnequip.equipped || !afterUnequip.equipped.hair) return FAIL('hair became empty during non-hair unequip');
      if (finite(coins0) && finite(afterUnequip.coins) && afterUnequip.coins !== coins0) return FAIL('unequip changed coins');
      if (!same(unlocked0, afterUnequip.unlockedCounts)) return FAIL('unequip changed ownership counts');
      const hairAttempt = await game.contractInput({ type: 'selectCategory', category: 'hair' });
      const hairBefore = hairAttempt && hairAttempt.equipped && hairAttempt.equipped.hair ? hairAttempt : afterUnequip;
      const afterHairClick = await game.contractInput({ type: 'selectItem', category: 'hair', itemIndex: 0 });
      if (!afterHairClick || afterHairClick.__missing) return FAIL('selectItem contract missing for hair invariant');
      if (!afterHairClick.equipped || !afterHairClick.equipped.hair) return FAIL('clicking current hair allowed empty hair');
      if (hair0 && hairBefore.equipped && hairBefore.equipped.hair && !afterHairClick.equipped.hair) return FAIL('hair invariant failed');
      return PASS('non-hair unequipped without mutating coins/ownership and hair stayed selected');
    }
  },
  {
    id: 'p1-purchase-success-contract',
    level: 'P1',
    name: 'affordable locked item purchase updates economy and preview',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.loadScenario('wardrobe_affordable_locked');
      if (!before || before.__missing) return FAIL('loadScenario("wardrobe_affordable_locked") contract missing');
      const startCoins = before.coins;
      const category = before.currentCategory;
      const itemCount = before.itemCounts && category ? before.itemCounts[category] : null;
      if (!category || !Number.isInteger(itemCount) || itemCount <= 0) return FAIL('affordable-locked scenario must expose current category item count');
      let picked = null;
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
        const candidate = await game.contractInput({ type: 'selectItem', category, itemIndex });
        if (!candidate || candidate.__missing) return FAIL('selectItem contract missing');
        const isLocked = candidate.selectedItem && candidate.selectedItem.unlocked === false;
        const modalVisible = candidate.modal && candidate.modal.visible;
        if (isLocked || (modalVisible && (!candidate.selectedItem || candidate.selectedItem.unlocked === false))) {
          picked = candidate;
          break;
        }
      }
      if (!picked) return FAIL('scenario did not expose a selectable locked item');
      const startUnlocked = picked.unlockedCounts && picked.currentCategory ? picked.unlockedCounts[picked.currentCategory] : null;
      const startPreview = picked.previewRevision;
      const modalVisible = picked.modal && picked.modal.visible;
      const cost = (picked.modal && finite(picked.modal.cost)) ? picked.modal.cost : (picked.selectedItem && picked.selectedItem.cost);
      if (!modalVisible && !(picked.selectedItem && picked.selectedItem.unlocked === false)) return FAIL('selecting locked item did not open/identify purchase state');
      const after = await game.contractInput({ type: 'confirmPurchase' });
      if (!after || after.__missing) return FAIL('confirmPurchase contract missing');
      if (!finite(after.coins) || !finite(startCoins)) return FAIL('purchase snapshots must expose numeric coins');
      if (finite(cost) && after.coins !== startCoins - cost) return FAIL(`coins did not decrease by cost: before=${startCoins} cost=${cost} after=${after.coins}`);
      const endUnlocked = after.unlockedCounts && after.currentCategory ? after.unlockedCounts[after.currentCategory] : null;
      if (finite(startUnlocked) && finite(endUnlocked) && endUnlocked <= startUnlocked) return FAIL('unlocked count did not increase after purchase');
      if (!after.equipped || !after.equipped[after.currentCategory]) return FAIL('purchased item was not equipped');
      if (after.modal && after.modal.visible) return FAIL('purchase modal remained open after successful purchase');
      if (finite(startPreview) && finite(after.previewRevision) && after.previewRevision <= startPreview) return FAIL('purchase did not refresh visible preview revision');
      return PASS(`coins ${startCoins}->${after.coins}`);
    }
  },
  {
    id: 'p1-purchase-rejection-invariant',
    level: 'P1',
    name: 'insufficient purchase is rejected without resource mutation',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const scenario = 'wardrobe_insufficient_funds';
      const validScenarioSnapshot = snap => snap && !snap.__missing &&
        typeof snap.currentCategory === 'string' && snap.itemCounts &&
        snap.unlockedCounts && snap.equipped && finite(snap.coins) &&
        finite(snap.previewRevision);
      let before = await game.loadScenario(scenario);
      if (!validScenarioSnapshot(before)) return FAIL('loadScenario("wardrobe_insufficient_funds") must return a complete Snapshot');
      const category = before.currentCategory;
      const itemCount = before.itemCounts[category];
      if (!Number.isInteger(itemCount) || itemCount < 1) return FAIL(`scenario has no items in category ${category}`);
      let lockedIndex = null;
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
        if (itemIndex > 0) {
          before = await game.loadScenario(scenario);
          if (!validScenarioSnapshot(before) || before.currentCategory !== category) return FAIL('scenario reload did not return the same complete Snapshot');
        }
        const selected = await game.contractInput({ type: 'selectItem', category, itemIndex });
        const modal = selected && selected.modal;
        const selectedItem = selected && selected.selectedItem;
        const cost = modal && finite(modal.cost) ? modal.cost
          : selectedItem && finite(selectedItem.cost) ? selectedItem.cost : null;
        if (modal && modal.visible === true && finite(cost) && cost > before.coins &&
            (!selectedItem || selectedItem.unlocked === false)) {
          lockedIndex = itemIndex;
          break;
        }
      }
      if (lockedIndex === null) return FAIL('scenario did not expose an unaffordable locked item');
      before = await game.loadScenario(scenario);
      if (!validScenarioSnapshot(before) || before.currentCategory !== category) return FAIL('scenario reload did not return a complete Snapshot');
      const totalBefore = {
        coins: before.coins,
        unlockedCounts: before.unlockedCounts,
        equipped: before.equipped,
        previewRevision: before.previewRevision
      };
      const selected = await game.contractInput({ type: 'selectItem', category, itemIndex: lockedIndex });
      const selectedModal = selected && selected.modal;
      const selectedItem = selected && selected.selectedItem;
      const selectedCost = selectedModal && finite(selectedModal.cost) ? selectedModal.cost
        : selectedItem && finite(selectedItem.cost) ? selectedItem.cost : null;
      if (!selected || selected.__missing || !selectedModal || selectedModal.visible !== true ||
          !finite(selectedCost) || selectedCost <= before.coins ||
          (selectedItem && selectedItem.unlocked !== false)) return FAIL('selected item was not an unaffordable locked purchase');
      const response = await game.contractInput({ type: 'confirmPurchase' });
      if (!response || response.__missing) return FAIL('confirmPurchase contract missing');
      // A valid rejection may return only {ok:false}; read the public state
      // separately instead of treating the rejection envelope as a Snapshot.
      const after = response.snapshot && typeof response.snapshot === 'object'
        ? response.snapshot
        : await game.snapshot();
      if (!validScenarioSnapshot(after)) return FAIL('rejected purchase did not leave a complete public Snapshot');
      const totalAfter = {
        coins: after.coins,
        unlockedCounts: after.unlockedCounts,
        equipped: after.equipped,
        previewRevision: after.previewRevision
      };
      if (after.coins < 0) return FAIL('coins became negative after rejected purchase');
      if (!same(totalBefore.coins, totalAfter.coins) || !same(totalBefore.unlockedCounts, totalAfter.unlockedCounts) ||
          !same(totalBefore.equipped, totalAfter.equipped) || !same(totalBefore.previewRevision, totalAfter.previewRevision)) {
        return FAIL(`resource invariant failed totalBefore=${JSON.stringify(totalBefore)} totalAfter=${JSON.stringify(totalAfter)}`);
      }
      return PASS(`insufficient purchase of ${selectedCost} left coins, ownership, equipment, and preview unchanged`);
    }
  },
  {
    id: 'p1-fashion-rush-real-key-direction',
    level: 'P1',
    name: 'real keyboard left/right moves basket in screen direction',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.startWardrobe();
      await game.startMiniGame('fashionRush');
      let ready = await game.loadScenario('fashion_rush_ready');
      if (!ready || ready.__missing) ready = await game.snapshot();
      const base = ready && ready.fashionRush ? ready : await game.snapshot();
      const x0 = base && base.fashionRush && base.fashionRush.basketScreenX;
      if (!finite(x0)) return FAIL('fashionRush.basketScreenX screen observable is missing');
      await browser.keyDown('ArrowLeft');
      await browser.sleep(180);
      await browser.keyUp('ArrowLeft');
      await browser.sleep(150);
      const left = await game.snapshot();
      const xLeft = left && left.fashionRush && left.fashionRush.basketScreenX;
      await browser.keyDown('ArrowRight');
      await browser.sleep(260);
      await browser.keyUp('ArrowRight');
      await browser.sleep(150);
      const right = await game.snapshot();
      const xRight = right && right.fashionRush && right.fashionRush.basketScreenX;
      if (!finite(xLeft) || !finite(xRight)) return FAIL('basket screen position disappeared after real key input');
      if (!(xLeft < x0)) return FAIL(`ArrowLeft did not move basket left on screen: before=${x0} after=${xLeft}`);
      if (!(xRight > xLeft)) return FAIL(`ArrowRight did not move basket right on screen: left=${xLeft} right=${xRight}`);
      const b = right.fashionRush.basketBounds;
      const pf = right.fashionRush.playfieldBounds;
      if (b && pf && (b.left < pf.left - 1 || b.right > pf.right + 1)) return FAIL('basket moved outside playfield bounds');
      return PASS(`screenX ${x0}->${xLeft}->${xRight}`);
    }
  },
  {
    id: 'p1-fashion-rush-real-drag-direction',
    level: 'P1',
    name: 'real mouse drag moves basket in screen direction',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.startWardrobe();
      await game.startMiniGame('fashionRush');
      let ready = await game.loadScenario('fashion_rush_ready');
      if (!ready || ready.__missing) ready = await game.snapshot();
      const base = ready && ready.fashionRush ? ready : await game.snapshot();
      const x0 = base && base.fashionRush && base.fashionRush.basketScreenX;
      if (!finite(x0)) return FAIL('fashionRush.basketScreenX screen observable is missing for drag');
      const dragRight = await game.dispatchRushDrag('right');
      if (!dragRight || !dragRight.ok) return FAIL(`could not dispatch drag on visible playfield: ${dragRight && dragRight.reason}`);
      await browser.sleep(250);
      const afterRight = await game.snapshot();
      const xRight = afterRight && afterRight.fashionRush && afterRight.fashionRush.basketScreenX;
      if (!finite(xRight) || !(xRight > x0)) return FAIL(`rightward drag did not move basket right on screen: before=${x0} after=${xRight}`);
      const dragLeft = await game.dispatchRushDrag('left');
      if (!dragLeft || !dragLeft.ok) return FAIL(`could not dispatch left drag: ${dragLeft && dragLeft.reason}`);
      await browser.sleep(250);
      const afterLeft = await game.snapshot();
      const xLeft = afterLeft && afterLeft.fashionRush && afterLeft.fashionRush.basketScreenX;
      if (!finite(xLeft) || !(xLeft < xRight)) return FAIL(`leftward drag did not move basket left on screen: right=${xRight} left=${xLeft}`);
      const b = afterLeft.fashionRush.basketBounds;
      const bounds = afterLeft.fashionRush.playfieldBounds;
      if (b && bounds && (b.left < bounds.left - 1 || b.right > bounds.right + 1)) return FAIL('drag moved basket outside playfield bounds');
      return PASS(`drag screenX ${x0}->${xRight}->${xLeft}`);
    }
  },
  {
    id: 'p1-fashion-rush-catch-reward-rejection',
    level: 'P1',
    name: 'fashion rush target catch rewards and hazard does not reward',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      async function waitForCatch(before, kind) {
        const initialCoins = before.minigame && before.minigame.localCoins;
        const initialCount = before.fashionRush &&
          before.fashionRush.fallingCounts &&
          before.fashionRush.fallingCounts[kind];
        if (!finite(initialCoins) || !finite(initialCount)) {
          return { error: kind + ' scenario must expose numeric local coins and falling count' };
        }
        let latest = before;
        let previousCount = initialCount;
        for (let elapsed = 0; elapsed < 2000; elapsed += 50) {
          for (let sample = 0; sample < 5; sample += 1) {
            latest = await game.contractInput({ type: 'wait', ms: 10 });
            if (!latest || latest.__missing) {
              return { error: 'wait contract missing for fashion rush ' + kind + ' catch' };
            }
            const coins = latest.minigame && latest.minigame.localCoins;
            const count = latest.fashionRush &&
              latest.fashionRush.fallingCounts &&
              latest.fashionRush.fallingCounts[kind];
            const rewardValid = kind === 'target'
              ? finite(coins) && coins > initialCoins
              : finite(coins) && coins <= initialCoins && coins >= 0;
            if (rewardValid && finite(count) && count < previousCount) {
              return { snapshot: latest, previousCount };
            }
            if (finite(count)) previousCount = count;
          }
        }
        return { error: kind + ' catch was not observed within bounded wait' };
      }
      const targetBefore = await game.loadScenario('fashion_rush_target_near_basket');
      if (!targetBefore || targetBefore.__missing) return FAIL('loadScenario("fashion_rush_target_near_basket") contract missing');
      const coins0 = targetBefore.minigame && targetBefore.minigame.localCoins;
      const count0 = targetBefore.fashionRush && targetBefore.fashionRush.fallingCounts && targetBefore.fashionRush.fallingCounts.target;
      const targetCatch = await waitForCatch(targetBefore, 'target');
      if (targetCatch.error) return FAIL(targetCatch.error);
      const targetAfter = targetCatch.snapshot;
      const targetPreviousCount = targetCatch.previousCount;
      const coins1 = targetAfter.minigame && targetAfter.minigame.localCoins;
      const count1 = targetAfter.fashionRush && targetAfter.fashionRush.fallingCounts && targetAfter.fashionRush.fallingCounts.target;
      if (!finite(coins0) || !finite(coins1) || !(coins1 > coins0)) return FAIL(`catching target did not increase local coins: ${coins0}->${coins1}`);
      if (!finite(count0) || !finite(targetPreviousCount) || !finite(count1) || count1 >= targetPreviousCount) return FAIL(`target falling count did not decrease after catch: ${targetPreviousCount}->${count1}`);
      const hazardBefore = await game.loadScenario('fashion_rush_hazard_near_basket');
      if (!hazardBefore || hazardBefore.__missing) return FAIL('loadScenario("fashion_rush_hazard_near_basket") contract missing');
      const h0 = hazardBefore.minigame && hazardBefore.minigame.localCoins;
      const hc0 = hazardBefore.fashionRush && hazardBefore.fashionRush.fallingCounts && hazardBefore.fashionRush.fallingCounts.hazard;
      const hazardCatch = await waitForCatch(hazardBefore, 'hazard');
      if (hazardCatch.error) return FAIL(hazardCatch.error);
      const hazardAfter = hazardCatch.snapshot;
      const hazardPreviousCount = hazardCatch.previousCount;
      const h1 = hazardAfter.minigame && hazardAfter.minigame.localCoins;
      const hc1 = hazardAfter.fashionRush && hazardAfter.fashionRush.fallingCounts && hazardAfter.fashionRush.fallingCounts.hazard;
      if (!finite(h0) || !finite(h1)) return FAIL('hazard path must expose numeric local coins');
      if (h1 > h0) return FAIL(`hazard catch produced positive reward: ${h0}->${h1}`);
      if (h1 < 0) return FAIL('hazard catch made local coins negative');
      if (!finite(hc0) || !finite(hazardPreviousCount) || !finite(hc1) || hc1 >= hazardPreviousCount) return FAIL(`hazard falling count did not decrease after catch: ${hazardPreviousCount}->${hc1}`);
      return PASS(`target coins ${coins0}->${coins1}; hazard coins ${h0}->${h1}`);
    }
  },
  {
    id: 'p1-color-match-correct-wrong-loop',
    level: 'P1',
    name: 'color match correct rewards and wrong is rejected',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.loadScenario('color_match_ready');
      if (!before || before.__missing) return FAIL('loadScenario("color_match_ready") contract missing');
      const opts = before.colorMatch && before.colorMatch.options;
      if (!Array.isArray(opts) || !opts.some(o => o.isTarget) || !opts.some(o => !o.isTarget)) return FAIL('color match options must expose target and non-target choices');
      const correct = opts.find(o => o.isTarget);
      const wrong = opts.find(o => !o.isTarget);
      const c0 = before.minigame && before.minigame.localCoins;
      const afterCorrect = await game.contractInput({ type: 'chooseColor', key: correct.key });
      const c1 = afterCorrect && afterCorrect.minigame && afterCorrect.minigame.localCoins;
      if (!finite(c0) || !finite(c1) || c1 <= c0) return FAIL(`correct color did not increase local coins: ${c0}->${c1}`);
      const targetChanged = afterCorrect.colorMatch && afterCorrect.colorMatch.targetKey !== before.colorMatch.targetKey;
      if (!targetChanged && afterCorrect.hudRevision === before.hudRevision) return FAIL('correct color did not refresh target or HUD');
      const beforeWrongCoins = afterCorrect.minigame.localCoins;
      const wrongKey = (afterCorrect.colorMatch && afterCorrect.colorMatch.options || []).find(o => !o.isTarget);
      const afterWrong = await game.contractInput({ type: 'chooseColor', key: (wrongKey && wrongKey.key) || wrong.key });
      const c2 = afterWrong && afterWrong.minigame && afterWrong.minigame.localCoins;
      if (!finite(c2) || c2 > beforeWrongCoins) return FAIL(`wrong color increased reward: before=${beforeWrongCoins} after=${c2}`);
      if (c2 < 0) return FAIL('wrong color made local coins negative');
      return PASS(`localCoins ${c0}->${c1}->${c2}`);
    }
  },
  {
    id: 'p1-memory-match-pair-loop',
    level: 'P1',
    name: 'memory match pair flips, counts a move, and rewards once',
    timeoutMs: 14000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.loadScenario('memory_match_one_pair_known');
      if (!before || before.__missing) return FAIL('loadScenario("memory_match_one_pair_known") contract missing');
      const cards = before.memoryMatch && before.memoryMatch.cards;
      if (!Array.isArray(cards)) return FAIL('memory cards summary missing');
      const groups = {};
      cards.forEach(c => { if (!c.matched && c.pairKey) (groups[c.pairKey] ||= []).push(c); });
      const pair = Object.values(groups).find(g => g.length >= 2);
      if (!pair) return FAIL('no known unmatched pair exposed for memory scenario');
      const m0 = before.memoryMatch.matchesFound;
      const moves0 = before.memoryMatch.moves;
      const coins0 = before.minigame.localCoins;
      await game.contractInput({ type: 'flipCard', index: pair[0].index });
      const after = await game.contractInput({ type: 'flipCard', index: pair[1].index });
      if (!after || !after.memoryMatch) return FAIL('memory snapshot missing after flips');
      if (!(after.memoryMatch.moves > moves0)) return FAIL('flipping two cards did not increment moves');
      if (!(after.memoryMatch.matchesFound > m0)) return FAIL('known pair did not increase matchesFound');
      if (!(after.minigame.localCoins > coins0)) return FAIL('known pair did not reward local coins');
      const afterRepeat = await game.contractInput({ type: 'flipCard', index: pair[0].index });
      if (afterRepeat && afterRepeat.minigame && afterRepeat.minigame.localCoins > after.minigame.localCoins) {
        return FAIL('matched card repeated reward');
      }
      return PASS(`moves ${moves0}->${after.memoryMatch.moves}, matches ${m0}->${after.memoryMatch.matchesFound}`);
    }
  },
  {
    id: 'p1-quick-style-correct-wrong-loop',
    level: 'P1',
    name: 'quick style correct choice rewards and wrong choice does not',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.loadScenario('quick_style_ready');
      if (!before || before.__missing) return FAIL('loadScenario("quick_style_ready") contract missing');
      const choices = before.quickStyle && before.quickStyle.choices;
      if (!Array.isArray(choices) || !choices.some(c => c.isTarget) || !choices.some(c => !c.isTarget)) return FAIL('quick style choices must expose target and wrong choices');
      const correct = choices.find(c => c.isTarget);
      const c0 = before.minigame.localCoins;
      const t0 = before.minigame.timeLeft;
      const afterCorrect = await game.contractInput({ type: 'chooseStyle', key: correct.key });
      if (!(afterCorrect.minigame.localCoins > c0)) return FAIL('correct style choice did not increase local coins');
      const wrong = (afterCorrect.quickStyle && afterCorrect.quickStyle.choices || choices).find(c => !c.isTarget);
      const beforeWrongCoins = afterCorrect.minigame.localCoins;
      const beforeWrongTime = afterCorrect.minigame.timeLeft;
      const afterWrong = await game.contractInput({ type: 'chooseStyle', key: wrong.key });
      if (afterWrong.minigame.localCoins > beforeWrongCoins) return FAIL('wrong style choice increased local coins');
      if (finite(beforeWrongTime) && finite(afterWrong.minigame.timeLeft) && afterWrong.minigame.timeLeft > beforeWrongTime) return FAIL('wrong style choice increased remaining time');
      if (finite(t0) && afterWrong.minigame.timeLeft < 0) return FAIL('quick style time became negative');
      return PASS(`localCoins ${c0}->${afterCorrect.minigame.localCoins}->${afterWrong.minigame.localCoins}`);
    }
  },
  {
    id: 'p1-result-continue-single-reward',
    level: 'P1',
    name: 'result continue returns to wardrobe and preserves one-time reward settlement',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.loadScenario('result_with_reward');
      if (!before || before.__missing) return FAIL('loadScenario("result_with_reward") contract missing');
      const reward = before.minigame && before.minigame.resultEarned;
      const coins0 = before.coins;
      if (!finite(reward) || reward < 0 || !finite(coins0)) return FAIL('result scenario must expose pending reward and total coins');
      const alreadyApplied = before.minigame && before.minigame.resultAlreadyApplied === true;
      const after = await game.contractInput({ type: 'continueResult' });
      if (after.phase !== 'wardrobe') return FAIL(`continue did not return to wardrobe: phase=${after.phase}`);
      if (after.overlayBlocking) return FAIL('result overlay still blocks wardrobe after continue');
      const allowed = alreadyApplied ? [coins0] : [coins0 + reward, coins0];
      if (!allowed.includes(after.coins)) {
        return FAIL(`reward settlement invalid: before=${coins0} reward=${reward} alreadyApplied=${alreadyApplied} after=${after.coins}`);
      }
      if (!alreadyApplied && after.coins === coins0 && reward > 0) {
        return FAIL('positive result reward was neither marked already applied nor applied on continue');
      }
      const unchanged = await game.contractInput({ type: 'continueResult' });
      if (unchanged && finite(unchanged.coins) && unchanged.coins !== after.coins) return FAIL(`second continue changed coins: totalBefore=${after.coins} totalAfter=${unchanged.coins}`);
      return PASS(`coins ${coins0}->${after.coins}`);
    }
  },
  {
    id: 'p1-preview-feedback-after-equip',
    level: 'P1',
    name: 'equipping or unequipping an owned item changes preview observability',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.loadScenario('wardrobe_owned_non_hair_equipped');
      if (!before || before.__missing) return FAIL('loadScenario("wardrobe_owned_non_hair_equipped") contract missing for preview check');
      const hash0 = await browser.canvasPixelHash();
      const category = before.currentCategory;
      const after = await game.contractInput({ type: 'selectItem', category, itemIndex: 0 });
      if (!after || after.__missing) return FAIL('owned item selection contract missing for preview check');
      await browser.sleep(400);
      const finalSnap = await game.snapshot();
      const hash1 = await browser.canvasPixelHash();
      const equippedChanged = finalSnap && before && !same(finalSnap.equipped, before.equipped);
      const previewChanged = finalSnap && before && finite(finalSnap.previewRevision) && finite(before.previewRevision) && finalSnap.previewRevision > before.previewRevision;
      const canvasChanged = hash0 !== null && hash1 !== null && hash0 !== hash1;
      if (!equippedChanged) return FAIL('selecting owned item did not change equipment summary');
      if (!previewChanged && !canvasChanged) return FAIL('equipment changed but preview/canvas observability did not change');
      return PASS(previewChanged ? 'previewRevision increased' : 'screenshot hash changed after equip');
    }
  },
  {
    id: 'p2-invalid-item-index-preserves-state',
    level: 'P2',
    name: 'invalid item selection preserves wardrobe state',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.startWardrobe();
      if (!before) return FAIL('wardrobe state unavailable before invalid item action');
      const totalBefore = {
        phase: before.phase,
        coins: before.coins,
        unlockedCounts: before.unlockedCounts,
        equipped: before.equipped,
        previewRevision: before.previewRevision
      };
      const response = await game.contractInput({ type: 'selectItem', category: before.currentCategory || 'hair', itemIndex: -1 });
      if (!response || response.__missing) return FAIL('selectItem contract unavailable for invalid index rejection');
      // Invalid input may return {ok:false} without embedding a Snapshot.
      const after = response.snapshot && typeof response.snapshot === 'object'
        ? response.snapshot
        : await game.snapshot();
      const totalAfter = {
        phase: after.phase,
        coins: after.coins,
        unlockedCounts: after.unlockedCounts,
        equipped: after.equipped,
        previewRevision: after.previewRevision
      };
      if (finite(after.coins) && after.coins < 0) return FAIL('invalid item action made coins negative');
      if (!same(totalBefore.coins, totalAfter.coins) || !same(totalBefore.unlockedCounts, totalAfter.unlockedCounts) || !same(totalBefore.equipped, totalAfter.equipped) || !same(totalBefore.previewRevision, totalAfter.previewRevision)) {
        return FAIL(`invalid item action mutated resources totalBefore=${JSON.stringify(totalBefore)} totalAfter=${JSON.stringify(totalAfter)}`);
      }
      return PASS('invalid item index preserved coins, ownership, and equipment');
    }
  },
  {
    id: 'p2-fashion-rush-boundary-clamp',
    level: 'P2',
    name: 'fashion rush movement remains clamped inside playfield bounds',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      let before = await game.loadScenario('fashion_rush_ready');
      if (!before || before.__missing) return FAIL('fashion_rush_ready scenario unavailable for boundary clamp');
      for (let i = 0; i < 8; i++) before = await game.contractInput({ type: 'moveBasket', direction: 'left', amount: 999 });
      const left = before && before.fashionRush;
      if (!left || !left.basketBounds || !left.playfieldBounds) return FAIL('left clamp snapshot lacks basket/playfield bounds');
      if (left.basketBounds.left < left.playfieldBounds.left - 1 || left.basketBounds.right > left.playfieldBounds.right + 1) {
        return FAIL('repeated left movement moved basket outside playfield');
      }
      let after = before;
      for (let i = 0; i < 8; i++) after = await game.contractInput({ type: 'moveBasket', direction: 'right', amount: 999 });
      const right = after && after.fashionRush;
      if (!right || !right.basketBounds || !right.playfieldBounds) return FAIL('right clamp snapshot lacks basket/playfield bounds');
      if (right.basketBounds.left < right.playfieldBounds.left - 1 || right.basketBounds.right > right.playfieldBounds.right + 1) {
        return FAIL('repeated right movement moved basket outside playfield');
      }
      if (!(right.basketScreenX > left.basketScreenX)) return FAIL('opposite boundary movements did not produce opposite screen positions');
      return PASS(`basket stayed within bounds ${left.basketScreenX}->${right.basketScreenX}`);
    }
  },
  {
    id: 'p2-out-of-phase-minigame-action-rejected',
    level: 'P2',
    name: 'mini-game choices outside mini-game phase cannot grant rewards',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      let before = await game.startWardrobe();
      if (!before || before.phase !== 'wardrobe') {
        await game.reset();
        const fallback = await game.contractInput({ type: 'start', mode: 'fresh' });
        if (fallback && !fallback.__missing) before = fallback.snapshot || fallback;
      }
      if (!before || before.phase !== 'wardrobe') return FAIL('wardrobe state unavailable before out-of-phase action');
      const coins0 = before.coins;
      const phase0 = before.phase;
      const color = await game.contractInput({ type: 'chooseColor', optionIndex: 0 });
      if (!color || color.__missing) return FAIL('chooseColor contract unavailable for out-of-phase rejection');
      const afterColor = await game.snapshot();
      const style = await game.contractInput({ type: 'chooseStyle', optionIndex: 0 });
      if (!style || style.__missing) return FAIL('chooseStyle contract unavailable for out-of-phase rejection');
      const after = await game.snapshot();
      for (const state of [afterColor, after]) {
        if (finite(coins0) && finite(state.coins) && state.coins !== coins0) return FAIL(`out-of-phase mini-game action changed total coins: before=${coins0} after=${state.coins}`);
        if (phase0 === 'wardrobe' && state.phase !== 'wardrobe') return FAIL(`out-of-phase mini-game action changed phase: ${phase0}->${state.phase}`);
        const local = state.minigame && state.minigame.localCoins;
        if (finite(local) && local > 0 && state.phase !== 'minigame') return FAIL('out-of-phase action created local reward outside mini-game');
      }
      const resultEnvelope = await game.loadScenario('result_with_reward');
      const resultBefore = resultEnvelope && resultEnvelope.ok === true &&
        resultEnvelope.snapshot && typeof resultEnvelope.snapshot === 'object'
        ? resultEnvelope.snapshot
        : resultEnvelope;
      if (!resultBefore || resultBefore.__missing || resultBefore.phase !== 'result') {
        return FAIL('result_with_reward scenario unavailable for wrong-phase rejection');
      }
      const resultAction = resultBefore.colorMatch && resultBefore.colorMatch.targetKey
        ? { type: 'chooseColor', key: resultBefore.colorMatch.targetKey }
        : resultBefore.quickStyle && resultBefore.quickStyle.targetKey
          ? { type: 'chooseStyle', key: resultBefore.quickStyle.targetKey }
          : { type: 'chooseColor', optionIndex: 0 };
      const resultAfter = await game.contractInput(resultAction);
      if (!resultAfter || resultAfter.__missing) return FAIL('wrong-phase choice action was not observable');
      const resultBeforeMini = resultBefore.minigame || null;
      const resultAfterMini = resultAfter.minigame || null;
      if (resultBefore.phase !== resultAfter.phase || !same(resultBefore.coins, resultAfter.coins) ||
          !same(resultBeforeMini && resultBeforeMini.localCoins, resultAfterMini && resultAfterMini.localCoins) ||
          !same(resultBeforeMini && resultBeforeMini.resultEarned, resultAfterMini && resultAfterMini.resultEarned)) {
        return FAIL('wrong-phase mini-game choice mutated result state');
      }
      return PASS('out-of-phase mini-game choices were rejected without reward');
    }
  },
  {
    id: 'p2-result-continue-idempotent-after-reward',
    level: 'P2',
    name: 'result continue remains idempotent after reward is collected',
    timeoutMs: 10000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.loadScenario('result_with_reward');
      if (!before || before.__missing) return FAIL('result_with_reward scenario unavailable for idempotence check');
      const first = await game.contractInput({ type: 'continueResult' });
      if (!first || first.__missing || first.phase !== 'wardrobe') return FAIL('first continue did not collect reward and return to wardrobe');
      const coinsAfterFirst = first.coins;
      const second = await game.contractInput({ type: 'continueResult' });
      const third = await game.contractInput({ type: 'continueResult' });
      if ((second && finite(second.coins) && second.coins !== coinsAfterFirst) || (third && finite(third.coins) && third.coins !== coinsAfterFirst)) {
        return FAIL(`repeated continue duplicated reward: first=${coinsAfterFirst} second=${second && second.coins} third=${third && third.coins}`);
      }
      return PASS('repeated continue did not duplicate collected reward');
    }
  },
  {
    id: 'p2-storage-load-nonblocking',
    level: 'P2',
    name: 'load path restores progress when storage exists or starts a playable wardrobe',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const afterLoad = await game.contractInput({ type: 'start', mode: 'load' });
      const snap = afterLoad && !afterLoad.__missing ? afterLoad : await game.snapshot();
      if (!snap) return FAIL('load path produced no observable state');
      if (snap.phase !== 'wardrobe') return FAIL(`load path did not enter a playable wardrobe: ${snap.phase}`);
      if (snap.overlayBlocking && !snap.canInteractWithWardrobe) return FAIL('load path reached wardrobe but left it blocked');
      if (finite(snap.coins) && snap.coins < 0) return FAIL('load path restored negative coins');
      if (!snap.equipped || !snap.equipped.hair) return FAIL('load path lost required hair equipment');
      return PASS('load path reached a playable wardrobe with coherent progress');
    }
  },
  {
    id: 'p2-tutorial-feedback-nonblocking',
    level: 'P2',
    name: 'tutorial or feedback overlays do not permanently block wardrobe play',
    timeoutMs: 12000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.reset();
      const before = await game.startWardrobe();
      if (!before) return FAIL('wardrobe unavailable for tutorial/feedback check');
      if (before.activePanel === 'tutorial' && before.overlayBlocking && !before.canInteractWithWardrobe) {
        const dismissed = await game.contractInput({ type: 'cancelPurchase' });
        const afterDismiss = dismissed && !dismissed.__missing ? dismissed : await game.snapshot();
        if (!afterDismiss || (afterDismiss.overlayBlocking && !afterDismiss.canInteractWithWardrobe)) {
          return FAIL('tutorial/feedback layer remained blocking after a player dismissal action');
        }
      }
      const after = await game.snapshot();
      if (!after) return FAIL('snapshot unavailable after tutorial/feedback observation');
      if (after.phase === 'wardrobe' && after.overlayBlocking && !after.canInteractWithWardrobe) {
        return FAIL('tutorial/feedback overlay blocks wardrobe interaction');
      }
      return PASS('tutorial/feedback state is absent, dismissible, or nonblocking');
    }
  }
];

module.exports = { suite };
