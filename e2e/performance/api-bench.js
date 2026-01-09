#!/usr/bin/env node
/**
 * CodeInsight API 벤치마크
 *
 * 사용법:
 *   node e2e/performance/api-bench.js
 *   node e2e/performance/api-bench.js --duration 20 --connections 50
 *
 * autocannon을 사용하여 주요 API 엔드포인트의 성능을 측정합니다.
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// 색상 정의
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

// 기본 설정
const BASE_URL = 'http://localhost:3002';
const DURATION = 10; // 초
const CONNECTIONS = 10;

// 벤치마크할 엔드포인트
const endpoints = [
  {
    name: 'Languages 목록',
    method: 'GET',
    path: '/api/courses/languages',
  },
  {
    name: 'C 챕터 목록',
    method: 'GET',
    path: '/api/courses/c/chapters',
  },
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
  },
  {
    name: 'AI Health Check',
    method: 'GET',
    path: '/api/ai/health',
  },
];

// 헤더 출력
function printHeader(text) {
  console.log(`\n${colors.cyan}${'═'.repeat(65)}${colors.reset}`);
  console.log(`${colors.cyan}  🚀 ${text}${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(65)}${colors.reset}\n`);
}

// 결과 출력
function printResult(result) {
  const { requests, latency, throughput } = result;

  console.log(`${colors.green}✓ 완료${colors.reset}\n`);
  console.log(`📊 요청:`);
  console.log(`   평균: ${requests.average.toFixed(1)} req/sec`);
  console.log(`   총: ${requests.total} 요청`);
  console.log(``);
  console.log(`⏱️  지연 시간:`);
  console.log(`   평균: ${latency.mean.toFixed(2)} ms`);
  console.log(`   중간값: ${latency.median.toFixed(2)} ms`);
  console.log(`   P95: ${latency.p95.toFixed(2)} ms`);
  console.log(`   P99: ${latency.p99.toFixed(2)} ms`);
  console.log(`   최대: ${latency.max.toFixed(2)} ms`);
  console.log(``);
  console.log(`📈 처리량: ${(throughput.mean / 1024 / 1024).toFixed(2)} MB/sec`);

  // 경고
  if (latency.mean > 100) {
    console.log(`\n${colors.yellow}⚠️  평균 지연 시간이 100ms를 초과했습니다${colors.reset}`);
  }
  if (latency.p95 > 500) {
    console.log(`${colors.red}⚠️  P95 지연 시간이 500ms를 초과했습니다${colors.reset}`);
  }
}

// 단일 엔드포인트 벤치마크
async function benchmarkEndpoint(endpoint, duration, connections) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: `${BASE_URL}${endpoint.path}`,
        method: endpoint.method,
        duration,
        connections,
        pipelining: 1,
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );

    // 진행 상황 출력
    autocannon.track(instance, { renderProgressBar: true });
  });
}

// 메인 함수
async function main() {
  printHeader('CodeInsight API 벤치마크');

  console.log(`설정:`);
  console.log(`  URL: ${BASE_URL}`);
  console.log(`  Duration: ${DURATION}초`);
  console.log(`  Connections: ${CONNECTIONS}`);

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`\n${'─'.repeat(65)}`);
    console.log(`📍 ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
    console.log(`${'─'.repeat(65)}\n`);

    try {
      const result = await benchmarkEndpoint(endpoint, DURATION, CONNECTIONS);
      printResult(result);
      results.push({
        name: endpoint.name,
        path: endpoint.path,
        ...result,
      });
    } catch (err) {
      console.error(`${colors.red}✗ 실패: ${err.message}${colors.reset}`);
    }
  }

  // 결과 저장
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logDir = '/tmp/codeinsight-profile';
  const logFile = path.join(logDir, `bench_${timestamp}.json`);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));

  console.log(`\n${colors.green}✓ 결과 저장됨: ${logFile}${colors.reset}\n`);
}

// 실행
if (require.main === module) {
  main().catch((err) => {
    console.error(`${colors.red}✗ 에러: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { benchmarkEndpoint };
