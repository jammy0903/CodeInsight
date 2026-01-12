/**
 * Lesson History Store Test
 * localStorage persist 기반 레슨 히스토리 테스트
 *
 * 실행: npx vitest run src/__tests__/lesson-history-store.test.ts
 *
 * 용도: "최근 학습", "이어서 학습" 기능에 활용
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useLessonHistoryStore } from '../stores/lessonHistoryStore';

// 헬퍼: 최신 상태 조회
const getState = () => useLessonHistoryStore.getState();

describe('Lesson History Store', () => {
  // 각 테스트 전 스토어 초기화
  beforeEach(() => {
    getState().clearHistory();
  });

  describe('LessonHistoryStore', () => {
    it('should add lesson entry', () => {
      getState().addEntry({
        lessonId: 'lesson-1',
        chapterId: 'chapter-1',
        title: 'Pointer Basics',
        code: 'int *p = &x;',
        language: 'c',
      });

      // 상태 변경 후 다시 조회
      const { entries } = getState();
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Pointer Basics');
      expect(entries[0].viewedAt).toBeGreaterThan(0);
    });

    it('should update existing entry (not duplicate)', () => {
      // 같은 레슨 두 번 추가
      getState().addEntry({
        lessonId: 'lesson-1',
        chapterId: 'chapter-1',
        title: 'Pointer Basics',
        code: 'int *p = &x;',
        language: 'c',
      });

      getState().addEntry({
        lessonId: 'lesson-1',
        chapterId: 'chapter-1',
        title: 'Pointer Basics Updated',
        code: 'int *p = &y;',
        language: 'c',
      });

      // 중복 없이 1개만 유지
      const { entries } = getState();
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Pointer Basics Updated');
    });

    it('should limit to 5 entries (FIFO)', () => {
      // 6개 추가
      for (let i = 1; i <= 6; i++) {
        getState().addEntry({
          lessonId: `lesson-${i}`,
          chapterId: 'chapter-1',
          title: `Lesson ${i}`,
          code: `code ${i}`,
          language: 'c',
        });
      }

      // 최대 5개만 유지
      const { entries } = getState();
      expect(entries).toHaveLength(5);
      // 가장 최신이 맨 앞
      expect(entries[0].lessonId).toBe('lesson-6');
      // 가장 오래된 것(lesson-1)은 삭제됨
      expect(entries.find((e) => e.lessonId === 'lesson-1')).toBeUndefined();
    });

    it('should filter by language', () => {
      getState().addEntry({
        lessonId: 'c-1',
        chapterId: 'chapter-1',
        title: 'C Lesson',
        code: 'int x;',
        language: 'c',
      });

      getState().addEntry({
        lessonId: 'py-1',
        chapterId: 'chapter-2',
        title: 'Python Lesson',
        code: 'x = 10',
        language: 'python',
      });

      const cLessons = getState().getEntriesByLanguage('c');
      expect(cLessons).toHaveLength(1);
      expect(cLessons[0].language).toBe('c');
    });

    it('should remove specific entry', () => {
      getState().addEntry({
        lessonId: 'lesson-1',
        chapterId: 'chapter-1',
        title: 'Lesson 1',
        code: 'code 1',
        language: 'c',
      });

      getState().addEntry({
        lessonId: 'lesson-2',
        chapterId: 'chapter-1',
        title: 'Lesson 2',
        code: 'code 2',
        language: 'c',
      });

      getState().removeEntry('lesson-1');

      const { entries } = getState();
      expect(entries).toHaveLength(1);
      expect(entries[0].lessonId).toBe('lesson-2');
    });

    it('should clear all history', () => {
      getState().addEntry({
        lessonId: 'lesson-1',
        chapterId: 'chapter-1',
        title: 'Lesson 1',
        code: 'code 1',
        language: 'c',
      });

      getState().clearHistory();

      const { entries } = getState();
      expect(entries).toHaveLength(0);
    });
  });
});
