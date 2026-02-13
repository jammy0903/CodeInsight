/**
 * JSTransformer - JavaScript Language Transformer
 *
 * LessonStep (JavaScript) → FlowStep 변환
 * - stack/heap memoryState → FlowVariable[]
 * - 참조 관계 유지 ("@N" 형식)
 * - 변수는 __main__ 또는 함수 프레임에
 *
 * JavaScript Debugger Agent V2 출력 형식:
 * {
 *   "line": int,
 *   "event": "STEP" | "ERROR",
 *   "stack": [{ "methodName": str, "className": str, "variables": {} }],
 *   "heap": [{ "address": str, "type": str, "content": str }],
 *   "stdout": str (optional)
 * }
 */

import type { LessonStep, FlowStep, FlowVariable, FlowFrame } from '@codeinsight/shared';
import type { IFlowTransformer } from '../../shared/adapters/types';

/**
 * 값을 FlowValue로 파싱
 *
 * JavaScript 특징:
 * - "@N" 형태의 참조 (힙 객체)
 * - "hello" 형태의 문자열
 * - undefined, null, NaN 등 JS 고유 값
 */
function parseValue(value: string | undefined | null): string | number | boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  const strValue = String(value);

  if (strValue === '' || strValue === 'null' || strValue === 'NULL') return null;
  if (strValue === 'undefined') return 'undefined';
  if (strValue === 'NaN') return 'NaN';
  if (strValue === 'true') return true;
  if (strValue === 'false') return false;

  // 참조 파싱: "@N" → 참조로 표시
  if (strValue.startsWith('@')) {
    return strValue.trim();
  }

  // 숫자 시도
  const num = Number(strValue);
  if (!isNaN(num)) return num;

  // 문자열 (따옴표 제거)
  if (strValue.startsWith('"') && strValue.endsWith('"')) {
    return strValue.slice(1, -1);
  }
  if (strValue.startsWith("'") && strValue.endsWith("'")) {
    return strValue.slice(1, -1);
  }

  return strValue;
}

/**
 * 참조에서 주소 추출
 * "@1" → "@1"
 * "→ 0x001" → "0x001"  (레슨 JSON 형식)
 */
function extractPointsTo(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const strValue = String(value);
  if (strValue.startsWith('@')) {
    return strValue.trim();
  }
  // 레슨 JSON에서 사용하는 "→ 0xNNN" 형식
  const arrowMatch = strValue.match(/^→\s*(0x[\da-fA-F]+)/);
  if (arrowMatch) {
    return arrowMatch[1];
  }
  return undefined;
}

/**
 * 코드에서 특정 라인 추출
 */
function getCodeAtLine(fullCode: string, line: number): string {
  const lines = fullCode.split('\n');
  return lines[line - 1]?.trim() || '';
}

export class JSTransformer implements IFlowTransformer {
  /**
   * LessonStep → FlowStep 변환
   */
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep {
    const variables: FlowVariable[] = [];
    const frameVarMap = new Map<string, string[]>(); // frameName -> variableIds

    // DEBUG
    if (import.meta.env.DEV) {
      console.log('[JSTransformer] step.line:', step.line);
      console.log('[JSTransformer] step.memoryState:', step.memoryState);
      console.log('[JSTransformer] step.stack:', step.stack);
      console.log('[JSTransformer] step.heap:', (step as any).heap);
      // 상세 변수 로그
      if (step.stack && Array.isArray(step.stack)) {
        step.stack.forEach((frame: any, i: number) => {
          console.log(`[JSTransformer] stack[${i}].variables:`, JSON.stringify(frame.variables || frame));
        });
      }
    }

    // 0. 힙 타입 맵 구축 (참조 값의 실제 타입 조회용)
    const heapTypeMap = new Map<string, string>();
    const rawHeapData = step.memoryState?.heap || (step.heap as any);
    if (rawHeapData && Array.isArray(rawHeapData)) {
      rawHeapData.forEach((item: any) => {
        const addr = item.address || item.id;
        if (addr) heapTypeMap.set(addr, item.type || 'Object');
      });
    }

    // 1. Stack 변수 처리 (여러 프레임 지원)
    const stackData = step.memoryState?.stack || (step.stack as any);
    if (stackData && Array.isArray(stackData)) {
      stackData.forEach((item: any) => {
        // 형태: {methodName, className, variables: {...}} - 시뮬레이터 출력
        if (item.methodName || item.variables) {
          const frameName = item.methodName || '__main__';

          if (!frameVarMap.has(frameName)) {
            frameVarMap.set(frameName, []);
          }

          if (item.variables && typeof item.variables === 'object') {
            Object.entries(item.variables).forEach(([varName, val]: [string, any]) => {
              let value: string | number | boolean | null = null;
              let type = 'unknown';
              let pointsToAddr: string | undefined = undefined;

              if (val && typeof val === 'object') {
                if ('value' in val) {
                  value = parseValue(val.value);
                  type = val.type || typeof val.value;
                } else if (val.type === 'Reference' || val.type === 'Array' || val.id) {
                  // 참조 타입: displayValue가 있으면 표시, 없으면 주소
                  if (val.displayValue !== undefined) {
                    value = val.displayValue;
                  } else {
                    value = val.id ? val.id : null;
                  }
                  type = val.class || val.type || 'Reference';
                  pointsToAddr = val.id;
                } else {
                  value = JSON.stringify(val);
                  type = 'object';
                }
              } else {
                value = parseValue(val);
                const strVal = String(val);
                if (strVal.startsWith('@')) {
                  // "@N" 형태의 힙 참조 — 실제 타입을 힙에서 조회
                  pointsToAddr = strVal.trim();
                  type = heapTypeMap.get(pointsToAddr) || 'Reference';
                } else {
                  type = this.inferType(val);
                }
              }

              const variable: FlowVariable = {
                id: `${frameName}-${varName}`,
                name: varName,
                value,
                type,
                state: 'idle',
                scope: frameName,
                isPointer: !!pointsToAddr,
                pointsTo: pointsToAddr ? `heap-${pointsToAddr}` : undefined,
              };

              variables.push(variable);
              frameVarMap.get(frameName)!.push(variable.id);

              if (import.meta.env.DEV) {
                console.log('[JSTransformer] stack variable:', variable);
              }
            });
          }
        }
        // 형태 2: 단순 형태 {name, value, type?} - 레슨 JSON
        else if (item.name && (item.value !== undefined || item.value === null)) {
          const frameName = '__main__';
          if (!frameVarMap.has(frameName)) {
            frameVarMap.set(frameName, []);
          }

          const pointsTo = extractPointsTo(item.value);
          const isReference = !!pointsTo;
          // 참조이면 heapTypeMap에서 실제 타입 조회
          const type = isReference
            ? (heapTypeMap.get(pointsTo!) || item.type || 'Reference')
            : (item.type || 'unknown');

          const variable: FlowVariable = {
            id: `${frameName}-${item.name}`,
            name: item.name,
            value: parseValue(item.value),
            type,
            state: 'idle',
            scope: frameName,
            isPointer: isReference,
            pointsTo: pointsTo ? `heap-${pointsTo}` : undefined,
          };

          variables.push(variable);
          frameVarMap.get(frameName)!.push(variable.id);

          if (import.meta.env.DEV) {
            console.log('[JSTransformer] stack variable (simple):', variable);
          }
        }
      });
    }

    // 2. Heap 변수 처리
    const heapData = step.memoryState?.heap || (step.heap as any);
    const heapVarIds: string[] = [];

    if (heapData && Array.isArray(heapData)) {
      heapData.forEach((item: any) => {
        const address = item.address || item.id || 'unknown';
        const metadata: Record<string, unknown> = {};
        if (item.new) metadata.isNew = true;
        if (item.changed) metadata.isChanged = true;
        if (item.shared) metadata.isShared = true;
        if (item.warning) metadata.isWarning = true;
        const variable: FlowVariable = {
          id: `heap-${address}`,
          name: address,
          value: parseValue(item.content || item.value),
          type: item.type || 'Object',
          state: 'idle',
          scope: 'heap',
          address: address,
          isPointer: false,
          ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
        };

        variables.push(variable);
        heapVarIds.push(variable.id);

        if (import.meta.env.DEV) {
          console.log('[JSTransformer] heap variable:', variable);
        }
      });
    }

    // 3. 프레임 생성 (스택 순서대로)
    const frames: FlowFrame[] = [];

    // __main__ 프레임 먼저
    if (frameVarMap.has('__main__')) {
      frames.push({ name: '__main__', variableIds: frameVarMap.get('__main__')! });
    }

    // 나머지 함수 프레임들
    frameVarMap.forEach((varIds, frameName) => {
      if (frameName !== '__main__') {
        frames.push({ name: frameName, variableIds: varIds });
      }
    });

    // Heap 프레임 마지막
    if (heapVarIds.length > 0) {
      frames.push({ name: 'heap', variableIds: heapVarIds });
    }

    // 기본 프레임이 없으면 빈 __main__ 추가
    if (frames.length === 0) {
      frames.push({ name: '__main__', variableIds: [] });
    }

    // 4. 코드 추출
    const code = step.code || (fullCode ? getCodeAtLine(fullCode, step.line) : '');

    // 5. 터미널 출력 (stdout 또는 memoryState.output)
    let terminalOutput: { text: string } | undefined = undefined;

    // 시뮬레이터: step.stdout 직접 전달
    if ((step as any).stdout) {
      terminalOutput = { text: String((step as any).stdout) };
    }
    // 레슨 JSON: step.memoryState.output
    else if (step.memoryState?.output) {
      terminalOutput = {
        text: Array.isArray(step.memoryState.output)
          ? step.memoryState.output.join('\n')
          : String(step.memoryState.output),
      };
    }

    return {
      id: `step-${step.line}`,
      line: step.line,
      code,
      variables,
      animations: [],
      frames,
      terminalOutput,
    };
  }

  /**
   * JavaScript 값에서 타입 추론
   */
  private inferType(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return 'NaN';
      if (!Number.isFinite(value)) return 'Infinity';
      return Number.isInteger(value) ? 'number' : 'number';
    }
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'Array';
    if (typeof value === 'object') return 'Object';
    if (typeof value === 'function') return 'Function';
    return 'unknown';
  }

  /**
   * MemoryBlock 유사 객체 → FlowVariable 변환 (IFlowTransformer 인터페이스 충족)
   */
  toVariable(
    block: {
      name: string;
      value: string;
      type?: string;
      address?: string;
      points_to?: string | null;
      segment?: string;
    },
    scope: string
  ): FlowVariable {
    return {
      id: `${scope}-${block.name}-${block.address || 'no-addr'}`,
      name: block.name,
      value: block.value,
      type: block.type || 'unknown',
      state: 'idle',
      scope,
      isPointer: Boolean(block.points_to),
      pointsTo: block.points_to || undefined,
      address: block.address,
    };
  }
}

// 싱글톤 인스턴스
export const jsTransformer = new JSTransformer();
