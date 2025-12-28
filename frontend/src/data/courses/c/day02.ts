/**
 * C Day 2: 포인터는 값이다
 */

import type { Day } from '../types';

export const day02: Day = {
  day: 2,
  title: '포인터는 값이다',
  concept: '포인터 = 주소를 저장하는 변수',

  code: `int a = 10;
int *p = &a;`,

  steps: [
    {
      stepIndex: 0,
      line: 1,
      explanation: 'int형 변수 a에 10을 저장합니다.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'a', value: 10, address: '0x1000' },
      ],
    },
    {
      stepIndex: 1,
      line: 2,
      explanation: '포인터 p에 a의 주소(0x1000)를 저장합니다. p도 변수이고, 주소값이라는 "숫자"를 담고 있어요.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'p', value: '0x1000', address: '0x1004', pointsTo: 'a' },
      ],
    },
  ],

  quiz: {
    question: 'p에 저장된 값은?',
    options: [
      { label: '10', value: '10' },
      { label: '0x1000', value: '0x1000' },
      { label: 'a', value: 'a' },
    ],
    correctIndex: 1,
    explanation: 'p는 a의 주소인 0x1000을 저장합니다. 포인터는 "가리킨다"고 표현하지만, 실제로는 주소라는 숫자를 담는 변수예요.',
  },

  commonMistakes: [
    '포인터가 특별한 무언가라고 생각하지 마세요. 그냥 주소를 담는 평범한 변수입니다.',
    '&a는 "a의 주소"를 의미합니다. 주소 연산자(&)를 기억하세요.',
  ],
};
