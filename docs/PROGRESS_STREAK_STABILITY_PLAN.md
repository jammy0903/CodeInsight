# Progress/Streak Stability Plan

## 목표

- 코드 업데이트/배포/운영 스크립트 실행 시 사용자 `progress`와 `streak`가 의도치 않게 변하지 않도록 보호한다.
- "표시값 계산 변화"와 "DB 실데이터 변경"을 분리해 관리한다.

## 현재 리스크 요약

1. 표시값 리스크
- `checkStreakStatus()`는 `lastActiveAt`이 오늘/어제가 아니면 응답 `currentStreak`를 0으로 계산해 반환한다.
- DB `current_streak`와 API 응답값이 다를 수 있다.

2. 실데이터 리스크
- 레슨 완료 흐름에서 `updateStreak()`가 `user_streaks`를 갱신한다.
- 운영 스크립트(`restore-user-data.ts`, `mark-admin-complete.ts` 등)는 `userProgress`/`userStreak`를 upsert로 덮어쓸 수 있다.
- 잘못된 실행 순서/환경에서 사용자 데이터가 의도치 않게 변할 수 있다.

## 원칙

1. 사용자 데이터 보호 우선
- `user_progress`, `user_streaks`는 "운영 승인 없는 직접 변경 금지"를 기본 정책으로 둔다.

2. 계산 로직 변경과 저장 로직 변경 분리
- UI/API 표시 계산 변경은 별도 PR.
- DB write 경로 변경은 별도 PR + 백업/검증 필수.

3. 스크립트는 기본 Dry-run
- 파괴/덮어쓰기 가능성이 있는 스크립트는 `--apply` 없으면 실행되지 않게 강제한다.

## 실행 계획

### Phase 1. 변경 경로 식별/잠금 — DONE (2026-02)

1. ~~Write 경로 인벤토리 문서화~~ — 감사 완료
- `updateStreak`: 레슨 완료 시 courses/service.ts에서 호출
- `restore-user-data.ts`: 백업 JSON에서 복원 (--apply 가드 추가됨)
- `mark-admin-complete.ts`: 어드민 전체 레슨 완료 (--apply 가드 추가됨)
- `clear-users.ts`: 전체 사용자 데이터 삭제 (--apply 가드 추가됨)
- `complete-all-lessons.ts`: 특정 유저 전체 완료 (--apply 가드 추가됨)
- `resetStreak`: 삭제됨 (dead code)
- `POST /streak/update`: 삭제됨 (보안 위험 — 아무 유저나 streak 조작 가능)

2. ~~운영 스크립트 보호장치~~ — 4개 스크립트 모두 --apply 가드 적용 완료
- `restore-user-data.ts` ✅
- `mark-admin-complete.ts` ✅
- `clear-users.ts` ✅
- `complete-all-lessons.ts` ✅

3. 위험 명령 실행 기준
- 배포 파이프라인/런북에 "사용자 데이터 변경 스크립트 금지 목록" 명시

### Phase 2. 배포 전후 검증 체계 — TODO

1. 사전 스냅샷
- 배포 전 집계 저장:
  - `count(user_progress)`
  - `count(user_streaks)`
  - `status별 progress 분포`
  - `current_streak 분포`

2. 사후 비교
- 배포 후 동일 지표 비교:
  - 허용 편차 임계치 초과 시 알림/롤백 판단

3. 자동화
- `scripts/check-progress-streak-drift.sh` 작성:
  - pre/post 스냅샷 비교
  - diff 리포트 생성

### Phase 3. 로직 개선 — PARTIAL

1. ~~streak 응답 정책 명확화~~ ✅
- `streak.service.ts` 파일 헤더에 API 응답 계약 문서화 완료
- 계산값(API) vs 저장값(DB) 차이, 지연 리셋 설계 의도 명시
- `storedCurrentStreak`/`effectiveCurrentStreak` 필드 분리는 보류 (현재 불필요)

2. progress 저장 시점 개선(선택) — TODO
- 현재 완료 시점 중심 저장에서 확장 검토:
  - 레슨 시작 시 `in_progress`
  - 스텝 변경 시 `currentStep`(디바운스)
  - 완료 시 `completed`
- 단, `completed` 상태 역전 방지 가드 서버에 추가.

## 운영 체크리스트

배포 전:
1. 사용자 데이터 변경 스크립트 실행 계획 확인
2. pre 스냅샷 저장
3. 변경 PR에 write 경로 포함 여부 확인

배포 후:
1. post 스냅샷 수집
2. drift 리포트 확인
3. 이상치 발생 시 원인 경로 추적

## 즉시 할 일 — 완료 현황

1. ~~`restore-user-data.ts` / `mark-admin-complete.ts`에 `--apply` 가드 추가~~ ✅
2. pre/post drift 체크 스크립트 추가 — TODO (Phase 2)
3. ~~streak API 응답 계약 문서화 (계산값 vs 저장값)~~ ✅
4. 운영 런북에 "사용자 데이터 보호 규칙" 섹션 추가 — TODO
