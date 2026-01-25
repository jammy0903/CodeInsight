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
  PyCallFrame,
  PyCallFrameSnapshot,
} from './types';

/**
 * PySimContext 구현체 생성
 */
export function createPyContext(): PySimContext {
  let nextId = 1;
  const globalNames = new Map<string, PyName>();
  const localNames = new Map<string, PyName>();
  const objects = new Map<string, PyObject>();
  const callStack: PyCallFrame[] = [];
  let stdoutBuffer = '';
  let currentLine = 0;

  const ctx: PySimContext = {
    globalNames,
    localNames,
    objects,
    callStack,
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
    bindName(name: string, objectId: string, scope?: string): PyName {
      // scope가 지정되지 않으면 현재 스코프 사용
      const actualScope = scope ?? ctx.getCurrentScope();

      const pyName: PyName = {
        name,
        scope: actualScope,
        pointsTo: objectId,
      };

      // 콜스택이 있으면 현재 프레임의 localNames에 저장
      const currentFrame = ctx.getCurrentFrame();
      if (currentFrame && actualScope === currentFrame.functionName) {
        currentFrame.localNames.set(name, pyName);
      } else if (actualScope === 'global' || actualScope === '__main__') {
        // 글로벌 스코프
        globalNames.set(name, pyName);
      } else {
        // 기본: localNames에 저장
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
     * 콜스택 프레임 푸시
     */
    pushFrame(frame: PyCallFrame): void {
      callStack.push(frame);
    },

    /**
     * 콜스택 프레임 팝
     */
    popFrame(): PyCallFrame | undefined {
      return callStack.pop();
    },

    /**
     * 현재 콜스택 프레임 가져오기
     */
    getCurrentFrame(): PyCallFrame | undefined {
      return callStack.length > 0 ? callStack[callStack.length - 1] : undefined;
    },

    /**
     * 현재 스코프 이름 가져오기
     */
    getCurrentScope(): string {
      const frame = ctx.getCurrentFrame();
      return frame ? frame.functionName : 'global';
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

      // 콜스택의 로컬 변수도 포함
      for (const frame of callStack) {
        allNames.push(...Array.from(frame.localNames.values()));
      }

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

      // 콜스택 스냅샷 추가
      if (callStack.length > 0) {
        step.callStack = callStack.map((frame): PyCallFrameSnapshot => ({
          functionName: frame.functionName,
          depth: frame.depth,
          localNames: Array.from(frame.localNames.values()),
        }));
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
 * 이름 조회 (콜스택 고려)
 */
export function getName(ctx: PySimContext, name: string): PyName | undefined {
  // 1. 현재 프레임의 로컬 변수에서 찾기
  const currentFrame = ctx.getCurrentFrame();
  if (currentFrame) {
    const localName = currentFrame.localNames.get(name);
    if (localName) return localName;
  }

  // 2. 기존 localNames에서 찾기
  const local = ctx.localNames.get(name);
  if (local) return local;

  // 3. globalNames에서 찾기
  return ctx.globalNames.get(name);
}

/**
 * 이름으로 객체 조회 (콜스택 고려)
 */
export function resolveNameToObject(ctx: PySimContext, name: string): { pyName: PyName; object: PyObject } | undefined {
  const pyName = getName(ctx, name);
  if (!pyName) return undefined;

  const object = ctx.getObject(pyName.pointsTo);
  if (!object) return undefined;

  return { pyName, object };
}
