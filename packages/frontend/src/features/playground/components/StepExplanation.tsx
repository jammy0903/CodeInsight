/**
 * StepExplanation - 현재 스텝 설명 표시
 */

import type { SimulationStep } from '../stores/playgroundStore';

interface StepExplanationProps {
  step: SimulationStep;
}

export function StepExplanation({ step }: StepExplanationProps) {
  return (
    <div className="flex items-start gap-4">
      {/* 코드 */}
      <div className="flex-none">
        <code className="px-3 py-1.5 bg-gray-100 rounded font-mono text-sm text-gray-800">
          {step.code}
        </code>
      </div>

      {/* 설명 */}
      <div className="flex-1">
        <p className="text-sm text-gray-700">{step.explanation}</p>
      </div>
    </div>
  );
}
