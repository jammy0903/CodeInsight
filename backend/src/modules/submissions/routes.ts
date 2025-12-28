import { Router } from 'express';
import { prisma } from '../../config/database';
import { requireDbUser } from '../../middleware';

export const submissionRoutes = Router();

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: 제출 기록 생성
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [problemId, code]
 *             properties:
 *               problemId:
 *                 type: string
 *               code:
 *                 type: string
 *               verdict:
 *                 type: string
 *                 enum: [accepted, wrong_answer, compile_error, runtime_error]
 *               executionTime:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 제출 생성 성공
 *       401:
 *         description: 인증 필요
 */
submissionRoutes.post('/', requireDbUser, async (req, res) => {
  try {
    const { problemId, code, verdict, executionTime } = req.body;
    const userId = req.user!.dbUser!.id;

    if (!problemId || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        verdict: verdict || 'judging',
        executionTime
      }
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

/**
 * @swagger
 * /api/submissions/me:
 *   get:
 *     tags: [Submissions]
 *     summary: 내 제출 기록 조회
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 제출 기록 목록
 */
submissionRoutes.get('/me', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: {
        problem: {
          select: { number: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * @swagger
 * /api/submissions/me/solved:
 *   get:
 *     tags: [Submissions]
 *     summary: 내가 푼 문제 ID 목록
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 문제 ID 목록 (solved, attempted 분리)
 */
submissionRoutes.get('/me/solved', requireDbUser, async (req, res) => {
  try {
    const userId = req.user!.dbUser!.id;

    const solvedSubmissions = await prisma.submission.findMany({
      where: {
        userId,
        verdict: 'accepted'
      },
      select: { problemId: true },
      distinct: ['problemId']
    });

    const allSubmissions = await prisma.submission.findMany({
      where: { userId },
      select: { problemId: true },
      distinct: ['problemId']
    });

    const solvedIds = solvedSubmissions.map(s => s.problemId);
    const attemptedIds = allSubmissions
      .map(s => s.problemId)
      .filter(id => !solvedIds.includes(id));

    res.json({
      solved: solvedIds,
      attempted: attemptedIds
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch solved problems' });
  }
});
