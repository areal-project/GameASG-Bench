#!/usr/bin/env node
/**
 * undef_check.js — 轻量级未定义引用检测
 *
 * 用 acorn 解析 JS，收集声明 vs 引用，输出未定义的标识符。
 *
 * Usage:
 *   node undef_check.js <file.js> [--json]
 *   echo "code" | node undef_check.js --stdin [--json]
 *
 * Exit code: 0 = no undef, 1 = has undef, 2 = parse error
 */

const { parse } = require('acorn');
const walk = require('acorn-walk');
const fs = require('fs');

// Browser globals that are always available
const BROWSER_GLOBALS = new Set([
  // Window
  'window', 'self', 'globalThis', 'top', 'parent', 'frames',
  // DOM
  'document', 'navigator', 'location', 'history', 'screen',
  'localStorage', 'sessionStorage', 'indexedDB',
  // Timers
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
  // Console
  'console', 'alert', 'confirm', 'prompt',
  // Fetch/Network
  'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
  'URL', 'URLSearchParams', 'Headers', 'Request', 'Response',
  // Events
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'TouchEvent',
  'PointerEvent', 'WheelEvent', 'InputEvent', 'FocusEvent',
  'addEventListener', 'removeEventListener', 'dispatchEvent',
  // DOM APIs
  'Element', 'HTMLElement', 'Node', 'NodeList', 'DocumentFragment',
  'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'getComputedStyle', 'matchMedia',
  // Canvas/Graphics
  'CanvasRenderingContext2D', 'WebGLRenderingContext', 'WebGL2RenderingContext',
  'ImageData', 'Path2D', 'OffscreenCanvas',
  // Media
  'Audio', 'Image', 'AudioContext', 'webkitAudioContext',
  'MediaSource', 'MediaStream', 'HTMLAudioElement', 'HTMLVideoElement',
  // Data
  'ArrayBuffer', 'DataView', 'Blob', 'File', 'FileReader',
  'FormData', 'TextEncoder', 'TextDecoder',
  'Int8Array', 'Uint8Array', 'Uint8ClampedArray',
  'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array',
  'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
  // Typed
  'Map', 'Set', 'WeakMap', 'WeakSet', 'WeakRef',
  'Promise', 'Proxy', 'Reflect', 'Symbol', 'BigInt',
  // Built-in
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Function',
  'RegExp', 'Date', 'Error', 'TypeError', 'RangeError', 'SyntaxError',
  'ReferenceError', 'EvalError', 'URIError',
  'JSON', 'Math', 'Intl', 'NaN', 'Infinity', 'undefined',
  'isNaN', 'isFinite', 'parseInt', 'parseFloat',
  'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
  'eval', 'arguments', 'this',
  // Crypto
  'crypto', 'Crypto', 'CryptoKey', 'SubtleCrypto',
  // Workers
  'Worker', 'SharedWorker', 'ServiceWorker',
  // Performance
  'performance', 'Performance', 'PerformanceObserver',
  // Misc
  'structuredClone', 'atob', 'btoa', 'queueMicrotask',
  'reportError', 'AbortController', 'AbortSignal',
  'DOMParser', 'XMLSerializer',
  // Gamedev common
  'devicePixelRatio', 'innerWidth', 'innerHeight',
  'pageXOffset', 'pageYOffset', 'scrollX', 'scrollY',
  'open', 'close', 'print', 'focus', 'blur',
  'postMessage', 'onmessage',
]);

// Astrocade shim globals
const ASTROCADE_GLOBALS = new Set(['lib', 'run']);

function collectDeclarations(ast) {
  const declared = new Set();

  walk.ancestor(ast, {
    VariableDeclarator(node) {
      if (node.id && node.id.type === 'Identifier') {
        declared.add(node.id.name);
      } else if (node.id && node.id.type === 'ObjectPattern') {
        extractPatternNames(node.id, declared);
      } else if (node.id && node.id.type === 'ArrayPattern') {
        extractPatternNames(node.id, declared);
      }
    },
    FunctionDeclaration(node) {
      if (node.id) declared.add(node.id.name);
    },
    ClassDeclaration(node) {
      if (node.id) declared.add(node.id.name);
    },
    ImportDeclaration(node) {
      for (const spec of node.specifiers || []) {
        if (spec.local) declared.add(spec.local.name);
      }
    },
  });

  // Also collect function params and local vars via full walk
  walk.simple(ast, {
    FunctionDeclaration(node) { collectParams(node, declared); },
    FunctionExpression(node) { collectParams(node, declared); },
    ArrowFunctionExpression(node) { collectParams(node, declared); },
    CatchClause(node) {
      if (node.param && node.param.type === 'Identifier') {
        declared.add(node.param.name);
      }
    },
  });

  return declared;
}

function collectParams(funcNode, declared) {
  for (const param of funcNode.params || []) {
    extractPatternNames(param, declared);
  }
  if (funcNode.id && funcNode.id.type === 'Identifier') {
    declared.add(funcNode.id.name);
  }
}

function extractPatternNames(pattern, declared) {
  if (!pattern) return;
  if (pattern.type === 'Identifier') {
    declared.add(pattern.name);
  } else if (pattern.type === 'ObjectPattern') {
    for (const prop of pattern.properties || []) {
      extractPatternNames(prop.value || prop.argument, declared);
    }
  } else if (pattern.type === 'ArrayPattern') {
    for (const el of pattern.elements || []) {
      if (el) extractPatternNames(el, declared);
    }
  } else if (pattern.type === 'RestElement') {
    extractPatternNames(pattern.argument, declared);
  } else if (pattern.type === 'AssignmentPattern') {
    extractPatternNames(pattern.left, declared);
  }
}

function collectReferences(ast) {
  const refs = []; // {name, line, col}

  walk.ancestor(ast, {
    Identifier(node, ancestors) {
      const parent = ancestors[ancestors.length - 2];
      if (!parent) return;

      // Skip property access (obj.prop — prop is not a reference)
      if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;
      // Skip object keys
      if (parent.type === 'Property' && parent.key === node && !parent.computed) return;
      // Skip declarations (handled separately)
      if (parent.type === 'VariableDeclarator' && parent.id === node) return;
      if (parent.type === 'FunctionDeclaration' && parent.id === node) return;
      if (parent.type === 'ClassDeclaration' && parent.id === node) return;
      // Skip function params
      if ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression' || parent.type === 'ArrowFunctionExpression') && parent.params.includes(node)) return;
      // Skip catch param
      if (parent.type === 'CatchClause' && parent.param === node) return;
      // Skip labels
      if (parent.type === 'LabeledStatement' && parent.label === node) return;
      if (parent.type === 'BreakStatement' && parent.label === node) return;
      if (parent.type === 'ContinueStatement' && parent.label === node) return;
      // Skip import specifiers
      if (parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier') return;
      // Skip method definitions in class
      if (parent.type === 'MethodDefinition' && parent.key === node) return;

      refs.push({ name: node.name, line: node.loc ? node.loc.start.line : 0, col: node.loc ? node.loc.start.column : 0 });
    }
  });

  return refs;
}

function extractWindowGlobals(code) {
  const globals = new Set();
  const re = /window\.(\w+)\s*=/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    globals.add(m[1]);
  }
  // Also catch: window['xxx'] =
  const re2 = /window\[['"](\w+)['"]\]\s*=/g;
  while ((m = re2.exec(code)) !== null) {
    globals.add(m[1]);
  }
  return globals;
}

function checkUndef(code) {
  let ast;
  try {
    ast = parse(code, {
      ecmaVersion: 2022,
      sourceType: 'script',
      locations: true,
      allowReturnOutsideFunction: true,
      allowHashBang: true,
    });
  } catch (e) {
    return { error: `parse error: ${e.message}`, line: e.loc ? e.loc.line : 0 };
  }

  const declared = collectDeclarations(ast);
  const refs = collectReferences(ast);
  const windowGlobals = extractWindowGlobals(code);

  const allKnown = new Set([...BROWSER_GLOBALS, ...ASTROCADE_GLOBALS, ...declared, ...windowGlobals]);

  const undef = [];
  const seen = new Set();
  for (const ref of refs) {
    if (allKnown.has(ref.name)) continue;
    const key = `${ref.name}:${ref.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    undef.push(ref);
  }

  return { undef };
}

// --- Main ---
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const stdinMode = args.includes('--stdin');
  const file = args.find(a => !a.startsWith('--'));

  let code;
  if (stdinMode) {
    code = fs.readFileSync(0, 'utf-8');
  } else if (file) {
    code = fs.readFileSync(file, 'utf-8');
  } else {
    console.error('Usage: node undef_check.js <file.js> [--json]');
    process.exit(2);
  }

  const result = checkUndef(code);

  if (result.error) {
    if (jsonMode) {
      console.log(JSON.stringify({ pass: false, error: result.error, line: result.line }));
    } else {
      console.error(`PARSE ERROR (line ${result.line}): ${result.error}`);
    }
    process.exit(2);
  }

  if (jsonMode) {
    console.log(JSON.stringify({
      pass: result.undef.length === 0,
      count: result.undef.length,
      undef: result.undef.slice(0, 20),
    }));
  } else {
    if (result.undef.length === 0) {
      console.log('OK: no undefined references');
    } else {
      console.log(`FAIL: ${result.undef.length} undefined reference(s):`);
      for (const u of result.undef.slice(0, 20)) {
        console.log(`  line ${u.line}: '${u.name}' is not defined`);
      }
      if (result.undef.length > 20) {
        console.log(`  ... +${result.undef.length - 20} more`);
      }
    }
  }

  process.exit(result.undef.length === 0 ? 0 : 1);
}

main();
