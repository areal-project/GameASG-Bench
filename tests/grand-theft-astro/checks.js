const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// === GDD Coverage Map ===
// M1 (3D city playfield) -> p0-boot-playfield, p0-snapshot-schema
// M2 (walking direction) -> p1-real-keyboard-walking-direction
// M3 (weapon, aim and shoot) -> p1-real-aim-threat-direction, p1-real-fire-combat-loop, p1-real-weapon-switch, p2-invalid-empty-ammo-rejection-contract
// M4 (NPC/police/wanted/threat) -> p1-real-aim-threat-direction, p1-real-fire-combat-loop
// M5 (vehicle driving) -> p1-real-vehicle-driving-direction
// M6 (resources and HUD) -> p1-real-cash-pickup-loop, p2-shop-insufficient-funds-invariant-contract, p2-health-ammo-pickup-contract
// M7 (shop/equipment) -> p2-real-shop-purchase, p2-shop-insufficient-funds-invariant-contract
// M8 (quest chain) -> p2-quest-navigation-progression-contract, p2-action-quest-progression-contract
// M9 (state/death/respawn) -> p1-death-respawn-state-contract, p1-ui-overlay-unblocks-playfield
// M10 (minimap/navigation) -> p2-minimap-toggle-real-click
// M11 (touch controls) -> p2-real-touch-movement
// M12 (audio/juice) -> covered indirectly through visual feedback requirements; audio is optional P2 and not a blocking L2 oracle.
// M13 (camera zoom/readability) -> p2-camera-zoom-readability
//
// === Category Map ===
// Boot & Stability: p0-boot-playfield, p0-snapshot-schema
// UI Flow & Blocking: p1-ui-overlay-unblocks-playfield
// Input Semantics: p1-real-keyboard-walking-direction, p1-real-aim-threat-direction, p1-real-weapon-switch, p1-real-vehicle-driving-direction, p2-real-touch-movement
// Core Mechanic Loop: p1-real-fire-combat-loop, p1-real-cash-pickup-loop
// State Machine: p1-death-respawn-state-contract
// Economy/Progression: p2-real-shop-purchase, p2-quest-navigation-progression-contract, p2-action-quest-progression-contract
// Feedback & Observability: p2-minimap-toggle-real-click, p2-camera-zoom-readability
// Invariants & Rejection: p2-shop-insufficient-funds-invariant-contract, p2-invalid-empty-ammo-rejection-contract, p2-health-ammo-pickup-contract
//
// === Rationality Map ===
// p1-ui-overlay-unblocks-playfield: real action: start/advance intro and inspect playfield geometry | independent observation: phase/ui + playfield bounds | empty-shell failure: phase playing with overlayBlocking true fails.
// p1-real-keyboard-walking-direction: real action: ArrowRight then ArrowLeft | independent observation: player screen position + renderRevision/canvas hash | empty-shell failure: static avatar or same-direction movement fails.
// p1-real-aim-threat-direction: real action: mouse drag on threat/fire control | independent observation: facing/threat/NPC reaction + ammo invariant | empty-shell failure: cosmetic button without aim or threat behavior fails.
// p1-real-fire-combat-loop: real action: Space key or fire control click | independent observation: ammo + projectile/hit/wanted feedback | empty-shell failure: button flash without combat state fails.
// p1-real-weapon-switch: real action: KeyQ or weapon control click | independent observation: weapon HUD/current + locked weapon rejection | empty-shell failure: all weapons always switchable or no HUD sync fails.
// p1-real-vehicle-driving-direction: real action: enter control, ArrowUp, ArrowLeft, ArrowRight, exit | independent observation: mode + vehicle speed/screen/heading | empty-shell failure: car UI without motion or no exit fails.
// p1-real-cash-pickup-loop: real action: keyboard movement toward visible pickup | independent observation: cash delta + pickup count + collectionCount | empty-shell failure: API-only cash increment without collision pickup fails.
// p1-death-respawn-state-contract: contract action: death setup, invalid movement/fire, respawn | independent observation: dead phase + ui overlay + restored health/wanted | empty-shell failure: terminal state accepting inputs or respawn not clearing overlay fails.
// p2-real-shop-purchase: real action: open visible shop and click item | independent observation: cash decrease + owned/ammo/health effect | empty-shell failure: contract-only shop or no visible buy control fails.
// p2-shop-insufficient-funds-invariant-contract: contract action: insufficient buy | independent observation: rejected result + unchanged totals | empty-shell failure: always-success purchase or negative cash fails.
// p2-health-ammo-pickup-contract: contract or real pickup action | independent observation: health/ammo delta + pickup count | empty-shell failure: pickup changes wrong resource or overfills fails.
// p2-real-touch-movement: real action: dispatchTouchEvent drag | independent observation: player screen position/action revision | empty-shell failure: desktop-only keyboard implementation fails.
// p2-minimap-toggle-real-click: real action: mouseClick minimap semantic region | independent observation: minimap state/bounds/revision | empty-shell failure: inert minimap panel fails.
// p2-quest-navigation-progression-contract: contract action: active quest setup, move toward target/advance dialog | independent observation: quest distance/completedCount/reward | empty-shell failure: loadScenario pre-completes or no navigation fails.
// p2-action-quest-progression-contract: contract setup + matching player-level action | independent observation: quest type/progress/reward with shop/vehicle/combat/resource delta | empty-shell failure: generic complete button or pre-awarded reward fails.
// p2-camera-zoom-readability: real action: wheel or zoom action | independent observation: camera zoom/playfield state and HUD/player visibility | empty-shell failure: inert zoom or zoom hiding the game fails.
// p2-invalid-empty-ammo-rejection-contract: contract action: fire with no ammo | independent observation: rejected result + unchanged ammo/hit/projectile totals | empty-shell failure: no-ammo shots or ok:true-only contract fails.

function PASS(detail) {
  return { status: 'PASS', detail };
}

function FAIL(detail) {
  return { status: 'FAIL', detail };
}

function num(v, fallback = 0) {
  return Number.isFinite(Number(v)) ? Number(v) : fallback;
}

function sameSign(a, b) {
  return Math.sign(a) !== 0 && Math.sign(a) === Math.sign(b);
}

function axisDelta(snapshotA, snapshotB, axis) {
  const screenKey = axis === 'x' ? 'screenX' : 'screenY';
  const worldKey = axis === 'x' ? 'worldX' : 'worldZ';
  const screenDelta = num(snapshotB?.player?.[screenKey]) - num(snapshotA?.player?.[screenKey]);
  const worldDelta = num(snapshotB?.player?.[worldKey]) - num(snapshotA?.player?.[worldKey]);
  return {
    screen: screenDelta,
    world: worldDelta,
    observed: Math.abs(screenDelta) >= 1 ? screenDelta : worldDelta,
    source: Math.abs(screenDelta) >= 1 ? screenKey : worldKey
  };
}

async function findTouchMovementTarget(browser) {
  return await browser.eval(`
    (function() {
      const candidates = Array.from(document.querySelectorAll('*')).map(el => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const label = [
          el.getAttribute('data-game-control'),
          el.getAttribute('aria-label'),
          el.getAttribute('title'),
          el.id,
          typeof el.className === 'string' ? el.className : ''
        ].filter(Boolean).join(' ');
        return { el, r, style, label };
      }).filter(item => {
        const { r, style, label } = item;
        return r.width >= 40 && r.height >= 40 &&
          style.display !== 'none' && style.visibility !== 'hidden' &&
          style.opacity !== '0' && style.pointerEvents !== 'none' &&
          /joystick|joy|movement|move|walk/i.test(label) &&
          !/aim|fire|threat|zoom/i.test(label);
      }).sort((a, b) => (b.r.width * b.r.height) - (a.r.width * a.r.height));
      if (!candidates.length) return null;
      const { r, label } = candidates[0];
      return { left: r.left, top: r.top, width: r.width, height: r.height, source: label };
    })()
  `);
}

function ownedList(snapshot) {
  return Array.isArray(snapshot?.weapon?.owned) ? snapshot.weapon.owned.slice().sort() : [];
}

function createGameDriver(browser) {
  return {
    async waitForReady() {
      const deadline = Date.now() + 10000;
      let last = null;
      while (Date.now() < deadline) {
        last = await this.snapshot();
        const canvas = await this.getPlayfield();
        if ((last && !last.__l2_err__ && last.playfield) || (canvas && canvas.width > 100 && canvas.height > 100)) {
          return { snapshot: last, canvas };
        }
        await browser.sleep(250);
      }
      throw new Error(`game not ready: ${JSON.stringify(last)}`);
    },

    async getPlayfield() {
      return await browser.eval(`
        (function() {
          const semantic = document.querySelector('[data-game-playfield="main"]');
          const canvases = Array.from(document.querySelectorAll('canvas'));
          let el = semantic;
          if (!el && canvases.length) {
            el = canvases.map(c => ({ c, r: c.getBoundingClientRect() }))
              .filter(x => x.r.width > 80 && x.r.height > 80)
              .sort((a, b) => (b.r.width * b.r.height) - (a.r.width * a.r.height))[0]?.c || null;
          }
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, width: r.width, height: r.height, centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 };
        })()
      `);
    },

    async snapshot() {
      return await browser.eval(`
        (function() {
          if (!window.__gameTest || typeof window.__gameTest.getSnapshot !== 'function') {
            return { missingContract: true };
          }
          return window.__gameTest.getSnapshot();
        })()
      `);
    },

    async reset(options = {}) {
      return await browser.eval(`(async function(){
        if (!window.__gameTest || typeof window.__gameTest.reset !== 'function') return { missingContract: true };
        return await window.__gameTest.reset(${JSON.stringify(options)});
      })()`);
    },

    async loadScenario(name, options = {}) {
      return await browser.eval(`(async function(){
        if (!window.__gameTest || typeof window.__gameTest.loadScenario !== 'function') return { missingContract: true };
        return await window.__gameTest.loadScenario(${JSON.stringify(name)}, ${JSON.stringify(options)});
      })()`);
    },

    async contractInput(action) {
      return await browser.eval(`(async function(){
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') return { ok:false, reason:'missing window.__gameTest.input' };
        return await window.__gameTest.input(${JSON.stringify(action)});
      })()`);
    },

    async realClickControl(control) {
      const labels = {
        start: '\\b(start|play|begin|continue)\\b',
        threat: '\\b(threat|aim|hold|intimidate)\\b',
        fire: '\\b(fire|shoot|attack)\\b',
        enterVehicle: '\\b(enter|drive|vehicle|car)\\b',
        exitVehicle: '\\b(exit|leave|get out)\\b',
        respawn: '\\b(respawn|restart|revive|try again)\\b',
        openShop: '\\b(shop|store|buy|act|interact)\\b',
        closeShop: '\\b(close|back|resume|done)\\b'
      };
      const source = labels[control] || control;
      const target = await browser.eval(`
        (function() {
          const re = new RegExp(${JSON.stringify(source)}, 'i');
          const candidates = Array.from(document.querySelectorAll('button, [role="button"], a, [aria-label], [title], [data-game-control]'));
          for (const el of candidates) {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (r.width <= 0 || r.height <= 0 || style.visibility === 'hidden' || style.display === 'none') continue;
            const label = [
              el.getAttribute('data-game-control'),
              el.getAttribute('aria-label'),
              el.getAttribute('title'),
              el.textContent
            ].filter(Boolean).join(' ');
            if (label === ${JSON.stringify(control)} || re.test(label)) {
              return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
            }
          }
          return null;
        })()
      `);
      if (!target) return false;
      await browser.mouseClick(target.x, target.y);
      return true;
    },

    async realOpenShop() {
      if (await this.realClickControl('openShop')) return true;
      const target = await browser.eval(`
        (function() {
          const candidates = Array.from(document.querySelectorAll('button, [role="button"], a, [aria-label], [title], [data-game-control], [id*="action" i], [id*="interact" i], [id*="context" i], [id*="act" i], [class*="action" i], [class*="interact" i], [class*="context" i]'));
          for (const el of candidates) {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (r.width <= 0 || r.height <= 0 || style.visibility === 'hidden' || style.display === 'none') continue;
            const id = el.id || '';
            const className = typeof el.className === 'string' ? el.className : '';
            const marker = [id, className, el.getAttribute('data-game-control'), el.getAttribute('aria-label'), el.getAttribute('title'), el.textContent].filter(Boolean).join(' ');
            if (/\\b(?:hint|prompt|label|help)\\b/i.test(id + ' ' + className)) continue;
            if (!/(shop|store|market|act|interact|context|use|enter)/i.test(marker)) continue;
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
          return null;
        })()
      `);
      if (!target) return await this.realPressVisibleShopKey();
      await browser.mouseClick(target.x, target.y);
      return true;
    },

    async getControlPoint(control) {
      const labels = {
        threat: '\\b(threat|aim|hold|intimidate)\\b',
        fire: '\\b(fire|shoot|attack)\\b'
      };
      const source = labels[control] || control;
      return await browser.eval(`
        (function() {
          const re = new RegExp(${JSON.stringify(source)}, 'i');
          const candidates = Array.from(document.querySelectorAll('button, [role="button"], [aria-label], [title], [data-game-control]'));
          for (const el of candidates) {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (r.width <= 0 || r.height <= 0 || style.visibility === 'hidden' || style.display === 'none') continue;
            const label = [
              el.getAttribute('data-game-control'),
              el.getAttribute('aria-label'),
              el.getAttribute('title'),
              el.textContent
            ].filter(Boolean).join(' ');
            if (label === ${JSON.stringify(control)} || re.test(label)) {
              return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
            }
          }
          return null;
        })()
      `);
    },

    async realDragControl(control, dx, dy) {
      const from = await this.getControlPoint(control);
      if (!from) return false;
      await this.realMouseDrag(from, { x: from.x + dx, y: from.y + dy }, 8);
      return true;
    },

    async realClickWeapon(weaponId) {
      const target = await browser.eval(`
        (function() {
          const selectors = [];
          if (${JSON.stringify(weaponId)}) selectors.push('[data-game-weapon="' + ${JSON.stringify(weaponId)} + '"]');
          selectors.push('[data-game-control="weaponSwitch"]');
          for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (!el) continue;
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') {
              return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
            }
          }
          const semantic = Array.from(document.querySelectorAll('button, [role="button"], [aria-label], [title], [data-game-control]')).find(el => {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const label = [el.getAttribute('data-game-control'), el.getAttribute('aria-label'), el.getAttribute('title'), el.textContent].filter(Boolean).join(' ');
            return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
              && /(?:switch|change|select|equip|loadout).*weapon|weapon.*(?:switch|change|select|equip|loadout)/i.test(label);
          });
          if (semantic) {
            const r = semantic.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
          return null;
        })()
      `);
      if (!target) return false;
      await browser.mouseClick(target.x, target.y);
      return true;
    },

    async realClickShopItem(preferAffordable, snapshot = null) {
      const snapshotItems = Array.isArray(snapshot?.shop?.visibleItems) ? snapshot.shop.visibleItems : [];
      const snapshotCash = Number(snapshot?.player?.cash);
      const target = await browser.eval(`
        (function() {
          const itemRecords = new Map(${JSON.stringify(snapshotItems)}.map(item => [String(item.itemId), item]));
          const cash = ${Number.isFinite(snapshotCash) ? snapshotCash : 'null'};
          const selector = '[data-game-shop-item], [data-game-control="buy"], [data-game-item-id], [data-item-id], [data-item], [data-buy], [data-id], button, [role="button"], a, [onclick], [class*="shopitem" i], [class*="shop-item" i], [class*="shop-row" i], [class*="item-row" i]';
          const markerOf = el => [
            el.id,
            typeof el.className === 'string' ? el.className : '',
            el.getAttribute('aria-label'),
            el.getAttribute('title'),
            el.getAttribute('data-game-region')
          ].filter(Boolean).join(' ');
          const textOf = el => [
            el.getAttribute('data-game-shop-item'),
            el.getAttribute('data-game-item-id'),
            el.getAttribute('data-item-id'),
            el.getAttribute('data-buy'),
            el.getAttribute('data-item'),
            el.getAttribute('data-id'),
            el.getAttribute('aria-label'),
            el.getAttribute('title'),
            el.textContent
          ].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim();
          const itemIdFor = el => [
            'data-game-shop-item',
            'data-game-item-id',
            'data-item-id',
            'data-buy',
            'data-item',
            'data-id'
          ].map(name => el.getAttribute(name)).find(value => value !== null && value !== '') || null;
          const inShop = el => {
            let node = el;
            while (node && node !== document.body) {
              if (/\\b(?:shop|store|market)\\b/i.test(markerOf(node))) return true;
              node = node.parentElement;
            }
            return false;
          };
          const candidates = Array.from(document.querySelectorAll(selector)).map(el => {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (r.width <= 0 || r.height <= 0 || style.visibility === 'hidden' || style.display === 'none' || !inShop(el)) return null;
            const row = el.closest('[data-game-shop-item], [data-game-item-id], [data-item-id], [data-buy], [data-item], [data-id], [data-game-control="buy"], button, [role="button"], a, [onclick], [class*="shopitem" i], [class*="shop-item" i], [class*="shop-row" i], [class*="item-row" i]') || el;
            const itemId = itemIdFor(el) || itemIdFor(row);
            const itemClass = /(?:shopitem|shop-item|shop-row|item-row)/i.test(typeof row.className === 'string' ? row.className : '');
            const label = textOf(row) || textOf(el);
            const direct = [el, row].some(node => /^(BUTTON|A|SUMMARY)$/.test(node.tagName) || node.getAttribute('role') === 'button' || typeof node.onclick === 'function' || node.hasAttribute('data-buy') || node.hasAttribute('data-item') || node.hasAttribute('data-game-shop-item'));
            const semanticItem = /buy|purchase|weapon|ammo|health|quest|price|cost|credits|[$¥]/i.test(label);
            if ((!itemId && !itemClass && !semanticItem) || (!direct && !itemClass && !itemId)) return null;
            const generic = /^(?:shop|store|market|open shop|open store|close shop|leave shop|close|back|resume|done)\\s*$/i.test(label);
            if (generic && !itemId && !itemClass) return null;
            const affordableAttr = el.getAttribute('data-game-affordable') || row.getAttribute('data-game-affordable') || el.getAttribute('data-affordable') || row.getAttribute('data-affordable');
            const blocked = Boolean(el.disabled || row.disabled || el.getAttribute('aria-disabled') === 'true' || row.getAttribute('aria-disabled') === 'true' || /\\b(?:unaffordable|unavailable|disabled|locked|owned|cannot buy|needs weapon)\\b/i.test(markerOf(row) + ' ' + label));
            const record = itemId === null ? null : itemRecords.get(String(itemId));
            const price = label.match(/[$¥]\\s*([0-9]+(?:\\.[0-9]+)?)/);
            const affordable = affordableAttr !== null
              ? affordableAttr !== 'false'
              : record
                ? record.affordable !== false
                : blocked
                  ? false
                  : price
                    ? cash === null || Number(price[1]) <= cash
                    : true;
            const actionable = !blocked;
            const score = (itemId ? 4 : 0) + (direct ? 3 : 0) + (record ? 1 : 0) + (itemClass ? 1 : 0);
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, itemId, affordable, actionable, score };
          }).filter(Boolean);
          const preferred = candidates
            .filter(item => item.actionable && item.affordable === ${preferAffordable ? 'true' : 'false'})
            .sort((a, b) => b.score - a.score);
          return preferred[0] || null;
        })()
      `);
      if (!target) return null;
      await browser.mouseClick(target.x, target.y);
      return target;
    },

    async realPressVisibleShopKey() {
      const key = await browser.eval(`
        (function() {
          const texts = Array.from(document.querySelectorAll('*'))
            .filter(el => {
              const r = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName);
            })
            .map(el => String(el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim())
            .filter(text => text && text.length <= 400)
            .sort((a, b) => a.length - b.length);
          const patterns = [
            /\\[\\s*(Enter|[A-Z])\\s*\\]/i,
            /\\b(?:press|hit|tap|use)\\s+(?:the\\s+)?(?:key\\s*)?(Enter|[A-Z])\\b/i,
            /\\b(?:shop|store|market)\\s*[:=-]\\s*(Enter|[A-Z])\\b/i,
            /\\b(Enter|[A-Z])\\s*(?:[·:|–—-]|\\s+)(?:open|enter|interact|use|shop|store|market)\\b/i,
            /\\b(Enter|[A-Z])\\s+(?:shop|store|market)\\b/i,
            /\\b(?:shop|store|market)\\b.{0,80}\\b(?:press|hit|tap|use)\\s+(?:the\\s+)?(?:key\\s*)?(Enter|[A-Z])\\b/i
          ];
          const shopLine = texts.find(line => /\\b(?:shop|store|market)\\b/i.test(line) && patterns.some(pattern => pattern.test(line)));
          if (!shopLine) return null;
          const match = patterns.map(pattern => shopLine.match(pattern)).find(Boolean);
          const value = match && match[1];
          if (!value) return null;
          return /^enter$/i.test(value) ? 'Enter' : 'Key' + value.toUpperCase();
        })()
      `);
      if (!key) return false;
      await browser.holdKey(key, 200);
      return true;
    },

    async moveTowardScreenPoint(target, maxSteps = 10) {
      for (let i = 0; i < maxSteps; i++) {
        const snap = await this.snapshot();
        const player = snap?.player || {};
        if (!Number.isFinite(Number(player.screenX)) || !Number.isFinite(Number(player.screenY))) return false;
        const dx = num(target.screenX) - num(player.screenX);
        const dy = num(target.screenY) - num(player.screenY);
        const key = Math.abs(dx) >= Math.abs(dy)
          ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft')
          : (dy >= 0 ? 'ArrowDown' : 'ArrowUp');
        await browser.holdKey(key, 260);
        await browser.sleep(80);
      }
      return true;
    },

    async realMouseDrag(from, to, steps = 6) {
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y, button: 'none' });
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1 });
      for (let i = 1; i <= steps; i++) {
        const x = from.x + (to.x - from.x) * (i / steps);
        const y = from.y + (to.y - from.y) * (i / steps);
        await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left' });
        await browser.sleep(40);
      }
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', clickCount: 1 });
    },

    async realTouchDrag(from, to) {
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: from.x, y: from.y, radiusX: 4, radiusY: 4, id: 1 }]
      });
      await browser.sleep(80);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: to.x, y: to.y, radiusX: 4, radiusY: 4, id: 1 }]
      });
      await browser.sleep(450);
      await browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: []
      });
    },

    async clickMinimap() {
      const target = await browser.eval(`
        (function() {
          const candidates = Array.from(document.querySelectorAll('[data-game-region="minimap"], [aria-label*="map" i], [title*="map" i], button, [role="button"], canvas'));
          const visible = candidates.map(el => {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (r.width <= 0 || r.height <= 0 || style.visibility === 'hidden' || style.display === 'none') return null;
            const label = [
              el.getAttribute('data-game-region'),
              el.getAttribute('aria-label'),
              el.getAttribute('title'),
              el.textContent
            ].filter(Boolean).join(' ');
            const regionMatch = /minimap|mini.?map|map|navigation|radar|地图|小地图/i.test(label);
            const smallHudRegion = r.width >= 30 && r.height >= 30 && r.width < window.innerWidth * 0.45 && r.height < window.innerHeight * 0.45 &&
              (r.left < window.innerWidth * 0.35 || r.right > window.innerWidth * 0.65) &&
              (r.top < window.innerHeight * 0.35 || r.bottom > window.innerHeight * 0.65);
            return { el, r, regionMatch, smallHudRegion };
          }).filter(Boolean);
          const semantic = visible.find(item => item.regionMatch && item.el.tagName !== 'CANVAS')
            || visible.find(item => item.regionMatch);
          const canvas = visible.find(item => item.el.tagName === 'CANVAS' && item.smallHudRegion);
          const chosen = semantic || canvas;
          if (!chosen) return null;
          return { x: chosen.r.left + chosen.r.width / 2, y: chosen.r.top + chosen.r.height / 2, width: chosen.r.width, height: chosen.r.height };
        })()
      `);
      if (!target) return false;
      await browser.mouseClick(target.x, target.y);
      return true;
    }
  };
}

function assertSnapshotShape(snapshot) {
  const requiredTop = ['phase', 'mode', 'playfield', 'ui', 'player', 'weapon', 'wanted', 'entityCounts', 'pickups', 'minimap', 'camera', 'feedback'];
  for (const key of requiredTop) {
    if (!(key in snapshot)) return `missing snapshot.${key}`;
  }
  if (!Number.isFinite(Number(snapshot.player.health))) return 'player.health must be numeric';
  if (!Number.isFinite(Number(snapshot.player.cash))) return 'player.cash must be numeric';
  if (!Number.isFinite(Number(snapshot.weapon.ammo))) return 'weapon.ammo must be numeric';
  if (!Number.isFinite(Number(snapshot.wanted.level))) return 'wanted.level must be numeric';
  if (num(snapshot.player.health) < 0 || num(snapshot.player.cash) < 0 || num(snapshot.weapon.ammo) < 0 || num(snapshot.wanted.level) < 0) {
    return 'resource fields must be non-negative';
  }
  if (!Array.isArray(snapshot.weapon.owned)) return 'weapon.owned must be an array';
  if (!Array.isArray(snapshot.weapon.switchable)) return 'weapon.switchable must be an array';
  if (!Array.isArray(snapshot.weapon.locked)) return 'weapon.locked must be an array';
  if (!snapshot.shop || !Array.isArray(snapshot.shop.visibleItems)) return 'shop.visibleItems must be an array';
  if (typeof snapshot.minimap.visible !== 'boolean') return 'minimap.visible must be boolean';
  if (!Number.isFinite(Number(snapshot.camera.zoom))) return 'camera.zoom must be numeric';
  return null;
}

async function requireScenario(game, name, options) {
  const setup = await game.loadScenario(name, options || {});
  if (!setup || setup.missingContract || setup.ok === false) {
    throw new Error(`${name} scenario unavailable: ${setup?.reason || 'missing contract'}`);
  }
  return setup;
}

function actionWithKey(action, key) {
  const { type, action: legacy, ...rest } = action || {};
  return { ...rest, [key]: type || legacy };
}

function isActionEnvelopeRejection(result) {
  const reason = String(result?.reason || '').toLowerCase();
  const hasEnvelopeWord = /action|input|command|type/.test(reason);
  const hasShapeWord = /unknown|missing|invalid|unsupported|unrecognized/.test(reason);
  return result?.ok === false && hasEnvelopeWord && hasShapeWord;
}

async function playerAction(game, action) {
  const typed = await game.contractInput(actionWithKey(action, 'type'));
  if (!isActionEnvelopeRejection(typed)) return typed;
  return await game.contractInput(actionWithKey(action, 'action'));
}

function screenDirection(snapshot, point) {
  const target = point || snapshot?.quest || {};
  const targetX = Number(target?.screenX ?? target?.targetScreenX);
  const targetY = Number(target?.screenY ?? target?.targetScreenY);
  const playerX = Number(snapshot?.player?.screenX);
  const playerY = Number(snapshot?.player?.screenY);
  if (![targetX, targetY, playerX, playerY].every(Number.isFinite)) return null;
  const dx = targetX - playerX;
  const dy = targetY - playerY;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

async function moveTowardTarget(game, snapshot, maxSteps = 12, point = null) {
  let current = snapshot;
  for (let i = 0; i < maxSteps; i += 1) {
    const distance = Number(current?.quest?.distanceToTarget);
    if (Number.isFinite(distance) && distance <= 3) break;
    const direction = screenDirection(current, point || current?.quest);
    if (!direction) break;
    const result = await playerAction(game, { type: 'move', direction, durationMs: 700 });
    current = result?.snapshot || await game.snapshot();
    if (result?.ok === false) break;
  }
  return current;
}

function questProgressed(before, after) {
  return num(after?.quest?.completedCount) > num(before?.quest?.completedCount)
    || after?.quest?.progress !== before?.quest?.progress
    || after?.quest?.type !== before?.quest?.type;
}

function distanceImprovedBetween(before, after) {
  const beforeDistance = Number(before?.quest?.distanceToTarget);
  const afterDistance = Number(after?.quest?.distanceToTarget);
  return Number.isFinite(beforeDistance) && Number.isFinite(afterDistance) && afterDistance < beforeDistance;
}

function actionEffectObserved(before, after, actionType) {
  if (!before || !after) return false;
  if (questProgressed(before, after)) return true;
  if ((actionType === 'move' || actionType === 'drive') && distanceImprovedBetween(before, after)) return true;
  if (actionType === 'enterVehicle' &&
      (before.mode !== after.mode || before.vehicle?.inVehicle !== after.vehicle?.inVehicle)) return true;
  if (actionType === 'buy' && (
      num(after.player?.cash) < num(before.player?.cash)
      || ownedList(after).join(',') !== ownedList(before).join(',')
      || num(after.weapon?.ammo) !== num(before.weapon?.ammo)
      || num(after.player?.health) !== num(before.player?.health)
    )) return true;
  if (actionType === 'collect') {
    return num(after.player?.cash) !== num(before.player?.cash)
      || num(after.player?.health) !== num(before.player?.health)
      || num(after.weapon?.ammo) !== num(before.weapon?.ammo)
      || JSON.stringify(after.pickups || {}) !== JSON.stringify(before.pickups || {});
  }
  return false;
}

function isPickupActionEnvelopeRejection(result) {
  const reason = String(result?.reason || '').toLowerCase();
  return result?.ok === false
    && /(?:unknown|missing|invalid|unsupported|unrecognized)\s+(?:action|input|command|type)|(?:action|input|command|type)\s+(?:unknown|missing|invalid|unsupported|unrecognized)/.test(reason);
}

async function semanticContractInput(game, type, fields = {}) {
  const first = await game.contractInput({ type, ...fields });
  if (!isPickupActionEnvelopeRejection(first)) return first;
  return game.contractInput({ action: type, ...fields });
}

function samePickupPosition(a, b) {
  const ax = Number(a?.worldX);
  const az = Number(a?.worldZ);
  const bx = Number(b?.worldX);
  const bz = Number(b?.worldZ);
  return Number.isFinite(ax) && Number.isFinite(az)
    && Number.isFinite(bx) && Number.isFinite(bz)
    && Math.abs(ax - bx) < 0.001 && Math.abs(az - bz) < 0.001;
}

function pickupWasRemoved(before, after, kind) {
  const countKey = kind === 'health' ? 'healthPickups' : 'ammoPickups';
  const beforeCount = Number(before?.entityCounts?.[countKey]);
  const afterCount = Number(after?.entityCounts?.[countKey]);
  if (Number.isFinite(beforeCount) && Number.isFinite(afterCount)) return afterCount < beforeCount;
  const pickupKey = kind === 'health' ? 'nearestHealth' : 'nearestAmmo';
  const beforeNearest = before?.pickups?.[pickupKey];
  const afterNearest = after?.pickups?.[pickupKey];
  return !!beforeNearest && (!afterNearest || !samePickupPosition(beforeNearest, afterNearest));
}

const suite = [
  {
    id: 'p0-boot-playfield',
    level: 'P0',
    name: 'Boot shows a nonblank main 3D playfield',
    timeoutMs: 15000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const playfield = await game.getPlayfield();
      if (!playfield || playfield.width < 100 || playfield.height < 100) return FAIL('no visible playfield geometry');
      const hash = await ctx.browser.canvasPixelHash();
      if (hash === null) return FAIL('unable to capture playfield pixels');
      const rendererEvidence = await ctx.browser.eval(`
        (function() {
          const l2 = window.__l2 || {};
          const snap = window.__gameTest && typeof window.__gameTest.getSnapshot === 'function'
            ? window.__gameTest.getSnapshot()
            : null;
          const rendererType = String(snap?.playfield?.rendererType || snap?.playfield?.renderer || '').toLowerCase();
          const snapshot3d = snap?.playfield?.is3D === true || /webgl|three|3d/.test(rendererType);
          return {
            webglContextCount: Number(l2.webglContextCount || 0),
            contextTypes: l2.canvasContextTypes || {},
            snapshot3d,
            rendererType
          };
        })()
      `);
      if (!rendererEvidence?.webglContextCount) {
        return FAIL(`main playfield has no real 3D/WebGL renderer evidence; contextTypes=${JSON.stringify(rendererEvidence?.contextTypes || {})}`);
      }
      if (ctx.browser.exceptions.length > 0) return FAIL(`runtime exceptions: ${ctx.browser.exceptions[0].description || ctx.browser.exceptions[0].text}`);
      return PASS(`playfield ${Math.round(playfield.width)}x${Math.round(playfield.height)} hash=${hash}, webgl=${rendererEvidence.webglContextCount}, renderer=${rendererEvidence.rendererType || 'runtime'}`);
    }
  },
  {
    id: 'p0-snapshot-schema',
    level: 'P0',
    name: 'Public snapshot schema exposes core city action state',
    timeoutMs: 12000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      const snapshot = await game.snapshot();
      if (!snapshot || snapshot.missingContract) return FAIL('missing window.__gameTest.getSnapshot contract');
      const shapeError = assertSnapshotShape(snapshot);
      if (shapeError) return FAIL(shapeError);
      if (snapshot.playfield && snapshot.playfield.nonBlank === false) return FAIL('snapshot reports blank playfield');
      return PASS(`phase=${snapshot.phase}, mode=${snapshot.mode}, cash=${snapshot.player.cash}`);
    }
  },
  {
    id: 'p1-ui-overlay-unblocks-playfield',
    level: 'P1',
    name: 'UI flow unblocks the playfield after start or intro',
    timeoutMs: 15000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await game.reset();
      let before = await game.snapshot();
      const semanticInput = async type => {
        const typed = await game.contractInput({ type });
        const typedSnapshot = typed?.snapshot;
        const stillBlocked = !typedSnapshot || typedSnapshot.phase !== 'playing' || typedSnapshot.ui?.overlayBlocking;
        const schemaRejection = typed?.ok === false && /unknown|invalid|missing|unsupported|unrecognized/i.test(String(typed?.reason || ''));
        if (schemaRejection && stillBlocked) return await game.contractInput({ action: type });
        return typed;
      };
      await semanticInput('start');
      for (let i = 0; i < 4; i++) {
        await semanticInput('advanceDialog');
      }
      await ctx.browser.sleep(300);
      const after = await game.snapshot();
      const playfield = await game.getPlayfield();
      if (!after || after.missingContract) return FAIL('missing snapshot after start');
      if (after.phase !== 'playing') return FAIL(`expected playing phase after start, got ${after.phase}`);
      if (after.ui?.overlayBlocking) return FAIL('overlayBlocking remained true in playing phase');
      if (after.ui?.canInteractWithPlayfield === false) return FAIL('playfield not interactable after start');
      if (!playfield || playfield.width < 100 || playfield.height < 100) return FAIL('playfield geometry missing after start');
      return PASS(`screen ${before?.screen || 'unknown'} -> ${after.screen}, playfield unblocked`);
    }
  },
  {
    id: 'p1-real-keyboard-walking-direction',
    level: 'P1',
    name: 'Real keyboard walking direction has opposite screen movement',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'streetFreeRoam');
      await ctx.browser.sleep(300);
      const before = await game.snapshot();
      const hashBefore = await ctx.browser.canvasPixelHash();
      if (before.mode !== 'walking') return FAIL(`expected walking mode, got ${before.mode}`);
      await ctx.browser.holdKey('ArrowRight', 650);
      await ctx.browser.sleep(150);
      const afterRight = await game.snapshot();
      await ctx.browser.holdKey('ArrowLeft', 650);
      await ctx.browser.sleep(150);
      const afterLeft = await game.snapshot();
      const hashAfter = await ctx.browser.canvasPixelHash();
      const right = axisDelta(before, afterRight, 'x');
      const left = axisDelta(afterRight, afterLeft, 'x');
      const screenReliable = Math.abs(right.screen) >= 1 && Math.abs(left.screen) >= 1;
      const worldReliable = Math.abs(right.world) >= 0.05 && Math.abs(left.world) >= 0.05;
      const observedSource = screenReliable ? 'screenX' : worldReliable ? 'worldX' : null;
      const movementThreshold = observedSource === 'screenX' ? 1 : 0.05;
      const rightObserved = observedSource === 'screenX' ? right.screen : observedSource === 'worldX' ? right.world : 0;
      const leftObserved = observedSource === 'screenX' ? left.screen : observedSource === 'worldX' ? left.world : 0;
      if (!observedSource || Math.abs(rightObserved) < movementThreshold) {
        return FAIL(`ArrowRight did not move player enough: screenDelta=${right.screen}, worldDelta=${right.world}`);
      }
      if (Math.abs(leftObserved) < movementThreshold) {
        return FAIL(`ArrowLeft did not move player enough: screenDelta=${left.screen}, worldDelta=${left.world}`);
      }
      if (sameSign(rightObserved, leftObserved)) {
        return FAIL(`left/right deltas are not opposite: ${observedSource}=${rightObserved}, ${observedSource}=${leftObserved}`);
      }
      if (hashBefore === hashAfter && num(afterLeft.playfield?.renderRevision) === num(before.playfield?.renderRevision)) {
        return FAIL('keyboard movement did not produce renderRevision or canvas evidence');
      }
      return PASS(`right ${observedSource}=${rightObserved.toFixed(1)}, left ${observedSource}=${leftObserved.toFixed(1)}`);
    }
  },
  {
    id: 'p1-real-aim-threat-direction',
    level: 'P1',
    name: 'Real aim or threat drag changes facing and causes non-shooting threat feedback',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'aimThreatNPC');
      await ctx.browser.sleep(300);
      const before = await game.snapshot();
      const ammoBefore = num(before.weapon?.ammo);
      const facingBefore = num(before.player?.facing);
      const threatBefore = num(before.feedback?.threatReactionCount);
      const pickupsBefore = num(before.entityCounts?.cashPickups) + num(before.entityCounts?.healthPickups);
      let dragged = await game.realDragControl('threat', 120, 0) || await game.realDragControl('fire', 120, 0);
      if (!dragged) {
        // The TDD explicitly allows the public player-level aim/threat action
        // when the implementation has no separate desktop drag affordance.
        const sendSemanticAction = async (name, fields = {}) => {
          const typed = await game.contractInput({ type: name, ...fields });
          const reason = String(typed?.reason || '').toLowerCase();
          const envelopeRejection = typed?.ok === false && (
            /(?:unknown|missing|invalid|unsupported|unrecognized).*\b(?:action|input|command|type)\b/.test(reason)
            || /\b(?:action|input|command|type)\b.*(?:unknown|missing|invalid|unsupported|unrecognized)/.test(reason)
          );
          if (!envelopeRejection) return typed;
          return await game.contractInput({ action: name, ...fields });
        };
        await sendSemanticAction('aim', { direction: 'right' });
        await sendSemanticAction('threat', { active: true, holdMs: 400 });
        dragged = true;
      }
      await ctx.browser.sleep(500);
      const during = await game.snapshot();
      const facingDelta = Math.abs(num(during.player?.facing) - facingBefore);
      const threatDelta = num(during.feedback?.threatReactionCount) - threatBefore;
      const pickupDelta = (num(during.entityCounts?.cashPickups) + num(during.entityCounts?.healthPickups)) - pickupsBefore;
      if (facingDelta < 0.01 && during.player?.threatActive !== true && threatDelta <= 0 && pickupDelta <= 0) {
        return FAIL('real aim/threat drag produced no facing, threat, NPC, or pickup feedback');
      }
      if (num(during.weapon?.ammo) < ammoBefore && during.player?.threatActive === true) {
        return FAIL('threat path consumed ammo while marked as threat');
      }
      await ctx.browser.sleep(350);
      const after = await game.snapshot();
      if (after.player?.threatActive === true && num(after.weapon?.ammo) < ammoBefore) return FAIL('threat remained active after release and consumed ammo');
      return PASS(`facingDelta=${facingDelta.toFixed(3)}, threatDelta=${threatDelta}, pickupDelta=${pickupDelta}`);
    }
  },
  {
    id: 'p1-real-fire-combat-loop',
    level: 'P1',
    name: 'Real key fire changes ammo and combat feedback',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'combatTarget');
      await ctx.browser.sleep(300);
      const before = await game.snapshot();
      if (before.mode !== 'walking') return FAIL(`combat scenario must start walking, got ${before.mode}`);
      if (num(before.weapon?.ammo) <= 0) return FAIL('combat scenario must start with ammo');
      await ctx.browser.keyDown('Space');
      await ctx.browser.sleep(220);
      await ctx.browser.keyUp('Space');
      await ctx.browser.sleep(600);
      const after = await game.snapshot();
      const ammoDelta = num(before.weapon?.ammo) - num(after.weapon?.ammo);
      const projectileDelta = num(after.entityCounts?.projectiles) - num(before.entityCounts?.projectiles);
      const hitDelta = num(after.feedback?.hitCount) - num(before.feedback?.hitCount);
      const wantedDelta = num(after.wanted?.level) - num(before.wanted?.level);
      if (ammoDelta <= 0) return FAIL(`real Space fire did not consume ammo: before=${before.weapon?.ammo}, after=${after.weapon?.ammo}`);
      if (projectileDelta <= 0 && hitDelta <= 0 && wantedDelta < 0) return FAIL('fire produced no projectile, hit, or valid wanted feedback');
      if (num(after.weapon?.ammo) < 0) return FAIL('ammo became negative after firing');
      return PASS(`ammoDelta=${ammoDelta}, projectileDelta=${projectileDelta}, hitDelta=${hitDelta}, wantedDelta=${wantedDelta}`);
    }
  },
  {
    id: 'p1-real-weapon-switch',
    level: 'P1',
    name: 'Real weapon switch updates current weapon and locked weapon is rejected',
    timeoutMs: 18000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'weaponSwitching');
      await ctx.browser.sleep(300);
      const before = await game.snapshot();
      if (!Array.isArray(before.weapon?.owned) || before.weapon.owned.length < 2 ||
          !Array.isArray(before.weapon?.switchable) || before.weapon.switchable.length < 1) {
        return FAIL('weaponSwitching scenario must expose at least two owned weapons and one switchable alternative');
      }
      const cashBefore = num(before.player?.cash);
      const ammoBefore = num(before.weapon?.ammo);
      const switchCountBefore = num(before.feedback?.weaponSwitchCount);
      await ctx.browser.holdKey('KeyQ', 120);
      await ctx.browser.sleep(450);
      let after = await game.snapshot();
      if (after.weapon?.current === before.weapon?.current) {
        const targetWeapon = before.weapon.switchable.find(w => w !== before.weapon.current) || null;
        const clicked = await game.realClickWeapon(targetWeapon);
        if (!clicked) return FAIL('real KeyQ did not switch and no visible weapon switch control was available');
        await ctx.browser.sleep(450);
        after = await game.snapshot();
      }
      if (after.weapon?.current === before.weapon?.current) return FAIL(`weapon did not change from ${before.weapon?.current}`);
      if (num(after.feedback?.weaponSwitchCount) <= switchCountBefore && after.weapon?.current === before.weapon?.current) return FAIL('weapon switch feedback did not update');
      const locked = Array.isArray(after.weapon?.locked) && after.weapon.locked.length ? after.weapon.locked[0] : (before.weapon.locked || [])[0];
      if (locked) {
        const lockedCurrentBefore = after.weapon?.current;
        const lockedAmmoBefore = num(after.weapon?.ammo);
        const lockedSwitchCountBefore = num(after.feedback?.weaponSwitchCount);
        const rejected = await game.contractInput({ type: 'switchWeapon', action: 'switchWeapon', weaponId: locked });
        await ctx.browser.sleep(250);
        const lockedAfter = rejected.snapshot || await game.snapshot();
        if (rejected.ok === true) return FAIL(`locked weapon ${locked} was accepted`);
        if (ownedList(lockedAfter).includes(locked)) return FAIL(`locked weapon ${locked} was granted by rejected switch`);
        if (lockedAfter.weapon?.current !== lockedCurrentBefore) return FAIL('locked weapon switch changed current weapon');
        if (num(lockedAfter.weapon?.ammo) !== lockedAmmoBefore) return FAIL('locked weapon switch changed ammo');
        if (num(lockedAfter.feedback?.weaponSwitchCount) !== lockedSwitchCountBefore) return FAIL('locked weapon switch changed switch feedback');
        if (num(lockedAfter.player?.cash) !== cashBefore) return FAIL('locked weapon switch changed cash');
      }
      if (num(after.weapon?.ammo) < 0 || ammoBefore < 0) return FAIL('ammo must stay non-negative during weapon switch');
      return PASS(`weapon ${before.weapon.current}->${after.weapon.current}, locked=${locked || 'none'}`);
    }
  },
  {
    id: 'p1-real-vehicle-driving-direction',
    level: 'P1',
    name: 'Real vehicle controls enter, drive, turn oppositely, and exit',
    timeoutMs: 25000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      const clickVehicleControl = async control => {
        const labels = {
          enterVehicle: '\\b(enter|drive|vehicle|car)\\b',
          exitVehicle: '\\b(exit|leave|get out)\\b'
        };
        const source = labels[control] || control;
        const target = await ctx.browser.eval(`
          (function() {
            const re = new RegExp(${JSON.stringify(source)}, 'i');
            const candidates = Array.from(document.querySelectorAll(
              'button, [role="button"], a, [aria-label], [title], [data-game-control], [tabindex], [onclick], [id], [class]'
            ));
            const matches = [];
            for (const el of candidates) {
              const r = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              if (r.width <= 0 || r.height <= 0 || style.visibility === 'hidden' ||
                  style.display === 'none' || style.pointerEvents === 'none') continue;
              const label = [
                el.getAttribute('data-game-control'),
                el.getAttribute('aria-label'),
                el.getAttribute('title'),
                el.textContent
              ].filter(Boolean).join(' ');
              const className = typeof el.className === 'string' ? el.className : '';
              const explicit = el.tagName === 'BUTTON' || el.tagName === 'A' ||
                el.getAttribute('role') === 'button' || el.hasAttribute('aria-label') ||
                el.hasAttribute('title') || el.hasAttribute('data-game-control') ||
                el.hasAttribute('tabindex') || el.hasAttribute('onclick');
              const affordance = explicit || /(?:btn|button|control|action)/i.test(el.id + ' ' + className);
              if (!affordance) continue;
              if (label === ${JSON.stringify(control)} || re.test(label)) {
                matches.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, area: r.width * r.height });
              }
            }
            return matches.sort((a, b) => a.area - b.area)[0] || null;
          })()
        `);
        if (!target) return false;
        await ctx.browser.mouseClick(target.x, target.y);
        return true;
      };
      const visibleVehicleKey = async () => await ctx.browser.eval(`
        (function() {
          const lines = String(document.body && document.body.innerText || '')
            .split(/\\n+/).map(line => line.trim()).filter(Boolean);
          const hasBinding = key => lines.some(line => {
            const words = line.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\\s+/);
            const hasKey = words.includes(key) || words.includes('key' + key);
            const hasVehicleAction = ['enter', 'exit', 'vehicle', 'car', 'drive'].some(word => words.includes(word));
            return hasKey && hasVehicleAction;
          });
          if (hasBinding('e')) return 'KeyE';
          if (hasBinding('f')) return 'KeyF';
          return null;
        })()
      `);
      await game.waitForReady();
      await requireScenario(game, 'nearVehicle');
      await ctx.browser.sleep(300);
      const preEnter = await game.snapshot();
      let clicked = await clickVehicleControl('enterVehicle');
      if (!clicked) {
        const key = await visibleVehicleKey();
        if (key) {
          await ctx.browser.holdKey(key, 200);
          clicked = true;
        }
      }
      if (!clicked) return FAIL('no visible enterVehicle control for real click');
      await ctx.browser.sleep(800);
      const entered = await game.snapshot();
      if (entered.mode !== 'driving' || !entered.vehicle?.inVehicle) return FAIL(`enterVehicle did not switch to driving, mode=${entered.mode}`);
      await ctx.browser.holdKey('ArrowUp', 800);
      await ctx.browser.sleep(150);
      const moved = await game.snapshot();
      const moveDistance = Math.hypot(
        num(moved.vehicle?.screenX) - num(entered.vehicle?.screenX),
        num(moved.vehicle?.screenY) - num(entered.vehicle?.screenY)
      );
      if (moveDistance < 1 && num(moved.vehicle?.speed) <= num(entered.vehicle?.speed)) return FAIL('vehicle did not visibly move or accelerate after ArrowUp');
      await ctx.browser.holdKey('ArrowDown', 1800);
      await ctx.browser.sleep(150);
      const reversed = await game.snapshot();
      const forwardDx = num(moved.vehicle?.screenX) - num(entered.vehicle?.screenX);
      const forwardDy = num(moved.vehicle?.screenY) - num(entered.vehicle?.screenY);
      const measureReverse = snapshot => {
        const reverseDx = num(snapshot.vehicle?.screenX) - num(moved.vehicle?.screenX);
        const reverseDy = num(snapshot.vehicle?.screenY) - num(moved.vehicle?.screenY);
        return {
          distance: Math.hypot(reverseDx, reverseDy),
          dot: forwardDx * reverseDx + forwardDy * reverseDy
        };
      };
      let reverseMeasurement = measureReverse(reversed);
      for (let retry = 0; retry < 4 && moveDistance >= 1 &&
           (reverseMeasurement.distance < 1 || reverseMeasurement.dot > 0); retry += 1) {
        await ctx.browser.holdKey('ArrowDown', 800);
        await ctx.browser.sleep(150);
        reverseMeasurement = measureReverse(await game.snapshot());
      }
      const reverseDistance = reverseMeasurement.distance;
      const reverseDot = reverseMeasurement.dot;
      if (reverseDistance < 1) return FAIL('vehicle did not visibly reverse after a bounded inertia window');
      if (moveDistance >= 1 && reverseDistance >= 1 && reverseDot > 0) {
        return FAIL(`forward/reverse movement was not opposite enough: dot=${reverseDot.toFixed(2)}`);
      }
      const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
      const steerWithForwardMotion = async key => {
        await ctx.browser.keyDown('ArrowUp');
        try {
          await ctx.browser.keyDown(key);
          await ctx.browser.sleep(650);
        } finally {
          await ctx.browser.keyUp(key);
          await ctx.browser.keyUp('ArrowUp');
        }
        await ctx.browser.sleep(150);
        return await game.snapshot();
      };
      await ctx.browser.holdKey('ArrowUp', 500);
      const turnStartLeft = await game.snapshot();
      const afterLeft = await steerWithForwardMotion('ArrowLeft');
      await ctx.browser.holdKey('ArrowUp', 500);
      const turnStartRight = await game.snapshot();
      const afterRight = await steerWithForwardMotion('ArrowRight');
      const leftTurn = angleDelta(
        num(turnStartLeft.vehicle?.heading),
        num(afterLeft.vehicle?.heading)
      );
      const rightTurn = angleDelta(
        num(turnStartRight.vehicle?.heading),
        num(afterRight.vehicle?.heading)
      );
      if (Math.abs(leftTurn) < 0.001 || Math.abs(rightTurn) < 0.001) return FAIL(`vehicle heading did not respond to turns: ${leftTurn}, ${rightTurn}`);
      if (sameSign(leftTurn, rightTurn)) return FAIL(`left/right vehicle turns are not opposite: ${leftTurn}, ${rightTurn}`);
      let exitClicked = await clickVehicleControl('exitVehicle');
      if (!exitClicked) exitClicked = await clickVehicleControl('enterVehicle');
      if (!exitClicked) {
        const key = await visibleVehicleKey();
        if (key) {
          await ctx.browser.holdKey(key, 200);
          exitClicked = true;
        }
      }
      if (!exitClicked) return FAIL('no visible exitVehicle control or keyboard binding');
      await ctx.browser.sleep(600);
      const exited = await game.snapshot();
      if (exited.mode !== 'walking' || exited.vehicle?.inVehicle) return FAIL('exit vehicle did not return to walking mode');
      if (!Number.isFinite(Number(exited.player?.screenX)) || !Number.isFinite(Number(exited.player?.screenY))) return FAIL('player exit position is not observable');
      return PASS(`entered from ${preEnter.mode}, moveDistance=${moveDistance.toFixed(1)}, reverseDot=${reverseDot.toFixed(2)}, turns=${leftTurn.toFixed(3)}/${rightTurn.toFixed(3)}`);
    }
  },
  {
    id: 'p1-real-cash-pickup-loop',
    level: 'P1',
    name: 'Real movement into cash pickup increases cash and removes the pickup',
    timeoutMs: 22000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'cashPickup');
      await ctx.browser.sleep(300);
      const before = await game.snapshot();
      const pickup = before.pickups?.nearestCash;
      if (!pickup || !Number.isFinite(Number(pickup.screenX)) || !Number.isFinite(Number(pickup.screenY))) {
        return FAIL('cashPickup scenario did not expose nearestCash screen position');
      }
      const beforeCollections = num(before.feedback?.collectionCount);
      const hashBefore = await ctx.browser.canvasPixelHash();
      let after = before;
      for (let i = 0; i < 12; i++) {
        await game.moveTowardScreenPoint(pickup, 1);
        await ctx.browser.sleep(120);
        after = await game.snapshot();
        if (num(after.player?.cash) > num(before.player?.cash) && num(after.entityCounts?.cashPickups) < num(before.entityCounts?.cashPickups)) break;
      }
      const hashAfter = await ctx.browser.canvasPixelHash();
      if (num(after.player?.cash) <= num(before.player?.cash)) return FAIL('cash did not increase after pickup');
      if (num(after.entityCounts?.cashPickups) >= num(before.entityCounts?.cashPickups)) return FAIL('cash pickup count did not decrease');
      if (num(after.feedback?.collectionCount) <= beforeCollections) return FAIL('collection feedback did not increment');
      if (hashBefore === hashAfter && num(after.playfield?.renderRevision) === num(before.playfield?.renderRevision)) return FAIL('cash pickup path had no render or canvas evidence');
      if (num(after.weapon?.ammo) !== num(before.weapon?.ammo) && num(after.player?.health) !== num(before.player?.health)) {
        return FAIL('unrelated ammo and health both changed during cash pickup');
      }
      return PASS(`cash ${before.player.cash}->${after.player.cash}, pickups ${before.entityCounts.cashPickups}->${after.entityCounts.cashPickups}`);
    }
  },
  {
    id: 'p1-death-respawn-state-contract',
    level: 'P1',
    name: 'Death locks action and respawn restores playable state',
    timeoutMs: 18000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'deathState');
      await ctx.browser.sleep(300);
      const dead = await game.snapshot();
      if (dead.phase !== 'dead' && dead.result !== 'dead') return FAIL(`deathState did not produce dead phase/result: ${dead.phase}/${dead.result}`);
      if (!dead.ui?.overlayBlocking) return FAIL('dead state should show blocking death overlay');
      const unchangedBefore = JSON.stringify({ health: dead.player?.health, cash: dead.player?.cash, ammo: dead.weapon?.ammo });
      const moveResult = await game.contractInput({ type: 'move', direction: 'right', durationMs: 300 });
      const fireResult = await game.contractInput({ type: 'fire' });
      const stillDead = await game.snapshot();
      const unchangedAfter = JSON.stringify({ health: stillDead.player?.health, cash: stillDead.player?.cash, ammo: stillDead.weapon?.ammo });
      if (moveResult.ok === true || fireResult.ok === true) return FAIL('dead state accepted movement or fire');
      if (unchangedBefore !== unchangedAfter) return FAIL('dead rejected actions changed protected resources');
      const respawnClicked = await game.realClickControl('respawn');
      if (!respawnClicked) await game.contractInput({ type: 'respawn' });
      await ctx.browser.sleep(600);
      const after = await game.snapshot();
      if (after.phase !== 'playing') return FAIL(`respawn did not restore playing phase: ${after.phase}`);
      if (num(after.player?.health) <= 0) return FAIL('respawn did not restore positive health');
      if (num(after.wanted?.level) !== 0) return FAIL('respawn did not clear wanted level');
      if (after.ui?.overlayBlocking) return FAIL('death overlay still blocking after respawn');
      return PASS(`dead actions rejected; health=${after.player.health}, wanted=${after.wanted.level}`);
    }
  },
  {
    id: 'p2-real-shop-purchase',
    level: 'P2',
    name: 'Real visible shop purchase spends cash and applies item effect',
    timeoutMs: 18000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'shopWithCash');
      const opened = await game.realOpenShop();
      if (!opened) return FAIL('no visible openShop control or documented keyboard binding for real input');
      await ctx.browser.sleep(250);
      const before = await game.snapshot();
      if (!before.shop?.open) return FAIL('shopWithCash scenario did not open shop after action');
      if (!Array.isArray(before.shop.visibleItems) || !before.shop.visibleItems.some(item => item.affordable)) {
        return FAIL('shopWithCash did not expose an affordable visible item');
      }
      const clickedItem = await game.realClickShopItem(true, before);
      if (!clickedItem) return FAIL('no visible shop item or buy control for real click');
      await ctx.browser.sleep(350);
      const after = await game.snapshot();
      const cashDelta = num(before.player?.cash) - num(after.player?.cash);
      const ownedChanged = ownedList(before).join(',') !== ownedList(after).join(',');
      const ammoChanged = num(after.weapon?.ammo) !== num(before.weapon?.ammo);
      const healthChanged = num(after.player?.health) !== num(before.player?.health);
      if (cashDelta <= 0) return FAIL('purchase did not spend cash');
      if (!ownedChanged && !ammoChanged && !healthChanged) return FAIL('purchase spent cash but applied no item effect');
      if (num(after.player?.cash) < 0) return FAIL('purchase made cash negative');
      const closeClicked = await game.realClickControl('closeShop');
      if (closeClicked) {
        await ctx.browser.sleep(250);
        const closed = await game.snapshot();
        if (closed.shop?.open && closed.ui?.overlayBlocking) return FAIL('shop close control did not restore playfield');
      }
      return PASS(`item=${clickedItem.itemId || 'visible'}, cashDelta=${cashDelta}, ownedChanged=${ownedChanged}, ammoChanged=${ammoChanged}, healthChanged=${healthChanged}`);
    }
  },
  {
    id: 'p2-shop-insufficient-funds-invariant-contract',
    level: 'P2',
    name: 'Insufficient funds rejection preserves economy invariants',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'shopInsufficientCash');
      await game.contractInput({ type: 'openShop' });
      await ctx.browser.sleep(250);
      const before = await game.snapshot();
      const totalBefore = num(before.player?.cash) + num(before.weapon?.ammo) + ownedList(before).length + num(before.player?.health);
      const rejected = await game.contractInput({ type: 'buy', itemId: 'expensive_weapon' });
      await ctx.browser.sleep(300);
      const after = rejected.snapshot || await game.snapshot();
      const totalAfter = num(after.player?.cash) + num(after.weapon?.ammo) + ownedList(after).length + num(after.player?.health);
      const unchanged = num(after.player?.cash) === num(before.player?.cash)
        && num(after.weapon?.ammo) === num(before.weapon?.ammo)
        && num(after.player?.health) === num(before.player?.health)
        && ownedList(after).join(',') === ownedList(before).join(',');
      if (rejected.ok === true) return FAIL('insufficient funds purchase was accepted');
      if (!unchanged) return FAIL(`insufficient funds mutated protected fields: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      if (totalBefore !== totalAfter) return FAIL(`economy invariant changed on rejected purchase: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      return PASS(`rejected with unchanged resources, totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
    }
  },
  {
    id: 'p2-health-ammo-pickup-contract',
    level: 'P2',
    name: 'Health or ammo pickup changes the right resource and removes pickup',
    timeoutMs: 16000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'healthOrAmmoPickup');
      await ctx.browser.sleep(300);
      let before = await game.snapshot();
      const hasHealth = !!before.pickups?.nearestHealth;
      const hasAmmo = !!before.pickups?.nearestAmmo;
      if (!hasHealth && !hasAmmo) return FAIL('healthOrAmmoPickup did not expose a health or ammo pickup');
      const kind = hasHealth ? 'health' : 'ammo';
      const pickupWeapon = kind === 'ammo' ? before.pickups?.nearestAmmo?.weapon : null;
      if (kind === 'ammo' && pickupWeapon && pickupWeapon !== before.weapon?.current &&
          Array.isArray(before.weapon?.owned) && before.weapon.owned.includes(pickupWeapon)) {
        const switched = await semanticContractInput(game, 'switchWeapon', { weaponId: pickupWeapon });
        if (switched?.ok === false) return FAIL(`could not select ammo pickup weapon ${pickupWeapon}: ${switched.reason || 'rejected'}`);
        before = switched.snapshot || await game.snapshot();
      }
      const beforeCollections = num(before.feedback?.collectionCount);
      const result = await semanticContractInput(game, 'collect', { kind });
      await ctx.browser.sleep(400);
      const after = result.snapshot || await game.snapshot();
      if (result.ok === false) return FAIL(`collect ${kind} was rejected: ${result.reason || 'no reason'}`);
      const healthDelta = num(after.player?.health) - num(before.player?.health);
      const ammoDelta = num(after.weapon?.ammo) - num(before.weapon?.ammo);
      if (kind === 'health' && healthDelta <= 0) return FAIL('health pickup did not increase health');
      if (kind === 'ammo' && ammoDelta <= 0) return FAIL('ammo pickup did not increase ammo');
      if (kind === 'health' && ammoDelta !== 0) return FAIL('health pickup changed ammo');
      if (kind === 'ammo' && healthDelta !== 0) return FAIL('ammo pickup changed health');
      if (!pickupWasRemoved(before, after, kind)) return FAIL(`${kind} pickup was not removed`);
      if (num(after.feedback?.collectionCount) <= beforeCollections) return FAIL('pickup collection feedback did not increment');
      if (num(after.player?.health) < 0 || num(after.weapon?.ammo) < 0) return FAIL('pickup made resources negative');
      return PASS(`${kind} pickup healthDelta=${healthDelta}, ammoDelta=${ammoDelta}`);
    }
  },
  {
    id: 'p2-real-touch-movement',
    level: 'P2',
    name: 'Real touch movement drag changes visible player position',
    timeoutMs: 18000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await ctx.browser.cdp.send('Emulation.setTouchEmulationEnabled', {
        enabled: true,
        maxTouchPoints: 1
      });
      await ctx.browser.cdp.send('Page.reload');
      await ctx.browser.sleep(500);
      await game.waitForReady();
      const runtimeDeadline = Date.now() + 10000;
      let runtimeSnapshot = await game.snapshot();
      while (runtimeSnapshot?.missingContract && Date.now() < runtimeDeadline) {
        await ctx.browser.sleep(250);
        runtimeSnapshot = await game.snapshot();
      }
      if (!runtimeSnapshot || runtimeSnapshot.missingContract) return FAIL('game test contract did not become ready after touch emulation reload');
      await requireScenario(game, 'streetFreeRoam');
      await ctx.browser.sleep(300);
      const playfield = await game.getPlayfield();
      if (!playfield) return FAIL('no playfield for touch drag');
      const before = await game.snapshot();
      const touchTarget = await findTouchMovementTarget(ctx.browser);
      const from = touchTarget
        ? { x: touchTarget.left + touchTarget.width / 2, y: touchTarget.top + touchTarget.height / 2 }
        : { x: playfield.left + playfield.width * 0.22, y: playfield.top + playfield.height * 0.75 };
      const dragDistance = touchTarget
        ? Math.max(32, Math.min(100, touchTarget.width * 0.65))
        : Math.min(120, playfield.width * 0.18);
      const to = {
        x: Math.min(playfield.left + playfield.width - 1, from.x + dragDistance),
        y: from.y
      };
      await ctx.browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: from.x, y: from.y, radiusX: 4, radiusY: 4, id: 1 }]
      });
      await ctx.browser.sleep(80);
      await ctx.browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: to.x, y: to.y, radiusX: 4, radiusY: 4, id: 1 }]
      });
      await ctx.browser.sleep(450);
      await ctx.browser.cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: []
      });
      await ctx.browser.sleep(300);
      const after = await game.snapshot();
      const x = axisDelta(before, after, 'x');
      const y = axisDelta(before, after, 'y');
      const revisionDelta = num(after.playfield?.renderRevision) - num(before.playfield?.renderRevision);
      const worldDistance = Math.hypot(x.world, y.world);
      if (worldDistance < 1) {
        return FAIL(`touch drag did not move player world position: screenDelta=(${x.screen}, ${y.screen}), worldDelta=(${x.world}, ${y.world})`);
      }
      if (revisionDelta <= 0) {
        return FAIL(`touch drag changed player position but not render revision: revisionDelta=${revisionDelta}`);
      }
      return PASS(`touch ${touchTarget?.source || 'dynamic-left-playfield'} ${x.source}/${y.source}=(${x.observed.toFixed(1)}, ${y.observed.toFixed(1)}), revisionDelta=${revisionDelta}`);
    }
  },
  {
    id: 'p2-minimap-toggle-real-click',
    level: 'P2',
    name: 'Real click toggles minimap or navigation observability',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'streetFreeRoam');
      const before = await game.snapshot();
      const clicked = await game.clickMinimap();
      if (!clicked) await game.contractInput({ type: 'toggleMinimap' });
      await ctx.browser.sleep(350);
      const after = await game.snapshot();
      const stateChanged = before.ui?.activePanel !== after.ui?.activePanel
        || before.minimap?.expanded !== after.minimap?.expanded
        || num(after.feedback?.worldMotionRevision) !== num(before.feedback?.worldMotionRevision)
        || JSON.stringify(before.minimap || {}) !== JSON.stringify(after.minimap || {});
      if (!stateChanged) return FAIL('minimap click produced no observable minimap/navigation change');
      if (after.ui?.overlayBlocking && after.phase === 'playing') return FAIL('minimap remained blocking in playing phase');
      return PASS('minimap real click produced observable state change');
    }
  },
  {
    id: 'p2-quest-navigation-progression-contract',
    level: 'P2',
    name: 'Quest navigation contract requires player-triggered progress',
    timeoutMs: 20000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'activeReachQuest');
      await ctx.browser.sleep(300);
      const before = await game.snapshot();
      if (!before.quest?.active) return FAIL('activeReachQuest did not expose active quest');
      const completedBefore = num(before.quest?.completedCount);
      const cashBefore = num(before.player?.cash);
      if (completedBefore > 0 && before.quest?.distanceToTarget === 0) return FAIL('scenario appears pre-completed before player action');
      const distanceBefore = Number(before.quest?.distanceToTarget);
      const input = action => game.contractInput({
        ...action,
        type: action.type || action.action,
        action: action.action || action.type
      });
      const coordinate = value => value === null || value === undefined ? NaN : num(value, NaN);
      const playerScreenX = coordinate(before.player?.screenX);
      const playerScreenY = coordinate(before.player?.screenY);
      const targetScreenX = coordinate(before.quest?.targetScreenX);
      const targetScreenY = coordinate(before.quest?.targetScreenY);
      const deltaX = targetScreenX - playerScreenX;
      const deltaY = targetScreenY - playerScreenY;
      const targetDirection = Number.isFinite(deltaX) && Number.isFinite(deltaY)
        ? (Math.abs(deltaX) >= Math.abs(deltaY) ? (deltaX >= 0 ? 'right' : 'left') : (deltaY >= 0 ? 'down' : 'up'))
        : null;
      const directions = targetDirection ? [targetDirection] : ['up', 'right', 'down', 'left'];
      let after = before;
      for (const direction of directions) {
        await input({ type: 'move', direction, durationMs: 180 });
        await input({ type: 'advanceDialog' });
        await ctx.browser.sleep(600);
        after = await game.snapshot();
        const distanceAfterCandidate = Number(after.quest?.distanceToTarget);
        const completedDeltaCandidate = num(after.quest?.completedCount) - completedBefore;
        if ((Number.isFinite(distanceBefore) && Number.isFinite(distanceAfterCandidate) && distanceAfterCandidate < distanceBefore)
          || completedDeltaCandidate > 0) break;
      }
      const distanceAfter = Number(after.quest?.distanceToTarget);
      const distanceImproved = Number.isFinite(distanceBefore) && Number.isFinite(distanceAfter) && distanceAfter < distanceBefore;
      const completedDelta = num(after.quest?.completedCount) - completedBefore;
      const rewardDelta = num(after.player?.cash) - cashBefore;
      if (!distanceImproved && completedDelta <= 0) return FAIL('quest action did not reduce distance or complete objective');
      if (completedDelta > 0 && rewardDelta < 0) return FAIL('quest completed but cash reward regressed');
      return PASS(`distanceImproved=${distanceImproved}, completedDelta=${completedDelta}, rewardDelta=${rewardDelta}`);
    }
  },
  {
    id: 'p2-action-quest-progression-contract',
    level: 'P2',
    name: 'Action quest progresses from its matching player-level action',
    timeoutMs: 22000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'activeActionQuest');
      await ctx.browser.sleep(300);
      const before = await game.snapshot();
      if (!before.quest?.active) return FAIL('activeActionQuest did not expose active quest');
      if (['none', 'talk', 'reach'].includes(before.quest?.type)) return FAIL(`activeActionQuest exposed non-action type ${before.quest?.type}`);
      const completedBefore = num(before.quest?.completedCount);
      const cashBefore = num(before.player?.cash);
      let actionResult = null;
      let actionProgressed = false;
      let observedAfter = null;
      const perform = async (action, observer = actionEffectObserved) => {
        const actionBefore = await game.snapshot();
        const result = await playerAction(game, action);
        const actionAfter = result?.snapshot || await game.snapshot();
        if (observer(actionBefore, actionAfter, action.type)) {
          actionProgressed = true;
          observedAfter = actionAfter;
        }
        return { result, snapshot: actionAfter };
      };

      if (before.quest.type === 'buy') {
        let openResult = await playerAction(game, { type: 'openShop' });
        let openSnapshot = openResult?.snapshot || await game.snapshot();
        if (openResult?.ok === false) {
          openSnapshot = await moveTowardTarget(game, openSnapshot);
          openResult = await playerAction(game, { type: 'openShop' });
          openSnapshot = openResult?.snapshot || await game.snapshot();
        }
        const visibleItems = Array.isArray(openSnapshot?.shop?.visibleItems)
          ? openSnapshot.shop.visibleItems
          : [];
        const item = visibleItems.find(x => x.kind === 'quest' && x.affordable !== false)
          || visibleItems.find(x => x.affordable === true);
        if (!item) {
          actionResult = { ok: false, reason: 'active buy quest exposed no purchasable visible item', snapshot: openSnapshot };
        } else {
          actionResult = (await perform({ type: 'buy', itemId: item.itemId })).result;
        }
      } else if (before.quest.type === 'stealVehicle') {
        let entry = await perform({ type: 'enterVehicle' });
        if (entry.result?.ok === false) {
          await moveTowardTarget(game, entry.snapshot || before);
          entry = await perform({ type: 'enterVehicle' });
        }
        actionResult = entry.result;
        if (!actionProgressed) {
          actionResult = (await perform({ type: 'drive', direction: 'forward', durationMs: 700 })).result;
        }
      } else if (before.quest.type === 'deliver') {
        let current = await moveTowardTarget(game, before, 24, before.quest);
        let collected = null;
        for (let attempt = 0; attempt < 2 && !collected; attempt += 1) {
          for (const kind of ['cash', 'ammo']) {
            const candidate = await perform(
              { type: 'collect', kind },
              (actionBefore, actionAfter) => questProgressed(actionBefore, actionAfter)
                || distanceImprovedBetween(actionBefore, actionAfter)
            );
            current = candidate.snapshot;
            if (actionProgressed) {
              collected = candidate;
              break;
            }
          }
          if (!collected && attempt === 0) {
            current = await moveTowardTarget(game, current, 24, before.quest);
          }
        }
        if (collected) {
          actionResult = collected.result;
        } else {
          actionResult = { ok: false, reason: 'active deliver quest did not progress from exposed target pickup', snapshot: current };
        }
      } else if (before.quest.type === 'kill') {
        let current = await moveTowardTarget(game, before, 24);
        for (let i = 0; i < 6 && !actionProgressed; i += 1) {
          const aimDirection = screenDirection(current);
          if (aimDirection) await playerAction(game, { type: 'aim', direction: aimDirection });
          if (i > 0) await ctx.browser.sleep(450);
          const fired = await perform({ type: 'fire', holdMs: 300 });
          actionResult = fired.result;
          current = fired.snapshot;
        }
      } else {
        actionResult = (await perform({ type: 'move', direction: 'up', durationMs: 700 })).result;
      }
      await ctx.browser.sleep(900);
      const after = observedAfter || actionResult?.snapshot || await game.snapshot();
      const completedDelta = num(after.quest?.completedCount) - completedBefore;
      const distanceBefore = Number(before.quest?.distanceToTarget);
      const distanceAfter = Number(after.quest?.distanceToTarget);
      const distanceImproved = Number.isFinite(distanceBefore) && Number.isFinite(distanceAfter) && distanceAfter < distanceBefore;
      const progressChanged = after.quest?.progress !== before.quest?.progress || after.quest?.type !== before.quest?.type;
      const rewardDelta = num(after.player?.cash) - cashBefore;
      if (actionResult && actionResult.ok === false && !actionProgressed) {
        return FAIL(`action quest rejected matching action: ${actionResult.reason || 'no reason'}`);
      }
      if (!actionProgressed) return FAIL('action quest did not progress or complete after matching player-level action');
      if (completedDelta > 0 && rewardDelta < 0) return FAIL('action quest completed but reward regressed');
      return PASS(`type=${before.quest.type}, completedDelta=${completedDelta}, distanceImproved=${distanceImproved}, progressChanged=${progressChanged}, rewardDelta=${rewardDelta}`);
    }
  },
  {
    id: 'p2-camera-zoom-readability',
    level: 'P2',
    name: 'Real wheel or zoom action changes camera while keeping playfield readable',
    timeoutMs: 14000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'streetFreeRoam');
      await ctx.browser.sleep(300);
      const before = await game.snapshot();
      const playfield = await game.getPlayfield();
      if (!playfield) return FAIL('no playfield for zoom input');
      await ctx.browser.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: playfield.centerX,
        y: playfield.centerY,
        deltaX: 0,
        deltaY: -420
      });
      await ctx.browser.sleep(350);
      let after = await game.snapshot();
      if (num(after.camera?.zoom) === num(before.camera?.zoom)) {
        const zoomDirection = before.camera?.canZoomIn === false ? 'out' : 'in';
        const zoomControl = await ctx.browser.eval(`
          (function() {
            const direction = ${JSON.stringify(zoomDirection)};
            const pattern = direction === 'in'
              ? /zoom.?in|camera.?in|plus|closer|increase/i
              : /zoom.?out|camera.?out|minus|farther|decrease/i;
            const candidates = Array.from(document.querySelectorAll(
              'button, [role="button"], [aria-label], [title], [data-game-control], [id*="zoom" i], [id*="camera" i]'
            ));
            for (const el of candidates) {
              const r = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              if (r.width <= 0 || r.height <= 0 || style.visibility === 'hidden' || style.display === 'none') continue;
              const label = [
                el.id,
                el.getAttribute('data-game-control'),
                el.getAttribute('aria-label'),
                el.getAttribute('title'),
                el.textContent
              ].filter(Boolean).join(' ');
              if (/(^|[-_ ])(?:info|label|display)(?:$|[-_ ])/i.test(label)) continue;
              const symbol = direction === 'in' ? label.includes('+') : label.includes('-') || label.includes('−');
              if (pattern.test(label) || symbol) {
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
              }
            }
            return null;
          })()
        `);
        if (zoomControl) {
          await ctx.browser.mouseClick(zoomControl.x, zoomControl.y);
          await ctx.browser.sleep(250);
          after = await game.snapshot();
        }
      }
      if (num(after.camera?.zoom) === num(before.camera?.zoom)) {
        const zoomed = await playerAction(game, { type: 'zoom', direction: before.camera?.canZoomIn === false ? 'out' : 'in' });
        await ctx.browser.sleep(250);
        after = zoomed.snapshot || await game.snapshot();
      }
      if (num(after.camera?.zoom) === num(before.camera?.zoom)) return FAIL('wheel/zoom action did not change camera zoom');
      if (after.ui?.overlayBlocking && after.phase === 'playing') return FAIL('zoom left a blocking overlay in playing phase');
      if (!Number.isFinite(Number(after.player?.screenX)) || !Number.isFinite(Number(after.player?.screenY))) return FAIL('player not visible/readable after zoom');
      const afterPlayfield = await game.getPlayfield();
      if (!afterPlayfield || afterPlayfield.width < 100 || afterPlayfield.height < 100) return FAIL('playfield unreadable after zoom');
      return PASS(`zoom ${before.camera?.zoom}->${after.camera?.zoom}`);
    }
  },
  {
    id: 'p2-invalid-empty-ammo-rejection-contract',
    level: 'P2',
    name: 'No-ammo fire is rejected without changing combat totals',
    timeoutMs: 30000,
    async run(ctx) {
      const game = createGameDriver(ctx.browser);
      await game.waitForReady();
      await requireScenario(game, 'combatTarget');
      await ctx.browser.sleep(250);
      // Carry both observed discriminator spellings in one player-level
      // request; this still exercises the same public fire action.
      const fireAction = () => game.contractInput({ action: 'fire', type: 'fire' });
      let before = await game.snapshot();
      for (let attempts = 0; attempts < 180 && num(before.weapon?.ammo) > 0; attempts += 1) {
        const ammoBefore = num(before.weapon?.ammo);
        const fired = await fireAction();
        before = fired?.snapshot || await game.snapshot();
        if (num(before.weapon?.ammo) >= ammoBefore && num(before.weapon?.ammo) > 0) {
          await ctx.browser.sleep(400);
        }
      }
      if (num(before.weapon?.ammo) > 0) return FAIL('combatTarget could not reach a legal no-ammo state through fire actions');
      for (let i = 0; i < 12 && num(before.entityCounts?.projectiles) > 0; i += 1) {
        await ctx.browser.sleep(250);
        before = await game.snapshot();
      }
      const totalBefore = num(before.weapon?.ammo) + num(before.entityCounts?.projectiles) + num(before.feedback?.hitCount);
      const rejected = await fireAction();
      const after = rejected?.snapshot || await game.snapshot();
      const totalAfter = num(after.weapon?.ammo) + num(after.entityCounts?.projectiles) + num(after.feedback?.hitCount);
      const unchanged = num(after.weapon?.ammo) === num(before.weapon?.ammo)
        && num(after.entityCounts?.projectiles) === num(before.entityCounts?.projectiles)
        && num(after.feedback?.hitCount) === num(before.feedback?.hitCount);
      if (rejected?.ok !== false) return FAIL('fire with no ammo was not rejected');
      if (!unchanged) return FAIL(`no-ammo rejection changed combat totals: totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
      return PASS(`rejected no-ammo fire with unchanged totals totalBefore=${totalBefore}, totalAfter=${totalAfter}`);
    }
  }
];

module.exports = { sleep, suite };
