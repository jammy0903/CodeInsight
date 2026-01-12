/**
 * Python Simulator Types
 * Python Object Reference 시각화 전용 타입
 *
 * 설계 문서: docs/logic/SIMULATOR_EXTENSION.md (Part 2, Section 9-11)
 */

import type { BaseStep, BaseChange, ObjectId } from './simulator';

// ============================================================
// 객체 타입
// ============================================================

/** Python 기본 타입 */
export type PyPrimitiveType = 'int' | 'float' | 'str' | 'bool' | 'NoneType';

/** Python 컬렉션 타입 */
export type PyCollectionType = 'list' | 'tuple' | 'dict' | 'set';

/** Python Phase 2 타입 */
export type PyAdvancedType = 'function' | 'class' | 'instance';

/** 모든 Python 타입 */
export type PyType = PyPrimitiveType | PyCollectionType | PyAdvancedType;

/** Python 기본값 */
export type PyPrimitiveValue = number | string | boolean | null;

/** Python 객체 참조 */
export interface PyObjectRef {
  objectId: string;
}

/** Python 값 타입 */
export type PyValue =
  | PyPrimitiveValue // int, float, str, bool, None
  | PyObjectRef[] // list, tuple
  | Map<string, PyObjectRef> // dict
  | Set<PyObjectRef>; // set

// ============================================================
// 이름 & 객체
// ============================================================

/** 스코프 타입 (프레임명: 'global', '__main__', 함수명 등) */
export type PyScope = string;

/** Python 이름 (변수명) */
export interface PyName {
  /** 변수명 */
  name: string;

  /** 스코프 */
  scope: PyScope;

  /** 참조하는 객체 ID */
  pointsTo: ObjectId;
}

/** Python 객체 */
export interface PyObject {
  /** 고유 ID (obj_1, obj_2, ...) */
  id: ObjectId;

  /** 타입 */
  type: PyType;

  /** 값 */
  value: PyValue;

  /** 가변성 (list=true, tuple=false) */
  mutable: boolean;

  /** 참조 카운트 (시각화용, 실제 GC 아님) */
  refCount?: number;
}

// ============================================================
// 콜스택 (Phase 2)
// ============================================================

/** Python 콜 프레임 */
export interface PyCallFrame {
  /** 함수명 */
  functionName: string;

  /** 복귀할 줄 번호 */
  returnLine: number;

  /** 로컬 이름들 */
  localNames: string[];
}

// ============================================================
// 시뮬레이터 컨텍스트
// ============================================================

/** Python 시뮬레이터 컨텍스트 */
export interface PySimContext {
  // === 이름 공간 ===
  names: Map<string, PyName>;

  // === 객체 공간 ===
  objects: Map<ObjectId, PyObject>;

  // === ID 생성 ===
  nextObjectId: number;

  // === 콜스택 (Phase 2) ===
  callStack: PyCallFrame[];
  currentScope: PyScope;

  // === 실행 상태 ===
  currentLine: number;
}

// ============================================================
// 스텝 & 변경사항
// ============================================================

/** Python 변경 사항 타입 */
export type PyChangeType = 'bind' | 'rebind' | 'modify' | 'create' | 'delete';

/** Python 변경 사항 */
export interface PyChange extends BaseChange {
  type: PyChangeType;
  name?: string;
  objectId: ObjectId;
  oldObjectId?: ObjectId;
}

/** Python 시뮬레이션 스텝 */
export interface PyStep extends BaseStep {
  /** 이름 목록 */
  names: PyName[];

  /** 객체 목록 */
  objects: PyObject[];

  /** 이 스텝에서의 변경사항 */
  changes: PyChange[];
}

// ============================================================
// 핸들러 타입
// ============================================================

import type { CodeHandler } from './simulator';

/** Python 코드 핸들러 타입 */
export type PyCodeHandler = CodeHandler<PySimContext, PyStep>;

// ============================================================
// 유틸리티 타입
// ============================================================

/** 기본 타입인지 확인 */
export function isPrimitiveType(type: PyType): type is PyPrimitiveType {
  return ['int', 'float', 'str', 'bool', 'NoneType'].includes(type);
}

/** 컬렉션 타입인지 확인 */
export function isCollectionType(type: PyType): type is PyCollectionType {
  return ['list', 'tuple', 'dict', 'set'].includes(type);
}

/** 불변 타입인지 확인 */
export function isImmutableType(type: PyType): boolean {
  return ['int', 'float', 'str', 'bool', 'NoneType', 'tuple'].includes(type);
}
