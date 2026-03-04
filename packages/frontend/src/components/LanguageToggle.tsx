/**
 * LanguageToggle - 언어 전환 컴팩트 토글
 *
 * 클릭 시 EN → KO → ZH → EN 순환. TopBar, Sidebar, Footer 등에 자연스럽게 배치.
 */

import { useTranslation } from 'react-i18next';

const LANG_CYCLE = [
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'ko', flag: '🇰🇷', label: 'KO' },
  { code: 'zh', flag: '🇨🇳', label: 'ZH' },
] as const;

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const currentIndex = LANG_CYCLE.findIndex((l) => l.code === currentLang);
  const current = LANG_CYCLE[currentIndex === -1 ? 0 : currentIndex];
  const next = LANG_CYCLE[(currentIndex + 1) % LANG_CYCLE.length];

  const toggle = () => {
    i18n.changeLanguage(next.code);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors border cursor-pointer"
      style={{
        borderColor: 'var(--theme-layout-top-bar-border)',
        color: 'var(--theme-layout-top-bar-text-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--theme-layout-top-bar-button-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={`Switch to ${next.label}`}
    >
      <span>{current.flag}</span>
      <span>{current.label}</span>
    </button>
  );
}
