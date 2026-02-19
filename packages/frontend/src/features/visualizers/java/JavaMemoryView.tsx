/**
 * JavaMemoryView - Java 메모리 시각화 컴포넌트
 *
 * 설계 원칙:
 * - Stack: 함수 프레임 계층 구조 (main, foo, bar...)
 * - Heap: 모든 참조 타입 표시 (String, 배열, 객체)
 * - 호버 시 연결된 Stack ↔ Heap 박스가 함께 반짝임
 * - 타입별 색상 구분:
 *   - 노란색: primitive (int, boolean 등)
 *   - 초록색: String
 *   - 주황색: 배열 (int[], String[] 등)
 *   - 핑크색: 객체 (Person, ArrayList 등)
 *
 * 메모리 레이아웃:
 * ┌─────────────────────────────────────┐
 * │ STACK                               │
 * │ ┌─────────────────────────────────┐ │
 * │ │ main()                          │ │
 * │ │   x = 10          [노랑] int    │ │
 * │ │   name → 0x030    [초록] String │ │ ← 호버 시 Heap 연결
 * │ │   arr → 0x001     [주황] int[]  │ │
 * │ └─────────────────────────────────┘ │
 * ├─────────────────────────────────────┤
 * │ HEAP                                │
 * │   0x030: String "hello"            │ ← 호버 시 같이 반짝
 * │   0x001: int[] [1, 2, 3]           │
 * └─────────────────────────────────────┘
 */

import { useState } from 'react';

// ============================================================
// 타입 정의
// ============================================================

export interface JavaVariable {
  name: string;
  value: string | number | boolean | null;
  type: string;
  /** 참조 타입인 경우 힙 주소 */
  refAddress?: string;
  /** String의 경우 실제 값 (인라인 표시용) */
  displayValue?: string;
  /** 변경됨 표시 */
  isChanged?: boolean;
}

export interface JavaStackFrame {
  name: string;
  variables: JavaVariable[];
}

export interface JavaHeapObject {
  address: string;
  type: string;
  content: string;
  /** 변경됨 표시 */
  isChanged?: boolean;
}

export interface JavaMemoryViewProps {
  /** 스택 프레임들 (main이 맨 아래) */
  frames: JavaStackFrame[];
  /** 힙 객체들 */
  heap: JavaHeapObject[];
  /** 변경된 변수/객체 주소 목록 */
  changedTargets?: string[];
}

// ============================================================
// 색상 테마
// ============================================================

const COLORS = {
  stack: {
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.3)',
    label: '#a78bfa',
  },
  heap: {
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.3)',
    label: '#4ade80',
  },
  frame: {
    bg: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(139, 92, 246, 0.2)',
  },
  variable: {
    text: '#e5e7eb',
    muted: '#9ca3af',
  },
  // 타입별 색상
  types: {
    primitive: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },      // 노란색 - int, boolean 등
    string: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },         // 초록색 - String
    array: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },          // 주황색 - 배열
    object: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },         // 핑크색 - 객체
    null: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },          // 회색 - null
  },
  highlight: {
    bg: 'rgba(250, 204, 21, 0.2)',
    border: '#facc15',
  },
  hover: {
    bg: 'rgba(59, 130, 246, 0.2)',
    border: '#3b82f6',
    glow: '0 0 16px rgba(59, 130, 246, 0.6)',
  },
};

// ============================================================
// 유틸리티
// ============================================================

/** primitive 타입인지 */
function isPrimitiveType(type: string): boolean {
  return ['int', 'long', 'short', 'byte', 'float', 'double', 'boolean', 'char'].includes(type);
}

/** String 타입인지 */
function isStringType(type: string): boolean {
  return type === 'String' || type === 'java.lang.String';
}

/** 배열 타입인지 */
function isArrayType(type: string): boolean {
  return type.includes('[]');
}

/** 타입별 색상 가져오기 */
function getTypeColor(type: string, value: unknown): { color: string; bg: string } {
  if (value === null || value === 'null') return COLORS.types.null;
  if (isPrimitiveType(type)) return COLORS.types.primitive;
  if (isStringType(type)) return COLORS.types.string;
  if (isArrayType(type)) return COLORS.types.array;
  return COLORS.types.object;
}

// ============================================================
// 서브 컴포넌트
// ============================================================

/** 변수 행 */
function VariableRow({
  variable,
  isHighlighted,
  onHover,
  onLeave,
}: {
  variable: JavaVariable;
  isHighlighted: boolean;
  onHover: (refAddress?: string) => void;
  onLeave: () => void;
}) {
  const hasRef = !!variable.refAddress;
  const typeColor = getTypeColor(variable.type, variable.value);

  // 표시할 값 결정
  const displayValue = variable.value === null ? 'null' : String(variable.value);

  return (
    <div
      onMouseEnter={() => hasRef && onHover(variable.refAddress)}
      onMouseLeave={onLeave}
      className={isHighlighted ? 'java-mem-highlight' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderRadius: '6px',
        backgroundColor: variable.isChanged ? COLORS.highlight.bg : 'transparent',
        border: `1px solid ${variable.isChanged ? COLORS.highlight.border : 'transparent'}`,
        cursor: hasRef ? 'pointer' : 'default',
        transition: 'background-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* 변수명 + 타입 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: COLORS.variable.text }}>
          {variable.name}
        </span>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          color: typeColor.color,
          padding: '2px 6px',
          backgroundColor: typeColor.bg,
          borderRadius: '4px',
          fontWeight: 500,
        }}>
          {variable.type}
        </span>
      </div>

      {/* 값 */}
      <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: typeColor.color }}>
        {displayValue}
      </span>
    </div>
  );
}

/** 스택 프레임 */
function StackFrame({
  frame,
  hoveredRef,
  onHover,
  onLeave,
}: {
  frame: JavaStackFrame;
  hoveredRef: string | null;
  onHover: (refAddress?: string) => void;
  onLeave: () => void;
}) {
  return (
    <div
      style={{
        borderRadius: '8px',
        border: `1px solid ${COLORS.frame.border}`,
        backgroundColor: COLORS.frame.bg,
        overflow: 'hidden',
      }}
    >
      {/* 프레임 헤더 */}
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${COLORS.frame.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.stack.label, fontFamily: 'monospace' }}>
          {frame.name}()
        </span>
        <span style={{ fontSize: '10px', color: COLORS.variable.muted }}>
          {frame.variables.length} vars
        </span>
      </div>

      {/* 변수들 */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {frame.variables.length === 0 ? (
          <div style={{ padding: '12px', textAlign: 'center', color: COLORS.variable.muted, fontSize: '12px' }}>
            No variables
          </div>
        ) : (
          frame.variables.map((variable, idx) => (
            <VariableRow
              key={`${variable.name}-${idx}`}
              variable={variable}
              isHighlighted={hoveredRef === variable.refAddress && !!variable.refAddress}
              onHover={onHover}
              onLeave={onLeave}
            />
          ))
        )}
      </div>
    </div>
  );
}

/** 힙 객체 행 */
function HeapObjectRow({
  obj,
  isHighlighted,
}: {
  obj: JavaHeapObject;
  isHighlighted: boolean;
}) {
  const typeColor = getTypeColor(obj.type, obj.content);

  return (
    <div
      data-heap-address={obj.address}
      className={isHighlighted ? 'java-mem-highlight' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: obj.isChanged ? COLORS.highlight.bg : 'transparent',
        border: `1px solid ${obj.isChanged ? COLORS.highlight.border : 'transparent'}`,
        transition: 'background-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* 주소 */}
      <span style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        fontWeight: 600,
        color: COLORS.heap.label,
        padding: '3px 8px',
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderRadius: '4px',
        flexShrink: 0,
      }}>
        {obj.address}
      </span>

      {/* 타입 */}
      <span style={{
        fontFamily: 'monospace',
        fontSize: '10px',
        color: typeColor.color,
        backgroundColor: typeColor.bg,
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: 500,
        flexShrink: 0,
      }}>
        {obj.type}
      </span>

      {/* 내용 */}
      <span style={{
        fontFamily: 'monospace',
        fontSize: '12px',
        color: typeColor.color,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {obj.content}
      </span>
    </div>
  );
}

// ============================================================
// CSS 스타일 (호버 하이라이트)
// ============================================================

const highlightStyles = `
.java-mem-highlight {
  background-color: rgba(59, 130, 246, 0.2) !important;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
  border-color: #3b82f6 !important;
}
`;

// ============================================================
// 메인 컴포넌트
// ============================================================

export function JavaMemoryView({
  frames,
  heap,
  changedTargets = [],
}: JavaMemoryViewProps) {
  const [hoveredRef, setHoveredRef] = useState<string | null>(null);
  const changedSet = new Set(changedTargets);

  // 변경 표시 적용
  const framesWithChanges = frames.map(frame => ({
    ...frame,
    variables: frame.variables.map(v => ({
      ...v,
      isChanged: changedSet.has(v.name) || changedSet.has(v.refAddress || ''),
    })),
  }));

  const heapWithChanges = heap.map(obj => ({
    ...obj,
    isChanged: changedSet.has(obj.address),
  }));

  return (
    <>
      <style>{highlightStyles}</style>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stack 섹션 */}
      <div
        style={{
          borderRadius: '12px',
          border: `1px solid ${COLORS.stack.border}`,
          backgroundColor: COLORS.stack.bg,
          overflow: 'hidden',
        }}
      >
        {/* Stack 헤더 */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.stack.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: COLORS.stack.label,
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: COLORS.stack.label,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Stack
          </span>
          <span style={{ fontSize: '11px', color: COLORS.variable.muted }}>
            함수 호출 스택
          </span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.variable.muted,
              marginLeft: 'auto',
            }}
          >
            {frames.length} frame{frames.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Stack 프레임들 (역순: 최근 호출이 위) */}
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {frames.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: COLORS.variable.muted, fontSize: '12px' }}>
              No active frames
            </div>
          ) : (
            [...framesWithChanges].reverse().map((frame, idx) => (
              <StackFrame
                key={`${frame.name}-${idx}`}
                frame={frame}
                hoveredRef={hoveredRef}
                onHover={setHoveredRef}
                onLeave={() => setHoveredRef(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Heap 섹션 (비어있으면 숨김) */}
      {heapWithChanges.length > 0 && (
        <div
          style={{
            borderRadius: '12px',
            border: `1px solid ${COLORS.heap.border}`,
            backgroundColor: COLORS.heap.bg,
            overflow: 'hidden',
          }}
        >
          {/* Heap 헤더 */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${COLORS.heap.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: COLORS.heap.label,
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: COLORS.heap.label,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Heap
            </span>
            <span style={{ fontSize: '11px', color: COLORS.variable.muted }}>
              객체 저장소
            </span>
            <span
              style={{
                fontSize: '11px',
                color: COLORS.variable.muted,
                marginLeft: 'auto',
              }}
            >
              {heapWithChanges.length} object{heapWithChanges.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Heap 객체들 */}
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {heapWithChanges.map((obj, idx) => (
              <HeapObjectRow
                key={`${obj.address}-${idx}`}
                obj={obj}
                isHighlighted={hoveredRef === obj.address}
              />
            ))}
          </div>
        </div>
      )}

      {/* 호버 안내 (참조가 있을 때만) */}
      {heap.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: '11px', color: COLORS.variable.muted, padding: '4px' }}>
          💡 참조 변수 호버 → 힙 객체 하이라이트
        </div>
      )}
    </div>
    </>
  );
}

export default JavaMemoryView;
