/**
 * Streak Service
 * 연속 학습일(스트릭) 추적 및 관리
 *
 * WHY: Duolingo 연구 - 7일 스트릭 도달 시 유지율 2.4배 증가
 * TRADEOFF: UTC 기준 날짜 계산 (시간대 무관 일관성)
 */

import { prisma } from '../../config/database';

// =============================================
// Types
// =============================================

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: Date | null;
  isActiveToday: boolean; // 오늘 학습 완료 여부
  streakAtRisk: boolean; // 오늘 학습 안 했으면 true
}

// =============================================
// Date Utilities
// =============================================

/**
 * UTC 기준 오늘 날짜 (시간 제외)
 */
function getUtcDateOnly(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * 두 날짜 간 일수 차이 (UTC 기준)
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const utc1 = getUtcDateOnly(date1);
  const utc2 = getUtcDateOnly(date2);
  const diffTime = Math.abs(utc2.getTime() - utc1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 날짜가 어제인지 확인
 */
function isYesterday(date: Date): boolean {
  return getDaysDifference(date, new Date()) === 1;
}

/**
 * 날짜가 오늘인지 확인
 */
function isToday(date: Date): boolean {
  return getDaysDifference(date, new Date()) === 0;
}

// =============================================
// Core Service Functions
// =============================================

/**
 * 사용자 스트릭 조회
 */
export async function getStreak(userId: string) {
  return prisma.userStreak.findUnique({
    where: { userId },
  });
}

/**
 * 스트릭 상태 확인 (UI 표시용)
 */
export async function checkStreakStatus(userId: string): Promise<StreakStatus> {
  const streak = await getStreak(userId);

  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveAt: null,
      isActiveToday: false,
      streakAtRisk: false, // 아직 스트릭 없으면 리스크 없음
    };
  }

  const lastActive = streak.lastActiveAt;
  const isActiveToday = lastActive ? isToday(lastActive) : false;

  // 스트릭 계산: 마지막 활동이 오늘이 아니고, 어제도 아니면 이미 끊긴 것
  let currentStreak = streak.currentStreak;
  if (lastActive && !isActiveToday && !isYesterday(lastActive)) {
    // 스트릭이 끊긴 상태 (아직 DB에는 반영 안 됨, 다음 완료 시 리셋)
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveAt: streak.lastActiveAt,
    isActiveToday,
    streakAtRisk: !isActiveToday && currentStreak > 0, // 오늘 학습 안 했고 스트릭 있으면 위험
  };
}

/**
 * 스트릭 업데이트 (레슨 완료 시 호출)
 *
 * 로직:
 * 1. 같은 날 → 스트릭 유지 (중복 방지)
 * 2. 어제 → 스트릭 +1
 * 3. 그 이전 → 스트릭 리셋 (1로)
 */
export async function updateStreak(userId: string) {
  const today = getUtcDateOnly();
  const streak = await getStreak(userId);

  if (!streak) {
    // 첫 완료 → 스트릭 1로 시작
    return prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveAt: today,
      },
    });
  }

  const lastActive = streak.lastActiveAt;

  // 같은 날 중복 완료 → 스트릭 유지
  if (lastActive && isToday(lastActive)) {
    return streak;
  }

  let newCurrentStreak: number;

  if (lastActive && isYesterday(lastActive)) {
    // 어제 활동 → 스트릭 +1
    newCurrentStreak = streak.currentStreak + 1;
  } else {
    // 그 이전 또는 첫 활동 → 스트릭 리셋 (1로)
    newCurrentStreak = 1;
  }

  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

  return prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveAt: today,
    },
  });
}

/**
 * 스트릭 리셋 (관리자용)
 */
export async function resetStreak(userId: string) {
  const streak = await getStreak(userId);

  if (!streak) {
    return null;
  }

  return prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: 0,
      lastActiveAt: null,
    },
  });
}
