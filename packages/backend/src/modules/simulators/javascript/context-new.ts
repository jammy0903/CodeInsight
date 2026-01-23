/**
 * JavaScript Simulator Context
 *
 * 실행 컨텍스트 생성 및 관리
 */

import type { JsSimContext, JsStep, JsStackFrame, JsHeapObject } from './types-new';

/**
 * 새로운 JavaScript 실행 컨텍스트 생성
 */
export function createJsContext(): JsSimContext {
  const globalScope = new Map<string, any>();
  const heap = new Map<string, JsHeapObject>();
  let stdoutBuffer = '';
  let nextHeapId = 1;
  let currentLine = 0;

  const ctx: JsSimContext = {
    globalScope,
    heap,
    nextHeapId,
    currentLine,
    stdoutBuffer,

    setVariable(name: string, value: any): void {
      globalScope.set(name, value);
    },

    getVariable(name: string): any {
      return globalScope.get(name);
    },

    appendStdout(text: string): void {
      stdoutBuffer += text;
    },

    createHeapObject(type: 'Object' | 'Array' | 'Function', value: any): JsHeapObject {
      const id = `obj_${nextHeapId++}`;
      const obj: JsHeapObject = { id, type, value };
      heap.set(id, obj);
      return obj;
    },

    createStep(lineNum: number, code: string, explanation: string): JsStep {
      // Stack frame 생성 (현재는 global만)
      const stack: JsStackFrame[] = [
        {
          functionName: '(global)',
          variables: Object.fromEntries(globalScope.entries()),
        },
      ];

      // Heap 객체들
      const heapArray: JsHeapObject[] = Array.from(heap.values());

      // visualizationState 생성 (scopeChain 형식)
      const visualizationState = {
        type: 'scopeChain' as const,
        data: {
          scopes: [
            {
              id: 'scope-0',
              name: 'global',
              type: 'global' as const,
              variables: Object.fromEntries(globalScope.entries()),
            },
          ],
          currentScopeId: 'scope-0',
        },
      };

      const step: JsStep = {
        line: lineNum,
        code,
        explanation,
        stack,
        heap: heapArray,
        stdout: stdoutBuffer || undefined,
        visualizationState,
      };

      return step;
    },
  };

  return ctx;
}
