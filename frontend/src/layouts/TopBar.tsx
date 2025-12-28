/**
 * TopBar Component
 * CodeInsight 헤더 바 - 로고, 네비게이션, 사용자 메뉴
 */

import { NavLink } from 'react-router-dom';
import { loginWithGoogle } from '@/services/firebase';
import { Button } from '@/components/ui/button';
import { useStore } from '@/stores/store';
import { UserMenu } from './components/UserMenu';
import { Play, BookOpen, MessageCircle } from 'lucide-react';

// 네비게이션 아이템 정의
const navItems = [
  { path: '/simulator', label: 'Simulator', icon: Play },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/chat', label: 'AI Tutor', icon: MessageCircle },
];

export function TopBar() {
  const { user } = useStore();

  return (
    <header className="shrink-0 bg-card/95 backdrop-blur-md border-b border-border overflow-visible">
      {/* Row 1: Logo + Actions */}
      <div className="h-14 flex items-center justify-between px-6">
        {/* Logo Area */}
        <div className="flex items-center">
          <div className="h-7 w-32" />
        </div>

        {/* Actions Area */}
        <div className="flex items-center">
          {user ? (
            <UserMenu />
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={loginWithGoogle}
              className="h-9 px-4 text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="mr-2">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Navigation */}
      <nav className="h-10 flex items-center px-6 gap-8">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon"><Icon className="h-4 w-4" /></span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
