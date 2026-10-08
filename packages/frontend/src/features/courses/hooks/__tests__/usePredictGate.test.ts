import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { findPredictGate, usePredictGate } from '../usePredictGate';
import { useProgressStore } from '@/stores/progressStore';
import type { LessonStep } from '@/types';

const predict = { question: 'energy 값은?', options: ['50', '100'], answer: 1 };

// 0: 설명만, 1~3: 시각화 스텝, 2번에 예측 질문
const steps = [
  { line: 1, explanation: '' },
  { line: 2, explanation: '', visualizationType: 'cMemory' },
  { line: 3, explanation: '', visualizationType: 'cMemory', predict },
  { line: 4, explanation: '', visualizationType: 'cMemory' },
] as LessonStep[];

const vizStepIndices = [1, 2, 3];

function makeNav(stepIndex: number, round: 'explanation' | 'visualization' = 'visualization') {
  return {
    round,
    stepIndex,
    totalInRound: round === 'visualization' ? vizStepIndices.length : steps.length,
    actualStepIndex: round === 'visualization' ? vizStepIndices[stepIndex] : stepIndex,
    vizStepIndices,
    goNext: vi.fn(),
    goPrev: vi.fn(),
  };
}

describe('findPredictGate', () => {
  it('다음 시각화 스텝에 predict가 있으면 그 인덱스를 반환한다', () => {
    expect(findPredictGate(steps, makeNav(0), {})).toBe(2);
  });

  it('이미 답한 예측은 다시 막지 않는다', () => {
    expect(findPredictGate(steps, makeNav(0), { 2: 0 })).toBeNull();
  });

  it('설명 라운드에서는 막지 않는다', () => {
    expect(findPredictGate(steps, makeNav(1, 'explanation'), {})).toBeNull();
  });

  it('다음 스텝에 predict가 없거나 마지막 스텝이면 막지 않는다', () => {
    expect(findPredictGate(steps, makeNav(1), {})).toBeNull();
    expect(findPredictGate(steps, makeNav(2), {})).toBeNull();
  });
});

describe('usePredictGate', () => {
  beforeEach(() => {
    useProgressStore.setState({ predictions: {} });
  });

  it('예측 스텝 앞에서 goNext는 이동하지 않고 질문을 띄운다', () => {
    const nav = makeNav(0);
    const { result } = renderHook(() => usePredictGate({ steps, nav, lessonId: 'c-2-4' }));

    act(() => result.current.goNext());

    expect(nav.goNext).not.toHaveBeenCalled();
    expect(result.current.pendingIndex).toBe(2);
    expect(result.current.pendingPredict).toEqual(predict);
  });

  it('질문 중에는 goNext가 무시되고, goPrev는 질문만 닫는다', () => {
    const nav = makeNav(0);
    const { result } = renderHook(() => usePredictGate({ steps, nav, lessonId: 'c-2-4' }));

    act(() => result.current.goNext());
    act(() => result.current.goNext());
    expect(nav.goNext).not.toHaveBeenCalled();

    act(() => result.current.goPrev());
    expect(result.current.pendingIndex).toBeNull();
    expect(nav.goPrev).not.toHaveBeenCalled();
  });

  it('답하면 결과를 기록하고 다음 스텝으로 이동한다', () => {
    const nav = makeNav(0);
    const { result } = renderHook(() => usePredictGate({ steps, nav, lessonId: 'c-2-4' }));

    act(() => result.current.goNext());
    act(() => result.current.answer(0)); // 오답

    expect(nav.goNext).toHaveBeenCalledTimes(1);
    expect(result.current.pendingIndex).toBeNull();
    expect(useProgressStore.getState().predictions['c-2-4']).toEqual({ 2: false });
  });

  it('예측 스텝에 도착하면 내 답과 정답 여부를 피드백으로 준다', () => {
    let nav = makeNav(0);
    const { result, rerender } = renderHook(() => usePredictGate({ steps, nav, lessonId: 'c-2-4' }));

    act(() => result.current.goNext());
    act(() => result.current.answer(1)); // 정답
    nav = makeNav(1); // 부모가 스텝을 옮긴 상태
    rerender();

    expect(result.current.feedback).toEqual({ predict, chosen: 1, correct: true });
  });
});

describe('progressStore.recordPrediction', () => {
  beforeEach(() => {
    useProgressStore.setState({ predictions: {} });
  });

  it('첫 답만 기록하고 이후 답으로 덮어쓰지 않는다', () => {
    const { recordPrediction } = useProgressStore.getState();
    recordPrediction('js-1-4', 4, false);
    recordPrediction('js-1-4', 4, true);
    recordPrediction('js-1-4', 5, true);

    expect(useProgressStore.getState().predictions['js-1-4']).toEqual({ 4: false, 5: true });
  });
});
