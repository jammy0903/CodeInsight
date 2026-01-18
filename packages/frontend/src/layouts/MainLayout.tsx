/**
 * MainLayout
 * 메인 레이아웃 - TopBar + Sidebar + Content + Footer
 *
 * NOTE: NicknameModal은 needsRegistration 상태일 때 자동 표시
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { NicknameModal } from '@/components/NicknameModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Menu, Github, Mail } from 'lucide-react';
import { useStore } from '@/stores/store';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, toggleSidebar, appUser } = useStore();
  const location = useLocation();

  // 페이지 타입 확인
  const isHomePage = location.pathname === '/';
  const isLessonPage = /^\/courses\/[^/]+\/[^/]+\/[^/]+$/.test(location.pathname);
  const isPlaygroundPage = location.pathname === '/playground';

  // Gmail 문의하기 링크 (제목 포함)
  const username = appUser?.nickname || '게스트';
  const emailSubject = encodeURIComponent(`[CodeInsight 고객문의사항] ${username}`);
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=l89192164@gmail.com&su=${emailSubject}`;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 닉네임 등록 모달 - needsRegistration 시 자동 표시 */}
      <NicknameModal />

      {/* 온보딩 모달 - needsOnboarding 시 자동 표시 (닉네임 등록 후) */}
      <OnboardingModal />

      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <div style={{ pointerEvents: sidebarOpen ? 'none' : 'auto' }}>
        <TopBar />
      </div>

      {/* Main Content - Animates with sidebar */}
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
        {/* 홈/플레이그라운드: 전체 너비, 레슨: 레슨 컨테이너, 나머지: 메인 컨테이너 */}
        {isHomePage || isPlaygroundPage ? (
          children
        ) : isLessonPage ? (
          <div className="lesson-content-container">{children}</div>
        ) : (
          <div className="main-content-container">{children}</div>
        )}

        {/* Footer - 스크롤 영역 안에 배치 */}
        {!isLessonPage && !isPlaygroundPage && (
          <footer className="mt-16 py-4 border-t border-t-[var(--theme-layout-footer-border)]" style={{ backgroundColor: 'var(--theme-layout-footer-bg)' }}>
            <div className="main-content-container my-4">
              {/* 2열 레이아웃 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* 왼쪽: 브랜드 + 링크 */}
                <div className="space-y-2">
                  <Link
                    to="/"
                    className="text-lg font-bold transition-colors no-underline hover:no-underline"
                    style={{ color: 'var(--theme-layout-footer-text)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-link-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-text)'; }}
                  >
                    CodeInsight
                  </Link>
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--theme-layout-footer-text-muted)' }}>
                    <a
                      href="/courses"
                      className="transition-colors"
                      style={{ color: 'var(--theme-layout-footer-text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-link-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-text-muted)'; }}
                    >
                      Courses
                    </a>
                    <a
                      href="/chat"
                      className="transition-colors"
                      style={{ color: 'var(--theme-layout-footer-text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-link-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-text-muted)'; }}
                    >
                      AI Chat
                    </a>
                    <a
                      href={gmailLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors"
                      style={{ color: 'var(--theme-layout-footer-text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-link-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--theme-layout-footer-text-muted)'; }}
                    >
                      Contact
                    </a>
                  </div>
                </div>

                {/* 오른쪽: Stay in touch + 소셜 */}
                <div className="space-y-2 md:text-right">
                  <p className="text-sm font-medium" style={{ color: 'var(--theme-layout-footer-text)' }}>Stay in touch</p>
                  <div className="flex gap-3 md:justify-end">
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
                    <a
                      href={gmailLink}
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
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* 하단 저작권 */}
              <div className="mt-4 pt-3 border-t border-t-[var(--theme-layout-footer-border)] text-center text-xs" style={{ color: 'var(--theme-layout-footer-text-muted)' }}>
                © 2026 CodeInsight. All Rights Reserved.
              </div>
            </div>
          </footer>
        )}
      </motion.main>
    </div>
  );
}
