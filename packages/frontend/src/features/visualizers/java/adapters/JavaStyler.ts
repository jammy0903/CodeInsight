/**
 * JavaStyler - Java Language Styler
 *
 * Java 언어 전용 시각화 스타일
 * - 참조는 화살표로 표시 (포인터와 다른 색상)
 * - Stack/Heap 구분 색상
 * - 객체 참조 강조
 */

import type { FlowVariable, FlowVariableState } from '@codeinsight/shared';
import type { IFlowStyler, BoxStyle, ArrowStyle } from '../../shared/adapters/types';
import { FLOW_THEMES, type FlowTheme } from '../../shared/styles';

// Java 언어 전용 색상
const JAVA_COLORS = {
  reference: {
    stroke: '#3b82f6', // 파란색 (포인터와 구분)
    strokeWidth: 2,
    headSize: 8,
  },
  heap: {
    border: '#10b981', // 초록 (객체)
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  stack: {
    border: '#8b5cf6', // 보라 (참조 변수)
    glow: 'rgba(139, 92, 246, 0.3)',
  },
} as const;

export class JavaStyler implements IFlowStyler {
  private theme: FlowTheme;

  constructor(theme: FlowTheme = 'light') {
    this.theme = theme;
  }

  setTheme(theme: FlowTheme) {
    this.theme = theme;
  }

  /**
   * 변수의 시각적 스타일 결정
   */
  getBoxStyle(variable: FlowVariable, state: FlowVariableState): BoxStyle {
    const themeColors = FLOW_THEMES[this.theme];
    const stateColors = themeColors.states[state];

    // 기본 스타일
    const baseStyle: BoxStyle = {
      background: themeColors.box.background,
      border: stateColors.border,
      glow: stateColors.glow,
      label: themeColors.box.label,
      value: themeColors.box.value,
      type: themeColors.box.type,
    };

    // idle 상태일 때 scope에 따라 border 색상 변경
    if (state === 'idle') {
      if (variable.scope === 'heap') {
        // heap 객체는 초록색
        baseStyle.border = JAVA_COLORS.heap.border;
      } else if (variable.scope !== 'global') {
        // stack (main 또는 함수)
        baseStyle.border = JAVA_COLORS.stack.border;
      }
    }

    // 참조는 value 색상을 파란색으로
    if (variable.isPointer) {
      baseStyle.value = JAVA_COLORS.reference.stroke;
    }

    return baseStyle;
  }

  /**
   * 화살표 스타일 (참조용)
   */
  getArrowStyle(from: FlowVariable, to: FlowVariable): ArrowStyle {
    return {
      stroke: JAVA_COLORS.reference.stroke,
      strokeWidth: JAVA_COLORS.reference.strokeWidth,
      headSize: JAVA_COLORS.reference.headSize,
      opacity: 0.8,
    };
  }

  /**
   * Java에서 화살표 표시 조건: 참조이고 가리키는 대상이 있을 때
   */
  shouldShowArrow(variable: FlowVariable): boolean {
    return Boolean(variable.isPointer && variable.pointsTo);
  }
}

// 싱글톤 인스턴스 (light 테마 기본)
export const javaStyler = new JavaStyler('light');
