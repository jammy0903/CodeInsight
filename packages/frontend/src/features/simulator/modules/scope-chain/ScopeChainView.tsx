/**
 * ScopeChainView - JavaScript 스코프 체인 시각화
 *
 * 중첩 스코프를 박스 안의 박스로 표시.
 * global → function → block 순으로 중첩.
 * 활성 스코프는 강조 표시.
 */

import { motion } from 'framer-motion';
import { useScopeChainStore } from './store';
import type { ScopeType } from './store';

/** 스코프 타입별 색상 */
const SCOPE_COLORS: Record<ScopeType, { border: string; bg: string; label: string }> = {
  global: { border: '#8b949e', bg: 'rgba(139, 148, 158, 0.08)', label: '#8b949e' },
  function: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', label: '#60a5fa' },
  block: { border: '#a78bfa', bg: 'rgba(167, 139, 250, 0.08)', label: '#c084fc' },
  module: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', label: '#fbbf24' },
  class: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', label: '#34d399' },
};

export function ScopeChainView() {
  const scopes = useScopeChainStore((s) => s.scopes);

  if (scopes.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: '#8b949e',
          fontSize: '12px',
        }}
      >
        No active scopes
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {scopes.map((scope, idx) => {
        const color = SCOPE_COLORS[scope.scopeType] || SCOPE_COLORS.block;
        const depth = idx;

        return (
          <motion.div
            key={`${scope.name}-${idx}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              marginLeft: `${depth * 12}px`,
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${scope.isActive ? '#facc15' : color.border}`,
              backgroundColor: scope.isActive ? 'rgba(250, 204, 21, 0.08)' : color.bg,
              transition: 'all 0.3s ease',
            }}
          >
            {/* 스코프 헤더 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: scope.variables.length > 0 ? '6px' : 0,
              }}
            >
              {/* 스코프 타입 배지 */}
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#fff',
                  backgroundColor: color.border,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {scope.scopeType}
              </span>

              {/* 스코프 이름 */}
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: color.label,
                }}
              >
                {scope.name}
              </span>

              {/* 활성 표시 */}
              {scope.isActive && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#facc15',
                    fontWeight: 700,
                    marginLeft: 'auto',
                  }}
                >
                  ACTIVE
                </span>
              )}
            </div>

            {/* 스코프 내 변수 */}
            {scope.variables.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                {scope.variables.map((v) => (
                  <span
                    key={v.name}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#e6edf3',
                      backgroundColor: 'rgba(110, 118, 129, 0.2)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {v.name}
                    {v.value !== undefined && (
                      <span style={{ color: '#8b949e' }}>
                        {' '}= {String(v.value)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
