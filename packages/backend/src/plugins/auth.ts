/**
 * Fastify 인증 플러그인
 *
 * Firebase ID 토큰 검증 및 DB 사용자 조회
 *
 * WHY: requireAuth vs requireDbUser 분리
 *      - requireAuth: 토큰만 검증 (DB 조회 없음, 빠름)
 *      - requireDbUser: 토큰 + DB 사용자 조회 (느리지만 권한 확인 가능)
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { getFirebaseAuth } from '../config/firebase';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { env } from '../config/env';

// OAuth Provider 타입
type OAuthProvider = 'google' | 'github' | 'kakao';

// 사용자 타입
export interface AuthUser {
  uid: string;           // Firebase UID (= providerId)
  email?: string;        // Firebase에서 받은 이메일
  provider: OAuthProvider;
  dbUser?: {
    id: string;          // User UUID (PK)
    nickname: string;
    role: string;
    oauthAccounts: {
      provider: string;
    }[];
  };
}

// Admin 사용자 타입
export interface AdminUser {
  uid: string;
  displayName?: string;
}

// Fastify 타입 확장
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
    adminUser?: AdminUser;
  }
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireDbUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalDbUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Firebase sign_in_provider를 OAuthProvider로 변환
 */
function getProviderFromFirebase(signInProvider?: string): OAuthProvider {
  switch (signInProvider) {
    case 'google.com':
      return 'google';
    case 'github.com':
      return 'github';
    case 'oidc.kakao':
      return 'kakao';
    default:
      return 'google'; // 기본값
  }
}

/**
 * 토큰 추출 헬퍼
 */
function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // "Bearer " 제거
}

/**
 * Firebase 토큰 검증 및 req.user 설정
 */
async function verifyTokenAndSetUser(request: FastifyRequest): Promise<boolean> {
  const token = extractToken(request);
  if (!token) {
    return false;
  }

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    const provider = getProviderFromFirebase(decodedToken.firebase?.sign_in_provider);

    request.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider,
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * DB에서 사용자 조회 및 req.user.dbUser 설정
 */
async function lookupDbUser(request: FastifyRequest): Promise<boolean> {
  if (!request.user) {
    return false;
  }

  try {
    const oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: request.user.provider,
          providerId: request.user.uid,
        },
      },
      include: {
        user: {
          include: {
            oauthAccounts: {
              select: {
                provider: true,
              },
            },
          },
        },
      },
    });

    if (!oauthAccount) {
      return false;
    }

    request.user.dbUser = {
      id: oauthAccount.user.id,
      nickname: oauthAccount.user.nickname,
      role: oauthAccount.user.role,
      oauthAccounts: oauthAccount.user.oauthAccounts,
    };
    return true;
  } catch (error) {
    logger.error('Auth: DB user lookup failed', { error });
    return false;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * Firebase 토큰 검증 (필수)
   * - 토큰 검증 후 request.user.uid, provider 설정
   * - DB 사용자 조회는 하지 않음
   */
  fastify.decorate('requireAuth', async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7);

    try {
      const decodedToken = await getFirebaseAuth().verifyIdToken(token);
      const provider = getProviderFromFirebase(decodedToken.firebase?.sign_in_provider);

      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        provider,
      };
    } catch (error: any) {
      const isExpired = error?.code === 'auth/id-token-expired' || error?.errorInfo?.code === 'auth/id-token-expired';

      if (isExpired) {
        logger.info('Auth: Session expired (token refresh needed)');
        return reply.status(401).send({
          error: 'Session expired',
          message: 'Please refresh the page to continue',
          code: 'TOKEN_EXPIRED'
        });
      } else {
        logger.error('Auth: Token verification failed', { error });
        return reply.status(401).send({ error: 'Invalid token' });
      }
    }
  });

  /**
   * Firebase 토큰 검증 + DB 사용자 조회 (필수)
   * - 토큰 검증 후 DB에서 User 조회
   * - DB에 사용자가 없으면 404 반환
   */
  fastify.decorate('requireDbUser', async function (request: FastifyRequest, reply: FastifyReply) {
    // 1. 토큰 검증
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7);

    try {
      const decodedToken = await getFirebaseAuth().verifyIdToken(token);
      const provider = getProviderFromFirebase(decodedToken.firebase?.sign_in_provider);

      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        provider,
      };
    } catch (error: any) {
      const isExpired = error?.code === 'auth/id-token-expired' || error?.errorInfo?.code === 'auth/id-token-expired';

      if (isExpired) {
        logger.info('Auth: Session expired (token refresh needed)');
        return reply.status(401).send({
          error: 'Session expired',
          message: 'Please refresh the page to continue',
          code: 'TOKEN_EXPIRED'
        });
      } else {
        logger.error('Auth: Token verification failed', { error });
        return reply.status(401).send({ error: 'Invalid token' });
      }
    }

    // 2. DB에서 User 조회
    try {
      const oauthAccount = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerId: {
            provider: request.user!.provider,
            providerId: request.user!.uid,
          },
        },
        include: {
          user: {
            include: {
              oauthAccounts: {
                select: {
                  provider: true,
                },
              },
            },
          },
        },
      });

      if (!oauthAccount) {
        return reply.status(404).send({
          error: 'User not found',
          code: 'USER_NOT_REGISTERED',
          message: 'Please register with a nickname first.',
        });
      }

      request.user!.dbUser = {
        id: oauthAccount.user.id,
        nickname: oauthAccount.user.nickname,
        role: oauthAccount.user.role,
        oauthAccounts: oauthAccount.user.oauthAccounts,
      };
    } catch (error) {
      logger.error('Auth: DB user lookup failed', { error });
      return reply.status(500).send({ error: 'Failed to authenticate user' });
    }
  });

  /**
   * 선택적 인증
   * - 토큰이 있으면 검증, 없으면 통과
   */
  fastify.decorate('optionalAuth', async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return; // 토큰 없으면 통과
    }

    const token = authHeader.slice(7);

    try {
      const decodedToken = await getFirebaseAuth().verifyIdToken(token);
      const provider = getProviderFromFirebase(decodedToken.firebase?.sign_in_provider);

      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        provider,
      };
    } catch {
      // 토큰 검증 실패해도 통과 (선택적 인증)
    }
  });

  /**
   * 선택적 인증 + DB 사용자 조회
   * - 토큰이 있으면 검증 + DB 조회, 없으면 통과
   */
  fastify.decorate('optionalDbUser', async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return; // 토큰 없으면 통과
    }

    const token = authHeader.slice(7);

    try {
      const decodedToken = await getFirebaseAuth().verifyIdToken(token);
      const provider = getProviderFromFirebase(decodedToken.firebase?.sign_in_provider);

      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        provider,
      };

      // DB에서 User 조회 (선택적이므로 없어도 통과)
      const oauthAccount = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerId: {
            provider: request.user.provider,
            providerId: request.user.uid,
          },
        },
        include: {
          user: {
            include: {
              oauthAccounts: {
                select: {
                  provider: true,
                },
              },
            },
          },
        },
      });

      if (oauthAccount) {
        request.user.dbUser = {
          id: oauthAccount.user.id,
          nickname: oauthAccount.user.nickname,
          role: oauthAccount.user.role,
          oauthAccounts: oauthAccount.user.oauthAccounts,
        };
      }
    } catch {
      // 토큰 검증 실패해도 통과 (선택적 인증)
    }
  });

  /**
   * Admin 권한 확인 (필수)
   * - Firebase 토큰 검증 + Admin UID 확인
   * - ADMIN_FIREBASE_UID 환경변수와 일치해야 함
   */
  fastify.decorate('requireAdmin', async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.slice(7);

    try {
      const decodedToken = await getFirebaseAuth().verifyIdToken(token);

      // Admin UID 확인
      if (!env.ADMIN_FIREBASE_UID || decodedToken.uid !== env.ADMIN_FIREBASE_UID) {
        return reply.status(403).send({
          error: 'Forbidden: Admin access only',
          message: '관리자 권한이 필요합니다.',
        });
      }

      // Admin 정보 저장
      request.adminUser = {
        uid: decodedToken.uid,
        displayName: decodedToken.name,
      };
    } catch (error) {
      logger.error('Admin auth error:', error);
      return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
  });
};

export default fp(authPlugin, {
  name: 'auth',
  fastify: '5.x',
});
