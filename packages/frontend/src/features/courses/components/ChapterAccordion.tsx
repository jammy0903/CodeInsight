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

  const isComplete = completedCount === totalCount && totalCount > 0;

  return (
    <div className="chapter-card">
      {/* 챕터 헤더 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chapter-header"
      >
        <div className="chapter-info">
          <span className={`chapter-title ${isComplete ? 'completed' : ''}`}>
            {chapter.title}
          </span>
          {chapter.description && (
            <p className="chapter-desc">{chapter.description}</p>
          )}
        </div>

        <div className="chapter-meta">
          <span className={`chapter-badge ${isComplete ? 'complete' : completedCount > 0 ? 'progress' : ''}`}>
            {completedCount}/{totalCount}
          </span>
          <span className={`chapter-arrow ${isOpen ? 'open' : ''}`}>
            ›
          </span>
        </div>
      </button>

      {/* 진행률 바 */}
      <div className="chapter-progress">
        <div
          className={`chapter-progress-fill ${isComplete ? 'complete' : ''}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 레슨 목록 */}
      {isOpen && (
        <div className="chapter-lessons">
          {lessons.length === 0 ? (
            <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>레슨이 없습니다</p>
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
