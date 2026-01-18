/**
 * Profile Questions Constants
 *
 * WHY: 온보딩 모달과 프로필 페이지에서 공유하는 설문 항목
 * USAGE:
 *   - OnboardingModal: 최초 설문
 *   - ProfilePage: 조회/수정
 */

// 설문 항목 타입
export interface ProfileQuestion {
  key: ProfileQuestionKey;
  title: string;
  subtitle: string;
  options: ProfileOption[];
}

export interface ProfileOption {
  value: string;
  label: string;
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
    title: '나이대가 어떻게 되세요?',
    subtitle: '맞춤형 학습 콘텐츠를 위해 필요해요',
    options: [
      { value: '10s', label: '10대', emoji: '🎒' },
      { value: '20s', label: '20대', emoji: '🎓' },
      { value: '30s', label: '30대', emoji: '💼' },
      { value: '40s+', label: '40대 이상', emoji: '🌟' },
    ],
  },
  {
    key: 'occupation',
    title: '현재 어떤 일을 하고 계세요?',
    subtitle: '학습 목표에 맞는 추천을 드릴게요',
    options: [
      { value: 'student_middle', label: '중학생', emoji: '📚' },
      { value: 'student_high', label: '고등학생', emoji: '📝' },
      { value: 'student_univ', label: '대학생', emoji: '🎓' },
      { value: 'job_seeker', label: '취업 준비생', emoji: '🔍' },
      { value: 'worker', label: '직장인', emoji: '💻' },
      { value: 'other', label: '기타', emoji: '✨' },
    ],
  },
  {
    key: 'programmingExp',
    title: '프로그래밍 경험이 있으신가요?',
    subtitle: '수준에 맞는 설명을 제공해 드릴게요',
    options: [
      { value: 'none', label: '처음이에요', emoji: '🌱' },
      { value: 'less_1y', label: '1년 미만', emoji: '🌿' },
      { value: '1_3y', label: '1~3년', emoji: '🌳' },
      { value: '3y_plus', label: '3년 이상', emoji: '🏆' },
    ],
  },
  {
    key: 'learningGoal',
    title: '어떤 목표로 학습하시나요?',
    subtitle: '목표에 맞는 학습 경로를 추천해 드릴게요',
    options: [
      { value: 'basics', label: '기초부터 탄탄히', emoji: '📖' },
      { value: 'job_prep', label: '취업/이직 준비', emoji: '🎯' },
      { value: 'skill_up', label: '실력 향상', emoji: '📈' },
      { value: 'curiosity', label: '호기심/재미', emoji: '🎮' },
    ],
  },
] as const;

/**
 * value로 label 찾기 (프로필 표시용)
 */
export function getProfileLabel(key: ProfileQuestionKey, value: string): string {
  const question = PROFILE_QUESTIONS.find((q) => q.key === key);
  if (!question) return value;

  const option = question.options.find((o) => o.value === value);
  return option?.label || value;
}

/**
 * value로 emoji 찾기
 */
export function getProfileEmoji(key: ProfileQuestionKey, value: string): string {
  const question = PROFILE_QUESTIONS.find((q) => q.key === key);
  if (!question) return '';

  const option = question.options.find((o) => o.value === value);
  return option?.emoji || '';
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
