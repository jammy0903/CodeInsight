/**
 * Standalone Quiz Routes
 * 독립형 퀴즈 시스템 API
 *
 * GET    /api/standalone-quizzes/chapters        - 챕터별 통계 조회
 * GET    /api/standalone-quizzes                 - 퀴즈 목록 조회 (필터링)
 * POST   /api/standalone-quizzes/attempt         - 퀴즈 시도 기록
 * GET    /api/standalone-quizzes/weak-concepts   - 취약 개념 분석
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

const attemptSchema = z.object({
  quizId: z.string().min(1),
  userAnswer: z.string().max(500),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0).optional(),
});

// =============================================
// Chapter Statistics Endpoint
// =============================================

/**
 * 챕터별 통계 조회
 * GET /api/standalone-quizzes/chapters
 *
 * Query params:
 * - language: 'c' | 'javascript' | 'java' | 'python' (필수)
 * - quizType: 'ox' | 'multiple-choice' | 'fill-blank' (선택)
 *
 * Response:
 * {
 *   chapters: [
 *     {
 *       chapterId: "c-var",
 *       chapterTitle: "변수와 자료형",
 *       totalQuizzes: 10,
 *       attemptedQuizzes: 5,
 *       correctCount: 4,
 *       wrongCount: 1,
 *       accuracy: 80,
 *       lastAttemptedAt: "2024-01-27T12:00:00.000Z"
 *     }
 *   ]
 * }
 */
router.get('/chapters', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;
    const language = req.query.language as string;
    const quizType = req.query.quizType as string | undefined;

    if (!language) {
      return res.status(400).json({
        error: 'Missing required parameter: language',
      });
    }

    // 1. 해당 언어의 모든 챕터 퀴즈 조회
    const where: any = {
      language,
      isActive: true,
    };
    if (quizType) {
      where.quizType = quizType;
    }

    const quizzes = await prisma.standaloneQuiz.findMany({
      where,
      include: {
        attempts: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // 2. 챕터별로 그룹화하여 통계 계산
    const chapterMap = new Map<string, {
      chapterId: string;
      chapterTitle: string;
      totalQuizzes: number;
      attemptedQuizzes: Set<string>;
      correctCount: number;
      wrongCount: number;
      lastAttemptedAt: Date | null;
    }>();

    quizzes.forEach((quiz) => {
      const key = quiz.chapterId;

      if (!chapterMap.has(key)) {
        chapterMap.set(key, {
          chapterId: quiz.chapterId,
          chapterTitle: quiz.chapterTitle,
          totalQuizzes: 0,
          attemptedQuizzes: new Set(),
          correctCount: 0,
          wrongCount: 0,
          lastAttemptedAt: null,
        });
      }

      const chapter = chapterMap.get(key)!;
      chapter.totalQuizzes++;

      // 시도 기록이 있는 퀴즈인지 확인
      if (quiz.attempts.length > 0) {
        chapter.attemptedQuizzes.add(quiz.id);

        // 가장 최근 시도의 정답 여부
        const lastAttempt = quiz.attempts[0];
        if (lastAttempt.isCorrect) {
          chapter.correctCount++;
        } else {
          chapter.wrongCount++;
        }

        // 가장 최근 시도 시간 업데이트
        if (!chapter.lastAttemptedAt || lastAttempt.createdAt > chapter.lastAttemptedAt) {
          chapter.lastAttemptedAt = lastAttempt.createdAt;
        }
      }
    });

    // 3. 결과 포맷팅
    const chapters = Array.from(chapterMap.values()).map((chapter) => ({
      chapterId: chapter.chapterId,
      chapterTitle: chapter.chapterTitle,
      totalQuizzes: chapter.totalQuizzes,
      attemptedQuizzes: chapter.attemptedQuizzes.size,
      correctCount: chapter.correctCount,
      wrongCount: chapter.wrongCount,
      accuracy: chapter.attemptedQuizzes.size > 0
        ? Math.round((chapter.correctCount / chapter.attemptedQuizzes.size) * 100)
        : 0,
      lastAttemptedAt: chapter.lastAttemptedAt?.toISOString() || null,
    }));

    res.json({ chapters });
  } catch (error) {
    logger.error('Chapter statistics error:', error);
    res.status(500).json({
      error: 'Failed to get chapter statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =============================================
// Quiz List Endpoint
// =============================================

/**
 * 퀴즈 목록 조회
 * GET /api/standalone-quizzes
 *
 * Query params:
 * - language: 'c' | 'javascript' | 'java' | 'python' (필수)
 * - quizType: 'ox' | 'multiple-choice' | 'fill-blank' (선택)
 * - chapterId: 챕터 ID (선택)
 * - difficulty: 'easy' | 'medium' | 'hard' (선택)
 *
 * Response:
 * {
 *   quizzes: [
 *     {
 *       id: "ox-c-var-q1",
 *       language: "c",
 *       quizType: "ox",
 *       chapterId: "c-var",
 *       chapterTitle: "변수와 자료형",
 *       question: "int 자료형은 정수를 저장한다.",
 *       options: null,
 *       answer: "true",
 *       explanation: "int는 integer의 약자로...",
 *       concepts: ["int", "자료형", "정수"],
 *       difficulty: "easy",
 *       orderNum: 1,
 *       lastAttempt: {
 *         isCorrect: true,
 *         attemptNumber: 2,
 *         createdAt: "2024-01-27T12:00:00.000Z"
 *       }
 *     }
 *   ]
 * }
 */
router.get('/', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;
    const language = req.query.language as string;
    const quizType = req.query.quizType as string | undefined;
    const chapterId = req.query.chapterId as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;

    if (!language) {
      return res.status(400).json({
        error: 'Missing required parameter: language',
      });
    }

    // WHERE 조건 구성
    const where: any = {
      language,
      isActive: true,
    };
    if (quizType) where.quizType = quizType;
    if (chapterId) where.chapterId = chapterId;
    if (difficulty) where.difficulty = difficulty;

    // 퀴즈 조회 (사용자의 최근 시도 포함)
    const quizzes = await prisma.standaloneQuiz.findMany({
      where,
      include: {
        attempts: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1, // 가장 최근 시도만
        },
      },
      orderBy: [
        { chapterId: 'asc' },
        { orderNum: 'asc' },
      ],
    });

    // 응답 포맷팅
    const result = quizzes.map((quiz) => ({
      id: quiz.id,
      language: quiz.language,
      quizType: quiz.quizType,
      chapterId: quiz.chapterId,
      chapterTitle: quiz.chapterTitle,
      question: quiz.question,
      options: quiz.options,
      answer: quiz.answer,
      explanation: quiz.explanation,
      concepts: quiz.concepts,
      difficulty: quiz.difficulty,
      orderNum: quiz.orderNum,
      lastAttempt: quiz.attempts[0] ? {
        isCorrect: quiz.attempts[0].isCorrect,
        attemptNumber: quiz.attempts[0].attemptNumber,
        createdAt: quiz.attempts[0].createdAt.toISOString(),
      } : null,
    }));

    res.json({ quizzes: result });
  } catch (error) {
    logger.error('Quiz list error:', error);
    res.status(500).json({
      error: 'Failed to get quiz list',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =============================================
// Quiz Attempt Endpoint
// =============================================

/**
 * 퀴즈 시도 기록
 * POST /api/standalone-quizzes/attempt
 *
 * Body:
 * {
 *   quizId: "ox-c-var-q1",
 *   userAnswer: "true",
 *   isCorrect: true,
 *   timeSpent: 5000  // optional, milliseconds
 * }
 *
 * Response:
 * {
 *   id: "uuid",
 *   attemptNumber: 1,
 *   createdAt: "2024-01-27T12:00:00.000Z"
 * }
 */
router.post('/attempt', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const parsed = attemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { quizId, userAnswer, isCorrect, timeSpent } = parsed.data;

    // 1. 퀴즈가 존재하는지 확인
    const quiz = await prisma.standaloneQuiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found',
      });
    }

    // 2. 이전 시도 횟수 확인
    const previousAttempts = await prisma.standaloneQuizAttempt.count({
      where: {
        userId,
        quizId,
      },
    });

    // 3. 새 시도 기록
    const attempt = await prisma.standaloneQuizAttempt.create({
      data: {
        userId,
        quizId,
        userAnswer,
        isCorrect,
        timeSpent,
        attemptNumber: previousAttempts + 1,
      },
    });

    res.json({
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
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
// Weak Concepts Endpoint
// =============================================

/**
 * 취약 개념 분석
 * GET /api/standalone-quizzes/weak-concepts
 *
 * Query params:
 * - language: 'c' | 'javascript' | 'java' | 'python' (필수)
 * - limit: 결과 개수 (기본: 10)
 *
 * Response:
 * {
 *   weakConcepts: [
 *     {
 *       concept: "포인터",
 *       totalAttempts: 15,
 *       wrongAttempts: 8,
 *       errorRate: 53,
 *       relatedQuizzes: [
 *         {
 *           quizId: "ox-c-ptr-q1",
 *           question: "포인터는 메모리 주소를 저장한다.",
 *           lastAttempt: {
 *             isCorrect: false,
 *             createdAt: "2024-01-27T12:00:00.000Z"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
router.get('/weak-concepts', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;
    const language = req.query.language as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!language) {
      return res.status(400).json({
        error: 'Missing required parameter: language',
      });
    }

    // 1. 사용자의 모든 시도 가져오기 (해당 언어만)
    const attempts = await prisma.standaloneQuizAttempt.findMany({
      where: {
        userId,
        quiz: {
          language,
          isActive: true,
        },
      },
      include: {
        quiz: {
          select: {
            id: true,
            question: true,
            concepts: true,
            chapterId: true,
            chapterTitle: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. 개념별로 통계 집계
    const conceptStats = new Map<string, {
      concept: string;
      totalAttempts: number;
      wrongAttempts: number;
      quizIds: Set<string>;
      recentWrongQuizzes: Array<{
        quizId: string;
        question: string;
        createdAt: Date;
      }>;
    }>();

    attempts.forEach((attempt) => {
      const concepts = attempt.quiz.concepts;

      concepts.forEach((concept) => {
        if (!conceptStats.has(concept)) {
          conceptStats.set(concept, {
            concept,
            totalAttempts: 0,
            wrongAttempts: 0,
            quizIds: new Set(),
            recentWrongQuizzes: [],
          });
        }

        const stats = conceptStats.get(concept)!;
        stats.totalAttempts++;
        stats.quizIds.add(attempt.quizId);

        if (!attempt.isCorrect) {
          stats.wrongAttempts++;

          // 최근 오답 퀴즈 저장 (최대 3개)
          if (stats.recentWrongQuizzes.length < 3) {
            stats.recentWrongQuizzes.push({
              quizId: attempt.quiz.id,
              question: attempt.quiz.question,
              createdAt: attempt.createdAt,
            });
          }
        }
      });
    });

    // 3. 오답률 계산 및 정렬
    const weakConcepts = Array.from(conceptStats.values())
      .filter((stats) => stats.wrongAttempts > 0) // 오답이 있는 개념만
      .map((stats) => ({
        concept: stats.concept,
        totalAttempts: stats.totalAttempts,
        wrongAttempts: stats.wrongAttempts,
        errorRate: Math.round((stats.wrongAttempts / stats.totalAttempts) * 100),
        uniqueQuizzes: stats.quizIds.size,
        relatedQuizzes: stats.recentWrongQuizzes.map((quiz) => ({
          quizId: quiz.quizId,
          question: quiz.question,
          lastAttempt: {
            isCorrect: false,
            createdAt: quiz.createdAt.toISOString(),
          },
        })),
      }))
      .sort((a, b) => {
        // 1순위: 오답률 (높은 순)
        if (b.errorRate !== a.errorRate) {
          return b.errorRate - a.errorRate;
        }
        // 2순위: 오답 횟수 (많은 순)
        return b.wrongAttempts - a.wrongAttempts;
      })
      .slice(0, limit);

    res.json({ weakConcepts });
  } catch (error) {
    logger.error('Weak concepts error:', error);
    res.status(500).json({
      error: 'Failed to analyze weak concepts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const standaloneQuizzesRoutes = router;
