import { Router } from 'express';
import { simulateCode } from './simulator';

export const memoryRoutes = Router();

/**
 * @swagger
 * /api/memory/trace:
 *   post:
 *     tags: [Memory]
 *     summary: 메모리 시뮬레이션 트레이스
 *     description: C 코드의 메모리 동작을 시뮬레이션하여 스택/힙 상태 반환
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MemoryTraceRequest'
 *     responses:
 *       200:
 *         description: 메모리 트레이스 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       step:
 *                         type: integer
 *                       action:
 *                         type: string
 *                       stack:
 *                         type: array
 *                       heap:
 *                         type: array
 *       400:
 *         description: 코드 필수
 */
memoryRoutes.post('/trace', (req, res) => {
  const { code, stdin = '' } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  const result = simulateCode(code, stdin);
  res.json(result);
});
