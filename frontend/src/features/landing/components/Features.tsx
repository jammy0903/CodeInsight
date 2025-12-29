"use client";

import { motion } from "framer-motion";
import { Monitor, Bot, PenTool, Zap, Eye, Brain } from "lucide-react";

const features = [
  {
    icon: Monitor,
    title: "실시간 시뮬레이션",
    description:
      "코드를 한 줄씩 실행하며 Stack, Heap 메모리의 변화를 눈으로 직접 확인하세요.",
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "AI 해설자",
    description:
      "코드를 생성하지 않고, 현재 줄이 왜 그렇게 동작하는지 원리를 설명해드립니다.",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: PenTool,
    title: "미세 실습",
    description:
      "결과 예측, 메모리 상태 예측, 한 줄 수정 등 작은 실습으로 개념을 확실히 익히세요.",
    color: "purple",
    gradient: "from-purple-500 to-pink-500",
  },
];

const subFeatures = [
  { icon: Zap, text: "하루 5~10분" },
  { icon: Eye, text: "시각적 이해" },
  { icon: Brain, text: "원리 중심" },
];

export function Features() {
  return (
    <section className="relative py-24 bg-slate-950">
      {/* 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      <div className="container relative z-10 mx-auto px-6">
        {/* 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            코드를{" "}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              진짜로
            </span>{" "}
            이해하는 방법
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            문법을 외우는 것이 아니라, 코드가 메모리에서 어떻게 동작하는지 직접
            보고 이해합니다
          </p>
        </motion.div>

        {/* 메인 기능 카드 */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="group relative h-full">
                {/* 호버 글로우 */}
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                />

                {/* 카드 */}
                <div className="relative h-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                  {/* 아이콘 */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* 텍스트 */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* 하단 장식 */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 서브 기능 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-8"
        >
          {subFeatures.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-slate-400 bg-slate-800/50 px-5 py-3 rounded-full border border-slate-700/50"
            >
              <item.icon className="w-5 h-5 text-blue-400" />
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Features;
