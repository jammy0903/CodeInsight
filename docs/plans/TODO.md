# CodeInsight TODO

> 마지막 업데이트: 2026-01-02
> 상태: DayPage 완료, 배포 준비 중

---

## 현재 진행 중

### 1. Admin Provider Toggle (Phase 3)

> axios 인프라는 완료됨 (Phase 1-2 ✅)

| 작업 | 상태 | 파일 |
|------|------|------|
| `AIProviderToggle.tsx` 생성 | ⏳ | `features/admin/components/` |
| AdminPage axios 마이그레이션 | ⏳ | `features/admin/AdminPage.tsx` |
| 백엔드 `/api/ai/providers` | ✅ | `backend/modules/ai/routes.ts` |
| 백엔드 `/api/ai/providers/switch` | ✅ | `backend/modules/ai/routes.ts` |

**참고 코드** (구현 예시):
```typescript
// AIProviderToggle.tsx
import { getProviderStatus, setProvider } from '@/services/admin';

export function AIProviderToggle() {
  // status.available.map으로 버튼 렌더링
  // onClick -> setProvider(provider) 호출
}
```

---

### 2. 배포 (Phase 4)

| 작업 | 상태 | 비고 |
|------|------|------|
| Docker 구조 완성 | ✅ | `docker-compose.yml`, Dockerfiles |
| Caddyfile 설정 | ✅ | 로컬 테스트용 `localhost` |
| `.env.production` | ⏳ | 실제 값 설정 필요 |
| 도메인 설정 | ⏳ | Caddyfile 도메인 변경 |
| 배포 테스트 | ⏳ | `docker compose up --build` |

**배포 명령어:**
```bash
# 로컬 테스트
docker compose up --build

# 프로덕션
docker compose up -d --build
```

**가이드**: `docs/setup/260102_deployment_guide.md`

---

## 완료된 항목

### DayPage (Phase 1) ✅
- 라우팅 `/courses/:lang/:day`
- 코드 뷰어 + 라인 하이라이팅
- 메모리 시각화 (Stack/Heap)
- 스텝 네비게이션
- 퀴즈 모달
- Day 완료 → 다음 Day 이동
- C 코스 Day 1-20

### Axios 인프라 (Phase 1-2) ✅
- `services/api/axios.ts` - 인스턴스 + 인터셉터
- `services/api/errors.ts` - 사용자 친화적 에러
- `services/ai.ts`, `crunner.ts`, `tracer.ts` 마이그레이션
- `services/admin.ts` 생성

### Docker 구조 ✅
- `docker-compose.yml` (프로덕션)
- `frontend/Dockerfile` (멀티스테이지 빌드)
- `backend/Dockerfile` (자동 빌드)
- `Caddyfile` (리버스 프록시)
- `start-dev.sh` (개발용)

---

## 연기된 계획

| 계획 | 진입 조건 | 문서 |
|------|----------|------|
| Chapter 구조 | DAU 50+ | `deferred/260101_chapter_based_restructure.md` |
| Progress DB | DAU 100+ | `deferred/260101_progress_tracking.md` |

---

## 문서 구조

```
docs/plans/
├── TODO.md                    # 이 파일 (현재 할 일)
├── completed/                 # 완료된 계획
│   ├── 17_new_direction_mvp.md
│   └── 260101_ceo_roadmap.md
└── deferred/                  # 연기된 계획
    ├── 260101_chapter_based_restructure.md
    └── 260101_progress_tracking.md

docs/setup/
├── 260102_deployment_guide.md # 배포 가이드
├── MCP_QUICKSTART.md          # MCP 설정
└── DOCKER.md (root)           # Docker 사용법
```

---

## 우선순위

```
1. 🔴 AdminPage Provider Toggle 완성
2. 🟡 배포 테스트 (로컬 Docker)
3. 🟢 실제 배포 (도메인 설정)
4. ⚪ 사용자 테스트 (5명)
```
