/**
 * add-points-to.mjs
 *
 * C 레슨 JSON의 포인터 변수에 points_to 필드를 자동 추가하는 스크립트
 * 포인터 value(hex 주소)가 같은 step의 다른 변수 address와 매칭되면 points_to 설정
 *
 * 사용법:
 *   node add-points-to.mjs                    # 모든 파일 변환
 *   node add-points-to.mjs c-4-3              # 특정 파일만
 *   node add-points-to.mjs --validate         # 검증만 (파일 쓰지 않음)
 *   node add-points-to.mjs --dry-run          # 변환 미리보기
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LESSONS_DIR = join(__dirname, '..', 'lessons');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isValidate = args.includes('--validate');
const specificFile = args.find((a) => !a.startsWith('--'));

// ─── 유틸리티 ───

function isPointerType(type) {
  if (!type) return false;
  return type.includes('*');
}

function isHexAddress(val) {
  if (typeof val !== 'string') return false;
  return /^0x[0-9a-fA-F]+$/.test(val);
}

// ─── 메인 로직 ───

function processFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const lessonId = data.lessonId;
  const steps = data.content?.steps;

  if (!steps || !Array.isArray(steps)) {
    return { lessonId, added: 0, skipped: 0, errors: [] };
  }

  let added = 0;
  let skipped = 0;
  const errors = [];

  for (let si = 0; si < steps.length; si++) {
    const step = steps[si];
    const allVars = [...(step.stack || []), ...(step.heap || [])];

    // address → 변수 이름 매핑 (같은 step 내)
    const addrToName = new Map();
    for (const v of allVars) {
      if (v.address && v.name) {
        // 배열의 경우 배열 이름을 시작 주소에 매핑
        addrToName.set(v.address, v.name);
      }
    }

    // 포인터 변수 처리
    for (const v of allVars) {
      if (!isPointerType(v.type)) continue;

      // 이미 points_to가 있으면 스킵
      if (v.points_to || v.pointsTo) {
        skipped++;
        continue;
      }

      const val = v.value;

      // value가 hex 주소이고, 같은 step의 다른 변수 address와 매칭
      if (isHexAddress(val)) {
        const targetName = addrToName.get(val);
        if (targetName && targetName !== v.name) {
          v.points_to = targetName;
          added++;
          continue;
        }
      }

      // NULL, "???", 배열/구조체 값 등은 매칭 불가 → 스킵
      skipped++;
    }
  }

  if (!isValidate && !isDryRun && added > 0) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }

  return { lessonId, added, skipped, errors };
}

function validateFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const lessonId = data.lessonId;
  const steps = data.content?.steps;

  if (!steps || !Array.isArray(steps)) {
    return { lessonId, total: 0, withPointsTo: 0, matchable: 0, issues: [] };
  }

  let total = 0;
  let withPointsTo = 0;
  let matchable = 0;
  const issues = [];

  for (let si = 0; si < steps.length; si++) {
    const step = steps[si];
    const allVars = [...(step.stack || []), ...(step.heap || [])];

    const addrToName = new Map();
    for (const v of allVars) {
      if (v.address && v.name) {
        addrToName.set(v.address, v.name);
      }
    }

    for (const v of allVars) {
      if (!isPointerType(v.type)) continue;
      total++;

      if (v.points_to || v.pointsTo) {
        withPointsTo++;
        // 검증: points_to 대상이 같은 step에 존재하는지
        const target = v.points_to || v.pointsTo;
        const targetExists = allVars.some(
          (t) => t.name === target && t.name !== v.name
        );
        if (!targetExists) {
          issues.push(
            `step ${si}: ${v.name} points_to "${target}" but target not found`
          );
        }
      }

      if (isHexAddress(v.value) && addrToName.has(v.value)) {
        matchable++;
      }
    }
  }

  return { lessonId, total, withPointsTo, matchable, issues };
}

// ─── 실행 ───

const files = readdirSync(LESSONS_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .filter((f) => {
    if (specificFile) {
      return f === `${specificFile}.json`;
    }
    return true;
  });

console.log(`\n📦 C 레슨 포인터 points_to 처리`);
console.log(`   대상: ${files.length}개 파일`);
console.log(`   모드: ${isValidate ? '검증' : isDryRun ? '미리보기' : '변환'}\n`);

let totalAdded = 0;
let totalSkipped = 0;
let totalIssues = 0;

for (const file of files) {
  const filePath = join(LESSONS_DIR, file);

  if (isValidate) {
    const result = validateFile(filePath);
    if (result.total > 0) {
      const pct =
        result.total > 0
          ? Math.round((result.withPointsTo / result.total) * 100)
          : 0;
      console.log(
        `  ${result.lessonId}: ${result.withPointsTo}/${result.total} pointers have points_to (${pct}%)` +
          (result.matchable > result.withPointsTo
            ? ` ⚠️ ${result.matchable - result.withPointsTo} more matchable`
            : '') +
          (result.issues.length > 0
            ? ` ❌ ${result.issues.length} issues`
            : '')
      );
      for (const issue of result.issues) {
        console.log(`    → ${issue}`);
        totalIssues++;
      }
    }
  } else {
    const result = processFile(filePath);
    if (result.added > 0 || result.skipped > 0) {
      console.log(
        `  ${result.lessonId}: +${result.added} points_to added, ${result.skipped} skipped`
      );
      totalAdded += result.added;
      totalSkipped += result.skipped;
    }
  }
}

console.log('\n───────────────────────');
if (isValidate) {
  console.log(`검증 완료. 이슈: ${totalIssues}개`);
} else {
  console.log(
    `완료: ${totalAdded}개 points_to 추가, ${totalSkipped}개 스킵${isDryRun ? ' (dry-run, 파일 미변경)' : ''}`
  );
}
console.log('');
