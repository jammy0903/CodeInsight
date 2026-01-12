# AFDD ML 데이터셋용 DB 재구성 계획서

**제출일**: 2026-01-09
**작성자**: 김승재
**목적**: Version 3 (x83, x90) 출시 대비 ML 학습용 데이터베이스 재설계

---

## 📋 Executive Summary

### 현재 문제점

| 문제 | 영향 | 심각도 |
|------|------|--------|
| Version 1, 2, 3 데이터 혼재 | ML 학습에 부적합한 데이터 포함 | 🔴 높음 |
| 샘플 수 불일치 (30개 vs 60개) | 데이터 전처리 복잡도 증가 | 🟡 중간 |
| 중복 이벤트 (fault_type=7 반복) | 학습 데이터 편향 | 🔴 높음 |
| 전압/전력 파라미터 부재 | Arc Energy 계산 불가 | 🔴 높음 |

### 제안 솔루션

```
✅ InfluxDB: ML 전용 bucket 신규 생성 (arcBucket_ml)
✅ SQLite: F_MSG_V3 테이블 신규 생성 또는 확장
✅ 중복 제거 로직 구현
✅ 버전별 파이프라인 분리
```

---

## 1. 현재 데이터베이스 구조

### 1.1 InfluxDB (시계열 데이터)

```
arcBucket
  └── measurement: mqtt_data
      ├── Tags:
      │   ├── device_id (예: IGWP8472077B14BB)
      │   └── gateway_id
      │
      └── Fields:
          ├── voltage (int)
          ├── current (float)
          ├── power (float)
          ├── leakage (float)
          ├── freq (int)          // ⚠️ 단일값
          ├── fault_type (int)
          ├── irms_ampere (int)   // ⚠️ RMS 값 1개
          └── temp (float)
```

**문제점:**
- ❌ irms, freq **파형 데이터 없음** (op:data의 평균값만 저장)
- ❌ Version 구분 불가
- ❌ ML에 필요한 vrms, active_power 등 신규 필드 없음

### 1.2 SQLite (장애 이벤트)

```sql
-- F_MSG 테이블 (op:fault 데이터)
CREATE TABLE F_MSG (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    device_id TEXT NOT NULL,
    gateway_id TEXT,
    faultType INTEGER,

    -- 파형 데이터 (30개 샘플, 콤마 구분)
    irms TEXT,              -- "1.2,1.3,1.4,..."
    freq TEXT,              -- "59.8,60.0,60.1,..."

    -- 아크 카운터
    freqArcCnt INTEGER,
    irmsArcCnt INTEGER,
    carbonArcCnt INTEGER,
    irmsAmpere REAL,

    -- 기타
    devType INTEGER         -- 20 or 32
);
```

**문제점:**
- ❌ Version 2 (30샘플)만 저장 가능
- ❌ Version 3 신규 필드 (vrms, active_power 등) 없음
- ❌ 샘플 수 정보 없음 (30개 하드코딩)
- ❌ 중복 이벤트 (fault_type=7 반복) 저장됨

---

## 2. 신규 데이터베이스 구조 (제안)

### 2.1 InfluxDB 재설계

#### Option A: 새 Bucket 생성 (권장 ⭐)

```
arcBucket (기존 유지)
  └── mqtt_data
      └── Version 1, 2 레거시 데이터

arcBucket_ml (신규) ⭐
  └── afdd_waveform
      ├── Tags:
      │   ├── device_id
      │   ├── gateway_id
      │   ├── hardware_version (v2 | v3)  // ⭐ 신규
      │   ├── fault_type (0 | 7)
      │   └── event_type (normal | fault) // ⭐ 신규
      │
      └── Fields:
          ├── sample_count (int)          // ⭐ 30 or 60
          ├── sample_interval_ms (float)  // ⭐ 16.7 or 8.35
          │
          ├── irms (string)               // 30개 or 60개 샘플
          ├── vrms (string)               // ⭐ 신규 (V3만)
          ├── freq (string)               // 30개 or 60개 샘플
          ├── active_power (string)       // ⭐ 신규 (V3만)
          ├── reactive_power (string)     // ⭐ 신규 (V3만)
          ├── power_factor (string)       // ⭐ 신규 (V3만)
          │
          ├── freqArcCnt (int)
          ├── irmsArcCnt (int)
          ├── carbonArcCnt (int)
          └── irmsAmpere (float)
```

**장점:**
- ✅ ML 학습 데이터만 깔끔하게 분리
- ✅ 기존 시스템 (대시보드, API) 영향 없음
- ✅ 쿼리 단순화
- ✅ 스토리지 최적화 (필요한 데이터만)

**단점:**
- 🟡 Bucket 관리 포인트 증가

#### Option B: 기존 Bucket 유지 (비권장)

- Version별 데이터 혼재
- 쿼리 복잡도 증가
- ML 학습 시 필터링 필요

**→ Option A 권장!**

---

### 2.2 SQLite 재설계

#### Option A: 신규 테이블 생성 (권장 ⭐)

```sql
-- F_MSG_V3 테이블 (Version 3 전용)
CREATE TABLE F_MSG_V3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 디바이스 정보
    device_id TEXT NOT NULL,
    gateway_id TEXT,
    hardware_version TEXT DEFAULT 'v3',  -- 'v2' | 'v3'
    devType INTEGER,                      -- 20 or 32

    -- 이벤트 정보
    faultType INTEGER,
    event_hash TEXT UNIQUE,               -- ⭐ 중복 방지 (device_id + timestamp)

    -- 샘플링 메타 정보
    sample_count INTEGER,                 -- ⭐ 30 or 60
    sample_interval_ms REAL,              -- ⭐ 16.7 or 8.35

    -- 파형 데이터 (샘플 수 가변)
    irms TEXT,                            -- 콤마 구분 샘플
    vrms TEXT,                            -- ⭐ 신규 (V3)
    freq TEXT,                            -- 콤마 구분 샘플
    active_power TEXT,                    -- ⭐ 신규 (V3)
    reactive_power TEXT,                  -- ⭐ 신규 (V3)
    power_factor TEXT,                    -- ⭐ 신규 (V3)

    -- 아크 카운터
    freqArcCnt INTEGER,
    irmsArcCnt INTEGER,
    carbonArcCnt INTEGER,
    irmsAmpere REAL,

    -- 인덱스
    INDEX idx_device_timestamp (device_id, timestamp),
    INDEX idx_hardware_version (hardware_version),
    INDEX idx_fault_type (faultType),
    INDEX idx_event_hash (event_hash)
);

-- 기존 F_MSG 테이블은 유지 (레거시 호환)
-- F_MSG → Version 2 데이터
-- F_MSG_V3 → Version 3 데이터
```

**장점:**
- ✅ 버전별 데이터 명확히 분리
- ✅ 기존 시스템 영향 없음
- ✅ NULL 필드 없음 (V3 필드는 V3 테이블에만)

**단점:**
- 🟡 테이블 관리 포인트 증가
- 🟡 통합 조회 시 UNION 필요

#### Option B: 기존 테이블 확장 (비권장)

```sql
-- F_MSG 테이블에 컬럼 추가
ALTER TABLE F_MSG ADD COLUMN hardware_version TEXT DEFAULT 'v2';
ALTER TABLE F_MSG ADD COLUMN vrms TEXT;
ALTER TABLE F_MSG ADD COLUMN active_power TEXT;
ALTER TABLE F_MSG ADD COLUMN reactive_power TEXT;
ALTER TABLE F_MSG ADD COLUMN power_factor TEXT;
ALTER TABLE F_MSG ADD COLUMN sample_count INTEGER DEFAULT 30;
ALTER TABLE F_MSG ADD COLUMN sample_interval_ms REAL DEFAULT 16.7;
ALTER TABLE F_MSG ADD COLUMN event_hash TEXT UNIQUE;
```

**단점:**
- ❌ Version 2 데이터에 불필요한 NULL 필드
- ❌ 스키마 복잡도 증가

**→ Option A (신규 테이블) 권장!**

---

## 3. 중복 데이터 처리

### 3.1 문제 상황

```
아크 감지 → trip → fault_type=7 계속 전송 (복구 전까지)

예시:
00:00:03  fault_type=7, irms="5.1,5.2,..." ← 실제 아크
00:00:04  fault_type=7, irms="5.1,5.2,..." ← 중복
00:00:05  fault_type=7, irms="5.1,5.2,..." ← 중복
...
00:05:30  fault_type=7, irms="5.1,5.2,..." ← 중복
```

**ML 학습 시 문제:**
- 같은 이벤트가 수백 번 저장
- 학습 데이터 심각한 편향

### 3.2 해결 방안

#### Backend에서 중복 제거 (권장 ⭐)

```python
# MQTT 핸들러에서 중복 감지
last_fault_event = {}  # device_id → (faultType, timestamp)

def handle_mqtt_message(device_id, data):
    fault_type = data['faultType']

    # 중복 체크
    if device_id in last_fault_event:
        prev_fault_type, prev_time = last_fault_event[device_id]

        # 같은 디바이스의 연속된 fault_type=7
        if fault_type == 7 and prev_fault_type == 7:
            time_diff = (current_time - prev_time).total_seconds()

            # 5초 이내 동일 fault는 중복
            if time_diff < 5:
                print(f"[SKIP] Duplicate fault_type=7: {device_id}")
                return  # 저장 안 함

    # 신규 이벤트 저장
    save_to_db(device_id, data)
    last_fault_event[device_id] = (fault_type, current_time)
```

#### DB에서 중복 제거 (대안)

```sql
-- event_hash로 중복 방지
-- event_hash = hash(device_id + timestamp + irms)

INSERT OR IGNORE INTO F_MSG_V3 (
    device_id,
    timestamp,
    event_hash,
    ...
) VALUES (?, ?, ?, ...);
```

**→ Backend 중복 제거 권장!**

---

## 4. 데이터 파이프라인

### 4.1 현재 파이프라인

```
[MQTT Broker]
      ↓
[Backend MQTT Handler]
      ↓
[InfluxDB] arcBucket (모든 데이터 혼재)
[SQLite]   F_MSG (fault 데이터만)
```

### 4.2 신규 파이프라인 (제안)

```
[MQTT Broker]
      ↓
[Backend MQTT Handler]
      ↓
[버전 감지] device_id → v1 | v2 | v3
      ↓
      ├─ v1 (RD) → ❌ 무시
      ├─ v2 (x20, x70) → [InfluxDB] arcBucket (레거시)
      │                   [SQLite]   F_MSG
      │
      └─ v3 (x83, x90) → [중복 체크]
                              ↓
                         [InfluxDB] arcBucket_ml ⭐
                         [SQLite]   F_MSG_V3 ⭐
```

---

## 5. 마이그레이션 계획

### Phase 1: 준비 작업 (Version 3 출시 전)

| 작업 | 담당 | 기간 |
|------|------|------|
| InfluxDB arcBucket_ml 생성 | Backend | 1일 |
| SQLite F_MSG_V3 테이블 생성 | Backend | 1일 |
| 중복 제거 로직 구현 | Backend | 2일 |
| 버전 감지 로직 구현 | Backend | 1일 |
| 테스트 (Mock 데이터) | Backend | 2일 |

**총 예상 기간: 1주**

### Phase 2: Version 3 출시 후

| 작업 | 담당 | 기간 |
|------|------|------|
| 실제 V3 데이터 수집 시작 | - | - |
| 데이터 검증 | Backend + ML | 1주 |
| ML 파이프라인 연동 | ML | 2주 |

### Phase 3: 데이터 축적

- 최소 수집 기간: 3-6개월
- 목표: 다양한 시나리오 포함
- 실제 아크 이벤트 최소 100건 확보

---

## 6. 코드 구현 예시

### 6.1 Backend MQTT Handler

```python
# services/mqtt_handler.py

def on_message(client, userdata, msg):
    """MQTT 메시지 수신 핸들러"""
    data = json.loads(msg.payload)
    device_id = data['header']['src']
    op = data['header']['op']

    # 버전 감지
    version = detect_hardware_version(device_id)

    if version == 'v1':
        # RD 모델 → 무시
        return

    elif version == 'v2':
        # x20, x70 → 기존 로직
        if op == 'fault':
            save_to_f_msg(data)
        save_to_influxdb_legacy(data)

    elif version == 'v3':
        # x83, x90 → 신규 로직
        if is_duplicate_fault(device_id, data):
            logger.info(f"[SKIP] Duplicate fault: {device_id}")
            return

        # ML용 DB에 저장
        save_to_f_msg_v3(data)
        save_to_influxdb_ml(data)

def detect_hardware_version(device_id: str) -> str:
    """디바이스 ID로 하드웨어 버전 감지"""
    if device_id.startswith('EFPS'):
        return 'v1'
    elif device_id.startswith('IGWP'):
        # ❓ v2와 v3 구분 로직 필요
        # 임시: devType 또는 필드 유무로 판단
        return 'v2'  # 기본값
    return 'unknown'

def is_duplicate_fault(device_id, data):
    """
    같은 디바이스의 연속된 fault_type=7 중복 체크
    """
    cache_key = f"last_fault:{device_id}"
    last_event = cache.get(cache_key)

    if last_event:
        fault_type = data['data'].get('faultType')
        last_fault_type = last_event['faultType']
        time_diff = (current_time - last_event['timestamp']).total_seconds()

        # 5초 이내 동일 fault_type=7
        if fault_type == 7 and last_fault_type == 7 and time_diff < 5:
            return True

    # 캐시 업데이트
    cache.set(cache_key, {
        'faultType': data['data'].get('faultType'),
        'timestamp': current_time
    })

    return False

def save_to_influxdb_ml(data):
    """arcBucket_ml에 저장"""
    point = {
        "measurement": "afdd_waveform",
        "tags": {
            "device_id": data['header']['src'],
            "hardware_version": "v3",
            "fault_type": str(data['data']['faultType']),
        },
        "fields": {
            "sample_count": 60,
            "sample_interval_ms": 8.35,
            "irms": data['data']['irms'],
            "vrms": data['data'].get('vrms', ''),  # V3 신규 필드
            "freq": data['data']['freq'],
            "active_power": data['data'].get('active_power', ''),
            # ...
        }
    }
    influx_client_ml.write_points([point], bucket="arcBucket_ml")

def save_to_f_msg_v3(data):
    """F_MSG_V3 테이블에 저장"""
    cursor.execute("""
        INSERT INTO F_MSG_V3 (
            device_id, hardware_version, faultType,
            sample_count, sample_interval_ms,
            irms, vrms, freq, active_power, ...
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ...)
    """, (
        data['header']['src'],
        'v3',
        data['data']['faultType'],
        60,
        8.35,
        data['data']['irms'],
        data['data'].get('vrms', ''),
        data['data']['freq'],
        data['data'].get('active_power', ''),
        # ...
    ))
    conn.commit()
```

---

## 7. ML 데이터 추출 예시

### 7.1 InfluxDB 쿼리

```python
# ML 학습용 데이터 추출
query = f'''
    from(bucket: "arcBucket_ml")
    |> range(start: -6mo)
    |> filter(fn: (r) => r._measurement == "afdd_waveform")
    |> filter(fn: (r) => r.hardware_version == "v3")
    |> filter(fn: (r) => r.fault_type == "7")
'''

result = influx_client.query_api().query(query)
```

### 7.2 SQLite 쿼리

```python
# ML 학습용 데이터 추출
df = pd.read_sql_query("""
    SELECT
        device_id,
        timestamp,
        sample_count,
        irms,
        vrms,
        freq,
        active_power,
        freqArcCnt,
        irmsArcCnt
    FROM F_MSG_V3
    WHERE hardware_version = 'v3'
      AND faultType = 7
    ORDER BY timestamp
""", conn)

# 파형 데이터 파싱
df['irms_array'] = df['irms'].apply(lambda x: [float(v) for v in x.split(',')])
df['vrms_array'] = df['vrms'].apply(lambda x: [float(v) for v in x.split(',')])
```

---

## 8. 예상 효과

### Before (현재)

| 항목 | 상태 |
|------|------|
| 데이터 품질 | 🔴 낮음 (평균값만 존재) |
| ML 적합성 | 🔴 부적합 |
| 중복 이벤트 | 🔴 심각 (수백 건) |
| 쿼리 복잡도 | 🟡 중간 |

### After (재구성 후)

| 항목 | 상태 |
|------|------|
| 데이터 품질 | 🟢 높음 (60샘플 + 전압/전력) |
| ML 적합성 | 🟢 최적 |
| 중복 이벤트 | 🟢 제거됨 |
| 쿼리 복잡도 | 🟢 단순 (ML bucket 분리) |

---

## 9. 리스크 및 대응

| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|----------|
| Version 3 출시 지연 | 중 | 중 | Version 2 데이터로 초기 실험 |
| 필드명 변경 | 중 | 낮음 | 확장 가능한 파싱 로직 |
| 스토리지 부족 | 낮음 | 중 | 오래된 데이터 아카이빙 |
| 기존 시스템 영향 | 낮음 | 높음 | 별도 bucket/테이블 사용 |

---

## 10. 결론 및 제안

### 권장 사항

1. ✅ **InfluxDB**: arcBucket_ml 신규 생성
2. ✅ **SQLite**: F_MSG_V3 테이블 신규 생성
3. ✅ **Backend**: 중복 제거 로직 구현
4. ✅ **Backend**: 버전별 파이프라인 분리

### 예상 일정

| Phase | 기간 | 완료 조건 |
|-------|------|----------|
| Phase 1: 준비 | 1주 | DB 구조 완성, 테스트 통과 |
| Phase 2: 연동 | 1-2주 | Version 3 데이터 수집 시작 |
| Phase 3: 축적 | 3-6개월 | ML 학습 가능한 데이터셋 확보 |

### Next Steps

1. 이 계획서 검토 및 승인
2. Backend 개발 착수
3. Version 3 출시 시 즉시 적용

---

**문의 사항이나 추가 요구사항이 있으면 말씀해주세요!**

---

## 부록

### A. 용어 정리

| 용어 | 설명 |
|------|------|
| **RD 모델** | Version 1, Wi-Fi 내장, 생산중단 |
| **x20, x70, v30** | Version 2, RS-485, 30샘플 |
| **x83, x90** | Version 3, PLC, 60샘플 + 전압/전력 |
| **fault_type=7** | 아크 감지 이벤트 |
| **order** | 차단기 구분자 (1~32) |

### B. 참고 문서

- `HARDWARE_VERSIONS.md`: 하드웨어 버전 상세
- `DATA_SCHEMA.md`: 확장성 규칙
- `EXPERIMENT_PLAN.md`: ML 실험 계획

---

*최종 수정: 2026-01-09*
