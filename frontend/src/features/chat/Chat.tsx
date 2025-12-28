/**
 * Chat Component
 * AI 해설자 채팅 인터페이스
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Trash2, Sparkles, ChevronRight } from 'lucide-react';
import { useChat } from './hooks/useChat';
import { MessageContent } from './components/MessageContent';

// 추천 질문 (C/메모리)
const SUGGESTIONS = [
  { icon: '📍', text: '포인터가 뭐야?' },
  { icon: '🔄', text: '왜 *를 붙이면 값이 바뀌어?' },
  { icon: '📦', text: 'Stack과 Heap의 차이가 뭐야?' },
];

export function Chat() {
  const {
    input,
    setInput,
    messages,
    isAiLoading,
    messagesEndRef,
    sendMessage,
    handleKeyDown,
    clearMessages,
  } = useChat();

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={setInput} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isAiLoading && <LoadingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-4 py-3 bg-card shrink-0">
        <div className="max-w-3xl mx-auto">
          <Card className="p-2">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="코드 실행 원리에 대해 질문하세요..."
                aria-label="Chat message input"
                className="flex-1 border-0 bg-transparent px-2 py-1.5 resize-none text-sm focus-visible:ring-0 min-h-[36px] max-h-[100px]"
                rows={1}
                disabled={isAiLoading}
              />
              <div className="flex items-center gap-2 shrink-0">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMessages}
                    aria-label="Clear chat history"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    초기화
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={isAiLoading || !input.trim()}
                  aria-label="Send message"
                >
                  {isAiLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  전송
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 빈 상태 (추천 질문 표시)
function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto py-12">
      <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-2">AI 해설자</h2>
      <p className="text-muted-foreground text-sm mb-8 text-center">
        코드 실행 원리에 대해 질문해보세요
      </p>

      <div className="grid grid-cols-1 gap-2 w-full">
        {SUGGESTIONS.map(({ icon, text }) => (
          <Card
            key={text}
            className="cursor-pointer hover:border-primary/50 transition-all group"
            onClick={() => onSuggestionClick(text)}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-base">{icon}</span>
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                {text}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 메시지 버블
function MessageBubble({ message }: { message: { id: string; role: 'user' | 'assistant'; content: string } }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : ''}`}>
          <Badge
            variant={isUser ? 'default' : 'secondary'}
            className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-medium"
          >
            {isUser ? 'U' : 'AI'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {isUser ? 'You' : 'AI 해설자'}
          </span>
        </div>

        <Card className={isUser ? 'bg-primary text-primary-foreground border-primary' : ''}>
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
      <div className="max-w-[85%]">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-medium">
            AI
          </Badge>
          <span className="text-xs text-muted-foreground">AI 해설자</span>
        </div>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-muted-foreground text-sm">생각 중...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
