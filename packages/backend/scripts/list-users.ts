/**
 * List users matching a pattern
 * Usage: npx tsx scripts/list-users.ts [nickname_pattern]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers(nicknamePattern?: string) {
  try {
    const where = nicknamePattern
      ? { nickname: { startsWith: nicknamePattern } }
      : {};

    const users = await prisma.user.findMany({
      where,
      include: {
        oauthAccounts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\n📋 Found ${users.length} user(s):\n`);

    for (const user of users) {
      console.log('━'.repeat(60));
      console.log(`닉네임: ${user.nickname}`);
      console.log(`Role: ${user.role}`);
      console.log(`생성일: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`ID: ${user.id}`);
      console.log(
        `OAuth: ${user.oauthAccounts.map((a) => `${a.provider}(${a.providerId.slice(0, 10)}...)`).join(', ')}`
      );
    }
    console.log('━'.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const pattern = process.argv[2];
listUsers(pattern);
