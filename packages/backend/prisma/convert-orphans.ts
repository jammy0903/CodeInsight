/**
 * 추출된 orphan 레슨 JSON을 새 스키마(step.code + highlightOffset)로 변환하여
 * 올바른 content 디렉토리에 저장
 */
import * as fs from 'fs';
import * as path from 'path';

const extractedDir = path.join(__dirname, 'extracted');
const contentDir = path.join(__dirname, 'content');

interface OldStep {
  line: number;
  title: string;
  explanation: string;
  highlight?: number[];
  [key: string]: unknown;
}

interface NewStep {
  code: string;
  title: string;
  explanation: string;
  highlightOffset?: number[];
  occurrence?: number;
  [key: string]: unknown;
}

function convertSteps(code: string, steps: OldStep[]): NewStep[] {
  const codeLines = code.split('\n');

  return steps.map(step => {
    const { line, highlight, ...rest } = step;

    // step.line → step.code (해당 라인의 코드 문자열)
    const codeLine = (line >= 1 && line <= codeLines.length)
      ? codeLines[line - 1].trim()
      : '';

    // highlight → highlightOffset (line 기준 상대 오프셋)
    let highlightOffset: number[] | undefined;
    if (highlight && highlight.length > 0) {
      highlightOffset = highlight
        .filter(h => h !== line) // 자기 자신 제외
        .map(h => h - line);
      if (highlightOffset.length === 0) highlightOffset = undefined;
    }

    const newStep: NewStep = {
      ...rest,
      code: codeLine,
    };
    if (highlightOffset) newStep.highlightOffset = highlightOffset;

    return newStep;
  });
}

// 변환 대상 매핑: lessonId → language folder
const lessonLangMap: Record<string, string> = {
  'c-1-5': 'c',
  'c-1-6': 'c',
  'c-1-7': 'c',
  'js-1-5': 'javascript',
  'js-1-6': 'javascript',
  'js-1-7': 'javascript',
  'js-1-8': 'javascript',
  'js-2-4': 'javascript',
  'py-1-5': 'python',
  'py-1-8': 'python',
};

// py-1-5 제목/콘셉트 수정 (코드 내용과 불일치)
const overrides: Record<string, { title?: string; concept?: string }> = {
  'py-1-5': {
    title: '함수 정의와 호출',
    concept: '함수는 재사용 가능한 코드 블록입니다. def 키워드로 정의하고, 함수이름()으로 호출합니다.',
  },
};

for (const [lessonId, lang] of Object.entries(lessonLangMap)) {
  const inputPath = path.join(extractedDir, `${lessonId}.json`);
  if (!fs.existsSync(inputPath)) {
    console.log(`SKIP: ${lessonId} (no extracted file)`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  // 스키마 변환
  const newSteps = convertSteps(data.content.code, data.content.steps);
  data.content.steps = newSteps;

  // 오버라이드 적용
  if (overrides[lessonId]) {
    if (overrides[lessonId].title) data.title = overrides[lessonId].title;
    if (overrides[lessonId].concept) data.concept = overrides[lessonId].concept;
  }

  // 출력 경로
  const outputDir = path.join(contentDir, lang, 'lessons');
  const outputPath = path.join(outputDir, `${lessonId}.json`);

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`OK: ${lessonId} → ${lang}/lessons/${lessonId}.json (${newSteps.length} steps)`);
}

console.log('\nDone! Files written to content directories.');
