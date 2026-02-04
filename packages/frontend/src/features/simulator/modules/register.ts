/**
 * Module Registration
 *
 * 앱 시작 시 호출하여 모든 모듈을 ModuleRegistry에 등록한다.
 * Phase별로 새 모듈이 추가되면 여기에 import + register 추가.
 */

import { ModuleRegistry } from './ModuleRegistry';

// Phase 1: Call Stack (4개 언어 공통)
import { CallStackModule } from './call-stack';

// Phase 2: C 모듈들
import { StackFrameModule } from './stack-frame';
import { HeapMemoryModule } from './heap-memory';
import { PointerGraphModule } from './pointer-graph';

// Phase 3: Python 모듈들
import { NameBindingModule } from './name-binding';
import { ObjectHeapModule } from './object-heap';

// Phase 4: JS 모듈들
import { ScopeChainModule } from './scope-chain';

export function registerAllModules() {
  // 중복 등록 방지
  if (ModuleRegistry.has('call-stack')) return;

  // Phase 1
  ModuleRegistry.register(CallStackModule);

  // Phase 2: C 모듈들
  ModuleRegistry.register(StackFrameModule);
  ModuleRegistry.register(HeapMemoryModule);
  ModuleRegistry.register(PointerGraphModule);

  // Phase 3: Python 모듈들 (object-heap은 Java/JS에서도 공유)
  ModuleRegistry.register(NameBindingModule);
  ModuleRegistry.register(ObjectHeapModule);

  // Phase 4: JS 모듈들
  ModuleRegistry.register(ScopeChainModule);
}
