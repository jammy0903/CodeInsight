/**
 * Router Configuration
 * CodeInsight - 코드 원리 학습 앱
 */

import { createBrowserRouter, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './layouts';
import { HomePage } from './features/home';
import { AuthPage } from './features/auth';

// 정적 import (필수 컴포넌트만)
import { AdminRoute } from './features/admin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initializeAuthListener } from './services/firebase';
import { useTheme } from './hooks/useTheme';
import { CoursesPage } from './features/courses/CoursesPage';

// NOTE: 무거운 페이지들은 lazy 로딩으로 변경됨 (번들 크기 최적화)
// - PlaygroundPage: Monaco 에디터 (~150KB)
// - DashboardPage: recharts (~60KB)
// - QuizPage: 퀴즈 관련 로직
// - ReportPage, AdminPage, ProfilePage

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
      {
        path: 'courses',
        element: <CoursesPage />,
      },
      {
        path: 'courses/:lang',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          return { Component: LanguageCoursePage };
        }
      },
      {
        path: 'courses/:lang/:chapterId',
        lazy: async () => {
          const { ChapterLessonsPage } = await import('./features/courses/ChapterLessonsPage');
          return { Component: ChapterLessonsPage };
        }
      },
      {
        path: 'courses/:lang/:chapterId/:lessonId',
        lazy: async () => {
          const { LessonPage } = await import('./features/courses/LessonPage');
          return { Component: LessonPage };
        }
      },
      // Playground (Monaco 에디터 포함, ~150KB)
      {
        path: 'playground',
        lazy: async () => {
          const { PlaygroundPage } = await import('./features/playground');
          return { Component: PlaygroundPage };
        },
      },
      // Quiz 페이지들
      {
        path: 'quiz',
        lazy: async () => {
          const { QuizPage } = await import('./features/quiz');
          return {
            Component: () => <ProtectedRoute><QuizPage /></ProtectedRoute>,
          };
        },
      },
      {
        path: 'quiz/ox/:lang',
        lazy: async () => {
          const { OXQuizPage } = await import('./features/quiz');
          return {
            Component: () => <ProtectedRoute><OXQuizPage /></ProtectedRoute>,
          };
        },
      },
      {
        path: 'quiz/multiple-choice/:lang',
        lazy: async () => {
          const { MultipleChoiceQuizPage } = await import('./features/quiz');
          return {
            Component: () => <ProtectedRoute><MultipleChoiceQuizPage /></ProtectedRoute>,
          };
        },
      },
      {
        path: 'quiz/fill-blank/:lang',
        lazy: async () => {
          const { FillBlankQuizPage } = await import('./features/quiz');
          return {
            Component: () => <ProtectedRoute><FillBlankQuizPage /></ProtectedRoute>,
          };
        },
      },
      // Profile
      {
        path: 'profile',
        lazy: async () => {
          const { ProfilePage } = await import('./features/profile');
          return {
            Component: () => <ProtectedRoute><ProfilePage /></ProtectedRoute>,
          };
        },
      },
      // Dashboard (recharts 포함, ~60KB)
      {
        path: 'dashboard',
        lazy: async () => {
          const { DashboardPage } = await import('./features/dashboard');
          return {
            Component: () => <ProtectedRoute><DashboardPage /></ProtectedRoute>,
          };
        },
      },
      // Report
      {
        path: 'report',
        lazy: async () => {
          const { ReportPage } = await import('./features/report');
          return {
            Component: () => <ProtectedRoute><ReportPage /></ProtectedRoute>,
          };
        },
      },
      // Admin
      {
        path: 'admin',
        lazy: async () => {
          const { AdminPage } = await import('./features/admin');
          return {
            Component: () => <AdminRoute><AdminPage /></AdminRoute>,
          };
        },
      },
    ],
  },
]);
