/**
 * 크롤링된 문제에 상세 설명 + 테스트케이스 추가
 *
 * Usage: npx ts-node prisma/enrich-problems.ts [개수]
 * 예: npx ts-node prisma/enrich-problems.ts 10
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// xAI Grok API (환경변수에서 가져옴)
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 백준 문제 페이지에서 설명 크롤링
async function fetchBaekjoonProblem(problemId: number): Promise<string | null> {
  try {
    const url = `https://www.acmicpc.net/problem/${problemId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    if (!response.ok) return null;

    const html = await response.text();

    // 간단한 파싱 - 문제 설명 추출
    const problemDescMatch = html.match(/<div id="problem_description"[^>]*>([\s\S]*?)<\/div>/);
    const inputDescMatch = html.match(/<div id="problem_input"[^>]*>([\s\S]*?)<\/div>/);
    const outputDescMatch = html.match(/<div id="problem_output"[^>]*>([\s\S]*?)<\/div>/);

    // 예제 입출력 추출
    const sampleInputs: string[] = [];
    const sampleOutputs: string[] = [];

    const sampleInputMatches = html.matchAll(/<pre id="sample-input-(\d+)"[^>]*>([\s\S]*?)<\/pre>/g);
    const sampleOutputMatches = html.matchAll(/<pre id="sample-output-(\d+)"[^>]*>([\s\S]*?)<\/pre>/g);

    for (const match of sampleInputMatches) {
      sampleInputs.push(match[2].trim());
    }
    for (const match of sampleOutputMatches) {
      sampleOutputs.push(match[2].trim());
    }

    // HTML 태그 제거
    const stripHtml = (str: string) => str?.replace(/<[^>]*>/g, '').trim() || '';

    let description = '';
    if (problemDescMatch) description += stripHtml(problemDescMatch[1]) + '\n\n';
    if (inputDescMatch) description += '## 입력\n' + stripHtml(inputDescMatch[1]) + '\n\n';
    if (outputDescMatch) description += '## 출력\n' + stripHtml(outputDescMatch[1]);

    return JSON.stringify({
      description: description.trim(),
      sampleInputs,
      sampleOutputs
    });
  } catch (error) {
    console.error(`Failed to fetch problem ${problemId}:`, error);
    return null;
  }
}

// LLM으로 테스트케이스 생성
async function generateTestCases(
  problemNumber: number,
  title: string,
  description: string,
  sampleInputs: string[],
  sampleOutputs: string[]
): Promise<{ input: string; output: string }[]> {

  const prompt = `당신은 프로그래밍 문제의 테스트케이스를 생성하는 전문가입니다.

## 문제 정보
- 번호: ${problemNumber}
- 제목: ${title}
- 설명:
${description}

## 기존 예제
${sampleInputs.map((inp, i) => `입력 ${i+1}:\n${inp}\n출력 ${i+1}:\n${sampleOutputs[i] || '(없음)'}`).join('\n\n')}

## 요청
위 문제에 대해 테스트케이스 5개를 JSON 배열로 생성해주세요.
- 기존 예제 포함
- 엣지케이스 추가 (최소값, 최대값, 경계값 등)
- C언어로 풀 수 있는 난이도

반드시 아래 형식의 JSON만 출력하세요 (다른 텍스트 없이):
[{"input": "...", "output": "..."}, ...]`;

  try {
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '';

    // JSON 추출
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Failed to generate test cases:', error);
    return [];
  }
}

async function enrichProblems(limit: number) {
  console.log(`🚀 Enriching ${limit} problems...\n`);

  // 테스트케이스가 없는 문제들 가져오기
  const problems = await prisma.problem.findMany({
    where: {
      testCases: '[]',
    },
    orderBy: { number: 'asc' },
    take: limit,
  });

  console.log(`Found ${problems.length} problems to enrich\n`);

  let success = 0;
  let failed = 0;

  for (const problem of problems) {
    console.log(`\n📝 Processing #${problem.number}: ${problem.title}`);

    // 1. 백준에서 문제 정보 가져오기
    console.log('   Fetching from Baekjoon...');
    const baekjoonData = await fetchBaekjoonProblem(problem.number);

    if (!baekjoonData) {
      console.log('   ❌ Failed to fetch from Baekjoon');
      failed++;
      continue;
    }

    const { description, sampleInputs, sampleOutputs } = JSON.parse(baekjoonData);
    console.log(`   ✓ Got description (${description.length} chars), ${sampleInputs.length} examples`);

    // 2. LLM으로 테스트케이스 생성
    console.log('   Generating test cases with AI...');
    await sleep(1000); // Rate limit

    const testCases = await generateTestCases(
      problem.number,
      problem.title,
      description,
      sampleInputs,
      sampleOutputs
    );

    if (testCases.length === 0) {
      console.log('   ❌ Failed to generate test cases');
      failed++;
      continue;
    }

    console.log(`   ✓ Generated ${testCases.length} test cases`);

    // 3. DB 업데이트
    await prisma.problem.update({
      where: { id: problem.id },
      data: {
        description: description || problem.description,
        testCases: JSON.stringify(testCases),
      },
    });

    console.log('   ✅ Updated database');
    success++;

    // Rate limiting
    await sleep(2000);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Enrichment complete!');
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
}

// Main
const limit = parseInt(process.argv[2]) || 10;
enrichProblems(limit)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
