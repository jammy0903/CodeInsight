/**
 * Flow Adapter Base Types
 *
 * 언어별 어댑터가 구현해야 할 인터페이스 정의
 * 책임 분리: Transformer (데이터) / Styler (시각화) / Animator (애니메이션)
 */

import type {
  LessonStep,
  FlowStep,
  FlowVariable,
  FlowVariableState,
  FlowAnimation,
  FlowValue,
  FlowDiff,
} from '@codeinsight/shared';

// ============================================
// 스타일 타입
// ============================================

export interface BoxStyle {
  background: string;
  border: string;
  glow: string;
  label: string;
  value: string;
  type: string;
}

export interface ArrowStyle {
  stroke: string;
  strokeWidth: number;
  headSize: number;
  dashArray?: string;
  opacity?: number;
}

// ============================================
// IFlowTransformer - 데이터 변환
// ============================================

export interface IFlowTransformer {
  /**
   * LessonStep → FlowStep 변환
   * @param step 현재 스텝
   * @param prevStep 이전 스텝 (변경 감지용)
   * @param fullCode 전체 코드 (code 필드가 없을 때 line에서 추출용)
   */
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep;

  /**
   * MemoryBlock → FlowVariable 변환
   */
  toVariable(block: {
    name: string;
    value: string;
    type?: string;
    address?: string;
    points_to?: string | null;
    segment?: string;
  }, scope: string): FlowVariable;
}

// ============================================
// IFlowStyler - 시각화 스타일
// ============================================

export interface IFlowStyler {
  /**
   * 변수의 시각적 스타일 결정
   */
  getBoxStyle(variable: FlowVariable, state: FlowVariableState): BoxStyle;

  /**
   * 화살표 스타일 (포인터/참조용)
   */
  getArrowStyle(from: FlowVariable, to: FlowVariable): ArrowStyle;

  /**
   * 언어별 특수 표시 (예: Python은 모든 변수에 화살표)
   */
  shouldShowArrow(variable: FlowVariable): boolean;
}

// ============================================
// IFlowAnimator - 애니메이션 생성
// ============================================

export interface IFlowAnimator {
  /**
   * 변수 생성 시 애니메이션
   */
  createVariableAnimations(variable: FlowVariable): FlowAnimation[];

  /**
   * 값 변경 시 애니메이션
   */
  updateVariableAnimations(
    variable: FlowVariable,
    oldValue: FlowValue,
    newValue: FlowValue
  ): FlowAnimation[];

  /**
   * 변수 삭제 시 애니메이션
   */
  deleteVariableAnimations(variable: FlowVariable): FlowAnimation[];

  /**
   * 출력 시 애니메이션 (printf 등)
   */
  outputAnimations(variable: FlowVariable, output: string): FlowAnimation[];

  /**
   * FlowDiff에서 전체 애니메이션 생성
   */
  createAnimationsFromDiff(
    diff: FlowDiff,
    currentStep: FlowStep,
    prevStep?: FlowStep
  ): FlowAnimation[];
}

// ============================================
// IFlowAdapter - 통합 어댑터
// ============================================

export interface IFlowAdapter {
  readonly language: string;
  readonly transformer: IFlowTransformer;
  readonly styler: IFlowStyler;
  readonly animator: IFlowAnimator;
}
