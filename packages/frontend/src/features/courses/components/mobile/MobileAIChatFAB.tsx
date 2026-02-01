/**
 * MobileAIChatFAB - 모바일 AI Chat FAB 버튼
 *
 * 우측 하단 고정 위치
 * isOpen 상태에 따라 아이콘 변경 (💬 ↔ ✕)
 */

import { MessageCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import './MobileLessonView.css';

interface MobileAIChatFABProps {
  onClick: () => void;
  isOpen: boolean;
}

export function MobileAIChatFAB({ onClick, isOpen }: MobileAIChatFABProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center fab-container ${isOpen ? 'fab-gradient-active' : 'fab-gradient-inactive'
        }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <motion.div
        key={isOpen ? 'close' : 'chat'}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.div>
    </motion.button>
  );
}
