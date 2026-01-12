/**
 * Analytics Routes
 * 분석 리포트용 데이터 수집 API
 *
 * POST /api/analytics/activity       - 레슨 활동 시작/종료
 * POST /api/analytics/activity/end   - 레슨 활동 종료 (sendBeacon용)
 * POST /api/analytics/quiz-attempt   - 퀴즈 시도 기록
 * GET  /api/analytics/summary        - 분석 데이터 요약
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

const activityStartSchema = z.object({
  lessonId: z.string().min(1),
  action: z.literal('start'),
});

const activityEndSchema = z.object({
  activityId: z.string().uuid(),
  action: z.literal('end'),
});

// sendBeacon용 (인증 토큰을 body에 포함)
const beaconEndSchema = z.object({
  activityId: z.string().uuid(),
});

const quizAttemptSchema = z.object({
  quizId: z.string().min(1),
  userAnswer: z.string().max(500),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0).optional(),
});

// =============================================
// Activity Endpoints (체류 시간)
// =============================================

/**
 * 레슨 활동 시작/종료
 * POST /api/analytics/activity
 */
router.post('/activity', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    // action으로 분기
    const action = req.body?.action;

    if (action === 'start') {
      const parsed = activityStartSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const { lessonId } = parsed.data;

      // 새 활동 레코드 생성
      const activity = await prisma.lessonActivity.create({
        data: {
          userId,
          lessonId,
          startedAt: new Date(),
        },
      });

      return res.json({
        id: activity.id,
        startedAt: activity.startedAt.toISOString(),
      });
    }

    if (action === 'end') {
      const parsed = activityEndSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const { activityId } = parsed.data;

      // 기존 활동 레코드 찾기
      const existing = await prisma.lessonActivity.findFirst({
        where: {
          id: activityId,
          userId, // 본인 레코드만
          endedAt: null, // 아직 종료 안 된 것만
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Activity not found or already ended' });
      }

      const endedAt = new Date();
      const duration = Math.floor((endedAt.getTime() - existing.startedAt.getTime()) / 1000);

      const activity = await prisma.lessonActivity.update({
        where: { id: activityId },
        data: {
          endedAt,
          duration,
        },
      });

      return res.json({
        id: activity.id,
        startedAt: activity.startedAt.toISOString(),
        endedAt: activity.endedAt?.toISOString(),
        duration: activity.duration,
      });
    }

    return res.status(400).json({ error: 'Invalid action. Use "start" or "end"' });
  } catch (error) {
    logger.error('Activity error:', error);
    res.status(500).json({
      error: 'Failed to record activity',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 레슨 활동 종료 (sendBeacon용 - 인증 헤더 없음)
 * POST /api/analytics/activity/end
 *
 * WHY: navigator.sendBeacon()은 헤더 설정이 제한적
 * - body에 activityId만 포함
 * - activityId는 UUID이므로 추측 불가능
 * - 본인 레코드만 업데이트 가능 (생성 시 userId 고정)
 */
router.post('/activity/end', async (req, res) => {
  try {
    const parsed = beaconEndSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { activityId } = parsed.data;

    // 아직 종료 안 된 활동만 찾기
    const existing = await prisma.lessonActivity.findFirst({
      where: {
        id: activityId,
        endedAt: null,
      },
    });

    if (!existing) {
      // 이미 종료됐거나 없음 - 성공으로 처리 (sendBeacon은 재시도 가능)
      return res.json({ ok: true, message: 'Already ended or not found' });
    }

    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - existing.startedAt.getTime()) / 1000);

    await prisma.lessonActivity.update({
      where: { id: activityId },
      data: {
        endedAt,
        duration,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    logger.error('Activity end (beacon) error:', error);
    // sendBeacon은 실패해도 재시도하므로 200 반환
    res.json({ ok: false, error: 'Internal error' });
  }
});

// =============================================
// Quiz Attempt Endpoints (퀴즈 시도)
// =============================================

/**
 * 퀴즈 시도 기록
 * POST /api/analytics/quiz-attempt
 */
router.post('/quiz-attempt', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const parsed = quizAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { quizId, userAnswer, isCorrect, timeSpent } = parsed.data;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        userAnswer,
        isCorrect,
        timeSpent,
      },
    });

    res.json({
      id: attempt.id,
      createdAt: attempt.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error('Quiz attempt error:', error);
    res.status(500).json({
      error: 'Failed to record quiz attempt',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =============================================
// Summary Endpoints (분석 데이터)
// =============================================

/**
 * 분석 데이터 요약
 * GET /api/analytics/summary
 *
 * Query params:
 * - period: '7d' | '30d' | '90d' | '1y' (기본: '30d')
 */
router.get('/summary', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;
    const period = (req.query.period as string) || '30d';

    // 기간 계산
    const periodDays: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    const days = periodDays[period] || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // 병렬 쿼리 실행
    const [
      activities,
      quizAttempts,
      chatHistory,
      notes,
    ] = await Promise.all([
      // 레슨 활동 (체류 시간)
      prisma.lessonActivity.findMany({
        where: {
          userId,
          startedAt: { gte: since },
        },
        orderBy: { startedAt: 'desc' },
      }),
      // 퀴즈 시도
      prisma.quizAttempt.findMany({
        where: {
          userId,
          createdAt: { gte: since },
        },
        include: {
          quiz: {
            select: { question: true, lessonId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // AI 질문 히스토리
      prisma.chatHistory.findMany({
        where: {
          userId,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // 최근 100개만
      }),
      // 개념 노트
      prisma.userNote.findMany({
        where: {
          userId,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 통계 계산
    const totalStudyTime = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const correctAttempts = quizAttempts.filter((a) => a.isCorrect).length;
    const wrongAttempts = quizAttempts.filter((a) => !a.isCorrect);

    // 일별 활동 (캘린더용)
    const dailyActivity: Record<string, number> = {};
    activities.forEach((a) => {
      const date = a.startedAt.toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + (a.duration || 0);
    });

    // 시간대별 활동
    const hourlyActivity = Array(24).fill(0);
    activities.forEach((a) => {
      const hour = a.startedAt.getHours();
      hourlyActivity[hour] += a.duration || 0;
    });

    // 요일별 활동
    const weekdayActivity = Array(7).fill(0);
    activities.forEach((a) => {
      const day = a.startedAt.getDay();
      weekdayActivity[day] += a.duration || 0;
    });

    // 취약 개념 추출 (오답 기반)
    const weakConcepts: Record<string, number> = {};
    wrongAttempts.forEach((a) => {
      const concept = a.quiz?.lessonId || 'unknown';
      weakConcepts[concept] = (weakConcepts[concept] || 0) + 1;
    });

    res.json({
      period,
      totalStudyTime, // 초 단위
      totalSessions: activities.length,
      quizStats: {
        total: quizAttempts.length,
        correct: correctAttempts,
        wrong: wrongAttempts.length,
        accuracy: quizAttempts.length > 0
          ? Math.round((correctAttempts / quizAttempts.length) * 100)
          : 0,
      },
      aiQuestions: chatHistory.length,
      notes: notes.length,
      dailyActivity,
      hourlyActivity,
      weekdayActivity,
      weakConcepts,
      recentWrongAnswers: wrongAttempts.slice(0, 10).map((a) => ({
        quizId: a.quizId,
        question: a.quiz?.question,
        userAnswer: a.userAnswer,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Analytics summary error:', error);
    res.status(500).json({
      error: 'Failed to get analytics summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const analyticsRoutes = router;
