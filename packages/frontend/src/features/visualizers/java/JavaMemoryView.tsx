/**
 * Java Memory View
 * Stack + Heap 메모리 시각화
 */

import React, { useMemo } from 'react';
import { JavaStep } from './memory-types';
import { StackPanel } from './components/StackPanel';
import { HeapPanel } from './components/HeapPanel';
import { ReferenceArrows } from './components/ReferenceArrows';

export interface JavaMemoryViewProps {
  currentStep: JavaStep;
  theme?: 'dark' | 'soft' | 'minimal';
}

export function JavaMemoryView({ currentStep, theme = 'dark' }: JavaMemoryViewProps) {
  const { stack, heap } = currentStep;

  return (
    <div className={`java-memory-view theme-${theme}`}>
      <div className="memory-container">
        {/* 왼쪽: Stack */}
        <div className="stack-section">
          <h3 className="section-title">Stack</h3>
          <StackPanel frames={stack.frames} theme={theme} />
        </div>

        {/* 중앙: 참조 화살표 */}
        <div className="arrows-section">
          <ReferenceArrows
            stack={stack}
            heap={heap}
            theme={theme}
          />
        </div>

        {/* 오른쪽: Heap */}
        <div className="heap-section">
          <h3 className="section-title">Heap</h3>
          <HeapPanel objects={heap.objects} theme={theme} />
        </div>
      </div>

      {/* 하단: 출력 */}
      {currentStep.stdout && (
        <div className="output-section">
          <h3 className="section-title">Output</h3>
          <pre className="output-content">{currentStep.stdout}</pre>
        </div>
      )}

      <style jsx>{`
        .java-memory-view {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .memory-container {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2rem;
          flex: 1;
          overflow: hidden;
        }

        .stack-section,
        .heap-section {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .arrows-section {
          position: relative;
          width: 100px;
        }

        .section-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--accent-primary);
        }

        .output-section {
          border-top: 2px solid var(--border-color);
          padding-top: 1rem;
        }

        .output-content {
          background: var(--bg-secondary);
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          max-height: 150px;
          overflow-y: auto;
        }

        /* Dark Theme */
        .theme-dark {
          --bg-primary: #0a0e27;
          --bg-secondary: #131a35;
          --text-primary: #e0e7ff;
          --text-secondary: #94a3b8;
          --accent-primary: #38bdf8;
          --border-color: #1e293b;
        }

        /* Soft Theme */
        .theme-soft {
          --bg-primary: #f5f3ff;
          --bg-secondary: #ede9fe;
          --text-primary: #1e1b4b;
          --text-secondary: #6b7280;
          --accent-primary: #8b5cf6;
          --border-color: #d8b4fe;
        }

        /* Minimal Theme */
        .theme-minimal {
          --bg-primary: #fef3c7;
          --bg-secondary: #fde68a;
          --text-primary: #78350f;
          --text-secondary: #92400e;
          --accent-primary: #f59e0b;
          --border-color: #fcd34d;
        }
      `}</style>
    </div>
  );
}
