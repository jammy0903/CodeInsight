/**
 * Notes Routes
 * 사용자 개념 노트 CRUD API
 *
 * GET    /api/notes              - 노트 목록 조회
 * POST   /api/notes              - 노트 생성
 * PATCH  /api/notes/:id          - 노트 수정
 * DELETE /api/notes/:id          - 노트 삭제
 * GET    /api/notes/concepts     - 개념별 통계
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { requireDbUser } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = Router();

// =============================================
// 스키마 정의
// =============================================

const createNoteSchema = z.object({
  lessonId: z.string().min(1),
  quizId: z.string().optional(),
  concept: z.string().min(1).max(100),
  content: z.string().min(1),
  source: z.enum(['quiz', 'lesson', 'manual']),
  isFromWrong: z.boolean().optional().default(false),
});

const updateNoteSchema = z.object({
  concept: z.string().min(1).max(100).optional(),
  content: z.string().min(1).optional(),
});

const listNotesQuerySchema = z.object({
  lessonId: z.string().optional(),
  concept: z.string().optional(),
  isFromWrong: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

// =============================================
// CRUD Endpoints
// =============================================

/**
 * 노트 목록 조회
 * GET /api/notes
 *
 * Query params:
 * - lessonId: 특정 레슨의 노트만
 * - concept: 특정 개념의 노트만
 * - isFromWrong: 'true' | 'false' - 오답 노트만
 * - limit: 페이지 크기 (기본 50, 최대 100)
 * - offset: 오프셋
 */
router.get('/', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const parsed = listNotesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: parsed.error.issues,
      });
    }

    const { lessonId, concept, isFromWrong, limit, offset } = parsed.data;

    // 필터 조건 구성
    const where: Record<string, unknown> = { userId };
    if (lessonId) where.lessonId = lessonId;
    if (concept) where.concept = { contains: concept };
    if (isFromWrong !== undefined) where.isFromWrong = isFromWrong === 'true';

    const [notes, total] = await Promise.all([
      prisma.userNote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          lesson: {
            select: { title: true },
          },
          quiz: {
            select: { question: true },
          },
        },
      }),
      prisma.userNote.count({ where }),
    ]);

    res.json({
      notes: notes.map((n) => ({
        id: n.id,
        lessonId: n.lessonId,
        lessonTitle: n.lesson.title,
        quizId: n.quizId,
        quizQuestion: n.quiz?.question,
        concept: n.concept,
        content: n.content,
        source: n.source,
        isFromWrong: n.isFromWrong,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('List notes error:', error);
    res.status(500).json({
      error: 'Failed to list notes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 노트 생성
 * POST /api/notes
 */
router.post('/', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const parsed = createNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { lessonId, quizId, concept, content, source, isFromWrong } = parsed.data;

    // 레슨 존재 확인
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // 퀴즈 존재 확인 (있는 경우)
    if (quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
      });
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
    }

    const note = await prisma.userNote.create({
      data: {
        userId,
        lessonId,
        quizId,
        concept,
        content,
        source,
        isFromWrong,
      },
    });

    res.status(201).json({
      id: note.id,
      concept: note.concept,
      content: note.content,
      source: note.source,
      isFromWrong: note.isFromWrong,
      createdAt: note.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error('Create note error:', error);
    res.status(500).json({
      error: 'Failed to create note',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 노트 수정
 * PATCH /api/notes/:id
 */
router.patch('/:id', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;
    const { id } = req.params;

    const parsed = updateNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    // 본인 노트인지 확인
    const existing = await prisma.userNote.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = await prisma.userNote.update({
      where: { id },
      data: parsed.data,
    });

    res.json({
      id: note.id,
      concept: note.concept,
      content: note.content,
      updatedAt: note.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Update note error:', error);
    res.status(500).json({
      error: 'Failed to update note',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 노트 삭제
 * DELETE /api/notes/:id
 */
router.delete('/:id', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;
    const { id } = req.params;

    // 본인 노트인지 확인
    const existing = await prisma.userNote.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await prisma.userNote.delete({
      where: { id },
    });

    res.json({ ok: true });
  } catch (error) {
    logger.error('Delete note error:', error);
    res.status(500).json({
      error: 'Failed to delete note',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =============================================
// Statistics Endpoints
// =============================================

/**
 * 개념별 통계
 * GET /api/notes/concepts
 *
 * WHY: 취약 개념 분석용
 * - 어떤 개념을 가장 많이 노트했는지
 * - 오답에서 온 노트는 어떤 개념인지
 */
router.get('/concepts', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const notes = await prisma.userNote.groupBy({
      by: ['concept'],
      where: { userId },
      _count: { concept: true },
      orderBy: { _count: { concept: 'desc' } },
      take: 20,
    });

    // 오답 기반 노트만 따로
    const wrongNotes = await prisma.userNote.groupBy({
      by: ['concept'],
      where: { userId, isFromWrong: true },
      _count: { concept: true },
      orderBy: { _count: { concept: 'desc' } },
      take: 10,
    });

    res.json({
      topConcepts: notes.map((n) => ({
        concept: n.concept,
        count: n._count.concept,
      })),
      weakConcepts: wrongNotes.map((n) => ({
        concept: n.concept,
        count: n._count.concept,
      })),
    });
  } catch (error) {
    logger.error('Concepts stats error:', error);
    res.status(500).json({
      error: 'Failed to get concepts stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const notesRoutes = router;
