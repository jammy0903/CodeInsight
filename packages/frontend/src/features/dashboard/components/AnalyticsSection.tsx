/**
 * AnalyticsSection - 분석 리포트 섹션
 *
 * WHY: 학습 패턴 시각화 및 AI 분석 제공
 * FEATURES:
 *   - 1년 달력 (GitHub 잔디 스타일)
 *   - 주간 활동 바차트
 *   - 시간대별 학습 패턴
 *   - AI 분석 버튼 + 결과 모달
 */

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import type { UserProgress } from '@/types';

interface AnalyticsSectionProps {
  progress: UserProgress[];
}

// 요일 이름
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 시간대 라벨
const TIME_SLOTS = [
  '새벽 (0-6시)',
  '오전 (6-12시)',
  '오후 (12-18시)',
  '저녁 (18-24시)',
];

export function AnalyticsSection({ progress }: AnalyticsSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // 주간 활동 데이터 계산
  const weeklyData = useMemo(() => {
    const counts = Array(7).fill(0);

    progress.forEach((p) => {
      if (p.startedAt) {
        const date = new Date(p.startedAt);
        const dayOfWeek = date.getDay();
        counts[dayOfWeek]++;
      }
    });

    return WEEKDAYS.map((day, index) => ({
      day,
      count: counts[index],
    }));
  }, [progress]);

  // 시간대별 활동 데이터
  const timeSlotData = useMemo(() => {
    const counts = [0, 0, 0, 0]; // 새벽, 오전, 오후, 저녁

    progress.forEach((p) => {
      if (p.startedAt) {
        const hour = new Date(p.startedAt).getHours();
        if (hour < 6) counts[0]++;
        else if (hour < 12) counts[1]++;
        else if (hour < 18) counts[2]++;
        else counts[3]++;
      }
    });

    return TIME_SLOTS.map((slot, index) => ({
      slot,
      count: counts[index],
    }));
  }, [progress]);

  // 1년 달력 데이터 (최근 365일)
  const calendarData = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // 날짜별 학습 횟수
    const countByDate: Record<string, number> = {};

    progress.forEach((p) => {
      if (p.startedAt) {
        const dateStr = new Date(p.startedAt).toISOString().split('T')[0];
        countByDate[dateStr] = (countByDate[dateStr] || 0) + 1;
      }
    });

    // 365일 배열 생성
    const days: { date: string; count: number; month: number }[] = [];
    const current = new Date(oneYearAgo);

    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: countByDate[dateStr] || 0,
        month: current.getMonth(),
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [progress]);

  // AI 분석 실행
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // TODO: 실제 AI API 호출
      // const result = await analyzeProgress(progress);

      // 임시 mock 데이터
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockResult = generateMockAnalysis(progress, weeklyData, timeSlotData);
      setAnalysisResult(mockResult);
      setShowResultModal(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult('분석 중 오류가 발생했습니다.');
      setShowResultModal(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 가장 활동적인 요일 찾기
  const mostActiveDay = useMemo(() => {
    const maxCount = Math.max(...weeklyData.map((d) => d.count));
    return weeklyData.find((d) => d.count === maxCount)?.day || '-';
  }, [weeklyData]);

  // 가장 활동적인 시간대 찾기
  const mostActiveTimeSlot = useMemo(() => {
    const maxCount = Math.max(...timeSlotData.map((d) => d.count));
    const index = timeSlotData.findIndex((d) => d.count === maxCount);
    return index >= 0 ? TIME_SLOTS[index] : '-';
  }, [timeSlotData]);

  return (
    <div className="bg-white rounded-xl border border-[#e5d5c7] overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-purple-50 text-purple-600 border-purple-200">
        <TrendingUp className="w-5 h-5" />
        <h2 className="font-semibold">분석 리포트</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* 1년 달력 (GitHub 잔디 스타일) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#937b5d]" />
            <h3 className="text-sm font-medium text-[#6b5a4a]">학습 기록 (최근 1년)</h3>
          </div>
          <div className="overflow-x-auto">
            <ContributionCalendar data={calendarData} />
          </div>
        </div>

        {/* 주간 활동 + 시간대별 패턴 (2열) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 주간 활동 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#937b5d]" />
              <h3 className="text-sm font-medium text-[#6b5a4a]">요일별 학습</h3>
              <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded">
                {mostActiveDay}요일 가장 활발
              </span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value}개 레슨`, '학습']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? '#a08060' : '#e5d5c7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 시간대별 패턴 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#937b5d]" />
              <h3 className="text-sm font-medium text-[#6b5a4a]">시간대별 학습</h3>
              <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded">
                {mostActiveTimeSlot} 선호
              </span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSlotData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis dataKey="slot" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    formatter={(value: number) => [`${value}개 레슨`, '학습']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {timeSlotData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? '#8b5cf6' : '#e5d5c7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI 분석 버튼 영역 */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#e5d5c7]">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI 분석하기
              </>
            )}
          </button>

          {analysisResult && (
            <button
              onClick={() => setShowResultModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-purple-300 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              분석 결과 보기
            </button>
          )}
        </div>
      </div>

      {/* 분석 결과 모달 */}
      {showResultModal && (
        <AnalysisResultModal
          result={analysisResult}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
}

// 1년 달력 컴포넌트 (GitHub 잔디 스타일)
function ContributionCalendar({
  data,
}: {
  data: { date: string; count: number; month: number }[];
}) {
  // 52주 + 나머지 일수 계산
  const weeks: typeof data[] = [];
  let currentWeek: typeof data = [];

  // 첫 날의 요일로 시작 위치 조정
  const firstDayOfWeek = new Date(data[0]?.date).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', count: -1, month: -1 }); // 빈 셀
  }

  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // 월 라벨
  const monthLabels: { month: number; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week.find((d) => d.month >= 0);
    if (firstDay && firstDay.month !== lastMonth) {
      monthLabels.push({ month: firstDay.month, weekIndex });
      lastMonth = firstDay.month;
    }
  });

  const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <div className="inline-block">
      {/* 월 라벨 */}
      <div className="flex text-xs text-[#937b5d] mb-1" style={{ marginLeft: 20 }}>
        {monthLabels.map(({ month, weekIndex }) => (
          <span
            key={`${month}-${weekIndex}`}
            style={{ position: 'absolute', marginLeft: weekIndex * 12 }}
            className="relative"
          >
            {MONTHS[month]}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5 mt-4">
        {/* 요일 라벨 */}
        <div className="flex flex-col gap-0.5 mr-1">
          {['', '월', '', '수', '', '금', ''].map((day, i) => (
            <div key={i} className="w-3 h-3 text-[9px] text-[#937b5d] flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* 달력 셀 */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-3 h-3 rounded-sm ${getContributionColor(day.count)}`}
                title={day.date ? `${day.date}: ${day.count}개 학습` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-1 mt-2 text-xs text-[#937b5d]">
        <span>적음</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-purple-200" />
        <div className="w-3 h-3 rounded-sm bg-purple-400" />
        <div className="w-3 h-3 rounded-sm bg-purple-600" />
        <span>많음</span>
      </div>
    </div>
  );
}

// 기여도에 따른 색상 반환
function getContributionColor(count: number): string {
  if (count < 0) return 'bg-transparent'; // 빈 셀
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-purple-200';
  if (count <= 3) return 'bg-purple-400';
  return 'bg-purple-600';
}

// 분석 결과 모달
function AnalysisResultModal({
  result,
  onClose,
}: {
  result: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5d5c7]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-[#6b5a4a]">AI 분석 결과</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#937b5d]" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="prose prose-sm max-w-none text-[#6b5a4a] whitespace-pre-wrap">
            {result || '분석 결과가 없습니다.'}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-4 py-3 border-t border-[#e5d5c7] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#a08060] text-white font-medium rounded-lg hover:bg-[#8b6d4f] transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock 분석 결과 생성 (TODO: 실제 AI API로 교체)
function generateMockAnalysis(
  progress: UserProgress[],
  weeklyData: { day: string; count: number }[],
  timeSlotData: { slot: string; count: number }[]
): string {
  const totalLessons = progress.length;
  const completedLessons = progress.filter((p) => p.status === 'completed').length;

  const mostActiveDay = weeklyData.reduce((max, curr) =>
    curr.count > max.count ? curr : max
  );

  const mostActiveSlot = timeSlotData.reduce((max, curr) =>
    curr.count > max.count ? curr : max
  );

  return `📊 학습 패턴 분석 결과

📈 전체 현황
• 총 ${totalLessons}개 레슨 시작
• ${completedLessons}개 완료 (완료율: ${totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%)

📅 학습 패턴
• 가장 활발한 요일: ${mostActiveDay.day}요일 (${mostActiveDay.count}개 레슨)
• 선호하는 시간대: ${mostActiveSlot.slot} (${mostActiveSlot.count}개 레슨)

💡 맞춤 추천
${mostActiveSlot.slot.includes('저녁')
  ? '• 저녁 시간에 집중력이 높으신 것 같아요. 이 시간을 활용해 어려운 개념을 학습해보세요.'
  : mostActiveSlot.slot.includes('오전')
  ? '• 오전에 학습하시는 습관이 좋습니다! 두뇌가 가장 활발한 시간이에요.'
  : mostActiveSlot.slot.includes('오후')
  ? '• 오후 시간대에 학습하시네요. 점심 후 졸릴 수 있으니 가벼운 복습부터 시작해보세요.'
  : '• 새벽 학습자시군요! 집중이 잘 되지만, 충분한 수면도 중요해요.'}

${completedLessons < totalLessons
  ? `• 아직 완료하지 않은 ${totalLessons - completedLessons}개의 레슨이 있어요. 꾸준히 진행해보세요!`
  : '• 모든 레슨을 완료하셨네요! 다음 챕터로 넘어가보세요.'}

🎯 다음 목표
• 이번 주 목표: ${Math.min(completedLessons + 3, totalLessons + 5)}개 레슨 완료하기
• 취약 개념 복습 권장`;
}
