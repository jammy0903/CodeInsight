import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { simulateCode } from './simulator';
import { cExecutor } from './executor';
import { prisma } from '../../../config/database';
import { config } from '../../../config';
import { optionalAuth } from '../../../middleware';
import { logger } from '../../../utils/logger';

export const cSimulatorRoutes = Router();

// =============================================
// Zod 스키마 정의 (From original c executor routes)
// =============================================

/**
 * /run 엔드포인트 스키마
 */
const runCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'code 필드가 필요합니다')
    .max(config.execution.maxCodeLength, `코드가 너무 깁니다 (최대 ${config.execution.maxCodeLength}자)`),
  stdin: z.string().optional().default(''),
  timeout: z.number().int().min(1).max(config.execution.maxTimeout).optional(),
});

/**
 * /judge 엔드포인트 스키마
 */
const judgeCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'code 필드가 필요합니다')
    .max(config.execution.maxCodeLength, `코드가 너무 깁니다 (최대 ${config.execution.maxCodeLength}자)`),
  problemId: z.string().uuid().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
      })
    )
    .optional(),
});

// =============================================
// 검증 미들웨어 (From original c executor routes)
// =============================================

/**
 * Zod 스키마로 request body 검증하는 범용 미들웨어
 */
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: result.error.issues[0]?.message || '유효하지 않은 요청입니다',
        details: result.error.issues,
      });
    }

    // 검증된 데이터를 req.body에 덮어쓰기 (타입 안전성)
    req.body = result.data;
    next();
  };
}

// =============================================
// 라우트 핸들러 (From original memory routes)
// =============================================

/**
 * @swagger
 * /api/memory/trace:
 *   post:
 *     tags: [C Simulator]
 *     summary: 메모리 시뮬레이션 트레이스
 *     description: C 코드의 메모리 동작을 시뮬레이션하여 스택/힙 상태 반환
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MemoryTraceRequest'
 *     responses:
 *       200:
 *         description: 메모리 트레이스 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       step:
 *                         type: integer
 *                       action:
 *                         type: string
 *                       stack:
 *                         type: array
 *                       heap:
 *                         type: array
 *       400:
 *         description: 코드 필수
 */
cSimulatorRoutes.post('/trace', (req, res) => {
  const { code, stdin = '' } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  const result = simulateCode(code, stdin);
  res.json(result);
});

// =============================================
// 라우트 핸들러 (From original c executor routes)
// =============================================

/**
 * @swagger
 * /api/c/run:
 *   post:
 *     tags: [C Simulator]
 *     summary: C 코드 컴파일 및 실행
 *     description: Docker 컨테이너에서 C 코드를 컴파일하고 실행
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RunRequest'
 *     responses:
 *       200:
 *         description: 실행 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       step:
 *                         type: integer
 *                       action:
 *                         type: string
 *                       stack:
 *                         type: array
 *                       heap:
 *                         type: array
 *       400:
 *         description: 유효성 검사 실패
 *       500:
 *         description: 내부 서버 에러
 */
cSimulatorRoutes.post('/simulate', validate(runCodeSchema), async (req, res) => {
  try {
    const { code, stdin = '', timeout = config.execution.defaultTimeout } = req.body;
    const timeoutSec = Math.min(Math.max(1, timeout), config.execution.maxTimeout);
    const result = await cExecutor.run(code, stdin, timeoutSec);

    res.json({
      success: result.success,
      data: {
        compiled: result.compiled,
        executed: result.executed,
        stdout: result.stdout,
        stderr: result.stderr,
        exit_code: result.exitCode,
        execution_time_ms: result.executionTimeMs
      },
      error: result.error
    });
  } catch (error: unknown) {
    logger.error('C run error:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/c/judge:
 *   post:
 *     tags: [C Simulator]
 *     summary: 문제 채점 (테스트케이스 기반)
 *     description: 코드를 테스트케이스에 대해 채점하고 결과 반환. 로그인 시 제출 기록 저장
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JudgeRequest'
 *     responses:
 *       200:
 *         description: 채점 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       step:
 *                         type: integer
 *                       action:
 *                         type: string
 *                       stack:
 *                         type: array
 *                       heap:
 *                         type: array
 *       400:
 *         description: 테스트케이스 없음
 *       404:
 *         description: 문제를 찾을 수 없음
 *       500:
 *         description: 내부 서버 에러
 */
cSimulatorRoutes.post('/judge', optionalAuth, validate(judgeCodeSchema), async (req, res) => {
  try {
    const { code, problemId, testCases } = req.body;

    let cases = testCases;

    if (!cases && problemId) {
      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        select: { testCases: true },
      });

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: 'not_found',
          message: '문제를 찾을 수 없습니다',
        });
      }

      try {
        cases = JSON.parse(problem.testCases as string) as Array<{ input: string; output: string }>;
      } catch {
        cases = [];
      }
    }

    if (!cases || !Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: '테스트케이스가 필요합니다',
      });
    }

    const result = await cExecutor.judge(code, cases, config.execution.judgeTimeout);

    // 로그인한 사용자면 제출 기록 저장 (OAuthAccount로 조회)
    if (req.user && problemId) {
      try {
        const oauthAccount = await prisma.oAuthAccount.findUnique({
          where: {
            provider_providerId: {
              provider: req.user.provider,
              providerId: req.user.uid,
            },
          },
          select: { userId: true },
        });

        if (oauthAccount) {
          await prisma.submission.create({
            data: {
              userId: oauthAccount.userId,
              problemId,
              code,
              verdict: result.verdict,
              executionTime: result.executionTimeMs,
            },
          });
        }
      } catch (dbError) {
        logger.error('Failed to save submission:', dbError);
      }
    }

    res.json({
      success: result.success,
      data: {
        verdict: result.verdict,
        passed: result.passed,
        total: result.total,
        execution_time_ms: result.executionTimeMs,
        details: result.details,
      },
    });
  } catch (error: unknown) {
    logger.error('Judge error:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});