#!/usr/bin/env node
/**
 * React Profiler JSON 분석 스크립트
 * 사용법: node analyze-react-profiler.js <json-file>
 */

const fs = require('fs');
const path = require('path');

// 색상
const colors = {
  yellow: '\x1b[1;33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  nc: '\x1b[0m',
};

const jsonFile = process.argv[2];

if (!jsonFile) {
  console.error('사용법: node analyze-react-profiler.js <json-file>');
  process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
  console.error(`파일을 찾을 수 없습니다: ${jsonFile}`);
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

  const events = data.schedulingEvents || [];
  const suspense = data.suspenseEvents || [];

  console.log(`${colors.yellow}═══ 요약 ═══${colors.nc}`);
  console.log('총 이벤트:', events.length);
  console.log('Suspense 이벤트:', suspense.length);

  // 컴포넌트별 리렌더 횟수
  const counts = {};
  events.forEach((e) => {
    counts[e.componentName] = (counts[e.componentName] || 0) + 1;
  });

  console.log(`\n${colors.yellow}═══ 컴포넌트별 리렌더 Top 10 ═══${colors.nc}`);
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, count]) => {
      const color = count > 20 ? `${colors.red}⚠️ ` : `${colors.green}✓  `;
      console.log(`${color}${count.toString().padStart(4)}x  ${name}${colors.nc}`);
    });

  // Suspense 로딩 시간
  if (suspense.length > 0) {
    const avgDuration =
      suspense.reduce((sum, e) => sum + e.duration, 0) / suspense.length;
    const maxDuration = Math.max(...suspense.map((e) => e.duration));

    console.log(`\n${colors.yellow}═══ Suspense 로딩 시간 ═══${colors.nc}`);
    console.log('평균:', avgDuration.toFixed(2), 'ms');
    console.log('최대:', maxDuration.toFixed(2), 'ms');
  }
} catch (err) {
  console.error('JSON 파싱 오류:', err.message);
  process.exit(1);
}
