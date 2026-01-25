/**
 * Python Simulator Routes
 *
 * POST /api/v1/simulators/python/simulate - Legacy handler-based simulation
 * POST /api/v1/simulators/python/simulate/debugger - New debugger-based simulation
 */

import { Router } from 'express';
import { simulatePython } from './simulator';
import { PythonSimulationService } from './python-simulation.service';

const router = Router();

// Use environment variable to control default behavior
const USE_DEBUGGER_BY_DEFAULT = process.env.PYTHON_USE_DEBUGGER === 'true';

/**
 * POST /api/v1/simulators/python/simulate
 * Python 코드 시뮬레이션 (환경변수로 방식 선택 가능)
 */
router.post('/simulate', async (req, res) => {
  const { code, stdin, useDebugger } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'code is required',
    });
  }

  // Use debugger if explicitly requested or if default is set
  const shouldUseDebugger = useDebugger ?? USE_DEBUGGER_BY_DEFAULT;

  if (shouldUseDebugger) {
    const service = new PythonSimulationService();
    const result = await service.simulate(code);
    return res.json(result);
  }

  // Legacy handler-based simulation
  const result = simulatePython({ code, stdin });
  return res.json(result);
});

/**
 * POST /api/v1/simulators/python/simulate/debugger
 * Python 코드 시뮬레이션 (sys.settrace 기반 디버거)
 */
router.post('/simulate/debugger', async (req, res) => {
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
