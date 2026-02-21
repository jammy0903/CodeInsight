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
  const prevText = t('common.previous');
  const quizText = t('lesson.quiz');

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '6px 12px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        backgroundColor: 'color-mix(in srgb, var(--theme-lesson-nav-bg) 68%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--theme-lesson-nav-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', maxWidth: '720px', margin: '0 auto' }}>
        {/* 이전 버튼 - 왼쪽 정렬, 터치 영역은 넓게 */}
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '6px',
            minHeight: '48px',
            padding: '0 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            border: 'none',
            backgroundColor: 'transparent',
            color: `var(${canGoPrev
              ? '--theme-lesson-nav-prev-text'
              : '--theme-lesson-nav-prev-disabled-text'})`,
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            transition: 'color 0.15s ease, opacity 0.15s ease',
            opacity: canGoPrev ? 0.95 : 0.45,
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label={prevText}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          <span>{prevText}</span>
        </button>

        {/* 퀴즈 버튼 - 중앙 미니멀 pill */}
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
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid color-mix(in srgb, var(--theme-lesson-nav-next-bg) 36%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--theme-lesson-nav-next-bg) 8%, transparent)',
              color: 'var(--theme-lesson-nav-next-bg)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              opacity: 0.88,
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label={quizText}
          >
            <Zap style={{ width: 12, height: 12 }} />
            <span>{quizText}</span>
          </button>
        )}

        {/* 다음 버튼 - 오른쪽 정렬, 터치 영역은 넓게 */}
        <button
          onClick={onNext}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            minHeight: '48px',
            padding: '0 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--theme-lesson-nav-prev-text)',
            cursor: 'pointer',
            transition: 'color 0.15s ease, opacity 0.15s ease',
            opacity: 0.96,
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
