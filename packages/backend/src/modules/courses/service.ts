/**
 * Courses Service
 * Prisma 쿼리를 통한 코스 데이터 CRUD
 *
 * WHY: 비즈니스 로직과 라우터 분리
 * TRADEOFF: 파일 분리 > 단일 파일 (테스트 용이성)
 */

import { prisma } from '../../config/database';
import { randomUUID } from 'crypto';
import * as streakService from '../gamification/streak.service';

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
 * WHY: DRY 원칙 - 진행률 계산은 백엔드에서만
 * - userId 제공 시: 챕터별 진행률 계산하여 포함
 * - userId 미제공 시: 코스 구조만 반환
 *
 * OPTIMIZATION (2025-01-25): Payload ~50KB → ~3KB
 * - lesson.id만 조회 (description, difficulty 등 제외)
 * - 진행률은 별도 쿼리로 completed만 집계
 */
// ... (previous code)
export async function getLanguageWithChapters(languageId: string, userId?: string, isAdmin: boolean = false) {
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
            select: { id: true } // Key Optimization: Only fetch ID for counting
          },
        },
      },
    },
  });

  if (!language) return null;

  // 2. userId 미제공 시: 코스 구조만 반환
  if (!userId) {
    return {
      ...language,
      chapters: language.chapters.map((chapter: any) => ({
        ...chapter,
        lessons: undefined, // Remove lessons from payload
        progress: {
          total: chapter.lessons.length,
          completed: 0,
          percentage: 0,
        },
      })),
    };
  }

  // 3. Progress (Batch Query)
  // 해당 언어의 모든 완료된 레슨 ID를 한번에 가져옴
  const completedLessonIds = new Set(
    (await prisma.userProgress.findMany({
      where: {
        userId,
        status: 'completed',
        lesson: { chapter: { languageId } },
      },
      select: { lessonId: true },
    })).map((p: any) => p.lessonId)
  );

  // 4. Transform & Combine
  return {
    ...language,
    chapters: language.chapters.map((chapter: any) => {
      const total = chapter.lessons.length;
      // Admin은 모든 레슨을 완료한 것으로 간주 (무조건 접근 가능)
      const completed = isAdmin ? total : chapter.lessons.filter((l: any) =>
        completedLessonIds.has(l.id)
      ).length;

      return {
        ...chapter,
        lessons: undefined, // Remove lessons from payload to save bandwidth
        progress: {
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      };
    }),
  };
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
export async function getChapterProgress(userId: string, chapterId: string, isAdmin: boolean = false) {
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

  // Admin은 모든 레슨을 완료한 것으로 처리
  const completedCount = isAdmin ? chapter.lessons.length : chapter.lessons.filter(
    (l: any) => l.progress[0]?.status === 'completed'
  ).length;

  return {
    ...chapter,
    completedCount,
    totalCount: chapter.lessons.length,
    lessons: chapter.lessons.map((l: any) => ({
      ...l,
      // Admin은 모든 레슨에 대해 가짜 완료 상태 반환 (접근 허용)
      progress: isAdmin ? (l.progress[0] || { status: 'completed' }) : (l.progress[0] || null),
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

  const progress = await prisma.userProgress.upsert({
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

  // 레슨 완료 시 스트릭 업데이트
  if (data.status === 'completed') {
    try {
      await streakService.updateStreak(userId);
    } catch (error) {
      // 스트릭 업데이트 실패해도 진행 상태는 저장됨 (비크리티컬)
      console.error('Failed to update streak:', error);
    }
  }

  return progress;
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
