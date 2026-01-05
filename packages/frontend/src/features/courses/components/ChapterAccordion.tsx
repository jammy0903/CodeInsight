import { useState } from 'react';
import type { Chapter, Lesson, UserProgress } from '@/types';
import { LessonItem } from './LessonItem';

interface ChapterAccordionProps {
  chapter: Chapter;
  lessons: Lesson[];
  progressMap?: Map<string, UserProgress>; // lessonId → progress
  languageId: string;
  defaultOpen?: boolean;
}

export function ChapterAccordion({
  chapter,
  lessons,
  progressMap,
  languageId,
  defaultOpen = false,
}: ChapterAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // 진행률 계산
  const completedCount = lessons.filter((lesson) => {
    const progress = progressMap?.get(lesson.id);
    return progress?.status === 'completed';
  }).length;

  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 진행 상태 텍스트
  const getStatusText = () => {
    if (completedCount === 0) return '시작 전';
    if (completedCount === totalCount) return '완료';
    return '진행 중';
  };

  // 진행률 바 색상
  const getProgressColor = () => {
    if (completedCount === 0) return 'bg-gray-200';
    if (completedCount === totalCount) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* 챕터 헤더 (클릭 가능) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        {/* 왼쪽: 챕터 정보 */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl">📘</span>
            <h3 className="font-bold text-gray-900">{chapter.title}</h3>
          </div>
          {chapter.description && (
            <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
          )}
          {chapter.keyQuestion && (
            <p className="text-xs text-blue-600 mt-1 italic">🤔 {chapter.keyQuestion}</p>
          )}
        </div>

        {/* 오른쪽: 진행률 + 토글 아이콘 */}
        <div className="flex items-center gap-4">
          {/* 진행률 텍스트 */}
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">
              {completedCount}/{totalCount} {getStatusText()}
            </p>
            <p className="text-xs text-gray-500">{progressPercent}%</p>
          </div>

          {/* 토글 아이콘 */}
          <span className="text-gray-400 text-xl transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </button>

      {/* 진행률 바 */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 레슨 목록 (접었다 펼치기) */}
      {isOpen && (
        <div className="p-4 space-y-2 bg-gray-50">
          {lessons.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">레슨이 없습니다</p>
          ) : (
            lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                progress={progressMap?.get(lesson.id)}
                languageId={languageId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
