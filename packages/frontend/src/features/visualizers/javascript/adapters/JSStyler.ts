/**
 * JSStyler - JavaScript Language Styler
 *
 * JavaScript 언어 전용 시각화 스타일
 * - 참조는 화살표로 표시
 * - Stack/Heap 구분 색상
 * - JavaScript 고유 타입별 색상 (undefined, NaN 등)
 */

import type { FlowVariable, FlowVariableState } from '@codeinsight/shared';
import type { IFlowStyler, BoxStyle, ArrowStyle } from '../../shared/adapters/types';
import { FLOW_THEMES, type FlowTheme } from '../../shared/styles';

// JavaScript 언어 전용 색상
const JS_COLORS = {
  // 참조 화살표
  reference: {
    stroke: '#f59e0b', // 오렌지 (JS 특유)
    strokeWidth: 2,
    headSize: 8,
  },
  // Heap 객체
  heap: {
    border: '#10b981', // 초록
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  // Stack 변수
  stack: {
    border: '#f59e0b', // 오렌지 (JS)
    glow: 'rgba(245, 158, 11, 0.3)',
  },
  // undefined/null 특별 표시
  nullish: {
    border: '#6b7280', // 회색
    glow: 'rgba(107, 114, 128, 0.3)',
  },
  // 함수
  function: {
    border: '#8b5cf6', // 보라
    glow: 'rgba(139, 92, 246, 0.3)',
  },
} as const;

// null/undefined 타입 목록
const NULLISH_TYPES = new Set(['null', 'undefined', 'NaN']);

export class JSStyler implements IFlowStyler {
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

    // idle 상태일 때 타입/scope에 따라 border 색상 변경
    if (state === 'idle') {
      // null/undefined는 회색
      if (NULLISH_TYPES.has(variable.type) || variable.value === null || variable.value === 'undefined') {
        baseStyle.border = JS_COLORS.nullish.border;
      }
      // heap 객체는 초록색
      else if (variable.scope === 'heap') {
        baseStyle.border = JS_COLORS.heap.border;
      }
      // Function은 보라색
      else if (variable.type === 'Function' || variable.type === 'function') {
        baseStyle.border = JS_COLORS.function.border;
      }
      // stack 변수는 오렌지
      else if (variable.scope !== 'global') {
        baseStyle.border = JS_COLORS.stack.border;
      }
    }

    // 참조는 value 색상을 오렌지로
    if (variable.isPointer) {
      baseStyle.value = JS_COLORS.reference.stroke;
    }

    return baseStyle;
  }

  /**
   * 화살표 스타일 (참조용)
   */
  getArrowStyle(from: FlowVariable, to: FlowVariable): ArrowStyle {
    return {
      stroke: JS_COLORS.reference.stroke,
      strokeWidth: JS_COLORS.reference.strokeWidth,
      headSize: JS_COLORS.reference.headSize,
      opacity: 0.8,
    };
  }

  /**
   * JavaScript에서 화살표 표시 조건: 참조이고 가리키는 대상이 있을 때
   */
  shouldShowArrow(variable: FlowVariable): boolean {
    return Boolean(variable.isPointer && variable.pointsTo);
  }
}

// 싱글톤 인스턴스 (light 테마 기본)
export const jsStyler = new JSStyler('light');
