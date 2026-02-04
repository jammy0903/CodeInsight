/**
 * ModuleRenderer - 프로파일 기반 모듈 렌더링
 *
 * VisualizerPanel.tsx의 switch/case를 대체한다.
 * 언어 프로파일이 선언한 모듈을 동적으로 로드하고 배치.
 *
 * 동작:
 * 1. 현재 언어의 프로파일에서 모듈 목록을 가져옴
 * 2. ModuleRegistry에서 모듈 인스턴스를 조회
 * 3. EventBus에 각 모듈의 구독을 등록
 * 4. position별로 그룹핑하여 레이아웃 렌더링
 */

import { useEffect, useMemo, useState } from 'react';
import { eventBus } from '../engine/EventBus';
import { ModuleRegistry } from './ModuleRegistry';
import { getProfile } from '../profiles';
import type { Language } from '../engine/types';
import type { VisualizationModule } from './types';
import type { ModuleConfig } from '../profiles/types';

interface ModuleRendererProps {
  language: Language;
}

interface ActiveModule {
  config: ModuleConfig;
  module: VisualizationModule;
}

export function ModuleRenderer({ language }: ModuleRendererProps) {
  const profile = useMemo(() => getProfile(language), [language]);
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);

  // 언어 변경 시 모듈 재구성 (side effects는 useEffect에서)
  useEffect(() => {
    const subscribe = eventBus.subscribe.bind(eventBus);
    const unsubscribers: Array<() => void> = [];
    const modules: ActiveModule[] = [];

    for (const config of profile.modules) {
      if (!ModuleRegistry.has(config.id)) {
        continue;
      }

      const module = ModuleRegistry.get(config.id);
      module.init(config, language);

      // EventBus 구독
      for (const eventType of module.subscribes) {
        const unsub = subscribe(eventType, (e) => module.onEvent(e));
        unsubscribers.push(unsub);
      }

      modules.push({ config, module });
    }

    setActiveModules(modules);

    // cleanup: 구독 해제 + 모듈 destroy
    return () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
      for (const { module } of modules) {
        module.destroy();
      }
    };
  }, [language, profile]);

  if (activeModules.length === 0) {
    return <EmptyState language={language} />;
  }

  // position별 그룹핑 (priority 순 정렬)
  const left = activeModules
    .filter(m => m.config.position === 'left')
    .sort((a, b) => a.config.priority - b.config.priority);
  const center = activeModules
    .filter(m => m.config.position === 'center')
    .sort((a, b) => a.config.priority - b.config.priority);
  const right = activeModules
    .filter(m => m.config.position === 'right')
    .sort((a, b) => a.config.priority - b.config.priority);
  const bottom = activeModules
    .filter(m => m.config.position === 'bottom')
    .sort((a, b) => a.config.priority - b.config.priority);

  return (
    <div className="flex flex-col h-full gap-2">
      {/* 메인 영역: left | center | right */}
      <div className="flex-1 flex gap-2 min-h-0">
        {left.length > 0 && (
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {left.map(m => (
              <ModuleSlot key={m.config.id} module={m.module} />
            ))}
          </div>
        )}
        {center.length > 0 && (
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {center.map(m => (
              <ModuleSlot key={m.config.id} module={m.module} />
            ))}
          </div>
        )}
        {right.length > 0 && (
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {right.map(m => (
              <ModuleSlot key={m.config.id} module={m.module} />
            ))}
          </div>
        )}
      </div>

      {/* 하단 영역 */}
      {bottom.length > 0 && (
        <div className="shrink-0 flex gap-2">
          {bottom.map(m => (
            <ModuleSlot key={m.config.id} module={m.module} />
          ))}
        </div>
      )}
    </div>
  );
}

/** 개별 모듈 슬롯 */
function ModuleSlot({ module }: { module: VisualizationModule }) {
  return (
    <div className="flex-1 rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden flex flex-col min-h-0">
      <div className="px-3 py-1.5 text-xs text-[#8b949e] border-b border-[#30363d] shrink-0 font-mono">
        {module.name}
      </div>
      <div className="flex-1 p-2 overflow-auto">
        {module.render()}
      </div>
    </div>
  );
}

/** 모듈이 하나도 없을 때 */
function EmptyState({ language }: { language: Language }) {
  return (
    <div className="h-full flex items-center justify-center text-[#8b949e]">
      <div className="text-center">
        <p className="text-sm">No visualization modules registered for <strong>{language}</strong></p>
        <p className="text-xs mt-1 text-[#484f58]">Modules will be added in upcoming phases</p>
      </div>
    </div>
  );
}
