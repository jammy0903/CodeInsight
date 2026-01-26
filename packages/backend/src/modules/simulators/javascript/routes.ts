/**
 * JavaScript Simulator Routes
 *
 * POST /api/v1/simulators/javascript/simulate - Debugger-based simulation
 */

import { Router } from 'express';
import { JavaScriptSimulationService } from './javascript-simulation.service';

const router = Router();

/**
 * POST /api/v1/simulators/javascript/simulate
 * JavaScript 코드 시뮬레이션 (debugger 기반)
 */
router.post('/simulate', async (req, res, next) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'code is required',
    });
  }

  try {
    const service = new JavaScriptSimulationService();
    const result = await service.simulate(code);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
