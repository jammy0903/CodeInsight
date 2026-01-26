/**
 * PyStyler - Python Language Styler
 *
 * Python 언어 전용 시각화 스타일
 * - 모든 변수가 참조 (항상 화살표 표시)
 * - Mutable (list, dict, set) vs Immutable (int, str, tuple) 색상 구분
 * - 같은 객체를 가리키는 변수들 연결 표시
 */

import type { FlowVariable, FlowVariableState } from '@codeinsight/shared';
import type { IFlowStyler, BoxStyle, ArrowStyle } from '../base/types';
import { FLOW_THEMES, type FlowTheme } from '../../styles';

// Python 언어 전용 색상
const PY_COLORS = {
  // 참조 화살표 (모든 변수)
  reference: {
    stroke: '#60a5fa', // 밝은 파랑
    strokeWidth: 2,
    headSize: 6,
  },
  // Mutable 객체 (list, dict, set)
  mutable: {
    border: '#4ade80', // 연한 초록
    glow: 'rgba(74, 222, 128, 0.3)',
  },
  // Immutable 객체 (int, str, tuple, bool, None)
  immutable: {
    border: '#a78bfa', // 연한 보라
    glow: 'rgba(167, 139, 250, 0.3)',
  },
  // 이름 변수 (참조 박스)
  name: {
    border: '#fbbf24', // 골드
    glow: 'rgba(251, 191, 36, 0.3)',
  },
  // None 특별 표시
  none: {
    border: '#6b7280', // 회색
    glow: 'rgba(107, 114, 128, 0.3)',
  },
} as const;

// Mutable 타입 목록
const MUTABLE_TYPES = new Set(['list', 'dict', 'set', 'object', 'instance']);

export class PyStyler implements IFlowStyler {
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

    // idle 상태일 때 이름 변수는 포스트잇 색상
    if (state === 'idle') {
      // 모든 변수는 이름 변수 (포스트잇 비유)
      baseStyle.border = PY_COLORS.name.border;
      baseStyle.glow = PY_COLORS.name.glow;
    }

    // Python 변수는 참조이므로 value 색상을 화살표 색으로
    if (variable.isPointer && variable.scope !== 'objects') {
      baseStyle.value = PY_COLORS.reference.stroke;
    }

    return baseStyle;
  }

  /**
   * 화살표 스타일 (참조용)
   */
  getArrowStyle(from: FlowVariable, to: FlowVariable): ArrowStyle {
    // 같은 객체를 여러 변수가 가리킬 때 강조
    const isMutable = this.isMutableType(to.type);

    return {
      stroke: isMutable ? PY_COLORS.mutable.border : PY_COLORS.reference.stroke,
      strokeWidth: PY_COLORS.reference.strokeWidth,
      headSize: PY_COLORS.reference.headSize,
      opacity: 0.8,
    };
  }

  /**
   * Python은 모든 변수가 참조 → pointsTo가 있으면 항상 화살표 표시
   */
  shouldShowArrow(variable: FlowVariable): boolean {
    // 참조 변수는 화살표 표시
    return Boolean(variable.isPointer && variable.pointsTo);
  }

  /**
   * Mutable 타입 여부 확인
   */
  private isMutableType(type: string): boolean {
    return MUTABLE_TYPES.has(type);
  }
}

// 싱글톤 인스턴스 (light 테마 기본)
export const pyStyler = new PyStyler('light');
