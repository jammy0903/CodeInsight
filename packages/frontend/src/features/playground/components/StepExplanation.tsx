/**
 * StepExplanation - AI 기반 스텝 설명 표시
 * explanationStore의 prefetch 큐에서 설명을 가져와 표시
 * 스트리밍 중인 경우 실시간으로 텍스트가 타이핑되는 효과
 */

import { Loader2 } from 'lucide-react';
import { useExplanation } from '../stores/explanationStore';
import type { SimulationStep } from '../stores/playgroundStore';

interface StepExplanationProps {
  step: SimulationStep;
}

export function StepExplanation({ step }: StepExplanationProps) {
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
        gap: '8px',
      }}
    >
      {/* 라인 번호 */}
      <span
        style={{
          padding: '2px 8px',
          backgroundColor: '#16a34a',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 700,
          borderRadius: '4px',
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
            gap: '6px',
            color: '#9ca3af',
            fontSize: '13px',
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          <span>대기 중...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#166534',
              fontWeight: 500,
              lineHeight: 1.6,
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
                  height: '14px',
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
