#!/usr/bin/env node
/**
 * AST 구조 분석 테스트
 * Promise.then()과 setTimeout() 패턴의 AST 노드 확인
 */

const acorn = require('acorn');
const walk = require('acorn-walk');

const testCode = `
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve()
  .then(() => console.log('3'))
  .then(() => console.log('4'));

console.log('5');
`;

console.log('='.repeat(60));
console.log('📝 테스트 코드:');
console.log('='.repeat(60));
console.log(testCode);

// AST 파싱
const ast = acorn.parse(testCode, {
  ecmaVersion: 2020,
  locations: true, // line/column 정보 포함
});

console.log('\n' + '='.repeat(60));
console.log('🔍 AST 구조 분석:');
console.log('='.repeat(60));

// setTimeout 패턴 찾기
console.log('\n1️⃣ setTimeout 호출:');
walk.simple(ast, {
  CallExpression(node) {
    if (
      node.callee.type === 'Identifier' &&
      node.callee.name === 'setTimeout'
    ) {
      const callback = node.arguments[0];
      const delay = node.arguments[1];

      console.log('  - setTimeout 발견!');
      console.log('    위치:', `Line ${node.loc.start.line}`);
      console.log('    콜백 타입:', callback.type);
      console.log('    콜백 시작:', `Line ${callback.loc.start.line}`);
      console.log('    지연 시간:', delay.type === 'Literal' ? delay.value : 'unknown');

      if (callback.type === 'ArrowFunctionExpression') {
        console.log('    콜백 body 타입:', callback.body.type);
        console.log('    콜백 body 위치:', `Line ${callback.body.loc.start.line}`);
      }
    }
  }
});

// Promise.then() 패턴 찾기
console.log('\n2️⃣ Promise.then() 호출:');
let thenCount = 0;
walk.simple(ast, {
  CallExpression(node) {
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.property.name === 'then'
    ) {
      thenCount++;
      const callback = node.arguments[0];

      console.log(`  - .then() #${thenCount} 발견!`);
      console.log('    위치:', `Line ${node.loc.start.line}`);
      console.log('    콜백 타입:', callback.type);
      console.log('    콜백 시작:', `Line ${callback.loc.start.line}`);

      if (callback.type === 'ArrowFunctionExpression') {
        console.log('    콜백 body 타입:', callback.body.type);
        console.log('    콜백 body 위치:', `Line ${callback.body.loc.start.line}`);
      }
    }
  }
});

// 전체 AST 구조 출력 (디버깅용)
console.log('\n3️⃣ 전체 AST 구조 (JSON):');
console.log(JSON.stringify(ast, null, 2));
