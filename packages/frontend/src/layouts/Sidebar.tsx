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
import { X, Home, BookOpen, Shield, LogOut, UserPlus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { logout, loginWithGoogle } from '@/services/firebase';
import { PixelAvatar } from '@/components/PixelAvatar';

const SIDEBAR_WIDTH = 224; // 14rem

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '홈', icon: Home },
  { path: '/courses', label: 'Courses', icon: BookOpen },
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
      console.error('로그인 실패:', error);
    }
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* 배경 오버레이 (모바일) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={toggleSidebar}
          />

          {/* 사이드바 */}
          <motion.aside
            initial={{ x: -SIDEBAR_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_WIDTH }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed left-0 top-0 h-full bg-white border-r-2 border-sand shadow-lg z-50 flex flex-col"
            style={{ width: SIDEBAR_WIDTH }}
          >
            {/* 헤더 */}
            <div className="p-4 border-b-2 border-sand flex items-center justify-between">
              <h2 className="text-xl font-bold bg-gradient-to-r from-accent-orange to-accent-coral bg-clip-text text-transparent">
                CodeInsight
              </h2>
              <motion.button
                onClick={toggleSidebar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg border border-sand hover:bg-sand transition-colors"
                aria-label="사이드바 닫기"
              >
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>
            </div>

            {/* 네비게이션 - Demo 스타일 박스 */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                        border-2 transition-colors
                        ${isActive
                          ? 'bg-accent-orange font-semibold border-accent-orange shadow-card-hover'
                          : 'text-gray-700 bg-white border-sand hover:border-accent-orange hover:bg-peach'
                        }
                      `}
                      style={isActive ? { color: 'white' } : undefined}
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
                      border-2 transition-colors
                      ${location.pathname.startsWith('/admin')
                        ? 'bg-accent-purple font-semibold border-accent-purple shadow-card-hover'
                        : 'text-gray-700 bg-white border-sand hover:border-accent-purple hover:bg-purple-50'
                      }
                    `}
                    style={location.pathname.startsWith('/admin') ? { color: 'white' } : undefined}
                  >
                    <Shield className="w-5 h-5 shrink-0" />
                    <span className="text-sm">Admin</span>
                  </Link>
                </motion.div>
              )}
            </nav>

            {/* 프로필 영역 */}
            <div className="p-4 border-t-2 border-sand">
              {firebaseUser ? (
                <div className="space-y-3">
                  {/* 닉네임 등록 필요 시 */}
                  {(needsRegistration || !appUser) ? (
                    <motion.button
                      onClick={() => {
                        // TODO: 닉네임 등록 모달 열기
                        console.log('Open registration modal');
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-accent-orange bg-accent-orange/10 border-2 border-accent-orange rounded-lg hover:bg-accent-orange/20 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                      닉네임 설정하기
                    </motion.button>
                  ) : (
                    <>
                      {/* 등록 완료 상태 - 닉네임 기반 프로필 */}
                      <div className="flex items-center gap-3 p-3 bg-peach rounded-lg border-2 border-sand">
                        <PixelAvatar seed={appUser.nickname} size={40} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {appUser.nickname}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
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
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 border-2 border-sand rounded-lg hover:border-accent-red hover:text-accent-red hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 비로그인 상태 */}
                  <motion.button
                    onClick={handleGoogleLogin}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-sand rounded-lg hover:border-accent-orange hover:bg-peach transition-colors"
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
                  <p className="text-xs text-gray-400 text-center">
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
