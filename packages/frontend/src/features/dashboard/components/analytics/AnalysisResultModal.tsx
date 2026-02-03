/**
 * AnalysisResultModal - AI 분석 결과 모달
 */

import { Sparkles, X } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

interface AnalysisResultModalProps {
  result: string | null;
  onClose: () => void;
}

export function AnalysisResultModal({ result, onClose }: AnalysisResultModalProps) {
  const currentTheme = useThemeStore((s) => s.theme);
  const iconColor = currentTheme === 'dark' ? '#c084fc' : '#a855f7';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="rounded-xl max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--theme-dashboard-card-bg)' }}>
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3" style={{ borderBottom: `1px solid ${'var(--theme-dashboard-card-border)'}` }}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: iconColor }} />
            <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--theme-dashboard-text)' }}>AI 분석 결과</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--theme-dashboard-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-dashboard-stat-card-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto max-h-[65vh] sm:max-h-[60vh]">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-xs sm:text-sm" style={{ color: 'var(--theme-dashboard-text)' }}>
            {result || '분석 결과가 없습니다.'}
          </div>
        </div>

        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex justify-end" style={{ borderTop: `1px solid ${'var(--theme-dashboard-card-border)'}` }}>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white font-medium rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--theme-dashboard-accent)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-dashboard-accent-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-dashboard-accent)'}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
