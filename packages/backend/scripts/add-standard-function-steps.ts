/**
 * 표준 함수(printf, return, fclose 등)에 대한 설명 자동 추가
 *
 * 사용법: npx ts-node scripts/add-standard-function-steps.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';

const LESSONS_DIR = path.join(__dirname, '../prisma/content/c/lessons');

interface Step {
  line: number;
  title: string;
  explanation: string;
  highlight: number[];
  visualizationType: string;
  [key: string]: unknown;
}

interface Lesson {
  lessonId: string;
  content: {
    code: string;
    steps: Step[];
  };
  [key: string]: unknown;
}

// 표준 함수별 템플릿
const STANDARD_FUNCTION_TEMPLATES: Record<string, (match: string, lineNum: number) => Step> = {
  return: (match, lineNum) => ({
    line: lineNum,
    title: '함수 종료 (Return)',
    explanation: `**\`${match.trim()}\`**\n함수가 종료되고 호출한 곳으로 반환됩니다.\n\n${
      /return 0/.test(match)
        ? '값 \`0\`은 프로그램이 정상 종료되었음을 의미합니다.'
        : '지정된 값을 호출한 곳에 반환합니다.'
    }\n\n메모리에서 지역 변수들이 해제됩니다.`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      stack: [],
      output: []
    }
  }),

  printf: (match, lineNum) => ({
    line: lineNum,
    title: '출력 (Output)',
    explanation: `**\`${match.trim()}\`**\n\n표준 출력(stdout)으로 형식화된 데이터를 출력합니다.\n\nprintf 내부의 변수들은 메모리에 그대로 유지됩니다.`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      stack: [],
      output: ['[Output will be shown here]']
    }
  }),

  fopen: (match, lineNum) => ({
    line: lineNum,
    title: '파일 열기 (fopen)',
    explanation: `**\`${match.trim()}\`**\n\n파일을 열고 FILE 포인터를 반환합니다.\n\n- 성공하면 유효한 FILE* 반환\n- 실패하면 NULL 반환\n\n파일 모드: "r"(읽기), "w"(쓰기), "a"(추가), "b"(바이너리)`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      stack: []
    }
  }),

  fclose: (match, lineNum) => ({
    line: lineNum,
    title: '파일 닫기 (fclose)',
    explanation: `**\`${match.trim()}\`**\n\n열린 파일을 닫고 리소스를 해제합니다.\n\n파일 I/O 작업 후 반드시 fclose()를 호출해야 합니다.`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      stack: []
    }
  }),

  fwrite: (match, lineNum) => ({
    line: lineNum,
    title: '파일에 쓰기 (fwrite)',
    explanation: `**\`${match.trim()}\`**\n\n메모리의 데이터를 파일에 바이너리 형식으로 씁니다.\n\nprintf와 달리 형식 변환 없이 메모리의 비트 패턴 그대로 저장됩니다.`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      stack: []
    }
  }),

  fread: (match, lineNum) => ({
    line: lineNum,
    title: '파일에서 읽기 (fread)',
    explanation: `**\`${match.trim()}\`**\n\n파일에서 바이너리 데이터를 읽어 메모리에 로드합니다.\n\nfread는 데이터를 파싱하지 않고 그대로 메모리에 복사합니다.`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      stack: []
    }
  }),

  fprintf: (match, lineNum) => ({
    line: lineNum,
    title: '파일에 형식화 출력 (fprintf)',
    explanation: `**\`${match.trim()}\`**\n\nprintf와 유사하지만, 표준 출력 대신 지정된 파일(또는 stdout/stderr)에 출력합니다.`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      stack: []
    }
  }),

  malloc: (match, lineNum) => ({
    line: lineNum,
    title: '동적 메모리 할당 (malloc)',
    explanation: `**\`${match.trim()}\`**\n\n힙(Heap) 영역에서 지정된 크기의 메모리를 할당하고 포인터를 반환합니다.\n\n사용 후 반드시 free()로 해제해야 합니다.`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      heap: [{ size: '[allocated]' }]
    }
  }),

  free: (match, lineNum) => ({
    line: lineNum,
    title: '메모리 해제 (free)',
    explanation: `**\`${match.trim()}\`**\n\nmalloc()으로 할당한 메모리를 해제하고 리소스를 반환합니다.\n\nmalloc/free는 반드시 쌍으로 사용해야 메모리 누수를 방지할 수 있습니다.`,
    highlight: [lineNum],
    visualizationType: 'cMemory',
    cMemoryState: {
      heap: []
    }
  })
};

function getStandardFunctionTemplate(lineCode: string): (string | null) {
  for (const funcName of Object.keys(STANDARD_FUNCTION_TEMPLATES)) {
    if (new RegExp(`\\b${funcName}\\s*\\(`).test(lineCode)) {
      return funcName;
    }
  }
  return null;
}

function processLessonFile(filePath: string, dryRun: boolean = false): {
  changed: boolean;
  added: number;
  details: Array<{ line: number; title: string }>;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lesson: Lesson = JSON.parse(content);

  if (!lesson.content?.code || !lesson.content?.steps) {
    return { changed: false, added: 0, details: [] };
  }

  const code = lesson.content.code;
  const lines = code.split('\n');
  const steps = lesson.content.steps;

  const stepsWithLine = new Set(steps.map(s => s.line));
  const newSteps: Step[] = [];
  const details: Array<{ line: number; title: string }> = [];

  // 각 라인 검토
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const lineCode = lines[i];
    const trimmed = lineCode.trim();

    // 이미 설명이 있으면 스킵
    if (stepsWithLine.has(lineNum)) continue;

    // 표준 함수 찾기
    const funcName = getStandardFunctionTemplate(trimmed);
    if (funcName) {
      const template = STANDARD_FUNCTION_TEMPLATES[funcName];
      const newStep = template(lineCode, lineNum);
      newSteps.push(newStep);
      details.push({ line: lineNum, title: newStep.title });
    }
  }

  if (newSteps.length === 0) {
    return { changed: false, added: 0, details: [] };
  }

  if (!dryRun) {
    // 기존 steps와 병합
    lesson.content.steps = [...steps, ...newSteps].sort((a, b) => a.line - b.line);
    fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2) + '\n', 'utf-8');
  }

  return { changed: true, added: newSteps.length, details };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔧 표준 함수 설명 자동 추가\n');
  console.log(`📁 대상 폴더: ${LESSONS_DIR}`);
  console.log(`🔍 모드: ${dryRun ? 'DRY RUN (변경 없음)' : '실제 수정'}\n`);

  const files = fs
    .readdirSync(LESSONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  let totalAdded = 0;
  let filesChanged = 0;

  for (const file of files) {
    const filePath = path.join(LESSONS_DIR, file);
    const result = processLessonFile(filePath, dryRun);

    if (result.changed) {
      console.log(`✅ ${file}: ${result.added}개 표준 함수 설명 추가됨`);
      result.details.forEach(d => {
        console.log(`   📍 Line ${d.line}: "${d.title}"`);
      });
      totalAdded += result.added;
      filesChanged++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 결과: ${filesChanged}개 파일, ${totalAdded}개 설명 추가`);

  if (dryRun) {
    console.log('\n💡 실제 수정하려면: npx ts-node scripts/add-standard-function-steps.ts');
  }
}

main();
