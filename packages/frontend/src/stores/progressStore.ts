/**
 * 레슨 진도 스토어
 *
 * 계정 없이 동작하도록 완료한 레슨 ID를 localStorage에 저장한다.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  completedLessonIds: Record<string, true>;
  markCompleted: (lessonId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessonIds: {},
      markCompleted: (lessonId) =>
        set((s) => ({ completedLessonIds: { ...s.completedLessonIds, [lessonId]: true } })),
    }),
    { name: 'codeinsight-progress' }
  )
);
