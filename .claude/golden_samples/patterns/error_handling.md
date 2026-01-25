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
// 예시: Express.js 에러 처리 미들웨어
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

## 📚 참고 자료

- 백엔드 에러 핸들러: `C-OSINE/packages/backend/src/api/error_handlers.js` (예시)
- 프론트엔드 API 클라이언트: `C-OSINE/packages/frontend/src/services/api_client.js` (예시)