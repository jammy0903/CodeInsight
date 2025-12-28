import { Router } from 'express';
import { prisma } from '../../config/database';

export const problemRoutes = Router();

/**
 * @swagger
 * /api/problems:
 *   get:
 *     tags: [Problems]
 *     summary: 문제 목록 조회
 *     description: 전체 문제 목록을 번호 오름차순으로 반환
 *     responses:
 *       200:
 *         description: 문제 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Problem'
 *       500:
 *         description: 서버 에러
 */
problemRoutes.get('/', async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { number: 'asc' }
    });
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

/**
 * @swagger
 * /api/problems/{id}:
 *   get:
 *     tags: [Problems]
 *     summary: 문제 상세 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 문제 ID
 *     responses:
 *       200:
 *         description: 문제 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Problem'
 *       404:
 *         description: 문제를 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
problemRoutes.get('/:id', async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { id: req.params.id }
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});
