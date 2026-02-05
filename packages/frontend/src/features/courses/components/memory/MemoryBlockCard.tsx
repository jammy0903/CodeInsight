/**
 * MemoryBlockCard - [주소 | 값] 형태의 개별 메모리 블록 카드
 *
 * 터치 확장 지원: 트렁케이트된 값/이름/포인터를 탭하면 전체 표시
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryBlock } from '@/types';
import { useThemeStore } from '@/stores/themeStore';

import { COLORS } from './utils/frameColors';
import type { FrameColor } from './utils/frameColors';
import { isGarbageValue, getDisplayName, truncateText } from './utils/memoryHelpers';

export interface MemoryBlockCardProps {
  block: MemoryBlock;
  isChanged: boolean;
  isHovered: boolean;
  frameColor: FrameColor;
  frameName: string;
  registerLabel?: 'rsp' | 'rbp';
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function MemoryBlockCard({
  block,
  isChanged,
  isHovered,
  frameColor,
  frameName,
  registerLabel,
  onMouseEnter,
  onMouseLeave,
}: MemoryBlockCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const valueDisplay = isGarbageValue(block.value) ? '?' : String(block.value);
  const displayName = getDisplayName(block.name);

  const currentTheme = useThemeStore((s) => s.theme);

  const MAX_VALUE_LENGTH = 8;
  const MAX_NAME_LENGTH = 10;
  const MAX_POINTER_LENGTH = 12;

  const valueTrunc = truncateText(valueDisplay, MAX_VALUE_LENGTH);
  const nameTrunc = truncateText(displayName, MAX_NAME_LENGTH);
  const pointerTrunc = block.points_to ? truncateText(block.points_to, MAX_POINTER_LENGTH) : null;

  const needsExpansion = valueTrunc.isTruncated || nameTrunc.isTruncated || (pointerTrunc?.isTruncated ?? false);

  const handleToggleExpand = (e: React.MouseEvent | React.TouchEvent) => {
    if (needsExpansion) {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    }
  };

  const isDangling = !!block.dangling;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: isDangling ? 0.6 : 1, x: 0 }}
      className="rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer relative"
      data-block-name={block.name}
      data-block-address={block.address}
      style={{
        backgroundColor: isHovered ? frameColor.hover : 'var(--theme-memory-card-bg)',
        border: isDangling
          ? '2px dashed #ef4444'
          : `2px solid ${isChanged ? COLORS.changed.border : frameColor.border}`,
        boxShadow: isDangling
          ? '0 0 8px rgba(239,68,68,0.3)'
          : isChanged
            ? `0 0 8px ${COLORS.changed.border}40`
            : isHovered
              ? `0 0 6px ${frameColor.border}30`
              : '0 1px 3px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleToggleExpand}
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

      {/* 확장 인디케이터 (트렁케이트된 경우에만 표시) */}
      {needsExpansion && (
        <div
          className="absolute top-1 right-1 text-[8px] px-1 rounded"
          style={{
            backgroundColor: isExpanded ? '#3b82f6' : 'var(--theme-memory-card-muted)',
            color: isExpanded ? '#fff' : 'var(--theme-memory-card-bg)',
            opacity: 0.8,
          }}
        >
          {isExpanded ? t('lesson.collapse') : t('lesson.expand')}
        </div>
      )}

      <div className={`flex items-center gap-2 relative ${isExpanded ? 'flex-wrap' : ''}`}>
        {/* [주소 | 값] 박스 */}
        <div
          className={`flex items-center rounded px-2 py-1 ${isExpanded ? 'flex-wrap' : ''}`}
          style={{ backgroundColor: `${frameColor.border}15`, maxWidth: isExpanded ? '100%' : undefined }}
        >
          {/* 주소 배지 */}
          <span
            className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{
              color: 'var(--theme-memory-card-muted)',
              backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }}
          >
            {block.address}
          </span>
          <span className="mx-2 font-bold flex-shrink-0" style={{ color: 'var(--theme-memory-card-muted)' }}>
            |
          </span>
          {/* 값 */}
          <span
            className={`font-mono font-bold text-base ${isExpanded ? 'break-all' : 'truncate'}`}
            style={{
              color: isChanged ? 'var(--theme-memory-changed-border)' : 'var(--theme-memory-card-text)',
              maxWidth: isExpanded ? '100%' : '80px',
            }}
            title={valueDisplay}
          >
            {isExpanded ? valueDisplay : valueTrunc.text}
          </span>
        </div>

        {/* 타입 */}
        <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'var(--theme-memory-card-muted)' }}>
          {block.type || 'var'}
        </span>

        {/* 변수명 */}
        <span
          className={`text-xs font-semibold ${isExpanded ? 'break-all' : 'truncate'}`}
          style={{
            color: frameColor.text,
            maxWidth: isExpanded ? '100%' : '80px',
          }}
          title={displayName}
        >
          {isExpanded ? displayName : nameTrunc.text}
        </span>

        {/* 포인터 표시 */}
        {block.points_to && (
          <span
            className={`text-[10px] font-semibold ${isExpanded ? '' : 'ml-auto truncate'}`}
            style={{
              color: '#f97316',
              maxWidth: isExpanded ? '100%' : '100px',
            }}
            title={`\u2192 ${block.points_to}`}
          >
            &rarr; {isExpanded ? block.points_to : (pointerTrunc?.text ?? block.points_to)}
          </span>
        )}

        {/* 변경 인디케이터 */}
        {isChanged && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2.5 h-2.5 rounded-full ml-auto flex-shrink-0"
            style={{ backgroundColor: 'var(--theme-memory-changed-border)' }}
          />
        )}

        {/* RSP/RBP 레지스터 인디케이터 */}
        {registerLabel && (
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <svg width="32" height="12" viewBox="0 0 32 12" className="flex-shrink-0">
              <line x1="8" y1="6" x2="32" y2="6" stroke={COLORS.register[registerLabel].border} strokeWidth="2" />
            </svg>
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

      {/* Dangling 뱃지 */}
      {isDangling && (
        <div
          className="mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded inline-block"
          style={{ backgroundColor: '#fecaca', color: '#991b1b' }}
        >
          dangling
        </div>
      )}

      {/* Struct 멤버 표시 */}
      {block.structMembers && block.structMembers.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {block.structMembers.map((member) => (
            <span
              key={member.key}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${frameColor.border}15`,
                color: 'var(--theme-memory-card-text)',
              }}
            >
              .{member.key}={member.value}
            </span>
          ))}
        </div>
      )}

      {/* Char 배열 표시 */}
      {block.charElements && block.charElements.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-0.5">
          {block.charElements.map((el, i) => (
            <span
              key={i}
              className="text-[11px] font-mono font-bold px-1 py-0.5 rounded border"
              style={{
                backgroundColor: el.highlight ? '#fef08a' : `${frameColor.border}10`,
                borderColor: el.highlight ? '#eab308' : `${frameColor.border}30`,
                color: 'var(--theme-memory-card-text)',
              }}
            >
              {el.value}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
