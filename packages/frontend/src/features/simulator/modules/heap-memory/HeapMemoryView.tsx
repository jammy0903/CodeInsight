/**
 * HeapMemoryView - 힙 세그먼트 시각화
 *
 * CMemoryView의 Heap MemorySegment를 독립 모듈 뷰로 추출.
 * malloc/free 동적 할당 블록 표시.
 */

import { MemoryBlockRow } from '../shared';
import { useHeapMemoryStore } from './store';

export function HeapMemoryView() {
  const blocks = useHeapMemoryStore((s) => s.blocks);
  const changedAddresses = useHeapMemoryStore((s) => s.changedAddresses);

  if (blocks.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: '#8b949e',
          fontSize: '12px',
        }}
      >
        No heap allocations
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          fontSize: '10px',
          color: '#8b949e',
          fontFamily: 'monospace',
          marginBottom: '4px',
        }}
      >
        {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'} allocated
      </div>

      {blocks.map((block, idx) => (
        <MemoryBlockRow
          key={`${block.address}-${idx}`}
          block={block}
          isChanged={changedAddresses.has(block.address) || changedAddresses.has(block.name)}
        />
      ))}
    </div>
  );
}
