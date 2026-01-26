import type { JSVisualizerViewProps } from '../types';

// Shared Components
import { CallStackView } from '../../shared/components/CallStackView';
import { ScopeChainView } from '../../shared/components/ScopeChainView';

// JS-specific Components
import { EventLoopView } from './EventLoopView';

export function JSVisualizerView({ state, type }: JSVisualizerViewProps) {
  if (!state) {
    return (
      <div className="p-4 border rounded-md h-full flex items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-400">Select a lesson to see the visualization.</h3>
      </div>
    );
  }

  switch (state.type) {
    case 'callStack':
      return <CallStackView state={state.data} />;
    case 'scopeChain':
      return <ScopeChainView state={state.data} />;
    case 'eventLoop':
      return <EventLoopView state={state.data} />;
    default:
      return (
        <div className="p-4 border rounded-md h-full flex items-center justify-center">
          <h3 className="text-lg font-semibold text-red-500">
            Unsupported visualization type: {type}
          </h3>
        </div>
      );
  }
}
