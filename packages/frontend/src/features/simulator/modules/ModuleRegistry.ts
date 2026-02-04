/**
 * Module Registry
 *
 * 모듈을 ID로 등록하고 조회한다.
 * 프로파일이 모듈 ID를 참조하면, 레지스트리에서 해당 모듈 인스턴스를 가져온다.
 *
 * 사용법:
 *   ModuleRegistry.register(CallStackModule);
 *   const module = ModuleRegistry.get('call-stack');
 */

import type { VisualizationModule } from './types';

class ModuleRegistryImpl {
  private modules = new Map<string, VisualizationModule>();

  /** 모듈 등록 */
  register(module: VisualizationModule): void {
    if (this.modules.has(module.id)) {
      console.warn(`[ModuleRegistry] Overwriting existing module: ${module.id}`);
    }
    this.modules.set(module.id, module);
  }

  /** 모듈 조회 (없으면 에러) */
  get(id: string): VisualizationModule {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(
        `[ModuleRegistry] Module "${id}" not found. ` +
        `Registered modules: [${[...this.modules.keys()].join(', ')}]`
      );
    }
    return module;
  }

  /** 모듈 존재 여부 */
  has(id: string): boolean {
    return this.modules.has(id);
  }

  /** 등록된 모든 모듈 ID */
  getRegisteredIds(): string[] {
    return [...this.modules.keys()];
  }

  /** 모듈 해제 */
  unregister(id: string): void {
    this.modules.delete(id);
  }

  /** 전체 초기화 (테스트용) */
  clear(): void {
    this.modules.clear();
  }
}

export const ModuleRegistry = new ModuleRegistryImpl();
