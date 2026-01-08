# AFDD 데이터 분석 계획서

**작성일**: 2026-01-08
**목적**: 팀장님께 제출할 AFDD 데이터 분석 프로젝트 계획

---

## 1. 현재 상황

### 1.1 보유 데이터

| 항목 | 값 | 비고 |
|------|-----|------|
| 기존 fault 레코드 | 59개 / 23일 | 평균 2.6건/일 |
| 주요 fault type | Type 3 (75%) | 44/59건 |
| **30샘플 파형 데이터** | ❌ 미수집 | 코드 수정 완료, 수집 시작 |

### 1.2 핵심 제약

| 제약 | 이유 | 대안 |
|------|------|------|
| **실제 아크 레이블 없음** | 대부분 테스트/실수/오류 | 비지도 학습 접근 |
| 30샘플 데이터 부족 | 수집 막 시작 | 2-4주 대기 필요 |
| trip_time 없음 | 트립 시 전원 차단 | IEC 62606 표준 참조 |

### 1.3 핵심 발견

```
30샘플 × 16.7ms = 500ms = IEC 62606 Table 3 측정 윈도우와 정확히 일치!
```

---

## 2. 분석 전략: 비지도 학습 (Unsupervised Learning)

### 왜 비지도 학습인가?

```
문제: "실제 아크" 레이블이 없다
      ↓
해결: 지도 학습(Classification) 대신 비지도 학습(Anomaly Detection)
      ↓
접근: "정상 패턴"을 학습 → "비정상" 탐지
```

### 접근 방식

| 단계 | 방법 | 목적 |
|------|------|------|
| 1 | 정상 데이터 학습 | 평상시 패턴 모델링 |
| 2 | 이상치 탐지 | 정상과 다른 패턴 식별 |
| 3 | 클러스터링 | 유사 패턴 그룹화 |
| 4 | 전문가 검토 | 클러스터별 의미 해석 |

---

## 3. 실행 계획

### Phase A: 대기 기간 (2-4주) - 기존 데이터 분석

**목표**: 30샘플 데이터 수집 동안 기존 데이터로 준비 작업

| 주차 | 작업 | 산출물 |
|------|------|--------|
| **Week 1** | EDA (탐색적 데이터 분석) | 통계 보고서, 시각화 |
| **Week 2** | Feature Engineering 설계 | Feature 목록, 추출 코드 |
| **Week 2** | 베이스라인 모델 구축 | Isolation Forest 프로토타입 |

#### Week 1: EDA

- [ ] 기존 59건 fault 데이터 분석
- [ ] faultType별 분포 분석
- [ ] 시간대별 발생 패턴
- [ ] devType (20A/32A) 비교

#### Week 2: Feature Engineering 설계

**시간 도메인**
- mean, std, max, min, rms
- crest_factor, skewness, kurtosis
- zero_crossing_rate

**주파수 도메인**
- FFT magnitude, dominant_freq
- spectral_centroid, spectral_bandwidth

**아크 특화 (H-I-W)**
- Hurst exponent
- Inter-harmonic variance
- Wavelet energy entropy

### Phase B: 본격 분석 (30샘플 데이터 수집 후)

**목표**: 30샘플 파형 데이터로 ML 모델 개발

| 주차 | 작업 | 산출물 |
|------|------|--------|
| **Week 3-4** | 파형 EDA + Feature 추출 | 파형 특성 보고서 |
| **Week 5** | 이상탐지 모델 실험 | 모델 비교 결과 |
| **Week 6** | 앙상블 + XAI | 최종 모델 + 설명 |

#### 이상탐지 모델 후보

| 모델 | 선정 이유 | 기대 성능 |
|------|----------|----------|
| **Isolation Forest** | 대용량 최적, 빠름 | AUC 우수 (논문 검증) |
| **LSTM-Autoencoder** | 시계열 패턴 학습 | 97% 이상탐지 |
| **Hybrid AE+IF** | AE feature + IF 탐지 | 0.99 accuracy |

#### 분류 모델 (레이블 확보 시)

| 모델 | 정확도 | 출처 |
|------|--------|------|
| 1D CNN + LSTM | 99.04% | SPIE 2022 |
| CNN + Transformer | 99.74% | PMC 2024 |

---

## 4. 기대 분석 주제

### 4.1 가능한 분석 (현재 데이터)

| 분석 | 방법 | 가치 |
|------|------|------|
| **아크 유형 추정** | irms+freq 패턴 | Series vs Parallel 구분 |
| **위험도 분류** | Arc count 조합 | IEC 62606 기준 적용 |
| **이상 패턴 탐지** | Anomaly Detection | 비정상 이벤트 식별 |
| **시간대 분석** | 발생 패턴 | 예방 정비 시점 추천 |

### 4.2 추가 분석 (데이터 확보 시)

| 분석 | 필요 데이터 | 가치 |
|------|------------|------|
| **초기 결함 감지** | pre-fault buffer | 사전 경고 |
| **트립 시간 예측** | trip_time | 성능 검증 |
| **에너지 기반 분류** | voltage 샘플 | 100J 기준 적용 |

---

## 5. IEC 62606 표준 활용

### 표 1: 직렬 아크 차단 시간 (230V)

| 전류 | 2.5A | 5A | 10A | 16A | 32A | 63A |
|------|------|-----|------|------|------|------|
| 최대 차단 시간 | 1s | 0.5s | 0.25s | 0.15s | 0.12s | 0.12s |

### 표 3: 병렬 아크 허용 반주기 (500ms 내)

| 전류 | 75A | 100A | 150A+ |
|------|-----|------|-------|
| 허용 반주기 | 12 | 10 | 8 |

**활용 방안**:
- 표 3 기준으로 위험도 분류
- 우리 30샘플 = 500ms → 표 3과 직접 비교 가능

---

## 6. 모델 선정 근거 (논문 기반)

### Isolation Forest

> "iForest compares favourably to all other methods in AUC and processing time, especially for large datasets where n > 1000."
> — [ACM TKDD 원본 논문](https://www.lamda.nju.edu.cn/publication/tkdd11.pdf)

### LSTM-Autoencoder

> "The key premise is that an LSTM autoencoder trained on normal time series data will encode such data efficiently. However, when anomalous data is fed, the decoder cannot reconstruct properly."
> — Medium (97% 성능, PMC 2024 검증)

### Hybrid AE+IF

> "0.99 accuracy on CIC IOT-DIAD 2024 dataset"
> — [ResearchGate 2024](https://www.researchgate.net/publication/398320825)

---

## 7. 도메인 지식 요약

### Series vs Parallel 아크

| 특성 | Series | Parallel |
|------|--------|----------|
| 전류 | 1-5A (낮음) | 50-100A+ (높음) |
| 감지 난이도 | 어려움 | 상대적 용이 |
| 원인 | 느슨한 연결, 부식 | 절연 파괴, 외부 충격 |

**출처**: [Lectromec](https://lectromec.com/understanding-series-and-parallel-arcing-for-aircraft-engineers/)

### 화재 통계

| 항목 | 수치 | 출처 |
|------|------|------|
| 아크 → 전기 화재 비율 | **82%** | arXiv 2024 |
| 위험 에너지 임계값 | **100 Joules** | Schneider Electric |

---

## 8. 체크리스트

### Phase A (대기 기간)

- [ ] 기존 데이터 EDA 완료
- [ ] Feature Engineering 설계
- [ ] Isolation Forest 프로토타입
- [ ] 30샘플 데이터 수집 모니터링

### Phase B (본격 분석)

- [ ] 파형 EDA
- [ ] Feature 추출
- [ ] 이상탐지 모델 비교
- [ ] 앙상블 구축
- [ ] XAI 분석 (SHAP)
- [ ] 최종 보고서

---

## 9. 참고 문서

| 문서 | 내용 |
|------|------|
| `EXPERIMENT_PLAN.md` | 상세 실험 계획 (모델, 논문 목록) |
| `IEC_62606_SUMMARY.md` | IEC 62606 표준 분석 |
| `MQTT_DATA_SCHEMA.md` | MQTT 메시지 구조 |
| `FIRMWARE_RESPONSE.md` | 펌웨어 제약사항 |

---

## 10. 주요 논문 링크

### 아크 감지
- [arXiv 2024](https://arxiv.org/html/2311.16804v2) - ⭐ 종합 리뷰
- [PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11511016/) - CNN-Transformer

### 이상탐지
- [ACM TKDD](https://www.lamda.nju.edu.cn/publication/tkdd11.pdf) - ⭐ Isolation Forest 원본
- [ResearchGate 2024](https://www.researchgate.net/publication/398320825) - Hybrid AE+IF

### Feature Engineering
- [Nature SR 2025](https://www.nature.com/articles/s41598-024-82025-2) - Wavelet
- [PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10856950/) - H-I-W Feature

---

*최종 수정: 2026-01-08*
