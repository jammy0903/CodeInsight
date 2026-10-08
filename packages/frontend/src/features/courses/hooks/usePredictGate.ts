/**
 * usePredictGate - 시각화 라운드의 "실행 중 예측하기"
 *
 * WHY: 결과를 보기 전에 먼저 예측하게 해서, 틀린 예측(오개념)을 시각화로 바로 교정한다.
 *
 * 흐름:
 *   1. 시각화 라운드에서 다음 스텝에 predict가 있고 아직 답하지 않았으면 이동을 막고 질문을 띄운다
 *      (시각화는 현재 상태 그대로, 코드 하이라이트는 곧 실행될 줄)
 *   2. 답하면 결과를 기록하고 그 스텝으로 이동 → 시각화가 실제 변화를 보여준다
 *   3. 이동 후에는 정답/오답 피드백을 표시한다
 *
 * 버튼, 키보드, 스와이프 모두 이 훅의 goNext/goPrev를 거친다.
 */

import { useCallback, useState } from 'react';
import type { LessonStep, StepPredict } from '@/types';
import type { LessonRound } from './useRoundNavigation';
import { useProgressStore } from '@/stores/progressStore';

interface RoundNav {
  round: LessonRound;
  stepIndex: number;
  totalInRound: number;
  actualStepIndex: number;
  vizStepIndices: number[];
  goNext: () => void;
  goPrev: () => void;
}

interface UsePredictGateOptions {
  steps: LessonStep[];
  nav: RoundNav;
  lessonId: string;
}

export interface PredictFeedback {
  predict: StepPredict;
  chosen: number;
  correct: boolean;
}

interface UsePredictGateReturn {
  /** 답을 기다리는 스텝 (전체 steps 기준 인덱스), 없으면 null */
  pendingIndex: number | null;
  pendingPredict: StepPredict | null;
  /** 방금 답한 예측의 결과 (현재 스텝이 그 예측 스텝일 때만) */
  feedback: PredictFeedback | null;
  goNext: () => void;
  goPrev: () => void;
  answer: (optionIndex: number) => void;
}

/**
 * 다음으로 넘어갈 때 예측 질문을 띄워야 하는 스텝 인덱스를 구한다.
 * 시각화 라운드 안에서의 이동만 대상으로 한다 (라운드 전환/퀴즈 이동은 제외).
 */
export function findPredictGate(
  steps: LessonStep[],
  nav: Pick<RoundNav, 'round' | 'stepIndex' | 'totalInRound' | 'vizStepIndices'>,
  answered: Record<number, number>,
): number | null {
  if (nav.round !== 'visualization') return null;
  if (nav.stepIndex + 1 >= nav.totalInRound) return null;

  const nextIndex = nav.vizStepIndices[nav.stepIndex + 1];
  if (nextIndex === undefined) return null;
  if (!steps[nextIndex]?.predict) return null;
  if (nextIndex in answered) return null;
  return nextIndex;
}

export function usePredictGate({ steps, nav, lessonId }: UsePredictGateOptions): UsePredictGateReturn {
  const recordPrediction = useProgressStore((s) => s.recordPrediction);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  // 이번 세션에서 답한 예측: 스텝 인덱스 → 고른 보기
  const [answered, setAnswered] = useState<Record<number, number>>({});

  const goNext = useCallback(() => {
    if (pendingIndex !== null) return; // 답하기 전에는 넘어가지 않는다
    const gate = findPredictGate(steps, nav, answered);
    if (gate !== null) {
      setPendingIndex(gate);
      return;
    }
    nav.goNext();
  }, [pendingIndex, steps, nav, answered]);

  const goPrev = useCallback(() => {
    if (pendingIndex !== null) {
      setPendingIndex(null); // 질문을 닫고 현재 스텝에 머문다
      return;
    }
    nav.goPrev();
  }, [pendingIndex, nav]);

  const answer = useCallback((optionIndex: number) => {
    if (pendingIndex === null) return;
    const predict = steps[pendingIndex]?.predict;
    if (!predict) return;

    recordPrediction(lessonId, pendingIndex, optionIndex === predict.answer);
    setAnswered((prev) => ({ ...prev, [pendingIndex]: optionIndex }));
    setPendingIndex(null);
    nav.goNext();
  }, [pendingIndex, steps, lessonId, recordPrediction, nav]);

  const currentPredict = steps[nav.actualStepIndex]?.predict;
  const chosen = answered[nav.actualStepIndex];
  const feedback: PredictFeedback | null =
    nav.round === 'visualization' && currentPredict && chosen !== undefined && pendingIndex === null
      ? { predict: currentPredict, chosen, correct: chosen === currentPredict.answer }
      : null;

  return {
    pendingIndex,
    pendingPredict: pendingIndex !== null ? steps[pendingIndex]?.predict ?? null : null,
    feedback,
    goNext,
    goPrev,
    answer,
  };
}
