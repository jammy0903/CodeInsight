/**
 * Python Language Course
 */

import type { Course, Day } from '../types';
import { pythonMeta } from './_meta';
import { day01 } from './day01';

// 모든 Day를 배열로
const days: Day[] = [
  day01,
  // day02, day03, ... 추가 시 여기에
];

// Python 코스 전체
export const pythonCourse: Course = {
  language: pythonMeta,
  days,
};

// 개별 export
export { pythonMeta } from './_meta';
export { day01 } from './day01';

// Day 번호로 찾기
export function getPythonDay(dayNumber: number): Day | undefined {
  return days.find((d) => d.day === dayNumber);
}
