// add_c_explanations.js
// This script adds a C language explanation to every C lesson JSON file.
// Explanation format:
// 포인터는 메모리 주소를 직접 다루며, `malloc`/`free` 로 동적 할당을 관리합니다.
// 포인터란?~~ malloc의 역할은?~~ free는?~~~

const fs = require('fs').promises;
const path = require('path');

// ---------------------------------------------------------------------
// ① 레슨 디렉터리 (백엔드 데이터 루트)
const LESSONS_DIR = path.resolve(__dirname, '../../data/lessons');

// ② 삽입할 설명 템플릿 (필요 시 여기서 직접 수정)
const C_EXPLANATION = `포인터는 메모리 주소를 직접 다루며, ` + "`malloc`/`free`" + ` 로 동적 할당을 관리합니다.
포인터란?~~ malloc의 역할은?~~ free는?~~~`;

// ---------------------------------------------------------------------
async function addCExplanations() {
    try {
        const files = await fs.readdir(LESSONS_DIR);
        const cFiles = files.filter(f => f.startsWith('c-') && f.endsWith('.json'));

        if (cFiles.length === 0) {
            console.warn('⚠️ C 레슨 파일을 찾을 수 없습니다.');
            return;
        }

        for (const file of cFiles) {
            const filePath = path.join(LESSONS_DIR, file);
            const raw = await fs.readFile(filePath, 'utf-8');
            const lesson = JSON.parse(raw);

            // 기존에 explanation 객체가 없으면 새로 만들고, C 설명을 삽입/덮어쓰기
            lesson.explanation = lesson.explanation || {};
            lesson.explanation.c = C_EXPLANATION;

            const newContent = JSON.stringify(lesson, null, 2);
            await fs.writeFile(filePath, newContent, 'utf-8');
            console.log(`✅ ${file}에 C 설명을 삽입했습니다.`);
        }
        console.log('🎉 모든 C 레슨에 설명이 적용되었습니다.');
    } catch (err) {
        console.error('❌ 스크립트 실행 중 오류 발생:', err);
        process.exit(1);
    }
}

addCExplanations();
