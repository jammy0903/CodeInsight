/**
 * 메모리 패널 색상 체계
 *
 * 프레임별, 레지스터, 변경 표시 등 모든 색상을 중앙 관리
 */

export const COLORS = {
  stack: {
    bg: '#FFF5F7',
    border: '#D63384',
    label: '#be185d',
    light: '#fdf2f8',
  },
  heap: {
    bg: '#e8f5ec',
    border: '#4a9d6b',
    label: '#3d7a5a',
    light: '#dceee2',
  },
  frame: [
    {
      bg: 'var(--theme-memory-frame-amber-bg)',
      border: 'var(--theme-memory-frame-amber-border)',
      text: 'var(--theme-memory-frame-amber-text)',
      hover: 'var(--theme-memory-frame-amber-hover)',
    },
    {
      bg: 'var(--theme-memory-frame-blue-bg)',
      border: 'var(--theme-memory-frame-blue-border)',
      text: 'var(--theme-memory-frame-blue-text)',
      hover: 'var(--theme-memory-frame-blue-hover)',
    },
    {
      bg: 'var(--theme-memory-frame-green-bg)',
      border: 'var(--theme-memory-frame-green-border)',
      text: 'var(--theme-memory-frame-green-text)',
      hover: 'var(--theme-memory-frame-green-hover)',
    },
    {
      bg: 'var(--theme-memory-frame-pink-bg)',
      border: 'var(--theme-memory-frame-pink-border)',
      text: 'var(--theme-memory-frame-pink-text)',
      hover: 'var(--theme-memory-frame-pink-hover)',
    },
    {
      bg: 'var(--theme-memory-frame-indigo-bg)',
      border: 'var(--theme-memory-frame-indigo-border)',
      text: 'var(--theme-memory-frame-indigo-text)',
      hover: 'var(--theme-memory-frame-indigo-hover)',
    },
  ],
  changed: {
    bg: 'var(--theme-memory-changed-bg)',
    border: 'var(--theme-memory-changed-border)',
  },
  surface: { bg: '#ffffff', border: '#e5e7eb', text: '#1f2937', muted: '#6b7280' },
} as const;

/** 프레임 색상 타입 (컴포넌트 props에서 사용) */
export type FrameColor = (typeof COLORS.frame)[number];
