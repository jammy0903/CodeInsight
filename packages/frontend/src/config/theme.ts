/**
 * Theme Configuration
 * CodeInsight - Playful & Gamified (크림 배경 + 네온 액센트)
 *
 * 모든 테마 관련 값은 여기서 중앙 관리
 * CSS 변수명과 Tailwind 설정에서 참조
 */

// ============================================
// 폰트 설정
// ============================================
export const fonts = {
  // 로고/제목용 - 시스템 모노스페이스
  display: [
    'ui-monospace',
    '"SF Mono"',
    '"Cascadia Code"',
    '"Consolas"',
    'monospace',
  ].join(', '),

  // 본문용 - 한국어 지원
  sans: [
    '"Pretendard Variable"',
    'Pretendard',
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'sans-serif',
  ].join(', '),

  // 코드용
  mono: [
    '"JetBrains Mono"',
    '"Fira Code"',
    '"Consolas"',
    'monospace',
  ].join(', '),
} as const;

// ============================================
// 색상 팔레트 (크림 배경 + 네온 액센트)
// ============================================
export const colors = {
  // === 배경 (따뜻한 크림 - 기존 유지) ===
  background: {
    base: '#FFF9F0',       // cream
    elevated: '#FFFBF5',   // warm-white
    tertiary: '#FFE8D6',   // peach
    hover: '#F5EFE7',      // sand
  },

  // === 텍스트 (다크 온 라이트) ===
  text: {
    primary: '#1a1a2e',    // 약간 보라 섞인 다크
    secondary: '#374151',
    tertiary: '#6b7280',
    muted: '#9ca3af',
  },

  // === Primary (네온 옐로우/골드) ===
  primary: {
    DEFAULT: '#FFD700',
    hover: '#FFED4A',
    light: 'rgba(255, 215, 0, 0.15)',
    muted: 'rgba(255, 215, 0, 0.3)',
  },

  // === 네온 액센트 컬러 ===
  neon: {
    yellow: '#FFD700',
    cyan: '#00D9FF',
    pink: '#FF6B9D',
    purple: '#A855F7',
    green: '#10B981',
    orange: '#F97316',
    blue: '#3B82F6',
  },

  // === 상태 색상 (네온 버전) ===
  success: {
    DEFAULT: '#10B981',
    light: 'rgba(16, 185, 129, 0.15)',
    dark: '#059669',
    muted: 'rgba(16, 185, 129, 0.3)',
  },

  warning: {
    DEFAULT: '#F59E0B',
    light: 'rgba(245, 158, 11, 0.15)',
    dark: '#D97706',
    muted: 'rgba(245, 158, 11, 0.3)',
  },

  danger: {
    DEFAULT: '#EF4444',
    light: 'rgba(239, 68, 68, 0.15)',
    dark: '#DC2626',
    muted: 'rgba(239, 68, 68, 0.3)',
  },

  info: {
    DEFAULT: '#3B82F6',
    light: 'rgba(59, 130, 246, 0.15)',
    dark: '#2563EB',
    muted: 'rgba(59, 130, 246, 0.3)',
  },

  // === 테두리 ===
  border: {
    DEFAULT: '#E5D5C7',
    light: '#D5C5B7',
    dark: '#C5B5A7',
  },

  // === 메모리 시각화 (네온 버전) ===
  memory: {
    stack: {
      bg: 'rgba(0, 217, 255, 0.1)',
      border: '#00D9FF',
      text: '#0891B2',
    },
    heap: {
      bg: 'rgba(249, 115, 22, 0.1)',
      border: '#F97316',
      text: '#C2410C',
    },
    code: {
      bg: 'rgba(168, 85, 247, 0.1)',
      border: '#A855F7',
      text: '#7C3AED',
    },
    data: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: '#10B981',
      text: '#047857',
    },
  },

  // === 퀴즈 피드백 ===
  quiz: {
    correct: {
      bg: 'rgba(16, 185, 129, 0.15)',
      border: '#10B981',
      text: '#047857',
    },
    incorrect: {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: '#EF4444',
      text: '#DC2626',
    },
    hint: {
      bg: 'rgba(255, 215, 0, 0.2)',
      border: '#FFD700',
      text: '#B45309',
    },
  },

  // === 게이미피케이션 ===
  gamification: {
    xp: '#FFD700',
    level: '#00D9FF',
    streak: '#F97316',
    badge: {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    },
  },

  // === 다크 카드 (코드 에디터, 특별 섹션용) ===
  dark: {
    base: '#1a1a2e',
    elevated: '#16213e',
    border: '#374151',
  },
} as const;

// ============================================
// 간격 (Spacing)
// ============================================
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const;

// ============================================
// 테두리 반경
// ============================================
export const borderRadius = {
  none: '0',
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// ============================================
// 그림자 (네온 글로우)
// ============================================
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  card: '0 2px 8px rgba(0, 0, 0, 0.05)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  // 네온 글로우
  neonYellow: '0 0 20px rgba(255, 215, 0, 0.4)',
  neonCyan: '0 0 20px rgba(0, 217, 255, 0.4)',
  neonPink: '0 0 20px rgba(255, 107, 157, 0.4)',
  neonPurple: '0 0 20px rgba(168, 85, 247, 0.4)',
  neonGreen: '0 0 20px rgba(16, 185, 129, 0.4)',
  focus: '0 0 0 3px rgba(255, 215, 0, 0.3)',
} as const;

// ============================================
// 애니메이션
// ============================================
export const animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '400ms',
  },
  easing: {
    default: 'ease-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ============================================
// Z-Index 레이어
// ============================================
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// 타입 export
export type ThemeColors = typeof colors;
export type ThemeFonts = typeof fonts;
