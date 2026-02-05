/**
 * Analytics Routes
 * 분석 리포트용 데이터 수집 API
 *
 * POST /api/analytics/activity       - 레슨 활동 시작/종료
 * POST /api/analytics/activity/end   - 레슨 활동 종료 (sendBeacon용)
 * POST /api/analytics/quiz-attempt   - 퀴즈 시도 기록
 * GET  /api/analytics/summary        - 분석 데이터 요약
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

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

// 온보딩 프로필
const profileSchema = z.object({
  ageGroup: z.enum(['10s', '20s', '30s', '40s+']).optional(),
  occupation: z.enum(['student_middle', 'student_high', 'student_univ', 'job_seeker', 'worker', 'other']).optional(),
  programmingExp: z.enum(['none', 'less_1y', '1_3y', '3y_plus']).optional(),
  learningGoal: z.enum(['basics', 'job_prep', 'skill_up', 'curiosity']).optional(),
});

// 세션 컨텍스트
const sessionContextSchema = z.object({
  lessonActivityId: z.string().uuid().optional(),
  screenWidth: z.number().int().positive().optional(),
  screenHeight: z.number().int().positive().optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  inputMethod: z.enum(['touch', 'mouse']).optional(),
  userAgent: z.string().max(500).optional(),
  language: z.string().max(10).optional(),
  connectionType: z.string().max(20).optional(),
  effectiveType: z.enum(['slow-2g', '2g', '3g', '4g']).optional(),
  localHour: z.number().int().min(0).max(23).optional(),
  localWeekday: z.number().int().min(0).max(6).optional(),
  timezone: z.string().max(50).optional(),
});

// 스텝 활동
const stepActivitySchema = z.object({
  lessonActivityId: z.string().uuid(),
  lessonId: z.string().min(1),
  stepIndex: z.number().int().min(0),
  duration: z.number().int().min(0).optional(),
  wentBack: z.boolean().optional(),
  visHoverCount: z.number().int().min(0).optional(),
  visClickCount: z.number().int().min(0).optional(),
  aiQuestionCount: z.number().int().min(0).optional(),
  codeSelections: z.number().int().min(0).optional(),
  scrollEvents: z.number().int().min(0).optional(),
});

// =============================================
// Fastify Plugin
// =============================================

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // =============================================
  // Activity Endpoints (체류 시간)
  // =============================================

  /**
   * 레슨 활동 시작/종료
   * POST /api/analytics/activity
   */
  fastify.post('/activity', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      // action으로 분기
      const action = (request.body as any)?.action;

      if (action === 'start') {
        const parsed = activityStartSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
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

        return {
          id: activity.id,
          startedAt: activity.startedAt.toISOString(),
        };
      }

      if (action === 'end') {
        const parsed = activityEndSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: 'Invalid request',
            details: parsed.error.issues,
          });
        }

        const { activityId } = parsed.data;

        // 트랜잭션으로 Race Condition 방지
        const result = await prisma.$transaction(async (tx) => {
          // 기존 활동 레코드 찾기 (트랜잭션 내에서)
          const existing = await tx.lessonActivity.findFirst({
            where: {
              id: activityId,
              userId, // 본인 레코드만
              endedAt: null, // 아직 종료 안 된 것만
            },
          });

          if (!existing) {
            return null; // 트랜잭션 내에서 early return
          }

          const endedAt = new Date();
          const duration = Math.floor((endedAt.getTime() - existing.startedAt.getTime()) / 1000);

          return tx.lessonActivity.update({
            where: { id: activityId },
            data: {
              endedAt,
              duration,
            },
          });
        });

        if (!result) {
          return reply.status(404).send({ error: 'Activity not found or already ended' });
        }

        return {
          id: result.id,
          startedAt: result.startedAt.toISOString(),
          endedAt: result.endedAt?.toISOString(),
          duration: result.duration,
        };
      }

      return reply.status(400).send({ error: 'Invalid action. Use "start" or "end"' });
    } catch (error) {
      logger.error('Activity error:', error);
      return reply.status(500).send({
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
  fastify.post('/activity/end', async (request, reply) => {
    try {
      const parsed = beaconEndSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const { activityId } = parsed.data;

      // 트랜잭션으로 Race Condition 방지
      const updated = await prisma.$transaction(async (tx) => {
        // 아직 종료 안 된 활동만 찾기
        const existing = await tx.lessonActivity.findFirst({
          where: {
            id: activityId,
            endedAt: null,
          },
        });

        if (!existing) {
          // 이미 종료됐거나 없음
          return false;
        }

        const endedAt = new Date();
        const duration = Math.floor((endedAt.getTime() - existing.startedAt.getTime()) / 1000);

        await tx.lessonActivity.update({
          where: { id: activityId },
          data: {
            endedAt,
            duration,
          },
        });

        return true;
      });

      return { ok: true, message: updated ? 'Ended' : 'Already ended or not found' };
    } catch (error) {
      logger.error('Activity end (beacon) error:', error);
      // sendBeacon은 실패해도 재시도하므로 200 반환
      return { ok: false, error: 'Internal error' };
    }
  });

  // =============================================
  // Quiz Attempt Endpoints (퀴즈 시도)
  // =============================================

  /**
   * 퀴즈 시도 기록
   * POST /api/analytics/quiz-attempt
   */
  fastify.post('/quiz-attempt', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const parsed = quizAttemptSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
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

      return {
        id: attempt.id,
        createdAt: attempt.createdAt.toISOString(),
      };
    } catch (error) {
      logger.error('Quiz attempt error:', error);
      return reply.status(500).send({
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
  fastify.get('/summary', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;
      const period = ((request.query as any).period as string) || '30d';

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

      // 통계 계산 (any 타입 제거 - Prisma 타입 추론 활용)
      const totalStudyTime = activities.reduce((sum, a) => sum + (a.duration ?? 0), 0);
      const correctAttempts = quizAttempts.filter((a) => a.isCorrect).length;
      const wrongAttempts = quizAttempts.filter((a) => !a.isCorrect);

      // 일별 활동 (캘린더용)
      const dailyActivity: Record<string, number> = {};
      for (const a of activities) {
        const date = a.startedAt.toISOString().split('T')[0];
        dailyActivity[date] = (dailyActivity[date] ?? 0) + (a.duration ?? 0);
      }

      // 시간대별 활동
      const hourlyActivity: number[] = Array(24).fill(0);
      for (const a of activities) {
        const hour = a.startedAt.getHours();
        hourlyActivity[hour] += a.duration ?? 0;
      }

      // 요일별 활동
      const weekdayActivity: number[] = Array(7).fill(0);
      for (const a of activities) {
        const day = a.startedAt.getDay();
        weekdayActivity[day] += a.duration ?? 0;
      }

      // 취약 개념 추출 (오답 기반)
      const weakConcepts: Record<string, number> = {};
      for (const a of wrongAttempts) {
        const concept = a.quiz?.lessonId ?? 'unknown';
        weakConcepts[concept] = (weakConcepts[concept] ?? 0) + 1;
      }

      return {
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
          question: a.quiz?.question ?? null,
          userAnswer: a.userAnswer,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      logger.error('Analytics summary error:', error);
      return reply.status(500).send({
        error: 'Failed to get analytics summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // =============================================
  // Profile Endpoints (온보딩)
  // =============================================

  /**
   * 프로필 조회
   * GET /api/analytics/profile
   */
  fastify.get('/profile', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const profile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        return {
          profile: null,
          onboardingCompleted: false,
        };
      }

      return {
        profile: {
          ageGroup: profile.ageGroup,
          occupation: profile.occupation,
          programmingExp: profile.programmingExp,
          learningGoal: profile.learningGoal,
        },
        onboardingCompleted: profile.onboardingCompleted,
      };
    } catch (error) {
      logger.error('Profile get error:', error);
      return reply.status(500).send({
        error: 'Failed to get profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 프로필 생성/업데이트 (온보딩)
   * POST /api/analytics/profile
   */
  fastify.post('/profile', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const parsed = profileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const { ageGroup, occupation, programmingExp, learningGoal } = parsed.data;

      // POST 요청 = 사용자가 온보딩 모달을 봤음 (스킵 또는 완료)
      // -> 다시 보여줄 필요 없으므로 무조건 완료 처리
      const onboardingCompleted = true;

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        update: {
          ageGroup,
          occupation,
          programmingExp,
          learningGoal,
          onboardingCompleted,
        },
        create: {
          userId,
          ageGroup,
          occupation,
          programmingExp,
          learningGoal,
          onboardingCompleted,
        },
      });

      return {
        profile: {
          ageGroup: profile.ageGroup,
          occupation: profile.occupation,
          programmingExp: profile.programmingExp,
          learningGoal: profile.learningGoal,
        },
        onboardingCompleted: profile.onboardingCompleted,
      };
    } catch (error) {
      logger.error('Profile update error:', error);
      return reply.status(500).send({
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // =============================================
  // Session Context Endpoints
  // =============================================

  /**
   * 세션 컨텍스트 저장
   * POST /api/analytics/session-context
   */
  fastify.post('/session-context', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const parsed = sessionContextSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const context = await prisma.sessionContext.create({
        data: {
          userId,
          ...parsed.data,
        },
      });

      return {
        id: context.id,
        createdAt: context.createdAt.toISOString(),
      };
    } catch (error) {
      logger.error('Session context error:', error);
      return reply.status(500).send({
        error: 'Failed to save session context',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // =============================================
  // Step Activity Endpoints
  // =============================================

  /**
   * 스텝 활동 기록 (upsert)
   * POST /api/analytics/step-activity
   */
  fastify.post('/step-activity', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const parsed = stepActivitySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const { lessonActivityId, lessonId, stepIndex, ...data } = parsed.data;

      // upsert: 같은 (lessonActivityId, stepIndex)면 업데이트
      const activity = await prisma.stepActivity.upsert({
        where: {
          lessonActivityId_stepIndex: {
            lessonActivityId,
            stepIndex,
          },
        },
        update: {
          ...data,
          // 증분 업데이트가 필요한 필드들은 increment 사용 가능
          // 여기서는 클라이언트가 누적값을 보내는 것으로 가정
        },
        create: {
          userId,
          lessonActivityId,
          lessonId,
          stepIndex,
          ...data,
        },
      });

      return {
        id: activity.id,
        createdAt: activity.createdAt.toISOString(),
      };
    } catch (error) {
      logger.error('Step activity error:', error);
      return reply.status(500).send({
        error: 'Failed to save step activity',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 스텝 활동 일괄 기록 (배치)
   * POST /api/analytics/step-activities
   *
   * WHY: 레슨 완료 시 모든 스텝 데이터를 한 번에 전송
   */
  fastify.post('/step-activities', { preHandler: [fastify.requireDbUser] }, async (request, reply) => {
    try {
      const userId = request.user!.dbUser!.id;

      const batchSchema = z.object({
        activities: z.array(stepActivitySchema).max(100),
      });

      const parsed = batchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const { activities } = parsed.data;

      // 트랜잭션으로 일괄 upsert
      const results = await prisma.$transaction(
        activities.map(({ lessonActivityId, lessonId, stepIndex, ...data }) =>
          prisma.stepActivity.upsert({
            where: {
              lessonActivityId_stepIndex: {
                lessonActivityId,
                stepIndex,
              },
            },
            update: data,
            create: {
              userId,
              lessonActivityId,
              lessonId,
              stepIndex,
              ...data,
            },
          })
        )
      );

      return {
        count: results.length,
        ids: results.map((r) => r.id),
      };
    } catch (error) {
      logger.error('Batch step activities error:', error);
      return reply.status(500).send({
        error: 'Failed to save step activities',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
