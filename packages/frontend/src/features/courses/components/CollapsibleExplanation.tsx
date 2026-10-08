/**
 * CollapsibleExplanation - 설명을 일정 높이까지만 보여주고 넘치면 "더 보기"
 *
 * WHY: 설명과 시각화를 한 화면에 두기 때문에, 긴 설명이 시각화를 화면 밖으로 밀어내지 않게 한다.
 * 스텝이 바뀌면 부모가 key로 다시 마운트해 접힌 상태로 돌아간다.
 */

import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

const COLLAPSED_HEIGHT_PX = 168;

interface CollapsibleExplanationProps {
  children: ReactNode;
}

export function CollapsibleExplanation({ children }: CollapsibleExplanationProps) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // 내용(애니메이션·이미지 로딩 포함) 높이가 바뀔 때마다 넘침 여부를 다시 잰다
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollHeight > COLLAPSED_HEIGHT_PX + 8);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const collapsed = overflowing && !expanded;

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className="overflow-hidden"
        style={collapsed ? { maxHeight: COLLAPSED_HEIGHT_PX } : undefined}
      >
        {children}
      </div>
      {collapsed && (
        <div className="pointer-events-none absolute inset-x-0 bottom-7 h-12 bg-gradient-to-t from-[var(--theme-lesson-panel-bg)] to-transparent" />
      )}
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--theme-dashboard-accent)] hover:underline"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? t('lesson.show_less') : t('lesson.show_more')}
        </button>
      )}
    </div>
  );
}
