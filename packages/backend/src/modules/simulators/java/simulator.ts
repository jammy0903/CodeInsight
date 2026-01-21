/**
 * Java Simulator
 * Java 코드 시뮬레이션 엔진
 *
 * ============================================
 * 확장 가이드: 추가할 수 있는 기능들
 * ============================================
 *
 * 1. 객체 생성 핸들러 (ObjectCreationHandler)
 *    - 패턴: Person p = new Person();
 *    - 구현 위치: handlers/object.handler.ts
 *    - 필요 기능:
 *      * HeapManager.createObject() 호출
 *      * Stack에 reference 변수 저장
 *      * ObjectEvent 이벤트 생성
 *
 * 2. 배열 핸들러 (ArrayHandler)
 *    - 패턴: int[] arr = new int[5]; / arr[0] = 10;
 *    - 구현 위치: handlers/array.handler.ts
 *    - 필요 기능:
 *      * HeapManager.createArray() / setArrayElement()
 *      * 배열 인덱스 평가
 *      * ArrayEvent 이벤트 생성
 *
 * 3. 필드 접근 핸들러 (FieldAccessHandler)
 *    - 패턴: obj.field = value; / int x = obj.field;
 *    - 구현 위치: handlers/field.handler.ts
 *    - 필요 기능:
 *      * HeapManager.setField() / getField()
 *      * 객체 참조 검증
 *      * FieldEvent 이벤트 생성
 *
 * 4. 메서드 호출 핸들러 (MethodCallHandler)
 *    - 패턴: int result = add(10, 20);
 *    - 구현 위치: handlers/method.handler.ts
 *    - 필요 기능:
 *      * CallStack.pushFrame() / popFrame()
 *      * 파라미터 매핑 (ParameterSetup)
 *      * return 값 처리
 *      * FrameEvent 이벤트 생성
 *
 * 5. 제어 흐름 핸들러 (ControlFlowHandler)
 *    - 패턴: if/else, for, while
 *    - 구현 위치: handlers/control.handler.ts
 *    - 필요 기능:
 *      * 조건 평가 (ExpressionEvaluator)
 *      * 반복문 상태 추적
 *      * 분기 시각화
 *
 * 6. 향상된 표현식 평가기
 *    - 현재: 기본 산술/비교/논리 연산만 지원
 *    - 추가 가능:
 *      * 삼항 연산자 (a > b ? x : y)
 *      * 타입 캐스팅 ((int) value)
 *      * instanceof 연산자
 *      * 문자열 연결 (+ 연산자)
 *
 * 7. 클래스 필드 지원
 *    - 현재: main 메서드 내 로컬 변수만 지원
 *    - 추가 가능:
 *      * static 필드 (Data 영역에 저장)
 *      * instance 필드 (Heap 객체 내 저장)
 *      * 필드 초기화자
 *
 * 8. 생성자 지원
 *    - 패턴: Person p = new Person("Alice", 25);
 *    - 필요 기능:
 *      * 생성자 파싱 및 호출
 *      * this 키워드 처리
 *      * 필드 초기화
 *
 * 9. 상속 및 다형성
 *    - 패턴: Animal a = new Dog();
 *    - 필요 기능:
 *      * 타입 계층 구조 추적
 *      * 메서드 오버라이딩
 *      * super 키워드
 *
 * 10. 예외 처리
 *     - 패턴: try/catch/finally
 *     - 필요 기능:
 *       * 예외 객체 생성
 *       * 스택 언와인딩
 *       * finally 블록 실행 보장
 *
 * ============================================
 * 핸들러 추가 방법
 * ============================================
 *
 * 1. handlers/ 디렉토리에 새 핸들러 파일 생성
 *    예: handlers/object.handler.ts
 *
 * 2. JavaHandler 인터페이스 구현:
 *    ```typescript
 *    export class ObjectCreationHandler implements JavaHandler {
 *      priority = 25; // 우선순위 설정
 *
 *      canHandle(line: string, context: JavaContext): boolean {
 *        return /new\s+[A-Z]\w*\s*\(/.test(line);
 *      }
 *
 *      async handle(line: string, context: JavaContext): Promise<HandlerResult> {
 *        // 구현...
 *      }
 *    }
 *    ```
 *
 * 3. handlers/index.ts에 등록:
 *    ```typescript
 *    import { ObjectCreationHandler } from './object.handler';
 *
 *    const defaultHandlers: JavaHandler[] = [
 *      new ObjectCreationHandler(),  // 추가
 *      new PrintHandler(),
 *      new VariableHandler(),
 *    ];
 *    ```
 *
 * 4. 우선순위 가이드:
 *    - 30: 메모리 할당 (malloc, new)
 *    - 25: 객체/포인터 연산
 *    - 20: 배열/구조체 접근
 *    - 15: 입출력 (print, scanf)
 *    - 10: 기본 변수 연산
 *    - 5: 함수 호출
 *
 * ============================================
 * 테스트 방법
 * ============================================
 *
 * 1. 간단한 테스트 코드 작성:
 *    ```typescript
 *    // test-java-simulator.ts
 *    import { createSimulator } from './simulator';
 *
 *    const testCode = `
 *    public class Main {
 *        public static void main(String[] args) {
 *            // 테스트할 코드
 *        }
 *    }`;
 *
 *    const simulator = createSimulator();
 *    const result = await simulator.simulate(testCode);
 *    console.log(result);
 *    ```
 *
 * 2. 실행:
 *    ```bash
 *    npx ts-node test-java-simulator.ts
 *    ```
 *
 * 3. API 테스트 (서버 실행 후):
 *    ```bash
 *    curl -X POST http://localhost:5001/api/v1/simulators/java \
 *      -H "Content-Type: application/json" \
 *      -d '{"code": "public class Main { ... }"}'
 *    ```
 */

import {
  JavaSimulationResult,
  JavaStep,
  JavaContext,
  StackFrame
} from './runtime/types';
import { CallStack } from './runtime/stack';
import { HeapManager } from './runtime/heap';
import {
  parseJavaCode,
  findMainMethod,
  extractSourceLines
} from './parser/class-parser';
import { JavaHandlerRegistry, createDefaultRegistry } from './handlers';

/**
 * Java 시뮬레이터 메인 클래스
 */
export class JavaSimulator {
  private stack: CallStack;
  private heap: HeapManager;
  private handlerRegistry: JavaHandlerRegistry;

  constructor() {
    this.stack = new CallStack();
    this.heap = new HeapManager();
    this.handlerRegistry = createDefaultRegistry();
  }

  /**
   * Java 코드 시뮬레이션
   */
  async simulate(code: string): Promise<JavaSimulationResult> {
    try {
      // 1. 코드 파싱
      const parsedClass = parseJavaCode(code);
      const sourceLines = extractSourceLines(code);

      // 2. main 메서드 찾기
      const mainMethod = findMainMethod(parsedClass);
      if (!mainMethod) {
        return {
          success: false,
          steps: [],
          sourceLines,
          error: 'main 메서드를 찾을 수 없습니다.'
        };
      }

      // 3. 초기화
      this.stack.clear();
      this.heap.clear();

      // 4. main 프레임 푸시
      this.stack.pushFrame('main');

      // 5. 라인 단위 실행
      const steps: JavaStep[] = [];
      let stdout = '';

      for (let i = 0; i < mainMethod.lines.length; i++) {
        const line = mainMethod.lines[i];
        const lineNumber = i + 1;

        // 빈 라인 스킵
        if (!line.trim()) {
          continue;
        }

        // 현재 컨텍스트
        const context: JavaContext = {
          stack: this.stack['frames'],
          heap: this.heap['objects'],
          stdout,
          currentLine: lineNumber,
          stepCount: steps.length
        };

        // 라인 처리
        const result = await this.handlerRegistry.handleLine(line, context);

        // stdout 업데이트
        stdout = context.stdout;

        // Step 생성
        const step: JavaStep = {
          lineNumber,
          code: line,
          stack: this.stack.snapshot(),
          heap: this.heap.snapshot(),
          explanation: result.explanation,
          events: result.events,
          stdout,
          callDepth: this.stack.depth
        };

        steps.push(step);

        // 에러 발생 시 중단
        if (!result.success) {
          return {
            success: false,
            steps,
            sourceLines,
            error: result.error || 'Unknown error'
          };
        }
      }

      return {
        success: true,
        steps,
        sourceLines
      };

    } catch (error: any) {
      console.error('Simulation error:', error);

      return {
        success: false,
        steps: [],
        sourceLines: extractSourceLines(code),
        error: error.message || 'Simulation failed'
      };
    }
  }

  /**
   * 디버그 정보 출력
   */
  debug(): void {
    console.log('=== Java Simulator State ===');
    this.stack.debug();
    this.heap.debug();
  }
}

/**
 * 시뮬레이터 인스턴스 생성
 */
export function createSimulator(): JavaSimulator {
  return new JavaSimulator();
}
