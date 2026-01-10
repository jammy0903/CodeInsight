/**
 * CMemoryView - C 메모리 시각화 컴포넌트 (모듈화)
 *
 * 사용처:
 * - Playground: 다크 테마 (theme="dark")
 * - Lessons: 라이트 테마 (theme="light")
 *
 * 메모리 레이아웃 (높은 주소 → 낮은 주소):
 * ┌─────────────────────────────────────────────────────┐
 * │ 변수 영역 (메모리 아님 - 단순 별칭/참조)            │
 * ├─────────────────────────────────────────────────────┤
 * │ Stack   - 지역변수, 함수 호출 (RBP/RSP 표시)        │
 * ├─────────────────────────────────────────────────────┤
 * │ Heap    - malloc 동적 할당                          │
 * ├─────────────────────────────────────────────────────┤
 * │ Data    - 전역/정적 변수 (BSS + Data)               │
 * ├─────────────────────────────────────────────────────┤
 * │ Text    - 프로그램 코드 (읽기 전용)                 │
 * └─────────────────────────────────────────────────────┘
 */

import { motion } from 'framer-motion';
import { ReturnOverlay } from '../shared';
import type { ReturnInfo } from '../shared';

// ============================================================
// 공용 타입 (Playground, Lessons 모두 사용 가능)
// ============================================================

export type SegmentType = 'stack' | 'heap' | 'data' | 'code';

export interface MemoryBlock {
  /** 변수명 */
  name: string;
  /** 메모리 주소 (hex) */
  address: string;
  /** 데이터 타입 */
  type: string;
  /** 값 */
  value: string;
  /** 크기 (바이트) */
  size?: number;
  /** 세그먼트 */
  segment?: SegmentType;
  /** 포인터가 가리키는 주소 */
  points_to?: string | null;
  /** 하이라이트 여부 (변경됨) */
  highlight?: boolean;
}

export interface StackRegisters {
  /** Stack Pointer - 스택 최상단 */
  rsp?: string;
  /** Base Pointer - 현재 함수 프레임 시작 */
  rbp?: string;
}

export interface CMemoryViewProps {
  /** 현재 실행 줄 번호 */
  line: number;
  /** 현재 실행 코드 */
  code: string;
  /** Stack 메모리 블록 */
  stack: MemoryBlock[];
  /** Heap 메모리 블록 */
  heap: MemoryBlock[];
  /** Data 세그먼트 (전역/정적 변수) */
  data?: MemoryBlock[];
  /** 변경된 항목 (name 또는 address) */
  changedTargets?: string[];
  /** 테마: dark (Playground) / light (Lessons) */
  theme?: 'dark' | 'light';
  /** Text 세그먼트 표시 여부 */
  showTextSegment?: boolean;
  /** Stack 레지스터 (RSP, RBP) */
  registers?: StackRegisters;
  /** return 문 실행 여부 */
  isReturn?: boolean;
  /** return 상세 정보 */
  returnInfo?: ReturnInfo;
}

// ============================================================
// 색상 체계 (다크/라이트 테마)
// ============================================================

const DARK_COLORS = {
  variables: [
    { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#60a5fa' },
    { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#fb923c' },
    { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#34d399' },
    { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7', text: '#c084fc' },
    { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899', text: '#f472b6' },
    { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', text: '#facc15' },
  ],
  stack: { bg: '#3a4555', border: '#3b82f6', label: '#60a5fa', desc: '지역변수, 함수 호출' },
  heap: { bg: '#354845', border: '#10b981', label: '#34d399', desc: 'malloc 동적 할당' },
  data: { bg: '#4a3f55', border: '#a855f7', label: '#c084fc', desc: '전역/정적 변수' },
  text: { bg: '#4a4535', border: '#eab308', label: '#facc15', desc: '프로그램 코드 (읽기 전용)' },
  changed: { bg: 'rgba(250, 204, 21, 0.25)', border: '#facc15' },
  pointer: { line: '#f97316', arrow: '#fb923c' },
  register: { rsp: '#ef4444', rbp: '#8b5cf6' },
  surface: { bg: '#2a3140', border: '#505866', text: '#c9d1d9', muted: '#8b949e', subtle: '#6e7681' },
};

const LIGHT_COLORS = {
  variables: [
    { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#2563eb' },
    { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#ea580c' },
    { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#059669' },
    { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#9333ea' },
    { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#db2777' },
    { bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', text: '#ca8a04' },
  ],
  stack: { bg: '#eff6ff', border: '#3b82f6', label: '#2563eb', desc: '지역변수, 함수 호출' },
  heap: { bg: '#ecfdf5', border: '#10b981', label: '#059669', desc: 'malloc 동적 할당' },
  data: { bg: '#faf5ff', border: '#a855f7', label: '#9333ea', desc: '전역/정적 변수' },
  text: { bg: '#fefce8', border: '#eab308', label: '#ca8a04', desc: '프로그램 코드 (읽기 전용)' },
  changed: { bg: 'rgba(250, 204, 21, 0.3)', border: '#eab308' },
  pointer: { line: '#ea580c', arrow: '#f97316' },
  register: { rsp: '#dc2626', rbp: '#7c3aed' },
  surface: { bg: '#ffffff', border: '#e5e7eb', text: '#1f2937', muted: '#6b7280', subtle: '#9ca3af' },
};

function getColors(theme: 'dark' | 'light') {
  return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

function getVariableColor(colors: typeof DARK_COLORS, index: number) {
  return colors.variables[index % colors.variables.length];
}

// ============================================================
// 서브 컴포넌트
// ============================================================

/** 레지스터 뱃지 (RSP/RBP) */
function RegisterBadge({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 700,
        color: '#fff',
        backgroundColor: color,
        padding: '2px 6px',
        borderRadius: '4px',
        marginLeft: '4px',
      }}
    >
      ← {name}
    </span>
  );
}

/** 변수 태그 (변수명 + 주소) */
function VariableTag({
  name,
  address,
  colorIndex,
  isChanged,
  isPointer,
  pointsTo,
  colors,
}: {
  name: string;
  address: string;
  colorIndex: number;
  isChanged: boolean;
  isPointer: boolean;
  pointsTo?: string | null;
  colors: typeof DARK_COLORS;
}) {
  const color = getVariableColor(colors, colorIndex);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: `2px solid ${isChanged ? colors.changed.border : color.border}`,
        backgroundColor: isChanged ? colors.changed.bg : color.bg,
        transition: 'all 0.3s ease',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color.border,
        }}
      />
      {/* 변수명 */}
      <span
        style={{
          fontFamily: 'monospace',
          fontWeight: 600,
          fontSize: '13px',
          color: color.text,
        }}
      >
        {name}
      </span>
      {/* 주소 */}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          color: colors.surface.subtle,
          padding: '2px 6px',
          backgroundColor: colors === DARK_COLORS
            ? 'rgba(110, 118, 129, 0.2)'
            : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
        }}
      >
        {address}
      </span>
      {/* 포인터면 가리키는 대상 표시 */}
      {isPointer && pointsTo && (
        <span
          style={{
            fontSize: '10px',
            color: colors.pointer.arrow,
            fontWeight: 600,
          }}
        >
          → {pointsTo}
        </span>
      )}
    </motion.div>
  );
}

/** 메모리 블록 행 (주소 + 값만 표시) */
function MemoryBlockRow({
  block,
  isChanged,
  colors,
}: {
  block: MemoryBlock;
  isChanged: boolean;
  colors: typeof DARK_COLORS;
}) {
  const highlighted = isChanged || block.highlight;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '6px',
        border: `1px solid ${highlighted ? colors.changed.border : colors.surface.border}`,
        backgroundColor: highlighted ? colors.changed.bg : colors.surface.bg,
        transition: 'all 0.3s ease',
      }}
    >
      {/* 주소 */}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 600,
          color: colors.surface.muted,
          padding: '3px 6px',
          backgroundColor: colors === DARK_COLORS
            ? 'rgba(110, 118, 129, 0.2)'
            : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
        }}
      >
        {block.address}
      </span>

      {/* 값 (실제 메모리에 저장된 것) */}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          color: colors.surface.text,
          fontWeight: 700,
          flex: 1,
        }}
      >
        {block.value}
      </span>
    </motion.div>
  );
}

/** 코드 블록 */
function CodeBlock({
  code,
  line,
  colors
}: {
  code: string;
  line: number;
  colors: typeof DARK_COLORS;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: colors === DARK_COLORS
          ? 'rgba(234, 179, 8, 0.1)'
          : 'rgba(234, 179, 8, 0.15)',
        border: `1px solid ${colors.text.border}30`,
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: colors.surface.subtle,
          minWidth: '30px',
        }}
      >
        {line}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          color: colors.surface.text,
        }}
      >
        {code}
      </span>
    </div>
  );
}

/** 메모리 세그먼트 */
function MemorySegment({
  title,
  blocks,
  segmentColors,
  colors,
  variableColorMap,
  changedSet,
  isCodeSegment = false,
  codeLines = [],
  registers,
}: {
  title: string;
  blocks: MemoryBlock[];
  segmentColors: typeof DARK_COLORS.stack;
  colors: typeof DARK_COLORS;
  variableColorMap: Map<string, number>;
  changedSet: Set<string>;
  isCodeSegment?: boolean;
  codeLines?: { line: number; code: string }[];
  registers?: StackRegisters;
}) {
  const isEmpty = isCodeSegment ? codeLines.length === 0 : blocks.length === 0;

  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${segmentColors.border}30`,
        backgroundColor: segmentColors.bg,
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${segmentColors.border}30`,
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
            backgroundColor: segmentColors.border,
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: segmentColors.label,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: '10px', color: colors.surface.muted }}>
          {segmentColors.desc}
        </span>

        {/* RSP/RBP 표시 (Stack일 때만) */}
        {registers && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
            {registers.rsp && (
              <span style={{ fontSize: '10px', color: colors.register.rsp, fontWeight: 600 }}>
                RSP: {registers.rsp}
              </span>
            )}
            {registers.rbp && (
              <span style={{ fontSize: '10px', color: colors.register.rbp, fontWeight: 600 }}>
                RBP: {registers.rbp}
              </span>
            )}
          </div>
        )}

        <span
          style={{
            fontSize: '11px',
            color: colors.surface.muted,
            marginLeft: 'auto',
          }}
        >
          {isCodeSegment
            ? `${codeLines.length} lines`
            : `${blocks.length} ${blocks.length === 1 ? 'block' : 'blocks'}`}
        </span>
      </div>

      {/* 블록 목록 */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isEmpty ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: colors.surface.muted,
              fontSize: '12px',
            }}
          >
            Empty
          </div>
        ) : isCodeSegment ? (
          codeLines.map((item, idx) => (
            <CodeBlock key={idx} line={item.line} code={item.code} colors={colors} />
          ))
        ) : (
          blocks.map((block, idx) => (
            <MemoryBlockRow
              key={`${block.address}-${idx}`}
              block={block}
              isChanged={changedSet.has(block.name) || changedSet.has(block.address)}
              colors={colors}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function CMemoryView({
  line,
  code,
  stack,
  heap,
  data = [],
  changedTargets = [],
  theme = 'dark',
  showTextSegment = true,
  registers,
  isReturn = false,
  returnInfo,
}: CMemoryViewProps) {
  const colors = getColors(theme);
  const changedSet = new Set(changedTargets);

  // 변수별 색상 인덱스 매핑
  const variableColorMap = new Map<string, number>();
  const allBlocks = [...stack, ...heap, ...data];
  allBlocks.forEach((block) => {
    if (!variableColorMap.has(block.name)) {
      variableColorMap.set(block.name, variableColorMap.size);
    }
  });

  // 변수 목록 추출 (중복 제거)
  const variables = Array.from(
    new Map(allBlocks.map((b) => [b.name, b])).values()
  );

  // 현재 실행 중인 코드
  const codeLines = code ? [{ line, code }] : [];

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MemorySegment
          title="Stack"
          blocks={stack}
          segmentColors={colors.stack}
          colors={colors}
          variableColorMap={variableColorMap}
          changedSet={changedSet}
          registers={registers}
        />

        {/* Heap - 비어있으면 숨김 */}
        {heap.length > 0 && (
          <MemorySegment
            title="Heap"
            blocks={heap}
            segmentColors={colors.heap}
            colors={colors}
            variableColorMap={variableColorMap}
            changedSet={changedSet}
          />
        )}

        {/* Data - 비어있으면 숨김 */}
        {data.length > 0 && (
          <MemorySegment
            title="Data"
            blocks={data}
            segmentColors={colors.data}
            colors={colors}
            variableColorMap={variableColorMap}
            changedSet={changedSet}
          />
        )}

        {/* Text - 비어있으면 숨김 */}
        {showTextSegment && codeLines.length > 0 && (
          <MemorySegment
            title="Text"
            blocks={[]}
            segmentColors={colors.text}
            colors={colors}
            variableColorMap={variableColorMap}
            changedSet={changedSet}
            isCodeSegment={true}
            codeLines={codeLines}
          />
        )}

        {/* Return 오버레이 (return 문 실행 시) */}
        <ReturnOverlay
          isReturn={isReturn}
          returnInfo={returnInfo}
          theme={theme}
        />
    </div>
  );
}
