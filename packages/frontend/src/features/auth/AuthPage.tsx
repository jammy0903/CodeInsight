/**
 * AuthPage - 로그인 페이지
 * Firebase 소셜 로그인 (Google)
 *
 * WHY: Google OAuth 하나로 로그인/회원가입 자동 처리
 * 신규 유저는 initializeAuthListener에서 자동 등록됨
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { loginWithGoogle } from '@/services/firebase';
import { logger } from '@/utils/logger';
import { useStore } from '@/stores/store';

export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithGoogle();
      setSidebarOpen(false);
      navigate('/courses');
    } catch (err) {
      setError(t('auth.google_failed', { action: t('auth.login') }));
      logger.error('Google login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text mb-4">
            {t('auth.login')}
          </h1>
          <p className="text-text-secondary">
            {t('auth.social_subtitle')}
          </p>
        </div>

        {/* Google 로그인 버튼 */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-border rounded-2xl shadow-md hover:shadow-lg hover:border-primary transition-all disabled:opacity-50"
            aria-label={t('auth.google_auth', { action: t('auth.login') })}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-base font-medium text-gray-700">
              {t('auth.google_auth', { action: t('auth.login') })}
            </span>
          </motion.button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
