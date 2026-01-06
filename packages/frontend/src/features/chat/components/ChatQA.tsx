/**
 * ChatQA Component
 * Q&A 대화 인터페이스 (코스 컨텍스트 지원)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Trash2, MessageCircle } from 'lucide-react';
import { useChatQA } from '../hooks/useChatQA';
import { MessageContent } from './MessageContent';
import type { ChatContext } from '@/services/ai';

interface ChatQAProps {
  context?: ChatContext;
  selectedText?: string;  // 사용자가 선택한 코드
  disabled?: boolean;
  disabledMessage?: string;
}

export function ChatQA({
  context,
  selectedText,
  disabled = false,
  disabledMessage = '질문할 수 없습니다.',
}: ChatQAProps) {
  const {
    input,
    setInput,
    messages,
    isLoading,
    messagesEndRef,
    sendMessage,
    handleKeyDown,
    clearMessages,
  } = useChatQA({ context, selectedText });

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Q&A 대화</span>
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

            {isLoading && <LoadingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* 입력 영역 */}
      <div className="border-t px-4 py-3">
        {disabled ? (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">{disabledMessage}</p>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이해가 안 되는 부분을 질문하세요..."
              className="flex-1 min-h-[40px] max-h-[100px] resize-none text-sm"
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
  return (
    <div className="h-full flex items-center justify-center py-8">
      <div className="text-center">
        <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          이해가 안 되는 부분을 질문해보세요
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] ${isUser ? 'order-2' : ''}`}>
        <div className={`flex items-center gap-1.5 mb-1 ${isUser ? 'justify-end' : ''}`}>
          <Badge
            variant={isUser ? 'default' : 'secondary'}
            className="h-4 px-1.5 text-[10px] font-medium"
          >
            {isUser ? 'You' : 'AI'}
          </Badge>
        </div>

        <Card
          className={
            isUser
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/50'
          }
        >
          <CardContent className="p-3">
            <MessageContent content={message.content} isUser={isUser} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 로딩 인디케이터
function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-medium">
            AI
          </Badge>
        </div>
        <Card className="bg-muted/50">
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
              <span className="text-muted-foreground text-xs">생각 중...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
