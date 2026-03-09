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
  illustrations?: Array<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
}

type ExplanationBlock =
  | { kind: 'text'; content: string }
  | { kind: 'brownBox'; content: string };

function forceLineBreaks(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/(니다\.)[ \t]*(?!\n)/g, '$1\n')
    .replace(/(다\.)[ \t]*(?!\n)/g, '$1\n')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * 간단한 텍스트 포맷팅
 * - **bold** → <strong>bold</strong>
 * - ```code``` → <code>code</code>
 * - \n\n → 단락 구분
 * - \n → <br/>
 */
function formatExplanation(text: string): React.ReactNode[] {
  const normalized = forceLineBreaks(text);
  // 단락별로 분리
  const paragraphs = normalized.split('\n\n');

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
            const boldInner = part.slice(2, -2);
            const boldInlineParts = boldInner.split(/(`[^`]+`)/g);
            return (
              <strong key={partIdx} className="font-bold text-amber-700">
                {boldInlineParts.map((inlinePart, inlineIdx) => {
                  if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
                    return (
                      <code
                        key={inlineIdx}
                        className="px-1.5 py-0.5 rounded text-[0.82em] font-mono bg-rose-50 text-rose-800 border border-rose-200"
                      >
                        {inlinePart.slice(1, -1)}
                      </code>
                    );
                  }
                  return <span key={inlineIdx}>{inlinePart}</span>;
                })}
              </strong>
            );
          }

          // `inline code` 처리
          const inlineCodeParts = part.split(/(`[^`]+`)/g);
          return (
            <span key={partIdx}>
              {inlineCodeParts.map((inlinePart, inlineIdx) => {
                if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
                  return (
                    <code
                      key={inlineIdx}
                      className="px-1.5 py-0.5 rounded text-[0.82em] font-mono bg-rose-50 text-rose-800 border border-rose-200"
                    >
                      {inlinePart.slice(1, -1)}
                    </code>
                  );
                }
                return <span key={inlineIdx}>{inlinePart}</span>;
              })}
            </span>
          );
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

function parseExplanationBlocks(text: string): ExplanationBlock[] {
  const blocks: ExplanationBlock[] = [];
  const pattern = /\[BROWN_BOX\]([\s\S]*?)\[\/BROWN_BOX\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ kind: 'text', content: text.slice(lastIndex, match.index) });
    }
    blocks.push({ kind: 'brownBox', content: match[1].trim() });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    blocks.push({ kind: 'text', content: text.slice(lastIndex) });
  }

  return blocks.length > 0 ? blocks : [{ kind: 'text', content: text }];
}

export function StepExplanation({ explanation, stepIndex, illustrations }: StepExplanationProps) {
  const blocks = parseExplanationBlocks(explanation || '');

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="text-lg leading-relaxed text-stack-text"
        style={{ fontFamily: 'var(--font-handwriting)' }}
      >
        {blocks.map((block, idx) => {
          if (block.kind === 'brownBox') {
            return (
              <div
                key={`brown-box-${idx}`}
                className="mt-4 rounded-xl border px-4 py-3 text-[0.92em]"
                style={{
                  background: '#f8f1e8',
                  borderColor: '#d6b899',
                  color: '#5a3f2a',
                }}
              >
                {formatExplanation(block.content)}
              </div>
            );
          }
          return <div key={`text-${idx}`}>{formatExplanation(block.content)}</div>;
        })}
        {Array.isArray(illustrations) && illustrations.length > 0 && (
          <div className="mt-4 space-y-3">
            {illustrations.map((item, idx) => (
              <figure key={`${item.src}-${idx}`} className="rounded-lg border border-amber-200 bg-white/80 p-2">
                <img
                  src={item.src}
                  alt={item.alt || 'lesson illustration'}
                  loading="lazy"
                  className="w-full h-auto rounded-md"
                />
                {item.caption && (
                  <figcaption className="mt-2 text-sm text-amber-800">{item.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
