/**
 * CMemoryView - C 메모리 시각화 컴포넌트
 *
 * 메모리 레이아웃 (높은 주소 → 낮은 주소):
 * ┌─────────────────────────────────────────────────────┐
 * │ 변수 영역 (메모리 아님 - 단순 별칭/참조)            │
 * ├─────────────────────────────────────────────────────┤
 * │ Stack   - 지역변수, 함수 호출                       │
 * ├─────────────────────────────────────────────────────┤
 * │ Heap    - malloc 동적 할당                          │
 * ├─────────────────────────────────────────────────────┤
 * │ Data    - 전역/정적 변수 (BSS + Data)               │
 * ├─────────────────────────────────────────────────────┤
 * │ Text    - 프로그램 코드 (읽기 전용)                 │
 * └─────────────────────────────────────────────────────┘
 */

import { motion } from 'framer-motion';
import type { CStep, CMemoryBlock } from '@/types';

// ============================================================
// 색상 체계 (다크 테마)
// ============================================================

const COLORS = {
  // 변수 색상 (순환)
  variables: [
    { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#60a5fa' },  // Blue
    { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#fb923c' },  // Orange
    { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#34d399' },  // Green
    { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7', text: '#c084fc' },  // Purple
    { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899', text: '#f472b6' },  // Pink
    { bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', text: '#facc15' },   // Yellow
  ],
  // 세그먼트 (더 밝게)
  stack: { bg: '#3a4555', border: '#3b82f6', label: '#60a5fa', desc: '지역변수, 함수 호출' },
  heap: { bg: '#354845', border: '#10b981', label: '#34d399', desc: 'malloc 동적 할당' },
  data: { bg: '#4a3f55', border: '#a855f7', label: '#c084fc', desc: '전역/정적 변수' },
  text: { bg: '#4a4535', border: '#eab308', label: '#facc15', desc: '프로그램 코드 (읽기 전용)' },
  // 상태
  changed: { bg: 'rgba(250, 204, 21, 0.25)', border: '#facc15' },
};

function getVariableColor(index: number) {
  return COLORS.variables[index % COLORS.variables.length];
}

// ============================================================
// Props
// ============================================================

interface CMemoryViewProps {
  step: CStep;
}

// ============================================================
// 서브 컴포넌트
// ============================================================

/** 변수 태그 */
function VariableTag({
  name,
  colorIndex,
  isChanged,
  isPointer,
}: {
  name: string;
  colorIndex: number;
  isChanged: boolean;
  isPointer: boolean;
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
        border: `2px solid ${isChanged ? COLORS.changed.border : color.border}`,
        backgroundColor: isChanged ? COLORS.changed.bg : color.bg,
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
      {isPointer && (
        <span style={{ fontSize: '10px', color: '#f97316' }}>ptr</span>
      )}
    </motion.div>
  );
}

/** 메모리 블록 - 단순화: 주소, 데이터타입, 역할만 */
function MemoryBlock({
  block,
  colorIndex,
  isChanged,
}: {
  block: CMemoryBlock;
  colorIndex: number;
  isChanged: boolean;
}) {
  const color = getVariableColor(colorIndex);
  const isPointer = !!block.points_to;

  // 역할 결정
  const getRole = () => {
    if (isPointer) return '포인터';
    if (block.type.includes('[')) return '배열';
    return '변수';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${isChanged ? COLORS.changed.border : '#505866'}`,
        backgroundColor: isChanged ? COLORS.changed.bg : '#2d3544',
        transition: 'all 0.3s ease',
      }}
    >
      {/* 색상 인디케이터 */}
      <div
        style={{
          width: '4px',
          height: '24px',
          borderRadius: '2px',
          backgroundColor: color.border,
          flexShrink: 0,
        }}
      />

      {/* 주소 */}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          fontWeight: 600,
          color: '#c9d1d9',
          padding: '4px 8px',
          backgroundColor: 'rgba(160, 170, 184, 0.2)',
          borderRadius: '4px',
        }}
      >
        {block.address}
      </span>

      {/* 데이터타입 */}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          color: color.text,
          fontWeight: 500,
        }}
      >
        {block.type}
      </span>

      {/* 역할 */}
      <span
        style={{
          fontSize: '12px',
          color: '#c9d1d9',
          fontWeight: 500,
          marginLeft: 'auto',
          padding: '4px 10px',
          backgroundColor: 'rgba(140, 150, 165, 0.25)',
          borderRadius: '12px',
        }}
      >
        {getRole()}
      </span>
    </motion.div>
  );
}

/** 코드 블록 (Text 세그먼트용) */
function CodeBlock({ code, line }: { code: string; line: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.2)',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#6e7681',
          minWidth: '30px',
        }}
      >
        {line}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#e6edf3',
        }}
      >
        {code}
      </span>
    </div>
  );
}

/** 메모리 세그먼트 (Stack/Heap/Data/Text) */
function MemorySegment({
  title,
  blocks,
  colors,
  variableColorMap,
  changedSet,
  isCodeSegment = false,
  codeLines = [],
}: {
  title: string;
  blocks: CMemoryBlock[];
  colors: typeof COLORS.stack;
  variableColorMap: Map<string, number>;
  changedSet: Set<string>;
  isCodeSegment?: boolean;
  codeLines?: { line: number; code: string }[];
}) {
  const isEmpty = isCodeSegment ? codeLines.length === 0 : blocks.length === 0;

  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${colors.border}30`,
        backgroundColor: colors.bg,
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${colors.border}30`,
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
            backgroundColor: colors.border,
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: colors.label,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: '10px',
            color: '#8b949e',
          }}
        >
          {colors.desc}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: '#a0aab8',
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
              color: '#8b949e',
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
            <MemoryBlock
              key={`${block.address}-${idx}`}
              block={block}
              colorIndex={variableColorMap.get(block.name) ?? idx}
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

export function CMemoryView({ step }: CMemoryViewProps) {
  // 변경된 항목 추출
  const changedSet = new Set(step.changes.map((c) => c.target));

  // 변수별 색상 인덱스 매핑
  const variableColorMap = new Map<string, number>();
  const allBlocks = [...step.stack, ...step.heap, ...(step.data || [])];
  allBlocks.forEach((block, idx) => {
    if (!variableColorMap.has(block.name)) {
      variableColorMap.set(block.name, variableColorMap.size);
    }
  });

  // 변수 목록 추출 (중복 제거)
  const variables = Array.from(
    new Map(allBlocks.map((b) => [b.name, b])).values()
  );

  // 현재 실행 중인 코드를 Text 세그먼트에 표시
  const codeLines = step.code ? [{ line: step.line, code: step.code }] : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* 현재 실행 코드 */}
      <div
        style={{
          padding: '10px 16px',
          borderRadius: '8px',
          backgroundColor: '#2a3140',
          border: '1px solid #505866',
          fontFamily: 'monospace',
          fontSize: '13px',
        }}
      >
        <span style={{ color: '#6e7681', marginRight: '8px' }}>Line {step.line}:</span>
        <span style={{ color: '#c9d1d9' }}>{step.code}</span>
      </div>

      {/* 변수 영역 (상단) */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: '#2a3140',
          border: '1px solid #505866',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#c9d1d9' }}>
            Variables
          </span>
          <span style={{ fontSize: '10px', color: '#8b949e' }}>
            (메모리에 저장되지 않음 - 값을 참조하는 별칭)
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {variables.length === 0 ? (
            <span style={{ color: '#8b949e', fontSize: '12px' }}>No variables</span>
          ) : (
            variables.map((block) => (
              <VariableTag
                key={block.name}
                name={block.name}
                colorIndex={variableColorMap.get(block.name) ?? 0}
                isChanged={changedSet.has(block.name)}
                isPointer={!!block.points_to}
              />
            ))
          )}
        </div>
      </div>

      {/* 메모리 영역 - 높은 주소에서 낮은 주소 순서 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Stack (가장 높은 주소) */}
        <MemorySegment
          title="Stack"
          blocks={step.stack}
          colors={COLORS.stack}
          variableColorMap={variableColorMap}
          changedSet={changedSet}
        />

        {/* Heap */}
        <MemorySegment
          title="Heap"
          blocks={step.heap}
          colors={COLORS.heap}
          variableColorMap={variableColorMap}
          changedSet={changedSet}
        />

        {/* Data (BSS + Data 통합) */}
        <MemorySegment
          title="Data"
          blocks={step.data || []}
          colors={COLORS.data}
          variableColorMap={variableColorMap}
          changedSet={changedSet}
        />

        {/* Text/Code (가장 낮은 주소) */}
        <MemorySegment
          title="Text"
          blocks={[]}
          colors={COLORS.text}
          variableColorMap={variableColorMap}
          changedSet={changedSet}
          isCodeSegment={true}
          codeLines={codeLines}
        />
      </div>
    </div>
  );
}
