/**
 * JavaMessagesView - Java 메시지 전달 시각화
 *
 * 목적: 리모컨 비유로 다형성 시각화
 * - 왼쪽: 리모컨들 (변수)
 * - 오른쪽: 기기들 (객체)
 * - 중앙: 연결선 + 메시지 흐름
 */

import { useState } from 'react';
import { RemoteControl } from './components/RemoteControl';
import { DeviceCard } from './components/DeviceCard';
import type { RemoteControl as RemoteType, JavaDevice } from './types';

interface JavaMessagesViewProps {
  remotes: RemoteType[];
  devices: JavaDevice[];
  currentLine?: number;
  className?: string;
}

export function JavaMessagesView({
  remotes,
  devices,
  currentLine,
  className = '',
}: JavaMessagesViewProps) {
  const [executingMethod, setExecutingMethod] = useState<string | null>(null);
  const [activeRemote, setActiveRemote] = useState<string | null>(null);

  const handleMethodCall = (remoteName: string, method: string) => {
    setActiveRemote(remoteName);
    setExecutingMethod(method);

    // 애니메이션 후 리셋
    setTimeout(() => {
      setActiveRemote(null);
      setExecutingMethod(null);
    }, 2000);
  };

  return (
    <div className={`h-full ${className}`}>
      {/* 헤더 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎮</span>
          <h2 className="text-lg font-bold">Messages (리모컨 비유)</h2>
        </div>
        <p className="text-sm text-gray-600">
          리모컨 = 변수 (선언 타입), 기기 = 객체 (실제 타입)
        </p>
        <p className="text-sm text-gray-600">
          💡 같은 버튼이지만 연결된 기기에 따라 다르게 동작! (다형성)
        </p>
      </div>

      {/* 메인 영역: 리모컨 | 기기 */}
      <div className="grid grid-cols-2 gap-8">
        {/* 왼쪽: 리모컨들 */}
        <div className="space-y-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            🎮 Remotes (Variables)
          </div>
          {remotes.map((remote) => (
            <RemoteControl
              key={remote.name}
              remote={remote}
              onMethodCall={(method) => handleMethodCall(remote.name, method)}
              isActive={activeRemote === remote.name}
            />
          ))}
        </div>

        {/* 오른쪽: 기기들 */}
        <div className="space-y-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            📺 Devices (Objects)
          </div>
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              executingMethod={executingMethod}
            />
          ))}
        </div>
      </div>

      {/* 다형성 설명 (하단) */}
      {activeRemote && executingMethod && (
        <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-bold text-yellow-900">
                Polymorphism in Action!
              </div>
              <div className="text-sm text-yellow-800">
                리모컨 <span className="font-mono font-bold">{activeRemote}</span>
                의 <span className="font-mono font-bold">{executingMethod}()</span>
                버튼을 눌렀습니다.
              </div>
              <div className="text-sm text-yellow-800 mt-1">
                연결된 기기의 메서드가 실행됩니다! (선언 타입이 아님)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 연결선 (향후 SVG로 구현) */}
      {/* TODO: SVG overlay로 리모컨 → 기기 연결선 표시 */}
    </div>
  );
}
