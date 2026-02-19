/**
 * Analytics Service — 모든 분석 API re-export
 */

export {
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
} from './activityService';

export {
  recordQuizAttempt,
  type QuizAttemptRequest,
  type QuizAttemptResponse,
} from './quizService';

export {
  getProfile,
  updateProfile,
  type UserProfile,
  type ProfileResponse,
} from './profileService';

export {
  getAnalyticsSummary,
  type AnalyticsSummary,
} from './reportService';
