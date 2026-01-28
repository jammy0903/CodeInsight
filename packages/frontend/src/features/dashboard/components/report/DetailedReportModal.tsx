/**
 * DetailedReportModal - Full analytics report modal with PDF export
 */

import { X, Download, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import type { AnalyticsSummary } from '@/services/analytics';
import type { UserProgress } from '@/types';
import { usePdfExport } from '../../hooks/usePdfExport';

import { ReportHeader } from './ReportHeader';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportCalendar } from './ReportCalendar';
import { ReportCharts } from './ReportCharts';
import { ReportWeakConcepts } from './ReportWeakConcepts';
import { ReportWrongAnswers } from './ReportWrongAnswers';
import { ReportTrend } from './ReportTrend';
import { ReportRecommendations } from './ReportRecommendations';
import { ReportAIAnalysis } from './ReportAIAnalysis';

interface DetailedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyticsData: AnalyticsSummary | null;
  progress: UserProgress[];
  period?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TIME_SLOTS = [
  '새벽 (0-6시)',
  '오전 (6-12시)',
  '오후 (12-18시)',
  '저녁 (18-24시)',
];

export function DetailedReportModal({
  isOpen,
  onClose,
  analyticsData,
  progress,
  period = '1y',
}: DetailedReportModalProps) {
  const { reportRef, isExporting, handleExport } = usePdfExport();

  // Calculate weekly data
  const weeklyData = useMemo(() => {
    if (analyticsData?.weekdayActivity) {
      return WEEKDAYS.map((day, index) => ({
        day,
        count: Math.round((analyticsData.weekdayActivity[index] || 0) / 60),
        unit: '분',
      }));
    }

    const counts = Array(7).fill(0);
    progress.forEach((p) => {
      if (p.startedAt) {
        const date = new Date(p.startedAt);
        counts[date.getDay()]++;
      }
    });

    return WEEKDAYS.map((day, index) => ({
      day,
      count: counts[index],
      unit: '레슨',
    }));
  }, [analyticsData, progress]);

  // Calculate time slot data
  const timeSlotData = useMemo(() => {
    if (analyticsData?.hourlyActivity) {
      const slots = [0, 0, 0, 0];
      analyticsData.hourlyActivity.forEach((seconds, hour) => {
        if (hour < 6) slots[0] += seconds;
        else if (hour < 12) slots[1] += seconds;
        else if (hour < 18) slots[2] += seconds;
        else slots[3] += seconds;
      });

      return TIME_SLOTS.map((slot, index) => ({
        slot,
        count: Math.round(slots[index] / 60),
        unit: '분',
      }));
    }

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

  // Calculate calendar data
  const calendarData = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    let countByDate: Record<string, number> = {};

    if (analyticsData?.dailyActivity) {
      Object.entries(analyticsData.dailyActivity).forEach(([date, seconds]) => {
        countByDate[date] = Math.ceil(seconds / 60);
      });
    } else {
      progress.forEach((p) => {
        if (p.startedAt) {
          const dateStr = new Date(p.startedAt).toISOString().split('T')[0];
          countByDate[dateStr] = (countByDate[dateStr] || 0) + 1;
        }
      });
    }

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

  // Find most active day/slot
  const mostActiveDay = useMemo(() => {
    const maxCount = Math.max(...weeklyData.map((d) => d.count));
    return weeklyData.find((d) => d.count === maxCount)?.day || '-';
  }, [weeklyData]);

  const mostActiveTimeSlot = useMemo(() => {
    const maxCount = Math.max(...timeSlotData.map((d) => d.count));
    const index = timeSlotData.findIndex((d) => d.count === maxCount);
    return index >= 0 ? TIME_SLOTS[index] : '-';
  }, [timeSlotData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-dashboard-card-border)]">
          <h2 className="text-xl font-semibold text-[var(--theme-dashboard-title)]">
            상세 분석 리포트
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PDF 생성 중...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  PDF 다운로드
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[var(--theme-dashboard-text-muted)] hover:text-[var(--theme-dashboard-title)] hover:bg-[var(--theme-dashboard-section-header-bg)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report content (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {/*
            PDF Export Area
            NOTE: Using inline styles with RGB colors because html2pdf.js
            doesn't support oklch() color function (Tailwind v4 default)
          */}
          <div
            ref={reportRef}
            className="pdf-export-area p-8"
            style={{
              minHeight: '100%',
              backgroundColor: '#ffffff',
              color: '#111827',
            }}
          >
            <ReportHeader period={period} />
            <ReportSummaryCards data={analyticsData} />

            {/* AI Analysis - personalized feedback */}
            {analyticsData && <ReportAIAnalysis data={analyticsData} />}

            <ReportCalendar data={calendarData} />
            <ReportCharts weeklyData={weeklyData} timeSlotData={timeSlotData} />

            {analyticsData && (
              <>
                <ReportWeakConcepts concepts={analyticsData.weakConcepts} />
                <ReportWrongAnswers answers={analyticsData.recentWrongAnswers} />
                <ReportTrend dailyActivity={analyticsData.dailyActivity} />
                <ReportRecommendations
                  data={analyticsData}
                  mostActiveDay={mostActiveDay}
                  mostActiveTimeSlot={mostActiveTimeSlot}
                />
              </>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-[var(--theme-dashboard-card-border)] text-center text-sm text-[var(--theme-dashboard-text-muted)]">
              <p>CodeInsight - 코드 실행 원리 학습 플랫폼</p>
              <p className="mt-1">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} 생성
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
