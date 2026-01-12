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
  totalSubmissions: number;
  totalCourses: number;
  activeUsersToday: number;
  averageProgress: number;
}

export interface OAuthAccountInfo {
  provider: string;
}

export interface UserInfo {
  nickname: string;
  role: string;
  oauthAccounts: OAuthAccountInfo[];
  createdAt: string;
  totalSubmissions: number;
  solvedCount: number;
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

    // 전체 제출 수
    const totalSubmissions = await prisma.submission.count();

    // 전체 코스 수 (Language 테이블에서)
    const totalCourses = await prisma.language.count();

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

    // 평균 진도율 계산 (완료된 레슨 / 전체 레슨)
    const totalLessons = await prisma.lesson.count();
    const completedProgress = await prisma.userProgress.count({
      where: { status: 'completed' },
    });
    const totalProgress = await prisma.userProgress.count();

    const averageProgress = totalProgress > 0 && totalLessons > 0
      ? Math.round((completedProgress / totalProgress) * 100)
      : 0;

    return {
      totalUsers,
      totalSubmissions,
      totalCourses: totalCourses || 3, // 기본값 3 (C, Java, Python)
      activeUsersToday: activeUsersToday.length,
      averageProgress,
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

    // 사용자 목록 (OAuth 계정 + 제출 통계 포함)
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
        _count: {
          select: { submissions: true },
        },
        submissions: {
          where: { verdict: 'accepted' },
          select: { problemId: true },
          distinct: ['problemId'],
        },
      },
    });

    const users: UserInfo[] = rawUsers.map(user => ({
      nickname: user.nickname,
      role: user.role,
      oauthAccounts: user.oauthAccounts,
      createdAt: user.createdAt.toISOString(),
      totalSubmissions: user._count.submissions,
      solvedCount: user.submissions.length,
    }));

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
