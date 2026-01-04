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
  FileText,
  BookOpen,
  Activity,
  TrendingUp,
  Database,
  Clock,
  HardDrive,
} from 'lucide-react';
import { AIProviderToggle } from './components/AIProviderToggle';
import { api } from '@/services/api/axios';
import { handleError } from '@/services/api/errors';
import { PixelAvatar } from '@/components/PixelAvatar';

interface AdminStats {
  totalUsers: number;
  totalSubmissions: number;
  totalCourses: number;
  activeUsersToday: number;
  averageProgress: number;
}

interface OAuthAccountInfo {
  provider: string;
  email: string | null;
}

interface UserInfo {
  nickname: string;
  role: string;
  oauthAccounts: OAuthAccountInfo[];
  createdAt: string;
  totalSubmissions: number;
  solvedCount: number;
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

export function AdminPage() {
  const { appUser, authLoading } = useStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<{ users: UserInfo[]; total: number; page: number; totalPages: number } | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionInfo[]>([]);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const [statsRes, usersRes, submissionsRes, systemRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users', { params: { page: 1, limit: 20 } }),
        api.get('/admin/submissions', { params: { limit: 50 } }),
        api.get('/admin/system'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSubmissions(submissionsRes.data);
      setSystem(systemRes.data);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      const error = handleError(err);
      setError(error.message);
    } finally {
      setLoading(false);
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
        <div className="text-lg text-gray-600">인증 확인 중...</div>
      </div>
    );
  }

  // 데이터 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading admin data...</div>
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
    <div className="min-h-screen bg-sand p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">관리자: {appUser?.nickname}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAdminData}
            className="px-6 py-3 bg-accent-purple text-white rounded-lg font-semibold"
          >
            새로고침
          </motion.button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              icon={<Users className="w-8 h-8" />}
              label="전체 사용자"
              value={stats.totalUsers}
              color="bg-blue-500"
            />
            <StatCard
              icon={<FileText className="w-8 h-8" />}
              label="전체 제출"
              value={stats.totalSubmissions}
              color="bg-green-500"
            />
            <StatCard
              icon={<BookOpen className="w-8 h-8" />}
              label="전체 코스"
              value={stats.totalCourses}
              color="bg-purple-500"
            />
            <StatCard
              icon={<Activity className="w-8 h-8" />}
              label="오늘 활동 유저"
              value={stats.activeUsersToday}
              color="bg-orange-500"
            />
            <StatCard
              icon={<TrendingUp className="w-8 h-8" />}
              label="평균 진도율"
              value={`${stats.averageProgress}%`}
              color="bg-pink-500"
            />
          </div>
        )}

        {/* AI Provider Toggle */}
        <AIProviderToggle />

        {/* System Status */}
        {system && (
          <div className="bg-white rounded-xl border-2 border-sand p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Database className="w-6 h-6" />
              시스템 상태
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${system.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="text-sm text-gray-600">데이터베이스</div>
                  <div className="font-semibold">{system.database === 'healthy' ? '정상' : '오류'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-600">업타임</div>
                  <div className="font-semibold">{formatUptime(system.uptime)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <HardDrive className="w-6 h-6 text-purple-500" />
                <div>
                  <div className="text-sm text-gray-600">메모리 사용</div>
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
          <div className="bg-white rounded-xl border-2 border-sand p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">사용자 목록</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-sand">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">닉네임</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">역할</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">OAuth</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">제출 수</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">해결</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {users.users.map((user) => (
                    <tr key={user.nickname} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <PixelAvatar seed={user.nickname} size={24} />
                          <span className="font-medium">{user.nickname}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {user.oauthAccounts.map((oauth, idx) => (
                            <span key={idx} className="text-xs text-gray-600">
                              {oauth.provider}: {oauth.email || '-'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">{user.totalSubmissions}</td>
                      <td className="py-3 px-4">{user.solvedCount}</td>
                      <td className="py-3 px-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              페이지 {users.page} / {users.totalPages} (전체 {users.total}명)
            </div>
          </div>
        )}

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-sand p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">최근 제출 내역</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-sand">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">닉네임</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">문제</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">결과</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">제출 시각</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-gray-200 hover:bg-gray-50">
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
      className="bg-white rounded-xl border-2 border-sand p-6"
    >
      <div className={`${color} text-white w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </motion.div>
  );
}
