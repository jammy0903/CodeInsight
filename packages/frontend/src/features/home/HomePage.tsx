/**
 * HomePage - Minimal Landing
 * 첫 화면: CodeInsight 큰 제목
 * 스크롤: 설명 + CTA + 특징
 */

import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Zap, Clock, Trophy } from 'lucide-react';
import { useStore } from '@/stores/store';

export default function HomePage() {
  const { firebaseUser } = useStore();
  const isLoggedIn = !!firebaseUser;

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
      <section className="w-full grid place-items-center py-20 px-6 bg-[#f8f4ef]">
        <div className="max-w-5xl w-full space-y-16">
          {/* 만화 6칸 (2열 3행) - public/images/comic-1.svg ~ comic-6.svg 넣으면 됨 */}
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className="aspect-square bg-white border-2 border-[#e5d5c7] rounded-xl overflow-hidden"
              >
                <img
                  src={`/images/comic-${num}.svg`}
                  alt={`만화 ${num}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // 이미지 없으면 placeholder 표시
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[#937b5d] text-sm">만화 ${num}</div>`;
                  }}
                />
              </div>
            ))}
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
