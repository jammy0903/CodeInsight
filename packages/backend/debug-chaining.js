#!/usr/bin/env node
const { DebuggerAgent } = require('./src/modules/simulators/javascript/agent/debugger_agent');

const testCode = `Promise.resolve()
  .then(() => { console.log('A'); return 1; })
  .then(val => { console.log('B', val); });

console.log('C');
`;

const agent = new DebuggerAgent();

console.log('원본:');
console.log(testCode);

const instrumented1 = agent.instrumentAsyncCallbacks(testCode);
console.log('\n비동기 계측:');
console.log(instrumented1);

const instrumented2 = agent.instrumentCode(instrumented1);
console.log('\n최종 계측:');
console.log(instrumented2);
