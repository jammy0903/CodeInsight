# KS C IEC 62606:2014 표준 분석

**문서**: KS C IEC 62606:2014 (Arc Fault Detection Devices)
**분석일**: 2026-01-07
**목적**: AFDD 데이터 분석을 위한 표준 기준 확보

---

## 📋 목차 구조

### 핵심 섹션

| 섹션 | 제목 | 페이지 | 중요도 | 비고 |
|------|------|--------|--------|------|
| **8. 구조 및 동작에 대한 필요 조건** | | | ⭐⭐⭐⭐⭐ | |
| 8.6 | 동작 특성 | p.25 | ⭐⭐⭐⭐⭐ | **차단 시간 기준** |
| **9. 시험 절차** | | | ⭐⭐⭐⭐⭐ | |
| 9.9 | 동작 특성 검증 | p.41 | ⭐⭐⭐⭐⭐ | **직렬/병렬 아크 시험** |
| **그림 4-7** | 시험 회로도 | p.73 | ⭐⭐⭐⭐ | 시험 환경 설정 |

---

## 📊 핵심 표 (Tables)

### ⭐⭐⭐⭐⭐ 표 1: Un=230V AFDDs에 대한 차단시간의 한계 값

**위치**: p.9
**적용**: 우리 제품 (220V 기준) - **직렬 아크 (낮은 전류 ≤63A)**

| 시험 아크 전류 (r.m.s.) | 2.5A | 5A | 10A | 16A | 32A | 63A |
|------------------------|------|-----|------|------|------|------|
| **최고 차단 시간** | 1s | 0.5s | 0.25s | 0.15s | 0.12s | 0.12s |

> **비고**: 어스나 **직렬 아크**에 대한 절연 불량으로 인해 **낮은 아크 전류**가 발생

**핵심 인사이트**:
- 펌웨어 개발자 말이 맞았다: **"부하마다 규격이 다름"**
- 전류가 낮을수록 → 차단 시간 김 (최대 1초)
- 전류가 높을수록 → 차단 시간 짧음 (0.12초)
- **5A 기준 0.5초 = 우리 30개 샘플 윈도우와 정확히 일치!**

---

### ⭐⭐⭐⭐ 표 2: Un=120V AFDDs에 대한 차단시간의 한계 값

**위치**: p.9
**적용**: 미국 시장 (120V) - 참고용

| 시험 아크 전류 (r.m.s.) | 5A | 10A | 16A | 32A | 63A |
|------------------------|-----|------|------|------|------|
| **최고 차단 시간** | 1s | 0.4s | 0.28s | 0.14s | 0.14s |

---

### ⭐⭐⭐⭐⭐ 표 3: 0.5초 이내의 아크 반주기의 최대 허용 수

**위치**: p.9
**적용**: **병렬 아크 (높은 전류 ≥63A)**

| 시험 아크 전류 (r.m.s.) | 75A | 100A | 150A | 200A | 300A | 500A |
|------------------------|-----|------|------|------|------|------|
| **N (허용 반주기)** | 12 | 10 | 8 | 8 | 8 | 8 |

> **비고**: 지락 혹은 **병렬 아크**에 대한 절연 결함 때문에 **높은 아크 전류**가 발생

**핵심 인사이트**:
```
0.5초 = 30 half cycles (60Hz 기준)
         ↓
우리 데이터: 30개 샘플 × 16.7ms = 500ms
         ↓
표 3 기준과 완벽히 일치! 🎯
```

**위험도 판단 기준**:
- 75A → 30개 중 **12개 이상** 아크면 → 차단!
- 100A → 30개 중 **10개 이상** 아크면 → 차단!
- 150A+ → 30개 중 **8개 이상** 아크면 → 차단!

---

## 🔥 실제 적용 코드

### 1. 표 1 기준 (직렬 아크, ≤63A)

```python
# IEC 62606 표 1: 230V 직렬 아크 차단 시간 기준
IEC_62606_TABLE1_230V = {
    2.5: 1.0,    # 2.5A → 1초 이내
    5.0: 0.5,    # 5A → 0.5초 이내
    10.0: 0.25,  # 10A → 0.25초 이내
    16.0: 0.15,  # 16A → 0.15초 이내
    32.0: 0.12,  # 32A → 0.12초 이내
    63.0: 0.12,  # 63A → 0.12초 이내
}

def get_max_trip_time_series(current_rms):
    """직렬 아크 시 최대 허용 차단 시간 (보간법 적용)"""
    thresholds = sorted(IEC_62606_TABLE1_230V.keys())

    for i, thresh in enumerate(thresholds):
        if current_rms <= thresh:
            if i == 0:
                return IEC_62606_TABLE1_230V[thresh]
            # 보간법 적용
            prev_thresh = thresholds[i-1]
            prev_time = IEC_62606_TABLE1_230V[prev_thresh]
            curr_time = IEC_62606_TABLE1_230V[thresh]
            ratio = (current_rms - prev_thresh) / (thresh - prev_thresh)
            return prev_time + ratio * (curr_time - prev_time)

    return 0.12  # 63A 이상
```

### 2. 표 3 기준 (병렬 아크, ≥63A)

```python
# IEC 62606 표 3: 500ms 내 허용 아크 반주기 수
IEC_62606_TABLE3 = {
    75: 12,   # 75A → 12개 허용
    100: 10,  # 100A → 10개 허용
    150: 8,   # 150A 이상 → 8개 허용
    200: 8,
    300: 8,
    500: 8,
}

def get_max_arc_halfcycles(current_rms):
    """병렬 아크 시 최대 허용 반주기 수"""
    if current_rms < 75:
        return None  # 표 1 기준 적용
    elif current_rms < 100:
        return 12
    elif current_rms < 150:
        return 10
    else:
        return 8

def analyze_arc_risk_table3(fault_types, current_rms):
    """
    표 3 기준으로 위험도 분석
    fault_types: 30개 샘플의 fault_type 배열
    """
    max_allowed = get_max_arc_halfcycles(current_rms)
    if max_allowed is None:
        return "USE_TABLE1"  # 낮은 전류는 표 1 기준

    arc_count = sum(1 for ft in fault_types if ft > 0)

    if arc_count >= max_allowed:
        return "HIGH_RISK"  # 차단 필요
    elif arc_count >= max_allowed * 0.7:
        return "MEDIUM_RISK"
    else:
        return "LOW_RISK"
```

### 3. 통합 위험도 분석

```python
def analyze_afdd_risk(irms_array, fault_type_array, current_rms):
    """
    IEC 62606 기준 통합 위험도 분석

    Args:
        irms_array: 30개 전류 샘플
        fault_type_array: 30개 fault_type 값
        current_rms: RMS 전류값

    Returns:
        risk_level: "HIGH", "MEDIUM", "LOW"
        reason: 판단 근거
    """
    arc_count = sum(1 for ft in fault_type_array if ft > 0)
    window_ms = len(irms_array) * 16.7  # 약 500ms

    if current_rms >= 63:  # 표 3 적용 (병렬 아크)
        max_allowed = get_max_arc_halfcycles(current_rms)
        if arc_count >= max_allowed:
            return "HIGH", f"Table3: {arc_count}/{max_allowed} arcs in 500ms"
        elif arc_count >= max_allowed * 0.7:
            return "MEDIUM", f"Table3: {arc_count}/{max_allowed} arcs"
        else:
            return "LOW", f"Table3: {arc_count}/{max_allowed} arcs"

    else:  # 표 1 적용 (직렬 아크)
        max_time_s = get_max_trip_time_series(current_rms)
        max_windows = max_time_s / 0.5  # 500ms 윈도우 개수

        # 연속 윈도우에서 아크 지속 시 위험
        if arc_count >= 20:  # 30개 중 20개 이상
            return "HIGH", f"Table1: {arc_count}/30 arcs, max {max_time_s}s"
        elif arc_count >= 10:
            return "MEDIUM", f"Table1: {arc_count}/30 arcs"
        else:
            return "LOW", f"Table1: {arc_count}/30 arcs"
```

---

## 🔬 9.9 동작 특성 검증 (p.41)

**내용**:
- 직렬 아크 시험 (Series Arc Test)
- 병렬 아크 시험 (Parallel Arc Test)

**펌웨어팀 첨부 문서 예상 내용**:
```
이 섹션에 다음 정보가 있을 것:
✅ 부하별 시험 조건 (저항, 유도, 용량)
✅ 전류 크기별 차단 시간
✅ 시험 합격 기준
✅ 아크 지속 시간 측정 방법
```

---

## 🎯 데이터 분석 적용 계획

### 1. 표 1 기준으로 실측 데이터 검증

**분석 방법**:
```python
# 표 1에서 추출한 기준값
IEC_62606_TRIP_TIME = {
    "230V": {
        "series_arc": {
            "1-5A": {"max_ms": 120},      # 가정
            "5-10A": {"max_ms": 100},     # 가정
            # ... 표 1 실제 데이터로 업데이트
        },
        "parallel_arc": {
            "50-100A": {"max_ms": 50},    # 가정
            # ... 표 1 실제 데이터로 업데이트
        }
    }
}

# 실측 데이터 비교
def validate_trip_time(measured_current, trip_time_ms):
    standard = get_standard_for_current(measured_current)
    if trip_time_ms <= standard["max_ms"]:
        return "PASS"
    else:
        return "FAIL"
```

### 2. 표 3 기준으로 아크 심각도 분류

**분석 방법**:
```python
# 500ms 윈도우 = 우리의 30개 샘플
def analyze_arc_severity(irms_array, freq_array):
    """
    표 3 기준: 0.5초 이내 아크 반주기 허용 수
    """
    # Zero-crossing 감지로 반주기 카운트
    zero_crossings = detect_zero_crossings(irms_array)

    arc_half_cycles = count_arc_events(
        irms_array,
        freq_array,
        zero_crossings
    )

    # 표 3에서 추출한 임계값
    max_allowed = IEC_62606_TABLE3["max_half_cycles"]

    if arc_half_cycles > max_allowed:
        return "HIGH_RISK"  # 차단 필요
    else:
        return "LOW_RISK"
```

### 3. 9.9 시험 데이터 요청

**펌웨어팀 요청 사항**:
```
제목: IEC 62606 섹션 9.9 시험 데이터 공유 요청

안녕하세요,

IEC 62606 표준 문서를 확인했습니다.
섹션 9.9 (동작 특성 검증, p.41)의 시험 데이터를
공유해주실 수 있나요?

필요한 정보:
1. 표 1 (Un=230V 차단시간 한계값)의 상세 내용
   - 전류 범위별 최대 차단 시간
   - Series vs Parallel 구분

2. 섹션 9.9 시험 결과
   - 직렬 아크 시험 (부하별)
   - 병렬 아크 시험 (부하별)
   - 실측 차단 시간

3. 표 3 (0.5초 이내 아크 반주기 허용 수)
   - 전류별 임계값

이 데이터로 실측 데이터와 표준 기준을 비교하여
제품 성능을 검증하겠습니다.

감사합니다.
```

---

## 📐 시험 회로도 (그림 4-7, p.73)

**중요성**:
- 아크 발생 시험 환경
- 부하 연결 방식
- 측정 지점

**활용**:
- 테스트 데이터 수집 시 참고
- 실제 환경과 시험 환경 비교

---

## 🔄 다음 단계

### ✅ 완료

- [x] cut__2.pdf에서 표 1, 2, 3 추출
- [x] Python 코드로 위험도 분류 로직 구현
- [x] README.md 업데이트

### 선택 사항 (필요 시)

- [ ] 섹션 8.6 (p.25) 동작 특성 상세 분석
- [ ] 섹션 9.9 (p.41) 시험 방법 분석
- [ ] 펌웨어팀에 인증 시험 실데이터 요청

---

## 💡 핵심 인사이트

### 1. 500ms = 우리 샘플 윈도우!

```
표 3: 0.5초 이내 아크 반주기 허용 수
      ↓
우리 데이터: 30개 샘플 × 16.7ms = 500.1ms
      ↓
완벽히 일치! ✅
```

**의미**:
- IEC 62606 표준이 500ms 윈도우 기준
- 우리가 수집하는 30개 샘플이 정확히 이 윈도우
- 표 3 기준으로 직접 위험도 판단 가능!

### 2. 120ms는 "최대" 차단 시간

```
펌웨어 개발자 답변:
"규격은 어디에 120ms?"
      ↓
표 1에 있음! (전류별로 다름)
      ↓
120ms는 특정 전류 범위의 최대값으로 추정
```

### 3. 직렬/병렬 아크 시험 방법 공개

```
섹션 9.9 (p.41)
      ↓
부하별 시험 조건
      ↓
우리 테스트 데이터 수집 시 동일 조건 재현 가능
```

---

## 📚 관련 문서

| 문서 | 용도 |
|------|------|
| `FIRMWARE_RESPONSE.md` | 펌웨어 답장, 데이터 제약 |
| `AFDD_EMAIL_REFERENCES.md` | 학술 논문 레퍼런스 |
| `STARARC_PRODUCT_SPEC.md` | 제품 사양 |
| `IEC_62606_SUMMARY.md` | 이 문서 - 표준 분석 |

---

## 🔄 업데이트 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-07 | 최초 작성 (목차 분석) |
| 2026-01-07 | ✅ 표 1, 2, 3 상세 수치 추가 (cut__2.pdf 확인) |
| 2026-01-07 | ✅ 위험도 분석 Python 코드 추가 |

---

## ⚠️ 주의사항

**✅ 표 1, 2, 3 확인 완료!**
- 0.12s (120ms) = 32A, 63A 기준 최대 차단 시간
- 전류가 낮을수록 허용 시간 증가 (2.5A → 1s)
- 펌웨어 개발자 말이 맞음: **부하마다 규격이 다름**

**다음 분석 단계**:
1. ✅ p.9의 표 1, 2, 3 상세 내용 → 완료
2. p.25의 섹션 8.6 (동작 특성) → 선택
3. p.41의 섹션 9.9 (시험 방법) → 선택
