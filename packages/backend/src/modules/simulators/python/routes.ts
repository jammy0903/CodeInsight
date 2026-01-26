/**
 * Python Simulator Routes
 *
 * POST /api/v1/simulators/python/simulate - Debugger-based simulation
 */

import { Router } from 'express';
import { PythonSimulationService } from './python-simulation.service';

const router = Router();

/**
 * POST /api/v1/simulators/python/simulate
 * Python 코드 시뮬레이션 (debugger 기반)
 */
router.post('/simulate', async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'code is required',
    });
  }

  const service = new PythonSimulationService();
  const result = await service.simulate(code);
  return res.json(result);
});

export default router;
