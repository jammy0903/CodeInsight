/**
 * Sidebar - 사이드바 네비게이션
 *
 * WHY: 사용자 프로필, 로그인/사인업, 페이지 이동 통합
 * FEATURES: 열림/닫힘 애니메이션, 반응형 콘텐츠
 *
 * CHANGE: user → firebaseUser + appUser
 * - admin 체크: email → role 기반
 * - 프로필 표시: nickname 기반
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, BookOpen, Play, Shield, LogOut, UserPlus, FileQuestion, BarChart3, User, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { logout, loginWithGoogle, loginWithKakao } from '@/services/firebase';
import { PixelAvatar } from '@/components/PixelAvatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { logger } from '@/utils/logger';

const SIDEBAR_WIDTH = 224; // 14rem

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '홈', icon: Home },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/playground', label: 'Playground', icon: Play },
];

// 로그인 필수 탭들
const AUTH_NAV_ITEMS: NavItem[] = [
  { path: '/quiz', label: '퀴즈', icon: FileQuestion },
  { path: '/dashboard', label: '나의 현황', icon: BarChart3 },
  { path: '/report', label: '학습 리포트', icon: TrendingUp },
  { path: '/profile', label: '프로필', icon: User },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, firebaseUser, appUser, needsRegistration } = useStore();
  const isAdmin = appUser?.role === 'admin';

  const handleSignOut = async () => {
    await logout();
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      logger.error('Google login failed:', error);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      await loginWithKakao();
    } catch (error) {
      logger.error('Kakao login failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* 배경 오버레이 (모든 화면 크기) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={toggleSidebar}
          />

          {/* 사이드바 */}
          <motion.aside
            initial={{ x: -SIDEBAR_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_WIDTH }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed left-0 top-0 h-full border-r shadow-lg z-50 flex flex-col"
            style={{
              width: SIDEBAR_WIDTH,
              backgroundColor: 'var(--theme-sidebar-bg)',
              borderColor: 'var(--theme-sidebar-border)'
            }}
          >
            {/* 헤더 */}
            <div className="p-4 border-b flex items-center justify-between" style={{
              backgroundColor: 'var(--theme-sidebar-bg)',
              borderColor: 'var(--theme-sidebar-border)'
            }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--theme-sidebar-title)' }}>
                CodeInsight
              </h2>
              <motion.button
                onClick={toggleSidebar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg border transition-colors"
                style={{
                  borderColor: 'var(--theme-sidebar-close-btn-border)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-close-btn-hover-bg)';
                  e.currentTarget.style.borderColor = 'var(--theme-sidebar-close-btn-hover-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--theme-sidebar-close-btn-border)';
                }}
                aria-label="사이드바 닫기"
              >
                <X className="w-5 h-5" style={{ color: 'var(--theme-sidebar-close-icon)' }} />
              </motion.button>
            </div>

            {/* 네비게이션 */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ backgroundColor: 'var(--theme-sidebar-bg)' }}>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.path}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Link
                      to={item.path}
                      onClick={toggleSidebar}
                      className={`
                        flex items-center gap-3 px-4 h-12 rounded-lg
                        border transition-all duration-150
                        ${isActive ? 'font-semibold' : ''}
                      `}
                      style={isActive ? {
                        backgroundColor: 'var(--theme-sidebar-nav-active-bg)',
                        borderColor: 'var(--theme-sidebar-nav-active-border)',
                        color: 'var(--theme-sidebar-nav-active-text)'
                      } : {
                        backgroundColor: 'var(--theme-sidebar-nav-inactive-bg)',
                        borderColor: 'var(--theme-sidebar-nav-inactive-border)',
                        color: 'var(--theme-sidebar-nav-inactive-text)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-nav-inactive-hover-bg)';
                          e.currentTarget.style.borderColor = 'var(--theme-sidebar-nav-inactive-hover-border)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-nav-inactive-bg)';
                          e.currentTarget.style.borderColor = 'var(--theme-sidebar-nav-inactive-border)';
                        }
                      }}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* 로그인 필수 메뉴 */}
              {appUser && AUTH_NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.path}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Link
                      to={item.path}
                      onClick={toggleSidebar}
                      className={`
                        flex items-center gap-3 px-4 h-12 rounded-lg
                        border transition-all duration-150
                        ${isActive ? 'font-semibold' : ''}
                      `}
                      style={isActive ? {
                        backgroundColor: 'var(--theme-sidebar-nav-active-bg)',
                        borderColor: 'var(--theme-sidebar-nav-active-border)',
                        color: 'var(--theme-sidebar-nav-active-text)'
                      } : {
                        backgroundColor: 'var(--theme-sidebar-nav-inactive-bg)',
                        borderColor: 'var(--theme-sidebar-nav-inactive-border)',
                        color: 'var(--theme-sidebar-nav-inactive-text)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-nav-inactive-hover-bg)';
                          e.currentTarget.style.borderColor = 'var(--theme-sidebar-nav-inactive-hover-border)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-nav-inactive-bg)';
                          e.currentTarget.style.borderColor = 'var(--theme-sidebar-nav-inactive-border)';
                        }
                      }}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Admin 메뉴 (관리자만 표시) */}
              {isAdmin && (
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Link
                    to="/admin"
                    onClick={toggleSidebar}
                    className={`
                      flex items-center gap-3 px-4 h-12 rounded-lg
                      border transition-all duration-150
                      ${location.pathname.startsWith('/admin') ? 'font-semibold' : ''}
                    `}
                    style={location.pathname.startsWith('/admin') ? {
                      backgroundColor: 'var(--theme-sidebar-admin-active-bg)',
                      borderColor: 'var(--theme-sidebar-admin-active-border)',
                      color: 'var(--theme-sidebar-nav-active-text)'
                    } : {
                      backgroundColor: 'var(--theme-sidebar-nav-inactive-bg)',
                      borderColor: 'var(--theme-sidebar-nav-inactive-border)',
                      color: 'var(--theme-sidebar-nav-inactive-text)'
                    }}
                    onMouseEnter={(e) => {
                      if (!location.pathname.startsWith('/admin')) {
                        e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-admin-inactive-hover-bg)';
                        e.currentTarget.style.borderColor = 'var(--theme-sidebar-admin-inactive-hover-border)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!location.pathname.startsWith('/admin')) {
                        e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-nav-inactive-bg)';
                        e.currentTarget.style.borderColor = 'var(--theme-sidebar-nav-inactive-border)';
                      }
                    }}
                  >
                    <Shield className="w-5 h-5 shrink-0" />
                    <span className="text-sm">Admin</span>
                  </Link>
                </motion.div>
              )}
            </nav>

            {/* 프로필 영역 */}
            <div className="p-4 border-t border-t-[var(--theme-sidebar-profile-border)]">
              {firebaseUser ? (
                <div className="space-y-3">
                  {/* 닉네임 등록 필요 시 */}
                  {(needsRegistration || !appUser) ? (
                    <motion.button
                      onClick={() => {
                        // TODO: 닉네임 등록 모달 열기
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border rounded-lg transition-colors"
                      style={{
                        color: 'var(--theme-sidebar-nickname-btn-text)',
                        backgroundColor: 'var(--theme-sidebar-nickname-btn-bg)',
                        borderColor: 'var(--theme-sidebar-nickname-btn-border)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-nickname-btn-hover-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-nickname-btn-bg)';
                      }}
                    >
                      <UserPlus className="w-5 h-5" />
                      닉네임 설정하기
                    </motion.button>
                  ) : (
                    <>
                      {/* 테마 변경 버튼 */}
                      <div className="flex justify-center">
                        <ThemeToggle />
                      </div>

                      {/* 등록 완료 상태 - 닉네임 기반 프로필 */}
                      <div className="flex items-center gap-3 p-3 rounded-lg border" style={{
                        backgroundColor: 'var(--theme-sidebar-profile-card-bg)',
                        borderColor: 'var(--theme-sidebar-profile-card-border)'
                      }}>
                        <PixelAvatar seed={appUser.nickname} size={40} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--theme-sidebar-nickname-text)' }}>
                            {appUser.nickname}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--theme-sidebar-email-text)' }}>
                            {appUser.oauthAccounts[0]?.email || firebaseUser.email}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <motion.button
                    onClick={handleSignOut}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors"
                    style={{
                      color: 'var(--theme-sidebar-logout-text)',
                      borderColor: 'var(--theme-sidebar-logout-border)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--theme-sidebar-logout-hover-border)';
                      e.currentTarget.style.color = 'var(--theme-sidebar-logout-hover-text)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--theme-sidebar-logout-border)';
                      e.currentTarget.style.color = 'var(--theme-sidebar-logout-text)';
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 비로그인 상태 */}
                  <motion.button
                    onClick={handleGoogleLogin}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border rounded-lg transition-colors"
                    style={{
                      color: 'var(--theme-sidebar-login-btn-text)',
                      backgroundColor: 'var(--theme-sidebar-login-btn-bg)',
                      borderColor: 'var(--theme-sidebar-login-btn-border)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--theme-sidebar-login-btn-hover-border)';
                      e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-login-btn-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--theme-sidebar-login-btn-border)';
                      e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-login-btn-bg)';
                    }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google 로그인
                  </motion.button>

                  {/* 카카오 로그인 */}
                  <motion.button
                    onClick={handleKakaoLogin}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border rounded-lg transition-colors"
                    style={{
                      color: 'var(--theme-sidebar-kakao-btn-text)',
                      backgroundColor: 'var(--theme-sidebar-kakao-btn-bg)',
                      borderColor: 'var(--theme-sidebar-kakao-btn-border)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-kakao-btn-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--theme-sidebar-kakao-btn-bg)';
                    }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="var(--theme-sidebar-kakao-btn-text)"
                        d="M12 3C6.477 3 2 6.463 2 10.691c0 2.693 1.775 5.063 4.445 6.412-.144.523-.926 3.369-.963 3.592 0 0-.02.166.088.229.108.063.235.015.235.015.31-.043 3.593-2.363 4.159-2.771.339.047.686.071 1.036.071 5.523 0 10-3.463 10-7.548C22 6.463 17.523 3 12 3z"
                      />
                    </svg>
                    카카오 로그인
                  </motion.button>

                  <p className="text-xs text-center pt-1" style={{ color: 'var(--theme-sidebar-copyright-text)' }}>
                    © 2026 CodeInsight
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
