/**
 * C Language Course
 */

import type { Course, Day } from '../types';
import { cMeta } from './_meta';
import { day01 } from './day01';
import { day02 } from './day02';
import { day03 } from './day03';

// 모든 Day를 배열로
const days: Day[] = [
  day01,
  day02,
  day03,
  // day04, day05, ... 추가 시 여기에
];

// C 코스 전체
export const cCourse: Course = {
  language: cMeta,
  days,
};

// 개별 export
export { cMeta } from './_meta';
export { day01 } from './day01';
export { day02 } from './day02';
export { day03 } from './day03';

// Day 번호로 찾기
export function getCDay(dayNumber: number): Day | undefined {
  return days.find((d) => d.day === dayNumber);
}
