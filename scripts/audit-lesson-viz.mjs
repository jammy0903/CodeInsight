#!/usr/bin/env node
/**
 * Lesson Visualization Data Audit Script
 *
 * Checks every lesson JSON to find steps missing visualization data.
 * These are the lessons where useLessonSimulation will fall back to
 * simulator merge, potentially causing explanation/data mismatch.
 *
 * Usage: node scripts/audit-lesson-viz.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const CONTENT_ROOT = join(import.meta.dirname, '../packages/backend/prisma/content');

// Same fields as frontend's VIZ_DATA_FIELDS + visualizationType check
const VIZ_DATA_FIELDS = [
  'stack', 'heap', 'data', 'memoryState', 'scopeState', 'eventLoopState',
  'promiseState', 'thisState', 'prototypeState', 'callStackState',
  'pythonMemoryState', 'pyNames', 'pyObjects', 'javaMemoryState', 'memoryChanges',
  'algorithmState', 'stdout', 'output', 'conceptVisualizationType', 'conceptState',
];

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some(item => hasMeaningfulValue(item));
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return false;
    return entries.some(([, nested]) => hasMeaningfulValue(nested));
  }
  return true;
}

function hasVisualizationPayload(step) {
  return VIZ_DATA_FIELDS.some(field => hasMeaningfulValue(step[field]));
}

function hasVisualizationData(step) {
  if (typeof step.visualizationType === 'string' && step.visualizationType.trim().length > 0) {
    return true;
  }
  return hasVisualizationPayload(step);
}

// Collect all lesson JSON files
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else if (entry.endsWith('.json') && dir.includes('/lessons')) {
      results.push(full);
    }
  }
  return results;
}

// Categories
const issues = {
  noSteps: [],           // no steps at all
  allGood: [],           // all steps have viz data
  partialViz: [],        // SOME steps missing viz (DANGEROUS - triggers simulator merge)
  noViz: [],             // NO steps have viz data (simulator will generate all)
};

// Additional checks
const dataIssues = {
  loopStdoutMismatch: [],  // stdout jumps that suggest loop step inconsistency
  addressNotIncrementing: [], // pointer values that don't progress logically
  emptyStack: [],          // steps with visualizationType but empty stack/heap
};

const files = collectFiles(CONTENT_ROOT);

for (const file of files) {
  const relPath = relative(CONTENT_ROOT, file);
  let json;
  try {
    json = JSON.parse(readFileSync(file, 'utf-8'));
  } catch (e) {
    console.error(`PARSE ERROR: ${relPath} - ${e.message}`);
    continue;
  }

  const steps = json.content?.steps;
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    issues.noSteps.push(relPath);
    continue;
  }

  const stepsWithViz = [];
  const stepsWithoutViz = [];

  steps.forEach((step, idx) => {
    if (hasVisualizationData(step)) {
      stepsWithViz.push(idx);
    } else {
      stepsWithoutViz.push(idx);
    }
  });

  if (stepsWithoutViz.length === 0) {
    issues.allGood.push(relPath);
  } else if (stepsWithViz.length === 0) {
    issues.noViz.push(relPath);
  } else {
    issues.partialViz.push({
      file: relPath,
      total: steps.length,
      missing: stepsWithoutViz,
      missingTitles: stepsWithoutViz.map(i => steps[i].title || `Step ${i}`),
    });
  }

  // Data consistency checks
  const vizType = steps[0]?.visualizationType;
  if (vizType === 'cMemory' || vizType === 'memory') {
    // Check pointer value progression
    const pointerValues = [];
    steps.forEach((step, idx) => {
      if (!step.stack) return;
      const ptrVars = step.stack.filter(v => v.type?.includes('*'));
      ptrVars.forEach(v => {
        if (v.value && v.value.startsWith('0x')) {
          pointerValues.push({ idx, name: v.name, value: v.value, stdout: step.stdout });
        }
      });
    });

    // Check for stdout that jumps (suggests missing loop iterations)
    let prevStdout = '';
    steps.forEach((step, idx) => {
      if (step.stdout && prevStdout) {
        if (!step.stdout.startsWith(prevStdout) && step.stdout !== prevStdout) {
          dataIssues.loopStdoutMismatch.push({
            file: relPath,
            stepIdx: idx,
            prev: prevStdout,
            curr: step.stdout,
            title: step.title,
          });
        }
      }
      if (step.stdout !== undefined) prevStdout = step.stdout;
    });
  }

  // Check for empty stack with cMemory vizType
  steps.forEach((step, idx) => {
    if (
      step.visualizationType === 'cMemory' &&
      idx > 1 && // skip header/main steps
      (!step.stack || (Array.isArray(step.stack) && step.stack.length === 0)) &&
      (!step.heap || (Array.isArray(step.heap) && step.heap.length === 0))
    ) {
      dataIssues.emptyStack.push({
        file: relPath,
        stepIdx: idx,
        title: step.title,
      });
    }
  });
}

// Report
console.log('=== LESSON VISUALIZATION AUDIT ===\n');
console.log(`Total lessons: ${files.length}`);
console.log(`All steps have viz data: ${issues.allGood.length}`);
console.log(`No steps at all: ${issues.noSteps.length}`);
console.log(`No viz data (simulator-only): ${issues.noViz.length}`);
console.log(`PARTIAL viz data (DANGER): ${issues.partialViz.length}`);

if (issues.partialViz.length > 0) {
  console.log('\n--- PARTIAL VIZ (simulator merge risk) ---');
  for (const p of issues.partialViz) {
    console.log(`  ${p.file} — ${p.missing.length}/${p.total} steps missing`);
    p.missingTitles.forEach((t, i) => {
      console.log(`    step[${p.missing[i]}]: "${t}"`);
    });
  }
}

if (issues.noSteps.length > 0) {
  console.log('\n--- NO STEPS ---');
  issues.noSteps.forEach(f => console.log(`  ${f}`));
}

if (dataIssues.loopStdoutMismatch.length > 0) {
  console.log('\n--- STDOUT JUMPS (possible loop inconsistency) ---');
  for (const d of dataIssues.loopStdoutMismatch) {
    console.log(`  ${d.file} step[${d.stepIdx}] "${d.title}"`);
    console.log(`    prev: "${d.prev}" -> curr: "${d.curr}"`);
  }
}

if (dataIssues.emptyStack.length > 0) {
  console.log('\n--- EMPTY STACK/HEAP with cMemory vizType ---');
  for (const d of dataIssues.emptyStack) {
    console.log(`  ${d.file} step[${d.stepIdx}] "${d.title}"`);
  }
}

// Summary by language
console.log('\n--- BY LANGUAGE ---');
const byLang = {};
for (const f of files) {
  const rel = relative(CONTENT_ROOT, f);
  const lang = rel.split('/')[0];
  if (!byLang[lang]) byLang[lang] = { total: 0, good: 0, partial: 0, noViz: 0, noSteps: 0 };
  byLang[lang].total++;
  if (issues.allGood.includes(rel)) byLang[lang].good++;
  else if (issues.partialViz.some(p => p.file === rel)) byLang[lang].partial++;
  else if (issues.noViz.includes(rel)) byLang[lang].noViz++;
  else if (issues.noSteps.includes(rel)) byLang[lang].noSteps++;
}

for (const [lang, counts] of Object.entries(byLang).sort((a, b) => a[0].localeCompare(b[0]))) {
  const status = counts.partial > 0 ? 'WARN' : 'OK';
  console.log(`  ${lang}: ${counts.total} total | ${counts.good} good | ${counts.partial} PARTIAL | ${counts.noViz} sim-only | ${counts.noSteps} no-steps [${status}]`);
}
