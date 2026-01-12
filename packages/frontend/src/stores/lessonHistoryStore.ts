/**
 * Lesson History Store
 * 최근 본 Lesson 코드를 localStorage에 저장
 *
 * WHY: 향후 "최근 학습", "이어서 학습", AI 컨텍스트 연동 등에 활용
 * STORAGE: localStorage (persist middleware)
 * LIMIT: 최대 5개
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLanguage } from '@/types';

const MAX_HISTORY_ENTRIES = 5;

/** 최근 본 Lesson 기록 */
export interface LessonHistoryEntry {
  lessonId: string;
  chapterId: string;
  title: string;
  code: string;
  language: SupportedLanguage;
  viewedAt: number;
}

interface LessonHistoryState {
  /** 최근 본 Lesson 목록 (최신순) */
  entries: LessonHistoryEntry[];
}

interface LessonHistoryActions {
  /** Lesson 추가 (중복 시 업데이트, 최대 개수 유지) */
  addEntry: (entry: Omit<LessonHistoryEntry, 'viewedAt'>) => void;

  /** 특정 Lesson 제거 */
  removeEntry: (lessonId: string) => void;

  /** 전체 히스토리 초기화 */
  clearHistory: () => void;

  /** 특정 언어의 최근 Lesson만 가져오기 */
  getEntriesByLanguage: (language: string) => LessonHistoryEntry[];
}

type LessonHistoryStore = LessonHistoryState & LessonHistoryActions;

export const useLessonHistoryStore = create<LessonHistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          // 중복 제거 (같은 lessonId는 업데이트)
          const filtered = state.entries.filter(
            (e) => e.lessonId !== entry.lessonId
          );

          // 새 엔트리를 맨 앞에 추가
          const newEntry: LessonHistoryEntry = {
            ...entry,
            viewedAt: Date.now(),
          };

          // 최대 개수 제한
          const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_ENTRIES);

          return { entries: updated };
        }),

      removeEntry: (lessonId) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.lessonId !== lessonId),
        })),

      clearHistory: () => set({ entries: [] }),

      getEntriesByLanguage: (language) => {
        return get().entries.filter((e) => e.language === language);
      },
    }),
    {
      name: 'codeinsight-lesson-history', // localStorage key
      version: 1, // 스키마 버전 (마이그레이션용)
    }
  )
);

/**
 * 선택자 함수들 (성능 최적화용)
 */
export const selectRecentEntries = (limit = 3) => (state: LessonHistoryStore) =>
  state.entries.slice(0, limit);

export const selectEntriesByLanguage =
  (language: string) => (state: LessonHistoryStore) =>
    state.entries.filter((e) => e.language === language);
