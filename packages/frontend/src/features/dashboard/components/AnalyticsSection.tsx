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

import { useState, useMemo, useEffect } from 'react';
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
  Brain,
  Target,
  BarChart3,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { getAnalyticsSummary, type AnalyticsSummary } from '@/services/analytics';
import type { UserProgress } from '@/types';
import { DetailedReportModal } from './report';

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
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // 테마 적용
  const currentTheme = useThemeStore((s) => s.theme);

  // 분석 데이터 로드
  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setIsLoadingAnalytics(true);
      try {
        const data = await getAnalyticsSummary('1y');
        if (!cancelled) {
          setAnalyticsData(data);
        }
      } catch (err) {
        // 에러 발생 시 null로 설정 (fallback 데이터 사용)
        console.error('Analytics fetch error:', err);
        if (!cancelled) {
          setAnalyticsData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAnalytics(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  // 주간 활동 데이터 계산 (API 데이터 우선, 없으면 progress 기반)
  const weeklyData = useMemo(() => {
    if (analyticsData?.weekdayActivity) {
      // API 데이터: 초 단위 → 분 단위로 표시
      return WEEKDAYS.map((day, index) => ({
        day,
        count: Math.round((analyticsData.weekdayActivity[index] || 0) / 60),
        unit: '분',
      }));
    }

    // Fallback: progress 기반
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
      unit: '레슨',
    }));
  }, [analyticsData, progress]);

  // 시간대별 활동 데이터 (API 데이터 우선)
  const timeSlotData = useMemo(() => {
    if (analyticsData?.hourlyActivity) {
      // API 데이터: 시간대별 초 → 4개 슬롯으로 집계
      const slots = [0, 0, 0, 0];
      analyticsData.hourlyActivity.forEach((seconds, hour) => {
        if (hour < 6) slots[0] += seconds;
        else if (hour < 12) slots[1] += seconds;
        else if (hour < 18) slots[2] += seconds;
        else slots[3] += seconds;
      });

      return TIME_SLOTS.map((slot, index) => ({
        slot,
        count: Math.round(slots[index] / 60), // 분 단위
        unit: '분',
      }));
    }

    // Fallback: progress 기반
    const counts = [0, 0, 0, 0];
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
      unit: '레슨',
    }));
  }, [analyticsData, progress]);

  // 1년 달력 데이터 (API 데이터 우선)
  const calendarData = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // 날짜별 학습 시간 (API 또는 progress)
    let countByDate: Record<string, number> = {};

    if (analyticsData?.dailyActivity) {
      // API 데이터: 초 단위 → 분 단위로 변환
      Object.entries(analyticsData.dailyActivity).forEach(([date, seconds]) => {
        countByDate[date] = Math.ceil(seconds / 60);
      });
    } else {
      // Fallback: progress 기반
      progress.forEach((p) => {
        if (p.startedAt) {
          const dateStr = new Date(p.startedAt).toISOString().split('T')[0];
          countByDate[dateStr] = (countByDate[dateStr] || 0) + 1;
        }
      });
    }

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
  }, [analyticsData, progress]);

  // AI 분석 실행
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // TODO: 실제 AI API 호출로 교체 가능
      // const result = await analyzeProgress(analyticsData);

      // 임시 지연 (AI 분석 시뮬레이션)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = generateAnalysis(analyticsData, progress, weeklyData, timeSlotData);
      setAnalysisResult(result);
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

  // 테마별 색상 (각 테마별로 다른 색상 조합 사용)
  const sectionColors = {
    dark: {
      headerBg: '#18181b',       // zinc-900
      headerText: '#22d3ee',     // cyan-400
      headerBorder: '#27272a',   // zinc-800
      badgeBg: '#27272a',        // zinc-800
      badgeText: '#a1a1aa',      // zinc-400
    },
    soft: {
      headerBg: '#fdf2f8',       // 라벤더-핑크
      headerText: '#be185d',     // 로즈
      headerBorder: '#f9a8d4',
      badgeBg: '#fce7f3',
      badgeText: '#9d174d',
    },
    minimal: {
      headerBg: '#fef3c7',       // 앰버-베이지
      headerText: '#b45309',     // 브라운-앰버
      headerBorder: '#fcd34d',
      badgeBg: '#fef9c3',
      badgeText: '#92400e',
    },
  };
  const colors = sectionColors[currentTheme];
  const sectionHeaderBg = colors.headerBg;
  const sectionHeaderText = colors.headerText;
  const sectionHeaderBorder = colors.headerBorder;
  const barActiveColor = 'var(--theme-dashboard-accent)';
  const barInactiveColor = 'var(--theme-dashboard-progress-bg)';
  const badgeBg = colors.badgeBg;
  const badgeText = colors.badgeText;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--theme-dashboard-card-bg)', border: '1px solid var(--theme-dashboard-card-border)' }}>
      {/* 섹션 헤더 - 반응형 */}
      <div
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3"
        style={{ backgroundColor: sectionHeaderBg, color: sectionHeaderText, borderBottom: `1px solid ${sectionHeaderBorder}` }}
      >
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
        <h2 className="text-sm sm:text-base font-semibold">분석 리포트</h2>
      </div>

      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* 퀴즈 성과 & 학습 시간 요약 (API 데이터가 있을 때만) - 반응형 */}
        {analyticsData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-lg p-2 sm:p-3" style={{ backgroundColor: 'var(--theme-dashboard-stat-card-bg)' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: sectionHeaderText }} />
                <span className="text-[10px] sm:text-xs" style={{ color: 'var(--theme-dashboard-text-muted)' }}>총 학습 시간</span>
              </div>
              <p className="text-sm sm:text-lg font-semibold" style={{ color: 'var(--theme-dashboard-text)' }}>
                {Math.floor(analyticsData.totalStudyTime / 3600)}시간 {Math.floor((analyticsData.totalStudyTime % 3600) / 60)}분
              </p>
            </div>
            <div className="rounded-lg p-2 sm:p-3" style={{ backgroundColor: 'var(--theme-dashboard-stat-card-bg)' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: sectionHeaderText }} />
                <span className="text-[10px] sm:text-xs" style={{ color: 'var(--theme-dashboard-text-muted)' }}>퀴즈 정답률</span>
              </div>
              <p className="text-sm sm:text-lg font-semibold" style={{ color: 'var(--theme-dashboard-text)' }}>
                {analyticsData.quizStats.accuracy}%
              </p>
            </div>
            <div className="rounded-lg p-2 sm:p-3" style={{ backgroundColor: 'var(--theme-dashboard-stat-card-bg)' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Brain className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: sectionHeaderText }} />
                <span className="text-[10px] sm:text-xs" style={{ color: 'var(--theme-dashboard-text-muted)' }}>AI 질문</span>
              </div>
              <p className="text-sm sm:text-lg font-semibold" style={{ color: 'var(--theme-dashboard-text)' }}>
                {analyticsData.aiQuestions}회
              </p>
            </div>
            <div className="rounded-lg p-2 sm:p-3" style={{ backgroundColor: 'var(--theme-dashboard-stat-card-bg)' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: sectionHeaderText }} />
                <span className="text-[10px] sm:text-xs" style={{ color: 'var(--theme-dashboard-text-muted)' }}>학습 세션</span>
              </div>
              <p className="text-sm sm:text-lg font-semibold" style={{ color: 'var(--theme-dashboard-text)' }}>
                {analyticsData.totalSessions}회
              </p>
            </div>
          </div>
        )}

        {/* 로딩 중 표시 - 반응형 */}
        {isLoadingAnalytics && (
          <div className="flex items-center justify-center py-3 sm:py-4 gap-1.5 sm:gap-2" style={{ color: 'var(--theme-dashboard-text-muted)' }}>
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            <span className="text-xs sm:text-sm">분석 데이터 로딩 중...</span>
          </div>
        )}

        {/* 1년 달력 (GitHub 잔디 스타일) - 반응형 */}
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--theme-dashboard-text-muted)' }} />
            <h3 className="text-xs sm:text-sm font-medium" style={{ color: 'var(--theme-dashboard-text)' }}>학습 기록 (최근 1년)</h3>
          </div>
          <div className="overflow-x-auto">
            <ContributionCalendar data={calendarData} />
          </div>
        </div>

        {/* 주간 활동 + 시간대별 패턴 (2열) - 반응형 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 주간 활동 */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--theme-dashboard-text-muted)' }} />
              <h3 className="text-xs sm:text-sm font-medium" style={{ color: 'var(--theme-dashboard-text)' }}>요일별 학습</h3>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded" style={{ backgroundColor: badgeBg, color: badgeText }}>
                {mostActiveDay}요일 가장 활발
              </span>
            </div>
            <div className="h-32 sm:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--theme-dashboard-text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--theme-dashboard-text-muted)' }} allowDecimals={false} width={25} />
                  <Tooltip
                    formatter={(value: number, _name, props) => {
                      const unit = (props.payload as typeof weeklyData[0])?.unit || '분';
                      return [`${value}${unit}`, '학습'];
                    }}
                    contentStyle={{ fontSize: 11, backgroundColor: 'var(--theme-dashboard-card-bg)', border: `1px solid ${'var(--theme-dashboard-card-border)'}` }}
                    labelStyle={{ color: 'var(--theme-dashboard-text)' }}
                    itemStyle={{ color: 'var(--theme-dashboard-text)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? barActiveColor : barInactiveColor}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 시간대별 패턴 */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--theme-dashboard-text-muted)' }} />
              <h3 className="text-xs sm:text-sm font-medium" style={{ color: 'var(--theme-dashboard-text)' }}>시간대별 학습</h3>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded" style={{ backgroundColor: badgeBg, color: badgeText }}>
                {mostActiveTimeSlot} 선호
              </span>
            </div>
            <div className="h-32 sm:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSlotData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--theme-dashboard-text-muted)' }} allowDecimals={false} />
                  <YAxis dataKey="slot" type="category" tick={{ fontSize: 9, fill: 'var(--theme-dashboard-text-muted)' }} width={65} />
                  <Tooltip
                    formatter={(value: number, _name, props) => {
                      const unit = (props.payload as typeof timeSlotData[0])?.unit || '분';
                      return [`${value}${unit}`, '학습'];
                    }}
                    contentStyle={{ fontSize: 11, backgroundColor: 'var(--theme-dashboard-card-bg)', border: `1px solid ${'var(--theme-dashboard-card-border)'}` }}
                    labelStyle={{ color: 'var(--theme-dashboard-text)' }}
                    itemStyle={{ color: 'var(--theme-dashboard-text)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {timeSlotData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? sectionHeaderText : barInactiveColor}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI 분석 버튼 영역 - 반응형 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 sm:pt-4" style={{ borderTop: `1px solid ${'var(--theme-dashboard-card-border)'}` }}>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--theme-dashboard-accent)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-dashboard-accent-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-dashboard-accent)'}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden sm:inline">AI 분석 중...</span>
                <span className="sm:hidden">분석중</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">AI 분석하기</span>
                <span className="sm:hidden">AI 분석</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowDetailedReport(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors"
            style={{ border: `1px solid ${sectionHeaderBorder}`, color: sectionHeaderText }}
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">상세 보기</span>
            <span className="sm:hidden">상세</span>
          </button>

          {analysisResult && (
            <button
              onClick={() => setShowResultModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors"
              style={{ border: `1px solid ${sectionHeaderBorder}`, color: sectionHeaderText }}
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">분석 결과 보기</span>
              <span className="sm:hidden">결과</span>
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

      {/* 상세 분석 리포트 모달 */}
      <DetailedReportModal
        isOpen={showDetailedReport}
        onClose={() => setShowDetailedReport(false)}
        analyticsData={analyticsData}
        progress={progress}
        period="1y"
      />
    </div>
  );
}

// 1년 달력 컴포넌트 (GitHub 잔디 스타일)
function ContributionCalendar({
  data,
}: {
  data: { date: string; count: number; month: number }[];
}) {
  const currentTheme = useThemeStore((s) => s.theme);

  // 테마별 잔디 색상 (분석리포트 색상과 통일)
  const grassColors = currentTheme === 'dark'
    ? { empty: '#27272a', level1: '#155e75', level2: '#0891b2', level3: '#22d3ee' }  // zinc + cyan 계열
    : currentTheme === 'minimal'
    ? { empty: '#fef3c7', level1: '#fcd34d', level2: '#f59e0b', level3: '#b45309' }  // 앰버 계열
    : { empty: '#fce7f3', level1: '#f9a8d4', level2: '#ec4899', level3: '#be185d' }; // 핑크 계열
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

  // 기여도에 따른 색상 반환
  const getGrassColor = (count: number): string => {
    if (count < 0) return 'transparent';
    if (count === 0) return grassColors.empty;
    if (count === 1) return grassColors.level1;
    if (count <= 3) return grassColors.level2;
    return grassColors.level3;
  };

  return (
    <div className="inline-block">
      {/* 월 라벨 - 모바일에서는 숨김 (absolute 포지셔닝 문제 방지) */}
      <div className="hidden sm:flex text-xs mb-1 relative h-4" style={{ marginLeft: 20, color: 'var(--theme-dashboard-text-muted)' }}>
        {monthLabels.map(({ month, weekIndex }) => (
          <span
            key={`${month}-${weekIndex}`}
            className="absolute"
            style={{ left: weekIndex * 12 }}
          >
            {MONTHS[month]}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5 sm:mt-4">
        {/* 요일 라벨 - 모바일에서는 숨김 */}
        <div className="hidden sm:flex flex-col gap-0.5 mr-1">
          {['', '월', '', '수', '', '금', ''].map((day, i) => (
            <div key={i} className="w-3 h-3 text-[9px] flex items-center justify-center" style={{ color: 'var(--theme-dashboard-text-muted)' }}>
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
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm"
                style={{ backgroundColor: getGrassColor(day.count) }}
                title={day.date ? `${day.date}: ${day.count}개 학습` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 범례 - 반응형 */}
      <div className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs" style={{ color: 'var(--theme-dashboard-text-muted)' }}>
        <span>적음</span>
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: grassColors.empty }} />
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: grassColors.level1 }} />
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: grassColors.level2 }} />
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: grassColors.level3 }} />
        <span>많음</span>
      </div>
    </div>
  );
}

// 분석 결과 모달 - 반응형
function AnalysisResultModal({
  result,
  onClose,
}: {
  result: string | null;
  onClose: () => void;
}) {
  const currentTheme = useThemeStore((s) => s.theme);
  const iconColor = currentTheme === 'dark' ? '#c084fc' : '#a855f7';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="rounded-xl max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--theme-dashboard-card-bg)' }}>
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3" style={{ borderBottom: `1px solid ${'var(--theme-dashboard-card-border)'}` }}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: iconColor }} />
            <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--theme-dashboard-text)' }}>AI 분석 결과</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--theme-dashboard-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-dashboard-stat-card-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-3 sm:p-4 overflow-y-auto max-h-[65vh] sm:max-h-[60vh]">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-xs sm:text-sm" style={{ color: 'var(--theme-dashboard-text)' }}>
            {result || '분석 결과가 없습니다.'}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex justify-end" style={{ borderTop: `1px solid ${'var(--theme-dashboard-card-border)'}` }}>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white font-medium rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--theme-dashboard-accent)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-dashboard-accent-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-dashboard-accent)'}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// 분석 결과 생성 (API 데이터 우선)
function generateAnalysis(
  analyticsData: AnalyticsSummary | null,
  progress: UserProgress[],
  weeklyData: { day: string; count: number; unit?: string }[],
  timeSlotData: { slot: string; count: number; unit?: string }[]
): string {
  const mostActiveDay = weeklyData.reduce((max, curr) =>
    curr.count > max.count ? curr : max
  );
  const mostActiveSlot = timeSlotData.reduce((max, curr) =>
    curr.count > max.count ? curr : max
  );
  const unit = weeklyData[0]?.unit || '분';

  // API 데이터가 있는 경우: 상세 분석
  if (analyticsData) {
    const { totalStudyTime, totalSessions, quizStats, aiQuestions, weakConcepts } = analyticsData;
    const studyHours = Math.floor(totalStudyTime / 3600);
    const studyMinutes = Math.floor((totalStudyTime % 3600) / 60);

    const weakConceptsList = Object.entries(weakConcepts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([concept, count]) => `  - ${concept}: ${count}회 오답`)
      .join('\n');

    return `📊 학습 패턴 분석 결과 (실제 데이터 기반)

📈 전체 현황
• 총 학습 시간: ${studyHours}시간 ${studyMinutes}분
• 학습 세션: ${totalSessions}회
• AI 질문 횟수: ${aiQuestions}회

📝 퀴즈 성과
• 총 ${quizStats.total}문제 풀이
• 정답률: ${quizStats.accuracy}% (${quizStats.correct}개 정답 / ${quizStats.wrong}개 오답)
${quizStats.accuracy >= 80
  ? '• 🎉 훌륭한 정답률이에요! 개념을 잘 이해하고 계십니다.'
  : quizStats.accuracy >= 60
  ? '• 💪 좋은 진행이에요! 틀린 문제를 복습하면 더 좋아질 거예요.'
  : '• 📚 복습이 필요해요. 틀린 개념을 다시 확인해보세요.'}

📅 학습 패턴
• 가장 활발한 요일: ${mostActiveDay.day}요일 (${mostActiveDay.count}${unit})
• 선호하는 시간대: ${mostActiveSlot.slot} (${mostActiveSlot.count}${unit})

${weakConceptsList ? `🎯 취약 개념 (오답 기준)\n${weakConceptsList}\n` : ''}
💡 맞춤 추천
${mostActiveSlot.slot.includes('저녁')
  ? '• 저녁 시간에 집중력이 높으신 것 같아요. 이 시간을 활용해 어려운 개념을 학습해보세요.'
  : mostActiveSlot.slot.includes('오전')
  ? '• 오전에 학습하시는 습관이 좋습니다! 두뇌가 가장 활발한 시간이에요.'
  : mostActiveSlot.slot.includes('오후')
  ? '• 오후 시간대에 학습하시네요. 점심 후 졸릴 수 있으니 가벼운 복습부터 시작해보세요.'
  : '• 새벽 학습자시군요! 집중이 잘 되지만, 충분한 수면도 중요해요.'}

🚀 다음 단계 제안
${quizStats.wrong > 0
  ? '• 최근 틀린 퀴즈 다시 풀어보기'
  : '• 새로운 챕터 시작하기'}
• ${mostActiveDay.day}요일에 집중 학습 시간 확보하기`;
  }

  // Fallback: progress 기반 분석 (비로그인 또는 API 실패)
  const totalLessons = progress.length;
  const completedLessons = progress.filter((p) => p.status === 'completed').length;

  return `📊 학습 패턴 분석 결과

📈 전체 현황
• 총 ${totalLessons}개 레슨 시작
• ${completedLessons}개 완료 (완료율: ${totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%)

📅 학습 패턴
• 가장 활발한 요일: ${mostActiveDay.day}요일 (${mostActiveDay.count}${unit})
• 선호하는 시간대: ${mostActiveSlot.slot} (${mostActiveSlot.count}${unit})

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

💡 더 자세한 분석을 원하시면 로그인해주세요!`;
}
