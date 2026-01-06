# CodeInsight 미래 계획

> 마지막 업데이트: 2026-01-06

---

## 모바일 앱 전환

### 추천: Capacitor (1순위)

**이유**:
- 기존 React 코드 100% 재사용
- 2-3주 내 iOS/Android 앱 출시 가능
- 단일 코드베이스로 웹/모바일 동시 유지보수

### 대안: PWA (2순위)

- 가장 빠른 배포 (1주 이내)
- iOS 제약 감수 가능하면 최선
- 앱 스토어 없이도 배포 가능

### 비추천: React Native

- 전체 코드 재작성 필요
- 개발 시간 3-6개월 추가

---

## Capacitor 적용 로드맵

### Phase 1: 준비 (1일)
- [ ] Capacitor, Ionic CLI 설치
- [ ] iOS/Android 개발 환경 설정

### Phase 2: 웹 앱 최적화 (3-5일)
- [ ] 반응형 디자인 점검
- [ ] 터치 이벤트 최적화
- [ ] 네비게이션 개선

### Phase 3: 네이티브 빌드 (2-3일)
- [ ] `npx cap init`
- [ ] iOS/Android 플랫폼 추가
- [ ] 앱 아이콘, 스플래시 이미지

### Phase 4: 네이티브 기능 (5-7일)
- [ ] 푸시 알림 (선택)
- [ ] 오프라인 저장 (선택)

### Phase 5: 배포 (3-5일)
- [ ] iOS App Store 심사
- [ ] Google Play Store 제출

**총 예상 기간**: 2-3주

---

## 진입 조건

- 웹 버전 안정화 완료
- DAU 100+ 달성
- 사용자 피드백에서 모바일 수요 확인

---

## 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/)
- [Ionic React 가이드](https://ionicframework.com/docs/react)
