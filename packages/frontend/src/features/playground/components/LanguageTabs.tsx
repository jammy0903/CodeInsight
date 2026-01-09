/**
 * LanguageTabs - 언어 선택 탭
 * 컴팩트 스타일
 */

import { usePlaygroundStore } from '../stores/playgroundStore';
import type { SupportedLanguage } from '@/types';

const LANGUAGES: { id: SupportedLanguage; label: string; color: string }[] = [
  { id: 'c', label: 'C', color: '#58a6ff' },
  { id: 'python', label: 'Python', color: '#3fb950' },
  { id: 'java', label: 'Java', color: '#f0883e' },
];

export function LanguageTabs() {
  const { language, setLanguage } = usePlaygroundStore();

  return (
    <div className="flex items-center gap-1 p-0.5 bg-[#21262d] rounded border border-[#30363d]">
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.id;
        return (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all
              ${isActive
                ? 'bg-[#30363d] text-white'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }
            `}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isActive ? lang.color : '#484f58' }}
            />
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
