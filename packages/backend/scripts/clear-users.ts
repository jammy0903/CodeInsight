/**
 * 프로덕션 데이터베이스 사용자 데이터 초기화 스크립트
 *
 * 주의: 이 스크립트는 모든 사용자 데이터를 삭제합니다!
 * - User 테이블 및 Cascade로 연결된 모든 데이터 삭제
 * - 레슨, 문제 등 시스템 데이터는 유지됨
 */

import { prisma } from '../src/config/database';

async function clearUserData() {
  console.log('');
  console.log('🗑️  프로덕션 데이터베이스 사용자 데이터 삭제 시작...');
  console.log('');

  try {
    // Step 1: 현재 사용자 수 확인
    const userCount = await prisma.user.count();
    console.log(`📊 현재 사용자 수: ${userCount}명`);

    if (userCount === 0) {
      console.log('✅ 삭제할 사용자가 없습니다!');
      return;
    }

    console.log('');
    console.log('⏳ 삭제 중...');
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
    console.log('   - OAuth 계정');
    console.log('   - 학습 진행 기록');
    console.log('   - 제출 내역');
    console.log('   - 드래프트');
    console.log('   - 레슨 활동');
    console.log('   - AI 채팅 히스토리');
    console.log('   - 퀴즈 시도 기록');
    console.log('   - 사용자 노트');
    console.log('   - 프로필');
    console.log('   - 세션 컨텍스트');
    console.log('   - 스텝 활동');
    console.log('   - 스트릭');
    console.log('   - 독립 퀴즈 시도');
    console.log('');
    console.log('✨ 데이터베이스 초기화 완료! 새로 시작할 수 있습니다!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ 에러 발생:', error);
    console.error('');

    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('');

      // 외래 키 제약 에러 감지
      if (error.message.includes('foreign key constraint')) {
        console.error('💡 외래 키 제약 문제입니다. 관련 테이블을 먼저 삭제해야 합니다.');
        console.error('');
      }
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
