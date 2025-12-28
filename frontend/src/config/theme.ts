/**
 * Theme Configuration
 * C-ode-to-you 사이버펑크 스타일 기반 테마 상수
 *
 * 모든 테마 관련 값은 여기서 중앙 관리
 * CSS 변수명과 Tailwind 설정에서 참조
 */

// ============================================
// 폰트 설정
// ============================================
// Orbitron 대체: 시스템 모노스페이스 폰트 (기하학적/미래지향적 느낌)
export const fonts = {
  // 로고/제목용 - SF Mono, Cascadia Code 등 시스템 모노스페이스
  display: [
    'ui-monospace',
    '"SF Mono"',
    '"Cascadia Code"',
    '"Consolas"',
    'monospace',
  ].join(', '),

  // 본문용 - 한국어 지원 (기존 유지)
  sans: [
    '"Pretendard Variable"',
    'Pretendard',
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'sans-serif',
  ].join(', '),

  // 코드용 (기존 유지)
  mono: [
    '"JetBrains Mono"',
    '"Fira Code"',
    '"Consolas"',
    'monospace',
  ].join(', '),
} as const;

// ============================================
// 색상 팔레트 (다크모드 전용)
// ============================================
export const colors = {
  // === 배경 ===
  background: {
    base: '#0a0a0a',      // 메인 배경 (C-ode-to-you 스타일)
    elevated: '#1a1a1a',  // 카드/패널
    tertiary: '#2a2a2a',  // 호버/선택
    hover: '#3a3a3a',     // 호버 상태
  },

  // === 텍스트 ===
  text: {
    primary: '#ffffff',
    secondary: '#b0b0b0',
    tertiary: '#666666',
    muted: '#4a4a4a',
  },

  // === 네온 색상 (사이버펑크) ===
  neon: {
    cyan: '#00e5ff',      // 밝기 조정된 네온 시안
    green: '#00ff88',     // 밝기 조정된 네온 그린
    magenta: '#ff00ff',
    yellow: '#ffff00',
    blue: '#0080ff',
    purple: '#a855f7',
  },

  // === Primary (메인 액션) ===
  primary: {
    DEFAULT: '#00e5ff',   // 네온 시안
    hover: '#00b8cc',
    light: 'rgba(0, 229, 255, 0.15)',
    muted: 'rgba(0, 229, 255, 0.3)',
  },

  // === 상태 색상 ===
  success: {
    DEFAULT: '#00ff88',   // 네온 그린
    light: 'rgba(0, 255, 136, 0.15)',
    dark: '#00cc6a',
    muted: 'rgba(0, 255, 136, 0.3)',
  },

  warning: {
    DEFAULT: '#ffaa00',
    light: 'rgba(255, 170, 0, 0.15)',
    dark: '#cc8800',
    muted: 'rgba(255, 170, 0, 0.3)',
  },

  danger: {
    DEFAULT: '#ff4757',
    light: 'rgba(255, 71, 87, 0.15)',
    dark: '#cc3945',
    muted: 'rgba(255, 71, 87, 0.3)',
  },

  info: {
    DEFAULT: '#0080ff',
    light: 'rgba(0, 128, 255, 0.15)',
    dark: '#0066cc',
    muted: 'rgba(0, 128, 255, 0.3)',
  },

  // === 테두리 ===
  border: {
    DEFAULT: '#2a2a2a',
    light: '#3a3a3a',
    dark: '#1a1a1a',
  },

  // === 코드 에디터 (사이버펑크 테마) ===
  code: {
    background: '#0d1117',
    text: '#c9d1d9',
    keyword: '#00e5ff',   // 네온 시안
    string: '#00ff88',    // 네온 그린
    comment: '#6e7681',
    number: '#ffff00',    // 네온 옐로우
    function: '#ff00ff',  // 네온 마젠타
  },

  // === 백준 티어 ===
  tier: {
    bronze: '#AD5600',
    silver: '#435F7A',
    gold: '#EC9A00',
    platinum: '#27E2A4',
    diamond: '#00B4FC',
    ruby: '#FF0062',
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
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
} as const;

// ============================================
// 그림자 (글로우 효과 포함)
// ============================================
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 2px 4px rgba(0, 0, 0, 0.4)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
  // 네온 글로우 효과
  glow: {
    cyan: '0 0 20px rgba(0, 229, 255, 0.4)',
    green: '0 0 20px rgba(0, 255, 136, 0.4)',
    magenta: '0 0 20px rgba(255, 0, 255, 0.4)',
    primary: '0 0 20px var(--color-primary-muted)',
  },
} as const;

// ============================================
// 애니메이션
// ============================================
export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    default: 'ease-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
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

// ============================================
// CSS 변수 생성 헬퍼
// ============================================
export function generateCSSVariables(): string {
  return `
    /* Fonts */
    --font-display: ${fonts.display};
    --font-sans: ${fonts.sans};
    --font-mono: ${fonts.mono};

    /* Background */
    --color-bg: ${colors.background.base};
    --color-bg-elevated: ${colors.background.elevated};
    --color-bg-tertiary: ${colors.background.tertiary};
    --color-bg-hover: ${colors.background.hover};

    /* Text */
    --color-text: ${colors.text.primary};
    --color-text-secondary: ${colors.text.secondary};
    --color-text-tertiary: ${colors.text.tertiary};
    --color-text-muted: ${colors.text.muted};

    /* Neon */
    --color-neon-cyan: ${colors.neon.cyan};
    --color-neon-green: ${colors.neon.green};
    --color-neon-magenta: ${colors.neon.magenta};
    --color-neon-yellow: ${colors.neon.yellow};

    /* Primary */
    --color-primary: ${colors.primary.DEFAULT};
    --color-primary-hover: ${colors.primary.hover};
    --color-primary-light: ${colors.primary.light};
    --color-primary-muted: ${colors.primary.muted};

    /* Success */
    --color-success: ${colors.success.DEFAULT};
    --color-success-light: ${colors.success.light};
    --color-success-dark: ${colors.success.dark};
    --color-success-muted: ${colors.success.muted};

    /* Warning */
    --color-warning: ${colors.warning.DEFAULT};
    --color-warning-light: ${colors.warning.light};
    --color-warning-dark: ${colors.warning.dark};
    --color-warning-muted: ${colors.warning.muted};

    /* Danger */
    --color-danger: ${colors.danger.DEFAULT};
    --color-danger-light: ${colors.danger.light};
    --color-danger-dark: ${colors.danger.dark};
    --color-danger-muted: ${colors.danger.muted};

    /* Info */
    --color-info: ${colors.info.DEFAULT};
    --color-info-light: ${colors.info.light};
    --color-info-dark: ${colors.info.dark};
    --color-info-muted: ${colors.info.muted};

    /* Border */
    --color-border: ${colors.border.DEFAULT};
    --color-border-light: ${colors.border.light};
    --color-border-dark: ${colors.border.dark};

    /* Shadows */
    --shadow-glow: ${shadows.glow.primary};
  `;
}

// 타입 export
export type ThemeColors = typeof colors;
export type ThemeFonts = typeof fonts;
