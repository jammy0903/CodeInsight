/**
 * DashboardPage - 나의 학습 현황 페이지
 *
 * WHY: 사용자의 학습 진행 상황 시각화
 * TODO: 실제 진행 상태 API 연동, 통계 차트
 */

import { BarChart3, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { useStore } from '@/stores/store';

export function DashboardPage() {
  const { appUser } = useStore();

  return (
    <div className="min-h-screen bg-[#fffbf5] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8 text-[#a08060]" />
          <h1 className="text-2xl font-bold text-[#6b5a4a]">나의 현황</h1>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#e5d5c7] p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-[#a08060]" />
              <span className="text-sm text-[#937b5d]">학습한 레슨</span>
            </div>
            <p className="text-2xl font-bold text-[#6b5a4a]">0</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e5d5c7] p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-[#937b5d]">완료한 퀴즈</span>
            </div>
            <p className="text-2xl font-bold text-[#6b5a4a]">0</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e5d5c7] p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-[#937b5d]">총 학습 시간</span>
            </div>
            <p className="text-2xl font-bold text-[#6b5a4a]">0분</p>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-xl border border-[#e5d5c7] p-6">
          <h2 className="text-lg font-semibold text-[#6b5a4a] mb-4">
            최근 활동
          </h2>
          <div className="text-center py-8 text-[#937b5d]">
            <p>아직 학습 기록이 없습니다.</p>
            <p className="text-sm mt-2">코스를 시작해보세요!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
