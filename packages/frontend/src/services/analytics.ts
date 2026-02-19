/**
 * Re-export from analytics/ directory
 */
export {
  // Activity
  startLessonActivity,
  endLessonActivity,
  endLessonActivityBeacon,
  saveSessionContext,
  collectSessionContext,
  saveStepActivity,
  saveStepActivities,
  type ActivityStartResponse,
  type ActivityEndResponse,
  type SessionContextData,
  type StepActivityData,
  // Quiz
  recordQuizAttempt,
  type QuizAttemptRequest,
  type QuizAttemptResponse,
  // Profile
  getProfile,
  updateProfile,
  type UserProfile,
  type ProfileResponse,
  // Report
  getAnalyticsSummary,
  type AnalyticsSummary,
} from './analytics/index';
