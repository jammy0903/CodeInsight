/**
 * PrototypeChainView - 프로토타입 체인 시각화 컴포넌트
 *
 * prototypeState 데이터를 받아 가로 체인 다이어그램으로 렌더링.
 * - 각 객체 박스에 속성(메서드) 나열
 * - 화살표로 [[Prototype]] 연결
 * - 프로퍼티 탐색 경로 하이라이트
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// 타입 정의
// ============================================

interface ProtoObject {
  name: string;
  props: string[];
  proto?: string; // null or parent name
  highlight?: boolean;
  highlightProp?: string;
}

interface PrototypeState {
  objects: ProtoObject[];
  lookupPath?: string[]; // property lookup chain
  lookupProp?: string; // property being looked up
  foundAt?: string; // object where property was found
}

interface PrototypeChainViewProps {
  prototypeState: PrototypeState;
  prevPrototypeState?: PrototypeState | null;
}

// ============================================
// 색상
// ============================================

const OBJ_COLORS = [
  { bg: '#eff6ff', border: '#3b82f6', header: '#dbeafe', headerText: '#1d4ed8' },
  { bg: '#f0fdf4', border: '#22c55e', header: '#dcfce7', headerText: '#15803d' },
  { bg: '#fefce8', border: '#eab308', header: '#fef9c3', headerText: '#a16207' },
  { bg: '#fce7f3', border: '#ec4899', header: '#fce7f3', headerText: '#be185d' },
  { bg: '#f3e8ff', border: '#a855f7', header: '#f3e8ff', headerText: '#7c3aed' },
];

// ============================================
// ProtoObjectCard 컴포넌트
// ============================================

interface ProtoObjectCardProps {
  obj: ProtoObject;
  colorIndex: number;
  isFoundTarget: boolean;
  isInLookupPath: boolean;
}

const ProtoObjectCard = memo(function ProtoObjectCard({
  obj,
  colorIndex,
  isFoundTarget,
  isInLookupPath,
}: ProtoObjectCardProps) {
  const { t } = useTranslation();
  const colors = OBJ_COLORS[colorIndex % OBJ_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: colorIndex * 0.1 }}
      className={`
        rounded-xl border-2 overflow-hidden min-w-[140px] flex-shrink-0
        ${isFoundTarget ? 'ring-2 ring-amber-400 shadow-lg' : isInLookupPath ? 'ring-1 ring-blue-300 shadow-md' : 'shadow-sm'}
      `}
      style={{
        backgroundColor: isFoundTarget ? '#fffbeb' : colors.bg,
        borderColor: isFoundTarget ? '#f59e0b' : colors.border,
      }}
    >
      {/* Object name header */}
      <div
        className="px-3 py-2 font-mono text-sm font-bold text-center"
        style={{
          backgroundColor: isFoundTarget ? '#fef3c7' : colors.header,
          color: isFoundTarget ? '#b45309' : colors.headerText,
        }}
      >
        {obj.name}
      </div>

      {/* Properties */}
      <div className="px-3 py-2 space-y-1">
        {obj.props.length > 0 ? (
          obj.props.map((prop) => {
            const isHighlightedProp = obj.highlightProp === prop
              || (isFoundTarget && prop === obj.highlightProp);

            return (
              <div
                key={prop}
                className={`
                  px-2 py-1 rounded text-xs font-mono
                  ${isHighlightedProp ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300' : 'bg-white text-gray-700 border border-gray-100'}
                `}
              >
                {prop}
              </div>
            );
          })
        ) : (
          <span className="text-xs text-gray-400 italic">{t('visualizer.no_properties')}</span>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// ChainArrow 컴포넌트
// ============================================

const ChainArrow = memo(function ChainArrow({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center flex-shrink-0 px-1">
      <div className={`h-0.5 w-8 ${isActive ? 'bg-blue-400' : 'bg-gray-300'}`} />
      <div
        className={`
          w-0 h-0 border-t-[5px] border-t-transparent
          border-b-[5px] border-b-transparent
          border-l-[8px]
          ${isActive ? 'border-l-blue-400' : 'border-l-gray-300'}
        `}
      />
    </div>
  );
});

// ============================================
// PrototypeChainView 메인 컴포넌트
// ============================================

export const PrototypeChainView = memo(function PrototypeChainView({
  prototypeState,
}: PrototypeChainViewProps) {
  const { t } = useTranslation();
  const objects = prototypeState?.objects;

  // Build ordered chain: object → proto → proto → ... → null
  const chains = useMemo(() => {
    const objectList = objects ?? [];
    if (objectList.length === 0) return [];

    // For each root, build chain
    const result: ProtoObject[][] = [];

    // Walk from first object following proto links
    const chain: ProtoObject[] = [];
    const visited = new Set<string>();

    // First, add all objects not in proto chain (they appear before any chain)
    // Actually, just build one flat chain from the objects array in order
    // since the JSON is already ordered as chain
    objectList.forEach((obj) => {
      if (!visited.has(obj.name)) {
        chain.push(obj);
        visited.add(obj.name);
      }
    });

    // Add terminal null
    const lastProto = chain[chain.length - 1]?.proto;
    if (lastProto && !visited.has(lastProto)) {
      chain.push({ name: lastProto, props: ['toString()', 'hasOwnProperty()', '...'], proto: undefined });
    }

    result.push(chain);
    return result;
  }, [objects]);

  const lookupPathSet = useMemo(
    () => new Set(prototypeState?.lookupPath ?? []),
    [prototypeState?.lookupPath]
  );

  if (!prototypeState) {
    return (
      <div className="p-4 text-center text-gray-400">
        <span className="text-4xl mb-2 block">🔗</span>
        <p>{t('visualizer.no_data')}</p>
      </div>
    );
  }

  return (
    <div className="prototype-chain-view p-4">
      {/* Header */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>🔗</span>
        <span>{t('visualizer.prototype_desc')}</span>
      </div>

      {/* Chains */}
      {chains.map((chain, chainIdx) => (
        <div key={chainIdx} className="mb-6">
          {/* Horizontal chain */}
          <div className="flex items-center gap-0 overflow-x-auto pb-4">
            {chain.map((obj, i) => (
              <div key={obj.name} className="flex items-center">
                <ProtoObjectCard
                  obj={obj}
                  colorIndex={i}
                  isFoundTarget={prototypeState.foundAt === obj.name}
                  isInLookupPath={lookupPathSet.has(obj.name)}
                />
                {i < chain.length - 1 && (
                  <ChainArrow
                    isActive={lookupPathSet.has(obj.name) && lookupPathSet.has(chain[i + 1].name)}
                  />
                )}
              </div>
            ))}
            {/* null terminator */}
            <div className="flex items-center">
              <ChainArrow isActive={false} />
              <div className="px-3 py-2 rounded-lg bg-gray-100 border-2 border-gray-300 text-gray-400 font-mono text-sm font-bold">
                null
              </div>
            </div>
          </div>

          {/* Lookup info */}
          {prototypeState.lookupProp && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm"
            >
              <span className="text-blue-600 font-mono font-bold">{prototypeState.lookupProp}</span>
              {prototypeState.foundAt ? (
                <span className="text-blue-800">
                  {' '}→ {t('visualizer.found_at', { name: prototypeState.foundAt })}
                </span>
              ) : (
                <span className="text-gray-500"> {t('visualizer.searching')}</span>
              )}
            </motion.div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="mt-5 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-4 bg-gray-300" />
            <span className="mr-1">→</span>
            <span>{t('visualizer.prototype_link')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-50 border border-amber-400" />
            <span>{t('visualizer.found_location')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrototypeChainView;
