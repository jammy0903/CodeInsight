/**
 * StepControls - 시뮬레이션 스텝 컨트롤
 * ◀ Prev | Step N/M | Next ▶ | Run | Reset
 */

import { Play, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlaygroundStore, useStepControls } from '../stores/playgroundStore';

export function StepControls() {
  const { steps, currentStepIndex, isSimulating, setIsSimulating, setSteps, setError } =
    usePlaygroundStore();
  const { nextStep, prevStep, reset, canGoNext, canGoPrev } = useStepControls();

  const hasSteps = steps.length > 0;

  const handleRun = async () => {
    setIsSimulating(true);
    setError(null);

    try {
      // TODO: 실제 시뮬레이터 호출
      // const simulator = getSimulator(language);
      // const steps = simulator.simulate(code);
      // setSteps(steps);

      // 임시: 더미 스텝 생성
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSteps([
        {
          line: 1,
          code: 'int x = 10;',
          explanation: '변수 x를 선언하고 10으로 초기화합니다.',
          stack: [],
          heap: [],
          data: [],
          changes: [],
        },
        {
          line: 2,
          code: 'int *p = &x;',
          explanation: '포인터 p가 x의 주소를 가리킵니다.',
          stack: [],
          heap: [],
          data: [],
          changes: [],
        },
      ] as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      {/* 왼쪽: Run/Reset 버튼 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRun}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white rounded-lg
                     hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors text-sm font-medium"
        >
          <Play size={16} />
          {isSimulating ? 'Running...' : 'Run'}
        </button>

        <button
          onClick={reset}
          disabled={!hasSteps}
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 rounded-lg
                     hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors text-sm"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {/* 가운데: 스텝 네비게이션 */}
      {hasSteps && (
        <div className="flex items-center gap-3">
          <button
            onClick={prevStep}
            disabled={!canGoPrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30
                       disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
            Step {currentStepIndex + 1} / {steps.length}
          </span>

          <button
            onClick={nextStep}
            disabled={!canGoNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30
                       disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* 오른쪽: 현재 줄 표시 */}
      {hasSteps && (
        <div className="text-sm text-gray-500">
          Line {steps[currentStepIndex]?.line}
        </div>
      )}
    </div>
  );
}
