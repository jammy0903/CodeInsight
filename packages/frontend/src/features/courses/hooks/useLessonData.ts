/**
 * useLessonData - 레슨/챕터 데이터 패칭 + 파생 데이터 훅
 *
 * 역할:
 * 1. TanStack Query로 레슨 + 챕터 데이터 패칭
 * 2. 다음 레슨 ID 계산
 * 3. 페이지 타이틀 설정 (마운트/언마운트 시 자동 관리)
 */

import { useEffect, useMemo } from 'react';
import { useLesson, useChapter } from '@/hooks';
import { useStore } from '@/stores/store';
import type { SupportedLanguage } from '@/types';

interface UseLessonDataOptions {
  lessonId: string | undefined;
  chapterId: string | undefined;
  lang: string | undefined;
}

export function useLessonData({ lessonId, chapterId, lang }: UseLessonDataOptions) {
  const { setPageTitle } = useStore();
  const { data: lesson, isLoading, isError, error } = useLesson(lessonId);
  const { data: chapterData } = useChapter(chapterId);

  // 다음 레슨 ID 계산
  const nextLessonId = useMemo(() => {
    if (!chapterData || !lessonId) return null;
    const currentIdx = chapterData.lessons.findIndex((l) => l.id === lessonId);
    if (currentIdx !== -1 && currentIdx < chapterData.lessons.length - 1) {
      return chapterData.lessons[currentIdx + 1].id;
    }
    return null;
  }, [chapterData, lessonId]);

  // 페이지 타이틀 관리
  useEffect(() => {
    if (lesson) {
      setPageTitle(lesson.title, lesson.description, lang as SupportedLanguage);
    }
    return () => {
      setPageTitle('', '');
    };
  }, [lesson, setPageTitle, lang]);

  return {
    lesson,
    isLoading,
    isError,
    error,
    nextLessonId,
    quiz: lesson?.quizzes?.[0] ?? null,
  };
}
