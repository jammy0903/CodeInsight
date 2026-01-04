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

const router = Router();

// =============================================
// 스키마 정의
// =============================================

const progressUpdateSchema = z.object({
  lessonId: z.string().uuid(),
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
    console.error('Get languages error:', error);
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
    console.error('Get chapters error:', error);
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
    console.error('Get chapter error:', error);
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
    console.error('Get chapter progress error:', error);
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
 */
router.get('/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await courseService.getLessonFull(id);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Quiz options JSON 파싱
    const quizzes = lesson.quizzes.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null,
    }));

    res.json({
      ...lesson,
      quizzes,
    });
  } catch (error) {
    console.error('Get lesson error:', error);
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
    console.error('Get progress error:', error);
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
    console.error('Update progress error:', error);
    res.status(500).json({
      error: 'Failed to update progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const courseRoutes = router;
