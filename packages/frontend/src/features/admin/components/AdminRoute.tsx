/**
 * Admin Route Protection
 *
 * WHY: role='admin' 인 사용자만 Admin 페이지 접근 가능
 * CHANGE: 이메일 체크 → role 기반 (DB에서 관리)
 * PATTERN: Wait for auth, then redirect non-admin users to home
 */

import { Navigate } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { useTranslation } from 'react-i18next';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { t } = useTranslation();
  const firebaseUser = useStore((s) => s.firebaseUser);
  const appUser = useStore((s) => s.appUser);
  const authLoading = useStore((s) => s.authLoading);

  // 인증 상태 로딩 중이면 대기
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-[var(--theme-dashboard-text-muted)]">{t("admin.checking_auth")}</div>
      </div>
    );
  }

  // Redirect if not logged in or not admin
  if (!firebaseUser || !appUser || appUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
