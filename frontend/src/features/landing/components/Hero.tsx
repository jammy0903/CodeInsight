"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Code2, Cpu, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 시뮬레이터 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const codeLines = [
    { num: 1, code: "int x = 10;", active: currentStep === 0 },
    { num: 2, code: "int *p;", active: currentStep === 1 },
    { num: 3, code: "p = &x;", active: currentStep === 2 },
    { num: 4, code: "*p = 20;", active: currentStep === 3 },
  ];

  const memoryState = [
    { step: 0, x: 10, p: "???", arrow: false },
    { step: 1, x: 10, p: "???", arrow: false },
    { step: 2, x: 10, p: "0x1004", arrow: true },
    { step: 3, x: 20, p: "0x1004", arrow: true },
  ];

  const current = memoryState[currentStep];

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-emerald-600/10" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isLoaded ? { opacity: 0.3, scale: 1 } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isLoaded ? { opacity: 0.2, scale: 1 } : {}}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl"
        />
      </div>

      {/* 그리드 패턴 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px),
                           linear-gradient(to bottom, #334155 1px, transparent 1px)`,
          backgroundSize: "4rem 4rem",
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      <div className="container relative z-10 mx-auto px-6 py-24 lg:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* 왼쪽: 텍스트 콘텐츠 */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* 뱃지 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-blue-400">
                C 언어 코스 오픈
              </span>
            </motion.div>

            {/* 메인 헤드라인 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight"
            >
              코드를 써보면서,
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                눈으로 원리를 이해하세요
              </span>
            </motion.h1>

            {/* 서브 헤드라인 */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0"
            >
              AI가 대신 짜준 코드조차 이해하지 못하는 사람을,
              <br className="hidden md:block" />
              스스로 설명할 수 있는 개발자로
            </motion.p>

            {/* CTA 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg group"
                asChild
              >
                <Link to="/courses">
                  학습 시작하기
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                데모 보기
              </Button>
            </motion.div>

            {/* 특징 아이콘 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isLoaded ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex gap-8 justify-center lg:justify-start pt-4"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <Code2 className="h-5 w-5" />
                <span className="text-sm">실시간 시뮬레이션</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Cpu className="h-5 w-5" />
                <span className="text-sm">메모리 시각화</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm">AI 해설</span>
              </div>
            </motion.div>
          </div>

          {/* 오른쪽: 시뮬레이터 미리보기 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 50 }}
            animate={isLoaded ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex-1 w-full max-w-xl"
          >
            <div className="relative">
              {/* 글로우 효과 */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-2xl blur-xl" />

              {/* 메인 카드 */}
              <div className="relative bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                {/* 헤더 */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-slate-500 ml-2">pointer_demo.c</span>
                </div>

                {/* 콘텐츠 */}
                <div className="grid grid-cols-2 divide-x divide-slate-700/50">
                  {/* 코드 영역 */}
                  <div className="p-4">
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Code</div>
                    <div className="font-mono text-sm space-y-1">
                      {codeLines.map((line) => (
                        <div
                          key={line.num}
                          className={`flex transition-all duration-300 ${
                            line.active
                              ? "bg-blue-500/20 text-blue-300 -mx-2 px-2 py-0.5 rounded"
                              : "text-slate-400"
                          }`}
                        >
                          <span className="w-6 text-slate-600">{line.num}</span>
                          <span>{line.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 메모리 영역 */}
                  <div className="p-4">
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Memory</div>
                    <div className="space-y-3">
                      {/* Stack */}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-2">STACK</div>
                        <div className="space-y-2">
                          {/* 변수 p */}
                          <div className="flex items-center gap-2">
                            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded px-2 py-1 text-xs text-emerald-400 font-mono w-8 text-center">
                              p
                            </div>
                            <motion.div
                              key={`p-${current.p}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 font-mono"
                            >
                              {current.p}
                            </motion.div>
                            {current.arrow && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-blue-400"
                              >
                                →
                              </motion.div>
                            )}
                          </div>
                          {/* 변수 x */}
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-500/20 border border-blue-500/30 rounded px-2 py-1 text-xs text-blue-400 font-mono w-8 text-center">
                              x
                            </div>
                            <motion.div
                              key={`x-${current.x}`}
                              initial={{ scale: 1.2, backgroundColor: "rgba(59, 130, 246, 0.3)" }}
                              animate={{ scale: 1, backgroundColor: "rgba(51, 65, 85, 0.5)" }}
                              transition={{ duration: 0.3 }}
                              className="bg-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 font-mono"
                            >
                              {current.x}
                            </motion.div>
                            <span className="text-xs text-slate-600 font-mono">0x1004</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 스텝 인디케이터 */}
                <div className="flex items-center justify-center gap-2 py-3 bg-slate-800/30 border-t border-slate-700/50">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all ${
                        step === currentStep
                          ? "bg-blue-500 w-4"
                          : "bg-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
