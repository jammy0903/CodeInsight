/**
 * PlaygroundPage - 멀티언어 코드 시뮬레이터 메인 페이지
 *
 * 레이아웃:
 * ┌────────────────────────────────────────────────────────────┐
 * │ Header: LanguageTabs (C | Python | Java)                   │
 * ├──────────────────────────┬─────────────────────────────────┤
 * │                          │                                 │
 * │   CodeEditor             │   Visualizer                    │
 * │   (Monaco)               │   (언어별 시각화)               │
 * │                          │                                 │
 * ├──────────────────────────┴─────────────────────────────────┤
 * │ Footer: StepControls (◀ Step N/M ▶) | Explanation          │
 * └────────────────────────────────────────────────────────────┘
 *
 * 설계 문서: docs/logic/SIMULATOR_EXTENSION.md (Part 3, Section 18)
 */

import { LanguageTabs } from './components/LanguageTabs';
import { CodeEditor } from './components/CodeEditor';
import { StepControls } from './components/StepControls';
import { StepExplanation } from './components/StepExplanation';
import { VisualizerPanel } from './components/VisualizerPanel';
import { usePlaygroundStore } from './stores/playgroundStore';

export function PlaygroundPage() {
  const { language, steps, currentStepIndex, error } = usePlaygroundStore();

  const currentStep = steps[currentStepIndex];
  const hasSteps = steps.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header: 언어 탭 */}
      <header className="flex-none border-b bg-white shadow-sm">
        <div className="px-4 py-2">
          <LanguageTabs />
        </div>
      </header>

      {/* Main: 에디터 + 시각화 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 코드 에디터 */}
        <div className="w-1/2 border-r bg-white flex flex-col">
          <div className="flex-none px-4 py-2 border-b bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">
              Code Editor ({language.toUpperCase()})
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor />
          </div>
        </div>

        {/* 오른쪽: 시각화 */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-none px-4 py-2 border-b bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">
              {language === 'c' && 'Memory Visualization'}
              {language === 'python' && 'Object Reference'}
              {language === 'java' && 'Heap Visualization'}
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-mono text-sm">{error}</p>
              </div>
            ) : hasSteps ? (
              <VisualizerPanel />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">시뮬레이션 결과가 여기에 표시됩니다</p>
                  <p className="text-sm">▶ Run 버튼을 눌러 시작하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer: 스텝 컨트롤 + 설명 */}
      <footer className="flex-none border-t bg-white">
        {/* 스텝 컨트롤 */}
        <div className="px-4 py-2 border-b">
          <StepControls />
        </div>

        {/* 현재 스텝 설명 */}
        {currentStep && (
          <div className="px-4 py-3">
            <StepExplanation step={currentStep} />
          </div>
        )}
      </footer>
    </div>
  );
}
