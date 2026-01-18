/**
 * VariableBox Component
 *
 * 변수를 시각적 박스로 표현
 * - 이름 (상단)
 * - 값 (중앙, 애니메이션)
 * - 타입 (하단)
 * - 주소 (C언어, 선택적)
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowVariable, FlowVariableState } from '@codeinsight/shared';
import { FLOW_SIZES, FLOW_ANIMATION, getBoxStyle, type FlowTheme } from '../styles';

// ============================================
// 타입 정의
// ============================================

interface VariableBoxProps {
  /** 변수 데이터 */
  variable: FlowVariable;
  /** 테마 */
  theme?: FlowTheme;
  /** 새로 생성된 변수인지 */
  isNew?: boolean;
  /** 값이 변경된 변수인지 */
  isUpdated?: boolean;
  /** 삭제 중인 변수인지 */
  isDeleting?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 값을 화면에 표시할 문자열로 변환
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (typeof value === 'string') {
    // 문자열은 따옴표로 감싸기 (너무 길면 축약)
    if (value.length > 8) {
      return `"${value.slice(0, 6)}..."`;
    }
    return `"${value}"`;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3) {
      return `[${value.join(', ')}]`;
    }
    return `[${value.slice(0, 2).join(', ')}, ...]`;
  }

  if (typeof value === 'object') {
    return '{...}';
  }

  return String(value);
}

/**
 * 상태에 따른 박스 스타일 결정
 */
function getState(
  isNew: boolean,
  isUpdated: boolean,
  isDeleting: boolean,
  variableState: FlowVariableState
): FlowVariableState {
  if (isDeleting) return 'deleting';
  if (isNew) return 'creating';
  if (isUpdated) return 'updating';
  return variableState;
}

// ============================================
// 컴포넌트
// ============================================

export const VariableBox = memo(function VariableBox({
  variable,
  theme = 'light',
  isNew = false,
  isUpdated = false,
  isDeleting = false,
  onClick,
}: VariableBoxProps) {
  // 상태 결정
  const state = getState(isNew, isUpdated, isDeleting, variable.state);
  const style = useMemo(() => getBoxStyle(theme, state), [theme, state]);

  // 애니메이션 variants
  const boxVariants = {
    initial: isNew
      ? { scale: 0, opacity: 0, y: -20 }
      : { scale: 1, opacity: 1, y: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: FLOW_ANIMATION.spring.stiffness,
        damping: FLOW_ANIMATION.spring.damping,
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      y: 20,
      transition: { duration: FLOW_ANIMATION.duration.normal / 1000 },
    },
    highlight: {
      boxShadow: `0 0 12px ${style.glow}`,
      transition: { repeat: 2, duration: 0.3 },
    },
  };

  // 값 애니메이션 variants
  const valueVariants = {
    initial: { y: -20, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: FLOW_ANIMATION.spring.stiffness,
        damping: FLOW_ANIMATION.spring.damping,
      },
    },
    exit: { y: 20, opacity: 0 },
  };

  return (
    <motion.div
      className="variable-box relative flex flex-col items-center justify-center cursor-pointer select-none"
      data-variable-id={variable.id}
      style={{
        width: 'auto', // 내용에 맞게 자동 조절
        minWidth: FLOW_SIZES.box.minWidth,
        height: FLOW_SIZES.box.height,
        minHeight: FLOW_SIZES.box.minHeight,
        padding: `${FLOW_SIZES.box.padding}px ${FLOW_SIZES.box.padding + 8}px`, // 좌우 패딩 추가
        borderRadius: FLOW_SIZES.box.borderRadius,
        borderWidth: FLOW_SIZES.box.borderWidth,
        borderStyle: 'solid',
        backgroundColor: style.background,
        borderColor: style.border,
        boxShadow: state !== 'idle' ? `0 0 8px ${style.glow}` : 'none',
      }}
      variants={boxVariants}
      initial="initial"
      animate={isUpdated ? 'highlight' : 'animate'}
      exit="exit"
      onClick={onClick}
      layout // 위치 변경 시 자동 애니메이션
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 변수명 (라벨) */}
      <span
        className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 rounded text-xs font-medium whitespace-nowrap"
        style={{
          fontSize: FLOW_SIZES.font.label,
          color: style.label,
          backgroundColor: style.background,
        }}
      >
        {variable.name}
      </span>

      {/* 값 (중앙) */}
      <AnimatePresence mode="wait">
        <motion.span
          key={String(variable.value)}
          className="font-mono font-bold text-center whitespace-nowrap"
          style={{
            fontSize: FLOW_SIZES.font.value,
            color: style.value,
          }}
          variants={valueVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {formatValue(variable.value)}
        </motion.span>
      </AnimatePresence>

      {/* 타입 (하단) */}
      <span
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1 rounded text-xs whitespace-nowrap"
        style={{
          fontSize: FLOW_SIZES.font.type,
          color: style.type,
          backgroundColor: style.background,
        }}
      >
        {variable.type}
      </span>

      {/* 주소 (C언어, 선택적) */}
      {variable.address && (
        <span
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono opacity-50"
          style={{
            fontSize: FLOW_SIZES.font.address,
            color: style.type,
          }}
        >
          {variable.address}
        </span>
      )}

      {/* 포인터 표시 */}
      {variable.isPointer && (
        <span
          className="absolute top-0 right-0 w-2 h-2 rounded-full"
          style={{ backgroundColor: style.border }}
          title="Pointer"
        />
      )}

      {/* 참조 표시 (Python/Java) */}
      {variable.isReference && (
        <span
          className="absolute top-0 right-0 w-2 h-2 rounded-sm rotate-45"
          style={{ backgroundColor: style.border }}
          title="Reference"
        />
      )}
    </motion.div>
  );
});

export default VariableBox;
