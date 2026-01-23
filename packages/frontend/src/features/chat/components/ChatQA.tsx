/**
 * ChatQA Component
 * Q&A 대화 인터페이스 (코스 컨텍스트 지원)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Trash2, MessageCircle, Clock } from 'lucide-react';
import { useChatQA } from '../hooks/useChatQA';
import { MessageContent } from './MessageContent';
import type { ChatContext } from '@/services/ai';
import { useThemeStore } from '@/stores/themeStore';
import { themes } from '@/config/themes';
import { useStore } from '@/stores/store'; // useStore import 추가

// 테마별 채팅 색상 (zinc + cyan 팔레트)
const chatColors = {
  // ...
};

interface ChatQAProps {
  context?: ChatContext;
  selectedText?: string;  // 사용자가 선택한 코드
  disabled?: boolean;
  disabledMessage?: string;
  // 분석 리포트용 옵션
  lessonId?: string;
  contextType?: 'lesson' | 'playground' | 'general';
}

export function ChatQA({
  context,
  selectedText,
  disabled = false,
  disabledMessage = '질문할 수 없습니다.',
  lessonId,
  contextType = 'general',
}: ChatQAProps) {
  const appUser = useStore((state) => state.appUser); // appUser 가져오기
  const {
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
  } = useChatQA({ context, selectedText, lessonId, contextType, currentUserId: appUser?.id });

  const currentTheme = useThemeStore((s) => s.theme);
  const colors = chatColors[currentTheme] || chatColors.dark;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${colors.headerBorder}` }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium" style={{ color: colors.headerText }}>
            Q&A 대화
          </span>
          {expiresAt && messages.length > 0 && (
            <ExpiryCountdown expiresAt={expiresAt} />
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="btn-danger px-2 py-1 text-xs flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            초기화
          </button>
        )}
      </div>

      {/* 메시지 영역 */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && (
              streamingContent ? (
                <StreamingMessage content={streamingContent} />
              ) : (
                <LoadingIndicator />
              )
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* 입력 영역 */}
      <div
        className="px-4 py-3"
        style={{ borderTop: `1px solid ${colors.headerBorder}` }}
      >
        {disabled ? (
          <div className="text-center py-2">
            <p className="text-sm" style={{ color: colors.mutedText }}>{disabledMessage}</p>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이해가 안 되는 부분을 질문하세요..."
              className="flex-1 min-h-[40px] max-h-[100px] resize-none text-sm"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              }}
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className={`btn-cyan px-3 py-2 ${isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 빈 상태
function EmptyState() {
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = chatColors[currentTheme];

  return (
    <div className="h-full flex items-center justify-center py-8">
      <div className="text-center">
        <MessageCircle
          className="h-10 w-10 mx-auto mb-3"
          style={{ color: colors.mutedText, opacity: 0.3 }}
        />
        <p className="text-sm" style={{ color: colors.mutedText }}>
          이해가 안 되는 부분을 질문해보세요
        </p>
        <p className="text-xs mt-1" style={{ color: colors.mutedText, opacity: 0.7 }}>
          예: &quot;왜 *를 붙이면 값이 바뀌어?&quot;
        </p>
      </div>
    </div>
  );
}

// 메시지 버블
function MessageBubble({
  message,
}: {
  message: { id: string; role: 'user' | 'assistant'; content: string };
}) {
  const isUser = message.role === 'user';
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = chatColors[currentTheme];

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] min-w-0 ${isUser ? 'order-2' : ''}`}>
        <div className={`flex items-center gap-1.5 mb-1 ${isUser ? 'justify-end' : ''}`}>
          <Badge
            variant={isUser ? 'default' : 'secondary'}
            className="h-4 px-1.5 text-[10px] font-medium"
            style={!isUser ? {
              backgroundColor: colors.badgeAiBg,
              color: colors.badgeAiText,
            } : undefined}
          >
            {isUser ? 'You' : 'AI'}
          </Badge>
        </div>

        <Card
          className="overflow-hidden"
          style={{
            backgroundColor: isUser ? colors.userBubbleBg : colors.aiBubbleBg,
            borderColor: isUser ? colors.userBubbleBorder : colors.aiBubbleBorder,
            color: isUser ? colors.userBubbleText : colors.aiBubbleText,
          }}
        >
          <CardContent className="p-3 overflow-x-auto">
            <MessageContent content={message.content} isUser={isUser} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 스트리밍 메시지 (실시간 응답)
function StreamingMessage({ content }: { content: string }) {
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = chatColors[currentTheme];

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-medium"
            style={{
              backgroundColor: colors.badgeAiBg,
              color: colors.badgeAiText,
            }}
          >
            AI
          </Badge>
          <span
            className="text-[10px] animate-pulse"
            style={{ color: colors.aiBubbleText }}
          >
            응답 중...
          </span>
        </div>
        <Card
          className="overflow-hidden"
          style={{
            backgroundColor: colors.aiBubbleBg,
            borderColor: colors.aiBubbleBorder,
            color: colors.aiBubbleText,
          }}
        >
          <CardContent className="p-3 overflow-x-auto">
            <MessageContent content={content} isUser={false} />
            <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 로딩 인디케이터
function LoadingIndicator() {
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = chatColors[currentTheme];

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-medium"
            style={{
              backgroundColor: colors.badgeAiBg,
              color: colors.badgeAiText,
            }}
          >
            AI
          </Badge>
        </div>
        <Card
          style={{
            backgroundColor: colors.aiBubbleBg,
            borderColor: colors.aiBubbleBorder,
          }}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="text-xs" style={{ color: colors.aiBubbleText }}>
                생각 중...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 만료 카운트다운
function ExpiryCountdown({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState('');
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = chatColors[currentTheme];

  useEffect(() => {
    const updateRemaining = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setRemaining('만료됨');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span
      className="text-[10px] flex items-center gap-1"
      style={{ color: colors.mutedText }}
    >
      <Clock className="h-3 w-3" />
      {remaining} 후 삭제
    </span>
  );
}
