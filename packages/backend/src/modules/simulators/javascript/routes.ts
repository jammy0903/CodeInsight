/**
 * JavaScript Simulator Routes
 *
 * POST /api/v1/simulators/javascript/simulate - Debugger-based simulation
 */

import { FastifyPluginAsync } from 'fastify';
import {
  JavaScriptSimulationService,
  SimulationErrorCode,
} from './javascript-simulation.service';

export const javascriptSimulatorRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/v1/simulators/javascript/simulate
   * JavaScript 코드 시뮬레이션 (debugger 기반)
   */
  fastify.post('/simulate', async (request, reply) => {
    const { code } = request.body as { code?: string };
    const abortController = new AbortController();

    if (!code || typeof code !== 'string') {
      return reply.status(400).send({
        success: false,
        engine: 'legacy',
        steps: [],
        meta: {
          durationMs: 0,
          stepCount: 0,
        },
        error: {
          code: SimulationErrorCode.INVALID_REQUEST,
          message: 'code is required',
        },
      });
    }

    const onAbort = () => abortController.abort();
    const onClose = () => {
      if (request.raw.aborted) {
        onAbort();
      }
    };
    request.raw.once('aborted', onAbort);
    request.raw.once('close', onClose);

    const service = new JavaScriptSimulationService();
    try {
      const result = await service.simulate(code, { signal: abortController.signal });
      return result;
    } finally {
      request.raw.removeListener('aborted', onAbort);
      request.raw.removeListener('close', onClose);
    }
  });
};

export default javascriptSimulatorRoutes;
