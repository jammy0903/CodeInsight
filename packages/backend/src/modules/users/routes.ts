import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { requireAuth, requireDbUser } from '../../middleware';
import { requireAdmin } from '../../middleware/adminAuth';
import { logger } from '../../utils/logger';

export const userRoutes = Router();

// =============================================
// Zod 스키마 정의
// =============================================

const NICKNAME_REGEX = /^[a-zA-Z0-9가-힣_]{2,20}$/;
const RESERVED_NICKNAMES = ['admin', 'system', 'bot', 'root', 'moderator', 'anonymous'];

/**
 * 닉네임 스키마
 */
const nicknameSchema = z
  .string()
  .min(1, '닉네임을 입력해주세요.')
  .min(2, '닉네임은 2~20자여야 합니다.')
  .max(20, '닉네임은 2~20자여야 합니다.')
  .regex(NICKNAME_REGEX, '닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.')
  .refine(
    (val) => !RESERVED_NICKNAMES.includes(val.trim().toLowerCase()),
    { message: '사용할 수 없는 닉네임입니다.' }
  );

/**
 * /register 엔드포인트 스키마
 */
const registerSchema = z.object({
  nickname: nicknameSchema,
});

// =============================================
// 검증 미들웨어
// =============================================

/**
 * Zod 스키마로 request body 검증하는 범용 미들웨어
 */
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues[0]?.message || '유효하지 않은 요청입니다',
        details: result.error.issues,
      });
    }

    req.body = result.data;
    next();
  };
}

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
userRoutes.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        oauthAccounts: {
          select: {
            provider: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            drafts: true,
          },
        },
        submissions: {
          where: { verdict: 'accepted' },
          select: { problemId: true },
          distinct: ['problemId'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = users.map((user: any) => ({
      nickname: user.nickname,
      role: user.role,
      createdAt: user.createdAt,
      oauthAccounts: user.oauthAccounts,
      totalSubmissions: user._count.submissions,
      solvedCount: user.submissions.length,
      draftsCount: user._count.drafts,
    }));

    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/users/check-nickname/{nickname}:
 *   get:
 *     tags: [Users]
 *     summary: 닉네임 중복 체크
 *     parameters:
 *       - in: path
 *         name: nickname
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 사용 가능 여부
 */
userRoutes.get('/check-nickname/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;

    // Zod로 유효성 검사
    const result = nicknameSchema.safeParse(nickname);
    if (!result.success) {
      return res.json({
        available: false,
        error: result.error.issues[0]?.message || '유효하지 않은 닉네임입니다.',
      });
    }

    // 중복 체크
    const existing = await prisma.user.findUnique({
      where: { nickname: nickname.toLowerCase() },
    });

    res.json({
      available: !existing,
      error: existing ? '이미 사용 중인 닉네임입니다.' : undefined,
    });
  } catch (error) {
    logger.error('Nickname check error:', error);
    res.status(500).json({ error: 'Failed to check nickname' });
  }
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [Users]
 *     summary: 신규 사용자 등록 (닉네임 + OAuth)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: 사용자 닉네임 (2~20자)
 *     responses:
 *       201:
 *         description: 사용자 생성됨
 *       400:
 *         description: 유효하지 않은 닉네임
 *       409:
 *         description: 닉네임 또는 OAuth 계정 중복
 */
userRoutes.post('/register', requireAuth, validate(registerSchema), async (req, res) => {
  try {
    const { uid, provider } = req.user!;
    const { nickname } = req.body; // 이미 Zod로 검증됨

    const normalizedNickname = nickname.trim().toLowerCase();

    // 이미 등록된 OAuth 계정인지 확인
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: uid,
        },
      },
    });

    if (existingOAuth) {
      return res.status(409).json({
        error: 'Already registered',
        code: 'OAUTH_ALREADY_LINKED',
        message: '이미 등록된 계정입니다.',
      });
    }

    // 닉네임 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { nickname: normalizedNickname },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Nickname taken',
        code: 'NICKNAME_TAKEN',
        message: '이미 사용 중인 닉네임입니다.',
      });
    }

    // User + OAuthAccount 생성 (트랜잭션)
    const user = await prisma.user.create({
      data: {
        nickname: normalizedNickname,
        oauthAccounts: {
          create: {
            provider,
            providerId: uid,
          },
        },
      },
      include: {
        oauthAccounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    res.status(201).json({
      nickname: user.nickname,
      role: user.role,
      createdAt: user.createdAt,
      oauthAccounts: user.oauthAccounts,
    });
  } catch (error) {
    logger.error('User registration error:', error);
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
 *         description: 사용자 없음 (닉네임 등록 필요)
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
  res.json({ role });
});

/**
 * @swagger
 * /api/users/link-oauth:
 *   post:
 *     tags: [Users]
 *     summary: 기존 계정에 OAuth 연동 추가
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth 계정 연동됨
 *       409:
 *         description: 이미 연동된 OAuth 계정
 */
userRoutes.post('/link-oauth', requireDbUser, async (req, res) => {
  try {
    const { uid, provider, dbUser } = req.user!;

    // 이미 연동된 OAuth 계정인지 확인
    const existing = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId: uid,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'OAuth account already linked',
        code: 'OAUTH_ALREADY_LINKED',
      });
    }

    // OAuth 계정 추가
    await prisma.oAuthAccount.create({
      data: {
        userId: dbUser!.id,
        provider,
        providerId: uid,
      },
    });

    // 업데이트된 사용자 정보 반환
    const user = await prisma.user.findUnique({
      where: { id: dbUser!.id },
      include: {
        oauthAccounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    res.json({
      nickname: user!.nickname,
      role: user!.role,
      oauthAccounts: user!.oauthAccounts,
    });
  } catch (error) {
    logger.error('OAuth link error:', error);
    res.status(500).json({ error: 'Failed to link OAuth account' });
  }
});

/**
 * @swagger
 * /api/users/me/nickname:
 *   patch:
 *     tags: [Users]
 *     summary: 닉네임 변경
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: 새 닉네임 (2~20자)
 *     responses:
 *       200:
 *         description: 닉네임 변경 성공
 *       400:
 *         description: 유효하지 않은 닉네임
 *       409:
 *         description: 이미 사용 중인 닉네임
 */
userRoutes.patch('/me/nickname', requireDbUser, validate(registerSchema), async (req, res) => {
  try {
    const { dbUser } = req.user!;
    const { nickname } = req.body;

    const normalizedNickname = nickname.trim().toLowerCase();

    // 현재 닉네임과 같으면 그냥 성공 반환
    if (dbUser!.nickname === normalizedNickname) {
      return res.json({
        nickname: dbUser!.nickname,
        role: dbUser!.role,
        oauthAccounts: dbUser!.oauthAccounts,
      });
    }

    // 닉네임 업데이트 (DB unique constraint가 race condition 방지)
    const updatedUser = await prisma.user.update({
      where: { id: dbUser!.id },
      data: { nickname: normalizedNickname },
      include: {
        oauthAccounts: {
          select: {
            provider: true,
            email: true,
          },
        },
      },
    });

    res.json({
      id: updatedUser.id,
      nickname: updatedUser.nickname,
      role: updatedUser.role,
      oauthAccounts: updatedUser.oauthAccounts,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error: any) {
    // Prisma P2002 = Unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Nickname taken',
        code: 'NICKNAME_TAKEN',
        message: '이미 사용 중인 닉네임입니다.',
      });
    }

    logger.error('Nickname update error:', error);
    res.status(500).json({ error: 'Failed to update nickname' });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     tags: [Users]
 *     summary: 계정 탈퇴 (회원삭제)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 계정이 성공적으로 삭제됨
 *       401:
 *         description: 인증 안 됨
 *       500:
 *         description: 서버 오류
 */
userRoutes.delete('/me', requireDbUser, async (req, res) => {
  try {
    const { dbUser } = req.user!;

    // 사용자 계정 삭제 (트랜잭션으로 관련 데이터도 함께 삭제)
    // Prisma의 cascade delete 규칙에 따라 자동으로 정리됨
    await prisma.user.delete({
      where: { id: dbUser!.id },
    });

    logger.info(`User account deleted: ${dbUser!.id}`);
    res.json({ message: '계정이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});
