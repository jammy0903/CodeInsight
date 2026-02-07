/**
 * LessonFlowVisualizer Component
 *
 * LessonStep을 받아서 FlowVisualizer에 전달
 * - 언어별 어댑터로 LessonStep → FlowStep 변환
 * - 포인터 화살표 렌더링
 */

import { memo, useMemo, useRef } from 'react';
import type { LessonStep, FlowLanguage, FlowVariable } from '@codeinsight/shared';
import { FlowVisualizer } from './FlowVisualizer';
import { PythonFlowView } from './components/PythonFlowView';
import { JavaFlowView } from './components/JavaFlowView';
import { JSFlowView } from './components/JSFlowView';
import { EventLoopView } from './components/EventLoopView';
import { ArrowLayer } from './components/ArrowLayer';
import { getAdapter, createAdapter } from './adapters';
import type { FlowTheme } from './styles';

// ============================================
// 타입 정의
// ============================================

interface MemoryState {
  stack: Array<{ name: string; type?: string; value: string; address?: string; points_to?: string | null }>;
  heap: Array<{ name?: string; type?: string; value: string; address?: string; points_to?: string | null }>;
  frames?: Array<{ name: string }>;
}

interface LessonFlowVisualizerProps {
  /** 현재 LessonStep */
  step: LessonStep;
  /** 이전 LessonStep (변경 감지용) */
  prevStep?: LessonStep | null;
  /** 언어 */
  language?: FlowLanguage | string;
  /** 전체 코드 (step.code가 없을 때 line에서 추출) */
  fullCode?: string;
  /** 테마 */
  theme?: FlowTheme;
  /** 변수 클릭 핸들러 */
  onVariableClick?: (variable: FlowVariable) => void;
  /** 클래스명 */
  className?: string;
  /** 화살표 표시 여부 */
  showArrows?: boolean;
  /** 계산된 메모리 상태 (useLessonVisualization에서 전달) */
  memoryState?: MemoryState;
  /** 이전 메모리 상태 */
  prevMemoryState?: MemoryState;
  /** 터미널 출력 (현재 스텝의 stdout) */
  stdout?: string;
}

// ============================================
// 컴포넌트
// ============================================

export const LessonFlowVisualizer = memo(function LessonFlowVisualizer({
  step,
  prevStep = null,
  language = 'c',
  fullCode,
  theme = 'light',
  onVariableClick,
  className = '',
  showArrows = true,
  memoryState,
  prevMemoryState,
  stdout,
}: LessonFlowVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // DEBUG: 입력 데이터 확인
  if (process.env.NODE_ENV === 'development') {
    const swapVars = step.stack?.filter(b =>
      b?.name && (b.name.includes('swap.') || b.name.includes('.temp') || b.name === 'temp')
    );
    if (swapVars && swapVars.length > 0) {
      console.log('[LessonFlowVisualizer] 📥 swap variables in step:', JSON.stringify(swapVars, null, 2));
      console.log('[LessonFlowVisualizer] 📥 memoryState provided:', !!memoryState);
    }
  }

  // 1. 어댑터 가져오기 (테마 적용)
  const adapter = useMemo(
    () => createAdapter(language, theme),
    [language, theme]
  );

  // 2. memoryState와 stdout을 step에 병합
  // JavaScript는 원본 step.stack/heap 형식을 사용 (JSTransformer가 {methodName, variables} 형식 기대)
  const enrichedStep = useMemo(() => {
    const enriched = { ...step };

    // JavaScript는 memoryState 덮어쓰기 안 함 - 원본 형식 유지
    const isJavaScript = language === 'javascript' || language === 'js';
    if (memoryState && !isJavaScript) {
      enriched.stack = memoryState.stack as LessonStep['stack'];
      enriched.heap = memoryState.heap as LessonStep['heap'];
    }

    // stdout이 제공되면 추가
    if (stdout) {
      enriched.stdout = stdout;
    }

    return enriched;
  }, [step, memoryState, stdout, language]);

  const enrichedPrevStep = useMemo(() => {
    if (!prevStep) return null;
    if (!prevMemoryState) return prevStep;
    // JavaScript는 memoryState 덮어쓰기 안 함 - 원본 형식 유지
    const isJavaScript = language === 'javascript' || language === 'js';
    if (isJavaScript) return prevStep;
    return {
      ...prevStep,
      stack: prevMemoryState.stack as LessonStep['stack'],
      heap: prevMemoryState.heap as LessonStep['heap'],
    };
  }, [prevStep, prevMemoryState, language]);

  // 3. LessonStep → FlowStep 변환
  const flowStep = useMemo(
    () => adapter.transformer.transform(enrichedStep, enrichedPrevStep ?? undefined, fullCode),
    [adapter, enrichedStep, enrichedPrevStep, fullCode]
  );

  // 4. 이전 FlowStep 변환 (diff 계산용)
  const prevFlowStep = useMemo(
    () => (enrichedPrevStep ? adapter.transformer.transform(enrichedPrevStep, undefined, fullCode) : null),
    [adapter, enrichedPrevStep, fullCode]
  );

  // 5. 애니메이션 생성 (diff 기반)
  const flowStepWithAnimations = useMemo(() => {
    if (!prevFlowStep) {
      // 첫 스텝: 모든 변수 생성 애니메이션
      const animations = flowStep.variables.flatMap((v) =>
        adapter.animator.createVariableAnimations(v)
      );
      return { ...flowStep, animations };
    }

    // diff 기반 애니메이션
    const diff = {
      created: flowStep.variables
        .filter((v) => !prevFlowStep.variables.find((pv) => pv.id === v.id))
        .map((v) => v.id),
      updated: flowStep.variables
        .filter((v) => {
          const prev = prevFlowStep.variables.find((pv) => pv.id === v.id);
          return prev && prev.value !== v.value;
        })
        .map((v) => v.id),
      deleted: prevFlowStep.variables
        .filter((pv) => !flowStep.variables.find((v) => v.id === pv.id))
        .map((pv) => pv.id),
      unchanged: flowStep.variables
        .filter((v) => {
          const prev = prevFlowStep.variables.find((pv) => pv.id === v.id);
          return prev && prev.value === v.value;
        })
        .map((v) => v.id),
    };

    const animations = adapter.animator.createAnimationsFromDiff(diff, flowStep, prevFlowStep);
    return { ...flowStep, animations };
  }, [flowStep, prevFlowStep, adapter]);

  // Python은 전용 뷰 사용 (포스트잇 비유)
  if (language === 'python') {
    return (
      <div className={className}>
        <PythonFlowView
          step={flowStepWithAnimations}
          prevStep={prevFlowStep}
        />
      </div>
    );
  }

  // Java는 전용 뷰 사용 (호버 하이라이트, 화살표 없음)
  if (language === 'java') {
    return (
      <div className={className}>
        <JavaFlowView
          step={flowStepWithAnimations}
          prevStep={prevFlowStep}
        />
      </div>
    );
  }

  // JavaScript: eventLoopState가 있고 표준 필드(callStack/webApis/taskQueue)가 존재하면 EventLoop 전용 시각화
  const els = (step as any).eventLoopState;
  const hasStandardEventLoop = els && (els.callStack || els.webApis || els.taskQueue || els.microtaskQueue);
  if ((language === 'javascript' || language === 'js') && hasStandardEventLoop) {
    return (
      <div className={className}>
        <EventLoopView
          eventLoopState={(step as any).eventLoopState}
          prevEventLoopState={(prevStep as any)?.eventLoopState}
        />
      </div>
    );
  }

  // JavaScript는 전용 뷰 사용 (호버 하이라이트, 화살표 없음, 초급자 친화적)
  if (language === 'javascript' || language === 'js') {
    return (
      <div className={className}>
        <JSFlowView
          step={flowStepWithAnimations}
          prevStep={prevFlowStep}
        />
      </div>
    );
  }

  // C 등은 기존 FlowVisualizer 사용
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <FlowVisualizer
        step={flowStepWithAnimations}
        prevStep={prevFlowStep}
        theme={theme}
        onVariableClick={onVariableClick}
      />

      {/* 포인터 화살표 (C 전용) */}
      {showArrows && (
        <ArrowLayer
          variables={flowStepWithAnimations.variables}
          styler={adapter.styler}
          containerRef={containerRef}
        />
      )}
    </div>
  );
});

export default LessonFlowVisualizer;
