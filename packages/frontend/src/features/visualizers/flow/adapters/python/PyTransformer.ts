/**
 * PyTransformer - Python Language Transformer
 *
 * PyStep (names/objects) → FlowStep 변환
 * - Python은 모든 변수가 참조
 * - Names → FlowVariable (isReference: true)
 * - Objects → 참조 대상 (pointsTo로 연결)
 */

import type { LessonStep, FlowStep, FlowVariable, FlowFrame, FlowValue } from '@codeinsight/shared';
import type { IFlowTransformer } from '../base/types';

// Python 백엔드 타입 (PyStep 구조)
interface PyName {
  name: string;
  scope?: string;  // 레슨 JSON에서는 없을 수 있음 (기본값: 'local')
  pointsTo: string;
  highlight?: boolean;
}

interface PyObject {
  id: string;
  type: string;
  value: unknown;  // string (레슨 JSON) 또는 복잡한 객체 (Playground)
  mutable?: boolean;
  highlight?: boolean;
  pyId?: string;  // 실제 Python 메모리 주소 (레슨 JSON에서 사용)
}

interface PyObjectRef {
  objectId: string;
}

interface PyDictEntry {
  key: PyObjectRef;
  value: PyObjectRef;
}

/**
 * Python 값을 FlowValue로 변환
 */
function convertPyValue(value: unknown, type: string, objects: Map<string, PyObject>): FlowValue {
  if (value === null) return null;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  // list, tuple, set의 경우 - 내부 참조들의 값을 표시
  if (type === 'list' || type === 'tuple' || type === 'set') {
    const refs = value as PyObjectRef[];
    const elements = refs.map((ref) => {
      const obj = objects.get(ref.objectId);
      if (!obj) return '?';
      return formatValue(obj.value, obj.type);
    });
    if (type === 'list') return `[${elements.join(', ')}]`;
    if (type === 'tuple') return `(${elements.join(', ')})`;
    if (type === 'set') return `{${elements.join(', ')}}`;
  }

  // dict의 경우
  if (type === 'dict') {
    const entries = value as PyDictEntry[];
    const pairs = entries.map((entry) => {
      const keyObj = objects.get(entry.key.objectId);
      const valObj = objects.get(entry.value.objectId);
      const keyStr = keyObj ? formatValue(keyObj.value, keyObj.type) : '?';
      const valStr = valObj ? formatValue(valObj.value, valObj.type) : '?';
      return `${keyStr}: ${valStr}`;
    });
    return `{${pairs.join(', ')}}`;
  }

  return String(value);
}

/**
 * 값 포맷팅 (display용)
 */
function formatValue(value: unknown, type: string): string {
  if (value === null) return 'None';
  if (type === 'str') return `"${value}"`;
  if (type === 'bool') return value ? 'True' : 'False';
  return String(value);
}

export class PyTransformer implements IFlowTransformer {
  /**
   * LessonStep (Python 형식) → FlowStep 변환
   */
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep {
    const variables: FlowVariable[] = [];
    const framesMap = new Map<string, string[]>();

    // Python step 데이터 추출
    // 우선순위: pythonMemoryState > pyNames/pyObjects > names/objects
    const pyState = (step as any).pythonMemoryState;
    const names: PyName[] = pyState?.names || (step as any).pyNames || (step as any).names || [];
    const objectsArray: PyObject[] = pyState?.objects || (step as any).pyObjects || (step as any).objects || [];

    // 객체를 Map으로 변환 (빠른 조회용)
    const objectsMap = new Map<string, PyObject>();
    objectsArray.forEach((obj) => objectsMap.set(obj.id, obj));

    // 1. 객체들을 먼저 FlowVariable로 변환 (참조 대상)
    objectsArray.forEach((obj) => {
      const variable = this.objectToVariable(obj, objectsMap);
      variables.push(variable);

      // 객체 프레임에 추가 (시각적으로 별도 영역)
      const objFrameVars = framesMap.get('objects') || [];
      objFrameVars.push(variable.id);
      framesMap.set('objects', objFrameVars);
    });

    // 2. 이름들을 FlowVariable로 변환 (참조 변수)
    names.forEach((name) => {
      const obj = objectsMap.get(name.pointsTo);
      const variable = this.nameToVariable(name, obj);
      variables.push(variable);

      // 스코프별 프레임에 추가 (기본값: 'local')
      const scope = name.scope || 'local';
      const frameName = scope === 'global' ? 'global' : scope;
      const frameVars = framesMap.get(frameName) || [];
      frameVars.push(variable.id);
      framesMap.set(frameName, frameVars);
    });

    // 3. 프레임 배열 생성
    const frames: FlowFrame[] = [];

    // 'local'은 '__main__'과 동일하게 취급 (레슨 JSON 호환)
    const mainFrameIds = [
      ...(framesMap.get('__main__') || []),
      ...(framesMap.get('local') || []),
    ];

    // global → __main__ → 기타 함수 → objects 순서
    if (framesMap.has('global')) {
      frames.push({ name: 'global', variableIds: framesMap.get('global')! });
    }
    if (mainFrameIds.length > 0) {
      frames.push({ name: '__main__', variableIds: mainFrameIds });
    }
    framesMap.forEach((varIds, frameName) => {
      if (frameName !== 'global' && frameName !== '__main__' && frameName !== 'local' && frameName !== 'objects') {
        frames.push({ name: frameName, variableIds: varIds });
      }
    });
    if (framesMap.has('objects')) {
      frames.push({ name: 'Objects (Heap)', variableIds: framesMap.get('objects')! });
    }

    // __main__이 없으면 기본 추가
    if (frames.length === 0 || !frames.some((f) => f.name === '__main__')) {
      frames.unshift({ name: '__main__', variableIds: [] });
    }

    // 4. 코드 추출
    const code = step.code || (fullCode ? this.getCodeAtLine(fullCode, step.line) : '');

    // 5. 터미널 출력
    // pythonMemoryState.output은 배열일 수 있음 (예: ["140234567890", "140234567890", "True"])
    const pyOutput = pyState?.output;
    const stdout = pyOutput
      ? (Array.isArray(pyOutput) ? pyOutput.join('\n') : pyOutput)
      : ((step as any).stdout || step.output);
    const terminalOutput = stdout ? { text: stdout } : undefined;

    return {
      id: `step-${step.line}`,
      line: step.line,
      code,
      variables,
      animations: [], // Animator가 채움
      frames,
      terminalOutput,
    };
  }

  /**
   * PyObject → FlowVariable 변환 (참조 대상)
   */
  private objectToVariable(obj: PyObject, objectsMap: Map<string, PyObject>): FlowVariable {
    return {
      id: `obj-${obj.id}`,
      name: `${obj.type}@${obj.id.slice(-4)}`, // 예: "list@1234"
      value: convertPyValue(obj.value, obj.type, objectsMap),
      type: obj.type,
      state: obj.highlight ? 'updating' : 'idle',
      scope: 'objects',
      isPointer: false, // 객체 자체는 포인터가 아님
      address: obj.id,
    };
  }

  /**
   * PyName → FlowVariable 변환 (참조 변수)
   */
  private nameToVariable(name: PyName, targetObj?: PyObject): FlowVariable {
    const displayValue = targetObj
      ? formatValue(targetObj.value, targetObj.type)
      : '→';
    const scope = name.scope || 'local';

    return {
      id: `name-${scope}-${name.name}`,
      name: name.name,
      value: displayValue,
      type: targetObj?.type || 'ref',
      state: name.highlight ? 'updating' : 'idle',
      scope,
      isPointer: true, // Python 변수는 항상 참조
      pointsTo: `obj-${name.pointsTo}`, // 객체 ID와 연결
    };
  }

  /**
   * 코드에서 특정 라인 추출
   */
  private getCodeAtLine(fullCode: string, line: number): string {
    const lines = fullCode.split('\n');
    return lines[line - 1]?.trim() || '';
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
      isPointer: true, // Python은 항상 참조
      pointsTo: block.points_to || undefined,
      address: block.address,
    };
  }
}

// 싱글톤 인스턴스
export const pyTransformer = new PyTransformer();
