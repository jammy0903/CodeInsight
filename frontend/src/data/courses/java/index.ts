/**
 * Java Language Course
 */

import type { Course, Day } from '../types';
import { javaMeta } from './_meta';
import { day01 } from './day01';

// 모든 Day를 배열로
const days: Day[] = [
  day01,
  // day02, day03, ... 추가 시 여기에
];

// Java 코스 전체
export const javaCourse: Course = {
  language: javaMeta,
  days,
};

// 개별 export
export { javaMeta } from './_meta';
export { day01 } from './day01';

// Day 번호로 찾기
export function getJavaDay(dayNumber: number): Day | undefined {
  return days.find((d) => d.day === dayNumber);
}
