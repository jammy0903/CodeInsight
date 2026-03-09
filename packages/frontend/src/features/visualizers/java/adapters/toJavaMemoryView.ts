import type { LessonStep } from '@codeinsight/shared';
import type {
  JavaStackFrame,
  JavaVariable,
  JavaHeapObject,
} from '../JavaMemoryView';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function hasVariables(item: unknown): item is { variables: UnknownRecord } {
  if (!isRecord(item)) return false;
  return isRecord(item.variables);
}

function hasNameAndValue(item: unknown): item is { name: string; value: unknown } {
  if (!isRecord(item)) return false;
  return typeof item.name === 'string' && 'value' in item;
}

function getClassName(item: unknown): string | undefined {
  if (!isRecord(item)) return undefined;
  return asString(item.className);
}

function stringifyUnknown(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeJavaVariableName(rawName: string, frameName?: string): string {
  if (!rawName) return rawName;
  let name = rawName.trim();

  const colonIdx = name.lastIndexOf(':');
  if (colonIdx >= 0 && colonIdx < name.length - 1) {
    name = name.slice(colonIdx + 1);
  }

  if (frameName) {
    const dotPrefix = `${frameName}.`;
    if (name.startsWith(dotPrefix)) {
      name = name.slice(dotPrefix.length);
    }
  }

  return name;
}

/**
 * 시뮬레이터 변수 값을 JavaVariable로 변환
 */
function parseVariable(name: string, value: unknown): JavaVariable {
  // null
  if (value === null || value === undefined) {
    return {
      name,
      value: null,
      type: 'null',
    };
  }

  // primitive
  if (typeof value === 'number') {
    return {
      name,
      value,
      type: Number.isInteger(value) ? 'int' : 'double',
    };
  }

  if (typeof value === 'boolean') {
    return {
      name,
      value,
      type: 'boolean',
    };
  }

  if (typeof value === 'string') {
    // 순수 문자열 값 (primitive처럼 처리)
    return {
      name,
      value: `"${value}"`,
      type: 'String',
    };
  }

  // Reference 객체 (배열, 객체, String 포함)
  if (isRecord(value)) {
    // { type: "Reference" | "Array", id: "0x001", class: "String", displayValue?: "hello" }
    const refType = asString(value.type);
    const refId = asString(value.id);
    if (refType === 'Reference' || refType === 'Array' || refId) {
      const type = asString(value.class) || refType || 'Object';

      // 모든 참조 타입은 동일하게 처리 (String 포함)
      return {
        name,
        value: `→ ${refId || 'unknown'}`,
        type: type,
        refAddress: refId,
      };
    }

    // 기타 객체
    return {
      name,
      value: stringifyUnknown(value),
      type: 'Object',
    };
  }

  // fallback
  return {
    name,
    value: String(value),
    type: typeof value,
  };
}

/**
 * 시뮬레이터 스택 프레임을 JavaStackFrame으로 변환
 */
function parseStackFrame(frame: unknown): JavaStackFrame {
  const frameRecord = isRecord(frame) ? frame : {};
  const frameName = asString(frameRecord.methodName) || asString(frameRecord.name) || 'unknown';
  const variables: JavaVariable[] = [];
  const frameVariables = isRecord(frameRecord.variables) ? frameRecord.variables : undefined;

  if (frameVariables) {
    for (const [varName, value] of Object.entries(frameVariables)) {
      // args 배열은 스킵 (너무 복잡함)
      if (varName === 'args') continue;

      variables.push(parseVariable(normalizeJavaVariableName(varName, frameName), value));
    }
  }

  return {
    name: frameName,
    variables,
  };
}

/**
 * 시뮬레이터 힙 객체를 JavaHeapObject로 변환
 * args 배열은 제외 (main 메서드 파라미터)
 */
function parseHeapObjects(heap: unknown[]): JavaHeapObject[] {
  return heap
    .filter((obj): obj is UnknownRecord => {
      if (!isRecord(obj)) return false;
      const rawContent = obj.content ?? obj.value;
      const objType = asString(obj.type);
      // args 배열 스킵 (java.lang.String[] with empty content)
      if (objType === 'java.lang.String[]' && String(rawContent) === '[]') {
        return false;
      }
      return true;
    })
    .map(obj => ({
      address: asString(obj.address) || 'unknown',
      type: asString(obj.type) || 'Object',
      content: String(obj.content ?? obj.value ?? ''),
    }));
}

/**
 * 시뮬레이터 스텝 데이터를 JavaMemoryView props로 변환
 */
export function toJavaMemoryViewProps(step: LessonStep): {
  frames: JavaStackFrame[];
  heap: JavaHeapObject[];
} {
  const frames: JavaStackFrame[] = [];
  const heap: JavaHeapObject[] = [];
  const stepRecord = step as UnknownRecord;

  // javaMemoryState (lesson JSON) → memoryState (legacy) → direct stack/heap fallback
  const stackData = step.javaMemoryState?.stack || step.memoryState?.stack || toArray(stepRecord.stack);
  const heapData = step.javaMemoryState?.heap || step.memoryState?.heap || toArray(stepRecord.heap);

  // Stack 처리
  if (stackData && Array.isArray(stackData) && stackData.length > 0) {
    const firstEl = stackData[0];
    // Case 1: Array of Frames (from live simulator)
    if (hasVariables(firstEl)) {
      for (const frame of stackData) {
        // Main 클래스 프레임만 처리 (JDK 내부 프레임 제외)
        const className = getClassName(frame);
        if (className?.startsWith('java.') ||
            className?.startsWith('sun.') ||
            className?.startsWith('jdk.')) {
          continue;
        }

        const parsed = parseStackFrame(frame);
        if (parsed.variables.length > 0 || parsed.name === 'main') {
          frames.push(parsed);
        }
      }
    }
    // Case 2: Flat array of variables (from lesson JSON)
    else if (hasNameAndValue(firstEl)) {
      const mainVariables: JavaVariable[] = [];
      for (const variableEntry of stackData) {
        if (!hasNameAndValue(variableEntry)) continue;
        mainVariables.push(parseVariable(normalizeJavaVariableName(variableEntry.name, 'main'), variableEntry.value));
      }

      const mainFrame: JavaStackFrame = {
        name: 'main',
        variables: mainVariables,
      };
      frames.push(mainFrame);
    }
  }

  // Heap 처리
  if (heapData && Array.isArray(heapData)) {
    heap.push(...parseHeapObjects(heapData));
  }

  return { frames, heap };
}

export default toJavaMemoryViewProps;
