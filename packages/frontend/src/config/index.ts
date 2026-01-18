/**
 * Application Configuration
 * Clean API wrapper over Zod-validated environment variables
 */

import { env } from './env';

export const config = {
  api: {
    baseUrl: `${env.VITE_API_URL}/api/${env.VITE_API_VERSION}`,
    endpoints: {
      cRun: '/c/run',
      cJudge: '/c/judge',
      memoryTrace: '/memory/trace',
      users: '/users',
      problems: '/problems',
      submissions: '/submissions',
      aiChat: '/ai/chat',
      aiChatStream: '/ai/chat/stream',
      aiExplain: '/ai/explain',
      aiExplainStep: '/ai/explain-step',
      aiProviders: '/ai/providers',
      aiAnalyzeReport: '/ai/analyze-report',
      // 분석 리포트
      analyticsActivity: '/analytics/activity',
      analyticsActivityEnd: '/analytics/activity/end',
      analyticsQuizAttempt: '/analytics/quiz-attempt',
      analyticsSummary: '/analytics/summary',
      analyticsProfile: '/analytics/profile',
      analyticsSessionContext: '/analytics/session-context',
      analyticsStepActivity: '/analytics/step-activity',
      analyticsStepActivities: '/analytics/step-activities',
      // 노트
      notes: '/notes',
      notesConcepts: '/notes/concepts',
    },
    timeout: {
      run: env.VITE_C_RUN_TIMEOUT,
      judge: env.VITE_C_JUDGE_TIMEOUT,
      trace: env.VITE_TRACER_TIMEOUT,
    },
  },

  firebase: {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  },

  ui: {
    problemsPerPage: env.VITE_PROBLEMS_PER_PAGE,
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
