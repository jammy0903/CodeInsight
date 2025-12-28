import { Router, Request, Response, NextFunction } from 'express';
import { runCCode, judgeCode } from './executor';
import { prisma } from '../../config/database';
import { config } from '../../config';

export const cRoutes = Router();

/**
 * 코드 필드 검증 미들웨어
 */
function validateCode(req: Request, res: Response, next: NextFunction) {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: 'code 필드가 필요합니다'
    });
  }

  if (code.length > config.execution.maxCodeLength) {
    return res.status(400).json({
      success: false,
      error: 'validation_error',
      message: `코드가 너무 깁니다 (최대 ${config.execution.maxCodeLength}자)`
    });
  }

  next();
}

/**
 * @swagger
 * /api/c/run:
 *   post:
 *     tags: [C Runner]
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
 *               $ref: '#/components/schemas/RunResponse'
 *       400:
 *         description: 유효성 검사 실패
 *       500:
 *         description: 내부 서버 에러
 */
cRoutes.post('/run', validateCode, async (req, res) => {
  try {
    const { code, stdin = '', timeout = config.execution.defaultTimeout } = req.body;
    const timeoutSec = Math.min(Math.max(1, timeout), config.execution.maxTimeout);
    const result = await runCCode(code, stdin, timeoutSec);

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
    console.error('C run error:', error);
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
 *     tags: [C Runner]
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
 *               $ref: '#/components/schemas/JudgeResponse'
 *       400:
 *         description: 테스트케이스 없음
 *       404:
 *         description: 문제를 찾을 수 없음
 *       500:
 *         description: 내부 서버 에러
 */
cRoutes.post('/judge', validateCode, async (req, res) => {
  try {
    const { code, problemId, firebaseUid, testCases } = req.body;

    let cases = testCases;

    if (!cases && problemId) {
      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        select: { testCases: true }
      });

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: 'not_found',
          message: '문제를 찾을 수 없습니다'
        });
      }

      try {
        cases = JSON.parse(problem.testCases) as Array<{ input: string; output: string }>;
      } catch {
        cases = [];
      }
    }

    if (!cases || !Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: '테스트케이스가 필요합니다'
      });
    }

    const result = await judgeCode(code, cases, config.execution.judgeTimeout);

    if (firebaseUid && problemId) {
      try {
        const user = await prisma.user.findUnique({
          where: { firebaseUid }
        });

        if (user) {
          await prisma.submission.create({
            data: {
              userId: user.id,
              problemId,
              code,
              verdict: result.verdict,
              executionTime: result.executionTimeMs
            }
          });
        }
      } catch (dbError) {
        console.error('Failed to save submission:', dbError);
      }
    }

    res.json({
      success: result.success,
      data: {
        verdict: result.verdict,
        passed: result.passed,
        total: result.total,
        execution_time_ms: result.executionTimeMs,
        details: result.details
      }
    });
  } catch (error: unknown) {
    console.error('Judge error:', error);
    res.status(500).json({
      success: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
