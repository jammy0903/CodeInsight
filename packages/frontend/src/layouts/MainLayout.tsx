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
import { Github, Mail } from 'lucide-react';
import { useStore } from '@/stores/store';
import { useThemeStore } from '@/stores/themeStore';
import { themes } from '@/config/themes';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, appUser } = useStore();
  const location = useLocation();
  const currentTheme = useThemeStore((s) => s.theme);
  const layoutColors = themes[currentTheme].layout;

  // 페이지 타입 확인
  const isHomePage = location.pathname === '/';
  const isLessonPage = /^\/courses\/[^/]+\/[^/]+\/[^/]+$/.test(location.pathname);
  const isPlaygroundPage = location.pathname === '/playground';

  // Gmail 문의하기 링크 (제목 포함)
  const username = appUser?.nickname || '게스트';
  const emailSubject = encodeURIComponent(`[CodeInsight 고객문의사항] ${username}`);
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=l89192164@gmail.com&su=${emailSubject}`;

  // LessonPage: 전체 페이지 스크롤 (헤더도 함께 스크롤)
  if (isLessonPage) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: layoutColors.pageBg }}>
        <NicknameModal />
        <Sidebar />

          <motion.div
          animate={{ marginLeft: sidebarOpen ? '224px' : '0px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <TopBar />
          <div className="lesson-content-container">{children}</div>
        </motion.div>
      </div>
    );
  }

  // 기본 레이아웃: 전체 페이지 스크롤 (헤더도 함께 스크롤)
  return (
    <div className="min-h-screen" style={{ backgroundColor: layoutColors.pageBg }}>
      {/* 닉네임 등록 모달 - needsRegistration 시 자동 표시 */}
      <NicknameModal />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content + Header - Animates with sidebar */}
      <motion.div
        animate={{
          marginLeft: sidebarOpen ? '224px' : '0px',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <TopBar />

        <main>
        {/* 홈/플레이그라운드: 전체 너비, 레슨: 레슨 컨테이너, 나머지: 메인 컨테이너 */}
        {isHomePage || isPlaygroundPage ? (
          children
        ) : isLessonPage ? (
          <div className="lesson-content-container">{children}</div>
        ) : (
          <div className="main-content-container">{children}</div>
        )}

        {/* Footer - Bootstrap Footer V09 스타일 */}
        {!isLessonPage && !isPlaygroundPage && (
          <footer
            className="mt-16 py-8"
            style={{
              backgroundColor: layoutColors.footerBg,
              borderTop: `1px solid ${layoutColors.footerBorder}`,
            }}
          >
            <div className="main-content-container">
              {/* 2열 레이아웃 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* 왼쪽: 브랜드 + 링크 */}
                <div className="space-y-3">
                  <Link
                    to="/"
                    className="text-lg font-bold transition-colors no-underline hover:no-underline"
                    style={{ color: layoutColors.footerText }}
                    onMouseEnter={(e) => e.currentTarget.style.color = layoutColors.footerLinkHover}
                    onMouseLeave={(e) => e.currentTarget.style.color = layoutColors.footerText}
                  >
                    CodeInsight
                  </Link>
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: layoutColors.footerTextMuted }}>
                    <a
                      href="/courses"
                      className="transition-colors"
                      style={{ color: layoutColors.footerTextMuted }}
                      onMouseEnter={(e) => e.currentTarget.style.color = layoutColors.footerText}
                      onMouseLeave={(e) => e.currentTarget.style.color = layoutColors.footerTextMuted}
                    >
                      Courses
                    </a>
                    <a
                      href="/chat"
                      className="transition-colors"
                      style={{ color: layoutColors.footerTextMuted }}
                      onMouseEnter={(e) => e.currentTarget.style.color = layoutColors.footerText}
                      onMouseLeave={(e) => e.currentTarget.style.color = layoutColors.footerTextMuted}
                    >
                      AI Chat
                    </a>
                    <a
                      href={gmailLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors"
                      style={{ color: layoutColors.footerTextMuted }}
                      onMouseEnter={(e) => e.currentTarget.style.color = layoutColors.footerText}
                      onMouseLeave={(e) => e.currentTarget.style.color = layoutColors.footerTextMuted}
                    >
                      Contact
                    </a>
                  </div>
                </div>

                {/* 오른쪽: Stay in touch + 소셜 */}
                <div className="space-y-3 md:text-right">
                  <p className="text-sm font-medium" style={{ color: layoutColors.footerText }}>Stay in touch</p>
                  <div className="flex gap-3 md:justify-end">
                    <a
                      href="https://github.com/jammy0903"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: layoutColors.footerSocialBg, color: layoutColors.footerText }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = layoutColors.footerSocialHover;
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = layoutColors.footerSocialBg;
                        e.currentTarget.style.color = layoutColors.footerText;
                      }}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                    <a
                      href={gmailLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: layoutColors.footerSocialBg, color: layoutColors.footerText }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = layoutColors.footerSocialHover;
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = layoutColors.footerSocialBg;
                        e.currentTarget.style.color = layoutColors.footerText;
                      }}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* 하단 저작권 */}
              <div
                className="mt-6 pt-4 text-center text-xs"
                style={{
                  borderTop: `1px solid ${layoutColors.footerBorder}`,
                  color: layoutColors.footerTextMuted,
                }}
              >
                © 2026 CodeInsight. All Rights Reserved.
              </div>
            </div>
          </footer>
        )}

        {/* LessonPage에서는 푸터 제거 - 학습 공간 확보 */}
        </main>
      </motion.div>
    </div>
  );
}
