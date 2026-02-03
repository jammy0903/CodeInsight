/**
 * DB 사용자 확인 스크립트
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUsers() {
  console.log('🔍 Checking all users in database...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      nickname: true,
      createdAt: true,
      _count: {
        select: {
          standaloneQuizAttempts: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Found ${users.length} users:\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.nickname}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Quiz Attempts: ${user._count.standaloneQuizAttempts}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);
    console.log();
  });

  // admin 키워드 포함 유저
  const adminUsers = users.filter(u =>
    u.nickname.toLowerCase().includes('admin')
  );

  if (adminUsers.length > 0) {
    console.log('\n📌 Users with "admin" in nickname:');
    adminUsers.forEach(user => {
      console.log(`  - ${user.nickname} (${user.id})`);
      console.log(`    Quiz Attempts: ${user._count.standaloneQuizAttempts}`);
    });
  }
}

async function main() {
  try {
    await checkUsers();
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
