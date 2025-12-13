import { useState } from 'react';
import { traceCode, type Step, type MemoryBlock } from '../services/tracer';

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    int x = 5;
    int y = 10;
    int *p = &x;
    *p = 20;
    printf("%d\\n", x);
    return 0;
}`;

export function MemoryViz() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [sourceLines, setSourceLines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrace = async () => {
    setIsLoading(true);
    setError('');
    setSteps([]);
    setCurrentStep(0);

    const result = await traceCode(code);

    if (result.success) {
      setSteps(result.steps);
      setSourceLines(result.source_lines);
    } else {
      setError(result.message || '실행 오류');
    }

    setIsLoading(false);
  };

  const step = steps[currentStep];

  return (
    <div className="flex h-full">
      {/* 왼쪽: 코드 에디터 */}
      <div className="w-1/3 p-4 border-r border-gray-700 flex flex-col">
        <h2 className="text-lg font-bold mb-2">📝 C 코드</h2>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 bg-gray-800 text-green-400 font-mono text-sm p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="C 코드를 입력하세요..."
        />

        <button
          onClick={handleTrace}
          disabled={isLoading}
          className="mt-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          {isLoading ? '분석 중...' : '▶ 실행 & 추적'}
        </button>

        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}

        {/* 스텝 컨트롤 */}
        {steps.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded"
            >
              ◀ Prev
            </button>
            <span className="text-gray-400">
              Step {currentStep + 1} / {steps.length}
            </span>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded"
            >
              Next ▶
            </button>
          </div>
        )}
      </div>

      {/* 가운데: 소스 코드 (라인 하이라이트) */}
      <div className="w-1/3 p-4 border-r border-gray-700">
        <h2 className="text-lg font-bold mb-2">📄 실행 위치</h2>

        <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm overflow-auto h-[calc(100%-3rem)]">
          {sourceLines.map((line, idx) => (
            <div
              key={idx}
              className={`flex ${
                step && step.line === idx + 1
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'text-gray-400'
              }`}
            >
              <span className="w-8 text-right pr-2 text-gray-600 select-none">
                {idx + 1}
              </span>
              <span className="flex-1 whitespace-pre">{line || ' '}</span>
              {step && step.line === idx + 1 && (
                <span className="text-yellow-400 ml-2">◀ 현재</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽: 메모리 시각화 */}
      <div className="w-1/3 p-4 overflow-auto">
        <h2 className="text-lg font-bold mb-2">🧠 메모리</h2>

        {!step ? (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-4xl mb-4">📦</p>
            <p>코드를 실행하면</p>
            <p>메모리 상태가 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* RSP/RBP */}
            {(step.rsp || step.rbp) && (
              <div className="bg-gray-800 rounded-lg p-3 text-xs font-mono">
                <div className="text-gray-500 mb-1">Registers</div>
                {step.rsp && <div>RSP: {step.rsp}</div>}
                {step.rbp && <div>RBP: {step.rbp}</div>}
              </div>
            )}

            {/* Stack */}
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-purple-400 font-bold mb-2">📚 STACK</div>
              {step.stack.length === 0 ? (
                <p className="text-gray-500 text-sm">비어있음</p>
              ) : (
                <div className="space-y-3">
                  {step.stack.map((block, idx) => (
                    <MemoryBlockView key={idx} block={block} allBlocks={step.stack} />
                  ))}
                </div>
              )}
            </div>

            {/* Heap */}
            {step.heap.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-green-400 font-bold mb-2">🗄️ HEAP</div>
                <div className="space-y-3">
                  {step.heap.map((block, idx) => (
                    <MemoryBlockView key={idx} block={block} allBlocks={[...step.stack, ...step.heap]} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 메모리 블록 시각화 컴포넌트
function MemoryBlockView({ block, allBlocks }: { block: MemoryBlock; allBlocks: MemoryBlock[] }) {
  // 포인터가 가리키는 대상 찾기
  const pointsToBlock = block.points_to
    ? allBlocks.find(b => b.address === block.points_to)
    : null;

  return (
    <div className="border border-gray-700 rounded p-2">
      {/* 변수명 & 타입 */}
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono font-bold text-blue-400">{block.name}</span>
        <span className="text-xs text-gray-500">{block.type}</span>
      </div>

      {/* 주소 */}
      <div className="text-xs text-gray-500 mb-2 font-mono">
        {block.address}
      </div>

      {/* 바이트 박스 */}
      <div className="flex flex-wrap gap-1 mb-2">
        {block.bytes.map((byte, idx) => (
          <div
            key={idx}
            className="w-8 h-8 bg-purple-600/30 border border-purple-500 rounded flex items-center justify-center text-xs font-mono"
            title={`Byte ${idx}: 0x${byte.toString(16).padStart(2, '0')} (${byte})`}
          >
            {byte.toString(16).padStart(2, '0').toUpperCase()}
          </div>
        ))}
      </div>

      {/* 값 (10진수) */}
      <div className="text-sm">
        = <span className="text-yellow-400 font-bold">{block.value}</span>
        {block.type.includes('*') && block.points_to && (
          <span className="text-gray-400 ml-2">
            → {block.points_to}
          </span>
        )}
      </div>

      {/* 포인터 화살표 */}
      {pointsToBlock && (
        <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
          <span>↳ points to</span>
          <span className="font-mono font-bold">{pointsToBlock.name}</span>
        </div>
      )}

      {/* 바이너리 표시 (확장 가능) */}
      <details className="mt-2">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
          Binary 보기
        </summary>
        <div className="mt-1 text-xs font-mono text-gray-400 break-all">
          {block.bytes.map(b => b.toString(2).padStart(8, '0')).join(' ')}
        </div>
      </details>
    </div>
  );
}
