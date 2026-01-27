/**
 * MatrixRain - 매트릭스 스타일 떨어지는 글자 애니메이션
 * Canvas 기반으로 성능 최적화
 */

import { useEffect, useRef, memo } from 'react';

interface MatrixRainProps {
  /** 글자 색상 */
  color?: string;
  /** 글자 크기 */
  fontSize?: number;
  /** 떨어지는 속도 (낮을수록 빠름) */
  speed?: number;
}

export const MatrixRain = memo(function MatrixRain({
  color = '#a08060',
  fontSize = 14,
  speed = 50,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const dropsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기를 부모 컨테이너에 맞춤
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // 열 개수 계산 및 drops 초기화
      const columns = Math.floor(canvas.width / fontSize);
      dropsRef.current = Array(columns).fill(0).map(() => Math.random() * -50);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 사용할 문자들 (코드 관련)
    const chars = '01{}[]();=><+-*/%int void char if else for while return printf malloc free';

    let lastTime = 0;

    const draw = (currentTime: number) => {
      if (currentTime - lastTime < speed) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      lastTime = currentTime;

      // 캔버스 클리어 (투명하게)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = color;
      ctx.globalAlpha = 1;

      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        // 랜덤 문자 선택
        const char = chars[Math.floor(Math.random() * chars.length)];

        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(char, x, y);

        // 화면 아래로 벗어나면 확률적으로 리셋
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i] += 0.5;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color, fontSize, speed]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
});
