import { Router } from 'express';
import { prisma } from '../../config/database';
import { requireAuth, requireDbUser, requireAdmin } from '../../middleware';

export const userRoutes = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: 전체 사용자 목록 (Admin용)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 목록
 *       403:
 *         description: Admin 권한 필요
 */
userRoutes.get('/', requireDbUser, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            submissions: true,
            drafts: true
          }
        },
        submissions: {
          where: { verdict: 'accepted' },
          select: { problemId: true },
          distinct: ['problemId']
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      totalSubmissions: user._count.submissions,
      solvedCount: user.submissions.length,
      draftsCount: user._count.drafts
    }));

    res.json(result);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [Users]
 *     summary: 사용자 등록 또는 조회
 *     description: Firebase 토큰으로 인증 후 사용자 등록/조회
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: 사용자 정보
 */
userRoutes.post('/register', requireAuth, async (req, res) => {
  try {
    const { uid, email } = req.user!;
    const { name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email not found in token' });
    }

    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: { email, name: name || email.split('@')[0] },
      create: {
        firebaseUid: uid,
        email,
        name: name || email.split('@')[0]
      }
    });

    res.json(user);
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: 현재 로그인한 사용자 정보
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보
 *       404:
 *         description: 사용자 없음
 */
userRoutes.get('/me', requireDbUser, async (req, res) => {
  // requireDbUser가 이미 사용자 조회함
  res.json(req.user!.dbUser);
});

/**
 * @swagger
 * /api/users/me/role:
 *   get:
 *     tags: [Users]
 *     summary: 현재 사용자 role 조회
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role 정보
 */
userRoutes.get('/me/role', requireDbUser, async (req, res) => {
  const { role } = req.user!.dbUser!;
  res.json({ role, isAdmin: role === 'admin' });
});
