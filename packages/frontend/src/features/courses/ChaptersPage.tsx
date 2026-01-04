/**
 * ChaptersPage
 * 언어별 챕터 목록 표시
 *
 * Route: /courses/:lang
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChapters } from '@/services/courses';
import type { Chapter } from '@/types';

export function ChaptersPage() {
  const { lang } = useParams<{ lang: string }>();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lang) return;

    async function fetchChapters() {
      try {
        setLoading(true);
        const data = await getChapters(lang!);
        setChapters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapters');
      } finally {
        setLoading(false);
      }
    }

    fetchChapters();
  }, [lang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link to="/courses" className="text-blue-500 hover:underline mt-4 inline-block">
          ← 언어 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Link to="/courses" className="text-gray-500 hover:text-gray-700 text-sm">
          ← 언어 목록
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {lang?.toUpperCase()} 챕터
        </h1>
      </div>

      {/* 챕터 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            to={`/courses/${lang}/${chapter.id}`}
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                {chapter.order}
              </span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chapter.title}
              </h2>
            </div>
            {chapter.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {chapter.description}
              </p>
            )}
            {chapter.keyQuestion && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 italic">
                💡 {chapter.keyQuestion}
              </p>
            )}
          </Link>
        ))}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          아직 챕터가 없습니다.
        </div>
      )}
    </div>
  );
}
