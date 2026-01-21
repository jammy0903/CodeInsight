# REFACTORING.md - C-OSINE 프로젝트 리팩토링 규칙 총정리

프론트엔드 & 백엔드 리팩토링 시 반드시 지켜야 할 규칙들

---

# 🎨 Part 1: Frontend (React/Vite 예시)

## 1. Import Path Rules (파일 이동 시)
- 파일 이동 후 **모든 import 경로 업데이트 필수!**
- [예시: `components/common/`에서 `../../` 사용, `pages/`에서 `../` 사용 등]

## 2. 폴더 구조 원칙
```
✅ 올바른 구조 (pnpm monorepo)
packages/
└── frontend/
    └── src/
        ├── components/   # 재사용 가능한 공통 UI 컴포넌트
        ├── features/     # 도메인/기능별 컴포넌트 및 로직 (페이지 역할)
        ├── hooks/        # 커스텀 훅
        ├── layouts/      # 페이지 전체 레이아웃
        ├── services/     # API 호출 로직
        ├── stores/       # Zustand 전역 상태 관리
        └── utils/        # 범용 유틸리티 함수
```
- **2개 이상 페이지에서 사용** | `components/`
- **1개 페이지에서만 사용** | `pages/xxx/components/` (필요한 경우)

## 3. Frontend 리팩토링 체크리스트
- [ ] `git status` 깨끗한지 확인
- [ ] 이동할 파일 안의 모든 import 파악
- [ ] 이동할 파일을 import하는 다른 파일들 파악
- [ ] `git mv` 사용 (히스토리 보존)
- [ ] `npm run dev` - 빌드 에러 확인
- [ ] 브라우저 테스트 - 런타임 에러 확인

---

# ⚙️ Part 2: Backend (Node.js/Express.js 예시)

## 1. 폴더 구조
```
packages/
└── backend/
    └── src/
        ├── app.ts          # Express 앱 진입점
        ├── modules/        # 도메인별 모듈 디렉토리
        │   ├── users/      # 예시: 사용자 모듈
        │   │   ├── routes.ts
        │   │   ├── service.ts
        │   │   └── types.ts
        │   └── problems/   # 예시: 문제 모듈
        │       └── ...
        ├── config/         # 환경 변수 및 설정
        └── services/       # 여러 모듈에서 공유하는 서비스 (필요시)
```

## 2. API 라우터 패턴
- 라우터는 요청 처리만 담당하고, 비즈니스 로직은 서비스 계층으로 분리합니다.
- [예시: `app.use('/api/v1/users', userRoutes);`]

## 3. Service Layer 패턴
- 비즈니스 로직을 `services/` 폴더에 분리하여 재사용성 및 테스트 용이성을 높입니다.

## 4. DB 접근 규칙
- ORM/ODM(예: Sequelize, Mongoose, Prisma)을 사용하여 데이터베이스와 상호작용합니다.
- 직접적인 SQL 쿼리 사용은 최소화하고, 필요한 경우 별도 리포지토리(repository) 계층을 둡니다.

## 5. Backend 리팩토링 체크리스트
- [ ] 라우터 이동/수정 시 `app.js` (또는 메인 진입점)의 라우터 등록 확인
- [ ] 프론트엔드 API 호출 경로 업데이트
- [ ] 모델 수정 시 마이그레이션 필요 여부 확인
- [ ] 관련 서비스/리포지토리 함수 업데이트

---

## 📚 참고 자료

- `C-OSINE/.gemini/golden_samples/` - 패턴 및 모범 사례