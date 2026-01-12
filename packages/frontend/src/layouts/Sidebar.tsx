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
import { X, Home, BookOpen, Play, Shield, LogOut, UserPlus, HelpCircle, LayoutDashboard, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { logout, loginWithGoogle } from '@/services/firebase';
import { PixelAvatar } from '@/components/PixelAvatar';
import { logger } from '@/utils/logger';
import { useThemeStore } from '@/stores/themeStore';
import { themes } from '@/config/themes';

const SIDEBAR_WIDTH = 224; // 14rem

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean; // 로그인 필요 여부
}

// 모든 사용자용 메뉴
const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '홈', icon: Home },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/quiz', label: 'Quiz', icon: HelpCircle },
  { path: '/playground', label: 'Playground', icon: Play },
];

// 로그인 사용자 전용 메뉴
const AUTH_NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { path: '/profile', label: 'Profile', icon: User, requiresAuth: true },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, firebaseUser, appUser, needsRegistration } = useStore();
  const isAdmin = appUser?.role === 'admin';
  const currentTheme = useThemeStore((s) => s.theme);
  const layoutColors = themes[currentTheme].layout;

  const handleSignOut = async () => {
    await logout();
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      logger.error('Login failed:', error);
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
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onClick={toggleSidebar}
          />

          {/* 사이드바 */}
          <motion.aside
            initial={{ x: -SIDEBAR_WIDTH }}
            animate={{ x: 0 }}
            exit={{ x: -SIDEBAR_WIDTH }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed left-0 top-0 h-full shadow-lg z-50 flex flex-col"
            style={{
              width: SIDEBAR_WIDTH,
              backgroundColor: layoutColors.sidebarBg,
              borderRight: `1px solid ${layoutColors.sidebarBorder}`,
            }}
          >
            {/* 헤더 */}
            <div
              className="p-4 flex items-center justify-between"
              style={{
                backgroundColor: layoutColors.sidebarBg,
                borderBottom: `1px solid ${layoutColors.sidebarBorder}`,
              }}
            >
              <h2 className="text-xl font-bold" style={{ color: layoutColors.sidebarText }}>
                CodeInsight
              </h2>
              <motion.button
                onClick={toggleSidebar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg transition-colors"
                style={{
                  border: `1px solid ${layoutColors.sidebarBorder}`,
                  backgroundColor: layoutColors.sidebarItemBg,
                }}
                aria-label="사이드바 닫기"
              >
                <X className="w-5 h-5" style={{ color: layoutColors.sidebarTextMuted }} />
              </motion.button>
            </div>

            {/* 네비게이션 */}
            <nav
              className="flex-1 p-4 space-y-2 overflow-y-auto"
              style={{ backgroundColor: layoutColors.sidebarBg }}
            >
              {/* 공통 메뉴 */}
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.path} item={item} location={location} toggleSidebar={toggleSidebar} />
              ))}

              {/* 로그인 사용자 전용 메뉴 */}
              {appUser && (
                <>
                  <div className="my-3" style={{ borderTop: `1px solid ${layoutColors.sidebarBorder}` }} />
                  {AUTH_NAV_ITEMS.map((item) => (
                    <NavLink key={item.path} item={item} location={location} toggleSidebar={toggleSidebar} />
                  ))}
                </>
              )}

              {/* Admin 메뉴 (관리자만 표시) */}
              {isAdmin && (
                <>
                  <div className="my-3" style={{ borderTop: `1px solid ${layoutColors.sidebarBorder}` }} />
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Link
                      to="/admin"
                      onClick={toggleSidebar}
                      className="flex items-center gap-3 px-4 h-12 rounded-lg border transition-all duration-150"
                      style={{
                        backgroundColor: location.pathname.startsWith('/admin') ? '#22c55e' : layoutColors.sidebarItemBg,
                        color: location.pathname.startsWith('/admin') ? '#ffffff' : layoutColors.sidebarText,
                        borderColor: location.pathname.startsWith('/admin') ? '#16a34a' : layoutColors.sidebarBorder,
                        fontWeight: location.pathname.startsWith('/admin') ? 600 : 400,
                      }}
                    >
                      <Shield className="w-5 h-5 shrink-0" />
                      <span className="text-sm">Admin</span>
                    </Link>
                  </motion.div>
                </>
              )}
            </nav>

            {/* 프로필 영역 */}
            <div
              className="p-4"
              style={{ borderTop: `1px solid ${layoutColors.sidebarBorder}` }}
            >
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-colors"
                      style={{
                        color: layoutColors.sidebarItemActive,
                        backgroundColor: `${layoutColors.sidebarItemActive}15`,
                        border: `1px solid ${layoutColors.sidebarItemActive}`,
                      }}
                    >
                      <UserPlus className="w-5 h-5" />
                      닉네임 설정하기
                    </motion.button>
                  ) : (
                    <>
                      {/* 등록 완료 상태 - 닉네임 기반 프로필 */}
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{
                          backgroundColor: layoutColors.sidebarItemBg,
                          border: `1px solid ${layoutColors.sidebarBorder}`,
                        }}
                      >
                        <PixelAvatar seed={appUser.nickname} size={40} />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: layoutColors.sidebarText }}
                          >
                            {appUser.nickname}
                          </p>
                          <p
                            className="text-xs truncate capitalize"
                            style={{ color: layoutColors.sidebarTextMuted }}
                          >
                            {appUser.oauthAccounts[0]?.provider || 'OAuth'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  <motion.button
                    onClick={handleSignOut}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-red-500/10"
                    style={{
                      color: layoutColors.sidebarTextMuted,
                      border: `1px solid ${layoutColors.sidebarBorder}`,
                    }}
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-colors"
                    style={{
                      color: layoutColors.sidebarText,
                      backgroundColor: layoutColors.sidebarItemBg,
                      border: `1px solid ${layoutColors.sidebarBorder}`,
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
                  <p
                    className="text-xs text-center"
                    style={{ color: layoutColors.sidebarTextMuted }}
                  >
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

// 네비게이션 링크 컴포넌트
interface NavLinkProps {
  item: NavItem;
  location: { pathname: string };
  toggleSidebar: () => void;
}

function NavLink({ item, location, toggleSidebar }: NavLinkProps) {
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path));
  const Icon = item.icon;
  const currentTheme = useThemeStore((s) => s.theme);
  const layoutColors = themes[currentTheme].layout;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Link
        to={item.path}
        onClick={toggleSidebar}
        className="flex items-center gap-3 px-4 h-12 rounded-lg border transition-all duration-150"
        style={{
          backgroundColor: isActive ? layoutColors.sidebarItemActive : layoutColors.sidebarItemBg,
          color: isActive ? '#ffffff' : layoutColors.sidebarText,
          borderColor: isActive ? layoutColors.sidebarItemActive : layoutColors.sidebarBorder,
          fontWeight: isActive ? 600 : 400,
        }}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm">{item.label}</span>
      </Link>
    </motion.div>
  );
}
