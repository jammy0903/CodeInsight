/**
 * MainLayout
 * 메인 레이아웃 - TopBar + Sidebar + Content + Footer
 *
 * NOTE: NicknameModal은 needsRegistration 상태일 때 자동 표시
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { NicknameModal } from '@/components/NicknameModal';
import { Github, Mail, Twitter, Heart, Menu } from 'lucide-react';
import { useStore } from '@/stores/store';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 닉네임 등록 모달 - needsRegistration 시 자동 표시 */}
      <NicknameModal />

      {/* Sidebar */}
      <Sidebar />

      {/* Hamburger Button - Only show when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-3 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
          aria-label="메뉴 열기"
        >
          <Menu className="w-6 h-6 text-purple-600" />
        </button>
      )}

      {/* Header */}
      <TopBar />

      {/* Main Content - Animates with sidebar */}
      <motion.main
        className="flex-1 overflow-auto"
        animate={{
          marginLeft: sidebarOpen ? '224px' : '0px',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </motion.main>

      {/* Footer - 2025 Modern Style */}
      <motion.footer
        className="shrink-0 py-6 bg-gradient-to-r from-card/80 via-card/95 to-card/80 backdrop-blur-xl border-t border-border/50 px-8"
        animate={{
          marginLeft: sidebarOpen ? '224px' : '0px',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Brand + Copyright */}
          <motion.div
            className="flex flex-col items-center sm:items-start gap-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold bg-gradient-to-r from-accent-orange to-accent-coral bg-clip-text text-transparent">
                CodeInsight
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs text-muted-foreground">
                © 2025
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" /> for learners worldwide
            </p>
          </motion.div>

          {/* Right: Social Links + Navigation */}
          <div className="flex items-center gap-6">
            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              <motion.a
                href="https://github.com/jammy0903"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur transition-opacity" />
                <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                  <Github className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </motion.a>

              <motion.a
                href="mailto:fuso3367@kakao.com"
                className="group relative"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-20 blur transition-opacity" />
                <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </motion.a>

              <motion.a
                href="#"
                className="group relative"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 opacity-0 group-hover:opacity-20 blur transition-opacity" />
                <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                  <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </motion.a>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

            {/* Navigation Links */}
            <div className="flex items-center gap-4 text-xs">
              <motion.a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors relative group"
                whileHover={{ y: -1 }}
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-accent-orange to-accent-coral group-hover:w-full transition-all duration-300" />
              </motion.a>
              <motion.a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors relative group"
                whileHover={{ y: -1 }}
              >
                Docs
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-accent-orange to-accent-coral group-hover:w-full transition-all duration-300" />
              </motion.a>
              <motion.a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors relative group"
                whileHover={{ y: -1 }}
              >
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-accent-orange to-accent-coral group-hover:w-full transition-all duration-300" />
              </motion.a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
