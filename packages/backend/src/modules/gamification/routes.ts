/**
 * Gamification Routes
 * 스트릭 등 게이미피케이션 API
 */

import { FastifyPluginAsync } from 'fastify';
import { logger } from '../../utils/logger';
import * as streakService from './streak.service';

// =============================================
// Fastify Plugin
// =============================================

export const gamificationRoutes: FastifyPluginAsync = async (fastify) => {
  // =============================================
  // Streak Endpoints
  // =============================================

  /**
   * @swagger
   * /api/gamification/streak:
   *   get:
   *     tags: [Gamification]
   *     summary: 현재 사용자 스트릭 조회
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 스트릭 상태
   */
  fastify.get('/streak', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;
      const status = await streakService.checkStreakStatus(userId);

      return status;
    } catch (error) {
      logger.error('Failed to get streak:', error);
      return reply.status(500).send({ error: 'Failed to get streak' });
    }
  });

  /**
   * @swagger
   * /api/gamification/streak/check:
   *   post:
   *     tags: [Gamification]
   *     summary: 스트릭 상태 확인 (at-risk 여부)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 스트릭 상태 (위험 여부 포함)
   */
  fastify.post('/streak/check', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;
      const status = await streakService.checkStreakStatus(userId);

      return status;
    } catch (error) {
      logger.error('Failed to check streak status:', error);
      return reply.status(500).send({ error: 'Failed to check streak status' });
    }
  });

  // NOTE: POST /streak/update 제거됨 (2026-02)
  // 스트릭은 레슨 완료 시 courses/service.ts에서 자동 호출됨.
  // 수동 트리거는 보안 위험 (아무 유저나 streak 조작 가능).
};
