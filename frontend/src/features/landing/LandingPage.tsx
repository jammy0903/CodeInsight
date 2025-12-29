import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CI</span>
            </div>
            <span className="font-semibold text-white">CodeInsight</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              to="/courses"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              코스
            </Link>
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
              로그인
            </Button>
          </nav>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main>
        <Hero />
        <Features />

        {/* CTA 섹션 */}
        <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              포인터, 메모리, 참조... 더 이상 외우지 마세요.
              <br />
              눈으로 보고, 진짜로 이해하세요.
            </p>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
              asChild
            >
              <Link to="/courses">
                C 언어 코스 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="py-8 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          © 2025 CodeInsight. 코드 원리 학습 플랫폼
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
