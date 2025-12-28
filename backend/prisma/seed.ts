import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ProblemJSON {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  source?: string;
  solution?: string;
  testCases: { input: string; output: string }[];
}

async function main() {
  const jsonPath = path.join(__dirname, '../../frontend/public/data/problems.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const problems: ProblemJSON[] = data.problems;

  console.log(`Seeding ${problems.length} problems...`);

  for (const p of problems) {
    await prisma.problem.upsert({
      where: { id: p.id },
      update: {
        number: p.number,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        tags: JSON.stringify(p.tags),
        source: p.source || null,
        solution: p.solution || null,
        testCases: JSON.stringify(p.testCases),
      },
      create: {
        id: p.id,
        number: p.number,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        tags: JSON.stringify(p.tags),
        source: p.source || null,
        solution: p.solution || null,
        testCases: JSON.stringify(p.testCases),
      },
    });
    console.log(`  ✓ Problem ${p.number}: ${p.title}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
