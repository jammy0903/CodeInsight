import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useStepNavigation } from '../useStepNavigation';

describe('useStepNavigation', () => {
  it('스텝을 앞뒤로 이동하고 처음에서는 뒤로 가지 않는다', () => {
    const { result } = renderHook(() => useStepNavigation({ stepCount: 3 }));
    expect(result.current.canGoPrev).toBe(false);

    act(() => result.current.goPrev());
    expect(result.current.stepIndex).toBe(0);

    act(() => result.current.goNext());
    expect(result.current.stepIndex).toBe(1);
    expect(result.current.canGoPrev).toBe(true);
  });

  it('마지막 스텝에서 다음은 퀴즈로 간다', () => {
    const onQuiz = vi.fn();
    const { result } = renderHook(() => useStepNavigation({ stepCount: 2, onQuiz }));

    act(() => result.current.goNext());
    expect(result.current.isLast).toBe(true);

    act(() => result.current.goNext());
    expect(onQuiz).toHaveBeenCalledTimes(1);
    expect(result.current.stepIndex).toBe(1);
  });

  it('스텝 수가 줄어도 범위를 벗어나지 않는다', () => {
    let count = 5;
    const { result, rerender } = renderHook(() => useStepNavigation({ stepCount: count }));
    act(() => result.current.goNext());
    act(() => result.current.goNext());
    act(() => result.current.goNext());
    count = 2;
    rerender();
    expect(result.current.stepIndex).toBe(1);
  });
});
