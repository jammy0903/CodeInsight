/**
 * FunctionFrame Component
 *
 * 함수 프레임 시각화
 * - 진입 시: 슬라이드 + 확대 애니메이션
 * - 종료 시: 축소 + 페이드아웃 애니메이션
 * - 활성 프레임 하이라이트
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowVariable, FlowDiff } from '@codeinsight/shared';
import { VariableBox } from './VariableBox';
import { FLOW_THEMES, FLOW_ANIMATION, type FlowTheme } from '../../shared/styles';

// ============================================
// 타입 정의
// ============================================

interface FunctionFrameProps {
  /** 프레임 이름 (함수명) */
  name: string;
  /** 프레임 내 변수들 */
  variables: FlowVariable[];
  /** 변경 감지 결과 */
  diff: FlowDiff;
  /** 테마 */
  theme: FlowTheme;
  /** 활성 프레임 여부 (현재 실행 중) */
  isActive?: boolean;
  /** 새로 생성된 프레임 여부 */
  isNew?: boolean;
  /** 종료 예정 프레임 여부 */
  isExiting?: boolean;
  /** 변수 클릭 핸들러 */
  onVariableClick?: (variable: FlowVariable) => void;
}

// ============================================
// 애니메이션 Variants
// ============================================

const frameVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: -30,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: FLOW_ANIMATION.spring.stiffness,
      damping: FLOW_ANIMATION.spring.damping,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: {
      duration: FLOW_ANIMATION.duration.normal / 1000,
    },
  },
} as const;

const headerVariants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 },
  },
};

// ============================================
// 컴포넌트
// ============================================

export const FunctionFrame = memo(function FunctionFrame({
  name,
  variables,
  diff,
  theme,
  isActive = false,
  isNew = false,
  isExiting = false,
  onVariableClick,
}: FunctionFrameProps) {
  const frameStyle = FLOW_THEMES[theme].frame;

  // 프레임 타입에 따른 아이콘
  const getFrameIcon = () => {
    if (name === 'main') return '▶';
    if (name === 'global') return '🌐';
    if (name === 'heap') return '📦';
    return '→'; // 일반 함수
  };

  // 활성 상태에 따른 스타일
  const activeStyle = isActive
    ? {
        borderColor: frameStyle.label,
        boxShadow: `0 0 12px ${frameStyle.border}`,
      }
    : {};

  return (
    <motion.div
      className="function-frame rounded-lg overflow-hidden"
      style={{
        backgroundColor: frameStyle.background,
        border: `2px solid ${frameStyle.border}`,
        ...activeStyle,
      }}
      variants={frameVariants}
      initial={isNew ? 'initial' : false}
      animate="animate"
      exit="exit"
      layout
    >
      {/* 프레임 헤더 */}
      <motion.div
        className="flex items-center gap-2 px-3 py-2 font-mono text-sm font-medium"
        style={{
          backgroundColor: frameStyle.header,
          color: frameStyle.label,
        }}
        variants={headerVariants}
        initial={isNew ? 'initial' : false}
        animate="animate"
      >
        <span className="text-xs">{getFrameIcon()}</span>
        <span>{name === 'heap' ? 'Heap' : `${name}()`}</span>
        {isActive && (
          <motion.span
            className="ml-auto text-xs px-1.5 py-0.5 rounded bg-white bg-opacity-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            executing
          </motion.span>
        )}
        {isExiting && (
          <motion.span
            className="ml-auto text-xs px-1.5 py-0.5 rounded bg-red-500 bg-opacity-20 text-red-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            returning
          </motion.span>
        )}
      </motion.div>

      {/* 변수들 */}
      <div
        className="p-4 flex flex-wrap min-h-[80px]"
        style={{ gap: 'var(--flow-spacing-box-gap)' }}
      >
        <AnimatePresence mode="popLayout">
          {variables.length > 0 ? (
            variables.map((variable, index) => (
              <motion.div
                key={variable.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    delay: isNew ? index * (FLOW_ANIMATION.stagger / 1000) : 0,
                  },
                }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <VariableBox
                  variable={variable}
                  theme={theme}
                  isNew={diff.created.includes(variable.id)}
                  isUpdated={diff.updated.includes(variable.id)}
                  isDeleting={diff.deleted.includes(variable.id)}
                  onClick={() => onVariableClick?.(variable)}
                />
              </motion.div>
            ))
          ) : (
            <motion.span
              className="text-sm opacity-50 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
            >
              (no variables)
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default FunctionFrame;
