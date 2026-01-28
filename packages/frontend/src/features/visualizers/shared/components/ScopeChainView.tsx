/**
 * ScopeChainView - Scope Chain 시각화 컴포넌트
 * JavaScript, Python 등에서 스코프 체인을 표시
 */

import type { ScopeChainState } from '../types';

interface ScopeChainViewProps {
  state: ScopeChainState;
  highlightLookup?: boolean;
}

export function ScopeChainView({ state, highlightLookup = false }: ScopeChainViewProps) {
  const { scopes, currentScopeId, lookupPath, targetVariable } = state;

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-[var(--theme-dashboard-title)]">
        Scope Chain
      </h3>

      <div className="space-y-3">
        {scopes.map((scope) => {
          const isActive = scope.id === currentScopeId;
          const isInLookupPath = lookupPath?.includes(scope.id);

          return (
            <div
              key={scope.id}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 bg-opacity-20'
                  : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                }
                ${isInLookupPath && highlightLookup
                  ? 'ring-2 ring-yellow-400'
                  : ''
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[var(--theme-dashboard-title)]">
                  {scope.name}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-[var(--theme-dashboard-text-muted)]">
                  {scope.type}
                </span>
              </div>

              <div className="space-y-1">
                {Object.entries(scope.variables).length === 0 ? (
                  <div className="text-sm text-[var(--theme-dashboard-text-muted)] italic">
                    (빈 스코프)
                  </div>
                ) : (
                  Object.entries(scope.variables).map(([key, value]) => {
                    const isTarget = targetVariable === key && highlightLookup;

                    return (
                      <div
                        key={key}
                        className={`
                          flex items-center gap-2 text-sm p-2 rounded
                          ${isTarget
                            ? 'bg-yellow-100 dark:bg-yellow-900 bg-opacity-30 font-semibold'
                            : 'bg-gray-50 dark:bg-gray-900 bg-opacity-50'
                          }
                        `}
                      >
                        <span className="font-mono text-[var(--theme-dashboard-accent)]">
                          {key}
                        </span>
                        <span className="text-[var(--theme-dashboard-text-muted)]">=</span>
                        <span className="font-mono text-[var(--theme-dashboard-text)]">
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)
                          }
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {targetVariable && highlightLookup && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 bg-opacity-20 rounded-lg border border-yellow-300 dark:border-yellow-700">
          <div className="text-sm">
            <span className="font-semibold">변수 탐색:</span>{' '}
            <span className="font-mono text-[var(--theme-dashboard-accent)]">{targetVariable}</span>
          </div>
        </div>
      )}
    </div>
  );
}
