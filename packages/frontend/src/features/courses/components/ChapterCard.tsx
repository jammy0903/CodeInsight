/**
 * ChapterCard - 챕터 카드 (Grid용)
 *
 * 클릭 시 해당 챕터의 레슨 목록 페이지로 이동
 */

import { useNavigate } from 'react-router-dom';
import type { Chapter, UserProgress } from '@/types';
import { Star, Target, Lock, ChevronRight, BookOpen } from 'lucide-react';

// 언어별 색상 테마 (밝은 파스텔 톤)
const LANGUAGE_THEMES: Record<string, {
  primary: string;
  primaryRgb: string;
  bg: string;
  bgActive: string;
  textColor: string;
}> = {
  c: {
    primary: '#5BA3C0',
    primaryRgb: '135, 206, 235',
    bg: 'linear-gradient(135deg, #E8F4FA 0%, #D0EBF7 100%)',
    bgActive: 'linear-gradient(135deg, #D6EEF8 0%, #B8E0F0 100%)',
    textColor: '#5BA3C0',
  },
  python: {
    primary: '#F57C00',
    primaryRgb: '255, 213, 79',
    bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
    bgActive: 'linear-gradient(135deg, #FFF3CD 0%, #FFE082 100%)',
    textColor: '#F57C00',
  },
  java: {
    primary: '#BE185D',
    primaryRgb: '236, 72, 153',
    bg: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
    bgActive: 'linear-gradient(135deg, #FBEDF5 0%, #F9D5E8 100%)',
    textColor: '#BE185D',
  },
  javascript: {
    primary: '#2E7D32',
    primaryRgb: '129, 199, 132',
    bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    bgActive: 'linear-gradient(135deg, #DCF1DD 0%, #B9DEB9 100%)',
    textColor: '#2E7D32',
  },
  'python-practical': {
    primary: '#424242',
    primaryRgb: '158, 158, 158',
    bg: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
    bgActive: 'linear-gradient(135deg, #EEEEEE 0%, #D6D6D6 100%)',
    textColor: '#424242',
  },
};

const DEFAULT_THEME = {
  primary: '#616161',
  primaryRgb: '158, 158, 158',
  bg: 'linear-gradient(135deg, #FAFAFA 0%, #EEEEEE 100%)',
  bgActive: 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)',
  textColor: '#616161',
};

interface ChapterCardProps {
  chapter: Chapter;
  languageId: string;
  lessonCount: number;
  completedCount: number;
  isLocked?: boolean;
  isActive?: boolean;
  needsLogin?: boolean; // 로그인 필요 여부
}

export function ChapterCard({
  chapter,
  languageId,
  lessonCount,
  completedCount,
  isLocked = false,
  isActive = false,
  needsLogin = false,
}: ChapterCardProps) {
  const navigate = useNavigate();
  const theme = LANGUAGE_THEMES[languageId] || DEFAULT_THEME;

  const progressPercent = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
  const isComplete = completedCount === lessonCount && lessonCount > 0;

  const handleClick = () => {
    if (!isLocked) {
      navigate(`/courses/${languageId}/${chapter.id}`);
    }
  };

  // 스티치 색상 결정 (언어별 색상 기반)
  const stitchColor = isComplete
    ? 'rgba(0, 245, 212, 0.6)'
    : isActive
      ? `rgba(${theme.primaryRgb}, 0.6)`
      : isLocked
        ? 'rgba(255, 255, 255, 0.1)'
        : `rgba(${theme.primaryRgb}, 0.4)`;

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={`
        group relative rounded-xl text-left aspect-square
        p-3 md:p-5 lg:p-8
        transition-all duration-300 hover:scale-[1.02]
        ${isComplete
          ? 'shadow-lg'
          : isLocked
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:shadow-xl'
        }
      `}
      style={{
        background: isComplete
          ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
          : isActive
            ? theme.bgActive
            : isLocked
              ? '#F3F4F6'
              : theme.bg,
        border: isComplete
          ? '2px solid rgba(16, 185, 129, 0.5)'
          : isActive
            ? `2px solid rgba(${theme.primaryRgb}, 0.5)`
            : isLocked
              ? '2px solid #E5E7EB'
              : `2px solid rgba(${theme.primaryRgb}, 0.3)`,
        boxShadow: isComplete
          ? '0 10px 40px -10px rgba(16, 185, 129, 0.25)'
          : isActive
            ? `0 8px 30px -10px rgba(${theme.primaryRgb}, 0.3)`
            : undefined,
      }}
    >
      {/* 바느질 스티치 테두리 */}
      <div
        className="absolute rounded-lg pointer-events-none inset-1.5 md:inset-2 lg:inset-3"
        style={{
          border: `2px dashed ${stitchColor}`,
        }}
      />
      {/* 완료시 별 */}
      {isComplete && (
        <div className="absolute top-4 right-4">
          <Star className="w-6 h-6 text-[#FFD700] fill-[#FFD700] animate-pulse" />
        </div>
      )}

      {/* 화살표 (호버 시) */}
      {!isLocked && !isComplete && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5" style={{ color: theme.primary }} />
        </div>
      )}

      {/* 상태 배지 */}
      <div className="flex items-center gap-2 mb-2 md:mb-3 lg:mb-4">
        {isActive && !isComplete && (
          <span
            className="inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `rgba(${theme.primaryRgb}, 0.15)`,
              color: theme.primary,
              border: `1px solid rgba(${theme.primaryRgb}, 0.3)`,
            }}
          >
            <Target className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Current
          </span>
        )}
        {isComplete && (
          <span className="inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600 border border-emerald-200">
            <Star className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Completed
          </span>
        )}
        {isLocked && (
          <span className="inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-dashboard-text-muted)] border border-[var(--theme-dashboard-card-border)]">
            <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Locked
          </span>
        )}
        {needsLogin && !isLocked && (
          <span className="inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
            <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Login
          </span>
        )}
      </div>

      {/* 챕터 제목 */}
      <h3
        className="text-sm md:text-base lg:text-xl font-bold mb-2 md:mb-2.5 lg:mb-3 break-keep"
        style={{
          color: isComplete ? '#059669' : isLocked ? '#9CA3AF' : theme.textColor
        }}
      >
        {chapter.title}
      </h3>

      {/* 챕터 설명 */}
      {chapter.description && (
        <p className="text-[10px] md:text-xs lg:text-sm text-[var(--theme-dashboard-text-muted)] line-clamp-3 mb-3 md:mb-4 lg:mb-6">
          {chapter.description}
        </p>
      )}

      {/* 진행률 바 */}
      <div className="mb-2 md:mb-3 lg:mb-4">
        <div className="flex items-center justify-between text-[10px] md:text-xs text-[var(--theme-dashboard-text-muted)] mb-1">
          <span>Progress</span>
          <span className="font-mono font-bold">{progressPercent}%</span>
        </div>
        <div className="h-1.5 md:h-2 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: isComplete
                ? '#10B981'
                : theme.primary
            }}
          />
        </div>
      </div>

      {/* 레슨 카운트 */}
      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs lg:text-sm text-[var(--theme-dashboard-text-muted)]">
        <BookOpen className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
        <span>
          {completedCount} / {lessonCount} Lessons
        </span>
      </div>
    </button>
  );
}
