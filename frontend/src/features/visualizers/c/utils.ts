/**
 * Memory Visualization Utilities
 * 주소 포맷팅, 계산 함수들
 */

import type { MemoryBlock, Step } from './types';

/**
 * 주소를 짧은 형식으로 포맷팅
 * 0x7fffffffde00 -> ...de00
 */
export function formatAddress(addr: string, short = true): string {
  if (!addr) return '';

  // 0x 접두사 제거
  const hex = addr.replace('0x', '');

  if (short && hex.length > 6) {
    return '...' + hex.slice(-4);
  }

  return '0x' + hex;
}

/**
 * 주소를 숫자로 변환
 */
export function parseAddress(addr: string): number {
  if (!addr) return 0;
  return parseInt(addr.replace('0x', ''), 16);
}

/**
 * 두 Step 사이의 변경된 블록 주소 목록 반환
 */
export function getChangedBlocks(prevStep: Step | null, currentStep: Step): string[] {
  if (!prevStep) {
    // 첫 스텝이면 모든 블록이 새로운 것
    return [
      ...currentStep.stack.map(b => b.address),
      ...currentStep.heap.map(b => b.address),
    ];
  }

  const changed: string[] = [];
  const prevBlocks = new Map<string, MemoryBlock>();

  // 이전 블록들을 맵에 저장
  [...prevStep.stack, ...prevStep.heap].forEach(block => {
    prevBlocks.set(block.address, block);
  });

  // 현재 블록들과 비교
  [...currentStep.stack, ...currentStep.heap].forEach(block => {
    const prev = prevBlocks.get(block.address);
    if (!prev) {
      // 새로운 블록
      changed.push(block.address);
    } else if (prev.value !== block.value) {
      // 값이 변경된 블록
      changed.push(block.address);
    }
  });

  return changed;
}

/**
 * 블록이 포인터 타입인지 확인
 */
export function isPointerType(type: string): boolean {
  return type.includes('*');
}

/**
 * 주소를 기준으로 블록 정렬 (높은 주소 -> 낮은 주소, 스택 순서)
 */
export function sortBlocksByAddress(blocks: MemoryBlock[], descending = true): MemoryBlock[] {
  return [...blocks].sort((a, b) => {
    const addrA = parseAddress(a.address);
    const addrB = parseAddress(b.address);
    return descending ? addrB - addrA : addrA - addrB;
  });
}

/**
 * 주소를 Xarrow DOM ID로 변환
 * @param address - 메모리 주소 (예: 0x7fffffffde00)
 * @returns DOM ID (예: mem-7fffffffde00)
 */
export function toBlockId(address: string): string {
  return `mem-${address.replace('0x', '')}`;
}
