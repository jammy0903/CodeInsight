/**
 * AutoExplanation Component
 * 현재 줄에 대한 자동 해설 표시 (debounce 적용)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb } from 'lucide-react';
import { getExplanation } from '@/services/ai';

interface AutoExplanationProps {
  line: number;
  code: string;
  topic?: string;
  debounceMs?: number;
}

// 간단한 debounce 훅
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function AutoExplanation({
  line,
  code,
  topic,
  debounceMs = 400,
}: AutoExplanationProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchedLine, setLastFetchedLine] = useState<number | null>(null);

  // debounce된 줄 번호
  const debouncedLine = useDebounce(line, debounceMs);

  // 줄이 변경되면 해설 요청
  useEffect(() => {
    // 같은 줄이면 스킵
    if (debouncedLine === lastFetchedLine) return;
    // 유효하지 않은 줄이면 스킵
    if (debouncedLine < 1) return;

    const fetchExplanation = async () => {
      setIsLoading(true);
      try {
        const result = await getExplanation(debouncedLine, code, topic);
        setExplanation(result);
        setLastFetchedLine(debouncedLine);
      } catch (error) {
        setExplanation('해설을 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplanation();
  }, [debouncedLine, code, topic, lastFetchedLine]);

  // 코드가 변경되면 캐시 초기화
  useEffect(() => {
    setLastFetchedLine(null);
    setExplanation('');
  }, [code]);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 아이콘 */}
          <div className="shrink-0 mt-0.5">
            <Badge
              variant="secondary"
              className="h-7 w-7 p-0 flex items-center justify-center bg-primary/15"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Lightbulb className="h-4 w-4 text-primary" />
              )}
            </Badge>
          </div>

          {/* 해설 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-primary">
                자동 해설
              </span>
              <span className="text-xs text-muted-foreground">
                Line {line}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>해설 생성 중...</span>
              </div>
            ) : explanation ? (
              <p className="text-sm text-foreground leading-relaxed">
                {explanation}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                코드 줄을 선택하면 해설이 표시됩니다.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
