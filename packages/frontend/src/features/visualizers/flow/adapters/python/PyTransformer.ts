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

// Phase 2: 함수/클래스 타입
interface PyFunctionValue {
  name: string;
  params: { name: string; defaultValue?: string }[];
  startLine: number;
  endLine: number;
  bodyLines: { lineNum: number; code: string; indent: number }[];
  className?: string;
}

interface PyClassValue {
  name: string;
  methods: Record<string, string>;
  classAttributes: Record<string, string>;
  startLine: number;
  endLine: number;
}

interface PyInstanceValue {
  className: string;
  classId: string;
  attributes: Record<string, string>;
}

interface PyCallFrameSnapshot {
  functionName: string;
  depth: number;
  localNames: PyName[];
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

  // function의 경우
  if (type === 'function') {
    const funcValue = value as PyFunctionValue;
    const params = funcValue.params.map((p) => p.name).join(', ');
    const prefix = funcValue.className ? `${funcValue.className}.` : '';
    return `${prefix}${funcValue.name}(${params})`;
  }

  // class의 경우
  if (type === 'class') {
    const classValue = value as PyClassValue;
    const methodNames = Object.keys(classValue.methods);
    return `class ${classValue.name} [${methodNames.length} methods]`;
  }

  // instance의 경우
  if (type === 'instance') {
    const instanceValue = value as PyInstanceValue;
    const attrCount = Object.keys(instanceValue.attributes).length;
    return `${instanceValue.className} instance (${attrCount} attrs)`;
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
  if (type === 'function') {
    const funcValue = value as PyFunctionValue;
    return `<function ${funcValue.name}>`;
  }
  if (type === 'class') {
    const classValue = value as PyClassValue;
    return `<class '${classValue.name}'>`;
  }
  if (type === 'instance') {
    const instanceValue = value as PyInstanceValue;
    return `<${instanceValue.className} instance>`;
  }
  return String(value);
}

export class PyTransformer implements IFlowTransformer {
  /**
   * LessonStep (Python 형식) → FlowStep 변환
   *
   * 콜스택 기반 프레임 생성:
   * - callStack이 있으면 → 동적 프레임 (함수 호출/반환 시 생성/삭제)
   * - callStack이 없으면 → 정적 프레임 (레슨 JSON 호환)
   */
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep {
    const variables: FlowVariable[] = [];

    // Python step 데이터 추출
    // 우선순위: pythonMemoryState > pyNames/pyObjects > names/objects
    const pyState = (step as any).pythonMemoryState;
    const names: PyName[] = pyState?.names || (step as any).pyNames || (step as any).names || [];
    const objectsArray: PyObject[] = pyState?.objects || (step as any).pyObjects || (step as any).objects || [];
    const callStack: PyCallFrameSnapshot[] = (step as any).callStack || [];

    // 객체를 Map으로 변환 (빠른 조회용)
    const objectsMap = new Map<string, PyObject>();
    objectsArray.forEach((obj) => objectsMap.set(obj.id, obj));

    // 1. 객체들을 먼저 FlowVariable로 변환 (참조 대상)
    const objectVarIds: string[] = [];
    objectsArray.forEach((obj) => {
      const variable = this.objectToVariable(obj, objectsMap);
      variables.push(variable);
      objectVarIds.push(variable.id);
    });

    // 2. 이름들을 FlowVariable로 변환 (참조 변수)
    const nameVarMap = new Map<string, FlowVariable>();
    names.forEach((name) => {
      const obj = objectsMap.get(name.pointsTo);
      const variable = this.nameToVariable(name, obj);
      variables.push(variable);
      // scope-name을 키로 저장 (콜스택에서 찾기 위해)
      const scope = name.scope || 'global';
      nameVarMap.set(`${scope}-${name.name}`, variable);
    });

    // 3. 프레임 생성 (콜스택 기반 or 정적)
    const frames: FlowFrame[] = [];

    if (callStack.length > 0) {
      // === 콜스택 기반 프레임 생성 (동적) ===

      // 3-1. 글로벌 프레임 (글로벌 스코프 변수들)
      const globalVarIds: string[] = [];
      names.forEach((name) => {
        if (name.scope === 'global' || !name.scope) {
          // 콜스택에 속하지 않는 글로벌 변수
          const isInCallStack = callStack.some((frame) =>
            frame.localNames.some((ln) => ln.name === name.name)
          );
          if (!isInCallStack || name.scope === 'global') {
            const varKey = `${name.scope || 'global'}-${name.name}`;
            const variable = nameVarMap.get(varKey);
            if (variable && !globalVarIds.includes(variable.id)) {
              globalVarIds.push(variable.id);
            }
          }
        }
      });

      if (globalVarIds.length > 0) {
        frames.push({ name: 'global', variableIds: globalVarIds });
      }

      // 3-2. 콜스택 프레임들 (depth 순서로 - 아래가 먼저 호출된 것)
      const sortedCallStack = [...callStack].sort((a, b) => a.depth - b.depth);

      sortedCallStack.forEach((frame) => {
        const frameVarIds: string[] = [];

        // 프레임의 로컬 변수들
        frame.localNames.forEach((localName) => {
          const varKey = `${frame.functionName}-${localName.name}`;
          const variable = nameVarMap.get(varKey);
          if (variable) {
            frameVarIds.push(variable.id);
          }
        });

        frames.push({
          name: frame.functionName,
          variableIds: frameVarIds,
        });
      });

      // 3-3. Objects(Heap) 프레임
      if (objectVarIds.length > 0) {
        frames.push({ name: 'Objects (Heap)', variableIds: objectVarIds });
      }

    } else {
      // === 정적 프레임 생성 (레슨 JSON 호환) ===
      const framesMap = new Map<string, string[]>();

      // 객체 프레임
      framesMap.set('objects', objectVarIds);

      // 스코프별 프레임
      names.forEach((name) => {
        const scope = name.scope || 'local';
        const frameName = scope === 'global' ? 'global' : scope;
        const varKey = `${scope}-${name.name}`;
        const variable = nameVarMap.get(varKey);
        if (variable) {
          const frameVars = framesMap.get(frameName) || [];
          frameVars.push(variable.id);
          framesMap.set(frameName, frameVars);
        }
      });

      // 'local'은 '__main__'과 동일하게 취급
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
      if (framesMap.has('objects') && framesMap.get('objects')!.length > 0) {
        frames.push({ name: 'Objects (Heap)', variableIds: framesMap.get('objects')! });
      }

      // __main__이 없으면 기본 추가
      if (frames.length === 0 || !frames.some((f) => f.name === '__main__' || f.name === 'global')) {
        frames.unshift({ name: '__main__', variableIds: [] });
      }
    }

    // 4. 코드 추출
    const code = step.code || (fullCode ? this.getCodeAtLine(fullCode, step.line) : '');

    // 5. 터미널 출력
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
    // 함수, 클래스, 인스턴스는 더 의미있는 이름 사용
    let displayName = `${obj.type}@${obj.id.slice(-4)}`;

    if (obj.type === 'function') {
      const funcValue = obj.value as PyFunctionValue;
      const prefix = funcValue.className ? `${funcValue.className}.` : '';
      displayName = `${prefix}${funcValue.name}()`;
    } else if (obj.type === 'class') {
      const classValue = obj.value as PyClassValue;
      displayName = `class ${classValue.name}`;
    } else if (obj.type === 'instance') {
      const instanceValue = obj.value as PyInstanceValue;
      displayName = `${instanceValue.className} instance`;
    }

    return {
      id: `obj-${obj.id}`,
      name: displayName,
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
