/**
 * JavaScript Simulator Types (Line-by-line execution)
 *
 * Python 방식과 유사하게 줄 단위 실행
 */

// =============================================
// Scope & Variables
// =============================================

/**
 * JavaScript 변수 타입
 */
export type JsVarType = 'let' | 'const' | 'var';

/**
 * JavaScript Scope
 */
export interface JsScope {
  /** Scope 이름 (global, function name 등) */
  name: string;

  /** Scope 타입 */
  type: 'global' | 'function' | 'block';

  /** 변수들 */
  variables: Record<string, any>;
}

// =============================================
// 실행 스텝
// =============================================

/**
 * JavaScript 실행 스텝
 */
export interface JsStep {
  /** 줄 번호 */
  line: number;

  /** 실행된 코드 */
  code: string;

  /** 설명 */
  explanation: string;

  /** Scope chain (stack frames) */
  stack: JsStackFrame[];

  /** Heap (참조 타입 객체들) */
  heap: JsHeapObject[];

  /** 출력 (console.log) */
  stdout?: string;

  /** visualizationState (scopeChain 형식) */
  visualizationState?: {
    type: 'scopeChain';
    data: {
      scopes: Array<{
        id: string;
        name: string;
        type: 'global' | 'function' | 'block';
        variables: Record<string, any>;
      }>;
      currentScopeId: string;
    };
  };
}

/**
 * Stack Frame
 */
export interface JsStackFrame {
  functionName: string;
  variables: Record<string, any>;
}

/**
 * Heap Object
 */
export interface JsHeapObject {
  id: string;
  type: 'Object' | 'Array' | 'Function';
  value: Record<string, any> | any[];
}

// =============================================
// 시뮬레이터 컨텍스트
// =============================================

/**
 * JavaScript 시뮬레이터 컨텍스트
 */
export interface JsSimContext {
  /** 전역 스코프 */
  globalScope: Map<string, any>;

  /** 현재 실행 라인 */
  currentLine: number;

  /** stdout 버퍼 */
  stdoutBuffer: string;

  /** Heap 객체들 */
  heap: Map<string, JsHeapObject>;
  nextHeapId: number;

  /** 유틸리티 메서드 */
  setVariable(name: string, value: any): void;
  getVariable(name: string): any;
  appendStdout(text: string): void;
  createStep(lineNum: number, code: string, explanation: string): JsStep;
  createHeapObject(type: 'Object' | 'Array' | 'Function', value: any): JsHeapObject;
}

// =============================================
// 핸들러
// =============================================

/**
 * JavaScript 코드 핸들러 인터페이스
 */
export interface JsCodeHandler {
  /** 핸들러 이름 */
  name: string;

  /** 우선순위 (높을수록 먼저) */
  priority: number;

  /** 처리 가능 여부 */
  canHandle(code: string): boolean;

  /** 코드 처리 */
  handle(ctx: JsSimContext, lineNum: number, code: string): JsStep | null;
}
