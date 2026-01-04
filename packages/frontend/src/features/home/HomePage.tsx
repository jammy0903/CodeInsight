/**
 * HomePage - Clean & Fast Landing
 * 성능 최우선, 단색 배경, Inter 글씨체
 * 여백은 index.css에서 관리
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Code2, Brain, Target } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 home-bg">
      {/* Hero Section */}
      <section className="mx-auto text-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-bold text-text"
          >
            코드가 어떻게
            <br />
            <span className="gradient-text-gold">동작하는지</span> 보세요
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-text-secondary mx-auto"
          >
            포인터, 메모리, 참조... 더 이상 외우지 마세요.
            <br />
            시각화와 AI로 진짜 이해하세요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-4 justify-center"
          >
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary text-lg px-10 py-4 rounded-xl"
              >
                로그인하기
              </motion.button>
            </Link>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary text-lg px-10 py-4 rounded-xl"
              >
                회원가입하기
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* 시뮬레이터 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="bg-bg-elevated border-2 border-border rounded-2xl text-center"
          >
            <div className="w-20 h-20 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Code2 className="w-10 h-10 text-amber-700" />
            </div>
            <h3 className="font-bold text-text">코드 시뮬레이터</h3>
            <p className="text-text-secondary">
              한 줄씩 실행하며
              <br />
              상태 변화를 눈으로 확인
            </p>
          </motion.div>

          {/* AI 해설자 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-bg-elevated border-2 border-border rounded-2xl text-center"
          >
            <div className="w-20 h-20 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Brain className="w-10 h-10 text-amber-700" />
            </div>
            <h3 className="font-bold text-text">AI 해설자</h3>
            <p className="text-text-secondary">
              지금 이 줄이 왜 이렇게
              <br />
              동작하는지 설명
            </p>
          </motion.div>

          {/* 미세 실습 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-bg-elevated border-2 border-border rounded-2xl text-center"
          >
            <div className="w-20 h-20 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Target className="w-10 h-10 text-amber-700" />
            </div>
            <h3 className="font-bold text-text">미세 실습</h3>
            <p className="text-text-secondary">
              결과 예측, 한 줄 수정으로
              <br />
              개념 확인
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto text-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-bold text-text">
              하루 10분, 코드의 원리를 깨우치세요
            </h2>
            <p className="text-text-secondary">
              무료로 시작하고, 언제든 학습하세요
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-secondary text-lg px-10 py-4 rounded-xl"
                >
                  로그인하기
                </motion.button>
              </Link>
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary text-lg px-10 py-4 rounded-xl"
                >
                  회원가입하기
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
