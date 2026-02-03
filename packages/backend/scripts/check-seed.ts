/**
 * DB Seed 상태 확인 스크립트
 *
 * Language 테이블이 비어있으면 seed 필요
 * 이미 데이터가 있으면 스킵 (UPSERT 방식이라 실행해도 안전)
 *
 * 종료 코드:
 *   0 - seed 필요 없음 (데이터 존재)
 *   1 - seed 필요 (데이터 없음)
 *   2 - 에러 발생
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_n2V3WyUcbRpz@ep-ancient-sea-ahi4jsfx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

async function checkSeed() {
  const prisma = new PrismaClient({ adapter });

  try {
    // Language 테이블 확인 (가장 기본적인 seed 데이터)
    const languageCount = await prisma.language.count();
    const lessonCount = await prisma.lesson.count();

    console.log(`📊 DB Status: ${languageCount} languages, ${lessonCount} lessons`);

    if (languageCount === 0 || lessonCount === 0) {
      console.log('⚠️  Seed required: No curriculum data found');
      process.exit(1); // seed 필요
    } else {
      console.log('✅ Seed OK: Curriculum data exists');
      process.exit(0); // seed 불필요
    }
  } catch (error) {
    console.error('❌ DB connection error:', error);
    process.exit(2); // 에러
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkSeed();
