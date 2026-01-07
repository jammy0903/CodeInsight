/**
 * HomePage - Minimal Landing
 * 첫 화면: CodeInsight 큰 제목
 * 스크롤: 설명 + CTA + 특징
 */

import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Zap, Clock, Trophy } from 'lucide-react';
import { useStore } from '@/stores/store';
import { motion } from 'framer-motion';
import { memo } from 'react';

// 스토리 SVG 패널 컴포넌트 (Row 1용)
const StoryPanel = memo(({ num }: { num: number }) => {
  const panels: Record<number, React.ReactNode> = {
    // 1. 코드 작성
    1: (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        {/* 배경 */}
        <rect width="300" height="300" fill="#faf7f2" />

        {/* 제목 */}
        <text x="150" y="35" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          1. 코드 작성 ✏️
        </text>

        {/* 에디터 창 */}
        <rect x="30" y="55" width="240" height="160" rx="12" fill="#1e1e1e" />
        <circle cx="50" cy="72" r="6" fill="#ff5f57" />
        <circle cx="70" cy="72" r="6" fill="#ffbd2e" />
        <circle cx="90" cy="72" r="6" fill="#28ca41" />

        {/* 코드 라인들 */}
        <text x="45" y="105" fontSize="13" fill="#569cd6" fontFamily="monospace">int</text>
        <text x="75" y="105" fontSize="13" fill="#9cdcfe" fontFamily="monospace">main</text>
        <text x="115" y="105" fontSize="13" fill="#ffd700" fontFamily="monospace">() {'{'}</text>

        <text x="55" y="130" fontSize="13" fill="#569cd6" fontFamily="monospace">int</text>
        <text x="85" y="130" fontSize="13" fill="#9cdcfe" fontFamily="monospace">x</text>
        <text x="100" y="130" fontSize="13" fill="#d4d4d4" fontFamily="monospace">=</text>
        <text x="115" y="130" fontSize="13" fill="#b5cea8" fontFamily="monospace">5</text>
        <text x="125" y="130" fontSize="13" fill="#d4d4d4" fontFamily="monospace">;</text>

        <text x="55" y="155" fontSize="13" fill="#569cd6" fontFamily="monospace">int</text>
        <text x="85" y="155" fontSize="13" fill="#9cdcfe" fontFamily="monospace">y</text>
        <text x="100" y="155" fontSize="13" fill="#d4d4d4" fontFamily="monospace">=</text>
        <text x="115" y="155" fontSize="13" fill="#9cdcfe" fontFamily="monospace">x</text>
        <text x="128" y="155" fontSize="13" fill="#d4d4d4" fontFamily="monospace">+</text>
        <text x="143" y="155" fontSize="13" fill="#b5cea8" fontFamily="monospace">3</text>
        <text x="153" y="155" fontSize="13" fill="#d4d4d4" fontFamily="monospace">;</text>

        <text x="45" y="180" fontSize="13" fill="#ffd700" fontFamily="monospace">{'}'}</text>

        {/* 커서 깜빡임 효과 */}
        <rect x="163" y="143" width="2" height="16" fill="#fff">
          <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
        </rect>

        {/* 말풍선 */}
        <ellipse cx="220" cy="250" rx="65" ry="28" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <circle cx="175" cy="230" r="5" fill="white" />
        <circle cx="165" cy="220" r="3" fill="white" />
        <text x="220" y="255" textAnchor="middle" fontSize="14" fill="#6b5a4a" fontFamily="var(--font-handwriting)">코드를 써볼까?</text>
      </svg>
    ),

    // 2. 실행 버튼
    2: (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#faf7f2" />

        <text x="150" y="35" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          2. 실행! ▶️
        </text>

        {/* 큰 재생 버튼 */}
        <circle cx="150" cy="140" r="60" fill="#a08060" />
        <circle cx="150" cy="140" r="55" fill="#c4a574">
          <animate attributeName="r" values="55;58;55" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <polygon points="135,115 135,165 175,140" fill="white" />

        {/* RUN 텍스트 */}
        <text x="150" y="225" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          RUN!
        </text>

        {/* 반짝이 효과 */}
        <text x="80" y="100" fontSize="20">✨</text>
        <text x="210" y="110" fontSize="18">✨</text>
        <text x="90" y="180" fontSize="16">✨</text>
        <text x="200" y="190" fontSize="20">✨</text>

        {/* 말풍선 */}
        <ellipse cx="150" cy="270" rx="60" ry="22" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <text x="150" y="275" textAnchor="middle" fontSize="14" fill="#6b5a4a" fontFamily="var(--font-handwriting)">클릭해서 실행!</text>
      </svg>
    ),

    // 3. Step 실행
    3: (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#faf7f2" />

        <text x="150" y="35" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          3. 한 줄씩 실행 👀
        </text>

        {/* 코드 박스 */}
        <rect x="30" y="50" width="240" height="140" rx="12" fill="white" stroke="#e5d5c7" strokeWidth="2" />

        {/* 라인 번호 */}
        <text x="45" y="80" fontSize="12" fill="#a08060" fontFamily="monospace">1</text>
        <text x="45" y="105" fontSize="12" fill="#a08060" fontFamily="monospace">2</text>
        <text x="45" y="130" fontSize="12" fill="#a08060" fontFamily="monospace">3</text>
        <text x="45" y="155" fontSize="12" fill="#a08060" fontFamily="monospace">4</text>

        {/* 현재 줄 하이라이트 */}
        <rect x="55" y="90" width="200" height="22" rx="4" fill="#fff3cd" />

        {/* 코드 */}
        <text x="65" y="80" fontSize="13" fill="#6b5a4a" fontFamily="monospace">int x = 5;</text>
        <text x="65" y="105" fontSize="13" fill="#6b5a4a" fontFamily="monospace" fontWeight="bold">int y = x + 3;</text>
        <text x="65" y="130" fontSize="13" fill="#6b5a4a" fontFamily="monospace">printf("%d", y);</text>
        <text x="65" y="155" fontSize="13" fill="#6b5a4a" fontFamily="monospace">return 0;</text>

        {/* 화살표 포인터 */}
        <polygon points="25,101 40,95 40,107" fill="#ff6b6b" />

        {/* 컨트롤 버튼들 */}
        <rect x="70" y="205" width="50" height="35" rx="8" fill="#e5d5c7" />
        <text x="95" y="228" textAnchor="middle" fontSize="20">⏮️</text>

        <rect x="125" y="205" width="50" height="35" rx="8" fill="#c4a574" />
        <text x="150" y="228" textAnchor="middle" fontSize="20">⏭️</text>

        <rect x="180" y="205" width="50" height="35" rx="8" fill="#e5d5c7" />
        <text x="205" y="228" textAnchor="middle" fontSize="20">⏹️</text>

        {/* 말풍선 */}
        <ellipse cx="150" cy="270" rx="70" ry="22" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <text x="150" y="275" textAnchor="middle" fontSize="14" fill="#6b5a4a" fontFamily="var(--font-handwriting)">지금 이 줄 실행중!</text>
      </svg>
    ),

    // 4. 메모리 변화
    4: (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#faf7f2" />

        <text x="150" y="35" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          4. 메모리 변화 🧠
        </text>

        {/* Stack 라벨 */}
        <rect x="40" y="55" width="100" height="30" rx="8" fill="#a08060" />
        <text x="90" y="75" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">Stack</text>

        {/* Stack 영역 */}
        <rect x="40" y="90" width="100" height="120" rx="8" fill="white" stroke="#e5d5c7" strokeWidth="2" />

        {/* 변수 박스들 */}
        <rect x="50" y="100" width="80" height="35" rx="6" fill="#fff3cd" stroke="#ffc107" strokeWidth="2" />
        <text x="65" y="122" fontSize="14" fill="#6b5a4a" fontFamily="monospace">x:</text>
        <text x="100" y="122" fontSize="16" fill="#e74c3c" fontWeight="bold" fontFamily="monospace">5</text>

        <rect x="50" y="145" width="80" height="35" rx="6" fill="#d4edda" stroke="#28a745" strokeWidth="2">
          <animate attributeName="opacity" values="0;1" dur="0.5s" fill="freeze" />
        </rect>
        <text x="65" y="167" fontSize="14" fill="#6b5a4a" fontFamily="monospace">y:</text>
        <text x="100" y="167" fontSize="16" fill="#28a745" fontWeight="bold" fontFamily="monospace">8</text>

        {/* Heap 라벨 */}
        <rect x="160" y="55" width="100" height="30" rx="8" fill="#937b5d" />
        <text x="210" y="75" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">Heap</text>

        {/* Heap 영역 */}
        <rect x="160" y="90" width="100" height="120" rx="8" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <text x="210" y="155" textAnchor="middle" fontSize="12" fill="#a08060">(비어있음)</text>

        {/* 화살표 애니메이션 */}
        <path d="M 90 225 L 90 195" stroke="#ff6b6b" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ff6b6b" />
          </marker>
        </defs>

        {/* 말풍선 */}
        <ellipse cx="200" cy="255" rx="75" ry="28" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <circle cx="140" cy="235" r="5" fill="white" />
        <circle cx="125" cy="225" r="3" fill="white" />
        <text x="200" y="260" textAnchor="middle" fontSize="14" fill="#6b5a4a" fontFamily="var(--font-handwriting)">메모리가 보여요!</text>
      </svg>
    ),

    // 5. AI 해설
    5: (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#faf7f2" />

        <text x="150" y="35" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          5. AI가 설명해줘요 🤖
        </text>

        {/* AI 로봇 얼굴 */}
        <circle cx="150" cy="120" r="50" fill="#c4a574" />
        <circle cx="150" cy="120" r="45" fill="#e5d5c7" />

        {/* 눈 */}
        <circle cx="130" cy="110" r="12" fill="white" />
        <circle cx="170" cy="110" r="12" fill="white" />
        <circle cx="132" cy="112" r="6" fill="#6b5a4a">
          <animate attributeName="cx" values="132;135;132" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="172" cy="112" r="6" fill="#6b5a4a">
          <animate attributeName="cx" values="172;175;172" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* 입 (웃는 표정) */}
        <path d="M 130 135 Q 150 155 170 135" stroke="#6b5a4a" strokeWidth="3" fill="none" />

        {/* 안테나 */}
        <line x1="150" y1="70" x2="150" y2="55" stroke="#a08060" strokeWidth="3" />
        <circle cx="150" cy="50" r="8" fill="#ff6b6b">
          <animate attributeName="fill" values="#ff6b6b;#ffd700;#ff6b6b" dur="1s" repeatCount="indefinite" />
        </circle>

        {/* AI 말풍선 */}
        <rect x="40" y="185" width="220" height="70" rx="15" fill="white" stroke="#c4a574" strokeWidth="2" />
        <polygon points="100,185 115,170 130,185" fill="white" stroke="#c4a574" strokeWidth="2" />
        <rect x="100" y="183" width="32" height="5" fill="white" />

        <text x="150" y="210" textAnchor="middle" fontSize="13" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          x+3을 계산해서
        </text>
        <text x="150" y="230" textAnchor="middle" fontSize="13" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          y에 저장했어요! 💡
        </text>

        {/* 반짝이 */}
        <text x="60" y="90" fontSize="16">✨</text>
        <text x="230" y="100" fontSize="14">✨</text>
        <text x="250" y="200" fontSize="18">💬</text>
      </svg>
    ),

    // 6. 퀴즈
    6: (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#faf7f2" />

        <text x="150" y="35" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          6. 퀴즈 타임! 📝
        </text>

        {/* 질문 박스 */}
        <rect x="30" y="50" width="240" height="60" rx="12" fill="white" stroke="#c4a574" strokeWidth="2" />
        <text x="150" y="75" textAnchor="middle" fontSize="15" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          Q. y의 최종 값은?
        </text>
        <text x="150" y="98" textAnchor="middle" fontSize="13" fill="#937b5d" fontFamily="monospace">
          int x=5; int y=x+3;
        </text>

        {/* 선택지들 */}
        <rect x="40" y="125" width="100" height="45" rx="10" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <text x="90" y="153" textAnchor="middle" fontSize="18" fill="#6b5a4a" fontWeight="bold">A. 5</text>

        <rect x="160" y="125" width="100" height="45" rx="10" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <text x="210" y="153" textAnchor="middle" fontSize="18" fill="#6b5a4a" fontWeight="bold">B. 8</text>

        <rect x="40" y="180" width="100" height="45" rx="10" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <text x="90" y="208" textAnchor="middle" fontSize="18" fill="#6b5a4a" fontWeight="bold">C. 3</text>

        <rect x="160" y="180" width="100" height="45" rx="10" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <text x="210" y="208" textAnchor="middle" fontSize="18" fill="#6b5a4a" fontWeight="bold">D. 15</text>

        {/* 생각하는 이모지 */}
        <text x="150" y="265" textAnchor="middle" fontSize="30">🤔</text>

        {/* 말풍선 */}
        <ellipse cx="230" cy="265" rx="55" ry="22" fill="white" stroke="#e5d5c7" strokeWidth="2" />
        <text x="230" y="270" textAnchor="middle" fontSize="13" fill="#6b5a4a" fontFamily="var(--font-handwriting)">음... 뭘까?</text>
      </svg>
    ),

    // 7. 정답 확인
    7: (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#faf7f2" />

        <text x="150" y="35" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          7. 정답! ✅
        </text>

        {/* 큰 체크 원 */}
        <circle cx="150" cy="130" r="60" fill="#d4edda" stroke="#28a745" strokeWidth="4" />

        {/* 체크마크 */}
        <path d="M 115 130 L 140 155 L 185 100" stroke="#28a745" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dashoffset" from="100" to="0" dur="0.5s" fill="freeze" />
        </path>

        {/* 정답 텍스트 */}
        <text x="150" y="215" textAnchor="middle" fontSize="24" fill="#28a745" fontWeight="bold" fontFamily="var(--font-handwriting)">
          정답은 8!
        </text>

        {/* 설명 */}
        <rect x="40" y="235" width="220" height="40" rx="10" fill="white" stroke="#28a745" strokeWidth="2" />
        <text x="150" y="260" textAnchor="middle" fontSize="13" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          x(5) + 3 = 8 이에요!
        </text>

        {/* 축하 이펙트 */}
        <text x="50" y="80" fontSize="20">🎉</text>
        <text x="240" y="90" fontSize="18">🎊</text>
        <text x="70" y="180" fontSize="16">⭐</text>
        <text x="220" y="170" fontSize="18">✨</text>
        <text x="45" y="250" fontSize="14">👏</text>
        <text x="260" y="240" fontSize="16">👍</text>
      </svg>
    ),

    // 8. 완료
    8: (
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <rect width="300" height="300" fill="#faf7f2" />

        <text x="150" y="35" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#6b5a4a" fontFamily="var(--font-handwriting)">
          8. 학습 완료! 🎓
        </text>

        {/* 트로피 */}
        <ellipse cx="150" cy="180" rx="35" ry="10" fill="#c4a574" />
        <rect x="130" y="165" width="40" height="20" fill="#c4a574" />

        <path d="M 100 90 L 100 130 Q 100 160 150 160 Q 200 160 200 130 L 200 90 Z" fill="#ffd700" stroke="#f0c000" strokeWidth="2" />

        {/* 트로피 손잡이 */}
        <ellipse cx="80" cy="110" rx="15" ry="25" fill="none" stroke="#ffd700" strokeWidth="8" />
        <ellipse cx="220" cy="110" rx="15" ry="25" fill="none" stroke="#ffd700" strokeWidth="8" />

        {/* 별 */}
        <polygon points="150,75 156,95 178,95 160,108 168,128 150,115 132,128 140,108 122,95 144,95" fill="white" />

        {/* 프로그레스 바 */}
        <rect x="50" y="210" width="200" height="20" rx="10" fill="#e5d5c7" />
        <rect x="50" y="210" width="200" height="20" rx="10" fill="#28a745">
          <animate attributeName="width" from="0" to="200" dur="1s" fill="freeze" />
        </rect>
        <text x="150" y="224" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">100%</text>

        {/* 완료 메시지 */}
        <text x="150" y="260" textAnchor="middle" fontSize="20" fill="#6b5a4a" fontWeight="bold" fontFamily="var(--font-handwriting)">
          Day 1 완료!
        </text>

        {/* 축하 이펙트 */}
        <text x="40" y="70" fontSize="22">🎉</text>
        <text x="245" y="75" fontSize="20">🎊</text>
        <text x="55" y="150" fontSize="18">✨</text>
        <text x="235" y="140" fontSize="16">⭐</text>
        <text x="80" y="280" fontSize="20">🥳</text>
        <text x="200" y="285" fontSize="18">🏆</text>
      </svg>
    ),
  };

  return (
    <div className="w-[300px] h-[300px] bg-white border-2 border-[#e5d5c7] rounded-xl overflow-hidden relative shrink-0">
      {panels[num] || <div className="w-full h-full bg-[#f8f4ef]" />}
    </div>
  );
});

StoryPanel.displayName = 'StoryPanel';

// 패널 컴포넌트를 메모이제이션하여 불필요한 재렌더링 방지
const ComicPanel = memo(({ num, getImage, speeches, showImage = true }: { num: number; getImage: (n: number) => string; speeches: Record<number, string>; showImage?: boolean }) => {
  const imageSrc = showImage ? getImage(num) : '';
  const speech = showImage ? speeches[num] : undefined;

  return (
    <div className="w-[300px] h-[300px] bg-white border-2 border-[#e5d5c7] rounded-xl overflow-hidden relative shrink-0">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`만화 ${num}`}
          className={`w-full h-full object-cover ${num === 5 ? 'object-[30%]' : ''}`}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-[#f8f4ef]" />
      )}

      {speech && (
        <div className={`absolute top-2 pointer-events-none ${num === 2 || num === 3 || num === 6 ? 'right-3' : 'left-3'}`}>
          <svg viewBox="0 0 200 55" className="w-full h-auto max-w-[85%] drop-shadow-xl">
            <rect x="0" y="0" width="200" height="45" rx="22" fill="white" stroke="#e5e7eb" strokeWidth="1" />
            {num === 2 || num === 3 ? (
              <>
                <circle cx="100" cy="45" r="6" fill="white" />
                <circle cx="100" cy="50" r="4" fill="white" />
                <circle cx="100" cy="53" r="2.5" fill="white" />
              </>
            ) : num === 6 ? (
              <>
                <circle cx="170" cy="45" r="6" fill="white" />
                <circle cx="175" cy="50" r="4" fill="white" />
                <circle cx="178" cy="53" r="2.5" fill="white" />
              </>
            ) : (
              <>
                <circle cx="30" cy="45" r="6" fill="white" />
                <circle cx="25" cy="50" r="4" fill="white" />
                <circle cx="22" cy="53" r="2.5" fill="white" />
              </>
            )}
            <text x="100" y="28" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1f2937" fontFamily="var(--font-handwriting)">
              {speech}
            </text>
          </svg>
        </div>
      )}
    </div>
  );
});

ComicPanel.displayName = 'ComicPanel';

export default function HomePage() {
  const { firebaseUser } = useStore();
  const isLoggedIn = !!firebaseUser;

  // 각 패널의 이미지 파일명 매핑
  const getComicImage = (num: number): string => {
    const imageMap: Record<number, string> = {
      1: '/images/comic-1.jpg',
      2: '/images/comic-2-douma.png',      // 도우마 (귀멸의 칼날) - 괴로워하며 학습
      3: '/images/comic-3-conan.png',      // 코난 - 책상에서 열심히 공부
      5: '/images/comic-5-levi.png',       // 리바이 (진격의 거인)
      6: '/images/comic-6-complete.png',   // 곤+킬루아+히소카 - 완성 트로피
      // 4, 7, 8, 9는 빈 패널
    };
    return imageMap[num] || '';  // 빈 패널은 이미지 없음
  };

  // 각 패널의 말풍선 내용
  const speechBubbles: Record<number, string> = {
    2: '포인터가 뭐야... 왜 이렇게 어려워...',
    3: '난 ADHD라서 집중이 안되는데',
    4: '어? 시각화로 보니까 이해된다!',
    6: '나 이제 컴퓨터 박사야!',
  };

  return (
    <main className="min-h-screen w-full">
      {/* Hero Section - 첫 화면 전체 */}
      <section className="h-screen w-full grid place-items-center relative">
        <div className="text-center">
          {/* 큰 제목 */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-[#6b5a4a] tracking-tight">
            CodeInsight
          </h1>

          {/* 부제 */}
          <p className="mt-6 text-lg md:text-xl text-[#937b5d]">
            코드의 원리를 눈으로 이해하다
          </p>
        </div>

        {/* 스크롤 표시 */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#a08060] animate-bounce">
          <span className="text-sm">scroll</span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* Value Proposition - 메인 메시지 */}
      <section className="min-h-screen w-full grid place-items-center py-20 px-6">
        <div className="max-w-2xl text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-[#6b5a4a] leading-tight">
            코드가 어떻게<br />동작하는지 보세요
          </h2>

          <p className="text-lg text-[#937b5d] leading-relaxed">
            포인터, 메모리, 참조...<br />
            더 이상 외우지 마세요. 시각화로 진짜 이해하세요.
          </p>

          {/* 로그인/회원가입 버튼 */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Link to="/courses">
                <button className="btn-primary text-lg px-8 py-4 rounded-xl inline-flex items-center gap-2">
                  학습 시작하기
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            ) : (
              <>
                <button className="btn-primary text-lg px-8 py-4 rounded-xl">
                  회원가입
                </button>
                <button className="btn-secondary text-lg px-8 py-4 rounded-xl">
                  로그인
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 핵심 특징 - 만화 + 특징 카드 */}
      <section className="w-full grid place-items-center pt-2 pb-20 px-4 bg-[#f8f4ef]">
        <div className="w-full space-y-16">
          {/* 만화 컨베이어 벨트 - 두 줄 wrapper */}
          <div className="flex flex-col gap-16">
            {/* 1행 - 오른쪽에서 왼쪽으로 */}
            <div className="relative overflow-hidden">
              <motion.div
                className="flex gap-6"
                animate={{ x: [0, -2592] }}
                transition={{
                  x: { repeat: Infinity, repeatType: "loop", duration: 25, ease: "linear" },
                }}
              >
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex gap-6 shrink-0">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <StoryPanel key={`${setIndex}-${num}`} num={num} />
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* 2행 - 왼쪽에서 오른쪽으로 (반대 방향) */}
            <div className="relative overflow-hidden">
            <motion.div
              className="flex gap-6"
              animate={{ x: [-2592, 0] }}
              transition={{
                x: { repeat: Infinity, repeatType: "loop", duration: 25, ease: "linear" },
              }}
            >
              {[...Array(2)].map((_, setIndex) => (
                <div key={`row2-${setIndex}`} className="flex gap-6 shrink-0">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <ComicPanel key={`row2-${setIndex}-${num}`} num={num} getImage={getComicImage} speeches={speechBubbles} />
                  ))}
                </div>
              ))}
            </motion.div>
            </div>
          </div>

          {/* 특징 카드 3개 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* 인터렉티브 */}
            <div className="space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-[#e5d5c7] rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-[#a08060]" />
              </div>
              <h3 className="text-xl font-bold text-[#6b5a4a]">인터렉티브 학습</h3>
              <p className="text-[#937b5d]">
                읽기만 하는 지루한 강의 NO<br />
                직접 조작하며 배우세요
              </p>
            </div>

            {/* ADHD 친화 */}
            <div className="space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-[#e5d5c7] rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-[#a08060]" />
              </div>
              <h3 className="text-xl font-bold text-[#6b5a4a]">하루 10분이면 충분</h3>
              <p className="text-[#937b5d]">
                집중력 걱정 마세요<br />
                짧고 강렬하게, ADHD도 OK
              </p>
            </div>

            {/* 빠른 완성 */}
            <div className="space-y-4 p-6">
              <div className="w-16 h-16 mx-auto bg-[#e5d5c7] rounded-2xl flex items-center justify-center">
                <Trophy className="w-8 h-8 text-[#a08060]" />
              </div>
              <h3 className="text-xl font-bold text-[#6b5a4a]">2주면 C언어 기초 완성</h3>
              <p className="text-[#937b5d]">
                포인터, 메모리, 배열까지<br />
                핵심만 빠르게 마스터
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 학습 방식 - 시각화, AI, 실습 */}
      <section className="w-full grid place-items-center py-20 px-6">
        <div className="max-w-3xl w-full text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#6b5a4a] mb-12">
            이렇게 배워요
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="text-5xl">👁️</div>
              <h3 className="text-lg font-bold text-[#6b5a4a]">시각화</h3>
              <p className="text-sm text-[#937b5d]">메모리 상태를<br />눈으로 확인</p>
            </div>
            <div className="space-y-3">
              <div className="text-5xl">🤖</div>
              <h3 className="text-lg font-bold text-[#6b5a4a]">AI 해설</h3>
              <p className="text-sm text-[#937b5d]">왜 이렇게 동작하는지<br />친절하게 설명</p>
            </div>
            <div className="space-y-3">
              <div className="text-5xl">✏️</div>
              <h3 className="text-lg font-bold text-[#6b5a4a]">미세 실습</h3>
              <p className="text-sm text-[#937b5d]">결과 예측으로<br />개념 확인</p>
            </div>
          </div>
        </div>
      </section>

      {/* 마지막 CTA */}
      <section className="w-full grid place-items-center py-20 px-6 bg-[#f8f4ef]">
        <div className="text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#6b5a4a]">
            지금 바로 시작하세요
          </h2>
          <p className="text-[#937b5d]">
            가입 없이 바로 체험 가능
          </p>
          <Link to="/courses">
            <button className="btn-primary text-lg px-10 py-4 rounded-xl inline-flex items-center gap-2">
              코스 둘러보기
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
