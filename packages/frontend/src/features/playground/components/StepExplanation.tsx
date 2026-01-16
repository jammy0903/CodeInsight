/**
 * StepExplanation - AI 기반 스텝 설명 표시
 * explanationStore의 prefetch 큐에서 설명을 가져와 표시
 * 스트리밍 중인 경우 실시간으로 텍스트가 타이핑되는 효과
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
  const { explanation, isStreaming, streamingContent } = useExplanation(step.line, step.code);

  // 표시할 내용 결정
  const displayContent = isStreaming
    ? streamingContent
    : (explanation || step.explanation);

  // 아직 설명이 없고 스트리밍도 아닌 경우 = 대기 중
  const isWaiting = !displayContent && !isStreaming;

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
          backgroundColor: '#16a34a',
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
            color: '#9ca3af',
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
              color: '#166534',
              fontWeight: 500,
              lineHeight: isMobile ? 1.5 : 1.6,
              whiteSpace: 'pre-line',
              flex: 1,
            }}
          >
            {displayContent}
            {isStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: isMobile ? '12px' : '14px',
                  backgroundColor: '#16a34a',
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
