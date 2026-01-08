/**
 * Simulator Common Interfaces
 * C, Python, Java 모든 시뮬레이터의 공통 인터페이스
 *
 * 설계 문서: docs/logic/SIMULATOR_EXTENSION.md (Part 3, Section 16)
 */

// ============================================================
// 시뮬레이터 공통 인터페이스
// ============================================================

/**
 * 시뮬레이터 인터페이스
 * 모든 언어별 시뮬레이터가 구현해야 함
 */
export interface Simulator<TContext, TStep> {
  /** 코드로 컨텍스트 초기화 */
  init(code: string): TContext;

  /** 한 줄 실행하여 스텝 생성 */
  step(ctx: TContext, lineNum: number): TStep | null;

  /** 전체 코드 시뮬레이션 (모든 스텝 생성) */
  simulate(code: string): TStep[];

  /** 컨텍스트 리셋 */
  reset(): TContext;
}

/**
 * 코드 핸들러 인터페이스
 * 특정 패턴의 코드를 처리
 */
export interface CodeHandler<TContext, TStep> {
  /** 핸들러 이름 (디버깅용) */
  name: string;

  /** 우선순위 (높을수록 먼저 검사) */
  priority: number;

  /** 이 핸들러가 처리할 수 있는 코드인지 확인 */
  canHandle(code: string, ctx: TContext): boolean;

  /** 코드 처리하여 스텝 생성 */
  handle(ctx: TContext, lineNum: number, code: string): TStep | null;
}

/**
 * 핸들러 레지스트리 인터페이스
 * 핸들러들을 관리하고 적절한 핸들러 찾기
 */
export interface HandlerRegistry<TContext, TStep> {
  /** 등록된 핸들러 목록 */
  handlers: CodeHandler<TContext, TStep>[];

  /** 핸들러 등록 */
  register(handler: CodeHandler<TContext, TStep>): void;

  /** 코드를 처리할 수 있는 핸들러 찾기 (우선순위 순) */
  findHandler(code: string, ctx: TContext): CodeHandler<TContext, TStep> | null;
}

// ============================================================
// 공통 타입
// ============================================================

/** 지원 언어 */
export type SupportedLanguage = 'c' | 'python' | 'java';

/** 변경 사항 기본 타입 */
export interface BaseChange {
  type: string;
  target?: string;
}

/** 기본 스텝 인터페이스 */
export interface BaseStep {
  line: number;
  code: string;
  explanation: string;
}

// ============================================================
// 유틸리티 타입
// ============================================================

/** 16진수 주소 문자열 */
export type HexAddress = string; // e.g., "0x7fff0000"

/** 객체 ID 문자열 */
export type ObjectId = string; // e.g., "obj_1"
