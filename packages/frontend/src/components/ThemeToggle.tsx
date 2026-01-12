/**
 * 테마 토글 버튼
 *
 * 클릭할 때마다 테마 순환: soft → dark → minimal → soft
 */

import { Palette } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { themeLabels } from '@/config/themes';

export function ThemeToggle() {
  const { theme, cycleTheme } = useThemeStore();

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
      style={{
        backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
        color: theme === 'dark' ? '#e5e7eb' : '#4b5563',
        border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
      }}
      title="테마 변경"
    >
      <Palette size={14} />
      <span>{themeLabels[theme]}</span>
    </button>
  );
}
