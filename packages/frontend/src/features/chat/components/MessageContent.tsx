/**
 * MessageContent Component
 * 마크다운 코드 블록 파싱 + 렌더링
 */

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`whitespace-pre-wrap break-words leading-relaxed text-sm min-w-0 w-full ${isUser ? '' : 'text-muted-foreground'}`}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <div key={i} className="my-3 rounded-lg border overflow-hidden min-w-0">
                {lang && (
                  <div className="px-3 py-1.5 bg-muted border-b">
                    <span className="text-xs text-muted-foreground font-mono">{lang}</span>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <pre className="p-3 bg-background text-muted-foreground text-sm">
                    <code className="font-mono whitespace-pre">{code.trim()}</code>
                  </pre>
                </div>
              </div>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
