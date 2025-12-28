/**
 * UserMenu Component
 * 프로필 드롭다운 메뉴 - 픽셀 아바타 + 테마 토글
 */

import { useStore } from '@/stores/store';
import { logout } from '@/services/firebase';
import { useTheme } from '@/hooks/useTheme';
import { PixelAvatar } from '@/components/PixelAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, ChevronDown, Sun, Moon } from 'lucide-react';

export function UserMenu() {
  const { user } = useStore();
  const { isDark, toggleTheme } = useTheme();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          {/* 픽셀 아바타 - 사용자 uid 기반 자동 생성 */}
          <PixelAvatar userId={user.uid} size={32} />
          <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[100px] truncate">
            {user.displayName || user.email?.split('@')[0]}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{user.displayName || 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {isDark ? (
            <Sun className="h-4 w-4 mr-2 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 mr-2" />
          )}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
