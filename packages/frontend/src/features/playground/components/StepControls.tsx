/**
 * StepControls - 시뮬레이션 컨트롤 버튼
 * Run, Reset, 이전/다음 스텝
 * 반응형 지원 (모바일에서 컴팩트)
 */

import { Play, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  const { language, steps, currentStepIndex, isSimulating, setIsSimulating, setSteps, setError } =
    usePlaygroundStore();
  const { nextStep, prevStep, reset, canGoNext, canGoPrev } = useStepControls();
  const code = useCurrentCode();

  const hasSteps = steps.length > 0;
  const isSupported = isLanguageSupported(language);

  const handleRun = async () => {
    if (!code.trim()) {
      setError('코드를 입력해주세요');
      return;
    }

    if (!isSupported) {
      setError(`${language.toUpperCase()} 시뮬레이션은 아직 지원되지 않습니다`);
      return;
    }

    setIsSimulating(true);
    setError(null);

    try {
      const result = await simulatorService.simulate(language, { code });

      if (!result.success) {
        setError(result.error || 'Simulation failed');
        return;
      }

      if (result.steps.length === 0) {
        setError('시뮬레이션할 코드가 없습니다');
        return;
      }

      // steps와 함께 stepRegisters도 저장
      setSteps(result.steps, result.stepRegisters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // 공통 버튼 스타일 (반응형)
  const buttonBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? '2px' : '4px',
    padding: isMobile ? '3px 6px' : '4px 10px',
    fontSize: isMobile ? '10px' : '11px',
    fontWeight: 600,
    borderRadius: isMobile ? '4px' : '6px',
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
    width: isMobile ? '22px' : '26px',
    height: isMobile ? '22px' : '26px',
    borderRadius: isMobile ? '4px' : '6px',
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
      {/* Run 버튼 */}
      {showRun && (
        <button
          id="playground-run-button"
          onClick={handleRun}
          disabled={isSimulating || !isSupported}
          style={isSimulating || !isSupported ? runButtonDisabled : runButtonStyle}
          onMouseEnter={(e) => {
            if (!isSimulating && isSupported) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(34, 197, 94, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(34, 197, 94, 0.3)';
          }}
        >
          {isSimulating ? (
            <Loader2 size={isMobile ? 12 : 14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Play size={isMobile ? 12 : 14} fill="currentColor" />
          )}
          {!isMobile && <span>{isSimulating ? 'Running' : 'Run'}</span>}
        </button>
      )}

      {/* Reset 버튼 - 모바일에서는 아이콘만 */}
      {showReset && hasSteps && (
        <button
          onClick={reset}
          style={secondaryButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--theme-memory-reset-border)';
            e.currentTarget.style.color = 'var(--theme-memory-card-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--theme-memory-reset-bg)';
            e.currentTarget.style.color = 'var(--theme-memory-reset-text)';
          }}
        >
          <RotateCcw size={isMobile ? 10 : 12} />
          {!isMobile && <span>Reset</span>}
        </button>
      )}

      {/* 구분선 - 모바일에서는 숨김 */}
      {showNavigation && hasSteps && !isMobile && (
        <div style={{ width: '1px', height: '16px', background: '#e5e7eb', margin: '0 2px' }} />
      )}

      {/* 이전/다음 네비게이션 */}
      {showNavigation && hasSteps && (
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '2px' : '4px' }}>
          <button
            onClick={prevStep}
            disabled={!canGoPrev}
            style={canGoPrev ? navButton : navButtonDisabled}
            onMouseEnter={(e) => {
              if (canGoPrev) {
                e.currentTarget.style.background = 'var(--theme-memory-reset-bg)';
                e.currentTarget.style.color = 'var(--theme-memory-card-text)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--theme-memory-card-bg)';
              e.currentTarget.style.color = 'var(--theme-memory-reset-text)';
            }}
          >
            <ChevronLeft size={isMobile ? 12 : 14} />
          </button>

          <div
            style={{
              padding: isMobile ? '2px 4px' : '3px 8px',
              fontSize: isMobile ? '9px' : '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              color: 'var(--theme-memory-counter-text)',
              background: 'var(--theme-memory-counter-bg)',
              borderRadius: '4px',
              border: '1px solid var(--theme-memory-counter-border)',
            }}
          >
            {currentStepIndex + 1}/{steps.length}
          </div>

          <button
            onClick={nextStep}
            disabled={!canGoNext}
            style={canGoNext ? navButton : navButtonDisabled}
            onMouseEnter={(e) => {
              if (canGoNext) {
                e.currentTarget.style.background = 'var(--theme-memory-reset-bg)';
                e.currentTarget.style.color = 'var(--theme-memory-card-text)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--theme-memory-card-bg)';
              e.currentTarget.style.color = 'var(--theme-memory-reset-text)';
            }}
          >
            <ChevronRight size={isMobile ? 12 : 14} />
          </button>
        </div>
      )}


      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
