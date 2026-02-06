/**
 * StepExplanation - 스텝 설명 표시
 *
 * 우선순위:
 * 1. 레슨 JSON의 사전 작성된 설명 (step.explanation)
 * 2. AI 생성 설명 (explanationStore)
 *
 * AI 설명 사용 시 스트리밍 효과 표시
 * 반응형 지원 (모바일에서 더 컴팩트)
 */

import { Loader2 } from 'lucide-react';
import { useExplanation } from '../stores/explanationStore';
import type { SimulationStep } from '../stores/playgroundStore';

interface StepExplanationProps {
  step: SimulationStep;
  isMobile?: boolean;
}

export function StepExplanation({ step, isMobile = false }: StepExplanationProps) {
  // 1순위: 레슨 JSON의 사전 작성된 설명
  // 2순위: AI 생성 설명
  const hasPrewrittenExplanation = !!step.explanation;
  const { explanation: aiExplanation, isStreaming, streamingContent } = useExplanation(step.line, step.code);

  // 사전 작성된 설명이 있으면 그것을 사용, 없으면 AI 설명 사용
  const displayContent = hasPrewrittenExplanation
    ? step.explanation
    : (isStreaming ? streamingContent : aiExplanation);

  // AI 설명 사용 중일 때만 스트리밍 상태 표시
  const showStreaming = !hasPrewrittenExplanation && isStreaming;

  // 아직 설명이 없고 스트리밍도 아닌 경우 = 대기 중 (사전 작성 설명이 있으면 대기 안 함)
  const isWaiting = !hasPrewrittenExplanation && !displayContent && !isStreaming;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: isMobile ? '6px' : '8px',
      }}
    >
      {/* 라인 번호 */}
      <span
        style={{
          padding: isMobile ? '1px 5px' : '2px 8px',
          backgroundColor: 'var(--theme-explanation-button-text)',
          color: '#ffffff',
          fontSize: isMobile ? '9px' : '11px',
          fontWeight: 700,
          borderRadius: isMobile ? '3px' : '4px',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}
      >
        L{step.line}
      </span>

      {/* 설명 */}
      {isWaiting ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '6px',
            color: 'var(--theme-dashboard-text-muted)',
            fontSize: isMobile ? '11px' : '13px',
          }}
        >
          <Loader2 size={isMobile ? 12 : 14} className="animate-spin" />
          <span>대기 중...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? '4px' : '6px', flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? '11px' : '13px',
              color: 'var(--theme-explanation-text)',
              fontWeight: 500,
              lineHeight: isMobile ? 1.5 : 1.6,
              whiteSpace: 'pre-line',
              flex: 1,
            }}
          >
            {displayContent}
            {showStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: isMobile ? '12px' : '14px',
                  backgroundColor: 'var(--theme-explanation-button-text)',
                  marginLeft: '2px',
                  animation: 'blink 1s infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </p>
        </div>
      )}
    </div>
  );
}
