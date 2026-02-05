/**
 * LessonQuizModal - 퀴즈 다이얼로그
 *
 * 레슨 마지막 스텝 후 표시되는 퀴즈.
 * Dialog로 래핑, 정답/오답 피드백 + Enter 키 지원.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useEnterKey } from '@/hooks';
import { useFocusCycle } from '@/hooks/useFocusCycle';
import type { Quiz } from '@/types';

interface LessonQuizModalProps {
  quiz: Quiz;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (isCorrect: boolean) => void;
  /** Dialog 내부에서 ← 키로 이전 스텝 이동 */
  onPrevStep?: () => void;
  canGoPrev?: boolean;
}

function QuizCardAdapter({
  quiz,
  onComplete,
}: {
  quiz: Quiz;
  onComplete: (isCorrect: boolean) => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const quizContainerRef = useRef<HTMLDivElement>(null);

  const options = quiz.options || [];
  const correctIndex = parseInt(quiz.answer, 10);
  const isCorrect = selected === correctIndex;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const handleContinue = () => {
    onComplete(isCorrect);
  };

  useEnterKey({
    onEnter: () => {
      if (!submitted && selected !== null) handleSubmit();
      else if (submitted) handleContinue();
    },
    enabled: (selected !== null && !submitted) || submitted,
    targetRef: quizContainerRef,
  });

  useFocusCycle({
    containerRef: quizContainerRef,
    enabled: !submitted,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      quizContainerRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4 outline-none" ref={quizContainerRef} tabIndex={-1}>
      <pre className="text-lg font-medium whitespace-pre-wrap font-sans">
        {quiz.question}
      </pre>
      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => !submitted && setSelected(idx)}
            disabled={submitted}
            className={`w-full p-3 text-left rounded-lg border-2 transition-colors whitespace-pre-wrap ${submitted
              ? idx === correctIndex
                ? 'border-green-500 bg-green-50 dark:bg-green-900 bg-opacity-20'
                : idx === selected
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 bg-opacity-20'
                  : 'border-[var(--theme-dashboard-card-border)]'
              : selected === idx
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 bg-opacity-20'
                : 'border-[var(--theme-dashboard-card-border)] hover:border-[var(--theme-dashboard-progress-bg)]'
              }`}
          >
            {option}
          </button>
        ))}
      </div>
      {submitted && quiz.explanation && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <p className="text-sm">{quiz.explanation}</p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className={`btn-primary px-4 py-2 ${selected === null ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t('common.submit')}
          </button>
        ) : (
          <button onClick={handleContinue} className="btn-success px-4 py-2">
            {isCorrect ? t('lesson.completed') : t('lesson.study_again')}
          </button>
        )}
      </div>
    </div>
  );
}

export function LessonQuizModal({
  quiz,
  open,
  onOpenChange,
  onComplete,
  onPrevStep,
  canGoPrev,
}: LessonQuizModalProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl max-h-[85vh] overflow-y-auto"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' && canGoPrev && onPrevStep) {
            e.preventDefault();
            onPrevStep();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🧠 {t('lesson.quiz')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('lesson.quiz_session_desc')}
          </DialogDescription>
        </DialogHeader>
        <QuizCardAdapter quiz={quiz} onComplete={onComplete} />
      </DialogContent>
    </Dialog>
  );
}
