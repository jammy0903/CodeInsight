/**
 * TopBar Component
 * CodeInsight 헤더 바 - 로고, 네비게이션, 사용자 메뉴
 */

import { motion } from 'framer-motion';
import { Code2, Sparkles, Menu } from 'lucide-react';
import { useStore } from '@/stores/store';
import { Link } from 'react-router-dom';
import { StreakCard, useStreak } from '@/features/gamification';
import { LanguageBadge } from '@/components/ui/LanguageBadge';
import { useIsMobile } from '@/hooks'; // useIsMobile import
import type { SupportedLanguage } from '@/types'; // SupportedLanguage import

// 언어 정보 (LanguageCoursePage.tsx에서 가져옴)
const getLanguageInfo = (lang: SupportedLanguage | null) => {
  if (!lang) return null;
  switch (lang) {
    case 'c': return { name: 'C언어', icon: 'C', color: '#0077B6' };
    case 'python': return { name: 'Python', icon: '🐍', color: '#FFD54F' };
    case 'java': return { name: 'Java', icon: '☕', color: '#EC4899' };
    case 'javascript': return { name: 'JavaScript', icon: '⚡', color: '#81C784' };
    case 'python-practical': return { name: 'Python실용', icon: '🤖', color: '#9E9E9E' };
    default: return { name: lang.toUpperCase(), icon: '📚', color: '#FFD700' };
  }
};

export function TopBar() {
  const { sidebarOpen, toggleSidebar, pageTitle, pageSubtitle, pageLanguage, appUser } = useStore();
  const { streak, loading: streakLoading } = useStreak();
  const isMobile = useIsMobile(); // isMobile 훅 사용

  const langInfo = pageLanguage ? getLanguageInfo(pageLanguage) : null;

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
          <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
            {isMobile && langInfo ? (
              <div className="flex items-center gap-2">
                <span
                  className="text-lg"
                  style={{ color: langInfo.color }}
                >
                  {langInfo.icon}
                </span>
                <h2 className="text-base font-bold text-ellipsis whitespace-nowrap overflow-hidden" style={{ color: 'var(--theme-layout-top-bar-text)' }}>
                  {pageTitle}
                </h2>
              </div>
            ) : (
              // 데스크톱 또는 모바일인데 언어 정보가 없거나, 언어 정보가 필요 없는 페이지
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--theme-layout-top-bar-text)' }}>
                    {pageTitle}
                  </h2>
                  {pageLanguage && <LanguageBadge language={pageLanguage} />}
                </div>
                {pageSubtitle && (
                  <p className="text-xs text-ellipsis whitespace-nowrap overflow-hidden" style={{ color: 'var(--theme-layout-top-bar-text-muted)' }}>
                    {pageSubtitle}
                  </p>
                )}
              </>
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
