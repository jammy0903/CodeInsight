/**
 * useChat Hook
 * AI 튜터 채팅 로직 관리
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/stores/store';
import { askAI } from '@/services/ai';

export function useChat() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isAiLoading, addMessage, setAiLoading, clearMessages } = useStore();

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isAiLoading) return;

    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    });
    setInput('');
    setAiLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await askAI(trimmed, history);
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
      });
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Error occurred. Please try again.',
      });
    } finally {
      setAiLoading(false);
    }
  }, [input, isAiLoading, messages, addMessage, setAiLoading]);

  // Enter 키 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return {
    input,
    setInput,
    messages,
    isAiLoading,
    messagesEndRef,
    sendMessage,
    handleKeyDown,
    clearMessages,
  };
}
