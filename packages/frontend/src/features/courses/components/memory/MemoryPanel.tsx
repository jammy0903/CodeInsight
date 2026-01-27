/**
 * MemoryPanel - 레슨용 메모리 시각화
 *
 * 구조:
 * - 2열 레이아웃: 메모리 블록 리스트 + RSP/RBP 인디케이터
 * - 호버 시 같은 함수 변수들 하이라이팅 + 함수명 오버레이
 * - [주소 | 값] 카드 형태
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryBlock } from '@/types';
import { useThemeStore } from '@/stores/themeStore';
import { PointerArrow, PointerArrowOverlay } from '@/features/visualizers/c/components/PointerArrow';
import { usePointerConnections } from '@/features/visualizers/c/hooks/usePointerConnections';

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

/** 변경된 블록 타입 */
interface ChangedBlocksType {
  stack: string[];
  heap: string[];
}

interface MemoryPanelProps {
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  changedBlocks: ChangedBlocksType; // Updated to use ChangedBlocksType
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
    {
      bg: 'var(--theme-memory-frame-amber-bg)',
      border: 'var(--theme-memory-frame-amber-border)',
      text: 'var(--theme-memory-frame-amber-text)',
      hover: 'var(--theme-memory-frame-amber-hover)'
    },
    {
      bg: 'var(--theme-memory-frame-blue-bg)',
      border: 'var(--theme-memory-frame-blue-border)',
      text: 'var(--theme-memory-frame-blue-text)',
      hover: 'var(--theme-memory-frame-blue-hover)'
    },
    {
      bg: 'var(--theme-memory-frame-green-bg)',
      border: 'var(--theme-memory-frame-green-border)',
      text: 'var(--theme-memory-frame-green-text)',
      hover: 'var(--theme-memory-frame-green-hover)'
    },
    {
      bg: 'var(--theme-memory-frame-pink-bg)',
      border: 'var(--theme-memory-frame-pink-border)',
      text: 'var(--theme-memory-frame-pink-text)',
      hover: 'var(--theme-memory-frame-pink-hover)'
    },
    {
      bg: 'var(--theme-memory-frame-indigo-bg)',
      border: 'var(--theme-memory-frame-indigo-border)',
      text: 'var(--theme-memory-frame-indigo-text)',
      hover: 'var(--theme-memory-frame-indigo-hover)'
    },
  ],
  register: {
    rsp: {
      bg: 'var(--theme-memory-register-rsp-bg)',
      border: 'var(--theme-memory-register-rsp-border)',
      text: 'var(--theme-memory-register-rsp-text)'
    },
    rbp: {
      bg: 'var(--theme-memory-register-rbp-bg)',
      border: 'var(--theme-memory-register-rbp-border)',
      text: 'var(--theme-memory-register-rbp-text)'
    },
  },
  changed: {
    bg: 'var(--theme-memory-changed-bg)',
    border: 'var(--theme-memory-changed-border)'
  },
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
  if (!block.name) return defaultFrame;
  const dotIndex = block.name.indexOf('.');
  return dotIndex > 0 ? block.name.substring(0, dotIndex) : defaultFrame;
}

function getDisplayName(name: string | undefined): string {
  if (!name) return '(unnamed)';
  return name.includes('.') ? name.split('.')[1] : name;
}

/** 배열 요소인지 확인 (예: "main.arr[0]" → true) */
function isArrayElement(name: string | undefined): boolean {
  if (!name) return false;
  return /\[\d+\]$/.test(name);
}

/** 배열 이름 추출 (예: "main.arr[0]" → "main.arr") */
function getArrayBaseName(name: string | undefined): string {
  if (!name) return '';
  return name.replace(/\[\d+\]$/, '');
}

/** 배열 인덱스 추출 (예: "main.arr[5]" → 5) */
function getArrayIndex(name: string | undefined): number {
  if (!name) return -1;
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
  registerBlock,
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
  /** 블록 등록 함수 (포인터 화살표용) */
  registerBlock?: (name: string, address: string, element: HTMLElement | null) => void;
}) {
  const displayName = getDisplayName(arrayName);
  const elementCount = elements.length;
  const firstElement = elements[0];
  const lastElement = elements[elements.length - 1];

  // 테마 적용
  const currentTheme = useThemeStore((s) => s.theme);
  

  if (!isExpanded) {
    // 접힌 상태: 요약 표시
    return (
      <motion.div
        layout
        className="rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer relative"
        style={{
          backgroundColor: 'var(--theme-memory-card-bg)',
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
              className="text-xs p-1 rounded transition-colors"
              style={{ color: 'var(--theme-memory-card-muted)' }}
            >
              ▶
            </button>

            {/* 배열 정보 */}
            <span className="text-xs font-semibold" style={{ color: frameColor.text }}>
              {displayName}[0..{elementCount - 1}]
            </span>
            <span className="text-[10px]" style={{ color: 'var(--theme-memory-card-muted)' }}>
              ({elementCount}개 요소)
            </span>
          </div>

          {/* 주소 범위 */}
          <span className="text-[10px] font-mono" style={{ color: 'var(--theme-memory-card-muted)' }}>
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
          className="text-xs p-1 rounded transition-colors"
          style={{ color: 'var(--theme-memory-card-muted)' }}
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
            onRegister={registerBlock ? (el) => registerBlock(element.name, element.address, el) : undefined}
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
  onRegister,
}: {
  block: MemoryBlock;
  isChanged: boolean;
  isHovered: boolean;
  frameColor: typeof COLORS.frame[0];
  frameName: string;
  registerLabel?: 'rsp' | 'rbp';
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  /** 블록 요소 등록 (포인터 화살표용) */
  onRegister?: (element: HTMLElement | null) => void;
}) {
  const valueDisplay = isGarbageValue(block.value) ? '?' : String(block.value);
  const displayName = getDisplayName(block.name);
  const cardRef = useRef<HTMLDivElement>(null);

  // 테마 적용
  const currentTheme = useThemeStore((s) => s.theme);

  // 블록 요소 등록
  useEffect(() => {
    if (onRegister && cardRef.current) {
      onRegister(cardRef.current);
    }
    return () => {
      if (onRegister) {
        onRegister(null);
      }
    };
  }, [onRegister]);


  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer relative"
      data-block-name={block.name}
      data-block-address={block.address}
      style={{
        backgroundColor: isHovered ? frameColor.hover : 'var(--theme-memory-card-bg)',
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
            className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap"
            style={{
              color: 'var(--theme-memory-card-muted)',
              backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }}
          >
            {block.address}
          </span>
          <span className="mx-2 font-bold flex-shrink-0" style={{ color: 'var(--theme-memory-card-muted)' }}>|</span>
          {/* 값 */}
          <span
            className="font-mono font-bold text-base flex-shrink-0 whitespace-nowrap"
            style={{ color: isChanged ? 'var(--theme-memory-changed-border)' : 'var(--theme-memory-card-text)' }}
          >
            {valueDisplay}
          </span>
        </div>

        {/* 타입 */}
        <span className="text-[10px] font-mono" style={{ color: 'var(--theme-memory-card-muted)' }}>
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
            className="w-2.5 h-2.5 rounded-full ml-auto"
            style={{ backgroundColor: 'var(--theme-memory-changed-border)' }}
          />
        )}

        {/* RSP/RBP 레지스터 인디케이터 */}
        {registerLabel && (
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* 화살표 */}
            <svg width="32" height="12" viewBox="0 0 32 12" className="flex-shrink-0">
              <line x1="8" y1="6" x2="32" y2="6" stroke={COLORS.register[registerLabel].border} strokeWidth="2" />
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

/** Stack 섹션 - 2열 레이아웃 */
function StackSection({
  blocks,
  changedBlocks,
  frames,
  showRegisters,
  registerBlock,
}: {
  blocks: MemoryBlock[];
  changedBlocks: ChangedBlocksType;
  frames: Array<{ name: string }>;
  showRegisters: boolean;
  /** 블록 등록 함수 (포인터 화살표용) */
  registerBlock?: (name: string, address: string, element: HTMLElement | null) => void;
}) {
  const [hoveredFrame, setHoveredFrame] = useState<string | null>(null);
  const [expandedArrays, setExpandedArrays] = useState<Set<string>>(new Set());

  // 테마 적용
  const currentTheme = useThemeStore((s) => s.theme);
  

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
          backgroundColor: 'var(--theme-memory-stack-bg)',
          border: `1px solid ${'var(--theme-memory-stack-border)'}25`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--theme-memory-stack-label)' }}>
            📦 Stack
          </span>
          <span className="text-[9px]" style={{ color: 'var(--theme-memory-stack-label)' }}>
            ↓ 낮은 주소
          </span>
        </div>
        <div className="text-center py-3 text-[10px] italic" style={{ color: 'var(--theme-memory-card-muted)' }}>
          (비어있음)
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: 'var(--theme-memory-stack-bg)',
        border: `1px solid ${'var(--theme-memory-stack-border)'}25`,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--theme-memory-stack-label)' }}>
          📦 Stack
        </span>
        <span className="text-[9px]" style={{ color: 'var(--theme-memory-stack-label)' }}>
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
                const isChanged = elements.some((el) => changedBlocks.stack.includes(el.name) || changedBlocks.heap.includes(el.name));

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
                    registerBlock={registerBlock}
                  />
                );
              } else {
                const block = item.data as MemoryBlock;
                const frameName = blockFrameMap.get(block.name) || 'main';
                const frameColor = frameColorMap.get(frameName) || COLORS.frame[0];
                // 오직 호버했을 때만 오버레이 표시
                const isHovered = hoveredFrame === frameName;
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
                    isChanged={changedBlocks.stack.includes(block.name) || changedBlocks.heap.includes(block.name)}
                    isHovered={isHovered}
                    frameColor={frameColor}
                    frameName={frameName}
                    registerLabel={registerLabel}
                    onMouseEnter={() => setHoveredFrame(frameName)}
                    onMouseLeave={() => setHoveredFrame(null)}
                    onRegister={registerBlock ? (el) => registerBlock(block.name, block.address, el) : undefined}
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

/** 하위 메모리 섹션 (BSS, Data, Text) - 빈 경우 한 줄로 축소 */
function LowerMemorySections({
  dataSection = [],
  textSection = [],
}: {
  dataSection?: DataItem[];
  textSection?: TextItem[];
}) {
  const SECTION_COLORS = {
    bss: { color: 'var(--theme-memory-card-muted)', bg: 'var(--theme-memory-stack-bg)', border: 'var(--theme-memory-card-muted)' },
    data: { color: 'var(--theme-memory-data-label)', bg: 'var(--theme-memory-data-bg)', border: 'var(--theme-memory-data-label)' },
    text: { color: 'var(--theme-memory-text-label)', bg: 'var(--theme-memory-text-bg)', border: 'var(--theme-memory-text-label)' },
  };

  return (
    <div className="space-y-1">
      {/* BSS - 항상 한 줄 (이 커리큘럼에서는 사용 안 함) */}
      <div
        className="rounded-md px-2 py-1.5 flex items-center justify-between"
        style={{
          backgroundColor: SECTION_COLORS.bss.bg,
          border: `1px solid ${SECTION_COLORS.bss.color}20`,
        }}
      >
        <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.bss.color }}>
          📭 BSS
        </span>
        <span className="text-[9px] italic" style={{ color: SECTION_COLORS.bss.color }}>
          (비어있음)
        </span>
      </div>

      {/* Data 영역 - 문자열 리터럴 */}
      {dataSection.length === 0 ? (
        // 빈 Data - 한 줄로 축소
        <div
          className="rounded-md px-2 py-1.5 flex items-center justify-between"
          style={{
            backgroundColor: SECTION_COLORS.data.bg,
            border: `1px solid ${SECTION_COLORS.data.border}25`,
          }}
        >
          <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.data.color }}>
            📝 Data
          </span>
          <span className="text-[9px] italic" style={{ color: 'var(--theme-memory-card-muted)' }}>
            (비어있음)
          </span>
        </div>
      ) : (
        // 데이터가 있는 경우 - 확장 표시
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: SECTION_COLORS.data.bg,
            border: `1px solid ${SECTION_COLORS.data.border}25`,
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.data.color }}>
              📝 Data
            </span>
            <span className="text-[9px]" style={{ color: SECTION_COLORS.data.color }}>
              문자열 리터럴
            </span>
          </div>
          <div className="space-y-1">
            {dataSection.map((item, idx) => (
              <div
                key={idx}
                className="rounded px-2 py-1 flex items-center gap-2"
                style={{ backgroundColor: `${'var(--theme-memory-card-bg)'}B3` }}
              >
                <span className="text-[10px] font-mono" style={{ color: 'var(--theme-memory-card-muted)' }}>{item.address}</span>
                <span style={{ color: 'var(--theme-memory-card-muted)' }}>|</span>
                <span className="text-[11px] font-mono truncate flex-1" style={{ color: 'var(--theme-memory-data-label)' }}>
                  "{item.value}"
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text 영역 - 함수 코드 */}
      {textSection.length === 0 ? (
        // 빈 Text - 한 줄로 축소
        <div
          className="rounded-md px-2 py-1.5 flex items-center justify-between"
          style={{
            backgroundColor: SECTION_COLORS.text.bg,
            border: `1px solid ${SECTION_COLORS.text.border}25`,
          }}
        >
          <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.text.color }}>
            ⚙️ Text
          </span>
          <span className="text-[9px] italic" style={{ color: 'var(--theme-memory-card-muted)' }}>
            (비어있음)
          </span>
        </div>
      ) : (
        // 함수가 있는 경우 - 확장 표시
        <div
          className="rounded-lg p-2"
          style={{
            backgroundColor: SECTION_COLORS.text.bg,
            border: `1px solid ${SECTION_COLORS.text.border}25`,
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase" style={{ color: SECTION_COLORS.text.color }}>
              ⚙️ Text
            </span>
            <span className="text-[9px]" style={{ color: SECTION_COLORS.text.color }}>
              실행 코드
            </span>
          </div>
          <div className="space-y-1">
            {textSection.map((item, idx) => (
              <div
                key={idx}
                className="rounded px-2 py-1 flex items-center gap-2"
                style={{ backgroundColor: `${'var(--theme-memory-card-bg)'}B3` }}
              >
                <span className="text-[10px] font-mono" style={{ color: 'var(--theme-memory-card-muted)' }}>{item.address}</span>
                <span style={{ color: 'var(--theme-memory-card-muted)' }}>|</span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--theme-memory-text-label)' }}>
                  {item.name}()
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 맨 아래: 낮은 주소 표시 */}
      <div className="text-center text-[9px] pt-0.5" style={{ color: 'var(--theme-memory-card-muted)' }}>
        ↓ 0x0000 (낮은 주소)
      </div>
    </div>
  );
}

/** Heap 섹션 - 빈 경우 한 줄로 축소 */
function HeapSection({
  blocks,
  changedBlocks,
  registerBlock,
}: {
  blocks: MemoryBlock[];
  changedBlocks: ChangedBlocksType;
  /** 블록 등록 함수 (포인터 화살표용) */
  registerBlock?: (name: string, address: string, element: HTMLElement | null) => void;
}) {
  // 주소순 정렬 (낮은 주소 → 높은 주소)
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => {
      const addrA = parseInt(a.address, 16);
      const addrB = parseInt(b.address, 16);
      return addrA - addrB;
    });
  }, [blocks]);

  // 빈 Heap - 한 줄로 축소
  if (sortedBlocks.length === 0) {
    return (
      <div
        className="rounded-md px-2 py-1.5 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--theme-memory-heap-bg)',
          border: `1px solid ${'var(--theme-memory-heap-border)'}25`,
        }}
      >
        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--theme-memory-heap-label)' }}>
          🎒 Heap
        </span>
        <span className="text-[9px] italic" style={{ color: 'var(--theme-memory-card-muted)' }}>
          (비어있음)
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-2"
      style={{
        backgroundColor: 'var(--theme-memory-heap-bg)',
        border: `1px solid ${'var(--theme-memory-heap-border)'}25`,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--theme-memory-heap-label)' }}>
          🎒 Heap
        </span>
        <span className="text-[9px]" style={{ color: 'var(--theme-memory-heap-label)' }}>
          ↑ 높은 주소
        </span>
      </div>

      {/* 메모리 블록 리스트 */}
      <div className="space-y-1.5">
        {sortedBlocks.map((block) => (
          <MemoryBlockCard
            key={`heap-${block.name}-${block.address}`}
            block={block}
            isChanged={changedBlocks.stack.includes(block.name) || changedBlocks.heap.includes(block.name)}
            isHovered={false}
            frameColor={COLORS.frame[2]} // green
            frameName="heap"
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
            onRegister={registerBlock ? (el) => registerBlock(block.name, block.address, el) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

const INITIAL_CHANGED_BLOCKS: ChangedBlocksType = { stack: [], heap: [] };

export function MemoryPanel({
  stack,
  heap,
  changedBlocks = INITIAL_CHANGED_BLOCKS,
  frames = [{ name: 'main' }],
  showRegisters = true,
  dataSection = [],
  textSection = [],
}: MemoryPanelProps) {
  const isEmpty = stack.length === 0 && heap.length === 0;

  // 포인터 화살표 연결 관리
  const { connections, containerRef, containerSize, registerBlock } =
    usePointerConnections(stack, heap, [...changedBlocks.stack, ...changedBlocks.heap]);

  return (
    <div className="p-2 space-y-2 relative" ref={containerRef}>
      {/* 포인터 화살표 오버레이 */}
      {connections.length > 0 && (
        <PointerArrowOverlay
          width={containerSize.width}
          height={containerSize.height}
        >
          {connections.map((conn) => (
            <PointerArrow
              key={conn.id}
              id={conn.id}
              from={conn.from}
              to={conn.to}
              isActive={conn.isActive}
              isCrossFrame={conn.isCrossFrame}
            />
          ))}
        </PointerArrowOverlay>
      )}

      {isEmpty ? (
        <div
          className="text-center py-8 text-sm italic"
          style={{ color: 'var(--theme-memory-card-muted)' }}
        >
          메모리 할당 없음
        </div>
      ) : (
        <>
          {/* RSP/RBP는 StackSection 내부 블록에 직접 표시됨 - RegisterPanel 중복 제거 */}
          <StackSection
            blocks={stack}
            changedBlocks={changedBlocks}
            frames={frames}
            showRegisters={showRegisters}
            registerBlock={registerBlock}
          />
          <HeapSection
            blocks={heap}
            changedBlocks={changedBlocks}
            registerBlock={registerBlock}
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
