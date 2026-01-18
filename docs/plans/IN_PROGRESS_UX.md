# 진행 중: UX & 시각화

> **마지막 업데이트**: 2026-01-18
> **포함 계획**: 게이미피케이션, Flow Visualizer, 모바일 최적화

---

## 목차

1. [게이미피케이션 & 모바일](#1-게이미피케이션--모바일)
2. [Flow Visualizer](#2-flow-visualizer)

---

## 1. 게이미피케이션 & 모바일

> **목표**: Mimo처럼 가볍게, CodeInsight처럼 깊이있게
> **예상 기간**: 7주

### 1.1 Phase 1: 퀵윈 (1주)

**스트릭 시스템**
- UserStreak 스키마 + UI
- 연속 학습일 추적
- 스트릭 깨짐 알림

**5분 학습 브랜딩**
- estimatedMinutes 필드 추가
- "오늘 5분만!" 메시지

**기본 배지 6개**
```
🔰 첫 발걸음    - 첫 레슨 완료
🌟 별이 빛나는  - 퀴즈 5연속 정답
🔥 불꽃 학습    - 7일 연속 학습
🎯 완벽주의자   - 챕터 100% 완료
💡 호기심 천국  - AI에게 10번 질문
🚀 로켓 스타터  - 첫 주 5개 레슨 완료
```

### 1.2 Phase 2: 동기부여 (2주)

**XP/레벨 시스템**
```typescript
interface UserXP {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
}

// XP 획득 규칙
레슨 완료: 50 XP
퀴즈 정답: 10 XP
연속 학습: 20 XP × 연속일
```

**배지 확장 (+10개)**
- 언어별 마스터 배지
- 희귀 배지 (100일 연속 등)

**프로필 페이지 리디자인**
- 배지 컬렉션
- XP 그래프
- 성취 타임라인

### 1.3 Phase 3: 모바일 (2주)

**PWA 강화**
- manifest.json 완성
- Service Worker 설치
- 홈 화면 추가 유도

**오프라인 캐싱 (Workbox)**
```javascript
// 캐시 전략
레슨 콘텐츠: StaleWhileRevalidate
정적 리소스: CacheFirst
API 응답: NetworkFirst
```

**푸시 알림 (Web Push + FCM)**
- 학습 리마인더
- 스트릭 위험 알림
- 새 레슨 알림

### 1.4 Phase 4: 소셜 (2주, 선택)

**주간 리더보드**
- 익명 옵션
- XP 기준 순위
- 친구 그룹 별도

**친구 시스템**
- 친구 추가/삭제
- 친구 진도 보기
- 함께 학습 초대

### 1.5 DB 스키마

```prisma
model UserStreak {
  id            String    @id @default(uuid())
  userId        String    @unique @map("user_id")
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)
  lastActiveAt  DateTime? @map("last_active_at")
  user          User      @relation(...)
  @@map("user_streaks")
}

model Badge {
  id          String   @id
  name        String
  description String
  icon        String
  condition   Json     // 획득 조건
  rarity      String   // common, rare, epic, legendary
  users       UserBadge[]
  @@map("badges")
}

model UserXP {
  id        String   @id @default(uuid())
  userId    String   @unique
  totalXP   Int      @default(0)
  level     Int      @default(1)
  logs      XPLog[]
  @@map("user_xp")
}

model XPLog {
  id        String   @id @default(uuid())
  userId    String
  amount    Int
  reason    String   // lesson_complete, quiz_correct, streak_bonus
  createdAt DateTime @default(now())
  @@map("xp_logs")
}
```

---

## 2. Flow Visualizer

> **목표**: 코드가 살아 움직이는 시각화 (언어 공통)
> **예상 기간**: 6주

### 2.1 핵심 컨셉

| 구문 | 애니메이션 |
|------|-----------|
| 변수 선언 | 박스가 팝! 생김 |
| 값 할당 | 값이 쏙 들어감 |
| printf | 값이 터미널로 날아감 |
| if/else | 변수가 분기점에서 길 선택 |
| for/while | 트랙 위 빙글빙글 + 카운터 |
| 함수 호출 | 새 공간 생성 → 끝나면 사라짐 |

### 2.2 아키텍처

```
SimulatorStep (기존)
      ↓
FlowAdapter (언어별 변환)
      ↓
FlowEvent (표준 이벤트)
      ↓
FlowVisualizer (렌더링)
```

**FlowEvent 타입**:
```typescript
type FlowEvent =
  | { type: 'variable_create'; name: string; value: any; }
  | { type: 'variable_update'; name: string; oldValue: any; newValue: any; }
  | { type: 'output'; target: 'terminal' | 'return'; value: string; }
  | { type: 'branch'; condition: string; result: boolean; }
  | { type: 'loop_start'; type: 'for' | 'while'; }
  | { type: 'loop_iteration'; counter: number; }
  | { type: 'function_call'; name: string; args: any[]; }
  | { type: 'function_return'; value: any; }
```

### 2.3 구현 Phase

**Phase 1: 기반 (1주)**
- [ ] FlowVisualizer 컴포넌트
- [ ] VariableBox (변수 박스)
- [ ] 기본 애니메이션 (Framer Motion)

**Phase 2: C언어 (1주)**
- [ ] CFlowAdapter
- [ ] 변수 선언/할당 시각화
- [ ] printf → Terminal 애니메이션
- [ ] 포인터 화살표

**Phase 3: 제어 흐름 (1주)**
- [ ] if/else 분기 시각화
- [ ] for/while 루프 트랙
- [ ] 함수 호출/반환 프레임

**Phase 4: 다른 언어 (2주)**
- [ ] PythonFlowAdapter (참조 모델)
- [ ] JavaFlowAdapter (원시/참조 구분)

**Phase 5: 통합 (1주)**
- [ ] 기존 메모리 뷰어와 탭 전환
- [ ] LessonPage/Playground 연동

### 2.4 컴포넌트 구조

```
features/visualizers/flow/
├── index.tsx
├── FlowVisualizer.tsx        # 메인 컨테이너
├── components/
│   ├── VariableBox.tsx       # 변수 박스
│   ├── FlowArrow.tsx         # 연결선/화살표
│   ├── TerminalOutput.tsx    # 출력 영역
│   ├── BranchNode.tsx        # if/else 분기점
│   ├── LoopTrack.tsx         # 루프 트랙
│   └── FunctionFrame.tsx     # 함수 프레임
├── adapters/
│   ├── CFlowAdapter.ts
│   ├── PythonFlowAdapter.ts
│   └── JavaFlowAdapter.ts
├── hooks/
│   ├── useFlowAnimation.ts
│   └── useFlowEvents.ts
└── types.ts
```

### 2.5 애니메이션 설정

```typescript
const ANIMATION_CONFIG = {
  variable: {
    create: { duration: 0.3, ease: "backOut" },
    update: { duration: 0.2, ease: "easeOut" },
  },
  arrow: {
    draw: { duration: 0.5, ease: "easeInOut" },
  },
  output: {
    fly: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
  branch: {
    highlight: { duration: 0.4 },
  },
  loop: {
    rotation: { duration: 0.3 },
  }
};
```

---

## 참고 문서

- `docs/plans/refactoring/3-theme-css-variables.md` - 테마 CSS 변수 (진행 중)
- `docs/plans/FLOW_VISUALIZER_DESIGN_V2.md` - Flow Visualizer 상세 설계

---

*마지막 업데이트: 2026-01-18*
