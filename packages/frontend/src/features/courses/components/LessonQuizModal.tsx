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

/**
 * 퀴즈 질문에서 텍스트와 코드를 분리
 *
 * 패턴 1 (멀티라인): "질문?\ncode line 1\ncode line 2"
 *   → { text: "질문?", code: "code line 1\ncode line 2" }
 *
 * 패턴 2 (인라인): 'if ("") { console.log("실행"); }의 결과는?'
 *   → { text: "의 결과는?", code: 'if ("") { console.log("실행"); }' }
 */
function splitQuestionAndCode(question: string): { text: string; code: string | null } {
  const lines = question.split('\n');

  // 마지막 '?' 포함 줄 찾기
  let lastQuestionLineIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trimEnd().endsWith('?') || lines[i].trimEnd().endsWith('?)')) {
      lastQuestionLineIdx = i;
      break;
    }
  }

  // 패턴 1: 코드가 '?' 줄 뒤에 오는 경우
  if (lastQuestionLineIdx !== -1 && lastQuestionLineIdx < lines.length - 1) {
    const textPart = lines.slice(0, lastQuestionLineIdx + 1).join('\n');
    const codeLines = lines.slice(lastQuestionLineIdx + 1);
    while (codeLines.length > 0 && codeLines[0].trim() === '') {
      codeLines.shift();
    }
    if (codeLines.length > 0) {
      return { text: textPart, code: codeLines.join('\n') };
    }
  }

  // 패턴 2: 한 줄에서 코드가 앞에, 한국어 질문이 뒤에 오는 경우
  // 예: 'if ("") { console.log("실행"); }의 결과는?'
  // )};] 같은 코드 종료 문자 바로 뒤에 한국어가 시작되는 경계를 찾음
  const inlineMatch = question.match(/^(.+[)}\];])\s*([\uAC00-\uD7AF].+)$/);
  if (inlineMatch) {
    return { code: inlineMatch[1], text: inlineMatch[2] };
  }

  return { text: question, code: null };
}

interface LessonQuizModalProps {
  quiz: Quiz;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (isCorrect: boolean) => void;
  /** Dialog 내부에서 ← 키로 이전 스텝 이동 */
  onPrevStep?: () => void;
  canGoPrev?: boolean;
}

function QuizQuestion({ question }: { question: string }) {
  const { text, code } = splitQuestionAndCode(question);
  // 코드가 있으면: 코드 블록 먼저, 질문 텍스트 뒤에
  return (
    <div>
      {code && (
        <pre
          className="mb-3 px-4 py-3 rounded-lg text-sm font-mono leading-relaxed overflow-x-auto"
          style={{
            backgroundColor: 'var(--theme-lesson-editor-bg, #1e1e2e)',
            color: 'var(--theme-lesson-editor-text, #cdd6f4)',
            border: '1px solid var(--theme-lesson-panel-border, #313244)',
          }}
        >
          {code}
        </pre>
      )}
      <p className="text-base font-medium">{text}</p>
    </div>
  );
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

  // 제출 후 포커스 복원 (버튼 교체로 포커스 유실 방지)
  useEffect(() => {
    if (submitted) {
      requestAnimationFrame(() => {
        quizContainerRef.current?.focus({ preventScroll: true });
      });
    }
  }, [submitted]);

  return (
    <div className="space-y-4 outline-none" ref={quizContainerRef} tabIndex={-1}>
      <QuizQuestion question={quiz.question} />
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
