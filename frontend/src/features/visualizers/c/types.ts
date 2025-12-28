/**
 * Memory Visualization Types
 * 메모리 시각화를 위한 타입 정의
 */

// Import and re-export shared types
import type { MemoryBlock, Step } from '@/types/memory';
export type { MemoryBlock, Step };

// 뷰 모드
export type ViewMode = 'overview' | 'stack-detail' | 'heap-detail';

// 애니메이션 속도
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

// 메모리 세그먼트 타입
export type SegmentType = 'code' | 'data' | 'heap' | 'stack';

// 메모리 세그먼트 정보
export interface MemorySegment {
  type: SegmentType;
  label: string;
  startAddress: string;
  endAddress: string;
  color: string;
  blocks?: MemoryBlock[];
}

// 애니메이션 상태
export interface AnimationState {
  isAnimating: boolean;
  previousStep: Step | null;
  changedBlocks: string[]; // 변경된 블록 주소 목록
  direction: 'forward' | 'backward';
}

// 포인터 연결선 정보
export interface PointerConnection {
  from: string; // 소스 블록 주소
  to: string;   // 타겟 블록 주소
  label?: string;
}
