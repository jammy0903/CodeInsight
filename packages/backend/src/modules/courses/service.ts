/**
 * Courses Service
 * Prisma 쿼리를 통한 코스 데이터 CRUD
 *
 * WHY: 비즈니스 로직과 라우터 분리
 * TRADEOFF: 파일 분리 > 단일 파일 (테스트 용이성)
 */

import { prisma } from '../../config/database';
import { randomUUID } from 'crypto';

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
 */
export async function getLanguageWithChapters(languageId: string) {
  return prisma.language.findUnique({
    where: { id: languageId },
    include: {
      chapters: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });
}

// =============================================
// Chapter
// =============================================

/**
 * 언어별 챕터 목록
 */
export async function getChapters(languageId: string) {
  return prisma.chapter.findMany({
    where: {
      languageId,
      isActive: true,
    },
    orderBy: { order: 'asc' },
  });
}

/**
 * 챕터 상세 (레슨 포함)
 */
export async function getChapterWithLessons(chapterId: string) {
  return prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });
}

// =============================================
// Lesson
// =============================================

/**
 * 챕터별 레슨 목록
 */
export async function getLessons(chapterId: string) {
  return prisma.lesson.findMany({
    where: {
      chapterId,
      isActive: true,
    },
    orderBy: { order: 'asc' },
  });
}

/**
 * 레슨 상세 (콘텐츠 + 퀴즈 포함)
 */
export async function getLessonFull(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      content: true,
      quizzes: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!lesson) return null;

  // steps JSON 파싱
  if (lesson.content?.steps && typeof lesson.content.steps === 'string') {
    try {
      const parsedSteps = JSON.parse(lesson.content.steps);
      return {
        ...lesson,
        content: {
          ...lesson.content,
          steps: parsedSteps,
        },
      };
    } catch {
      // JSON 파싱 실패 시 원본 반환
      return lesson;
    }
  }

  return lesson;
}

// =============================================
// Progress
// =============================================

/**
 * 사용자 진행 상태 조회
 */
export async function getUserProgress(userId: string, lessonId?: string) {
  if (lessonId) {
    return prisma.userProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });
  }

  return prisma.userProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * 챕터별 진행 상태 (레슨 포함)
 */
export async function getChapterProgress(userId: string, chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          progress: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!chapter) return null;

  const completedCount = chapter.lessons.filter(
    (l) => l.progress[0]?.status === 'completed'
  ).length;

  return {
    ...chapter,
    completedCount,
    totalCount: chapter.lessons.length,
    lessons: chapter.lessons.map((l) => ({
      ...l,
      progress: l.progress[0] || null,
    })),
  };
}

/**
 * 진행 상태 업데이트 (upsert)
 */
export async function updateProgress(
  userId: string,
  lessonId: string,
  data: {
    status?: 'not_started' | 'in_progress' | 'completed';
    currentStep?: number;
    quizScore?: number;
    quizTotal?: number;
  }
) {
  const now = new Date();

  return prisma.userProgress.upsert({
    where: {
      userId_lessonId: { userId, lessonId },
    },
    create: {
      userId,
      lessonId,
      status: data.status || 'in_progress',
      currentStep: data.currentStep || 0,
      quizScore: data.quizScore,
      quizTotal: data.quizTotal,
      startedAt: now,
      completedAt: data.status === 'completed' ? now : null,
    },
    update: {
      status: data.status,
      currentStep: data.currentStep,
      quizScore: data.quizScore,
      quizTotal: data.quizTotal,
      completedAt: data.status === 'completed' ? now : undefined,
    },
  });
}

// =============================================
// Admin (시드 데이터용)
// =============================================

/**
 * 언어 생성
 */
export async function createLanguage(data: {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
}) {
  return prisma.language.create({ data });
}

/**
 * 챕터 생성
 */
export async function createChapter(data: {
  id?: string;
  languageId: string;
  title: string;
  description?: string;
  keyQuestion?: string;
  order: number;
}) {
  return prisma.chapter.create({
    data: {
      id: data.id || randomUUID(),
      languageId: data.languageId,
      title: data.title,
      description: data.description,
      keyQuestion: data.keyQuestion,
      order: data.order,
    },
  });
}

/**
 * 레슨 생성 (콘텐츠 + 퀴즈 포함)
 */
export async function createLessonWithContent(data: {
  id?: string;
  chapterId: string;
  title: string;
  description?: string;
  difficulty?: string;
  order: number;
  estimatedTime?: number;
  content: {
    id?: string;
    code: string;
    language: string;
    steps: unknown[]; // JSON으로 저장됨
  };
  quizzes?: {
    id?: string;
    type: string;
    question: string;
    options?: string[];
    answer: string;
    explanation?: string;
    order: number;
  }[];
}) {
  const lessonId = data.id || randomUUID();
  return prisma.lesson.create({
    data: {
      id: lessonId,
      chapterId: data.chapterId,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty || 'basic',
      order: data.order,
      estimatedTime: data.estimatedTime,
      content: {
        create: {
          id: data.content.id || randomUUID(),
          code: data.content.code,
          language: data.content.language,
          steps: JSON.stringify(data.content.steps),
        },
      },
      quizzes: data.quizzes
        ? {
            create: data.quizzes.map((q) => ({
              id: q.id || randomUUID(),
              type: q.type,
              question: q.question,
              options: q.options ? JSON.stringify(q.options) : undefined,
              answer: q.answer,
              explanation: q.explanation,
              order: q.order,
            })),
          }
        : undefined,
    },
    include: {
      content: true,
      quizzes: true,
    },
  });
}
