/**
 * Admin Authentication Middleware
 *
 * WHY: Admin 전용 API 접근 제어
 * SECURITY: Firebase Auth + UID 확인 (환경변수 기반)
 */

import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface AdminRequest extends Request {
  adminUser?: {
    uid: string;
    displayName?: string;
  };
}

/**
 * Admin 권한 확인 미들웨어
 */
export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    // Firebase ID 토큰 검증
    const decodedToken = await auth.verifyIdToken(token);

    // UID 확인 (환경변수에서 Admin UID 가져옴)
    if (!env.ADMIN_FIREBASE_UID || decodedToken.uid !== env.ADMIN_FIREBASE_UID) {
      res.status(403).json({
        error: 'Forbidden: Admin access only',
        message: '관리자 권한이 필요합니다.'
      });
      return;
    }

    // Admin 정보 저장
    req.adminUser = {
      uid: decodedToken.uid,
      displayName: decodedToken.name,
    };

    next();
  } catch (error) {
    logger.error('Admin auth error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
