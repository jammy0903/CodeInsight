/**
 * ProtectedRoute - 로그인 필수 라우트 보호
 *
 * WHY: 로그인하지 않은 사용자는 특정 페이지 접근 불가
 * PATTERN: AdminRoute와 유사하지만 role 체크 없음
 */

import { Navigate } from 'react-router-dom';
import { useStore } from '@/stores/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { firebaseUser, appUser, authLoading } = useStore();

  // 인증 상태 로딩 중이면 대기
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--theme-layout-page-bg)]">
        <div className="text-lg text-[var(--theme-dashboard-text-muted)]">인증 확인 중...</div>
      </div>
    );
  }

  // 로그인하지 않았으면 홈으로 리다이렉트
  if (!firebaseUser || !appUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
