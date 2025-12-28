/**
 * ProcessMemoryView
 * 전체 프로세스 메모리 레이아웃 (CODE, DATA, HEAP, STACK)
 * 포인터 연결 시각화: Xarrow로 화살표 그리기
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Xarrow from 'react-xarrows';
import type { Step, ViewMode, MemoryBlock } from '../types';
import { MemorySegment } from './MemorySegment';
import { REGISTER_COLORS, getRoleLabel, PULSE_VARIANTS, getPointerColor, ARROW_CONFIG } from '../constants';
import { toBlockId } from '../utils';

interface ProcessMemoryViewProps {
  step: Step | null;
  onViewChange: (view: ViewMode) => void;
}

export function ProcessMemoryView({ step, onViewChange }: ProcessMemoryViewProps) {
  // 선택된 포인터 주소 (탭/클릭 시 하이라이트)
  const [selectedPointer, setSelectedPointer] = useState<string | null>(null);

  // 모든 블록에서 포인터 연결 정보 추출
  const allBlocks = useMemo(() => {
    if (!step) return [];
    return [...step.stack, ...step.heap];
  }, [step]);

  // 포인터 인덱스 맵 (주소 -> 색상 인덱스)
  const pointerIndexMap = useMemo(() => {
    if (!step) return new Map<string, number>();
    const map = new Map<string, number>();
    let idx = 0;
    for (const block of step.stack) {
      if (block.points_to) {
        map.set(block.address, idx++);
      }
    }
    return map;
  }, [step]);

  // 포인터 연결선 정보 추출
  const pointerConnections = useMemo(() => {
    if (!step) return [];

    const connections: { from: string; to: string; fromName: string; colorIndex: number }[] = [];
    const allAddresses = new Set([
      ...step.stack.map(b => b.address),
      ...step.heap.map(b => b.address),
    ]);

    // 스택에서 포인터 찾기
    for (const block of step.stack) {
      if (block.points_to && allAddresses.has(block.points_to)) {
        connections.push({
          from: block.address,
          to: block.points_to,
          fromName: block.name,
          colorIndex: pointerIndexMap.get(block.address) ?? 0,
        });
      }
    }

    return connections;
  }, [step, pointerIndexMap]);

  // 블록의 포인터 색상 가져오기
  const getBlockPointerColor = (block: MemoryBlock) => {
    const idx = pointerIndexMap.get(block.address);
    if (idx !== undefined) return getPointerColor(idx);
    // 타겟 블록인 경우 소스 포인터의 색상 찾기
    if (!step) return null;
    for (const [addr, i] of pointerIndexMap) {
      const srcBlock = step.stack.find(b => b.address === addr);
      if (srcBlock?.points_to === block.address) return getPointerColor(i);
    }
    return null;
  };

  // 블록이 하이라이트 대상인지 확인
  const isHighlighted = (block: MemoryBlock) => {
    if (!selectedPointer) return false;
    const selectedBlock = allBlocks.find((b) => b.address === selectedPointer);
    return block.address === selectedPointer || block.address === selectedBlock?.points_to;
  };

  // 포인터 블록 클릭 핸들러
  const handlePointerClick = (e: React.MouseEvent, block: MemoryBlock) => {
    e.stopPropagation();
    if (block.points_to) {
      setSelectedPointer((prev) => (prev === block.address ? null : block.address));
    }
  };

  if (!step) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/15 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Click "Analyze" to visualize memory</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" onClick={() => setSelectedPointer(null)}>
      {/* 2열 레이아웃: 세그먼트+화살표(60%) + 여유공간(40%) */}
      <div className="grid grid-cols-[60%_40%] h-full">
        {/* Column 1: 세그먼트 + 화살표 */}
        <div className="p-4">
          {/* 세그먼트 컨테이너 - 동일한 너비 */}
          <div className="w-72 mx-auto">
            <div className="text-center text-sm text-muted-foreground mb-2">High Address</div>

            {/* STACK */}
            <motion.div whileHover={{ scale: 1.01 }}>
              <div
                className="rounded-lg overflow-hidden cursor-pointer"
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                }}
                onClick={() => onViewChange('stack-detail')}
              >
                <div
                  className="px-3 py-1.5 flex items-center justify-between"
                  style={{ backgroundColor: 'rgba(168, 85, 247, 0.25)' }}
                >
                  <span className="text-base font-bold" style={{ color: '#a855f7' }}>STACK</span>
                  <span className="text-sm text-muted-foreground">{step.stack.length} vars</span>
                </div>
                <div className="p-2 text-sm flex flex-col divide-y divide-border/30">
                  <div className="grid items-center gap-2 py-1.5" style={{ gridTemplateColumns: '30% 1fr 18%' }}>
                    <div className="text-center text-muted-foreground font-mono text-xs">Frame Base</div>
                    <div className="flex items-center justify-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: REGISTER_COLORS.rbp }} />
                      <span className="font-medium" style={{ color: REGISTER_COLORS.rbp }}>RBP</span>
                    </div>
                    <div className="font-mono text-muted-foreground text-center text-xs">{step.rbp.slice(-4)}</div>
                  </div>
                  {step.stack.slice(0, 4).map((block) => {
                    const hasPointer = !!block.points_to;
                    const highlighted = isHighlighted(block);
                    const ptrColor = getBlockPointerColor(block);
                    const roleLabel = getRoleLabel(block.type, 'stack');
                    return (
                      <motion.div
                        key={block.address}
                        id={toBlockId(block.address)}
                        className="grid items-center gap-2 py-1.5"
                        style={{ gridTemplateColumns: '30% 1fr 18%' }}
                        variants={PULSE_VARIANTS}
                        animate={highlighted ? 'pulse' : 'idle'}
                        onClick={(e) => hasPointer && handlePointerClick(e, block)}
                      >
                        <div className="text-center text-muted-foreground font-mono text-xs">{roleLabel}</div>
                        <div
                          className="flex items-center justify-center gap-2 px-2 py-1 rounded"
                          style={{
                            backgroundColor: highlighted && ptrColor ? ptrColor.bg : 'rgba(0,0,0,0.2)',
                            border: highlighted && ptrColor ? `2px solid ${ptrColor.border}` : '2px solid transparent',
                            cursor: hasPointer ? 'pointer' : 'default',
                          }}
                        >
                          <span className="font-medium" style={{ color: '#a855f7' }}>
                            {block.name}{hasPointer && ptrColor && <span style={{ color: ptrColor.main }}> →</span>}
                          </span>
                          <span className="text-muted-foreground text-xs">= {block.value}</span>
                        </div>
                        <div className="font-mono text-muted-foreground text-center text-xs">{block.address.slice(-4)}</div>
                      </motion.div>
                    );
                  })}
                  {step.stack.length > 4 && (
                    <div className="text-muted-foreground text-center py-1 text-sm">+{step.stack.length - 4} more</div>
                  )}
                  <div className="grid items-center gap-2 py-1.5" style={{ gridTemplateColumns: '30% 1fr 18%' }}>
                    <div className="text-center text-muted-foreground font-mono text-xs">Stack Top</div>
                    <div className="flex items-center justify-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: REGISTER_COLORS.rsp }} />
                      <span className="font-medium" style={{ color: REGISTER_COLORS.rsp }}>RSP</span>
                    </div>
                    <div className="font-mono text-muted-foreground text-center text-xs">{step.rsp.slice(-4)}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* HEAP */}
            <div className="mt-3">
              <motion.div whileHover={{ scale: 1.01 }}>
                <MemorySegment
                  type="heap"
                  label="HEAP"
                  blocks={step.heap}
                  onClick={() => onViewChange('heap-detail')}
                  onPointerClick={handlePointerClick}
                  isBlockHighlighted={isHighlighted}
                  getBlockColor={getBlockPointerColor}
                />
              </motion.div>
            </div>

            {/* DATA */}
            <div className="mt-3">
              <MemorySegment type="data" label="DATA" />
            </div>

            {/* CODE */}
            <div className="mt-3">
              <MemorySegment type="code" label="CODE" />
            </div>

            <div className="text-center text-sm text-muted-foreground mt-2">Low Address</div>
          </div>

          {/* 포인터 화살표 렌더링 (Column 1 내부) */}
          {pointerConnections.map((conn) => {
            const color = getPointerColor(conn.colorIndex);
            const isSelected = selectedPointer === conn.from;
            return (
              <Xarrow
                key={`arrow-${conn.from}-${conn.to}`}
                start={toBlockId(conn.from)}
                end={toBlockId(conn.to)}
                color={color.main}
                strokeWidth={isSelected ? ARROW_CONFIG.strokeWidth + 1 : ARROW_CONFIG.strokeWidth}
                headSize={ARROW_CONFIG.headSize}
                path={ARROW_CONFIG.path}
                gridBreak={ARROW_CONFIG.gridBreak}
                startAnchor="right"
                endAnchor="right"
                dashness={isSelected ? false : { animation: 1 }}
                showHead={true}
                _cpx1Offset={30 + conn.colorIndex * 10}
                _cpx2Offset={30 + conn.colorIndex * 10}
              />
            );
          })}
        </div>

        {/* Column 2: 여유 공간 */}
        <div />
      </div>
    </div>
  );
}
