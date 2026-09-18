// === GDD Coverage Map ===
// M1 (startup/menu/shift entry) -> p0-boot-contract, p1-ui-start-shift
// M2 (readable playfield/HUD) -> p0-readable-playfield, p1-ui-start-shift
// M3 (customers/orders/patience) -> p1-cooking-collect-contract, p1-patience-timeout-contract, p2-tutorial-feedback-contract
// M4 (cooking stations/progress) -> p1-cooking-collect-contract
// M5 (tray capacity/collection) -> p1-cooking-collect-contract, p2-tray-capacity-contract
// M6 (drag serving and screen direction) -> p1-real-mouse-drag-correct-serve, p1-real-touch-drag-correct-serve, p1-invalid-drop-unchanged, p2-drag-direction-follows-pointer
// M7 (correct serve/reward) -> p1-real-mouse-drag-correct-serve, p1-real-touch-drag-correct-serve
// M8 (wrong/repeated/invalid rejection) -> p1-invalid-drop-unchanged, p1-wrong-item-rejection-contract, p1-duplicate-item-rejection-contract
// M9 (closing/day complete) -> p1-day-complete-contract
// M10 (shop economy) -> p1-real-shop-click-purchase, p1-shop-scroll-behavior, p1-shop-purchase-contract, p2-insufficient-money-contract
// M11 (next-day progression) -> p2-next-day-progression-contract, p2-tray-upgrade-effect-contract
// M11b (locked menu/persistence) -> p2-locked-menu-rejection-contract, p2-external-progress-nonblocking-contract
// M12 (tutorial) -> p2-tutorial-feedback-contract
// M13 (feedback/observability) -> p0-readable-playfield, p2-tutorial-feedback-contract
//
// === Category Map ===
// Boot & Stability -> p0-boot-contract, p0-readable-playfield
// UI Flow & Blocking -> p1-ui-start-shift
// Input Semantics -> p1-real-mouse-drag-correct-serve, p1-real-touch-drag-correct-serve, p2-drag-direction-follows-pointer
// Core Mechanic Loop -> p1-cooking-collect-contract, p1-real-mouse-drag-correct-serve, p1-real-touch-drag-correct-serve
// State Machine -> p1-patience-timeout-contract, p1-day-complete-contract
// Economy / Progression -> p1-real-shop-click-purchase, p1-shop-scroll-behavior, p1-shop-purchase-contract, p2-insufficient-money-contract, p2-next-day-progression-contract, p2-tray-upgrade-effect-contract
// Feedback & Observability -> p0-readable-playfield, p2-tutorial-feedback-contract, p2-external-progress-nonblocking-contract
// Invariants & Rejection -> p1-invalid-drop-unchanged, p1-wrong-item-rejection-contract, p1-duplicate-item-rejection-contract, p2-locked-menu-rejection-contract, p2-tray-capacity-contract
//
// === Rationality Map ===
// p1-ui-start-shift: M1/M2 | real action: contract startShift or visible start action | independent observation: phase + overlayBlocking + canInteractWithPlayfield | empty-shell failure: state says playing while overlay blocks or no playfield fails
// p1-cooking-collect-contract: M4/M5 | real action: contract tapMenuItem/wait/collect as player-level actions | independent observation: station progress/ready + tray count + hudRevision | empty-shell failure: API returns ok without station/tray changes fails
// p1-real-mouse-drag-correct-serve: M6/M7 | real action: CDP mouse drag from tray bounds to customer bounds | independent observation: score/order/tray/customer deltas + renderRevision | empty-shell failure: API-only serving or inert drag fails
// p1-real-touch-drag-correct-serve: M6/M7 | real action: CDP touch drag from tray bounds to customer bounds | independent observation: score/order/tray/customer deltas + renderRevision | empty-shell failure: mouse-only or API-only serving fails
// p1-invalid-drop-unchanged: M6/M8 | real action: CDP mouse drag to non-customer point | independent observation: totalBefore/totalAfter score, served count, customers served unchanged | empty-shell failure: any drop completing order or swallowing state fails
// p1-wrong-item-rejection-contract: M8 | real action: contract drag wrong tray item to customer | independent observation: ok/reason/feedback + score/order unchanged | empty-shell failure: wrong item gives reward or completion fails
// p1-duplicate-item-rejection-contract: M8 | real action: contract drag duplicate served item to customer | independent observation: feedback + score/order/tray unchanged | empty-shell failure: duplicate item scores twice or is swallowed fails
// p1-patience-timeout-contract: M3/M9 | real action: wait with an impatient customer | independent observation: patience/mood/customer count + score unchanged | empty-shell failure: no timeout or timeout rewards player fails
// p1-real-shop-click-purchase: M10 | real action: CDP mouse click visible shop item | independent observation: money decreases + upgrade/owned state changes | empty-shell failure: API-only shop or inert card fails
// p1-shop-scroll-behavior: M10 | real action: CDP mouse drag/wheel in shop list | independent observation: shop scrollOffset/visibleItems changes within bounds | empty-shell failure: long shop list inaccessible or scroll state ignored fails
// p1-day-complete-contract: M9 | real action: load near close then wait | independent observation: phase dayComplete + money total/today + stats | empty-shell failure: no settlement or money conservation failure fails
// p1-shop-purchase-contract: M10 | real action: contract buy affordable upgrade | independent observation: resources decrease + upgrade/owned changes | empty-shell failure: free purchase or no upgrade delta fails
// p2-insufficient-money-contract: M10 | real action: contract buy unaffordable upgrade | independent observation: money/upgrade unchanged + reject reason | empty-shell failure: insufficient funds accepted fails
// p2-next-day-progression-contract: M11 | real action: contract startNextDay from shop | independent observation: day increments + temporary state cleared + upgrades preserved | empty-shell failure: next day loses progress or keeps old customers fails
// p2-drag-direction-follows-pointer: M6 | real action: two CDP mouse drags with left/right move vectors | independent observation: drag.screenX follows the pointer's screen direction | empty-shell failure: mirrored or same-direction drag feedback fails
// p2-tray-upgrade-effect-contract: M11 | real action: buy tray-capacity upgrade and start next day | independent observation: tray capacity or upgrade effect increases | empty-shell failure: purchase only changes shop number fails
// p2-locked-menu-rejection-contract: M11b | real action: contract tap locked menu item | independent observation: reject feedback + station/tray unchanged | empty-shell failure: locked items become free products fails
// p2-external-progress-nonblocking-contract: M11b/M13 | real action: reset/start with persistence panel state | independent observation: phase/canInteract and externalPanelBlocking false | empty-shell failure: leaderboard/save failure blocks play fails
// p2-tutorial-feedback-contract: M12/M13 | real action: first-day tap menu item | independent observation: tutorial visible then hidden + feedback/revision changes | empty-shell failure: hidden-only tutorial state or no visible feedback fails
// p2-tray-capacity-contract: M5/M8 | real action: collect station while tray full | independent observation: tray count unchanged, station ready preserved, reject reason | empty-shell failure: over-capacity or dropped item fails

function PASS(detail) {
  return { status: 'PASS', detail: detail || '' };
}

function FAIL(detail) {
  return { status: 'FAIL', detail: detail || '' };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function countServed(snapshot) {
  return (snapshot.customers || []).reduce(function(total, customer) {
    return total + (customer.order || []).filter(function(item) { return !!item.served; }).length;
  }, 0);
}

function trayCount(snapshot) {
  return snapshot && snapshot.tray && Array.isArray(snapshot.tray.items) ? snapshot.tray.items.length : 0;
}

function moneyToday(snapshot) {
  return snapshot && snapshot.money && typeof snapshot.money.today === 'number' ? snapshot.money.today : 0;
}

function moneyTotal(snapshot) {
  return snapshot && snapshot.money && typeof snapshot.money.total === 'number' ? snapshot.money.total : 0;
}

function customersServedToday(snapshot) {
  return snapshot && snapshot.stats && typeof snapshot.stats.customersServedToday === 'number'
    ? snapshot.stats.customersServedToday
    : 0;
}

function center(bounds) {
  if (!bounds) return null;
  return {
    x: Number(bounds.screenX),
    y: Number(bounds.screenY),
    width: Number(bounds.width || 0),
    height: Number(bounds.height || 0)
  };
}

function hasFinitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function createGameDriver(browser) {
  async function evalApi(source) {
    return await browser.eval(`
      (async function() {
        const api = window.__gameTest;
        if (!api) return { __missingApi: true };
        ${source}
      })()
    `);
  }

  async function snapshot() {
    return await evalApi(`
      if (typeof api.getSnapshot !== 'function') return { __missingMethod: 'getSnapshot' };
      return await Promise.resolve(api.getSnapshot());
    `);
  }

  async function reset(options) {
    return await evalApi(`
      if (typeof api.reset !== 'function') return { __missingMethod: 'reset' };
      return await Promise.resolve(api.reset(${JSON.stringify(options || {})}));
    `);
  }

  async function contractInput(action) {
    return await evalApi(`
      if (typeof api.input !== 'function') return { __missingMethod: 'input' };
      return await Promise.resolve(api.input(${JSON.stringify(action)}));
    `);
  }

  async function loadScenario(name, options) {
    return await evalApi(`
      if (typeof api.loadScenario !== 'function') return { __missingMethod: 'loadScenario' };
      return await Promise.resolve(api.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options || {})}));
    `);
  }

  async function waitForReady() {
    const deadline = Date.now() + 8000;
    let last = null;
    while (Date.now() < deadline) {
      last = await snapshot();
      if (last && !last.__missingApi && !last.__missingMethod && last.phase) return last;
      await browser.sleep(150);
    }
    return last || { __missingApi: true };
  }

  async function realMouseDrag(from, to) {
    await browser.mouseMove(from.x, from.y);
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: from.x,
      y: from.y,
      button: 'left',
      clickCount: 1,
      modifiers: 0
    });
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const x = from.x + (to.x - from.x) * (i / steps);
      const y = from.y + (to.y - from.y) * (i / steps);
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y,
        button: 'left',
        buttons: 1,
        modifiers: 0,
        movementX: i === 1 ? to.x - from.x : 0,
        movementY: i === 1 ? to.y - from.y : 0
      });
      await browser.sleep(40);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: to.x,
      y: to.y,
      button: 'left',
      clickCount: 1,
      modifiers: 0
    });
    await browser.sleep(250);
  }

  async function realMouseClick(point) {
    if (typeof browser.mouseClick === 'function') {
      await browser.mouseClick(point.x, point.y);
    } else {
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1,
        modifiers: 0
      });
      await browser.sleep(60);
      await browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1,
        modifiers: 0
      });
    }
    await browser.sleep(300);
  }

  async function realTouchDrag(from, to) {
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y, radiusX: 2, radiusY: 2, force: 1, id: 1 }]
    });
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const x = from.x + (to.x - from.x) * (i / steps);
      const y = from.y + (to.y - from.y) * (i / steps);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }]
      });
      await browser.sleep(40);
    }
    await browser.cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await browser.sleep(300);
  }

  async function realMouseDragWithObservation(from, to) {
    await browser.mouseMove(from.x, from.y);
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: from.x,
      y: from.y,
      button: 'left',
      clickCount: 1,
      modifiers: 0
    });
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: mid.x,
      y: mid.y,
      button: 'left',
      buttons: 1,
      modifiers: 0,
      movementX: mid.x - from.x,
      movementY: mid.y - from.y
    });
    await browser.sleep(120);
    const observed = await snapshot();
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: to.x,
      y: to.y,
      button: 'left',
      clickCount: 1,
      modifiers: 0
    });
    await browser.sleep(200);
    return observed;
  }

  async function realShopScroll(snapshotBefore) {
    const publicTarget = (
      snapshotBefore && snapshotBefore.shop && Array.isArray(snapshotBefore.shop.visibleItems)
        ? snapshotBefore.shop.visibleItems
        : []
    ).map(function (item) {
      const bounds = item && item.bounds;
      if (!bounds) return null;
      const x = Number(bounds.screenX);
      const y = Number(bounds.screenY);
      const width = Number(bounds.width || 0);
      const height = Number(bounds.height || 0);
      if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) return null;
      return { x: x, y: y, width: width, height: height };
    }).find(Boolean) || null;
    const area = await browser.eval(`
      (function(){
        function visible(el) {
          const r = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          return r.width > 20 && r.height > 20 && st.display !== 'none' && st.visibility !== 'hidden';
        }
        const anchor = ${JSON.stringify(publicTarget)};
        const candidates = Array.from(document.querySelectorAll('*')).filter(el => {
          if (!visible(el) || el.scrollHeight <= el.clientHeight + 8) return false;
          if (!anchor) return true;
          const r = el.getBoundingClientRect();
          return anchor.x >= r.left && anchor.x <= r.right && anchor.y >= r.top && anchor.y <= r.bottom;
        });
        candidates.sort((a, b) => {
          const ar = a.getBoundingClientRect();
          const br = b.getBoundingClientRect();
          return (br.width * br.height) - (ar.width * ar.height);
        });
        const el = candidates[0];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
      })()
    `);
    const nativeArea = area && !area.__l2_err__ ? area : null;
    const allVisible = (snapshotBefore.shop && Array.isArray(snapshotBefore.shop.visibleItems) && Array.isArray(snapshotBefore.upgrades))
      ? snapshotBefore.shop.visibleItems.length >= snapshotBefore.upgrades.length
      : false;
    if (!nativeArea && !publicTarget) {
      return allVisible ? Object.assign({}, snapshotBefore, { __allShopItemsVisible: true }) : null;
    }
    if (nativeArea) {
      const from = { x: nativeArea.x, y: nativeArea.y + nativeArea.height * 0.25 };
      const to = { x: nativeArea.x, y: nativeArea.y - nativeArea.height * 0.25 };
      await realMouseDrag(from, to);
      const afterDrag = await snapshot();
      if (shopVisibleSignature(afterDrag) !== shopVisibleSignature(snapshotBefore)) return afterDrag;
    }
    const wheelTarget = nativeArea || publicTarget;
    await browser.cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: wheelTarget.x,
      y: wheelTarget.y,
      deltaX: 0,
      deltaY: 420,
      modifiers: 0
    });
    await browser.sleep(250);
    return await snapshot();
  }

  async function realShopPurchaseClick(visibleItem) {
    const bounds = visibleItem && visibleItem.bounds;
    const point = await browser.eval(`
      (function(){
        const bounds = ${JSON.stringify(bounds || null)};
        if (!bounds) return null;
        const left = Number(bounds.screenX) - Number(bounds.width || 0) / 2;
        const right = Number(bounds.screenX) + Number(bounds.width || 0) / 2;
        const top = Number(bounds.screenY) - Number(bounds.height || 0) / 2;
        const bottom = Number(bounds.screenY) + Number(bounds.height || 0) / 2;
        function visible(el) {
          const r = el.getBoundingClientRect();
          const st = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden' && !el.disabled;
        }
        const controls = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"]'))
          .filter(visible)
          .map(el => ({ el, r: el.getBoundingClientRect() }))
          .filter(o => o.r.left >= left - 2 && o.r.right <= right + 2 && o.r.top >= top - 2 && o.r.bottom <= bottom + 2);
        const el = controls[0] && controls[0].el;
        if (!el) return { x: Number(bounds.screenX), y: Number(bounds.screenY), fallback: true };
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, fallback: false };
      })()
    `);
    if (!point || point.__l2_err__) return false;
    await realMouseClick(point);
    return true;
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  return {
    waitForReady,
    snapshot,
    reset,
    contractInput,
    loadScenario,
    realMouseDrag,
    realMouseClick,
    realTouchDrag,
    realMouseDragWithObservation,
    realShopScroll,
    realShopPurchaseClick,
    canvasHash
  };
}

function assertSnapshotSchema(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return 'snapshot is not an object';
  if (!snapshot.phase || !snapshot.screen) return 'phase/screen missing';
  if (!snapshot.money || typeof snapshot.money.today !== 'number' || typeof snapshot.money.total !== 'number') {
    return 'money schema missing';
  }
  if (!snapshot.observability || !snapshot.observability.playfieldBounds) return 'observability/playfieldBounds missing';
  if (!Array.isArray(snapshot.customers)) return 'customers must be array';
  if (!Array.isArray(snapshot.stations)) return 'stations must be array';
  if (!snapshot.tray || !Array.isArray(snapshot.tray.items) || typeof snapshot.tray.capacity !== 'number') {
    return 'tray schema missing';
  }
  return null;
}

function firstCustomer(snapshot) {
  return (snapshot.customers || [])[0] || null;
}

function firstTrayItem(snapshot) {
  return snapshot.tray && snapshot.tray.items ? snapshot.tray.items[0] : null;
}

function chooseNonCustomerPoint(snapshot) {
  const playfield = center(snapshot.observability && snapshot.observability.playfieldBounds);
  if (!hasFinitePoint(playfield)) return null;
  const customer = firstCustomer(snapshot);
  const cb = center(customer && customer.bounds);
  if (hasFinitePoint(cb)) {
    const candidateX = cb.x < playfield.x ? playfield.x + playfield.width * 0.25 : playfield.x - playfield.width * 0.25;
    return { x: candidateX, y: playfield.y + playfield.height * 0.86 };
  }
  return { x: playfield.x, y: playfield.y + playfield.height * 0.9 };
}

function sameUpgradeState(before, after) {
  const b = JSON.stringify((before.upgrades || []).map(function(u) {
    return { id: u.upgradeId, level: u.level, owned: !!u.owned };
  }));
  const a = JSON.stringify((after.upgrades || []).map(function(u) {
    return { id: u.upgradeId, level: u.level, owned: !!u.owned };
  }));
  return b === a;
}

function upgradeSummary(snapshot, upgradeId) {
  return (snapshot.upgrades || []).find(function(u) { return u.upgradeId === upgradeId; }) || null;
}

function visibleShopItem(snapshot, upgradeId) {
  const items = snapshot && snapshot.shop && Array.isArray(snapshot.shop.visibleItems) ? snapshot.shop.visibleItems : [];
  if (upgradeId != null) {
    return items.find(function(item) { return item.upgradeId === upgradeId; }) || null;
  }
  return items[0] || null;
}

function shopVisibleSignature(snapshot) {
  const items = snapshot && snapshot.shop && Array.isArray(snapshot.shop.visibleItems) ? snapshot.shop.visibleItems : [];
  return JSON.stringify({
    offset: snapshot && snapshot.shop ? snapshot.shop.scrollOffset : null,
    items: items.map(function(item) { return item.upgradeId; })
  });
}

module.exports = {
  suite: [
    {
      id: 'p0-boot-contract',
      level: 'P0',
      name: 'boot contract exposes stable snapshot schema',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const snapshot = await game.waitForReady();
        if (snapshot.__missingApi) return FAIL('window.__gameTest missing');
        if (snapshot.__missingMethod) return FAIL('missing method: ' + snapshot.__missingMethod);
        const schemaError = assertSnapshotSchema(snapshot);
        if (schemaError) return FAIL(schemaError);
        return PASS('phase=' + snapshot.phase + ', screen=' + snapshot.screen);
      }
    },
    {
      id: 'p0-readable-playfield',
      level: 'P0',
      name: 'readable playfield and runtime stability',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const beforeHash = await game.canvasHash();
        let snapshot = await game.waitForReady();
        const schemaError = assertSnapshotSchema(snapshot);
        if (schemaError) return FAIL(schemaError);
        let bounds = center(snapshot.observability.playfieldBounds);
        if (!hasFinitePoint(bounds) || bounds.width < 120 || bounds.height < 120) {
          await game.contractInput({ type: 'startShift' });
          snapshot = await game.snapshot();
          bounds = center(snapshot.observability && snapshot.observability.playfieldBounds);
        }
        if (!hasFinitePoint(bounds) || bounds.width < 120 || bounds.height < 120) {
          return FAIL('playfield bounds not usable');
        }
        if (snapshot.observability.canvasReadable === false && beforeHash == null) {
          return FAIL('no readable canvas or playfield evidence');
        }
        const exceptions = await browser.eval(`(window.__l2 && window.__l2._rafErrCount) || 0`);
        if (exceptions && exceptions > 0) return FAIL('runtime loop reported errors');
        return PASS('playfield ' + Math.round(bounds.width) + 'x' + Math.round(bounds.height));
      }
    },
    {
      id: 'p1-ui-start-shift',
      level: 'P1',
      name: 'UI flow contract start shift does not leave blocking overlay',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        await game.reset({ clearSave: true });
        const start = await game.contractInput({ type: 'startShift' });
        const after = start && start.snapshot ? start.snapshot : await game.snapshot();
        if (!after || after.phase !== 'playing') return FAIL('phase did not become playing');
        if (after.overlayBlocking) return FAIL('overlayBlocking true during playing');
        if (!after.canInteractWithPlayfield) return FAIL('playfield not interactive');
        const customerCount = (after.customers || []).length;
        const stationCount = (after.stations || []).length;
        if (stationCount < 3) return FAIL('expected cooking station summaries');
        return PASS('phase=' + after.phase + ', customers=' + customerCount + ', stations=' + stationCount);
      }
    },
    {
      id: 'p1-cooking-collect-contract',
      level: 'P1',
      name: 'contract cooking station progresses and collects to tray',
      timeoutMs: 18000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        let setup = await game.loadScenario('active_shift_basic');
        if (setup.__missingMethod) return FAIL('loadScenario missing');
        const item = (setup.menuItems || []).find(function(m) { return m.unlocked; });
        if (!item) return FAIL('no unlocked menu item in active shift');
        const beforeTray = trayCount(setup);
        const start = await game.contractInput({ type: 'tapMenuItem', itemId: item.itemId });
        if (!start || start.ok !== true) return FAIL('tapMenuItem rejected');
        let mid = start.snapshot || await game.snapshot();
        const activeStation = (mid.stations || []).find(function(s) { return s.busy && s.itemId === item.itemId; })
          || (mid.stations || []).find(function(s) { return s.busy; });
        if (!activeStation) return FAIL('no station became busy after tap');
        const busyReject = await game.contractInput({ type: 'tapMenuItem', itemId: item.itemId });
        const afterBusy = busyReject.snapshot || await game.snapshot();
        const sameStation = (afterBusy.stations || []).find(function(s) { return s.id === activeStation.id; });
        if (!sameStation || sameStation.itemId !== activeStation.itemId) {
          return FAIL('busy station item changed after repeated tap');
        }
        await game.contractInput({ type: 'wait', seconds: 30 });
        const ready = await game.snapshot();
        const readyStation = (ready.stations || []).find(function(s) { return s.ready && s.itemId === item.itemId; })
          || (ready.stations || []).find(function(s) { return s.ready; });
        if (!readyStation) return FAIL('station did not become ready');
        const collected = await game.contractInput({ type: 'collectStation', stationId: readyStation.id });
        const after = collected.snapshot || await game.snapshot();
        if (trayCount(after) <= beforeTray) return FAIL('tray did not increase after collect');
        const collectedStation = (after.stations || []).find(function(s) { return s.id === readyStation.id; });
        if (collectedStation && collectedStation.ready) return FAIL('station still ready after collect');
        return PASS('tray ' + beforeTray + ' -> ' + trayCount(after));
      }
    },
    {
      id: 'p1-real-mouse-drag-correct-serve',
      level: 'P1',
      name: 'real mouse drag serves correct tray item to customer',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('tray_with_correct_item');
        const item = firstTrayItem(setup);
        const customer = firstCustomer(setup);
        const from = center(item && item.bounds);
        const to = center(customer && customer.bounds);
        if (!hasFinitePoint(from) || !hasFinitePoint(to)) return FAIL('missing tray/customer bounds for real drag');
        const beforeHash = await game.canvasHash();
        const beforeScore = moneyToday(setup);
        const beforeServed = countServed(setup);
        const beforeTray = trayCount(setup);
        await game.realMouseDrag(from, to);
        const after = await game.snapshot();
        const afterHash = await game.canvasHash();
        const score = moneyToday(after);
        const served = countServed(after);
        const tray = trayCount(after);
        if (served <= beforeServed && score <= beforeScore && customersServedToday(after) <= customersServedToday(setup)) {
          return FAIL('correct real drag produced no order, score, or service progress');
        }
        if (tray >= beforeTray && served > beforeServed) return FAIL('served item but tray did not decrease');
        if (beforeHash != null && afterHash != null && beforeHash === afterHash && (after.observability || {}).renderRevision === (setup.observability || {}).renderRevision) {
          return FAIL('no visible render evidence changed after real drag');
        }
        return PASS('score=' + beforeScore + '->' + score + ', served=' + beforeServed + '->' + served);
      }
    },
    {
      id: 'p1-real-touch-drag-correct-serve',
      level: 'P1',
      name: 'real touch drag serves correct tray item to customer',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('tray_with_correct_item');
        const item = firstTrayItem(setup);
        const customer = firstCustomer(setup);
        const from = center(item && item.bounds);
        const to = center(customer && customer.bounds);
        if (!hasFinitePoint(from) || !hasFinitePoint(to)) return FAIL('missing tray/customer bounds for real touch drag');
        const beforeHash = await game.canvasHash();
        const beforeScore = moneyToday(setup);
        const beforeServed = countServed(setup);
        const beforeTray = trayCount(setup);
        await game.realTouchDrag(from, to);
        const after = await game.snapshot();
        const afterHash = await game.canvasHash();
        const score = moneyToday(after);
        const served = countServed(after);
        const tray = trayCount(after);
        if (served <= beforeServed && score <= beforeScore && customersServedToday(after) <= customersServedToday(setup)) {
          return FAIL('correct real touch drag produced no order, score, or service progress');
        }
        if (tray >= beforeTray && served > beforeServed) return FAIL('served item by touch but tray did not decrease');
        if (beforeHash != null && afterHash != null && beforeHash === afterHash && (after.observability || {}).renderRevision === (setup.observability || {}).renderRevision) {
          return FAIL('no visible render evidence changed after real touch drag');
        }
        return PASS('touch score=' + beforeScore + '->' + score + ', served=' + beforeServed + '->' + served);
      }
    },
    {
      id: 'p1-invalid-drop-unchanged',
      level: 'P1',
      name: 'real mouse drag invalid drop preserves totals unchanged',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('tray_with_correct_item');
        const item = firstTrayItem(setup);
        const from = center(item && item.bounds);
        const to = chooseNonCustomerPoint(setup);
        if (!hasFinitePoint(from) || !hasFinitePoint(to)) return FAIL('missing drag or invalid target point');
        const totalBefore = moneyToday(setup) + countServed(setup) + customersServedToday(setup);
        const trayBefore = trayCount(setup);
        await game.realMouseDrag(from, to);
        const after = await game.snapshot();
        const totalAfter = moneyToday(after) + countServed(after) + customersServedToday(after);
        const unchanged = totalAfter === totalBefore;
        if (!unchanged) return FAIL('invalid drop changed score/order/service totalBefore=' + totalBefore + ' totalAfter=' + totalAfter);
        if (trayCount(after) !== trayBefore) return FAIL('invalid drop changed tray count');
        return PASS('invalid drop rejected; totalBefore=' + totalBefore + ', totalAfter=' + totalAfter);
      }
    },
    {
      id: 'p1-wrong-item-rejection-contract',
      level: 'P1',
      name: 'contract invalid wrong item rejects without reward',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('tray_with_wrong_item');
        const item = firstTrayItem(setup);
        const customer = firstCustomer(setup);
        if (!item || !customer) return FAIL('wrong-item scenario missing tray/customer');
        const scoreBefore = moneyToday(setup);
        const servedBefore = countServed(setup);
        const result = await game.contractInput({ type: 'dragTrayItemToCustomer', trayIndex: 0, customerId: customer.id });
        const after = result.snapshot || await game.snapshot();
        const rejected = result.ok === false || (after.feedback && after.feedback.lastEvent);
        if (!rejected) return FAIL('wrong item did not reject or report feedback');
        if (moneyToday(after) !== scoreBefore) return FAIL('wrong item changed score');
        if (countServed(after) !== servedBefore) return FAIL('wrong item changed order completion');
        return PASS('wrong item rejected with reason=' + (result.reason || (after.feedback && after.feedback.lastEvent) || 'feedback'));
      }
    },
    {
      id: 'p1-duplicate-item-rejection-contract',
      level: 'P1',
      name: 'contract duplicate served item rejects without reward',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('tray_with_duplicate_item');
        const customer = firstCustomer(setup);
        if (!customer || trayCount(setup) < 1) return FAIL('duplicate-item scenario missing tray/customer');
        const scoreBefore = moneyToday(setup);
        const servedBefore = countServed(setup);
        const trayBefore = trayCount(setup);
        const result = await game.contractInput({ type: 'dragTrayItemToCustomer', trayIndex: 0, customerId: customer.id });
        const after = result.snapshot || await game.snapshot();
        const rejected = result.ok === false || (after.feedback && after.feedback.lastEvent);
        if (!rejected) return FAIL('duplicate item did not reject or report feedback');
        if (moneyToday(after) !== scoreBefore) return FAIL('duplicate item changed score');
        if (countServed(after) !== servedBefore) return FAIL('duplicate item changed order completion');
        if (trayCount(after) !== trayBefore) return FAIL('duplicate item changed tray count');
        return PASS('duplicate item rejected unchanged');
      }
    },
    {
      id: 'p1-patience-timeout-contract',
      level: 'P1',
      name: 'contract customer patience timeout leaves without reward',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('impatient_customer');
        const customerBefore = firstCustomer(setup);
        if (!customerBefore) return FAIL('impatient_customer scenario missing customer');
        const scoreBefore = moneyToday(setup);
        const servedBefore = customersServedToday(setup);
        const customerCountBefore = (setup.customers || []).length;
        await game.contractInput({ type: 'wait', seconds: 20 });
        const after = await game.snapshot();
        const sameCustomer = (after.customers || []).find(function(c) { return c.id === customerBefore.id; });
        const leftOrAngry = !sameCustomer || sameCustomer.mood === 'angry' || sameCustomer.mood === 'leaving';
        if (!leftOrAngry) return FAIL('customer did not become angry/leaving or leave after patience timeout');
        if (moneyToday(after) !== scoreBefore) return FAIL('patience timeout changed today money');
        if (customersServedToday(after) !== servedBefore) return FAIL('patience timeout increased served stats');
        if ((after.customers || []).length > customerCountBefore) return FAIL('timeout unexpectedly increased customer count');
        return PASS('timeout rejected reward; customers=' + customerCountBefore + '->' + (after.customers || []).length);
      }
    },
    {
      id: 'p1-day-complete-contract',
      level: 'P1',
      name: 'contract closing settles day and conserves money',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('day_near_close');
        const totalStart = setup.money ? setup.money.total : 0;
        const todayStart = setup.money ? setup.money.today : 0;
        await game.contractInput({ type: 'wait', seconds: 120 });
        const after = await game.snapshot();
        if (after.phase !== 'dayComplete') return FAIL('phase did not reach dayComplete after closing wait');
        if (!after.stats || typeof after.stats.customersServedToday !== 'number') return FAIL('dayComplete stats missing');
        const expectedMinimum = totalStart + Math.max(0, todayStart);
        if (after.money.total < expectedMinimum) {
          return FAIL('money conservation failed at settlement');
        }
        return PASS('dayComplete total=' + after.money.total + ', today=' + after.money.today);
      }
    },
    {
      id: 'p1-real-shop-click-purchase',
      level: 'P1',
      name: 'real mouse click visible shop item purchases upgrade',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('shop_with_money');
        if (setup.phase !== 'shop') return FAIL('shop_with_money did not enter shop phase');
        const candidate = (setup.upgrades || []).find(function(u) {
          return u.cost !== null && u.affordable !== false && (u.level < u.maxLevel || !u.owned) && visibleShopItem(setup, u.upgradeId);
        });
        if (!candidate) return FAIL('no visible affordable upgrade candidate with bounds');
        const visible = visibleShopItem(setup, candidate.upgradeId);
        const point = center(visible && visible.bounds);
        if (!hasFinitePoint(point)) return FAIL('visible shop candidate missing bounds');
        const moneyBefore = moneyTotal(setup);
        await game.realShopPurchaseClick(visible);
        const after = await game.snapshot();
        const updated = upgradeSummary(after, candidate.upgradeId);
        if (!updated) return FAIL('clicked upgrade missing after purchase');
        const improved = updated.level > candidate.level || (!!updated.owned && !candidate.owned);
        if (!improved) return FAIL('real click did not improve upgrade');
        if (!(moneyTotal(after) < moneyBefore)) return FAIL('real click did not spend money');
        if (moneyTotal(after) < 0) return FAIL('money became negative after real shop click');
        return PASS('clicked ' + candidate.upgradeId + ', money=' + moneyBefore + '->' + moneyTotal(after));
      }
    },
    {
      id: 'p1-shop-scroll-behavior',
      level: 'P1',
      name: 'real mouse drag scrolls visible shop list within bounds',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('shop_scrollable');
        if (setup.phase !== 'shop') return FAIL('shop_scrollable did not enter shop phase');
        if (!setup.shop || !Array.isArray(setup.shop.visibleItems) || setup.shop.visibleItems.length < 1) {
          return FAIL('shop visibleItems missing');
        }
        const beforeSignature = shopVisibleSignature(setup);
        const after = await game.realShopScroll(setup);
        if (!after || !after.shop) return FAIL('shop snapshot missing after scroll');
        if (after.__allShopItemsVisible) return PASS('all shop items already visible; no scroll needed');
        const afterSignature = shopVisibleSignature(after);
        const offset = typeof after.shop.scrollOffset === 'number' ? after.shop.scrollOffset : null;
        const maxScroll = typeof after.shop.maxScroll === 'number' ? after.shop.maxScroll : null;
        if (afterSignature === beforeSignature) return FAIL('real shop scroll did not change visible items or offset');
        if (offset != null && maxScroll != null && (offset < 0 || offset > maxScroll + 1)) {
          return FAIL('shop scroll offset out of bounds');
        }
        return PASS('shop scrolled from ' + beforeSignature + ' to ' + afterSignature);
      }
    },
    {
      id: 'p1-shop-purchase-contract',
      level: 'P1',
      name: 'contract shop purchase spends money and improves upgrade',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('shop_with_money');
        const candidate = (setup.upgrades || []).find(function(u) {
          return u.cost !== null && u.affordable !== false && (u.level < u.maxLevel || !u.owned);
        });
        if (!candidate) return FAIL('no affordable upgrade candidate');
        const moneyBefore = setup.money.total;
        const result = await game.contractInput({ type: 'buy', upgradeId: candidate.upgradeId });
        if (!result || result.ok !== true) return FAIL('buy did not succeed for affordable upgrade');
        const after = result.snapshot || await game.snapshot();
        const updated = (after.upgrades || []).find(function(u) { return u.upgradeId === candidate.upgradeId; });
        if (!updated) return FAIL('purchased upgrade missing after buy');
        const improved = updated.level > candidate.level || (!!updated.owned && !candidate.owned);
        if (!improved) return FAIL('upgrade level/owned did not improve');
        if (!(after.money.total < moneyBefore)) return FAIL('money did not decrease after purchase');
        if (after.money.total < 0) return FAIL('money became negative');
        return PASS('money=' + moneyBefore + '->' + after.money.total);
      }
    },
    {
      id: 'p2-insufficient-money-contract',
      level: 'P2',
      name: 'contract insufficient money purchase is rejected unchanged',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('shop_insufficient_money');
        const candidate = (setup.upgrades || []).find(function(u) { return u.cost !== null; });
        if (!candidate) return FAIL('no upgrade candidate in insufficient scenario');
        const moneyBefore = setup.money.total;
        const upgradesBefore = clone(setup);
        const result = await game.contractInput({ type: 'buy', upgradeId: candidate.upgradeId });
        const after = result.snapshot || await game.snapshot();
        if (result.ok !== false && after.money.total !== moneyBefore) return FAIL('insufficient purchase accepted or changed money');
        if (after.money.total !== moneyBefore) return FAIL('money changed despite rejection');
        if (!sameUpgradeState(upgradesBefore, after)) return FAIL('upgrade state changed despite insufficient funds');
        return PASS('insufficient purchase rejected unchanged');
      }
    },
    {
      id: 'p2-next-day-progression-contract',
      level: 'P2',
      name: 'contract next day preserves progress and clears temporary state',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const initial = await game.loadScenario('tray_with_correct_item');
        if (!initial || initial.phase !== 'playing') return FAIL('temporary-state setup missing');
        let beforeShop = initial;
        for (let i = 0; i < 100 && beforeShop.phase === 'playing'; i++) {
          const waitResult = await game.contractInput({ type: 'wait', seconds: 120 });
          beforeShop = waitResult && waitResult.snapshot ? waitResult.snapshot : await game.snapshot();
        }
        if (!beforeShop || beforeShop.phase !== 'dayComplete') return FAIL('could not reach day summary');
        const shopResult = await game.contractInput({ type: 'continueToShop' });
        if (!shopResult || shopResult.ok !== true) return FAIL('continueToShop rejected');
        const setup = shopResult.snapshot || await game.snapshot();
        if (!setup || setup.phase !== 'shop') return FAIL('shop snapshot missing');
        const dayBefore = setup.day;
        const moneyBefore = moneyTotal(setup);
        const unlockBefore = JSON.stringify((setup.menuItems || []).map(function(item) {
          return { itemId: item.itemId, unlocked: !!item.unlocked };
        }));
        const priorCustomerIds = new Set((setup.customers || []).map(function(customer) {
          return String(customer.id);
        }));
        const result = await game.contractInput({ type: 'startNextDay' });
        if (!result || result.ok !== true) return FAIL('startNextDay rejected');
        const after = result.snapshot || await game.snapshot();
        if (!(after.day > dayBefore)) return FAIL('day did not increment');
        if (after.phase !== 'menu' && after.phase !== 'playing') return FAIL('invalid next-day phase');
        const customersAfter = after.customers || [];
        if (after.phase === 'menu' && customersAfter.length !== 0) return FAIL('menu retained temporary customers');
        if (customersAfter.some(function(customer) {
          return priorCustomerIds.has(String(customer.id));
        })) return FAIL('prior customers were retained');
        if (trayCount(after) !== 0) return FAIL('temporary tray was not cleared');
        if ((after.stations || []).some(function(station) {
          return station && (station.busy || station.ready || station.itemId != null ||
            (typeof station.progress === 'number' && station.progress > 0));
        })) return FAIL('temporary stations were not cleared');
        if (moneyTotal(after) !== moneyBefore) return FAIL('long-term funds changed');
        if (!sameUpgradeState(setup, after)) return FAIL('upgrades were not preserved');
        const unlockAfter = JSON.stringify((after.menuItems || []).map(function(item) {
          return { itemId: item.itemId, unlocked: !!item.unlocked };
        }));
        if (unlockBefore !== unlockAfter) return FAIL('unlocked menu items were not preserved');
        return PASS('day=' + dayBefore + '->' + after.day);
      }
    },
    {
      id: 'p2-tray-upgrade-effect-contract',
      level: 'P2',
      name: 'contract purchased tray upgrade affects next day capacity',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('shop_with_tray_upgrade');
        const capacityBefore = setup.tray && typeof setup.tray.capacity === 'number' ? setup.tray.capacity : null;
        const candidate = (setup.upgrades || []).find(function(u) {
          return /tray|capacity/i.test(String(u.upgradeId)) && u.cost !== null && u.affordable !== false && u.level < u.maxLevel;
        });
        if (!candidate) return FAIL('no affordable tray capacity upgrade candidate');
        const result = await game.contractInput({ type: 'buy', upgradeId: candidate.upgradeId });
        if (!result || result.ok !== true) return FAIL('tray upgrade purchase rejected');
        const purchased = result.snapshot || await game.snapshot();
        const updated = upgradeSummary(purchased, candidate.upgradeId);
        if (!updated || updated.level <= candidate.level) return FAIL('tray upgrade level did not increase');
        await game.contractInput({ type: 'startNextDay' });
        const after = await game.snapshot();
        const capacityAfter = after.tray && typeof after.tray.capacity === 'number' ? after.tray.capacity : null;
        if (capacityBefore != null && capacityAfter != null && capacityAfter <= capacityBefore) {
          return FAIL('tray capacity did not increase after upgrade');
        }
        return PASS('tray capacity=' + capacityBefore + '->' + capacityAfter);
      }
    },
    {
      id: 'p2-locked-menu-rejection-contract',
      level: 'P2',
      name: 'contract locked menu item rejects without occupying station',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('locked_menu_item');
        const locked = (setup.menuItems || []).find(function(m) { return m.unlocked === false; });
        if (!locked) return FAIL('locked_menu_item scenario missing locked item');
        const stationBefore = JSON.stringify((setup.stations || []).map(function(s) {
          return { id: s.id, busy: !!s.busy, ready: !!s.ready, itemId: s.itemId || null };
        }));
        const trayBefore = trayCount(setup);
        const result = await game.contractInput({ type: 'tapMenuItem', itemId: locked.itemId });
        const after = result.snapshot || await game.snapshot();
        const rejected = result.ok === false || (after.feedback && after.feedback.lastEvent);
        if (!rejected) return FAIL('locked menu item was not rejected');
        const stationAfter = JSON.stringify((after.stations || []).map(function(s) {
          return { id: s.id, busy: !!s.busy, ready: !!s.ready, itemId: s.itemId || null };
        }));
        if (stationAfter !== stationBefore) return FAIL('locked item changed station state');
        if (trayCount(after) !== trayBefore) return FAIL('locked item changed tray count');
        return PASS('locked item rejected unchanged');
      }
    },
    {
      id: 'p2-external-progress-nonblocking-contract',
      level: 'P2',
      name: 'contract external progress panels do not block core play',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        await game.reset({ clearSave: true });
        const result = await game.contractInput({ type: 'startShift' });
        const after = result.snapshot || await game.snapshot();
        if (after.phase !== 'playing') return FAIL('could not enter playing while external systems unavailable');
        if (after.persistence && after.persistence.externalPanelBlocking) return FAIL('external panel is blocking play');
        if (after.overlayBlocking) return FAIL('overlay blocks play after start');
        if (!after.canInteractWithPlayfield) return FAIL('playfield not interactive after start');
        return PASS('external systems nonblocking; phase=' + after.phase);
      }
    },
    {
      id: 'p2-drag-direction-follows-pointer',
      level: 'P2',
      name: 'real mouse drag visual follows pointer screen direction',
      timeoutMs: 15000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('tray_with_correct_item');
        const item = firstTrayItem(setup);
        const from = center(item && item.bounds);
        const viewport = await browser.eval('({ width: window.innerWidth, height: window.innerHeight })');
        if (!hasFinitePoint(from) || !viewport || !(viewport.width > 0) || !(viewport.height > 0)) return FAIL('missing bounds for direction check');
        const travel = Math.max(60, viewport.width * 0.06);
        const margin = 8;
        const dragY = Math.max(margin, Math.min(viewport.height - margin, from.y - 30));
        const leftTarget = { x: Math.max(margin, from.x - travel), y: dragY };
        const rightTarget = { x: Math.min(viewport.width - margin, from.x + travel), y: dragY };
        const deltaLeft = leftTarget.x - from.x;
        const deltaRight = rightTarget.x - from.x;
        if (!(deltaLeft < -10) || !(deltaRight > 10)) {
          return FAIL('test setup could not create left and right drag targets from tray bounds');
        }
        const observedRight = await game.realMouseDragWithObservation(from, rightTarget);
        await game.loadScenario('tray_with_correct_item');
        const resetSnap = await game.snapshot();
        const resetItem = firstTrayItem(resetSnap);
        const resetFrom = center(resetItem && resetItem.bounds) || from;
        const observedLeft = await game.realMouseDragWithObservation(resetFrom, leftTarget);
        const deltaDirectionOpposite = Math.sign(deltaLeft) !== Math.sign(deltaRight);
        if (!deltaDirectionOpposite) return FAIL('test setup did not create opposite drag directions');
        const dragRight = observedRight && observedRight.drag;
        const dragLeft = observedLeft && observedLeft.drag;
        if (!dragRight || !dragRight.active || !Number.isFinite(dragRight.screenX)) {
          return FAIL('right drag did not expose active visible drag position');
        }
        if (!dragLeft || !dragLeft.active || !Number.isFinite(dragLeft.screenX)) {
          return FAIL('left drag did not expose active visible drag position');
        }
        const rightVisualDelta = dragRight.screenX - from.x;
        const leftVisualDelta = dragLeft.screenX - resetFrom.x;
        if (!(rightVisualDelta > 10)) return FAIL('right drag visual position did not move right');
        if (!(leftVisualDelta < -10)) return FAIL('left drag visual position did not move left');
        return PASS('visual drag deltas left=' + Math.round(leftVisualDelta) + ', right=' + Math.round(rightVisualDelta));
      }
    },
    {
      id: 'p2-tutorial-feedback-contract',
      level: 'P2',
      name: 'contract tutorial and feedback are observable',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('active_shift_basic', { day: 1, tutorial: true });
        const item = (setup.menuItems || []).find(function(m) { return m.unlocked; });
        if (!item) return FAIL('no menu item for tutorial action');
        const tutorialBefore = !!(setup.tutorial && setup.tutorial.visible);
        const revisionBefore = (setup.observability && (setup.observability.hudRevision || setup.observability.renderRevision)) || 0;
        const result = await game.contractInput({ type: 'tapMenuItem', itemId: item.itemId });
        const after = result.snapshot || await game.snapshot();
        const tutorialAfter = !!(after.tutorial && after.tutorial.visible);
        const revisionAfter = (after.observability && (after.observability.hudRevision || after.observability.renderRevision)) || 0;
        if (tutorialBefore && tutorialAfter) return FAIL('tutorial remained visible after first production tap');
        if (revisionAfter <= revisionBefore && !(after.feedback && after.feedback.lastEvent)) {
          return FAIL('no feedback or revision change after tutorial action');
        }
        return PASS('tutorial ' + tutorialBefore + '->' + tutorialAfter);
      }
    },
    {
      id: 'p2-tray-capacity-contract',
      level: 'P2',
      name: 'contract tray capacity rejects overflow unchanged',
      timeoutMs: 12000,
      async run({ browser }) {
        const game = createGameDriver(browser);
        const setup = await game.loadScenario('tray_at_capacity');
        const readyStation = (setup.stations || []).find(function(s) { return s.ready; });
        if (!readyStation) return FAIL('no ready station in capacity scenario');
        const trayBefore = trayCount(setup);
        if (trayBefore !== setup.tray.capacity) return FAIL('scenario tray is not at capacity');
        const result = await game.contractInput({ type: 'collectStation', stationId: readyStation.id });
        const after = result.snapshot || await game.snapshot();
        if (result.ok !== false && trayCount(after) !== trayBefore) return FAIL('overflow collect accepted');
        if (trayCount(after) !== trayBefore) return FAIL('tray count changed on overflow');
        const stationAfter = (after.stations || []).find(function(s) { return s.id === readyStation.id; });
        if (!stationAfter || !stationAfter.ready) return FAIL('ready item disappeared after overflow rejection');
        return PASS('capacity preserved at ' + trayBefore);
      }
    }
  ]
};
