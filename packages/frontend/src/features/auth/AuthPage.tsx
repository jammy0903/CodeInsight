/**
 * AuthPage - 통합 로그인/회원가입 페이지
 * Firebase 소셜 로그인 (Google, GitHub, Kakao)
 *
 * WHY: LoginPage와 SignupPage가 100% 동일한 기능 수행
 * TRADEOFF: 단일 컴포넌트로 통합 > 중복 코드 145줄 제거
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { loginWithGoogle, loginWithGithub, loginWithKakao } from '@/services/firebase';
import { Github } from 'lucide-react';
import { logger } from '@/utils/logger';
import { useStore } from '@/stores/store';

export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setSidebarOpen } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // URL 경로로 로그인/회원가입 구분
  const isSignup = location.pathname === '/signup';
  const pageTitle = isSignup ? t('auth.signup') : t('auth.login');
  const errorPrefix = isSignup ? t('auth.signup') : t('auth.login');
  const linkPath = isSignup ? '/login' : '/signup';
  const linkText = isSignup ? t('auth.go_login') : t('auth.go_signup');
  const linkPrompt = isSignup ? t('auth.have_account') : t('auth.no_account');

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithGoogle();
      setSidebarOpen(false); // 로그인 성공 시 사이드바 닫기
      navigate('/courses');
    } catch (err) {
      setError(t('auth.google_failed', { action: errorPrefix }));
      logger.error('Google login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithGithub();
      setSidebarOpen(false); // 로그인 성공 시 사이드바 닫기
      navigate('/courses');
    } catch (err) {
      setError(t('auth.github_failed', { action: errorPrefix }));
      logger.error('GitHub login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithKakao();
      setSidebarOpen(false); // 로그인 성공 시 사이드바 닫기
      navigate('/courses');
    } catch (err) {
      setError(t('auth.kakao_failed', { action: errorPrefix }));
      logger.error('Kakao login failed:', err);
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
            {pageTitle}
          </h1>
          <p className="text-text-secondary">
            {t('auth.social_subtitle')}
          </p>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div className="flex justify-center gap-6">
          {/* Google */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-16 h-16 flex items-center justify-center bg-white border-2 border-border rounded-full shadow-md hover:shadow-lg hover:border-primary transition-all disabled:opacity-50"
            aria-label={t('auth.google_auth', { action: pageTitle })}
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </motion.button>

          {/* GitHub */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-16 h-16 flex items-center justify-center bg-[#24292e] border-2 border-[#24292e] rounded-full shadow-md hover:shadow-lg hover:bg-[#1a1e22] transition-all disabled:opacity-50"
            aria-label={t('auth.github_auth', { action: pageTitle })}
          >
            <Github className="w-7 h-7 text-white" />
          </motion.button>

          {/* Kakao */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-16 h-16 flex items-center justify-center bg-[#FEE500] border-2 border-[#FEE500] rounded-full shadow-md hover:shadow-lg hover:bg-[#FFEB3B] transition-all disabled:opacity-50"
            aria-label={t('auth.kakao_auth', { action: pageTitle })}
          >
            <svg className="w-7 h-7 text-[#3C1E1E]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.745 1.79 5.155 4.5 6.645l-1.125 4.125c-.075.27.21.495.45.345l5.25-3.495c.315.03.63.045.945.045 5.523 0 9.98-3.477 9.98-7.75S17.523 3 12 3z"/>
            </svg>
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

        {/* 하단 텍스트 */}
        <p className="mt-8 text-center text-sm text-text-tertiary">
          {linkPrompt}{' '}
          <a href={linkPath} className="text-primary hover:underline font-medium">
            {linkText}
          </a>
        </p>
      </motion.div>
    </div>
  );
}
