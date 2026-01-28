/**
 * WeakConcepts - 취약 개념 목록
 */

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WeakConceptsProps {
  weakConcepts: Record<string, number>; // 개념 → 오답 수
}

export function WeakConcepts({ weakConcepts }: WeakConceptsProps) {
  // 오답 수 기준 정렬
  const sortedConcepts = Object.entries(weakConcepts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // 상위 5개만

  if (sortedConcepts.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-md">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--theme-dashboard-title)]">보완이 필요한 개념</h3>
          <p className="text-sm text-[var(--theme-dashboard-text-muted)]">틀린 문제가 많은 주제예요</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedConcepts.map(([concept, count], index) => (
          <motion.div
            key={concept}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-white bg-opacity-70 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getConceptEmoji(index)}</span>
              <div>
                <p className="font-medium text-[var(--theme-dashboard-title)]">{concept}</p>
                <p className="text-sm text-red-500">
                  {count}문제 틀림
                </p>
              </div>
            </div>

            <Link
              to={`/courses/c?concept=${encodeURIComponent(concept)}`}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
            >
              복습하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-[var(--theme-dashboard-text-muted)] text-center mt-4">
        해당 개념이 포함된 레슨을 다시 학습해보세요
      </p>
    </div>
  );
}

function getConceptEmoji(index: number): string {
  const emojis = ['🔴', '🟠', '🟡', '🟢', '🔵'];
  return emojis[index] || '⚪';
}
