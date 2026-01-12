/**
 * MatrixRain - 매트릭스 스타일 코드 비 효과
 *
 * WHY: Canvas API로 구현하여 수백 개 문자도 60fps 유지
 * PROPS: color(문자 색상), fontSize(크기), speed(떨어지는 속도)
 */

import { useEffect, useRef, memo } from 'react';

interface MatrixRainProps {
  color?: string;
  fontSize?: number;
  speed?: number;
}

export const MatrixRain = memo(({
  color = '#00ff00',
  fontSize = 14,
  speed = 50
}: MatrixRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기를 부모에 맞춤
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 매트릭스 문자들 (숫자, 영문, 코드 기호)
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン{}[]<>/*+-=;:';
    const charArray = chars.split('');

    // 열(column) 설정
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    // 각 열의 시작 위치를 랜덤하게
    for (let i = 0; i < drops.length; i++) {
      drops[i] = Math.random() * -100;
    }

    let animationId: number;
    let lastTime = 0;

    const draw = (currentTime: number) => {
      // 속도 제어
      if (currentTime - lastTime < speed) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastTime = currentTime;

      // 반투명 검정으로 덮어서 잔상 효과
      ctx.fillStyle = 'rgba(250, 247, 242, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = color;
      ctx.font = `${fontSize}px monospace`;

      // 각 열에 문자 그리기
      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        // 화면 아래로 내려가면 랜덤하게 리셋
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [color, fontSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.15 }}
    />
  );
});

MatrixRain.displayName = 'MatrixRain';
