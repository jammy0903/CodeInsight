/**
 * Java Simulator API Routes
 */

import { Router, Request, Response } from 'express';
import { createSimulator } from './simulator';

const router = Router();

/**
 * POST /api/v1/simulators/java
 * Java 코드 시뮬레이션
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Code is required and must be a string'
      });
    }

    // 시뮬레이터 생성 및 실행
    const simulator = createSimulator();
    const result = await simulator.simulate(code);

    return res.json(result);

  } catch (error: any) {
    console.error('Java simulation error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/simulators/java/health
 * 헬스 체크
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    simulator: 'java',
    version: '1.0.0'
  });
});

export default router;
