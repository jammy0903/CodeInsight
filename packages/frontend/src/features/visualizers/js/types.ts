/**
 * JavaScript Visualization Types
 * JavaScript 전용 시각화 타입 정의
 */

import type {
  SharedVisualizationType,
  CallStackState,
  ScopeChainState,
} from '../shared/types';

// ============================================
// JavaScript 전용 시각화 타입
// ============================================

export type JSOnlyVisualizationType =
  | 'eventLoop'      // 이벤트 루프
  | 'closure'        // 클로저 환경 캡처
  | 'prototype'      // 프로토타입 체인
  | 'thisBind'       // this 바인딩
  | 'hoisting'       // 호이스팅 코드 변환
  | 'promise';       // Promise 상태

// 공통 + JS 전용 합치기
export type JSVisualizationType = SharedVisualizationType | JSOnlyVisualizationType;

// ============================================
// Event Loop 상태
// ============================================

export type EventLoopPhase =
  | 'idle'                // 대기 중
  | 'executing'           // 콜스택 실행 중
  | 'checkingMicrotasks'  // 마이크로태스크 확인 중
  | 'checkingTasks';      // 태스크 확인 중

export interface WebApiItem {
  id: string;
  name: string;
  delay?: number;         // setTimeout 등의 지연 시간
  status: 'waiting' | 'ready';
  startTime?: number;     // 등록 시간 (애니메이션용)
}

export interface EventLoopState {
  callStack: string[];              // 콜스택 (함수명 배열)
  webApis: WebApiItem[];            // Web API 영역
  taskQueue: string[];              // Task Queue (Macrotask)
  microtaskQueue: string[];         // Microtask Queue
  output: string[];                 // console.log 출력
  currentPhase: EventLoopPhase;
  highlightArea?: 'callStack' | 'webApis' | 'taskQueue' | 'microtaskQueue';
}

// ============================================
// Closure 상태
// ============================================

export interface CapturedVariable {
  name: string;
  value: unknown;
  fromScope: string;      // 어느 스코프에서 캡처했는지
}

export interface ClosureEnvironment {
  scopeName: string;
  variables: Record<string, unknown>;
}

export interface ClosureState {
  outerFunction: string;
  innerFunction: string;
  capturedVariables: CapturedVariable[];
  environmentChain: ClosureEnvironment[];
  isOuterCompleted: boolean;    // 외부 함수 실행 완료 여부
}

// ============================================
// Prototype Chain 상태
// ============================================

export interface PrototypeNode {
  name: string;
  properties: string[];
  isNative?: boolean;     // Object.prototype 등 네이티브 객체
}

export interface PrototypeChainState {
  instance: {
    name: string;
    ownProperties: string[];
  };
  chain: PrototypeNode[];
  lookupProperty?: string;    // 탐색 중인 속성
  lookupPath?: number[];      // 탐색 경로 인덱스
}

// ============================================
// this Binding 상태
// ============================================

export type ThisBindingType =
  | 'default'    // 전역 (strict mode에서 undefined)
  | 'implicit'   // obj.method() 호출
  | 'explicit'   // call, apply, bind
  | 'new'        // new 연산자
  | 'arrow';     // 화살표 함수 (렉시컬)

export interface ThisBindingState {
  bindingType: ThisBindingType;
  thisValue: string;
  callSite: string;           // 호출 코드
  explanation: string;        // 설명
  isStrictMode?: boolean;
}

// ============================================
// Hoisting 상태
// ============================================

export interface HoistedDeclaration {
  name: string;
  type: 'var' | 'function' | 'let' | 'const';
  originalLine: number;
  hoistedLine: number;
  inTDZ?: boolean;            // Temporal Dead Zone
}

export interface HoistingState {
  originalCode: string;
  transformedCode: string;
  hoistedDeclarations: HoistedDeclaration[];
  currentLine?: number;       // 현재 실행 줄
}

// ============================================
// Promise 상태
// ============================================

export type PromiseStatus = 'pending' | 'fulfilled' | 'rejected';

export interface PromiseItem {
  id: string;
  status: PromiseStatus;
  value?: unknown;
  reason?: string;
  thenCallbacks?: string[];
}

export interface PromiseState {
  promises: PromiseItem[];
  eventLoopState: EventLoopState;   // Promise는 Event Loop와 함께 표시
}

// ============================================
// Union Type (모든 JS 시각화 상태)
// ============================================

export type JSVisualizationState =
  | { type: 'callStack'; data: CallStackState }
  | { type: 'scopeChain'; data: ScopeChainState }
  | { type: 'eventLoop'; data: EventLoopState }
  | { type: 'closure'; data: ClosureState }
  | { type: 'prototype'; data: PrototypeChainState }
  | { type: 'thisBind'; data: ThisBindingState }
  | { type: 'hoisting'; data: HoistingState }
  | { type: 'promise'; data: PromiseState };

// ============================================
// Props 인터페이스
// ============================================

export interface JSVisualizerViewProps {
  type: JSVisualizationType;
  state: JSVisualizationState;
}

export interface EventLoopViewProps {
  state: EventLoopState;
  animate?: boolean;
  showOutput?: boolean;
}

export interface ClosureViewProps {
  state: ClosureState;
}

export interface PrototypeChainViewProps {
  state: PrototypeChainState;
  animate?: boolean;
}

export interface ThisBindingViewProps {
  state: ThisBindingState;
}

export interface HoistingViewProps {
  state: HoistingState;
  showComparison?: boolean;
}
