#!/usr/bin/env node
/**
 * JavaScript Debugger Agent V2 (Merged Version)
 *
 * Python/Java 시뮬레이터와 동일한 포맷으로 실행 스냅샷 생성
 * - vm 모듈 기반 안전한 샌드박스 실행
 * - 라인별 실행 상태 캡처 (Python sys.settrace 스타일)
 * - stdout 캡처
 * - 콜스택 추적 (함수 호출 추적)
 * - 비동기 시뮬레이션 (setTimeout/setInterval)
 *
 * Output format (one JSON per line):
 * {
 *   "line": int,
 *   "event": "STEP" | "ERROR",
 *   "stack": [{ "methodName": str, "className": str, "variables": {} }],
 *   "heap": [{ "address": str, "type": str, "content": str }],
 *   "stdout": str (optional)
 * }
 */

const vm = require('vm');
const fs = require('fs');
const acorn = require('acorn');
const walk = require('acorn-walk');

// ============================================
// 상수
// ============================================

const MAX_STEPS = 1000;
const EXECUTION_TIMEOUT = 10000; // 10초
const MAX_HEAP_DEPTH = 3;
const MAX_ARRAY_DISPLAY = 5;
const MAX_OBJECT_PROPS = 5;
const MAX_STRING_LENGTH = 50;

// ============================================
// AST 헬퍼 함수
// ============================================

function isInsideClassBody(ancestors) {
  for (let i = ancestors.length - 2; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type === 'ClassBody') return true;
    if (a.type === 'FunctionExpression' || a.type === 'FunctionDeclaration' ||
        a.type === 'ArrowFunctionExpression') return false;
  }
  return false;
}

function isForLoopInit(node, ancestors) {
  const parent = ancestors[ancestors.length - 2];
  if (!parent) return false;
  if (parent.type === 'ForStatement' && parent.init === node) return true;
  if (parent.type === 'ForInStatement' && parent.left === node) return true;
  if (parent.type === 'ForOfStatement' && parent.left === node) return true;
  return false;
}

function getFunctionName(node) {
  if (node.id && node.id.name) return node.id.name;
  return 'anonymous';
}

// ============================================
// DebuggerAgent 클래스
// ============================================

class DebuggerAgent {
  constructor() {
    this.objectIdMap = new WeakMap();
    this.stringIdMap = new Map();
    this.objectIdCounter = 1;
    this.heapObjects = [];
    this.snapshots = [];
    this.stdoutBuffer = [];
    this.callStack = [{ name: '__main__', variables: {} }]; // 함수 콜스택 추적
    this.stepCount = 0;
  }

  /**
   * 객체의 고유 주소(ID) 생성
   */
  getHexAddress(obj) {
    if (typeof obj === 'string') {
      if (this.stringIdMap.has(obj)) {
        return this.stringIdMap.get(obj);
      }
      const address = `@${this.objectIdCounter++}`;
      this.stringIdMap.set(obj, address);
      return address;
    }

    if (this.objectIdMap.has(obj)) {
      return this.objectIdMap.get(obj);
    }
    const address = `@${this.objectIdCounter++}`;
    this.objectIdMap.set(obj, address);
    return address;
  }

  /**
   * 실행 상태 캡처
   */
  capture(lineNumber, contextVariables, functionName = null) {
    if (this.stepCount >= MAX_STEPS) {
      throw new Error(`최대 실행 단계(${MAX_STEPS}회)를 초과했습니다.`);
    }
    this.stepCount++;

    // 힙 초기화
    this.heapObjects = [];
    const collected = new Set();

    // 변수 추출
    const variables = {};
    for (const [name, value] of Object.entries(contextVariables)) {
      if (this.shouldSkipVariable(name)) continue;
      variables[name] = this.parseValue(value, collected, 0);
    }

    // 현재 함수명 결정 (functionName이 주어지면 우선 사용)
    const currentFunction = functionName || this.callStack[this.callStack.length - 1]?.name || '__main__';

    // 콜스택 구성 (로컬 버전의 기능: 전체 콜스택 표시)
    const stackFrames = this.callStack.map((frame, index) => ({
      methodName: frame.name,
      className: index === 0 ? 'Main' : 'Function',
      variables: index === this.callStack.length - 1 ? variables : frame.variables,
    }));

    // 스냅샷 생성
    const snapshot = {
      line: lineNumber,
      event: 'STEP',
      stack: stackFrames,
      heap: this.heapObjects,
    };

    // stdout 버퍼가 있으면 추가
    if (this.stdoutBuffer.length > 0) {
      snapshot.stdout = this.stdoutBuffer.join('\n');
      this.stdoutBuffer = [];
    }

    // Custom replacer to handle special values (undefined, NaN, Infinity)
    console.log(JSON.stringify(snapshot, (key, value) => {
      if (value === undefined) return '@@UNDEFINED@@';
      if (typeof value === 'number') {
        if (Number.isNaN(value)) return '@@NaN@@';
        if (value === Infinity) return '@@INFINITY@@';
        if (value === -Infinity) return '@@-INFINITY@@';
      }
      return value;
    }));
  }

  /**
   * 스킵할 변수 확인
   */
  shouldSkipVariable(name) {
    // 내부 변수
    if (name.startsWith('__')) return true;

    // Node.js 내장
    if (name === 'console') return true;
    if (name === 'require') return true;
    if (name === 'module') return true;
    if (name === 'exports') return true;

    // JavaScript 내장 생성자/객체
    const builtins = [
      'Array', 'Object', 'String', 'Number', 'Boolean',
      'Math', 'Date', 'JSON', 'RegExp',
      'Map', 'Set', 'WeakMap', 'WeakSet',
      'Promise', 'Symbol',
      'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite',
      'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
      'undefined', 'NaN', 'Infinity',
      'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    ];
    if (builtins.includes(name)) return true;

    return false;
  }

  /**
   * 값 파싱 (프리미티브 vs 참조 타입)
   */
  parseValue(value, collected, depth) {
    // null
    if (value === null) return null;

    // undefined (keep as-is, will be handled by JSON replacer)
    if (value === undefined) return undefined;

    // Boolean
    if (typeof value === 'boolean') return value;

    // Special numbers (NaN, Infinity) - keep as-is for replacer
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return NaN;
      if (value === Infinity) return Infinity;
      if (value === -Infinity) return -Infinity;
      return value;
    }

    // BigInt
    if (typeof value === 'bigint') {
      return value.toString() + 'n';
    }

    // Strings -> primitive for short strings, heap reference for long ones
    if (typeof value === 'string') {
      if (value.length < 50) {
        return value;
      }
      const addr = this.addStringToHeap(value, collected);
      return { id: addr, class: 'String' };
    }

    // Array -> 힙 참조
    if (Array.isArray(value)) {
      const addr = this.addArrayToHeap(value, collected, depth);
      return { id: addr, class: 'Array' };
    }

    // Function -> 힙 참조
    if (typeof value === 'function') {
      const addr = this.addFunctionToHeap(value, collected);
      return { id: addr, class: 'Function' };
    }

    // Object -> 힙 참조
    if (typeof value === 'object') {
      const className = value.constructor?.name || 'Object';
      const addr = this.addObjectToHeap(value, collected, depth);
      return { id: addr, class: className };
    }

    return String(value);
  }

  /**
   * 문자열을 힙에 추가
   */
  addStringToHeap(value, collected) {
    const address = this.getHexAddress(value);

    if (!collected.has(address)) {
      collected.add(address);

      // 긴 문자열 자르기
      let displayValue = value;
      if (value.length > MAX_STRING_LENGTH) {
        displayValue = value.substring(0, MAX_STRING_LENGTH) + '...';
      }

      this.heapObjects.push({
        id: address,
        address: address,
        type: 'String',
        content: `"${displayValue}"`,
      });
    }

    return address;
  }

  /**
   * 배열을 힙에 추가
   */
  addArrayToHeap(value, collected, depth) {
    const address = this.getHexAddress(value);

    if (!collected.has(address)) {
      collected.add(address);

      // 깊이 제한
      let content;
      if (depth >= MAX_HEAP_DEPTH) {
        content = `Array(${value.length})`;
      } else {
        content = this.formatArrayContent(value, collected, depth);
      }

      this.heapObjects.push({
        id: address,
        address: address,
        type: 'Array',
        content: content,
        length: value.length,
      });
    }

    return address;
  }

  /**
   * 함수를 힙에 추가
   */
  addFunctionToHeap(value, collected) {
    const address = this.getHexAddress(value);
    const funcName = value.name || 'anonymous';

    if (!collected.has(address)) {
      collected.add(address);
      this.heapObjects.push({
        id: address,
        address: address,
        type: 'Function',
        content: `ƒ ${funcName}()`,
      });
    }

    return address;
  }

  /**
   * 객체를 힙에 추가
   */
  addObjectToHeap(value, collected, depth) {
    const address = this.getHexAddress(value);
    const className = value.constructor?.name || 'Object';

    if (!collected.has(address)) {
      collected.add(address);

      // 깊이 제한
      let content;
      if (depth >= MAX_HEAP_DEPTH) {
        content = `${className}{...}`;
      } else {
        content = this.formatObjectContent(value, collected, depth);
      }

      this.heapObjects.push({
        id: address,
        address: address,
        type: className,
        content: content,
      });
    }

    return address;
  }

  /**
   * 배열 내용 포맷팅
   */
  formatArrayContent(arr, collected, depth) {
    if (arr.length === 0) return '[]';

    const items = [];
    const limit = Math.min(arr.length, MAX_ARRAY_DISPLAY);

    for (let i = 0; i < limit; i++) {
      items.push(this.formatValueShort(arr[i], collected, depth + 1));
    }

    if (arr.length > limit) {
      items.push(`... +${arr.length - limit}`);
    }

    return `[${items.join(', ')}]`;
  }

  /**
   * 객체 내용 포맷팅
   */
  formatObjectContent(obj, collected, depth) {
    const className = obj.constructor?.name || 'Object';
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return `${className}{}`;
    }

    const items = [];
    const limit = Math.min(keys.length, MAX_OBJECT_PROPS);

    for (let i = 0; i < limit; i++) {
      const key = keys[i];
      const val = this.formatValueShort(obj[key], collected, depth + 1);
      items.push(`${key}: ${val}`);
    }

    if (keys.length > limit) {
      items.push(`... +${keys.length - limit}`);
    }

    return `{${items.join(', ')}}`;
  }

  /**
   * 짧은 값 포맷팅 (힙 내용 표시용)
   */
  formatValueShort(value, collected, depth) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return String(value);

    if (typeof value === 'string') {
      if (value.length > 25) {
        return `"${value.substring(0, 25)}..."`;
      }
      return `"${value}"`;
    }

    if (Array.isArray(value)) {
      if (depth >= MAX_HEAP_DEPTH) return `[...${value.length}]`;
      return this.addArrayToHeap(value, collected, depth);
    }

    if (typeof value === 'function') {
      return `ƒ ${value.name || 'anon'}`;
    }

    if (typeof value === 'object') {
      if (depth >= MAX_HEAP_DEPTH) return `{...}`;
      return this.addObjectToHeap(value, collected, depth);
    }

    return String(value).substring(0, 20);
  }


  /**
   * AST 기반 코드 계측 (instrumentCode + instrumentAsyncCallbacks 통합)
   */
  instrument(code) {
    const insertions = [];

    const ast = acorn.parse(code, {
      ecmaVersion: 2020,
      locations: true,
    });

    walk.ancestor(ast, {
      VariableDeclaration(node, ancestors) {
        if (isInsideClassBody(ancestors)) return;
        if (isForLoopInit(node, ancestors)) return;

        const line = node.loc.start.line;
        // let/const → var
        if (node.kind === 'let' || node.kind === 'const') {
          insertions.push({
            start: node.start,
            end: node.start + node.kind.length,
            replacement: 'var',
          });
        }
        // 초기화 없는 선언에 = undefined 추가
        for (const decl of node.declarations) {
          if (!decl.init) {
            insertions.push({
              start: decl.end,
              end: decl.end,
              replacement: ' = undefined',
            });
          }
        }
        // __capture__ 삽입
        insertions.push({
          start: node.end,
          end: node.end,
          replacement: ` __capture__(${line});`,
        });
      },

      FunctionDeclaration(node, ancestors) {
        if (isInsideClassBody(ancestors)) return;
        const line = node.loc.start.line;
        const name = getFunctionName(node);
        // 선언 전 캡처
        insertions.push({
          start: node.start,
          end: node.start,
          replacement: `__capture__(${line}); `,
        });
        // body 시작에 enterFunction
        const bodyStart = node.body.start + 1; // { 다음
        insertions.push({
          start: bodyStart,
          end: bodyStart,
          replacement: ` __enterFunction__('${name}');`,
        });
        // body 끝에 exitFunction (return 없이 끝나는 경우)
        const bodyEnd = node.body.end - 1; // } 앞
        insertions.push({
          start: bodyEnd,
          end: bodyEnd,
          replacement: ` __exitFunction__();`,
        });
      },

      ReturnStatement(node, ancestors) {
        const line = node.loc.start.line;
        if (node.argument) {
          // Split into prefix + suffix to avoid overlapping with inner insertions
          insertions.push({
            start: node.start,
            end: node.argument.start,
            replacement: '{ var __retval__ = (',
          });
          insertions.push({
            start: node.argument.end,
            end: node.end,
            replacement: `); __capture__(${line}); __exitFunction__(); return __retval__; }`,
          });
        } else {
          insertions.push({
            start: node.start,
            end: node.end,
            replacement: `{ __capture__(${line}); __exitFunction__(); return; }`,
          });
        }
      },

      ExpressionStatement(node, ancestors) {
        if (isInsideClassBody(ancestors)) return;
        const line = node.loc.start.line;
        insertions.push({
          start: node.end,
          end: node.end,
          replacement: ` __capture__(${line});`,
        });
      },

      ClassDeclaration(node, ancestors) {
        const line = node.loc.start.line;
        const name = node.id ? node.id.name : 'AnonymousClass';
        // class Foo {} → var Foo = (class Foo {}); __capture__()
        insertions.push({
          start: node.start,
          end: node.start,
          replacement: `var ${name} = (`,
        });
        insertions.push({
          start: node.end,
          end: node.end,
          replacement: `); __capture__(${line});`,
        });
      },

      MethodDefinition(node, ancestors) {
        if (node.kind === 'constructor' || node.kind === 'method') {
          const funcName = node.key && node.key.name ? node.key.name : 'method';
          const body = node.value.body; // BlockStatement
          if (body) {
            const bodyStart = body.start + 1;
            insertions.push({
              start: bodyStart,
              end: bodyStart,
              replacement: ` __enterFunction__('${funcName}');`,
            });
            const bodyEnd = body.end - 1;
            insertions.push({
              start: bodyEnd,
              end: bodyEnd,
              replacement: ` __exitFunction__();`,
            });
          }
        }
      },

      IfStatement(node, ancestors) {
        const line = node.loc.start.line;
        // consequent block
        if (node.consequent && node.consequent.type === 'BlockStatement') {
          insertions.push({
            start: node.consequent.start + 1,
            end: node.consequent.start + 1,
            replacement: ` __capture__(${line});`,
          });
        }
        // alternate block (else)
        if (node.alternate && node.alternate.type === 'BlockStatement') {
          const altLine = node.alternate.loc.start.line;
          insertions.push({
            start: node.alternate.start + 1,
            end: node.alternate.start + 1,
            replacement: ` __capture__(${altLine});`,
          });
        }
      },

      ForStatement(node, ancestors) {
        const line = node.loc.start.line;
        if (node.body && node.body.type === 'BlockStatement') {
          insertions.push({
            start: node.body.start + 1,
            end: node.body.start + 1,
            replacement: ` __capture__(${line});`,
          });
        }
      },

      WhileStatement(node, ancestors) {
        const line = node.loc.start.line;
        if (node.body && node.body.type === 'BlockStatement') {
          insertions.push({
            start: node.body.start + 1,
            end: node.body.start + 1,
            replacement: ` __capture__(${line});`,
          });
        }
      },

      DoWhileStatement(node, ancestors) {
        const line = node.loc.start.line;
        if (node.body && node.body.type === 'BlockStatement') {
          insertions.push({
            start: node.body.start + 1,
            end: node.body.start + 1,
            replacement: ` __capture__(${line});`,
          });
        }
      },

      ForInStatement(node, ancestors) {
        const line = node.loc.start.line;
        if (node.body && node.body.type === 'BlockStatement') {
          insertions.push({
            start: node.body.start + 1,
            end: node.body.start + 1,
            replacement: ` __capture__(${line});`,
          });
        }
      },

      ForOfStatement(node, ancestors) {
        const line = node.loc.start.line;
        if (node.body && node.body.type === 'BlockStatement') {
          insertions.push({
            start: node.body.start + 1,
            end: node.body.start + 1,
            replacement: ` __capture__(${line});`,
          });
        }
      },

      SwitchStatement(node, ancestors) {
        for (const switchCase of node.cases) {
          if (switchCase.consequent.length > 0) {
            const caseLine = switchCase.loc.start.line;
            const firstStmt = switchCase.consequent[0];
            insertions.push({
              start: firstStmt.start,
              end: firstStmt.start,
              replacement: `__capture__(${caseLine}); `,
            });
          }
        }
      },

      TryStatement(node, ancestors) {
        // try block
        if (node.block) {
          const tryLine = node.loc.start.line;
          insertions.push({
            start: node.block.start + 1,
            end: node.block.start + 1,
            replacement: ` __capture__(${tryLine});`,
          });
        }
        // catch block
        if (node.handler && node.handler.body) {
          const catchLine = node.handler.loc.start.line;
          insertions.push({
            start: node.handler.body.start + 1,
            end: node.handler.body.start + 1,
            replacement: ` __capture__(${catchLine});`,
          });
        }
        // finally block
        if (node.finalizer) {
          const finallyLine = node.finalizer.loc.start.line;
          insertions.push({
            start: node.finalizer.start + 1,
            end: node.finalizer.start + 1,
            replacement: ` __capture__(${finallyLine});`,
          });
        }
      },

      CallExpression(node, ancestors) {
        // Promise.then() 계측
        if (
          node.callee?.type === 'MemberExpression' &&
          node.callee.property?.name === 'then'
        ) {
          const callback = node.arguments[0];
          if (callback && callback.type === 'ArrowFunctionExpression') {
            const callbackLine = callback.loc.start.line;
            if (callback.body.type === 'BlockStatement') {
              const insertPos = callback.body.end - 1;
              insertions.push({
                start: insertPos,
                end: insertPos,
                replacement: ` __captureMicrotask__(${callbackLine}); `,
              });
            } else {
              const arrowPos = code.indexOf('=>', callback.start);
              const exprStart = callback.body.start;
              const exprEnd = callback.body.end;
              insertions.push({
                start: arrowPos + 2,
                end: exprEnd,
                replacement: ` { const __result__ = ${code.substring(exprStart, exprEnd)}; __captureMicrotask__(${callbackLine}); return __result__; }`,
              });
            }
          }
        }

        // setTimeout() 계측
        if (
          node.callee?.type === 'Identifier' &&
          node.callee.name === 'setTimeout'
        ) {
          const callback = node.arguments[0];
          const delay = node.arguments[1];
          let delayValue = 0;
          if (delay && delay.type === 'Literal') {
            delayValue = delay.value;
          }
          if (callback && callback.type === 'ArrowFunctionExpression') {
            const callbackLine = callback.loc.start.line;
            if (callback.body.type === 'BlockStatement') {
              const insertPos = callback.body.end - 1;
              insertions.push({
                start: insertPos,
                end: insertPos,
                replacement: ` __captureMacrotask__(${callbackLine}, ${delayValue}); `,
              });
            } else {
              const arrowPos = code.indexOf('=>', callback.start);
              const exprStart = callback.body.start;
              const exprEnd = callback.body.end;
              insertions.push({
                start: arrowPos + 2,
                end: exprEnd,
                replacement: ` { const __result__ = ${code.substring(exprStart, exprEnd)}; __captureMacrotask__(${callbackLine}, ${delayValue}); return __result__; }`,
              });
            }
          }
        }
      },
    });

    // 역순 정렬 후 적용
    insertions.sort((a, b) => b.start - a.start);

    let result = code;
    for (const { start, end, replacement } of insertions) {
      result = result.substring(0, start) + replacement + result.substring(end);
    }
    return result;
  }

  /**
   * 값을 문자열로 변환 (console.log용)
   */
  stringify(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return `[Array(${value.length})]`;
      }
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return `[Object]`;
      }
    }
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    return String(value);
  }

  /**
   * 코드 실행 (비동기 시뮬레이션 포함)
   */
  /**
   * 코드 실행 (비동기 시뮬레이션 포함)
   */
  async run(code) {
    const agent = this;

    // AST 기반 통합 계측
    let instrumentedCode = this.instrument(code);

    // ========================================
    // 비동기 시뮬레이션을 위한 Queue 분리
    // ========================================
    const microtaskQueue = []; // Promise.then()
    const macrotaskQueue = []; // setTimeout()
    let taskIdCounter = 1;
    const cancelledTasks = new Set();

    // 샌드박스 생성
    const sandbox = {
      // 캡처 함수
      __capture__: (lineNumber) => {
        const vars = {};
        for (const key of Object.keys(sandbox)) {
          if (!agent.shouldSkipVariable(key)) {
            vars[key] = sandbox[key];
          }
        }
        agent.capture(lineNumber, vars);
      },

      // 함수 진입/종료 추적 (로컬 버전의 기능)
      __enterFunction__: (functionName) => {
        agent.callStack.push({ name: functionName, variables: {} });
      },

      __exitFunction__: () => {
        if (agent.callStack.length > 1) {
          agent.callStack.pop();
        }
      },

      // console 객체
      console: {
        log: (...args) => {
          const output = args.map(a => agent.stringify(a)).join(' ');
          agent.stdoutBuffer.push(output);
        },
        error: (...args) => {
          const output = args.map(a => agent.stringify(a)).join(' ');
          agent.stdoutBuffer.push(`[ERROR] ${output}`);
        },
        warn: (...args) => {
          const output = args.map(a => agent.stringify(a)).join(' ');
          agent.stdoutBuffer.push(`[WARN] ${output}`);
        },
        info: (...args) => {
          const output = args.map(a => agent.stringify(a)).join(' ');
          agent.stdoutBuffer.push(output);
        },
      },

      // Microtask 캡처 (Promise.then() 콜백 내부에서 호출됨)
      __captureMicrotask__: (lineNumber) => {
        const vars = {};
        for (const key of Object.keys(sandbox)) {
          if (!agent.shouldSkipVariable(key)) {
            vars[key] = sandbox[key];
          }
        }
        agent.capture(lineNumber, vars);
      },

      // Macrotask 캡처 (setTimeout() 콜백 내부에서 호출됨)
      __captureMacrotask__: (lineNumber, delay) => {
        const vars = {};
        for (const key of Object.keys(sandbox)) {
          if (!agent.shouldSkipVariable(key)) {
            vars[key] = sandbox[key];
          }
        }
        agent.capture(lineNumber, vars);
      },

      // ========================================
      // 시뮬레이션된 setTimeout/setInterval
      // ========================================
      setTimeout: (callback, delay = 0, ...args) => {
        const taskId = taskIdCounter++;
        macrotaskQueue.push({
          id: taskId,
          callback,
          args,
          delay: delay || 0,
          type: 'timeout',
        });
        return taskId;
      },

      setInterval: (callback, delay = 0, ...args) => {
        const taskId = taskIdCounter++;
        macrotaskQueue.push({
          id: taskId,
          callback,
          args,
          delay: delay || 0,
          type: 'interval',
        });
        return taskId;
      },

      clearTimeout: (taskId) => {
        cancelledTasks.add(taskId);
      },

      clearInterval: (taskId) => {
        cancelledTasks.add(taskId);
      },

      // Promise는 Native Promise 사용
      // (계측된 코드가 이미 __captureMicrotask__를 포함함)
      Promise,

      // 허용되는 내장 객체
      Array,
      Object,
      String,
      Number,
      Boolean,
      Math,
      Date,
      JSON,
      RegExp,
      Map,
      Set,
      WeakMap,
      WeakSet,
      Symbol,
      Error,
      TypeError,
      RangeError,
      SyntaxError,
      ReferenceError,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURI,
      decodeURI,
      encodeURIComponent,
      decodeURIComponent,
    };

    const context = vm.createContext(sandbox);

    try {
      // ========================================
      // 이벤트 루프 시뮬레이션
      // ========================================

      // 1. 동기 코드 실행
      vm.runInContext(instrumentedCode, context, {
        timeout: EXECUTION_TIMEOUT,
        displayErrors: true,
      });

      // 2. Native Microtask Queue 실행 대기 (Promise.then())
      // Node.js는 자동으로 Microtask를 실행하지만, 우리 코드로 제어권이 넘어가기 전에
      // Promise들이 resolve되도록 여러 틱을 기다립니다
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => process.nextTick(resolve));
      }

      // 3. Macrotask Queue 실행 (setTimeout())
      if (macrotaskQueue.length > 0) {
        // delay 순으로 정렬
        macrotaskQueue.sort((a, b) => a.delay - b.delay);

        for (const macrotask of macrotaskQueue) {
          if (cancelledTasks.has(macrotask.id)) {
            continue;
          }

          try {
            macrotask.callback.apply(undefined, macrotask.args);
            // __captureMacrotask__()가 콜백 내부에서 호출됨 (계측된 코드)

            // 각 Macrotask 후 Microtask 대기
            for (let i = 0; i < 5; i++) {
              await new Promise(resolve => process.nextTick(resolve));
            }
          } catch (callbackError) {
            agent.stdoutBuffer.push(`[Uncaught in ${macrotask.type}] ${callbackError.message}`);
          }
        }
      }

    } catch (e) {
      // 에러 스냅샷 출력
      const errorSnapshot = {
        line: 1,
        event: 'ERROR',
        error: {
          type: e.name || 'Error',
          message: e.message,
        },
        stack: [],
        heap: [],
      };

      // 남은 stdout 포함
      if (this.stdoutBuffer.length > 0) {
        errorSnapshot.stdout = this.stdoutBuffer.join('\n');
      }

      // Use same replacer for consistency
      console.log(JSON.stringify(errorSnapshot, (key, value) => {
        if (typeof value === 'number') {
          if (Number.isNaN(value)) return '@@NaN@@';
          if (value === Infinity) return '@@INFINITY@@';
          if (value === -Infinity) return '@@-INFINITY@@';
        }
        return value;
      }));
    }
  }
}

// ============================================
// 메인 엔트리 포인트
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node debugger_agent.js <source_file>');
    process.exit(1);
  }

  const sourceFile = args[0];

  if (!fs.existsSync(sourceFile)) {
    const errorSnapshot = {
      line: 1,
      event: 'ERROR',
      error: {
        type: 'FileNotFoundError',
        message: `Source file not found: ${sourceFile}`,
      },
      stack: [],
      heap: [],
    };
    console.log(JSON.stringify(errorSnapshot));
    process.exit(1);
  }

  const code = fs.readFileSync(sourceFile, 'utf-8');

  const agent = new DebuggerAgent();
  agent.run(code);
}

module.exports = { DebuggerAgent };
