# Android APK 생성 및 Google Play Store 출시 완벽 가이드

**Project**: C-OSINE (Code Execution Learning Platform)
**Target**: Android 15+ (API Level 35+)
**Distribution**: Google Play Store
**Updated**: 2025년 1월

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [개발 환경 설정](#2-개발-환경-설정)
3. [Capacitor 설치 및 초기화](#3-capacitor-설치-및-초기화)
4. [Android 프로젝트 생성](#4-android-프로젝트-생성)
5. [서명키(Keystore) 생성](#5-서명키keystore-생성)
6. [APK/AAB 빌드](#6-apkaab-빌드)
7. [Google Play Console 설정](#7-google-play-console-설정)
8. [내부 테스트](#8-내부-테스트)
9. [프로덕션 출시](#9-프로덕션-출시)
10. [출시 후 관리](#10-출시-후-관리)

---

## 1. 사전 준비

### 1.1 필수 계정 & 리소스

#### Google Play Developer 계정
```bash
# Google Play Console 접속
https://play.google.com/console

# 필요한 것:
- Google 계정 (지메일)
- 개발자 등록 비용: $25 (일회성)
- 유효한 결제 수단 (신용카드, 직불카드)
```

#### 개인정보 처리방침
C-OSINE은 다음 정보를 수집할 수 있으므로 반드시 필요:
- 사용자 인증 정보 (Firebase 이메일)
- 코드 실행 데이터
- 분석 데이터

**작성 예시**:
```
# C-OSINE 개인정보 처리방침

## 수집하는 정보
1. 계정 정보: 이메일 주소 (Firebase를 통한 인증)
2. 사용 데이터: 실행한 코드, 시뮬레이션 결과
3. 기기 정보: 기기 ID, OS 버전

## 사용 목적
- 서비스 제공 및 계정 관리
- 사용자 경험 개선
- 오류 분석 및 성능 모니터링

## 데이터 보호
- 모든 데이터는 Firebase 서버에 암호화되어 저장
- 제3자와 공유하지 않음
- 사용자는 언제든 계정 삭제 가능
```

이를 별도 웹페이지에 배포:
- GitHub Pages
- 간단한 HTML 페이지
- 또는 프로젝트 Wiki

### 1.2 스크린샷 준비

Google Play에 업로드할 스크린샷 (최소 2개, 권장 5개):

```
스크린샷 사양:
- 크기: 1440x2560 px (또는 다른 종횡비 가능)
- 형식: PNG 또는 JPEG
- 개수: 2~8개

준비할 스크린샷:
1. 로그인 화면
2. 메인 학습 대시보드
3. 코드 편집/실행 화면
4. 시뮬레이션 결과 화면
5. 기능 설명 화면
```

### 1.3 앱 정보 준비

```
앱 이름: C-OSINE
앱 ID (Bundle ID): com.cosine.codeinsight (unique)
버전: 1.0.0
앱 카테고리: 교육
앱 설명 (155자 이상):
  "C-OSINE은 개발자와 학생을 위한 코드 시뮬레이션 플랫폼입니다.
   JavaScript, Python, Java, C 코드를 실행하고 메모리 구조를
   시각화하여 프로그래밍 개념을 쉽게 이해할 수 있습니다."

단문 설명 (80자):
  "코드를 실행하고 시뮬레이션하는 학습 플랫폼"

개발자 연락처:
  이메일: support@cosine.app (또는 실제 이메일)
  웹사이트: https://cosine.app (또는 GitHub)
```

---

## 2. 개발 환경 설정

### 2.1 Android SDK 설치

#### macOS / Linux
```bash
# Homebrew를 통한 설치 (Mac)
brew install android-commandlinetools

# 또는 직접 설치
# https://developer.android.com/studio/command-line-tools
```

#### 환경 변수 설정
```bash
# ~/.bashrc 또는 ~/.zshrc에 추가

export ANDROID_HOME=$HOME/Library/Android/sdk  # Mac
# 또는
export ANDROID_HOME=$HOME/Android/Sdk          # Linux

export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH
export PATH=$ANDROID_HOME/emulator:$PATH
```

### 2.2 Java Development Kit (JDK) 설치

```bash
# JDK 17 이상 필요 (Capacitor 권장)
java -version  # 기존 설치 확인

# macOS - Homebrew로 설치
brew install openjdk@17

# Linux - apt로 설치
sudo apt-get install openjdk-17-jdk

# 설치 확인
javac -version
```

### 2.3 Android Studio 설치 (선택사항이지만 권장)

```bash
# Android Studio를 설치하면 다음이 자동으로 구성됨:
# - SDK Manager
# - AVD Manager (에뮬레이터)
# - Gradle

# 다운로드: https://developer.android.com/studio
```

### 2.4 환경 검증

```bash
# 설정 확인
android --version      # SDK 명령어
java -version          # JDK 버전
gradle --version       # Gradle (Capacitor에 의존)
```

---

## 3. Capacitor 설치 및 초기화

### 3.1 Capacitor 패키지 설치

```bash
cd /home/jammy/projects/C-OSINE

# 루트 디렉토리에서 실행
pnpm add -D @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 확인
pnpm list @capacitor/cli
```

### 3.2 Capacitor 프로젝트 초기화

```bash
pnpm exec cap init

# 대화형 입력 프롬프트:
# ? App name › C-OSINE
# ? App Package ID › com.cosine.codeinsight
# ? Which platform do you want to use? › android
```

생성되는 파일:
```
capacitor.config.ts
capacitor.config.json (또는 .ts)
```

### 3.3 capacitor.config.ts 상세 설정

```typescript
// packages/frontend/capacitor.config.ts 또는 루트의 capacitor.config.ts

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cosine.codeinsight',
  appName: 'C-OSINE',
  webDir: 'packages/frontend/dist',  // 빌드된 웹 파일 경로

  server: {
    androidScheme: 'https',
    cleartext: false,  // 프로덕션에서는 HTTPS만 허용
  },

  // Android 특정 설정
  android: {
    buildOptions: {
      keystorePath: './my-release-key.keystore',  // 나중에 설정
      keystorePassword: process.env.KEYSTORE_PASSWORD,  // 환경 변수
      keyAlias: 'my-key-alias',
      keyPassword: process.env.KEY_PASSWORD,
    },
  },

  // 플러그인 설정 (필요한 경우)
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,  // 스플래시 스크린 비활성화
    },
  },
};

export default config;
```

---

## 4. Android 프로젝트 생성

### 4.1 웹앱 빌드

```bash
# 프론트엔드 빌드 (필수!)
pnpm --filter @codeinsight/frontend build

# 빌드 결과 확인
ls packages/frontend/dist/
# index.html, assets/ 등이 있는지 확인
```

### 4.2 Android 프로젝트 추가

```bash
# 루트 디렉토리에서
pnpm exec cap add android

# 생성되는 디렉토리:
# android/
# ├── app/
# ├── build.gradle
# ├── gradle/
# ├── gradle.properties
# ├── settings.gradle
# └── gradlew
```

### 4.3 프로젝트 구조 확인

```
C-OSINE/
├── android/                    # ← Capacitor가 생성한 Android 프로젝트
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   ├── assets/       # 웹 파일
│   │   │   │   └── res/          # 아이콘, 스플래시 이미지
│   │   │   └── ...
│   │   └── build.gradle.kts
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── capacitor.config.ts
├── packages/
│   ├── frontend/
│   │   └── dist/               # ← 웹 빌드 파일
│   └── backend/
└── ...
```

### 4.4 Android 앱 아이콘 & 스플래시 설정

#### 앱 아이콘 준비

```
요구사항:
- 형식: PNG (투명 배경)
- 사이즈: 192x192 px 이상 (권장 512x512 px)
- 내용: C-OSINE 로고 또는 앱 아이콘

위치: android/app/src/main/res/mipmap-*/
  - mipmap-mdpi/ic_launcher.png (48x48)
  - mipmap-hdpi/ic_launcher.png (72x72)
  - mipmap-xhdpi/ic_launcher.png (96x96)
  - mipmap-xxhdpi/ic_launcher.png (144x144)
  - mipmap-xxxhdpi/ic_launcher.png (192x192)
```

#### AndroidManifest.xml 수정

```xml
<!-- android/app/src/main/AndroidManifest.xml -->

<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 필요한 권한 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:usesCleartextTraffic="false">

        <activity
            android:name="com.cosine.codeinsight.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 5. 서명키(Keystore) 생성

### 5.1 Keystore 파일 생성

```bash
cd /home/jammy/projects/C-OSINE

# 키스토어 생성 명령어
keytool -genkey -v -keystore my-release-key.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias my-key-alias \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD

# 대화형 입력 버전 (권장)
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# 프롬프트:
# Enter keystore password: [비밀번호 입력 - 기억하기!]
# Re-enter new password: [비밀번호 재확인]
# What is your first and last name? [이름]
# What is the name of your organizational unit? [부서 - Development]
# What is the name of your organization? [회사명 - C-OSINE Team]
# What is the name of your City or Locality? [도시명]
# What is the name of your State or Province? [도/주]
# What is the two-letter country code for this location? [국가 코드 - KR]
# Is CN=..., OU=..., O=..., L=..., ST=..., C=...? [확인 - yes]
#
# Enter key password (RETURN if same as keystore password): [엔터 또는 비밀번호]
```

### 5.2 Keystore 파일 확인

```bash
# 생성된 키스토어 확인
ls -la my-release-key.keystore

# 키스토어 정보 조회
keytool -list -v -keystore my-release-key.keystore

# 프롬프트:
# Enter keystore password: [위에서 입력한 비밀번호]
```

### 5.3 보안 - Keystore 파일 보호

```bash
# .gitignore에 추가 (Git에 올리면 안 됨!)
echo "my-release-key.keystore" >> .gitignore

# 파일 권한 제한 (선택사항)
chmod 600 my-release-key.keystore

# 비밀번호를 환경 변수로 설정
export KEYSTORE_PASSWORD="your_password_here"
export KEY_PASSWORD="your_password_here"
```

### 5.4 환경 변수 저장

```bash
# .env 파일에 추가 (이미 .gitignore 되어있는지 확인)
cat >> .env << EOF
KEYSTORE_PASSWORD=your_password_here
KEY_PASSWORD=your_password_here
KEYSTORE_PATH=./my-release-key.keystore
KEY_ALIAS=my-key-alias
EOF

# .env는 Git에 올리면 안 됨!
cat .gitignore | grep ".env"
```

---

## 6. APK/AAB 빌드

### 6.1 Gradle 설정 수정

```bash
# android/app/build.gradle.kts 또는 build.gradle 수정

android {
    namespace = "com.cosine.codeinsight"
    compileSdk = 35  // Android 15 (최신)

    defaultConfig {
        applicationId = "com.cosine.codeinsight"
        minSdk = 26  // Android 8.0+
        targetSdk = 35  // Android 15
        versionCode = 1  // 업데이트마다 증가
        versionName = "1.0.0"
    }

    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_PATH") ?: "my-release-key.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS") ?: "my-key-alias"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### 6.2 웹 파일 동기화

```bash
# 최신 웹 파일을 Android 프로젝트에 복사
pnpm exec cap sync android

# 또는 개별 파일만 복사
pnpm exec cap copy android
```

### 6.3 AAB (Android App Bundle) 빌드 - 권장

```bash
# Capacitor를 통한 빌드 (자동 서명)
pnpm exec cap build android --release

# 또는 Gradle로 직접 빌드
cd android
./gradlew bundleRelease

# 결과 파일:
# android/app/build/outputs/bundle/release/app-release.aab
```

### 6.4 APK 빌드 - 대체 옵션

```bash
# APK 빌드 (더 큰 파일 크기, 하위 호환성)
cd android
./gradlew assembleRelease

# 결과 파일:
# android/app/build/outputs/apk/release/app-release.apk
```

### 6.5 빌드 결과 확인

```bash
# AAB 파일 확인
ls -lh android/app/build/outputs/bundle/release/
# app-release.aab (권장) - 약 5~20MB

# APK 파일 확인
ls -lh android/app/build/outputs/apk/release/
# app-release.apk (대체) - 약 15~50MB

# 파일 크기 최적화 팁:
# - Proguard 활성화 (코드 최소화)
# - 불필요한 리소스 제거
# - 이미지 최적화
```

### 6.6 빌드 실패 시 해결

#### 에러 1: Keystore 관련
```
Error: Keystore file not found

해결:
- my-release-key.keystore 파일이 있는지 확인
- KEYSTORE_PATH 환경 변수 설정 확인
- 절대 경로로 지정
```

#### 에러 2: Gradle 빌드 실패
```
Error: Could not determine the dependencies...

해결:
pnpm exec cap sync android  # 파일 재동기화
cd android
./gradlew clean
./gradlew bundleRelease
```

#### 에러 3: API 레벨 불일치
```
Error: compileSdkVersion 35 is not available

해결:
pnpm exec cap update android  # Capacitor 업데이트
# 또는 Android SDK Manager에서 필요한 API 레벨 설치
```

---

## 7. Google Play Console 설정

### 7.1 개발자 계정 등록

```
1. https://play.google.com/console 접속
2. Google 계정으로 로그인
3. "개발자 계정 만들기" 클릭
4. 개발자 이름, 국가, 약관 동의
5. 결제 ($25)
6. 등록 완료 (2~3일 소요)
```

### 7.2 앱 프로젝트 생성

```
1. Google Play Console 홈 > "새 앱 만들기"
2. 앱 이름: C-OSINE
3. 기본 카테고리: 교육
4. 앱 유형: 애플리케이션 (웹앱 아님)
5. "만들기" 클릭
```

### 7.3 앱 설정 - 기본 정보

#### 앱 정보 탭

```
앱 이름: C-OSINE
단문 설명: 코드를 실행하고 시뮬레이션하는 학습 플랫폼

정식 설명 (최소 155자):
"C-OSINE은 개발자와 학생을 위한 혁신적인 코드 시뮬레이션 플랫폼입니다.
JavaScript, Python, Java, C 코드를 실행하고 메모리 구조를 시각화하여
프로그래밍 개념을 깊이 있게 이해할 수 있습니다.

주요 기능:
• 실시간 코드 실행 및 결과 확인
• 메모리 흐름 시각화 (변수, 함수, 메모리 상태)
• 단계별 코드 시뮬레이션
• 다양한 프로그래밍 언어 지원
• 학습자 친화적 인터페이스

C-OSINE과 함께 프로그래밍의 기초를 탄탄히 다지세요!"

개발자 웹사이트: https://github.com/jammy0903/C-OSINE (또는 실제 웹사이트)
개발자 이메일: [실제 이메일]
```

#### 개인정보 처리방침

```
개인정보 처리방침 URL: https://example.com/privacy
(앞서 준비한 개인정보 처리방침 페이지)

필수입니다! 승인 거부 사유 #1입니다.
```

### 7.4 앱 설정 - 콘텐츠 등급

```
1. "콘텐츠 등급 설정" 클릭
2. IARC 등급 시스템 선택
3. 질문 응답:
   - 폭력: 아니오
   - 모욕적 언어: 아니오
   - 성인 콘텐츠: 아니오
   - 기타: 해당 사항 없음
4. 등급: 3+ (또는 해당 국가 등급)
```

### 7.5 앱 설정 - 대상 대상자

```
대상 연령층: 13~17 또는 18세 이상 (성인 참여 가능)
카테고리: 교육
콘텐츠 등급: 모든 연령

금지 사항:
- 스팸 / 클릭 유도성 콘텐츠
- 개인 정보 수집 (본인 계정만 가능)
- 보안 위협
```

### 7.6 앱 설정 - 스크린샷 & 기능 그래픽

```
핸드폰 스크린샷 (4.7~5.1인치):
- 최소 2개, 최대 8개
- 크기: 1440x2560 px 권장
- PNG 또는 JPEG

파일명 예시:
1_main-dashboard.png
2_code-editor.png
3_memory-visualization.png
4_simulation-results.png

특색 그래픽 (옵션):
- 크기: 1024x500 px
- 앱 주요 기능을 시각적으로 표현
- Play Store 카테고리 페이지에 표시
```

---

## 8. 내부 테스트

### 8.1 테스트 트랙 설정

```
1. Google Play Console > "테스트" > "내부 테스트"
2. "내부 테스트 트랙 만들기" 클릭
3. 테스트 이름: "Alpha Testing" 또는 "QA"
```

### 8.2 테스트 APK/AAB 업로드

```
1. "릴리스 만들기" 클릭
2. APK/AAB 파일 업로드
   - app-release.aab 또는 app-release.apk
3. 릴리스 이름: v1.0.0-alpha
4. 릴리스 노트:
   "첫 번째 내부 테스트 빌드
   • 모든 기본 기능 테스트 완료
   • 코드 실행 및 시뮬레이션 정상 작동"
5. "검토 후 진행" > "롤아웃" 클릭
```

### 8.3 테스터 초대

```
1. Google Play Console > "테스트" > "내부 테스트"
2. "테스트 관리 및 초대" 섹션
3. 테스터 이메일 추가:
   - 회사 동료
   - 친구/가족
   - 온라인 커뮤니티 (Reddit, Discord 등)

최소 요구사항:
- 20명 이상의 테스터
- 14일 이상의 테스트 기간
- 테스트 기간 동안 앱 삭제 금지

테스트 체크리스트:
□ 로그인/회원가입 정상 작동
□ 코드 입력 및 실행
□ 여러 언어 (JS, Python, Java, C) 지원
□ 메모리 시각화 정확성
□ 화면 회전 (가로/세로)
□ 오프라인 모드 (가능하면)
□ 충돌/에러 없음
□ 성능 (로딩 시간, 반응성)
□ UI/UX 사용성
```

### 8.4 피드백 수집

```
테스터에게 피드백 양식 제공:

1. 앱 기능이 예상대로 작동하는가?
   □ 예 □ 아니오 (설명하세요)

2. 발견한 버그나 오류가 있는가?
   - 어떤 상황에서 발생했는가?
   - 재현 가능한가?

3. UI/UX 개선 사항:
   - 어떤 부분이 불편했는가?
   - 개선 아이디어

4. 전반적 만족도:
   - 5점 만점 평가
   - 개선 의견
```

### 8.5 피드백 반영 및 업데이트

```
테스트 중 발견된 버그 수정 후:

1. 웹앱 수정:
   pnpm --filter @codeinsight/frontend build

2. Android 재동기화:
   pnpm exec cap sync android

3. 새 빌드 생성:
   cd android && ./gradlew bundleRelease

4. Google Play Console에서 업로드:
   - 새 버전 생성
   - AAB 파일 업로드
   - 릴리스 노트 작성
```

---

## 9. 프로덕션 출시

### 9.1 준비 사항 최종 체크

```
테스트 완료 후:

☑️ 내부 테스트: 14일 이상, 20명 이상 테스터
☑️ 주요 버그 수정
☑️ 개인정보 처리방침 페이지 운영
☑️ 스크린샷 및 그래픽 업로드
☑️ 앱 설명 및 메타데이터 완성
☑️ 앱 아이콘 및 배너 준비
☑️ 타겟 API 레벨 35 (Android 15) 이상
☑️ 출시 노트 준비
```

### 9.2 프로덕션 릴리스 생성

```
1. Google Play Console > "출시" > "프로덕션"
2. "새 릴리스 만들기" 클릭
3. APK/AAB 업로드
   - app-release.aab (권장)
4. 버전 이름: v1.0.0
5. 버전 코드: 1 (자동)
6. 출시 노트 작성:

   "🎉 C-OSINE v1.0.0 출시!

   주요 기능:
   • JavaScript, Python, Java, C 코드 실행
   • 실시간 메모리 구조 시각화
   • 단계별 코드 시뮬레이션
   • Firebase를 통한 계정 관리

   개선 사항:
   • UI/UX 개선
   • 성능 최적화
   • 버그 수정"
```

### 9.3 앱 출시 승인

```
1. "검토 및 업로드" 클릭
2. 모든 항목 확인:
   ✓ APK/AAB 파일
   ✓ 권한 검토
   ✓ 콘텐츠 등급
   ✓ 개인정보 처리방침
   ✓ 타겟 API 레벨
3. "출시" 버튼 클릭
4. **심사 시작** (보통 2~24시간)
```

### 9.4 심사 진행 모니터링

```
Google Play Console에서:
1. 출시 상태 확인
   - "검토 중" (2~24시간)
   - "승인됨" (자동 배포)
   - "거부됨" (사유 확인 후 수정)

승인 거부 사유 (빈번한 경우):
1. 개인정보 처리방침 누락/부정확
   → 명확한 정책 페이지 추가

2. 콘텐츠 등급 미설정
   → IARC 설문 완료

3. API 레벨 미충족
   → targetSdkVersion을 35 이상으로 수정

4. 앱 기능 미설명
   → 스크린샷 및 설명 추가

5. 권한 남용
   → 불필요한 권한 제거

수정 후 재제출:
- 같은 릴리스에 파일만 다시 업로드 가능
- 또는 새로운 버전 생성
```

### 9.5 출시 성공

```
"✅ 승인됨" 상태가 되면:
1. Google Play Store에 자동 배포 (수분 내)
2. 검색 및 다운로드 가능
3. Play Store 링크 생성:
   https://play.google.com/store/apps/details?id=com.cosine.codeinsight

축하합니다! 🎉
C-OSINE이 구글 플레이 스토어에 출시되었습니다!
```

---

## 10. 출시 후 관리

### 10.1 출시 후 모니터링

```
Google Play Console에서 주기적으로 확인:

1. 설치 및 제거 추이
   - 일일 활성 사용자 수
   - 제거율 (낮을수록 좋음)

2. 사용자 리뷰 및 평점
   - 평균 평점 목표: 4.0 이상
   - 부정 리뷰에 대한 응답 작성

3. 성능 지표
   - 충돌율 (0%에 가까울수록 좋음)
   - ANR (응답 없음) 비율
   - 느린 렌더링

4. 지역별 설치
   - 어느 국가에서 많이 설치되는가?
   - 언어 선택
```

### 10.2 업데이트 배포

#### 마이너 업데이트 (버그 수정)
```bash
# 1. 프론트엔드 수정
pnpm --filter @codeinsight/frontend build

# 2. Android 동기화
pnpm exec cap sync android

# 3. 빌드
cd android && ./gradlew bundleRelease

# 4. 배포
# Google Play Console > 프로덕션 > 새 릴리스
# - app-release.aab 업로드
# - versionCode 증가 (1 → 2)
# - versionName: 1.0.1
# - 출시 노트: 버그 수정 내용
```

#### 메이저 업데이트 (새 기능)
```
versionCode: 2 → 3
versionName: 1.0.1 → 1.1.0

변경 사항:
• 새로운 프로그래밍 언어 지원
• 새로운 학습 기능
• UI 재설계
• 성능 개선
```

### 10.3 사용자 리뷰 대응

```
부정 리뷰 예시:
⭐⭐ "Python 코드가 실행 안 됨"

대응 방법:
1. 상세한 응답 작성
   "문의해주셔서 감사합니다. 어떤 상황에서 발생하는지
   support@cosine.app으로 연락주세요. 최대한 빨리 지원하겠습니다."

2. 직접 연락 (이메일로)
   - 문제 원인 파악
   - 해결책 제시
   - 업데이트 안내

3. 긍정적 리뷰로 전환
```

### 10.4 정기적 유지보수

```
주간:
- 사용자 피드백 확인
- 충돌 보고서 검토
- 긴급 버그 대응

월간:
- 성능 지표 분석
- 사용자 리뷰 요약
- 업데이트 계획

분기:
- 새 기능 추가 고려
- API 레벨 업데이트
- 보안 패치 확인
```

### 10.5 안보 및 규정 준수

```
2025년 Google Play 정책:

1. 개인정보 보호
   - 데이터 암호화 (HTTPS)
   - 사용자 동의 (Firebase 인증)
   - 데이터 삭제 기능

2. 콘텐츠 정책
   - 스팸/클릭 유도 금지
   - 악성 앱/멀웨어 금지
   - 허위 정보 금지

3. 대상 API 레벨
   - 새 앱: API 35 (Android 15) 필수
   - 기존 앱 업데이트: API 34 이상

4. 정기 심사
   - 주기적으로 정책 준수 여부 확인
   - 위반 시 경고 → 삭제
```

---

## 부록

### A. 명령어 요약

```bash
# 1. 개발 환경 설정
java -version
android --version

# 2. Capacitor 설정
pnpm add -D @capacitor/core @capacitor/cli @capacitor/android
pnpm exec cap init

# 3. Android 프로젝트 생성
pnpm --filter @codeinsight/frontend build
pnpm exec cap add android

# 4. 서명키 생성
keytool -genkey -v -keystore my-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# 5. 빌드
pnpm exec cap sync android
cd android && ./gradlew bundleRelease

# 6. 배포 (Google Play Console에서 수동 업로드)
```

### B. 파일 체크리스트

```
필수 파일:
☑️ my-release-key.keystore (Git 무시)
☑️ capacitor.config.ts
☑️ android/app/src/main/AndroidManifest.xml
☑️ android/app/src/main/res/mipmap-*/ic_launcher.png

지원 문서:
☑️ 개인정보 처리방침 (웹페이지)
☑️ 앱 설명 (155자+)
☑️ 스크린샷 (최소 4개)
☑️ 출시 노트
```

### C. 테스트 기기에 설치

```bash
# 개발 중 테스트 APK 설치
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 또는 실제 기기 연결 후:
cd android
./gradlew installDebug
```

### D. 문제 해결

| 문제 | 해결책 |
|------|--------|
| 빌드 실패 | `./gradlew clean` 후 재빌드 |
| APK 누락 | `pnpm exec cap sync android` 실행 |
| 서명 에러 | Keystore 경로 및 비밀번호 확인 |
| 심사 거부 | 개인정보 처리방침 및 콘텐츠 등급 확인 |
| 앱 충돌 | Android Studio의 Logcat에서 로그 확인 |

---

## 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com)
- [Android 개발 가이드](https://developer.android.com)
- [Google Play Console 헬프](https://support.google.com/googleplay)
- [Google Play 정책](https://play.google.com/about/developer-content-policy/)

---

**마지막 업데이트**: 2025년 1월
**작성자**: C-OSINE 팀
**상태**: 완료 및 배포 준비 완료
