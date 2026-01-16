/**
 * LanguageTabs - 언어 선택 탭
 * 컴팩트 라이트 테마 스타일
 */

import { usePlaygroundStore } from '../stores/playgroundStore';
import type { SupportedLanguage } from '@/types';

const LANGUAGES: { id: SupportedLanguage; label: string; color: string }[] = [
  { id: 'c', label: 'C', color: '#3b82f6' },
  { id: 'python', label: 'Py', color: '#22c55e' },
  { id: 'java', label: 'Java', color: '#EC4899' },
];

export function LanguageTabs() {
  const { language, setLanguage } = usePlaygroundStore();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '2px',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
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
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: isActive ? '#ffffff' : 'transparent',
              color: isActive ? lang.color : '#9ca3af',
              boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isActive ? lang.color : '#d1d5db',
              }}
            />
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
