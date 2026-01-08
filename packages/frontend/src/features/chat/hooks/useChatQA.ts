/**
 * useChatQA Hook
 * Q&A 대화 로직 관리 (context 지원)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { askAI } from '@/services/ai';
import type { ChatContext } from '@/services/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatQAOptions {
  context?: ChatContext;
  selectedText?: string;  // 사용자가 선택한 코드
}

export function useChatQA(options: UseChatQAOptions = {}) {
  const { context, selectedText } = options;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 추가
  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // 메시지 전송
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // 선택된 코드가 있으면 메시지 앞에 추가
    const messageToSend = selectedText
      ? `[선택한 코드: ${selectedText}]\n\n${trimmed}`
      : trimmed;

    // 사용자 메시지 추가 (UI에는 원본 표시)
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,  // UI에는 선택 코드 없이 표시
    };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // 대화 기록 생성
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      // AI 응답 요청 (선택 코드 포함된 메시지 전송)
      const response = await askAI(messageToSend, history, context);

      // AI 응답 추가
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
      });
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '오류가 발생했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, context, selectedText, addMessage]);

  // Enter 키 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // 메시지 초기화
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    input,
    setInput,
    messages,
    isLoading,
    messagesEndRef,
    sendMessage,
    handleKeyDown,
    clearMessages,
  };
}
