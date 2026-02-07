/**
 * LessonCompletedView - 레슨 완료 화면
 *
 * 레슨 완료 시 표시되는 축하 UI.
 * 다음 레슨 이동 또는 레슨 목록 복귀 버튼 포함.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useEnterKey } from '@/hooks';
import { useFocusCycle } from '@/hooks/useFocusCycle';

interface LessonCompletedViewProps {
  lessonOrder: number;
  nextLessonPath: string | null;
  chapterPath: string;
}

export function LessonCompletedView({
  lessonOrder,
  nextLessonPath,
  chapterPath,
}: LessonCompletedViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasNext = nextLessonPath !== null;
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusCycle({
    containerRef,
    enabled: true,
    keyBindings: { next: ['ArrowRight'], prev: ['ArrowLeft'] },
  });

  useEnterKey({
    onEnter: () => {
      if (hasNext) {
        navigate(nextLessonPath!);
      } else {
        navigate(chapterPath);
      }
    },
    enabled: true,
    targetRef: containerRef,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      containerRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="max-w-md mx-auto mt-12 rounded-2xl p-8 text-center outline-none"
      ref={containerRef}
      tabIndex={-1}
      style={{
        background: 'var(--theme-lesson-memory-bg)',
        border: '1px solid var(--theme-lesson-panel-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div
        className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #7a9a7a 0%, #6a8a6a 100%)',
          boxShadow: '0 4px 16px rgba(122, 154, 122, 0.3)',
        }}
      >
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-[var(--theme-dashboard-title)]">
        {t('lesson.completed_title', { order: lessonOrder })}
      </h2>
      <p className="mb-6 text-[var(--theme-dashboard-text)]">
        {hasNext ? t('lesson.continue_next') : t('lesson.chapter_completed')}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate(chapterPath)}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all bg-[var(--theme-lesson-button-secondary-bg)] border border-[var(--theme-lesson-button-secondary-border)] text-[var(--theme-lesson-button-secondary-text)]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('lesson.lesson_list')}
        </button>
        {hasNext && (
          <button
            onClick={() => navigate(nextLessonPath!)}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #7a9a7a 0%, #6a8a6a 100%)',
              border: 'none',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(122, 154, 122, 0.3)',
            }}
          >
            {t('lesson.next_lesson')}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
