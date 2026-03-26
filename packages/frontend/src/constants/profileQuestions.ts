/**
 * Profile Questions Constants
 *
 * WHY: 온보딩 모달과 프로필 페이지에서 공유하는 설문 항목
 * USAGE:
 *   - OnboardingModal: 최초 설문
 *   - ProfilePage: 조회/수정
 *
 * NOTE: title/subtitle/label 은 i18n 키로 저장.
 *       컴포넌트에서 t(question.titleKey) 형태로 사용.
 */

// 설문 항목 타입
export interface ProfileQuestion {
  key: ProfileQuestionKey;
  titleKey: string;
  subtitleKey: string;
  options: ProfileOption[];
}

export interface ProfileOption {
  value: string;
  labelKey: string;
  emoji: string;
}

// 설문 키 타입
export type ProfileQuestionKey =
  | 'ageGroup'
  | 'occupation'
  | 'programmingExp'
  | 'learningGoal';

// 설문 항목 정의
export const PROFILE_QUESTIONS: readonly ProfileQuestion[] = [
  {
    key: 'ageGroup',
    titleKey: 'onboarding.age_question',
    subtitleKey: 'onboarding.age_subtitle',
    options: [
      { value: '10s',  labelKey: 'onboarding.age_10s',      emoji: '🎒' },
      { value: '20s',  labelKey: 'onboarding.age_20s',      emoji: '🎓' },
      { value: '30s',  labelKey: 'onboarding.age_30s',      emoji: '💼' },
      { value: '40s+', labelKey: 'onboarding.age_40s_plus', emoji: '🌟' },
    ],
  },
  {
    key: 'occupation',
    titleKey: 'onboarding.occupation_question',
    subtitleKey: 'onboarding.occupation_subtitle',
    options: [
      { value: 'student_middle', labelKey: 'onboarding.student_middle', emoji: '📚' },
      { value: 'student_high',   labelKey: 'onboarding.student_high',   emoji: '📝' },
      { value: 'student_univ',   labelKey: 'onboarding.student_univ',   emoji: '🎓' },
      { value: 'job_seeker',     labelKey: 'onboarding.job_seeker',     emoji: '🔍' },
      { value: 'worker',         labelKey: 'onboarding.worker',         emoji: '💻' },
      { value: 'other',          labelKey: 'onboarding.other',          emoji: '✨' },
    ],
  },
  {
    key: 'programmingExp',
    titleKey: 'onboarding.exp_question',
    subtitleKey: 'onboarding.exp_subtitle',
    options: [
      { value: 'none',     labelKey: 'onboarding.exp_none',     emoji: '🌱' },
      { value: 'less_1y',  labelKey: 'onboarding.exp_less_1y',  emoji: '🌿' },
      { value: '1_3y',     labelKey: 'onboarding.exp_1_3y',     emoji: '🌳' },
      { value: '3y_plus',  labelKey: 'onboarding.exp_3y_plus',  emoji: '🏆' },
    ],
  },
  {
    key: 'learningGoal',
    titleKey: 'onboarding.goal_question',
    subtitleKey: 'onboarding.goal_subtitle',
    options: [
      { value: 'basics',    labelKey: 'onboarding.goal_basics',    emoji: '📖' },
      { value: 'job_prep',  labelKey: 'onboarding.goal_job_prep',  emoji: '🎯' },
      { value: 'skill_up',  labelKey: 'onboarding.goal_skill_up',  emoji: '📈' },
      { value: 'curiosity', labelKey: 'onboarding.goal_curiosity', emoji: '🎮' },
    ],
  },
] as const;

/**
 * value로 labelKey 찾기 (컴포넌트에서 t(key) 로 번역)
 */
export function getProfileLabelKey(key: ProfileQuestionKey, value: string): string {
  const question = PROFILE_QUESTIONS.find((q) => q.key === key);
  if (!question) return value;
  const option = question.options.find((o) => o.value === value);
  return option?.labelKey ?? value;
}

/**
 * value로 emoji 찾기
 */
export function getProfileEmoji(key: ProfileQuestionKey, value: string): string {
  const question = PROFILE_QUESTIONS.find((q) => q.key === key);
  if (!question) return '';
  const option = question.options.find((o) => o.value === value);
  return option?.emoji ?? '';
}

/**
 * 질문별 옵션 맵 (빠른 조회용)
 */
export const PROFILE_OPTIONS_MAP = PROFILE_QUESTIONS.reduce(
  (acc, q) => {
    acc[q.key] = q.options;
    return acc;
  },
  {} as Record<ProfileQuestionKey, ProfileOption[]>
);
