#!/usr/bin/env node
/**
 * CodeInsight 메모리 사용량 테스트
 *
 * 사용법:
 *   node e2e/performance/memory-test.js
 *
 * 반복적인 API 호출을 통해 메모리 누수를 감지합니다.
 */

const axios = require('axios');
const { spawn } = require('child_process');
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

const BASE_URL = 'http://localhost:3002';
const ITERATIONS = 100; // API 호출 횟수
const DELAY = 100; // ms

// 헤더 출력
function printHeader(text) {
  console.log(`\n${colors.cyan}${'═'.repeat(65)}${colors.reset}`);
  console.log(`${colors.cyan}  💾 ${text}${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(65)}${colors.reset}\n`);
}

// 백엔드 PID 찾기
function getBackendPid() {
  return new Promise((resolve, reject) => {
    const proc = spawn('pgrep', ['-f', 'tsx.*src/app.ts']);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve(parseInt(output.trim().split('\n')[0]));
      } else {
        reject(new Error('백엔드가 실행 중이 아닙니다'));
      }
    });
  });
}

// 프로세스 메모리 사용량 조회
function getMemoryUsage(pid) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ps', ['-p', pid.toString(), '-o', 'rss=']);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && output.trim()) {
        // RSS는 KB 단위, MB로 변환
        resolve(parseInt(output.trim()) / 1024);
      } else {
        reject(new Error('메모리 정보를 가져올 수 없습니다'));
      }
    });
  });
}

// API 호출
async function callApi(endpoint) {
  try {
    await axios.get(`${BASE_URL}${endpoint}`);
  } catch (err) {
    // 에러 무시 (백엔드가 죽지 않는 한)
  }
}

// 메모리 누수 테스트
async function testMemoryLeak() {
  printHeader('CodeInsight 메모리 누수 테스트');

  // 백엔드 PID 찾기
  let pid;
  try {
    pid = await getBackendPid();
    console.log(`백엔드 PID: ${pid}\n`);
  } catch (err) {
    console.error(`${colors.red}✗ ${err.message}${colors.reset}`);
    console.log(`먼저 실행하세요: ${colors.yellow}./start-dev.sh${colors.reset}`);
    process.exit(1);
  }

  // 초기 메모리
  const initialMemory = await getMemoryUsage(pid);
  console.log(`초기 메모리: ${initialMemory.toFixed(2)} MB`);

  // 테스트할 엔드포인트
  const endpoints = [
    '/api/courses/languages',
    '/api/courses/c/chapters',
    '/health',
  ];

  const memorySnapshots = [{ iteration: 0, memory: initialMemory }];

  console.log(`\n${ITERATIONS}회 API 호출 중...\n`);

  // 반복 호출
  for (let i = 1; i <= ITERATIONS; i++) {
    // 랜덤 엔드포인트 호출
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    await callApi(endpoint);

    // 10회마다 메모리 확인
    if (i % 10 === 0) {
      const memory = await getMemoryUsage(pid);
      memorySnapshots.push({ iteration: i, memory });

      const diff = memory - initialMemory;
      const color = diff > 50 ? colors.red : diff > 20 ? colors.yellow : colors.green;

      console.log(
        `  ${i.toString().padStart(3)}회: ${memory.toFixed(2)} MB ` +
          `${color}(${diff > 0 ? '+' : ''}${diff.toFixed(2)} MB)${colors.reset}`
      );
    }

    // 딜레이
    await new Promise((resolve) => setTimeout(resolve, DELAY));
  }

  // 최종 메모리
  const finalMemory = await getMemoryUsage(pid);
  const totalDiff = finalMemory - initialMemory;

  console.log(`\n${'─'.repeat(65)}`);
  console.log(`\n📊 결과:`);
  console.log(`   초기 메모리: ${initialMemory.toFixed(2)} MB`);
  console.log(`   최종 메모리: ${finalMemory.toFixed(2)} MB`);
  console.log(`   증가량: ${totalDiff > 0 ? '+' : ''}${totalDiff.toFixed(2)} MB`);
  console.log(`   증가율: ${((totalDiff / initialMemory) * 100).toFixed(2)}%`);

  // 분석
  console.log(`\n📈 분석:`);

  if (totalDiff > 100) {
    console.log(`   ${colors.red}⚠️  심각한 메모리 누수 가능성${colors.reset}`);
    console.log(`   → 힙 덤프로 원인 분석 필요: ./e2e/profile.sh heap`);
  } else if (totalDiff > 50) {
    console.log(`   ${colors.yellow}⚠️  메모리 증가 감지${colors.reset}`);
    console.log(`   → GC 후에도 계속 증가하면 누수 의심`);
  } else if (totalDiff > 20) {
    console.log(`   ${colors.green}✓ 정상 범위 (GC로 회수 가능)${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✓ 메모리 사용량 안정적${colors.reset}`);
  }

  // 결과 저장
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logDir = '/tmp/codeinsight-profile';
  const logFile = path.join(logDir, `memory_${timestamp}.json`);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const result = {
    pid,
    iterations: ITERATIONS,
    initialMemory,
    finalMemory,
    diff: totalDiff,
    snapshots: memorySnapshots,
  };

  fs.writeFileSync(logFile, JSON.stringify(result, null, 2));

  console.log(`\n${colors.green}✓ 결과 저장됨: ${logFile}${colors.reset}\n`);
}

// 실행
if (require.main === module) {
  testMemoryLeak().catch((err) => {
    console.error(`${colors.red}✗ 에러: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { testMemoryLeak };
