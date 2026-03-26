/**
 * ThisBindingView - this 바인딩 시각화 컴포넌트
 *
 * thisState 데이터를 받아 컨텍스트 매핑 다이어그램으로 렌더링.
 * - 호출 방식 → this 값 연결
 * - 객체 속성 표시 (메서드 호출 시)
 * - 바인딩 규칙 하이라이트
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// 타입 정의
// ============================================

interface ObjectProperty {
  key: string;
  value: string;
}

interface ThisObject {
  name: string;
  properties?: ObjectProperty[];
}

interface ThisBinding {
  method?: string;
  object?: string;
  thisIs?: string;
  rule?: string;
}

interface ThisState {
  context: string;
  thisValue?: string;
  callStack?: string[];
  binding?: ThisBinding;
  objects?: ThisObject[];
  globalProperties?: ObjectProperty[];
  isStrict?: boolean;
  accessing?: string;
}

interface ThisBindingViewProps {
  thisState: ThisState;
  prevThisState?: ThisState | null;
}

// ============================================
// 색상
// ============================================

const CONTEXT_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'method call': { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', icon: '📍' },
  'function call': { bg: '#fefce8', border: '#eab308', text: '#a16207', icon: '⚡' },
  'constructor': { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', icon: '🏗️' },
  'arrow function': { bg: '#fce7f3', border: '#ec4899', text: '#be185d', icon: '➡️' },
  'explicit bind': { bg: '#f3e8ff', border: '#a855f7', text: '#7c3aed', icon: '🔗' },
  'object creation': { bg: '#fff7ed', border: '#f97316', text: '#c2410c', icon: '📦' },
  default: { bg: '#f8fafc', border: '#94a3b8', text: '#475569', icon: '🔍' },
};

// ============================================
// ObjectCard 컴포넌트
// ============================================

interface ObjectCardProps {
  obj: ThisObject;
  isThisTarget: boolean;
}

const ObjectCard = memo(function ObjectCard({ obj, isThisTarget }: ObjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border-2 overflow-hidden
        ${isThisTarget ? 'ring-2 ring-amber-400 shadow-lg' : 'shadow-sm'}
      `}
      style={{
        backgroundColor: isThisTarget ? '#fffbeb' : '#ffffff',
        borderColor: isThisTarget ? '#f59e0b' : '#e5e7eb',
      }}
    >
      {/* Object name header */}
      <div
        className="px-3 py-1.5 font-mono text-sm font-bold"
        style={{
          backgroundColor: isThisTarget ? '#fef3c7' : '#f3f4f6',
          color: isThisTarget ? '#b45309' : '#374151',
        }}
      >
        {obj.name}
        {isThisTarget && <span className="ml-2 text-amber-600">← this</span>}
      </div>

      {/* Properties */}
      {obj.properties && obj.properties.length > 0 && (
        <div className="px-3 py-2 space-y-1">
          {obj.properties.map((prop) => (
            <div key={prop.key} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-gray-600">{prop.key}:</span>
              <span className="font-mono text-blue-600">{prop.value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
});

// ============================================
// ThisBindingView 메인 컴포넌트
// ============================================

export const ThisBindingView = memo(function ThisBindingView({
  thisState,
}: ThisBindingViewProps) {
  const { t } = useTranslation();
  if (!thisState) {
    return (
      <div className="p-4 text-center text-gray-400">
        <span className="text-4xl mb-2 block">📍</span>
        <p>this 바인딩 데이터가 없습니다</p>
      </div>
    );
  }

  const contextStyle = CONTEXT_COLORS[thisState.context] || CONTEXT_COLORS.default;

  return (
    <div className="this-binding-view p-4">
      {/* Header */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>📍</span>
        <span>JavaScript this: 호출 방식에 따라 this가 결정됩니다</span>
      </div>

      {/* Context card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border-2 overflow-hidden mb-4"
        style={{ backgroundColor: contextStyle.bg, borderColor: contextStyle.border }}
      >
        {/* Context header */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: contextStyle.bg }}>
          <span className="text-xl">{contextStyle.icon}</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: contextStyle.text }}>
              {thisState.context}
            </div>
            {thisState.isStrict && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-300 font-medium">
                strict mode
              </span>
            )}
          </div>
        </div>

        {/* this binding visualization */}
        <div className="px-4 py-4 bg-white bg-opacity-50">
          {/* Call stack */}
          {thisState.callStack && thisState.callStack.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 font-medium">{t("playground.call_stack")}</div>
              <div className="flex items-center gap-1 flex-wrap">
                {thisState.callStack.map((call, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-gray-400">→</span>}
                    <span className="px-2 py-1 rounded-lg bg-white border border-gray-200 font-mono text-xs text-gray-700">
                      {call}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* this arrow */}
          <div className="flex items-center gap-4 py-3">
            <div className="px-3 py-2 rounded-lg bg-blue-100 border-2 border-blue-400 font-mono font-bold text-blue-800 text-sm">
              this
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              className="flex items-center"
            >
              <div className="h-0.5 w-12 bg-amber-400" />
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-amber-400" />
            </motion.div>
            <div className={`
              px-3 py-2 rounded-lg font-mono font-bold text-sm
              ${thisState.thisValue === 'undefined' ? 'bg-gray-100 border-2 border-gray-300 text-gray-500' : 'bg-amber-50 border-2 border-amber-400 text-amber-800'}
            `}>
              {thisState.thisValue || 'undefined'}
            </div>
          </div>

          {/* Binding details */}
          {thisState.binding && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs space-y-1">
                {thisState.binding.method && (
                  <div><span className="text-gray-500">{t("visualizer.txt_8b52dc")}</span> <span className="font-mono text-gray-800">{thisState.binding.method}</span></div>
                )}
                {thisState.binding.object && (
                  <div><span className="text-gray-500">{t("visualizer.txt_cdd750")}</span> <span className="font-mono text-gray-800">{thisState.binding.object}</span></div>
                )}
                {thisState.binding.thisIs && (
                  <div><span className="text-gray-500">this =</span> <span className="font-mono font-bold text-amber-700">{thisState.binding.thisIs}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Accessing expression */}
          {thisState.accessing && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <span className="font-mono text-sm text-amber-800">{thisState.accessing}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Objects */}
      {thisState.objects && thisState.objects.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 font-medium">{t("visualizer.txt_e8af29")}</div>
          {thisState.objects.map((obj) => (
            <ObjectCard
              key={obj.name}
              obj={obj}
              isThisTarget={thisState.thisValue === obj.name}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-400" />
            <span>this 키워드</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-50 border border-amber-400" />
            <span>this가 가리키는 값</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ThisBindingView;
