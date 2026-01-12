/**
 * MemoryPanel - 레슨용 메모리 시각화
 *
 * 구조:
 * - 2열 레이아웃: 메모리 블록 리스트 + RSP/RBP 인디케이터
 * - 호버 시 같은 함수 변수들 하이라이팅 + 함수명 오버레이
 * - [주소 | 값] 카드 형태
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryBlock } from '@/types';
import { useThemeStore } from '@/stores/themeStore';
import { themes } from '@/config/themes';

// ============================================================
// 타입 정의
// ============================================================

/** Data/Text 영역 아이템 */
interface DataItem {
  name: string;
  value: string;
  address: string;
}

interface TextItem {
  name: string;
  address: string;
}

interface MemoryPanelProps {
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  changedBlocks: string[];
  /** 스택 프레임 정보 (함수별 구분용) */
  frames?: Array<{ name: string }>;
  /** RSP/RBP 레지스터 표시 */
  showRegisters?: boolean;
  /** Data 영역 (문자열 리터럴, 초기화된 전역변수) */
  dataSection?: DataItem[];
  /** Text 영역 (함수들) */
  textSection?: TextItem[];
}

// ============================================================
// 색상 체계
// ============================================================

const COLORS = {
  stack: {
    bg: '#FFF5F7',
    border: '#D63384',
    label: '#be185d',
    light: '#fdf2f8',
  },
  heap: {
    bg: '#e8f5ec',
    border: '#4a9d6b',
    label: '#3d7a5a',
    light: '#dceee2',
  },
  frame: [
    { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', hover: '#fef9c3' }, // amber
    { bg: '#dbeafe', border: '#60a5fa', text: '#1d4ed8', hover: '#dbeafe' }, // blue
    { bg: '#dcfce7', border: '#4ade80', text: '#16a34a', hover: '#dcfce7' }, // green
    { bg: '#fce7f3', border: '#f472b6', text: '#db2777', hover: '#fce7f3' }, // pink
    { bg: '#e0e7ff', border: '#818cf8', text: '#4f46e5', hover: '#e0e7ff' }, // indigo
  ],
  register: {
    rsp: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
    rbp: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
  },
  changed: { bg: '#fef3c7', border: '#f59e0b' },
  surface: { bg: '#ffffff', border: '#e5e7eb', text: '#1f2937', muted: '#6b7280' },
};

// ============================================================
// 유틸 함수
// ============================================================

function isGarbageValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  const strValue = String(value).toLowerCase().trim();
  const garbagePatterns = ['???', '?', 'undefined', 'garbage', '(garbage)', '쓰레기', '미정의'];
  return garbagePatterns.includes(strValue);
}

function getFrameFromBlock(block: MemoryBlock, defaultFrame: string): string {
  const dotIndex = block.name.indexOf('.');
  return dotIndex > 0 ? block.name.substring(0, dotIndex) : defaultFrame;
}

function getDisplayName(name: string): string {
  return name.includes('.') ? name.split('.')[1] : name;
}

/** 배열 요소인지 확인 (예: "main.arr[0]" → true) */
function isArrayElement(name: string): boolean {
  return /\[\d+\]$/.test(name);
}

/** 배열 이름 추출 (예: "main.arr[0]" → "main.arr") */
function getArrayBaseName(name: string): string {
  return name.replace(/\[\d+\]$/, '');
}

/** 배열 인덱스 추출 (예: "main.arr[5]" → 5) */
function getArrayIndex(name: string): number {
  const match = name.match(/\[(\d+)\]$/);
  return match ? parseInt(match[1], 10) : -1;
}

// ============================================================
// 서브 컴포넌트
// ============================================================

/** 배열 블록 - 접기/펼치기 지원 */
function ArrayBlock({
  arrayName,
  elements,
  isExpanded,
  isChanged,
  frameColor,
  frameName,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}: {
  arrayName: string;
  elements: MemoryBlock[];
  isExpanded: boolean;
  isChanged: boolean;
  frameColor: typeof COLORS.frame[0];
  frameName: string;
  onToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const displayName = getDisplayName(arrayName);
  const elementCount = elements.length;
  const firstElement = elements[0];
  const lastElement = elements[elements.length - 1];

  if (!isExpanded) {
    // 접힌 상태: 요약 표시
    return (
      <motion.div
        layout
        className="rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer relative"
        style={{
          backgroundColor: 'white',
          border: `2px solid ${frameColor.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            {/* 토글 버튼 */}
            <button
              onClick={onToggle}
              className="text-xs p-1 hover:bg-gray-100 rounded transition-colors"
            >
              ▶
            </button>

            {/* 배열 정보 */}
            <span className="text-xs font-semibold" style={{ color: frameColor.text }}>
              {displayName}[0..{elementCount - 1}]
            </span>
            <span className="text-[10px] text-gray-400">
              ({elementCount}개 요소)
            </span>
          </div>

          {/* 주소 범위 */}
          <span className="text-[10px] font-mono text-gray-400">
            {firstElement.address} ~ {lastElement.address}
          </span>
        </div>
      </motion.div>
    );
  }

  // 펼친 상태: 개별 요소 표시
  return (
    <div className="space-y-1">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-2">
        <button
          onClick={onToggle}
          className="text-xs p-1 hover:bg-gray-100 rounded transition-colors"
        >
          ▼
        </button>
        <span className="text-xs font-semibold" style={{ color: frameColor.text }}>
          {displayName}[{elementCount}]
        </span>
      </div>

      {/* 요소들 */}
      <div className="pl-6 space-y-1">
        {elements.map((element) => (
          <MemoryBlockCard
            key={element.name}
            block={element}
            isChanged={isChanged}
            isHovered={false}
            frameColor={frameColor}
            frameName={frameName}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        ))}
      </div>
    </div>
  );
}

/** 메모리 블록 카드 - [주소 | 값] 형태 */
function MemoryBlockCard({
  block,
  isChanged,
  isHovered,
  frameColor,
  frameName,
  registerLabel,
  onMouseEnter,
  onMouseLeave,
}: {
  block: MemoryBlock;
  isChanged: boolean;
  isHovered: boolean;
  frameColor: typeof COLORS.frame[0];
  frameName: string;
  registerLabel?: 'rsp' | 'rbp';
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const valueDisplay = isGarbageValue(block.value) ? '?' : String(block.value);
  const displayName = getDisplayName(block.name);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer relative"
      style={{
        backgroundColor: isHovered ? frameColor.hover : 'white',
        border: `2px solid ${isChanged ? COLORS.changed.border : frameColor.border}`,
        boxShadow: isChanged
          ? `0 0 8px ${COLORS.changed.border}40`
          : isHovered
            ? `0 0 6px ${frameColor.border}30`
            : '0 1px 3px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 블록별 프레임 오버레이 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-lg pointer-events-none z-20 flex items-center justify-center"
            style={{
              backgroundColor: `${frameColor.border}20`,
              border: `3px dashed ${frameColor.border}`,
              boxShadow: `0 0 20px ${frameColor.border}40`,
            }}
          >
            <span
              className="text-2xl font-bold px-3 py-1 rounded-lg"
              style={{
                color: frameColor.text,
                backgroundColor: `${frameColor.bg}90`,
                textShadow: `0 2px 8px ${frameColor.border}30`,
              }}
            >
              {frameName}()
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 relative">
        {/* [주소 | 값] 박스 */}
        <div
          className="flex items-center rounded px-2 py-1"
          style={{ backgroundColor: `${frameColor.border}15` }}
        >
          {/* 주소 배지 */}
          <span
            className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded"
            style={{
              color: COLORS.surface.muted,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            }}
          >
            {block.address}
          </span>
          <span className="text-gray-300 mx-2 font-bold">|</span>
          {/* 값 */}
          <span
            className="font-mono font-bold text-base min-w-[24px] text-center"
            style={{ color: isChanged ? '#d97706' : COLORS.surface.text }}
          >
            {valueDisplay}
          </span>
        </div>

        {/* 타입 */}
        <span className="text-[10px] font-mono text-gray-400">
          {block.type || 'var'}
        </span>

        {/* 변수명 */}
        <span
          className="text-xs font-semibold"
          style={{ color: frameColor.text }}
        >
          {displayName}
        </span>

        {/* 포인터 표시 */}
        {block.points_to && (
          <span
            className="text-[10px] font-semibold ml-auto"
            style={{ color: '#f97316' }}
          >
            → {block.points_to}
          </span>
        )}

        {/* 변경 인디케이터 */}
        {isChanged && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-auto"
          />
        )}

        {/* RSP/RBP 레지스터 인디케이터 */}
        {registerLabel && (
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* 화살표 */}
            <svg width="32" height="12" viewBox="0 0 32 12" className="flex-shrink-0">
              <line x1="8" y1="6" x2="32" y2="6" stroke={COLORS.register[registerLabel].border} strokeWidth="2" />
              <polygon points="8,6 16,2 16,10" fill={COLORS.register[registerLabel].border} />
            </svg>
            {/* 레이블 */}
            <div
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: COLORS.register[registerLabel].bg,
                color: COLORS.register[registerLabel].text,
                border: `1px solid ${COLORS.register[registerLabel].border}`,
              }}
            >
              {registerLabel.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** RSP/RBP 인디케이터 (스택 옆에 표시) */
function RegisterIndicator({
  type,
  top,
}: {
  type: 'rsp' | 'rbp';
  top: number;
}) {
  const color = COLORS.register[type];
  const label = type.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0, top }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute right-0 flex items-center gap-1 -translate-y-1/2"
      style={{ top }}
    >
      {/* 화살표 */}
      <svg width="32" height="12" viewBox="0 0 32 12" className="flex-shrink-0">
        {/* 직선 */}
        <line
          x1="8"
          y1="6"
          x2="32"
          y2="6"
          stroke={color.border}
          strokeWidth="2"
        />
        {/* 화살표 머리 (왼쪽 방향) */}
        <polygon
          points="0,6 8,2 8,10"
          fill={color.border}
        />
      </svg>
      {/* 라벨 */}
      <div
        className="px-2 py-1 rounded text-[10px] font-bold"
        style={{
          backgroundColor: color.bg,
          border: `1px solid ${color.border}`,
          color: color.text,
        }}
      >
        {label}
      </div>
    </motion.div>
  );
}

// RSP/RBP 레지스터 툴팁
const REGISTER_TOOLTIPS = {
  RBP: 'RBP (Base Pointer): 현재 함수의 스택 프레임 시작 위치입니다. 함수 호출 시 이전 RBP가 스택에 저장되고 새 값으로 업데이트됩니다.',
  RSP: 'RSP (Stack Pointer): 스택의 현재 "꼭대기" 위치를 가리킵니다. 변수가 추가되면 RSP가 아래로 이동합니다.',
};

/** 레지스터 패널 - 상단에 RBP, RSP 표시 */
function RegisterPanel({
  rbpAddress,
  rspAddress,
  currentFrame,
}: {
  rbpAddress: string;
  rspAddress: string;
  currentFrame: string;
}) {
  return (
    <div
      className="rounded-lg p-2 mb-3"
      style={{
        backgroundColor: '#f1f5f9',
        border: '1px solid #cbd5e1',
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase text-slate-600">
          🔧 CPU 레지스터
        </span>
        <span className="text-[9px] text-slate-500">
          현재: {currentFrame}()
        </span>
      </div>

      {/* RBP + RSP */}
      <div className="flex gap-3">
        {/* RBP */}
        <div className="group relative flex-1">
          <div
            className="rounded-md py-2 px-3 cursor-help"
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">RBP</span>
              <motion.span
                key={rbpAddress}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-mono text-amber-800"
              >
                {rbpAddress}
              </motion.span>
            </div>
          </div>
          {/* 툴팁 */}
          <div
            className="absolute left-0 top-full mt-1 z-50 px-3 py-2 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal max-w-[280px]"
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {REGISTER_TOOLTIPS.RBP}
          </div>
        </div>

        {/* RSP */}
        <div className="group relative flex-1">
          <div
            className="rounded-md py-2 px-3 cursor-help"
            style={{
              backgroundColor: '#dbeafe',
              border: '1px solid #60a5fa',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">RSP</span>
              <motion.span
                key={rspAddress}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-mono text-blue-800"
              >
                {rspAddress}
              </motion.span>
            </div>
          </div>
          {/* 툴팁 */}
          <div
            className="absolute left-0 top-full mt-1 z-50 px-3 py-2 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal max-w-[280px]"
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {REGISTER_TOOLTIPS.RSP}
          </div>
        </div>
      </div>
    </div>
  );
}


/** Stack 섹션 - 2열 레이아웃 */
function StackSection({
  blocks,
  changedBlocks,
  frames,
  showRegisters,
}: {
  blocks: MemoryBlock[];
  changedBlocks: string[];
  frames: Array<{ name: string }>;
  showRegisters: boolean;
}) {
  const [hoveredFrame, setHoveredFrame] = useState<string | null>(null);
  const [expandedArrays, setExpandedArrays] = useState<Set<string>>(new Set());

  // 현재 실행 중인 프레임 (frames 배열의 마지막)
  const currentFrame = frames[frames.length - 1]?.name || 'main';

  // 주소순 정렬 (높은 주소 → 낮은 주소)
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => {
      const addrA = parseInt(a.address, 16);
      const addrB = parseInt(b.address, 16);
      return addrB - addrA;
    });
  }, [blocks]);

  // 블록별 프레임 매핑
  const blockFrameMap = useMemo(() => {
    const map = new Map<string, string>();
    const defaultFrame = frames[0]?.name || 'main';
    sortedBlocks.forEach((block) => {
      const extractedFrame = getFrameFromBlock(block, defaultFrame);
      map.set(block.name, extractedFrame);
    });
    return map;
  }, [sortedBlocks, frames]);

  // 프레임별 색상 매핑 (실제 존재하는 프레임들로 자동 생성)
  const frameColorMap = useMemo(() => {
    const map = new Map<string, typeof COLORS.frame[0]>();

    // 1순위: frames prop이 있으면 사용
    if (frames.length > 0) {
      frames.forEach((frame, idx) => {
        map.set(frame.name, COLORS.frame[idx % COLORS.frame.length]);
      });
    }
    // 2순위: 블록에서 프레임 추출
    else {
      const uniqueFrames = new Set<string>();
      sortedBlocks.forEach((block) => {
        const frameName = getFrameFromBlock(block, 'main');
        uniqueFrames.add(frameName);
      });

      Array.from(uniqueFrames).forEach((frameName, idx) => {
        map.set(frameName, COLORS.frame[idx % COLORS.frame.length]);
      });
    }

    return map;
  }, [frames, sortedBlocks]);

  // 배열 그룹핑 (arr[0], arr[1], ... → arr)
  const { arrays, regularBlocks } = useMemo(() => {
    const arrayMap = new Map<string, MemoryBlock[]>();
    const regular: MemoryBlock[] = [];

    sortedBlocks.forEach((block) => {
      if (isArrayElement(block.name)) {
        const baseName = getArrayBaseName(block.name);
        if (!arrayMap.has(baseName)) {
          arrayMap.set(baseName, []);
        }
        arrayMap.get(baseName)!.push(block);
      } else {
        regular.push(block);
      }
    });

    // 각 배열을 인덱스 순으로 정렬
    arrayMap.forEach((elements) => {
      elements.sort((a, b) => getArrayIndex(a.name) - getArrayIndex(b.name));
    });

    return { arrays: arrayMap, regularBlocks: regular };
  }, [sortedBlocks]);

  // 토글 핸들러
  const toggleArray = (arrayName: string) => {
    setExpandedArrays((prev) => {
      const next = new Set(prev);
      if (next.has(arrayName)) {
        next.delete(arrayName);
      } else {
        next.add(arrayName);
      }
      return next;
    });
  };

  if (sortedBlocks.length === 0) {
    return (
      <div
        className="rounded-lg p-3"
        style={{
          backgroundColor: COLORS.stack.bg,
          border: `1px solid ${COLORS.stack.border}25`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase" style={{ color: COLORS.stack.label }}>
            📦 Stack
          </span>
          <span className="text-[9px] text-pink-400">
            ↓ 낮은 주소
          </span>
        </div>
        <div className="text-center py-3 text-[10px] text-gray-400 italic">
          (비어있음)
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: COLORS.stack.bg,
        border: `1px solid ${COLORS.stack.border}25`,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase" style={{ color: COLORS.stack.label }}>
          📦 Stack
        </span>
        <span className="text-[9px] text-pink-400">
          ↓ 낮은 주소
        </span>
      </div>

      {/* 2열 레이아웃: 블록 리스트 + RSP/RBP */}
      <div className="flex gap-4 relative">
        {/* 메모리 블록 리스트 */}
        <div className="flex-1 space-y-2 relative" style={{ paddingRight: showRegisters ? '80px' : '0' }}>
          {(() => {
            // 배열과 일반 블록을 통합 렌더링
            const items: Array<{ type: 'block' | 'array'; data: MemoryBlock | [string, MemoryBlock[]] }> = [];

            // 배열 추가
            arrays.forEach((elements, arrayName) => {
              items.push({ type: 'array', data: [arrayName, elements] });
            });

            // 일반 블록 추가
            regularBlocks.forEach((block) => {
              items.push({ type: 'block', data: block });
            });

            // 주소순 정렬 (첫 번째 요소 주소 기준)
            items.sort((a, b) => {
              const addrA = a.type === 'array'
                ? parseInt((a.data as [string, MemoryBlock[]])[1][0].address, 16)
                : parseInt((a.data as MemoryBlock).address, 16);
              const addrB = b.type === 'array'
                ? parseInt((b.data as [string, MemoryBlock[]])[1][0].address, 16)
                : parseInt((b.data as MemoryBlock).address, 16);
              return addrB - addrA; // 높은 주소 → 낮은 주소
            });

            return items.map((item, index) => {
              if (item.type === 'array') {
                const [arrayName, elements] = item.data as [string, MemoryBlock[]];
                const frameName = blockFrameMap.get(elements[0].name) || 'main';
                const frameColor = frameColorMap.get(frameName) || COLORS.frame[0];
                const isChanged = elements.some((el) => changedBlocks.includes(el.name));

                return (
                  <ArrayBlock
                    key={`array-${arrayName}`}
                    arrayName={arrayName}
                    elements={elements}
                    isExpanded={expandedArrays.has(arrayName)}
                    isChanged={isChanged}
                    frameColor={frameColor}
                    frameName={frameName}
                    onToggle={() => toggleArray(arrayName)}
                    onMouseEnter={() => setHoveredFrame(frameName)}
                    onMouseLeave={() => setHoveredFrame(null)}
                  />
                );
              } else {
                const block = item.data as MemoryBlock;
                const frameName = blockFrameMap.get(block.name) || 'main';
                const frameColor = frameColorMap.get(frameName) || COLORS.frame[0];
                // 다중 함수일 때만 현재 프레임 강조 (단일 함수는 호버만)
                const hasMultipleFrames = frames.length > 1;
                const isCurrentFrame = hasMultipleFrames && frameName === currentFrame;
                const isHovered = hoveredFrame === frameName || isCurrentFrame;
                const isLast = index === items.length - 1;

                // 현재 프레임의 첫 번째 블록인지 확인 (RBP 위치)
                const isFirstOfCurrentFrame = (() => {
                  for (let j = 0; j < items.length; j++) {
                    const checkItem = items[j];
                    if (checkItem.type === 'block') {
                      const checkBlock = checkItem.data as MemoryBlock;
                      const checkFrameName = blockFrameMap.get(checkBlock.name) || 'main';
                      if (checkFrameName === currentFrame) {
                        return j === index; // 현재 블록이 현재 프레임의 첫 번째인지
                      }
                    }
                  }
                  return false;
                })();

                let registerLabel: 'rsp' | 'rbp' | undefined = undefined;
                if (showRegisters) {
                  if (isFirstOfCurrentFrame) registerLabel = 'rbp'; // 현재 프레임의 첫 번째
                  else if (isLast) registerLabel = 'rsp';
                }

                return (
                  <MemoryBlockCard
                    key={`stack-${block.name}-${block.address}`}
                    block={block}
                    isChanged={changedBlocks.includes(block.name)}
                    isHovered={isHovered}
                    frameColor={frameColor}
                    frameName={frameName}
                    registerLabel={registerLabel}
                    onMouseEnter={() => setHoveredFrame(frameName)}
                    onMouseLeave={() => setHoveredFrame(null)}
                  />
                );
              }
            });
          })()}
        </div>
      </div>
    </div>
  );
}

/** 하위 메모리 섹션 (BSS, Data, Text) */
function LowerMemorySections({
  dataSection = [],
  textSection = [],
}: {
  dataSection?: DataItem[];
  textSection?: TextItem[];
}) {
  const SECTION_COLORS = {
    bss: { color: '#94a3b8', bg: '#f1f5f9', border: '#94a3b8' },
    data: { color: '#7c5ac7', bg: '#ede9f5', border: '#9d8bc7' },
    text: { color: '#4a8a9e', bg: '#e5f0f3', border: '#7fb3c2' },
  };

  return (
    <div className="space-y-2">
      {/* BSS - 항상 placeholder (이 커리큘럼에서는 사용 안 함) */}
      <div
        className="rounded-lg px-3 py-2 flex items-center justify-between"
        style={{
          backgroundColor: SECTION_COLORS.bss.bg,
          border: `1px solid ${SECTION_COLORS.bss.color}30`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs">📭</span>
          <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.bss.color }}>
            BSS
          </span>
        </div>
        <span className="text-[9px] italic" style={{ color: SECTION_COLORS.bss.color }}>
          (초기화 안 된 전역 변수 없음)
        </span>
      </div>

      {/* Data 영역 - 문자열 리터럴 */}
      <div
        className="rounded-lg p-3"
        style={{
          backgroundColor: SECTION_COLORS.data.bg,
          border: `1px solid ${SECTION_COLORS.data.border}40`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs">📝</span>
            <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.data.color }}>
              Data
            </span>
          </div>
          <span className="text-[9px]" style={{ color: SECTION_COLORS.data.color }}>
            문자열 리터럴
          </span>
        </div>

        {dataSection.length > 0 ? (
          <div className="space-y-1">
            {dataSection.map((item, idx) => (
              <div
                key={idx}
                className="rounded px-2 py-1.5 flex items-center gap-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
              >
                <span className="text-[10px] font-mono text-gray-400">{item.address}</span>
                <span className="text-gray-300">|</span>
                <span className="text-[11px] font-mono text-purple-700 truncate flex-1">
                  "{item.value}"
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] italic text-gray-400 text-center py-1">
            (비어있음)
          </div>
        )}
      </div>

      {/* Text 영역 - 함수 코드 */}
      <div
        className="rounded-lg p-3"
        style={{
          backgroundColor: SECTION_COLORS.text.bg,
          border: `1px solid ${SECTION_COLORS.text.border}40`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs">⚙️</span>
            <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.text.color }}>
              Text
            </span>
          </div>
          <span className="text-[9px]" style={{ color: SECTION_COLORS.text.color }}>
            실행 코드
          </span>
        </div>

        {textSection.length > 0 ? (
          <div className="space-y-1">
            {textSection.map((item, idx) => (
              <div
                key={idx}
                className="rounded px-2 py-1.5 flex items-center gap-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
              >
                <span className="text-[10px] font-mono text-gray-400">{item.address}</span>
                <span className="text-gray-300">|</span>
                <span className="text-[11px] font-mono text-cyan-700">
                  {item.name}()
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] italic text-gray-400 text-center py-1">
            (비어있음)
          </div>
        )}
      </div>

      {/* 맨 아래: 낮은 주소 표시 */}
      <div className="text-center text-[9px] text-gray-400 pt-1">
        ↓ 0x0000 (낮은 주소)
      </div>
    </div>
  );
}

/** Heap 섹션 */
function HeapSection({
  blocks,
  changedBlocks,
}: {
  blocks: MemoryBlock[];
  changedBlocks: string[];
}) {
  // 주소순 정렬 (낮은 주소 → 높은 주소)
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => {
      const addrA = parseInt(a.address, 16);
      const addrB = parseInt(b.address, 16);
      return addrA - addrB;
    });
  }, [blocks]);

  if (sortedBlocks.length === 0) {
    // 빈 Heap 컨테이너
    return (
      <div
        className="rounded-lg p-3"
        style={{
          backgroundColor: COLORS.heap.bg,
          border: `1px solid ${COLORS.heap.border}25`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase" style={{ color: COLORS.heap.label }}>
            🎒 Heap
          </span>
          <span className="text-[9px] text-green-500">
            ↑ 높은 주소
          </span>
        </div>
        <div className="text-center py-3 text-[10px] text-gray-400 italic">
          (비어있음)
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: COLORS.heap.bg,
        border: `1px solid ${COLORS.heap.border}25`,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase" style={{ color: COLORS.heap.label }}>
          🎒 Heap
        </span>
        <span className="text-[9px] text-green-500">
          ↑ 높은 주소
        </span>
      </div>

      {/* 메모리 블록 리스트 */}
      <div className="space-y-2">
        {sortedBlocks.map((block) => (
          <MemoryBlockCard
            key={`heap-${block.name}-${block.address}`}
            block={block}
            isChanged={changedBlocks.includes(block.name)}
            isHovered={false}
            frameColor={COLORS.frame[2]} // green
            frameName="heap"
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function MemoryPanel({
  stack,
  heap,
  changedBlocks,
  frames = [{ name: 'main' }],
  showRegisters = true,
  dataSection = [],
  textSection = [],
}: MemoryPanelProps) {
  const isEmpty = stack.length === 0 && heap.length === 0;

  // RBP/RSP 주소 계산 (스택 정렬 후)
  const sortedStack = useMemo(() => {
    return [...stack].sort((a, b) => {
      const addrA = parseInt(a.address, 16);
      const addrB = parseInt(b.address, 16);
      return addrB - addrA; // 높은 주소 → 낮은 주소
    });
  }, [stack]);

  // 현재 실행 중인 프레임
  const currentFrame = frames[frames.length - 1]?.name || 'main';

  // RBP: 현재 프레임의 첫 번째 블록 주소 (프레임 바닥)
  // RSP: 스택의 꼭대기 (마지막 = 가장 낮은 주소)
  const rbpAddress = useMemo(() => {
    // 현재 프레임에 속한 블록들 중 가장 높은 주소 찾기
    const currentFrameBlocks = sortedStack.filter((block) => {
      const frameName = getFrameFromBlock(block, 'main');
      return frameName === currentFrame;
    });
    return currentFrameBlocks[0]?.address || '0x0000';
  }, [sortedStack, currentFrame]);
  const rspAddress = sortedStack[sortedStack.length - 1]?.address || '0x0000';

  return (
    <div className="p-3 space-y-3">
      {isEmpty ? (
        <div className="text-center py-8 text-gray-400 text-sm italic">
          메모리 할당 없음
        </div>
      ) : (
        <>
          {/* CPU 레지스터 패널 (Stack 위에) */}
          {showRegisters && stack.length > 0 && (
            <RegisterPanel
              rbpAddress={rbpAddress}
              rspAddress={rspAddress}
              currentFrame={currentFrame}
            />
          )}

          <StackSection
            blocks={stack}
            changedBlocks={changedBlocks}
            frames={frames}
            showRegisters={showRegisters}
          />
          <HeapSection
            blocks={heap}
            changedBlocks={changedBlocks}
          />
          <LowerMemorySections
            dataSection={dataSection}
            textSection={textSection}
          />
        </>
      )}
    </div>
  );
}
