/**
 * ContainerBox - STL 컨테이너 전용 렌더링
 *
 * vector: 요소 셀 + capacity 빈 슬롯
 * string: 문자열 + 길이
 */

import { memo } from 'react';

interface ContainerInfo {
  containerType: 'vector' | 'string' | 'map' | 'set' | 'array';
  size: number;
  capacity?: number;
  elements?: Array<{ index: number; value: string; type: string }>;
}

interface ContainerBoxProps {
  name: string;
  type: string;
  value: unknown;
  containerInfo: ContainerInfo;
}

export const ContainerBox = memo(function ContainerBox({
  name,
  type,
  value,
  containerInfo,
}: ContainerBoxProps) {
  const { containerType, size, capacity, elements } = containerInfo;

  if (containerType === 'vector') {
    const cap = capacity ?? size;
    const emptySlots = Math.max(0, cap - size);
    return (
      <div className="rounded-lg border border-purple-300 bg-purple-50/50 p-2">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-purple-800">{name}</span>
          <span className="text-[10px] text-purple-500 font-mono">{type}</span>
        </div>
        <div className="text-[10px] text-purple-600 mb-1">
          size: {size} / capacity: {cap}
        </div>
        <div className="flex gap-0.5 flex-wrap">
          {elements?.map((el, i) => (
            <div
              key={i}
              className="px-1.5 py-0.5 rounded text-xs font-mono border border-purple-200 bg-white text-purple-900"
            >
              {el.value}
            </div>
          )) ?? (
            // Fallback when elements not available
            <span className="text-xs text-purple-600 font-mono">[{size} items]</span>
          )}
          {Array.from({ length: Math.min(emptySlots, 4) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="px-1.5 py-0.5 rounded text-xs font-mono border border-dashed border-purple-200 bg-purple-50/30 text-purple-300"
            >
              _
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (containerType === 'string') {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-emerald-800">{name}</span>
          <span className="text-[10px] text-emerald-500">string</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-900">
            &quot;{String(value)}&quot;
          </span>
          <span className="text-[10px] text-emerald-500">(len: {size})</span>
        </div>
      </div>
    );
  }

  // Fallback for map/set/array
  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50/50 p-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-slate-800">{name}</span>
        <span className="text-[10px] text-slate-500 font-mono">{type}</span>
      </div>
      <span className="text-xs font-mono text-slate-700">{String(value)}</span>
    </div>
  );
});
