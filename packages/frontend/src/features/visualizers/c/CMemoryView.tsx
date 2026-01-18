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
// 변수 색상 (아직 테마화되지 않음 - 향후 작업)
// ============================================================

const VARIABLE_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#60a5fa' },
  { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#fb923c' },
  { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#34d399' },
  { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7', text: '#c084fc' },
  { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899', text: '#f472b6' },
  { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', text: '#facc15' },
];

function getVariableColor(index: number) {
  return VARIABLE_COLORS[index % VARIABLE_COLORS.length];
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

/** 변수 태그 (변수명 + 주소) - 현재 사용되지 않음 */
function VariableTag({
  name,
  address,
  colorIndex,
  isChanged,
  isPointer,
  pointsTo,
}: {
  name: string;
  address: string;
  colorIndex: number;
  isChanged: boolean;
  isPointer: boolean;
  pointsTo?: string | null;
}) {
  const color = getVariableColor(colorIndex);

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
        border: `2px solid ${isChanged ? '#facc15' : color.border}`,
        backgroundColor: isChanged ? 'rgba(250, 204, 21, 0.25)' : color.bg,
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
          color: 'var(--theme-memory-card-muted)',
          padding: '2px 6px',
          backgroundColor: 'rgba(110, 118, 129, 0.2)',
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
            color: '#fb923c',
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
}: {
  block: MemoryBlock;
  isChanged: boolean;
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
        border: `1px solid ${highlighted ? '#facc15' : 'var(--theme-memory-card-border, #e5e7eb)'}`,
        backgroundColor: highlighted ? 'rgba(250, 204, 21, 0.25)' : 'var(--theme-memory-card-bg)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* 주소 */}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--theme-memory-card-muted)',
          padding: '3px 6px',
          backgroundColor: 'rgba(110, 118, 129, 0.2)',
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
          color: 'var(--theme-memory-card-text)',
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
}: {
  code: string;
  line: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: 'var(--theme-memory-text-bg)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: 'var(--theme-memory-card-muted)',
          minWidth: '30px',
        }}
      >
        {line}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          color: 'var(--theme-memory-card-text)',
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
  segmentType,
  variableColorMap,
  changedSet,
  isCodeSegment = false,
  codeLines = [],
  registers,
}: {
  title: string;
  blocks: MemoryBlock[];
  segmentType: 'stack' | 'heap' | 'data' | 'text';
  variableColorMap: Map<string, number>;
  changedSet: Set<string>;
  isCodeSegment?: boolean;
  codeLines?: { line: number; code: string }[];
  registers?: StackRegisters;
}) {
  const isEmpty = isCodeSegment ? codeLines.length === 0 : blocks.length === 0;

  // 세그먼트별 설명
  const descriptions = {
    stack: '지역변수, 함수 호출',
    heap: 'malloc 동적 할당',
    data: '전역/정적 변수',
    text: '프로그램 코드 (읽기 전용)',
  };

  // CSS 변수를 JavaScript로 미리 계산
  const cssVars = {
    bg: `var(--theme-memory-${segmentType}-bg)`,
    border: `var(--theme-memory-${segmentType}-border)`,
    label: `var(--theme-memory-${segmentType}-label)`,
  };

  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${cssVars.border}`,
        backgroundColor: cssVars.bg,
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${cssVars.border}`,
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
            backgroundColor: cssVars.border,
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: cssVars.label,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--theme-memory-card-muted)' }}>
          {descriptions[segmentType]}
        </span>

        {/* RSP/RBP 표시 (Stack일 때만) */}
        {registers && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
            {registers.rsp && (
              <span style={{ fontSize: '10px', color: 'var(--theme-memory-register-rsp-text)', fontWeight: 600 }}>
                RSP: {registers.rsp}
              </span>
            )}
            {registers.rbp && (
              <span style={{ fontSize: '10px', color: 'var(--theme-memory-register-rbp-text)', fontWeight: 600 }}>
                RBP: {registers.rbp}
              </span>
            )}
          </div>
        )}

        <span
          style={{
            fontSize: '11px',
            color: 'var(--theme-memory-card-muted)',
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
              color: 'var(--theme-memory-card-muted)',
              fontSize: '12px',
            }}
          >
            Empty
          </div>
        ) : isCodeSegment ? (
          codeLines.map((item, idx) => (
            <CodeBlock key={idx} line={item.line} code={item.code} />
          ))
        ) : (
          blocks.map((block, idx) => (
            <MemoryBlockRow
              key={`${block.address}-${idx}`}
              block={block}
              isChanged={changedSet.has(block.name) || changedSet.has(block.address)}
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
  theme = 'dark', // @deprecated - CSS 변수가 자동으로 테마 처리
  showTextSegment = true,
  registers,
  isReturn = false,
  returnInfo,
}: CMemoryViewProps) {
  const changedSet = new Set(changedTargets);

  // 변수별 색상 인덱스 매핑
  const variableColorMap = new Map<string, number>();
  const allBlocks = [...stack, ...heap, ...data];
  allBlocks.forEach((block) => {
    if (!variableColorMap.has(block.name)) {
      variableColorMap.set(block.name, variableColorMap.size);
    }
  });

  // 현재 실행 중인 코드
  const codeLines = code ? [{ line, code }] : [];

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MemorySegment
          title="Stack"
          blocks={stack}
          segmentType="stack"
          variableColorMap={variableColorMap}
          changedSet={changedSet}
          registers={registers}
        />

        {/* Heap - 비어있으면 숨김 */}
        {heap.length > 0 && (
          <MemorySegment
            title="Heap"
            blocks={heap}
            segmentType="heap"
            variableColorMap={variableColorMap}
            changedSet={changedSet}
          />
        )}

        {/* Data - 비어있으면 숨김 */}
        {data.length > 0 && (
          <MemorySegment
            title="Data"
            blocks={data}
            segmentType="data"
            variableColorMap={variableColorMap}
            changedSet={changedSet}
          />
        )}

        {/* Text - 비어있으면 숨김 */}
        {showTextSegment && codeLines.length > 0 && (
          <MemorySegment
            title="Text"
            blocks={[]}
            segmentType="text"
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
