/**
 * Application Configuration
 * Clean API wrapper over Zod-validated environment variables
 */

import { env } from './env';

export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    corsOrigins: env.CORS_ORIGINS.split(',').map(s => s.trim()),
    jsonBodyLimit: env.JSON_BODY_LIMIT,
  },

  docker: {
    image: env.DOCKER_IMAGE,
    memoryLimit: env.DOCKER_MEMORY_LIMIT,
    cpuLimit: env.DOCKER_CPU_LIMIT,
    pidLimit: env.DOCKER_PID_LIMIT,
    tmpfsSize: env.DOCKER_TMPFS_SIZE,
  },

  execution: {
    defaultTimeout: env.C_RUN_DEFAULT_TIMEOUT,
    maxTimeout: env.C_RUN_MAX_TIMEOUT,
    judgeTimeout: env.C_JUDGE_TIMEOUT,
    bufferSize: env.C_EXECUTOR_BUFFER_SIZE,
    maxCodeLength: env.CODE_MAX_LENGTH,
  },

  external: {
    xai: {
      apiKey: env.XAI_API_KEY,
      apiUrl: env.XAI_API_URL,
    },
  },
} as const;

// Re-export for backwards compatibility during migration
export { env } from './env';
export type { Env } from './env';
