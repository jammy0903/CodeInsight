/**
 * C Simulator Types
 * C 언어 시뮬레이터 전용 타입
 *
 * 설계 문서: docs/logic/SIMULATOR_EXTENSION.md (Part 1, Section 3)
 */

import type { BaseStep, BaseChange, HexAddress } from './simulator';

// ============================================================
// 메모리 세그먼트
// ============================================================

/** 메모리 세그먼트 타입 */
export type CSegmentType = 'stack' | 'heap' | 'data' | 'code';

/** 메모리 블록 */
export interface CMemoryBlock {
  /** 메모리 주소 (16진수) */
  address: HexAddress;

  /** 변수명 */
  name: string;

  /** 타입 (int, char*, struct Point 등) */
  type: string;

  /** 값 (문자열로 표현) */
  value: string;

  /** 크기 (바이트) */
  size: number;

  /** 세그먼트 */
  segment: CSegmentType;

  /** 포인터가 가리키는 주소 (포인터인 경우) */
  points_to?: HexAddress;
}

// ============================================================
// 함수 정의 (Phase 2)
// ============================================================

/** 함수 파라미터 */
export interface CParamDef {
  name: string;
  type: string;
}

/** 함수 정의 */
export interface CFunctionDef {
  /** 함수명 */
  name: string;

  /** 반환 타입 */
  returnType: string;

  /** 파라미터 목록 */
  params: CParamDef[];

  /** 함수 시작 줄 */
  startLine: number;

  /** 함수 끝 줄 */
  endLine: number;

  /** Code 세그먼트 주소 */
  address: HexAddress;

  /** 함수 본문 (줄 배열) */
  body: string[];
}

// ============================================================
// 콜스택 (Phase 2)
// ============================================================

/** 콜스택 프레임 */
export interface CCallFrame {
  /** 현재 실행 중인 함수명 */
  functionName: string;

  /** 복귀할 줄 번호 */
  returnAddress: number;

  /** 복귀할 함수명 */
  returnTo: string;

  /** 이전 rbp 값 */
  savedRbp: HexAddress;

  /** 이 프레임의 지역변수들 */
  localVars: string[];
}

// ============================================================
// 구조체 (Phase 2)
// ============================================================

/** 구조체 필드 */
export interface CFieldDef {
  name: string;
  type: string;
  offset: number;
  size: number;
}

/** 구조체 정의 */
export interface CStructDef {
  name: string;
  size: number;
  fields: CFieldDef[];
}

// ============================================================
// 시뮬레이터 컨텍스트
// ============================================================

/** 변수 정보 */
export interface CVariable {
  address: HexAddress;
  type: string;
  value: string;
  size: number;
  segment: CSegmentType;
  points_to?: HexAddress;
}

/** C 시뮬레이터 컨텍스트 */
export interface CSimContext {
  // === 메모리 세그먼트 ===
  stack: CMemoryBlock[];
  heap: CMemoryBlock[];
  data: CMemoryBlock[];
  code: CFunctionDef[];

  // === 주소 관리 ===
  stackPointer: number;
  heapPointer: number;
  dataPointer: number;

  // === 변수 매핑 ===
  variables: Map<string, CVariable>;

  // === 콜스택 (Phase 2) ===
  callStack: CCallFrame[];
  currentFunction: string;

  // === 구조체 정의 (Phase 2) ===
  structDefs: Map<string, CStructDef>;

  // === stdin 버퍼 ===
  stdinBuffer: string[];
  stdinIndex: number;

  // === stdout 출력 ===
  stdout: string;
}

// ============================================================
// 스텝 & 변경사항
// ============================================================

/** C 변경 사항 타입 */
export type CChangeType = 'alloc' | 'free' | 'modify' | 'pointer';

/** C 변경 사항 */
export interface CChange extends BaseChange {
  type: CChangeType;
  target: string; // 변수명 또는 주소
  oldValue?: string;
  newValue?: string;
}

/** C 시뮬레이션 스텝 */
export interface CStep extends BaseStep {
  /** Stack 메모리 상태 */
  stack: CMemoryBlock[];

  /** Heap 메모리 상태 */
  heap: CMemoryBlock[];

  /** Data 세그먼트 상태 (Phase 2) */
  data: CMemoryBlock[];

  /** stdout 출력 */
  stdout?: string;

  /** 이 스텝에서의 변경사항 */
  changes: CChange[];
}

// ============================================================
// 핸들러 타입
// ============================================================

import type { CodeHandler } from './simulator';

/** C 코드 핸들러 타입 */
export type CCodeHandler = CodeHandler<CSimContext, CStep>;
