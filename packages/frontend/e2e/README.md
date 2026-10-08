# E2E 테스트 가이드

CodeInsight 프론트엔드 End-to-End 테스트입니다. 모든 페이지는 로그인 없이 접근할 수 있습니다.

## 폴더 구조

```
e2e/
├── tests/public/
│   ├── home.spec.ts       # 홈 (/)
│   ├── courses.spec.ts    # 코스 목록, 언어별 페이지 (/courses, /courses/:lang)
│   └── lesson.spec.ts     # 레슨 학습 페이지 (/courses/:lessonId)
├── pages/                 # Page Object Model
├── fixtures/              # 공통 fixture, API 모킹
└── utils/                 # 유틸리티 함수
```

## 실행

```bash
pnpm test:e2e           # 전체 실행
pnpm test:e2e:ui        # UI 모드
pnpm test:e2e:headed    # 브라우저 표시
```
