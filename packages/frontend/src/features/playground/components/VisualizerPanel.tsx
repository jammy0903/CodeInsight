/**
 * VisualizerPanel - 언어별 시각화 컴포넌트 라우터
 * 현재 언어에 맞는 시각화 컴포넌트 렌더링
 */

import { usePlaygroundStore } from '../stores/playgroundStore';

// TODO: 실제 시각화 컴포넌트 import
// import { CMemoryView } from '@/features/visualizers/c';
// import { PyReferenceView } from '@/features/visualizers/python';

export function VisualizerPanel() {
  const { language, steps, currentStepIndex } = usePlaygroundStore();
  const currentStep = steps[currentStepIndex];

  if (!currentStep) {
    return null;
  }

  // 언어별 시각화 컴포넌트 분기
  switch (language) {
    case 'c':
      return <CMemoryViewPlaceholder step={currentStep} />;
    case 'python':
      return <PyReferenceViewPlaceholder step={currentStep} />;
    case 'java':
      return <JavaHeapViewPlaceholder step={currentStep} />;
    default:
      return null;
  }
}

// ============================================================
// 임시 플레이스홀더 컴포넌트 (실제 구현 전까지)
// ============================================================

function CMemoryViewPlaceholder({ step }: { step: unknown }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
      <div className="text-4xl mb-4">🔵</div>
      <h3 className="text-lg font-medium text-blue-800 mb-2">C Memory View</h3>
      <p className="text-sm text-blue-600">Stack / Heap / Pointer 시각화</p>
      <p className="text-xs text-blue-400 mt-4">(구현 예정)</p>
    </div>
  );
}

function PyReferenceViewPlaceholder({ step }: { step: unknown }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-green-50 rounded-lg border-2 border-dashed border-green-200">
      <div className="text-4xl mb-4">🐍</div>
      <h3 className="text-lg font-medium text-green-800 mb-2">Python Object Reference</h3>
      <p className="text-sm text-green-600">Names → Objects 참조 시각화</p>
      <p className="text-xs text-green-400 mt-4">(구현 예정)</p>
    </div>
  );
}

function JavaHeapViewPlaceholder({ step }: { step: unknown }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-orange-50 rounded-lg border-2 border-dashed border-orange-200">
      <div className="text-4xl mb-4">☕</div>
      <h3 className="text-lg font-medium text-orange-800 mb-2">Java Heap View</h3>
      <p className="text-sm text-orange-600">Object / Reference 시각화</p>
      <p className="text-xs text-orange-400 mt-4">(구현 예정)</p>
    </div>
  );
}
