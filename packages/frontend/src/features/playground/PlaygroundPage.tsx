/**
 * PlaygroundPage - 코드 시뮬레이터
 * 왼쪽: 코드 에디터 + 설명 | 오른쪽: 메모리 뷰어
 */

import { useState, useCallback } from 'react';
import { Cpu } from 'lucide-react';
import { LanguageTabs } from './components/LanguageTabs';
import { CodeEditor } from './components/CodeEditor';
import { StepControls } from './components/StepControls';
import { StepExplanation } from './components/StepExplanation';
import { VisualizerPanel } from './components/VisualizerPanel';
import { usePlaygroundStore } from './stores/playgroundStore';

export function PlaygroundPage() {
  const { language, steps, currentStepIndex, error } = usePlaygroundStore();
  const [leftWidth, setLeftWidth] = useState(50);

  const currentStep = steps[currentStepIndex];
  const hasSteps = steps.length > 0;

  // 드래그 리사이저
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('playground-main');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / containerRect.width) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 30), 70);
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftWidth]);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: '#0d1117',
        overflowY: 'auto',
        paddingBottom: currentStep ? '80px' : '0',
      }}
    >
      {/* 메인 영역: 코드 + 메모리 (가로 분할) */}
      <div
        id="playground-main"
        style={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* ===== 왼쪽: 코드 에디터 + 설명 ===== */}
        <div
          style={{
            width: `${leftWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #30363d',
            minWidth: 0,
          }}
        >
          {/* 코드 헤더: 언어탭 + 컨트롤 버튼 */}
          <div
            style={{
              height: '44px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #30363d',
              backgroundColor: '#161b22',
              flexShrink: 0,
            }}
          >
            <LanguageTabs />
            <StepControls />
          </div>

          {/* 에디터 (내부 스크롤) */}
          <div style={{ height: '50vh', minHeight: '300px', overflow: 'hidden' }}>
            <CodeEditor />
          </div>

        </div>

        {/* 리사이저 */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '4px',
            backgroundColor: '#30363d',
            cursor: 'col-resize',
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#58a6ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#30363d';
          }}
        />

        {/* ===== 오른쪽: 메모리 뷰어 ===== */}
        <div
          style={{
            width: `${100 - leftWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          {/* 메모리 헤더 */}
          <div
            style={{
              height: '44px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #30363d',
              backgroundColor: '#161b22',
              flexShrink: 0,
            }}
          >
            <Cpu size={16} color="#3fb950" />
            <span style={{ fontSize: '13px', color: '#c9d1d9', fontWeight: 500 }}>Memory View</span>
            {hasSteps && (
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: '#3fb950',
                  fontFamily: 'monospace',
                  background: 'rgba(63, 185, 80, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(63, 185, 80, 0.2)',
                }}
              >
                Step {currentStepIndex + 1}/{steps.length}
              </span>
            )}
          </div>

          {/* 메모리 시각화 */}
          <div style={{ padding: '16px', flex: 1 }}>
            {error ? (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(248, 81, 73, 0.1)',
                  border: '1px solid rgba(248, 81, 73, 0.3)',
                  borderRadius: '8px',
                }}
              >
                <p style={{ color: '#f85149', fontSize: '14px', fontFamily: 'monospace', margin: 0 }}>
                  {error}
                </p>
              </div>
            ) : hasSteps ? (
              <VisualizerPanel />
            ) : (
              <div
                style={{
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 16px',
                      borderRadius: '12px',
                      background: 'rgba(63, 185, 80, 0.1)',
                      border: '1px solid rgba(63, 185, 80, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Cpu size={28} color="#3fb950" />
                  </div>
                  <p style={{ color: '#c9d1d9', fontSize: '14px', margin: '0 0 4px 0' }}>
                    메모리 시각화
                  </p>
                  <p style={{ color: '#6e7681', fontSize: '12px', margin: 0 }}>
                    코드를 작성하고 Run을 클릭하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 설명 (화면 하단 고정) */}
      {currentStep && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 24px',
            backgroundColor: '#161b22',
            borderTop: '2px solid #3fb950',
            zIndex: 100,
          }}
        >
          <StepExplanation step={currentStep} />
        </div>
      )}
    </div>
  );
}
