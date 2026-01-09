/**
 * StepControls - 시뮬레이션 컨트롤 버튼
 * Run, Reset, 이전/다음 스텝
 */

import { Play, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { usePlaygroundStore, useStepControls, useCurrentCode } from '../stores/playgroundStore';
import { simulatorService, isLanguageSupported } from '@/services/simulator';

export function StepControls() {
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

      setSteps(result.steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // 공통 버튼 스타일
  const buttonBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const runButtonStyle: React.CSSProperties = {
    ...buttonBase,
    background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(35, 134, 54, 0.3)',
  };

  const runButtonDisabled: React.CSSProperties = {
    ...runButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  };

  const secondaryButton: React.CSSProperties = {
    ...buttonBase,
    background: 'rgba(110, 118, 129, 0.1)',
    color: '#8b949e',
    border: '1px solid #30363d',
  };

  const secondaryButtonDisabled: React.CSSProperties = {
    ...secondaryButton,
    opacity: 0.4,
    cursor: 'not-allowed',
  };

  const navButton: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #30363d',
    background: 'rgba(110, 118, 129, 0.1)',
    color: '#8b949e',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const navButtonDisabled: React.CSSProperties = {
    ...navButton,
    opacity: 0.3,
    cursor: 'not-allowed',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Run 버튼 */}
      <button
        onClick={handleRun}
        disabled={isSimulating || !isSupported}
        style={isSimulating || !isSupported ? runButtonDisabled : runButtonStyle}
        onMouseEnter={(e) => {
          if (!isSimulating && isSupported) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(35, 134, 54, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(35, 134, 54, 0.3)';
        }}
      >
        {isSimulating ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
        <span>{isSimulating ? 'Running' : 'Run'}</span>
      </button>

      {/* Reset 버튼 */}
      {hasSteps && (
        <button
          onClick={reset}
          style={secondaryButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(110, 118, 129, 0.2)';
            e.currentTarget.style.color = '#c9d1d9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(110, 118, 129, 0.1)';
            e.currentTarget.style.color = '#8b949e';
          }}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      )}

      {/* 구분선 */}
      {hasSteps && (
        <div style={{ width: '1px', height: '20px', background: '#30363d', margin: '0 4px' }} />
      )}

      {/* 이전/다음 네비게이션 */}
      {hasSteps && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={prevStep}
            disabled={!canGoPrev}
            style={canGoPrev ? navButton : navButtonDisabled}
            onMouseEnter={(e) => {
              if (canGoPrev) {
                e.currentTarget.style.background = 'rgba(110, 118, 129, 0.25)';
                e.currentTarget.style.color = '#c9d1d9';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(110, 118, 129, 0.1)';
              e.currentTarget.style.color = '#8b949e';
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#58a6ff',
              background: 'rgba(88, 166, 255, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(88, 166, 255, 0.2)',
            }}
          >
            {currentStepIndex + 1} / {steps.length}
          </div>

          <button
            onClick={nextStep}
            disabled={!canGoNext}
            style={canGoNext ? navButton : navButtonDisabled}
            onMouseEnter={(e) => {
              if (canGoNext) {
                e.currentTarget.style.background = 'rgba(110, 118, 129, 0.25)';
                e.currentTarget.style.color = '#c9d1d9';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(110, 118, 129, 0.1)';
              e.currentTarget.style.color = '#8b949e';
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 현재 라인 표시 */}
      {hasSteps && (
        <div
          style={{
            marginLeft: '8px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#f0883e',
            background: 'rgba(240, 136, 62, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(240, 136, 62, 0.2)',
          }}
        >
          Line {steps[currentStepIndex]?.line}
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
