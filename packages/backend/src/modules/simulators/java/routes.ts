import { FastifyPluginAsync } from 'fastify';
import { JavaSimulationService } from './java-simulation.service';

export const javaSimulatorRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/simulate', async (request, reply) => {
    const { code, sourceCode } = request.body as { code?: string; sourceCode?: string };
    const finalCode = code || sourceCode;

    if (!finalCode) {
      return reply.status(400).send({ message: 'code is required.' });
    }

    // The service is now stateless, so we can create a new instance each time.
    const simulationService = new JavaSimulationService();
    const result = await simulationService.simulate(finalCode);

    if (result.success) {
      return result;
    } else {
      // If the simulation failed (e.g., compile error, runtime error), return a 400 or 500.
      // Using 400 for user-code-related errors.
      return reply.status(400).send(result);
    }
  });
};
