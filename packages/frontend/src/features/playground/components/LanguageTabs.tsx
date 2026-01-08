/**
 * LanguageTabs - 언어 선택 탭
 * C | Python | Java 전환
 */

import { usePlaygroundStore } from '../stores/playgroundStore';
import type { SupportedLanguage } from '@/types';

const LANGUAGES: { id: SupportedLanguage; label: string; icon: string }[] = [
  { id: 'c', label: 'C', icon: '🔵' },
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'java', label: 'Java', icon: '☕' },
];

export function LanguageTabs() {
  const { language, setLanguage } = usePlaygroundStore();

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-600">Language:</span>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`
              px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${
                language === lang.id
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <span className="mr-1.5">{lang.icon}</span>
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
