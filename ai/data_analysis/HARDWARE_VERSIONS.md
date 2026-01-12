# AFDD 하드웨어 버전 및 데이터 구조

**작성일**: 2026-01-09
**목적**: 아크차단기 모델별 데이터 수집 특성 정리

---

## 📋 목차

1. [모델 버전 구분](#1-모델-버전-구분)
2. [통신 방식 비교](#2-통신-방식-비교)
3. [게이트웨이와 차단기 관계](#3-게이트웨이와-차단기-관계)
4. [아크 발생 시 동작 흐름](#4-아크-발생-시-동작-흐름)
5. [데이터 구조 비교](#5-데이터-구조-비교)
6. [ML 데이터셋 전략](#6-ml-데이터셋-전략)

---

## 1. 모델 버전 구분

### 버전 분류

| 버전 | 모델명 | 상태 | 특징 |
|------|--------|------|------|
| **Version 1** | **RD** | 🔴 생산중단 | Wi-Fi 내장, 게이트웨이 불필요 |
| **Version 2** | **x20, x70, v30** | 🟢 현재 주력 | RS-485, 폴링 방식, 30샘플 |
| **Version 3** | **x83, x90** | 🟡 출시예정 | PLC, 이벤트 방식, 60샘플 ⭐ |

### ⚠️ 중요 사항

```
🔴 Version 1 (RD): 생산중단, 데이터 수집 종료
🟡 Version 2 (x20, x70, v30): 현재 데이터 대부분 차지
🟢 Version 3 (x83, x90): ML 데이터셋 핵심 타겟!
```

---

## 2. 통신 방식 비교

### 2.1 Version 1 (RD) - Wi-Fi 직접 연결

```
[RD 차단기] ──Wi-Fi──► [MQTT Broker]
                           │
                           ▼
                    [Backend Server]
```

**특징:**
- 게이트웨이 불필요
- 차단기 내부에 Wi-Fi 모듈 탑재
- MQTT prefix: `EFPS`
- **현재 상태**: 생산중단, 레거시 데이터

---

### 2.2 Version 2 (x20, x70, v30) - RS-485 폴링

```
[차단기 1] ─┐
[차단기 2] ─┤
[차단기 3] ─┼─ RS-485 ──► [Gateway] ──► [MQTT Broker]
    ...     ─┤                               │
[차단기 32]─┘                               ▼
                                     [Backend Server]
```

**통신 프로토콜:**
- **RS-485 라인**: 한계로 인해 폴링(Polling) 방식 사용
- **폴링 주기**: 1초마다 `order` +1 씩 증가하며 순차 요청
- **응답 시간**: 32개 차단기 전체 조회 = **32초**

**데이터 전송:**
- `op: "data"` → irms, freq **단일 평균값** (60개 샘플의 평균)
- `op: "fault"` → irms, freq **30개 샘플** (16.7ms 간격, 500ms 윈도우)

**제약사항:**
- 💾 **저장소 크기 한계**: 30개 샘플만 저장 가능 (60개 불가)
- 🐢 **폴링 지연**: 실시간성 떨어짐

---

### 2.3 Version 3 (x83, x90) - PLC 이벤트 방식 ⭐

```
[차단기 1] ─┐
[차단기 2] ─┤
[차단기 3] ─┼─ PLC 라인 ──► [Gateway] ──► [MQTT Broker]
    ...     ─┤                               │
[차단기 32]─┘                               ▼
                                     [Backend Server]
```

**통신 프로토콜:**
- **PLC (Power Line Communication)**: 전력선 통신
- **이벤트 기반**: 폴링 불필요, 이벤트 발생 시 즉시 전송
- **실시간성**: 대폭 향상

**데이터 전송:**
- `op: "data"` → **60개 샘플** (모든 파라미터) ⭐
- `op: "fault"` → **60개 샘플** (모든 파라미터) ⭐

**신규 파라미터:**
- ✅ `irms`: 전류 RMS (60샘플)
- ✅ `vrms`: **전압 RMS (60샘플)** ← 신규!
- ✅ `freq`: 주파수 (60샘플)
- ✅ `active_power`: **유효전력 (60샘플)** ← 신규!
- ✅ `reactive_power`: **무효전력 (60샘플)** ← 신규!
- ✅ `power_factor`: **역률 (60샘플)** ← 신규!

**💡 핵심 개선:**
```
Version 2: 30샘플 (저장소 한계)
           ↓
Version 3: 60샘플 (저장소 확장)
           + 전압, 전력 파라미터 추가
           + 이벤트 기반 실시간 전송
```

---

## 3. 게이트웨이와 차단기 관계

### 3.1 기본 구성

| 항목 | 값 |
|------|-----|
| **1개 게이트웨이당 최대 차단기 수** | **32개** |
| **차단기 식별** | `order` 필드 (1~32) |

### 3.2 Version별 동작 방식

#### Version 2 (RS-485 폴링)

```python
# 폴링 주기: 1초
for order in range(1, 33):
    response = request_device(gateway, order)
    time.sleep(1)  # 1초 대기
# 전체 조회 시간: 32초
```

**문제점:**
- 32개 차단기 → 32초 걸림
- 이벤트 발생 시 최대 32초 지연 가능

#### Version 3 (PLC 이벤트)

```python
# 이벤트 발생 시 즉시 전송
def on_fault(device):
    mqtt_publish(device.data)  # 즉시 전송, 폴링 불필요
```

**개선점:**
- ⚡ **실시간 전송**: 지연 없음
- ✅ **order 필드**: 필수 (차단기 구분자)

---

## 4. 아크 발생 시 동작 흐름 ⭐

### 4.1 아크 감지 → 트립 프로세스

```
┌─────────────────────────────────────────────────────────┐
│                   정상 운영 중                           │
│   op: "data", faultType: 0                              │
└─────────────────────────────────────────────────────────┘
                      ↓
                아크 발생 감지!
                      ↓
┌─────────────────────────────────────────────────────────┐
│                차단기 TRIP 동작                          │
│   - 전원 차단                                           │
│   - fault_type = 7로 변경                               │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│          fault_type=7 계속 전송 ⭐⭐⭐                   │
│   - 정상 복구 전까지 지속                               │
│   - op: "fault" 메시지 반복                             │
│   - 30샘플(V2) 또는 60샘플(V3) 파형 포함                │
└─────────────────────────────────────────────────────────┘
                      ↓
             사용자 수동 복구 (리셋)
                      ↓
┌─────────────────────────────────────────────────────────┐
│                정상 상태로 복귀                          │
│   op: "data", faultType: 0                              │
└─────────────────────────────────────────────────────────┘
```

### 4.2 핵심 특징

| 항목 | 동작 |
|------|------|
| **트립 조건** | 아크 감지 (freqArcCnt, irmsArcCnt 임계값 초과) |
| **트립 후 상태** | 전원 차단, 차단기 열림 |
| **MQTT 메시지** | `op: "fault"`, `faultType: 7` 계속 전송 |
| **복구 방법** | 수동 리셋 필요 |
| **정상 복귀** | `op: "data"`, `faultType: 0` |

### 4.3 데이터 수집 관점

#### 트립 전 (정상)
```json
{
  "header": {"op": "data"},
  "data": {
    "faultType": "0",
    "iArcCnt": "0",
    "fArcCnt": "0"
  }
}
```

#### 트립 후 (아크 발생)
```json
{
  "header": {"op": "fault"},  // ⭐ op가 fault로 변경
  "data": {
    "faultType": "7",          // ⭐ 7로 고정
    "freqArcCnt": "5",
    "irmsArcCnt": "3",
    "irms": "1.2,1.3,...",     // 30개 또는 60개 샘플
    "freq": "59.8,60.0,..."
  }
}
```

#### 트립 후 지속 (복구 전)
```json
{
  "header": {"op": "fault"},  // ⭐ 계속 fault
  "data": {
    "faultType": "7",          // ⭐ 여전히 7
    "freqArcCnt": "5",         // 동일한 값
    "irmsArcCnt": "3",
    "irms": "1.2,1.3,...",
    "freq": "59.8,60.0,..."
  }
}
```

### 4.4 ML 학습 시 주의사항

⚠️ **중복 데이터 처리 필요!**

```python
# 같은 아크 이벤트가 계속 전송됨
# 타임스탬프로 중복 제거 필요

def deduplicate_fault_events(events):
    """
    연속된 동일 fault_type=7 이벤트 중 첫 번째만 선택
    """
    unique_events = []
    prev_device = None
    prev_fault_type = None

    for event in events:
        device_id = event['device_id']
        fault_type = event['faultType']

        # 새로운 디바이스 또는 fault_type 변경 시에만 추가
        if (device_id != prev_device) or (fault_type != prev_fault_type):
            unique_events.append(event)

        prev_device = device_id
        prev_fault_type = fault_type

    return unique_events
```

### 4.5 타임라인 예시

```
00:00:00  [IGWP_001] op:data, faultType:0  (정상)
00:00:01  [IGWP_001] op:data, faultType:0  (정상)
00:00:02  [IGWP_001] op:data, faultType:0  (정상)
00:00:03  [IGWP_001] op:fault, faultType:7 ← 아크 감지! (첫 번째)
00:00:04  [IGWP_001] op:fault, faultType:7 ← 반복 (중복)
00:00:05  [IGWP_001] op:fault, faultType:7 ← 반복 (중복)
00:00:06  [IGWP_001] op:fault, faultType:7 ← 반복 (중복)
  ...
00:05:30  [IGWP_001] op:fault, faultType:7 ← 여전히 반복
00:05:31  [사용자가 수동 리셋]
00:05:32  [IGWP_001] op:data, faultType:0  ← 정상 복귀
```

**ML 학습용 데이터:**
- ✅ 00:00:03의 첫 번째 fault 이벤트만 사용
- ❌ 00:00:04 ~ 00:05:30의 중복 이벤트는 제외

---

## 5. 데이터 구조 비교

### 4.1 Version 2 (현재)

#### op: "data" (정상 상태)

```json
{
  "header": {"op": "data", "src": "IGWP8472077B14BB"},
  "data": {
    "order": "03",
    "voltage": "220",
    "current": "1.5",
    "power": "330",
    "leakage": "0.0",
    "freq": "60",        // ⚠️ 60개 샘플의 평균값 1개
    "irms": "1.5",       // ⚠️ 60개 샘플의 평균값 1개 (추정)
    "iArcCnt": "0",
    "fArcCnt": "0",
    "faultType": "0",
    "devType": "32",
    "temp": "+25"
  }
}
```

**⚠️ 주의:**
- `irms`, `freq`는 **1초 동안 60개 샘플의 평균값 1개**
- ML 분석에는 부적합 (파형 정보 손실)

#### op: "fault" (아크 감지)

```json
{
  "header": {"op": "fault", "src": "IGWP8472077B14BB"},
  "data": {
    "order": "03",
    "faultType": "7",
    "freqArcCnt": "3",
    "irmsArcCnt": "2",
    "carbonArcCnt": "0",
    "irmsAmpere": "5",
    "irms": "1.2,1.3,1.4,...(30개)",  // ⭐ 30개 샘플
    "freq": "59.8,60.0,60.1,...(30개)" // ⭐ 30개 샘플
  }
}
```

**샘플링 정보:**
- 샘플 수: 30개
- 샘플 간격: 16.7ms (60Hz 기준 1 사이클)
- 윈도우: 30 × 16.7ms = **500ms** (IEC 62606 Table 3과 일치)

---

### 4.2 Version 3 (예정) ⭐

#### op: "data" (정상 상태)

```json
{
  "header": {"op": "data", "src": "IGWP_X83_xxxxxxxx"},
  "data": {
    "order": "03",  // ❓ PLC 방식에서도 필요한지 확인 필요
    "faultType": "0",
    "devType": "32",
    "temp": "+25",

    // ⭐ 60개 샘플 (모두 포함!)
    "irms": "1.2,1.3,1.4,...(60개)",       // 전류 RMS
    "vrms": "220.1,220.2,...(60개)",       // ⭐ 전압 RMS (신규!)
    "freq": "59.9,60.0,60.1,...(60개)",    // 주파수
    "active_power": "330.1,330.2,...(60개)",   // ⭐ 유효전력 (신규!)
    "reactive_power": "50.1,50.2,...(60개)",   // ⭐ 무효전력 (신규!)
    "power_factor": "0.98,0.99,...(60개)"      // ⭐ 역률 (신규!)
  }
}
```

#### op: "fault" (아크 감지)

```json
{
  "header": {"op": "fault", "src": "IGWP_X83_xxxxxxxx"},
  "data": {
    "order": "03",  // ❓ PLC 방식에서도 필요한지 확인 필요
    "faultType": "7",
    "freqArcCnt": "5",
    "irmsArcCnt": "3",
    "carbonArcCnt": "1",
    "irmsAmpere": "7.5",

    // ⭐ 60개 샘플 (모두 포함!)
    "irms": "5.1,5.2,5.3,...(60개)",
    "vrms": "220.1,220.2,...(60개)",       // ⭐ 신규!
    "freq": "59.5,59.8,60.0,...(60개)",
    "active_power": "1100.1,1100.2,...(60개)",   // ⭐ 신규!
    "reactive_power": "200.1,200.2,...(60개)",   // ⭐ 신규!
    "power_factor": "0.95,0.96,...(60개)"        // ⭐ 신규!
  }
}
```

**샘플링 정보:**
- 샘플 수: **60개** (Version 2의 2배)
- 샘플 간격: **8.35ms** (Version 2의 절반)
- 윈도우: **500ms** (Version 2와 동일)

**✅ 확정 사항:**
- 60개 샘플 × 8.35ms = 500.1ms (IEC 62606 Table 3 윈도우 유지)
- order 필드는 **필수** (차단기 구분자)
- vrms, active_power 등의 정확한 필드명은 Version 3 출시 시 확정

---

### 4.3 파라미터 비교표

| 파라미터 | Ver 2 op:data | Ver 2 op:fault | Ver 3 op:data | Ver 3 op:fault | ML 가치 |
|---------|---------------|----------------|---------------|----------------|---------|
| **irms** | 평균 1개 ❌ | 30샘플 ✅ | 60샘플 ⭐ | 60샘플 ⭐ | 🟢 매우 높음 |
| **vrms** | ❌ 없음 | ❌ 없음 | 60샘플 ⭐ | 60샘플 ⭐ | 🟢 매우 높음 |
| **freq** | 평균 1개 ❌ | 30샘플 ✅ | 60샘플 ⭐ | 60샘플 ⭐ | 🟢 높음 |
| **active_power** | 평균 1개 ❌ | ❌ 없음 | 60샘플 ⭐ | 60샘플 ⭐ | 🟢 매우 높음 |
| **reactive_power** | ❌ 없음 | ❌ 없음 | 60샘플 ⭐ | 60샘플 ⭐ | 🟡 중간 |
| **power_factor** | ❌ 없음 | ❌ 없음 | 60샘플 ⭐ | 60샘플 ⭐ | 🟡 중간 |

---

## 5. ML 데이터셋 전략

### 5.1 기존 데이터 활용도

```
🔴 Version 1 (RD): 무시
   - 생산중단, 레거시 데이터
   - 수집 불필요

🟡 Version 2 (x20, x70, v30): 제한적 활용
   - op:data → ❌ 무시 (평균값만 존재)
   - op:fault → ⚠️ 30샘플, 제한적 활용 가능
   - 현재 데이터 대부분 차지하지만 ML에는 부적합

🟢 Version 3 (x83, x90): 핵심 데이터셋 ⭐
   - op:data → ✅ 60샘플, 모든 파라미터
   - op:fault → ✅ 60샘플, 모든 파라미터
   - ML 학습의 주력 데이터
```

### 5.2 InfluxDB 재구성 계획

#### 현재 구조 (문제점)

```
arcBucket
  └── mqtt_data (measurement)
      ├── Version 1 (RD) 데이터 혼재
      ├── Version 2 (x20, x70) 데이터 혼재
      └── Version 3 (x83, x90) 데이터 (향후)
```

**문제:**
- 버전별 데이터 구조 상이
- ML에 부적합한 데이터 혼재
- 쿼리 복잡도 증가

#### 신규 구조 (제안)

```
ml_dataset_bucket (신규 생성) ⭐
  └── afdd_waveform (measurement)
      ├── Version 3 전용
      ├── 60샘플 파형 데이터
      └── 모든 전력 파라미터 포함

arcBucket (기존 유지)
  └── mqtt_data
      └── 레거시 데이터 (참고용)
```

**장점:**
- ✅ Version 3 데이터만 분리 저장
- ✅ ML 학습에 최적화된 스키마
- ✅ 기존 시스템 영향 없음

### 5.3 데이터 수집 전략

```
Phase 1 (현재): Version 2 데이터 수집 중
   - op:fault 30샘플 수집
   - 제한적이지만 초기 실험 가능
   - 대기 기간: 2-4주

Phase 2 (출시 후): Version 3 데이터 수집 시작 ⭐
   - 60샘플 + 전압/전력 파라미터
   - ml_dataset_bucket에 저장
   - 본격 ML 학습 시작

Phase 3 (장기): Version 3 데이터 축적
   - 최소 수집 기간: 3-6개월
   - 다양한 시나리오 포함
   - 실제 아크 이벤트 확보
```

### 5.4 데이터 품질 기준

| 항목 | Version 2 | Version 3 | ML 요구사항 |
|------|-----------|-----------|-------------|
| **샘플 수** | 30개 | 60개 | 60개 이상 권장 |
| **샘플링 레ート** | 60Hz | ❓ 확인 필요 | 60Hz 이상 |
| **전압 파형** | ❌ 없음 | ✅ 있음 | **필수** (에너지 계산) |
| **전력 파형** | ❌ 없음 | ✅ 있음 | 권장 (특징 추출) |
| **실시간성** | 🐢 최대 32초 지연 | ⚡ 즉시 | 즉시 권장 |

---

## 6. 새 Feature 가능성

### 6.1 Version 2 제약으로 불가능했던 것

| Feature | 불가 이유 | Version 3 해결 |
|---------|----------|----------------|
| **Arc Energy** | voltage 없음 | ✅ vrms로 계산 가능 |
| **100J 기준 분류** | 에너지 계산 불가 | ✅ IEC 기준 적용 가능 |
| **Power Quality** | 전력 파형 없음 | ✅ 고조파, THD 분석 가능 |
| **Impedance 추정** | V, I 동시 없음 | ✅ Z = V/I 계산 가능 |
| **Phase Angle** | V, I 동시 없음 | ✅ 위상차 분석 가능 |

### 6.2 신규 Feature 목록 (Version 3)

#### 에너지 기반 Feature

```python
# Arc Energy 계산
arc_energy = sum(vrms[i] * irms[i] * dt for i in range(60))

# 100J 기준 분류 (IEC 62606)
risk_level = "HIGH" if arc_energy > 100 else "LOW"
```

#### 전력 품질 Feature

```python
# Total Harmonic Distortion
thd_v = calculate_thd(vrms)
thd_i = calculate_thd(irms)

# Harmonic Ratio
harmonic_ratio = calculate_harmonic_energy(irms) / rms(irms)
```

#### 임피던스 기반 Feature

```python
# Complex Impedance
Z = vrms / irms  # 복소 임피던스

# Phase Angle
phase_diff = np.angle(fft(vrms)) - np.angle(fft(irms))
```

---

## 7. 액션 아이템

### 🔴 즉시 확인 필요

- [ ] Version 3 필드명 확정
  - vrms, active_power, reactive_power, power_factor 정확한 이름?
- [ ] 60개 샘플 시간 간격 확인
  - 8.35ms (500ms 윈도우)? 16.7ms (1000ms 윈도우)?
- [ ] PLC 방식에서 order 필드 필요 여부
- [ ] Version 3 출시 예정일

### 🟡 준비 작업

- [ ] ml_dataset_bucket InfluxDB 스키마 설계
- [ ] Version 3 데이터 파싱 코드 작성
- [ ] 새 Feature 추출 함수 설계
- [ ] 에너지 계산 로직 구현

### 🟢 장기 계획

- [ ] Version 3 데이터 수집 시작 (출시 후)
- [ ] 3-6개월 데이터 축적
- [ ] ML 모델 재학습
- [ ] 100J 기준 위험도 분류 모델 개발

---

## 8. 참고 문서

| 문서 | 내용 |
|------|------|
| `EXPERIMENT_PLAN.md` | ML 실험 계획 |
| `IEC_62606_SUMMARY.md` | IEC 62606 표준 분석 |
| `MQTT_DATA_SCHEMA.md` | MQTT 메시지 구조 (Version 2 기준) |

---

*최종 수정: 2026-01-09 (하드웨어 버전 정리)*
