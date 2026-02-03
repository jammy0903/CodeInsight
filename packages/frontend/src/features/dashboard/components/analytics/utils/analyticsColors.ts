/**
 * 분석 리포트 테마별 색상 매핑
 */

export const SECTION_COLORS = {
  dark: {
    headerBg: '#18181b',
    headerText: '#22d3ee',
    headerBorder: '#27272a',
    badgeBg: '#27272a',
    badgeText: '#a1a1aa',
  },
  soft: {
    headerBg: '#fdf2f8',
    headerText: '#be185d',
    headerBorder: '#f9a8d4',
    badgeBg: '#fce7f3',
    badgeText: '#9d174d',
  },
  minimal: {
    headerBg: '#fef3c7',
    headerText: '#b45309',
    headerBorder: '#fcd34d',
    badgeBg: '#fef9c3',
    badgeText: '#92400e',
  },
} as const;

export type ThemeKey = keyof typeof SECTION_COLORS;

export function getAnalyticsColors(theme: ThemeKey) {
  const colors = SECTION_COLORS[theme];
  return {
    ...colors,
    barActiveColor: 'var(--theme-dashboard-accent)',
    barInactiveColor: 'var(--theme-dashboard-progress-bg)',
  };
}
