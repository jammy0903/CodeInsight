/**
 * StepNavigationArrows - 레슨 스텝 이동 화살표 버튼
 *
 * 레슨페이지에서 이전/다음 스텝으로 이동할 때 사용하는 공통 컴포넌트
 */

import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StepNavigationArrowsProps {
  /** 이전 버튼 클릭 핸들러 */
  onPrev: () => void;
  /** 다음 버튼 클릭 핸들러 */
  onNext: () => void;
  /** 이전 버튼 비활성화 여부 */
  canGoPrev: boolean;
  /** 다음 버튼 비활성화 여부 */
  canGoNext: boolean;
  /** 다음 버튼 라벨 (기본: "다음") */
  nextLabel?: string;
  /** 이전 버튼 라벨 (기본: "이전") */
  prevLabel?: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 라벨 표시 여부 */
  showLabels?: boolean;
  /** 표시 방식 */
  variant?: 'desktop' | 'mobile' | 'inline';
}

export function StepNavigationArrows({
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  nextLabel,
  prevLabel,
  className = '',
  size = 'md',
  showLabels = true,
  variant = 'inline',
}: StepNavigationArrowsProps) {
  const { t } = useTranslation();
  const resolvedNextLabel = nextLabel || t('common.next');
  const resolvedPrevLabel = prevLabel || t('common.previous');

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const baseButtonClass = `
    flex items-center justify-center rounded-lg font-semibold
    transition-all duration-200
    ${sizeClasses[size]}
  `;

  const enabledClass = `
    bg-[var(--theme-lesson-button-secondary-bg)]
    border border-[var(--theme-lesson-button-secondary-border)]
    text-[var(--theme-lesson-button-secondary-text)]
    hover:bg-[var(--theme-lesson-button-secondary-hover-bg)]
    hover:shadow-md
    active:scale-95
  `;

  const disabledClass = `
    bg-gray-100 dark:bg-gray-800
    border border-gray-200 dark:border-gray-700
    text-gray-400 dark:text-gray-600
    cursor-not-allowed
    opacity-50
  `;

  // Mobile variant: 전체 너비 버튼, 더 큰 터치 영역
  if (variant === 'mobile') {
    return (
      <div className={`flex gap-2 w-full ${className}`}>
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all ${
            canGoPrev ? enabledClass : disabledClass
          }`}
          aria-label={resolvedPrevLabel}
        >
          <ChevronLeft className="w-5 h-5" />
          {showLabels && <span>{resolvedPrevLabel}</span>}
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all ${
            canGoNext ? enabledClass : disabledClass
          }`}
          aria-label={resolvedNextLabel}
        >
          {showLabels && <span>{resolvedNextLabel}</span>}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Desktop variant: 하단 고정바 스타일
  if (variant === 'desktop') {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center py-4 ${className}`}
        style={{
          background: 'var(--theme-lesson-memory-bg)',
          borderTop: '1px solid var(--theme-lesson-panel-border)',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className={`${baseButtonClass} ${canGoPrev ? enabledClass : disabledClass}`}
            aria-label={resolvedPrevLabel}
          >
            <ChevronLeft className={iconSizes[size]} />
            {showLabels && <span>{resolvedPrevLabel}</span>}
          </button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`${baseButtonClass} ${canGoNext ? enabledClass : disabledClass}`}
            aria-label={resolvedNextLabel}
          >
            {showLabels && <span>{resolvedNextLabel}</span>}
            <ChevronRight className={iconSizes[size]} />
          </button>
        </div>
      </div>
    );
  }

  // Inline variant (기본): 일반 인라인 버튼
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className={`${baseButtonClass} ${canGoPrev ? enabledClass : disabledClass}`}
        aria-label={resolvedPrevLabel}
      >
        <ChevronLeft className={iconSizes[size]} />
        {showLabels && <span>{resolvedPrevLabel}</span>}
      </button>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`${baseButtonClass} ${canGoNext ? enabledClass : disabledClass}`}
        aria-label={resolvedNextLabel}
      >
        {showLabels && <span>{resolvedNextLabel}</span>}
        <ChevronRight className={iconSizes[size]} />
      </button>
    </div>
  );
}
