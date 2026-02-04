/**
 * Shared Module Types
 *
 * 여러 모듈이 공유하는 타입 정의.
 * CMemoryView의 MemoryBlock 인터페이스와 호환.
 */

export type SegmentType = 'stack' | 'heap' | 'data' | 'code';

export interface MemoryBlock {
  name: string;
  address: string;
  type: string;
  value: string;
  size?: number;
  segment?: SegmentType;
  points_to?: string | null;
  highlight?: boolean;
}

export interface StackRegisters {
  rsp?: string;
  rbp?: string;
}
