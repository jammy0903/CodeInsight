/**
 * LessonBottomNav - 플로팅 스텝 네비게이션 버튼
 *
 * 하단 바 없이 버튼만 화면 하단에 고정(fixed) 표시.
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
  const prevText = t('common.previous');
  const quizText = t('lesson.quiz');

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '42px',
            padding: '0 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            border: canGoPrev
              ? '1px solid var(--theme-lesson-nav-prev-border)'
              : '1px solid var(--theme-lesson-nav-prev-disabled-border)',
            backgroundColor: canGoPrev
              ? 'var(--theme-lesson-nav-prev-bg)'
              : 'var(--theme-lesson-nav-prev-disabled-bg)',
            color: `var(${canGoPrev ? '--theme-lesson-nav-prev-text' : '--theme-lesson-nav-prev-disabled-text'})`,
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            opacity: canGoPrev ? 1 : 0.65,
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label={prevText}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          <span>{prevText}</span>
        </button>

        {onQuiz && (
          <button
            onClick={onQuiz}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minHeight: '40px',
              padding: '0 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid color-mix(in srgb, var(--theme-lesson-nav-next-bg) 36%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--theme-lesson-nav-next-bg) 8%, transparent)',
              color: 'var(--theme-lesson-nav-next-bg)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label={quizText}
          >
            <Zap style={{ width: 12, height: 12 }} />
            <span>{quizText}</span>
          </button>
        )}

        <button
          onClick={onNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '42px',
            padding: '0 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            border: '1px solid var(--theme-lesson-nav-next-bg)',
            backgroundColor: 'var(--theme-lesson-nav-next-bg)',
            color: 'var(--theme-lesson-nav-next-text)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--theme-lesson-nav-next-shadow)',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label={nextLabel}
        >
          <span>{nextLabel}</span>
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}
