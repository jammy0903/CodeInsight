/**
 * JSVisualizerView - JavaScript 시각화 통합 컴포넌트
 *
 * visualizationType에 따라 적절한 시각화 컴포넌트를 렌더링
 */

import { CallStackView } from '../shared/components/CallStackView';
import { ScopeChainView } from '../shared/components/ScopeChainView';
import { EventLoopView } from './components/EventLoopView';
import type { JSVisualizerViewProps, JSVisualizationState } from './types';
import type { CallStackState, ScopeChainState } from '../shared/types';

/**
 * 미구현 시각화 플레이스홀더
 */
function NotImplementedView({ type }: { type: string }) {
  return (
    <div className="p-8 text-center">
      <div className="text-4xl mb-4">🚧</div>
      <h3 className="text-lg font-semibold text-[var(--theme-dashboard-title)] mb-2">
        {type} 시각화
      </h3>
      <p className="text-sm text-[var(--theme-dashboard-text-muted)]">
        아직 구현되지 않았습니다.
      </p>
    </div>
  );
}

/**
 * 타입 가드 함수들
 */
function isCallStackState(
  state: JSVisualizationState
): state is { type: 'callStack'; data: CallStackState } {
  return state.type === 'callStack';
}

function isScopeChainState(
  state: JSVisualizationState
): state is { type: 'scopeChain'; data: ScopeChainState } {
  return state.type === 'scopeChain';
}

function isEventLoopState(
  state: JSVisualizationState
): state is { type: 'eventLoop'; data: import('./types').EventLoopState } {
  return state.type === 'eventLoop';
}

/**
 * JSVisualizerView 메인 컴포넌트
 */
export function JSVisualizerView({ type, state }: JSVisualizerViewProps) {
  // 타입별 시각화 컴포넌트 렌더링
  switch (type) {
    // 공통 컴포넌트 사용
    case 'callStack':
      if (isCallStackState(state)) {
        return <CallStackView state={state.data} />;
      }
      break;

    // JavaScript 기본 시각화 (scopeChain)
    case 'javascript':
    case 'scopeChain':
      if (isScopeChainState(state)) {
        return <ScopeChainView state={state.data} />;
      }
      return <NotImplementedView type="Scope Chain" />;

    // JS 전용 컴포넌트
    case 'eventLoop':
      if (isEventLoopState(state)) {
        return <EventLoopView state={state.data} />;
      }
      break;

    // 미구현 시각화들
    case 'closure':
      return <NotImplementedView type="Closure" />;

    case 'prototype':
      return <NotImplementedView type="Prototype Chain" />;

    case 'thisBind':
      return <NotImplementedView type="this Binding" />;

    case 'hoisting':
      return <NotImplementedView type="Hoisting" />;

    case 'promise':
      return <NotImplementedView type="Promise" />;

    // C 메모리 시각화 (JS에서는 사용 안 함)
    case 'memory':
      return (
        <div className="p-8 text-center text-[var(--theme-dashboard-text-muted)]">
          JavaScript는 메모리 직접 접근을 지원하지 않습니다.
        </div>
      );

    default:
      return (
        <div className="p-8 text-center text-[var(--theme-dashboard-text-muted)]">
          알 수 없는 시각화 타입: {type}
        </div>
      );
  }

  // 타입 불일치
  return (
    <div className="p-8 text-center text-red-500">
      시각화 상태 타입 불일치
    </div>
  );
}
