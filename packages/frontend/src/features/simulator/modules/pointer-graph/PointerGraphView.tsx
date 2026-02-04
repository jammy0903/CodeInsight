/**
 * PointerGraphView - 포인터 관계 시각화
 *
 * 포인터 변수가 가리키는 대상을 화살표로 표시.
 * 현재는 텍스트 기반, 향후 ReactFlow나 SVG 화살표로 확장 가능.
 */

import { motion } from 'framer-motion';
import { usePointerGraphStore } from './store';

export function PointerGraphView() {
  const relations = usePointerGraphStore((s) => s.relations);

  if (relations.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: '#8b949e',
          fontSize: '12px',
        }}
      >
        No pointer relationships
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {relations.map((rel) => (
        <motion.div
          key={rel.source}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: `1px solid ${rel.recentlyDereferenced ? '#facc15' : '#30363d'}`,
            backgroundColor: rel.recentlyDereferenced
              ? 'rgba(250, 204, 21, 0.1)'
              : 'rgba(13, 17, 23, 0.6)',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {/* 포인터 이름 */}
          <span style={{ color: '#3b82f6', fontWeight: 600 }}>
            {rel.source}
          </span>

          {/* 화살표 */}
          <span style={{ color: '#8b949e' }}>{'\u2192'}</span>

          {/* 타겟 주소 */}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>
            {rel.targetAddress}
          </span>

          {/* 타겟 변수명 (알려진 경우) */}
          {rel.targetName && (
            <span style={{ color: '#8b949e', fontSize: '11px' }}>
              ({rel.targetName})
            </span>
          )}

          {/* 역참조 표시 */}
          {rel.recentlyDereferenced && (
            <span
              style={{
                fontSize: '10px',
                color: '#facc15',
                fontWeight: 700,
                marginLeft: 'auto',
              }}
            >
              DEREF
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
