/**
 * SelectedCodeBadge - 선택된 코드 표시 + 취소 버튼
 */

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CodeSelection } from '../../types';

interface SelectedCodeBadgeProps {
  selection: CodeSelection;
  onClear: () => void;
}

export function SelectedCodeBadge({ selection, onClear }: SelectedCodeBadgeProps) {
  const displayText = selection.text.length > 30
    ? `${selection.text.slice(0, 30)}...`
    : selection.text;

  return (
    <div className="absolute top-3 left-3 z-10">
      <Badge
        variant="secondary"
        className="gap-2 pr-1 bg-neon-orange/20 border-neon-orange text-neon-orange shadow-sm"
      >
        <span className="text-xs flex items-center gap-1.5">
          <span className="font-mono text-[10px] opacity-70">
            Line {selection.lineStart}
            {selection.lineEnd !== selection.lineStart && `-${selection.lineEnd}`}
          </span>
          <span className="text-xs">·</span>
          <code className="font-mono">{displayText}</code>
        </span>
        <button
          onClick={onClear}
          className="hover:bg-neon-orange/30 rounded-full p-0.5 transition-colors"
          aria-label="Clear selection"
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    </div>
  );
}
