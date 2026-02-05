/**
 * 메모리 패널 유틸리티 함수
 */

import type { MemoryBlock } from '@/types';

/** 쓰레기값 여부 판별 */
export function isGarbageValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  const strValue = String(value).toLowerCase().trim();
  const garbagePatterns = ['???', '?', 'undefined', 'garbage', '(garbage)', '쓰레기', '미정의'];
  return garbagePatterns.includes(strValue);
}

/** 블록에서 프레임명 추출 (예: "main.x" → "main") */
export function getFrameFromBlock(block: MemoryBlock, defaultFrame: string): string {
  if (!block.name) return defaultFrame;
  const dotIndex = block.name.indexOf('.');
  return dotIndex > 0 ? block.name.substring(0, dotIndex) : defaultFrame;
}

/** 변수 표시명 추출 (예: "main.x" → "x") */
export function getDisplayName(name: string | undefined): string {
  if (!name) return '(unnamed)';
  return name.includes('.') ? name.split('.')[1] : name;
}

/** 배열 요소인지 확인 (예: "main.arr[0]" → true) */
export function isArrayElement(name: string | undefined): boolean {
  if (!name) return false;
  return /\[\d+\]$/.test(name);
}

/** 배열 이름 추출 (예: "main.arr[0]" → "main.arr") */
export function getArrayBaseName(name: string | undefined): string {
  if (!name) return '';
  return name.replace(/\[\d+\]$/, '');
}

/** 배열 인덱스 추출 (예: "main.arr[5]" → 5) */
export function getArrayIndex(name: string | undefined): number {
  if (!name) return -1;
  const match = name.match(/\[(\d+)\]$/);
  return match ? parseInt(match[1], 10) : -1;
}

// ── C 언어 정규화 헬퍼 ──

/** struct 배열 값인지 확인 (예: [{key:"x", value:"10"}, ...]) */
export function isStructValue(rawValue: unknown): rawValue is Array<{ key: string; value: string }> {
  return (
    Array.isArray(rawValue) &&
    rawValue.length > 0 &&
    typeof rawValue[0] === 'object' &&
    rawValue[0] !== null &&
    'key' in rawValue[0]
  );
}

/** char[] 배열 값인지 확인 (예: [{value:"'C'"}, ...]) */
export function isCharArrayValue(rawValue: unknown): rawValue is Array<{ value: string; highlight?: boolean }> {
  return (
    Array.isArray(rawValue) &&
    rawValue.length > 0 &&
    typeof rawValue[0] === 'object' &&
    rawValue[0] !== null &&
    'value' in rawValue[0] &&
    !('key' in rawValue[0])
  );
}

/** 복합 C value를 표시용 문자열로 변환 */
export function normalizeCValue(rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined) return '???';
  if (typeof rawValue === 'string' || typeof rawValue === 'number') return String(rawValue);
  if (isStructValue(rawValue)) {
    return `{${rawValue.map((m) => `${m.key}=${m.value}`).join(', ')}}`;
  }
  if (isCharArrayValue(rawValue)) {
    return rawValue.map((e) => e.value).join('');
  }
  if (Array.isArray(rawValue)) {
    return `[${rawValue.map(String).join(', ')}]`;
  }
  return JSON.stringify(rawValue);
}

/** C stack 배열에서 frame 마커를 분리하고 변수를 추출 */
export function extractCFrames(rawStack: any[]): {
  frames: { name: string }[];
  variables: any[];
} {
  const frames: { name: string }[] = [];
  const variables: any[] = [];

  for (const item of rawStack) {
    if (item.type === 'frame' && item.func) {
      frames.push({ name: item.func });
    } else {
      variables.push(item);
    }
  }

  // frame이 하나도 없으면 기본 main 추가
  if (frames.length === 0) {
    frames.push({ name: 'main' });
  }

  return { frames, variables };
}

/** 텍스트 트렁케이션 */
export function truncateText(text: string, maxLength: number): { text: string; isTruncated: boolean } {
  if (text.length <= maxLength) {
    return { text, isTruncated: false };
  }
  return { text: text.slice(0, maxLength) + '\u2026', isTruncated: true };
}
