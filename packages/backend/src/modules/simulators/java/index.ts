import { Router } from 'express';
import { javaSimulatorRoutes } from './routes';
// You might export the service here if it's used directly in other modules
// export { JavaSimulationService } from './java-simulation.service';

const router = Router();

router.use('/java', javaSimulatorRoutes);

export default router;
