/**
 * JavaScript Simulator Routes
 *
 * POST /api/v1/simulators/javascript/simulate - Legacy handler-based simulation
 * POST /api/v1/simulators/javascript/simulate/debugger - New debugger-based simulation
 */

import { Router } from 'express';
import * as controller from './controller';
import { JavaScriptSimulationService } from './javascript-simulation.service';

const router = Router();

// Use environment variable to control default behavior
const USE_DEBUGGER_BY_DEFAULT =
  process.env.JAVASCRIPT_USE_DEBUGGER === 'true';

/**
 * POST /api/v1/simulators/javascript/simulate
 * JavaScript 코드 시뮬레이션 (환경변수로 방식 선택 가능)
 */
router.post('/simulate', async (req, res, next) => {
  const { code, useDebugger } = req.body;

  // Use debugger if explicitly requested or if default is set
  const shouldUseDebugger = useDebugger ?? USE_DEBUGGER_BY_DEFAULT;

  if (shouldUseDebugger) {
    try {
      if (typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'code is required',
        });
      }

      const service = new JavaScriptSimulationService();
      const result = await service.simulate(code);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  } else {
    // Legacy handler-based simulation
    return controller.execute(req, res, next);
  }
});

/**
 * POST /api/v1/simulators/javascript/simulate/debugger
 * JavaScript 코드 시뮬레이션 (vm 모듈 기반 디버거)
 */
router.post('/simulate/debugger', async (req, res, next) => {
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
