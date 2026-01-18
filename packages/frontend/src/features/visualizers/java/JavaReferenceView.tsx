/**
 * Java Reference Visualizer
 *
 * 목적: 메모 스티커 비유로 참조 관계 시각화
 * - Stack: 참조 변수 (메모 스티커)
 * - Heap: 실제 객체 (물건)
 * - Arrow: 변수 → 객체 참조 연결
 */

import { memo } from 'react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StackVariable {
  name: string;
  value: string | number;
  type?: string;
}

interface HeapObject {
  address: string;
  content: string | number;
  type?: string;
  new?: boolean; // 새로 생성된 객체 하이라이트
}

interface JavaReferenceViewProps {
  stack?: StackVariable[];
  heap?: HeapObject[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 참조 여부 판단
 * "-> 0x001" 형태인지 확인
 */
function isReference(value: string | number): boolean {
  return typeof value === 'string' && value.startsWith('->');
}

/**
 * 참조에서 주소 추출
 * "-> 0x001" → "0x001"
 */
function extractAddress(value: string | number): string | null {
  if (typeof value === 'string' && value.startsWith('->')) {
    return value.replace('->', '').trim();
  }
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-Components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Stack 변수 카드
 */
const StackVariableCard = memo(({ variable }: { variable: StackVariable }) => {
  const isRef = isReference(variable.value);
  const address = extractAddress(variable.value);

  return (
    <div
      className="border-2 rounded-lg p-3 bg-white shadow-sm"
      style={{
        borderColor: isRef ? '#8b5cf6' : '#64748b', // 보라색(참조) or 회색(값)
      }}
    >
      <div className="flex items-center justify-between gap-2">
        {/* 변수명 */}
        <div className="font-mono text-sm font-semibold text-gray-700">
          {variable.name}
        </div>

        {/* 값 */}
        <div
          className="font-mono text-sm px-2 py-1 rounded"
          style={{
            color: isRef ? '#8b5cf6' : '#1e293b',
            backgroundColor: isRef ? '#f3e8ff' : '#f1f5f9',
          }}
        >
          {isRef ? address : variable.value}
        </div>
      </div>

      {/* 타입 (있으면 표시) */}
      {variable.type && (
        <div className="text-xs text-gray-500 mt-1">
          {variable.type}
        </div>
      )}
    </div>
  );
});
StackVariableCard.displayName = 'StackVariableCard';

/**
 * Heap 객체 카드
 */
const HeapObjectCard = memo(({ object }: { object: HeapObject }) => {
  return (
    <div
      className="border-2 rounded-lg p-3 shadow-sm"
      style={{
        borderColor: object.new ? '#10b981' : '#059669', // 초록색
        backgroundColor: object.new ? '#d1fae5' : '#ffffff',
      }}
    >
      {/* 주소 */}
      <div className="font-mono text-xs text-gray-500 mb-1">
        {object.address}
      </div>

      {/* 내용 */}
      <div className="font-mono text-sm font-semibold text-gray-800">
        {object.content}
      </div>

      {/* 타입 (있으면 표시) */}
      {object.type && (
        <div className="text-xs text-gray-500 mt-1">
          {object.type}
        </div>
      )}

      {/* NEW 배지 */}
      {object.new && (
        <div className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
          NEW
        </div>
      )}
    </div>
  );
});
HeapObjectCard.displayName = 'HeapObjectCard';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const JavaReferenceView = memo(({ stack = [], heap = [] }: JavaReferenceViewProps) => {
  return (
    <div className="flex gap-6 p-4">
      {/* Stack 영역 */}
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
          Stack (참조 변수)
        </h3>
        <div className="space-y-2">
          {stack.length === 0 ? (
            <div className="text-gray-400 text-sm italic">Empty</div>
          ) : (
            stack.map((variable, idx) => (
              <StackVariableCard key={`stack-${variable.name}-${idx}`} variable={variable} />
            ))
          )}
        </div>
      </div>

      {/* Heap 영역 */}
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
          Heap (실제 객체)
        </h3>
        <div className="space-y-2">
          {heap.length === 0 ? (
            <div className="text-gray-400 text-sm italic">Empty</div>
          ) : (
            heap.map((object, idx) => (
              <HeapObjectCard key={`heap-${object.address}-${idx}`} object={object} />
            ))
          )}
        </div>
      </div>
    </div>
  );
});
JavaReferenceView.displayName = 'JavaReferenceView';
