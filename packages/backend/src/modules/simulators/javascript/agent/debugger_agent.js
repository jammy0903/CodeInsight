#!/usr/bin/env node
/**
 * JavaScript Debugger Agent using vm module and AST instrumentation
 *
 * This agent captures execution snapshots at each statement of JavaScript code,
 * producing JSON output compatible with the Java JDI-based simulator format.
 *
 * Output format (one JSON per line):
 * {
 *     "line": int,
 *     "event": "STEP",
 *     "stack": [
 *         {
 *             "methodName": str,
 *             "className": str,
 *             "variables": { name: value }
 *         }
 *     ],
 *     "heap": [
 *         {
 *             "address": str ("0xNNN"),
 *             "type": str,
 *             "content": str,
 *             "length": int (for arrays)
 *         }
 *     ]
 * }
 */

const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Try to load acorn for AST parsing
let acorn;
let walk;
let escodegen;

try {
  acorn = require('acorn');
  walk = require('acorn-walk');
  escodegen = require('escodegen');
} catch (e) {
  // If dependencies not available, use simple line-based approach
  acorn = null;
  walk = null;
  escodegen = null;
}

class DebuggerAgent {
  constructor() {
    this.objectIdMap = new WeakMap();  // For objects (objects, arrays, functions)
    this.stringIdMap = new Map();      // For strings (primitives can't be WeakMap keys)
    this.objectIdCounter = 1;
    this.heapObjects = [];
    this.callStack = [{ name: 'main', variables: {} }];
  }

  getHexAddress(obj) {
    // For strings, use a regular Map since they're primitives
    if (typeof obj === 'string') {
      if (this.stringIdMap.has(obj)) {
        return this.stringIdMap.get(obj);
      }
      const address = `0x${(this.objectIdCounter++).toString(16).padStart(3, '0').toUpperCase()}`;
      this.stringIdMap.set(obj, address);
      return address;
    }

    // For objects, use WeakMap
    if (this.objectIdMap.has(obj)) {
      return this.objectIdMap.get(obj);
    }
    const address = `0x${(this.objectIdCounter++).toString(16).padStart(3, '0').toUpperCase()}`;
    this.objectIdMap.set(obj, address);
    return address;
  }

  capture(lineNumber, contextVariables) {
    // Reset heap for each snapshot
    this.heapObjects = [];
    const collectedThisSnapshot = new Set();

    const variables = {};
    for (const [name, value] of Object.entries(contextVariables)) {
      // Skip internal variables
      if (name.startsWith('__') || name === 'console' || name === 'require') {
        continue;
      }
      variables[name] = this.parseValue(value, collectedThisSnapshot);
    }

    // Build full call stack (bottom to top)
    const stackFrames = this.callStack.map((frame, index) => ({
      methodName: frame.name,
      className: index === 0 ? 'Main' : 'Function',
      variables: index === this.callStack.length - 1 ? variables : frame.variables,
    }));

    const snapshot = {
      line: lineNumber,
      event: 'STEP',
      stack: stackFrames,
      heap: this.heapObjects,
    };

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

  parseValue(value, collected) {
    // null
    if (value === null) return null;

    // undefined (keep as-is, will be handled by JSON replacer)
    if (value === undefined) return undefined;

    // Booleans
    if (typeof value === 'boolean') return value;

    // Special numbers (NaN, Infinity)
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

    // Strings -> heap reference
    if (typeof value === 'string') {
      return this.addStringToHeap(value, collected);
    }

    // Arrays -> heap reference
    if (Array.isArray(value)) {
      return this.addArrayToHeap(value, collected);
    }

    // Functions -> heap reference
    if (typeof value === 'function') {
      return this.addFunctionToHeap(value, collected);
    }

    // Objects -> heap reference
    if (typeof value === 'object') {
      return this.addObjectToHeap(value, collected);
    }

    return String(value);
  }

  addStringToHeap(value, collected) {
    const address = this.getHexAddress(value);

    if (!collected.has(address)) {
      collected.add(address);
      this.heapObjects.push({
        id: address,
        address: address,
        type: 'String',
        content: `"${value}"`,
      });
    }

    return {
      type: 'Reference',
      id: address,
      class: 'String',
      displayValue: value,
    };
  }

  addArrayToHeap(value, collected) {
    const address = this.getHexAddress(value);

    if (!collected.has(address)) {
      collected.add(address);
      this.heapObjects.push({
        id: address,
        address: address,
        type: 'Array',
        content: this.formatArrayContent(value),
        length: value.length,
      });
    }

    return {
      type: 'Array',
      id: address,
      class: 'Array',
      length: value.length,
    };
  }

  addFunctionToHeap(value, collected) {
    const address = this.getHexAddress(value);
    const funcName = value.name || 'anonymous';

    if (!collected.has(address)) {
      collected.add(address);
      this.heapObjects.push({
        id: address,
        address: address,
        type: 'Function',
        content: `<function ${funcName}>`,
      });
    }

    return {
      type: 'Reference',
      id: address,
      class: 'Function',
      displayValue: funcName,
    };
  }

  addObjectToHeap(value, collected) {
    const address = this.getHexAddress(value);
    const className = value.constructor?.name || 'Object';

    if (!collected.has(address)) {
      collected.add(address);
      this.heapObjects.push({
        id: address,
        address: address,
        type: className,
        content: this.formatObjectContent(value),
      });
    }

    return {
      type: 'Reference',
      id: address,
      class: className,
    };
  }

  formatArrayContent(arr) {
    if (arr.length === 0) return '[]';

    const items = [];
    const limit = Math.min(arr.length, 5);

    for (let i = 0; i < limit; i++) {
      items.push(this.formatValueShort(arr[i]));
    }

    if (arr.length > limit) {
      items.push('...');
    }

    return '[' + items.join(', ') + ']';
  }

  formatObjectContent(obj) {
    const className = obj.constructor?.name || 'Object';
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return `${className}{}`;
    }

    const items = [];
    const limit = 3;

    for (let i = 0; i < Math.min(keys.length, limit); i++) {
      const key = keys[i];
      items.push(`${key}: ${this.formatValueShort(obj[key])}`);
    }

    if (keys.length > limit) {
      items.push('...');
    }

    return `${className}{${items.join(', ')}}`;
  }

  formatValueShort(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
      if (value.length > 10) {
        return `"${value.substring(0, 10)}..."`;
      }
      return `"${value}"`;
    }
    if (Array.isArray(value)) return `[...${value.length}]`;
    if (typeof value === 'function') return `<fn ${value.name || 'anon'}>`;
    if (typeof value === 'object') return `@${this.getHexAddress(value)}`;
    return String(value).substring(0, 20);
  }

  instrumentCode(code) {
    if (!acorn || !escodegen) {
      // Fallback: simple line-based instrumentation
      return this.instrumentCodeSimple(code);
    }

    try {
      const ast = acorn.parse(code, {
        ecmaVersion: 2020,
        sourceType: 'script',
        locations: true,
      });

      // Instrument each statement
      this.instrumentStatements(ast.body);

      return escodegen.generate(ast);
    } catch (e) {
      // Fallback to simple approach on parse error
      return this.instrumentCodeSimple(code);
    }
  }

  /**
   * Helper: Get statements array from a node (handles BlockStatement vs single statement)
   */
  getStatements(node) {
    if (!node) return [];
    if (node.type === 'BlockStatement') return node.body;
    return [node];
  }

  /**
   * Helper: Recursively instrument child nodes
   */
  instrumentNode(node) {
    if (!node) return;

    switch (node.type) {
      case 'BlockStatement':
        this.instrumentStatements(node.body);
        break;
      case 'IfStatement':
        this.instrumentNode(node.consequent);
        this.instrumentNode(node.alternate);
        break;
      case 'ForStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
        this.instrumentNode(node.body);
        break;
      case 'ForInStatement':
      case 'ForOfStatement':
        this.instrumentNode(node.body);
        break;
      case 'SwitchStatement':
        node.cases?.forEach(caseNode => {
          if (caseNode.consequent) {
            this.instrumentStatements(caseNode.consequent);
          }
        });
        break;
      case 'TryStatement':
        this.instrumentNode(node.block);
        this.instrumentNode(node.handler?.body);
        this.instrumentNode(node.finalizer);
        break;
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        this.instrumentNode(node.body);
        break;
    }
  }

  instrumentStatements(statements) {
    for (let i = statements.length - 1; i >= 0; i--) {
      const stmt = statements[i];
      const line = stmt.loc?.start?.line || 1;

      // Instrument function declarations with enter/exit tracking
      if (stmt.type === 'FunctionDeclaration') {
        const funcName = stmt.id?.name || 'anonymous';

        // Wrap function body with try-finally
        if (stmt.body && stmt.body.type === 'BlockStatement') {
          const originalBody = stmt.body.body;

          // Create __enterFunction__ call
          const enterCall = {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: '__enterFunction__' },
              arguments: [{ type: 'Literal', value: funcName }],
            },
          };

          // Create __exitFunction__ call
          const exitCall = {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: '__exitFunction__' },
              arguments: [],
            },
          };

          // Wrap in try-finally
          stmt.body.body = [
            enterCall,
            {
              type: 'TryStatement',
              block: {
                type: 'BlockStatement',
                body: originalBody,
              },
              handler: null,
              finalizer: {
                type: 'BlockStatement',
                body: [exitCall],
              },
            },
          ];

          // Now instrument the original body
          this.instrumentStatements(originalBody);
        }
        continue;
      }

      // Create capture call
      const captureCall = {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: '__capture__' },
          arguments: [{ type: 'Literal', value: line }],
        },
      };

      // Insert before the statement
      statements.splice(i, 0, captureCall);

      // Recursively instrument child nodes
      this.instrumentNode(stmt);
    }
  }

  instrumentCodeSimple(code) {
    // Simple line-based instrumentation without AST
    // Transform let/const to var so variables are accessible from context
    const lines = code.split('\n');
    const instrumentedLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        instrumentedLines.push(line);
        continue;
      }

      // Skip lines that are part of multi-line constructs
      if (
        trimmed === '{' ||
        trimmed === '}' ||
        trimmed === '};' ||
        trimmed.endsWith(',')
      ) {
        instrumentedLines.push(line);
        continue;
      }

      // Skip function declarations (they need special handling)
      if (trimmed.startsWith('function ')) {
        instrumentedLines.push(line);
        continue;
      }

      // Transform let/const to var for context accessibility
      // This is a simplification - in production, you'd want proper scoping
      if (/^(let|const)\s+/.test(trimmed)) {
        line = line.replace(/^(\s*)(let|const)\s+/, '$1var ');
      }

      // Add the line first, then capture AFTER execution
      const lineNum = i + 1;
      instrumentedLines.push(line);
      instrumentedLines.push(`__capture__(${lineNum});`);
    }

    return instrumentedLines.join('\n');
  }

  run(code) {
    const agent = this;

    // Instrument the code
    const instrumentedCode = this.instrumentCode(code);

    // Create sandbox context
    const context = vm.createContext({
      __capture__: (lineNumber) => {
        // Get all variables from the context
        const vars = {};
        for (const key of Object.keys(context)) {
          if (!key.startsWith('__') && key !== 'console') {
            vars[key] = context[key];
          }
        }
        agent.capture(lineNumber, vars);
      },
      __enterFunction__: (functionName) => {
        agent.callStack.push({ name: functionName, variables: {} });
      },
      __exitFunction__: () => {
        if (agent.callStack.length > 1) {
          agent.callStack.pop();
        }
      },
      console: {
        log: (...args) => {
          // Capture console.log output (could add to snapshot if needed)
        },
      },
    });

    try {
      vm.runInContext(instrumentedCode, context, {
        timeout: 10000,
        displayErrors: true,
      });
    } catch (e) {
      // Output error as special snapshot
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
      // Use same replacer for consistency
      console.log(JSON.stringify(errorSnapshot, (key, value) => {
        if (value === undefined) return '@@UNDEFINED@@';
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

// Main entry point
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node debugger_agent.js <source_file>');
    process.exit(1);
  }

  const sourceFile = args[0];

  if (!fs.existsSync(sourceFile)) {
    console.error(`Error: Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  const code = fs.readFileSync(sourceFile, 'utf-8');

  const agent = new DebuggerAgent();
  agent.run(code);
}

module.exports = { DebuggerAgent };
