/**
 * MobileAIChatFAB - 모바일 AI Chat FAB 버튼
 *
 * 우측 하단 고정 위치
 * isOpen 상태에 따라 아이콘 변경 (💬 ↔ ✕)
 */

import { MessageCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileAIChatFABProps {
  onClick: () => void;
  isOpen: boolean;
}

export function MobileAIChatFAB({ onClick, isOpen }: MobileAIChatFABProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
      style={{
        bottom: '24px',
        right: '16px',
        background: isOpen
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          : 'linear-gradient(135deg, #6b5a4a 0%, #5a4a3a 100%)',
      }}
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
