# 성능 최적화 체크리스트 (C-OSINE 프로젝트)

> **목적**: C-OSINE 프로젝트 전반의 성능 최적화 기법 통합

---

## 🎯 성능 목표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **초기 로드 시간 (FCP)** | < 1.5초 | Lighthouse, WebPageTest |
| **API 응답 시간** | < 100ms (P95) | 백엔드 모니터링 툴 |
| **데이터베이스 쿼리** | < 30ms (평균) | DB 쿼리 로그, APM 툴 |
| **메모리 사용량** | < 임계점 | Node.js Heap Snapshot, 브라우저 개발자 도구 |
| **캐시 히트율** | > 90% | 캐시 모니터링 |

---

## 🚀 프론트엔드 최적화 (React/Vite 예시)

### 1. 번들 크기 최적화

```javascript
// vite.config.js (예시)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material'],
          // ... 기타 청크 분할
        },
      },
    },
  },
});
```

**목표**: 메인 번들 < 500KB (gzip)

### 2. 코드 스플리팅

```javascript
// React.lazy와 Suspense를 사용한 동적 임포트
import React, { lazy, Suspense } from 'react';
import LoadingSpinner from './components/common/LoadingSpinner';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* <Route path="/dashboard" component={DashboardPage} /> */}
    </Suspense>
  );
}
```

### 3. 메모이제이션

```javascript
// useMemo, useCallback, React.memo 활용
import React, { useMemo, useCallback, memo } from 'react';

const ExpensiveCalculation = useMemo(() => { /* ... */ }, [dependencies]);
const StableFunction = useCallback(() => { /* ... */ }, [dependencies]);
const MemoizedComponent = memo(({ props }) => { /* ... */ });
```

### 4. 가상화 (Virtualization)

- 대량의 리스트 데이터를 효율적으로 렌더링하기 위해 `react-window` 또는 `react-virtualized` 같은 라이브러리 사용을 고려합니다.

### 5. 이미지/미디어 최적화

- WebP/AVIF 같은 최신 이미지 포맷 사용
- `loading="lazy"` 속성으로 지연 로딩
- 이미지 CDN 활용
- 비디오 자동 재생 방지 및 스트리밍 최적화

---

## ⚡ 백엔드 최적화 (Node.js/Express.js 예시)

### 1. N+1 문제 방지 (ORM 활용)

- Sequelize, TypeORM, Prisma 등 ORM의 Eager Loading 기능을 활용하여 불필요한 쿼리 감소.

```javascript
// 예시: Sequelize (include 사용)
User.findAll({
  include: [{
    model: Post,
    as: 'posts'
  }]
});
```

### 2. 비동기/병렬 처리

- `async/await` 및 `Promise.all`을 사용하여 독립적인 I/O 작업을 병렬로 실행.

```javascript
// 예시: 두 개의 독립적인 API 호출 병렬 처리
async function fetchData() {
  const [users, products] = await Promise.all([
    userService.getAllUsers(),
    productService.getAllProducts()
  ]);
  return { users, products };
}
```

### 3. 인덱스 최적화

- 데이터베이스 스키마 설계 시 조회 쿼리에 맞춰 적절한 인덱스(단일, 복합, 전문 검색)를 생성.
- `EXPLAIN ANALYZE` (PostgreSQL) 또는 `EXPLAIN` (MySQL)로 쿼리 실행 계획 분석.

### 4. 캐싱 계층

- Redis, Memcached 등의 인메모리 데이터 저장소를 활용하여 자주 접근하는 데이터 캐싱.
- HTTP 캐시 헤더 (Cache-Control, ETag)를 사용하여 클라이언트/프록시 캐싱 활성화.

### 5. 응답 압축

- `compression` 미들웨어를 사용하여 HTTP 응답 데이터 압축 (gzip, Brotli).

```javascript
// 예시: Express.js compression 미들웨어
const compression = require('compression');
app.use(compression());
```

---

## 💾 데이터베이스 최적화

### 1. 쿼리 최적화

- `SELECT *` 대신 필요한 컬럼만 선택
- 서브쿼리보다는 JOIN 활용
- `LIMIT`와 `OFFSET`을 사용한 페이지네이션 최적화
- `GROUP BY` 및 `ORDER BY` 절에 인덱스 활용

### 2. 배치 처리

- 대량 데이터 삽입/업데이트 시 개별 작업 대신 벌크 인서트(bulk insert) 또는 배치 업데이트(batch update) 사용.

### 3. 연결 풀링 (Connection Pooling)

- 데이터베이스 연결 풀을 적절히 설정하여 연결 생성/종료 오버헤드 감소.

---

## 📊 모니터링 및 프로파일링

### 1. 프론트엔드 성능 측정

- Google Lighthouse, WebPageTest 등으로 Core Web Vitals (LCP, FID, CLS) 모니터링.
- React DevTools Profiler, Vue DevTools 등으로 컴포넌트 렌더링 성능 분석.
- 브라우저 개발자 도구의 Performance 탭 활용.

### 2. 백엔드 성능 로깅

- API 응답 시간, DB 쿼리 시간, CPU/메모리 사용량 등을 로깅하고 모니터링.
- APM(Application Performance Management) 툴 (예: New Relic, Datadog) 활용.
- 슬로우 쿼리 로그 설정 및 분석.

---

## 📈 최적화 우선순위

1.  **측정 (Measure)**: 실제 병목 지점 파악
2.  **캐싱 (Cache)**: 가장 큰 효과
3.  **쿼리 최적화 (Query)**: N+1 방지, 인덱스 추가
4.  **코드 최적화 (Code)**: 메모이제이션, 비동기
5.  **인프라 (Infrastructure)**: CPU/메모리 증설 (마지막 수단)

---

## 📚 참고 자료

- `C-OSINE/.gemini/golden_samples/patterns/cache_strategy.md`
- `C-OSINE/.gemini/golden_samples/patterns/error_handling.md`
- 프로젝트 내부 코드 샘플: `C-OSINE/.gemini/golden_samples/`