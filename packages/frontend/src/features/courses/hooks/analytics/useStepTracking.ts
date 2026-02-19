/**
 * useStepTracking — 스텝별 체류 시간 + 뒤로가기 감지
 */

import { useRef, useCallback, useEffect } from 'react';

export interface StepData {
  startTime: number;
  duration: number;
  wentBack: boolean;
  visHoverCount: number;
  visClickCount: number;
  aiQuestionCount: number;
  codeSelections: number;
  scrollEvents: number;
}

function createEmptyStepData(): StepData {
  return {
    startTime: Date.now(),
    duration: 0,
    wentBack: false,
    visHoverCount: 0,
    visClickCount: 0,
    aiQuestionCount: 0,
    codeSelections: 0,
    scrollEvents: 0,
  };
}

export function useStepTracking(currentStepIndex: number) {
  const stepDataRef = useRef<Map<number, StepData>>(new Map());
  const stepStartTimeRef = useRef<number>(0);
  const prevStepIndexRef = useRef<number>(currentStepIndex);

  useEffect(() => {
    if (stepStartTimeRef.current === 0) {
      stepStartTimeRef.current = Date.now();
    }
  }, []);

  /** 현재 스텝 duration 업데이트 */
  const updateCurrentStepDuration = useCallback(() => {
    const now = Date.now();
    const elapsed = now - stepStartTimeRef.current;
    const currentData = stepDataRef.current.get(prevStepIndexRef.current) || createEmptyStepData();
    currentData.duration += elapsed;
    stepDataRef.current.set(prevStepIndexRef.current, currentData);
    stepStartTimeRef.current = now;
  }, []);

  /** 스텝 변경 처리 */
  const handleStepChange = useCallback((newStepIndex: number) => {
    const prevIndex = prevStepIndexRef.current;
    if (prevIndex === newStepIndex) return;

    updateCurrentStepDuration();

    // 뒤로가기 감지
    if (newStepIndex < prevIndex) {
      const currentData = stepDataRef.current.get(newStepIndex) || createEmptyStepData();
      currentData.wentBack = true;
      stepDataRef.current.set(newStepIndex, currentData);
    }

    // 새 스텝 데이터 초기화
    if (!stepDataRef.current.has(newStepIndex)) {
      stepDataRef.current.set(newStepIndex, createEmptyStepData());
    }

    prevStepIndexRef.current = newStepIndex;
    stepStartTimeRef.current = Date.now();
  }, [updateCurrentStepDuration]);

  /** 상태 초기화 */
  const clearStepData = useCallback(() => {
    stepDataRef.current.clear();
  }, []);

  /** 이벤트 기록 함수들 */
  const recordVisHover = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.visHoverCount++;
  }, [currentStepIndex]);

  const recordVisClick = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.visClickCount++;
  }, [currentStepIndex]);

  const recordAIQuestion = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.aiQuestionCount++;
  }, [currentStepIndex]);

  const recordCodeSelection = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.codeSelections++;
  }, [currentStepIndex]);

  const recordScroll = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.scrollEvents++;
  }, [currentStepIndex]);

  return {
    stepDataRef,
    stepStartTimeRef,
    updateCurrentStepDuration,
    handleStepChange,
    clearStepData,
    recordVisHover,
    recordVisClick,
    recordAIQuestion,
    recordCodeSelection,
    recordScroll,
  };
}
