# User 스키마 재설계 계획

> **목표**: UUID 기반 → 닉네임 기반 사용자 식별 + 다중 OAuth 지원
> **작성일**: 2026-01-03
> **상태**: 진행 중

---

## 1. 현재 문제점

### 1.1 기존 스키마
```prisma
model User {
  id          String  @id @default(uuid())
  email       String  @unique
  name        String
  firebaseUid String  @unique @map("firebase_uid")
  role        String  @default("user")
}
```

### 1.2 문제점
- `firebaseUid`가 Google OAuth에만 종속
- 다중 OAuth (GitHub, Kakao) 확장 어려움
- 사용자 식별자가 UUID라 의미 없음
- 이메일이 필수값이지만 OAuth별로 다를 수 있음

---

## 2. 새 스키마 설계

### 2.1 User 모델
```prisma
model User {
  nickname    String       @id                    // Primary Key = 닉네임
  role        String       @default("user")       // 'user' | 'admin'
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relations
  oauthAccounts OAuthAccount[]
  drafts        Draft[]
  submissions   Submission[]

  @@map("users")
}
```

### 2.2 OAuthAccount 모델 (새로 추가)
```prisma
model OAuthAccount {
  id           String   @id @default(uuid())
  userNickname String   @map("user_nickname")
  provider     String                           // 'google' | 'github' | 'kakao'
  providerId   String   @map("provider_id")     // OAuth provider의 고유 ID
  email        String?                          // provider별 이메일 (nullable)
  createdAt    DateTime @default(now())

  user User @relation(fields: [userNickname], references: [nickname], onDelete: Cascade)

  @@unique([provider, providerId])              // 같은 provider의 같은 계정 중복 방지
  @@index([userNickname])
  @@map("oauth_accounts")
}
```

### 2.3 변경 요약

| 기존 | 새 구조 |
|------|---------|
| `id` (UUID) PK | `nickname` (String) PK |
| `firebaseUid` | 삭제 → `OAuthAccount.providerId`로 대체 |
| `email` | 삭제 → `OAuthAccount.email`로 이동 |
| `name` | 삭제 → `nickname`이 대체 |

---

## 3. 인증 플로우 변경

### 3.1 기존 플로우
```
1. Firebase 로그인 → firebaseUid 획득
2. Backend에서 firebaseUid로 User 조회
3. 없으면 자동 생성 (이메일, 이름 포함)
```

### 3.2 새 플로우
```
1. Firebase 로그인 → provider + providerId + email 획득
2. Backend에서 OAuthAccount 조회 (provider + providerId)
3. 없으면 → 닉네임 입력 화면 표시 (신규 가입)
4. 닉네임 입력 → User + OAuthAccount 생성
5. 있으면 → User 정보 반환 (기존 사용자)
```

### 3.3 플로우 다이어그램
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Firebase  │────▶│   Backend   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │  1. Login Click   │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │  2. OAuth Popup   │                   │
       │◀──────────────────│                   │
       │                   │                   │
       │  3. Firebase Token│                   │
       │◀──────────────────│                   │
       │                   │                   │
       │  4. GET /users/me (with token)        │
       │──────────────────────────────────────▶│
       │                   │                   │
       │                   │  5. Verify Token  │
       │                   │◀─────────────────▶│
       │                   │                   │
       │  6a. 200 OK (User exists)             │
       │◀──────────────────────────────────────│
       │                   │                   │
       │  6b. 404 (Need registration)          │
       │◀──────────────────────────────────────│
       │                   │                   │
       │  7. POST /users/register (nickname)   │
       │──────────────────────────────────────▶│
       │                   │                   │
       │  8. 201 Created (New User)            │
       │◀──────────────────────────────────────│
```

---

## 4. 수정 대상 파일

### 4.1 Backend (Courses 제외)

| 파일 | 수정 내용 |
|------|-----------|
| `prisma/schema.prisma` | User 모델 변경 + OAuthAccount 추가 |
| `src/middleware/auth.ts` | firebaseUid → OAuthAccount 조회 |
| `src/modules/users/routes.ts` | 닉네임 등록 API 추가 |
| `src/modules/admin/admin.service.ts` | User + OAuthAccount 조인 쿼리 |
| `src/modules/submissions/routes.ts` | `dbUser.id` → `dbUser.nickname` |
| `src/modules/c/routes.ts` | firebaseUid 조회 → OAuthAccount 조회 |
| `src/config/swagger.ts` | API 문서 스키마 업데이트 |

### 4.2 Frontend

| 파일 | 수정 내용 |
|------|-----------|
| `src/stores/store.ts` | AppUser 타입 추가, needsRegistration 상태 |
| `src/services/firebase.ts` | 로그인 후 등록 플로우 처리 |
| `src/layouts/Sidebar.tsx` | `user.displayName` → `appUser.nickname` |
| `src/layouts/components/UserMenu.tsx` | 닉네임 + OAuth 이메일 표시 |
| `src/features/admin/AdminPage.tsx` | 사용자 목록 UI 변경 |
| `src/features/admin/components/AdminRoute.tsx` | 이메일 → role 기반 체크 |
| `src/components/PixelAvatar.tsx` | `userId` → `nickname` |

### 4.3 제외 (나중에 처리)

- `src/modules/courses/*` - 코스 관련 전체
- `src/types/course-schema.ts` - UserProgress 타입

---

## 5. Backend 상세 변경

### 5.1 auth.ts 미들웨어

```typescript
// 기존
const user = await prisma.user.findUnique({
  where: { firebaseUid: decodedToken.uid }
});

// 새로운
const oauthAccount = await prisma.oAuthAccount.findUnique({
  where: {
    provider_providerId: {
      provider: getProviderFromFirebase(decodedToken),
      providerId: decodedToken.uid
    }
  },
  include: { user: true }
});

const user = oauthAccount?.user ?? null;
```

### 5.2 users/routes.ts

```typescript
// GET /api/users/me - 현재 사용자 조회
// 없으면 404 반환 (닉네임 등록 필요 신호)

// POST /api/users/register - 신규 사용자 등록
interface RegisterRequest {
  nickname: string;
  provider: 'google' | 'github' | 'kakao';
  providerId: string;
  email?: string;
}

// GET /api/users/check-nickname/:nickname - 닉네임 중복 체크
```

### 5.3 admin.service.ts

```typescript
async getUsers() {
  return prisma.user.findMany({
    include: {
      oauthAccounts: {
        select: {
          provider: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
```

### 5.4 submissions/routes.ts, c/routes.ts

```typescript
// 기존
userId: req.user!.dbUser!.id

// 새로운
userNickname: req.user!.dbUser!.nickname
```

---

## 6. Frontend 상세 변경

### 6.1 store.ts

```typescript
// 새 타입
interface AppUser {
  nickname: string;
  role: 'user' | 'admin';
  oauthAccounts: {
    provider: string;
    email?: string;
  }[];
}

interface Store {
  // 기존 user를 분리
  firebaseUser: FirebaseUser | null;  // Firebase 인증 상태
  appUser: AppUser | null;            // 우리 DB의 User
  needsRegistration: boolean;         // 닉네임 입력 필요 여부

  setFirebaseUser: (user: FirebaseUser | null) => void;
  setAppUser: (user: AppUser | null) => void;
  setNeedsRegistration: (needs: boolean) => void;
}
```

### 6.2 firebase.ts

```typescript
// 로그인 후 처리
onAuthChange(async (firebaseUser) => {
  setFirebaseUser(firebaseUser);

  if (!firebaseUser) {
    setAppUser(null);
    setNeedsRegistration(false);
    return;
  }

  try {
    const response = await api.get('/users/me');
    setAppUser(response.data);
    setNeedsRegistration(false);
  } catch (err) {
    if (err.status === 404) {
      setNeedsRegistration(true);
    }
  }
});

// 닉네임 등록
async function registerNickname(nickname: string) {
  const firebaseUser = getFirebaseUser();
  const response = await api.post('/users/register', {
    nickname,
    provider: 'google',
    providerId: firebaseUser.uid,
    email: firebaseUser.email
  });
  setAppUser(response.data);
  setNeedsRegistration(false);
}
```

### 6.3 닉네임 입력 컴포넌트 (새로 추가)

```typescript
// src/features/auth/NicknameRegistration.tsx
function NicknameRegistration() {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    // 1. 중복 체크
    // 2. 유효성 검사 (길이, 특수문자 등)
    // 3. 등록 API 호출
  }
}
```

---

## 7. 마이그레이션 전략

### 7.1 DB 마이그레이션

```sql
-- Step 1: OAuthAccount 테이블 생성
CREATE TABLE oauth_accounts (
  id TEXT PRIMARY KEY,
  user_nickname TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

-- Step 2: 기존 데이터 이전 (users.name을 nickname으로 사용)
INSERT INTO oauth_accounts (id, user_nickname, provider, provider_id, email)
SELECT
  lower(hex(randomblob(16))),
  name,
  'google',
  firebase_uid,
  email
FROM users;

-- Step 3: users 테이블 재구성
-- (Prisma migration이 처리)
```

### 7.2 기존 사용자 처리

- `name` 필드를 `nickname`으로 사용
- 중복되는 name이 있으면 숫자 suffix 추가 (예: `user`, `user_1`)
- `firebaseUid`는 `OAuthAccount.providerId`로 이전

---

## 8. 구현 순서

### Phase 1: Backend 기반 작업
1. [ ] Prisma 스키마 수정
2. [ ] 마이그레이션 실행
3. [ ] auth.ts 미들웨어 수정
4. [ ] users/routes.ts 수정

### Phase 2: Backend 나머지
5. [ ] admin.service.ts 수정
6. [ ] submissions/routes.ts 수정
7. [ ] c/routes.ts 수정
8. [ ] swagger.ts 수정

### Phase 3: Frontend 기반 작업
9. [ ] store.ts 타입 변경
10. [ ] firebase.ts 플로우 변경
11. [ ] NicknameRegistration 컴포넌트 생성

### Phase 4: Frontend UI
12. [ ] Sidebar.tsx 수정
13. [ ] UserMenu.tsx 수정
14. [ ] AdminRoute.tsx 수정
15. [ ] AdminPage.tsx 수정
16. [ ] PixelAvatar.tsx 수정

---

## 9. 닉네임 규칙

- **길이**: 2~20자
- **허용 문자**: 영문, 숫자, 한글, 언더스코어(_)
- **금지**: 공백, 특수문자, 욕설/비속어
- **대소문자**: 구분 없음 (저장 시 소문자 변환)
- **예약어**: admin, system, bot 등 금지

---

## 10. API 변경 사항

### 10.1 새 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/users/me` | 현재 사용자 조회 (404 = 미등록) |
| POST | `/api/users/register` | 닉네임으로 신규 등록 |
| GET | `/api/users/check-nickname/:nickname` | 닉네임 중복 체크 |

### 10.2 삭제 엔드포인트

| Method | Endpoint | 이유 |
|--------|----------|------|
| POST | `/api/users` (기존 자동 등록) | 닉네임 입력 필요로 변경 |

### 10.3 응답 형식 변경

```typescript
// 기존 User 응답
{
  id: "uuid",
  email: "user@example.com",
  name: "User Name",
  firebaseUid: "firebase-uid",
  role: "user"
}

// 새 User 응답
{
  nickname: "username",
  role: "user",
  createdAt: "2026-01-03T...",
  oauthAccounts: [
    { provider: "google", email: "user@gmail.com" },
    { provider: "github", email: "user@github.com" }
  ]
}
```

---

## 11. 참고 사항

### 11.1 Firebase Provider 판별

```typescript
function getProviderFromFirebase(decodedToken: DecodedIdToken): string {
  const providerId = decodedToken.firebase?.sign_in_provider;

  switch (providerId) {
    case 'google.com': return 'google';
    case 'github.com': return 'github';
    case 'oidc.kakao': return 'kakao';
    default: return 'google';
  }
}
```

### 11.2 동일 이메일 다른 Provider 처리

- 같은 이메일로 Google, GitHub 각각 가입 가능
- 두 OAuth 계정을 같은 User에 연결하는 "계정 연동" 기능은 Phase 2

### 11.3 롤백 계획

- 마이그레이션 전 DB 백업 필수
- 문제 발생 시 `prisma migrate rollback` 실행
- 기존 firebaseUid 데이터는 OAuthAccount로 보존되므로 복구 가능
