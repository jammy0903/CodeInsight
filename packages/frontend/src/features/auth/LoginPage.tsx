/**
 * LoginPage - 로그인 페이지
 * Firebase 소셜 로그인 (Google, GitHub, Kakao)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginWithGoogle, loginWithGithub, loginWithKakao } from '@/services/firebase';
import { Github, Mail } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithGoogle();
      navigate('/courses');
    } catch (err) {
      setError('Google 로그인 실패');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithGithub();
      navigate('/courses');
    } catch (err) {
      setError('GitHub 로그인 실패');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await loginWithKakao();
      navigate('/courses');
    } catch (err) {
      setError('Kakao 로그인 실패');
      console.error(err);
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
            로그인
          </h1>
          <p className="text-text-secondary">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div className="space-y-4">
          {/* Google */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-border rounded-xl font-medium text-text hover:border-primary transition-colors disabled:opacity-50"
          >
            <Mail className="w-5 h-5" />
            Google로 계속하기
          </motion.button>

          {/* GitHub */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-border rounded-xl font-medium text-text hover:border-primary transition-colors disabled:opacity-50"
          >
            <Github className="w-5 h-5" />
            GitHub로 계속하기
          </motion.button>

          {/* Kakao */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] border-2 border-[#FEE500] rounded-xl font-medium text-[#3C1E1E] hover:bg-[#FFEB3B] transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.745 1.79 5.155 4.5 6.645l-1.125 4.125c-.075.27.21.495.45.345l5.25-3.495c.315.03.63.045.945.045 5.523 0 9.98-3.477 9.98-7.75S17.523 3 12 3z"/>
            </svg>
            Kakao로 계속하기
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
          계정이 없으신가요?{' '}
          <a href="/signup" className="text-primary hover:underline font-medium">
            회원가입하기
          </a>
        </p>
      </motion.div>
    </div>
  );
}
