/**
 * Streak Service
 * 연속 학습일(스트릭) 추적 및 관리
 *
 * WHY: Duolingo 연구 - 7일 스트릭 도달 시 유지율 2.4배 증가
 *
 * ## API 응답 계약 (계산값 vs 저장값)
 *
 * DB `user_streaks.current_streak`는 마지막 updateStreak() 호출 시점의 값을 유지한다.
 * 스트릭이 끊겨도 DB 값은 즉시 0으로 바뀌지 않는다.
 *
 * API 응답(`checkStreakStatus`)은 현재 시점 기준으로 계산한 "유효 스트릭"을 반환한다:
 * - lastActiveAt이 오늘 → DB 값 그대로
 * - lastActiveAt이 어제 → DB 값 그대로 (streakAtRisk: true)
 * - lastActiveAt이 그 이전 → currentStreak: 0 (DB에는 아직 이전 값 유지)
 *
 * DB 값이 실제로 리셋되는 시점: 다음 레슨 완료 시 updateStreak()에서 1로 초기화.
 * 이 지연은 의도적 설계 — 불필요한 DB write를 방지하고, 유저가 돌아오면 자연스럽게 리셋된다.
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
// Date Utilities (KST 기준)
// =============================================

/**
 * KST (UTC+9) 기준 날짜 (시간 제외)
 *
 * WHY: UTC 기준이면 한국 사용자의 "하루" 경계가 오전 9시가 됨.
 * 자정 기준으로 스트릭을 계산하려면 KST 기준이어야 함.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getKstDateOnly(date: Date = new Date()): Date {
  const kstTime = new Date(date.getTime() + KST_OFFSET_MS);
  return new Date(Date.UTC(kstTime.getUTCFullYear(), kstTime.getUTCMonth(), kstTime.getUTCDate()));
}

/**
 * 두 날짜 간 일수 차이 (KST 기준)
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const kst1 = getKstDateOnly(date1);
  const kst2 = getKstDateOnly(date2);
  const diffTime = Math.abs(kst2.getTime() - kst1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 날짜가 어제인지 확인 (KST 기준)
 */
function isYesterday(date: Date): boolean {
  return getDaysDifference(date, new Date()) === 1;
}

/**
 * 날짜가 오늘인지 확인 (KST 기준)
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
 *
 * 반환하는 currentStreak는 DB 저장값이 아닌 현재 시점 기준 계산값이다.
 * 스트릭이 끊긴 경우 0을 반환하지만, DB의 current_streak 컬럼은 변경하지 않는다.
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
 *
 * WHY Transaction: Race condition 방지
 * - 동시에 여러 레슨 완료 시 Lost Update 문제 해결
 * - Serializable isolation으로 일관성 보장
 */
export async function updateStreak(userId: string) {
  const today = getKstDateOnly();

  // Transaction으로 원자적 처리
  return prisma.$transaction(async (tx: any) => {
    // 1. 기존 스트릭 조회 (트랜잭션 내에서)
    const streak = await tx.userStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      // 첫 완료 → 스트릭 1로 시작
      return tx.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveAt: today,
        },
      });
    }

    const lastActive = streak.lastActiveAt;

    // 같은 날 중복 완료 → 스트릭 유지 (변경 없이 반환)
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

    // 2. 업데이트 (같은 트랜잭션 내에서)
    return tx.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActiveAt: today,
      },
    });
  }, {
    // 격리 수준: Serializable (가장 강력한 일관성)
    isolationLevel: 'Serializable',
  });
}

