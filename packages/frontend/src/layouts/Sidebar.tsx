/**
 * Sidebar - 사이드바 네비게이션
 *
 * WHY: 페이지 이동 통합
 * FEATURES: 열림/닫힘 애니메이션, 반응형 콘텐츠
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, BookOpen, Play } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/stores/store';
import { LanguageToggle } from '@/components/LanguageToggle';

const SIDEBAR_WIDTH = 224; // 14rem

interface NavItem {
  path: string;
  labelKey: string; // i18n translation key
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/courses', labelKey: 'nav.courses', icon: BookOpen },
  { path: '/playground', labelKey: 'nav.playground', icon: Play },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* 반투명 배경 (Backdrop) - 클릭 시 사이드바 닫기 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-40"
            aria-label={t('nav.close_sidebar')}
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
                aria-label={t('nav.close_sidebar')}
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
                      <span className="text-sm">{t(item.labelKey)}</span>
                    </Link>
                  </motion.div>
                );
              })}

              <div className="mt-4 pt-4 border-t border-t-[var(--theme-sidebar-profile-border)]">
                <p className="text-xs text-center pt-1" style={{ color: 'var(--theme-sidebar-copyright-text)' }}>
                  © 2026 CodeInsight
                </p>
              </div>
              {/* 한/영 전환 */}
              <div className="mt-3 flex justify-center">
                <LanguageToggle />
              </div>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
