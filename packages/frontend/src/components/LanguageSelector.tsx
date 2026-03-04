/**
 * LanguageSelector - 언어 전환 컴포넌트
 *
 * WHY: 사용자가 앱 언어를 한국어/영어로 전환
 * FEATURES:
 *   - i18next 통합 (useTranslation hook)
 *   - localStorage 자동 저장 (i18next-browser-languagedetector)
 *   - 시각적 피드백 (현재 선택 언어 하이라이트)
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Language {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en'; // 'en-US' → 'en'

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {LANGUAGES.map((lang) => {
        const isSelected = currentLang === lang.code;

        return (
          <motion.button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all
              ${isSelected
                ? 'border-orange-400 bg-orange-50'
                : 'border-[var(--theme-dashboard-card-border)] bg-[var(--theme-dashboard-section-header-bg)] hover:border-orange-200'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className={`text-sm font-medium ${isSelected ? 'text-orange-700' : 'text-[var(--theme-dashboard-title)]'}`}>
              {lang.label}
            </span>
            {isSelected && (
              <Check className="absolute top-2 right-2 w-4 h-4 text-orange-500" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
