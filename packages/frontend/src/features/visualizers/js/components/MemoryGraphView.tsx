/**
 * MemoryGraphView - JavaScript 메모리 구조 시각화 (Stack & Heap)
 * 
 * Stack 영역 (좌측): 함수 호출 스택 및 로컬 변수
 * Heap 영역 (우측): 객체, 레퍼런스 데이터
 * 
 * Phase 1: Stack & Primitive
 * Phase 2: Heap & References (with SVG Arrows)
 */

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
    MemoryGraphViewProps,
    MemoryState,
    StackFrame,
    HeapNode,
    MemoryValue
} from '../types';

// 스타일 상수
const STYLES = {
    stack: {
        bg: '#F3F4F6', // gray-100
        border: '#E5E7EB',
        frameBg: '#FFFFFF',
        activeBorder: '#3B82F6', // blue-500
    },
    heap: {
        bg: '#FFF7ED', // orange-50
        border: '#FED7AA',
        nodeBg: '#FFFFFF',
    },
    variable: {
        primitiveColor: '#059669', // emerald-600
        referenceColor: '#D97706', // amber-600
    }
};

/**
 * 메모리 값 렌더링 컴포넌트
 */
function MemoryValueDisplay({ value }: { value: MemoryValue }) {
    if (value.type === 'primitive') {
        let display = String(value.value);
        let color = STYLES.variable.primitiveColor;

        if (typeof value.value === 'string') {
            display = `"${value.value}"`;
            color = '#B91C1C'; // red-700
        } else if (typeof value.value === 'boolean') {
            color = '#7C3AED'; // violet-600
        } else if (value.value === null || value.value === undefined) {
            color = '#9CA3AF'; // gray-400
        }

        return (
            <span className="font-mono text-sm font-semibold" style={{ color }}>
                {display}
            </span>
        );
    }

    // Reference Type
    return (
        <div className="flex items-center gap-1 group cursor-pointer hover:opacity-80">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-mono text-xs text-amber-600 font-bold underline decoration-dotted">
                @{value.refId}
            </span>
            {value.displayValue && (
                <span className="text-xs text-gray-400 ml-1 truncate max-w-[100px]">
                    {value.displayValue}
                </span>
            )}
        </div>
    );
}

/**
 * 스택 프레임 컴포넌트
 */
function StackFrameItem({ frame, index }: { frame: StackFrame; index: number }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
        rounded-lg border-l-4 p-3 shadow-sm mb-3 bg-white
        ${frame.isActive ? 'border-l-blue-500 ring-2 ring-blue-100' : 'border-l-gray-300 opacity-80'}
      `}
        >
            <div className="flex justify-between items-center mb-2 border-b pb-1 border-gray-100">
                <span className="font-bold text-sm text-gray-700 font-mono">
                    {frame.functionName}()
                </span>
                {frame.line && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        L{frame.line}
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {frame.variables.map((v) => (
                    <div key={v.name} className="flex justify-between items-center text-sm group relative">
                        <span className="text-gray-600 font-mono mr-2">{v.name}:</span>
                        <div className="relative">
                            <MemoryValueDisplay value={v.value} />

                            {/* 값 변경 효과 (Phase 1) */}
                            {v.isChanged && (
                                <motion.span
                                    initial={{ opacity: 1, scale: 1.5 }}
                                    animate={{ opacity: 0, scale: 1 }}
                                    className="absolute inset-0 bg-yellow-200 rounded-full -z-10"
                                />
                            )}
                        </div>
                    </div>
                ))}
                {frame.variables.length === 0 && (
                    <div className="text-xs text-gray-300 italic text-center py-1">
                        (no variables)
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/**
 * 힙 노드 컴포넌트 (Phase 2)
 */
function HeapNodeItem({ node }: { node: HeapNode }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bg-white rounded-lg shadow-md border border-amber-200 p-2 min-w-[120px]"
            style={{
                left: node.position?.x ?? 20,
                top: node.position?.y ?? 20,
            }}
        >
            <div className="text-xs text-amber-500 font-bold border-b border-amber-100 pb-1 mb-1 flex justify-between">
                <span>{node.label || 'Object'}</span>
                <span className="opacity-50">@{node.id}</span>
            </div>
            <div className="space-y-1">
                {node.properties.map((prop) => (
                    <div key={prop.key} className="text-xs flex justify-between gap-3">
                        <span className="text-gray-500">{prop.key}:</span>
                        <MemoryValueDisplay value={prop.value} />
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

/**
 * Main View
 */
export function MemoryGraphView({ state, showHeap = true }: MemoryGraphViewProps) {
    return (
        <div className="flex h-full min-h-[400px] gap-4 p-4 bg-slate-50 relative overflow-hidden">
            {/* 1. Stack Area (Left) */}
            <div className="w-1/3 min-w-[250px] flex flex-col z-10">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>📚 Call Stack</span>
                    <span className="text-xs bg-gray-200 px-1.5 rounded text-gray-500">{state.callStack.length} frame(s)</span>
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex flex-col-reverse justify-end min-h-full pb-10">
                        <AnimatePresence mode="popLayout">
                            {state.callStack.map((frame, idx) => (
                                <StackFrameItem key={frame.id} frame={frame} index={idx} />
                            ))}
                        </AnimatePresence>

                        {state.callStack.length === 0 && (
                            <div className="text-center text-gray-400 text-sm mt-10">
                                Main script not started
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Heap Area (Right) */}
            {showHeap && (
                <div className="flex-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 relative overflow-hidden z-0">
                    <div className="absolute top-3 right-3 text-xs text-gray-400 font-bold tracking-widest uppercase pointer-events-none">
                        Heap Memory
                    </div>

                    <div className="w-full h-full relative p-10">
                        {/* 힙 노드 렌더링 */}
                        <AnimatePresence>
                            {state.heap.map((node) => (
                                <HeapNodeItem key={node.id} node={node} />
                            ))}
                        </AnimatePresence>

                        {state.heap.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                                Heap is empty
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Reference Lines Layer (SVG Overlay) - Phase 2 */}
            {/* TODO: Add SVG lines connecting specific refs */}
        </div>
    );
}
