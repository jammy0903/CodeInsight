/**
 * LanguageTabs - 언어 선택 탭
 * 컴팩트 라이트 테마 스타일
 * 반응형 지원 (모바일에서 더 컴팩트)
 */

import { usePlaygroundStore } from '../stores/playgroundStore';
import type { SupportedLanguage } from '@/types';

const LANGUAGES: { id: SupportedLanguage; label: string; shortLabel: string; color: string }[] = [
  { id: 'c', label: 'C', shortLabel: 'C', color: '#3b82f6' },
  { id: 'python', label: 'Py', shortLabel: 'Py', color: '#22c55e' },
  { id: 'java', label: 'Java', shortLabel: 'Ja', color: '#EC4899' },
];

interface LanguageTabsProps {
  isMobile?: boolean;
}

export function LanguageTabs({ isMobile = false }: LanguageTabsProps) {
  const { language, setLanguage } = usePlaygroundStore();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '2px',
        backgroundColor: 'var(--theme-memory-reset-bg)',
        borderRadius: isMobile ? '4px' : '6px',
        border: '1px solid var(--theme-memory-reset-border)',
      }}
    >
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.id;
        return (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '2px' : '4px',
              padding: isMobile ? '3px 5px' : '4px 8px',
              borderRadius: isMobile ? '3px' : '4px',
              fontSize: isMobile ? '10px' : '11px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: isActive ? 'var(--theme-memory-lang-active-bg)' : 'var(--theme-memory-lang-inactive-bg)',
              color: isActive ? 'var(--theme-memory-lang-active-text)' : 'var(--theme-memory-lang-inactive-text)',
              boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <span
              style={{
                width: isMobile ? '4px' : '6px',
                height: isMobile ? '4px' : '6px',
                borderRadius: '50%',
                backgroundColor: isActive ? lang.color : '#d1d5db',
              }}
            />
            {isMobile ? lang.shortLabel : lang.label}
          </button>
        );
      })}
    </div>
  );
}
