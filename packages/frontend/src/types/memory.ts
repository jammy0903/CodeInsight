/**
 * Memory Visualization Types (Shared)
 *
 * Canonical type definitions for memory tracing and visualization.
 * Used by: tracer service, memory-viz components, backend handlers
 *
 * 디자인 원칙:
 * - 값: 크고 굵게 (실제 메모리에 저장됨)
 * - 변수명: 작고 회색 (메모리에 없음! 컴파일러만 아는 라벨)
 */

export type SegmentType = 'stack' | 'heap' | 'data' | 'text';

// Memory block representing a variable in stack or heap
// NOTE: Heap blocks may not have a name (anonymous malloc blocks)
export interface MemoryBlock {
  name?: string;  // Optional for heap blocks (e.g., malloc'd memory without variable)
  address: string;
  value: string;
  // Optional fields (레슨/Playground 공용)
  type?: string;
  size?: number;
  bytes?: number[];
  segment?: SegmentType;
  points_to?: string | null;
  explanation?: string;
  highlight?: boolean;
  // 배열 지원 (접기/펼치기)
  isArray?: boolean;
  arrayElements?: MemoryBlock[];
  isExpanded?: boolean;
  // C 언어 전용
  dangling?: boolean;
  label?: string;
  structMembers?: Array<{ key: string; value: string }>;
  charElements?: Array<{ value: string; highlight?: boolean }>;
}

// 메모리 상태 (레슨/Playground 공용)
export interface MemoryState {
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  data?: MemoryBlock[];
}

// 스택 레지스터 (함수/포인터 레슨용)
export interface StackRegisters {
  rsp?: string;
  rbp?: string;
}

// Execution step with memory state
export interface Step {
  line: number;
  code: string;
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  explanation: string;
  rsp?: string;
  rbp?: string;
}

// Trace API result
export interface TraceResult {
  success: boolean;
  steps: Step[];
  source_lines: string[];
  error?: string;
  message?: string;
}
