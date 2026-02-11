/**
 * Courses Routes (Fastify Plugin)
 * Language → Chapter → Lesson 계층 구조 API
 *
 * GET  /api/courses/languages          - 언어 목록
 * GET  /api/courses/:lang/chapters     - 챕터 목록
 * GET  /api/courses/chapters/:id       - 챕터 상세 (레슨 포함)
 * GET  /api/courses/chapters/:id/progress - 챕터 진행 상태
 * GET  /api/courses/lessons/:id        - 레슨 상세 (콘텐츠 + 퀴즈)
 * GET  /api/courses/progress           - 사용자 전체 진행 상태
 * POST /api/courses/progress           - 진행 상태 업데이트
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import * as courseService from './service';
import { lessonContentLoader } from '../../services/lessonContentLoader';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

// =============================================
// 스키마 정의
// =============================================

const progressUpdateSchema = z.object({
  lessonId: z.string().min(1),  // short ID (c-1-1) 또는 UUID 모두 허용
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  currentStep: z.number().min(0).optional(),
  quizScore: z.number().min(0).optional(),
  quizTotal: z.number().min(0).optional(),
});

// =============================================
// Fastify Plugin
// =============================================

const courseRoutes: FastifyPluginAsync = async (fastify) => {
  // =============================================
  // Lesson Endpoints
  // =============================================

  /**
   * 레슨 상세 (콘텐츠 + 퀴즈 포함)
   *
   * WHY: DB(메타데이터) + JSON(콘텐츠) 하이브리드
   * - DB: title, description, difficulty 등 구조
   * - JSON: code, steps, quizzes 등 콘텐츠 (10-200배 빠름)
   */
  fastify.get('/lessons/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const lesson = await courseService.getLessonFull(id);

      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      // JSON 파일에서 콘텐츠 로드 (없으면 null)
      // Lazy Loading: await 필수
      const jsonContent = await lessonContentLoader.getContent(id);

      // 하이브리드 응답: DB 메타데이터 + JSON 콘텐츠
      // JSON 구조가 Flat한 경우(code, steps가 최상위)와 Nested된 경우(content 내부) 모두 지원
      let mergedContent = lesson.content;

      if (jsonContent) {
        // 1. Nested Structure check
        if ('content' in jsonContent && (jsonContent as any).content) {
          mergedContent = {
            ...lesson.content,
            code: (jsonContent as any).content.code,
            steps: (jsonContent as any).content.steps,
          } as any;
        }
        // 2. Flat Structure check (User's current format)
        else if ('code' in jsonContent || 'steps' in jsonContent) {
          mergedContent = {
            ...lesson.content,
            code: (jsonContent as any).code,
            steps: (jsonContent as any).steps,
          } as any;
        }
      }

      return {
        ...lesson,
        content: mergedContent,
        quizzes: lesson.quizzes, // 항상 DB 데이터 사용
      };
    } catch (error) {
      logger.error('Get lesson error:', error);
      return reply.status(500).send({
        error: 'Failed to get lesson',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // =============================================
  // Language Endpoints
  // =============================================

  /**
   * 언어 목록
   */
  fastify.get('/languages', async (request, reply) => {
    try {
      const languages = await courseService.getLanguages();
      return languages;
    } catch (error) {
      logger.error('Get languages error:', error);
      return reply.status(500).send({
        error: 'Failed to get languages',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // =============================================
  // Chapter Endpoints
  // =============================================

  /**
   * 챕터 상세 (레슨 목록 포함)
   */
  fastify.get('/chapters/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const chapter = await courseService.getChapterWithLessons(id);

      if (!chapter) {
        return reply.status(404).send({ error: 'Chapter not found' });
      }

      return chapter;
    } catch (error) {
      logger.error('Get chapter error:', error);
      return reply.status(500).send({
        error: 'Failed to get chapter',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 챕터 진행 상태 (인증 필요)
   */
  fastify.get(
    '/chapters/:id/progress',
    { preHandler: [fastify.requireDbUser] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = request.user!.dbUser!.id;
        const isAdmin = request.user?.uid === env.ADMIN_FIREBASE_UID;

        const chapterId = Array.isArray(id) ? id[0] : id;
        if (!chapterId) {
          return reply.status(400).send({ message: 'Chapter ID is required.' });
        }
        const progress = await courseService.getChapterProgress(userId, chapterId, !!isAdmin);

        if (!progress) {
          return reply.status(404).send({ error: 'Chapter not found' });
        }

        return progress;
      } catch (error) {
        logger.error('Get chapter progress error:', error);
        return reply.status(500).send({
          error: 'Failed to get chapter progress',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // =============================================
  // Progress Endpoints
  // =============================================

  /**
   * 사용자 전체 진행 상태
   */
  fastify.get(
    '/progress',
    { preHandler: [fastify.requireDbUser] },
    async (request, reply) => {
      try {
        const userId = request.user!.dbUser!.id;

        const progress = await courseService.getUserProgress(userId);
        return progress;
      } catch (error) {
        logger.error('Get progress error:', error);
        return reply.status(500).send({
          error: 'Failed to get progress',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * 진행 상태 업데이트
   */
  fastify.post(
    '/progress',
    { preHandler: [fastify.requireDbUser] },
    async (request, reply) => {
      try {
        const userId = request.user!.dbUser!.id;

        const parsed = progressUpdateSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: 'Invalid request',
            details: parsed.error.issues,
          });
        }

        const { lessonId, ...data } = parsed.data;
        const progress = await courseService.updateProgress(userId, lessonId, data);

        return progress;
      } catch (error) {
        logger.error('Update progress error:', error);
        return reply.status(500).send({
          error: 'Failed to update progress',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // =============================================
  // Generic Language/Chapter Endpoints (MUST BE LAST)
  // =============================================

  /**
   * 언어 상세 (챕터 + 진행률 포함)
   *
   * WHY: optionalAuth로 인증 선택적 처리
   * - 로그인 시: 챕터별 진행률 포함
   * - 비로그인 시: 코스 구조만 반환
   */
  fastify.get('/:id', { preHandler: [fastify.optionalDbUser] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      // 'chapter'나 'lesson' 등의 키워드가 id로 오면 404 (안전장치)
      if (id === 'chapters' || id === 'lessons' || id === 'progress' || id === 'languages') {
        return reply.status(404).send({ error: 'Not found' });
      }

      if (typeof id !== 'string') {
        return reply.status(400).send({ error: 'Invalid ID' });
      }

      const userId = request.user?.dbUser?.id;
      const isAdmin = request.user?.uid === env.ADMIN_FIREBASE_UID;
      const language = await courseService.getLanguageWithChapters(id, userId, !!isAdmin);

      if (!language) {
        return reply.status(404).send({ error: 'Language not found' });
      }

      return language;
    } catch (error) {
      logger.error('Get language error:', error);
      return reply.status(500).send({
        error: 'Failed to get language',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 언어별 챕터 목록
   */
  fastify.get('/:lang/chapters', async (request, reply) => {
    try {
      const { lang } = request.params as { lang: string };
      const chapters = await courseService.getChapters(lang);
      return chapters;
    } catch (error) {
      logger.error('Get chapters error:', error);
      return reply.status(500).send({
        error: 'Failed to get chapters',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export { courseRoutes };
