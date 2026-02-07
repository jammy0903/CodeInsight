import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const keepIds = ['c-1-5','c-1-6','c-1-7','js-1-5','js-1-6','js-1-7','js-1-8','js-2-4','py-1-5','py-1-8'];
const outDir = path.join(__dirname, 'extracted');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const id of keepIds) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { content: true, quizzes: { orderBy: { order: 'asc' } } },
    });
    if (!lesson) { console.log('MISSING: ' + id); continue; }

    let steps: unknown[] = [];
    if (lesson.content?.steps) {
      steps = typeof lesson.content.steps === 'string'
        ? JSON.parse(lesson.content.steps as string)
        : (lesson.content.steps as unknown[]);
    }

    const quiz = lesson.quizzes[0];
    let quizOptions: unknown = null;
    if (quiz?.options) {
      quizOptions = typeof quiz.options === 'string' ? JSON.parse(quiz.options) : quiz.options;
    }

    const json = {
      lessonId: id,
      title: lesson.title,
      concept: lesson.description || '',
      content: { code: lesson.content?.code || '', steps },
      quiz: quiz ? {
        question: quiz.question,
        options: quizOptions,
        correctIndex: parseInt(quiz.answer),
        explanation: quiz.explanation || '',
      } : null,
      keyTakeaway: '',
    };

    fs.writeFileSync(path.join(outDir, id + '.json'), JSON.stringify(json, null, 2));
    console.log('OK: ' + id + ' | steps:' + steps.length + ' | quiz:' + (quiz ? 'Y' : 'N') + ' | code:' + (lesson.content?.code?.length || 0) + 'chars');
  }

  await prisma.$disconnect();
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
