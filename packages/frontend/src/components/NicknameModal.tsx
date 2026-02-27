/**
 * NicknameModal Component
 *
 * WHY: Firebase 로그인 후, 닉네임 미등록 시 표시
 * FLOW:
 *   1. 닉네임 입력
 *   2. 실시간 유효성 검사 (형식 + 중복)
 *   3. 등록 완료 → appUser 설정
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/stores/store';
import { checkNickname, registerUser } from '@/services/user';
import { logout } from '@/services/firebase';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

// 닉네임 정규식: 2-20자, 영문+숫자+한글+언더스코어
const NICKNAME_REGEX = /^[a-zA-Z0-9가-힣_]{2,20}$/;

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export function NicknameModal() {
  const { t } = useTranslation();
  const needsRegistration = useStore((s) => s.needsRegistration);
  const firebaseUser = useStore((s) => s.firebaseUser);
  const setAppUser = useStore((s) => s.setAppUser);
  const setNeedsRegistration = useStore((s) => s.setNeedsRegistration);

  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 닉네임 유효성 검사 (debounced)
  // NOTE: Hooks는 조건부 return 전에 항상 호출되어야 함 (Rules of Hooks)
  const validateNickname = useCallback(async (value: string) => {
    // 빈 값이면 초기 상태
    if (!value.trim()) {
      setStatus('idle');
      setMessage('');
      return;
    }

    // 형식 검사
    if (!NICKNAME_REGEX.test(value)) {
      setStatus('invalid');
      setMessage(t('profile.nickname_format'));
      return;
    }

    // 중복 검사
    setStatus('checking');
    try {
      const result = await checkNickname(value);
      if (result.available) {
        setStatus('valid');
        setMessage(t('profile.nickname_available'));
      } else {
        setStatus('invalid');
        setMessage(result.error || t('profile.nickname_taken'));
      }
    } catch (_error) {
      setStatus('invalid');
      setMessage(t('profile.nickname_error'));
    }
  }, []);

  // 닉네임 입력 시 debounce 적용
  useEffect(() => {
    // needsRegistration이 false면 validation 불필요
    if (!needsRegistration) return;

    const timer = setTimeout(() => {
      validateNickname(nickname);
    }, 300);
    return () => clearTimeout(timer);
  }, [nickname, validateNickname, needsRegistration]);

  // 닉네임이 없거나 Firebase 로그인 안 된 상태면 표시 안 함
  // NOTE: 모든 hooks 호출 후에 조건부 return
  if (!needsRegistration || !firebaseUser) return null;

  // 등록 처리
  const handleSubmit = async () => {
    if (status !== 'valid' || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const appUser = await registerUser(nickname);
      setAppUser(appUser);
      setNeedsRegistration(false);
    } catch (error) {
      setStatus('invalid');
      setMessage(error instanceof Error ? error.message : t('auth.registration_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 취소 (로그아웃)
  const handleCancel = async () => {
    await logout();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-[var(--theme-dashboard-card-bg)] rounded-2xl shadow-2xl p-8 m-4"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)]">{t('welcome_message')}</h2>
            <p className="text-[var(--theme-dashboard-text-muted)] mt-2">
              {t('auth.set_nickname_desc')}
            </p>
          </div>

          {/* Input */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('profile.nickname_placeholder')}
                className={`
                  w-full px-4 py-3 rounded-lg border-2 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${status === 'valid' ? 'border-green-500 focus:ring-green-500' : ''}
                  ${status === 'invalid' ? 'border-red-500 focus:ring-red-500' : ''}
                  ${status === 'idle' || status === 'checking' ? 'border-[var(--theme-dashboard-card-border)] focus:ring-accent-orange' : ''}
                `}
                maxLength={20}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {status === 'checking' && (
                  <Loader2 className="w-5 h-5 text-[var(--theme-dashboard-text-muted)] animate-spin" />
                )}
                {status === 'valid' && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
                {status === 'invalid' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            {/* Message */}
            <AnimatePresence mode="wait">
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-sm ${
                    status === 'valid' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Hint */}
            <p className="text-xs text-[var(--theme-dashboard-text-muted)]">
              {t('auth.nickname_hint')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              className="flex-1 px-4 py-3 text-[var(--theme-dashboard-text-muted)] border-2 border-[var(--theme-dashboard-card-border)] rounded-lg font-medium hover:bg-[var(--theme-dashboard-section-header-bg)] transition-colors"
            >
              {t('common.cancel')}
            </motion.button>
            <motion.button
              whileHover={{ scale: status === 'valid' ? 1.02 : 1 }}
              whileTap={{ scale: status === 'valid' ? 0.98 : 1 }}
              onClick={handleSubmit}
              disabled={status !== 'valid' || isSubmitting}
              className={`
                flex-1 px-4 py-3 rounded-lg font-medium transition-colors
                ${status === 'valid' && !isSubmitting
                  ? 'bg-accent-orange text-white hover:bg-accent-orange/90'
                  : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-dashboard-text-muted)] cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('auth.registering')}
                </span>
              ) : (
                t('home.start_learning')
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
