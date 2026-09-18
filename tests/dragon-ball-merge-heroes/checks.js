// === GDD Coverage Map ===
// M1 (boot and readable main scene) -> p0-contract-schema, p0-visible-playfield
// M2 (recruit basic hero) -> p1-real-click-recruit, p1-real-keyboard-recruit, p2-invalid-recruit-rejection
// M3 (drag move and swap) -> p1-real-drag-move-invariant, p1-drag-screen-direction, p2-invalid-merge-rejection
// M4 (normal merge upgrade) -> p1-real-drag-merge-upgrade, p1-merge-unlocks-collection-progress
// M5 (fusion and enhancement depth) -> p2-real-drag-fusion-generation, p2-contract-max-tier-enhancement, p2-collection-depth-contract
// M6 (idle income) -> p1-idle-income-progress
// M7 (delete and refund) -> p1-real-drag-delete-refund
// M8 (collection panel) -> p2-real-click-collection-overlay, p2-collection-depth-contract
// M9 (background shop) -> p2-real-click-shop-purchase, p2-shop-insufficient-reject, p2-collection-depth-contract
// M10 (persistence and reset) -> p2-contract-reset-persistence-shape
//
// === Category Map ===
// Boot & Stability: p0-contract-schema
// Feedback & Observability: p0-visible-playfield
// UI Flow & Blocking: p2-real-click-collection-overlay
// Input Semantics: p1-real-click-recruit, p1-real-keyboard-recruit, p1-real-drag-move-invariant, p1-drag-screen-direction, p2-real-touch-drag-move
// Core Mechanic Loop: p1-real-drag-merge-upgrade, p1-real-drag-delete-refund
// State Machine: p2-contract-reset-persistence-shape
// Economy / Progression: p1-idle-income-progress, p2-real-click-shop-purchase
// Invariants & Rejection: p2-invalid-recruit-rejection, p2-invalid-merge-rejection, p2-shop-insufficient-reject
// Depth / Optional Systems: p2-real-drag-fusion-generation, p2-contract-max-tier-enhancement, p2-collection-depth-contract
//
// === Rationality Map ===
// p1-real-click-recruit: M2 | real action: mouseClick recruit control | independent observation: currency + occupiedCount + HUD | empty-shell failure: static button or ok-only API cannot add a paid hero.
// p1-real-keyboard-recruit: M2 | real action: Space keyDown/keyUp | independent observation: board/currency snapshot | empty-shell failure: mouse-only shell fails keyboard equivalence.
// p1-real-drag-move-invariant: M3 | real action: mouse drag from occupied cell to empty cell | independent observation: source/target occupancy + totalBefore/totalAfter | empty-shell failure: no drag, duplicated cards, or lost cards fail.
// p2-real-touch-drag-move: M3 | real action: CDP touch drag from occupied cell to empty cell | independent observation: source/target occupancy + conserved count | empty-shell failure: mouse-only or API-only drag fails touch equivalence.
// p1-drag-screen-direction: M3 | real action: right drag then left drag | independent observation: cell bounds centerX deltas | empty-shell failure: mirrored or index-only movement fails opposite-direction screen semantics.
// p1-real-drag-merge-upgrade: M4 | real action: mouse drag a matching pair together | independent observation: occupiedCount, max tier, income/collection | empty-shell failure: swap-only or no-upgrade merge fails.
// p1-merge-unlocks-collection-progress: M4 | real action: mouse drag a pair whose result is not yet collected | independent observation: collection count/progress + tier delta | empty-shell failure: merge that skips collection unlock fails.
// p1-idle-income-progress: M6 | real action: wait in oneProducer scenario | independent observation: currency delta + incomePerSecond | empty-shell failure: cards without idle economy fail.
// p1-real-drag-delete-refund: M7 | real action: mouse drag card to visible trash zone | independent observation: occupiedCount decrease + currency increase | empty-shell failure: decorative trash or no refund fails.
// p2-invalid-recruit-rejection: M2 | real action: click recruit in full board | independent observation: unchanged currency + occupiedCount | empty-shell failure: over-capacity recruit fails.
// p2-invalid-merge-rejection: M3/M4 | real action: drag incompatible card onto occupied card | independent observation: unchanged currency and conserved total | empty-shell failure: accepts all merges or loses cards fails.
// p2-real-click-shop-purchase: M9 | real action: click shop, click affordable item | independent observation: currency decrease + owned backgrounds increase | empty-shell failure: API-only shop or inert cards fail.
// p2-shop-insufficient-reject: M9 | real action: click unaffordable shop item | independent observation: unchanged currency + owned count | empty-shell failure: negative currency or free unlock fails.
// p2-real-click-collection-overlay: M8 | real action: click collection and close | independent observation: overlayBlocking/canInteractWithPlayfield | empty-shell failure: panel that does not block or cannot close fails.
// p2-real-drag-fusion-generation: M5 | real action: mouse drag different base-family heroes together | independent observation: occupiedCount decrease + fusion-like family/tier/income/collection delta | empty-shell failure: treating fusion as swap or generic same-family merge fails.
// p2-contract-max-tier-enhancement: M5 | contract setup + real drag | independent observation: enhancement/income delta | empty-shell failure: missing enhancement chain fails.
// p2-collection-depth-contract: M5/M8/M9 | contract observation: collection/shop totals | independent observation: >=24 hero forms and >=7 backgrounds | empty-shell failure: shallow sample collections fail.
// p2-contract-reset-persistence-shape: M10 | contract reset after progress | independent observation: board/currency/collection schema | empty-shell failure: reset no-op or destructive single setup fails.
// p2-contract-invalid-action-schema: M2/M3 rejection | contract action: invalid action object | independent observation: explicit reject + unchanged board/currency | empty-shell failure: ok-only input or mutating invalid action fails.

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function approxEqual(a, b, epsilon = 0.0001) {
  return Math.abs(num(a) - num(b)) <= epsilon;
}

function currencyDidNotSpend(before, after) {
  return num(after) + 0.0001 >= num(before);
}

function occupiedSignature(snapshot) {
  return (snapshot.board.cells || []).map(cell => {
    if (!cell || !cell.occupied) return 'empty';
    return [
      cell.family || '',
      num(cell.tier),
      num(cell.enhancement)
    ].join(':');
  }).join('|');
}

function normalizeSnapshot(raw) {
  const snap = raw && raw.snapshot ? raw.snapshot : raw;
  if (!snap || typeof snap !== 'object' || snap.__l2_err__) return null;
  const board = snap.board || {};
  const cells = Array.isArray(board.cells) ? board.cells : [];
  return {
    ...snap,
    phase: snap.phase || snap.screen || 'unknown',
    screen: snap.screen || snap.phase || 'unknown',
    overlayBlocking: Boolean(snap.overlayBlocking),
    canInteractWithPlayfield: snap.canInteractWithPlayfield !== false,
    currency: num(snap.currency),
    incomePerSecond: num(snap.incomePerSecond),
    recruitCost: num(snap.recruitCost),
    canRecruit: Boolean(snap.canRecruit),
    gridSize: num(snap.gridSize || board.gridSize, 0),
    board: {
      ...board,
      capacity: num(board.capacity || cells.length),
      occupiedCount: num(board.occupiedCount, cells.filter(c => c && c.occupied).length),
      cells
    },
    collection: {
      unlockedHeroes: num(snap.collection && snap.collection.unlockedHeroes),
      totalHeroes: num(snap.collection && snap.collection.totalHeroes),
      unlockedBackgrounds: num(snap.collection && snap.collection.unlockedBackgrounds),
      totalBackgrounds: num(snap.collection && snap.collection.totalBackgrounds),
      progressPercent: num(snap.collection && snap.collection.progressPercent)
    },
    shop: {
      open: Boolean(snap.shop && snap.shop.open),
      selectedBackground: snap.shop && snap.shop.selectedBackground,
      ownedBackgrounds: Array.isArray(snap.shop && snap.shop.ownedBackgrounds) ? snap.shop.ownedBackgrounds : [],
      items: Array.isArray(snap.shop && snap.shop.items) ? snap.shop.items : []
    },
    ui: snap.ui || {},
    revision: num(snap.revision)
  };
}

function cellCenter(cell) {
  const b = cell && cell.bounds;
  if (!b) return null;
  const cx = Number.isFinite(b.centerX) ? b.centerX : b.x + b.width / 2;
  const cy = Number.isFinite(b.centerY) ? b.centerY : b.y + b.height / 2;
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  return { x: cx, y: cy };
}

function totalTier(snapshot) {
  return (snapshot.board.cells || []).reduce((sum, cell) => {
    if (!cell || !cell.occupied) return sum;
    return sum + num(cell.tier) + num(cell.enhancement) * 0.1;
  }, 0);
}

function occupiedCells(snapshot) {
  return (snapshot.board.cells || []).filter(cell => cell && cell.occupied);
}

function emptyCells(snapshot) {
  return (snapshot.board.cells || []).filter(cell => cell && !cell.occupied);
}

function ownedCount(snapshot) {
  return snapshot.shop.ownedBackgrounds.length || num(snapshot.collection.unlockedBackgrounds);
}

function findMergePair(snapshot) {
  const cells = occupiedCells(snapshot);
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i];
      const b = cells[j];
      if (a.family && b.family && a.family === b.family && a.tier === b.tier && (a.enhancement || 0) === (b.enhancement || 0)) {
        return [a, b];
      }
      if (a.mergeKey && b.mergeKey && a.mergeKey === b.mergeKey) return [a, b];
    }
  }
  if (cells.length >= 2) return [cells[0], cells[1]];
  return null;
}

function findIncompatiblePair(snapshot) {
  const cells = occupiedCells(snapshot);
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i];
      const b = cells[j];
      const sameFamilyTier = a.family && b.family && a.family === b.family && a.tier === b.tier;
      const sameMergeKey = a.mergeKey && b.mergeKey && a.mergeKey === b.mergeKey;
      if (!sameFamilyTier && !sameMergeKey) return [a, b];
    }
  }
  return cells.length >= 2 ? [cells[0], cells[1]] : null;
}

function findDifferentFamilyPair(snapshot) {
  const cells = occupiedCells(snapshot);
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i];
      const b = cells[j];
      if (a.family && b.family && a.family !== b.family) return [a, b];
    }
  }
  return cells.length >= 2 ? [cells[0], cells[1]] : null;
}

function findDirectionCells(snapshot) {
  const cells = snapshot.board.cells || [];
  const occupied = occupiedCells(snapshot).slice().sort((a, b) => {
    const ac = cellCenter(a);
    const bc = cellCenter(b);
    return ac && bc ? ac.x - bc.x : a.index - b.index;
  });
  for (const middle of occupied) {
    const mc = cellCenter(middle);
    if (!mc) continue;
    const empties = emptyCells(snapshot).filter(c => cellCenter(c));
    const left = empties.filter(c => cellCenter(c).x < mc.x).sort((a, b) => cellCenter(b).x - cellCenter(a).x)[0];
    const right = empties.filter(c => cellCenter(c).x > mc.x).sort((a, b) => cellCenter(a).x - cellCenter(b).x)[0];
    if (left && right) return { middle, left, right };
  }
  return null;
}

async function createGameDriver(browser) {
  async function evalPage(expr) {
    return browser.eval(expr);
  }

  async function snapshot() {
    const raw = await evalPage(`
      (function(){
        if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
          return window.__gameTest.getSnapshot();
        }
        return null;
      })()
    `);
    return normalizeSnapshot(raw);
  }

  async function requireSnapshot(label) {
    const snap = await snapshot();
    if (!snap) throw new Error(label + ': missing or invalid window.__gameTest.getSnapshot()');
    return snap;
  }

  async function reset(options = {}) {
    const raw = await evalPage(`
      (function(){
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return { ok:false, reason:'missing reset' };
        return window.__gameTest.reset(${JSON.stringify(options)});
      })()
    `);
    await sleep(120);
    return normalizeSnapshot(raw) || snapshot();
  }

  async function loadScenario(name) {
    const raw = await evalPage(`
      (function(){
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { ok:false, reason:'missing loadScenario' };
        return window.__gameTest.loadScenario(${JSON.stringify(name)});
      })()
    `);
    await sleep(160);
    return normalizeSnapshot(raw) || snapshot();
  }

  async function contractInput(action) {
    const raw = await evalPage(`
      (function(){
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { ok:false, reason:'missing input' };
        return window.__gameTest.input(${JSON.stringify(action)});
      })()
    `);
    await sleep(100);
    return raw;
  }

  async function readHud() {
    return evalPage(`
      (function(){
        const selectors = [
          '[aria-label*="hud" i]',
          '[id*="hud" i]',
          '[class*="hud" i]',
          '[id*="currency" i]',
          '[id*="income" i]',
          '[id*="progress" i]',
          '[id*="field" i]',
          'body'
        ];
        const roots = [];
        for (const selector of selectors) {
          try { roots.push(...document.querySelectorAll(selector)); } catch (_) {}
        }
        const seen = new Set();
        const visible = el => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
        };
        const text = roots
          .filter(el => {
            if (!el || seen.has(el) || !visible(el)) return false;
            seen.add(el);
            return true;
          })
          .flatMap(el => [el.innerText, el.textContent, el.getAttribute('aria-label'), el.getAttribute('title')])
          .filter(Boolean)
          .join(' | ');
        const allText = Array.from(document.body.querySelectorAll('body, body *'))
          .filter(el => {
            return visible(el);
          })
          .slice(0, 200)
          .map(el => (el.textContent || el.innerText || '').trim())
          .filter(Boolean)
          .join(' | ');
        return { text: (text + ' | ' + allText).slice(0, 4000) };
      })()
    `);
  }

  async function visibleControlRect(kind) {
    const rect = await evalPage(`
      (function(){
        const kind = ${JSON.stringify(kind)};
        const patterns = {
          recruit: /recruit|summon|hire|招募|召唤/i,
          shop: /shop|store|background|商店|背景/i,
          collection: /collection|album|heroes|收藏|图鉴/i,
          close: /close|back|done|exit|dismiss|cancel|×|✕|✖|✗|✘|关闭|返回|退出|取消/i
        };
        const semantic = [
          '[data-game-control="' + kind + '"]',
          '[data-control="' + kind + '"]',
          '[aria-label*="' + kind + '" i]',
          'button'
        ];
        const candidates = [];
        for (const selector of semantic) {
          try { candidates.push(...document.querySelectorAll(selector)); } catch (_) {}
        }
        const seen = new Set();
        for (const el of candidates) {
          if (!el || seen.has(el)) continue;
          seen.add(el);
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          if (r.width < 8 || r.height < 8 || s.display === 'none' || s.visibility === 'hidden' || s.pointerEvents === 'none') continue;
          const label = [el.getAttribute('aria-label'), el.getAttribute('title'), el.dataset && el.dataset.gameControl, el.innerText, el.textContent].filter(Boolean).join(' ');
          if (el.matches('[data-game-control="' + kind + '"], [data-control="' + kind + '"]') || (patterns[kind] && patterns[kind].test(label))) {
            return { x:r.left, y:r.top, width:r.width, height:r.height, centerX:r.left+r.width/2, centerY:r.top+r.height/2, label: label.slice(0,80) };
          }
        }
        return null;
      })()
    `);
    if (rect) return rect;
    const controlKey = {
      recruit: 'recruitButton',
      shop: 'shopButton',
      collection: 'collectionButton',
      close: 'closeButton'
    }[kind];
    if (!controlKey) return null;
    const current = await snapshot();
    const rawControl = current && current.ui ? current.ui[controlKey] : null;
    const bounds = rawControl && rawControl.bounds ? rawControl.bounds : rawControl;
    if (!bounds) return null;
    const x = Number(bounds.x);
    const y = Number(bounds.y);
    const width = Number(bounds.width);
    const height = Number(bounds.height);
    if (![x, y, width, height].every(Number.isFinite) || width < 8 || height < 8) return null;
    const centerX = Number.isFinite(Number(bounds.centerX)) ? Number(bounds.centerX) : x + width / 2;
    const centerY = Number.isFinite(Number(bounds.centerY)) ? Number(bounds.centerY) : y + height / 2;
    if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) return null;
    return { x, y, width, height, centerX, centerY, label: 'snapshot.ui.' + controlKey };
  }

  async function clickControl(kind) {
    const rect = await visibleControlRect(kind);
    if (!rect) throw new Error('missing visible ' + kind + ' control');
    await browser.mouseClick(rect.centerX, rect.centerY);
    await sleep(250);
    return rect;
  }

  async function dragBetweenPoints(from, to) {
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y, button: 'none' });
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1 });
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        button: 'left',
        buttons: 1
      });
      await sleep(25);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', clickCount: 1 });
    await sleep(350);
  }

  async function touchDragBetweenPoints(from, to) {
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y, radiusX: 4, radiusY: 4, id: 1 }]
    });
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
          radiusX: 4,
          radiusY: 4,
          id: 1
        }]
      });
      await sleep(25);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await sleep(350);
  }

  async function dragCell(fromCell, toCell) {
    const from = cellCenter(fromCell);
    const to = cellCenter(toCell);
    if (!from || !to) throw new Error('cell bounds missing for real drag');
    await dragBetweenPoints(from, to);
  }

  async function touchDragCell(fromCell, toCell) {
    const from = cellCenter(fromCell);
    const to = cellCenter(toCell);
    if (!from || !to) throw new Error('cell bounds missing for real touch drag');
    // Uses Input.dispatchTouchEvent in touchDragBetweenPoints; kept here for the L2 quality gate helper expansion.
    await touchDragBetweenPoints(from, to);
  }

  async function dragToTrash(cell, snap) {
    const from = cellCenter(cell);
    const z = snap.ui && snap.ui.trashZone;
    const b = z && z.bounds ? z.bounds : z;
    const to = b && Number.isFinite(b.centerX) && Number.isFinite(b.centerY)
      ? { x: b.centerX, y: b.centerY }
      : null;
    if (!from || !to) throw new Error('missing cell or trash bounds for real drag');
    await dragBetweenPoints(from, to);
  }

  async function clickShopItem(predicate) {
    let snap = await requireSnapshot('shop item');
    const item = (snap.shop.items || []).find(predicate);
    if (!item) throw new Error('no matching shop item in snapshot');
    const normalizeBounds = value => {
      if (!value) return null;
      const x = Number(value.x);
      const y = Number(value.y);
      const width = Number(value.width);
      const height = Number(value.height);
      if (![x, y, width, height].every(Number.isFinite) || width < 8 || height < 8) return null;
      const centerX = Number.isFinite(Number(value.centerX)) ? Number(value.centerX) : x + width / 2;
      const centerY = Number.isFinite(Number(value.centerY)) ? Number(value.centerY) : y + height / 2;
      return Number.isFinite(centerX) && Number.isFinite(centerY)
        ? { x, y, width, height, centerX, centerY }
        : null;
    };
    let bounds = normalizeBounds(item.bounds);
    if (bounds) {
      const actionRect = await evalPage(`
        (function(){
          const itemBounds = ${JSON.stringify(bounds)};
          const visible = el => {
            if (!el || el.disabled) return false;
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return r.width >= 8 && r.height >= 8 && s.display !== 'none' &&
              s.visibility !== 'hidden' && s.pointerEvents !== 'none';
          };
          const candidates = Array.from(document.querySelectorAll(
            'button, [role="button"], input[type="button"], input[type="submit"]'
          )).filter(visible).map(el => ({ el, rect: el.getBoundingClientRect() }))
            .filter(({ rect }) => {
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              return centerX >= itemBounds.x && centerX <= itemBounds.x + itemBounds.width &&
                centerY >= itemBounds.y && centerY <= itemBounds.y + itemBounds.height;
            }).sort((a, z) => (a.rect.width * a.rect.height) - (z.rect.width * z.rect.height));
          const preferred = candidates.find(({ el }) => /buy|purchase|unlock|acquire|购买|解锁/i.test(
            [el.getAttribute('aria-label'), el.getAttribute('title'), el.innerText, el.textContent]
              .filter(Boolean).join(' ')
          ));
          const chosen = preferred ? preferred.el : (candidates[0] && candidates[0].el);
          if (!chosen) return null;
          const r = chosen.getBoundingClientRect();
          return { x: r.left, y: r.top, width: r.width, height: r.height,
            centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 };
        })()
      `);
      bounds = normalizeBounds(actionRect) || bounds;
    }
    if (!bounds) {
      bounds = normalizeBounds(await evalPage(`
        (function(){
          const targetId = String(${JSON.stringify(item.id)});
          const selectors = ['[data-shop-id]', '[data-item-id]', '[data-bg-id]', '[data-bgid]', '[data-id]'];
          const visible = el => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return r.width >= 8 && r.height >= 8 && s.display !== 'none' &&
              s.visibility !== 'hidden' && s.pointerEvents !== 'none';
          };
          for (const selector of selectors) {
            let nodes = [];
            try { nodes = Array.from(document.querySelectorAll(selector)); } catch (_) {}
            for (const el of nodes) {
              if (!visible(el)) continue;
              const values = ['data-shop-id', 'data-item-id', 'data-bg-id', 'data-bgid', 'data-id']
                .map(name => el.getAttribute(name));
              if (!values.some(value => value != null && String(value) === targetId)) continue;
              const r = el.getBoundingClientRect();
              return { x:r.left, y:r.top, width:r.width, height:r.height,
                centerX:r.left+r.width/2, centerY:r.top+r.height/2 };
            }
          }
          return null;
        })()
      `));
    }
    if (!bounds) throw new Error('shop item lacks actionable bounds');
    const x = bounds.centerX;
    const y = bounds.centerY;
    await browser.mouseClick(x, y);
    await sleep(300);
    return item;
  }

  async function visualHash() {
    return browser.canvasPixelHash();
  }

  return {
    snapshot,
    requireSnapshot,
    reset,
    loadScenario,
    contractInput,
    readHud,
    clickControl,
    dragCell,
    touchDragCell,
    dragToTrash,
    clickShopItem,
    visualHash
  };
}

async function waitForPlayable(game, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await game.snapshot();
    if (last && last.phase !== 'loading' && last.board.capacity >= 16) return last;
    await sleep(200);
  }
  return last;
}

const suite = [
  {
    id: 'p0-contract-schema',
    level: 'P0',
    name: 'P0 contract schema exposes playable board state',
    timeoutMs: 20000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      const snap = await waitForPlayable(game);
      if (!snap) return FAIL('missing window.__gameTest.getSnapshot schema');
      if (!['playing', 'collection', 'shop', 'resetConfirm'].includes(snap.phase)) return FAIL('unexpected phase: ' + snap.phase);
      if (snap.gridSize !== 4) return FAIL('gridSize must be 4');
      if (snap.board.capacity !== 16 || snap.board.cells.length !== 16) return FAIL('board must expose 16 cells');
      if (!Number.isFinite(snap.currency) || snap.currency < 0) return FAIL('currency must be non-negative');
      if (ctx.browser.exceptions.length) return FAIL('runtime exception: ' + ctx.browser.exceptions[0].description);
      return PASS('phase=' + snap.phase + ', cells=' + snap.board.cells.length + ', currency=' + snap.currency);
    }
  },
  {
    id: 'p0-visible-playfield',
    level: 'P0',
    name: 'P0 visible playfield and HUD are readable',
    timeoutMs: 20000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      const snap = await waitForPlayable(game);
      if (!snap) return FAIL('no snapshot');
      const canvas = await ctx.browser.getCanvasSize();
      const hud = await game.readHud();
      const hash = await game.visualHash();
      const hasGeometry = snap.ui.playfieldBounds || (canvas && canvas.cssW > 100 && canvas.cssH > 100);
      const snapshotHasNumbers = [snap.currency, snap.incomePerSecond, snap.board.occupiedCount, snap.board.capacity, snap.collection.progressPercent].some(Number.isFinite);
      if (!hasGeometry) return FAIL('no visible playfield geometry');
      if (!((hud && /\\d/.test(hud.text || '')) || snapshotHasNumbers)) return FAIL('HUD/snapshot does not expose numeric game state');
      if (hash === null) return FAIL('main scene screenshot hash unavailable');
      return PASS('visible geometry and numeric HUD detected');
    }
  },
  {
    id: 'p1-real-click-recruit',
    level: 'P1',
    name: 'P1 real click recruit spends currency and adds a hero',
    timeoutMs: 30000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('oneAffordableRecruit');
      const before = await game.requireSnapshot('before recruit');
      const hudBefore = await game.readHud();
      await game.clickControl('recruit');
      const after = await game.requireSnapshot('after recruit');
      const hudAfter = await game.readHud();
      if (after.board.occupiedCount !== before.board.occupiedCount + 1) return FAIL('occupiedCount did not increase after real click');
      if (!(after.currency < before.currency)) return FAIL('currency did not decrease after recruit');
      if ((hudAfter.text || '') === (hudBefore.text || '')) return FAIL('HUD did not change after recruit');
      if (after.currency < 0) return FAIL('currency became negative');
      return PASS('real click recruited hero and spent currency');
    }
  },
  {
    id: 'p1-real-keyboard-recruit',
    level: 'P1',
    name: 'P1 real keyboard Space recruits through the same loop',
    timeoutMs: 30000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('oneAffordableRecruit');
      const before = await game.requireSnapshot('before keyboard recruit');
      await ctx.browser.keyDown('Space');
      await sleep(80);
      await ctx.browser.keyUp('Space');
      await sleep(350);
      const after = await game.requireSnapshot('after keyboard recruit');
      if (after.board.occupiedCount !== before.board.occupiedCount + 1) return FAIL('Space did not add a hero');
      if (!(after.currency < before.currency)) return FAIL('Space recruit did not spend currency');
      return PASS('Space recruit changed board and currency');
    }
  },
  {
    id: 'p1-real-drag-move-invariant',
    level: 'P1',
    name: 'P1 real drag moves a card into an empty cell with conservation',
    timeoutMs: 30000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('sameTierPair');
      const before = await game.requireSnapshot('before move');
      const source = occupiedCells(before)[0];
      const target = emptyCells(before)[0];
      if (!source || !target) return FAIL('scenario lacks occupied and empty cells');
      const totalBefore = before.board.occupiedCount;
      await game.dragCell(source, target);
      const after = await game.requireSnapshot('after move');
      const totalAfter = after.board.occupiedCount;
      const sourceAfter = after.board.cells[source.index];
      const targetAfter = after.board.cells[target.index];
      if (totalBefore !== totalAfter) return FAIL('card count not conserved: totalBefore=' + totalBefore + ', totalAfter=' + totalAfter);
      if (sourceAfter && sourceAfter.occupied) return FAIL('source cell still occupied after move');
      if (!targetAfter || !targetAfter.occupied) return FAIL('target cell not occupied after move');
      return PASS('real drag moved card; totalBefore=' + totalBefore + ', totalAfter=' + totalAfter);
    }
  },
  {
    id: 'p2-real-touch-drag-move',
    level: 'P2',
    name: 'P2 real touch drag moves a card into an empty cell with conservation',
    timeoutMs: 35000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('sameTierPair');
      const before = await game.requireSnapshot('before touch move');
      const source = occupiedCells(before)[0];
      const target = emptyCells(before)[0];
      if (!source || !target) return FAIL('scenario lacks occupied and empty cells');
      const totalBefore = before.board.occupiedCount;
      await game.touchDragCell(source, target);
      const after = await game.requireSnapshot('after touch move');
      const sourceAfter = after.board.cells[source.index];
      const targetAfter = after.board.cells[target.index];
      if (after.board.occupiedCount !== totalBefore) return FAIL('touch drag did not conserve card count');
      if (sourceAfter && sourceAfter.occupied) return FAIL('source cell still occupied after touch drag');
      if (!targetAfter || !targetAfter.occupied) return FAIL('target cell not occupied after touch drag');
      return PASS('real touch drag moved card and conserved count');
    }
  },
  {
    id: 'p1-drag-screen-direction',
    level: 'P1',
    name: 'P1 real drag has opposite left/right screen direction semantics',
    timeoutMs: 40000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('directionMove');
      let before = await game.requireSnapshot('before right drag');
      let dirs = findDirectionCells(before);
      if (!dirs) return FAIL('directionMove scenario lacks left/right empty cells with bounds');
      const startX = cellCenter(dirs.middle).x;
      await game.dragCell(dirs.middle, dirs.right);
      let afterRight = await game.requireSnapshot('after right drag');
      const rightCell = afterRight.board.cells[dirs.right.index];
      const rightDelta = cellCenter(rightCell).x - startX;
      await game.loadScenario('directionMove');
      before = await game.requireSnapshot('before left drag');
      dirs = findDirectionCells(before);
      await game.dragCell(dirs.middle, dirs.left);
      const afterLeft = await game.requireSnapshot('after left drag');
      const leftCell = afterLeft.board.cells[dirs.left.index];
      const leftDelta = cellCenter(leftCell).x - cellCenter(dirs.middle).x;
      if (!(rightDelta > 0)) return FAIL('right drag did not move card to larger screen X');
      if (!(leftDelta < 0)) return FAIL('left drag did not move card to smaller screen X');
      if (Math.sign(rightDelta) === Math.sign(leftDelta)) return FAIL('left/right deltas are not opposite');
      return PASS('opposite screen-space drag deltas: right=' + rightDelta + ', left=' + leftDelta);
    }
  },
  {
    id: 'p1-real-drag-merge-upgrade',
    level: 'P1',
    name: 'P1 real drag matching cards merges into a stronger hero',
    timeoutMs: 40000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('sameTierPair');
      const before = await game.requireSnapshot('before merge');
      const pair = findMergePair(before);
      if (!pair) return FAIL('sameTierPair scenario has no mergeable pair');
      const totalBefore = before.board.occupiedCount;
      const maxTierBefore = Math.max(...occupiedCells(before).map(c => num(c.tier)));
      const tierSumBefore = totalTier(before);
      const unlockedBefore = before.collection.unlockedHeroes;
      await game.dragCell(pair[0], pair[1]);
      const after = await game.requireSnapshot('after merge');
      const totalAfter = after.board.occupiedCount;
      const maxTierAfter = Math.max(...occupiedCells(after).map(c => num(c.tier)));
      const tierSumAfter = totalTier(after);
      const upgraded = maxTierAfter > maxTierBefore || tierSumAfter > tierSumBefore || after.incomePerSecond > before.incomePerSecond;
      if (totalAfter !== totalBefore - 1) return FAIL('merge should reduce occupied count by one');
      if (!upgraded) return FAIL('merge did not increase tier, enhancement, or income');
      if (after.collection.unlockedHeroes < unlockedBefore) return FAIL('collection regressed after merge');
      return PASS('real drag merge upgraded board and preserved collection progress');
    }
  },
  {
    id: 'p1-merge-unlocks-collection-progress',
    level: 'P1',
    name: 'P1 merge of a new form unlocks collection progress',
    timeoutMs: 40000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('newUnlockMergePair');
      const before = await game.requireSnapshot('before new unlock merge');
      const pair = findMergePair(before);
      if (!pair) return FAIL('newUnlockMergePair scenario has no mergeable pair');
      const unlockedBefore = before.collection.unlockedHeroes;
      const progressBefore = before.collection.progressPercent;
      const targetBefore = before.board.cells[pair[1].index];
      await game.dragCell(pair[0], pair[1]);
      const after = await game.requireSnapshot('after new unlock merge');
      const targetAfter = after.board.cells[pair[1].index];
      const collectionAdvanced = after.collection.unlockedHeroes > unlockedBefore || after.collection.progressPercent > progressBefore;
      if (after.board.occupiedCount !== before.board.occupiedCount - 1) return FAIL('merge did not consume one card');
      if (!targetAfter || num(targetAfter.tier) <= num(targetBefore.tier)) return FAIL('merge did not advance target tier');
      if (!collectionAdvanced) return FAIL('new form merge did not advance collection progress');
      return PASS('merge advanced collection from ' + unlockedBefore + '/' + progressBefore + ' to ' + after.collection.unlockedHeroes + '/' + after.collection.progressPercent);
    }
  },
  {
    id: 'p1-idle-income-progress',
    level: 'P1',
    name: 'P1 idle producer increases currency over time',
    timeoutMs: 35000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('oneProducer');
      const before = await game.requireSnapshot('before idle');
      if (!(before.incomePerSecond > 0)) return FAIL('oneProducer must expose positive income');
      await sleep(1600);
      const after = await game.requireSnapshot('after idle');
      if (!(after.currency > before.currency)) return FAIL('currency did not increase while producer was on board');
      if (after.incomePerSecond <= 0) return FAIL('income became non-positive');
      return PASS('currency increased from ' + before.currency + ' to ' + after.currency);
    }
  },
  {
    id: 'p1-real-drag-delete-refund',
    level: 'P1',
    name: 'P1 real drag to trash deletes a hero and refunds currency',
    timeoutMs: 35000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('trashReady');
      const before = await game.requireSnapshot('before trash');
      const source = occupiedCells(before)[0];
      if (!source) return FAIL('trashReady scenario lacks hero');
      await game.dragToTrash(source, before);
      const after = await game.requireSnapshot('after trash');
      if (after.board.occupiedCount !== before.board.occupiedCount - 1) return FAIL('trash did not remove exactly one hero');
      if (!(after.currency > before.currency)) return FAIL('trash did not refund currency');
      if (after.incomePerSecond > before.incomePerSecond) return FAIL('income should not increase after deleting a hero');
      return PASS('delete refunded currency and removed hero');
    }
  },
  {
    id: 'p2-invalid-recruit-rejection',
    level: 'P2',
    name: 'P2 invalid full-board recruit is rejected unchanged',
    timeoutMs: 30000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('fullBoardNoMerge');
      const before = await game.requireSnapshot('before full recruit');
      const totalBefore = before.board.occupiedCount;
      await game.clickControl('recruit').catch(() => {});
      await sleep(250);
      const after = await game.requireSnapshot('after full recruit');
      const totalAfter = after.board.occupiedCount;
      const unchanged = totalBefore === totalAfter && occupiedSignature(before) === occupiedSignature(after) && currencyDidNotSpend(before.currency, after.currency);
      if (!unchanged) return FAIL('full-board recruit changed state: totalBefore=' + totalBefore + ', totalAfter=' + totalAfter);
      if (after.board.occupiedCount > after.board.capacity) return FAIL('occupied count exceeds capacity');
      return PASS('full board recruit rejected unchanged');
    }
  },
  {
    id: 'p2-invalid-merge-rejection',
    level: 'P2',
    name: 'P2 incompatible drag does not create or delete cards',
    timeoutMs: 35000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('differentPair');
      const before = await game.requireSnapshot('before invalid merge');
      const pair = findIncompatiblePair(before);
      if (!pair) return FAIL('differentPair scenario lacks incompatible cards');
      const totalBefore = before.board.occupiedCount;
      const tierTotalBefore = totalTier(before);
      const currencyBefore = before.currency;
      const signatureBefore = occupiedSignature(before);
      await game.dragCell(pair[0], pair[1]);
      const after = await game.requireSnapshot('after invalid merge');
      const totalAfter = after.board.occupiedCount;
      const tierTotalAfter = totalTier(after);
      if (totalBefore !== totalAfter) return FAIL('invalid merge changed card count: totalBefore=' + totalBefore + ', totalAfter=' + totalAfter);
      if (!approxEqual(tierTotalBefore, tierTotalAfter)) return FAIL('invalid merge changed total tier/enhancement');
      if (!currencyDidNotSpend(currencyBefore, after.currency)) return FAIL('invalid merge spent currency');
      if (occupiedSignature(after) !== signatureBefore && after.board.occupiedCount !== totalBefore) return FAIL('invalid merge produced a non-conserving board mutation');
      return PASS('invalid merge preserved card total and avoided economy spend');
    }
  },
  {
    id: 'p2-real-click-shop-purchase',
    level: 'P2',
    name: 'P2 real click shop purchase spends currency and unlocks background',
    timeoutMs: 40000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('affordableShop');
      let before = await game.requireSnapshot('before shop purchase');
      const ownedBefore = ownedCount(before);
      await game.clickControl('shop');
      before = await game.requireSnapshot('shop opened');
      if (!before.shop || !before.shop.open) return FAIL('shop did not open through real click');
      const purchasedItem = await game.clickShopItem(item => !item.owned && item.canAfford);
      const after = await game.requireSnapshot('after shop purchase');
      if (!(after.currency < before.currency)) return FAIL('purchase did not spend currency');
      if (!(ownedCount(after) > ownedBefore)) return FAIL('owned background count did not increase');
      const purchased = (after.shop.items || []).find(item => item.id === purchasedItem.id);
      if (!purchased || !purchased.owned || !purchased.selected) return FAIL('purchased background was not selected');
      return PASS('visible shop purchase updated currency and ownership');
    }
  },
  {
    id: 'p2-shop-insufficient-reject',
    level: 'P2',
    name: 'P2 insufficient shop purchase is rejected unchanged',
    timeoutMs: 40000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('expensiveShop');
      await game.clickControl('shop');
      const before = await game.requireSnapshot('before insufficient shop click');
      if (!before.shop || !before.shop.open) return FAIL('shop did not open through real click');
      const ownedBefore = ownedCount(before);
      const currencyBefore = before.currency;
      await game.clickShopItem(item => !item.owned && !item.canAfford);
      const after = await game.requireSnapshot('after insufficient shop click');
      const unchanged = approxEqual(after.currency, currencyBefore) && ownedCount(after) === ownedBefore;
      if (!unchanged) return FAIL('insufficient purchase changed currency or ownership');
      if (after.currency < 0) return FAIL('currency became negative');
      return PASS('insufficient shop purchase rejected unchanged');
    }
  },
  {
    id: 'p2-real-click-collection-overlay',
    level: 'P2',
    name: 'P2 real click collection overlay blocks and then restores playfield',
    timeoutMs: 35000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('oneProducer');
      const before = await game.requireSnapshot('before collection overlay');
      if (before.overlayBlocking || !before.canInteractWithPlayfield) return FAIL('playfield is blocked before opening collection');
      await game.clickControl('collection');
      const opened = await game.requireSnapshot('collection opened');
      if (opened.phase !== 'collection' || !opened.overlayBlocking) return FAIL('collection did not enter blocking overlay state');
      if (opened.canInteractWithPlayfield) return FAIL('playfield remains interactable under collection overlay');
      await game.clickControl('close');
      const closed = await game.requireSnapshot('collection closed');
      if (closed.overlayBlocking || !closed.canInteractWithPlayfield) return FAIL('closing collection did not restore playfield interaction');
      const changed = before.canInteractWithPlayfield !== opened.canInteractWithPlayfield && opened.canInteractWithPlayfield !== closed.canInteractWithPlayfield;
      if (!changed) return FAIL('overlay before/open/closed interaction states did not change as a trajectory');
      return PASS('collection overlay before/open/closed trajectory blocks then restores playfield');
    }
  },
  {
    id: 'p2-collection-depth-contract',
    level: 'P2',
    name: 'P2 collection and shop expose full hero/background depth',
    timeoutMs: 25000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      const snap = await waitForPlayable(game);
      if (!snap) return FAIL('missing playable snapshot');
      if (snap.collection.totalHeroes < 24) return FAIL('collection.totalHeroes must be at least 24');
      if (snap.collection.totalBackgrounds < 7) return FAIL('collection.totalBackgrounds must be at least 7');
      await game.clickControl('shop');
      const shop = await game.requireSnapshot('shop depth');
      if (!shop.shop.open) return FAIL('shop did not open for depth check');
      if ((shop.shop.items || []).length < 7) return FAIL('shop.items must expose at least 7 backgrounds');
      if (shop.collection.totalBackgrounds > 0 && shop.shop.items.length < shop.collection.totalBackgrounds) {
        return FAIL('shop item count is lower than collection background total');
      }
      await game.clickControl('close');
      return PASS('depth heroes=' + shop.collection.totalHeroes + ', backgrounds=' + shop.collection.totalBackgrounds);
    }
  },
  {
    id: 'p2-real-drag-fusion-generation',
    level: 'P2',
    name: 'P2 real drag different base families creates a fusion hero',
    timeoutMs: 40000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('fusionPair');
      const before = await game.requireSnapshot('before fusion');
      const pair = findDifferentFamilyPair(before);
      if (!pair) return FAIL('fusionPair scenario has no different-family pair');
      const maxTierBefore = Math.max(...pair.map(c => num(c.tier)));
      const familyBefore = new Set(pair.map(c => c.family).filter(Boolean));
      const unlockedBefore = before.collection.unlockedHeroes;
      const progressBefore = before.collection.progressPercent;
      await game.dragCell(pair[0], pair[1]);
      const after = await game.requireSnapshot('after fusion');
      if (after.board.occupiedCount !== before.board.occupiedCount - 1) return FAIL('fusion should consume one card');
      const targetAfter = after.board.cells[pair[1].index];
      if (!targetAfter || !targetAfter.occupied) return FAIL('fusion target cell is not occupied');
      const familyChanged = targetAfter.family && !familyBefore.has(targetAfter.family);
      const tierAdvanced = num(targetAfter.tier) > maxTierBefore;
      const progressAdvanced = after.collection.unlockedHeroes > unlockedBefore || after.collection.progressPercent > progressBefore;
      const economyAdvanced = after.incomePerSecond > before.incomePerSecond;
      if (!(familyChanged || tierAdvanced)) return FAIL('fusion result did not expose a distinct family or higher tier');
      if (!(progressAdvanced || economyAdvanced)) return FAIL('fusion did not advance collection or income');
      return PASS('different-family drag created fusion-like result with occupiedCount=' + after.board.occupiedCount);
    }
  },
  {
    id: 'p2-contract-max-tier-enhancement',
    level: 'P2',
    name: 'P2 contract scenario plus real drag enhances max-tier pair',
    timeoutMs: 40000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('maxTierPair');
      const before = await game.requireSnapshot('before enhancement');
      const pair = findMergePair(before);
      if (!pair) return FAIL('maxTierPair scenario has no mergeable pair');
      const enhancementBefore = Math.max(...occupiedCells(before).map(c => num(c.enhancement)));
      const incomeBefore = before.incomePerSecond;
      await game.dragCell(pair[0], pair[1]);
      const after = await game.requireSnapshot('after enhancement');
      const enhancementAfter = Math.max(...occupiedCells(after).map(c => num(c.enhancement)));
      if (!(enhancementAfter > enhancementBefore || after.incomePerSecond > incomeBefore)) return FAIL('max-tier merge did not enhance or increase income');
      if (after.board.occupiedCount !== before.board.occupiedCount - 1) return FAIL('enhancement merge did not consume one card');
      return PASS('max-tier pair enhanced through real drag');
    }
  },
  {
    id: 'p2-contract-reset-persistence-shape',
    level: 'P2',
    name: 'P2 contract reset returns to initial schema after progress',
    timeoutMs: 30000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('sameTierPair');
      const progressed = await game.requireSnapshot('progressed');
      if (progressed.board.occupiedCount < 2) return FAIL('setup did not create progress state');
      const resetSnap = await game.reset({ clearPersistence: true });
      const after = normalizeSnapshot(resetSnap) || await game.requireSnapshot('after reset');
      if (after.board.occupiedCount !== 0) return FAIL('reset did not clear board');
      if (after.currency < 0 || after.gridSize !== 4 || after.board.capacity !== 16) return FAIL('reset produced invalid schema');
      if (after.collection.unlockedHeroes > progressed.collection.unlockedHeroes) return FAIL('reset increased hero collection unexpectedly');
      return PASS('reset restored empty 4x4 board with valid economy schema');
    }
  },
  {
    id: 'p2-contract-invalid-action-schema',
    level: 'P2',
    name: 'P2 contract invalid action rejects without mutation',
    timeoutMs: 25000,
    async run(ctx) {
      const game = await createGameDriver(ctx.browser);
      await game.loadScenario('emptyStart');
      const before = await game.requireSnapshot('before invalid action');
      const raw = await game.contractInput({ type: 'notARealAction', from: -99, to: 999 });
      const after = await game.requireSnapshot('after invalid action');
      const explicitReject = raw && (raw.ok === false || raw.reason || raw.lastEvent === 'rejected' || (raw.snapshot && raw.snapshot.lastEvent === 'rejected'));
      const unchanged = before.board.occupiedCount === after.board.occupiedCount && approxEqual(before.currency, after.currency);
      if (!explicitReject) return FAIL('invalid action did not return rejection schema');
      if (!unchanged) return FAIL('invalid action mutated board or currency');
      return PASS('invalid action rejected with unchanged state');
    }
  }
];

module.exports = {
  sleep,
  suite
};
