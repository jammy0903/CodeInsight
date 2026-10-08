/**
 * PredictPanel - 실행 중 예측 질문 카드 / 결과 피드백
 *
 * - PredictQuestion: 다음 스텝 실행 전, 결과를 먼저 고르게 한다
 * - PredictResult: 이동 후 내 예측과 실제 결과를 비교해 보여준다
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import type { StepPredict } from '@/types';
import type { PredictFeedback } from '../hooks/usePredictGate';

/** `code` 표기를 인라인 코드로 렌더링 (레슨 JSON의 질문은 마크다운 백틱을 사용) */
function InlineCodeText({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) =>
        i % 2 === 1
          ? <code key={i} className="px-1 py-0.5 rounded bg-black/5 font-mono text-[0.9em]">{part}</code>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

interface PredictQuestionProps {
  predict: StepPredict;
  onAnswer: (optionIndex: number) => void;
}

export function PredictQuestion({ predict, onAnswer }: PredictQuestionProps) {
  const { t } = useTranslation();

  return (
    <div
      role="dialog"
      aria-labelledby="predict-question"
      className="m-3 rounded-xl border-2 border-[var(--theme-dashboard-accent)] bg-[var(--theme-lesson-panel-bg)] p-4 shadow-md"
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--theme-dashboard-accent)]">
        <HelpCircle className="w-4 h-4" />
        {t('lesson.predict.title')}
      </div>
      <p id="predict-question" className="mt-2 text-sm md:text-base font-semibold">
        <InlineCodeText text={predict.question} />
      </p>
      <div className="mt-3 grid gap-2">
        {predict.options.map((option, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAnswer(i)}
            className="text-left px-3 py-2 rounded-lg border border-[var(--theme-lesson-panel-border)] font-mono text-sm transition-colors hover:border-[var(--theme-dashboard-accent)] hover:bg-black/5"
          >
            <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
            {option}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs opacity-60">{t('lesson.predict.hint')}</p>
    </div>
  );
}

interface PredictResultProps {
  feedback: PredictFeedback;
}

export function PredictResult({ feedback }: PredictResultProps) {
  const { t } = useTranslation();
  const { predict, chosen, correct } = feedback;

  return (
    <div
      role="status"
      className={`mx-3 mt-3 rounded-lg border px-3 py-2 text-sm ${
        correct
          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
          : 'border-rose-300 bg-rose-50 text-rose-900'
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        {correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        {correct ? t('lesson.predict.correct') : t('lesson.predict.wrong')}
      </div>
      {!correct && (
        <p className="mt-1 font-mono text-xs">
          {t('lesson.predict.your_answer', { answer: predict.options[chosen] })}
          {' → '}
          {t('lesson.predict.actual_answer', { answer: predict.options[predict.answer] })}
        </p>
      )}
      <p className="mt-1 text-xs opacity-80">{t('lesson.predict.look')}</p>
    </div>
  );
}
