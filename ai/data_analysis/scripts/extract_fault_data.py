#!/usr/bin/env python3
"""
Title: InfluxDB Fault 데이터 추출기
Purpose: IEC 62606 분석을 위한 fault 이벤트 데이터 추출
Author: 김승재
Usage: python scripts/extract_fault_data.py
"""

import sys
import os
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd

# 프로젝트 경로 추가 (백엔드 모듈 import용)
PROJECT_ROOT = Path(__file__).parent.parent.parent  # /home/jammy/projects/iot_v3_svn
BACKEND_PATH = PROJECT_ROOT / "dash" / "back"
sys.path.insert(0, str(BACKEND_PATH))

# 환경 변수 설정 (명시적 절대 경로)
ENV_FILE = PROJECT_ROOT / ".env"
os.environ["ENV_FILE"] = str(ENV_FILE)
print(f"📁 ENV_FILE: {ENV_FILE}")

from db.influxdb import influx
from utils.config import get_settings

# 출력 디렉토리
OUTPUT_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)


def extract_fault_data(days: int = 30) -> pd.DataFrame:
    """
    InfluxDB에서 fault 데이터 추출

    Args:
        days: 최근 N일 데이터 추출 (기본 30일)

    Returns:
        DataFrame: fault 이벤트 데이터
    """
    settings = get_settings()
    print(f"📡 InfluxDB 연결 중...")
    print(f"   Host: {settings.influx_host}:{settings.influx_port}")
    print(f"   Bucket: {settings.influx_bucket}")

    # Flux 쿼리: device='fault' 태그로 필터링
    query = f'''
        from(bucket: "{settings.influx_bucket}")
        |> range(start: -{days}d)
        |> filter(fn: (r) => r["device"] == "fault")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    '''

    print(f"🔍 쿼리 실행 중... (최근 {days}일)")

    try:
        # influx 싱글톤의 query_api 직접 사용
        if not influx.query_api:
            print("❌ InfluxDB 연결 안됨")
            return pd.DataFrame()

        result = influx.query_api.query(query, org=settings.influx_org)

        # 결과를 DataFrame으로 변환
        records = []
        for table in result:
            for record in table.records:
                row = {
                    'timestamp': record.get_time(),
                    'dev_id': record.values.get('_measurement'),
                    'voltage': record.values.get('voltage'),
                    'current': record.values.get('current'),
                    'power': record.values.get('power'),
                    'leakage': record.values.get('leakage'),
                    'freq': record.values.get('freq'),
                    'fault_type': record.values.get('fault_type'),
                    'temp': record.values.get('temp'),
                    'devType': record.values.get('devType'),
                    'irms_ampere': record.values.get('irms_ampere'),
                    'fault_freq': record.values.get('fault_freq'),
                    'fleakage': record.values.get('fleakage'),
                    'fThresh': record.values.get('fThresh'),
                }
                records.append(row)

        df = pd.DataFrame(records)
        print(f"✅ 추출 완료: {len(df)}개 레코드")

        return df

    except Exception as e:
        print(f"❌ 쿼리 실패: {e}")
        return pd.DataFrame()


def extract_all_data(days: int = 30) -> pd.DataFrame:
    """
    InfluxDB에서 모든 데이터 추출 (fault + normal)

    Args:
        days: 최근 N일 데이터 추출 (기본 30일)

    Returns:
        DataFrame: 전체 디바이스 데이터
    """
    settings = get_settings()
    print(f"📡 전체 데이터 추출 중... (최근 {days}일)")

    query = f'''
        from(bucket: "{settings.influx_bucket}")
        |> range(start: -{days}d)
        |> filter(fn: (r) => r["device"] == "fault" or r["device"] == "device1")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    '''

    try:
        if not influx.query_api:
            print("❌ InfluxDB 연결 안됨")
            return pd.DataFrame()
        result = influx.query_api.query(query, org=settings.influx_org)

        records = []
        for table in result:
            for record in table.records:
                row = {
                    'timestamp': record.get_time(),
                    'dev_id': record.values.get('_measurement'),
                    'device_tag': record.values.get('device'),  # 'fault' or 'device1'
                    'voltage': record.values.get('voltage'),
                    'current': record.values.get('current'),
                    'power': record.values.get('power'),
                    'leakage': record.values.get('leakage'),
                    'freq': record.values.get('freq'),
                    'fault_type': record.values.get('fault_type'),
                    'temp': record.values.get('temp'),
                    'devType': record.values.get('devType'),
                }
                records.append(row)

        df = pd.DataFrame(records)
        print(f"✅ 추출 완료: {len(df)}개 레코드")

        return df

    except Exception as e:
        print(f"❌ 쿼리 실패: {e}")
        return pd.DataFrame()


def save_to_csv(df: pd.DataFrame, filename: str) -> None:
    """DataFrame을 CSV로 저장"""
    if df.empty:
        print(f"⚠️ 데이터 없음, 저장 스킵")
        return

    filepath = OUTPUT_DIR / filename
    df.to_csv(filepath, index=False)
    print(f"💾 저장 완료: {filepath}")
    print(f"   - 레코드 수: {len(df)}")
    print(f"   - 컬럼: {list(df.columns)}")


def print_summary(df: pd.DataFrame) -> None:
    """데이터 요약 출력"""
    if df.empty:
        return

    print("\n" + "="*60)
    print("📊 데이터 요약")
    print("="*60)

    print(f"\n📅 기간: {df['timestamp'].min()} ~ {df['timestamp'].max()}")
    print(f"📝 총 레코드: {len(df)}")

    if 'dev_id' in df.columns:
        print(f"🔧 디바이스 수: {df['dev_id'].nunique()}")
        print(f"   디바이스 목록: {df['dev_id'].unique()[:10].tolist()}...")

    if 'fault_type' in df.columns:
        print(f"\n⚡ Fault Type 분포:")
        for ft, count in df['fault_type'].value_counts().items():
            print(f"   - Type {ft}: {count}건")

    if 'devType' in df.columns:
        print(f"\n📱 Device Type 분포:")
        for dt, count in df['devType'].value_counts().items():
            label = "RD모델" if dt == 'RD' else f"{dt}A Frame"
            print(f"   - {label}: {count}건")

    print("\n📈 수치 통계:")
    numeric_cols = ['voltage', 'current', 'power', 'leakage', 'freq', 'irms_ampere']
    for col in numeric_cols:
        if col in df.columns and df[col].notna().any():
            print(f"   {col}: min={df[col].min():.2f}, max={df[col].max():.2f}, mean={df[col].mean():.2f}")


def main():
    """메인 실행"""
    print("="*60)
    print("🔥 AFDD Fault 데이터 추출기")
    print("="*60)

    # 1. Fault 데이터만 추출 (IEC 62606 분석용)
    print("\n[1/2] Fault 데이터 추출...")
    fault_df = extract_fault_data(days=90)

    if not fault_df.empty:
        save_to_csv(fault_df, f"fault_data_{datetime.now().strftime('%Y%m%d')}.csv")
        print_summary(fault_df)

    # 2. 전체 데이터 추출 (비교 분석용) - 선택적
    # print("\n[2/2] 전체 데이터 추출...")
    # all_df = extract_all_data(days=30)
    # if not all_df.empty:
    #     save_to_csv(all_df, f"all_data_{datetime.now().strftime('%Y%m%d')}.csv")

    print("\n" + "="*60)
    print("✅ 완료!")
    print("="*60)


if __name__ == "__main__":
    main()
