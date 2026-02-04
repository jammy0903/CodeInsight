/**
 * NameBindingView - Python 이름 바인딩 시각화
 *
 * 변수 이름이 어떤 객체를 가리키는지 표시.
 * "포스트잇" 스타일 — 이름 태그 + 화살표 → 객체 ID.
 */

import { motion } from 'framer-motion';
import { useNameBindingStore } from './store';

/** 스코프별 색상 */
const SCOPE_COLORS: Record<string, string> = {
  global: '#a78bfa',
  '__main__': '#a78bfa',
  local: '#60a5fa',
};

function getScopeColor(scope: string): string {
  return SCOPE_COLORS[scope] || '#60a5fa';
}

export function NameBindingView() {
  const names = useNameBindingStore((s) => s.names);

  if (names.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: '#8b949e',
          fontSize: '12px',
        }}
      >
        No name bindings
      </div>
    );
  }

  // 스코프별 그룹핑
  const byScope = new Map<string, typeof names>();
  for (const name of names) {
    const group = byScope.get(name.scope) || [];
    group.push(name);
    byScope.set(name.scope, group);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[...byScope.entries()].map(([scope, scopeNames]) => (
        <div key={scope}>
          {/* 스코프 헤더 */}
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: getScopeColor(scope),
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px',
              fontFamily: 'monospace',
            }}
          >
            {scope}
          </div>

          {/* 이름 바인딩 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {scopeNames.map((binding) => (
              <motion.div
                key={`${binding.scope}-${binding.name}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${binding.highlight ? '#facc15' : '#30363d'}`,
                  backgroundColor: binding.highlight
                    ? 'rgba(250, 204, 21, 0.1)'
                    : 'rgba(13, 17, 23, 0.6)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                {/* 이름 (포스트잇 스타일) */}
                <span
                  style={{
                    fontWeight: 700,
                    color: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                  }}
                >
                  {binding.name}
                </span>

                {/* 화살표 */}
                <span style={{ color: '#60a5fa' }}>{'\u2192'}</span>

                {/* 객체 ID */}
                <span style={{ color: '#8b949e', fontWeight: 600 }}>
                  {binding.objectId}
                </span>

                {/* 타입 (알려진 경우) */}
                {binding.objectType && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#6e7681',
                      marginLeft: 'auto',
                    }}
                  >
                    {binding.objectType}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
