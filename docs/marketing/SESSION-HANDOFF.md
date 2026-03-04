# Marketing Outreach Session Handoff

## 브랜치
`2026-03-03/marketing-outreach`

## 2026-03-03 추가 업데이트

- `docs/marketing/csta-post.md`를 단일 최종본(1안)으로 확정함
- CSTA 가입 시도 중 reCAPTCHA 반복 만료로 가입 완료 전 단계에서 중단됨
- 사용자 결정으로 CSTA 커뮤니티 가입/포스팅 작업은 당분간 보류

## 발송 현황 (총 395명, 전원 sent)

| 국가 | 발송 | ID 범위 |
|------|------|---------|
| US | 273명 | us-001 ~ us-273 |
| KR | 91명 | kr-001 ~ kr-091 |
| India | 31명 | in-001 ~ in-031 |
| **합계** | **395명** | 전원 발송 완료 |

## 주요 파일

| 파일 | 용도 |
|------|------|
| `docs/marketing/professor-outreach.json` | 교수 DB (395명, 개인화 hook 포함) |
| `scripts/send-outreach-email.mjs` | 이메일 발송 스크립트 (nodemailer) |
| `docs/marketing/email-template.md` | 이메일 템플릿 (EN/KR, 두괄식) |
| `docs/marketing/professor-search-guide.md` | 교수 탐색 가이드 (위임용) |
| `docs/marketing/csta-post.md` | CSTA 커뮤니티 포스팅 최종본 (1안 확정) |
| `docs/marketing/professor-outreach-list.csv` | 초기 CSV (JSON으로 대체됨) |

## 발송 방법

```bash
# 단일 발송
GMAIL_APP_PASSWORD="vvyp dezk ajkk vukn" node scripts/send-outreach-email.mjs <professor-id>

# 미리보기 (발송 안 함)
GMAIL_APP_PASSWORD="vvyp dezk ajkk vukn" node scripts/send-outreach-email.mjs <professor-id> --dry-run

# 대기 목록 확인
node scripts/send-outreach-email.mjs --list
```

- Gmail: `l89192164@gmail.com`
- 보내는 사람: `Sojeong Kim` (김소정)
- 한국어 이메일은 "김소정 드림"으로 서명

## 이메일 스타일 규칙

- 두괄식 (핵심 내용 먼저)
- "바쁘신 중에 읽어주셔서 감사합니다" 반드시 포함 (한국어)
- "Thank you for taking the time to read this." 포함 (영어)
- AI 서명 절대 금지 (Co-Authored-By, written by Claude 등)
- 과목명 + 대학명으로 개인화된 hook 메시지

## 남은 작업

### 1. CSTA 커뮤니티 포스팅 (현재 보류)
- 상태: 사용자 지시로 보류
- 포스트 본문은 `docs/marketing/csta-post.md` 최종본 사용
- 가입은 `https://my.csteachers.org/s/newuser?startURL=%2Fs%2F` 단계까지 시도했으나 완료하지 않음
- 재개 시: CSTA 가입 완료 → Grade Band 9-12 Discussion Thread 게시

### 2. 추가 커뮤니티 홍보 (미진행)
- Reddit r/CSEducation
- code.org 포럼
- 한국 정보교사 네이버 카페 / 정보교과연구회

### 3. 미국 교수 추가 탐색 가능
- 현재 커버: ~160개 대학
- `professor-search-guide.md` 참고해서 추가 배치 실행 가능
- 한국 교수는 더 이상 찾지 않음 (유저 지시)

### 4. 후속 메일 (Follow-up)
- 1주 후 미응답 교수에게 1회 follow-up 가능
- email-template.md의 Sending Pace 규칙 참고

## 커버된 미국 대학 목록 (160+개)

MIT, Harvard, Stanford, CMU, UC Berkeley, Cornell, UIUC, Georgia Tech,
UPenn, Johns Hopkins, Notre Dame, UC Irvine, UC Riverside, UCLA, UCSD,
UC Davis, UC Santa Barbara, UC Santa Cruz, Princeton, Yale, Columbia,
Brown, Duke, Rice, Northwestern, Vanderbilt, Dartmouth, Georgetown,
Caltech, Tufts, Boston College, Boston University, Northeastern, NYU,
Rutgers, Stony Brook, Penn State, Ohio State, Purdue, Indiana, Michigan,
Michigan State, Wisconsin-Madison, Wisconsin-Milwaukee, Minnesota,
Iowa, Iowa State, Notre Dame, UT Austin, UT Dallas, UT San Antonio,
Texas A&M, Baylor, TCU, SMU, Rice, Houston, NC State, UNC Chapel Hill,
UNC Charlotte, UNC Greensboro, Virginia Tech, UVA, Maryland, George Mason,
GWU, Georgetown, Howard, American, Villanova, Fordham, Seton Hall,
Xavier, Scranton, Saint Louis, Loyola Chicago, Loyola Maryland, DePaul,
IIT, Marquette, Creighton, Gonzaga, Seattle, Portland State, USF,
San Jose State, Santa Clara, San Diego, San Francisco, Pacific,
Chapman, USC, Drexel, RPI, RIT, WPI, Stevens, NJIT, Syracuse,
UMBC, Temple, Lehigh, Wake Forest, Emory, Tulane, Colorado, Colorado State,
Oregon, Washington, Florida, Florida State, UCF, FIU, Georgia State,
Alabama, Arkansas, Tennessee, South Carolina, Kentucky, Kansas,
Oklahoma, Nebraska, Missouri, Hawaii, New Hampshire, Maine, Delaware,
Rhode Island, Connecticut, Vermont, Montana, Wyoming, Alaska Fairbanks,
Idaho, North Dakota, South Dakota State, Nevada Las Vegas, Nevada Reno,
New Mexico State, Southern Mississippi, Northern Iowa, Weber State,
Utah State, Boise State, and more...

## Chrome DevTools
- 포트: 9222
- CSTA 가입/포스팅에 사용 예정이었으나 세션 종료
