/**
 * resolveStepLines - step.code → step.line 런타임 계산
 *
 * Lesson JSON의 step.code (매칭 키)로부터 실제 라인 번호를 계산합니다.
 * 이 함수를 레슨 로드 시 한 번 실행하면, 이후 모든 코드가
 * 기존과 동일하게 step.line을 사용할 수 있습니다.
 */
import type { LessonStep } from '@/types';

/**
 * step.code가 있고 step.line이 없는 스텝들의 line과 highlight를 계산합니다.
 * 이미 line이 있는 스텝(시뮬레이터 결과 등)은 그대로 유지합니다.
 */
export function resolveStepLines(steps: LessonStep[], fullCode: string): LessonStep[] {
  if (!steps.length || !fullCode) return steps;

  const codeLines = fullCode.split('\n');
  const trimmedLines = codeLines.map(l => l.trim());

  return steps.map(step => {
    // 이미 line이 있으면 (시뮬레이터 결과 등) 그대로 유지
    if (step.line !== undefined) {
      return step;
    }

    // step.code가 없으면 resolve 불가
    const stepCode = step.code?.trim();
    if (!stepCode) return step;

    // N번째 출현 찾기
    const occurrence = step.occurrence ?? 1;
    let count = 0;
    let resolvedLine = -1;

    for (let i = 0; i < trimmedLines.length; i++) {
      if (trimmedLines[i] === stepCode) {
        count++;
        if (count === occurrence) {
          resolvedLine = i + 1; // 1-indexed
          break;
        }
      }
    }

    if (resolvedLine === -1) return step;

    // highlight 계산
    let highlight: number[] | undefined;
    const highlightOffset = step.highlightOffset;

    if (highlightOffset && Array.isArray(highlightOffset)) {
      // 상대 오프셋 → 절대 라인번호
      highlight = highlightOffset.map(offset => resolvedLine + offset);
    } else if (!step.highlight) {
      // 기본값: 현재 라인만 하이라이트
      highlight = [resolvedLine];
    }

    return {
      ...step,
      line: resolvedLine,
      highlight: highlight ?? step.highlight,
    };
  });
}
