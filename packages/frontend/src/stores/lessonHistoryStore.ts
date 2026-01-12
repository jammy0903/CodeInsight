/**
 * lessonHistoryStore - STUB
 * TODO: 다른 서버에서 실제 파일 가져온 후 교체
 */

import { create } from 'zustand';
import type { SupportedLanguage } from '@/types';

interface LessonHistoryEntry {
  lessonId: string;
  chapterId: string;
  title: string;
  code: string;
  language: SupportedLanguage;
  timestamp?: number;
}

interface LessonHistoryStore {
  entries: LessonHistoryEntry[];
  addEntry: (entry: LessonHistoryEntry) => void;
  getRecent: (limit?: number) => LessonHistoryEntry[];
  clear: () => void;
}

export const useLessonHistoryStore = create<LessonHistoryStore>((_set, get) => ({
  entries: [],
  addEntry: (_entry) => {
    // STUB: 아무 동작 안함
    console.warn('[LessonHistoryStore STUB] addEntry called');
  },
  getRecent: (limit = 5) => {
    return get().entries.slice(0, limit);
  },
  clear: () => {
    console.warn('[LessonHistoryStore STUB] clear called');
  },
}));
