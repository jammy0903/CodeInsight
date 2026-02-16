/**
 * useFlowDiff Hook
 *
 * 이전 스텝과 현재 스텝 사이의 변경 사항 감지
 * - 생성된 변수
 * - 값이 변경된 변수
 * - 삭제된 변수
 * - 변경 없는 변수
 */

import { useMemo } from 'react';
import type { FlowStep, FlowDiff, FlowVariable } from '@codeinsight/shared';

/**
 * 두 값이 같은지 비교 (배열/객체 포함)
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  // 배열 비교
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => isEqual(val, b[i]));
  }

  // 객체 비교
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    a !== null &&
    b !== null
  ) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}

/**
 * FlowStep 간의 변경 사항 계산
 */
export function calculateFlowDiff(
  prevStep: FlowStep | null,
  currentStep: FlowStep
): FlowDiff {
  // 첫 스텝: 모든 변수가 새로 생성됨
  if (!prevStep) {
    return {
      created: currentStep.variables.map((v) => v.id),
      updated: [],
      deleted: [],
      unchanged: [],
    };
  }

  const prevMap = new Map<string, FlowVariable>(
    prevStep.variables.map((v) => [v.id, v])
  );
  const currMap = new Map<string, FlowVariable>(
    currentStep.variables.map((v) => [v.id, v])
  );

  const created: string[] = [];
  const updated: string[] = [];
  const deleted: string[] = [];
  const unchanged: string[] = [];

  // 현재 변수들 검사: 생성 또는 업데이트
  currentStep.variables.forEach((curr) => {
    const prev = prevMap.get(curr.id);

    if (!prev) {
      // 이전에 없었음 → 생성
      created.push(curr.id);
    } else if (!isEqual(prev.value, curr.value)) {
      // 값이 다름 → 업데이트
      updated.push(curr.id);
    } else {
      // 값이 같음 → 변경 없음
      unchanged.push(curr.id);
    }
  });

  // 이전 변수들 중 현재에 없는 것 → 삭제
  prevStep.variables.forEach((prev) => {
    if (!currMap.has(prev.id)) {
      deleted.push(prev.id);
    }
  });

  return { created, updated, deleted, unchanged };
}

/**
 * useFlowDiff Hook
 *
 * @param prevStep 이전 스텝 (null이면 첫 스텝)
 * @param currentStep 현재 스텝
 * @returns FlowDiff 객체
 */
export function useFlowDiff(
  prevStep: FlowStep | null,
  currentStep: FlowStep
): FlowDiff {
  return useMemo(
    () => calculateFlowDiff(prevStep, currentStep),
    [prevStep, currentStep]
  );
}
