/**
 * PixelAvatar Component
 * 시드 기반 자동 생성 픽셀 아바타
 *
 * @description
 * - boring-avatars 라이브러리 사용
 * - seed(닉네임) 해시로 고유한 패턴 생성
 * - 사이버펑크 테마 색상 적용
 *
 * WHY: userId → seed로 변경
 * - UUID 대신 nickname을 사용자 식별자로 사용
 * - 동일한 닉네임 = 동일한 아바타 (일관성)
 *
 * @see CustomPixelEditor - Phase 2에서 직접 그리기 기능 추가 예정
 */

import { memo } from 'react';
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
  /** 아바타 생성 시드 (nickname 권장) */
  seed: string;
  /** 아바타 크기 (px) */
  size?: number;
  /** 아바타 변형 스타일 */
  variant?: 'pixel' | 'beam' | 'bauhaus' | 'ring' | 'sunset';
  /** 추가 CSS 클래스 */
  className?: string;
}

export const PixelAvatar = memo(function PixelAvatar({
  seed,
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
        name={seed}
        variant={variant}
        colors={CYBER_COLORS}
      />
    </div>
  );
});
