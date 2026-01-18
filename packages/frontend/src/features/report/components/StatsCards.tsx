/**
 * StatsCards - 학습 통계 카드 그리드
 */

import { motion } from 'framer-motion';
import { Clock, BookOpen, Target, HelpCircle, StickyNote } from 'lucide-react';
import type { AnalyticsSummary } from '@/services/analytics';

interface StatsCardsProps {
  summary: AnalyticsSummary;
}

export function StatsCards({ summary }: StatsCardsProps) {
  const stats = [
    {
      label: '총 학습 시간',
      value: formatDuration(summary.totalStudyTime),
      icon: Clock,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: '학습 세션',
      value: `${summary.totalSessions}회`,
      icon: BookOpen,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: '퀴즈 정답률',
      value: summary.quizStats.total > 0
        ? `${Math.round(summary.quizStats.accuracy)}%`
        : '-',
      subValue: summary.quizStats.total > 0
        ? `${summary.quizStats.correct}/${summary.quizStats.total} 문제`
        : '아직 풀이 없음',
      icon: Target,
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'AI 질문',
      value: `${summary.aiQuestions}회`,
      icon: HelpCircle,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: '작성한 노트',
      value: `${summary.notes}개`,
      icon: StickyNote,
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`${stat.bgColor} rounded-xl p-4 border border-gray-100`}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}
            >
              <stat.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          {stat.subValue && (
            <p className="text-xs text-gray-400 mt-0.5">{stat.subValue}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 초를 시:분 형태로 포맷
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}
