import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('coslab-theme') as Theme) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // 실제 테마 적용
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 부드러운 전환을 위해 클래스 추가
    root.classList.add('theme-transition');

    let isDark: boolean;
    if (newTheme === 'system') {
      isDark = systemDark;
    } else {
      isDark = newTheme === 'dark';
    }

    if (isDark) {
      root.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      root.classList.remove('dark');
      setResolvedTheme('light');
    }

    // 전환 애니메이션 후 클래스 제거
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 200);
  }, []);

  // 테마 변경 함수
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('coslab-theme', newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  // 초기 로드 시 테마 적용
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  // 테마 토글 (light <-> dark)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,           // 'light' | 'dark' | 'system'
    resolvedTheme,   // 실제 적용된 테마 'light' | 'dark'
    setTheme,        // 테마 설정
    toggleTheme,     // 토글
    isDark: resolvedTheme === 'dark',
  };
}
