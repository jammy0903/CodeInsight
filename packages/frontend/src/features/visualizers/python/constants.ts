/**
 * Python Visualizer Constants
 * 색상, 스타일, 애니메이션 설정
 */

/** Scope별 색상 */
export const SCOPE_COLORS = {
  __main__: {
    main: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.5)',
    text: '#2563eb',
  },
  global: {
    main: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.5)',
    text: '#9333ea',
  },
  builtin: {
    main: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.12)',
    border: 'rgba(107, 114, 128, 0.5)',
    text: '#4b5563',
  },
  // 함수 스코프 기본 색상
  default: {
    main: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.5)',
    text: '#15803d',
  },
} as const;

/** 객체 타입별 색상 */
export const TYPE_COLORS = {
  // Immutable types (회색 계열)
  int: { bg: '#f5f5f5', border: '#d4d4d4', text: '#525252' },
  float: { bg: '#f5f5f5', border: '#d4d4d4', text: '#525252' },
  str: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  bool: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  NoneType: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
  tuple: { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9' },

  // Mutable types (주황 계열)
  list: { bg: '#fff7ed', border: '#fb923c', text: '#c2410c' },
  dict: { bg: '#fef2f2', border: '#f87171', text: '#b91c1c' },
  set: { bg: '#ecfdf5', border: '#34d399', text: '#059669' },

  // Reference types
  function: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  class: { bg: '#fdf4ff', border: '#e879f9', text: '#a21caf' },
  instance: { bg: '#fdf4ff', border: '#d946ef', text: '#86198f' },
} as const;

/** 변경 하이라이트 색상 */
export const CHANGE_COLORS = {
  bg: 'rgba(250, 204, 21, 0.25)',
  border: '#facc15',
  glow: '0 0 8px rgba(250, 204, 21, 0.5)',
} as const;

/** 화살표 색상 */
export const ARROW_COLORS = {
  active: '#f97316',
  inactive: '#d4d4d4',
  new: '#22c55e',
  deleted: '#ef4444',
} as const;

/** Mutable 여부 확인 */
export function isMutableType(type: string): boolean {
  return ['list', 'dict', 'set'].includes(type);
}

/** 타입 색상 가져오기 */
export function getTypeColor(type: string) {
  return TYPE_COLORS[type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.int;
}

/** Scope 색상 가져오기 */
export function getScopeColor(scope: string) {
  return SCOPE_COLORS[scope as keyof typeof SCOPE_COLORS] ?? SCOPE_COLORS.default;
}
