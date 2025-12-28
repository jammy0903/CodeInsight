/**
 * Rate Limiting 미들웨어
 *
 * 간단한 인메모리 슬라이딩 윈도우 구현
 * - 프로덕션에서는 Redis 사용 권장
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;     // 시간 윈도우 (ms)
  maxRequests: number;  // 윈도우당 최대 요청 수
  message?: string;     // 제한 초과 시 메시지
  keyGenerator?: (req: Request) => string;  // 키 생성 함수
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// 인메모리 저장소 (프로덕션에서는 Redis 사용)
const requestCounts = new Map<string, RequestRecord>();

// 주기적 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts) {
    if (record.resetTime < now) {
      requestCounts.delete(key);
    }
  }
}, 60000); // 1분마다 정리

/**
 * Rate Limiter 팩토리
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip || 'unknown',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || record.resetTime < now) {
      // 새 윈도우 시작
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      setRateLimitHeaders(res, maxRequests, maxRequests - 1, now + windowMs);
      next();
      return;
    }

    if (record.count >= maxRequests) {
      // 제한 초과
      setRateLimitHeaders(res, maxRequests, 0, record.resetTime);
      res.status(429).json({
        error: 'rate_limit_exceeded',
        message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    // 요청 카운트 증가
    record.count++;
    setRateLimitHeaders(res, maxRequests, maxRequests - record.count, record.resetTime);
    next();
  };
}

function setRateLimitHeaders(
  res: Response,
  limit: number,
  remaining: number,
  resetTime: number
): void {
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
}

// === 프리셋 Rate Limiters ===
//
// WHY: 엔드포인트별로 다른 제한이 필요
//      - 일반 API: 관대하게 (UX)
//      - 인증: 엄격하게 (brute-force 방지)
//      - AI: 비용 고려
//      - 실행: 서버 리소스 보호 (Docker 컨테이너)
// TRADEOFF: 4개 프리셋은 복잡하지만, 하나로 통일하면 너무 엄격하거나 느슨함.
// REVISIT: 실제 트래픽 패턴 보고 숫자 조정. Redis 전환 시 사용자별 제한 가능.

/** 일반 API용 (100 req/min) */
export const rateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

/** 인증 API용 (엄격, 10 req/min) - brute-force 방지 */
export const authRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please wait.',
});

/** AI API용 (비용 고려, 20 req/min) - Ollama/외부 API 비용 */
export const aiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'AI request limit reached. Please wait.',
});

/** 코드 실행용 (리소스 보호, 30 req/min) - Docker 컨테이너 부하 */
export const executeRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Code execution limit reached. Please wait.',
});
