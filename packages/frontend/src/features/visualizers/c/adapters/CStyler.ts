/**
 * CStyler - C Language Styler
 *
 * C 언어 전용 시각화 스타일
 * - 포인터는 화살표로 표시
 * - Stack/Heap 구분 색상
 */

import type { FlowVariable, FlowVariableState } from '@codeinsight/shared';
import type { IFlowStyler, BoxStyle, ArrowStyle } from '../../shared/adapters/types';
import { FLOW_THEMES, type FlowTheme } from '../../shared/styles';

// C 언어 전용 색상
const C_COLORS = {
  pointer: {
    stroke: '#fb923c', // 밝은 오렌지
    strokeWidth: 2,
    headSize: 8,
  },
  heap: {
    border: '#4ade80', // 연한 초록
    glow: 'rgba(74, 222, 128, 0.3)',
  },
  stack: {
    border: '#c084fc', // 연한 보라
    glow: 'rgba(192, 132, 252, 0.3)',
  },
} as const;

export class CStyler implements IFlowStyler {
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
        baseStyle.border = C_COLORS.heap.border;
      } else if (variable.scope !== 'global') {
        // stack (main 또는 함수)
        baseStyle.border = C_COLORS.stack.border;
      }
    }

    // 포인터는 value 색상을 다르게
    if (variable.isPointer) {
      baseStyle.value = C_COLORS.pointer.stroke;
    }

    return baseStyle;
  }

  /**
   * 화살표 스타일 (포인터용)
   */
  getArrowStyle(from: FlowVariable, to: FlowVariable): ArrowStyle {
    return {
      stroke: C_COLORS.pointer.stroke,
      strokeWidth: C_COLORS.pointer.strokeWidth,
      headSize: C_COLORS.pointer.headSize,
      opacity: 0.8,
    };
  }

  /**
   * C 언어에서 화살표 표시 조건: 포인터이고 가리키는 대상이 있을 때
   */
  shouldShowArrow(variable: FlowVariable): boolean {
    return Boolean(variable.isPointer && variable.pointsTo);
  }
}

// 싱글톤 인스턴스 (light 테마 기본)
export const cStyler = new CStyler('light');
