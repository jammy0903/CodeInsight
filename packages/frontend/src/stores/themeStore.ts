/**
 * 테마 스토어
 *
 * Zustand로 테마 상태 중앙 관리
 * localStorage에 저장하여 새로고침해도 유지
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeType } from '@/config/themes';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  cycleTheme: () => void;
}

const THEME_ORDER: ThemeType[] = ['soft', 'dark', 'minimal'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'soft',

      setTheme: (theme) => set({ theme }),

      // 테마 순환 (soft → dark → minimal → soft)
      cycleTheme: () => {
        const currentIndex = THEME_ORDER.indexOf(get().theme);
        const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
        set({ theme: THEME_ORDER[nextIndex] });
      },
    }),
    {
      name: 'codeinsight-theme',
    }
  )
);
