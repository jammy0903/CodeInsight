/**
 * LanguageTabs - 언어 선택 탭
 */

import type { LanguageMeta } from '@/data/courses';
import { cn } from '@/lib/utils';

interface LanguageTabsProps {
  languages: LanguageMeta[];
  activeLanguage: string;
  onChange: (langId: string) => void;
}

export function LanguageTabs({
  languages,
  activeLanguage,
  onChange,
}: LanguageTabsProps) {
  return (
    <div className="flex gap-1 border-b">
      {languages.map((lang) => {
        const isActive = activeLanguage === lang.id;

        return (
          <button
            key={lang.id}
            onClick={() => onChange(lang.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              'hover:text-primary focus:outline-none',
              'border-b-2 -mb-px',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="mr-1.5">{lang.icon}</span>
            {lang.name}
          </button>
        );
      })}
    </div>
  );
}
