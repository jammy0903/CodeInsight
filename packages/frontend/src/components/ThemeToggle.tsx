/**
 * 테마 토글 버튼
 *
 * 클릭할 때마다 테마 순환: soft → dark → minimal → soft
 */

import { useTranslation } from 'react-i18next';
import { Palette } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, cycleTheme } = useThemeStore();

  const labelKey = `theme.${theme}` as const;

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
      style={{
        backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
        color: theme === 'dark' ? '#e5e7eb' : '#4b5563',
        border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
      }}
      title={t('theme.change')}
    >
      <Palette size={14} />
      <span>{t(labelKey)}</span>
    </button>
  );
}
