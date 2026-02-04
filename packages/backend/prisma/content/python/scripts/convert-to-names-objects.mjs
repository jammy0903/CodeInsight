/**
 * convert-to-names-objects.mjs
 *
 * Python 레슨 JSON의 variables[] → names[] + objects[] 변환 스크립트
 *
 * 사용법:
 *   node convert-to-names-objects.mjs                    # 모든 대상 파일 변환
 *   node convert-to-names-objects.mjs py-2-1             # 특정 파일만
 *   node convert-to-names-objects.mjs --dry-run           # 변환 미리보기 (파일 쓰지 않음)
 *   node convert-to-names-objects.mjs --validate          # 기존 파일 검증만
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LESSONS_DIR = join(__dirname, '..', 'lessons');

// py-1-x는 이미 변환 완료, py-3-5/py-3-6은 terminal 타입
const SKIP_FILES = new Set([
  'py-1-1', 'py-1-2', 'py-1-3', 'py-1-4', 'py-1-5',
  'py-3-5', 'py-3-6',
]);

// ─── Type → ObjectId prefix 매핑 ───
function typeToPrefix(type) {
  // 복합 타입 정규화 (예: "str (parameter)" → "str")
  const normalized = type.split(/\s/)[0].toLowerCase();
  const map = {
    'int': 'int',
    'float': 'float',
    'str': 'str',
    'bool': 'bool',
    'nonetype': 'none',
    'none': 'none',
    'list': 'list',
    'tuple': 'tuple',
    'dict': 'dict',
    'set': 'set',
    'function': 'function',
    'class': 'class',
    'type': 'class',
    'instance': 'instance',
    'module': 'module',
    'reference': 'ref',
    'generator': 'generator',
    'iterator': 'iterator',
    'closure': 'function',
    'thread': 'instance',
    'lock': 'instance',
  };
  return map[normalized] || normalized;
}

// ─── value 포맷 변환 ───
// variables의 value(항상 문자열)를 objects의 value로 변환
function formatObjectValue(rawValue, type) {
  const normalized = type.split(/\s/)[0].toLowerCase();

  switch (normalized) {
    case 'int': {
      // "85" → 85, "(refcount=2)" 같은 주석은 유지
      const match = rawValue.match(/^(-?\d+)/);
      if (match) return parseInt(match[1], 10);
      return rawValue;
    }
    case 'float': {
      const match = rawValue.match(/^(-?\d+\.?\d*)/);
      if (match) return parseFloat(match[1]);
      return rawValue;
    }
    case 'bool': {
      if (rawValue.toLowerCase() === 'true') return true;
      if (rawValue.toLowerCase() === 'false') return false;
      return rawValue;
    }
    case 'nonetype':
    case 'none': {
      return null;
    }
    case 'str': {
      // value가 이미 따옴표로 감싸져 있으면 유지, 아니면 감싸기
      if (rawValue.startsWith('"') || rawValue.startsWith("'")) return rawValue;
      return `"${rawValue}"`;
    }
    default:
      // list, dict, tuple, set, function, class, instance, module 등
      // 문자열 표현 그대로 유지
      return rawValue;
  }
}

// ─── 핵심: 파일 전체를 스캔하여 매핑 테이블 구축 ───
function buildMappings(steps) {
  const hexToObjectId = new Map();   // "0x1000" → "list1"
  const nameTypeToObjectId = new Map(); // "score:int" → "int1" (id 없는 경우)
  const typeCounters = {};           // { int: 1, str: 2, ... }
  let pyIdCounter = 1001;

  function getNextObjectId(type) {
    const prefix = typeToPrefix(type);
    typeCounters[prefix] = (typeCounters[prefix] || 0) + 1;
    return `${prefix}${typeCounters[prefix]}`;
  }

  function getNextPyId() {
    return String(pyIdCounter++);
  }

  // 1단계: 모든 step의 모든 변수를 스캔하여 고유 객체 수집
  // reference 타입은 별도 처리 (다른 변수와 같은 객체를 가리킴)
  for (const step of steps) {
    const state = step.pythonMemoryState;
    if (!state || !state.variables || state.variables.length === 0) continue;

    for (const v of state.variables) {
      if (!v.name || v.type === 'reference') continue;

      const hexId = v.id;
      if (hexId) {
        if (!hexToObjectId.has(hexId)) {
          hexToObjectId.set(hexId, {
            objectId: getNextObjectId(v.type),
            pyId: getNextPyId(),
            type: v.type,
          });
        }
      } else {
        // id 없는 변수: (name, type) 기반 키
        // 값이 변경되면 새 객체 (불변 타입: int, str, float, bool)
        // 하지만 같은 이름+같은 값이면 같은 객체일 수 있음
        // → 단순화: 같은 이름+타입의 각 고유 값에 별도 객체
        const key = `${v.name}:${v.type}:${v.value}`;
        if (!nameTypeToObjectId.has(key)) {
          nameTypeToObjectId.set(key, {
            objectId: getNextObjectId(v.type),
            pyId: getNextPyId(),
            type: v.type,
          });
        }
      }
    }
  }

  return { hexToObjectId, nameTypeToObjectId };
}

// ─── 단일 step 변환 ───
function convertStep(step, hexToObjectId, nameTypeToObjectId) {
  const state = step.pythonMemoryState;
  if (!state) return;

  // 이미 names/objects가 채워져 있으면 스킵
  if (state.names && state.names.length > 0) return;
  if (!state.variables || state.variables.length === 0) {
    // variables가 비어있으면 names/objects도 빈 배열
    state.names = [];
    state.objects = [];
    return;
  }

  const names = [];
  const objectsMap = new Map(); // objectId → object (중복 방지)

  for (const v of state.variables) {
    let objectId, pyId, objType;

    if (v.type === 'reference') {
      // reference 타입: 다른 변수와 같은 객체를 가리킴
      // value에서 hex id 추출 시도 (예: "→ same as a (0x2000)")
      const hexMatch = v.value.match(/(0x[0-9a-fA-F]+)/);
      if (hexMatch && hexToObjectId.has(hexMatch[1])) {
        const info = hexToObjectId.get(hexMatch[1]);
        objectId = info.objectId;
        pyId = info.pyId;
        objType = info.type;
      } else {
        // hex를 못 찾으면 → value에서 변수 이름 추출해서 그 변수의 객체 찾기
        // "→ same as a (0x2000)" → 변수 "a" 찾기
        const nameMatch = v.value.match(/same as (\w+)/);
        if (nameMatch) {
          const targetName = names.find(n => n.name === nameMatch[1]);
          if (targetName) {
            objectId = targetName.pointsTo;
            // objectsMap에서 해당 객체 정보 가져오기
            const existingObj = objectsMap.get(objectId);
            if (existingObj) {
              pyId = existingObj.pyId;
              objType = existingObj.type;
            }
          }
        }
        if (!objectId) {
          // 폴백: 새 객체 생성
          const key = `${v.name}:${v.type}:${v.value}`;
          const info = nameTypeToObjectId.get(key);
          if (info) {
            objectId = info.objectId;
            pyId = info.pyId;
            objType = info.type;
          }
        }
      }

      if (objectId) {
        const name = { name: v.name, pointsTo: objectId };
        if (v.highlight) name.highlight = true;
        names.push(name);
        // reference는 다른 변수와 같은 객체를 가리키므로 objectsMap에 이미 있을 수 있음
        // highlight가 있으면 object에도 설정
        if (v.highlight && objectsMap.has(objectId)) {
          objectsMap.get(objectId).highlight = true;
        }
      }
      continue;
    }

    // 일반 변수 처리
    const hexId = v.id;
    if (hexId && hexToObjectId.has(hexId)) {
      const info = hexToObjectId.get(hexId);
      objectId = info.objectId;
      pyId = info.pyId;
      objType = info.type;
    } else {
      const key = `${v.name}:${v.type}:${v.value}`;
      const info = nameTypeToObjectId.get(key);
      if (info) {
        objectId = info.objectId;
        pyId = info.pyId;
        objType = info.type;
      } else {
        // 안전 폴백: 없으면 새로 만듦 (이론상 buildMappings에서 다 잡혀야 함)
        const prefix = typeToPrefix(v.type);
        objectId = `${prefix}_fallback_${v.name}`;
        pyId = '9999';
        objType = v.type;
      }
    }

    // name 생성
    const name = { name: v.name, pointsTo: objectId };
    if (v.highlight) name.highlight = true;
    names.push(name);

    // object 생성 (중복 objectId는 value 업데이트)
    const formattedValue = formatObjectValue(v.value, v.type);
    if (objectsMap.has(objectId)) {
      // 같은 객체가 이미 등록됨 (가변 타입이 값 변경된 경우)
      const existing = objectsMap.get(objectId);
      existing.value = formattedValue;
      if (v.highlight) existing.highlight = true;
    } else {
      const obj = {
        id: objectId,
        type: v.type.split(/\s/)[0].toLowerCase(), // "str (parameter)" → "str"
        value: formattedValue,
        pyId: pyId,
      };
      if (v.highlight) obj.highlight = true;
      objectsMap.set(objectId, obj);
    }
  }

  // objects 배열: names에서 참조하는 순서대로 (안정적 순서)
  const referencedIds = [...new Set(names.map(n => n.pointsTo))];
  const objects = referencedIds
    .map(id => objectsMap.get(id))
    .filter(Boolean);

  state.names = names;
  state.objects = objects;
}

// ─── 파일 단위 변환 ───
function convertFile(filePath, dryRun = false) {
  const raw = readFileSync(filePath, 'utf-8');
  const lesson = JSON.parse(raw);
  const lessonId = lesson.lessonId;

  if (!lesson.content || !lesson.content.steps) {
    return { lessonId, status: 'skip', reason: 'no steps' };
  }

  // terminal 타입만 있는 파일 체크
  const hasMemorySteps = lesson.content.steps.some(
    s => s.visualizationType === 'pythonMemory' && s.pythonMemoryState
  );
  if (!hasMemorySteps) {
    return { lessonId, status: 'skip', reason: 'no pythonMemory steps' };
  }

  // 이미 변환된 파일 체크 (첫 번째 pythonMemory step에 names가 채워져 있으면)
  const firstMemoryStep = lesson.content.steps.find(
    s => s.visualizationType === 'pythonMemory' && s.pythonMemoryState
  );
  if (firstMemoryStep?.pythonMemoryState?.names?.length > 0) {
    return { lessonId, status: 'skip', reason: 'already converted' };
  }

  // pythonMemory step만 필터
  const memorySteps = lesson.content.steps.filter(
    s => s.visualizationType === 'pythonMemory' && s.pythonMemoryState
  );

  // 매핑 구축
  const { hexToObjectId, nameTypeToObjectId } = buildMappings(memorySteps);

  // 각 step 변환
  for (const step of memorySteps) {
    convertStep(step, hexToObjectId, nameTypeToObjectId);
  }

  if (!dryRun) {
    writeFileSync(filePath, JSON.stringify(lesson, null, 2) + '\n', 'utf-8');
  }

  // 통계
  let totalNames = 0;
  let totalObjects = 0;
  for (const step of memorySteps) {
    totalNames += step.pythonMemoryState?.names?.length || 0;
    totalObjects += step.pythonMemoryState?.objects?.length || 0;
  }

  return {
    lessonId,
    status: 'converted',
    steps: memorySteps.length,
    totalNames,
    totalObjects,
    hexMappings: hexToObjectId.size,
    nameMappings: nameTypeToObjectId.size,
  };
}

// ─── 검증 ───
function validateFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const lesson = JSON.parse(raw);
  const errors = [];

  if (!lesson.content?.steps) return { lessonId: lesson.lessonId, errors };

  for (let i = 0; i < lesson.content.steps.length; i++) {
    const step = lesson.content.steps[i];
    const state = step.pythonMemoryState;
    if (!state || step.visualizationType !== 'pythonMemory') continue;

    const names = state.names || [];
    const objects = state.objects || [];
    const objectIds = new Set(objects.map(o => o.id));

    // 모든 name.pointsTo가 존재하는 object를 참조하는지
    for (const name of names) {
      if (!objectIds.has(name.pointsTo)) {
        errors.push(
          `Step ${i} (line ${step.line}): name "${name.name}" points to "${name.pointsTo}" but no such object exists. Available: [${[...objectIds].join(', ')}]`
        );
      }
    }

    // variables가 있는데 names가 비어있으면 경고
    const vars = state.variables || [];
    if (vars.length > 0 && names.length === 0) {
      errors.push(
        `Step ${i} (line ${step.line}): has ${vars.length} variables but 0 names`
      );
    }
  }

  return { lessonId: lesson.lessonId, errors };
}

// ─── CLI ───
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const validateOnly = args.includes('--validate');
  const targetFiles = args.filter(a => !a.startsWith('--'));

  // 대상 파일 목록
  let files;
  if (targetFiles.length > 0) {
    files = targetFiles.map(f => {
      const name = f.endsWith('.json') ? f : `${f}.json`;
      return join(LESSONS_DIR, name);
    });
  } else {
    files = readdirSync(LESSONS_DIR)
      .filter(f => f.startsWith('py-') && f.endsWith('.json'))
      .filter(f => !SKIP_FILES.has(f.replace('.json', '')))
      .sort()
      .map(f => join(LESSONS_DIR, f));
  }

  if (validateOnly) {
    console.log('=== Validation Mode ===\n');
    let totalErrors = 0;
    for (const file of files) {
      const result = validateFile(file);
      if (result.errors.length > 0) {
        console.log(`❌ ${result.lessonId}: ${result.errors.length} error(s)`);
        result.errors.forEach(e => console.log(`   ${e}`));
        totalErrors += result.errors.length;
      } else {
        console.log(`✅ ${result.lessonId}: OK`);
      }
    }
    console.log(`\n${totalErrors === 0 ? '✅ All files valid!' : `❌ ${totalErrors} total error(s)`}`);
    process.exit(totalErrors > 0 ? 1 : 0);
  }

  console.log(`=== Convert variables[] → names[]/objects[] ===`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Files: ${files.length}\n`);

  const results = [];
  for (const file of files) {
    try {
      const result = convertFile(file, dryRun);
      results.push(result);
      if (result.status === 'converted') {
        console.log(
          `✅ ${result.lessonId}: ${result.steps} steps, ${result.totalNames} names, ${result.totalObjects} objects`
        );
      } else {
        console.log(`⏭️  ${result.lessonId}: ${result.reason}`);
      }
    } catch (err) {
      console.error(`❌ ${file}: ${err.message}`);
      results.push({ file, status: 'error', error: err.message });
    }
  }

  const converted = results.filter(r => r.status === 'converted');
  const skipped = results.filter(r => r.status === 'skip');
  const errors = results.filter(r => r.status === 'error');

  console.log(`\n=== Summary ===`);
  console.log(`Converted: ${converted.length}`);
  console.log(`Skipped:   ${skipped.length}`);
  console.log(`Errors:    ${errors.length}`);

  if (!dryRun && converted.length > 0) {
    console.log('\n=== Post-conversion Validation ===');
    let hasErrors = false;
    for (const r of converted) {
      const file = join(LESSONS_DIR, `${r.lessonId}.json`);
      const validation = validateFile(file);
      if (validation.errors.length > 0) {
        console.log(`❌ ${validation.lessonId}: ${validation.errors.length} error(s)`);
        validation.errors.forEach(e => console.log(`   ${e}`));
        hasErrors = true;
      }
    }
    if (!hasErrors) {
      console.log('✅ All converted files pass validation!');
    }
  }
}

main();
