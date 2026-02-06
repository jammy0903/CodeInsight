/**
 * 교육용 설명 생성기
 *
 * 실행된 코드 라인과 상태 변화를 분석하여 교육적 설명을 한국어로 생성합니다.
 * 제어 흐름(if/for/while)에 대한 설명도 포함 — 기존 시뮬레이터에 없던 새 기능입니다.
 */

import type { Step } from '../runtime/types';
import type { VisualizationEvent } from '@codeinsight/shared';

/**
 * 코드 라인 + 상태 변화 기반 설명 생성
 */
export function generateExplanation(
  code: string,
  prevStep: Step | null,
  currentStep: Step,
  events: VisualizationEvent[],
): string {
  const trimmed = code.trim();

  // 빈 줄 / 중괄호만 있는 줄
  if (!trimmed || trimmed === '{' || trimmed === '}') {
    return '';
  }

  // 이벤트 기반 설명 시도
  const eventExplanation = explainFromEvents(events, trimmed);
  if (eventExplanation) return eventExplanation;

  // 코드 패턴 기반 설명
  return explainFromPattern(trimmed, prevStep, currentStep);
}

// ============================================
// 이벤트 기반 설명
// ============================================

function explainFromEvents(events: VisualizationEvent[], code: string): string | null {
  if (events.length === 0) return null;

  const parts: string[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'frame': {
        if (event.action === 'push') {
          parts.push(`함수 ${event.name}()이 호출되어 새 스택 프레임이 생성되었습니다.`);
        } else {
          parts.push(`함수 ${event.name}()에서 복귀하여 스택 프레임이 제거되었습니다.`);
        }
        break;
      }

      case 'variable': {
        if (event.action === 'declare') {
          const typeStr = event.varType ? `${event.varType} 타입의 ` : '';
          const valStr = event.value !== undefined ? ` 값은 ${event.value}입니다.` : '';
          parts.push(`${typeStr}변수 ${event.name}이(가) 선언되었습니다.${valStr}`);
        } else if (event.action === 'assign') {
          parts.push(
            `변수 ${event.name}의 값이 ${event.previousValue ?? '?'} → ${event.value}로 변경되었습니다.`
          );
        }
        break;
      }

      case 'heap': {
        if (event.action === 'allocate') {
          parts.push(`힙에 ${event.size}바이트 메모리가 할당되었습니다. 주소: ${event.address}`);
        } else if (event.action === 'free') {
          parts.push(`힙 메모리(${event.address})가 해제되었습니다.`);
        }
        break;
      }

      case 'warning': {
        parts.push(`⚠️ ${event.message}`);
        break;
      }
    }
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

// ============================================
// 코드 패턴 기반 설명
// ============================================

function explainFromPattern(code: string, prevStep: Step | null, currentStep: Step): string {
  // --- 전처리기 ---
  if (code.startsWith('#include')) {
    const lib = code.match(/<(.+?)>/)?.[1] ?? code.match(/"(.+?)"/)?.[1] ?? '';
    return `${lib} 헤더 파일을 포함합니다.`;
  }
  if (code.startsWith('#define')) {
    return `매크로를 정의합니다: ${code}`;
  }

  // --- 제어 흐름 (NEW!) ---
  if (code.match(/^\s*if\s*\(/)) {
    return `조건문을 평가합니다.`;
  }
  if (code.match(/^\s*else\s*if\s*\(/)) {
    return `이전 조건이 거짓이어서 다음 조건을 평가합니다.`;
  }
  if (code.match(/^\s*else\s*{?$/)) {
    return `이전 조건이 모두 거짓이어서 else 블록에 진입합니다.`;
  }
  if (code.match(/^\s*for\s*\(/)) {
    return `반복문 조건을 확인합니다.`;
  }
  if (code.match(/^\s*while\s*\(/)) {
    return `while 반복문 조건을 확인합니다.`;
  }
  if (code.match(/^\s*do\s*{?$/)) {
    return `do-while 반복문에 진입합니다.`;
  }
  if (code.match(/^\s*switch\s*\(/)) {
    return `switch문의 표현식을 평가합니다.`;
  }
  if (code.match(/^\s*case\s+/)) {
    return `case 레이블에 매칭되어 실행합니다.`;
  }
  if (code.match(/^\s*break\s*;/)) {
    return `break로 현재 블록을 빠져나갑니다.`;
  }
  if (code.match(/^\s*continue\s*;/)) {
    return `continue로 다음 반복으로 건너뜁니다.`;
  }

  // --- 함수 ---
  if (code.match(/^\s*return\s/)) {
    const funcName = currentStep.functionName ?? '함수';
    return `${funcName}()에서 값을 반환합니다.`;
  }

  // --- 메모리 ---
  if (code.includes('malloc') || code.includes('calloc')) {
    return `동적 메모리를 할당합니다.`;
  }
  if (code.match(/^\s*free\s*\(/)) {
    return `동적 메모리를 해제합니다.`;
  }

  // --- I/O ---
  if (code.includes('printf')) {
    return `표준 출력에 텍스트를 출력합니다.`;
  }
  if (code.includes('scanf')) {
    return `표준 입력에서 값을 읽습니다.`;
  }

  // --- 기본 ---
  return `${code.trim()} 를 실행합니다.`;
}
