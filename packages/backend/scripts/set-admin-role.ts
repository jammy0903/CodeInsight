/**
 * Set Admin Role for User
 *
 * "재미잼" 사용자의 role을 'admin'으로 설정합니다
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setAdminRole() {
  console.log('🔧 Setting admin role for "재미잼"...\n');

  const targetUid = '2745406d-572d-44fb-b042-b778522640d5';

  // 사용자 찾기
  const user = await prisma.user.findUnique({
    where: { id: targetUid },
    select: {
      id: true,
      nickname: true,
      role: true,
    }
  });

  if (!user) {
    console.log('❌ 사용자를 찾을 수 없습니다.');
    return;
  }

  console.log('📌 현재 상태:');
  console.log(`   Nickname: ${user.nickname}`);
  console.log(`   UID: ${user.id}`);
  console.log(`   Role: ${user.role || '(없음)'}\n`);

  // role을 'admin'으로 업데이트
  const updated = await prisma.user.update({
    where: { id: targetUid },
    data: { role: 'admin' },
    select: {
      id: true,
      nickname: true,
      role: true,
    }
  });

  console.log('✅ 업데이트 완료:');
  console.log(`   Nickname: ${updated.nickname}`);
  console.log(`   UID: ${updated.id}`);
  console.log(`   Role: ${updated.role}\n`);

  console.log('🎉 "재미잼" 사용자가 admin으로 설정되었습니다!');
  console.log('💡 프론트엔드에서 다시 로그인하면 Admin 메뉴가 보입니다.');
}

async function main() {
  try {
    await setAdminRole();
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
