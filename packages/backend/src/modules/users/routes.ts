/**
 * Users Routes (Fastify Plugin)
 *
 * GET    /api/users                   - 전체 사용자 목록 (Admin용)
 * GET    /api/users/check-nickname/:nickname - 닉네임 중복 체크
 * POST   /api/users/register          - 신규 사용자 등록
 * GET    /api/users/me                - 현재 로그인한 사용자 정보
 * GET    /api/users/me/role           - 현재 사용자 role 조회
 * POST   /api/users/link-oauth        - OAuth 연동 추가
 * PATCH  /api/users/me/nickname       - 닉네임 변경
 * DELETE /api/users/me                - 계정 탈퇴
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { getFirebaseAuth } from '../../config/firebase';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

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
// Admin 인증 preHandler
// =============================================

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.slice(7);

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);

    // UID 확인 (환경변수에서 Admin UID 가져옴)
    if (!env.ADMIN_FIREBASE_UID || decodedToken.uid !== env.ADMIN_FIREBASE_UID) {
      return reply.status(403).send({
        error: 'Forbidden: Admin access only',
        message: '관리자 권한이 필요합니다.'
      });
    }

    // Admin 정보 저장 (request에 확장)
    (request as any).adminUser = {
      uid: decodedToken.uid,
      displayName: decodedToken.name,
    };
  } catch (error) {
    logger.error('Admin auth error:', error);
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
}

// =============================================
// Fastify Plugin
// =============================================

const userRoutes: FastifyPluginAsync = async (fastify) => {
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
  fastify.get(
    '/',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
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

        return result;
      } catch (error) {
        logger.error('Failed to fetch users:', error);
        return reply.status(500).send({ error: 'Failed to fetch users' });
      }
    }
  );

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
  fastify.get('/check-nickname/:nickname', async (request, reply) => {
    try {
      const { nickname } = request.params as { nickname: string };

      // Zod로 유효성 검사
      const result = nicknameSchema.safeParse(nickname);
      if (!result.success) {
        return {
          available: false,
          error: result.error.issues[0]?.message || '유효하지 않은 닉네임입니다.',
        };
      }

      // 중복 체크
      const existing = await prisma.user.findUnique({
        where: { nickname: nickname.toLowerCase() },
      });

      return {
        available: !existing,
        error: existing ? '이미 사용 중인 닉네임입니다.' : undefined,
      };
    } catch (error) {
      logger.error('Nickname check error:', error);
      return reply.status(500).send({ error: 'Failed to check nickname' });
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
  fastify.post(
    '/register',
    { preHandler: [fastify.requireAuth] },
    async (request, reply) => {
      try {
        const { uid, provider } = request.user!;

        // Zod 검증
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: parsed.error.issues[0]?.message || '유효하지 않은 요청입니다',
            details: parsed.error.issues,
          });
        }

        const { nickname } = parsed.data;
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
          return reply.status(409).send({
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
          return reply.status(409).send({
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

        return reply.status(201).send({
          nickname: user.nickname,
          role: user.role,
          createdAt: user.createdAt,
          oauthAccounts: user.oauthAccounts,
        });
      } catch (error) {
        logger.error('User registration error:', error);
        return reply.status(500).send({ error: 'Failed to register user' });
      }
    }
  );

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
  fastify.get(
    '/me',
    { preHandler: [fastify.requireDbUser] },
    async (request, reply) => {
      // requireDbUser가 이미 사용자 조회함
      return request.user!.dbUser;
    }
  );

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
  fastify.get(
    '/me/role',
    { preHandler: [fastify.requireDbUser] },
    async (request, reply) => {
      const { role } = request.user!.dbUser!;
      return { role };
    }
  );

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
  fastify.post(
    '/link-oauth',
    { preHandler: [fastify.requireDbUser] },
    async (request, reply) => {
      try {
        const { uid, provider, dbUser } = request.user!;

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
          return reply.status(409).send({
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

        return {
          nickname: user!.nickname,
          role: user!.role,
          oauthAccounts: user!.oauthAccounts,
        };
      } catch (error) {
        logger.error('OAuth link error:', error);
        return reply.status(500).send({ error: 'Failed to link OAuth account' });
      }
    }
  );

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
  fastify.patch(
    '/me/nickname',
    { preHandler: [fastify.requireDbUser] },
    async (request, reply) => {
      try {
        const { dbUser } = request.user!;

        // Zod 검증
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: parsed.error.issues[0]?.message || '유효하지 않은 요청입니다',
            details: parsed.error.issues,
          });
        }

        const { nickname } = parsed.data;
        const normalizedNickname = nickname.trim().toLowerCase();

        // 현재 닉네임과 같으면 그냥 성공 반환
        if (dbUser!.nickname === normalizedNickname) {
          return {
            nickname: dbUser!.nickname,
            role: dbUser!.role,
            oauthAccounts: dbUser!.oauthAccounts,
          };
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

        return {
          id: updatedUser.id,
          nickname: updatedUser.nickname,
          role: updatedUser.role,
          oauthAccounts: updatedUser.oauthAccounts,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        };
      } catch (error: any) {
        // Prisma P2002 = Unique constraint violation
        if (error.code === 'P2002') {
          return reply.status(409).send({
            error: 'Nickname taken',
            code: 'NICKNAME_TAKEN',
            message: '이미 사용 중인 닉네임입니다.',
          });
        }

        logger.error('Nickname update error:', error);
        return reply.status(500).send({ error: 'Failed to update nickname' });
      }
    }
  );

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
  fastify.delete(
    '/me',
    { preHandler: [fastify.requireDbUser] },
    async (request, reply) => {
      try {
        const { dbUser } = request.user!;

        // 사용자 계정 삭제 (트랜잭션으로 관련 데이터도 함께 삭제)
        // Prisma의 cascade delete 규칙에 따라 자동으로 정리됨
        await prisma.user.delete({
          where: { id: dbUser!.id },
        });

        logger.info(`User account deleted: ${dbUser!.id}`);
        return { message: '계정이 성공적으로 삭제되었습니다.' };
      } catch (error) {
        logger.error('Account deletion error:', error);
        return reply.status(500).send({ error: 'Failed to delete account' });
      }
    }
  );
};

export { userRoutes };
