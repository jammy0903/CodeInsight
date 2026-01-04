/**
 * LessonsPage
 * 챕터별 레슨 목록 표시
 *
 * Route: /courses/:lang/:chapterId
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChapterWithLessons } from '@/services/courses';
import type { ChapterWithLessons, Lesson } from '@/types';

export function LessonsPage() {
  const { lang, chapterId } = useParams<{ lang: string; chapterId: string }>();
  const [chapter, setChapter] = useState<ChapterWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) return;

    async function fetchLessons() {
      try {
        setLoading(true);
        const data = await getChapterWithLessons(chapterId!);
        setChapter(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lessons');
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, [chapterId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Chapter not found'}</p>
        <Link to={`/courses/${lang}`} className="text-blue-500 hover:underline mt-4 inline-block">
          ← 챕터 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Link to={`/courses/${lang}`} className="text-gray-500 hover:text-gray-700 text-sm">
          ← 챕터 목록
        </Link>
        <h1 className="text-2xl font-bold mt-2">{chapter.title}</h1>
        {chapter.description && (
          <p className="text-gray-600 dark:text-gray-400 mt-1">{chapter.description}</p>
        )}
        {chapter.keyQuestion && (
          <p className="text-blue-600 dark:text-blue-400 mt-2 text-sm italic">
            💡 {chapter.keyQuestion}
          </p>
        )}
      </div>

      {/* 레슨 목록 */}
      <div className="space-y-3">
        {chapter.lessons.map((lesson: Lesson) => (
          <Link
            key={lesson.id}
            to={`/courses/${lang}/${chapterId}/${lesson.id}`}
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            {/* 레슨 번호 */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold">
              {lesson.order}
            </div>

            {/* 레슨 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {lesson.title}
              </h3>
              {lesson.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {lesson.description}
                </p>
              )}
            </div>

            {/* 난이도 + 예상 시간 */}
            <div className="flex-shrink-0 flex items-center gap-2 text-xs text-gray-500">
              <DifficultyBadge difficulty={lesson.difficulty} />
              {lesson.estimatedTime && (
                <span>~{lesson.estimatedTime}분</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {chapter.lessons.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          아직 레슨이 없습니다.
        </div>
      )}
    </div>
  );
}

/**
 * 난이도 배지
 */
function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    basic: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  const labels: Record<string, string> = {
    basic: '기초',
    intermediate: '중급',
    advanced: '고급',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[difficulty] || colors.basic}`}>
      {labels[difficulty] || difficulty}
    </span>
  );
}
