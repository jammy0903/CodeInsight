#!/usr/bin/env node
/**
 * Java lesson JSON에서 메모리 관련 필드를 모든 step에서 제거하는 스크립트.
 * 제거 대상: javaMemoryState, memoryState, visualizationType (javaMemory/memory)
 *
 * Usage:
 *   node remove-java-memory-state.mjs              # 실행 (모든 파일)
 *   node remove-java-memory-state.mjs --dry-run    # 미리보기 (변경 안 함)
 *   node remove-java-memory-state.mjs java-1-1     # 특정 파일만
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LESSONS_DIR = path.join(__dirname, '..', 'lessons');
const dryRun = process.argv.includes('--dry-run');
const targetFile = process.argv.find(a => a.startsWith('java-'));

const MEMORY_VIS_TYPES = new Set(['javaMemory', 'memory']);

function removeMemoryFields(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  const fileName = path.basename(filePath);

  let removedCount = 0;

  if (json.content?.steps) {
    for (const step of json.content.steps) {
      if ('javaMemoryState' in step) {
        delete step.javaMemoryState;
        removedCount++;
      }
      if ('memoryState' in step) {
        delete step.memoryState;
        removedCount++;
      }
      if (MEMORY_VIS_TYPES.has(step.visualizationType)) {
        delete step.visualizationType;
        removedCount++;
      }
    }
  }

  if (removedCount === 0) {
    console.log(`  ${fileName}: no memory fields found, skipping`);
    return { file: fileName, removed: 0 };
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  }

  console.log(`  ${fileName}: removed ${removedCount} memory-related fields${dryRun ? ' (dry-run)' : ''}`);
  return { file: fileName, removed: removedCount };
}

// Main
const files = fs.readdirSync(LESSONS_DIR)
  .filter(f => f.endsWith('.json'))
  .filter(f => !targetFile || f === `${targetFile}.json`)
  .sort();

console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Processing ${files.length} Java lesson files...\n`);

let totalRemoved = 0;
let filesModified = 0;

for (const file of files) {
  const result = removeMemoryFields(path.join(LESSONS_DIR, file));
  totalRemoved += result.removed;
  if (result.removed > 0) filesModified++;
}

console.log(`\nDone! ${filesModified} files modified, ${totalRemoved} memory-related fields removed.${dryRun ? ' (dry-run, no files changed)' : ''}\n`);
