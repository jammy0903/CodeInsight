/**
 * COSLAB 테마 팩토리
 * iOS Human Interface Guidelines 기반
 * - Clarity: 명확한 계층 구조
 * - Deference: 콘텐츠 중심
 * - Depth: 레이어 구분
 */

// 색상 팔레트
export const colors = {
  // 배경 (눈 편한 다크 톤)
  bg: {
    primary: '#161618',      // 메인 배경
    secondary: '#1a1a1d',    // 보조 배경 (카드, 행)
    tertiary: '#131315',     // 코드/터미널 배경
    elevated: '#1e1e22',     // 호버, 모달
    input: '#252530',        // 입력필드, 버튼
  },

  // 테두리
  border: {
    primary: '#252530',
    secondary: '#202025',
    subtle: '#1a1a1d',
  },

  // 텍스트
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    tertiary: '#999999',
    muted: '#666666',
    placeholder: '#555555',
  },

  // 액센트 (Toss 스타일)
  accent: {
    blue: '#3182f6',        // 메인 액션
    blueHover: '#1b64da',
    green: '#20c997',       // 성공/채점
    greenHover: '#12b886',
    red: '#f87171',         // 에러
    yellow: '#fbbf24',      // 경고/시도
  },

  // 난이도 색상
  tier: {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#4ade80',
    diamond: '#60a5fa',
    ruby: '#ef4444',
  },
} as const;

// 간격
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const;

// 폰트 크기
export const fontSize = {
  xs: '10px',
  sm: '11px',
  md: '12px',
  lg: '14px',
  xl: '16px',
  xxl: '18px',
  title: '20px',
} as const;

// 버튼 스타일
export const button = {
  // 패딩
  padding: {
    sm: '6px 12px',
    md: '7px 14px',
    lg: '8px 18px',
  },

  // 둥글기
  radius: '9999px',  // pill 형태

  // 프리셋
  primary: {
    background: colors.accent.blue,
    color: '#ffffff',
    hoverBg: colors.accent.blueHover,
  },
  success: {
    background: colors.accent.green,
    color: '#ffffff',
    hoverBg: colors.accent.greenHover,
  },
  secondary: {
    background: colors.bg.input,
    color: colors.text.tertiary,
    hoverColor: '#ffffff',
  },
} as const;

// 테이블/리스트
export const table = {
  headerBg: '#121214',
  rowEven: colors.bg.primary,
  rowOdd: colors.bg.secondary,
  rowHover: colors.bg.elevated,
  gap: '16px',
} as const;

// 아바타
export const avatar = {
  size: 16,
} as const;

// 그림자 (iOS depth)
export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 2px 8px rgba(0,0,0,0.4)',
  lg: '0 4px 16px rgba(0,0,0,0.5)',
} as const;

// CSS 변수로 내보내기 (optional)
export const cssVariables = `
  :root {
    --bg-primary: ${colors.bg.primary};
    --bg-secondary: ${colors.bg.secondary};
    --bg-tertiary: ${colors.bg.tertiary};
    --bg-elevated: ${colors.bg.elevated};
    --bg-input: ${colors.bg.input};

    --border-primary: ${colors.border.primary};
    --border-secondary: ${colors.border.secondary};

    --text-primary: ${colors.text.primary};
    --text-secondary: ${colors.text.secondary};
    --text-tertiary: ${colors.text.tertiary};
    --text-muted: ${colors.text.muted};

    --accent-blue: ${colors.accent.blue};
    --accent-green: ${colors.accent.green};
    --accent-red: ${colors.accent.red};
  }
`;

// 타입 export
export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeFontSize = typeof fontSize;
