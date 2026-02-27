/**
 * TerminalStepView - 터미널 출력 중심 시각화 컴포넌트
 *
 * terminal visualizationType을 가진 레슨 스텝에 사용.
 * - 코드 실행 결과를 터미널 스타일로 표시
 * - 현재 스텝의 설명만 강조 (시각화 데이터 없는 단순 스텝용)
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// 타입 정의
// ============================================

interface TerminalStepViewProps {
  explanation?: string;
  stdout?: string;
  className?: string;
}

// ============================================
// TerminalStepView 메인 컴포넌트
// ============================================

export const TerminalStepView = memo(function TerminalStepView({
  explanation,
  stdout,
  className = '',
}: TerminalStepViewProps) {
  const { t } = useTranslation();
  return (
    <div className={`terminal-step-view p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>💻</span>
        <span>{t('visualizer.terminal_desc')}</span>
      </div>

      {/* Terminal output */}
      {stdout && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl overflow-hidden border border-gray-700"
        >
          {/* Terminal title bar */}
          <div className="px-4 py-2 bg-gray-800 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-gray-400 text-xs font-mono ml-2">Output</span>
          </div>

          {/* Terminal content */}
          <div className="bg-gray-900 px-4 py-3">
            {stdout.split('\n').map((line, i) => (
              <div key={i} className="font-mono text-sm text-green-400 leading-relaxed">
                <span className="text-gray-600 mr-2">{'>'}</span>
                {line || '\u00a0'}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No output indicator */}
      {!stdout && !explanation && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">💻</span>
          <p>{t('visualizer.no_output_yet')}</p>
          <p className="text-sm">{t('visualizer.output_will_appear')}</p>
        </div>
      )}

      {/* Explanation box (when no viz data, this is the main content) */}
      {explanation && !stdout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200"
        >
          <div className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
            {explanation}
          </div>
        </motion.div>
      )}
    </div>
  );
});

export default TerminalStepView;
