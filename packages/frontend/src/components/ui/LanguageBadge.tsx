import React from 'react';
import type { SupportedLanguage } from '@/services/simulator';

interface LanguageBadgeProps {
  language: SupportedLanguage;
}

const languageStyles: Record<SupportedLanguage, { bg: string; text: string; border: string }> = {
  c: { bg: '#e0f2fe', text: '#0284c7', border: '#7dd3fc' },
  python: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  java: { bg: '#fff7ed', text: '#f97316', border: '#fdba74' },
  javascript: { bg: '#fefce8', text: '#eab308', border: '#fde047' },
};

export function LanguageBadge({ language }: LanguageBadgeProps) {
  const style = languageStyles[language] || languageStyles.c;

  return (
    <span
      className="px-2 py-1 text-xs font-bold rounded-md"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {language.toUpperCase()}
    </span>
  );
}
