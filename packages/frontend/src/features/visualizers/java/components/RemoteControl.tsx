/**
 * RemoteControl 컴포넌트
 *
 * 목적: 변수를 리모컨으로 시각화
 * - 리모컨 = 변수 (선언 타입)
 * - 버튼 = 메서드 (호출 가능한 것들)
 * - 연결된 기기 = 실제 객체
 */

import { Card } from '@/components/ui/card';
import type { RemoteControl as RemoteControlType } from '../types';

interface RemoteControlProps {
  remote: RemoteControlType;
  onMethodCall?: (method: string) => void;
  isActive?: boolean;
  className?: string;
}

export function RemoteControl({
  remote,
  onMethodCall,
  isActive = false,
  className = '',
}: RemoteControlProps) {
  return (
    <Card
      className={`
        relative p-4 rounded-2xl
        bg-gradient-to-br from-gray-100 to-gray-200
        border-2 border-gray-300
        shadow-lg
        ${isActive ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}
        ${className}
      `}
    >
      {/* 리모컨 헤더 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <div>
            <div className="text-sm font-mono text-gray-600">
              {remote.name}
            </div>
            <div className="text-xs text-gray-500">
              Type: {remote.declaredType}
            </div>
          </div>
        </div>
      </div>

      {/* 연결 상태 */}
      <div className="mb-4 p-3 bg-white/80 rounded-lg">
        {remote.connectedDevice ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono">
              Connected: {remote.connectedDevice}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm text-gray-500">
              Not connected (null)
            </span>
          </div>
        )}
      </div>

      {/* 버튼들 (메서드) */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-600 mb-2">
          Available Methods:
        </div>
        {remote.availableButtons.map((method) => (
          <button
            key={method}
            onClick={() => onMethodCall?.(method)}
            disabled={!remote.connectedDevice}
            className={`
              w-full px-4 py-2 rounded-lg
              font-mono text-sm
              transition-all duration-200
              ${
                remote.connectedDevice
                  ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {method}()
          </button>
        ))}
      </div>

      {/* 활성 상태 표시 */}
      {isActive && (
        <div className="absolute -top-2 -right-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      )}
    </Card>
  );
}
