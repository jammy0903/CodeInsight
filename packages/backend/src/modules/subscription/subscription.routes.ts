/**
 * Subscription Routes
 *
 * WHY: 구독 관리 API 엔드포인트
 * PATTERN: 구독 플랜 조회, 사용자 구독 정보 조회
 */

import { Router, Request, Response } from 'express';
import { subscriptionService } from './subscription.service';
import { requireDbUser } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/subscription/plans
 * 구독 플랜 목록 조회 (공개)
 */
router.get('/plans', async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json(plans);
  } catch (error) {
    logger.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

/**
 * GET /api/subscription/me
 * 내 구독 정보 조회 (로그인 필요)
 */
router.get('/me', requireDbUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const subscription = await subscriptionService.getUserSubscription(userId);
    res.json(subscription);
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * GET /api/subscription/usage
 * 내 사용량 조회 (로그인 필요)
 */
router.get('/usage', requireDbUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const subscription = await subscriptionService.getUserSubscription(userId);
    const usageCheck = await subscriptionService.checkUsageAllowed(userId);

    res.json({
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
    });
  } catch (error) {
    logger.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

/**
 * GET /api/subscription/chapter-access/:chapterOrder
 * 챕터 접근 권한 체크 (로그인 여부에 따라 다른 체크)
 * - 비로그인: 챕터 1만
 * - 로그인 무료: 챕터 1-2
 * - 유료 구독: 전체
 */
router.get('/chapter-access/:chapterOrder', async (req: Request, res: Response): Promise<void> => {
  try {
    const chapterOrderParam = req.params.chapterOrder;
    const chapterOrder = parseInt(Array.isArray(chapterOrderParam) ? chapterOrderParam[0] : chapterOrderParam, 10);
    if (isNaN(chapterOrder)) {
      res.status(400).json({ error: 'Invalid chapter order' });
      return;
    }

    // 로그인 여부 확인 (req.user가 없을 수 있음)
    const userId = req.user?.dbUser?.id;

    if (!userId) {
      // 비로그인: 챕터 1만 접근 가능
      const result = subscriptionService.canAccessChapterWithoutLogin(chapterOrder);
      res.json(result);
      return;
    }

    // 로그인 사용자: 구독 상태에 따라 체크
    const result = await subscriptionService.canAccessChapter(userId, chapterOrder);
    res.json(result);
  } catch (error) {
    logger.error('Check chapter access error:', error);
    res.status(500).json({ error: 'Failed to check chapter access' });
  }
});

/**
 * POST /api/subscription/cancel
 * 구독 취소 예약 (로그인 필요)
 */
router.post('/cancel', requireDbUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await subscriptionService.cancelSubscription(userId);
    res.json({ success: true, message: '구독이 기간 종료 시 해지됩니다.' });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export const subscriptionRoutes = router;
