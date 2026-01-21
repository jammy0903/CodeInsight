/**
 * Java 시뮬레이터 타입 시스템
 * 교육용으로 간략화된 Java 타입 정의
 */

// ============================================================================
// Java 타입 정의
// ============================================================================

/**
 * Java primitive 타입
 */
export type JavaPrimitiveType =
  | 'int'
  | 'double'
  | 'boolean'
  | 'char'
  | 'String' // 편의상 String도 primitive로 취급
  | 'void';

/**
 * Java reference 타입
 */
export type JavaReferenceType =
  | 'Object'
  | 'Array';

/**
 * 전체 Java 타입
 */
export type JavaType = JavaPrimitiveType | JavaReferenceType | string; // string은 커스텀 클래스명

// ============================================================================
// Java 값 표현
// ============================================================================

/**
 * Java 값 (primitive 또는 reference)
 */
export interface JavaValue {
  type: JavaType;
  value: number | string | boolean | null; // primitive 값
  objectId?: string; // reference인 경우 Heap 객체 ID
  isReference: boolean; // reference 여부
}

// ============================================================================
// Heap 객체 표현
// ============================================================================

/**
 * Heap에 저장되는 Java 객체
 */
export interface JavaObject {
  id: string; // "obj_1", "obj_2", "arr_1"
  className: string; // "Person", "int[]", "String"
  fields: Map<string, JavaValue>; // 필드명 → 값
  shallowSize: number; // 간단한 크기 추정 (bytes)
  isArray: boolean; // 배열 여부
  arrayLength?: number; // 배열인 경우 길이
  arrayElements?: JavaValue[]; // 배열 요소들
  arrayElementType?: JavaType; // 배열 요소 타입
}

/**
 * Heap 스냅샷 (시각화용)
 */
export interface HeapSnapshot {
  objects: JavaObject[];
  totalSize: number;
}

// ============================================================================
// Stack 프레임 표현
// ============================================================================

/**
 * 메서드 호출 스택 프레임
 */
export interface StackFrame {
  methodName: string; // "main", "calculateSum"
  localVariables: Map<string, JavaValue>; // 지역 변수들
  depth: number; // 호출 깊이 (0부터 시작)
  lineNumber?: number; // 현재 실행 중인 라인
  parameters?: Map<string, JavaValue>; // 파라미터들 (선택적)
}

/**
 * Stack 스냅샷 (시각화용)
 */
export interface StackSnapshot {
  frames: StackFrame[];
  currentDepth: number;
}

// ============================================================================
// 실행 스텝 표현
// ============================================================================

/**
 * Java 실행 이벤트 타입
 */
export type JavaEventType =
  | 'FrameEvent'        // 메서드 호출/복귀
  | 'VariableEvent'     // 변수 선언/할당
  | 'ObjectEvent'       // 객체 생성
  | 'ArrayEvent'        // 배열 생성/접근
  | 'FieldEvent'        // 필드 접근/할당
  | 'OutputEvent'       // System.out.println
  | 'HighlightEvent';   // 시각적 강조

/**
 * Java 실행 이벤트
 */
export interface JavaEvent {
  type: JavaEventType;
  action: string; // "push", "pop", "create", "assign", "access"
  target?: string; // 대상 변수명, 객체 ID 등
  value?: JavaValue; // 관련 값
  message?: string; // 설명 메시지
}

/**
 * Java 실행 스텝 (한 라인 실행 결과)
 */
export interface JavaStep {
  lineNumber: number; // 소스 코드 라인 번호
  code: string; // 실행된 코드
  stack: StackSnapshot; // 실행 후 Stack 상태
  heap: HeapSnapshot; // 실행 후 Heap 상태
  explanation: string; // 한국어 설명
  events: JavaEvent[]; // 발생한 이벤트들
  stdout?: string; // 현재까지의 출력
  callDepth?: number; // 현재 호출 깊이
}

// ============================================================================
// 시뮬레이션 결과
// ============================================================================

/**
 * Java 시뮬레이션 결과
 */
export interface JavaSimulationResult {
  success: boolean;
  steps: JavaStep[];
  sourceLines: string[]; // 소스 코드 라인들
  error?: string; // 에러 메시지
  callTree?: CallTreeNode; // 호출 트리 (흐름 뷰용)
}

// ============================================================================
// 호출 트리 (흐름 뷰용)
// ============================================================================

/**
 * 메서드 호출 트리 노드
 */
export interface CallTreeNode {
  methodName: string;
  stepCount: number; // 이 메서드에서 실행된 스텝 수
  startLine: number;
  endLine: number;
  depth: number;
  children: CallTreeNode[]; // 자식 메서드 호출들
}

// ============================================================================
// 파싱 결과
// ============================================================================

/**
 * 파싱된 Java 클래스
 */
export interface ParsedClass {
  className: string;
  fields: ParsedField[];
  methods: ParsedMethod[];
}

/**
 * 파싱된 필드
 */
export interface ParsedField {
  name: string;
  type: JavaType;
  isStatic: boolean;
  accessModifier: 'public' | 'private' | 'protected' | 'default';
}

/**
 * 파싱된 메서드
 */
export interface ParsedMethod {
  name: string;
  returnType: JavaType;
  parameters: ParsedParameter[];
  lines: string[]; // 메서드 본문 라인들
  isStatic: boolean;
  accessModifier: 'public' | 'private' | 'protected' | 'default';
}

/**
 * 파싱된 파라미터
 */
export interface ParsedParameter {
  name: string;
  type: JavaType;
}

// ============================================================================
// 컨텍스트 (실행 환경)
// ============================================================================

/**
 * Java 실행 컨텍스트
 */
export interface JavaContext {
  stack: StackFrame[]; // 콜 스택
  heap: Map<string, JavaObject>; // Heap 객체들
  stdout: string; // 출력 버퍼
  currentLine: number; // 현재 실행 중인 라인
  stepCount: number; // 총 실행 스텝 수
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * primitive 값 생성 헬퍼
 */
export function createPrimitiveValue(type: JavaPrimitiveType, value: number | string | boolean): JavaValue {
  return {
    type,
    value,
    isReference: false
  };
}

/**
 * reference 값 생성 헬퍼
 */
export function createReferenceValue(type: JavaType, objectId: string): JavaValue {
  return {
    type,
    value: null,
    objectId,
    isReference: true
  };
}

/**
 * null 값 생성 헬퍼
 */
export function createNullValue(type: JavaType = 'Object'): JavaValue {
  return {
    type,
    value: null,
    isReference: true
  };
}

/**
 * 타입별 기본값 반환
 */
export function getDefaultValue(type: JavaType): JavaValue {
  if (type === 'int') return createPrimitiveValue('int', 0);
  if (type === 'double') return createPrimitiveValue('double', 0.0);
  if (type === 'boolean') return createPrimitiveValue('boolean', false);
  if (type === 'char') return createPrimitiveValue('char', '\0');
  if (type === 'String') return createPrimitiveValue('String', '');

  // reference 타입은 null
  return createNullValue(type);
}

/**
 * Shallow Heap 크기 추정
 */
export function estimateShallowSize(className: string, fields?: Map<string, JavaValue>, arrayLength?: number): number {
  // 매우 간단한 추정 (교육용)
  const OBJECT_HEADER = 12; // 객체 헤더
  const FIELD_SIZE = 4; // 필드당 평균 크기
  const ARRAY_ELEMENT_SIZE = 4; // 배열 요소당 크기

  if (arrayLength !== undefined) {
    return OBJECT_HEADER + (arrayLength * ARRAY_ELEMENT_SIZE);
  }

  const fieldCount = fields ? fields.size : 0;
  return OBJECT_HEADER + (fieldCount * FIELD_SIZE);
}

/**
 * 타입이 primitive인지 확인
 */
export function isPrimitiveType(type: JavaType): boolean {
  return ['int', 'double', 'boolean', 'char', 'String', 'void'].includes(type);
}

/**
 * 타입이 배열인지 확인
 */
export function isArrayType(type: string): boolean {
  return type.endsWith('[]');
}

/**
 * 배열 요소 타입 추출
 */
export function getArrayElementType(arrayType: string): JavaType {
  return arrayType.replace('[]', '') as JavaType;
}
