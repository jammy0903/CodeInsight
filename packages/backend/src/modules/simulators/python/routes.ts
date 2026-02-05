/**
 * Python Simulator Routes (Fastify)
 *
 * POST /api/v1/simulators/python/simulate - Debugger-based simulation
 */

import { FastifyPluginAsync } from 'fastify';
import { PythonSimulationService } from './python-simulation.service';

const pythonSimulatorRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /simulate
   * Python 코드 시뮬레이션 (debugger 기반)
   */
  fastify.post('/simulate', {
    schema: {
      tags: ['Simulators'],
      summary: 'Python 코드 시뮬레이션',
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', description: 'Python source code' },
        },
      },
    },
  }, async (request, reply) => {
    const { code } = request.body as { code?: string };

    if (!code || typeof code !== 'string') {
      return reply.status(400).send({
        success: false,
        error: 'code is required',
      });
    }

    const service = new PythonSimulationService();
    const result = await service.simulate(code);
    return result;
  });
};

export default pythonSimulatorRoutes;
