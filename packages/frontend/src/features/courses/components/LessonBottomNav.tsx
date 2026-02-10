/**
 * LessonBottomNav - 하단 고정 스텝 네비게이션 바
 *
 * Duolingo/Codecademy 스타일: 화면 하단에 전체 너비로 고정.
 * 이전/다음 버튼이 넓은 터치 영역을 가짐.
 * 색상은 테마 CSS 변수 사용 (theme.css --theme-lesson-nav-*)
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
        backgroundColor: 'var(--theme-lesson-nav-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--theme-lesson-nav-border)',
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
            border: `1.5px solid var(${canGoPrev
              ? '--theme-lesson-nav-prev-border'
              : '--theme-lesson-nav-prev-disabled-border'})`,
            backgroundColor: `var(${canGoPrev
              ? '--theme-lesson-nav-prev-bg'
              : '--theme-lesson-nav-prev-disabled-bg'})`,
            color: `var(${canGoPrev
              ? '--theme-lesson-nav-prev-text'
              : '--theme-lesson-nav-prev-disabled-text'})`,
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
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '14px 0',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            backgroundColor: 'var(--theme-lesson-nav-next-bg)',
            color: 'var(--theme-lesson-nav-next-text)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--theme-lesson-nav-next-shadow)',
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
