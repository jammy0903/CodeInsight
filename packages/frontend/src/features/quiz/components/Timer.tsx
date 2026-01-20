/**
 * Timer - 카운트다운 타이머 컴포넌트
 *
 * PROPS:
 * - duration: 카운트다운 시간 (초)
 * - onTimeout: 시간 초과 시 호출될 콜백 함수
 */
import { useState, useEffect } from 'react';
import { Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  duration: number;
  onTimeout: () => void;
  isPaused: boolean;
}

export function Timer({ duration, onTimeout, isPaused }: TimerProps) {
  const [remainingTime, setRemainingTime] = useState(duration);

  useEffect(() => {
    setRemainingTime(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    if (remainingTime <= 0) {
      onTimeout();
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingTime, onTimeout, isPaused]);

  const progress = (remainingTime / duration) * 100;

  return (
    <div className="flex items-center gap-2">
      <TimerIcon className="w-5 h-5 text-gray-500" />
      <div className="w-24 h-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-1000 linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="text-sm font-mono text-gray-600">{remainingTime}s</span>
    </div>
  );
}
