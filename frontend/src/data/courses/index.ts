/**
 * Course Data - 통합 Export
 *
 * 사용법:
 * import { getCourse, getDay, getAllLanguages } from '@/data/courses';
 *
 * const cCourse = getCourse('c');
 * const day3 = getDay('c', 3);
 * const languages = getAllLanguages();
 */

import type { Language, LanguageMeta, Course, Day, DayQuery } from './types';

// 언어별 코스 import
import { cCourse, cMeta, getCDay } from './c';
import { javaCourse, javaMeta, getJavaDay } from './java';
import { pythonCourse, pythonMeta, getPythonDay } from './python';

// === 타입 re-export ===
export type {
  Language,
  LanguageMeta,
  Course,
  Day,
  DayQuery,
  Step,
  MemoryChange,
  Quiz,
  QuizOption,
  CourseProgress,
} from './types';

// === 언어별 코스 직접 export ===
export { cCourse, cMeta } from './c';
export { javaCourse, javaMeta } from './java';
export { pythonCourse, pythonMeta } from './python';

// === 모든 코스 ===
const allCourses: Record<Language, Course> = {
  c: cCourse,
  java: javaCourse,
  python: pythonCourse,
};

// === 모든 언어 메타 ===
const allLanguages: LanguageMeta[] = [cMeta, javaMeta, pythonMeta];

// === 유틸리티 함수 ===

/**
 * 모든 지원 언어 목록 반환
 */
export function getAllLanguages(): LanguageMeta[] {
  return allLanguages;
}

/**
 * 특정 언어의 코스 전체 반환
 */
export function getCourse(language: Language): Course | undefined {
  return allCourses[language];
}

/**
 * 특정 언어의 특정 Day 반환
 */
export function getDay(language: Language, dayNumber: number): Day | undefined {
  switch (language) {
    case 'c':
      return getCDay(dayNumber);
    case 'java':
      return getJavaDay(dayNumber);
    case 'python':
      return getPythonDay(dayNumber);
    default:
      return undefined;
  }
}

/**
 * DayQuery 객체로 Day 찾기
 */
export function getDayByQuery(query: DayQuery): Day | undefined {
  return getDay(query.language, query.day);
}

/**
 * 특정 언어의 전체 Day 수 반환
 */
export function getTotalDays(language: Language): number {
  return allCourses[language]?.language.totalDays ?? 0;
}

/**
 * 언어 ID로 메타 정보 가져오기
 */
export function getLanguageMeta(language: Language): LanguageMeta | undefined {
  return allLanguages.find((l) => l.id === language);
}

// === 새 언어 추가 가이드 ===
/*
 * 새 언어를 추가하려면:
 *
 * 1. data/courses/{language}/ 폴더 생성
 *
 * 2. _meta.ts 작성:
 *    export const {language}Meta: LanguageMeta = {
 *      id: '{language}',
 *      name: '언어명',
 *      icon: '이모지',
 *      description: '설명',
 *      codeBlockLang: '{language}',
 *      totalDays: N,
 *    };
 *
 * 3. day01.ts, day02.ts, ... 작성
 *
 * 4. index.ts 작성 (c/index.ts 참고)
 *
 * 5. 이 파일(courses/index.ts)에서:
 *    - import 추가
 *    - allCourses에 추가
 *    - allLanguages에 추가
 *    - getDay switch case 추가
 *    - types.ts의 Language 타입에 추가
 */
