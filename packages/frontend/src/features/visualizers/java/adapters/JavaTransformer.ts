/**
 * JavaTransformer - Java Language Transformer
 *
 * LessonStep (Java) → FlowStep 변환
 * - stack/heap memoryState → FlowVariable[]
 * - 참조 관계 유지 ("-> 0x001")
 * - 모든 변수는 main 프레임에
 */

import type { LessonStep, FlowStep, FlowVariable, FlowFrame } from '@codeinsight/shared';
import type { IFlowTransformer } from '../../shared/adapters/types';

type UnknownRecord = Record<string, unknown>;

type StackVariableItem = {
  name: string;
  value: unknown;
  type?: string;
  sameRef?: boolean;
};

type SimulatorFrameItem = {
  methodName?: string;
  variables?: UnknownRecord;
};

type HeapItem = {
  address?: string;
  id?: string;
  content?: unknown;
  value?: unknown;
  type?: string;
  new?: boolean;
  hashCode?: string;
  refCount?: number;
};

type StringPoolItem = {
  address?: string;
  value?: unknown;
  refCount?: number;
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

function isStackVariableItem(item: unknown): item is StackVariableItem {
  if (!isRecord(item)) return false;
  return typeof item.name === 'string' && 'value' in item;
}

function isSimulatorFrameItem(item: unknown): item is SimulatorFrameItem {
  if (!isRecord(item)) return false;
  return typeof item.methodName === 'string' || isRecord(item.variables);
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

function isStringPoolItem(item: unknown): item is StringPoolItem {
  if (!isRecord(item)) return false;
  return typeof item.address === 'string' || 'value' in item;
}

/**
 * 값을 FlowValue로 파싱
 *
 * Java 특징:
 * - "-> 0x001" 형태의 참조
 * - "\"hello\"" 형태의 문자열
 */
function parseValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  const strValue = String(value);

  if (strValue === '' || strValue === 'null' || strValue === 'NULL') return null;
  if (strValue === 'true') return true;
  if (strValue === 'false') return false;

  // 참조 파싱: "-> 0x001" → 참조로 표시하되, 값은 주소
  if (strValue.startsWith('->')) {
    return strValue.trim();
  }

  // hex 주소는 문자열로 유지
  if (strValue.startsWith('0x') || strValue.startsWith('0X')) {
    return strValue;
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
 * "-> 0x001" → "0x001"
 */
function extractPointsTo(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const strValue = String(value);
  if (strValue.startsWith('->')) {
    return strValue.replace('->', '').trim();
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

export class JavaTransformer implements IFlowTransformer {
  /**
   * LessonStep → FlowStep 변환
   */
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep {
    const variables: FlowVariable[] = [];
    const frameVarMap = new Map<string, string[]>();
    const frameOrder: string[] = [];
    const heapFrameVars: string[] = [];
    const stringPoolVars: string[] = [];
    const stepRecord = step as UnknownRecord;
    const getFrameVarIds = (name: string): string[] => {
      const normalized = name === '__main__' ? 'main' : name;
      let ids = frameVarMap.get(normalized);
      if (!ids) {
        ids = [];
        frameVarMap.set(normalized, ids);
        frameOrder.push(normalized);
      }
      return ids;
    };

    // 1. Stack 변수 처리 (main 프레임)
    const stackData =
      step.javaMemoryState?.stack ??
      step.memoryState?.stack ??
      toArray(stepRecord.stack) ??
      [];

    for (const item of stackData) {
      // 형태 1: 단순 형태 {name, value, type?} - 레슨 JSON
      if (isStackVariableItem(item)) {
        const frameVars = getFrameVarIds('main');
        const pointsTo = extractPointsTo(item.value);
        const isReference = !!pointsTo;

        const meta: Record<string, unknown> = {};
        if (item.sameRef === true) meta.sameRef = true;

        const variable: FlowVariable = {
          id: `main-${item.name}`,
          name: item.name,
          value: parseValue(item.value),
          type: item.type || 'unknown',
          state: 'idle',
          scope: 'main',
          isPointer: isReference,
          // ArrowLayer는 variable.id로 매칭하므로 heap-${address} 형식 필요
          pointsTo: pointsTo ? `heap-${pointsTo}` : undefined,
          metadata: Object.keys(meta).length > 0 ? meta : undefined,
        };

        variables.push(variable);
        frameVars.push(variable.id);
      }
      // 형태 2: 복잡한 형태 {methodName, variables: {...}} - 시뮬레이터
      else if (isSimulatorFrameItem(item)) {
        const frameName = item.methodName || 'main';
        const frameVars = getFrameVarIds(frameName);
        const frameVariables = item.variables;

        if (frameVariables) {
          Object.entries(frameVariables)
          .filter(([varName]) => varName !== 'args')
          .forEach(([varName, val]) => {
            let value: string | number | boolean | null = null;
            let type = 'unknown';
            let pointsToAddr: string | undefined = undefined;

            if (isRecord(val)) {
              const typedValue = val.value;
              const typedType = asString(val.type);
              const refId = asString(val.id);
              const className = asString(val.class);
              const displayValue = val.displayValue;

              if (typedValue !== undefined) {
                value = parseValue(typedValue);
                type = typedType || typeof typedValue;
              } else if (typedType === 'Reference' || typedType === 'Array' || refId) {
                // 참조 타입: displayValue가 있으면 표시, 없으면 주소
                if (displayValue !== undefined) {
                  value = parseValue(displayValue);
                } else {
                  value = refId ? `-> ${refId}` : null;
                }
                type = className || typedType || 'Reference';
                pointsToAddr = refId;
              } else {
                value = stringifyUnknown(val);
                type = 'object';
              }
            } else {
              value = parseValue(val);
              type = typeof val;
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
            frameVars.push(variable.id);
          });
        }
      }
    }

    // 2. Heap 변수 처리
    const heapData =
      step.javaMemoryState?.heap ??
      step.memoryState?.heap ??
      toArray(stepRecord.heap) ??
      [];
    for (const item of heapData) {
      if (!isHeapItem(item)) continue;

      const address = item.address || item.id || 'unknown';

      const meta: Record<string, unknown> = {};
      if (item.new === true) meta.isNew = true;
      if (typeof item.hashCode === 'string') meta.hashCode = item.hashCode;
      if (typeof item.refCount === 'number') meta.refCount = item.refCount;

      const variable: FlowVariable = {
        id: `heap-${address}`,
        name: address,
        value: parseValue(item.content ?? item.value),
        type: item.type || 'Object',
        state: 'idle',
        scope: 'heap',
        address,
        isPointer: false,
        metadata: Object.keys(meta).length > 0 ? meta : undefined,
      };

      variables.push(variable);
      heapFrameVars.push(variable.id);
    }

    // 2.5. String Pool 처리 (java-1-2 등 String Pool 레슨)
    const stringPoolData = step.javaMemoryState?.stringPool ?? [];
    for (const item of stringPoolData) {
      if (!isStringPoolItem(item)) continue;

      const address = item.address || 'unknown';

      const meta: Record<string, unknown> = {};
      if (typeof item.refCount === 'number') meta.refCount = item.refCount;

      const variable: FlowVariable = {
        id: `heap-${address}`,
        name: address,
        value: parseValue(item.value),
        type: 'String (Pool)',
        state: 'idle',
        scope: 'stringPool',
        address,
        isPointer: false,
        metadata: Object.keys(meta).length > 0 ? meta : undefined,
      };
      variables.push(variable);
      stringPoolVars.push(variable.id);
    }

    // 3. 프레임 생성
    const stackFrameNames = frameOrder.length > 0 ? frameOrder : ['main'];
    const frames: FlowFrame[] = stackFrameNames.map((name) => ({
      name,
      variableIds: frameVarMap.get(name) ?? [],
    }));

    if (stringPoolVars.length > 0) {
      frames.push({ name: 'String Pool', variableIds: stringPoolVars });
    }

    if (heapFrameVars.length > 0) {
      frames.push({ name: 'heap', variableIds: heapFrameVars });
    }

    // 4. 코드 추출
    const code = step.code || (fullCode ? getCodeAtLine(fullCode, step.line) : '');

    // 5. 터미널 출력 (javaMemoryState.output → memoryState.output → stdout)
    let terminalOutput: { text: string } | undefined = undefined;
    const outputData = step.javaMemoryState?.output || step.memoryState?.output;
    const stdout = asString(stepRecord.stdout) || step.stdout;

    if (stdout) {
      terminalOutput = { text: stdout };
    } else if (outputData) {
      terminalOutput = {
        text: Array.isArray(outputData)
          ? outputData.join('\n')
          : String(outputData),
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
   * MemoryBlock → FlowVariable 변환
   * (Java 어댑터에서는 transform에서 통합 처리하므로, 여기는 기본 구현)
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
    const isReference = !!block.points_to;
    return {
      id: `${scope}-${block.name}`,
      name: block.name,
      value: parseValue(block.value),
      type: block.type || 'unknown',
      state: 'idle',
      scope,
      isPointer: isReference,
      pointsTo: block.points_to ? `heap-${block.points_to}` : undefined,
      address: block.address,
    };
  }
}

// 싱글톤 인스턴스
export const javaTransformer = new JavaTransformer();
