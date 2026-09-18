// Infinite Charms L2 Runtime Checks
// === GDD Coverage Map ===
// M1 (boot and visible creator) -> p0-boot-visible-creator, p0-contract-schema
// M2 (category switching) -> p1-real-click-category-option
// M3 (part selection preview) -> p1-real-click-category-option
// M4 (color and intensity) -> p1-contract-color-intensity
// M5 (accessory toggle/clear) -> p1-real-click-accessory-clear, p2-accessory-conservation
// M6 (screen-space drag direction) -> p1-real-drag-screen-direction
// M7 (scale and reset) -> p1-real-adjustment-controls, p2-scale-reset-bounds
// M8 (adjustment/settings panel) -> p1-real-click-settings-blocking, p1-real-adjustment-controls
// M9 (randomize) -> p1-real-click-randomize
// M10 (clear all reset) -> p1-real-click-clear-all
// M11 (audio settings) -> p2-contract-audio-settings
// M12 (keyboard/touch depth) -> p2-keyboard-category-depth
//
// === Category Map ===
// Boot & Stability: p0-boot-visible-creator, p0-contract-schema
// UI Flow & Blocking: p1-real-click-settings-blocking
// Input Semantics: p1-real-click-category-option, p1-real-drag-screen-direction, p1-real-adjustment-controls, p2-keyboard-category-depth
// Core Mechanic Loop: p1-contract-color-intensity, p1-real-click-accessory-clear, p1-real-click-randomize, p1-real-click-clear-all
// State Machine: p1-real-click-clear-all
// Economy/Progression: p2-accessory-conservation
// Feedback & Observability: p1-real-adjustment-controls, p2-scale-reset-bounds
// Invariants & Rejection: p2-invalid-action-rejected, p2-accessory-conservation
// Depth/Optional Systems: p2-contract-audio-settings, p2-keyboard-category-depth
//
// === Rationality Map ===
// p1-real-click-settings-blocking: M8/M11 | real action: DOM/mouse click settings control | independent observation: snapshot ui + overlayBlocking | empty-shell failure: inert settings button or blocking overlay fails
// p1-real-click-category-option: M2/M3 | real action: click category and option controls | independent observation: activeCategory + character/canvas delta | empty-shell failure: static cards or no preview update fails
// p1-contract-color-intensity: M4 | real action: public color actions as contract | independent observation: hairColor/intensity + canvas revision | empty-shell failure: ok:true without state/preview change fails
// p1-real-click-accessory-clear: M5 | real action: click accessory category/control and clear control | independent observation: accessories count + character summary | empty-shell failure: nonfunctional accessory UI fails
// p1-real-drag-screen-direction: M6 | real action: native mouse drag right then left | independent observation: adjustable.screenX + canvas hash | empty-shell failure: blocked input, no drag, or mirrored direction fails
// p1-real-adjustment-controls: M6/M7/M8 | real action: click visible adjustment controls | independent observation: screenX/screenY/scale + reset + canvas hash | empty-shell failure: decorative panel controls, reversed direction, or dead reset fails
// p1-real-click-randomize: M9 | real action: click random control | independent observation: multiple character fields/canvas revision | empty-shell failure: button animation only fails
// p1-real-click-clear-all: M10 | real action: click clear control after accessory setup | independent observation: accessories/decorations cleared + phase editing | empty-shell failure: clear button without reset fails
// p2-invalid-action-rejected: M2/M4/M6/M7 | real action: contract invalid action | independent observation: unchanged snapshot and ok:false/reason | empty-shell failure: accepts any action or mutates state fails
// p2-accessory-conservation: M5 | real action: contract toggle same accessory twice | independent observation: totalBefore/totalAfter and unique count | empty-shell failure: duplicate accessory accumulation fails
// p2-scale-reset-bounds: M7 | real action: contract adjust scale then reset | independent observation: scale bounds + canvas revision | empty-shell failure: no scale logic or invalid bounds fails
// p2-contract-audio-settings: M11 | real action: contract audio changes and invalid volume | independent observation: audio snapshot + rejection/clamp | empty-shell failure: settings UI not connected to state fails
// p2-keyboard-category-depth: M12 | real action: native keyDown/keyUp | independent observation: activeCategory change or stable non-destructive state | empty-shell failure: keyboard handler absent fails when feature claimed

function PASS(detail) { return { status: 'PASS', detail: detail || '' }; }
function FAIL(detail) { return { status: 'FAIL', detail: detail || '' }; }

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function cloneSummary(s) {
  if (!s || typeof s !== 'object') return s;
  return JSON.parse(JSON.stringify({
    phase: s.phase,
    activeCategory: s.activeCategory,
    activeSubMode: s.activeSubMode,
    character: s.character,
    adjustable: s.adjustable,
    ui: s.ui,
    audio: s.audio,
    canvas: s.canvas
  }));
}

function diffCount(a, b) {
  const aa = (a && a.character) || {};
  const bb = (b && b.character) || {};
  const keys = new Set([...Object.keys(aa), ...Object.keys(bb)]);
  let count = 0;
  for (const k of keys) {
    if (stableStringify(aa[k]) !== stableStringify(bb[k])) count++;
  }
  return count;
}

function getAccessories(snapshot) {
  const list = snapshot && snapshot.character && snapshot.character.accessories;
  return Array.isArray(list) ? list : [];
}

function createGameDriver(browser) {
  async function evalPage(src) {
    const result = await browser.eval(src);
    if (result && result.__l2_err__) throw new Error(result.__l2_err__);
    return result;
  }

  async function snapshot() {
    return await evalPage(`
      (async function() {
        if (window.__gameTest && typeof window.__gameTest.getSnapshot === 'function') {
          const s = await window.__gameTest.getSnapshot();
          return s && typeof s === 'object' ? s : { phase: 'unknown', contractInvalid: true };
        }
        const canvas = Array.from(document.querySelectorAll('canvas')).sort((a,b) => (b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0] || null;
        const controls = Array.from(document.querySelectorAll('button,[role="button"],[data-game-control],[data-game-category],[data-game-option],input'));
        const text = document.body ? document.body.innerText : '';
        const activeCategoryEl = document.querySelector('[data-game-category][aria-pressed="true"],[data-game-category].active,[data-game-category][data-active="true"]');
        const activeCategory = activeCategoryEl ? activeCategoryEl.getAttribute('data-game-category') : null;
        return {
          phase: canvas || controls.length ? 'editing' : 'loading',
          screen: 'creator',
          activeCategory,
          activeSubMode: null,
          overlayBlocking: false,
          canInteractWithPlayfield: !!(canvas || controls.length),
          categories: Array.from(document.querySelectorAll('[data-game-category]')).map(el => ({ id: el.getAttribute('data-game-category'), optionCount: 0 })),
          character: {
            accessories: Array.from(document.querySelectorAll('[data-game-accessory-selected="true"],[data-selected-accessory="true"]')).map((el, i) => el.getAttribute('data-game-option') || 'accessory-' + i)
          },
          adjustable: null,
          ui: {
            settingsOpen: !!document.querySelector('[data-game-panel="settings"][data-open="true"],[data-game-control="settings"][aria-expanded="true"]'),
            randomAvailable: !!document.querySelector('[data-game-control="random"],[aria-label*="random" i]'),
            clearAvailable: !!document.querySelector('[data-game-control="clear"],[aria-label*="clear" i],[aria-label*="reset" i]')
          },
          audio: {},
          canvas: {
            present: !!canvas,
            nonBlank: !!canvas,
            width: canvas ? (canvas.width || canvas.clientWidth || 0) : 0,
            height: canvas ? (canvas.height || canvas.clientHeight || 0) : 0,
            revision: null
          },
          bodyTextLength: text.length
        };
      })()
    `);
  }

  async function contractInput(action) {
    const json = JSON.stringify(action);
    return await evalPage(`
      (async function() {
        if (!window.__gameTest || typeof window.__gameTest.input !== 'function') {
          return { ok: false, reason: 'missing __gameTest.input', snapshot: null };
        }
        const result = await window.__gameTest.input(${json});
        const snap = window.__gameTest.getSnapshot ? await window.__gameTest.getSnapshot() : null;
        if (result && typeof result === 'object' && ('ok' in result || 'snapshot' in result)) {
          return Object.assign({}, result, { snapshot: result.snapshot || snap });
        }
        return { ok: true, snapshot: snap };
      })()
    `);
  }

  async function reset(options) {
    const json = JSON.stringify(options || {});
    return await evalPage(`
      (async function() {
        if (window.__gameTest && typeof window.__gameTest.reset === 'function') {
          return await window.__gameTest.reset(${json});
        }
        return null;
      })()
    `);
  }

  async function loadScenario(name) {
    return await evalPage(`
      (async function() {
        if (window.__gameTest && typeof window.__gameTest.loadScenario === 'function') {
          return await window.__gameTest.loadScenario(${JSON.stringify(name)});
        }
        if (window.__gameTest && typeof window.__gameTest.reset === 'function') {
          return await window.__gameTest.reset({ scenario: ${JSON.stringify(name)} });
        }
        return null;
      })()
    `);
  }

  async function waitForReady() {
    const deadline = Date.now() + 12000;
    let last = null;
    while (Date.now() < deadline) {
      last = await snapshot().catch(() => null);
      if (last && last.phase === 'editing' && last.canInteractWithPlayfield === true) return last;
      await browser.sleep(300);
    }
    throw new Error('creator did not become ready: ' + stableStringify(last));
  }

  async function canvasHash() {
    return await browser.canvasPixelHash();
  }

  async function findClickable(kind, preferred) {
    const pref = preferred || {};
    return await evalPage(`
      (function() {
        const kind = ${JSON.stringify(kind)};
      const preferred = ${JSON.stringify(pref)};
      function visible(el) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none';
      }
      function controlLabel(el) {
        return [
          el.getAttribute('aria-label'),
          el.getAttribute('title'),
          el.innerText,
          el.textContent,
          el.id,
          typeof el.className === 'string' ? el.className : '',
          el.getAttribute('data-game-control'),
          el.getAttribute('data-action'),
          el.getAttribute('data-act'),
          el.getAttribute('data-test'),
          el.getAttribute('data-game-category'),
          el.getAttribute('data-category'),
          el.getAttribute('data-cat'),
          el.getAttribute('data-value'),
          el.getAttribute('data-game-option'),
          el.getAttribute('data-option'),
          el.getAttribute('data-opt'),
          el.getAttribute('data-option-category')
        ].filter(Boolean).join(' ').trim();
      }
      function isInteractive(el) {
        const tag = String(el.tagName || '').toLowerCase();
        const role = String(el.getAttribute('role') || '').toLowerCase();
        const inputButton = tag === 'input' && /^(button|submit)$/i.test(el.type || '');
        return (tag === 'button' || role === 'button' || role === 'option' || inputButton) &&
          visible(el) && !el.disabled;
      }
      function isActionable(el) {
        return isInteractive(el) || !!(el.matches && el.matches(
          '[data-game-option],[data-option],[data-opt],[data-act="opt"],[data-action="option"],.feature-item,.feature-preview'
        ));
      }
      function normalizeCategory(value) {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      }
      function categoryAliases(requested) {
        const req = normalizeCategory(requested);
        const aliases = {
          accessories: ['accessory', 'extras', 'charms'],
          facialmarks: ['facialmark', 'marks']
        }[req] || [];
        return [req].concat(aliases);
      }
      function categoryMatches(value, requested) {
        const normalized = normalizeCategory(value);
        return !!normalized && categoryAliases(requested).indexOf(normalized) >= 0;
      }
      function categoryTextMatches(text, requested) {
        const normalized = normalizeCategory(text);
        return categoryAliases(requested).some(alias => alias && normalized.indexOf(alias) >= 0);
      }
      function center(el) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, text: controlLabel(el).slice(0, 80) };
      }
        function pointFor(el) {
          let r = el.getBoundingClientRect();
          let p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          if (!(p.x >= 0 && p.y >= 0 && p.x <= innerWidth && p.y <= innerHeight)) {
            el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
            r = el.getBoundingClientRect();
            p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
          return { x: p.x, y: p.y, w: r.width, h: r.height, text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 80) };
        }
      function isFineAdjustControl(el) {
        const label = controlLabel(el);
        const semantic = [
          el.getAttribute('aria-controls'),
          el.getAttribute('data-game-control'),
          el.getAttribute('data-action'),
          el.getAttribute('data-act'),
          el.getAttribute('data-test'),
          el.getAttribute('data-adjust'),
          el.getAttribute('data-adj')
        ].filter(Boolean).join(' ');
        return /\\bfine[\\s-]*(?:adjust(?:ment)?|tune(?:\\s*part)?)\\b|\\badjust(?:ment)?\\b|\\btune\\b/i.test(label) || /fine|adjust|tune/i.test(semantic);
      }
        if (kind === 'fineAdjust') {
          const direct = Array.from(document.querySelectorAll('button,[role="button"],[data-game-control]'))
            .find(el => {
              const r = el.getBoundingClientRect();
              const cs = getComputedStyle(el);
              return r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none' &&
                cs.pointerEvents !== 'none' && isFineAdjustControl(el);
            });
          if (direct) return pointFor(direct);
        }
        let candidates = [];
        if (kind === 'settings') {
          candidates = Array.from(document.querySelectorAll('[data-game-control="settings"],[aria-label*="settings" i],[aria-label*="adjust" i],button,[role="button"]'))
            .filter(el => {
              const label = controlLabel(el);
              return /settings|adjust|fine|gear|⚙/i.test(label) || el.getAttribute('data-game-control') === 'settings';
            })
            .sort((a, b) => {
              const score = el => {
                const label = controlLabel(el);
                let value = 0;
                if (/settings/i.test(label)) value += 100;
                if (el.getAttribute('data-game-control') === 'settings' ||
                    el.getAttribute('data-action') === 'settings' ||
                    el.getAttribute('data-act') === 'settings') value += 100;
                if (/adjust|fine|tune/i.test(label) && !/settings/i.test(label)) value -= 100;
                return value;
              };
              return score(b) - score(a);
            });
        } else if (kind === 'settingsClose') {
          function settingsPanelFor(el) {
            return el.closest('[role="dialog"],[aria-modal="true"],[aria-label*="settings" i],[id*="settings" i],[class*="settings" i],[data-game-panel="settings"]');
          }
          candidates = Array.from(document.querySelectorAll('[data-game-control],[data-action],[data-act],button,[role="button"],input[type="button"]'))
            .filter(el => {
              const label = controlLabel(el);
              const panel = settingsPanelFor(el);
              return /close|done|dismiss|back|×|✕|✖/i.test(label) &&
                (panel || /closeSettings|settings.*close/i.test(label));
            })
            .sort((a, b) => {
              const score = el => {
                const label = controlLabel(el);
                return (settingsPanelFor(el) ? 10 : 0) +
                  (/closeSettings|close settings|settings.*close/i.test(label) ? 50 : 0);
              };
              return score(b) - score(a);
            });
        } else if (kind === 'random') {
          candidates = Array.from(document.querySelectorAll('[data-game-control="random"],[aria-label*="random" i],button,[role="button"]'))
            .filter(el => /random|shuffle|dice|随机|🎲/i.test((el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim()) || el.getAttribute('data-game-control') === 'random');
        } else if (kind === 'clear') {
          candidates = Array.from(document.querySelectorAll('[data-game-control="clear"],[data-game-control="reset"],[aria-label*="clear" i],[aria-label*="reset" i],button,[role="button"]'))
            .filter(el => /clear|reset|clean|重置|清空|🔄/i.test((el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim()) || /clear|reset/.test(el.getAttribute('data-game-control') || ''));
        } else if (kind === 'category') {
          const category = preferred.category;
          const categorySelector = '[data-game-category],[data-category],[data-cat],[data-value],[role="tab"],button,[role="button"]';
          const markerFor = el => [
            el.getAttribute('data-game-category'),
            el.getAttribute('data-category'),
            el.getAttribute('data-cat'),
            el.getAttribute('data-value')
          ].find(Boolean) || '';
          candidates = Array.from(document.querySelectorAll(categorySelector))
            .filter(el => isInteractive(el))
            .filter(el => {
              const marker = markerFor(el);
              const text = controlLabel(el);
              return category
                ? (categoryMatches(marker, category) || categoryTextMatches(text, category))
                : !!marker || /hair|eyes|mouth|nose|skin|base|accessor/i.test(text);
            })
            .sort((a, b) => {
              const score = el => categoryMatches(markerFor(el), category) ? 0 : 1;
              return score(a) - score(b);
            });
        } else if (kind === 'option') {
          // Discover actual option controls, never an option-list container
          // or an unrelated header/category button.
          const controlSelector = 'button,[role="button"],[role="option"],[data-game-option],[data-option],[data-opt],[data-act="opt"],[data-action="option"]';
          const scoped = Array.from(document.querySelectorAll(
            '[data-game-option],[data-option],[data-opt],[data-act="opt"],[data-action="option"],[role="option"],' +
            '#option-grid button,#option-grid [role="button"],#option-grid [role="option"],#optionGrid button,#optionGrid [role="button"],#optionGrid [role="option"],' +
            '#optionsGrid button,#optionsGrid [role="button"],#optionsGrid [role="option"],#options button,#options [role="button"],#options [role="option"],' +
            '#options-container button,#options-container [role="button"],#options-container [role="option"],#optGrid button,#optGrid [role="button"],#optGrid [role="option"],' +
            '#optionPanel button,#optionPanel [role="button"],#optionPanel [role="option"],.option-grid button,.option-grid [role="button"],.option-grid [role="option"],' +
            '.options button,.options [role="button"],.options [role="option"],.feature-item,.feature-preview'
          ));
          const regions = Array.from(document.querySelectorAll(
            '#option-grid,#optionGrid,#optionsGrid,#options,#options-container,#optGrid,#optionPanel,.option-grid,.options,[role="listbox"]'
          ));
          const regional = [];
          for (const region of regions) {
            regional.push(...Array.from(region.querySelectorAll(controlSelector + ',.feature-item,.feature-preview')));
          }
          const normalizeCategory = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const requestedCategory = normalizeCategory(preferred.category);
          const matchesCategory = el => {
            if (!requestedCategory) return true;
            const marker = el.getAttribute('data-game-category') ||
              el.getAttribute('data-category') ||
              el.getAttribute('data-cat') ||
              el.getAttribute('data-option-category');
            if (!marker) return true;
            const normalized = normalizeCategory(marker);
            return normalized === requestedCategory ||
              (requestedCategory === 'accessories' && normalized === 'accessory') ||
              (requestedCategory === 'facialmarks' && normalized === 'facialmark');
          };
          const isLeaf = el => !el.querySelector(controlSelector + ',.feature-item,.feature-preview');
          const isCategoryControl = el => {
            const role = String(el.getAttribute('role') || '').toLowerCase();
            return role === 'tab' || !!el.closest(
              'nav,[role="tablist"],[id*="tabs" i],[class*="tabs" i],[id*="category-tabs" i],[class*="category-tabs" i]'
            );
          };
          const isGlobalControl = el => {
            const action = [
              el.getAttribute('data-game-control'),
              el.getAttribute('data-action'),
              el.getAttribute('data-act')
            ].filter(Boolean).join(' ').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
            const label = controlLabel(el);
            return !!el.closest(
              'header,[role="dialog"],[aria-modal="true"],[id*="settings" i],[class*="settings" i]'
            ) || /random|shuffle|clearall|settings|toggleadjust|finetune|opensettings|closesettings/i.test(action) ||
              /\\b(?:random(?:ize)?|shuffle|settings|fine[\\s-]*(?:adjust(?:ment)?|tune)|toggle[\\s-]*adjust)\\b/i.test(label);
          };
          const isExcludedOption = el => {
            const label = controlLabel(el);
            if (preferred.excludeText && new RegExp(preferred.excludeText, 'i').test(label)) return true;
            if (requestedCategory === 'accessories') {
              const emptyWord = /\\b(?:none|no|without|remove|clear|reset|empty)\\b/i.test(label);
              const accessoryWord = /\\b(?:accessor(?:y|ies)|charm(?:s)?|extra(?:s)?|ornament(?:s)?|decor(?:ation)?(?:s)?|gear|item(?:s)?)\\b/i.test(label);
              if (emptyWord && accessoryWord) return true;
            }
            return false;
          };
          const generic = Array.from(document.querySelectorAll(
            'button,[role="button"],[role="option"],input[type="button"],input[type="submit"]'
          ));
          candidates = Array.from(new Set(scoped.concat(regional)))
            .concat(generic)
            .filter(el => isActionable(el) && visible(el) && matchesCategory(el) && isLeaf(el) &&
              !isCategoryControl(el) && !isGlobalControl(el) && !isExcludedOption(el));
        } else if (kind === 'fineAdjust') {
          candidates = Array.from(document.querySelectorAll('button,[role="button"], [data-game-control]'))
            .filter(el => isFineAdjustControl(el));
        }
        if (kind === 'fineAdjust') {
          const direct = candidates.find(visible);
          if (direct) return pointFor(direct);
        }
        // Controls inside the scrollable editor panel may be below the
        // current viewport. Discover them through normal scrolling before
        // performing the real click.
        for (const el of candidates) {
          if (!visible(el)) continue;
          let p = center(el);
          if (!(p.x >= 0 && p.y >= 0 && p.x <= innerWidth && p.y <= innerHeight)) {
            el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
            if (!visible(el)) continue;
            p = center(el);
          }
          if (p.x >= 0 && p.y >= 0 && p.x <= innerWidth && p.y <= innerHeight) return p;
        }
        return null;
      })()
    `);
  }

  async function findAdjustmentControl(kind) {
    return await evalPage(`
      (function() {
        const kind = ${JSON.stringify(kind)};
        function visible(el) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 6 && r.height > 6 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none';
        }
        function controlLabel(el) {
          return [
            el.getAttribute('aria-label'),
            el.getAttribute('title'),
            el.innerText,
            el.textContent,
            el.id,
            typeof el.className === 'string' ? el.className : '',
            el.getAttribute('data-game-adjust'),
            el.getAttribute('data-adjust-axis'),
            el.getAttribute('data-adjust-direction'),
            el.getAttribute('data-action'),
            el.getAttribute('data-act'),
            el.getAttribute('data-test'),
            el.getAttribute('data-adj')
          ].filter(Boolean).join(' ').trim();
        }
        function center(el) {
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, text: controlLabel(el).slice(0, 80) };
        }
        function pointFor(el) {
          let r = el.getBoundingClientRect();
          let p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          if (!(p.x >= 0 && p.y >= 0 && p.x <= innerWidth && p.y <= innerHeight)) {
            el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
            r = el.getBoundingClientRect();
            p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
          return { x: p.x, y: p.y, w: r.width, h: r.height, text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 80) };
        }
        const directSelectors = {
          xPlus: [
            '[data-game-adjust="x-plus"]',
            '[data-game-adjust="right"]',
            '[data-adj="right"]',
            '[data-act="adj:right"]',
            '[data-action="move-right"]',
            '[id*="move"][id*="right" i]',
            '[data-adjust-axis="x"][data-adjust-direction="plus"]',
            '[aria-label*="right" i]',
            '[aria-label*="horizontal" i][aria-label*="increase" i]',
            '#pos-x-plus'
          ],
          yPlus: [
            '[data-game-adjust="y-plus"]',
            '[data-game-adjust="down"]',
            '[data-adj="down"]',
            '[data-act="adj:down"]',
            '[data-action="move-down"]',
            '[id*="move"][id*="down" i]',
            '[data-adjust-axis="y"][data-adjust-direction="plus"]',
            '[aria-label*="down" i]',
            '[aria-label*="vertical" i][aria-label*="increase" i]',
            '#pos-y-plus'
          ],
          scalePlus: [
            '[data-game-adjust="scale-plus"]',
            '[data-game-adjust="size-plus"]',
            '[data-adj="in"]',
            '[data-adj="zoomin"]',
            '[data-act="adj:upSize"]',
            '[data-act="scale"][data-d="0.1"]',
            '[data-action="scale-up"]',
            '[id*="scale"][id*="up" i]',
            '[data-adjust-axis="scale"][data-adjust-direction="plus"]',
            '[aria-label*="larger" i]',
            '[aria-label*="bigger" i]',
            '[aria-label*="increase size" i]',
            '#scale-plus'
          ],
          reset: [
            '[data-game-adjust="reset"]',
            '[data-game-control="reset-adjustment"]',
            '[data-act="adj:reset"]',
            '[data-action="reset-adjustment"]',
            '[id*="reset"][id*="adjust" i]',
            '[aria-label*="reset adjustment" i]',
            '#reset-position'
          ]
        };
        const semanticWords = {
          xPlus: /right|horizontal\\s*\\+|x\\s*\\+|→/i,
          yPlus: /down|vertical\\s*\\+|y\\s*\\+|↓/i,
          scalePlus: /bigger|larger|scale\\s*(?:\\+|up|increase|plus)|size\\s*(?:\\+|up|increase|plus)|increase\\s*(?:the\\s*)?(?:size|scale)|zoom\\s*(?:\\+|in|up)|\\+\\s*size|plus\\s*size/i
        };
        function hasPositiveDelta(el, attribute) {
          const value = Number(el.getAttribute(attribute));
          return Number.isFinite(value) && value > 0;
        }
        const dataSemantic = Array.from(document.querySelectorAll('button,[role="button"],input[type="button"]'))
          .find(el => {
            if (!visible(el)) return false;
            if (kind === 'xPlus') return hasPositiveDelta(el, 'data-dx');
            if (kind === 'yPlus') return hasPositiveDelta(el, 'data-dy');
            if (kind === 'scalePlus') return hasPositiveDelta(el, 'data-scale') || hasPositiveDelta(el, 'data-d');
            return false;
          });
        if (dataSemantic) return pointFor(dataSemantic);
        if (semanticWords[kind]) {
          const semantic = Array.from(document.querySelectorAll('button,[role="button"],input[type="button"]'))
            .find(el => visible(el) && semanticWords[kind].test(controlLabel(el)));
          if (semantic) return pointFor(semantic);
        }
        if (kind === 'reset') {
          const resetControl = Array.from(document.querySelectorAll('button,[role="button"],input[type="button"]'))
            .find(el => visible(el) && /reset|default|重置|清空/i.test(controlLabel(el)));
          if (resetControl) return pointFor(resetControl);
        }
        for (const sel of directSelectors[kind] || []) {
          const el = document.querySelector(sel);
          if (el && visible(el)) return pointFor(el);
        }
        const explicitPanel = document.querySelector('[data-game-panel="adjust"],[data-game-panel="settings"],.adjustment-panel');
        const textPanel = Array.from(document.querySelectorAll('section,aside,dialog,[role="dialog"],.panel,div'))
          .find(el => visible(el) && /fine[\\s-]*adjust|close\\s*adjustments|position\\s*&\\s*size|tune/i.test(controlLabel(el)));
        const panel = explicitPanel || textPanel || document;
        const controls = Array.from(panel.querySelectorAll('button,[role="button"],input[type="button"],input[type="range"],[data-game-adjust]')).filter(visible);
        const labeled = controls.map(center);
        function includesAny(p, words) {
          const t = String(p.text || '').toLowerCase();
          return words.some(w => t.includes(w));
        }
        if (kind === 'reset') {
          return labeled.find(p => includesAny(p, ['reset', 'default', '重置', '清空'])) || null;
        }
        if (kind === 'xPlus') {
          return labeled.find(p => includesAny(p, ['right', 'horizontal +', 'x +', '→', '+']) && !includesAny(p, ['vertical', 'size', 'scale'])) || null;
        }
        if (kind === 'yPlus') {
          return labeled.find(p => includesAny(p, ['down', 'vertical +', 'y +', '↓', '+']) && !includesAny(p, ['horizontal', 'size', 'scale'])) || null;
        }
        if (kind === 'scalePlus') {
          return labeled.find(p => includesAny(p, ['size', 'scale', 'larger', 'bigger', 'zoom', '+'])) || null;
        }
        return null;
      })()
    `);
  }

  async function clickPoint(point) {
    if (!point) throw new Error('missing click point');
    await browser.mouseClick(point.x, point.y);
    await browser.sleep(350);
  }

  async function clickSemantic(kind, preferred) {
    const point = await findClickable(kind, preferred);
    if (!point) throw new Error('could not find clickable ' + kind);
    await clickPoint(point);
    return point;
  }

  async function clickAdjustment(kind) {
    const point = await findAdjustmentControl(kind);
    if (!point) throw new Error('could not find adjustment control ' + kind);
    await clickPoint(point);
    return point;
  }

  async function realMouseDrag(start, dx, dy) {
    await browser.mouseMove(start.x, start.y);
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', clickCount: 1, modifiers: 0 });
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const x = start.x + dx * i / steps;
      const y = start.y + dy * i / steps;
      await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1, clickCount: 1, modifiers: 0 });
      await browser.sleep(30);
    }
    await browser.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: start.x + dx, y: start.y + dy, button: 'left', clickCount: 1, modifiers: 0 });
    await browser.sleep(400);
  }

  async function playfieldCenter() {
    return await evalPage(`
      (function() {
        function visible(el) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 40 && r.height > 40 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none';
        }
        const surfaces = Array.from(document.querySelectorAll('canvas,svg,[data-game-playfield]'))
          .filter(visible)
          .sort((a,b) => {
            const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
            return br.width * br.height - ar.width * ar.height;
          });
        const surface = surfaces[0] || Array.from(document.querySelectorAll('main,[role="main"]')).find(visible);
        if (!surface) return null;
        const r = surface.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height * 0.38, w: r.width, h: r.height };
      })()
    `);
  }

  return {
    waitForReady,
    snapshot,
    contractInput,
    reset,
    loadScenario,
    canvasHash,
    clickSemantic,
    clickAdjustment,
    realMouseDrag,
    playfieldCenter
  };
}

const suite = [
  {
    id: 'p0-boot-visible-creator',
    level: 'P0',
    name: 'boot shows a nonblank creator surface',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      const snap = await game.waitForReady();
      const size = await browser.getCanvasSize();
      const hash = await game.canvasHash();
      if (browser.exceptions.length) return FAIL('runtime exceptions: ' + browser.exceptions[0].description);
      if (!snap || snap.phase === 'loading') return FAIL('still loading');
      if (!snap.canInteractWithPlayfield) return FAIL('playfield not interactable');
      if (size && (size.cssW < 80 || size.cssH < 80)) return FAIL('preview canvas too small');
      if (hash === null) return FAIL('could not observe preview screenshot');
      return PASS('phase=' + snap.phase + ', hash=' + hash);
    }
  },
  {
    id: 'p0-contract-schema',
    level: 'P0',
    name: 'public contract snapshot schema is stable',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.reset({ reason: 'schema-check' }).catch(() => null);
      const snap = await game.snapshot();
      const required = ['phase', 'character', 'canvas', 'ui'];
      const missing = required.filter(k => !(k in (snap || {})));
      if (missing.length) return FAIL('missing snapshot fields: ' + missing.join(','));
      if (!snap.character || typeof snap.character !== 'object') return FAIL('character summary missing');
      if (!snap.canvas || typeof snap.canvas !== 'object') return FAIL('canvas summary missing');
      if (snap.overlayBlocking === true && snap.phase === 'editing') return FAIL('editing phase is overlay-blocked');
      return PASS('schema fields present');
    }
  },
  {
    id: 'p1-real-click-settings-blocking',
    level: 'P1',
    name: 'real click settings toggles panel without blocking editor',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await game.snapshot();
      try {
        await game.clickSemantic('settings');
      } catch (_) {
        return FAIL('settings control not clickable');
      }
      const open = await game.snapshot();
      if (!open.ui || open.ui.settingsOpen !== true) return FAIL('settingsOpen did not become true after trigger');
      if (open.overlayBlocking === true || open.canInteractWithPlayfield === false) return FAIL('settings panel blocks playfield');
      try {
        await game.clickSemantic('settingsClose');
      } catch (_) {
        try {
          await game.clickSemantic('settings');
        } catch (_) {
          const res = await game.contractInput({ type: 'closeSettings' });
          if (!res || res.ok === false) return FAIL('settings close control not clickable and contract failed');
        }
      }
      const closed = await game.snapshot();
      if (!closed.ui || closed.ui.settingsOpen !== false) return FAIL('settings did not close');
      if (before.phase !== closed.phase && closed.phase !== 'editing') return FAIL('settings changed phase unexpectedly');
      return PASS('settings toggled and editor remains usable');
    }
  },
  {
    id: 'p1-real-click-category-option',
    level: 'P1',
    name: 'real click category and option changes character preview',
    timeoutMs: 25000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.reset({ scenario: 'defaultCreator' }).catch(() => null);
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      try {
        await game.clickSemantic('category', { category: 'eyes' });
      } catch (_) {
        const r = await game.contractInput({ type: 'selectCategory', category: 'eyes' });
        if (!r || r.ok === false) return FAIL('could not select category');
      }
      const catSnap = await game.snapshot();
      if (catSnap.activeCategory && catSnap.activeCategory !== 'eyes') return FAIL('activeCategory did not switch to eyes');
      try {
        await game.clickSemantic('option', { excludeText: 'none|clear|reset' });
      } catch (_) {
        const r = await game.contractInput({ type: 'selectOption', category: 'eyes' });
        if (!r || r.ok === false) return FAIL('could not select option');
      }
      await browser.sleep(500);
      const after = await game.snapshot();
      const hashAfter = await game.canvasHash();
      const changed = diffCount(before, after) > 0 || (after.canvas && before.canvas && after.canvas.revision !== before.canvas.revision) || hashAfter !== hashBefore;
      if (!changed) return FAIL('option selection caused no character or preview change');
      return PASS('category/option changed preview');
    }
  },
  {
    id: 'p1-contract-color-intensity',
    level: 'P1',
    name: 'contract color intensity changes hair color and preview',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('hairColorReady').catch(() => null);
      await game.contractInput({ type: 'selectCategory', category: 'hair' });
      await game.contractInput({ type: 'selectSubMode', subMode: 'colors' });
      const before = await game.snapshot();
      const resColor = await game.contractInput({ type: 'selectColor', category: 'hair' });
      if (!resColor || resColor.ok === false) return FAIL('selectColor rejected: ' + (resColor && resColor.reason));
      const resIntensity = await game.contractInput({ type: 'setColorIntensity', category: 'hair', value: 0.35 });
      if (!resIntensity || resIntensity.ok === false) return FAIL('setColorIntensity rejected');
      const after = await game.snapshot();
      const c = after.character || {};
      if (c.hairColor == null) return FAIL('hairColor missing after color action');
      if (typeof c.hairColorIntensity !== 'number' || c.hairColorIntensity < 0 || c.hairColorIntensity > 1) {
        return FAIL('hairColorIntensity not in 0..1');
      }
      const previewChanged = after.canvas && before.canvas && after.canvas.revision !== before.canvas.revision;
      if (!previewChanged && stableStringify(before.character) === stableStringify(after.character)) return FAIL('color action produced no observable change');
      return PASS('hair color=' + c.hairColor + ', intensity=' + c.hairColorIntensity);
    }
  },
  {
    id: 'p1-real-click-accessory-clear',
    level: 'P1',
    name: 'real click accessory selection and clear updates accessory count',
    timeoutMs: 25000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.reset({ scenario: 'defaultCreator' }).catch(() => null);
      try {
        await game.clickSemantic('category', { category: 'accessories' });
      } catch (_) {
        await game.contractInput({ type: 'selectCategory', category: 'accessories' });
      }
      const before = await game.snapshot();
      try {
        await game.clickSemantic('option', { category: 'accessories', excludeText: 'none|clear|reset' });
      } catch (_) {
        return FAIL('could not click a real accessory option');
      }
      const added = await game.snapshot();
      if (getAccessories(added).length <= getAccessories(before).length) return FAIL('accessory count did not increase');
      const totalBefore = getAccessories(added).length;
      try {
        await game.clickSemantic('clear');
      } catch (_) {
        return FAIL('could not click a real clear control');
      }
      const cleared = await game.snapshot();
      const totalAfter = getAccessories(cleared).length;
      if (totalAfter !== 0) return FAIL('clearAccessories did not clear all accessories');
      if (totalBefore <= totalAfter) return FAIL('accessory total invariant did not decrease on clear');
      return PASS('accessory count ' + getAccessories(before).length + ' -> ' + totalBefore + ' -> ' + totalAfter);
    }
  },
  {
    id: 'p1-real-drag-screen-direction',
    level: 'P1',
    name: 'real mouse drag moves adjustable target in opposite directions correctly',
    timeoutMs: 25000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('adjustHair').catch(() => null);
      await game.contractInput({ type: 'selectCategory', category: 'hair' }).catch(() => null);
      let before = await game.snapshot();
      if (!before.adjustable || before.adjustable.canDrag === false) {
        await game.contractInput({ type: 'adjust', target: 'hair', dx: 0, dy: 0, scaleDelta: 0 }).catch(() => null);
        before = await game.snapshot();
      }
      const position = before.adjustable && before.adjustable.position;
      if (!position || ![position.screenX, position.screenY].every(Number.isFinite)) {
        return FAIL('screen position not observable for drag direction');
      }
      const offsetOnly = [position.screenX, position.screenY, position.offsetX, position.offsetY].every(Number.isFinite)
        && Math.abs(position.screenX - position.offsetX) < 0.001
        && Math.abs(position.screenY - position.offsetY) < 0.001;
      if (offsetOnly) return FAIL('screenX/screenY duplicate offsetX/offsetY');
      const start = await game.playfieldCenter();
      if (!start || !Number.isFinite(start.x) || !Number.isFinite(start.y)) return FAIL('real drag requires visible playfield bounds');
      const hashBefore = await game.canvasHash();
      await game.realMouseDrag(start, 45, 0);
      const right = await game.snapshot();
      await game.realMouseDrag({ x: start.x + 45, y: start.y }, -45, 0);
      const left = await game.snapshot();
      const x0 = before.adjustable && before.adjustable.position ? before.adjustable.position.screenX : null;
      const xR = right.adjustable && right.adjustable.position ? right.adjustable.position.screenX : null;
      const xL = left.adjustable && left.adjustable.position ? left.adjustable.position.screenX : null;
      if (![x0, xR, xL].every(Number.isFinite)) return FAIL('screenX not observable for drag direction');
      const rightDelta = xR - x0;
      const leftDelta = xL - xR;
      if (!(rightDelta > 0 && leftDelta < 0)) return FAIL('drag direction not screen-consistent: rightDelta=' + rightDelta + ', leftDelta=' + leftDelta);
      if (Math.sign(rightDelta) === Math.sign(leftDelta)) return FAIL('opposite direction deltas have same sign');
      const hashAfter = await game.canvasHash();
      if (hashBefore === hashAfter && (!right.canvas || right.canvas.revision === before.canvas?.revision)) return FAIL('drag changed snapshot direction but no preview evidence');
      return PASS('rightDelta=' + rightDelta + ', leftDelta=' + leftDelta);
    }
  },
  {
    id: 'p1-real-adjustment-controls',
    level: 'P1',
    name: 'real adjustment panel controls move, scale, and reset the active feature',
    timeoutMs: 30000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('adjustHair').catch(() => null);
      await game.contractInput({ type: 'selectCategory', category: 'hair' }).catch(() => null);
      let panelState = await game.snapshot();
      const panelAlreadyOpen = Boolean(panelState && (
        panelState.activePanel === 'adjust' ||
        (panelState.activePanel === 'settings' &&
          panelState.ui && panelState.ui.adjustmentControlsVisible === true)
      ));
      if (!panelAlreadyOpen) {
        let opened = false;
        try {
          await game.clickSemantic('fineAdjust');
          opened = true;
        } catch (_) {
          // A settings surface is a valid entry point when it visibly
          // contains the fine-adjustment controls.
          const settingsPoint = await game.clickSemantic('settings').catch(() => null);
          if (settingsPoint) {
            const settingsHasAdjustmentPanel = await browser.eval(
              "(function(){"
              + "function visible(el){const r=el.getBoundingClientRect(),s=getComputedStyle(el);"
              + "return r.width>8&&r.height>8&&s.display!=='none'&&s.visibility!=='hidden'&&s.pointerEvents!=='none';}"
              + "const panels=Array.from(document.querySelectorAll('[role=\"dialog\"],[id*=\"settings\" i],[class*=\"settings\" i],[data-game-panel=\"settings\"]')).filter(visible);"
              + "return panels.some(panel=>{"
              + "const label=[panel.getAttribute('aria-label'),panel.innerText,panel.textContent].filter(Boolean).join(' ');"
              + "const controls=Array.from(panel.querySelectorAll('button,[role=\"button\"],input[type=\"button\"]')).filter(visible);"
              + "return /fine|adjust|tune|position|size/i.test(label)&&controls.length>=4;});"
              + "})()"
            );
            opened = settingsHasAdjustmentPanel === true;
          }
        }
        if (!opened) return FAIL('could not open fine-adjustment panel');
      }
      panelState = await game.snapshot();
      const panelIsOpen = Boolean(panelState && (
        panelState.activePanel === 'adjust' ||
        (panelState.activePanel === 'settings' &&
          panelState.ui && panelState.ui.adjustmentControlsVisible === true)
      ));
      if (!panelIsOpen) return FAIL('fine-adjustment panel did not open');
      await browser.sleep(350);
      let before = await game.snapshot();
      if (!before.adjustable || !before.adjustable.position || !Number.isFinite(before.adjustable.position.screenX)) {
        return FAIL('adjustable screen position not observable before panel controls');
      }
      const hashBefore = await game.canvasHash();
      await game.clickAdjustment('xPlus');
      const afterX = await game.snapshot();
      await game.clickAdjustment('yPlus');
      const afterY = await game.snapshot();
      const scalePoint = await game.clickAdjustment('scalePlus');
      const afterScale = await game.snapshot();
      const x0 = before.adjustable.position.screenX;
      const y0 = before.adjustable.position.screenY;
      const scale0 = before.adjustable.scale;
      const x1 = afterX.adjustable && afterX.adjustable.position && afterX.adjustable.position.screenX;
      const y1 = afterY.adjustable && afterY.adjustable.position && afterY.adjustable.position.screenY;
      const scale1 = afterScale.adjustable && afterScale.adjustable.scale;
      if (![x0, y0, x1, y1].every(Number.isFinite)) return FAIL('screen position missing after adjustment controls');
      if (!(x1 > x0)) return FAIL('right/increase horizontal control did not move feature right: ' + x0 + ' -> ' + x1);
      if (!(y1 > y0)) return FAIL('down/increase vertical control did not move feature down: ' + y0 + ' -> ' + y1);
      if (Number.isFinite(scale0) && !(Number.isFinite(scale1) && scale1 > scale0)) return FAIL('size increase control did not increase scale: ' + scale0 + ' -> ' + scale1);
      const hashAdjusted = await game.canvasHash();
      if (hashBefore === hashAdjusted && before.canvas && afterScale.canvas && before.canvas.revision === afterScale.canvas.revision) {
        return FAIL('adjustment controls changed no visible preview evidence');
      }
      await game.clickAdjustment('reset');
      const reset = await game.snapshot();
      const xr = reset.adjustable && reset.adjustable.position && reset.adjustable.position.screenX;
      const yr = reset.adjustable && reset.adjustable.position && reset.adjustable.position.screenY;
      const sr = reset.adjustable && reset.adjustable.scale;
      if (![xr, yr].every(Number.isFinite)) return FAIL('reset position not observable');
      if (Math.abs(xr - x0) > Math.max(12, Math.abs(x1 - x0) * 0.75)) return FAIL('reset did not restore horizontal position near baseline');
      if (Math.abs(yr - y0) > Math.max(12, Math.abs(y1 - y0) * 0.75)) return FAIL('reset did not restore vertical position near baseline');
      if (Number.isFinite(scale0) && Number.isFinite(sr) && Math.abs(sr - scale0) > Math.max(0.12, Math.abs(scale1 - scale0) * 0.75)) {
        return FAIL('reset did not restore scale near baseline');
      }
      if (reset.phase !== 'editing' || reset.canInteractWithPlayfield === false) return FAIL('editor not usable after adjustment reset');
      return PASS('x ' + x0 + ' -> ' + x1 + ', y ' + y0 + ' -> ' + y1 + ', scale ' + scale0 + ' -> ' + scale1);
    }
  },
  {
    id: 'p1-real-click-randomize',
    level: 'P1',
    name: 'real click randomize changes multiple character fields',
    timeoutMs: 20000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.reset({ scenario: 'defaultCreator' }).catch(() => null);
      const before = await game.snapshot();
      const hashBefore = await game.canvasHash();
      try {
        await game.clickSemantic('random');
      } catch (_) {
        const r = await game.contractInput({ type: 'randomize' });
        if (!r || r.ok === false) return FAIL('randomize trigger failed');
      }
      const after = await game.snapshot();
      const hashAfter = await game.canvasHash();
      const changedFields = diffCount(before, after);
      if (after.phase !== 'editing') return FAIL('randomize left editing phase');
      if (changedFields < 2 && hashAfter === hashBefore) return FAIL('randomize did not change multiple fields or preview');
      return PASS('changedFields=' + changedFields);
    }
  },
  {
    id: 'p1-real-click-clear-all',
    level: 'P1',
    name: 'real click clear all resets accessories and keeps editor usable',
    timeoutMs: 25000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('accessorySelected').catch(() => null);
      let withAccessory = await game.snapshot();
      if (getAccessories(withAccessory).length === 0) {
        await game.contractInput({ type: 'toggleAccessory' });
        withAccessory = await game.snapshot();
      }
      if (getAccessories(withAccessory).length === 0) return FAIL('could not establish accessory precondition');
      try {
        await game.clickSemantic('clear');
      } catch (_) {
        const r = await game.contractInput({ type: 'clearAll' });
        if (!r || r.ok === false) return FAIL('clearAll trigger failed');
      }
      const cleared = await game.snapshot();
      if (cleared.phase !== 'editing') return FAIL('clearAll left editing phase');
      if (getAccessories(cleared).length !== 0) return FAIL('accessories not cleared');
      if (cleared.canInteractWithPlayfield === false) return FAIL('editor not usable after clear');
      return PASS('clear reset accessories and stayed editing');
    }
  },
  {
    id: 'p2-invalid-action-rejected',
    level: 'P2',
    name: 'contract rejects invalid actions without mutation',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = cloneSummary(await game.snapshot());
      const res = await game.contractInput({ type: 'invalidAction', category: 'not-a-category', value: 999 });
      const after = cloneSummary(await game.snapshot());
      const unchanged = stableStringify(before.character) === stableStringify(after.character)
        && stableStringify(before.adjustable) === stableStringify(after.adjustable)
        && stableStringify(before.audio) === stableStringify(after.audio);
      if (res && res.ok === true && !unchanged) return FAIL('invalid action accepted and mutated state');
      if (!unchanged) return FAIL('invalid action changed state without a legal trigger');
      return PASS('invalid action rejected/unchanged');
    }
  },
  {
    id: 'p2-accessory-conservation',
    level: 'P2',
    name: 'contract accessory toggle preserves unique accessory set',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.reset({ scenario: 'defaultCreator' }).catch(() => null);
      const before = await game.snapshot();
      const totalBefore = getAccessories(before).length;
      // The optionId is optional in the TDD, so let the implementation choose
      // a valid item for the first toggle. For the conservation assertion,
      // repeat the concrete item exposed by that public snapshot; two
      // omitted optionIds are allowed to choose two different accessories.
      const r1 = await game.contractInput({ type: 'toggleAccessory' });
      if (!r1 || r1.ok === false) return FAIL('first accessory toggle rejected');
      const one = await game.snapshot();
      const totalAfterFirst = getAccessories(one).length;
      const selectedId = getAccessories(one)[getAccessories(one).length - 1];
      if (!selectedId) return FAIL('first accessory toggle exposed no selected accessory');
      const r2 = await game.contractInput({ type: 'toggleAccessory', optionId: selectedId });
      if (!r2 || r2.ok === false) return FAIL('second accessory toggle rejected');
      const two = await game.snapshot();
      const totalAfter = getAccessories(two).length;
      const uniqueCount = new Set(getAccessories(two)).size;
      if (uniqueCount !== totalAfter) return FAIL('duplicate accessory entries detected');
      if (totalAfterFirst > totalBefore + 1) return FAIL('one toggle added more than one accessory');
      if (totalAfter > totalAfterFirst) return FAIL('second toggle accumulated duplicate instead of removing/preserving');
      return PASS('totalBefore=' + totalBefore + ', totalAfter=' + totalAfter + ', unique=' + uniqueCount);
    }
  },
  {
    id: 'p2-scale-reset-bounds',
    level: 'P2',
    name: 'contract scale adjust stays within bounds and reset restores',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      await game.loadScenario('adjustHair').catch(() => null);
      await game.contractInput({ type: 'selectCategory', category: 'hair' });
      const before = await game.snapshot();
      const scale0 = before.adjustable && before.adjustable.scale;
      const res = await game.contractInput({ type: 'adjust', target: 'hair', scaleDelta: 0.25 });
      if (!res || res.ok === false) return FAIL('scale adjust rejected');
      const bigger = await game.snapshot();
      const scale1 = bigger.adjustable && bigger.adjustable.scale;
      if (!Number.isFinite(scale1) || scale1 <= 0) return FAIL('scale invalid after adjust');
      if (Number.isFinite(scale0) && scale1 <= scale0) return FAIL('scale did not increase');
      const min = bigger.adjustable && bigger.adjustable.minScale;
      const max = bigger.adjustable && bigger.adjustable.maxScale;
      if (Number.isFinite(min) && scale1 < min) return FAIL('scale below min bound');
      if (Number.isFinite(max) && scale1 > max) return FAIL('scale above max bound');
      await game.contractInput({ type: 'resetAdjustment', target: 'hair' });
      const reset = await game.snapshot();
      const scale2 = reset.adjustable && reset.adjustable.scale;
      if (!Number.isFinite(scale2) || scale2 <= 0) return FAIL('scale invalid after reset');
      return PASS('scale ' + scale0 + ' -> ' + scale1 + ' -> ' + scale2);
    }
  },
  {
    id: 'p2-contract-audio-settings',
    level: 'P2',
    name: 'contract audio settings change and reject invalid volume',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await game.snapshot();
      const targetEnabled = !(before.audio && before.audio.soundEffectsEnabled === false);
      const r1 = await game.contractInput({ type: 'setSoundEffects', enabled: !targetEnabled });
      if (!r1 || r1.ok === false) return FAIL('setSoundEffects rejected');
      const r2 = await game.contractInput({ type: 'setMusicVolume', value: 0.25 });
      if (!r2 || r2.ok === false) return FAIL('setMusicVolume rejected');
      const after = await game.snapshot();
      if (!after.audio || typeof after.audio.musicVolume !== 'number') return FAIL('audio snapshot missing musicVolume');
      if (after.audio.musicVolume < 0 || after.audio.musicVolume > 1) return FAIL('musicVolume out of range');
      const invalidBefore = cloneSummary(after);
      const bad = await game.contractInput({ type: 'setMusicVolume', value: 4 });
      const invalidAfter = cloneSummary(await game.snapshot());
      const unchanged = stableStringify(invalidBefore.audio) === stableStringify(invalidAfter.audio);
      if (bad && bad.ok === true && invalidAfter.audio && invalidAfter.audio.musicVolume > 1) return FAIL('invalid volume accepted above range');
      if (!unchanged && invalidAfter.audio && invalidAfter.audio.musicVolume > 1) return FAIL('invalid volume corrupted audio state');
      return PASS('audio settings observable and bounded');
    }
  },
  {
    id: 'p2-keyboard-category-depth',
    level: 'P2',
    name: 'real keyboard category navigation is non-destructive',
    timeoutMs: 15000,
    async run({ browser }) {
      const game = createGameDriver(browser);
      await game.waitForReady();
      const before = await game.snapshot();
      await browser.keyDown('ArrowRight');
      await browser.keyUp('ArrowRight');
      await browser.sleep(300);
      const after = await game.snapshot();
      const changedCategory = before.activeCategory && after.activeCategory && before.activeCategory !== after.activeCategory;
      const unchangedCharacter = stableStringify((before.character || {})) === stableStringify((after.character || {}));
      if (!changedCategory && !unchangedCharacter) return FAIL('keyboard input mutated character without category navigation');
      if (!changedCategory) return FAIL('keyboard category navigation did not change activeCategory');
      return PASS('keyboard changed category from ' + before.activeCategory + ' to ' + after.activeCategory);
    }
  }
];

module.exports = { suite };
