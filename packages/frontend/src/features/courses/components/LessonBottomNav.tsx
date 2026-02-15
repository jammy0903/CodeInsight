/**
 * LessonBottomNav - 하단 고정 스텝 네비게이션 바 (compact, 반투명)
 *
 * 화면 하단에 항상 고정. 반투명 배경 + blur.
 * 색상은 테마 CSS 변수 사용 (theme.css --theme-lesson-nav-*)
 */

import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LessonBottomNavProps {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  nextLabel: string;
  onQuiz?: () => void;
}

export function LessonBottomNav({
  onPrev,
  onNext,
  canGoPrev,
  nextLabel,
  onQuiz,
}: LessonBottomNavProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '6px 12px',
        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
        backgroundColor: 'color-mix(in srgb, var(--theme-lesson-nav-bg) 75%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--theme-lesson-nav-border)',
      }}
    >
      <div style={{ display: 'flex', gap: '8px', maxWidth: '600px', margin: '0 auto' }}>
        {/* 이전 버튼 */}
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '8px 0',
            borderRadius: '10px',
            fontSize: '13px',
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
          <ChevronLeft style={{ width: 16, height: 16 }} />
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
            gap: '4px',
            padding: '8px 0',
            borderRadius: '10px',
            fontSize: '13px',
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
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>

        {/* 바로 퀴즈풀기 버튼 — 반투명 */}
        {onQuiz && (
          <button
            onClick={onQuiz}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '8px 10px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid var(--theme-lesson-nav-next-bg)',
              backgroundColor: 'color-mix(in srgb, var(--theme-lesson-nav-next-bg) 15%, transparent)',
              color: 'var(--theme-lesson-nav-next-bg)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              opacity: 0.75,
            }}
            aria-label={t('lesson.quiz')}
          >
            <Zap style={{ width: 12, height: 12 }} />
            <span>{t('lesson.quiz')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
