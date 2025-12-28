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

// Express Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        dbUser?: {
          id: string;
          firebaseUid: string;
          email: string;
          name: string;
          role: string;
        };
      };
    }
  }
}

/**
 * Firebase 토큰 검증 미들웨어
 * - 토큰 검증 후 req.user.uid 설정
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
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    // 개발 환경에서 디버깅용 로그
    if (env.NODE_ENV === 'development') {
      console.error('[Auth] Token verification failed:', error);
    }
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

/**
 * Firebase 토큰 검증 + DB 사용자 조회 미들웨어
 * - 토큰 검증 후 req.user.dbUser 설정
 * - DB에 사용자가 없으면 404 반환
 */
export async function requireDbUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!dbUser) {
      res.status(404).json({ error: 'User not found. Please register first.' });
      return;
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      dbUser: {
        id: dbUser.id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      },
    };
    next();
  } catch (error) {
    if (env.NODE_ENV === 'development') {
      console.error('[Auth] Token verification failed:', error);
    }
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

/**
 * Admin 권한 확인 미들웨어
 * - requireDbUser 이후에 사용
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.dbUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.dbUser.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
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
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch {
    // 토큰 검증 실패해도 통과 (선택적 인증)
  }

  next();
}
