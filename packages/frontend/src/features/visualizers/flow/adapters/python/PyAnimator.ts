/**
 * PyAnimator - Python Language Animator
 *
 * Python 언어 전용 애니메이션 생성
 * - 이름 바인딩: 화살표 연결
 * - 리바인딩: 화살표 이동
 * - 객체 생성: 박스 나타남
 * - print: 값이 터미널로 날아감
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

export class PyAnimator implements IFlowAnimator {
  /**
   * 변수 생성 시 애니메이션
   * Python: 이름 바인딩 + 객체 생성
   */
  createVariableAnimations(variable: FlowVariable): FlowAnimation[] {
    const animations: FlowAnimation[] = [];

    // 박스 생성
    animations.push({
      id: `create-box-${variable.id}`,
      type: 'box-create',
      targetId: variable.id,
      duration: FLOW_ANIMATION.duration.normal,
      delay: 0,
      easing: 'easeOut',
    });

    // 이름 변수인 경우 화살표 그리기 애니메이션
    if (variable.isPointer && variable.pointsTo) {
      animations.push({
        id: `arrow-draw-${variable.id}`,
        type: 'arrow-draw',
        targetId: variable.id, // from (name)
        // Note: pointsTo는 변수의 속성으로, ArrowLayer가 참조함
        duration: FLOW_ANIMATION.duration.normal,
        delay: FLOW_ANIMATION.stagger,
        easing: 'easeOut',
      });
    }

    return animations;
  }

  /**
   * 값 변경 시 애니메이션
   * Python: 리바인딩 (화살표 이동)
   */
  updateVariableAnimations(
    variable: FlowVariable,
    oldValue: FlowValue,
    newValue: FlowValue
  ): FlowAnimation[] {
    const animations: FlowAnimation[] = [];

    // 하이라이트
    animations.push({
      id: `highlight-${variable.id}`,
      type: 'box-highlight',
      targetId: variable.id,
      duration: FLOW_ANIMATION.duration.fast,
      delay: 0,
      easing: 'easeOut',
    });

    // 이름 변수의 리바인딩 (화살표 방향 변경)
    if (variable.isPointer && variable.pointsTo) {
      animations.push({
        id: `rebind-${variable.id}`,
        type: 'arrow-redirect',
        targetId: variable.id,
        // Note: 새 대상은 variable.pointsTo 속성으로 ArrowLayer가 참조
        duration: FLOW_ANIMATION.duration.normal,
        delay: FLOW_ANIMATION.stagger,
        easing: 'easeOut',
      });
    } else {
      // 객체 내부 값 변경 (list append 등)
      animations.push({
        id: `value-update-${variable.id}`,
        type: 'value-drop',
        targetId: variable.id,
        value: newValue,
        duration: FLOW_ANIMATION.duration.normal,
        delay: FLOW_ANIMATION.stagger,
        easing: 'easeOut',
      });
    }

    return animations;
  }

  /**
   * 변수 삭제 시 애니메이션
   */
  deleteVariableAnimations(variable: FlowVariable): FlowAnimation[] {
    const animations: FlowAnimation[] = [];

    // 화살표가 있으면 먼저 제거
    if (variable.isPointer && variable.pointsTo) {
      animations.push({
        id: `arrow-remove-${variable.id}`,
        type: 'arrow-remove',
        targetId: variable.id,
        duration: FLOW_ANIMATION.duration.fast,
        delay: 0,
        easing: 'easeOut',
      });
    }

    // 박스 사라짐
    animations.push({
      id: `destroy-box-${variable.id}`,
      type: 'box-destroy',
      targetId: variable.id,
      duration: FLOW_ANIMATION.duration.normal,
      delay: variable.isPointer ? FLOW_ANIMATION.stagger : 0,
      easing: 'easeOut',
    });

    return animations;
  }

  /**
   * 출력 시 애니메이션 (print)
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
          animations.push({ ...a, delay: delay + (a.delay || 0) });
        });
      }
    });
    if (diff.deleted.length > 0) {
      delay += FLOW_ANIMATION.duration.normal;
    }

    // 2. 생성된 변수 애니메이션 (객체 먼저, 이름 나중에)
    // 객체와 이름 분리
    const createdObjects = diff.created.filter((id) => id.startsWith('obj-'));
    const createdNames = diff.created.filter((id) => id.startsWith('name-'));

    // 객체 생성
    createdObjects.forEach((id, index) => {
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
    if (createdObjects.length > 0) {
      delay += FLOW_ANIMATION.duration.normal + createdObjects.length * FLOW_ANIMATION.stagger;
    }

    // 이름 바인딩 (객체 생성 후)
    createdNames.forEach((id, index) => {
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
    if (createdNames.length > 0) {
      delay += FLOW_ANIMATION.duration.normal + createdNames.length * FLOW_ANIMATION.stagger;
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
export const pyAnimator = new PyAnimator();
