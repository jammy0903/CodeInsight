/**
 * Subscription Routes
 *
 * WHY: 구독 관리 API 엔드포인트
 * PATTERN: 구독 플랜 조회, 사용자 구독 정보 조회
 */

import { FastifyPluginAsync } from 'fastify';
import { subscriptionService } from './subscription.service';
import { logger } from '../../utils/logger';

export const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/subscription/plans
   * 구독 플랜 목록 조회 (공개)
   */
  fastify.get('/plans', async (_request, reply) => {
    try {
      const plans = await subscriptionService.getPlans();
      return plans;
    } catch (error) {
      logger.error('Get plans error:', error);
      return reply.status(500).send({ error: 'Failed to fetch plans' });
    }
  });

  /**
   * GET /api/subscription/me
   * 내 구독 정보 조회 (로그인 필요)
   */
  fastify.get('/me', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user?.dbUser?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const subscription = await subscriptionService.getUserSubscription(userId);
      return subscription;
    } catch (error) {
      logger.error('Get subscription error:', error);
      return reply.status(500).send({ error: 'Failed to fetch subscription' });
    }
  });

  /**
   * GET /api/subscription/usage
   * 내 사용량 조회 (로그인 필요)
   */
  fastify.get('/usage', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user?.dbUser?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const subscription = await subscriptionService.getUserSubscription(userId);
      const usageCheck = await subscriptionService.checkUsageAllowed(userId);

      return {
        plan: {
          id: subscription.planId,
          name: subscription.planName
        },
        limits: {
          monthly: subscription.monthlyTokenLimit,
          daily: subscription.dailyTokenLimit
        },
        usage: {
          monthly: subscription.currentMonthUsage,
          daily: subscription.currentDayUsage
        },
        remaining: {
          monthly: subscription.monthlyTokenLimit !== null
            ? Math.max(0, subscription.monthlyTokenLimit - subscription.currentMonthUsage)
            : null,
          daily: subscription.dailyTokenLimit !== null
            ? Math.max(0, subscription.dailyTokenLimit - subscription.currentDayUsage)
            : null
        },
        allowed: usageCheck.allowed,
        reason: usageCheck.reason
      };
    } catch (error) {
      logger.error('Get usage error:', error);
      return reply.status(500).send({ error: 'Failed to fetch usage' });
    }
  });

  /**
   * GET /api/subscription/chapter-access/:chapterOrder
   * 챕터 접근 권한 체크 (로그인 여부에 따라 다른 체크)
   * - 비로그인: 챕터 1만
   * - 로그인 무료: 챕터 1-2
   * - 유료 구독: 전체
   */
  fastify.get('/chapter-access/:chapterOrder', async (request, reply) => {
    try {
      const params = request.params as { chapterOrder: string };
      const chapterOrderParam = params.chapterOrder;
      const chapterOrder = parseInt(Array.isArray(chapterOrderParam) ? chapterOrderParam[0] : chapterOrderParam, 10);
      if (isNaN(chapterOrder)) {
        return reply.status(400).send({ error: 'Invalid chapter order' });
      }

      // 로그인 여부 확인 (request.user가 없을 수 있음)
      const userId = request.user?.dbUser?.id;

      if (!userId) {
        // 비로그인: 챕터 1만 접근 가능
        const result = subscriptionService.canAccessChapterWithoutLogin(chapterOrder);
        return result;
      }

      // 로그인 사용자: 구독 상태에 따라 체크
      const result = await subscriptionService.canAccessChapter(userId, chapterOrder);
      return result;
    } catch (error) {
      logger.error('Check chapter access error:', error);
      return reply.status(500).send({ error: 'Failed to check chapter access' });
    }
  });

  /**
   * POST /api/subscription/cancel
   * 구독 취소 예약 (로그인 필요)
   */
  fastify.post('/cancel', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user?.dbUser?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      await subscriptionService.cancelSubscription(userId);
      return { success: true, message: '구독이 기간 종료 시 해지됩니다.' };
    } catch (error) {
      logger.error('Cancel subscription error:', error);
      return reply.status(500).send({ error: 'Failed to cancel subscription' });
    }
  });
};
