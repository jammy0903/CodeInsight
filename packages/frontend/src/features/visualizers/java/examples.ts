/**
 * Java Visualizer 예시 데이터
 *
 * 목적: 다형성 시각화 테스트용
 */

import type { RemoteControl, JavaDevice } from './types';

/**
 * 예시 1: Animal animal = new Dog();
 */
export const example1_remotes: RemoteControl[] = [
  {
    name: 'animal',
    declaredType: 'Animal',
    connectedDevice: 'Dog@1a2b',
    availableButtons: ['sound', 'move', 'eat'],
  },
];

export const example1_devices: JavaDevice[] = [
  {
    id: '@1a2b',
    type: 'Dog',
    color: 'blue',
    icon: '🐶',
    superClass: 'Animal',
    interfaces: [],
    fields: [
      {
        name: 'name',
        type: 'String',
        value: 'Buddy',
        visibility: 'private',
      },
      {
        name: 'age',
        type: 'int',
        value: 3,
        visibility: 'private',
      },
    ],
    methods: [
      {
        name: 'sound',
        returnType: 'void',
        parameters: [],
        isOverridden: true,
        overriddenFrom: 'Animal',
        isExecuting: false,
      },
      {
        name: 'bark',
        returnType: 'void',
        parameters: [],
        isOverridden: false,
        overriddenFrom: null,
        isExecuting: false,
      },
      {
        name: 'move',
        returnType: 'void',
        parameters: [],
        isOverridden: true,
        overriddenFrom: 'Animal',
        isExecuting: false,
      },
    ],
  },
];

/**
 * 예시 2: Animal pet = new Cat();
 */
export const example2_remotes: RemoteControl[] = [
  {
    name: 'pet',
    declaredType: 'Animal',
    connectedDevice: 'Cat@3c4d',
    availableButtons: ['sound', 'move', 'eat'],
  },
];

export const example2_devices: JavaDevice[] = [
  {
    id: '@3c4d',
    type: 'Cat',
    color: 'green',
    icon: '🐱',
    superClass: 'Animal',
    interfaces: [],
    fields: [
      {
        name: 'name',
        type: 'String',
        value: 'Whiskers',
        visibility: 'private',
      },
      {
        name: 'age',
        type: 'int',
        value: 2,
        visibility: 'private',
      },
    ],
    methods: [
      {
        name: 'sound',
        returnType: 'void',
        parameters: [],
        isOverridden: true,
        overriddenFrom: 'Animal',
        isExecuting: false,
      },
      {
        name: 'meow',
        returnType: 'void',
        parameters: [],
        isOverridden: false,
        overriddenFrom: null,
        isExecuting: false,
      },
      {
        name: 'move',
        returnType: 'void',
        parameters: [],
        isOverridden: true,
        overriddenFrom: 'Animal',
        isExecuting: false,
      },
    ],
  },
];

/**
 * 예시 3: 다형성 비교 (Dog vs Cat)
 */
export const example3_remotes: RemoteControl[] = [
  {
    name: 'animal1',
    declaredType: 'Animal',
    connectedDevice: 'Dog@1a2b',
    availableButtons: ['sound', 'move'],
  },
  {
    name: 'animal2',
    declaredType: 'Animal',
    connectedDevice: 'Cat@3c4d',
    availableButtons: ['sound', 'move'],
  },
];

export const example3_devices: JavaDevice[] = [
  {
    id: '@1a2b',
    type: 'Dog',
    color: 'blue',
    icon: '🐶',
    superClass: 'Animal',
    interfaces: [],
    fields: [
      { name: 'name', type: 'String', value: 'Buddy', visibility: 'private' },
    ],
    methods: [
      {
        name: 'sound',
        returnType: 'void',
        parameters: [],
        isOverridden: true,
        overriddenFrom: 'Animal',
        isExecuting: false,
      },
      {
        name: 'move',
        returnType: 'void',
        parameters: [],
        isOverridden: true,
        overriddenFrom: 'Animal',
        isExecuting: false,
      },
    ],
  },
  {
    id: '@3c4d',
    type: 'Cat',
    color: 'green',
    icon: '🐱',
    superClass: 'Animal',
    interfaces: [],
    fields: [
      {
        name: 'name',
        type: 'String',
        value: 'Whiskers',
        visibility: 'private',
      },
    ],
    methods: [
      {
        name: 'sound',
        returnType: 'void',
        parameters: [],
        isOverridden: true,
        overriddenFrom: 'Animal',
        isExecuting: false,
      },
      {
        name: 'move',
        returnType: 'void',
        parameters: [],
        isOverridden: true,
        overriddenFrom: 'Animal',
        isExecuting: false,
      },
    ],
  },
];
