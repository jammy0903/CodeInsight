# CodeInsight Android APK 빌드 가이드

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [프로젝트 설정](#프로젝트-설정)
3. [앱 이름 및 아이콘](#앱-이름-및-아이콘)
4. [AdMob 광고 설정](#admob-광고-설정)
5. [빌드 명령어](#빌드-명령어)
6. [릴리스 빌드 (서명)](#릴리스-빌드-서명)
7. [트러블슈팅](#트러블슈팅)

---

## 사전 요구사항

### 필수 소프트웨어

| 소프트웨어 | 최소 버전 | 확인 명령어 |
|-----------|----------|------------|
| Node.js | 18+ | `node -v` |
| pnpm | 8+ | `pnpm -v` |
| Java JDK | **21** (필수!) | `java -version` |
| Android SDK | 34 | Android Studio에서 확인 |

### Java 21 설치 (Ubuntu/WSL)

```bash
# Java 21 설치
sudo apt-get update
sudo apt-get install openjdk-21-jdk

# JAVA_HOME 환경 변수 설정 (~/.bashrc 또는 ~/.zshrc에 추가)
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# 설정 적용
source ~/.bashrc
```

> ⚠️ **중요**: AdMob 플러그인(`@capacitor-community/admob`)은 Java 21을 필수로 요구합니다. Java 17 이하에서는 빌드 실패!

### Android SDK 경로

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 프로젝트 설정

### capacitor.config.ts

```typescript
// 프로젝트 루트: /home/jammy/projects/cosine/CodeInsight/capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codeinsight.app',
  appName: 'CodeInsight',
  webDir: 'packages/frontend/dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

### 프론트엔드 환경변수

```env
# packages/frontend/.env
VITE_API_URL=https://c-osine-backend-5z56.onrender.com
VITE_API_VERSION=v1

# Firebase 설정
VITE_FIREBASE_API_KEY=REDACTED_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=code2u-78d63.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=code2u-78d63
# ... (나머지 Firebase 설정)

# FAL AI (이미지 생성)
VITE_FAL_API_KEY=b41b3efb-282b-414d-9518-d09f82bf4ea6:1a4ce6d827c44534a73ebbfdf6680df9
```

> ⚠️ **중요**: `VITE_API_URL`은 반드시 프로덕션 URL로 설정해야 합니다. `localhost`로 설정하면 APK에서 로그인 불가!

---

## 앱 이름 및 아이콘

### 앱 이름 (다국어 지원)

**기본 (영어)**: `android/app/src/main/res/values/strings.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">CodeInsight</string>
    <string name="title_activity_main">CodeInsight</string>
    <string name="package_name">com.codeinsight.app</string>
    <string name="custom_url_scheme">com.codeinsight.app</string>
</resources>
```

**한국어**: `android/app/src/main/res/values-ko/strings.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">코드인사이트</string>
    <string name="title_activity_main">코드인사이트</string>
</resources>
```

### 앱 아이콘

아이콘 위치:
```
android/app/src/main/res/
├── mipmap-hdpi/
│   ├── ic_launcher.png          (72x72)
│   └── ic_launcher_round.png    (72x72)
├── mipmap-mdpi/
│   ├── ic_launcher.png          (48x48)
│   └── ic_launcher_round.png    (48x48)
├── mipmap-xhdpi/
│   ├── ic_launcher.png          (96x96)
│   └── ic_launcher_round.png    (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png          (144x144)
│   └── ic_launcher_round.png    (144x144)
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png          (192x192)
│   └── ic_launcher_round.png    (192x192)
└── mipmap-anydpi-v26/
    ├── ic_launcher.xml          (Adaptive Icon)
    └── ic_launcher_round.xml
```

### 아이콘 생성 스크립트

```bash
# scripts/generate-icons.mjs 실행
node scripts/generate-icons.mjs

# 원본 이미지: assets/app-icon-512.png (최소 512x512, 권장 1024x1024)
```

---

## AdMob 광고 설정

### 광고 ID 정보

| 광고 유형 | App ID | Ad Unit ID |
|----------|--------|------------|
| 앱 ID | `ca-app-pub-3721093787850391~4699946570` | - |
| 배너 광고 | - | `ca-app-pub-3721093787850391/6180948588` |
| 보상형 광고 | - | `ca-app-pub-3721093787850391/4328810867` |

### AndroidManifest.xml 설정

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application ...>
    <!-- AdMob App ID -->
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-3721093787850391~4699946570"/>
</application>
```

### 프론트엔드 AdMob 서비스

```typescript
// packages/frontend/src/services/admob.ts

const AD_UNITS = {
  banner: 'ca-app-pub-3721093787850391/6180948588',
  rewarded: 'ca-app-pub-3721093787850391/4328810867',
  // 테스트 ID (개발 시 사용)
  // banner: 'ca-app-pub-3940256099942544/6300978111',
  // rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

// 사용법
import { showBannerAd, showRewardedAd } from '@/services/admob';

// 배너 광고 표시
await showBannerAd();

// 보상형 광고 표시 (사용자가 광고 시청 완료 시 보상 지급)
const result = await showRewardedAd();
if (result.rewarded) {
  // 보상 지급 로직
}
```

### 앱 시작 시 AdMob 초기화

```typescript
// packages/frontend/src/main.tsx
import { Capacitor } from '@capacitor/core';
import { initializeAdMob } from './services/admob';

// 네이티브 플랫폼에서만 초기화
if (Capacitor.isNativePlatform()) {
  initializeAdMob().catch(console.error);
}
```

---

## 빌드 명령어

### 개발 빌드 (디버그 APK)

```bash
# 1. 프론트엔드 빌드
cd /home/jammy/projects/cosine/CodeInsight
pnpm --filter frontend build

# 2. Capacitor 동기화
npx cap sync android

# 3. 디버그 APK 빌드
cd android
./gradlew assembleDebug

# APK 위치: android/app/build/outputs/apk/debug/app-debug.apk
```

### 빠른 빌드 (한 줄)

```bash
cd /home/jammy/projects/cosine/CodeInsight && \
pnpm --filter frontend build && \
npx cap sync android && \
cd android && ./gradlew assembleDebug
```

---

## 릴리스 빌드 (서명)

### 1. 키스토어 생성 (최초 1회)

```bash
keytool -genkey -v -keystore codeinsight-release.keystore \
  -alias codeinsight \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 키스토어 비밀번호와 키 비밀번호를 안전하게 보관!
```

### 2. 서명 설정

`android/app/build.gradle`에 추가:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../codeinsight-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'codeinsight'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. 릴리스 APK 빌드

```bash
cd android
./gradlew assembleRelease

# APK 위치: android/app/build/outputs/apk/release/app-release.apk
```

### 4. AAB 빌드 (Play Store용)

```bash
cd android
./gradlew bundleRelease

# AAB 위치: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 트러블슈팅

### 1. Java 버전 오류

**증상:**
```
Execution failed for task ':capacitor-community-admob:compileDebugJavaWithJavac'.
> error: invalid source release: 21
```

**해결:**
```bash
# Java 21 설치
sudo apt-get install openjdk-21-jdk

# JAVA_HOME 설정
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
```

### 2. Android Platform Not Added

**증상:**
```
[error] "android" platform has not been added yet
```

**해결:**
```bash
# 반드시 프로젝트 루트에서 실행!
cd /home/jammy/projects/cosine/CodeInsight
npx cap sync android
```

### 3. 로그인 안됨 (APK에서)

**원인:** `.env` 파일에 `VITE_API_URL=http://localhost:3002` 설정됨

**해결:**
```env
# packages/frontend/.env
VITE_API_URL=https://c-osine-backend-5z56.onrender.com
```

그 후 다시 빌드:
```bash
pnpm --filter frontend build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### 4. Gradle 빌드 캐시 문제

```bash
cd android
./gradlew clean
./gradlew assembleDebug --refresh-dependencies
```

### 5. SDK 라이선스 오류

```bash
yes | sdkmanager --licenses
```

---

## 빌드 체크리스트

### 릴리스 전 확인사항

- [ ] `VITE_API_URL`이 프로덕션 URL인지 확인
- [ ] AdMob ID가 테스트 ID가 아닌 실제 ID인지 확인
- [ ] 앱 버전 업데이트 (`android/app/build.gradle`의 `versionCode`, `versionName`)
- [ ] 키스토어 비밀번호 안전하게 보관
- [ ] ProGuard 설정 확인
- [ ] 개인정보처리방침 URL 설정 (Play Console)
- [ ] 이용약관 URL 설정 (Play Console)

### 빌드 후 테스트

- [ ] 앱 설치 및 실행
- [ ] OAuth 로그인 (Google/GitHub)
- [ ] 코드 실행 기능
- [ ] AI 질문 기능
- [ ] 배너 광고 표시
- [ ] 보상형 광고 동작

---

## 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|-----|------|---------|
| 2.3.2 | 2026-02-01 | Playground 헤더 모바일 최적화 - 줄바꿈, 폰트 축소 |
| 2.3.1 | 2026-02-01 | 메모리 뷰 overflow 수정 - 터치 확장형 트렁케이션 적용 |
| 2.3.0 | 2026-02-01 | 네이티브 Google 로그인, 자동 닉네임 생성, 뒤로가기 버튼 지원, UI 최적화 |
| 1.0.0 | 2026-02-01 | 최초 릴리스 빌드, AdMob 통합 |

---

## 관련 문서

- [Privacy Policy](https://github.com/jammy0903/CodeInsight/docs/privacy.html)
- [Terms & Conditions](https://github.com/jammy0903/CodeInsight/docs/terms.html)
- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [AdMob 통합 가이드](https://github.com/capacitor-community/admob)
