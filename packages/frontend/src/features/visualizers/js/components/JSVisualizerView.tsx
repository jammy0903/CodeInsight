import React from 'react';
import type { JSVisualizerViewProps } from '../types';

// Shared Components
import { CallStackView } from '../../shared/components/CallStackView';

// JS-specific Components
import { ClosureView } from './ClosureView';
import { EventLoopView } from './EventLoopView';
import { HoistingView } from './HoistingView';
import { PrototypeChainView } from './PrototypeChainView';
import { ScopeChainView } from './ScopeChainView';
import { ThisBindingView } from './ThisBindingView';

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
    case 'closure':
      return <ClosureView state={state.data} />;
    case 'prototype':
      return <PrototypeChainView state={state.data} />;
    case 'thisBind':
      return <ThisBindingView state={state.data} />;
    case 'hoisting':
      return <HoistingView state={state.data} />;
    // TODO: Add 'promise' case
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
