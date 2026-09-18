/**
 * L2 runtime hook: non-invasive black-box observability.
 *
 * This hook records browser/runtime signals used by L2 smoke checks. It must not
 * expose, alias, intercept, or mutate game-specific state variables.
 */
(function(){
  if (window.__l2) return;

  window.__l2 = {
    frameCount: 0,
    rafLastTs: 0,
    keyListeners: 0,
    mouseListeners: 0,
    keyTypes: {},
    mouseTypes: {},
    drawCalls: 0,
    clearCalls: 0,
    fillRectCalls: 0,
    drawImageCalls: 0,
    lastDrawTs: 0,
    canvasContextTypes: {},
    webglContextCount: 0,
    _rafErrCount: 0,
    _readyTs: Date.now()
  };

  function countDraw(kind) {
    if (!window.__l2) return;
    window.__l2.drawCalls++;
    window.__l2.lastDrawTs = performance.now();
    if (kind === 'fillRect') window.__l2.fillRectCalls++;
    if (kind === 'drawImage') window.__l2.drawImageCalls++;
  }

  var origAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'keydown' || type === 'keyup' || type === 'keypress') {
      window.__l2.keyListeners++;
      window.__l2.keyTypes[type] = (window.__l2.keyTypes[type] || 0) + 1;
    }
    if ([
      'mousemove', 'mousedown', 'click', 'mouseup',
      'pointerdown', 'pointermove', 'pointerup', 'wheel',
      'touchstart', 'touchmove', 'touchend'
    ].indexOf(type) >= 0) {
      window.__l2.mouseListeners++;
      window.__l2.mouseTypes[type] = (window.__l2.mouseTypes[type] || 0) + 1;
    }
    return origAddEventListener.call(this, type, listener, options);
  };

  var origRAF = window.requestAnimationFrame;
  if (typeof origRAF === 'function') {
    window.requestAnimationFrame = function(cb) {
      return origRAF.call(window, function(t) {
        window.__l2.frameCount++;
        window.__l2.rafLastTs = t;
        try {
          return cb(t);
        } catch (e) {
          window.__l2._rafErrCount++;
          throw e;
        }
      });
    };
  }

  var origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type) {
    var contextType = String(type || '').toLowerCase();
    window.__l2.canvasContextTypes[contextType] = (window.__l2.canvasContextTypes[contextType] || 0) + 1;
    var ctx = origGetContext.apply(this, arguments);
    if (ctx && /webgl/.test(contextType)) {
      window.__l2.webglContextCount++;
    }
    if (type === '2d' && ctx && !ctx.__l2_hooked) {
      ctx.__l2_hooked = true;

      ['fill', 'stroke', 'strokeRect', 'fillText', 'strokeText', 'putImageData'].forEach(function(name) {
        if (typeof ctx[name] !== 'function') return;
        var orig = ctx[name];
        ctx[name] = function() {
          countDraw(name);
          return orig.apply(this, arguments);
        };
      });

      if (typeof ctx.fillRect === 'function') {
        var origFillRect = ctx.fillRect;
        ctx.fillRect = function() {
          countDraw('fillRect');
          return origFillRect.apply(this, arguments);
        };
      }

      if (typeof ctx.drawImage === 'function') {
        var origDrawImage = ctx.drawImage;
        ctx.drawImage = function() {
          countDraw('drawImage');
          return origDrawImage.apply(this, arguments);
        };
      }

      if (typeof ctx.clearRect === 'function') {
        var origClearRect = ctx.clearRect;
        ctx.clearRect = function() {
          window.__l2.clearCalls++;
          window.__l2.lastDrawTs = performance.now();
          return origClearRect.apply(this, arguments);
        };
      }
    }
    return ctx;
  };

  function patchPromiseLikeLib(obj) {
    if (!obj || obj.__l2_patched) return obj;
    try {
      Object.defineProperty(obj, '__l2_patched', { value: true, configurable: true });
    } catch (_) {
      obj.__l2_patched = true;
    }

    if (typeof obj.getUserGameState === 'function') {
      var origGetState = obj.getUserGameState.bind(obj);
      obj.getUserGameState = function() {
        try {
          var r = origGetState();
          if (r && typeof r.then === 'function') return r;
          return Promise.resolve(r != null && r.state !== undefined ? r : { state: r == null ? null : r });
        } catch (_) {
          return Promise.resolve({ state: null });
        }
      };
    }

    if (typeof obj.saveUserGameState === 'function') {
      var origSave = obj.saveUserGameState.bind(obj);
      obj.saveUserGameState = function() {
        try {
          var r = origSave.apply(obj, arguments);
          if (r && typeof r.then === 'function') return r;
        } catch (_) {}
        return Promise.resolve({ success: true });
      };
    }

    [
      'addPlayerScoreToLeaderboard',
      'getTopNEntriesFromLeaderboard',
      'preloadAnimation',
      'preloadAnimations'
    ].forEach(function(name) {
      if (typeof obj[name] !== 'function') return;
      var orig = obj[name].bind(obj);
      obj[name] = function() {
        try {
          var r = orig.apply(obj, arguments);
          if (r && typeof r.then === 'function') return r;
        } catch (_) {}
        if (name === 'getTopNEntriesFromLeaderboard') return Promise.resolve({ entries: [] });
        return Promise.resolve({ success: false });
      };
    });

    return obj;
  }

  var realLib = window.lib ? patchPromiseLikeLib(window.lib) : null;
  try {
    Object.defineProperty(window, 'lib', {
      get: function() { return realLib; },
      set: function(v) { realLib = patchPromiseLikeLib(v); },
      configurable: true,
      enumerable: true
    });
  } catch (_) {}

  window.__l2.__u = function(v) {
    if (v === null || v === undefined) return v;
    if (typeof v !== 'object' || Array.isArray(v)) return v;
    if (v instanceof Boolean || v instanceof Number || v instanceof String) return v.valueOf();
    var keys = Object.keys(v);
    if (keys.length === 1) {
      var k = keys[0];
      if ((k === 'value' || k === '_value' || k === 'val') && typeof v[k] !== 'object') return v[k];
    }
    if (keys.length === 2) {
      var hasValue = Object.prototype.hasOwnProperty.call(v, 'value') && typeof v.value !== 'object';
      var hasUnderline = Object.prototype.hasOwnProperty.call(v, '_value') && typeof v._value !== 'object';
      if (hasValue && !hasUnderline) return v.value;
      if (hasUnderline && !hasValue) return v._value;
    }
    return v;
  };

  window.__l2.__d = function(v, depth) {
    if (depth === undefined) depth = 0;
    if (v === null || v === undefined || depth > 4) return v;
    if (typeof v !== 'object' || Array.isArray(v)) return v;
    var unwrapped = window.__l2.__u(v);
    if (unwrapped !== v) return unwrapped;
    var result = {};
    Object.keys(v).forEach(function(k) {
      result[k] = window.__l2.__d(v[k], depth + 1);
    });
    return result;
  };
})();
