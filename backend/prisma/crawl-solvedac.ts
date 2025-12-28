/**
 * solved.ac API에서 Bronze~Silver 문제 크롤링
 *
 * Usage: npx ts-node prisma/crawl-solvedac.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// solved.ac API
const SOLVEDAC_API = 'https://solved.ac/api/v3';

// tier number -> difficulty string
function levelToTier(level: number): string {
  const tiers: Record<number, string> = {
    1: 'bronze_5', 2: 'bronze_4', 3: 'bronze_3', 4: 'bronze_2', 5: 'bronze_1',
    6: 'silver_5', 7: 'silver_4', 8: 'silver_3', 9: 'silver_2', 10: 'silver_1',
    11: 'gold_5', 12: 'gold_4', 13: 'gold_3', 14: 'gold_2', 15: 'gold_1',
  };
  return tiers[level] || 'unrated';
}

// tag display name 매핑
function getTagDisplayName(key: string): string {
  const tagMap: Record<string, string> = {
    'implementation': '구현',
    'math': '수학',
    'dp': '다이나믹 프로그래밍',
    'data_structures': '자료 구조',
    'graphs': '그래프',
    'greedy': '그리디',
    'string': '문자열',
    'sorting': '정렬',
    'bruteforcing': '브루트포스',
    'binary_search': '이분 탐색',
    'bfs': 'BFS',
    'dfs': 'DFS',
    'simulation': '시뮬레이션',
    'geometry': '기하학',
    'number_theory': '정수론',
    'trees': '트리',
    'ad_hoc': '애드 혹',
    'arithmetic': '사칙연산',
    'io': '입출력',
  };
  return tagMap[key] || key;
}

// Rate limiter (solved.ac: 256 requests / 15 min)
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface SolvedacProblem {
  problemId: number;
  titleKo: string;
  level: number;
  acceptedUserCount: number;
  averageTries: number;
  tags: { key: string; displayNames: { language: string; name: string }[] }[];
}

interface SearchResult {
  count: number;
  items: SolvedacProblem[];
}

async function fetchProblems(tier: string, page: number): Promise<SearchResult> {
  const query = `tier:${tier} lang:ko`;
  const url = `${SOLVEDAC_API}/search/problem?query=${encodeURIComponent(query)}&page=${page}&sort=level&direction=asc`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'COSLAB-Crawler/1.0',
    }
  });

  if (!response.ok) {
    throw new Error(`solved.ac API error: ${response.status}`);
  }

  return response.json() as Promise<SearchResult>;
}

async function crawlProblems() {
  console.log('🚀 Starting problem crawl from solved.ac...\n');

  // Silver 5 ~ Silver 1 (실버만)
  const tiers = ['s5', 's4', 's3', 's2', 's1'];
  const pagesPerTier = 5; // 각 티어당 5페이지 (페이지당 ~50문제) → ~250문제

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const tier of tiers) {
    console.log(`\n📥 Tier: ${tier.toUpperCase()}`);
    console.log('─'.repeat(50));

    for (let page = 1; page <= pagesPerTier; page++) {
      try {
        await sleep(500); // Rate limit: 0.5초 대기

        const result = await fetchProblems(tier, page);
        console.log(`  📄 Page ${page}: ${result.items.length} problems`);

        for (const item of result.items) {
          // 중복 체크
          const existing = await prisma.problem.findUnique({
            where: { number: item.problemId }
          });

          if (existing) {
            totalSkipped++;
            continue;
          }

          // 태그 추출
          const tags = item.tags.map(t => {
            const ko = t.displayNames.find(d => d.language === 'ko');
            return ko?.name || getTagDisplayName(t.key);
          });

          // DB 저장
          await prisma.problem.create({
            data: {
              id: item.problemId.toString(),
              number: item.problemId,
              title: item.titleKo,
              description: `이 문제는 백준 온라인 저지에서 확인하세요.\n\nhttps://www.acmicpc.net/problem/${item.problemId}\n\n난이도: ${levelToTier(item.level)}\n평균 시도: ${item.averageTries.toFixed(1)}회`,
              difficulty: levelToTier(item.level),
              tags: JSON.stringify(tags),
              source: 'BOJ',
              testCases: '[]',
            }
          });

          console.log(`    ✅ #${item.problemId}: ${item.titleKo}`);
          totalAdded++;

          await sleep(100); // 부하 분산
        }
      } catch (error: any) {
        console.error(`  ❌ Error on page ${page}:`, error.message);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Crawl complete!');
  console.log(`  ✅ Added: ${totalAdded}`);
  console.log(`  ⏭️  Skipped: ${totalSkipped}`);
}

async function main() {
  try {
    await crawlProblems();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
