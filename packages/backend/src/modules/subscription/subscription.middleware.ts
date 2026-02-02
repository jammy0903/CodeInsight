/**
 * Subscription Middleware
 *
 * WHY: AI 엔드포인트 접근 제어
 * PATTERN: 요청 전 구독 상태 및 사용량 체크
 */

import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';
import { logger } from '../../utils/logger';

// Express Request 타입 사용 (auth.ts에서 global로 확장됨)

/**
 * AI 사용량 체크 미들웨어
 * - requireDbUser 미들웨어 이후 사용 (DB 사용자 ID 필요)
 * - 구독 상태 및 토큰 한도 체크
 */
export async function checkAIUsage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // DB 사용자 체크 (requireDbUser가 먼저 실행되어야 함)
    const userId = (req as any).user?.dbUser?.id;
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'AI 기능을 사용하려면 로그인이 필요합니다.'
      });
      return;
    }

    // 사용량 체크 (예상 토큰 1000개 기준)
    const usageCheck = await subscriptionService.checkUsageAllowed(userId, 1000);

    if (!usageCheck.allowed) {
      res.status(429).json({
        error: 'Usage Limit Exceeded',
        message: usageCheck.reason,
        details: {
          remainingTokens: usageCheck.remainingTokens,
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit
        }
      });
      return;
    }

    // 구독 정보를 request에 첨부 (나중에 사용량 기록 시 활용)
    (req as any).subscriptionInfo = await subscriptionService.getUserSubscription(userId);

    next();
  } catch (error) {
    logger.error('AI usage check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'AI 사용량 체크 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 특정 기능 접근 체크 미들웨어
 * 예: requireFeature('ai_chat'), requireFeature('ai_explain')
 */
export function requireFeature(feature: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.dbUser?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: '로그인이 필요합니다.'
        });
        return;
      }

      const hasFeature = await subscriptionService.hasFeature(userId, feature);

      if (!hasFeature) {
        res.status(403).json({
          error: 'Feature Not Available',
          message: `이 기능(${feature})은 Pro 플랜 이상에서 사용 가능합니다.`,
          upgradeRequired: true
        });
        return;
      }

      next();
    } catch (error) {
      logger.error(`Feature check error (${feature}):`, error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: '기능 접근 체크 중 오류가 발생했습니다.'
      });
    }
  };
}

/**
 * AI 사용량 기록 헬퍼 함수
 * 컨트롤러에서 AI 요청 완료 후 호출
 */
export async function recordAIUsage(
  userId: string,
  endpoint: string,
  promptTokens: number,
  completionTokens: number,
  model?: string
): Promise<void> {
  try {
    await subscriptionService.recordUsage({
      userId,
      endpoint,
      promptTokens,
      completionTokens,
      model
    });
  } catch (error) {
    // 사용량 기록 실패는 요청 자체를 실패시키지 않음 (로그만)
    logger.error('Failed to record AI usage:', error);
  }
}
