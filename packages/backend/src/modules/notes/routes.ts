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

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

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
// Fastify Plugin
// =============================================

export const notesRoutes: FastifyPluginAsync = async (fastify) => {
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
  fastify.get('/', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const parsed = listNotesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
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

      return {
        notes: notes.map((n: any) => ({
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
      };
    } catch (error) {
      logger.error('List notes error:', error);
      return reply.status(500).send({
        error: 'Failed to list notes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 개념별 통계
   * GET /api/notes/concepts
   *
   * WHY: 취약 개념 분석용
   * - 어떤 개념을 가장 많이 노트했는지
   * - 오답에서 온 노트는 어떤 개념인지
   */
  fastify.get('/concepts', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

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

      return {
        topConcepts: notes.map((n: any) => ({
          concept: n.concept,
          count: n._count.concept,
        })),
        weakConcepts: wrongNotes.map((n: any) => ({
          concept: n.concept,
          count: n._count.concept,
        })),
      };
    } catch (error) {
      logger.error('Concepts stats error:', error);
      return reply.status(500).send({
        error: 'Failed to get concepts stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 노트 생성
   * POST /api/notes
   */
  fastify.post('/', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const parsed = createNoteSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
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
        return reply.status(404).send({ error: 'Lesson not found' });
      }

      // 퀴즈 존재 확인 (있는 경우)
      if (quizId) {
        const quiz = await prisma.quiz.findUnique({
          where: { id: quizId },
        });
        if (!quiz) {
          return reply.status(404).send({ error: 'Quiz not found' });
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

      return reply.status(201).send({
        id: note.id,
        concept: note.concept,
        content: note.content,
        source: note.source,
        isFromWrong: note.isFromWrong,
        createdAt: note.createdAt.toISOString(),
      });
    } catch (error) {
      logger.error('Create note error:', error);
      return reply.status(500).send({
        error: 'Failed to create note',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 노트 수정
   * PATCH /api/notes/:id
   */
  fastify.patch('/:id', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;
      const { id } = request.params as { id: string };
      const noteId = Array.isArray(id) ? id[0] : id;
      if (!noteId) {
        return reply.status(400).send({ message: 'Note ID is required.' });
      }

      const parsed = updateNoteSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      // 본인 노트인지 확인
      const existing = await prisma.userNote.findFirst({
        where: { id: noteId, userId },
      });
      if (!existing) {
        return reply.status(404).send({ error: 'Note not found' });
      }

      const note = await prisma.userNote.update({
        where: { id: noteId },
        data: parsed.data,
      });

      return {
        id: note.id,
        concept: note.concept,
        content: note.content,
        updatedAt: note.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error('Update note error:', error);
      return reply.status(500).send({
        error: 'Failed to update note',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 노트 삭제
   * DELETE /api/notes/:id
   */
  fastify.delete('/:id', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;
      const { id } = request.params as { id: string };
      const noteId = Array.isArray(id) ? id[0] : id;
      if (!noteId) {
        return reply.status(400).send({ message: 'Note ID is required.' });
      }

      // 본인 노트인지 확인
      const existing = await prisma.userNote.findFirst({
        where: { id: noteId, userId },
      });
      if (!existing) {
        return reply.status(404).send({ error: 'Note not found' });
      }

      await prisma.userNote.delete({
        where: { id: noteId },
      });

      return { ok: true };
    } catch (error) {
      logger.error('Delete note error:', error);
      return reply.status(500).send({
        error: 'Failed to delete note',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
