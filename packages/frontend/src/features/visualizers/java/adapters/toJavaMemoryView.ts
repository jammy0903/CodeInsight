/**
 * Java 시뮬레이터 데이터 → JavaMemoryView Props 변환
 *
 * 입력 (시뮬레이터):
 * {
 *   stack: [{ methodName: "main", variables: { x: 10, arr: {type: "Array", id: "0x001"} } }],
 *   heap: [{ address: "0x001", type: "int[]", content: "{1, 2, 3}" }]
 * }
 *
 * 출력 (JavaMemoryView):
 * {
 *   frames: [{ name: "main", variables: [...] }],
 *   heap: [{ address: "0x001", type: "int[]", content: "{1, 2, 3}" }]
 * }
 */

import type {
  JavaStackFrame,
  JavaVariable,
  JavaHeapObject,
} from '../JavaMemoryView';

interface SimulatorStackFrame {
  methodName?: string;
  className?: string;
  variables?: Record<string, any>;
}

interface SimulatorHeapObject {
  address: string;
  type: string;
  content: string;
  length?: number;
}

interface SimulatorStep {
  // 직접 접근 (시뮬레이터 원시 출력)
  stack?: SimulatorStackFrame[];
  heap?: SimulatorHeapObject[];
  // memoryState 래퍼 (LessonStep 형식)
  memoryState?: {
    stack?: SimulatorStackFrame[];
    heap?: SimulatorHeapObject[];
  };
  line?: number;
  lineNumber?: number;
}

/**
 * 시뮬레이터 변수 값을 JavaVariable로 변환
 */
function parseVariable(name: string, value: any): JavaVariable {
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
  if (typeof value === 'object') {
    // { type: "Reference" | "Array", id: "0x001", class: "String", displayValue?: "hello" }
    if (value.type === 'Reference' || value.type === 'Array' || value.id) {
      const type = value.class || value.type || 'Object';

      // 모든 참조 타입은 동일하게 처리 (String 포함)
      return {
        name,
        value: `→ ${value.id}`,
        type: type,
        refAddress: value.id,
      };
    }

    // 기타 객체
    return {
      name,
      value: JSON.stringify(value),
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
function parseStackFrame(frame: SimulatorStackFrame): JavaStackFrame {
  const frameName = frame.methodName || 'unknown';
  const variables: JavaVariable[] = [];

  if (frame.variables && typeof frame.variables === 'object') {
    for (const [varName, value] of Object.entries(frame.variables)) {
      // args 배열은 스킵 (너무 복잡함)
      if (varName === 'args') continue;

      variables.push(parseVariable(varName, value));
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
function parseHeapObjects(heap: SimulatorHeapObject[]): JavaHeapObject[] {
  return heap
    .filter(obj => {
      // args 배열 스킵 (java.lang.String[] with empty content)
      if (obj.type === 'java.lang.String[]' && obj.content === '[]') {
        return false;
      }
      return true;
    })
    .map(obj => ({
      address: obj.address,
      type: obj.type,
      content: obj.content,
    }));
}

/**
 * 시뮬레이터 스텝 데이터를 JavaMemoryView props로 변환
 */
export function toJavaMemoryViewProps(step: SimulatorStep): {
  frames: JavaStackFrame[];
  heap: JavaHeapObject[];
} {
  const frames: JavaStackFrame[] = [];
  const heap: JavaHeapObject[] = [];

  // memoryState 래퍼 또는 직접 접근 지원
  const stackData = step.memoryState?.stack || step.stack;
  const heapData = step.memoryState?.heap || step.heap;

  // Stack 처리
  if (stackData && Array.isArray(stackData)) {
    for (const frame of stackData) {
      // Main 클래스 프레임만 처리 (JDK 내부 프레임 제외)
      if (frame.className?.startsWith('java.') ||
          frame.className?.startsWith('sun.') ||
          frame.className?.startsWith('jdk.')) {
        continue;
      }

      const parsed = parseStackFrame(frame);
      if (parsed.variables.length > 0 || parsed.name === 'main') {
        frames.push(parsed);
      }
    }
  }

  // Heap 처리
  if (heapData && Array.isArray(heapData)) {
    heap.push(...parseHeapObjects(heapData));
  }

  return { frames, heap };
}

export default toJavaMemoryViewProps;
