/**
 * StepExplanation - 현재 스텝 설명 카드
 *
 * WHY: 설명에 줄바꿈(\n)과 **굵은 글씨**가 포함될 수 있음
 * TRADEOFF: 마크다운 라이브러리 대신 간단한 커스텀 파싱 사용 (의존성 최소화)
 */

import { motion, AnimatePresence } from 'framer-motion';

interface StepExplanationProps {
  explanation: string;
  stepIndex: number;
}

/**
 * 간단한 텍스트 포맷팅
 * - **bold** → <strong>bold</strong>
 * - \n\n → 단락 구분
 * - \n → <br/>
 */
function formatExplanation(text: string): React.ReactNode[] {
  // 단락별로 분리
  const paragraphs = text.split('\n\n');

  return paragraphs.map((paragraph, pIdx) => {
    // 줄바꿈 처리
    const lines = paragraph.split('\n');

    const formattedLines = lines.map((line, lIdx) => {
      // **bold** 처리
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const formattedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={partIdx} className="font-bold text-amber-700">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <span key={lIdx}>
          {formattedParts}
          {lIdx < lines.length - 1 && <br />}
        </span>
      );
    });

    return (
      <p key={pIdx} className={pIdx > 0 ? 'mt-3' : ''}>
        {formattedLines}
      </p>
    );
  });
}

export function StepExplanation({ explanation, stepIndex }: StepExplanationProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="text-sm leading-relaxed text-stack-text"
      >
        {formatExplanation(explanation)}
      </motion.div>
    </AnimatePresence>
  );
}
