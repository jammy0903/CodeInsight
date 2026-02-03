/**
 * Chat Store — AI 채팅 메시지 상태
 */

import { create } from 'zustand';
import type { Message } from '@/types/index';

interface ChatState {
  messages: Message[];
  isAiLoading: boolean;
  addMessage: (msg: Message) => void;
  setAiLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isAiLoading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setAiLoading: (loading) => set({ isAiLoading: loading }),
  clearMessages: () => set({ messages: [] }),
}));
