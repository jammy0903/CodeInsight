/**
 * Problem Routes (Fastify)
 */

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../config/database';

export const problemRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /
   * 문제 목록 조회
   */
  fastify.get('/', {
    schema: {
      tags: ['Problems'],
      summary: '문제 목록 조회',
      description: '전체 문제 목록을 번호 오름차순으로 반환',
    },
  }, async (_request, reply) => {
    try {
      const problems = await prisma.problem.findMany({
        orderBy: { number: 'asc' }
      });
      return problems;
    } catch {
      return reply.status(500).send({ error: 'Failed to fetch problems' });
    }
  });

  /**
   * GET /:id
   * 문제 상세 조회
   */
  fastify.get<{ Params: { id: string } }>('/:id', {
    schema: {
      tags: ['Problems'],
      summary: '문제 상세 조회',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '문제 ID' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    // Validate UUID format to avoid Prisma throwing on invalid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return reply.status(400).send({ error: 'Invalid problem ID format' });
    }

    try {
      const problem = await prisma.problem.findUnique({
        where: { id }
      });

      if (!problem) {
        return reply.status(404).send({ error: 'Problem not found' });
      }

      return problem;
    } catch {
      return reply.status(500).send({ error: 'Failed to fetch problem' });
    }
  });
};
