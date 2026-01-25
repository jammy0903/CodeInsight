/**
 * 🎯 패턴: 통합 시뮬레이터 핸들러 (Unified Simulator Handler)
 * 
 * ## 의도 (Why)
 * - 다양한 프로그래밍 언어(C, Python, Java)의 시뮬레이션 로직을 통일된 인터페이스로 관리합니다.
 * - 각 언어별 시뮬레이터 엔진을 추상화하여 API 계층에서는 언어에 관계없이 동일한 방식으로 호출할 수 있게 합니다.
 * 
 * ## 구조
 * - `Simulator`: 메인 조율 클래스 (싱글톤 또는 인스턴스)
 * - `HandlerRegistry`: 언어/구문별 핸들러 매핑
 * - `Context`: 시뮬레이션 상태(메모리, 변수 등) 저장소
 * 
 * ## 예시 (TypeScript)
 */

export interface SimStep {
    line: number;
    code: string;
    explanation: string;
    stack: any[];
    heap: any[];
}

export interface SimResult {
    success: boolean;
    steps: SimStep[];
    error?: string;
}

/**
 * 범용 시뮬레이터 인터페이스
 */
export interface ISimulator {
    simulate(code: string, stdin?: string): Promise<SimResult>;
}

/**
 * Java 시뮬레이터 구현 예시
 */
export class JavaSimulator implements ISimulator {
    async simulate(code: string, stdin?: string): Promise<SimResult> {
        try {
            // 1. AST 파싱
            // 2. 가상 머신(VM) 실행 또는 단계별 해석
            // 3. 상태 변화(Step) 캡처
            return {
                success: true,
                steps: [
                    {
                        line: 1,
                        code: "int x = 10;",
                        explanation: "변수 x를 스택에 할당하고 10을 저장합니다.",
                        stack: [{ name: "x", value: 10, type: "int" }],
                        heap: []
                    }
                ]
            };
        } catch (e) {
            return { success: false, steps: [], error: String(e) };
        }
    }
}
