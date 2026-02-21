/**
 * 프로덕션 데이터베이스 사용자 데이터 초기화 스크립트
 *
 * 주의: 이 스크립트는 모든 사용자 데이터를 삭제합니다!
 * - User 테이블 및 Cascade로 연결된 모든 데이터 삭제
 * - 레슨, 문제 등 시스템 데이터는 유지됨
 *
 * 실행: npx tsx scripts/clear-users.ts          ← dry-run (미리보기)
 *       npx tsx scripts/clear-users.ts --apply  ← 실제 삭제
 */

import { prisma } from '../src/config/database';

const applyFlag = process.argv.includes('--apply');

async function clearUserData() {
  console.log('');
  console.log('🗑️  프로덕션 데이터베이스 사용자 데이터 삭제');
  console.log('');

  try {
    // Step 1: 현재 사용자 수 확인
    const userCount = await prisma.user.count();
    const progressCount = await prisma.userProgress.count();
    const submissionCount = await prisma.submission.count();

    console.log('📊 현재 데이터:');
    console.log(`   - Users: ${userCount}명`);
    console.log(`   - UserProgress: ${progressCount}개`);
    console.log(`   - Submissions: ${submissionCount}개`);

    if (userCount === 0) {
      console.log('\n✅ 삭제할 사용자가 없습니다!');
      return;
    }

    if (!applyFlag) {
      console.log('\n⚠️  DRY-RUN: 위 데이터가 모두 삭제됩니다.');
      console.log('   실제 삭제하려면 --apply 플래그를 추가하세요.');
      console.log('   예: npx tsx scripts/clear-users.ts --apply');
      return;
    }

    console.log('');
    console.log('⏳ 삭제 중 (--apply)...');
    console.log('');

    // Step 2: 외래 키 제약이 있는 테이블 먼저 삭제
    console.log('1️⃣ UserProgress 삭제...');
    const progressResult = await prisma.userProgress.deleteMany({});
    console.log(`   ✅ ${progressResult.count}개 삭제 완료`);

    console.log('2️⃣ Submission 삭제...');
    const submissionResult = await prisma.submission.deleteMany({});
    console.log(`   ✅ ${submissionResult.count}개 삭제 완료`);

    console.log('3️⃣ Draft 삭제...');
    const draftResult = await prisma.draft.deleteMany({});
    console.log(`   ✅ ${draftResult.count}개 삭제 완료`);

    console.log('');

    // Step 3: User 삭제 (Cascade로 관련 데이터 자동 삭제)
    console.log('4️⃣ User 및 Cascade 데이터 삭제...');
    const result = await prisma.user.deleteMany({});

    console.log('');
    console.log(`✅ ${result.count}명의 사용자 데이터 삭제 완료!`);
    console.log('');
    console.log('🎯 자동 삭제된 관련 데이터:');
    console.log('   - OAuth 계정, 학습 진행 기록, 제출 내역, 드래프트');
    console.log('   - 레슨 활동, AI 채팅, 퀴즈, 노트, 프로필, 스트릭');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ 에러 발생:', error);

    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      console.error('💡 외래 키 제약 문제입니다. 관련 테이블을 먼저 삭제해야 합니다.');
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
clearUserData()
  .then(() => {
    console.log('🏁 스크립트 정상 종료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 스크립트 실패:', error);
    process.exit(1);
  });
