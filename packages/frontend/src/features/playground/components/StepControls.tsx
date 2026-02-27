/**
 * StepControls - 시뮬레이션 컨트롤 버튼
 * Run, Cancel, Reset, 이전/다음 스텝
 * 반응형 지원 (모바일에서 컴팩트)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { usePlaygroundStore, useStepControls, useCurrentCode } from '../stores/playgroundStore';
import { simulatorService, isLanguageSupported } from '@/services/simulator';

interface StepControlsProps {
  isMobile?: boolean;
  showRun?: boolean;       // Run 버튼 표시 여부 (기본: true)
  showReset?: boolean;     // Reset 버튼 표시 여부 (기본: true)
  showNavigation?: boolean; // 이전/다음 버튼 표시 여부 (기본: true)
}

export function StepControls({
  isMobile = false,
  showRun = true,
  showReset = true,
  showNavigation = true,
}: StepControlsProps) {
  const {
    language, steps, currentStepIndex, isSimulating,
    setIsSimulating, setSteps, setError, stdins,
    abortController, setAbortController,
  } = usePlaygroundStore();
  const { nextStep, prevStep, reset, canGoNext, canGoPrev } = useStepControls();
  const code = useCurrentCode();

  const hasSteps = steps.length > 0;
  const isSupported = isLanguageSupported(language);

  // 경과 시간 표시
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSimulating) {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating]);

  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsSimulating(false);
    setError('Simulation cancelled');
  }, [abortController, setAbortController, setIsSimulating, setError]);

  const handleRun = async () => {
    if (!code.trim()) {
      setError('코드를 입력해주세요');
      return;
    }

    if (!isSupported) {
      setError(`${language.toUpperCase()} 시뮬레이션은 아직 지원되지 않습니다`);
      return;
    }

    // 이전 요청 취소
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsSimulating(true);
    setError(null);

    try {
      const stdin = stdins[language] || undefined;
      const result = await simulatorService.simulate(language, {
        code,
        stdin,
        signal: controller.signal,
      });

      // DEBUG: 시뮬레이션 결과 확인
      if (import.meta.env.DEV && result.steps?.length > 0) {
        console.log('[StepControls] All steps:', result.steps.map(s => ({ line: s.line, code: s.code?.substring(0, 30) })));
        console.log('[StepControls] First step:', JSON.stringify(result.steps[0], null, 2));
      }

      if (!result.success) {
        setError(result.error || 'Simulation failed');
        return;
      }

      if (result.steps.length === 0) {
        setError('시뮬레이션할 코드가 없습니다');
        return;
      }

      setSteps(result.steps, result.stepRegisters);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      if (msg.includes('timeout') || msg.includes('ECONNABORTED')) {
        setError('코드 실행 시간이 초과되었습니다. 무한 루프가 없는지 확인해주세요.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSimulating(false);
      setAbortController(null);
    }
  };

  // 공통 버튼 스타일 (반응형)
  const buttonBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? '6px' : '4px',
    padding: isMobile ? '8px 18px' : '5px 12px',
    fontSize: isMobile ? '13px' : '11px',
    fontWeight: 600,
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const runButtonStyle: React.CSSProperties = {
    ...buttonBase,
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: 'white',
    boxShadow: '0 1px 3px rgba(34, 197, 94, 0.3)',
  };

  const runButtonDisabled: React.CSSProperties = {
    ...runButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonBase,
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    boxShadow: '0 1px 3px rgba(239, 68, 68, 0.3)',
  };

  const secondaryButton: React.CSSProperties = {
    ...buttonBase,
    background: 'var(--theme-memory-reset-bg)',
    color: 'var(--theme-memory-reset-text)',
    border: '1px solid var(--theme-memory-reset-border)',
  };

  const navButton: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '34px' : '28px',
    height: isMobile ? '34px' : '28px',
    borderRadius: '6px',
    border: '1px solid var(--theme-memory-reset-border)',
    background: 'var(--theme-memory-card-bg)',
    color: 'var(--theme-memory-reset-text)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const navButtonDisabled: React.CSSProperties = {
    ...navButton,
    opacity: 0.3,
    cursor: 'not-allowed',
  };

  // Run/Cancel 버튼
  const runCancelButton = showRun && (
    isSimulating ? (
      <button
        onClick={handleCancel}
        style={cancelButtonStyle}
      >
        <Square size={isMobile ? 12 : 12} fill="currentColor" />
        <span>{elapsed > 0 ? `Cancel (${elapsed}s)` : 'Cancel'}</span>
      </button>
    ) : (
      <button
        id="playground-run-button"
        onClick={handleRun}
        disabled={!isSupported}
        style={!isSupported ? runButtonDisabled : runButtonStyle}
      >
        <Play size={isMobile ? 12 : 14} fill="currentColor" />
        <span>Run</span>
      </button>
    )
  );

  // 경과 시간 표시
  const elapsedDisplay = isSimulating && !isMobile && (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      color: elapsed >= 30 ? '#f59e0b' : 'var(--theme-memory-reset-text)',
      fontFamily: 'monospace',
    }}>
      <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
      {elapsed >= 30 ? 'Taking longer than usual...' : `Running... ${elapsed}s`}
    </div>
  );

  // Reset 버튼
  const resetButton = showReset && hasSteps && !isSimulating && (
    <button onClick={reset} style={secondaryButton}>
      <RotateCcw size={isMobile ? 12 : 12} />
      <span>Reset</span>
    </button>
  );

  // 네비게이션
  const navigation = showNavigation && hasSteps && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        onClick={prevStep}
        disabled={!canGoPrev}
        style={canGoPrev ? navButton : navButtonDisabled}
      >
        <ChevronLeft size={isMobile ? 16 : 14} />
      </button>
      <div style={{
        padding: isMobile ? '6px 24px' : '4px 10px',
        fontSize: isMobile ? '13px' : '12px',
        fontFamily: 'monospace',
        fontWeight: 600,
        color: 'var(--theme-memory-counter-text)',
        background: 'var(--theme-memory-counter-bg)',
        borderRadius: '6px',
        border: '1px solid var(--theme-memory-counter-border)',
      }}>
        {currentStepIndex + 1}/{steps.length}
      </div>
      <button
        onClick={nextStep}
        disabled={!canGoNext}
        style={canGoNext ? navButton : navButtonDisabled}
      >
        <ChevronRight size={isMobile ? 16 : 14} />
      </button>
    </div>
  );

  // 모바일: 좌(Run+Reset) — 우(Nav) 양끝 정렬
  if (isMobile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {runCancelButton}
          {resetButton}
        </div>
        {navigation}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 데스크톱: 가로 나열
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      {runCancelButton}
      {elapsedDisplay}
      {resetButton}
      {showNavigation && hasSteps && (
        <div style={{ width: '1px', height: '16px', background: '#e5e7eb', margin: '0 2px' }} />
      )}
      {navigation}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
