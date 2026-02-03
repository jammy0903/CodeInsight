/**
 * LessonBottomNav - 하단 플로팅 스텝 네비게이션 바
 *
 * 데스크톱/모바일 공용. 화면 하단에 고정되어 이전/다음 스텝 이동.
 */

import { useTheme } from '@/hooks';
import { StepNavigationArrows } from './StepNavigationArrows';

interface LessonBottomNavProps {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  nextLabel: string;
}

export function LessonBottomNav({
  onPrev,
  onNext,
  canGoPrev,
  nextLabel,
}: LessonBottomNavProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        padding: '6px 12px',
        backgroundColor: resolvedTheme === 'dark'
          ? 'rgba(13, 21, 37, 0.85)'
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '20px',
        border: `1px solid ${resolvedTheme === 'dark'
          ? 'rgba(26, 37, 64, 0.6)'
          : 'rgba(229, 229, 229, 0.6)'}`,
        boxShadow: resolvedTheme === 'dark'
          ? '0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          : '0 4px 24px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        maxWidth: '320px',
      }}
    >
      <div style={{ transform: 'scale(0.85)' }}>
        <StepNavigationArrows
          onPrev={onPrev}
          onNext={onNext}
          canGoPrev={canGoPrev}
          canGoNext={true}
          nextLabel={nextLabel}
          size="sm"
          variant="inline"
        />
      </div>
    </div>
  );
}
