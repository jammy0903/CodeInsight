# CodeInsight 미래 계획

> 마지막 업데이트: 2026-01-12

---

## 🏗️ 아키텍처 확장 로드맵

### 현재 상태: Web-Queue-Worker 패턴 (MVP)

```
Frontend (React) → Backend (Express) → Docker (C Executor)
```

**특징**:
- 동기 실행 (요청-응답)
- Docker 샌드박스 격리
- 단일 서버 배포

**한계**:
- 동시 실행 제한 (~10 TPS)
- 긴 작업 시 타임아웃
- 수평 확장 어려움

---

### Phase 2: 비동기 처리 추가 (다음 단계)

#### 목표
- 높은 동시 처리량 (100+ TPS)
- 실시간 진행 상태 피드백
- 워커 풀 수평 확장

#### 기술 스택
```
Frontend (React)
    ↓ HTTP + WebSocket
Backend (Express + Socket.io)
    ↓ Job Queue
BullMQ (Redis)
    ↓ Worker Pool
C Executor Workers (Docker)
```

**추가할 것**:
- **Message Queue**: BullMQ + Redis
- **Worker Pool**: 코드 실행 전용 워커 (스케일 아웃)
- **WebSocket**: 실시간 진행 상태 (Socket.io)
- **Job 상태 관리**: Pending → Processing → Completed/Failed

**API 변경**:
```typescript
// 기존 (동기)
POST /api/c/run → { stdout, stderr, trace }

// 개선 (비동기)
POST /api/c/run → { jobId: "abc123" }
WS /ws/jobs/abc123 → { status: "processing", progress: 50% }
GET /api/jobs/abc123 → { status: "completed", result: {...} }
```

#### 예상 소요 기간
- Redis + BullMQ 설정: 2일
- Worker Pool 구현: 3일
- WebSocket 연동: 2일
- 테스트 + 배포: 2일
- **총**: 1-2주

#### 진입 조건
- DAU 50+ (동시 사용자 10+)
- 평균 응답 시간 > 5초
- 타임아웃 에러 빈발

#### 예상 비용 (월)
- Redis Cloud: $10 (1GB)
- Worker 서버 x2: $20 (DigitalOcean Droplet)
- **총**: ~$30/월

#### 참고 자료
- [BullMQ 공식 문서](https://docs.bullmq.io/)
- [분산 태스크 큐 설계](https://www.geeksforgeeks.org/system-design/distributed-task-queue-distributed-systems/)
- [Web-Queue-Worker 패턴](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/web-queue-worker)

---

### Phase 3: 마이크로서비스 전환 (성장 시)

#### 목표
- 도메인별 독립 배포
- 장애 격리 (서비스별)
- 팀별 개발 속도 향상

#### 기술 스택
```
API Gateway (Kong/Nginx)
    ├─→ executor-service (C 코드 실행)
    ├─→ simulator-service (메모리 시뮬레이션)
    ├─→ ai-service (AI 해설자)
    ├─→ course-service (코스 관리)
    └─→ user-service (사용자 관리)

Service Mesh (Istio)
Event Bus (Kafka)
```

**현재 모듈 → 독립 서비스 매핑**:
```
packages/backend/src/modules/
├── executors/c/     → executor-service
├── simulators/c/    → simulator-service
├── ai/              → ai-service
├── courses/         → course-service
└── users/           → user-service
```

**추가 기술**:
- **Service Discovery**: Consul/etcd
- **Service Mesh**: Istio (트래픽 관리, 보안)
- **Event Bus**: Apache Kafka (서비스 간 통신)
- **Config Management**: Spring Cloud Config / Consul KV
- **Monitoring**: Prometheus + Grafana

#### 예상 소요 기간
- 서비스 분리: 4주
- API Gateway 설정: 1주
- Service Mesh 구축: 2주
- 마이그레이션 + 테스트: 3주
- **총**: 2-3개월

#### 진입 조건
- DAU 500+ (동시 사용자 100+)
- 팀 크기 5+ 명
- 다중 언어 지원 필요 (Python, Java 추가)
- 장애 복구 시간 < 5분 요구

#### 예상 비용 (월)
- Kubernetes Cluster: $100 (AWS EKS/GKE)
- Load Balancer: $20
- Kafka Cluster: $50 (MSK/Confluent)
- Monitoring Stack: $30
- **총**: ~$200/월

#### 참고 자료
- [Microservices Pattern](https://microservices.io/patterns/microservices.html)
- [SonarQube Architecture](https://docs.sonarsource.com/sonarqube-server/design-and-architecture/overview)
- [Event-Driven Architecture](https://www.confluent.io/learn/event-driven-architecture/)

---

### Phase 4: 클라우드 네이티브 (글로벌 확장)

#### 목표
- 글로벌 배포 (Multi-region)
- 자동 스케일링 (HPA/VPA)
- 99.9% 가용성

#### 기술 스택
```
CDN (CloudFlare)
    ↓
Multi-region Kubernetes Clusters
    ├─→ Asia (Seoul, Tokyo)
    ├─→ US (Oregon, Virginia)
    └─→ EU (Frankfurt)

Container Registry (ECR/GCR)
Service Mesh (Istio + Linkerd)
Auto-scaling (Kubernetes HPA)
```

**추가 기술**:
- **Container Orchestration**: Kubernetes
- **CI/CD**: GitLab CI / GitHub Actions + ArgoCD
- **Serverless**: AWS Lambda (비용 최적화)
- **CDN**: CloudFlare (프론트엔드 캐싱)
- **Observability**: Datadog / New Relic
- **Disaster Recovery**: Multi-region 백업

#### 예상 소요 기간
- Kubernetes 구축: 4주
- Multi-region 배포: 3주
- CI/CD 파이프라인: 2주
- 모니터링 + 알람: 2주
- DR 구축: 2주
- **총**: 3-4개월

#### 진입 조건
- DAU 5,000+ (동시 사용자 1,000+)
- 글로벌 사용자 (다중 리전 필요)
- SLA 99.9% 요구
- 투자 유치 완료

#### 예상 비용 (월)
- Multi-region Kubernetes: $500
- CDN: $100 (CloudFlare Business)
- Database (RDS Multi-AZ): $200
- Monitoring: $100 (Datadog)
- Load Balancer + Networking: $100
- **총**: ~$1,000/월

#### 참고 자료
- [Kubernetes Architecture](https://www.datacamp.com/blog/kubernetes-architecture-explained)
- [Cloud Native Architecture](https://gegosoft.com/cloud-native-architecture/)
- [Docker Kanvas](https://www.infoq.com/news/2026/01/docker-kanvas-cloud-deployment/)

---

### 아키텍처 진화 요약

| Phase | 패턴 | TPS | DAU | 비용/월 | 기간 |
|-------|------|-----|-----|---------|------|
| **1** | Web-Queue-Worker | ~10 | 0-50 | $0 | ✅ 완료 |
| **2** | 비동기 처리 | ~100 | 50-500 | $30 | 1-2주 |
| **3** | 마이크로서비스 | ~1,000 | 500-5K | $200 | 2-3개월 |
| **4** | 클라우드 네이티브 | ~10,000 | 5K+ | $1,000 | 3-4개월 |

---

## 📱 모바일 앱 전환

### 추천: Capacitor (1순위)

**이유**:
- 기존 React 코드 100% 재사용
- 2-3주 내 iOS/Android 앱 출시 가능
- 단일 코드베이스로 웹/모바일 동시 유지보수

### 대안: PWA (2순위)

- 가장 빠른 배포 (1주 이내)
- iOS 제약 감수 가능하면 최선
- 앱 스토어 없이도 배포 가능

### 비추천: React Native

- 전체 코드 재작성 필요
- 개발 시간 3-6개월 추가

---

## Capacitor 적용 로드맵

### Phase 1: 준비 (1일)
- [ ] Capacitor, Ionic CLI 설치
- [ ] iOS/Android 개발 환경 설정

### Phase 2: 웹 앱 최적화 (3-5일)
- [ ] 반응형 디자인 점검
- [ ] 터치 이벤트 최적화
- [ ] 네비게이션 개선

### Phase 3: 네이티브 빌드 (2-3일)
- [ ] `npx cap init`
- [ ] iOS/Android 플랫폼 추가
- [ ] 앱 아이콘, 스플래시 이미지

### Phase 4: 네이티브 기능 (5-7일)
- [ ] 푸시 알림 (선택)
- [ ] 오프라인 저장 (선택)

### Phase 5: 배포 (3-5일)
- [ ] iOS App Store 심사
- [ ] Google Play Store 제출

**총 예상 기간**: 2-3주

---

## 진입 조건

- 웹 버전 안정화 완료
- DAU 100+ 달성
- 사용자 피드백에서 모바일 수요 확인

---

## 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/)
- [Ionic React 가이드](https://ionicframework.com/docs/react)
