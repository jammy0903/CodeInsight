/**
 * ReportHeader - PDF report header with logo, title, date
 */

import { Code2 } from 'lucide-react';

interface ReportHeaderProps {
  period?: string;
}

export function ReportHeader({ period = '1y' }: ReportHeaderProps) {
  const periodLabel = {
    '7d': '7일',
    '30d': '30일',
    '90d': '90일',
    '1y': '1년',
  }[period] || '1년';

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="keep-together mb-8 pb-6 border-b-2 border-gray-200">
      {/* Logo and Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Code2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CodeInsight</h1>
          <p className="text-sm text-gray-500">학습 분석 리포트</p>
        </div>
      </div>

      {/* Report Info */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">생성일:</span>
          <span>{today}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">분석 기간:</span>
          <span>최근 {periodLabel}</span>
        </div>
      </div>
    </div>
  );
}
