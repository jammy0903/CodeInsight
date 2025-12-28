/**
 * C Day 3: 포인터 역참조
 */

import type { Day } from '../types';

export const day03: Day = {
  day: 3,
  title: '포인터 역참조',
  concept: '*p = "p가 가리키는 곳의 값"',

  code: `int a = 10;
int *p = &a;
*p = 20;`,

  steps: [
    {
      stepIndex: 0,
      line: 1,
      explanation: 'a에 10을 저장합니다.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'a', value: 10, address: '0x1000' },
      ],
    },
    {
      stepIndex: 1,
      line: 2,
      explanation: 'p에 a의 주소를 저장합니다. 이제 p는 a를 가리킵니다.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'p', value: '0x1000', address: '0x1004', pointsTo: 'a' },
      ],
    },
    {
      stepIndex: 2,
      line: 3,
      explanation: '*p는 "p가 가리키는 곳"입니다. p가 a를 가리키므로, *p = 20은 a를 20으로 바꿉니다.',
      memoryChanges: [
        { type: 'stack', action: 'update', name: 'a', value: 20, address: '0x1000' },
      ],
    },
  ],

  quiz: {
    question: '마지막 줄 실행 후 a의 값은?',
    options: [
      { label: '10', value: '10' },
      { label: '20', value: '20' },
      { label: '0x1000', value: '0x1000' },
    ],
    correctIndex: 1,
    explanation: '*p = 20은 p가 가리키는 a의 값을 20으로 변경합니다. p 자체는 변하지 않아요.',
  },

  commonMistakes: [
    '*p = 20이 p의 값을 바꾼다고 착각하는 경우가 많아요. p는 여전히 0x1000입니다. 바뀌는 건 a예요.',
    '*는 "역참조 연산자"입니다. p에 저장된 주소로 가서 그 값을 읽거나 쓰라는 뜻이에요.',
  ],
};
