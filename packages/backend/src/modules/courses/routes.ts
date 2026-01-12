/**
 * Courses Routes
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

import { Router } from 'express';
import { z } from 'zod';
import * as courseService from './service';
import { requireDbUser } from '../../middleware/auth';
import { lessonContentLoader } from '../../services/lessonContentLoader';
import { logger } from '../../utils/logger';

const router = Router();

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
// Language Endpoints
// =============================================

/**
 * 언어 목록
 */
router.get('/languages', async (req, res) => {
  try {
    const languages = await courseService.getLanguages();
    res.json(languages);
  } catch (error) {
    logger.error('Get languages error:', error);
    res.status(500).json({
      error: 'Failed to get languages',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =============================================
// Chapter Endpoints
// =============================================

/**
 * 언어별 챕터 목록
 */
router.get('/:lang/chapters', async (req, res) => {
  try {
    const { lang } = req.params;
    const chapters = await courseService.getChapters(lang);
    res.json(chapters);
  } catch (error) {
    logger.error('Get chapters error:', error);
    res.status(500).json({
      error: 'Failed to get chapters',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 챕터 상세 (레슨 목록 포함)
 */
router.get('/chapters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await courseService.getChapterWithLessons(id);

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(chapter);
  } catch (error) {
    logger.error('Get chapter error:', error);
    res.status(500).json({
      error: 'Failed to get chapter',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 챕터 진행 상태 (인증 필요)
 */
router.get('/chapters/:id/progress', requireDbUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.dbUser!.id;

    const progress = await courseService.getChapterProgress(userId, id);

    if (!progress) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(progress);
  } catch (error) {
    logger.error('Get chapter progress error:', error);
    res.status(500).json({
      error: 'Failed to get chapter progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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
router.get('/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await courseService.getLessonFull(id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // JSON 파일에서 콘텐츠 로드 (없으면 null)
    const jsonContent = lessonContentLoader.getContent(id);

    // 하이브리드 응답: DB 메타데이터 + JSON 콘텐츠
    res.json({
      ...lesson,
      // JSON 콘텐츠가 있으면 code/steps만 JSON 사용, 나머지는 DB 유지
      content: jsonContent
        ? {
            ...lesson.content, // DB 메타데이터 유지 (id, lessonId, language, createdAt, updatedAt)
            code: jsonContent.content.code,
            steps: jsonContent.content.steps,
          }
        : lesson.content,
      quizzes: lesson.quizzes, // 항상 DB 데이터 사용
    });
  } catch (error) {
    logger.error('Get lesson error:', error);
    res.status(500).json({
      error: 'Failed to get lesson',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =============================================
// Progress Endpoints
// =============================================

/**
 * 사용자 전체 진행 상태
 */
router.get('/progress', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const progress = await courseService.getUserProgress(userId);
    res.json(progress);
  } catch (error) {
    logger.error('Get progress error:', error);
    res.status(500).json({
      error: 'Failed to get progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 진행 상태 업데이트
 */
router.post('/progress', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const parsed = progressUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { lessonId, ...data } = parsed.data;
    const progress = await courseService.updateProgress(userId, lessonId, data);

    res.json(progress);
  } catch (error) {
    logger.error('Update progress error:', error);
    res.status(500).json({
      error: 'Failed to update progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const courseRoutes = router;
