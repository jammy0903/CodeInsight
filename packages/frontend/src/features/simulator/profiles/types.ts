/**
 * Language Profile Types
 *
 * 프로파일은 언어별로 어떤 모듈을 활성화할지 결정한다.
 * 조건문 분기 대신 프로파일이 모듈 조합을 선언적으로 정의.
 */

import type { Language } from '../engine/types';

/** 변수 모델 — 언어가 변수를 다루는 근본 방식 */
export type VariableModel =
  | 'allocation'   // C: 메모리에 직접 공간 할당
  | 'binding'      // Python: 이름을 객체에 바인딩
  | 'reference';   // Java, JS: 참조 변수가 객체를 가리킴

/** 모듈 배치 위치 */
export type ModulePosition = 'left' | 'center' | 'right' | 'bottom';

/** 프로파일 내 모듈 설정 */
export interface ModuleConfig {
  /** 모듈 ID (ModuleRegistry에 등록된 키) */
  id: string;

  /** 레이아웃 위치 */
  position: ModulePosition;

  /** 렌더링 우선순위 (같은 position 내에서, 낮을수록 위) */
  priority: number;

  /** 초기 높이 비율 (0~1, 생략 시 균등 분배) */
  heightRatio?: number;
}

/** 언어 프로파일 */
export interface LanguageProfile {
  /** 언어 식별자 */
  lang: Language;

  /** 표시 이름 */
  name: string;

  /** 변수 모델 */
  variableModel: VariableModel;

  /** 활성화할 모듈 목록 */
  modules: ModuleConfig[];
}
