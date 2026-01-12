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

      // steps와 함께 stepRegisters도 저장
      setSteps(result.steps, result.stepRegisters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // 공통 버튼 스타일 (라이트 테마)
  const buttonBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '6px',
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
    background: '#f3f4f6',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
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
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#6b7280',
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
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(34, 197, 94, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(34, 197, 94, 0.3)';
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
            e.currentTarget.style.background = '#e5e7eb';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      )}

      {/* 구분선 */}
      {hasSteps && (
        <div style={{ width: '1px', height: '16px', background: '#e5e7eb', margin: '0 2px' }} />
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
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <ChevronLeft size={14} />
          </button>

          <div
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              color: '#22c55e',
              background: '#f0fdf4',
              borderRadius: '4px',
              border: '1px solid #bbf7d0',
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
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <ChevronRight size={14} />
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
