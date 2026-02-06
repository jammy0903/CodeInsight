# 에러 핸들링 통합 가이드 (C-OSINE 프로젝트)

> **목적**: C-OSINE 프로젝트 프론트엔드/백엔드 일관된 에러 처리 전략

---

## 🎯 에러 핸들링 원칙

1.  **사용자 친화적**: 기술 용어 대신 명확한 메시지
2.  **디버깅 가능**: 로그에 스택 트레이스 + 문맥 정보
3.  **복구 가능**: 가능하면 자동 복구 (토큰 갱신 등)
4.  **일관성**: 모든 엔드포인트/컴포넌트에서 동일한 패턴

---

## 📊 에러 분류 체계

```
에러 분류
├── 클라이언트 에러 (4xx)
│   ├── 400 Bad Request: 입력 검증 실패
│   ├── 401 Unauthorized: 인증 실패
│   ├── 403 Forbidden: 권한 없음
│   └── 404 Not Found: 리소스 없음
│
└── 서버 에러 (5xx)
    ├── 500 Internal Server Error: 예상치 못한 에러
    ├── 502 Bad Gateway: 외부 서비스 응답 없음
    └── 503 Service Unavailable: 서비스 과부하
```

---

## 🔧 백엔드 에러 핸들링 (Node.js 예시)

### 1. 미들웨어 기반 처리

```javascript
// 예시: Fastify 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack); // 서버 로그
  if (err.isOperational) {
    return res.status(err.statusCode).json({ status: 'fail', message: err.message });
  }
  // 개발 모드에서는 자세한 에러, 프로덕션에서는 일반 에러
  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});
```

### 2. 예외 매핑 (예시)

| Node.js/JavaScript 예외 | HTTP 상태 | 사용 시나리오 |
|-------------------------|-----------|--------------|
| `AppError(400, msg)`     | 400       | 입력 유효성 실패, 잘못된 요청 |
| `AppError(401, msg)`     | 401       | 인증 토큰 없음/만료 |
| `AppError(403, msg)`     | 403       | 권한 없음 |
| `AppError(404, msg)`     | 404       | 리소스 없음 |
| `Error`                   | 500       | 예상치 못한 서버 에러 |

---

## 🌐 프론트엔드 에러 핸들링 (React 예시)

### 1. Axios Interceptor (자동 처리)

```javascript
// 예시: API 클라이언트 (packages/frontend/src/services/api_client.js)
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      // 토큰 갱신 로직 (refresh token API 호출)
      await authService.refreshToken();
      return apiClient(error.config); // 재시도
    }
    return Promise.reject(error);
  }
);
```

### 2. Context/State 레벨 에러 상태

```javascript
// 예시: GlobalErrorContext
const [globalError, setGlobalError] = useState(null);

// API 호출 등에서 에러 발생 시 setGlobalError 호출
```

### 3. 사용자 피드백

| 에러 타입 | 피드백 방식 | 예시 |
|-----------|-------------|------|
| **입력 검증** | Form 필드 하이라이트 | 빨간 테두리 + 메시지 |
| **네트워크** | Toast 알림 | "서버 연결 실패" |
| **권한** | Modal 경고 | "접근 권한이 없습니다" |
| **심각** | 전체 페이지 | Error Boundary |

---

## 🔔 중앙화된 Toast 알림 시스템 (Centralized Notifications)

### 핵심 원칙

1. **모든 에러 알림은 `components/common/Toast` 모듈을 통해 처리**
2. **재시도 로직 제거** - 에러 발생 시 즉시 사용자에게 알림
3. **카테고리별 알림 함수 분리** - AI, 시뮬레이터, 네트워크, 관리자

### 알림 모듈 구조

```typescript
// components/common/Toast/notifications.ts

// AI Provider 관련
export const notifyAI = {
  ollamaDisconnected: () => toast.error('Ollama 연결 끊김', { ... }),
  deepseekDisconnected: () => toast.error('DeepSeek 연결 끊김', { ... }),
  backendDisconnected: () => toast.error('백엔드 서버 연결 실패', { ... }),
  creditExhausted: () => toast.warning('API 크레딧 소진', { ... }),
};

// 시뮬레이터 관련
export const notifySimulator = {
  timeout: (lang) => toast.error(`${lang} 실행 시간 초과 (10초)`, { ... }),
  compileError: (lang, msg) => toast.error(`${lang} 컴파일 에러`, { ... }),
  runtimeError: (lang, msg) => toast.error(`${lang} 런타임 에러`, { ... }),
};

// 네트워크 관련
export const notifyNetwork = {
  connectionFailed: () => toast.error('네트워크 연결 실패', { ... }),
  serverError: (status) => toast.error(`서버 에러 (${status})`, { ... }),
};
```

### 사용 패턴

```typescript
// ❌ 잘못된 패턴 - 분산된 toast 호출
import { toast } from 'sonner';

try {
  await api.call();
} catch (e) {
  toast.error('에러가 발생했습니다');  // 일관성 없는 메시지
}

// ✅ 올바른 패턴 - 중앙화된 알림
import { notifyAI, handleSimulatorError } from '@/components/common/Toast';

try {
  await api.call();
} catch (e) {
  notifyAI.backendDisconnected();  // 일관된 메시지
}

// 시뮬레이터 에러 자동 분류
try {
  await simulatorService.simulate('python', { code });
} catch (e) {
  handleSimulatorError('Python', e.message);  // 에러 타입 자동 분류
}
```

### 에러 분류 헬퍼

```typescript
// handleSimulatorError - 에러 메시지 분석 후 적절한 토스트 호출
export function handleSimulatorError(language: string, errorMessage: string) {
  if (errorMessage.includes('Time Limit Exceeded')) {
    notifySimulator.timeout(language);
  } else if (errorMessage.includes('Compile Error') || errorMessage.includes('SyntaxError')) {
    notifySimulator.compileError(language, errorMessage);
  } else {
    notifySimulator.runtimeError(language, errorMessage);
  }
}

// handleAPIError - HTTP 상태 코드 기반 분류
export function handleAPIError(status: number, message?: string) {
  if (status === 402) {
    notifyAI.creditExhausted();
  } else if (status >= 500) {
    notifyNetwork.serverError(status);
  }
}
```

### 백엔드 에러 처리 원칙

**⚠️ 재시도(Retry) 로직 제거**:
- 시뮬레이터 디버거 클라이언트에서 재시도 로직 완전 제거
- 에러 발생 시 즉시 throw → 프론트엔드에서 Toast 표시
- 사용자에게 빠른 피드백 제공

```typescript
// ❌ 제거된 패턴 - 재시도 로직
for (let attempt = 0; attempt < 3; attempt++) {
  try { ... } catch (e) { if (attempt < 2) continue; }
}

// ✅ 현재 패턴 - 즉시 에러 반환
async run(projectPath: string): Promise<any[]> {
  // 에러 발생 시 즉시 throw
  return await this.execute(projectPath);
}
```

---

## 📚 참고 자료

- **Toast 모듈**: `packages/frontend/src/components/common/Toast/`
- **시뮬레이터 서비스**: `packages/frontend/src/services/simulator.ts`
- **AI 서비스**: `packages/frontend/src/services/ai.ts`
- **백엔드 디버거 클라이언트**: `packages/backend/src/modules/simulators/*/engine/debugger-client.ts`