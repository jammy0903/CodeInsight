/**
 * Python Simulator Context
 *
 * 시뮬레이터의 상태를 관리하는 컨텍스트
 * - 이름 공간 (Names)
 * - 객체 공간 (Objects)
 * - stdout 버퍼
 */

import type {
  PySimContext,
  PyObject,
  PyName,
  PyType,
  PyValue,
  PyStep,
} from './types';

/**
 * PySimContext 구현체 생성
 */
export function createPyContext(): PySimContext {
  let nextId = 1;
  const globalNames = new Map<string, PyName>();
  const localNames = new Map<string, PyName>();
  const objects = new Map<string, PyObject>();
  let stdoutBuffer = '';
  let currentLine = 0;

  const ctx: PySimContext = {
    globalNames,
    localNames,
    objects,
    get nextId() {
      return nextId;
    },
    set nextId(val: number) {
      nextId = val;
    },
    get currentLine() {
      return currentLine;
    },
    set currentLine(val: number) {
      currentLine = val;
    },
    get stdoutBuffer() {
      return stdoutBuffer;
    },

    /**
     * 객체 생성
     */
    createObject(type: PyType, value: PyValue, mutable = true): PyObject {
      const id = `obj_${nextId++}`;
      const obj: PyObject = {
        id,
        type,
        value,
        mutable: getMutability(type, mutable),
      };
      objects.set(id, obj);
      return obj;
    },

    /**
     * 이름 바인딩
     * @param scope - 프레임명 (예: 'global', '__main__', 함수명)
     */
    bindName(name: string, objectId: string, scope: string = '__main__'): PyName {
      const pyName: PyName = {
        name,
        scope,
        pointsTo: objectId,
      };

      // 'global' scope는 globalNames에, 나머지는 localNames에
      if (scope === 'global') {
        globalNames.set(name, pyName);
      } else {
        localNames.set(name, pyName);
      }

      return pyName;
    },

    /**
     * 객체 조회
     */
    getObject(id: string): PyObject | undefined {
      return objects.get(id);
    },

    /**
     * stdout 추가
     */
    appendStdout(text: string): void {
      stdoutBuffer += text;
    },

    /**
     * 스텝 생성
     */
    createStep(lineNum: number, code: string, explanation: string): PyStep {
      // 현재 상태 스냅샷
      const allNames = [
        ...Array.from(globalNames.values()),
        ...Array.from(localNames.values()),
      ];

      const allObjects = Array.from(objects.values());

      const step: PyStep = {
        line: lineNum,
        code,
        explanation,
        names: allNames,
        objects: allObjects,
      };

      // stdout이 있으면 추가하고 버퍼 클리어
      if (stdoutBuffer) {
        step.stdout = stdoutBuffer;
        stdoutBuffer = '';
      }

      return step;
    },
  };

  return ctx;
}

/**
 * 타입별 기본 가변성 결정
 */
function getMutability(type: PyType, defaultMutable: boolean): boolean {
  // 불변 타입
  const immutableTypes: PyType[] = ['int', 'float', 'str', 'bool', 'NoneType', 'tuple'];

  if (immutableTypes.includes(type)) {
    return false;
  }

  return defaultMutable;
}

/**
 * 이름으로 객체 조회 (이름 → 객체)
 */
export function getObjectByName(ctx: PySimContext, name: string): PyObject | undefined {
  // 먼저 로컬에서 찾기
  const localName = ctx.localNames.get(name);
  if (localName) {
    return ctx.objects.get(localName.pointsTo);
  }

  // 글로벌에서 찾기
  const globalName = ctx.globalNames.get(name);
  if (globalName) {
    return ctx.objects.get(globalName.pointsTo);
  }

  return undefined;
}

/**
 * 이름 조회
 */
export function getName(ctx: PySimContext, name: string): PyName | undefined {
  return ctx.localNames.get(name) ?? ctx.globalNames.get(name);
}
