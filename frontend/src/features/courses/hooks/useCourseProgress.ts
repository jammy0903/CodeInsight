/**
 * useCourseProgress - 코스 진행 상태 관리 (localStorage)
 */

import { useState, useEffect, useCallback } from 'react';
import type { Language, CourseProgress } from '@/data/courses';

const STORAGE_KEY = 'course-progress';

type AllProgress = Partial<Record<Language, CourseProgress>>;

function getStoredProgress(): AllProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: AllProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function createDefaultProgress(language: Language): CourseProgress {
  return {
    language,
    completedDays: [],
    currentDay: 1,
  };
}

export function useCourseProgress(language: Language) {
  const [allProgress, setAllProgress] = useState<AllProgress>(getStoredProgress);

  const progress: CourseProgress =
    allProgress[language] ?? createDefaultProgress(language);

  // localStorage 동기화
  useEffect(() => {
    saveProgress(allProgress);
  }, [allProgress]);

  const markDayComplete = useCallback(
    (day: number) => {
      setAllProgress((prev) => {
        const current = prev[language] ?? createDefaultProgress(language);

        // 이미 완료된 경우 무시
        if (current.completedDays.includes(day)) {
          return prev;
        }

        return {
          ...prev,
          [language]: {
            ...current,
            completedDays: [...current.completedDays, day].sort((a, b) => a - b),
            currentDay: Math.max(current.currentDay, day + 1),
          },
        };
      });
    },
    [language]
  );

  const resetProgress = useCallback(() => {
    setAllProgress((prev) => ({
      ...prev,
      [language]: createDefaultProgress(language),
    }));
  }, [language]);

  return {
    progress,
    markDayComplete,
    resetProgress,
  };
}
