/**
 * ReportWeakConcepts - PDF report weak concepts analysis
 */

import { AlertTriangle } from 'lucide-react';

interface ReportWeakConceptsProps {
  concepts: Record<string, number>;
}

export function ReportWeakConcepts({ concepts }: ReportWeakConceptsProps) {
  // Sort by wrong count descending, take top 5
  const sortedConcepts = Object.entries(concepts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sortedConcepts.length === 0) {
    return null;
  }

  const maxCount = sortedConcepts[0]?.[1] || 1;

  return (
    <div className="keep-together mb-8">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-gray-800">취약 개념 분석</h2>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-4">
          오답 기준 상위 {sortedConcepts.length}개 개념입니다. 집중 복습을 권장합니다.
        </p>

        <div className="space-y-3">
          {sortedConcepts.map(([concept, count], index) => {
            const percentage = Math.round((count / maxCount) * 100);
            return (
              <div key={concept} className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-800">{concept}</span>
                    <span className="text-xs text-gray-500">{count}회 오답</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
