/**
 * FlowVisualizer Component
 *
 * "코드가 살아 움직이는 시각화"의 메인 컴포넌트
 *
 * 기능:
 * - 변수를 박스로 시각화
 * - 값 변경 시 애니메이션
 * - 함수 프레임 표시
 * - 포인터/참조 화살표
 * - 제어 흐름 시각화 (if/else, 반복문)
 * - 터미널 출력 애니메이션
 */

import { memo, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { FlowStep, FlowVariable } from '@codeinsight/shared';
import { useFlowDiff } from './hooks/useFlowDiff';
import { useAnimationQueue } from './hooks/useAnimationQueue';
import { FunctionFrame } from './components/FunctionFrame';
import { ControlFlowOverlay } from './components/ControlFlowOverlay';
import { LoopTrack } from './components/LoopTrack';
import { TerminalOutputComponent } from './components/TerminalOutput';
import {
  FLOW_THEMES,
  FLOW_SIZES,
  type FlowTheme,
} from './styles';

// ============================================
// 타입 정의
// ============================================

interface FlowVisualizerProps {
  /** 현재 스텝 */
  step: FlowStep;
  /** 이전 스텝 (변경 감지용, null이면 첫 스텝) */
  prevStep?: FlowStep | null;
  /** 테마 */
  theme?: FlowTheme;
  /** 변수 클릭 핸들러 */
  onVariableClick?: (variable: FlowVariable) => void;
  /** 클래스명 */
  className?: string;
}

// ============================================
// 메인 컴포넌트
// ============================================

export const FlowVisualizer = memo(function FlowVisualizer({
  step,
  prevStep = null,
  theme = 'light',
  onVariableClick,
  className = '',
}: FlowVisualizerProps) {
  // 1. 변경 감지
  const diff = useFlowDiff(prevStep, step);

  // 2. 애니메이션 큐
  const animQueue = useAnimationQueue();

  // 3. 애니메이션 생성 및 실행
  const { addBatch, play } = animQueue;
  useEffect(() => {
    if (step.animations.length > 0) {
      addBatch(step.animations);
      play();
    }
  }, [step.animations, addBatch, play]);

  // 4. 프레임별 변수 그룹화
  const frameVariables = useMemo(() => {
    const result = new Map<string, FlowVariable[]>();

    // 기본 프레임 초기화
    step.frames.forEach((frame) => {
      result.set(frame.name, []);
    });

    // 변수를 프레임에 할당
    step.variables.forEach((variable) => {
      const frameName = variable.scope || 'main';
      const existing = result.get(frameName) || [];
      result.set(frameName, [...existing, variable]);
    });

    return result;
  }, [step.frames, step.variables]);

  // 5. 변수 클릭 핸들러 메모이제이션
  const handleVariableClick = useCallback(
    (variable: FlowVariable) => {
      onVariableClick?.(variable);
    },
    [onVariableClick]
  );

  const canvasStyle = FLOW_THEMES[theme].canvas;

  // 6. 터미널 출력 객체 메모이제이션
  // ⚠️ 중요: Date.now() 사용 금지!
  // 이전에 timestamp: Date.now()를 사용했더니 매 렌더마다 새 객체 생성 → 무한 애니메이션 재실행
  // text를 key로 사용하면 같은 출력일 때 안정적인 참조 유지
  const terminalOutputData = useMemo(() => {
    if (!step.terminalOutput) return null;
    return {
      type: 'stdout' as const,
      value: step.terminalOutput.text,
      timestamp: step.terminalOutput.text, // DO NOT use Date.now() here!
    };
  }, [step.terminalOutput]);

  return (
    <div
      className={`flow-visualizer w-full h-full overflow-auto p-4 ${className}`}
      style={{ backgroundColor: canvasStyle.background }}
    >
      {/* 프레임들 (콜스택 역순 - 최근 호출이 위) */}
      <div
        className="flex flex-col-reverse gap-6"
        style={{ gap: FLOW_SIZES.spacing.frameGap }}
      >
        <AnimatePresence mode="popLayout">
          {step.frames.map((frame, index) => {
            const variables = frameVariables.get(frame.name) || [];
            // 가장 최근 프레임 (배열 마지막)이 활성 프레임
            const isActive = index === step.frames.length - 1;
            // 이전 스텝에 없던 프레임이면 새로 생성
            const isNew = prevStep
              ? !prevStep.frames.some((f) => f.name === frame.name)
              : false;
            // 종료 예정 프레임 (controlFlow가 function-return이면)
            const isExiting =
              step.controlFlow?.type === 'function-return' &&
              step.controlFlow.functionName === frame.name;

            return (
              <FunctionFrame
                key={frame.name}
                name={frame.name}
                variables={variables}
                diff={diff}
                theme={theme}
                isActive={isActive}
                isNew={isNew}
                isExiting={isExiting}
                onVariableClick={handleVariableClick}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* 제어 흐름 표시 */}
      {step.controlFlow && (
        <div className="mt-4">
          {/* 반복문 (for/while/do-while) */}
          {(step.controlFlow.type === 'for' ||
            step.controlFlow.type === 'while' ||
            step.controlFlow.type === 'do-while') && (
            <LoopTrack
              controlFlow={step.controlFlow}
              theme={theme}
              maxIterations={10}
            />
          )}

          {/* 조건문 (if/else/switch) 및 함수 호출 */}
          {(step.controlFlow.type === 'if' ||
            step.controlFlow.type === 'else-if' ||
            step.controlFlow.type === 'else' ||
            step.controlFlow.type === 'switch' ||
            step.controlFlow.type === 'function-call' ||
            step.controlFlow.type === 'function-return') && (
            <ControlFlowOverlay controlFlow={step.controlFlow} theme={theme} />
          )}
        </div>
      )}

      {/* 터미널 출력 */}
      {terminalOutputData && (
        <div className="mt-4">
          <TerminalOutputComponent
            output={terminalOutputData}
            theme={theme}
          />
        </div>
      )}

      {/* 애니메이션 재생 중 표시 (디버그용, 프로덕션에서는 숨김) */}
      {import.meta.env.DEV && animQueue.isPlaying && (
        <div className="fixed top-2 right-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
          Animating...
        </div>
      )}
    </div>
  );
});

export default FlowVisualizer;
