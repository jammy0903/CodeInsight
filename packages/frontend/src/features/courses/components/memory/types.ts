/**
 * MemoryPanel 공유 타입 정의
 */

import type { MemoryBlock } from '@/types';

/** Data 영역 아이템 */
export interface DataItem {
  name: string;
  value: string;
  address: string;
}

/** Text 영역 아이템 */
export interface TextItem {
  name: string;
  address: string;
}

/** 변경된 블록 타입 */
export interface ChangedBlocksType {
  stack: string[];
  heap: string[];
}

/** MemoryPanel props */
export interface MemoryPanelProps {
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  changedBlocks: ChangedBlocksType;
  /** 스택 프레임 정보 (함수별 구분용) */
  frames?: Array<{ name: string }>;
  /** Data 영역 (문자열 리터럴, 초기화된 전역변수) */
  dataSection?: DataItem[];
  /** Text 영역 (함수들) */
  textSection?: TextItem[];
}
