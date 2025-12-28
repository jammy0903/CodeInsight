/**
 * QuizResult - 퀴즈 정답/오답 결과 표시
 */

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuizResultProps {
  isCorrect: boolean;
  explanation: string;
  onContinue: () => void;
  onRetry?: () => void;
}

export function QuizResult({
  isCorrect,
  explanation,
  onContinue,
  onRetry,
}: QuizResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* 결과 헤더 */}
      <div
        className={`flex items-center gap-3 p-4 rounded-lg ${
          isCorrect
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}
      >
        {isCorrect ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <XCircle className="w-6 h-6 text-red-500" />
        )}
        <span
          className={`font-semibold ${
            isCorrect ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {isCorrect ? '정답입니다!' : '틀렸습니다'}
        </span>
      </div>

      {/* 해설 */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
          <Lightbulb className="w-4 h-4" />
          해설
        </div>
        <p className="text-sm leading-relaxed">{explanation}</p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        {isCorrect ? (
          <Button onClick={onContinue} className="flex-1">
            다음으로
          </Button>
        ) : (
          <>
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="flex-1">
                다시 풀기
              </Button>
            )}
            <Button onClick={onContinue} className="flex-1">
              해설 확인 후 넘어가기
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
