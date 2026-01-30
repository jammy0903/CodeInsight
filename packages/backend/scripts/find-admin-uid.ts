/**
 * Find Admin User Firebase UID
 *
 * "재미잼" 사용자의 Firebase UID를 찾습니다
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findAdminUid() {
  console.log('🔍 Finding "재미잼" user Firebase UID...\n');

  // "재미잼" 사용자 찾기
  const user = await prisma.user.findFirst({
    where: {
      nickname: '재미잼'
    },
    select: {
      id: true,
      nickname: true,
      createdAt: true,
    }
  });

  if (!user) {
    console.log('❌ "재미잼" 사용자를 찾을 수 없습니다.');
    return;
  }

  console.log('✅ 사용자 발견:');
  console.log(`   Nickname: ${user.nickname}`);
  console.log(`   Firebase UID: ${user.id}`);
  console.log(`   Created: ${user.createdAt.toISOString()}\n`);

  console.log('📝 .env 파일에 추가할 내용:');
  console.log(`ADMIN_FIREBASE_UID=${user.id}`);
  console.log('\n💡 백엔드 .env 파일에 위 내용을 추가하세요.');
}

async function main() {
  try {
    await findAdminUid();
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
