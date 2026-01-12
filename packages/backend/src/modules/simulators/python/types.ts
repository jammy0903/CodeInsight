/**
 * Python Simulator Types
 *
 * C와 다른 Python의 핵심 개념:
 * - 변수는 이름표 (메모리 공간이 아님)
 * - 모든 것이 객체
 * - 할당 = 참조 바인딩
 */

// =============================================
// 객체 (Objects)
// =============================================

/**
 * Python 객체 타입
 */
export type PyType =
  // 기본 타입 (Phase 1)
  | 'int'
  | 'float'
  | 'str'
  | 'bool'
  | 'NoneType'
  // 시퀀스 (Phase 1)
  | 'list'
  | 'tuple'
  // 컬렉션 (Phase 1)
  | 'dict'
  | 'set'
  // Phase 2
  | 'function'
  | 'class'
  | 'instance';

/**
 * Python 객체
 * 모든 값은 객체로 표현됨
 */
export interface PyObject {
  /** 고유 ID (객체 식별자) */
  id: string;

  /** 타입 */
  type: PyType;

  /** 값 - 타입별 다른 형태 */
  value: PyValue;

  /** 가변 여부 (list=true, tuple=false) */
  mutable: boolean;

  /** 하이라이트 여부 (시각화용) */
  highlight?: boolean;
}

/**
 * Python 값 타입
 */
export type PyValue =
  | number // int, float
  | string // str
  | boolean // bool
  | null // None
  | PyObjectRef[] // list, tuple (내부 요소는 참조)
  | PyDictEntry[] // dict
  | PyObjectRef[]; // set

/**
 * 객체 참조 (list/dict 내부 요소용)
 */
export interface PyObjectRef {
  objectId: string;
}

/**
 * dict 엔트리
 */
export interface PyDictEntry {
  key: PyObjectRef;
  value: PyObjectRef;
}

// =============================================
// 이름 (Names)
// =============================================

/**
 * Python 이름 (변수)
 * 변수는 객체를 가리키는 이름표
 */
export interface PyName {
  /** 변수명 */
  name: string;

  /** 스코프 (프레임명: 'global', '__main__', 함수명 등) */
  scope: string;

  /** 가리키는 객체 ID */
  pointsTo: string;

  /** 하이라이트 여부 */
  highlight?: boolean;
}

// =============================================
// 실행 스텝
// =============================================

/**
 * Python 실행 스텝
 */
export interface PyStep {
  /** 줄 번호 */
  line: number;

  /** 실행된 코드 */
  code: string;

  /** 설명 */
  explanation: string;

  /** 현재 이름 공간 */
  names: PyName[];

  /** 현재 객체들 */
  objects: PyObject[];

  /** 출력 (print) */
  stdout?: string;

  /** 변경 사항 (애니메이션용) */
  changes?: PyChange[];
}

/**
 * 변경 타입
 */
export interface PyChange {
  type: 'bind' | 'rebind' | 'create' | 'modify' | 'delete';
  name?: string;
  objectId?: string;
  oldObjectId?: string;
}

// =============================================
// 시뮬레이터 컨텍스트
// =============================================

/**
 * Python 시뮬레이터 컨텍스트
 */
export interface PySimContext {
  // 이름 공간
  globalNames: Map<string, PyName>;
  localNames: Map<string, PyName>;

  // 객체 공간
  objects: Map<string, PyObject>;
  nextId: number;

  // 실행 상태
  currentLine: number;

  // stdout
  stdoutBuffer: string;

  // 유틸리티 메서드
  createObject(type: PyType, value: PyValue, mutable?: boolean): PyObject;
  bindName(name: string, objectId: string, scope?: 'local' | 'global'): PyName;
  getObject(id: string): PyObject | undefined;
  appendStdout(text: string): void;
  createStep(lineNum: number, code: string, explanation: string): PyStep;
}

// =============================================
// 핸들러
// =============================================

/**
 * Python 코드 핸들러 인터페이스
 */
export interface PyCodeHandler {
  /** 핸들러 이름 */
  name: string;

  /** 우선순위 (높을수록 먼저) */
  priority: number;

  /** 처리 가능 여부 */
  canHandle(code: string): boolean;

  /** 코드 처리 */
  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null;
}
