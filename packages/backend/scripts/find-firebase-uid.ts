/**
 * Find Firebase UID for Admin User
 *
 * "재미잼" 사용자의 실제 Firebase UID (providerId)를 찾습니다
 * ADMIN_FIREBASE_UID 환경변수에 설정할 값입니다
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findFirebaseUid() {
  console.log('🔍 Finding Firebase UID for "재미잼" user...\n');

  // "재미잼" 사용자 찾기 (OAuthAccount 포함)
  const user = await prisma.user.findFirst({
    where: {
      nickname: '재미잼'
    },
    select: {
      id: true,
      nickname: true,
      role: true,
      oauthAccounts: {
        select: {
          provider: true,
          providerId: true,
        },
      },
    }
  });

  if (!user) {
    console.log('❌ "재미잼" 사용자를 찾을 수 없습니다.');
    return;
  }

  console.log('✅ 사용자 발견:');
  console.log(`   Nickname: ${user.nickname}`);
  console.log(`   User UUID: ${user.id}`);
  console.log(`   Role: ${user.role}\n`);

  if (user.oauthAccounts.length === 0) {
    console.log('❌ OAuth 계정 연동이 없습니다.');
    return;
  }

  console.log('📱 OAuth 계정:');
  user.oauthAccounts.forEach((account, index) => {
    console.log(`   ${index + 1}. Provider: ${account.provider}`);
    console.log(`      Firebase UID: ${account.providerId}\n`);
  });

  const primaryAccount = user.oauthAccounts[0];

  console.log('🔑 ADMIN_FIREBASE_UID 설정 값:');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`ADMIN_FIREBASE_UID=${primaryAccount.providerId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  console.log('💡 다음 파일들을 업데이트하세요:');
  console.log('   1. packages/backend/.env');
  console.log('   2. railway-backend-env.json');
}

async function main() {
  try {
    await findFirebaseUid();
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
