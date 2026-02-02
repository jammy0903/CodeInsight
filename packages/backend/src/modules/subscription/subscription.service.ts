/**
 * Subscription Service
 *
 * WHY: 사용자 구독 상태 확인 및 AI 사용량 관리
 * PATTERN:
 *   - 구독 플랜별 토큰 제한 체크
 *   - AI 사용량 기록 및 월간 요약 업데이트
 */

import { Prisma } from '.prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

// DeepSeek API 가격 (per million tokens)
const DEEPSEEK_INPUT_COST = 0.14;   // $0.14/1M tokens
const DEEPSEEK_OUTPUT_COST = 0.28;  // $0.28/1M tokens

// Admin 기능: 모든 제한 bypass
const ADMIN_SUBSCRIPTION: UserSubscriptionInfo = {
  planId: 'admin',
  planName: 'Admin (무제한)',
  status: 'active',
  monthlyTokenLimit: null,  // 무제한
  dailyTokenLimit: null,    // 무제한
  currentMonthUsage: 0,
  currentDayUsage: 0,
  features: ['all_chapters', 'ai_chat', 'ai_explain', 'priority_support', 'admin']
};

export interface UserSubscriptionInfo {
  planId: string;
  planName: string;
  status: string;
  monthlyTokenLimit: number | null;  // null = unlimited
  dailyTokenLimit: number | null;    // null = unlimited
  currentMonthUsage: number;
  currentDayUsage: number;
  features: string[];
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  remainingTokens?: number;
  currentUsage?: number;
  limit?: number;
}

export interface RecordUsageParams {
  userId: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  model?: string;
}

export class SubscriptionService {
  /**
   * Admin 여부 체크 (DB role 기반)
   * WHY: Firebase UID 대신 DB role로 체크하여 일관성 유지
   */
  private async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      return user?.role === 'admin';
    } catch (error) {
      logger.error('Admin check failed:', error);
      return false;
    }
  }

  /**
   * 사용자의 현재 구독 정보 조회
   * - Admin: 무제한 플랜 반환
   * - 일반 사용자: 구독이 없으면 Free 플랜 기본 반환
   */
  async getUserSubscription(userId: string): Promise<UserSubscriptionInfo> {
    // Admin은 무제한 구독 반환
    if (await this.isAdmin(userId)) {
      return ADMIN_SUBSCRIPTION;
    }
    // 사용자의 활성 구독 조회
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true }
    });

    // 이번 달 사용량 조회
    const yearMonth = this.getCurrentYearMonth();
    const monthlyUsage = await prisma.monthlyUsageSummary.findUnique({
      where: {
        userId_yearMonth: { userId, yearMonth }
      }
    });

    // 오늘 사용량 조회
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.aIUsageRecord.aggregate({
      where: {
        userId,
        createdAt: { gte: todayStart }
      },
      _sum: { totalTokens: true }
    });

    // 구독이 없거나 만료된 경우 Free 플랜
    if (!subscription || subscription.status !== 'active') {
      const freePlan = await prisma.subscriptionPlan.findUnique({
        where: { id: 'free' }
      });

      return {
        planId: 'free',
        planName: freePlan?.name || '무료',
        status: 'active',
        monthlyTokenLimit: freePlan?.monthlyTokenLimit || 10000,
        dailyTokenLimit: freePlan?.dailyTokenLimit || 1000,
        currentMonthUsage: monthlyUsage?.totalTokens || 0,
        currentDayUsage: todayUsage._sum.totalTokens || 0,
        features: freePlan?.features || ['basic_learning']
      };
    }

    return {
      planId: subscription.planId,
      planName: subscription.plan.name,
      status: subscription.status,
      monthlyTokenLimit: subscription.plan.monthlyTokenLimit,
      dailyTokenLimit: subscription.plan.dailyTokenLimit,
      currentMonthUsage: monthlyUsage?.totalTokens || 0,
      currentDayUsage: todayUsage._sum.totalTokens || 0,
      features: subscription.plan.features
    };
  }

  /**
   * AI 사용 가능 여부 체크
   * NOTE: 현재 모든 AI 기능 무료 개방 중
   */
  async checkUsageAllowed(userId: string, estimatedTokens: number = 1000): Promise<UsageCheckResult> {
    // TODO: 프리미엄 출시 시 아래 주석 해제
    // const subscription = await this.getUserSubscription(userId);
    //
    // // 월간 제한 체크
    // if (subscription.monthlyTokenLimit !== null) {
    //   const monthlyRemaining = subscription.monthlyTokenLimit - subscription.currentMonthUsage;
    //   if (monthlyRemaining < estimatedTokens) {
    //     return {
    //       allowed: false,
    //       reason: '월간 토큰 한도를 초과했습니다. Pro 플랜으로 업그레이드하세요.',
    //       remainingTokens: Math.max(0, monthlyRemaining),
    //       currentUsage: subscription.currentMonthUsage,
    //       limit: subscription.monthlyTokenLimit
    //     };
    //   }
    // }
    //
    // // 일일 제한 체크
    // if (subscription.dailyTokenLimit !== null) {
    //   const dailyRemaining = subscription.dailyTokenLimit - subscription.currentDayUsage;
    //   if (dailyRemaining < estimatedTokens) {
    //     return {
    //       allowed: false,
    //       reason: '일일 토큰 한도를 초과했습니다. 내일 다시 시도하세요.',
    //       remainingTokens: Math.max(0, dailyRemaining),
    //       currentUsage: subscription.currentDayUsage,
    //       limit: subscription.dailyTokenLimit
    //     };
    //   }
    // }

    return { allowed: true }; // 모든 AI 기능 무료 개방
  }

  /**
   * AI 사용량 기록
   * - AIUsageRecord에 개별 요청 기록
   * - MonthlyUsageSummary 업데이트
   */
  async recordUsage(params: RecordUsageParams): Promise<void> {
    const { userId, endpoint, promptTokens, completionTokens, model } = params;
    const totalTokens = promptTokens + completionTokens;

    // 비용 계산 (USD)
    const cost = new Prisma.Decimal(
      (promptTokens * DEEPSEEK_INPUT_COST / 1_000_000) +
      (completionTokens * DEEPSEEK_OUTPUT_COST / 1_000_000)
    );

    const yearMonth = this.getCurrentYearMonth();

    // 트랜잭션으로 사용량 기록 + 월간 요약 업데이트
    await prisma.$transaction(async (tx) => {
      // 1. 개별 요청 기록
      await tx.aIUsageRecord.create({
        data: {
          userId,
          endpoint,
          promptTokens,
          completionTokens,
          totalTokens,
          cost,
          model: model || 'deepseek-chat'
        }
      });

      // 2. 월간 요약 업데이트 (upsert)
      await tx.monthlyUsageSummary.upsert({
        where: {
          userId_yearMonth: { userId, yearMonth }
        },
        create: {
          userId,
          yearMonth,
          totalTokens,
          totalCost: cost,
          requestCount: 1
        },
        update: {
          totalTokens: { increment: totalTokens },
          totalCost: { increment: cost },
          requestCount: { increment: 1 },
          updatedAt: new Date()
        }
      });
    });
  }

  /**
   * 특정 기능 사용 가능 여부 체크
   * NOTE: 현재 모든 기능 무료 개방 중
   */
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    // TODO: 프리미엄 출시 시 아래 주석 해제
    // const subscription = await this.getUserSubscription(userId);
    // return subscription.features.includes(feature);
    return true; // 모든 기능 무료 개방
  }

  /**
   * 챕터 접근 가능 여부 체크
   * NOTE: 현재 모든 챕터 무료 개방 중
   */
  async canAccessChapter(userId: string, chapterOrder: number): Promise<{ allowed: boolean; reason?: string }> {
    // TODO: 프리미엄 출시 시 아래 주석 해제
    // const subscription = await this.getUserSubscription(userId);
    // if (chapterOrder >= 3) {
    //   const hasAllChapters = subscription.features.includes('all_chapters');
    //   if (!hasAllChapters) {
    //     return { allowed: false, reason: '챕터 3 이상은 유료 구독이 필요합니다.' };
    //   }
    // }

    return { allowed: true };
  }

  /**
   * 비로그인 사용자 챕터 접근 체크
   * NOTE: 현재 모든 챕터 무료 개방 중
   */
  canAccessChapterWithoutLogin(chapterOrder: number): { allowed: boolean; reason?: string } {
    // TODO: 프리미엄 출시 시 아래 주석 해제
    // if (chapterOrder >= 2) {
    //   return { allowed: false, reason: '챕터 2 이상은 로그인이 필요합니다.' };
    // }
    return { allowed: true }; // 모든 챕터 무료 개방
  }

  /**
   * 구독 플랜 목록 조회
   */
  async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
  }

  /**
   * 사용자 구독 생성/업데이트
   */
  async createOrUpdateSubscription(params: {
    userId: string;
    planId: string;
    paymentProvider?: string;
    externalSubscriptionId?: string;
    currentPeriodEnd?: Date;
  }) {
    const { userId, planId, paymentProvider, externalSubscriptionId } = params;
    const now = new Date();
    // 기본값: 한 달 후
    const periodEnd = params.currentPeriodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: 'active',
        paymentProvider,
        externalSubscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      },
      update: {
        planId,
        status: 'active',
        paymentProvider,
        externalSubscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now
      }
    });
  }

  /**
   * 구독 취소 (기간 종료 시 해지 예약)
   */
  async cancelSubscription(userId: string) {
    return prisma.userSubscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true
      }
    });
  }

  /**
   * 구독 즉시 취소
   */
  async cancelSubscriptionImmediately(userId: string) {
    return prisma.userSubscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        cancelAtPeriodEnd: true
      }
    });
  }

  // Helper: 현재 년월 (YYYY-MM 형식)
  private getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}

// 싱글톤 인스턴스
export const subscriptionService = new SubscriptionService();
