/**
 * PlaygroundPage.tsx
 *
 * CodeInsight의 메인 플레이그라운드 페이지
 * - 코드 에디터, 시뮬레이터, 시각화를 통합
 * - Zustand로 상태 관리
 * - Framer Motion으로 애니메이션 처리
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePlaygroundStore } from '@/stores/usePlaygroundStore';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Visualizer } from '@/components/visualizer/Visualizer';
import { ControlBar } from '@/components/editor/ControlBar';
import { handleSimulatorError } from '@/components/common/Toast';
import { useExecuteCode } from '@/hooks/useExecuteCode';

/**
 * Props 인터페이스 (필요시)
 */
interface PlaygroundPageProps {
  initialLanguage?: 'c' | 'python' | 'js' | 'java';
}

/**
 * 메인 컴포넌트
 */
export const PlaygroundPage: React.FC<PlaygroundPageProps> = ({
  initialLanguage = 'c',
}) => {
  // Zustand 스토어 연결
  const { code, language, steps, currentStep, isExecuting } = usePlaygroundStore(
    (state) => ({
      code: state.code,
      language: state.language,
      steps: state.steps,
      currentStep: state.currentStep,
      isExecuting: state.isExecuting,
    })
  );

  // 커스텀 훅 (API 호출 로직 분리)
  const { executeCode } = useExecuteCode();

  // 초기값 설정
  useEffect(() => {
    if (initialLanguage) {
      usePlaygroundStore.setState({ language: initialLanguage });
    }
  }, [initialLanguage]);

  /**
   * 실행 핸들러
   * - Zustand의 async action 활용
   * - 에러 처리를 중앙화 (Toast)
   */
  const handleExecute = async () => {
    try {
      await executeCode(code, language);
    } catch (error) {
      // 에러는 Toast로 자동 처리됨 (handleSimulatorError 내부)
      handleSimulatorError(language, error as Error);
    }
  };

  // 레이아웃 애니메이션 variants
  const layoutVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="flex h-screen bg-slate-900 text-slate-100"
      variants={layoutVariants}
      initial="initial"
      animate="animate"
    >
      {/* 왼쪽: 에디터 영역 */}
      <div className="flex flex-col flex-1 border-r border-slate-700">
        <ControlBar
          language={language}
          isExecuting={isExecuting}
          onExecute={handleExecute}
        />
        <CodeEditor
          code={code}
          language={language}
          onChange={(newCode) => usePlaygroundStore.setState({ code: newCode })}
          isLoading={isExecuting}
        />
      </div>

      {/* 오른쪽: 시각화 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {steps.length > 0 ? (
          <Visualizer
            steps={steps}
            currentStep={currentStep}
            onStepChange={(step) =>
              usePlaygroundStore.setState({ currentStep: step })
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400">
              코드를 실행하면 시각화가 표시됩니다
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 설계 원칙:
 *
 * 1. ✅ Props 최소화
 *    - 필요한 초기값만 props로 받음
 *    - 상태는 Zustand로 관리
 *
 * 2. ✅ 에러 처리 중앙화
 *    - handleSimulatorError() 사용
 *    - 토스트 알림은 자동으로 처리됨
 *
 * 3. ✅ 비동기 로직 분리
 *    - useExecuteCode() 커스텀 훅으로 API 호출 분리
 *    - 테스트와 재사용이 용이
 *
 * 4. ✅ 애니메이션은 Variants
 *    - Hardcoded animation 금지
 *    - 모든 애니메이션은 state 기반
 *
 * 5. ✅ 상태 업데이트는 함수형
 *    - usePlaygroundStore.setState({ ... })
 *    - 불변성 보장
 */
