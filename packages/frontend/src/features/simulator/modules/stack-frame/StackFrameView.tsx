/**
 * StackFrameView - 스택 세그먼트 시각화
 *
 * CMemoryView의 Stack MemorySegment를 독립 모듈 뷰로 추출.
 * RSP/RBP 레지스터 표시 포함.
 */

import { MemoryBlockRow } from '../shared';
import { useStackFrameStore } from './store';

export function StackFrameView() {
  const blocks = useStackFrameStore((s) => s.blocks);
  const registers = useStackFrameStore((s) => s.registers);
  const changedNames = useStackFrameStore((s) => s.changedNames);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 레지스터 표시 */}
      {(registers.rsp || registers.rbp) && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
          {registers.rsp && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: '#ef4444',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
            >
              RSP: {registers.rsp}
            </span>
          )}
          {registers.rbp && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: '#3b82f6',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
            >
              RBP: {registers.rbp}
            </span>
          )}
        </div>
      )}

      {/* 블록 목록 */}
      {blocks.length === 0 ? (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#8b949e',
            fontSize: '12px',
          }}
        >
          Empty
        </div>
      ) : (
        blocks.map((block, idx) => (
          <MemoryBlockRow
            key={`${block.address}-${idx}`}
            block={block}
            isChanged={changedNames.has(block.name) || changedNames.has(block.address)}
          />
        ))
      )}
    </div>
  );
}
