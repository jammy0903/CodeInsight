/**
 * Memory Visualization Constants
 * 애니메이션 타이밍, 색상, 레이아웃 상수
 */

import type { Variants } from 'framer-motion';

// 애니메이션 타이밍 (ms)
export const ANIMATION_DURATION = {
  slow: 600,
  normal: 300,
  fast: 150,
} as const;

// 메모리 세그먼트 색상 (인라인 스타일용 hex)
export const SEGMENT_COLORS = {
  stack: {
    main: '#a855f7',      // purple-500
    bg: 'rgba(168, 85, 247, 0.1)',
    headerBg: 'rgba(168, 85, 247, 0.25)',
    border: 'rgba(168, 85, 247, 0.4)',
  },
  heap: {
    main: '#22c55e',      // green-500
    bg: 'rgba(34, 197, 94, 0.1)',
    headerBg: 'rgba(34, 197, 94, 0.25)',
    border: 'rgba(34, 197, 94, 0.4)',
  },
  data: {
    main: '#f59e0b',      // amber-500
    bg: 'rgba(245, 158, 11, 0.1)',
    headerBg: 'rgba(245, 158, 11, 0.25)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  code: {
    main: '#3b82f6',      // blue-500
    bg: 'rgba(59, 130, 246, 0.1)',
    headerBg: 'rgba(59, 130, 246, 0.25)',
    border: 'rgba(59, 130, 246, 0.4)',
  },
} as const;

// 레지스터 색상
export const REGISTER_COLORS = {
  rsp: '#ef4444', // red-500
  rbp: '#22c55e', // green-500
  rip: '#3b82f6', // blue-500
} as const;

// 포인터 연결 색상 (디자인 doc: --pointer-arrow)
export const POINTER_COLORS = {
  main: '#f97316',      // orange-500
  bg: 'rgba(249, 115, 22, 0.15)',
  border: 'rgba(249, 115, 22, 0.6)',
  glow: 'rgba(249, 115, 22, 0.4)',
} as const;

// 기본 코드 예시
export const DEFAULT_CODE = `#include <stdio.h>

int main() {
    int x = 5;
    int y = 10;
    int *p = &x;
    *p = 20;
    printf("%d\\n", x);
    return 0;
}`;

// 타입 → 역할 라벨 변환
export function getRoleLabel(type: string, segment: 'stack' | 'heap' | 'data' | 'code'): string {
  if (segment === 'heap') return '동적 할당';
  if (segment === 'data') return '전역 변수';
  if (segment === 'code') return '프로그램';

  // STACK segment
  if (type.includes('[')) return '배열';
  if (type.includes('*')) return '포인터';
  if (type.startsWith('struct')) return '구조체';
  return '변수';
}

// 세그먼트 설명 (빈 상태일 때)
export const SEGMENT_DESCRIPTIONS = {
  data: '초기화된 전역/정적 변수 저장',
  code: '컴파일된 기계어 명령어',
} as const;

// 포인터 펄스 애니메이션 (Framer Motion variants)
export const PULSE_VARIANTS: Variants = {
  idle: {},
  pulse: {
    boxShadow: [
      `0 0 0 0 ${POINTER_COLORS.glow}`,
      `0 0 0 6px transparent`,
    ],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
};

// Xarrow 화살표 설정
export const ARROW_CONFIG = {
  strokeWidth: 2,
  headSize: 5,
  path: 'grid' as const,
  gridBreak: '50%',
} as const;

// 포인터별 색상 팔레트 (최대 6개 포인터 지원, 순환)
export const POINTER_PALETTE = [
  { main: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.6)', glow: 'rgba(249, 115, 22, 0.4)' },  // orange
  { main: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.6)', glow: 'rgba(6, 182, 212, 0.4)' },    // cyan
  { main: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.6)', glow: 'rgba(236, 72, 153, 0.4)' }, // pink
  { main: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)', border: 'rgba(132, 204, 22, 0.6)', glow: 'rgba(132, 204, 22, 0.4)' }, // lime
  { main: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.6)', glow: 'rgba(139, 92, 246, 0.4)' }, // violet
  { main: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.6)', glow: 'rgba(245, 158, 11, 0.4)' }, // amber
] as const;

/**
 * 포인터 인덱스로 색상 가져오기 (순환)
 * @param index - 포인터 인덱스 (0부터 시작)
 */
export function getPointerColor(index: number) {
  return POINTER_PALETTE[index % POINTER_PALETTE.length];
}
