/**
 * Admin Dashboard
 *
 * WHY: Admin-only page for monitoring system stats
 * RESPONSIBILITY: Display data from backend APIs (no calculations)
 *
 * CHANGE: user → appUser (nickname 기반)
 * - UserInfo 인터페이스 업데이트 (nickname, oauthAccounts, solvedCount)
 * - SubmissionInfo 인터페이스 업데이트 (userNickname)
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/stores/store';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  TrendingUp,
  Database,
  Clock,
  HardDrive,
  DollarSign,
  Zap,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { AIProviderToggle } from './components/AIProviderToggle';
import { api } from '@/services/api/axios';
import { handleError } from '@/services/api/errors';
import { PixelAvatar } from '@/components/PixelAvatar';
import { logger } from '@/utils/logger';

interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  languageProgress: Array<{
    languageId: string;
    languageName: string;
    progressPercentage: number;
    activeUserProgressPercentage: number;
  }>;
}

interface OAuthAccountInfo {
  provider: string;
}

interface UserInfo {
  nickname: string;
  role: string;
  oauthAccounts: OAuthAccountInfo[];
  createdAt: string;
  studyDays: number;
  completedLessons: number;
}

interface SubmissionInfo {
  id: string;
  userNickname: string;
  problemId: string;
  verdict: string;
  createdAt: string;
}

interface SystemStatus {
  database: 'healthy' | 'unhealthy';
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: string;
}

interface AIUsageStats {
  today: { tokens: number; requests: number };
  thisWeek: { tokens: number; requests: number };
  thisMonth: { tokens: number; requests: number };
  estimatedCost: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  recentRequests: Array<{
    createdAt: string;
    context: string | null;
    tokens: number | null;
    questionPreview: string;
  }>;
}

interface ReportStats {
  summary: {
    total: number;
    todayCount: number;
    openCount: number;
    byType: Record<string, number>;
    byLanguage: Record<string, number>;
  };
  recent: Array<{
    id: string;
    userNickname: string;
    type: string;
    category: string;
    message: string | null;
    lessonId: string | null;
    language: string | null;
    status: string;
    createdAt: string;
  }>;
}

export function AdminPage() {
  const appUser = useStore((s) => s.appUser);
  const authLoading = useStore((s) => s.authLoading);
  const setPageTitle = useStore((s) => s.setPageTitle);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<{ users: UserInfo[]; total: number; page: number; totalPages: number } | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionInfo[]>([]);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [aiUsage, setAIUsage] = useState<AIUsageStats | null>(null);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMode, setProgressMode] = useState<'all' | 'active'>('all');

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle('관리자 페이지', `관리자: ${appUser?.nickname || ''}`);
  }, [setPageTitle, appUser]);

  // 인증 상태가 복원된 후에만 데이터 fetch
  useEffect(() => {
    if (!authLoading && appUser) {
      fetchAdminData();
    }
  }, [authLoading, appUser]);

  async function fetchAdminData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch all admin data in parallel (axios interceptor handles auth automatically)
      const [statsRes, usersRes, submissionsRes, systemRes, aiUsageRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users', { params: { page: 1, limit: 20 } }),
        api.get('/admin/submissions', { params: { limit: 50 } }),
        api.get('/admin/system'),
        api.get('/admin/ai-usage'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSubmissions(submissionsRes.data);
      setSystem(systemRes.data);
      setAIUsage(aiUsageRes.data);

      // 신고 통계는 별도 처리 (실패해도 기존 admin 페이지는 정상 표시)
      try {
        const reportStatsRes = await api.get('/admin/reports');
        setReportStats(reportStatsRes.data);
      } catch (reportErr) {
        logger.error('Report stats fetch failed (non-critical):', reportErr);
      }
    } catch (err) {
      logger.error('Admin data fetch error:', err);
      const error = handleError(err);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveReport(reportId: string) {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`);
      // 해당 report의 status를 로컬에서 업데이트
      setReportStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            openCount: Math.max(0, prev.summary.openCount - 1),
          },
          recent: prev.recent.map((r) =>
            r.id === reportId ? { ...r, status: 'resolved' } : r
          ),
        };
      });
    } catch (err) {
      logger.error('Failed to resolve report:', err);
    }
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  // 인증 상태 로딩 중
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-[var(--theme-dashboard-text-muted)]">인증 확인 중...</div>
      </div>
    );
  }

  // 데이터 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-[var(--theme-dashboard-text-muted)]">Loading admin data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--theme-layout-page-bg)] px-6 md:px-10 lg:px-16 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Cards - Row 1: 전반적인 통계 */}
        {stats && (
          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                icon={<Users className="w-8 h-8" />}
                label="전체 사용자"
                value={stats.totalUsers}
                color="bg-blue-500"
              />
              <StatCard
                icon={<Activity className="w-8 h-8" />}
                label="오늘 활동 유저"
                value={stats.activeUsersToday}
                color="bg-orange-500"
              />
            </div>
          </div>
        )}

        {/* Stats Cards - Row 2: 언어별 진도율 */}
        {stats && (
          <div className="bg-[var(--theme-dashboard-section-header-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--theme-dashboard-title)] flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                언어별 학습 진도율
              </h3>

              {/* 토글 버튼 */}
              <div className="flex gap-2 border-2 border-[var(--theme-dashboard-card-border)] bg-[var(--theme-dashboard-card-bg)]">
                <button
                  onClick={() => setProgressMode('all')}
                  className={`px-3 py-1 text-xs font-bold font-mono transition-colors ${
                    progressMode === 'all'
                      ? 'bg-pink-500 text-white'
                      : 'bg-transparent text-[var(--theme-dashboard-title)] hover:bg-[var(--theme-dashboard-section-header-bg)]'
                  }`}
                >
                  전체 평균
                </button>
                <button
                  onClick={() => setProgressMode('active')}
                  className={`px-3 py-1 text-xs font-bold font-mono transition-colors ${
                    progressMode === 'active'
                      ? 'bg-pink-500 text-white'
                      : 'bg-transparent text-[var(--theme-dashboard-title)] hover:bg-[var(--theme-dashboard-section-header-bg)]'
                  }`}
                >
                  학습자 평균
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {stats.languageProgress.map((lang) => {
                const percentage = progressMode === 'all'
                  ? lang.progressPercentage
                  : lang.activeUserProgressPercentage;

                return (
                  <div key={lang.languageId} className="flex items-center gap-4">
                    {/* 언어 이름 */}
                    <div className="w-20 text-sm font-bold text-[var(--theme-dashboard-title)] font-mono">
                      {lang.languageName}
                    </div>

                    {/* 막대 그래프 (픽셀 스타일) */}
                    <div className="flex-1 bg-[var(--theme-dashboard-progress-bg)] border-2 border-[var(--theme-dashboard-card-border)] h-8 overflow-hidden">
                      <motion.div
                        className="h-full bg-pink-500 border-r-2 border-[var(--theme-dashboard-card-border)] flex items-center justify-end px-3"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        key={`${lang.languageId}-${progressMode}`}
                      >
                        {percentage > 10 && (
                          <span className="text-xs font-bold text-white font-mono">
                            {percentage}%
                          </span>
                        )}
                      </motion.div>
                    </div>

                    {/* 퍼센트 (막대 밖) */}
                    {percentage <= 10 && (
                      <div className="w-12 text-sm font-bold text-[var(--theme-dashboard-title)] font-mono">
                        {percentage}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Provider Toggle */}
        <AIProviderToggle />

        {/* AI Usage & Cost */}
        {aiUsage && (
          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-4 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-500" />
              DeepSeek API 비용
            </h2>

            {/* 비용 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--theme-dashboard-section-header-bg)] rounded-lg p-4 border border-[var(--theme-dashboard-card-border)]">
                <div className="flex items-center gap-2 text-sm text-[var(--theme-dashboard-text-muted)] mb-1">
                  <Zap className="w-4 h-4" />
                  오늘
                </div>
                <div className="text-2xl font-bold text-[var(--theme-dashboard-title)]">
                  ${aiUsage.estimatedCost.today.toFixed(4)}
                </div>
                <div className="text-xs text-[var(--theme-dashboard-text-muted)] mt-1">
                  {aiUsage.today.tokens.toLocaleString()} tokens · {aiUsage.today.requests} 요청
                </div>
              </div>

              <div className="bg-[var(--theme-dashboard-section-header-bg)] rounded-lg p-4 border border-[var(--theme-dashboard-card-border)]">
                <div className="flex items-center gap-2 text-sm text-[var(--theme-dashboard-text-muted)] mb-1">
                  <Zap className="w-4 h-4" />
                  이번 주
                </div>
                <div className="text-2xl font-bold text-[var(--theme-dashboard-title)]">
                  ${aiUsage.estimatedCost.thisWeek.toFixed(4)}
                </div>
                <div className="text-xs text-[var(--theme-dashboard-text-muted)] mt-1">
                  {aiUsage.thisWeek.tokens.toLocaleString()} tokens · {aiUsage.thisWeek.requests} 요청
                </div>
              </div>

              <div className="bg-[var(--theme-dashboard-section-header-bg)] rounded-lg p-4 border border-[var(--theme-dashboard-card-border)]">
                <div className="flex items-center gap-2 text-sm text-[var(--theme-dashboard-text-muted)] mb-1">
                  <Zap className="w-4 h-4" />
                  이번 달
                </div>
                <div className="text-2xl font-bold text-green-500">
                  ${aiUsage.estimatedCost.thisMonth.toFixed(4)}
                </div>
                <div className="text-xs text-[var(--theme-dashboard-text-muted)] mt-1">
                  {aiUsage.thisMonth.tokens.toLocaleString()} tokens · {aiUsage.thisMonth.requests} 요청
                </div>
              </div>
            </div>

            {/* 최근 요청 내역 */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[var(--theme-dashboard-text-muted)] mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                최근 AI 요청 (ChatHistory 기록)
              </h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[var(--theme-dashboard-card-bg)]">
                    <tr className="border-b border-[var(--theme-dashboard-card-border)]">
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">시간</th>
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">컨텍스트</th>
                      <th className="text-right py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">토큰</th>
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">질문</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsage.recentRequests.map((req, idx) => (
                      <tr key={idx} className="border-b border-[var(--theme-dashboard-card-border)] hover:bg-[var(--theme-dashboard-section-header-bg)]">
                        <td className="py-2 px-2 text-[var(--theme-dashboard-text-muted)] whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            req.context === 'lesson' ? 'bg-blue-100 text-blue-700' :
                            req.context === 'playground' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {req.context || 'general'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-[var(--theme-dashboard-text-muted)]">
                          {req.tokens?.toLocaleString() || '-'}
                        </td>
                        <td className="py-2 px-2 text-[var(--theme-dashboard-title)] truncate max-w-[200px]">
                          {req.questionPreview}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--theme-dashboard-text-muted)] mt-3">
                ⚠️ 참고: /explain-step (스트리밍)은 토큰 추적이 안 됨. 실제 비용은 더 높을 수 있음.
              </p>
            </div>
          </div>
        )}

        {/* Report Stats */}
        {reportStats && (
          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              신고/문의 현황
            </h2>

            {/* 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={<AlertTriangle className="w-8 h-8" />}
                label="전체 신고"
                value={reportStats.summary.total}
                color="bg-red-500"
              />
              <StatCard
                icon={<Zap className="w-8 h-8" />}
                label="오늘 신고"
                value={reportStats.summary.todayCount}
                color="bg-yellow-500"
              />
              <StatCard
                icon={<Clock className="w-8 h-8" />}
                label="미처리"
                value={reportStats.summary.openCount}
                color="bg-orange-500"
              />
            </div>

            {/* 언어별 신고 바 */}
            {Object.keys(reportStats.summary.byLanguage).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--theme-dashboard-text-muted)] mb-3">
                  언어별 신고 분포
                </h3>
                <div className="space-y-2">
                  {Object.entries(reportStats.summary.byLanguage)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, count]) => {
                      const maxCount = Math.max(...Object.values(reportStats.summary.byLanguage));
                      const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={lang} className="flex items-center gap-3">
                          <div className="w-20 text-sm font-bold text-[var(--theme-dashboard-title)] font-mono capitalize">
                            {lang}
                          </div>
                          <div className="flex-1 bg-[var(--theme-dashboard-progress-bg)] border-2 border-[var(--theme-dashboard-card-border)] h-6 overflow-hidden">
                            <motion.div
                              className="h-full bg-red-400 flex items-center justify-end px-2"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            >
                              {pct > 15 && (
                                <span className="text-xs font-bold text-white font-mono">{count}</span>
                              )}
                            </motion.div>
                          </div>
                          {pct <= 15 && (
                            <span className="text-xs font-bold text-[var(--theme-dashboard-title)] font-mono w-8">{count}</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 최근 신고 테이블 */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--theme-dashboard-text-muted)] mb-3">
                최근 신고 목록
              </h3>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[var(--theme-dashboard-card-bg)]">
                    <tr className="border-b border-[var(--theme-dashboard-card-border)]">
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">닉네임</th>
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">유형</th>
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">카테고리</th>
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">레슨</th>
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">상태</th>
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">시각</th>
                      <th className="text-left py-2 px-2 font-semibold text-[var(--theme-dashboard-text-muted)]">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportStats.recent.map((report) => (
                      <tr key={report.id} className="border-b border-[var(--theme-dashboard-card-border)] hover:bg-[var(--theme-dashboard-section-header-bg)]">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <PixelAvatar seed={report.userNickname} size={18} />
                            <span>{report.userNickname}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            report.type === 'lesson' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {report.type === 'lesson' ? '레슨' : '일반'}
                          </span>
                        </td>
                        <td className="py-2 px-2 truncate max-w-[150px]">{report.category}</td>
                        <td className="py-2 px-2 font-mono text-xs">{report.lessonId || '-'}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            report.status === 'open'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {report.status === 'open' ? '미처리' : '해결'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-[var(--theme-dashboard-text-muted)] whitespace-nowrap">
                          {new Date(report.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-2">
                          {report.status === 'open' && (
                            <button
                              onClick={() => handleResolveReport(report.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              해결
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* System Status */}
        {system && (
          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-4 flex items-center gap-3">
              <Database className="w-6 h-6" />
              시스템 상태
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${system.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="text-sm text-[var(--theme-dashboard-text-muted)]">데이터베이스</div>
                  <div className="font-semibold">{system.database === 'healthy' ? '정상' : '오류'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-sm text-[var(--theme-dashboard-text-muted)]">업타임</div>
                  <div className="font-semibold">{formatUptime(system.uptime)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <HardDrive className="w-6 h-6 text-purple-500" />
                <div>
                  <div className="text-sm text-[var(--theme-dashboard-text-muted)]">메모리 사용</div>
                  <div className="font-semibold">
                    {system.memoryUsage.used}MB / {system.memoryUsage.total}MB ({system.memoryUsage.percentage}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        {users && (
          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-4">사용자 목록</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[var(--theme-dashboard-card-border)]">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">닉네임</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">역할</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">OAuth</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">공부한 날짜 수</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">완료 레슨 수</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {users.users.map((user) => (
                    <tr key={user.nickname} className="border-b border-[var(--theme-dashboard-card-border)] hover:bg-[var(--theme-dashboard-section-header-bg)]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <PixelAvatar seed={user.nickname} size={24} />
                          <span className="font-medium">{user.nickname}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-dashboard-text-muted)]'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.oauthAccounts.map((oauth, idx) => (
                            <span key={idx} className="text-xs text-[var(--theme-dashboard-text-muted)] bg-[var(--theme-dashboard-section-header-bg)] px-2 py-0.5 rounded capitalize">
                              {oauth.provider}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.studyDays}일</td>
                      <td className="py-3 px-4">{user.completedLessons}개</td>
                      <td className="py-3 px-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-[var(--theme-dashboard-text-muted)]">
              페이지 {users.page} / {users.totalPages} (전체 {users.total}명)
            </div>
          </div>
        )}

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-4">최근 제출 내역</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-[var(--theme-dashboard-card-border)]">
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">닉네임</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">문제</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">결과</th>
                    <th className="text-left py-3 px-4 font-semibold text-[var(--theme-dashboard-text-muted)]">제출 시각</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-[var(--theme-dashboard-card-border)] hover:bg-[var(--theme-dashboard-section-header-bg)]">
                      <td className="py-3 px-4 font-mono text-sm">{submission.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <PixelAvatar seed={submission.userNickname} size={20} />
                          <span>{submission.userNickname}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{submission.problemId}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            submission.verdict === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : submission.verdict === 'judging'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {submission.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-4">{new Date(submission.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6"
    >
      <div className={`${color} text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-[var(--theme-dashboard-title)]">{value}</div>
      <div className="text-sm text-[var(--theme-dashboard-text-muted)] mt-1">{label}</div>
    </motion.div>
  );
}
