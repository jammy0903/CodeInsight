/**
 * LessonBottomNav - 하단 고정 스텝 네비게이션 바
 *
 * Duolingo/Codecademy 스타일: 화면 하단에 전체 너비로 고정.
 * 이전/다음 버튼이 넓은 터치 영역을 가짐.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks';

interface LessonBottomNavProps {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  nextLabel: string;
}

export function LessonBottomNav({
  onPrev,
  onNext,
  canGoPrev,
  nextLabel,
}: LessonBottomNavProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        backgroundColor: isDark ? 'rgba(13, 21, 37, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* 이전 버튼 */}
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '14px 0',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 600,
            border: `1.5px solid ${!canGoPrev
              ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
              : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')}`,
            backgroundColor: !canGoPrev
              ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
              : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
            color: !canGoPrev
              ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
              : (isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'),
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
          aria-label={t('common.previous')}
        >
          <ChevronLeft style={{ width: 20, height: 20 }} />
          <span>{t('common.previous')}</span>
        </button>

        {/* 다음 버튼 — 강조 */}
        <button
          onClick={onNext}
          style={{
            flex: 1.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '14px 0',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            backgroundColor: isDark ? '#7c5ce0' : '#7c3aed',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
          }}
          aria-label={nextLabel}
        >
          <span>{nextLabel}</span>
          <ChevronRight style={{ width: 20, height: 20 }} />
        </button>
      </div>
    </div>
  );
}
