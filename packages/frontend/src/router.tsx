/**
 * Router Configuration
 * CodeInsight - 코드 원리 학습 앱
 */

import { createBrowserRouter, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './layouts';
import { HomePage } from './features/home';
import { AuthPage } from './features/auth';
import { CoursesPage, LanguageCoursePage, ChapterLessonsPage, LessonPage } from './features/courses';
import { PlaygroundPage } from './features/playground';
import { AdminPage, AdminRoute } from './features/admin';
import { initializeAuthListener } from './services/firebase';
import { useTheme } from './hooks/useTheme';

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
      { path: 'admin', element: <AdminRoute><AdminPage /></AdminRoute> },
    ],
  },
]);
