/**
 * LanguageTabs - 언어 선택 탭
 * 각 탭이 pill 모양, 전체 너비를 균등하게 차지
 */

import { memo, useMemo } from 'react';
import { usePlaygroundStore } from '../stores/playgroundStore';
import type { SupportedLanguage } from '@/types';

const LANGUAGES: { id: SupportedLanguage; label: string; shortLabel: string; color: string }[] = [
  { id: 'c', label: 'C', shortLabel: 'C', color: '#3b82f6' },
  { id: 'cpp', label: 'C++', shortLabel: 'C++', color: '#6366f1' },
  { id: 'python', label: 'Python', shortLabel: 'Py', color: '#22c55e' },
  { id: 'java', label: 'Java', shortLabel: 'Java', color: '#EC4899' },
  { id: 'javascript', label: 'JS', shortLabel: 'JS', color: '#f59e0b' },
];

interface LanguageTabsProps {
  isMobile?: boolean;
}

export const LanguageTabs = memo(function LanguageTabs({ isMobile = false }: LanguageTabsProps) {
  const { language, setLanguage } = usePlaygroundStore();

  const containerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: isMobile ? '6px' : '6px',
    width: '100%',
  } as const), [isMobile]);

  const baseButtonStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? '5px' : '5px',
    padding: isMobile ? '7px 14px' : '6px 14px',
    borderRadius: '999px',
    fontSize: isMobile ? '12px' : '12px',
    fontWeight: 600,
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  } as const), [isMobile]);

  const indicatorSize = isMobile ? '5px' : '6px';

  return (
    <div style={containerStyle}>
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.id;
        return (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            style={{
              ...baseButtonStyle,
              backgroundColor: isActive ? 'var(--theme-memory-lang-active-bg)' : 'transparent',
              color: isActive ? 'var(--theme-memory-lang-active-text)' : 'var(--theme-memory-lang-inactive-text)',
              borderColor: isActive ? 'var(--theme-memory-reset-border)' : 'transparent',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <span
              style={{
                width: indicatorSize,
                height: indicatorSize,
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: isActive ? lang.color : '#d1d5db',
              }}
            />
            {isMobile ? lang.shortLabel : lang.label}
          </button>
        );
      })}
    </div>
  );
});
