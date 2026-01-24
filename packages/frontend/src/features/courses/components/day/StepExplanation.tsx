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
  line?: number;
  code?: string;
}

/**
 * 간단한 텍스트 포맷팅
 * - **bold** → <strong>bold</strong>
 * - ```code``` → <code>code</code>
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
      // ```code``` 처리 (먼저)
      const codeBlocks = line.split(/(```[^`]+```)/g);
      const formattedCodeBlocks = codeBlocks.map((block, blockIdx) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          // 코드 블록: ```C → C, ```python → python
          const codeContent = block.slice(3, -3);
          // 언어 라벨 제거 (첫 단어가 언어명인 경우)
          const cleanCode = codeContent.replace(/^(C|c|python|java|javascript)\s*/i, '');
          return (
            <code
              key={blockIdx}
              className="px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-cyan-400"
            >
              {cleanCode}
            </code>
          );
        }

        // **bold** 처리
        const parts = block.split(/(\*\*[^*]+\*\*)/g);
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

        return <span key={blockIdx}>{formattedParts}</span>;
      });

      return (
        <span key={lIdx}>
          {formattedCodeBlocks}
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

import { useExplanation } from '@/features/playground/stores/explanationStore';

// ... (existing helper function)

export function StepExplanation({ explanation, stepIndex, line, code }: StepExplanationProps) {
  // AI 설명 훅 사용 (line과 code가 있을 때만)
  const { explanation: aiExplanation, isStreaming, streamingContent } = useExplanation(line || 0, code || '');

  // 표시할 설명 결정: AI 설명만 사용 (미리 정해진 설명 무시)
  const displayExplanation = isStreaming ? streamingContent : (aiExplanation || '설명을 불러오는 중...');

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
        {isStreaming && <span className="text-xs text-blue-400 font-mono mb-1 block">🤖 AI 생성 중...</span>}
        {formatExplanation(displayExplanation || '')}
      </motion.div>
    </AnimatePresence>
  );
}
