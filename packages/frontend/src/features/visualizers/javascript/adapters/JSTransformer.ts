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

type UnknownRecord = Record<string, unknown>;

type StackFrameItem = {
  methodName?: string;
  variables?: UnknownRecord;
};

type StackVariableItem = {
  name: string;
  value: unknown;
  type?: string;
};

type HeapItem = {
  address?: string;
  id?: string;
  type?: string;
  content?: unknown;
  value?: unknown;
  new?: boolean;
  changed?: boolean;
  shared?: boolean;
  warning?: boolean;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function stringifyUnknown(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isStackFrameItem(item: unknown): item is StackFrameItem {
  if (!isRecord(item)) return false;
  return typeof item.methodName === 'string' || isRecord(item.variables);
}

function isStackVariableItem(item: unknown): item is StackVariableItem {
  if (!isRecord(item)) return false;
  return typeof item.name === 'string' && 'value' in item;
}

function isHeapItem(item: unknown): item is HeapItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.address === 'string' ||
    typeof item.id === 'string' ||
    'content' in item ||
    'value' in item
  );
}

/**
 * 값을 FlowValue로 파싱
 *
 * JavaScript 특징:
 * - "@N" 형태의 참조 (힙 객체)
 * - "hello" 형태의 문자열
 * - undefined, null, NaN 등 JS 고유 값
 */
function parseValue(value: unknown): string | number | boolean | null {
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
function extractPointsTo(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
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
    const stepRecord = step as UnknownRecord;
    const getFrameVarIds = (frameName: string): string[] => {
      let ids = frameVarMap.get(frameName);
      if (!ids) {
        ids = [];
        frameVarMap.set(frameName, ids);
      }
      return ids;
    };

    // DEBUG
    if (import.meta.env.DEV) {
      console.log('[JSTransformer] step.line:', step.line);
      console.log('[JSTransformer] step.memoryState:', step.memoryState);
      console.log('[JSTransformer] step.stack:', step.stack);
      console.log('[JSTransformer] step.heap:', stepRecord.heap);
      // 상세 변수 로그
      if (step.stack && Array.isArray(step.stack)) {
        step.stack.forEach((frame, i: number) => {
          const debugFrame: unknown = frame;
          const frameRecord = isRecord(debugFrame) ? debugFrame : undefined;
          console.log(`[JSTransformer] stack[${i}].variables:`, JSON.stringify(frameRecord?.variables || frame));
        });
      }
    }

    // 0. 힙 타입 맵 구축 (참조 값의 실제 타입 조회용)
    const heapTypeMap = new Map<string, string>();
    const rawHeapData = step.memoryState?.heap || toArray(stepRecord.heap) || [];
    rawHeapData.forEach(item => {
      if (!isHeapItem(item)) return;
        const addr = item.address || item.id;
        if (addr) heapTypeMap.set(addr, item.type || 'Object');
    });

    // 1. Stack 변수 처리 (여러 프레임 지원)
    const stackData = step.memoryState?.stack || toArray(stepRecord.stack) || [];
    stackData.forEach(item => {
        // 형태: {methodName, className, variables: {...}} - 시뮬레이터 출력
        if (isStackFrameItem(item)) {
          const frameName = item.methodName || '__main__';
          const frameVarIds = getFrameVarIds(frameName);
          const frameVariables = item.variables;

          if (frameVariables && typeof frameVariables === 'object') {
            Object.entries(frameVariables).forEach(([varName, val]) => {
              let value: string | number | boolean | null = null;
              let type = 'unknown';
              let pointsToAddr: string | undefined = undefined;

              if (isRecord(val)) {
                const rawValue = val.value;
                const refType = asString(val.type);
                const refId = asString(val.id);
                const className = asString(val.class);
                const displayValue = val.displayValue;

                if (rawValue !== undefined) {
                  value = parseValue(rawValue);
                  type = refType || typeof rawValue;
                } else if (refType === 'Reference' || refType === 'Array' || refId) {
                  // 참조 타입: displayValue가 있으면 표시, 없으면 주소
                  if (displayValue !== undefined) {
                    value = parseValue(displayValue);
                  } else {
                    value = refId || null;
                  }
                  type = className || refType || 'Reference';
                  pointsToAddr = refId;
                } else {
                  value = stringifyUnknown(val);
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
              frameVarIds.push(variable.id);

              if (import.meta.env.DEV) {
                console.log('[JSTransformer] stack variable:', variable);
              }
            });
          }
        }
        // 형태 2: 단순 형태 {name, value, type?} - 레슨 JSON
        else if (isStackVariableItem(item)) {
          const frameName = '__main__';
          const frameVarIds = getFrameVarIds(frameName);

          const pointsTo = extractPointsTo(item.value);
          const isReference = !!pointsTo;
          // 참조이면 heapTypeMap에서 실제 타입 조회
          const type = isReference
            ? (heapTypeMap.get(pointsTo) || item.type || 'Reference')
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
          frameVarIds.push(variable.id);

          if (import.meta.env.DEV) {
            console.log('[JSTransformer] stack variable (simple):', variable);
          }
        }
    });

    // 2. Heap 변수 처리
    const heapData = step.memoryState?.heap || toArray(stepRecord.heap);
    const heapVarIds: string[] = [];

    if (heapData && Array.isArray(heapData)) {
      heapData.forEach(item => {
        if (!isHeapItem(item)) return;
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
          address,
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
    const stdout = asString(stepRecord.stdout) || step.stdout;

    // 시뮬레이터: step.stdout 직접 전달
    if (stdout) {
      terminalOutput = { text: stdout };
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
