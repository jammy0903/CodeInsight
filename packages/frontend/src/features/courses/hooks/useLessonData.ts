/**
 * useLessonData - 레슨/챕터 데이터 패칭 + 파생 데이터 훅
 *
 * 역할:
 * 1. TanStack Query로 레슨 + 챕터 데이터 패칭
 * 2. 다음 레슨 ID 계산
 * 3. 페이지 타이틀 설정 (마운트/언마운트 시 자동 관리)
 */

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import i18n from 'i18next';
import { useLesson, useChapter } from '@/hooks';
import { getLessonFull } from '@/services/courses';
import { useStore } from '@/stores/store';
import type { SupportedLanguage } from '@/types';

interface UseLessonDataOptions {
  lessonId: string | undefined;
}

function resolveLanguageId(lessonId: string | undefined, contentLanguage: string | undefined): SupportedLanguage | undefined {
  if (contentLanguage) return contentLanguage as SupportedLanguage;
  if (!lessonId) return undefined;
  if (lessonId.startsWith('py-practical-')) return 'python-practical';
  if (lessonId.startsWith('py-')) return 'python';
  if (lessonId.startsWith('js-')) return 'javascript';
  if (lessonId.startsWith('java-')) return 'java';
  if (lessonId.startsWith('cpp-')) return 'cpp';
  if (lessonId.startsWith('c-')) return 'c';
  return undefined;
}

export function useLessonData({ lessonId }: UseLessonDataOptions) {
  // 선택적 구독: setPageTitle만 구독하여 불필요한 리렌더링 방지
  const setPageTitle = useStore((state) => state.setPageTitle);
  const queryClient = useQueryClient();
  const locale = i18n.resolvedLanguage || i18n.language;
  const { data: lesson, isLoading, isError, error } = useLesson(lessonId);
  const { data: chapterData } = useChapter(lesson?.chapterId);

  // 다음 레슨 ID 계산
  const nextLessonId = useMemo(() => {
    if (!chapterData || !lessonId) return null;
    const currentIdx = chapterData.lessons.findIndex((l) => l.id === lessonId);
    if (currentIdx !== -1 && currentIdx < chapterData.lessons.length - 1) {
      return chapterData.lessons[currentIdx + 1].id;
    }
    return null;
  }, [chapterData, lessonId]);

  // 다음 레슨 프리페치: 현재 레슨 로드 완료 시 다음 레슨을 백그라운드에서 미리 로드
  useEffect(() => {
    if (nextLessonId) {
      queryClient.prefetchQuery({
        queryKey: ['lesson', nextLessonId, locale],
        queryFn: () => getLessonFull(nextLessonId),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [nextLessonId, queryClient, locale]);

  // 페이지 타이틀 관리
  useEffect(() => {
    if (lesson) {
      const languageId = resolveLanguageId(lessonId, lesson.content?.language);
      setPageTitle(lesson.title, lesson.description, languageId);
    }
    return () => {
      setPageTitle('', '');
    };
  }, [lesson, setPageTitle, lessonId]);

  return {
    lesson,
    isLoading,
    isError,
    error,
    nextLessonId,
    quiz: lesson?.quizzes?.[0] ?? null,
  };
}
