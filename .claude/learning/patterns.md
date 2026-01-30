# CodeInsight 학습된 패턴들

이 파일은 프로젝트 작업 중 발견한 좋은 패턴들을 기록합니다.

---

## 🎯 프론트엔드 패턴

### 1. Zustand 비동기 액션 패턴

**문제**: 비동기 작업 중 로딩 상태 관리

**해결책**:
```typescript
const usePlaygroundStore = create<Store>((set) => ({
  isExecuting: false,
  steps: [],

  execute: async (code: string) => {
    set({ isExecuting: true });
    try {
      const result = await api.execute(code);
      set({ steps: result.steps });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isExecuting: false });
    }
  },
}));
```

**학습**: 항상 finally로 상태 정리하기

---

### 2. 에러 처리 중앙화

**문제**: 모든 컴포넌트에서 catch 블록 중복

**해결책**:
```typescript
// Toast.ts
export const handleSimulatorError = (language: string, error: Error) => {
  if (error.message.includes('timeout')) {
    notifySimulator.timeout(language);
  } else if (error.message.includes('invalid')) {
    notifySimulator.invalidCode(language);
  }
};

// 사용처
try {
  await executeCode(code);
} catch (error) {
  handleSimulatorError('C', error);
}
```

**학습**: 도메인별 에러 핸들러 만들기

---

### 3. 메모리 시각화 렌더링 최적화

**문제**: 10,000개 변수 렌더링 시 프레임 드롭

**해결책**:
```typescript
// ❌ Bad - 전부 렌더링
return variables.map(v => <Variable key={v.id} {...v} />);

// ✅ Good - 가상 스크롤
<VirtualScroller
  items={variables}
  itemHeight={40}
  overscan={5}
  renderItem={(v) => <Variable {...v} />}
/>
```

**학습**: 대량 리스트는 가상 스크롤 필수

---

### 4. 상태 변경 애니메이션

**패턴**: Framer Motion variants로 선언적 애니메이션

```typescript
const stepVariants = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 10 },
};

<motion.div
  variants={stepVariants}
  animate={isVisible ? "visible" : "hidden"}
  transition={{ duration: 0.3 }}
>
  Step {currentStep}
</motion.div>
```

**학습**: Hardcoded animation 절대 금지, variants 필수

---

## ⚙️ 백엔드 패턴

### 1. 서브프로세스 안전한 실행

**문제**: 시뮬레이터가 무한 루프에 빠질 수 있음

**해결책**:
```typescript
const executeSimulator = (
  language: string,
  code: string,
  timeout: number = 5000
): Promise<Result> => {
  return new Promise((resolve, reject) => {
    const child = spawn(simulatorCommand[language], [code]);

    const timer = setTimeout(() => {
      child.kill();
      reject(new SimulatorError('Timeout', 'TIMEOUT'));
    }, timeout);

    child.stdout.on('data', (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data));
    });

    child.stderr.on('data', (data) => {
      clearTimeout(timer);
      reject(new SimulatorError(data.toString(), 'EXECUTION_ERROR'));
    });
  });
};
```

**학습**: 항상 타임아웃 설정, 리소스 정리 필수

---

### 2. 입력 검증 레이어

**패턴**: Zod로 런타임 타입 검증

```typescript
const executeSchema = z.object({
  code: z.string().max(10000, 'Code too long'),
  language: z.enum(['c', 'python', 'js', 'java']),
  breakpoints: z.array(z.number()).optional(),
});

app.post('/execute', (req, res) => {
  const result = executeSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const { code, language } = result.data;
  // ...
});
```

**학습**: Trust nothing, validate everything

---

### 3. 에러 분류 및 응답

**패턴**: 커스텀 에러 클래스로 일관된 응답

```typescript
class SimulatorError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

const errorHandler = (error: Error, res: Response) => {
  if (error instanceof SimulatorError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  });
};
```

**학습**: 에러 코드로 클라이언트 처리 명시화

---

### 4. 데이터베이스 쿼리 최적화

**발견**: Lesson 조회 시 N+1 문제

**해결책**:
```typescript
// ❌ Bad
const lessons = await prisma.lesson.findMany();
for (const lesson of lessons) {
  lesson.creator = await prisma.user.findUnique({
    where: { id: lesson.creatorId }
  });
}

// ✅ Good
const lessons = await prisma.lesson.findMany({
  include: { creator: true },
});
```

**학습**: include 사용하여 한 번의 쿼리로 처리

---

## 🔄 운영 패턴

### 1. 에러 모니터링

**패턴**: 모든 에러를 분류하여 기록

```typescript
type ErrorCategory =
  | 'VALIDATION'
  | 'SIMULATOR'
  | 'DATABASE'
  | 'EXTERNAL'
  | 'UNKNOWN';

const categorizeError = (error: Error): ErrorCategory => {
  if (error instanceof ValidationError) return 'VALIDATION';
  if (error instanceof SimulatorError) return 'SIMULATOR';
  // ...
};
```

**학습**: 에러 분류로 문제 추적 용이

---

### 2. 성능 프로파일링

**발견**: 메모리 시각화가 가장 느림 (200ms)

**최적화**:
- 가상 스크롤 적용 → 50ms
- JSON 직렬화 최적화 → 20ms

**학습**: 측정 먼저, 추측하지 말기

---

### 3. 배포 전 체크리스트

**규칙**:
```
- [ ] 모든 테스트 통과
- [ ] 번들 크기 확인
- [ ] 환경 변수 설정
- [ ] DB 마이그레이션 실행
- [ ] 모니터링 설정
- [ ] 롤백 계획 수립
```

**학습**: 자동화 가능한 것은 CI/CD로

---

## 📚 자주 하는 실수

### 1. ❌ Props Drilling
```typescript
// Bad
<Parent userId={userId}>
  <Child userId={userId}>
    <GrandChild userId={userId} />
  </Child>
</Parent>

// Good
const useUserId = () => usePlaygroundStore((s) => s.userId);
<GrandChild />  // 내부에서 hook 사용
```

---

### 2. ❌ 무한 루프 useEffect
```typescript
// Bad
useEffect(() => {
  setData(fetchData());  // setData가 의존성 없음
});

// Good
useEffect(() => {
  fetchData().then(setData);
}, []);  // 빈 배열 = 한 번만 실행
```

---

### 3. ❌ 메모리 누수
```typescript
// Bad
useEffect(() => {
  api.subscribe(onMessage);
  // cleanup 없음
});

// Good
useEffect(() => {
  const unsubscribe = api.subscribe(onMessage);
  return () => unsubscribe();
}, []);
```

---

## 🎓 다음 학습 대상

- [ ] React Query로 상태 관리 개선
- [ ] WebSocket 실시간 협업
- [ ] 고급 시뮬레이터 최적화
- [ ] 모바일 앱 개발
