/**
 * MainLayout
 * 메인 레이아웃 - TopBar + Sidebar + Content + Footer
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Github } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useStore } from '@/stores/store';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const location = useLocation();

  // 페이지 타입 확인
  const isHomePage = location.pathname === '/';
  const isLessonPage = /^\/courses\/[^/]+\/[^/]+\/[^/]+$/.test(location.pathname);
  const isPlaygroundPage = location.pathname === '/playground';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - TopBar도 함께 스크롤 */}
      <motion.main
        className="flex-1 overflow-auto"
        style={{
          pointerEvents: sidebarOpen ? 'none' : 'auto',
        }}
        animate={{
          marginLeft: sidebarOpen ? '224px' : '0px',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header - 컨텐츠와 함께 스크롤 */}
        <TopBar />
        {/* 홈/플레이그라운드: 전체 너비, 레슨: 레슨 컨테이너, 나머지: 메인 컨테이너 */}
        {isHomePage || isPlaygroundPage ? (
          children
        ) : isLessonPage ? (
          <div className="lesson-content-container">{children}</div>
        ) : (
          <div className="main-content-container">{children}</div>
        )}

        {/* Footer - 스크롤 영역 안에 배치 */}
        {!isPlaygroundPage && (
          <footer className="mt-8 py-2 border-t border-t-[var(--theme-layout-footer-border)]" style={{ backgroundColor: 'var(--theme-layout-footer-bg)', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
            <div className="main-content-container my-2">
              {/* 2열 레이아웃 */}
              <div className="flex flex-row items-center justify-between gap-4">
                {/* 왼쪽: 브랜드 + 링크 */}
                <div className="flex items-center gap-4">
                  <Link
                    to="/"
                    className="text-lg font-bold transition-colors no-underline hover:no-underline"
                    style={{ color: 'var(--theme-layout-footer-text)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-link-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-text)'; }}
                  >
                    CodeInsight
                  </Link>
                </div>

                {/* 오른쪽: 테마 토글 + Stay in touch + 소셜 */}
                <div className="flex items-center gap-3">
                  <LanguageToggle />
                  <ThemeToggle />
                  <p className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--theme-layout-footer-text)' }}>Stay in touch</p>
                  <div className="flex gap-3">
                    <a
                      href="https://github.com/jammy0903"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: 'var(--theme-layout-footer-social-bg)', color: 'var(--theme-layout-footer-text)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--theme-layout-footer-social-hover)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--theme-layout-footer-social-bg)';
                        e.currentTarget.style.color = 'var(--theme-layout-footer-text)';
                      }}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* 하단 저작권 */}
              <div className="mt-2 pt-2 border-t border-t-[var(--theme-layout-footer-border)] text-center text-xs" style={{ color: 'var(--theme-layout-footer-text-muted)' }}>
                © 2026 CodeInsight. All Rights Reserved.
              </div>
            </div>
          </footer>
        )}
      </motion.main>
    </div>
  );
}
