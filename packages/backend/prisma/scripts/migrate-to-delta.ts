/**
 * Delta 마이그레이션 스크립트
 *
 * 레슨 JSON 파일의 스텝에서 이전 스텝과 동일한 시각화 필드를 제거하여
 * delta 형식으로 변환합니다.
 *
 * 실행: npx tsx packages/backend/prisma/scripts/migrate-to-delta.ts
 * 드라이런: npx tsx packages/backend/prisma/scripts/migrate-to-delta.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { expandDeltaSteps } from '../utils/expandDeltaSteps';

const CONTENT_DIR = path.join(__dirname, '..', 'content');

/** 상속 가능 필드 목록 */
const VIZ_FIELDS = [
  'stack', 'heap', 'stdout',
  'pythonMemoryState', 'javaMemoryState', 'memoryState',
  'eventLoopState', 'scopeState', 'promiseState',
  'thisState', 'prototypeState',
  'memoryChanges', 'callStackState',
  'algorithmState',
];

/** deep merge 대상 */
const DEEP_MERGE_FIELDS = new Set([
  'pythonMemoryState', 'javaMemoryState', 'memoryState',
  'eventLoopState', 'scopeState', 'promiseState',
  'thisState', 'prototypeState',
  'algorithmState',
]);

/** Deep equality check */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, (b as unknown[])[i]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
}

/**
 * Full state 스텝을 delta 형식으로 변환
 *
 * 각 스텝에서 이전 스텝과 동일한 시각화 필드를 제거합니다.
 * deep merge 대상 필드는 서브필드 단위로 비교하여 동일한 서브필드만 제거합니다.
 */
function computeDelta(steps: Record<string, unknown>[]): Record<string, unknown>[] {
  if (steps.length === 0) return steps;

  const result: Record<string, unknown>[] = [];
  const prevState: Record<string, unknown> = {};
  let prevVizType: unknown = undefined;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const deltaStep: Record<string, unknown> = {};

    // 비-시각화 필드 복사 (code, title, explanation 등)
    for (const key of Object.keys(step)) {
      if (!(VIZ_FIELDS as readonly string[]).includes(key)) {
        deltaStep[key] = step[key];
      }
    }

    // visualizationType 변경 시 이전 viz 상태 리셋
    const vizTypeChanged = step.visualizationType !== undefined && step.visualizationType !== prevVizType;
    if (vizTypeChanged) {
      for (const field of VIZ_FIELDS) {
        delete prevState[field];
      }
      prevVizType = step.visualizationType;
    }

    // 이전에 있었지만 현재에 없는 viz 필드 → null로 명시적 제거
    if (i > 0 && !vizTypeChanged) {
      for (const field of VIZ_FIELDS) {
        if (step[field] === undefined && prevState[field] !== undefined) {
          deltaStep[field] = null;
          delete prevState[field];
        }
      }
    }

    // 시각화 필드: 이전 스텝과 비교
    for (const field of VIZ_FIELDS) {
      if (step[field] === undefined) continue;

      if (i === 0 || vizTypeChanged) {
        // 첫 스텝 또는 vizType 변경: 무조건 포함
        deltaStep[field] = step[field];
        prevState[field] = step[field];
        continue;
      }

      const prevValue = prevState[field];

      if (prevValue === undefined) {
        // 이전에 없던 필드 → 반드시 포함
        deltaStep[field] = step[field];
        prevState[field] = step[field];
        continue;
      }

      if (
        DEEP_MERGE_FIELDS.has(field) &&
        typeof step[field] === 'object' &&
        step[field] !== null &&
        !Array.isArray(step[field]) &&
        typeof prevValue === 'object' &&
        prevValue !== null &&
        !Array.isArray(prevValue)
      ) {
        // Deep merge 대상: 서브필드 단위 비교
        const currObj = step[field] as Record<string, unknown>;
        const prevObj = prevValue as Record<string, unknown>;
        const changedSubFields: Record<string, unknown> = {};
        let hasChange = false;

        // 현재 스텝의 서브필드 검사
        for (const subKey of Object.keys(currObj)) {
          if (!deepEqual(currObj[subKey], prevObj[subKey])) {
            changedSubFields[subKey] = currObj[subKey];
            hasChange = true;
          }
        }

        // 이전에 있었지만 현재에 없는 서브필드 → null로 명시적 제거
        for (const subKey of Object.keys(prevObj)) {
          if (!(subKey in currObj)) {
            changedSubFields[subKey] = null;
            hasChange = true;
          }
        }

        if (hasChange) {
          deltaStep[field] = changedSubFields;
        }
        // hasChange가 false면 전체 동일 → 필드 생략 (상속)

        // prevState는 전체 객체 업데이트
        prevState[field] = step[field];
      } else {
        // 단순 필드: 전체 비교
        if (!deepEqual(step[field], prevValue)) {
          deltaStep[field] = step[field];
        }
        prevState[field] = step[field];
      }
    }

    result.push(deltaStep);
  }

  return result;
}

// ==========================================
// Main
// ==========================================

const isDryRun = process.argv.includes('--dry-run');
const singleFile = process.argv.find(a => a.startsWith('--file='))?.split('=')[1];

function getAllLessonFiles(): string[] {
  const files: string[] = [];
  const languages = fs.readdirSync(CONTENT_DIR).filter(d =>
    fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  );

  for (const lang of languages) {
    const lessonsDir = path.join(CONTENT_DIR, lang, 'lessons');
    if (!fs.existsSync(lessonsDir)) continue;

    const lessonFiles = fs.readdirSync(lessonsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(lessonsDir, f));

    files.push(...lessonFiles);
  }

  return files;
}

function migrate() {
  console.log(`\n🔄 Delta Migration ${isDryRun ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(50));

  const files = singleFile
    ? [path.resolve(singleFile)]
    : getAllLessonFiles();

  let totalFiles = 0;
  let convertedFiles = 0;
  let skippedFiles = 0;
  let errorFiles = 0;
  let totalOriginalSize = 0;
  let totalDeltaSize = 0;
  let totalFieldsRemoved = 0;

  for (const filePath of files) {
    totalFiles++;
    const relPath = path.relative(CONTENT_DIR, filePath);

    try {
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawContent);

      if (!data.content?.steps || !Array.isArray(data.content.steps)) {
        console.log(`  ⏭️  ${relPath}: no steps array, skipping`);
        skippedFiles++;
        continue;
      }

      if (data.content.deltaFormat === true) {
        console.log(`  ⏭️  ${relPath}: already delta format, skipping`);
        skippedFiles++;
        continue;
      }

      const originalSteps = data.content.steps;
      const deltaSteps = computeDelta(originalSteps);

      // 역검증: delta → full state → 원본과 비교
      const expanded = expandDeltaSteps(deltaSteps, true);

      if (!deepEqual(originalSteps, expanded)) {
        console.error(`  ❌ ${relPath}: VERIFICATION FAILED! Delta expansion does not match original.`);
        errorFiles++;

        // 디버그: 어느 스텝이 다른지 출력
        for (let i = 0; i < originalSteps.length; i++) {
          if (!deepEqual(originalSteps[i], expanded[i])) {
            console.error(`     Step ${i} differs:`);
            console.error(`     Original: ${JSON.stringify(originalSteps[i]).substring(0, 200)}`);
            console.error(`     Expanded: ${JSON.stringify(expanded[i]).substring(0, 200)}`);
            break;
          }
        }
        continue;
      }

      // 사이즈 계산
      const originalSize = JSON.stringify(originalSteps).length;
      const deltaSize = JSON.stringify(deltaSteps).length;
      const savings = originalSize - deltaSize;
      const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

      // 제거된 필드 수 계산
      let fieldsRemoved = 0;
      for (let i = 1; i < originalSteps.length; i++) {
        const origKeys = Object.keys(originalSteps[i]).filter(k =>
          (VIZ_FIELDS as readonly string[]).includes(k)
        );
        const deltaKeys = Object.keys(deltaSteps[i]).filter(k =>
          (VIZ_FIELDS as readonly string[]).includes(k)
        );
        fieldsRemoved += origKeys.length - deltaKeys.length;

        // deep merge에서 제거된 서브필드도 카운트
        for (const field of deltaKeys) {
          if (
            DEEP_MERGE_FIELDS.has(field) &&
            typeof originalSteps[i][field] === 'object' &&
            typeof deltaSteps[i][field] === 'object'
          ) {
            const origSubKeys = Object.keys(originalSteps[i][field] || {});
            const deltaSubKeys = Object.keys(deltaSteps[i][field] || {});
            fieldsRemoved += origSubKeys.length - deltaSubKeys.length;
          }
        }
      }

      totalOriginalSize += originalSize;
      totalDeltaSize += deltaSize;
      totalFieldsRemoved += fieldsRemoved;

      if (savings > 0) {
        console.log(`  ✅ ${relPath}: -${savings} bytes (${savingsPercent}%), ${fieldsRemoved} fields removed`);
        convertedFiles++;

        if (!isDryRun) {
          // delta 형식으로 저장
          data.content.steps = deltaSteps;
          data.content.deltaFormat = true;
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
        }
      } else {
        console.log(`  ⏭️  ${relPath}: no savings (0%), skipping`);
        skippedFiles++;
      }
    } catch (err) {
      console.error(`  ❌ ${relPath}: ${(err as Error).message}`);
      errorFiles++;
    }
  }

  // 요약
  const totalSavings = totalOriginalSize - totalDeltaSize;
  const totalSavingsPercent = totalOriginalSize > 0
    ? ((totalSavings / totalOriginalSize) * 100).toFixed(1)
    : '0';

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Total files:     ${totalFiles}`);
  console.log(`   Converted:       ${convertedFiles}`);
  console.log(`   Skipped:         ${skippedFiles}`);
  console.log(`   Errors:          ${errorFiles}`);
  console.log(`   Fields removed:  ${totalFieldsRemoved}`);
  console.log(`   Original size:   ${(totalOriginalSize / 1024).toFixed(1)} KB`);
  console.log(`   Delta size:      ${(totalDeltaSize / 1024).toFixed(1)} KB`);
  console.log(`   Savings:         ${(totalSavings / 1024).toFixed(1)} KB (${totalSavingsPercent}%)`);

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN - no files were modified. Run without --dry-run to apply.');
  }

  if (errorFiles > 0) {
    console.error(`\n❌ ${errorFiles} file(s) failed verification!`);
    process.exit(1);
  }

  console.log('\n✅ Migration complete!');
}

migrate();
