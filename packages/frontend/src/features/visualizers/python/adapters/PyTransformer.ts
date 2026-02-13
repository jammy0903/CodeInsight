/**
 * PyTransformer - Python Language Transformer
 *
 * PyStep (names/objects) → FlowStep 변환
 * - Lesson JSON과 Playground 모두 동일한 names/objects 포맷 사용
 * - Names → FlowVariable (isPointer: true)
 * - Objects → 참조 대상 (pointsTo로 연결)
 */

import type { LessonStep, FlowStep, FlowVariable, FlowFrame, FlowValue } from '@codeinsight/shared';
import type { IFlowTransformer } from '../../shared/adapters/types';

// Python names/objects 타입
interface PyName {
  name: string;
  scope?: string;
  pointsTo: string;
  highlight?: boolean;
}

interface PyObject {
  id: string;
  type: string;
  value: unknown;
  mutable?: boolean;
  highlight?: boolean;
  pyId?: string;
}

interface PyObjectRef {
  objectId: string;
}

interface PyDictEntry {
  key: PyObjectRef;
  value: PyObjectRef;
}

interface PyFunctionValue {
  name: string;
  params: { name: string; defaultValue?: string }[];
  startLine?: number;
  endLine?: number;
  bodyLines?: { lineNum: number; code: string; indent: number }[];
  className?: string;
}

interface PyClassValue {
  name: string;
  methods?: Record<string, string>;
  classAttributes?: Record<string, string>;
  startLine?: number;
  endLine?: number;
}

interface PyInstanceValue {
  className: string;
  classId?: string;
  attributes: Record<string, string>;
}

interface PyCallFrameSnapshot {
  functionName: string;
  depth: number;
  localNames: PyName[];
}

/**
 * Python 값을 FlowValue로 변환
 * Lesson JSON과 Playground 모두 {objectId: "..."} 참조 형태를 사용
 */
function convertPyValue(value: unknown, type: string, objects: Map<string, PyObject>): FlowValue {
  if (value === null) return null;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  // list, tuple, set — 원소는 {objectId} 참조 배열
  if (type === 'list' || type === 'tuple' || type === 'set') {
    if (!Array.isArray(value)) return String(value);
    const elements = (value as PyObjectRef[]).map((ref) => {
      if (!ref?.objectId) return String(ref);
      const obj = objects.get(ref.objectId);
      if (!obj) return '?';
      return formatValue(obj.value, obj.type);
    });
    if (type === 'list') return `[${elements.join(', ')}]`;
    if (type === 'tuple') return `(${elements.join(', ')})`;
    if (type === 'set') return `{${elements.join(', ')}}`;
  }

  // dict — {key: {objectId}, value: {objectId}} 배열
  if (type === 'dict') {
    if (!Array.isArray(value)) return String(value);
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

  // function
  if (type === 'function') {
    const funcValue = value as PyFunctionValue;
    const params = funcValue.params.map((p) => p.name).join(', ');
    const prefix = funcValue.className ? `${funcValue.className}.` : '';
    return `${prefix}${funcValue.name}(${params})`;
  }

  // class
  if (type === 'class') {
    const classValue = value as PyClassValue;
    const methodCount = classValue.methods ? Object.keys(classValue.methods).length : 0;
    return `class ${classValue.name} [${methodCount} methods]`;
  }

  // instance
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
  if (type === 'NoneType') return 'None';
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
   * LessonStep → FlowStep 변환
   *
   * Lesson JSON과 Playground 모두 동일한 names/objects/callStack 포맷:
   * - callStack이 있으면 → 동적 프레임 (함수 호출/반환 시 생성/삭제)
   * - callStack이 없으면 → 정적 프레임 (레슨 JSON 호환)
   */
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep {
    const variables: FlowVariable[] = [];

    // 데이터 추출 (Lesson/Playground 동일 경로)
    // 우선순위: pythonMemoryState > pyNames/pyObjects > names/objects
    const pyState = (step as any).pythonMemoryState;
    const names: PyName[] = pyState?.names || (step as any).pyNames || (step as any).names || [];
    const objectsArray: PyObject[] = pyState?.objects || (step as any).pyObjects || (step as any).objects || [];
    const callStack: PyCallFrameSnapshot[] = pyState?.callStack || (step as any).callStack || [];

    // 객체를 Map으로 변환 (빠른 조회용)
    const objectsMap = new Map<string, PyObject>();
    objectsArray.forEach((obj) => objectsMap.set(obj.id, obj));

    // 1. 객체들을 FlowVariable로 변환 (참조 대상)
    objectsArray.forEach((obj) => {
      const variable: FlowVariable = {
        id: `obj-${obj.id}`,
        name: obj.type,
        value: convertPyValue(obj.value, obj.type, objectsMap),
        type: obj.type,
        state: obj.highlight ? 'updating' : 'idle',
        scope: 'objects',
      };
      variables.push(variable);
    });

    // 2. 이름들을 FlowVariable로 변환 (참조 변수)
    const nameVarMap = new Map<string, FlowVariable>();
    names.forEach((name) => {
      const obj = objectsMap.get(name.pointsTo);
      const variable = this.nameToVariable(name, obj);
      variables.push(variable);
      const scope = name.scope || 'global';
      nameVarMap.set(`${scope}-${name.name}`, variable);
    });

    // 3. 프레임 생성 (콜스택 기반 or 정적)
    const frames: FlowFrame[] = [];

    if (callStack.length > 0) {
      // === 콜스택 기반 프레임 생성 (동적) ===

      // 3-1. 글로벌 프레임
      const globalVarIds: string[] = [];
      names.forEach((name) => {
        if (name.scope === 'global' || !name.scope) {
          const varKey = `${name.scope || 'global'}-${name.name}`;
          const variable = nameVarMap.get(varKey);
          if (variable && !globalVarIds.includes(variable.id)) {
            globalVarIds.push(variable.id);
          }
        }
      });

      if (globalVarIds.length > 0) {
        frames.push({ name: 'global', variableIds: globalVarIds });
      }

      // 3-2. 콜스택 프레임들 (depth 순서)
      const sortedCallStack = [...callStack].sort((a, b) => a.depth - b.depth);

      sortedCallStack.forEach((frame) => {
        const frameVarIds: string[] = [];
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

    } else {
      // === 정적 프레임 생성 (레슨 JSON 호환) ===
      const framesMap = new Map<string, string[]>();

      names.forEach((name) => {
        const scope = name.scope || 'global';
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

      if (framesMap.has('global')) {
        frames.push({ name: 'global', variableIds: framesMap.get('global')! });
      }
      if (mainFrameIds.length > 0) {
        frames.push({ name: '__main__', variableIds: mainFrameIds });
      }
      framesMap.forEach((varIds, frameName) => {
        if (frameName !== 'global' && frameName !== '__main__' && frameName !== 'local') {
          frames.push({ name: frameName, variableIds: varIds });
        }
      });

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
      animations: [],
      frames,
      terminalOutput,
    };
  }

  /**
   * PyName → FlowVariable 변환 (참조 변수)
   */
  private nameToVariable(name: PyName, targetObj?: PyObject): FlowVariable {
    const displayValue = targetObj
      ? formatValue(targetObj.value, targetObj.type)
      : '→';
    const scope = name.scope || 'global';

    return {
      id: `name-${scope}-${name.name}`,
      name: name.name,
      value: displayValue,
      type: targetObj?.type || 'ref',
      state: name.highlight ? 'updating' : 'idle',
      scope,
      isPointer: true,
      pointsTo: `obj-${name.pointsTo}`,
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
   * MemoryBlock 유사 객체 → FlowVariable 변환 (IFlowTransformer 인터페이스)
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
      isPointer: true,
      pointsTo: block.points_to || undefined,
      address: block.address,
    };
  }
}

// 싱글톤 인스턴스
export const pyTransformer = new PyTransformer();
