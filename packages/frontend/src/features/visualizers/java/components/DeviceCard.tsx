/**
 * DeviceCard 컴포넌트
 *
 * 목적: 실제 객체를 기기로 시각화
 * - 기기 = 실제 객체 (Dog, Cat 등)
 * - 기기 타입별 색상 + 아이콘
 * - 메서드 실행 상태 표시
 */

import { Card } from '@/components/ui/card';
import type { JavaDevice, DeviceColor } from '../types';

interface DeviceCardProps {
  device: JavaDevice;
  executingMethod?: string | null;
  className?: string;
}

// 색상 매핑
const colorMap: Record<DeviceColor, string> = {
  blue: 'from-blue-400 to-blue-600',
  green: 'from-green-400 to-green-600',
  purple: 'from-purple-400 to-purple-600',
  orange: 'from-orange-400 to-orange-600',
  gray: 'from-gray-400 to-gray-600',
};

const borderColorMap: Record<DeviceColor, string> = {
  blue: 'border-blue-500',
  green: 'border-green-500',
  purple: 'border-purple-500',
  orange: 'border-orange-500',
  gray: 'border-gray-500',
};

export function DeviceCard({
  device,
  executingMethod = null,
  className = '',
}: DeviceCardProps) {
  return (
    <Card
      className={`
        relative p-4 rounded-2xl
        border-4 ${borderColorMap[device.color]}
        ${className}
      `}
    >
      {/* 기기 헤더 */}
      <div
        className={`
          mb-4 p-3 rounded-lg text-white
          bg-gradient-to-br ${colorMap[device.color]}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl">{device.icon}</span>
          <div>
            <div className="font-bold text-lg">{device.type}</div>
            <div className="text-xs opacity-80">{device.id}</div>
          </div>
        </div>
      </div>

      {/* 상속 정보 */}
      {device.superClass && (
        <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
          <span className="text-gray-600">extends</span>
          <span className="ml-1 font-mono font-semibold">
            {device.superClass}
          </span>
        </div>
      )}

      {/* 메서드 목록 */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-gray-600 mb-2">
          Methods:
        </div>
        <div className="space-y-1">
          {device.methods.map((method) => (
            <div
              key={method.name}
              className={`
                p-2 rounded font-mono text-sm
                transition-all duration-200
                ${
                  executingMethod === method.name
                    ? 'bg-yellow-200 border-2 border-yellow-400 scale-105 shadow-md'
                    : 'bg-white border border-gray-200'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{method.name}()</span>
                {method.isOverridden && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    ⭐ Override
                  </span>
                )}
              </div>
              {method.isOverridden && method.overriddenFrom && (
                <div className="text-xs text-gray-500 mt-1">
                  from {method.overriddenFrom}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 필드 목록 */}
      {device.fields.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">
            Fields:
          </div>
          <div className="space-y-1">
            {device.fields.map((field) => (
              <div
                key={field.name}
                className="p-2 bg-gray-50 rounded text-sm font-mono"
              >
                <span className="text-gray-500">{field.type}</span>
                <span className="ml-1 font-semibold">{field.name}</span>
                <span className="ml-1 text-gray-400">=</span>
                <span className="ml-1 text-blue-600">
                  {JSON.stringify(field.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 실행 중 표시 */}
      {executingMethod && (
        <div className="absolute -top-3 -right-3">
          <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ⚡ Executing
          </div>
        </div>
      )}
    </Card>
  );
}
