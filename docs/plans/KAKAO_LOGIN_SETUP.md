# 카카오 로그인 설정 가이드

> Firebase OIDC Provider를 통한 카카오 로그인 연동

---

## 1. 개요

Firebase는 카카오를 기본 OAuth 프로바이더로 지원하지 않습니다.
**OIDC (OpenID Connect)** 프로바이더로 설정해야 합니다.

```
사용자 → 카카오 로그인 → Firebase OIDC → 백엔드 검증 → DB 저장
```

---

## 2. 카카오 개발자 설정

### 2.1 앱 생성

1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
2. **내 애플리케이션** → **애플리케이션 추가**
3. 앱 이름: `CodeInsight`
4. 사업자명: 개인 또는 회사명

### 2.2 플랫폼 등록

1. **앱 설정** → **플랫폼**
2. **Web 플랫폼 등록**
   - 사이트 도메인: `http://localhost:5174` (개발용)
   - 프로덕션: `https://your-domain.com`

### 2.3 카카오 로그인 활성화

1. **제품 설정** → **카카오 로그인**
2. **활성화 설정**: ON
3. **Redirect URI 등록**:
   ```
   https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler
   ```
   > Firebase 프로젝트 ID는 Firebase Console에서 확인

### 2.4 OpenID Connect 활성화

1. **제품 설정** → **카카오 로그인** → **보안**
2. **OpenID Connect 활성화**: ON
   > 이게 핵심! Firebase OIDC 연동에 필요

### 2.5 동의 항목 설정

1. **제품 설정** → **카카오 로그인** → **동의항목**
2. 필수 동의:
   - 닉네임: 선택
   - 프로필 사진: 선택
   - **카카오계정(이메일)**: 필수 (이메일 필요 시)

### 2.6 앱 키 확인

1. **앱 설정** → **앱 키**
2. 필요한 값:
   - **REST API 키**: Firebase OIDC 설정에 사용
   - **Client Secret**: 보안 → Client Secret 코드 생성 (활성화 필수)

---

## 3. Firebase Console 설정

### 3.1 OIDC 프로바이더 추가

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 → **Authentication** → **Sign-in method**
3. **새 제공업체 추가** → **OpenID Connect**

### 3.2 OIDC 설정값

| 필드 | 값 |
|------|-----|
| **공급자 ID** | `oidc.kakao` (코드와 일치해야 함) |
| **이름** | Kakao |
| **클라이언트 ID** | 카카오 REST API 키 |
| **발급자 URL** | `https://kauth.kakao.com` |
| **클라이언트 보안 비밀번호** | 카카오 Client Secret |

### 3.3 설정 확인

```
공급자 ID: oidc.kakao
이름: Kakao
클라이언트 ID: {REST_API_KEY}
발급자(issuer): https://kauth.kakao.com
클라이언트 보안 비밀번호: {CLIENT_SECRET}
```

---

## 4. 코드 구현 (이미 완료)

### 4.1 Firebase 서비스 (완료)

```typescript
// packages/frontend/src/services/firebase.ts
const kakaoProvider = new OAuthProvider('oidc.kakao');

export async function loginWithKakao(): Promise<User> {
  const result = await signInWithPopup(auth, kakaoProvider);
  return result.user;
}
```

### 4.2 UI 버튼 추가 필요

사이드바에 카카오 로그인 버튼 추가 필요 (아래 참조)

---

## 5. 트러블슈팅

### 5.1 "Invalid issuer" 에러

- **원인**: 발급자 URL이 잘못됨
- **해결**: `https://kauth.kakao.com` 정확히 입력

### 5.2 "Client secret mismatch" 에러

- **원인**: Client Secret이 일치하지 않음
- **해결**: 카카오 개발자 콘솔에서 Client Secret 재발급

### 5.3 "OpenID Connect is not enabled" 에러

- **원인**: 카카오 앱에서 OIDC 비활성화
- **해결**: 카카오 개발자 콘솔 → 보안 → OpenID Connect 활성화

### 5.4 Redirect URI 에러

- **원인**: 카카오에 등록된 Redirect URI 불일치
- **해결**: Firebase 프로젝트 ID로 정확한 URL 등록
  ```
  https://{PROJECT_ID}.firebaseapp.com/__/auth/handler
  ```

---

## 6. 환경별 설정

### 개발 환경 (localhost)

```
카카오 플랫폼 도메인: http://localhost:5174
Firebase Redirect: https://{PROJECT_ID}.firebaseapp.com/__/auth/handler
```

### 프로덕션 환경

```
카카오 플랫폼 도메인: https://your-domain.com
Firebase Redirect: https://{PROJECT_ID}.firebaseapp.com/__/auth/handler
```

---

## 7. 체크리스트

### 카카오 개발자 콘솔
- [ ] 앱 생성 완료
- [ ] Web 플랫폼 등록 (localhost + 프로덕션)
- [ ] 카카오 로그인 활성화
- [ ] Redirect URI 등록
- [ ] **OpenID Connect 활성화** ⭐
- [ ] 동의항목 설정 (이메일 등)
- [ ] Client Secret 생성

### Firebase Console
- [ ] OIDC 프로바이더 추가
- [ ] 공급자 ID: `oidc.kakao`
- [ ] 클라이언트 ID: REST API 키
- [ ] 발급자 URL: `https://kauth.kakao.com`
- [ ] Client Secret 입력

### 코드
- [x] `loginWithKakao()` 함수 (완료)
- [ ] 사이드바에 카카오 로그인 버튼 추가

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-12 | 초안 작성 |
