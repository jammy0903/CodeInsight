/**
 * Flow Visualizer Style Tokens
 *
 * 기존 CMemoryView 색상 체계와 일관성 유지
 * Light Neon Highlighter 느낌
 */

// ============================================
// 테마별 색상
// ============================================

export const FLOW_THEMES = {
  light: {
    // 변수 박스 기본 스타일
    box: {
      background: 'var(--theme-flow-box-bg)',
      border: 'var(--theme-flow-box-border)',
      label: 'var(--theme-flow-box-label)',
      value: 'var(--theme-flow-box-value)',
      type: '#9ca3af',
    },

    // 상태별 색상 (애니메이션 하이라이트)
    states: {
      idle: {
        border: 'var(--theme-flow-box-border)',
        glow: 'transparent',
      },
      creating: {
        border: 'var(--theme-flow-state-creating-border)',
        glow: 'var(--theme-flow-state-creating-glow)',
      },
      updating: {
        border: 'var(--theme-flow-state-updating-border)',
        glow: 'var(--theme-flow-state-updating-glow)',
      },
      reading: {
        border: 'var(--theme-flow-state-reading-border)',
        glow: 'var(--theme-flow-state-reading-glow)',
      },
      deleting: {
        border: 'var(--theme-flow-state-deleting-border)',
        glow: 'var(--theme-flow-state-deleting-glow)',
      },
    },

    // 제어 흐름 색상
    control: {
      truePath: '#22c55e', // if 참
      falsePath: '#ef4444', // if 거짓
      loop: '#8b5cf6', // for/while
      function: '#f97316', // 함수 호출
    },

    // 터미널
    terminal: {
      background: '#1e1e1e',
      text: '#d4d4d4',
      cursor: '#ffffff',
      border: '#333333',
      stdout: '#4ade80', // 초록
      stderr: '#f87171', // 빨강
      return: '#60a5fa', // 파랑
    },

    // 화살표 (포인터/참조)
    arrow: {
      stroke: '#6b5a4a',
      head: '#6b5a4a',
    },

    // 함수 프레임
    frame: {
      background: 'var(--theme-flow-frame-bg)',
      border: 'var(--theme-flow-frame-border)',
      header: 'var(--theme-flow-frame-header)',
      label: 'var(--theme-flow-frame-label)',
    },

    // 캔버스 배경
    canvas: {
      background: 'var(--theme-flow-canvas-bg)',
    },
  },

  dark: {
    // Playground용 다크 테마
    box: {
      background: 'var(--theme-flow-box-bg)',
      border: 'var(--theme-flow-box-border)',
      label: 'var(--theme-flow-box-label)',
      value: 'var(--theme-flow-box-value)',
      type: '#a0aec0',
    },

    states: {
      idle: {
        border: 'var(--theme-flow-box-border)',
        glow: 'transparent',
      },
      creating: {
        border: 'var(--theme-flow-state-creating-border)',
        glow: 'var(--theme-flow-state-creating-glow)',
      },
      updating: {
        border: 'var(--theme-flow-state-updating-border)',
        glow: 'var(--theme-flow-state-updating-glow)',
      },
      reading: {
        border: 'var(--theme-flow-state-reading-border)',
        glow: 'var(--theme-flow-state-reading-glow)',
      },
      deleting: {
        border: 'var(--theme-flow-state-deleting-border)',
        glow: 'var(--theme-flow-state-deleting-glow)',
      },
    },

    control: {
      truePath: '#48bb78',
      falsePath: '#fc8181',
      loop: '#9f7aea',
      function: '#ed8936',
    },

    terminal: {
      background: '#1a202c',
      text: '#e2e8f0',
      cursor: '#ffffff',
      border: '#2d3748',
      stdout: '#68d391', // 초록
      stderr: '#fc8181', // 빨강
      return: '#63b3ed', // 파랑
    },

    arrow: {
      stroke: '#a0aec0',
      head: '#a0aec0',
    },

    frame: {
      background: 'var(--theme-flow-frame-bg)',
      border: 'var(--theme-flow-frame-border)',
      header: 'var(--theme-flow-frame-header)',
      label: 'var(--theme-flow-frame-label)',
    },

    canvas: {
      background: 'var(--theme-flow-canvas-bg)',
    },
  },
} as const;

export type FlowTheme = keyof typeof FLOW_THEMES;

// ============================================
// 크기 상수
// ============================================

export const FLOW_SIZES = {
  // 변수 박스 — CSS 변수로 반응형 처리 (var(--flow-box-*))
  box: {
    width: 80,
    borderRadius: 8,
    borderWidth: 2,
  },

  // 화살표 — SVG 계산용 (JS에서만 사용)
  arrow: {
    strokeWidth: 2,
    headSize: 8,
    curveOffset: 20,
  },

  // 터미널
  terminal: {
    height: 80,
    padding: 12,
    fontSize: 12,
  },

  // 루프 트랙
  loopTrack: {
    radius: 40,
    thickness: 4,
    counterSize: 24,
  },
} as const;

// ============================================
// 애니메이션 설정
// ============================================

export const FLOW_ANIMATION = {
  // 기본 지속 시간 (ms)
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Easing 함수
  easing: {
    default: 'easeOut',
    bounce: 'easeOutBack',
    smooth: 'easeInOut',
  },

  // Spring 설정 (Framer Motion)
  spring: {
    stiffness: 300,
    damping: 25,
  },

  // 순차 애니메이션 지연
  stagger: 50, // ms
} as const;

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 테마에서 박스 스타일 가져오기
 */
export function getBoxStyle(
  theme: FlowTheme,
  state: keyof typeof FLOW_THEMES.light.states
) {
  const themeColors = FLOW_THEMES[theme];
  const stateColors = themeColors.states[state];

  return {
    background: themeColors.box.background,
    border: stateColors.border,
    glow: stateColors.glow,
    label: themeColors.box.label,
    value: themeColors.box.value,
    type: themeColors.box.type,
  };
}

/**
 * 테마에서 프레임 스타일 가져오기
 */
export function getFrameStyle(theme: FlowTheme) {
  return FLOW_THEMES[theme].frame;
}

/**
 * 테마에서 화살표 스타일 가져오기
 */
export function getArrowStyle(theme: FlowTheme) {
  return FLOW_THEMES[theme].arrow;
}
