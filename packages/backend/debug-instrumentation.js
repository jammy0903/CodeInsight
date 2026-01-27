#!/usr/bin/env node
/**
 * 계측된 코드 디버깅
 */

const { DebuggerAgent } = require('./src/modules/simulators/javascript/agent/debugger_agent');

const testCode = `console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve()
  .then(() => console.log('3'))
  .then(() => console.log('4'));

console.log('5');
`;

const agent = new DebuggerAgent();

console.log('='.repeat(60));
console.log('📝 원본 코드:');
console.log('='.repeat(60));
console.log(testCode);

// 1. Promise/setTimeout 계측
const asyncInstrumented = agent.instrumentAsyncCallbacks(testCode);

console.log('\n' + '='.repeat(60));
console.log('✨ 비동기 계측 후:');
console.log('='.repeat(60));
console.log(asyncInstrumented);

// 2. 라인 기반 계측
const fullInstrumented = agent.instrumentCode(asyncInstrumented);

console.log('\n' + '='.repeat(60));
console.log('✨ 최종 계측 코드:');
console.log('='.repeat(60));
console.log(fullInstrumented);
