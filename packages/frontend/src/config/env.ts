/**
 * 환경변수 설정 (Zod 스키마 기반)
 * 모든 환경변수를 중앙에서 타입 안전하게 관리
 */

import { z } from 'zod';

const envSchema = z.object({
  // === API ===
  VITE_API_URL: z.string().default('http://localhost:3002'),
  VITE_API_VERSION: z.string().default('v1'),
});

// Vite 환경변수 파싱 (import.meta.env 사용)
function getEnv() {
  return envSchema.parse({
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_VERSION: import.meta.env.VITE_API_VERSION,
  });
}

export const env = getEnv();

// 타입 export
export type Env = z.infer<typeof envSchema>;
