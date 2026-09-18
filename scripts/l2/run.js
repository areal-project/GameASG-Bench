#!/usr/bin/env node
/**
 * L2 Runtime Check — 通用 CDP 客户端
 * 通过 CDP（WebSocket）驱动 headless Chrome，跑 checks.js 测试套件，输出报告。
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { summarizeResults } = require('./result_summary');

if (typeof globalThis.WebSocket === 'undefined') {
  try {
    globalThis.WebSocket = require('ws');
  } catch (wsError) {
    try {
      globalThis.WebSocket = require('undici').WebSocket;
    } catch (undiciError) {
      throw new Error('WebSocket is not available; install ws or use Node 22+');
    }
  }
}

function parseArgs() {
  const args = {
    url: null,
    cdpPort: null,
    duration: 30,
    output: null,
    jsonOnly: false,
    role: 'original',
    checks: process.env.L2_CHECKS || path.join(__dirname, 'checks.js')
  };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') args.url = argv[++i];
    else if (a === '--cdp-port') args.cdpPort = parseInt(argv[++i], 10);
    else if (a === '--duration') args.duration = parseInt(argv[++i], 10);
    else if (a === '--checks') args.checks = argv[++i];
    else if (a === '-o' || a === '--output') args.output = argv[++i];
    else if (a === '--json') args.jsonOnly = true;
    else if (a === '--role') args.role = argv[++i] || 'original';
  }
  if (!args.url || !args.cdpPort || !args.checks) {
    console.error('run.js requires --url, --cdp-port, and --checks (called by run.sh)');
    process.exit(2);
  }
  args.checks = path.resolve(args.checks);
  if (!fs.existsSync(args.checks)) {
    console.error(`checks file not found: ${args.checks}`);
    process.exit(2);
  }
  return args;
}

class CDPClient {
  constructor(port) {
    this.port = port; this.msgId = 0;
    this.timeoutMs = Math.max(1000, Number(process.env.L2_CDP_TIMEOUT_MS || 5000));
    this.ws = null; this.pending = new Map();
    this.eventHandlers = new Map();
    this.targetId = null;
    this.closed = false;
  }
  async connect() {
    const page = JSON.parse(await this._http(`http://localhost:${this.port}/json/new?about:blank`, 'PUT'));
    this.targetId = page.id;
    this.ws = new WebSocket(page.webSocketDebuggerUrl);
    this.ws.addEventListener('close', () => this.disconnect());
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', e => this._onMessage(e.data));
  }
  _http(url, method = 'GET') {
    return new Promise((resolve, reject) => {
      const req = http.request(url, { method }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('error', reject);
        res.on('end', () => {
          if (res.statusCode !== 200) reject(new Error(`CDP HTTP ${res.statusCode}: ${body}`));
          else resolve(body);
        });
      }).on('error', reject);
      req.setTimeout(this.timeoutMs, () => req.destroy(new Error('CDP HTTP timeout')));
      req.end();
    });
  }
  _onMessage(data) {
    const msg = JSON.parse(data);
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const p = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.error) p.reject(new Error(`CDP error: ${msg.error.message}`));
      else p.resolve(msg.result);
    } else if (msg.method) {
      const handlers = this.eventHandlers.get(msg.method) || [];
      for (const h of handlers) try { h(msg.params); } catch (_) {}
    }
  }
  send(method, params = {}) {
    if (this.closed || this.ws?.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('CDP connection closed'));
    }
    const id = ++this.msgId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e);
      }
    });
  }
  on(event, handler) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, []);
    this.eventHandlers.get(event).push(handler);
  }
  disconnect() {
    this.closed = true;
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error('CDP connection closed'));
    }
    this.pending.clear();
    this.eventHandlers.clear();
    this.ws?.close();
  }
  async close() {
    this.disconnect();
    if (this.targetId) {
      await this._http(`http://localhost:${this.port}/json/close/${this.targetId}`);
      this.targetId = null;
    }
  }
}

class BrowserContext {
  constructor(cdp) {
    this.cdp = cdp;
    this.consoleErrors = [];
    this.exceptions = [];
  }
  async init() {
    await this.cdp.send('Page.enable');
    await this.cdp.send('Runtime.enable');
    await this.cdp.send('Network.enable');
    this.cdp.on('Runtime.consoleAPICalled', p => {
      if (p.type === 'error' || p.type === 'warning') {
        const text = (p.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        this.consoleErrors.push({ type: p.type, text, ts: Date.now() });
      }
    });
    this.cdp.on('Runtime.exceptionThrown', p => {
      this.exceptions.push({
        text: p.exceptionDetails?.text || '',
        description: p.exceptionDetails?.exception?.description || '',
        ts: Date.now()
      });
    });
    const hookSrc = fs.readFileSync(path.join(__dirname, 'hook.js'), 'utf-8');
    await this.cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: hookSrc });
  }
  async goto(url) {
    let loaded = false;
    this.cdp.on('Page.loadEventFired', () => { loaded = true; });
    await this.cdp.send('Page.navigate', { url });
    const deadline = Date.now() + 8000;
    while (!loaded && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  async eval(expr) {
    const r = await this.cdp.send('Runtime.evaluate', {
      expression: `(function(){ try { var __r=(${expr}); return (typeof window.__l2!=='undefined'&&window.__l2.__u)?window.__l2.__u(__r):__r; } catch(e){ return {__l2_err__: e.message}; } })()`,
      returnByValue: true,
      awaitPromise: true
    });
    if (r.exceptionDetails) return { __l2_err__: r.exceptionDetails.text };
    return r.result?.value;
  }
  async sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  async keyDown(key) {
    const codeMap = { KeyW: 'KeyW', KeyA: 'KeyA', KeyS: 'KeyS', KeyD: 'KeyD',
      KeyE: 'KeyE', KeyQ: 'KeyQ', KeyR: 'KeyR', KeyF: 'KeyF',
      KeyV: 'KeyV', KeyX: 'KeyX', KeyZ: 'KeyZ', KeyC: 'KeyC',
      ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
      Space: 'Space', Escape: 'Escape', Enter: 'Enter', ShiftLeft: 'ShiftLeft', ControlLeft: 'ControlLeft',
      Tab: 'Tab', Backquote: 'Backquote', Digit1: 'Digit1', Digit2: 'Digit2', Digit3: 'Digit3' };
    const keyName = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
      KeyE: 'e', KeyQ: 'q', KeyR: 'r', KeyF: 'f',
      KeyV: 'v', KeyX: 'x', KeyZ: 'z', KeyC: 'c',
      ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
      Space: ' ', Escape: 'Escape', Enter: 'Enter', ShiftLeft: 'Shift', ControlLeft: 'Control',
      Tab: 'Tab', Backquote: '`', Digit1: '1', Digit2: '2', Digit3: '3' };
    await this.cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', code: codeMap[key] || key, key: keyName[key] || key });
  }
  async keyUp(key) {
    const codeMap = { KeyW: 'KeyW', KeyA: 'KeyA', KeyS: 'KeyS', KeyD: 'KeyD',
      KeyE: 'KeyE', KeyQ: 'KeyQ', KeyR: 'KeyR', KeyF: 'KeyF',
      KeyV: 'KeyV', KeyX: 'KeyX', KeyZ: 'KeyZ', KeyC: 'KeyC',
      ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
      Space: 'Space', Escape: 'Escape', Enter: 'Enter', ShiftLeft: 'ShiftLeft', ControlLeft: 'ControlLeft',
      Tab: 'Tab', Backquote: 'Backquote', Digit1: 'Digit1', Digit2: 'Digit2', Digit3: 'Digit3' };
    const keyName = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
      KeyE: 'e', KeyQ: 'q', KeyR: 'r', KeyF: 'f',
      KeyV: 'v', KeyX: 'x', KeyZ: 'z', KeyC: 'c',
      ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
      Space: ' ', Escape: 'Escape', Enter: 'Enter', ShiftLeft: 'Shift', ControlLeft: 'Control',
      Tab: 'Tab', Backquote: '`', Digit1: '1', Digit2: '2', Digit3: '3' };
    await this.cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', code: codeMap[key] || key, key: keyName[key] || key });
  }
  async holdKey(key, ms) {
    await this.keyDown(key);
    await this.sleep(ms);
    await this.keyUp(key);
  }
  async mouseMove(x, y, dx = 0, dy = 0) {
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers: 0, movementX: dx, movementY: dy });
  }
  async mouseClick(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error('mouseClick requires semantic runtime coordinates');
    }
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, modifiers: 0 });
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1, modifiers: 0 });
    await this.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1, modifiers: 0 });
  }
  async getCanvasSize() {
    return await this.eval(`
      (function() {
        const all = document.querySelectorAll('canvas');
        if (!all || all.length === 0) return null;
        let best = null, bestArea = -1;
        for (const c of all) {
          const area = (c.width || 0) * (c.height || 0);
          if (area > bestArea) { bestArea = area; best = c; }
        }
        if (!best) return null;
        return { width: best.width || 0, height: best.height || 0, cssW: best.clientWidth || 0, cssH: best.clientHeight || 0, id: best.id || '(no-id)', total_canvas_count: all.length };
      })()
    `);
  }
  async canvasPixelHash() {
    try {
      const r = await this.cdp.send('Page.captureScreenshot', { format: 'png', quality: 50 });
      if (r && r.data) {
        let h = 5381;
        const s = r.data;
        const start = Math.floor(s.length / 4);
        const end = Math.floor(s.length * 3 / 4);
        for (let i = start; i < end; i += 7) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
        return h;
      }
    } catch (_) {}
    return null;
  }
}

async function main() {
  const args = parseArgs();
  const checks = require(args.checks);
  if (!checks || !Array.isArray(checks.suite)) {
    throw new Error(`checks module must export a suite array: ${args.checks}`);
  }

  const results = [];
  const consoleErrors = [];
  const exceptions = [];
  let rafErrors = 0;
  const runtimeProbeErrors = [];

  // Group checks by level for display
  const levelOrder = ['P0', 'P1', 'P2'];
  const levelNames = { P0: 'P0 — 基础运行', P1: 'P1 — 核心功能', P2: 'P2 — 扩展系统' };
  let currentLevel = null;

  for (const check of checks.suite) {
    if (!args.jsonOnly && check.level !== currentLevel) {
      currentLevel = check.level;
      const name = levelNames[currentLevel] || currentLevel;
      process.stderr.write(`\n━━━ ${name} ━━━\n`);
    }
    const t0 = Date.now();
    const cdp = new CDPClient(args.cdpPort);
    const browser = new BrowserContext(cdp);
    // Never give a previous check access to a later check's page or context.
    const ctx = { browser, args, results: results.slice(), shared: {},
      log: (...m) => !args.jsonOnly && process.stderr.write(m.join(' ') + '\n') };
    let res;
    let autoReset = { ok: false, mode: 'new-page' };
    let timer;
    try {
      await cdp.connect();
      await browser.init();
      await browser.goto(args.url);
      await browser.sleep(2000);
      autoReset = { ok: true, mode: 'new-page' };
      ctx.shared.lastAutoReset = autoReset;
      try {
        res = await Promise.race([
          check.run(ctx),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('check timeout')), check.timeoutMs || 30000);
          })
        ]);
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      res = { status: 'FAIL', detail: `exception: ${e.message}` };
    } finally {
      // Read page-local diagnostics before destroying this check's page.
      try {
        const state = await browser.eval(`({
          raf_errors: Number(window.__l2 && window.__l2._rafErrCount || 0)
        })`);
        if (!state || state.__l2_err__) throw new Error(state?.__l2_err__ || 'missing runtime state');
        rafErrors += Number(state.raf_errors) || 0;
      } catch (e) {
        runtimeProbeErrors.push(`${check.id}: ${e.message}`);
      } finally {
        // A cleanup failure aborts the suite instead of running on an unclosed page.
        await cdp.close();
      }
      consoleErrors.push(...browser.consoleErrors);
      exceptions.push(...browser.exceptions);
    }
    res.id = check.id; res.level = check.level; res.name = check.name;
    res.auto_reset = autoReset;
    res.elapsed_ms = Date.now() - t0;
    results.push(res);
    if (!args.jsonOnly) {
      const icon = { PASS: '✓', FAIL: '✗', NOT_APPLICABLE: 'ℹ' }[res.status] || '?';
      const detail = res.detail ? `   (${res.detail})` : '';
      process.stderr.write(`  ${icon} ${check.name}${detail}\n`);
    }
  }

  const aggregation = summarizeResults(results, levelOrder);
  const summary = aggregation.summary;
  summary.console_errors = consoleErrors.length;
  summary.exceptions = exceptions.length;
  summary.raf_errors = rafErrors;
  summary.checks_pass = aggregation.allGreen;
  summary.runtime_probe_error = runtimeProbeErrors.length ? runtimeProbeErrors.join('; ') : null;
  summary.runtime_pass = exceptions.length === 0 && rafErrors === 0 && runtimeProbeErrors.length === 0;

  const total_pass = aggregation.totalPass;
  const total_count = aggregation.applicableCount;
  const all_green = aggregation.allGreen && summary.runtime_pass;
  const report = {
    url: args.url, duration_seconds: args.duration, role: args.role,
    runner: {
      source: 'scripts/l2/run.js',
      checks_file: path.basename(args.checks),
      auto_reset: true,
      reset_mode: 'new-page'
    },
    checks: results, summary,
    console_errors: consoleErrors.slice(0, 20),
    exceptions: exceptions.slice(0, 20),
    pass: all_green
  };

  if (args.output) fs.writeFileSync(path.resolve(args.output), JSON.stringify(report, null, 2));
  if (args.jsonOnly) process.stdout.write(JSON.stringify(report, null, 2));
  else {
    process.stderr.write('\n━━━ 总结 ━━━\n');
    for (const lvl of levelOrder) {
      const key = lvl.toLowerCase();
      const p = summary[`${key}_pass`];
      const t = summary[`${key}_total`];
      const configured = summary[`${key}_configured_total`];
      const notApplicable = summary[`${key}_not_applicable`];
      if (configured > 0) {
        process.stderr.write(`  ${lvl}: ${p}/${t} applicable`);
        if (notApplicable > 0) process.stderr.write(` (${notApplicable} not applicable)`);
        process.stderr.write('\n');
      }
    }
    process.stderr.write(`  Overall: ${total_pass}/${total_count} applicable`);
    if (aggregation.notApplicable > 0) {
      process.stderr.write(` (${aggregation.notApplicable} not applicable)`);
    }
    process.stderr.write('\n');
    process.stderr.write(`  Runtime: ${summary.runtime_pass ? 'PASS' : 'FAIL'} ` +
      `(${summary.exceptions} exceptions, ${summary.raf_errors} RAF errors)\n`);
    process.stderr.write(`\n  EXIT: ${all_green ? 0 : 1} ${all_green ? '(L2 PASS)' : '(L2 FAIL)'}\n`);
  }
  process.exit(all_green ? 0 : 1);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(2);
});
