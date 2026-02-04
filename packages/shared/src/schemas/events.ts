/**
 * Event-Driven Visualization Types
 *
 * 시각화 이벤트 기반 아키텍처의 핵심 타입 정의
 *
 * 설계 원칙:
 * 1. 각 이벤트는 하나의 atomic 변경을 표현
 * 2. 프론트엔드는 이벤트를 순서대로 적용하여 상태 구축
 * 3. 백엔드는 이전/현재 상태 diff 없이 이벤트 직접 생성
 */

import { z } from 'zod';

// ============================================
// Value 타입 (다양한 값 표현)
// ============================================

export const VisualizationValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string(), z.number()])), // 배열 값
]);

export type VisualizationValue = z.infer<typeof VisualizationValueSchema>;

// ============================================
// Frame Event (함수 호출/복귀)
// ============================================

export const FrameEventSchema = z.object({
  type: z.literal('frame'),
  action: z.enum(['push', 'pop']),
  name: z.string(), // 함수 이름 (e.g., 'main', 'swap')
  returnAddress: z.string().optional(), // 복귀 주소 (pop 시)
});

export type FrameEvent = z.infer<typeof FrameEventSchema>;

// ============================================
// Variable Event (스택 변수 조작)
// ============================================

export const VariableEventSchema = z.object({
  type: z.literal('variable'),
  action: z.enum(['declare', 'assign', 'destroy']),
  frame: z.string(), // 소속 프레임 (e.g., 'main', 'swap')
  name: z.string(), // 변수 이름
  varType: z.string().optional(), // C 타입 (e.g., 'int', 'int*')
  value: VisualizationValueSchema.optional(),
  address: z.string().optional(), // 메모리 주소
  size: z.number().optional(), // 바이트 크기
  previousValue: VisualizationValueSchema.optional(), // 이전 값 (assign 시)
  // 배열 관련
  isArray: z.boolean().optional(),
  arraySize: z.number().optional(),
  elementType: z.string().optional(),
});

export type VariableEvent = z.infer<typeof VariableEventSchema>;

// ============================================
// Pointer Event (포인터 조작)
// ============================================

export const PointerEventSchema = z.object({
  type: z.literal('pointer'),
  action: z.enum(['assign', 'deref_read', 'deref_write']),
  frame: z.string().optional(), // 포인터가 속한 프레임 (현재 실행 프레임)
  pointer: z.string(), // 포인터 변수 이름 (frame.name 형식)
  targetAddress: z.string(), // 가리키는 주소
  targetFrame: z.string().optional(), // 타겟이 속한 프레임 (크로스 프레임 지원)
  targetName: z.string().optional(), // 타겟 변수 이름
  value: VisualizationValueSchema.optional(), // 역참조 시 값
  previousValue: VisualizationValueSchema.optional(), // 이전 값 (deref_write 시)
});

export type PointerEvent = z.infer<typeof PointerEventSchema>;

// ============================================
// Heap Event (동적 메모리 조작)
// ============================================

export const HeapEventSchema = z.object({
  type: z.literal('heap'),
  action: z.enum(['allocate', 'free', 'write', 'read']),
  address: z.string(),
  size: z.number().optional(), // allocate 시 크기
  name: z.string().optional(), // 힙 블록 식별자 (e.g., 'p')
  heapType: z.string().optional(), // 타입 (e.g., 'int')
  value: VisualizationValueSchema.optional(),
  offset: z.number().optional(), // 배열 오프셋
});

export type HeapEvent = z.infer<typeof HeapEventSchema>;

// ============================================
// Output Event (stdout/stderr)
// ============================================

export const OutputEventSchema = z.object({
  type: z.literal('output'),
  stream: z.enum(['stdout', 'stderr']).default('stdout'),
  text: z.string(),
});

export type OutputEvent = z.infer<typeof OutputEventSchema>;

// ============================================
// Warning Event (경고/에러)
// ============================================

export const WarningEventSchema = z.object({
  type: z.literal('warning'),
  code: z.enum([
    'memory_leak',
    'buffer_overflow',
    'use_after_free',
    'double_free',
    'null_pointer_deref',
    'uninitialized_read',
  ]),
  message: z.string(),
  address: z.string().optional(), // 관련 메모리 주소
  details: z.record(z.string(), z.unknown()).optional(), // 추가 정보
});

export type WarningEvent = z.infer<typeof WarningEventSchema>;

// ============================================
// Highlight Event (시각적 강조)
// ============================================

export const HighlightEventSchema = z.object({
  type: z.literal('highlight'),
  target: z.enum(['variable', 'pointer', 'heap', 'frame']),
  name: z.string(), // 강조할 대상 이름
  frame: z.string().optional(), // 프레임 (변수인 경우)
  style: z.enum(['changed', 'accessed', 'error', 'focus']).default('changed'),
});

export type HighlightEvent = z.infer<typeof HighlightEventSchema>;

// ============================================
// 통합 Visualization Event (legacy 7종)
// ============================================

export const VisualizationEventSchema = z.discriminatedUnion('type', [
  FrameEventSchema,
  VariableEventSchema,
  PointerEventSchema,
  HeapEventSchema,
  OutputEventSchema,
  WarningEventSchema,
  HighlightEventSchema,
]);

export type VisualizationEvent = z.infer<typeof VisualizationEventSchema>;

// ============================================
// Scope Event (JS, Python 스코프 시각화)
// ============================================

export const ScopeEventSchema = z.object({
  type: z.literal('scope'),
  action: z.enum(['enter', 'exit']),
  scopeType: z.enum(['global', 'function', 'block', 'module', 'class']),
  name: z.string(),
  parentScope: z.string().optional(),
});

export type ScopeEvent = z.infer<typeof ScopeEventSchema>;

// ============================================
// Object Event (Java, JS, Python 힙 객체)
// ============================================

export const ObjectEventSchema = z.object({
  type: z.literal('object'),
  action: z.enum(['create', 'update', 'access', 'destroy']),
  objectId: z.string(),
  className: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  location: z.enum(['heap', 'string-pool', 'intern']).optional(),
});

export type ObjectEvent = z.infer<typeof ObjectEventSchema>;

// ============================================
// Binding Event (Python 이름 → 객체 바인딩)
// ============================================

export const BindingEventSchema = z.object({
  type: z.literal('binding'),
  action: z.enum(['bind', 'rebind', 'unbind']),
  name: z.string(),
  scope: z.string(),
  objectId: z.string(),
  objectType: z.string(),
  objectValue: z.unknown().optional(),
  isNewObject: z.boolean().optional(),
  refCount: z.number().optional(),
});

export type BindingEvent = z.infer<typeof BindingEventSchema>;

// ============================================
// 확장 통합 SimulatorEvent (legacy 7 + new 3)
// ============================================

export const SimulatorEventSchema = z.discriminatedUnion('type', [
  // legacy 7
  FrameEventSchema,
  VariableEventSchema,
  PointerEventSchema,
  HeapEventSchema,
  OutputEventSchema,
  WarningEventSchema,
  HighlightEventSchema,
  // new 3
  ScopeEventSchema,
  ObjectEventSchema,
  BindingEventSchema,
]);

export type SimulatorEvent = z.infer<typeof SimulatorEventSchema>;

// ============================================
// Step with Events (확장된 Step 타입)
// ============================================

export const StepEventsSchema = z.object({
  events: z.array(VisualizationEventSchema),
});

export type StepEvents = z.infer<typeof StepEventsSchema>;

// ============================================
// Visualization State (프론트엔드용)
// ============================================

export interface VisualizationFrame {
  name: string;
  variables: Map<string, VisualizationVariable>;
  stackBase: string;
}

export interface VisualizationVariable {
  name: string;
  address: string;
  type: string;
  value: VisualizationValue;
  size: number;
  pointsTo?: string; // 포인터인 경우 타겟 주소
  isArray?: boolean;
  arraySize?: number;
  highlight?: 'changed' | 'accessed' | 'error' | 'focus';
}

export interface VisualizationHeapBlock {
  address: string;
  name: string;
  type: string;
  size: number;
  value: VisualizationValue;
  highlight?: 'changed' | 'accessed' | 'error' | 'focus';
}

export interface VisualizationState {
  frames: VisualizationFrame[];
  heap: VisualizationHeapBlock[];
  output: string;
  warnings: WarningEvent[];
}

// ============================================
// 유틸리티: 기존 MemoryChangeAction → VisualizationEvent 변환
// ============================================

/**
 * 기존 MemoryChangeAction을 VisualizationEvent로 변환
 * (하위 호환성을 위한 어댑터)
 */
export function convertMemoryChangeToEvent(
  change: {
    area: 'stack' | 'heap';
    action: string;
    name: string;
    frame?: string;
    type?: string;
    size?: number;
    value?: string | number | boolean | null;
    address?: string;
  }
): VisualizationEvent | null {
  if (change.area === 'stack') {
    switch (change.action) {
      case 'frame':
        return {
          type: 'frame',
          action: 'push',
          name: change.name,
        };
      case 'frame_end':
        return {
          type: 'frame',
          action: 'pop',
          name: change.name,
        };
      case 'allocate':
        return {
          type: 'variable',
          action: 'declare',
          frame: change.frame || 'global',
          name: change.name,
          varType: change.type,
          value: change.value,
          address: change.address,
          size: change.size,
        };
      case 'update':
        return {
          type: 'variable',
          action: 'assign',
          frame: change.frame || 'global',
          name: change.name,
          value: change.value,
        };
      case 'free':
      case 'deallocate':
        return {
          type: 'variable',
          action: 'destroy',
          frame: change.frame || 'global',
          name: change.name,
        };
    }
  } else if (change.area === 'heap') {
    switch (change.action) {
      case 'allocate':
        return {
          type: 'heap',
          action: 'allocate',
          address: change.address || '0x0',
          size: change.size,
          name: change.name,
          heapType: change.type,
        };
      case 'update':
        return {
          type: 'heap',
          action: 'write',
          address: change.address || '0x0',
          value: change.value,
          name: change.name,
        };
      case 'free':
      case 'deallocate':
        return {
          type: 'heap',
          action: 'free',
          address: change.address || '0x0',
          name: change.name,
        };
    }
  }
  return null;
}
