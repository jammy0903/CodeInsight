/**
 * useChatQA Hook
 * Q&A 대화 로직 관리 (context 지원, 스트리밍 지원, localStorage 저장)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { askAIStream } from '@/services/ai';
import type { ChatContext } from '@/services/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface StoredChat {
  messages: Message[];
  timestamp: number;
}

interface UseChatQAOptions {
  context?: ChatContext;
  selectedText?: string;  // 사용자가 선택한 코드
}

const STORAGE_PREFIX = 'codeinsight_chat_';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간

/**
 * 레슨별 저장 키 생성
 */
function getStorageKey(context?: ChatContext): string {
  if (context?.courseDay && context?.topic) {
    // 레슨별 저장: "codeinsight_chat_day3_포인터"
    return `${STORAGE_PREFIX}day${context.courseDay}_${context.topic}`;
  }
  // 일반 채팅
  return `${STORAGE_PREFIX}global`;
}

/**
 * localStorage에서 대화 불러오기 (24시간 이내만)
 */
function loadMessages(key: string): { messages: Message[]; expiresAt: number | null } {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return { messages: [], expiresAt: null };

    const data: StoredChat = JSON.parse(stored);
    const now = Date.now();
    const expiresAt = data.timestamp + EXPIRY_MS;

    // 24시간 지났으면 삭제
    if (now > expiresAt) {
      localStorage.removeItem(key);
      return { messages: [], expiresAt: null };
    }

    return { messages: data.messages, expiresAt };
  } catch {
    return { messages: [], expiresAt: null };
  }
}

/**
 * localStorage에 대화 저장
 */
function saveMessages(key: string, messages: Message[]): void {
  try {
    const data: StoredChat = {
      messages,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // 저장 실패 (용량 초과 등) - 무시
  }
}

export function useChatQA(options: UseChatQAOptions = {}) {
  const { context, selectedText } = options;

  const storageKey = getStorageKey(context);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(storageKey).messages);
  const [expiresAt, setExpiresAt] = useState<number | null>(() => loadMessages(storageKey).expiresAt);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // context 변경 시 해당 레슨의 대화 불러오기
  useEffect(() => {
    const loaded = loadMessages(storageKey);
    setMessages(loaded.messages);
    setExpiresAt(loaded.expiresAt);
  }, [storageKey]);

  // 메시지 변경 시 localStorage에 저장 + expiresAt 갱신
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(storageKey, messages);
      // 새 메시지 추가 시 만료 시간 갱신
      setExpiresAt(Date.now() + EXPIRY_MS);
    }
  }, [messages, storageKey]);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 메시지 추가
  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // 메시지 전송 (스트리밍)
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
    setStreamingContent('');

    try {
      // 대화 기록 생성
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      // AI 응답 요청 (스트리밍)
      const fullResponse = await askAIStream(
        messageToSend,
        history,
        context,
        (chunk) => {
          // 청크 수신 시 실시간 업데이트
          setStreamingContent((prev) => prev + chunk);
        }
      );

      // 스트리밍 완료 후 메시지로 추가
      setStreamingContent('');
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullResponse,
      });
    } catch {
      setStreamingContent('');
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

  // 메시지 초기화 (localStorage도 삭제)
  const clearMessages = useCallback(() => {
    setMessages([]);
    setExpiresAt(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    input,
    setInput,
    messages,
    isLoading,
    streamingContent,
    expiresAt,
    messagesEndRef,
    sendMessage,
    handleKeyDown,
    clearMessages,
  };
}
