# ch2-api-client-debug-lab

Shared file set for `ai-2-1` ~ `ai-2-6`.

## Goal
Train practical debugging workflow in one evolving codebase:
- reproduce failure
- isolate cause
- apply minimal patch
- verify + add regression test

## Files
- `src/apiClient.ts` - fetch wrapper and retry logic
- `src/mapper.ts` - response mapping logic (intentional bug)
- `tests/apiClient.test.ts` - regression test skeleton

## Versioning model
- `base + patch chain` 방식으로 운영
- 모든 레슨은 전체 파일 복사본 대신 스냅샷 참조 + 패치로 표현
- 기준 메타: `manifest.json`

### Snapshot layout
- `snapshots/base` : 챕터 시작 상태 (buggy)
- `snapshots/ai-2-1-fixed` : ai-2-1 패치 적용 후 상태
- `snapshots/ai-2-2-fixed` : legacy text fallback 보강
- `snapshots/ai-2-3-fixed` : 누락 응답 fail-fast 예외 처리
- `snapshots/ai-2-4-fixed` : 재시도 조건 수정(4xx 제외)
- `snapshots/ai-2-5-fixed` : retries 입력 정규화
- `snapshots/ai-2-6-fixed` : 회귀 테스트 확장 완료
- `patches/ai-2-1.patch` ~ `patches/ai-2-6.patch` : 레슨별 최소 변경 기록

## Intentional issues (for lessons)
1. outdated path access (`choices[0].text`)
2. missing null guard
3. over-broad retry condition
