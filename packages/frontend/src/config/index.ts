/**
 * Application Configuration
 * Clean API wrapper over Zod-validated environment variables
 */

import { env } from './env';

export const config = {
  api: {
    baseUrl: `${env.VITE_API_URL}/api/${env.VITE_API_VERSION}`,
    timeout: {
      run: env.VITE_C_RUN_TIMEOUT,
      judge: env.VITE_C_JUDGE_TIMEOUT,
      trace: env.VITE_TRACER_TIMEOUT,
    },
  },
} as const;

// Re-export for backwards compatibility during migration
export { env } from './env';
export type { Env } from './env';

// Theme exports
export {
  fonts,
  colors,
  spacing,
  borderRadius,
  shadows,
  animation,
  zIndex,
} from './theme';
export type { ThemeColors, ThemeFonts } from './theme';
