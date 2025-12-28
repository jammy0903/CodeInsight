/**
 * Python Day 1: 변수는 이름표다
 */

import type { Day } from '../types';

export const day01: Day = {
  day: 1,
  title: '변수는 이름표다',
  concept: '변수는 값을 저장하는 게 아니라, 객체에 붙인 이름표',

  code: `a = [1, 2, 3]
b = a`,

  steps: [
    {
      stepIndex: 0,
      line: 1,
      explanation: '리스트 [1, 2, 3]이 메모리에 생성되고, a라는 이름표가 붙습니다.',
      memoryChanges: [
        { type: 'heap', action: 'create', name: '[1, 2, 3]', address: '0x2000' },
        { type: 'stack', action: 'create', name: 'a', value: '0x2000', pointsTo: '[1, 2, 3]' },
      ],
    },
    {
      stepIndex: 1,
      line: 2,
      explanation: 'b = a는 새 리스트를 만드는 게 아니라, 같은 리스트에 b라는 이름표를 하나 더 붙이는 거예요.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'b', value: '0x2000', pointsTo: '[1, 2, 3]' },
      ],
    },
  ],

  quiz: {
    question: 'b.append(4) 후 a의 값은?',
    options: [
      { label: '[1, 2, 3]', value: '[1, 2, 3]' },
      { label: '[1, 2, 3, 4]', value: '[1, 2, 3, 4]' },
      { label: 'None', value: 'None' },
    ],
    correctIndex: 1,
    explanation: 'a와 b는 같은 리스트를 가리키므로, b를 통해 수정하면 a로 봐도 바뀌어 있어요.',
  },

  commonMistakes: [
    'b = a가 리스트를 복사한다고 생각하지 마세요. 같은 객체에 이름을 하나 더 붙이는 거예요.',
    '복사하려면 b = a.copy() 또는 b = list(a)를 써야 합니다.',
  ],
};
