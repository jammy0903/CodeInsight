/**
 * Java Heap 메모리 관리자
 * 객체 생성, 필드 접근, 배열 관리 등
 */

import {
  JavaObject,
  JavaValue,
  JavaType,
  HeapSnapshot,
  estimateShallowSize,
  isArrayType,
  getArrayElementType,
  getDefaultValue
} from './types';

/**
 * Heap 메모리 관리자
 */
export class HeapManager {
  private objects: Map<string, JavaObject>;
  private nextObjectId: number;

  constructor() {
    this.objects = new Map();
    this.nextObjectId = 1;
  }

  /**
   * 일반 객체 생성
   * @param className 클래스명 (예: "Person", "Student")
   * @param initialFields 초기 필드값들 (선택적)
   * @returns 생성된 객체의 ID
   */
  createObject(className: string, initialFields?: Map<string, JavaValue>): string {
    const objectId = `obj_${this.nextObjectId++}`;

    const fields = initialFields || new Map();
    const shallowSize = estimateShallowSize(className, fields);

    const obj: JavaObject = {
      id: objectId,
      className,
      fields,
      shallowSize,
      isArray: false
    };

    this.objects.set(objectId, obj);
    return objectId;
  }

  /**
   * 배열 객체 생성
   * @param elementType 배열 요소 타입 (예: "int", "String")
   * @param length 배열 길이
   * @returns 생성된 배열 객체의 ID
   */
  createArray(elementType: JavaType, length: number): string {
    const arrayId = `arr_${this.nextObjectId++}`;

    // 배열 요소들을 기본값으로 초기화
    const elements: JavaValue[] = [];
    for (let i = 0; i < length; i++) {
      elements.push(getDefaultValue(elementType));
    }

    const shallowSize = estimateShallowSize(`${elementType}[]`, undefined, length);

    const arrayObj: JavaObject = {
      id: arrayId,
      className: `${elementType}[]`,
      fields: new Map(),
      shallowSize,
      isArray: true,
      arrayLength: length,
      arrayElements: elements,
      arrayElementType: elementType
    };

    this.objects.set(arrayId, arrayObj);
    return arrayId;
  }

  /**
   * 객체 가져오기
   */
  getObject(objectId: string): JavaObject | undefined {
    return this.objects.get(objectId);
  }

  /**
   * 객체 필드 값 설정
   */
  setField(objectId: string, fieldName: string, value: JavaValue): void {
    const obj = this.objects.get(objectId);
    if (!obj) {
      throw new Error(`Object not found: ${objectId}`);
    }

    if (obj.isArray) {
      throw new Error(`Cannot set field on array: ${objectId}`);
    }

    obj.fields.set(fieldName, value);
  }

  /**
   * 객체 필드 값 가져오기
   */
  getField(objectId: string, fieldName: string): JavaValue | undefined {
    const obj = this.objects.get(objectId);
    if (!obj) {
      throw new Error(`Object not found: ${objectId}`);
    }

    if (obj.isArray) {
      throw new Error(`Cannot get field from array: ${objectId}`);
    }

    return obj.fields.get(fieldName);
  }

  /**
   * 배열 요소 설정
   */
  setArrayElement(arrayId: string, index: number, value: JavaValue): void {
    const arrayObj = this.objects.get(arrayId);
    if (!arrayObj) {
      throw new Error(`Array not found: ${arrayId}`);
    }

    if (!arrayObj.isArray || !arrayObj.arrayElements) {
      throw new Error(`Not an array: ${arrayId}`);
    }

    if (index < 0 || index >= arrayObj.arrayElements.length) {
      throw new Error(`Array index out of bounds: ${index} (length: ${arrayObj.arrayElements.length})`);
    }

    arrayObj.arrayElements[index] = value;
  }

  /**
   * 배열 요소 가져오기
   */
  getArrayElement(arrayId: string, index: number): JavaValue {
    const arrayObj = this.objects.get(arrayId);
    if (!arrayObj) {
      throw new Error(`Array not found: ${arrayId}`);
    }

    if (!arrayObj.isArray || !arrayObj.arrayElements) {
      throw new Error(`Not an array: ${arrayId}`);
    }

    if (index < 0 || index >= arrayObj.arrayElements.length) {
      throw new Error(`Array index out of bounds: ${index} (length: ${arrayObj.arrayElements.length})`);
    }

    return arrayObj.arrayElements[index];
  }

  /**
   * 배열 길이 가져오기
   */
  getArrayLength(arrayId: string): number {
    const arrayObj = this.objects.get(arrayId);
    if (!arrayObj) {
      throw new Error(`Array not found: ${arrayId}`);
    }

    if (!arrayObj.isArray) {
      throw new Error(`Not an array: ${arrayId}`);
    }

    return arrayObj.arrayLength || 0;
  }

  /**
   * 객체가 존재하는지 확인
   */
  hasObject(objectId: string): boolean {
    return this.objects.has(objectId);
  }

  /**
   * 모든 객체 가져오기
   */
  getAllObjects(): JavaObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Heap 스냅샷 생성 (시각화용)
   */
  snapshot(): HeapSnapshot {
    const objects = this.getAllObjects();
    const totalSize = objects.reduce((sum, obj) => sum + obj.shallowSize, 0);

    return {
      objects: objects.map(obj => this.cloneObject(obj)),
      totalSize
    };
  }

  /**
   * 객체 복사 (불변성 보장)
   */
  private cloneObject(obj: JavaObject): JavaObject {
    return {
      ...obj,
      fields: new Map(obj.fields),
      arrayElements: obj.arrayElements ? [...obj.arrayElements] : undefined
    };
  }

  /**
   * Heap 초기화
   */
  clear(): void {
    this.objects.clear();
    this.nextObjectId = 1;
  }

  /**
   * Heap 크기 (객체 수)
   */
  get size(): number {
    return this.objects.size;
  }

  /**
   * 총 메모리 사용량 (bytes)
   */
  get totalMemory(): number {
    return Array.from(this.objects.values())
      .reduce((sum, obj) => sum + obj.shallowSize, 0);
  }

  /**
   * 디버그용 출력
   */
  debug(): void {
    console.log('=== Heap State ===');
    console.log(`Objects: ${this.objects.size}`);
    console.log(`Total Memory: ${this.totalMemory} bytes`);
    this.objects.forEach((obj, id) => {
      if (obj.isArray) {
        console.log(`  ${id}: ${obj.className}[${obj.arrayLength}] (${obj.shallowSize} bytes)`);
      } else {
        console.log(`  ${id}: ${obj.className} (${obj.fields.size} fields, ${obj.shallowSize} bytes)`);
      }
    });
  }
}
