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

  /**
   * @swagger
   * /api/gamification/streak/update:
   *   post:
   *     tags: [Gamification]
   *     summary: 스트릭 업데이트 (수동, 테스트용)
   *     security:
   *       - bearerAuth: []
   *     description: 일반적으로 레슨 완료 시 자동 호출됨
   *     responses:
   *       200:
   *         description: 업데이트된 스트릭
   */
  fastify.post('/streak/update', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;
      const streak = await streakService.updateStreak(userId);

      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveAt: streak.lastActiveAt,
      };
    } catch (error) {
      logger.error('Failed to update streak:', error);
      return reply.status(500).send({ error: 'Failed to update streak' });
    }
  });
};
