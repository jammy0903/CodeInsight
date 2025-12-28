/**
 * CoursesPage - 코스 목록 페이지
 */

import { useParams, useNavigate } from 'react-router-dom';
import { getAllLanguages, getCourse, type Language } from '@/data/courses';
import { LanguageTabs } from './components/LanguageTabs';
import { CourseHeader } from './components/CourseHeader';
import { DayGrid } from './components/DayGrid';
import { useCourseProgress } from './hooks/useCourseProgress';

export function CoursesPage() {
  const { lang } = useParams<{ lang?: string }>();
  const navigate = useNavigate();

  // 기본값: 'c'
  const currentLang = (lang ?? 'c') as Language;
  const languages = getAllLanguages();
  const course = getCourse(currentLang);
  const { progress } = useCourseProgress(currentLang);

  // 언어 탭 변경
  const handleLanguageChange = (langId: string) => {
    navigate(`/courses/${langId}`);
  };

  // Day 카드 클릭
  const handleDayClick = (day: number) => {
    navigate(`/courses/${currentLang}/${day}`);
  };

  // 존재하지 않는 언어
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>코스를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/courses/c')}
          className="mt-4 text-primary hover:underline"
        >
          C 코스로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* 언어 탭 */}
      <LanguageTabs
        languages={languages}
        activeLanguage={currentLang}
        onChange={handleLanguageChange}
      />

      {/* 언어 헤더 + 진행률 */}
      <CourseHeader
        language={course.language}
        completedCount={progress.completedDays.length}
        totalDays={course.days.length}
      />

      {/* Day 그리드 */}
      <DayGrid
        days={course.days}
        completedDays={progress.completedDays}
        onDayClick={handleDayClick}
      />
    </div>
  );
}
