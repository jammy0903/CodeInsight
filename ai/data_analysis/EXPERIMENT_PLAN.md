# AFDD ML 실험 계획서

**프로젝트**: 아크 차단기(AFDD) Fault 데이터 분석 및 ML 모델 개발
**작성일**: 2026-01-08
**기준 표준**: IEC 62606 (KS C IEC 62606:2014)

---

## 1. 프로젝트 개요

### 1.1 목표
- AFDD fault 데이터에서 **아크 유형 분류** (Series vs Parallel)
- **위험도 예측** (LOW/MEDIUM/HIGH/CRITICAL)
- **이상 패턴 탐지** (정상 vs 비정상)
- 다양한 ML 모델 실험 후 **앙상블**로 최종 모델 구축

### 1.2 보유 데이터

| 필드 | 설명 | 형태 |
|------|------|------|
| `irms` | 전류 RMS 파형 | 30샘플, 16.7ms 간격 (500ms 윈도우) |
| `freq` | 주파수 파형 | 30샘플, 16.7ms 간격 (500ms 윈도우) |
| `freqArcCnt` | 주파수 기반 아크 카운트 | int |
| `irmsArcCnt` | 전류 기반 아크 카운트 | int |
| `carbonArcCnt` | 탄화 아크 카운트 | int |
| `devType` | 디바이스 타입 | 20 or 32 (Ampere) |
| `irmsAmpere` | RMS 전류값 | float |
| `timestamp` | 발생 시간 | datetime |

**핵심 발견**: 30샘플 × 16.7ms = **500ms** = IEC 62606 Table 3 측정 윈도우와 일치

---

## 2. 실험 Phase 구성

```
Phase 0: Raw 데이터 추출
    ↓
Phase 1: EDA (탐색적 데이터 분석)
    ↓
Phase 2: Feature Engineering
    ↓
Phase 3: 이상탐지 모델 실험
    ↓
Phase 4: 시계열 모델 실험
    ↓
Phase 5: 분류 모델 실험
    ↓
Phase 6: 앙상블 및 최종 모델
    ↓
Phase 7: XAI (설명 가능성) 분석
```

---

## 3. Phase 0: Raw 데이터 추출

### 3.1 목표
- **가공 없이** 모든 데이터를 원본 형태로 추출
- 분석 가능한 형태 (CSV, Parquet)로 저장

### 3.2 추출 대상

#### SQLite (F_MSG 테이블)
```python
# 모든 컬럼 추출
SELECT * FROM F_MSG
```

#### InfluxDB (시계열)
```python
# 전체 기간 센서 데이터
from(bucket: "arcBucket")
|> range(start: -1y)
|> filter(fn: (r) => r._measurement == "mqtt_data")
```

### 3.3 저장 형식
```
data_analysis/data/
├── raw_fmsg.csv          # F_MSG 원본
├── raw_fmsg.parquet      # 압축 버전
├── raw_influx.csv        # InfluxDB 원본
├── irms_waveforms.npy    # 30샘플 파형 배열
└── freq_waveforms.npy    # 30샘플 파형 배열
```

---

## 4. Phase 1: EDA (탐색적 데이터 분석)

### 4.1 기초 통계
- 샘플 수, 결측치, 이상치
- 각 필드 분포 (histogram, boxplot)
- devType별 (20A/32A) 비교

### 4.2 시계열 분석
- 시간별/일별/주별 fault 발생 패턴
- 계절성 확인

### 4.3 파형 시각화
- irms, freq 30샘플 파형 플롯
- 정상 vs fault 파형 비교

---

## 5. Phase 2: Feature Engineering

### 5.1 시간 도메인 Feature

| Feature | 공식 | 근거 |
|---------|------|------|
| `mean` | $\bar{x} = \frac{1}{n}\sum x_i$ | 기본 통계 |
| `std` | $\sigma = \sqrt{\frac{1}{n}\sum(x_i-\bar{x})^2}$ | 변동성 |
| `max`, `min` | - | 극값 |
| `peak_to_peak` | $max - min$ | 진폭 |
| `rms` | $\sqrt{\frac{1}{n}\sum x_i^2}$ | 실효값 |
| `crest_factor` | $\frac{max}{rms}$ | 피크 특성 |
| `skewness` | 3차 모멘트 | 비대칭도 |
| `kurtosis` | 4차 모멘트 | 첨도 |
| `zero_crossing_rate` | - | 신호 변화 |

**근거**: [MDPI Sensors 2024](https://www.mdpi.com/1424-8220/24/23/7628) - "time-domain, frequency-domain, energy, and spatial perspectives"

### 5.2 주파수 도메인 Feature

| Feature | 방법 | 근거 |
|---------|------|------|
| `fft_magnitude` | FFT | 주파수 성분 |
| `dominant_freq` | argmax(FFT) | 주 주파수 |
| `spectral_centroid` | 가중 평균 주파수 | 스펙트럼 중심 |
| `spectral_bandwidth` | 주파수 분산 | 대역폭 |
| `psd` | Power Spectral Density | 전력 분포 |

**근거**: [IET 2024](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/gtd2.13193) - "power spectral density determination"

### 5.3 시간-주파수 Feature

| Feature | 방법 | 장점 | 근거 |
|---------|------|------|------|
| `stft` | Short-Time Fourier Transform | 시간별 주파수 | [Academia](https://www.academia.edu/82656129/) |
| `cwt` | Continuous Wavelet Transform | 다중 스케일 | [Nature 2025](https://www.nature.com/articles/s41598-024-82025-2) |
| `wpt` | Wavelet Packet Transform | 세부 분해 | [Nature 2025](https://www.nature.com/articles/s41598-025-15583-8) |
| `gst` | Generalized S-Transform | bi-Gaussian window | [IET 2024](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/gtd2.13193) |

**핵심 논문 인용**:
> "Fault signals are characterized by sudden changes in waveform patterns, and the Discrete wavelet transform is uniquely suited to capture these discontinuities with high precision." - [Nature Scientific Reports 2025](https://www.nature.com/articles/s41598-024-82025-2)

### 5.4 아크 특화 Feature

| Feature | 설명 | 근거 |
|---------|------|------|
| `arc_count_total` | freqArcCnt + irmsArcCnt | IEC 62606 |
| `arc_ratio` | freqArcCnt / irmsArcCnt | 아크 유형 |
| `hurst_exponent` | 자기유사성 | [PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10856950/) |
| `inter_harmonic_var` | 고조파 간 분산 | H-I-W feature |
| `wavelet_energy` | 웨이블릿 에너지 | H-I-W feature |
| `mfcc` | Mel-Frequency Cepstral | [IEEE 2022](https://ieeexplore.ieee.org/document/9889731/) |

**핵심 논문 인용**:
> "Liu extracted the Hurst exponent, inter-harmonic variance and wavelet energy entropy (H-I-W) as the three-dimensional feature of the arc" - [PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10856950/)

---

## 6. Phase 3: 이상탐지 모델 실험

### 6.1 전통 ML 이상탐지

| 모델 | 특징 | 하이퍼파라미터 | 근거 |
|------|------|---------------|------|
| **Isolation Forest** | 빠름, 대용량 최적 | `n_estimators`, `contamination` | [원본 논문](https://www.lamda.nju.edu.cn/publication/tkdd11.pdf) |
| **One-Class SVM** | 정상 경계 학습 | `kernel`, `nu`, `gamma` | [ResearchGate 2024](https://www.researchgate.net/publication/381093327) |
| **LOF** | 밀도 기반 | `n_neighbors`, `contamination` | [scikit-learn](https://scikit-learn.org/0.20/auto_examples/plot_anomaly_comparison.html) |
| **Elliptic Envelope** | 가우시안 가정 | `contamination` | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2468227624003284) |

**벤치마크 결과 (논문 기반)**:
| 모델 | 장점 | 단점 |
|------|------|------|
| Isolation Forest | n>1000에서 최고 속도/정확도 | - |
| One-Class SVM | 소규모, 정상 우세 시 효과적 | 느림, 이상치 민감 |
| LOF | 비선형 분포 | 고차원 curse |

**핵심 인용**:
> "iForest compares favourably to all the other methods in terms of AUC and processing time. In particular, iForest is significantly faster than ORCA and SVM for large data sets where n > 1000." - [ACM TKDD](https://www.lamda.nju.edu.cn/publication/tkdd11.pdf)

### 6.2 딥러닝 이상탐지

| 모델 | 원리 | 근거 |
|------|------|------|
| **Autoencoder** | reconstruction error | [ScienceDirect 2024](https://www.sciencedirect.com/science/article/pii/S0743731524001151) |
| **LSTM-Autoencoder** | 시계열 reconstruction | [MDPI Energies 2024](https://www.mdpi.com/1996-1073/17/10/2340) |
| **VAE** | 확률적 reconstruction | [MDPI Sensors 2023](https://www.mdpi.com/1424-8220/23/5/2844) |
| **Hybrid AE+IF** | AE feature + IF 탐지 | [ResearchGate 2024](https://www.researchgate.net/publication/398320825) |

**성능 벤치마크**:
| 모델 | 데이터셋 | 성능 | 출처 |
|------|----------|------|------|
| LSTM-AE | Wind Turbine | **97%** 이상탐지 | [PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11086143/) |
| RAE (BiLSTM) | Power Electronics | Precision 91%, Recall 88% | [ScienceDirect 2022](https://www.sciencedirect.com/science/article/abs/pii/S1051200422003219) |
| Hybrid AE+IF | CIC IOT-DIAD 2024 | **0.99 accuracy** | [ResearchGate](https://www.researchgate.net/publication/398320825) |

**핵심 인용**:
> "The key premise is that an LSTM autoencoder trained on normal time series data will encode such data very efficiently. However, when anomalous data is fed to the network, the decoder will not be able to reconstruct this data properly." - [Medium](https://medium.com/@zhonghong9998/anomaly-detection-in-time-series-data-using-lstm-autoencoders-51fd14946fa3)

---

## 7. Phase 4: 시계열 모델 실험

### 7.1 전통 시계열 예측

| 모델 | 용도 | 하이퍼파라미터 | 근거 |
|------|------|---------------|------|
| **ARIMA** | 베이스라인 | `p`, `d`, `q` | [IJEER](https://ijeer.forexjournal.co.in/archive/volume-9/ijeer-090404.html) |
| **SARIMA** | 계절성 포함 | `P`, `D`, `Q`, `s` | [Energy Policy](https://www.sciencedirect.com/science/article/abs/pii/S0301421522003226) |
| **Prophet** | 계절성, 이벤트 | `seasonality_mode` | [Energy Policy](https://www.sciencedirect.com/science/article/abs/pii/S0301421522003226) |

### 7.2 딥러닝 시계열

| 모델 | 특징 | 근거 |
|------|------|------|
| **LSTM** | 장기 의존성 | [MDPI 2025](https://www.mdpi.com/1996-1073/18/2/278) |
| **GRU** | LSTM 경량화 | - |
| **Transformer** | Attention 기반 | [ACM 2024](https://dl.acm.org/doi/10.1145/3649448) |
| **Hybrid Prophet+LSTM** | 앙상블 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2352484721015067) |

**성능 비교 (논문 기반)**:
| 모델 | 장점 | 단점 | 출처 |
|------|------|------|------|
| ARIMA | 빠름, 단순 | 비선형 약함 | IJEER |
| Prophet | 계절성 우수 | 복잡한 패턴 약함 | Energy Policy |
| LSTM | 복잡한 패턴 | 트렌드 변화 느림 | MDPI 2025 |
| Hybrid | **R² 20% 향상** | 구현 복잡 | ScienceDirect |

**핵심 인용**:
> "Hybrid model outperformed ARIMA and standalone Prophet by up to 20% in R² scores, demonstrating broader applicability." - [MDPI Energies 2025](https://www.mdpi.com/1996-1073/18/2/278)

---

## 8. Phase 5: 분류 모델 실험

### 8.1 아크 감지 전용 아키텍처

| 모델 | 정확도 | 입력 | 근거 |
|------|--------|------|------|
| **1D CNN + LSTM** | 99.04% | raw waveform | [SPIE 2022](https://www.spiedigitallibrary.org/conference-proceedings-of-spie/12244/122444B/) |
| **CNN + Transformer** | 99.74% | 저주파+고주파 | [PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11511016/) |
| **GST + 2D CNN** | 98.13% | spectrogram | [IET 2024](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/gtd2.13193) |
| **LightGBM + ICEEMDAN** | - | extracted features | [ScienceDirect 2023](https://www.sciencedirect.com/science/article/abs/pii/S037877962300175X) |
| **Lightweight BP NN** | 99.27% | pulse feature | [MDPI 2024](https://www.mdpi.com/1996-1073/17/6/1412) |
| **ArcNet** | 99.47% | raw current @10kHz | [arXiv](https://arxiv.org/html/2311.16804v2) |

### 8.2 시계열 분류 아키텍처

| 모델 | 특징 | 벤치마크 | 근거 |
|------|------|----------|------|
| **OS-CNN** | 최적 커널 자동 선택 | UCR Archive | [Semantic Scholar](https://www.semanticscholar.org/paper/2ef9ce9bcd05c9734cb06638a92193f3ce2fb710) |
| **InceptionTime** | 멀티스케일 CNN | UCR/UEA | [ACM Survey](https://dl.acm.org/doi/10.1145/3649448) |
| **ROCKET** | 빠른 랜덤 커널 | UCR/UEA | [ACM Survey](https://dl.acm.org/doi/10.1145/3649448) |
| **PatchTCN** | Patch + Transformer | - | [ACM 2024](https://dl.acm.org/doi/10.1145/3711507.3711508) |

### 8.3 전통 ML 분류

| 모델 | 용도 |
|------|------|
| **Random Forest** | 베이스라인, feature importance |
| **XGBoost** | 성능 최적화 |
| **LightGBM** | 빠른 학습 |
| **SVM** | 소규모 데이터 |

---

## 9. Phase 6: 앙상블 전략

### 9.1 Voting

| 방법 | 설명 | 근거 |
|------|------|------|
| **Hard Voting** | 다수결 | [Frontiers 2025](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1623375/full) |
| **Soft Voting** | 확률 평균 | [TechScience](https://www.techscience.com/iasc/v36n3/51933/html) |
| **Weighted Voting** | 가중 평균 | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12455727/) |

**핵심 인용**:
> "Soft voting was the most effective ensemble strategy." - [TechScience](https://www.techscience.com/iasc/v36n3/51933/html)

### 9.2 Stacking

```
Level 0: [Isolation Forest, LSTM-AE, 1D CNN, XGBoost]
           ↓ predictions
Level 1: Meta-learner (Logistic Regression / XGBoost)
           ↓
        Final prediction
```

**근거**: [Frontiers 2025](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1623375/full) - "ensemble technique offers better accuracy (almost 100%)"

### 9.3 추천 앙상블 조합

| 조합 | 구성 | 기대 효과 |
|------|------|----------|
| **DRX** | Decision Tree + Random Forest + XGBoost | [PMC 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10781405/) |
| **RF + CNN** | Random Forest + CNN | Smart Grid 최적 |
| **XGBoost + LSTM** | 전통 + 딥러닝 | **0.984 AUC-ROC** [Nature](https://www.nature.com/articles/s41598-024-74822-6) |

---

## 10. Phase 7: XAI (설명 가능성)

### 10.1 Feature Importance

| 방법 | 특징 | 근거 |
|------|------|------|
| **SHAP** | 전역 + 로컬, 안정적 | [IEEE 2024](https://ieeexplore.ieee.org/document/10440604/) |
| **LIME** | 로컬 설명, 빠름 | [MDPI 2024](https://www.mdpi.com/1424-8220/24/11/3515) |
| **Permutation Importance** | 모델 불가지론적 | scikit-learn |

**비교**:
| 방법 | 장점 | 단점 | 출처 |
|------|------|------|------|
| SHAP | 전역 feature 순위 안정 | 느림 (1.8x LIME) | [MDPI Electronics](https://www.mdpi.com/2079-9292/14/22/4508) |
| LIME | 빠른 로컬 분석 | 전역 불안정 | [MDPI Electronics](https://www.mdpi.com/2079-9292/14/22/4508) |

**핵심 인용**:
> "SHAP computations required approximately 1.8 times more processing time than LIME per sample, but produced more stable global feature rankings." - [MDPI Electronics 2025](https://www.mdpi.com/2079-9292/14/22/4508)

---

## 11. 평가 지표

### 11.1 이상탐지

| 지표 | 공식 | 용도 |
|------|------|------|
| **Precision** | TP / (TP + FP) | 오탐 최소화 |
| **Recall** | TP / (TP + FN) | 미탐 최소화 |
| **F1-Score** | 2 × (P × R) / (P + R) | 균형 |
| **AUC-ROC** | ROC 곡선 아래 면적 | 전체 성능 |
| **AUC-PR** | PR 곡선 아래 면적 | 불균형 데이터 |

### 11.2 분류

| 지표 | 용도 |
|------|------|
| **Accuracy** | 전체 정확도 |
| **Confusion Matrix** | 클래스별 분석 |
| **Cohen's Kappa** | 우연 보정 |
| **Matthews Correlation** | 불균형 보정 |

### 11.3 시계열

| 지표 | 공식 |
|------|------|
| **MAE** | Mean Absolute Error |
| **RMSE** | Root Mean Square Error |
| **MAPE** | Mean Absolute Percentage Error |
| **R²** | 결정계수 |

---

## 12. Cross-Validation 전략

### 12.1 시계열 분할

```python
from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5)
```

**주의**: 미래 데이터 누수 방지

### 12.2 Stratified K-Fold

```python
from sklearn.model_selection import StratifiedKFold

skf = StratifiedKFold(n_splits=5, shuffle=True)
```

**용도**: 클래스 불균형 시

---

## 13. 실험 환경

### 13.1 Python 패키지

```bash
# 기본
pip install pandas numpy scipy matplotlib seaborn

# ML
pip install scikit-learn xgboost lightgbm catboost

# 딥러닝
pip install tensorflow keras torch

# 시계열
pip install statsmodels prophet pmdarima

# 신호처리
pip install pywt librosa  # wavelet, MFCC

# XAI
pip install shap lime

# 기타
pip install joblib tqdm
```

### 13.2 디렉토리 구조

```
data_analysis/
├── EXPERIMENT_PLAN.md      # 이 파일
├── README.md               # 프로젝트 개요
├── data/
│   ├── raw/                # 원본 데이터
│   └── processed/          # 전처리된 데이터
├── notebooks/
│   ├── 01_EDA.ipynb
│   ├── 02_Feature_Engineering.ipynb
│   ├── 03_Anomaly_Detection.ipynb
│   ├── 04_Time_Series.ipynb
│   ├── 05_Classification.ipynb
│   └── 06_Ensemble.ipynb
├── scripts/
│   ├── extract_data.py
│   ├── feature_engineering.py
│   ├── train_models.py
│   └── evaluate.py
├── models/
│   └── saved_models/
├── plots/
│   └── figures/
└── reports/
    └── results/
```

---

## 14. 참고 논문 목록

### 14.1 아크 감지 (Arc Fault Detection)

| # | 제목 | 저널 | 년도 | 링크 |
|---|------|------|------|------|
| 1 | Series-arc-fault diagnosis using feature fusion-based deep learning model | ETRI Journal | 2024 | [Link](https://onlinelibrary.wiley.com/doi/10.4218/etrij.2023-0457) |
| 2 | Research on Low-Voltage Arc Fault Based on CNN-Transformer | MDPI Sensors | 2024 | [Link](https://pmc.ncbi.nlm.nih.gov/articles/PMC11511016/) |
| 3 | Series arc-fault diagnosis using GST and CNN | IET GTD | 2024 | [Link](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/gtd2.13193) |
| 4 | Multi-branch AC arc fault detection based on ICEEMDAN and LightGBM | ScienceDirect | 2023 | [Link](https://www.sciencedirect.com/science/article/abs/pii/S037877962300175X) |
| 5 | Lightweight Arc Fault Detection Method | MDPI Energies | 2024 | [Link](https://www.mdpi.com/1996-1073/17/6/1412) |
| 6 | Arc fault detection using AI: Challenges and benefits | AIMS MBE | 2023 | [Link](https://www.aimspress.com/article/doi/10.3934/mbe.2023552) |
| 7 | Comprehensive Review from AI Perspective | arXiv | 2024 | [Link](https://arxiv.org/html/2311.16804v2) |
| 8 | Series AC Arc Fault Detection with High-Frequency CNN | MDPI Sensors | 2020 | [Link](https://www.mdpi.com/1424-8220/20/17/4910) |

### 14.2 이상탐지 (Anomaly Detection)

| # | 제목 | 저널 | 년도 | 링크 |
|---|------|------|------|------|
| 1 | Isolation Forest 원본 논문 | ACM TKDD | 2012 | [Link](https://www.lamda.nju.edu.cn/publication/tkdd11.pdf) |
| 2 | LSTM-Autoencoder for Electric Motor | MDPI Energies | 2024 | [Link](https://www.mdpi.com/1996-1073/17/10/2340) |
| 3 | LSTM-AE for Wind Turbine Vibration | PMC Sensors | 2024 | [Link](https://pmc.ncbi.nlm.nih.gov/articles/PMC11086143/) |
| 4 | Hybrid AE+IF for IoT | ResearchGate | 2024 | [Link](https://www.researchgate.net/publication/398320825) |
| 5 | Anomaly Detection in Smart Electric Grid | ScienceDirect | 2024 | [Link](https://www.sciencedirect.com/science/article/pii/S0743731524001151) |
| 6 | Unsupervised MTSAD for IoT | MDPI Sensors | 2023 | [Link](https://www.mdpi.com/1424-8220/23/5/2844) |

### 14.3 시계열 (Time Series)

| # | 제목 | 저널 | 년도 | 링크 |
|---|------|------|------|------|
| 1 | LSTM vs Prophet for Electricity Demand | MDPI Energies | 2025 | [Link](https://www.mdpi.com/1996-1073/18/2/278) |
| 2 | SARIMA, LSTM, Prophet Comparison | Energy Policy | 2022 | [Link](https://www.sciencedirect.com/science/article/abs/pii/S0301421522003226) |
| 3 | Hybrid Prophet-LSTM with BPNN | ScienceDirect | 2021 | [Link](https://www.sciencedirect.com/science/article/pii/S2352484721015067) |
| 4 | Deep Learning for TSC Survey | ACM Computing Surveys | 2024 | [Link](https://dl.acm.org/doi/10.1145/3649448) |
| 5 | Rethinking 1D-CNN for TSC | Semantic Scholar | 2020 | [Link](https://www.semanticscholar.org/paper/2ef9ce9bcd05c9734cb06638a92193f3ce2fb710) |

### 14.4 앙상블 (Ensemble)

| # | 제목 | 저널 | 년도 | 링크 |
|---|------|------|------|------|
| 1 | Ensemble Voting for IoT IDS | PMC | 2024 | [Link](https://pmc.ncbi.nlm.nih.gov/articles/PMC10781405/) |
| 2 | Voting and Stacking for Cloud IDS | Frontiers | 2025 | [Link](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1623375/full) |
| 3 | XGBoost + LSTM for IIoT | Nature SR | 2024 | [Link](https://www.nature.com/articles/s41598-024-74822-6) |
| 4 | Ensemble Voting for Smart Grid | TechScience | - | [Link](https://www.techscience.com/iasc/v36n3/51933/html) |

### 14.5 XAI (Explainable AI)

| # | 제목 | 저널 | 년도 | 링크 |
|---|------|------|------|------|
| 1 | SHAP/LIME for IDS on MLP | IEEE | 2024 | [Link](https://ieeexplore.ieee.org/document/10440604/) |
| 2 | XAI for Anomaly Detection in Autonomous Driving | MDPI Sensors | 2024 | [Link](https://www.mdpi.com/1424-8220/24/11/3515) |
| 3 | SHAP/LIME for Federated Learning IDS | MDPI Electronics | 2025 | [Link](https://www.mdpi.com/2079-9292/14/22/4508) |
| 4 | Perspective on SHAP and LIME | arXiv | 2024 | [Link](https://arxiv.org/html/2305.02012v3) |

### 14.6 Feature Engineering

| # | 제목 | 저널 | 년도 | 링크 |
|---|------|------|------|------|
| 1 | Wavelet Decomposition for Fault Detection | Nature SR | 2025 | [Link](https://www.nature.com/articles/s41598-024-82025-2) |
| 2 | CWT + CNN for Machine Fault | MDPI Electronics | 2024 | [Link](https://www.mdpi.com/2079-9292/13/2/452) |
| 3 | WPT + Deep Learning for Transmission Line | Nature SR | 2025 | [Link](https://www.nature.com/articles/s41598-025-15583-8) |
| 4 | FFT vs STFT vs Wavelet Comparison | Academia | - | [Link](https://www.academia.edu/82656129/) |

---

## 15. 체크리스트

### Phase 0: Raw 데이터 추출
- [ ] F_MSG 전체 추출
- [ ] InfluxDB 시계열 추출
- [ ] irms/freq 파형 배열화

### Phase 1: EDA
- [ ] 기초 통계
- [ ] 시계열 패턴
- [ ] 파형 시각화

### Phase 2: Feature Engineering
- [ ] 시간 도메인 feature
- [ ] 주파수 도메인 feature
- [ ] 시간-주파수 feature (CWT, WPT)
- [ ] 아크 특화 feature (H-I-W)

### Phase 3: 이상탐지
- [ ] Isolation Forest
- [ ] One-Class SVM
- [ ] LOF
- [ ] LSTM-Autoencoder
- [ ] Hybrid AE+IF

### Phase 4: 시계열
- [ ] ARIMA
- [ ] Prophet
- [ ] LSTM
- [ ] Hybrid Prophet+LSTM

### Phase 5: 분류
- [ ] 1D CNN + LSTM
- [ ] CNN + Transformer
- [ ] XGBoost
- [ ] LightGBM

### Phase 6: 앙상블
- [ ] Soft Voting
- [ ] Stacking
- [ ] 최종 모델 선정

### Phase 7: XAI
- [ ] SHAP 분석
- [ ] LIME 분석
- [ ] Feature Importance 보고서

---

## 16. MQTT 데이터 스키마 (2026-01-08 확정)

### 16.1 차단기 종류

| 종류 | prefix | 게이트웨이 | 설명 |
|------|--------|-----------|------|
| **RD** | `EFPS` | 없음 | 게이트웨이 거치지 않는 차단기 |
| **IGWP** | `IGWP` | 있음 | 게이트웨이 거치는 차단기 |

### 16.2 메시지 유형 (op 코드)

| op | 의미 | 조건 |
|----|------|------|
| `data` | 정상 데이터 | faultType=0 |
| `fault` | 아크 감지 이벤트 | ⭐ **30샘플 파형 포함** |
| `data` + faultType≠0 | 지속 장애 (persistent fault) | 한번 fault 후 안고쳐진 상태 |

> **참고**: 일부 장치는 fault 한번만 날리고 연결 끊음. 일부는 같은 fault를 계속 날림.

### 16.3 실제 MQTT 메시지 예시

#### RD 정상 데이터 (EFPS)

```json
{
  "header": {"op": "data", "src": "EFPS847207461C93"},
  "data": {
    "voltage": "221",
    "current": "0.7",
    "power": "0.76",
    "leakage": "0.000",
    "freq": "14",
    "iArcCnt": "0",
    "fArcCnt": "0",
    "faultType": "0"
  }
}
```

#### IGWP fault 데이터 (⭐ 30샘플 파형 포함!)

```json
{
  "header": {"op": "fault", "src": "IGWP8472077B14BB"},
  "data": {
    "order": "03",
    "faultType": "7",
    "freqArcCnt": "0",
    "irmsArcCnt": "0",
    "carbonArcCnt": "0",
    "irmsAmpere": "0",
    "irms": "0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0",
    "freq": "0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0"
  }
}
```

#### IGWP 지속 장애 (persistent fault)

```json
{
  "header": {"op": "data", "src": "IGWP8472077B1497"},
  "data": {
    "order": "18",
    "voltage": "0",
    "current": "0.0",
    "power": "0",
    "leakage": "0.0",
    "freq": "38671",
    "iArcCnt": "0",
    "fArcCnt": "0",
    "faultType": "2",
    "devType": "32",
    "temp": "+33"
  }
}
```

### 16.4 필드 정리

#### 공통 필드

| 필드 | RD | IGWP data | IGWP fault | 설명 |
|------|----|-----------|-----------:|------|
| `voltage` | ✅ | ✅ | ❌ | 전압 |
| `current` | ✅ | ✅ | ❌ | 전류 |
| `power` | ✅ | ✅ | ❌ | 전력 |
| `leakage` | ✅ | ✅ | ❌ | 누설전류 |
| `freq` | ✅ (단일값) | ✅ (단일값) | ✅ **(30샘플)** | 주파수 |
| `faultType` | ✅ | ✅ | ✅ | 고장 유형 코드 |
| `iArcCnt` | ✅ | ✅ | ❌ | 전류 아크 카운트 |
| `fArcCnt` | ✅ | ✅ | ❌ | 주파수 아크 카운트 |

#### IGWP fault 전용 필드 (⭐ ML 핵심 데이터)

| 필드 | 형태 | 설명 |
|------|------|------|
| `irms` | 30샘플 배열 | 전류 RMS 파형 (16.7ms 간격, 500ms 윈도우) |
| `freq` | 30샘플 배열 | 주파수 파형 (16.7ms 간격, 500ms 윈도우) |
| `freqArcCnt` | int | 주파수 기반 아크 검출 횟수 |
| `irmsArcCnt` | int | 전류 기반 아크 검출 횟수 |
| `carbonArcCnt` | int | 탄화 아크 검출 횟수 |
| `irmsAmpere` | float | RMS 전류값 |
| `order` | str | 디바이스 순서 번호 |

#### IGWP data 전용 필드

| 필드 | 설명 |
|------|------|
| `devType` | 20 or 32 (Ampere) |
| `temp` | 온도 (예: "+33") |

### 16.5 샘플링 정보

| 항목 | 값 | 비고 |
|------|-----|------|
| **1 샘플 간격** | 16.7ms | 60Hz 기준 한 사이클 |
| **전송 샘플 수** | 30개 | 500ms 구간 |
| **Nyquist 주파수** | ~30Hz | 30Hz 이상 주파수 분석 불가 |

**⭐ 핵심**: 30샘플 × 16.7ms = **500ms** = IEC 62606 Table 3 측정 윈도우와 정확히 일치!

### 16.6 수집 불가능 항목

| 항목 | 불가 이유 | 대안 |
|------|----------|------|
| `trip_time_ms` | 트립 시 전원 차단 → 전송 불가 | IEC 62606 인증 시험 데이터 참조 |
| `voltage` 샘플 | 아크 판단에 미사용 | irms + freq 조합 분석 |
| `arc_energy` | voltage 없어서 계산 불가 | 패턴 기반 위험도 분류 |

---

## 17. 아크 도메인 지식

### 17.1 Series vs Parallel 아크 특성

| 특성 | Series Arc | Parallel Arc |
|------|-----------|--------------|
| **전류 크기** | **1-5 amps** (부하에 의해 제한) | **50-100+ amps** (부하에 제한 없음) |
| **전류 경로** | 부하와 직렬 - 모든 전류가 부하 통과 | 부하와 병렬 - 직접 접지/다른 상으로 흐름 |
| **발생 원인** | 느슨한 단자, 부식, 오염된 연결부 | 절연 파괴, 외부 충격, 열손상 |
| **감지 난이도** | **어려움** (작은 전류, 미묘한 신호) | **상대적 용이** (큰 전류, 급격한 변화) |

**출처**: [Lectromec - Understanding series and parallel arcing](https://lectromec.com/understanding-series-and-parallel-arcing-for-aircraft-engineers/)

**핵심 인용**:
> "In a series arc, the arc comes from interruption in a single circuit, and so the load of that circuit limits the current... For a typical circuit using 20-gauge wire the current is limited to between **1 to 5 amps**."
>
> "In a parallel arc... the current can be between **50 and 100 amps or higher**."

### 17.2 IEC 62606 핵심 수치

#### 차단 시간 요구사항

| 항목 | 수치 | 출처 |
|------|------|------|
| IEC 62606 차단 요구 | **120ms 이내** | [Schneider Electric](https://blog.se.com/energy-management-energy-efficiency/energy-regulations/2013/07/09/iec-62606-a-first-step-towards-international-standards-for-arc-fault-protection/) |
| 기존 방식 (화재 발생) | 80-100ms | arXiv 리뷰 |
| 최신 감지 시스템 | 1.5-8ms | arXiv 리뷰 |

#### 에너지 임계값

| 항목 | 수치 | 의미 |
|------|------|------|
| **위험 에너지 임계값** | **100 Joules** | 이 이상이면 주변 물질로 화재 확산 가능 |

**출처**: [Schneider Electric](https://blog.se.com/energy-management-energy-efficiency/energy-regulations/2013/07/09/iec-62606-a-first-step-towards-international-standards-for-arc-fault-protection/)

**핵심 인용**:
> "The research eventually settled on a threshold beyond which the energy, or heat, generated by an arc should be considered dangerous. It was **100 joules**. This energy is high enough to spread fire to surrounding materials."

### 17.3 아크 온도 및 화재 통계

#### 온도

| 항목 | 수치 | 출처 |
|------|------|------|
| 아크 플래시 온도 범위 | 2,800°C ~ 19,000°C | Electricity Forum |
| 고에너지 아크 | ~35,000°C (번개 수준) | Sandia National Labs |
| 접합부 온도 | 1,000°C 이상 | 다수 논문 |

#### 화재 통계

| 항목 | 수치 | 출처 |
|------|------|------|
| 전기 화재 비율 | 전체 화재의 **30.2%** | [arXiv 리뷰](https://arxiv.org/html/2311.16804v2) |
| 아크 결함 원인 비율 | 미국 주거용 전기 화재의 **82%** | [arXiv 리뷰](https://arxiv.org/html/2311.16804v2) |
| 전압별 발화 확률 | 120V: 3.5% → 240V: **83%** | [arXiv 리뷰](https://arxiv.org/html/2311.16804v2) |

### 17.4 Incipient Fault (초기 결함) 감지

| 출처 | 내용 | 링크 |
|------|------|------|
| IEEE | 초기 결함 감지 방법론 - 관찰자와 예측기 조합 | [IEEE Xplore](https://ieeexplore.ieee.org/document/6981336) |
| IEEE | CUSUM 기반 통계적 감지 | [IEEE Xplore](https://ieeexplore.ieee.org/document/8216653/) |
| arXiv | HAVOK 비선형 동역학 기반 0.45ms 내 감지 | [arXiv](https://arxiv.org/html/2502.05846v2) |

**핵심 인용**:
> "The main objective is to detect anomalies or incipient faults in system components **as early as possible**. For many systems, early warnings contribute to increased system reliability, prevention of major component failures."

---

## 18. 검증된 주장 정리

### ✅ 검증됨 (전문 확인)

| 주장 | 근거 | 신뢰도 |
|------|------|--------|
| 100J 이상 아크 에너지 = 발화 위험 | IEC 62606 연구, Schneider Electric | ⭐⭐⭐⭐⭐ |
| Series 아크: 1-5A / Parallel 아크: 50-100A+ | Lectromec 기술 문서 | ⭐⭐⭐⭐⭐ |
| 120ms 이내 차단 필요 | IEC 62606 표준 | ⭐⭐⭐⭐⭐ |
| 아크 결함 = 전기 화재 주요 원인 (82%) | arXiv 리뷰 | ⭐⭐⭐⭐⭐ |

### ⚠️ 추가 검증 필요

| 주장 | 상태 |
|------|------|
| Pre-fault 신호로 아크 예측 가능 | 연구 진행 중, 테스트 데이터 필요 |

---

## 19. 도메인 레퍼런스

### 국제 표준

| 표준 | 설명 |
|------|------|
| **IEC 62606** | General requirements for arc fault detection devices (AFDDs) |
| **IEC 60364-4-42:2024** | Low-voltage electrical installations |
| **UL 1699** | Arc-Fault Circuit-Interrupters (US Standard) |

### 기술 문서 (전문 검증됨)

| 출처 | 제목 | 링크 |
|------|------|------|
| Schneider Electric | IEC 62606 표준 해설 | [Blog](https://blog.se.com/energy-management-energy-efficiency/energy-regulations/2013/07/09/iec-62606-a-first-step-towards-international-standards-for-arc-fault-protection/) |
| Lectromec | Series/Parallel 아크 특성 | [Article](https://lectromec.com/understanding-series-and-parallel-arcing-for-aircraft-engineers/) |

### 리뷰 논문 (오픈 액세스)

| 제목 | 년도 | 링크 |
|------|------|------|
| Advancements in Arc Fault Detection: Comprehensive Review from AI Perspective | 2024 | [arXiv:2311.16804v2](https://arxiv.org/html/2311.16804v2) |

### 학술 논문 (초록 확인)

| 제목 | 년도 | 링크 |
|------|------|------|
| Characteristics and fire-inducing risk analyses of arc faults | 2024 | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S037877962401085X) |
| Experimental research on thermal characteristic of low-voltage AC arc faults | 2022 | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0379711222002090) |

---

*최종 수정: 2026-01-08 (MQTT 데이터 스키마 업데이트)*
