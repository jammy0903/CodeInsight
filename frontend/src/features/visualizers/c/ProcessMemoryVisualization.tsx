/**
 * ProcessMemoryVisualization
 * 메모리 시각화 메인 컨테이너
 */

import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Step, ViewMode } from './types';
import { DEFAULT_CODE } from './constants';
import { ProcessMemoryView } from './components/ProcessMemoryView';
import { StackDetailView } from './components/StackDetailView';
import { HeapDetailView } from './components/HeapDetailView';
import { useStepTransition } from './hooks/useStepTransition';
import { traceCode } from '@/services/tracer';
import { Button } from '@/components/ui/button';

export function ProcessMemoryVisualization() {
  // State
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdin, setStdin] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const animationSpeed = 'normal' as const;

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Current step
  const currentStep = steps[currentStepIndex] || null;

  // Animation hook
  const { changedBlocks, isAnimating } = useStepTransition(currentStep);

  // Handlers
  const handleTrace = async () => {
    setIsLoading(true);
    setError('');
    setSteps([]);
    setCurrentStepIndex(0);
    setViewMode('overview');

    const result = await traceCode(code, stdin);

    if (result.success) {
      setSteps(result.steps);
    } else {
      setError(result.message || 'Execution error');
    }

    setIsLoading(false);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handlePrevStep = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextStep = () => {
    setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1));
  };

  const lines = code.split('\n');

  return (
    <div className="w-full h-full bg-background rounded-xl overflow-hidden p-4">
      {/* 2-column grid layout */}
      <div
        className="w-full h-full gap-4"
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 3fr 4fr',
        }}
      >
      {/* Left: Code Editor */}
      <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 h-14">
          <h2 className="text-sm font-medium text-foreground">C Code</h2>
          {currentStep && (
            <span className="text-sm text-primary font-medium">Line {currentStep.line}</span>
          )}
        </div>

        {/* Editor + Terminal container (7:3) */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Code Editor - 70% */}
          <div className="flex overflow-hidden" style={{ flex: '7' }}>
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="bg-background text-muted-foreground font-mono text-sm select-none overflow-hidden border-r border-border"
              style={{ minWidth: '2.5rem' }}
            >
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isCurrentLine = currentStep?.line === lineNum;
                return (
                  <div
                    key={idx}
                    className={`h-6 flex items-center justify-center ${
                      isCurrentLine ? 'bg-primary/20 text-primary font-medium' : ''
                    }`}
                  >
                    <span className="text-xs">{lineNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Code Area */}
            <div className="flex-1 relative bg-background">
              {/* Highlight Layer */}
              <div className="absolute inset-0 font-mono text-sm pointer-events-none">
                {lines.map((_, idx) => {
                  const lineNum = idx + 1;
                  const isCurrentLine = currentStep?.line === lineNum;
                  return (
                    <div
                      key={idx}
                      className={`h-6 px-3 ${isCurrentLine ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                    />
                  );
                })}
              </div>

              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                className="w-full h-full bg-transparent font-mono text-sm px-3 resize-none focus:outline-none relative z-10 text-text"
                placeholder="Enter C code..."
                spellCheck={false}
                style={{ lineHeight: '1.5rem' }}
              />
            </div>
          </div>

          {/* Terminal-style stdin - 30% */}
          <div
            className="border-t border-border p-3 font-mono"
            style={{ flex: '3', backgroundColor: '#1a1a2e' }}
          >
            <div className="flex items-center gap-2 text-xs mb-2">
              <span className="text-green-400">$</span>
              <span className="text-gray-400">stdin</span>
            </div>
            <input
              id="viz-stdin"
              type="text"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter input here (e.g., 3 5)"
              className="w-full bg-transparent border-none font-mono text-sm text-green-300 placeholder:text-gray-600 focus:outline-none"
            />
            {error && (
              <p className="text-red-400 text-xs mt-2">Error: {error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Explanation */}
      <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
        {/* Header with controls */}
        <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-center gap-4 h-14">
          <Button
            onClick={handleTrace}
            disabled={isLoading}
            className="px-6 py-2"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>

          {steps.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0 || isAnimating}
                variant="secondary"
                className="px-3 py-2"
              >
                ◀
              </Button>
              <span className="text-foreground text-sm font-medium min-w-[50px] text-center">
                {currentStepIndex + 1}/{steps.length}
              </span>
              <Button
                onClick={handleNextStep}
                disabled={currentStepIndex === steps.length - 1 || isAnimating}
                variant="secondary"
                className="px-3 py-2"
              >
                ▶
              </Button>
            </div>
          )}
        </div>

        {/* Explanation content */}
        <div className="flex-1 p-3 overflow-auto">
          {currentStep?.explanation ? (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {currentStep.explanation}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">Click Analyze to start</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Memory Visualization */}
      <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 h-14">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">Memory</h2>
            {viewMode !== 'overview' && (
              <button
                onClick={() => setViewMode('overview')}
                className="text-sm text-primary hover:underline"
              >
                ← Back
              </button>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {viewMode === 'overview' && 'Overview'}
            {viewMode === 'stack-detail' && 'Stack'}
            {viewMode === 'heap-detail' && 'Heap'}
          </span>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'overview' && (
            <ProcessMemoryView
              key="overview"
              step={currentStep}
              onViewChange={setViewMode}
            />
          )}
          {viewMode === 'stack-detail' && currentStep && (
            <StackDetailView
              key="stack"
              blocks={currentStep.stack}
              rsp={currentStep.rsp}
              rbp={currentStep.rbp}
              onClose={() => setViewMode('overview')}
              changedBlocks={changedBlocks}
              animationSpeed={animationSpeed}
              heapBlocks={currentStep.heap}
            />
          )}
          {viewMode === 'heap-detail' && currentStep && (
            <HeapDetailView
              key="heap"
              blocks={currentStep.heap}
              onClose={() => setViewMode('overview')}
              changedBlocks={changedBlocks}
              animationSpeed={animationSpeed}
              stackBlocks={currentStep.stack}
            />
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
