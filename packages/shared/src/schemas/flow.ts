/**
 * Flow Visualizer Zod Schemas
 *
 * "코드가 살아 움직이는 시각화"를 위한 타입 정의
 * Single Source of Truth: 모든 타입은 Zod 스키마에서 추론
 */

import { z } from 'zod';

// =============================================
// 기본 타입
// =============================================

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof PositionSchema>;

/**
 * FlowValue: 변수가 가질 수 있는 값 타입
 * any 대신 명시적 union 사용
 */
export const FlowValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string(), z.number(), z.boolean()])),
  z.record(z.string(), z.unknown()), // 객체 (Python dict, struct 등)
]);

export type FlowValue = z.infer<typeof FlowValueSchema>;

// =============================================
// 변수 상태 (애니메이션용)
// =============================================

export const FlowVariableStateSchema = z.enum([
  'idle', // 기본 상태
  'creating', // 생성 중 (박스 나타남)
  'updating', // 값 변경 중 (값 떨어짐)
  'reading', // 읽기 중 (다른 곳에서 참조)
  'deleting', // 삭제 중 (스코프 종료)
]);

export type FlowVariableState = z.infer<typeof FlowVariableStateSchema>;

// =============================================
// 변수 (Variable)
// =============================================

export const FlowVariableSchema = z.object({
  id: z.string(), // 고유 ID (uuid 또는 name-scope 조합)
  name: z.string(), // 변수명
  value: FlowValueSchema, // 값
  type: z.string(), // 타입 (int, str, String, etc.)

  // 상태 (애니메이션용)
  state: FlowVariableStateSchema.default('idle'),

  // 스코프 (함수 프레임)
  scope: z.string().default('main'),

  // 언어별 특성 (선택적)
  isReference: z.boolean().optional(), // Python/Java 참조 타입
  isPointer: z.boolean().optional(), // C 포인터
  pointsTo: z.string().optional(), // 가리키는 변수 ID
  address: z.string().optional(), // C 메모리 주소

  // 배열 정보 (선택적)
  isArray: z.boolean().optional(),
  arrayIndex: z.number().optional(),
});

export type FlowVariable = z.infer<typeof FlowVariableSchema>;

// =============================================
// 애니메이션 타입
// =============================================

export const FlowAnimationTypeSchema = z.enum([
  // 값 관련
  'value-appear', // 값이 나타남
  'value-drop', // 값이 떨어짐 (위에서 아래로)
  'value-copy', // 값 복사 (한 변수 → 다른 변수)
  'value-fly', // 값이 날아감 (printf → 터미널)

  // 박스 관련
  'box-create', // 박스 생성
  'box-destroy', // 박스 소멸
  'box-highlight', // 박스 하이라이트

  // 화살표 관련
  'arrow-draw', // 화살표 그리기
  'arrow-remove', // 화살표 제거
  'arrow-redirect', // 화살표 방향 변경

  // 제어 흐름
  'branch-decide', // 분기 결정 (if/else)
  'loop-iterate', // 루프 반복 (카운터 증가)
  'frame-enter', // 함수 진입 (새 프레임)
  'frame-exit', // 함수 종료 (프레임 제거)
]);

export type FlowAnimationType = z.infer<typeof FlowAnimationTypeSchema>;

export const FlowAnimationSchema = z.object({
  id: z.string(),
  type: FlowAnimationTypeSchema,

  // 타겟 요소
  targetId: z.string().optional(), // 애니메이션 대상 변수/요소 ID

  // 위치 (선택적 - 레이아웃에서 계산 가능)
  from: PositionSchema.optional(),
  to: PositionSchema.optional(),

  // 값 (값 이동 애니메이션용)
  value: FlowValueSchema.optional(),

  // 타이밍
  duration: z.number().default(300), // ms
  delay: z.number().default(0), // ms
  easing: z.string().default('easeOut'),
});

export type FlowAnimation = z.infer<typeof FlowAnimationSchema>;

// =============================================
// 제어 흐름 (Control Flow)
// =============================================

export const ControlFlowTypeSchema = z.enum([
  'if',
  'else',
  'else-if',
  'for',
  'while',
  'do-while',
  'switch',
  'function-call',
  'function-return',
]);

export type ControlFlowType = z.infer<typeof ControlFlowTypeSchema>;

export const ControlFlowSchema = z.object({
  type: ControlFlowTypeSchema,

  // 조건문
  condition: z.string().optional(),
  conditionResult: z.boolean().optional(),

  // 반복문
  loopIndex: z.number().optional(), // 현재 반복 인덱스
  loopTotal: z.number().optional(), // 총 반복 횟수 (알 수 있는 경우)

  // 함수
  functionName: z.string().optional(),
  arguments: z.array(FlowValueSchema).optional(),
  returnValue: FlowValueSchema.optional(),
});

export type ControlFlow = z.infer<typeof ControlFlowSchema>;

// =============================================
// 터미널 출력
// =============================================

export const TerminalOutputSchema = z.object({
  text: z.string(),
  fromVariableId: z.string().optional(), // 출력 소스 변수
  timestamp: z.number().optional(),
});

export type TerminalOutput = z.infer<typeof TerminalOutputSchema>;

// =============================================
// 함수 프레임
// =============================================

export const FlowFrameSchema = z.object({
  name: z.string(), // 함수명 (main, foo, etc.)
  variableIds: z.array(z.string()), // 이 프레임의 변수 ID들
});

export type FlowFrame = z.infer<typeof FlowFrameSchema>;

// =============================================
// FlowStep (한 스텝의 전체 정보)
// =============================================

export const FlowStepSchema = z.object({
  id: z.string(),
  line: z.number(),
  code: z.string(),

  // 현재 상태의 모든 변수
  variables: z.array(FlowVariableSchema),

  // 이번 스텝에서 실행할 애니메이션들
  animations: z.array(FlowAnimationSchema),

  // 제어 흐름 (선택적)
  controlFlow: ControlFlowSchema.optional(),

  // 터미널 출력 (선택적)
  terminalOutput: TerminalOutputSchema.optional(),

  // 함수 프레임들 (콜스택)
  frames: z.array(FlowFrameSchema).default([{ name: 'main', variableIds: [] }]),
});

export type FlowStep = z.infer<typeof FlowStepSchema>;

// =============================================
// FlowDiff (변경 감지 결과)
// =============================================

export const FlowDiffSchema = z.object({
  created: z.array(z.string()), // 새로 생성된 변수 ID
  updated: z.array(z.string()), // 값이 변경된 변수 ID
  deleted: z.array(z.string()), // 삭제된 변수 ID
  unchanged: z.array(z.string()), // 변경 없는 변수 ID
});

export type FlowDiff = z.infer<typeof FlowDiffSchema>;

// =============================================
// 언어 타입
// =============================================

export const FlowLanguageSchema = z.enum(['c', 'python', 'java']);

export type FlowLanguage = z.infer<typeof FlowLanguageSchema>;
