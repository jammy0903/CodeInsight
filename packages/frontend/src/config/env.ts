/**
 * 환경변수 설정 (Zod 스키마 기반)
 * 모든 환경변수를 중앙에서 타입 안전하게 관리
 */

import { z } from 'zod';

const envSchema = z.object({
  // === API ===
  VITE_API_URL: z.string().default('http://localhost:3002'),
  VITE_API_VERSION: z.string().default('v1'),

  // === Timeouts (seconds) ===
  VITE_C_RUN_TIMEOUT: z.coerce.number().positive().default(10),
  VITE_C_JUDGE_TIMEOUT: z.coerce.number().positive().default(5),
  VITE_TRACER_TIMEOUT: z.coerce.number().positive().default(10),
});

// Vite 환경변수 파싱 (import.meta.env 사용)
function getEnv() {
  return envSchema.parse({
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_VERSION: import.meta.env.VITE_API_VERSION,
    VITE_C_RUN_TIMEOUT: import.meta.env.VITE_C_RUN_TIMEOUT,
    VITE_C_JUDGE_TIMEOUT: import.meta.env.VITE_C_JUDGE_TIMEOUT,
    VITE_TRACER_TIMEOUT: import.meta.env.VITE_TRACER_TIMEOUT,
  });
}

export const env = getEnv();

// 타입 export
export type Env = z.infer<typeof envSchema>;
