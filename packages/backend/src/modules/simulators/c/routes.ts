import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { simulateCode } from './simulator';
import { cExecutor } from './executor';
import { EmscriptenValidatorService } from './services/emscripten-validator.service';
import { config } from '../../../config';
import { logger } from '../../../utils/logger';

// Emscripten 검증 서비스 인스턴스
const emscriptenValidator = new EmscriptenValidatorService();

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
};
