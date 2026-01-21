/**
 * Stack Panel
 * 메서드 호출 스택 및 로컬 변수 시각화
 */

import React from 'react';
import { StackFrame, JavaValue } from '../memory-types';

export interface StackPanelProps {
  frames: StackFrame[];
  theme: 'dark' | 'soft' | 'minimal';
}

export function StackPanel({ frames, theme }: StackPanelProps) {
  if (frames.length === 0) {
    return <div className="stack-empty">No frames</div>;
  }

  return (
    <div className="stack-panel">
      {/* 역순으로 표시 (최신 프레임이 위에) */}
      {[...frames].reverse().map((frame, index) => (
        <FrameCard
          key={`${frame.methodName}-${frame.depth}`}
          frame={frame}
          theme={theme}
        />
      ))}

      <style jsx>{`
        .stack-panel {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stack-empty {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

interface FrameCardProps {
  frame: StackFrame;
  theme: 'dark' | 'soft' | 'minimal';
}

function FrameCard({ frame, theme }: FrameCardProps) {
  return (
    <div className={`frame-card theme-${theme}`}>
      {/* 프레임 헤더 */}
      <div className="frame-header">
        <span className="method-name">{frame.methodName}()</span>
        <span className="frame-depth">depth: {frame.depth}</span>
      </div>

      {/* 로컬 변수들 */}
      {frame.localVariables.length > 0 && (
        <div className="variables">
          {frame.localVariables.map(([name, value]) => (
            <Variable key={name} name={name} value={value} theme={theme} />
          ))}
        </div>
      )}

      <style jsx>{`
        .frame-card {
          background: var(--frame-bg);
          border: 2px solid var(--frame-border);
          border-radius: 0.5rem;
          padding: 0.75rem;
          transition: all 0.2s ease;
        }

        .frame-card:hover {
          transform: translateX(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .frame-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--frame-border);
        }

        .method-name {
          font-weight: 600;
          font-size: 1rem;
          color: var(--method-color);
        }

        .frame-depth {
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: var(--depth-bg);
          padding: 0.2rem 0.5rem;
          border-radius: 0.25rem;
        }

        .variables {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Dark Theme */
        .theme-dark {
          --frame-bg: #1e293b;
          --frame-border: #334155;
          --method-color: #38bdf8;
          --depth-bg: #0f172a;
        }

        /* Soft Theme */
        .theme-soft {
          --frame-bg: #ede9fe;
          --frame-border: #c4b5fd;
          --method-color: #7c3aed;
          --depth-bg: #ddd6fe;
        }

        /* Minimal Theme */
        .theme-minimal {
          --frame-bg: #fef3c7;
          --frame-border: #fcd34d;
          --method-color: #d97706;
          --depth-bg: #fde68a;
        }
      `}</style>
    </div>
  );
}

interface VariableProps {
  name: string;
  value: JavaValue;
  theme: 'dark' | 'soft' | 'minimal';
}

function Variable({ name, value, theme }: VariableProps) {
  const valueDisplay = value.isReference
    ? (value.objectId ? `@${value.objectId}` : 'null')
    : String(value.value);

  const typeDisplay = value.type;

  return (
    <div className={`variable theme-${theme}`} data-var-name={name}>
      <span className="var-name">{name}</span>
      <span className="var-type">{typeDisplay}</span>
      <span className={`var-value ${value.isReference ? 'reference' : 'primitive'}`}>
        {valueDisplay}
      </span>

      <style jsx>{`
        .variable {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 0.5rem;
          align-items: center;
          padding: 0.4rem 0.6rem;
          background: var(--var-bg);
          border-radius: 0.25rem;
          font-size: 0.85rem;
        }

        .var-name {
          font-weight: 500;
          color: var(--var-name-color);
        }

        .var-type {
          font-size: 0.75rem;
          color: var(--text-secondary);
          padding: 0.1rem 0.4rem;
          background: var(--type-bg);
          border-radius: 0.2rem;
        }

        .var-value {
          font-family: 'Fira Code', monospace;
          font-weight: 500;
        }

        .var-value.primitive {
          color: var(--primitive-color);
        }

        .var-value.reference {
          color: var(--reference-color);
          font-weight: 600;
        }

        /* Dark Theme */
        .theme-dark {
          --var-bg: #0f172a;
          --var-name-color: #e0e7ff;
          --type-bg: #1e293b;
          --primitive-color: #a5f3fc;
          --reference-color: #fbbf24;
        }

        /* Soft Theme */
        .theme-soft {
          --var-bg: #f5f3ff;
          --var-name-color: #4c1d95;
          --type-bg: #ede9fe;
          --primitive-color: #7c3aed;
          --reference-color: #ea580c;
        }

        /* Minimal Theme */
        .theme-minimal {
          --var-bg: #fde68a;
          --var-name-color: #78350f;
          --type-bg: #fed7aa;
          --primitive-color: #b45309;
          --reference-color: #dc2626;
        }
      `}</style>
    </div>
  );
}
