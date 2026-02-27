/**
 * ScopeView - 스코프 체인 시각화 컴포넌트
 *
 * scopeState 데이터를 받아 중첩 박스 다이어그램으로 렌더링.
 * - Global → Function → Block 순 중첩
 * - var는 함수 스코프, let/const는 블록 스코프 표시
 * - 하이라이트된 스코프/변수 강조
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// 타입 정의
// ============================================

interface ScopeVariable {
  name: string;
  value?: unknown;
  keyword?: string; // 'var' | 'let' | 'const' | 'function'
  hoisted?: boolean;
}

interface ScopeEntry {
  name: string;
  type: 'global' | 'function' | 'block' | 'module';
  variables: ScopeVariable[];
  children?: ScopeEntry[];
}

interface ScopeState {
  scopes: ScopeEntry[];
  highlightScope?: string;
  highlightVariable?: string;
}

interface ScopeViewProps {
  scopeState: ScopeState;
  prevScopeState?: ScopeState | null;
}

// ============================================
// 색상 설정
// ============================================

const SCOPE_COLORS: Record<string, { bg: string; border: string; header: string; headerText: string }> = {
  global: {
    bg: '#f8fafc',
    border: '#94a3b8',
    header: '#e2e8f0',
    headerText: '#475569',
  },
  function: {
    bg: '#eff6ff',
    border: '#3b82f6',
    header: '#dbeafe',
    headerText: '#1d4ed8',
  },
  block: {
    bg: '#fefce8',
    border: '#eab308',
    header: '#fef9c3',
    headerText: '#a16207',
  },
  module: {
    bg: '#f0fdf4',
    border: '#22c55e',
    header: '#dcfce7',
    headerText: '#15803d',
  },
};

const KEYWORD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  var: { bg: '#fef3c7', text: '#b45309', border: '#fbbf24' },
  let: { bg: '#dbeafe', text: '#1d4ed8', border: '#60a5fa' },
  const: { bg: '#d1fae5', text: '#059669', border: '#34d399' },
  function: { bg: '#fce7f3', text: '#be185d', border: '#f472b6' },
};

// ============================================
// VariableChip 컴포넌트
// ============================================

interface VariableChipProps {
  variable: ScopeVariable;
  isHighlighted: boolean;
}

const VariableChip = memo(function VariableChip({ variable, isHighlighted }: VariableChipProps) {
  const { t } = useTranslation();
  const keyword = variable.keyword || 'let';
  const kwColor = KEYWORD_COLORS[keyword] || KEYWORD_COLORS.let;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border
        ${isHighlighted ? 'ring-2 ring-amber-400 shadow-md' : 'shadow-sm'}
      `}
      style={{
        backgroundColor: isHighlighted ? '#fefce8' : '#ffffff',
        borderColor: isHighlighted ? '#fbbf24' : '#e5e7eb',
      }}
    >
      {/* Keyword badge */}
      <span
        className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"
        style={{
          backgroundColor: kwColor.bg,
          color: kwColor.text,
          border: `1px solid ${kwColor.border}`,
        }}
      >
        {keyword}
      </span>

      {/* Variable name */}
      <span className="font-mono text-sm font-semibold text-gray-800">
        {variable.name}
      </span>

      {/* Value */}
      {variable.value !== undefined && (
        <>
          <span className="text-gray-400">=</span>
          <span className="font-mono text-sm text-blue-600">
            {String(variable.value)}
          </span>
        </>
      )}

      {/* Hoisted indicator */}
      {variable.hoisted && (
        <span className="text-[10px] text-amber-600 font-medium">↑{t('visualizer.hoisting')}</span>
      )}
    </motion.div>
  );
});

// ============================================
// ScopeBlock 컴포넌트 (재귀적 중첩)
// ============================================

interface ScopeBlockProps {
  scope: ScopeEntry;
  highlightScope?: string;
  highlightVariable?: string;
  depth: number;
}

const ScopeBlock = memo(function ScopeBlock({
  scope,
  highlightScope,
  highlightVariable,
  depth,
}: ScopeBlockProps) {
  const { t } = useTranslation();
  const colors = SCOPE_COLORS[scope.type] || SCOPE_COLORS.block;
  const isHighlighted = highlightScope === scope.name;

  // Scope icon
  const icon = scope.type === 'global' ? '🌍' : scope.type === 'function' ? '⚙️' : '📦';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        rounded-xl overflow-hidden border-2
        ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-sm'}
      `}
      style={{
        backgroundColor: colors.bg,
        borderColor: isHighlighted ? '#3b82f6' : colors.border,
        marginLeft: depth > 0 ? 12 : 0,
      }}
    >
      {/* Scope header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ backgroundColor: colors.header }}
      >
        <span className="text-sm">{icon}</span>
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: colors.headerText }}
        >
          {scope.name}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{
          backgroundColor: colors.bg,
          color: colors.headerText,
          border: `1px solid ${colors.border}`,
        }}>
          {scope.type}
        </span>
      </div>

      {/* Variables */}
      <div className="p-3">
        {scope.variables.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {scope.variables.map((v) => (
              <VariableChip
                key={v.name}
                variable={v}
                isHighlighted={highlightVariable === v.name && isHighlighted}
              />
            ))}
          </div>
        ) : (
          !scope.children?.length && (
            <span className="text-xs text-gray-400 italic">{t('visualizer.no_properties')}</span>
          )
        )}

        {/* Nested scopes */}
        {scope.children && scope.children.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            {scope.children.map((child) => (
              <ScopeBlock
                key={child.name}
                scope={child}
                highlightScope={highlightScope}
                highlightVariable={highlightVariable}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// ScopeView 메인 컴포넌트
// ============================================

export const ScopeView = memo(function ScopeView({
  scopeState,
}: ScopeViewProps) {
  const { t } = useTranslation();
  // Build nested scope tree from flat array
  const scopeTree = useMemo(() => {
    if (!scopeState?.scopes || scopeState.scopes.length === 0) return [];

    // The JSON stores a flat list of scopes. Build nesting:
    // Global is outermost, then function, then block scopes are children of the preceding function/global
    const scopes = scopeState.scopes;
    if (scopes.length <= 1) return scopes;

    // Simple nesting: each scope is a child of the previous one
    const root = { ...scopes[0], children: [] as ScopeEntry[] };
    let current = root;

    for (let i = 1; i < scopes.length; i++) {
      const child = { ...scopes[i], children: [] as ScopeEntry[] };
      current.children = current.children || [];
      current.children.push(child);
      current = child;
    }

    return [root];
  }, [scopeState?.scopes]);

  if (!scopeState) {
    return (
      <div className="p-4 text-center text-gray-400">
        <span className="text-4xl mb-2 block">🔍</span>
        <p>{t('visualizer.scope_no_data')}</p>
      </div>
    );
  }

  return (
    <div className="scope-view p-4">
      {/* Header */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>🔍</span>
        <span>{t('visualizer.scope_desc')}</span>
      </div>

      {/* Scope tree */}
      <div className="flex flex-col gap-3">
        {scopeTree.map((scope) => (
          <ScopeBlock
            key={scope.name}
            scope={scope}
            highlightScope={scopeState.highlightScope}
            highlightVariable={scopeState.highlightVariable}
            depth={0}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {Object.entries(KEYWORD_COLORS).map(([kw, c]) => (
            <div key={kw} className="flex items-center gap-1">
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"
                style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
              >
                {kw}
              </span>
              <span>
                {kw === 'var' ? t('visualizer.scope_function') : kw === 'let' ? t('visualizer.scope_block') : kw === 'const' ? t('visualizer.scope_block_immutable') : t('visualizer.scope_function_type')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ScopeView;
