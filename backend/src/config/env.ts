/**
 * 환경변수 설정 (Zod 스키마 기반)
 * 모든 환경변수를 중앙에서 타입 안전하게 관리
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

const envSchema = z.object({
  // === Server ===
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // === CORS ===
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),

  // === Docker Execution ===
  DOCKER_IMAGE: z.string().default('gcc:latest'),
  DOCKER_MEMORY_LIMIT: z.string().default('128m'),
  DOCKER_CPU_LIMIT: z.string().default('0.5'),
  DOCKER_PID_LIMIT: z.coerce.number().default(50),
  DOCKER_TMPFS_SIZE: z.string().default('10m'),

  // === C Execution Timeouts (seconds) ===
  C_RUN_DEFAULT_TIMEOUT: z.coerce.number().default(10),
  C_RUN_MAX_TIMEOUT: z.coerce.number().default(30),
  C_JUDGE_TIMEOUT: z.coerce.number().default(5),
  C_EXECUTOR_BUFFER_SIZE: z.coerce.number().default(10 * 1024 * 1024),

  // === Code Limits ===
  CODE_MAX_LENGTH: z.coerce.number().default(50000),
  JSON_BODY_LIMIT: z.string().default('1mb'),

  // === External APIs (optional) ===
  XAI_API_KEY: z.string().optional(),
  XAI_API_URL: z.string().default('https://api.x.ai/v1/chat/completions'),

  // === DeepSeek AI ===
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().default('https://api.deepseek.com'),

  // === Ollama (Local LLM) ===
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5-coder:7b'),

  // === Firebase Admin ===
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

// 환경변수 파싱 및 검증
export const env = envSchema.parse(process.env);

// Helper: CORS origins를 배열로 변환
export const corsOrigins = env.CORS_ORIGINS.split(',').map(s => s.trim());

// 타입 export
export type Env = z.infer<typeof envSchema>;
