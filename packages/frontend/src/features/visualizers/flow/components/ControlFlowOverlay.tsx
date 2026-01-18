/**
 * ControlFlowOverlay Component
 *
 * if/else 분기 시각화
 * - 조건식 표시
 * - true/false 경로 하이라이트
 * - 분기 애니메이션
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { ControlFlow } from '@codeinsight/shared';
import { FLOW_THEMES, FLOW_ANIMATION, type FlowTheme } from '../styles';

// ============================================
// 타입 정의
// ============================================

interface ControlFlowOverlayProps {
  /** 제어 흐름 정보 */
  controlFlow: ControlFlow;
  /** 테마 */
  theme: FlowTheme;
}

// ============================================
// 서브 컴포넌트: BranchIndicator
// ============================================

interface BranchIndicatorProps {
  condition: string;
  result: boolean;
  theme: FlowTheme;
}

const BranchIndicator = memo(function BranchIndicator({
  condition,
  result,
  theme,
}: BranchIndicatorProps) {
  const colors = FLOW_THEMES[theme].control;
  const resultColor = result ? colors.truePath : colors.falsePath;

  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{
        backgroundColor: `${resultColor}15`,
        border: `2px solid ${resultColor}40`,
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: 'spring',
        stiffness: FLOW_ANIMATION.spring.stiffness,
        damping: FLOW_ANIMATION.spring.damping,
      }}
    >
      {/* 분기 아이콘 */}
      <motion.div
        className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold"
        style={{ backgroundColor: resultColor }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring' }}
      >
        {result ? '✓' : '✗'}
      </motion.div>

      {/* 조건식 */}
      <div className="flex-1">
        <motion.code
          className="text-sm font-mono block"
          style={{ color: resultColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          if ({condition})
        </motion.code>
        <motion.span
          className="text-xs opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.3 }}
        >
          → {result ? 'true (진입)' : 'false (스킵)'}
        </motion.span>
      </div>

      {/* 방향 화살표 */}
      <motion.div
        className="text-2xl"
        style={{ color: resultColor }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        {result ? '↓' : '↪'}
      </motion.div>
    </motion.div>
  );
});

// ============================================
// 서브 컴포넌트: SwitchIndicator
// ============================================

interface SwitchIndicatorProps {
  condition: string;
  theme: FlowTheme;
}

const SwitchIndicator = memo(function SwitchIndicator({
  condition,
  theme,
}: SwitchIndicatorProps) {
  const colors = FLOW_THEMES[theme].control;

  return (
    <motion.div
      className="p-3 rounded-lg"
      style={{
        backgroundColor: `${colors.loop}15`,
        border: `2px solid ${colors.loop}40`,
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🔀</span>
        <code className="text-sm font-mono" style={{ color: colors.loop }}>
          switch ({condition})
        </code>
      </div>
    </motion.div>
  );
});

// ============================================
// 서브 컴포넌트: FunctionCallIndicator
// ============================================

interface FunctionCallIndicatorProps {
  functionName: string;
  args?: unknown[];
  returnValue?: unknown;
  isReturn: boolean;
  theme: FlowTheme;
}

const FunctionCallIndicator = memo(function FunctionCallIndicator({
  functionName,
  args,
  returnValue,
  isReturn,
  theme,
}: FunctionCallIndicatorProps) {
  const colors = FLOW_THEMES[theme].control;

  return (
    <motion.div
      className="p-3 rounded-lg"
      style={{
        backgroundColor: `${colors.function}15`,
        border: `2px solid ${colors.function}40`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring' }}
    >
      <div className="flex items-center gap-2">
        <motion.span
          className="text-lg"
          animate={isReturn ? { rotate: 180 } : { rotate: 0 }}
        >
          {isReturn ? '↩' : '→'}
        </motion.span>
        <code className="text-sm font-mono" style={{ color: colors.function }}>
          {isReturn ? (
            <>
              return{' '}
              <span className="font-bold">
                {returnValue !== undefined ? String(returnValue) : 'void'}
              </span>
            </>
          ) : (
            <>
              {functionName}(
              {args?.map((arg, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <span className="font-bold">{String(arg)}</span>
                </span>
              ))}
              )
            </>
          )}
        </code>
      </div>
      <motion.span
        className="text-xs opacity-70 mt-1 block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.2 }}
      >
        {isReturn ? '함수 종료' : '함수 호출'}
      </motion.span>
    </motion.div>
  );
});

// ============================================
// 메인 컴포넌트
// ============================================

export const ControlFlowOverlay = memo(function ControlFlowOverlay({
  controlFlow,
  theme,
}: ControlFlowOverlayProps) {
  const { type, condition, conditionResult, functionName, arguments: args, returnValue } = controlFlow;

  // if/else-if/else
  if (type === 'if' || type === 'else-if' || type === 'else') {
    return (
      <BranchIndicator
        condition={condition || '?'}
        result={conditionResult ?? false}
        theme={theme}
      />
    );
  }

  // switch
  if (type === 'switch') {
    return <SwitchIndicator condition={condition || '?'} theme={theme} />;
  }

  // function-call
  if (type === 'function-call') {
    return (
      <FunctionCallIndicator
        functionName={functionName || '?'}
        args={args}
        isReturn={false}
        theme={theme}
      />
    );
  }

  // function-return
  if (type === 'function-return') {
    return (
      <FunctionCallIndicator
        functionName={functionName || '?'}
        returnValue={returnValue}
        isReturn={true}
        theme={theme}
      />
    );
  }

  // for/while/do-while → LoopTrack에서 처리
  return null;
});

export default ControlFlowOverlay;
