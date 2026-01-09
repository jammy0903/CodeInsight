/**
 * TopBar Component
 * CodeInsight 헤더 바 - 로고, 네비게이션, 사용자 메뉴
 */

import { motion } from 'framer-motion';
import { Code2, Sparkles } from 'lucide-react';
import { useStore } from '@/stores/store';
import { Link } from 'react-router-dom';

export function TopBar() {
  const { sidebarOpen } = useStore();

  return (
    <motion.header
      className="shrink-0 bg-gradient-to-r from-card/80 via-card/95 to-card/80 backdrop-blur-xl border-b border-border/50 overflow-visible shadow-sm"
      animate={{
        marginLeft: sidebarOpen ? '224px' : '0px',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Row 1: Logo + Actions */}
      <div className="h-16 flex items-center justify-between px-8">
        {/* Logo Area - 2025 Gradient Style */}
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
              <Code2 className="h-8 w-8 text-primary" />
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
                <Sparkles className="h-4 w-4 text-accent-orange" />
              </motion.div>
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900">
                CodeInsight
              </h1>
              <p className="text-xs text-gray-500">
                코드 실행 원리 학습
              </p>
            </div>
          </motion.div>
        </Link>

        {/* Actions Area - 프로필 제거, 사이드바로 이동 */}
        <div className="flex items-center">
          {/* 프로필/로그인은 사이드바에서만 표시 */}
        </div>
      </div>
    </motion.header>
  );
}
