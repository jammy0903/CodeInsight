/**
 * Java Messages Visualizer Types
 *
 * 목적: 리모컨 비유로 다형성 시각화
 * - 변수 = 리모컨 (선언 타입)
 * - 객체 = 실제 기기 (실제 타입)
 * - 메서드 호출 = 버튼 누르기
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Messages 탭: 메시지 전달 + 다형성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 메시지 전달 이벤트
 *
 * 예시:
 * Animal animal = new Dog();
 * animal.sound();  // ← 이 호출을 추적
 */
export interface JavaMessageEvent {
  type: 'call' | 'return' | 'create' | 'destroy';

  // 호출 정보
  from: string;                // "main", "toString"
  to: string;                  // "animal.sound", "person.getName"

  // 다형성 정보 (핵심!)
  declaredType: string;        // "Animal" (리모컨 타입)
  actualType: string;          // "Dog" (실제 기기)
  method: string;              // "sound"
  isOverridden: boolean;       // true (Dog가 오버라이드함)

  // 추가 정보
  returnValue?: any;
  timestamp: number;
  line: number;                // 코드 라인
}

/**
 * 다형성 추적 정보
 *
 * 핵심: "선언 타입 vs 실제 타입"을 추적
 */
export interface PolymorphismInfo {
  variable: string;            // "animal"
  declaredType: string;        // "Animal" (리모컨)
  actualType: string;          // "Dog" (기기)

  methodCalled: string;        // "sound" (버튼)
  executedIn: string;          // "Dog" (실제 실행된 클래스)

  // 오버라이드 체인
  overrideChain: string[];     // ["Object", "Animal", "Dog"]
  selectedMethod: string;      // "Dog.sound" (실제 실행)
}

/**
 * 리모컨 (변수) 정보
 */
export interface RemoteControl {
  name: string;                // "animal", "pet"
  declaredType: string;        // "Animal"
  connectedDevice: string | null;  // "Dog@1a2b" 또는 null

  // 사용 가능한 버튼 (메서드)
  availableButtons: string[];  // ["sound", "move", "eat"]
}

/**
 * 기기 (객체) 정보
 */
export interface JavaDevice {
  id: string;                  // "@1a2b"
  type: string;                // "Dog"
  color: DeviceColor;          // 🔵 파랑
  icon: string;                // "🐶"

  methods: JavaMethodInfo[];
  fields: JavaFieldInfo[];

  // 상속 정보
  superClass: string | null;   // "Animal"
  interfaces: string[];        // ["Runnable", "Comparable"]
}

/**
 * 메서드 정보
 */
export interface JavaMethodInfo {
  name: string;                // "sound"
  returnType: string;          // "void"
  parameters: string[];        // ["int age", "String name"]

  // 오버라이드 여부
  isOverridden: boolean;       // true
  overriddenFrom: string | null;  // "Animal"

  // 실행 상태
  isExecuting: boolean;        // 현재 실행 중
}

/**
 * 필드 정보
 */
export interface JavaFieldInfo {
  name: string;
  type: string;
  value: any;
  visibility: 'public' | 'private' | 'protected';
}

/**
 * 메시지 플로우 (타임라인)
 */
export interface MessageFlow {
  events: JavaMessageEvent[];
  currentIndex: number;

  // 활성 객체들
  activeDevices: JavaDevice[];
  activeRemotes: RemoteControl[];
}

/**
 * 기기 색상 (타입별)
 */
export type DeviceColor =
  | 'blue'    // 🔵 Dog
  | 'green'   // 🟢 Cat
  | 'purple'  // 🟣 Bird
  | 'orange'  // 🟠 Fish
  | 'gray';   // ⚫ Object (기본)

/**
 * 애니메이션 상태
 */
export interface MessageAnimation {
  type: 'button-press' | 'signal-send' | 'method-execute' | 'return';
  from: string;
  to: string;
  progress: number;  // 0.0 ~ 1.0
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Reference 탭: 참조 관계 (향후 구현)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Java 변수 (메모 스티커)
 */
export interface JavaVariable {
  name: string;
  declaredType: string;
  objectId: string | null;
  scope: 'local' | 'parameter' | 'field';
}

/**
 * Java 객체 (실제 물건)
 */
export interface JavaObject {
  id: string;
  actualType: string;
  fields: JavaFieldInfo[];

  // 참조 추적
  referencedBy: string[];  // ["a", "b", "c"]
}

/**
 * 참조 관계 상태
 */
export interface JavaReferenceState {
  variables: JavaVariable[];
  objects: JavaObject[];

  // 같은 객체를 가리키는 변수 그룹
  sharedReferences: Map<string, string[]>;  // objectId → [변수명들]
}
