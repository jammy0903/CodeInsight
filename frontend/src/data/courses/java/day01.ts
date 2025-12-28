/**
 * Java Day 1: 참조 타입
 */

import type { Day } from '../types';

export const day01: Day = {
  day: 1,
  title: '참조 타입',
  concept: '변수는 객체를 "가리키는" 참조를 저장한다',

  code: `String s1 = "Hello";
String s2 = s1;`,

  steps: [
    {
      stepIndex: 0,
      line: 1,
      explanation: 's1 변수가 "Hello" 문자열 객체를 가리킵니다. 객체는 Heap에, 참조는 Stack에 저장됩니다.',
      memoryChanges: [
        { type: 'heap', action: 'create', name: '"Hello"', address: '0x2000' },
        { type: 'stack', action: 'create', name: 's1', value: '0x2000', pointsTo: '"Hello"' },
      ],
    },
    {
      stepIndex: 1,
      line: 2,
      explanation: 's2에 s1의 값(참조)을 복사합니다. s2도 같은 "Hello" 객체를 가리킵니다.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 's2', value: '0x2000', pointsTo: '"Hello"' },
      ],
    },
  ],

  quiz: {
    question: 's1 == s2의 결과는?',
    options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' },
      { label: '컴파일 에러', value: 'error' },
    ],
    correctIndex: 0,
    explanation: 's1과 s2는 같은 객체를 가리키므로 == 비교는 true입니다. 하지만 내용 비교는 equals()를 써야 해요.',
  },

  commonMistakes: [
    '변수가 객체 자체라고 생각하지 마세요. 변수는 객체의 "주소(참조)"를 저장합니다.',
    '기본 타입(int, double)과 참조 타입(String, Object)의 동작이 다릅니다.',
  ],
};
