import { FastifyPluginAsync } from 'fastify';
import { CppSimulationService } from './cpp-simulation.service';

export const cppSimulatorRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/simulate', async (request, reply) => {
    const { code, sourceCode } = request.body as { code?: string; sourceCode?: string };
    const finalCode = code || sourceCode;

    if (!finalCode) {
      return reply.status(400).send({ message: 'code is required.' });
    }

    const simulationService = new CppSimulationService();
    const result = await simulationService.simulate(finalCode);

    if (result.success) {
      return result;
    } else {
      return reply.status(400).send(result);
    }
  });
};
