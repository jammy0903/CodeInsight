import { Router, Request, Response, NextFunction } from 'express';
import { JavaSimulationService } from './java-simulation.service';

const router = Router();

router.post('/simulate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code, sourceCode } = req.body;
        const finalCode = code || sourceCode;

        if (!finalCode) {
            return res.status(400).json({ message: 'code is required.' });
        }

        // The service is now stateless, so we can create a new instance each time.
        const simulationService = new JavaSimulationService();
        const result = await simulationService.simulate(finalCode);

        if (result.success) {
            res.json(result);
        } else {
            // If the simulation failed (e.g., compile error, runtime error), return a 400 or 500.
            // Using 400 for user-code-related errors.
            res.status(400).json(result);
        }

    } catch (error: any) {
        next(error); // Pass any unexpected errors to the global error handler
    }
});


export { router as javaSimulatorRoutes };
