/**
 * C Simulator Types
 * C 언어 시뮬레이터 전용 타입
 *
 * 설계 문서: docs/logic/SIMULATOR_EXTENSION.md (Part 1, Section 3)
 */

import type { BaseStep, BaseChange, HexAddress } from './simulator';
import type { MemoryBlock } from '@codeinsight/shared';

// ============================================================
// 메모리 세그먼트
// ============================================================

/** 메모리 세그먼트 타입 */
export type CSegmentType = 'stack' | 'heap' | 'data' | 'code';

// CMemoryBlock removed - use MemoryBlock from @codeinsight/shared instead

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
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  data: MemoryBlock[];
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

// CStep removed - use LessonStep from @codeinsight/shared instead
// PyName, PyObject removed - use types from py-simulator.ts instead

// CCodeHandler removed - C handlers are backend-only (not used in frontend)
