# AFDD 데이터 분석 프로젝트

**프로젝트 목표**: 아크 차단기(AFDD) fault 데이터 분석 및 AI 모델 개발

---

## 📂 파일 구조

| 파일 | 설명 |
|------|------|
| **README.md** | 이 파일 - 프로젝트 개요 |
| **IEC_62606_SUMMARY.md** | ⭐ IEC 62606 표준 테이블 & 위험도 분류 기준 |
| **FIRMWARE_RESPONSE.md** | 펌웨어 개발자 답장 & 실행 계획 |
| **AFDD_EMAIL_REFERENCES.md** | 학술 논문/표준 레퍼런스 |
| **STARARC_PRODUCT_SPEC.md** | StarARC 제품 카탈로그 분석 |
| ~~FIRMWARE_DATA_REQUEST_EMAIL.md~~ | 삭제됨 (답장 받음) |

---

## 🚀 빠른 시작

### 1️⃣ 데이터 추출 및 EDA

```bash
cd /home/jammy/projects/iot_v3_svn/data_analysis

# 데이터 추출
python scripts/extract_fault_data.py

# 기초 통계
python 01_basic_statistics.py

# 파형 분석
python 02_waveform_analysis.py
```

### 2️⃣ Feature 추출

```bash
python 03_feature_extraction.py
python 04_feature_importance.py
```

### 3️⃣ 모델 학습

```bash
python 06_arc_type_classifier.py    # Series vs Parallel
python 07_risk_classifier.py        # 위험도 분류
```

---

## 📊 데이터 현황

### 사용 가능한 데이터 (F_MSG 테이블)

```python
{
    "devType": 32,               # ✅ 20A or 32A Frame
    "irms": "0,0,1.2,...",       # ✅ 30개 샘플, 16.7ms 간격 = 500ms ⭐
    "freq": "60,59.8,...",       # ✅ 30개 샘플, 16.7ms 간격 = 500ms ⭐
    "irmsAmpere": 5,             # ✅ RMS 전류값
    "freqArcCnt": 3,             # ✅ 주파수 기반 아크 횟수
    "irmsArcCnt": 2,             # ✅ 전류 기반 아크 횟수
    "carbonArcCnt": 0,           # ✅ 탄화 아크 횟수
}
```

> **⭐ 핵심 발견**: 30샘플 × 16.7ms = **500ms** = IEC 62606 Table 3 측정 윈도우와 정확히 일치!

### 수집 불가능한 데이터

| 항목 | 이유 |
|------|------|
| `trip_time_ms` | 트립 시 전원 차단 |
| `voltage` 샘플 | 아크 판단에 미사용 |
| `arc_energy` | voltage 없어서 계산 불가 |

---

## 🎯 수정된 분석 목표

| 목표 | 방법 |
|------|------|
| ✅ **devType별 특성 비교** | 20A vs 32A 통계 분석 |
| ✅ **아크 위험도 분류** | Arc 카운터 조합 |
| ✅ **아크 유형 판별** | irms+freq 패턴 |
| ✅ **표준 검증** | IEC 62606 데이터 비교 |
| ❌ ~~100J 기준 분류~~ | voltage 없음 |
| ❌ ~~실시간 예측~~ | pre-fault buffer 없음 |

---

## ⚡ IEC 62606 위험도 기준 (핵심!)

> 상세 내용: `IEC_62606_SUMMARY.md` 참조

### Table 1: 직렬 아크 (Series Arc, ≤63A)

| 전류 | 2.5A | 5A | 10A | 16A | 32A | 63A |
|------|------|-----|------|------|------|------|
| 최대 트립 시간 | 1s | 0.5s | 0.25s | 0.15s | 0.12s | 0.12s |

- **용도**: 저전류 아크 → 절연 열화, 접촉 불량

### Table 3: 병렬 아크 (Parallel Arc, ≥75A)

| 전류 | 75A | 100A | 150A+ |
|------|-----|------|-------|
| 허용 반주기 (0.5초 내) | 12 | 10 | 8 |

- **용도**: 고전류 아크 → 지락 사고, 화재 위험
- **우리 데이터**: `freqArcCnt + irmsArcCnt`와 비교 가능

### 위험도 분류 기준

```
🟢 LOW:      arc_count ≤ 허용값의 50%
🟡 MEDIUM:   arc_count ≤ 허용값의 80%
🟠 HIGH:     arc_count ≤ 허용값
🔴 CRITICAL: arc_count > 허용값 (트립 발생!)
```

---

## 📅 Phase별 계획

| Phase | 기간 | 주요 작업 |
|-------|------|----------|
| **Phase 1: EDA** | Week 1 | 데이터 추출, 통계, 파형 분석 |
| **Phase 2: Feature Engineering** | Week 2 | Feature 추출, 중요도 분석 |
| **Phase 3: Modeling** | Week 3 | 분류 모델 개발 |
| **Phase 4: Standards** | Week 4 | IEC 62606 데이터 통합 |
| **Phase 5: Testing** | Week 5+ | 테스트 데이터 수집 (선택) |

---

## 📚 주요 문서 가이드

### 1. **IEC_62606_SUMMARY.md** (⭐ 핵심!)

- IEC 62606 Table 1, 2, 3 정확한 수치
- 위험도 분류 Python 코드
- 우리 데이터와 표준 매핑 방법

### 2. **FIRMWARE_RESPONSE.md** 읽기 순서

```
1. 해결된 질문 (devType, 샘플링 간격)
   ↓
2. 불가능 항목 확인
   ↓
3. 데이터 스키마 확정
   ↓
4. 실행 계획 (Phase 1-5)
   ↓
5. 액션 아이템 체크리스트
```

### 3. **AFDD_EMAIL_REFERENCES.md** 활용

- Series vs Parallel 아크 특성
- 학술 논문 근거
- (표준 수치는 IEC_62606_SUMMARY.md 참조)

### 4. **STARARC_PRODUCT_SPEC.md** 활용

- 제품 사양 (20A/32A)
- 블랙박스 기능 설명
- IoT 시스템 구성

---

## 🔧 환경 설정

### Python 패키지

```bash
pip install pandas numpy matplotlib seaborn scipy scikit-learn joblib
```

### 디렉토리 생성

```bash
mkdir -p data_analysis/{plots,models,data}
```

---

## ✅ 체크리스트

### Week 1 (EDA)
- [ ] 데이터 추출 완료
- [ ] 기초 통계 완료
- [ ] 파형 분석 완료
- [ ] EDA_REPORT.md 작성

### Week 2 (Feature Engineering)
- [ ] Feature 추출
- [ ] Feature 중요도 분석
- [ ] Clustering 분석

### Week 3 (Modeling)
- [ ] 아크 유형 분류 모델
- [ ] 위험도 분류 모델
- [ ] 성능 평가

### Week 4 (Standards)
- [x] IEC 62606 문서 분석 (KS C IEC 62606:2014)
- [x] IEC_62606_SUMMARY.md 작성 (Table 1, 2, 3)
- [ ] Reference DB 구축 (위험도 분류 적용)
- [ ] 비교 분석 (실제 데이터 vs 표준)

---

## 🤝 협업

### 펌웨어팀 요청 사항

#### 완료
- [x] IEC 62606 표준 문서 확보 (KS C IEC 62606:2014)
- [x] devType, 샘플링 간격 확인

#### 추가 요청 (선택)
- [ ] IEC 62606 인증 시험 실데이터 (있으면 공유 요청)
- [ ] 부하별 트립 시간 측정 데이터
- [ ] Pre-fault buffer 10초 샘플 (펌웨어 수정 필요)

---

## 📞 연락처

- **데이터 분석**: 김승재
- **펌웨어**: 펌웨어 개발 담당자
- **프로젝트 경로**: `/home/jammy/projects/iot_v3_svn/data_analysis`

---

*최종 수정: 2026-01-07 (IEC 62606 표준 분석 완료)*
