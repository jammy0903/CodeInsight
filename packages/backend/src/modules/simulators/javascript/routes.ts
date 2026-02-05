/**
 * JavaScript Simulator Routes
 *
 * POST /api/v1/simulators/javascript/simulate - Debugger-based simulation
 */

import { FastifyPluginAsync } from 'fastify';
import { JavaScriptSimulationService } from './javascript-simulation.service';

export const javascriptSimulatorRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/v1/simulators/javascript/simulate
   * JavaScript 코드 시뮬레이션 (debugger 기반)
   */
  fastify.post('/simulate', async (request, reply) => {
    const { code } = request.body as { code?: string };

    if (!code || typeof code !== 'string') {
      return reply.status(400).send({
        success: false,
        error: 'code is required',
      });
    }

    const service = new JavaScriptSimulationService();
    const result = await service.simulate(code);
    return result;
  });
};

export default javascriptSimulatorRoutes;
