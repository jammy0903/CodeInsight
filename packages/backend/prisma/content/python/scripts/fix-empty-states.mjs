#!/usr/bin/env node
/**
 * fix-empty-states.mjs
 *
 * Bug 5 수정: pythonMemoryState에 names[]/objects[]가 비어있는 스텝 수정
 *
 * 두 가지 작업:
 * 1. py-1-5, py-1-8: variables[] → names[]/objects[] 변환 (이전 변환 작업에서 누락)
 * 2. 모든 영향받는 파일: names/objects가 없는 스텝에 이전 스텝의 데이터 carry-forward
 *
 * Usage:
 *   node fix-empty-states.mjs              # 실행
 *   node fix-empty-states.mjs --dry-run    # 변경 미리보기만
 *   node fix-empty-states.mjs --validate   # 수정 후 검증
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LESSON_DIR = path.resolve(__dirname, '../lessons');

const CONVERT_FILES = ['py-1-5', 'py-1-8'];
const ALL_FILES = ['py-1-5', 'py-1-8', 'py-2-1', 'py-2-4', 'py-4-4', 'py-4-5', 'py-9-3', 'py-9-4'];

const isDryRun = process.argv.includes('--dry-run');
const isValidate = process.argv.includes('--validate');

// ============================================================
// Phase 1: variables[] → names[]/objects[] 변환
// ============================================================

function convertVariablesToNamesObjects(pyState) {
  if (!pyState.variables || pyState.variables.length === 0) return false;
  // names/objects가 이미 non-empty면 skip
  if (pyState.names?.length > 0 || pyState.objects?.length > 0) return false;

  const names = [];
  const objects = [];
  const hexToObjId = new Map();
  const typeCounters = {};
  let pyIdCounter = 1001;

  for (const v of pyState.variables) {
    const type = mapType(v.type);

    // hex address 기반 dedup
    let objId;
    if (v.id && hexToObjId.has(v.id)) {
      objId = hexToObjId.get(v.id);
    } else {
      typeCounters[type] = (typeCounters[type] || 0) + 1;
      objId = `${type}${typeCounters[type]}`;
      if (v.id) hexToObjId.set(v.id, objId);
    }

    names.push({ name: v.name, pointsTo: objId });

    if (!objects.find(o => o.id === objId)) {
      objects.push({
        id: objId,
        type: type,
        value: v.value,
        pyId: String(pyIdCounter++)
      });
    }
  }

  pyState.names = names;
  pyState.objects = objects;
  delete pyState.variables;
  return true;
}

function mapType(type) {
  if (!type) return 'unknown';
  // Normalize dict→list when value looks like an array
  if (type === 'dict') return 'list';
  return type;
}

// ============================================================
// Phase 2: names/objects carry-forward
// ============================================================

function applyCarryForward(steps) {
  let lastNames = null;
  let lastObjects = null;
  let fixCount = 0;

  for (const step of steps) {
    const pyState = step.pythonMemoryState;
    if (!pyState) continue;

    const hasNames = Array.isArray(pyState.names) && pyState.names.length > 0;
    const hasObjects = Array.isArray(pyState.objects) && pyState.objects.length > 0;

    if (hasNames || hasObjects) {
      // 현재 스텝에 데이터 있음 → 기억
      lastNames = pyState.names || [];
      lastObjects = pyState.objects || [];
    } else if (lastNames !== null && lastNames.length > 0) {
      // 현재 스텝에 데이터 없음 → 이전 스텝에서 복사
      pyState.names = JSON.parse(JSON.stringify(lastNames));
      pyState.objects = JSON.parse(JSON.stringify(lastObjects || []));
      fixCount++;
    }
  }

  return fixCount;
}

// ============================================================
// Validation
// ============================================================

function validate(fileId) {
  const filePath = path.join(LESSON_DIR, `${fileId}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const steps = data.content?.steps || [];
  let emptyCount = 0;

  for (let i = 0; i < steps.length; i++) {
    const pyState = steps[i].pythonMemoryState;
    if (!pyState) continue;

    const hasNames = Array.isArray(pyState.names) && pyState.names.length > 0;
    const hasObjects = Array.isArray(pyState.objects) && pyState.objects.length > 0;
    const hasVars = Array.isArray(pyState.variables) && pyState.variables.length > 0;

    if (!hasNames && !hasObjects && !hasVars) {
      // Step 0이 비어있는 건 허용 (초기 상태)
      if (i === 0) continue;
      emptyCount++;
      console.log(`  ⚠ ${fileId} step ${i}: "${steps[i].title}" — empty names/objects`);
    }
  }

  return emptyCount;
}

// ============================================================
// Main
// ============================================================

if (isValidate) {
  console.log('=== Validation Mode ===\n');
  let totalEmpty = 0;
  for (const fileId of ALL_FILES) {
    const empty = validate(fileId);
    totalEmpty += empty;
  }
  console.log(`\n총 빈 스텝: ${totalEmpty}`);
  console.log(totalEmpty === 0 ? '✅ 모두 정상!' : `❌ ${totalEmpty}개 스텝 수정 필요`);
  process.exit(totalEmpty > 0 ? 1 : 0);
}

console.log(isDryRun ? '=== Dry Run Mode ===\n' : '=== Fixing Empty States ===\n');

let totalConverted = 0;
let totalCarryForward = 0;

for (const fileId of ALL_FILES) {
  const filePath = path.join(LESSON_DIR, `${fileId}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  if (!data.content?.steps) {
    console.log(`  Skip: ${fileId} — no steps`);
    continue;
  }

  let converted = 0;
  let carried = 0;

  // Phase 1: Convert variables → names/objects (py-1-5, py-1-8 only)
  if (CONVERT_FILES.includes(fileId)) {
    for (const step of data.content.steps) {
      if (step.pythonMemoryState) {
        if (convertVariablesToNamesObjects(step.pythonMemoryState)) {
          converted++;
        }
      }
    }
  }

  // Phase 2: Carry forward
  carried = applyCarryForward(data.content.steps);

  totalConverted += converted;
  totalCarryForward += carried;

  const changes = [];
  if (converted > 0) changes.push(`${converted} converted`);
  if (carried > 0) changes.push(`${carried} carry-forward`);

  if (changes.length > 0) {
    console.log(`  ${fileId}: ${changes.join(', ')}`);
    if (!isDryRun) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    }
  } else {
    console.log(`  ${fileId}: no changes needed`);
  }
}

console.log(`\n총 변환: ${totalConverted}, 총 carry-forward: ${totalCarryForward}`);

if (isDryRun) {
  console.log('\n(dry-run 모드 — 파일 변경 없음)');
} else {
  console.log('\n✅ 완료! --validate로 검증하세요.');
}
