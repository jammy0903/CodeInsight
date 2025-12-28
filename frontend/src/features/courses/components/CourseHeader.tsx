/**
 * CourseHeader - 언어 설명 + 진행률 표시
 */

import type { LanguageMeta } from '@/data/courses';

interface CourseHeaderProps {
  language: LanguageMeta;
  completedCount: number;
  totalDays: number;
}

export function CourseHeader({
  language,
  completedCount,
  totalDays,
}: CourseHeaderProps) {
  const progressPercent =
    totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  return (
    <div className="bg-card rounded-lg p-4 border">
      <div className="flex items-center justify-between">
        {/* 언어 정보 */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>{language.icon}</span>
            <span>{language.name}</span>
          </h2>
          <p className="text-muted-foreground text-sm">{language.description}</p>
        </div>

        {/* 진행률 */}
        <div className="text-right">
          <div className="text-2xl font-bold">
            {completedCount}
            <span className="text-muted-foreground text-lg font-normal">
              /{totalDays}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{progressPercent}% 완료</div>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
