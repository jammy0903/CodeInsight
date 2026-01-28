/**
 * MobileAIChatModal - 모바일 AI Chat 오버레이 모달
 *
 * 전체화면 오버레이 (90% x 80%)
 * backdrop-blur 배경
 * ChatQA 재사용
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot } from 'lucide-react';
import { ChatQA } from '@/features/chat';
import type { ChatContext } from '@/services/ai';

interface MobileAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ChatContext;
  lessonId?: string;
}

export function MobileAIChatModal({
  isOpen,
  onClose,
  context,
  lessonId,
}: MobileAIChatModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 (blur) */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            className="fixed z-50 flex items-center justify-center"
            style={{
              top: '10%',
              left: '5%',
              width: '90%',
              height: '80%',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div
              className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: '#fffcf8',
                border: '1px solid #e5d5c7',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                fontFamily: 'NationalPension, cursive',
                fontWeight: 'normal',
              }}
            >
              {/* 헤더 */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: 'linear-gradient(135deg, #6b5a4a 0%, #5a4a3a 100%)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold">AI 튜터</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white bg-opacity-20 hover:bg-white bg-opacity-30 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* ChatQA */}
              <div className="flex-1 min-h-0">
                <ChatQA
                  context={context}
                  lessonId={lessonId}
                  contextType="lesson"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
