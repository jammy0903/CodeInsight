/**
 * useAnalyticsData - 분석 데이터 패칭 + 변환 훅
 *
 * API 데이터 우선, 없으면 progress 기반 fallback
 */

import { useState, useMemo, useEffect } from 'react';
import { getAnalyticsSummary, type AnalyticsSummary } from '@/services/analytics';
import type { UserProgress } from '@/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TIME_SLOTS = [
  '새벽 (0-6시)',
  '오전 (6-12시)',
  '오후 (12-18시)',
  '저녁 (18-24시)',
];

export interface ChartDataItem {
  day?: string;
  slot?: string;
  count: number;
  unit: string;
}

export interface CalendarDay {
  date: string;
  count: number;
  month: number;
}

export function useAnalyticsData(progress: UserProgress[]) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setIsLoadingAnalytics(true);
      try {
        const data = await getAnalyticsSummary('1y');
        if (!cancelled) setAnalyticsData(data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
        if (!cancelled) setAnalyticsData(null);
      } finally {
        if (!cancelled) setIsLoadingAnalytics(false);
      }
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, []);

  // 주간 활동 데이터
  const weeklyData = useMemo((): ChartDataItem[] => {
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
        counts[new Date(p.startedAt).getDay()]++;
      }
    });

    return WEEKDAYS.map((day, index) => ({
      day,
      count: counts[index],
      unit: '레슨',
    }));
  }, [analyticsData, progress]);

  // 시간대별 활동 데이터
  const timeSlotData = useMemo((): ChartDataItem[] => {
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

  // 1년 달력 데이터
  const calendarData = useMemo((): CalendarDay[] => {
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

    const days: CalendarDay[] = [];
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

  // 파생 데이터
  const mostActiveDay = useMemo(() => {
    const maxCount = Math.max(...weeklyData.map((d) => d.count));
    return weeklyData.find((d) => d.count === maxCount)?.day || '-';
  }, [weeklyData]);

  const mostActiveTimeSlot = useMemo(() => {
    const maxCount = Math.max(...timeSlotData.map((d) => d.count));
    const index = timeSlotData.findIndex((d) => d.count === maxCount);
    return index >= 0 ? TIME_SLOTS[index] : '-';
  }, [timeSlotData]);

  return {
    analyticsData,
    isLoadingAnalytics,
    weeklyData,
    timeSlotData,
    calendarData,
    mostActiveDay,
    mostActiveTimeSlot,
  };
}
