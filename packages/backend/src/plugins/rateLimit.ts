/**
 * Fastify Rate Limiting 플러그인
 *
 * @fastify/rate-limit 기반 + 커스텀 프리셋
 *
 * WHY: 엔드포인트별로 다른 제한이 필요
 *      - 일반 API: 관대하게 (UX)
 *      - AI: 비용 고려
 *      - 실행: 서버 리소스 보호 (Docker 컨테이너)
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit, { RateLimitPluginOptions } from '@fastify/rate-limit';

// Rate limit 프리셋 타입
export type RateLimitPreset = 'standard' | 'ai' | 'execute';

// 프리셋 설정
const presets: Record<RateLimitPreset, { max: number; timeWindow: string; message: string }> = {
  standard: {
    max: 100,
    timeWindow: '1 minute',
    message: 'Too many requests, please try again later.',
  },
  ai: {
    max: 50,
    timeWindow: '1 minute',
    message: 'AI request limit reached. Please wait.',
  },
  execute: {
    max: 100, // 개발 편의를 위해 완화 (원래 30)
    timeWindow: '1 minute',
    message: 'Code execution limit reached. Please wait.',
  },
};

// Fastify 타입 확장
declare module 'fastify' {
  interface FastifyInstance {
    rateLimitPresets: typeof presets;
  }
}

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // @fastify/rate-limit 기본 등록 (전역 설정)
  await fastify.register(rateLimit, {
    global: true, // 모든 라우트에 IP 기준 기본 제한 (사용자 코드를 실행하는 API 보호)
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request: FastifyRequest) => request.ip,
    errorResponseBuilder: (request, context) => {
      const retryAfter = Math.ceil(context.ttl / 1000);
      // statusCode가 없으면 전역 에러 핸들러가 500으로 응답한다
      return {
        statusCode: 429,
        error: 'rate_limit_exceeded',
        message: 'Too many requests, please try again later.',
        retryAfter,
      };
    },
  } as RateLimitPluginOptions);

  // 프리셋 데코레이터 추가
  fastify.decorate('rateLimitPresets', presets);
};

export default fp(rateLimitPlugin, {
  name: 'rateLimit',
  fastify: '5.x',
});

/**
 * 특정 프리셋에 대한 rate limit 옵션 생성
 */
export function getRateLimitConfig(preset: RateLimitPreset) {
  const config = presets[preset];
  return {
    config: {
      rateLimit: {
        max: config.max,
        timeWindow: config.timeWindow,
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'rate_limit_exceeded',
          message: config.message,
          retryAfter: 60,
        }),
      },
    },
  };
}
