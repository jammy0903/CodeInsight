/**
 * Courses Service
 * Prisma 쿼리를 통한 코스 데이터 CRUD
 *
 * WHY: 비즈니스 로직과 라우터 분리
 * TRADEOFF: 파일 분리 > 단일 파일 (테스트 용이성)
 */

import { prisma } from '../../config/database';
import { getCourseLocalizationCatalog } from './localization';

// =============================================
// Language
// =============================================

/**
 * 활성화된 언어 목록 조회
 */
export async function getLanguages() {
  return prisma.language.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
}

/**
 * 언어 상세 (챕터 포함)
 *
 * 진도는 클라이언트(localStorage)에서 관리하므로 코스 구조만 반환한다.
 * - lesson은 목록 표시에 필요한 필드만 조회 (Payload 최소화)
 */
export async function getLanguageWithChapters(languageId: string, locale?: string) {
  // 1. Structure (Lightweight - Lessons ID only)
  const language = await prisma.language.findUnique({
    where: { id: languageId },
    include: {
      chapters: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              description: true,
              difficulty: true,
              order: true,
            }
          },
        },
      },
    },
  });

  if (!language) return null;

  const localization = await getCourseLocalizationCatalog(languageId, locale);
  const localizeChapter = (chapter: any) => ({
    ...chapter,
    title: localization?.chapterTextById[chapter.id]?.title || chapter.title,
    description: localization?.chapterTextById[chapter.id]?.description || chapter.description,
    lessons: chapter.lessons.map((lesson: any) => ({
      ...lesson,
      title: localization?.lessonTextById[lesson.id]?.title || lesson.title,
      description: localization?.lessonTextById[lesson.id]?.description || lesson.description,
    })),
  });

  return {
    ...language,
    chapters: language.chapters.map((chapter: any) => {
      const localizedChapter = localizeChapter(chapter);
      return {
        ...localizedChapter,
        lessons: localizedChapter.lessons.map((lesson: any) => ({
          ...lesson,
          progress: null,
        })),
        progress: {
          total: chapter.lessons.length,
          completed: 0,
          percentage: 0,
        },
      };
    }),
  };
}

/**
 * 언어별 챕터 목록
 */
export async function getChapters(languageId: string, locale?: string) {
  const chapters = await prisma.chapter.findMany({
    where: {
      languageId,
      isActive: true,
    },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true, // 필요한 경우
          difficulty: true,
          order: true,
          // content, quizzes 등 무거운 필드는 제외
        }
      }
    }
  });

  const localization = await getCourseLocalizationCatalog(languageId, locale);
  if (!localization) return chapters;

  return chapters.map((chapter: any) => ({
    ...chapter,
    title: localization.chapterTextById[chapter.id]?.title || chapter.title,
    description: localization.chapterTextById[chapter.id]?.description || chapter.description,
    lessons: chapter.lessons.map((lesson: any) => ({
      ...lesson,
      title: localization.lessonTextById[lesson.id]?.title || lesson.title,
      description: localization.lessonTextById[lesson.id]?.description || lesson.description,
    })),
  }));
}

/**
 * 챕터 상세 (레슨 포함)
 */
export async function getChapterWithLessons(chapterId: string, locale?: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!chapter) return null;

  const localization = await getCourseLocalizationCatalog(chapter.languageId, locale);
  if (!localization) return chapter;

  return {
    ...chapter,
    title: localization.chapterTextById[chapter.id]?.title || chapter.title,
    description: localization.chapterTextById[chapter.id]?.description || chapter.description,
    lessons: chapter.lessons.map((lesson: any) => ({
      ...lesson,
      title: localization.lessonTextById[lesson.id]?.title || lesson.title,
      description: localization.lessonTextById[lesson.id]?.description || lesson.description,
    })),
  };
}

// =============================================
// Lesson
// =============================================

/**
 * 레슨 상세 (콘텐츠 + 퀴즈 포함)
 */
export async function getLessonFull(lessonId: string, locale?: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, isActive: true },
    include: {
      content: true,
      quizzes: {
        orderBy: { order: 'asc' },
      },
      chapter: {
        select: {
          languageId: true,
        },
      },
    },
  });

  if (!lesson) return null;

  const localization = await getCourseLocalizationCatalog(lesson.chapter.languageId, locale);
  const localizedTitle = localization?.lessonTextById[lesson.id]?.title || lesson.title;
  const localizedDescription = localization?.lessonTextById[lesson.id]?.description || lesson.description;

  const { chapter, ...lessonData } = lesson;
  const localizedLesson = {
    ...lessonData,
    title: localizedTitle,
    description: localizedDescription,
  };

  // steps JSON 파싱
  if (localizedLesson.content?.steps && typeof localizedLesson.content.steps === 'string') {
    try {
      const parsedSteps = JSON.parse(localizedLesson.content.steps);
      return {
        ...localizedLesson,
        content: {
          ...localizedLesson.content,
          steps: parsedSteps,
        },
      };
    } catch {
      // JSON 파싱 실패 시 원본 반환
      return localizedLesson;
    }
  }

  return localizedLesson;
}

