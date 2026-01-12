/**
 * Firebase 인증 미들웨어
 *
 * Authorization: Bearer <token> 헤더에서 Firebase ID 토큰 검증
 * 검증 성공 시 req.user에 Firebase 사용자 정보 추가
 *
 * WHY: requireAuth vs requireDbUser 분리
 *      - requireAuth: 토큰만 검증 (DB 조회 없음, 빠름)
 *      - requireDbUser: 토큰 + DB 사용자 조회 (느리지만 권한 확인 가능)
 *      모든 요청이 DB 조회 필요하진 않음.
 * TRADEOFF: 유연성 > 단순성. 미들웨어 2개 관리 필요.
 * REVISIT: 대부분 API가 DB 조회 필요하면 requireDbUser만 남기고 통합.
 */

import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../config/firebase';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { logger } from '../config/logger';

// OAuth Provider 타입
type OAuthProvider = 'google' | 'github' | 'kakao';

// Express Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
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
      };
    }
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
 * Firebase 토큰 검증 미들웨어
 * - 토큰 검증 후 req.user.uid, provider 설정
 * - DB 사용자 조회는 하지 않음 (필요시 requireDbUser 사용)
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // "Bearer " 제거

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    const provider = getProviderFromFirebase(decodedToken.firebase?.sign_in_provider);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider,
    };
    next();
  } catch (error) {
    logger.error('Auth: Token verification failed', { error });
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

/**
 * Firebase 토큰 검증 + DB 사용자 조회 미들웨어
 * - requireAuth를 재사용해서 토큰 검증
 * - DB에서 User 조회 후 req.user.dbUser 설정
 * - DB에 사용자가 없으면 404 반환 (닉네임 등록 필요)
 */
export async function requireDbUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. 토큰 검증 (requireAuth 재사용)
  await requireAuth(req, res, () => {});

  // requireAuth에서 401 반환했으면 여기서 중단
  if (!req.user) {
    return;
  }

  // 2. DB에서 User 조회
  try {
    const oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: req.user.provider,
          providerId: req.user.uid,
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
      // 사용자가 없음 = 닉네임 등록 필요
      res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_REGISTERED',
        message: 'Please register with a nickname first.',
      });
      return;
    }

    // 3. dbUser 정보 추가
    req.user.dbUser = {
      id: oauthAccount.user.id,
      nickname: oauthAccount.user.nickname,
      role: oauthAccount.user.role,
      oauthAccounts: oauthAccount.user.oauthAccounts,
    };

    next();
  } catch (error) {
    logger.error('Auth: DB user lookup failed', { error });
    res.status(500).json({ error: 'Failed to authenticate user' });
    return;
  }
}


/**
 * 선택적 인증 미들웨어
 * - 토큰이 있으면 검증, 없으면 통과
 * - 인증 선택적인 엔드포인트용
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    const provider = getProviderFromFirebase(decodedToken.firebase?.sign_in_provider);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider,
    };
  } catch {
    // 토큰 검증 실패해도 통과 (선택적 인증)
  }

  next();
}

/**
 * 선택적 인증 + DB 사용자 조회 미들웨어
 * - 토큰이 있으면 검증 + DB 조회, 없으면 통과
 * - 로그인 선택적이지만 로그인 시 DB 사용자 정보가 필요한 엔드포인트용
 * WHY: AI 채팅, 조회수 등 비로그인도 되지만 로그인 시 기록 저장
 */
export async function optionalDbUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    const provider = getProviderFromFirebase(decodedToken.firebase?.sign_in_provider);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      provider,
    };

    // DB에서 User 조회 (선택적이므로 없어도 통과)
    const oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: req.user.provider,
          providerId: req.user.uid,
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
      req.user.dbUser = {
        id: oauthAccount.user.id,
        nickname: oauthAccount.user.nickname,
        role: oauthAccount.user.role,
        oauthAccounts: oauthAccount.user.oauthAccounts,
      };
    }
  } catch {
    // 토큰 검증 실패해도 통과 (선택적 인증)
  }

  next();
}
