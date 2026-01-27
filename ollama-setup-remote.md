# 🏠 원격 Ollama 설정 가이드 (집 노트북)

---

## 📋 **노트북 설정 (Ollama 서버)**

### **1. Ollama 외부 접근 허용**

#### **Linux 노트북:**
```bash
# systemd 서비스 편집
sudo systemctl edit ollama.service

# 아래 내용 추가:
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"

# 저장 후 재시작
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

#### **Windows 노트북:**
```powershell
# 환경 변수 설정 (시스템 속성 > 환경 변수)
OLLAMA_HOST=0.0.0.0:11434

# 또는 PowerShell에서:
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "User")

# Ollama 재시작 (작업 관리자에서 Ollama 종료 후 다시 실행)
```

#### **macOS 노트북:**
```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가
export OLLAMA_HOST=0.0.0.0:11434

# 적용
source ~/.zshrc

# Ollama 재시작
killall ollama
ollama serve
```

---

### **2. 노트북 IP 주소 확인**

#### **Linux:**
```bash
# 내부 IP 확인
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1

# 또는
hostname -I | awk '{print $1}'
```

#### **Windows:**
```powershell
ipconfig | findstr IPv4
```

#### **macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
```

**예상 결과:**
```
192.168.0.100  (집 내부 IP)
```

---

### **3. 방화벽 설정**

#### **Linux (ufw):**
```bash
# Ollama 포트 열기
sudo ufw allow 11434/tcp
sudo ufw status
```

#### **Windows 방화벽:**
```
1. Windows 방화벽 > 고급 설정
2. 인바운드 규칙 > 새 규칙
3. 포트 > TCP > 특정 포트: 11434
4. 연결 허용 > 확인
```

#### **macOS 방화벽:**
```bash
# 시스템 설정 > 네트워크 > 방화벽
# Ollama 앱 허용
```

---

### **4. Ollama 모델 다운로드 (사전 준비)**

```bash
# 노트북에서 모델 미리 다운로드
ollama pull qwen2.5-coder:7b

# 다운로드 확인
ollama list
```

---

### **5. 테스트 (노트북에서)**

```bash
# 로컬 테스트
curl http://localhost:11434/api/tags

# 외부 접근 테스트 (노트북 IP 사용)
curl http://192.168.0.100:11434/api/tags
```

**성공 응답:**
```json
{"models":[{"name":"qwen2.5-coder:7b",...}]}
```

---

## 🌐 **프로덕션 서버 설정**

### **방법 1: 집 IP가 고정 공인 IP인 경우**

#### **a. 공인 IP 확인**
```bash
# 노트북에서 공인 IP 확인
curl ifconfig.me
# 예: 123.45.67.89
```

#### **b. 라우터 포트포워딩 설정**
```
라우터 설정 페이지 접속 (예: 192.168.0.1)
→ 포트포워딩 설정
→ 외부 포트: 11434
→ 내부 IP: 192.168.0.100 (노트북 IP)
→ 내부 포트: 11434
→ 저장
```

#### **c. .env.production 수정**
```bash
# Docker 서버의 .env.production
OLLAMA_URL=http://123.45.67.89:11434
```

---

### **방법 2: 터널링 사용 (동적 IP 또는 방화벽 있는 경우) ✅ 추천**

#### **Option A: Cloudflare Tunnel (무료)**

**노트북에서:**
```bash
# Cloudflare Tunnel 설치
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# 로그인
cloudflared tunnel login

# 터널 생성
cloudflared tunnel create ollama-tunnel

# 터널 실행
cloudflared tunnel --url http://localhost:11434
```

**출력:**
```
https://random-name.trycloudflare.com
```

**프로덕션 서버 .env.production:**
```bash
OLLAMA_URL=https://random-name.trycloudflare.com
```

---

#### **Option B: ngrok (무료 플랜)**

**노트북에서:**
```bash
# ngrok 설치
snap install ngrok

# 터널 시작
ngrok http 11434
```

**출력:**
```
Forwarding: https://abc123.ngrok.io -> http://localhost:11434
```

**프로덕션 서버 .env.production:**
```bash
OLLAMA_URL=https://abc123.ngrok.io
```

---

#### **Option C: Tailscale (P2P VPN) ✅ 가장 안전**

**노트북 & 프로덕션 서버 모두:**
```bash
# Tailscale 설치
curl -fsSL https://tailscale.com/install.sh | sh

# 로그인 (두 기기 모두)
sudo tailscale up

# 노트북의 Tailscale IP 확인
tailscale ip -4
# 예: 100.64.1.2
```

**프로덕션 서버 .env.production:**
```bash
OLLAMA_URL=http://100.64.1.2:11434
```

**장점:**
- ✅ 암호화된 P2P 연결
- ✅ 포트포워딩 불필요
- ✅ 안정적 (IP 고정)

---

### **방법 3: VPN 사용 (이미 VPN 구축된 경우)**

노트북과 서버를 같은 VPN에 연결 후 VPN IP 사용

---

## 🧪 **연결 테스트**

### **프로덕션 서버에서 테스트:**
```bash
# Ollama 연결 테스트
curl http://YOUR_NOTEBOOK_IP:11434/api/tags

# 또는 터널 URL
curl https://your-tunnel-url.com/api/tags
```

### **Docker 컨테이너에서 테스트:**
```bash
# Docker 컨테이너 실행 후
docker exec -it codeinsight-backend curl http://YOUR_OLLAMA_URL/api/tags
```

---

## ⚙️ **.env.production 최종 설정**

```bash
# 방법 1: 직접 연결 (고정 공인 IP)
OLLAMA_URL=http://123.45.67.89:11434

# 방법 2A: Cloudflare Tunnel
OLLAMA_URL=https://random-name.trycloudflare.com

# 방법 2B: ngrok
OLLAMA_URL=https://abc123.ngrok.io

# 방법 2C: Tailscale (추천)
OLLAMA_URL=http://100.64.1.2:11434

# 방법 3: VPN
OLLAMA_URL=http://10.0.0.5:11434
```

---

## 🔒 **보안 권장사항**

### **1. API 토큰 (Ollama 0.2.0+)**
```bash
# 노트북에서 토큰 설정
export OLLAMA_API_KEY="your-secret-token"
ollama serve
```

**프로덕션 서버:**
```bash
# .env.production
OLLAMA_URL=http://your-ip:11434
OLLAMA_API_KEY=your-secret-token
```

**Backend 코드 수정 필요** (API 호출 시 헤더에 Authorization 추가)

### **2. IP 화이트리스트**
```bash
# 노트북 방화벽에서 프로덕션 서버 IP만 허용
sudo ufw allow from YOUR_SERVER_IP to any port 11434
sudo ufw deny 11434/tcp
```

---

## 📊 **추천 방법 비교**

| 방법 | 난이도 | 안정성 | 보안 | 비용 |
|------|--------|--------|------|------|
| **직접 연결** | ⭐⭐⭐ | ⭐⭐ | ⭐ | 무료 |
| **Cloudflare Tunnel** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 무료 |
| **ngrok** | ⭐ | ⭐⭐ | ⭐⭐ | 무료/유료 |
| **Tailscale** | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 무료 |
| **VPN** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 무료/유료 |

**추천:** **Tailscale** (무료, 안전, 쉬움)

---

## ✅ **체크리스트**

- [ ] 노트북에서 Ollama 외부 접근 허용 (`OLLAMA_HOST=0.0.0.0:11434`)
- [ ] 노트북 IP 주소 확인
- [ ] 방화벽 포트 11434 열기
- [ ] 모델 다운로드 (`ollama pull qwen2.5-coder:7b`)
- [ ] 터널 또는 포트포워딩 설정
- [ ] `.env.production`에 `OLLAMA_URL` 업데이트
- [ ] 프로덕션 서버에서 연결 테스트
