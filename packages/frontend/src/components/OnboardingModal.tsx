/**
 * OnboardingModal Component
 *
 * WHY: 로그인 후 학습 분석에 필요한 기본 정보 수집
 * FLOW:
 *   1. 4단계 설문 (나이대, 직업, 프로그래밍 경험, 학습 목표)
 *   2. 스킵 가능 (선택 사항)
 *   3. 완료 시 프로필 저장
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/stores/store';
import { updateProfile, type UserProfile } from '@/services/analytics';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { PROFILE_QUESTIONS, type ProfileQuestionKey } from '@/constants/profileQuestions';

export function OnboardingModal() {
  const needsOnboarding = useStore((s) => s.needsOnboarding);
  const setNeedsOnboarding = useStore((s) => s.setNeedsOnboarding);
  const appUser = useStore((s) => s.appUser);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserProfile>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = PROFILE_QUESTIONS[step];
  const isLastStep = step === PROFILE_QUESTIONS.length - 1;
  const progress = ((step + 1) / PROFILE_QUESTIONS.length) * 100;

  // 답변 선택
  const handleSelect = useCallback((value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.key]: value,
    }));
  }, [currentQuestion]);

  // 제출 (handleNext보다 먼저 정의되어야 함)
  const handleSubmit = useCallback(async () => {
    if (!appUser) return;
    setIsSubmitting(true);
    try {
      await updateProfile(answers);
      console.log('Profile saved successfully');
      // 성공 시 모달과 사이드바 모두 닫기
      setNeedsOnboarding(false);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      // 실패해도 모달 닫기 (UX 우선)
      setNeedsOnboarding(false);
      setSidebarOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, appUser, setNeedsOnboarding, setSidebarOpen]);

  // 다음 단계
  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep((prev) => prev + 1);
    }
  }, [isLastStep, handleSubmit]);

  // 이전 단계
  const handlePrev = useCallback(() => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  }, [step]);

  // 스킵 (나중에 하기)
  const handleSkip = async () => {
    if (!appUser) return;
    // 빈 프로필로 완료 처리 (백엔드에 저장)
    try {
      await updateProfile({});
      setNeedsOnboarding(false);
    } catch {
      setNeedsOnboarding(false);
    }
  };

  // 모달 표시 조건 (백엔드에서 설정한 needsOnboarding 상태만 사용)
  if (!needsOnboarding || !appUser) return null;

  const selectedValue = answers[currentQuestion.key as ProfileQuestionKey];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-[var(--theme-dashboard-card-bg)] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            {/* 스킵 버튼 */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 text-[var(--theme-dashboard-text-muted)] hover:text-[var(--theme-dashboard-title)] hover:bg-[var(--theme-dashboard-section-header-bg)] rounded-full transition-colors"
              title="나중에 하기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-1.5 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-[var(--theme-dashboard-text-muted)] mt-2 text-center">
                {step + 1} / {PROFILE_QUESTIONS.length}
              </p>
            </div>

            {/* Welcome badge (first step only) */}
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 mb-4"
              >
                <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  환영합니다, {appUser.nickname}님!
                </span>
              </motion.div>
            )}

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h2 className="text-xl font-bold text-[var(--theme-dashboard-title)]">
                  {currentQuestion.title}
                </h2>
                <p className="text-sm text-[var(--theme-dashboard-text-muted)] mt-1">
                  {currentQuestion.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Options */}
          <div className="px-6 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="grid grid-cols-2 gap-3"
              >
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all
                      ${selectedValue === option.value
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md'
                        : 'border-[var(--theme-dashboard-card-border)] hover:border-[var(--theme-dashboard-accent)] hover:bg-[var(--theme-dashboard-section-header-bg)]'
                      }
                    `}
                  >
                    <span className="text-2xl mb-1 block">{option.emoji}</span>
                    <span className={`text-sm font-medium ${
                      selectedValue === option.value ? 'text-orange-700' : 'text-[var(--theme-dashboard-title)]'
                    }`}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            {step > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-3 text-[var(--theme-dashboard-text-muted)] border-2 border-[var(--theme-dashboard-card-border)] rounded-xl font-medium hover:bg-[var(--theme-dashboard-section-header-bg)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: selectedValue ? 1.02 : 1 }}
              whileTap={{ scale: selectedValue ? 0.98 : 1 }}
              onClick={handleNext}
              disabled={!selectedValue || isSubmitting}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
                ${selectedValue && !isSubmitting
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-lg'
                  : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-dashboard-text-muted)] cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  저장 중...
                </span>
              ) : isLastStep ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  시작하기
                </>
              ) : (
                <>
                  다음
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>

          {/* Skip hint */}
          <div className="px-6 pb-4 text-center">
            <button
              onClick={handleSkip}
              className="text-xs text-[var(--theme-dashboard-text-muted)] hover:text-[var(--theme-dashboard-title)] transition-colors"
            >
              나중에 설정하기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
