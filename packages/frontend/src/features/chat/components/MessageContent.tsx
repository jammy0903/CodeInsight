/**
 * MessageContent Component
 * 마크다운 코드 블록 파싱 + 렌더링
 */

import { Card } from '@/components/ui/card';

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`whitespace-pre-wrap leading-relaxed text-sm ${isUser ? '' : 'text-muted-foreground'}`}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <Card key={i} className="my-3 overflow-hidden">
                {lang && (
                  <div className="px-3 py-1.5 bg-muted border-b">
                    <span className="text-xs text-muted-foreground font-mono">{lang}</span>
                  </div>
                )}
                <pre className="p-3 bg-background text-muted-foreground text-sm overflow-x-auto">
                  <code className="font-mono">{code.trim()}</code>
                </pre>
              </Card>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
