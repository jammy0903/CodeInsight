/**
 * NamesPanel - Python 변수 이름 패널
 * 변수명 + 스코프 표시, 호버 시 연결된 객체 하이라이트
 */

import { motion } from 'framer-motion';
import type { PyName } from '@/types/py-simulator';
import { getScopeColor, CHANGE_COLORS } from '../constants';

interface NamesPanelProps {
  names: PyName[];
  highlightedNames?: string[];
  hoveredName: string | null;
  onNameHover: (name: string | null) => void;
}

export function NamesPanel({
  names,
  highlightedNames = [],
  hoveredName,
  onNameHover,
}: NamesPanelProps) {
  // 스코프별 그룹화 (scope가 없으면 'global' 기본값)
  const scopeGroups = new Map<string, PyName[]>();
  names.forEach((n) => {
    const scope = n.scope || 'global';
    if (!scopeGroups.has(scope)) {
      scopeGroups.set(scope, []);
    }
    scopeGroups.get(scope)!.push({ ...n, scope });
  });

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">
        Names (변수)
      </h3>

      <div className="space-y-3">
        {/* 각 스코프별 그룹 */}
        {Array.from(scopeGroups.entries()).map(([scope, scopeNames], idx) => (
          <NameGroup
            key={`${scope || 'unknown'}-${idx}`}
            label={scope}
            names={scopeNames}
            highlightedNames={highlightedNames}
            hoveredName={hoveredName}
            onNameHover={onNameHover}
          />
        ))}

        {/* Empty state */}
        {names.length === 0 && (
          <div className="text-sm text-gray-400 italic">
            아직 변수가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

/** 스코프별 이름 그룹 */
function NameGroup({
  label,
  names,
  highlightedNames,
  hoveredName,
  onNameHover,
}: {
  label: string; // 프레임명: 'global', '__main__', 함수명 등
  names: PyName[];
  highlightedNames: string[];
  hoveredName: string | null;
  onNameHover: (name: string | null) => void;
}) {
  const scopeColor = getScopeColor(label);

  return (
    <div>
      <div
        className="text-[10px] font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: scopeColor.text }}
      >
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {names.map((pyName, idx) => (
          <NameChip
            key={`${pyName.scope}:${pyName.name}:${idx}`}
            pyName={pyName}
            isHighlighted={highlightedNames.includes(pyName.name)}
            isHovered={hoveredName === pyName.name}
            onHover={onNameHover}
          />
        ))}
      </div>
    </div>
  );
}

/** 개별 이름 칩 */
function NameChip({
  pyName,
  isHighlighted,
  isHovered,
  onHover,
}: {
  pyName: PyName;
  isHighlighted: boolean;
  isHovered: boolean;
  onHover: (name: string | null) => void;
}) {
  const scopeColor = getScopeColor(pyName.scope);

  return (
    <motion.div
      data-name-id={pyName.name}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative cursor-pointer transition-all duration-150"
      style={{
        backgroundColor: isHighlighted ? CHANGE_COLORS.bg : scopeColor.bg,
        border: `2px solid ${isHighlighted ? CHANGE_COLORS.border : isHovered ? scopeColor.main : scopeColor.border}`,
        borderRadius: '8px',
        padding: '6px 12px',
        boxShadow: isHighlighted
          ? CHANGE_COLORS.glow
          : isHovered
            ? `0 0 8px ${scopeColor.main}40`
            : 'none',
      }}
      onMouseEnter={() => onHover(pyName.name)}
      onMouseLeave={() => onHover(null)}
    >
      {/* 변수명 */}
      <span
        className="font-mono font-medium text-sm"
        style={{ color: scopeColor.text }}
      >
        {pyName.name}
      </span>

      {/* 화살표 (참조 표시) */}
      <span className="ml-2 text-gray-400 text-xs">→</span>

      {/* 참조 대상 ID */}
      <span className="ml-1 text-[10px] font-mono text-gray-500">
        #{pyName.pointsTo}
      </span>
    </motion.div>
  );
}
