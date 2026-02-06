import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { simulateCode } from './simulator';
import { cExecutor } from './executor';
import { EmscriptenValidatorService } from './services/emscripten-validator.service';
import { GdbTracer } from './gdb';
import { prisma } from '../../../config/database';
import { config } from '../../../config';
import { logger } from '../../../utils/logger';

// Feature flag: GDB 기반 트레이서 사용 여부
const USE_GDB_TRACER = process.env.USE_GDB_TRACER === 'true';

// Emscripten 검증 서비스 인스턴스
const emscriptenValidator = new EmscriptenValidatorService();

// GDB 트레이서 인스턴스 (feature flag가 켜진 경우에만)
const gdbTracer = USE_GDB_TRACER ? new GdbTracer() : null;

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
// Fastify Plugin
// =============================================

export const cSimulatorRoutes: FastifyPluginAsync = async (fastify) => {
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
   *         description: 코드 필수 또는 컴파일 에러
   */
  fastify.post('/trace', async (request, reply) => {
    const { code, stdin = '' } = request.body as { code?: string; stdin?: string };

    if (!code || typeof code !== 'string') {
      return reply.status(400).send({ error: 'Code is required' });
    }

    try {
      // ── GDB 기반 트레이서 (feature flag) ──
      if (gdbTracer) {
        logger.info('Using GDB-based tracer');
        const result = await gdbTracer.trace(code, stdin);
        return result;
      }

      // ── 기존 regex 기반 시뮬레이터 (fallback) ──
      // 1️⃣ Emscripten 검증 단계
      const validation = await emscriptenValidator.validate(code);

      if (!validation.isValid) {
        return reply.status(400).send({
          success: false,
          error: 'compilation_error',
          message: '컴파일 에러가 발생했습니다.',
          details: validation.errors,
        });
      }

      // 경고가 있으면 로그 (에러는 아님)
      if (validation.warnings && validation.warnings.length > 0) {
        logger.info('Compilation warnings:', validation.warnings);
      }

      // 2️⃣ 인터프리터 실행 (기존 그대로)
      const result = simulateCode(code, stdin);

      // 3️⃣ 경고 포함해서 응답
      return {
        ...result,
        warnings: validation.warnings,
      };
    } catch (error: unknown) {
      logger.error('Simulation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

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
  fastify.post('/simulate', async (request, reply) => {
    // Inline Zod validation
    const parseResult = runCodeSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: 'validation_error',
        message: parseResult.error.issues[0]?.message || '유효하지 않은 요청입니다',
        details: parseResult.error.issues,
      });
    }

    try {
      const { code, stdin = '', timeout = config.execution.defaultTimeout } = parseResult.data;
      const timeoutSec = Math.min(Math.max(1, timeout ?? config.execution.defaultTimeout), config.execution.maxTimeout);
      const result = await cExecutor.run(code, stdin, timeoutSec);

      return {
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
      };
    } catch (error: unknown) {
      logger.error('C run error:', error);
      return reply.status(500).send({
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
  fastify.post('/judge', { preHandler: [fastify.optionalAuth] }, async (request, reply) => {
    // Inline Zod validation
    const parseResult = judgeCodeSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: 'validation_error',
        message: parseResult.error.issues[0]?.message || '유효하지 않은 요청입니다',
        details: parseResult.error.issues,
      });
    }

    try {
      const { code, problemId, testCases } = parseResult.data;

      let cases = testCases;

      if (!cases && problemId) {
        const problem = await prisma.problem.findUnique({
          where: { id: problemId },
          select: { testCases: true },
        });

        if (!problem) {
          return reply.status(404).send({
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
        return reply.status(400).send({
          success: false,
          error: 'validation_error',
          message: '테스트케이스가 필요합니다',
        });
      }

      const result = await cExecutor.judge(code, cases, config.execution.judgeTimeout);

      // 로그인한 사용자면 제출 기록 저장 (OAuthAccount로 조회)
      if (request.user && problemId) {
        try {
          const oauthAccount = await prisma.oAuthAccount.findUnique({
            where: {
              provider_providerId: {
                provider: request.user.provider,
                providerId: request.user.uid,
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

      return {
        success: result.success,
        data: {
          verdict: result.verdict,
          passed: result.passed,
          total: result.total,
          execution_time_ms: result.executionTimeMs,
          details: result.details,
        },
      };
    } catch (error: unknown) {
      logger.error('Judge error:', error);
      return reply.status(500).send({
        success: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
