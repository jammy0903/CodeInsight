/**
 * TopBar Component
 * CodeInsight 헤더 바 - 로고, 네비게이션, 사용자 메뉴
 */

import { motion } from 'framer-motion';
import { Code2, Sparkles, Menu } from 'lucide-react';
import { useStore } from '@/stores/store';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeStore } from '@/stores/themeStore';
import { themes } from '@/config/themes';

export function TopBar() {
  const { sidebarOpen, toggleSidebar } = useStore();
  const currentTheme = useThemeStore((s) => s.theme);
  const layoutColors = themes[currentTheme].layout;

  return (
    <header
      className="shrink-0 backdrop-blur-xl overflow-visible shadow-sm"
      style={{
        background: layoutColors.topBarBg,
        borderBottom: `1px solid ${layoutColors.topBarBorder}`,
      }}
    >
      {/* Row 1: Logo + Actions */}
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-4">
          {/* Hamburger - 사이드바 닫혀있을 때만 표시 */}
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = layoutColors.topBarButtonBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="메뉴 열기"
            >
              <Menu className="w-5 h-5" style={{ color: layoutColors.topBarTextMuted }} />
            </button>
          )}

          {/* Logo Area */}
          <Link to="/" className="no-underline hover:no-underline">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="relative"
              whileHover={{ rotate: 180 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Code2 className="h-8 w-8" style={{ color: currentTheme === 'dark' ? '#60a5fa' : '#a855f7' }} />
              <motion.div
                className="absolute -top-1 -right-1"
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
                <Sparkles className="h-4 w-4" style={{ color: currentTheme === 'dark' ? '#fbbf24' : '#f97316' }} />
              </motion.div>
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold" style={{ color: layoutColors.topBarText }}>
                CodeInsight
              </h1>
              <p className="text-xs" style={{ color: layoutColors.topBarTextMuted }}>
                코드 실행 원리 학습
              </p>
            </div>
          </motion.div>
        </Link>
        </div>

        {/* Actions Area - 테마 토글 */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {/* 프로필/로그인은 사이드바에서만 표시 */}
        </div>
      </div>
    </header>
  );
}
