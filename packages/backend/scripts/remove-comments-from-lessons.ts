/**
 * C 강의 JSON에서 주석 제거 스크립트
 *
 * 1. code 필드에서 주석 제거
 * 2. steps[].line 라인 번호 재계산
 */

import * as fs from 'fs';
import * as path from 'path';

const LESSONS_DIR = path.join(__dirname, '../prisma/content/c/lessons');

interface Step {
  line: number;
  title?: string;
  explanation: string;
  highlight?: number[];
  [key: string]: unknown;
}

interface LessonContent {
  code: string;
  steps: Step[];
}

interface Lesson {
  lessonId: string;
  content: LessonContent;
  [key: string]: unknown;
}

/**
 * 코드에서 주석 제거하고 라인 매핑 생성
 * @returns { cleanedCode, lineMapping }
 * lineMapping[newLine] = oldLine (1-indexed)
 */
function removeCommentsWithMapping(code: string): {
  cleanedCode: string;
  lineMapping: Map<number, number>;
} {
  const lines = code.split('\n');
  const cleanedLines: string[] = [];
  const lineMapping = new Map<number, number>(); // newLine -> oldLine

  let inMultiLineComment = false;

  for (let oldIdx = 0; oldIdx < lines.length; oldIdx++) {
    let line = lines[oldIdx];
    const oldLineNum = oldIdx + 1;

    // 다중 라인 주석 처리
    if (inMultiLineComment) {
      const endIdx = line.indexOf('*/');
      if (endIdx !== -1) {
        line = line.slice(endIdx + 2);
        inMultiLineComment = false;
      } else {
        continue; // 주석 내부, 스킵
      }
    }

    // 한 줄 내 /* */ 제거
    line = line.replace(/\/\*.*?\*\//g, '');

    // /* 시작 확인
    const multiStart = line.indexOf('/*');
    if (multiStart !== -1) {
      line = line.slice(0, multiStart);
      inMultiLineComment = true;
    }

    // 행 끝 주석 제거 (문자열 리터럴 보호)
    line = removeTrailingComment(line);

    // 빈 줄이거나 주석만 있던 줄은 제외
    const trimmed = line.trim();
    if (trimmed === '' && lines[oldIdx].trim().startsWith('//')) {
      continue; // 주석만 있던 줄 제거
    }

    // 완전히 빈 줄은 유지 (코드 가독성)
    cleanedLines.push(line);
    const newLineNum = cleanedLines.length;
    lineMapping.set(newLineNum, oldLineNum);
  }

  return {
    cleanedCode: cleanedLines.join('\n'),
    lineMapping,
  };
}

/**
 * 행 끝 주석 제거 (문자열 리터럴 보호)
 */
function removeTrailingComment(line: string): string {
  let result = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    // 이스케이프 처리
    if (char === '\\' && inString) {
      result += char + (nextChar || '');
      i++;
      continue;
    }

    // 문자열 시작/종료
    if ((char === '"' || char === "'") && !inString) {
      inString = true;
      stringChar = char;
      result += char;
      continue;
    }
    if (char === stringChar && inString) {
      inString = false;
      stringChar = '';
      result += char;
      continue;
    }

    // 문자열 밖에서 // 발견
    if (!inString && char === '/' && nextChar === '/') {
      break; // 나머지 무시
    }

    result += char;
  }

  return result.trimEnd();
}

/**
 * 새 라인 번호 계산 (역매핑)
 */
function findNewLineNumber(
  oldLine: number,
  lineMapping: Map<number, number>
): number | null {
  for (const [newLine, mappedOldLine] of lineMapping) {
    if (mappedOldLine === oldLine) {
      return newLine;
    }
  }
  return null;
}

/**
 * JSON 파일 처리
 */
function processLessonFile(filePath: string): {
  changed: boolean;
  removedComments: number;
  lineChanges: Array<{ stepTitle: string; oldLine: number; newLine: number }>;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lesson: Lesson = JSON.parse(content);

  if (!lesson.content?.code || !lesson.content?.steps) {
    return { changed: false, removedComments: 0, lineChanges: [] };
  }

  const originalCode = lesson.content.code;
  const { cleanedCode, lineMapping } = removeCommentsWithMapping(originalCode);

  // 변경 없으면 스킵
  if (originalCode === cleanedCode) {
    return { changed: false, removedComments: 0, lineChanges: [] };
  }

  const removedComments =
    originalCode.split('\n').length - cleanedCode.split('\n').length;
  const lineChanges: Array<{
    stepTitle: string;
    oldLine: number;
    newLine: number;
  }> = [];

  // steps 라인 번호 업데이트
  for (const step of lesson.content.steps) {
    const oldLine = step.line;
    const newLine = findNewLineNumber(oldLine, lineMapping);

    if (newLine !== null && newLine !== oldLine) {
      lineChanges.push({
        stepTitle: step.title || `Step at line ${oldLine}`,
        oldLine,
        newLine,
      });
      step.line = newLine;

      // highlight도 업데이트
      if (step.highlight) {
        step.highlight = step.highlight
          .map((hl) => findNewLineNumber(hl, lineMapping))
          .filter((hl): hl is number => hl !== null);
      }
    }
  }

  // 업데이트된 JSON 저장
  lesson.content.code = cleanedCode;
  fs.writeFileSync(filePath, JSON.stringify(lesson, null, 2) + '\n', 'utf-8');

  return { changed: true, removedComments, lineChanges };
}

/**
 * 메인 실행
 */
function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔧 C 강의 JSON 주석 제거 스크립트\n');
  console.log(`📁 대상 폴더: ${LESSONS_DIR}`);
  console.log(`🔍 모드: ${dryRun ? 'DRY RUN (변경 없음)' : '실제 수정'}\n`);

  const files = fs
    .readdirSync(LESSONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  let totalChanged = 0;
  let totalRemovedComments = 0;

  for (const file of files) {
    const filePath = path.join(LESSONS_DIR, file);

    if (dryRun) {
      // DRY RUN: 변경 사항만 출력
      const content = fs.readFileSync(filePath, 'utf-8');
      const lesson: Lesson = JSON.parse(content);

      if (!lesson.content?.code) continue;

      const { cleanedCode, lineMapping } = removeCommentsWithMapping(
        lesson.content.code
      );
      const removedComments =
        lesson.content.code.split('\n').length - cleanedCode.split('\n').length;

      if (removedComments > 0) {
        console.log(`📄 ${file}: ${removedComments}개 주석 라인 제거 예정`);
        totalChanged++;
        totalRemovedComments += removedComments;
      }
    } else {
      // 실제 수정
      const result = processLessonFile(filePath);

      if (result.changed) {
        console.log(`✅ ${file}: ${result.removedComments}개 주석 라인 제거됨`);
        if (result.lineChanges.length > 0) {
          result.lineChanges.forEach((change) => {
            console.log(
              `   📍 "${change.stepTitle}": line ${change.oldLine} → ${change.newLine}`
            );
          });
        }
        totalChanged++;
        totalRemovedComments += result.removedComments;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 결과: ${totalChanged}개 파일, ${totalRemovedComments}개 주석 라인`);

  if (dryRun) {
    console.log('\n💡 실제 수정하려면: npx ts-node scripts/remove-comments-from-lessons.ts');
  }
}

main();
