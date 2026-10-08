/**
 * 레슨 진도 스토어
 *
 * 계정 없이 동작하도록 완료한 레슨 ID와 예측 결과를 localStorage에 저장한다.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 스텝 인덱스 → 첫 예측의 정답 여부 */
export type PredictionResults = Record<number, boolean>;

interface ProgressState {
  completedLessonIds: Record<string, true>;
  predictions: Record<string, PredictionResults>;
  markCompleted: (lessonId: string) => void;
  /** 첫 답만 기록한다 (다시 풀어 맞혀도 오개념 기록이 덮이지 않도록) */
  recordPrediction: (lessonId: string, stepIndex: number, correct: boolean) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessonIds: {},
      predictions: {},
      markCompleted: (lessonId) =>
        set((s) => ({ completedLessonIds: { ...s.completedLessonIds, [lessonId]: true } })),
      recordPrediction: (lessonId, stepIndex, correct) =>
        set((s) => {
          const lessonResults = s.predictions[lessonId] ?? {};
          if (stepIndex in lessonResults) return s;
          return {
            predictions: {
              ...s.predictions,
              [lessonId]: { ...lessonResults, [stepIndex]: correct },
            },
          };
        }),
    }),
    { name: 'codeinsight-progress' }
  )
);
