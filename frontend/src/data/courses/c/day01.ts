/**
 * C Day 1: 변수와 메모리 주소
 */

import type { Day } from '../types';

export const day01: Day = {
  day: 1,
  title: '변수와 메모리 주소',
  concept: '변수 = 메모리에 이름 붙인 공간',

  code: `int a = 10;
int b = 20;`,

  steps: [
    {
      stepIndex: 0,
      line: 1,
      explanation: 'int형 변수 a를 선언하고 10을 저장합니다. 메모리에 4바이트 공간이 할당됩니다.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'a', value: 10, address: '0x1000' },
      ],
    },
    {
      stepIndex: 1,
      line: 2,
      explanation: 'int형 변수 b를 선언하고 20을 저장합니다. a 바로 다음 주소에 할당됩니다.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'b', value: 20, address: '0x1004' },
      ],
    },
  ],

  quiz: {
    question: 'a와 b의 주소 차이는?',
    options: [
      { label: '1바이트', value: '1' },
      { label: '4바이트', value: '4' },
      { label: '8바이트', value: '8' },
    ],
    correctIndex: 1,
    explanation: 'int는 4바이트이므로, 연속된 int 변수들은 4바이트 간격으로 배치됩니다.',
  },

  commonMistakes: [
    '변수 이름이 메모리에 저장된다고 생각하지 마세요. 실제로는 값만 저장되고, 이름은 컴파일러만 알아요.',
    '변수의 크기는 타입에 따라 다릅니다. int는 보통 4바이트, char는 1바이트입니다.',
  ],
};
