/**
 * Python Simulator Routes
 *
 * POST /api/v1/simulators/python
 */

import { Router } from 'express';
import { simulatePython } from './simulator';

const router = Router();

/**
 * POST /api/v1/simulators/python
 * Python 코드 시뮬레이션
 */
router.post('/simulate', (req, res) => {
  const { code, stdin } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'code is required',
    });
  }

  const result = simulatePython({ code, stdin });

  return res.json(result);
});

export default router;
