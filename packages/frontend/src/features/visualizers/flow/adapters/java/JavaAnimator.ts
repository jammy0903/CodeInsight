/**
 * JavaAnimator - Java Language Animator
 *
 * Java 언어 전용 애니메이션 생성
 * - 변수 생성: 박스 나타남 + 값 떨어짐
 * - 값 변경: 값 교체 애니메이션
 * - 객체 생성: 힙에 객체 나타남 + 참조 연결
 */

import type {
  FlowVariable,
  FlowAnimation,
  FlowValue,
  FlowStep,
  FlowDiff,
} from '@codeinsight/shared';
import type { IFlowAnimator } from '../base/types';
import { FLOW_ANIMATION } from '../../styles';

export class JavaAnimator implements IFlowAnimator {
  /**
   * 변수 생성 시 애니메이션
   * 1. 박스 생성 (scale 0 → 1)
   * 2. 값 떨어짐 (위에서 아래로)
   */
  createVariableAnimations(variable: FlowVariable): FlowAnimation[] {
    return [
      {
        id: `create-box-${variable.id}`,
        type: 'box-create',
        targetId: variable.id,
        duration: FLOW_ANIMATION.duration.normal,
        delay: 0,
        easing: 'easeOut',
      },
      {
        id: `drop-value-${variable.id}`,
        type: 'value-drop',
        targetId: variable.id,
        value: variable.value,
        duration: FLOW_ANIMATION.duration.normal,
        delay: FLOW_ANIMATION.stagger, // 박스 생성 후 약간 지연
        easing: 'easeOut',
      },
    ];
  }

  /**
   * 값 변경 시 애니메이션
   * 1. 기존 값 사라짐
   * 2. 새 값 떨어짐
   * 3. 박스 하이라이트
   */
  updateVariableAnimations(
    variable: FlowVariable,
    oldValue: FlowValue,
    newValue: FlowValue
  ): FlowAnimation[] {
    return [
      {
        id: `highlight-${variable.id}`,
        type: 'box-highlight',
        targetId: variable.id,
        duration: FLOW_ANIMATION.duration.fast,
        delay: 0,
        easing: 'easeOut',
      },
      {
        id: `update-value-${variable.id}`,
        type: 'value-drop',
        targetId: variable.id,
        value: newValue,
        duration: FLOW_ANIMATION.duration.normal,
        delay: FLOW_ANIMATION.stagger,
        easing: 'easeOut',
      },
    ];
  }

  /**
   * 변수 삭제 시 애니메이션
   * - 박스 사라짐 (scale 1 → 0)
   */
  deleteVariableAnimations(variable: FlowVariable): FlowAnimation[] {
    return [
      {
        id: `destroy-box-${variable.id}`,
        type: 'box-destroy',
        targetId: variable.id,
        duration: FLOW_ANIMATION.duration.normal,
        delay: 0,
        easing: 'easeOut',
      },
    ];
  }

  /**
   * 출력 시 애니메이션 (System.out.println)
   * - 값이 터미널로 날아감
   */
  outputAnimations(variable: FlowVariable, output: string): FlowAnimation[] {
    return [
      {
        id: `fly-value-${variable.id}`,
        type: 'value-fly',
        targetId: variable.id,
        value: output,
        duration: FLOW_ANIMATION.duration.slow,
        delay: 0,
        easing: 'easeOut',
      },
    ];
  }

  /**
   * FlowDiff에서 전체 애니메이션 생성
   */
  createAnimationsFromDiff(
    diff: FlowDiff,
    currentStep: FlowStep,
    prevStep?: FlowStep
  ): FlowAnimation[] {
    const animations: FlowAnimation[] = [];
    let delay = 0;

    // 1. 삭제된 변수 애니메이션 (먼저)
    diff.deleted.forEach((id) => {
      const variable = prevStep?.variables.find((v) => v.id === id);
      if (variable) {
        const anims = this.deleteVariableAnimations(variable);
        anims.forEach((a) => {
          animations.push({ ...a, delay });
        });
      }
    });
    if (diff.deleted.length > 0) {
      delay += FLOW_ANIMATION.duration.normal;
    }

    // 2. 생성된 변수 애니메이션
    diff.created.forEach((id, index) => {
      const variable = currentStep.variables.find((v) => v.id === id);
      if (variable) {
        const anims = this.createVariableAnimations(variable);
        anims.forEach((a) => {
          animations.push({
            ...a,
            delay: delay + index * FLOW_ANIMATION.stagger,
          });
        });
      }
    });
    if (diff.created.length > 0) {
      delay += FLOW_ANIMATION.duration.normal + diff.created.length * FLOW_ANIMATION.stagger;
    }

    // 3. 업데이트된 변수 애니메이션
    diff.updated.forEach((id, index) => {
      const variable = currentStep.variables.find((v) => v.id === id);
      const prevVariable = prevStep?.variables.find((v) => v.id === id);
      if (variable && prevVariable) {
        const anims = this.updateVariableAnimations(
          variable,
          prevVariable.value,
          variable.value
        );
        anims.forEach((a) => {
          animations.push({
            ...a,
            delay: delay + index * FLOW_ANIMATION.stagger,
          });
        });
      }
    });

    // 4. 터미널 출력 애니메이션
    if (currentStep.terminalOutput?.fromVariableId) {
      const variable = currentStep.variables.find(
        (v) => v.id === currentStep.terminalOutput?.fromVariableId
      );
      if (variable) {
        const anims = this.outputAnimations(variable, currentStep.terminalOutput.text);
        animations.push(...anims);
      }
    }

    return animations;
  }
}

// 싱글톤 인스턴스
export const javaAnimator = new JavaAnimator();
