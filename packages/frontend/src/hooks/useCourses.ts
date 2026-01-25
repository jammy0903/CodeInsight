/**
 * Courses 관련 React Query 훅
 *
 * WHY: API 상태 관리 단순화
 * - loading, error, data 수동 관리 제거
 * - isLoading, isError, isSuccess 자동 제공
 * - 인증 상태 기반 자동 쿼리 활성화
 */

import { useQuery } from '@tanstack/react-query';
import { getLanguageWithChapters, getChapterWithLessons, getUserProgress, getLessonFull } from '@/services/courses';
import { useStore } from '@/stores/store';
import type { ChapterWithLessons, Language, UserProgress, LessonFull } from '@/types';

/**
 * 언어 코스 데이터 조회 (챕터 + 진행률 포함)
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
  const { appUser } = useStore();

  return useQuery<Language & { chapters: ChapterWithLessons[] }>({
    // queryKey: 캐시 키 (languageId, userId 변경 시 자동 refetch)
    queryKey: ['language', languageId, appUser?.id],

    // queryFn: 실제 API 호출
    queryFn: () => getLanguageWithChapters(languageId!),

    // enabled: languageId가 있을 때만 쿼리 실행
    enabled: !!languageId,

    // staleTime: 5분간 캐시 유지 (config/queryClient.ts 기본값 사용)
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
  return useQuery<ChapterWithLessons>({
    queryKey: ['chapter', chapterId],
    queryFn: () => getChapterWithLessons(chapterId!),
    enabled: !!chapterId,
  });
}

/**
 * 사용자 진행 상태 조회
 *
 * @returns TanStack Query 결과 { data, isLoading }
 *
 * @example
 * const { data: progressList } = useUserProgress();
 */
export function useUserProgress() {
  const { appUser } = useStore();

  return useQuery<UserProgress[]>({
    queryKey: ['progress', appUser?.id],
    queryFn: () => getUserProgress(),
    // 로그인 상태일 때만 쿼리 실행
    enabled: !!appUser,
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
  return useQuery<LessonFull>({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLessonFull(lessonId!),
    enabled: !!lessonId,
  });
}
