/**
 * Shared Visualization Constants
 * 공통 색상 및 애니메이션 설정
 */

// ============================================
// 색상 팔레트
// ============================================

export const COLORS = {
  // Call Stack 색상
  stack: {
    frame: '#E8F5E9',           // 연한 초록
    frameActive: '#C8E6C9',     // 활성 프레임
    frameBorder: '#81C784',
    text: '#2E7D32',
  },

  // Scope Chain 색상
  scope: {
    global: '#FFF3E0',          // 연한 주황
    function: '#E3F2FD',        // 연한 파랑
    block: '#F3E5F5',           // 연한 보라
    border: '#BDBDBD',
    lookupPath: '#FF9800',      // 탐색 경로 하이라이트
  },

  // Event Loop 색상 (JS 전용이지만 공통 참조용)
  eventLoop: {
    callStack: '#E8F5E9',
    webApi: '#FFF8E1',
    taskQueue: '#FFEBEE',
    microtaskQueue: '#E1F5FE',
    arrow: '#757575',
  },

  // 하이라이트
  highlight: {
    changed: '#FFEB3B',         // 변경된 항목
    current: '#4CAF50',         // 현재 실행 중
    error: '#F44336',
  },
} as const;

// ============================================
// 애니메이션 설정
// ============================================

export const ANIMATION = {
  // 기본 트랜지션
  duration: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
  },

  // Spring 설정
  spring: {
    stiffness: 300,
    damping: 30,
  },

  // 지연
  stagger: 0.05,               // 연속 요소 간 지연
} as const;

// ============================================
// 레이아웃 설정
// ============================================

export const LAYOUT = {
  // 스택 프레임 크기
  stackFrame: {
    minHeight: 40,
    padding: 12,
    gap: 8,
  },

  // 스코프 박스 크기
  scopeBox: {
    minWidth: 150,
    padding: 16,
    gap: 12,
  },
} as const;
