/**
 * CourseMemoryView - 메모리 시각화 (변수 vs 메모리 분리)
 *
 * 새로운 레이아웃:
 * 1. VariablesPanel (상단) - 변수는 메모리에 저장되지 않음 (단순 별칭)
 * 2. MemoryPanel (하단) - Stack/Heap 명확히 분리, 실제 메모리 블록 표시
 * 3. PointerLines (오버레이) - 변수 → 메모리 연결선
 *
 * 핵심 개념:
 * - 변수 = 메모리 주소의 값을 참조하는 이름 (메모리에 저장 안 됨)
 * - 메모리 = 실제 값이 저장되는 곳 (주소 + 값)
 * - 포인터 = 주소를 값으로 갖는 변수
 *
 * 색상 체계: 연한 형광펜 느낌 (light neon highlighter)
 * - Stack: 부드러운 보라색 계열
 * - Heap: 부드러운 초록색 계열
 * - 포인터: 밝은 오렌지/시안/핑크 계열
 * - 변경: 밝은 노란색
 */

import { useState } from 'react';
import { VariablesPanel } from './VariablesPanel';
import { MemoryPanel } from './MemoryPanel';
import type { LessonMemoryBlock } from '../../hooks/useLessonMemory';

interface CourseMemoryViewProps {
  stack: LessonMemoryBlock[];
  heap: LessonMemoryBlock[];
  changedBlocks: string[];
}

export function CourseMemoryView({
  stack,
  heap,
  changedBlocks,
}: CourseMemoryViewProps) {
  const [hoveredVariable, setHoveredVariable] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 상단: 변수 영역 (메모리 아님) */}
      <VariablesPanel
        stack={stack}
        heap={heap}
        changedBlocks={changedBlocks}
        onVariableHover={setHoveredVariable}
      />

      {/* 하단: 메모리 영역 (실제 값 저장) */}
      <MemoryPanel
        stack={stack}
        heap={heap}
        changedBlocks={changedBlocks}
        hoveredVariable={hoveredVariable}
      />
    </div>
  );
}
