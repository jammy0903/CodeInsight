interface CBrandIconProps {
  language: 'c' | 'cpp';
  size?: number;
  className?: string;
}

/**
 * C/C++ 전용 3D 스타일 배지 아이콘
 * - 표준 이모지가 없는 C/C++를 시각적으로 일관되게 표시
 */
export function CBrandIcon({ language, size = 42, className }: CBrandIconProps) {
  const label = language === 'cpp' ? 'C++' : 'C';
  const fontSize = language === 'cpp' ? 22 : 30;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 8 64 46"
      className={`block ${className ?? ''}`}
      aria-label={label}
      role="img"
    >
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fill="#1E3A8A"
      >
        {label}
      </text>
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fill="#3B82F6"
      >
        {label}
      </text>
      <text
        x="32"
        y="34"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="900"
        fill="#DBEAFE"
        stroke="#93C5FD"
        strokeWidth="0.7"
        paintOrder="stroke"
      >
        {label}
      </text>
    </svg>
  );
}
