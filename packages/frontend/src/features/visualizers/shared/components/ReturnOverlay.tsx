/**
 * ReturnOverlay - Return 문 시각화 오버레이
 *
 * WHY: return 문 실행 시 스택 프레임이 "pop" 되는 것을 시각적으로 표현
 * - 함수가 끝나면서 스택에서 제거되는 모습
 * - 반환값이 호출자에게 전달되는 화살표
 * - 프로그램 제어 흐름의 이해를 도움
 *
 * TRADEOFF: 화려한 애니메이션 < 학습 효과 (핵심 개념 강조)
 * REVISIT: 다른 언어(Python, Java)에서도 동일한 패턴 적용 시 확장
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { ReturnOverlayProps } from '../types';

// ============================================
// 색상 테마
// ============================================

const COLORS = {
  dark: {
    bg: 'rgba(0, 0, 0, 0.75)',
    card: '#2a3140',
    cardBorder: '#f97316',
    text: '#f5f5f5',
    textMuted: '#a1a1aa',
    accent: '#f97316',
    accentBg: 'rgba(249, 115, 22, 0.15)',
    arrow: '#fb923c',
    value: '#4ade80',
    meaning: '#60a5fa',
  },
  light: {
    bg: 'rgba(255, 255, 255, 0.85)',
    card: '#ffffff',
    cardBorder: '#ea580c',
    text: '#1f2937',
    textMuted: '#6b7280',
    accent: '#ea580c',
    accentBg: 'rgba(249, 115, 22, 0.1)',
    arrow: '#f97316',
    value: '#16a34a',
    meaning: '#2563eb',
  },
};

// ============================================
// 애니메이션 variants
// ============================================

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.9,
    transition: { duration: 0.3 },
  },
};

const arrowVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, delay: 0.2 },
  },
};

const valueVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.4, type: 'spring', stiffness: 200 },
  },
};

// ============================================
// 컴포넌트
// ============================================

export function ReturnOverlay({
  isReturn,
  returnInfo,
  theme = 'light',
  onAnimationComplete,
}: ReturnOverlayProps) {
  const colors = COLORS[theme];

  // return이 아니면 렌더링 안 함
  if (!isReturn) return null;

  const functionName = returnInfo?.functionName || 'main';
  const callerName = returnInfo?.callerName || 'OS';

  return (
    <AnimatePresence>
      {isReturn && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onAnimationComplete={onAnimationComplete}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
            backdropFilter: 'blur(4px)',
            zIndex: 10,
            padding: '16px',
          }}
        >
          {/* 메인 카드 */}
          <motion.div
            variants={cardVariants}
            style={{
              backgroundColor: colors.card,
              borderRadius: '16px',
              border: `2px solid ${colors.cardBorder}`,
              padding: '24px 32px',
              maxWidth: '320px',
              width: '100%',
              boxShadow: theme === 'dark'
                ? '0 20px 40px rgba(0, 0, 0, 0.5)'
                : '0 20px 40px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* 헤더 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              {/* 아이콘 */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: colors.accentBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    variants={arrowVariants}
                    d="M19 12H5M12 5l-7 7 7 7"
                  />
                </svg>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: colors.accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Stack Frame Pop
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: colors.text,
                    fontFamily: 'monospace',
                  }}
                >
                  return {returnInfo?.value ?? 'void'}
                </div>
              </div>
            </div>

            {/* 제어 흐름 다이어그램 */}
            <div
              style={{
                backgroundColor: colors.accentBg,
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                {/* 현재 함수 (pop 됨) */}
                <motion.div
                  animate={{
                    opacity: [1, 0.5, 0.2],
                    y: [0, -8, -16],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: 'loop',
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: theme === 'dark' ? '#3f3f46' : '#e5e7eb',
                    border: `1px dashed ${colors.textMuted}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: colors.textMuted,
                    }}
                  >
                    {functionName}()
                  </span>
                </motion.div>

                {/* 화살표 */}
                <svg width="40" height="24" viewBox="0 0 40 24">
                  <motion.path
                    variants={arrowVariants}
                    initial="hidden"
                    animate="visible"
                    d="M5 12H30M30 12L22 6M30 12L22 18"
                    stroke={colors.arrow}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>

                {/* 호출자 */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: theme === 'dark' ? '#1e3a5f' : '#dbeafe',
                    border: `1px solid ${colors.meaning}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: colors.meaning,
                    }}
                  >
                    {callerName}
                  </span>
                </div>
              </div>
            </div>

            {/* 반환값 & 의미 */}
            {returnInfo && (
              <motion.div variants={valueVariants} initial="hidden" animate="visible">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: colors.textMuted,
                    }}
                  >
                    반환값:
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: colors.value,
                      backgroundColor: theme === 'dark'
                        ? 'rgba(74, 222, 128, 0.15)'
                        : 'rgba(22, 163, 74, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {returnInfo.value}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                    lineHeight: 1.5,
                  }}
                >
                  💡 {returnInfo.meaning}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* 하단 힌트 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              marginTop: '16px',
              fontSize: '11px',
              color: colors.textMuted,
            }}
          >
            함수가 종료되면 스택 프레임이 제거(pop)됩니다
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
