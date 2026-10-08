/**
 * Courses 관련 React Query 훅
 *
 * WHY: API 상태 관리 단순화
 * - loading, error, data 수동 관리 제거
 * - isLoading, isError, isSuccess 자동 제공
 */

import { useQuery } from '@tanstack/react-query';
import i18n from 'i18next';
import { getLanguageWithChapters, getChapterWithLessons, getLessonFull } from '@/services/courses';
import type { ChapterWithLessons, Language, LessonFull } from '@/types';

/**
 * 언어 코스 데이터 조회 (챕터 포함)
 *
 * @param languageId - 조회할 언어 ID (c, python, java 등)
 * @returns TanStack Query 결과 { data, isLoading, isError, error, isSuccess }
 *
 * @example
 * const { data, isLoading, isError } = useLanguageCourse('c');
 * if (isLoading) return <Spinner />;
 * if (isError) return <Error />;
 * return <ChapterList chapters={data.chapters} />;
 */
export function useLanguageCourse(languageId: string | undefined) {
  const locale = i18n.language;

  return useQuery<Language & { chapters: ChapterWithLessons[] }>({
    queryKey: ['language', languageId, locale],
    queryFn: () => getLanguageWithChapters(languageId!),
    enabled: !!languageId,
  });
}

/**
 * 챕터 상세 데이터 조회 (레슨 목록 포함)
 *
 * @param chapterId - 조회할 챕터 ID
 * @returns TanStack Query 결과 { data, isLoading, isError, error }
 *
 * @example
 * const { data: chapter, isLoading, isError } = useChapter('c-1');
 */
export function useChapter(chapterId: string | undefined) {
  const locale = i18n.language;
  return useQuery<ChapterWithLessons>({
    queryKey: ['chapter', chapterId, locale],
    queryFn: () => getChapterWithLessons(chapterId!),
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000, // 5분: 챕터 구조는 세션 중 변경 안 됨
  });
}

/**
 * 레슨 상세 데이터 조회 (콘텐츠 + 퀴즈 포함)
 *
 * @param lessonId - 조회할 레슨 ID
 * @returns TanStack Query 결과 { data, isLoading, isError, error }
 *
 * @example
 * const { data: lesson, isLoading, isError } = useLesson('c-1-1');
 */
export function useLesson(lessonId: string | undefined) {
  const locale = i18n.language;
  return useQuery<LessonFull>({
    queryKey: ['lesson', lessonId, locale],
    queryFn: () => getLessonFull(lessonId!),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000, // 5분: 레슨 콘텐츠는 세션 중 변경 안 됨
  });
}
