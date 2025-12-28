/**
 * PixelAvatar Component
 * 사용자 ID 기반 자동 생성 픽셀 아바타
 *
 * @description
 * - boring-avatars 라이브러리 사용
 * - 사용자 ID/이메일 해시로 고유한 패턴 생성
 * - 사이버펑크 테마 색상 적용
 *
 * @see CustomPixelEditor - Phase 2에서 직접 그리기 기능 추가 예정
 */

import Avatar from 'boring-avatars';

// 사이버펑크 테마 색상 팔레트
const CYBER_COLORS = [
  '#00e5ff', // neon cyan (primary)
  '#00ff88', // neon green
  '#ff00ff', // neon magenta
  '#0080ff', // neon blue
  '#ffaa00', // warning/gold
];

interface PixelAvatarProps {
  /** 사용자 고유 식별자 (uid, email 등) */
  userId: string;
  /** 아바타 크기 (px) */
  size?: number;
  /** 아바타 변형 스타일 */
  variant?: 'pixel' | 'beam' | 'bauhaus' | 'ring' | 'sunset';
  /** 추가 CSS 클래스 */
  className?: string;
}

export function PixelAvatar({
  userId,
  size = 24,
  variant = 'pixel',
  className = '',
}: PixelAvatarProps) {
  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={userId}
        variant={variant}
        colors={CYBER_COLORS}
      />
    </div>
  );
}
