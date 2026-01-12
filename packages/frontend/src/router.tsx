/**
 * Router Configuration
 * CodeInsight - 코드 원리 학습 앱
 */

import { createBrowserRouter, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useLayoutEffect } from 'react';
import { MainLayout } from './layouts';
import { HomePage } from './features/home';
import { AuthPage } from './features/auth';
import { CoursesPage, LanguageCoursePage, ChapterLessonsPage, LessonPage } from './features/courses';
import { PlaygroundPage } from './features/playground';
import { AdminPage, AdminRoute } from './features/admin';
import { QuizPage, OXQuizPage, MultipleChoiceQuizPage, FillBlankQuizPage } from './features/quiz';
import { DashboardPage } from './features/dashboard';
import { ProfilePage } from './features/profile';
import { initializeAuthListener } from './services/firebase';
import { useTheme } from './hooks/useTheme';

/**
 * 페이지 이동 시 스크롤 최상단 이동
 *
 * WHY: React Router는 페이지 이동 시 스크롤 위치를 유지함
 * useLayoutEffect: 렌더링 전에 스크롤 → 깜빡임 방지
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/**
 * 인증 상태 초기화 컴포넌트
 *
 * WHY: Firebase Auth 상태 변경 → 백엔드 조회 → store 업데이트 연결
 * FLOW:
 *   1. Firebase 인증 상태 변경 감지
 *   2. 백엔드에서 사용자 정보 조회 (/users/me)
 *   3. 등록 여부에 따라 appUser 또는 needsRegistration 설정
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  // 테마 초기화
  useTheme();

  // 인증 상태 감시 (Firebase + 백엔드 연동)
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}

/**
 * 메인 레이아웃 래퍼
 */
function RootLayout() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <MainLayout>
        <Outlet />
      </MainLayout>
    </AuthProvider>
  );
}

/**
 * 라우터 설정
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <AuthPage /> },
      { path: 'signup', element: <AuthPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:lang', element: <LanguageCoursePage /> },
      { path: 'courses/:lang/:chapterId', element: <ChapterLessonsPage /> },
      { path: 'courses/:lang/:chapterId/:lessonId', element: <LessonPage /> },
      { path: 'playground', element: <PlaygroundPage /> },
      { path: 'quiz', element: <QuizPage /> },
      { path: 'quiz/ox', element: <OXQuizPage /> },
      { path: 'quiz/multiple-choice', element: <MultipleChoiceQuizPage /> },
      { path: 'quiz/fill-blank', element: <FillBlankQuizPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'admin', element: <AdminRoute><AdminPage /></AdminRoute> },
    ],
  },
]);
