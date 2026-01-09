/**
 * CourseGrid - 공통 Grid 컨테이너
 *
 * 챕터 카드, 레슨 카드 모두 이 Grid에서 사용
 * 반응형: 1열(모바일) → 2열(태블릿) → 3열(데스크톱)
 */

import { ReactNode } from 'react';

interface CourseGridProps {
  children: ReactNode;
  className?: string;
}

export function CourseGrid({ children, className = '' }: CourseGridProps) {
  return (
    <div
      className={`
        grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
        ${className}
      `}
      style={{ gap: '24px' }}
    >
      {children}
    </div>
  );
}
