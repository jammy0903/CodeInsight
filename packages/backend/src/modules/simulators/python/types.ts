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
  | PyObjectRef[] // list, tuple, set (내부 요소는 참조)
  | PyDictEntry[] // dict
  | PyFunctionValue // function
  | PyClassValue // class
  | PyInstanceValue; // instance

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
// 함수 & 클래스 (Phase 2)
// =============================================

/**
 * 함수 객체의 값
 */
export interface PyFunctionValue {
  /** 함수명 */
  name: string;

  /** 파라미터 목록 */
  params: PyFunctionParam[];

  /** 함수 본문 시작 줄 */
  startLine: number;

  /** 함수 본문 끝 줄 */
  endLine: number;

  /** 함수 본문 코드 */
  bodyLines: PyCodeLine[];

  /** 정의된 클래스명 (메서드인 경우) */
  className?: string;

  /**
   * 선언된 로컬 변수 목록 (본문에서 할당되는 변수들)
   * Python은 함수 실행 전에 본문을 스캔하여 로컬 변수를 미리 결정함
   * → UnboundLocalError 감지에 사용
   */
  declaredLocals: string[];
}

/**
 * 함수 파라미터
 */
export interface PyFunctionParam {
  name: string;
  defaultValue?: string;
}

/**
 * 코드 라인
 */
export interface PyCodeLine {
  lineNum: number;
  code: string;
  indent: number;
}

/**
 * 클래스 객체의 값
 */
export interface PyClassValue {
  /** 클래스명 */
  name: string;

  /** 메서드 목록 (함수 객체 ID) */
  methods: Record<string, string>;

  /** 클래스 속성 (객체 ID) */
  classAttributes: Record<string, string>;

  /** 시작 줄 */
  startLine: number;

  /** 끝 줄 */
  endLine: number;
}

/**
 * 인스턴스 객체의 값
 */
export interface PyInstanceValue {
  /** 클래스명 */
  className: string;

  /** 클래스 객체 ID */
  classId: string;

  /** 인스턴스 속성 (이름 → 객체 ID) */
  attributes: Record<string, string>;
}

/**
 * 콜스택 프레임
 */
export interface PyCallFrame {
  /** 함수명 */
  functionName: string;

  /** 로컬 네임스페이스 */
  localNames: Map<string, PyName>;

  /** 반환할 줄 번호 */
  returnLine: number;

  /** 호출 깊이 */
  depth: number;

  /** 인스턴스 (메서드 호출 시 self) */
  selfObjectId?: string;

  /**
   * 아직 바인딩되지 않은 로컬 변수들
   * 함수 진입 시 declaredLocals로 초기화되고,
   * 변수에 값이 할당되면 제거됨
   * → 접근 시 여기 있으면 UnboundLocalError
   */
  unboundLocals: Set<string>;
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

  /** 현재 콜스택 (시각화용) */
  callStack?: PyCallFrameSnapshot[];

  /** 에러 정보 (UnboundLocalError 등) */
  error?: {
    type: string;
    message: string;
    variable?: string;
  };
}

/**
 * 콜스택 프레임 스냅샷 (시각화용)
 */
export interface PyCallFrameSnapshot {
  functionName: string;
  depth: number;
  localNames: PyName[];
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

  // 콜스택
  callStack: PyCallFrame[];

  // 실행 상태
  currentLine: number;

  // stdout
  stdoutBuffer: string;

  // 유틸리티 메서드
  createObject(type: PyType, value: PyValue, mutable?: boolean): PyObject;
  bindName(name: string, objectId: string, scope?: string): PyName;
  getObject(id: string): PyObject | undefined;
  appendStdout(text: string): void;
  createStep(lineNum: number, code: string, explanation: string): PyStep;

  // 콜스택 관리 메서드
  pushFrame(frame: PyCallFrame): void;
  popFrame(): PyCallFrame | undefined;
  getCurrentFrame(): PyCallFrame | undefined;
  getCurrentScope(): string;
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

/**
 * 블록 핸들러 인터페이스 (함수, 클래스 등)
 */
export interface PyBlockHandler {
  /** 핸들러 이름 */
  name: string;

  /** 우선순위 (높을수록 먼저) */
  priority: number;

  /** 블록 시작 가능 여부 */
  canHandle(code: string): boolean;

  /** 블록 정의 처리 (def, class 등) */
  handleDefinition(
    ctx: PySimContext,
    lineNum: number,
    code: string,
    bodyLines: PyCodeLine[]
  ): PyStep | null;
}
