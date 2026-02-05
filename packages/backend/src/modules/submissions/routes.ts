/**
 * Submission Routes (Fastify)
 */

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export const submissionRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /
   * 제출 기록 생성
   */
  fastify.post('/', {
    preHandler: [fastify.requireDbUser],
    schema: {
      tags: ['Submissions'],
      summary: '제출 기록 생성',
      body: {
        type: 'object',
        required: ['problemId', 'code'],
        properties: {
          problemId: { type: 'string' },
          code: { type: 'string' },
          verdict: { type: 'string', enum: ['accepted', 'wrong_answer', 'compile_error', 'runtime_error'] },
          executionTime: { type: 'integer' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { problemId, code, verdict, executionTime } = request.body as {
        problemId: string;
        code: string;
        verdict?: string;
        executionTime?: number;
      };
      const userId = request.user!.dbUser!.id;

      if (!problemId || !code) {
        return reply.status(400).send({ error: 'Missing required fields' });
      }

      const submission = await prisma.submission.create({
        data: {
          userId,
          problemId,
          code,
          verdict: verdict || 'judging',
          executionTime,
        },
      });

      return reply.status(201).send(submission);
    } catch (error) {
      logger.error('Submission error:', error);
      return reply.status(500).send({ error: 'Failed to create submission' });
    }
  });

  /**
   * GET /me
   * 내 제출 기록 조회
   */
  fastify.get('/me', {
    preHandler: [fastify.requireDbUser],
    schema: {
      tags: ['Submissions'],
      summary: '내 제출 기록 조회',
    },
  }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const submissions = await prisma.submission.findMany({
        where: { userId },
        include: {
          problem: {
            select: { number: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return submissions;
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to fetch submissions' });
    }
  });

  /**
   * GET /me/solved
   * 내가 푼 문제 ID 목록
   */
  fastify.get('/me/solved', {
    preHandler: [fastify.requireDbUser],
    schema: {
      tags: ['Submissions'],
      summary: '내가 푼 문제 ID 목록',
    },
  }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const solvedSubmissions = await prisma.submission.findMany({
        where: {
          userId,
          verdict: 'accepted',
        },
        select: { problemId: true },
        distinct: ['problemId'],
      });

      const allSubmissions = await prisma.submission.findMany({
        where: { userId },
        select: { problemId: true },
        distinct: ['problemId'],
      });

      const solvedIds = solvedSubmissions.map((s: { problemId: string }) => s.problemId);
      const attemptedIds = allSubmissions
        .map((s: { problemId: string }) => s.problemId)
        .filter((id: string) => !solvedIds.includes(id));

      return {
        solved: solvedIds,
        attempted: attemptedIds,
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to fetch solved problems' });
    }
  });
};
