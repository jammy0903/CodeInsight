/**
 * Shared Visualization Types
 * 모든 언어에서 공통으로 사용하는 시각화 타입
 */

// ============================================
// 공통 시각화 타입
// ============================================

export type SharedVisualizationType =
  | 'callStack'    // 모든 언어: 함수 호출 스택
  | 'scopeChain'   // JS, Python, Java: 스코프 체인
  | 'memory';      // C, Python, Java: Stack/Heap 메모리

// ============================================
// Call Stack 공통 타입
// ============================================

export interface StackFrame {
  id: string;
  name: string;
  variables: FrameVariable[];
  line?: number;
  isActive?: boolean;
}

export interface FrameVariable {
  name: string;
  value: unknown;
  type?: string;
}

export interface CallStackState {
  frames: StackFrame[];
  currentFrameIndex: number;
}

// ============================================
// Scope Chain 공통 타입
// ============================================

export type ScopeType = 'global' | 'function' | 'block' | 'module';

export interface Scope {
  id: string;
  name: string;
  type: ScopeType;
  variables: Record<string, unknown>;
  parentId?: string;
}

export interface ScopeChainState {
  scopes: Scope[];
  currentScopeId: string;
  lookupPath?: string[];      // 변수 탐색 경로 (애니메이션용)
  targetVariable?: string;    // 찾고 있는 변수
}

// ============================================
// Memory 공통 타입
// ============================================

export interface MemoryBlock {
  id: string;
  name: string;
  address: string;
  value: string;
  type?: string;
  pointsTo?: string | null;   // 포인터가 가리키는 주소
  highlight?: boolean;
}

export interface MemoryState {
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  changedBlocks?: string[];
}

// ============================================
// 공통 Props 인터페이스
// ============================================

export interface CallStackViewProps {
  state: CallStackState;
  animate?: boolean;
}

export interface ScopeChainViewProps {
  state: ScopeChainState;
  highlightLookup?: boolean;
}

export interface MemoryViewProps {
  state: MemoryState;
}

// ============================================
// Return 시각화 타입
// ============================================

/**
 * Return 정보 - 레슨 step에서 제공되는 return 메타데이터
 */
export interface ReturnInfo {
  /** 반환값 (문자열로 표현) */
  value: string;
  /** 반환의 의미 설명 */
  meaning: string;
  /** 반환하는 함수명 (optional) */
  functionName?: string;
  /** 호출자 함수명 (optional) */
  callerName?: string;
}

/**
 * ReturnOverlay Props
 * WHY: 독립 컴포넌트로 Lessons와 Playground 양쪽에서 재사용
 */
export interface ReturnOverlayProps {
  /** return 실행 여부 */
  isReturn: boolean;
  /** return 상세 정보 */
  returnInfo?: ReturnInfo;
  /** 테마 (다크/라이트) */
  theme?: 'dark' | 'light';
  /** 애니메이션 완료 콜백 */
  onAnimationComplete?: () => void;
}
