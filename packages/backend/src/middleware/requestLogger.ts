/**
 * HTTP 요청 로깅 미들웨어
 * - 모든 요청/응답 로그 기록
 * - 응답 시간 측정
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    logger.info('HTTP Request', {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip,
    });
  });

  next();
}
