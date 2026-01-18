/**
 * TopBar Component
 * CodeInsight 헤더 바 - 로고, 네비게이션, 사용자 메뉴
 */

import { motion } from 'framer-motion';
import { Code2, Sparkles, Menu } from 'lucide-react';
import { useStore } from '@/stores/store';
import { Link } from 'react-router-dom';
import { StreakCard, useStreak } from '@/features/gamification';

export function TopBar() {
  const { sidebarOpen, toggleSidebar, pageTitle, pageSubtitle, appUser } = useStore();
  const { streak, loading: streakLoading } = useStreak();

  return (
    <header
      className="shrink-0 backdrop-blur-xl overflow-visible shadow-sm"
      style={{
        background: 'var(--theme-layout-top-bar-bg)',
        borderBottom: '1px solid var(--theme-layout-top-bar-border)',
      }}
    >
      {/* Row 1: 3분할 레이아웃 (왼쪽: 로고, 중앙: 제목, 오른쪽: 액션) */}
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Hamburger - 항상 표시 */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md transition-colors shrink-0 hover:bg-[var(--theme-layout-top-bar-button-hover)]"
            aria-label="메뉴 열기"
          >
            <Menu className="w-6 h-6" style={{ color: 'var(--theme-layout-top-bar-text-muted)' }} />
          </button>

          {/* Logo Area - 작게 */}
          <Link to="/" className="no-underline hover:no-underline shrink-0">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="relative"
                whileHover={{ rotate: 180 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Code2 className="h-5 w-5" style={{ color: 'var(--theme-dashboard-accent)' }} />
                <motion.div
                  className="absolute -top-0.5 -right-0.5"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <Sparkles className="h-3 w-3" style={{ color: 'var(--theme-layout-top-bar-text-muted)' }} />
                </motion.div>
              </motion.div>
              <h1 className="hidden md:block text-sm font-bold" style={{ color: 'var(--theme-layout-top-bar-text)' }}>
                CodeInsight
              </h1>
            </motion.div>
          </Link>
        </div>

        {/* Center: 페이지 제목 (정중앙) */}
        {pageTitle && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <h2 className="text-xl font-bold" style={{ color: 'var(--theme-layout-top-bar-text)' }}>
              {pageTitle}
            </h2>
            {pageSubtitle && (
              <p className="text-xs" style={{ color: 'var(--theme-layout-top-bar-text-muted)' }}>
                {pageSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Right: Actions Area - 스트릭 표시 */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 로그인 상태일 때 스트릭 표시 */}
          {appUser && (
            <Link to="/dashboard" title="나의 현황 보기">
              <StreakCard streak={streak} variant="compact" loading={streakLoading} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
