/**
 * AnalyticsSection - 분석 리포트 섹션 (오케스트레이터)
 *
 * 훅으로 데이터 계산, 서브컴포넌트로 렌더링 위임
 */

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, Calendar, Clock, Sparkles, FileText, Loader2, Brain, Target, BarChart3,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import type { UserProgress } from '@/types';
import { DetailedReportModal } from '../report';

import { useAnalyticsData } from './hooks/useAnalyticsData';
import { getAnalyticsColors, type ThemeKey } from './utils/analyticsColors';
import { generateAnalysis } from './utils/generateAnalysis';
import { ContributionCalendar } from './ContributionCalendar';
import { AnalysisResultModal } from './AnalysisResultModal';
import { useTranslation } from 'react-i18next';

interface AnalyticsSectionProps {
  progress: UserProgress[];
}

export function AnalyticsSection({ progress }: AnalyticsSectionProps) {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const currentTheme = useThemeStore((s) => s.theme);
  const colors = getAnalyticsColors(currentTheme as ThemeKey);

  const {
    analyticsData,
    isLoadingAnalytics,
    weeklyData,
    timeSlotData,
    calendarData,
    mostActiveDay,
    mostActiveTimeSlot,
  } = useAnalyticsData(progress);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
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

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--theme-dashboard-card-bg)', border: '1px solid var(--theme-dashboard-card-border)' }}>
      {/* 섹션 헤더 */}
      <div
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3"
        style={{ backgroundColor: colors.headerBg, color: colors.headerText, borderBottom: `1px solid ${colors.headerBorder}` }}
      >
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
        <h2 className="text-sm sm:text-base font-semibold">{t("dashboard.txt_f84855")}</h2>
      </div>

      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* 요약 카드 (API 데이터가 있을 때만) */}
        {analyticsData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={Clock} label={t("dashboard.txt_33d19b")} color={colors.headerText}>
              {Math.floor(analyticsData.totalStudyTime / 3600)}시간 {Math.floor((analyticsData.totalStudyTime % 3600) / 60)}분
            </StatCard>
            <StatCard icon={Target} label={t("dashboard.txt_0e22eb")} color={colors.headerText}>
              {analyticsData.quizStats.accuracy}%
            </StatCard>
            <StatCard icon={Brain} label={t("dashboard.txt_c9dbb8")} color={colors.headerText}>
              {analyticsData.aiQuestions}회
            </StatCard>
            <StatCard icon={Calendar} label={t("dashboard.txt_c7a7f8")} color={colors.headerText}>
              {analyticsData.totalSessions}회
            </StatCard>
          </div>
        )}

        {/* 로딩 */}
        {isLoadingAnalytics && (
          <div className="flex items-center justify-center py-3 sm:py-4 gap-1.5 sm:gap-2" style={{ color: 'var(--theme-dashboard-text-muted)' }}>
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            <span className="text-xs sm:text-sm">{t("dashboard.txt_891ddf")}</span>
          </div>
        )}

        {/* 1년 달력 */}
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--theme-dashboard-text-muted)' }} />
            <h3 className="text-xs sm:text-sm font-medium" style={{ color: 'var(--theme-dashboard-text)' }}>{t("dashboard.txt_328c88")}</h3>
          </div>
          <div className="overflow-x-auto">
            <ContributionCalendar data={calendarData} />
          </div>
        </div>

        {/* 주간 활동 + 시간대별 패턴 (2열) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 주간 활동 */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: 'var(--theme-dashboard-text-muted)' }} />
              <h3 className="text-xs sm:text-sm font-medium" style={{ color: 'var(--theme-dashboard-text)' }}>{t("dashboard.txt_e58122")}</h3>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded" style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}>
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
                      <Cell key={`cell-${index}`} fill={entry.count > 0 ? colors.barActiveColor : colors.barInactiveColor} />
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
              <h3 className="text-xs sm:text-sm font-medium" style={{ color: 'var(--theme-dashboard-text)' }}>{t("dashboard.txt_e7312d")}</h3>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded" style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}>
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
                      <Cell key={`cell-${index}`} fill={entry.count > 0 ? colors.headerText : colors.barInactiveColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI 분석 버튼 영역 */}
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
              <><Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /><span className="hidden sm:inline">AI 분석 중...</span><span className="sm:hidden">{t("dashboard.txt_2d2670")}</span></>
            ) : (
              <><Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:inline">AI 분석하기</span><span className="sm:hidden">AI 분석</span></>
            )}
          </button>

          <button
            onClick={() => setShowDetailedReport(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors"
            style={{ border: `1px solid ${colors.headerBorder}`, color: colors.headerText }}
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t("dashboard.txt_51d43f")}</span><span className="sm:hidden">{t("dashboard.txt_b70e98")}</span>
          </button>

          {analysisResult && (
            <button
              onClick={() => setShowResultModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors"
              style={{ border: `1px solid ${colors.headerBorder}`, color: colors.headerText }}
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t("dashboard.txt_fd8c1e")}</span><span className="sm:hidden">{t("admin.col_result")}</span>
            </button>
          )}
        </div>
      </div>

      {/* 모달들 */}
      {showResultModal && (
        <AnalysisResultModal result={analysisResult} onClose={() => setShowResultModal(false)} />
      )}
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

// --- 내부 헬퍼 컴포넌트 ---

function StatCard({
  icon: Icon,
  label,
  color,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg p-2 sm:p-3" style={{ backgroundColor: 'var(--theme-dashboard-stat-card-bg)' }}>
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color }} />
        <span className="text-[10px] sm:text-xs" style={{ color: 'var(--theme-dashboard-text-muted)' }}>{label}</span>
      </div>
      <p className="text-sm sm:text-lg font-semibold" style={{ color: 'var(--theme-dashboard-text)' }}>
        {children}
      </p>
    </div>
  );
}
