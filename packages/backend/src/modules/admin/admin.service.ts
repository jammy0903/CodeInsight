/**
 * Admin Service
 *
 * WHY: 관리자용 통계 및 시스템 데이터 제공
 * RESPONSIBILITY: DB 조회 및 계산 로직 (프론트는 표시만)
 *
 * NOTE: Prisma 사용 (raw SQL 아님)
 */

import { prisma } from '../../config/database';

export interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  languageProgress: Array<{
    languageId: string;
    languageName: string;
    progressPercentage: number;
    activeUserProgressPercentage: number;
  }>;
}

export interface OAuthAccountInfo {
  provider: string;
}

export interface UserInfo {
  nickname: string;
  role: string;
  oauthAccounts: OAuthAccountInfo[];
  createdAt: string;
  studyDays: number;
  completedLessons: number;
}

export interface SubmissionInfo {
  id: string;
  userId: string;
  problemId: string;
  verdict: string;
  createdAt: string;
}

export interface SystemStatus {
  database: 'healthy' | 'unhealthy';
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: string;
}

export class AdminService {
  /**
   * 전체 통계 조회
   */
  async getStats(): Promise<AdminStats> {
    // 전체 사용자 수
    const totalUsers = await prisma.user.count();

    // 오늘 활동한 사용자 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeUsersToday = await prisma.submission.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 언어별 진도율 계산
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const languageProgress = await Promise.all(
      languages.map(async (lang) => {
        // 해당 언어의 전체 레슨 수
        const totalLessons = await prisma.lesson.count({
          where: {
            chapter: {
              languageId: lang.id,
            },
          },
        });

        // 완료된 UserProgress 수
        const completedProgress = await prisma.userProgress.count({
          where: {
            status: 'completed',
            lesson: {
              chapter: {
                languageId: lang.id,
              },
            },
          },
        });

        // 해당 언어에 대한 전체 UserProgress 수 (레슨을 시작한 사람들)
        const totalUserProgress = await prisma.userProgress.count({
          where: {
            lesson: {
              chapter: {
                languageId: lang.id,
              },
            },
          },
        });

        // 전체 평균: 전체 사용자 수 × 레슨 수
        const totalPossibleProgress = totalUsers * totalLessons;
        const progressPercentage = totalPossibleProgress > 0
          ? Math.round((completedProgress / totalPossibleProgress) * 100)
          : 0;

        // 학습자 평균: UserProgress가 있는 사람들만
        const activeUserProgressPercentage = totalUserProgress > 0
          ? Math.round((completedProgress / totalUserProgress) * 100)
          : 0;

        // 디버그 로그
        console.log(`\n[${lang.name}] 진도율 계산:`);
        console.log(`  - 전체 사용자 수: ${totalUsers}명`);
        console.log(`  - 전체 레슨 수: ${totalLessons}개`);
        console.log(`  - 완료된 UserProgress: ${completedProgress}개`);
        console.log(`  - 전체 UserProgress: ${totalUserProgress}개`);
        console.log(`  - 전체 가능 진행: ${totalPossibleProgress}개 (${totalUsers} × ${totalLessons})`);
        console.log(`  - 전체 평균: ${completedProgress}/${totalPossibleProgress} = ${progressPercentage}%`);
        console.log(`  - 학습자 평균: ${completedProgress}/${totalUserProgress} = ${activeUserProgressPercentage}%`);

        return {
          languageId: lang.id,
          languageName: lang.name,
          progressPercentage,
          activeUserProgressPercentage,
        };
      })
    );

    return {
      totalUsers,
      activeUsersToday: activeUsersToday.length,
      languageProgress,
    };
  }

  /**
   * 사용자 목록 조회 (페이지네이션)
   */
  async getUsers(page: number = 1, limit: number = 20): Promise<{
    users: UserInfo[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // 전체 사용자 수
    const total = await prisma.user.count();

    // 사용자 목록 (OAuth 계정 + 학습 통계 포함)
    const rawUsers = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        oauthAccounts: {
          select: {
            provider: true,
          },
        },
        activities: {
          select: {
            startedAt: true,
          },
        },
        progress: {
          where: {
            status: 'completed',
          },
          select: {
            id: true,
          },
        },
      },
    });

    const users: UserInfo[] = rawUsers.map(user => {
      // 공부한 날짜 수: startedAt의 날짜만 추출하여 중복 제거
      const uniqueDates = new Set(
        user.activities.map(activity =>
          activity.startedAt.toISOString().split('T')[0]
        )
      );

      return {
        nickname: user.nickname,
        role: user.role,
        oauthAccounts: user.oauthAccounts,
        createdAt: user.createdAt.toISOString(),
        studyDays: uniqueDates.size,
        completedLessons: user.progress.length,
      };
    });

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 최근 제출 내역 조회
   */
  async getRecentSubmissions(limit: number = 50): Promise<SubmissionInfo[]> {
    const submissions = await prisma.submission.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return submissions.map(s => ({
      id: s.id,
      userId: s.userId,
      problemId: s.problemId,
      verdict: s.verdict,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  /**
   * 시스템 상태 확인
   */
  async getSystemStatus(): Promise<SystemStatus> {
    // 데이터베이스 헬스체크
    let dbStatus: 'healthy' | 'unhealthy';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // 서버 업타임 (초)
    const uptime = Math.floor(process.uptime());

    // 메모리 사용량
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;

    return {
      database: dbStatus,
      uptime,
      memoryUsage: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
