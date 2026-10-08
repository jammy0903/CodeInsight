/**
 * Courses Routes (Fastify Plugin)
 * Language → Chapter → Lesson 계층 구조 API
 *
 * GET  /api/courses/languages          - 언어 목록
 * GET  /api/courses/:lang/chapters     - 챕터 목록
 * GET  /api/courses/chapters/:id       - 챕터 상세 (레슨 포함)
 * GET  /api/courses/lessons/:id        - 레슨 상세 (콘텐츠 + 퀴즈)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import * as courseService from './service';
import { lessonContentLoader } from '../../services/lessonContentLoader';
import { logger } from '../../utils/logger';

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
      const { locale } = request.query as { locale?: string };
      const lesson = await courseService.getLessonFull(id, locale);

      if (!lesson) {
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      // JSON 파일에서 콘텐츠 로드 (없으면 null)
      // Lazy Loading: await 필수
      // locale이 있으면 해당 언어 파일을 먼저 시도 (e.g., c-1-1.en.json)
      const jsonContent = await lessonContentLoader.getContent(id, locale);

      // 하이브리드 응답: DB 메타데이터 + JSON 콘텐츠
      // JSON 구조가 Flat한 경우(code, steps가 최상위)와 Nested된 경우(content 내부) 모두 지원
      let mergedContent = lesson.content;
      let mergedQuizzes = lesson.quizzes;

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

        // locale JSON에 quiz가 있으면 DB quiz 대신 우선 사용
        const localizedQuiz = (jsonContent as any).quiz;
        if (
          localizedQuiz &&
          typeof localizedQuiz.question === 'string' &&
          Array.isArray(localizedQuiz.options) &&
          typeof localizedQuiz.correctIndex === 'number'
        ) {
          const baseQuiz = lesson.quizzes?.[0];
          mergedQuizzes = [{
            id: baseQuiz?.id ?? `localized-${id}-quiz-1`,
            lessonId: baseQuiz?.lessonId ?? id,
            type: baseQuiz?.type ?? 'multiple_choice',
            order: baseQuiz?.order ?? 1,
            createdAt: baseQuiz?.createdAt ?? new Date(),
            question: localizedQuiz.question,
            options: localizedQuiz.options,
            answer: String(localizedQuiz.correctIndex),
            explanation: typeof localizedQuiz.explanation === 'string'
              ? localizedQuiz.explanation
              : (baseQuiz?.explanation ?? ''),
          }];
        }
      }

      return {
        ...lesson,
        content: mergedContent,
        quizzes: mergedQuizzes,
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
      const { locale } = request.query as { locale?: string };
      const chapter = await courseService.getChapterWithLessons(id, locale);

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

  // =============================================
  // Generic Language/Chapter Endpoints (MUST BE LAST)
  // =============================================

  /**
   * 언어 상세 (챕터 포함)
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { locale } = request.query as { locale?: string };
      // 'chapter'나 'lesson' 등의 키워드가 id로 오면 404 (안전장치)
      if (id === 'chapters' || id === 'lessons' || id === 'languages') {
        return reply.status(404).send({ error: 'Not found' });
      }

      if (typeof id !== 'string') {
        return reply.status(400).send({ error: 'Invalid ID' });
      }

      const language = await courseService.getLanguageWithChapters(id, locale);

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
      const { locale } = request.query as { locale?: string };
      const chapters = await courseService.getChapters(lang, locale);
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
